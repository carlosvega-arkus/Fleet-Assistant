import { SavedRoute, Warehouse, Vehicle, Coordinates } from '../types';

export interface RouteOptimizationRequest {
  startWarehouseId: string;
  endWarehouseId?: string;
  stops: Array<{ businessName: string; address: string; coordinates: Coordinates }>;
  optimizationType?: 'shortest' | 'fastest' | 'balanced';
}

export interface RouteOptimizationResult {
  estimatedDistance: number;
  estimatedTime: number;
  optimizedStopOrder: number[];
  explanation: string;
}

function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function nearestNeighbor(
  start: Coordinates,
  unvisited: Array<{ index: number; coord: Coordinates }>,
  end?: Coordinates
): number[] {
  const order: number[] = [];
  let current = start;
  const remaining = [...unvisited];

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDistance = calculateDistance(current, remaining[0].coord);

    for (let i = 1; i < remaining.length; i++) {
      const dist = calculateDistance(current, remaining[i].coord);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    order.push(remaining[nearestIdx].index);
    current = remaining[nearestIdx].coord;
    remaining.splice(nearestIdx, 1);
  }

  return order;
}

export function optimizeRoute(
  request: RouteOptimizationRequest,
  warehouses: Warehouse[]
): RouteOptimizationResult {
  const startWarehouse = warehouses.find(w => w.id === request.startWarehouseId);
  const endWarehouse = request.endWarehouseId
    ? warehouses.find(w => w.id === request.endWarehouseId)
    : startWarehouse;

  if (!startWarehouse || !endWarehouse) {
    throw new Error('Invalid warehouse IDs');
  }

  const unvisited = request.stops.map((stop, index) => ({
    index,
    coord: stop.coordinates
  }));

  const optimizedOrder = nearestNeighbor(
    startWarehouse.coordinates,
    unvisited,
    endWarehouse.coordinates
  );

  let totalDistance = calculateDistance(
    startWarehouse.coordinates,
    request.stops[optimizedOrder[0]].coordinates
  );

  for (let i = 0; i < optimizedOrder.length - 1; i++) {
    totalDistance += calculateDistance(
      request.stops[optimizedOrder[i]].coordinates,
      request.stops[optimizedOrder[i + 1]].coordinates
    );
  }

  totalDistance += calculateDistance(
    request.stops[optimizedOrder[optimizedOrder.length - 1]].coordinates,
    endWarehouse.coordinates
  );

  const estimatedTime = Math.round((totalDistance / 40) * 60);

  return {
    estimatedDistance: Math.round(totalDistance * 10) / 10,
    estimatedTime,
    optimizedStopOrder: optimizedOrder,
    explanation: `Optimized route using nearest-neighbor algorithm. Total distance: ${Math.round(totalDistance * 10) / 10}km, Estimated time: ${estimatedTime} minutes.`
  };
}

export function suggestBestVehicle(
  route: SavedRoute,
  vehicles: Vehicle[]
): Vehicle | null {
  const availableVehicles = vehicles.filter(
    v => v.status === 'available' || v.status === 'idle'
  );

  if (availableVehicles.length === 0) {
    return null;
  }

  return availableVehicles[0];
}

export function analyzeRouteEfficiency(routes: SavedRoute[], vehicles: Vehicle[]): string {
  const activeRoutes = routes.filter(r =>
    vehicles.some(v => v.currentRouteId === r.id && v.status === 'in_route')
  );

  const availableVehicles = vehicles.filter(
    v => v.status === 'available' || v.status === 'idle'
  );

  const inactiveRoutes = routes.filter(r =>
    !vehicles.some(v => v.currentRouteId === r.id)
  );

  let analysis = `Fleet Efficiency Analysis:\n\n`;
  analysis += `Active Routes: ${activeRoutes.length}/${routes.length}\n`;
  analysis += `Available Vehicles: ${availableVehicles.length}/${vehicles.length}\n`;
  analysis += `Inactive Routes: ${inactiveRoutes.length}\n\n`;

  if (inactiveRoutes.length > 0 && availableVehicles.length > 0) {
    analysis += `Recommendation: You have ${availableVehicles.length} available vehicles and ${inactiveRoutes.length} inactive routes. `;
    analysis += `Consider dispatching vehicles to optimize fleet utilization.\n`;
    analysis += `\nSuggested assignments:\n`;

    const suggestions = Math.min(inactiveRoutes.length, availableVehicles.length, 3);
    for (let i = 0; i < suggestions; i++) {
      analysis += `- ${availableVehicles[i].alias} → ${inactiveRoutes[i].name}\n`;
    }
  } else if (availableVehicles.length === 0) {
    analysis += `All vehicles are currently deployed or under maintenance. Fleet is at full capacity.`;
  } else {
    analysis += `Fleet is operating efficiently with good vehicle-to-route distribution.`;
  }

  return analysis;
}
