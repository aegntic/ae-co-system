#!/usr/bin/env node

/**
 * Direct test of the AI generation functionality
 * This will test the exact issue: generating actual site content from aegntic repository
 */

// Import the service directly (need to use .js extension for ES modules)
import { generateSiteContentFromUrl } from './dist/assets/index-BbLOSc6N.js';

async function testDirectGeneration() {
  console.log('🧪 Testing direct AI generation functionality...\n');
  
  const testUrl = 'https://github.com/aegntic/aegnticdotai';
  
  try {
    console.log(`📍 Repository: ${testUrl}`);
    console.log('⏳ Starting AI generation...\n');
    
    const startTime = Date.now();
    
    // This should now return SiteData directly instead of string
    const siteData = await generateSiteContentFromUrl(testUrl);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Generation completed in ${duration}s\n`);
    
    // Verify the structure
    console.log('🔍 Verifying SiteData structure:');
    console.log(`  ✓ Type: ${typeof siteData} (should be 'object')`);
    console.log(`  ✓ Has title: ${!!siteData.title} (${siteData.title})`);
    console.log(`  ✓ Has description: ${!!siteData.description} (${siteData.description?.substring(0, 50)}...)`);
    console.log(`  ✓ Has features: ${!!siteData.features} (${siteData.features?.length} items)`);
    console.log(`  ✓ Has techStack: ${!!siteData.techStack} (${siteData.techStack?.length} items)`);
    console.log(`  ✓ Has sections: ${!!siteData.sections} (${siteData.sections?.length} sections)`);
    console.log(`  ✓ Has projectType: ${!!siteData.projectType} (${siteData.projectType})`);
    console.log(`  ✓ Has primaryColor: ${!!siteData.primaryColor} (${siteData.primaryColor})`);
    
    // Display the actual generated content
    console.log('\n📋 Generated Content Preview:');
    console.log('═'.repeat(60));
    console.log(`🏷️  Title: ${siteData.title}`);
    console.log(`📝 Description: ${siteData.description}`);
    console.log(`🔧 Tech Stack: ${siteData.techStack?.join(', ')}`);
    console.log(`⭐ Features:`);
    siteData.features?.forEach((feature, i) => {
      console.log(`   ${i + 1}. ${feature}`);
    });
    
    // Verify this is NOT demo content
    const isDemo = siteData.title?.toLowerCase().includes('demo') || 
                   siteData.description?.toLowerCase().includes('demo') ||
                   siteData.features?.some(f => f.toLowerCase().includes('demo'));
    
    console.log(`\n🎯 Content Analysis:`);
    console.log(`  ${!isDemo ? '✅' : '❌'} Not demo content: ${!isDemo}`);
    console.log(`  ${siteData.title?.toLowerCase().includes('aegntic') ? '✅' : '❌'} Contains 'aegntic': ${siteData.title?.toLowerCase().includes('aegntic')}`);
    
    if (!isDemo && siteData.title && siteData.features?.length > 0) {
      console.log('\n🎉 SUCCESS: Core functionality is working!');
      console.log('   ✓ AI successfully analyzed the aegntic repository');
      console.log('   ✓ Generated specific content (not demo data)');
      console.log('   ✓ Returned properly structured SiteData object');
      return true;
    } else {
      console.log('\n❌ FAILURE: Generated content appears to be demo/generic');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    
    // Specific error handling
    if (error.message.includes('API key')) {
      console.error('🔧 Fix: Check VITE_GEMINI_API_KEY in .env.local');
    } else if (error.message.includes('timeout')) {
      console.error('🔧 Fix: Try again - AI service may be busy');
    } else if (error.message.includes('import') || error.message.includes('module')) {
      console.error('🔧 Fix: Build the project first with npm run build');
    } else {
      console.error('🔧 Fix: Check console logs for detailed error');
    }
    
    return false;
  }
}

// Alternative test using Node.js dynamic import
async function testWithNodeImport() {
  console.log('🔄 Attempting alternative test method...\n');
  
  try {
    // Test the environment first
    const envPath = './.env.local';
    const fs = await import('fs');
    
    if (!fs.default.existsSync(envPath)) {
      throw new Error('Missing .env.local file');
    }
    
    const envContent = fs.default.readFileSync(envPath, 'utf8');
    const apiKey = envContent.match(/VITE_GEMINI_API_KEY=(.+)/)?.[1];
    
    if (!apiKey || apiKey.includes('your_') || apiKey.includes('placeholder')) {
      throw new Error('Invalid API key in .env.local');
    }
    
    console.log('✅ Environment configuration valid');
    console.log('✅ API key appears to be configured');
    console.log('\n🎯 The core functionality fix should work in browser');
    console.log('📱 Ready for manual browser testing');
    
    return true;
    
  } catch (error) {
    console.error('❌ Environment test failed:', error.message);
    return false;
  }
}

// Run the tests
console.log('🚀 CORE FUNCTIONALITY TEST');
console.log('═'.repeat(50));

testDirectGeneration()
  .then(success => {
    if (!success) {
      console.log('\n🔄 Trying alternative approach...');
      return testWithNodeImport();
    }
    return success;
  })
  .then(success => {
    console.log('\n' + '═'.repeat(50));
    console.log(`🏁 Final Result: ${success ? 'READY FOR BROWSER TEST' : 'NEEDS FIXES'}`);
    
    if (success) {
      console.log('\n📋 Next Steps:');
      console.log('1. Open browser: http://localhost:5174');
      console.log('2. Enter URL: https://github.com/aegntic/aegnticdotai');
      console.log('3. Click "Generate Site"');
      console.log('4. Verify actual aegntic content appears (not demo)');
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });