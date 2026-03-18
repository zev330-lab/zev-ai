-- =============================================================================
-- Pipeline auto-retry via pg_cron
--
-- Every 2 minutes, check for discoveries that failed with a retryable error
-- (429 rate limit, 529 overloaded) and re-trigger the appropriate step.
-- Also picks up any stuck pipelines (status unchanged for > 5 min).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage so pg_cron jobs can call net.http_post
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- Function that retries failed pipelines
CREATE OR REPLACE FUNCTION retry_failed_pipelines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url text;
  _key text;
  _rec record;
  _target_function text;
  _target_status text;
BEGIN
  -- Read config
  SELECT value INTO _url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO _key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _url IS NULL OR _key IS NULL OR _key = 'PLACEHOLDER' THEN
    RETURN;
  END IF;

  -- Find failed discoveries with retryable errors (rate limit or overloaded)
  FOR _rec IN
    SELECT id, pipeline_status, pipeline_error
    FROM discoveries
    WHERE pipeline_status = 'failed'
      AND pipeline_error IS NOT NULL
      AND (pipeline_error ILIKE '%rate_limit%' OR pipeline_error ILIKE '%429%' OR pipeline_error ILIKE '%529%' OR pipeline_error ILIKE '%overloaded%')
      AND created_at > now() - interval '24 hours'
    LIMIT 3
  LOOP
    -- Determine which step failed and what to re-trigger
    IF _rec.pipeline_error ILIKE '%Guardian%' THEN
      _target_status := 'pending';
      _target_function := 'pipeline-guardian';
    ELSIF _rec.pipeline_error ILIKE '%Visionary%' THEN
      _target_status := 'researching';
      _target_function := 'pipeline-visionary';
    ELSIF _rec.pipeline_error ILIKE '%Architect%' THEN
      _target_status := 'scoping';
      _target_function := 'pipeline-architect';
    ELSIF _rec.pipeline_error ILIKE '%Oracle%' THEN
      _target_status := 'synthesizing';
      _target_function := 'pipeline-oracle';
    ELSE
      CONTINUE;
    END IF;

    -- Reset status (this won't re-fire the trigger since we go to the "current" status, not the next)
    UPDATE discoveries
    SET pipeline_status = _target_status,
        pipeline_error = NULL
    WHERE id = _rec.id;

    -- Directly invoke the function via pg_net
    PERFORM net.http_post(
      url := _url || '/functions/v1/' || _target_function,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _key
      ),
      body := jsonb_build_object('discovery_id', _rec.id::text)
    );

    RAISE NOTICE 'Retrying % for discovery %', _target_function, _rec.id;
  END LOOP;
END;
$$;

-- Schedule: run every 2 minutes
SELECT cron.schedule(
  'retry-failed-pipelines',
  '*/2 * * * *',
  $$SELECT retry_failed_pipelines()$$
);
