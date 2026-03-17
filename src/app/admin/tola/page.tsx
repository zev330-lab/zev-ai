'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AgentNode, type AgentNodeData } from '@/components/admin/agent-node';
import { AgentPanel } from '@/components/admin/agent-panel';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { useRealtimeAgents } from '@/hooks/use-realtime-agents';
import {
  TOLA_AGENTS,
  TREE_OF_LIFE_EDGES,
  STATUS_COLORS,
  type AgentId,
  type TolaAgent,
  type TolaAgentStatic,
} from '@/lib/tola-agents';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';

// Register custom node types outside component to avoid re-renders
const nodeTypes = { agent: AgentNode };

// Convert static agent data to TolaAgent for panel display when live data isn't available
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

export default function TolaAdminPage() {
  const { agents, loading } = useRealtimeAgents();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);

  // Merge static data with live state
  const agentMap = useMemo(() => {
    const map = new Map<string, TolaAgent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  // Selected agent: prefer live data, fall back to static
  const selectedAgent = useMemo(() => {
    if (!selectedId) return null;
    const live = agentMap.get(selectedId);
    if (live) return live;
    const staticAgent = TOLA_AGENTS.find((a) => a.id === selectedId);
    return staticAgent ? staticToLive(staticAgent) : null;
  }, [selectedId, agentMap]);

  // Build React Flow nodes
  const nodes: Node<AgentNodeData>[] = useMemo(
    () =>
      TOLA_AGENTS.map((agent) => {
        const live = agentMap.get(agent.id);
        return {
          id: agent.id,
          type: 'agent' as const,
          position: agent.position,
          data: {
            label: agent.display_name,
            geometryEngine: agent.geometry_engine,
            status: live?.status ?? 'offline',
            description: agent.description,
            tier: agent.tier,
          },
        };
      }),
    [agentMap],
  );

  // Build React Flow edges
  const edges: Edge[] = useMemo(
    () =>
      TREE_OF_LIFE_EDGES.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        style: {
          stroke: 'rgba(22, 26, 46, 0.8)',
          strokeWidth: 1.5,
        },
      })),
    [],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id as AgentId);
  }, []);

  const handleToggleKillSwitch = useCallback(
    async (agentId: string, value: boolean) => {
      try {
        await fetch('/api/admin/agents', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: agentId, kill_switch: value }),
        });
      } catch (err) {
        console.error('Failed to toggle kill switch:', err);
      }
    },
    [],
  );

  const healthyCount = agents.filter((a) => a.status === 'healthy').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">
            Tree of Life
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {agents.length > 0
              ? `${agents.length} agents \u00b7 ${healthyCount} healthy`
              : '11 agents \u00b7 loading state\u2026'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-[var(--color-muted)] capitalize">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Tree of Life canvas — desktop */}
        <div className="hidden md:block flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-[var(--color-muted)]">
                Loading agents...
              </p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              minZoom={0.4}
              maxZoom={1.5}
              className="!bg-[var(--color-admin-bg)]"
            >
              <Background
                color="rgba(22, 26, 46, 0.5)"
                gap={40}
                size={1}
              />
              <Controls
                showInteractive={false}
                className="!bg-[var(--color-admin-surface)] !border-[var(--color-admin-border)] !shadow-none [&>button]:!bg-[var(--color-admin-surface)] [&>button]:!border-[var(--color-admin-border)] [&>button]:!fill-[var(--color-muted-light)] [&>button:hover]:!bg-[var(--color-admin-bg)]"
              />
            </ReactFlow>
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
                    {GeometryIcon && (
                      <GeometryIcon
                        size={32}
                        color="var(--color-accent)"
                        animate
                      />
                    )}
                    <div
                      className="absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-admin-surface)]"
                      style={{ backgroundColor: statusColor }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-foreground-strong)]">
                    {agent.display_name}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] capitalize">
                    {status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity feed sidebar — large screens */}
        <div className="hidden lg:flex flex-col w-80 border-l border-[var(--color-admin-border)]">
          <div className="px-4 py-3 border-b border-[var(--color-admin-border)]">
            <h2 className="text-sm font-medium text-[var(--color-foreground-strong)]">
              Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Agent detail panel overlay */}
      {selectedAgent && (
        <AgentPanel
          agent={selectedAgent}
          onClose={() => setSelectedId(null)}
          onToggleKillSwitch={handleToggleKillSwitch}
        />
      )}
    </div>
  );
}
