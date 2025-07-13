# Aegntic MCP Standard - Authentication System

A flexible, extensible authentication system for MCP servers with support for multiple providers, session management, and role-based access control.

## Features

- **Multiple Authentication Providers**
  - GitHub OAuth 2.0 with organization/team verification
  - API Key authentication with rate limiting
  - JWT (JSON Web Token) authentication
  - No-auth provider for development
  - Easy to extend with custom providers

- **Advanced Security**
  - Role-based access control (RBAC)
  - Permission-based authorization
  - Rate limiting for API keys
  - Secure session management
  - CORS configuration
  - Security headers

- **Session Management**
  - Pluggable storage backends
  - Sliding expiration
  - Maximum concurrent sessions
  - Session lifecycle hooks

## Quick Start

### Development Setup (No Authentication)

```typescript
import { createDevAuthSystem } from './auth';

const auth = createDevAuthSystem();
await auth.initialize();

// Use in your MCP server
app.use(auth.middleware());
```

### Production Setup

```typescript
import { createProductionAuthSystem } from './auth';

const auth = createProductionAuthSystem({
  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  
  // API Keys
  apiKeyValidator: async (key) => {
    // Your custom validation logic
    const user = await db.validateApiKey(key);
    return user;
  },
  
  // Roles
  roles: [
    {
      name: 'admin',
      description: 'Full access',
      permissions: ['*']
    },
    {
      name: 'developer',
      description: 'Developer access',
      permissions: ['read:*', 'write:code'],
      inherits: ['user']
    }
  ]
});

await auth.initialize();
```

## Authentication Providers

### GitHub OAuth

```typescript
import { AuthProvider, AuthConfig } from './auth/types';

const githubConfig: AuthConfig = {
  provider: AuthProvider.GITHUB,
  enabled: true,
  config: {
    clientId: 'your-github-client-id',
    clientSecret: 'your-github-client-secret',
    redirectUri: 'http://localhost:3000/auth/github/callback',
    scope: 'read:user read:org',
    
    // Optional: Restrict to organization members
    allowedOrgs: ['your-org'],
    requireOrgMembership: true,
    
    // Optional: Restrict to team members
    allowedTeams: ['your-org/team-slug']
  }
};
```

#### OAuth Flow

1. Generate authorization URL:
```typescript
const authUrl = auth.getAuthorizationUrl(AuthProvider.GITHUB, {
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/auth/github/callback',
  scope: 'read:user',
  state: 'random-state'
});
```

2. Handle callback:
```typescript
app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  const result = await auth.handleOAuthCallback(
    AuthProvider.GITHUB,
    code as string,
    state as string
  );
  
  if (result.success && result.session) {
    res.setHeader('Set-Cookie', auth.sessionManager.generateSessionCookie(result.session.id));
    res.redirect('/dashboard');
  } else {
    res.status(401).json({ error: result.error });
  }
});
```

### API Key Authentication

```typescript
const apiKeyConfig: AuthConfig = {
  provider: AuthProvider.API_KEY,
  enabled: true,
  config: {
    header: 'X-API-Key',      // Header to check for API key
    query: 'api_key',         // Query parameter to check
    prefix: 'Bearer',         // Optional prefix
    
    // Custom validator
    validator: async (key: string) => {
      const user = await db.findUserByApiKey(key);
      if (!user) return null;
      
      return {
        id: user.id,
        login: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles,
        provider: AuthProvider.API_KEY
      };
    }
  }
};
```

#### Managing API Keys

```typescript
// Generate a new API key
const apiKeyProvider = auth.providers.get(AuthProvider.API_KEY) as ApiKeyProvider;

const apiKey = await apiKeyProvider.generateApiKey({
  userId: 'user123',
  name: 'Production API Key',
  roles: ['developer'],
  permissions: ['read:data', 'write:data'],
  expiresIn: '90d',
  rateLimit: {
    requests: 1000,
    window: '1h'
  }
});

// List user's API keys
const keys = await apiKeyProvider.listApiKeys('user123');

// Revoke an API key
await apiKeyProvider.revokeApiKey('user123', 'Production API Key');
```

