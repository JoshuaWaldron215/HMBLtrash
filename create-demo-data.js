#!/usr/bin/env node
// Create demo data for test accounts

import { spawnSync } from 'child_process';

const API_BASE = 'http://localhost:5000';

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json', ...headers };
  
  try {
    const args = [
      '-s', '-X', method,
      `${API_BASE}${endpoint}`,
      ...Object.entries(defaultHeaders).flatMap(([k, v]) => ['-H', `${k}: ${v}`])
    ];
    
    if (data && method !== 'GET') {
      args.push('-d', JSON.stringify(data));
    }
    
    const result = spawnSync('curl', args, { encoding: 'utf8' });
    
    if (result.error || result.status !== 0) {
      throw new Error(`Request failed: ${result.stderr || result.error?.message}`);
    }
    
    const response = result.stdout;
    if (response.includes('<!DOCTYPE html>')) {
      throw new Error('API returned HTML instead of JSON');
    }
    
    return JSON.parse(response);
  } catch (error) {
    throw error;
  }
}

async function createDemoData() {
  console.log('Creating demo data for test accounts...\n');
  
  // Get admin token
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    username: 'admin@test.com',
    password: 'password123'
  });
  const adminToken = adminLogin.token;
  
  // Account mappings
  const accounts = [
    { id: 164, email: 'demo_customer1@test.com', name: 'Sarah Johnson', type: 'subscription' },
    { id: 165, email: 'demo_customer2@test.com', name: 'Michael Chen', type: 'subscription' },
    { id: 167, email: 'demo_customer3@test.com', name: 'David Kim', type: 'onetime' },
    { id: 168, email: 'demo_manager1@test.com', name: 'Lisa Thompson', type: 'onetime' },
  ];
  
  // Create subscriptions for accounts 1 and 2
  console.log('Creating subscriptions...');
  
  for (const account of accounts.filter(a => a.type === 'subscription')) {
    try {
      // Login as the customer
      const customerLogin = await makeRequest('POST', '/api/auth/login', {
        username: account.email,
        password: 'TestPass123!'
      });
      
      // Create subscription
      const subscription = await makeRequest('POST', '/api/create-subscription', {
        packageType: account.id === 164 ? 'basic' : 'clean_carry'
      }, {
        'Authorization': `Bearer ${customerLogin.token}`
      });
      
      console.log(`✅ Created subscription for ${account.name} (${account.id === 164 ? 'Basic' : 'Clean & Carry'} package)`);
      
    } catch (error) {
      console.log(`❌ Failed subscription for ${account.name}: ${error.message}`);
    }
  }
  
  console.log('\nCreating one-time pickups...');
  
  // Create one-time pickups for accounts 3, 4, and 5
  const oneTimeAccounts = [
    { id: 167, email: 'demo_customer3@test.com', name: 'David Kim', bags: 3, address: '456 Chestnut Street, Philadelphia, PA 19102' },
    { id: 168, email: 'demo_manager1@test.com', name: 'Lisa Thompson', bags: 2, address: '321 Walnut Street, Philadelphia, PA 19106' },
  ];
  
  // Add one more customer for account 5
  try {
    const newCustomer = await makeRequest('POST', '/api/auth/register', {
      username: 'demo_customer5',
      email: 'demo_customer5@test.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Jennifer',
      lastName: 'Martinez',
      phone: '(215) 555-0106',
      address: '789 Spruce Street, Philadelphia, PA 19108'
    });
    
    oneTimeAccounts.push({
      id: newCustomer.user.id,
      email: 'demo_customer5@test.com',
      name: 'Jennifer Martinez',
      bags: 4,
      address: '789 Spruce Street, Philadelphia, PA 19108'
    });
    console.log(`✅ Created demo_customer5: Jennifer Martinez (ID: ${newCustomer.user.id})`);
    
  } catch (error) {
    console.log(`❌ Failed to create demo_customer5: ${error.message}`);
  }
  
  // Create pickups for one-time accounts
  for (const account of oneTimeAccounts) {
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days from now
      
      const pickup = await makeRequest('POST', '/api/pickups', {
        customerId: account.id,
        address: account.address,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        bagCount: account.bags,
        specialInstructions: `Demo pickup for ${account.name}`,
        amount: account.bags * 8 + 7, // Basic pricing calculation
        serviceType: 'one-time'
      }, {
        'Authorization': `Bearer ${adminToken}`
      });
      
      console.log(`✅ Created pickup for ${account.name} (${account.bags} bags, ${scheduledDate.toDateString()})`);
      
      // Assign to driver@test.com (ID: 28)
      await makeRequest('PATCH', `/api/admin/pickups/${pickup.pickup.id}/assign`, {
        driverId: 28
      }, {
        'Authorization': `Bearer ${adminToken}`
      });
      
      console.log(`   → Assigned to driver@test.com`);
      
    } catch (error) {
      console.log(`❌ Failed pickup for ${account.name}: ${error.message}`);
    }
  }
  
  console.log('\nChecking for subscription pickups to assign...');
  
  // Get all pickups and assign subscription ones to driver
  try {
    const allPickups = await makeRequest('GET', '/api/admin/pickups', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    
    const unassignedPickups = allPickups.filter(p => !p.driverId && p.serviceType === 'subscription');
    
    for (const pickup of unassignedPickups) {
      try {
        await makeRequest('PATCH', `/api/admin/pickups/${pickup.id}/assign`, {
          driverId: 28
        }, {
          'Authorization': `Bearer ${adminToken}`
        });
        
        console.log(`✅ Assigned subscription pickup ${pickup.id} to driver@test.com`);
      } catch (error) {
        console.log(`❌ Failed to assign pickup ${pickup.id}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Failed to check subscription pickups: ${error.message}`);
  }
  
  console.log('\n🎯 DEMO DATA SUMMARY');
  console.log('===================');
  console.log('✅ Sarah Johnson (demo_customer1) - Basic subscription');
  console.log('✅ Michael Chen (demo_customer2) - Clean & Carry subscription');
  console.log('✅ David Kim (demo_customer3) - One-time pickup (3 bags)');
  console.log('✅ Lisa Thompson (demo_manager1) - One-time pickup (2 bags)');
  console.log('✅ Jennifer Martinez (demo_customer5) - One-time pickup (4 bags)');
  console.log('\n🚛 All pickups assigned to driver@test.com');
  console.log('\n📱 Login as demo_driver1@test.com to see the route dashboard with assigned pickups!');
}

createDemoData()
  .then(() => {
    console.log('\n✅ Demo data creation completed');
  })
  .catch(error => {
    console.error('\n❌ Demo data creation failed:', error);
  });