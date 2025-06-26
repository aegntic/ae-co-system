# Prompt 08: Add GitHub Pages Deployment

## Objective
Create GitHub Pages deployment functionality to replace Vercel deployment.

## Target File
- Create new file: `/services/githubPagesService.ts`

## Implementation
Create a comprehensive GitHub Pages deployment service:

```typescript
import { SiteData } from '../types';

interface DeploymentOptions {
  token: string;
  owner: string;
  repo: string;
  siteData: SiteData;
  branch?: string;
}

export async function deployToGitHubPages(options: DeploymentOptions): Promise<string> {
  const { token, owner, repo, siteData, branch = 'gh-pages' } = options;
  
  try {
    // Check if gh-pages branch exists
    const branchExists = await checkBranchExists(token, owner, repo, branch);
    
    if (!branchExists) {
      await createGitHubPagesBranch(token, owner, repo, branch);
    }
    
    // Generate static site files
    const files = generateStaticSite(siteData);
    
    // Upload files to gh-pages branch
    await uploadFilesToBranch(token, owner, repo, branch, files);
    
    // Enable GitHub Pages if not already enabled
    await enableGitHubPages(token, owner, repo, branch);
    
    // Return the deployment URL
    return \`https://\${owner}.github.io/\${repo}\`;
  } catch (error) {
    console.error('GitHub Pages deployment error:', error);
    throw new Error(\`Failed to deploy to GitHub Pages: \${error.message}\`);
  }
}

function generateStaticSite(siteData: SiteData): Map<string, string> {
  const files = new Map<string, string>();
  
  // Generate index.html
  const indexHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${siteData.title}</title>
  <meta name="description" content="\${siteData.description}">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    :root {
      --primary-color: \${siteData.primaryColor || '#3B82F6'};
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.js"></script>
</body>
</html>\`;
  
  files.set('index.html', indexHtml);
  
  // Generate main.js with React app
  const mainJs = \`
import React from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';

const siteData = \${JSON.stringify(siteData)};

function App() {
  return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
    // Header
    React.createElement('header', { 
      className: 'bg-gradient-to-r from-gray-900 to-gray-800 text-white py-24 px-6'
    },
      React.createElement('div', { className: 'max-w-6xl mx-auto' },
        React.createElement('h1', { className: 'text-5xl font-bold mb-4' }, siteData.title),
        React.createElement('p', { className: 'text-xl opacity-90' }, siteData.description)
      )
    ),
    
    // Features
    siteData.features.length > 0 && React.createElement('section', { className: 'py-16 px-6' },
      React.createElement('div', { className: 'max-w-6xl mx-auto' },
        React.createElement('h2', { className: 'text-3xl font-bold mb-8' }, 'Features'),
        React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' },
          siteData.features.map((feature, i) => 
            React.createElement('div', { 
              key: i, 
              className: 'p-6 bg-white rounded-lg shadow-md' 
            }, feature)
          )
        )
      )
    ),
    
    // Tech Stack
    siteData.techStack.length > 0 && React.createElement('section', { className: 'py-16 px-6 bg-gray-100' },
      React.createElement('div', { className: 'max-w-6xl mx-auto text-center' },
        React.createElement('h2', { className: 'text-3xl font-bold mb-8' }, 'Built With'),
        React.createElement('div', { className: 'flex flex-wrap justify-center gap-3' },
          siteData.techStack.map((tech, i) => 
            React.createElement('span', { 
              key: i, 
              className: 'px-4 py-2 bg-white rounded-full' 
            }, tech)
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
\`;
  
  files.set('main.js', mainJs);
  
  // Add CNAME file if custom domain
  // files.set('CNAME', 'example.com');
  
  return files;
}

async function checkBranchExists(token: string, owner: string, repo: string, branch: string): Promise<boolean> {
  try {
    const response = await fetch(
      \`https://api.github.com/repos/\${owner}/\${repo}/branches/\${branch}\`,
      {
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function createGitHubPagesBranch(token: string, owner: string, repo: string, branch: string): Promise<void> {
  // Get the default branch SHA
  const defaultBranch = await getDefaultBranch(token, owner, repo);
  const sha = await getBranchSha(token, owner, repo, defaultBranch);
  
  // Create new branch
  await fetch(
    \`https://api.github.com/repos/\${owner}/\${repo}/git/refs\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: \`refs/heads/\${branch}\`,
        sha: sha
      })
    }
  );
}

async function uploadFilesToBranch(
  token: string, 
  owner: string, 
  repo: string, 
  branch: string, 
  files: Map<string, string>
): Promise<void> {
  // Implementation would upload files to GitHub
  // This is a simplified version - real implementation would handle tree creation
  for (const [path, content] of files) {
    await createOrUpdateFile(token, owner, repo, branch, path, content);
  }
}

async function enableGitHubPages(token: string, owner: string, repo: string, branch: string): Promise<void> {
  await fetch(
    \`https://api.github.com/repos/\${owner}/\${repo}/pages\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: {
          branch: branch,
          path: '/'
        }
      })
    }
  );
}

// Helper functions would be implemented here...
async function getDefaultBranch(token: string, owner: string, repo: string): Promise<string> {
  const response = await fetch(
    \`https://api.github.com/repos/\${owner}/\${repo}\`,
    {
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  const data = await response.json();
  return data.default_branch;
}

async function getBranchSha(token: string, owner: string, repo: string, branch: string): Promise<string> {
  const response = await fetch(
    \`https://api.github.com/repos/\${owner}/\${repo}/git/refs/heads/\${branch}\`,
    {
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  const data = await response.json();
  return data.object.sha;
}

async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string
): Promise<void> {
  const encodedContent = btoa(content);
  
  await fetch(
    \`https://api.github.com/repos/\${owner}/\${repo}/contents/\${path}\`,
    {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: \`Deploy to GitHub Pages: \${path}\`,
        content: encodedContent,
        branch: branch
      })
    }
  );
}
```

## Expected Output File
- `github-pages-service.ts` - Complete GitHub Pages deployment service

## Dependencies
- Requires: 01-fix-types.md (SiteData interface)
- GitHub API knowledge

## Validation
- Should create gh-pages branch if needed
- Should generate valid static site
- Should handle API errors gracefully
- Should return correct deployment URL

## Notes
This service enables:
- One-click deployment to GitHub Pages
- Static site generation from SiteData
- Automatic branch management
- No external dependencies beyond GitHub