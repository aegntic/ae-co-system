# aegnt-admin: Administrative Task Sub-Agent

## Overview
A lightweight sub-agent system designed to handle small administrative tasks, allowing the main development focus to remain on core project objectives.

## Purpose
This sub-agent handles routine maintenance tasks such as:
- Date/time corrections in documentation
- File organization and cleanup
- Journal entry management
- Configuration updates
- Small text corrections
- Metadata maintenance

## Architecture

```
aegnt-admin/
├── README.md              # This file
├── index.ts              # Main entry point
├── tasks/                # Task modules
│   ├── date-corrector.ts # Date/time corrections
│   ├── file-organizer.ts # File organization
│   ├── journal-manager.ts # Journal entry management
│   └── config-updater.ts  # Configuration updates
├── utils/                # Utility functions
│   ├── file-scanner.ts   # File scanning utilities
│   └── text-helpers.ts   # Text manipulation helpers
└── prompts/             # Task-specific prompts
    └── admin-tasks.yaml  # Admin task definitions
```

## Usage

```typescript
import { AdminAgent } from './aegnt-admin';

// Initialize the admin agent
const admin = new AdminAgent();

// Correct dates in a directory
await admin.correctDates({
  directory: './journal',
  targetDate: '2025-06-20'
});

// Organize files by type
await admin.organizeFiles({
  sourceDir: './unsorted',
  rules: 'default'
});

// Update journal entries
await admin.updateJournal({
  action: 'append',
  content: 'New entry content'
});
```

## Key Features

1. **Autonomous Operation**: Runs independently without interfering with main development
2. **Pattern Recognition**: Identifies common administrative patterns
3. **Batch Processing**: Handles multiple files/tasks efficiently
4. **Safe Operations**: Always creates backups before modifications
5. **Logging**: Detailed logs of all operations

## Integration with Main System

The admin agent integrates seamlessly with the Aegntic ecosystem:
- Uses shared configuration from `.aegntic/config.yaml`
- Logs to the unified logging system
- Respects project-wide file permissions
- Coordinates with other aegnt modules

## Task Definitions

### Date Correction
- Scans for date patterns in specified formats
- Updates to target date while preserving context
- Handles multiple date formats (ISO, US, EU)

### File Organization
- Sorts files by type, date, or custom rules
- Creates organized directory structures
- Maintains file history and relationships

### Journal Management
- Creates new journal entries
- Updates existing entries
- Maintains consistent formatting
- Generates summaries and indexes

### Configuration Updates
- Updates YAML/JSON configuration files
- Validates configuration changes
- Maintains configuration history