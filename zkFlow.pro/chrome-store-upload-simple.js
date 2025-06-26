#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 zkFlow.pro - Chrome Web Store Upload Helper\n');

// Check if files exist
const requiredFiles = {
  extension: path.join(__dirname, 'extension', 'zkflow-pro.zip'),
  listing: path.join(__dirname, 'CHROME_STORE_LISTING.md'),
  screenshots: path.join(__dirname, 'store-assets')
};

console.log('📋 Checking required files...');
let allGood = true;

for (const [name, filePath] of Object.entries(requiredFiles)) {
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${name}: Found`);
  } else {
    console.log(`  ❌ ${name}: Missing`);
    allGood = false;
  }
}

if (!allGood) {
  console.log('\n❌ Some files are missing. Build the extension first.');
  process.exit(1);
}

console.log('\n✅ All files ready!\n');

// Open Chrome Web Store Developer Dashboard
const dashboardUrl = 'https://chrome.google.com/webstore/devconsole';

console.log('📌 Opening Chrome Web Store Developer Dashboard...');
console.log('   URL:', dashboardUrl);

// Detect platform and open browser
let openCommand;
switch (process.platform) {
  case 'darwin':
    openCommand = `open "${dashboardUrl}"`;
    break;
  case 'win32':
    openCommand = `start "${dashboardUrl}"`;
    break;
  default:
    openCommand = `xdg-open "${dashboardUrl}"`;
}

exec(openCommand, (error) => {
  if (error) {
    console.log('\n⚠️  Could not open browser automatically.');
    console.log('   Please open this URL manually:', dashboardUrl);
  }
});

// Also open the local folders
console.log('\n📁 Opening local folders...');

const foldersToOpen = [
  path.join(__dirname, 'extension'),
  path.join(__dirname, 'store-assets')
];

foldersToOpen.forEach(folder => {
  let folderCommand;
  switch (process.platform) {
    case 'darwin':
      folderCommand = `open "${folder}"`;
      break;
    case 'win32':
      folderCommand = `explorer "${folder}"`;
      break;
    default:
      folderCommand = `xdg-open "${folder}"`;
  }
  
  exec(folderCommand);
});

// Read and display key information
const listingContent = fs.readFileSync(requiredFiles.listing, 'utf-8');
const shortDescMatch = listingContent.match(/## 📝 Short Description.*\n(.*)/);
const shortDesc = shortDescMatch ? shortDescMatch[1].trim() : '';

console.log('\n' + '='.repeat(60));
console.log('📋 MANUAL UPLOAD STEPS');
console.log('='.repeat(60));

console.log('\n1️⃣  Log in to Chrome Web Store Developer Dashboard');
console.log('   Email: aegntic@gmail.com\n');

console.log('2️⃣  Click "Add new item" or "New Item"\n');

console.log('3️⃣  Upload: extension/zkflow-pro.zip\n');

console.log('4️⃣  Fill in the listing information:');
console.log('   Name: zkFlow.pro - Smart Form Automation');
console.log('   Short Description:');
console.log(`   ${shortDesc}\n`);

console.log('5️⃣  Upload screenshots from store-assets/ in order:');
console.log('   • screenshot-1-hero.png');
console.log('   • screenshot-2-demo.png');
console.log('   • screenshot-3-stats.png');
console.log('   • screenshot-4-workflow.png');
console.log('   • screenshot-5-security.png\n');

console.log('6️⃣  Upload promotional images:');
console.log('   • Small tile: promotional-tile-440x280.png');
console.log('   • Large tile: featured-promotional-1400x560.png\n');

console.log('7️⃣  Settings:');
console.log('   • Category: Productivity');
console.log('   • Language: English');
console.log('   • Privacy: "No personal data collection"\n');

console.log('8️⃣  Pricing (optional):');
console.log('   • Type: Free with in-app purchases');
console.log('   • Pro tier: $4.99/month\n');

console.log('9️⃣  Review everything and click SUBMIT\n');

console.log('📄 Full listing content is in: CHROME_STORE_LISTING.md');
console.log('   Copy the detailed description from there.\n');

console.log('✅ All necessary files and folders are now open.');
console.log('   Complete the manual steps above to submit.\n');

console.log('🚀 Good luck with your launch!');

// Keep script running for a moment to ensure commands execute
setTimeout(() => {
  process.exit(0);
}, 2000);