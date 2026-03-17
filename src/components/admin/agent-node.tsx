'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { GEOMETRY_COMPONENTS } from '@/components/sacred-geometry';
import { STATUS_COLORS, type AgentStatus, type GeometryEngine } from '@/lib/tola-agents';

export type AgentNodeData = {
  label: string;
  geometryEngine: GeometryEngine;
  status: AgentStatus;
  description: string;
  tier: number;
};

function AgentNodeComponent({ data }: NodeProps<Node<AgentNodeData>>) {
  const GeometryIcon = GEOMETRY_COMPONENTS[data.geometryEngine];
  const statusColor = STATUS_COLORS[data.status];

  return (
    <div className="group relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1 !h-1 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />

      {/* Node body */}
      <div className="relative w-[72px] h-[72px] rounded-xl bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] flex items-center justify-center transition-all duration-300 group-hover:border-[var(--color-accent)]/60 group-hover:shadow-lg group-hover:shadow-[var(--color-accent)]/10 cursor-pointer">
        {GeometryIcon && (
          <GeometryIcon size={30} color="var(--color-accent)" animate />
        )}

        {/* Status indicator */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--color-admin-bg)]"
          style={{ backgroundColor: statusColor }}
        />
      </div>

      {/* Label */}
      <span className="mt-2 text-[11px] font-medium text-[var(--color-muted-light)] group-hover:text-[var(--color-foreground-strong)] transition-colors whitespace-nowrap select-none">
        {data.label}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-transparent !border-0 !min-w-0 !min-h-0"
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
