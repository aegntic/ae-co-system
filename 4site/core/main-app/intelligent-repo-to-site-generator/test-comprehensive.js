const puppeteer = require('puppeteer');
const fs = require('fs');

async function comprehensiveTest() {
    console.log('🚀 Starting comprehensive 4site.pro testing...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        
        // Test 1: Initial Load Performance
        console.log('📊 Test 1: Initial Load Performance');
        const startTime = Date.now();
        const response = await page.goto('http://localhost:5173/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        const loadTime = Date.now() - startTime;
        console.log(`✅ Page loaded in ${loadTime}ms (Target: <3000ms)`);
        console.log(`✅ Status: ${response.status()}`);
        
        // Test 2: Page Content Analysis
        console.log('\n🔍 Test 2: Page Content Analysis');
        const title = await page.title();
        console.log(`✅ Page title: "${title}"`);
        
        const mainHeading = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
        console.log(`✅ Main heading: "${mainHeading}"`);
        
        // Test 3: UI Components Check
        console.log('\n🎨 Test 3: UI Components Check');
        const urlInput = await page.$('input[type="url"], input[placeholder*="github"], input[placeholder*="GitHub"]');
        console.log(`✅ URL input field: ${urlInput ? 'Found' : 'Not found'}`);
        
        const generateButton = await page.$('button');
        console.log(`✅ Generate button: ${generateButton ? 'Found' : 'Not found'}`);
        
        // Test 4: Demo Mode Test
        console.log('\n🎭 Test 4: Demo Mode Test');
        const demoButtons = await page.$$('button');
        let demoButtonFound = false;
        
        for (let button of demoButtons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.toLowerCase().includes('demo') || text.toLowerCase().includes('try')) {
                demoButtonFound = true;
                console.log(`✅ Demo button found: "${text}"`);
                break;
            }
        }
        
        if (!demoButtonFound) {
            console.log('⚠️  Demo button not clearly identified');
        }
        
        // Test 5: GitHub Repository Generation
        console.log('\n🔧 Test 5: GitHub Repository Generation Test');
        
        if (urlInput) {
            // Clear any existing value and type the React repo URL
            await urlInput.click({ clickCount: 3 });
            await urlInput.type('https://github.com/facebook/react');
            console.log('✅ Entered React repository URL');
            
            // Find and click generate button
            const buttons = await page.$$('button');
            let generateClicked = false;
            
            for (let button of buttons) {
                const text = await button.evaluate(el => el.textContent);
                if (text.toLowerCase().includes('generate') || text.toLowerCase().includes('create') || text.toLowerCase().includes('build')) {
                    await button.click();
                    generateClicked = true;
                    console.log(`✅ Clicked button: "${text}"`);
                    break;
                }
            }
            
            if (generateClicked) {
                console.log('⏳ Waiting for site generation...');
                
                // Wait for loading indicator or result
                try {
                    await page.waitForSelector('[data-testid="loading"], .loading, [class*="loading"]', { timeout: 5000 });
                    console.log('✅ Loading indicator appeared');
                } catch (e) {
                    console.log('⚠️  Loading indicator not detected');
                }
                
                // Wait for generation to complete (up to 45 seconds)
                try {
                    await page.waitForFunction(() => {
                        const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, [class*="loading"]');
                        return loadingElements.length === 0 || Array.from(loadingElements).every(el => el.style.display === 'none');
                    }, { timeout: 45000 });
                    console.log('✅ Generation completed');
                } catch (e) {
                    console.log('⚠️  Generation may still be in progress or failed');
                }
                
                // Check for generated content
                await page.waitForTimeout(2000);
                const generatedContent = await page.$('.generated-site, [data-testid="preview"], .site-preview, [class*="preview"]');
                console.log(`✅ Generated content: ${generatedContent ? 'Found' : 'Not found'}`);
                
            } else {
                console.log('❌ Generate button not found');
            }
        } else {
            console.log('❌ URL input field not found');
        }
        
        // Test 6: Mobile Responsiveness
        console.log('\n📱 Test 6: Mobile Responsiveness');
        await page.setViewport({ width: 375, height: 667 }); // iPhone 6/7/8
        await page.waitForTimeout(1000);
        
        const isMobileResponsive = await page.evaluate(() => {
            const body = document.body;
            const hasOverflow = body.scrollWidth > window.innerWidth;
            return !hasOverflow;
        });
        console.log(`✅ Mobile responsive: ${isMobileResponsive ? 'Yes' : 'No'}`);
        
        // Test 7: Performance Metrics
        console.log('\n⚡ Test 7: Performance Metrics');
        const metrics = await page.metrics();
        console.log(`✅ JavaScript heap: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`✅ DOM nodes: ${metrics.Nodes}`);
        console.log(`✅ Event listeners: ${metrics.JSEventListeners}`);
        
        // Test 8: Console Errors Check
        console.log('\n🐛 Test 8: Console Errors Check');
        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(msg.text());
            }
        });
        
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        if (logs.length > 0) {
            console.log('❌ Console errors found:');
            logs.forEach(log => console.log(`   - ${log}`));
        } else {
            console.log('✅ No console errors detected');
        }
        
        // Test 9: Design Quality Assessment
        console.log('\n🎨 Test 9: Design Quality Assessment');
        const designElements = await page.evaluate(() => {
            const styles = window.getComputedStyle(document.body);
            const hasGradients = document.querySelector('[style*="gradient"], [class*="gradient"]') !== null;
            const hasAnimations = document.querySelector('[style*="animation"], [class*="animate"]') !== null;
            const hasShadows = document.querySelector('[style*="shadow"], [class*="shadow"]') !== null;
            
            return {
                fontFamily: styles.fontFamily,
                hasGradients,
                hasAnimations,
                hasShadows,
                backgroundColor: styles.backgroundColor
            };
        });
        
        console.log(`✅ Font family: ${designElements.fontFamily}`);
        console.log(`✅ Gradients: ${designElements.hasGradients ? 'Present' : 'None'}`);
        console.log(`✅ Animations: ${designElements.hasAnimations ? 'Present' : 'None'}`);
        console.log(`✅ Shadows: ${designElements.hasShadows ? 'Present' : 'None'}`);
        
        // Test 10: Feature Completeness
        console.log('\n🔧 Test 10: Feature Completeness Check');
        const features = await page.evaluate(() => {
            const hasDemo = document.body.innerText.toLowerCase().includes('demo');
            const hasTemplates = document.body.innerText.toLowerCase().includes('template');
            const hasGitHubIntegration = document.body.innerText.toLowerCase().includes('github');
            const hasAI = document.body.innerText.toLowerCase().includes('ai') || document.body.innerText.toLowerCase().includes('artificial');
            const hasProFeatures = document.body.innerText.toLowerCase().includes('pro') || document.body.innerText.toLowerCase().includes('premium');
            
            return {
                hasDemo,
                hasTemplates,
                hasGitHubIntegration,
                hasAI,
                hasProFeatures
            };
        });
        
        console.log(`✅ Demo mode: ${features.hasDemo ? 'Mentioned' : 'Not mentioned'}`);
        console.log(`✅ Templates: ${features.hasTemplates ? 'Mentioned' : 'Not mentioned'}`);
        console.log(`✅ GitHub integration: ${features.hasGitHubIntegration ? 'Mentioned' : 'Not mentioned'}`);
        console.log(`✅ AI features: ${features.hasAI ? 'Mentioned' : 'Not mentioned'}`);
        console.log(`✅ Pro features: ${features.hasProFeatures ? 'Mentioned' : 'Not mentioned'}`);
        
        // Final Assessment
        console.log('\n📊 FINAL ASSESSMENT');
        console.log('='.repeat(50));
        
        const score = calculateScore({
            loadTime,
            hasUrlInput: !!urlInput,
            hasGenerateButton: !!generateButton,
            isMobileResponsive,
            hasConsoleErrors: logs.length > 0,
            designQuality: designElements,
            features
        });
        
        console.log(`🎯 Overall Score: ${score}/100`);
        console.log(`📈 Partnership Ready: ${score >= 80 ? 'YES' : 'NEEDS IMPROVEMENT'}`);
        
        if (score < 80) {
            console.log('\n🔧 PRIORITY IMPROVEMENTS NEEDED:');
            if (loadTime > 3000) console.log('   - Optimize loading performance');
            if (!urlInput) console.log('   - Fix URL input functionality');
            if (!generateButton) console.log('   - Fix generate button');
            if (!isMobileResponsive) console.log('   - Improve mobile responsiveness');
            if (logs.length > 0) console.log('   - Fix console errors');
        }
        
        console.log('\n✅ Testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

function calculateScore(metrics) {
    let score = 100;
    
    // Performance (25 points)
    if (metrics.loadTime > 5000) score -= 15;
    else if (metrics.loadTime > 3000) score -= 8;
    else if (metrics.loadTime > 2000) score -= 3;
    
    // Functionality (30 points)
    if (!metrics.hasUrlInput) score -= 15;
    if (!metrics.hasGenerateButton) score -= 15;
    
    // Mobile (15 points)
    if (!metrics.isMobileResponsive) score -= 15;
    
    // Quality (15 points)
    if (metrics.hasConsoleErrors) score -= 8;
    if (!metrics.designQuality.hasGradients && !metrics.designQuality.hasAnimations) score -= 5;
    
    // Features (15 points)
    const featureCount = Object.values(metrics.features).filter(Boolean).length;
    if (featureCount < 3) score -= 10;
    else if (featureCount < 4) score -= 5;
    
    return Math.max(0, score);
}

// Run the test
comprehensiveTest().catch(console.error);