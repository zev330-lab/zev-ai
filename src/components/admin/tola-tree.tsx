'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  type TreeNode,
} from '@/lib/tola-agents';
import { useRealtimeAgents, useRealtimeActivityFeed } from '@/hooks/use-realtime-agents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// Determine which agents are "active" from recent logs (within 5 min)
function getActiveAgents(logs: TolaAgentLog[]): Set<string> {
  const cutoff = Date.now() - 5 * 60 * 1000;
  const active = new Set<string>();
  for (const log of logs) {
    if (log.agent_id && new Date(log.created_at).getTime() > cutoff) {
      active.add(log.agent_id);
    }
  }
  return active;
}

// Check if a path connects two active agents
function isPathActive(
  source: AgentId,
  target: AgentId,
  activeAgents: Set<string>,
): boolean {
  return activeAgents.has(source) && activeAgents.has(target);
}

// Middle pillar check
function isMiddlePillar(src: TreeNode, tgt: TreeNode): boolean {
  return src.x === 250 && tgt.x === 250;
}

// Pipeline flow path: the sequence of agents in the assessment pipeline
const PIPELINE_FLOW: AgentId[] = ['gateway', 'guardian', 'visionary', 'architect', 'oracle'];

// Map pipeline_status to which agents should be "lit up"
function getPipelineActiveAgents(status: string | null): Set<string> {
  const active = new Set<string>();
  if (!status || status === 'pending') return active;
  const statusToIndex: Record<string, number> = {
    researching: 2, // gateway + guardian + visionary
    scoping: 3,     // + architect
    synthesizing: 4, // + oracle
    complete: 4,
  };
  const idx = statusToIndex[status] ?? 0;
  for (let i = 0; i <= idx && i < PIPELINE_FLOW.length; i++) {
    active.add(PIPELINE_FLOW[i]);
  }
  return active;
}

// ---------------------------------------------------------------------------
// Path Tooltip Component
// ---------------------------------------------------------------------------

function PathTooltip({
  x,
  y,
  source,
  target,
  logs,
}: {
  x: number;
  y: number;
  source: string;
  target: string;
  logs: TolaAgentLog[];
}) {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  const relevant = logs.filter(
    (l) =>
      l.agent_id &&
      (l.agent_id === source || l.agent_id === target) &&
      new Date(l.created_at).getTime() > cutoff,
  );
  const msgCount = relevant.length;
  const latencies = relevant
    .filter((l) => typeof l.latency_ms === 'number')
    .map((l) => l.latency_ms as number);
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
  const errors = relevant.filter(
    (l) => l.output && (l.output as Record<string, unknown>).error,
  ).length;

  return (
    <foreignObject x={x - 70} y={y - 50} width={140} height={60} className="pointer-events-none">
      <div className="bg-[#0d1020] border border-[#2a2e44] rounded-lg px-3 py-2 shadow-xl text-center">
        <p className="text-[10px] text-[#c4b5e0] font-medium">
          {msgCount} msg/hr
        </p>
        <p className="text-[9px] text-[#4a4e5e]">
          {avgLatency > 0 ? `${avgLatency}ms avg` : 'no data'} &middot;{' '}
          {errors > 0 ? (
            <span className="text-red-400">{errors} errors</span>
          ) : (
            'no errors'
          )}
        </p>
      </div>
    </foreignObject>
  );
}

// ---------------------------------------------------------------------------
// Mobile Agent Card
// ---------------------------------------------------------------------------

