-- =============================================================================
-- Migration 011: Stalled pipeline detection
-- Adds 'stalled' status and email alerts for stuck discoveries
-- =============================================================================

-- Allow 'stalled' as a valid pipeline_status value
-- (No CHECK constraint exists on this column — it's a plain TEXT field)

-- Update advance_pipeline to detect and alert on stalled discoveries
CREATE OR REPLACE FUNCTION advance_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url text;
  _key text;
  _resend_key text;
  _rec record;
  _stalled record;
  _target_function text;
  _last_claude_call timestamptz;
BEGIN
  -- Read config
  SELECT value INTO _url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO _key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _url IS NULL OR _key IS NULL OR _key = 'PLACEHOLDER' THEN
    RAISE NOTICE 'advance_pipeline: skipping — config not set';
    RETURN;
  END IF;

  -- ── Stalled detection ────────────────────────────────────────────────
  -- Any discovery in a non-terminal state for 30+ minutes is stalled.
  -- Mark as stalled and send email alert via pg_net → Resend API.
  _resend_key := current_setting('app.resend_api_key', true);

  FOR _stalled IN
    SELECT id, name, company, pipeline_status
    FROM discoveries
    WHERE pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing')
      AND created_at < now() - interval '30 minutes'
      AND (
        -- No activity at all for 30 min
        (pipeline_started_at IS NULL AND pipeline_step_completed_at IS NULL
         AND created_at < now() - interval '30 minutes')
        OR
        -- Last activity was 30+ min ago
        (GREATEST(
          COALESCE(pipeline_started_at, '1970-01-01'),
          COALESCE(pipeline_step_completed_at, '1970-01-01')
        ) < now() - interval '30 minutes')
      )
      AND pipeline_status != 'stalled'
  LOOP
    -- Mark as stalled
    UPDATE discoveries
    SET pipeline_status = 'stalled',
        pipeline_error = 'Pipeline stalled: no progress for 30+ minutes (was ' || _stalled.pipeline_status || ')',
        pipeline_started_at = NULL
    WHERE id = _stalled.id;

    RAISE NOTICE 'advance_pipeline: marked discovery % as stalled', _stalled.id;

    -- Send alert email via pg_net → Resend
    IF _resend_key IS NOT NULL AND _resend_key != '' THEN
      PERFORM net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _resend_key
        ),
        body := jsonb_build_object(
          'from', 'TOLA Alerts <alerts@zev.ai>',
          'to', ARRAY['zev330@gmail.com'],
          'subject', 'Pipeline Stalled: ' || COALESCE(_stalled.company, _stalled.name, 'Unknown'),
          'html', '<h2>Pipeline Stalled Alert</h2>'
            || '<p><strong>Discovery ID:</strong> ' || _stalled.id || '</p>'
            || '<p><strong>Company:</strong> ' || COALESCE(_stalled.company, _stalled.name, 'N/A') || '</p>'
            || '<p><strong>Last Stage:</strong> ' || _stalled.pipeline_status || '</p>'
            || '<p><strong>Stalled Since:</strong> 30+ minutes with no progress</p>'
            || '<hr><p><a href="https://zev-ai-swart.vercel.app/admin/discoveries">View in Admin</a></p>'
        ),
        timeout_milliseconds := 10000
      );
    END IF;
  END LOOP;

  -- ── Auto-retry retryable failures ──────────────────────────────────
  UPDATE discoveries
  SET
    pipeline_status = CASE
      WHEN pipeline_error ILIKE '%Guardian%' THEN 'pending'
      WHEN pipeline_error ILIKE '%Visionary%' THEN 'researching'
      WHEN pipeline_error ILIKE '%Architect%' THEN 'scoping'
      WHEN pipeline_error ILIKE '%Oracle%' THEN 'synthesizing'
      ELSE pipeline_status
    END,
    pipeline_error = NULL,
    pipeline_started_at = NULL,
    pipeline_retry_count = COALESCE(pipeline_retry_count, 0) + 1
  WHERE pipeline_status = 'failed'
    AND pipeline_error IS NOT NULL
    AND (
      pipeline_error ILIKE '%429%'
      OR pipeline_error ILIKE '%529%'
      OR pipeline_error ILIKE '%rate_limit%'
      OR pipeline_error ILIKE '%overloaded%'
      OR pipeline_error ILIKE '%timed out%'
    )
    AND COALESCE(pipeline_retry_count, 0) < 5
    AND created_at > now() - interval '24 hours';

  -- ── Recover stuck in-flight steps ─────────────────────────────────
  UPDATE discoveries
  SET pipeline_started_at = NULL
  WHERE pipeline_started_at IS NOT NULL
    AND pipeline_started_at < now() - interval '5 minutes'
    AND pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing');

  -- ── Global cooldown check ──────────────────────────────────────────
  SELECT MAX(pipeline_step_completed_at) INTO _last_claude_call
  FROM discoveries
  WHERE pipeline_step_completed_at IS NOT NULL;

  -- ── Find one discovery ready for next step ─────────────────────────
  SELECT id, pipeline_status INTO _rec
  FROM discoveries
  WHERE pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing')
    AND pipeline_started_at IS NULL
    AND COALESCE(pipeline_retry_count, 0) < 5
    AND created_at > now() - interval '7 days'
    AND (
      pipeline_status = 'pending'
      OR _last_claude_call IS NULL
      OR _last_claude_call < now() - interval '60 seconds'
    )
  ORDER BY
    CASE pipeline_status
      WHEN 'synthesizing' THEN 1
      WHEN 'scoping' THEN 2
      WHEN 'researching' THEN 3
      WHEN 'pending' THEN 4
    END,
    created_at ASC
  LIMIT 1;

  IF _rec IS NULL THEN
    RETURN;
  END IF;

  -- Map status to function
  CASE _rec.pipeline_status
    WHEN 'pending' THEN _target_function := 'pipeline-guardian';
    WHEN 'researching' THEN _target_function := 'pipeline-visionary';
    WHEN 'scoping' THEN _target_function := 'pipeline-architect';
    WHEN 'synthesizing' THEN _target_function := 'pipeline-oracle';
    ELSE RETURN;
  END CASE;

  -- Mark as in-flight
  UPDATE discoveries
  SET pipeline_started_at = now()
  WHERE id = _rec.id;

  -- Dispatch via pg_net
  PERFORM net.http_post(
    url := _url || '/functions/v1/' || _target_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := jsonb_build_object('discovery_id', _rec.id::text),
    timeout_milliseconds := 300000
  );

  RAISE NOTICE 'advance_pipeline: dispatched % for discovery %', _target_function, _rec.id;
END;
$$;
