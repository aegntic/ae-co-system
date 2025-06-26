/**
 * Journal Manager Task Module
 * Handles journal entry creation and management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../../shared/logger';
import { AdminAgentConfig } from '../index';

export interface JournalUpdateOptions {
  action: 'create' | 'append' | 'update' | 'index';
  entryId?: string;
  content?: string;
  metadata?: Record<string, any>;
  journalDir?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  date: string;
  content: string;
  metadata?: Record<string, any>;
}

export class JournalManager {
  private logger: Logger;
  private config: AdminAgentConfig;
  private defaultJournalDir = './journal';

  constructor(logger: Logger, config: AdminAgentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async update(options: JournalUpdateOptions): Promise<{
    success: boolean;
    entryId?: string;
    message: string;
  }> {
    const journalDir = options.journalDir || this.defaultJournalDir;

    try {
      // Ensure journal directory exists
      await fs.mkdir(journalDir, { recursive: true });

      switch (options.action) {
        case 'create':
          return await this.createEntry(journalDir, options.content!, options.metadata);
          
        case 'append':
          return await this.appendToEntry(journalDir, options.entryId!, options.content!);
          
        case 'update':
          return await this.updateEntry(journalDir, options.entryId!, options.content!, options.metadata);
          
        case 'index':
          return await this.createIndex(journalDir);
          
        default:
          throw new Error(`Unknown action: ${options.action}`);
      }
    } catch (error) {
      this.logger.error('Journal update failed', error);
      return {
        success: false,
        message: `Journal update failed: ${error}`
      };
    }
  }

  private async createEntry(
    journalDir: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; entryId: string; message: string }> {
    // Generate entry ID
    const timestamp = new Date().toISOString().split('T')[0];
    const entries = await this.getExistingEntries(journalDir);
    const dayEntries = entries.filter(e => e.includes(timestamp)).length;
    const entryNumber = (dayEntries + 1).toString().padStart(3, '0');
    const entryId = `${entryNumber}-${timestamp}`;
    
    // Create entry content
    const entryContent = this.formatEntry({
      id: entryId,
      title: metadata?.title || `Journal Entry ${entryId}`,
      date: new Date().toISOString(),
      content,
      metadata
    });
    
    // Write entry file
    const entryPath = path.join(journalDir, `${entryId}.md`);
    await fs.writeFile(entryPath, entryContent, 'utf-8');
    
    this.logger.info(`Created journal entry: ${entryId}`);
    
    return {
      success: true,
      entryId,
      message: `Journal entry ${entryId} created successfully`
    };
  }

  private async appendToEntry(
    journalDir: string,
    entryId: string,
    content: string
  ): Promise<{ success: boolean; entryId: string; message: string }> {
    const entryPath = path.join(journalDir, `${entryId}.md`);
    
    try {
      // Read existing entry
      const existingContent = await fs.readFile(entryPath, 'utf-8');
      
      // Append new content with timestamp
      const timestamp = new Date().toISOString();
      const appendedContent = `${existingContent}\n\n## Update: ${timestamp}\n\n${content}`;
      
      // Write updated content
      await fs.writeFile(entryPath, appendedContent, 'utf-8');
      
      this.logger.info(`Appended to journal entry: ${entryId}`);
      
      return {
        success: true,
        entryId,
        message: `Content appended to journal entry ${entryId}`
      };
    } catch (error) {
      throw new Error(`Entry ${entryId} not found`);
    }
  }

  private async updateEntry(
    journalDir: string,
    entryId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; entryId: string; message: string }> {
    const entryPath = path.join(journalDir, `${entryId}.md`);
    
    try {
      // Parse existing entry
      const existingContent = await fs.readFile(entryPath, 'utf-8');
      const existingEntry = this.parseEntry(existingContent);
      
      // Update entry
      const updatedEntry: JournalEntry = {
        ...existingEntry,
        content,
        metadata: { ...existingEntry.metadata, ...metadata }
      };
      
      // Write updated entry
      const updatedContent = this.formatEntry(updatedEntry);
      await fs.writeFile(entryPath, updatedContent, 'utf-8');
      
      this.logger.info(`Updated journal entry: ${entryId}`);
      
      return {
        success: true,
        entryId,
        message: `Journal entry ${entryId} updated successfully`
      };
    } catch (error) {
      throw new Error(`Entry ${entryId} not found`);
    }
  }

  private async createIndex(journalDir: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const entries = await this.getExistingEntries(journalDir);
    const index: Array<{ id: string; title: string; date: string }> = [];
    
    // Parse each entry
    for (const entryFile of entries) {
      const entryPath = path.join(journalDir, entryFile);
      const content = await fs.readFile(entryPath, 'utf-8');
      const entry = this.parseEntry(content);
      
      index.push({
        id: entry.id,
        title: entry.title,
        date: entry.date
      });
    }
    
    // Sort by date (newest first)
    index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Create index content
    const indexContent = `# Journal Index\n\n` +
      `Total Entries: ${index.length}\n\n` +
      `## Entries\n\n` +
      index.map(e => `- [${e.date}] [${e.title}](./${e.id}.md)`).join('\n');
    
    // Write index file
    const indexPath = path.join(journalDir, 'INDEX.md');
    await fs.writeFile(indexPath, indexContent, 'utf-8');
    
    this.logger.info('Created journal index');
    
    return {
      success: true,
      message: `Journal index created with ${index.length} entries`
    };
  }

  private formatEntry(entry: JournalEntry): string {
    const metadata = entry.metadata 
      ? `\n## Metadata\n${JSON.stringify(entry.metadata, null, 2)}\n`
      : '';
    
    return `# ${entry.title}

## Entry ID: ${entry.id}
## Date: ${entry.date}
${metadata}
## Content

${entry.content}`;
  }

  private parseEntry(content: string): JournalEntry {
    const lines = content.split('\n');
    const entry: Partial<JournalEntry> = {};
    
    // Simple parsing logic
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# ')) {
        entry.title = line.substring(2);
      } else if (line.startsWith('## Entry ID: ')) {
        entry.id = line.substring(13);
      } else if (line.startsWith('## Date: ')) {
        entry.date = line.substring(9);
      } else if (line === '## Content') {
        entry.content = lines.slice(i + 2).join('\n').trim();
        break;
      }
    }
    
    return entry as JournalEntry;
  }

  private async getExistingEntries(journalDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(journalDir);
      return files.filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    } catch {
      return [];
    }
  }
}