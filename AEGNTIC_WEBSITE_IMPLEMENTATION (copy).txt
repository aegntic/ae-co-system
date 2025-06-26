# AEGNTIC Website Implementation Guide
## Technical Setup and Development Instructions

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/aegntic/aegntic-website.git
cd aegntic-website
bun install

# Environment setup
cp .env.example .env.local
# Configure environment variables

# Development
bun dev

# Build & deploy
bun build
vercel deploy
```

---

## Project Structure

```
aegntic-website/
├── src/
│   ├── app/                    # Next.js 15 app directory
│   │   ├── (marketing)/        # Marketing pages group
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── products/       # Product pages
│   │   │   ├── solutions/      # Solution pages
│   │   │   ├── pricing/        # Pricing page
│   │   │   └── company/        # About, careers, etc.
│   │   ├── (auth)/            # Auth pages group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── dashboard/         # User dashboard
│   │   ├── docs/              # Documentation
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── marketing/         # Marketing components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── docs/              # Documentation components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── api/               # API client
│   │   ├── auth/              # Auth utilities
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utilities
│   │   └── animations/        # Animation presets
│   ├── styles/
│   │   ├── globals.css        # Global styles
│   │   └── themes/            # Theme configurations
│   ├── content/               # MDX content
│   │   ├── blog/
│   │   ├── docs/
│   │   └── changelog/
│   └── types/                 # TypeScript types
├── public/
│   ├── images/
│   ├── videos/
│   └── fonts/
├── tests/                     # Test files
├── scripts/                   # Build scripts
└── config/                    # Configuration files
```

---

## Core Dependencies

```json
{
  "dependencies": {
    // Framework
    "next": "15.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    
    // Styling
    "tailwindcss": "4.0.0",
    "@radix-ui/themes": "latest",
    "class-variance-authority": "latest",
    "tailwind-merge": "latest",
    
    // Animation
    "framer-motion": "latest",
    "@react-three/fiber": "latest",
    "@react-three/drei": "latest",
    "three": "latest",
    "lottie-react": "latest",
    
    // State Management
    "zustand": "latest",
    "@tanstack/react-query": "latest",
    
    // Forms & Validation
    "react-hook-form": "latest",
    "zod": "latest",
    "@hookform/resolvers": "latest",
    
    // Auth & Payments
    "@clerk/nextjs": "latest",
    "stripe": "latest",
    "@stripe/stripe-js": "latest",
    
    // Analytics
    "posthog-js": "latest",
    "@vercel/analytics": "latest",
    "@vercel/speed-insights": "latest",
    
    // Utilities
    "date-fns": "latest",
    "clsx": "latest",
    "sharp": "latest"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "latest",
    "@types/react": "latest",
    "@types/node": "latest",
    
    // Testing
    "vitest": "latest",
    "@testing-library/react": "latest",
    "playwright": "latest",
    
    // Linting
    "eslint": "latest",
    "prettier": "latest",
    "@typescript-eslint/parser": "latest"
  }
}
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://aegntic.ai
NEXT_PUBLIC_API_URL=https://api.aegntic.ai

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Email (Resend)
RESEND_API_KEY=

# Storage (S3-compatible)
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_REGION=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEMO=true
```

---

## Key Components Implementation

### 1. Glass Card Component

```tsx
// components/ui/glass-card.tsx
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  delay?: number
}

export function GlassCard({ 
  children, 
  className, 
  hover = false, 
  glow = false,
  delay = 0
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/[0.08] backdrop-blur-xl",
        "border border-white/[0.18]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
        hover && [
          "transition-all duration-300",
          "hover:scale-[1.02] hover:bg-white/[0.12]",
          "hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
        ],
        glow && "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-aegntic-blue/20 before:to-aegntic-purple/20 before:blur-xl",
        className
      )}
    >
      {children}
    </motion.div>
  )
}
```

### 2. Aurora Background

```tsx
// components/ui/aurora-background.tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.0);
    
    // Aurora effect
    for(float i = 0.0; i < 4.0; i++) {
      uv.y += sin(uv.x * (i + 1.0) * 2.0 + time * 0.5) * 0.1;
      color += vec3(
        sin(uv.y * 10.0 + time) * 0.5 + 0.5,
        sin(uv.y * 15.0 + time * 1.3) * 0.5 + 0.5,
        sin(uv.y * 20.0 + time * 1.6) * 0.5 + 0.5
      ) / 4.0;
    }
    
    color *= vec3(0.0, 0.8, 1.0); // AEGNTIC blue tint
    gl_FragColor = vec4(color * 0.3, 1.0);
  }
