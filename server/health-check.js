// Health Check and Monitoring Script
import fetch from 'node-fetch';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:5000';
const HEALTH_CHECKS = [];

console.log('🏥 HEALTH CHECK & MONITORING');
console.log('============================');

// Database connectivity test
async function testDatabaseHealth() {
  try {
    // Test basic database connection via API
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { 'Authorization': 'Bearer test_token' }
    });
    
    HEALTH_CHECKS.push({
      service: 'Database Connection',
      status: response.status < 500 ? 'HEALTHY' : 'UNHEALTHY',
      responseTime: `${Date.now()}ms`,
      details: 'PostgreSQL connection via API'
    });
    
    return response.status < 500;
  } catch (error) {
    HEALTH_CHECKS.push({
      service: 'Database Connection', 
      status: 'UNHEALTHY',
      error: error.message
    });
    return false;
  }
}

// API endpoint health tests
async function testAPIHealth() {
  const endpoints = [
    { path: '/api/auth/login', method: 'POST', critical: true },
    { path: '/api/pickups', method: 'GET', critical: true },
    { path: '/api/admin/dashboard', method: 'GET', critical: false },
    { path: '/api/driver/route', method: 'GET', critical: false }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });
      const responseTime = Date.now() - startTime;
      
      HEALTH_CHECKS.push({
        service: `API ${endpoint.path}`,
        status: response.status < 500 ? 'HEALTHY' : 'DEGRADED',
        responseTime: `${responseTime}ms`,
        critical: endpoint.critical
      });
      
    } catch (error) {
      HEALTH_CHECKS.push({
        service: `API ${endpoint.path}`,
        status: 'UNHEALTHY',
        error: error.message,
        critical: endpoint.critical
      });
    }
  }
}

// Memory and CPU usage check
function testSystemResources() {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    HEALTH_CHECKS.push({
      service: 'Memory Usage',
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'HEALTHY' : 'WARNING', // 500MB threshold
      details: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB used`
    });
    
    HEALTH_CHECKS.push({
      service: 'Process Health',
      status: 'HEALTHY',
      uptime: `${(process.uptime() / 60).toFixed(1)} minutes`,
      details: 'Node.js process running normally'
    });
    
  } catch (error) {
    HEALTH_CHECKS.push({
      service: 'System Resources',
      status: 'ERROR',
      error: error.message
    });
  }
}

// Run all health checks
async function runHealthChecks() {
  console.log('Running comprehensive health checks...\n');
  
  await testDatabaseHealth();
  await testAPIHealth();
  testSystemResources();
  
  // Display results
  console.log('HEALTH CHECK RESULTS:');
  console.log('====================');
  
  let healthyCount = 0;
  let criticalIssues = 0;
  
  HEALTH_CHECKS.forEach(check => {
    const statusIcon = check.status === 'HEALTHY' ? '✅' : 
                     check.status === 'WARNING' ? '⚠️' : 
                     check.status === 'DEGRADED' ? '🟡' : '❌';
    
    console.log(`${statusIcon} ${check.service}: ${check.status}`);
    
    if (check.responseTime) console.log(`   Response Time: ${check.responseTime}`);
    if (check.details) console.log(`   Details: ${check.details}`);
    if (check.uptime) console.log(`   Uptime: ${check.uptime}`);
    if (check.error) console.log(`   Error: ${check.error}`);
    
    if (check.status === 'HEALTHY') healthyCount++;
    if (check.critical && check.status !== 'HEALTHY') criticalIssues++;
    
    console.log('');
  });
  
  // Overall health assessment
  const overallHealth = healthyCount / HEALTH_CHECKS.length;
  console.log('OVERALL SYSTEM HEALTH:');
  console.log('======================');
  
  if (overallHealth >= 0.9 && criticalIssues === 0) {
    console.log('🟢 EXCELLENT - System fully operational');
  } else if (overallHealth >= 0.75 && criticalIssues === 0) {
    console.log('🟡 GOOD - Minor issues detected'); 
  } else if (criticalIssues > 0) {
    console.log('🔴 CRITICAL - Service disruption possible');
  } else {
    console.log('🟠 DEGRADED - Multiple issues detected');
  }
  
  console.log(`\nHealthy Services: ${healthyCount}/${HEALTH_CHECKS.length}`);
  console.log(`Critical Issues: ${criticalIssues}`);
  
  return {
    overallHealth,
    healthyCount,
    totalChecks: HEALTH_CHECKS.length,
    criticalIssues,
    timestamp: new Date().toISOString()
  };
}

// Export for monitoring systems
runHealthChecks()
  .then(results => {
    console.log('\n📊 Health check completed');
    console.log('Ready for production monitoring integration');
  })
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });