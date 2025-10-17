import { useState, useRef, useEffect } from 'react';
import { FleetProvider } from './context/FleetContext';
import { FleetMap } from './components/FleetMap';
import { WarehousesPanel } from './components/panels/WarehousesPanel';
import { RoutesPanel } from './components/panels/RoutesPanel';
import { VehiclesPanel } from './components/panels/VehiclesPanel';
import { DispatchPanel } from './components/panels/DispatchPanel';
import { ChatAssistant } from './components/ChatAssistant';
import { IntroModal } from './components/IntroModal';
import { Menu, Warehouse, Route, Truck, Send, X, MessageSquare } from 'lucide-react';

type Panel = 'warehouses' | 'routes' | 'vehicles' | 'dispatch' | 'chat';

function App() {
  const [activePanel, setActivePanel] = useState<Panel | null>('chat');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [panelWidth, setPanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
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
    <FleetProvider navigateToChat={navigateToChat} introOpen={showIntro}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/40">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 z-20 flex-shrink-0 shadow-lg">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-arkus rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Autonomous Fleet Control</h1>
                <p className="text-xs text-gray-600">AI-Powered Electric Vehicle Management</p>
              </div>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-800"
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
                        ? 'btn-gradient-arkus shadow-lg scale-105'
                        : 'bg-white text-gray-800 hover:bg-gray-50 hover:text-gray-900 border border-gray-300'
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
            <div className="lg:hidden border-t border-gray-200 px-4 py-3 space-y-2">
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
                        ? 'btn-gradient-arkus'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-300'
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
            <FleetMap introOpen={showIntro} />
          </main>

          {activePanel && ActivePanelComponent && (
            <aside
              className="hidden lg:block bg-white/95 backdrop-blur-sm shadow-2xl overflow-y-auto border-l border-gray-200 flex-shrink-0 relative"
              style={{ width: `${panelWidth}px` }}
            >
              <div
                ref={resizeRef}
                onMouseDown={handleMouseDown}
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-arkus-fuchsia transition-colors z-50 group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-arkus-fuchsia opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className={activePanel === 'chat' ? 'h-full' : 'p-6'}>
                <ActivePanelComponent />
              </div>
            </aside>
          )}

          {activePanel && ActivePanelComponent && (
            <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm shadow-2xl z-40 rounded-t-3xl max-h-[75vh] overflow-y-auto">
              <div className={activePanel === 'chat' ? 'h-full' : 'p-4'}>
                <ActivePanelComponent />
              </div>
            </div>
          )}
        </div>

        {showIntro && <IntroModal onClose={() => setShowIntro(false)} />}
      </div>
    </FleetProvider>
  );
}

export default App;
