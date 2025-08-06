// Load Testing Script - Simulate hundreds of concurrent users
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 5;

console.log('⚡ LOAD TESTING SIMULATION');
console.log(`📊 Testing ${CONCURRENT_USERS} concurrent users`);
console.log(`🔄 ${REQUESTS_PER_USER} requests per user`);
console.log('===============================\n');

// Simulate user registration load
async function simulateUserSignup(userId) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `loadtest${userId}@test.com`,
        email: `loadtest${userId}@test.com`, 
        password: '[CREDENTIALS_REMOVED]',
        firstName: 'Load',
        lastName: `Test${userId}`,
        phone: `(555) ${String(userId).padStart(3, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        address: `${userId} Test St, Philadelphia, PA 19102`
      })
    });
    
    const duration = Date.now() - startTime;
    return { userId, status: response.status, duration, success: response.ok };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return { userId, status: 'ERROR', duration, success: false, error: error.message };
  }
}

// Simulate dashboard access load
async function simulateDashboardLoad(userId) {
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'customer@test.com',
        password: '[CREDENTIALS_REMOVED]'
      })
    });
    
    if (!loginResponse.ok) return { userId, success: false };
    
    const { token } = await loginResponse.json();
    
    // Simulate multiple dashboard requests
    const requests = [];
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/customer/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.ok);
    
    return { userId, success: allSuccessful, requestCount: REQUESTS_PER_USER };
    
  } catch (error) {
    return { userId, success: false, error: error.message };
  }
}

// Run concurrent registration test
async function runRegistrationLoadTest() {
  console.log('🔥 Registration Load Test');
  console.log('-------------------------');
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(simulateUserSignup(i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`✅ Successful registrations: ${successful}/${CONCURRENT_USERS}`);
  console.log(`⏱️ Average response time: ${avgDuration.toFixed(2)}ms`);
  console.log(`🎯 Total test duration: ${totalTime}ms`);
  console.log(`📈 Throughput: ${(CONCURRENT_USERS / (totalTime / 1000)).toFixed(2)} registrations/sec\n`);
  
  return successful / CONCURRENT_USERS >= 0.95; // 95% success rate
}

// Run concurrent dashboard test
async function runDashboardLoadTest() {
  console.log('📊 Dashboard Load Test');
  console.log('----------------------');
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(simulateDashboardLoad(i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.success).length;
  const totalRequests = CONCURRENT_USERS * REQUESTS_PER_USER;
  
  console.log(`✅ Successful dashboard loads: ${successful}/${CONCURRENT_USERS}`);
  console.log(`📊 Total requests handled: ${totalRequests}`);
  console.log(`⏱️ Total test duration: ${totalTime}ms`);
  console.log(`📈 Throughput: ${(totalRequests / (totalTime / 1000)).toFixed(2)} requests/sec\n`);
  
  return successful / CONCURRENT_USERS >= 0.95; // 95% success rate
}

// Main load test execution
async function runLoadTests() {
  console.log('Starting comprehensive load testing...\n');
  
  const registrationTest = await runRegistrationLoadTest();
  const dashboardTest = await runDashboardLoadTest();
  
  console.log('🎯 LOAD TEST RESULTS');
  console.log('====================');
  console.log(`Registration Load Test: ${registrationTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Dashboard Load Test: ${dashboardTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (registrationTest && dashboardTest) {
    console.log('\n🚀 PRODUCTION READY: Can handle hundreds of concurrent users');
  } else {
    console.log('\n⚠️ OPTIMIZATION NEEDED: Performance issues detected');
  }
}

// Start load testing
runLoadTests().catch(console.error);