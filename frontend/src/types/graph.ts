export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface ExpandResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NodeDetail {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  edges: Array<{ source?: string; target?: string; relationship: string }>;
  neighbors: Array<{ id: string; type: string; label: string }>;
}

export interface SchemaResponse {
  node_types: string[];
  edge_types: string[];
  node_count: number;
  edge_count: number;
}
