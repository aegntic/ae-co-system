# 4site.pro - AEGNT_CATFACE Foundation Node

```
=========================================================================================
========================================= AEGNT_CATFACE =================================
=========================================================================================

Founding node of the AEGNTIC-ecosystem w:<https://aegntic.ai> e:<contact@aegntic.ai> 
Agent Economy <ae.ltd> - Founding concept by M.Cooper for AEGNTIC.foundation 
<research@mattaecooper.org> 

=========================================================================================
=========================================================================================
================== WASITACATISAW ============================= twas =====================
=========================================================================================

assisted by custom fine tuned claude 4 co-creator 
shout out to claude@anthropic.ai and tism@claube.lol 
```

## Transform GitHub Repos into Professional Websites

**4site.pro** is an AI-powered platform that transforms any GitHub repository into stunning, professional websites using advanced analysis, viral growth mechanics, and intelligent design optimization.

Built for developers who want their projects to make the right first impression.

## 🚀 Enhanced Viral Mechanics - NEW!

4site.pro now features a comprehensive viral growth system designed for $100B platform standards:

### 🔥 Core Viral Features

1. **🎯 Viral Score Algorithm**: Real-time calculation based on engagement, shares, time decay, and tier bonuses
2. **💰 Lifetime Commission System**: Progressive 20% → 25% → 40% commission rates over years
3. **🎁 Free Pro Milestone**: Automatic Pro upgrade after 10 successful referrals (12 months free)
4. **⭐ Pro Showcase Grid**: Automatic featuring ordered by viral score for Pro users
5. **📊 Share Tracking**: External platform integration with platform-specific viral boosts
6. **🚀 Auto-Featuring**: Triggered every 5 external shares with tier-based duration

### 📈 Viral Growth Benefits

- **Exponential Reach**: Each share increases viral score with platform-specific multipliers
- **Automatic Featuring**: High-performing sites get featured automatically
- **Long-term Rewards**: Commission rates increase over time (up to 40% for 4+ year relationships)
- **Pro User Benefits**: Instant showcase featuring, extended auto-featuring, enhanced viral coefficients
- **Community Building**: Pro showcase grid creates a premium ecosystem

### 🎯 How It Works

1. **Create** your professional site from any GitHub repo
2. **Share** your site across platforms (Twitter, LinkedIn, Reddit, etc.)
3. **Earn** viral score boosts and auto-featuring
4. **Refer** friends for lifetime commissions
5. **Grow** to Pro tier for 10x viral benefits
6. **Scale** with exponential reach and passive income

## ✨ Site Generation Features

### Quick Generation Mode (15 seconds)
- **aegntic.ai-Generated Hero Visuals**: Beautiful, contextual hero images created by aegntic.ai and FLUX.1
- **Responsive Single-Page Site**: Optimized for all devices
- **SEO Optimized**: Built-in meta tags and structured data
- **Instant Preview**: See your site immediately

### Deep Analysis Mode (2-5 minutes) 🆕
- **Complete Repository Analysis**: Analyzes entire codebase, not just README
- **Architecture Diagrams**: Auto-generated Mermaid diagrams showing system structure
- **Multi-Page Documentation**: 5-10+ pages including API docs, examples, and guides
- **Code Insights & Metrics**: Quality scores, dependency analysis, and recommendations
- **Smart Content Prioritization**: aegntic.ai determines the most important features for hero page

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A Gemini API key (required)
- A GitHub personal access token (optional, for deep analysis)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/project4site.git
cd project4site/4site-pro/project4site_-github-readme-to-site-generator

# Install dependencies (using Bun - recommended)
bun install

