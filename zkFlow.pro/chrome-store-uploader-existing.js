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

async function connectToExistingChrome() {
  console.log('🔌 Connecting to your existing Chrome instance...\n');
  
  console.log('📋 IMPORTANT: Before running this script, you need to:');
  console.log('1. Close all Chrome windows');
  console.log('2. Start Chrome with remote debugging enabled:\n');
  
  console.log('   On Mac:');
  console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222\n');
  
  console.log('   On Windows:');
  console.log('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222\n');
  
  console.log('   On Linux:');
  console.log('   google-chrome --remote-debugging-port=9222\n');
  
  console.log('3. Log in to your Google account in the opened Chrome');
  console.log('4. Navigate to: https://chrome.google.com/webstore/devconsole');
  console.log('5. Then run this script again\n');
  
  console.log('Press ENTER when Chrome is ready with remote debugging enabled...');
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  try {
    // Connect to the existing Chrome instance
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    console.log('✅ Successfully connected to Chrome!\n');
    
    // Get the pages
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('chrome.google.com/webstore'));
    
    if (!page) {
      console.log('📍 Opening Chrome Web Store Developer Dashboard...');
      page = await browser.newPage();
      await page.goto(CONFIG.dashboardUrl, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.navigationTimeout 
      });
    } else {
      console.log('✅ Found existing Chrome Web Store tab!\n');
    }
    
    // Now continue with the upload process
    await uploadExtension(page);
    
  } catch (error) {
    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\n❌ Could not connect to Chrome. Make sure you:');
      console.error('   1. Started Chrome with --remote-debugging-port=9222');
      console.error('   2. Chrome is still running');
      console.error('   3. No other application is using port 9222\n');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  }
}

async function uploadExtension(page) {
  try {
    // Wait a bit for the page to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on "New Item" button
    console.log('📦 Creating new extension listing...');
    
    // Try multiple selectors for the "New Item" button
    const newItemSelectors = [
      'button[aria-label="Add new item"]',
      'a[href*="create"]',
      'button:has-text("New item")',
      'a:has-text("New item")',
      'button:has-text("Add new")',
      '[role="button"]:has-text("New")'
    ];
    
    let clicked = false;
    for (const selector of newItemSelectors) {
      try {
        await page.click(selector, { timeout: 5000 });
        clicked = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!clicked) {
      // Try JavaScript click
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const newItemBtn = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('new item') || 
                 text.includes('add new') || 
                 text.includes('create') ||
                 text.includes('new extension');
        });
        if (newItemBtn) {
          newItemBtn.click();
          return true;
        }
        return false;
      });
    }
    
    // Wait for navigation or form to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Upload the extension ZIP file
    console.log('📤 Uploading extension package...');
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });
    await fileInput.uploadFile(CONFIG.extensionZip);
    
    // Wait for upload to complete
    console.log('   Waiting for upload to complete...');
    await page.waitForFunction(
      () => {
        const progressBars = document.querySelectorAll('[role="progressbar"], .progress, [class*="progress"]');
        return progressBars.length === 0 || 
               Array.from(progressBars).every(bar => {
                 const value = bar.getAttribute('aria-valuenow') || bar.style.width;
                 return value === '100' || value === '100%';
               });
      },
      { timeout: CONFIG.uploadTimeout }
    );
    
    console.log('✅ Extension package uploaded successfully!\n');
    
    // Get listing content
    const listing = getListingContent();
    
    // Fill in the store listing form
    console.log('📝 Filling in store listing information...');
    
    // Fill form fields
    await fillFormField(page, 'name', CONFIG.extensionName);
    await fillFormField(page, 'shortDescription', listing.shortDescription);
    await fillFormField(page, 'description', listing.detailedDescription);
    
    // Set category
    await selectCategory(page, listing.category);
    
    console.log('✅ Basic information filled!\n');
    
    // Upload screenshots
    await uploadScreenshots(page);
    
    // Upload promotional images
    await uploadPromotionalImages(page);
    
    // Set privacy settings
    await setPrivacySettings(page);
    
    // Highlight submit button
    await highlightSubmitButton(page);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ALMOST DONE! MANUAL CONFIRMATION REQUIRED');
    console.log('='.repeat(60));
    console.log('\n📋 Please review the filled information in Chrome.');
    console.log('   The SUBMIT button has been highlighted in RED.\n');
    console.log('⚠️  IMPORTANT: Before clicking submit, please:');
    console.log('   1. Review all filled information');
    console.log('   2. Add any missing required fields');
    console.log('   3. Accept any terms and conditions');
    console.log('   4. Set pricing if required ($4.99/month for Pro)');
    console.log('   5. Click the highlighted SUBMIT button\n');
    
    console.log('✅ The script has completed its automated tasks.');
    console.log('   You can now close this terminal and finish in Chrome.\n');
    
  } catch (error) {
    console.error('\n❌ Error during upload:', error.message);
    console.log('\n💡 Try refreshing the page in Chrome and running the script again.');
  }
}

