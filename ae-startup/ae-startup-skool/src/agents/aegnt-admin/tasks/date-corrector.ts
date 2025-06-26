/**
 * Date Corrector Task Module
 * Handles date and time corrections across files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../../shared/logger';
import { AdminAgentConfig } from '../index';

export interface DateCorrectionOptions {
  directory: string;
  targetDate: string;
  patterns?: string[];
  dryRun?: boolean;
  fileExtensions?: string[];
}

export class DateCorrector {
  private logger: Logger;
  private config: AdminAgentConfig;
  
  // Common date patterns to search for
  private defaultPatterns = [
    /\d{4}-\d{2}-\d{2}/g,                    // ISO date: 2025-01-19
    /\d{1,2}\/\d{1,2}\/\d{4}/g,             // US date: 1/19/2025
    /\d{1,2}-\d{1,2}-\d{4}/g,               // Alt format: 19-01-2025
    /Date:\s*\d{4}-\d{2}-\d{2}/g,           // Date: prefix
    /## Date:\s*\d{4}-\d{2}-\d{2}/g,        // Markdown header
    /date:\s*["']?\d{4}-\d{2}-\d{2}["']?/g, // YAML/JSON date field
  ];

  constructor(logger: Logger, config: AdminAgentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async correct(options: DateCorrectionOptions): Promise<{
    filesProcessed: number;
    filesModified: number;
    changes: Array<{
      file: string;
      occurrences: number;
      preview?: string;
    }>;
  }> {
    const {
      directory,
      targetDate,
      patterns = this.defaultPatterns,
      dryRun = false,
      fileExtensions = ['.md', '.txt', '.json', '.yaml', '.yml']
    } = options;

    const results = {
      filesProcessed: 0,
      filesModified: 0,
      changes: [] as any[]
    };

    try {
      // Validate target date format
      if (!this.isValidDate(targetDate)) {
        throw new Error(`Invalid target date format: ${targetDate}`);
      }

      // Get all files in directory
      const files = await this.getFiles(directory, fileExtensions);
      
      for (const file of files) {
        results.filesProcessed++;
        const changes = await this.processFile(file, targetDate, patterns, dryRun);
        
        if (changes.occurrences > 0) {
          results.filesModified++;
          results.changes.push({
            file: path.relative(directory, file),
            occurrences: changes.occurrences,
            preview: changes.preview
          });
        }
      }

      this.logger.info(`Date correction complete: ${results.filesModified} files modified`);
      return results;

    } catch (error) {
      this.logger.error('Date correction failed', error);
      throw error;
    }
  }

  private async processFile(
    filePath: string,
    targetDate: string,
    patterns: RegExp[],
    dryRun: boolean
  ): Promise<{ occurrences: number; preview?: string }> {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      let occurrences = 0;
      let preview = '';

      // Apply each pattern
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          occurrences += matches.length;
          
          // Create preview of first match
          if (!preview && matches[0]) {
            const index = content.indexOf(matches[0]);
            const start = Math.max(0, index - 30);
            const end = Math.min(content.length, index + matches[0].length + 30);
            preview = `...${content.substring(start, end)}...`;
          }

          // Replace dates while preserving the pattern structure
          content = content.replace(pattern, (match) => {
            // Extract the date portion and replace it
            return match.replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/, targetDate);
          });
        }
      }

      // Save changes if not dry run and content changed
      if (!dryRun && content !== originalContent) {
        // Create backup if enabled
        if (this.config.autoBackup) {
          await this.createBackup(filePath, originalContent);
        }
        
        await fs.writeFile(filePath, content, 'utf-8');
        this.logger.debug(`Updated ${occurrences} dates in ${filePath}`);
      }

      return { occurrences, preview: dryRun ? preview : undefined };

    } catch (error) {
      this.logger.error(`Failed to process file ${filePath}`, error);
      return { occurrences: 0 };
    }
  }

  private async getFiles(directory: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    await scan(directory);
    return files;
  }

  private isValidDate(date: string): boolean {
    // Check for ISO date format
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  private async createBackup(filePath: string, content: string): Promise<void> {
    const backupDir = path.join(path.dirname(filePath), '.backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      backupDir,
      `${path.basename(filePath)}.${timestamp}.bak`
    );
    
    await fs.writeFile(backupPath, content, 'utf-8');
    this.logger.debug(`Created backup: ${backupPath}`);
  }
}