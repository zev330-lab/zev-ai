-- =============================================================================
-- Pipeline chaining via pg_net
--
-- When an Edge Function updates pipeline_status on a discovery, this trigger
-- fires an async HTTP POST to the next pipeline function. pg_net runs the
-- request in a background worker — no wall-clock limits, no fire-and-forget
-- race conditions.
-- =============================================================================

-- Enable pg_net (Supabase includes it, may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store the service role key in a config table for the trigger to read.
-- This avoids hardcoding secrets in function bodies.
CREATE TABLE IF NOT EXISTS _pipeline_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- These will be set via: supabase db push, then manual INSERT or UPDATE
-- The trigger reads them at runtime.
INSERT INTO _pipeline_config (key, value) VALUES
  ('supabase_url', 'https://ctrzkvdqkcqgejaedkbr.supabase.co'),
  ('service_role_key', 'PLACEHOLDER')
ON CONFLICT (key) DO NOTHING;

-- RLS: only service_role can read this table
ALTER TABLE _pipeline_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role (bypasses RLS) can access

-- The trigger function
CREATE OR REPLACE FUNCTION trigger_pipeline_next()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url text;
  _key text;
  _next_function text;
BEGIN
  -- Only fire when pipeline_status actually changed
  IF OLD.pipeline_status IS NOT DISTINCT FROM NEW.pipeline_status THEN
    RETURN NEW;
  END IF;

  -- Determine next function based on new status
  CASE NEW.pipeline_status
    WHEN 'researching' THEN _next_function := 'pipeline-visionary';
    WHEN 'scoping' THEN _next_function := 'pipeline-architect';
    WHEN 'synthesizing' THEN _next_function := 'pipeline-oracle';
    ELSE RETURN NEW; -- no next step for 'complete', 'failed', 'pending'
  END CASE;

  -- Read config
  SELECT value INTO _url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO _key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _url IS NULL OR _key IS NULL OR _key = 'PLACEHOLDER' THEN
    RAISE WARNING 'Pipeline trigger: missing config (url=%, key=%)',
      _url IS NOT NULL, _key IS NOT NULL AND _key != 'PLACEHOLDER';
    RETURN NEW;
  END IF;

  -- Async HTTP POST via pg_net
  PERFORM net.http_post(
    url := _url || '/functions/v1/' || _next_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := jsonb_build_object('discovery_id', NEW.id::text)
  );

  RETURN NEW;
END;
$$;

-- Create the trigger on pipeline_status changes
DROP TRIGGER IF EXISTS on_pipeline_status_change ON discoveries;
CREATE TRIGGER on_pipeline_status_change
  AFTER UPDATE OF pipeline_status ON discoveries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pipeline_next();
