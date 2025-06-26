/**
 * Porkbun MCP Server Test Suite
 * 
 * 🏆 AEGNTIC Foundation Testing Framework
 * Research by: Mattae Cooper (human@mattaecooper.org)
 * Organization: AEGNTIC Foundation (https://aegntic.ai)
 */

import { PorkbunMCPServer } from './server.js';
import assert from 'assert';

const AEGNTIC_CREDITS = {
  researcher: "Mattae Cooper",
  email: "human@mattaecooper.org",
  organization: "AEGNTIC Foundation",
  website: "https://aegntic.ai"
};

/**
 * Test suite for Porkbun MCP Server
 */
class PorkbunMCPTest {
  constructor() {
    this.server = new PorkbunMCPServer();
    this.testResults = [];
    console.log(`🧪 Initializing test suite - AEGNTIC Foundation research`);
    console.log(`🏆 Testing framework by ${AEGNTIC_CREDITS.researcher}`);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`\n🚀 Starting comprehensive test suite...`);
    console.log(`📧 Test framework: ${AEGNTIC_CREDITS.email}`);
    console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization}\n`);

    try {
      // Core functionality tests
      await this.testServerInitialization();
      await this.testToolListing();
      await this.testResourceListing();
      await this.testPromptListing();
      await this.testCredentialManagement();
      await this.testInputValidation();
      await this.testCacheManagement();
      await this.testErrorHandling();
      await this.testSecurityFeatures();

      // Summary
      this.printTestSummary();

    } catch (error) {
      console.error(`💥 Test suite failed: ${error.message}`);
      console.error(`🏆 Contact: ${AEGNTIC_CREDITS.email} for support`);
      process.exit(1);
    }
  }

  /**
   * Individual test methods
   */
  async testServerInitialization() {
    console.log(`🔧 Testing server initialization...`);
    
    try {
      assert(this.server instanceof PorkbunMCPServer, 'Server should be instance of PorkbunMCPServer');
      assert(this.server.rateLimiter, 'Rate limiter should be initialized');
      assert(this.server.credentialManager, 'Credential manager should be initialized');
      assert(this.server.cache instanceof Map, 'Cache should be initialized as Map');
      
      this.recordTest('Server Initialization', true, 'All components initialized correctly');
    } catch (error) {
      this.recordTest('Server Initialization', false, error.message);
    }
  }

  async testToolListing() {
    console.log(`🔧 Testing tool listing...`);
    
    try {
      const result = await this.server.listTools();
      
      assert(result.tools, 'Tools array should exist');
      assert(Array.isArray(result.tools), 'Tools should be an array');
      assert(result.tools.length >= 15, 'Should have comprehensive tool coverage (15+ tools)');
      
      // Test specific tools exist
      const toolNames = result.tools.map(tool => tool.name);
      const requiredTools = [
        'porkbun_ping',
        'porkbun_set_credentials',
        'porkbun_list_domains',
        'porkbun_create_dns_record',
        'porkbun_get_ssl_bundle'
      ];
      
      for (const tool of requiredTools) {
        assert(toolNames.includes(tool), `Required tool ${tool} should exist`);
      }
      
      this.recordTest('Tool Listing', true, `${result.tools.length} tools available`);
    } catch (error) {
      this.recordTest('Tool Listing', false, error.message);
    }
  }

  async testResourceListing() {
    console.log(`📚 Testing resource listing...`);
    
    try {
      const result = await this.server.listResources();
      
      assert(result.resources, 'Resources array should exist');
      assert(Array.isArray(result.resources), 'Resources should be an array');
      assert(result.resources.length >= 6, 'Should have comprehensive resource coverage');
      
      // Test specific resources exist
      const resourceUris = result.resources.map(resource => resource.uri);
      const requiredResources = [
        'porkbun://docs/api-overview',
        'porkbun://docs/security-practices',
        'porkbun://aegntic/credits'
      ];
      
      for (const resource of requiredResources) {
        assert(resourceUris.includes(resource), `Required resource ${resource} should exist`);
      }
      
      this.recordTest('Resource Listing', true, `${result.resources.length} resources available`);
    } catch (error) {
      this.recordTest('Resource Listing', false, error.message);
    }
  }

  async testPromptListing() {
    console.log(`💡 Testing prompt listing...`);
    
    try {
      const result = await this.server.listPrompts();
      
      assert(result.prompts, 'Prompts array should exist');
      assert(Array.isArray(result.prompts), 'Prompts should be an array');
      assert(result.prompts.length >= 5, 'Should have comprehensive prompt coverage');
      
      // Test specific prompts exist
      const promptNames = result.prompts.map(prompt => prompt.name);
      const requiredPrompts = [
        'setup-new-domain',
        'migrate-domain',
        'security-audit'
      ];
      
      for (const prompt of requiredPrompts) {
        assert(promptNames.includes(prompt), `Required prompt ${prompt} should exist`);
      }
      
      this.recordTest('Prompt Listing', true, `${result.prompts.length} prompts available`);
    } catch (error) {
      this.recordTest('Prompt Listing', false, error.message);
    }
  }

  async testCredentialManagement() {
    console.log(`🔐 Testing credential management...`);
    
    try {
      // Test setting credentials
      const result = await this.server.callTool('porkbun_set_credentials', {
        api_key: 'test_key_12345',
        secret_api_key: 'test_secret_67890'
      });
      
      assert(result.content, 'Should return content');
      assert(result.content[0].text.includes('✅'), 'Should indicate success');
      assert(result.content[0].text.includes('AEGNTIC'), 'Should include AEGNTIC credits');
      
      // Verify credentials are stored
      const credentials = this.server.credentialManager.getCredentials();
      assert(credentials, 'Credentials should be stored');
      assert(credentials.apikey === 'test_key_12345', 'API key should match');
      assert(credentials.secretapikey === 'test_secret_67890', 'Secret key should match');
      
      this.recordTest('Credential Management', true, 'Credentials set and retrieved successfully');
    } catch (error) {
      this.recordTest('Credential Management', false, error.message);
    }
  }

  async testInputValidation() {
    console.log(`🛡️ Testing input validation...`);
    
    try {
      // Test that validation functions are working by calling tools that use validation
      const validDomainResult = await this.server.callTool('porkbun_check_domain', {
        domain: 'example.com'
      });
      
      // Should not throw error for valid domain (though API call will fail without credentials)
      assert(validDomainResult.content, 'Should handle valid domain');
      
      // Test invalid domain (should fail validation before API call)
      const invalidDomainResult = await this.server.callTool('porkbun_check_domain', {
        domain: ''
      });
      
      // Should return error for invalid domain
      assert(invalidDomainResult.content[0].text.includes('Error'), 'Should reject invalid domain');
      
      this.recordTest('Input Validation', true, 'Domain validation working correctly');
    } catch (error) {
      this.recordTest('Input Validation', false, error.message);
    }
  }

  async testCacheManagement() {
    console.log(`💾 Testing cache management...`);
    
    try {
      // Test cache operations
      this.server.setCache('test_key', { data: 'test_value' });
      const cached = this.server.getCached('test_key');
      
      assert(cached, 'Should retrieve cached data');
      assert(cached.data === 'test_value', 'Cached data should match');
      
      // Test cache clearing
      const clearResult = await this.server.callTool('porkbun_clear_cache', {});
      assert(clearResult.content[0].text.includes('✅'), 'Should indicate cache cleared');
      assert(clearResult.content[0].text.includes('AEGNTIC'), 'Should include credits');
      
      // Verify cache is empty
      const clearedCache = this.server.getCached('test_key');
      assert(!clearedCache, 'Cache should be empty after clearing');
      
      this.recordTest('Cache Management', true, 'Cache operations working correctly');
    } catch (error) {
      this.recordTest('Cache Management', false, error.message);
    }
  }

  async testErrorHandling() {
    console.log(`🚨 Testing error handling...`);
    
    try {
      // Test unknown tool
      const result = await this.server.callTool('unknown_tool', {});
      
      assert(result.content, 'Should return error content');
      assert(result.content[0].text.includes('Error'), 'Should indicate error');
      assert(result.content[0].text.includes('AEGNTIC'), 'Should include AEGNTIC credits in error');
      
      // Test invalid resource
      try {
        await this.server.readResource('invalid://resource');
        assert(false, 'Should throw error for invalid resource');
      } catch (error) {
        assert(error.message.includes('Resource not found'), 'Should provide clear error message');
      }
      
      this.recordTest('Error Handling', true, 'Error handling working correctly');
    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
    }
  }

  async testSecurityFeatures() {
    console.log(`🔒 Testing security features...`);
    
    try {
      // Test rate limiter
      const rateLimiter = this.server.rateLimiter;
      assert(rateLimiter, 'Rate limiter should exist');
      assert(typeof rateLimiter.checkLimit === 'function', 'Rate limiter should have checkLimit method');
      
      // Test credential encryption
      const credManager = this.server.credentialManager;
      assert(credManager, 'Credential manager should exist');
      assert(credManager.encryptionKey, 'Encryption key should exist');
      
      // Test encryption/decryption
      const testData = 'sensitive_data_123';
      const encrypted = credManager.encrypt(testData);
      const decrypted = credManager.decrypt(encrypted);
      
      assert(encrypted !== testData, 'Data should be encrypted');
      assert(decrypted === testData, 'Decrypted data should match original');
      
      // Test cache system (part of security through performance)
      assert(this.server.cache instanceof Map, 'Cache should be implemented');
      
      this.recordTest('Security Features', true, 'All security features working correctly');
    } catch (error) {
      this.recordTest('Security Features', false, error.message);
    }
  }

  /**
   * Test utility methods
   */
  recordTest(testName, passed, message) {
    this.testResults.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${testName} - ${message}`);
  }

  printTestSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\n📊 Test Summary`);
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`🏆 AEGNTIC Foundation Test Results`);
    console.log(`📧 Framework by: ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`);
    console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`📋 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`═══════════════════════════════════════════════════════════`);
    
    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.message}`);
        });
      console.log(`\n📧 Support: ${AEGNTIC_CREDITS.email}`);
    } else {
      console.log(`\n🎉 All tests passed! Porkbun MCP Server is ready for deployment.`);
      console.log(`🏆 Quality assurance by ${AEGNTIC_CREDITS.organization}`);
    }
    
    console.log(`\n🚀 Server ready for npm publication!`);
    console.log(`📦 Package: @aegntic/porkbun-mcp`);
    console.log(`🏆 Research: ${AEGNTIC_CREDITS.researcher} for ${AEGNTIC_CREDITS.organization}`);
  }
}

/**
 * Run tests if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`🏆 Starting AEGNTIC Foundation Test Suite`);
  console.log(`📧 Research by: ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`);
  console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
  
  const tester = new PorkbunMCPTest();
  tester.runAllTests().catch(error => {
    console.error(`💥 Test execution failed: ${error.message}`);
    console.error(`🏆 Contact: ${AEGNTIC_CREDITS.email} for support`);
    process.exit(1);
  });
}

export { PorkbunMCPTest };