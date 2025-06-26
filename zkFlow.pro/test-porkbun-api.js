#!/usr/bin/env node

const https = require('https');

// Test different API endpoints and configurations
async function testAPI(apiKey, secretKey) {
  const postData = JSON.stringify({
    apikey: apiKey,
    secretapikey: secretKey
  });

  const options = {
    hostname: 'api.porkbun.com',
    port: 443,
    path: '/api/json/v3/ping',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing Porkbun API credentials...\n');
  
  // Test with the credentials from .env
  console.log('Testing credentials from .env file:');
  await testAPI(
    'pk1_ea88ead2b57e5cd7589676eaf2fde771f63298136980ab1fc76de082299e2c7c',
    'sk1_1941858c3e7be7e75ae46727c26162731166589c6c295d9d070cc05685bbff5b'
  );
  
  console.log('\n⚠️  If you see "Invalid API key" error, you need to:');
  console.log('1. Log in to your Porkbun account');
  console.log('2. Go to https://porkbun.com/account/api');
  console.log('3. Enable API access for your account');
  console.log('4. Create new API credentials');
  console.log('5. Make sure API access is enabled for zkflow.pro domain\n');
  
  console.log('For now, I\'ll deploy the website first and you can configure DNS manually later.');
}

main();