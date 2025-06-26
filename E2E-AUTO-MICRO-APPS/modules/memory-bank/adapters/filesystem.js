/**
 * Memory-Bank: Filesystem Storage Adapter
 * 
 * Provides persistent storage of memory objects using the local filesystem.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Filesystem storage adapter factory
 * @param {Object} options - Configuration options
 * @returns {Object} Adapter interface
 */
module.exports = function createFilesystemAdapter(options = {}) {
  const storageDir = options.storageDir || path.join(__dirname, '../../../.memory');

  /**
   * Ensure category directory exists
   * @param {string} category - Memory category
   * @returns {string} Path to category directory
   */
  async function ensureCategoryDir(category) {
    const categoryDir = path.join(storageDir, category);
    try {
      await fs.mkdir(categoryDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    return categoryDir;
  }

  /**
   * Get file path for a memory
   * @param {string} category - Memory category
   * @param {string} key - Memory identifier
   * @returns {string} Full file path
   */
  function getFilePath(category, key) {
    // Sanitize key to make it safe for file paths
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(storageDir, category, `${safeKey}.json`);
  }

  return {
    /**
     * Write memory to filesystem
     * @param {string} category - Memory category
     * @param {string} key - Memory identifier
     * @param {object} data - Data to store
     * @returns {Promise<void>}
     */
    async write(category, key, data) {
      await ensureCategoryDir(category);
      const filePath = getFilePath(category, key);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    },

    /**
     * Read memory from filesystem
     * @param {string} category - Memory category
     * @param {string} key - Memory identifier
     * @returns {Promise<object|null>} Retrieved data or null if not found
     */
    async read(category, key) {
      try {
        const filePath = getFilePath(category, key);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return null; // File doesn't exist
        }
        throw error;
      }
    },

    /**
     * List all memories in a category
     * @param {string} category - Memory category
     * @returns {Promise<string[]>} Array of memory keys
     */
    async list(category) {
      try {
        await ensureCategoryDir(category);
        const categoryDir = path.join(storageDir, category);
        const files = await fs.readdir(categoryDir);
        
        // Extract keys from filenames
        return files
          .filter(file => file.endsWith('.json'))
          .map(file => file.slice(0, -5)); // Remove '.json' extension
      } catch (error) {
        if (error.code === 'ENOENT') {
          return []; // Directory doesn't exist yet
        }
        throw error;
      }
    },

    /**
     * Delete a memory
     * @param {string} category - Memory category
     * @param {string} key - Memory identifier
     * @returns {Promise<void>}
     */
    async delete(category, key) {
      try {
        const filePath = getFilePath(category, key);
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    },

    /**
     * Get storage statistics
     * @returns {Promise<object>} Storage stats
     */
    async getStats() {
      const stats = {
        totalSize: 0,
        categories: {},
        itemCount: 0
      };

      try {
        const categories = await fs.readdir(storageDir);
        
        for (const category of categories) {
          const categoryDir = path.join(storageDir, category);
          const categoryStat = await fs.stat(categoryDir);
          
          if (categoryStat.isDirectory()) {
            stats.categories[category] = { size: 0, count: 0 };
            const files = await fs.readdir(categoryDir);
            
            for (const file of files) {
              if (file.endsWith('.json')) {
                const filePath = path.join(categoryDir, file);
                const fileStat = await fs.stat(filePath);
                
                stats.totalSize += fileStat.size;
                stats.categories[category].size += fileStat.size;
                stats.categories[category].count += 1;
                stats.itemCount += 1;
              }
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      return stats;
    }
  };
};
