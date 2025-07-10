import { db } from "./db";
import { pickups, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addPickup() {
  console.log("Adding pickup record...");
  
  // Find the user by email
  const [user] = await db.select().from(users).where(eq(users.email, '40kQ@goat.com'));
  
  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }
  
  console.log(`Found user: ${user.username} (ID: ${user.id})`);
  
  // Create the pickup record
  const pickupData = {
    customerId: user.id,
    address: "2500 Knights Road, Bensalem, PA 19020",
    bagCount: 8,
    amount: "45.00",
    serviceType: "one-time" as const,
    status: "pending" as const,
    scheduledDate: new Date("2025-07-18T10:00:00Z"),
    specialInstructions: "yeo 80k juice"
  };
  
  try {
    const [pickup] = await db.insert(pickups).values(pickupData).returning();
    console.log(`✓ Created pickup record:`);
    console.log(`  - ID: ${pickup.id}`);
    console.log(`  - Customer: ${user.username}`);
    console.log(`  - Address: ${pickup.address}`);
    console.log(`  - Date: ${pickup.scheduledDate?.toLocaleDateString()}`);
    console.log(`  - Bags: ${pickup.bagCount}`);
    console.log(`  - Amount: $${pickup.amount}`);
    console.log(`  - Instructions: ${pickup.specialInstructions}`);
    console.log(`  - Status: ${pickup.status}`);
  } catch (error: any) {
    console.error("Error creating pickup:", error.message);
  }
  
  console.log("Pickup creation completed!");
  process.exit(0);
}

addPickup().catch(console.error);