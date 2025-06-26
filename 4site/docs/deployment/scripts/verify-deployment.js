const axios = require('axios');
const chalk = require('chalk');

const PRODUCTION_URL = 'https://4site.pro';
const API_URL = 'https://api.4site.pro';

async function verifyDeployment() {
  console.log(chalk.blue('🔍 Verifying production deployment...\n'));
  
  const checks = [
    {
      name: 'Frontend Health',
      url: PRODUCTION_URL,
      expectedStatus: 200,
      checkContent: (data) => data.includes('4site.pro')
    },
    {
      name: 'API Health',
      url: `${API_URL}/health`,
      expectedStatus: 200,
      checkContent: (data) => data.status === 'healthy'
    },
    {
      name: 'Static Assets',
      url: `${PRODUCTION_URL}/assets/logo.svg`,
      expectedStatus: 200
    },
    {
      name: 'Service Worker',
      url: `${PRODUCTION_URL}/sw.js`,
      expectedStatus: 200
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const response = await axios.get(check.url);
      
      if (response.status === check.expectedStatus) {
        if (!check.checkContent || check.checkContent(response.data)) {
          console.log(chalk.green(`✓ ${check.name}: OK`));
        } else {
          console.log(chalk.yellow(`⚠ ${check.name}: Content mismatch`));
          allPassed = false;
        }
      } else {
        console.log(chalk.red(`✗ ${check.name}: Status ${response.status}`));
        allPassed = false;
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${check.name}: ${error.message}`));
      allPassed = false;
    }
  }
  
  // Performance check
  console.log(chalk.blue('\n📊 Performance Metrics:'));
  const perfResponse = await axios.get(`${PRODUCTION_URL}/api/performance`);
  console.log(`Load Time: ${perfResponse.data.loadTime}ms`);
  console.log(`Bundle Size: ${perfResponse.data.bundleSize}`);
  
  if (allPassed) {
    console.log(chalk.green('\n✅ All deployment checks passed!'));
  } else {
    console.log(chalk.red('\n❌ Some deployment checks failed!'));
    process.exit(1);
  }
}

verifyDeployment();