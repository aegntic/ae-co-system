#!/usr/bin/env node

/**
 * Generate template preview images using puppeteer
 * These will be used as placeholders for the GitHub README
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePreviews() {
  console.log('🎨 Generating template preview images...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675 });
  
  // Load the HTML file
  const htmlPath = path.join(__dirname, 'create-template-previews.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  // Wait for animations to start
  await page.waitForTimeout(2000);
  
  // Template IDs and their output filenames
  const templates = [
    { id: 'liquid-metal-preview', name: 'liquid-metal-preview.png' },
    { id: 'motion-system-preview', name: 'motion-system-preview.png' },
    { id: 'quantum-interface-preview', name: 'quantum-interface-preview.png' },
    { id: 'dimensional-preview', name: 'dimensional-preview.png' }
  ];
  
  // Ensure templates directory exists
  const templatesDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Capture each template
  for (const template of templates) {
    console.log(`📸 Capturing ${template.name}...`);
    
    const element = await page.$(`#${template.id}`);
    if (element) {
      await element.screenshot({
        path: path.join(templatesDir, template.name),
        type: 'png'
      });
      console.log(`✅ Saved ${template.name}`);
    } else {
      console.error(`❌ Could not find element with ID: ${template.id}`);
    }
  }
  
  await browser.close();
  console.log('🎉 All template previews generated!');
}

// Also create simple placeholder images if puppeteer fails
async function createPlaceholders() {
  const Canvas = require('canvas');
  const templatesDir = path.join(__dirname, 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  const templates = [
    { 
      name: 'liquid-metal-preview.png',
      gradient: ['#1a1a2e', '#0f3460'],
      title: 'LIQUID METAL',
      subtitle: 'E-COMMERCE'
    },
    { 
      name: 'motion-system-preview.png',
      gradient: ['#667eea', '#764ba2'],
      title: 'MOTION SYSTEM',
      subtitle: '200+ ANIMATIONS'
    },
    { 
      name: 'quantum-interface-preview.png',
      gradient: ['#000000', '#00ffff'],
      title: 'QUANTUM',
      subtitle: 'INTERFACE PRO'
    },
    { 
      name: 'dimensional-preview.png',
      gradient: ['#0f0f1e', '#3a86ff'],
      title: 'DIMENSIONAL',
      subtitle: '4D VISUALIZATION'
    }
  ];
  
  for (const template of templates) {
    const canvas = Canvas.createCanvas(1200, 675);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 675);
    gradient.addColorStop(0, template.gradient[0]);
    gradient.addColorStop(1, template.gradient[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 675);
    
    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(template.title, 600, 300);
    
    // Add subtitle
    ctx.font = '36px Arial';
    ctx.fillText(template.subtitle, 600, 380);
    
    // Add aeLTD branding
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('aeLTD Premium Collection', 600, 600);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(templatesDir, template.name), buffer);
    console.log(`✅ Created placeholder: ${template.name}`);
  }
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  generatePreviews().catch(err => {
    console.error('Puppeteer failed, creating placeholders:', err);
    createPlaceholders();
  });
} catch (e) {
  console.log('Puppeteer not found, creating placeholder images...');
  createPlaceholders();
}