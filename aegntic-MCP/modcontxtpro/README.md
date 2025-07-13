# ModContxtPro - Aegntic MCP Standard Framework

> The definitive framework for building production-ready MCP servers with authentication, inspired by the best patterns from successful implementations - ModContxtPro edition.

## 🎯 Mission

The @aegntic/modcontxtpro solves the core pain points of current MCP development:
- **Authentication Complexity**: Seamless OAuth integration out of the box
- **Boilerplate Overhead**: Start building tools in minutes, not hours
- **Scalability Issues**: Cloud-native architecture from day one
- **Documentation Burden**: Self-documenting tools with AI-friendly descriptions
- **Testing Challenges**: Comprehensive test harness included

## 🚀 Features

### Core Innovations

1. **Unified Authentication Layer**
   - GitHub OAuth by default (extensible to other providers)
   - Role-based access control (RBAC) built-in
   - Secure cookie-based session management
   - API key fallback for CI/CD scenarios

2. **Smart Tool Generation**
   - Declarative tool definitions with automatic validation
   - Self-documenting with examples and follow-up prompts
   - Progressive disclosure (essentials vs. full documentation)
   - Automatic TypeScript type generation

3. **Cloud-Native Architecture**
   - Cloudflare Workers deployment (global edge)
   - PostgreSQL/SQLite dual support
   - Durable Objects for stateful operations
   - KV storage for session management

4. **Developer Experience**
   - Single command project generation
   - Hot-reload development server
   - Integrated MCP Inspector
   - Production-ready Docker images

## 📦 Quick Start

```bash
# Install the ModContxtPro framework
npm install @aegntic/modcontxtpro

# Or use as a template
npx create-mcp-server --template @aegntic/modcontxtpro my-server

# Follow the interactive prompts:
# ? Choose authentication method: GitHub OAuth / API Key / None
# ? Select database: PostgreSQL / SQLite / None
# ? Enable cloud deployment: Yes / No
# ? Include example tools: Yes / No

cd my-server
npm install
npm run dev
```

## 🏗️ Project Structure

```
my-modcontxtpro-server/
├── src/
│   ├── index.ts              # Main MCP server entry
│   ├── tools/                # Tool implementations
│   │   ├── index.ts          # Tool registry
│   │   ├── example-tool.ts   # Example tool
│   │   └── types.ts          # Shared types
│   ├── auth/                 # Authentication layer
│   │   ├── github.ts         # GitHub OAuth handler
│   │   └── middleware.ts     # Auth middleware
│   ├── database/             # Database abstraction
│   │   ├── client.ts         # Database client
│   │   └── migrations/       # Schema migrations
│   └── utils/                # Utility functions
├── tests/                    # Test suite
├── wrangler.toml            # Cloudflare config
├── docker-compose.yml       # Local development
├── .env.example             # Environment template
└── README.md                # Auto-generated docs
```

## 🛠️ Tool Definition Pattern

```typescript
// src/tools/my-tool.ts
import { defineTool } from '@aegntic/modcontxtpro';

export const myTool = defineTool({
  name: 'analyze_data',
  description: 'Analyze data with AI-powered insights',
  
  // Schema with automatic validation
  schema: z.object({
    data: z.array(z.number()).describe('Numeric data to analyze'),
    method: z.enum(['mean', 'median', 'std']).default('mean'),
  }),
  
  // Authentication requirements
  auth: {
    required: true,
    roles: ['user', 'admin'],
  },
  
  // Tool metadata for AI assistants
  metadata: {
    examples: [
      {
        input: { data: [1, 2, 3, 4, 5], method: 'mean' },
        output: { result: 3, confidence: 0.95 },
      },
    ],
    followUpPrompts: [
      'Would you like to visualize this data?',
      'Should I perform additional statistical tests?',
    ],
    documentation: {
      essentials: 'Quick statistical analysis of numeric arrays',
      full: 'Comprehensive statistical analysis with multiple methods...',
    },
  },
  
  // Implementation
  handler: async ({ data, method }, context) => {
    // Access user info from context
    const { user, database } = context;
    
    // Perform analysis
    const result = calculateStatistic(data, method);
    
    // Log usage for analytics
    await database.logUsage(user.id, 'analyze_data', { method });
    
    return {
      content: [{
        type: 'text',
        text: `**Analysis Complete**\n\nResult: ${result}`,
      }],
    };
  },
});
```

