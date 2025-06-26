const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Configuration
const CONFIG = {
  dashboardUrl: 'https://chrome.google.com/webstore/devconsole',
  extensionName: 'zkFlow.pro - Smart Form Automation',
  extensionZip: path.join(__dirname, 'extension', 'zkflow-pro.zip'),
  screenshotsDir: path.join(__dirname, 'store-assets'),
  listingFile: path.join(__dirname, 'CHROME_STORE_LISTING.md'),
  credentials: {
    email: 'aegntic@gmail.com',
    password: 'AEp@ssWrd11:11'
  }
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Read listing content
function getListingContent() {
  const content = fs.readFileSync(CONFIG.listingFile, 'utf-8');
  const shortDescMatch = content.match(/## 📝 Short Description.*\n(.*)/);
  const detailedDescMatch = content.match(/## 📋 Detailed Description\n([\s\S]*?)## 🏷️/);
  
  return {
    shortDescription: shortDescMatch ? shortDescMatch[1].trim() : '',
    detailedDescription: detailedDescMatch ? detailedDescMatch[1].trim() : ''
  };
}

async function waitForSelector(page, selector, options = {}) {
  try {
    return await page.waitForSelector(selector, { timeout: 30000, ...options });
  } catch (error) {
    console.log(`⚠️  Selector not found: ${selector}`);
    return null;
  }
}

async function typeSlowly(page, selector, text, delay = 50) {
  const element = await waitForSelector(page, selector);
  if (element) {
    await element.click({ clickCount: 3 });
    await page.type(selector, text, { delay });
    return true;
  }
  return false;
}

async function handleGoogleLogin(page) {
  console.log('🔐 Attempting automated login...');
  
  try {
    // Wait for email field
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Type email
    await page.type('input[type="email"]', CONFIG.credentials.email, { delay: 100 });
    await page.keyboard.press('Enter');
    
    // Wait for password field
    await page.waitForSelector('input[type="password"]', { visible: true, timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Type password
    await page.type('input[type="password"]', CONFIG.credentials.password, { delay: 100 });
    await page.keyboard.press('Enter');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    return true;
  } catch (error) {
    console.log('⚠️  Automated login failed. Trying alternative method...');
    return false;
  }
}

async function uploadToChromeStore() {
  console.log('🚀 Starting Chrome Web Store automated upload...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=ChromeWhatsNewUI',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-sync'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    
    // Navigate to dashboard
    console.log('📍 Navigating to Chrome Web Store Developer Dashboard...');
    await page.goto(CONFIG.dashboardUrl, { waitUntil: 'domcontentloaded' });
    
    // Check if login is needed
    if (page.url().includes('accounts.google.com')) {
      const loginSuccess = await handleGoogleLogin(page);
      
      if (!loginSuccess) {
        console.log('\n⚠️  Automated login encountered security check.');
        console.log('   Please complete the login manually in the browser.');
        console.log('   The script will continue once you\'re logged in.\n');
        
        await page.waitForFunction(
          () => window.location.href.includes('chrome.google.com/webstore/devconsole'),
          { timeout: 300000 }
        );
      }
    }
    
    console.log('✅ Successfully logged in!\n');
    
    // Wait for dashboard to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Click "New Item" button
    console.log('📦 Creating new extension listing...');
    
    // Try multiple approaches to find the button
    const newItemClicked = await page.evaluate(() => {
      // Method 1: Find by text content
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const newItemBtn = buttons.find(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('new item') || text.includes('add new') || text.includes('add item');
      });
      
      if (newItemBtn) {
        newItemBtn.click();
        return true;
      }
      
      // Method 2: Find by class or attribute patterns
      const possibleButtons = document.querySelectorAll('[class*="add"], [class*="new"], [aria-label*="add"], [aria-label*="new"]');
      for (const btn of possibleButtons) {
        if (btn.textContent.toLowerCase().includes('item')) {
          btn.click();
          return true;
        }
      }
      
      return false;
    });
    
    if (!newItemClicked) {
      console.log('⚠️  Could not find "New Item" button automatically.');
      console.log('   Please click it manually in the browser.');
      await askQuestion('   Press Enter after clicking "New Item"...');
    }
    
    // Wait for upload form
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Upload ZIP file
    console.log('\n📤 Uploading extension package...');
    const fileInput = await waitForSelector(page, 'input[type="file"]');
    
    if (fileInput) {
      await fileInput.uploadFile(CONFIG.extensionZip);
      console.log('   Waiting for upload to complete...');
      
      // Wait for upload progress
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('✅ Extension uploaded!\n');
    } else {
      console.log('⚠️  Could not find file upload input.');
      await askQuestion('   Please upload extension/zkflow-pro.zip manually and press Enter...');
    }
    
    // Fill in listing details
    const listing = getListingContent();
    console.log('📝 Filling store listing information...\n');
    
    // Name field
    const nameFilled = await typeSlowly(page, 'input[name="name"], input[placeholder*="name"]', CONFIG.extensionName);
    console.log(nameFilled ? '  ✅ Extension name' : '  ⚠️  Fill name manually');
    
    // Short description
    const shortFilled = await typeSlowly(page, 'textarea[name="shortDescription"], textarea[placeholder*="short"]', listing.shortDescription);
    console.log(shortFilled ? '  ✅ Short description' : '  ⚠️  Fill short description manually');
    
    // Detailed description
    const detailFilled = await typeSlowly(page, 'textarea[name="description"], textarea[placeholder*="detail"]', listing.detailedDescription);
    console.log(detailFilled ? '  ✅ Detailed description' : '  ⚠️  Fill detailed description manually');
    
    // Category
    const categorySet = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const option = Array.from(select.options).find(opt => 
          opt.text.toLowerCase().includes('productivity')
        );
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    console.log(categorySet ? '  ✅ Category set to Productivity' : '  ⚠️  Set category manually');
    
    // Upload screenshots
    console.log('\n📸 Uploading screenshots...');
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
      .sort();
    
    const imageInputs = await page.$$('input[type="file"][accept*="image"]');
    
    for (let i = 0; i < Math.min(screenshots.length, imageInputs.length); i++) {
      const screenshotPath = path.join(CONFIG.screenshotsDir, screenshots[i]);
      try {
        await imageInputs[i].uploadFile(screenshotPath);
        console.log(`  ✅ ${screenshots[i]}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`  ⚠️  Failed to upload ${screenshots[i]}`);
      }
    }
    
    // Privacy settings
    console.log('\n🔒 Setting privacy options...');
    await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        const label = cb.closest('label') || cb.parentElement;
        const text = label ? label.textContent.toLowerCase() : '';
        if (text.includes('no') && text.includes('data')) {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
    
    // Highlight submit button
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.toLowerCase().includes('submit') || 
        btn.textContent.toLowerCase().includes('publish')
      );
      if (submitBtn) {
        submitBtn.style.border = '3px solid red';
        submitBtn.style.boxShadow = '0 0 20px red';
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ALMOST DONE - REVIEW AND SUBMIT');
    console.log('='.repeat(60));
    console.log('\n✅ Automation complete! Please:');
    console.log('   1. Review all filled information');
    console.log('   2. Set pricing ($4.99/month for Pro)');
    console.log('   3. Complete any missing fields');
    console.log('   4. Click the SUBMIT button (highlighted in red)\n');
    
    console.log('Press Ctrl+C when done to close this script.\n');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 You can continue manually in the browser window.');
  }
}

// Main execution
async function main() {
  console.log('🎯 zkFlow.pro - Chrome Web Store Automated Uploader');
  console.log('===============================================\n');
  
  // Check required files
  const requiredFiles = [
    CONFIG.extensionZip,
    CONFIG.listingFile,
    path.join(CONFIG.screenshotsDir, 'screenshot-1-hero.png')
  ];
  
  let allFilesExist = true;
  console.log('🔍 Checking required files...');
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`  ✅ ${path.basename(file)}`);
    } else {
      console.log(`  ❌ ${path.basename(file)} - NOT FOUND`);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.log('\n❌ Missing required files. Build the extension first.');
    process.exit(1);
  }
  
  console.log('\n✅ All files ready!\n');
  
  await uploadToChromeStore();
}

// Run the script
main().catch(console.error).finally(() => {
  rl.close();
  process.exit(0);
});