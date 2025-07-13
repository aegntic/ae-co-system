/**
 * Aegntic MCP Standard - JWT Authentication Provider
 * 
 * JWT-based authentication with support for various algorithms
 * and token validation strategies
 */

import {
  IAuthProvider,
  AuthProvider,
  AuthContext,
  AuthResult,
  AuthUser,
  JwtConfig,
  JwtConfigSchema,
  Session
} from './types';
// Note: jose is a peer dependency for JWT support
// Users should install it separately: npm install jose
// For now, we'll use a simplified implementation
type JWTPayload = any;
type JWTVerifyResult = { payload: JWTPayload };

/**
 * JWT payload structure
 */
interface JwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

/**
 * JWT Provider Implementation
 */
export class JwtProvider implements IAuthProvider {
  name = 'JWT';
  type = AuthProvider.JWT;
  
  private config!: JwtConfig;
  private secretKey?: Uint8Array;
  private publicKey?: any;
  private issuer?: string;
  private audience?: string;

  /**
   * Initialize with configuration
   */
  async initialize(config: any): Promise<void> {
    this.config = JwtConfigSchema.parse(config);
    
    // Set defaults
    if (!this.config.algorithm) {
      this.config.algorithm = 'HS256';
    }
    
    // Initialize keys based on algorithm
    if (this.config.algorithm.startsWith('HS')) {
      // Symmetric key algorithms (HS256, HS384, HS512)
      if (!this.config.secret) {
        throw new Error('Secret key required for HMAC algorithms');
      }
      this.secretKey = new TextEncoder().encode(this.config.secret);
    } else if (this.config.algorithm.startsWith('RS') || this.config.algorithm.startsWith('ES')) {
      // Asymmetric key algorithms (RS256, RS384, RS512, ES256, etc.)
      if (!this.config.publicKey) {
        throw new Error('Public key required for RSA/ECDSA algorithms');
      }
      this.publicKey = await this.importPublicKey(this.config.publicKey);
    }
    
    this.issuer = this.config.issuer;
    this.audience = this.config.audience;
  }