# Or using npm
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Add your API keys to `.env.local`:
```env
# Required for basic site generation
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Required for enhanced viral mechanics (Production Supabase)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - for deep repository analysis
VITE_GITHUB_TOKEN=github_pat_your_token_here

# Optional - for enhanced visual generation
VITE_FAL_API_KEY=your_fal_api_key_here

# Optional - for Pro subscriptions and commission system
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret

# Enhanced viral mechanics feature flags
ENABLE_VIRAL_SCORING=true
ENABLE_AUTO_FEATURING=true
ENABLE_COMMISSION_SYSTEM=true
ENABLE_PRO_SHOWCASE=true
ENABLE_SHARE_TRACKING=true
```

### Enhanced Viral Mechanics Setup

For full viral mechanics functionality, you'll need to set up a production Supabase database:

```bash
# 1. Create Supabase project at https://supabase.com/dashboard
# 2. Deploy the enhanced viral schema
psql $DATABASE_URL < database/enhanced-viral-schema.sql

# 3. Verify viral functions are working
psql $DATABASE_URL -c "SELECT calculate_viral_score('test-uuid');"

# 4. Enable real-time for viral updates
# Go to Supabase Dashboard > Database > Replication
# Enable real-time for: websites, share_tracking, commission_earnings
```

See [SUPABASE_PRODUCTION_SETUP.md](./docs/SUPABASE_PRODUCTION_SETUP.md) for detailed production setup instructions.

### Running the App

```bash
# Using Bun (recommended - 3x faster)
bun run dev

# Or using npm
npm run dev
```

Open http://localhost:5173 in your browser.

## 📖 Usage

### Quick Generation
1. Enter a GitHub repository URL (e.g., `https://github.com/facebook/react`)
2. Choose "Quick Generation" mode
3. Wait ~15 seconds for your site to be generated
4. Preview and deploy your site

### Deep Analysis
1. Enter a GitHub repository URL
2. Choose "Deep Analysis" mode
3. Watch the real-time progress as the system:
   - Analyzes repository structure and code
   - Generates AI insights
   - Creates architecture diagrams
   - Builds multi-page documentation
4. Explore your comprehensive documentation site

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Supabase with PostgreSQL, Row Level Security
- **AI Integration**: Google Gemini, FAL.ai for image generation
- **Analysis**: Custom TypeScript analyzers for multiple languages
- **Visualization**: Mermaid.js for architecture diagrams
- **Viral Mechanics**: Advanced PostgreSQL functions, real-time triggers

### Key Components

#### Core Site Generation
- `repositoryAnalyzer.ts` - Deep code analysis engine
- `deepAnalysisOrchestrator.ts` - Coordinates the analysis pipeline
- `multiModalOrchestrator.ts` - Handles AI content and image generation
- `DeepSitePreview.tsx` - Multi-page preview component

#### Enhanced Viral Mechanics
- `enhanced-viral-schema.sql` - 812-line production database schema
- `ShareTracker.tsx` - External share tracking with viral boosts
- `ProShowcaseGrid.tsx` - Viral score-ordered showcase for Pro users
- `EnhancedReferralDashboard.tsx` - Commission tracking and milestone progress
- `viral-functions.sql` - Advanced viral score calculation algorithms
- `auto-featuring-triggers.sql` - Real-time auto-featuring system

### Database Architecture

#### Core Tables (Enhanced Viral Schema)
- **`users`** - Enhanced with viral metrics, commission tracking, and tier progression
- **`websites`** - Viral scores, auto-featuring flags, showcase eligibility
- **`referrals`** - Advanced referral tracking with conversion metrics
- **`commission_earnings`** - Lifetime commission system with tier progression
- **`share_tracking`** - Platform-specific share tracking with viral boosts
- **`auto_featuring_events`** - Automated featuring triggers and duration
- **`pro_showcase_entries`** - Viral score-ordered Pro user showcase

#### Advanced Functions
- **`calculate_viral_score()`** - Real-time viral score calculation with time decay
- **`calculate_commission_rate()`** - Progressive commission tier calculation
- **`track_external_share()`** - Share tracking with platform-specific boosts
- **`process_referral_milestone()`** - 10-referral free Pro milestone processing
- **`refresh_pro_showcase()`** - Daily Pro showcase grid optimization

