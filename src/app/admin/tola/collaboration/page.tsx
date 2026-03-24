'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SharedContextEntry {
  id: string;
  pipeline_id: string | null;
  pipeline_type: string;
  from_agent: string;
  to_agent: string;
  path_name: string;
  payload: Record<string, unknown> | null;
  status: 'pending' | 'read' | 'acted_on';
  quality_score: number | null;
  tier_level: number | null;
  created_at: string;
}

interface ActivePipeline {
  id: string;
  name: string;
  company: string;
  pipeline_status: string;
  pipeline_track: string;
  progress_pct: number | null;
  pipeline_error: string | null;
  quality_gate_score: number | null;
  revision_count: number | null;
  created_at: string;
  pipeline_started_at: string | null;
}

interface AwaitingReview {
  id: string;
  name: string;
  company: string;
  pipeline_status: string;
  pipeline_track: string;
  quality_gate_score: number | null;
  created_at: string;
}

interface AgentData {
  id: string;
  display_name: string;
  status: string;
  last_heartbeat: string | null;
  is_active: boolean;
  kill_switch: boolean;
}

interface AgentActivity {
  id: string;
  agent_id: string;
  action: string;
  created_at: string;
}

interface CollaborationData {
  context: SharedContextEntry[];
  activePipelines: ActivePipeline[];
  tier3Queue: SharedContextEntry[];
  awaitingReview: AwaitingReview[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STEPS = [
  { key: 'pending', label: 'Guardian', agent: 'guardian', description: 'Input validation' },
  { key: 'researching', label: 'Visionary', agent: 'visionary', description: 'Web research' },
  { key: 'scoping', label: 'Architect', agent: 'architect', description: 'Assessment' },
  { key: 'synthesizing', label: 'Oracle', agent: 'oracle', description: 'Report gen' },
  { key: 'reporting', label: 'Guardian QG', agent: 'guardian', description: 'Quality gate' },
  { key: 'delivering', label: 'Gateway', agent: 'gateway', description: 'Delivery' },
] as const;

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  pending: 0,
  researching: 1,
  scoping: 2,
  synthesizing: 3,
  reporting: 4,
  revising: 3, // Oracle revises, same step as synthesizing
  delivering: 5,
  complete: 6,
  failed: -1,
};

const PATH_CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  discovery: { label: 'Discovery', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  content: { label: 'Content', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  health_check: { label: 'Monitoring', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  nurture: { label: 'Nurture', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  crown: 'Crown',
  visionary: 'Visionary',
  architect: 'Architect',
  oracle: 'Oracle',
  guardian: 'Guardian',
  nexus: 'Nexus',
  catalyst: 'Catalyst',
  sentinel: 'Sentinel',
  prism: 'Prism',
  foundation: 'Foundation',
  gateway: 'Gateway',
};

const AGENT_COLORS: Record<string, string> = {
  crown: '#c4b5e0',
  visionary: '#7c9bf5',
  architect: '#60a5fa',
  oracle: '#a78bfa',
  guardian: '#4ade80',
  catalyst: '#fb923c',
  nexus: '#38bdf8',
  sentinel: '#f472b6',
  prism: '#facc15',
  foundation: '#94a3b8',
  gateway: '#6ee7b7',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPathCategory(pipelineType: string): { label: string; color: string; bg: string } {
  return PATH_CATEGORIES[pipelineType] ?? { label: pipelineType, color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' };
}

function agentHealthColor(agent: AgentData): string {
  if (agent.kill_switch) return '#ef4444';
  if (!agent.is_active) return '#6b7280';
  if (!agent.last_heartbeat) return '#6b7280';
  const age = Date.now() - new Date(agent.last_heartbeat).getTime();
  if (age < 600000) return '#4ade80'; // < 10min
  if (age < 1800000) return '#f59e0b'; // < 30min
  return '#ef4444'; // > 30min
}

function truncateJson(obj: unknown, maxLen = 200): string {
  const str = JSON.stringify(obj, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '\n...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CollaborationPage() {
  const [data, setData] = useState<CollaborationData | null>(null);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedContextId, setExpandedContextId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [ctxRes, agentsRes, activityRes] = await Promise.all([
        fetch('/api/admin/shared-context'),
        fetch('/api/admin/agents'),
        fetch('/api/admin/activity?limit=50'),
      ]);

      if (ctxRes.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const [ctxData, agentsData, activityData] = await Promise.all([
        ctxRes.ok ? ctxRes.json() : null,
        agentsRes.ok ? agentsRes.json() : [],
        activityRes.ok ? activityRes.json() : [],
      ]);

      if (ctxData) setData(ctxData);
      if (Array.isArray(agentsData)) setAgents(agentsData);
      if (Array.isArray(activityData)) setActivity(activityData);
      setLastRefresh(new Date());
    } catch {
      // silent — will retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Derive agent action counts for today
  const agentActionCounts = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const counts: Record<string, number> = {};
    for (const a of activity) {
      if (new Date(a.created_at) >= todayStart) {
        counts[a.agent_id] = (counts[a.agent_id] || 0) + 1;
      }
    }
    return counts;
  }, [activity]);

  // Most recent action per agent
  const agentLastAction = useMemo(() => {
    const map: Record<string, AgentActivity> = {};
    for (const a of activity) {
      if (!map[a.agent_id]) map[a.agent_id] = a;
    }
    return map;
  }, [activity]);

  // Combined tier 3 items: shared_context tier 3 + discoveries awaiting review
  const tier3Items = useMemo(() => {
    const items: { id: string; type: string; label: string; company: string; since: string; score?: number | null }[] = [];

    if (data?.tier3Queue) {
      for (const entry of data.tier3Queue) {
        const payloadName =
          (entry.payload as Record<string, unknown>)?.discovery_name ??
          (entry.payload as Record<string, unknown>)?.name ??
          entry.path_name;
        items.push({
          id: entry.id,
          type: entry.path_name,
          label: String(payloadName),
          company: String((entry.payload as Record<string, unknown>)?.company ?? ''),
          since: entry.created_at,
          score: entry.quality_score,
        });
      }
    }

    if (data?.awaitingReview) {
      for (const d of data.awaitingReview) {
        items.push({
          id: d.id,
          type: 'Crown Review',
          label: d.name,
          company: d.company,
          since: d.created_at,
          score: d.quality_gate_score,
        });
      }
    }

    return items.sort((a, b) => new Date(a.since).getTime() - new Date(b.since).getTime());
  }, [data]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-muted)]">Loading collaboration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
                Agent Collaboration
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-medium">
                LIVE
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Real-time pipeline flows, shared context stream, and approval queue
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tola"
              className="text-[10px] text-[var(--color-accent)] hover:underline"
            >
              TOLA System
            </Link>
            <div className="text-right">
              <p className="text-[10px] text-[var(--color-muted)]">
                Updated {relativeTime(lastRefresh.toISOString())}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]/60">
                Auto-refresh 10s
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* ================================================================
              Section 1: Agent Status Bar
              ================================================================ */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Agent Status
              </h2>
              <div className="flex items-center gap-3 text-[10px] text-[var(--color-muted)]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Healthy</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Degraded</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Critical</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Offline</span>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
              {Object.keys(AGENT_DISPLAY_NAMES).map((agentId) => {
                const liveAgent = agents.find((a) => a.id === agentId);
                const healthColor = liveAgent ? agentHealthColor(liveAgent) : '#6b7280';
                const actionCount = agentActionCounts[agentId] ?? 0;
                const lastAct = agentLastAction[agentId];

                return (
                  <div
                    key={agentId}
                    className="bg-[var(--color-admin-bg)] rounded-lg px-3 py-2.5 flex flex-col items-center gap-1.5 border border-transparent hover:border-[var(--color-admin-border)] transition-colors"
                  >
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: `${AGENT_COLORS[agentId] ?? '#7c9bf5'}20`,
                          color: AGENT_COLORS[agentId] ?? '#7c9bf5',
                        }}
                      >
                        {(AGENT_DISPLAY_NAMES[agentId] ?? agentId).slice(0, 2).toUpperCase()}
                      </div>
                      <div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-admin-bg)]"
                        style={{ backgroundColor: healthColor }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--color-foreground-strong)] truncate w-full text-center">
                      {AGENT_DISPLAY_NAMES[agentId] ?? agentId}
                    </span>
                    <div className="text-center w-full">
                      <span className="text-[9px] text-[var(--color-muted)]">
                        {actionCount > 0 ? `${actionCount} today` : 'idle'}
                      </span>
                      {lastAct && (
                        <p className="text-[8px] text-[var(--color-muted)]/60 truncate" title={lastAct.action}>
                          {lastAct.action.length > 16 ? lastAct.action.slice(0, 16) + '...' : lastAct.action}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================
              Section 2: Active Pipeline Flow
              ================================================================ */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Active Pipeline Flows
              </h2>
              <Link href="/admin/discoveries" className="text-[10px] text-[var(--color-accent)] hover:underline">
                View all discoveries
              </Link>
            </div>

            {(!data?.activePipelines || data.activePipelines.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--color-muted)]">No active pipelines</p>
                <p className="text-[10px] text-[var(--color-muted)]/60 mt-1">
                  Pipelines appear here when a discovery enters the assessment flow
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {data.activePipelines.map((pipeline) => {
                  const currentStepIdx = STATUS_TO_STEP_INDEX[pipeline.pipeline_status] ?? -1;
                  const isFailed = pipeline.pipeline_status === 'failed';

                  return (
                    <div key={pipeline.id} className="bg-[var(--color-admin-bg)] rounded-lg p-4">
                      {/* Pipeline header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--color-foreground-strong)]">
                              {pipeline.name || 'Unnamed'}
                            </span>
                            {pipeline.company && (
                              <span className="text-xs text-[var(--color-muted)]">
                                @ {pipeline.company}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isFailed
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                          }`}>
                            {pipeline.pipeline_status}
                          </span>
                          {pipeline.pipeline_track && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-admin-border)] text-[var(--color-muted-light)]">
                              {pipeline.pipeline_track}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {pipeline.progress_pct != null && (
                            <span className="text-xs font-mono text-[var(--color-foreground-strong)]">
                              {pipeline.progress_pct}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {pipeline.progress_pct != null && (
                        <div className="h-1 bg-[var(--color-admin-border)] rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pipeline.progress_pct}%`,
                              backgroundColor: isFailed ? '#ef4444' : '#4ade80',
                            }}
                          />
                        </div>
                      )}

                      {/* Step nodes */}
                      <div className="flex items-center gap-0 overflow-x-auto">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const isActive = idx === currentStepIdx;
                          const isCompleted = currentStepIdx > idx;
                          const isPending = currentStepIdx < idx;
                          const agentColor = AGENT_COLORS[step.agent] ?? '#7c9bf5';

                          return (
                            <div key={step.key} className="flex items-center flex-1 min-w-0">
                              {/* Node */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div
                                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                                  style={{
                                    backgroundColor: isActive
                                      ? `${agentColor}30`
                                      : isCompleted
                                        ? `${agentColor}20`
                                        : 'var(--color-admin-border)',
                                    color: isActive || isCompleted ? agentColor : 'var(--color-muted)',
                                    boxShadow: isActive
                                      ? `0 0 12px ${agentColor}40, 0 0 0 2px var(--color-admin-bg), 0 0 0 4px ${agentColor}`
                                      : undefined,
                                  }}
                                >
                                  {isCompleted ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={agentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    step.label.slice(0, 2).toUpperCase()
                                  )}
                                  {isActive && (
                                    <div
                                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                                      style={{ backgroundColor: agentColor }}
                                    />
                                  )}
                                </div>
                                <span className={`text-[9px] whitespace-nowrap ${
                                  isActive
                                    ? 'text-[var(--color-foreground-strong)] font-medium'
                                    : isCompleted
                                      ? 'text-[var(--color-muted-light)]'
                                      : 'text-[var(--color-muted)]/60'
                                }`}>
                                  {step.label}
                                </span>
                                <span className="text-[8px] text-[var(--color-muted)]/50 whitespace-nowrap">
                                  {step.description}
                                </span>
                              </div>

                              {/* Connector line */}
                              {idx < PIPELINE_STEPS.length - 1 && (
                                <div className="flex-1 mx-1 min-w-[12px]">
                                  <div
                                    className="h-0.5 rounded-full transition-all duration-500"
                                    style={{
                                      backgroundColor: isCompleted
                                        ? agentColor
                                        : isPending
                                          ? 'var(--color-admin-border)'
                                          : `${agentColor}50`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Error display */}
                      {isFailed && pipeline.pipeline_error && (
                        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-[10px] text-red-400 font-mono">{pipeline.pipeline_error}</p>
                        </div>
                      )}

                      {/* Quality gate score + revision */}
                      {pipeline.quality_gate_score != null && (
                        <div className="mt-3 flex items-center gap-3 text-[10px]">
                          <span className="text-[var(--color-muted)]">Quality score:</span>
                          <span className={`font-mono font-medium ${
                            pipeline.quality_gate_score >= 0.8 ? 'text-green-400' : 'text-amber-400'
                          }`}>
                            {(pipeline.quality_gate_score * 100).toFixed(0)}%
                          </span>
                          {(pipeline.revision_count ?? 0) > 0 && (
                            <>
                              <span className="text-[var(--color-admin-border)]">|</span>
                              <span className="text-[var(--color-muted)]">
                                Revisions: {pipeline.revision_count}/2
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================================================================
              Sections 3 & 4: Shared Context Stream + Tier 3 Queue (two-column)
              ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* Shared Context Stream */}
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Shared Context Stream
                  </h2>
                  <span className="text-[10px] text-[var(--color-muted)]/60">
                    Last 24h
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(PATH_CATEGORIES).map(([key, cat]) => (
                    <span key={key} className="flex items-center gap-1 text-[9px]" style={{ color: cat.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1">
                {(!data?.context || data.context.length === 0) ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-[var(--color-muted)]">No shared context entries</p>
                    <p className="text-[10px] text-[var(--color-muted)]/60 mt-1">
                      Agent-to-agent messages appear here as pipelines run
                    </p>
                  </div>
                ) : (
                  data.context.map((entry) => {
                    const category = getPathCategory(entry.pipeline_type);
                    const isExpanded = expandedContextId === entry.id;
                    const fromColor = AGENT_COLORS[entry.from_agent] ?? '#9ca3af';
                    const toColor = AGENT_COLORS[entry.to_agent] ?? '#9ca3af';

                    return (
                      <div key={entry.id}>
                        <button
                          onClick={() => setExpandedContextId(isExpanded ? null : entry.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--color-admin-bg)] cursor-pointer group"
                          style={{ backgroundColor: isExpanded ? 'var(--color-admin-bg)' : undefined }}
                        >
                          <div className="flex items-center gap-2">
                            {/* Category dot */}
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: category.color }}
                            />

                            {/* From → To */}
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[11px] font-medium shrink-0" style={{ color: fromColor }}>
                                {AGENT_DISPLAY_NAMES[entry.from_agent] ?? entry.from_agent}
                              </span>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" className="shrink-0">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                              <span className="text-[11px] font-medium shrink-0" style={{ color: toColor }}>
                                {AGENT_DISPLAY_NAMES[entry.to_agent] ?? entry.to_agent}
                              </span>
                            </div>

                            {/* Path name */}
                            <span className="text-[10px] text-[var(--color-muted-light)] truncate flex-1 min-w-0">
                              {entry.path_name}
                            </span>

                            {/* Status badge */}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                              entry.status === 'acted_on'
                                ? 'bg-green-500/15 text-green-400'
                                : entry.status === 'read'
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {entry.status}
                            </span>

                            {/* Tier badge */}
                            {entry.tier_level && entry.tier_level >= 3 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium shrink-0">
                                T{entry.tier_level}
                              </span>
                            )}

                            {/* Quality score */}
                            {entry.quality_score != null && (
                              <span className={`text-[9px] font-mono shrink-0 ${
                                entry.quality_score >= 0.8 ? 'text-green-400' : 'text-amber-400'
                              }`}>
                                {(entry.quality_score * 100).toFixed(0)}%
                              </span>
                            )}

                            {/* Time */}
                            <span className="text-[9px] text-[var(--color-muted)]/60 shrink-0">
                              {relativeTime(entry.created_at)}
                            </span>

                            {/* Expand chevron */}
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--color-muted)"
                              strokeWidth="2"
                              className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </button>

                        {/* Expanded payload */}
                        {isExpanded && entry.payload && (
                          <div className="mx-3 mb-2 px-3 py-2.5 rounded-lg bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                Payload
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: category.bg, color: category.color }}
                              >
                                {category.label}
                              </span>
                            </div>
                            <pre className="text-[10px] text-[var(--color-muted-light)] font-mono whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                              {truncateJson(entry.payload, 800)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tier 3 Queue */}
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Tier 3 Queue
                  </h2>
                  {tier3Items.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                      {tier3Items.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-muted)]/60">
                  Awaiting Crown approval
                </span>
              </div>

              {tier3Items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">Queue clear</p>
                  <p className="text-[10px] text-[var(--color-muted)]/60 mt-1">
                    No items waiting for approval
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {tier3Items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[var(--color-admin-bg)] rounded-lg p-3 border border-transparent hover:border-[var(--color-admin-border)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--color-foreground-strong)] truncate">
                            {item.label}
                          </p>
                          {item.company && (
                            <p className="text-[10px] text-[var(--color-muted)] truncate">
                              {item.company}
                            </p>
                          )}
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium shrink-0 whitespace-nowrap">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                          <span>Waiting {relativeTime(item.since)}</span>
                          {item.score != null && (
                            <>
                              <span className="text-[var(--color-admin-border)]">|</span>
                              <span className={item.score >= 0.8 ? 'text-green-400' : 'text-amber-400'}>
                                Score: {(item.score * 100).toFixed(0)}%
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/discoveries`}
                            className="text-[10px] px-2.5 py-1 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors font-medium"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              Section 5: Recent Activity Feed (bottom)
              ================================================================ */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Recent Agent Activity
              </h2>
              <Link href="/admin/agents" className="text-[10px] text-[var(--color-accent)] hover:underline">
                View all agents
              </Link>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {activity.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)] text-center py-6">No recent activity</p>
              ) : (
                activity.slice(0, 30).map((entry) => {
                  const color = AGENT_COLORS[entry.agent_id] ?? '#9ca3af';
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-admin-bg)] transition-colors"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-medium w-16 shrink-0 truncate" style={{ color }}>
                        {AGENT_DISPLAY_NAMES[entry.agent_id] ?? entry.agent_id}
                      </span>
                      <span className="text-[10px] text-[var(--color-muted-light)] flex-1 truncate">
                        {entry.action}
                      </span>
                      <span className="text-[9px] text-[var(--color-muted)]/60 shrink-0">
                        {relativeTime(entry.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
