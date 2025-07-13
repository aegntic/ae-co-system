/**
 * ModContxtPro - Aegntic MCP Standard - Authentication Types
 * 
 * Comprehensive type definitions for the flexible authentication system
 */

import { z } from 'zod';

/**
 * User representation across all auth providers
 */
export interface AuthUser {
  id: string;
  login: string;
  name: string;
  email: string;
  roles: string[];
  provider: AuthProvider;
  metadata?: Record<string, any>;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Available authentication providers
 */
export enum AuthProvider {
  GITHUB = 'github',
  API_KEY = 'api_key',
  JWT = 'jwt',
  NONE = 'none',
  CUSTOM = 'custom'
}

/**
 * Authentication configuration for each provider
 */
export interface AuthConfig {
  provider: AuthProvider;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * Session data stored in memory/cache/database
 */
export interface Session {
  id: string;
  userId: string;
  user: AuthUser;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * OAuth authorization request
 */
export interface OAuthRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
}

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  header?: string; // Default: 'X-API-Key'
  query?: string;  // Default: 'api_key'
  prefix?: string; // e.g., 'Bearer', 'Token'
  validator?: (key: string) => Promise<AuthUser | null>;
}

/**
 * JWT configuration
 */
export interface JwtConfig {
  secret?: string;
  publicKey?: string;
  algorithm?: string; // Default: 'HS256'
  issuer?: string;
  audience?: string;
  expiresIn?: string; // e.g., '1h', '7d'
}

/**
 * GitHub OAuth configuration
 */
export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string; // Default: 'read:user'
  allowedOrgs?: string[];
  allowedTeams?: string[];
  requireOrgMembership?: boolean;
}

/**
 * Role-based access control
 */
export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  inherits?: string[]; // Inherit permissions from other roles
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  session?: Session;
  error?: string;
  code?: string;
}

/**
 * Authentication context passed to handlers
 */
export interface AuthContext {
  request: Request;
  headers: Headers;
  cookies?: Record<string, string>;
  session?: Session;
  config: AuthConfig;
}

/**
 * Base interface for all authentication providers
 */
export interface IAuthProvider {
  name: string;
  type: AuthProvider;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: any): Promise<void>;
  
  /**
   * Authenticate a request
   */
  authenticate(context: AuthContext): Promise<AuthResult>;
  
  /**
   * Validate an existing session (optional)
   */
  validateSession?(session: Session): Promise<boolean>;
  
  /**
   * Refresh authentication (optional)
   */
  refresh?(refreshToken: string): Promise<AuthResult>;
  
  /**
   * Logout (optional)
   */
  logout?(session: Session): Promise<void>;
  
  /**
   * Get OAuth authorization URL (for OAuth providers)
   */
  getAuthorizationUrl?(request: OAuthRequest): string;
  
  /**
   * Handle OAuth callback
   */
  handleCallback?(code: string, state: string): Promise<AuthResult>;
}

/**
 * Middleware function type
 */
export type AuthMiddleware = (
  request: Request,
  next: (user?: AuthUser) => Promise<Response>
) => Promise<Response>;

/**
 * Permission check function
 */
export type PermissionCheck = (
  user: AuthUser,
  permission: string
) => boolean;

/**
 * Zod schemas for validation
 */
export const AuthUserSchema = z.object({
  id: z.string(),
  login: z.string(),
  name: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  provider: z.nativeEnum(AuthProvider),
  metadata: z.record(z.any()).optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  user: AuthUserSchema,
  createdAt: z.date(),
  expiresAt: z.date(),
  lastAccessedAt: z.date(),
  metadata: z.record(z.any()).optional(),
});

export const ApiKeyConfigSchema = z.object({
  header: z.string().optional(),
  query: z.string().optional(),
  prefix: z.string().optional(),
});

export const JwtConfigSchema = z.object({
  secret: z.string().optional(),
  publicKey: z.string().optional(),
  algorithm: z.string().optional(),
  issuer: z.string().optional(),
  audience: z.string().optional(),
  expiresIn: z.string().optional(),
});

export const GitHubOAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  scope: z.string().optional(),
  allowedOrgs: z.array(z.string()).optional(),
  allowedTeams: z.array(z.string()).optional(),
  requireOrgMembership: z.boolean().optional(),
});