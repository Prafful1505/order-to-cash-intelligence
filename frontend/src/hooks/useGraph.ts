import { useEffect, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import type { GraphNode, GraphEdge } from '../types/graph';
import { fetchNodes, expandNode as apiFetchExpand } from '../api/graph';
import { useGraphStore } from '../store/graphStore';

export const NODE_COLORS: Record<string, string> = {
  customer:    '#3b82f6',
  order:       '#22c55e',
  delivery:    '#f59e0b',
  billing_doc: '#f97316',
  payment:     '#10b981',
  product:     '#8b5cf6',
  address:     '#6b7280',
  order_item:  '#ec4899',
};

/**
 * Grid layout: 4 columns × 2 rows of entity-type groups.
 * Each group's nodes are arranged in a compact square grid.
 */
function computeInitialPositions(
  nodesByType: Record<string, GraphNode[]>,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  const TYPES = [
    'customer', 'order', 'delivery', 'billing_doc',
    'payment',  'product', 'address', 'order_item',
  ];

  const COLS        = 4;    // groups per row
  const GROUP_W     = 380;  // px between group centres horizontally
  const GROUP_H     = 420;  // px between group centres vertically
  const NODE_STEP   = 44;   // px between nodes within a group

  TYPES.forEach((type, ti) => {
    const groupCol = ti % COLS;
    const groupRow = Math.floor(ti / COLS);
    const gx = groupCol * GROUP_W;
    const gy = groupRow * GROUP_H;

    const nodes = nodesByType[type] ?? [];
    const perRow = Math.ceil(Math.sqrt(nodes.length)) || 1;

    nodes.forEach((node, ni) => {
      const nCol = ni % perRow;
      const nRow = Math.floor(ni / perRow);
      const totalRows = Math.ceil(nodes.length / perRow);
      positions.set(node.id, {
        x: gx + (nCol - (perRow - 1) / 2) * NODE_STEP,
        y: gy + (nRow - (totalRows - 1) / 2) * NODE_STEP,
      });
    });
  });

  return positions;
}

export function toFlowNode(apiNode: GraphNode, position = { x: 0, y: 0 }): Node {
  return {
    id: apiNode.id,
    type: 'erp',
    position,
    data: {
      label: apiNode.label,
      nodeType: apiNode.type,
      color: NODE_COLORS[apiNode.type] ?? '#94a3b8',
      properties: apiNode.properties,
    },
  };
}

export function toFlowEdge(apiEdge: GraphEdge): Edge {
  return {
    id: `${apiEdge.source}||${apiEdge.target}`,
    source: apiEdge.source,
    target: apiEdge.target,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#cbd5e1', strokeWidth: 1.2, opacity: 0.7 },
  };
}

/**
 * Loads initial nodes AND auto-expands 2 nodes from each type group so
 * connections are visible on first render — no clicking required.
 */
export function useInitialGraphLoad() {
  const { setNodes, addEdges, addNodes, markLoaded } = useGraphStore();

  useEffect(() => {
    const TYPES = [
      'customer', 'order', 'delivery', 'billing_doc',
      'payment',  'product', 'address', 'order_item',
    ];
    const LIMITS: Record<string, number> = {
      customer: 6, order: 12, delivery: 10, billing_doc: 10,
      payment: 8,  product: 12, address: 6, order_item: 12,
    };
    // How many nodes per type to auto-expand on startup for initial edges
    const AUTO_EXPAND = 2;

    async function load() {
      const nodesByType: Record<string, GraphNode[]> = {};

      await Promise.all(
        TYPES.map(async (type) => {
          try {
            const { nodes } = await fetchNodes(type, LIMITS[type] ?? 10);
            nodesByType[type] = nodes;
          } catch {
            nodesByType[type] = [];
          }
        }),
      );

      const positions = computeInitialPositions(nodesByType);
      const allNodes = Object.values(nodesByType).flat();
      const flowNodes = allNodes.map((n) => toFlowNode(n, positions.get(n.id)));
      setNodes(flowNodes);

        // Auto-expand seed nodes (only key types) to show initial connections.
      // Neighbours that are already placed keep their grid position;
      // unknown neighbours are placed near the source node (not randomly).
      const SEED_TYPES = ['customer', 'order'];
      const seedNodes: Array<{ id: string; pos: { x: number; y: number } }> = SEED_TYPES.flatMap((type) =>
        (nodesByType[type] ?? []).slice(0, AUTO_EXPAND).map((n) => ({
          id: n.id,
          pos: positions.get(n.id) ?? { x: 0, y: 0 },
        })),
      );

      await Promise.all(
        seedNodes.map(async ({ id, pos }) => {
          try {
            const { nodes: nbrs, edges: nbEdges } = await apiFetchExpand(id);
            const newFlowNodes = nbrs.map((n, i) => {
              // Use pre-computed grid position if available, else orbit the source node
              const existingPos = positions.get(n.id);
              const fallbackPos = existingPos ?? {
                x: pos.x + Math.cos((i / nbrs.length) * 2 * Math.PI) * 120,
                y: pos.y + Math.sin((i / nbrs.length) * 2 * Math.PI) * 120,
              };
              return toFlowNode(n, fallbackPos);
            });
            addNodes(newFlowNodes);
            addEdges(nbEdges.map(toFlowEdge));
            markLoaded(id);
          } catch {
            // silently ignore
          }
        }),
      );
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return useCallback(() => {}, []);
}
