import { Route, Focus, Eye, EyeOff } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function RoutesPanel() {
  const {
    savedRoutes,
    vehicles,
    warehouses,
    routeTraffic,
    visibleRouteIds,
    toggleRouteVisibility,
    setFocusedRoute,
    focusedRouteId
  } = useFleet();

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5" stroke="url(#grad-section-icon)" strokeWidth={2} />
        <h2 className="text-lg font-bold text-gray-900">Routes</h2>
      </div>

      <div className="space-y-3">
        {savedRoutes.map(r => {
          const origin = warehouses.find(w => w.id === r.originWarehouseId);
          const destination = warehouses.find(w => w.id === r.destinationWarehouseId);
          const assignedVehicle = vehicles.find(v => v.currentRouteId === r.id);
          const traffic = routeTraffic[r.id];
          const isVisible = visibleRouteIds.has(r.id);
          const isFocused = focusedRouteId === r.id;
          const hasActiveVehicle = !!vehicles.find(v => v.currentRouteId === r.id && v.status === 'in_route');

          return (
            <div
              key={r.id}
              className={`border rounded-lg p-3 transition-all ${
                isFocused ? 'border-arkus-fuchsia bg-pink-50' : 'border-gray-200 bg-white hover:border-arkus-blue'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{r.name}</h3>
                  <div className="text-xs text-gray-500">{r.id.toUpperCase()}</div>
                </div>
                <button
                  title={isVisible ? 'Hide route' : 'Show route'}
                  onClick={() => toggleRouteVisibility(r.id)}
                  disabled={hasActiveVehicle && isVisible}
                  aria-pressed={isVisible}
                  className={`${isVisible ? 'p-2 rounded-lg border bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' : 'p-2 rounded-lg border bg-white border-gray-300 text-gray-800 hover:bg-gray-50'} ${hasActiveVehicle && isVisible ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-xs text-gray-600 mb-2">{origin?.name} → {destination?.name}</div>
              <div className="text-xs text-gray-600 mb-2">
                <span className="text-gray-800 font-medium">Stops:</span> {r.stops.length}
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-800 font-medium">Vehicle:</span> {assignedVehicle ? assignedVehicle.alias : 'None'}
              </div>
              <div className="text-xs mb-2">
                <span className="text-gray-800 font-medium">Traffic:</span>{' '}
                <span className={`${traffic?.status === 'closed' ? 'text-red-600' : traffic?.status === 'heavy' ? 'text-yellow-700' : 'text-green-700'}`}>
                  {traffic ? `${traffic.status.toUpperCase()}${traffic.delayMinutes ? ` (+${traffic.delayMinutes} min)` : ''}` : 'UNKNOWN'}
                </span>
              </div>

              <button
                onClick={() => {
                  if (!isVisible) toggleRouteVisibility(r.id);
                  setFocusedRoute(r.id);
                }}
                className={`w-full mt-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isFocused ? 'bg-gray-100 btn-gradient-arkus border-2 from-arkus-scarlet via-arkus-fuchsia to-arkus-blue bg-clip-border text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Focus className="w-3 h-3 inline mr-1" />
                Focus Route
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
