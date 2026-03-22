'use client';

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  Handle,
  Position,
  getStraightPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import { AgentPanel } from '@/components/admin/agent-panel';
import {
  TREE_NODES,
  TREE_PATHS,
  TREE_NODE_MAP,
  HEALTH_COLORS,
  STATUS_COLORS,
  GEOMETRY_LABELS,
  TOLA_AGENTS,
  type AgentId,
  type AgentStatus,
  type TolaAgent,
  type TolaAgentStatic,
  type TolaAgentLog,
} from '@/lib/tola-agents';
import { useRealtimeAgents, useRealtimeActivityFeed } from '@/hooks/use-realtime-agents';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const NODE_SIZE = 80;
const SCALE = 1.4; // Scale up from viewBox (0 0 500 700) for React Flow spacing

function staticToLive(agent: TolaAgentStatic): TolaAgent {
  return {
    id: agent.id, node_name: agent.node_name, geometry_engine: agent.geometry_engine,
    display_name: agent.display_name, description: agent.description, status: 'offline',
    tier: agent.tier, last_heartbeat: null, config: {}, is_active: true, kill_switch: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
}

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

function getActiveAgents(logs: TolaAgentLog[]): Set<string> {
  const cutoff = Date.now() - 60 * 60 * 1000; // 60 min window (matches reduced cron schedules)
  const active = new Set<string>();
  for (const log of logs) {
    if (log.agent_id && new Date(log.created_at).getTime() > cutoff) active.add(log.agent_id);
  }
  return active;
}

// Compute health dynamically from heartbeat age + error count instead of trusting stored status
function computeHealth(agent: TolaAgent | undefined, logs: TolaAgentLog[]): AgentStatus {
  if (!agent) return 'offline';
  if (agent.kill_switch) return 'critical';
  if (!agent.is_active) return 'offline';

  // Expected cron intervals per agent (ms) — doubled as grace period
  const intervals: Record<string, number> = {
    nexus: 60 * 60 * 1000, guardian: 60 * 60 * 1000,
    crown: 4 * 60 * 60 * 1000, prism: 12 * 60 * 60 * 1000,
    catalyst: 8 * 60 * 60 * 1000, gateway: 12 * 60 * 60 * 1000,
    foundation: 24 * 60 * 60 * 1000, sentinel: 48 * 60 * 60 * 1000,
    // Pipeline agents only run on demand — generous window
    visionary: 48 * 60 * 60 * 1000, architect: 48 * 60 * 60 * 1000,
    oracle: 48 * 60 * 60 * 1000,
  };

  const heartbeatAge = agent.last_heartbeat
    ? Date.now() - new Date(agent.last_heartbeat).getTime()
    : Infinity;
  const maxAge = intervals[agent.id] || 4 * 60 * 60 * 1000;

  if (heartbeatAge > maxAge * 2) return 'critical';
  if (heartbeatAge > maxAge) return 'degraded';

  // Check recent errors in the last hour
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recentErrors = logs.filter(
    (l) => l.agent_id === agent.id && l.action?.includes('error') && new Date(l.created_at).getTime() > hourAgo,
  ).length;

  if (recentErrors >= 3) return 'critical';
  if (recentErrors >= 1) return 'degraded';

  return 'healthy';
}

function isMiddlePillar(srcId: AgentId, tgtId: AgentId): boolean {
  const src = TREE_NODE_MAP[srcId];
  const tgt = TREE_NODE_MAP[tgtId];
  return src.x === 250 && tgt.x === 250;
}

const PIPELINE_FLOW: AgentId[] = ['gateway', 'guardian', 'visionary', 'architect', 'oracle'];

function getPipelineActiveAgents(status: string | null): Set<string> {
  const active = new Set<string>();
  if (!status || status === 'pending') return active;
  const idx: Record<string, number> = { researching: 2, scoping: 3, synthesizing: 4, complete: 4 };
  const i = idx[status] ?? 0;
  for (let j = 0; j <= i && j < PIPELINE_FLOW.length; j++) active.add(PIPELINE_FLOW[j]);
  return active;
}

// ---------------------------------------------------------------------------
// Custom Node Component
// ---------------------------------------------------------------------------

interface TolaNodeData {
  nodeId: AgentId;
  name: string;
  engine: string;
  phantom: boolean;
  isNexus: boolean;
  healthColor: string;
  status: AgentStatus;
  isActive: boolean;
  onClick: (id: AgentId) => void;
  [key: string]: unknown;
}

const TolaNodeComponent = memo(function TolaNodeComponent({ data }: NodeProps<Node<TolaNodeData>>) {
  const { nodeId, name, engine, phantom, isNexus, healthColor, status, isActive, onClick } = data;
  const GeometryIcon = GEOMETRY_COMPONENTS[engine];
  const geoSize = isNexus ? 42 : phantom ? 32 : 36;
  const ringSize = isNexus ? NODE_SIZE + 4 : phantom ? NODE_SIZE - 8 : NODE_SIZE;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer group"
      onClick={() => onClick(nodeId)}
      style={{ width: NODE_SIZE + 20, height: NODE_SIZE + 30 }}
    >
      {/* Invisible handles for React Flow edges */}
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} id="left-src" />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} id="right-tgt" />

      {/* Active pulse ring */}
      {isActive && (
        <div
          className="absolute rounded-full tola-node-pulse"
          style={{
            width: ringSize + 20,
            height: ringSize + 20,
            top: (NODE_SIZE + 30 - ringSize - 20) / 2 - 15,
            left: (NODE_SIZE + 20 - ringSize - 20) / 2,
            backgroundColor: healthColor,
            opacity: 0.12,
          }}
        />
      )}

      {/* Phantom glow */}
      {phantom && (
        <div
          className="absolute rounded-full blur-xl"
          style={{
            width: ringSize + 32,
            height: ringSize + 32,
            top: (NODE_SIZE + 30 - ringSize - 32) / 2 - 15,
            left: (NODE_SIZE + 20 - ringSize - 32) / 2,
            backgroundColor: '#7c9bf5',
            opacity: 0.1,
          }}
        />
      )}

      {/* Node circle */}
      <div
        className="relative rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105"
        style={{
          width: ringSize,
          height: ringSize,
          border: `${isNexus ? 3.5 : 2.5}px ${phantom ? 'dashed' : 'solid'} ${healthColor}`,
          backgroundColor: '#0a0e1a',
          opacity: phantom ? 0.85 : 1,
          boxShadow: isActive ? `0 0 20px ${healthColor}30` : 'none',
        }}
      >
        {GeometryIcon && (
          <div style={{ opacity: phantom ? 0.5 : isActive ? 1 : 0.8 }}>
            <GeometryIcon size={geoSize} color={healthColor} animate={isActive} />
          </div>
        )}

        {/* Status indicator dot */}
        <div
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0e1a]"
          style={{ backgroundColor: healthColor }}
        />
      </div>

      {/* Labels */}
      <p
        className="text-[11px] mt-1 text-center font-medium"
        style={{ color: '#f0f0f5', opacity: phantom ? 0.5 : 0.9, fontWeight: isNexus ? 600 : 500 }}
      >
        {name}
      </p>
      <p className="text-[8px] text-center" style={{ color: '#4a4e5e', opacity: phantom ? 0.35 : 0.6 }}>
        {GEOMETRY_LABELS[engine as keyof typeof GEOMETRY_LABELS]}
      </p>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Custom Edge Component
