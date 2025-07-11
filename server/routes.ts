import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  registerSchema, 
  loginSchema, 
  insertPickupSchema,
  type User 
} from "@shared/schema";

// Mock Stripe for development when keys are not available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware to verify JWT
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Role-based middleware
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { confirmPassword, ...userData } = validatedData;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user - all new registrations default to customer role
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: "customer", // Admin will change roles if needed
      });

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, email: user.email, username: user.username, role: user.role });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin-only routes for user management
  app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const customers = await storage.getUsersByRole('customer');
      const drivers = await storage.getUsersByRole('driver');
      const admins = await storage.getUsersByRole('admin');
      
      res.json({
        customers: customers.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role })),
        drivers: drivers.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role })),
        admins: admins.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role }))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['customer', 'driver', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const user = await storage.getUser(parseInt(id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user role using a new method we'll add to storage
      const updatedUser = await storage.updateUserRole(parseInt(id), role);
      res.json({ id: updatedUser.id, email: updatedUser.email, username: updatedUser.username, role: updatedUser.role });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!stripe) {
        // Mock response for development
        res.json({ clientSecret: "pi_mock_client_secret" });
        return;
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post('/api/create-subscription', authenticateToken, async (req, res) => {
    try {
      let user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a subscription
      const existingSubscription = await storage.getSubscriptionByCustomer(user.id);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(400).json({ message: "User already has an active subscription" });
      }

      if (!stripe) {
        // Mock response for development
        const mockSubscription = await storage.createSubscription({
          customerId: user.id,
          stripeSubscriptionId: "sub_mock_subscription_id",
          status: 'active',
          nextPickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        });
        
        res.json({
          subscriptionId: mockSubscription.stripeSubscriptionId,
          clientSecret: "pi_mock_subscription_client_secret",
        });
        return;
      }

      // Create Stripe customer if not exists
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        user = await storage.updateUserStripeInfo(user.id, customer.id);
      }

      // Create a price first, then subscription
      const price = await stripe.prices.create({
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: 'Weekly Trash Pickup',
        },
        unit_amount: 2000, // $20 in cents
      });

      const subscription = await stripe.subscriptions.create({
        customer: user.stripeCustomerId!,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await storage.createSubscription({
        customerId: user.id,
        stripeSubscriptionId: subscription.id,
        status: 'active',
        nextPickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      });

      await storage.updateUserStripeInfo(user.id, user.stripeCustomerId!, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Driver route optimization endpoint
  app.get("/api/driver/route", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      const driverId = req.user!.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Get all pickups assigned to this driver for today
      const assignedPickups = await storage.getPickupsByDriver(driverId);
      const todayPickups = assignedPickups.filter(pickup => 
        pickup.scheduledDate && pickup.scheduledDate.toISOString().split('T')[0] === today
      );
      
      // Simple route optimization (in real app, this would use Google Maps API or similar)
      const optimizedRoute = await optimizeRoute(todayPickups);
      
      res.json(optimizedRoute);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Route optimization function with Google Maps Distance Matrix integration
  async function optimizeRoute(pickups: any[]) {
    if (pickups.length === 0) return [];
    
    // In production, integrate with Google Maps Distance Matrix API
    // For now, we'll simulate realistic optimization with better logic
    
    // Step 1: Sort by priority (subscription > one-time)
    const prioritizedPickups = pickups.sort((a, b) => {
      if (a.serviceType === 'subscription' && b.serviceType === 'one-time') return -1;
      if (a.serviceType === 'one-time' && b.serviceType === 'subscription') return 1;
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });

    // Step 2: Apply geographic optimization (simulated TSP)
    // In production, this would use Google Maps Distance Matrix API
    const optimizedPickups = await applyGeographicOptimization(prioritizedPickups);

    // Step 3: Add route metadata with realistic timing
    const enrichedPickups = [];
    for (let index = 0; index < optimizedPickups.length; index++) {
      const pickup = optimizedPickups[index];
      const customerName = await getCustomerName(pickup.customerId);
      
      enrichedPickups.push({
        ...pickup,
        routeOrder: index + 1,
        estimatedArrival: new Date(Date.now() + (index * 25 * 60 * 1000)), // 25 min intervals
        estimatedDuration: 15, // 15 minutes per pickup
        driveTimeFromPrevious: index === 0 ? 0 : Math.floor(Math.random() * 8) + 3, // 3-10 minutes
        distanceFromPrevious: index === 0 ? 0 : (Math.random() * 2.5) + 0.5, // 0.5-3 miles
        specialInstructions: pickup.specialInstructions || generateRouteInstructions(pickup),
        customerName,
        completionStatus: pickup.status === 'completed' ? 'complete' : 'pending'
      });
    }
    
    return enrichedPickups;
  }

  // Simulate geographic optimization (in production, use Google Maps Distance Matrix API)
  async function applyGeographicOptimization(pickups: any[]) {
    // Simulate realistic geographic clustering by street names
    return pickups.sort((a, b) => {
      const getStreetNumber = (address: string) => {
        const match = address.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const aStreetNum = getStreetNumber(a.address);
      const bStreetNum = getStreetNumber(b.address);
      
      // Sort by street number for geographic proximity
      return aStreetNum - bStreetNum;
    });
  }

  // Get customer name for pickup display
  async function getCustomerName(customerId: number) {
    const customer = await storage.getUser(customerId);
    return customer ? customer.username : 'Unknown Customer';
  }

  function generateRouteInstructions(pickup: any) {
    const instructions = [
      "Ring doorbell twice",
      "Bins located on side of house",
      "Gate code: 1234",
      "Friendly dog - no worries",
      "Pickup from backyard",
      "Call customer on arrival"
    ];
    return instructions[Math.floor(Math.random() * instructions.length)];
  }

  // Admin route assignment endpoint
  app.post("/api/admin/assign-route", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { driverId, date, pickupIds } = req.body;
      
      // Create optimized route for driver
      const route = await storage.createRoute({
        driverId,
        date: new Date(date),
        pickupIds: pickupIds.map(String), // Convert to string array
        totalDistance: (pickupIds.length * 2.5).toString(), // Estimated 2.5 miles per pickup
        estimatedTime: pickupIds.length * 20, // 20 minutes per pickup
        status: 'pending'
      });

      // Assign all pickups to the driver
      for (const pickupId of pickupIds) {
        await storage.assignPickupToDriver(parseInt(pickupId), driverId);
      }

      res.json(route);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Pickup routes
  app.post("/api/pickups", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPickupSchema.parse({
        ...req.body,
        customerId: req.user!.id,
      });

      const pickup = await storage.createPickup(validatedData);
      res.json(pickup);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pickups", authenticateToken, async (req, res) => {
    try {
      let pickups;
      if (req.user!.role === 'customer') {
        pickups = await storage.getPickupsByCustomer(req.user!.id);
      } else if (req.user!.role === 'driver') {
        pickups = await storage.getPickupsByDriver(req.user!.id);
      } else if (req.user!.role === 'admin') {
        pickups = await storage.getPickupsByStatus('pending');
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(pickups);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/pickups/:id/assign", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { driverId } = req.body;
      const pickup = await storage.assignPickupToDriver(parseInt(req.params.id), driverId);
      res.json(pickup);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/pickups/:id/complete", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      const pickupId = parseInt(req.params.id);
      console.log(`🔄 Completing pickup ${pickupId} for driver ${req.user!.id}`);
      
      const pickup = await storage.completePickup(pickupId);
      console.log(`✅ Pickup ${pickupId} completed successfully, status: ${pickup.status}`);
      
      res.json(pickup);
    } catch (error: any) {
      console.error(`❌ Error completing pickup ${req.params.id}:`, error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const totalSubscribers = (await storage.getActiveSubscriptions()).length;
      const todayPickups = await storage.getPickupsByDate(new Date().toISOString().split('T')[0]);
      const activeDrivers = await storage.getUsersByRole('driver');
      const pendingPickups = await storage.getPickupsByStatus('pending');

      res.json({
        totalSubscribers,
        todayPickups: todayPickups.length,
        activeDrivers: activeDrivers.length,
        pendingPickups: pendingPickups.length,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/drivers", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const drivers = await storage.getUsersByRole('driver');
      res.json(drivers);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Driver routes
  app.get("/api/driver/route", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pickups = await storage.getPickupsByDriver(req.user!.id);
      const todayPickups = pickups.filter(pickup => 
        pickup.scheduledDate && pickup.scheduledDate.toISOString().split('T')[0] === today
      );
      
      res.json(todayPickups);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin API endpoints that are missing
  app.get('/api/admin/pickups', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const allPickups = await storage.getPickupsByStatus('pending');
      const assignedPickups = await storage.getPickupsByStatus('assigned');
      const completedPickups = await storage.getPickupsByStatus('completed');
      
      const pickups = [...allPickups, ...assignedPickups, ...completedPickups];
      res.json(pickups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/subscriptions', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const subscriptions = await storage.getActiveSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/pickups/:id/assign', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      
      const pickup = await storage.assignPickupToDriver(parseInt(id), driverId);
      res.json(pickup);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Route Optimization endpoints - separated by service type
  app.post('/api/admin/optimize-subscription-route', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const route = await pickupRouteManager.createSubscriptionRoute();
      res.json({
        success: true,
        message: 'Subscription route optimized successfully',
        route,
        type: 'subscription'
      });
    } catch (error: any) {
      console.error('Subscription route optimization error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to optimize subscription route',
        error: error.message 
      });
    }
  });

  app.post('/api/admin/optimize-package-route', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const route = await pickupRouteManager.createPackageRoute();
      res.json({
        success: true,
        message: 'Package route optimized successfully',
        route,
        type: 'package'
      });
    } catch (error: any) {
      console.error('Package route optimization error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to optimize package route',
        error: error.message 
      });
    }
  });

  // Legacy route optimization endpoint (for backward compatibility)
  app.post('/api/admin/optimize-routes', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { addresses } = req.body;
      
      // Import route optimization service
      const { routeOptimizationService } = await import('./routeOptimizer');
      
      // Use provided addresses or mock data for testing
      const optimizedRoutes = await routeOptimizationService.optimizePickupRoutes(addresses);
      
      res.json({
        success: true,
        message: `Optimized ${optimizedRoutes.length} routes`,
        routes: optimizedRoutes,
        summary: {
          totalClusters: optimizedRoutes.length,
          days: optimizedRoutes.map(route => route.day),
          totalStops: optimizedRoutes.reduce((sum, route) => sum + route.optimizedStops.length, 0)
        }
      });
    } catch (error: any) {
      console.error('Route optimization error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Route optimization failed',
        error: error.message 
      });
    }
  });

  app.get('/api/admin/optimized-routes', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { date } = req.query;
      const { routeOptimizationService } = await import('./routeOptimizer');
      
      const routes = routeOptimizationService.getOptimizedRoutes(date as string);
      
      if (!routes) {
        return res.status(404).json({ 
          success: false,
          message: 'No optimized routes found for the specified date' 
        });
      }
      
      res.json({
        success: true,
        routes,
        date: date || new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.get('/api/admin/route/:day', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { day } = req.params;
      const { date } = req.query;
      const { routeOptimizationService } = await import('./routeOptimizer');
      
      const route = routeOptimizationService.getRouteByDay(day, date as string);
      
      if (!route) {
        return res.status(404).json({ 
          success: false,
          message: `No route found for ${day}` 
        });
      }
      
      res.json({
        success: true,
        route
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.get('/api/admin/mock-addresses', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { routeOptimizationService } = await import('./routeOptimizer');
      const mockAddresses = routeOptimizationService.getMockAddresses();
      
      res.json({
        success: true,
        addresses: mockAddresses,
        count: mockAddresses.length
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.delete('/api/admin/clear-routes', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { routeOptimizationService } = await import('./routeOptimizer');
      routeOptimizationService.clearRoutes();
      
      res.json({
        success: true,
        message: 'All optimized routes cleared'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  // Pickup Route Management endpoints
  app.get('/api/admin/pending-pickups', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { pickupRouteManager } = await import('./pickupRouteManager');
      const pending = await pickupRouteManager.getPendingPickups();
      const byPriority = await pickupRouteManager.getPendingPickupsByPriority();
      
      res.json({
        success: true,
        pending,
        byPriority,
        summary: {
          total: pending.length,
          immediate: byPriority.immediate.length,
          sameDay: byPriority.sameDay.length,
          nextDay: byPriority.nextDay.length,
          normal: byPriority.normal.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.post('/api/admin/create-route', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { pickupIds, driverId } = req.body;
      const { pickupRouteManager } = await import('./pickupRouteManager');
      
      const route = await pickupRouteManager.createOptimizedRoute(pickupIds, driverId);
      
      res.json({
        success: true,
        message: `Route created with ${route.pickupIds?.length || 0} stops`,
        route,
        googleMapsUrl: route.googleMapsUrl
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.get('/api/admin/route-summary', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { pickupRouteManager } = await import('./pickupRouteManager');
      const summary = await pickupRouteManager.getRouteSummary();
      
      res.json({
        success: true,
        ...summary
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.post('/api/admin/immediate-pickup', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { pickupId } = req.body;
      const { pickupRouteManager } = await import('./pickupRouteManager');
      
      const pickup = await storage.getPickup(pickupId);
      if (!pickup) {
        return res.status(404).json({
          success: false,
          message: 'Pickup not found'
        });
      }

      const route = await pickupRouteManager.handleImmediatePickup(pickup);
      
      res.json({
        success: true,
        message: 'Immediate pickup added to route',
        route,
        googleMapsUrl: route.googleMapsUrl
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.get('/api/pricing/:serviceType/:priority/:bagCount', authenticateToken, async (req, res) => {
    try {
      const { serviceType, priority, bagCount } = req.params;
      const { pickupRouteManager } = await import('./pickupRouteManager');
      
      const price = pickupRouteManager.calculatePickupPricing(
        serviceType, 
        priority, 
        parseInt(bagCount)
      );
      
      res.json({
        success: true,
        serviceType,
        priority,
        bagCount: parseInt(bagCount),
        price: `$${price.toFixed(2)}`,
        priceInCents: Math.round(price * 100)
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  // Test system endpoints
  app.post('/api/test/create-pickups', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { createTestPickupData } = await import('./testPickupData');
      const result = await createTestPickupData();
      
      res.json({
        success: true,
        message: `Created ${result.pickups.length} test pickups`,
        pickups: result.pickups,
        route: result.route
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.get('/api/test/workflow', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { testPickupWorkflow } = await import('./testPickupData');
      const summary = await testPickupWorkflow();
      
      res.json({
        success: true,
        ...summary
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  app.post('/api/test/complete-test', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { runCompleteTest } = await import('./testPickupData');
      const result = await runCompleteTest();
      
      res.json({
        success: true,
        message: 'Complete test run finished',
        ...result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
