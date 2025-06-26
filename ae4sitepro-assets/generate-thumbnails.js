#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateThumbnails() {
    console.log('🚀 Starting thumbnail generation...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Get all HTML files in current directory
    const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));
    
    console.log(`📄 Found ${files.length} HTML files to process`);
    
    for (const file of files) {
        try {
            console.log(`📸 Processing: ${file}`);
            
            const filePath = path.join(__dirname, file);
            await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 10000 });
            
            // Wait a bit for animations to settle
            await page.waitForTimeout(2000);
            
            const thumbnailName = file.replace('.html', '.png');
            const thumbnailPath = path.join(__dirname, 'thumbnails', thumbnailName);
            
            await page.screenshot({
                path: thumbnailPath,
                fullPage: false,
                type: 'png',
                clip: {
                    x: 0,
                    y: 0,
                    width: 1920,
                    height: 1080
                }
            });
            
            console.log(`✅ Generated: ${thumbnailName}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }
    
    await browser.close();
    console.log('🎉 Thumbnail generation complete!');
}

generateThumbnails().catch(console.error);