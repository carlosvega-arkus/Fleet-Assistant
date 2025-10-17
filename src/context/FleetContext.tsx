import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Vehicle, SavedRoute, Warehouse, ChatMessage, Coordinates } from '../types';
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
  toggleRouteVisibility: (routeId: string) => void;
  setFocusedRoute: (routeId: string | null) => void;
  setFocusedWarehouse: (warehouseId: string | null) => void;
  setFocusedVehicle: (vehicleId: string | null) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  dispatchVehicle: (vehicleId: string, routeId: string) => void;
  updateVehiclePosition: (vehicleId: string, position: Coordinates, progress: number, stopsRemaining: number, eta: number) => void;
  navigateToChat?: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children, navigateToChat }: { children: ReactNode; navigateToChat?: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(mockSavedRoutes);
  const [warehouses] = useState<Warehouse[]>(mockWarehouses);
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(new Set());
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const [focusedWarehouseId, setFocusedWarehouseId] = useState<string | null>(null);
  const [focusedVehicleId, setFocusedVehicleId] = useState<string | null>(null);
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

  useEffect(() => {
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
        const eta = Math.max(1, Math.round(estimatedTotalMinutes * (1 - newProgress)));

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
  }, [vehicles, savedRoutes]);

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
        toggleRouteVisibility,
        setFocusedRoute: setFocusedRouteId,
        setFocusedWarehouse: setFocusedWarehouseId,
        setFocusedVehicle: handleSetFocusedVehicle,
        addChatMessage,
        dispatchVehicle,
        updateVehiclePosition,
        navigateToChat
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
