-- =============================================================================
-- TOLA v3.0 Runtime Agent Tables
-- Migration: 001_tola_runtime
-- Safe to run multiple times (idempotent via IF NOT EXISTS / OR REPLACE)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tola_agents (
  id              TEXT        PRIMARY KEY,
  node_name       TEXT        NOT NULL,
  geometry_engine TEXT        NOT NULL,
  display_name    TEXT        NOT NULL,
  description     TEXT,
  status          TEXT        DEFAULT 'healthy'
                              CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
  tier            INTEGER     DEFAULT 1
                              CHECK (tier IN (1, 2, 3)),
  last_heartbeat  TIMESTAMPTZ,
  config          JSONB       DEFAULT '{}',
  is_active       BOOLEAN     DEFAULT true,
  kill_switch     BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tola_agent_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         TEXT        REFERENCES tola_agents(id),
  action           TEXT        NOT NULL,
  geometry_pattern TEXT,
  input            JSONB,
  output           JSONB,
  confidence       FLOAT,
  tier_used        INTEGER,
  tokens_used      INTEGER,
  latency_ms       INTEGER,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tola_agent_metrics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT        REFERENCES tola_agents(id),
  metric          TEXT        NOT NULL,
  value           FLOAT       NOT NULL,
  geometry_state  JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tola_agent_log_agent_id
  ON tola_agent_log(agent_id);

CREATE INDEX IF NOT EXISTS idx_tola_agent_log_created
  ON tola_agent_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tola_agent_metrics_agent_id
  ON tola_agent_metrics(agent_id);

CREATE INDEX IF NOT EXISTS idx_tola_agent_metrics_created
  ON tola_agent_metrics(created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger (auto-stamps tola_agents.updated_at on every UPDATE)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION tola_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger so this migration is idempotent
DROP TRIGGER IF EXISTS tola_agents_set_updated_at ON tola_agents;

CREATE TRIGGER tola_agents_set_updated_at
  BEFORE UPDATE ON tola_agents
  FOR EACH ROW
  EXECUTE FUNCTION tola_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE tola_agents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tola_agent_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tola_agent_metrics ENABLE ROW LEVEL SECURITY;

-- tola_agents — service_role: full access
DROP POLICY IF EXISTS "tola_agents_service_all"    ON tola_agents;
CREATE POLICY "tola_agents_service_all"
  ON tola_agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- tola_agents — anon: SELECT only (public /tola page status display)
DROP POLICY IF EXISTS "tola_agents_anon_select"    ON tola_agents;
CREATE POLICY "tola_agents_anon_select"
  ON tola_agents
  FOR SELECT
  TO anon
  USING (true);

-- tola_agent_log — service_role: full access (no anon access)
DROP POLICY IF EXISTS "tola_agent_log_service_all" ON tola_agent_log;
CREATE POLICY "tola_agent_log_service_all"
  ON tola_agent_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- tola_agent_metrics — service_role: full access (no anon access)
DROP POLICY IF EXISTS "tola_agent_metrics_service_all" ON tola_agent_metrics;
CREATE POLICY "tola_agent_metrics_service_all"
  ON tola_agent_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Seed data — 11 TOLA agents
-- ON CONFLICT DO NOTHING makes re-runs safe
-- ---------------------------------------------------------------------------

INSERT INTO tola_agents (id, node_name, geometry_engine, display_name, description, tier) VALUES
  ('crown',      'Crown',      'seed_of_life',   'Crown',      'Human decision authority — admin dashboard and approval queue',                      3),
  ('visionary',  'Visionary',  'metatrons_cube', 'Visionary',  'Multi-source research engine — 13-dimension prospect analysis',                      1),
  ('architect',  'Architect',  'sri_yantra',     'Architect',  'Constraint-based planning — pattern analysis and engagement scoping',                 1),
  ('oracle',     'Oracle',     'torus',          'Oracle',     'Iterative synthesis — knowledge base and consulting methodology',                     1),
  ('catalyst',   'Catalyst',   'lotus',          'Catalyst',   'Progressive engagement — nurture sequences and relationship building',                1),
  ('guardian',   'Guardian',   'yin_yang',       'Guardian',   'Adversarial quality review — input validation and brand enforcement',                 1),
  ('nexus',      'Nexus',      'flower_of_life', 'Nexus',      'Intelligent routing — inquiry classification and workflow orchestration',             1),
  ('sentinel',   'Sentinel',   'merkabah',       'Sentinel',   'Triangulated health monitoring — API, database, and application verification',        1),
  ('prism',      'Prism',      'vortex',         'Prism',      'Recursive quality refinement — content scoring and spiral testing',                   1),
  ('foundation', 'Foundation', 'seed_of_life',   'Foundation', 'Infrastructure maintenance — database health, log cleanup, metric aggregation',       1),
  ('gateway',    'Gateway',    'flower_of_life', 'Gateway',    'The application itself — user interface and interconnected page delivery',            1)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Supabase Realtime
-- tola_agents    — clients subscribe to agent status changes for the /tola page
-- tola_agent_log — clients subscribe to live activity feed
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE tola_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tola_agent_log;
