import { storage } from './storage';
import type { InsertPickup } from '@shared/schema';

/**
 * Add 2 upcoming pickups for customer@test.com to test driver dashboard
 */
async function addCustomerPickups() {
  console.log('Adding 2 upcoming pickups for customer@test.com...');

  // Get the customer user (should be ID 3)
  const customer = await storage.getUserByEmail('customer@test.com');
  if (!customer) {
    console.error('Customer user not found.');
    return;
  }

  // Get the driver user (should be ID 2)
  const driver = await storage.getUserByEmail('driver@test.com');
  if (!driver) {
    console.error('Driver user not found.');
    return;
  }

  // Create 2 upcoming pickups scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow

  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(14, 0, 0, 0); // 2 PM tomorrow

  const upcomingPickups: InsertPickup[] = [
    {
      customerId: customer.id,
      driverId: driver.id,
      address: '2100 Arch Street, Philadelphia, PA 19103',
      fullAddress: '2100 Arch Street, Philadelphia, PA 19103',
      coordinates: '39.9556,-75.1738', // Logan Square area
      bagCount: 2,
      amount: '18.00',
      serviceType: 'subscription',
      status: 'assigned',
      scheduledDate: tomorrow,
      specialInstructions: 'Subscription pickup. Bags will be by front door.',
      priority: 'normal',
      routeOrder: 4,
      estimatedDuration: 8,
      paymentStatus: 'paid'
    },
    {
      customerId: customer.id,
      driverId: driver.id,
      address: '1900 Market Street, Philadelphia, PA 19103',
      fullAddress: '1900 Market Street, Philadelphia, PA 19103',
      coordinates: '39.9528,-75.1713', // Market Street area
      bagCount: 3,
      amount: '25.00',
      serviceType: 'one-time',
      status: 'assigned',
      scheduledDate: nextDay,
      specialInstructions: 'One-time pickup. Call when arriving - heavy bags.',
      priority: 'same-day',
      routeOrder: 5,
      estimatedDuration: 12,
      paymentStatus: 'paid'
    }
  ];

  // Create the pickups
  for (const [index, pickupData] of upcomingPickups.entries()) {
    const pickup = await storage.createPickup(pickupData);
    console.log(`Created pickup #${pickup.id} for customer@test.com at ${pickup.address}`);
    console.log(`  - ${pickup.bagCount} bags, ${pickup.serviceType}, scheduled for ${pickup.scheduledDate?.toLocaleDateString()}`);
  }

  console.log('✅ Successfully added 2 upcoming pickups for customer@test.com!');
  console.log('');
  console.log('These pickups should now appear in:');
  console.log('1. Customer dashboard - showing upcoming pickups');
  console.log('2. Driver dashboard - as assigned pickups in the route');
  console.log('3. Route optimization with proper ordering');
}

// Run the function
addCustomerPickups().catch(console.error);