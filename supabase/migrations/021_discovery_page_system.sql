-- =============================================================================
-- Migration 021: Discovery Page System
--
-- 1. Add phone column to discoveries table (optional, for faster delivery)
-- 2. Add free_summary_content JSONB column (stores 5-section personalized copy)
-- 3. Extend advance_pipeline() to generate and store summary content (page-based)
--    instead of / in addition to sending email
-- =============================================================================

-- ── 1. Add phone column ───────────────────────────────────────────────────────
ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 2. Add free_summary_content column ───────────────────────────────────────
-- Stores the 5-section personalized copy as structured JSON:
-- { mirror, future, guitar_line, context, cta }
ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS free_summary_content JSONB;

-- ── 3. Add discovery_page_url column (convenience) ────────────────────────────
ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS discovery_page_url TEXT;

-- ── 4. Note ───────────────────────────────────────────────────────────────────
-- The pipeline-free-summary Edge Function is extended separately to:
-- 1. Generate structured JSON content (5 sections) via Claude
-- 2. Store it in free_summary_content
-- 3. Store the page URL in discovery_page_url
-- 4. Include the page link in the email
-- The /discovery/[id] page reads from free_summary_content and renders beautifully.
