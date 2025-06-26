#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
];

const optionalEnvVars = [
  'VITE_GOOGLE_ANALYTICS_ID',
  'VITE_SENTRY_DSN',
  'EMAIL_API_KEY',
  'REDIS_URL'
];

function validateEnvironment() {
  console.log(chalk.blue('🔍 Validating production environment...\n'));
  
  const envPath = path.join(process.cwd(), '.env.production.local');
  
  if (!fs.existsSync(envPath)) {
    console.error(chalk.red('❌ .env.production.local not found!'));
    console.log(chalk.yellow('Create it from production-env-secrets.env and add your production credentials.'));
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/['"]/g, '');
    }
  });
  
  let hasErrors = false;
  
  // Check required variables
  console.log(chalk.bold('Required Environment Variables:'));
  requiredEnvVars.forEach(varName => {
    if (envVars[varName] && !envVars[varName].includes('YOUR-') && !envVars[varName].includes('PLACEHOLDER')) {
      console.log(chalk.green(`✓ ${varName}`));
    } else {
      console.log(chalk.red(`✗ ${varName} - Missing or placeholder value`));
      hasErrors = true;
    }
  });
  
  // Check optional variables
  console.log(chalk.bold('\nOptional Environment Variables:'));
  optionalEnvVars.forEach(varName => {
    if (envVars[varName] && !envVars[varName].includes('YOUR-') && !envVars[varName].includes('PLACEHOLDER')) {
      console.log(chalk.green(`✓ ${varName}`));
    } else {
      console.log(chalk.yellow(`⚠ ${varName} - Not configured`));
    }
  });
  
  if (hasErrors) {
    console.log(chalk.red('\n❌ Environment validation failed!'));
    console.log(chalk.yellow('\nPlease replace all placeholder values in .env.production.local'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ Environment validation passed!'));
  }
}

validateEnvironment();