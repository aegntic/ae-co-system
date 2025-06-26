#!/usr/bin/env node

/**
 * zkFlow.pro Automated Setup using Puppeteer
 * Handles DNS, Supabase, Stripe, and Vercel configuration
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Simple console colors without chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`
};

class zkFlowAutomation {
  constructor() {
    this.browser = null;
    this.page = null;
    this.config = {
      domain: 'zkflow.pro',
      vercelTeam: 'aegntic',
      supabaseProject: 'zkflow-pro-prod',
      stripeAccount: 'aegntic',
    };
    this.credentials = {};
  }

  async loadCredentials() {
    try {
      const credPath = path.join(process.env.HOME, '.zkflow-credentials.json');
      const credData = await fs.readFile(credPath, 'utf8');
      this.credentials = JSON.parse(credData);
      console.log(colors.green('✅ Credentials loaded'));
    } catch (error) {
      console.log(colors.yellow('⚠️  No credentials file found. Manual intervention may be required.'));
      this.credentials = {};
    }
  }

  async saveCredentials() {
    try {
      const credPath = path.join(process.env.HOME, '.zkflow-credentials.json');
      await fs.writeFile(credPath, JSON.stringify(this.credentials, null, 2));
      console.log(colors.green('✅ Credentials saved'));
    } catch (error) {
      console.error(colors.red('❌ Failed to save credentials'), error.message);
    }
  }

  async initBrowser() {
    console.log(colors.blue('🚀 Launching browser...'));
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Set longer timeout for complex operations
    this.page.setDefaultTimeout(30000);
    
    console.log(colors.green('✅ Browser ready'));
  }

  async automateVercelDeployment() {
    console.log(colors.blue('☁️  Automating Vercel deployment...'));
    
    try {
      await this.page.goto('https://vercel.com/login', { waitUntil: 'networkidle2' });
      
      // Check if already logged in
      const isLoggedIn = await this.page.$('.geist-avatar') !== null;
      
      if (!isLoggedIn) {
        console.log(colors.yellow('🔐 Please log in to Vercel manually...'));
        await this.waitForUser('Please log in to Vercel and press Enter when ready...');
      }

      // Navigate to new project
      await this.page.goto('https://vercel.com/new', { waitUntil: 'networkidle2' });
      
      // Import from GitHub
      const githubButton = await this.page.waitForSelector('[data-testid=\"import-git-button\"]', { timeout: 10000 });
      await githubButton.click();
      
      // Search for zkflow-pro repository
      await this.page.waitForSelector('input[placeholder*=\"Search\"]', { timeout: 10000 });
      await this.page.type('input[placeholder*=\"Search\"]', 'zkflow-pro');
      
      // Wait for repository to appear and import
      await this.page.waitForTimeout(3000);
      const importButton = await this.page.$('button[data-testid=\"import-project-button\"]');
      if (importButton) {
        await importButton.click();
      }
      
      // Configure project settings
      await this.page.waitForSelector('input[name=\"projectName\"]', { timeout: 10000 });
      await this.page.$eval('input[name=\"projectName\"]', el => el.value = '');
      await this.page.type('input[name=\"projectName\"]', 'zkflow-pro');
      
      // Set framework to Next.js
      const frameworkSelect = await this.page.$('select[name=\"framework\"]');
      if (frameworkSelect) {
        await this.page.select('select[name=\"framework\"]', 'nextjs');
      }
      
      // Deploy
      const deployButton = await this.page.waitForSelector('button[data-testid=\"deploy-button\"]');
      await deployButton.click();
      
      console.log(colors.green('✅ Vercel deployment initiated'));
      
      // Wait for deployment to complete
      await this.page.waitForSelector('.deployment-list-item[data-state=\"READY\"]', { timeout: 300000 });
      
      // Get deployment URL
      const deploymentUrl = await this.page.$eval('a[data-testid=\"deployment-url\"]', el => el.href);
      console.log(colors.green(`✅ Deployed to: ${deploymentUrl}`));
      
      // Add custom domain
      await this.addCustomDomain();
      
      return deploymentUrl;
      
    } catch (error) {
      console.error(colors.red('❌ Vercel deployment failed:'), error.message);
      throw error;
    }
  }

  async addCustomDomain() {
    console.log(colors.blue('🌐 Adding custom domain...'));
    
    try {
      // Navigate to domains settings
      await this.page.goto(`https://vercel.com/${this.config.vercelTeam}/zkflow-pro/settings/domains`);
      
      // Add domain
      const addDomainButton = await this.page.waitForSelector('button[data-testid=\"add-domain-button\"]');
      await addDomainButton.click();
      
      // Enter domain name
      await this.page.waitForSelector('input[placeholder=\"example.com\"]');
      await this.page.type('input[placeholder=\"example.com\"]', this.config.domain);
      
      // Submit
      const submitButton = await this.page.$('button[type=\"submit\"]');
      await submitButton.click();
      
      // Also add www subdomain
      await this.page.waitForTimeout(2000);
      const addMoreButton = await this.page.$('button[data-testid=\"add-domain-button\"]');
      if (addMoreButton) {
        await addMoreButton.click();
        await this.page.waitForSelector('input[placeholder=\"example.com\"]');
        await this.page.type('input[placeholder=\"example.com\"]', `www.${this.config.domain}`);
        const submitWwwButton = await this.page.$('button[type=\"submit\"]');
        await submitWwwButton.click();
      }
      
      console.log(colors.green('✅ Custom domains added'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to add custom domain:'), error.message);
    }
  }

  async automateSupabaseSetup() {
    console.log(colors.blue('🗄️  Automating Supabase setup...'));
    
    try {
      await this.page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'networkidle2' });
      
      // Check if already logged in
      const isLoggedIn = await this.page.$('[data-testid=\"dashboard-nav\"]') !== null;
      
      if (!isLoggedIn) {
        console.log(colors.yellow('🔐 Please log in to Supabase manually...'));
        await this.waitForUser('Please log in to Supabase and press Enter when ready...');
      }

      // Create new project
      await this.page.goto('https://supabase.com/dashboard/new/zkflow-pro-prod');
      
      // Fill project details
      await this.page.waitForSelector('input[name=\"name\"]', { timeout: 10000 });
      await this.page.type('input[name=\"name\"]', this.config.supabaseProject);
      
      // Set strong password
      const password = this.generateStrongPassword();
      await this.page.type('input[name=\"password\"]', password);
      
      // Select region (closest to target users)
      const regionSelect = await this.page.$('select[name=\"region\"]');
      if (regionSelect) {
        await this.page.select('select[name=\"region\"]', 'us-east-1');
      }
      
      // Create project
      const createButton = await this.page.waitForSelector('button[type=\"submit\"]');
      await createButton.click();
      
      console.log(colors.green('✅ Supabase project created'));
      
      // Wait for project to be ready
      await this.page.waitForSelector('.project-status[data-status=\"ACTIVE_HEALTHY\"]', { timeout: 180000 });
      
      // Setup database schema
      await this.setupSupabaseSchema();
      
      // Get API keys
      await this.getSupabaseKeys();
      
    } catch (error) {
      console.error(colors.red('❌ Supabase setup failed:'), error.message);
      throw error;
    }
  }

  async setupSupabaseSchema() {
    console.log(colors.blue('📊 Setting up database schema...'));
    
    try {
      // Navigate to SQL Editor
      await this.page.goto(`https://supabase.com/dashboard/project/${this.config.supabaseProject}/sql/new`);
      
      // Read schema file
      const schemaPath = path.join(__dirname, 'supabase-schema.sql');
      const schemaSQL = await fs.readFile(schemaPath, 'utf8');
      
      // Paste schema into editor
      await this.page.waitForSelector('.monaco-editor textarea', { timeout: 10000 });
      await this.page.click('.monaco-editor textarea');
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('a');
      await this.page.keyboard.up('Control');
      await this.page.type('.monaco-editor textarea', schemaSQL);
      
      // Execute schema
      const runButton = await this.page.waitForSelector('button[data-testid=\"run-sql-button\"]');
      await runButton.click();
      
      // Wait for execution to complete
      await this.page.waitForSelector('.sql-result-success', { timeout: 30000 });
      
      console.log(colors.green('✅ Database schema created'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to setup schema:'), error.message);
    }
  }

  async getSupabaseKeys() {
    console.log(colors.blue('🔑 Retrieving Supabase API keys...'));
    
    try {
      // Navigate to API settings
      await this.page.goto(`https://supabase.com/dashboard/project/${this.config.supabaseProject}/settings/api`);
      
      // Get project URL
      const projectUrl = await this.page.$eval('[data-testid=\"project-url-value\"]', el => el.textContent);
      
      // Get anon key
      const anonKey = await this.page.$eval('[data-testid=\"anon-key-value\"]', el => el.textContent);
      
      // Get service role key
      const serviceKey = await this.page.$eval('[data-testid=\"service-role-key-value\"]', el => el.textContent);
      
      this.credentials.supabase = {
        url: projectUrl,
        anonKey,
        serviceKey
      };
      
      console.log(colors.green('✅ Supabase keys retrieved'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to retrieve Supabase keys:'), error.message);
    }
  }

  async automateStripeSetup() {
    console.log(colors.blue('💳 Automating Stripe setup...'));
    
    try {
      await this.page.goto('https://dashboard.stripe.com/login', { waitUntil: 'networkidle2' });
      
      // Check if already logged in
      const isLoggedIn = await this.page.$('[data-test-id=\"sidebar\"]') !== null;
      
      if (!isLoggedIn) {
        console.log(colors.yellow('🔐 Please log in to Stripe manually...'));
        await this.waitForUser('Please log in to Stripe and press Enter when ready...');
      }

      // Create products
      await this.createStripeProducts();
      
      // Setup webhooks
      await this.setupStripeWebhooks();
      
      // Get API keys
      await this.getStripeKeys();
      
    } catch (error) {
      console.error(colors.red('❌ Stripe setup failed:'), error.message);
      throw error;
    }
  }

  async createStripeProducts() {
    console.log(colors.blue('🛍️  Creating Stripe products...'));
    
    try {
      // Navigate to products
      await this.page.goto('https://dashboard.stripe.com/products');
      
      // Create Professional product
      await this.createStripeProduct('zkFlow Professional', 999, 'monthly_professional');
      
      // Create Team product  
      await this.createStripeProduct('zkFlow Team', 2499, 'monthly_team');
      
      console.log(colors.green('✅ Stripe products created'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to create Stripe products:'), error.message);
    }
  }

  async createStripeProduct(name, price, priceId) {
    // Click Add Product
    const addProductButton = await this.page.$('a[data-test-id=\"add-product\"]');
    if (addProductButton) {
      await addProductButton.click();
    } else {
      // Alternative selector
      await this.page.click('button:contains(\"Add product\")');
    }
    
    // Fill product details
    await this.page.waitForSelector('input[name=\"name\"]');
    await this.page.type('input[name=\"name\"]', name);
    
    // Set recurring price
    await this.page.click('input[value=\"recurring\"]');
    
    // Enter price (in cents)
    await this.page.type('input[name=\"unit_amount\"]', price.toString());
    
    // Set currency to USD
    const currencySelect = await this.page.$('select[name=\"currency\"]');
    if (currencySelect) {
      await this.page.select('select[name=\"currency\"]', 'usd');
    }
    
    // Set billing period to monthly
    const intervalSelect = await this.page.$('select[name=\"interval\"]');
    if (intervalSelect) {
      await this.page.select('select[name=\"interval\"]', 'month');
    }
    
    // Save product
    const saveButton = await this.page.waitForSelector('button[type=\"submit\"]');
    await saveButton.click();
    
    await this.page.waitForTimeout(3000);
  }

  async setupStripeWebhooks() {
    console.log(colors.blue('🪝 Setting up Stripe webhooks...'));
    
    try {
      // Navigate to webhooks
      await this.page.goto('https://dashboard.stripe.com/webhooks');
      
      // Add endpoint
      const addEndpointButton = await this.page.$('button[data-test-id=\"add-endpoint\"]');
      if (addEndpointButton) {
        await addEndpointButton.click();
      }
      
      // Enter endpoint URL
      await this.page.waitForSelector('input[name=\"url\"]');
      await this.page.type('input[name=\"url\"]', `https://${this.config.domain}/api/webhooks/stripe`);
      
      // Select events
      const eventsButton = await this.page.waitForSelector('button[data-test-id=\"select-events\"]');
      await eventsButton.click();
      
      // Select all customer and subscription events
      await this.page.click('input[value=\"customer.*\"]');
      await this.page.click('input[value=\"invoice.*\"]');
      await this.page.click('input[value=\"checkout.*\"]');
      
      // Save webhook
      const saveWebhookButton = await this.page.waitForSelector('button[type=\"submit\"]');
      await saveWebhookButton.click();
      
      console.log(colors.green('✅ Stripe webhooks configured'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to setup webhooks:'), error.message);
    }
  }

  async getStripeKeys() {
    console.log(colors.blue('🔑 Retrieving Stripe API keys...'));
    
    try {
      // Navigate to API keys
      await this.page.goto('https://dashboard.stripe.com/apikeys');
      
      // Get publishable key
      const publishableKey = await this.page.$eval('[data-test-id=\"publishable-key\"] input', el => el.value);
      
      // Reveal secret key
      const revealButton = await this.page.$('[data-test-id=\"secret-key\"] button');
      if (revealButton) {
        await revealButton.click();
        await this.page.waitForTimeout(1000);
      }
      
      const secretKey = await this.page.$eval('[data-test-id=\"secret-key\"] input', el => el.value);
      
      this.credentials.stripe = {
        publishableKey,
        secretKey
      };
      
      console.log(colors.green('✅ Stripe keys retrieved'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to retrieve Stripe keys:'), error.message);
    }
  }

  async configureEnvironmentVariables() {
    console.log(colors.blue('⚙️  Configuring environment variables in Vercel...'));
    
    try {
      // Navigate to environment variables
      await this.page.goto(`https://vercel.com/${this.config.vercelTeam}/zkflow-pro/settings/environment-variables`);
      
      const envVars = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', value: this.credentials.supabase?.url },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: this.credentials.supabase?.anonKey },
        { name: 'SUPABASE_SERVICE_KEY', value: this.credentials.supabase?.serviceKey },
        { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: this.credentials.stripe?.publishableKey },
        { name: 'STRIPE_SECRET_KEY', value: this.credentials.stripe?.secretKey },
        { name: 'NEXT_PUBLIC_APP_URL', value: `https://${this.config.domain}` },
        { name: 'NEXT_PUBLIC_FREE_TRIAL_DAYS', value: '7' }
      ];
      
      for (const envVar of envVars) {
        if (envVar.value) {
          await this.addEnvironmentVariable(envVar.name, envVar.value);
          await this.page.waitForTimeout(1000);
        }
      }
      
      console.log(colors.green('✅ Environment variables configured'));
      
    } catch (error) {
      console.error(colors.red('❌ Failed to configure environment variables:'), error.message);
    }
  }

  async addEnvironmentVariable(name, value) {
    try {
      // Click Add button
      const addButton = await this.page.$('button[data-testid=\"add-env-var-button\"]');
      if (addButton) {
        await addButton.click();
      }
      
      // Enter name
      await this.page.waitForSelector('input[name=\"name\"]');
      await this.page.type('input[name=\"name\"]', name);
      
      // Enter value
      await this.page.type('input[name=\"value\"]', value);
      
      // Select all environments
      await this.page.click('input[value=\"production\"]');
      await this.page.click('input[value=\"preview\"]');
      await this.page.click('input[value=\"development\"]');
      
      // Save
      const saveButton = await this.page.waitForSelector('button[type=\"submit\"]');
      await saveButton.click();
      
      await this.page.waitForTimeout(2000);
      
    } catch (error) {
      console.error(colors.red(`❌ Failed to add ${name}:`), error.message);
    }
  }

  async waitForUser(message) {
    console.log(colors.yellow(message));
    process.stdin.setRawMode(true);
    return new Promise(resolve => {
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
  }

  generateStrongPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async generateSetupSummary() {
    console.log(colors.blue('\n📋 Setup Summary'));
    console.log(colors.green('================'));
    
    console.log(colors.white('Domain: '), colors.cyan(this.config.domain));
    console.log(colors.white('Supabase URL: '), colors.cyan(this.credentials.supabase?.url || 'Not configured'));
    console.log(colors.white('Stripe Account: '), colors.cyan(this.credentials.stripe?.publishableKey ? 'Configured' : 'Not configured'));
    console.log(colors.white('Environment Variables: '), colors.cyan('Configured in Vercel'));
    
    // Save summary to file
    const summary = {
      domain: this.config.domain,
      timestamp: new Date().toISOString(),
      services: {
        vercel: 'Deployed',
        supabase: this.credentials.supabase ? 'Configured' : 'Failed',
        stripe: this.credentials.stripe ? 'Configured' : 'Failed'
      },
      nextSteps: [
        'Update DNS records in Porkbun',
        'Test payment flow',
        'Submit Chrome extension to store',
        'Launch marketing campaign'
      ]
    };
    
    await fs.writeFile('./setup-summary.json', JSON.stringify(summary, null, 2));
    console.log(colors.green('✅ Setup summary saved to setup-summary.json'));
  }

  async run() {
    try {
      await this.loadCredentials();
      await this.initBrowser();
      
      console.log(colors.blue('\n🚀 Starting zkFlow.pro automated setup...\n'));
      
      // Run all setup tasks
      await this.automateVercelDeployment();
      await this.automateSupabaseSetup();
      await this.automateStripeSetup();
      await this.configureEnvironmentVariables();
      
      // Save credentials
      await this.saveCredentials();
      
      // Generate summary
      await this.generateSetupSummary();
      
      console.log(colors.green('\n🎉 zkFlow.pro setup completed successfully!'));
      console.log(colors.cyan('Next: Configure DNS in Porkbun and test the setup'));
      
    } catch (error) {
      console.error(colors.red('\n❌ Setup failed:'), error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// CLI interface
async function main() {
  const automation = new zkFlowAutomation();
  await automation.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = zkFlowAutomation;