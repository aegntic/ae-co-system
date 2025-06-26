/**
 * File Scanner Utility
 * Scans directories for administrative issues
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../../../shared/logger';

export interface Issue {
  type: 'date' | 'organization' | 'config' | 'formatting';
  severity: 'high' | 'medium' | 'low';
  file: string;
  description: string;
  suggestion?: string;
}

export class FileScanner {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async findIssues(directory: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    try {
      // Scan for various types of issues
      const dateIssues = await this.scanForDateIssues(directory);
      const orgIssues = await this.scanForOrganizationIssues(directory);
      const configIssues = await this.scanForConfigIssues(directory);
      
      issues.push(...dateIssues, ...orgIssues, ...configIssues);
      
      this.logger.info(`Found ${issues.length} administrative issues`);
      return issues;
      
    } catch (error) {
      this.logger.error('File scan failed', error);
      return issues;
    }
  }

  private async scanForDateIssues(directory: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Check journal entries
    const journalDir = path.join(directory, 'journal');
    try {
      const files = await fs.readdir(journalDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(journalDir, file), 'utf-8');
          const dateMatch = content.match(/## Date:\s*(\d{4}-\d{2}-\d{2})/);
          
          if (dateMatch && dateMatch[1] !== today) {
            issues.push({
              type: 'date',
              severity: 'low',
              file: path.join('journal', file),
              description: `Journal entry has old date: ${dateMatch[1]}`,
              suggestion: `Update to today's date: ${today}`
            });
          }
        }
      }
    } catch {
      // Journal directory doesn't exist
    }
    
    return issues;
  }

  private async scanForOrganizationIssues(directory: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Check for files in root that should be organized
    const files = await fs.readdir(directory);
    const unorganizedFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return !f.startsWith('.') && 
             ['.pdf', '.doc', '.zip', '.tar', '.gz'].includes(ext);
    });
    
    if (unorganizedFiles.length > 0) {
      issues.push({
        type: 'organization',
        severity: 'medium',
        file: directory,
        description: `${unorganizedFiles.length} files in root directory could be organized`,
        suggestion: 'Run file organizer to sort by type'
      });
    }
    
    // Check for large directories
    for (const item of files) {
      const itemPath = path.join(directory, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory() && !item.startsWith('.')) {
        const subFiles = await fs.readdir(itemPath);
        if (subFiles.length > 50) {
          issues.push({
            type: 'organization',
            severity: 'medium',
            file: item,
            description: `Directory has ${subFiles.length} files and may need organization`,
            suggestion: 'Consider organizing by date or type'
          });
        }
      }
    }
    
    return issues;
  }

  private async scanForConfigIssues(directory: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Check for common config files
    const configFiles = ['package.json', 'tsconfig.json', '.env', 'config.yaml'];
    
    for (const configFile of configFiles) {
      const filePath = path.join(directory, configFile);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for common issues
        if (configFile === 'package.json') {
          const pkg = JSON.parse(content);
          if (!pkg.version) {
            issues.push({
              type: 'config',
              severity: 'high',
              file: configFile,
              description: 'Missing version in package.json',
              suggestion: 'Add a version field'
            });
          }
        }
        
        if (configFile === '.env' && content.includes('YOUR_')) {
          issues.push({
            type: 'config',
            severity: 'high',
            file: configFile,
            description: 'Placeholder values found in .env file',
            suggestion: 'Replace placeholder values with actual configuration'
          });
        }
        
      } catch {
        // File doesn't exist or can't be read
      }
    }
    
    return issues;
  }
}