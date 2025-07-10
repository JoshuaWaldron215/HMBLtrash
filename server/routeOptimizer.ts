import { storage } from './storage';

// Types for route optimization
export interface Address {
  id?: number;
  name: string;
  fullAddress: string;
  notes?: string;
  coordinates?: [number, number]; // [lat, lng]
}

export interface Cluster {
  id: number;
  day: string;
  addresses: Address[];
  centroid: [number, number];
}

export interface OptimizedRoute {
  clusterId: number;
  day: string;
  startPoint: Address;
  endPoint: Address;
  optimizedStops: Address[];
  totalDistance: string;
  totalDuration: string;
  googleMapsUrl: string;
  directions: DirectionStep[];
}

export interface DirectionStep {
  stepNumber: number;
  instruction: string;
  distance: string;
  duration: string;
  startLocation: [number, number];
  endLocation: [number, number];
}

// Fixed depot location in Philadelphia
const DEPOT_ADDRESS: Address = {
  name: "Acapella Trash Removal Depot",
  fullAddress: "2334 N Broad St, Philadelphia, PA 19132",
  coordinates: [39.9851, -75.1553] // Approximate coordinates
};

// Mock test addresses for development
const MOCK_ADDRESSES: Address[] = [
  { name: "Johnson Residence", fullAddress: "1234 Pine St, Philadelphia, PA 19107", notes: "3 bags, back alley pickup" },
  { name: "Miller House", fullAddress: "5678 Walnut St, Philadelphia, PA 19139", notes: "2 bags, front curb" },
  { name: "Davis Home", fullAddress: "9012 Chestnut St, Philadelphia, PA 19104", notes: "4 bags, side entrance" },
  { name: "Wilson Place", fullAddress: "3456 Market St, Philadelphia, PA 19104", notes: "1 bag, apartment building" },
  { name: "Brown Residence", fullAddress: "7890 Spruce St, Philadelphia, PA 19107", notes: "5 bags, large pickup" },
  { name: "Taylor House", fullAddress: "2468 Arch St, Philadelphia, PA 19103", notes: "2 bags, regular service" },
  { name: "Anderson Home", fullAddress: "1357 Race St, Philadelphia, PA 19107", notes: "3 bags, weekly subscription" },
  { name: "Thomas Place", fullAddress: "8642 Vine St, Philadelphia, PA 19107", notes: "1 bag, small pickup" },
  { name: "Garcia Residence", fullAddress: "9753 Spring Garden St, Philadelphia, PA 19123", notes: "4 bags, back yard" },
  { name: "Martinez House", fullAddress: "1122 Callowhill St, Philadelphia, PA 19123", notes: "2 bags, front door" },
  { name: "Lee Home", fullAddress: "3344 Fairmount Ave, Philadelphia, PA 19130", notes: "3 bags, regular pickup" },
  { name: "Rodriguez Place", fullAddress: "5566 Girard Ave, Philadelphia, PA 19131", notes: "2 bags, weekly service" },
  { name: "Clark Residence", fullAddress: "7788 Cecil B Moore Ave, Philadelphia, PA 19122", notes: "4 bags, large family" },
  { name: "Lewis House", fullAddress: "9900 Temple St, Philadelphia, PA 19140", notes: "1 bag, elderly resident" },
  { name: "Walker Home", fullAddress: "1111 Broad St, Philadelphia, PA 19122", notes: "3 bags, end of block" }
];

/**
 * K-Means clustering implementation for grouping addresses by proximity
 */
class KMeansClusterer {
  private k: number;
  private maxIterations: number;

  constructor(k: number = 3, maxIterations: number = 100) {
    this.k = k;
    this.maxIterations = maxIterations;
  }

  /**
   * Calculate Euclidean distance between two coordinates
   */
  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;
    
    // Haversine formula for geographic distance
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLng = this.degreesToRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Initialize centroids randomly
   */
  private initializeCentroids(addresses: Address[]): [number, number][] {
    const centroids: [number, number][] = [];
    const coordinates = addresses.map(addr => addr.coordinates!);
    
    // Use K-means++ initialization for better results
    centroids.push(coordinates[Math.floor(Math.random() * coordinates.length)]);
    
    for (let i = 1; i < this.k; i++) {
      const distances = coordinates.map(coord => {
        const minDist = Math.min(...centroids.map(centroid => 
          this.calculateDistance(coord, centroid)
        ));
        return minDist * minDist;
      });
      
      const totalDist = distances.reduce((sum, dist) => sum + dist, 0);
      const random = Math.random() * totalDist;
      
      let accumulated = 0;
      for (let j = 0; j < distances.length; j++) {
        accumulated += distances[j];
        if (accumulated >= random) {
          centroids.push(coordinates[j]);
          break;
        }
      }
    }
    
    return centroids;
  }

