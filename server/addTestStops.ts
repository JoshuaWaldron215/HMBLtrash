import { storage } from './storage';
import type { InsertPickup } from '@shared/schema';

/**
 * Add 3 test pickup stops for the driver dashboard
 * This creates realistic pickup data for testing the driver workflow
 */
async function addTestStops() {
  console.log('Adding 3 test pickup stops for driver dashboard...');

  // Get the driver user (ID should be 2 based on the test data)
  const driverUser = await storage.getUserByEmail('driver@test.com');
  if (!driverUser) {
    console.error('Driver user not found. Please ensure test users are created.');
    return;
  }

  // Create 3 test customers if they don't exist
  const testCustomers = [
    {
      username: 'testcustomer1',
      email: 'testcustomer1@test.com',
      password: '$2a$10$hashed',
      role: 'customer' as const,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(555) 123-4567'
    },
    {
      username: 'testcustomer2', 
      email: 'testcustomer2@test.com',
      password: '$2a$10$hashed',
      role: 'customer' as const,
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '(555) 234-5678'
    },
    {
      username: 'testcustomer3',
      email: 'testcustomer3@test.com',
      password: '$2a$10$hashed',
      role: 'customer' as const,
      firstName: 'Emma',
      lastName: 'Rodriguez',
      phone: '(555) 345-6789'
    }
  ];

  // Create customers if they don't exist
  const customers = [];
  for (const customerData of testCustomers) {
    let customer = await storage.getUserByEmail(customerData.email);
    if (!customer) {
      customer = await storage.createUser(customerData);
      console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
    }
    customers.push(customer);
  }

  // Create 3 test pickups assigned to the driver
  const testPickups: InsertPickup[] = [
    {
      customerId: customers[0].id,
      driverId: driverUser.id,
      address: '1234 Pine Street, Philadelphia, PA 19107',
      fullAddress: '1234 Pine Street, Philadelphia, PA 19107',
      coordinates: '39.9526,-75.1652', // Center City coordinates
      bagCount: 3,
      amount: '25.00',
      serviceType: 'one-time',
      status: 'assigned',
      scheduledDate: new Date(),
      specialInstructions: 'Please ring doorbell. Bags are behind the gate.',
      priority: 'normal',
      routeOrder: 1,
      estimatedDuration: 10,
      paymentStatus: 'paid'
    },
    {
      customerId: customers[1].id,
      driverId: driverUser.id,
      address: '567 Walnut Street, Philadelphia, PA 19106',
      fullAddress: '567 Walnut Street, Philadelphia, PA 19106',
      coordinates: '39.9484,-75.1436', // Society Hill coordinates
      bagCount: 2,
      amount: '20.00',
      serviceType: 'subscription',
      status: 'assigned',
      scheduledDate: new Date(),
      specialInstructions: 'Apartment 3B. Bags will be in front lobby.',
      priority: 'normal',
      routeOrder: 2,
      estimatedDuration: 8,
      paymentStatus: 'paid'
    },
    {
      customerId: customers[2].id,
      driverId: driverUser.id,
      address: '890 South Street, Philadelphia, PA 19147',
      fullAddress: '890 South Street, Philadelphia, PA 19147',
      coordinates: '39.9417,-75.1580', // South Street coordinates
      bagCount: 4,
      amount: '30.00',
      serviceType: 'one-time',
      status: 'assigned',
      scheduledDate: new Date(),
      specialInstructions: 'Heavy bags. Please use side entrance.',
      priority: 'same-day',
      routeOrder: 3,
      estimatedDuration: 12,
      paymentStatus: 'paid'
    }
  ];

  // Create the pickups
  for (const pickupData of testPickups) {
    const pickup = await storage.createPickup(pickupData);
    console.log(`Created pickup #${pickup.id} for ${customers[pickupData.routeOrder! - 1].firstName} ${customers[pickupData.routeOrder! - 1].lastName} at ${pickup.address}`);
  }

  console.log('✅ Successfully added 3 test pickup stops for driver dashboard!');
  console.log('The driver dashboard should now show:');
  console.log('- 3 Total Stops');
  console.log('- 0 Completed');
  console.log('- 3 Remaining');
  console.log('');
  console.log('You can now test the driver workflow by:');
  console.log('1. Logging in as driver@test.com (password: password123)');
  console.log('2. Visiting the driver dashboard to see the route');
  console.log('3. Using the navigation and completion features');
}

// Run the function
addTestStops().catch(console.error);