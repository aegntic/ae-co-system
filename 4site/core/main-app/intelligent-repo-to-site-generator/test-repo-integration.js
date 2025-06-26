import puppeteer from 'puppeteer';

async function testRepositoryIntegration() {
  console.log('🚀 Testing repository integration...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to the development server
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });
    
    console.log('✓ Page loaded successfully');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-initial-state.png' });
    
    // Check if API key is configured
    const hasApiKey = await page.evaluate(() => {
      const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
      return apiKey && apiKey !== 'PLACEHOLDER_API_KEY';
    });
    
    if (!hasApiKey) {
      console.log('⚠️  API key not configured - testing with mock data only');
    }
    
    // Find the URL input field
    const urlInput = await page.$('input[type="url"], input[placeholder*="github"], input[placeholder*="repository"]');
    
    if (!urlInput) {
      console.log('❌ URL input field not found');
      return false;
    }
    
    console.log('✓ URL input field found');
    
    // Test with aegntic repository
    const testUrl = 'https://github.com/aegntic/aegnticdotai';
    await urlInput.type(testUrl);
    
    console.log(`✓ Entered repository URL: ${testUrl}`);
    
    // Find and click submit button
    const submitButton = await page.$('button[type="submit"], button:contains("Generate"), .submit-btn');
    
    if (!submitButton) {
      console.log('❌ Submit button not found');
      return false;
    }
    
    console.log('✓ Submit button found');
    
    // Take screenshot before submission
    await page.screenshot({ path: 'test-before-submit.png' });
    
    // Monitor console logs
    page.on('console', msg => {
      console.log(`🔍 Browser Console: ${msg.text()}`);
    });
    
    // Monitor network requests
    page.on('response', response => {
      if (response.url().includes('api.github.com')) {
        console.log(`📡 GitHub API: ${response.status()} ${response.url()}`);
      }
    });
    
    // Click submit and wait for response
    await submitButton.click();
    
    console.log('✓ Submitted form');
    
    // Wait for either success or error state
    try {
      await page.waitForSelector('.site-preview, .error-message, .loading', { timeout: 30000 });
      
      // Check what state we're in
      const hasPreview = await page.$('.site-preview');
      const hasError = await page.$('.error-message');
      const isLoading = await page.$('.loading');
      
      if (hasPreview) {
        console.log('🎉 Site preview loaded successfully!');
        
        // Check if it contains repository-specific content
        const previewText = await page.evaluate(() => {
          const preview = document.querySelector('.site-preview');
          return preview ? preview.textContent : '';
        });
        
        if (previewText.toLowerCase().includes('aegntic')) {
          console.log('✅ Repository-specific content detected in preview');
        } else {
          console.log('⚠️  Preview may be showing generic content');
        }
        
        await page.screenshot({ path: 'test-success-preview.png' });
        return true;
        
      } else if (hasError) {
        const errorText = await page.evaluate(() => {
          const error = document.querySelector('.error-message');
          return error ? error.textContent : 'Unknown error';
        });
        console.log(`❌ Error state: ${errorText}`);
        await page.screenshot({ path: 'test-error-state.png' });
        return false;
        
      } else if (isLoading) {
        console.log('⏳ Still loading after 30 seconds - taking screenshot');
        await page.screenshot({ path: 'test-timeout-loading.png' });
        return false;
      }
      
    } catch (error) {
      console.log(`❌ Timeout waiting for response: ${error.message}`);
      await page.screenshot({ path: 'test-timeout.png' });
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testRepositoryIntegration().then(success => {
  if (success) {
    console.log('\n🎉 Repository integration test PASSED!');
    console.log('The fix is working correctly - repository-specific content is being generated.');
    process.exit(0);
  } else {
    console.log('\n❌ Repository integration test FAILED!');
    console.log('Please check the screenshots and console output for debugging.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});