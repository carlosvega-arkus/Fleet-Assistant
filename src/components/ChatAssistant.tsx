import { Send, Bot, Circle, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { queryGemini } from '../services/gemini';
import { analyzeRouteEfficiency, suggestBestVehicle } from '../services/routeCalculator';
import { DataTable } from './DataTable';
import { RouteTableData, VehicleTableData, WarehouseTableData } from '../types';

const formatMessageContent = (content: string, isUser: boolean): JSX.Element => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    if (line.startsWith('**') && line.endsWith('**')) {
      const text = line.replace(/\*\*/g, '');
      elements.push(
        <div key={index} className={`font-bold mt-2 mb-1.5 text-sm ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {text}
        </div>
      );
    } else if (line.trim().startsWith('✓')) {
      const text = line.replace('✓', '').trim();
      const parts = text.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={index} className="flex items-start gap-2 mb-1">
          <span className={`text-sm ${isUser ? 'text-white' : 'text-green-600'}`}>✓</span>
          <span className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-gray-900'}`}>{part.replace(/\*\*/g, '')}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </span>
        </div>
      );
    } else if (line.trim().startsWith('•')) {
      const text = line.replace('•', '').trim();
      const parts = text.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={index} className="flex items-start gap-2 ml-2 mb-1">
          <Circle className={`w-1.5 h-1.5 mt-1.5 flex-shrink-0 ${isUser ? 'fill-white text-white' : 'fill-blue-500 text-blue-500'}`} />
          <span className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-gray-900'}`}>{part.replace(/\*\*/g, '')}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </span>
        </div>
      );
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={index} className={`text-sm leading-relaxed mb-0.5 ${isUser ? 'text-white' : 'text-gray-700'}`}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-gray-900'}`}>{part.replace(/\*\*/g, '')}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    }
  });

  return <>{elements}</>;
};

export function ChatAssistant() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingDispatch, setPendingDispatch] = useState<{ vehicleId: string; routeId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { chatMessages, addChatMessage, vehicles, savedRoutes, warehouses, toggleRouteVisibility, setFocusedRoute, dispatchVehicle } = useFleet();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const buildContext = (): string => {
    const vehicleInfo = vehicles.map(v => {
      const route = v.currentRouteId ? savedRoutes.find(r => r.id === v.currentRouteId) : null;
      return `- ${v.alias} (ID: ${v.id}, License: ${v.licensePlate})
  Status: ${v.status}${v.status === 'in_route' ? `
  Current Route: ${route?.name || v.currentRouteId}
  ETA: ${v.eta} minutes
  Stops Remaining: ${v.stopsRemaining}
  Progress: ${Math.round((v.routeProgress || 0) * 100)}%` : ''}`;
    }).join('\n');

    const routeInfo = savedRoutes.map(r => {
      const origin = warehouses.find(w => w.id === r.originWarehouseId);
      const destination = warehouses.find(w => w.id === r.destinationWarehouseId);
      const assignedVehicle = vehicles.find(v => v.currentRouteId === r.id);

      return `- ${r.id.toUpperCase()} (${r.name})
  Origin: ${origin?.name}
  Destination: ${destination?.name}
  Stops: ${r.stops.length} (${r.stops.map(s => s.businessName).join(', ')})
  Assigned Vehicle: ${assignedVehicle ? assignedVehicle.alias : 'None'}
  Status: ${assignedVehicle ? 'Active' : 'Available'}`;
    }).join('\n\n');

    const warehouseInfo = warehouses.map(w => {
      const routesFromHere = savedRoutes.filter(r => r.originWarehouseId === w.id).length;
      const routesToHere = savedRoutes.filter(r => r.destinationWarehouseId === w.id).length;

      return `- ${w.id.toUpperCase()} (${w.name})
  Address: ${w.address}
  Coordinates: ${w.coordinates.lat}, ${w.coordinates.lng}
  Outbound Routes: ${routesFromHere}
  Inbound Routes: ${routesToHere}`;
    }).join('\n\n');

    const efficiencyAnalysis = analyzeRouteEfficiency(savedRoutes, vehicles);

    return `FLEET MANAGEMENT SYSTEM DATA:

=== VEHICLES (${vehicles.length} total) ===
${vehicleInfo}

=== ROUTES (${savedRoutes.length} total) ===
${routeInfo}

=== WAREHOUSES (${warehouses.length} total) ===
${warehouseInfo}

=== EFFICIENCY ANALYSIS ===
${efficiencyAnalysis}`;
  };

  const handleAction = (actionText: string) => {
    try {
      const jsonMatch = actionText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const action = JSON.parse(jsonMatch[0]);

        if (action.action === 'show_route' && action.params?.routeId) {
          const routeId = action.params.routeId.toLowerCase();
          const route = savedRoutes.find(r => r.id === routeId);
          if (route && !visibleRouteIds.has(route.id)) {
            toggleRouteVisibility(route.id);
          }
          return true;
        } else if (action.action === 'focus_route' && action.params?.routeId) {
          const routeId = action.params.routeId.toLowerCase();
          const route = savedRoutes.find(r => r.id === routeId);
          if (route) {
            if (!visibleRouteIds.has(route.id)) {
              toggleRouteVisibility(route.id);
            }
            setFocusedRoute(route.id);
            return true;
          }
        } else if (action.action === 'dispatch' && action.params?.vehicleId && action.params?.routeId) {
          const routeId = action.params.routeId.toLowerCase();
          let vehicleId = action.params.vehicleId;

          if (vehicleId.startsWith('U-') || vehicleId.startsWith('u-')) {
            const vehicle = vehicles.find(v => v.alias.toLowerCase() === vehicleId.toLowerCase());
            if (vehicle) {
              vehicleId = vehicle.id;
            }
          }

          const route = savedRoutes.find(r => r.id === routeId);
          const vehicle = vehicles.find(v => v.id === vehicleId);

          if (route && vehicle) {
            dispatchVehicle(vehicleId, routeId);
            if (!visibleRouteIds.has(routeId)) {
              toggleRouteVisibility(routeId);
            }
            return true;
          }
        } else if (action.action === 'suggest_vehicle' && action.params?.routeId) {
          const routeId = action.params.routeId.toLowerCase();
          const route = savedRoutes.find(r => r.id === routeId);
          if (route) {
            const suggestedVehicle = suggestBestVehicle(route, vehicles);
            if (suggestedVehicle) {
              addChatMessage({
                type: 'assistant',
                content: `I recommend dispatching ${suggestedVehicle.alias} (${suggestedVehicle.licensePlate}) for ${route.name}. Would you like me to dispatch it?`
              });
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.error('Action parsing error:', e);
    }
    return false;
  };

  const parseStructuredResponse = (userMessage: string, response: string): {
    content: string;
    structuredData?: RouteTableData | VehicleTableData | WarehouseTableData
  } => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('list') || lowerMessage.includes('show all') || lowerMessage.includes('all routes') || lowerMessage.includes('all vehicles') || lowerMessage.includes('all warehouses')) {
      if (lowerMessage.includes('route')) {
        const routeData: RouteTableData = {
          type: 'routes',
          routes: savedRoutes.map(r => {
            const origin = warehouses.find(w => w.id === r.originWarehouseId);
            const destination = warehouses.find(w => w.id === r.destinationWarehouseId);
            const assignedVehicle = vehicles.find(v => v.currentRouteId === r.id);

            return {
              id: r.id.toUpperCase(),
              name: r.name,
              origin: origin?.name || 'Unknown',
              destination: destination?.name || 'Unknown',
              stops: r.stops.length,
              stopsList: r.stops.map(s => s.businessName).join(', '),
              assignedVehicle: assignedVehicle?.alias || 'None',
              status: assignedVehicle ? 'Active' : 'Available'
            };
          })
        };
        return {
          content: 'Here are all the routes in the system:',
          structuredData: routeData
        };
      }

      if (lowerMessage.includes('vehicle')) {
        const vehicleData: VehicleTableData = {
          type: 'vehicles',
          vehicles: vehicles.map(v => {
            const route = v.currentRouteId ? savedRoutes.find(r => r.id === v.currentRouteId) : null;
            return {
              alias: v.alias,
              licensePlate: v.licensePlate,
              status: v.status,
              currentRoute: route?.name || '—',
              eta: v.eta ? `${v.eta} min` : '—',
              stopsRemaining: v.stopsRemaining ? v.stopsRemaining.toString() : '—',
              progress: v.routeProgress ? `${Math.round(v.routeProgress * 100)}%` : '—'
            };
          })
        };
        return {
          content: 'Here are all the vehicles in the fleet:',
          structuredData: vehicleData
        };
      }

      if (lowerMessage.includes('warehouse')) {
        const warehouseData: WarehouseTableData = {
          type: 'warehouses',
          warehouses: warehouses.map(w => {
            const routesFromHere = savedRoutes.filter(r => r.originWarehouseId === w.id).length;
            const routesToHere = savedRoutes.filter(r => r.destinationWarehouseId === w.id).length;

            return {
              id: w.id.toUpperCase(),
              name: w.name,
              address: w.address,
              coordinates: `${w.coordinates.lat.toFixed(4)}, ${w.coordinates.lng.toFixed(4)}`,
              outboundRoutes: routesFromHere,
              inboundRoutes: routesToHere
            };
          })
        };
        return {
          content: 'Here are all the warehouses:',
          structuredData: warehouseData
        };
      }
    }

    return { content: response.replace(/\{[^}]+\}/, '').trim() || response };
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    const lowerMessage = userMessage.toLowerCase();
    setInput('');
    setIsProcessing(true);

    addChatMessage({
      type: 'user',
      content: userMessage
    });

    try {
      if (pendingDispatch && (lowerMessage === 'yes' || lowerMessage === 'confirm' || lowerMessage === 'dispatch' || lowerMessage === 'send it' || lowerMessage === 'si' || lowerMessage === 'ok')) {
        const routeId = pendingDispatch.routeId.toLowerCase();
        let vehicleId = pendingDispatch.vehicleId;

        if (vehicleId.startsWith('U-') || vehicleId.startsWith('u-')) {
          const vehicle = vehicles.find(v => v.alias.toLowerCase() === vehicleId.toLowerCase());
          if (vehicle) {
            vehicleId = vehicle.id;
          }
        }

        const route = savedRoutes.find(r => r.id === routeId);
        const vehicle = vehicles.find(v => v.id === vehicleId);

        if (route && vehicle) {
          dispatchVehicle(vehicleId, routeId);

          addChatMessage({
            type: 'assistant',
            content: `✓ Vehicle dispatched successfully! ${pendingDispatch.vehicleId.toUpperCase()} is now en route to ${route.name}.`
          });
        } else {
          addChatMessage({
            type: 'assistant',
            content: `Sorry, I couldn't complete the dispatch. Please try again.`
          });
        }

        setPendingDispatch(null);
      } else {
        const context = buildContext();
        const response = await queryGemini(userMessage, context);

        const actionExecuted = handleAction(response);

        const parsed = parseStructuredResponse(userMessage, response);

        if (lowerMessage.includes('best vehicle') || lowerMessage.includes('which vehicle') || lowerMessage.includes('what vehicle') || lowerMessage.includes('send') || lowerMessage.includes('want to')) {
          try {
            const jsonMatch = response.match(/\{[^}]+\}/);
            if (jsonMatch) {
              const suggestion = JSON.parse(jsonMatch[0]);
              if (suggestion.action === 'suggest_vehicle' && suggestion.params?.vehicleId && suggestion.params?.routeId) {
                const vehicleId = suggestion.params.vehicleId;
                const routeId = suggestion.params.routeId;
                setPendingDispatch({ vehicleId, routeId });
              }
            }
          } catch (e) {
            console.log('No dispatch suggestion found');
          }
        }

        addChatMessage({
          type: 'assistant',
          content: parsed.content,
          structuredData: parsed.structuredData
        });
      }
    } catch (error) {
      addChatMessage({
        type: 'assistant',
        content: "I'm having trouble processing that request. Could you please try rephrasing?"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const quickActions = [
    'List all routes',
    'Show route RT-001',
    'List all vehicles'
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Fleet AI Assistant</h2>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map(message => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} ${message.structuredData ? 'w-full' : 'max-w-[75%]'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                }`}
              >
                {message.content && (
                  <div>
                    {formatMessageContent(message.content, message.type === 'user')}
                  </div>
                )}
                {message.structuredData && (
                  <DataTable data={message.structuredData} />
                )}
              </div>
              <div className={`text-xs text-gray-500 mt-1 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap transition-colors border border-blue-200"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-500 transition-all focus:bg-white"
            disabled={isProcessing}
          />
          <button
            onClick={() => {
              handleSend();
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            disabled={!input.trim() || isProcessing}
            className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
