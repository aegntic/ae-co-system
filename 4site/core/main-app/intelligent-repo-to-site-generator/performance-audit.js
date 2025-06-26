#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const AUDIT_CONFIG = {
  url: 'http://localhost:5173',
  apiUrl: 'http://localhost:3001',
  testRepo: 'https://github.com/microsoft/vscode',
  timeout: 30000,
  performance: {
    targetLCP: 1800, // ms
    targetFID: 100,  // ms  
    targetCLS: 0.1,
    targetTTI: 3000, // ms
    targetFCP: 1500, // ms
  },
  bundle: {
    targetUtilization: 75, // %
    maxBundleSize: 500, // KB (gzipped)
    maxChunks: 10
  },
  api: {
    targetResponseTime: 200, // ms
    concurrentUsers: 100
  }
};

class PerformanceAuditor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      bundle: {},
      runtime: {},
      api: {},
      memory: {},
      optimization: {},
      recommendations: []
    };
  }

  async setup() {
    console.log('🚀 Starting comprehensive performance audit...');
    
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
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Intercept network requests for analysis
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
        request.size = response.headers()['content-length'] || 0;
      }
    });
  }

  async analyzeBundlePerformance() {
    console.log('📦 Analyzing bundle performance...');
    
    const distPath = './dist';
    if (!fs.existsSync(distPath)) {
      throw new Error('Build not found. Run "bun run build" first.');
    }
    
    // Analyze bundle files
    const jsFiles = this.getJSFiles(distPath);
    const cssFiles = this.getCSSFiles(distPath);
    
    let totalSize = 0;
    let totalGzipSize = 0;
    let chunkCount = 0;
    
    const fileAnalysis = [];
    
    for (const file of [...jsFiles, ...cssFiles]) {
      const filePath = path.join(distPath, file);
      const gzipPath = `${filePath}.gz`;
      
      const stat = fs.statSync(filePath);
      const size = stat.size;
      totalSize += size;
      chunkCount++;
      
      let gzipSize = 0;
      if (fs.existsSync(gzipPath)) {
        gzipSize = fs.statSync(gzipPath).size;
        totalGzipSize += gzipSize;
      }
      
      fileAnalysis.push({
        file,
        size: Math.round(size / 1024), // KB
        gzipSize: Math.round(gzipSize / 1024), // KB
        compression: gzipSize > 0 ? Math.round((1 - gzipSize/size) * 100) : 0
      });
    }
    
    // Calculate utilization from bundle analysis
    const bundleAnalysisPath = path.join(distPath, 'bundle-analysis.html');
    let jsUtilization = 45; // Default estimate
    
    if (fs.existsSync(bundleAnalysisPath)) {
      // Parse bundle analysis for more accurate utilization
      try {
        const bundleContent = fs.readFileSync(bundleAnalysisPath, 'utf8');
        // Extract utilization data from the analysis
        const utilizationMatch = bundleContent.match(/unused.*?(\d+\.?\d*)%/i);
        if (utilizationMatch) {
          jsUtilization = 100 - parseFloat(utilizationMatch[1]);
        }
      } catch (e) {
        console.warn('Could not parse bundle analysis:', e.message);
      }
    }
    
    this.results.bundle = {
      totalSizeKB: Math.round(totalSize / 1024),
      totalGzipSizeKB: Math.round(totalGzipSize / 1024),
      chunkCount,
      jsUtilization: Math.round(jsUtilization),
      compressionRatio: Math.round((1 - totalGzipSize/totalSize) * 100),
      files: fileAnalysis.sort((a, b) => b.size - a.size),
      performance: {
        sizeTarget: totalGzipSize / 1024 <= AUDIT_CONFIG.bundle.maxBundleSize,
        chunkTarget: chunkCount <= AUDIT_CONFIG.bundle.maxChunks,
        utilizationTarget: jsUtilization >= AUDIT_CONFIG.bundle.targetUtilization
      }
    };
    
    // Add recommendations
    if (jsUtilization < AUDIT_CONFIG.bundle.targetUtilization) {
      this.results.recommendations.push({
        type: 'bundle',
        priority: 'high',
        message: `JavaScript utilization is ${jsUtilization}%, target is ${AUDIT_CONFIG.bundle.targetUtilization}%`,
        solution: 'Implement code splitting for unused components, optimize tree shaking'
      });
    }
    
    if (totalGzipSize / 1024 > AUDIT_CONFIG.bundle.maxBundleSize) {
      this.results.recommendations.push({
        type: 'bundle',
        priority: 'medium',
        message: `Bundle size is ${Math.round(totalGzipSize/1024)}KB, target is ${AUDIT_CONFIG.bundle.maxBundleSize}KB`,
        solution: 'Implement lazy loading for non-critical components'
      });
    }
  }

  async analyzeRuntimePerformance() {
    console.log('⚡ Analyzing runtime performance...');
    
    // Start tracing
    await this.page.tracing.start({
      path: './dist/performance-trace.json',
      screenshots: true,
      categories: ['devtools.timeline']
    });
    
    const startTime = Date.now();
    
    // Navigate and measure
    await this.page.goto(AUDIT_CONFIG.url, { 
      waitUntil: 'networkidle0',
      timeout: AUDIT_CONFIG.timeout 
    });
    
    // Get Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.name === 'first-input-delay') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.name === 'cumulative-layout-shift') {
              vitals.cls = entry.value;
            }
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
          });
          
          // Also get TTI approximation
          vitals.tti = performance.now();
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Get memory usage
    const memoryInfo = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
          jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
        };
      }
      return null;
    });
    
    // Stop tracing
    await this.page.tracing.stop();
    
    const loadTime = Date.now() - startTime;
    
    this.results.runtime = {
      loadTime,
      coreWebVitals: {
        lcp: metrics.lcp || 0,
        fid: metrics.fid || 0,
        cls: metrics.cls || 0,
        fcp: metrics.fcp || 0,
        tti: metrics.tti || 0
      },
      performance: {
        lcpTarget: (metrics.lcp || 0) <= AUDIT_CONFIG.performance.targetLCP,
        fidTarget: (metrics.fid || 0) <= AUDIT_CONFIG.performance.targetFID,
        clsTarget: (metrics.cls || 0) <= AUDIT_CONFIG.performance.targetCLS,
        fcpTarget: (metrics.fcp || 0) <= AUDIT_CONFIG.performance.targetFCP,
        ttiTarget: (metrics.tti || 0) <= AUDIT_CONFIG.performance.targetTTI
      },
      memory: memoryInfo,
      networkRequests: this.networkRequests.length
    };
    
    // Add performance recommendations
    if (metrics.lcp > AUDIT_CONFIG.performance.targetLCP) {
      this.results.recommendations.push({
        type: 'runtime',
        priority: 'high',
        message: `LCP is ${Math.round(metrics.lcp)}ms, target is ${AUDIT_CONFIG.performance.targetLCP}ms`,
        solution: 'Optimize largest contentful paint element, preload critical resources'
      });
    }
    
    if (memoryInfo && memoryInfo.usedJSHeapSize > 50) {
      this.results.recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: `Memory usage is ${memoryInfo.usedJSHeapSize}MB`,
        solution: 'Implement memory-efficient patterns, clean up event listeners'
      });
    }
  }

  async analyzeAPIPerformance() {
    console.log('🔗 Analyzing API performance...');
    
    const apiTests = [
      { endpoint: '/api/health', method: 'GET' },
      { endpoint: '/api/leads/capture', method: 'POST', body: this.getMockLeadData() }
    ];
    
    const apiResults = [];
    
    for (const test of apiTests) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${AUDIT_CONFIG.apiUrl}${test.endpoint}`, {
          method: test.method,
          headers: { 'Content-Type': 'application/json' },
          body: test.body ? JSON.stringify(test.body) : undefined
        });
        
        const responseTime = Date.now() - startTime;
        const data = await response.json();
        
        apiResults.push({
          endpoint: test.endpoint,
          method: test.method,
          status: response.status,
          responseTime,
          success: response.ok,
          size: JSON.stringify(data).length
        });
        
      } catch (error) {
        apiResults.push({
          endpoint: test.endpoint,
          method: test.method,
          error: error.message,
          responseTime: Date.now() - startTime,
          success: false
        });
      }
    }
    
    const avgResponseTime = apiResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / apiResults.filter(r => r.success).length;
    
    this.results.api = {
      averageResponseTime: Math.round(avgResponseTime),
      tests: apiResults,
      performance: {
        responseTimeTarget: avgResponseTime <= AUDIT_CONFIG.api.targetResponseTime
      }
    };
    
    if (avgResponseTime > AUDIT_CONFIG.api.targetResponseTime) {
      this.results.recommendations.push({
        type: 'api',
        priority: 'high',
        message: `API response time is ${Math.round(avgResponseTime)}ms, target is ${AUDIT_CONFIG.api.targetResponseTime}ms`,
        solution: 'Optimize database queries, implement caching, add connection pooling'
      });
    }
  }

  async testInteractivePerformance() {
    console.log('🖱️ Testing interactive performance...');
    
    // Test form interaction
    const urlInput = await this.page.$('input[type="url"]');
    if (urlInput) {
      const inputStart = Date.now();
      await urlInput.type(AUDIT_CONFIG.testRepo);
      const inputTime = Date.now() - inputStart;
      
      // Test button click
      const submitButton = await this.page.$('button[type="submit"], button:not([disabled])');
      if (submitButton) {
        const clickStart = Date.now();
        await submitButton.click();
        
        // Wait for loading state
        try {
          await this.page.waitForSelector('.apple-spinner, [data-loading="true"]', { timeout: 5000 });
          const loadingStart = Date.now();
          
          // Wait for completion or timeout
          await this.page.waitForSelector('.apple-spinner', { hidden: true, timeout: 30000 });
          const loadingTime = Date.now() - loadingStart;
          
          this.results.runtime.interactionPerformance = {
            inputResponseTime: inputTime,
            clickResponseTime: Date.now() - clickStart,
            generationTime: loadingTime,
            totalInteractionTime: Date.now() - inputStart
          };
          
        } catch (e) {
          console.warn('Could not complete interaction test:', e.message);
          this.results.runtime.interactionPerformance = {
            inputResponseTime: inputTime,
            clickResponseTime: Date.now() - clickStart,
            error: 'Generation timeout or failed'
          };
        }
      }
    }
  }

  async generateOptimizationSuggestions() {
    console.log('💡 Generating optimization suggestions...');
    
    const { bundle, runtime, api } = this.results;
    const suggestions = [];
    
    // Bundle optimizations
    if (bundle.jsUtilization < 60) {
      suggestions.push({
        category: 'Bundle Optimization',
        priority: 'HIGH',
        impact: 'Major reduction in bundle size',
        implementation: [
          'Implement React.lazy() for non-critical components',
          'Add dynamic imports for premium features',
          'Configure tree shaking for unused library code',
          'Use bundle analyzer to identify heavy dependencies'
        ],
        code: `
// Implement lazy loading
const PremiumDashboard = React.lazy(() => import('./components/premium/PremiumDashboard'));
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));

