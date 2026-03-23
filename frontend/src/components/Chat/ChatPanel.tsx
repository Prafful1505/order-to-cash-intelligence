import { useChat } from '../../hooks/useChat';
import { MessageList } from './MessageList';
import { QueryInput } from './QueryInput';

export function ChatPanel() {
  const { messages, loading, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-gray-950 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-sm">D</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Dodge AI</p>
          <p className="text-[11px] text-gray-400">Graph Agent</p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} loading={loading} onSend={sendMessage} />

      {/* Input */}
      <QueryInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
