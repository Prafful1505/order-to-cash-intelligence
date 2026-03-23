import { useState } from 'react';
import type { Message } from '../../types/chat';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const [sqlOpen, setSqlOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-3 min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-gray-950 flex items-center justify-center shrink-0 shadow-sm mb-0.5">
          <span className="text-white font-black text-sm tracking-tighter">D</span>
        </div>
      )}

      <div className={`min-w-0 max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Main bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed break-words w-full ${
            isUser
              ? 'bg-gray-950 text-white rounded-2xl rounded-br-sm'
              : message.guardrail_blocked
              ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl rounded-bl-sm'
              : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.guardrail_blocked && (
            <span className="inline-flex items-center mr-1.5 text-amber-500">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
            </span>
          )}
          {message.content}
        </div>

        {/* SQL block */}
        {message.sql && (
          <div className="w-full">
            <button
              onClick={() => setSqlOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 px-1 transition-colors"
            >
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-150 ${sqlOpen ? 'rotate-90' : ''}`}
                viewBox="0 0 8 8" fill="currentColor"
              >
                <polygon points="1,1 7,4 1,7" />
              </svg>
              View SQL
            </button>
            {sqlOpen && (
              <pre className="mt-1.5 text-[11px] bg-gray-950 text-emerald-300 rounded-xl p-3.5 overflow-x-auto whitespace-pre leading-relaxed border border-gray-800">
                {message.sql}
              </pre>
            )}
          </div>
        )}

        {/* Result rows */}
        {message.rows && message.rows.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setRowsOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 px-1 transition-colors"
            >
              <svg
                className={`w-2.5 h-2.5 transition-transform duration-150 ${rowsOpen ? 'rotate-90' : ''}`}
                viewBox="0 0 8 8" fill="currentColor"
              >
                <polygon points="1,1 7,4 1,7" />
              </svg>
              {message.rows.length} row{message.rows.length !== 1 ? 's' : ''} returned
            </button>
            {rowsOpen && message.rows[0] && (
              <div className="mt-1.5 overflow-x-auto rounded-xl border border-gray-100 shadow-sm bg-white">
                <table className="text-[11px] text-left w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {Object.keys(message.rows[0]).map((col) => (
                        <th key={col} className="px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide text-[9px] whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                            {val === null || val === undefined ? <span className="text-gray-300">—</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {message.rows.length > 20 && (
                  <p className="text-[10px] text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-100">
                    Showing 20 of {message.rows.length} rows
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <span className="text-[10px] text-gray-300 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
