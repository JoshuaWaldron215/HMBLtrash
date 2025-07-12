import { storage } from "./storage";

async function testPickupQuery() {
  console.log("Testing pickup query for user ID 4...");
  
  try {
    // Test the storage method directly
    const pickups = await storage.getPickupsByCustomer(4);
    console.log("Direct storage query result:", pickups);
    
    // Test user lookup
    const user = await storage.getUser(4);
    console.log("User lookup result:", user);
    
  } catch (error) {
    console.error("Error in test:", error);
  }
  
  process.exit(0);
}

testPickupQuery();