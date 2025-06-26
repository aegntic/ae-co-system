# Authentication & User Management Setup Guide

## Overview

This guide covers the complete authentication and user management system implementation for 4site.pro, including Supabase integration, user dashboards, tiered access control, and referral tracking.

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Stripe Account** (optional): For payment processing
3. **Environment Variables**: Copy `.env.example` to `.env.local`

## Setup Steps

### 1. Database Setup

Run the SQL schema in your Supabase dashboard:

```sql
-- Copy contents from database/schema.sql
```

### 2. Environment Configuration

Update `.env.local` with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 4. Enable Authentication Providers

In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Email/Password
3. Enable GitHub OAuth
4. Enable Google OAuth

### 5. Configure Redirect URLs

Add these URLs to your OAuth app settings:
- Callback URL: `https://yourdomain.com/auth/callback`
- Logout URL: `https://yourdomain.com`

## Features Implemented

### User Authentication
- Email/password sign up and sign in
- OAuth with GitHub and Google
- Automatic session management
- Secure password reset flow

### User Profile Management
- Extended user profiles with metadata
- Avatar upload support
- Tier-based feature access
- Usage tracking and limits

### Dashboard Features
- Website management interface
- Real-time analytics
- Usage metrics visualization
- Referral tracking system

### Tiered Access Control
- **Free Tier**: 3 websites, basic features
- **Pro Tier**: Unlimited websites, custom domains
- **Business Tier**: Team features, white-label
- **Enterprise Tier**: Full access, custom development

### Referral System
- Unique referral codes per user
- Email invitation system
- Automatic reward tracking
- Social sharing integration

## Code Structure

```
lib/
├── supabase.ts          # Supabase client and helpers
├── database.types.ts    # TypeScript types
contexts/
├── AuthContext.tsx      # Authentication context
components/
├── auth/
│   └── LoginForm.tsx    # Login/signup component
├── dashboard/
│   ├── UserDashboard.tsx    # Main dashboard
│   ├── WebsiteCard.tsx      # Website display
│   ├── UsageMetrics.tsx     # Analytics view
│   ├── ReferralSection.tsx  # Referral management
│   └── UpgradePrompt.tsx    # Upgrade prompts
api/
└── auth.ts              # API type definitions
```

## Integration Points

### 1. App.tsx Integration

The main app now includes:
- AuthProvider wrapper
- Login modal
- User menu
- Dashboard access

### 2. Website Creation

When a user generates a site:
- Check authentication status
- Verify usage limits
- Save to database
- Track analytics

### 3. Protected Routes

Use `useRequireAuth` hook for protected pages:

```tsx
const { isAuthenticated } = useRequireAuth('/login');
```

### 4. Permission Checks

Use `usePermissions` hook for feature access:

```tsx
const { canCreateWebsite, canUseCustomDomain } = usePermissions();
```

## Testing

### 1. Local Testing

```bash
npm run dev
```

### 2. Test User Flow
1. Sign up with email
2. Verify email (check Supabase logs)
3. Create a website
4. Check dashboard
5. Test referral system

### 3. Test OAuth
1. Configure OAuth apps
2. Test GitHub login
3. Test Google login

## Deployment Considerations

### 1. Environment Variables
- Set all production environment variables
- Use different Supabase project for production
- Configure production OAuth redirect URLs

### 2. Database Migrations
- Use Supabase migrations for schema changes
- Test migrations in staging first
- Backup before major changes

### 3. Security
- Enable RLS policies
- Configure CORS properly
- Use secure session storage
- Implement rate limiting

## Monitoring

### 1. User Analytics
- Track sign-ups
- Monitor active users
- Analyze conversion rates
- Track feature usage

### 2. Performance
- Monitor database queries
- Track API response times
- Watch for usage spikes
- Set up alerts

## Troubleshooting

### Common Issues

1. **Login fails**: Check Supabase URL and anon key
2. **OAuth redirect errors**: Verify redirect URLs
3. **Permission denied**: Check RLS policies
4. **Usage limits hit**: Verify tier calculations

### Debug Mode

Enable debug logging:

```tsx
if (import.meta.env.DEV) {
  console.log('Auth state:', authState);
}
```

## Next Steps

1. **Payment Integration**: Add Stripe for paid tiers
2. **Email Templates**: Customize Supabase email templates
3. **Admin Dashboard**: Build admin interface
4. **Analytics Dashboard**: Integrate PostHog or similar
5. **Team Features**: Implement organization support

## Support

For issues or questions:
- Check Supabase documentation
- Review error logs in Supabase dashboard
- Test with different user accounts
- Verify environment variables