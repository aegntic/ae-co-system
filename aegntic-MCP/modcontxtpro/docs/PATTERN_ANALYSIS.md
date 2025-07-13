# Aegntic MCP Pattern Analysis

This document analyzes patterns found across three MCP server implementations to establish best practices and standard patterns for building MCP servers.

## Table of Contents
- [Authentication Patterns](#authentication-patterns)
- [Tool Definition Patterns](#tool-definition-patterns)
- [Database Patterns](#database-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Documentation Patterns](#documentation-patterns)
- [Server Structure Patterns](#server-structure-patterns)

## Authentication Patterns

### 1. No Authentication (Basic MCP)
**Example:** aegntic-hive-mcp
```javascript
// Direct MCP server without authentication layer
const server = new Server({
    name: 'aegntic-hive-mcp',
    version: '1.0.0',
});
```

**Use Case:** Local-only servers, development environments, or when authentication is handled at a different layer.

### 2. API Key Authentication
**Example:** n8n-pro (via environment variables)
```typescript
// Configuration-based authentication
const isConfigured = isN8nApiConfigured();
if (isConfigured) {
    tools.push(...n8nManagementTools);
}

// Environment variables
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key
```

**Use Case:** Server-to-server communication, API integrations.

### 3. OAuth 2.0 Authentication
**Example:** remote-mcp-server-with-auth
```typescript
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
    apiHandlers: {
        '/sse': MyMCP.serveSSE('/sse'),
        '/mcp': MyMCP.serve('/mcp'),
    },
    authorizeEndpoint: "/authorize",
    defaultHandler: GitHubHandler,
    tokenEndpoint: "/token",
});
```

**Key Features:**
- GitHub OAuth integration
- Role-based access control
- User props passed to tools
- Cookie-based session management

### 4. Role-Based Access Control (RBAC)
**Example:** remote-mcp-server-with-auth
```typescript
const ALLOWED_USERNAMES = new Set<string>([
    'coleam00'
]);

if (ALLOWED_USERNAMES.has(props.login)) {
    server.tool("executeDatabase", ...);
}
```

**Best Practice:** Conditional tool registration based on user permissions.

## Tool Definition Patterns

### 1. Tool Registration Pattern
**Common Structure:**
```typescript
server.tool(
    "toolName",                    // Unique identifier
    "Tool description",            // Human-readable description
    zodSchema,                     // Input validation schema
    async (args) => { ... }        // Handler function
);
```

### 2. Tool Schema Definition
**Using Zod for validation:**
```typescript
const QueryDatabaseSchema = z.object({
    sql: z.string().describe("SQL query to execute")
});

const ListTablesSchema = z.object({});  // No parameters

const ComplexSchema = z.object({
    service: z.enum(['chatgpt', 'grok', 'gemini', 'claude']),
    limit: z.number().default(50),
    offset: z.number().default(0)
});
```

### 3. Tool Response Pattern
**Standard response format:**
```typescript
return {
    content: [
        {
            type: "text",
            text: "Result text or JSON.stringify(data, null, 2)"
        }
    ]
};
```

### 4. Modular Tool Organization
**Example:** remote-mcp-server-with-auth
```typescript
// src/tools/register-tools.ts
export function registerAllTools(server: McpServer, env: Env, props: Props) {
    registerDatabaseTools(server, env, props);
    registerSimpleMathTools(server, env, props);
    // Add more tool categories
}
```

### 5. Tool Categories Pattern
**Common tool categories:**
- Data Access (list, get, search)
- Data Modification (create, update, delete)
- Analytics (analyze, summarize, insights)
- Import/Export (export_to_json, import_from_json)
- Utility (convert, validate, transform)

## Database Patterns

### 1. SQLite Pattern (Local Storage)
**Example:** aegntic-hive-mcp
```javascript
class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'conversations.db'));
        this.init();
    }
    
    init() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS ...`);
        });
    }
}
```

### 2. PostgreSQL Pattern (Remote Database)
**Example:** remote-mcp-server-with-auth
```typescript
export async function withDatabase<T>(
    databaseUrl: string,
    operation: (db: Sql) => Promise<T>
): Promise<T> {
    const sql = getDb(databaseUrl);
    try {
        return await operation(sql);
    } finally {
        await closeDb();
    }
}
```

### 3. Database Security Patterns
```typescript
// SQL Validation
export function validateSqlQuery(sql: string): SqlValidationResult {
    const dangerousPatterns = [
        /;\s*drop\s+/i,
        /;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
        // ... more patterns
    ];
}

