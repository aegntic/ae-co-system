/**
 * Simplified performance test for current infrastructure
 */

import { performance } from 'perf_hooks';
import axios from 'axios';

async function testDashboardPerformance() {
  console.log('🚀 Testing DailyDoco Pro Dashboard Performance...\n');
  
  const results = {
    dashboard: { status: 'unknown', latency: 0 },
    api: { status: 'unknown', latency: 0 },
    database: { status: 'unknown', message: '' }
  };
  
  // Test Dashboard
  try {
    const start = performance.now();
    const response = await axios.get('http://localhost:5174', { timeout: 5000 });
    results.dashboard.latency = performance.now() - start;
    results.dashboard.status = response.status === 200 ? 'online' : 'error';
    console.log(`✅ Dashboard: ${results.dashboard.status} (${results.dashboard.latency.toFixed(2)}ms)`);
  } catch (error) {
    results.dashboard.status = 'offline';
    console.log('❌ Dashboard: offline');
  }
  
  // Test API (if running)
  try {
    const start = performance.now();
    const response = await axios.get('http://localhost:8080/health', { timeout: 5000 });
    results.api.latency = performance.now() - start;
    results.api.status = response.status === 200 ? 'online' : 'error';
    console.log(`✅ API Server: ${results.api.status} (${results.api.latency.toFixed(2)}ms)`);
  } catch (error) {
    results.api.status = 'offline';
    console.log('❌ API Server: offline');
  }
  
  // Check Database
  const { Pool } = await import('pg');
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'dailydoco',
    user: 'dailydoco',
    password: 'dailydoco',
    max: 1,
    connectionTimeoutMillis: 5000
  });
  
  try {
    const start = performance.now();
    const result = await pool.query('SELECT 1');
    const latency = performance.now() - start;
    results.database.status = 'online';
    results.database.latency = latency;
    console.log(`✅ Database: online (${latency.toFixed(2)}ms)`);
    
    // Check if 100b schema exists
    const schemaCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users_master'
      );
    `);
    
    if (schemaCheck.rows[0].exists) {
      console.log('✅ $100B Schema: Applied');
      results.database.message = '100b-schema applied';
    } else {
      console.log('❌ $100B Schema: Not found');
      results.database.message = '100b-schema missing';
    }
  } catch (error) {
    results.database.status = 'offline';
    console.log('❌ Database: offline');
  } finally {
    await pool.end();
  }
  
  // Summary
  console.log('\n📊 Performance Summary:');
  console.log('=======================');
  console.log(`Dashboard: ${results.dashboard.status} ${results.dashboard.latency > 0 ? `(${results.dashboard.latency.toFixed(2)}ms)` : ''}`);
  console.log(`API Server: ${results.api.status}`);
  console.log(`Database: ${results.database.status} ${results.database.message ? `- ${results.database.message}` : ''}`);
  
  // $100B Readiness Check
  console.log('\n🎯 $100B Readiness Status:');
  console.log('==========================');
  
  const readiness = {
    infrastructure: results.database.status === 'online' ? '✅' : '❌',
    schema: results.database.message.includes('applied') ? '✅' : '❌',
    performance: results.dashboard.latency < 100 ? '✅' : '❌',
    scale: '🚧' // In progress
  };
  
  console.log(`Infrastructure: ${readiness.infrastructure} ${results.database.status === 'online' ? 'Ready' : 'Not Ready'}`);
  console.log(`$100B Schema: ${readiness.schema} ${results.database.message.includes('applied') ? 'Applied' : 'Needs Migration'}`);
  console.log(`Performance: ${readiness.performance} ${results.dashboard.latency < 100 ? 'Acceptable' : 'Needs Optimization'}`);
  console.log(`Scale Testing: ${readiness.scale} Pending full infrastructure deployment`);
  
  const allReady = Object.values(readiness).filter(v => v === '✅').length;
  console.log(`\nOverall Readiness: ${allReady}/3 checks passed (${(allReady/3*100).toFixed(0)}%)`);
}

// Run the test
testDashboardPerformance().catch(console.error);