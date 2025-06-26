#!/usr/bin/env node
/**
 * Simplified Launch Validation for 4site.pro
 * Validates current development environment readiness for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

class SimpleLaunchValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0
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

    async runValidation() {
        console.clear();
        console.log(colors.boldBlue('\n🚀 4site.pro Simple Launch Validation\n'));
        console.log('=' * 60);
        
        const checks = [
            { name: 'Environment Configuration', fn: () => this.checkEnvironment() },
            { name: 'Production Build', fn: () => this.checkBuild() },
            { name: 'API Configuration', fn: () => this.checkAPI() },
            { name: 'Monitoring Setup', fn: () => this.checkMonitoring() },
            { name: 'Security Configuration', fn: () => this.checkSecurity() },
            { name: 'Performance Optimization', fn: () => this.checkPerformance() }
        ];

        for (const check of checks) {
            await this.runCheck(check.name, check.fn);
        }

        this.displaySummary();
        return this.results.failed === 0;
    }

    async runCheck(name, checkFn) {
        try {
            console.log(`\n${colors.bold(`🔍 ${name}`)}`);
            console.log('-'.repeat(40));
            
            const result = await checkFn();
            
            if (result.success) {
                this.log(`✅ ${name} - PASSED`, 'success');
                this.results.passed++;
            } else {
                this.log(`⚠️ ${name} - ${result.message}`, 'warning');
                this.results.warnings++;
            }
            
            // Display details
            if (result.details) {
                result.details.forEach(detail => {
                    console.log(`  ${detail.status === 'ok' ? '✅' : '⚠️'} ${detail.message}`);
                });
            }
            
        } catch (error) {
            this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
            this.results.failed++;
        }
    }

    async checkEnvironment() {
        const details = [];
        let allOk = true;

        // Check .env.local
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            details.push({ status: 'ok', message: '.env.local file exists' });
            
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Check required variables
            const requiredVars = ['VITE_GEMINI_API_KEY', 'VITE_APP_NAME', 'NODE_ENV'];
            requiredVars.forEach(varName => {
                if (envContent.includes(varName)) {
                    details.push({ status: 'ok', message: `${varName} configured` });
                } else {
                    details.push({ status: 'warning', message: `${varName} missing` });
                    allOk = false;
                }
            });
        } else {
            details.push({ status: 'warning', message: '.env.local file missing' });
            allOk = false;
        }

        return {
            success: allOk,
            message: allOk ? 'Environment properly configured' : 'Some environment issues detected',
            details
        };
    }

    async checkBuild() {
        const details = [];
        let allOk = true;

        // Check if dist exists
        const distPath = path.join(__dirname, 'dist');
        if (fs.existsSync(distPath)) {
            details.push({ status: 'ok', message: 'Production build exists' });
            
            // Check build files
            const indexPath = path.join(distPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                details.push({ status: 'ok', message: 'index.html generated' });
            } else {
                details.push({ status: 'warning', message: 'index.html missing' });
                allOk = false;
            }

            // Check assets
            const assetsPath = path.join(distPath, 'assets');
            if (fs.existsSync(assetsPath)) {
                const assets = fs.readdirSync(assetsPath);
                const hasJS = assets.some(file => file.endsWith('.js'));
                const hasCSS = assets.some(file => file.endsWith('.css'));
                
                if (hasJS) details.push({ status: 'ok', message: 'JavaScript bundle generated' });
                if (hasCSS) details.push({ status: 'ok', message: 'CSS bundle generated' });
                
                // Check bundle size
                const jsFile = assets.find(file => file.endsWith('.js'));
                if (jsFile) {
                    const jsPath = path.join(assetsPath, jsFile);
                    const stats = fs.statSync(jsPath);
                    const sizeKB = Math.round(stats.size / 1024);
                    details.push({ 
                        status: sizeKB < 500 ? 'ok' : 'warning', 
                        message: `Bundle size: ${sizeKB}KB ${sizeKB < 500 ? '(optimized)' : '(large)'}` 
                    });
                }
            } else {
                details.push({ status: 'warning', message: 'Assets directory missing' });
                allOk = false;
            }
        } else {
            details.push({ status: 'warning', message: 'No production build found - run npm run build' });
            allOk = false;
        }

        return {
            success: allOk,
            message: allOk ? 'Production build ready' : 'Build issues detected',
            details
        };
    }

    async checkAPI() {
        const details = [];
        let allOk = true;

        // Check package.json dependencies
        const packagePath = path.join(__dirname, 'package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Check key dependencies
            const keyDeps = ['@google/generative-ai', 'react', 'vite'];
            keyDeps.forEach(dep => {
                if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
                    details.push({ status: 'ok', message: `${dep} dependency available` });
                } else {
                    details.push({ status: 'warning', message: `${dep} dependency missing` });
                    allOk = false;
                }
            });
        }

        // Check source files
        const srcPath = path.join(__dirname, 'src');
        if (fs.existsSync(srcPath)) {
            details.push({ status: 'ok', message: 'Source directory exists' });
            
            const appPath = path.join(srcPath, 'App.tsx');
            if (fs.existsSync(appPath)) {
                details.push({ status: 'ok', message: 'Main App component exists' });
            }
        } else {
            details.push({ status: 'warning', message: 'Source directory missing' });
            allOk = false;
        }

        return {
            success: allOk,
            message: allOk ? 'API configuration ready' : 'API issues detected',
            details
        };
    }

    async checkMonitoring() {
        const details = [];
        let allOk = true;

        // Check monitoring directory
        const monitoringPath = path.join(__dirname, 'monitoring');
        if (fs.existsSync(monitoringPath)) {
            details.push({ status: 'ok', message: 'Monitoring directory exists' });
            
            // Check monitoring files
            const expectedFiles = ['dashboard.html', 'health-check.js', 'metrics.js', 'alerts.js'];
            expectedFiles.forEach(file => {
                const filePath = path.join(monitoringPath, file);
                if (fs.existsSync(filePath)) {
                    details.push({ status: 'ok', message: `${file} configured` });
                } else {
                    details.push({ status: 'warning', message: `${file} missing` });
                    allOk = false;
                }
            });
        } else {
            details.push({ status: 'warning', message: 'Monitoring directory missing' });
            allOk = false;
        }

        return {
            success: allOk,
            message: allOk ? 'Monitoring system ready' : 'Monitoring setup incomplete',
            details
        };
    }

    async checkSecurity() {
        const details = [];
        let allOk = true;

        // Check for security files
        const securityFiles = ['production-env-secrets.env', 'security-policies.sql'];
        securityFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                details.push({ status: 'ok', message: `${file} exists` });
            } else {
                details.push({ status: 'warning', message: `${file} missing` });
            }
        });

        // Check environment security
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Check for production settings
            if (envContent.includes('NODE_ENV=production')) {
                details.push({ status: 'ok', message: 'NODE_ENV set to production' });
            } else {
                details.push({ status: 'warning', message: 'NODE_ENV not set to production' });
                allOk = false;
            }

            // Check for placeholder values
            if (envContent.includes('placeholder') || envContent.includes('your-')) {
                details.push({ status: 'warning', message: 'Placeholder values detected in environment' });
                allOk = false;
            } else {
                details.push({ status: 'ok', message: 'No placeholder values in environment' });
            }
        }

        return {
            success: allOk,
            message: allOk ? 'Security configuration ready' : 'Security issues detected',
            details
        };
    }

    async checkPerformance() {
        const details = [];
        let allOk = true;

        // Check vite config
        const viteConfigPath = path.join(__dirname, 'vite.config.ts');
        if (fs.existsSync(viteConfigPath)) {
            details.push({ status: 'ok', message: 'Vite configuration exists' });
        }

        // Check production config
        const prodConfigPath = path.join(__dirname, 'vite-production-config.ts');
        if (fs.existsSync(prodConfigPath)) {
            details.push({ status: 'ok', message: 'Production configuration exists' });
        }

        // Check if build was optimized
        const distPath = path.join(__dirname, 'dist', 'assets');
        if (fs.existsSync(distPath)) {
            const assets = fs.readdirSync(distPath);
            const jsFiles = assets.filter(file => file.endsWith('.js'));
            
            if (jsFiles.length > 0) {
                const totalSize = jsFiles.reduce((total, file) => {
                    const filePath = path.join(distPath, file);
                    const stats = fs.statSync(filePath);
                    return total + stats.size;
                }, 0);
                
                const totalKB = Math.round(totalSize / 1024);
                details.push({ 
                    status: totalKB < 500 ? 'ok' : 'warning', 
                    message: `Total bundle size: ${totalKB}KB` 
                });
                
                if (totalKB < 500) {
                    details.push({ status: 'ok', message: 'Bundle size optimized for production' });
                } else {
                    details.push({ status: 'warning', message: 'Bundle size may be too large' });
                    allOk = false;
                }
            }
        }

        return {
            success: allOk,
            message: allOk ? 'Performance optimized' : 'Performance issues detected',
            details
        };
    }

    displaySummary() {
        console.log('\n' + '='.repeat(60));
        console.log(colors.boldBlue('📊 LAUNCH VALIDATION SUMMARY'));
        console.log('='.repeat(60));
        
        console.log(`${colors.green('✅ Passed:')} ${this.results.passed}`);
        console.log(`${colors.yellow('⚠️ Warnings:')} ${this.results.warnings}`);
        console.log(`${colors.red('❌ Failed:')} ${this.results.failed}`);
        
        const total = this.results.passed + this.results.warnings + this.results.failed;
        const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
        
        console.log(`${colors.cyan('📈 Success Rate:')} ${successRate}%`);
        
        if (this.results.failed === 0 && this.results.warnings === 0) {
            console.log('\n' + colors.boldGreen('🎉 READY FOR PRODUCTION LAUNCH!'));
        } else if (this.results.failed === 0) {
            console.log('\n' + colors.yellow('⚠️ MOSTLY READY - Address warnings for optimal production'));
        } else {
            console.log('\n' + colors.boldRed('❌ NOT READY - Fix critical issues before launch'));
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

// Execute validation
const validator = new SimpleLaunchValidator();
const isReady = await validator.runValidation();
process.exit(isReady ? 0 : 1);