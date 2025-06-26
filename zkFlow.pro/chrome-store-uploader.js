const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Chrome Web Store Developer Dashboard URL
  dashboardUrl: 'https://chrome.google.com/webstore/devconsole',
  
  // Extension details
  extensionName: 'zkFlow.pro - Smart Form Automation',
  
  // File paths
  extensionZip: path.join(__dirname, 'extension', 'zkflow-pro.zip'),
  screenshotsDir: path.join(__dirname, 'store-assets'),
  listingFile: path.join(__dirname, 'CHROME_STORE_LISTING.md'),
  
  // Timeouts
  navigationTimeout: 60000,
  uploadTimeout: 120000
};

// Read the listing content
function getListingContent() {
  const content = fs.readFileSync(CONFIG.listingFile, 'utf-8');
  
  // Parse the markdown to extract relevant sections
  const shortDescMatch = content.match(/## 📝 Short Description.*\n(.*)/);
  const detailedDescMatch = content.match(/## 📋 Detailed Description\n([\s\S]*?)## 🏷️/);
  
  return {
    shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
    detailedDescription: detailedDescMatch ? detailedDescMatch[1].trim() : '',
    category: 'Productivity',
    language: 'en'
  };
}

async function uploadToChromeStore(options = {}) {
  console.log('🚀 Starting Chrome Web Store upload process...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // We need to see what's happening for manual login
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to Chrome Web Store Developer Dashboard
    console.log('📍 Navigating to Chrome Web Store Developer Dashboard...');
    await page.goto(CONFIG.dashboardUrl, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.navigationTimeout 
    });
    
    // Check if user needs to log in
    const isLoggedIn = await page.evaluate(() => {
      return !window.location.href.includes('accounts.google.com');
    });
    
    if (!isLoggedIn) {
      console.log('\n⚠️  Please log in to your Google account in the browser window.');
      console.log('   Once logged in, the script will continue automatically.\n');
      
      // Wait for successful login (redirect back to dashboard)
      await page.waitForFunction(
        () => window.location.href.includes('chrome.google.com/webstore/devconsole'),
        { timeout: 300000 } // 5 minute timeout for login
      );
      
      console.log('✅ Login successful!\n');
    }
    
    // Wait a bit for the dashboard to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click on "New Item" button
    console.log('📦 Creating new extension listing...');
    const newItemButton = await page.waitForSelector('button[aria-label="Add new item"], a[href*="create"]', {
      timeout: 30000
    });
    
    if (newItemButton) {
      await newItemButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } else {
      // Alternative: Look for text-based button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const newItemBtn = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('new item') || 
          btn.textContent.toLowerCase().includes('add new')
        );
        if (newItemBtn) newItemBtn.click();
      });
    }
    
    // Upload the extension ZIP file
    console.log('📤 Uploading extension package...');
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });
    await fileInput.uploadFile(CONFIG.extensionZip);
    
    // Wait for upload to complete
    await page.waitForFunction(
      () => {
        const progressBars = document.querySelectorAll('[role="progressbar"]');
        return progressBars.length === 0 || 
               Array.from(progressBars).every(bar => 
                 bar.getAttribute('aria-valuenow') === '100'
               );
      },
      { timeout: CONFIG.uploadTimeout }
    );
    
    console.log('✅ Extension package uploaded successfully!\n');
    
    // Get listing content
    const listing = getListingContent();
    
    // Fill in the store listing form
    console.log('📝 Filling in store listing information...');
    
    // Wait for form to appear
    await page.waitForSelector('input[name="name"], input[placeholder*="name"]', { timeout: 30000 });
    
    // Extension name
    await page.evaluate((name) => {
      const nameInput = document.querySelector('input[name="name"], input[placeholder*="name"]');
      if (nameInput) {
        nameInput.value = name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, CONFIG.extensionName);
    
    // Short description
    await page.evaluate((desc) => {
      const shortDescInput = document.querySelector('textarea[name="shortDescription"], textarea[placeholder*="short"]');
      if (shortDescInput) {
        shortDescInput.value = desc;
        shortDescInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, listing.shortDescription);
    
    // Detailed description
    await page.evaluate((desc) => {
      const detailDescInput = document.querySelector('textarea[name="description"], textarea[placeholder*="detailed"], textarea[placeholder*="description"]:not([placeholder*="short"])');
      if (detailDescInput) {
        detailDescInput.value = desc;
        detailDescInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, listing.detailedDescription);
    
    // Category selection
    await page.evaluate((category) => {
      const categorySelect = document.querySelector('select[name="category"], [aria-label*="category"]');
      if (categorySelect) {
        const option = Array.from(categorySelect.options).find(opt => 
          opt.text.toLowerCase().includes(category.toLowerCase())
        );
        if (option) categorySelect.value = option.value;
        categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, listing.category);
    
    console.log('✅ Basic information filled!\n');
    
    // Upload screenshots
    console.log('📸 Uploading screenshots...');
    const screenshots = [
      'screenshot-1-hero.png',
      'screenshot-2-demo.png', 
      'screenshot-3-stats.png',
      'screenshot-4-workflow.png',
      'screenshot-5-security.png'
    ];
    
    for (let i = 0; i < screenshots.length; i++) {
      const screenshotPath = path.join(CONFIG.screenshotsDir, screenshots[i]);
      if (fs.existsSync(screenshotPath)) {
        // Find the screenshot upload input for this position
        const screenshotInputs = await page.$$('input[type="file"][accept*="image"]');
        if (screenshotInputs[i]) {
          await screenshotInputs[i].uploadFile(screenshotPath);
          console.log(`  ✅ Uploaded ${screenshots[i]}`);
          
          // Wait for upload to process
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Upload promotional images
    console.log('\n🎨 Uploading promotional images...');
    
    // Small tile (440x280)
    const smallTilePath = path.join(CONFIG.screenshotsDir, 'promotional-tile-440x280.png');
    if (fs.existsSync(smallTilePath)) {
      const smallTileInput = await page.$('input[type="file"][name*="small"], input[type="file"][placeholder*="440"]');
      if (smallTileInput) {
        await smallTileInput.uploadFile(smallTilePath);
        console.log('  ✅ Uploaded small promotional tile');
      }
    }
    
    // Large tile (1400x560) 
    const largeTilePath = path.join(CONFIG.screenshotsDir, 'featured-promotional-1400x560.png');
    if (fs.existsSync(largeTilePath)) {
      const largeTileInput = await page.$('input[type="file"][name*="large"], input[type="file"][placeholder*="1400"]');
      if (largeTileInput) {
        await largeTileInput.uploadFile(largeTilePath);
        console.log('  ✅ Uploaded large promotional tile');
      }
    }
    
    console.log('\n✅ All assets uploaded successfully!\n');
    
    // Scroll to bottom to ensure all fields are visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Privacy practices (if required)
    console.log('🔒 Setting privacy practices...');
    await page.evaluate(() => {
      // Check "No personal data collection" if available
      const privacyCheckboxes = document.querySelectorAll('input[type="checkbox"][name*="privacy"], input[type="checkbox"][aria-label*="privacy"]');
      privacyCheckboxes.forEach(checkbox => {
        if (checkbox.parentElement.textContent.toLowerCase().includes('no') || 
            checkbox.parentElement.textContent.toLowerCase().includes('not collect')) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
    
    // Find and highlight the submit button
    const submitButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('submit') ||
        btn.textContent.toLowerCase().includes('publish') ||
        btn.textContent.toLowerCase().includes('save')
      );
      
      if (submitBtn) {
        // Highlight the button
        submitBtn.style.border = '3px solid red';
        submitBtn.style.boxShadow = '0 0 20px red';
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ALMOST DONE! MANUAL CONFIRMATION REQUIRED');
    console.log('='.repeat(60));
    console.log('\n📋 Please review the filled information in the browser window.');
    console.log('   The SUBMIT button has been highlighted in RED.\n');
    console.log('⚠️  IMPORTANT: Before clicking submit, please:');
    console.log('   1. Review all filled information');
    console.log('   2. Add any missing required fields');
    console.log('   3. Accept any terms and conditions');
    console.log('   4. Set pricing if required ($4.99/month for Pro)');
    console.log('   5. Click the highlighted SUBMIT button\n');
    console.log('✋ The script will wait for your confirmation...\n');
    
    // Wait for user to manually submit
    await page.waitForFunction(
      () => {
        // Check if we've navigated away from the form (indicating submission)
        return window.location.href.includes('success') ||
               window.location.href.includes('dashboard') ||
               document.querySelector('.success-message') ||
               document.querySelector('[aria-label*="success"]');
      },
      { timeout: 600000 } // 10 minute timeout for manual review
    );
    
    console.log('\n🎉 SUCCESS! Extension submitted to Chrome Web Store!');
    console.log('\n📊 Next Steps:');
    console.log('   1. Wait for Google review (typically 1-3 business days)');
    console.log('   2. You\'ll receive an email when approved');
    console.log('   3. Monitor the developer dashboard for status updates');
    console.log('   4. Prepare marketing materials for launch\n');
    
    console.log('🚀 Ready to go viral! Good luck with your launch! 🎊\n');
    
  } catch (error) {
    console.error('\n❌ Error during upload process:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   - Make sure you\'re logged in to the correct Google account');
    console.log('   - Ensure you have a Chrome Web Store developer account ($5 one-time fee)');
    console.log('   - Check that all required files exist');
    console.log('   - Try running the script again\n');
  }
  
  // Keep browser open for user to see the result
  console.log('ℹ️  Browser window will remain open. Close it manually when done.');
}

// Check if all required files exist
function checkRequiredFiles() {
  console.log('🔍 Checking required files...\n');
  
  const requiredFiles = [
    { path: CONFIG.extensionZip, name: 'Extension package' },
    { path: CONFIG.listingFile, name: 'Store listing content' },
    { path: path.join(CONFIG.screenshotsDir, 'screenshot-1-hero.png'), name: 'Screenshot 1' },
    { path: path.join(CONFIG.screenshotsDir, 'promotional-tile-440x280.png'), name: 'Promotional tile' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`  ✅ ${file.name}: ${file.path}`);
    } else {
      console.log(`  ❌ ${file.name}: NOT FOUND at ${file.path}`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  return allFilesExist;
}

// Main execution
async function main() {
  console.log('🎯 zkFlow.pro - Chrome Web Store Automated Uploader');
  console.log('================================================\n');
  
  // Check files
  if (!checkRequiredFiles()) {
    console.log('❌ Some required files are missing. Please run the build process first.\n');
    process.exit(1);
  }
  
  console.log('✅ All required files found!\n');
  console.log('📌 This script will:');
  console.log('   1. Open Chrome and navigate to the Web Store Developer Dashboard');
  console.log('   2. Help you log in if needed');
  console.log('   3. Upload your extension package');
  console.log('   4. Fill in all store listing information');
  console.log('   5. Upload screenshots and promotional images');
  console.log('   6. Highlight the submit button for your final review\n');
  
  console.log('⚠️  IMPORTANT: You must have a Chrome Web Store developer account.');
  console.log('   If you don\'t have one, visit: https://chrome.google.com/webstore/devconsole\n');
  
  console.log('Press ENTER to start the upload process...');
  
  // Wait for user confirmation
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  // Start the upload process
  await uploadToChromeStore();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadToChromeStore };