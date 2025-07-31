// Script to update admin password with a secure one
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function updateAdminPassword() {
  try {
    console.log('🔧 Updating admin password for production login...');
    
    // Create a secure password that meets the requirements
    const securePassword = 'AdminPass123!';
    const hashedPassword = await bcrypt.hash(securePassword, 10);
    
    // Update admin user password
    const updatedUser = await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.email, 'admin@test.com'))
      .returning();
    
    if (updatedUser.length > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('📧 Email: admin@test.com');
      console.log('🔑 NEW Password: AdminPass123!');
      console.log('🔐 This password meets all security requirements');
      console.log('\n🌐 Try logging in at: acapellatrashremoval.com/login');
    } else {
      console.log('❌ No admin user found with email admin@test.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();