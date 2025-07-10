import { storage } from './storage';
import { pickupRouteManager } from './pickupRouteManager';

/**
 * Create test pickup data for testing the route optimization system
 */
export async function createTestPickupData() {
  console.log('🧪 Creating test pickup data...');

  const testPickups = [
    {
      customerId: 3, // customer@test.com
      address: "123 Main St",
      fullAddress: "123 Main Street, San Francisco, CA 94102",
      coordinates: JSON.stringify([37.7749, -122.4194]),
      bagCount: 2,
      amount: "25.00",
      serviceType: "immediate",
      priority: "immediate",
      specialInstructions: "Gate code: #1234",
      paymentStatus: "paid"
    },
    {
      customerId: 3,
      address: "456 Oak Ave",
      fullAddress: "456 Oak Avenue, San Francisco, CA 94117",
      coordinates: JSON.stringify([37.7849, -122.4094]),
      bagCount: 1,
      amount: "15.00", 
      serviceType: "one-time",
      priority: "same-day",
      specialInstructions: "Leave bags by garage",
      paymentStatus: "paid"
    },
    {
      customerId: 3,
      address: "789 Pine Blvd",
      fullAddress: "789 Pine Boulevard, San Francisco, CA 94108",
      coordinates: JSON.stringify([37.7949, -122.3994]),
      bagCount: 3,
      amount: "12.00",
      serviceType: "subscription",
      priority: "normal",
      specialInstructions: "Apartment 3B",
      paymentStatus: "paid"
    },
    {
      customerId: 3,
      address: "321 Elm Way",
      fullAddress: "321 Elm Way, San Francisco, CA 94115",
      coordinates: JSON.stringify([37.7649, -122.4294]),
      bagCount: 2,
      amount: "20.00",
      serviceType: "one-time",
      priority: "next-day",
      specialInstructions: "Ring doorbell twice",
      paymentStatus: "paid"
    },
    {
      customerId: 3,
      address: "654 Cedar St",
      fullAddress: "654 Cedar Street, San Francisco, CA 94118",
      coordinates: JSON.stringify([37.7549, -122.4394]),
      bagCount: 4,
      amount: "30.00",
      serviceType: "immediate",
      priority: "immediate",
      specialInstructions: "Heavy bags - furniture disposal",
      paymentStatus: "paid"
    }
  ];

  const createdPickups = [];
  
  for (const pickup of testPickups) {
    try {
      const created = await storage.createPickup(pickup);
      createdPickups.push(created);
      console.log(`✅ Created pickup #${created.id} at ${pickup.address}`);
    } catch (error) {
      console.error(`❌ Failed to create pickup at ${pickup.address}:`, error);
    }
  }

  console.log(`🎯 Created ${createdPickups.length} test pickups`);
  
  // Test route optimization
  console.log('\n🗺️  Testing route optimization...');
  try {
    const route = await pickupRouteManager.createOptimizedRoute();
    console.log(`✅ Route created with ${route.pickupIds?.length || 0} stops`);
    console.log(`📍 Google Maps URL: ${route.googleMapsUrl}`);
    console.log(`🚛 Total distance: ${route.totalDistance} miles`);
    console.log(`⏰ Estimated time: ${route.estimatedTime} minutes`);
    
    return {
      pickups: createdPickups,
      route: route
    };
  } catch (error) {
    console.error('❌ Route optimization failed:', error);
    return {
      pickups: createdPickups,
      route: null
    };
  }
}

/**
 * Test the complete pickup workflow
 */
export async function testPickupWorkflow() {
  console.log('\n🔄 Testing complete pickup workflow...');
  
  // Get route summary
  const summary = await pickupRouteManager.getRouteSummary();
  console.log('📊 Route Summary:', {
    pendingPickups: summary.pendingPickups,
    immediateRequests: summary.immediateRequests,
    estimatedRevenue: `$${summary.estimatedRevenue.toFixed(2)}`
  });

  // Test pricing calculations
  console.log('\n💰 Testing pricing calculations...');
  const pricingTests = [
    { serviceType: 'subscription', priority: 'normal', bagCount: 2 },
    { serviceType: 'immediate', priority: 'immediate', bagCount: 3 },
    { serviceType: 'one-time', priority: 'same-day', bagCount: 1 },
    { serviceType: 'one-time', priority: 'next-day', bagCount: 4 }
  ];

  for (const test of pricingTests) {
    const price = pickupRouteManager.calculatePickupPricing(
      test.serviceType, 
      test.priority, 
      test.bagCount
    );
    console.log(`${test.serviceType} (${test.priority}) x${test.bagCount} bags = $${price.toFixed(2)}`);
  }

  return summary;
}

// Main test function
export async function runCompleteTest() {
  console.log('🚀 Starting complete route optimization test...\n');
  
  const testData = await createTestPickupData();
  const summary = await testPickupWorkflow();
  
  console.log('\n✅ Test completed successfully!');
  console.log('📋 To test the driver dashboard:');
  console.log('1. Login as driver@test.com (password123)');
  console.log('2. Go to /driver to see your route');
  console.log('3. Test the complete buttons');
  console.log('4. View route summary and navigation');
  
  return { testData, summary };
}