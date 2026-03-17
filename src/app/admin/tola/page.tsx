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
} from '@/lib/tola-agents';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';

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

interface AdminStats {
  actions_today: number;
  pipelines_today: number;
  tier3_queue: number;
}

export default function TolaAdminPage() {
  const { agents, loading, error } = useRealtimeAgents();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Fetch admin stats
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
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

  const healthyCount = agents.filter((a) => a.status === 'healthy').length;
  const degradedCount = agents.filter((a) => a.status === 'degraded').length;
  const criticalCount = agents.filter((a) => a.status === 'critical').length;
  const offlineCount = agents.length > 0
    ? agents.length - healthyCount - degradedCount - criticalCount
    : 11;

  return (
    <div className="flex flex-col h-full">
      {/* Header + overview stats */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Tree of Life</h1>
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
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[var(--color-muted-light)]">{healthyCount} healthy</span>
          </div>
          {degradedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[var(--color-muted-light)]">{degradedCount} degraded</span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[var(--color-muted-light)]">{criticalCount} critical</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-[var(--color-muted-light)]">{offlineCount} offline</span>
          </div>
          {stats && (
            <>
              <div className="w-px h-3 bg-[var(--color-admin-border)]" />
              <span className="text-[var(--color-muted-light)]">{stats.actions_today} actions today</span>
              <span className="text-[var(--color-muted-light)]">{stats.pipelines_today} pipelines</span>
              {stats.tier3_queue > 0 && (
                <span className="text-amber-400 font-medium">{stats.tier3_queue} in review queue</span>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">Connection error: {error}</p>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Tree of Life canvas */}
        <div className="hidden md:flex flex-1 relative items-center justify-center p-8">
          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">Loading agents...</p>
          ) : (
            <div className="w-full max-w-[380px] h-full max-h-[665px]">
              <TreeOfLife
                mode="dashboard"
                agents={agentStatuses}
                onNodeClick={handleNodeClick}
                highlightNode={selectedId}
              />
            </div>
          )}
        </div>

        {/* Mobile card stack */}
        <div className="md:hidden flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {TOLA_AGENTS.map((agent) => {
              const live = agentMap.get(agent.id);
              const status = live?.status ?? 'offline';
              const statusColor = STATUS_COLORS[status];
              const GeometryIcon = GEOMETRY_COMPONENTS[agent.geometry_engine];

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedId(agent.id)}
                  className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:border-[var(--color-accent)]/60 active:scale-[0.97] cursor-pointer"
                >
                  <div className="relative">
                    {GeometryIcon && <GeometryIcon size={32} color="var(--color-accent)" animate />}
                    <div
                      className="absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-admin-surface)]"
                      style={{ backgroundColor: statusColor }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-foreground-strong)]">
                    {agent.display_name}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {GEOMETRY_LABELS[agent.geometry_engine]}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] capitalize">{status}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity feed sidebar */}
        <div className="hidden lg:flex flex-col w-80 border-l border-[var(--color-admin-border)]">
          <div className="px-4 py-3 border-b border-[var(--color-admin-border)]">
            <h2 className="text-sm font-medium text-[var(--color-foreground-strong)]">Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ActivityFeed />
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
