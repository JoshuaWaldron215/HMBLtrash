// Test script to verify live payment intent creation
const fetch = require('node-fetch');

async function testLivePayment() {
  try {
    // Login as user
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aqeelbacchus@gmail.com',
        password: 'welcome123'
      })
    });
    
    const loginData = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie');
    
    console.log('Login successful:', loginData.username);
    
    // Test subscription creation
    console.log('\nTesting subscription creation...');
    const subscriptionResponse = await fetch('http://localhost:5000/api/create-subscription', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        packageType: 'basic'
      })
    });
    
    const subscriptionData = await subscriptionResponse.json();
    console.log('\nSubscription response:', JSON.stringify(subscriptionData, null, 2));
    
    if (subscriptionData.clientSecret) {
      console.log('✅ SUCCESS: Client secret received!');
      console.log('Payment intent is ready for processing');
    } else {
      console.log('❌ FAILED: No client secret received');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLivePayment();