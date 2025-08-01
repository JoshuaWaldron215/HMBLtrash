import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { loginSchema, registerSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const BCRYPT_ROUNDS = 12; // Increased from default 10 for better security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  requiresTwoFactor?: boolean;
}

export interface LoginAttempt {
  timestamp: number;
  ip: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}

export class AuthService {
  /**
   * Hash a password using bcrypt with increased rounds for security
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure JWT token
   */
  generateToken(user: User): string {
    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID() // Unique token ID for revocation
    };
    
    const options = { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'acapella-trash-removal',
      audience: 'acapella-app'
    };
    
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'acapella-trash-removal',
        audience: 'acapella-app'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate a secure random token for password reset/email verification
   */
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Check if user account is locked due to failed login attempts
   */
  async isAccountLocked(user: User): Promise<boolean> {
    if (!user.lockedUntil) return false;
    
    const lockExpired = new Date(user.lockedUntil) < new Date();
    if (lockExpired) {
      // Reset lock if expired
      await storage.updateUser(user.id, { 
        lockedUntil: null, 
        failedLoginAttempts: 0 
      });
      return false;
    }
    
    return true;
  }

  /**
   * Record a login attempt for security auditing
   */
  async recordLoginAttempt(user: User, success: boolean, ip: string, userAgent: string, failureReason?: string): Promise<void> {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
      ip,
      userAgent,
      success,
      failureReason
    };

    // Get existing login history
    const loginHistory = (user.loginHistory as LoginAttempt[]) || [];
    
    // Keep only last 10 attempts
    loginHistory.push(attempt);
    if (loginHistory.length > 10) {
      loginHistory.shift();
    }

    // Update user record
    const updates: Partial<User> = {
      loginHistory,
      lastLoginAt: success ? new Date() : user.lastLoginAt
    };

    if (!success) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      updates.failedLoginAttempts = failedAttempts;

      // Lock account if too many failed attempts
      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_TIME);
      }
    } else {
      // Reset failed attempts on successful login
      updates.failedLoginAttempts = 0;
      updates.lockedUntil = null;
    }

    await storage.updateUser(user.id, updates);
  }

  /**
   * Authenticate user with enhanced security checks - accepts email or username
   */
  async authenticate(usernameOrEmail: string, password: string, ip: string, userAgent: string): Promise<AuthResult> {
    try {
      // Basic input validation - no schema validation needed
      if (!usernameOrEmail || !password || usernameOrEmail.trim() === '' || password.trim() === '') {
        return {
          success: false,
          error: "Username/email and password are required"
        };
      }

      // Determine if input is email or username and find user accordingly
      const isEmail = usernameOrEmail.includes('@');
      let user;
      
      if (isEmail) {
        user = await storage.getUserByEmail(usernameOrEmail.toLowerCase());
      } else {
        user = await storage.getUserByUsername(usernameOrEmail);
      }
      
      if (!user) {
        return {
          success: false,
          error: "Invalid email/username or password"
        };
      }

      // Check if account is locked
      if (await this.isAccountLocked(user)) {
        await this.recordLoginAttempt(user, false, ip, userAgent, "Account locked");
        return {
          success: false,
          error: "Account is temporarily locked due to multiple failed login attempts. Please try again later."
        };
      }

      // Check if account is active
      if (!user.isActive) {
        await this.recordLoginAttempt(user, false, ip, userAgent, "Account inactive");
        return {
          success: false,
          error: "Account is deactivated. Please contact support."
        };
      }

      // Verify password
      const passwordValid = await this.verifyPassword(password, user.passwordHash || '');
      if (!passwordValid) {
        await this.recordLoginAttempt(user, false, ip, userAgent, "Invalid password");
        return {
          success: false,
          error: "Invalid email/username or password"
        };
      }

      // Check if two-factor authentication is required
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // For now, we'll implement 2FA placeholder
        // In production, you'd verify the TOTP code here
        return {
          success: false,
          requiresTwoFactor: true,
          message: "Two-factor authentication required"
        };
      }

      // Generate token
      const token = this.generateToken(user);

      // Record successful login
      await this.recordLoginAttempt(user, true, ip, userAgent);

      return {
        success: true,
        user: {
          ...user,
          password: undefined // Don't send password hash to client
        } as any,
        token
      };

    } catch (error: any) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: "Authentication failed. Please try again."
      };
    }
  }

  /**
   * Register a new user with enhanced security
   */
  async register(userData: any, ip: string, userAgent: string): Promise<AuthResult> {
    try {
      // Validate input
      const validation = registerSchema.safeParse(userData);
      if (!validation.success) {
        return {
          success: false,
          error: validation.error.errors.map(e => e.message).join(", ")
        };
      }

      const validatedData = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return {
          success: false,
          error: "An account with this email already exists"
        };
      }

      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return {
          success: false,
          error: "Username is already taken"
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(validatedData.password);

      // Generate email verification token
      const emailVerificationToken = this.generateSecureToken();

      // Create user
      const newUser = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: passwordHash, // Use 'password' field to match database
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        address: validatedData.address,
        role: 'customer', // All new users start as customers
        isActive: true // Set to false if you want email verification before activation
      });

      // Record initial login attempt
      await this.recordLoginAttempt(newUser, true, ip, userAgent);

      // Generate token
      const token = this.generateToken(newUser);

      return {
        success: true,
        user: {
          ...newUser,
          password: undefined
        } as any,
        token
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: "Registration failed. Please try again."
      };
    }
  }

  /**
   * Change user password with security checks
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          error: "User not found"
        };
      }

      // Verify current password
      const passwordValid = await this.verifyPassword(currentPassword, user.password);
      if (!passwordValid) {
        return {
          success: false,
          error: "Current password is incorrect"
        };
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await storage.updateUser(userId, { password: newPasswordHash });

      return {
        success: true,
        message: "Password updated successfully"
      };

    } catch (error: any) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: "Failed to change password. Please try again."
      };
    }
  }

  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(email: string): Promise<AuthResult> {
    try {
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists or not
        return {
          success: true,
          message: "If an account with this email exists, a password reset link has been sent."
        };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Update user with reset token
      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });

      // In production, you would send an email here
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true,
        message: "If an account with this email exists, a password reset link has been sent."
      };

    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: "Failed to initiate password reset. Please try again."
      };
    }
  }

  /**
   * Complete password reset process
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      // Find user by reset token
      const users = await storage.getUsersByRole('customer');
      const drivers = await storage.getUsersByRole('driver');
      const admins = await storage.getUsersByRole('admin');
      
      const allUsers = [...users, ...drivers, ...admins];
      const user = allUsers.find(u => u.passwordResetToken === token && 
                                     u.passwordResetExpires && 
                                     new Date(u.passwordResetExpires) > new Date());

      if (!user) {
        return {
          success: false,
          error: "Invalid or expired reset token"
        };
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      return {
        success: true,
        message: "Password reset successfully"
      };

    } catch (error: any) {
      console.error('Password reset completion error:', error);
      return {
        success: false,
        error: "Failed to reset password. Please try again."
      };
    }
  }
}

export const authService = new AuthService();