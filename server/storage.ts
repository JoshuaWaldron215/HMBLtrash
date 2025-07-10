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
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
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
  getActiveSubscriptions(): Promise<Subscription[]>;
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
    
    // Create test users for different roles
    this.createTestUsers();
  }

  private createTestUsers() {
    // Create test users with pre-hashed passwords (sync)
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    // Test admin user
    const adminUser: User = {
      id: this.userIdCounter++,
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Test driver user
    const driverUser: User = {
      id: this.userIdCounter++,
      username: 'driver',
      email: 'driver@test.com',
      password: hashedPassword,
      role: 'driver',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    this.users.set(driverUser.id, driverUser);

    // Test customer user
    const customerUser: User = {
      id: this.userIdCounter++,
      username: 'customer',
      email: 'customer@test.com',
      password: hashedPassword,
      role: 'customer',
      phone: null,
      address: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    this.users.set(customerUser.id, customerUser);
    
    // Add sample pickups for testing route optimization
    const today = new Date();
    const addresses = [
      "123 Main St, Springfield, IL 62701",
      "456 Oak Ave, Springfield, IL 62702", 
      "789 Pine Rd, Springfield, IL 62703",
      "321 Elm St, Springfield, IL 62704",
      "654 Maple Dr, Springfield, IL 62705",
      "987 Cedar Ln, Springfield, IL 62706"
    ];
    
    addresses.forEach((address, index) => {
      this.createPickup({
        customerId: customerUser.id,
        address: address,
        bagCount: Math.floor(Math.random() * 5) + 1, // 1-5 bags
        amount: "30.00",
        serviceType: index % 2 === 0 ? "subscription" : "one-time",
        status: "assigned",
        scheduledDate: new Date(today.getTime() + (index * 60 * 60 * 1000)), // Spread throughout day
        specialInstructions: index === 0 ? "Gate code: 1234" : index === 1 ? "Bins on side of house" : undefined
      });
    });
    
    // Assign all pickups to the driver after creation
    Array.from(this.pickups.values()).forEach(pickup => {
      if (pickup.status === "assigned") {
        pickup.driverId = driverUser.id;
      }
    });
  }

  // User operations
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
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      address: insertUser.address || null,
      phone: insertUser.phone || null,
      role: insertUser.role || "customer"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId, 
      stripeSubscriptionId: stripeSubscriptionId || user.stripeSubscriptionId 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      role,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Pickup operations
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
    return Array.from(this.pickups.values()).filter(pickup => 
      pickup.scheduledDate && pickup.scheduledDate.toISOString().split('T')[0] === date
    );
  }

  async createPickup(insertPickup: InsertPickup): Promise<Pickup> {
    const id = this.pickupIdCounter++;
    const pickup: Pickup = { 
      ...insertPickup, 
      id,
      driverId: null,
      completedAt: null,
      createdAt: new Date(),
      status: insertPickup.status || "pending",
      scheduledDate: insertPickup.scheduledDate || null,
      specialInstructions: insertPickup.specialInstructions || null
    };
    this.pickups.set(id, pickup);
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number): Promise<Pickup> {
    const pickup = this.pickups.get(id);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { 
      ...pickup, 
      status, 
      driverId: driverId || pickup.driverId 
    };
    this.pickups.set(id, updatedPickup);
    return updatedPickup;
  }

  async assignPickupToDriver(pickupId: number, driverId: number): Promise<Pickup> {
    return this.updatePickupStatus(pickupId, 'assigned', driverId);
  }

  async completePickup(id: number): Promise<Pickup> {
    const pickup = this.pickups.get(id);
    if (!pickup) throw new Error('Pickup not found');
    
    const updatedPickup = { 
      ...pickup, 
      status: 'completed', 
      completedAt: new Date() 
    };
    this.pickups.set(id, updatedPickup);
    return updatedPickup;
  }

  // Route operations
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getRoutesByDriver(driverId: number): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(route => route.driverId === driverId);
  }

  async getRoutesByDate(date: string): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(route => 
      route.date.toISOString().split('T')[0] === date
    );
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.routeIdCounter++;
    const route: Route = { 
      ...insertRoute, 
      id,
      createdAt: new Date(),
      status: insertRoute.status || "pending",
      pickupIds: insertRoute.pickupIds || null,
      totalDistance: insertRoute.totalDistance || null,
      estimatedTime: insertRoute.estimatedTime || null
    };
    this.routes.set(id, route);
    return route;
  }

  async updateRouteStatus(id: number, status: string): Promise<Route> {
    const route = this.routes.get(id);
    if (!route) throw new Error('Route not found');
    
    const updatedRoute = { ...route, status };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  // Subscription operations
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
      nextPickupDate: insertSubscription.nextPickupDate || null
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

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.status === 'active');
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with test data
    this.initializeTestData();
  }

  private async initializeTestData() {
    try {
      // Check if users already exist to avoid duplicates
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        return; // Data already exists
      }

      // Create test users with pre-hashed passwords
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUsers = [
        {
          username: 'admin',
          email: 'admin@test.com',
          password: hashedPassword,
          role: 'admin',
          phone: '(555) 123-4567',
          address: '123 Admin St, City, State 12345'
        },
        {
          username: 'driver1',
          email: 'driver@test.com', 
          password: hashedPassword,
          role: 'driver',
          phone: '(555) 234-5678',
          address: '456 Driver Ave, City, State 12345'
        },
        {
          username: 'customer1',
          email: 'customer@test.com',
          password: hashedPassword,
          role: 'customer',
          phone: '(555) 345-6789',
          address: '789 Customer Blvd, City, State 12345'
        }
      ];

      await db.insert(users).values(testUsers);
      console.log('✓ Test users created successfully');
      
      // Create sample pickups for testing
      const samplePickups = [
        {
          customerId: 3, // customer1
          address: '789 Customer Blvd, City, State 12345',
          bagCount: 3,
          amount: '30.00',
          serviceType: 'one-time',
          status: 'pending',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          specialInstructions: 'Bags by garage door'
        },
        {
          customerId: 3,
          address: '101 Oak Street, City, State 12345',
          bagCount: 5,
          amount: '50.00',
          serviceType: 'one-time',
          status: 'assigned',
          driverId: 2, // driver1
          scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          specialInstructions: 'Heavy bags - yard waste'
        },
        {
          customerId: 3,
          address: '202 Pine Avenue, City, State 12345',
          bagCount: 2,
          amount: '25.00',
          serviceType: 'subscription',
          status: 'pending',
          scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
          specialInstructions: 'Ring doorbell when complete'
        }
      ];

      await db.insert(pickups).values(samplePickups);
      console.log('✓ Sample pickups created successfully');
      
    } catch (error) {
      console.log('Note: Test data may already exist or database not ready yet');
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId: stripeSubscriptionId || null 
      })
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

  async getPickupsByDriver(driverId: number): Promise<Pickup[]> {
    return await db.select().from(pickups).where(eq(pickups.driverId, driverId));
  }

  async getPickupsByStatus(status: string): Promise<Pickup[]> {
    return await db.select().from(pickups).where(eq(pickups.status, status));
  }

  async getPickupsByDate(date: string): Promise<Pickup[]> {
    // Convert date string to timestamp range for the day
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    return await db.select().from(pickups).where(
      and(
        eq(pickups.scheduledDate, startDate),
        // Add more complex date filtering if needed
      )
    );
  }

  async createPickup(insertPickup: InsertPickup): Promise<Pickup> {
    const [pickup] = await db
      .insert(pickups)
      .values(insertPickup)
      .returning();
    return pickup;
  }

  async updatePickupStatus(id: number, status: string, driverId?: number): Promise<Pickup> {
    const updateData: any = { status };
    if (driverId !== undefined) {
      updateData.driverId = driverId;
    }
    
    const [pickup] = await db
      .update(pickups)
      .set(updateData)
      .where(eq(pickups.id, id))
      .returning();
    return pickup;
  }

  async assignPickupToDriver(pickupId: number, driverId: number): Promise<Pickup> {
    return this.updatePickupStatus(pickupId, 'assigned', driverId);
  }

  async completePickup(id: number): Promise<Pickup> {
    const [pickup] = await db
      .update(pickups)
      .set({ 
        status: 'completed', 
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(pickups.id, id))
      .returning();
    
    if (!pickup) {
      throw new Error('Pickup not found or could not be updated');
    }
    
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
    const targetDate = new Date(date);
    return await db.select().from(routes).where(eq(routes.date, targetDate));
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
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
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.customerId, customerId));
    return subscription || undefined;
  }

  async getSubscriptionByStripeId(stripeId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeId));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.status, 'active'));
  }
}

export const storage = new DatabaseStorage();
