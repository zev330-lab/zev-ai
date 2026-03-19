-- =============================================================================
-- Migration 010: Social Media Agent
-- social_accounts table, enhanced social_queue columns, daily cron
-- =============================================================================

-- social_accounts: connected social media platforms
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'tiktok', 'youtube', 'threads')),
  handle TEXT DEFAULT '',
  profile_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_social_accounts" ON social_accounts FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Seed placeholder accounts
INSERT INTO social_accounts (platform, handle, profile_url, is_active) VALUES
  ('linkedin', '', '', false),
  ('twitter', '', '', false),
  ('instagram', '', '', false),
  ('tiktok', '', '', false),
  ('youtube', '', '', false),
  ('threads', '', '', false)
ON CONFLICT (platform) DO NOTHING;

-- Add content_pillar and review_notes to social_queue
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS content_pillar TEXT DEFAULT '';
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT '';

-- Daily social agent function (Mon-Fri 7am EST = noon UTC)
CREATE OR REPLACE FUNCTION trigger_social_agent() RETURNS void AS $$
DECLARE
  config_url TEXT;
  config_key TEXT;
BEGIN
  SELECT value INTO config_url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO config_key FROM _pipeline_config WHERE key = 'service_role_key';

  IF config_url IS NULL OR config_key IS NULL THEN
    RAISE LOG '[social-agent] Missing _pipeline_config';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := config_url || '/functions/v1/pipeline-social-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || config_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );

  RAISE LOG '[social-agent] Triggered daily social generation';
END;
$$ LANGUAGE plpgsql;

-- Mon-Fri at noon UTC (7am EST)
SELECT cron.schedule('daily-social-agent', '0 12 * * 1-5', 'SELECT trigger_social_agent()');
