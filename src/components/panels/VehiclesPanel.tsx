import { Truck, Clock, MapPin, Battery, Zap } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { VehicleStatus } from '../../types';

const statusColors: Record<VehicleStatus, string> = {
  in_route: 'bg-green-900 text-green-300 border-green-700',
  idle: 'bg-gray-800 text-gray-300 border-gray-600',
  available: 'bg-blue-900 text-blue-300 border-blue-700',
  maintenance: 'bg-orange-900 text-orange-300 border-orange-700'
};

const statusLabels: Record<VehicleStatus, string> = {
  in_route: 'In Route',
  idle: 'Idle',
  available: 'Available',
  maintenance: 'Maintenance'
};

export function VehiclesPanel() {
  const { vehicles, savedRoutes, focusedVehicleId, setFocusedVehicle } = useFleet();

  const getRouteName = (routeId?: string) => {
    if (!routeId) return null;
    return savedRoutes.find(r => r.id === routeId)?.name;
  };

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Autonomous EVs</h2>
        <span className="ml-auto text-sm text-gray-400">{vehicles.length} total</span>
      </div>

      <div className="space-y-3">
        {vehicles.map(vehicle => {
          const routeName = getRouteName(vehicle.currentRouteId);

          return (
            <div
              key={vehicle.id}
              className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                focusedVehicleId === vehicle.id
                  ? 'border-yellow-400 bg-yellow-950'
                  : 'border-gray-700 bg-gray-900 hover:border-blue-500'
              }`}
              onClick={() => setFocusedVehicle(vehicle.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-white">{vehicle.alias}</h3>
                  <p className="text-xs text-gray-400 font-mono">{vehicle.licensePlate}</p>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    statusColors[vehicle.status]
                  }`}
                >
                  {statusLabels[vehicle.status]}
                </span>
              </div>

              {vehicle.telemetry && (
                <div className="mt-2 pt-2 border-t border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Battery className={`w-3 h-3 ${vehicle.telemetry.batteryLevel > 50 ? 'text-green-400' : vehicle.telemetry.batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}`} />
                    <span className={vehicle.telemetry.batteryLevel > 50 ? 'text-green-400' : vehicle.telemetry.batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}>
                      {vehicle.telemetry.batteryLevel}%
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{vehicle.telemetry.range}km range</span>
                  </div>
                  {vehicle.status === 'in_route' && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-blue-400">
                        <Zap className="w-3 h-3" />
                        <span>{vehicle.telemetry.speed}km/h</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{vehicle.telemetry.autonomyMode}</span>
                      </div>
                      {routeName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>{routeName}</span>
                        </div>
                      )}
                      {vehicle.eta !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>ETA: {vehicle.eta} min</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
