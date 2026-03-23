import { useGraphStore } from '../../store/graphStore';
import { NODE_COLORS } from '../../hooks/useGraph';

const MAX_PROPS = 10;

export function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, edges } = useGraphStore();

  if (!selectedNode) return null;

  const color = NODE_COLORS[selectedNode.type] ?? '#94a3b8';
  const props = Object.entries(selectedNode.properties).filter(
    ([, val]) => val !== null && val !== undefined && val !== '',
  );
  const visibleProps = props.slice(0, MAX_PROPS);
  const hiddenCount = props.length - visibleProps.length;
  const connectionCount = edges.filter(
    (e) => e.source === selectedNode.id || e.target === selectedNode.id,
  ).length;

  return (
    <div className="absolute top-4 left-4 z-20 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: color }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <div className="w-3 h-3 rounded-full bg-white/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/70">
            {selectedNode.type.replace(/_/g, ' ')}
          </p>
          <p className="text-sm font-bold text-white truncate leading-tight">{selectedNode.label}</p>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors shrink-0"
          aria-label="Close"
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>

      {/* Properties */}
      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        <div className="px-4 py-3 space-y-2">
          {visibleProps.map(([key, val]) => (
            <div key={key} className="flex gap-2 items-start">
              <span
                className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0 pt-px"
                style={{ width: 110 }}
              >
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] text-gray-800 font-medium break-words min-w-0 leading-snug">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <p className="px-4 pb-2 text-[10px] text-gray-400 italic">
            {hiddenCount} more field{hiddenCount > 1 ? 's' : ''} hidden for readability
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] text-gray-500">
            <span className="font-bold text-gray-800">{connectionCount}</span> connection{connectionCount !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">Click to expand</span>
      </div>
    </div>
  );
}
