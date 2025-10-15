import { Truck, Clock, MapPin, Battery, Zap } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { VehicleStatus } from '../../types';

const statusColors: Record<VehicleStatus, string> = {
  in_route: 'bg-green-50 text-green-700 border-green-300',
  idle: 'bg-gray-100 text-gray-700 border-gray-300',
  available: 'bg-blue-50 text-blue-700 border-blue-300',
  maintenance: 'bg-orange-50 text-orange-700 border-orange-300'
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
        <Truck className="w-5 h-5 text-arkus-fuchsia" />
        <h2 className="text-lg font-bold bg-gradient-arkus bg-clip-text text-transparent">Autonomous EVs</h2>
        <span className="ml-auto text-sm text-gray-600">{vehicles.length} total</span>
      </div>

      <div className="space-y-3">
        {vehicles.map(vehicle => {
          const routeName = getRouteName(vehicle.currentRouteId);

          return (
            <div
              key={vehicle.id}
              className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                focusedVehicleId === vehicle.id
                  ? 'border-arkus-fuchsia bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-arkus-blue'
              }`}
              onClick={() => setFocusedVehicle(vehicle.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{vehicle.alias}</h3>
                  <p className="text-xs text-gray-600 font-mono">{vehicle.licensePlate}</p>
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
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Battery className={`w-3 h-3 ${vehicle.telemetry.batteryLevel > 50 ? 'text-green-400' : vehicle.telemetry.batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}`} />
                    <span className={vehicle.telemetry.batteryLevel > 50 ? 'text-green-400' : vehicle.telemetry.batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'}>
                      {vehicle.telemetry.batteryLevel}%
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{vehicle.telemetry.range}km range</span>
                  </div>
                  {vehicle.status === 'in_route' && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-arkus-blue">
                        <Zap className="w-3 h-3" />
                        <span>{vehicle.telemetry.speed}km/h</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{vehicle.telemetry.autonomyMode}</span>
                      </div>
                      {routeName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{routeName}</span>
                        </div>
                      )}
                      {vehicle.eta !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
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
