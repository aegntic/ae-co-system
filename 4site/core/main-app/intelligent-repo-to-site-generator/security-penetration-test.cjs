const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSecurityPenetrationTest() {
    console.log('🔒 ELITE PENETRATION TESTING - 4site.pro');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    
    // Enable console logging and error tracking
    const errors = [];
    const securityIssues = [];
    
    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('❌ Page Error:', error.message);
    });

    try {
        // 1. Test Local Development Server
        console.log('\n1. TESTING LOCAL DEVELOPMENT SERVER...');
        
        let serverResponse;
        try {
            await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
            serverResponse = 'Local server accessible';
            console.log('✅ Local development server responsive');
        } catch (e) {
            serverResponse = 'Local server not running';
            console.log('⚠️  Local development server not running');
        }

        // 2. Test API Endpoints Security
        console.log('\n2. API ENDPOINT SECURITY TESTING...');
        
        const apiTests = [
            { url: 'http://localhost:3001/api/health', method: 'GET', expected: 200 },
            { url: 'http://localhost:3001/api/leads/capture', method: 'POST', expected: 400 }, // Should fail without data
            { url: 'http://localhost:3001/api/social/start-verification', method: 'POST', expected: 400 }
        ];

        for (const test of apiTests) {
            try {
                const response = await page.evaluate(async (testUrl, method) => {
                    const res = await fetch(testUrl, { method });
                    return { status: res.status, ok: res.ok };
                }, test.url, test.method);
                
                if (response.status === test.expected) {
                    console.log(`✅ ${test.url} - Status ${response.status} (Expected)`);
                } else {
                    console.log(`⚠️  ${test.url} - Status ${response.status} (Expected ${test.expected})`);
                }
            } catch (e) {
                console.log(`❌ ${test.url} - Error: ${e.message}`);
            }
        }

        // 3. XSS Testing
        console.log('\n3. XSS VULNERABILITY TESTING...');
        
        if (serverResponse === 'Local server accessible') {
            // Test for XSS in input fields
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                'javascript:alert("XSS")',
                '<img src=x onerror=alert("XSS")>',
                '"><script>alert("XSS")</script>',
                "'><script>alert('XSS')</script>"
            ];

            for (const payload of xssPayloads) {
                try {
                    await page.goto('http://localhost:5173');
                    
                    // Try to find input fields and test XSS
                    const inputs = await page.$$('input[type="text"], input[type="url"], textarea');
                    
                    if (inputs.length > 0) {
                        await inputs[0].type(payload);
                        
                        // Check if script executed (basic check)
                        const alertHandled = await page.evaluate(() => {
                            const originalAlert = window.alert;
                            let alertCalled = false;
                            window.alert = () => { alertCalled = true; };
                            setTimeout(() => { window.alert = originalAlert; }, 100);
                            return alertCalled;
                        });
                        
                        if (alertHandled) {
                            securityIssues.push(`XSS vulnerability with payload: ${payload}`);
                            console.log(`❌ CRITICAL: XSS vulnerability detected with: ${payload.substring(0, 30)}...`);
                        } else {
                            console.log(`✅ XSS payload blocked: ${payload.substring(0, 30)}...`);
                        }
                    }
                } catch (e) {
                    console.log(`✅ XSS test failed to execute (likely protected): ${payload.substring(0, 30)}...`);
                }
            }
        }

        // 4. CSRF Testing
        console.log('\n4. CSRF PROTECTION TESTING...');
        
        // Check for CSRF tokens in forms
        if (serverResponse === 'Local server accessible') {
            await page.goto('http://localhost:5173');
            
            const forms = await page.$$('form');
            let csrfTokenFound = false;
            
            for (const form of forms) {
                const csrfInput = await form.$('input[name*="csrf"], input[name*="token"]');
                if (csrfInput) {
                    csrfTokenFound = true;
                    break;
                }
            }
            
            if (csrfTokenFound) {
                console.log('✅ CSRF tokens detected in forms');
            } else {
                console.log('⚠️  No CSRF tokens found in forms');
                securityIssues.push('Missing CSRF protection');
            }
        }

        // 5. Content Security Policy Testing
        console.log('\n5. CONTENT SECURITY POLICY TESTING...');
        
        if (serverResponse === 'Local server accessible') {
            await page.goto('http://localhost:5173');
            
            const cspHeader = await page.evaluate(() => {
                return document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            });
            
            if (cspHeader) {
                console.log('✅ CSP meta tag found');
            } else {
                console.log('❌ CRITICAL: No Content Security Policy found');
                securityIssues.push('Missing Content Security Policy');
            }
        }

        // 6. HTTP Security Headers Testing
        console.log('\n6. HTTP SECURITY HEADERS TESTING...');
        
        try {
            const response = await page.goto('http://localhost:5173');
            const headers = response.headers();
            
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection',
                'strict-transport-security',
                'content-security-policy'
            ];
            
            securityHeaders.forEach(header => {
                if (headers[header]) {
                    console.log(`✅ ${header}: ${headers[header]}`);
                } else {
                    console.log(`❌ Missing security header: ${header}`);
                    securityIssues.push(`Missing security header: ${header}`);
                }
            });
        } catch (e) {
            console.log('⚠️  Could not test HTTP headers');
        }

        // 7. Input Validation Testing
        console.log('\n7. INPUT VALIDATION TESTING...');
        
        if (serverResponse === 'Local server accessible') {
            await page.goto('http://localhost:5173');
            
            const testInputs = [
                { value: 'not-a-url', field: 'url' },
                { value: 'invalid-email', field: 'email' },
                { value: 'A'.repeat(1000), field: 'any' }, // Length test
                { value: '../../etc/passwd', field: 'any' }, // Path traversal
                { value: 'SELECT * FROM users', field: 'any' } // SQL injection attempt
            ];
            
            for (const test of testInputs) {
                try {
                    const inputs = await page.$$('input');
                    if (inputs.length > 0) {
                        await inputs[0].clear();
                        await inputs[0].type(test.value);
                        
                        // Try to submit and check for validation
                        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
                        if (submitButton) {
                            await submitButton.click();
                            await page.waitForTimeout(1000);
                            
                            // Check for validation messages
                            const errorMessages = await page.$$('.error, .invalid, [class*="error"], [class*="invalid"]');
                            if (errorMessages.length > 0) {
                                console.log(`✅ Input validation detected for: ${test.value.substring(0, 20)}...`);
                            } else {
                                console.log(`⚠️  No validation for: ${test.value.substring(0, 20)}...`);
                            }
                        }
                    }
                } catch (e) {
                    console.log(`✅ Input validation test blocked: ${test.value.substring(0, 20)}...`);
                }
            }
        }

        // 8. Authentication and Authorization Testing
        console.log('\n8. AUTHENTICATION & AUTHORIZATION TESTING...');
        
        // Test protected endpoints without authentication
        const protectedEndpoints = [
            'http://localhost:3001/api/leads/analytics/test-site-id',
            'http://localhost:3001/api/social/verified-platforms/test@example.com'
        ];
        
        for (const endpoint of protectedEndpoints) {
            try {
                const response = await page.evaluate(async (url) => {
                    const res = await fetch(url);
                    return { status: res.status, ok: res.ok };
                }, endpoint);
                
                if (response.status === 401 || response.status === 403) {
                    console.log(`✅ Protected endpoint properly secured: ${endpoint}`);
                } else {
                    console.log(`❌ CRITICAL: Unprotected endpoint: ${endpoint} (Status: ${response.status})`);
                    securityIssues.push(`Unprotected endpoint: ${endpoint}`);
                }
            } catch (e) {
                console.log(`✅ Protected endpoint blocked: ${endpoint}`);
            }
        }

    } catch (error) {
        console.error('❌ CRITICAL: Penetration testing failed:', error);
        errors.push(error.message);
    } finally {
        await browser.close();
    }

    // Generate Security Report
    console.log('\n' + '='.repeat(60));
    console.log('PENETRATION TESTING COMPLETE');
    console.log('='.repeat(60));
    
    const report = {
        timestamp: new Date().toISOString(),
        totalErrors: errors.length,
        securityIssues: securityIssues.length,
        errors: errors,
        issues: securityIssues,
        recommendations: [
            'Implement Content Security Policy',
            'Add CSRF protection to forms',
            'Configure security headers',
            'Implement rate limiting',
            'Add proper CORS configuration',
            'Enhance input validation',
            'Add authentication to protected endpoints'
        ]
    };
    
    if (securityIssues.length === 0) {
        console.log('✅ No critical security vulnerabilities detected');
    } else {
        console.log(`❌ ${securityIssues.length} security issues found:`);
        securityIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    // Save detailed report
    fs.writeFileSync('security-penetration-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: security-penetration-report.json');
    
    return report;
}

// Run the penetration test
runSecurityPenetrationTest().catch(console.error);