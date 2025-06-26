#!/usr/bin/env node

const https = require('https');

// Porkbun API credentials from .env
const API_KEY = 'pk1_ea88ead2b57e5cd7589676eaf2fde771f63298136980ab1fc76de082299e2c7c';
const SECRET_KEY = 'sk1_1941858c3e7be7e75ae46727c26162731166589c6c295d9d070cc05685bbff5b';
const DOMAIN = 'zkflow.pro';

// DNS records for Vercel deployment
const DNS_RECORDS = [
  {
    type: 'A',
    name: '',
    content: '76.76.21.21',
    ttl: '600'
  },
  {
    type: 'CNAME',
    name: 'www',
    content: 'cname.vercel-dns.com',
    ttl: '600'
  }
];

// Porkbun API helper
async function porkbunAPI(endpoint, data = {}) {
  const postData = JSON.stringify({
    ...data,
    apikey: API_KEY,
    secretapikey: SECRET_KEY
  });

  const options = {
    hostname: 'api.porkbun.com',
    port: 443,
    path: `/api/json/v3/${endpoint}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'SUCCESS') {
            resolve(json);
          } else {
            reject(new Error(json.message || 'API request failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function configureDNS() {
  console.log('🌐 Configuring DNS for zkflow.pro');
  console.log('=====================================\n');

  try {
    // Test API connection
    console.log('🔐 Testing Porkbun API connection...');
    await porkbunAPI('ping');
    console.log('✅ API connection successful!\n');

    // Get current DNS records
    console.log('📋 Getting current DNS records...');
    const currentRecords = await porkbunAPI(`dns/retrieve/${DOMAIN}`);
    console.log(`Found ${currentRecords.records ? currentRecords.records.length : 0} existing records\n`);

    // Delete existing A and CNAME records for root and www
    if (currentRecords.records && currentRecords.records.length > 0) {
      console.log('🗑️  Cleaning up existing records...');
      for (const record of currentRecords.records) {
        if ((record.type === 'A' && record.name === DOMAIN) ||
            (record.type === 'CNAME' && record.name === `www.${DOMAIN}`)) {
          console.log(`  Deleting ${record.type} record: ${record.name}`);
          await porkbunAPI(`dns/delete/${DOMAIN}/${record.id}`);
        }
      }
      console.log('✅ Cleanup complete\n');
    }

    // Add new DNS records
    console.log('➕ Adding new DNS records for Vercel...');
    for (const record of DNS_RECORDS) {
      console.log(`  Creating ${record.type} record: ${record.name || '@'} → ${record.content}`);
      
      await porkbunAPI(`dns/create/${DOMAIN}`, {
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl
      });
      
      console.log(`  ✅ ${record.type} record created`);
    }

    console.log('\n✅ DNS configuration complete!');
    console.log('\n📋 Summary:');
    console.log('  - A record: @ → 76.76.21.21');
    console.log('  - CNAME record: www → cname.vercel-dns.com');
    console.log('\n⏱️  DNS propagation may take up to 48 hours');
    console.log('🌐 Your site will be accessible at:');
    console.log('  - https://zkflow.pro');
    console.log('  - https://www.zkflow.pro\n');

  } catch (error) {
    console.error('❌ Error configuring DNS:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n⚠️  API key issue detected.');
      console.log('Please verify your Porkbun API credentials.');
    }
    
    process.exit(1);
  }
}

// Run the configuration
configureDNS();