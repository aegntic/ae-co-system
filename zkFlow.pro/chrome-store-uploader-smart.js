const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// Get Chrome executable path
function getChromeExecutablePath() {
  const possiblePaths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ]
  };

  const paths = possiblePaths[process.platform] || possiblePaths.linux;
  
  for (const chromePath of paths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  
  // Fallback
  return process.platform === 'win32' ? 'chrome.exe' : 'google-chrome';
}

// Read the listing content
function getListingContent() {
  const content = fs.readFileSync(CONFIG.listingFile, 'utf-8');
  
  const shortDescMatch = content.match(/## 📝 Short Description.*\n(.*)/);
  const detailedDescMatch = content.match(/## 📋 Detailed Description\n([\s\S]*?)## 🏷️/);
  
  return {
    shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
    detailedDescription: detailedDescMatch ? detailedDescMatch[1].trim() : '',
    category: 'Productivity',
    language: 'en'
  };
}

async function findOrStartDebugChrome() {
  // First, try to connect to existing Chrome with debugging
  try {
    console.log('🔍 Looking for Chrome with debugging enabled...');
    const browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    console.log('✅ Found existing Chrome with debugging enabled!\n');
    return { browser, isNewInstance: false };
  } catch (error) {
    console.log('📌 No debugging Chrome found. Starting new instance...\n');
  }
  
  // If not found, start Chrome with debugging
  const chromePath = getChromeExecutablePath();
  console.log('🚀 Starting Chrome with debugging enabled...');
  console.log('   Chrome path:', chromePath);
  
  try {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false,
      args: [
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null
    });
    
    console.log('✅ Chrome started successfully!\n');
    return { browser, isNewInstance: true };
  } catch (error) {
    throw new Error(`Failed to start Chrome: ${error.message}`);
  }
}

async function ensureLoggedIn(browser, isNewInstance) {
  // Get or create a page
  const pages = await browser.pages();
  let page = pages[0] || await browser.newPage();
  
  // Navigate to Chrome Web Store
  console.log('📍 Navigating to Chrome Web Store Developer Dashboard...');
  await page.goto(CONFIG.dashboardUrl, { 
    waitUntil: 'networkidle2',
    timeout: CONFIG.navigationTimeout 
  });
  
  // Check if we need to log in
  const needsLogin = await page.evaluate(() => {
    return window.location.href.includes('accounts.google.com');
  });
  
  if (needsLogin) {
    console.log('\n⚠️  You need to log in to your Google account.');
    console.log('   Please complete the login in the browser window.\n');
    console.log('   Email: aegntic@gmail.com');
    console.log('   After logging in, the script will continue automatically...\n');
    
    // Wait for successful login
    await page.waitForFunction(
      () => !window.location.href.includes('accounts.google.com'),
      { timeout: 600000 } // 10 minutes for login
    );
    
    // Wait for dashboard to load
    await page.waitForFunction(
      () => window.location.href.includes('chrome.google.com/webstore/devconsole'),
      { timeout: 60000 }
    );
    
    console.log('✅ Login successful!\n');
  } else {
    console.log('✅ Already logged in!\n');
  }
  
  return page;
}

async function uploadExtension(page) {
  try {
    // Wait for dashboard to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find and click "New Item" button
    console.log('📦 Creating new extension listing...');
    
    const clicked = await page.evaluate(() => {
      // Look for various possible selectors
      const selectors = [
        'button[aria-label*="Add new item"]',
        'button[aria-label*="New item"]',
        'a[href*="/create"]',
        'button:has-text("New item")',
        'button:has-text("Add new")',
        'button:has-text("Create")'
      ];
      
      // Also check by text content
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const newItemBtn = buttons.find(btn => {
        const text = (btn.textContent || '').toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        return text.includes('new item') || 
               text.includes('add new') || 
               text.includes('create') ||
               text.includes('new extension') ||
               ariaLabel.includes('new item') ||
               ariaLabel.includes('add new');
      });
      
      if (newItemBtn) {
        newItemBtn.click();
        return true;
      }
      
      // Try selectors
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
            return true;
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      return false;
    });
    
    if (!clicked) {
      console.log('\n⚠️  Could not find "New Item" button automatically.');
      console.log('   Please click the "New Item" or "Add new item" button in Chrome.\n');
      console.log('   Waiting for you to click it...');
      
      // Wait for navigation to create page
      await page.waitForFunction(
        () => window.location.href.includes('/create') || 
             document.querySelector('input[type="file"]'),
        { timeout: 300000 }
      );
    }
    
    // Wait for form to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Upload ZIP file
    console.log('\n📤 Uploading extension package...');
    await page.waitForSelector('input[type="file"]', { timeout: 30000 });
    
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(CONFIG.extensionZip);
      console.log('   Waiting for upload to complete...');
      
      // Wait for upload to process
      await page.waitForFunction(
        () => {
          // Check for progress indicators
          const progressElements = document.querySelectorAll('[role="progressbar"], .progress, [class*="progress"], [class*="upload"]');
          if (progressElements.length === 0) return true;
          
          // Check if all progress bars are complete
          return Array.from(progressElements).every(el => {
            const value = el.getAttribute('aria-valuenow');
            const width = el.style.width;
            return value === '100' || width === '100%' || el.classList.contains('complete');
          });
        },
        { timeout: CONFIG.uploadTimeout }
      );
      
      console.log('✅ Extension package uploaded successfully!\n');
    }
    
    // Get listing content
    const listing = getListingContent();
    
    // Fill in the form
    console.log('📝 Filling store listing information...\n');
    
    // Fill basic fields
    await fillFormFields(page, listing);
    
    // Upload screenshots
    await uploadScreenshots(page);
    
    // Upload promotional images  
    await uploadPromotionalImages(page);
    
    // Set privacy settings
    await setPrivacySettings(page);
    
    // Highlight submit button
    await highlightSubmitButton(page);
    
    // Final instructions
    showFinalInstructions();
    
  } catch (error) {
    console.error('\n❌ Error during upload:', error.message);
    console.log('\n💡 You can continue manually in the browser window.');
  }
}

