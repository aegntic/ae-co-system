/**
 * ModContxtPro - Aegntic MCP Standard Framework
 * 
 * The definitive framework for building production-ready MCP servers
 * with authentication and advanced features.
 */

// Export everything from types
export * from './types';

// Export tool builder
export { 
  defineTool, 
  defineToolWithDocs 
} from './core/tool-builder';

// Export authentication system
export * from './auth';

// Version information
export const VERSION = '1.0.0';
export const FRAMEWORK_NAME = '@aegntic/modcontxtpro';

// Re-export commonly used types for convenience
export type {
  Tool,
  ToolAuth,
  ToolMetadata,
  ToolContext,
  User,
  Database,
  Analytics,
  Cache,
  Logger,
  MCPResponse,
  RateLimit
} from './types';

export type {
  ToolDefinition,
  ToolContext as ToolBuilderContext
} from './core/tool-builder';

/**
 * Default export for easy importing
 */
export default {
  VERSION,
  FRAMEWORK_NAME,
  defineTool: require('./core/tool-builder').defineTool,
  defineToolWithDocs: require('./core/tool-builder').defineToolWithDocs,
  createDevAuthSystem: require('./auth').createDevAuthSystem,
  createProductionAuthSystem: require('./auth').createProductionAuthSystem,
};