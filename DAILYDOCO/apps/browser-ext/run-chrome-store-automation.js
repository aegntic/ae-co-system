#!/usr/bin/env node

/**
 * DailyDoco Pro - Chrome Store Automation Runner
 * Quick execution script for Chrome Web Store submission
 */

const { ChromeStorePublisher } = require('./shared/chrome-store-publisher.js');

async function runAutomation() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           DailyDoco Pro Chrome Store Automation              ║
║                 Ultra-Tier Submission System                 ║
╠═══════════════════════════════════════════════════════════════╣
║ 🎯 Target: Chrome Web Store Developer Console               ║
║ 🤖 Mode: Intelligent form automation                        ║
║ 📦 Package: DailyDoco Pro v1.0.0                           ║
║ 🚀 Status: Ready for automated submission                   ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // URL from the user's request
  const devConsoleUrl = 'https://chrome.google.com/webstore/devconsole/5be40483-6a7d-4c82-a5f6-7db4274e96a8/phjoklpmfkappombncehbabpdbnlaicj/edit';
  
  try {
    // Check if Puppeteer is available
    let puppeteer;
    try {
      puppeteer = require('puppeteer');
      console.log('✅ Puppeteer available - proceeding with automation');
    } catch (error) {
      console.error('❌ Puppeteer not installed. Install with: npm install puppeteer');
      console.log(`
📋 Manual Instructions as Fallback:

1. Open your browser to: ${devConsoleUrl}

2. Upload Extension Package:
   - File: /home/tabs/DAILYDOCO/apps/browser-ext/builds/dailydoco-pro-chrome-v1.0.0-2025-05-31.zip

3. Fill Extension Details:
   - Name: "DailyDoco Pro - AI Documentation Assistant"
   - Summary: "AI-powered documentation platform for developers"
   - Description: [Full description from config]
   - Category: "Developer Tools"

4. Upload Icons:
   - 128x128: /home/tabs/DAILYDOCO/apps/browser-ext/chrome/assets/icon-128.png

5. Store Listing:
   - Website: https://dailydoco.pro
   - Support: https://dailydoco.pro/support
   - Privacy: https://dailydoco.pro/privacy

6. Save as Draft and Review
      `);
      return;
    }
    
    const publisher = new ChromeStorePublisher();
    await publisher.publishToStore(devConsoleUrl);
    
    console.log(`
🎉 Chrome Web Store automation completed!

✅ What was accomplished:
   • Extension package uploaded
   • All form fields filled automatically
   • Icons uploaded to correct locations
   • Store listing details completed
   • Saved as draft for review

🔍 Next steps:
   1. Review all details in the Developer Console
   2. Add any additional screenshots if needed
   3. Submit for review when ready
   
🧠 Automation patterns stored in memory for future use
    `);
    
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    
    console.log(`
🔧 Troubleshooting:
   • Ensure you're logged into aegntic@gmail.com
   • Check that the Developer Console URL is accessible
   • Verify browser permissions for file uploads
   • Try running in visual mode (headless: false)
   
📸 Error screenshots saved to: ./demo-output/error-state.png
    `);
  }
}

// Execute if run directly
if (require.main === module) {
  runAutomation();
}

module.exports = { runAutomation };