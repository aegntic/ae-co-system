import { SiteData } from '../types';

// Demo data for different repository types
const demoRepositories: Record<string, SiteData> = {
  'facebook/react': {
    title: 'React',
    description: 'The library for web and native user interfaces',
    features: [
      'Declarative Component-Based Architecture',
      'Virtual DOM for Optimal Performance',
      'Rich Ecosystem and Community',
      'Server-Side Rendering Support',
      'Hooks for State Management',
      'Concurrent Mode for Better UX'
    ],
    techStack: ['JavaScript', 'TypeScript', 'JSX', 'Webpack', 'Babel', 'Jest'],
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.',
        type: 'overview'
      },
      {
        id: 'features',
        title: 'Key Features',
        content: 'Build encapsulated components that manage their own state, then compose them to make complex UIs. Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.',
        type: 'features'
      },
      {
        id: 'installation',
        title: 'Getting Started',
        content: '```bash\nnpm install react react-dom\n# or\nyarn add react react-dom\n```\n\nCreate your first React app with Create React App:\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```',
        type: 'installation'
      }
    ],
    projectType: 'tech',
    primaryColor: '#61DAFB',
    githubUrl: 'https://github.com/facebook/react',
    template: 'tech',
    tier: 'premium'
  },
  'vercel/next.js': {
    title: 'Next.js',
    description: 'The React Framework for the Web',
    features: [
      'Hybrid Static & Server Rendering',
      'TypeScript Support',
      'Smart Bundling',
      'Route Pre-fetching',
      'Built-in CSS Support',
      'API Routes'
    ],
    techStack: ['React', 'TypeScript', 'Node.js', 'Webpack', 'Babel', 'SWC'],
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: 'Next.js gives you the best developer experience with all the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more. No config needed.',
        type: 'overview'
      },
      {
        id: 'features',
        title: 'Why Next.js?',
        content: 'Next.js aims to have best-in-class developer experience and many built-in features, such as: Pages Directory, Pre-rendering, Automatic Code Splitting, Client-Side Navigation, Built-in CSS Support, and more.',
        type: 'features'
      }
    ],
    projectType: 'tech',
    primaryColor: '#000000',
    githubUrl: 'https://github.com/vercel/next.js',
    template: 'tech',
    tier: 'enterprise'
  }
};

export async function generateDemoSite(url: string): Promise<SiteData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Extract repo from URL
  const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
  const repoKey = match ? match[1].toLowerCase() : '';
  
  // Return demo data if available
  if (demoRepositories[repoKey]) {
    return demoRepositories[repoKey];
  }
  
  // Return generic demo data for unknown repos
  const repoName = repoKey.split('/').pop() || 'project';
  return {
    title: repoName.charAt(0).toUpperCase() + repoName.slice(1),
    description: `An amazing open-source ${repoName} built with modern technologies`,
    features: [
      'Modern Architecture',
      'High Performance',
      'Developer Friendly',
      'Well Documented',
      'Active Community',
      'Production Ready'
    ],
    techStack: ['JavaScript', 'TypeScript', 'Node.js', 'Docker', 'GitHub Actions'],
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: `Welcome to ${repoName}! This project represents the cutting edge of modern software development, combining powerful features with an elegant, maintainable codebase.`,
        type: 'overview'
      },
      {
        id: 'features',
        title: 'Features',
        content: 'Our solution provides enterprise-grade functionality with a focus on performance, scalability, and developer experience. Every feature has been carefully crafted to provide maximum value.',
        type: 'features'
      },
      {
        id: 'installation',
        title: 'Quick Start',
        content: `\`\`\`bash\ngit clone ${url}\ncd ${repoName}\nnpm install\nnpm run dev\n\`\`\``,
        type: 'installation'
      }
    ],
    projectType: 'tech',
    primaryColor: '#4A90E2',
    githubUrl: url,
    template: 'tech',
    tier: 'premium'
  };
}