export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  rows?: Record<string, unknown>[] | null;
  guardrail_blocked?: boolean;
  timestamp: Date;
}
