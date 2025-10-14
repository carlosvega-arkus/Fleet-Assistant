import { Send, Truck, Route } from 'lucide-react';
import { useState } from 'react';
import { useFleet } from '../../context/FleetContext';

export function DispatchPanel() {
  const { vehicles, savedRoutes, dispatchVehicle, addChatMessage, toggleRouteVisibility, visibleRouteIds, setFocusedRoute, navigateToChat } = useFleet();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');

  const availableVehicles = vehicles.filter(v => v.status === 'idle' || v.status === 'available');

  const handleRouteSelect = (routeId: string) => {
    setSelectedRoute(routeId);

    if (routeId) {
      if (!visibleRouteIds.has(routeId)) {
        toggleRouteVisibility(routeId);
      }
      setFocusedRoute(routeId);
    } else {
      setFocusedRoute(null);
    }
  };

  const handleDispatch = () => {
    if (!selectedVehicle || !selectedRoute) return;

    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    const route = savedRoutes.find(r => r.id === selectedRoute);

    if (vehicle && route) {
      dispatchVehicle(selectedVehicle, selectedRoute);
      addChatMessage({
        type: 'assistant',
        content: `Vehicle ${vehicle.alias} has been dispatched on route ${route.name}.`
      });

      setSelectedVehicle('');
      setSelectedRoute('');

      if (navigateToChat) {
        navigateToChat();
      }
    }
  };

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Dispatch Vehicle</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Truck className="w-4 h-4 inline mr-1" />
            Select Vehicle
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Choose a vehicle...</option>
            {availableVehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.alias} ({vehicle.licensePlate}) - {vehicle.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Route className="w-4 h-4 inline mr-1" />
            Select Route
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => handleRouteSelect(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Choose a route...</option>
            {savedRoutes.map(route => (
              <option key={route.id} value={route.id}>
                {route.name} ({route.stops.length} stops)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDispatch}
          disabled={!selectedVehicle || !selectedRoute}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4 inline mr-2" />
          Start Dispatch
        </button>

        {availableVehicles.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-300">
              No vehicles available for dispatch. All vehicles are either en route or in maintenance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
