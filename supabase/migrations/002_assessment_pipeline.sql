-- =============================================================================
-- TOLA v3.0 — Assessment Pipeline Columns
-- Adds pipeline tracking and deliverable storage to discoveries table
-- =============================================================================

ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS research_brief JSONB;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS assessment_doc TEXT;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS meeting_prep_doc TEXT;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'pending';
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS pipeline_error TEXT;
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS pipeline_completed_at TIMESTAMPTZ;

-- Allow tier field updates on tola_agents
-- (tier was not in the original allowed update set)
COMMENT ON COLUMN discoveries.pipeline_status IS 'pending | researching | scoping | synthesizing | complete | failed';
COMMENT ON COLUMN discoveries.research_brief IS 'Visionary agent structured research output (JSON)';
COMMENT ON COLUMN discoveries.assessment_doc IS 'Architect agent scope assessment (markdown)';
COMMENT ON COLUMN discoveries.meeting_prep_doc IS 'Oracle agent meeting prep synthesis (markdown)';
