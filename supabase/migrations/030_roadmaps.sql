-- =============================================================================
-- Roadmaps — $499 AI Implementation Roadmap Product
-- Migration: 030_roadmaps.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.roadmaps (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID        NOT NULL REFERENCES public.funnel_leads(id) ON DELETE CASCADE,
  slug              UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  content_json      JSONB       NOT NULL DEFAULT '{}',
  stripe_payment_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS roadmaps_slug_idx ON public.roadmaps (slug);
CREATE INDEX IF NOT EXISTS roadmaps_lead_id_idx ON public.roadmaps (lead_id);

-- RLS: roadmap pages are public (accessed by unique slug, no auth)
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roadmaps are publicly readable by slug"
  ON public.roadmaps
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert/update roadmaps"
  ON public.roadmaps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add stripe_payment_id column to funnel_leads if not exists
ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;
