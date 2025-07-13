import { z } from 'zod';
import { Tool } from '../types';
import type { ToolMetadata as BaseToolMetadata, ToolContext as BaseToolContext } from '../types';

/**
 * ModContxtPro - Aegntic MCP Standard Tool Builder
 * 
 * This is the core innovation - a declarative, type-safe tool builder
 * that eliminates boilerplate while providing maximum flexibility.
 */

export interface ToolDefinition<TInput = any, TOutput = any> {
  // Basic tool info
  name: string;
  description: string;
  
  // Zod schema for automatic validation
  schema: z.ZodSchema<TInput>;
  
  // Authentication requirements
  auth?: {
    required: boolean;
    roles?: string[];
    scopes?: string[];
  };
  
  // Rich metadata for AI assistants
  metadata?: ToolMetadata;
  
  // Rate limiting
  rateLimit?: {
    requests: number;
    window: string; // e.g., '1m', '1h', '1d'
  };
  
  // The actual implementation
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>;
}

export interface ToolMetadata extends BaseToolMetadata {
  // Examples for AI to learn from
  examples?: Array<{
    description?: string;
    input: any;
    output: any;
  }>;
  
  // Follow-up prompts to guide conversation
  followUpPrompts?: string[];
  
  // Resources for deeper understanding
  resources?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'api_reference' | 'example';
  }>;
  
  // Two-tier documentation
  documentation?: {
    essentials: string; // Quick 2-3 sentence summary
    full: string;       // Comprehensive documentation
  };
  
  // Performance hints
  performance?: {
    estimatedDuration: string; // e.g., '<100ms', '1-5s', '>5s'
    cacheable: boolean;
    cacheKey?: (input: any) => string;
  };
  
  // Common pitfalls to avoid
  pitfalls?: string[];
  
  // Tags for categorization
  tags?: string[];
}

export interface ToolContext extends BaseToolContext {
  // User information from auth
  user?: {
    id: string;
    login: string;
    name: string;
    email: string;
    roles: string[];
    accessToken?: string;
  };
  
  // Database access
  database?: {
    query: <T>(sql: string, params?: any[]) => Promise<T[]>;
    execute: (sql: string, params?: any[]) => Promise<any>;
  };
  
  // Analytics tracking
  analytics?: {
    track: (event: string, properties?: Record<string, any>) => Promise<void>;
  };
  
  // Caching layer
  cache?: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  
  // Logger
  logger?: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
  };
}

/**
 * Define a tool with full type safety and automatic features
 */
export function defineTool<TInput = any, TOutput = any>(
  definition: ToolDefinition<TInput, TOutput>
): Tool {
  // Validate the definition
  validateToolDefinition(definition);
  
  // Create the tool object
  const tool: Tool = {
    name: definition.name,
    description: definition.description,
    
    // Input validation using Zod
    inputSchema: definition.schema,
    
    // Enhanced handler with automatic features
    handler: async (input: any, context: ToolContext) => {
      // Authentication check
      if (definition.auth?.required && !context.user) {
        throw new Error('Authentication required');
      }
      
      // Role-based access control
      if (definition.auth?.roles && context.user) {
        const hasRole = definition.auth.roles.some(role => 
          context.user!.roles.includes(role)
        );
        if (!hasRole) {
          throw new Error(`Insufficient permissions. Required roles: ${definition.auth.roles.join(', ')}`);
        }
      }
      
      // Input validation
      const validatedInput = definition.schema.parse(input);
      
      // Performance tracking
      const startTime = Date.now();
      
      try {
        // Check cache if applicable
        if (definition.metadata?.performance?.cacheable && context.cache) {
          const cacheKey = definition.metadata.performance.cacheKey
            ? definition.metadata.performance.cacheKey(validatedInput)
            : `${definition.name}:${JSON.stringify(validatedInput)}`;
          
          const cached = await context.cache.get(cacheKey);
          if (cached) {
            context.logger?.info(`Cache hit for ${definition.name}`);
            return cached;
          }
        }
        
        // Execute the handler
        const result = await definition.handler(validatedInput, context);
        
        // Cache the result if applicable
        if (definition.metadata?.performance?.cacheable && context.cache) {
          const cacheKey = definition.metadata.performance.cacheKey
            ? definition.metadata.performance.cacheKey(validatedInput)
            : `${definition.name}:${JSON.stringify(validatedInput)}`;
          
          await context.cache.set(cacheKey, result, 300); // 5 minute default TTL
        }
        
        // Track analytics
        if (context.analytics) {
          const duration = Date.now() - startTime;
          await context.analytics.track('tool_execution', {
            tool: definition.name,
            duration,
            user: context.user?.login,
            success: true,
          });
        }
        
        return result;
      } catch (error) {
        // Track error
        if (context.analytics) {
          const duration = Date.now() - startTime;
          await context.analytics.track('tool_execution', {
            tool: definition.name,
            duration,
            user: context.user?.login,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        
        // Log error
        context.logger?.error(`Tool ${definition.name} failed`, {
          error: error instanceof Error ? error.message : error,
          input: validatedInput,
          user: context.user?.login,
        });
        
        throw error;
      }
    },
    
    // Attach metadata
    metadata: definition.metadata,
    auth: definition.auth,
    rateLimit: definition.rateLimit,
  };
  
  return tool;
}

/**
 * Validate tool definition for common issues
 */
function validateToolDefinition(definition: ToolDefinition): void {
  // Name validation
  if (!definition.name.match(/^[a-z_][a-z0-9_]*$/)) {
    throw new Error(`Invalid tool name '${definition.name}'. Must be lowercase with underscores.`);
  }
  
  // Description validation
  if (definition.description.length < 10) {
    throw new Error('Tool description must be at least 10 characters');
  }
  
  // Schema validation
  if (!definition.schema) {
    throw new Error('Tool must have a Zod schema for input validation');
  }
  
  // Handler validation
  if (typeof definition.handler !== 'function') {
    throw new Error('Tool handler must be a function');
  }
  
  // Metadata validation
  if (definition.metadata?.examples) {
    for (const example of definition.metadata.examples) {
      try {
        definition.schema.parse(example.input);
      } catch (error) {
        throw new Error(`Example input does not match schema: ${JSON.stringify(example.input)}`);
      }
    }
  }
}

/**
 * Create a tool with progressive disclosure documentation
 */
export function defineToolWithDocs<TInput = any, TOutput = any>(
  definition: ToolDefinition<TInput, TOutput>,
  documentation: {
    overview: string;
    parameters: Record<string, string>;
    examples: string;
    bestPractices?: string;
    troubleshooting?: string;
  }
): Tool {
  // Auto-generate documentation from structured input
  const essentials = `${documentation.overview} Key parameters: ${Object.keys(documentation.parameters).join(', ')}.`;
  
  const full = `
${documentation.overview}

## Parameters
${Object.entries(documentation.parameters)
  .map(([param, desc]) => `- **${param}**: ${desc}`)
  .join('\n')}

## Examples
${documentation.examples}

${documentation.bestPractices ? `## Best Practices\n${documentation.bestPractices}\n\n` : ''}
${documentation.troubleshooting ? `## Troubleshooting\n${documentation.troubleshooting}` : ''}
`.trim();
  
  return defineTool({
    ...definition,
    metadata: {
      ...definition.metadata,
      documentation: {
        essentials,
        full,
      },
    },
  });
}