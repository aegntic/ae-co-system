#!/usr/bin/env python3
"""
Memory-Bank Integration Protocol

This script initializes and integrates the Memory-Bank subsystem
into the E2E-AUTO-MICRO-APPS orchestration framework using a
modular integration approach with robust error handling.
"""

import os
import sys
import json
import shutil
from pathlib import Path

# Configuration
PROJECT_ROOT = Path('/home/tabs/E2E-AUTO-MICRO-APPS')
MODULES_DIR = PROJECT_ROOT / 'modules'
MEMORY_BANK_DIR = MODULES_DIR / 'memory-bank'
MEMORY_STORAGE_DIR = PROJECT_ROOT / '.memory'

def print_status(message, success=True):
    """Print a formatted status message"""
    prefix = "✅" if success else "❌"
    print(f"{prefix} {message}")

def ensure_directory(path):
    """Ensure a directory exists, creating it if necessary"""
    try:
        os.makedirs(path, exist_ok=True)
        return True
    except Exception as e:
        print_status(f"Failed to create directory {path}: {e}", False)
        return False

def write_file(path, content):
    """Write content to a file"""
    try:
        with open(path, 'w') as f:
            f.write(content)
        return True
    except Exception as e:
        print_status(f"Failed to write to {path}: {e}", False)
        return False

def verify_memory_bank():
    """Verify that the Memory-Bank module exists and has all required files"""
    print("Verifying Memory-Bank module...")
    
    if not MEMORY_BANK_DIR.exists():
        print_status(f"Memory-Bank module not found at {MEMORY_BANK_DIR}", False)
        return False
    
    required_files = [
        MEMORY_BANK_DIR / 'index.js',
        MEMORY_BANK_DIR / 'adapters' / 'filesystem.js'
    ]
    
    for file in required_files:
        if not file.exists():
            print_status(f"Required file {file} not found", False)
            return False
    
    print_status("Memory-Bank module verification completed")
    return True

def create_memory_storage():
    """Create memory storage directory"""
    print("Creating memory storage directory...")
    
    if ensure_directory(MEMORY_STORAGE_DIR):
        print_status(f"Memory storage directory created at {MEMORY_STORAGE_DIR}")
        return True
    return False

def create_env_file():
    """Create or update .env file with Memory-Bank configuration"""
    print("Creating/updating .env file...")
    
    env_path = PROJECT_ROOT / '.env'
    env_content = f"""# Memory-Bank Configuration
MEMORY_STORAGE_DIR="{MEMORY_STORAGE_DIR}"
VECTOR_DB_ENABLED=false
MAX_MEMORY_AGE_DAYS=30
MEMORY_COMPRESSION_ENABLED=true

# OpenRouter Configuration
# OPENROUTER_API_KEY=your_openrouter_api_key
# EMBEDDING_MODEL=openai/text-embedding-ada-002

# Optional: Supabase Vector Database
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
# VECTOR_TABLE_NAME=memory_vectors
"""
    
    if env_path.exists():
        # Check if Memory-Bank config already exists
        with open(env_path, 'r') as f:
            existing_content = f.read()
        
        if 'MEMORY_STORAGE_DIR' not in existing_content:
            # Append Memory-Bank config to existing file
            with open(env_path, 'a') as f:
                f.write("\n# Memory-Bank Configuration\n")
                f.write(env_content)
            print_status("Updated .env file with Memory-Bank configuration")
        else:
            print_status(".env file already contains Memory-Bank configuration")
    else:
        # Create new .env file
        success = write_file(env_path, env_content)
        if success:
            print_status("Created .env file with Memory-Bank configuration")
        else:
            return False
    
    return True

