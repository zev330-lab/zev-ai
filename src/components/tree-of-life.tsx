'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
  /** Live agent statuses — keyed by AgentId. Dashboard mode uses this. */
  agents?: Record<string, { status: AgentStatus }>;
  /** Fired when a node is clicked (dashboard/diagram modes). */
  onNodeClick?: (agentId: AgentId) => void;
  /** Highlight a specific node (diagram mode — hover/tooltip). */
  highlightNode?: AgentId | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mode-specific sizing
// ---------------------------------------------------------------------------

const MODE_CONFIG = {
  hero:      { nodeR: 22, geoSize: 28, fontSize: 0,  engineFont: 0, pathOpacity: 0.15, pathWidth: 1.2, phantomPathOpacity: 0.08, ringWidth: 2.5, labelOffset: 0 },
  diagram:   { nodeR: 20, geoSize: 24, fontSize: 9,  engineFont: 7, pathOpacity: 0.25, pathWidth: 1.2, phantomPathOpacity: 0.12, ringWidth: 2,   labelOffset: 30 },
  dashboard: { nodeR: 22, geoSize: 26, fontSize: 9,  engineFont: 7, pathOpacity: 0.3,  pathWidth: 1.5, phantomPathOpacity: 0.15, ringWidth: 2.5, labelOffset: 32 },
  compact:   { nodeR: 12, geoSize: 16, fontSize: 0,  engineFont: 0, pathOpacity: 0.12, pathWidth: 0.8, phantomPathOpacity: 0.06, ringWidth: 1.5, labelOffset: 0 },
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

  // Health ring color for a node
  const getHealthColor = (node: TreeNode): string => {
    if (mode === 'hero') return HEALTH_COLORS.active; // periwinkle glow for hero
    const status = agents?.[node.id]?.status ?? 'offline';
    return HEALTH_COLORS[status] ?? HEALTH_COLORS.offline;
  };

  // Should geometry animate?
  const shouldAnimate = mode !== 'compact';

  // Phantom glow filter ID
  const filterId = useMemo(() => `phantom-glow-${mode}`, [mode]);

  return (
    <svg
      viewBox="0 0 400 600"
      className={`w-full h-full ${className}`}
      aria-label="Tree of Life — 11 agents connected by 22 paths"
    >
      <defs>
        {/* Phantom node glow */}
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>

        {/* Animated path gradient for dashboard mode */}
        {mode === 'dashboard' && (
          <linearGradient id="path-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* ---- 22 Paths ---- */}
      <g className="tree-paths">
        {TREE_PATHS.map((path, i) => {
          const src = TREE_NODE_MAP[path.source];
          const tgt = TREE_NODE_MAP[path.target];
          const isPhantom = path.phantom;
          const opacity = isPhantom ? cfg.phantomPathOpacity : cfg.pathOpacity;

          return (
            <line
              key={`path-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke="var(--color-accent)"
              strokeWidth={cfg.pathWidth}
              strokeOpacity={opacity}
              strokeDasharray={isPhantom ? '4 4' : undefined}
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
          const GeometryIcon = GEOMETRY_COMPONENTS[node.engine];
          const interactive = mode === 'dashboard' || mode === 'diagram';

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
              {/* Phantom glow background */}
              {isPhantom && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={cfg.nodeR + 6}
                  fill="var(--color-accent)"
                  opacity={0.06}
                  filter={`url(#${filterId})`}
                />
              )}

              {/* Health ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={cfg.nodeR}
                fill="none"
                stroke={healthColor}
                strokeWidth={cfg.ringWidth}
                strokeDasharray={isPhantom ? '5 3' : undefined}
                opacity={isPhantom ? 0.5 : isHighlighted ? 1 : 0.8}
                className={interactive ? 'transition-opacity duration-200 hover:opacity-100' : ''}
              />

              {/* Node background fill */}
              <circle
                cx={node.x}
                cy={node.y}
                r={cfg.nodeR - cfg.ringWidth}
                fill="var(--color-background)"
                opacity={isPhantom ? 0.7 : 1}
              />

              {/* Sacred geometry icon via foreignObject */}
              {mode !== 'compact' && GeometryIcon && (
                <foreignObject
                  x={node.x - cfg.geoSize / 2}
                  y={node.y - cfg.geoSize / 2}
                  width={cfg.geoSize}
                  height={cfg.geoSize}
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className="flex items-center justify-center w-full h-full"
                    style={{ opacity: isPhantom ? 0.45 : 0.9 }}
                  >
                    <GeometryIcon
                      size={cfg.geoSize * 0.8}
                      color={healthColor}
                      animate={shouldAnimate}
                    />
                  </div>
                </foreignObject>
              )}

              {/* Compact mode: simple colored dot instead of geometry */}
              {mode === 'compact' && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={cfg.nodeR * 0.45}
                  fill={healthColor}
                  opacity={isPhantom ? 0.4 : 0.8}
                />
              )}

              {/* Node name label */}
              {cfg.fontSize > 0 && (
                <text
                  x={node.x}
                  y={node.y + cfg.labelOffset}
                  textAnchor="middle"
                  fill="var(--color-foreground-strong)"
                  fontSize={cfg.fontSize}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={500}
                  opacity={isPhantom ? 0.5 : 0.9}
                >
                  {node.name}
                </text>
              )}

              {/* Engine name (dashboard/diagram only) */}
              {cfg.engineFont > 0 && (
                <text
                  x={node.x}
                  y={node.y + cfg.labelOffset + cfg.engineFont + 3}
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
