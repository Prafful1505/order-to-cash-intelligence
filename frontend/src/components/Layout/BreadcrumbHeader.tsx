interface Props {
  graphMinimized: boolean;
  onToggleMinimize: () => void;
}

export function BreadcrumbHeader({ graphMinimized, onToggleMinimize }: Props) {
  return (
    <header className="h-11 shrink-0 flex items-center justify-between px-5 bg-white border-b border-gray-100 z-30">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm select-none">
        <span className="text-gray-400 font-medium">Mapping</span>
        <svg className="w-3 h-3 text-gray-300" viewBox="0 0 8 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="1,1 7,6 1,11" />
        </svg>
        <span className="text-gray-900 font-semibold">Order to Cash</span>
      </div>

      {/* Right: minimize toggle */}
      <button
        onClick={onToggleMinimize}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          {graphMinimized ? (
            <><line x1="2" y1="8" x2="14" y2="8" /><polyline points="9,3 14,8 9,13" /></>
          ) : (
            <><line x1="2" y1="8" x2="14" y2="8" /><polyline points="7,3 2,8 7,13" /></>
          )}
        </svg>
        {graphMinimized ? 'Expand Graph' : 'Minimize'}
      </button>
    </header>
  );
}
