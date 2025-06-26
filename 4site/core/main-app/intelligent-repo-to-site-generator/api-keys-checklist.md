# API Keys and Services Configuration Checklist

## 🔑 Required API Keys and Services

### 1. Google Gemini AI API
- **Service**: Google AI Studio / MakerSuite
- **URL**: https://makersuite.google.com/app/apikey
- **Environment Variable**: `VITE_GEMINI_API_KEY`
- **Configuration**:
  - Application restrictions: HTTP referrers `https://4site.pro/*`
  - API restrictions: Generative Language API only
  - Quota limits: 60 requests/minute, 1000 requests/day
- **Test Command**: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"`

### 2. GitHub OAuth Application
- **Service**: GitHub Developer Settings
- **URL**: https://github.com/settings/developers
- **Environment Variables**: 
  - `VITE_GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GITHUB_WEBHOOK_SECRET`
- **Configuration**:
  - Application name: "4site.pro"
  - Homepage URL: "https://4site.pro"
  - Authorization callback URL: "https://4site.pro/auth/github/callback"
  - Webhook URL: "https://api.4site.pro/webhooks/github"
- **Permissions**: read:user, user:email, public_repo, repo, admin:repo_hook

### 3. Supabase Project
- **Service**: Supabase Cloud
- **URL**: https://app.supabase.com
- **Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`
- **Setup Steps**:
  1. Create new production project
  2. Configure database schema
  3. Enable Row Level Security
  4. Set up authentication providers

### 4. Email Service (SendGrid)
- **Service**: SendGrid
- **URL**: https://app.sendgrid.com
- **Environment Variables**:
  - `EMAIL_API_KEY`
  - `EMAIL_FROM="hello@4site.pro"`
- **Configuration**:
  - API Key permissions: Mail Send (Full Access)
  - Domain authentication for 4site.pro
  - Email templates: welcome, lead_notification, site_created

### 5. Analytics & Monitoring

#### Google Analytics 4
- **Service**: Google Analytics
- **URL**: https://analytics.google.com
- **Environment Variable**: `VITE_GOOGLE_ANALYTICS_ID`
- **Setup**: Create property for 4site.pro

#### Sentry Error Tracking
- **Service**: Sentry
- **URL**: https://sentry.io
- **Environment Variables**:
  - `VITE_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
- **Configuration**:
  - Create project: 4site-pro-frontend
  - Enable performance monitoring
  - Set up source maps

#### Vercel Analytics
- **Service**: Vercel
- **Environment Variable**: `VERCEL_ANALYTICS_ID`
- **Setup**: Enable analytics for domain

### 6. CDN & Infrastructure

#### Cloudflare
- **Service**: Cloudflare
- **Environment Variable**: `CLOUDFLARE_API_TOKEN`
- **Configuration**:
  - DNS management for 4site.pro
  - CDN optimization
  - Security rules

## 🔧 Service Configuration Templates

### GitHub OAuth App Settings
```json
{
  "name": "4site.pro",
  "homepage_url": "https://4site.pro",
  "description": "Transform any GitHub repository into a stunning website in seconds",
  "callback_urls": ["https://4site.pro/auth/github/callback"],
  "webhook_url": "https://api.4site.pro/webhooks/github",
  "public": true,
  "default_permissions": {
    "metadata": "read",
    "contents": "read",
    "pull_requests": "write"
  }
}
```

### Cloudflare DNS Records
```dns
A     @       192.0.2.1
CNAME www     4site.pro
CNAME api     api-backend.railway.app
MX    @       10 mail.4site.pro
TXT   @       "v=spf1 include:sendgrid.net ~all"
```

### SendGrid Domain Authentication
```dns
CNAME em1234.4site.pro sendgrid.net
CNAME s1._domainkey.4site.pro s1.domainkey.u1234.wl.sendgrid.net
CNAME s2._domainkey.4site.pro s2.domainkey.u1234.wl.sendgrid.net
```

## ✅ Security Checklist

- [ ] All API keys use production-specific values (not dev/test keys)
- [ ] Domain restrictions enabled where possible
- [ ] Rate limits configured appropriately
- [ ] Webhook secrets use cryptographically secure random values
- [ ] 2FA enabled on all service accounts
- [ ] IP allowlisting configured for sensitive services
- [ ] API key rotation schedule established (90 days)
- [ ] Keys stored securely in CI/CD environment variables
- [ ] `.env.production.local` added to .gitignore
- [ ] No hardcoded credentials in source code

## 🧪 Validation Commands

Test each service independently:

```bash
# Test Gemini API
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$VITE_GEMINI_API_KEY"

# Test GitHub OAuth
curl -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/applications/$VITE_GITHUB_CLIENT_ID/token" \
  -u "$VITE_GITHUB_CLIENT_ID:$GITHUB_CLIENT_SECRET"

# Test Supabase connection
curl "$VITE_SUPABASE_URL/rest/v1/" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"

# Test SendGrid API
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $EMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@4site.pro"}]}],"from":{"email":"hello@4site.pro"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

## 📋 Placeholder Values to Replace

When setting up, replace these placeholder values:

- `YOUR-PROJECT-ID` → Actual Supabase project ID
- `YOUR-PRODUCTION-ANON-KEY-HERE` → Supabase anon key
- `YOUR-SERVICE-ROLE-KEY-HERE` → Supabase service role key  
- `YOUR-PRODUCTION-GEMINI-KEY-HERE` → Google Gemini API key
- `YOUR-PRODUCTION-CLIENT-ID-HERE` → GitHub OAuth client ID
- `YOUR-PRODUCTION-CLIENT-SECRET-HERE` → GitHub OAuth client secret
- `YOUR-WEBHOOK-SECRET-HERE` → GitHub webhook secret
- `YOUR-EMAIL-API-KEY-HERE` → SendGrid API key
- `YOUR-SENTRY-AUTH-TOKEN-HERE` → Sentry auth token
- `YOUR-VERCEL-ANALYTICS-ID-HERE` → Vercel analytics ID
- `YOUR-CLOUDFLARE-TOKEN-HERE` → Cloudflare API token
- `G-XXXXXXXXXX` → Google Analytics measurement ID

## 🚀 Next Steps

After completing API setup:
1. Run environment validation: `node env-validation-script.js`
2. Test each service individually
3. Configure production database (Group 1, Prompt 3)
4. Deploy frontend and backend (Group 2)