// Use Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/premium" component={PremiumDashboard} />
</Suspense>`
      });
    }
    
    // Runtime optimizations
    if (runtime.coreWebVitals.lcp > 2000) {
      suggestions.push({
        category: 'Runtime Performance',
        priority: 'HIGH',
        impact: 'Improved Core Web Vitals and user experience',
        implementation: [
          'Preload critical fonts and images',
          'Optimize largest contentful paint element',
          'Implement service worker for resource caching',
          'Use resource hints for critical dependencies'
        ],
        code: `
// Add resource hints
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preconnect" href="https://fonts.googleapis.com" />

// Optimize images
<img src="/hero.webp" alt="Hero" loading="lazy" decoding="async" />
`
      });
    }
    
    // API optimizations
    if (api.averageResponseTime > 150) {
      suggestions.push({
        category: 'API Performance',
        priority: 'MEDIUM',
        impact: 'Faster response times and better scalability',
        implementation: [
          'Add Redis caching for frequent queries',
          'Implement database connection pooling',
          'Optimize SQL queries with proper indexing',
          'Add response compression'
        ],
        code: `
// Add caching middleware
import redis from 'redis';
const cache = redis.createClient();

app.use('/api/leads', (req, res, next) => {
  const key = req.originalUrl;
  cache.get(key, (err, data) => {
    if (data) return res.json(JSON.parse(data));
    next();
  });
});`
      });
    }
    
    // Memory optimizations
    if (runtime.memory && runtime.memory.usedJSHeapSize > 50) {
      suggestions.push({
        category: 'Memory Optimization',
        priority: 'MEDIUM',
        impact: 'Reduced memory usage and smoother performance',
        implementation: [
          'Implement proper cleanup in useEffect hooks',
          'Use React.memo for expensive components',
          'Optimize state management patterns',
          'Remove unused event listeners'
        ],
        code: `
