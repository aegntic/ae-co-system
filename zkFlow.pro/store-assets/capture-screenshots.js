const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshots() {
  console.log('📸 Capturing Chrome Web Store screenshots...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Load the screenshot generator HTML
  const htmlPath = `file://${path.resolve(__dirname, 'generate-screenshots.html')}`;
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  
  // Chrome Web Store requires 1280x800 screenshots
  await page.setViewport({ width: 1280, height: 800 });
  
  // Capture main screenshots
  const screenshots = [
    { id: 'screenshot1', name: 'screenshot-1-hero.png', description: 'Hero shot with main features' },
    { id: 'screenshot2', name: 'screenshot-2-demo.png', description: 'Live form filling demo' },
    { id: 'screenshot3', name: 'screenshot-3-stats.png', description: 'Productivity statistics' },
    { id: 'screenshot4', name: 'screenshot-4-workflow.png', description: 'Workflow builder' },
    { id: 'screenshot5', name: 'screenshot-5-security.png', description: 'Security features' }
  ];
  
  for (const screenshot of screenshots) {
    // Scroll to the screenshot
    await page.evaluate((id) => {
      document.getElementById(id).scrollIntoView();
    }, screenshot.id);
    
    // Wait a bit for animations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture the screenshot
    const element = await page.$(`#${screenshot.id}`);
    await element.screenshot({
      path: path.join(__dirname, screenshot.name),
      type: 'png'
    });
    
    console.log(`✅ Captured ${screenshot.name} - ${screenshot.description}`);
  }
  
  // Capture promotional tile (440x280)
  await page.setViewport({ width: 440, height: 280 });
  await page.evaluate(() => {
    document.querySelector('.promotional-tile').scrollIntoView();
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const promoTile = await page.$('.promotional-tile');
  await promoTile.screenshot({
    path: path.join(__dirname, 'promotional-tile-440x280.png'),
    type: 'png'
  });
  console.log('✅ Captured promotional-tile-440x280.png');
  
  // Also capture a small promotional tile (1400x560 for featured)
  await page.setViewport({ width: 1400, height: 560 });
  
  // Create a featured promotional image
  await page.evaluate(() => {
    const featured = document.createElement('div');
    featured.id = 'featured-promo';
    featured.style.width = '1400px';
    featured.style.height = '560px';
    featured.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    featured.style.display = 'flex';
    featured.style.alignItems = 'center';
    featured.style.justifyContent = 'center';
    featured.style.position = 'fixed';
    featured.style.top = '0';
    featured.style.left = '0';
    featured.style.zIndex = '9999';
    
    featured.innerHTML = `
      <div style="text-align: center; color: white;">
        <div style="font-size: 120px; margin-bottom: 20px;">⚡</div>
        <h1 style="font-size: 72px; font-weight: 800; margin-bottom: 20px;">zkFlow.pro</h1>
        <p style="font-size: 32px; opacity: 0.9;">Save 10+ Hours Per Week on Form Filling</p>
        <div style="margin-top: 40px; display: flex; gap: 40px; justify-content: center;">
          <div>
            <div style="font-size: 48px; font-weight: 800;">2.5K+</div>
            <div style="font-size: 18px; opacity: 0.8;">Active Users</div>
          </div>
          <div>
            <div style="font-size: 48px; font-weight: 800;">99.2%</div>
            <div style="font-size: 18px; opacity: 0.8;">Success Rate</div>
          </div>
          <div>
            <div style="font-size: 48px; font-weight: 800;">5.0⭐</div>
            <div style="font-size: 18px; opacity: 0.8;">Rating</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(featured);
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const featured = await page.$('#featured-promo');
  await featured.screenshot({
    path: path.join(__dirname, 'featured-promotional-1400x560.png'),
    type: 'png'
  });
  console.log('✅ Captured featured-promotional-1400x560.png');
  
  await browser.close();
  console.log('\n🎉 All screenshots captured successfully!');
  console.log('\n📋 Generated files:');
  console.log('- 5 main screenshots (1280x800)');
  console.log('- 1 promotional tile (440x280)');
  console.log('- 1 featured promotional image (1400x560)');
}

captureScreenshots().catch(console.error);