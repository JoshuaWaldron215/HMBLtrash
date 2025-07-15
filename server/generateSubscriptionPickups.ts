import { storage } from './storage';

async function generateSubscriptionPickups() {
  try {
    console.log('🔄 Generating subscription pickups...');
    
    // Get the customer with active subscription
    const customer = await storage.getUserByEmail('customer@test.com');
    if (!customer) {
      console.log('❌ Customer not found');
      return;
    }
    
    const subscription = await storage.getSubscriptionByCustomer(customer.id);
    if (!subscription) {
      console.log('❌ No active subscription found');
      return;
    }
    
    console.log(`✅ Found active subscription for ${customer.email}`);
    
    // Get the driver
    const driver = await storage.getUserByEmail('driver@test.com');
    if (!driver) {
      console.log('❌ Driver not found');
      return;
    }
    
    // Generate next Tuesday pickup (July 22, 2025)
    const nextTuesday = new Date('2025-07-22T10:00:00');
    
    // Check if pickup already exists for this date
    const existingPickup = await storage.getPickupsByDate('2025-07-22');
    const customerPickup = existingPickup.find(p => p.customerId === customer.id);
    
    if (customerPickup) {
      console.log('✅ Subscription pickup already exists for next Tuesday');
      return;
    }
    
    // Create subscription pickup
    const pickup = await storage.createPickup({
      customerId: customer.id,
      address: customer.address,
      bagCount: 3,
      serviceType: 'subscription',
      scheduledDate: nextTuesday,
      specialInstructions: 'Weekly subscription pickup - bags by front door',
      amount: 25.00,
      status: 'pending'
    });
    
    // Assign to driver
    await storage.assignPickupToDriver(pickup.id, driver.id);
    
    console.log(`✅ Created subscription pickup #${pickup.id} for ${customer.email} on Tuesday, July 22`);
    console.log('🎉 Subscription pickup generation completed!');
    
  } catch (error) {
    console.error('❌ Error generating subscription pickups:', error);
  }
}

generateSubscriptionPickups().then(() => {
  console.log('✅ Subscription pickup generation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});