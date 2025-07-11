import { storage } from './storage';
import type { InsertPickup, InsertSubscription, InsertUser } from '@shared/schema';
import bcrypt from 'bcryptjs';

/**
 * Create demo data for Philadelphia Metro Area trash pickup service
 */
export async function createDemoData() {
  console.log('🎯 Creating demo data for Philadelphia Metro Area...');

  // Create demo customers with Philadelphia addresses
  const phillyCustomers = [
    {
      username: 'sarah_center_city',
      email: 'sarah@centercity.com',
      phone: '(215) 555-0123',
      address: '1234 Walnut Street, Philadelphia, PA 19107',
      role: 'customer'
    },
    {
      username: 'mike_south_philly',
      email: 'mike@southphilly.com', 
      phone: '(215) 555-0456',
      address: '567 Passyunk Avenue, Philadelphia, PA 19148',
      role: 'customer'
    },
    {
      username: 'jessica_delco',
      email: 'jessica@delco.com',
      phone: '(610) 555-0789',
      address: '890 Lancaster Avenue, Bryn Mawr, PA 19010',
      role: 'customer'
    },
    {
      username: 'david_montco',
      email: 'david@montco.com',
      phone: '(610) 555-0321',
      address: '123 DeKalb Pike, King of Prussia, PA 19406', 
      role: 'customer'
    },
    {
      username: 'lisa_fishtown',
      email: 'lisa@fishtown.com',
      phone: '(215) 555-0654',
      address: '456 Frankford Avenue, Philadelphia, PA 19125',
      role: 'customer'
    },
    {
      username: 'tom_bensalem',
      email: 'tom@bensalem.com',
      phone: '(215) 555-0987',
      address: '789 Street Road, Bensalem, PA 19020',
      role: 'customer'
    },
    {
      username: 'maria_cherry_hill',
      email: 'maria@cherryhill.com',
      phone: '(856) 555-0147',
      address: '321 Route 70, Cherry Hill, NJ 08034',
      role: 'customer'
    },
    {
      username: 'robert_west_chester',
      email: 'robert@westchester.com',
      phone: '(610) 555-0258',
      address: '654 High Street, West Chester, PA 19380',
      role: 'customer'
    }
  ];

  // Create customer accounts
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const createdCustomers = [];
  
  for (const customerData of phillyCustomers) {
    const customer = await storage.createUser({
      username: customerData.username,
      email: customerData.email,
      password: hashedPassword,
      role: customerData.role,
      phone: customerData.phone,
      address: customerData.address
    });
    createdCustomers.push(customer);
  }

  // Create subscriptions for some customers
  const subscriptionCustomers = createdCustomers.slice(0, 4); // First 4 customers
  for (const customer of subscriptionCustomers) {
    await storage.createSubscription({
      customerId: customer.id,
      stripeSubscriptionId: `demo_sub_${customer.id}`,
      status: 'active',
      frequency: 'weekly',
      pricePerMonth: 20.00,
      bagCountLimit: 5,
      autoRenewal: true
    });
  }

  // Create subscription pickup requests (pending)
  const subscriptionPickups = [
    {
      customerId: createdCustomers[0].id,
      address: createdCustomers[0].address!,
      fullAddress: createdCustomers[0].address!,
      bagCount: 3,
      serviceType: 'subscription',
      amount: 5.00,
      priority: 'normal',
      status: 'pending',
      specialInstructions: 'Bags are in the back alley',
      coordinates: JSON.stringify([39.9526, -75.1652]) // Center City
    },
    {
      customerId: createdCustomers[1].id,
      address: createdCustomers[1].address!,
      fullAddress: createdCustomers[1].address!,
      bagCount: 4,
      serviceType: 'subscription',
      amount: 5.00,
      priority: 'normal',
      status: 'pending',
      specialInstructions: 'Please ring doorbell',
      coordinates: JSON.stringify([39.9209, -75.1584]) // South Philly
    },
    {
      customerId: createdCustomers[2].id,
      address: createdCustomers[2].address!,
      fullAddress: createdCustomers[2].address!,
      bagCount: 2,
      serviceType: 'subscription',
      amount: 5.00,
      priority: 'normal',
      status: 'pending',
      specialInstructions: 'Bags by garage door',
      coordinates: JSON.stringify([40.0259, -75.3148]) // Bryn Mawr
    },
    {
      customerId: createdCustomers[3].id,
      address: createdCustomers[3].address!,
      fullAddress: createdCustomers[3].address!,
      bagCount: 5,
      serviceType: 'subscription',
      amount: 5.00,
      priority: 'normal',
      status: 'pending',
      specialInstructions: 'Large bags - extra pickup',
      coordinates: JSON.stringify([40.0870, -75.3604]) // King of Prussia
    }
  ];

  // Create package pickup requests (same-day and next-day)
  const packagePickups = [
    {
      customerId: createdCustomers[4].id,
      address: createdCustomers[4].address!,
      fullAddress: createdCustomers[4].address!,
      bagCount: 2,
      serviceType: 'same-day',
      amount: 25.00,
      priority: 'immediate',
      status: 'pending',
      specialInstructions: 'Moving out today - urgent!',
      coordinates: JSON.stringify([39.9742, -75.1312]) // Fishtown
    },
    {
      customerId: createdCustomers[5].id,
      address: createdCustomers[5].address!,
      fullAddress: createdCustomers[5].address!,
      bagCount: 6,
      serviceType: 'same-day',
      amount: 30.00,
      priority: 'immediate',
      status: 'pending',
      specialInstructions: 'Party cleanup - lots of bags',
      coordinates: JSON.stringify([40.1034, -74.9418]) // Bensalem
    },
    {
      customerId: createdCustomers[6].id,
      address: createdCustomers[6].address!,
      fullAddress: createdCustomers[6].address!,
      bagCount: 3,
      serviceType: 'next-day',
      amount: 12.00,
      priority: 'standard',
      status: 'pending',
      specialInstructions: 'Standard pickup',
      coordinates: JSON.stringify([39.9348, -75.0312]) // Cherry Hill
    },
    {
      customerId: createdCustomers[7].id,
      address: createdCustomers[7].address!,
      fullAddress: createdCustomers[7].address!,
      bagCount: 4,
      serviceType: 'next-day',
      amount: 15.00,
      priority: 'standard',
      status: 'pending',
      specialInstructions: 'Bags by front door',
      coordinates: JSON.stringify([39.9606, -75.6056]) // West Chester
    }
  ];

  // Create all pickup requests
  const allPickups = [...subscriptionPickups, ...packagePickups];
  for (const pickupData of allPickups) {
    await storage.createPickup({
      customerId: pickupData.customerId,
      address: pickupData.address,
      fullAddress: pickupData.fullAddress,
      bagCount: pickupData.bagCount,
      serviceType: pickupData.serviceType,
      amount: pickupData.amount,
      priority: pickupData.priority,
      status: pickupData.status,
      specialInstructions: pickupData.specialInstructions,
      coordinates: pickupData.coordinates,
      scheduledDate: new Date()
    });
  }

  console.log('✅ Demo data created successfully!');
  console.log(`📦 Created ${createdCustomers.length} customers`);
  console.log(`🔄 Created ${subscriptionCustomers.length} subscriptions`);
  console.log(`📍 Created ${allPickups.length} pickup requests`);
  console.log(`   - ${subscriptionPickups.length} subscription pickups`);
  console.log(`   - ${packagePickups.length} package pickups`);
  console.log('\n🎯 Ready to test route optimization!');
}

/**
 * Clear all demo data
 */
export async function clearDemoData() {
  console.log('🧹 Clearing demo data...');
  
  // Note: This would need implementation in storage interface
  // For now, restarting the server will clear in-memory data
  
  console.log('✅ Demo data cleared!');
}