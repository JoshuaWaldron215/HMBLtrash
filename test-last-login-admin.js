#!/usr/bin/env node

/**
 * Test script to verify last login functionality in admin dashboard
 */

async function testLastLoginFeature() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🔐 Testing Last Login Feature in Admin Dashboard\n');
  
  // Step 1: Login as different users to create recent login timestamps
  console.log('Step 1: Logging in as different users to create fresh timestamps...');
  
  const users = [
    { username: 'lemhem', password: 'password', name: 'Customer (lemhem)' },
    { username: 'driver', password: 'password123', name: 'Driver' },
    { username: 'admin', password: '[CREDENTIALS_REMOVED]', name: 'Admin' }
  ];
  
  let adminToken = '';
  
  for (const user of users) {
    console.log(`  - Logging in ${user.name}...`);
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, password: user.password })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (user.username === 'admin') {
        adminToken = data.token;
      }
      console.log(`    ✅ ${user.name} logged in successfully`);
    } else {
      console.log(`    ❌ Failed to login ${user.name}`);
    }
    
    // Small delay between logins
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nStep 2: Checking admin members endpoint for last login data...');
  
  if (!adminToken) {
    console.log('❌ Failed to get admin token');
    return;
  }
  
  // Test the /api/admin/all-members endpoint
  console.log('  - Fetching all members data...');
  const membersResponse = await fetch(`${BASE_URL}/api/admin/all-members`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (!membersResponse.ok) {
    console.log('❌ Failed to fetch members data');
    return;
  }
  
  const membersData = await membersResponse.json();
  console.log(`  ✅ Retrieved ${membersData.length} members`);
  
  console.log('\n📊 LAST LOGIN STATUS:');
  console.log('');
  
  let usersWithLastLogin = 0;
  let usersWithoutLastLogin = 0;
  
  for (const member of membersData.slice(0, 10)) { // Show first 10 members
    const hasLastLogin = member.lastLoginAt && member.lastLoginAt !== null;
    const lastLoginDisplay = hasLastLogin ? 
      new Date(member.lastLoginAt).toLocaleString() : 
      'Never logged in';
    
    console.log(`👤 ${member.username} (${member.role})`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Last Login: ${lastLoginDisplay}`);
    console.log(`   Member since: ${new Date(member.createdAt).toLocaleDateString()}`);
    console.log('');
    
    if (hasLastLogin) {
      usersWithLastLogin++;
    } else {
      usersWithoutLastLogin++;
    }
  }
  
  console.log('📈 SUMMARY:');
  console.log(`✅ Users with last login data: ${usersWithLastLogin}`);
  console.log(`❌ Users without last login data: ${usersWithoutLastLogin}`);
  console.log(`📊 Total members checked: ${Math.min(10, membersData.length)}`);
  console.log('');
  
  // Test if the recent logins we just made are reflected
  const recentlyLoggedInUsers = membersData.filter(member => {
    if (!member.lastLoginAt) return false;
    const lastLogin = new Date(member.lastLoginAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastLogin > fiveMinutesAgo;
  });
  
  console.log('🔍 RECENT LOGIN VERIFICATION:');
  console.log(`Users who logged in within the last 5 minutes: ${recentlyLoggedInUsers.length}`);
  for (const user of recentlyLoggedInUsers) {
    console.log(`  - ${user.username}: ${new Date(user.lastLoginAt).toLocaleString()}`);
  }
  
  console.log('');
  console.log(recentlyLoggedInUsers.length >= 3 ? 
    '🎉 SUCCESS: Last login tracking is working correctly!' : 
    '⚠️  WARNING: Some recent logins may not be tracked properly');
}

// Run the test
testLastLoginFeature().catch(console.error);