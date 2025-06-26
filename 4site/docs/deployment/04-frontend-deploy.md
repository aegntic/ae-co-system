# Prompt 04: Frontend Deployment

## Objective
Build and deploy the React frontend to production with optimizations and monitoring.

## Deployment Options
1. Vercel (Recommended)
2. GitHub Pages
3. Cloudflare Pages
4. Netlify

## Implementation

### 1. Production Build Optimization

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "ANALYZE=true vite build",
    "build:prod": "NODE_ENV=production npm run build",
    "preview": "vite preview",
    "deploy:vercel": "vercel --prod",
    "deploy:gh-pages": "npm run build && gh-pages -d dist",
    "deploy:cf": "npm run build && wrangler pages publish dist"
  }
}
```

Create `vite.config.production.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', '@radix-ui/react-dialog'],
          'utils': ['axios', 'date-fns', 'uuid', 'clsx'],
          'ai': ['@google/generative-ai'],
          'analytics': ['@vercel/analytics', '@sentry/react'],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    cssCodeSplit: true,
    sourcemap: true,
    reportCompressedSize: true,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
});
```

### 2. Vercel Deployment (Primary)

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.4site.pro/$1"
    },
    {
      "src": "/assets/(.*)",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_APP_URL": "https://4site.pro",
    "VITE_API_URL": "https://api.4site.pro"
  }
}
```

Deployment script `scripts/deploy-vercel.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying 4site.pro to Vercel..."

# Load environment
source .env.production.local

# Build application
echo "📦 Building production bundle..."
NODE_ENV=production npm run build

# Run tests
echo "🧪 Running tests..."
npm test -- --run

# Check build size
echo "📊 Checking build size..."
du -sh dist

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel --prod --token=$VERCEL_TOKEN

# Set environment variables
echo "🔧 Setting production environment variables..."
vercel env pull
vercel env add VITE_SUPABASE_URL production < .env.production.local
vercel env add VITE_SUPABASE_ANON_KEY production < .env.production.local
vercel env add VITE_GEMINI_API_KEY production < .env.production.local
vercel env add VITE_GITHUB_CLIENT_ID production < .env.production.local

# Alias to custom domain
echo "🌐 Setting up custom domain..."
vercel alias set 4site.pro

echo "✅ Deployment complete!"
echo "🔗 Live at: https://4site.pro"
```

### 3. GitHub Pages Deployment (Alternative)

Create `.github/workflows/deploy-gh-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_APP_URL: https://4site.pro
          VITE_API_URL: https://api.4site.pro
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_GITHUB_CLIENT_ID: ${{ secrets.VITE_GITHUB_CLIENT_ID }}
          
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist
          
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
```

### 4. Cloudflare Pages Deployment

Create `wrangler.toml`:

```toml
name = "4site-pro"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[env.production]
vars = { ENVIRONMENT = "production" }

[[redirects]]
from = "/api/*"
to = "https://api.4site.pro/:splat"
status = 200

[[headers]]
for = "/assets/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
X-XSS-Protection = "1; mode=block"
```

### 5. Post-Deployment Verification

Create `scripts/verify-deployment.js`:

```javascript
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
```

### 6. CDN Configuration

Create `scripts/setup-cdn.js`:

```javascript
// Cloudflare CDN setup
const CF_ZONE_ID = process.env.CF_ZONE_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

const purgeCache = async () => {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ purge_everything: true })
  });
};

const setPageRules = async () => {
  const rules = [
    {
      targets: [{ target: 'url', constraint: { operator: 'matches', value: '4site.pro/assets/*' }}],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 2678400 } // 31 days
      ]
    }
  ];
  
  // Apply rules via CF API
};
```

## Expected Output Files
- `vercel-config.json` - Vercel deployment configuration
- `deploy-script.sh` - Automated deployment script
- `gh-pages-workflow.yml` - GitHub Actions workflow
- `verify-deployment.js` - Post-deployment verification
- `cdn-setup.js` - CDN configuration script

## Dependencies
- Requires: 01-production-env.md (environment variables)
- Requires: 02-api-keys-setup.md (Vercel token)

## Performance Targets
- Lighthouse Score: > 95
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle Size: < 500KB (gzipped)

## Security Headers
All deployments must include:
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security

## Monitoring
- Vercel Analytics for performance
- Sentry for error tracking
- Google Analytics for user behavior
- Custom performance API endpoint

## Next Steps
- Deploy backend API (Prompt 05)
- Configure CDN assets (Prompt 06)