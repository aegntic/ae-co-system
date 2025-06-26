# UltraPlan Fix Strategy for 4site.pro

## Overview
This directory contains step-by-step prompts to fix the broken site generation functionality in 4site.pro. The core issue is a type mismatch where `generateSiteContentFromUrl` returns `Promise<string>` but the UI expects `Promise<SiteData>`.

## Execution Strategy
These prompts are designed for **parallel execution**. Each prompt is self-contained and affects different files, allowing multiple fixes to be applied simultaneously.

### Parallel Groups
Execute prompts within each group in parallel, then wait for completion before moving to the next group:

**Group 1 - Type Foundation (Execute in parallel)**
- `01-fix-types.md` - Update SiteData interface
- `02-fix-enhanced-types.md` - Create EnhancedSiteContent types

**Group 2 - Service Layer (Execute in parallel)**
- `03-fix-gemini-service.md` - Fix generateSiteContentFromUrl
- `04-create-converter.md` - Create conversion utilities
- `05-fix-demo-service.md` - Update demo service

**Group 3 - UI Updates (Execute in parallel)**
- `06-fix-preview-template.md` - Update SimplePreviewTemplate
- `07-fix-app-tsx.md` - Update App.tsx for proper preview
- `08-add-github-pages.md` - Add GitHub Pages deployment

**Group 4 - Testing & Validation (Execute sequentially)**
- `09-create-tests.md` - Create comprehensive tests
- `10-validate-fix.md` - Run validation suite

## Core Problem
When entering a GitHub repository URL (e.g., github.com/aegntic/aegnticdotai), the system shows generic React content instead of repository-specific content because:

1. `generateSiteContentFromUrl` returns raw markdown string
2. `App.tsx` expects structured SiteData object
3. The preview template can't render without proper data structure

## Solution Architecture
1. Update types to include all required fields
2. Integrate enhancedGeminiService for structured output
3. Create converter to transform EnhancedSiteContent to SiteData
4. Update UI components to properly display data
5. Add GitHub Pages deployment option
6. Validate with comprehensive tests

## Expected Outcome
After executing all prompts, the system will:
- Generate repository-specific content for any GitHub URL
- Display proper previews with title, description, features, tech stack
- Offer GitHub Pages deployment instead of Vercel
- Pass all validation tests

## File Naming Convention
Each prompt produces files with clear labels:
- Type definitions: `*-types.ts`
- Services: `*-service.ts`
- Components: `*-component.tsx`
- Tests: `*-test.ts`
- Utilities: `*-utils.ts`