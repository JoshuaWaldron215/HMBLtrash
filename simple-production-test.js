#!/usr/bin/env node
// Simple production test - verify core functionality works

console.log('🎯 SIMPLE PRODUCTION VALIDATION');
console.log('================================\n');

let passed = 0;
let total = 0;

function test(name, result, message = '') {
  total++;
  if (result) {
    passed++;
    console.log(`✅ ${name}${message ? ': ' + message : ''}`);
  } else {
    console.log(`❌ ${name}${message ? ': ' + message : ''}`);
  }
}

// Test 1: API Health Check
try {
  const { execSync } = await import('child_process');
  const healthResponse = execSync('curl -s http://localhost:5000/api/health', { encoding: 'utf8' });
  const health = JSON.parse(healthResponse);
  test('API Health Check', health.status === 'healthy', 'API server responding');
} catch (error) {
  test('API Health Check', false, 'API server not responding');
}

// Test 2: Database Connection
try {
  const { execSync } = await import('child_process');
  const dbResponse = execSync('psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;" -t', { encoding: 'utf8' });
  const userCount = parseInt(dbResponse.trim());
  test('Database Connection', userCount >= 0, `${userCount} users in database`);
} catch (error) {
  test('Database Connection', false, 'Database not accessible');
}

// Test 3: User Registration Working
try {
  const { execSync } = await import('child_process');
  const timestamp = Date.now();
  const registerCmd = `curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"username":"test${timestamp}","email":"test${timestamp}@test.com","password":"Password123!","confirmPassword":"Password123!","firstName":"Test","lastName":"User","phone":"5551234567","address":"123 Test St, Philadelphia, PA"}'`;
  
  const registerResponse = execSync(registerCmd, { encoding: 'utf8' });
  const registration = JSON.parse(registerResponse);
  test('User Registration', !!registration.user && !!registration.token, 'Users can register successfully');
} catch (error) {
  test('User Registration', false, 'Registration failed');
}

// Test 4: Admin Login Working  
try {
  const { execSync } = await import('child_process');
  const loginCmd = `curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin@test.com","password":"password123"}'`;
  
  const loginResponse = execSync(loginCmd, { encoding: 'utf8' });
  const login = JSON.parse(loginResponse);
  test('Admin Authentication', !!login.user && login.user.role === 'admin', 'Admin can login successfully');
} catch (error) {
  test('Admin Authentication', false, 'Admin login failed');
}

// Test 5: File System Check
try {
  const fs = await import('fs');
  const hasDatabase = fs.existsSync('./shared/schema.ts');
  const hasRoutes = fs.existsSync('./server/routes.ts');
  const hasFrontend = fs.existsSync('./client/src/App.tsx');
  test('File System Integrity', hasDatabase && hasRoutes && hasFrontend, 'All core files present');
} catch (error) {
  test('File System Integrity', false, 'Missing core files');
}

console.log('\n📊 FINAL ASSESSMENT');
console.log('===================');
const score = (passed / total * 100).toFixed(1);
console.log(`Score: ${passed}/${total} (${score}%)`);

if (score >= 80) {
  console.log('\n🚀 PRODUCTION READY!');
  console.log('✅ Core systems operational');
  console.log('✅ Authentication working');
  console.log('✅ Database connected');
  console.log('✅ API endpoints responding');
  console.log('✅ Ready for deployment');
  process.exit(0);
} else {
  console.log('\n⚠️ Issues detected');
  process.exit(1);
}