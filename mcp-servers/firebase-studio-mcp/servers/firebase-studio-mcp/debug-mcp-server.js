/**
 * Debug script to check why MCP Server isn't loading
 */
const fs = require('fs');
const path = require('path');

// Paths to check
const paths = [
  path.join(__dirname, 'node_modules/mcp-server/index.js'),
  path.join(__dirname, 'node_modules/mcp-server/package.json')
];

// Check file existence
console.log('Checking MCP server files:');
paths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`- ${p}: ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      console.log(`  Content length: ${content.length} bytes`);
      console.log(`  First 100 chars: ${content.substring(0, 100)}...`);
    } catch (error) {
      console.error(`  Error reading file: ${error.message}`);
    }
  }
});

// Try to require the module
console.log('\nTrying to require mcp-server:');
try {
  const mcp = require('./node_modules/mcp-server/index.js');
  console.log('✓ Successfully loaded mcp-server!');
  console.log(`- Server class present: ${typeof mcp.Server === 'function'}`);
} catch (error) {
  console.error(`✗ Failed to require mcp-server: ${error.message}`);
  console.error(error);
}