## 🔐 Authentication Flows

### GitHub OAuth (Recommended)
```typescript
// Automatic user context in every tool
handler: async (params, context) => {
  const { user } = context;
  console.log(`Tool called by: ${user.login}`);
  // user.name, user.email, user.accessToken available
}
```

### API Key Authentication
```typescript
// For CI/CD and programmatic access
const client = new MCPClient({
  endpoint: 'https://my-server.workers.dev',
  apiKey: process.env.MCP_API_KEY,
});
```

## 🌍 Deployment Options

### Cloudflare Workers (Recommended)
```bash
# Configure secrets
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put DATABASE_URL

# Deploy to the edge
wrangler deploy

# Your MCP server is now globally available!
# https://my-modcontxtpro-server.workers.dev/mcp
```

### Docker Deployment
```bash
# Build optimized image
docker build -t my-mcp-server .

# Run with environment variables
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  my-mcp-server
```

### Local Development
```bash
# Start development server with hot-reload
npm run dev

# Access at http://localhost:8787/mcp
# MCP Inspector at http://localhost:8787/inspector
```

## 📊 Built-in Analytics

Every MCP server includes analytics out of the box:

```typescript
// Automatic tracking
- Tool usage frequency
- Response times
- Error rates
- User engagement

// Custom metrics
await context.analytics.track('custom_event', {
  value: 42,
  metadata: { source: 'ai_agent' },
});
```

## 🧪 Testing Framework

```typescript
// tests/my-tool.test.ts
import { testTool } from '@aegntic/modcontxtpro/testing';
import { myTool } from '../src/tools/my-tool';

test('analyze_data calculates mean correctly', async () => {
  const result = await testTool(myTool, {
    input: { data: [1, 2, 3], method: 'mean' },
    user: { login: 'testuser', roles: ['user'] },
  });
  
  expect(result.content[0].text).toContain('Result: 2');
});
```

## 🎯 Real-World Examples

### Example 1: Open Source Documentation Server
```typescript
const planeDocs = defineTool({
  name: 'plane_docs',
  description: 'Access Plane project management documentation',
  schema: z.object({
    query: z.string().describe('Search query'),
    section: z.enum(['api', 'guides', 'reference']).optional(),
  }),
  handler: async ({ query, section }) => {
    // Implementation
  },
});
```

### Example 2: Design Tool Integration
```typescript
const penpotDesign = defineTool({
  name: 'penpot_create',
  description: 'Create designs in Penpot',
  auth: { required: true, roles: ['designer'] },
  schema: z.object({
    projectId: z.string(),
    elements: z.array(PenpotElementSchema),
  }),
  handler: async ({ projectId, elements }, { user }) => {
    // Implementation
  },
});
```

## 🚦 Production Checklist

- [ ] Authentication configured (OAuth secrets set)
- [ ] Database migrations run
- [ ] Environment variables validated
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry DSN)
- [ ] Analytics dashboard configured
- [ ] SSL certificates verified
- [ ] Backup strategy implemented

## 📈 Performance Guarantees

- **Cold Start**: <50ms on Cloudflare Workers
- **Tool Execution**: <200ms p99 latency
- **Global Availability**: 200+ edge locations
- **Uptime**: 99.9% SLA with automatic failover

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ by the Aegntic Team</strong><br>
  <sub>Making MCP development delightful with ModContxtPro</sub>
</div>