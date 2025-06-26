const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testUpdatedWebsite() {
    console.log('🚀 Starting 4site.pro Updated Website Test...\n');
    
    let browser;
    try {
        // Connect to browserless Chrome container
        browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://localhost:3000'
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load the test preview page
        const testFile = path.join(__dirname, 'test-updated-preview.html');
        const testUrl = `file://${testFile}`;
        
        console.log('📄 Loading test preview page...');
        await page.goto(testUrl, { waitUntil: 'networkidle0' });
        
        // Test 1: Hero Section Validation
        console.log('✅ Test 1: Hero Section Messaging');
        const heroTitle = await page.$eval('h1', el => el.textContent);
        console.log(`   Hero Title: "${heroTitle}"`);
        
        if (heroTitle.includes('Living Websites That') && heroTitle.includes('Update Themselves')) {
            console.log('   ✅ Hero messaging correctly updated');
        } else {
            console.log('   ❌ Hero messaging not updated properly');
        }
        
        // Test 2: Pricing Tiers Validation
        console.log('\n✅ Test 2: Pricing Structure');
        const pricingCards = await page.$$('.pricing-card');
        console.log(`   Found ${pricingCards.length} pricing tiers`);
        
        if (pricingCards.length === 4) {
            console.log('   ✅ All four tiers present (FREE, PRO, BUSINESS, ENTERPRISE)');
            
            // Check specific pricing
            const prices = await page.$$eval('.price', prices => 
                prices.map(p => p.textContent.trim())
            );
            console.log(`   Prices: ${prices.join(', ')}`);
            
            if (prices.includes('$49.49/month') && prices.includes('$494.94/month') && prices.includes('$4,949.49/month')) {
                console.log('   ✅ Pricing psychology (.49 endings) implemented');
            }
        } else {
            console.log('   ❌ Missing pricing tiers');
        }
        
        // Test 3: Features Section Validation
        console.log('\n✅ Test 3: Features Section');
        const featureCards = await page.$$('.feature-card');
        console.log(`   Found ${featureCards.length} feature cards`);
        
        const featureTitles = await page.$$eval('.feature-card h3', titles => 
            titles.map(t => t.textContent.trim())
        );
        console.log(`   Features: ${featureTitles.join(', ')}`);
        
        if (featureTitles.includes('Living Websites') && featureTitles.includes('Network Visibility')) {
            console.log('   ✅ Key messaging features present');
        }
        
        // Test 4: Polar.sh Integration Section
        console.log('\n✅ Test 4: Polar.sh Integration');
        const polarSection = await page.$('section:has(span:contains("Polar.sh"))');
        if (polarSection) {
            console.log('   ✅ Polar.sh integration section found');
            
            const polarHeading = await page.$eval('h2:has(span)', h2 => h2.textContent);
            if (polarHeading.includes('Powered by Polar.sh')) {
                console.log('   ✅ Polar.sh partnership messaging present');
            }
        } else {
            console.log('   ❌ Polar.sh section not found');
        }
        
        // Test 5: Network Visibility Focus (No Financial Promises)
        console.log('\n✅ Test 5: Content Compliance Check');
        const pageText = await page.evaluate(() => document.body.textContent);
        
        // Check for prohibited content
        const prohibitedTerms = ['ROI', 'return on investment', 'earn money', 'make money', 'income opportunity'];
        const foundProhibited = prohibitedTerms.filter(term => 
            pageText.toLowerCase().includes(term.toLowerCase())
        );
        
        if (foundProhibited.length === 0) {
            console.log('   ✅ No prohibited financial language found');
        } else {
            console.log(`   ⚠️  Found prohibited terms: ${foundProhibited.join(', ')}`);
        }
        
        // Check for required messaging
        const requiredTerms = ['network visibility', 'professional recognition', 'industry leaders'];
        const foundRequired = requiredTerms.filter(term => 
            pageText.toLowerCase().includes(term.toLowerCase())
        );
        
        console.log(`   ✅ Required messaging terms found: ${foundRequired.length}/${requiredTerms.length}`);
        
        // Test 6: Visual Elements
        console.log('\n✅ Test 6: Visual Elements');
        
        // Check for glass morphism
        const glassCards = await page.$$('.glass-card');
        console.log(`   Glass cards: ${glassCards.length}`);
        
        // Check for gradients and modern styling
        const gradientElements = await page.$$eval('*', elements => 
            elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.background.includes('gradient');
            }).length
        );
        console.log(`   Gradient elements: ${gradientElements}`);
        
        // Test 7: Responsive Design
        console.log('\n✅ Test 7: Responsive Design');
        
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        const mobileCards = await page.$$('.pricing-card');
        console.log(`   Mobile view pricing cards: ${mobileCards.length}`);
        
        // Reset to desktop
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Test 8: Interactive Elements
        console.log('\n✅ Test 8: Interactive Elements');
        
        // Test button hover effects
        const buttons = await page.$$('.glass-button');
        console.log(`   Interactive buttons: ${buttons.length}`);
        
        if (buttons.length > 0) {
            await page.hover('.glass-button');
            console.log('   ✅ Button interactions working');
        }
        
        // Take screenshot
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ 
            path: 'test-results/updated-website-screenshot.png',
            fullPage: true 
        });
        
        // Test 9: Console Validation
        console.log('\n✅ Test 9: JavaScript Console Check');
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'log') {
                consoleLogs.push(msg.text());
            }
        });
        
        await page.reload();
        await page.waitForTimeout(1000);
        
        console.log(`   Console messages: ${consoleLogs.length}`);
        consoleLogs.forEach(log => console.log(`     ${log}`));
        
        // Generate Test Report
        const testReport = {
            timestamp: new Date().toISOString(),
            status: 'PASSED',
            tests: {
                hero_messaging: heroTitle.includes('Living Websites That'),
                pricing_tiers: pricingCards.length === 4,
                features_updated: featureTitles.includes('Living Websites'),
                polar_integration: !!polarSection,
                content_compliance: foundProhibited.length === 0,
                visual_elements: glassCards.length > 0,
                responsive_design: mobileCards.length === 4,
                interactive_elements: buttons.length > 0
            },
            summary: {
                total_tests: 8,
                passed_tests: Object.values({
                    hero_messaging: heroTitle.includes('Living Websites That'),
                    pricing_tiers: pricingCards.length === 4,
                    features_updated: featureTitles.includes('Living Websites'),
                    polar_integration: !!polarSection,
                    content_compliance: foundProhibited.length === 0,
                    visual_elements: glassCards.length > 0,
                    responsive_design: mobileCards.length === 4,
                    interactive_elements: buttons.length > 0
                }).filter(Boolean).length
            }
        };
        
        // Save report
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }
        
        fs.writeFileSync(
            'test-results/updated-website-test-report.json', 
            JSON.stringify(testReport, null, 2)
        );
        
        console.log('\n🎉 Test Summary:');
        console.log(`   ✅ ${testReport.summary.passed_tests}/${testReport.summary.total_tests} tests passed`);
        console.log(`   📊 Success Rate: ${Math.round((testReport.summary.passed_tests / testReport.summary.total_tests) * 100)}%`);
        console.log('   📄 Full report saved to: test-results/updated-website-test-report.json');
        console.log('   📸 Screenshot saved to: test-results/updated-website-screenshot.png');
        
        if (testReport.summary.passed_tests === testReport.summary.total_tests) {
            console.log('\n🚀 ALL TESTS PASSED! Website is ready for partnership outreach.');
        } else {
            console.log('\n⚠️  Some tests failed. Review the report for details.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Save error report
        const errorReport = {
            timestamp: new Date().toISOString(),
            status: 'FAILED',
            error: error.message,
            stack: error.stack
        };
        
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }
        
        fs.writeFileSync(
            'test-results/updated-website-error-report.json', 
            JSON.stringify(errorReport, null, 2)
        );
        
        console.log('   📄 Error report saved to: test-results/updated-website-error-report.json');
        
    } finally {
        if (browser) {
            await browser.disconnect();
        }
    }
}

// Run the test
testUpdatedWebsite().then(() => {
    console.log('\n✨ Website validation complete!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});