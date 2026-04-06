-- 020: Add workspace metadata columns to projects table
-- Enables auto-population from ~/dev/ workspace scanning

ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployed_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_path text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_commit_date timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_commit_message text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_branch text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS readme_summary text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_dir text UNIQUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS synced_at timestamptz;
