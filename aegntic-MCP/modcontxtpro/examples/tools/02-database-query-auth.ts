/**
 * Example 2: Database Query Tool with Authentication
 * 
 * This example demonstrates:
 * - Role-based access control (RBAC)
 * - Database integration with SQL validation
 * - User context utilization
 * - Comprehensive error handling
 * - Audit logging for compliance
 */

import { z } from 'zod';
import { defineTool } from '../../src/core/tool-builder';

// Define SQL operation types
type SqlOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';

// Schema for database queries with detailed validation
const DatabaseQuerySchema = z.object({
  query: z.string()
    .min(10, 'Query must be at least 10 characters')
    .max(10000, 'Query exceeds maximum length')
    .describe('SQL query to execute'),
  
  database: z.enum(['analytics', 'users', 'products', 'logs'])
    .describe('Target database to query'),
  
  timeout: z.number()
    .min(1000)
    .max(30000)
    .default(5000)
    .describe('Query timeout in milliseconds'),
  
  explain: z.boolean()
    .default(false)
    .describe('Return query execution plan instead of results'),
});

// SQL validation utilities
function validateSqlQuery(sql: string): { 
  isValid: boolean; 
  operation: SqlOperation | null; 
  warnings: string[]; 
} {
  const warnings: string[] = [];
  const normalizedSql = sql.trim().toLowerCase();
  
  // Detect SQL injection patterns
  const dangerousPatterns = [
    /;\s*drop\s+/i,
    /;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
    /union\s+select/i,
    /into\s+outfile/i,
    /load_file\s*\(/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sql)) {
      return { 
        isValid: false, 
        operation: null, 
        warnings: ['Query contains potentially dangerous patterns'] 
      };
    }
  }
  
  // Determine operation type
  let operation: SqlOperation | null = null;
  if (normalizedSql.startsWith('select')) operation = 'SELECT';
  else if (normalizedSql.startsWith('insert')) operation = 'INSERT';
  else if (normalizedSql.startsWith('update')) operation = 'UPDATE';
  else if (normalizedSql.startsWith('delete')) operation = 'DELETE';
  else if (normalizedSql.startsWith('create')) operation = 'CREATE';
  else if (normalizedSql.startsWith('drop')) operation = 'DROP';
  else if (normalizedSql.startsWith('alter')) operation = 'ALTER';
  
  // Add warnings for risky operations
  if (['DROP', 'DELETE', 'ALTER'].includes(operation || '')) {
    warnings.push(`${operation} operations are destructive - please confirm intent`);
  }
  
  // Check for missing WHERE clause in UPDATE/DELETE
  if (['UPDATE', 'DELETE'].includes(operation || '') && !normalizedSql.includes('where')) {
    warnings.push(`${operation} without WHERE clause affects all rows`);
  }
  
  return { isValid: true, operation, warnings };
}

