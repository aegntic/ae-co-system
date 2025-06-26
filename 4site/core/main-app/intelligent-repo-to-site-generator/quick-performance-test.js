#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Quick bundle analysis without browser testing
function analyzeBundleSize() {
  const distPath = './dist';
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build not found. Run "bun run build" first.');
    return null;
  }

  console.log('📦 BUNDLE ANALYSIS');
  console.log('==================');

  const jsDir = path.join(distPath, 'js');
  const cssDir = path.join(distPath, 'css');
  
  let totalSize = 0;
  let totalGzipSize = 0;
  let totalBrotliSize = 0;
  
  const files = [];

  // Analyze JS files
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
    
    for (const file of jsFiles) {
      const filePath = path.join(jsDir, file);
      const gzipPath = `${filePath}.gz`;
      const brotliPath = `${filePath}.br`;
      
      const size = fs.statSync(filePath).size;
      const gzipSize = fs.existsSync(gzipPath) ? fs.statSync(gzipPath).size : 0;
      const brotliSize = fs.existsSync(brotliPath) ? fs.statSync(brotliPath).size : 0;
      
      totalSize += size;
      totalGzipSize += gzipSize;
      totalBrotliSize += brotliSize;
      
      files.push({
        name: file,
        type: 'JS',
        size: Math.round(size / 1024),
        gzip: Math.round(gzipSize / 1024),
        brotli: Math.round(brotliSize / 1024),
        compression: gzipSize > 0 ? Math.round((1 - gzipSize/size) * 100) : 0
      });
    }
  }

  // Analyze CSS files
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    
    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const gzipPath = `${filePath}.gz`;
      const brotliPath = `${filePath}.br`;
      
      const size = fs.statSync(filePath).size;
      const gzipSize = fs.existsSync(gzipPath) ? fs.statSync(gzipPath).size : 0;
      const brotliSize = fs.existsSync(brotliPath) ? fs.statSync(brotliPath).size : 0;
      
      totalSize += size;
      totalGzipSize += gzipSize;
      totalBrotliSize += brotliSize;
      
      files.push({
        name: file,
        type: 'CSS',
        size: Math.round(size / 1024),
        gzip: Math.round(gzipSize / 1024),
        brotli: Math.round(brotliSize / 1024),
        compression: gzipSize > 0 ? Math.round((1 - gzipSize/size) * 100) : 0
      });
    }
  }

  // Calculate JavaScript utilization estimate
  // Based on typical React app patterns and our advanced chunking
  const reactVendorFile = files.find(f => f.name.includes('react-vendor'));
  const animationVendorFile = files.find(f => f.name.includes('animation-vendor'));
  const mainAppFile = files.find(f => f.name.includes('index-'));
  
  // Estimate utilization based on chunk sizes and typical patterns
  let jsUtilization = 70; // Base estimate for well-chunked React app
  
  if (reactVendorFile && reactVendorFile.gzip < 60) jsUtilization += 10; // Well-optimized React
  if (animationVendorFile && animationVendorFile.gzip < 30) jsUtilization += 5; // Lazy animations
  if (mainAppFile && mainAppFile.gzip < 10) jsUtilization += 10; // Small main bundle
  if (files.length >= 5) jsUtilization += 5; // Good chunking strategy

  const results = {
    files: files.sort((a, b) => b.size - a.size),
    summary: {
      totalSizeKB: Math.round(totalSize / 1024),
      totalGzipSizeKB: Math.round(totalGzipSize / 1024),
      totalBrotliSizeKB: Math.round(totalBrotliSize / 1024),
      compressionRatio: Math.round((1 - totalGzipSize/totalSize) * 100),
      chunkCount: files.length,
      jsUtilizationEstimate: Math.min(jsUtilization, 95)
    }
  };

  // Display results
  console.log(`Total Bundle Size: ${results.summary.totalSizeKB}KB`);
  console.log(`Gzipped Size: ${results.summary.totalGzipSizeKB}KB`);
  console.log(`Brotli Size: ${results.summary.totalBrotliSizeKB}KB`);
  console.log(`Compression: ${results.summary.compressionRatio}%`);
  console.log(`Chunks: ${results.summary.chunkCount}`);
  console.log(`JS Utilization (est): ${results.summary.jsUtilizationEstimate}%`);
  
  console.log('\n📋 FILE BREAKDOWN');
  console.log('Name'.padEnd(35) + 'Type'.padEnd(6) + 'Size'.padEnd(8) + 'Gzip'.padEnd(8) + 'Comp%');
  console.log('-'.repeat(65));
  
  files.forEach(file => {
    console.log(
      file.name.padEnd(35) + 
      file.type.padEnd(6) + 
      `${file.size}KB`.padEnd(8) + 
      `${file.gzip}KB`.padEnd(8) + 
      `${file.compression}%`
    );
  });

  return results;
}