def create_integration_modules():
    """Create integration modules for connecting Memory-Bank with other components"""
    print("Creating integration modules...")
    
    integration_dir = MODULES_DIR / 'integrations'
    ensure_directory(integration_dir)
    
    # Create memory-integration.js helper
    helper_path = integration_dir / 'memory-integration.js'
    helper_content = """/**
 * Memory-Bank Integration Helper
 * 
 * Provides utility functions for integrating Memory-Bank with other modules
 */

const MemoryBank = require('../memory-bank');

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
 * Find similar memories using vector search
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of similar memories
 */
async function findSimilarMemories(query, options = {}) {
  return await memoryBank.findSimilar(query, options);
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
  findSimilarMemories,
  listMemories,
  deleteMemory
};
"""
    
    if write_file(helper_path, helper_content):
        print_status(f"Created memory integration helper at {helper_path}")
    
    # Create individual integration hooks
    integration_points = [
        {
            'module': 'openrouter',
            'category': 'model-calls',
            'description': 'Manages model interaction history and cached responses',
        },
        {
            'module': 'task-master',
            'category': 'tasks',
            'description': 'Stores task progress and decision rationales',
        },
        {
            'module': 'ideas-generator',
            'category': 'ideas',
            'description': 'Preserves generated ideas and their metadata',
        }
    ]
    
    for point in integration_points:
        hook_path = integration_dir / f"{point['module']}-memory-hook.js"
        hook_content = f"""/**
 * Memory-Bank Integration Hook for {point['module']}
 * 
 * {point['description']}
 */

const {{ storeMemory, retrieveMemory, findSimilarMemories }} = require('./memory-integration');

/**
 * Store data in memory
 * @param {{}} data - Data to store
 * @param {{}} options - Storage options
 * @returns {{Promise<boolean>}} Success status
 */
async function store(data, options = {{}}) {{
  const key = options.key || generateKey(data);
  return await storeMemory('{point['category']}', key, data, options.metadata || {{}});
}}

/**
 * Retrieve data from memory
 * @param {{string}} key - Memory identifier
 * @returns {{Promise<any>}} Retrieved data
 */
async function retrieve(key) {{
  return await retrieveMemory('{point['category']}', key);
}}

/**
 * Check if similar data exists in memory
 * @param {{any}} data - Data to check
 * @param {{}} options - Search options
 * @returns {{Promise<{{exists: boolean, data: any, similarity: number}}>}} Result with similarity score
 */
async function checkSimilar(data, options = {{}}) {{
  // Convert data to query string if needed
  const query = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Search for similar memories
  const results = await findSimilarMemories(query, {{
    category: '{point['category']}',
    threshold: options.threshold || 0.7,
    limit: options.limit || 5,
    ...options
  }});
  
  if (results && results.length > 0) {{
    return {{
      exists: true,
      data: results[0].data,
      similarity: results[0].score,
      results
    }};
  }}
  
  return {{ exists: false, data: null, similarity: 0, results: [] }};
}}

/**
 * Generate a deterministic key from data
 * @param {{any}} data - Input data
 * @returns {{string}} Generated key
 */
function generateKey(data) {{
  try {{
    // For objects, create a deterministic string
    if (typeof data === 'object' && data !== null) {{
      const normalized = JSON.stringify(sortObjectKeys(data));
      
      // Create a simple hash
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {{
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }}
      
      return `{point['module']}-${{Math.abs(hash)}}`;
    }}
    
    // For strings, use directly with a prefix
    if (typeof data === 'string') {{
      return `{point['module']}-${{data.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '-')}}`;
    }}
    
    // For other types, convert to string
    return `{point['module']}-${{String(data)}}`;
  }} catch (error) {{
    // Fallback to timestamp
    return `{point['module']}-${{Date.now()}}`;
  }}
}}

/**
 * Recursively sort object keys for deterministic JSON serialization
 * @param {{object}} obj - Object to sort
 * @returns {{object}} Sorted object
 */
function sortObjectKeys(obj) {{
  if (typeof obj !== 'object' || obj === null) {{
    return obj;
  }}
  
  if (Array.isArray(obj)) {{
    return obj.map(sortObjectKeys);
  }}
  
  return Object.keys(obj).sort().reduce((sorted, key) => {{
    sorted[key] = sortObjectKeys(obj[key]);
    return sorted;
  }}, {{}});
}}

module.exports = {{
  store,
  retrieve,
  checkSimilar,
  generateKey
}};
"""
        
        if write_file(hook_path, hook_content):
            print_status(f"Created {point['module']} integration hook at {hook_path}")
    
    return True

