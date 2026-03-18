-- =============================================================================
-- Pipeline orchestration: pg_cron polling worker
--
-- Replaces the pg_net trigger (003) and retry cron (004) with a single
-- pg_cron job that polls every minute, dispatches the next pipeline step
-- via pg_net, enforces a 60-second global cooldown between Claude API calls,
-- and auto-retries on rate-limit (429/529) errors.
-- =============================================================================

-- ── 1. Remove old chaining mechanisms ────────────────────────────────────────

-- Drop the pg_net trigger from migration 003
DROP TRIGGER IF EXISTS on_pipeline_status_change ON discoveries;
DROP FUNCTION IF EXISTS trigger_pipeline_next();

-- Drop the retry cron job from migration 004
SELECT cron.unschedule('retry-failed-pipelines');
DROP FUNCTION IF EXISTS retry_failed_pipelines();

-- ── 2. Add columns for the polling worker ────────────────────────────────────

ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS pipeline_step_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_retry_count INT DEFAULT 0;

-- ── 3. Set the real service_role_key in _pipeline_config ─────────────────────
-- (This was 'PLACEHOLDER' in migration 003, which caused the trigger to no-op)

UPDATE _pipeline_config
SET value = current_setting('app.service_role_key', true)
WHERE key = 'service_role_key'
  AND current_setting('app.service_role_key', true) IS NOT NULL
  AND current_setting('app.service_role_key', true) != '';

-- ── 4. The polling worker function ───────────────────────────────────────────

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
  -- Reset failed discoveries with rate-limit errors back to their previous status
  -- so the worker will re-dispatch them on the next poll.
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
  -- If a step was started > 5 min ago and status hasn't advanced, clear the lock
  UPDATE discoveries
  SET pipeline_started_at = NULL
  WHERE pipeline_started_at IS NOT NULL
    AND pipeline_started_at < now() - interval '5 minutes'
    AND pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing');

  -- ── Global cooldown check ──────────────────────────────────────────────
  -- Find the most recent Claude API call completion across ALL discoveries
  SELECT MAX(pipeline_step_completed_at) INTO _last_claude_call
  FROM discoveries
  WHERE pipeline_step_completed_at IS NOT NULL;

  -- ── Find one discovery ready for next step ─────────────────────────────
  SELECT id, pipeline_status INTO _rec
  FROM discoveries
  WHERE pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing')
    -- Not already in-flight
    AND pipeline_started_at IS NULL
    -- Haven't exceeded retry limit
    AND COALESCE(pipeline_retry_count, 0) < 5
    -- Only recent discoveries
    AND created_at > now() - interval '7 days'
    -- Global cooldown: Guardian (pending) has no Claude call so skip cooldown,
    -- but Claude-calling steps must wait 60s since last Claude call globally
    AND (
      pipeline_status = 'pending'
      OR _last_claude_call IS NULL
      OR _last_claude_call < now() - interval '60 seconds'
    )
  ORDER BY
    -- Prioritize discoveries further along (finish what you started)
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

-- ── 5. Schedule the worker ───────────────────────────────────────────────────
-- Runs every minute. With 60s cooldown between Claude calls, this means
-- ~60-120s between pipeline steps (60s cooldown + up to 60s poll lag).

SELECT cron.schedule(
  'advance-pipeline',
  '* * * * *',
  $$SELECT advance_pipeline()$$
);
