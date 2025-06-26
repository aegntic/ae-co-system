/**
 * Memory-Bank Integration Protocol
 * 
 * Establishes bidirectional interfaces between Memory-Bank and other
 * system components to enable cognitive persistence across modules.
 */

const fs = require('fs');
const path = require('path');

// Module identity constants
const MODULE_NAME = 'memory-bank';
const MODULE_ROOT = path.join(__dirname, 'modules', MODULE_NAME);
const INTEGRATIONS_DIR = path.join(MODULE_ROOT, 'integrations');

// Component integration mappings
const INTEGRATION_COMPONENTS = [
  {
    name: 'openrouter',
    description: 'AI model provider integration',
    interfaces: ['contextual-retrieval', 'embedding-cache'],
    priority: 1
  },
  {
    name: 'task-master',
    description: 'Task management integration',
    interfaces: ['task-history', 'dependency-tracking'],
    priority: 2
  },
  {
    name: 'context7',
    description: 'Documentation context integration',
    interfaces: ['doc-cache', 'usage-metrics'],
    priority: 3
  },
  {
    name: 'n8n',
    description: 'Workflow automation integration',
    interfaces: ['workflow-state', 'execution-history'],
    priority: 4
  }
];

/**
 * Integration orchestration controller
 */
async function integrateMemoryBank() {
  console.log('╭─────────────────────────────────────────╮');
  console.log('│ MEMORY-BANK INTEGRATION PROTOCOL        │');
  console.log('│ Cognitive Persistence Interface Mapping │');
  console.log('╰─────────────────────────────────────────╯');

  try {
    // Phase 1: Create integration directory structure
    await createIntegrationStructure();
    
    // Phase 2: Generate integration interfaces
    await generateInterfaces();
    
    // Phase 3: Create adapter modules
    await createAdapters();
    
    // Phase 4: Register with component modules
    await registerWithComponents();
    
    console.log('\n✅ Memory-Bank integration sequence completed successfully');
    console.log('   Cognitive interfaces established with system components');
  } catch (error) {
    console.error('\n❌ Integration sequence failed:', error.message);
    console.error('   See detailed error information above');
    process.exit(1);
  }
}

/**
 * Creates the directory structure for integrations
 */
async function createIntegrationStructure() {
  console.log('\n📂 Creating integration structure...');
  
  // Create integrations directory
  if (!fs.existsSync(INTEGRATIONS_DIR)) {
    fs.mkdirSync(INTEGRATIONS_DIR, { recursive: true });
    console.log('  Created integrations directory ✓');
  }
  
  // Create component directories
  for (const component of INTEGRATION_COMPONENTS) {
    const componentDir = path.join(INTEGRATIONS_DIR, component.name);
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
      console.log(`  Created ${component.name} integration directory ✓`);
    }
  }
}

/**
 * Generates interface modules for each component
 */
async function generateInterfaces() {
  console.log('\n🔌 Generating integration interfaces...');
  
  for (const component of INTEGRATION_COMPONENTS) {
    console.log(`\n  Configuring ${component.name} interfaces:`);
    
    for (const interfaceType of component.interfaces) {
      const interfaceFile = path.join(INTEGRATIONS_DIR, component.name, `${interfaceType}.js`);
      
      if (!fs.existsSync(interfaceFile)) {
        // Generate interface file based on type
        const interfaceContent = generateInterfaceTemplate(component.name, interfaceType);
        fs.writeFileSync(interfaceFile, interfaceContent);
        console.log(`    Created ${interfaceType} interface ✓`);
      } else {
        console.log(`    ${interfaceType} interface already exists ✓`);
      }
    }
    
    // Create index.js to export all interfaces
    const indexFile = path.join(INTEGRATIONS_DIR, component.name, 'index.js');
    const indexContent = generateIndexFile(component);
    fs.writeFileSync(indexFile, indexContent);
    console.log(`    Created index file ✓`);
  }
}

/**
 * Creates adapter modules for connecting to components
 */
async function createAdapters() {
  console.log('\n🧩 Creating component adapters...');
  
  // Create main adapter index file
  const adaptersIndexPath = path.join(INTEGRATIONS_DIR, 'index.js');
  const adaptersIndexContent = generateAdaptersIndex(INTEGRATION_COMPONENTS);
  fs.writeFileSync(adaptersIndexPath, adaptersIndexContent);
  console.log('  Created main integration index file ✓');
}

/**
 * Registers memory-bank with target components
 */
async function registerWithComponents() {
  console.log('\n🔗 Registering with components...');
  
  // For each component, check if it exists and create registration
  for (const component of INTEGRATION_COMPONENTS) {
    const componentDir = path.join(__dirname, 'modules', component.name);
    
    if (fs.existsSync(componentDir)) {
      console.log(`  Registering with ${component.name}...`);
      
      // Create registration hook in component directory
      const registrationFile = path.join(componentDir, 'memory-bank-hook.js');
      const registrationContent = generateRegistrationHook(component);
      fs.writeFileSync(registrationFile, registrationContent);
      
      console.log(`    Created registration hook ✓`);
    } else {
      console.log(`  Component ${component.name} not found, skipping registration`);
    }
  }
}

