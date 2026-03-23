import type { Message } from '../types/chat';

const API_ROOT = import.meta.env.VITE_API_URL ?? '';
const BASE = `${API_ROOT}/api/chat`;

export interface QueryResponse {
  answer: string;
  sql: string | null;
  rows: Record<string, unknown>[] | null;
  guardrail_blocked: boolean;
}

export async function sendQuery(
  message: string,
  history: Message[],
): Promise<QueryResponse> {
  const conversation_history = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history }),
  });

  if (!res.ok) throw new Error('Chat query failed');
  return res.json();
}
