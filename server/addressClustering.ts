import type { User } from "@shared/schema";

export interface AddressCluster {
  id: string;
  name: string;
  addresses: CustomerAddress[];
  centroid: [number, number]; // [lat, lng]
  totalCustomers: number;
  estimatedRevenue: number;
  lastPickupDate?: Date;
  status: 'available' | 'scheduled' | 'completed';
}

export interface CustomerAddress {
  customerId: number;
  username: string;
  email: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  subscriptionType: 'active' | 'inactive';
  lastPickup?: Date;
  bagCount: number;
}

/**
 * Philadelphia Metro Area Clustering Service
 * Groups customer addresses into geographic clusters for efficient route planning
 */
export class AddressClusteringService {
  // Philadelphia metro area neighborhoods with approximate centers
  private readonly PHILADELPHIA_NEIGHBORHOODS = {
    'Center City': { lat: 39.9526, lng: -75.1652, radius: 2 },
    'South Philly': { lat: 39.9259, lng: -75.1580, radius: 3 },
    'Fishtown': { lat: 39.9742, lng: -75.1352, radius: 2.5 },
    'Kensington': { lat: 39.9923, lng: -75.1237, radius: 2 },
    'West Philly': { lat: 39.9612, lng: -75.2058, radius: 3.5 },
    'North Philly': { lat: 40.0094, lng: -75.1394, radius: 3 },
    'Manayunk': { lat: 40.0248, lng: -75.2238, radius: 2 },
    'Delaware County': { lat: 39.8784, lng: -75.3282, radius: 5 },
    'Montgomery County': { lat: 40.1379, lng: -75.3901, radius: 5 },
    'Chester County': { lat: 39.9896, lng: -75.7346, radius: 6 }
  };

  /**
   * Geocode address to approximate coordinates
   * In production, this would use Google Geocoding API
   */
  private geocodeAddress(address: string): [number, number] {
    // Simple hash-based coordinate generation for demo
    // This creates consistent coordinates for the same address
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Philadelphia area bounds: 39.8-40.2 lat, -75.8 to -74.9 lng
    const lat = 39.8 + (Math.abs(hash % 400) / 1000); // 39.8 to 40.2
    const lng = -75.8 + (Math.abs(hash % 900) / 1000); // -75.8 to -74.9

    return [lat, lng];
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lng1] = coord1;
    const [lat2, lng2] = coord2;
    
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find the best neighborhood match for coordinates
   */
  private findNeighborhood(coordinates: [number, number]): string {
    let bestMatch = 'Other Areas';
    let shortestDistance = Infinity;

    for (const [neighborhood, center] of Object.entries(this.PHILADELPHIA_NEIGHBORHOODS)) {
      const distance = this.calculateDistance(coordinates, [center.lat, center.lng]);
      
      if (distance <= center.radius && distance < shortestDistance) {
        shortestDistance = distance;
        bestMatch = neighborhood;
      }
    }

    return bestMatch;
  }

  /**
   * Create customer address objects from user data
   */
  private createCustomerAddresses(customers: User[]): CustomerAddress[] {
    return customers
      .filter(customer => customer.address && customer.address.trim() !== '')
      .map(customer => {
        const coordinates = this.geocodeAddress(customer.address!);
        
        return {
          customerId: customer.id,
          username: customer.username,
          email: customer.email,
          address: customer.address!,
          coordinates,
          subscriptionType: 'active', // In real app, check subscription status
          bagCount: Math.floor(Math.random() * 4) + 2, // 2-5 bags typical
          lastPickup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last week
        };
      });
  }

