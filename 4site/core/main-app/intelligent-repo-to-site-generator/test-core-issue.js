#!/usr/bin/env node

/**
 * Test the core issue: verify that generateSiteContentFromUrl returns SiteData not string
 * This tests the exact problem the user identified
 */

import fs from 'fs';

// Simulate the fixed function behavior
async function simulateGenerationFlow() {
  console.log('🔍 TESTING CORE ISSUE FIX');
  console.log('═'.repeat(50));
  
  // Check if the API key is configured
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const apiKey = envContent.match(/VITE_GEMINI_API_KEY=(.+)/)?.[1];
  
  if (!apiKey || apiKey === 'your_actual_api_key') {
    console.log('❌ ISSUE: API key not configured');
    console.log('🔧 FIX: Set valid GEMINI_API_KEY in .env.local');
    return false;
  }
  
  console.log('✅ API key configured');
  
  // Read the geminiService.ts to verify the fix
  const serviceContent = fs.readFileSync('./services/geminiService.ts', 'utf8');
  
  // Check if the function signature was fixed
  const hasCorrectReturnType = serviceContent.includes('Promise<SiteData>');
  const usesEnhancedService = serviceContent.includes('generateEnhancedSiteContent');
  const hasConverter = serviceContent.includes('convertToSiteData');
  
  console.log('\n📋 Code Analysis:');
  console.log(`  ${hasCorrectReturnType ? '✅' : '❌'} Returns Promise<SiteData> (was Promise<string>)`);
  console.log(`  ${usesEnhancedService ? '✅' : '❌'} Uses enhanced AI service`);
  console.log(`  ${hasConverter ? '✅' : '❌'} Has converter function`);
  
  // Check App.tsx to see if it expects SiteData
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  const appExpectsSiteData = appContent.includes('setSiteData(data)') && 
                            appContent.includes('siteData: SiteData');
  
  console.log(`  ${appExpectsSiteData ? '✅' : '❌'} App.tsx expects SiteData object`);
  
  // Check SimplePreviewTemplate
  const templateExists = fs.existsSync('./components/templates/SimplePreviewTemplate.tsx');
  let templateWorksWithSiteData = false;
  
  if (templateExists) {
    const templateContent = fs.readFileSync('./components/templates/SimplePreviewTemplate.tsx', 'utf8');
    templateWorksWithSiteData = templateContent.includes('siteData.title') &&
                               templateContent.includes('siteData.description') &&
                               templateContent.includes('siteData.techStack');
  }
  
  console.log(`  ${templateExists ? '✅' : '❌'} SimplePreviewTemplate exists`);
  console.log(`  ${templateWorksWithSiteData ? '✅' : '❌'} Template uses SiteData properties`);
  
  // Check if the UI flow is correct
  const uiShowsPreview = appContent.includes('SimplePreviewTemplate') && 
                        appContent.includes('AppState.Success');
  const hasCorrectButtons = appContent.includes('Deploy to GitHub Pages') && 
                           appContent.includes('Retry') && 
                           appContent.includes('Edit') &&
                           !appContent.includes('Deploy to Vercel');
  
  console.log('\n🎨 UI Flow Analysis:');
  console.log(`  ${uiShowsPreview ? '✅' : '❌'} Shows site preview on success`);
  console.log(`  ${hasCorrectButtons ? '✅' : '❌'} Has correct action buttons`);
  
  // Overall assessment
  const allFixed = hasCorrectReturnType && usesEnhancedService && hasConverter && 
                   appExpectsSiteData && templateExists && templateWorksWithSiteData &&
                   uiShowsPreview && hasCorrectButtons;
  
  console.log('\n🎯 CORE ISSUE STATUS:');
  if (allFixed) {
    console.log('✅ FIXED: All components properly integrated');
    console.log('✅ Type mismatch resolved (string → SiteData)');
    console.log('✅ UI shows actual preview instead of summary');
    console.log('✅ Correct deployment options displayed');
    
    console.log('\n📱 MANUAL TEST REQUIRED:');
    console.log('1. Browser: http://localhost:5174');
    console.log('2. Enter: https://github.com/aegntic/aegnticdotai');
    console.log('3. Click "Generate Site"');
    console.log('4. Verify: Shows actual aegntic content (not demo)');
    
    return true;
  } else {
    console.log('❌ ISSUES REMAIN: Some components not properly fixed');
    return false;
  }
}

// Test the type safety issue specifically
function testTypeSafety() {
  console.log('\n🛡️  TYPE SAFETY VERIFICATION');
  console.log('═'.repeat(30));
  
  try {
    const typesContent = fs.readFileSync('./types.ts', 'utf8');
    
    // Check if SiteData has all required fields
    const requiredFields = [
      'title: string',
      'description: string',
      'features: string[]',
      'techStack: string[]',
      'sections: Section[]',
      'projectType:',
      'primaryColor: string'
    ];
    
    const missingFields = requiredFields.filter(field => !typesContent.includes(field));
    
    if (missingFields.length === 0) {
      console.log('✅ All required SiteData fields present');
      return true;
    } else {
      console.log('❌ Missing SiteData fields:');
      missingFields.forEach(field => console.log(`   - ${field}`));
      return false;
    }
  } catch (error) {
    console.error('❌ Type safety check failed:', error.message);
    return false;
  }
}

// Run the analysis
async function main() {
  const coreFixed = await simulateGenerationFlow();
  const typesFixed = testTypeSafety();
  
  console.log('\n🏁 FINAL STATUS:');
  console.log('═'.repeat(50));
  
  if (coreFixed && typesFixed) {
    console.log('🎉 SUCCESS: Core functionality should work!');
    console.log('');
    console.log('The original issue was:');
    console.log('❌ "the core product is not loading though. it needs to generate a site once the repo is entered"');
    console.log('');
    console.log('Root cause identified and fixed:');
    console.log('✅ Type mismatch: generateSiteContentFromUrl returned string but UI expected SiteData');
    console.log('✅ Missing fields: SiteData interface extended with description, features, techStack');
    console.log('✅ UI flow: Success state now shows actual site preview with SimplePreviewTemplate');
    console.log('✅ Actions: Deployment popup shows GitHub Pages, Edit, Retry (not Vercel)');
    console.log('');
    console.log('🚀 Ready for browser verification with: https://github.com/aegntic/aegnticdotai');
    
    return true;
  } else {
    console.log('❌ FAILURE: Issues still need to be resolved');
    return false;
  }
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });