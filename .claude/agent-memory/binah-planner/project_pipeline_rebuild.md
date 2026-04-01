---
name: Pipeline rebuild in progress
description: Discovery assessment pipeline being rebuilt from pg_net triggers to pg_cron polling worker due to PLACEHOLDER key and silent failures
type: project
---

Discovery pipeline (Guardian->Visionary->Architect->Oracle) is broken in production. Root cause: `_pipeline_config.service_role_key` = 'PLACEHOLDER', plus pg_net silent failure modes and no rate-limit spacing.

**Why:** Pipeline has never successfully run end-to-end in production. The pg_net trigger silently no-ops when it reads the PLACEHOLDER key.

**How to apply:** Plan is at `.tola/plans/pipeline-rebuild.md`. Approach: replace pg_net trigger chain with pg_cron polling worker (every 30s), enforce 60s global cooldown between Claude API calls, retry-aware failPipeline(). The 4 Edge Functions themselves are correct and unchanged. Critical manual step post-deploy: UPDATE _pipeline_config with real service_role_key.
