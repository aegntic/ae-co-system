/**
 * Aegntic MCP Standard - Authentication Provider Factory
 * 
 * Central authentication system with support for multiple providers
 * and flexible configuration
 */

import { 
  AuthProvider, 
  IAuthProvider, 
  AuthConfig, 
  AuthContext, 
  AuthResult,
  AuthUser,
  Session,
  AuthMiddleware,
  PermissionCheck,
  RoleDefinition
} from './types';
import { GitHubOAuthProvider } from './github-oauth';
import { ApiKeyProvider } from './api-key';
import { JwtProvider } from './jwt';
import { SessionManager } from './session-manager';
import { z } from 'zod';

/**
 * Main authentication system configuration
 */
export interface AuthSystemConfig {
  providers: AuthConfig[];
  sessionManager?: SessionManager;
  roles?: RoleDefinition[];
  defaultProvider?: AuthProvider;
  multiAuth?: boolean; // Allow multiple auth methods simultaneously
  securityHeaders?: boolean; // Add security headers to responses
  corsOrigins?: string[]; // Allowed CORS origins
}

/**
 * Central authentication system
 */
export class AuthenticationSystem {
  private providers: Map<AuthProvider, IAuthProvider> = new Map();
  private sessionManager: SessionManager;
  private roles: Map<string, RoleDefinition> = new Map();
  private config: AuthSystemConfig;

  constructor(config: AuthSystemConfig) {
    this.config = config;
    this.sessionManager = config.sessionManager || new SessionManager();
    
    // Initialize roles
    if (config.roles) {
      config.roles.forEach(role => {
        this.roles.set(role.name, role);
      });
    }
    
    // Add default roles if not provided
    this.ensureDefaultRoles();
  }

  /**
   * Initialize all configured providers
   */
  async initialize(): Promise<void> {
    for (const providerConfig of this.config.providers) {
      if (!providerConfig.enabled) continue;
      
      const provider = await this.createProvider(providerConfig);
      if (provider) {
        await provider.initialize(providerConfig.config);
        this.providers.set(providerConfig.provider, provider);
      }
    }
  }

  /**
   * Create a provider instance based on type
   */
  private async createProvider(config: AuthConfig): Promise<IAuthProvider | null> {
    switch (config.provider) {
      case AuthProvider.GITHUB:
        return new GitHubOAuthProvider();
      
      case AuthProvider.API_KEY:
        return new ApiKeyProvider();
      
      case AuthProvider.JWT:
        return new JwtProvider();
      
      case AuthProvider.NONE:
        return new NoAuthProvider();
      
      default:
        console.warn(`Unknown auth provider: ${config.provider}`);
        return null;
    }
  }

