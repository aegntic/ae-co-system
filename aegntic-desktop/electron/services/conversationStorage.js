const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

/**
 * Service for managing local storage of conversation history
 */
class ConversationStorage {
  /**
   * Create a new ConversationStorage instance
   */
  constructor() {
    this.storageDir = path.join(app.getPath('userData'), 'conversations');
    this.dbFile = path.join(this.storageDir, 'history.json');
    this.conversations = [];
    this.initialized = false;
  }
  
  /**
   * Initialize the storage
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Create storage directory if it doesn't exist
      if (!await existsAsync(this.storageDir)) {
        await mkdirAsync(this.storageDir, { recursive: true });
      }
      
      // Create database file if it doesn't exist
      if (!await existsAsync(this.dbFile)) {
        await writeFileAsync(this.dbFile, JSON.stringify({ 
          conversations: [],
          version: 1
        }), 'utf8');
      }
      
      // Load existing conversations
      await this.loadConversations();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing conversation storage:', error);
      return false;
    }
  }
  
  /**
   * Load conversations from disk
   * @returns {Promise<Array>} Loaded conversations
   */
  async loadConversations() {
    try {
      const data = await readFileAsync(this.dbFile, 'utf8');
      const parsed = JSON.parse(data);
      this.conversations = parsed.conversations || [];
      return this.conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.conversations = [];
      return [];
    }
  }
  
  /**
   * Save conversations to disk
   * @returns {Promise<boolean>} Success status
   */
  async saveConversations() {
    try {
      await writeFileAsync(this.dbFile, JSON.stringify({
        conversations: this.conversations,
        version: 1
      }, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving conversations:', error);
      return false;
    }
  }
  
  /**
   * Add a new conversation
   * @param {string} prompt - The user prompt
   * @param {object} responses - The AI responses
   * @param {boolean} [exportedToObsidian=false] - Whether exported to Obsidian
   * @returns {Promise<object>} The added conversation
   */
  async addConversation(prompt, responses, exportedToObsidian = false) {
    if (!this.initialized) await this.initialize();
    
    const conversation = {
      id: Date.now().toString(),
      prompt,
      responses,
      timestamp: Date.now(),
      exportedToObsidian
    };
    
    this.conversations.unshift(conversation); // Add to beginning of array
    await this.saveConversations();
    
    return conversation;
  }
  
  /**
   * Get all conversations
   * @param {number} [limit=50] - Maximum number of conversations to return
   * @param {number} [offset=0] - Offset for pagination
   * @returns {Promise<Array>} Conversations
   */
  async getConversations(limit = 50, offset = 0) {
    if (!this.initialized) await this.initialize();
    
    return this.conversations.slice(offset, offset + limit);
  }
  
  /**
   * Get a conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<object|null>} The conversation or null if not found
   */
  async getConversation(id) {
    if (!this.initialized) await this.initialize();
    
    return this.conversations.find(conv => conv.id === id) || null;
  }
  
  /**
   * Update a conversation
   * @param {string} id - Conversation ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|null>} Updated conversation or null if not found
   */
  async updateConversation(id, updates) {
    if (!this.initialized) await this.initialize();
    
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index === -1) return null;
    
    this.conversations[index] = {
      ...this.conversations[index],
      ...updates
    };
    
    await this.saveConversations();
    return this.conversations[index];
  }
  
  /**
   * Delete a conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteConversation(id) {
    if (!this.initialized) await this.initialize();
    
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index === -1) return false;
    
    this.conversations.splice(index, 1);
    await this.saveConversations();
    
    return true;
  }
  
  /**
   * Search conversations
   * @param {string} query - Search query
   * @param {number} [limit=50] - Maximum number of results
   * @returns {Promise<Array>} Matching conversations
   */
  async searchConversations(query, limit = 50) {
    if (!this.initialized) await this.initialize();
    
    const lowerQuery = query.toLowerCase();
    
    return this.conversations
      .filter(conv => 
        conv.prompt.toLowerCase().includes(lowerQuery) ||
        Object.values(conv.responses).some(response => 
          response.content.toLowerCase().includes(lowerQuery)
        )
      )
      .slice(0, limit);
  }
  
  /**
   * Clear all conversation history
   * @returns {Promise<boolean>} Success status
   */
  async clearAllConversations() {
    if (!this.initialized) await this.initialize();
    
    this.conversations = [];
    return this.saveConversations();
  }
}

module.exports = ConversationStorage;