/**
 * Generates template code for an interface file
 */
function generateInterfaceTemplate(component, interfaceType) {
  return `/**
 * Memory-Bank: ${component} ${interfaceType} Interface
 * 
 * Provides bidirectional integration between Memory-Bank
 * and the ${component} module for ${interfaceType} functionality.
 */

const MemoryBank = require('../../../index');

/**
 * Interface factory function
 * @param {Object} options - Configuration options
 * @returns {Object} Interface methods
 */
module.exports = function create${toCamelCase(interfaceType)}Interface(options = {}) {
  // Initialize memory bank instance or use provided one
  const memoryBank = options.memoryBank || new MemoryBank();
  
  // Define the category for this interface
  const category = '${component}-${interfaceType}';
  
  return {
    /**
     * Store data in memory bank
     * @param {string} key - Unique identifier
     * @param {any} data - Data to store
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<boolean>} Success status
     */
    async store(key, data, metadata = {}) {
      try {
        return await memoryBank.store(category, key, data, { metadata });
      } catch (error) {
        console.error(\`[${component}-${interfaceType}] Store error:\`, error);
        return false;
      }
    },
    
    /**
     * Retrieve data from memory bank
     * @param {string} key - Unique identifier
     * @returns {Promise<any>} Retrieved data or null
     */
    async retrieve(key) {
      try {
        return await memoryBank.retrieve(category, key);
      } catch (error) {
        console.error(\`[${component}-${interfaceType}] Retrieve error:\`, error);
        return null;
      }
    },
    
    /**
     * List all keys in this category
     * @returns {Promise<Array<string>>} List of keys
     */
    async list() {
      try {
        return await memoryBank.list(category);
      } catch (error) {
        console.error(\`[${component}-${interfaceType}] List error:\`, error);
        return [];
      }
    },
    
    /**
     * Clear data by key
     * @param {string} key - Unique identifier
     * @returns {Promise<boolean>} Success status
     */
    async clear(key) {
      try {
        return await memoryBank.delete(category, key);
      } catch (error) {
        console.error(\`[${component}-${interfaceType}] Clear error:\`, error);
        return false;
      }
    }
  };
};
`;
}

/**
 * Generates an index file for a component's interfaces
 */
function generateIndexFile(component) {
  const imports = component.interfaces.map(interfaceType => 
    `const create${toCamelCase(interfaceType)}Interface = require('./${interfaceType}');`
  ).join('\n');
  
  const exports = `module.exports = {
${component.interfaces.map(interfaceType => 
    `  create${toCamelCase(interfaceType)}Interface,`
  ).join('\n')}
};`;

  return `/**
 * Memory-Bank: ${component.name} Integration
 * 
 * ${component.description}
 */

${imports}

${exports}
`;
}

/**
 * Generates the main adapters index file
 */
function generateAdaptersIndex(components) {
  const imports = components.map(component => 
    `const ${component.name}Interfaces = require('./${component.name}');`
  ).join('\n');
  
  const exports = `module.exports = {
${components.map(component => `  ${component.name}: ${component.name}Interfaces,`).join('\n')}
  
  /**
   * Initialize all integrations with a single memory bank instance
   * @param {Object} memoryBank - Memory bank instance
   * @returns {Object} Initialized interfaces grouped by component
   */
  initializeAll(memoryBank) {
    const integrations = {};
    
${components.map(component => `    integrations.${component.name} = {};
${component.interfaces.map(interfaceType => 
      `    integrations.${component.name}.${camelCaseToDash(interfaceType)} = ${component.name}Interfaces.create${toCamelCase(interfaceType)}Interface({ memoryBank });`
    ).join('\n')}`).join('\n\n')}
    
    return integrations;
  }
};`;

  return `/**
 * Memory-Bank: Integration Hub
 * 
 * Central access point for all component integrations
 */

${imports}

${exports}
`;
}

/**
 * Generates a registration hook for a component
 */
function generateRegistrationHook(component) {
  return `/**
 * Memory-Bank Registration Hook for ${component.name}
 * 
 * Enables ${component.name} to interface with Memory-Bank cognitive persistence
 */

const path = require('path');
const MemoryBank = require('../memory-bank');
const { ${component.name}: interfaces } = require('../memory-bank/integrations');

// Create memory-bank instance if not already available
const memoryBank = global.memoryBank || new MemoryBank();

// Register memory-bank globally if not already registered
if (!global.memoryBank) {
  global.memoryBank = memoryBank;
}

// Initialize interfaces
const ${component.name}Memory = {};

${component.interfaces.map(interfaceType => 
  `${component.name}Memory.${camelCaseToDash(interfaceType)} = interfaces.create${toCamelCase(interfaceType)}Interface({ memoryBank });`
).join('\n')}

module.exports = ${component.name}Memory;
`;
}

/**
 * Utility function to convert dash-case to camelCase
 */
function toCamelCase(str) {
  return str.split('-')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

/**
 * Utility function to convert camelCase to dash-case
 */
function camelCaseToDash(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Execute integration sequence
integrateMemoryBank();
