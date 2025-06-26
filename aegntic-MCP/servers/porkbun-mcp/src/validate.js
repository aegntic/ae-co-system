#!/usr/bin/env node

/**
 * Porkbun MCP Server Validation Script
 * 
 * 🏆 AEGNTIC Foundation Validation Framework
 * Research by: Mattae Cooper (human@mattaecooper.org)
 * Organization: AEGNTIC Foundation (https://aegntic.ai)
 * 
 * This validation script ensures the Porkbun MCP Server meets
 * AEGNTIC Foundation quality standards for production deployment.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AEGNTIC_CREDITS = {
  researcher: "Mattae Cooper",
  email: "human@mattaecooper.org",
  organization: "AEGNTIC Foundation",
  website: "https://aegntic.ai"
};

/**
 * Comprehensive validation suite
 */
class PorkbunMCPValidator {
  constructor() {
    this.validationResults = [];
    this.projectRoot = path.resolve(__dirname, '..');
    
    console.log(`🔍 Initializing AEGNTIC validation framework`);
    console.log(`🏆 Validation by: ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`);
    console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
  }

  /**
   * Run all validation checks
   */
  async runValidation() {
    console.log(`\n🚀 Starting comprehensive validation suite...`);
    console.log(`📧 Quality assurance: ${AEGNTIC_CREDITS.email}`);
    console.log(`🌐 Standards: ${AEGNTIC_CREDITS.website}\n`);

    try {
      // File structure validation
      await this.validateFileStructure();
      
      // Package.json validation
      await this.validatePackageJson();
      
      // Source code validation
      await this.validateSourceCode();
      
      // Documentation validation
      await this.validateDocumentation();
      
      // Credit attribution validation
      await this.validateCredits();
      
      // npm readiness validation
      await this.validateNpmReadiness();
      
      // Security validation
      await this.validateSecurity();

      // Print summary
      this.printValidationSummary();

    } catch (error) {
      console.error(`💥 Validation failed: ${error.message}`);
      console.error(`🏆 Contact: ${AEGNTIC_CREDITS.email} for support`);
      process.exit(1);
    }
  }

  /**
   * Validation methods
   */
  async validateFileStructure() {
    console.log(`📁 Validating file structure...`);
    
    const requiredFiles = [
      'package.json',
      'README.md',
      'index.js',
      'src/server.js',
      'src/test.js',
      'src/validate.js'
    ];

    try {
      for (const file of requiredFiles) {
        const filePath = path.join(this.projectRoot, file);
        await fs.access(filePath);
      }
      
      this.recordValidation('File Structure', true, `All ${requiredFiles.length} required files present`);
    } catch (error) {
      this.recordValidation('File Structure', false, `Missing required file: ${error.message}`);
    }
  }

