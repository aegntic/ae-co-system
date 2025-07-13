# Aegntic MCP Standard - Example Tools

This directory contains comprehensive examples demonstrating the capabilities of the aegntic-mcp-standard framework. Each example showcases different features and patterns for building production-ready MCP tools.

## 📚 Examples Overview

### 1. [Hello World Tool](./01-hello-world.ts)
**Simple greeting generator with i18n support**

Demonstrates:
- Basic tool definition using `defineTool`
- Input validation with Zod schemas
- Multi-language support
- Caching with custom cache keys
- Analytics tracking
- Rich metadata for AI assistants

Perfect for: Getting started with the framework

### 2. [Database Query Tool with Auth](./02-database-query-auth.ts)
**Secure database access with RBAC**

Demonstrates:
- Role-based access control (RBAC)
- SQL query validation and sanitization
- User context utilization
- Audit logging for compliance
- Comprehensive error handling
- Operation-specific permissions

Perfect for: Building secure data access tools

### 3. [Open Source Integration](./03-open-source-integration.ts)
**GitHub API integration following aegntic-hive patterns**

Demonstrates:
- External API integration
- Local-first pattern (no auth required)
- Error handling and fallbacks
- Response caching for API rate limits
- Multiple related tools in one module
- Progressive documentation with `defineToolWithDocs`

Perfect for: Integrating with third-party services

### 4. [Weather Tool with Rate Limiting & Caching](./04-rate-limit-cache.ts)
**Advanced features for production APIs**

Demonstrates:
- In-memory rate limiting implementation
- Multi-tier caching strategy (L1/L2)
- Cost-aware API usage
- Graceful degradation with mock data
- Premium tier support
- Performance optimization

Perfect for: Building scalable, cost-effective tools

## 🚀 Running the Examples

Each example can be run standalone for testing:

```bash
# Install dependencies first
npm install zod axios

# Run individual examples
npx ts-node examples/tools/01-hello-world.ts
npx ts-node examples/tools/02-database-query-auth.ts
npx ts-node examples/tools/03-open-source-integration.ts
npx ts-node examples/tools/04-rate-limit-cache.ts
```

## 🏗️ Using in Your MCP Server

### Basic Integration

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerHelloWorldTool } from './examples/tools/01-hello-world';
import { registerDatabaseQueryTool } from './examples/tools/02-database-query-auth';
import { registerGitHubTools } from './examples/tools/03-open-source-integration';
import { registerWeatherTool } from './examples/tools/04-rate-limit-cache';

const server = new Server({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// Register all example tools
registerHelloWorldTool(server);
registerDatabaseQueryTool(server);
registerGitHubTools(server);
registerWeatherTool(server);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### With Authentication Context

```typescript
// Middleware to inject user context
server.setRequestHandler(CallToolRequestSchema, async (request, context) => {
  // Get user from auth token
  const user = await authenticateUser(context.headers);
  
  // Create tool context
  const toolContext = {
    user,
    database: databaseClient,
    cache: cacheClient,
    analytics: analyticsClient,
    logger: winston.createLogger({ /* config */ }),
  };
  
  // Find and execute tool
  const tool = findToolByName(request.params.name);
  return await tool.handler(request.params.arguments, toolContext);
});
```

## 📋 Key Patterns Demonstrated

### 1. **Input Validation**
All examples use Zod schemas for automatic validation and type safety:
```typescript
const schema = z.object({
  param: z.string().min(2).describe('Parameter description'),
});
```

### 2. **Rich Metadata**
Every tool includes comprehensive metadata for AI assistants:
```typescript
metadata: {
  examples: [...],
  followUpPrompts: [...],
  documentation: { essentials: '...', full: '...' },
  performance: { estimatedDuration: '<100ms', cacheable: true },
}
```

### 3. **Error Handling**
Consistent error handling with user-friendly messages:
```typescript
try {
  // Tool logic
} catch (error) {
  logger?.error('Operation failed', { error });
  throw new Error('User-friendly error message');
}
```

### 4. **Performance Optimization**
- Caching strategies (in-memory, multi-tier)
- Rate limiting to prevent abuse
- Graceful degradation
- Response time tracking

### 5. **Security**
- Role-based access control
- Input sanitization
- Audit logging
- Sensitive data protection

## 🎯 Best Practices

1. **Always validate inputs** - Use Zod schemas for all parameters
2. **Provide examples** - Help AI understand usage patterns
3. **Cache when possible** - Reduce latency and API costs
4. **Handle errors gracefully** - Never expose internal errors
5. **Track usage** - Use analytics for monitoring and optimization
6. **Document thoroughly** - Use two-tier documentation (essentials + full)
7. **Consider rate limits** - Protect your resources and external APIs
8. **Test standalone** - Each tool should be independently testable

## 🔗 Additional Resources

- [Aegntic MCP Standard Documentation](../../README.md)
- [Pattern Analysis](../../docs/PATTERN_ANALYSIS.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io/docs)
- [Zod Documentation](https://zod.dev/)

## 🤝 Contributing

When creating new examples:
1. Follow the established patterns
2. Include comprehensive comments
3. Add standalone testing code
4. Document all features demonstrated
5. Keep examples focused but complete

---

<div align="center">
  <strong>Happy Building with Aegntic MCP Standard! 🚀</strong>
</div>