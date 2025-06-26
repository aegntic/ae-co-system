const puppeteer = require('puppeteer');

async function connectToExistingChrome() {
  try {
    // Connect to existing Chrome with remote debugging
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('polar.sh')) || pages[0];
    
    console.log('✅ Connected to existing Chrome session');
    console.log('📄 Current page:', page.url());
    
    return { browser, page };
  } catch (error) {
    console.log('❌ Could not connect to remote Chrome. Start Chrome with:');
    console.log('google-chrome --remote-debugging-port=9222 --disable-web-security');
    throw error;
  }
}

async function automateMetadata(metadata) {
  const { browser, page } = await connectToExistingChrome();
  
  console.log('🤖 Starting metadata automation on existing session...');
  
  // Your metadata automation logic here
  for (const [key, value] of Object.entries(metadata)) {
    console.log(`📝 ${key}: ${value}`);
    // Add actual field filling logic
  }
  
  console.log('✅ Metadata automation complete');
  // Don't close browser since we connected to existing one
}

// Export for use
module.exports = { connectToExistingChrome, automateMetadata };

// If run directly
if (require.main === module) {
  const metadata = {
    'product_type': 'developer_tool',
    'category': 'website_generator',
    'target_audience': 'open_source_developers'
  };
  
  automateMetadata(metadata).catch(console.error);
}
