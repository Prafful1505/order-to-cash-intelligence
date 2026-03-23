import type { GraphNode, ExpandResponse, NodeDetail, SchemaResponse } from '../types/graph';

const API_ROOT = import.meta.env.VITE_API_URL ?? '';
const BASE = `${API_ROOT}/api/graph`;

export async function fetchSchema(): Promise<SchemaResponse> {
  const res = await fetch(`${BASE}/schema`);
  if (!res.ok) throw new Error('Failed to fetch schema');
  return res.json();
}

export async function fetchNodes(type?: string, limit = 50, offset = 0): Promise<{ nodes: GraphNode[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (type) params.set('type', type);
  const res = await fetch(`${BASE}/nodes?${params}`);
  if (!res.ok) throw new Error('Failed to fetch nodes');
  return res.json();
}

export async function fetchNode(nodeId: string): Promise<NodeDetail> {
  const res = await fetch(`${BASE}/node/${encodeURIComponent(nodeId)}`);
  if (!res.ok) throw new Error(`Node not found: ${nodeId}`);
  return res.json();
}

export async function expandNode(nodeId: string): Promise<ExpandResponse> {
  const res = await fetch(`${BASE}/expand/${encodeURIComponent(nodeId)}`);
  if (!res.ok) throw new Error(`Failed to expand node: ${nodeId}`);
  return res.json();
}
