const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateThumbnail() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const htmlFile = 'Masonry Image Gallery Layout.html';
    const filePath = path.join(__dirname, htmlFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${htmlFile}`);
      return;
    }
    
    console.log(`📸 Processing: ${htmlFile}`);
    
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 15000 });
    
    const thumbnailsDir = path.join(__dirname, 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }
    
    const thumbnailName = htmlFile.replace('.html', '.png');
    const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
    
    await page.screenshot({
      path: thumbnailPath,
      fullPage: false,
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    console.log(`✅ Generated: ${thumbnailName}`);
    
  } catch (error) {
    console.log(`❌ Error processing Masonry Image Gallery Layout.html: ${error.message}`);
  } finally {
    await browser.close();
  }
}

generateThumbnail();