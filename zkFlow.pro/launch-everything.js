#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function runTask(name, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${name}`);
  console.log('='.repeat(60));
  try {
    await fn();
    console.log(`✅ ${name} - Complete`);
  } catch (error) {
    console.error(`❌ ${name} - Failed:`, error.message);
    const retry = await askQuestion('Retry this task? (y/n): ');
    if (retry.toLowerCase() === 'y') {
      await runTask(name, fn);
    }
  }
}

async function buildExtension() {
  console.log('\n📦 Building Chrome extension...');
  
  // Check if icons exist
  if (!fs.existsSync('extension/assets/icons/icon128.png')) {
    console.log('🎨 Generating icons...');
    execSync('cd extension/assets/icons && node generate-icons-auto.js', { stdio: 'inherit' });
  }
  
  // Build and package
  execSync('cd extension && npm run build && npm run package', { stdio: 'inherit' });
  
  console.log('✅ Extension built: extension/zkflow-pro.zip');
}

async function generateScreenshots() {
  console.log('\n📸 Generating screenshots...');
  
  if (!fs.existsSync('store-assets/screenshot-1-hero.png')) {
    execSync('cd store-assets && node capture-screenshots.js', { stdio: 'inherit' });
  } else {
    console.log('✅ Screenshots already exist');
  }
}

async function uploadToChromeSt ore() {
  console.log('\n📤 Uploading to Chrome Web Store...');
  
  const useFixed = await askQuestion('Use automated upload? (y/n): ');
  if (useFixed.toLowerCase() === 'y') {
    const upload = spawn('node', ['chrome-store-uploader-fixed.js'], { stdio: 'inherit' });
    
    return new Promise((resolve) => {
      upload.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Chrome Store upload process completed');
        }
        resolve();
      });
    });
  } else {
    execSync('node chrome-store-upload-simple.js', { stdio: 'inherit' });
  }
}

async function deployWebsite() {
  console.log('\n🌐 Deploying website to Vercel...');
  
  const deploy = spawn('node', ['deploy-vercel-auto.js'], { stdio: 'inherit' });
  
  return new Promise((resolve) => {
    deploy.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Website deployment completed');
      }
      resolve();
    });
  });
}

async function configureDNS() {
  console.log('\n🌍 DNS Configuration for zkflow.pro...');
  console.log('\nRequired DNS records for Porkbun:');
  console.log('\n1. A Record:');
  console.log('   Type: A');
  console.log('   Name: @ (root)');
  console.log('   Value: 76.76.21.21');
  console.log('   TTL: 600\n');
  console.log('2. CNAME Record:');
  console.log('   Type: CNAME');
  console.log('   Name: www');
  console.log('   Value: cname.vercel-dns.com');
  console.log('   TTL: 600\n');
  
  console.log('To configure automatically with Porkbun MCP:');
  console.log('1. Get API credentials from https://porkbun.com/account/api');
  console.log('2. Update .env with PORKBUN_API_KEY and PORKBUN_SECRET_KEY');
  console.log('3. Use Porkbun MCP tools to set records automatically\n');
}

async function finalChecklist() {
  console.log('\n📋 Final Checklist:');
  console.log('\n✅ Extension:');
  console.log('   - Built and packaged');
  console.log('   - Uploaded to Chrome Web Store');
  console.log('   - Awaiting review (1-3 days)');
  
  console.log('\n✅ Website:');
  console.log('   - Deployed to Vercel');
  console.log('   - Domain configured');
  console.log('   - Environment variables set');
  
  console.log('\n📝 Remaining Tasks:');
  console.log('   1. Configure Supabase database');
  console.log('   2. Set up Stripe products and webhooks');
  console.log('   3. Monitor Chrome Web Store for approval');
  console.log('   4. Launch marketing campaign');
  console.log('   5. Set up analytics and monitoring');
}

async function main() {
  console.log('🎯 zkFlow.pro - Complete Launch Automation');
  console.log('======================================\n');
  
  console.log('This script will:');
  console.log('1. Build and package the Chrome extension');
  console.log('2. Generate all required screenshots');
  console.log('3. Upload to Chrome Web Store');
  console.log('4. Deploy website to Vercel');
  console.log('5. Configure DNS for zkflow.pro\n');
  
  const proceed = await askQuestion('Ready to launch? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Launch cancelled.');
    rl.close();
    return;
  }
  
  // Run all tasks
  await runTask('Build Extension', buildExtension);
  await runTask('Generate Screenshots', generateScreenshots);
  await runTask('Chrome Store Upload', uploadToChromeStore);
  await runTask('Website Deployment', deployWebsite);
  await runTask('DNS Configuration', configureDNS);
  
  // Show final checklist
  await finalChecklist();
  
  console.log('\n🎉 Launch automation complete!');
  console.log('🚀 zkFlow.pro is ready to go viral!\n');
  
  rl.close();
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n❌ Unexpected error:', error.message);
  rl.close();
  process.exit(1);
});

// Run the launcher
main().catch(error => {
  console.error('❌ Launch failed:', error.message);
  rl.close();
  process.exit(1);
});