  /**
   * Assign addresses to nearest centroid
   */
  private assignToClusters(addresses: Address[], centroids: [number, number][]): number[] {
    return addresses.map(address => {
      const distances = centroids.map(centroid => 
        this.calculateDistance(address.coordinates!, centroid)
      );
      return distances.indexOf(Math.min(...distances));
    });
  }

  /**
   * Update centroids based on cluster assignments
   */
  private updateCentroids(addresses: Address[], assignments: number[]): [number, number][] {
    const newCentroids: [number, number][] = [];
    
    for (let i = 0; i < this.k; i++) {
      const clusterAddresses = addresses.filter((_, index) => assignments[index] === i);
      
      if (clusterAddresses.length === 0) {
        // Keep old centroid if no addresses assigned
        newCentroids.push([0, 0]);
        continue;
      }
      
      const avgLat = clusterAddresses.reduce((sum, addr) => sum + addr.coordinates![0], 0) / clusterAddresses.length;
      const avgLng = clusterAddresses.reduce((sum, addr) => sum + addr.coordinates![1], 0) / clusterAddresses.length;
      
      newCentroids.push([avgLat, avgLng]);
    }
    
    return newCentroids;
  }

  /**
   * Main clustering algorithm
   */
  cluster(addresses: Address[]): Cluster[] {
    if (addresses.length === 0) return [];
    
    let centroids = this.initializeCentroids(addresses);
    let assignments = this.assignToClusters(addresses, centroids);
    
    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const newCentroids = this.updateCentroids(addresses, assignments);
      const newAssignments = this.assignToClusters(addresses, newCentroids);
      
      // Check for convergence
      if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
        break;
      }
      
      centroids = newCentroids;
      assignments = newAssignments;
    }
    
    // Create cluster objects
    const clusters: Cluster[] = [];
    const days = ['Pickup Route']; // Single route for all pickups
    
    for (let i = 0; i < this.k; i++) {
      const clusterAddresses = addresses.filter((_, index) => assignments[index] === i);
      clusters.push({
        id: i,
        day: days[i] || `Day ${i + 1}`,
        addresses: clusterAddresses,
        centroid: centroids[i]
      });
    }
    
    return clusters;
  }
}

/**
 * Route optimization using mock Google Directions API
 * In production, this would use actual Google Directions API
 */
class RouteOptimizer {
  /**
   * Generate mock coordinates for an address (geocoding simulation)
   */
  private async geocodeAddress(address: string): Promise<[number, number]> {
    // Mock geocoding - in production use Google Geocoding API
    const hash = this.hashCode(address);
    const lat = 39.9526 + (hash % 100) * 0.001; // Philadelphia area
    const lng = -75.1652 + (hash % 100) * 0.001;
    return [lat, lng];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Mock Google Directions API call with route optimization
   */
  private async optimizeRouteOrder(
    start: Address,
    waypoints: Address[],
    end: Address
  ): Promise<{ optimizedOrder: Address[], directions: DirectionStep[] }> {
    // Mock optimization using nearest neighbor algorithm
    const optimizedOrder: Address[] = [];
    const remaining = [...waypoints];
    let current = start;
    
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = this.calculateMockDistance(current.coordinates!, remaining[0].coordinates!);
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateMockDistance(current.coordinates!, remaining[i].coordinates!);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimizedOrder.push(nearest);
      current = nearest;
    }
    
    // Generate mock directions
    const directions = this.generateMockDirections([start, ...optimizedOrder, end]);
    
    return { optimizedOrder, directions };
  }

