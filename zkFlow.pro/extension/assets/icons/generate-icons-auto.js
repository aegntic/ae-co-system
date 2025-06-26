const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  console.log('🎨 Generating zkFlow.pro extension icons...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the icon generator HTML
  const htmlPath = `file://${path.resolve(__dirname, 'icon-placeholder.html')}`;
  await page.goto(htmlPath);
  
  // Wait for icons to render
  await page.waitForSelector('canvas');
  
  // Generate each icon size
  const sizes = [16, 48, 128]; // Required sizes for Chrome extension
  
  for (const size of sizes) {
    const canvas = await page.$(`canvas[width="${size}"]`);
    if (canvas) {
      const screenshot = await canvas.screenshot({
        type: 'png',
        omitBackground: true
      });
      
      const filename = `icon${size}.png`;
      fs.writeFileSync(path.join(__dirname, filename), screenshot);
      console.log(`✅ Generated ${filename}`);
    }
  }
  
  // Also generate icon32 for good measure
  const canvas32 = await page.$('canvas[width="32"]');
  if (canvas32) {
    const screenshot = await canvas32.screenshot({
      type: 'png',
      omitBackground: true
    });
    fs.writeFileSync(path.join(__dirname, 'icon32.png'), screenshot);
    console.log('✅ Generated icon32.png');
  }
  
  await browser.close();
  console.log('🎉 All icons generated successfully!');
}

// Run the generator
generateIcons().catch(console.error);