// Operation Classification
export function isWriteOperation(sql: string): boolean {
    const writeKeywords = ['insert', 'update', 'delete', 'create', 'drop'];
    return writeKeywords.some(keyword => 
        trimmedSql.startsWith(keyword)
    );
}
```

### 4. Repository Pattern
**Example:** n8n-pro
```typescript
export class NodeRepository {
    constructor(private db: DatabaseAdapter) {}
    
    getNode(nodeType: string): ParsedNode | null {
        // Implementation
    }
    
    searchNodes(query: string): ParsedNode[] {
        // Implementation
    }
}
```

## Error Handling Patterns

### 1. Custom Error Classes
**Example:** n8n-pro
```typescript
export class MCPError extends Error {
    public code: string;
    public statusCode?: number;
    public data?: any;
}

export class AuthenticationError extends MCPError {
    constructor(message: string = 'Authentication failed') {
        super(message, 'AUTH_ERROR', 401);
    }
}

export class ValidationError extends MCPError {
    constructor(message: string, data?: any) {
        super(message, 'VALIDATION_ERROR', 400, data);
    }
}
```

### 2. Error Response Pattern
```typescript
// Consistent error response format
return {
    content: [{
        type: 'text',
        text: `Error: ${error.message}`
    }],
    isError: true
};
```

### 3. Error Handling Wrapper
```typescript
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        logger.error(`Error in ${context}:`, error);
        throw handleError(error);
    }
}
```

### 4. User-Friendly Error Messages
```typescript
export function formatDatabaseError(error: unknown): string {
    if (error.message.includes('password')) {
        return "Database authentication failed.";
    }
    if (error.message.includes('timeout')) {
        return "Database connection timed out.";
    }
    return `Database error: ${error.message}`;
}
```

## Documentation Patterns

### 1. README Structure
**Common sections:**
```markdown
# Project Name

## Overview
Brief description and key features

## Features
- 🔐 Security features
- 🗄️ Data features
- 🔍 Search capabilities

## Setup
1. Install Dependencies
2. Configure Environment
3. Run Server

## Usage
### Tool Examples
Specific examples for each tool

## Configuration
Environment variables and options

## Architecture
Technical details and design decisions
```

### 2. Tool Documentation
**In-code documentation:**
```typescript
server.tool(
    "toolName",
    "Comprehensive description explaining what the tool does, " +
    "when to use it, and what results to expect. Include any " +
    "prerequisites or limitations.",
    schema,
    handler
);
```

### 3. Configuration Examples
**Multiple configuration levels:**
```json
// Basic configuration
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"]
    }
  }
}

// Advanced configuration with auth
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "your-key",
        "DATABASE_URL": "connection-string"
      }
    }
  }
}
```

## Server Structure Patterns

### 1. Project Structure
```
mcp-server/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # Server setup
│   ├── tools/             # Tool implementations
│   │   ├── register-tools.ts
│   │   └── [category]-tools.ts
│   ├── database/          # Database utilities
│   ├── auth/              # Authentication
│   └── utils/             # Shared utilities
├── tests/                 # Test files
├── docs/                  # Documentation
├── package.json
└── README.md
```

### 2. Server Initialization Pattern
```typescript
export class MCPServer {
    constructor() {
        this.server = new Server(config, capabilities);
        this.setupHandlers();
        this.initializeDatabase();
    }
    
    private setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, ...);
        this.server.setRequestHandler(CallToolRequestSchema, ...);
    }
    
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}
```

### 3. Environment Configuration
```typescript
// Environment variable validation
export function validateEnvironment(): EnvironmentConfig {
    const required = ['DATABASE_URL', 'API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    
    return {
        databaseUrl: process.env.DATABASE_URL!,
        apiKey: process.env.API_KEY!,
        // Optional with defaults
        logLevel: process.env.LOG_LEVEL || 'info',
    };
}
```

### 4. Logging Pattern
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
```

## Best Practices Summary

1. **Authentication**: Choose based on deployment model
   - Local: No auth needed
   - API: Environment variable keys
   - Public: OAuth with RBAC

2. **Tools**: Keep them focused and well-documented
   - Single responsibility per tool
   - Clear naming conventions
   - Comprehensive descriptions
   - Proper input validation

3. **Database**: Use appropriate patterns
   - SQLite for local storage
   - PostgreSQL for production
   - Always validate SQL queries
   - Use connection pooling

4. **Error Handling**: Be consistent and user-friendly
   - Custom error classes
   - Proper error codes
   - Hide sensitive information
   - Log for debugging

5. **Documentation**: Make it comprehensive
   - Clear setup instructions
   - Usage examples for each tool
   - Architecture documentation
   - Configuration examples

6. **Code Organization**: Keep it modular
   - Separate concerns
   - Use TypeScript for type safety
   - Implement proper testing
   - Follow consistent patterns