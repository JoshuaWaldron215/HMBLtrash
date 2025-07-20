import { pickupRouteManager } from './pickupRouteManager';

async function testPricing() {
  console.log('🧪 Testing Updated Pricing Structure...\n');
  
  const testCases = [
    // One-time next-day pricing
    { serviceType: 'one-time', priority: 'next-day', bagCount: 1, expected: 15.00 },
    { serviceType: 'one-time', priority: 'next-day', bagCount: 2, expected: 20.00 },
    { serviceType: 'one-time', priority: 'next-day', bagCount: 3, expected: 30.00 },
    { serviceType: 'one-time', priority: 'next-day', bagCount: 4, expected: 40.00 },
    { serviceType: 'one-time', priority: 'next-day', bagCount: 5, expected: 50.00 },
    
    // One-time same-day pricing
    { serviceType: 'one-time', priority: 'same-day', bagCount: 1, expected: 25.00 },
    { serviceType: 'one-time', priority: 'same-day', bagCount: 2, expected: 35.00 },
    { serviceType: 'one-time', priority: 'same-day', bagCount: 3, expected: 45.00 },
    
    // Immediate service pricing (50% premium)
    { serviceType: 'one-time', priority: 'immediate', bagCount: 1, expected: 37.50 }, // 25 * 1.5
    { serviceType: 'one-time', priority: 'immediate', bagCount: 2, expected: 52.50 }, // 35 * 1.5
    
    // Subscription pricing
    { serviceType: 'subscription', priority: 'normal', bagCount: 1, expected: 12.00 },
    { serviceType: 'subscription', priority: 'normal', bagCount: 3, expected: 25.00 },
    { serviceType: 'subscription', priority: 'normal', bagCount: 5, expected: 35.00 }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const actualPrice = pickupRouteManager.calculatePickupPricing(
      test.serviceType,
      test.priority,
      test.bagCount
    );
    
    const isCorrect = actualPrice === test.expected;
    const status = isCorrect ? '✅' : '❌';
    
    console.log(`${status} ${test.serviceType} (${test.priority}) ${test.bagCount} bags: $${actualPrice.toFixed(2)} ${isCorrect ? '' : `(expected $${test.expected.toFixed(2)})`}`);
    
    if (isCorrect) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All pricing tests passed! The pricing structure is correctly aligned.');
  } else {
    console.log('⚠️  Some pricing tests failed. Please review the pricing logic.');
  }
}

testPricing().then(() => {
  console.log('\n✅ Pricing test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});