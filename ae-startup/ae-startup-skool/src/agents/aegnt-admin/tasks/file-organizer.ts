/**
 * File Organizer Task Module
 * Handles file organization and cleanup
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../../shared/logger';
import { AdminAgentConfig } from '../index';

export interface FileOrganizationOptions {
  sourceDir: string;
  targetDir?: string;
  rules?: 'default' | 'by-type' | 'by-date' | 'custom';
  customRules?: OrganizationRules;
  dryRun?: boolean;
}

interface OrganizationRules {
  categories: Record<string, {
    extensions: string[];
    subfolder: string;
  }>;
  dateFormat?: string;
  ignorePatterns?: string[];
}

export class FileOrganizer {
  private logger: Logger;
  private config: AdminAgentConfig;
  
  private defaultRules: OrganizationRules = {
    categories: {
      documents: {
        extensions: ['.md', '.txt', '.doc', '.docx', '.pdf'],
        subfolder: 'documents'
      },
      code: {
        extensions: ['.ts', '.js', '.py', '.rs', '.go', '.java'],
        subfolder: 'code'
      },
      data: {
        extensions: ['.json', '.yaml', '.yml', '.csv', '.xml'],
        subfolder: 'data'
      },
      images: {
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
        subfolder: 'images'
      },
      archives: {
        extensions: ['.zip', '.tar', '.gz', '.rar'],
        subfolder: 'archives'
      }
    },
    ignorePatterns: ['node_modules', '.git', '.backups', 'dist', 'build']
  };

  constructor(logger: Logger, config: AdminAgentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async organize(options: FileOrganizationOptions): Promise<{
    filesProcessed: number;
    filesMoved: number;
    structure: Record<string, string[]>;
  }> {
    const {
      sourceDir,
      targetDir = sourceDir,
      rules = 'default',
      customRules,
      dryRun = false
    } = options;

    const organizationRules = rules === 'custom' && customRules 
      ? customRules 
      : this.defaultRules;

    const results = {
      filesProcessed: 0,
      filesMoved: 0,
      structure: {} as Record<string, string[]>
    };

    try {
      // Get all files to organize
      const files = await this.getFilesToOrganize(sourceDir, organizationRules.ignorePatterns);
      
      for (const file of files) {
        results.filesProcessed++;
        
        const destination = await this.determineDestination(
          file,
          sourceDir,
          targetDir,
          rules,
          organizationRules
        );
        
        if (destination && destination !== file) {
          if (!dryRun) {
            await this.moveFile(file, destination);
          }
          
          results.filesMoved++;
          const category = path.relative(targetDir, path.dirname(destination));
          
          if (!results.structure[category]) {
            results.structure[category] = [];
          }
          results.structure[category].push(path.basename(file));
        }
      }

      this.logger.info(`File organization complete: ${results.filesMoved} files organized`);
      return results;

    } catch (error) {
      this.logger.error('File organization failed', error);
      throw error;
    }
  }

  private async determineDestination(
    filePath: string,
    sourceDir: string,
    targetDir: string,
    rules: string,
    organizationRules: OrganizationRules
  ): Promise<string | null> {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).toLowerCase();
    
    switch (rules) {
      case 'by-type':
      case 'default':
      case 'custom':
        // Find matching category
        for (const [category, config] of Object.entries(organizationRules.categories)) {
          if (config.extensions.includes(fileExt)) {
            const destDir = path.join(targetDir, config.subfolder);
            return path.join(destDir, fileName);
          }
        }
        break;
        
      case 'by-date':
        // Organize by file creation date
        const stats = await fs.stat(filePath);
        const date = stats.birthtime;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dateFolder = `${year}-${month}`;
        const destDir = path.join(targetDir, dateFolder);
        return path.join(destDir, fileName);
    }
    
    return null;
  }

  private async moveFile(source: string, destination: string): Promise<void> {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destination);
      await fs.mkdir(destDir, { recursive: true });
      
      // Check if destination exists
      try {
        await fs.access(destination);
        // File exists, rename with timestamp
        const timestamp = Date.now();
        const ext = path.extname(destination);
        const base = path.basename(destination, ext);
        destination = path.join(destDir, `${base}_${timestamp}${ext}`);
      } catch {
        // Destination doesn't exist, proceed normally
      }
      
      // Move the file
      await fs.rename(source, destination);
      this.logger.debug(`Moved ${source} to ${destination}`);
      
    } catch (error) {
      this.logger.error(`Failed to move file ${source}`, error);
      throw error;
    }
  }

  private async getFilesToOrganize(
    directory: string,
    ignorePatterns: string[] = []
  ): Promise<string[]> {
    const files: string[] = [];
    
    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Check if should ignore
        const shouldIgnore = ignorePatterns.some(pattern => 
          entry.name.includes(pattern) || fullPath.includes(pattern)
        );
        
        if (shouldIgnore) continue;
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(directory);
    return files;
  }
}