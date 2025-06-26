# Memory-Bank

Persistent Context Management System for E2E-AUTO-MICRO-APPS

## Overview

Memory-Bank provides cross-session knowledge retention, vector storage, and contextual retrieval mechanisms for the E2E-AUTO-MICRO-APPS orchestration pipeline.

## Features

- **Persistent Storage**: Maintains contextual knowledge across sessions
- **Category Organization**: Organizes memories by logical categories
- **Metadata Support**: Attaches metadata for filtering and organization
- **Vector Search**: (Future) Semantic similarity search capabilities
- **Maintenance Tools**: Automatic pruning and optimization of stored memories

## Usage

```javascript
const MemoryBank = require('./modules/memory-bank');

// Initialize with default configuration
const memoryBank = new MemoryBank();

// Store memory
await memoryBank.store('ideas', 'unique-id-123', {
  title: 'My Brilliant Idea',
  description: 'An AI-powered solution for...',
  score: 85
}, {
  metadata: {
    source: 'brainstorming-session',
    tags: ['ai', 'productivity']
  }
});

// Retrieve memory
const myIdea = await memoryBank.retrieve('ideas', 'unique-id-123');

// List memories
const allIdeas = await memoryBank.list('ideas');

// Delete memory
await memoryBank.delete('ideas', 'unique-id-123');
```

## Configuration

Environment variables for customizing behavior:

- `MEMORY_STORAGE_DIR`: Directory for storing memory files
- `VECTOR_DB_ENABLED`: Enable vector database for similarity search
- `SUPABASE_URL`: Supabase URL for vector storage (if enabled)
- `SUPABASE_KEY`: Supabase API key for vector storage (if enabled)
- `MAX_MEMORY_AGE_DAYS`: Maximum age for memories before pruning
- `MEMORY_COMPRESSION_ENABLED`: Enable compression for large memories

## Integration Points

Memory-Bank integrates with several components of the E2E-AUTO-MICRO-APPS system:

- **OpenRouter**: Stores model interactions to reduce redundant API calls
- **Task-Master-AI**: Persists task progress and decision rationales
- **Context7**: Preserves context across documentation requests, caches library documentation, and reduces API costs by reusing previously fetched documentation
- **n8n Workflows**: Maintains state between workflow executions

### Context7 Integration

The Context7 integration allows the system to:

- Cache library documentation for offline access
- Reduce API costs by reusing previously fetched documentation
- Maintain version consistency across projects
- Expire outdated documentation automatically

See the [Context7 Integration Documentation](../../docs/context7-integration.md) for details on implementation and usage.
