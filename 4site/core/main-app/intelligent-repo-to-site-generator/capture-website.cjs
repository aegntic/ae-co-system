const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureUpdatedWebsite() {
    console.log('📸 Capturing updated 4site.pro website...\n');
    
    let browser;
    try {
        // Connect to browserless Chrome container
        browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:3000'
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('🌐 Loading updated website preview...');
        await page.goto('http://localhost:8088', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        // Wait for animations to complete
        await page.waitForTimeout(2000);
        
        console.log('📸 Taking full page screenshot...');
        await page.screenshot({ 
            path: 'updated-website-full.png',
            fullPage: true,
            quality: 95
        });
        
        console.log('📱 Taking viewport screenshot...');
        await page.screenshot({ 
            path: 'updated-website-viewport.png',
            fullPage: false,
            quality: 95
        });
        
        // Capture different sections
        console.log('🎯 Capturing hero section...');
        const heroSection = await page.$('.hero');
        if (heroSection) {
            await heroSection.screenshot({ path: 'updated-hero-section.png' });
        }
        
        console.log('💰 Capturing pricing section...');
        const pricingSection = await page.$('#pricing');
        if (pricingSection) {
            await pricingSection.screenshot({ path: 'updated-pricing-section.png' });
        }
        
        // Test mobile view
        console.log('📱 Capturing mobile view...');
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: 'updated-website-mobile.png',
            fullPage: true,
            quality: 95
        });
        
        console.log('\n✅ Screenshots captured successfully!');
        console.log('📁 Files created:');
        console.log('   🖼️  updated-website-full.png - Complete website');
        console.log('   📱 updated-website-viewport.png - Above-fold view');
        console.log('   🎯 updated-hero-section.png - Hero section');
        console.log('   💰 updated-pricing-section.png - Pricing tiers');
        console.log('   📱 updated-website-mobile.png - Mobile responsive view');
        
    } catch (error) {
        console.error('❌ Screenshot capture failed:', error.message);
        
        // Try alternative approach with file preview
        console.log('\n🔄 Trying alternative file preview...');
        try {
            const previewContent = fs.readFileSync('test-updated-preview.html', 'utf8');
            console.log('✅ Preview file exists and is readable');
            console.log('📄 Preview available at: http://localhost:8088');
        } catch (fileError) {
            console.error('❌ Preview file error:', fileError.message);
        }
        
    } finally {
        if (browser) {
            await browser.disconnect();
        }
    }
}

// Run capture
captureUpdatedWebsite().then(() => {
    console.log('\n🎉 Website capture complete!');
}).catch(error => {
    console.error('Fatal error:', error);
});