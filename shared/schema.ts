import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // customer, driver, admin
  phone: text("phone"),
  address: text("address"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Additional user fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pickups = pgTable("pickups", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  driverId: integer("driver_id").references(() => users.id),
  address: text("address").notNull(),
  fullAddress: text("full_address"), // Complete geocodable address
  coordinates: text("coordinates"), // JSON string [lat, lng] from geocoding
  bagCount: integer("bag_count").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  serviceType: text("service_type").notNull(), // subscription, immediate, one-time
  status: text("status").notNull().default("pending"), // pending, scheduled, in-progress, completed, cancelled
  requestedDate: timestamp("requested_date").defaultNow(), // When customer made request
  scheduledDate: timestamp("scheduled_date"), // When pickup is planned
  completedAt: timestamp("completed_at"),
  specialInstructions: text("special_instructions"),
  // Route optimization fields
  routeId: integer("route_id").references(() => routes.id), // Which optimized route this belongs to
  routeOrder: integer("route_order"), // Order in the optimized route (1, 2, 3...)
  estimatedArrival: timestamp("estimated_arrival"), // When driver should arrive
  // Additional pickup fields
  pickupWindow: text("pickup_window"), // morning, afternoon, evening
  priority: text("priority").default("normal"), // immediate, same-day, next-day, normal
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"), // minutes
  customerRating: integer("customer_rating"), // 1-5 stars
  driverNotes: text("driver_notes"),
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  cancellationReason: text("cancellation_reason"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  pickupIds: text("pickup_ids").array(), // Array of pickup IDs in optimized order
  optimizedOrder: jsonb("optimized_order"), // Complete route data from optimization system
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }),
  estimatedTime: integer("estimated_time"), // in minutes
  googleMapsUrl: text("google_maps_url"), // Direct navigation link
  startLocation: text("start_location"), // Depot address
  endLocation: text("end_location"), // Return to depot
  routeInstructions: jsonb("route_instructions"), // Turn-by-turn directions
  status: text("status").notNull().default("pending"), // pending, active, completed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  status: text("status").notNull(), // active, cancelled, past_due
  nextPickupDate: timestamp("next_pickup_date"),
  // Additional subscription fields
  frequency: text("frequency").notNull().default("weekly"), // weekly, biweekly, monthly
  preferredDay: text("preferred_day"), // monday, tuesday, etc.
  preferredTime: text("preferred_time"), // morning, afternoon, evening
  bagCountLimit: integer("bag_count_limit").default(5),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }),
  pausedUntil: timestamp("paused_until"),
  cancellationDate: timestamp("cancellation_date"),
  cancellationReason: text("cancellation_reason"),
  autoRenewal: boolean("auto_renewal").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional business tables
export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Downtown", "Suburbs East", etc.
  zipCodes: text("zip_codes").array(), // Array of zip codes covered
  isActive: boolean("is_active").default(true),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // pickup_reminder, payment_due, driver_assigned, etc.
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // Link for user to take action
  createdAt: timestamp("created_at").defaultNow(),
});

export const driverMetrics = pgTable("driver_metrics", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  totalPickups: integer("total_pickups").default(0),
  completedPickups: integer("completed_pickups").default(0),
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  pickupId: integer("pickup_id").references(() => pickups.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // succeeded, failed, pending, refunded
  paymentMethod: text("payment_method"), // card, bank_account, etc.
  failureReason: text("failure_reason"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  lastLoginAt: true,
});

export const insertPickupSchema = createInsertSchema(pickups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  driverId: true,
  actualDuration: true,
  customerRating: true,
  driverNotes: true,
  beforePhotoUrl: true,
  afterPhotoUrl: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cancellationDate: true,
});

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertDriverMetricsSchema = createInsertSchema(driverMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = insertUserSchema.omit({ role: true }).extend({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Pickup = typeof pickups.$inferSelect;
export type InsertPickup = z.infer<typeof insertPickupSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type DriverMetrics = typeof driverMetrics.$inferSelect;
export type InsertDriverMetrics = z.infer<typeof insertDriverMetricsSchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
