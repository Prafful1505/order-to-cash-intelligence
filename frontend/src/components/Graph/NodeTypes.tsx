import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface ERPNodeData {
  label: string;
  nodeType: string;
  color: string;
  properties: Record<string, unknown>;
}

export const ERPNode = memo(function ERPNode({ data, selected }: NodeProps<ERPNodeData>) {
  const size = selected ? 22 : 16;

  return (
    <div style={{ width: size, height: size }}>
      <Handle type="target" position={Position.Top}
        style={{ opacity: 0, pointerEvents: 'none', width: 1, height: 1, minWidth: 0, minHeight: 0, top: '50%', left: '50%' }} />

      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: data.color,
          border: selected ? `3px solid white` : `2px solid ${data.color}33`,
          boxShadow: selected
            ? `0 0 0 3px ${data.color}88, 0 4px 16px ${data.color}55`
            : `0 1px 4px rgba(0,0,0,0.15), 0 0 0 1px ${data.color}22`,
          transition: 'all 0.15s ease',
        }}
      />

      <Handle type="source" position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: 'none', width: 1, height: 1, minWidth: 0, minHeight: 0, bottom: '50%', left: '50%' }} />
    </div>
  );
});

export const nodeTypes = { erp: ERPNode };
