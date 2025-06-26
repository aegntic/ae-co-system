#!/bin/bash

# Memory-Bank Integration Protocol
# Comprehensive setup script for memory system integration

# Color codes for output formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╭─────────────────────────────────────────────────╮${NC}"
echo -e "${BLUE}│ MEMORY-BANK MODULAR INTEGRATION PROTOCOL        │${NC}"
echo -e "${BLUE}│ Cognitive Persistence Framework Initialization  │${NC}"
echo -e "${BLUE}╰─────────────────────────────────────────────────╯${NC}"

# Base directories
PROJECT_DIR="$(pwd)"
MODULES_DIR="${PROJECT_DIR}/modules"
MEMORY_DIR="${MODULES_DIR}/memory-bank"
MEMORY_STORAGE="${PROJECT_DIR}/.memory"

# Define component connections
declare -a COMPONENTS=("openrouter" "task-master" "context7" "n8n")

# Phase 1: Verify Memory-Bank module installation
echo -e "\n${YELLOW}Phase 1: Verifying Memory-Bank module...${NC}"

if [ ! -d "$MEMORY_DIR" ]; then
  echo -e "${RED}Error: Memory-Bank module not found at ${MEMORY_DIR}${NC}"
  exit 1
fi

if [ ! -f "${MEMORY_DIR}/index.js" ]; then
  echo -e "${RED}Error: Memory-Bank index.js not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Memory-Bank module verified${NC}"

# Phase 2: Create storage structure
echo -e "\n${YELLOW}Phase 2: Initializing storage structure...${NC}"

# Create main storage directory
mkdir -p "${MEMORY_STORAGE}"
echo -e "${GREEN}✓ Created main storage directory${NC}"

# Create category directories
mkdir -p "${MEMORY_STORAGE}/ideas"
mkdir -p "${MEMORY_STORAGE}/trends"
mkdir -p "${MEMORY_STORAGE}/projects"
mkdir -p "${MEMORY_STORAGE}/system"
echo -e "${GREEN}✓ Created category directories${NC}"

# Phase 3: Create environment configuration
echo -e "\n${YELLOW}Phase 3: Setting up environment configuration...${NC}"

# Create or append to .env file
ENV_FILE="${PROJECT_DIR}/.env"
touch "$ENV_FILE"

# Add Memory-Bank configuration if not present
if ! grep -q "MEMORY_STORAGE_DIR" "$ENV_FILE"; then
  echo "" >> "$ENV_FILE"
  echo "# Memory-Bank Configuration" >> "$ENV_FILE"
  echo "MEMORY_STORAGE_DIR=${MEMORY_STORAGE}" >> "$ENV_FILE"
  echo "VECTOR_DB_ENABLED=false" >> "$ENV_FILE"
  echo "MAX_MEMORY_AGE_DAYS=30" >> "$ENV_FILE"
  echo "MEMORY_COMPRESSION_ENABLED=true" >> "$ENV_FILE"
  echo -e "${GREEN}✓ Added Memory-Bank configuration to .env${NC}"
else
  echo -e "${GREEN}✓ Memory-Bank configuration already exists in .env${NC}"
fi

# Phase 4: Create integration directories
echo -e "\n${YELLOW}Phase 4: Creating integration structure...${NC}"

# Create integrations directory
INTEGRATIONS_DIR="${MEMORY_DIR}/integrations"
mkdir -p "$INTEGRATIONS_DIR"
echo -e "${GREEN}✓ Created integrations directory${NC}"

# Create component integration directories
for component in "${COMPONENTS[@]}"; do
  mkdir -p "${INTEGRATIONS_DIR}/${component}"
  echo -e "${GREEN}✓ Created ${component} integration directory${NC}"
done

# Phase 5: Generate test data
echo -e "\n${YELLOW}Phase 5: Generating test entries...${NC}"

# Create a test memory file
TEST_MEMORY_DIR="${MEMORY_STORAGE}/system"
TEST_MEMORY_FILE="${TEST_MEMORY_DIR}/initialization.json"

cat > "$TEST_MEMORY_FILE" << EOL
{
  "data": {
    "status": "initialized",
    "timestamp": "$(date -Iseconds)",
    "systemInfo": {
      "hostname": "$(hostname)",
      "platform": "$(uname -s)",
      "version": "1.0.0"
    }
  },
  "metadata": {
    "timestamp": "$(date -Iseconds)",
    "category": "system",
    "key": "initialization",
    "source": "setup-script",
    "tags": ["initialization", "system", "setup"]
  }
}
EOL

echo -e "${GREEN}✓ Created test memory entry${NC}"

# Phase 6: Register with package.json
echo -e "\n${YELLOW}Phase 6: Updating project configuration...${NC}"

# Create or update package.json memory-bank section
PACKAGE_JSON="${PROJECT_DIR}/package.json"

if [ -f "$PACKAGE_JSON" ]; then
  # Package.json exists, check if memory-bank is in dependencies
  if ! grep -q "\"memory-bank\":" "$PACKAGE_JSON"; then
    # Try to add memory-bank to dependencies using temporary file
    TMP_FILE=$(mktemp)
    sed '/"dependencies": {/ a\    "memory-bank": "file:modules/memory-bank",' "$PACKAGE_JSON" > "$TMP_FILE"
    mv "$TMP_FILE" "$PACKAGE_JSON"
    echo -e "${GREEN}✓ Added memory-bank to package.json dependencies${NC}"
  else
    echo -e "${GREEN}✓ memory-bank already in package.json${NC}"
  fi
