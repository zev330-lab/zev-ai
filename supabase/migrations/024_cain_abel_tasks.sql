-- ============================================================================
-- 024: Cain/Abel Shared Task System
-- Cain (OpenClaw/Telegram) and Abel (Cowork) communicate through Supabase.
-- ============================================================================

-- ─── cain_tasks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cain_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  context       text,
  priority      text NOT NULL DEFAULT 'backlog' CHECK (priority IN ('urgent','today','week','backlog')),
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','failed')),
  assigned_to   text NOT NULL DEFAULT 'zev' CHECK (assigned_to IN ('cain','abel','zev')),
  created_by    text NOT NULL DEFAULT 'zev' CHECK (created_by IN ('cain','abel','zev')),
  actions       jsonb DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  completion_notes text
);

-- ─── cain_log ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cain_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry       text NOT NULL,
  created_by  text NOT NULL DEFAULT 'cain',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE cain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cain_log ENABLE ROW LEVEL SECURITY;

-- Service role (API routes) gets full access
CREATE POLICY "service_role_full_cain_tasks" ON cain_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_cain_log" ON cain_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon can read (for Realtime subscriptions on dashboard)
CREATE POLICY "anon_read_cain_tasks" ON cain_tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_cain_log" ON cain_log
  FOR SELECT TO anon USING (true);

-- ─── Realtime ───────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE cain_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE cain_log;

-- ─── Seed: tasks (from hardcoded ACTION_ITEMS) ─────────────────────────────

INSERT INTO cain_tasks (title, context, priority, status, assigned_to, created_by, actions) VALUES

-- URGENT
(
  'Send John''s email',
  'Atlantic Laser — proposal + Insight Report are live. He needs to see them before his laser cleaning launch. Warm intro through Zev''s father.',
  'urgent', 'open', 'zev', 'cain',
  '[{"type":"email","to":"jonathanproctor68@gmail.com","subject":"Your Atlantic Laser proposal — two things to review","body":"Hi John,\n\nHope you''re well. I put together two things based on our conversation — proposal and a full market analysis:\n\n1. The proposal — scope, timeline, and investment:\nhttps://atlantic-laser-v2.vercel.app\n\n2. The full Insight Report — everything we found on your market:\nhttps://al-insight-report.vercel.app\n\nWith your laser cleaning launch coming up, timing matters. Happy to jump on a quick call this week.\n\n— Zev\naskzev.ai | hello@askzev.ai"},{"type":"links","links":[{"url":"https://atlantic-laser-v2.vercel.app","label":"Proposal →"},{"url":"https://al-insight-report.vercel.app","label":"Insight Report →"}]}]'::jsonb
),
(
  'Text Zion',
  'Bay State — full digital platform presentation is ready. This is the new pitch: configurator, lead gen, full platform. New link replaces the old proposal.',
  'urgent', 'open', 'zev', 'cain',
  '[{"type":"sms","body":"Put together something I think you''re going to want to see. Laid out the full vision for what we talked about — the platform, the configurator, all of it.\n\nhttps://bay-state-platform.vercel.app\n\nTake a look and let me know when you''re free to connect.","phoneNumber":""},{"type":"links","links":[{"url":"https://bay-state-platform.vercel.app","label":"Platform Presentation →"}]}]'::jsonb
),

