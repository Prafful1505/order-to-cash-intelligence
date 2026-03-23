import { useEffect, useRef } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

const SUGGESTIONS = [
  'Which customer has the most orders?',
  'Which orders are delivered but not billed?',
  'Total payment amount per customer?',
  'List all overdue deliveries',
];

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (text: string) => void;
}

export function MessageList({ messages, loading, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Greeting */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-950 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Hi! Ask me anything about the <strong className="text-gray-900">Order to Cash</strong> data.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="ml-11">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Try asking
          </p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => onSend(q)}
                className="text-left text-xs text-gray-600 bg-white hover:bg-gray-950 hover:text-white border border-gray-200 hover:border-gray-900 rounded-xl px-3.5 py-2.5 transition-all duration-150 font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {loading && (
        <div className="flex items-end gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-950 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
            <span className="bounce-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <span className="bounce-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <span className="bounce-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
