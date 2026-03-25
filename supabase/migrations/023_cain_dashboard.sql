-- 023_cain_dashboard.sql
-- Cain Command Center: persistent task queue and activity log
-- Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run

-- ── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cain_tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  context      text,
  priority     text        NOT NULL CHECK (priority IN ('urgent','today','week','backlog')),
  status       text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
  actions      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS cain_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cain_log   ENABLE ROW LEVEL SECURITY;

-- ── Seed: cain_tasks ────────────────────────────────────────────────────────

DO $$
DECLARE
  v_john_body  text;
  v_zion_body  text;
  v_lisa_body  text;
  v_zev_ai_sql text;
  v_stein_sql  text;
BEGIN

  v_john_body :=
    'Hi John,' || chr(10) || chr(10) ||
    'Hope you''re well. I put together two things based on our conversation — proposal and a full market analysis:' || chr(10) || chr(10) ||
    '1. The proposal — scope, timeline, and investment:' || chr(10) ||
    'https://atlantic-laser-v2.vercel.app' || chr(10) || chr(10) ||
    '2. The full Insight Report — everything we found on your market:' || chr(10) ||
    'https://al-insight-report.vercel.app' || chr(10) || chr(10) ||
    'With your laser cleaning launch coming up, timing matters. Happy to jump on a quick call this week.' || chr(10) || chr(10) ||
    '— Zev' || chr(10) ||
    'askzev.ai | hello@askzev.ai';

  v_zion_body :=
    'Put together something I think you''re going to want to see. Laid out the full vision for what we talked about — the platform, the configurator, all of it.' || chr(10) || chr(10) ||
    'https://bay-state-platform.vercel.app' || chr(10) || chr(10) ||
    'Take a look and let me know when you''re free to connect.';

  v_lisa_body :=
    'Hey Lisa — just wanted to check in and see if you''d had a chance to look at the proposal. No rush at all, I know you''re managing a lot right now.' || chr(10) || chr(10) ||
    'I built the tiers specifically so you could start at whatever level feels right — honestly even the Starter Tier would give you consistent social content without you having to write a single post from scratch, and we''re talking a few hundred bucks a month, not agency rates.' || chr(10) || chr(10) ||
    'The thing that keeps standing out to me is that 173K Facebook audience sitting there dormant. That''s a remarketing pool most businesses would pay a lot of money to build, and you already have it. Even just getting consistent content going again would start warming them up before we ever spent a dollar on ads.' || chr(10) || chr(10) ||
    'If it helps to talk through any of it — even just a 20-minute call — happy to do that. And if the timing isn''t right right now, totally get it.' || chr(10) || chr(10) ||
    '— Zev';

  v_zev_ai_sql :=
    'DO $inner$ BEGIN' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_strategy text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS target_cap_rate text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_property_types text[];' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_name text;' || chr(10) ||
    '  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_email text;' || chr(10) ||
    'EXCEPTION WHEN others THEN NULL;' || chr(10) ||
    'END $inner$;';

  v_stein_sql :=
    '-- Steinmetz DB migration' || chr(10) ||
    '-- Run in Steinmetz Supabase project SQL editor' || chr(10) ||
    'DO $inner$ BEGIN' || chr(10) ||
    '  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS soi_tier text;' || chr(10) ||
    '  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;' || chr(10) ||
    '  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_status text DEFAULT ''pending'';' || chr(10) ||
    '  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_id text;' || chr(10) ||
    '  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_synced_at timestamptz;' || chr(10) ||
    'EXCEPTION WHEN others THEN NULL;' || chr(10) ||
    'END $inner$;';

  -- ── URGENT ──────────────────────────────────────────────────────────────

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Send John''s email',
    'Atlantic Laser — proposal + Insight Report are live. He needs to see them before his laser cleaning launch. Warm intro through Zev''s father.',
    'urgent',
    jsonb_build_array(
      jsonb_build_object(
        'type', 'email',
        'to', 'jonathanproctor68@gmail.com',
        'subject', 'Your Atlantic Laser proposal — two things to review',
        'body', v_john_body
      ),
      jsonb_build_object(
        'type', 'links',
        'links', jsonb_build_array(
          jsonb_build_object('url', 'https://atlantic-laser-v2.vercel.app', 'label', 'Proposal →'),
          jsonb_build_object('url', 'https://al-insight-report.vercel.app',  'label', 'Insight Report →')
        )
      )
    ),
    now() - interval '14 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Text Zion',
    'Bay State — full digital platform presentation is ready. This is the new pitch: configurator, lead gen, full platform. New link replaces the old proposal.',
    'urgent',
    jsonb_build_array(
      jsonb_build_object(
        'type', 'sms',
        'body', v_zion_body,
        'phoneNumber', ''  -- update with Zion''s number in Supabase
      ),
      jsonb_build_object(
        'type', 'links',
        'links', jsonb_build_array(
          jsonb_build_object('url', 'https://bay-state-platform.vercel.app', 'label', 'Platform Presentation →')
        )
      )
    ),
    now() - interval '13 days'
  );

  -- ── TODAY ────────────────────────────────────────────────────────────────

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Send Lisa follow-up text',
    'Close friend. Proposal sent a few days ago. Casual check-in, no pressure — don''t wait too long. 173K Facebook audience, dormant.',
    'today',
    jsonb_build_array(
      jsonb_build_object('type', 'sms', 'body', v_lisa_body)
    ),
    now() - interval '12 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Run Supabase migration (zev-ai)',
    'Adds 8 columns to the leads table. How to do it: (1) Click "Open Supabase" below. (2) Blank SQL editor appears. (3) Click "Copy SQL" and paste it in. (4) Click the green Run button top-right. (5) "Success. No rows returned." — done.',
    'today',
    jsonb_build_array(
      jsonb_build_object(
        'type', 'sql',
        'sql', v_zev_ai_sql,
        'dashboardUrl', 'https://supabase.com/dashboard/project/ctrzkvdqkcqgejaedkbr/sql/new'
      )
    ),
    now() - interval '11 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Connect askzev.ai accounts in Buffer · schedule 20 posts',
    '20 LinkedIn posts are written and ready. Connect askzev.ai accounts in Buffer, then schedule them out.',
    'today',
    jsonb_build_array(
      jsonb_build_object('type', 'link', 'url', 'https://buffer.com', 'label', 'Open Buffer →'),
      jsonb_build_object(
        'type', 'info',
        'rows', jsonb_build_array(
          jsonb_build_object('label', 'Login',      'value', 'zev330@gmail.com'),
          jsonb_build_object('label', 'Password',   'value', '[BUFFER_PASSWORD]', 'secret', true),
          jsonb_build_object('label', 'Posts file', 'value', '/docs/content/askzevai-linkedin-posts.md')
        )
      )
    ),
    now() - interval '10 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Review + approve nurture emails (Steinmetz)',
    '98 nurture emails pending approval on the Steinmetz dashboard. These are sitting in queue — approve or edit them so they can go out.',
    'today',
    jsonb_build_array(
      jsonb_build_object('type', 'link', 'url', 'https://steinmetz-real-estate.vercel.app/admin', 'label', 'Open Steinmetz Dashboard →'),
      jsonb_build_object('type', 'note', 'text', 'Go to CRM → Nurture → Pending Queue. Review each email, edit if needed, then approve. 98 total.')
    ),
    now() - interval '9 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Fix Vercel deploy for Steinmetz',
    'Steinmetz site deploy is broken. Fix requires deleting the project in Vercel and recreating it. Zev needs to do this himself — he owns the account.',
    'today',
    jsonb_build_array(
      jsonb_build_object('type', 'link', 'url', 'https://vercel.com/dashboard', 'label', 'Open Vercel Dashboard →'),
      jsonb_build_object('type', 'note', 'text',
        'Steps: (1) Go to Vercel dashboard → find steinmetz-real-estate project → Settings → Delete Project. (2) Import the repo again from GitHub (zev330-lab/steinmetz-real-estate). (3) Set env vars from .env.production. (4) Deploy.')
    ),
    now() - interval '8 days'
  );

  -- ── THIS WEEK ────────────────────────────────────────────────────────────

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Order Limitless Pendant',
    'Best wearable for AI context capture. Only one with a real API for auto-pushing meeting transcripts. $99 device + $19/month subscription.',
    'week',
    jsonb_build_array(
      jsonb_build_object('type', 'link', 'url', 'https://www.limitless.ai', 'label', 'Order on Limitless.ai →')
    ),
    now() - interval '7 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Upgrade ElevenLabs to Creator plan',
    'Voice replies are paused — quota exceeded. Creator plan is $22/month for 100K chars. Needed for voice storytelling and audio features.',
    'week',
    jsonb_build_array(
      jsonb_build_object('type', 'link', 'url', 'https://elevenlabs.io/app/billing', 'label', 'Upgrade to Creator ($22/mo) →')
    ),
    now() - interval '6 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Submit remaining security vendors',
    'Norton, Talos, Palo Alto, Trend Micro, and Kaspersky still need submissions. Part of the security vendor outreach campaign.',
    'week',
    jsonb_build_array(
      jsonb_build_object(
        'type', 'links',
        'links', jsonb_build_array(
          jsonb_build_object('url', 'https://safeweb.norton.com/report',                   'label', 'Norton →'),
          jsonb_build_object('url', 'https://talosintelligence.com/reputation_center',      'label', 'Talos →'),
          jsonb_build_object('url', 'https://urlfiltering.paloaltonetworks.com',            'label', 'Palo Alto →'),
          jsonb_build_object('url', 'https://global.sitesafety.trendmicro.com',            'label', 'Trend Micro →'),
          jsonb_build_object('url', 'https://opentip.kaspersky.com',                        'label', 'Kaspersky →')
        )
      )
    ),
    now() - interval '5 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Run Supabase migration (Steinmetz)',
    'Steinmetz DB needs columns for SOI tier, last contacted, nurture status, and Skyslope sync fields. Run in Steinmetz Supabase project.',
    'week',
    jsonb_build_array(
      jsonb_build_object(
        'type', 'sql',
        'sql', v_stein_sql,
        'dashboardUrl', 'https://supabase.com/dashboard/projects'
      ),
      jsonb_build_object('type', 'note', 'text',
        'Make sure you select the STEINMETZ project — not zev-ai — in the Supabase dashboard before running.')
    ),
    now() - interval '4 days'
  );

  -- ── BACKLOG ──────────────────────────────────────────────────────────────

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'SOI cultivation strategy — Steinmetz contacts',
    '3,400 contacts in the Steinmetz CRM need categorization into SOI tiers. This is the foundation for the entire nurture program. Needs a strategy session before building.',
    'backlog',
    jsonb_build_array(
      jsonb_build_object('type', 'note', 'text',
        'Proposed approach: (1) Export contacts from CRM. (2) Claude-powered categorization pass — Tier A (warm, likely to transact), Tier B (relationship, stay warm), Tier C (cold/dormant). (3) Zev reviews and adjusts. (4) Tier assignments power the nurture sequences. Discuss before building.')
    ),
    now() - interval '3 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Skyslope sync automation',
    'Sarina''s credentials are saved, sync script is ready. Waiting on Zev to confirm before activating the automated overnight transaction sync.',
    'backlog',
    jsonb_build_array(
      jsonb_build_object('type', 'note', 'text',
        'Script is at /scripts/skyslope-sync.ts. Credentials stored in TOOLS.md. Needs: (1) Zev confirms it''s ready to activate. (2) Test run on one transaction. (3) Set up as nightly cron.')
    ),
    now() - interval '2 days'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'KabbalahQ.ai — waiting on Zev',
    'Zev will advise when ready to resume. Parked for now.',
    'backlog',
    jsonb_build_array(
      jsonb_build_object('type', 'note', 'text',
        'No action needed. Zev will kick this off when the time is right. The repo is at zev330-lab/kabbalahq.')
    ),
    now() - interval '1 day'
  );

  INSERT INTO cain_tasks (title, context, priority, actions, created_at) VALUES (
    'Blank Industries retainer',
    'Zev is managing this engagement independently. No action for Cain at this time.',
    'backlog',
    jsonb_build_array(
      jsonb_build_object('type', 'note', 'text',
        'Zev managing directly. Check in if Zev asks for a status update or needs deliverables prepped.')
    ),
    now()
  );

