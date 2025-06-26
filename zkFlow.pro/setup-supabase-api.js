#!/usr/bin/env node

/**
 * Supabase Project Setup via API
 * Creates project and runs schema automatically
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SupabaseSetup {
  constructor() {
    this.accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    this.orgId = process.env.SUPABASE_ORG_ID || 'personal';
    this.projectName = 'zkflow-pro-prod';
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
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async createProject() {
    console.log('🗄️  Creating Supabase project...');

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: '/v1/projects',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const projectData = {
      name: this.projectName,
      organization_id: this.orgId,
      plan: 'free',
      region: 'us-east-1',
      db_pass: this.generatePassword()
    };

    try {
      const response = await this.makeRequest(options, projectData);
      
      if (response.statusCode === 201) {
        console.log('✅ Supabase project created successfully');
        this.projectRef = response.data.ref;
        this.dbPassword = projectData.db_pass;
        return response.data;
      } else {
        console.log('⚠️  Project may already exist or other issue:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to create project:', error.message);
      throw error;
    }
  }

  async waitForProject(ref) {
    console.log('⏳ Waiting for project to be ready...');
    
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      const options = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${ref}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      };

      try {
        const response = await this.makeRequest(options);
        
        if (response.data.status === 'ACTIVE_HEALTHY') {
          console.log('✅ Project is ready!');
          return response.data;
        }
        
        console.log(`⏳ Project status: ${response.data.status}... waiting`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } catch (error) {
        console.log('⏳ Still setting up...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
    }

    throw new Error('Project setup timed out');
  }

  async runSchema(ref) {
    console.log('📊 Running database schema...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${ref}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const queryData = {
      query: schema
    };

    try {
      const response = await this.makeRequest(options, queryData);
      
      if (response.statusCode === 200) {
        console.log('✅ Schema executed successfully');
        return response.data;
      } else {
        console.log('⚠️  Schema execution response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to run schema:', error.message);
      throw error;
    }
  }

  async getAPIKeys(ref) {
    console.log('🔑 Retrieving API keys...');

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${ref}/api-keys`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    };

    try {
      const response = await this.makeRequest(options);
      
      if (response.statusCode === 200) {
        console.log('✅ API keys retrieved');
        return response.data;
      } else {
        console.log('⚠️  API keys response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to get API keys:', error.message);
      throw error;
    }
  }

  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async setup() {
    try {
      if (!this.accessToken) {
        console.log('🔐 Supabase access token required.');
        console.log('Get it from: https://supabase.com/dashboard/account/tokens');
        console.log('Set: export SUPABASE_ACCESS_TOKEN=your_token');
        return;
      }

      console.log('🚀 Starting Supabase setup...');
      
      // Create project
      const project = await this.createProject();
      const ref = project.ref || this.projectRef;
      
      if (!ref) {
        console.error('❌ No project reference available');
        return;
      }

      // Wait for project to be ready
      const readyProject = await this.waitForProject(ref);
      
      // Run schema
      await this.runSchema(ref);
      
      // Get API keys
      const apiKeys = await this.getAPIKeys(ref);

      // Save configuration
      const config = {
        project: readyProject,
        apiKeys: apiKeys,
        url: `https://${ref}.supabase.co`,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync('supabase-config.json', JSON.stringify(config, null, 2));
      
      console.log('\n🎉 Supabase setup complete!');
      console.log(`📊 Project URL: https://${ref}.supabase.co`);
      console.log(`🔑 Config saved to: supabase-config.json`);
      console.log('\n📋 Environment Variables:');
      console.log(`NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`);
      
      if (apiKeys && apiKeys.length > 0) {
        const anonKey = apiKeys.find(key => key.name === 'anon');
        const serviceKey = apiKeys.find(key => key.name === 'service_role');
        
        if (anonKey) console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey.api_key}`);
        if (serviceKey) console.log(`SUPABASE_SERVICE_KEY=${serviceKey.api_key}`);
      }

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\n🔧 Manual setup guide available in QUICK_SETUP_GUIDE.md');
    }
  }
}

if (require.main === module) {
  const setup = new SupabaseSetup();
  setup.setup().catch(console.error);
}

module.exports = SupabaseSetup;