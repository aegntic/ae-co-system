/**
 * Memory-Bank Bootstrap Protocol
 * 
 * Initializes and integrates the Memory-Bank subsystem into the
 * E2E-AUTO-MICRO-APPS orchestration pipeline.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration parameters
const config = {
  projectRoot: path.resolve(__dirname),
  memoryDir: path.join(__dirname, '.memory'),
  dependencyManifest: {
    required: ['fs', 'path'],
    optional: ['openai'] // For vector embeddings via OpenRouter
  },
  integrationPoints: [
    { 
      module: 'openrouter',
      hookType: 'pre-request',
      memoryCategory: 'model-calls' 
    },
    { 
      module: 'task-master',
      hookType: 'task-update',
      memoryCategory: 'tasks' 
    },
    {
      module: 'trend-fetcher',
      hookType: 'post-process',
      memoryCategory: 'trends'
    }
  ]
};

/**
 * Bootstrap the Memory-Bank module
 */
async function bootstrapMemoryBank() {
  console.log('🔄 Initializing Memory-Bank integration protocol...');
  
  // Create memory storage directory if it doesn't exist
  if (!fs.existsSync(config.memoryDir)) {
    fs.mkdirSync(config.memoryDir, { recursive: true });
    console.log(`✅ Created memory storage directory: ${config.memoryDir}`);
  }
  
  // Install dependencies if needed
  try {
    const packageJsonPath = path.join(config.projectRoot, 'package.json');
    let packageJson = {};
    
    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } else {
      packageJson = {
        name: 'e2e-auto-micro-apps',
        version: '0.1.0',
        description: 'Linux-Based AI Project Auto-Initiation System',
        main: 'index.js',
        dependencies: {},
        devDependencies: {}
      };
    }
    
    // Add Memory-Bank as an internal dependency
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['memory-bank'] = 'file:./modules/memory-bank';
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with Memory-Bank dependency');
    
    // Create .env file if it doesn't exist
    const envPath = path.join(config.projectRoot, '.env');
    const envExample = `
# Memory-Bank configuration
MEMORY_STORAGE_DIR="${config.memoryDir}"
VECTOR_DB_ENABLED=false
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-key
MAX_MEMORY_AGE_DAYS=30
MEMORY_COMPRESSION_ENABLED=true
`;
    
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envExample);
      console.log('✅ Created .env file with Memory-Bank configuration');
    } else {
      // Append Memory-Bank config if not already present
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('MEMORY_STORAGE_DIR')) {
        fs.appendFileSync(envPath, envExample);
        console.log('✅ Appended Memory-Bank configuration to .env file');
      }
    }
    
    // Create integration modules
    createIntegrationModules();
    
    console.log('✅ Memory-Bank bootstrap protocol completed successfully');
  } catch (error) {
    console.error('❌ Error during Memory-Bank bootstrap:', error);
    process.exit(1);
  }
}

/**
 * Create integration modules for each touchpoint
 */
function createIntegrationModules() {
  const integrationDir = path.join(config.projectRoot, 'modules', 'integrations');
  
  if (!fs.existsSync(integrationDir)) {
    fs.mkdirSync(integrationDir, { recursive: true });
  }
  
  // Create the memory-integration.js helper
  const integrationHelperPath = path.join(integrationDir, 'memory-integration.js');
  const integrationHelperContent = `/**
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
`;
  
  fs.writeFileSync(integrationHelperPath, integrationHelperContent);
  console.log(`✅ Created memory integration helper at ${integrationHelperPath}`);
  
  // Create integration hooks for each touchpoint
  config.integrationPoints.forEach(point => {
    const hookPath = path.join(integrationDir, `${point.module}-memory-hook.js`);
    const hookContent = `/**
 * Memory-Bank Integration Hook for ${point.module}
 * 
 * Provides ${point.hookType} hook functionality for ${point.module}
 */

const { storeMemory, retrieveMemory } = require('./memory-integration');

/**
 * Hook for ${point.hookType} operation
 * @param {any} data - Data to process
 * @param {object} options - Hook options
 * @returns {Promise<any>} Processed data
 */
async function ${point.hookType}Hook(data, options = {}) {
  // Generate a consistent key based on data content
  const key = options.key || generateKey(data);
  
  // For post-process hooks, store the processed data in memory
  if ('${point.hookType}'.includes('post')) {
    await storeMemory('${point.memoryCategory}', key, data, {
      timestamp: new Date().toISOString(),
      source: '${point.module}',
      ...options.metadata
    });
  } 
  // For pre-request hooks, check if we have cached data
  else if ('${point.hookType}'.includes('pre')) {
    const cachedData = await retrieveMemory('${point.memoryCategory}', key);
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
  ${point.hookType}Hook
};
`;
    
    fs.writeFileSync(hookPath, hookContent);
    console.log(`✅ Created ${point.module} integration hook at ${hookPath}`);
  });
}

// Execute bootstrap process
bootstrapMemoryBank().catch(console.error);
