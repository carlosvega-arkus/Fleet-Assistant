import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FleetProvider, useFleet } from './context/FleetContext';
import { FleetMap } from './components/FleetMap';
import { WarehousesPanel } from './components/panels/WarehousesPanel';
import { RoutesPanel } from './components/panels/RoutesPanel';
import { VehiclesPanel } from './components/panels/VehiclesPanel';
import { DispatchPanel } from './components/panels/DispatchPanel';
import { ChatAssistant } from './components/ChatAssistant';
import { IntroModal } from './components/IntroModal';
import { MobilePanelController } from './components/MobilePanelController';
import { Menu, Warehouse, Route, Truck, Send, X, MessageSquare, Bot } from 'lucide-react';

type Panel = 'warehouses' | 'routes' | 'vehicles' | 'dispatch' | 'chat';

function App() {
  const [activePanel, setActivePanel] = useState<Panel | null>(() => (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'chat' : null));
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [panelWidth, setPanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [mobilePanelHeight, setMobilePanelHeight] = useState(60);
  const [isMobilePanelDragging, setIsMobilePanelDragging] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const mobileDragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const panels = {
    warehouses: { component: WarehousesPanel, icon: Warehouse, label: 'Warehouses' },
    routes: { component: RoutesPanel, icon: Route, label: 'Routes' },
    vehicles: { component: VehiclesPanel, icon: Truck, label: 'Vehicles' },
    dispatch: { component: DispatchPanel, icon: Send, label: 'Dispatch' },
    chat: { component: ChatAssistant, icon: MessageSquare, label: 'AI Assistant' }
  };

  const ActivePanelComponent = activePanel ? panels[activePanel].component : null;

  // Lock body scroll when floating chat is open (mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const htmlEl = document.documentElement as HTMLElement;
    const bodyEl = document.body as HTMLBodyElement;
    const prevBodyOverflow = bodyEl.style.overflow;
    const prevBodyTouchAction = (bodyEl.style as any).touchAction as string | undefined;
    const prevHtmlOverscrollY = (htmlEl.style as any).overscrollBehaviorY as string | undefined;
    if (activePanel === 'chat') {
      bodyEl.style.overflow = 'hidden';
      (bodyEl.style as any).touchAction = 'none';
      (htmlEl.style as any).overscrollBehaviorY = 'none';
    } else {
      bodyEl.style.overflow = prevBodyOverflow || '';
      (bodyEl.style as any).touchAction = prevBodyTouchAction || '';
      (htmlEl.style as any).overscrollBehaviorY = prevHtmlOverscrollY || '';
    }
    return () => {
      bodyEl.style.overflow = prevBodyOverflow || '';
      (bodyEl.style as any).touchAction = prevBodyTouchAction || '';
      (htmlEl.style as any).overscrollBehaviorY = prevHtmlOverscrollY || '';
    };
  }, [activePanel]);

  // Sync chat open/close with activePanel
  function ChatStateSync({ active }: { active: Panel | null }) {
    const { openChat, closeChat, resetUnread } = useFleet();
    useEffect(() => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
      if (active === 'chat') {
        openChat();
        resetUnread();
      } else {
        closeChat();
      }
    }, [active, openChat, closeChat, resetUnread]);
    return null;
  }

  // Mobile chat bubble component
  function MobileChatBubble({ activePanel, setActivePanel }: { activePanel: Panel | null; setActivePanel: (p: Panel | null) => void }) {
    const { isChatOpen, unreadCount, openChat, resetUnread } = useFleet();
    
    // Only show bubble when chat is not active and we're on mobile
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return null;
    if (activePanel === 'chat') return null;
    
    const bubble = (
      <button
        onClick={() => {
          setActivePanel('chat');
          openChat();
          resetUnread();
        }}
        className="lg:hidden rounded-full shadow-xl bg-arkus-black text-white w-14 h-14 flex items-center justify-center active:scale-95 transition-transform relative"
        style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        <Bot className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );

    return typeof document !== 'undefined' ? createPortal(bubble, document.body) : bubble;
  }



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

  // Mobile panel drag handlers
  const handleMobilePanelMouseDown = (e: React.MouseEvent) => {
    setIsMobilePanelDragging(true);
    mobileDragRef.current = { startY: e.clientY, startHeight: mobilePanelHeight };
    
    const handleMouseMove = (ev: MouseEvent) => {
      if (!mobileDragRef.current) return;
      const dy = ev.clientY - mobileDragRef.current.startY;
      const newHeight = Math.max(15, Math.min(85, mobileDragRef.current.startHeight - (dy / window.innerHeight) * 100));
      setMobilePanelHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsMobilePanelDragging(false);
      mobileDragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMobilePanelTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsMobilePanelDragging(true);
    mobileDragRef.current = { startY: touch.clientY, startHeight: mobilePanelHeight };
    
    const handleTouchMove = (ev: TouchEvent) => {
      if (!mobileDragRef.current) return;
      const t = ev.touches[0];
      const dy = t.clientY - mobileDragRef.current.startY;
      const newHeight = Math.max(15, Math.min(85, mobileDragRef.current.startHeight - (dy / window.innerHeight) * 100));
      setMobilePanelHeight(newHeight);
    };
    
    const handleTouchEnd = () => {
      setIsMobilePanelDragging(false);
      mobileDragRef.current = null;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const navigateToChat = () => {
    setActivePanel('chat');
  };

  return (
    <FleetProvider navigateToChat={navigateToChat} introOpen={showIntro}>
      {/* Global gradient defs for section icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="grad-section-icon" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F70D3F" />
            <stop offset="50%" stopColor="#EC10A9" />
            <stop offset="100%" stopColor="#0055FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/40">
        <MobilePanelController activePanel={activePanel} setMobilePanelHeight={setMobilePanelHeight} />
        <ChatStateSync active={activePanel} />
        
        {/* Mobile chat bubble - only show when chat is not active */}
        <MobileChatBubble activePanel={activePanel} setActivePanel={setActivePanel} />
        
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 z-20 flex-shrink-0 shadow-lg">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-arkus rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-display">Autonomous Fleet Control</h1>
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
          <main className="flex-1 relative overflow-hidden" onTouchMove={(e) => {
            // If a floating modal (chat) is present, don't let the map scroll hijack the gesture
            const target = e.target as HTMLElement;
            if (target && (target.closest('[data-chat-modal="true"]'))) {
              e.stopPropagation();
            }
          }}>
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

          {/* Mobile panels - exclude chat */}
          {activePanel && activePanel !== 'chat' && ActivePanelComponent && (
            <div 
              className="lg:hidden fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm shadow-2xl z-40 rounded-t-3xl overflow-hidden"
              style={{ 
                height: `${mobilePanelHeight}vh`, 
                transition: isMobilePanelDragging ? 'none' : 'height 300ms ease-out' 
              }}
            >
              {/* Drag handle */}
              <div
                onMouseDown={handleMobilePanelMouseDown}
                onTouchStart={handleMobilePanelTouchStart}
                className="w-full py-2 cursor-row-resize flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <ActivePanelComponent />
                </div>
              </div>
            </div>
          )}

          {/* Mobile chat - floating bubble */}
          {activePanel === 'chat' && (
            <div
              className="lg:hidden fixed inset-x-4 bottom-4 bg-white/95 backdrop-blur-sm shadow-2xl z-50 rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
              data-chat-modal="true"
              style={{ touchAction: 'manipulation', height: '75vh' }}
              onTouchStart={(e) => { e.stopPropagation(); }}
              onTouchMove={(e) => { e.stopPropagation(); }}
              onWheel={(e) => { e.stopPropagation(); }}
            >
              {/* Close button */}
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setActivePanel(null)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 border border-gray-200 shadow hover:bg-gray-100 active:scale-95 transition"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
              
              <div className="flex-1 min-h-0 overflow-hidden" style={{ overscrollBehaviorY: 'contain' }}>
                <ChatAssistant />
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
