#!/usr/bin/env node
/**
 * Context7 Documentation Fetcher
 * 
 * Command-line utility to demonstrate the Context7 integration with Memory-Bank.
 * This script fetches documentation for a specified library and caches it
 * in the Memory-Bank system for future use.
 * 
 * Usage:
 *   node context7-docs-fetch.js <library-name> [topic]
 * 
 * Examples:
 *   node context7-docs-fetch.js react hooks
 *   node context7-docs-fetch.js express routing
 *   node context7-docs-fetch.js mongodb crud
 */

const path = require('path');
const context7Hook = require('../modules/integrations/context7-memory-hook');
const MemoryIntegration = require('../modules/memory-integration');

// Parse command line arguments
const libraryName = process.argv[2];
const topic = process.argv[3] || 'general';

if (!libraryName) {
  console.error('Please provide a library name as the first argument');
  console.log('Usage: node context7-docs-fetch.js <library-name> [topic]');
  process.exit(1);
}

/**
 * Fetch documentation using Context7 and Memory-Bank
 */
async function fetchDocumentation() {
  console.log(`📚 Context7 Documentation Fetcher`);
  console.log(`---------------------------------------`);
  console.log(`Library: ${libraryName}`);
  console.log(`Topic: ${topic}`);
  console.log(`---------------------------------------`);
  
  try {
    // Initialize memory integration
    const memoryIntegration = new MemoryIntegration();
    await memoryIntegration.bootstrap();
    
    // Check if documentation is already in memory
    console.log(`Checking Memory-Bank for cached documentation...`);
    const preCheck = await context7Hook.preRequestHook({ 
      libraryId: libraryName, 
      topic 
    });
    
    if (preCheck.cached) {
      console.log(`✅ Found cached documentation (${preCheck.age.toFixed(2)} hours old)`);
      console.log(`Documentation length: ${preCheck.data.length} characters`);
      
      // Display sample of the documentation
      console.log(`\nSample of cached documentation:`);
      console.log(`---------------------------------------`);
      console.log(preCheck.data.substring(0, 300) + '...');
      console.log(`---------------------------------------`);
      
      // Ask if user wants to force refresh
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Would you like to force a refresh? (y/n): ', async (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await fetchFreshDocumentation();
        } else {
          console.log('Using cached documentation. Exiting.');
          process.exit(0);
        }
      });
      
      return;
    } else {
      console.log('No cached documentation found or cache expired.');
      await fetchFreshDocumentation();
    }
  } catch (error) {
    console.error('Error fetching documentation:', error);
    process.exit(1);
  }
}

/**
 * Fetch fresh documentation from Context7
 */
async function fetchFreshDocumentation() {
  try {
    console.log(`\n📡 Fetching fresh documentation from Context7...`);
    
    // Call Context7 MCP to resolve library ID
    // In a real implementation, this would use the MCP server
    console.log(`Resolving library ID for '${libraryName}'...`);
    
    // Simulate resolving library ID
    // This would normally use: context7.resolveLibraryId({ libraryName })
    const libraryId = libraryName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    console.log(`Resolved to library ID: ${libraryId}`);
    
    // Simulate fetching documentation
    // This would normally use: context7.getLibraryDocs({ context7CompatibleLibraryID, topic, tokens })
    console.log(`Fetching documentation for '${libraryId}' topic '${topic}'...`);
    
    // Generate sample documentation for demo purposes
    const sampleDocs = {
      content: generateSampleDocumentation(libraryName, topic)
    };
    
    console.log(`✅ Documentation fetched successfully`);
    console.log(`Documentation length: ${sampleDocs.content.length} characters`);
    
    // Store in Memory-Bank
    console.log(`\n💾 Storing documentation in Memory-Bank...`);
    const stored = await context7Hook.postResponseHook(
      { libraryId, topic },
      sampleDocs.content
    );
    
    if (stored.stored) {
      console.log(`✅ Documentation successfully stored in Memory-Bank`);
      
      // Display sample of the documentation
      console.log(`\nSample of fetched documentation:`);
      console.log(`---------------------------------------`);
      console.log(sampleDocs.content.substring(0, 300) + '...');
      console.log(`---------------------------------------`);
    } else {
      console.error(`❌ Failed to store documentation in Memory-Bank`);
    }
  } catch (error) {
    console.error('Error fetching fresh documentation:', error);
  }
}

/**
 * Generate sample documentation for demo purposes
 */
function generateSampleDocumentation(library, topic) {
  return `# ${library} Documentation - ${topic.charAt(0).toUpperCase() + topic.slice(1)}

## Overview

This is sample documentation for the ${library} library, focusing on ${topic}.
The actual implementation would fetch real documentation from the Context7 MCP.

## Installation

\`\`\`bash
npm install ${library}
\`\`\`

## Usage

\`\`\`javascript
const ${library} = require('${library}');

// Example code would go here
\`\`\`

## ${topic.charAt(0).toUpperCase() + topic.slice(1)} API

### Functions

- \`functionOne(param1, param2)\`: Description of functionOne
- \`functionTwo(options)\`: Description of functionTwo
- \`functionThree()\`: Description of functionThree

### Classes

#### Class: \`ExampleClass\`

\`\`\`javascript
const instance = new ${library}.ExampleClass(options);
\`\`\`

##### Methods

- \`instance.method1()\`: Description of method1
- \`instance.method2(param)\`: Description of method2

## Examples

\`\`\`javascript
// Example 1: Basic usage
const ${library} = require('${library}');
${library}.functionOne('value', 123);

// Example 2: Advanced usage
const options = {
  setting1: true,
  setting2: 'value'
};
${library}.functionTwo(options);
\`\`\`

## Best Practices

1. Always check for errors
2. Use async/await for asynchronous operations
3. Follow the recommended patterns

## Version Compatibility

This documentation is for ${library} version 1.0.0 and above.
`;
}

// Run the main function
fetchDocumentation().catch(console.error);
