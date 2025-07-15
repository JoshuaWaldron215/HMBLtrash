import { storage } from './storage';
import bcrypt from 'bcryptjs';

async function createTestCustomer() {
  try {
    // Check if customer already exists
    const existingCustomer = await storage.getUserByEmail('customer@test.com');
    if (existingCustomer) {
      console.log('✅ Customer customer@test.com already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create the customer
    const customer = await storage.createUser({
      username: 'customer',
      email: 'customer@test.com',
      password: hashedPassword,
      role: 'customer',
      phone: '(555) 123-4567',
      address: '123 Test Street, Philadelphia, PA 19101'
    });

    console.log('✅ Created test customer account:');
    console.log(`   Email: ${customer.email}`);
    console.log(`   Username: ${customer.username}`);
    console.log(`   Role: ${customer.role}`);
    console.log(`   Password: password123`);
    
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
  }
}

createTestCustomer().then(() => {
  console.log('✅ Test customer creation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});