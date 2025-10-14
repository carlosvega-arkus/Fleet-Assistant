import { X, Truck, ArrowRight, ArrowLeft, Package, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { Warehouse, Vehicle, SavedRoute } from '../types';

interface WarehouseInfoPopupProps {
  warehouse: Warehouse;
  vehicles: Vehicle[];
  routes: SavedRoute[];
  onClose: () => void;
}

export function WarehouseInfoPopup({ warehouse, vehicles, routes, onClose }: WarehouseInfoPopupProps) {
  const [incomingExpanded, setIncomingExpanded] = useState(false);
  const [outgoingExpanded, setOutgoingExpanded] = useState(false);
  const [availableExpanded, setAvailableExpanded] = useState(false);
  const defaultLimit = 3;
  const vehiclesToWarehouse = vehicles.filter(v => {
    if (v.status !== 'in_route' || !v.currentRouteId) return false;
    const route = routes.find(r => r.id === v.currentRouteId);
    return route?.destinationWarehouseId === warehouse.id;
  });

  const vehiclesFromWarehouse = vehicles.filter(v => {
    if (v.status !== 'in_route' || !v.currentRouteId) return false;
    const route = routes.find(r => r.id === v.currentRouteId);
    return route?.originWarehouseId === warehouse.id;
  });

  const idleVehiclesNearby = vehicles.filter(v =>
    (v.status === 'idle' || v.status === 'available')
  );

  const routesFrom = routes.filter(r => r.originWarehouseId === warehouse.id);
  const routesTo = routes.filter(r => r.destinationWarehouseId === warehouse.id);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-2xl border border-blue-500/30 w-96 max-w-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{warehouse.name}</h3>
              <p className="text-xs text-blue-100">{warehouse.id.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-300 leading-relaxed truncate max-w-[280px]" title={warehouse.address}>{warehouse.address}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-400 mb-0.5">
                  <TrendingDown className="w-3 h-3" />
                  <span className="text-xs font-bold">{routesTo.length}</span>
                </div>
                <p className="text-[10px] text-gray-500">Inbound</p>
              </div>
              <div className="w-px h-8 bg-gray-700"></div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-orange-400 mb-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-bold">{routesFrom.length}</span>
                </div>
                <p className="text-[10px] text-gray-500">Outbound</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-gray-400">
                {warehouse.coordinates.lat.toFixed(4)}
              </p>
              <p className="text-xs font-mono text-gray-400">
                {warehouse.coordinates.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {vehiclesToWarehouse.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20 hover:bg-green-500/15 transition-colors"
              onClick={() => setIncomingExpanded(!incomingExpanded)}
            >
              <ArrowRight className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Incoming</span>
              <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                {vehiclesToWarehouse.length}
              </span>
            </button>
            <div className="space-y-2">
              {(incomingExpanded ? vehiclesToWarehouse : vehiclesToWarehouse.slice(0, defaultLimit)).map(vehicle => {
                const route = routes.find(r => r.id === vehicle.currentRouteId);
                return (
                  <div
                    key={vehicle.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-2.5 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                          <Truck className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-white font-semibold text-sm truncate">{vehicle.alias}</span>
                        {route && (
                          <span className="text-gray-400 text-xs truncate">· {route.name}</span>
                        )}
                      </div>
                      {vehicle.eta && (
                        <span className="bg-green-500/20 px-2 py-0.5 rounded text-green-400 font-bold text-xs flex-shrink-0">
                          {vehicle.eta} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {vehiclesToWarehouse.length > defaultLimit && (
                <button
                  className="w-full text-xs text-green-400 hover:text-green-300 transition-colors"
                  onClick={() => setIncomingExpanded(!incomingExpanded)}
                >
                  {incomingExpanded ? 'Show less' : `Show all ${vehiclesToWarehouse.length}`}
                </button>
              )}
            </div>
          </div>
        )}

        {vehiclesFromWarehouse.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 bg-orange-500/10 rounded-lg border border-orange-500/20 hover:bg-orange-500/15 transition-colors"
              onClick={() => setOutgoingExpanded(!outgoingExpanded)}
            >
              <ArrowLeft className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">Outgoing</span>
              <span className="ml-auto text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                {vehiclesFromWarehouse.length}
              </span>
            </button>
            <div className="space-y-2">
              {(outgoingExpanded ? vehiclesFromWarehouse : vehiclesFromWarehouse.slice(0, defaultLimit)).map(vehicle => {
                const route = routes.find(r => r.id === vehicle.currentRouteId);
                return (
                  <div
                    key={vehicle.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-2.5 hover:border-orange-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0">
                        <Truck className="w-3 h-3 text-orange-400" />
                      </div>
                      <span className="text-white font-semibold text-sm truncate">{vehicle.alias}</span>
                      {route && (
                        <span className="text-gray-400 text-xs truncate">· {route.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {vehiclesFromWarehouse.length > defaultLimit && (
                <button
                  className="w-full text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  onClick={() => setOutgoingExpanded(!outgoingExpanded)}
                >
                  {outgoingExpanded ? 'Show less' : `Show all ${vehiclesFromWarehouse.length}`}
                </button>
              )}
            </div>
          </div>
        )}

        {idleVehiclesNearby.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
              onClick={() => setAvailableExpanded(!availableExpanded)}
            >
              <Truck className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Available</span>
              <span className="ml-auto text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                {idleVehiclesNearby.length}
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {(availableExpanded ? idleVehiclesNearby : idleVehiclesNearby.slice(0, 4)).map(vehicle => (
                <div
                  key={vehicle.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                      <Truck className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-white font-semibold text-xs truncate">{vehicle.alias}</span>
                  </div>
                  <span className="text-gray-500 capitalize text-[10px] pl-6">{vehicle.status}</span>
                </div>
              ))}
            </div>
            {idleVehiclesNearby.length > 4 && (
              <button
                className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setAvailableExpanded(!availableExpanded)}
              >
                {availableExpanded ? 'Show less' : `Show all ${idleVehiclesNearby.length}`}
              </button>
            )}
          </div>
        )}

        {vehiclesToWarehouse.length === 0 &&
         vehiclesFromWarehouse.length === 0 &&
         idleVehiclesNearby.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No vehicle activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
