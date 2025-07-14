import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function migrateSecurityFields() {
  try {
    console.log("🔄 Starting security migration...");
    
    // Add new security columns to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
      ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
      ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb;
    `);

    // Copy existing password data to password_hash if it exists
    await db.execute(`
      UPDATE users 
      SET password_hash = password 
      WHERE password_hash IS NULL AND password IS NOT NULL;
    `);

    console.log("✅ Security migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run if called directly
migrateSecurityFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { migrateSecurityFields };