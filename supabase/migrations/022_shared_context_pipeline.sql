-- =============================================================================
-- Migration 022: TOLA Shared Context + 22-Path Agent Collaboration
--
-- Implements the full agent collaboration spec:
--   - tola_shared_context table (inter-agent communication backbone)
--   - Pipeline track support (paid_499, friends_family_zevgt3, free)
--   - Quality gate + revision loop (max 2 iterations)
--   - Delivery tracking
--   - Nexus routing function (22 paths)
--   - Updated advance_pipeline() with new statuses
-- =============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Shared Context Table — the communication backbone
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tola_shared_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL,
  pipeline_type TEXT NOT NULL DEFAULT 'discovery',
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  path_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'read', 'acted_on')),
  quality_score FLOAT,
  tier_level INTEGER DEFAULT 1
    CHECK (tier_level IN (1, 2, 3)),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_pipeline ON tola_shared_context(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_context_recipient ON tola_shared_context(to_agent, status);
CREATE INDEX IF NOT EXISTS idx_context_path ON tola_shared_context(path_name);
CREATE INDEX IF NOT EXISTS idx_context_created ON tola_shared_context(created_at DESC);

ALTER TABLE tola_shared_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_shared_context" ON tola_shared_context
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_shared_context" ON tola_shared_context
  FOR SELECT TO anon USING (true);

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Extend discoveries table for pipeline tracks + quality gates + delivery
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE discoveries
  ADD COLUMN IF NOT EXISTS pipeline_track TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS report_data JSONB,
  ADD COLUMN IF NOT EXISTS quality_gate_score FLOAT,
  ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Nexus routing function — processes shared_context entries
--    Reads entries where to_agent='nexus', routes to next agent
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION nexus_route() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ctx RECORD;
  disc RECORD;
  _track TEXT;
  _rev_count INTEGER;
BEGIN
  -- Process pending context entries addressed to Nexus
  FOR ctx IN
    SELECT * FROM tola_shared_context
    WHERE status = 'pending'
      AND to_agent = 'nexus'
    ORDER BY created_at ASC
    LIMIT 5
  LOOP
    -- Mark as read immediately (prevents double-processing)
    UPDATE tola_shared_context SET status = 'read' WHERE id = ctx.id;

    -- Get discovery info for track-based routing
    SELECT * INTO disc FROM discoveries WHERE id = ctx.pipeline_id;
    _track := COALESCE(disc.pipeline_track, 'free');

    CASE ctx.path_name

      -- ── Discovery Pipeline ──────────────────────────────────────

      -- Path 1: Crown → Nexus (new submission)
      WHEN 'crown_to_nexus' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'guardian',
           'nexus_to_guardian_validate', ctx.payload);

      -- Path 2 result: Guardian → Nexus (validation done)
      WHEN 'guardian_to_nexus_validated' THEN
        IF (ctx.payload->>'validation') = 'pass' THEN
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
          VALUES
            (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'visionary',
             'nexus_to_visionary_research', ctx.payload);
        ELSIF (ctx.payload->>'validation') = 'flag' THEN
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
          VALUES
            (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'crown',
             'nexus_to_crown_flagged', ctx.payload, 3);
        END IF;
        -- 'fail' = pipeline stops, no routing needed

      -- Path 3 result: Visionary → Nexus (research done)
      WHEN 'visionary_to_nexus_researched' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'architect',
           'nexus_to_architect_scope', ctx.payload);

      -- Path 4 result: Architect → Nexus (scoping done)
      WHEN 'architect_to_nexus_scoped' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'oracle',
           'nexus_to_oracle_synthesize', ctx.payload);

      -- Path 5 result: Oracle → Nexus (report ready)
      WHEN 'oracle_to_nexus_report' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'guardian',
           'nexus_to_guardian_quality_gate', ctx.payload);

      -- Path 6 result: Guardian → Nexus (quality verdict)
      WHEN 'guardian_to_nexus_quality' THEN
        IF (ctx.payload->>'verdict') = 'pass' THEN
          -- Store quality score
          UPDATE discoveries
            SET quality_gate_score = (ctx.payload->>'quality_score')::float
            WHERE id = ctx.pipeline_id;

          IF _track = 'paid_499' THEN
            -- Tier 1: auto-deliver
            INSERT INTO tola_shared_context
              (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
            VALUES
              (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'gateway',
               'nexus_to_gateway_deliver', ctx.payload, 1);
          ELSE
            -- Tier 3: wait for Crown review (zevgt3 or free track)
            INSERT INTO tola_shared_context
              (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
            VALUES
              (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'crown',
               'nexus_to_crown_review', ctx.payload, 3);
          END IF;

        ELSIF (ctx.payload->>'verdict') = 'needs_revision' THEN
          _rev_count := COALESCE(disc.revision_count, 0);
          IF _rev_count < 2 THEN
            UPDATE discoveries SET revision_count = _rev_count + 1 WHERE id = ctx.pipeline_id;
            INSERT INTO tola_shared_context
              (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
            VALUES
              (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'oracle',
               'nexus_to_oracle_revise', ctx.payload);
          ELSE
            -- Max revisions hit, escalate to Crown
            INSERT INTO tola_shared_context
              (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
            VALUES
              (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'crown',
               'nexus_to_crown_revision_failed', ctx.payload, 3);
          END IF;

        ELSE
          -- Hard fail, escalate
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
          VALUES
            (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'crown',
             'nexus_to_crown_quality_failed', ctx.payload, 3);
        END IF;

      -- Path 7 result: Gateway → Nexus (delivered)
      WHEN 'gateway_to_nexus_delivered' THEN
        -- Path 8: Notify Crown of delivery
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
        VALUES
          (ctx.pipeline_id, ctx.pipeline_type, 'nexus', 'crown',
           'nexus_to_crown_notification', ctx.payload, 1);

      -- ── Content Pipeline ────────────────────────────────────────

      -- Path 9 result: Visionary content research done
      WHEN 'visionary_to_nexus_content_researched' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'content', 'nexus', 'architect',
           'nexus_to_architect_content_plan', ctx.payload);

      -- Path 10 result: Architect content planned
      WHEN 'architect_to_nexus_content_planned' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'content', 'nexus', 'oracle',
           'nexus_to_oracle_content_draft', ctx.payload);

      -- Path 11 result: Oracle content drafted
      WHEN 'oracle_to_nexus_content_drafted' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'content', 'nexus', 'guardian',
           'nexus_to_guardian_content_review', ctx.payload);

      -- Path 12 result: Guardian content reviewed
      WHEN 'guardian_to_nexus_content_reviewed' THEN
        IF (ctx.payload->>'verdict') = 'pass' THEN
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
          VALUES
            (ctx.pipeline_id, 'content', 'nexus', 'catalyst',
             'nexus_to_catalyst_social', ctx.payload);
        ELSE
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
          VALUES
            (ctx.pipeline_id, 'content', 'nexus', 'oracle',
             'nexus_to_oracle_content_revise', ctx.payload);
        END IF;

      -- Path 13 result: Catalyst social generated
      WHEN 'catalyst_to_nexus_social_generated' THEN
        -- Path 14: Route to Crown for approval (Tier 2/3)
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
        VALUES
          (ctx.pipeline_id, 'content', 'nexus', 'crown',
           'nexus_to_crown_content_approval', ctx.payload, 2);

      -- ── Monitoring Paths ────────────────────────────────────────

      -- Path 15 result: Sentinel → Nexus (health alert)
      WHEN 'sentinel_to_nexus_health' THEN
        IF (ctx.payload->>'status') IN ('degraded', 'critical') THEN
          -- Path 16: Escalate to Crown
          INSERT INTO tola_shared_context
            (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
          VALUES
            (ctx.pipeline_id, 'health_check', 'nexus', 'crown',
             'nexus_to_crown_alert', ctx.payload,
             CASE WHEN (ctx.payload->>'status') = 'critical' THEN 3 ELSE 2 END);
        END IF;

      -- Path 17 result: Prism → Oracle (quality metrics)
      WHEN 'prism_to_oracle_quality' THEN
        -- Route to Oracle for lessons synthesis
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'health_check', 'nexus', 'oracle',
           'nexus_to_oracle_lessons', ctx.payload);

      -- ── Nurture Paths ───────────────────────────────────────────

      -- Path 19: Catalyst → Crown (follow-up reminders)
      WHEN 'catalyst_to_nexus_followup' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload, tier_level)
        VALUES
          (ctx.pipeline_id, 'nurture', 'nexus', 'crown',
           'nexus_to_crown_followup', ctx.payload, 2);

      -- Path 21: Gateway → Catalyst (engagement signals)
      WHEN 'gateway_to_nexus_engagement' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'nurture', 'nexus', 'catalyst',
           'nexus_to_catalyst_engagement', ctx.payload);

      -- Path 22: Foundation → Sentinel (infra health)
      WHEN 'foundation_to_nexus_infra' THEN
        INSERT INTO tola_shared_context
          (pipeline_id, pipeline_type, from_agent, to_agent, path_name, payload)
        VALUES
          (ctx.pipeline_id, 'health_check', 'nexus', 'sentinel',
           'nexus_to_sentinel_infra', ctx.payload);

      ELSE
        -- Unknown path — mark as acted_on, don't route
        NULL;

    END CASE;

    -- Mark original entry as fully processed
    UPDATE tola_shared_context SET status = 'acted_on' WHERE id = ctx.id;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Updated advance_pipeline() with new statuses + Nexus routing
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION advance_pipeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _url text;
  _key text;
  _rec record;
  _target_function text;
  _last_claude_call timestamptz;
