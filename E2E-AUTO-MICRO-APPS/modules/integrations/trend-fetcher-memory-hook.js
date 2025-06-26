/**
 * Memory-Bank Integration Hook for trend-fetcher
 * 
 * Provides post-process hook functionality for trend-fetcher
 */

const { storeMemory, retrieveMemory } = require('./memory-integration');

/**
 * Hook for post-process operation
 * @param {any} data - Data to process
 * @param {object} options - Hook options
 * @returns {Promise<any>} Processed data
 */
async function post-processHook(data, options = {}) {
  // Generate a consistent key based on data content
  const key = options.key || generateKey(data);
  
  // For post-process hooks, store the processed data in memory
  if ('post-process'.includes('post')) {
    await storeMemory('trends', key, data, {
      timestamp: new Date().toISOString(),
      source: 'trend-fetcher',
      ...options.metadata
    });
  } 
  // For pre-request hooks, check if we have cached data
  else if ('post-process'.includes('pre')) {
    const cachedData = await retrieveMemory('trends', key);
    if (cachedData && !options.forceRefresh) {
      return { data: cachedData, cached: true };
    }
  }
  
  return { data, cached: false };
}

/**
 * Generate a deterministic key from data
 * @param {any} data - Input data
 * @returns {string} Generated key
 */
function generateKey(data) {
  try {
    // For objects, create a hash of the sorted JSON string
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(sortObjectKeys(data));
    }
    // For strings, use directly
    else if (typeof data === 'string') {
      return data.substring(0, 50); // Limit length
    }
    // For other types, convert to string
    else {
      return String(data);
    }
  } catch (error) {
    // Fallback to timestamp if any error
    return new Date().toISOString();
  }
}

/**
 * Recursively sort object keys for deterministic JSON serialization
 * @param {object} obj - Object to sort
 * @returns {object} Sorted object
 */
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortObjectKeys(obj[key]);
    return sorted;
  }, {});
}

module.exports = {
  post-processHook
};
