#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';

class BrowserPerformanceTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.devServer = null;
  }

  async startDevServer() {
    console.log('🚀 Starting development server...');
    
    try {
      // Kill any existing processes on common ports
      try {
        execSync('pkill -f "vite.*5173"', { stdio: 'ignore' });
        execSync('pkill -f "bun.*api-server"', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // Ignore if no processes to kill
      }

      // Start the development server
      const spawn = (await import('child_process')).spawn;
      this.devServer = spawn('bun', ['run', 'dev:vite'], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Wait for server to be ready
      let retries = 30;
      let serverReady = false;
      
      while (retries > 0 && !serverReady) {
        try {
          const response = await fetch('http://localhost:5173', { 
            method: 'HEAD',
            timeout: 1000 
          });
          if (response.ok) {
            serverReady = true;
            console.log('✅ Development server ready');
            break;
          }
        } catch (e) {
          // Server not ready yet
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }

      if (!serverReady) {
        throw new Error('Development server failed to start');
      }

      return true;
    } catch (error) {
      console.error('Failed to start development server:', error.message);
      return false;
    }
  }

  async setupBrowser() {
    console.log('🌐 Launching browser for testing...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    
    // Set up request interception for monitoring
    await this.page.setRequestInterception(true);
    this.networkRequests = [];
    
    this.page.on('request', (request) => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
      request.continue();
    });
    
    this.page.on('response', (response) => {
      const request = this.networkRequests.find(req => req.url === response.url());
      if (request) {
        request.status = response.status();
        request.responseTime = Date.now() - request.timestamp;
        request.headers = response.headers();
      }
    });
  }

  async measureInitialLoad() {
    console.log('⚡ Measuring initial page load performance...');
    
    const startTime = Date.now();
    
    // Navigate to the page
    await this.page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Get Core Web Vitals and other metrics
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        
        // Get paint metrics
        const paintMetrics = performance.getEntriesByType('paint');
        paintMetrics.forEach(metric => {
          if (metric.name === 'first-contentful-paint') {
            vitals.fcp = metric.startTime;
          }
        });
        
        // Get largest contentful paint
        if ('LargestContentfulPaint' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // Get cumulative layout shift
        let clsScore = 0;
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
          vitals.cls = clsScore;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Get Time to Interactive approximation
        vitals.tti = performance.now();
        
        // Get memory info if available
        if (performance.memory) {
          vitals.memory = {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          };
        }
        
        // Wait a bit for metrics to settle
        setTimeout(() => resolve(vitals), 2000);
      });
    });
    
    return {
      loadTime,
      metrics,
      networkRequests: this.networkRequests.length,
      resourceBreakdown: this.analyzeNetworkRequests()
    };
  }

  async measureInteractionPerformance() {
    console.log('🖱️ Testing interaction performance...');
    
    const interactions = {};
    
    try {
      // Test URL input responsiveness
      const urlInput = await this.page.$('input[type="url"], input[placeholder*="github"]');
      if (urlInput) {
        const inputStart = Date.now();
        await urlInput.click();
        await urlInput.type('https://github.com/microsoft/vscode');
        interactions.inputResponse = Date.now() - inputStart;
      }
      
      // Test button interaction
      const button = await this.page.$('button:not([disabled])');
      if (button) {
        const clickStart = Date.now();
        await button.click();
        
        // Wait for loading state to appear
        try {
          await this.page.waitForSelector('[class*="spinner"], [class*="loading"]', { 
            timeout: 5000 
          });
          interactions.loadingStateAppears = Date.now() - clickStart;
        } catch (e) {
          // Loading state might not appear or might be too fast
          interactions.loadingStateAppears = 'N/A';
        }
        
        interactions.clickResponse = Date.now() - clickStart;
      }
      
      // Test scroll performance
      const scrollStart = Date.now();
      await this.page.evaluate(() => {
        window.scrollTo(0, window.innerHeight);
        window.scrollTo(0, 0);
      });
      interactions.scrollPerformance = Date.now() - scrollStart;
      
    } catch (error) {
      console.warn('Some interaction tests failed:', error.message);
    }
    
    return interactions;
  }

  async measureMemoryUsage() {
    console.log('💾 Analyzing memory usage patterns...');
    
    const measurements = [];
    
    // Take initial measurement
    let initialMemory = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    if (initialMemory) {
      measurements.push({ 
        phase: 'initial', 
        used: Math.round(initialMemory.used / 1024 / 1024),
        total: Math.round(initialMemory.total / 1024 / 1024)
      });
    }
    
    // Simulate some interactions and measure memory
    try {
      // Trigger some UI interactions
      await this.page.evaluate(() => {
        // Simulate mouse movements
        for (let i = 0; i < 10; i++) {
          const event = new MouseEvent('mousemove', {
            clientX: Math.random() * window.innerWidth,
            clientY: Math.random() * window.innerHeight
          });
          document.dispatchEvent(event);
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let afterInteraction = await this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (afterInteraction) {
        measurements.push({ 
          phase: 'after_interaction', 
          used: Math.round(afterInteraction.used / 1024 / 1024),
          total: Math.round(afterInteraction.total / 1024 / 1024)
        });
      }
    } catch (e) {
      console.warn('Memory measurement failed:', e.message);
    }
    
    return measurements;
  }

  analyzeNetworkRequests() {
    const breakdown = {
      total: this.networkRequests.length,
      byType: {},
      byStatus: {},
      slowRequests: [],
      averageResponseTime: 0
    };
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    this.networkRequests.forEach(req => {
      // By resource type
      breakdown.byType[req.resourceType] = (breakdown.byType[req.resourceType] || 0) + 1;
      
      // By status
      if (req.status) {
        breakdown.byStatus[req.status] = (breakdown.byStatus[req.status] || 0) + 1;
        
        // Response time analysis
        if (req.responseTime) {
          totalResponseTime += req.responseTime;
          responseCount++;
          
          if (req.responseTime > 1000) {
            breakdown.slowRequests.push({
              url: req.url,
              responseTime: req.responseTime,
              type: req.resourceType
            });
          }
        }
      }
    });
    
    breakdown.averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    
    return breakdown;
  }

  async generateReport(initialLoad, interactions, memory) {
    const report = {
      timestamp: new Date().toISOString(),
      browserTest: {
        initialLoad,
        interactions,
        memory,
        performance: {
          loadTimeMs: initialLoad.loadTime,
          fcpMs: Math.round(initialLoad.metrics.fcp || 0),
          lcpMs: Math.round(initialLoad.metrics.lcp || 0),
          clsScore: initialLoad.metrics.cls || 0,
          ttiMs: Math.round(initialLoad.metrics.tti || 0),
          memoryUsageMB: initialLoad.metrics.memory?.used || 0
        },
        network: initialLoad.resourceBreakdown
      },
      assessment: {
        grade: this.calculateGrade(initialLoad, interactions),
        criticalIssues: this.identifyCriticalIssues(initialLoad, interactions),
        recommendations: this.generateRecommendations(initialLoad, interactions, memory)
      }
    };
    
    // Save report
    fs.writeFileSync('./dist/browser-performance-report.json', JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n🏆 BROWSER PERFORMANCE RESULTS');
    console.log('===============================');
    console.log(`Grade: ${report.assessment.grade}`);
    console.log(`Load Time: ${initialLoad.loadTime}ms`);
    console.log(`FCP: ${Math.round(initialLoad.metrics.fcp || 0)}ms`);
    console.log(`LCP: ${Math.round(initialLoad.metrics.lcp || 0)}ms`);
    console.log(`CLS: ${(initialLoad.metrics.cls || 0).toFixed(3)}`);
    console.log(`Memory Usage: ${initialLoad.metrics.memory?.used || 'N/A'}MB`);
    console.log(`Network Requests: ${initialLoad.networkRequests}`);
    console.log(`Critical Issues: ${report.assessment.criticalIssues.length}`);
    
    if (report.assessment.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      report.assessment.criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: dist/browser-performance-report.json`);
    
    return report;
  }

  calculateGrade(initialLoad, interactions) {
    let score = 100;
    
    // Load time scoring
    if (initialLoad.loadTime > 3000) score -= 20;
    else if (initialLoad.loadTime > 2000) score -= 10;
    else if (initialLoad.loadTime > 1000) score -= 5;
    
    // Core Web Vitals scoring
    if (initialLoad.metrics.lcp > 2500) score -= 15;
    else if (initialLoad.metrics.lcp > 1800) score -= 8;
    
    if (initialLoad.metrics.fcp > 1800) score -= 10;
    else if (initialLoad.metrics.fcp > 1200) score -= 5;
    
    if (initialLoad.metrics.cls > 0.25) score -= 15;
    else if (initialLoad.metrics.cls > 0.1) score -= 8;
    
    // Memory usage scoring
    if (initialLoad.metrics.memory?.used > 100) score -= 10;
    else if (initialLoad.metrics.memory?.used > 50) score -= 5;
    
    // Network performance
    if (initialLoad.resourceBreakdown.averageResponseTime > 500) score -= 10;
    
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  identifyCriticalIssues(initialLoad, interactions) {
    const issues = [];
    
    if (initialLoad.loadTime > 3000) {
      issues.push(`Slow initial load: ${initialLoad.loadTime}ms (target: <2000ms)`);
    }
    
    if (initialLoad.metrics.lcp > 2500) {
      issues.push(`Poor LCP: ${Math.round(initialLoad.metrics.lcp)}ms (target: <1800ms)`);
    }
    
    if (initialLoad.metrics.cls > 0.25) {
      issues.push(`High layout shift: ${initialLoad.metrics.cls.toFixed(3)} (target: <0.1)`);
    }
    
    if (initialLoad.metrics.memory?.used > 100) {
      issues.push(`High memory usage: ${initialLoad.metrics.memory.used}MB (target: <50MB)`);
    }
    
    if (initialLoad.resourceBreakdown.slowRequests.length > 0) {
      issues.push(`${initialLoad.resourceBreakdown.slowRequests.length} slow network requests (>1s)`);
    }
    
    return issues;
  }

  generateRecommendations(initialLoad, interactions, memory) {
    const recommendations = [];
    
    if (initialLoad.loadTime > 2000) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Load Performance',
        solution: 'Implement resource preloading and optimize critical rendering path'
      });
    }
    
    if (initialLoad.metrics.lcp > 1800) {
      recommendations.push({
        priority: 'HIGH',
        category: 'LCP Optimization',
        solution: 'Optimize largest contentful paint element (images, fonts, layout)'
      });
    }
    
    if (initialLoad.resourceBreakdown.averageResponseTime > 300) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Network Performance',
        solution: 'Implement caching and optimize API response times'
      });
    }
    
    if (initialLoad.metrics.memory?.used > 50) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Memory Optimization',
        solution: 'Implement memory-efficient patterns and cleanup'
      });
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    if (this.devServer) {
      this.devServer.kill('SIGTERM');
      // Also kill any remaining processes
      try {
        execSync('pkill -f "vite.*5173"', { stdio: 'ignore' });
      } catch (e) {
        // Ignore
      }
    }
  }
}

// Main execution
async function main() {
  const tester = new BrowserPerformanceTester();
  
  try {
    const serverStarted = await tester.startDevServer();
    if (!serverStarted) {
      console.error('❌ Could not start development server');
      process.exit(1);
    }
    
    await tester.setupBrowser();
    
    const initialLoad = await tester.measureInitialLoad();
    const interactions = await tester.measureInteractionPerformance();
    const memory = await tester.measureMemoryUsage();
    
    const report = await tester.generateReport(initialLoad, interactions, memory);
    
    // Return appropriate exit code
    if (report.assessment.criticalIssues.length > 2) {
      process.exit(1);
    } else if (report.assessment.criticalIssues.length > 0) {
      process.exit(0);
    } else {
      console.log('\n✅ All browser performance tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Browser performance test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}