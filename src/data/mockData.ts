import { Warehouse, SavedRoute, Vehicle } from '../types';

export const warehouses: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'Downtown Hub',
    address: '1050 Kettner Blvd, San Diego, CA 92101',
    coordinates: { lat: 32.7193, lng: -117.1697 }
  },
  {
    id: 'wh-002',
    name: 'Mission Valley Center',
    address: '7510 Hazard Center Dr, San Diego, CA 92108',
    coordinates: { lat: 32.7684, lng: -117.1658 }
  },
  {
    id: 'wh-003',
    name: 'La Jolla Depot',
    address: '8950 Villa La Jolla Dr, La Jolla, CA 92037',
    coordinates: { lat: 32.8715, lng: -117.2120 }
  },
  {
    id: 'wh-004',
    name: 'Chula Vista Distribution',
    address: '555 Broadway, Chula Vista, CA 91910',
    coordinates: { lat: 32.6400, lng: -117.0842 }
  }
];

const routeColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6'  // teal
];

export const savedRoutes: SavedRoute[] = [
  {
    id: 'rt-001',
    name: 'RT-001 Downtown Circuit',
    originWarehouseId: 'wh-001',
    destinationWarehouseId: 'wh-001',
    color: routeColors[0],
    stops: [
      {
        id: 'stop-001-1',
        stopNumber: 1,
        businessName: 'Seaport Village Market',
        address: '849 W Harbor Dr, San Diego, CA',
        coordinates: { lat: 32.7091, lng: -117.1709 }
      },
      {
        id: 'stop-001-2',
        stopNumber: 2,
        businessName: 'Gaslamp Quarter Store',
        address: '345 Fifth Ave, San Diego, CA',
        coordinates: { lat: 32.7113, lng: -117.1604 }
      },
      {
        id: 'stop-001-3',
        stopNumber: 3,
        businessName: 'Little Italy Cafe',
        address: '2210 India St, San Diego, CA',
        coordinates: { lat: 32.7280, lng: -117.1695 }
      }
    ],
    routeGeometry: []
  },
  {
    id: 'rt-002',
    name: 'RT-002 Mission Valley Express',
    originWarehouseId: 'wh-001',
    destinationWarehouseId: 'wh-002',
    color: routeColors[1],
    stops: [
      {
        id: 'stop-002-1',
        stopNumber: 1,
        businessName: 'Hillcrest Medical Plaza',
        address: '3737 Fifth Ave, San Diego, CA',
        coordinates: { lat: 32.7485, lng: -117.1610 }
      },
      {
        id: 'stop-002-2',
        stopNumber: 2,
        businessName: 'Fashion Valley Shop',
        address: '7007 Friars Rd, San Diego, CA',
        coordinates: { lat: 32.7677, lng: -117.1663 }
      }
    ],
    routeGeometry: []
  },
  {
    id: 'rt-003',
    name: 'RT-003 La Jolla Coastal',
    originWarehouseId: 'wh-002',
    destinationWarehouseId: 'wh-003',
    color: routeColors[2],
    stops: [
      {
        id: 'stop-003-1',
        stopNumber: 1,
        businessName: 'Pacific Beach Market',
        address: '4150 Mission Blvd, San Diego, CA',
        coordinates: { lat: 32.7815, lng: -117.2521 }
      },
      {
        id: 'stop-003-2',
        stopNumber: 2,
        businessName: 'La Jolla Shores Store',
        address: '8320 La Jolla Shores Dr, La Jolla, CA',
        coordinates: { lat: 32.8570, lng: -117.2565 }
      }
    ],
    routeGeometry: []
  },
  {
    id: 'rt-004',
    name: 'RT-004 South Bay Run',
    originWarehouseId: 'wh-001',
    destinationWarehouseId: 'wh-004',
    color: routeColors[3],
    stops: [
      {
        id: 'stop-004-1',
        stopNumber: 1,
        businessName: 'National City Plaza',
        address: '1100 E Plaza Blvd, National City, CA',
        coordinates: { lat: 32.6709, lng: -117.0914 }
      },
      {
        id: 'stop-004-2',
        stopNumber: 2,
        businessName: 'Chula Vista Center',
        address: '555 Broadway, Chula Vista, CA',
        coordinates: { lat: 32.6279, lng: -117.0813 }
      }
    ],
    routeGeometry: []
  },
  {
    id: 'rt-005',
    name: 'RT-005 North County Express',
    originWarehouseId: 'wh-003',
    destinationWarehouseId: 'wh-002',
    color: routeColors[4],
    stops: [
      {
        id: 'stop-005-1',
        stopNumber: 1,
        businessName: 'UTC Shopping Center',
        address: '4545 La Jolla Village Dr, San Diego, CA',
        coordinates: { lat: 32.8717, lng: -117.2092 }
      }
    ],
    routeGeometry: []
  },
  {
    id: 'rt-006',
    name: 'RT-006 Coastal Return',
    originWarehouseId: 'wh-004',
    destinationWarehouseId: 'wh-001',
    color: routeColors[5],
    stops: [
      {
        id: 'stop-006-1',
        stopNumber: 1,
        businessName: 'Barrio Logan Market',
        address: '2060 Logan Ave, San Diego, CA',
        coordinates: { lat: 32.7015, lng: -117.1363 }
      },
      {
        id: 'stop-006-2',
        stopNumber: 2,
        businessName: 'Coronado Bridge Store',
        address: '1201 First St, Coronado, CA',
        coordinates: { lat: 32.6859, lng: -117.1831 }
      }
    ],
    routeGeometry: []
  }
];

export const initialVehicles: Vehicle[] = [
  {
    id: 'veh-001',
    alias: 'U-23',
    licensePlate: 'CA-7721',
    status: 'in_route',
    currentRouteId: 'rt-002',
    routeProgress: 0.3,
    stopsRemaining: 2,
    eta: 18
  },
  {
    id: 'veh-002',
    alias: 'U-45',
    licensePlate: 'CA-8832',
    status: 'in_route',
    currentRouteId: 'rt-004',
    routeProgress: 0.6,
    stopsRemaining: 1,
    eta: 12
  },
  {
    id: 'veh-003',
    alias: 'U-67',
    licensePlate: 'CA-9943',
    status: 'in_route',
    currentRouteId: 'rt-001',
    routeProgress: 0.15,
    stopsRemaining: 3,
    eta: 25
  },
  {
    id: 'veh-004',
    alias: 'U-12',
    licensePlate: 'CA-5544',
    status: 'available',
  },
  {
    id: 'veh-005',
    alias: 'U-89',
    licensePlate: 'CA-3355',
    status: 'idle',
  },
  {
    id: 'veh-006',
    alias: 'U-34',
    licensePlate: 'CA-6677',
    status: 'available',
  },
  {
    id: 'veh-007',
    alias: 'U-56',
    licensePlate: 'CA-2211',
    status: 'idle',
  },
  {
    id: 'veh-008',
    alias: 'U-78',
    licensePlate: 'CA-4499',
    status: 'maintenance',
  },
  {
    id: 'veh-009',
    alias: 'U-90',
    licensePlate: 'CA-8800',
    status: 'available',
  },
  {
    id: 'veh-010',
    alias: 'U-11',
    licensePlate: 'CA-1122',
    status: 'idle',
  }
];
