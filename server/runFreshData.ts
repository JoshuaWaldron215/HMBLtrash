import { resetAndCreateFreshData } from './createFreshTestData';

// Run the fresh data creation
resetAndCreateFreshData().then(() => {
  console.log('✅ Fresh data creation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});