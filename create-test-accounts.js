#!/usr/bin/env node
// Create 5 test accounts for user inspection

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

async function createTestAccounts() {
  console.log('Creating 5 test accounts for inspection...\n');
  
  const accounts = [
    {
      username: 'demo_customer1',
      email: 'demo_customer1@test.com',
      password: 'TestPass123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(215) 555-0101',
      address: '1234 Market Street, Philadelphia, PA 19107'
    },
    {
      username: 'demo_customer2', 
      email: 'demo_customer2@test.com',
      password: 'TestPass123!',
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '(215) 555-0102',
      address: '567 Broad Street, Philadelphia, PA 19147'
    },
    {
      username: 'demo_driver1',
      email: 'demo_driver1@test.com', 
      password: 'TestPass123!',
      firstName: 'James',
      lastName: 'Rodriguez',
      phone: '(215) 555-0103',
      address: '890 Pine Street, Philadelphia, PA 19123'
    },
    {
      username: 'demo_admin1',
      email: 'demo_admin1@test.com',
      password: 'TestPass123!', 
      firstName: 'Lisa',
      lastName: 'Thompson',
      phone: '(215) 555-0104',
      address: '321 Walnut Street, Philadelphia, PA 19106'
    },
    {
      username: 'demo_customer3',
      email: 'demo_customer3@test.com',
      password: 'TestPass123!',
      firstName: 'David',
      lastName: 'Kim',
      phone: '(215) 555-0105', 
      address: '456 Chestnut Street, Philadelphia, PA 19102'
    }
  ];
  
  const createdAccounts = [];
  
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    
    try {
      const registerData = {
        ...account,
        confirmPassword: account.password
      };
      
      const response = await makeRequest('POST', '/api/auth/register', registerData);
      
      createdAccounts.push({
        ...account,
        userId: response.user.id,
        role: response.user.role,
        created: true
      });
      
      console.log(`✅ Created: ${account.username} (ID: ${response.user.id})`);
      
    } catch (error) {
      console.log(`❌ Failed: ${account.username} - ${error.message}`);
      createdAccounts.push({
        ...account,
        created: false,
        error: error.message
      });
    }
  }
  
  // Now promote some to different roles
  console.log('\nPromoting users to different roles...');
  
  try {
    // Login as admin
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      username: 'admin@test.com',
      password: 'password123'
    });
    
    const adminToken = adminLogin.token;
    
    // Promote demo_driver1 to driver
    const driverAccount = createdAccounts.find(a => a.username === 'demo_driver1');
    if (driverAccount && driverAccount.created) {
      await makeRequest('PATCH', `/api/admin/users/${driverAccount.userId}/role`, {
        role: 'driver'
      }, {
        'Authorization': `Bearer ${adminToken}`
      });
      driverAccount.role = 'driver';
      console.log(`✅ Promoted ${driverAccount.username} to driver`);
    }
    
    // Promote demo_admin1 to admin
    const adminAccount = createdAccounts.find(a => a.username === 'demo_admin1');
    if (adminAccount && adminAccount.created) {
      await makeRequest('PATCH', `/api/admin/users/${adminAccount.userId}/role`, {
        role: 'admin'
      }, {
        'Authorization': `Bearer ${adminToken}`
      });
      adminAccount.role = 'admin';
      console.log(`✅ Promoted ${adminAccount.username} to admin`);
    }
    
  } catch (error) {
    console.log(`❌ Role promotion failed: ${error.message}`);
  }
  
  // Display final account list
  console.log('\n🔐 TEST ACCOUNTS CREATED');
  console.log('========================');
  
  createdAccounts.forEach((account, index) => {
    if (account.created) {
      console.log(`\n${index + 1}. ${account.firstName} ${account.lastName} (${account.role.toUpperCase()})`);
      console.log(`   Username: ${account.username}`);
      console.log(`   Email: ${account.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Phone: ${account.phone}`);
      console.log(`   Address: ${account.address}`);
    } else {
      console.log(`\n${index + 1}. ❌ FAILED: ${account.username} - ${account.error}`);
    }
  });
  
  console.log('\n📝 LOGIN INSTRUCTIONS');
  console.log('====================');
  console.log('Visit your app and use any of the above credentials to log in.');
  console.log('Each account will redirect to the appropriate dashboard based on role:');
  console.log('• Customers → /dashboard (booking, subscriptions, billing)');
  console.log('• Drivers → /driver (route management, pickup completion)');
  console.log('• Admins → /admin (user management, business overview)');
  
  return createdAccounts.filter(a => a.created);
}

createTestAccounts()
  .then(accounts => {
    console.log(`\n✅ Successfully created ${accounts.length} test accounts`);
  })
  .catch(error => {
    console.error('\n❌ Account creation failed:', error);
  });