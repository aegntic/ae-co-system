# Prompt 01: Fix SiteData Types

## Objective
Update the SiteData interface to include all fields required by the UI components.

## Target File
- `/types.ts`

## Current Problem
The SiteData interface is missing fields that SimplePreviewTemplate expects:
- description
- features
- techStack
- projectType
- primaryColor

## Fix Implementation
Update the SiteData interface in `/types.ts` to include:

```typescript
export interface SiteData {
  id: string;
  title: string;
  description: string;      // Add this
  content: string;
  template: string;
  createdAt: Date;
  features: string[];       // Add this
  techStack: string[];      // Add this
  projectType?: string;     // Add this (optional)
  primaryColor?: string;    // Add this (optional)
  repoUrl?: string;        // Add this (optional)
  owner?: string;          // Add this (optional)
  repo?: string;           // Add this (optional)
}
```

## Expected Output File
- `updated-sitedata-types.ts` - The complete updated types file

## Dependencies
- None (can be executed immediately)

## Validation
- TypeScript compilation should pass
- No type errors in components using SiteData

## Notes
This is a foundational fix that other prompts depend on. The additional fields enable:
- Rich preview display
- Better AI content generation
- GitHub-specific metadata tracking