/**
 * Example 3: Open Source Integration (Aegntic-Hive Pattern)
 * 
 * This example demonstrates:
 * - Integration with open source services (using GitHub API)
 * - Local-first MCP server pattern (no auth required)
 * - External API integration with error handling
 * - Caching for API responses
 * - Rich metadata for AI assistants
 * 
 * Following the aegntic-hive pattern: simple, local, and effective
 */

import { z } from 'zod';
import { defineTool, defineToolWithDocs } from '../../src/core/tool-builder';
import axios from 'axios';

// Schema for GitHub repository search
const GitHubSearchSchema = z.object({
  query: z.string()
    .min(2, 'Query must be at least 2 characters')
    .describe('Search query using GitHub search syntax'),
  
  language: z.string()
    .optional()
    .describe('Filter by programming language (e.g., "typescript", "python")'),
  
  stars: z.string()
    .optional()
    .describe('Filter by stars (e.g., ">1000", "100..500")'),
  
  sort: z.enum(['stars', 'forks', 'updated', 'best-match'])
    .default('best-match')
    .describe('How to sort results'),
  
  limit: z.number()
    .min(1)
    .max(30)
    .default(10)
    .describe('Number of results to return'),
});

// Schema for fetching README
const FetchReadmeSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
  format: z.enum(['raw', 'html', 'markdown']).default('markdown').describe('Output format'),
});

// Helper function to build GitHub search query
function buildGitHubQuery(params: z.infer<typeof GitHubSearchSchema>): string {
  let q = params.query;
  
  if (params.language) {
    q += ` language:${params.language}`;
  }
  
  if (params.stars) {
    q += ` stars:${params.stars}`;
  }
  
  return q;
}

// Define the GitHub search tool (aegntic-hive pattern: no auth required)
export const githubSearchTool = defineTool({
  name: 'search_github_repos',
  description: 'Search for open source repositories on GitHub with advanced filtering',
  
  schema: GitHubSearchSchema,
  
  // Following aegntic-hive pattern: no authentication required
  auth: {
    required: false,
  },
  
  metadata: {
    examples: [
      {
        description: 'Search for popular TypeScript projects',
        input: {
          query: 'web framework',
          language: 'typescript',
          stars: '>1000',
          sort: 'stars',
          limit: 5,
        },
        output: {
          repositories: [
            {
              name: 'remix-run/remix',
              description: 'Build Better Websites',
              stars: 25000,
              language: 'TypeScript',
              url: 'https://github.com/remix-run/remix',
            },
          ],
        },
      },
      {
        description: 'Find machine learning projects',
        input: {
          query: 'neural network',
          language: 'python',
          sort: 'updated',
          limit: 10,
        },
        output: {
          repositories: [
            {
              name: 'tensorflow/tensorflow',
              description: 'An Open Source Machine Learning Framework',
              stars: 180000,
              language: 'Python',
              url: 'https://github.com/tensorflow/tensorflow',
            },
          ],
        },
      },
    ],
    
    followUpPrompts: [
      'Would you like to see the README for any of these repositories?',
      'Should I search for similar projects in a different language?',
      'Want to filter by a specific number of stars or forks?',
      'Interested in seeing recent activity on these projects?',
    ],
    
    documentation: {
      essentials: 'Search GitHub repositories using GitHub search syntax with filters for language, stars, and sorting.',
      full: `
# GitHub Repository Search Tool

Search for open source projects on GitHub using powerful search syntax and filters.

## Search Syntax
- Basic search: \`machine learning\`
- Exact phrase: \`"machine learning"\`
- Exclude terms: \`react -native\`
- OR operator: \`vue OR svelte\`

## Filters
- **language**: Programming language filter (e.g., "javascript", "rust")
- **stars**: Star count filters
  - Exact: \`stars:100\`
  - Greater than: \`stars:>1000\`
  - Range: \`stars:100..500\`
- **sort**: Result ordering (stars, forks, updated, best-match)

## Rate Limiting
GitHub API has rate limits:
- Unauthenticated: 10 requests per minute
- Results are cached for 5 minutes to reduce API calls

## Examples
1. Popular web frameworks: \`query: "web framework", stars: ">5000"\`
2. Recent ML projects: \`query: "machine learning", language: "python", sort: "updated"\`
3. Small utilities: \`query: "cli tool", stars: "50..500", language: "go"\`
      `,
    },
    
    performance: {
      estimatedDuration: '1-5s',
      cacheable: true,
      cacheKey: (input) => `gh:search:${buildGitHubQuery(input)}:${input.sort}:${input.limit}`,
    },
    
    resources: [
      {
        title: 'GitHub Search Documentation',
        url: 'https://docs.github.com/en/search-github/searching-on-github',
        type: 'documentation',
      },
      {
        title: 'GitHub Search Syntax',
        url: 'https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax',
        type: 'tutorial',
      },
    ],
    
    tags: ['github', 'open-source', 'search', 'repositories'],
  },
  
  handler: async (input, context) => {
    const { logger, cache } = context;
    
    // Build search query
    const searchQuery = buildGitHubQuery(input);
    logger?.info('Searching GitHub repositories', { query: searchQuery });
    
    try {
      // Check cache first
      const cacheKey = `gh:search:${searchQuery}:${input.sort}:${input.limit}`;
      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger?.info('Returning cached GitHub search results');
          return cached as any;
        }
      }
      
      // Make API request
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: searchQuery,
          sort: input.sort === 'best-match' ? undefined : input.sort,
          order: 'desc',
          per_page: input.limit,
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Aegntic-MCP-GitHub-Tool',
        },
        timeout: 10000,
      });
      
      // Extract relevant data
      const repositories = response.data.items.map((repo: any) => ({
        name: repo.full_name,
        description: repo.description || 'No description available',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language || 'Unknown',
        topics: repo.topics || [],
        url: repo.html_url,
        homepage: repo.homepage,
        lastUpdated: repo.updated_at,
        openIssues: repo.open_issues_count,
        license: repo.license?.name || 'No license',
      }));
      
      // Format response
      const resultText = `# GitHub Repository Search Results

**Query**: ${searchQuery}
**Total Results**: ${response.data.total_count.toLocaleString()}
**Showing**: Top ${repositories.length} results

${repositories.map((repo: any, i: number) => `
## ${i + 1}. ${repo.name}

${repo.description}

- **Stars**: ⭐ ${repo.stars.toLocaleString()}
- **Forks**: 🍴 ${repo.forks.toLocaleString()}
- **Language**: ${repo.language}
- **License**: ${repo.license}
- **Open Issues**: ${repo.openIssues}
- **Last Updated**: ${new Date(repo.lastUpdated).toLocaleDateString()}
${repo.topics.length > 0 ? `- **Topics**: ${repo.topics.join(', ')}` : ''}
${repo.homepage ? `- **Homepage**: ${repo.homepage}` : ''}

[View on GitHub](${repo.url})
`).join('\n---\n')}`;
      
      const result = {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
      
      // Cache the result
      if (cache) {
        await cache.set(cacheKey, result, 300); // Cache for 5 minutes
      }
      
      return result;
      
    } catch (error) {
      logger?.error('GitHub API error', { error: error instanceof Error ? error.message : error });
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        if (error.response?.status === 422) {
          throw new Error('Invalid search query. Please check your search syntax.');
        }
      }
      
      throw new Error(`Failed to search GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Define the README fetcher tool with progressive documentation
export const githubReadmeTool = defineToolWithDocs({
  name: 'fetch_github_readme',
  description: 'Fetch and display README content from a GitHub repository',
  
  schema: FetchReadmeSchema,
  
  auth: {
    required: false, // Aegntic-hive pattern
  },
  
  handler: async ({ owner, repo, format }, context) => {
    const { logger, cache } = context;
    
    logger?.info('Fetching GitHub README', { owner, repo, format });
    
    try {
      // Check cache
      const cacheKey = `gh:readme:${owner}/${repo}:${format}`;
      if (cache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger?.info('Returning cached README');
          return cached as any;
        }
      }
      
      let content: string;
      let apiUrl: string;
      
      switch (format) {
        case 'raw':
          apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
          const rawResponse = await axios.get(apiUrl, {
            headers: {
              'Accept': 'application/vnd.github.v3.raw',
              'User-Agent': 'Aegntic-MCP-GitHub-Tool',
            },
            timeout: 10000,
          });
          content = rawResponse.data;
          break;
          
        case 'html':
          apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
          const htmlResponse = await axios.get(apiUrl, {
            headers: {
              'Accept': 'application/vnd.github.v3.html',
              'User-Agent': 'Aegntic-MCP-GitHub-Tool',
            },
            timeout: 10000,
          });
          content = htmlResponse.data;
          break;
          
        default: // markdown
          apiUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
          try {
            const mdResponse = await axios.get(apiUrl, { timeout: 10000 });
            content = mdResponse.data;
          } catch {
            // Try master branch if main doesn't exist
            apiUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`;
            const mdResponse = await axios.get(apiUrl, { timeout: 10000 });
            content = mdResponse.data;
          }
      }
      
      const result = {
        content: [
          {
            type: 'text',
            text: format === 'html' 
              ? `<!-- README for ${owner}/${repo} -->\n${content}`
              : `# README: ${owner}/${repo}\n\n${content}`,
          },
        ],
      };
      
      // Cache for 10 minutes
      if (cache) {
        await cache.set(cacheKey, result, 600);
      }
      
      return result;
      
    } catch (error) {
      logger?.error('Failed to fetch README', { error: error instanceof Error ? error.message : error });
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or README not available`);
      }
      
      throw new Error(`Failed to fetch README: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}, {
  overview: 'Fetch README files from GitHub repositories in various formats',
  parameters: {
    owner: 'Repository owner username or organization',
    repo: 'Repository name',
    format: 'Output format - raw text, rendered HTML, or markdown (default)',
  },
  examples: `
1. Fetch standard README:
   \`{ owner: "microsoft", repo: "typescript", format: "markdown" }\`

2. Get rendered HTML:
   \`{ owner: "facebook", repo: "react", format: "html" }\`

3. Raw content for processing:
   \`{ owner: "rust-lang", repo: "rust", format: "raw" }\`
  `,
  bestPractices: 'Use markdown format for display, raw for processing, and HTML for web rendering. Cache results to avoid rate limits.',
  troubleshooting: 'If you get a 404 error, verify the repository exists and is public. Some repos use README.rst or other formats instead of README.md.',
});

// Export registration function for both tools
export function registerGitHubTools(server: any) {
  // Register search tool
  server.tool(
    githubSearchTool.name,
    githubSearchTool.description,
    githubSearchTool.inputSchema,
    githubSearchTool.handler
  );
  
  // Register README tool
  server.tool(
    githubReadmeTool.name,
    githubReadmeTool.description,
    githubReadmeTool.inputSchema,
    githubReadmeTool.handler
  );
}