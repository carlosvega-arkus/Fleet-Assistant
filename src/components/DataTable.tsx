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
    );
  }

  if (data.type === 'vehicles') {
    return (
      <div className="overflow-x-auto">
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
    );
  }

  if (data.type === 'warehouses') {
    return (
      <div className="overflow-x-auto">
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
    );
  }

  return null;
}
