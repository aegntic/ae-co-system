#!/usr/bin/env node

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import fs from 'fs';

class APIPerformanceTester {
  constructor() {
    this.apiServer = null;
    this.baseUrl = 'http://localhost:3001';
  }

  async startAPIServer() {
    console.log('🚀 Starting API server...');
    
    try {
      // Kill any existing API server processes
      try {
        execSync('pkill -f "api-server.js"', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // Ignore if no processes to kill
      }

      // Start the API server
      this.apiServer = spawn('bun', ['server/api-server.js'], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Wait for server to be ready
      let retries = 20;
      let serverReady = false;
      
      while (retries > 0 && !serverReady) {
        try {
          const response = await fetch(`${this.baseUrl}/api/health`, { 
            method: 'GET',
            timeout: 1000 
          });
          if (response.ok) {
            serverReady = true;
            console.log('✅ API server ready');
            break;
          }
        } catch (e) {
          // Server not ready yet
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }

      if (!serverReady) {
        throw new Error('API server failed to start');
      }

      return true;
    } catch (error) {
      console.error('Failed to start API server:', error.message);
      return false;
    }
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing health endpoint performance...');
    
    const results = [];
    const testCount = 50;
    
    for (let i = 0; i < testCount; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}/api/health`);
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        results.push({
          iteration: i + 1,
          responseTime,
          status: response.status,
          success: response.ok,
          size: JSON.stringify(data).length
        });
        
      } catch (error) {
        results.push({
          iteration: i + 1,
          responseTime: Date.now() - startTime,
          status: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    return this.analyzeResults('health', results);
  }

  async testLeadCaptureEndpoint() {
    console.log('📝 Testing lead capture endpoint performance...');
    
    const results = [];
    const testCount = 30;
    
    for (let i = 0; i < testCount; i++) {
      const startTime = Date.now();
      
      const testData = {
        email: `test${i}@example.com`,
        siteId: `test-site-${i}`,
        projectType: 'web-app',
        template: 'tech-showcase',
        projectInterests: ['Web Development', 'AI/ML'],
        socialPlatforms: ['github', 'linkedin'],
        newsletterOptIn: true,
        metadata: {
          sessionId: `test-session-${i}`,
          timeOnSite: 120 + Math.random() * 180,
          scrollDepth: 60 + Math.random() * 40,
          sectionsViewed: ['hero', 'features', 'demo'],
          interactionCount: Math.floor(Math.random() * 10) + 1,
          deviceType: 'desktop',
          screenResolution: '1920x1080',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referrer: 'https://github.com',
          timezone: 'America/New_York',
          language: 'en-US'
        },
        captureTimestamp: new Date().toISOString()
      };
      
      try {
        const response = await fetch(`${this.baseUrl}/api/leads/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        results.push({
          iteration: i + 1,
          responseTime,
          status: response.status,
          success: response.ok,
          size: JSON.stringify(data).length,
          leadScore: data.leadScore || 0
        });
        
      } catch (error) {
        results.push({
          iteration: i + 1,
          responseTime: Date.now() - startTime,
          status: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    return this.analyzeResults('lead-capture', results);
  }

  async testConcurrentLoad() {
    console.log('⚡ Testing concurrent load performance...');
    
    const concurrentRequests = 20;
    const promises = [];
    
    const startTime = Date.now();
    
    // Create concurrent health check requests
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        fetch(`${this.baseUrl}/api/health`)
          .then(response => response.json())
          .then(data => ({
            success: true,
            responseTime: Date.now() - startTime,
            data
          }))
          .catch(error => ({
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
          }))
      );
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successful = results.filter(r => r.success).length;
    const avgResponseTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / successful;
    
    return {
      endpoint: 'concurrent-health',
      concurrentRequests,
      successful,
      failed: concurrentRequests - successful,
      totalTime,
      averageResponseTime: Math.round(avgResponseTime),
      throughput: Math.round((successful / totalTime) * 1000), // requests per second
      results
    };
  }

  async testDatabaseOperations() {
    console.log('💾 Testing database operation performance...');
    
    // Test multiple lead capture operations to simulate database load
    const dbTests = [];
    const testCount = 10;
    
    for (let i = 0; i < testCount; i++) {
      const startTime = Date.now();
      
      const testData = {
        email: `dbtest${Date.now()}${i}@example.com`,
        siteId: `db-test-site-${i}`,
        projectType: 'web-app',
        template: 'tech-showcase',
        projectInterests: ['Web Development', 'Backend Systems'],
        socialPlatforms: ['github'],
        newsletterOptIn: true,
        metadata: {
          sessionId: `db-test-session-${i}`,
          timeOnSite: 150,
          scrollDepth: 75,
          sectionsViewed: ['hero', 'features'],
          interactionCount: 5,
          deviceType: 'desktop',
          screenResolution: '1920x1080',
          userAgent: 'Mozilla/5.0 (DB Test)',
          referrer: 'direct',
          timezone: 'UTC',
          language: 'en-US'
        },
        captureTimestamp: new Date().toISOString()
      };
      
      try {
        const response = await fetch(`${this.baseUrl}/api/leads/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        dbTests.push({
          operation: 'create',
          responseTime,
          success: response.ok,
          leadId: data.leadId
        });
        
        // Test update operation (same email, same site)
        if (response.ok) {
          const updateStart = Date.now();
          testData.projectInterests = ['Web Development', 'AI/ML', 'DevOps'];
          
          const updateResponse = await fetch(`${this.baseUrl}/api/leads/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
          });
          
          const updateTime = Date.now() - updateStart;
          
          dbTests.push({
            operation: 'update',
            responseTime: updateTime,
            success: updateResponse.ok
          });
        }
        
      } catch (error) {
        dbTests.push({
          operation: 'create',
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message
        });
      }
    }
    
    return this.analyzeResults('database-operations', dbTests);
  }

  analyzeResults(testName, results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const responseTimes = successful.map(r => r.responseTime);
    const avgResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length) : 0;
    
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    
    return {
      testName,
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round((successful.length / results.length) * 100),
      performance: {
        averageResponseTime: avgResponseTime,
        minResponseTime,
        maxResponseTime,
        p50ResponseTime: p50,
        p95ResponseTime: p95,
        p99ResponseTime: p99
      },
      details: results
    };
  }

  async generateAPIPerformanceReport(healthTest, leadTest, concurrentTest, dbTest) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallGrade: this.calculateAPIGrade(healthTest, leadTest, concurrentTest),
        healthEndpoint: healthTest,
        leadCaptureEndpoint: leadTest,
        concurrentLoad: concurrentTest,
        databaseOperations: dbTest
      },
      assessment: {
        criticalIssues: this.identifyAPICriticalIssues(healthTest, leadTest, concurrentTest),
        recommendations: this.generateAPIRecommendations(healthTest, leadTest, concurrentTest, dbTest)
      }
    };
    
    // Save report
    fs.writeFileSync('./dist/api-performance-report.json', JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n🏆 API PERFORMANCE RESULTS');
    console.log('===========================');
    console.log(`Overall Grade: ${report.summary.overallGrade}`);
    console.log(`\nHealth Endpoint:`);
    console.log(`  Average Response: ${healthTest.performance.averageResponseTime}ms`);
    console.log(`  Success Rate: ${healthTest.successRate}%`);
    console.log(`  P95 Response: ${healthTest.performance.p95ResponseTime}ms`);
    
    console.log(`\nLead Capture Endpoint:`);
    console.log(`  Average Response: ${leadTest.performance.averageResponseTime}ms`);
    console.log(`  Success Rate: ${leadTest.successRate}%`);
    console.log(`  P95 Response: ${leadTest.performance.p95ResponseTime}ms`);
    
    console.log(`\nConcurrent Load (${concurrentTest.concurrentRequests} requests):`);
    console.log(`  Success Rate: ${Math.round((concurrentTest.successful/concurrentTest.concurrentRequests)*100)}%`);
    console.log(`  Throughput: ${concurrentTest.throughput} req/s`);
    console.log(`  Average Response: ${concurrentTest.averageResponseTime}ms`);
    
    console.log(`\nDatabase Operations:`);
    console.log(`  Average Response: ${dbTest.performance.averageResponseTime}ms`);
    console.log(`  Success Rate: ${dbTest.successRate}%`);
    
    if (report.assessment.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      report.assessment.criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: dist/api-performance-report.json`);
    
    return report;
  }

  calculateAPIGrade(healthTest, leadTest, concurrentTest) {
    let score = 100;
    
    // Health endpoint performance
    if (healthTest.performance.averageResponseTime > 200) score -= 15;
    else if (healthTest.performance.averageResponseTime > 100) score -= 8;
    
    if (healthTest.successRate < 100) score -= 20;
    
    // Lead capture performance
    if (leadTest.performance.averageResponseTime > 500) score -= 20;
    else if (leadTest.performance.averageResponseTime > 300) score -= 10;
    
    if (leadTest.successRate < 95) score -= 15;
    
    // Concurrent load performance
    if (concurrentTest.successful < concurrentTest.concurrentRequests * 0.9) score -= 25;
    
    // P95 response time penalty
    if (leadTest.performance.p95ResponseTime > 1000) score -= 10;
    
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  identifyAPICriticalIssues(healthTest, leadTest, concurrentTest) {
    const issues = [];
    
    if (healthTest.performance.averageResponseTime > 200) {
      issues.push(`Health endpoint slow: ${healthTest.performance.averageResponseTime}ms (target: <100ms)`);
    }
    
    if (leadTest.performance.averageResponseTime > 500) {
      issues.push(`Lead capture slow: ${leadTest.performance.averageResponseTime}ms (target: <300ms)`);
    }
    
    if (healthTest.successRate < 100) {
      issues.push(`Health endpoint failures: ${healthTest.failed} failed requests`);
    }
    
    if (leadTest.successRate < 95) {
      issues.push(`Lead capture failures: ${leadTest.failed} failed requests`);
    }
    
    if (concurrentTest.successful < concurrentTest.concurrentRequests * 0.9) {
      issues.push(`Poor concurrent performance: ${concurrentTest.failed}/${concurrentTest.concurrentRequests} failed`);
    }
    
    if (leadTest.performance.p95ResponseTime > 1000) {
      issues.push(`High P95 response time: ${leadTest.performance.p95ResponseTime}ms (target: <800ms)`);
    }
    
    return issues;
  }

  generateAPIRecommendations(healthTest, leadTest, concurrentTest, dbTest) {
    const recommendations = [];
    
    if (leadTest.performance.averageResponseTime > 300) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Response Time',
        solution: 'Optimize database queries, add connection pooling, implement caching'
      });
    }
    
    if (concurrentTest.successful < concurrentTest.concurrentRequests * 0.95) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Concurrency',
        solution: 'Implement proper connection management and rate limiting'
      });
    }
    
    if (dbTest.performance.averageResponseTime > 400) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Database Performance',
        solution: 'Add database indexing, optimize queries, consider read replicas'
      });
    }
    
    if (leadTest.performance.p95ResponseTime > 800) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Tail Latency',
        solution: 'Implement query optimization and connection timeouts'
      });
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Cleaning up API server...');
    
    if (this.apiServer) {
      this.apiServer.kill('SIGTERM');
      
      // Kill any remaining processes
      try {
        execSync('pkill -f "api-server.js"', { stdio: 'ignore' });
      } catch (e) {
        // Ignore
      }
    }
  }
}

// Main execution
async function main() {
  const tester = new APIPerformanceTester();
  
  try {
    const serverStarted = await tester.startAPIServer();
    if (!serverStarted) {
      console.error('❌ Could not start API server');
      process.exit(1);
    }
    
    const healthTest = await tester.testHealthEndpoint();
    const leadTest = await tester.testLeadCaptureEndpoint();
    const concurrentTest = await tester.testConcurrentLoad();
    const dbTest = await tester.testDatabaseOperations();
    
    const report = await tester.generateAPIPerformanceReport(healthTest, leadTest, concurrentTest, dbTest);
    
    // Return appropriate exit code
    if (report.assessment.criticalIssues.length > 3) {
      process.exit(1);
    } else if (report.assessment.criticalIssues.length > 0) {
      process.exit(0);
    } else {
      console.log('\n✅ All API performance tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('API performance test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}