`

function AuroraMesh() {
  const mesh = useRef<THREE.Mesh>()
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    }),
    []
  )

  useFrame((state) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <AuroraMesh />
      </Canvas>
    </div>
  )
}
```

### 3. Interactive Demo Component

```tsx
// components/marketing/interactive-demo.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CodeEditor } from '@/components/ui/code-editor'
import { VideoPreview } from '@/components/ui/video-preview'

export function InteractiveDemo() {
  const [code, setCode] = useState(`function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}`)
  
  const [documentation, setDocumentation] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code) {
        setIsProcessing(true)
        // Simulate AI processing
        setTimeout(() => {
          setDocumentation(generateDocumentation(code))
          setIsProcessing(false)
        }, 1500)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [code])
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <GlassCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Write Your Code</h3>
          <CodeEditor
            value={code}
            onChange={setCode}
            language="javascript"
            theme="aegntic-dark"
          />
        </div>
      </GlassCard>
      
      <GlassCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            AI-Generated Documentation
          </h3>
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aegntic-blue mx-auto mb-4" />
                  <p className="text-sm text-gray-400">
                    AI is analyzing your code...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="documentation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VideoPreview
                  documentation={documentation}
                  code={code}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  )
}
```

### 4. Performance Monitoring

```tsx
// lib/monitoring.ts
import { getCLS, getFID, getLCP } from 'web-vitals'

export function initWebVitals() {
  getCLS(console.log)
  getFID(console.log)
  getLCP(console.log)
}

// Custom performance tracking
export function trackPageLoad() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        connection: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.responseEnd,
        domComplete: navigation.domComplete - navigation.domInteractive,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart
      }
      
      // Send to analytics
      if (window.posthog) {
        window.posthog.capture('page_performance', metrics)
      }
    })
  }
}
```

---

## Deployment Configuration

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "bun run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "fra1"],
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
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/discord",
      "destination": "https://discord.gg/aegntic",
      "permanent": false
    }
  ]
}
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM oven/bun:1-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["bun", "server.js"]
```

---

## Testing Strategy

### Unit Tests (Vitest)

```ts
// components/ui/glass-card.test.tsx
import { render, screen } from '@testing-library/react'
import { GlassCard } from './glass-card'

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Test Content</GlassCard>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
  
  it('applies hover styles when hover prop is true', () => {
    const { container } = render(<GlassCard hover>Content</GlassCard>)
    const card = container.firstChild
    expect(card).toHaveClass('hover:scale-[1.02]')
  })
})
```

### E2E Tests (Playwright)

```ts
// tests/e2e/homepage.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Build at the Speed of Thought')
  })
  
  test('should start interactive demo', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Try It Yourself')
    await expect(page.locator('.code-editor')).toBeVisible()
  })
})
```

---

## Launch Checklist

### Pre-Launch
- [ ] Run Lighthouse audit (target 95+ score)
- [ ] Test all interactive demos
- [ ] Verify all forms and CTAs
- [ ] Check responsive design on all devices
- [ ] Validate SEO meta tags
- [ ] Test payment flows in test mode
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics tracking verified
- [ ] Load test with k6 or similar

### Launch
- [ ] Deploy to production
- [ ] Configure DNS
- [ ] Enable Cloudflare
- [ ] Monitor real user metrics
- [ ] Check all integrations
- [ ] Verify email flows

### Post-Launch
- [ ] Monitor Core Web Vitals
- [ ] Track conversion rates
- [ ] A/B test variations
- [ ] Gather user feedback
- [ ] Iterate based on data

---

*This implementation guide provides everything needed to build and deploy the AEGNTIC website with world-class performance and user experience.*