function MobileAgentCard({
  node,
  status,
  lastHeartbeat,
  onClick,
}: {
  node: TreeNode;
  status: AgentStatus;
  lastHeartbeat: string | null;
  onClick: () => void;
}) {
  const GeometryIcon = GEOMETRY_COMPONENTS[node.engine];
  const statusColor = STATUS_COLORS[status];

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#0d1020] border border-[#161a2e] rounded-xl p-4 flex items-center gap-4 transition-all hover:border-[#7c9bf5]/40 active:scale-[0.99] cursor-pointer text-left"
    >
      <div className="relative shrink-0">
        {GeometryIcon && <GeometryIcon size={36} color="#7c9bf5" animate />}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d1020]"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#f0f0f5]">{node.name}</p>
          <span
            className="text-[10px] font-medium capitalize"
            style={{ color: statusColor }}
          >
            {status}
          </span>
        </div>
        <p className="text-[10px] text-[#4a4e5e] mt-0.5">
          {GEOMETRY_LABELS[node.engine]}
          {node.phantom && ' (phantom)'}
        </p>
        <p className="text-[10px] text-[#4a4e5e] mt-1 truncate">
          {node.description}
        </p>
      </div>
      <div className="text-[10px] text-[#4a4e5e] shrink-0 text-right">
        {lastHeartbeat ? relativeTime(lastHeartbeat) : 'Never'}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TolaTreeOS() {
  const { agents, loading, error } = useRealtimeAgents();
  const { entries: activityLogs } = useRealtimeActivityFeed();
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [hoveredPath, setHoveredPath] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<AgentId | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build agent map
  const agentMap = useMemo(() => {
    const map = new Map<string, TolaAgent>();
    agents.forEach((a) => map.set(a.id, a));
    return map;
  }, [agents]);

  // Selected agent for panel
  const selectedAgent = useMemo(() => {
    if (!selectedId) return null;
    const live = agentMap.get(selectedId);
    if (live) return live;
    const staticAgent = TOLA_AGENTS.find((a) => a.id === selectedId);
    return staticAgent ? staticToLive(staticAgent) : null;
  }, [selectedId, agentMap]);

  // Active agents from logs
  const activeAgents = useMemo(() => getActiveAgents(activityLogs), [activityLogs]);

  // Stats
  const healthyCount = agents.filter((a) => a.status === 'healthy').length;
  const degradedCount = agents.filter((a) => a.status === 'degraded').length;
  const criticalCount = agents.filter((a) => a.status === 'critical').length;
  const offlineCount = agents.length > 0
    ? agents.length - healthyCount - degradedCount - criticalCount
    : 11;

  const getStatus = useCallback(
    (nodeId: string): AgentStatus => agentMap.get(nodeId)?.status ?? 'offline',
    [agentMap],
  );

  const getHealthColor = useCallback(
    (nodeId: string): string => {
      const status = getStatus(nodeId);
      return HEALTH_COLORS[status] ?? HEALTH_COLORS.offline;
    },
    [getStatus],
  );

  const handleNodeClick = useCallback((id: AgentId) => {
    setSelectedId(id);
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

  // Recent activity count for the footer
  const recentCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return activityLogs.filter((l) => new Date(l.created_at).getTime() > cutoff).length;
  }, [activityLogs]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#161a2e] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[#f0f0f5]">TOLA Operating System</h1>
            <p className="text-xs text-[#4a4e5e] mt-0.5">
              11 agents &middot; 24 paths &middot; {recentCount} actions today
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#4a4e5e] capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-xs flex-wrap">
          <StatPill label="healthy" count={healthyCount} color="#4ade80" />
          {degradedCount > 0 && <StatPill label="degraded" count={degradedCount} color="#f59e0b" />}
          {criticalCount > 0 && <StatPill label="critical" count={criticalCount} color="#ef4444" />}
          <StatPill label="offline" count={offlineCount} color="#6b7280" />
          <div className="ml-auto text-[10px] text-[#4a4e5e]">
            {activeAgents.size > 0
              ? `${activeAgents.size} agents active now`
              : 'No recent activity'}
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">Connection error: {error}</p>
        )}
      </div>

      {/* Desktop: Full Tree of Life SVG */}
      <div className="flex-1 overflow-hidden hidden md:flex items-center justify-center p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#7c9bf5]/30 border-t-[#7c9bf5] rounded-full animate-spin" />
            <p className="text-sm text-[#4a4e5e]">Connecting to agents...</p>
          </div>
        ) : (
          <div className="w-full max-w-[600px] aspect-[5/7] relative">
            <svg
              ref={svgRef}
              viewBox="0 0 500 700"
              className="w-full h-full"
              aria-label="TOLA Operating System — 11 agents, 24 paths"
            >
              <defs>
                {/* Phantom glow */}
                <filter id="tola-phantom-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
                </filter>

                {/* Node glow on hover */}
                <filter id="tola-node-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                </filter>

                {/* Active path glow */}
                <filter id="tola-path-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
              </defs>

              {/* ---- 24 Paths ---- */}
              <g className="tola-paths">
                {TREE_PATHS.map((path, i) => {
                  const src = TREE_NODE_MAP[path.source];
                  const tgt = TREE_NODE_MAP[path.target];
                  const isPhantom = path.phantom;
                  const isMiddle = isMiddlePillar(src, tgt);
                  const isActive = isPathActive(path.source, path.target, activeAgents);
                  const isHovered = hoveredPath === i;

                  // Base styling
                  let strokeColor = '#2a2e44'; // dim gray
                  let strokeWidth = isMiddle ? 2.4 : 1.6;
                  let opacity = isPhantom ? 0.3 : 0.35;
                  let dashArray: string | undefined = isPhantom ? '8 5' : undefined;
                  let animClass = '';

                  if (isActive) {
                    strokeColor = '#4ade80';
                    opacity = 0.7;
                    strokeWidth = isMiddle ? 3 : 2;
                    animClass = 'tola-path-flowing';
                    dashArray = '4 12';
                  }

                  if (isHovered) {
                    opacity = 1;
                    strokeWidth += 1;
                  }

                  return (
                    <g key={`path-${i}`}>
                      {/* Glow layer for active paths */}
                      {isActive && (
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth + 4}
                          strokeOpacity={0.15}
                          filter="url(#tola-path-glow)"
                        />
                      )}

                      {/* Main path line */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        strokeDasharray={dashArray}
                        className={`transition-all duration-500 ${animClass}`}
                        style={
                          isActive
                            ? {
                                animation: 'tola-flow 1.5s linear infinite',
                              }
                            : undefined
                        }
                      />

                      {/* Invisible wide hitbox for hover */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke="transparent"
                        strokeWidth={16}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPath(i)}
                        onMouseLeave={() => setHoveredPath(null)}
                      />

                      {/* Tooltip on hover */}
                      {isHovered && (
                        <PathTooltip
                          x={(src.x + tgt.x) / 2}
                          y={(src.y + tgt.y) / 2}
                          source={path.source}
                          target={path.target}
                          logs={activityLogs}
                        />
                      )}
                    </g>
                  );
                })}
              </g>

              {/* ---- 11 Nodes ---- */}
              <g className="tola-nodes">
                {TREE_NODES.map((node) => {
                  const healthColor = getHealthColor(node.id);
                  const isPhantom = node.phantom;
                  const isNexus = node.id === 'nexus';
                  const isNodeActive = activeAgents.has(node.id);
                  const isHovered = hoveredNode === node.id;
                  const GeometryIcon = GEOMETRY_COMPONENTS[node.engine];

                  const nodeR = isNexus ? 36 : isPhantom ? 24 : 28;
                  const geoSize = (nodeR - 6) * 2;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => handleNodeClick(node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.name} agent — ${getStatus(node.id)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNodeClick(node.id);
                        }
                      }}
                    >
                      {/* Oracle: outer ethereal glow */}
                      {isPhantom && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeR + 16}
                          fill="#7c9bf5"
                          opacity={0.08}
                          filter="url(#tola-phantom-glow)"
                        />
                      )}

                      {/* Active agent glow */}
                      {isNodeActive && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeR + 10}
                          fill={healthColor}
                          opacity={0.12}
                          className="tola-node-pulse"
                        />
                      )}

                      {/* Hover glow */}
                      {isHovered && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeR + 8}
                          fill="#7c9bf5"
                          opacity={0.15}
                          filter="url(#tola-node-glow)"
                        />
                      )}

                      {/* Nexus prominence glow */}
                      {isNexus && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeR + 8}
                          fill={healthColor}
                          opacity={0.06}
                        />
                      )}

                      {/* Oracle: translucent fill */}
                      {isPhantom && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeR}
                          fill="#7c9bf5"
                          opacity={0.1}
                        />
                      )}

                      {/* Background fill */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeR - 2.5}
                        fill="#0a0e1a"
                        opacity={isPhantom ? 0.85 : 1}
                      />

                      {/* Health ring */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeR}
                        fill="none"
                        stroke={healthColor}
                        strokeWidth={isNexus ? 3.5 : 2.5}
                        strokeDasharray={isPhantom ? '8 5' : undefined}
                        opacity={isHovered ? 1 : isPhantom ? 0.55 : 0.85}
                        className="transition-opacity duration-200"
                      />

                      {/* Sacred geometry icon */}
                      {GeometryIcon && (
                        <foreignObject
                          x={node.x - geoSize / 2}
                          y={node.y - geoSize / 2}
                          width={geoSize}
                          height={geoSize}
                          className="overflow-visible pointer-events-none"
                        >
                          <div
                            className="flex items-center justify-center w-full h-full"
                            style={{ opacity: isPhantom ? 0.5 : isNodeActive ? 1 : 0.8 }}
                          >
                            <GeometryIcon
                              size={geoSize * 0.85}
                              color={healthColor}
                              animate={isNodeActive || isHovered}
                            />
                          </div>
                        </foreignObject>
                      )}

                      {/* Node name */}
                      <text
                        x={node.x}
                        y={node.y + nodeR + 10}
                        textAnchor="middle"
                        fill="#f0f0f5"
                        fontSize={11}
                        fontFamily="system-ui, sans-serif"
                        fontWeight={isNexus ? 600 : 500}
                        opacity={isPhantom ? 0.5 : 0.9}
                      >
                        {node.name}
                      </text>

                      {/* Engine name */}
                      <text
                        x={node.x}
                        y={node.y + nodeR + 22}
                        textAnchor="middle"
                        fill="#4a4e5e"
                        fontSize={8}
                        fontFamily="system-ui, sans-serif"
                        opacity={isPhantom ? 0.35 : 0.6}
                      >
                        {GEOMETRY_LABELS[node.engine]}
                      </text>

                      {/* Status indicator dot */}
                      <circle
                        cx={node.x + nodeR - 4}
                        cy={node.y - nodeR + 4}
                        r={4}
                        fill={healthColor}
                        stroke="#0a0e1a"
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Mobile: Card stack */}
      <div className="flex-1 overflow-y-auto p-4 md:hidden space-y-2">
        {TREE_NODES.map((node) => {
          const live = agentMap.get(node.id);
          return (
            <MobileAgentCard
              key={node.id}
              node={node}
              status={live?.status ?? 'offline'}
              lastHeartbeat={live?.last_heartbeat ?? null}
              onClick={() => handleNodeClick(node.id)}
            />
          );
        })}
      </div>

      {/* Recent Activity Footer */}
      <div className="px-6 py-3 border-t border-[#161a2e] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-[#f0f0f5]">Recent Activity</h2>
          <span className="text-[10px] text-[#4a4e5e]">{activityLogs.length} entries</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {activityLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="shrink-0 bg-[#0d1020] border border-[#161a2e] rounded-lg px-3 py-2 text-[10px] min-w-[160px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: log.agent_id
                      ? (HEALTH_COLORS[getStatus(log.agent_id)] ?? '#6b7280')
                      : '#6b7280',
                  }}
                />
                <span className="font-medium text-[#c4b5e0] capitalize">
                  {log.agent_id ?? 'system'}
                </span>
              </div>
              <p className="text-[#4a4e5e] truncate">{log.action}</p>
              <p className="text-[#4a4e5e] mt-0.5">{relativeTime(log.created_at)}</p>
            </div>
          ))}
          {activityLogs.length === 0 && (
            <p className="text-[10px] text-[#4a4e5e] py-2">No activity recorded yet.</p>
          )}
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

// ---------------------------------------------------------------------------
// Stat Pill
// ---------------------------------------------------------------------------

function StatPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[#c4b5e0]">
        {count} {label}
      </span>
    </div>
  );
}
