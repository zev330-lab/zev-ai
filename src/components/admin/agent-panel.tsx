'use client';

import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import type { TolaAgent } from '@/lib/tola-agents';
import { STATUS_COLORS, GEOMETRY_LABELS } from '@/lib/tola-agents';

interface AgentPanelProps {
  agent: TolaAgent;
  onClose: () => void;
  onToggleKillSwitch?: (agentId: string, value: boolean) => void;
}

export function AgentPanel({ agent, onClose, onToggleKillSwitch }: AgentPanelProps) {
  const GeometryIcon = GEOMETRY_COMPONENTS[agent.geometry_engine];
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-admin-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {GeometryIcon && (
              <GeometryIcon size={28} color="var(--color-accent)" animate />
            )}
            <h2 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
              {agent.display_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] transition-colors text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Status */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
              Status
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-sm font-medium capitalize text-[var(--color-foreground-strong)]">
                {agent.status}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
              Description
            </p>
            <p className="text-sm text-[var(--color-muted-light)] leading-relaxed">
              {agent.description}
            </p>
          </div>

          {/* Geometry Engine */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
              Geometry Engine
            </p>
            <p className="text-sm text-[var(--color-foreground-strong)]">
              {GEOMETRY_LABELS[agent.geometry_engine]}
            </p>
          </div>

          {/* Tier */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
              Decision Tier
            </p>
            <p className="text-sm text-[var(--color-foreground-strong)]">
              Tier {agent.tier} &mdash;{' '}
              {agent.tier === 1
                ? 'Autonomous (80%)'
                : agent.tier === 2
                  ? 'Notify & proceed (15%)'
                  : 'Human decides (5%)'}
            </p>
          </div>

          {/* Last Heartbeat */}
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
              Last Heartbeat
            </p>
            <p className="text-sm text-[var(--color-muted-light)]">
              {agent.last_heartbeat
                ? new Date(agent.last_heartbeat).toLocaleString()
                : 'Never'}
            </p>
          </div>

          {/* Kill Switch */}
          <div className="pt-4 border-t border-[var(--color-admin-border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground-strong)]">
                  Kill Switch
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Immediately disable this agent
                </p>
              </div>
              <button
                onClick={() =>
                  onToggleKillSwitch?.(agent.id, !agent.kill_switch)
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  agent.kill_switch
                    ? 'bg-red-500'
                    : 'bg-[var(--color-admin-border)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    agent.kill_switch
                      ? 'translate-x-[22px]'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground-strong)]">
                Active
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Whether this agent processes requests
              </p>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                agent.is_active ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
          </div>

          {/* Config preview */}
          {agent.config && Object.keys(agent.config).length > 0 && (
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-2">
                Config
              </p>
              <pre className="text-xs text-[var(--color-muted-light)] bg-[var(--color-admin-bg)] rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(agent.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
