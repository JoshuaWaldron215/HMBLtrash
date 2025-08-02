import { storage } from './storage';
import type { Subscription, InsertPickup } from '@shared/schema';

interface SubscriptionPackage {
  type: string;
  frequency: string;
  bagCountLimit: number;
  pricePerMonth: number;
  includesFurniturePickup: boolean;
  includesBinWashing: boolean;
  includesLawnMowing: boolean;
  pickupDays?: string[];
}

// Define subscription packages with their scheduling rules
export const SUBSCRIPTION_PACKAGES: Record<string, SubscriptionPackage> = {
  'basic': {
    type: 'basic',
    frequency: 'weekly',
    bagCountLimit: 6,
    pricePerMonth: 35,
    includesFurniturePickup: false,
    includesBinWashing: false,
    includesLawnMowing: false
  },
  'clean-carry': {
    type: 'clean-carry', 
    frequency: 'weekly',
    bagCountLimit: 6,
    pricePerMonth: 60,
    includesFurniturePickup: true,
    includesBinWashing: true,
    includesLawnMowing: false
  },
  'heavy-duty': {
    type: 'heavy-duty',
    frequency: 'twice-weekly',
    bagCountLimit: 6,
    pricePerMonth: 75,
    includesFurniturePickup: true,
    includesBinWashing: true,
    includesLawnMowing: false,
    pickupDays: ['monday', 'thursday'] // Default pickup days
  },
  'premium': {
    type: 'premium',
    frequency: 'twice-weekly',
    bagCountLimit: 6,
    pricePerMonth: 150,
    includesFurniturePickup: true,
    includesBinWashing: true,
    includesLawnMowing: true,
    pickupDays: ['monday', 'thursday'] // Default pickup days
  }
};

/**
 * Calculate the next pickup date based on subscription package
 */
