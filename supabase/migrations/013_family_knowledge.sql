-- =============================================================================
-- Migration 013: Family Hub + Knowledge Base
-- Sub-agent clusters: Catalyst-Family, Oracle-Knowledge
-- =============================================================================

-- ── Family Hub ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  avatar_color TEXT DEFAULT '#7c9bf5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_by_context TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  time_start TIME,
  time_end TIME,
  family_member_ids UUID[] DEFAULT '{}',
  location TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  context TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Knowledge Base ───────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  source TEXT DEFAULT 'insight' CHECK (source IN ('meeting', 'voice_memo', 'article', 'insight', 'lesson', 'discovery')),
  source_ref TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_family_members" ON family_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_family_tasks" ON family_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_family_events" ON family_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_family_notes" ON family_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_knowledge_entries" ON knowledge_entries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_family_tasks_status ON family_tasks(status);
CREATE INDEX IF NOT EXISTS idx_family_tasks_due ON family_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_family_events_date ON family_events(date);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_entries(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ── Seed Family Members ──────────────────────────────────────────────────────

INSERT INTO family_members (name, role, avatar_color) VALUES
  ('Zev', 'self', '#7c9bf5'),
  ('Family Member 2', 'spouse', '#c4b5e0'),
  ('Family Member 3', 'child', '#4ade80'),
  ('Family Member 4', 'child', '#f59e0b')
ON CONFLICT DO NOTHING;

-- ── Similarity search function ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source TEXT,
  source_ref TEXT,
  tags TEXT[],
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id, ke.title, ke.content, ke.source, ke.source_ref, ke.tags,
    1 - (ke.embedding <=> query_embedding) AS similarity,
    ke.created_at
  FROM knowledge_entries ke
  WHERE ke.embedding IS NOT NULL
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
