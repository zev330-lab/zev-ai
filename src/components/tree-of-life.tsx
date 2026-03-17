'use client';

import { useMemo } from 'react';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import {
  TREE_NODES,
  TREE_PATHS,
  TREE_NODE_MAP,
  HEALTH_COLORS,
  GEOMETRY_LABELS,
  type AgentId,
  type AgentStatus,
  type TreeNode,
} from '@/lib/tola-agents';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TreeMode = 'hero' | 'diagram' | 'dashboard' | 'compact';

export interface TreeOfLifeProps {
  mode: TreeMode;
  agents?: Record<string, { status: AgentStatus }>;
  onNodeClick?: (agentId: AgentId) => void;
  highlightNode?: AgentId | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Node sizing — Nexus (the heart) is larger
// ---------------------------------------------------------------------------

function getNodeRadius(nodeId: AgentId, mode: TreeMode): number {
  if (mode === 'compact') {
    if (nodeId === 'nexus') return 18;
    if (nodeId === 'oracle') return 12;
    return 14;
  }
  if (nodeId === 'nexus') return 36;
  if (nodeId === 'oracle') return 24;
  return 28;
}

function getGeoSize(nodeId: AgentId, mode: TreeMode): number {
  if (mode === 'compact') return 0;
  const r = getNodeRadius(nodeId, mode);
  return (r - 6) * 2;
}

// ---------------------------------------------------------------------------
// Path classification
// ---------------------------------------------------------------------------

function isMiddlePillarPath(srcNode: TreeNode, tgtNode: TreeNode): boolean {
  return srcNode.x === 250 && tgtNode.x === 250;
}

// ---------------------------------------------------------------------------
// Mode-specific config
// ---------------------------------------------------------------------------

const MODE_CONFIG = {
  hero:      { fontSize: 0,  engineFont: 0, ringWidth: 2,   showLabels: false },
  diagram:   { fontSize: 10, engineFont: 8, ringWidth: 2,   showLabels: true },
  dashboard: { fontSize: 10, engineFont: 8, ringWidth: 2.5, showLabels: true },
  compact:   { fontSize: 0,  engineFont: 0, ringWidth: 1.5, showLabels: false },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TreeOfLife({
  mode,
  agents,
  onNodeClick,
  highlightNode,
  className = '',
}: TreeOfLifeProps) {
  const cfg = MODE_CONFIG[mode];

  const getHealthColor = (node: TreeNode): string => {
    if (mode === 'hero') return HEALTH_COLORS.active;
    if (!agents) return HEALTH_COLORS.healthy;
    const status = agents[node.id]?.status ?? 'offline';
    return HEALTH_COLORS[status] ?? HEALTH_COLORS.offline;
  };

  const shouldAnimate = mode !== 'compact';
  const filterId = useMemo(() => `phantom-glow-${mode}`, [mode]);

  return (
    <svg
      viewBox="0 0 500 700"
      className={`w-full h-full ${className}`}
      aria-label="Tree of Life — 11 agents connected by 24 paths"
    >
      <defs>
        {/* Phantom node glow filter */}
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>

        {/* Dashboard flow gradient */}
        {mode === 'dashboard' && (
          <linearGradient id="path-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c9bf5" stopOpacity="0" />
            <stop offset="50%" stopColor="#7c9bf5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7c9bf5" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* ---- 22 Paths ---- */}
      <g className="tree-paths">
        {TREE_PATHS.map((path, i) => {
          const src = TREE_NODE_MAP[path.source];
          const tgt = TREE_NODE_MAP[path.target];
          const isOracle = path.phantom;
          const isMiddle = isMiddlePillarPath(src, tgt);

          // Path styling:
          // Standard: solid, opacity 0.45, width 1.6
          // Oracle: dashed, opacity 0.35, width 1.6
          // Middle pillar: solid, opacity 0.6, width 2.4
          // Oracle + middle (path 11): dashed, opacity 0.45, width 2.4
          let opacity: number;
          let width: number;
          let dashArray: string | undefined;

          if (isOracle && isMiddle) {
            opacity = 0.45;
            width = 2.4;
            dashArray = '8 5';
          } else if (isOracle) {
            opacity = 0.35;
            width = 1.6;
            dashArray = '8 5';
          } else if (isMiddle) {
            opacity = 0.6;
            width = 2.4;
            dashArray = undefined;
          } else {
            opacity = 0.45;
            width = 1.6;
            dashArray = undefined;
          }

          // Compact mode: thinner
          if (mode === 'compact') {
            width *= 0.5;
            opacity *= 0.4;
          }

          return (
            <line
              key={`path-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke="#7c9bf5"
              strokeWidth={width}
              strokeOpacity={opacity}
              strokeDasharray={dashArray}
            />
          );
        })}
      </g>

      {/* ---- 11 Nodes ---- */}
      <g className="tree-nodes">
        {TREE_NODES.map((node) => {
          const healthColor = getHealthColor(node);
          const isHighlighted = highlightNode === node.id;
          const isPhantom = node.phantom;
          const isNexus = node.id === 'nexus';
          const GeometryIcon = GEOMETRY_COMPONENTS[node.engine];
          const interactive = mode === 'dashboard' || mode === 'diagram';

          const nodeR = getNodeRadius(node.id as AgentId, mode);
          const geoSize = getGeoSize(node.id as AgentId, mode);

          return (
            <g
              key={node.id}
              className={interactive ? 'cursor-pointer' : ''}
              onClick={interactive ? () => onNodeClick?.(node.id) : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`${node.name} agent`}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNodeClick?.(node.id);
                      }
                    }
                  : undefined
              }
            >
              {/* Tooltip for diagram mode */}
              {mode === 'diagram' && (
                <title>{node.name} — {node.description}</title>
              )}

              {/* Oracle: outer ethereal glow */}
              {isPhantom && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR + 16}
                  fill="#7c9bf5"
                  opacity={0.1}
                  filter={`url(#${filterId})`}
                />
              )}

              {/* Nexus: subtle prominence glow */}
              {isNexus && mode !== 'compact' && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR + 8}
                  fill={healthColor}
                  opacity={0.06}
                />
              )}

              {/* Oracle: periwinkle translucent fill */}
              {isPhantom && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR}
                  fill="#7c9bf5"
                  opacity={0.12}
                />
              )}

              {/* Node background fill */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR - cfg.ringWidth}
                fill="var(--color-background)"
                opacity={isPhantom ? 0.85 : 1}
              />

              {/* Health ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR}
                fill="none"
                stroke={healthColor}
                strokeWidth={isNexus ? cfg.ringWidth + 1 : cfg.ringWidth}
                strokeDasharray={isPhantom ? '8 5' : undefined}
                opacity={isPhantom ? 0.6 : isHighlighted ? 1 : 0.85}
                className={interactive ? 'transition-opacity duration-200 hover:opacity-100' : ''}
              />

              {/* Sacred geometry icon via foreignObject */}
              {mode !== 'compact' && GeometryIcon && (
                <foreignObject
                  x={node.x - geoSize / 2}
                  y={node.y - geoSize / 2}
                  width={geoSize}
                  height={geoSize}
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className="flex items-center justify-center w-full h-full"
                    style={{ opacity: isPhantom ? 0.5 : 0.9 }}
                  >
                    <GeometryIcon
                      size={geoSize * 0.85}
                      color={healthColor}
                      animate={shouldAnimate}
                    />
                  </div>
                </foreignObject>
              )}

              {/* Compact mode: simple colored dot */}
              {mode === 'compact' && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeR * 0.45}
                  fill={healthColor}
                  opacity={isPhantom ? 0.4 : 0.8}
                />
              )}

              {/* Node name label */}
              {cfg.showLabels && (
                <text
                  x={node.x}
                  y={node.y + nodeR + 8}
                  textAnchor="middle"
                  fill="var(--color-foreground-strong)"
                  fontSize={cfg.fontSize}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={isNexus ? 600 : 500}
                  opacity={isPhantom ? 0.55 : 0.9}
                >
                  {node.name}
                </text>
              )}

              {/* Engine name (dashboard/diagram only) */}
              {cfg.engineFont > 0 && (
                <text
                  x={node.x}
                  y={node.y + nodeR + 8 + cfg.engineFont + 3}
                  textAnchor="middle"
                  fill="var(--color-muted)"
                  fontSize={cfg.engineFont}
                  fontFamily="system-ui, sans-serif"
                  opacity={isPhantom ? 0.35 : 0.6}
                >
                  {GEOMETRY_LABELS[node.engine]}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
