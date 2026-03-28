-- =============================================================================
-- 026: Catalyst Nurture Sequences — prospect follow-up email system
-- Creates nurture_sequences + nurture_emails tables, auto-trigger on discovery
-- status changes, and pg_cron jobs for pipeline-catalyst / pipeline-catalyst-send
-- =============================================================================

-- ── nurture_sequences ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nurture_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id    UUID REFERENCES discoveries(id) ON DELETE SET NULL,
  prospect_email  TEXT NOT NULL,
  prospect_name   TEXT,
  sequence_type   TEXT NOT NULL CHECK (sequence_type IN ('post_discovery', 'post_form', 're_engagement')),
  current_step    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_send_at    TIMESTAMPTZ,
  last_sent_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurture_sequences_status_next
  ON nurture_sequences (status, next_send_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_nurture_sequences_discovery
  ON nurture_sequences (discovery_id);

-- ── nurture_emails ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nurture_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id     UUID NOT NULL REFERENCES nurture_sequences(id) ON DELETE CASCADE,
  step_number     INTEGER NOT NULL,
  subject         TEXT,
  body_html       TEXT,
  body_text       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'sent', 'rejected')),
  approved_at     TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurture_emails_sequence
  ON nurture_emails (sequence_id, step_number);

CREATE INDEX IF NOT EXISTS idx_nurture_emails_status
  ON nurture_emails (status)
  WHERE status IN ('pending_approval', 'approved');

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE nurture_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nurture_emails ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "service_role_nurture_sequences" ON nurture_sequences
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_nurture_emails" ON nurture_emails
  FOR ALL USING (auth.role() = 'service_role');

-- Anon: read-only for Realtime
CREATE POLICY "anon_read_nurture_sequences" ON nurture_sequences
  FOR SELECT USING (true);
CREATE POLICY "anon_read_nurture_emails" ON nurture_emails
  FOR SELECT USING (true);

-- ── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE nurture_sequences;
ALTER PUBLICATION supabase_realtime ADD TABLE nurture_emails;

-- ── Auto-create sequences on discovery events ────────────────────────────────

-- Function: create post_form sequence when a new discovery is inserted
CREATE OR REPLACE FUNCTION create_post_form_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if discovery has an email
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    INSERT INTO nurture_sequences (discovery_id, prospect_email, prospect_name, sequence_type, next_send_at, metadata)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.name, ''),
      'post_form',
      now(), -- immediate first email
      jsonb_build_object('company', COALESCE(NEW.company, ''), 'pipeline_track', COALESCE(NEW.pipeline_track, 'free'))
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_discovery_post_form
  AFTER INSERT ON discoveries
  FOR EACH ROW
  EXECUTE FUNCTION create_post_form_sequence();

-- Function: create post_discovery sequence when pipeline completes
CREATE OR REPLACE FUNCTION create_post_discovery_sequence()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pipeline_status = 'complete' AND OLD.pipeline_status IS DISTINCT FROM 'complete' THEN
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
      -- Don't duplicate: check if post_discovery already exists for this discovery
      IF NOT EXISTS (
        SELECT 1 FROM nurture_sequences
        WHERE discovery_id = NEW.id AND sequence_type = 'post_discovery'
      ) THEN
        INSERT INTO nurture_sequences (discovery_id, prospect_email, prospect_name, sequence_type, next_send_at, metadata)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.name, ''),
          'post_discovery',
          now() + INTERVAL '2 hours', -- give them time to see the report first
          jsonb_build_object(
            'company', COALESCE(NEW.company, ''),
            'pipeline_track', COALESCE(NEW.pipeline_track, 'free'),
            'report_url', 'https://askzev.ai/discovery/' || NEW.id::text
          )
        );
      END IF;

      -- Cancel the post_form sequence since discovery is complete
      UPDATE nurture_sequences
        SET status = 'completed', updated_at = now()
        WHERE discovery_id = NEW.id
          AND sequence_type = 'post_form'
          AND status = 'active';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_discovery_post_discovery
  AFTER UPDATE ON discoveries
  FOR EACH ROW
  EXECUTE FUNCTION create_post_discovery_sequence();

-- ── pg_cron jobs ─────────────────────────────────────────────────────────────

-- Pipeline-catalyst: generate draft emails every 30 min
SELECT cron.schedule(
  'pipeline-catalyst-nurture',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := (SELECT value FROM _pipeline_config WHERE key = 'supabase_url') || '/functions/v1/pipeline-catalyst',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT value FROM _pipeline_config WHERE key = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  )$$
);

-- Pipeline-catalyst-send: send approved emails every 15 min
SELECT cron.schedule(
  'pipeline-catalyst-send',
  '*/15 * * * *',
  $$SELECT net.http_post(
    url := (SELECT value FROM _pipeline_config WHERE key = 'supabase_url') || '/functions/v1/pipeline-catalyst-send',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT value FROM _pipeline_config WHERE key = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  )$$
);
