# Quick Setup to See Enhanced Viral Mechanics

## Step 1: Set up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose any name)
3. Once created, go to Settings → API and copy:
   - Project URL
   - Anon/Public Key

## Step 2: Add Supabase to Environment

Add these to your `.env.local` file:

```bash
# Add these lines to .env.local
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 3: Set up Database

1. In Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the entire contents of `../database/schema.sql`
4. Run the query
5. Copy the contents of `../database/seed_demo_data.sql` 
6. Run that query too

## Step 4: Run the App

```bash
npm install
npm run dev
```

## Step 5: See It In Action

1. **Visit**: http://localhost:5173
2. **Sign up** for an account (use any email)
3. **Generate a website** using any GitHub URL
4. **Check the Dashboard**:
   - Go to Dashboard → Commissions tab
   - See the viral growth mechanics
   - Check referral progress toward free Pro
5. **Test Sharing**:
   - View your generated site
   - Use the Share Tracker component to share externally
   - See viral score boost in real-time
6. **See Pro Showcase Grid**:
   - Scroll down on any generated site
   - See the 3x3 grid of top Pro projects ordered by viral score

## What You'll See

### ✨ Enhanced Dashboard
- **Commissions Tab**: Lifetime earnings with 20%→25%→40% progression
- **Free Pro Progress**: Visual tracker showing path to 10 referrals = free Pro
- **Viral Mechanics**: Share multipliers and growth explanations

### 🚀 Share Tracking
- **External Share Buttons**: Twitter, LinkedIn, Facebook, Email
- **Viral Score Boost**: Each share increases featuring likelihood
- **Auto-Featuring**: Every 5 shares triggers automatic showcase featuring

### 🎯 Pro Showcase Grid
- **Smart Ordering**: Sites ordered by viral score (engagement + shares + time decay)
- **Auto-Featuring**: Pro users automatically appear when published
- **Viral Boost Display**: Shows which sites have high external share counts

### 💰 Commission System
- **Progressive Rates**: 20% first year → 25% years 1-4 → 40% after 4 years
- **Real-time Tracking**: See commission history and payment status
- **Long-term Incentives**: Rewards quality referral relationships

No Supabase? The app will still work but viral features will be disabled. You'll see placeholder data and UI components.