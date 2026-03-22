'use client';

import { useState, useEffect } from 'react';
import { TolaTreeOS } from '@/components/admin/tola-tree';
import { AGENT_DETAILS, TRIADS, TREE_NODE_MAP, type AgentId } from '@/lib/tola-agents';

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type Tab = 'system' | 'workflows' | 'costs';

// ---------------------------------------------------------------------------
// Workflow definitions
// ---------------------------------------------------------------------------

interface WorkflowStep {
  agentId: AgentId | 'user' | 'platform';
  label: string;
  sublabel?: string;
}

interface WorkflowDef {
  id: string;
  name: string;
  description: string;
  trigger: string;
  color: string;
  steps: WorkflowStep[];
}

const WORKFLOWS: WorkflowDef[] = [
  {
    id: 'assessment',
    name: 'Assessment Pipeline',
    description: 'Every inbound discovery from the /discover form triggers a full AI research and scoping cycle.',
    trigger: 'Discovery form submission',
    color: '#7c9bf5',
    steps: [
      { agentId: 'user', label: 'Discovery', sublabel: '/discover form' },
      { agentId: 'guardian', label: 'Guardian', sublabel: 'Validates input' },
      { agentId: 'visionary', label: 'Visionary', sublabel: '13-dim research' },
      { agentId: 'architect', label: 'Architect', sublabel: '9-constraint scope' },
      { agentId: 'oracle', label: 'Oracle', sublabel: 'Meeting prep' },
      { agentId: 'crown', label: 'Crown', sublabel: 'Review queue' },
    ],
  },
  {
    id: 'content',
    name: 'Content Pipeline',
    description: 'Weekly automated blog post generation with multi-agent review and social distribution.',
    trigger: 'Sunday 8am EST (pg_cron) or manual trigger',
    color: '#c4b5e0',
    steps: [
      { agentId: 'visionary', label: 'Visionary', sublabel: 'Topic research' },
      { agentId: 'architect', label: 'Architect', sublabel: 'Outline + AEO' },
      { agentId: 'oracle', label: 'Oracle', sublabel: 'Draft 1,500-2,500w' },
      { agentId: 'guardian', label: 'Guardian', sublabel: 'Quality review' },
      { agentId: 'catalyst', label: 'Catalyst', sublabel: 'Social variants' },
      { agentId: 'crown', label: 'Crown', sublabel: 'Human publish' },
    ],
  },
  {
    id: 'social',
    name: 'Social Distribution',
    description: 'Catalyst generates platform-native posts, Guardian reviews, then the distributor pushes to live APIs.',
    trigger: 'Mon-Fri 7am EST or manual "Generate Posts Now"',
    color: '#4ade80',
    steps: [
      { agentId: 'catalyst', label: 'Catalyst', sublabel: 'Generates 2-3 posts' },
      { agentId: 'guardian', label: 'Guardian', sublabel: 'Brand review' },
      { agentId: 'crown', label: 'Crown', sublabel: 'Admin approval' },
      { agentId: 'nexus', label: 'Nexus', sublabel: 'Distributor routes' },
      { agentId: 'platform', label: 'Platforms', sublabel: 'LinkedIn/X/IG/Threads' },
    ],
  },
  {
    id: 'health',
    name: 'System Health',
    description: 'Continuous background monitoring across all agents with automatic circuit-breaker protection.',
    trigger: 'Every 30min (Nexus + Guardian)',
    color: '#f59e0b',
    steps: [
      { agentId: 'nexus', label: 'Nexus', sublabel: 'Heartbeat checks' },
      { agentId: 'prism', label: 'Prism', sublabel: 'Synthetic audits' },
      { agentId: 'sentinel', label: 'Sentinel', sublabel: 'API/DB verify' },
      { agentId: 'guardian', label: 'Guardian', sublabel: 'Circuit breaker' },
      { agentId: 'crown', label: 'Crown', sublabel: 'Governance alerts' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Agent color map (initials + color for workflow steps)
// ---------------------------------------------------------------------------

const AGENT_COLORS: Partial<Record<AgentId | 'user' | 'platform', string>> = {
  crown: '#f59e0b',
  visionary: '#7c9bf5',
  architect: '#c4b5e0',
  oracle: '#7c9bf5',
  guardian: '#4ade80',
  catalyst: '#c4b5e0',
  nexus: '#4ade80',
  prism: '#7c9bf5',
  sentinel: '#f59e0b',
  foundation: '#6b7280',
  gateway: '#6b7280',
  user: '#d0d0da',
  platform: '#6b7280',
};

function agentInitials(id: string): string {
  const map: Record<string, string> = {
    crown: 'CR', visionary: 'VI', architect: 'AR', oracle: 'OR',
    guardian: 'GU', catalyst: 'CA', nexus: 'NX', prism: 'PR',
    sentinel: 'SE', foundation: 'FO', gateway: 'GW',
    user: 'U', platform: 'PL',
  };
  return map[id] || id.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Workflows Tab
// ---------------------------------------------------------------------------

function PipelineReplay() {
  const [discoveries, setDiscoveries] = useState<{ id: string; name: string; company: string; pipeline_status: string; progress_pct: number; created_at: string; pipeline_completed_at: string | null }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch('/api/admin/discoveries')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setDiscoveries(data.filter((d: { pipeline_status: string }) => ['complete', 'failed'].includes(d.pipeline_status)).slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  const stages = [
    { label: 'Submitted', agent: 'user', color: '#d0d0da' },
    { label: 'Guardian', agent: 'guardian', color: '#4ade80' },
    { label: 'Visionary', agent: 'visionary', color: '#7c9bf5' },
    { label: 'Architect', agent: 'architect', color: '#c4b5e0' },
    { label: 'Oracle', agent: 'oracle', color: '#7c9bf5' },
    { label: 'Complete', agent: 'crown', color: '#f59e0b' },
  ];

  const play = (id: string) => {
    setSelected(id);
    setActiveStep(-1);
    setPlaying(true);
    let step = 0;
    const interval = setInterval(() => {
      setActiveStep(step);
      step++;
      if (step >= stages.length) {
        clearInterval(interval);
        setTimeout(() => setPlaying(false), 1000);
      }
    }, 800);
  };

  if (discoveries.length === 0) return null;

  return (
    <div>
      <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Pipeline Replay</p>
      <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
        <div className="flex items-center gap-3 mb-4">
          <select
            value={selected || ''}
            onChange={e => { setSelected(e.target.value); setActiveStep(-1); setPlaying(false); }}
            className="flex-1 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
          >
            <option value="">Select a completed discovery...</option>
            {discoveries.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.company || 'no company'}) — {d.pipeline_status}</option>
            ))}
          </select>
          <button
            onClick={() => selected && play(selected)}
            disabled={!selected || playing}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-40 cursor-pointer"
          >
            {playing ? 'Playing...' : 'Replay'}
          </button>
        </div>
        {selected && (
          <div className="flex items-center gap-0 flex-wrap">
            {stages.map((stage, i) => {
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;
              return (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 ${isCurrent ? 'scale-125' : ''}`}
                      style={{
                        backgroundColor: isActive ? `${stage.color}30` : `${stage.color}08`,
                        borderColor: isActive ? stage.color : `${stage.color}30`,
                        color: isActive ? stage.color : '#6b7280',
                        boxShadow: isCurrent ? `0 0 12px ${stage.color}60` : 'none',
                      }}
                    >
                      {agentInitials(stage.agent)}
                    </div>
                    <p className={`text-[10px] font-medium mt-1.5 transition-colors duration-300 ${isActive ? 'text-[var(--color-foreground-strong)]' : 'text-[var(--color-muted)]'}`}>
                      {stage.label}
                    </p>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex items-center mx-2 pb-5">
                      <div
                        className="w-8 h-0.5 rounded transition-all duration-500"
                        style={{ backgroundColor: i < activeStep ? stage.color : `${stage.color}20` }}
                      />
                      <svg width="6" height="8" viewBox="0 0 6 8" fill="none" className="shrink-0">
                        <path d="M0 0L6 4L0 8V0Z" fill={i < activeStep ? stage.color : `${stage.color}20`} className="transition-all duration-500" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowsTab() {
  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-foreground-strong)] mb-1">Pipeline Workflows</h2>
        <p className="text-sm text-[var(--color-muted)]">
          The 4 primary triggered workflows that run through the TOLA agent network.
        </p>
      </div>

      {/* Pipeline Replay */}
      <PipelineReplay />

      {/* Triad reference */}
      <div>
        <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Coordination Triads</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRIADS.map((triad) => (
            <div
              key={triad.id}
              className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-3"
              style={{ borderColor: `${triad.color}30` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: triad.color }} />
                <span className="text-[11px] font-medium" style={{ color: triad.color }}>{triad.name}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {triad.agents.map((aid) => (
                  <span
                    key={aid}
                    className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: `${triad.color}15`, color: triad.color }}
                  >
                    {TREE_NODE_MAP[aid]?.name || aid}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-2 leading-relaxed">{triad.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow cards */}
      <div className="space-y-6">
        {WORKFLOWS.map((wf) => (
          <div
            key={wf.id}
            className="rounded-xl border bg-[var(--color-admin-surface)] overflow-hidden"
            style={{ borderColor: `${wf.color}25` }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: `${wf.color}20`, backgroundColor: `${wf.color}08` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)]">{wf.name}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{wf.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">Trigger</p>
                  <p className="text-[11px] text-[var(--color-muted-light)] mt-0.5">{wf.trigger}</p>
                </div>
              </div>
            </div>

            {/* Steps chain */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-0 flex-wrap">
                {wf.steps.map((step, i) => {
                  const color = AGENT_COLORS[step.agentId] || '#6b7280';
                  const initials = agentInitials(step.agentId);
                  const isLast = i === wf.steps.length - 1;
                  return (
                    <div key={i} className="flex items-center">
                      {/* Step node */}
                      <div className="flex flex-col items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all"
                          style={{
                            backgroundColor: `${color}18`,
                            borderColor: `${color}50`,
                            color,
                          }}
                          title={step.label}
                        >
                          {initials}
                        </div>
                        <p className="text-[10px] font-medium text-[var(--color-foreground-strong)] mt-1.5 text-center leading-tight max-w-[60px]">
                          {step.label}
                        </p>
                        {step.sublabel && (
                          <p className="text-[9px] text-[var(--color-muted)] text-center leading-tight max-w-[60px]">
                            {step.sublabel}
                          </p>
                        )}
                      </div>
                      {/* Arrow connector */}
                      {!isLast && (
                        <div className="flex items-center mx-2 pb-6">
                          <div className="w-6 h-px" style={{ backgroundColor: `${wf.color}40` }} />
                          <svg width="6" height="8" viewBox="0 0 6 8" fill="none" className="shrink-0">
                            <path d="M0 0L6 4L0 8V0Z" fill={wf.color} fillOpacity="0.4" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Costs Tab
// ---------------------------------------------------------------------------

interface AgentCostRow {
  id: AgentId;
  name: string;
  actionsToday: number;
  actions7d: number;
  tokensToday: number;
  tokens7d: number;
  costToday: number;
  cost7d: number;
  avgLatencyMs: number | null;
  status: string;
}

function formatCost(n: number): string {
  if (n === 0) return '$0.000';
  if (n < 0.001) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function CostsTab() {
  const [rows, setRows] = useState<AgentCostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);
  const [total7d, setTotal7d] = useState(0);

  useEffect(() => {
    const COST_PER_TOKEN = 0.000003; // ~$3/M tokens (Sonnet blended input/output estimate)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    Promise.all([
      // Fetch a large window of recent logs to cover 7 days
      fetch('/api/admin/activity?limit=500').catch(() => null),
    ])
      .then(async ([activityRes]) => {
        let allLogs: Array<{
          agent_id: string | null;
          tokens_used: number | null;
          latency_ms: number | null;
          action: string;
          created_at: string;
        }> = [];

        if (activityRes?.ok) {
          const data = await activityRes.json();
          if (Array.isArray(data)) allLogs = data;
        }

        // Build rows from AGENT_DETAILS + logs
        const agentIds = Object.keys(AGENT_DETAILS) as AgentId[];
        const built: AgentCostRow[] = agentIds.map((id) => {
          const details = AGENT_DETAILS[id];
          const todayLogs = allLogs.filter(
            (l) => l.agent_id === id && new Date(l.created_at) >= todayStart,
          );
          const weekLogs = allLogs.filter(
            (l) => l.agent_id === id && new Date(l.created_at) >= sevenDaysAgo,
          );

          const tokensToday = todayLogs.reduce((s, l) => s + (l.tokens_used || 0), 0);
          const tokens7d = weekLogs.reduce((s, l) => s + (l.tokens_used || 0), 0);
          const latencies = weekLogs.map((l) => l.latency_ms).filter((l): l is number => l !== null);
          const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

          return {
            id,
            name: TREE_NODE_MAP[id]?.name || id,
            actionsToday: todayLogs.length,
            actions7d: weekLogs.length,
            tokensToday,
            tokens7d,
            costToday: tokensToday * COST_PER_TOKEN,
            cost7d: tokens7d * COST_PER_TOKEN,
            avgLatencyMs,
            status: 'offline',
          };
        });

        const totalTodayCost = built.reduce((s, r) => s + r.costToday, 0);
        const total7dCost = built.reduce((s, r) => s + r.cost7d, 0);

        // Sort by 7d tokens desc
        built.sort((a, b) => b.tokens7d - a.tokens7d);

        setRows(built);
        setTotalToday(totalTodayCost);
        setTotal7d(total7dCost);
      })
      .catch(() => {
        // Populate with zero data so UI still renders
        const agentIds = Object.keys(AGENT_DETAILS) as AgentId[];
        setRows(agentIds.map((id) => ({
          id,
          name: TREE_NODE_MAP[id]?.name || id,
          actionsToday: 0,
          actions7d: 0,
          tokensToday: 0,
          tokens7d: 0,
          costToday: 0,
          cost7d: 0,
          avgLatencyMs: null,
          status: 'offline',
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  // Static cost estimates from AGENT_DETAILS for reference
  const staticEstimates = Object.entries(AGENT_DETAILS).map(([id, d]) => ({
    id: id as AgentId,
    name: TREE_NODE_MAP[id as AgentId]?.name || id,
    low: d.costPerDay.low,
    medium: d.costPerDay.medium,
    high: d.costPerDay.high,
    schedule: d.schedule,
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-foreground-strong)] mb-1">Cost Dashboard</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Token consumption and estimated costs per agent. Based on ~$3/M blended tokens (Sonnet).
        </p>
      </div>

      {/* Total cost banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)] mb-1">System Cost Today</p>
          <p className="text-2xl font-semibold text-[var(--color-foreground-strong)]">
            {loading ? '—' : formatCost(totalToday)}
          </p>
          <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Based on logged token usage</p>
        </div>
        <div className="rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] p-4">
          <p className="text-xs text-[var(--color-muted)] mb-1">7-Day Total</p>
          <p className="text-2xl font-semibold text-[var(--color-foreground-strong)]">
            {loading ? '—' : formatCost(total7d)}
          </p>
          <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Rolling 7-day window</p>
        </div>
      </div>

      {/* Live usage table */}
      <div>
        <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Agent Usage — Live</p>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] py-8">
            <span className="w-4 h-4 border-2 border-[#7c9bf5]/30 border-t-[#7c9bf5] rounded-full animate-spin" />
            Loading agent logs...
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">Agent</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden sm:table-cell">Actions Today</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden md:table-cell">7-Day Actions</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">Tokens Today</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden sm:table-cell">7-Day Tokens</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">Cost Today</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden md:table-cell">7-Day Cost</th>
                  <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden lg:table-cell">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-admin-border)]">
                {rows.map((row) => {
                  const hasActivity = row.actions7d > 0;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[var(--color-admin-bg)]/50 transition-colors ${hasActivity ? '' : 'opacity-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                            style={{
                              backgroundColor: `${AGENT_COLORS[row.id] || '#6b7280'}20`,
                              color: AGENT_COLORS[row.id] || '#6b7280',
                            }}
                          >
                            {agentInitials(row.id)}
                          </div>
                          <span className="font-medium text-[var(--color-foreground-strong)]">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--color-muted-light)] hidden sm:table-cell">
                        {row.actionsToday > 0 ? row.actionsToday : <span className="text-[var(--color-muted)]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--color-muted-light)] hidden md:table-cell">
                        {row.actions7d > 0 ? row.actions7d : <span className="text-[var(--color-muted)]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--color-muted-light)]">
                        {row.tokensToday > 0 ? formatTokens(row.tokensToday) : <span className="text-[var(--color-muted)]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--color-muted-light)] hidden sm:table-cell">
                        {row.tokens7d > 0 ? formatTokens(row.tokens7d) : <span className="text-[var(--color-muted)]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {row.costToday > 0
                          ? <span className="text-[var(--color-foreground-strong)]">{formatCost(row.costToday)}</span>
                          : <span className="text-[var(--color-muted)]">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-right hidden md:table-cell">
                        {row.cost7d > 0
                          ? <span className="text-[var(--color-foreground-strong)]">{formatCost(row.cost7d)}</span>
                          : <span className="text-[var(--color-muted)]">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--color-muted)] hidden lg:table-cell">
                        {row.avgLatencyMs !== null ? `${row.avgLatencyMs.toLocaleString()}ms` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Static cost estimates by tier */}
      <div>
        <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Estimated Cost Per Day — By Cost Tier</p>
        <div className="rounded-xl border border-[var(--color-admin-border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-admin-border)] bg-[var(--color-admin-bg)]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">Agent</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">$ Low</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">$$ Medium</th>
                <th className="px-3 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">$$$ High</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium hidden md:table-cell">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-admin-border)]">
              {staticEstimates.map((est) => (
                <tr key={est.id} className="hover:bg-[var(--color-admin-bg)]/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                        style={{
                          backgroundColor: `${AGENT_COLORS[est.id] || '#6b7280'}20`,
                          color: AGENT_COLORS[est.id] || '#6b7280',
                        }}
                      >
                        {agentInitials(est.id)}
                      </div>
                      <span className="font-medium text-[var(--color-foreground-strong)]">{est.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--color-muted-light)]">{est.low}</td>
                  <td className="px-3 py-3 text-center text-[var(--color-foreground-strong)] font-medium">{est.medium}</td>
                  <td className="px-3 py-3 text-center text-[var(--color-muted-light)]">{est.high}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)] hidden md:table-cell">{est.schedule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[var(--color-muted)] mt-2">
          Cost tier is controlled via the Dashboard cost toggle ($/$$/$$$). Pipeline agents (Visionary, Architect, Oracle) are on-demand — cost is per run, not per day.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'system', label: 'System', description: 'Live Tree of Life with real-time agent health' },
  { id: 'workflows', label: 'Workflows', description: 'Pipeline flow visualizations' },
  { id: 'costs', label: 'Costs', description: 'Per-agent token usage and cost breakdown' },
];

export default function AdminTolaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const [kiosk, setKiosk] = useState(false);

  // F11 or Escape to toggle kiosk
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); setKiosk(k => !k); }
      if (e.key === 'Escape' && kiosk) setKiosk(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [kiosk]);

  // Hide sidebar in kiosk mode
  useEffect(() => {
    const sidebar = document.querySelector('aside');
    const mobileNav = document.querySelector('.md\\:hidden.fixed.bottom-0');
    if (kiosk) {
      sidebar?.classList.add('!hidden');
      mobileNav?.classList.add('!hidden');
    } else {
      sidebar?.classList.remove('!hidden');
      mobileNav?.classList.remove('!hidden');
    }
    return () => {
      sidebar?.classList.remove('!hidden');
      mobileNav?.classList.remove('!hidden');
    };
  }, [kiosk]);

  return (
    <div className={`flex flex-col h-full ${kiosk ? 'fixed inset-0 z-[90] bg-[var(--color-admin-bg)]' : ''}`}>
      {/* Tab bar */}
      <div className="px-6 pt-4 pb-0 border-b border-[var(--color-admin-border)] shrink-0 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.description}
            className={[
              'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative cursor-pointer',
              activeTab === tab.id
                ? 'text-[var(--color-accent)] bg-[var(--color-admin-surface)] border border-b-0 border-[var(--color-admin-border)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)]',
            ].join(' ')}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--color-admin-surface)' }}
              />
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setKiosk(k => !k)}
            title={kiosk ? 'Exit fullscreen (Esc)' : 'Fullscreen mode (F11)'}
            className="px-2.5 py-1.5 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] border border-[var(--color-admin-border)] rounded-lg transition-colors cursor-pointer"
          >
            {kiosk ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'system' && <TolaTreeOS />}
        {activeTab === 'workflows' && (
          <div className="h-full overflow-y-auto">
            <WorkflowsTab />
          </div>
        )}
        {activeTab === 'costs' && (
          <div className="h-full overflow-y-auto">
            <CostsTab />
          </div>
        )}
      </div>
    </div>
  );
}
