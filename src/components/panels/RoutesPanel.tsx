import { Route } from 'lucide-react';
import { useFleet } from '../../context/FleetContext';

export function RoutesPanel() {
  const { savedRoutes } = useFleet();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Route className="w-5 h-5" stroke="url(#grad-section-icon)" strokeWidth={2} />
        <h2 className="text-lg font-bold text-gray-900">Routes</h2>
      </div>
      <div className="space-y-2">
        {savedRoutes.map(r => (
          <div key={r.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{r.name}</div>
              <div className="text-xs text-gray-500">{r.id.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
