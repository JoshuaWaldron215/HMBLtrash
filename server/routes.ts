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

  app.patch("/api/pickups/:id/complete", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      const pickup = await storage.completePickup(parseInt(req.params.id));
      res.json(pickup);
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
