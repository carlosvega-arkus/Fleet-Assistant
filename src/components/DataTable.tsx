import { RouteTableData, VehicleTableData, WarehouseTableData } from '../types';

interface DataTableProps {
  data: RouteTableData | VehicleTableData | WarehouseTableData;
}

export function DataTable({ data }: DataTableProps) {
  if (data.type === 'routes') {
    return (
      <div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Route ID</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Origin</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Destination</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Stops</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.routes.map((route, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 font-mono text-arkus-blue">{route.id}</td>
                  <td className="py-2 px-3 text-gray-800">{route.name}</td>
                  <td className="py-2 px-3 text-gray-600">{route.origin}</td>
                  <td className="py-2 px-3 text-gray-600">{route.destination}</td>
                  <td className="py-2 px-3">
                    <span className="text-gray-700">{route.stops}</span>
                    <div className="text-xs text-gray-500 mt-1">{route.stopsList}</div>
                  </td>
                  <td className="py-2 px-3">
                    {route.assignedVehicle !== 'None' ? (
                      <span className="text-green-600 font-semibold">{route.assignedVehicle}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      route.status === 'Active'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {route.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden divide-y divide-gray-200">
          {data.routes.map((route, idx) => (
            <details key={idx} className="py-2">
              <summary className="list-none cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">{route.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{route.id}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{route.origin} → {route.destination}</div>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                    route.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {route.status}
                  </span>
                </div>
              </summary>
              <div className="mt-2 pl-1 text-sm text-gray-700 space-y-1">
                <div>
                  <span className="text-gray-500">Stops:</span> {route.stops}
                </div>
                {route.stopsList && (
                  <div className="text-xs text-gray-500 break-words">{route.stopsList}</div>
                )}
                <div>
                  <span className="text-gray-500">Vehicle:</span> {route.assignedVehicle !== 'None' ? route.assignedVehicle : '—'}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (data.type === 'vehicles') {
    return (
      <div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Alias</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">License</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Current Route</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">ETA</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Stops Left</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.vehicles.map((vehicle, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 font-semibold text-arkus-blue">{vehicle.alias}</td>
                  <td className="py-2 px-3 font-mono text-gray-700">{vehicle.licensePlate}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vehicle.status === 'in_route'
                        ? 'bg-blue-50 text-blue-600'
                        : vehicle.status === 'available'
                        ? 'bg-green-50 text-green-600'
                        : vehicle.status === 'maintenance'
                        ? 'bg-yellow-50 text-yellow-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{vehicle.currentRoute}</td>
                  <td className="py-2 px-3 text-gray-600">{vehicle.eta}</td>
                  <td className="py-2 px-3 text-gray-600">{vehicle.stopsRemaining}</td>
                  <td className="py-2 px-3 text-gray-600">{vehicle.progress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden divide-y divide-gray-200">
          {data.vehicles.map((vehicle, idx) => (
            <details key={idx} className="py-2">
              <summary className="list-none cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">{vehicle.alias}</div>
                    <div className="text-xs text-gray-500 font-mono">{vehicle.licensePlate}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{vehicle.currentRoute}</div>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                    vehicle.status === 'in_route'
                      ? 'bg-blue-50 text-blue-600'
                      : vehicle.status === 'available'
                      ? 'bg-green-50 text-green-600'
                      : vehicle.status === 'maintenance'
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
              </summary>
              <div className="mt-2 pl-1 text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">ETA:</span> {vehicle.eta || '—'}</div>
                <div><span className="text-gray-500">Stops:</span> {vehicle.stopsRemaining || '—'}</div>
                <div><span className="text-gray-500">Progress:</span> {vehicle.progress || '—'}</div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (data.type === 'warehouses') {
    return (
      <div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">ID</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Address</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Coordinates</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Outbound</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Inbound</th>
              </tr>
            </thead>
            <tbody>
              {data.warehouses.map((warehouse, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 font-mono text-arkus-blue">{warehouse.id}</td>
                  <td className="py-2 px-3 font-semibold text-gray-800">{warehouse.name}</td>
                  <td className="py-2 px-3 text-gray-700">{warehouse.address}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-600">{warehouse.coordinates}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">
                      {warehouse.outboundRoutes}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block bg-green-50 text-green-600 px-2 py-1 rounded text-xs">
                      {warehouse.inboundRoutes}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden divide-y divide-gray-200">
          {data.warehouses.map((warehouse, idx) => (
            <details key={idx} className="py-2">
              <summary className="list-none cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">{warehouse.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{warehouse.id}</div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{warehouse.address}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">Out: {warehouse.outboundRoutes}</span>
                    <span className="inline-block bg-green-50 text-green-600 px-2 py-1 rounded text-xs">In: {warehouse.inboundRoutes}</span>
                  </div>
                </div>
              </summary>
              <div className="mt-2 pl-1 text-sm text-gray-700">
                <div><span className="text-gray-500">Coordinates:</span> {warehouse.coordinates}</div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
