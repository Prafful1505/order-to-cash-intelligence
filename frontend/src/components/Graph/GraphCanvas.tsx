import { useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGraphStore } from '../../store/graphStore';
import { nodeTypes } from './NodeTypes';
import { edgeTypes } from './EdgeTypes';
import { NodeDetailPanel } from './NodeDetailPanel';
import { expandNode } from '../../api/graph';
import { toFlowNode, toFlowEdge, useInitialGraphLoad, NODE_COLORS } from '../../hooks/useGraph';
import type { GraphNode } from '../../types/graph';
import type { ERPNodeData } from './NodeTypes';

interface HoverInfo {
  x: number;
  y: number;
  label: string;
  nodeType: string;
  color: string;
}

function GraphCanvasInner() {
  const {
    nodes, edges,
    addNodes, addEdges,
    loadedNodeIds, markLoaded,
    expandingIds, setExpanding,
    setSelectedNode,
    showEdges, toggleEdges,
  } = useGraphStore();

  const { getNode } = useReactFlow();
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useInitialGraphLoad();

  const onNodeClick: NodeMouseHandler = useCallback(
    async (_evt, flowNode: Node) => {
      const selectedGraphNode: GraphNode = {
        id: flowNode.id,
        type: (flowNode.data as ERPNodeData).nodeType,
        label: (flowNode.data as ERPNodeData).label,
        properties: (flowNode.data as ERPNodeData).properties,
      };
      setSelectedNode(selectedGraphNode);

      if (loadedNodeIds.has(flowNode.id) || expandingIds.has(flowNode.id)) return;

      setExpanding(flowNode.id, true);
      try {
        const { nodes: newNodes, edges: newEdges } = await expandNode(flowNode.id);
        const center = getNode(flowNode.id)?.position ?? { x: 0, y: 0 };
        const RADIUS = 300;

        const positioned = newNodes.map((n, i) => {
          const angle = (i / newNodes.length) * 2 * Math.PI;
          return toFlowNode(n, {
            x: center.x + Math.cos(angle) * RADIUS,
            y: center.y + Math.sin(angle) * RADIUS,
          });
        });

        addNodes(positioned);
        addEdges(newEdges.map(toFlowEdge));
        markLoaded(flowNode.id);
      } catch (err) {
        console.error('Failed to expand node:', err);
      } finally {
        setExpanding(flowNode.id, false);
      }
    },
    [loadedNodeIds, expandingIds, getNode, addNodes, addEdges, markLoaded, setExpanding, setSelectedNode],
  );

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_evt, flowNode: Node) => {
    const d = flowNode.data as ERPNodeData;
    setHover({ x: _evt.clientX, y: _evt.clientY, label: d.label, nodeType: d.nodeType, color: d.color });
  }, []);

  const onNodeMouseLeave = useCallback(() => setHover(null), []);

  const visibleEdges = showEdges ? edges : [];

  return (
    // flex-col: toolbar strip on top, ReactFlow below — toolbar is OUTSIDE ReactFlow's stacking context
    <div className="w-full h-full flex flex-col">

      {/* ── Toolbar strip ── completely outside ReactFlow, no z-index battles */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-100">
        {/* Only show toggle when edges exist */}
        {edges.length > 0 && (
          <button
            onClick={toggleEdges}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              showEdges
                ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="4" cy="8" r="2.2" />
              <circle cx="12" cy="4" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              {showEdges && (
                <>
                  <line x1="6" y1="7.2" x2="10" y2="5.0" />
                  <line x1="6" y1="8.8" x2="10" y2="11.0" />
                </>
              )}
            </svg>
            {showEdges ? 'Hide Connections' : 'Show Connections'}
          </button>
        )}

        {edges.length > 0 && (
          <span className="text-[11px] text-gray-400">
            {nodes.length} nodes · {edges.length} connections
          </span>
        )}

        {expandingIds.size > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Expanding node…
          </div>
        )}
      </div>

      {/* ── ReactFlow canvas ── */}
      <div className="flex-1 relative">
        {/* Node detail panel — fixed inside canvas area */}
        <NodeDetailPanel />

        <ReactFlow
          nodes={nodes}
          edges={visibleEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
          minZoom={0.05}
          maxZoom={4}
          defaultEdgeOptions={{ animated: false }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            className="!bg-white !border-gray-200 !shadow-md !rounded-xl"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(n) => NODE_COLORS[(n.data as ERPNodeData)?.nodeType] ?? '#94a3b8'}
            className="!bg-white !border-gray-200 !rounded-xl !shadow-md"
            maskColor="rgba(241,245,249,0.8)"
            nodeStrokeWidth={0}
          />
          <Background gap={30} color="#dde3ea" size={1} />
        </ReactFlow>

        {/* Legend — bottom-left of canvas */}
        <div className="absolute bottom-12 left-4 z-10 bg-white rounded-xl p-3 shadow-md border border-gray-100 pointer-events-none">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-2">Entity Types</p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-500 capitalize">{type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip — fixed to viewport, safe from all stacking contexts */}
      {hover && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{ left: hover.x + 16, top: hover.y - 12 }}
        >
          <div className="bg-gray-950 text-white rounded-xl px-3 py-2 shadow-2xl border border-white/10 max-w-[220px]">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: hover.color }}>
              {hover.nodeType.replace(/_/g, ' ')}
            </p>
            <p className="text-xs font-semibold leading-snug truncate">{hover.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function GraphCanvas() {
  return <GraphCanvasInner />;
}
