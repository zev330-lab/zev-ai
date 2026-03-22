'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TreeOfLife } from '@/components/tree-of-life';
import { AgentPanel } from '@/components/admin/agent-panel';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { useRealtimeAgents } from '@/hooks/use-realtime-agents';
import {
  TOLA_AGENTS,
  STATUS_COLORS,
  GEOMETRY_LABELS,
  type AgentId,
  type TolaAgent,
  type TolaAgentStatic,
  type TolaAgentLog,
} from '@/lib/tola-agents';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';

// Agent dot colors for leaderboard — matches status palette but is distinct per agent
const AGENT_COLORS: Record<string, string> = {
  crown:      '#c4b5e0',
  visionary:  '#7c9bf5',
  architect:  '#60a5fa',
  oracle:     '#a78bfa',
  guardian:   '#4ade80',
  catalyst:   '#fb923c',
  nexus:      '#38bdf8',
  sentinel:   '#f472b6',
  prism:      '#facc15',
  foundation: '#94a3b8',
  gateway:    '#6ee7b7',
};

function staticToLive(agent: TolaAgentStatic): TolaAgent {
  return {
    id: agent.id,
    node_name: agent.node_name,
    geometry_engine: agent.geometry_engine,
    display_name: agent.display_name,
    description: agent.description,
    status: 'offline',
    tier: agent.tier,
    last_heartbeat: null,
    config: {},
    is_active: true,
    kill_switch: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface AgentCostRow {
  agent_id: string;
  tokens: number;
  actions: number;
  cost: number;
}

export default function AdminAgentsPage() {
  const { agents, loading, error } = useRealtimeAgents();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [agentLogs, setAgentLogs] = useState<Record<string, TolaAgentLog[]>>({});
  const [agentStats, setAgentStats] = useState<Record<string, { total: number; avgLatency: number }>>({});
  const [agentCosts, setAgentCosts] = useState<AgentCostRow[]>([]);

  // Fetch logs for ALL agents
  useEffect(() => {
    if (agents.length === 0 && TOLA_AGENTS.length === 0) return;
    const allIds = TOLA_AGENTS.map((a) => a.id);
    Promise.all(
      allIds.map(async (id) => {
        try {
          const res = await fetch(`/api/admin/agents/${id}/logs`);
          if (!res.ok) return { id, logs: [] };
          const data = await res.json();
          return { id, logs: Array.isArray(data) ? data : [] };
        } catch {
          return { id, logs: [] };
        }
      })
    ).then((results) => {
      const logsMap: Record<string, TolaAgentLog[]> = {};
      const statsMap: Record<string, { total: number; avgLatency: number }> = {};
      for (const { id, logs } of results) {
        logsMap[id] = logs;
        const latencies = logs.filter((l: TolaAgentLog) => typeof l.latency_ms === 'number').map((l: TolaAgentLog) => l.latency_ms as number);
        statsMap[id] = {
          total: logs.length,
          avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length) : 0,
        };
      }
      setAgentLogs(logsMap);
      setAgentStats(statsMap);
    });
  }, [agents]);

  // Fetch 7-day agent cost/action totals from stats API (for leaderboard)
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.agent_costs && Array.isArray(data.agent_costs)) {
          setAgentCosts(data.agent_costs as AgentCostRow[]);
        }
      })
      .catch(() => {});
  }, []);

  const agentMap = useMemo(() => {
    const map = new Map<string, TolaAgent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  const selectedAgent = useMemo(() => {
    if (!selectedId) return null;
    const live = agentMap.get(selectedId);
    if (live) return live;
    const staticAgent = TOLA_AGENTS.find((a) => a.id === selectedId);
    return staticAgent ? staticToLive(staticAgent) : null;
  }, [selectedId, agentMap]);

  const agentStatuses = useMemo(() => {
    const record: Record<string, { status: 'healthy' | 'degraded' | 'critical' | 'offline' }> = {};
    TOLA_AGENTS.forEach((a) => {
      const live = agentMap.get(a.id);
      record[a.id] = { status: live?.status ?? 'offline' };
    });
    return record;
  }, [agentMap]);

  const handleNodeClick = useCallback((agentId: AgentId) => {
    setSelectedId(agentId);
  }, []);

  const handleToggleKillSwitch = useCallback(async (agentId: string, value: boolean) => {
    try {
      await fetch('/api/admin/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, kill_switch: value }),
      });
    } catch (err) {
      console.error('Failed to toggle kill switch:', err);
    }
  }, []);

  const handleTierChange = useCallback(async (agentId: string, tier: number) => {
    try {
      await fetch('/api/admin/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, tier }),
      });
    } catch (err) {
      console.error('Failed to change tier:', err);
    }
  }, []);

  // Leaderboard: 7-day rankings from stats API, MVP from per-agent log counts
  const leaderboardRankings = useMemo(() => {
    // Merge stats API data with display names from TOLA_AGENTS
    const nameMap = new Map(TOLA_AGENTS.map((a) => [a.id, a.display_name]));

    // Start from all 11 agents so unactive agents still appear at rank 11
    const all = TOLA_AGENTS.map((a) => {
      const cost = agentCosts.find((c) => c.agent_id === a.id);
      return {
        id: a.id,
        name: nameMap.get(a.id) ?? a.id,
        actions: cost?.actions ?? 0,
        tokens: cost?.tokens ?? 0,
      };
    });

    return all.sort((a, b) => b.actions - a.actions);
  }, [agentCosts]);

  const todayMvp = useMemo(() => {
    // Use per-agent log totals already in agentStats (fetched per agent)
    const entries = TOLA_AGENTS.map((a) => ({
      id: a.id,
      name: a.display_name,
      total: agentStats[a.id]?.total ?? 0,
    }));
    const top = entries.sort((a, b) => b.total - a.total)[0];
    return top?.total > 0 ? top : null;
  }, [agentStats]);

  const maxActions7d = leaderboardRankings[0]?.actions ?? 1;

  const healthyCount = agents.filter((a) => a.status === 'healthy').length;
  const degradedCount = agents.filter((a) => a.status === 'degraded').length;
  const criticalCount = agents.filter((a) => a.status === 'critical').length;
  const offlineCount = agents.length > 0
    ? agents.length - healthyCount - degradedCount - criticalCount
    : 11;

  // Show ALL 11 agents as cards
  const allAgentIds: AgentId[] = TOLA_AGENTS.map((a) => a.id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">TOLA Agents</h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {agents.length > 0
                ? `${agents.length} agents \u00b7 ${healthyCount} healthy`
                : '11 agents \u00b7 loading state\u2026'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[var(--color-muted)] capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-xs flex-wrap">
          <StatusStat label="healthy" count={healthyCount} color="#4ade80" />
          {degradedCount > 0 && <StatusStat label="degraded" count={degradedCount} color="#f59e0b" />}
          {criticalCount > 0 && <StatusStat label="critical" count={criticalCount} color="#ef4444" />}
          <StatusStat label="offline" count={offlineCount} color="#6b7280" />
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">Connection error: {error}</p>
        )}
      </div>

      {/* Agent cards grid */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Leaderboard */}
        <div className="mb-8 bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-admin-border)] flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">Agent Leaderboard</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-admin-border)]">

            {/* MVP Card */}
            <div className="p-5 flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L14.09 8.26L20.18 9.27L15.59 13.74L16.83 20.03L12 17.27L7.17 20.03L8.41 13.74L3.82 9.27L9.91 8.26L12 2Z" fill="#facc15" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">Most Active Today</span>
              </div>
              {todayMvp ? (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        backgroundColor: `${AGENT_COLORS[todayMvp.id] ?? '#7c9bf5'}22`,
                        color: AGENT_COLORS[todayMvp.id] ?? '#7c9bf5',
                        border: `1.5px solid ${AGENT_COLORS[todayMvp.id] ?? '#7c9bf5'}55`,
                      }}
                    >
                      {todayMvp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-foreground-strong)] leading-tight">{todayMvp.name}</p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        <span className="text-[var(--color-accent)] font-medium">{todayMvp.total.toLocaleString()}</span> actions logged
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-admin-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: '100%', backgroundColor: AGENT_COLORS[todayMvp.id] ?? '#7c9bf5' }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-[var(--color-muted)]">No agent activity yet today</p>
                  <p className="text-[10px] text-[var(--color-muted)]/60 mt-1">Agents will appear as they run</p>
                </div>
              )}
            </div>

            {/* 7-day rankings */}
            <div className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)] mb-3">Rankings — 7 days</p>
              <div className="space-y-2">
                {leaderboardRankings.map((agent, idx) => {
                  const barPct = maxActions7d > 0 ? Math.round((agent.actions / maxActions7d) * 100) : 0;
                  const color = AGENT_COLORS[agent.id] ?? '#7c9bf5';
                  const isMvp = idx === 0 && agent.actions > 0;
                  return (
                    <div key={agent.id} className="flex items-center gap-3 group">
                      {/* Rank */}
                      <span
                        className="text-[10px] font-mono w-5 shrink-0 text-right"
                        style={{ color: idx < 3 && agent.actions > 0 ? color : 'var(--color-muted)' }}
                      >
                        #{idx + 1}
                      </span>
                      {/* Dot */}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: agent.actions > 0 ? color : 'var(--color-admin-border)' }}
                      />
                      {/* Name */}
                      <span
                        className="text-[11px] w-20 shrink-0 truncate"
                        style={{ color: agent.actions > 0 ? 'var(--color-foreground-strong)' : 'var(--color-muted)' }}
                      >
                        {agent.name}
                        {isMvp && (
                          <svg className="inline ml-1 -mt-0.5" width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 2L14.09 8.26L20.18 9.27L15.59 13.74L16.83 20.03L12 17.27L7.17 20.03L8.41 13.74L3.82 9.27L9.91 8.26L12 2Z" fill="#facc15" />
                          </svg>
                        )}
                      </span>
                      {/* Bar */}
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-admin-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: color,
                            opacity: agent.actions > 0 ? 1 : 0,
                          }}
                        />
                      </div>
                      {/* Count */}
                      <span className="text-[10px] font-mono w-8 text-right shrink-0 text-[var(--color-muted)]">
                        {agent.actions > 0 ? agent.actions.toLocaleString() : '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {allAgentIds.map((agentId) => {
            const agent = TOLA_AGENTS.find((a) => a.id === agentId)!;
            const live = agentMap.get(agentId);
            const status = live?.status ?? 'offline';
            const statusColor = STATUS_COLORS[status];
            const GeometryIcon = GEOMETRY_COMPONENTS[agent.geometry_engine];
            const stats = agentStats[agentId];
            const lastHeartbeat = live?.last_heartbeat;

            return (
              <button
                key={agentId}
                onClick={() => setSelectedId(agentId)}
                className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:border-[var(--color-accent)]/40 active:scale-[0.98] cursor-pointer text-left"
              >
                <div className="relative">
                  {GeometryIcon && <GeometryIcon size={36} color="var(--color-accent)" animate />}
                  <div
                    className="absolute -top-1 -right-3 w-3 h-3 rounded-full border-2 border-[var(--color-admin-surface)]"
                    style={{ backgroundColor: statusColor }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-foreground-strong)]">
                    {agent.display_name}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                    {GEOMETRY_LABELS[agent.geometry_engine]}
                  </p>
                </div>
                <div className="w-full space-y-1.5 mt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--color-muted)]">Status</span>
                    <span className="capitalize" style={{ color: statusColor }}>{status}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--color-muted)]">Last active</span>
                    <span className="text-[var(--color-muted-light)]">
                      {lastHeartbeat ? relativeTime(lastHeartbeat) : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--color-muted)]">Actions</span>
                    <span className="text-[var(--color-muted-light)]">{stats?.total ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--color-muted)]">Avg latency</span>
                    <span className="text-[var(--color-muted-light)]">
                      {stats?.avgLatency ? `${stats.avgLatency}ms` : '--'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Two column: Tree of Life + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tree of Life */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 flex items-center justify-center">
            {loading ? (
              <p className="text-sm text-[var(--color-muted)]">Loading agents...</p>
            ) : (
              <div className="w-full max-w-[340px] aspect-[5/7]">
                <TreeOfLife
                  mode="dashboard"
                  agents={agentStatuses}
                  onNodeClick={handleNodeClick}
                  highlightNode={selectedId}
                />
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <h2 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-4">
              Agent Activity
            </h2>
            <div className="max-h-96 overflow-y-auto">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>

      {/* Agent detail panel */}
      {selectedAgent && (
        <AgentPanel
          agent={selectedAgent}
          onClose={() => setSelectedId(null)}
          onToggleKillSwitch={handleToggleKillSwitch}
          onTierChange={handleTierChange}
        />
      )}
    </div>
  );
}

function StatusStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[var(--color-muted-light)]">
        {count} {label}
      </span>
    </div>
  );
}
