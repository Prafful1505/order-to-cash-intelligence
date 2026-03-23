import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function QueryInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    requestAnimationFrame(() => {
      if (el) el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    });
  }

  return (
    <div className="shrink-0 border-t border-gray-100 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onInput={onInput}
          disabled={disabled}
          placeholder={disabled ? 'Thinking…' : 'Ask about the data…'}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 disabled:opacity-40 transition-all"
          style={{ minHeight: '42px', maxHeight: '120px' }}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-gray-950 text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          aria-label="Send"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="13" x2="8" y2="3" />
            <polyline points="3,8 8,3 13,8" />
          </svg>
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-2 px-1 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${disabled ? 'bg-amber-400' : 'bg-emerald-400 pulse-dot'}`} />
        {disabled ? 'Dodge AI is thinking…' : 'Press Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  );
}