### JWT Authentication

```typescript
const jwtConfig: AuthConfig = {
  provider: AuthProvider.JWT,
  enabled: true,
  config: {
    secret: 'your-secret-key',        // For HS256
    // OR
    publicKey: 'your-public-key',     // For RS256
    
    algorithm: 'HS256',
    issuer: 'your-app',
    audience: 'your-api',
    expiresIn: '24h'
  }
};
```

#### Generating JWTs

```typescript
const jwtProvider = auth.providers.get(AuthProvider.JWT) as JwtProvider;

// Generate access token
const token = await jwtProvider.generateToken({
  userId: 'user123',
  email: 'user@example.com',
  name: 'John Doe',
  roles: ['user', 'developer'],
  permissions: ['read:data'],
  expiresIn: '1h'
});

// Generate refresh token
const refreshToken = await jwtProvider.generateRefreshToken({
  userId: 'user123',
  metadata: { deviceId: 'device123' }
});
```

## Using Authentication in MCP Tools

### Basic Authentication Check

```typescript
import { defineTool } from '../core/tool-builder';
import { z } from 'zod';

export const protectedTool = defineTool({
  name: 'protected_operation',
  description: 'A tool that requires authentication',
  schema: z.object({
    data: z.string()
  }),
  
  // Require authentication
  auth: {
    required: true
  },
  
  handler: async (input, context) => {
    // User is guaranteed to be authenticated
    const user = context.user!;
    
    return {
      message: `Hello ${user.name}!`,
      userId: user.id
    };
  }
});
```

### Role-Based Access Control

```typescript
export const adminTool = defineTool({
  name: 'admin_operation',
  description: 'Admin-only operation',
  schema: z.object({
    action: z.string()
  }),
  
  // Require admin role
  auth: {
    required: true,
    roles: ['admin']
  },
  
  handler: async (input, context) => {
    // Only admins can reach this point
    return { success: true };
  }
});
```

### Permission-Based Access

```typescript
export const dataWriteTool = defineTool({
  name: 'write_data',
  description: 'Write data operation',
  schema: z.object({
    data: z.any()
  }),
  
  auth: {
    required: true,
    permissions: ['write:data']
  },
  
  handler: async (input, context) => {
    // User has write:data permission
    return { written: true };
  }
});
```

## Middleware Usage

### Basic Middleware

```typescript
// Require authentication for all routes
app.use(auth.middleware({ required: true }));

// Optional authentication
app.use(auth.middleware({ required: false }));

// Role-based middleware
app.use('/admin/*', auth.middleware({ 
  required: true, 
  roles: ['admin'] 
}));

// Permission-based middleware
app.use('/api/write/*', auth.middleware({ 
  required: true, 
  permissions: ['write:data'] 
}));
```

### Custom Middleware

```typescript
const customAuthMiddleware = auth.middleware({
  required: true,
  roles: ['user'],
  permissions: ['read:data']
});

app.get('/protected', customAuthMiddleware, async (req, res) => {
  // User is authenticated with proper roles and permissions
  res.json({ user: req.user });
});
```

## Session Management

### Session Configuration

```typescript
import { SessionManager, MemorySessionStore } from './auth/session-manager';

const sessionManager = new SessionManager({
  store: new MemorySessionStore(),      // Or implement custom store
  sessionTTL: 86400,                     // 24 hours
  maxSessions: 5,                        // Max 5 concurrent sessions per user
  slidingExpiration: true,               // Extend on activity
  cookieName: 'mcp-session',
  cookieSecure: true,
  cookieSameSite: 'lax'
});
```

### Custom Session Store

```typescript
import { SessionStore, Session } from './auth/session-manager';

class RedisSessionStore implements SessionStore {
  private redis: RedisClient;
  
  async get(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
  
  async set(sessionId: string, session: Session, ttl?: number): Promise<void> {
    await this.redis.setex(
      `session:${sessionId}`,
      ttl || 86400,
      JSON.stringify(session)
    );
  }
  
  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
  
  async clear(): Promise<void> {
    // Clear all sessions
  }
  
  async size(): Promise<number> {
    // Return session count
  }
}
```

