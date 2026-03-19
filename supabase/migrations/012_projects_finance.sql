-- =============================================================================
-- Migration 012: Projects + Finance modules
-- Sub-agent clusters: Architect-Projects, Foundation-Finance
-- =============================================================================

-- ── Projects ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  description TEXT DEFAULT '',
  tola_node TEXT DEFAULT '',
  start_date DATE DEFAULT CURRENT_DATE,
  target_end_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'blocked')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT DEFAULT '',
  hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Finance ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  issued_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  revenue DECIMAL(10,2) DEFAULT 0,
  costs DECIMAL(10,2) DEFAULT 0,
  hours_billed DECIMAL(8,2) DEFAULT 0,
  pipeline_value DECIMAL(10,2) DEFAULT 0,
  new_clients INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_projects" ON projects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_milestones" ON project_milestones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_time_entries" ON project_time_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_invoices" ON invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_monthly_metrics" ON monthly_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON project_time_entries(date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_month ON monthly_metrics(month);

-- ── Seed Projects ────────────────────────────────────────────────────────────

INSERT INTO projects (name, client, status, description, tola_node, start_date) VALUES
  ('Steinmetz Real Estate', 'Steinmetz Team', 'active', '2,000+ page real estate platform with 18 AI agents', 'gateway', '2024-06-01'),
  ('Zev.AI Platform', 'Internal', 'active', 'AI consulting website + TOLA agent framework', 'nexus', '2025-01-01'),
  ('KabbalahQ.ai', 'Internal', 'active', 'AI-powered spiritual learning platform', 'oracle', '2025-02-01'),
  ('Lisa Rosen - Personal SaaS', 'Rosen Media Group', 'active', 'Discovery debrief & intake questionnaire', 'catalyst', '2025-03-01'),
  ('Blank Industries', 'Blank Industries', 'active', 'Business intelligence and unified data platform', 'architect', '2025-03-01'),
  ('Ayeka', 'Internal', 'paused', 'Spiritual guidance coaching platform', 'oracle', '2025-01-15')
ON CONFLICT DO NOTHING;
