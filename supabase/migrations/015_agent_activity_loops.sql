-- =============================================================================
-- Migration 015: Agent Activity Loops
-- Path activity table + pg_cron jobs for all 11 continuous agent loops
-- =============================================================================

-- Path activity tracking for Tree of Life visualization
CREATE TABLE IF NOT EXISTS tola_path_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  message_count INT DEFAULT 0,
  avg_latency_ms INT DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tola_path_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_path_activity" ON tola_path_activity FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_path_activity_period ON tola_path_activity(period_end DESC);

-- Dispatcher function: calls an Edge Function via pg_net
CREATE OR REPLACE FUNCTION dispatch_agent(agent_name TEXT) RETURNS void AS $$
DECLARE
  config_url TEXT;
  config_key TEXT;
BEGIN
  SELECT value INTO config_url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO config_key FROM _pipeline_config WHERE key = 'service_role_key';
  IF config_url IS NULL OR config_key IS NULL THEN RETURN; END IF;

  PERFORM net.http_post(
    url := config_url || '/functions/v1/' || agent_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || config_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule all agent loops
SELECT cron.schedule('agent-nexus-health',      '*/5 * * * *',   $$SELECT dispatch_agent('agent-nexus')$$);
SELECT cron.schedule('agent-guardian-bg',        '*/5 * * * *',   $$SELECT dispatch_agent('agent-guardian-bg')$$);
SELECT cron.schedule('agent-crown-metrics',      '*/15 * * * *',  $$SELECT dispatch_agent('agent-crown')$$);
SELECT cron.schedule('agent-prism-qa',           '*/30 * * * *',  $$SELECT dispatch_agent('agent-prism')$$);
SELECT cron.schedule('agent-catalyst-velocity',  '0 * * * *',     $$SELECT dispatch_agent('agent-catalyst-bg')$$);
SELECT cron.schedule('agent-gateway-seo',        '30 * * * *',    $$SELECT dispatch_agent('agent-gateway')$$);
SELECT cron.schedule('agent-foundation-maint',   '0 */2 * * *',   $$SELECT dispatch_agent('agent-foundation-bg')$$);