  /**
   * Group customer addresses into neighborhood clusters
   */
  async clusterCustomerAddresses(customers: User[]): Promise<AddressCluster[]> {
    const customerAddresses = this.createCustomerAddresses(customers);
    
    if (customerAddresses.length === 0) {
      return [];
    }

    // Group by neighborhood
    const neighborhoodGroups: { [key: string]: CustomerAddress[] } = {};
    
    for (const customerAddress of customerAddresses) {
      const neighborhood = this.findNeighborhood(customerAddress.coordinates);
      
      if (!neighborhoodGroups[neighborhood]) {
        neighborhoodGroups[neighborhood] = [];
      }
      
      neighborhoodGroups[neighborhood].push(customerAddress);
    }

    // Convert to clusters
    const clusters: AddressCluster[] = [];
    
    for (const [neighborhood, addresses] of Object.entries(neighborhoodGroups)) {
      if (addresses.length === 0) continue;

      // Calculate centroid
      const totalLat = addresses.reduce((sum, addr) => sum + addr.coordinates[0], 0);
      const totalLng = addresses.reduce((sum, addr) => sum + addr.coordinates[1], 0);
      const centroid: [number, number] = [
        totalLat / addresses.length,
        totalLng / addresses.length
      ];

      // Calculate estimated revenue (subscription: $5/pickup, one-time varies)
      const estimatedRevenue = addresses.length * 5; // $5 per subscription pickup

      // Check if any pickups were done recently
      const hasRecentPickups = addresses.some(addr => 
        addr.lastPickup && 
        (Date.now() - addr.lastPickup.getTime()) < 3 * 24 * 60 * 60 * 1000 // 3 days
      );

      clusters.push({
        id: neighborhood.toLowerCase().replace(/\s+/g, '_'),
        name: neighborhood,
        addresses: addresses.sort((a, b) => a.address.localeCompare(b.address)),
        centroid,
        totalCustomers: addresses.length,
        estimatedRevenue,
        status: hasRecentPickups ? 'completed' : 'available',
        lastPickupDate: hasRecentPickups ? 
          new Date(Math.max(...addresses.map(a => a.lastPickup?.getTime() || 0))) : 
          undefined
      });
    }

    // Sort by customer count (largest clusters first)
    return clusters.sort((a, b) => b.totalCustomers - a.totalCustomers);
  }

  /**
   * Optimize route order within a cluster
   */
  async optimizeClusterRoute(cluster: AddressCluster): Promise<CustomerAddress[]> {
    if (cluster.addresses.length <= 1) {
      return cluster.addresses;
    }

    // Simple nearest neighbor algorithm for route optimization
    const optimized: CustomerAddress[] = [];
    const remaining = [...cluster.addresses];
    
    // Start with address closest to centroid
    let current = remaining.reduce((closest, addr) => {
      const distToCentroid = this.calculateDistance(addr.coordinates, cluster.centroid);
      const closestDistToCentroid = this.calculateDistance(closest.coordinates, cluster.centroid);
      return distToCentroid < closestDistToCentroid ? addr : closest;
    });
    
    optimized.push(current);
    remaining.splice(remaining.indexOf(current), 1);

    // Add nearest neighbor iteratively
    while (remaining.length > 0) {
      const nearest = remaining.reduce((closest, addr) => {
        const distToCurrent = this.calculateDistance(addr.coordinates, current.coordinates);
        const closestDistToCurrent = this.calculateDistance(closest.coordinates, current.coordinates);
        return distToCurrent < closestDistToCurrent ? addr : closest;
      });
      
      optimized.push(nearest);
      remaining.splice(remaining.indexOf(nearest), 1);
      current = nearest;
    }

    return optimized;
  }

  /**
   * Get cluster statistics for admin dashboard
   */
  getClusterStats(clusters: AddressCluster[]): {
    totalClusters: number;
    totalCustomers: number;
    totalRevenue: number;
    availableClusters: number;
    completedToday: number;
  } {
    return {
      totalClusters: clusters.length,
      totalCustomers: clusters.reduce((sum, c) => sum + c.totalCustomers, 0),
      totalRevenue: clusters.reduce((sum, c) => sum + c.estimatedRevenue, 0),
      availableClusters: clusters.filter(c => c.status === 'available').length,
      completedToday: clusters.filter(c => c.status === 'completed').length
    };
  }
}

export const addressClusteringService = new AddressClusteringService();