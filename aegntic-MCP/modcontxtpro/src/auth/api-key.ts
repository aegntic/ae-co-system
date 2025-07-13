/**
 * Aegntic MCP Standard - API Key Authentication Provider
 * 
 * Flexible API key authentication with multiple validation strategies
 */

import {
  IAuthProvider,
  AuthProvider,
  AuthContext,
  AuthResult,
  AuthUser,
  ApiKeyConfig,
  ApiKeyConfigSchema,
  Session
} from './types';
import * as crypto from 'crypto';

/**
 * API Key storage interface
 */
interface ApiKeyRecord {
  key: string;
  hashedKey: string;
  userId: string;
  name: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  usageCount: number;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

/**
 * Rate limit tracking
 */
interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

/**
 * API Key Provider Implementation
 */
export class ApiKeyProvider implements IAuthProvider {
  name = 'API Key';
  type = AuthProvider.API_KEY;
  
  private config!: ApiKeyConfig;
  private keyStore: Map<string, ApiKeyRecord> = new Map();
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();

  /**
   * Initialize with configuration
   */
  async initialize(config: any): Promise<void> {
    this.config = ApiKeyConfigSchema.parse(config);
    
    // Set defaults
    if (!this.config.header) {
      this.config.header = 'X-API-Key';
    }
    
    if (!this.config.query) {
      this.config.query = 'api_key';
    }
    
    // Clean up expired keys periodically
    setInterval(() => this.cleanupExpiredKeys(), 3600000); // Every hour
  }

  /**
   * Authenticate a request
   */
  async authenticate(context: AuthContext): Promise<AuthResult> {
    // Extract API key from request
    const apiKey = this.extractApiKey(context);
    
    if (!apiKey) {
      return {
        success: false,
        error: 'No API key provided'
      };
    }
    
    // Check if using custom validator
    if (this.config.validator) {
      try {
        const user = await this.config.validator(apiKey);
        if (user) {
          // Track usage
          await this.trackUsage(apiKey);
          
          return {
            success: true,
            user
          };
        }
      } catch (error) {
        console.error('Custom API key validation error:', error);
      }
      
      return {
        success: false,
        error: 'Invalid API key'
      };
    }
    
    // Use built-in validation
    return await this.validateApiKey(apiKey);
  }

  /**
   * Extract API key from request
   */
  private extractApiKey(context: AuthContext): string | null {
    // Try header first
    if (this.config.header) {
      const headerValue = context.headers.get(this.config.header);
      if (headerValue) {
        // Handle prefix (e.g., "Bearer " or "Token ")
        if (this.config.prefix) {
          if (headerValue.startsWith(this.config.prefix + ' ')) {
            return headerValue.substring(this.config.prefix.length + 1);
          }
        } else {
          return headerValue;
        }
      }
    }
    
    // Try query parameter
    if (this.config.query) {
      const url = new URL(context.request.url);
      const queryValue = url.searchParams.get(this.config.query);
      if (queryValue) {
        return queryValue;
      }
    }
    
    // Try Authorization header as fallback
    const authHeader = context.headers.get('Authorization');
    if (authHeader) {
      if (authHeader.startsWith('ApiKey ')) {
        return authHeader.substring(7);
      }
      
      if (this.config.prefix && authHeader.startsWith(this.config.prefix + ' ')) {
        return authHeader.substring(this.config.prefix.length + 1);
      }
    }
    
    return null;
  }

  /**
   * Validate API key using built-in store
   */
  private async validateApiKey(apiKey: string): Promise<AuthResult> {
    // Hash the provided key for comparison
    const hashedKey = this.hashApiKey(apiKey);
    
    // Find matching key record
    let keyRecord: ApiKeyRecord | null = null;
    
    for (const record of this.keyStore.values()) {
      if (record.hashedKey === hashedKey) {
        keyRecord = record;
        break;
      }
    }
    
    if (!keyRecord) {
      return {
        success: false,
        error: 'Invalid API key',
        code: 'INVALID_KEY'
      };
    }
    
    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return {
        success: false,
        error: 'API key has expired',
        code: 'EXPIRED_KEY'
      };
    }
    
    // Check rate limit
    if (keyRecord.rateLimit) {
      const rateLimitOk = await this.checkRateLimit(keyRecord.key, keyRecord.rateLimit);
      if (!rateLimitOk) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }
    }
    
    // Update usage statistics
    await this.trackUsage(keyRecord.key);
    
    // Create user object
    const user: AuthUser = {
      id: keyRecord.userId,
      login: keyRecord.name,
      name: keyRecord.name,
      email: `${keyRecord.name}@api-key.local`,
      roles: keyRecord.roles,
      provider: AuthProvider.API_KEY,
      accessToken: apiKey,
      metadata: {
        ...keyRecord.metadata,
        keyName: keyRecord.name,
        permissions: keyRecord.permissions
      }
    };
    
