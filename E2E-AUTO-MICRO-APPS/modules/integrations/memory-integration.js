/**
 * Memory-Bank Integration Helper
 * 
 * Provides utility functions for integrating Memory-Bank with other modules
 */

const MemoryBank = require('../../modules/memory-bank');

// Initialize memory bank
const memoryBank = new MemoryBank();

/**
 * Store data in memory bank
 * @param {string} category - Memory category
 * @param {string} key - Memory identifier
 * @param {any} data - Data to store
 * @param {object} metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
async function storeMemory(category, key, data, metadata = {}) {
  return await memoryBank.store(category, key, data, { metadata });
}

/**
 * Retrieve data from memory bank
 * @param {string} category - Memory category
 * @param {string} key - Memory identifier
 * @returns {Promise<any>} Retrieved data or null if not found
 */
async function retrieveMemory(category, key) {
  return await memoryBank.retrieve(category, key);
}

/**
 * Get all memory keys in a category
 * @param {string} category - Memory category
 * @returns {Promise<string[]>} Array of memory keys
 */
async function listMemories(category) {
  return await memoryBank.list(category);
}

/**
 * Delete memory item
 * @param {string} category - Memory category
 * @param {string} key - Memory identifier
 * @returns {Promise<boolean>} Success status
 */
async function deleteMemory(category, key) {
  return await memoryBank.delete(category, key);
}

module.exports = {
  memoryBank,
  storeMemory,
  retrieveMemory,
  listMemories,
  deleteMemory
};
