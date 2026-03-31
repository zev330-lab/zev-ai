-- =============================================================================
-- Funnel Leads — Dynamic Discovery Form (Voss Tactical Empathy)
-- Migration: 028_funnel_leads.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  path                TEXT        CHECK (path IN ('app', 'solution', 'unsure')),
  audience            TEXT        CHECK (audience IN ('personal', 'business', 'both')),
  pain_text           TEXT,
  acknowledgment_text TEXT,
  hope_text           TEXT,
  details_json        JSONB       DEFAULT '{}',
  audio_url           TEXT,
  name                TEXT        NOT NULL,
  email               TEXT        NOT NULL,
  phone               TEXT,
  company             TEXT,
  referral_source     TEXT,
  deal_stage          TEXT        NOT NULL DEFAULT 'new_lead',
  research_json       JSONB,
  email_sent_at       TIMESTAMPTZ,
  roadmap_purchased_at TIMESTAMPTZ,
  roadmap_url         TEXT,
  discovery_id        UUID        REFERENCES public.discoveries(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS funnel_leads_email_idx ON public.funnel_leads (email);
CREATE INDEX IF NOT EXISTS funnel_leads_deal_stage_idx ON public.funnel_leads (deal_stage);

-- Storage bucket for audio recordings (run in Supabase dashboard if needed):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('discovery-audio', 'discovery-audio', true)
-- ON CONFLICT DO NOTHING;
