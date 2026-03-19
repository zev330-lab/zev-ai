-- =============================================================================
-- Migration 009: Blog Content Engine
-- blog_posts table, social_queue table, content pipeline cron
-- =============================================================================

-- blog_posts: full blog post lifecycle from generation through publishing
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  excerpt TEXT DEFAULT '',
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'topic_research', 'outlining', 'drafting', 'reviewing',
    'social_gen', 'review', 'published', 'archived'
  )),
  author TEXT DEFAULT 'Zev Steinmetz',
  reading_time_min INT DEFAULT 0,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  schema_data JSONB DEFAULT NULL,
  social_posts JSONB DEFAULT NULL,
  generation_data JSONB DEFAULT NULL,
  generation_started_at TIMESTAMPTZ DEFAULT NULL,
  pipeline_step_completed_at TIMESTAMPTZ DEFAULT NULL,
  generation_error TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NULL
);

-- social_queue: social media posts pending approval/scheduling
CREATE TABLE IF NOT EXISTS social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'instagram', 'tiktok', 'threads')),
  content TEXT NOT NULL DEFAULT '',
  image_prompt TEXT DEFAULT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'posted')),
  scheduled_for TIMESTAMPTZ DEFAULT NULL,
  posted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: service role has full access (used by Edge Functions and admin API)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_blog_posts" ON blog_posts FOR ALL
  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_social_queue" ON social_queue FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Public read access for published posts (anon key)
CREATE POLICY "public_read_published_posts" ON blog_posts FOR SELECT
  TO anon USING (status = 'published');

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_queue_status ON social_queue(status);
CREATE INDEX IF NOT EXISTS idx_social_queue_platform ON social_queue(platform);

-- Content pipeline advancement function (mirrors advance_pipeline for discoveries)
CREATE OR REPLACE FUNCTION advance_content_pipeline() RETURNS void AS $$
DECLARE
  post RECORD;
  config_url TEXT;
  config_key TEXT;
BEGIN
  SELECT value INTO config_url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO config_key FROM _pipeline_config WHERE key = 'service_role_key';

  IF config_url IS NULL OR config_key IS NULL THEN
    RAISE LOG '[content-pipeline] Missing _pipeline_config';
    RETURN;
  END IF;

  -- Find one post that needs advancing
  FOR post IN
    SELECT id, status, generation_started_at, pipeline_step_completed_at
    FROM blog_posts
    WHERE status IN ('topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen')
      AND (generation_started_at IS NULL
           OR generation_started_at < NOW() - INTERVAL '5 minutes')
      AND (pipeline_step_completed_at IS NULL
           OR pipeline_step_completed_at < NOW() - INTERVAL '60 seconds')
    ORDER BY created_at ASC
    LIMIT 1
  LOOP
    -- Guard: mark in-flight
    UPDATE blog_posts SET generation_started_at = NOW() WHERE id = post.id;

    -- Dispatch via pg_net
    PERFORM net.http_post(
      url := config_url || '/functions/v1/pipeline-content-engine',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || config_key
      ),
      body := jsonb_build_object('blog_post_id', post.id),
      timeout_milliseconds := 300000
    );

    RAISE LOG '[content-pipeline] Dispatched % for post %', post.status, post.id;
    RETURN; -- One at a time to respect rate limits
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Weekly content generation: create a new post stub every Sunday 8am EST (1pm UTC)
CREATE OR REPLACE FUNCTION create_weekly_blog_post() RETURNS void AS $$
BEGIN
  INSERT INTO blog_posts (slug, status)
  VALUES ('auto-' || to_char(NOW(), 'YYYY-MM-DD'), 'topic_research');
  RAISE LOG '[content-pipeline] Created weekly blog post';
END;
$$ LANGUAGE plpgsql;

-- Schedule cron jobs
SELECT cron.schedule('advance-content-pipeline', '* * * * *', 'SELECT advance_content_pipeline()');
SELECT cron.schedule('weekly-blog-generation', '0 13 * * 0', 'SELECT create_weekly_blog_post()');
