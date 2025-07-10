import { storage } from './storage';
import { routeOptimizationService, type Address } from './routeOptimizer';
import type { Pickup, Route } from '@shared/schema';

/**
 * Manages the complete pickup request to optimized route workflow
 * Handles both subscription and immediate pickup requests
 */
export class PickupRouteManager {
  
  /**
   * Get all pending pickup requests that need routing
   */
  async getPendingPickups(): Promise<Pickup[]> {
    const pickups = await storage.getPickupsByStatus('pending');
    return pickups.filter(pickup => !pickup.routeId); // Not yet assigned to a route
  }

  /**
   * Get pending pickups by priority for immediate scheduling
   */
  async getPendingPickupsByPriority(): Promise<{
    immediate: Pickup[];
    sameDay: Pickup[];
    nextDay: Pickup[];
    normal: Pickup[];
  }> {
    const pending = await this.getPendingPickups();
    
    return {
      immediate: pending.filter(p => p.priority === 'immediate'),
      sameDay: pending.filter(p => p.priority === 'same-day'),
      nextDay: pending.filter(p => p.priority === 'next-day'),
      normal: pending.filter(p => p.priority === 'normal')
    };
  }

  /**
   * Convert pickup records to addresses for route optimization
   */
  private pickupsToAddresses(pickups: Pickup[]): Address[] {
    return pickups.map(pickup => ({
      id: pickup.id,
      name: `Pickup #${pickup.id}`,
      fullAddress: pickup.fullAddress,
      notes: `${pickup.bagCount} bags - ${pickup.specialInstructions || 'Standard pickup'}`,
      coordinates: pickup.coordinates ? JSON.parse(pickup.coordinates) : undefined
    }));
  }

  /**
   * Create optimized route from pending pickups
   */
  async createOptimizedRoute(pickupIds?: number[], driverId: number = 2): Promise<Route> {
    // Get pickups to route
    let pickupsToRoute: Pickup[];
    
    if (pickupIds) {
      // Route specific pickups
      pickupsToRoute = await Promise.all(
        pickupIds.map(id => storage.getPickup(id))
      ).then(pickups => pickups.filter(p => p !== undefined) as Pickup[]);
    } else {
      // Route all pending pickups
      pickupsToRoute = await this.getPendingPickups();
    }

    if (pickupsToRoute.length === 0) {
      throw new Error('No pickups available for routing');
    }

    // Convert to addresses and optimize
    const addresses = this.pickupsToAddresses(pickupsToRoute);
    const optimizedRoutes = await routeOptimizationService.optimizePickupRoutes(addresses);
    
    if (optimizedRoutes.length === 0) {
      throw new Error('Route optimization failed');
    }

    const optimizedRoute = optimizedRoutes[0]; // Single route for single driver

    // Create route record in database
    const route = await storage.createRoute({
      driverId,
      date: new Date(),
      pickupIds: optimizedRoute.optimizedStops.map(stop => stop.id!.toString()),
      optimizedOrder: optimizedRoute,
      totalDistance: parseFloat(optimizedRoute.totalDistance.replace(' mi', '')),
      estimatedTime: parseInt(optimizedRoute.totalDuration.replace(' min', '')),
      googleMapsUrl: optimizedRoute.googleMapsUrl,
      startLocation: optimizedRoute.startPoint.fullAddress,
      endLocation: optimizedRoute.endPoint.fullAddress,
      routeInstructions: optimizedRoute.directions,
      status: 'pending'
    });

    // Update pickup records with route assignment
    await this.assignPickupsToRoute(pickupsToRoute, route, optimizedRoute);

    return route;
  }

  /**
   * Assign pickups to a route with order and estimated arrival times
   */
  private async assignPickupsToRoute(
    pickups: Pickup[], 
    route: Route, 
    optimizedRoute: any
  ): Promise<void> {
    const baseTime = new Date();
    let cumulativeTime = 0;

    for (let i = 0; i < optimizedRoute.optimizedStops.length; i++) {
      const stop = optimizedRoute.optimizedStops[i];
      const pickup = pickups.find(p => p.id === stop.id);
      
      if (pickup) {
        // Calculate estimated arrival time
        if (i > 0) {
          const prevDirection = optimizedRoute.directions[i - 1];
          cumulativeTime += parseInt(prevDirection.duration.replace(' min', ''));
        }
        
        const estimatedArrival = new Date(baseTime.getTime() + cumulativeTime * 60000);

        // Update pickup with route info
        await storage.updatePickupStatus(pickup.id, 'scheduled', route.driverId);
        
        // Note: This would need a new storage method to update route-specific fields
        // For now, we'll track it in the route's optimizedOrder
      }
    }
  }

  /**
   * Get today's route for a driver
   */
  async getTodaysRoute(driverId: number): Promise<Route | null> {
    const today = new Date().toISOString().split('T')[0];
    const routes = await storage.getRoutesByDate(today);
    return routes.find(route => route.driverId === driverId) || null;
  }

  /**
   * Handle immediate pickup requests (premium service)
   */
  async handleImmediatePickup(pickup: Pickup): Promise<Route> {
    // Check if there's an active route today
    const existingRoute = await this.getTodaysRoute(pickup.driverId || 2);
    
    if (existingRoute && existingRoute.status === 'pending') {
      // Add to existing route and re-optimize
      const currentPickupIds = existingRoute.pickupIds?.map(id => parseInt(id)) || [];
      const updatedPickupIds = [...currentPickupIds, pickup.id];
      
      return await this.createOptimizedRoute(updatedPickupIds, existingRoute.driverId);
    } else {
      // Create new route for immediate pickup
      return await this.createOptimizedRoute([pickup.id], pickup.driverId || 2);
    }
  }

  /**
   * Get route summary for admin dashboard
   */
  async getRouteSummary(): Promise<{
    pendingPickups: number;
    immediateRequests: number;
    todaysRoute?: Route;
    estimatedRevenue: number;
  }> {
    const pending = await this.getPendingPickups();
    const byPriority = await this.getPendingPickupsByPriority();
    const todaysRoute = await this.getTodaysRoute(2); // Default driver ID

    const estimatedRevenue = pending.reduce((sum, pickup) => {
      const amount = parseFloat(pickup.amount || '0');
      return sum + amount;
    }, 0);

    return {
      pendingPickups: pending.length,
      immediateRequests: byPriority.immediate.length,
      todaysRoute: todaysRoute || undefined,
      estimatedRevenue
    };
  }

  /**
   * Calculate pricing for pickup requests
   */
  calculatePickupPricing(serviceType: string, priority: string, bagCount: number): number {
    const basePrices = {
      subscription: 5, // $5 per pickup for monthly subscribers
      immediate: 25,   // Premium for immediate service
      'same-day': 15,  // Same-day premium
      'next-day': 10,  // Slight premium
      'one-time': 8    // Standard one-time rate
    };

    let basePrice = basePrices[serviceType as keyof typeof basePrices] || 8;
    
    // Priority pricing adjustments
    if (priority === 'immediate') basePrice += 10;
    else if (priority === 'same-day') basePrice += 5;
    
    // Bag count pricing
    const bagPrice = Math.max(1, bagCount) * basePrice;
    
    // Weekend/evening premiums could be added here
    
    return Math.round(bagPrice * 100) / 100; // Round to 2 decimal places
  }
}

export const pickupRouteManager = new PickupRouteManager();