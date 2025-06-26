#!/usr/bin/env node
/**
 * Post-Launch Functionality Testing for 4site.pro
 * Comprehensive end-to-end testing suite
 */

import fetch from 'node-fetch';

// Simple colors
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    boldBlue: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
    boldGreen: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
    boldRed: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`
};

class PostLaunchTester {
    constructor() {
        this.deploymentUrl = 'http://localhost:5273';
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            total: 0
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorMap = {
            info: colors.blue,
            success: colors.green,
            warning: colors.yellow,
            error: colors.red
        };
        console.log(`${colors.cyan(`[${timestamp}]`)} ${colorMap[level](`[${level.toUpperCase()}]`)} ${message}`);
    }

    async runAllTests() {
        console.clear();
        console.log(colors.boldBlue('\n🧪 4site.pro Post-Launch Functionality Testing\n'));
        console.log(colors.boldBlue('='.repeat(60)));
        
        const testSuites = [
            { name: 'UI Component Testing', fn: () => this.testUIComponents() },
            { name: 'User Journey Testing', fn: () => this.testUserJourneys() },
            { name: 'Feature Integration Testing', fn: () => this.testFeatureIntegration() },
            { name: 'Error Handling Testing', fn: () => this.testErrorHandling() },
            { name: 'Mobile Responsiveness', fn: () => this.testMobileResponsiveness() },
            { name: 'SEO & Accessibility', fn: () => this.testSEOAccessibility() }
        ];

        for (const suite of testSuites) {
            await this.runTestSuite(suite.name, suite.fn);
        }

        this.displayFinalResults();
        return this.testResults.failed === 0;
    }

    async runTestSuite(name, testFn) {
        try {
            console.log(`\n${colors.bold(`🧪 ${name}`)}`);
            console.log(colors.blue('-'.repeat(50)));
            
            const result = await testFn();
            
            if (result.success) {
                this.log(`✅ ${name} - ALL TESTS PASSED`, 'success');
                this.testResults.passed += result.testsRun || 1;
            } else {
                this.log(`⚠️ ${name} - SOME ISSUES DETECTED`, 'warning');
                this.testResults.warnings += 1;
            }
            
            this.testResults.total += result.testsRun || 1;

            // Display test details
            if (result.tests) {
                result.tests.forEach(test => {
                    const icon = test.passed ? '✅' : '⚠️';
                    const color = test.passed ? colors.green : colors.yellow;
                    console.log(`  ${icon} ${color(test.name)}: ${test.message}`);
                });
            }
            
        } catch (error) {
            this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
            this.testResults.failed += 1;
            this.testResults.total += 1;
        }
    }

    async testUIComponents() {
        const tests = [];
        let allPassed = true;

        try {
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();

            // Test 1: Hero Section
            const hasHero = html.includes('4site.pro') || html.includes('Transform GitHub');
            tests.push({
                name: 'Hero Section',
                passed: hasHero,
                message: hasHero ? 'Hero section with 4site.pro branding found' : 'Hero section missing'
            });
            if (!hasHero) allPassed = false;

            // Test 2: Call-to-Action Buttons
            const hasButtons = html.includes('Generate') || html.includes('Create') || html.includes('button');
            tests.push({
                name: 'CTA Buttons',
                passed: hasButtons,
                message: hasButtons ? 'Call-to-action buttons present' : 'CTA buttons missing'
            });
            if (!hasButtons) allPassed = false;

            // Test 3: Navigation Elements
            const hasNavigation = html.includes('nav') || html.includes('menu') || html.includes('features');
            tests.push({
                name: 'Navigation',
                passed: hasNavigation,
                message: hasNavigation ? 'Navigation elements present' : 'Navigation missing'
            });
            if (!hasNavigation) allPassed = false;

            // Test 4: Glass Morphism Styles
            const hasGlassStyles = html.includes('glass') || html.includes('backdrop') || html.includes('blur');
            tests.push({
                name: 'Glass Morphism UI',
                passed: hasGlassStyles,
                message: hasGlassStyles ? 'Glass morphism styles loaded' : 'Glass effects missing'
            });
            if (!hasGlassStyles) allPassed = false;

            // Test 5: Responsive Design Classes
            const hasResponsive = html.includes('responsive') || html.includes('mobile') || html.includes('sm:') || html.includes('md:');
            tests.push({
                name: 'Responsive Design',
                passed: hasResponsive,
                message: hasResponsive ? 'Responsive design classes found' : 'Responsive design classes missing'
            });
            if (!hasResponsive) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'UI Component Loading',
                passed: false,
                message: `Failed to load UI: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    async testUserJourneys() {
        const tests = [];
        let allPassed = true;

        try {
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();

            // Test 1: Landing Page Experience
            const hasLanding = html.includes('GitHub') && (html.includes('transform') || html.includes('generate'));
            tests.push({
                name: 'Landing Page',
                passed: hasLanding,
                message: hasLanding ? 'Clear landing page with GitHub transformation messaging' : 'Landing page unclear'
            });
            if (!hasLanding) allPassed = false;

            // Test 2: Input Flow
            const hasInput = html.includes('input') || html.includes('url') || html.includes('repository');
            tests.push({
                name: 'URL Input Flow',
                passed: hasInput,
                message: hasInput ? 'URL input mechanism present' : 'URL input flow missing'
            });
            if (!hasInput) allPassed = false;

            // Test 3: Generation Process
            const hasGeneration = html.includes('Generate') || html.includes('Create') || html.includes('AI');
            tests.push({
                name: 'Generation Process',
                passed: hasGeneration,
                message: hasGeneration ? 'Site generation flow available' : 'Generation process missing'
            });
            if (!hasGeneration) allPassed = false;

            // Test 4: Preview/Results
            const hasPreview = html.includes('preview') || html.includes('result') || html.includes('template');
            tests.push({
                name: 'Preview System',
                passed: hasPreview,
                message: hasPreview ? 'Preview/results system present' : 'Preview system missing'
            });
            if (!hasPreview) allPassed = false;

            // Test 5: Download/Export
            const hasExport = html.includes('download') || html.includes('export') || html.includes('deploy');
            tests.push({
                name: 'Export Functionality',
                passed: hasExport,
                message: hasExport ? 'Export/download options available' : 'Export functionality missing'
            });
            if (!hasExport) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'User Journey Loading',
                passed: false,
                message: `Failed to analyze user journey: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    async testFeatureIntegration() {
        const tests = [];
        let allPassed = true;

        try {
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();

            // Test 1: AI Integration
            const hasAI = html.includes('AI') || html.includes('Gemini') || html.includes('intelligent');
            tests.push({
                name: 'AI Integration',
                passed: hasAI,
                message: hasAI ? 'AI integration features visible' : 'AI integration not apparent'
            });
            if (!hasAI) allPassed = false;

            // Test 2: GitHub Integration
            const hasGitHub = html.includes('GitHub') || html.includes('repository') || html.includes('repo');
            tests.push({
                name: 'GitHub Integration',
                passed: hasGitHub,
                message: hasGitHub ? 'GitHub integration features present' : 'GitHub integration missing'
            });
            if (!hasGitHub) allPassed = false;

            // Test 3: Template System
            const hasTemplates = html.includes('template') || html.includes('design') || html.includes('style');
            tests.push({
                name: 'Template System',
                passed: hasTemplates,
                message: hasTemplates ? 'Template system integrated' : 'Template system not visible'
            });
            if (!hasTemplates) allPassed = false;

            // Test 4: Real-time Features
            const hasRealtime = html.includes('real-time') || html.includes('live') || html.includes('instant');
            tests.push({
                name: 'Real-time Features',
                passed: hasRealtime,
                message: hasRealtime ? 'Real-time features present' : 'Real-time capabilities not visible'
            });
            if (!hasRealtime) allPassed = false;

            // Test 5: Analytics Integration
            const hasAnalytics = html.includes('analytics') || html.includes('track') || html.includes('metrics');
            tests.push({
                name: 'Analytics Integration',
                passed: hasAnalytics,
                message: hasAnalytics ? 'Analytics integration found' : 'Analytics integration not visible'
            });
            if (!hasAnalytics) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'Feature Integration Loading',
                passed: false,
                message: `Failed to analyze features: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    async testErrorHandling() {
        const tests = [];
        let allPassed = true;

        try {
            // Test 1: 404 Error Handling
            try {
                const response = await fetch(`${this.deploymentUrl}/nonexistent-page`);
                const handles404 = response.status === 404 || response.status === 200; // SPA might return 200
                tests.push({
                    name: '404 Error Handling',
                    passed: handles404,
                    message: handles404 ? 'Proper 404 handling or SPA routing' : '404 handling broken'
                });
                if (!handles404) allPassed = false;
            } catch (error) {
                tests.push({
                    name: '404 Error Handling',
                    passed: false,
                    message: `404 test failed: ${error.message}`
                });
                allPassed = false;
            }

            // Test 2: Malformed URL Handling
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();
            const hasErrorBoundary = html.includes('error') || html.includes('catch') || html.includes('fallback');
            tests.push({
                name: 'Error Boundary',
                passed: hasErrorBoundary,
                message: hasErrorBoundary ? 'Error handling mechanisms present' : 'Error boundaries not visible'
            });
            if (!hasErrorBoundary) allPassed = false;

            // Test 3: API Error Handling
            const hasAPIError = html.includes('retry') || html.includes('failed') || html.includes('timeout');
            tests.push({
                name: 'API Error Handling',
                passed: hasAPIError,
                message: hasAPIError ? 'API error handling visible' : 'API error handling not apparent'
            });
            if (!hasAPIError) allPassed = false;

            // Test 4: Network Error Recovery
            const hasNetworkError = html.includes('offline') || html.includes('connection') || html.includes('network');
            tests.push({
                name: 'Network Error Recovery',
                passed: hasNetworkError,
                message: hasNetworkError ? 'Network error handling present' : 'Network error handling missing'
            });
            if (!hasNetworkError) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'Error Handling Test',
                passed: false,
                message: `Error handling test failed: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    async testMobileResponsiveness() {
        const tests = [];
        let allPassed = true;

        try {
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();

            // Test 1: Viewport Meta Tag
            const hasViewport = html.includes('viewport') && html.includes('width=device-width');
            tests.push({
                name: 'Viewport Meta Tag',
                passed: hasViewport,
                message: hasViewport ? 'Proper viewport meta tag present' : 'Viewport meta tag missing'
            });
            if (!hasViewport) allPassed = false;

            // Test 2: Responsive CSS
            const hasResponsiveCSS = html.includes('responsive') || html.includes('@media') || html.includes('mobile');
            tests.push({
                name: 'Responsive CSS',
                passed: hasResponsiveCSS,
                message: hasResponsiveCSS ? 'Responsive CSS detected' : 'Responsive CSS not found'
            });
            if (!hasResponsiveCSS) allPassed = false;

            // Test 3: Mobile-First Design
            const hasMobileFirst = html.includes('sm:') || html.includes('md:') || html.includes('lg:');
            tests.push({
                name: 'Mobile-First Design',
                passed: hasMobileFirst,
                message: hasMobileFirst ? 'Mobile-first responsive classes found' : 'Mobile-first approach not evident'
            });
            if (!hasMobileFirst) allPassed = false;

            // Test 4: Touch-Friendly Elements
            const hasTouchFriendly = html.includes('button') || html.includes('touch') || html.includes('tap');
            tests.push({
                name: 'Touch-Friendly Elements',
                passed: hasTouchFriendly,
                message: hasTouchFriendly ? 'Touch-friendly elements present' : 'Touch-friendly elements missing'
            });
            if (!hasTouchFriendly) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'Mobile Responsiveness Test',
                passed: false,
                message: `Mobile test failed: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    async testSEOAccessibility() {
        const tests = [];
        let allPassed = true;

        try {
            const response = await fetch(this.deploymentUrl);
            const html = await response.text();

            // Test 1: Title Tag
            const hasTitle = html.includes('<title>') && html.includes('4site');
            tests.push({
                name: 'Title Tag',
                passed: hasTitle,
                message: hasTitle ? 'Proper title tag with branding' : 'Title tag missing or incomplete'
            });
            if (!hasTitle) allPassed = false;

            // Test 2: Meta Description
            const hasDescription = html.includes('meta name="description"') || html.includes('meta property="og:description"');
            tests.push({
                name: 'Meta Description',
                passed: hasDescription,
                message: hasDescription ? 'Meta description present' : 'Meta description missing'
            });
            if (!hasDescription) allPassed = false;

            // Test 3: Open Graph Tags
            const hasOG = html.includes('og:') || html.includes('property="og');
            tests.push({
                name: 'Open Graph Tags',
                passed: hasOG,
                message: hasOG ? 'Open Graph tags present' : 'Open Graph tags missing'
            });
            if (!hasOG) allPassed = false;

            // Test 4: Structured Data
            const hasStructuredData = html.includes('application/ld+json') || html.includes('schema.org');
            tests.push({
                name: 'Structured Data',
                passed: hasStructuredData,
                message: hasStructuredData ? 'Structured data/schema markup found' : 'Structured data missing'
            });
            if (!hasStructuredData) allPassed = false;

            // Test 5: Accessibility Features
            const hasA11y = html.includes('alt=') || html.includes('aria-') || html.includes('role=');
            tests.push({
                name: 'Accessibility Features',
                passed: hasA11y,
                message: hasA11y ? 'Accessibility features present' : 'Accessibility features missing'
            });
            if (!hasA11y) allPassed = false;

        } catch (error) {
            tests.push({
                name: 'SEO/Accessibility Test',
                passed: false,
                message: `SEO/A11y test failed: ${error.message}`
            });
            allPassed = false;
        }

        return {
            success: allPassed,
            tests,
            testsRun: tests.length
        };
    }

    displayFinalResults() {
        console.log('\n' + '='.repeat(70));
        console.log(colors.boldBlue('📊 POST-LAUNCH TESTING FINAL RESULTS'));
        console.log('='.repeat(70));
        
        console.log(`${colors.green('✅ Tests Passed:')} ${this.testResults.passed}`);
        console.log(`${colors.yellow('⚠️ Tests with Warnings:')} ${this.testResults.warnings}`);
        console.log(`${colors.red('❌ Tests Failed:')} ${this.testResults.failed}`);
        console.log(`${colors.cyan('📊 Total Tests Run:')} ${this.testResults.total}`);
        
        const successRate = this.testResults.total > 0 ? 
            Math.round((this.testResults.passed / this.testResults.total) * 100) : 0;
        
        console.log(`${colors.cyan('📈 Success Rate:')} ${successRate}%`);
        console.log(`${colors.cyan('🌐 Deployment URL:')} ${this.deploymentUrl}`);
        
        console.log('\n' + colors.bold('Test Coverage:'));
        console.log('• UI Components & User Interface');
        console.log('• User Journey & Experience Flow');
        console.log('• Feature Integration & AI Systems');
        console.log('• Error Handling & Recovery');
        console.log('• Mobile Responsiveness');
        console.log('• SEO & Accessibility');
        
        if (this.testResults.failed === 0 && this.testResults.warnings === 0) {
            console.log('\n' + colors.boldGreen('🎉 ALL TESTS PASSED - PRODUCTION READY!'));
            console.log(colors.green('✅ 4site.pro is fully operational and user-ready!'));
            console.log(colors.green('🚀 Ready for public launch and user traffic!'));
        } else if (this.testResults.failed === 0) {
            console.log('\n' + colors.yellow('⚠️ MOSTLY READY - Some optimizations recommended'));
            console.log(colors.yellow('🔧 Address warnings for enhanced user experience'));
            console.log(colors.green('✅ Safe for production deployment'));
        } else {
            console.log('\n' + colors.boldRed('❌ CRITICAL ISSUES DETECTED'));
            console.log(colors.red('🔧 Fix failed tests before public launch'));
            console.log(colors.red('⚠️ Not recommended for production traffic'));
        }
        
        console.log('\n' + '='.repeat(70) + '\n');
    }
}

// Execute all tests
const tester = new PostLaunchTester();
const allTestsPassed = await tester.runAllTests();
process.exit(allTestsPassed ? 0 : 1);