else
  # Create minimal package.json
  cat > "$PACKAGE_JSON" << EOL
{
  "name": "e2e-auto-micro-apps",
  "version": "1.0.0",
  "description": "End-to-End Automated Micro-App Ideation & Bootstrapping System",
  "main": "index.js",
  "dependencies": {
    "memory-bank": "file:modules/memory-bank"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}
EOL
  echo -e "${GREEN}✓ Created package.json with memory-bank dependency${NC}"
fi

# Phase 7: Create integration hook adapter
echo -e "\n${YELLOW}Phase 7: Creating integration adapter...${NC}"

# Create the main memory adapter file
MEMORY_ADAPTER="${PROJECT_DIR}/memory-adapter.js"

cat > "$MEMORY_ADAPTER" << EOL
/**
 * Memory-Bank: Master Integration Adapter
 * 
 * Central access point for the cognitive persistence layer
 * across all system components.
 */

const path = require('path');
const MemoryBank = require('./modules/memory-bank');

// Create a singleton instance
let memoryBankInstance = null;

/**
 * Get or create the Memory-Bank singleton instance
 * @param {Object} options - Optional configuration options
 * @returns {Object} Memory-Bank instance
 */
function getMemoryBank(options = {}) {
  if (!memoryBankInstance) {
    memoryBankInstance = new MemoryBank(options);
    console.log('Memory-Bank singleton instance initialized');
  }
  return memoryBankInstance;
}

/**
 * Memory adapter factory for component integration
 * @param {string} componentName - Name of the component
 * @param {Object} options - Component-specific options
 * @returns {Object} Memory interface for the component
 */
function createMemoryAdapter(componentName, options = {}) {
  const memoryBank = getMemoryBank();
  const categoryPrefix = componentName;
  
  return {
    /**
     * Store data in memory
     * @param {string} key - Unique identifier
     * @param {any} data - Data to store
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<boolean>} Success status
     */
    async store(key, data, metadata = {}) {
      try {
        const category = options.category || categoryPrefix;
        return await memoryBank.store(category, key, data, { metadata });
      } catch (error) {
        console.error(\`[\${componentName}] Memory store error:\`, error);
        return false;
      }
    },
    
    /**
     * Retrieve data from memory
     * @param {string} key - Unique identifier
     * @param {string} category - Optional category override
     * @returns {Promise<any>} Retrieved data or null
     */
    async retrieve(key, category = null) {
      try {
        const actualCategory = category || options.category || categoryPrefix;
        return await memoryBank.retrieve(actualCategory, key);
      } catch (error) {
        console.error(\`[\${componentName}] Memory retrieve error:\`, error);
        return null;
      }
    },
    
    /**
     * List keys in category
     * @param {string} category - Optional category override
     * @returns {Promise<Array<string>>} List of keys
     */
    async list(category = null) {
      try {
        const actualCategory = category || options.category || categoryPrefix;
        return await memoryBank.list(actualCategory);
      } catch (error) {
        console.error(\`[\${componentName}] Memory list error:\`, error);
        return [];
      }
    },
    
    /**
     * Delete data by key
     * @param {string} key - Unique identifier
     * @param {string} category - Optional category override
     * @returns {Promise<boolean>} Success status
     */
    async delete(key, category = null) {
      try {
        const actualCategory = category || options.category || categoryPrefix;
        return await memoryBank.delete(actualCategory, key);
      } catch (error) {
        console.error(\`[\${componentName}] Memory delete error:\`, error);
        return false;
      }
    }
  };
}

module.exports = {
  getMemoryBank,
  createMemoryAdapter
};
EOL

echo -e "${GREEN}✓ Created memory adapter module${NC}"

# Phase 8: Verify everything is ready
echo -e "\n${YELLOW}Phase 8: Final verification...${NC}"

CHECKS_PASSED=true

# Check if memory-bank index.js exists and is valid
if [ ! -f "${MEMORY_DIR}/index.js" ]; then
  echo -e "${RED}✗ Memory-Bank index.js not found${NC}"
  CHECKS_PASSED=false
else
  echo -e "${GREEN}✓ Memory-Bank index.js verified${NC}"
fi

# Check if storage directories exist
if [ ! -d "${MEMORY_STORAGE}" ]; then
  echo -e "${RED}✗ Memory storage directory not found${NC}"
  CHECKS_PASSED=false
else
  echo -e "${GREEN}✓ Memory storage structure verified${NC}"
fi

# Check if adapter file exists
if [ ! -f "${MEMORY_ADAPTER}" ]; then
  echo -e "${RED}✗ Memory adapter file not found${NC}"
  CHECKS_PASSED=false
else
  echo -e "${GREEN}✓ Memory adapter file verified${NC}"
fi

# Output final message
if [ "$CHECKS_PASSED" = true ]; then
  echo -e "\n${GREEN}╭───────────────────────────────────────────────╮${NC}"
  echo -e "${GREEN}│ MEMORY-BANK INTEGRATION COMPLETED SUCCESSFULLY │${NC}"
  echo -e "${GREEN}╰───────────────────────────────────────────────╯${NC}"
  echo -e "\n${BLUE}Memory-Bank is now ready to provide cognitive persistence across all system components.${NC}"
  echo -e "${BLUE}To use in a component, import the adapter:${NC}"
  echo -e "${YELLOW}  const { createMemoryAdapter } = require('./memory-adapter');${NC}"
  echo -e "${YELLOW}  const memory = createMemoryAdapter('component-name');${NC}"
else
  echo -e "\n${RED}╭────────────────────────────────────────────────╮${NC}"
  echo -e "${RED}│ MEMORY-BANK INTEGRATION COMPLETED WITH ERRORS  │${NC}"
  echo -e "${RED}╰────────────────────────────────────────────────╯${NC}"
  echo -e "\n${RED}Please review the errors above and try again.${NC}"
  exit 1
fi
