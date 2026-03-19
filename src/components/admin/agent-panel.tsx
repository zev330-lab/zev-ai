'use client';

import { useState, useEffect, useCallback } from 'react';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import type { TolaAgent, TolaAgentLog } from '@/lib/tola-agents';
import { STATUS_COLORS, GEOMETRY_LABELS } from '@/lib/tola-agents';

interface AgentPanelProps {
  agent: TolaAgent;
  onClose: () => void;
  onToggleKillSwitch?: (agentId: string, value: boolean) => void;
  onTierChange?: (agentId: string, tier: number) => void;
}

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Autonomous (80%)',
  2: 'Tier 2 — Notify & proceed (15%)',
  3: 'Tier 3 — Human decides (5%)',
};

interface SubAgentData {
  projects?: { active: number; nextMilestone: string | null };
  finance?: { revenue: number; outstanding: number };
  family?: { pendingTasks: number; nextEvent: string | null };
  knowledge?: { totalEntries: number };
}

export function AgentPanel({ agent, onClose, onToggleKillSwitch, onTierChange }: AgentPanelProps) {
  const GeometryIcon = GEOMETRY_COMPONENTS[agent.geometry_engine];
  const statusColor = STATUS_COLORS[agent.status];
  const [logs, setLogs] = useState<TolaAgentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState(false);
  const [subAgentData, setSubAgentData] = useState<SubAgentData>({});

  // Fetch recent logs for this agent
  useEffect(() => {
    setLogsLoading(true);
    fetch(`/api/admin/agents/${agent.id}/logs`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data.slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [agent.id]);

  // Fetch sub-agent data for Architect and Foundation
  useEffect(() => {
    if (agent.id === 'architect') {
      fetch('/api/admin/projects?status=active')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSubAgentData((prev) => ({ ...prev, projects: { active: data.length, nextMilestone: null } }));
          }
        })
        .catch(() => {});
    }
    if (agent.id === 'foundation') {
      fetch('/api/admin/finance')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setSubAgentData((prev) => ({ ...prev, finance: { revenue: data.revenueThisMonth || 0, outstanding: data.outstandingTotal || 0 } }));
          }
        })
        .catch(() => {});
    }
    if (agent.id === 'catalyst') {
      fetch('/api/admin/family?status=pending')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSubAgentData((prev) => ({ ...prev, family: { pendingTasks: data.length, nextEvent: null } }));
          }
        })
        .catch(() => {});
      fetch('/api/admin/family?view=events')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSubAgentData((prev) => ({ ...prev, family: { ...prev.family!, nextEvent: `${data[0].title} (${data[0].date})` } }));
          }
        })
        .catch(() => {});
    }
    if (agent.id === 'oracle') {
      fetch('/api/admin/knowledge')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSubAgentData((prev) => ({ ...prev, knowledge: { totalEntries: data.length } }));
          }
        })
        .catch(() => {});
    }
  }, [agent.id]);

  // Heartbeat staleness check
  const heartbeatAge = agent.last_heartbeat
    ? Date.now() - new Date(agent.last_heartbeat).getTime()
    : null;
  const isStale = heartbeatAge !== null && heartbeatAge > 10 * 60 * 1000; // 10 min

  const handleTrigger = useCallback(async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/admin/agents/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent.id }),
      });
      const data = await res.json();
      setTriggerResult(
        res.ok
          ? `Success: ${JSON.stringify(data.result?.status || data.result || 'done')}`
          : `Error: ${data.error || 'Unknown error'}`,
      );
    } catch (err) {
      setTriggerResult(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setTriggering(false);
    }
  }, [agent.id]);

  const handleKillSwitch = () => {
    if (!agent.kill_switch) {
      // Turning ON — confirm first
      setConfirmKill(true);
    } else {
      // Turning OFF — no confirm needed
      onToggleKillSwitch?.(agent.id, false);
    }
  };

  const confirmKillSwitch = () => {
    onToggleKillSwitch?.(agent.id, true);
    setConfirmKill(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-full max-w-md bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-admin-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {GeometryIcon && (
              <GeometryIcon size={28} color="var(--color-accent)" animate />
            )}
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
                {agent.display_name}
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                {GEOMETRY_LABELS[agent.geometry_engine]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-xs font-medium capitalize text-[var(--color-foreground-strong)]">
                {agent.status}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] transition-colors text-xl leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">Description</p>
            <p className="text-sm text-[var(--color-muted-light)] leading-relaxed">{agent.description}</p>
          </div>

          {/* Last Heartbeat */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">Last Heartbeat</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-[var(--color-muted-light)]">
                {agent.last_heartbeat ? new Date(agent.last_heartbeat).toLocaleString() : 'Never'}
              </p>
              {isStale && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                  STALE
                </span>
              )}
            </div>
          </div>

          {/* Tier Selector */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">Decision Tier</p>
            <select
              value={agent.tier}
              onChange={(e) => onTierChange?.(agent.id, Number(e.target.value))}
              className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              {[1, 2, 3].map((t) => (
                <option key={t} value={t}>{TIER_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Manual Trigger */}
          <div className="pt-4 border-t border-[var(--color-admin-border)]">
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Manual Trigger</p>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="w-full px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {triggering ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </span>
              ) : (
                `Trigger ${agent.display_name}`
              )}
            </button>
            {triggerResult && (
              <p className={`mt-2 text-xs ${triggerResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {triggerResult}
              </p>
            )}
          </div>

          {/* Kill Switch */}
          <div className="pt-4 border-t border-[var(--color-admin-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground-strong)]">Kill Switch</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Immediately disable this agent
                </p>
              </div>
              <button
                onClick={handleKillSwitch}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  agent.kill_switch ? 'bg-red-500' : 'bg-[var(--color-admin-border)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    agent.kill_switch ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {confirmKill && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 mb-2">
                  This will stop {agent.display_name} from executing. Continue?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmKillSwitch}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded font-medium cursor-pointer"
                  >
                    Disable Agent
                  </button>
                  <button
                    onClick={() => setConfirmKill(false)}
                    className="px-3 py-1 text-xs text-[var(--color-muted-light)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Agents (fractal scaling) */}
          {agent.id === 'architect' && subAgentData.projects && (
            <div className="pt-4 border-t border-[var(--color-admin-border)]">
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Sub-Agents</p>
              <a href="/admin/projects" className="block bg-[var(--color-admin-bg)] rounded-lg p-4 hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-accent)]">Architect-Projects</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                    {subAgentData.projects.active} active
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Tracks all consulting and personal projects, milestones, and time
                </p>
              </a>
            </div>
          )}

          {agent.id === 'foundation' && subAgentData.finance && (
            <div className="pt-4 border-t border-[var(--color-admin-border)]">
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Sub-Agents</p>
              <a href="/admin/finance" className="block bg-[var(--color-admin-bg)] rounded-lg p-4 hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-accent)]">Foundation-Finance</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-muted-light)] mt-1">
                  <span>${subAgentData.finance.revenue.toLocaleString()} revenue</span>
                  <span>${subAgentData.finance.outstanding.toLocaleString()} outstanding</span>
                </div>
              </a>
            </div>
          )}

          {agent.id === 'catalyst' && subAgentData.family && (
            <div className="pt-4 border-t border-[var(--color-admin-border)]">
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Sub-Agents</p>
              <a href="/admin/family" className="block bg-[var(--color-admin-bg)] rounded-lg p-4 hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-accent)]">Catalyst-Family</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                    {subAgentData.family.pendingTasks} pending
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  {subAgentData.family.nextEvent ? `Next: ${subAgentData.family.nextEvent}` : 'Family coordination, tasks, and events'}
                </p>
              </a>
            </div>
          )}

          {agent.id === 'oracle' && subAgentData.knowledge && (
            <div className="pt-4 border-t border-[var(--color-admin-border)]">
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Sub-Agents</p>
              <a href="/admin/knowledge" className="block bg-[var(--color-admin-bg)] rounded-lg p-4 hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--color-accent)]">Oracle-Knowledge</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
                    {subAgentData.knowledge.totalEntries} entries
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Second brain — semantic search across all knowledge
                </p>
              </a>
            </div>
          )}

          {/* Recent Activity */}
          <div className="pt-4 border-t border-[var(--color-admin-border)]">
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">
              Recent Activity
            </p>
            {logsLoading ? (
              <p className="text-xs text-[var(--color-muted)]">Loading...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)]">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--color-foreground-strong)]">{log.action}</span>
                      {typeof log.latency_ms === 'number' && (
                        <span className="text-[var(--color-muted)] ml-1">{log.latency_ms}ms</span>
                      )}
                      <p className="text-[var(--color-muted)] mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