  /**
   * Authenticate a request using configured providers
   */
  async authenticate(request: Request): Promise<AuthResult> {
    const headers = request.headers;
    
    // Check for existing session
    const sessionId = this.extractSessionId(request);
    if (sessionId) {
      const session = await this.sessionManager.getSession(sessionId);
      if (session && await this.validateSession(session)) {
        return {
          success: true,
          user: session.user,
          session
        };
      }
    }
    
    // Try each enabled provider
    const errors: string[] = [];
    
    for (const [type, provider] of this.providers) {
      const config = this.config.providers.find(p => p.provider === type);
      if (!config || !config.enabled) continue;
      
      const context: AuthContext = {
        request,
        headers,
        config,
        cookies: this.parseCookies(request.headers.get('Cookie')),
      };
      
      try {
        const result = await provider.authenticate(context);
        
        if (result.success && result.user) {
          // Create session
          const session = await this.sessionManager.createSession(result.user);
          
          return {
            ...result,
            session
          };
        } else if (result.error) {
          errors.push(`${type}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // If not multi-auth, stop after first provider
      if (!this.config.multiAuth) break;
    }
    
    // No provider succeeded
    return {
      success: false,
      error: errors.length > 0 ? errors.join('; ') : 'No authentication provider available'
    };
  }

  /**
   * Create authentication middleware
   */
  middleware(options?: {
    required?: boolean;
    roles?: string[];
    permissions?: string[];
  }): AuthMiddleware {
    return async (request: Request, next: (user?: AuthUser) => Promise<Response>) => {
      const result = await this.authenticate(request);
      
      if (options?.required && !result.success) {
        return new Response('Authentication required', { 
          status: 401,
          headers: this.getSecurityHeaders()
        });
      }
      
      if (result.success && result.user) {
        // Check roles
        if (options?.roles) {
          const hasRole = options.roles.some(role => 
            this.userHasRole(result.user!, role)
          );
          
          if (!hasRole) {
            return new Response('Insufficient permissions', { 
              status: 403,
              headers: this.getSecurityHeaders()
            });
          }
        }
        
        // Check permissions
        if (options?.permissions) {
          const hasPermission = options.permissions.every(perm =>
            this.userHasPermission(result.user!, perm)
          );
          
          if (!hasPermission) {
            return new Response('Insufficient permissions', { 
              status: 403,
              headers: this.getSecurityHeaders()
            });
          }
        }
      }
      
      const response = await next(result.user);
      
      // Add session cookie if new session created
      if (result.session) {
        response.headers.append(
          'Set-Cookie',
          this.createSessionCookie(result.session.id)
        );
      }
      
      // Add security headers
      if (this.config.securityHeaders) {
        Object.entries(this.getSecurityHeaders()).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    };
  }

  /**
   * Check if user has a specific role
   */
  userHasRole(user: AuthUser, roleName: string): boolean {
    return user.roles.includes(roleName);
  }

  /**
   * Check if user has a specific permission
   */
  userHasPermission(user: AuthUser, permission: string): boolean {
    for (const userRole of user.roles) {
      const role = this.roles.get(userRole);
      if (!role) continue;
      
      // Check direct permissions
      if (role.permissions.includes(permission)) return true;
      
      // Check inherited permissions
      if (role.inherits) {
        for (const inheritedRole of role.inherits) {
          if (this.roleHasPermission(inheritedRole, permission)) return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a role has a permission (recursive for inheritance)
   */
  private roleHasPermission(roleName: string, permission: string): boolean {
    const role = this.roles.get(roleName);
    if (!role) return false;
    
    if (role.permissions.includes(permission)) return true;
    
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        if (this.roleHasPermission(inheritedRole, permission)) return true;
      }
    }
    
    return false;
  }

  /**
   * Validate an existing session
   */
  private async validateSession(session: Session): boolean {
    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.sessionManager.deleteSession(session.id);
      return false;
    }
    
    // Update last accessed time
    await this.sessionManager.touchSession(session.id);
    
    // Provider-specific validation
    const provider = this.providers.get(session.user.provider);
    if (provider?.validateSession) {
      return await provider.validateSession(session);
    }
    
    return true;
  }

  /**
   * Extract session ID from request
   */
  private extractSessionId(request: Request): string | null {
    // Try cookie first
    const cookies = this.parseCookies(request.headers.get('Cookie'));
    if (cookies['aegntic-session']) {
      return cookies['aegntic-session'];
    }
    
    // Try Authorization header
    const auth = request.headers.get('Authorization');
    if (auth?.startsWith('Session ')) {
      return auth.substring(8);
    }
    
    return null;
  }

  /**
   * Parse cookie header
   */
  private parseCookies(cookieHeader: string | null): Record<string, string> {
    if (!cookieHeader) return {};
    
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }

  /**
   * Create session cookie
   */
  private createSessionCookie(sessionId: string): string {
    const parts = [
      `aegntic-session=${sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=86400' // 24 hours
    ];
    
    return parts.join('; ');
  }

  /**
   * Get security headers
   */
  private getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
    
    if (this.config.corsOrigins && this.config.corsOrigins.length > 0) {
      headers['Access-Control-Allow-Origin'] = this.config.corsOrigins[0];
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return headers;
  }

  /**
   * Ensure default roles exist
   */
  private ensureDefaultRoles(): void {
    const defaultRoles: RoleDefinition[] = [
      {
        name: 'admin',
        description: 'Full system access',
        permissions: ['*']
      },
      {
        name: 'user',
        description: 'Basic user access',
        permissions: ['read:own', 'write:own']
      },
      {
        name: 'guest',
        description: 'Limited guest access',
        permissions: ['read:public']
      }
    ];
    
    for (const role of defaultRoles) {
      if (!this.roles.has(role.name)) {
        this.roles.set(role.name, role);
      }
    }
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  getAuthorizationUrl(provider: AuthProvider, request: any): string | null {
    const authProvider = this.providers.get(provider);
    if (authProvider?.getAuthorizationUrl) {
      return authProvider.getAuthorizationUrl(request);
    }
    return null;
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: AuthProvider, 
    code: string, 
    state: string
  ): Promise<AuthResult> {
    const authProvider = this.providers.get(provider);
    if (authProvider?.handleCallback) {
      return await authProvider.handleCallback(code, state);
    }
    
    return {
      success: false,
      error: 'Provider does not support OAuth callbacks'
    };
  }

  /**
   * Logout a user
   */
  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) return;
    
    // Provider-specific logout
    const provider = this.providers.get(session.user.provider);
    if (provider?.logout) {
      await provider.logout(session);
    }
    
    // Delete session
    await this.sessionManager.deleteSession(sessionId);
  }

  /**
   * Get current providers
   */
  getProviders(): AuthProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get roles
   */
  getRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }
}

/**
 * No-auth provider for development/testing
 */
class NoAuthProvider implements IAuthProvider {
  name = 'No Authentication';
  type = AuthProvider.NONE;

  async initialize(): Promise<void> {
    // No initialization needed
  }

  async authenticate(): Promise<AuthResult> {
    return {
      success: true,
      user: {
        id: 'anonymous',
        login: 'anonymous',
        name: 'Anonymous User',
        email: 'anonymous@local',
        roles: ['guest'],
        provider: AuthProvider.NONE
      }
    };
  }
}

/**
 * Create a configured authentication system
 */
export function createAuthSystem(config: AuthSystemConfig): AuthenticationSystem {
  return new AuthenticationSystem(config);
}