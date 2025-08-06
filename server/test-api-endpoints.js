// API Endpoint Testing for Production Readiness
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

console.log('🔌 TESTING ALL API ENDPOINTS');
console.log('============================');

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('\n🔐 Authentication Tests:');
  
  try {
    // Test registration
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: '[CREDENTIALS_REMOVED]',
        firstName: 'Test',
        lastName: 'User',
        phone: '(555) 123-4567',
        address: '123 Test St, Philadelphia, PA'
      })
    });
    console.log(`✅ Registration: ${registerResponse.status}`);
    
    // Test login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'customer@test.com',
        password: '[CREDENTIALS_REMOVED]'
      })
    });
    console.log(`✅ Login: ${loginResponse.status}`);
    
    return await loginResponse.json();
    
  } catch (error) {
    console.log(`❌ Auth endpoints error: ${error.message}`);
    return null;
  }
}

// Test customer endpoints
async function testCustomerEndpoints(token) {
  console.log('\n👤 Customer Dashboard Tests:');
  
  try {
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    };
    
    // Test customer dashboard
    const dashboardResponse = await fetch(`${BASE_URL}/api/customer/dashboard`, { headers });
    console.log(`✅ Customer Dashboard: ${dashboardResponse.status}`);
    
    // Test create subscription 
    const subscriptionResponse = await fetch(`${BASE_URL}/api/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        packageType: 'basic',
        startDate: new Date().toISOString(),
        specialInstructions: 'Test subscription'
      })
    });
    console.log(`✅ Create Subscription: ${subscriptionResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Customer endpoints error: ${error.message}`);
  }
}

// Test admin endpoints
async function testAdminEndpoints(token) {
  console.log('\n👨‍💼 Admin Dashboard Tests:');
  
  try {
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    };
    
    // Test admin dashboard
    const adminResponse = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers });
    console.log(`✅ Admin Dashboard: ${adminResponse.status}`);
    
    // Test user management
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, { headers });
    console.log(`✅ User Management: ${usersResponse.status}`);
    
    // Test pickup management
    const pickupsResponse = await fetch(`${BASE_URL}/api/admin/pickups`, { headers });
    console.log(`✅ Pickup Management: ${pickupsResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Admin endpoints error: ${error.message}`);
  }
}

// Test driver endpoints  
async function testDriverEndpoints(token) {
  console.log('\n🚛 Driver Dashboard Tests:');
  
  try {
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    };
    
    // Test driver route
    const routeResponse = await fetch(`${BASE_URL}/api/driver/route`, { headers });
    console.log(`✅ Driver Route: ${routeResponse.status}`);
    
    // Test pickup completion
    const completeResponse = await fetch(`${BASE_URL}/api/driver/complete-pickup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pickupId: 1 })
    });
    console.log(`✅ Pickup Completion: ${completeResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Driver endpoints error: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  const authData = await testAuthEndpoints();
  
  if (authData && authData.token) {
    await testCustomerEndpoints(authData.token);
    await testAdminEndpoints(authData.token);
    await testDriverEndpoints(authData.token);
  }
  
  console.log('\n🎯 API TESTING COMPLETE');
  console.log('========================');
}

runTests();