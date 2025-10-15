export type VehicleStatus = 'idle' | 'in_route' | 'maintenance' | 'available';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface RouteStop {
  id: string;
  stopNumber: number;
  businessName: string;
  address: string;
  coordinates: Coordinates;
}

export interface SavedRoute {
  id: string;
  name: string;
  originWarehouseId: string;
  destinationWarehouseId: string;
  stops: RouteStop[];
  routeGeometry: Coordinates[];
  color: string;
}

export interface VehicleTelemetry {
  batteryLevel: number; // 0-100
  batteryTemperature: number; // Celsius
  speed: number; // km/h
  range: number; // km remaining
  motorTemperature: number; // Celsius
  powerConsumption: number; // kW
  autonomyMode: 'full' | 'assisted' | 'manual';
  obstaclesDetected: number;
  signalStrength: number; // 0-100
  lastUpdate: Date;
}

export interface Vehicle {
  id: string;
  alias: string;
  licensePlate: string;
  status: VehicleStatus;
  currentRouteId?: string;
  currentPosition?: Coordinates;
  eta?: number;
  stopsRemaining?: number;
  routeProgress?: number;
  completedStops?: Set<string>;
  telemetry?: VehicleTelemetry;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  structuredData?: RouteTableData | VehicleTableData | WarehouseTableData;
}

export interface RouteTableData {
  type: 'routes';
  routes: Array<{
    id: string;
    name: string;
    origin: string;
    destination: string;
    stops: number;
    stopsList: string;
    assignedVehicle: string;
    status: string;
  }>;
}

export interface VehicleTableData {
  type: 'vehicles';
  vehicles: Array<{
    alias: string;
    licensePlate: string;
    status: string;
    currentRoute: string;
    eta: string;
    stopsRemaining: string;
    progress: string;
  }>;
}

export interface WarehouseTableData {
  type: 'warehouses';
  warehouses: Array<{
    id: string;
    name: string;
    address: string;
    coordinates: string;
    outboundRoutes: number;
    inboundRoutes: number;
  }>;
}
