# UltraPlan Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Extension Deployment (Chrome Web Store)

```bash
# Build production extension
cd extension
npm run build

# Package for Chrome Web Store
zip -r ultraplan-extension.zip dist/

# Upload to Chrome Developer Dashboard
# https://chrome.google.com/webstore/devconsole
```

### 2. Webapp Deployment (Vercel/Netlify)

```bash
# Build production webapp
cd webapp
npm run build

# Deploy to Vercel
vercel deploy --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

### 3. Backend API (Railway/Render)

```bash
# Create Dockerfile
cat > Dockerfile << EOF
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Deploy to Railway
railway up

# Or deploy to Render
# Connect GitHub repo in Render dashboard
```

### 4. Database Setup (Supabase/Neon)

```sql
-- Create tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subscription JSONB NOT NULL DEFAULT '{"tier": "free"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  plan JSONB NOT NULL,
  marketplace BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 Environment Variables

```env
# API
VITE_API_URL=https://api.ultraplan.ai
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...

# AI
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## 📊 Monitoring & Analytics

1. **Vercel Analytics** - Frontend performance
2. **Sentry** - Error tracking
3. **PostHog** - Product analytics
4. **Stripe Dashboard** - Revenue metrics

## 🚨 Launch Checklist

- [ ] Extension approved on Chrome Web Store
- [ ] Webapp deployed with custom domain
- [ ] API endpoints tested and secured
- [ ] Database migrations complete
- [ ] Payment processing active
- [ ] Analytics tracking verified
- [ ] SSL certificates configured
- [ ] Backup strategy implemented
- [ ] Rate limiting enabled
- [ ] Error monitoring active

## 🎯 Go-Live Strategy

1. **Soft Launch**: Friends & family beta
2. **Product Hunt**: Schedule launch
3. **Hacker News**: Share "Show HN" post
4. **Twitter/X**: Developer community outreach
5. **Content Marketing**: Blog posts & tutorials

Ready to transform project planning! 🚀