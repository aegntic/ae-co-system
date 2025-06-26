# Prompt 05: Update Demo Service

## Objective
Update the demo service to match the new SiteData structure and provide better examples.

## Target File
- `/services/demoService.ts`

## Implementation
Update demo data to include all required fields:

```typescript
import { SiteData } from '../types';

export const demoSites: SiteData[] = [
  {
    id: 'demo-react',
    title: 'React - A JavaScript Library for Building User Interfaces',
    description: 'React makes it painless to create interactive UIs. Design simple views for each state in your application.',
    content: \`# React

React is a declarative, efficient, and flexible JavaScript library for building user interfaces.

## Features
- **Component-Based**: Build encapsulated components that manage their own state
- **Declarative**: Design simple views for each state in your application
- **Learn Once, Write Anywhere**: Develop new features without rewriting existing code

## Getting Started
\\\`\\\`\\\`bash
npx create-react-app my-app
cd my-app
npm start
\\\`\\\`\\\`
\`,
    template: 'documentation',
    createdAt: new Date('2024-01-15'),
    features: [
      'Component-Based Architecture',
      'Virtual DOM for Performance',
      'Rich Ecosystem',
      'Strong Community Support'
    ],
    techStack: ['JavaScript', 'JSX', 'Webpack', 'Babel'],
    projectType: 'library',
    primaryColor: '#61DAFB',
    repoUrl: 'https://github.com/facebook/react',
    owner: 'facebook',
    repo: 'react'
  },
  {
    id: 'demo-aegntic',
    title: 'Aegntic.ai - Elite AI Automation Platform',
    description: 'Transform your workflow with cutting-edge AI automation. Built for developers who demand excellence.',
    content: \`# Aegntic.ai

Elite-tier AI automation platform providing seamless integration with modern development workflows.

## Core Features
- **AI-First Architecture**: Built from the ground up for AI integration
- **Developer Excellence**: Tools designed by developers, for developers
- **Privacy by Design**: Your data never leaves your control
- **Blazing Performance**: Optimized for speed and efficiency

## Integration
\\\`\\\`\\\`bash
npm install @aegntic/core
\\\`\\\`\\\`
\`,
    template: 'showcase',
    createdAt: new Date('2024-02-20'),
    features: [
      'AI-Powered Automation',
      'Privacy-First Design',
      'Developer-Centric Tools',
      'Enterprise-Ready Security'
    ],
    techStack: ['TypeScript', 'Rust', 'React', 'FastAPI'],
    projectType: 'application',
    primaryColor: '#8B5CF6',
    repoUrl: 'https://github.com/aegntic/aegnticdotai',
    owner: 'aegntic',
    repo: 'aegnticdotai'
  }
];

export function getDemoSite(id: string): SiteData | undefined {
  return demoSites.find(site => site.id === id);
}

export function getRandomDemoSite(): SiteData {
  const index = Math.floor(Math.random() * demoSites.length);
  return demoSites[index];
}
```

## Expected Output File
- `updated-demo-service.ts` - Complete updated demo service

## Dependencies
- Requires: 01-fix-types.md (updated SiteData interface)

## Validation
- All demo sites should have complete data
- Fields should match real-world examples
- Demo data should be realistic and compelling

## Notes
Good demo data is crucial for:
- Testing the UI with realistic content
- Showing users what's possible
- Debugging issues with real-world data structures
- Marketing the platform effectively