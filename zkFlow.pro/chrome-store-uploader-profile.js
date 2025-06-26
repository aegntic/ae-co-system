const puppeteer = require('puppeteer');
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

// Get Chrome profile path based on OS
function getChromeProfilePath() {
  const homeDir = os.homedir();
  
  switch (process.platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
    case 'win32': // Windows
      return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    case 'linux':
      return path.join(homeDir, '.config', 'google-chrome');
    default:
      throw new Error('Unsupported platform');
  }
}

// Get Chrome executable path
function getChromeExecutablePath() {
  switch (process.platform) {
    case 'darwin': // macOS
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'win32': // Windows
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    case 'linux':
      return '/usr/bin/google-chrome';
    default:
      return 'google-chrome'; // Fallback
  }
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

async function uploadWithProfile() {
  console.log('🚀 Starting Chrome Web Store upload with your Chrome profile...\n');
  
  try {
    const profilePath = getChromeProfilePath();
    const chromePath = getChromeExecutablePath();
    
    console.log('📁 Using Chrome profile from:', profilePath);
    console.log('🌐 Using Chrome executable:', chromePath);
    console.log('\n⚠️  IMPORTANT: Close all Chrome windows before continuing!');
    console.log('   This script needs exclusive access to your Chrome profile.\n');
    console.log('Press ENTER when all Chrome windows are closed...');
    
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: chromePath,
      userDataDir: profilePath,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=ChromeWhatsNewUI'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null
    });
    
    console.log('✅ Chrome launched with your profile!\n');
    
    const page = await browser.newPage();
    
    // Navigate to Chrome Web Store Developer Dashboard
    console.log('📍 Navigating to Chrome Web Store Developer Dashboard...');
    await page.goto(CONFIG.dashboardUrl, { 
      waitUntil: 'networkidle2',
      timeout: CONFIG.navigationTimeout 
    });
    
    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
      return !window.location.href.includes('accounts.google.com');
    });
    
    if (isLoggedIn) {
      console.log('✅ Already logged in with your profile!\n');
    } else {
      console.log('⚠️  You need to log in. Please complete the login in the browser.\n');
      await page.waitForFunction(
        () => window.location.href.includes('chrome.google.com/webstore/devconsole'),
        { timeout: 300000 }
      );
      console.log('✅ Login successful!\n');
    }
    
    // Continue with upload process
    await uploadExtension(page, browser);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('already running')) {
      console.log('\n💡 Make sure all Chrome windows are closed before running this script.');
    }
  }
}

async function uploadExtension(page, browser) {
  try {
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create new item
    console.log('📦 Looking for "New Item" button...');
    
    // Try to find and click new item button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const newItemBtn = buttons.find(btn => {
        const text = btn.textContent.toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        return text.includes('new item') || 
               text.includes('add new') || 
               text.includes('create') ||
               text.includes('new extension') ||
               ariaLabel.includes('new item') ||
               ariaLabel.includes('add');
      });
      if (newItemBtn) {
        newItemBtn.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      console.log('⚠️  Could not find "New Item" button automatically.');
      console.log('   Please click it manually in the browser.\n');
      console.log('Press ENTER after clicking "New Item"...');
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
    
    // Wait for form to appear
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Upload ZIP file
    console.log('📤 Uploading extension package...');
    const fileInputs = await page.$$('input[type="file"]');
    
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(CONFIG.extensionZip);
      console.log('   Waiting for upload to complete...');
      
      // Wait for upload
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log('✅ Extension package uploaded!\n');
    } else {
      console.log('⚠️  Could not find file upload input.');
      console.log('   Please upload the file manually: extension/zkflow-pro.zip\n');
      console.log('Press ENTER after uploading...');
      await new Promise(resolve => process.stdin.once('data', resolve));
    }
    
    // Get listing content
    const listing = getListingContent();
    
    // Fill form fields
    console.log('📝 Filling store listing information...');
    
    // Try to fill each field
    const fields = [
      { name: 'name', value: CONFIG.extensionName },
      { name: 'shortDescription', value: listing.shortDescription },
      { name: 'description', value: listing.detailedDescription }
    ];
    
    for (const field of fields) {
      const filled = await page.evaluate((fieldName, fieldValue) => {
        const inputs = document.querySelectorAll(`input[name="${fieldName}"], textarea[name="${fieldName}"], [placeholder*="${fieldName}"]`);
        if (inputs.length > 0) {
          inputs[0].value = fieldValue;
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, field.name, field.value);
      
      if (filled) {
        console.log(`  ✅ Filled ${field.name}`);
      } else {
        console.log(`  ⚠️  Could not auto-fill ${field.name} - please fill manually`);
      }
    }
    
    // Upload screenshots
    console.log('\n📸 Preparing to upload screenshots...');
    console.log('   Screenshots are located in: store-assets/');
    console.log('   Please upload them in this order:');
    console.log('   1. screenshot-1-hero.png');
    console.log('   2. screenshot-2-demo.png');
    console.log('   3. screenshot-3-stats.png');
    console.log('   4. screenshot-4-workflow.png');
    console.log('   5. screenshot-5-security.png');
    
    // Highlight submit button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      buttons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('submit') || text.includes('publish') || text.includes('save')) {
          btn.style.border = '3px solid red';
          btn.style.boxShadow = '0 0 20px red';
        }
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL STEPS - MANUAL COMPLETION REQUIRED');
    console.log('='.repeat(60));
    console.log('\n📋 Please complete these steps in the browser:');
    console.log('   1. Upload screenshots (see list above)');
    console.log('   2. Upload promotional images:');
    console.log('      - Small: promotional-tile-440x280.png');
    console.log('      - Large: featured-promotional-1400x560.png');
    console.log('   3. Select category: Productivity');
    console.log('   4. Set privacy: "Does not collect user data"');
    console.log('   5. Set pricing: $4.99/month for Pro tier');
    console.log('   6. Review everything');
    console.log('   7. Click the SUBMIT button (highlighted in red)\n');
    
    console.log('✅ The automated portion is complete.');
    console.log('   Complete the manual steps above to submit your extension.\n');
    console.log('ℹ️  You can close this terminal. The browser will stay open.\n');
    
  } catch (error) {
    console.error('\n❌ Error during upload:', error.message);
  }
}

// Check required files
function checkRequiredFiles() {
  console.log('🔍 Checking required files...\n');
  
  const requiredFiles = [
    { path: CONFIG.extensionZip, name: 'Extension package' },
    { path: CONFIG.listingFile, name: 'Store listing content' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`  ✅ ${file.name}: Found`);
    } else {
      console.log(`  ❌ ${file.name}: NOT FOUND`);
      allFilesExist = false;
    }
  });
  
  console.log('');
  return allFilesExist;
}

// Main execution
async function main() {
  console.log('🎯 zkFlow.pro - Chrome Web Store Uploader (Profile Version)');
  console.log('=======================================================\n');
  
  if (!checkRequiredFiles()) {
    console.log('❌ Some required files are missing.\n');
    process.exit(1);
  }
  
  console.log('✅ All required files found!\n');
  console.log('This version uses your existing Chrome profile,');
  console.log('so you\'ll already be logged in to your Google account.\n');
  
  await uploadWithProfile();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadWithProfile };