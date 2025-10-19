import { useEffect } from 'react';
import { useFleet } from '../context/FleetContext';

interface MobilePanelControllerProps {
  activePanel: string | null;
  setMobilePanelHeight: (height: number) => void;
}

export function MobilePanelController({ activePanel, setMobilePanelHeight }: MobilePanelControllerProps) {
  const { focusedRouteId, focusedVehicleId, focusedWarehouseId } = useFleet();
  
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    
    const hasFocusedElement = focusedRouteId || focusedVehicleId || focusedWarehouseId;
    
    // Don't minimize if chat is active (chat has its own floating behavior)
    if (activePanel === 'chat') return;
    
    if (activePanel && hasFocusedElement) {
      setMobilePanelHeight(15); // Minimize to show just the header
    } else if (activePanel && !hasFocusedElement) {
      setMobilePanelHeight(60); // Restore to normal height
    }
  }, [activePanel, focusedRouteId, focusedVehicleId, focusedWarehouseId, setMobilePanelHeight]);
  
  return null;
}