## Extending with Custom Providers

```typescript
import { IAuthProvider, AuthProvider, AuthContext, AuthResult } from './auth/types';

export class CustomAuthProvider implements IAuthProvider {
  name = 'Custom Auth';
  type = AuthProvider.CUSTOM;
  
  async initialize(config: any): Promise<void> {
    // Initialize your provider
  }
  
  async authenticate(context: AuthContext): Promise<AuthResult> {
    // Your authentication logic
    const token = context.headers.get('X-Custom-Token');
    
    if (!token) {
      return {
        success: false,
        error: 'No token provided'
      };
    }
    
    // Validate token and return user
    const user = await this.validateToken(token);
    
    return {
      success: true,
      user
    };
  }
  
  // Implement other optional methods as needed
}

// Register the provider
const auth = new AuthenticationSystem({
  providers: [{
    provider: AuthProvider.CUSTOM,
    enabled: true,
    config: {
      // Your custom config
    }
  }]
});
```

## Security Best Practices

1. **Always use HTTPS in production**
   - Set `cookieSecure: true` for session cookies
   - Use secure redirect URIs for OAuth

2. **Validate all inputs**
   - Use Zod schemas for validation
   - Sanitize user inputs

3. **Rate limiting**
   - Enable rate limiting for API keys
   - Implement global rate limiting

4. **Token security**
   - Use strong secrets for JWT
   - Rotate secrets regularly
   - Set appropriate expiration times

5. **Session security**
   - Use secure session IDs
   - Implement session fixation protection
   - Clear sessions on logout

6. **CORS configuration**
   - Configure allowed origins explicitly
   - Don't use wildcard (*) in production

## Example: Complete MCP Server with Auth

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createProductionAuthSystem } from './auth';
import { defineTool } from './core/tool-builder';
import { z } from 'zod';

// Initialize auth system
const auth = createProductionAuthSystem({
  githubClientId: process.env.GITHUB_CLIENT_ID!,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
  jwtSecret: process.env.JWT_SECRET!
});

// Define authenticated tools
const listUserData = defineTool({
  name: 'list_user_data',
  description: 'List data for authenticated user',
  schema: z.object({}),
  auth: { required: true },
  handler: async (input, context) => {
    const user = context.user!;
    
    // Fetch user-specific data
    const data = await db.getUserData(user.id);
    
    return { data };
  }
});

// Create MCP server with auth context
const server = new Server(
  {
    name: 'authenticated-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add tools with auth context
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: listUserData.name,
        description: listUserData.description,
        inputSchema: listUserData.inputSchema,
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Extract auth from request context
  const authResult = await auth.authenticate(request as any);
  
  if (!authResult.success) {
    throw new Error('Authentication required');
  }
  
  // Create context with user
  const context = {
    user: authResult.user,
    // Add other context properties
  };
  
  // Call tool with auth context
  if (request.params.name === 'list_user_data') {
    return await listUserData.handler(request.params.arguments, context);
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
async function main() {
  await auth.initialize();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

## Troubleshooting

### Common Issues

1. **"No authentication provider available"**
   - Ensure at least one provider is enabled
   - Check provider configuration

2. **"Invalid or expired token"**
   - Verify token hasn't expired
   - Check secret/key configuration

3. **"Rate limit exceeded"**
   - Wait for rate limit window to reset
   - Increase rate limits if needed

4. **"Insufficient permissions"**
   - Verify user has required roles
   - Check role inheritance

### Debug Mode

Enable debug logging:

```typescript
const auth = new AuthenticationSystem({
  // ... config
  debug: true
});
```

### Health Check

```typescript
// Check auth system health
const health = {
  providers: auth.getProviders(),
  sessionCount: await auth.sessionManager.getSessionCount(),
  activeUsers: auth.sessionManager.getActiveUserCount()
};
```