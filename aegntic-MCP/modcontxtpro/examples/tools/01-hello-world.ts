/**
 * Example 1: Simple Hello World Tool
 * 
 * This example demonstrates the minimal implementation of a tool using the
 * aegntic-mcp-standard framework. It shows:
 * - Basic tool definition
 * - Input validation with Zod
 * - Simple response formatting
 * - No authentication required
 */

import { z } from 'zod';
import { defineTool } from '../../src/core/tool-builder';

// Define the input schema using Zod for automatic validation
const GreetingSchema = z.object({
  name: z.string().describe('The name of the person to greet'),
  language: z.enum(['en', 'es', 'fr', 'de', 'ja']).default('en').describe('Language for the greeting'),
  excited: z.boolean().default(false).describe('Whether to make the greeting excited'),
});

// Define the hello world tool
export const helloWorldTool = defineTool({
  name: 'greet_user',
  description: 'Generate a personalized greeting in multiple languages',
  
  // Schema is automatically used for validation
  schema: GreetingSchema,
  
  // No authentication required for this simple tool
  auth: {
    required: false,
  },
  
  // Rich metadata for AI assistants
  metadata: {
    // Examples help AI understand usage patterns
    examples: [
      {
        description: 'Basic greeting in English',
        input: { name: 'Alice', language: 'en', excited: false },
        output: { greeting: 'Hello, Alice!' },
      },
      {
        description: 'Excited greeting in Spanish',
        input: { name: 'Carlos', language: 'es', excited: true },
        output: { greeting: '¡Hola, Carlos! 🎉' },
      },
    ],
    
    // Follow-up prompts guide conversation flow
    followUpPrompts: [
      'Would you like to greet someone else?',
      'Should I explain how to add more languages?',
      'Want to see the greeting in a different language?',
    ],
    
    // Two-tier documentation
    documentation: {
      essentials: 'Simple greeting generator supporting 5 languages with optional excitement.',
      full: `
# Greet User Tool

This tool generates personalized greetings in multiple languages.

## Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)

## Parameters
- **name**: The person's name to include in the greeting
- **language**: The language code for the greeting (defaults to 'en')
- **excited**: Whether to add excitement indicators like exclamation marks and emojis

## Usage Tips
- Names are used as-is without translation
- Excited mode adds culturally appropriate excitement indicators
- Default language is English if not specified
      `,
    },
    
    // Performance hints
    performance: {
      estimatedDuration: '<100ms',
      cacheable: true,
      // Cache based on all parameters
      cacheKey: (input) => `greet:${input.name}:${input.language}:${input.excited}`,
    },
    
    // Tags for categorization
    tags: ['greeting', 'i18n', 'simple'],
  },
  
  // The actual implementation
  handler: async ({ name, language, excited }, context) => {
    // Use logger if available
    context.logger?.info('Generating greeting', { name, language, excited });
    
    // Generate greeting based on language
    const greetings: Record<string, string> = {
      en: `Hello, ${name}`,
      es: `¡Hola, ${name}`,
      fr: `Bonjour, ${name}`,
      de: `Hallo, ${name}`,
      ja: `こんにちは、${name}さん`,
    };
    
    let greeting = greetings[language] || greetings.en;
    
    // Add excitement if requested
    if (excited) {
      greeting = language === 'es' ? `${greeting}! 🎉` : `${greeting}! 🎉`;
    } else {
      greeting = language === 'es' ? `${greeting}!` : `${greeting}!`;
    }
    
    // Track usage if analytics available
    if (context.analytics) {
      await context.analytics.track('greeting_generated', {
        language,
        excited,
        hasUser: !!context.user,
      });
    }
    
    // Return MCP-compliant response
    return {
      content: [
        {
          type: 'text',
          text: greeting,
        },
      ],
    };
  },
});

// Export a function to register this tool with an MCP server
export function registerHelloWorldTool(server: any) {
  server.tool(
    helloWorldTool.name,
    helloWorldTool.description,
    helloWorldTool.inputSchema,
    helloWorldTool.handler
  );
}

// Example usage in a standalone script
if (require.main === module) {
  (async () => {
    console.log('Testing Hello World Tool...\n');
    
    // Test basic greeting
    const result1 = await helloWorldTool.handler(
      { name: 'World', language: 'en', excited: false },
      { logger: console }
    );
    console.log('Basic:', result1.content[0].text);
    
    // Test excited greeting in different language
    const result2 = await helloWorldTool.handler(
      { name: 'María', language: 'es', excited: true },
      { logger: console }
    );
    console.log('Excited Spanish:', result2.content[0].text);
    
    // Test with caching simulation
    const cache = new Map();
    const cachedContext = {
      logger: console,
      cache: {
        get: async (key: string) => cache.get(key),
        set: async (key: string, value: any) => { cache.set(key, value); },
        delete: async (key: string) => { cache.delete(key); },
      },
    };
    
    // First call - will be cached
    const result3 = await helloWorldTool.handler(
      { name: 'Cache Test', language: 'en', excited: false },
      cachedContext
    );
    console.log('\nFirst call:', result3.content[0].text);
    
    // Cache the result
    const cacheKey = helloWorldTool.metadata!.performance!.cacheKey!({ 
      name: 'Cache Test', 
      language: 'en', 
      excited: false 
    });
    await cachedContext.cache.set(cacheKey, result3);
    
    // Second call - should hit cache
    const cachedResult = await cachedContext.cache.get(cacheKey);
    console.log('From cache:', cachedResult ? 'HIT' : 'MISS');
  })();
}