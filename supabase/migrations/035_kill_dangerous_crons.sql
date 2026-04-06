-- =============================================================================
-- Migration 035: Kill Dangerous Cron→Claude API Jobs
--
-- CRITICAL: These pg_cron jobs call dispatch_agent() which triggers Edge
-- Functions that call the Claude API. This previously cost $700+ in 3 days.
-- See CLAUDE.md Rule #1: "Never create cron jobs that call Claude API."
--
-- SAFE crons (SQL-only) are NOT touched:
--   - advance-pipeline-cron
--   - advance-content-pipeline-cron
--   - auto-flag-overdue-invoices
--   - auto-flag-stale-contacts
--   - auto-recover-stuck-pipelines
--   - content-cadence-watchdog
-- =============================================================================

DO $$
DECLARE
  job_names text[] := ARRAY[
    -- Agent crons that call dispatch_agent() → Edge Functions → Claude API
    'agent-nexus-health',
    'agent-guardian-bg',
    'agent-crown-metrics',
    'agent-prism-qa',
    'agent-catalyst-velocity',
    'agent-gateway-seo',
    'agent-foundation-maint',
    -- Edge Function callers (also trigger Claude API)
    'distribute-social-posts',
    'abel-listener',
    'nurture-check-sequences',
    'nurture-dispatch-emails'
  ];
  j text;
BEGIN
  FOREACH j IN ARRAY job_names LOOP
    BEGIN
      PERFORM cron.unschedule(j);
      RAISE NOTICE 'Unscheduled cron job: %', j;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Job % not found (already removed or never existed), skipping', j;
    END;
  END LOOP;
END $$;
