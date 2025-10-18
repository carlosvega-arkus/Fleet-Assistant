import { Warehouse, Focus } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function WarehousesPanel() {
  const { warehouses, focusedWarehouseId, setFocusedWarehouse } = useFleet();

  return (
    <div className="rounded-lg shadow-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-5 h-5 text-arkus-fuchsia" />
        <h2 className="text-lg font-bold text-gray-900">Warehouses</h2>
      </div>

      <div className="space-y-3">
        {warehouses.map(warehouse => {
          const isFocused = focusedWarehouseId === warehouse.id;

          return (
            <div
              key={warehouse.id}
              className={`border rounded-lg p-3 transition-all ${
                isFocused ? 'border-arkus-fuchsia bg-pink-50' : 'border-gray-200 bg-white hover:border-arkus-blue'
              }`}
            >
              <h3 className="font-semibold text-sm mb-1 text-gray-900">{warehouse.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{warehouse.address}</p>
              <div className="text-xs text-gray-500 mb-2">
                <span className="font-mono">
                  {warehouse.coordinates.lat.toFixed(4)}, {warehouse.coordinates.lng.toFixed(4)}
                </span>
              </div>
              <button
                onClick={() => setFocusedWarehouse(isFocused ? null : warehouse.id)}
                className={`w-full mt-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isFocused
                    ? 'bg-gradient-arkus text-white hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Focus className="w-3 h-3 inline mr-1" />
                {isFocused ? 'Unfocus' : 'Focus Warehouse'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
