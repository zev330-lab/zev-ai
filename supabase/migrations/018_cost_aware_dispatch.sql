-- 018_cost_aware_dispatch.sql
-- Make dispatch_agent() respect cost_level from tola_config
-- Low: aggressive throttling, Medium: current schedule, High: run everything

CREATE OR REPLACE FUNCTION dispatch_agent(agent_name TEXT) RETURNS void AS $$
DECLARE
  config_url TEXT;
  config_key TEXT;
  cost_level TEXT := 'medium';
  current_hour INTEGER := EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC');
  current_dow INTEGER := EXTRACT(DOW FROM now() AT TIME ZONE 'UTC');
BEGIN
  SELECT value INTO config_url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO config_key FROM _pipeline_config WHERE key = 'service_role_key';
  IF config_url IS NULL OR config_key IS NULL THEN RETURN; END IF;

  -- Read cost level
  BEGIN
    SELECT REPLACE(value::text, '"', '') INTO cost_level FROM tola_config WHERE key = 'cost_level';
  EXCEPTION WHEN OTHERS THEN
    cost_level := 'medium';
  END;

  -- LOW COST MODE: aggressive throttling
  IF cost_level = 'low' THEN
    -- Nexus + Guardian: only run every 2h (skip if not on the hour)
    IF agent_name IN ('agent-nexus', 'agent-guardian-bg') AND current_hour % 2 != 0 THEN
      RETURN;
    END IF;
    -- Crown: twice daily (midnight and noon UTC)
    IF agent_name = 'agent-crown' AND current_hour NOT IN (0, 12) THEN
      RETURN;
    END IF;
    -- Prism, Catalyst, Gateway, Foundation: once daily at midnight
    IF agent_name IN ('agent-prism', 'agent-catalyst-bg', 'agent-gateway', 'agent-foundation-bg') AND current_hour != 0 THEN
      RETURN;
    END IF;
  END IF;

  -- HIGH COST MODE: no filtering, always dispatch
  -- MEDIUM COST MODE: no filtering, cron schedule handles frequency

  PERFORM net.http_post(
    url := config_url || '/functions/v1/' || agent_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || config_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
