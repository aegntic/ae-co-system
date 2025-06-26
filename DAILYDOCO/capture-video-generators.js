const puppeteer = require('puppeteer');

async function captureVideoGenerators() {
  const browser = await puppeteer.launch({ headless: 'new' });

  const versions = [
    { name: 'c1v1 Modern SaaS', url: 'http://localhost:5173/video-generator', file: 'c1v1-video-generator.png' },
    { name: 'c2v1 Enterprise Premium', url: 'http://localhost:5174/video-generator', file: 'c2v1-video-generator.png' },
    { name: 'c3v1 AI-First Futuristic', url: 'http://localhost:5175/video-generator', file: 'c3v1-video-generator.png' }
  ];

  for (const version of versions) {
    console.log(`Capturing ${version.name} Video Generator...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    
    try {
      await page.goto(version.url, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for animations
      await page.screenshot({ path: version.file, fullPage: true });
      console.log(`✅ ${version.name} captured`);
    } catch (error) {
      console.error(`❌ Error with ${version.name}:`, error.message);
    }
    
    await page.close();
  }

  await browser.close();
  console.log('\nAll video generator screenshots captured!');
}

captureVideoGenerators().catch(console.error);