import { generateSiteWithRetry } from './services/multiModalOrchestrator.js';
import { generateLandingPageVisuals } from './services/landingPageVisuals.js';

async function testAPIGeneration() {
  console.log('Testing AI-powered site generation...\n');
  
  // Test 1: Landing page visuals
  console.log('1. Testing landing page visual generation...');
  try {
    const visuals = await generateLandingPageVisuals();
    console.log('✓ Landing page visuals generated:');
    console.log('  - Hero image:', visuals.heroImage ? '✓' : '✗');
    console.log('  - Project icon:', visuals.projectIcon ? '✓' : '✗');
    console.log('  - Demo images:', visuals.demoImages.length, 'generated');
    console.log('  - Color palette:', visuals.colorPalette.join(', '));
  } catch (error) {
    console.log('✗ Landing page visual generation failed:', error.message);
  }
  
  // Test 2: Site generation with AI visuals
  console.log('\n2. Testing full site generation for aegntic/project4site...');
  try {
    const progressCallback = (progress) => {
      console.log(`  ${progress.stage}: ${progress.progress}% - ${progress.message}`);
    };
    
    const siteData = await generateSiteWithRetry(
      'https://github.com/aegntic/project4site',
      progressCallback
    );
    
    console.log('\n✓ Site generated successfully:');
    console.log('  - Title:', siteData.title);
    console.log('  - Tech stack:', siteData.techStack?.join(', ') || 'Not detected');
    console.log('  - Sections:', siteData.sections?.length || 0);
    console.log('  - Has AI visuals:', siteData.visuals ? '✓' : '✗');
    
    if (siteData.visuals) {
      console.log('\n  AI-generated visuals:');
      console.log('    - Hero image:', siteData.visuals.heroImage ? '✓' : '✗');
      console.log('    - Project icon:', siteData.visuals.projectIcon ? '✓' : '✗');
      console.log('    - Color palette:', siteData.visuals.colorPalette?.join(', ') || 'None');
    }
  } catch (error) {
    console.log('✗ Site generation failed:', error.message);
  }
  
  console.log('\n✅ API tests completed!');
}

testAPIGeneration().catch(console.error);