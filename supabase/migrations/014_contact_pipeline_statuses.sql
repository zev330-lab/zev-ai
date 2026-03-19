-- =============================================================================
-- Migration 014: Update contacts status constraint for full CRM pipeline
-- Adds: researched, meeting_scheduled, proposal_sent, client
-- =============================================================================

-- Drop existing check constraint and recreate with full pipeline statuses
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE contacts ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('new', 'read', 'replied', 'researched', 'meeting_scheduled', 'proposal_sent', 'client', 'archived'));
