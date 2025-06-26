#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateRemainingThumbnails() {
    console.log('🚀 Generating remaining thumbnails...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Get all HTML files
    const htmlFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.html'));
    
    // Get existing thumbnails
    const existingThumbnails = fs.readdirSync(path.join(__dirname, 'thumbnails'))
        .map(file => file.replace('.png', '.html'));
    
    // Find missing thumbnails
    const missingFiles = htmlFiles.filter(file => !existingThumbnails.includes(file));
    
    console.log(`📄 Found ${missingFiles.length} files still need thumbnails`);
    
    for (const file of missingFiles) {
        try {
            console.log(`📸 Processing: ${file}`);
            
            const filePath = path.join(__dirname, file);
            
            // Set shorter timeout for problematic files
            await page.goto(`file://${filePath}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 5000 
            });
            
            // Wait briefly for basic rendering
            await page.waitForTimeout(1000);
            
            const thumbnailName = file.replace('.html', '.png');
            const thumbnailPath = path.join(__dirname, 'thumbnails', thumbnailName);
            
            await page.screenshot({
                path: thumbnailPath,
                fullPage: false,
                type: 'png'
            });
            
            console.log(`✅ Generated: ${thumbnailName}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            
            // Create a placeholder thumbnail for failed files
            try {
                const placeholderPath = path.join(__dirname, 'thumbnails', file.replace('.html', '.png'));
                await page.goto('data:text/html,<html><body style="background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: Arial;"><div style="text-align: center; color: white;"><h1>UI Asset</h1><p>' + file.replace('.html', '') + '</p></div></body></html>');
                await page.screenshot({ path: placeholderPath, type: 'png' });
                console.log(`📝 Created placeholder for: ${file}`);
            } catch (placeholderError) {
                console.error(`❌ Failed to create placeholder for ${file}`);
            }
        }
    }
    
    await browser.close();
    console.log('🎉 Remaining thumbnails complete!');
}

generateRemainingThumbnails().catch(console.error);