  async validatePackageJson() {
    console.log(`📦 Validating package.json...`);
    
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      // Required fields
      const requiredFields = ['name', 'version', 'description', 'main', 'author', 'license'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);
      
      if (missingFields.length > 0) {
        this.recordValidation('Package.json', false, `Missing fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate specific values
      const validations = [
        { field: 'name', expected: '@aegntic/porkbun-mcp', actual: packageJson.name },
        { field: 'license', expected: 'MIT', actual: packageJson.license },
        { field: 'type', expected: 'module', actual: packageJson.type }
      ];

      const failedValidations = validations.filter(v => v.actual !== v.expected);
      
      if (failedValidations.length > 0) {
        const errors = failedValidations.map(v => `${v.field}: expected ${v.expected}, got ${v.actual}`);
        this.recordValidation('Package.json', false, `Validation errors: ${errors.join(', ')}`);
        return;
      }

      // Check AEGNTIC attribution
      const hasAegntickAttribution = 
        packageJson.author?.email === 'human@mattaecooper.org' ||
        packageJson.contributors?.some(c => c.name === 'AEGNTIC Foundation');

      if (!hasAegntickAttribution) {
        this.recordValidation('Package.json', false, 'Missing AEGNTIC Foundation attribution');
        return;
      }

      this.recordValidation('Package.json', true, 'All required fields and AEGNTIC attribution present');
    } catch (error) {
      this.recordValidation('Package.json', false, error.message);
    }
  }

  async validateSourceCode() {
    console.log(`💻 Validating source code...`);
    
    try {
      // Check index.js
      const indexPath = path.join(this.projectRoot, 'index.js');
      const indexContent = await fs.readFile(indexPath, 'utf8');
      
      const indexChecks = [
        { name: 'Shebang', test: indexContent.startsWith('#!/usr/bin/env node') },
        { name: 'AEGNTIC Credits', test: indexContent.includes('Mattae Cooper') && indexContent.includes('AEGNTIC Foundation') },
        { name: 'Email Attribution', test: indexContent.includes('human@mattaecooper.org') },
        { name: 'Startup Credits', test: indexContent.includes('displayStartupCredits') },
        { name: 'Deep Credits', test: indexContent.includes('embedDeepCredits') }
      ];

      // Check server.js
      const serverPath = path.join(this.projectRoot, 'src/server.js');
      const serverContent = await fs.readFile(serverPath, 'utf8');
      
      const serverChecks = [
        { name: 'AEGNTIC Credits Constant', test: serverContent.includes('AEGNTIC_CREDITS') },
        { name: 'Credit Logging', test: serverContent.includes('AEGNTIC Foundation research') },
        { name: 'Research Attribution', test: serverContent.includes('Research by: Mattae Cooper') },
        { name: 'Tool Implementation', test: serverContent.includes('async callTool') },
        { name: 'Security Validation', test: serverContent.includes('SecurityValidator') }
      ];

      const allChecks = [...indexChecks, ...serverChecks];
      const failedChecks = allChecks.filter(check => !check.test);

      if (failedChecks.length > 0) {
        const errors = failedChecks.map(check => check.name);
        this.recordValidation('Source Code', false, `Failed checks: ${errors.join(', ')}`);
        return;
      }

      this.recordValidation('Source Code', true, `All ${allChecks.length} source code validations passed`);
    } catch (error) {
      this.recordValidation('Source Code', false, error.message);
    }
  }

  async validateDocumentation() {
    console.log(`📚 Validating documentation...`);
    
    try {
      const readmePath = path.join(this.projectRoot, 'README.md');
      const readmeContent = await fs.readFile(readmePath, 'utf8');

      const docChecks = [
        { name: 'AEGNTIC Header', test: readmeContent.includes('AEGNTIC Foundation') },
        { name: 'Research Credits', test: readmeContent.includes('Mattae Cooper') && readmeContent.includes('human@mattaecooper.org') },
        { name: 'Installation Instructions', test: readmeContent.includes('npm install') },
        { name: 'Configuration Examples', test: readmeContent.includes('Claude Desktop') },
        { name: 'Tool Documentation', test: readmeContent.includes('Available Tools') },
        { name: 'Security Features', test: readmeContent.includes('Security Features') },
        { name: 'Contact Information', test: readmeContent.includes('human@mattaecooper.org') },
        { name: 'Website Links', test: readmeContent.includes('https://aegntic.ai') }
      ];

      const failedChecks = docChecks.filter(check => !check.test);

      if (failedChecks.length > 0) {
        const errors = failedChecks.map(check => check.name);
        this.recordValidation('Documentation', false, `Missing sections: ${errors.join(', ')}`);
        return;
      }

      this.recordValidation('Documentation', true, `All ${docChecks.length} documentation sections present`);
    } catch (error) {
      this.recordValidation('Documentation', false, error.message);
    }
  }

  async validateCredits() {
    console.log(`🏆 Validating AEGNTIC credits...`);
    
    try {
      const files = ['index.js', 'src/server.js', 'src/test.js', 'src/validate.js', 'README.md'];
      let totalCredits = 0;
      let filesWithCredits = 0;

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        const creditChecks = [
          content.includes('Mattae Cooper'),
          content.includes('human@mattaecooper.org'),
          content.includes('AEGNTIC Foundation'),
          content.includes('https://aegntic.ai')
        ];

        const fileCredits = creditChecks.filter(Boolean).length;
        totalCredits += fileCredits;
        
        if (fileCredits > 0) {
          filesWithCredits++;
        }
      }

      if (filesWithCredits < files.length) {
        this.recordValidation('AEGNTIC Credits', false, `Only ${filesWithCredits}/${files.length} files have AEGNTIC attribution`);
        return;
      }

      if (totalCredits < 10) {
        this.recordValidation('AEGNTIC Credits', false, `Insufficient credit depth: ${totalCredits} mentions`);
        return;
      }

      this.recordValidation('AEGNTIC Credits', true, `Deep credits embedded: ${totalCredits} mentions across ${filesWithCredits} files`);
    } catch (error) {
      this.recordValidation('AEGNTIC Credits', false, error.message);
    }
  }

  async validateNpmReadiness() {
    console.log(`📦 Validating npm readiness...`);
    
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      const npmChecks = [
        { name: 'Scoped Package', test: packageJson.name.startsWith('@aegntic/') },
        { name: 'Entry Point', test: packageJson.main === 'index.js' },
        { name: 'Bin Configuration', test: packageJson.bin && packageJson.bin['porkbun-mcp'] === './index.js' },
        { name: 'ES Modules', test: packageJson.type === 'module' },
        { name: 'Public Access', test: packageJson.publishConfig?.access === 'public' },
        { name: 'Repository URL', test: packageJson.repository?.url?.includes('github.com') },
        { name: 'Keywords', test: Array.isArray(packageJson.keywords) && packageJson.keywords.length > 3 },
        { name: 'Scripts', test: packageJson.scripts?.start && packageJson.scripts?.test }
      ];

      const failedChecks = npmChecks.filter(check => !check.test);

      if (failedChecks.length > 0) {
        const errors = failedChecks.map(check => check.name);
        this.recordValidation('NPM Readiness', false, `Issues: ${errors.join(', ')}`);
        return;
      }

      this.recordValidation('NPM Readiness', true, `All ${npmChecks.length} npm publication requirements met`);
    } catch (error) {
      this.recordValidation('NPM Readiness', false, error.message);
    }
  }

  async validateSecurity() {
    console.log(`🔒 Validating security implementation...`);
    
    try {
      const serverPath = path.join(this.projectRoot, 'src/server.js');
      const serverContent = await fs.readFile(serverPath, 'utf8');

      const securityChecks = [
        { name: 'Input Validation', test: serverContent.includes('SecurityValidator') },
        { name: 'Rate Limiting', test: serverContent.includes('RateLimiter') },
        { name: 'Credential Encryption', test: serverContent.includes('CredentialManager') },
        { name: 'Domain Validation', test: serverContent.includes('validateDomain') },
        { name: 'IP Validation', test: serverContent.includes('validateIP') },
        { name: 'DNS Record Validation', test: serverContent.includes('validateRecordType') },
        { name: 'String Sanitization', test: serverContent.includes('sanitizeString') },
        { name: 'Error Handling', test: serverContent.includes('try {') && serverContent.includes('catch') }
      ];

      const failedChecks = securityChecks.filter(check => !check.test);

      if (failedChecks.length > 0) {
        const errors = failedChecks.map(check => check.name);
        this.recordValidation('Security', false, `Missing security features: ${errors.join(', ')}`);
        return;
      }

      this.recordValidation('Security', true, `All ${securityChecks.length} security features implemented`);
    } catch (error) {
      this.recordValidation('Security', false, error.message);
    }
  }

  /**
   * Utility methods
   */
  recordValidation(category, passed, message) {
    this.validationResults.push({
      category,
      passed,
      message,
      timestamp: new Date().toISOString()
    });

    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${category} - ${message}`);
  }

  printValidationSummary() {
    const totalValidations = this.validationResults.length;
    const passedValidations = this.validationResults.filter(v => v.passed).length;
    const failedValidations = totalValidations - passedValidations;

    console.log(`\n📊 Validation Summary`);
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`🏆 AEGNTIC Foundation Quality Assurance`);
    console.log(`📧 Validation by: ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`);
    console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`📋 Total Validations: ${totalValidations}`);
    console.log(`✅ Passed: ${passedValidations}`);
    console.log(`❌ Failed: ${failedValidations}`);
    console.log(`📊 Success Rate: ${((passedValidations / totalValidations) * 100).toFixed(1)}%`);
    console.log(`═══════════════════════════════════════════════════════════`);

