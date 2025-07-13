import { defineTool, defineToolWithDocs } from '../../src/core/tool-builder';
import { z } from 'zod';

describe('Tool Builder', () => {
  describe('defineTool', () => {
    it('should create a tool with basic configuration', () => {
      const tool = defineTool({
        name: 'test_tool',
        description: 'A test tool for unit testing',
        schema: z.object({
          input: z.string(),
        }),
        handler: async ({ input }) => {
          return { result: input.toUpperCase() };
        },
      });

      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A test tool for unit testing');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should validate tool name format', () => {
      expect(() => {
        defineTool({
          name: 'Test-Tool', // Invalid format
          description: 'A test tool',
          schema: z.object({}),
          handler: async () => ({}),
        });
      }).toThrow('Invalid tool name');
    });

    it('should validate description length', () => {
      expect(() => {
        defineTool({
          name: 'test_tool',
          description: 'Short', // Too short
          schema: z.object({}),
          handler: async () => ({}),
        });
      }).toThrow('Tool description must be at least 10 characters');
    });

    it('should validate example inputs against schema', () => {
      expect(() => {
        defineTool({
          name: 'test_tool',
          description: 'A test tool with examples',
          schema: z.object({
            number: z.number(),
          }),
          metadata: {
            examples: [
              {
                input: { number: 'not a number' }, // Invalid
                output: { result: 42 },
              },
            ],
          },
          handler: async ({ number }) => ({ result: number * 2 }),
        });
      }).toThrow('Example input does not match schema');
    });
  });

  describe('defineToolWithDocs', () => {
    it('should generate documentation from structured input', () => {
      const tool = defineToolWithDocs(
        {
          name: 'documented_tool',
          description: 'A well-documented tool',
          schema: z.object({
            param1: z.string(),
            param2: z.number(),
          }),
          handler: async ({ param1, param2 }) => ({
            result: `${param1}: ${param2}`,
          }),
        },
        {
          overview: 'This tool does amazing things',
          parameters: {
            param1: 'A string parameter',
            param2: 'A numeric parameter',
          },
          examples: '```\n{ param1: "test", param2: 42 }\n```',
          bestPractices: 'Always validate inputs',
          troubleshooting: 'Check parameter types',
        }
      );

      expect(tool.metadata?.documentation?.essentials).toContain('This tool does amazing things');
      expect(tool.metadata?.documentation?.full).toContain('## Parameters');
      expect(tool.metadata?.documentation?.full).toContain('## Best Practices');
      expect(tool.metadata?.documentation?.full).toContain('## Troubleshooting');
    });
  });

  describe('Tool execution', () => {
    it('should handle authentication requirements', async () => {
      const tool = defineTool({
        name: 'auth_required_tool',
        description: 'A tool requiring authentication',
        schema: z.object({}),
        auth: {
          required: true,
          roles: ['admin'],
        },
        handler: async (_, context) => ({
          userId: context.user?.id,
        }),
      });

      const context = {
        user: undefined,
      };

      await expect(tool.handler({}, context)).rejects.toThrow('Authentication required');
    });

    it('should check role-based access', async () => {
      const tool = defineTool({
        name: 'admin_tool',
        description: 'A tool for admins only',
        schema: z.object({}),
        auth: {
          required: true,
          roles: ['admin'],
        },
        handler: async () => ({ success: true }),
      });

      const context = {
        user: {
          id: '123',
          login: 'user',
          name: 'Test User',
          email: 'user@test.com',
          roles: ['user'], // Not admin
          provider: 'test' as any,
        },
      };

      await expect(tool.handler({}, context)).rejects.toThrow('Insufficient permissions');
    });

    it('should handle caching when enabled', async () => {
      const mockCache = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn(),
      };

      const tool = defineTool({
        name: 'cached_tool',
        description: 'A tool with caching',
        schema: z.object({
          input: z.string(),
        }),
        metadata: {
          performance: {
            estimatedDuration: '<100ms',
            cacheable: true,
          },
        },
        handler: async ({ input }) => ({
          result: input.toUpperCase(),
        }),
      });

      const context = {
        cache: mockCache,
      };

      const result = await tool.handler({ input: 'test' }, context);

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
      expect(result).toEqual({ result: 'TEST' });
    });
  });
});