function analyzeViteConfig() {
  console.log('\n⚙️  VITE CONFIGURATION ANALYSIS');
  console.log('===============================');
  
  try {
    const viteConfigPath = './vite.config.ts';
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    const optimizations = [];
    
    // Check for optimization features
    if (viteConfig.includes('splitVendorChunkPlugin')) optimizations.push('✅ Vendor chunk splitting');
    if (viteConfig.includes('visualizer')) optimizations.push('✅ Bundle analysis');
    if (viteConfig.includes('viteCompression')) optimizations.push('✅ Compression (gzip + brotli)');
    if (viteConfig.includes('terserOptions')) optimizations.push('✅ Advanced minification');
    if (viteConfig.includes('manualChunks')) optimizations.push('✅ Manual chunk optimization');
    if (viteConfig.includes('treeshake')) optimizations.push('✅ Tree shaking enabled');
    if (viteConfig.includes('assetsInlineLimit')) optimizations.push('✅ Asset inlining');
    if (viteConfig.includes('cssCodeSplit')) optimizations.push('✅ CSS code splitting');
    
    console.log('Optimization Features:');
    optimizations.forEach(opt => console.log(`  ${opt}`));
    
    // Check for potential improvements
    const improvements = [];
    if (!viteConfig.includes('experimental')) improvements.push('🔄 Consider experimental features');
    if (!viteConfig.includes('rollupOptions.external')) improvements.push('🔄 External dependencies optimization');
    if (!viteConfig.includes('build.chunkSizeWarningLimit')) improvements.push('🔄 Chunk size warning configured');
    
    if (improvements.length > 0) {
      console.log('\nPotential Improvements:');
      improvements.forEach(imp => console.log(`  ${imp}`));
    }
    
    return { optimizations, improvements };
    
  } catch (error) {
    console.log('❌ Could not analyze vite.config.ts');
    return null;
  }
}

function generateRecommendations(bundleResults, viteAnalysis) {
  console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
  console.log('===============================');
  
  const recommendations = [];
  
  // Bundle size recommendations
  if (bundleResults.summary.totalGzipSizeKB > 500) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Bundle Size',
      issue: `Bundle size is ${bundleResults.summary.totalGzipSizeKB}KB (target: <500KB)`,
      solution: 'Implement lazy loading for non-critical components'
    });
  }
  
  // JavaScript utilization
  if (bundleResults.summary.jsUtilizationEstimate < 75) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Code Efficiency',
      issue: `JS utilization estimated at ${bundleResults.summary.jsUtilizationEstimate}% (target: >75%)`,
      solution: 'Implement dynamic imports and remove unused code'
    });
  }
  
  // Chunk strategy
  if (bundleResults.summary.chunkCount < 5) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Chunking Strategy',
      issue: `Only ${bundleResults.summary.chunkCount} chunks (target: 5-10)`,
      solution: 'Improve code splitting for better caching'
    });
  }
  
  // Compression efficiency
  if (bundleResults.summary.compressionRatio < 70) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Compression',
      issue: `Compression ratio is ${bundleResults.summary.compressionRatio}% (target: >70%)`,
      solution: 'Optimize assets and enable better compression'
    });
  }
  
  // Large individual files
  const largeFiles = bundleResults.files.filter(f => f.gzip > 100);
  if (largeFiles.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'File Size',
      issue: `${largeFiles.length} files > 100KB gzipped`,
      solution: 'Split large files or implement lazy loading'
    });
  }
  
  // Display recommendations
  if (recommendations.length === 0) {
    console.log('🎉 No major performance issues detected!');
  } else {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.category}`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}\n`);
    });
  }
  
  return recommendations;
}

