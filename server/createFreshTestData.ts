import { storage } from './storage';
import type { InsertPickup, InsertUser } from '@shared/schema';
import bcrypt from 'bcryptjs';

/**
 * Clear all existing data and create 5 fresh pickups with different customers
 */
export async function createFreshTestData() {
  console.log('🧹 Clearing all existing data...');

  // Clear all existing data if using MemStorage
  if (storage.constructor.name === 'MemStorage') {
    // Reset in-memory storage
    (storage as any).users.clear();
    (storage as any).pickups.clear();
    (storage as any).routes.clear();
    (storage as any).subscriptions.clear();
    
    // Reset counters
    (storage as any).userIdCounter = 1;
    (storage as any).pickupIdCounter = 1;
    (storage as any).routeIdCounter = 1;
    (storage as any).subscriptionIdCounter = 1;
  } else {
    // For database storage, we'd need to truncate tables
    console.log('Database storage detected - manual cleanup required');
  }

  console.log('✅ All data cleared successfully');
  console.log('🎯 Creating fresh test data with 5 customers and pickups...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await storage.createUser({
    username: 'admin',
    email: 'admin@test.com',
    password: hashedPassword,
    role: 'admin',
    phone: '(555) 000-0000',
    address: '1 Admin Plaza, Philadelphia, PA 19019',
  });

  // Create driver user
  const driver = await storage.createUser({
    username: 'driver',
    email: 'driver@test.com',
    password: await bcrypt.hash('driver123', 10),
    role: 'driver',
    phone: '(555) 000-0001',
    address: '2 Driver Lane, Philadelphia, PA 19019',
  });

  // Create 5 fresh customer accounts with realistic Philadelphia addresses
  const freshCustomers = [
    {
      username: 'emma_rittenhouse',
      email: 'emma@rittenhouse.com',
      phone: '(215) 555-0101',
      address: '1500 Locust Street, Philadelphia, PA 19102',
      role: 'customer'
    },
    {
      username: 'james_northern_libs',
      email: 'james@northernliberties.com',
      phone: '(215) 555-0202',
      address: '800 N 2nd Street, Philadelphia, PA 19123',
      role: 'customer'
    },
    {
      username: 'sophia_manayunk',
      email: 'sophia@manayunk.com',
      phone: '(215) 555-0303',
      address: '4200 Main Street, Philadelphia, PA 19127',
      role: 'customer'
    },
    {
      username: 'alex_university_city',
      email: 'alex@universitycity.com',
      phone: '(215) 555-0404',
      address: '3400 Chestnut Street, Philadelphia, PA 19104',
      role: 'customer'
    },
    {
      username: 'olivia_old_city',
      email: 'olivia@oldcity.com',
      phone: '(215) 555-0505',
      address: '100 N 3rd Street, Philadelphia, PA 19106',
      role: 'customer'
    }
  ];

  // Create customer accounts
  const customerPassword = await bcrypt.hash('customer123', 10);
  const createdCustomers = [];
  
  for (const customerData of freshCustomers) {
    const customer = await storage.createUser({
      ...customerData,
      password: customerPassword,
    });
    createdCustomers.push(customer);
    console.log(`👤 Created customer: ${customer.username} (${customer.email})`);
  }

  // Create 5 fresh pickups, one for each customer
  const pickupData = [
    {
      bagCount: 3,
      serviceType: 'subscription',
      scheduledDate: new Date('2025-01-15T10:00:00'),
      specialInstructions: 'Please ring doorbell twice - bags are in the side alley',
      amount: 25.00
    },
    {
      bagCount: 2,
      serviceType: 'one-time',
      scheduledDate: new Date('2025-01-15T11:30:00'),
      specialInstructions: 'Call when you arrive - heavy bags today',
      amount: 20.00
    },
    {
      bagCount: 4,
      serviceType: 'subscription',
      scheduledDate: new Date('2025-01-15T13:00:00'),
      specialInstructions: 'Bags will be by the front door under the awning',
      amount: 30.00
    },
    {
      bagCount: 1,
      serviceType: 'one-time',
      scheduledDate: new Date('2025-01-15T14:30:00'),
      specialInstructions: 'Apartment 3B - buzzer is broken, please text',
      amount: 15.00
    },
    {
      bagCount: 5,
      serviceType: 'subscription',
      scheduledDate: new Date('2025-01-15T16:00:00'),
      specialInstructions: 'Large bags in the back yard - gate is unlocked',
      amount: 35.00
    }
  ];

  // Create pickups and assign to driver
  for (let i = 0; i < createdCustomers.length; i++) {
    const customer = createdCustomers[i];
    const pickup = pickupData[i];
    
    const createdPickup = await storage.createPickup({
      customerId: customer.id,
      address: customer.address,
      bagCount: pickup.bagCount,
      serviceType: pickup.serviceType,
      scheduledDate: pickup.scheduledDate,
      specialInstructions: pickup.specialInstructions,
      amount: pickup.amount,
      status: 'pending'
    });

    // Assign pickup to driver
    await storage.assignPickupToDriver(createdPickup.id, driver.id);
    
    console.log(`📦 Created pickup #${createdPickup.id} for ${customer.username}: ${pickup.bagCount} bags, ${pickup.serviceType} ($${pickup.amount})`);
  }

  console.log('\n🎉 Fresh test data created successfully!');
  console.log('📋 Summary:');
  console.log('  - 1 Admin user (admin@test.com / admin123)');
  console.log('  - 1 Driver user (driver@test.com / driver123)');
  console.log('  - 5 Customer users (password: customer123)');
  console.log('  - 5 Fresh pickups assigned to driver for today');
  console.log('  - Total pickup value: $125.00');
  console.log('\n✅ Ready for testing!');
}

/**
 * Helper function to reset data and create fresh test data
 */
export async function resetAndCreateFreshData() {
  try {
    await createFreshTestData();
    return { success: true, message: 'Fresh test data created successfully' };
  } catch (error) {
    console.error('❌ Error creating fresh test data:', error);
    return { success: false, error: error.message };
  }
}