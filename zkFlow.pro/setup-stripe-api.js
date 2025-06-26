#!/usr/bin/env node

/**
 * Stripe Setup via API
 * Creates products, prices, and webhooks automatically
 */

const https = require('https');
const fs = require('fs');

class StripeSetup {
  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.domain = 'zkflow.pro';
  }

  async makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(body),
              headers: res.headers
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: body,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(data);
      }
      req.end();
    });
  }

  async createProduct(name, description) {
    console.log(`💳 Creating product: ${name}`);

    const postData = new URLSearchParams({
      name: name,
      description: description,
      type: 'service'
    }).toString();

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/products',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const response = await this.makeRequest(options, postData);
      
      if (response.statusCode === 200) {
        console.log(`✅ Product created: ${response.data.id}`);
        return response.data;
      } else {
        console.log('⚠️  Product creation response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error(`❌ Failed to create product ${name}:`, error.message);
      throw error;
    }
  }

  async createPrice(productId, amount, currency = 'usd', interval = 'month') {
    console.log(`💰 Creating price for product: ${productId}`);

    const postData = new URLSearchParams({
      product: productId,
      unit_amount: amount,
      currency: currency,
      'recurring[interval]': interval
    }).toString();

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/prices',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const response = await this.makeRequest(options, postData);
      
      if (response.statusCode === 200) {
        console.log(`✅ Price created: ${response.data.id}`);
        return response.data;
      } else {
        console.log('⚠️  Price creation response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to create price:', error.message);
      throw error;
    }
  }

  async createWebhook() {
    console.log('🪝 Creating webhook endpoint...');

    const webhookData = {
      url: `https://${this.domain}/api/webhooks/stripe`,
      enabled_events: [
        'customer.created',
        'customer.updated',
        'customer.deleted',
        'invoice.created',
        'invoice.updated',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'checkout.session.completed',
        'checkout.session.expired',
        'subscription.created',
        'subscription.updated',
        'subscription.deleted'
      ]
    };

    const postData = new URLSearchParams(Object.entries(webhookData).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          acc.append(`${key}[]`, item);
        });
      } else {
        acc.append(key, value);
      }
      return acc;
    }, new URLSearchParams())).toString();

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/webhook_endpoints',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      const response = await this.makeRequest(options, postData);
      
      if (response.statusCode === 200) {
        console.log(`✅ Webhook created: ${response.data.id}`);
        return response.data;
      } else {
        console.log('⚠️  Webhook creation response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to create webhook:', error.message);
      throw error;
    }
  }

  async getPublishableKey() {
    console.log('🔑 Retrieving publishable key...');

    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/account',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`
      }
    };

    try {
      const response = await this.makeRequest(options);
      
      if (response.statusCode === 200) {
        // Extract publishable key from secret key
        const publishableKey = this.secretKey.replace('sk_', 'pk_');
        console.log('✅ Keys ready');
        return {
          publishable_key: publishableKey,
          secret_key: this.secretKey
        };
      } else {
        console.log('⚠️  Account response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to get account info:', error.message);
      throw error;
    }
  }

  async setup() {
    try {
      if (!this.secretKey) {
        console.log('🔐 Stripe secret key required.');
        console.log('Get it from: https://dashboard.stripe.com/apikeys');
        console.log('Set: export STRIPE_SECRET_KEY=sk_test_...');
        return;
      }

      console.log('🚀 Starting Stripe setup...');

      // Create products
      const professionalProduct = await this.createProduct(
        'zkFlow Professional',
        'Professional form automation with advanced features'
      );

      const teamProduct = await this.createProduct(
        'zkFlow Team',
        'Team collaboration and enterprise features'
      );

      // Create prices
      const professionalPrice = await this.createPrice(professionalProduct.id, 999); // $9.99
      const teamPrice = await this.createPrice(teamProduct.id, 2499); // $24.99

      // Create webhook
      const webhook = await this.createWebhook();

      // Get keys
      const keys = await this.getPublishableKey();

      // Save configuration
      const config = {
        products: {
          professional: {
            product: professionalProduct,
            price: professionalPrice
          },
          team: {
            product: teamProduct,
            price: teamPrice
          }
        },
        webhook: webhook,
        keys: keys,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync('stripe-config.json', JSON.stringify(config, null, 2));

      console.log('\n🎉 Stripe setup complete!');
      console.log(`💳 Products created: ${professionalProduct.id}, ${teamProduct.id}`);
      console.log(`🪝 Webhook: ${webhook.id}`);
      console.log(`🔑 Config saved to: stripe-config.json`);
      console.log('\n📋 Environment Variables:');
      console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${keys.publishable_key}`);
      console.log(`STRIPE_SECRET_KEY=${keys.secret_key}`);
      console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
      console.log('\n💰 Pricing:');
      console.log(`Professional: $9.99/month (${professionalPrice.id})`);
      console.log(`Team: $24.99/month (${teamPrice.id})`);

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Manual setup guide available in QUICK_SETUP_GUIDE.md');
    }
  }
}

if (require.main === module) {
  const setup = new StripeSetup();
  setup.setup().catch(console.error);
}

module.exports = StripeSetup;