function generateOptimizationPlan(bundleResults, recommendations) {
  console.log('🎯 OPTIMIZATION IMPLEMENTATION PLAN');
  console.log('====================================');
  
  const plan = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  recommendations.forEach(rec => {
    if (rec.priority === 'HIGH') {
      plan.immediate.push(rec);
    } else if (rec.priority === 'MEDIUM') {
      plan.shortTerm.push(rec);
    } else {
      plan.longTerm.push(rec);
    }
  });
  
  if (plan.immediate.length > 0) {
    console.log('🚨 IMMEDIATE (Critical Performance Issues):');
    plan.immediate.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.category}: ${item.solution}`);
    });
  }
  
  if (plan.shortTerm.length > 0) {
    console.log('\n⚡ SHORT-TERM (Performance Improvements):');
    plan.shortTerm.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.category}: ${item.solution}`);
    });
  }
  
  if (plan.longTerm.length > 0) {
    console.log('\n🔮 LONG-TERM (Further Optimizations):');
    plan.longTerm.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.category}: ${item.solution}`);
    });
  }
  
  // Implementation examples
  if (bundleResults.summary.jsUtilizationEstimate < 75) {
    console.log('\n📝 CODE SPLITTING IMPLEMENTATION EXAMPLE:');
    console.log(`
// Implement lazy loading for components
const PremiumDashboard = React.lazy(() => import('./components/premium/PremiumDashboard'));
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));

// Use dynamic imports for features
const loadFeature = async (featureName) => {
  const module = await import(\`./features/\${featureName}\`);
  return module.default;
};

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/premium" component={PremiumDashboard} />
</Suspense>`);
  }
  
  return plan;
}

function calculatePerformanceScore(bundleResults, recommendations) {
  let score = 100;
  
  // Bundle size penalty
  if (bundleResults.summary.totalGzipSizeKB > 500) {
    score -= Math.min((bundleResults.summary.totalGzipSizeKB - 500) / 10, 30);
  }
  
  // Utilization penalty
  if (bundleResults.summary.jsUtilizationEstimate < 75) {
    score -= (75 - bundleResults.summary.jsUtilizationEstimate) * 0.5;
  }
  
  // High priority issues penalty
  const highPriorityIssues = recommendations.filter(r => r.priority === 'HIGH').length;
  score -= highPriorityIssues * 15;
  
  // Medium priority issues penalty
  const mediumPriorityIssues = recommendations.filter(r => r.priority === 'MEDIUM').length;
  score -= mediumPriorityIssues * 8;
  
  return Math.max(0, Math.round(score));
}

// Main execution
console.log('🚀 4site.pro PERFORMANCE AUDIT');
console.log('================================\n');

const bundleResults = analyzeBundleSize();
if (!bundleResults) process.exit(1);

const viteAnalysis = analyzeViteConfig();
const recommendations = generateRecommendations(bundleResults, viteAnalysis);
const optimizationPlan = generateOptimizationPlan(bundleResults, recommendations);
const performanceScore = calculatePerformanceScore(bundleResults, recommendations);

console.log('\n🏆 PERFORMANCE SUMMARY');
console.log('======================');
console.log(`Overall Score: ${performanceScore}/100`);
console.log(`Bundle Efficiency: ${bundleResults.summary.jsUtilizationEstimate}%`);
console.log(`Bundle Size: ${bundleResults.summary.totalGzipSizeKB}KB (gzipped)`);
console.log(`Compression: ${bundleResults.summary.compressionRatio}%`);
console.log(`Critical Issues: ${recommendations.filter(r => r.priority === 'HIGH').length}`);
console.log(`Total Recommendations: ${recommendations.length}`);

// Save detailed report
const detailedReport = {
  timestamp: new Date().toISOString(),
  performanceScore,
  bundle: bundleResults,
  viteConfig: viteAnalysis,
  recommendations,
  optimizationPlan
};

fs.writeFileSync('./dist/performance-report.json', JSON.stringify(detailedReport, null, 2));
console.log('\n📄 Detailed report saved to: dist/performance-report.json');

// Return status code based on score
if (performanceScore < 70) {
  console.log('\n❌ Performance below acceptable threshold!');
  process.exit(1);
} else if (performanceScore < 85) {
  console.log('\n⚠️  Performance needs improvement.');
  process.exit(0);
} else {
  console.log('\n✅ Performance is excellent!');
  process.exit(0);
}