async function fillFormFields(page, listing) {
  // Wait a moment for form to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Extension name
  const nameFilled = await tryFillField(page, 
    ['input[name="name"]', 'input[placeholder*="name"]', 'input[aria-label*="name"]'],
    CONFIG.extensionName
  );
  console.log(nameFilled ? '  ✅ Extension name filled' : '  ⚠️  Please fill extension name manually');
  
  // Short description
  const shortDescFilled = await tryFillField(page,
    ['textarea[name="shortDescription"]', 'textarea[placeholder*="short"]', 'textarea[aria-label*="short"]'],
    listing.shortDescription
  );
  console.log(shortDescFilled ? '  ✅ Short description filled' : '  ⚠️  Please fill short description manually');
  
  // Detailed description
  const detailDescFilled = await tryFillField(page,
    ['textarea[name="description"]', 'textarea[placeholder*="detailed"]', 'textarea[placeholder*="description"]:not([placeholder*="short"])'],
    listing.detailedDescription
  );
  console.log(detailDescFilled ? '  ✅ Detailed description filled' : '  ⚠️  Please fill detailed description manually');
  
  // Category
  const categorySet = await trySelectOption(page, 'Productivity');
  console.log(categorySet ? '  ✅ Category set to Productivity' : '  ⚠️  Please select Productivity category manually');
  
  console.log('');
}

async function tryFillField(page, selectors, value) {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click({ clickCount: 3 }); // Select all
        await element.type(value);
        return true;
      }
    } catch (e) {
      // Continue trying
    }
  }
  return false;
}

async function trySelectOption(page, optionText) {
  return await page.evaluate((text) => {
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const option = Array.from(select.options).find(opt => 
        opt.text.toLowerCase().includes(text.toLowerCase())
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, optionText);
}

async function uploadScreenshots(page) {
  console.log('📸 Uploading screenshots...\n');
  
  const screenshots = [
    'screenshot-1-hero.png',
    'screenshot-2-demo.png', 
    'screenshot-3-stats.png',
    'screenshot-4-workflow.png',
    'screenshot-5-security.png'
  ];
  
  // Find screenshot upload inputs (excluding promotional image inputs)
  const screenshotInputs = await page.$$('input[type="file"][accept*="image"]:not([name*="promotional"]):not([name*="tile"]):not([placeholder*="440"]):not([placeholder*="1400"])');
  
  let uploadedCount = 0;
  for (let i = 0; i < Math.min(screenshots.length, screenshotInputs.length); i++) {
    const screenshotPath = path.join(CONFIG.screenshotsDir, screenshots[i]);
    if (fs.existsSync(screenshotPath)) {
      try {
        await screenshotInputs[i].uploadFile(screenshotPath);
        console.log(`  ✅ Uploaded ${screenshots[i]}`);
        uploadedCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log(`  ⚠️  Failed to upload ${screenshots[i]}`);
      }
    }
  }
  
  if (uploadedCount < screenshots.length) {
    console.log(`\n  ⚠️  Only ${uploadedCount} of ${screenshots.length} screenshots uploaded.`);
    console.log('      Please upload the remaining screenshots manually from store-assets/\n');
  } else {
    console.log('\n  ✅ All screenshots uploaded!\n');
  }
}

async function uploadPromotionalImages(page) {
  console.log('🎨 Uploading promotional images...\n');
  
  // Small tile (440x280)
  const smallTilePath = path.join(CONFIG.screenshotsDir, 'promotional-tile-440x280.png');
  const smallTileUploaded = await tryUploadToFileInput(page, 
    ['input[type="file"][name*="small"]', 'input[type="file"][placeholder*="440"]'],
    smallTilePath
  );
  console.log(smallTileUploaded ? '  ✅ Small promotional tile uploaded' : '  ⚠️  Please upload small tile (440x280) manually');
  
  // Large tile (1400x560)
  const largeTilePath = path.join(CONFIG.screenshotsDir, 'featured-promotional-1400x560.png');
  const largeTileUploaded = await tryUploadToFileInput(page,
    ['input[type="file"][name*="large"]', 'input[type="file"][placeholder*="1400"]'],
    largeTilePath
  );
  console.log(largeTileUploaded ? '  ✅ Large promotional tile uploaded' : '  ⚠️  Please upload large tile (1400x560) manually');
  
  console.log('');
}

async function tryUploadToFileInput(page, selectors, filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        await elements[0].uploadFile(filePath);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }
    } catch (e) {
      // Continue trying
    }
  }
  return false;
}

