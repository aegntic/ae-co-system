#!/usr/bin/env node
/**
 * Production Environment Validation for 4site.pro
 * Validates all required environment variables and configurations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple chalk-like colors
const chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    boldBlue: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
    boldGreen: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
    boldYellow: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`,
    boldRed: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`
};

class ProductionEnvValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    log(message, level = 'info') {
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red
        };
        console.log(`${colors[level](`[${level.toUpperCase()}]`)} ${message}`);
    }

    validateEnvFile() {
        console.log(chalk.boldBlue('\n🔍 4site.pro Production Environment Validation\n'));
        
        // Check if .env.local exists
        const envPath = path.join(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            this.log('❌ .env.local file not found', 'error');
            this.results.failed++;
            return;
        }

        // Load environment variables
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key] = valueParts.join('=').replace(/"/g, '');
                }
            }
        });

        // Required environment variables
        const requiredVars = [
            { key: 'VITE_GEMINI_API_KEY', name: 'Gemini API Key', critical: true },
            { key: 'VITE_APP_NAME', name: 'Application Name', critical: true },
            { key: 'VITE_APP_URL', name: 'Application URL', critical: true },
            { key: 'NODE_ENV', name: 'Node Environment', critical: true }
        ];

        const optionalVars = [
            { key: 'VITE_SUPABASE_URL', name: 'Supabase URL', critical: false },
            { key: 'VITE_SUPABASE_ANON_KEY', name: 'Supabase Anonymous Key', critical: false },
            { key: 'VITE_ENABLE_ANALYTICS', name: 'Analytics Enabled', critical: false }
        ];

        console.log(chalk.bold('Required Environment Variables:'));
        console.log('='.repeat(50));

        // Validate required variables
        requiredVars.forEach(varConfig => {
            const value = envVars[varConfig.key];
            if (!value) {
                this.log(`❌ ${varConfig.name} (${varConfig.key}) - MISSING`, 'error');
                this.results.failed++;
            } else if (value.includes('your-') || value.includes('YOUR-') || value.includes('placeholder')) {
                this.log(`⚠️  ${varConfig.name} (${varConfig.key}) - PLACEHOLDER VALUE`, 'warning');
                this.results.warnings++;
            } else {
                this.log(`✅ ${varConfig.name} (${varConfig.key}) - CONFIGURED`, 'success');
                this.results.passed++;
            }
        });

        console.log('\n' + chalk.bold('Optional Environment Variables:'));
        console.log('='.repeat(50));

        // Validate optional variables
        optionalVars.forEach(varConfig => {
            const value = envVars[varConfig.key];
            if (!value) {
                this.log(`⚠️  ${varConfig.name} (${varConfig.key}) - NOT SET`, 'warning');
                this.results.warnings++;
            } else if (value.includes('your-') || value.includes('YOUR-') || value.includes('placeholder')) {
                this.log(`⚠️  ${varConfig.name} (${varConfig.key}) - PLACEHOLDER VALUE`, 'warning');
                this.results.warnings++;
            } else {
                this.log(`✅ ${varConfig.name} (${varConfig.key}) - CONFIGURED`, 'success');
                this.results.passed++;
            }
        });

        // Production specific validations
        console.log('\n' + chalk.bold('Production Configuration Checks:'));
        console.log('='.repeat(50));

        // Check NODE_ENV
        if (envVars.NODE_ENV === 'production') {
            this.log('✅ NODE_ENV set to production', 'success');
            this.results.passed++;
        } else {
            this.log(`⚠️  NODE_ENV is "${envVars.NODE_ENV}", should be "production"`, 'warning');
            this.results.warnings++;
        }

        // Check Gemini API key format
        if (envVars.VITE_GEMINI_API_KEY && envVars.VITE_GEMINI_API_KEY.startsWith('AIza')) {
            this.log('✅ Gemini API key format appears valid', 'success');
            this.results.passed++;
        } else if (envVars.VITE_GEMINI_API_KEY) {
            this.log('⚠️  Gemini API key format may be invalid', 'warning');
            this.results.warnings++;
        }

        // Check production URLs
        if (envVars.VITE_APP_URL && envVars.VITE_APP_URL.includes('4site.pro')) {
            this.log('✅ Production URL configured for 4site.pro', 'success');
            this.results.passed++;
        } else {
            this.log('⚠️  Production URL not set to 4site.pro domain', 'warning');
            this.results.warnings++;
        }

        // Feature flags validation
        const features = ['VITE_ENABLE_VIRAL_MECHANICS', 'VITE_ENABLE_COMMISSIONS', 'VITE_ENABLE_PRO_SHOWCASE'];
        features.forEach(feature => {
            if (envVars[feature] === 'true') {
                this.log(`✅ ${feature} enabled for production`, 'success');
                this.results.passed++;
            } else {
                this.log(`⚠️  ${feature} not enabled`, 'warning');
                this.results.warnings++;
            }
        });

        this.displaySummary();
    }

    displaySummary() {
        console.log('\n' + '='.repeat(60));
        console.log(chalk.boldBlue('📊 PRODUCTION ENVIRONMENT VALIDATION SUMMARY'));
        console.log('='.repeat(60));
        
        console.log(`${chalk.green('✅ Passed:')} ${this.results.passed}`);
        console.log(`${chalk.yellow('⚠️  Warnings:')} ${this.results.warnings}`);
        console.log(`${chalk.red('❌ Failed:')} ${this.results.failed}`);
        
        const total = this.results.passed + this.results.warnings + this.results.failed;
        const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
        
        console.log(`${chalk.cyan('📈 Success Rate:')} ${successRate}%`);
        
        if (this.results.failed === 0 && this.results.warnings < 3) {
            console.log('\n' + chalk.boldGreen('🎉 ENVIRONMENT READY FOR PRODUCTION LAUNCH!'));
        } else if (this.results.failed === 0) {
            console.log('\n' + chalk.boldYellow('⚠️  ENVIRONMENT MOSTLY READY - Address warnings for optimal production'));
        } else {
            console.log('\n' + chalk.boldRed('❌ ENVIRONMENT NOT READY - Fix critical issues before launch'));
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        return this.results.failed === 0;
    }
}

// Execute validation
const validator = new ProductionEnvValidator();
const isReady = validator.validateEnvFile();
process.exit(isReady ? 0 : 1);