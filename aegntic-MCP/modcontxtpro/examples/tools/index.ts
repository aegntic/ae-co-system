/**
 * Aegntic MCP Standard - Example Tools Index
 * 
 * This file exports all example tools for easy integration
 */

// Export all tools and their registration functions
export { helloWorldTool, registerHelloWorldTool } from './01-hello-world';
export { databaseQueryTool, registerDatabaseQueryTool } from './02-database-query-auth';
export { githubSearchTool, githubReadmeTool, registerGitHubTools } from './03-open-source-integration';
export { weatherTool, registerWeatherTool } from './04-rate-limit-cache';

// Export a function to register all example tools at once
export function registerAllExampleTools(server: any) {
  const { registerHelloWorldTool } = require('./01-hello-world');
  const { registerDatabaseQueryTool } = require('./02-database-query-auth');
  const { registerGitHubTools } = require('./03-open-source-integration');
  const { registerWeatherTool } = require('./04-rate-limit-cache');
  
  registerHelloWorldTool(server);
  registerDatabaseQueryTool(server);
  registerGitHubTools(server);
  registerWeatherTool(server);
  
  console.log('✅ All example tools registered successfully');
}

// Export tool metadata for discovery
export const exampleTools = [
  {
    name: 'greet_user',
    category: 'basic',
    description: 'Simple greeting generator with i18n support',
    file: '01-hello-world.ts',
  },
  {
    name: 'execute_database_query',
    category: 'database',
    description: 'Secure database access with RBAC',
    file: '02-database-query-auth.ts',
    requiresAuth: true,
  },
  {
    name: 'search_github_repos',
    category: 'integration',
    description: 'Search GitHub repositories',
    file: '03-open-source-integration.ts',
  },
  {
    name: 'fetch_github_readme',
    category: 'integration',
    description: 'Fetch README from GitHub',
    file: '03-open-source-integration.ts',
  },
  {
    name: 'get_weather_info',
    category: 'api',
    description: 'Weather data with caching and rate limiting',
    file: '04-rate-limit-cache.ts',
    features: ['rate-limiting', 'multi-tier-cache'],
  },
];