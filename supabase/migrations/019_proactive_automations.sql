-- ============================================================================
-- 019: Proactive Automations
-- Auto-flag overdue invoices, stale contacts, stuck pipelines
-- ============================================================================

-- 1. Auto-flag overdue invoices (daily at 9am ET = 2pm UTC)
-- Updates invoice status from 'sent' to 'overdue' when due_date has passed
CREATE OR REPLACE FUNCTION auto_flag_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;

  -- Log the action
  INSERT INTO tola_agent_log (agent_id, action, output)
  SELECT 'foundation', 'auto-flag-overdue-invoices',
    jsonb_build_object(
      'flagged_count', (
        SELECT count(*) FROM invoices
        WHERE status = 'overdue'
          AND due_date = CURRENT_DATE - INTERVAL '1 day'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- 2. Auto-flag stale contacts (daily)
-- Flags contacts that have been 'new' for 3+ days with no notes
CREATE OR REPLACE FUNCTION auto_flag_stale_contacts()
RETURNS void AS $$
DECLARE
  stale_count integer;
BEGIN
  -- Count stale contacts for logging
  SELECT count(*) INTO stale_count
  FROM contacts
  WHERE status = 'new'
    AND created_at < NOW() - INTERVAL '3 days'
    AND (notes IS NULL OR notes = '');

  -- Log stale contacts as an alert
  IF stale_count > 0 THEN
    INSERT INTO tola_agent_log (agent_id, action, output)
    VALUES ('catalyst', 'stale-contact-alert',
      jsonb_build_object('stale_count', stale_count, 'threshold_days', 3)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Auto-recover stuck pipelines (every 5 min)
-- Resets discoveries stuck in processing states for 30+ minutes
CREATE OR REPLACE FUNCTION auto_recover_stuck_pipelines()
RETURNS void AS $$
DECLARE
  stuck_count integer;
BEGIN
  -- Find and reset stuck discoveries
  WITH stuck AS (
    UPDATE discoveries
    SET pipeline_status = 'pending',
        pipeline_error = 'Auto-recovered: stuck for 30+ minutes',
        pipeline_retry_count = COALESCE(pipeline_retry_count, 0) + 1,
        pipeline_started_at = NULL
    WHERE pipeline_status IN ('researching', 'scoping', 'synthesizing')
      AND pipeline_started_at IS NOT NULL
      AND pipeline_started_at < NOW() - INTERVAL '30 minutes'
      AND COALESCE(pipeline_retry_count, 0) < 5
    RETURNING id
  )
  SELECT count(*) INTO stuck_count FROM stuck;

  IF stuck_count > 0 THEN
    INSERT INTO tola_agent_log (agent_id, action, output)
    VALUES ('guardian', 'auto-recover-stuck-pipeline',
      jsonb_build_object('recovered_count', stuck_count)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Content cadence watchdog (daily at 10am ET = 3pm UTC)
-- Logs alert if no blog post published in 7+ days
CREATE OR REPLACE FUNCTION content_cadence_watchdog()
RETURNS void AS $$
DECLARE
  days_since_publish integer;
  last_published timestamptz;
BEGIN
  SELECT MAX(published_at) INTO last_published
  FROM blog_posts
  WHERE status = 'published';

  IF last_published IS NULL THEN
    days_since_publish := 999;
  ELSE
    days_since_publish := EXTRACT(DAY FROM NOW() - last_published);
  END IF;

  IF days_since_publish >= 7 THEN
    INSERT INTO tola_agent_log (agent_id, action, output)
    VALUES ('catalyst', 'content-cadence-alert',
      jsonb_build_object(
        'days_since_publish', days_since_publish,
        'last_published', last_published,
        'message', 'No blog post published in 7+ days. Consider triggering content pipeline.'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule the automations via pg_cron
-- Note: These require pg_cron extension to be enabled

-- Overdue invoices: daily at 2pm UTC (9am ET)
SELECT cron.schedule('auto-flag-overdue-invoices', '0 14 * * *', 'SELECT auto_flag_overdue_invoices()');

-- Stale contacts: daily at 2:30pm UTC
SELECT cron.schedule('auto-flag-stale-contacts', '30 14 * * *', 'SELECT auto_flag_stale_contacts()');

-- Stuck pipeline recovery: every 5 minutes
SELECT cron.schedule('auto-recover-stuck-pipelines', '*/5 * * * *', 'SELECT auto_recover_stuck_pipelines()');

-- Content cadence watchdog: daily at 3pm UTC (10am ET)
SELECT cron.schedule('content-cadence-watchdog', '0 15 * * *', 'SELECT content_cadence_watchdog()');
