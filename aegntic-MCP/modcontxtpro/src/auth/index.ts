/**
 * ModContxtPro - Aegntic MCP Standard - Authentication Module
 * 
 * Flexible, extensible authentication system with support for
 * multiple providers and advanced security features
 */

// Export all types
export * from './types';

// Export providers
export { GitHubOAuthProvider } from './github-oauth';
export { ApiKeyProvider } from './api-key';
export { JwtProvider } from './jwt';

// Export session management
export { SessionManager, MemorySessionStore, type SessionStore } from './session-manager';

// Export main authentication system
export { 
  AuthenticationSystem, 
  createAuthSystem,
  type AuthSystemConfig 
} from './auth-provider';

// Re-export commonly used types for convenience
export type {
  AuthUser,
  AuthResult,
  AuthProvider,
  AuthConfig,
  Session,
  AuthContext,
  IAuthProvider,
  AuthMiddleware,
  RoleDefinition
} from './types';

/**
 * Quick setup functions for common authentication scenarios
 */

import { AuthenticationSystem, AuthSystemConfig } from './auth-provider';
import { AuthProvider } from './types';

/**
 * Create a development authentication system with no auth
 */
export function createDevAuthSystem(): AuthenticationSystem {
  return new AuthenticationSystem({
    providers: [{
      provider: AuthProvider.NONE,
      enabled: true,
      config: {}
    }],
    defaultProvider: AuthProvider.NONE
  });
}

/**
 * Create a production-ready authentication system with multiple providers
 */
export function createProductionAuthSystem(options: {
  githubClientId?: string;
  githubClientSecret?: string;
  jwtSecret?: string;
  apiKeyValidator?: (key: string) => Promise<any>;
  roles?: any[];
}): AuthenticationSystem {
  const providers: AuthSystemConfig['providers'] = [];
  
  // Add GitHub OAuth if configured
  if (options.githubClientId && options.githubClientSecret) {
    providers.push({
      provider: AuthProvider.GITHUB,
      enabled: true,
      config: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback'
      }
    });
  }
  
  // Add JWT if configured
  if (options.jwtSecret) {
    providers.push({
      provider: AuthProvider.JWT,
      enabled: true,
      config: {
        secret: options.jwtSecret,
        algorithm: 'HS256',
        expiresIn: '24h'
      }
    });
  }
  
  // Add API Key if configured
  if (options.apiKeyValidator) {
    providers.push({
      provider: AuthProvider.API_KEY,
      enabled: true,
      config: {
        validator: options.apiKeyValidator
      }
    });
  }
  
  return new AuthenticationSystem({
    providers,
    roles: options.roles,
    multiAuth: true,
    securityHeaders: true,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  });
}