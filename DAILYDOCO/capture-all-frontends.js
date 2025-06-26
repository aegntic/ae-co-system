const puppeteer = require('puppeteer');

async function captureAllFrontends() {
  const browser = await puppeteer.launch({ headless: 'new' });

  const versions = [
    { name: 'c1v1 Modern SaaS', url: 'http://localhost:5173', file: 'c1v1-live.png' },
    { name: 'c2v1 Enterprise Premium', url: 'http://localhost:5174', file: 'c2v1-live.png' },
    { name: 'c3v1 AI-First Futuristic', url: 'http://localhost:5175', file: 'c3v1-live.png' }
  ];

  for (const version of versions) {
    console.log(`Capturing ${version.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    try {
      await page.goto(version.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ path: version.file });
      console.log(`✅ ${version.name} captured`);
    } catch (error) {
      console.error(`❌ Error with ${version.name}:`, error.message);
    }
    
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured!');
}

captureAllFrontends().catch(console.error);