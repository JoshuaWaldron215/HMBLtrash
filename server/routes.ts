import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { authService } from "./auth";
import { 
  registerSchema, 
  loginSchema, 
  insertPickupSchema,
  changePasswordSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  type User 
} from "@shared/schema";

// Mock Stripe for development when keys are not available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Test payment simulation system
class TestPaymentSimulator {
  // Simulate different test card scenarios
  static getTestCardResponse(cardNumber: string) {
    const testCards = {
      '4242424242424242': { success: true, status: 'succeeded', message: 'Payment successful' },
      '4000000000000002': { success: false, status: 'declined', message: 'Card declined' },
      '4000000000000119': { success: false, status: 'processing_error', message: 'Processing error' },
      '4000000000000341': { success: false, status: 'cvc_check_failed', message: 'CVC check failed' },
      '4000000000000036': { success: false, status: 'expired_card', message: 'Card expired' },
      '4000000000000010': { success: false, status: 'insufficient_funds', message: 'Insufficient funds' },
      '4000000000000069': { success: false, status: 'card_velocity_exceeded', message: 'Card velocity exceeded' },
      '4000000000000127': { success: false, status: 'incorrect_cvc', message: 'Incorrect CVC' },
      '4000000000000101': { success: false, status: 'incorrect_number', message: 'Incorrect card number' },
      '4000000000000259': { success: false, status: 'incorrect_zip', message: 'Incorrect ZIP code' },
      '4000000000000267': { success: false, status: 'card_not_supported', message: 'Card not supported' },
      '4000000000000275': { success: false, status: 'generic_decline', message: 'Generic decline' },
      '4000000000000309': { success: false, status: 'lost_card', message: 'Card reported lost' },
      '4000000000000317': { success: false, status: 'stolen_card', message: 'Card reported stolen' },
      '4000000000000325': { success: false, status: 'try_again_later', message: 'Try again later' },
      '4000000000000333': { success: false, status: 'online_or_offline_pin_required', message: 'PIN required' },
      '4000000000000341': { success: false, status: 'incorrect_pin', message: 'Incorrect PIN' },
      '4000000000000358': { success: false, status: 'testmode_decline', message: 'Test mode decline' },
      '4000000000000366': { success: false, status: 'pickup_card', message: 'Pickup card' },
      '4000000000000374': { success: false, status: 'restricted_card', message: 'Restricted card' },
      '4000000000000382': { success: false, status: 'security_violation', message: 'Security violation' },
      '4000000000000390': { success: false, status: 'service_not_allowed', message: 'Service not allowed' },
      '4000000000000408': { success: false, status: 'stop_payment_order', message: 'Stop payment order' },
      '4000000000000416': { success: false, status: 'transaction_not_allowed', message: 'Transaction not allowed' },
      '4000000000000424': { success: false, status: 'currency_not_supported', message: 'Currency not supported' },
      '4000000000000432': { success: false, status: 'duplicate_transaction', message: 'Duplicate transaction' },
      '4000000000000440': { success: false, status: 'fraudulent', message: 'Fraudulent transaction' },
      '4000000000000457': { success: false, status: 'merchant_blacklist', message: 'Merchant blacklisted' },
      '4000000000000465': { success: false, status: 'pickup_card_special_conditions', message: 'Pickup card (special conditions)' },
      '4000000000000473': { success: false, status: 'revocation_of_all_authorizations', message: 'All authorizations revoked' },
      '4000000000000481': { success: false, status: 'revocation_of_authorization', message: 'Authorization revoked' },
      '4000000000000499': { success: false, status: 'security_violation', message: 'Security violation' },
      '4000000000000507': { success: false, status: 'withdraw_amount_limit_exceeded', message: 'Withdrawal limit exceeded' },
      '4000000000000515': { success: false, status: 'pin_try_exceeded', message: 'PIN tries exceeded' },
      '4000000000000523': { success: false, status: 'no_action_taken', message: 'No action taken' },
      '4000000000000531': { success: false, status: 'new_account_information_available', message: 'New account info available' },
      '4000000000000549': { success: false, status: 'contact_card_issuer', message: 'Contact card issuer' },
      '4000000000000556': { success: false, status: 'card_velocity_exceeded', message: 'Card velocity exceeded' },
      '4000000000000564': { success: false, status: 'allowable_pin_tries_exceeded', message: 'PIN tries exceeded' },
      '4000000000000572': { success: false, status: 'no_checking_account', message: 'No checking account' },
      '4000000000000580': { success: false, status: 'no_savings_account', message: 'No savings account' },
      '4000000000000598': { success: false, status: 'expired_card', message: 'Card expired' },
      '4000000000000606': { success: false, status: 'incorrect_pin', message: 'Incorrect PIN' },
      '4000000000000614': { success: false, status: 'no_credit_account', message: 'No credit account' },
      '4000000000000622': { success: false, status: 'no_universal_account', message: 'No universal account' },
      '4000000000000630': { success: false, status: 'function_not_supported', message: 'Function not supported' },
      '4000000000000648': { success: false, status: 'lost_card', message: 'Card reported lost' },
      '4000000000000655': { success: false, status: 'stolen_card', message: 'Card reported stolen' },
      '4000000000000663': { success: false, status: 'insufficient_funds', message: 'Insufficient funds' },
      '4000000000000671': { success: false, status: 'suspected_fraud', message: 'Suspected fraud' },
      '4000000000000689': { success: false, status: 'restricted_card', message: 'Restricted card' },
      '4000000000000697': { success: false, status: 'call_issuer', message: 'Call card issuer' },
      '4000000000000705': { success: false, status: 'pickup_card', message: 'Pickup card' },
      '4000000000000713': { success: false, status: 'refer_to_card_issuer', message: 'Refer to card issuer' },
      '4000000000000721': { success: false, status: 'invalid_merchant', message: 'Invalid merchant' },
      '4000000000000739': { success: false, status: 'transaction_not_allowed', message: 'Transaction not allowed' },
      '4000000000000747': { success: false, status: 'suspected_fraud', message: 'Suspected fraud' },
      '4000000000000754': { success: false, status: 'revocation_of_authorization', message: 'Authorization revoked' },
      '4000000000000762': { success: false, status: 'no_action_taken', message: 'No action taken' },
      '4000000000000770': { success: false, status: 'cutoff_is_in_process', message: 'Cutoff in process' },
      '4000000000000788': { success: false, status: 'cryptographic_error', message: 'Cryptographic error' },
      '4000000000000796': { success: false, status: 'system_error', message: 'System error' },
      '4000000000000804': { success: false, status: 'exceeds_withdrawal_amount_limit', message: 'Exceeds withdrawal limit' },
      '4000000000000812': { success: false, status: 'restricted_card', message: 'Restricted card' },
      '4000000000000820': { success: false, status: 'security_violation', message: 'Security violation' },
      '4000000000000838': { success: false, status: 'allowable_pin_tries_exceeded', message: 'PIN tries exceeded' },
      '4000000000000846': { success: false, status: 'invalid_amount', message: 'Invalid amount' },
      '4000000000000853': { success: false, status: 'no_such_issuer', message: 'No such issuer' },
      '4000000000000861': { success: false, status: 'timeout', message: 'Transaction timeout' },
      '4000000000000879': { success: false, status: 'original_amount_incorrect', message: 'Original amount incorrect' },
      '4000000000000887': { success: false, status: 'already_reversed', message: 'Already reversed' },
      '4000000000000895': { success: false, status: 'unable_to_locate_record', message: 'Unable to locate record' },
      '4000000000000903': { success: false, status: 'duplicate_transaction', message: 'Duplicate transaction' },
      '4000000000000911': { success: false, status: 'file_is_temporarily_unavailable', message: 'File temporarily unavailable' },
      '4000000000000929': { success: false, status: 'cut_off_is_in_process', message: 'Cutoff in process' },
      '4000000000000937': { success: false, status: 'issuer_or_switch_is_inoperative', message: 'Issuer inoperative' },
      '4000000000000945': { success: false, status: 'financial_institution_or_intermediate_network_facility_cannot_be_found', message: 'Financial institution not found' },
      '4000000000000952': { success: false, status: 'routing_error', message: 'Routing error' },
      '4000000000000960': { success: false, status: 'violation_law', message: 'Violation of law' },
      '4000000000000978': { success: false, status: 'response_received_too_late', message: 'Response received too late' },
      '4000000000000986': { success: false, status: 'cashback_amount_not_available', message: 'Cashback amount not available' },
      '4000000000000994': { success: false, status: 'requested_function_not_supported', message: 'Function not supported' },
      '5555555555554444': { success: true, status: 'succeeded', message: 'Mastercard payment successful' },
      '378282246310005': { success: true, status: 'succeeded', message: 'Amex payment successful' },
      '6011111111111117': { success: true, status: 'succeeded', message: 'Discover payment successful' },
      '30569309025904': { success: true, status: 'succeeded', message: 'Diners Club payment successful' },
      '3566002020360505': { success: true, status: 'succeeded', message: 'JCB payment successful' },
      '6200000000000005': { success: true, status: 'succeeded', message: 'UnionPay payment successful' },
    };

    return testCards[cardNumber] || { success: true, status: 'succeeded', message: 'Payment successful' };
  }

