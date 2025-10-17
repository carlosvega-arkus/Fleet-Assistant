import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Vehicle, SavedRoute, Warehouse, ChatMessage, Coordinates, RouteTrafficState, TrafficStatus } from '../types';
import { initialVehicles, savedRoutes as mockSavedRoutes, warehouses as mockWarehouses } from '../data/mockData';
import { fetchAllRoutes } from '../utils/mapbox';

interface FleetContextType {
  vehicles: Vehicle[];
  savedRoutes: SavedRoute[];
  warehouses: Warehouse[];
  visibleRouteIds: Set<string>;
  focusedRouteId: string | null;
  focusedWarehouseId: string | null;
  focusedVehicleId: string | null;
  chatMessages: ChatMessage[];
  routeTraffic: Record<string, RouteTrafficState>;
  trafficFocusRequest: string | null;
  pendingDetours: Record<string, Coordinates[]>;
  simulatedTrafficRouteId: string | null;
  trafficHeadsUpShown: Record<string, boolean>;
  trafficPopupCloseRequest: string | null;
  toggleRouteVisibility: (routeId: string) => void;
  setFocusedRoute: (routeId: string | null) => void;
  setFocusedWarehouse: (warehouseId: string | null) => void;
  setFocusedVehicle: (vehicleId: string | null) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  dispatchVehicle: (vehicleId: string, routeId: string) => void;
  updateVehiclePosition: (vehicleId: string, position: Coordinates, progress: number, stopsRemaining: number, eta: number) => void;
  navigateToChat?: () => void;
  rerouteRouteAvoiding: (routeId: string, avoid: Coordinates, options?: { minStartIndex?: number }) => void;
  focusTrafficAlert: (routeId: string) => void;
  clearTrafficFocus: () => void;
  proposeDetour: (routeId: string, avoid: Coordinates, options?: { minStartIndex?: number }) => void;
  confirmDetour: (routeId: string) => void;
  cancelDetour: (routeId: string) => void;
  markTrafficHeadsUpShown: (routeId: string) => void;
  requestTrafficPopupClose: (routeId: string) => void;
  clearTrafficPopupClose: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children, navigateToChat, introOpen }: { children: ReactNode; navigateToChat?: () => void; introOpen?: boolean }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(mockSavedRoutes);
  const [warehouses] = useState<Warehouse[]>(mockWarehouses);
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(new Set());
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [focusedWarehouseId, setFocusedWarehouseId] = useState<string | null>(null);
  const [focusedVehicleId, setFocusedVehicleId] = useState<string | null>(null);
  const [routeTraffic, setRouteTraffic] = useState<Record<string, RouteTrafficState>>({});
  const [trafficFocusRequest, setTrafficFocusRequest] = useState<string | null>(null);
  const [pendingDetours, setPendingDetours] = useState<Record<string, Coordinates[]>>({});
  const [simulatedTrafficRouteId, setSimulatedTrafficRouteId] = useState<string | null>(null);
  const [trafficHeadsUpShown, setTrafficHeadsUpShown] = useState<Record<string, boolean>>({});
  const [trafficPopupCloseRequest, setTrafficPopupCloseRequest] = useState<string | null>(null);
  // Seed chat with a demo interaction about U-67
  const demoVehicle = initialVehicles.find(v => v.alias === 'U-67');
  const demoRoute = demoVehicle?.currentRouteId ? mockSavedRoutes.find(r => r.id === demoVehicle.currentRouteId) : undefined;
  const demoOrigin = demoRoute ? mockWarehouses.find(w => w.id === demoRoute.originWarehouseId) : undefined;
  const demoDest = demoRoute ? mockWarehouses.find(w => w.id === demoRoute.destinationWarehouseId) : undefined;
  const assistantLine = demoVehicle ?
    `**U-67** (License: ${demoVehicle.licensePlate})\n• **Status:** ${demoVehicle.status}\n• **Current Route:** ${demoRoute?.name || '—'}${demoOrigin && demoDest ? `\n• **From/To:** ${demoOrigin.name} → ${demoDest.name}` : ''}${demoVehicle.eta ? `\n• **ETA:** ${demoVehicle.eta} min` : ''}${demoVehicle.stopsRemaining !== undefined ? `\n• **Stops Remaining:** ${demoVehicle.stopsRemaining}` : ''}`
    : 'I could not find vehicle U-67.';

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      type: 'assistant',
      content: 'Welcome to Fleet Control. Ask me about vehicles, routes, or warehouses. I can also help you dispatch vehicles and control the map.',
      timestamp: new Date()
    },
    {
      id: 'demo-user',
      type: 'user',
      content: 'Show me where the U-67 vehicle is',
      timestamp: new Date()
    },
    {
      id: 'demo-assistant',
      type: 'assistant',
      content: assistantLine,
      timestamp: new Date()
    }
  ]);

  useEffect(() => {
    fetchAllRoutes(mockSavedRoutes, mockWarehouses).then(routes => {
      setSavedRoutes(routes);
    });
  }, []);

  // Initialize synthetic traffic state (no-op until routes ready)
  useEffect(() => {
    if (!savedRoutes.length) return;
    setRouteTraffic(prev => {
      const next: Record<string, RouteTrafficState> = { ...prev };
      savedRoutes.forEach(r => {
        if (!next[r.id]) {
          const seed = r.id.charCodeAt(0) + r.id.length;
          const rand = (seed % 10) / 10; // deterministic-ish
          let status: TrafficStatus = 'normal';
          let delay = 0;
          if (rand > 0.75) { status = 'heavy'; delay = 10 + Math.floor(((seed % 5) + 1) * 2); }
          if (rand > 0.9)  { status = 'closed'; delay = 30; }
          // choose a stable coordinate for the traffic event
          let pos = undefined as Coordinates | undefined;
          if (r.routeGeometry && r.routeGeometry.length > 0) {
            const idx = Math.floor((r.routeGeometry.length - 1) * (0.3 + (seed % 3) * 0.2));
            pos = r.routeGeometry[Math.max(0, Math.min(r.routeGeometry.length - 1, idx))];
          } else if (r.stops && r.stops.length > 0) {
            pos = r.stops[Math.floor(r.stops.length / 2)].coordinates;
          } else {
            const origin = warehouses.find(w => w.id === r.originWarehouseId)?.coordinates;
            const dest = warehouses.find(w => w.id === r.destinationWarehouseId)?.coordinates;
            if (origin && dest) {
              pos = { lat: (origin.lat + dest.lat) / 2, lng: (origin.lng + dest.lng) / 2 };
            } else if (origin) {
              pos = origin;
            }
          }
          if (pos) {
            next[r.id] = { routeId: r.id, status, delayMinutes: delay, updatedAt: new Date(), coordinates: pos };
          }
        }
      });
      return next;
    });
  }, [savedRoutes]);

  // Periodically fluctuate traffic states (disabled for simulation until modal closed)
  useEffect(() => {
    if (introOpen) return;
    const interval = setInterval(() => {
      setRouteTraffic(prev => {
        const next: Record<string, RouteTrafficState> = {};
        Object.values(prev).forEach(state => {
          if (simulatedTrafficRouteId && state.routeId === simulatedTrafficRouteId) {
            // Keep simulated alert fixed (e.g., CLOSED)
            next[state.routeId] = { ...state };
          } else {
            const roll = Math.random();
            let status: TrafficStatus = state.status;
            if (roll < 0.05) status = 'closed';
            else if (roll < 0.25) status = 'heavy';
            else if (roll < 0.8) status = 'normal';
            const delay = status === 'closed' ? 45 : status === 'heavy' ? 10 + Math.floor(Math.random() * 20) : 0;
            next[state.routeId] = { routeId: state.routeId, status, delayMinutes: delay, updatedAt: new Date(), coordinates: state.coordinates };
          }
        });
        return next;
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [simulatedTrafficRouteId, introOpen]);

  // Startup simulation: after 7s, mark RT-001 as CLOSED ahead of vehicles (only after walkthrough closed)
  useEffect(() => {
    if (introOpen) return;
    const timeout = setTimeout(() => {
      const targetRoute = savedRoutes.find(r => r.id === 'rt-001');
      if (!targetRoute || !targetRoute.routeGeometry?.length) return;
      // pick a point ~60% along geometry as closure point
      const idx = Math.floor(targetRoute.routeGeometry.length * 0.6);
      const coord = targetRoute.routeGeometry[Math.min(targetRoute.routeGeometry.length - 1, Math.max(0, idx))];
      setRouteTraffic(prev => ({
        ...prev,
        [targetRoute.id]: {
          routeId: targetRoute.id,
          status: 'closed',
          delayMinutes: 30,
          reason: 'Road closure ahead',
          coordinates: coord,
          updatedAt: new Date()
        }
      }));
      setSimulatedTrafficRouteId(targetRoute.id);
      // Emit a single heads-up in chat (simulated) once
      if (!trafficHeadsUpShown[targetRoute.id]) {
        const label = `${targetRoute.id.toUpperCase()} (${targetRoute.name})`;
        const headline = `Traffic alert on ${label}: CLOSED (+30 min)`;
        setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-${Math.random()}`, type: 'assistant', content: `${headline}\n[See more|${targetRoute.id}]`, timestamp: new Date() }]);
        setTrafficHeadsUpShown(prev => ({ ...prev, [targetRoute.id]: true }));
      }
    }, 7000);
    return () => clearTimeout(timeout);
  }, [savedRoutes, introOpen, trafficHeadsUpShown]);

  // No chat notifications; map will render traffic markers using routeTraffic

  const toggleRouteVisibility = (routeId: string) => {
    setVisibleRouteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
        if (focusedRouteId === routeId) {
          setFocusedRouteId(null);
        }
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const dispatchVehicle = (vehicleId: string, routeId: string) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle.id === vehicleId
        ? {
            ...vehicle,
            status: 'in_route',
            currentRouteId: routeId,
            routeProgress: 0,
            stopsRemaining: savedRoutes.find(r => r.id === routeId)?.stops.length || 0,
            eta: 30,
            completedStops: new Set<string>()
          }
        : vehicle
    ));
  };

  const updateVehiclePosition = (
    vehicleId: string,
    position: Coordinates,
    progress: number,
    stopsRemaining: number,
    eta: number,
    completedStops?: Set<string>
  ) => {
    setVehicles(prev => prev.map(vehicle =>
      vehicle.id === vehicleId
        ? {
            ...vehicle,
            currentPosition: position,
            routeProgress: progress,
            stopsRemaining,
            eta,
            ...(completedStops && { completedStops })
          }
        : vehicle
    ));
  };

  const computeDetourGeometry = (geom: Coordinates[], avoid: Coordinates, minStartIndex?: number): Coordinates[] => {
    if (!geom || geom.length < 3) return geom;
    // find nearest index to avoid coordinate
    let nearestIdx = 0;
    let bestD2 = Number.POSITIVE_INFINITY;
    for (let i = 0; i < geom.length; i++) {
      const dx = geom[i].lng - avoid.lng;
      const dy = geom[i].lat - avoid.lat;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; nearestIdx = i; }
    }
    const minStart = Math.max(0, minStartIndex ?? 0);
    const insertIdx = Math.max(nearestIdx, minStart);
    const beforeIdx = Math.max(0, insertIdx - 1);
    const afterIdx = Math.min(geom.length - 1, insertIdx + 1);
    const a = geom[beforeIdx];
    const b = geom[Math.min(geom.length - 1, insertIdx)];
    const c = geom[afterIdx];
    // perpendicular offset based on segment a->c
    const vx = c.lng - a.lng;
    const vy = c.lat - a.lat;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    let ox = -vy / len;
    let oy = vx / len;
    // scale offset ~ 0.001 degrees (~100m), adjust lon by latitude
    const latFactor = Math.cos(((a.lat + c.lat) / 2) * Math.PI / 180);
    const offsetScale = 0.001;
    ox *= offsetScale / Math.max(0.3, Math.abs(latFactor));
    oy *= offsetScale;
    const p1 = { lat: a.lat + oy, lng: a.lng + ox };
    const p2 = { lat: b.lat + 2 * oy, lng: b.lng + 2 * ox };
    const p3 = { lat: c.lat + oy, lng: c.lng + ox };
    const newGeometry = [
      ...geom.slice(0, beforeIdx + 1),
      p1,
      p2,
      p3,
      ...geom.slice(afterIdx)
    ];
    return newGeometry;
  };

  const proposeDetour = (routeId: string, avoid: Coordinates, options?: { minStartIndex?: number }) => {
    const route = savedRoutes.find(r => r.id === routeId);
    if (!route) return;
    const newGeometry = computeDetourGeometry(route.routeGeometry, avoid, options?.minStartIndex);
    setPendingDetours(prev => ({ ...prev, [routeId]: newGeometry }));
  };

  const confirmDetour = (routeId: string) => {
    const pending = pendingDetours[routeId];
    if (!pending) return;
    setSavedRoutes(prev => prev.map(route => route.id === routeId ? { ...route, routeGeometry: pending } : route));
    setPendingDetours(prev => {
      const next = { ...prev };
      delete next[routeId];
      return next;
    });
    // snap vehicles on this route to nearest point on new geometry and recalc progress
    setVehicles(prev => prev.map(v => {
      if (v.currentRouteId !== routeId) return v;
      const geom = pending;
      const pos = v.currentPosition || geom[0];
      let nearestIdx = 0;
      let bestD2 = Number.POSITIVE_INFINITY;
      for (let i = 0; i < geom.length; i++) {
        const dx = geom[i].lng - pos.lng;
        const dy = geom[i].lat - pos.lat;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) { bestD2 = d2; nearestIdx = i; }
      }
      const progress = geom.length > 1 ? nearestIdx / (geom.length - 1) : 0;
      return { ...v, currentPosition: geom[nearestIdx], routeProgress: progress };
    }));
    // request map to close any open traffic popup for this route
    setTrafficPopupCloseRequest(routeId);
  };

  const cancelDetour = (routeId: string) => {
    setPendingDetours(prev => {
      const next = { ...prev };
      delete next[routeId];
      return next;
    });
  };

  const rerouteRouteAvoiding = (routeId: string, avoid: Coordinates, options?: { minStartIndex?: number }) => {
    // legacy apply detour immediately
    const route = savedRoutes.find(r => r.id === routeId);
    if (!route) return;
    const newGeometry = computeDetourGeometry(route.routeGeometry, avoid, options?.minStartIndex);
    setSavedRoutes(prev => prev.map(r => r.id === routeId ? { ...r, routeGeometry: newGeometry } : r));
  };

  const markTrafficHeadsUpShown = (routeId: string) => {
    setTrafficHeadsUpShown(prev => ({ ...prev, [routeId]: true }));
  };

  const requestTrafficPopupClose = (routeId: string) => setTrafficPopupCloseRequest(routeId);
  const clearTrafficPopupClose = () => setTrafficPopupCloseRequest(null);

  useEffect(() => {
    if (introOpen) return;
    const inRouteVehicles = vehicles.filter(v => v.status === 'in_route' && v.currentRouteId);

    const interval = setInterval(() => {
      inRouteVehicles.forEach(vehicle => {
        if (!vehicle.currentRouteId) return;

        const route = savedRoutes.find(r => r.id === vehicle.currentRouteId);
        if (!route) return;

        const currentProgress = vehicle.routeProgress || 0;
        const newProgress = Math.min(currentProgress + 0.001, 1);

        const geometryIndex = Math.floor(newProgress * (route.routeGeometry.length - 1));
        const nextIndex = Math.min(geometryIndex + 1, route.routeGeometry.length - 1);
        const segmentProgress = (newProgress * (route.routeGeometry.length - 1)) - geometryIndex;

        const currentPoint = route.routeGeometry[geometryIndex];
        const nextPoint = route.routeGeometry[nextIndex];

        const interpolatedPosition: Coordinates = {
          lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * segmentProgress,
          lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * segmentProgress
        };

        const totalStops = route.stops.length;
        const completedStopsSet = new Set(vehicle.completedStops || []);

        // Proximity-based completion: mark a stop completed when within ~200m
        const toRadians = (deg: number) => (deg * Math.PI) / 180;
        const distanceKm = (a: Coordinates, b: Coordinates) => {
          const R = 6371; // km
          const dLat = toRadians(b.lat - a.lat);
          const dLng = toRadians(b.lng - a.lng);
          const lat1 = toRadians(a.lat);
          const lat2 = toRadians(b.lat);
          const sinDLat = Math.sin(dLat / 2);
          const sinDLng = Math.sin(dLng / 2);
          const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
          return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        };

        const nextUncompletedIndex = route.stops.findIndex(s => !completedStopsSet.has(s.id));
        if (nextUncompletedIndex >= 0) {
          const nextStop = route.stops[nextUncompletedIndex];
          const distToNextKm = distanceKm(interpolatedPosition, nextStop.coordinates);
          if (distToNextKm <= 0.2) { // ~200 meters threshold
            completedStopsSet.add(nextStop.id);
          }
        }

        const stopsRemaining = totalStops - completedStopsSet.size;

        const estimatedTotalMinutes = 30;
        const baseEta = Math.max(1, Math.round(estimatedTotalMinutes * (1 - newProgress)));
        const t = vehicle.currentRouteId ? routeTraffic[vehicle.currentRouteId] : undefined;
        const multiplier = t?.status === 'closed' ? 3 : t?.status === 'heavy' ? 1.5 : 1;
        const eta = Math.round(baseEta * multiplier + (t?.delayMinutes || 0));

        if (newProgress >= 1) {
          const completedRouteId = vehicle.currentRouteId;
          setVehicles(prev => prev.map(v =>
            v.id === vehicle.id
              ? { ...v, status: 'idle', currentRouteId: undefined, routeProgress: 0, stopsRemaining: 0, eta: undefined, currentPosition: undefined, completedStops: undefined }
              : v
          ));
          if (focusedRouteId === completedRouteId) {
            setFocusedRouteId(null);
          }
          if (completedRouteId) {
            setVisibleRouteIds(prev => {
              const next = new Set(prev);
              next.delete(completedRouteId);
              return next;
            });
          }
        } else {
          updateVehiclePosition(vehicle.id, interpolatedPosition, newProgress, stopsRemaining, eta, completedStopsSet);
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [vehicles, savedRoutes, routeTraffic, introOpen]);

  const handleSetFocusedVehicle = (vehicleId: string | null) => {
    setFocusedVehicleId(vehicleId);
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle?.currentRouteId) {
        if (!visibleRouteIds.has(vehicle.currentRouteId)) {
          setVisibleRouteIds(prev => new Set(prev).add(vehicle.currentRouteId!));
        }
        setFocusedRouteId(vehicle.currentRouteId);
      }
    }
  };

  const focusTrafficAlert = (routeId: string) => setTrafficFocusRequest(routeId);
  const clearTrafficFocus = () => setTrafficFocusRequest(null);

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        savedRoutes,
        warehouses,
        visibleRouteIds,
        focusedRouteId,
        focusedWarehouseId,
        focusedVehicleId,
        chatMessages,
        routeTraffic,
        trafficFocusRequest,
        pendingDetours,
        simulatedTrafficRouteId,
        trafficHeadsUpShown,
        trafficPopupCloseRequest,
        toggleRouteVisibility,
        setFocusedRoute: setFocusedRouteId,
        setFocusedWarehouse: setFocusedWarehouseId,
        setFocusedVehicle: handleSetFocusedVehicle,
        addChatMessage,
        dispatchVehicle,
        updateVehiclePosition,
        navigateToChat,
        rerouteRouteAvoiding,
        focusTrafficAlert,
        clearTrafficFocus,
        proposeDetour,
        confirmDetour,
        cancelDetour,
        markTrafficHeadsUpShown,
        requestTrafficPopupClose,
        clearTrafficPopupClose
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