// Proper cleanup
useEffect(() => {
  const handleScroll = () => { /* handler */ };
  window.addEventListener('scroll', handleScroll);
  
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});`
      });
    }
    
    this.results.optimization = {
      suggestions,
      implementationPriority: suggestions
        .sort((a, b) => a.priority === 'HIGH' ? -1 : 1)
        .map(s => s.category)
    };
  }

  getJSFiles(distPath) {
    const jsDir = path.join(distPath, 'js');
    return fs.existsSync(jsDir) 
      ? fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map')).map(f => `js/${f}`)
      : [];
  }

  getCSSFiles(distPath) {
    const cssDir = path.join(distPath, 'css');
    return fs.existsSync(cssDir)
      ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => `css/${f}`)
      : [];
  }

  getMockLeadData() {
    return {
      email: 'test@example.com',
      siteId: 'test-site-123',
      projectType: 'web-app',
      template: 'tech-showcase',
      projectInterests: ['Web Development', 'AI/ML'],
      socialPlatforms: ['github', 'linkedin'],
      newsletterOptIn: true,
      metadata: {
        sessionId: 'test-session-123',
        timeOnSite: 120,
        scrollDepth: 80,
        sectionsViewed: ['hero', 'features', 'demo'],
        interactionCount: 5,
        deviceType: 'desktop',
        screenResolution: '1920x1080',
        userAgent: 'Mozilla/5.0 Chrome Test',
        referrer: 'https://github.com',
        timezone: 'America/New_York',
        language: 'en-US'
      },
      captureTimestamp: new Date().toISOString()
    };
  }

  async generateReport() {
    const report = {
      ...this.results,
      summary: {
        overallScore: this.calculateOverallScore(),
        criticalIssues: this.results.recommendations.filter(r => r.priority === 'high').length,
        bundleEfficiency: this.results.bundle.jsUtilization || 0,
        performanceGrade: this.getPerformanceGrade(),
        recommendations: this.results.recommendations.length
      }
    };
    
    // Save detailed report
    fs.writeFileSync(
      './dist/performance-audit-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Generate human-readable summary
    const summary = this.generateHumanReadableSummary(report);
    fs.writeFileSync('./dist/performance-summary.md', summary);
    
    console.log('\n📊 PERFORMANCE AUDIT COMPLETE');
    console.log('=====================================');
    console.log(`Overall Score: ${report.summary.overallScore}/100`);
    console.log(`Performance Grade: ${report.summary.performanceGrade}`);
    console.log(`Bundle Efficiency: ${report.summary.bundleEfficiency}%`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Total Recommendations: ${report.summary.recommendations}`);
    console.log('\nDetailed reports saved to:');
    console.log('- dist/performance-audit-report.json');
    console.log('- dist/performance-summary.md');
    
    return report;
  }

  calculateOverallScore() {
    let score = 100;
    
    // Bundle performance (30%)
    if (this.results.bundle.jsUtilization < 75) score -= (75 - this.results.bundle.jsUtilization) * 0.4;
    if (this.results.bundle.totalGzipSizeKB > 500) score -= ((this.results.bundle.totalGzipSizeKB - 500) / 10);
    
    // Runtime performance (40%)
    const { coreWebVitals } = this.results.runtime;
    if (coreWebVitals.lcp > 1800) score -= ((coreWebVitals.lcp - 1800) / 100);
    if (coreWebVitals.fid > 100) score -= ((coreWebVitals.fid - 100) / 10);
    if (coreWebVitals.cls > 0.1) score -= ((coreWebVitals.cls - 0.1) * 100);
    
    // API performance (20%)
    if (this.results.api.averageResponseTime > 200) score -= ((this.results.api.averageResponseTime - 200) / 10);
    
    // Memory usage (10%)
    if (this.results.runtime.memory && this.results.runtime.memory.usedJSHeapSize > 50) {
      score -= ((this.results.runtime.memory.usedJSHeapSize - 50) / 5);
    }
    
    return Math.max(0, Math.round(score));
  }

  getPerformanceGrade() {
    const score = this.calculateOverallScore();
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  generateHumanReadableSummary(report) {
    return `# 4site.pro Performance Audit Report

## Executive Summary
- **Overall Score**: ${report.summary.overallScore}/100 (${report.summary.performanceGrade})
- **Bundle Efficiency**: ${report.summary.bundleEfficiency}%
- **Critical Issues**: ${report.summary.criticalIssues}
- **Total Recommendations**: ${report.summary.recommendations}

## Bundle Analysis
- **Total Size**: ${report.bundle.totalSizeKB}KB (${report.bundle.totalGzipSizeKB}KB gzipped)
- **JavaScript Utilization**: ${report.bundle.jsUtilization}%
- **Chunk Count**: ${report.bundle.chunkCount}
- **Compression Ratio**: ${report.bundle.compressionRatio}%

## Runtime Performance
- **LCP**: ${Math.round(report.runtime.coreWebVitals.lcp)}ms
- **FID**: ${Math.round(report.runtime.coreWebVitals.fid)}ms
- **CLS**: ${report.runtime.coreWebVitals.cls.toFixed(3)}
- **Memory Usage**: ${report.runtime.memory?.usedJSHeapSize || 'N/A'}MB

## API Performance
- **Average Response Time**: ${report.api.averageResponseTime}ms
- **Successful Requests**: ${report.api.tests.filter(t => t.success).length}/${report.api.tests.length}

## Top Recommendations
${report.optimization.suggestions.slice(0, 3).map((s, i) => `
${i + 1}. **${s.category}** (${s.priority})
   - Impact: ${s.impact}
   - Implementation: ${s.implementation[0]}
`).join('')}

Generated: ${new Date().toISOString()}
`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const auditor = new PerformanceAuditor();
  
  try {
    await auditor.setup();
    await auditor.analyzeBundlePerformance();
    await auditor.analyzeRuntimePerformance();
    await auditor.analyzeAPIPerformance();
    await auditor.testInteractivePerformance();
    await auditor.generateOptimizationSuggestions();
    
    const report = await auditor.generateReport();
    
    return report;
    
  } catch (error) {
    console.error('Performance audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.cleanup();
  }
}

// Export for programmatic use
export { PerformanceAuditor, AUDIT_CONFIG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}