END;
$$;

-- ── Seed: cain_log ──────────────────────────────────────────────────────────
-- Inserted oldest-first; displayed newest-first via ORDER BY created_at DESC

INSERT INTO cain_log (entry, created_at) VALUES
  ('20 LinkedIn posts written for askzev.ai',                                  now() - interval '22 days'),
  ('Wearable AI comparison written',                                            now() - interval '21 days'),
  ('TOLA client workflow spec written',                                         now() - interval '20 days'),
  ('PWA manifest added (add to home screen)',                                   now() - interval '19 days'),
  ('Zev headshot added to About page',                                          now() - interval '18 days'),
  ('Zion Bay State decision tool prototype live',                               now() - interval '17 days'),
  ('Atlantic Laser interactive proposal app live',                              now() - interval '16 days'),
  ('ElevenLabs voice configured',                                               now() - interval '15 days'),
  ('Stripe configured + payment links created',                                 now() - interval '14 days'),
  ('Google Search Console verified (both sites)',                               now() - interval '13 days'),
  ('Google Analytics connected (both sites)',                                   now() - interval '12 days'),
  ('10 social posts scheduled in Buffer',                                       now() - interval '11 days'),
  ('Sarina''s transaction form built',                                          now() - interval '10 days'),
  ('Stale agents fixed (4→12+ healthy)',                                        now() - interval '9 days'),
  ('Quality Monitor critical issue fixed',                                      now() - interval '8 days'),
  ('Knowledge Base populated (Newton + 6 other neighborhoods)',                 now() - interval '7 days'),
  ('Projects crash fix on askzev.ai',                                          now() - interval '6 days'),
  ('Cain dashboard rebuilt — comprehensive task list, all priorities',          now() - interval '5 days'),
  ('Promo code "ZevGT3" added to /discover form (friends & family → free Insight Report)', now() - interval '4 days'),
  ('Homepage copy rewritten — anxiety approach + origin story, removed agent jargon', now() - interval '3 days'),
  ('Atlantic Laser proposal rebuilt from source docs (john-atlantic-laser-final.html)', now() - interval '2 days'),
  ('Zion Bay State proposal rebuilt from source docs (zion-bay-state-final.html)', now() - interval '1 day');