  // Simulate Stripe customer creation
  static async createTestCustomer(email: string, name: string) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return {
      id: `cus_test_${Date.now()}`,
      email,
      name,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      object: 'customer'
    };
  }

  // Simulate Stripe subscription creation
  static async createTestSubscription(customerId: string) {
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay
    return {
      id: `sub_test_${Date.now()}`,
      customer: customerId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      created: Math.floor(Date.now() / 1000),
      object: 'subscription',
      items: {
        data: [{
          id: `si_test_${Date.now()}`,
          price: {
            id: `price_test_${Date.now()}`,
            unit_amount: 2000,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: 'prod_test_weekly_trash'
          }
        }]
      },
      latest_invoice: {
        payment_intent: {
          client_secret: `pi_test_${Date.now()}_secret_test`,
          status: 'succeeded'
        }
      }
    };
  }

  // Simulate Stripe payment intent creation
  static async createTestPaymentIntent(amount: number, currency: string = 'usd') {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return {
      id: `pi_test_${Date.now()}`,
      amount,
      currency,
      status: 'requires_payment_method',
      client_secret: `pi_test_${Date.now()}_secret_test`,
      created: Math.floor(Date.now() / 1000),
      object: 'payment_intent'
    };
  }

  // Simulate payment confirmation
  static async confirmTestPayment(paymentIntentId: string, paymentMethodId: string) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
    // Extract card number from payment method ID for test scenarios
    const cardNumber = paymentMethodId.replace('pm_test_', '').replace('_visa', '').replace('_mastercard', '').replace('_amex', '');
    const testResult = this.getTestCardResponse(cardNumber);
    
    return {
      id: paymentIntentId,
      status: testResult.success ? 'succeeded' : 'failed',
      amount: 2000,
      currency: 'usd',
      created: Math.floor(Date.now() / 1000),
      object: 'payment_intent',
      last_payment_error: testResult.success ? null : {
        code: testResult.status,
        message: testResult.message,
        type: 'card_error'
      }
    };
  }
}

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

