import { Send, Truck, Route, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useFleet } from '../../context/FleetContext';

export function DispatchPanel() {
  const { vehicles, savedRoutes, dispatchVehicle, addChatMessage, toggleRouteVisibility, visibleRouteIds, setFocusedRoute, navigateToChat } = useFleet();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

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

      // Close the mobile panel after dispatch by requesting App to hide it
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        const evt = new CustomEvent('closeMobilePanel');
        window.dispatchEvent(evt);
      }
    }
  };

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5" stroke="url(#grad-section-icon)" strokeWidth={2} />
        <h2 className="text-lg font-bold text-gray-900">Dispatch</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Truck className="w-4 h-4 inline mr-1" />
            Select Vehicle
          </label>
          {/* Desktop native select */}
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="hidden md:block w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-arkus-fuchsia focus:border-arkus-fuchsia text-sm"
          >
            <option value="">Choose a vehicle...</option>
            {availableVehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.alias} ({vehicle.licensePlate}) - {vehicle.status}
              </option>
            ))}
          </select>

          {/* Mobile modal trigger */}
          <button
            type="button"
            onClick={() => setShowVehicleModal(true)}
            className="md:hidden w-full px-3 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-arkus-fuchsia focus:border-arkus-fuchsia text-base flex items-center justify-between"
          >
            <span className="truncate">{selectedVehicle ? (availableVehicles.find(v => v.id === selectedVehicle)?.alias || 'Choose a vehicle...') : 'Choose a vehicle...'}</span>
            <ChevronDown className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Route className="w-4 h-4 inline mr-1" />
            Select Route
          </label>
          {/* Desktop native select */}
          <select
            value={selectedRoute}
            onChange={(e) => handleRouteSelect(e.target.value)}
            className="hidden md:block w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-arkus-fuchsia focus:border-arkus-fuchsia text-sm"
          >
            <option value="">Choose a route...</option>
            {savedRoutes.map(route => (
              <option key={route.id} value={route.id}>
                {route.name} ({route.stops.length} stops)
              </option>
            ))}
          </select>

          {/* Mobile modal trigger */}
          <button
            type="button"
            onClick={() => setShowRouteModal(true)}
            className="md:hidden w-full px-3 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-arkus-fuchsia focus:border-arkus-fuchsia text-base flex items-center justify-between"
          >
            <span className="truncate">{selectedRoute ? (savedRoutes.find(r => r.id === selectedRoute)?.name || 'Choose a route...') : 'Choose a route...'}</span>
            <ChevronDown className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <button
          onClick={handleDispatch}
          disabled={!selectedVehicle || !selectedRoute}
          className="w-full px-4 py-2 bg-gradient-arkus text-white rounded-lg font-medium hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4 inline mr-2" />
          Start Dispatch
        </button>

        {availableVehicles.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              No vehicles available for dispatch. All vehicles are either en route or in maintenance.
            </p>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-500">Select a vehicle and a route to dispatch.</div>
      {/* Mobile Vehicle Picker */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center" onClick={() => setShowVehicleModal(false)}>
          <div className="w-full md:w-[420px] max-h-[80vh] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-arkus-blue text-white flex items-center justify-between">
              <h3 className="font-semibold">Select Vehicle</h3>
              <button className="p-1 rounded hover:bg-white/20" onClick={() => setShowVehicleModal(false)} aria-label="Close vehicle list">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {availableVehicles.map(v => (
                <button
                  key={v.id}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 ${selectedVehicle === v.id ? 'bg-arkus-blue/10' : ''}`}
                  onClick={() => { setSelectedVehicle(v.id); setShowVehicleModal(false); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate">{v.alias}</div>
                      <div className="text-sm text-gray-600 truncate">{v.licensePlate}</div>
                    </div>
                    <span className="ml-3 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{v.status}</span>
                  </div>
                </button>
              ))}
              {availableVehicles.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No vehicles available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Route Picker */}
      {showRouteModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center" onClick={() => setShowRouteModal(false)}>
          <div className="w-full md:w-[420px] max-h-[80vh] bg-white rounded-t-2xl md:rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-arkus-blue text-white flex items-center justify-between">
              <h3 className="font-semibold">Select Route</h3>
              <button className="p-1 rounded hover:bg-white/20" onClick={() => setShowRouteModal(false)} aria-label="Close route list">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {savedRoutes.map(r => (
                <button
                  key={r.id}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 ${selectedRoute === r.id ? 'bg-arkus-blue/10' : ''}`}
                  onClick={() => { handleRouteSelect(r.id); setShowRouteModal(false); }}
                >
                  <div className="text-base font-semibold text-gray-900 truncate">{r.name}</div>
                  <div className="text-sm text-gray-600">{r.stops.length} stops</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
