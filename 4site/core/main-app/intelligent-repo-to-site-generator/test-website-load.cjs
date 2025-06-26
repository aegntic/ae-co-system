const puppeteer = require('puppeteer');
const http = require('http');

async function testWebsiteLoad() {
    console.log('🚀 Testing updated 4site.pro website load...\n');
    
    // First check if server is responding
    console.log('🌐 Checking server status...');
    try {
        await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8091/test-updated-preview.html', (res) => {
                console.log(`✅ Server responding with status: ${res.statusCode}`);
                resolve();
            });
            req.on('error', reject);
            req.setTimeout(5000, () => reject(new Error('Server timeout')));
        });
    } catch (error) {
        console.log('❌ Server not responding, starting Python server...');
        // Server not responding, let's start it
        const { spawn } = require('child_process');
        const server = spawn('python3', ['-m', 'http.server', '8091'], {
            cwd: process.cwd(),
            detached: true,
            stdio: 'ignore'
        });
        server.unref();
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Server started');
    }
    
    let browser;
    try {
        // Connect to browserless Chrome
        console.log('🔌 Connecting to Chrome...');
        browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:3000'
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📄 Loading website...');
        await page.goto('http://localhost:8091/test-updated-preview.html', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for any animations
        await page.waitForTimeout(2000);
        
        // Check if key elements loaded
        console.log('🔍 Checking key elements...');
        
        const heroTitle = await page.$eval('h1', el => el.textContent.trim());
        console.log(`   Hero Title: "${heroTitle}"`);
        
        const pricingCards = await page.$$('.pricing-card');
        console.log(`   Pricing Cards: ${pricingCards.length} found`);
        
        const glassCards = await page.$$('.glass-card');
        console.log(`   Glass Cards: ${glassCards.length} found`);
        
        const polarSection = await page.$('section:has-text("Polar.sh")') || await page.$eval('*', el => {
            return [...el.querySelectorAll('*')].find(e => e.textContent.includes('Polar.sh')) ? true : false;
        });
        console.log(`   Polar.sh Section: ${polarSection ? 'Found' : 'Not found'}`);
        
        // Take screenshots
        console.log('📸 Taking screenshots...');
        
        await page.screenshot({ 
            path: 'website-full-screenshot.png',
            fullPage: true,
            quality: 90
        });
        console.log('   ✅ Full page screenshot saved');
        
        await page.screenshot({ 
            path: 'website-viewport-screenshot.png',
            fullPage: false,
            quality: 90
        });
        console.log('   ✅ Viewport screenshot saved');
        
        // Test mobile view
        console.log('📱 Testing mobile view...');
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
            path: 'website-mobile-screenshot.png',
            fullPage: true,
            quality: 90
        });
        console.log('   ✅ Mobile screenshot saved');
        
        // Validate content
        console.log('\n✅ Website Load Validation:');
        console.log(`   📝 Hero messaging: ${heroTitle.includes('Living Websites') ? 'CORRECT' : 'NEEDS FIX'}`);
        console.log(`   💰 Pricing tiers: ${pricingCards.length === 4 ? 'ALL 4 PRESENT' : 'MISSING TIERS'}`);
        console.log(`   🎨 Glass design: ${glassCards.length > 0 ? 'ACTIVE' : 'NOT LOADED'}`);
        console.log(`   🤝 Polar.sh integration: ${polarSection ? 'PRESENT' : 'MISSING'}`);
        
        console.log('\n🎉 Website loaded successfully!');
        console.log('📁 Screenshots saved:');
        console.log('   🖼️  website-full-screenshot.png');
        console.log('   📱 website-viewport-screenshot.png');
        console.log('   📱 website-mobile-screenshot.png');
        console.log('\n🌐 Website URL: http://localhost:8091/test-updated-preview.html');
        
    } catch (error) {
        console.error('❌ Website load test failed:', error.message);
        
        // Try to get page content for debugging
        if (browser) {
            try {
                const pages = await browser.pages();
                if (pages.length > 0) {
                    const content = await pages[0].content();
                    console.log('📄 Page content length:', content.length, 'characters');
                    
                    if (content.includes('4site.pro')) {
                        console.log('✅ 4site.pro content detected in page');
                    }
                }
            } catch (debugError) {
                console.log('Debug error:', debugError.message);
            }
        }
        
    } finally {
        if (browser) {
            await browser.disconnect();
        }
    }
}

// Run test
testWebsiteLoad().then(() => {
    console.log('\n✨ Test complete!');
}).catch(error => {
    console.error('Fatal error:', error);
});