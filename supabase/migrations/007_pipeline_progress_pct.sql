-- Pipeline progress tracking: 0-100% integer column
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0;

-- Backfill existing rows based on current pipeline_status
UPDATE discoveries SET progress_pct = CASE
  WHEN pipeline_status = 'complete' THEN 100
  WHEN pipeline_status = 'synthesizing' THEN 70
  WHEN pipeline_status = 'scoping' THEN 40
  WHEN pipeline_status = 'researching' THEN 15
  WHEN pipeline_status = 'pending' THEN 0
  WHEN pipeline_status = 'failed' THEN 0
  ELSE 0
END
WHERE progress_pct = 0 AND pipeline_status IS NOT NULL;
