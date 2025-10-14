import { useState, useRef, useEffect } from 'react';
import { FleetProvider } from './context/FleetContext';
import { FleetMap } from './components/FleetMap';
import { WarehousesPanel } from './components/panels/WarehousesPanel';
import { RoutesPanel } from './components/panels/RoutesPanel';
import { VehiclesPanel } from './components/panels/VehiclesPanel';
import { DispatchPanel } from './components/panels/DispatchPanel';
import { ChatAssistant } from './components/ChatAssistant';
import { Menu, Warehouse, Route, Truck, Send, X, MessageSquare } from 'lucide-react';

type Panel = 'warehouses' | 'routes' | 'vehicles' | 'dispatch' | 'chat';

function App() {
  const [activePanel, setActivePanel] = useState<Panel | null>('chat');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [panelWidth, setPanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const panels = {
    warehouses: { component: WarehousesPanel, icon: Warehouse, label: 'Warehouses' },
    routes: { component: RoutesPanel, icon: Route, label: 'Routes' },
    vehicles: { component: VehiclesPanel, icon: Truck, label: 'Vehicles' },
    dispatch: { component: DispatchPanel, icon: Send, label: 'Dispatch' },
    chat: { component: ChatAssistant, icon: MessageSquare, label: 'AI Assistant' }
  };

  const ActivePanelComponent = activePanel ? panels[activePanel].component : null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.7;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const navigateToChat = () => {
    setActivePanel('chat');
  };

  return (
    <FleetProvider navigateToChat={navigateToChat}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-900">
        <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 z-20 flex-shrink-0 shadow-2xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Fleet Control</h1>
                <p className="text-xs text-gray-400">Real-time Logistics Management</p>
              </div>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden lg:flex gap-3">
              {Object.entries(panels).map(([key, panel]) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActivePanel(activePanel === key ? null : key as Panel)}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                      activePanel === key
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {panel.label}
                  </button>
                );
              })}
            </div>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-700 px-4 py-3 space-y-2">
              {Object.entries(panels).map(([key, panel]) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActivePanel(activePanel === key ? null : key as Panel);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-3 ${
                      activePanel === key
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {panel.label}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <main className="flex-1 relative overflow-hidden">
            <FleetMap />
          </main>

          {activePanel && ActivePanelComponent && (
            <aside
              className="hidden lg:block bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl overflow-y-auto border-l border-gray-700 flex-shrink-0 relative"
              style={{ width: `${panelWidth}px` }}
            >
              <div
                ref={resizeRef}
                onMouseDown={handleMouseDown}
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors z-50 group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className={activePanel === 'chat' ? 'h-full' : 'p-6'}>
                <ActivePanelComponent />
              </div>
            </aside>
          )}

          {activePanel && ActivePanelComponent && (
            <div className="lg:hidden fixed inset-x-0 bottom-0 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl z-40 rounded-t-3xl max-h-[75vh] overflow-y-auto">
              <div className={activePanel === 'chat' ? 'h-full' : 'p-4'}>
                <ActivePanelComponent />
              </div>
            </div>
          )}
        </div>
      </div>
    </FleetProvider>
  );
}

export default App;
