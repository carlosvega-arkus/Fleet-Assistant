import { RouteTableData, VehicleTableData, WarehouseTableData } from '../types';

interface DataTableProps {
  data: RouteTableData | VehicleTableData | WarehouseTableData;
}

export function DataTable({ data }: DataTableProps) {
  if (data.type === 'routes') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Route ID</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Name</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Origin</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Destination</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Stops</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Vehicle</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.routes.map((route, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-600 transition-colors">
                <td className="py-2 px-3 font-mono text-blue-400">{route.id}</td>
                <td className="py-2 px-3">{route.name}</td>
                <td className="py-2 px-3 text-gray-300">{route.origin}</td>
                <td className="py-2 px-3 text-gray-300">{route.destination}</td>
                <td className="py-2 px-3">
                  <span className="text-gray-300">{route.stops}</span>
                  <div className="text-xs text-gray-500 mt-1">{route.stopsList}</div>
                </td>
                <td className="py-2 px-3">
                  {route.assignedVehicle !== 'None' ? (
                    <span className="text-green-400 font-semibold">{route.assignedVehicle}</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    route.status === 'Active'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {route.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.type === 'vehicles') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Alias</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">License</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Status</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Current Route</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">ETA</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Stops Left</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.vehicles.map((vehicle, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-600 transition-colors">
                <td className="py-2 px-3 font-semibold text-blue-400">{vehicle.alias}</td>
                <td className="py-2 px-3 font-mono text-gray-300">{vehicle.licensePlate}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    vehicle.status === 'in_route'
                      ? 'bg-blue-900 text-blue-300'
                      : vehicle.status === 'available'
                      ? 'bg-green-900 text-green-300'
                      : vehicle.status === 'maintenance'
                      ? 'bg-red-900 text-red-300'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-300">{vehicle.currentRoute}</td>
                <td className="py-2 px-3 text-gray-300">{vehicle.eta}</td>
                <td className="py-2 px-3 text-gray-300">{vehicle.stopsRemaining}</td>
                <td className="py-2 px-3 text-gray-300">{vehicle.progress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.type === 'warehouses') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-2 px-3 font-semibold text-gray-300">ID</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Name</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Address</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Coordinates</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Outbound</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-300">Inbound</th>
            </tr>
          </thead>
          <tbody>
            {data.warehouses.map((warehouse, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-600 transition-colors">
                <td className="py-2 px-3 font-mono text-blue-400">{warehouse.id}</td>
                <td className="py-2 px-3 font-semibold">{warehouse.name}</td>
                <td className="py-2 px-3 text-gray-300">{warehouse.address}</td>
                <td className="py-2 px-3 font-mono text-xs text-gray-400">{warehouse.coordinates}</td>
                <td className="py-2 px-3 text-center">
                  <span className="inline-block bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                    {warehouse.outboundRoutes}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className="inline-block bg-green-900 text-green-300 px-2 py-1 rounded text-xs">
                    {warehouse.inboundRoutes}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
