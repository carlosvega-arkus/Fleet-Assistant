import { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, Popup, NavigationControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import { useFleet } from '../context/FleetContext';
import { Warehouse, Truck, X, Box, Eye, Battery, Zap, Gauge, ThermometerSun, Radio, MapPin } from 'lucide-react';
import { WarehouseInfoPopup } from './WarehouseInfoPopup';
import 'mapbox-gl/dist/mapbox-gl.css';
// 3D overlays removed

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export function FleetMap({ introOpen }: { introOpen?: boolean }) {
  const { warehouses, vehicles, savedRoutes, visibleRouteIds, focusedRouteId, focusedWarehouseId, focusedVehicleId, setFocusedVehicle, setFocusedWarehouse, setFocusedRoute, toggleRouteVisibility } = useFleet();
  const mapRef = useRef<any>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [show3D, setShow3D] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null);
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const initializedRef = useRef(false);
  // 3D references removed

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

  // DEMO: after walkthrough closes, focus RT-001 and open its vehicle popup
  useEffect(() => {
    if (initializedRef.current) return;
    if (introOpen !== false) return; // wait until walkthrough modal is closed
    const targetRouteId = 'rt-001';
    const routeExists = savedRoutes.some(r => r.id === targetRouteId);
    if (!routeExists) return;

    if (!visibleRouteIds.has(targetRouteId)) {
      toggleRouteVisibility(targetRouteId);
    }
    setFocusedRoute(targetRouteId);

    const vehOnRoute = vehicles.find(v => v.status === 'in_route' && v.currentRouteId === targetRouteId && v.currentPosition);
    if (vehOnRoute) {
      setFocusedVehicle(vehOnRoute.id);
      setPopupInfo({ type: 'vehicle', data: vehOnRoute });
    }
    initializedRef.current = true;
  }, [introOpen, vehicles, savedRoutes, visibleRouteIds, toggleRouteVisibility, setFocusedRoute, setFocusedVehicle]);

  // 3D custom layer removed

  // Add 3D buildings layer on style load
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    const ensure3DBuildings = () => {
      if (!map.getStyle()) return;
      try {
        map.setLight({ anchor: 'viewport', intensity: 0.6, color: 'white' } as any);
        (map as any).setFog({ range: [0.6, 8], color: 'white', 'horizon-blend': 0.1 });
      } catch (_) {}

      // Add terrain for better 3D depth
      try {
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          } as any);
        }
        // setTerrain will overwrite if same source provided; guard by checking map.getTerrain
        const terrain = (map as any).getTerrain && (map as any).getTerrain();
        if (!terrain) {
          (map as any).setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 });
        }
      } catch (_) {}

      // Add sky for atmosphere
      try {
        if (!map.getLayer('sky')) {
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 0.0],
              'sky-atmosphere-sun-intensity': 10
            }
          } as any);
        }
      } catch (_) {}

      if (map.getLayer('3d-buildings')) return;
      try {
        const layers = map.getStyle().layers as any[];
        const labelLayerId = layers.find((l: any) => l.type === 'symbol' && l.layout && l.layout['text-field'])?.id;
        map.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['any', ['==', ['get', 'extrude'], 'true'], ['has', 'height'], ['has', 'min_height']],
            type: 'fill-extrusion',
            minzoom: 12,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, '#6b7280',
                16, '#4b5563'
              ],
              'fill-extrusion-height': ['coalesce', ['get', 'height'], 20],
              'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
              'fill-extrusion-opacity': 0.9,
              'fill-extrusion-vertical-gradient': true
            }
          },
          labelLayerId
        );
      } catch (_) {
        // ignore if style doesn't support buildings
      }
    };

    const onLoad = () => ensure3DBuildings();
    const onStyleData = () => ensure3DBuildings();

    if (map.loaded()) ensure3DBuildings();
    map.on('load', onLoad);
    map.on('styledata', onStyleData);

    return () => {
      map.off('load', onLoad);
      map.off('styledata', onStyleData);
    };
  }, []);

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
          className={`p-3 rounded-lg border transition-colors ${
            show3D
              ? 'bg-gray-200 border-gray-300 text-gray-800 shadow-inner'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
          title={show3D ? 'Disable 3D View' : 'Enable 3D View'}
        >
          <Box className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`p-3 rounded-lg border transition-colors ${
            showTraffic
              ? 'bg-gray-200 border-gray-300 text-gray-800 shadow-inner'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
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
          zoom: 13.5,
          pitch: 60,
          bearing: 30
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        antialias={true}
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
                  <div className="absolute inset-0 w-14 h-14 bg-arkus-blue rounded-full opacity-20 animate-pulse -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                )}
                <div className={`relative w-10 h-10 bg-arkus-blue rounded-full flex items-center justify-center text-white shadow-2xl border-2 ${isFocused ? 'border-arkus-blue scale-125' : 'border-white'} transition-all`}>
                  <Warehouse className="w-5 h-5" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap bg-white/95 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded shadow-lg border border-gray-200">
                  {warehouse.name}
                </div>
              </div>
            </Marker>
          );
        })}

        {allVisibleRoutes.map(route => {
          if (!route || !route.routeGeometry || route.routeGeometry.length === 0) return null;
          const isFocused = focusedRouteId === route.id;
          const hasActiveVehicleOnRoute = vehicles.some(v => v.status === 'in_route' && v.currentRouteId === route.id);

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

              {isFocused && hasActiveVehicleOnRoute && route.stops.map(stop => {
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
                      onMouseEnter={() => setHoveredStopId(stop.id)}
                      onMouseLeave={() => setHoveredStopId(prev => (prev === stop.id ? null : prev))}
                    >
                      <div className={`w-8 h-8 ${isCompleted ? 'bg-red-600' : 'bg-green-600'} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl border-2 border-white hover:scale-110 transition-all duration-300`}>
                        {stop.stopNumber}
                      </div>

                      {/* Hover label for stop */}
                      {hoveredStopId === stop.id && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-gray-800 text-xs rounded shadow-md border border-gray-200 whitespace-nowrap pointer-events-none">
                          {stop.businessName}
                        </div>
                      )}
                    </div>
                  </Marker>
                );
              })}
            </div>
          );
        })}

        {inRouteVehicles.map(vehicle => {
          const statusBg: Record<string, string> = {
            in_route: 'bg-green-600',
            idle: 'bg-gray-500',
            available: 'bg-arkus-blue',
            maintenance: 'bg-yellow-500'
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
                  setPopupInfo({ type: 'vehicle', vehicleId: vehicle.id });
                  setFocusedVehicle(vehicle.id);
                }}
                onMouseEnter={() => setHoveredVehicleId(vehicle.id)}
                onMouseLeave={() => setHoveredVehicleId(prev => (prev === vehicle.id ? null : prev))}
                style={{ transition: 'all 0.5s ease-out' }}
              >
                {/* Pointy pin style */}
                <div className="hover:scale-110 transition-transform">
                  <div className={`w-9 h-9 ${statusBg[vehicle.status]} rounded-full flex items-center justify-center text-white shadow-2xl border-2 ${focusedVehicleId === vehicle.id ? 'border-yellow-400 border-4' : 'border-white'}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                {/* Hover label */}
                {hoveredVehicleId === vehicle.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-gray-800 text-xs rounded shadow-md border border-gray-200 whitespace-nowrap pointer-events-none">
                    {vehicle.alias}
                  </div>
                )}
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
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[320px] text-gray-800">
              <div className="bg-arkus-blue px-3 py-2 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 bg-white/25 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {popupInfo.data.stopNumber}
                  </div>
                  <h3 className="font-bold text-sm text-white truncate" title={popupInfo.data.businessName}>{popupInfo.data.businessName}</h3>
                </div>
                <button
                  onClick={() => setPopupInfo(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-700 mb-2 truncate" title={popupInfo.data.address}>{popupInfo.data.address}</p>
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
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-arkus-blue">
                              <Truck className="w-3 h-3" /> {vehicleOnRoute.alias}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">ETA ~{etaToThisStop} min</span>
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{stopsUntilThis} stops away</span>
                          </div>
                        </div>
                      );
                    }

                    if (isCompleted) {
                      return (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-arkus-blue">Completed</span>
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}
              </div>
            </div>
          </Popup>
        )}

        {popupInfo && popupInfo.type === 'vehicle' && (
          <Popup
            longitude={(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id))?.currentPosition || popupInfo.data?.currentPosition)?.lng}
            latitude={(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id))?.currentPosition || popupInfo.data?.currentPosition)?.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={15}
          >
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[340px] text-gray-800">
              <div className="flex items-center justify-between mb-3 bg-arkus-blue -mx-4 -mt-4 px-4 py-2 rounded-t-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck className="w-5 h-5 text-white" />
                  <div>
                    <h3 className="font-bold text-base text-white truncate">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.alias}</h3>
                    <p className="text-[10px] text-white/80 font-mono truncate">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.licensePlate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPopupInfo(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {(() => {
                const veh = vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data;
                const status = (veh?.status || 'idle') as string;
                const statusClass = status === 'in_route'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : status === 'available'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : status === 'maintenance'
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200';
                const label = status === 'in_route' ? 'In Route' : status.charAt(0).toUpperCase() + status.slice(1);
                return (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusClass} mb-3 inline-block`}>{label}</div>
                );
              })()}

              {(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry && (
                <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    TELEMETRY DATA
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${
                        ((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.batteryLevel > 50)
                          ? 'text-green-400'
                          : ((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.batteryLevel > 20)
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`} />
                      <div>
                        <div className={`text-sm font-semibold ${
                          ((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.batteryLevel > 50)
                            ? 'text-green-400'
                            : ((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.batteryLevel > 20)
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}>
                          {(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.batteryLevel}%
                        </div>
                        <div className="text-xs text-gray-500">Battery</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.speed} km/h</div>
                        <div className="text-xs text-gray-500">Speed</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.range} km</div>
                        <div className="text-xs text-gray-500">Range</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.motorTemperature as number).toFixed(1)}°C</div>
                        <div className="text-xs text-gray-500">Motor</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.powerConsumption as number).toFixed(1)} kW</div>
                        <div className="text-xs text-gray-500">Power</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.signalStrength}%</div>
                        <div className="text-xs text-gray-500">Signal</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Autonomy Mode</span>
                      <span className="text-xs font-semibold text-blue-400 uppercase">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.autonomyMode}</span>
                    </div>

                    {(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.obstaclesDetected > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Obstacles Detected</span>
                        <span className="text-xs font-semibold text-orange-400">{(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.telemetry.obstaclesDetected}</span>
                      </div>
                    )}

                    {(vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.currentPosition && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS Position
                        </span>
                        <span className="text-xs font-mono text-gray-600">
                          {((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.currentPosition.lat as number).toFixed(4)}, {((vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data)?.currentPosition.lng as number).toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(() => {
                const veh = vehicles.find(v => v.id === (popupInfo.vehicleId || popupInfo.data?.id)) || popupInfo.data;
                const route = savedRoutes.find(r => r.id === veh?.currentRouteId);
                if (route) {
                  const originWarehouse = warehouses.find(w => w.id === route.originWarehouseId);
                  const destWarehouse = warehouses.find(w => w.id === route.destinationWarehouseId);
                  return (
                    <div className="space-y-2">
                      <p className="text-xs text-blue-600 font-semibold">
                        {route.name}
                      </p>
                      {originWarehouse && destWarehouse && (
                        <p className="text-xs text-gray-600">
                          {originWarehouse.name} → {destWarehouse.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {veh?.eta && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-blue-50 text-arkus-blue font-medium">ETA {veh.eta} min</span>
                        )}
                        {veh?.stopsRemaining !== undefined && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{veh.stopsRemaining} stops left</span>
                        )}
                        {veh?.routeProgress !== undefined && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{Math.round((veh.routeProgress || 0) * 100)}%</span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
