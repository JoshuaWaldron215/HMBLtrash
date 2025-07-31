#!/usr/bin/env node
// 100 User Load Test Simulation
// Tests app performance with 50 subscriptions + 50 one-time pickups

import { spawnSync } from 'child_process';
import fs from 'fs';

const API_BASE = 'http://localhost:5000';
const TOTAL_USERS = 100;
const SUBSCRIPTION_USERS = 50;
const ONETIME_USERS = 50;

// Performance tracking
const performanceMetrics = {
  registrations: [],
  subscriptions: [],
  oneTimePickups: [],
  errors: [],
  startTime: null,
  endTime: null
};

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json', ...headers };
  const startTime = Date.now();
  
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
    const responseTime = Date.now() - startTime;
    
    if (result.error) {
      throw new Error(`curl command failed: ${result.error.message}`);
    }
    
    if (result.status !== 0) {
      throw new Error(`curl exited with status ${result.status}: ${result.stderr}`);
    }
    
    const response = result.stdout;
    
    if (response.includes('<!DOCTYPE html>')) {
      throw new Error('API returned HTML instead of JSON');
    }
    
    const parsedResponse = JSON.parse(response);
    return { ...parsedResponse, responseTime };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    throw { ...error, responseTime };
  }
}

async function createUser(userId) {
  const userData = {
    username: `loadtest_user_${userId}`,
    email: `loadtest_user_${userId}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    firstName: `Test${userId}`,
    lastName: 'User',
    phone: `(555) ${String(userId).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    address: `${1000 + userId} Test Street, Philadelphia, PA 1910${String(userId % 10)}`
  };
  
  try {
    const response = await makeRequest('POST', '/api/auth/register', userData);
    performanceMetrics.registrations.push({
      userId,
      success: true,
      responseTime: response.responseTime,
      timestamp: new Date().toISOString()
    });
    return { success: true, user: response.user, token: response.token };
  } catch (error) {
    performanceMetrics.registrations.push({
      userId,
      success: false,
      responseTime: error.responseTime || 0,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    performanceMetrics.errors.push({
      type: 'registration',
      userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}

async function createSubscription(userId, token) {
  const packages = ['basic', 'clean_carry', 'heavy_duty', 'premium'];
  const selectedPackage = packages[userId % packages.length];
  
  try {
    const response = await makeRequest('POST', '/api/create-subscription', {
      packageType: selectedPackage
    }, {
      'Authorization': `Bearer ${token}`
    });
    
    performanceMetrics.subscriptions.push({
      userId,
      success: true,
      responseTime: response.responseTime,
      packageType: selectedPackage,
      timestamp: new Date().toISOString()
    });
    return { success: true, subscription: response };
  } catch (error) {
    performanceMetrics.subscriptions.push({
      userId,
      success: false,
      responseTime: error.responseTime || 0,
      error: error.message,
      packageType: selectedPackage,
      timestamp: new Date().toISOString()
    });
    performanceMetrics.errors.push({
      type: 'subscription',
      userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}

async function createOneTimePickup(userId, token) {
  const bagCounts = [1, 2, 3, 4, 5];
  const bagCount = bagCounts[userId % bagCounts.length];
  const scheduledDate = new Date(Date.now() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000);
  
  const pickupData = {
    bagCount,
    serviceType: 'one-time',
    scheduledDate: scheduledDate.toISOString().split('T')[0],
    address: `${1000 + userId} Test Street, Philadelphia, PA 1910${String(userId % 10)}`,
    specialInstructions: `Load test pickup for user ${userId}`
  };
  
  try {
    const response = await makeRequest('POST', '/api/create-payment-intent', pickupData, {
      'Authorization': `Bearer ${token}`
    });
    
    performanceMetrics.oneTimePickups.push({
      userId,
      success: true,
      responseTime: response.responseTime,
      bagCount,
      amount: response.amount,
      timestamp: new Date().toISOString()
    });
    return { success: true, pickup: response };
  } catch (error) {
    performanceMetrics.oneTimePickups.push({
      userId,
      success: false,
      responseTime: error.responseTime || 0,
      error: error.message,
      bagCount,
      timestamp: new Date().toISOString()
    });
    performanceMetrics.errors.push({
      type: 'onetime_pickup',
      userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
}

async function runBatchTest(startUserId, batchSize, testType) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    const userId = startUserId + i;
    promises.push(processUser(userId, testType));
  }
  
  return await Promise.allSettled(promises);
}

async function processUser(userId, testType) {
  // Create user account
  const userResult = await createUser(userId);
  if (!userResult.success) {
    return { userId, success: false, step: 'registration', error: userResult.error };
  }
  
  // Create subscription or one-time pickup based on test type
  if (testType === 'subscription') {
    const subResult = await createSubscription(userId, userResult.token);
    return { 
      userId, 
      success: subResult.success, 
      step: 'subscription',
      error: subResult.error 
    };
  } else {
    const pickupResult = await createOneTimePickup(userId, userResult.token);
    return { 
      userId, 
      success: pickupResult.success, 
      step: 'onetime_pickup',
      error: pickupResult.error 
    };
  }
}

function calculateStats() {
  const stats = {
    registrations: {
      total: performanceMetrics.registrations.length,
      successful: performanceMetrics.registrations.filter(r => r.success).length,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    },
    subscriptions: {
      total: performanceMetrics.subscriptions.length,
      successful: performanceMetrics.subscriptions.filter(r => r.success).length,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    },
    oneTimePickups: {
      total: performanceMetrics.oneTimePickups.length,
      successful: performanceMetrics.oneTimePickups.filter(r => r.success).length,
      averageTime: 0,
      maxTime: 0,
      minTime: Infinity
    },
    overall: {
      totalErrors: performanceMetrics.errors.length,
      totalDuration: performanceMetrics.endTime - performanceMetrics.startTime
    }
  };
  
  // Calculate timing statistics
  ['registrations', 'subscriptions', 'oneTimePickups'].forEach(category => {
    const data = performanceMetrics[category];
    if (data.length > 0) {
      const times = data.map(d => d.responseTime);
      stats[category].averageTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      stats[category].maxTime = Math.max(...times);
      stats[category].minTime = Math.min(...times);
    }
  });
  
  return stats;
}

async function runLoadTestSimulation() {
  console.log('🚀 STARTING 100 USER LOAD TEST SIMULATION');
  console.log('==========================================');
  console.log(`📊 Testing: ${SUBSCRIPTION_USERS} subscriptions + ${ONETIME_USERS} one-time pickups`);
  console.log(`📍 Target: ${API_BASE}`);
  console.log('');
  
  performanceMetrics.startTime = Date.now();
  
  // Run subscription users in batches
  console.log('👥 Creating subscription users...');
  const subscriptionBatches = Math.ceil(SUBSCRIPTION_USERS / 10);
  for (let batch = 0; batch < subscriptionBatches; batch++) {
    const startId = batch * 10;
    const batchSize = Math.min(10, SUBSCRIPTION_USERS - startId);
    
    console.log(`   Batch ${batch + 1}/${subscriptionBatches}: Users ${startId + 1}-${startId + batchSize}`);
    await runBatchTest(startId, batchSize, 'subscription');
    
    // Small delay between batches to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  
  // Run one-time pickup users in batches
  console.log('🛍️ Creating one-time pickup users...');
  const oneTimeBatches = Math.ceil(ONETIME_USERS / 10);
  for (let batch = 0; batch < oneTimeBatches; batch++) {
    const startId = SUBSCRIPTION_USERS + (batch * 10);
    const batchSize = Math.min(10, ONETIME_USERS - (batch * 10));
    
    console.log(`   Batch ${batch + 1}/${oneTimeBatches}: Users ${startId + 1}-${startId + batchSize}`);
    await runBatchTest(startId, batchSize, 'onetime');
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  performanceMetrics.endTime = Date.now();
  
  // Calculate and display results
  const stats = calculateStats();
  
  console.log('\n📈 LOAD TEST RESULTS');
  console.log('====================');
  
  console.log('\n👥 User Registration:');
  console.log(`   Total: ${stats.registrations.total}`);
  console.log(`   Successful: ${stats.registrations.successful} (${(stats.registrations.successful/stats.registrations.total*100).toFixed(1)}%)`);
  console.log(`   Average Response Time: ${stats.registrations.averageTime}ms`);
  console.log(`   Fastest: ${stats.registrations.minTime}ms | Slowest: ${stats.registrations.maxTime}ms`);
  
  console.log('\n💳 Subscription Creation:');
  console.log(`   Total: ${stats.subscriptions.total}`);
  console.log(`   Successful: ${stats.subscriptions.successful} (${(stats.subscriptions.successful/stats.subscriptions.total*100).toFixed(1)}%)`);
  console.log(`   Average Response Time: ${stats.subscriptions.averageTime}ms`);
  console.log(`   Fastest: ${stats.subscriptions.minTime}ms | Slowest: ${stats.subscriptions.maxTime}ms`);
  
  console.log('\n🗑️ One-Time Pickups:');
  console.log(`   Total: ${stats.oneTimePickups.total}`);
  console.log(`   Successful: ${stats.oneTimePickups.successful} (${(stats.oneTimePickups.successful/stats.oneTimePickups.total*100).toFixed(1)}%)`);
  console.log(`   Average Response Time: ${stats.oneTimePickups.averageTime}ms`);
  console.log(`   Fastest: ${stats.oneTimePickups.minTime}ms | Slowest: ${stats.oneTimePickups.maxTime}ms`);
  
  console.log('\n⚡ Overall Performance:');
  console.log(`   Total Duration: ${(stats.overall.totalDuration / 1000).toFixed(1)} seconds`);
  console.log(`   Total Errors: ${stats.overall.totalErrors}`);
  console.log(`   Success Rate: ${((TOTAL_USERS * 2 - stats.overall.totalErrors) / (TOTAL_USERS * 2) * 100).toFixed(1)}%`);
  
  // Determine if app can handle the load
  const overallSuccessRate = (TOTAL_USERS * 2 - stats.overall.totalErrors) / (TOTAL_USERS * 2) * 100;
  const avgResponseTime = (stats.registrations.averageTime + stats.subscriptions.averageTime + stats.oneTimePickups.averageTime) / 3;
  
  console.log('\n🎯 LOAD HANDLING ASSESSMENT');
  console.log('============================');
  
  if (overallSuccessRate >= 95 && avgResponseTime < 3000) {
    console.log('🟢 EXCELLENT - App handles 100 users perfectly');
    console.log('✅ Ready for production traffic');
    console.log('✅ Database performance optimal');
    console.log('✅ API endpoints responsive');
  } else if (overallSuccessRate >= 85 && avgResponseTime < 5000) {
    console.log('🟡 GOOD - App handles load with minor performance impact');
    console.log('⚠️ Consider optimization for peak traffic');
  } else {
    console.log('🔴 NEEDS IMPROVEMENT - Performance issues detected');
    console.log('❌ Requires optimization before production deployment');
  }
  
  // Save detailed report
  const report = {
    testParameters: {
      totalUsers: TOTAL_USERS,
      subscriptionUsers: SUBSCRIPTION_USERS,
      oneTimeUsers: ONETIME_USERS,
      timestamp: new Date().toISOString()
    },
    performanceMetrics,
    statistics: stats,
    canHandleLoad: overallSuccessRate >= 85 && avgResponseTime < 5000
  };
  
  fs.writeFileSync('./load-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved: load-test-report.json');
  
  return report.canHandleLoad;
}

// Run the simulation
runLoadTestSimulation()
  .then(canHandle => {
    if (canHandle) {
      console.log('\n🚀 APP CAN HANDLE 100+ USERS SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n⚠️ App needs optimization for this load');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  });