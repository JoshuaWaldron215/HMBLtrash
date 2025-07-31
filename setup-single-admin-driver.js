// Script to set up single admin and driver with secure passwords
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, pickups } from './shared/schema.ts';
import { eq, and, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function setupSingleAdminDriver() {
  try {
    console.log('🔧 Setting up single admin and driver accounts...');
    
    // Hash the passwords
    const adminPassword = await bcrypt.hash('uyh&mWPUcZ@HPoq#HH*UT4ALtcvb&3', 10);
    const driverPassword = await bcrypt.hash('Limitless215$', 10);
    
    // Get current admin and driver users
    const currentAdmin = await db.select().from(users).where(eq(users.email, 'admin@test.com'));
    const currentDriver = await db.select().from(users).where(eq(users.email, 'driver@test.com'));
    
    let adminId, driverId;
    
    // Update or create admin user
    if (currentAdmin.length > 0) {
      const [updatedAdmin] = await db.update(users)
        .set({ 
          password: adminPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, 'admin@test.com'))
        .returning();
      adminId = updatedAdmin.id;
      console.log('✅ Updated admin@test.com password');
    } else {
      const [newAdmin] = await db.insert(users).values({
        email: 'admin@test.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '(267) 401-4292',
        address: '1234 Admin St, Philadelphia, PA 19123',
        role: 'admin'
      }).returning();
      adminId = newAdmin.id;
      console.log('✅ Created admin@test.com account');
    }
    
    // Update or create driver user
    if (currentDriver.length > 0) {
      const [updatedDriver] = await db.update(users)
        .set({ 
          password: driverPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, 'driver@test.com'))
        .returning();
      driverId = updatedDriver.id;
      console.log('✅ Updated driver@test.com password');
    } else {
      const [newDriver] = await db.insert(users).values({
        email: 'driver@test.com',
        username: 'driver',
        password: driverPassword,
        firstName: 'Test',
        lastName: 'Driver',
        phone: '(215) 555-0123',
        address: '5678 Driver Ave, Philadelphia, PA 19104',
        role: 'driver'
      }).returning();
      driverId = newDriver.id;
      console.log('✅ Created driver@test.com account');
    }
    
    // Remove all other admin accounts
    const deletedAdmins = await db.delete(users)
      .where(and(
        eq(users.role, 'admin'),
        ne(users.email, 'admin@test.com')
      ))
      .returning();
    
    if (deletedAdmins.length > 0) {
      console.log(`🗑️ Removed ${deletedAdmins.length} other admin accounts`);
    }
    
    // Remove all other driver accounts
    const deletedDrivers = await db.delete(users)
      .where(and(
        eq(users.role, 'driver'),
        ne(users.email, 'driver@test.com')
      ))
      .returning();
    
    if (deletedDrivers.length > 0) {
      console.log(`🗑️ Removed ${deletedDrivers.length} other driver accounts`);
    }
    
    // Assign all pickups to the single driver
    const reassignedPickups = await db.update(pickups)
      .set({ 
        driverId: driverId,
        updatedAt: new Date()
      })
      .where(ne(pickups.driverId, driverId))
      .returning();
    
    if (reassignedPickups.length > 0) {
      console.log(`📦 Reassigned ${reassignedPickups.length} pickups to driver@test.com`);
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('👑 ADMIN LOGIN:');
    console.log('   📧 Email: admin@test.com');
    console.log('   🔑 Password: uyh&mWPUcZ@HPoq#HH*UT4ALtcvb&3');
    console.log('\n🚛 DRIVER LOGIN:');
    console.log('   📧 Email: driver@test.com'); 
    console.log('   🔑 Password: Limitless215$');
    console.log('\n🌐 Production URL: https://acapellatrashremoval.com/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up accounts:', error);
    process.exit(1);
  }
}

setupSingleAdminDriver();