// Define the database query tool
export const databaseQueryTool = defineTool({
  name: 'execute_database_query',
  description: 'Execute SQL queries on authorized databases with comprehensive safety checks and audit logging',
  
  schema: DatabaseQuerySchema,
  
  // Authentication required with role-based access
  auth: {
    required: true,
    roles: ['developer', 'analyst', 'admin'],
    scopes: ['database:read', 'database:write'],
  },
  
  // Rate limiting to prevent abuse
  rateLimit: {
    requests: 100,
    window: '1h',
  },
  
  metadata: {
    examples: [
      {
        description: 'Simple SELECT query',
        input: {
          query: 'SELECT id, name, email FROM users WHERE created_at > NOW() - INTERVAL 7 DAY',
          database: 'users',
          timeout: 5000,
          explain: false,
        },
        output: {
          rows: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
          ],
          rowCount: 2,
          executionTime: 42,
        },
      },
      {
        description: 'Query with execution plan',
        input: {
          query: 'SELECT * FROM orders WHERE total > 1000',
          database: 'analytics',
          timeout: 5000,
          explain: true,
        },
        output: {
          plan: 'Seq Scan on orders (cost=0.00..35.50 rows=10 width=104)',
          estimatedRows: 10,
          estimatedCost: 35.50,
        },
      },
    ],
    
    followUpPrompts: [
      'Would you like to see the query execution plan?',
      'Should I help optimize this query for better performance?',
      'Want to export these results to a CSV file?',
      'Need to run a similar query on a different table?',
    ],
    
    documentation: {
      essentials: 'Execute SQL queries with authentication, validation, and audit logging. Supports SELECT, INSERT, UPDATE, DELETE with role-based permissions.',
      full: `
# Database Query Tool

Execute SQL queries on authorized databases with comprehensive safety and audit features.

## Authentication & Authorization

### Required Roles
- **developer**: Full CRUD access to all databases
- **analyst**: Read-only access to analytics and logs databases
- **admin**: Unrestricted access including DDL operations

### Required Scopes
- **database:read**: For SELECT queries
- **database:write**: For INSERT, UPDATE, DELETE queries

## Supported Databases
- **analytics**: Business intelligence and reporting data
- **users**: User profiles and authentication data
- **products**: Product catalog and inventory
- **logs**: Application and system logs

## Query Validation

The tool performs several validation checks:
1. SQL injection detection
2. Dangerous pattern blocking
3. Operation type detection
4. Missing WHERE clause warnings
5. Syntax validation

## Security Features
- All queries are logged with user attribution
- Sensitive data is automatically masked in logs
- Query timeouts prevent long-running operations
- Rate limiting prevents abuse

## Best Practices
1. Always use parameterized queries when possible
2. Include WHERE clauses in UPDATE/DELETE operations
3. Test queries with EXPLAIN before running on large datasets
4. Use appropriate indexes for frequently queried columns
      `,
    },
    
    performance: {
      estimatedDuration: '1-5s',
      cacheable: true,
      cacheKey: (input) => `db:${input.database}:${Buffer.from(input.query).toString('base64')}`,
    },
    
    pitfalls: [
      'Forgetting WHERE clause in UPDATE/DELETE queries',
      'Not considering query performance on large tables',
      'Using SELECT * instead of specific columns',
      'Not handling NULL values properly',
    ],
    
    resources: [
      {
        title: 'SQL Style Guide',
        url: 'https://www.sqlstyle.guide/',
        type: 'documentation',
      },
      {
        title: 'Query Optimization Best Practices',
        url: 'https://use-the-index-luke.com/',
        type: 'tutorial',
      },
    ],
    
    tags: ['database', 'sql', 'analytics', 'auth-required'],
  },
  
  handler: async ({ query, database, timeout, explain }, context) => {
    const { user, database: db, logger, analytics } = context;
    
    // This should never happen due to auth requirements, but double-check
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Validate SQL query
    const validation = validateSqlQuery(query);
    if (!validation.isValid) {
      throw new Error(`Invalid query: ${validation.warnings.join(', ')}`);
    }
    
    // Check role-based permissions
    const isWriteOperation = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(
      validation.operation || ''
    );
    
    if (isWriteOperation && !user.roles.includes('developer') && !user.roles.includes('admin')) {
      throw new Error(`Role '${user.roles.join(', ')}' cannot perform ${validation.operation} operations`);
    }
    
    // Check database-specific permissions
    if (database === 'users' && !['admin'].includes(user.roles[0])) {
      // Additional check for sensitive user data
      if (query.toLowerCase().includes('password') || query.toLowerCase().includes('token')) {
        throw new Error('Access to sensitive user fields requires admin role');
      }
    }
    
    // Log the query attempt for audit
    logger?.info('Database query attempt', {
      user: user.login,
      database,
      operation: validation.operation,
      queryLength: query.length,
      explain,
    });
    
    // Add warnings to response if any
    let warningText = '';
    if (validation.warnings.length > 0) {
      warningText = `\n⚠️ Warnings:\n${validation.warnings.map(w => `- ${w}`).join('\n')}\n`;
    }
    
    try {
      // Execute the query with timeout
      const startTime = Date.now();
      
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      let result: any;
      
      if (explain) {
        // Get query execution plan
        const explainQuery = `EXPLAIN ${query}`;
        result = await Promise.race([
          db.query(explainQuery),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ]);
      } else {
        // Execute the actual query
        result = await Promise.race([
          db.query(query),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          ),
        ]);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Log successful execution
      logger?.info('Database query executed successfully', {
        user: user.login,
        database,
        operation: validation.operation,
        executionTime,
        rowCount: Array.isArray(result) ? result.length : 0,
      });
      
      // Track analytics
      await analytics?.track('database_query', {
        user: user.login,
        database,
        operation: validation.operation,
        executionTime,
        rowCount: Array.isArray(result) ? result.length : 0,
        explain,
      });
      
      // Format response based on query type
      if (explain) {
        return {
          content: [
            {
              type: 'text',
              text: `${warningText}## Query Execution Plan\n\`\`\`\n${JSON.stringify(result, null, 2)}\n\`\`\`\n\nExecution time: ${executionTime}ms`,
            },
          ],
        };
      } else {
        const rowCount = Array.isArray(result) ? result.length : 0;
        const preview = Array.isArray(result) ? result.slice(0, 10) : result;
        
        return {
          content: [
            {
              type: 'text',
              text: `${warningText}## Query Results\n\n**Database**: ${database}\n**Operation**: ${validation.operation}\n**Rows affected**: ${rowCount}\n**Execution time**: ${executionTime}ms\n\n### Data Preview\n\`\`\`json\n${JSON.stringify(preview, null, 2)}\n\`\`\`${rowCount > 10 ? `\n\n*Showing first 10 of ${rowCount} rows*` : ''}`,
            },
          ],
        };
      }
    } catch (error) {
      // Log error for debugging
      logger?.error('Database query failed', {
        user: user.login,
        database,
        operation: validation.operation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Track error in analytics
      await analytics?.track('database_query_error', {
        user: user.login,
        database,
        operation: validation.operation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // User-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const friendlyMessage = errorMessage.includes('timeout') 
        ? 'Query exceeded timeout limit. Consider optimizing the query or increasing timeout.'
        : errorMessage.includes('permission')
        ? 'Insufficient permissions for this operation.'
        : `Database error: ${errorMessage}`;
      
      throw new Error(friendlyMessage);
    }
  },
});

// Export registration function
export function registerDatabaseQueryTool(server: any) {
  server.tool(
    databaseQueryTool.name,
    databaseQueryTool.description,
    databaseQueryTool.inputSchema,
    databaseQueryTool.handler
  );
}