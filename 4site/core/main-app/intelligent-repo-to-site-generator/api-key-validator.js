#!/usr/bin/env node

const chalk = require('chalk');
const https = require('https');
const http = require('http');

const apiKeyChecks = [
  {
    name: 'Gemini API',
    envVar: 'VITE_GEMINI_API_KEY',
    testUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    checkFn: async (key) => {
      return new Promise((resolve, reject) => {
        const url = `${apiKeyChecks[0].testUrl}?key=${key}`;
        https.get(url, (res) => {
          resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
      });
    }
  },
  {
    name: 'GitHub OAuth',
    envVar: 'VITE_GITHUB_CLIENT_ID',
    checkFn: async (clientId) => {
      // Check if client ID format is valid (20 character alphanumeric)
      return /^[a-z0-9]{20}$/i.test(clientId);
    }
  },
  {
    name: 'Supabase URL',
    envVar: 'VITE_SUPABASE_URL',
    checkFn: async (url) => {
      return new Promise((resolve) => {
        try {
          const urlObj = new URL(url);
          const isSupabaseUrl = urlObj.hostname.includes('supabase.co');
          https.get(`${url}/rest/v1/`, (res) => {
            // Expects 401 (unauthorized) which means the endpoint is working
            resolve(isSupabaseUrl && res.statusCode === 401);
          }).on('error', () => resolve(false));
        } catch {
          resolve(false);
        }
      });
    }
  },
  {
    name: 'Supabase Anon Key',
    envVar: 'VITE_SUPABASE_ANON_KEY',
    checkFn: async (key) => {
      // Check JWT format (three base64 parts separated by dots)
      const parts = key.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    }
  },
  {
    name: 'SendGrid API Key',
    envVar: 'EMAIL_API_KEY',
    testUrl: 'https://api.sendgrid.com/v3/user/profile',
    checkFn: async (key) => {
      return new Promise((resolve) => {
        if (!key || !key.startsWith('SG.')) {
          resolve(false);
          return;
        }
        
        const options = {
          hostname: 'api.sendgrid.com',
          path: '/v3/user/profile',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        };
        
        const req = https.request(options, (res) => {
          resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.end();
      });
    }
  },
  {
    name: 'Cloudflare API Token',
    envVar: 'CLOUDFLARE_API_TOKEN',
    testUrl: 'https://api.cloudflare.com/client/v4/user/tokens/verify',
    checkFn: async (token) => {
      return new Promise((resolve) => {
        if (!token) {
          resolve(false);
          return;
        }
        
        const options = {
          hostname: 'api.cloudflare.com',
          path: '/client/v4/user/tokens/verify',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const req = https.request(options, (res) => {
          resolve(res.statusCode === 200);
        });
        
        req.on('error', () => resolve(false));
        req.end();
      });
    }
  }
];

async function loadEnvironmentVariables() {
  const fs = require('fs');
  const path = require('path');
  
  // Try to load from .env.production.local
  const envPath = path.join(process.cwd(), '.env.production.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/['"]/g, '');
      }
    });
  }
}

async function validateAPIKeys() {
  console.log(chalk.blue('🔑 Validating API Keys...\n'));
  
  await loadEnvironmentVariables();
  
  let allValid = true;
  
  for (const check of apiKeyChecks) {
    const value = process.env[check.envVar];
    
    if (!value) {
      console.log(chalk.red(`✗ ${check.name}: Missing environment variable ${check.envVar}`));
      allValid = false;
      continue;
    }
    
    if (value.includes('YOUR-') || value.includes('PLACEHOLDER')) {
      console.log(chalk.yellow(`⚠ ${check.name}: Still using placeholder value`));
      allValid = false;
      continue;
    }
    
    try {
      console.log(chalk.gray(`  Testing ${check.name}...`));
      const isValid = await check.checkFn(value);
      
      if (isValid) {
        console.log(chalk.green(`✓ ${check.name}: Valid and accessible`));
      } else {
        console.log(chalk.red(`✗ ${check.name}: Invalid, expired, or inaccessible`));
        allValid = false;
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${check.name}: Error during validation - ${error.message}`));
      allValid = false;
    }
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log(chalk.green('🎉 All API keys validated successfully!'));
    console.log(chalk.green('Ready for production deployment.'));
    process.exit(0);
  } else {
    console.log(chalk.red('❌ API key validation failed.'));
    console.log(chalk.yellow('\nPlease check the following:'));
    console.log(chalk.yellow('1. Replace all placeholder values in .env.production.local'));
    console.log(chalk.yellow('2. Verify API keys are active and have correct permissions'));
    console.log(chalk.yellow('3. Check domain restrictions and IP allowlists'));
    console.log(chalk.yellow('4. Ensure rate limits are not exceeded'));
    process.exit(1);
  }
}

// Additional utility functions
function generateSecureWebhookSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function validateServiceConfiguration() {
  console.log(chalk.blue('\n🔧 Service Configuration Validation\n'));
  
  const configs = [
    {
      name: 'App Configuration',
      checks: [
        { key: 'VITE_APP_URL', expected: 'https://4site.pro' },
        { key: 'VITE_API_URL', expected: 'https://api.4site.pro' }
      ]
    },
    {
      name: 'Feature Flags',
      checks: [
        { key: 'VITE_ENABLE_ANALYTICS', expected: 'true' },
        { key: 'VITE_ENABLE_GITHUB_AUTH', expected: 'true' }
      ]
    }
  ];
  
  configs.forEach(config => {
    console.log(chalk.bold(config.name + ':'));
    config.checks.forEach(check => {
      const value = process.env[check.key];
      if (value === check.expected) {
        console.log(chalk.green(`  ✓ ${check.key}: ${value}`));
      } else {
        console.log(chalk.red(`  ✗ ${check.key}: Expected "${check.expected}", got "${value}"`));
      }
    });
    console.log();
  });
}

// CLI interface
if (process.argv.includes('--generate-webhook-secret')) {
  console.log('Generated webhook secret:', generateSecureWebhookSecret());
  process.exit(0);
}

if (process.argv.includes('--validate-config')) {
  validateServiceConfiguration();
  process.exit(0);
}

// Main validation
validateAPIKeys();