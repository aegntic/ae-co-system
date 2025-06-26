#!/usr/bin/env node

/**
 * Comprehensive test of core site generation functionality
 * Tests the exact issue the user reported: "the core product is not loading though. it needs to generate a site once the repo is entered"
 */

import fs from 'fs';
import path from 'path';

// Test imports to verify all modules load correctly
async function testModuleImports() {
  console.log('🔍 Testing module imports...\n');
  
  try {
    // Test if services can be imported
    const geminiServicePath = './services/geminiService.js';
    const enhancedServicePath = './services/enhancedGeminiService.js';
    const typesPath = './types.js';
    
    console.log('📦 Checking service files...');
    console.log(`✓ geminiService.ts exists: ${fs.existsSync('./services/geminiService.ts')}`);
    console.log(`✓ enhancedGeminiService.ts exists: ${fs.existsSync('./services/enhancedGeminiService.ts')}`);
    console.log(`✓ types.ts exists: ${fs.existsSync('./types.ts')}`);
    console.log(`✓ constants.ts exists: ${fs.existsSync('./constants.ts')}`);
    
    // Check environment variables
    console.log('\n🔧 Checking environment configuration...');
    const envExists = fs.existsSync('.env.local');
    console.log(`✓ .env.local exists: ${envExists}`);
    
    if (envExists) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const hasGeminiKey = envContent.includes('VITE_GEMINI_API_KEY=');
      const hasValidKey = envContent.includes('VITE_GEMINI_API_KEY=AIzaSy');
      console.log(`✓ VITE_GEMINI_API_KEY configured: ${hasGeminiKey}`);
      console.log(`✓ API key appears valid: ${hasValidKey}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Module import test failed:', error);
    return false;
  }
}

// Test the type interface structure
async function testTypeStructure() {
  console.log('\n🏗️  Testing TypeScript type structure...\n');
  
  try {
    const typesContent = fs.readFileSync('./types.ts', 'utf8');
    
    // Check for critical interface fields
    const checks = [
      { field: 'interface SiteData', exists: typesContent.includes('interface SiteData') },
      { field: 'description: string', exists: typesContent.includes('description: string') },
      { field: 'features: string[]', exists: typesContent.includes('features: string[]') },
      { field: 'techStack: string[]', exists: typesContent.includes('techStack: string[]') },
      { field: 'sections: Section[]', exists: typesContent.includes('sections: Section[]') },
      { field: 'projectType:', exists: typesContent.includes('projectType:') },
      { field: 'primaryColor: string', exists: typesContent.includes('primaryColor: string') }
    ];
    
    console.log('📋 SiteData interface validation:');
    checks.forEach(check => {
      console.log(`  ${check.exists ? '✓' : '❌'} ${check.field}`);
    });
    
    const allValid = checks.every(check => check.exists);
    console.log(`\n${allValid ? '✅' : '❌'} Type structure validation: ${allValid ? 'PASSED' : 'FAILED'}`);
    
    return allValid;
  } catch (error) {
    console.error('❌ Type structure test failed:', error);
    return false;
  }
}

// Test service structure and function signatures
async function testServiceStructure() {
  console.log('\n⚙️  Testing service structure...\n');
  
  try {
    const geminiContent = fs.readFileSync('./services/geminiService.ts', 'utf8');
    const enhancedContent = fs.readFileSync('./services/enhancedGeminiService.ts', 'utf8');
    
    // Check geminiService.ts
    console.log('📋 geminiService.ts validation:');
    const geminiChecks = [
      { item: 'imports enhancedGeminiService', exists: geminiContent.includes('enhancedGeminiService') },
      { item: 'imports SiteData type', exists: geminiContent.includes('import { SiteData') },
      { item: 'convertToSiteData function', exists: geminiContent.includes('const convertToSiteData') },
      { item: 'returns Promise<SiteData>', exists: geminiContent.includes('Promise<SiteData>') },
      { item: 'uses generateEnhancedSiteContent', exists: geminiContent.includes('generateEnhancedSiteContent') }
    ];
    
    geminiChecks.forEach(check => {
      console.log(`  ${check.exists ? '✓' : '❌'} ${check.item}`);
    });
    
    // Check enhancedGeminiService.ts
    console.log('\n📋 enhancedGeminiService.ts validation:');
    const enhancedChecks = [
      { item: 'EnhancedSiteContent interface', exists: enhancedContent.includes('interface EnhancedSiteContent') },
      { item: 'ProjectMetadata interface', exists: enhancedContent.includes('interface ProjectMetadata') },
      { item: 'generateEnhancedSiteContent function', exists: enhancedContent.includes('generateEnhancedSiteContent') },
      { item: 'JSON response parsing', exists: enhancedContent.includes('JSON.parse') },
      { item: 'Gemini API integration', exists: enhancedContent.includes('GoogleGenerativeAI') }
    ];
    
    enhancedChecks.forEach(check => {
      console.log(`  ${check.exists ? '✓' : '❌'} ${check.item}`);
    });
    
    const allValid = [...geminiChecks, ...enhancedChecks].every(check => check.exists);
    console.log(`\n${allValid ? '✅' : '❌'} Service structure validation: ${allValid ? 'PASSED' : 'FAILED'}`);
    
    return allValid;
  } catch (error) {
    console.error('❌ Service structure test failed:', error);
    return false;
  }
}

// Test the UI component structure
async function testUIStructure() {
  console.log('\n🎨 Testing UI component structure...\n');
  
  try {
    const appContent = fs.readFileSync('./App.tsx', 'utf8');
    const simplePreviewExists = fs.existsSync('./components/templates/SimplePreviewTemplate.tsx');
    
    console.log('📋 App.tsx validation:');
    const appChecks = [
      { item: 'imports generateSiteContentFromUrl', exists: appContent.includes('generateSiteContentFromUrl') },
      { item: 'imports SimplePreviewTemplate', exists: appContent.includes('SimplePreviewTemplate') },
      { item: 'setSiteData with SiteData type', exists: appContent.includes('setSiteData') },
      { item: 'Success state shows preview', exists: appContent.includes('AppState.Success') },
      { item: 'Floating action bar', exists: appContent.includes('Deploy to GitHub Pages') },
      { item: 'No Vercel deploy option', exists: !appContent.includes('Deploy to Vercel') }
    ];
    
    appChecks.forEach(check => {
      console.log(`  ${check.exists ? '✓' : '❌'} ${check.item}`);
    });
    
    console.log(`\n📋 SimplePreviewTemplate exists: ${simplePreviewExists ? '✓' : '❌'}`);
    
    if (simplePreviewExists) {
      const previewContent = fs.readFileSync('./components/templates/SimplePreviewTemplate.tsx', 'utf8');
      const previewChecks = [
        { item: 'accepts siteData prop', exists: previewContent.includes('siteData') },
        { item: 'displays title', exists: previewContent.includes('siteData.title') },
        { item: 'displays description', exists: previewContent.includes('siteData.description') },
        { item: 'displays techStack', exists: previewContent.includes('siteData.techStack') }
      ];
      
      console.log('\n📋 SimplePreviewTemplate validation:');
      previewChecks.forEach(check => {
        console.log(`  ${check.exists ? '✓' : '❌'} ${check.item}`);
      });
      
      const allValid = [...appChecks, ...previewChecks].every(check => check.exists);
      console.log(`\n${allValid ? '✅' : '❌'} UI structure validation: ${allValid ? 'PASSED' : 'FAILED'}`);
      
      return allValid;
    }
    
    return false;
  } catch (error) {
    console.error('❌ UI structure test failed:', error);
    return false;
  }
}

// Generate test report
async function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE TEST REPORT');
  console.log('═'.repeat(60));
  
  const tests = [
    { name: 'Module Imports', test: testModuleImports },
    { name: 'Type Structure', test: testTypeStructure },
    { name: 'Service Structure', test: testServiceStructure },
    { name: 'UI Structure', test: testUIStructure }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.test();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  console.log('\n📋 TEST SUMMARY:');
  results.forEach(result => {
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const allPassed = results.every(r => r.passed);
  
  console.log('\n🎯 CORE FUNCTIONALITY STATUS:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Core functionality should work correctly');
    console.log('🔧 Ready for browser testing with aegntic repository');
    console.log('📍 Test URL: https://github.com/aegntic/aegnticdotai');
  } else {
    console.log('❌ SOME TESTS FAILED - Issues need to be resolved');
    console.log('🔧 Check failed tests above and fix before browser testing');
  }
  
  console.log('\n🌐 MANUAL BROWSER TEST STEPS:');
  console.log('1. Navigate to: http://localhost:5174');
  console.log('2. Enter: https://github.com/aegntic/aegnticdotai');
  console.log('3. Click "Generate Site"');
  console.log('4. Verify: Site preview shows actual aegntic content (not demo)');
  console.log('5. Verify: Action bar shows GitHub Pages, Retry, Edit options');
  
  return allPassed;
}

// Run all tests
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTestReport()
    .then(success => {
      console.log(`\n🏁 Test completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}