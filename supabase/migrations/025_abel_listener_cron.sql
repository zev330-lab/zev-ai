-- ============================================================================
-- 025: pg_cron job to keep Abel Realtime listener alive
-- Invokes agent-abel-listener Edge Function every 2 minutes
-- ============================================================================

SELECT cron.schedule(
  'abel-listener-poll',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM _pipeline_config WHERE key = 'supabase_url') || '/functions/v1/agent-abel-listener',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT value FROM _pipeline_config WHERE key = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) FROM _pipeline_config LIMIT 1;
  $$
);
