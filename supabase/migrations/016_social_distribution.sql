-- 016_social_distribution.sql
-- Autonomous social distribution: platform posting, branded images, cost optimization

-- Publishing columns on social_queue
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS published_url TEXT;
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS platform_post_id TEXT;
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS publish_error TEXT;
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS engagement JSONB DEFAULT '{}';
ALTER TABLE social_queue ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Credential columns on social_accounts
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS api_config JSONB DEFAULT '{}';

-- System configuration table
CREATE TABLE IF NOT EXISTS tola_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tola_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on tola_config" ON tola_config FOR ALL USING (auth.role() = 'service_role');

-- Seed default config
INSERT INTO tola_config (key, value) VALUES
  ('cost_level', '"medium"'),
  ('auto_publish', 'true'),
  ('image_generation', 'true'),
  ('posting_frequency', '"daily"'),
  ('heygen_enabled', 'false'),
  ('heygen_avatar_id', '""'),
  ('seo_mode', '"aeo"')
ON CONFLICT (key) DO NOTHING;

-- Content analytics for engagement tracking
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  social_queue_id UUID REFERENCES social_queue(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on content_analytics" ON content_analytics FOR ALL USING (auth.role() = 'service_role');

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_content_analytics_social_queue_id ON content_analytics(social_queue_id);
CREATE INDEX IF NOT EXISTS idx_social_queue_status ON social_queue(status);

-- pg_cron: distribute approved posts every 5 minutes
SELECT cron.schedule(
  'distribute-social-posts',
  '*/5 * * * *',
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
