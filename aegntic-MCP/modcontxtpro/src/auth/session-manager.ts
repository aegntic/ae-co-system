/**
 * Aegntic MCP Standard - Session Manager
 * 
 * Handles session storage, validation, and lifecycle management
 * with support for multiple storage backends
 */

import { Session, AuthUser } from './types';
import * as crypto from 'crypto';

/**
 * Session storage backend interface
 */
export interface SessionStore {
  get(sessionId: string): Promise<Session | null>;
  set(sessionId: string, session: Session, ttl?: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

/**
 * In-memory session store (default)
 */
export class MemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();
  private expiryTimers: Map<string, NodeJS.Timeout> = new Map();

  async get(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.delete(sessionId);
      return null;
    }
    
    return session;
  }

  async set(sessionId: string, session: Session, ttl?: number): Promise<void> {
    // Clear any existing timer
    const existingTimer = this.expiryTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    this.sessions.set(sessionId, session);
    
    // Set expiry timer
    const msUntilExpiry = session.expiresAt.getTime() - Date.now();
    if (msUntilExpiry > 0) {
      const timer = setTimeout(() => {
        this.delete(sessionId);
      }, msUntilExpiry);
      
      this.expiryTimers.set(sessionId, timer);
    }
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    
    const timer = this.expiryTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(sessionId);
    }
  }

  async clear(): Promise<void> {
    // Clear all timers
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    
    this.sessions.clear();
    this.expiryTimers.clear();
  }

  async size(): Promise<number> {
    return this.sessions.size;
  }
}

/**
 * Session manager configuration
 */
export interface SessionManagerConfig {
  store?: SessionStore;
  sessionTTL?: number; // Default session TTL in seconds
  maxSessions?: number; // Maximum number of concurrent sessions
  slidingExpiration?: boolean; // Extend session on activity
  cookieName?: string;
  cookieDomain?: string;
  cookiePath?: string;
  cookieSecure?: boolean;
  cookieSameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Session Manager Implementation
 */
export class SessionManager {
  private store: SessionStore;
  private config: Required<SessionManagerConfig>;
  private sessionIndex: Map<string, Set<string>> = new Map(); // userId -> sessionIds

  constructor(config?: SessionManagerConfig) {
    this.store = config?.store || new MemorySessionStore();
    
    this.config = {
      store: this.store,
      sessionTTL: config?.sessionTTL || 86400, // 24 hours default
      maxSessions: config?.maxSessions || 10, // Max 10 concurrent sessions per user
      slidingExpiration: config?.slidingExpiration ?? true,
      cookieName: config?.cookieName || 'aegntic-session',
      cookieDomain: config?.cookieDomain || undefined!,
      cookiePath: config?.cookiePath || '/',
      cookieSecure: config?.cookieSecure ?? true,
      cookieSameSite: config?.cookieSameSite || 'lax'
    };
    
    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 300000); // Every 5 minutes
  }

