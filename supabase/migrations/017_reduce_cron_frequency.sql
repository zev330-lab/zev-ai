-- 017_reduce_cron_frequency.sql
-- Scale back agent cron schedules to reduce API/compute costs
-- Uses safe DO blocks to handle missing job names gracefully

DO $$
DECLARE
  job_names TEXT[] := ARRAY[
    'agent-nexus-health', 'agent-guardian-bg', 'agent-crown-metrics',
    'agent-prism-qa', 'agent-catalyst-velocity', 'agent-gateway-seo',
    'agent-foundation-maint', 'distribute-social-posts',
    'advance-pipeline-cron', 'advance-content-pipeline-cron',
    -- Alternative names that might have been used
    'tola-agent-nexus', 'tola-agent-guardian-bg', 'tola-agent-crown',
    'tola-agent-prism', 'tola-agent-catalyst-bg', 'tola-agent-gateway',
    'tola-agent-foundation-bg'
  ];
  jn TEXT;
BEGIN
  FOREACH jn IN ARRAY job_names LOOP
    BEGIN
      PERFORM cron.unschedule(jn);
    EXCEPTION WHEN OTHERS THEN
      -- Job doesn't exist, skip
      NULL;
    END;
  END LOOP;
END $$;

-- Reschedule with reduced frequency
SELECT cron.schedule('agent-nexus-health',      '*/30 * * * *',  $$SELECT dispatch_agent('agent-nexus')$$);
SELECT cron.schedule('agent-guardian-bg',        '*/30 * * * *',  $$SELECT dispatch_agent('agent-guardian-bg')$$);
SELECT cron.schedule('agent-crown-metrics',      '0 */2 * * *',   $$SELECT dispatch_agent('agent-crown')$$);
SELECT cron.schedule('agent-prism-qa',           '0 */6 * * *',   $$SELECT dispatch_agent('agent-prism')$$);
SELECT cron.schedule('agent-catalyst-velocity',  '0 */4 * * *',   $$SELECT dispatch_agent('agent-catalyst-bg')$$);
SELECT cron.schedule('agent-gateway-seo',        '30 */6 * * *',  $$SELECT dispatch_agent('agent-gateway')$$);
SELECT cron.schedule('agent-foundation-maint',   '0 */12 * * *',  $$SELECT dispatch_agent('agent-foundation-bg')$$);

SELECT cron.schedule('distribute-social-posts',  '*/30 * * * *',
  $$SELECT net.http_post(
    url := (SELECT value::text FROM _pipeline_config WHERE key = 'supabase_url') || '/functions/v1/pipeline-distributor',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT value::text FROM _pipeline_config WHERE key = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  )$$
);

SELECT cron.schedule('advance-pipeline-cron',         '*/5 * * * *', $$SELECT advance_pipeline()$$);
SELECT cron.schedule('advance-content-pipeline-cron', '*/5 * * * *', $$SELECT advance_content_pipeline()$$);
