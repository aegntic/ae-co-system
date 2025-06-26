const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    return null;
  }
}

async function deployToVercel() {
  console.log('🚀 zkFlow.pro - Automated Vercel Deployment');
  console.log('========================================\n');
  
  // Check if we're in the right directory
  if (!fs.existsSync('website')) {
    console.log('❌ Error: website directory not found');
    console.log('   Please run this from the zkFlow.pro root directory');
    process.exit(1);
  }
  
  // Change to website directory
  process.chdir('website');
  
  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  // Build the project
  console.log('\n🔨 Building website for production...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!\n');
  } catch (error) {
    console.log('❌ Build failed. Please fix errors and try again.');
    process.exit(1);
  }
  
  // Check if Vercel CLI is installed
  const vercelInstalled = execCommand('vercel --version');
  if (!vercelInstalled) {
    console.log('📥 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  // Create vercel.json if it doesn't exist
  const vercelConfig = {
    "name": "zkflow-pro",
    "builds": [
      {
        "src": "package.json",
        "use": "@vercel/next"
      }
    ],
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" },
          { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
          { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
        ]
      }
    ]
  };
  
  if (!fs.existsSync('vercel.json')) {
    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ Created vercel.json configuration\n');
  }
  
  // Environment variables
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'https://your-project.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your-anon-key',
    'SUPABASE_SERVICE_ROLE_KEY': 'your-service-role-key',
    'STRIPE_SECRET_KEY': 'sk_test_your-stripe-secret',
    'STRIPE_WEBHOOK_SECRET': 'whsec_your-webhook-secret',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_your-stripe-publishable'
  };
  
  console.log('🔐 Setting up environment variables...\n');
  console.log('Please provide your API keys (or press Enter to skip for now):\n');
  
  for (const [key, defaultValue] of Object.entries(envVars)) {
    const value = await askQuestion(`${key} (${defaultValue}): `);
    if (value) {
      envVars[key] = value;
    }
  }
  
  // Deploy to Vercel with environment variables
  console.log('\n🚀 Deploying to Vercel...\n');
  
  // Build the Vercel deployment command
  let deployCommand = 'vercel --prod --yes';
  
  // Add environment variables
  for (const [key, value] of Object.entries(envVars)) {
    if (value && !value.includes('your-')) {
      deployCommand += ` -e ${key}="${value}"`;
    }
  }
  
  // Run deployment
  console.log('Running deployment command...');
  const deployment = spawn('sh', ['-c', deployCommand], { stdio: 'inherit' });
  
  deployment.on('close', async (code) => {
    if (code === 0) {
      console.log('\n✅ Deployment successful!\n');
      
      // Get deployment URL
      const deploymentUrl = execCommand('vercel ls --limit 1 --output json');
      if (deploymentUrl) {
        try {
          const deployInfo = JSON.parse(deploymentUrl);
          if (deployInfo && deployInfo[0]) {
            console.log(`🌐 Your site is live at: https://${deployInfo[0].url}`);
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
      
      // Add custom domain
      console.log('\n🌐 Adding custom domain zkflow.pro...');
      
      const addDomain = await askQuestion('\nDo you want to add zkflow.pro domain now? (y/n): ');
      if (addDomain.toLowerCase() === 'y') {
        execSync('vercel domains add zkflow.pro', { stdio: 'inherit' });
        execSync('vercel domains add www.zkflow.pro', { stdio: 'inherit' });
        
        console.log('\n✅ Domains added successfully!');
        console.log('\n📋 DNS Configuration Required:');
        console.log('   Please set these records in Porkbun:\n');
        console.log('   A Record:');
        console.log('   - Name: @ (root)');
        console.log('   - Value: 76.76.21.21\n');
        console.log('   CNAME Record:');
        console.log('   - Name: www');
        console.log('   - Value: cname.vercel-dns.com\n');
      }
      
      console.log('\n🎉 Deployment complete!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Configure DNS records in Porkbun');
      console.log('   2. Set up Supabase database');
      console.log('   3. Configure Stripe products');
      console.log('   4. Update environment variables in Vercel dashboard');
      console.log('   5. Test the live site\n');
      
    } else {
      console.log('\n❌ Deployment failed. Please check the error messages above.');
    }
    
    rl.close();
  });
}

// Run deployment
deployToVercel().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});