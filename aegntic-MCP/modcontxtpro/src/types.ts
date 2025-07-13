import { z } from 'zod';

/**
 * Core types for the ModContxtPro - Aegntic MCP Standard Framework
 */

export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (input: any, context: ToolContext) => Promise<any>;
  metadata?: ToolMetadata;
  auth?: ToolAuth;
  rateLimit?: RateLimit;
}

export interface ToolAuth {
  required: boolean;
  roles?: string[];
  scopes?: string[];
}

export interface RateLimit {
  requests: number;
  window: string; // e.g., '1m', '1h', '1d'
}

export interface ToolMetadata {
  examples?: Array<{
    description?: string;
    input: any;
    output: any;
  }>;
  followUpPrompts?: string[];
  resources?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'tutorial' | 'api_reference' | 'example';
  }>;
  documentation?: {
    essentials: string;
    full: string;
  };
  performance?: {
    estimatedDuration: string;
    cacheable: boolean;
    cacheKey?: (input: any) => string;
  };
  pitfalls?: string[];
  tags?: string[];
}

export interface ToolContext {
  user?: User;
  database?: Database;
  analytics?: Analytics;
  cache?: Cache;
  logger?: Logger;
}

export interface User {
  id: string;
  login: string;
  name: string;
  email: string;
  roles: string[];
  accessToken?: string;
}

export interface Database {
  query: <T>(sql: string, params?: any[]) => Promise<T[]>;
  execute: (sql: string, params?: any[]) => Promise<any>;
}

export interface Analytics {
  track: (event: string, properties?: Record<string, any>) => Promise<void>;
}

export interface Cache {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface Logger {
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
}

// MCP Protocol types
export interface MCPResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

// Re-export tool builder types
export type { ToolDefinition, ToolContext as ToolBuilderContext } from './core/tool-builder';