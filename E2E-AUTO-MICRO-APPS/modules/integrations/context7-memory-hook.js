/**
 * Memory-Bank Integration Hook for Context7
 * 
 * Provides memory persistence and retrieval for Context7 documentation queries,
 * reducing redundant API calls and preserving documentation context.
 */

const { storeMemory, retrieveMemory, findSimilarMemories, listMemories } = require('./memory-integration');

// Category for Context7 memories
const MEMORY_CATEGORY = 'documentation';

/**
 * Store documentation in memory
 * @param {string} libraryId - Context7-compatible library ID
 * @param {string} topic - Topic being documented (optional)
 * @param {object} docContent - Documentation content
 * @param {object} options - Additional options
 * @returns {Promise<boolean>} Success status
 */
async function storeDocumentation(libraryId, topic, docContent, options = {}) {
  const key = generateDocKey(libraryId, topic);
  
  return await storeMemory(MEMORY_CATEGORY, key, {
    libraryId,
    topic: topic || 'general',
    content: docContent,
    timestamp: new Date().toISOString()
  }, {
    source: 'context7',
    ...options.metadata
  });
}

/**
 * Retrieve documentation from memory
 * @param {string} libraryId - Context7-compatible library ID
 * @param {string} topic - Topic being documented (optional)
 * @returns {Promise<object|null>} Documentation content or null if not found
 */
async function retrieveDocumentation(libraryId, topic) {
  const key = generateDocKey(libraryId, topic);
  return await retrieveMemory(MEMORY_CATEGORY, key);
}

/**
 * Check if documentation exists and is still valid
 * @param {string} libraryId - Context7-compatible library ID
 * @param {string} topic - Topic being documented (optional)
 * @param {object} options - Validation options
 * @returns {Promise<{exists: boolean, data: object|null, age: number}>} Result with existence status
 */
async function checkDocumentationExists(libraryId, topic, options = {}) {
  const key = generateDocKey(libraryId, topic);
  const doc = await retrieveMemory(MEMORY_CATEGORY, key);
  
  if (!doc) {
    return { exists: false, data: null, age: 0 };
  }
  
  // Calculate age in hours
  const timestamp = new Date(doc.timestamp);
  const now = new Date();
  const ageInHours = (now - timestamp) / (1000 * 60 * 60);
  
  // Check if documentation is still valid based on max age
  const maxAgeHours = options.maxAgeHours || 24; // Default to 24 hours
  const isValid = ageInHours < maxAgeHours;
  
  return {
    exists: isValid,
    data: isValid ? doc : null,
    age: ageInHours
  };
}

/**
 * List all documentation for a specific library
 * @param {string} libraryId - Context7-compatible library ID (optional)
 * @returns {Promise<Array>} List of documentation keys
 */
async function listLibraryDocumentation(libraryId) {
  const allDocs = await listMemories(MEMORY_CATEGORY);
  
  if (!libraryId) {
    return allDocs;
  }
  
  // Filter by library ID
  return allDocs.filter(key => key.startsWith(`lib_${libraryId.replace(/[\/]/g, '_')}`));
}

/**
 * Find similar documentation topics
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of similar documentation
 */
async function findSimilarDocumentation(query, options = {}) {
  return await findSimilarMemories(query, {
    category: MEMORY_CATEGORY,
    ...options
  });
}

/**
 * Generate a consistent key for documentation
 * @param {string} libraryId - Context7-compatible library ID
 * @param {string} topic - Topic being documented (optional)
 * @returns {string} Documentation key
 */
function generateDocKey(libraryId, topic = 'general') {
  // Sanitize library ID (replace slashes with underscores)
  const safeLibraryId = libraryId.replace(/[\/]/g, '_');
  
  // Sanitize topic
  const safeTopic = topic
    ? topic.toLowerCase().replace(/[^a-z0-9]/g, '_')
    : 'general';
  
  return `lib_${safeLibraryId}_${safeTopic}`;
}

// Pre-request hook for Context7
async function preRequestHook(params, options = {}) {
  const { libraryId, topic } = params;
  
  if (!libraryId) {
    return { cached: false, data: null };
  }
  
  // Check if we have this documentation cached and it's still valid
  const docCheck = await checkDocumentationExists(libraryId, topic, {
    maxAgeHours: options.maxAgeHours || 24
  });
  
  if (docCheck.exists && !options.forceRefresh) {
    return { 
      cached: true, 
      data: docCheck.data.content,
      age: docCheck.age
    };
  }
  
  return { cached: false, data: null };
}

// Post-response hook for Context7
async function postResponseHook(params, response, options = {}) {
  const { libraryId, topic } = params;
  
  if (!libraryId || !response) {
    return { stored: false };
  }
  
  // Store the documentation in memory
  const stored = await storeDocumentation(libraryId, topic, response, options);
  
  return { stored };
}

module.exports = {
  storeDocumentation,
  retrieveDocumentation,
  checkDocumentationExists,
  listLibraryDocumentation,
  findSimilarDocumentation,
  preRequestHook,
  postResponseHook
};