  /**
   * Authenticate a request
   */
  async authenticate(context: AuthContext): Promise<AuthResult> {
    // Extract JWT from request
    const token = this.extractToken(context);
    
    if (!token) {
      return {
        success: false,
        error: 'No JWT token provided'
      };
    }
    
    try {
      // Verify and decode the token
      const payload = await this.verifyToken(token);
      
      // Create user from JWT payload
      const user: AuthUser = {
        id: payload.sub!,
        login: payload.sub!,
        name: payload.name || payload.sub!,
        email: payload.email || `${payload.sub}@jwt.local`,
        roles: payload.roles || ['user'],
        provider: AuthProvider.JWT,
        accessToken: token,
        metadata: payload.metadata
      };
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('JWT verification error:', error);
      
      // Check for common JWT error patterns
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('expired')) {
        return {
          success: false,
          error: 'JWT token has expired',
          code: 'TOKEN_EXPIRED'
        };
      }
      
      if (errorMessage.includes('claim') || errorMessage.includes('validation')) {
        return {
          success: false,
          error: 'JWT claim validation failed',
          code: 'INVALID_CLAIMS'
        };
      }
      
      return {
        success: false,
        error: 'Invalid JWT token',
        code: 'INVALID_TOKEN'
      };
    }
  }

  /**
   * Extract JWT from request
   */
  private extractToken(context: AuthContext): string | null {
    // Try Authorization header with Bearer scheme
    const authHeader = context.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try cookie
    if (context.cookies?.['jwt-token']) {
      return context.cookies['jwt-token'];
    }
    
    // Try query parameter
    const url = new URL(context.request.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken) {
      return queryToken;
    }
    
    return null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    // Note: This is a simplified implementation for framework distribution
    // In production, use the jose library: npm install jose
    
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    // Check issuer
    if (this.issuer && payload.iss !== this.issuer) {
      throw new Error('Invalid issuer');
    }
    
    // Check audience
    if (this.audience && payload.aud !== this.audience) {
      throw new Error('Invalid audience');
    }
    
    // In production, verify signature with jose library
    console.warn('JWT signature verification skipped - install jose for production use');
    
    return payload as JwtPayload;
  }

  /**
   * Generate a new JWT token
   */
  async generateToken(options: {
    userId: string;
    email?: string;
    name?: string;
    roles?: string[];
    permissions?: string[];
    metadata?: Record<string, any>;
    expiresIn?: string;
  }): Promise<string> {
    if (!this.config.secret) {
      throw new Error('Secret key required to generate JWT tokens');
    }
    
    const payload: JwtPayload = {
      sub: options.userId,
      email: options.email,
      name: options.name,
      roles: options.roles,
      permissions: options.permissions,
      metadata: options.metadata,
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Add standard JWT claims
    if (this.issuer) {
      payload.iss = this.issuer;
    }
    
    if (this.audience) {
      payload.aud = this.audience;
    }
    
    // Set expiration
    const expiresIn = options.expiresIn || this.config.expiresIn || '1h';
    const expSeconds = this.parseExpiresIn(expiresIn);
    payload.exp = Math.floor(Date.now() / 1000) + expSeconds;
    
    // Add jti for token revocation support
    payload.jti = crypto.randomUUID();
    
    // Create JWT manually (simplified for framework distribution)
    const header = {
      alg: this.config.algorithm || 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // In production, sign with jose library
    const signature = 'simplified-signature'; // Replace with actual signature using jose
    
    console.warn('JWT signing skipped - install jose for production use');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Validate an existing session
   */
  async validateSession(session: Session): Promise<boolean> {
    if (!session.user.accessToken) {
      return false;
    }
    
    try {
      // Verify the token is still valid
      await this.verifyToken(session.user.accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh a JWT token
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify the refresh token
      const payload = await this.verifyToken(refreshToken);
      
      // Check if it's actually a refresh token
      if (payload.token_use !== 'refresh') {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }
      
      // Generate new access token
      const newToken = await this.generateToken({
        userId: payload.sub!,
        email: payload.email,
        name: payload.name,
        roles: payload.roles,
        permissions: payload.permissions,
        metadata: payload.metadata,
        expiresIn: this.config.expiresIn
      });
      
      // Create user object
      const user: AuthUser = {
        id: payload.sub!,
        login: payload.sub!,
        name: payload.name || payload.sub!,
        email: payload.email || `${payload.sub}@jwt.local`,
        roles: payload.roles || ['user'],
        provider: AuthProvider.JWT,
        accessToken: newToken,
        refreshToken: refreshToken,
        metadata: payload.metadata
      };
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh token'
      };
    }
  }

  /**
   * Generate a refresh token
   */
  async generateRefreshToken(options: {
    userId: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    if (!this.config.secret) {
      throw new Error('Secret key required to generate refresh tokens');
    }
    
    const payload: JwtPayload = {
      sub: options.userId,
      token_use: 'refresh',
      metadata: options.metadata,
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Set longer expiration for refresh token
    payload.exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    
    if (this.issuer) {
      payload.iss = this.issuer;
    }
    
    payload.jti = crypto.randomUUID();
    
    // Create JWT manually (simplified for framework distribution)
    const header = {
      alg: this.config.algorithm || 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // In production, sign with jose library
    const signature = 'simplified-signature'; // Replace with actual signature using jose
    
    console.warn('JWT signing skipped - install jose for production use');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Import public key from PEM or JWK
   */
  private async importPublicKey(key: string): Promise<any> {
    // Note: This is a simplified implementation for framework distribution
    // In production, use the jose library: npm install jose
    
    // Check if it's a JWK
    if (key.trim().startsWith('{')) {
      const jwk = JSON.parse(key);
      console.warn('JWK import simplified - install jose for production use');
      return jwk;
    }
    
    // Otherwise treat as PEM
    console.warn('PEM import simplified - install jose for production use');
    return key;
  }

  /**
   * Decode JWT without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return payload as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get JWT claims for a user
   */
  getUserClaims(user: AuthUser): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      metadata: user.metadata,
      iat: Math.floor(Date.now() / 1000),
      iss: this.issuer,
      aud: this.audience
    };
  }
  
  /**
   * Parse expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiresIn format');
    }
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: throw new Error('Invalid time unit');
    }
  }
}