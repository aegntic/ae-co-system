import { SiteData } from './updated-sitedata-types';

export const demoSites: SiteData[] = [
  {
    id: 'demo-react',
    title: 'React - A JavaScript Library for Building User Interfaces',
    description: 'React makes it painless to create interactive UIs. Design simple views for each state in your application.',
    content: 'React is a declarative, efficient, and flexible JavaScript library for building user interfaces. Design simple views for each state in your application.',
    generatedMarkdown: `# React

React is a declarative, efficient, and flexible JavaScript library for building user interfaces.

## Features
- **Component-Based**: Build encapsulated components that manage their own state
- **Declarative**: Design simple views for each state in your application
- **Learn Once, Write Anywhere**: Develop new features without rewriting existing code

## Getting Started
\`\`\`bash
npx create-react-app my-app
cd my-app
npm start
\`\`\`
`,
    template: 'TechProjectTemplate',
    createdAt: new Date('2024-01-15'),
    repoUrl: 'https://github.com/facebook/react',
    githubUrl: 'https://github.com/facebook/react',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: 'React is a declarative, efficient, and flexible JavaScript library for building user interfaces.',
        order: 0
      },
      {
        id: 'features',
        title: 'Features',
        content: 'Component-Based architecture, Declarative syntax, Learn Once Write Anywhere philosophy.',
        order: 1
      }
    ],
    features: [
      'Component-Based Architecture',
      'Virtual DOM for Performance',
      'Rich Ecosystem',
      'Strong Community Support'
    ],
    techStack: ['JavaScript', 'JSX', 'Webpack', 'Babel'],
    projectType: 'library',
    primaryColor: '#61DAFB',
    owner: 'facebook',
    repo: 'react',
    tier: 'premium'
  },
  {
    id: 'demo-aegntic',
    title: 'Aegntic.ai - Elite AI Automation Platform',
    description: 'Transform your workflow with cutting-edge AI automation. Built for developers who demand excellence.',
    content: 'Elite-tier AI automation platform providing seamless integration with modern development workflows.',
    generatedMarkdown: `# Aegntic.ai

Elite-tier AI automation platform providing seamless integration with modern development workflows.

## Core Features
- **AI-First Architecture**: Built from the ground up for AI integration
- **Developer Excellence**: Tools designed by developers, for developers
- **Privacy by Design**: Your data never leaves your control
- **Blazing Performance**: Optimized for speed and efficiency

## Integration
\`\`\`bash
npm install @aegntic/core
\`\`\`
`,
    template: 'TechProjectTemplate',
    createdAt: new Date('2024-02-20'),
    repoUrl: 'https://github.com/aegntic/aegnticdotai',
    githubUrl: 'https://github.com/aegntic/aegnticdotai',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: 'Elite-tier AI automation platform providing seamless integration with modern development workflows.',
        order: 0
      },
      {
        id: 'features',
        title: 'Core Features',
        content: 'AI-First Architecture, Developer Excellence, Privacy by Design, Blazing Performance.',
        order: 1
      }
    ],
    features: [
      'AI-Powered Automation',
      'Privacy-First Design',
      'Developer-Centric Tools',
      'Enterprise-Ready Security'
    ],
    techStack: ['TypeScript', 'Rust', 'React', 'FastAPI'],
    projectType: 'tool',
    primaryColor: '#8B5CF6',
    owner: 'aegntic',
    repo: 'aegnticdotai',
    tier: 'premium'
  }
];

export function getDemoSite(id: string): SiteData | undefined {
  return demoSites.find(site => site.id === id);
}

export function getRandomDemoSite(): SiteData {
  const index = Math.floor(Math.random() * demoSites.length);
  return demoSites[index];
}