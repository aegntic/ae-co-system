#!/usr/bin/env node

/**
 * Chrome Web Store Submission Validator
 * Comprehensive validation for store readiness
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class SubmissionValidator {
    constructor() {
        this.extensionDir = path.join(__dirname, '../../chrome');
        this.packageDir = path.join(__dirname, '..');
        this.validationResults = {
            manifest: { passed: 0, failed: 0, warnings: 0 },
            assets: { passed: 0, failed: 0, warnings: 0 },
            performance: { passed: 0, failed: 0, warnings: 0 },
            compliance: { passed: 0, failed: 0, warnings: 0 }
        };
    }

    log(level, message, category = 'general') {
        const symbols = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow,
            info: chalk.blue
        };

        console.log(`${symbols[level]} ${colors[level](message)}`);

        // Track results
        if (this.validationResults[category]) {
            if (level === 'success') this.validationResults[category].passed++;
            else if (level === 'error') this.validationResults[category].failed++;
            else if (level === 'warning') this.validationResults[category].warnings++;
        }
    }

    async validateManifest() {
        this.log('info', 'Validating manifest.json...', 'manifest');

        try {
            const manifestPath = path.join(this.extensionDir, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);

            // Required fields
            const requiredFields = ['name', 'version', 'description', 'icons', 'action', 'permissions'];
            for (const field of requiredFields) {
                if (manifest[field]) {
                    this.log('success', `Required field '${field}' present`, 'manifest');
                } else {
                    this.log('error', `Missing required field '${field}'`, 'manifest');
                }
            }

            // Manifest version
            if (manifest.manifest_version === 3) {
                this.log('success', 'Using Manifest V3 (recommended)', 'manifest');
            } else {
                this.log('error', 'Must use Manifest V3 for new submissions', 'manifest');
            }

            // Name length
            if (manifest.name && manifest.name.length <= 45) {
                this.log('success', `Name length OK (${manifest.name.length}/45 characters)`, 'manifest');
            } else {
                this.log('error', `Name too long (${manifest.name?.length || 0}/45 characters)`, 'manifest');
            }

            // Description length  
            if (manifest.description && manifest.description.length <= 132) {
                this.log('success', `Description length OK (${manifest.description.length}/132 characters)`, 'manifest');
            } else {
                this.log('error', `Description too long (${manifest.description?.length || 0}/132 characters)`, 'manifest');
            }

            // Icons validation
            const requiredIconSizes = [16, 32, 48, 128];
            if (manifest.icons) {
                for (const size of requiredIconSizes) {
                    if (manifest.icons[size]) {
                        const iconPath = path.join(this.extensionDir, manifest.icons[size]);
                        try {
                            await fs.access(iconPath);
                            this.log('success', `Icon ${size}x${size} exists`, 'manifest');
                        } catch {
                            this.log('error', `Icon ${size}x${size} file not found`, 'manifest');
                        }
                    } else {
                        this.log('error', `Missing ${size}x${size} icon`, 'manifest');
                    }
                }
            }

            // Permissions audit
            if (manifest.permissions) {
                const sensitivePermissions = ['<all_urls>', 'tabs', 'activeTab', 'storage'];
                for (const permission of manifest.permissions) {
                    if (sensitivePermissions.includes(permission)) {
                        this.log('warning', `Sensitive permission detected: ${permission}`, 'manifest');
                    }
                }
                this.log('info', `Total permissions: ${manifest.permissions.length}`, 'manifest');
            }

        } catch (error) {
            this.log('error', `Error reading manifest: ${error.message}`, 'manifest');
        }
    }

    async validateAssets() {
        this.log('info', 'Validating marketing assets...', 'assets');

        const requiredAssets = [
            'marketing-assets/screenshots/01-main-interface-1280x800.png',
            'marketing-assets/screenshots/02-ai-features-1280x800.png', 
            'marketing-assets/screenshots/03-capture-workflow-1280x800.png',
            'marketing-assets/screenshots/04-performance-stats-1280x800.png',
            'marketing-assets/screenshots/05-project-analysis-1280x800.png',
            'marketing-assets/promotional-images/hero-image-1400x560.png',
            'marketing-assets/promotional-images/small-tile-440x280.png',
            'marketing-assets/promotional-images/marquee-promo-1400x560.png'
        ];

        for (const asset of requiredAssets) {
            const assetPath = path.join(this.packageDir, asset);
            try {
                const stats = await fs.stat(assetPath);
                const sizeKB = Math.round(stats.size / 1024);
                this.log('success', `${asset} exists (${sizeKB}KB)`, 'assets');
                
                // Size validation
                if (sizeKB > 2048) {
                    this.log('warning', `Asset may be too large: ${sizeKB}KB`, 'assets');
                }
            } catch {
                this.log('error', `Missing asset: ${asset}`, 'assets');
            }
        }

        // Validate icon assets
        const iconSizes = [16, 32, 48, 128];
        for (const size of iconSizes) {
            const iconPath = path.join(this.extensionDir, `assets/icon-${size}.png`);
            try {
                await fs.access(iconPath);
                this.log('success', `Icon ${size}x${size} exists`, 'assets');
            } catch {
                this.log('error', `Missing icon: icon-${size}.png`, 'assets');
            }
        }
    }

    async validatePerformance() {
        this.log('info', 'Validating performance requirements...', 'performance');

        // Check package size
        try {
            const extensionSize = await this.calculateDirectorySize(this.extensionDir);
            const sizeMB = Math.round(extensionSize / (1024 * 1024) * 100) / 100;
            
            if (sizeMB < 10) {
                this.log('success', `Extension size OK (${sizeMB}MB)`, 'performance');
            } else if (sizeMB < 20) {
                this.log('warning', `Extension size acceptable (${sizeMB}MB)`, 'performance');
            } else {
                this.log('error', `Extension too large (${sizeMB}MB)`, 'performance');
            }
        } catch (error) {
            this.log('error', `Error calculating size: ${error.message}`, 'performance');
        }

        // Validate file structure
        const requiredFiles = [
            'manifest.json',
            'popup/popup.html',
            'popup/popup.js',
            'popup/popup.css',
            'background/background.js',
            'content/content.js',
            'content/content.css'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.extensionDir, file);
            try {
                await fs.access(filePath);
                this.log('success', `Required file exists: ${file}`, 'performance');
            } catch {
                this.log('error', `Missing required file: ${file}`, 'performance');
            }
        }
    }

    async validateCompliance() {
        this.log('info', 'Validating Chrome Web Store compliance...', 'compliance');

        // Check for eval() usage (not allowed)
        const jsFiles = [
            'popup/popup.js',
            'background/background.js', 
            'content/content.js'
        ];

        for (const file of jsFiles) {
            try {
                const filePath = path.join(this.extensionDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                if (content.includes('eval(')) {
                    this.log('error', `eval() usage detected in ${file}`, 'compliance');
                } else {
                    this.log('success', `No eval() usage in ${file}`, 'compliance');
                }

                // Check for inline event handlers
                if (content.includes('onclick=') || content.includes('onload=')) {
                    this.log('warning', `Inline event handlers in ${file}`, 'compliance');
                }

                // Check for http:// URLs (should be https://)
                const httpMatches = content.match(/http:\/\/[^\s"']+/g);
                if (httpMatches) {
                    this.log('warning', `HTTP URLs detected in ${file}: ${httpMatches.length}`, 'compliance');
                }

            } catch (error) {
                this.log('warning', `Could not read ${file}: ${error.message}`, 'compliance');
            }
        }

        // Check HTML files for CSP compliance
        const htmlFiles = ['popup/popup.html'];
        for (const file of htmlFiles) {
            try {
                const filePath = path.join(this.extensionDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // Check for inline styles
                if (content.includes('style=')) {
                    this.log('warning', `Inline styles detected in ${file}`, 'compliance');
                }

                // Check for inline scripts
                if (content.includes('<script>') && !content.includes('src=')) {
                    this.log('warning', `Inline scripts detected in ${file}`, 'compliance');
                } else {
                    this.log('success', `No inline scripts in ${file}`, 'compliance');
                }

            } catch (error) {
                this.log('warning', `Could not read ${file}: ${error.message}`, 'compliance');
            }
        }

        // Validate store listing content exists
        const storeListingFiles = [
            'store-listing/title-description.md',
            'store-listing/category-keywords.md'
        ];

        for (const file of storeListingFiles) {
            const filePath = path.join(this.packageDir, file);
            try {
                await fs.access(filePath);
                this.log('success', `Store listing file exists: ${file}`, 'compliance');
            } catch {
                this.log('error', `Missing store listing file: ${file}`, 'compliance');
            }
        }
    }

    async calculateDirectorySize(dirPath) {
        let totalSize = 0;
        
        const items = await fs.readdir(dirPath);
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
                totalSize += await this.calculateDirectorySize(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
        
        return totalSize;
    }

    async generateReport() {
        const reportPath = path.join(this.packageDir, 'compliance/submission-validation-report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            validation_summary: this.validationResults,
            total_checks: Object.values(this.validationResults).reduce((sum, cat) => 
                sum + cat.passed + cat.failed + cat.warnings, 0),
            passed_checks: Object.values(this.validationResults).reduce((sum, cat) => 
                sum + cat.passed, 0),
            failed_checks: Object.values(this.validationResults).reduce((sum, cat) => 
                sum + cat.failed, 0),
            warning_checks: Object.values(this.validationResults).reduce((sum, cat) => 
                sum + cat.warnings, 0),
            readiness_score: this.calculateReadinessScore(),
            estimated_approval_chance: this.calculateApprovalChance()
        };

        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        this.log('success', `Validation report saved: ${reportPath}`, 'general');
        
        return report;
    }

    calculateReadinessScore() {
        const total = Object.values(this.validationResults).reduce((sum, cat) => 
            sum + cat.passed + cat.failed + cat.warnings, 0);
        const passed = Object.values(this.validationResults).reduce((sum, cat) => 
            sum + cat.passed, 0);
        const warnings = Object.values(this.validationResults).reduce((sum, cat) => 
            sum + cat.warnings, 0);
        
        // Passed = 100%, Warning = 50%, Failed = 0%
        const score = ((passed + warnings * 0.5) / total) * 100;
        return Math.round(score);
    }

    calculateApprovalChance() {
        const readinessScore = this.calculateReadinessScore();
        const failedChecks = Object.values(this.validationResults).reduce((sum, cat) => 
            sum + cat.failed, 0);
        
        if (failedChecks === 0) {
            return readinessScore > 90 ? '95%' : '85%';
        } else if (failedChecks <= 2) {
            return '70%';
        } else {
            return '40%';
        }
    }

    async run() {
        console.log(chalk.blue.bold('\n🔍 Chrome Web Store Submission Validator\n'));
        
        await this.validateManifest();
        console.log();
        
        await this.validateAssets();
        console.log();
        
        await this.validatePerformance();
        console.log();
        
        await this.validateCompliance();
        console.log();
        
        const report = await this.generateReport();
        
        console.log(chalk.blue.bold('📊 VALIDATION SUMMARY'));
        console.log(`Total Checks: ${report.total_checks}`);
        console.log(chalk.green(`✅ Passed: ${report.passed_checks}`));
        console.log(chalk.red(`❌ Failed: ${report.failed_checks}`));
        console.log(chalk.yellow(`⚠️  Warnings: ${report.warning_checks}`));
        console.log(`\n🎯 Readiness Score: ${report.readiness_score}%`);
        console.log(`📈 Approval Chance: ${report.estimated_approval_chance}`);
        
        if (report.failed_checks === 0) {
            console.log(chalk.green.bold('\n🎉 SUBMISSION READY! All critical checks passed.'));
        } else {
            console.log(chalk.red.bold('\n⚠️  SUBMISSION NOT READY! Please fix failed checks before submitting.'));
        }
    }
}

// Run if called directly
if (require.main === module) {
    const validator = new SubmissionValidator();
    validator.run().catch(console.error);
}

module.exports = SubmissionValidator;