-- =============================================================================
-- Fix pg_net timeout in advance_pipeline()
--
-- The default net.http_post timeout is 2000ms, but Claude API calls take
-- 30-180 seconds. This caused pg_net to close the connection before the
-- Edge Function could respond, potentially killing the function.
-- =============================================================================

CREATE OR REPLACE FUNCTION advance_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url text;
  _key text;
  _rec record;
  _target_function text;
  _last_claude_call timestamptz;
BEGIN
  -- Read config
  SELECT value INTO _url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO _key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _url IS NULL OR _key IS NULL OR _key = 'PLACEHOLDER' THEN
    RAISE NOTICE 'advance_pipeline: skipping — config not set (url=%, key=%)',
      _url IS NOT NULL, _key IS NOT NULL AND _key != 'PLACEHOLDER';
    RETURN;
  END IF;

  -- ── Auto-retry retryable failures ──────────────────────────────────────
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

  -- ── Also recover stuck in-flight steps ─────────────────────────────────
  UPDATE discoveries
  SET pipeline_started_at = NULL
  WHERE pipeline_started_at IS NOT NULL
    AND pipeline_started_at < now() - interval '5 minutes'
    AND pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing');

  -- ── Global cooldown check ──────────────────────────────────────────────
  SELECT MAX(pipeline_step_completed_at) INTO _last_claude_call
  FROM discoveries
  WHERE pipeline_step_completed_at IS NOT NULL;

  -- ── Find one discovery ready for next step ─────────────────────────────
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

  -- Mark as in-flight (prevents double-dispatch)
  UPDATE discoveries
  SET pipeline_started_at = now()
  WHERE id = _rec.id;

  -- Dispatch via pg_net (async HTTP POST)
  -- timeout_milliseconds must be long enough for Claude API calls (up to 3 min)
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
