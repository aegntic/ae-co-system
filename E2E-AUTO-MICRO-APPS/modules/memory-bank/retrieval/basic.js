/**
 * Memory-Bank: Basic Retrieval Module
 * 
 * Provides simple retrieval functions for memory objects.
 */

/**
 * Create basic retrieval functions
 * @param {Object} memoryBank - Reference to MemoryBank instance
 * @returns {Object} Retrieval functions
 */
module.exports = function createBasicRetrieval(memoryBank) {
  return {
    /**
     * Find most recent memories in a category
     * @param {string} category - Memory category
     * @param {number} limit - Maximum number of memories to retrieve
     * @returns {Promise<Array>} Array of memory objects
     */
    async getMostRecent(category, limit = 10) {
      try {
        const keys = await memoryBank.list(category);
        const memories = [];
        
        for (const key of keys) {
          const memory = await memoryBank.retrieve(category, key);
          if (memory) {
            memories.push({
              key,
              data: memory,
              category
            });
          }
          
          if (memories.length >= limit) {
            break;
          }
        }
        
        // Sort by timestamp (most recent first)
        return memories.sort((a, b) => {
          const dateA = new Date(a.data.metadata?.timestamp || 0);
          const dateB = new Date(b.data.metadata?.timestamp || 0);
          return dateB - dateA;
        });
      } catch (error) {
        console.error('Failed to retrieve recent memories:', error);
        return [];
      }
    },
    
    /**
     * Find memories with specific tags
     * @param {string} category - Memory category
     * @param {Array<string>} tags - Tags to filter by
     * @returns {Promise<Array>} Array of matching memory objects
     */
    async findByTags(category, tags) {
      try {
        const keys = await memoryBank.list(category);
        const memories = [];
        
        for (const key of keys) {
          const memory = await memoryBank.retrieve(category, key);
          if (memory && memory.metadata && memory.metadata.tags) {
            const memoryTags = memory.metadata.tags;
            const hasAllTags = tags.every(tag => memoryTags.includes(tag));
            
            if (hasAllTags) {
              memories.push({
                key,
                data: memory,
                category
              });
            }
          }
        }
        
        return memories;
      } catch (error) {
        console.error('Failed to retrieve memories by tags:', error);
        return [];
      }
    }
  };
};
