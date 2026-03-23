import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';
import type { GraphNode } from '../types/graph';

interface GraphStore {
  nodes: Node[];
  edges: Edge[];
  selectedNode: GraphNode | null;
  loadedNodeIds: Set<string>;
  expandingIds: Set<string>;
  showEdges: boolean;
  graphMinimized: boolean;
  // setters
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNodes: (nodes: Node[]) => void;
  addEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  markLoaded: (id: string) => void;
  setExpanding: (id: string, value: boolean) => void;
  toggleEdges: () => void;
  toggleMinimized: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  loadedNodeIds: new Set(),
  expandingIds: new Set(),
  showEdges: true,
  graphMinimized: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNodes: (newNodes) =>
    set((state) => {
      const existingIds = new Set(state.nodes.map((n) => n.id));
      const deduped = newNodes.filter((n) => !existingIds.has(n.id));
      return deduped.length ? { nodes: [...state.nodes, ...deduped] } : {};
    }),

  addEdges: (newEdges) =>
    set((state) => {
      const existingKeys = new Set(state.edges.map((e) => `${e.source}||${e.target}`));
      const deduped = newEdges.filter((e) => !existingKeys.has(`${e.source}||${e.target}`));
      return deduped.length ? { edges: [...state.edges, ...deduped] } : {};
    }),

  setSelectedNode: (node) => set({ selectedNode: node }),

  markLoaded: (id) =>
    set((state) => ({ loadedNodeIds: new Set([...state.loadedNodeIds, id]) })),

  setExpanding: (id, value) =>
    set((state) => {
      const s = new Set(state.expandingIds);
      value ? s.add(id) : s.delete(id);
      return { expandingIds: s };
    }),

  toggleEdges: () => set((state) => ({ showEdges: !state.showEdges })),
  toggleMinimized: () => set((state) => ({ graphMinimized: !state.graphMinimized })),
}));
