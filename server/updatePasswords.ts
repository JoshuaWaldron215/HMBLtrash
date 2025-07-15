import { storage } from './storage';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  try {
    console.log('🔐 Updating admin and driver passwords to password123...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update admin password
    const admin = await storage.getUserByEmail('admin@test.com');
    if (admin) {
      await storage.updateUser(admin.id, { password: hashedPassword });
      console.log('✅ Updated admin@test.com password to password123');
    }
    
    // Update driver password
    const driver = await storage.getUserByEmail('driver@test.com');
    if (driver) {
      await storage.updateUser(driver.id, { password: hashedPassword });
      console.log('✅ Updated driver@test.com password to password123');
    }
    
    console.log('🎉 Password updates completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  }
}

updatePasswords().then(() => {
  console.log('✅ Password update process completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});