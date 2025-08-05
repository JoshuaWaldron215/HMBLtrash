import { 
  users, 
  pickups, 
  routes, 
  subscriptions,
  type User, 
  type InsertUser, 
  type Pickup, 
  type InsertPickup,
  type Route,
  type InsertRoute,
  type Subscription,
  type InsertSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, userData: Partial<User>): Promise<User>;
  updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateLastLogin(userId: number): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  
  // Pickup operations
  getPickup(id: number): Promise<Pickup | undefined>;
  getPickupsByCustomer(customerId: number): Promise<Pickup[]>;
  getPickupsByDriver(driverId: number): Promise<Pickup[]>;
  getPickupsByStatus(status: string): Promise<Pickup[]>;
  getPickupsByDate(date: string): Promise<Pickup[]>;
  createPickup(pickup: InsertPickup): Promise<Pickup>;
  updatePickupStatus(id: number, status: string, driverId?: number): Promise<Pickup>;
  assignPickupToDriver(pickupId: number, driverId: number): Promise<Pickup>;
  completePickup(id: number): Promise<Pickup>;
  updatePickup(id: number, updates: Partial<Pickup>): Promise<Pickup>;
  
  // Route operations
  getRoute(id: number): Promise<Route | undefined>;
  getRoutesByDriver(driverId: number): Promise<Route[]>;
  getRoutesByDate(date: string): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRouteStatus(id: number, status: string): Promise<Route>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByCustomer(customerId: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionStatus(id: number, status: string): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription>;
  getActiveSubscriptions(): Promise<Subscription[]>;
  
  // Additional methods for admin dashboard
  getAllUsers(): Promise<User[]>;
  getAllPickups(): Promise<Pickup[]>;
  getAllRoutes(): Promise<Route[]>;
  getAllSubscriptions(): Promise<Subscription[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pickups: Map<number, Pickup>;
  private routes: Map<number, Route>;
  private subscriptions: Map<number, Subscription>;
  private userIdCounter: number;
  private pickupIdCounter: number;
  private routeIdCounter: number;
  private subscriptionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.pickups = new Map();
    this.routes = new Map();
    this.subscriptions = new Map();
    this.userIdCounter = 1;
    this.pickupIdCounter = 1;
    this.routeIdCounter = 1;
    this.subscriptionIdCounter = 1;
    this.createTestUsers();
  }

  private createTestUsers() {
    // Create test users
    const adminUser: User = {
      id: this.userIdCounter++,
      username: 'admin',
      email: 'admin@test.com',
      password: '$2a$10$hashed',
      passwordHash: null,
      role: 'admin',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      firstName: 'Admin',
      lastName: 'User',
      profileImageUrl: null,
      isActive: true,
      lastLoginAt: null,
      emailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      loginHistory: null,
      createdAt: new Date(),
      updatedAt: null
    };

    const driverUser: User = {
      id: this.userIdCounter++,
      username: 'driver1',
      email: 'driver@test.com',
      password: '$2a$10$hashed',
      passwordHash: null,
      role: 'driver',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      firstName: 'Driver',
      lastName: 'One',
      profileImageUrl: null,
      isActive: true,
      lastLoginAt: null,
      emailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      loginHistory: null,
      createdAt: new Date(),
      updatedAt: null
    };

    const customerUser: User = {
      id: this.userIdCounter++,
      username: 'customer1',
      email: 'customer@test.com',
      password: '$2a$10$hashed',
      passwordHash: null,
      role: 'customer',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      firstName: 'Customer',
      lastName: 'One',
      profileImageUrl: null,
      isActive: true,
      lastLoginAt: null,
      emailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      loginHistory: null,
      createdAt: new Date(),
      updatedAt: null
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(driverUser.id, driverUser);
    this.users.set(customerUser.id, customerUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      id: this.userIdCounter++, 
      createdAt: new Date(),
      updatedAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      lastLoginAt: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      loginHistory: null
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    const updatedUser: User = { 
      ...user, 
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, stripeCustomerId, stripeSubscriptionId: stripeSubscriptionId || null };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, role };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateLastLogin(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, lastLoginAt: new Date(), updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getPickup(id: number): Promise<Pickup | undefined> {
    return this.pickups.get(id);
  }

  async getPickupsByCustomer(customerId: number): Promise<Pickup[]> {
    return Array.from(this.pickups.values()).filter(pickup => pickup.customerId === customerId);
  }

  async getPickupsByDriver(driverId: number): Promise<Pickup[]> {
    return Array.from(this.pickups.values()).filter(pickup => pickup.driverId === driverId);
  }

  async getPickupsByStatus(status: string): Promise<Pickup[]> {
    return Array.from(this.pickups.values()).filter(pickup => pickup.status === status);
  }

  async getPickupsByDate(date: string): Promise<Pickup[]> {
    const targetDate = new Date(date);
    return Array.from(this.pickups.values()).filter(pickup => {
      if (!pickup.scheduledDate) return false;
      const pickupDate = new Date(pickup.scheduledDate);
      return pickupDate.toDateString() === targetDate.toDateString();
    });
  }

  async createPickup(insertPickup: InsertPickup): Promise<Pickup> {
    const pickup: Pickup = { 
      ...insertPickup, 
      id: this.pickupIdCounter++, 
      createdAt: new Date(),
      updatedAt: null,
      completedAt: null,
      actualDuration: null,
      customerRating: null,
      driverNotes: null,
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      cancellationReason: null,
      estimatedDuration: null,
      driverId: insertPickup.driverId || null
    };
    this.pickups.set(pickup.id, pickup);
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number): Promise<Pickup> {
    const pickup = this.pickups.get(id);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { ...pickup, status, ...(driverId && { driverId }) };
    this.pickups.set(id, updatedPickup);
    return updatedPickup;
  }

  async assignPickupToDriver(pickupId: number, driverId: number): Promise<Pickup> {
    const pickup = this.pickups.get(pickupId);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { ...pickup, driverId, status: 'assigned' };
    this.pickups.set(pickupId, updatedPickup);
    return updatedPickup;
  }

  async completePickup(id: number): Promise<Pickup> {
    const pickup = this.pickups.get(id);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { ...pickup, status: 'completed' };
    this.pickups.set(id, updatedPickup);
    return updatedPickup;
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getRoutesByDriver(driverId: number): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(route => route.driverId === driverId);
  }

  async getRoutesByDate(date: string): Promise<Route[]> {
    const targetDate = new Date(date);
    return Array.from(this.routes.values()).filter(route => {
      const routeDate = new Date(route.createdAt);
      return routeDate.toDateString() === targetDate.toDateString();
    });
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const route: Route = { 
      ...insertRoute, 
      id: this.routeIdCounter++, 
      createdAt: new Date(),
      updatedAt: null
    };
    this.routes.set(route.id, route);
    return route;
  }

  async updateRouteStatus(id: number, status: string): Promise<Route> {
    const route = this.routes.get(id);
    if (!route) throw new Error('Route not found');
    
    const updatedRoute = { ...route, status };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionByCustomer(customerId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(sub => sub.customerId === customerId);
  }

  async getSubscriptionByStripeId(stripeId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(sub => sub.stripeSubscriptionId === stripeId);
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      createdAt: new Date(),
      updatedAt: null,
      nextPickupDate: insertSubscription.nextPickupDate || null,
      cancellationDate: null
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updatedSubscription = { ...subscription, status };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) throw new Error('Subscription not found');
    
    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.status === 'active');
  }

  // Additional methods for admin dashboard
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllPickups(): Promise<Pickup[]> {
    return Array.from(this.pickups.values());
  }

  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  async updatePickup(id: number, updates: Partial<Pickup>): Promise<Pickup> {
    const pickup = this.pickups.get(id);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { ...pickup, ...updates };
    this.pickups.set(id, updatedPickup);
    return updatedPickup;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.stripeCustomerId === stripeCustomerId);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) return;

      const hashedPassword = await bcrypt.hash('password123', 12); // Increased security
      const testUsers = [
        { 
          username: 'admin', 
          email: 'admin@test.com', 
          password: hashedPassword, 
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          emailVerified: true,
          failedLoginAttempts: 0,
          twoFactorEnabled: false,
          loginHistory: []
        },
        { 
          username: 'driver1', 
          email: 'driver@test.com', 
          password: hashedPassword, 
          role: 'driver',
          firstName: 'Driver',
          lastName: 'One',
          isActive: true,
          emailVerified: true,
          failedLoginAttempts: 0,
          twoFactorEnabled: false,
          loginHistory: []
        },
        { 
          username: 'customer1', 
          email: 'customer@test.com', 
          password: hashedPassword, 
          role: 'customer',
          firstName: 'Customer',
          lastName: 'One',
          isActive: true,
          emailVerified: true,
          failedLoginAttempts: 0,
          twoFactorEnabled: false,
          loginHistory: []
        }
      ];
      await db.insert(users).values(testUsers);
    } catch (error) {
      console.log('Test data setup complete or already exists');
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || undefined;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, stripeSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Pickup operations
  async getPickup(id: number): Promise<Pickup | undefined> {
    const [pickup] = await db.select().from(pickups).where(eq(pickups.id, id));
    return pickup || undefined;
  }

  async getPickupsByCustomer(customerId: number): Promise<Pickup[]> {
    return await db.select().from(pickups).where(eq(pickups.customerId, customerId));
  }

  async getPickupsByDriver(driverId: number): Promise<any[]> {
    // Get pickups first
    const driverPickups = await db.select().from(pickups).where(eq(pickups.driverId, driverId));
    
    // Get customer data for each pickup
    const pickupsWithCustomers = [];
    for (const pickup of driverPickups) {
      const customer = await this.getUser(pickup.customerId);
      pickupsWithCustomers.push({
        ...pickup,
        customerFirstName: customer?.firstName || null,
        customerLastName: customer?.lastName || null,
        customerEmail: customer?.email || null,
        customerPhone: customer?.phone || null,
        customerName: customer?.username || null
      });
    }
    
    return pickupsWithCustomers;
  }

  async getPickupsByStatus(status: string): Promise<Pickup[]> {
    return await db.select().from(pickups).where(eq(pickups.status, status));
  }

  async getPickupsByDate(date: string): Promise<Pickup[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    return await db.select().from(pickups).where(
      and(
        gte(pickups.scheduledDate, startDate),
        lt(pickups.scheduledDate, endDate)
      )
    );
  }

  async createPickup(insertPickup: InsertPickup): Promise<Pickup> {
    const [pickup] = await db.insert(pickups).values(insertPickup).returning();
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number): Promise<Pickup> {
    const [pickup] = await db
      .update(pickups)
      .set({ status, ...(driverId && { driverId }) })
      .where(eq(pickups.id, id))
      .returning();
    return pickup;
  }

  async assignPickupToDriver(pickupId: number, driverId: number): Promise<Pickup> {
    const [pickup] = await db
      .update(pickups)
      .set({ driverId, status: 'assigned' })
      .where(eq(pickups.id, pickupId))
      .returning();
    return pickup;
  }

  async completePickup(id: number): Promise<Pickup> {
    const [pickup] = await db
      .update(pickups)
      .set({ status: 'completed' })
      .where(eq(pickups.id, id))
      .returning();
    return pickup;
  }

  async updatePickup(id: number, updates: Partial<Pickup>): Promise<Pickup> {
    const [pickup] = await db
      .update(pickups)
      .set(updates)
      .where(eq(pickups.id, id))
      .returning();
    return pickup;
  }

  // Route operations
  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async getRoutesByDriver(driverId: number): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.driverId, driverId));
  }

  async getRoutesByDate(date: string): Promise<Route[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    return await db.select().from(routes).where(
      and(
        gte(routes.createdAt, startDate),
        lt(routes.createdAt, endDate)
      )
    );
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db.insert(routes).values(insertRoute).returning();
    return route;
  }

  async updateRouteStatus(id: number, status: string): Promise<Route> {
    const [route] = await db
      .update(routes)
      .set({ status })
      .where(eq(routes.id, id))
      .returning();
    return route;
  }

  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription || undefined;
  }

  async getSubscriptionByCustomer(customerId: number): Promise<Subscription | undefined> {
    // Get the most recent active subscription first, or most recent if no active subscription
    const allSubscriptions = await db.select().from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .orderBy(desc(subscriptions.createdAt));
    
    // First try to find an active subscription
    const activeSubscription = allSubscriptions.find(sub => sub.status === 'active');
    if (activeSubscription) {
      return activeSubscription;
    }
    
    // If no active subscription, return the most recent one
    return allSubscriptions[0] || undefined;
  }

  async getSubscriptionByStripeId(stripeId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeId));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(insertSubscription).returning();
    return subscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async updateLastLogin(userId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Additional methods for admin dashboard
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllPickups(): Promise<Pickup[]> {
    return await db.select().from(pickups);
  }

  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }



  async cancelSubscription(id: number): Promise<void> {
    // Update subscription status to cancelled
    await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, id));
    
    // Get subscription details to find related pickups
    const subscription = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    if (subscription.length > 0) {
      // Cancel all pending subscription pickups for this customer
      await db.update(pickups)
        .set({ status: 'cancelled' })
        .where(
          and(
            eq(pickups.customerId, subscription[0].customerId),
            eq(pickups.serviceType, 'subscription'),
            eq(pickups.status, 'pending')
          )
        );
    }
  }

  async cancelPickup(id: number): Promise<void> {
    await db.update(pickups).set({ status: 'cancelled' }).where(eq(pickups.id, id));
  }
}

export const storage = new DatabaseStorage();