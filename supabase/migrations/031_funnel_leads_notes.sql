-- =============================================================================
-- Add notes column to funnel_leads for pipeline management
-- Migration: 031_funnel_leads_notes.sql
-- =============================================================================

ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS notes TEXT;
