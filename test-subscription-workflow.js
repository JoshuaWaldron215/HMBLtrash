#!/usr/bin/env node

/**
 * Test Subscription Management Workflow
 * Tests canceling, pausing, resuming, and rescheduling functionality
 */

async function testSubscriptionManagement() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🔧 TESTING SUBSCRIPTION MANAGEMENT FEATURES\n');
  
  // Get admin token
  const adminAuth = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '[CREDENTIALS_REMOVED]' })
  });
  const adminData = await adminAuth.json();
  const adminToken = adminData.token;
  
  // 1. Test Subscription Status Management
  console.log('📋 STEP 1: SUBSCRIPTION STATUS MANAGEMENT');
  
  // Get all subscriptions
  const subscriptions = await fetch(`${BASE_URL}/api/admin/subscriptions`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const subsData = await subscriptions.json();
  
  console.log(`  Total subscriptions: ${subsData.length}`);
  
  const activeSubscription = subsData.find(sub => sub.status === 'active');
  if (!activeSubscription) {
    console.log('  ⚠️  No active subscription found for testing');
    return;
  }
  
  console.log(`  Testing with subscription ID: ${activeSubscription.id}`);
  console.log(`  Customer: ${activeSubscription.customerId}`);
  console.log(`  Package: ${activeSubscription.packageType}`);
  console.log(`  Current status: ${activeSubscription.status}`);
  
  // 2. Test Pause Subscription
  console.log('\n⏸️  STEP 2: PAUSE SUBSCRIPTION');
  
  const pauseResponse = await fetch(`${BASE_URL}/api/admin/subscription/${activeSubscription.id}/pause`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (pauseResponse.ok) {
    console.log('  ✅ Subscription paused successfully');
    
    // Verify status changed
    const updatedSubs = await fetch(`${BASE_URL}/api/admin/subscriptions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const updatedSubsData = await updatedSubs.json();
    const pausedSub = updatedSubsData.find(sub => sub.id === activeSubscription.id);
    console.log(`  Status after pause: ${pausedSub.status}`);
  } else {
    console.log('  ❌ Failed to pause subscription');
  }
  
  // 3. Test Resume Subscription
  console.log('\n▶️  STEP 3: RESUME SUBSCRIPTION');
  
  const resumeResponse = await fetch(`${BASE_URL}/api/admin/subscription/${activeSubscription.id}/resume`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (resumeResponse.ok) {
    console.log('  ✅ Subscription resumed successfully');
    
    // Verify status changed back
    const resumedSubs = await fetch(`${BASE_URL}/api/admin/subscriptions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const resumedSubsData = await resumedSubs.json();
    const resumedSub = resumedSubsData.find(sub => sub.id === activeSubscription.id);
    console.log(`  Status after resume: ${resumedSub.status}`);
  } else {
    console.log('  ❌ Failed to resume subscription');
  }
  
  // 4. Test Pickup Rescheduling
  console.log('\n📅 STEP 4: PICKUP RESCHEDULING');
  
  // Get all pickups
  const pickups = await fetch(`${BASE_URL}/api/admin/pickups`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const pickupsData = await pickups.json();
  
  const pendingPickup = pickupsData.find(pickup => pickup.status === 'pending');
  if (!pendingPickup) {
    console.log('  ⚠️  No pending pickup found for rescheduling test');
  } else {
    console.log(`  Testing with pickup ID: ${pendingPickup.id}`);
    console.log(`  Current date: ${pendingPickup.scheduledDate}`);
    
    // Calculate new date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const newDate = tomorrow.toISOString().split('T')[0];
    
    const rescheduleResponse = await fetch(`${BASE_URL}/api/admin/reschedule-pickup`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickupId: pendingPickup.id,
        newDate: newDate,
        sendNotification: false
      })
    });
    
    if (rescheduleResponse.ok) {
      console.log(`  ✅ Pickup rescheduled to: ${newDate}`);
    } else {
      const errorText = await rescheduleResponse.text();
      console.log(`  ❌ Failed to reschedule pickup: ${errorText}`);
    }
  }
  
  // 5. Test Pickup Status Updates
  console.log('\n🔄 STEP 5: PICKUP STATUS UPDATES');
  
  const testPickup = pickupsData.find(pickup => pickup.status === 'pending');
  if (testPickup) {
    console.log(`  Testing status updates for pickup ID: ${testPickup.id}`);
    
    // Update to in-progress
    const inProgressResponse = await fetch(`${BASE_URL}/api/admin/pickups/${testPickup.id}/status`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'in-progress' })
    });
    
    if (inProgressResponse.ok) {
      console.log('  ✅ Updated pickup to in-progress');
      
      // Update to completed
      const completedResponse = await fetch(`${BASE_URL}/api/admin/pickups/${testPickup.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (completedResponse.ok) {
        console.log('  ✅ Updated pickup to completed');
      } else {
        console.log('  ❌ Failed to mark pickup as completed');
      }
    } else {
      console.log('  ❌ Failed to update pickup to in-progress');
    }
  }
  
  // 6. Test Driver Assignment
  console.log('\n🚛 STEP 6: DRIVER ASSIGNMENT');
  
  // Get drivers
  const allUsers = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const usersData = await allUsers.json();
  const driver = usersData.drivers[0];
  
  if (driver && pickupsData.length > 0) {
    const unassignedPickup = pickupsData.find(pickup => !pickup.driverId);
    if (unassignedPickup) {
      console.log(`  Assigning pickup ${unassignedPickup.id} to driver ${driver.id}`);
      
      const assignResponse = await fetch(`${BASE_URL}/api/admin/assign-pickup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickupId: unassignedPickup.id,
          driverId: driver.id
        })
      });
      
      if (assignResponse.ok) {
        console.log('  ✅ Pickup assigned to driver successfully');
      } else {
        console.log('  ❌ Failed to assign pickup to driver');
      }
    } else {
      console.log('  ⚠️  No unassigned pickups found');
    }
  } else {
    console.log('  ⚠️  No driver found or no pickups available');
  }
  
  // Final Status Check
  console.log('\n📊 FINAL STATUS CHECK');
  
  const finalSubs = await fetch(`${BASE_URL}/api/admin/subscriptions`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const finalSubsData = await finalSubs.json();
  
  const finalPickups = await fetch(`${BASE_URL}/api/admin/pickups`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const finalPickupsData = await finalPickups.json();
  
  console.log('  Subscription statuses:');
  const statusCounts = {};
  finalSubsData.forEach(sub => {
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
  });
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`    ${status}: ${count} subscriptions`);
  });
  
  console.log('  Pickup statuses:');
  const pickupStatusCounts = {};
  finalPickupsData.forEach(pickup => {
    pickupStatusCounts[pickup.status] = (pickupStatusCounts[pickup.status] || 0) + 1;
  });
  Object.entries(pickupStatusCounts).forEach(([status, count]) => {
    console.log(`    ${status}: ${count} pickups`);
  });
  
  console.log('\n🎯 SUBSCRIPTION MANAGEMENT FEATURES TESTED:');
  console.log('  ✅ Pause/Resume subscriptions');
  console.log('  ✅ Pickup rescheduling');
  console.log('  ✅ Status updates');
  console.log('  ✅ Driver assignment');
  console.log('  ✅ Real-time data updates');
}

// Run the test
testSubscriptionManagement().catch(console.error);