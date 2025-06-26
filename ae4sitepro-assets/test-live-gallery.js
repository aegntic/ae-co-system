#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testLiveGallery() {
    console.log('🧪 Testing live gallery at localhost:8001...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        console.log('🔍 Navigating to http://localhost:8001/gallery/');
        await page.goto('http://localhost:8001/gallery/', { 
            waitUntil: 'networkidle0',
            timeout: 10000 
        });
        
        console.log('✅ Page loaded');
        
        // Check if title is correct
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Wait for gallery grid to be visible
        await page.waitForSelector('#gallery-grid', { timeout: 5000 });
        console.log('✅ Gallery grid found');
        
        // Check if asset cards are loaded
        await page.waitForSelector('.thumbnail-card', { timeout: 5000 });
        const cardCount = await page.$$eval('.thumbnail-card', cards => cards.length);
        console.log(`📦 Found ${cardCount} asset cards`);
        
        if (cardCount === 0) {
            throw new Error('No asset cards found in gallery');
        }
        
        // Check if thumbnails are loading properly
        const thumbnailsLoaded = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('.thumbnail-card img'));
            return images.filter(img => img.complete && img.naturalWidth > 0).length;
        });
        
        console.log(`🖼️  ${thumbnailsLoaded}/${cardCount} thumbnails loaded successfully`);
        
        // Test search functionality
        console.log('🔍 Testing search functionality...');
        await page.type('#search', 'glassmorphism');
        await page.waitForTimeout(1000);
        
        const filteredCards = await page.$$eval('.thumbnail-card', cards => cards.length);
        console.log(`🎯 Search results: ${filteredCards} cards for "glassmorphism"`);
        
        // Clear search
        await page.evaluate(() => document.getElementById('search').value = '');
        await page.type('#search', ' ');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(500);
        
        // Test modal functionality
        console.log('🖱️  Testing modal functionality...');
        const modalButton = await page.$('.thumbnail-card button');
        if (modalButton) {
            await modalButton.click();
            await page.waitForSelector('#preview-modal', { visible: true, timeout: 3000 });
            console.log('✅ Modal opens correctly');
            
            // Check if modal image loads
            const modalImageSrc = await page.$eval('#modal-image', img => img.src);
            console.log(`🖼️  Modal image source: ${modalImageSrc}`);
            
            // Test modal close
            await page.click('#close-modal');
            await page.waitForSelector('#preview-modal', { hidden: true, timeout: 3000 });
            console.log('✅ Modal closes correctly');
        }
        
        // Test asset count display
        const assetCountText = await page.$eval('#asset-count', el => el.textContent);
        console.log(`📊 Asset count display: ${assetCountText}`);
        
        // Check for any console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // Wait a bit for any delayed errors
        await page.waitForTimeout(2000);
        
        if (consoleErrors.length > 0) {
            console.log('⚠️  Console errors found:');
            consoleErrors.forEach(error => console.log(`   ${error}`));
        } else {
            console.log('✅ No console errors detected');
        }
        
        // Take a final screenshot
        await page.screenshot({
            path: 'gallery-live-test.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved as gallery-live-test.png');
        
        // Final validation
        if (cardCount >= 60 && thumbnailsLoaded >= cardCount * 0.8) {
            console.log('🎉 Gallery test PASSED - Everything working correctly!');
            return true;
        } else {
            throw new Error(`Gallery test FAILED - Expected 60+ cards with 80%+ thumbnails loaded`);
        }
        
    } catch (error) {
        console.error('❌ Gallery test FAILED:', error.message);
        
        // Take error screenshot
        await page.screenshot({
            path: 'gallery-error-screenshot.png',
            fullPage: true
        });
        console.log('📸 Error screenshot saved as gallery-error-screenshot.png');
        
        return false;
    } finally {
        await browser.close();
    }
}

testLiveGallery().catch(console.error);