# Prompt 01: Production Environment Configuration

## Objective
Set up production environment variables and configuration files for secure deployment.

## Target Files
- Create: `.env.production`
- Create: `.env.production.local` (for secrets)
- Update: `vite.config.ts` (production settings)

## Implementation

### 1. Create Production Environment File
Create `.env.production`:

```bash
# Application Configuration
VITE_APP_NAME="4site.pro"
VITE_APP_URL="https://4site.pro"
VITE_API_URL="https://api.4site.pro"

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_LEAD_CAPTURE=true
VITE_ENABLE_GITHUB_AUTH=true

# Public Keys (safe to expose)
VITE_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
VITE_SENTRY_DSN="https://public@sentry.io/project"

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760
VITE_RATE_LIMIT_REQUESTS=100
VITE_RATE_LIMIT_WINDOW=900000

# Build Configuration
VITE_BUILD_VERSION="${BUILD_VERSION}"
VITE_BUILD_TIME="${BUILD_TIME}"
```

### 2. Create Secrets File
Create `.env.production.local` (git-ignored):

```bash
# Sensitive Production Credentials (NEVER commit this file)

# Supabase Production
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# Google Gemini AI
VITE_GEMINI_API_KEY="your-production-gemini-key"

# GitHub OAuth Production
VITE_GITHUB_CLIENT_ID="your-production-client-id"
GITHUB_CLIENT_SECRET="your-production-client-secret"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Email Service (SendGrid/Resend)
EMAIL_API_KEY="your-email-api-key"
EMAIL_FROM="hello@4site.pro"

# Monitoring & Analytics
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"

# Database
DATABASE_URL="postgresql://user:password@host:5432/4sitepro"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Cache
REDIS_URL="redis://user:password@host:6379"
REDIS_TTL=3600

# CDN & Storage
CLOUDFLARE_API_TOKEN="your-cloudflare-token"
S3_ACCESS_KEY="your-s3-access-key"
S3_SECRET_KEY="your-s3-secret-key"
S3_BUCKET="4sitepro-assets"
S3_REGION="us-east-1"
```

### 3. Update Vite Configuration
Update `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      // PWA Support
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: '4site.pro - GitHub to Website Generator',
          short_name: '4site.pro',
          theme_color: '#8B5CF6',
          background_color: '#0F172A',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      // Sentry Error Tracking
      mode === 'production' && sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: '4sitepro',
        project: 'frontend',
        release: {
          name: env.VITE_BUILD_VERSION
        }
      })
    ].filter(Boolean),
    
    build: {
      // Production optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'utils': ['axios', 'date-fns', 'uuid']
          }
        }
      },
      sourcemap: true, // For error tracking
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    
    server: {
      port: 5173,
      host: true
    },
    
    define: {
      __BUILD_VERSION__: JSON.stringify(env.VITE_BUILD_VERSION),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  };
});
```

### 4. Create Environment Validation Script
Create `scripts/validate-env.js`:

```javascript
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
    console.log(chalk.yellow('Create it from .env.example and add your production credentials.'));
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  let hasErrors = false;
  
  // Check required variables
  console.log(chalk.bold('Required Environment Variables:'));
  requiredEnvVars.forEach(varName => {
    if (envVars[varName] && envVars[varName] !== 'your-placeholder') {
      console.log(chalk.green(`✓ ${varName}`));
    } else {
      console.log(chalk.red(`✗ ${varName} - Missing or placeholder value`));
      hasErrors = true;
    }
  });
  
  // Check optional variables
  console.log(chalk.bold('\nOptional Environment Variables:'));
  optionalEnvVars.forEach(varName => {
    if (envVars[varName] && envVars[varName] !== 'your-placeholder') {
      console.log(chalk.green(`✓ ${varName}`));
    } else {
      console.log(chalk.yellow(`⚠ ${varName} - Not configured`));
    }
  });
  
  if (hasErrors) {
    console.log(chalk.red('\n❌ Environment validation failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ Environment validation passed!'));
  }
}

validateEnvironment();
```

## Expected Output Files
- `production-env-config.env` - Production environment template
- `production-env-secrets.env` - Secrets template (with placeholders)
- `vite-production-config.ts` - Updated Vite configuration
- `env-validation-script.js` - Environment validation script

## Dependencies
- None (first step in deployment)

## Validation
```bash
# Run validation script
node scripts/validate-env.js

# Test build with production env
npm run build -- --mode production
```

## Security Notes
- NEVER commit `.env.production.local`
- Use environment variables in CI/CD
- Rotate API keys regularly
- Use least-privilege principle for all keys
- Enable IP allowlisting where possible

## Next Steps
After environment is configured:
- Set up API keys with providers (Prompt 02)
- Configure production database (Prompt 03)
- Deploy frontend and backend (Prompts 04-05)