def update_package_json():
    """Update or create package.json with Memory-Bank dependency"""
    print("Updating package.json...")
    
    package_path = PROJECT_ROOT / 'package.json'
    package_data = {
        "name": "e2e-auto-micro-apps",
        "version": "0.1.0",
        "description": "Linux-Based AI Project Auto-Initiation System",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "dependencies": {},
        "devDependencies": {}
    }
    
    # Load existing package.json if it exists
    if package_path.exists():
        try:
            with open(package_path) as f:
                package_data = json.load(f)
        except json.JSONDecodeError:
            print_status(f"Invalid package.json, will create a new one", False)
    
    # Add Memory-Bank as local dependency
    if 'dependencies' not in package_data:
        package_data['dependencies'] = {}
    
    package_data['dependencies']['memory-bank'] = 'file:./modules/memory-bank'
    
    # Write updated package.json
    if write_file(package_path, json.dumps(package_data, indent=2)):
        print_status("Updated package.json with Memory-Bank dependency")
        return True
    return False

def create_main_index():
    """Create main index.js file if it doesn't exist"""
    print("Creating main index.js...")
    
    index_path = PROJECT_ROOT / 'index.js'
    
    if index_path.exists():
        print_status("Main index.js already exists, skipping")
        return True
    
    index_content = """/**
 * E2E-AUTO-MICRO-APPS
 * Linux-Based AI Project Auto-Initiation System
 * 
 * Main entry point for the orchestration pipeline
 */

// Import core modules
const MemoryBank = require('./modules/memory-bank');

// Initialize memory bank
const memoryBank = new MemoryBank();

// Export API
module.exports = {
  memoryBank,
  // Additional modules will be exported here
};

// CLI command handler (future implementation)
async function handleCommand(command, args) {
  console.log(`Command: ${command}`);
  console.log(`Arguments:`, args);
  
  switch (command) {
    case 'generate':
      console.log('Generating ideas...');
      // Call ideas generator here
      break;
      
    case 'accept':
      console.log(`Accepting idea: ${args[0]}`);
      // Call project bootstrapper here
      break;
      
    case 'list':
      console.log('Listing ideas...');
      // List ideas here
      break;
      
    case 'status':
      console.log('System status:');
      // Show system status here
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands: generate, accept, list, status');
      break;
  }
}

// Direct execution handling
if (require.main === module) {
  console.log('E2E-AUTO-MICRO-APPS orchestration system initializing...');
  
  // Process command line arguments
  const args = process.argv.slice(2);
  const command = args.shift();
  
  if (command) {
    handleCommand(command, args)
      .then(() => console.log('Command completed'))
      .catch(err => {
        console.error('Command failed:', err);
        process.exit(1);
      });
  } else {
    console.log('No command specified. Use one of: generate, accept, list, status');
  }
}
"""
    
    if write_file(index_path, index_content):
        print_status("Created main index.js file")
        return True
    return False

def main():
    """Main integration protocol"""
    print("\n=== Memory-Bank Integration Protocol ===\n")
    
    # Verify Memory-Bank module
    if not verify_memory_bank():
        print_status("Memory-Bank module verification failed, aborting integration", False)
        return 1
    
    # Create memory storage directory
    if not create_memory_storage():
        print_status("Failed to create memory storage directory, aborting integration", False)
        return 1
    
    # Create/update .env file
    if not create_env_file():
        print_status("Failed to set up environment configuration, aborting integration", False)
        return 1
    
    # Create integration modules
    if not create_integration_modules():
        print_status("Failed to create integration modules, integration may be incomplete", False)
    
    # Update package.json
    if not update_package_json():
        print_status("Failed to update package.json, integration may be incomplete", False)
    
    # Create main index.js
    if not create_main_index():
        print_status("Failed to create main index.js, integration may be incomplete", False)
    
    print("\n=== Memory-Bank Integration Complete ===\n")
    print("Integration completed successfully. The Memory-Bank module is now integrated")
    print("with the E2E-AUTO-MICRO-APPS orchestration framework.")
    print("\nUsage in JavaScript code:")
    print("const MemoryBank = require('./modules/memory-bank');")
    print("const memoryBank = new MemoryBank();")
    print("\nAPI Methods:")
    print("- memoryBank.store(category, key, data, options)")
    print("- memoryBank.retrieve(category, key)")
    print("- memoryBank.list(category)")
    print("- memoryBank.delete(category, key)")
    print("- memoryBank.findSimilar(query, options) [future implementation]")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
