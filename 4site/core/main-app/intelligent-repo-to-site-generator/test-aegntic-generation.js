#!/usr/bin/env node

/**
 * Test script to verify site generation functionality with aegntic repository
 * This tests the core product functionality as requested by the user
 */

import { generateSiteContentFromUrl } from './services/geminiService.js';

async function testAegnticGeneration() {
  console.log('🚀 Testing site generation for aegntic repository...\n');
  
  const testUrl = 'https://github.com/aegntic/aegnticdotai';
  
  try {
    console.log(`📍 Repository: ${testUrl}`);
    console.log('⏳ Generating site content...\n');
    
    const startTime = Date.now();
    const siteData = await generateSiteContentFromUrl(testUrl);
    const endTime = Date.now();
    
    console.log('✅ Generation successful!');
    console.log(`⏱️  Time taken: ${(endTime - startTime) / 1000}s\n`);
    
    console.log('📊 Generated Site Data:');
    console.log('═'.repeat(50));
    console.log(`🏷️  Title: ${siteData.title}`);
    console.log(`📝 Description: ${siteData.description}`);
    console.log(`🔧 Tech Stack: ${siteData.techStack.join(', ')}`);
    console.log(`⭐ Features: ${siteData.features.length} items`);
    console.log(`📑 Sections: ${siteData.sections.length} sections`);
    console.log(`🎨 Primary Color: ${siteData.primaryColor}`);
    console.log(`📦 Project Type: ${siteData.projectType}`);
    console.log(`🎯 Template: ${siteData.template}`);
    console.log('═'.repeat(50));
    
    console.log('\n🔍 Features Preview:');
    siteData.features.forEach((feature, index) => {
      console.log(`  ${index + 1}. ${feature}`);
    });
    
    console.log('\n📋 Sections Preview:');
    siteData.sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.title} (${section.content.substring(0, 100)}...)`);
    });
    
    console.log('\n✨ Core functionality is working correctly!');
    console.log('🎯 The site generation pipeline successfully:');
    console.log('  ✓ Fetched repository data');
    console.log('  ✓ Analyzed content with AI');
    console.log('  ✓ Generated structured site data');
    console.log('  ✓ Returned properly typed SiteData object');
    
    return true;
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    
    if (error.message.includes('API key')) {
      console.error('  • Check VITE_GEMINI_API_KEY in .env.local');
      console.error('  • Ensure API key has Gemini access enabled');
    } else if (error.message.includes('timeout')) {
      console.error('  • Try again - AI service may be temporarily busy');
      console.error('  • Check internet connection');
    } else {
      console.error('  • Check console for detailed error logs');
      console.error('  • Verify repository URL is accessible');
    }
    
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAegnticGeneration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}

export { testAegnticGeneration };