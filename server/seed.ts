import { db } from "./db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  console.log("Seeding database with test users...");
  
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  const testUsers = [
    {
      username: 'admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin'
    },
    {
      username: 'driver',
      email: 'driver@test.com',
      password: hashedPassword,
      role: 'driver'
    },
    {
      username: 'customer',
      email: 'customer@test.com',
      password: hashedPassword,
      role: 'customer'
    }
  ];
  
  for (const user of testUsers) {
    try {
      await db.insert(users).values(user);
      console.log(`✓ Created user: ${user.username}`);
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`✓ User already exists: ${user.username}`);
      } else {
        console.error(`✗ Error creating user ${user.username}:`, error.message);
      }
    }
  }
  
  console.log("Database seeding completed!");
  process.exit(0);
}

seedDatabase().catch(console.error);