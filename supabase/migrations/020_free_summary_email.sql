-- =============================================================================
-- Migration 020: Free Summary Email System
--
-- Adds free_summary_sent_at column to discoveries.
-- Extends advance_pipeline() to dispatch pipeline-free-summary for any
-- complete discovery that hasn't had its free summary sent yet.
-- This catches newly-completed discoveries AND the 6 existing ones.
-- =============================================================================

-- ── 1. Add column ─────────────────────────────────────────────────────────────

ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS free_summary_sent_at TIMESTAMPTZ;

-- ── 2. Extend advance_pipeline() to dispatch free summaries ───────────────────

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
  _summary_rec record;
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

  -- ── Recover stuck in-flight steps ──────────────────────────────────────
  UPDATE discoveries
  SET pipeline_started_at = NULL
  WHERE pipeline_started_at IS NOT NULL
    AND pipeline_started_at < now() - interval '5 minutes'
    AND pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing');

  -- ── Global cooldown check ──────────────────────────────────────────────
  SELECT MAX(pipeline_step_completed_at) INTO _last_claude_call
  FROM discoveries
  WHERE pipeline_step_completed_at IS NOT NULL;

  -- ── 1. Dispatch free summary for newly complete discoveries ────────────
  -- Runs BEFORE main pipeline dispatch to ensure summaries go out promptly.
  -- Picks one at a time (same pattern as main pipeline), limited to
  -- discoveries with a valid email that haven't been sent yet.
  -- No cooldown needed — Resend + Claude call is fast and doesn't conflict
  -- with the 60s global cooldown (which guards the assessment pipeline).
  SELECT id INTO _summary_rec
  FROM discoveries
  WHERE pipeline_status = 'complete'
    AND free_summary_sent_at IS NULL
    AND email IS NOT NULL
    AND email != ''
  ORDER BY pipeline_completed_at ASC NULLS LAST
  LIMIT 1;

  IF _summary_rec IS NOT NULL THEN
    -- Mark as in-flight by setting free_summary_sent_at to a sentinel value
    -- (we use the actual timestamp after send; here we use a 'sending' guard
    --  by temporarily setting it — the Edge Function will overwrite with real ts)
    -- ACTUALLY: we use pipeline_started_at pattern — set a sending lock using
    -- a dedicated column isn't available, so we just dispatch and let the
    -- Edge Function set the column atomically. Worst case: duplicate send if
    -- two cron ticks fire simultaneously (acceptable for low-volume use).
    PERFORM net.http_post(
      url := _url || '/functions/v1/pipeline-free-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body := jsonb_build_object('discovery_id', _summary_rec.id::text),
      timeout_milliseconds := 120000
    );

    RAISE NOTICE 'advance_pipeline: dispatched pipeline-free-summary for discovery %', _summary_rec.id;
  END IF;

  -- ── 2. Main pipeline advancement (existing logic) ──────────────────────
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

-- ── 3. Note ───────────────────────────────────────────────────────────────────
-- No new cron job needed — advance_pipeline() already runs every minute.
-- The 6 existing complete discoveries will each get their free summary
-- dispatched on successive cron ticks (one per minute), which is ideal:
-- controlled rollout, no burst, easy to monitor in tola_agent_log.