-- TODAY
(
  'Send Lisa follow-up text',
  'Close friend. Proposal sent a few days ago. Casual check-in, no pressure — don''t wait too long. 173K Facebook audience, dormant.',
  'today', 'open', 'zev', 'cain',
  '[{"type":"sms","body":"Hey Lisa — just wanted to check in and see if you''d had a chance to look at the proposal. No rush at all, I know you''re managing a lot right now.\n\nI built the tiers specifically so you could start at whatever level feels right — honestly even the Starter Tier would give you consistent social content without you having to write a single post from scratch, and we''re talking a few hundred bucks a month, not agency rates.\n\nThe thing that keeps standing out to me is that 173K Facebook audience sitting there dormant. That''s a remarketing pool most businesses would pay a lot of money to build, and you already have it. Even just getting consistent content going again would start warming them up before we ever spent a dollar on ads.\n\nIf it helps to talk through any of it — even just a 20-minute call — happy to do that. And if the timing isn''t right right now, totally get it.\n\n— Zev"}]'::jsonb
),
(
  'Run Supabase migration (zev-ai)',
  'Adds 3 columns to the discoveries table: phone, free_summary_content, discovery_page_url. How to do it: (1) Click "Open Supabase" below. (2) You''ll see a blank SQL editor. (3) Click "Copy SQL" and paste it in. (4) Click the green Run button top-right. (5) You should see "Success. No rows returned." — you''re done.',
  'today', 'open', 'zev', 'cain',
  '[{"type":"sql","sql":"DO $$ BEGIN\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_range text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_strategy text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS target_cap_rate text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS investment_property_types text[];\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_name text;\n  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer_email text;\nEXCEPTION WHEN others THEN NULL;\nEND $$;","dashboardUrl":"https://supabase.com/dashboard/project/ctrzkvdqkcqgejaedkbr/sql/new"}]'::jsonb
),
(
  'Connect askzev.ai accounts in Buffer · schedule 20 posts',
  '20 LinkedIn posts are written and ready. Connect askzev.ai accounts in Buffer, then schedule them out.',
  'today', 'open', 'zev', 'cain',
  '[{"type":"link","url":"https://buffer.com","label":"Open Buffer →"},{"type":"info","rows":[{"label":"Login","value":"zev330@gmail.com"},{"label":"Posts file","value":"/docs/content/askzevai-linkedin-posts.md"}]}]'::jsonb
),
(
  'Review + approve nurture emails (Steinmetz)',
  '98 nurture emails pending approval on the Steinmetz dashboard. These are sitting in queue — approve or edit them so they can go out.',
  'today', 'open', 'zev', 'cain',
  '[{"type":"link","url":"https://steinmetz-real-estate.vercel.app/admin","label":"Open Steinmetz Dashboard →"},{"type":"note","text":"Go to CRM → Nurture → Pending Queue. Review each email, edit if needed, then approve. 98 total."}]'::jsonb
),
(
  'Fix Vercel deploy for Steinmetz',
  'Steinmetz site deploy is broken. Fix requires deleting the project in Vercel and recreating it. Zev needs to do this himself — he owns the account.',
  'today', 'open', 'zev', 'cain',
  '[{"type":"link","url":"https://vercel.com/dashboard","label":"Open Vercel Dashboard →"},{"type":"note","text":"Steps: (1) Go to Vercel dashboard → find steinmetz-real-estate project → Settings → Delete Project. (2) Import the repo again from GitHub (zev330-lab/steinmetz-real-estate). (3) Set env vars from .env.production. (4) Deploy."}]'::jsonb
),

-- THIS WEEK
(
  'Order Limitless Pendant',
  'Best wearable for AI context capture. Only one with a real API for auto-pushing meeting transcripts. $99 device + $19/month subscription.',
  'week', 'open', 'zev', 'cain',
  '[{"type":"link","url":"https://www.limitless.ai","label":"Order on Limitless.ai →"}]'::jsonb
),
(
  'Upgrade ElevenLabs to Creator plan',
  'Voice replies are paused — quota exceeded. Creator plan is $22/month for 100K chars. Needed for voice storytelling and audio features.',
  'week', 'open', 'zev', 'cain',
  '[{"type":"link","url":"https://elevenlabs.io/app/billing","label":"Upgrade to Creator ($22/mo) →"}]'::jsonb
),
(
  'Submit remaining security vendors',
  'Norton, Talos, Palo Alto, Trend Micro, and Kaspersky still need submissions. Part of the security vendor outreach campaign.',
  'week', 'open', 'zev', 'cain',
  '[{"type":"links","links":[{"url":"https://safeweb.norton.com/report","label":"Norton →"},{"url":"https://talosintelligence.com/reputation_center","label":"Talos →"},{"url":"https://urlfiltering.paloaltonetworks.com","label":"Palo Alto →"},{"url":"https://global.sitesafety.trendmicro.com","label":"Trend Micro →"},{"url":"https://opentip.kaspersky.com","label":"Kaspersky →"}]}]'::jsonb
),
(
  'Run Supabase migration (Steinmetz)',
  'Steinmetz DB needs columns for SOI tier, last contacted, nurture status, and Skyslope sync fields. Run in Steinmetz Supabase project.',
  'week', 'open', 'zev', 'cain',
  '[{"type":"sql","sql":"-- Steinmetz DB migration\n-- Run in Steinmetz Supabase project SQL editor\nDO $$ BEGIN\n  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS soi_tier text;\n  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;\n  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_status text DEFAULT ''pending'';\n  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_id text;\n  ALTER TABLE transactions ADD COLUMN IF NOT EXISTS skyslope_synced_at timestamptz;\nEXCEPTION WHEN others THEN NULL;\nEND $$;","dashboardUrl":"https://supabase.com/dashboard/projects"},{"type":"note","text":"Make sure you select the STEINMETZ project — not zev-ai — in the Supabase dashboard before running."}]'::jsonb
),

-- BACKLOG
(
  'SOI cultivation strategy — Steinmetz contacts',
  '3,400 contacts in the Steinmetz CRM need categorization into SOI tiers. This is the foundation for the entire nurture program. Needs a strategy session before building.',
  'backlog', 'open', 'zev', 'cain',
  '[{"type":"note","text":"Proposed approach: (1) Export contacts from CRM. (2) Claude-powered categorization pass — Tier A (warm, likely to transact), Tier B (relationship, stay warm), Tier C (cold/dormant). (3) Zev reviews and adjusts. (4) Tier assignments power the nurture sequences. Discuss before building."}]'::jsonb
),
(
  'Skyslope sync automation',
  'Sarina''s credentials are saved, sync script is ready. Waiting on Zev to confirm before activating the automated overnight transaction sync.',
  'backlog', 'open', 'zev', 'cain',
  '[{"type":"note","text":"Script is at /scripts/skyslope-sync.ts. Credentials stored in TOOLS.md. Needs: (1) Zev confirms it''s ready to activate. (2) Test run on one transaction. (3) Set up as nightly cron."}]'::jsonb
),
(
  'KabbalahQ.ai — waiting on Zev',
  'Zev will advise when ready to resume. Parked for now.',
  'backlog', 'open', 'zev', 'cain',
  '[{"type":"note","text":"No action needed. Zev will kick this off when the time is right. The repo is at zev330-lab/kabbalahq."}]'::jsonb
),
(
  'Blank Industries retainer',
  'Zev is managing this engagement independently. No action for Cain at this time.',
  'backlog', 'open', 'zev', 'cain',
  '[{"type":"note","text":"Zev managing directly. Check in if Zev asks for a status update or needs deliverables prepped."}]'::jsonb
);

-- ─── Seed: log (from hardcoded RECENT_WORK) ────────────────────────────────

INSERT INTO cain_log (entry, created_by) VALUES
  ('Zion Bay State proposal rebuilt from source docs (zion-bay-state-final.html)', 'cain'),
  ('Atlantic Laser proposal rebuilt from source docs (john-atlantic-laser-final.html)', 'cain'),
  ('Homepage copy rewritten — anxiety approach + origin story, removed agent jargon', 'cain'),
  ('Promo code "ZevGT3" added to /discover form (friends & family → free Insight Report)', 'cain'),
  ('Cain dashboard rebuilt — comprehensive task list, all priorities', 'cain'),
  ('Projects crash fix on askzev.ai', 'cain'),
  ('Knowledge Base populated (Newton + 6 other neighborhoods)', 'cain'),
  ('Quality Monitor critical issue fixed', 'cain'),
  ('Stale agents fixed (4→12+ healthy)', 'cain'),
  ('Sarina''s transaction form built', 'cain'),
  ('10 social posts scheduled in Buffer', 'cain'),
  ('Google Analytics connected (both sites)', 'cain'),
  ('Google Search Console verified (both sites)', 'cain'),
  ('Stripe configured + payment links created', 'cain'),
  ('ElevenLabs voice configured', 'cain'),
  ('Atlantic Laser interactive proposal app live', 'cain'),
  ('Zion Bay State decision tool prototype live', 'cain'),
  ('Zev headshot added to About page', 'cain'),
  ('PWA manifest added (add to home screen)', 'cain'),
  ('TOLA client workflow spec written', 'cain'),
  ('Wearable AI comparison written', 'cain'),
  ('20 LinkedIn posts written for askzev.ai', 'cain');

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_cain_tasks_status ON cain_tasks (status);
CREATE INDEX idx_cain_tasks_priority ON cain_tasks (priority);
CREATE INDEX idx_cain_tasks_assigned ON cain_tasks (assigned_to);
CREATE INDEX idx_cain_log_created ON cain_log (created_at DESC);