export function calculateNextPickupDate(
  packageType: string, 
  lastPickupDate: Date | null = null,
  preferredDay?: string,
  pickupDays?: string[]
): Date {
  const today = new Date();
  const startDate = lastPickupDate || today;
  
  const packageConfig = SUBSCRIPTION_PACKAGES[packageType];
  if (!packageConfig) {
    throw new Error(`Unknown package type: ${packageType}`);
  }

  switch (packageConfig.frequency) {
    case 'weekly':
      // Weekly pickup: next pickup = last pickup + 7 days (or next occurrence of preferred day)
      if (preferredDay && !lastPickupDate) {
        return getNextDayOfWeek(today, preferredDay);
      }
      return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
    case 'twice-weekly':
      // Twice weekly: find next day from pickup_days array
      const daysArray = pickupDays || packageConfig.pickupDays || ['monday', 'thursday'];
      return getNextPickupFromDays(today, daysArray, lastPickupDate);
      
    default:
      // Default to weekly
      return new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get the next occurrence of a specific day of the week
 */
function getNextDayOfWeek(date: Date, dayName: string): Date {
  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  const targetDay = dayMap[dayName.toLowerCase()];
  if (targetDay === undefined) {
    throw new Error(`Invalid day name: ${dayName}`);
  }
  
  const result = new Date(date);
  const currentDay = result.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7;
  
  // If it's the same day, schedule for next week
  if (daysUntilTarget === 0) {
    result.setDate(result.getDate() + 7);
  } else {
    result.setDate(result.getDate() + daysUntilTarget);
  }
  
  return result;
}

/**
 * For twice-weekly service, get the next pickup day from the array
 */
function getNextPickupFromDays(currentDate: Date, pickupDays: string[], lastPickupDate?: Date | null): Date {
  const dayMap: Record<string, number> = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  // Convert pickup days to day numbers and sort them
  const pickupDayNumbers = pickupDays
    .map(day => dayMap[day.toLowerCase()])
    .filter(num => num !== undefined)
    .sort((a, b) => a - b);
  
  if (pickupDayNumbers.length === 0) {
    throw new Error('No valid pickup days provided');
  }
  
  const today = new Date(currentDate);
  const currentDayOfWeek = today.getDay();
  
  // If we have a last pickup date, find the next day in the cycle
  if (lastPickupDate) {
    const lastPickupDay = lastPickupDate.getDay();
    const currentIndex = pickupDayNumbers.indexOf(lastPickupDay);
    
    if (currentIndex !== -1) {
      // Move to next day in the cycle
      const nextIndex = (currentIndex + 1) % pickupDayNumbers.length;
      const nextPickupDay = pickupDayNumbers[nextIndex];
      
      // If we wrapped around to the first day, it's next week
      if (nextIndex === 0) {
        return getNextDayOfWeek(today, Object.keys(dayMap)[nextPickupDay]);
      } else {
        // Find the next occurrence of this day this week or next
        const daysUntilNext = (nextPickupDay - currentDayOfWeek + 7) % 7;
        const result = new Date(today);
        result.setDate(result.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        return result;
      }
    }
  }
  
  // Find the next pickup day from today
  for (const pickupDay of pickupDayNumbers) {
    if (pickupDay > currentDayOfWeek) {
      const result = new Date(today);
      result.setDate(result.getDate() + (pickupDay - currentDayOfWeek));
      return result;
    }
  }
  
  // If no day this week, use the first day next week
  const result = new Date(today);
  result.setDate(result.getDate() + (7 - currentDayOfWeek + pickupDayNumbers[0]));
  return result;
}

/**
 * Calculate next lawn mowing date (monthly for premium package)
 */
export function calculateNextLawnMowingDate(lastMowingDate: Date | null = null): Date {
  const today = new Date();
  const startDate = lastMowingDate || today;
  
  // Next lawn mowing = last mowing + 30 days
  return new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
}

/**
 * Create subscription with proper scheduling based on package type
 */
export async function createSubscriptionWithScheduling(
  customerId: number,
  stripeSubscriptionId: string,
  packageType: string,
  preferredDay?: string,
  preferredTime?: string
): Promise<Subscription> {
  const packageConfig = SUBSCRIPTION_PACKAGES[packageType];
  if (!packageConfig) {
    throw new Error(`Unknown package type: ${packageType}`);
  }

  // Calculate next pickup date
  const nextPickupDate = calculateNextPickupDate(packageType, null, preferredDay, packageConfig.pickupDays);
  
  // Calculate next lawn mowing date if applicable
  const nextLawnMowingDate = packageConfig.includesLawnMowing 
    ? calculateNextLawnMowingDate() 
    : null;

  // Create subscription with all package details
  const subscription = await storage.createSubscription({
    customerId,
    stripeSubscriptionId,
    status: 'active',
    packageType,
    frequency: packageConfig.frequency,
    preferredDay,
    preferredTime,
    pickupDays: packageConfig.pickupDays,
    bagCountLimit: packageConfig.bagCountLimit,
    pricePerMonth: packageConfig.pricePerMonth.toString(),
    includesFurniturePickup: packageConfig.includesFurniturePickup,
    includesBinWashing: packageConfig.includesBinWashing,
    includesLawnMowing: packageConfig.includesLawnMowing,
    lawnMowingInterval: 30,
    nextPickupDate,
    nextLawnMowingDate,
    autoRenewal: true
  });

  console.log(`✅ Subscription created with automatic scheduling:
    📦 Package: ${packageType} 
    📅 Next pickup: ${nextPickupDate.toDateString()}
    🗓️ Frequency: ${packageConfig.frequency}
    ${nextLawnMowingDate ? `🌱 Next lawn mowing: ${nextLawnMowingDate.toDateString()}` : ''}`);

  return subscription;
}

/**
 * Update next pickup date after a pickup is completed
 */
export async function updateNextPickupAfterCompletion(subscriptionId: number): Promise<void> {
  const subscription = await storage.getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate the next pickup date based on the current one
  const nextPickupDate = calculateNextPickupDate(
    subscription.packageType,
    subscription.nextPickupDate,
    subscription.preferredDay || undefined,
    subscription.pickupDays || undefined
  );

  // Update the subscription
  await storage.updateSubscription(subscriptionId, {
    nextPickupDate,
    updatedAt: new Date()
  });

  console.log(`✅ Next pickup updated for subscription ${subscriptionId}: ${nextPickupDate.toDateString()}`);
}

/**
 * Generate upcoming pickups for all active subscriptions
 * This should be run daily to ensure all subscriptions have scheduled pickups
 */
export async function generateUpcomingPickups(): Promise<void> {
  const activeSubscriptions = await storage.getActiveSubscriptions();
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const subscription of activeSubscriptions) {
    try {
      // Check if we need to generate a pickup for this subscription
      if (subscription.nextPickupDate && subscription.nextPickupDate <= threeDaysFromNow) {
        const customer = await storage.getUser(subscription.customerId);
        if (!customer || !customer.address) {
          console.log(`⚠️ Skipping pickup generation for subscription ${subscription.id}: No customer address`);
          continue;
        }

        // Create the pickup
        const pickupData: InsertPickup = {
          customerId: subscription.customerId,
          address: customer.address,
          bagCount: subscription.bagCountLimit || 6,
          amount: '0.00', // Subscription pickups are pre-paid
          serviceType: 'subscription',
          status: 'pending',
          scheduledDate: subscription.nextPickupDate,
          paymentStatus: 'paid' // Subscription is already paid
        };

        await storage.createPickup(pickupData);
        
        // Update the next pickup date
        await updateNextPickupAfterCompletion(subscription.id);
        
        console.log(`✅ Generated pickup for subscription ${subscription.id} on ${subscription.nextPickupDate.toDateString()}`);
      }
    } catch (error) {
      console.error(`❌ Error generating pickup for subscription ${subscription.id}:`, error);
    }
  }
}