// Script to create admin account on production database
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './shared/schema.ts';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function createProductionAdmin() {
  try {
    console.log('🔧 Creating admin account for production...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create admin user
    const [adminUser] = await db.insert(users).values({
      email: 'admin@test.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '(267) 401-4292',
      address: '1234 Admin St, Philadelphia, PA 19123',
      role: 'admin'
    }).returning();
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', adminUser.id);
    
    // Also create driver and customer test accounts
    const hashedTestPassword = await bcrypt.hash('password123', 10);
    
    const [driverUser] = await db.insert(users).values({
      email: 'driver@test.com',
      username: 'driver',
      password: hashedTestPassword,
      firstName: 'Test',
      lastName: 'Driver',
      phone: '(215) 555-0123',
      address: '5678 Driver Ave, Philadelphia, PA 19104',
      role: 'driver'
    }).returning();
    
    const [customerUser] = await db.insert(users).values({
      email: 'customer@test.com',
      username: 'customer',
      password: hashedTestPassword,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '(215) 555-0456',
      address: '9012 Customer Rd, Philadelphia, PA 19102',
      role: 'customer'
    }).returning();
    
    console.log('✅ Test accounts created:');
    console.log('🚛 Driver: driver@test.com / password123');
    console.log('👤 Customer: customer@test.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
}

createProductionAdmin();