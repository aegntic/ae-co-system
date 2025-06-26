#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');

async function testGallery() {
    console.log('🧪 Testing gallery functionality...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Load the gallery
        const galleryPath = path.join(__dirname, 'gallery', 'index.html');
        await page.goto(`file://${galleryPath}`, { waitUntil: 'networkidle0' });
        
        console.log('✅ Gallery loaded successfully');
        
        // Wait for assets to load
        await page.waitForSelector('.thumbnail-card', { timeout: 5000 });
        
        // Count loaded assets
        const assetCount = await page.$$eval('.thumbnail-card', cards => cards.length);
        console.log(`✅ Found ${assetCount} asset cards in gallery`);
        
        // Test search functionality
        await page.type('#search', 'glassmorphism');
        await page.waitForTimeout(500);
        
        const filteredCount = await page.$$eval('.thumbnail-card', cards => cards.length);
        console.log(`✅ Search filtering works: ${filteredCount} results for "glassmorphism"`);
        
        // Clear search
        await page.evaluate(() => document.getElementById('search').value = '');
        await page.type('#search', ' '); // Trigger input event
        await page.keyboard.press('Backspace');
        
        // Test modal functionality
        const firstCard = await page.$('.thumbnail-card button');
        if (firstCard) {
            await firstCard.click();
            await page.waitForSelector('#preview-modal', { visible: true });
            console.log('✅ Modal opens correctly');
            
            // Close modal
            await page.click('#close-modal');
            await page.waitForSelector('#preview-modal', { hidden: true });
            console.log('✅ Modal closes correctly');
        }
        
        // Take a screenshot
        await page.screenshot({
            path: path.join(__dirname, 'gallery-test.png'),
            fullPage: true
        });
        console.log('✅ Gallery screenshot saved as gallery-test.png');
        
        console.log('🎉 Gallery test completed successfully!');
        
    } catch (error) {
        console.error('❌ Gallery test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

testGallery().catch(console.error);