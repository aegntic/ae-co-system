#!/bin/bash

# zkFlow.pro Website Setup Script

echo "🚀 Setting up zkFlow.pro website..."

# Create website directory
mkdir -p website
cd website

# Initialize Next.js project
echo "📦 Initializing Next.js project..."
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm

# Install additional dependencies
echo "📚 Installing dependencies..."
npm install \
  @supabase/supabase-js \
  @supabase/auth-helpers-nextjs \
  @stripe/stripe-js \
  stripe \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-icons \
  @radix-ui/react-label \
  @radix-ui/react-select \
  @radix-ui/react-slot \
  @radix-ui/react-toast \
  class-variance-authority \
  clsx \
  lucide-react \
  tailwind-merge \
  react-hook-form \
  zod \
  @hookform/resolvers \
  framer-motion \
  react-hot-toast \
  date-fns \
  @tanstack/react-query

# Install dev dependencies
npm install -D \
  @types/node \
  prettier \
  eslint-config-prettier \
  @tailwindcss/forms \
  @tailwindcss/typography

# Create environment variables file
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_TRIAL_DAYS=7
EOF

# Create project structure
echo "🏗️  Creating project structure..."
mkdir -p {components,lib,styles,hooks,types,utils}
mkdir -p app/{api,auth,dashboard,pricing}
mkdir -p app/api/webhooks

# Create basic configuration files
cat > tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a",
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
EOF

echo "✅ Website setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual API keys"
echo "2. Configure Porkbun DNS:"
echo "   - A record: @ → 76.76.21.21"
echo "   - CNAME: www → cname.vercel-dns.com"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Set up Supabase tables using the schema in ULTRATHINK.md"
echo "5. Configure Stripe products in dashboard"
echo ""
echo "🎯 To start development:"
echo "cd website && npm run dev"