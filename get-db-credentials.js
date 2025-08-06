#!/usr/bin/env node

// Simple script to help you get your database credentials for sharing
console.log('\n🔧 Database Credentials for Collaboration\n');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL found:');
  console.log('   ' + process.env.DATABASE_URL);
} else {
  console.log('❌ DATABASE_URL not found in environment');
}

console.log('\n📋 Other Environment Variables to Share:');

const envVars = [
  'JWT_SECRET',
  'STRIPE_SECRET_KEY', 
  'VITE_STRIPE_PUBLIC_KEY',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE'
];

envVars.forEach(varName => {
  if (process.env[varName]) {
    if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
      console.log(`   ${varName}: [HIDDEN - check Secrets tab]`);
    } else {
      console.log(`   ${varName}: ${process.env[varName]}`);
    }
  } else {
    console.log(`   ${varName}: Not set`);
  }
});

console.log('\n📚 Next Steps:');
console.log('1. Share the DATABASE_URL with your collaborator securely');
console.log('2. They should add it to their Replit Secrets tab');
console.log('3. Both developers can use the same test accounts:');
console.log('   - admin@test.com / [CREDENTIALS_REMOVED]');
console.log('   - driver@test.com / [CREDENTIALS_REMOVED]'); 
console.log('   - customer@test.com / [CREDENTIALS_REMOVED]');
console.log('\n📖 See COLLABORATION_SETUP.md for detailed instructions\n');