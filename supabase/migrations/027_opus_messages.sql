-- Opus-Cain messaging table for direct agent communication
-- OPUS_API_KEY=60831db8-6ccf-4b89-a59e-613cdc5bdfb7 — add this to Vercel env vars

CREATE TABLE opus_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL CHECK (from_agent IN ('opus','cain','zev')),
  to_agent TEXT NOT NULL CHECK (to_agent IN ('opus','cain','zev')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('directive','question','status_update','response')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','actioned')),
  in_reply_to UUID REFERENCES opus_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- RLS: service_role full access, anon read-only
ALTER TABLE opus_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON opus_messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_only" ON opus_messages
  FOR SELECT TO anon USING (true);

-- Index for common queries
CREATE INDEX idx_opus_messages_status ON opus_messages(status);
CREATE INDEX idx_opus_messages_to_agent ON opus_messages(to_agent);
CREATE INDEX idx_opus_messages_created_at ON opus_messages(created_at DESC);
