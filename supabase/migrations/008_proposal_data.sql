-- 008: Add proposal generation columns to discoveries
-- proposal_data stores the generated SOW/proposal document
-- include_pricing controls whether dollar amounts appear in the output

ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS proposal_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS include_pricing BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN discoveries.proposal_data IS 'JSONB: { markdown, generated_at, model_used, tokens_used, prompt_context }';
COMMENT ON COLUMN discoveries.include_pricing IS 'When false, proposal omits dollar amounts';
