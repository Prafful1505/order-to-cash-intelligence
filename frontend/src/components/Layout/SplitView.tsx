import { ReactFlowProvider } from 'reactflow';
import { GraphCanvas } from '../Graph/GraphCanvas';
import { ChatPanel } from '../Chat/ChatPanel';
import { BreadcrumbHeader } from './BreadcrumbHeader';
import { useGraphStore } from '../../store/graphStore';

export function SplitView() {
  const { graphMinimized, toggleMinimized } = useGraphStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Global header */}
      <BreadcrumbHeader
        graphMinimized={graphMinimized}
        onToggleMinimize={toggleMinimized}
      />

      {/* Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Graph */}
        <div
          className="flex flex-col overflow-hidden transition-all duration-300"
          style={{
            flex: graphMinimized ? '0 0 0px' : '3 3 0%',
            borderRight: graphMinimized ? 'none' : '1px solid #e5e7eb',
            minWidth: 0,
          }}
        >
          {!graphMinimized && (
            <ReactFlowProvider>
              <GraphCanvas />
            </ReactFlowProvider>
          )}
        </div>

        {/* Chat */}
        <div className="flex flex-col min-w-0 flex-[2_2_0%] transition-all duration-300">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
