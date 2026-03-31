-- =============================================================================
-- Funnel Research Agent — Event-Driven Trigger
-- Migration: 029_funnel_research_trigger.sql
-- Fires webhook on funnel_leads INSERT → researches lead → sends email
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add processing columns to funnel_leads
-- ---------------------------------------------------------------------------
ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS retry_flag       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retry_count      INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 2. Store Next.js app URL in pipeline config (for pg_net to call)
--    Set this after deploy: UPDATE _pipeline_config SET value = 'https://askzev.ai' WHERE key = 'nextjs_url';
-- ---------------------------------------------------------------------------
INSERT INTO _pipeline_config (key, value) VALUES
  ('nextjs_url', 'https://askzev.ai')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Trigger function: fires on funnel_leads INSERT
--    Calls /api/funnel/webhook with the lead ID, auth'd via service_role_key
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_funnel_lead_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _app_url  TEXT;
  _svc_key  TEXT;
BEGIN
  SELECT value INTO _app_url FROM _pipeline_config WHERE key = 'nextjs_url';
  SELECT value INTO _svc_key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _app_url IS NULL OR _svc_key IS NULL OR _svc_key = 'PLACEHOLDER' THEN
    RAISE WARNING 'funnel webhook: missing config (nextjs_url=%, key set=%)',
      _app_url IS NOT NULL, _svc_key IS NOT NULL AND _svc_key != 'PLACEHOLDER';
    RETURN NEW;
  END IF;

  -- Fire-and-forget HTTP POST via pg_net
  PERFORM net.http_post(
    url := _app_url || '/api/funnel/webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _svc_key
    ),
    body := jsonb_build_object('lead_id', NEW.id),
    timeout_milliseconds := 60000
  );

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Attach trigger to funnel_leads table
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_funnel_lead_created ON public.funnel_leads;
CREATE TRIGGER on_funnel_lead_created
  AFTER INSERT ON public.funnel_leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_funnel_lead_created();
