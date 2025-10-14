import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer, Popup, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { useFleet } from '../context/FleetContext';
import { Warehouse, Truck, X, Box, Eye } from 'lucide-react';
import { WarehouseInfoPopup } from './WarehouseInfoPopup';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function FleetMap() {
  const { warehouses, vehicles, savedRoutes, visibleRouteIds, focusedRouteId, focusedWarehouseId, focusedVehicleId, setFocusedVehicle, setFocusedWarehouse } = useFleet();
  const mapRef = useRef<any>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [show3D, setShow3D] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  const inRouteVehicles = vehicles.filter(v => v.status === 'in_route' && v.currentPosition);

  const activeRoutes = vehicles
    .filter(v => v.status === 'in_route' && v.currentRouteId)
    .map(v => savedRoutes.find(r => r.id === v.currentRouteId))
    .filter(Boolean);

  const visibleSavedRoutes = savedRoutes.filter(r => visibleRouteIds.has(r.id));
  const allVisibleRoutes = [...activeRoutes, ...visibleSavedRoutes];

  useEffect(() => {
    if (focusedRouteId && mapRef.current) {
      const focusedRoute = savedRoutes.find(r => r.id === focusedRouteId);
      if (focusedRoute && focusedRoute.routeGeometry.length > 0) {
        const coordinates = focusedRoute.routeGeometry.map(coord => [coord.lng, coord.lat]);
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord as [number, number]),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );
        mapRef.current.fitBounds(bounds, {
          padding: 80,
          duration: 1000
        });
      }
    }
  }, [focusedRouteId, savedRoutes]);

  useEffect(() => {
    if (focusedWarehouseId && mapRef.current) {
      const focusedWarehouse = warehouses.find(w => w.id === focusedWarehouseId);
      if (focusedWarehouse) {
        mapRef.current.flyTo({
          center: [focusedWarehouse.coordinates.lng, focusedWarehouse.coordinates.lat],
          zoom: 14,
          duration: 1000
        });
      }
    }
  }, [focusedWarehouseId, warehouses]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (show3D) {
        map.setPitch(60);
        map.setBearing(30);
      } else {
        map.setPitch(0);
        map.setBearing(0);
      }
    }
  }, [show3D]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (showTraffic) {
        if (!map.getLayer('traffic')) {
          map.addLayer({
            id: 'traffic',
            type: 'line',
            source: {
              type: 'vector',
              url: 'mapbox://mapbox.mapbox-traffic-v1'
            },
            'source-layer': 'traffic',
            paint: {
              'line-width': 2,
              'line-color': [
                'case',
                ['==', ['get', 'congestion'], 'low'], '#00FF00',
                ['==', ['get', 'congestion'], 'moderate'], '#FFFF00',
                ['==', ['get', 'congestion'], 'heavy'], '#FF9900',
                ['==', ['get', 'congestion'], 'severe'], '#FF0000',
                '#808080'
              ]
            }
          });
        }
      } else {
        if (map.getLayer('traffic')) {
          map.removeLayer('traffic');
        }
      }
    }
  }, [showTraffic]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShow3D(!show3D)}
          className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all ${
            show3D
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800'
          }`}
          title={show3D ? 'Disable 3D View' : 'Enable 3D View'}
        >
          <Box className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`p-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all ${
            showTraffic
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800'
          }`}
          title={showTraffic ? 'Hide Traffic' : 'Show Traffic'}
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -117.1611,
          latitude: 32.7157,
          zoom: 11
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-left" showCompass={true} visualizePitch={true} />
        {warehouses.map(warehouse => {
          const isFocused = focusedWarehouseId === warehouse.id;
          return (
            <Marker
              key={warehouse.id}
              longitude={warehouse.coordinates.lng}
              latitude={warehouse.coordinates.lat}
              anchor="center"
            >
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  setPopupInfo({ type: 'warehouse', data: warehouse });
                  setFocusedWarehouse(warehouse.id);
                }}
              >
                {isFocused && (
                  <div className="absolute inset-0 w-14 h-14 bg-blue-500 rounded-full opacity-20 animate-pulse -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                )}
                <div className={`relative w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl border-2 ${isFocused ? 'border-blue-400 scale-125' : 'border-white'} transition-all`}>
                  <Warehouse className="w-5 h-5" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-700">
                  {warehouse.name}
                </div>
              </div>
            </Marker>
          );
        })}

        {allVisibleRoutes.map(route => {
          if (!route || !route.routeGeometry || route.routeGeometry.length === 0) return null;
          const isFocused = focusedRouteId === route.id;

          const geojson: any = {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: route.routeGeometry.map(coord => [coord.lng, coord.lat])
            }
          };

          return (
            <div key={route.id}>
              <Source id={`route-${route.id}`} type="geojson" data={geojson}>
                <Layer
                  id={`route-line-${route.id}`}
                  type="line"
                  paint={{
                    'line-color': route.color,
                    'line-width': isFocused ? 6 : 3,
                    'line-opacity': focusedRouteId && !isFocused ? 0.3 : 0.9
                  }}
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round'
                  }}
                />
              </Source>

              {isFocused && route.stops.map(stop => {
                const vehicleOnRoute = vehicles.find(v => v.currentRouteId === route.id && v.status === 'in_route');
                const isCompleted = vehicleOnRoute?.completedStops?.has(stop.id) || false;

                return (
                  <Marker
                    key={stop.id}
                    longitude={stop.coordinates.lng}
                    latitude={stop.coordinates.lat}
                    anchor="center"
                  >
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setPopupInfo({ type: 'stop', data: stop })}
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${isCompleted ? 'from-green-500 to-green-600' : 'from-orange-400 to-orange-600'} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl border-2 border-white hover:scale-110 transition-all duration-300`}>
                        {stop.stopNumber}
                      </div>
                    </div>
                  </Marker>
                );
              })}
            </div>
          );
        })}

        {inRouteVehicles.map(vehicle => {
          const statusColors: Record<string, string> = {
            in_route: 'from-green-500 to-green-600',
            idle: 'from-gray-400 to-gray-500',
            available: 'from-blue-500 to-blue-600',
            maintenance: 'from-orange-500 to-orange-600'
          };

          return (
            <Marker
              key={vehicle.id}
              longitude={vehicle.currentPosition!.lng}
              latitude={vehicle.currentPosition!.lat}
              anchor="center"
            >
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  setPopupInfo({ type: 'vehicle', data: vehicle });
                  setFocusedVehicle(vehicle.id);
                }}
                style={{ transition: 'all 0.5s ease-out' }}
              >
                <div className={`w-9 h-9 bg-gradient-to-br ${statusColors[vehicle.status]} rounded-full flex items-center justify-center text-white shadow-2xl border-2 ${focusedVehicleId === vehicle.id ? 'border-yellow-400 border-4' : 'border-white'} hover:scale-110 transition-transform`}>
                  <Truck className="w-5 h-5" />
                </div>
              </div>
            </Marker>
          );
        })}

        {popupInfo && popupInfo.type === 'warehouse' && (
          <Popup
            longitude={popupInfo.data.coordinates.lng}
            latitude={popupInfo.data.coordinates.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={25}
          >
            <WarehouseInfoPopup
              warehouse={popupInfo.data}
              vehicles={vehicles}
              routes={savedRoutes}
              onClose={() => setPopupInfo(null)}
            />
          </Popup>
        )}

        {popupInfo && popupInfo.type === 'stop' && (
          <Popup
            longitude={popupInfo.data.coordinates.lng}
            latitude={popupInfo.data.coordinates.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={15}
          >
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-700 p-3 min-w-[260px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {popupInfo.data.stopNumber}
                  </div>
                  <h3 className="font-bold text-sm text-white truncate" title={popupInfo.data.businessName}>{popupInfo.data.businessName}</h3>
                </div>
                <button
                  onClick={() => setPopupInfo(null)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-2 truncate" title={popupInfo.data.address}>{popupInfo.data.address}</p>
              {(() => {
                const routeWithStop = savedRoutes.find(r =>
                  r.stops.some(s => s.id === popupInfo.data.id)
                );
                if (routeWithStop) {
                  const vehicleOnRoute = vehicles.find(v =>
                    v.currentRouteId === routeWithStop.id && v.status === 'in_route'
                  );
                  if (vehicleOnRoute) {
                    const stopIndex = routeWithStop.stops.findIndex(s => s.id === popupInfo.data.id);
                    const vehicleProgress = vehicleOnRoute.routeProgress || 0;
                    const totalStops = routeWithStop.stops.length;
                    const currentStopIndex = Math.floor(vehicleProgress * totalStops);

                    const isUpcoming = stopIndex >= currentStopIndex;
                    const isCompleted = vehicleOnRoute.completedStops?.has(popupInfo.data.id) || false;

                    if (isUpcoming) {
                      const stopsUntilThis = stopIndex - currentStopIndex;
                      const estimatedMinutesPerStop = (vehicleOnRoute.eta || 0) / (vehicleOnRoute.stopsRemaining || 1);
                      const etaToThisStop = Math.round(estimatedMinutesPerStop * (stopsUntilThis + 1));

                      return (
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-900 text-green-300">
                              <Truck className="w-3 h-3" /> {vehicleOnRoute.alias}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">ETA ~{etaToThisStop} min</span>
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{stopsUntilThis} stops away</span>
                          </div>
                        </div>
                      );
                    }

                    if (isCompleted) {
                      return (
                        <div className="pt-2 border-t border-gray-700">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900 text-green-300">Completed</span>
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}
            </div>
          </Popup>
        )}

        {popupInfo && popupInfo.type === 'vehicle' && (
          <Popup
            longitude={popupInfo.data.currentPosition.lng}
            latitude={popupInfo.data.currentPosition.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={15}
          >
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-gray-700 p-3 min-w-[240px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck className="w-4 h-4 text-green-400" />
                  <h3 className="font-bold text-sm text-white truncate">{popupInfo.data.alias}</h3>
                </div>
                {(() => {
                  const status = popupInfo.data.status as string;
                  const statusClass = status === 'in_route'
                    ? 'bg-blue-900 text-blue-300'
                    : status === 'available'
                    ? 'bg-green-900 text-green-300'
                    : status === 'maintenance'
                    ? 'bg-orange-900 text-orange-300'
                    : 'bg-gray-700 text-gray-300';
                  const label = status === 'in_route' ? 'In Route' : status.charAt(0).toUpperCase() + status.slice(1);
                  return (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>{label}</span>
                  );
                })()}
                <button
                  onClick={() => setPopupInfo(null)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors ml-2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Plate: {popupInfo.data.licensePlate}</p>
                {(() => {
                  const route = savedRoutes.find(r => r.id === popupInfo.data.currentRouteId);
                  if (route) {
                    const originWarehouse = warehouses.find(w => w.id === route.originWarehouseId);
                    const destWarehouse = warehouses.find(w => w.id === route.destinationWarehouseId);
                    return (
                      <p className="text-xs text-blue-400 font-semibold truncate">
                        {route.name} {originWarehouse && destWarehouse ? `· ${originWarehouse.name} → ${destWarehouse.name}` : ''}
                      </p>
                    );
                  }
                  return null;
                })()}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {popupInfo.data.eta && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900 text-green-300">ETA {popupInfo.data.eta} min</span>
                  )}
                  {popupInfo.data.stopsRemaining !== undefined && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{popupInfo.data.stopsRemaining} stops left</span>
                  )}
                  {popupInfo.data.routeProgress !== undefined && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{Math.round((popupInfo.data.routeProgress || 0) * 100)}%</span>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