async function fillFormField(page, fieldName, value) {
  const selectors = [
    `input[name="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
    `input[placeholder*="${fieldName}"]`,
    `textarea[placeholder*="${fieldName}"]`,
    `[aria-label*="${fieldName}"]`
  ];
  
  for (const selector of selectors) {
    try {
      await page.type(selector, value, { delay: 50 });
      console.log(`  ✅ Filled ${fieldName}`);
      return;
    } catch (e) {
      // Try next selector
    }
  }
  
  console.log(`  ⚠️  Could not find field: ${fieldName}`);
}

async function selectCategory(page, category) {
  try {
    await page.evaluate((cat) => {
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const option = Array.from(select.options).find(opt => 
          opt.text.toLowerCase().includes(cat.toLowerCase())
        );
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, category);
    console.log(`  ✅ Selected category: ${category}`);
  } catch (e) {
    console.log('  ⚠️  Could not select category');
  }
}

async function uploadScreenshots(page) {
  console.log('📸 Uploading screenshots...');
  const screenshots = [
    'screenshot-1-hero.png',
    'screenshot-2-demo.png', 
    'screenshot-3-stats.png',
    'screenshot-4-workflow.png',
    'screenshot-5-security.png'
  ];
  
  const screenshotInputs = await page.$$('input[type="file"][accept*="image"]:not([name*="promotional"]):not([name*="tile"])');
  
  for (let i = 0; i < Math.min(screenshots.length, screenshotInputs.length); i++) {
    const screenshotPath = path.join(CONFIG.screenshotsDir, screenshots[i]);
    if (fs.existsSync(screenshotPath)) {
      try {
        await screenshotInputs[i].uploadFile(screenshotPath);
        console.log(`  ✅ Uploaded ${screenshots[i]}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log(`  ⚠️  Failed to upload ${screenshots[i]}`);
      }
    }
  }
}

async function uploadPromotionalImages(page) {
  console.log('\n🎨 Uploading promotional images...');
  
  // Small tile
  const smallTilePath = path.join(CONFIG.screenshotsDir, 'promotional-tile-440x280.png');
  const smallTileInputs = await page.$$('input[type="file"][name*="small"], input[type="file"][accept*="440"]');
  if (smallTileInputs.length > 0 && fs.existsSync(smallTilePath)) {
    try {
      await smallTileInputs[0].uploadFile(smallTilePath);
      console.log('  ✅ Uploaded small promotional tile');
    } catch (e) {
      console.log('  ⚠️  Failed to upload small tile');
    }
  }
  
  // Large tile
  const largeTilePath = path.join(CONFIG.screenshotsDir, 'featured-promotional-1400x560.png');
  const largeTileInputs = await page.$$('input[type="file"][name*="large"], input[type="file"][accept*="1400"]');
  if (largeTileInputs.length > 0 && fs.existsSync(largeTilePath)) {
    try {
      await largeTileInputs[0].uploadFile(largeTilePath);
      console.log('  ✅ Uploaded large promotional tile');
    } catch (e) {
      console.log('  ⚠️  Failed to upload large tile');
    }
  }
}

async function setPrivacySettings(page) {
  console.log('\n🔒 Setting privacy practices...');
  await page.evaluate(() => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const label = checkbox.parentElement.textContent.toLowerCase();
      if (label.includes('no') && label.includes('personal') ||
          label.includes('not collect') ||
          label.includes('privacy')) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

async function highlightSubmitButton(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const submitBtn = buttons.find(btn => {
      const text = btn.textContent.toLowerCase();
      return text.includes('submit') ||
             text.includes('publish') ||
             text.includes('save') ||
             text.includes('continue');
    });
    
    if (submitBtn) {
      submitBtn.style.border = '3px solid red';
      submitBtn.style.boxShadow = '0 0 20px red';
      submitBtn.style.animation = 'pulse 2s infinite';
      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 20px red; }
          50% { box-shadow: 0 0 40px red; }
          100% { box-shadow: 0 0 20px red; }
        }
      `;
      document.head.appendChild(style);
    }
  });
}

// Check required files
function checkRequiredFiles() {
  console.log('🔍 Checking required files...\n');
  
  const requiredFiles = [
    { path: CONFIG.extensionZip, name: 'Extension package' },
    { path: CONFIG.listingFile, name: 'Store listing content' },
    { path: path.join(CONFIG.screenshotsDir, 'screenshot-1-hero.png'), name: 'Screenshot 1' }
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
  console.log('🎯 zkFlow.pro - Chrome Web Store Uploader (Existing Chrome)');
  console.log('========================================================\n');
  
  if (!checkRequiredFiles()) {
    console.log('❌ Some required files are missing. Please run the build process first.\n');
    process.exit(1);
  }
  
  await connectToExistingChrome();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { connectToExistingChrome };