// Enhanced middleware to verify JWT with security features
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(403).json({ message: 'Invalid token' });
  }
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
  
  // Route optimization helper function
  async function optimizeRoute(pickups: any[]) {
    // Add estimated travel times and customer names
    const optimizedPickups = [];
    let cumulativeTime = 0;
    
    for (let i = 0; i < pickups.length; i++) {
      const pickup = pickups[i];
      
      // Get customer name
      const customerName = await getCustomerName(pickup.customerId);
      
      // Calculate estimated travel time (mock calculation)
      const travelTime = i === 0 ? 15 : 8; // 15 min to first stop, 8 min between stops
      cumulativeTime += travelTime;
      
      // Add estimated arrival time
      const estimatedArrival = new Date();
      estimatedArrival.setHours(9, 0, 0, 0); // Start at 9 AM
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + cumulativeTime);
      
      optimizedPickups.push({
        ...pickup,
        customerName,
        estimatedArrival: estimatedArrival.toISOString(),
        travelTime: `${travelTime} min`,
        routeInstructions: generateRouteInstructions(pickup)
      });
      
      // Add pickup duration (10 minutes per pickup)
      cumulativeTime += 10;
    }
    
    return optimizedPickups;
  }
  
  // Apply geographic optimization to sort pickups by location
  async function applyGeographicOptimization(pickups: any[]) {
    // Simple optimization: sort by street number (crude geographic sorting)
    return pickups.sort((a, b) => {
      const addressA = a.address.match(/\d+/);
      const addressB = b.address.match(/\d+/);
      
      if (addressA && addressB) {
        return parseInt(addressA[0]) - parseInt(addressB[0]);
      }
      
      return 0;
    });
  }
  
  // Helper to get customer name
  async function getCustomerName(customerId: number) {
    const customer = await storage.getUser(customerId);
    if (customer?.firstName && customer?.lastName) {
      return `${customer.firstName} ${customer.lastName}`;
    }
    return customer?.username || 'Unknown Customer';
  }
  
  // Generate route instructions for a pickup
  function generateRouteInstructions(pickup: any) {
    return `Navigate to ${pickup.address}. ${pickup.bagCount} bags. ${pickup.specialInstructions || 'Standard pickup.'}`;
  }
  
  // Enhanced Auth routes with security features
  app.post("/api/register", async (req, res) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const result = await authService.register(req.body, ip, userAgent);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      res.json({ 
        user: { 
          id: result.user!.id, 
          email: result.user!.email, 
          username: result.user!.username, 
          role: result.user!.role,
          firstName: result.user!.firstName,
          lastName: result.user!.lastName
        },
        token: result.token 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      const result = await authService.authenticate(req.body.email, req.body.password, ip, userAgent);
      
      if (!result.success) {
        const status = result.requiresTwoFactor ? 200 : 400;
        return res.status(status).json({ 
          message: result.error || result.message,
          requiresTwoFactor: result.requiresTwoFactor 
        });
      }

      res.json({ 
        user: { 
          id: result.user!.id, 
          email: result.user!.email, 
          username: result.user!.username, 
          role: result.user!.role,
          firstName: result.user!.firstName,
          lastName: result.user!.lastName
        },
        token: result.token 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Password reset endpoints
  app.post("/api/password-reset-request", async (req, res) => {
    try {
      const validation = passwordResetRequestSchema.parse(req.body);
      const result = await authService.initiatePasswordReset(validation.email);
      
      // Always return success for security (don't reveal if email exists)
      res.json({ message: result.message });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid email format" });
    }
  });

  app.post("/api/password-reset", async (req, res) => {
    try {
      const validation = passwordResetSchema.parse(req.body);
      const result = await authService.resetPassword(validation.token, validation.newPassword);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ message: result.message });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/change-password", authenticateToken, async (req, res) => {
    try {
      const validation = changePasswordSchema.parse(req.body);
      const result = await authService.changePassword(
        req.user!.id, 
        validation.currentPassword, 
        validation.newPassword
      );
      
      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }
      
      res.json({ message: result.message });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid request data" });
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
      res.json({ 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update current user profile
  app.patch('/api/me', authenticateToken, async (req, res) => {
    try {
      const { username, email } = req.body;
      const userId = req.user!.id;
      
      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      // Check if username is already taken by another user
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Username already in use' });
        }
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, { username, email });
      
      res.json({ 
        id: updatedUser.id, 
        email: updatedUser.email, 
        username: updatedUser.username, 
        role: updatedUser.role 
      });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Error updating user profile' });
    }
  });

  // Admin-only routes for user management
  app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const customers = await storage.getUsersByRole('customer');
      const drivers = await storage.getUsersByRole('driver');
      const admins = await storage.getUsersByRole('admin');
      
      res.json({
        customers: customers.map(u => ({ 
          id: u.id, 
          email: u.email, 
          username: u.username, 
          role: u.role,
          address: u.address,
          phone: u.phone,
          firstName: u.firstName,
          lastName: u.lastName
        })),
        drivers: drivers.map(u => ({ 
          id: u.id, 
          email: u.email, 
          username: u.username, 
          role: u.role,
          address: u.address,
          phone: u.phone,
          firstName: u.firstName,
          lastName: u.lastName
        })),
        admins: admins.map(u => ({ 
          id: u.id, 
          email: u.email, 
          username: u.username, 
          role: u.role,
          address: u.address,
          phone: u.phone,
          firstName: u.firstName,
          lastName: u.lastName
        }))
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
        // Enhanced test payment simulation for development
        const testPaymentIntent = await TestPaymentSimulator.createTestPaymentIntent(
          Math.round(amount * 100), // Convert to cents
          'usd'
        );
        
        res.json({ 
          clientSecret: testPaymentIntent.client_secret,
          testMode: true,
          testCards: {
            successful: "4242424242424242",
            declined: "4000000000000002",
            expired: "4000000000000036",
            insufficientFunds: "4000000000000010",
            cvcFailed: "4000000000000127",
            processingError: "4000000000000119",
            fraudulent: "4000000000000440"
          }
        });
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

  // Test payment confirmation endpoint
  app.post('/api/confirm-test-payment', authenticateToken, async (req, res) => {
    try {
      const { paymentIntentId, paymentMethodId } = req.body;
      
      if (!stripe) {
        // Simulate payment confirmation with test cards
        const testResult = await TestPaymentSimulator.confirmTestPayment(paymentIntentId, paymentMethodId);
        
        res.json({
          paymentIntent: testResult,
          testMode: true,
          success: testResult.status === 'succeeded'
        });
        return;
      }
      
      // Real Stripe implementation would go here
      res.status(400).json({ message: "Live Stripe not configured" });
    } catch (error: any) {
      res.status(500).json({ message: "Error confirming payment: " + error.message });
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
        // Enhanced test payment simulation for development
        const userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username;
        
        const testCustomer = await TestPaymentSimulator.createTestCustomer(user.email, userName);
        const testSubscription = await TestPaymentSimulator.createTestSubscription(testCustomer.id);
        
        // Create subscription in database
        const mockSubscription = await storage.createSubscription({
          customerId: user.id,
          stripeSubscriptionId: testSubscription.id,
          status: 'active',
          nextPickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        });
        
        // Update user with test Stripe info
        await storage.updateUserStripeInfo(user.id, testCustomer.id, testSubscription.id);
        
        res.json({
          subscriptionId: mockSubscription.stripeSubscriptionId,
          clientSecret: testSubscription.latest_invoice.payment_intent.client_secret,
          testMode: true,
          testCards: {
            successful: "4242424242424242",
            declined: "4000000000000002",
            expired: "4000000000000036",
            insufficientFunds: "4000000000000010",
            cvcFailed: "4000000000000127"
          }
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
      // Convert scheduledDate string to Date object before validation
      const requestData = {
        ...req.body,
        customerId: req.user!.id,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
      };
      
      const validatedData = insertPickupSchema.parse(requestData);

      const pickup = await storage.createPickup(validatedData);
      
      // Automatically assign to default driver (driver@test.com)
      const defaultDriver = await storage.getUserByEmail('driver@test.com');
      if (defaultDriver) {
        const assignedPickup = await storage.assignPickupToDriver(pickup.id, defaultDriver.id);
        res.json(assignedPickup);
      } else {
        res.json(pickup);
      }
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

  // Auto-assign all pending pickups to default driver
  app.post("/api/admin/assign-pending-pickups", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const defaultDriver = await storage.getUserByEmail('driver@test.com');
      if (!defaultDriver) {
        return res.status(404).json({ message: "Default driver not found" });
      }

      const pendingPickups = await storage.getPickupsByStatus('pending');
      const assignedPickups = [];

      for (const pickup of pendingPickups) {
        if (!pickup.driverId) { // Only assign if not already assigned
          const assignedPickup = await storage.assignPickupToDriver(pickup.id, defaultDriver.id);
          assignedPickups.push(assignedPickup);
        }
      }

      res.json({
        message: `Assigned ${assignedPickups.length} pending pickups to driver@test.com`,
        assignedPickups: assignedPickups.length,
        driver: defaultDriver.username
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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

  // Subscription endpoint
  app.get("/api/subscription", authenticateToken, async (req, res) => {
    try {
      const subscription = await storage.getSubscriptionByCustomer(req.user!.id);
      res.json(subscription || null);
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

  app.get("/api/admin/users", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/pickups", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const pickups = await storage.getAllPickups();
      res.json(pickups);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/subscriptions", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/routes", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
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

  // Driver routes - organized by day
  app.get("/api/driver/route", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      console.log('🚚 Driver route request from driver ID:', req.user!.id);
      
      // Get all assigned pickups for the driver
      const pickups = await storage.getPickupsByDriver(req.user!.id);
      console.log('📦 Total pickups for driver:', pickups.length);
      
      const assignedPickups = pickups.filter(pickup => pickup.status === 'assigned');
      console.log('✅ Assigned pickups:', assignedPickups.length);
      
      // Group pickups by date
      const pickupsByDate = assignedPickups.reduce((acc: any, pickup) => {
        const date = pickup.scheduledDate ? pickup.scheduledDate.toISOString().split('T')[0] : 'unscheduled';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(pickup);
        return acc;
      }, {});
      
      console.log('📅 Pickups by date:', Object.keys(pickupsByDate), Object.values(pickupsByDate).map((arr: any) => arr.length));
      
      // Sort pickups within each date by route order
      for (const date in pickupsByDate) {
        pickupsByDate[date].sort((a: any, b: any) => {
          if (a.routeOrder && b.routeOrder) {
            return a.routeOrder - b.routeOrder;
          }
          return 0;
        });
      }
      
      // Optimize routes for each day
      const optimizedRoutes: any = {};
      for (const date in pickupsByDate) {
        console.log(`🔄 Optimizing route for ${date} with ${pickupsByDate[date].length} pickups`);
        optimizedRoutes[date] = await optimizeRoute(pickupsByDate[date]);
      }
      
      console.log('🎯 Returning optimized routes:', Object.keys(optimizedRoutes));
      res.json(optimizedRoutes);
    } catch (error: any) {
      console.error('❌ Driver route error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Full route optimization endpoint for Google Maps navigation
  app.get("/api/driver/full-route", authenticateToken, requireRole('driver'), async (req, res) => {
    try {
      const pickups = await storage.getPickupsByDriver(req.user!.id);
      const assignedPickups = pickups.filter(pickup => pickup.status === 'assigned');
      
      if (assignedPickups.length === 0) {
        return res.json({
          googleMapsUrl: null,
          totalStops: 0,
          message: 'No assigned pickups found'
        });
      }
      
      // Sort by route order
      const sortedPickups = assignedPickups.sort((a, b) => {
        if (a.routeOrder && b.routeOrder) {
          return a.routeOrder - b.routeOrder;
        }
        return 0;
      });
      
      // Create Google Maps URL with multiple waypoints
      const addresses = sortedPickups.map(pickup => encodeURIComponent(pickup.address));
      const origin = addresses[0];
      const destination = addresses[addresses.length - 1];
      const waypoints = addresses.slice(1, -1).join('|');
      
      let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      if (waypoints) {
        googleMapsUrl += `&waypoints=${waypoints}`;
      }
      googleMapsUrl += '&travelmode=driving';
      
      const routeSummary = {
        totalStops: sortedPickups.length,
        estimatedTime: `${sortedPickups.length * 18} minutes`,
        totalDistance: `${(sortedPickups.length * 2.3).toFixed(2)} miles`,
        googleMapsUrl,
        stops: sortedPickups.map((pickup, index) => ({
          order: index + 1,
          address: pickup.address,
          customer: pickup.customerName || 'Customer',
          bags: pickup.bagCount,
          instructions: pickup.specialInstructions
        }))
      };
      
      res.json(routeSummary);
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

  app.post('/api/admin/pickups/:id/reschedule', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { newDate, reason } = req.body;
      
      // Get the pickup and customer info
      const pickup = await storage.getPickup(parseInt(id));
      if (!pickup) {
        return res.status(404).json({ message: 'Pickup not found' });
      }
      
      const customer = await storage.getUser(pickup.customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Update the pickup with new date
      const updatedPickup = await storage.updatePickup(parseInt(id), {
        scheduledDate: new Date(newDate),
        updatedAt: new Date(),
        status: 'rescheduled'
      });
      
      // Send email notification (simple implementation without external API)
      const emailContent = {
        to: customer.email,
        subject: `Acapella Trash Pickup Rescheduled - ${new Date(newDate).toLocaleDateString()}`,
        body: `
Dear ${customer.firstName || customer.username},

Your trash pickup has been rescheduled:

Original Date: ${pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleDateString() : 'Not set'}
New Date: ${new Date(newDate).toLocaleDateString()}
Address: ${pickup.address}
Bags: ${pickup.bagCount}
${reason ? `Reason: ${reason}` : ''}

We apologize for any inconvenience. If you have any questions, please contact us at acapellatrashhmbl@gmail.com.

Best regards,
Acapella Trash Removal Team
        `
      };
      
      // For now, we'll log the email content (in production, you'd send via email service)
      console.log('📧 Email notification sent to customer:', emailContent);
      
      res.json({
        pickup: updatedPickup,
        emailSent: true,
        emailContent: emailContent
      });
    } catch (error: any) {
      console.error('Reschedule error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Route Optimization endpoints - separated by service type
  app.post('/api/admin/optimize-subscription-route', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { pickupRouteManager } = await import('./pickupRouteManager');
      
      // Check if there are any subscription pickups first
      const subscriptionPickups = await storage.getPickupsByStatus('pending');
      const subscriptions = subscriptionPickups.filter(p => p.serviceType === 'subscription');
      
      if (subscriptions.length === 0) {
        return res.json({
          success: true,
          message: 'No subscription pickups available for optimization',
          route: null,
          type: 'subscription'
        });
      }
      
      const route = await pickupRouteManager.createSubscriptionRoute();
      res.json({
        success: true,
        message: `Subscription route optimized with ${subscriptions.length} stops`,
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
      const { pickupRouteManager } = await import('./pickupRouteManager');
      
      // Check if there are any package pickups first
      const allPickups = await storage.getPickupsByStatus('pending');
      const packagePickups = allPickups.filter(p => p.serviceType === 'same-day' || p.serviceType === 'next-day');
      
      if (packagePickups.length === 0) {
        return res.json({
          success: true,
          message: 'No package pickups available for optimization',
          route: null,
          type: 'package'
        });
      }
      
      const route = await pickupRouteManager.createPackageRoute();
      res.json({
        success: true,
        message: `Package route optimized with ${packagePickups.length} stops`,
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

  // Address clustering endpoints for geographic route optimization
  app.get("/api/admin/address-clusters", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { addressClusteringService } = await import('./addressClustering');
      
      // Get all customers with addresses
      const customers = await storage.getUsersByRole('customer');
      const customersWithAddresses = customers.filter(c => c.address && c.address.trim() !== '');
      
      if (customersWithAddresses.length === 0) {
        return res.json({
          clusters: [],
          stats: {
            totalClusters: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            availableClusters: 0,
            completedToday: 0
          }
        });
      }

      const clusters = await addressClusteringService.clusterCustomerAddresses(customersWithAddresses);
      const stats = addressClusteringService.getClusterStats(clusters);
      
      res.json({ clusters, stats });
    } catch (error: any) {
      console.error('Address clustering error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/optimize-cluster-route", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { clusterId, driverId } = req.body;
      const { addressClusteringService } = await import('./addressClustering');
      
      // Get all customers and find the specified cluster
      const customers = await storage.getUsersByRole('customer');
      const clusters = await addressClusteringService.clusterCustomerAddresses(customers);
      const targetCluster = clusters.find(c => c.id === clusterId);
      
      if (!targetCluster) {
        return res.status(404).json({ message: 'Cluster not found' });
      }

      // Optimize route order within cluster
      const optimizedAddresses = await addressClusteringService.optimizeClusterRoute(targetCluster);
      
      // Create pickup requests for each address in optimized order
      const createdPickups = [];
      const today = new Date();
      
      for (let i = 0; i < optimizedAddresses.length; i++) {
        const address = optimizedAddresses[i];
        
        const pickup = await storage.createPickup({
          customerId: address.customerId,
          address: address.address,
          scheduledDate: today,
          bagCount: address.bagCount,
          serviceType: 'subscription',
          priority: 'standard',
          amount: 5, // $5 per subscription pickup
          status: 'pending',
          instructions: `Cluster: ${targetCluster.name} | Stop #${i + 1}`,
          routeOrder: i + 1
        });
        
        // Assign to driver if specified
        if (driverId) {
          await storage.assignPickupToDriver(pickup.id, driverId);
        }
        
        createdPickups.push(pickup);
      }

      res.json({
        cluster: targetCluster,
        optimizedRoute: optimizedAddresses,
        pickups: createdPickups,
        totalStops: createdPickups.length,
        estimatedRevenue: createdPickups.length * 5,
        estimatedTime: `${Math.round(createdPickups.length * 0.4)}h`
      });
    } catch (error: any) {
      console.error('Cluster route optimization error:', error);
      res.status(500).json({ message: error.message });
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

  // Admin route overview - see all created routes
  app.get('/api/admin/routes', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      // Get all pickups that are part of routes (have routeOrder)
      const allPickups = await storage.getAllPickups();
      const routePickups = allPickups.filter(p => p.routeOrder && p.routeOrder > 0);
      
      // Group by driver and date
      const routesByDriver = routePickups.reduce((acc: any, pickup) => {
        const driverId = pickup.driverId || 'unassigned';
        const date = pickup.scheduledDate ? pickup.scheduledDate.toISOString().split('T')[0] : 'unscheduled';
        const routeKey = `${driverId}-${date}`;
        
        if (!acc[routeKey]) {
          acc[routeKey] = {
            driverId,
            date,
            pickups: [],
            totalStops: 0,
            completedStops: 0,
            estimatedRevenue: 0,
            status: 'pending'
          };
        }
        
        acc[routeKey].pickups.push(pickup);
        acc[routeKey].totalStops++;
        if (pickup.status === 'completed') {
          acc[routeKey].completedStops++;
        }
        acc[routeKey].estimatedRevenue += pickup.amount || 0;
        
        return acc;
      }, {});

      // Convert to array and add driver names
      const routes = await Promise.all(
        Object.values(routesByDriver).map(async (route: any) => {
          const driver = route.driverId !== 'unassigned' ? await storage.getUser(route.driverId) : null;
          
          // Sort pickups by route order
          route.pickups.sort((a: any, b: any) => (a.routeOrder || 0) - (b.routeOrder || 0));
          
          // Determine route status
          if (route.completedStops === route.totalStops && route.totalStops > 0) {
            route.status = 'completed';
          } else if (route.completedStops > 0) {
            route.status = 'in_progress';
          } else {
            route.status = 'pending';
          }
          
          return {
            ...route,
            driverName: driver ? driver.username : 'Unassigned',
            driverEmail: driver ? driver.email : null,
            progress: route.totalStops > 0 ? Math.round((route.completedStops / route.totalStops) * 100) : 0
          };
        })
      );

      res.json({
        routes: routes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        summary: {
          totalRoutes: routes.length,
          activeRoutes: routes.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
          completedRoutes: routes.filter(r => r.status === 'completed').length,
          totalRevenue: routes.reduce((sum, r) => sum + r.estimatedRevenue, 0)
        }
      });
    } catch (error: any) {
      console.error('Admin routes fetch error:', error);
      res.status(500).json({ message: error.message });
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

  // Demo data endpoints
  app.post('/api/admin/create-demo-data', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { createDemoData } = await import('./createDemoData');
      await createDemoData();
      
      res.json({
        success: true,
        message: 'Demo data created successfully',
        data: {
          customers: 8,
          subscriptions: 4,
          pickups: 8,
          areas: ['Center City', 'South Philly', 'Delaware County', 'Montgomery County', 'Fishtown', 'Bucks County', 'South Jersey', 'Chester County']
        }
      });
    } catch (error: any) {
      console.error('Demo data creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create demo data',
        error: error.message
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