async function setPrivacySettings(page) {
  console.log('🔒 Setting privacy practices...\n');
  
  const privacySet = await page.evaluate(() => {
    let found = false;
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      const label = checkbox.closest('label');
      const text = (label ? label.textContent : checkbox.parentElement.textContent).toLowerCase();
      
      if (text.includes('no personal data') ||
          text.includes('not collect') ||
          text.includes('does not collect') ||
          (text.includes('privacy') && text.includes('no'))) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        found = true;
      }
    });
    
    return found;
  });
  
  console.log(privacySet ? '  ✅ Privacy settings configured' : '  ⚠️  Please set privacy settings manually');
  console.log('');
}

async function highlightSubmitButton(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
    const submitBtn = buttons.find(btn => {
      const text = (btn.textContent || btn.value || '').toLowerCase();
      return text.includes('submit') ||
             text.includes('publish') ||
             text.includes('save') ||
             text.includes('review') ||
             text.includes('continue');
    });
    
    if (submitBtn) {
      submitBtn.style.border = '3px solid red';
      submitBtn.style.boxShadow = '0 0 20px red';
      submitBtn.style.animation = 'pulse 2s infinite';
      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add pulse animation
      if (!document.getElementById('pulse-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% { box-shadow: 0 0 20px red; }
            50% { box-shadow: 0 0 40px red, 0 0 60px red; }
            100% { box-shadow: 0 0 20px red; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  });
}

function showFinalInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ALMOST DONE! FINAL STEPS REQUIRED');
  console.log('='.repeat(60));
  
  console.log('\n📋 Please complete these final steps in Chrome:\n');
  
  console.log('   1️⃣  Review all auto-filled information');
  console.log('   2️⃣  Complete any missing fields marked with ⚠️');
  console.log('   3️⃣  Set pricing:');
  console.log('       • Free with in-app purchases');
  console.log('       • Pro tier: $4.99/month');
  console.log('   4️⃣  Accept terms and conditions');
  console.log('   5️⃣  Click the SUBMIT button (highlighted in red)\n');
  
  console.log('✅ The automated upload is complete!');
  console.log('   Chrome will remain open for you to finish.\n');
  
  console.log('📊 After submission:');
  console.log('   • Review takes 1-3 business days');
  console.log('   • You\'ll receive email confirmation');
  console.log('   • Monitor dashboard for updates\n');
  
  console.log('🚀 Good luck with your launch! 🎉\n');
}

// Check required files
function checkRequiredFiles() {
  console.log('🔍 Checking required files...\n');
  
  const requiredFiles = [
    { path: CONFIG.extensionZip, name: 'Extension package' },
    { path: CONFIG.listingFile, name: 'Store listing content' },
    { path: path.join(CONFIG.screenshotsDir, 'screenshot-1-hero.png'), name: 'Main screenshot' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`  ✅ ${file.name}`);
    } else {
      console.log(`  ❌ ${file.name} - NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  return allFilesExist;
}

// Main execution
async function main() {
  console.log('🎯 zkFlow.pro - Smart Chrome Web Store Uploader');
  console.log('===========================================\n');
  
  if (!checkRequiredFiles()) {
    console.log('❌ Some required files are missing.\n');
    console.log('💡 Run these commands first:');
    console.log('   cd extension && npm run build && npm run package');
    console.log('   cd store-assets && node capture-screenshots.js\n');
    process.exit(1);
  }
  
  console.log('✅ All required files found!\n');
  
  try {
    // Find or start Chrome with debugging
    const { browser, isNewInstance } = await findOrStartDebugChrome();
    
    // Ensure user is logged in
    const page = await ensureLoggedIn(browser, isNewInstance);
    
    // Upload the extension
    await uploadExtension(page);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   • Make sure Chrome is installed');
    console.log('   • Try running with sudo/admin if permission errors');
    console.log('   • Check that port 9222 is not in use by another app\n');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };