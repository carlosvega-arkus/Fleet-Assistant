import { Route, Eye, EyeOff, Focus } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function RoutesPanel() {
  const { savedRoutes, visibleRouteIds, focusedRouteId, toggleRouteVisibility, setFocusedRoute, warehouses, vehicles } = useFleet();

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)?.name || 'Unknown';
  };

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-arkus-fuchsia" />
        <h2 className="text-lg font-bold bg-gradient-arkus bg-clip-text text-transparent">Saved Routes</h2>
      </div>

      <div className="space-y-3">
        {savedRoutes.map(route => {
          const hasActiveVehicle = vehicles.some(v => v.status === 'in_route' && v.currentRouteId === route.id);
          const isVisible = visibleRouteIds.has(route.id) || hasActiveVehicle;
          const isFocused = focusedRouteId === route.id;

          return (
            <div
              key={route.id}
              className={`border rounded-lg p-3 transition-all ${
                isFocused ? 'border-arkus-fuchsia bg-pink-50' : 'border-gray-200 bg-white hover:border-arkus-blue'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1 text-gray-900">{route.name}</h3>
                    <p className="text-xs text-gray-600">
                      {getWarehouseName(route.originWarehouseId)} → {getWarehouseName(route.destinationWarehouseId)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {route.stops.length} stops
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleRouteVisibility(route.id)}
                  className={`p-1.5 rounded transition-colors ${
                    isVisible
                      ? 'bg-blue-50 text-arkus-blue hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={isVisible ? 'Hide route' : 'Show route'}
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {isVisible && (
                <button
                  onClick={() => setFocusedRoute(isFocused ? null : route.id)}
                  className={`w-full mt-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isFocused
                      ? 'bg-gradient-arkus text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Focus className="w-3 h-3 inline mr-1" />
                  {isFocused ? 'Unfocus' : 'Focus Route'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