  /**
   * Create a new session
   */
  async createSession(user: AuthUser, metadata?: Record<string, any>): Promise<Session> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.config.sessionTTL * 1000));
    
    const session: Session = {
      id: sessionId,
      userId: user.id,
      user,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      metadata
    };
    
    // Check max sessions limit
    await this.enforceMaxSessions(user.id);
    
    // Store session
    await this.store.set(sessionId, session);
    
    // Update index
    let userSessions = this.sessionIndex.get(user.id);
    if (!userSessions) {
      userSessions = new Set();
      this.sessionIndex.set(user.id, userSessions);
    }
    userSessions.add(sessionId);
    
    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.store.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Update last accessed time if sliding expiration is enabled
    if (this.config.slidingExpiration) {
      await this.touchSession(sessionId);
    }
    
    return session;
  }

  /**
   * Update session last accessed time
   */
  async touchSession(sessionId: string): Promise<boolean> {
    const session = await this.store.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    const now = new Date();
    session.lastAccessedAt = now;
    
    // Extend expiration if sliding
    if (this.config.slidingExpiration) {
      session.expiresAt = new Date(now.getTime() + (this.config.sessionTTL * 1000));
    }
    
    await this.store.set(sessionId, session);
    return true;
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string, 
    updates: {
      user?: AuthUser;
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    const session = await this.store.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    if (updates.user) {
      session.user = updates.user;
    }
    
    if (updates.metadata) {
      session.metadata = { ...session.metadata, ...updates.metadata };
    }
    
    await this.store.set(sessionId, session);
    return true;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.store.get(sessionId);
    
    if (session) {
      // Remove from index
      const userSessions = this.sessionIndex.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        
        if (userSessions.size === 0) {
          this.sessionIndex.delete(session.userId);
        }
      }
    }
    
    await this.store.delete(sessionId);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const userSessions = this.sessionIndex.get(userId);
    
    if (userSessions) {
      for (const sessionId of userSessions) {
        await this.store.delete(sessionId);
      }
      
      this.sessionIndex.delete(userId);
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const userSessions = this.sessionIndex.get(userId);
    
    if (!userSessions) {
      return [];
    }
    
    const sessions: Session[] = [];
    
    for (const sessionId of userSessions) {
      const session = await this.store.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }

  /**
   * Count active sessions
   */
  async getSessionCount(): Promise<number> {
    return await this.store.size();
  }

  /**
   * Count active users
   */
  getActiveUserCount(): number {
    return this.sessionIndex.size;
  }

  /**
   * Generate session cookie
   */
  generateSessionCookie(sessionId: string): string {
    const parts = [
      `${this.config.cookieName}=${sessionId}`,
      'HttpOnly'
    ];
    
    if (this.config.cookieSecure) {
      parts.push('Secure');
    }
    
    parts.push(`SameSite=${this.config.cookieSameSite}`);
    parts.push(`Path=${this.config.cookiePath}`);
    
    if (this.config.cookieDomain) {
      parts.push(`Domain=${this.config.cookieDomain}`);
    }
    
    parts.push(`Max-Age=${this.config.sessionTTL}`);
    
    return parts.join('; ');
  }

  /**
   * Generate logout cookie (clears session)
   */
  generateLogoutCookie(): string {
    const parts = [
      `${this.config.cookieName}=`,
      'HttpOnly'
    ];
    
    if (this.config.cookieSecure) {
      parts.push('Secure');
    }
    
    parts.push(`SameSite=${this.config.cookieSameSite}`);
    parts.push(`Path=${this.config.cookiePath}`);
    
    if (this.config.cookieDomain) {
      parts.push(`Domain=${this.config.cookieDomain}`);
    }
    
    parts.push('Max-Age=0');
    
    return parts.join('; ');
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Enforce maximum sessions per user
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    const userSessions = this.sessionIndex.get(userId);
    
    if (!userSessions || userSessions.size < this.config.maxSessions) {
      return;
    }
    
    // Get all sessions and sort by last accessed time
    const sessions: Session[] = [];
    
    for (const sessionId of userSessions) {
      const session = await this.store.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
    sessions.sort((a, b) => a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime());
    
    // Remove oldest sessions
    const toRemove = sessions.slice(0, sessions.length - this.config.maxSessions + 1);
    
    for (const session of toRemove) {
      await this.deleteSession(session.id);
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    
    // Check all user session indexes
    for (const [userId, sessionIds] of this.sessionIndex.entries()) {
      const expiredSessions: string[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.store.get(sessionId);
        
        if (!session || session.expiresAt < now) {
          expiredSessions.push(sessionId);
        }
      }
      
      // Remove expired sessions
      for (const sessionId of expiredSessions) {
        await this.deleteSession(sessionId);
      }
    }
  }

  /**
   * Export session data for persistence
   */
  async exportSessions(): Promise<Session[]> {
    const sessions: Session[] = [];
    
    for (const userSessions of this.sessionIndex.values()) {
      for (const sessionId of userSessions) {
        const session = await this.store.get(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
    }
    
    return sessions;
  }

  /**
   * Import session data from persistence
   */
  async importSessions(sessions: Session[]): Promise<void> {
    for (const session of sessions) {
      // Skip expired sessions
      if (session.expiresAt < new Date()) {
        continue;
      }
      
      await this.store.set(session.id, session);
      
      // Update index
      let userSessions = this.sessionIndex.get(session.userId);
      if (!userSessions) {
        userSessions = new Set();
        this.sessionIndex.set(session.userId, userSessions);
      }
      userSessions.add(session.id);
    }
  }
}