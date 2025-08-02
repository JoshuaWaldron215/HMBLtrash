#!/usr/bin/env node
/**
 * Subscription Scheduler Script
 * Run this to generate upcoming pickups for all active subscriptions
 * Can be run manually or set up as a cron job
 */

import { generateUpcomingPickups } from './subscriptionScheduler';

async function runScheduler() {
  console.log('🚀 Starting subscription scheduler...');
  
  try {
    await generateUpcomingPickups();
    console.log('✅ Subscription scheduler completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Subscription scheduler failed:', error);
    process.exit(1);
  }
}

// Run the scheduler
runScheduler();