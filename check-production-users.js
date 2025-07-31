// Script to check existing users on production database
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './shared/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in production database...');
    
    const allUsers = await db.select().from(users);
    
    console.log(`\n📊 Found ${allUsers.length} users:`);
    
    allUsers.forEach(user => {
      console.log(`\n👤 User: ${user.username}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📅 Created: ${user.createdAt}`);
    });
    
    // Check specifically for admin user
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    console.log(`\n🔐 Admin accounts found: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\n✅ Admin login credentials:');
      adminUsers.forEach(admin => {
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👤 Username: ${admin.username}`);
        console.log(`   🔑 Try password: password123`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();