    return {
      success: true,
      user
    };
  }

  /**
   * Generate a new API key
   */
  async generateApiKey(options: {
    userId: string;
    name: string;
    roles?: string[];
    permissions?: string[];
    expiresIn?: string; // e.g., '30d', '1y'
    metadata?: Record<string, any>;
    rateLimit?: {
      requests: number;
      window: string;
    };
  }): Promise<string> {
    // Generate cryptographically secure key
    const keyBytes = crypto.randomBytes(32);
    const apiKey = `ak_${keyBytes.toString('base64url')}`;
    
    // Hash the key for storage
    const hashedKey = this.hashApiKey(apiKey);
    
    // Calculate expiration
    let expiresAt: Date | undefined;
    if (options.expiresIn) {
      expiresAt = this.calculateExpiration(options.expiresIn);
    }
    
    // Create key record
    const keyRecord: ApiKeyRecord = {
      key: `${options.userId}:${options.name}`, // Unique identifier
      hashedKey,
      userId: options.userId,
      name: options.name,
      roles: options.roles || ['user'],
      permissions: options.permissions || [],
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt,
      metadata: options.metadata,
      usageCount: 0,
      rateLimit: options.rateLimit
    };
    
    // Store the key
    this.keyStore.set(keyRecord.key, keyRecord);
    
    return apiKey;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(userId: string, keyName: string): Promise<boolean> {
    const keyId = `${userId}:${keyName}`;
    return this.keyStore.delete(keyId);
  }

  /**
   * List API keys for a user
   */
  async listApiKeys(userId: string): Promise<Array<{
    name: string;
    createdAt: Date;
    lastUsedAt: Date;
    expiresAt?: Date;
    usageCount: number;
  }>> {
    const keys = [];
    
    for (const record of this.keyStore.values()) {
      if (record.userId === userId) {
        keys.push({
          name: record.name,
          createdAt: record.createdAt,
          lastUsedAt: record.lastUsedAt,
          expiresAt: record.expiresAt,
          usageCount: record.usageCount
        });
      }
    }
    
    return keys;
  }

  /**
   * Update API key metadata
   */
  async updateApiKey(
    userId: string, 
    keyName: string,
    updates: {
      roles?: string[];
      permissions?: string[];
      metadata?: Record<string, any>;
      rateLimit?: {
        requests: number;
        window: string;
      };
    }
  ): Promise<boolean> {
    const keyId = `${userId}:${keyName}`;
    const record = this.keyStore.get(keyId);
    
    if (!record || record.userId !== userId) {
      return false;
    }
    
    // Update fields
    if (updates.roles) record.roles = updates.roles;
    if (updates.permissions) record.permissions = updates.permissions;
    if (updates.metadata) record.metadata = { ...record.metadata, ...updates.metadata };
    if (updates.rateLimit) record.rateLimit = updates.rateLimit;
    
    return true;
  }

  /**
   * Hash API key for secure storage
   */
  private hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
  }

  /**
   * Calculate expiration date from duration string
   */
  private calculateExpiration(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([hdmy])$/);
    
    if (!match) {
      throw new Error('Invalid duration format. Use format like "7d", "30d", "1y"');
    }
    
    const [, value, unit] = match;
    const amount = parseInt(value, 10);
    
    switch (unit) {
      case 'h':
        now.setHours(now.getHours() + amount);
        break;
      case 'd':
        now.setDate(now.getDate() + amount);
        break;
      case 'm':
        now.setMonth(now.getMonth() + amount);
        break;
      case 'y':
        now.setFullYear(now.getFullYear() + amount);
        break;
    }
    
    return now;
  }

  /**
   * Check rate limit for a key
   */
  private async checkRateLimit(
    keyId: string, 
    limit: { requests: number; window: string }
  ): Promise<boolean> {
    const now = new Date();
    const entry = this.rateLimitStore.get(keyId);
    
    // Parse window duration
    const windowMs = this.parseWindowDuration(limit.window);
    
    if (!entry || entry.resetAt < now) {
      // Create new rate limit window
      this.rateLimitStore.set(keyId, {
        count: 1,
        resetAt: new Date(now.getTime() + windowMs)
      });
      return true;
    }
    
    // Check if within limit
    if (entry.count >= limit.requests) {
      return false;
    }
    
    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Parse window duration to milliseconds
   */
  private parseWindowDuration(window: string): number {
    const match = window.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      throw new Error('Invalid window format. Use format like "60s", "5m", "1h", "1d"');
    }
    
    const [, value, unit] = match;
    const amount = parseInt(value, 10);
    
    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 60000; // Default to 1 minute
    }
  }

  /**
   * Track API key usage
   */
  private async trackUsage(keyId: string): Promise<void> {
    const record = this.keyStore.get(keyId);
    if (record) {
      record.lastUsedAt = new Date();
      record.usageCount++;
    }
  }

  /**
   * Clean up expired keys
   */
  private cleanupExpiredKeys(): void {
    const now = new Date();
    
    for (const [keyId, record] of this.keyStore.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        this.keyStore.delete(keyId);
      }
    }
    
    // Clean up old rate limit entries
    for (const [keyId, entry] of this.rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        this.rateLimitStore.delete(keyId);
      }
    }
  }

  /**
   * Validate session (API keys don't have sessions)
   */
  async validateSession(session: Session): Promise<boolean> {
    // API keys are stateless, so session is always valid
    // unless the key itself has been revoked
    if (session.user.accessToken) {
      const result = await this.validateApiKey(session.user.accessToken);
      return result.success;
    }
    
    return false;
  }

  /**
   * Export key store for persistence
   */
  exportKeyStore(): Array<Omit<ApiKeyRecord, 'hashedKey'>> {
    return Array.from(this.keyStore.values()).map(record => {
      const { hashedKey, ...exportData } = record;
      return exportData;
    });
  }

  /**
   * Import key store from persistence
   */
  importKeyStore(data: Array<ApiKeyRecord>): void {
    for (const record of data) {
      this.keyStore.set(record.key, record);
    }
  }
}