import { Coordinates } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function fetchMapboxRoute(waypoints: Coordinates[]): Promise<Coordinates[]> {
  if (waypoints.length < 2) return waypoints;

  const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      const coords = data.routes[0].geometry.coordinates;
      return coords.map((coord: number[]) => ({
        lng: coord[0],
        lat: coord[1]
      }));
    }
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
  }

  return waypoints;
}

export async function fetchAllRoutes(routes: any[], warehouses: any[]) {
  const updatedRoutes = await Promise.all(
    routes.map(async (route) => {
      const origin = warehouses.find(w => w.id === route.originWarehouseId);
      const destination = warehouses.find(w => w.id === route.destinationWarehouseId);

      if (!origin || !destination) return route;

      const waypoints = [
        origin.coordinates,
        ...route.stops.map((stop: any) => stop.coordinates),
        destination.coordinates
      ];

      const routeGeometry = await fetchMapboxRoute(waypoints);

      return {
        ...route,
        routeGeometry
      };
    })
  );

  return updatedRoutes;
}
