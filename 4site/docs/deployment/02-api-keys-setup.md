# Prompt 02: API Keys and Services Setup

## Objective
Set up all required API keys and external services for production deployment.

## Services to Configure
1. Google Gemini AI API
2. GitHub OAuth Application
3. Supabase Project
4. Analytics & Monitoring
5. Email Service

## Implementation

### 1. Google Gemini AI Setup

Visit: https://makersuite.google.com/app/apikey

```javascript
// Configuration steps:
1. Create new API key for production
2. Set application restrictions:
   - HTTP referrers: https://4site.pro/*
   - API restrictions: Generative Language API only
3. Set quota limits:
   - 60 requests per minute
   - 1000 requests per day
4. Copy key to VITE_GEMINI_API_KEY

// Test the key:
const testGeminiKey = async () => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models?key=' + GEMINI_KEY
  );
  console.log('Gemini API Status:', response.status);
};
```

### 2. GitHub OAuth Application

Visit: https://github.com/settings/developers

```javascript
// Create OAuth App Configuration:
{
  "Application name": "4site.pro",
  "Homepage URL": "https://4site.pro",
  "Application description": "Transform any GitHub repository into a stunning website in seconds",
  "Authorization callback URL": "https://4site.pro/auth/github/callback",
  "Enable Device Flow": false,
  "Webhook URL": "https://api.4site.pro/webhooks/github",
  "Webhook secret": "generate-secure-secret-here"
}

// Permissions needed:
- read:user (Read user profile data)
- user:email (Access user email addresses)
- public_repo (Access public repositories)
- repo (Full control of private repositories)
- admin:repo_hook (Manage repository webhooks)
```

### 3. Supabase Production Setup

Visit: https://app.supabase.com

```sql
-- After creating production project, run these configurations:

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sites can collect leads" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = leads.site_id 
      AND sites.widget_enabled = true
    )
  );

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sites 
      WHERE sites.id = leads.site_id 
      AND sites.user_id = auth.uid()
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- Create Functions
CREATE OR REPLACE FUNCTION increment_view_count(site_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics (site_id, event_type, metadata)
  VALUES (site_id, 'page_view', jsonb_build_object(
    'timestamp', NOW(),
    'user_agent', current_setting('request.headers')::json->>'user-agent'
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Analytics & Monitoring Setup

#### Google Analytics 4
```javascript
// Visit: https://analytics.google.com
// Create new property for 4site.pro

// Add to index.html:
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Sentry Error Tracking
```javascript
// Visit: https://sentry.io
// Create new project: 4site-pro-frontend

// Installation:
npm install --save @sentry/react

// Initialize in main.tsx:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: "production",
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  }
});
```

### 5. Email Service Setup (SendGrid)

Visit: https://app.sendgrid.com

```javascript
// Create API Key with permissions:
- Mail Send (Full Access)
- Template Engine (Read Access)

// Domain Authentication:
1. Add domain: 4site.pro
2. Add DNS records:
   - CNAME: em1234.4site.pro -> sendgrid.net
   - CNAME: s1._domainkey.4site.pro -> s1.domainkey.u1234.wl.sendgrid.net
   - CNAME: s2._domainkey.4site.pro -> s2.domainkey.u1234.wl.sendgrid.net

// Create email templates:
- welcome_email (New user registration)
- lead_notification (New lead captured)
- site_created (Site generation success)
- weekly_analytics (Analytics summary)

// Server implementation:
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = async (email, name) => {
  const msg = {
    to: email,
    from: 'hello@4site.pro',
    subject: 'Welcome to 4site.pro!',
    templateId: 'd-welcome-template-id',
    dynamicTemplateData: {
      name: name,
      dashboard_url: 'https://4site.pro/dashboard'
    }
  };
  
  await sgMail.send(msg);
};
```

### 6. Additional Services Configuration

#### Cloudflare (CDN & Security)
```javascript
// DNS Configuration:
A     @       192.0.2.1    (Your server IP)
CNAME www     4site.pro
CNAME api     api-backend.railway.app

// Page Rules:
1. https://4site.pro/api/* - Cache Level: Bypass
2. https://4site.pro/assets/* - Cache Level: Standard, Edge Cache TTL: 1 month
3. https://4site.pro/* - Always Use HTTPS

// Security Settings:
- SSL: Full (strict)
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- Min TLS Version: 1.2
```

#### Vercel Analytics
```javascript
// Install:
npm install @vercel/analytics

// Add to App.tsx:
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

## API Key Security Checklist

```javascript
// Create script: scripts/check-api-keys.js

const chalk = require('chalk');

const apiKeyChecks = [
  {
    name: 'Gemini API',
    envVar: 'VITE_GEMINI_API_KEY',
    testUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    checkFn: async (key) => {
      const res = await fetch(`${testUrl}?key=${key}`);
      return res.ok;
    }
  },
  {
    name: 'GitHub OAuth',
    envVar: 'VITE_GITHUB_CLIENT_ID',
    checkFn: async (clientId) => {
      // Check if client ID format is valid
      return clientId.length === 20;
    }
  },
  {
    name: 'Supabase',
    envVar: 'VITE_SUPABASE_URL',
    checkFn: async (url) => {
      const res = await fetch(`${url}/rest/v1/`);
      return res.status === 401; // Expects auth required
    }
  }
];

async function validateAPIKeys() {
  console.log(chalk.blue('🔑 Validating API Keys...\n'));
  
  for (const check of apiKeyChecks) {
    const value = process.env[check.envVar];
    if (!value) {
      console.log(chalk.red(`✗ ${check.name}: Missing`));
      continue;
    }
    
    try {
      const isValid = await check.checkFn(value);
      if (isValid) {
        console.log(chalk.green(`✓ ${check.name}: Valid`));
      } else {
        console.log(chalk.yellow(`⚠ ${check.name}: Invalid or restricted`));
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${check.name}: Error - ${error.message}`));
    }
  }
}

validateAPIKeys();
```

## Expected Output Files
- `api-keys-checklist.md` - Complete checklist of all API keys
- `service-config-guide.json` - Configuration for each service
- `api-key-validator.js` - Script to validate all API keys
- `email-templates.html` - Email template examples

## Dependencies
- Requires: 01-production-env.md (environment structure)

## Validation
- Each API key should be tested individually
- Rate limits should be configured
- Domain restrictions should be applied
- Webhook endpoints should be verified

## Security Best Practices
1. Use different API keys for dev/staging/prod
2. Enable domain restrictions on all keys
3. Set up key rotation schedule (90 days)
4. Monitor API usage for anomalies
5. Use webhook secrets for GitHub
6. Enable 2FA on all service accounts

## Next Steps
- Configure production database (Prompt 03)
- Set up deployment pipelines (Prompts 04-05)