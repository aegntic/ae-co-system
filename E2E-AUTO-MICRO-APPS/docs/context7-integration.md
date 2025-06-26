# Context7 Integration for Memory-Bank

## Overview

This document explains how the Context7 Model Context Protocol (MCP) integrates with the Memory-Bank system in the E2E-AUTO-MICRO-APPS project. The integration provides persistent storage of documentation and enables efficient reuse across multiple sessions.

## What is Context7?

Context7 is a documentation injection framework that allows AI models to access up-to-date, version-specific documentation and code examples directly from source libraries. This eliminates outdated information and hallucinated APIs in AI responses.

## Integration Components

The Context7 integration consists of these components:

1. **Context7 MCP Server**: The `@upstash/context7-mcp` server provides tools to:
   - Resolve package names to Context7-compatible library IDs
   - Fetch documentation based on library IDs and topics

2. **Memory-Bank Storage**: Documentation is persisted in the `.memory/documentation` directory with:
   - Library-specific organization
   - Topic-based storage
   - Automatic metadata tracking

3. **Integration Hook**: The `context7-memory-hook.js` provides:
   - Pre-request caching to reduce duplicate API calls
   - Post-response persistence for future reference
   - Documentation validity checking

## Configuration

The Context7 MCP server configuration is stored in `.memory/system/context7_config.json` and includes:

```json
{
  "mcpServer": {
    "command": "npx",
    "args": [
      "-y",
      "@upstash/context7-mcp@latest"
    ],
    "env": {
      "DEFAULT_MINIMUM_TOKENS": "10000",
      "MEMORY_ENABLED": "true",
      "MEMORY_PATH": "/home/tabs/E2E-AUTO-MICRO-APPS/.memory"
    }
  }
}
```

## Usage Example

Here's how you can use the Context7 integration in your code:

```javascript
const context7Hook = require('./modules/integrations/context7-memory-hook');

async function getDocumentation(libraryName, topic) {
  // Step 1: Check if documentation is in memory
  const preCheck = await context7Hook.preRequestHook({ 
    libraryId: libraryName, 
    topic 
  });
  
  if (preCheck.cached) {
    console.log(`Using cached ${libraryName} documentation (${preCheck.age.toFixed(2)} hours old)`);
    return preCheck.data;
  }
  
  // Step 2: If not in memory, fetch from Context7
  console.log(`Fetching fresh ${libraryName} documentation...`);
  
  // Resolve library ID (required first step)
  const resolveResult = await context7.resolveLibraryId({ libraryName });
  const libraryId = resolveResult.libraryId;
  
  // Fetch documentation
  const docsResult = await context7.getLibraryDocs({
    context7CompatibleLibraryID: libraryId,
    topic: topic,
    tokens: 10000
  });
  
  // Step 3: Store in memory for future use
  await context7Hook.postResponseHook(
    { libraryId, topic },
    docsResult.content
  );
  
  return docsResult.content;
}
```

## Benefits

1. **Reduced API Costs**: Documentation is cached locally, reducing redundant API calls
2. **Improved Performance**: Faster access to documentation compared to remote fetching
3. **Offline Capability**: Access previously fetched documentation even without internet
4. **Version Consistency**: Documentation is stored with version information for future reference

## Maintenance

Documentation is automatically expired after 24 hours (configurable) to ensure you always have access to the most current information. You can force a refresh by setting the `forceRefresh: true` option in the pre-request hook.

## Future Enhancements

Planned improvements to the Context7 integration:

1. **Semantic Search**: Find documentation across libraries based on intent
2. **Differential Updates**: Only fetch changed parts of documentation
3. **Documentation Merging**: Combine multiple documentation sources
4. **Version Diffing**: Highlight changes between library versions
