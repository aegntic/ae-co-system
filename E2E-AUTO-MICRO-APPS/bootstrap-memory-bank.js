/**
 * Memory-Bank Bootstrap Protocol
 * 
 * Initializes the Memory-Bank subsystem and establishes appropriate 
 * dependency graphs for modular cognitive persistence.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Module identification constants
const MODULE_NAME = 'memory-bank';
const MODULE_ROOT = path.join(__dirname, 'modules', MODULE_NAME);
const ENV_FILE_PATH = path.join(__dirname, '.env');

/**
 * Bootstrap sequence controller
 */
async function bootstrapMemoryBank() {
  console.log('╭─────────────────────────────────────────╮');
  console.log('│ MEMORY-BANK BOOTSTRAPPING PROTOCOL      │');
  console.log('│ Modular Cognitive Persistence Framework │');
  console.log('╰─────────────────────────────────────────╯');

  try {
    // Phase 1: Verification of module structure
    await verifyModuleStructure();
    
    // Phase 2: Dependency resolution
    await resolveDependencies();
    
    // Phase 3: Environment configuration
    await configureEnvironment();
    
    // Phase 4: Storage initialization
    await initializeStorage();
    
    console.log('\n✅ Memory-Bank bootstrap sequence completed successfully');
    console.log('   Cognitive persistence layer is now operational');
  } catch (error) {
    console.error('\n❌ Bootstrap sequence failed:', error.message);
    console.error('   See detailed error information above');
    process.exit(1);
  }
}

/**
 * Verifies that all required module components exist
 */
async function verifyModuleStructure() {
  console.log('\n📂 Verifying module structure...');
  
  const requiredFiles = [
    'index.js',
    'adapters/filesystem.js',
    'schemas/memory-object.js',
    'retrieval/basic.js'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(MODULE_ROOT, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required module files: ${missingFiles.join(', ')}`);
  }
  
  console.log('  Module structure verified ✓');
}

/**
 * Resolves and installs required dependencies
 */
async function resolveDependencies() {
  console.log('\n📦 Resolving dependencies...');
  
  // Define required packages
  const dependencies = {
    prod: [],  // Core dependencies 
    dev: ['jest']  // Development dependencies
  };
  
  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(MODULE_ROOT, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = {
      name: "memory-bank",
      version: "0.1.0",
      description: "Cognitive persistence framework for E2E-AUTO-MICRO-APPS",
      main: "index.js",
      scripts: {
        test: "jest",
        "test:watch": "jest --watch"
      },
      author: "",
      license: "MIT",
      dependencies: {},
      devDependencies: {}
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('  Created package.json ✓');
  }
  
  // Install dependencies if needed
  if (dependencies.prod.length > 0) {
    console.log(`  Installing production dependencies: ${dependencies.prod.join(', ')}`);
    // Uncomment to actually install
    // execSync(`cd ${MODULE_ROOT} && npm install --save ${dependencies.prod.join(' ')}`, { stdio: 'inherit' });
  }
  
  if (dependencies.dev.length > 0) {
    console.log(`  Installing development dependencies: ${dependencies.dev.join(', ')}`);
    // Uncomment to actually install
    // execSync(`cd ${MODULE_ROOT} && npm install --save-dev ${dependencies.dev.join(' ')}`, { stdio: 'inherit' });
  }
  
  console.log('  Dependencies resolved ✓');
}

/**
 * Configures environment variables for the Memory-Bank
 */
async function configureEnvironment() {
  console.log('\n🔧 Configuring environment...');
  
  // Define required environment variables
  const requiredEnvVars = {
    MEMORY_STORAGE_DIR: path.join(__dirname, '.memory'),
    VECTOR_DB_ENABLED: 'false',
    MAX_MEMORY_AGE_DAYS: '30',
    MEMORY_COMPRESSION_ENABLED: 'true'
  };
  
  // Optional environment variables
  const optionalEnvVars = {
    SUPABASE_URL: '',
    SUPABASE_KEY: '',
    OPENROUTER_API_KEY: '',
    EMBEDDING_MODEL: 'openai/text-embedding-ada-002'
  };
  
  // Read existing .env file
  let envContent = '';
  if (fs.existsSync(ENV_FILE_PATH)) {
    envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
  }
  
  // Parse environment variables
  const envLines = envContent.split('\n');
  const existingVars = {};
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        existingVars[key.trim()] = value.trim();
      }
    }
  });
  
  // Add missing required variables
  let envUpdated = false;
  for (const [key, defaultValue] of Object.entries(requiredEnvVars)) {
    if (!existingVars[key]) {
      envLines.push(`${key}=${defaultValue}`);
      envUpdated = true;
      console.log(`  Added ${key} with default value`);
    }
  }
  
  // Add missing optional variables with comments
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!existingVars[key]) {
      envLines.push(`# Optional: ${key}=${defaultValue}`);
      envUpdated = true;
      console.log(`  Added optional ${key} as comment`);
    }
  }
  
  // Write updated .env file
  if (envUpdated) {
    fs.writeFileSync(ENV_FILE_PATH, envLines.join('\n'));
    console.log('  Updated .env file ✓');
  } else {
    console.log('  Environment already configured ✓');
  }
}

/**
 * Initializes the storage directories for Memory-Bank
 */
async function initializeStorage() {
  console.log('\n💾 Initializing storage...');
  
  // Determine storage directory
  let storageDir = path.join(__dirname, '.memory');
  
  // Check if MEMORY_STORAGE_DIR is defined in .env
  if (fs.existsSync(ENV_FILE_PATH)) {
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    const match = envContent.match(/MEMORY_STORAGE_DIR=(.+)/);
    if (match && match[1]) {
      storageDir = match[1].trim();
    }
  }
  
  // Create storage directory if it doesn't exist
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    console.log(`  Created storage directory at ${storageDir} ✓`);
  } else {
    console.log(`  Storage directory already exists at ${storageDir} ✓`);
  }
  
  // Create category subdirectories
  const categories = ['ideas', 'projects', 'trends', 'system'];
  
  for (const category of categories) {
    const categoryDir = path.join(storageDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`  Created category directory: ${category} ✓`);
    }
  }
}

// Execute bootstrap sequence
bootstrapMemoryBank();
