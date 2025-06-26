#!/usr/bin/env node
/**
 * Porkbun DNS Manager for 4site.pro
 * Manages DNS records and automation via Porkbun API
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load environment variables
const API_KEY = process.env.PORKBUN_API_KEY || 'pk1_ce6617a1c4b5e3f693d0c193b5831d24670a6895808e55f59c066ac4f04c4adc';
const SECRET_KEY = process.env.PORKBUN_SECRET_KEY || '';
const DOMAIN = '4site.pro';
const API_BASE = 'https://api.porkbun.com/api/json/v3';

// Colors for console output
const colors = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class PorkbunDNSManager {
    constructor() {
        this.apiKey = API_KEY;
        this.secretKey = SECRET_KEY;
        this.domain = DOMAIN;
    }

    async apiCall(endpoint, data = {}) {
        const url = `${API_BASE}${endpoint}`;
        const payload = {
            apikey: this.apiKey,
            secretapikey: this.secretKey,
            ...data
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.status === 'SUCCESS') {
                return result;
            } else {
                throw new Error(`API Error: ${result.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(colors.red(`❌ API call failed: ${error.message}`));
            throw error;
        }
    }

    async getCurrentRecords() {
        console.log(colors.blue(`🔍 Getting current DNS records for ${this.domain}...`));
        
        try {
            const result = await this.apiCall(`/dns/retrieve/${this.domain}`);
            
            if (result.records && result.records.length > 0) {
                console.log(colors.green(`✅ Found ${result.records.length} DNS records:`));
                console.log('');
                
                result.records.forEach((record, index) => {
                    console.log(colors.cyan(`Record ${index + 1}:`));
                    console.log(`  ID: ${record.id}`);
                    console.log(`  Type: ${record.type}`);
                    console.log(`  Name: ${record.name || '@'}`);
                    console.log(`  Content: ${record.content}`);
                    console.log(`  TTL: ${record.ttl}`);
                    console.log('');
                });
                
                return result.records;
            } else {
                console.log(colors.yellow(`⚠️ No DNS records found for ${this.domain}`));
                return [];
            }
        } catch (error) {
            console.error(colors.red(`❌ Failed to get DNS records: ${error.message}`));
            return null;
        }
    }

    async deleteRecord(recordId) {
        console.log(colors.yellow(`🗑️ Deleting record ID: ${recordId}`));
        
        try {
            await this.apiCall(`/dns/delete/${this.domain}/${recordId}`);
            console.log(colors.green(`✅ Successfully deleted record ${recordId}`));
            return true;
        } catch (error) {
            console.error(colors.red(`❌ Failed to delete record ${recordId}: ${error.message}`));
            return false;
        }
    }

    async createCNAME(name = '', content = 'aegntic.github.io', ttl = 600) {
        const recordName = name || '@';
        console.log(colors.blue(`📝 Creating CNAME record: ${recordName} → ${content}`));
        
        try {
            const data = {
                type: 'CNAME',
                content: content,
                ttl: ttl
            };
            
            if (name) {
                data.name = name;
            }
            
            const result = await this.apiCall(`/dns/create/${this.domain}`, data);
            console.log(colors.green(`✅ Successfully created CNAME record: ${recordName} → ${content}`));
            return result;
        } catch (error) {
            console.error(colors.red(`❌ Failed to create CNAME record: ${error.message}`));
            return null;
        }
    }

    async replaceWithCNAME() {
        console.log(colors.bold(`🔄 Replacing A records with CNAME for ${this.domain}`));
        console.log('='.repeat(60));
        
        // Get current records
        const records = await this.getCurrentRecords();
        if (!records) return false;
        
        // Find A records to delete (check for various apex domain formats)
        const aRecords = records.filter(record => 
            record.type === 'A' && 
            (record.name === '' || record.name === '@' || record.name === this.domain || record.name === `${this.domain}.`)
        );
        
        if (aRecords.length > 0) {
            console.log(colors.yellow(`🔍 Found ${aRecords.length} A records to replace`));
            
            // Delete existing A records
            for (const record of aRecords) {
                await this.deleteRecord(record.id);
                // Small delay between API calls
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            console.log(colors.blue(`ℹ️ No A records found to delete`));
        }
        
        // Create CNAME record
        const cnameResult = await this.createCNAME();
        
        if (cnameResult) {
            console.log('');
            console.log(colors.green(`🎉 Successfully replaced A records with CNAME!`));
            console.log(colors.cyan(`📍 ${this.domain} now points to aegntic.github.io`));
            console.log(colors.yellow(`⏰ DNS propagation may take 5-15 minutes`));
            return true;
        } else {
            console.log(colors.red(`❌ Failed to create CNAME record`));
            return false;
        }
    }

    async addSubdomain(subdomain, target = 'aegntic.github.io') {
        console.log(colors.blue(`➕ Adding subdomain: ${subdomain}.${this.domain} → ${target}`));
        return await this.createCNAME(subdomain, target);
    }

    async validateDNS() {
        console.log(colors.blue(`🔍 Validating DNS configuration...`));
        
        // Check if domain resolves
        try {
            const { spawn } = await import('child_process');
            return new Promise((resolve) => {
                const nslookup = spawn('nslookup', [this.domain]);
                let output = '';
                
                nslookup.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                nslookup.on('close', (code) => {
                    if (output.includes('github.io') || output.includes('185.199.')) {
                        console.log(colors.green(`✅ DNS resolves correctly`));
                        resolve(true);
                    } else {
                        console.log(colors.yellow(`⚠️ DNS may still be propagating`));
                        resolve(false);
                    }
                });
            });
        } catch (error) {
            console.log(colors.yellow(`⚠️ Could not validate DNS: ${error.message}`));
            return false;
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const manager = new PorkbunDNSManager();
    
    console.log(colors.bold(`\n🌐 Porkbun DNS Manager for ${DOMAIN}\n`));
    
    // Check if we have API keys
    if (!manager.secretKey) {
        console.log(colors.red(`❌ Missing PORKBUN_SECRET_KEY environment variable`));
        console.log(colors.yellow(`💡 Set it with: export PORKBUN_SECRET_KEY="your_secret_key"`));
        process.exit(1);
    }
    
    switch (command) {
        case 'list':
        case 'get':
            await manager.getCurrentRecords();
            break;
            
        case 'replace':
            await manager.replaceWithCNAME();
            break;
            
        case 'add':
            const subdomain = args[1];
            const target = args[2] || 'aegntic.github.io';
            if (!subdomain) {
                console.log(colors.red(`❌ Usage: node porkbun-dns-manager.js add <subdomain> [target]`));
                process.exit(1);
            }
            await manager.addSubdomain(subdomain, target);
            break;
            
        case 'validate':
            await manager.validateDNS();
            break;
            
        default:
            console.log(colors.cyan(`Available commands:`));
            console.log(`  list     - Show current DNS records`);
            console.log(`  replace  - Replace A records with CNAME`);
            console.log(`  add      - Add subdomain (e.g., add blog)`);
            console.log(`  validate - Check DNS resolution`);
            console.log('');
            console.log(colors.yellow(`Example: node porkbun-dns-manager.js list`));
            break;
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(colors.red(`💥 Fatal error: ${error.message}`));
        process.exit(1);
    });
}

export default PorkbunDNSManager;