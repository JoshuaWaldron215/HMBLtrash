#!/usr/bin/env tsx
/**
 * Test script for route optimization system
 * Run with: npx tsx server/testRouteOptimizer.ts
 */

import { routeOptimizationService, type Address, type OptimizedRoute } from './routeOptimizer';

/**
 * Test the complete route optimization flow
 */
async function testRouteOptimization() {
  console.log('🧪 Testing Route Optimization System\n');
  
  try {
    // Step 1: Get mock addresses
    console.log('📍 Step 1: Loading test addresses');
    const addresses = routeOptimizationService.getMockAddresses();
    console.log(`   → Loaded ${addresses.length} pickup addresses`);
    console.log(`   → Sample: ${addresses[0].name} - ${addresses[0].fullAddress}\n`);
    
    // Step 2: Run optimization
    console.log('🚀 Step 2: Running route optimization...');
    const startTime = Date.now();
    const optimizedRoutes = await routeOptimizationService.optimizePickupRoutes(addresses);
    const endTime = Date.now();
    
    console.log(`   → Optimization completed in ${endTime - startTime}ms`);
    console.log(`   → Generated ${optimizedRoutes.length} optimized routes\n`);
    
    // Step 3: Display results
    console.log('📊 Step 3: Optimization Results\n');
    console.log('=' .repeat(80));
    
    optimizedRoutes.forEach((route, index) => {
      console.log(`\n🗓️  ROUTE ${index + 1}: ${route.day.toUpperCase()}`);
      console.log('-'.repeat(50));
      console.log(`📦 Stops: ${route.optimizedStops.length}`);
      console.log(`🛣️  Total Distance: ${route.totalDistance}`);
      console.log(`⏱️  Total Duration: ${route.totalDuration}`);
      console.log(`🚛 Start/End: ${route.startPoint.name}`);
      
      console.log('\n📋 Pickup Schedule:');
      route.optimizedStops.forEach((stop, i) => {
        console.log(`   ${i + 1}. ${stop.name}`);
        console.log(`      📍 ${stop.fullAddress}`);
        if (stop.notes) {
          console.log(`      📝 ${stop.notes}`);
        }
      });
      
      console.log('\n🗺️  Navigation:');
      console.log(`   Google Maps: ${route.googleMapsUrl}`);
      
      console.log('\n🧭 Turn-by-Turn Directions:');
      route.directions.forEach(direction => {
        console.log(`   ${direction.stepNumber}. ${direction.instruction}`);
        console.log(`      ${direction.distance} • ${direction.duration}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Step 4: Test retrieval functions
    console.log('\n🔍 Step 4: Testing retrieval functions');
    
    const retrievedRoutes = routeOptimizationService.getOptimizedRoutes();
    console.log(`   → Retrieved routes: ${retrievedRoutes?.length || 0}`);
    
    const mondayRoute = routeOptimizationService.getRouteByDay('Monday');
    console.log(`   → Monday route: ${mondayRoute ? 'Found' : 'Not found'}`);
    if (mondayRoute) {
      console.log(`     • ${mondayRoute.optimizedStops.length} stops`);
      console.log(`     • ${mondayRoute.totalDistance}, ${mondayRoute.totalDuration}`);
    }
    
    // Step 5: Generate summary
    console.log('\n📈 Step 5: Optimization Summary');
    console.log('-'.repeat(40));
    
    const totalStops = optimizedRoutes.reduce((sum, route) => sum + route.optimizedStops.length, 0);
    const totalDistance = optimizedRoutes.reduce((sum, route) => {
      return sum + parseFloat(route.totalDistance.replace(' mi', ''));
    }, 0);
    const totalDuration = optimizedRoutes.reduce((sum, route) => {
      return sum + parseInt(route.totalDuration.replace(' min', ''));
    }, 0);
    
    console.log(`📦 Total Addresses Processed: ${addresses.length}`);
    console.log(`🗓️  Routes Generated: ${optimizedRoutes.length} days`);
    console.log(`📍 Total Optimized Stops: ${totalStops}`);
    console.log(`🛣️  Total Route Distance: ${totalDistance.toFixed(1)} miles`);
    console.log(`⏱️  Total Estimated Time: ${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`);
    console.log(`📊 Average Stops per Route: ${(totalStops / optimizedRoutes.length).toFixed(1)}`);
    console.log(`🚗 Average Distance per Route: ${(totalDistance / optimizedRoutes.length).toFixed(1)} miles`);
    
    console.log('\n✅ Route optimization test completed successfully!');
    
    return {
      success: true,
      routes: optimizedRoutes,
      metrics: {
        totalAddresses: addresses.length,
        totalRoutes: optimizedRoutes.length,
        totalStops,
        totalDistance: totalDistance.toFixed(1) + ' mi',
        totalDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
        processingTime: `${endTime - startTime}ms`
      }
    };
    
  } catch (error) {
    console.error('❌ Route optimization test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test API endpoints simulation
 */
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoint Simulation\n');
  
  try {
    // Simulate the main optimization endpoint
    console.log('📡 POST /api/admin/optimize-routes');
    const result = await testRouteOptimization();
    
    if (result.success) {
      console.log('   ✅ Status: 200 OK');
      console.log(`   📊 Response: ${result.routes?.length} routes optimized`);
    } else {
      console.log('   ❌ Status: 500 Error');
      console.log(`   🚨 Error: ${result.error}`);
    }
    
    // Simulate retrieval endpoints
    console.log('\n📡 GET /api/admin/optimized-routes');
    const routes = routeOptimizationService.getOptimizedRoutes();
    if (routes) {
      console.log('   ✅ Status: 200 OK');
      console.log(`   📦 Response: ${routes.length} routes found`);
    } else {
      console.log('   ❌ Status: 404 Not Found');
    }
    
    console.log('\n📡 GET /api/admin/route/monday');
    const mondayRoute = routeOptimizationService.getRouteByDay('Monday');
    if (mondayRoute) {
      console.log('   ✅ Status: 200 OK');
      console.log(`   🗓️  Response: Monday route with ${mondayRoute.optimizedStops.length} stops`);
    } else {
      console.log('   ❌ Status: 404 Not Found');
    }
    
    console.log('\n📡 GET /api/admin/mock-addresses');
    const mockAddresses = routeOptimizationService.getMockAddresses();
    console.log('   ✅ Status: 200 OK');
    console.log(`   📍 Response: ${mockAddresses.length} mock addresses`);
    
    console.log('\n📡 DELETE /api/admin/clear-routes');
    routeOptimizationService.clearRoutes();
    console.log('   ✅ Status: 200 OK');
    console.log('   🗑️  Response: Routes cleared');
    
  } catch (error) {
    console.error('❌ API endpoint test failed:', error);
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🎯 ROUTE OPTIMIZATION SYSTEM TEST');
  console.log('==================================\n');
  
  await testRouteOptimization();
  await testAPIEndpoints();
  
  console.log('\n🏁 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Test endpoints via HTTP requests');
  console.log('2. Integrate with admin dashboard');
  console.log('3. Add real Google Maps API integration');
  console.log('4. Connect to actual pickup database');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testRouteOptimization, testAPIEndpoints };