BEGIN
  -- Read config
  SELECT value INTO _url FROM _pipeline_config WHERE key = 'supabase_url';
  SELECT value INTO _key FROM _pipeline_config WHERE key = 'service_role_key';

  IF _url IS NULL OR _key IS NULL OR _key = 'PLACEHOLDER' THEN
    RETURN;
  END IF;

  -- Run Nexus routing first (processes shared_context entries)
  PERFORM nexus_route();

  -- ── Auto-retry retryable failures ──────────────────────────────────────
  UPDATE discoveries
  SET
    pipeline_status = CASE
      WHEN pipeline_error ILIKE '%Guardian%' AND pipeline_error NOT ILIKE '%Quality%' THEN 'pending'
      WHEN pipeline_error ILIKE '%Visionary%' THEN 'researching'
      WHEN pipeline_error ILIKE '%Architect%' THEN 'scoping'
      WHEN pipeline_error ILIKE '%Oracle%' AND pipeline_error NOT ILIKE '%revis%' THEN 'synthesizing'
      WHEN pipeline_error ILIKE '%Quality%' THEN 'reporting'
      WHEN pipeline_error ILIKE '%revis%' THEN 'revising'
      WHEN pipeline_error ILIKE '%Gateway%' OR pipeline_error ILIKE '%deliver%' THEN 'delivering'
      ELSE pipeline_status
    END,
    pipeline_error = NULL,
    pipeline_started_at = NULL,
    pipeline_retry_count = COALESCE(pipeline_retry_count, 0) + 1
  WHERE pipeline_status = 'failed'
    AND pipeline_error IS NOT NULL
    AND (
      pipeline_error ILIKE '%429%'
      OR pipeline_error ILIKE '%529%'
      OR pipeline_error ILIKE '%rate_limit%'
      OR pipeline_error ILIKE '%overloaded%'
      OR pipeline_error ILIKE '%timed out%'
    )
    AND COALESCE(pipeline_retry_count, 0) < 5
    AND created_at > now() - interval '24 hours';

  -- ── Recover stuck in-flight steps ──────────────────────────────────────
  UPDATE discoveries
  SET pipeline_started_at = NULL
  WHERE pipeline_started_at IS NOT NULL
    AND pipeline_started_at < now() - interval '5 minutes'
    AND pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing',
                            'reporting', 'revising', 'delivering');

  -- ── Global cooldown check ──────────────────────────────────────────────
  SELECT MAX(pipeline_step_completed_at) INTO _last_claude_call
  FROM discoveries
  WHERE pipeline_step_completed_at IS NOT NULL;

  -- ── Find one discovery ready for next step ─────────────────────────────
  SELECT id, pipeline_status INTO _rec
  FROM discoveries
  WHERE pipeline_status IN ('pending', 'researching', 'scoping', 'synthesizing',
                            'reporting', 'revising', 'delivering')
    AND pipeline_started_at IS NULL
    AND COALESCE(pipeline_retry_count, 0) < 5
    AND created_at > now() - interval '7 days'
    AND (
      -- Guardian validation (no Claude call) and Gateway delivery skip cooldown
      pipeline_status IN ('pending', 'delivering')
      OR _last_claude_call IS NULL
      OR _last_claude_call < now() - interval '60 seconds'
    )
  ORDER BY
    -- Prioritize discoveries further along (finish what you started)
    CASE pipeline_status
      WHEN 'delivering' THEN 1
      WHEN 'reporting' THEN 2
      WHEN 'revising' THEN 3
      WHEN 'synthesizing' THEN 4
      WHEN 'scoping' THEN 5
      WHEN 'researching' THEN 6
      WHEN 'pending' THEN 7
    END,
    created_at ASC
  LIMIT 1;

  IF _rec IS NULL THEN
    RETURN;
  END IF;

  -- Map status to function
  CASE _rec.pipeline_status
    WHEN 'pending'       THEN _target_function := 'pipeline-guardian';
    WHEN 'researching'   THEN _target_function := 'pipeline-visionary';
    WHEN 'scoping'       THEN _target_function := 'pipeline-architect';
    WHEN 'synthesizing'  THEN _target_function := 'pipeline-oracle';
    WHEN 'reporting'     THEN _target_function := 'pipeline-guardian';
    WHEN 'revising'      THEN _target_function := 'pipeline-oracle';
    WHEN 'delivering'    THEN _target_function := 'pipeline-gateway-delivery';
    ELSE RETURN;
  END CASE;

  -- Mark as in-flight (prevents double-dispatch)
  UPDATE discoveries
  SET pipeline_started_at = now()
  WHERE id = _rec.id;

  -- Dispatch via pg_net
  PERFORM net.http_post(
    url := _url || '/functions/v1/' || _target_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := jsonb_build_object('discovery_id', _rec.id::text),
    timeout_milliseconds := 300000
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Reschedule advance_pipeline to run every minute (unchanged schedule,
--    but now includes nexus_route() call and new status handling)
-- ════════════════════════════════════════════════════════════════════════════

-- The cron job 'advance-pipeline' already exists from migration 005.
-- The function replacement above takes effect immediately.
-- No reschedule needed.
