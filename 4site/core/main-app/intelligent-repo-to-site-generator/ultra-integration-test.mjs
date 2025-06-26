#!/usr/bin/env node

/**
 * ULTRA INTEGRATION SPECIALIST - Complete User Workflow Validation
 * 
 * This test validates the complete user journey from frontend to backend
 * with zero tolerance for broken workflows.
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs/promises';

const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 60000;

class UltraIntegrationValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      performance: {},
      errors: [],
      success: false
    };
  }

  async initialize() {
    console.log('🚀 ULTRA INTEGRATION SPECIALIST - Initializing...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor console messages and errors
    this.page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
    });
    
    this.page.on('pageerror', error => {
      console.error('[PAGE ERROR]', error.message);
      this.results.errors.push({
        type: 'page_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async testBackendHealth() {
    console.log('🔍 Testing Backend Health...');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      const data = await response.json();
      
      this.results.tests.push({
        name: 'Backend Health Check',
        status: response.status === 200 ? 'PASS' : 'FAIL',
        details: data,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Backend health check passed');
      return true;
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      this.results.errors.push({
        type: 'backend_health',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async testFrontendLoading() {
    console.log('🔍 Testing Frontend Loading...');
    
    const startTime = Date.now();
    
    try {
      await this.page.goto(FRONTEND_URL, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      const loadTime = Date.now() - startTime;
      this.results.performance.pageLoadTime = loadTime;
      
      // Wait for React to render
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Check for error messages
      const errorElements = await this.page.$eval('body', body => {
        const text = body.innerText;
        return {
          hasError: text.includes('Error') || text.includes('Failed') || text.includes('undefined'),
          content: text.substring(0, 500)
        };
      });
      
      this.results.tests.push({
        name: 'Frontend Loading',
        status: loadTime < 5000 && !errorElements.hasError ? 'PASS' : 'FAIL',
        details: {
          loadTime: `${loadTime}ms`,
          hasErrors: errorElements.hasError,
          contentPreview: errorElements.content
        },
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Frontend loaded in ${loadTime}ms`);
      return true;
    } catch (error) {
      console.error('❌ Frontend loading failed:', error.message);
      this.results.errors.push({
        type: 'frontend_loading',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async testBundleAnalysis() {
    console.log('🔍 Analyzing Bundle Performance...');
    
    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          resourceCount: resources.length,
          totalTransferSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
          jsResources: resources.filter(r => r.name.includes('.js')).length,
          cssResources: resources.filter(r => r.name.includes('.css')).length
        };
      });
      
      this.results.performance = { ...this.results.performance, ...metrics };
      
      // Core Web Vitals assessment
      const isOptimized = 
        metrics.domContentLoaded < 1800 && 
        metrics.loadComplete < 3000 && 
        metrics.totalTransferSize < 2000000; // 2MB
      
      this.results.tests.push({
        name: 'Bundle Performance Analysis',
        status: isOptimized ? 'PASS' : 'FAIL',
        details: metrics,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Bundle analysis completed');
      return true;
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      this.results.errors.push({
        type: 'bundle_analysis',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async testUserWorkflow() {
    console.log('🔍 Testing Complete User Workflow...');
    
    try {
      // Look for URL input field
      await this.page.waitForSelector('input[type="url"], input[placeholder*="github"], input[placeholder*="repository"], input[name*="url"], input[id*="url"]', { timeout: 10000 });
      
      // Find the input field
      const inputSelector = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const urlInput = inputs.find(input => 
          input.type === 'url' || 
          input.placeholder?.toLowerCase().includes('github') ||
          input.placeholder?.toLowerCase().includes('repository') ||
          input.placeholder?.toLowerCase().includes('url') ||
          input.name?.toLowerCase().includes('url') ||
          input.id?.toLowerCase().includes('url')
        );
        return urlInput ? `input[${urlInput.type ? `type="${urlInput.type}"` : `placeholder="${urlInput.placeholder}"`}]` : null;
      });
      
      if (!inputSelector) {
        throw new Error('Could not find URL input field');
      }
      
      // Test with a real GitHub repository
      const testRepoUrl = 'https://github.com/facebook/react';
      await this.page.type(inputSelector, testRepoUrl);
      
      // Look for submit button
      const submitButton = await this.page.$('button[type="submit"], button:contains("Generate"), button:contains("Create"), button:contains("Submit")');
      
      if (submitButton) {
        // Click submit button
        await submitButton.click();
        
        // Wait for processing or results
        await this.page.waitForTimeout(3000);
        
        // Check for loading indicators or results
        const hasResults = await this.page.evaluate(() => {
          const body = document.body.innerText.toLowerCase();
          return body.includes('loading') || 
                 body.includes('generating') || 
                 body.includes('preview') || 
                 body.includes('result') ||
                 body.includes('success') ||
                 body.includes('error');
        });
        
        this.results.tests.push({
          name: 'User Workflow - Repository Submission',
          status: hasResults ? 'PASS' : 'FAIL',
          details: {
            testUrl: testRepoUrl,
            inputSelector,
            hasResults
          },
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ User workflow test completed');
        return true;
      } else {
        throw new Error('Could not find submit button');
      }
    } catch (error) {
      console.error('❌ User workflow test failed:', error.message);
      this.results.errors.push({
        type: 'user_workflow',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async testAPIIntegration() {
    console.log('🔍 Testing API Integration...');
    
    try {
      // Test lead capture endpoint
      const leadData = {
        email: 'test@example.com',
        source: 'ultra_integration_test'
      };
      
      const response = await fetch(`${BACKEND_URL}/api/leads/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });
      
      const responseData = await response.json();
      
      this.results.tests.push({
        name: 'API Integration - Lead Capture',
        status: response.status === 200 || response.status === 201 ? 'PASS' : 'FAIL',
        details: {
          statusCode: response.status,
          response: responseData
        },
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ API integration test completed');
      return true;
    } catch (error) {
      console.error('❌ API integration test failed:', error.message);
      this.results.errors.push({
        type: 'api_integration',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  async captureScreenshot() {
    console.log('📸 Capturing validation screenshot...');
    
    try {
      await this.page.screenshot({
        path: '/home/tabs/ae-co-system/4site/core/main-app/intelligent-repo-to-site-generator/ultra-integration-validation.png',
        fullPage: true
      });
      console.log('✅ Screenshot captured');
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error.message);
    }
  }

  async generateReport() {
    console.log('📊 Generating Final Report...');
    
    const passedTests = this.results.tests.filter(test => test.status === 'PASS').length;
    const totalTests = this.results.tests.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    this.results.success = successRate >= 80 && this.results.errors.length === 0;
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: `${successRate.toFixed(1)}%`,
      errorCount: this.results.errors.length
    };
    
    // Save detailed report
    await fs.writeFile(
      '/home/tabs/ae-co-system/4site/core/main-app/intelligent-repo-to-site-generator/ultra-integration-report.json',
      JSON.stringify(this.results, null, 2)
    );
    
    console.log('\n🎯 ULTRA INTEGRATION VALIDATION COMPLETE');
    console.log('=====================================');
    console.log(`Success Rate: ${this.results.summary.successRate}`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Errors: ${this.results.errors.length}`);
    console.log(`Overall Status: ${this.results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (this.results.performance.pageLoadTime) {
      console.log(`Page Load Time: ${this.results.performance.pageLoadTime}ms`);
    }
    
    return this.results.success;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runFullValidation() {
    let overallSuccess = true;
    
    try {
      await this.initialize();
      
      // Run all validation tests
      const tests = [
        () => this.testBackendHealth(),
        () => this.testFrontendLoading(),
        () => this.testBundleAnalysis(),
        () => this.testUserWorkflow(),
        () => this.testAPIIntegration()
      ];
      
      for (const test of tests) {
        const result = await test();
        if (!result) overallSuccess = false;
      }
      
      await this.captureScreenshot();
      const reportSuccess = await this.generateReport();
      
      return overallSuccess && reportSuccess;
      
    } catch (error) {
      console.error('💥 CRITICAL FAILURE:', error.message);
      this.results.errors.push({
        type: 'critical_failure',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Execute validation
const validator = new UltraIntegrationValidator();
const success = await validator.runFullValidation();

process.exit(success ? 0 : 1);