  private calculateMockDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lng1] = coord1;
    const [lat2, lng2] = coord2;
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  }

  /**
   * Generate mock driving directions
   */
  private generateMockDirections(route: Address[]): DirectionStep[] {
    const directions: DirectionStep[] = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      const current = route[i];
      const next = route[i + 1];
      
      directions.push({
        stepNumber: i + 1,
        instruction: `Drive from ${current.name} to ${next.name}`,
        distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`,
        duration: `${Math.floor(Math.random() * 15 + 5)} min`,
        startLocation: current.coordinates!,
        endLocation: next.coordinates!
      });
    }
    
    return directions;
  }

  /**
   * Create Google Maps URL for navigation
   */
  private createGoogleMapsUrl(route: Address[]): string {
    const origin = encodeURIComponent(route[0].fullAddress);
    const destination = encodeURIComponent(route[route.length - 1].fullAddress);
    const waypoints = route.slice(1, -1)
      .map(addr => encodeURIComponent(addr.fullAddress))
      .join('|');
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    url += '&travelmode=driving&optimize=true';
    
    return url;
  }

  /**
   * Optimize a cluster into a route
   */
  async optimizeCluster(cluster: Cluster): Promise<OptimizedRoute> {
    // Add coordinates to addresses if missing
    for (const address of cluster.addresses) {
      if (!address.coordinates) {
        address.coordinates = await this.geocodeAddress(address.fullAddress);
      }
    }
    
    // Ensure depot has coordinates
    if (!DEPOT_ADDRESS.coordinates) {
      DEPOT_ADDRESS.coordinates = await this.geocodeAddress(DEPOT_ADDRESS.fullAddress);
    }
    
    const { optimizedOrder, directions } = await this.optimizeRouteOrder(
      DEPOT_ADDRESS,
      cluster.addresses,
      DEPOT_ADDRESS
    );
    
    const fullRoute = [DEPOT_ADDRESS, ...optimizedOrder, DEPOT_ADDRESS];
    const googleMapsUrl = this.createGoogleMapsUrl(fullRoute);
    
    // Calculate totals
    const totalDistance = directions.reduce((sum, step) => {
      return sum + parseFloat(step.distance.replace(' mi', ''));
    }, 0).toFixed(1) + ' mi';
    
    const totalDuration = directions.reduce((sum, step) => {
      return sum + parseInt(step.duration.replace(' min', ''));
    }, 0) + ' min';
    
    return {
      clusterId: cluster.id,
      day: cluster.day,
      startPoint: DEPOT_ADDRESS,
      endPoint: DEPOT_ADDRESS,
      optimizedStops: optimizedOrder,
      totalDistance,
      totalDuration,
      googleMapsUrl,
      directions
    };
  }
}

/**
 * Main route optimization service
 */
export class RouteOptimizationService {
  private clusterer: KMeansClusterer;
  private optimizer: RouteOptimizer;
  private optimizedRoutes: Map<string, OptimizedRoute[]> = new Map();

  constructor() {
    this.clusterer = new KMeansClusterer(1); // Single route for 1 driver
    this.optimizer = new RouteOptimizer();
  }

  /**
   * Process a list of addresses and return optimized single route
   */
  async optimizePickupRoutes(addresses: Address[] = MOCK_ADDRESSES): Promise<OptimizedRoute[]> {
    console.log(`🚀 Starting single-driver route optimization for ${addresses.length} addresses`);
    
    // Step 1: Add coordinates to addresses
    for (const address of addresses) {
      if (!address.coordinates) {
        address.coordinates = await this.optimizer['geocodeAddress'](address.fullAddress);
      }
    }
    
    // Step 2: For single driver, create one optimized route without clustering
    console.log('🗺️  Creating single optimized route...');
    
    // Create single cluster with all addresses
    const singleCluster: Cluster = {
      id: 0,
      day: 'Pickup Route',
      addresses: addresses,
      centroid: this.calculateCentroid(addresses)
    };
    
    const optimizedRoute = await this.optimizer.optimizeCluster(singleCluster);
    const optimizedRoutes = [optimizedRoute];
    
    // Step 3: Store routes in memory
    const routeKey = new Date().toISOString().split('T')[0];
    this.optimizedRoutes.set(routeKey, optimizedRoutes);
    
    console.log('✅ Single-driver route optimization complete!');
    console.log(`📍 Route covers ${addresses.length} stops in ${optimizedRoute.totalDistance} (${optimizedRoute.totalDuration})`);
    
    return optimizedRoutes;
  }

  /**
   * Calculate centroid of all addresses
   */
  private calculateCentroid(addresses: Address[]): [number, number] {
    if (addresses.length === 0) return [0, 0];
    
    const totalLat = addresses.reduce((sum, addr) => sum + (addr.coordinates?.[0] || 0), 0);
    const totalLng = addresses.reduce((sum, addr) => sum + (addr.coordinates?.[1] || 0), 0);
    
    return [totalLat / addresses.length, totalLng / addresses.length];
  }

  /**
   * Get optimized routes for a specific date
   */
  getOptimizedRoutes(date?: string): OptimizedRoute[] | null {
    const key = date || new Date().toISOString().split('T')[0];
    return this.optimizedRoutes.get(key) || null;
  }

  /**
   * Get route for a specific day
   */
  getRouteByDay(day: string, date?: string): OptimizedRoute | null {
    const routes = this.getOptimizedRoutes(date);
    return routes?.find(route => route.day.toLowerCase() === day.toLowerCase()) || null;
  }

  /**
   * Get mock addresses for testing
   */
  getMockAddresses(): Address[] {
    return MOCK_ADDRESSES;
  }

  /**
   * Clear stored routes
   */
  clearRoutes(): void {
    this.optimizedRoutes.clear();
  }
}

// Export singleton instance
export const routeOptimizationService = new RouteOptimizationService();