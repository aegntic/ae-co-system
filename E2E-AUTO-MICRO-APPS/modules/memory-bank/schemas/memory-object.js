/**
 * Memory-Bank: Memory Object Schema
 * 
 * Defines the structure and validation rules for memory objects.
 */

const memoryObjectSchema = {
  type: 'object',
  required: ['data', 'metadata'],
  properties: {
    data: {
      type: ['object', 'string', 'array', 'number', 'boolean'],
      description: 'The memory data itself, can be any valid JSON value'
    },
    metadata: {
      type: 'object',
      required: ['timestamp', 'category', 'key'],
      properties: {
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO timestamp of when the memory was created/updated'
        },
        category: {
          type: 'string',
          description: 'Category of the memory (e.g., ideas, projects, trends)'
        },
        key: {
          type: 'string',
          description: 'Unique identifier within category'
        },
        source: {
          type: 'string',
          description: 'Source of the memory (e.g., user, system, API)'
        },
        tags: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Tags for organizing and filtering memories'
        },
        ttl: {
          type: 'number',
          description: 'Time-to-live in days, after which the memory may be pruned'
        },
        importance: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Importance score (0-1) affecting retention policy'
        },
        vectorized: {
          type: 'boolean',
          description: 'Whether this memory has been stored in the vector database'
        }
      },
      additionalProperties: true
    }
  }
};

module.exports = memoryObjectSchema;