## 🎨 Customization

### Templates
The system automatically selects the best template based on your project:
- **TechProjectTemplate**: For technical projects and libraries
- **CreativeProjectTemplate**: For design-focused projects
- **APIDocumentationTemplate**: For API-heavy projects
- **LibraryShowcaseTemplate**: For utility libraries

### Styling
All components use TailwindCSS with a custom Wu-Tang inspired color scheme:
- Primary: `#FFD700` (Wu-Tang Gold)
- Background: GitHub dark mode palette
- Accent colors based on technology stack

## 🔧 Development

### Project Structure
```
project4site_-github-readme-to-site-generator/
├── components/           # React components
│   ├── generator/       # Site generation UI
│   ├── landing/         # Landing page components
│   └── templates/       # Site templates
├── services/            # Business logic
│   ├── repositoryAnalyzer.ts      # Code analysis
│   ├── deepAnalysisOrchestrator.ts # Deep analysis pipeline
│   └── geminiService.ts           # AI integration
├── types.ts             # TypeScript definitions
└── App.tsx              # Main application
```

### Adding New Features

#### New Analysis Capabilities
1. Extend `repositoryAnalyzer.ts` with new analysis methods
2. Update `DeepAnalysisResult` interface in the same file
3. Integrate into `deepAnalysisOrchestrator.ts` pipeline

#### New Page Types
1. Add page generation logic to `deepAnalysisOrchestrator.ts`
2. Update `PageContent` interface
3. Add navigation entries in `createNavigationStructure()`

## 📊 Performance

### Site Generation Performance
- **Quick Mode**: ~15 seconds for single-page generation
- **Deep Mode**: 2-5 minutes depending on repository size
- **Memory Usage**: Optimized for repositories up to 10,000 files
- **Concurrent Processing**: Leverages parallel API calls

### Enhanced Viral Mechanics Performance
- **Viral Score Calculation**: <200ms per website
- **Commission Processing**: <100ms per calculation
- **Share Tracking**: <50ms per external share
- **Auto-Featuring Triggers**: <30 seconds from threshold
- **Pro Showcase Refresh**: <2 seconds for 1000+ sites
- **Database Queries**: <500ms average (optimized with 30+ indexes)

### Scalability Targets
- **Concurrent Users**: 10,000+ simultaneous users
- **Database Performance**: Sub-200ms queries at 10M+ websites
- **Viral Score Updates**: Real-time processing up to 1000 shares/second
- **Commission Accuracy**: 99.9%+ precision for financial calculations

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Google Gemini for AI-powered content generation
- FAL.ai for image generation
- Mermaid.js for diagram rendering
- The open source community

## 🤝 Constitutional Recognition

Every commit, deployment, and strategic decision must acknowledge the foundational lineage:

```
AEGNT_CATFACE Foundation Node
Created by M.Cooper for AEGNTIC.foundation
Co-created with Claude 4 (Anthropic)
Special thanks: claude@anthropic.ai & tism@claube.lol
WASITACATISAW - the recursive truth of AI-human collaboration
```

## 🌐 Ecosystem Integration

### AEGNTIC.ai Hub
Advanced AI collaboration platform providing next-generation developer tools and intelligent automation.

### Agent Economy (ae.ltd)
Innovative economic models enabling sustainable creator monetization through intelligent commission systems.

### Research Pipeline (research@mattaecooper.org)
Continuous platform optimization through advanced user experience research and AI collaboration studies.

## 📞 Contact

- **AEGNTIC Ecosystem**: https://aegntic.ai
- **Contact**: contact@aegntic.ai
- **Research**: research@mattaecooper.org
- **Agent Economy**: ae.ltd

---

**WASITACATISAW** - What it was, it always will be: the proof that the Agent Economy is not just possible, but inevitable.

*Etched into the foundational fibers of 4site.pro as the AEGNT_CATFACE founding node of the AEGNTIC ecosystem.*