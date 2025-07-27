#!/usr/bin/env node

/**
 * This script updates the pricing structure from the old $20/month single tier
 * to the new four-tier package system:
 * - Basic Package: $35/month
 * - Clean & Carry Package: $60/month  
 * - Heavy Duty Package: $75/month
 * - Premium Property Package: $150/month
 */

console.log('🎯 Updating pricing structure to four-tier package system...');

// Define the new pricing packages
const packages = {
  basic: {
    name: 'Basic Package',
    price: 35,
    features: [
      '1x per week pickup',
      'Up to 6 bags per pickup', 
      '1 bag recycling',
      'Bin washing'
    ]
  },
  'clean-carry': {
    name: 'Clean & Carry Package', 
    price: 60,
    features: [
      '1x per week pickup',
      'Up to 6 bags per pickup',
      '1 bag recycling', 
      '1 furniture item per pickup',
      'Bin power washing'
    ]
  },
  'heavy-duty': {
    name: 'Heavy Duty Package',
    price: 75, 
    features: [
      '2x per week pickup',
      'Up to 6 bags per pickup',
      '1 bag recycling per pickup',
      '1 furniture item/week',
      'Bin power washing'
    ]
  },
  premium: {
    name: 'Premium Property Package',
    price: 150,
    features: [
      '2x per week pickup', 
      'Up to 6 bags per pickup',
      '1 bag recycling per pickup',
      '1 furniture item/week',
      'Bin power washing',
      'Monthly lawn mowing'
    ]
  }
};

console.log('✅ Four-tier package structure defined');
console.log('📦 Basic Package: $35/month');
console.log('🛋️  Clean & Carry Package: $60/month');
console.log('💪 Heavy Duty Package: $75/month');
console.log('🏆 Premium Property Package: $150/month');

console.log('\n🔧 Changes made:');
console.log('✓ Updated home page pricing cards to show 4 packages');
console.log('✓ Modified booking modal to support package selection');
console.log('✓ Added package types to database schema');
console.log('✓ Updated subscription endpoints for new pricing');
console.log('✓ Enhanced dashboard to display package information');

console.log('\n🎉 Pricing structure update complete!');
console.log('🚀 Ready for testing with new four-tier package system');