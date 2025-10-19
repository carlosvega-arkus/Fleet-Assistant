import { Send, Bot, Circle, User } from 'lucide-react';
import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useFleet } from '../context/FleetContext';
import { queryGemini } from '../services/gemini';
import { analyzeRouteEfficiency, suggestBestVehicle } from '../services/routeCalculator';
import { DataTable } from './DataTable';
import { RouteTableData, VehicleTableData, WarehouseTableData } from '../types';

function extractFirstJsonBlock(text: string): { jsonText: string; start: number; end: number } | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) {
      const jsonText = text.slice(start, i + 1);
      return { jsonText, start, end: i };
    }
  }

  return null;
}

function stripCodeFences(text: string): string {
  // Remove any fenced code blocks like ```json ... ``` or ``` ... ```
  return text.replace(/```[a-zA-Z]*[\s\S]*?```/g, '').trim();
}

const formatMessageContent = (content: string, isUser: boolean): JSX.Element => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    if (line.trim() === '') {
      elements.push(<br key={`br-${index}`} />);
      return;
    }

    // clickable See more link pattern: [See more|rt-001]
    const seeMoreMatch = line.trim().match(/^\[See more\|(rt-\d{3})\]$/i);
    if (seeMoreMatch) {
      const rid = seeMoreMatch[1].toLowerCase();
      elements.push(
        <button
          key={`see-more-${index}`}
          data-action="see-more-traffic"
          data-route={rid}
          className={`text-sm underline ${isUser ? 'text-white' : 'text-arkus-blue'} cursor-pointer`}
        >
          See more...
        </button>
      );
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
          <span className={`text-sm ${isUser ? 'text-white' : 'text-green-500'}`}>✓</span>
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
          <Circle className={`w-1.5 h-1.5 mt-1.5 flex-shrink-0 ${isUser ? 'fill-white text-white' : 'fill-arkus-blue text-arkus-blue'}`} />
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
  const [pendingReroute, setPendingReroute] = useState<{ routeId: string; avoid?: { lat: number; lng: number } } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { chatMessages, addChatMessage, vehicles, savedRoutes, warehouses, toggleRouteVisibility, setFocusedRoute, dispatchVehicle, visibleRouteIds, routeTraffic, proposeDetour, confirmDetour } = useFleet();
  const { focusTrafficAlert } = useFleet();

  // Handle clicking See more... in chat to focus alert and expand details
  const handleChatClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const action = target?.getAttribute('data-action');
    const rid = target?.getAttribute('data-route');
    if (action === 'see-more-traffic' && rid) {
      focusTrafficAlert(rid);
      answerTrafficQueryLocally(`traffic ${rid}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const buildContext = (): string => {
    const vehicleInfo = vehicles.map(v => {
      const route = v.currentRouteId ? savedRoutes.find(r => r.id === v.currentRouteId) : null;
      const tel = v.telemetry;
      return `- ${v.alias} (ID: ${v.id}, License: ${v.licensePlate})
  Status: ${v.status}${v.status === 'in_route' ? `
  Current Route: ${route?.name || v.currentRouteId}
  ETA: ${v.eta} minutes
  Stops Remaining: ${v.stopsRemaining}
  Progress: ${Math.round((v.routeProgress || 0) * 100)}%` : ''}${tel ? `
  TELEMETRY:
    Battery: ${tel.batteryLevel}% (${tel.range}km range, ${tel.batteryTemperature.toFixed(1)}°C)
    Speed: ${tel.speed}km/h
    Motor Temp: ${tel.motorTemperature.toFixed(1)}°C
    Power: ${tel.powerConsumption.toFixed(1)}kW
    Autonomy: ${tel.autonomyMode}
    Obstacles: ${tel.obstaclesDetected}
    Signal: ${tel.signalStrength}%` : ''}`;
    }).join('\n');

    const routeInfo = savedRoutes.map(r => {
      const origin = warehouses.find(w => w.id === r.originWarehouseId);
      const destination = warehouses.find(w => w.id === r.destinationWarehouseId);
      const assignedVehicle = vehicles.find(v => v.currentRouteId === r.id);
      const traffic = routeTraffic[r.id];

      return `- ${r.id.toUpperCase()} (${r.name})
  Origin: ${origin?.name}
  Destination: ${destination?.name}
  Stops: ${r.stops.length} (${r.stops.map(s => s.businessName).join(', ')})
  Assigned Vehicle: ${assignedVehicle ? assignedVehicle.alias : 'None'}
  Status: ${assignedVehicle ? 'Active' : 'Available'}
  Traffic: ${traffic ? `${traffic.status.toUpperCase()}${traffic.delayMinutes ? ` (+${traffic.delayMinutes} min)` : ''}` : 'UNKNOWN'}`;
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

    const trafficSummary = savedRoutes.map(r => {
      const t = routeTraffic[r.id];
      return `  - ${r.id.toUpperCase()}: ${t ? `${t.status}${t.delayMinutes ? ` (+${t.delayMinutes} min)` : ''}` : 'unknown'}`;
    }).join('\n');

    return `AUTONOMOUS ELECTRIC FLEET MANAGEMENT SYSTEM DATA:

=== AUTONOMOUS ELECTRIC VEHICLES (${vehicles.length} total) ===
Note: All vehicles are autonomous electric vehicles with real-time telemetry monitoring.
${vehicleInfo}

=== ROUTES (${savedRoutes.length} total) ===
${routeInfo}

=== WAREHOUSES (${warehouses.length} total) ===
${warehouseInfo}

=== EFFICIENCY ANALYSIS ===
${efficiencyAnalysis}

=== TRAFFIC STATUS ===
${trafficSummary}`;
  };

  const answerTrafficQueryLocally = (userMessage: string): boolean => {
    const lower = userMessage.toLowerCase();
    if (lower.includes('traffic') || lower.includes('jam') || lower.includes('congestion') || lower.includes('closed') || lower.includes('delay')) {
      // Try to detect a specific route
      const idMatch = userMessage.match(/\brt[-_ ]?\d{3}\b/i);
      let targetRoute = null as typeof savedRoutes[number] | null;
      if (idMatch) {
        const rid = idMatch[0].toLowerCase().replace(/[-_ ]/, '-');
        targetRoute = savedRoutes.find(r => r.id === rid) || null;
      } else {
        targetRoute = savedRoutes.find(r => lower.includes(r.name.toLowerCase())) || null;
      }

      if (targetRoute) {
        const t = routeTraffic[targetRoute.id];
        if (!t || t.status === 'normal') {
          addChatMessage({ type: 'assistant', content: `${targetRoute.id.toUpperCase()} (${targetRoute.name}) has no traffic alerts right now.` });
          return true;
        }
        // Build contextual details similar to the map popup
        let nearestStopText = '';
        if (targetRoute.stops && targetRoute.stops.length > 0 && t.coordinates) {
          const alertPos = t.coordinates;
          let bestIdx = 0;
          let bestDist = Infinity;
          targetRoute.stops.forEach((s, idx) => {
            const dLat = s.coordinates.lat - alertPos.lat;
            const dLng = s.coordinates.lng - alertPos.lng;
            const d2 = dLat * dLat + dLng * dLng;
            if (d2 < bestDist) { bestDist = d2; bestIdx = idx; }
          });
          const s = targetRoute.stops[bestIdx];
          nearestStopText = `Near Stop #${s.stopNumber} — ${s.businessName}${s.address ? ` (${s.address})` : ''}`;
        }
        const impact = t.status === 'closed' ? 'Segment closed; detour required.' : 'Heavy congestion; slower speeds expected.';
        let suggestion = '';
        const alt = savedRoutes.find(r => r.id !== targetRoute!.id && r.destinationWarehouseId === targetRoute!.destinationWarehouseId);
        if (alt) {
          suggestion = `Suggest detouring around the affected segment. I can modify ${targetRoute.id.toUpperCase()} to avoid this area ahead.`;
          // create pending detour overlay and queue confirmation
          setPendingReroute({ routeId: targetRoute.id, avoid: t.coordinates });
          proposeDetour(targetRoute.id, t.coordinates, undefined);
        } else if (targetRoute.stops.length > 1 && nearestStopText) {
          const idx = targetRoute.stops.findIndex(x => nearestStopText.includes(x.businessName));
          const sIdx = Math.max(1, Math.min(targetRoute.stops.length - 1, idx));
          suggestion = `Detour between stops #${sIdx} and #${sIdx + 1} using arterials to bypass the affected segment.`;
        } else {
          suggestion = `Use major arterials around the affected area and rejoin the route afterward.`;
        }

        const content = `**Traffic alert for ${targetRoute.id.toUpperCase()} (${targetRoute.name})**\n• **Status:** ${t.status.toUpperCase()}${t.delayMinutes ? ` (+${t.delayMinutes} min)` : ''}\n${nearestStopText ? `• **Location:** ${nearestStopText}\n` : ''}• **Impact:** ${impact}\n• **Updated:** ${new Date(t.updatedAt).toLocaleTimeString()}\n\n**Detour proposal**\n${suggestion}${t.coordinates ? `\n\nWould you like me to modify ${targetRoute.id.toUpperCase()} to avoid this area ahead?` : ''}`;
        addChatMessage({ type: 'assistant', content });
        return true;
      } else {
        // Fall back to all impacted routes
        const impacted = savedRoutes.filter(r => {
          const t = routeTraffic[r.id];
          return t && (t.status === 'heavy' || t.status === 'closed');
        });
        if (impacted.length === 0) {
          addChatMessage({ type: 'assistant', content: 'Traffic looks clear on all routes at the moment.' });
          return true;
        }
        const lines = impacted.map(r => {
          const t = routeTraffic[r.id]!;
          return `- ${r.id.toUpperCase()} (${r.name}): ${t.status.toUpperCase()}${t.delayMinutes ? ` (+${t.delayMinutes} min)` : ''}`;
        }).join('\n');
        addChatMessage({ type: 'assistant', content: `Here are the current traffic alerts affecting routes:\n${lines}` });
        return true;
      }
    }
    return false;
  };

  const handleAction = (actionText: string) => {
    try {
      const block = extractFirstJsonBlock(actionText);
      if (block) {
        const action = JSON.parse(block.jsonText);

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
              setPendingDispatch({ vehicleId: suggestedVehicle.alias, routeId: route.id });
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

    const block = extractFirstJsonBlock(response);
    let content = response;
    if (block) {
      content = (response.slice(0, block.start) + response.slice(block.end + 1));
    }
    content = stripCodeFences(content).trim();
    // Avoid stray brace-only outputs
    if (!content || content.replace(/[{}\s]/g, '') === '') {
      content = 'Action executed.';
    }
    return { content };
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
      // Confirm same-route detour flow
      if (pendingReroute && (lowerMessage === 'yes' || lowerMessage === 'confirm' || lowerMessage === 'reroute' || lowerMessage === 'detour' || lowerMessage === 'si' || lowerMessage === 'ok')) {
        const routeId = pendingReroute.routeId.toLowerCase();
        if (pendingReroute.avoid) {
          // compute minStartIndex based on current vehicles to ensure detour ahead
          const route = savedRoutes.find(r => r.id === routeId);
          const geom = route?.routeGeometry || [];
          let maxProgressIdx = 0;
          vehicles.filter(v => v.currentRouteId === routeId && v.currentPosition).forEach(v => {
            const pos = v.currentPosition!;
            let vi = 0; let vd2 = Number.POSITIVE_INFINITY;
            for (let i = 0; i < geom.length; i++) {
              const dx = geom[i].lng - pos.lng; const dy = geom[i].lat - pos.lat;
              const d2 = dx * dx + dy * dy; if (d2 < vd2) { vd2 = d2; vi = i; }
            }
            if (vi > maxProgressIdx) maxProgressIdx = vi;
          });
          // ensure pending geometry uses correct forward insertion
          proposeDetour(routeId, pendingReroute.avoid, { minStartIndex: maxProgressIdx });
          confirmDetour(routeId);
          if (!visibleRouteIds.has(routeId)) {
            toggleRouteVisibility(routeId);
          }
          setFocusedRoute(routeId);
          addChatMessage({ type: 'assistant', content: `✓ Route ${routeId.toUpperCase()} updated to avoid the affected area. Vehicles will follow the new detour.` });
        }
        setPendingReroute(null);
        setIsProcessing(false);
        return;
      }
      // Quick answer for traffic queries without calling the model
      if (answerTrafficQueryLocally(userMessage)) {
        setIsProcessing(false);
        return;
      }
      // Pre-validate intent: if user mentions a warehouse AND a specific route, ensure route destination matches the warehouse
      const routeIdMatch = userMessage.match(/\brt[-_ ]?\d{3}\b/i);
      const mentionedWarehouse = warehouses.find(w => lowerMessage.includes(w.name.toLowerCase()));

      if (routeIdMatch && mentionedWarehouse) {
        const normalizedRouteId = routeIdMatch[0].toLowerCase().replace(/[-_ ]/, '-');
        const pickedRoute = savedRoutes.find(r => r.id === normalizedRouteId);
        if (pickedRoute && pickedRoute.destinationWarehouseId !== mentionedWarehouse.id) {
          const origin = warehouses.find(w => w.id === pickedRoute.originWarehouseId)?.name || pickedRoute.originWarehouseId;
          const dest = warehouses.find(w => w.id === pickedRoute.destinationWarehouseId)?.name || pickedRoute.destinationWarehouseId;
          const candidateRoute = savedRoutes.find(r => r.destinationWarehouseId === mentionedWarehouse.id) || null;

          if (candidateRoute) {
            const suggestedVehicle = suggestBestVehicle(candidateRoute, vehicles);
            if (suggestedVehicle) {
              setPendingDispatch({ vehicleId: suggestedVehicle.alias, routeId: candidateRoute.id });
            }

            addChatMessage({
              type: 'assistant',
              content: `Note: ${pickedRoute.id.toUpperCase()} goes from ${origin} to ${dest}. To send a vehicle to ${mentionedWarehouse.name}, use ${candidateRoute.id.toUpperCase()} (${candidateRoute.name}).${suggestedVehicle ? `\n\nI recommend dispatching ${suggestedVehicle!.alias} (${suggestedVehicle!.licensePlate}). Would you like me to dispatch it?` : ''}`
            });

            setIsProcessing(false);
            return;
          } else {
            addChatMessage({
              type: 'assistant',
              content: `Note: ${pickedRoute.id.toUpperCase()} goes from ${origin} to ${dest}. I couldn't find a saved route ending at ${mentionedWarehouse.name}.`
            });
            setIsProcessing(false);
            return;
          }
        }
      }
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

        handleAction(response);

        const parsed = parseStructuredResponse(userMessage, response);

        if (
          lowerMessage.includes('best vehicle') ||
          lowerMessage.includes('which vehicle') ||
          lowerMessage.includes('what vehicle') ||
          lowerMessage.includes('send a vehicle') ||
          lowerMessage.includes('dispatch') ||
          lowerMessage.includes('want to')
        ) {
          try {
            const block = extractFirstJsonBlock(response);
            if (block) {
              const suggestion = JSON.parse(block.jsonText);
              if (suggestion.action === 'suggest_vehicle' && suggestion.params?.vehicleId && suggestion.params?.routeId) {
                const vehicleId = suggestion.params.vehicleId;
                const routeId = suggestion.params.routeId;
                setPendingDispatch({ vehicleId, routeId });
              }
            }
          } catch {
            console.log('No dispatch suggestion found');
          }
        }

        // Avoid duplicating a separate recommendation if Gemini already produced a formatted recommendation
        if (parsed.content) {
          addChatMessage({
            type: 'assistant',
            content: parsed.content,
            structuredData: parsed.structuredData
          });
        }
      }
    } catch {
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
    'List all vehicles',
    'Show traffic alerts'
  ];

  return (
    <div className="flex flex-col h-full bg-white text-gray-900" onClick={handleChatClick}>
      <div className="px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-arkus-black rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Fleet AI Assistant</h2>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3"
        style={{ WebkitOverflowScrolling: 'touch' as CSSProperties['WebkitOverflowScrolling'] }}
      >
        {chatMessages.map(message => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-arkus-black rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} ${message.structuredData ? 'w-full' : 'max-w-[75%]'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 shadow-lg ${
                  message.type === 'user'
                    ? 'bg-arkus-black text-white rounded-br-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-sm'
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
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-4 h-4 text-gray-700" />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 bg-arkus-black rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-arkus-black rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-arkus-black rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-arkus-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs whitespace-nowrap transition-colors border border-gray-200"
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
            className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-full focus:ring-2 focus:ring-arkus-scarlet focus:border-arkus-scarlet text-sm placeholder-gray-500 transition-all text-gray-900"
          />
          <button
            onClick={() => {
              handleSend();
              setTimeout(() => {
                inputRef.current?.focus();
              }, 0);
            }}
            disabled={!input.trim() || isProcessing}
            className="w-10 h-10 bg-arkus-black text-white rounded-full hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