// ---------------------------------------------------------------------------

interface TolaEdgeData {
  phantom: boolean;
  isMiddle: boolean;
  isActive: boolean;
  [key: string]: unknown;
}

function TolaEdgeComponent({
  id, sourceX, sourceY, targetX, targetY, data,
}: EdgeProps<Edge<TolaEdgeData>>) {
  const { phantom, isMiddle, isActive } = data || { phantom: false, isMiddle: false, isActive: false };

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  let strokeColor = '#2a2e44';
  let strokeWidth = isMiddle ? 2.4 : 1.6;
  let opacity = phantom ? 0.3 : 0.35;

  if (isActive) {
    strokeColor = '#4ade80';
    opacity = 0.7;
    strokeWidth = isMiddle ? 3 : 2;
  }

  return (
    <>
      {/* Glow for active edges */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth + 6}
          strokeOpacity={0.12}
          style={{ filter: 'blur(4px)' }}
        />
      )}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeDasharray={phantom ? '8 5' : isActive ? '4 12' : undefined}
        className={isActive ? 'tola-path-flowing' : ''}
        style={isActive ? { animation: 'tola-flow 1.5s linear infinite' } : undefined}
      />
      {/* Animated dot for active paths */}
      {isActive && (
        <circle r="3" fill="#4ade80" opacity="0.8">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

// Register node/edge types outside component to avoid re-renders
const nodeTypes = { tolaNode: TolaNodeComponent };
const edgeTypes = { tolaEdge: TolaEdgeComponent };

// ---------------------------------------------------------------------------
// Mobile Agent Card
// ---------------------------------------------------------------------------

function MobileAgentCard({ node, status, lastHeartbeat, onClick }: {
  node: typeof TREE_NODES[0]; status: AgentStatus; lastHeartbeat: string | null; onClick: () => void;
}) {
  const GeometryIcon = GEOMETRY_COMPONENTS[node.engine];
  const color = STATUS_COLORS[status];
  return (
    <button onClick={onClick} className="w-full bg-[#0d1020] border border-[#161a2e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#7c9bf5]/40 cursor-pointer text-left">
      <div className="relative shrink-0">
        {GeometryIcon && <GeometryIcon size={36} color="#7c9bf5" animate />}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d1020]" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#f0f0f5]">{node.name}</p>
          <span className="text-[10px] font-medium capitalize" style={{ color }}>{status}</span>
        </div>
        <p className="text-[10px] text-[#4a4e5e] mt-0.5">{GEOMETRY_LABELS[node.engine]}{node.phantom && ' (phantom)'}</p>
        <p className="text-[10px] text-[#4a4e5e] mt-1 truncate">{node.description}</p>
      </div>
      <div className="text-[10px] text-[#4a4e5e] shrink-0">{lastHeartbeat ? relativeTime(lastHeartbeat) : 'Never'}</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stats Hook
// ---------------------------------------------------------------------------

interface DashStats {
  active_agents: number;
  pipelines_today: number;
  avg_pipeline_seconds: number;
  tier3_queue: number;
  actions_today: number;
}

function useDashStats() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    const load = () => {
      fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TolaTreeOS() {
  const { agents, loading, error } = useRealtimeAgents();
  const { entries: activityLogs } = useRealtimeActivityFeed();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const dashStats = useDashStats();

  // Track last update time
  useEffect(() => {
    if (activityLogs.length > 0) setLastUpdate(Date.now());
  }, [activityLogs]);

  // Poll fallback
  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
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
    const s = TOLA_AGENTS.find((a) => a.id === selectedId);
    return s ? staticToLive(s) : null;
  }, [selectedId, agentMap]);

  const activeAgents = useMemo(() => getActiveAgents(activityLogs), [activityLogs]);

  const getStatus = useCallback((id: string): AgentStatus => computeHealth(agentMap.get(id), activityLogs), [agentMap, activityLogs]);
  const getHealthColor = useCallback((id: string) => HEALTH_COLORS[getStatus(id)] ?? HEALTH_COLORS.offline, [getStatus]);

  const handleNodeClick = useCallback((id: AgentId) => setSelectedId(id), []);
  const handleToggleKillSwitch = useCallback(async (id: string, val: boolean) => {
    await fetch('/api/admin/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, kill_switch: val }) });
  }, []);
  const handleTierChange = useCallback(async (id: string, tier: number) => {
    await fetch('/api/admin/agents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, tier }) });
  }, []);

  // Health counts (computed dynamically, not from stored status)
  const healthyCount = agents.filter((a) => computeHealth(a, activityLogs) === 'healthy').length;
  const degradedCount = agents.filter((a) => computeHealth(a, activityLogs) === 'degraded').length;
  const criticalCount = agents.filter((a) => computeHealth(a, activityLogs) === 'critical').length;

  // System health indicator
  const systemHealth = criticalCount > 0 ? 'critical' : degradedCount > 0 ? 'degraded' : healthyCount > 0 ? 'healthy' : 'offline';
  const systemHealthColor = HEALTH_COLORS[systemHealth] || HEALTH_COLORS.offline;

  // React Flow nodes
  const rfNodes = useMemo<Node<TolaNodeData>[]>(() => {
    return TREE_NODES.map((node) => ({
      id: node.id,
      type: 'tolaNode',
      position: { x: node.x * SCALE - (NODE_SIZE + 20) / 2, y: node.y * SCALE - NODE_SIZE / 2 },
      data: {
        nodeId: node.id,
        name: node.name,
        engine: node.engine,
        phantom: node.phantom,
        isNexus: node.id === 'nexus',
        healthColor: getHealthColor(node.id),
        status: getStatus(node.id),
        isActive: activeAgents.has(node.id),
        onClick: handleNodeClick,
      },
      draggable: false,
    }));
  }, [getHealthColor, getStatus, activeAgents, handleNodeClick]);

  // React Flow edges
  const rfEdges = useMemo<Edge<TolaEdgeData>[]>(() => {
    return TREE_PATHS.map((path, i) => ({
      id: `path-${i}`,
      source: path.source,
      target: path.target,
      type: 'tolaEdge',
      data: {
        phantom: path.phantom,
        isMiddle: isMiddlePillar(path.source, path.target),
        isActive: activeAgents.has(path.source) && activeAgents.has(path.target),
      },
    }));
  }, [activeAgents]);

  const lastUpdateSecs = Math.floor((now - lastUpdate) / 1000);

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="px-6 py-4 border-b border-[#161a2e] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: systemHealthColor }} />
              <h1 className="text-lg font-semibold text-[#f0f0f5]">TOLA Operating System</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#4a4e5e]">
              Updated {lastUpdateSecs < 5 ? 'just now' : `${lastUpdateSecs}s ago`}
            </span>
            <div className="hidden sm:flex items-center gap-3">
              {Object.entries(STATUS_COLORS).map(([s, c]) => (
                <div key={s} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} /><span className="text-[10px] text-[#4a4e5e] capitalize">{s}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs flex-wrap">
          <StatPill label="active" count={dashStats?.active_agents ?? healthyCount} color="#4ade80" />
          {degradedCount > 0 && <StatPill label="degraded" count={degradedCount} color="#f59e0b" />}
          {criticalCount > 0 && <StatPill label="critical" count={criticalCount} color="#ef4444" />}
          <div className="w-px h-4 bg-[#161a2e]" />
          <StatPill label="pipelines today" count={dashStats?.pipelines_today ?? 0} color="#7c9bf5" />
          {(dashStats?.avg_pipeline_seconds ?? 0) > 0 && (
            <span className="text-[#c4b5e0]">avg {Math.round((dashStats?.avg_pipeline_seconds ?? 0) / 60)}m</span>
          )}
          {(dashStats?.tier3_queue ?? 0) > 0 && (
            <span className="text-amber-400 font-medium">{dashStats?.tier3_queue} pending Tier 3</span>
          )}
          <span className="text-[#4a4e5e] ml-auto">{dashStats?.actions_today ?? 0} actions today</span>
        </div>

        {error && <p className="mt-2 text-xs text-red-400">Connection error: {error}</p>}
      </div>

      {/* Desktop: React Flow Tree */}
      <div className="flex-1 overflow-hidden hidden md:block relative" style={{ backgroundColor: '#0a0e1a' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-2 border-[#7c9bf5]/30 border-t-[#7c9bf5] rounded-full animate-spin" />
            <p className="text-sm text-[#4a4e5e]">Connecting to agents...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            panOnScroll
            selectionOnDrag={false}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
          >
            <Background color="#161a2e" gap={40} size={1} />
            <MiniMap
              nodeStrokeColor={(n) => {
                const d = (n as Node<TolaNodeData>).data;
                return d?.healthColor || '#6b7280';
              }}
              nodeColor={(n) => {
                const d = (n as Node<TolaNodeData>).data;
                return d?.healthColor ? `${d.healthColor}20` : '#111827';
              }}
              maskColor="rgba(8, 9, 15, 0.85)"
              style={{ backgroundColor: '#0d1020', border: '1px solid #161a2e', borderRadius: 8 }}
            />
            <Controls
              showInteractive={false}
              style={{ borderRadius: 8, border: '1px solid #161a2e', overflow: 'hidden' }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Mobile: Card stack */}
      <div className="flex-1 overflow-y-auto p-4 md:hidden space-y-2">
        {/* Crown pinned card with Tier 3 count */}
        {TREE_NODES.filter((n) => n.id === 'crown').map((node) => {
          const live = agentMap.get(node.id);
          return (
            <div key={node.id} className="relative">
              {(dashStats?.tier3_queue ?? 0) > 0 && (
                <div className="absolute -top-1 -right-1 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] text-white font-bold">
                  {dashStats?.tier3_queue} pending
                </div>
              )}
              <MobileAgentCard node={node} status={live?.status ?? 'offline'} lastHeartbeat={live?.last_heartbeat ?? null} onClick={() => handleNodeClick(node.id)} />
            </div>
          );
        })}
        {TREE_NODES.filter((n) => n.id !== 'crown').map((node) => {
          const live = agentMap.get(node.id);
          return <MobileAgentCard key={node.id} node={node} status={live?.status ?? 'offline'} lastHeartbeat={live?.last_heartbeat ?? null} onClick={() => handleNodeClick(node.id)} />;
        })}
      </div>

      {/* Activity Footer */}
      <div className="px-6 py-3 border-t border-[#161a2e] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-[#f0f0f5]">Recent Activity</h2>
          <span className="text-[10px] text-[#4a4e5e]">{activityLogs.length} entries</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {activityLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="shrink-0 bg-[#0d1020] border border-[#161a2e] rounded-lg px-3 py-2 text-[10px] min-w-[160px]">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: log.agent_id ? (HEALTH_COLORS[getStatus(log.agent_id)] ?? '#6b7280') : '#6b7280' }} />
                <span className="font-medium text-[#c4b5e0] capitalize">{log.agent_id ?? 'system'}</span>
              </div>
              <p className="text-[#4a4e5e] truncate">{log.action}</p>
              <p className="text-[#4a4e5e] mt-0.5">{relativeTime(log.created_at)}</p>
            </div>
          ))}
          {activityLogs.length === 0 && <p className="text-[10px] text-[#4a4e5e] py-2">No activity recorded yet.</p>}
        </div>
      </div>

      {/* Agent Panel */}
      {selectedAgent && (
        <AgentPanel agent={selectedAgent} onClose={() => setSelectedId(null)} onToggleKillSwitch={handleToggleKillSwitch} onTierChange={handleTierChange} />
      )}
    </div>
  );
}

function StatPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[#c4b5e0]">{count} {label}</span>
    </div>
  );
}
