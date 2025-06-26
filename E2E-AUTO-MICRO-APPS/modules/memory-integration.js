/**
 * Memory-Bank Integration Protocol
 * 
 * Bridges the conversation context protocol to the Memory-Bank
 * persistence layer, establishing bi-directional context flow.
 */

const path = require('path');
const MemoryBank = require('./memory-bank');

class MemoryIntegration {
  constructor(options = {}) {
    this.options = {
      conversationCategory: 'conversations',
      metaCategory: 'meta',
      sessionKey: `session_${Date.now()}`,
      ...options
    };
    
    // Initialize memory bank instance
    this.memoryBank = new MemoryBank({
      storageDir: path.join(__dirname, '../.memory'),
      ...options.memoryBankOptions
    });
    
    this.turnCounter = 0;
    this.initialized = false;
    
    console.log('Memory Integration Protocol initialized with session key:', this.options.sessionKey);
  }
  
  /**
   * Bootstrap the memory integration system
   */
  async bootstrap() {
    try {
      // Initialize memory subsystems
      await this.memoryBank.initialize();
      
      // Record session initialization
      await this.memoryBank.store(this.options.metaCategory, 'sessions', {
        activeSession: this.options.sessionKey,
        startTime: new Date().toISOString(),
        status: 'active'
      });
      
      this.initialized = true;
      console.log('Memory Integration Protocol bootstrapped successfully');
      return true;
    } catch (error) {
      console.error('Failed to bootstrap Memory Integration:', error);
      return false;
    }
  }
  
  /**
   * Persist a conversation turn to memory
   * @param {string} message - Message content
   * @param {string} role - Message role (user/assistant)
   * @param {object} metadata - Additional metadata
   * @returns {Promise<boolean>} Success status
   */
  async persistTurn(message, role, metadata = {}) {
    if (!this.initialized) {
      console.warn('Memory Integration not initialized. Bootstrapping now...');
      await this.bootstrap();
    }
    
    try {
      const turnId = ++this.turnCounter;
      const turnKey = `${this.options.sessionKey}_turn_${turnId}`;
      
      await this.memoryBank.store(
        this.options.conversationCategory, 
        turnKey,
        {
          role,
          content: message,
          turnId,
          timestamp: new Date().toISOString()
        },
        {
          metadata: {
            source: 'claude-conversation',
            sessionKey: this.options.sessionKey,
            ...metadata
          }
        }
      );
      
      console.log(`Persisted conversation turn ${turnId} with role ${role}`);
      return true;
    } catch (error) {
      console.error('Failed to persist conversation turn:', error);
      return false;
    }
  }
  
  /**
   * Retrieve recent conversation turns
   * @param {number} limit - Maximum number of turns to retrieve
   * @returns {Promise<Array>} Recent conversation turns
   */
  async getRecentTurns(limit = 10) {
    if (!this.initialized) {
      await this.bootstrap();
    }
    
    try {
      // Use basic retrieval module
      const basicRetrieval = require('./memory-bank/retrieval/basic')(this.memoryBank);
      const recentTurns = await basicRetrieval.getMostRecent(this.options.conversationCategory, limit);
      
      return recentTurns.map(turn => turn.data);
    } catch (error) {
      console.error('Failed to retrieve recent turns:', error);
      return [];
    }
  }
  
  /**
   * Get session metadata
   * @returns {Promise<object|null>} Session metadata
   */
  async getSessionInfo() {
    if (!this.initialized) {
      await this.bootstrap();
    }
    
    try {
      const sessionInfo = await this.memoryBank.retrieve(this.options.metaCategory, 'sessions');
      return sessionInfo;
    } catch (error) {
      console.error('Failed to retrieve session info:', error);
      return null;
    }
  }
  
  /**
   * Close the current session
   * @returns {Promise<boolean>} Success status
   */
  async closeSession() {
    if (!this.initialized) {
      return false;
    }
    
    try {
      const sessionInfo = await this.memoryBank.retrieve(this.options.metaCategory, 'sessions');
      
      if (sessionInfo) {
        await this.memoryBank.store(this.options.metaCategory, 'sessions', {
          ...sessionInfo,
          status: 'closed',
          endTime: new Date().toISOString(),
          turnCount: this.turnCounter
        });
      }
      
      console.log('Memory Integration session closed successfully');
      return true;
    } catch (error) {
      console.error('Failed to close session:', error);
      return false;
    }
  }
}

module.exports = MemoryIntegration;