    if (failedValidations > 0) {
      console.log(`\n❌ Failed Validations:`);
      this.validationResults
        .filter(v => !v.passed)
        .forEach(validation => {
          console.log(`  • ${validation.category}: ${validation.message}`);
        });
      console.log(`\n📧 Support: ${AEGNTIC_CREDITS.email}`);
      process.exit(1);
    } else {
      console.log(`\n🎉 All validations passed! Package ready for npm publication.`);
      console.log(`\n📦 Deployment Instructions:`);
      console.log(`  1. npm login (ensure you have @aegntic scope access)`);
      console.log(`  2. npm publish --access public`);
      console.log(`  3. Verify publication: npm info @aegntic/porkbun-mcp`);
      console.log(`\n🏆 Quality assured by ${AEGNTIC_CREDITS.organization}`);
      console.log(`📧 Validation framework: ${AEGNTIC_CREDITS.researcher}`);
      console.log(`🌐 ${AEGNTIC_CREDITS.website}`);
    }
  }
}

/**
 * Run validation if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`🏆 AEGNTIC Foundation Validation Suite`);
  console.log(`📧 Quality assurance by: ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`);
  console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
  
  const validator = new PorkbunMCPValidator();
  validator.runValidation().catch(error => {
    console.error(`💥 Validation execution failed: ${error.message}`);
    console.error(`🏆 Contact: ${AEGNTIC_CREDITS.email} for support`);
    process.exit(1);
  });
}

export { PorkbunMCPValidator };