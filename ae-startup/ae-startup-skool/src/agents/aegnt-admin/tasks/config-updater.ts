/**
 * Config Updater Task Module
 * Handles configuration file updates
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { Logger } from '../../../shared/logger';
import { AdminAgentConfig } from '../index';

export interface ConfigUpdateOptions {
  filePath: string;
  updates: Record<string, any>;
  merge?: boolean;
  validate?: boolean;
}

export class ConfigUpdater {
  private logger: Logger;
  private config: AdminAgentConfig;

  constructor(logger: Logger, config: AdminAgentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async update(options: ConfigUpdateOptions): Promise<{
    success: boolean;
    message: string;
    changes?: Record<string, { old: any; new: any }>;
  }> {
    const { filePath, updates, merge = true, validate = true } = options;

    try {
      // Determine file type
      const ext = path.extname(filePath).toLowerCase();
      let currentConfig: any = {};
      let fileContent: string = '';

      // Read existing config if file exists
      try {
        fileContent = await fs.readFile(filePath, 'utf-8');
        currentConfig = await this.parseConfig(fileContent, ext);
      } catch (error) {
        // File doesn't exist, will create new
        this.logger.info(`Creating new config file: ${filePath}`);
      }

      // Create backup if file exists
      if (fileContent && this.config.autoBackup) {
        await this.createBackup(filePath, fileContent);
      }

      // Track changes
      const changes: Record<string, { old: any; new: any }> = {};

      // Apply updates
      let newConfig: any;
      if (merge) {
        newConfig = this.deepMerge(currentConfig, updates);
        
        // Track what changed
        for (const key of Object.keys(updates)) {
          if (currentConfig[key] !== newConfig[key]) {
            changes[key] = {
              old: currentConfig[key],
              new: newConfig[key]
            };
          }
        }
      } else {
        newConfig = updates;
        
        // All keys are changes in replace mode
        for (const key of Object.keys(updates)) {
          changes[key] = {
            old: currentConfig[key],
            new: updates[key]
          };
        }
      }

      // Validate if requested
      if (validate) {
        const validationResult = await this.validateConfig(newConfig, ext);
        if (!validationResult.valid) {
          throw new Error(`Config validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // Write updated config
      const newContent = await this.formatConfig(newConfig, ext);
      await fs.writeFile(filePath, newContent, 'utf-8');

      this.logger.info(`Updated config file: ${filePath}`);

      return {
        success: true,
        message: `Config file updated successfully with ${Object.keys(changes).length} changes`,
        changes
      };

    } catch (error) {
      this.logger.error('Config update failed', error);
      return {
        success: false,
        message: `Config update failed: ${error}`
      };
    }
  }

  private async parseConfig(content: string, ext: string): Promise<any> {
    switch (ext) {
      case '.json':
        return JSON.parse(content);
        
      case '.yaml':
      case '.yml':
        return yaml.parse(content);
        
      case '.toml':
        // Would need a TOML parser library
        throw new Error('TOML support not yet implemented');
        
      default:
        throw new Error(`Unsupported config file type: ${ext}`);
    }
  }

  private async formatConfig(config: any, ext: string): Promise<string> {
    switch (ext) {
      case '.json':
        return JSON.stringify(config, null, 2);
        
      case '.yaml':
      case '.yml':
        return yaml.stringify(config);
        
      case '.toml':
        throw new Error('TOML support not yet implemented');
        
      default:
        throw new Error(`Unsupported config file type: ${ext}`);
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] instanceof Object && !Array.isArray(source[key]) && target[key]) {
          result[key] = this.deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private async validateConfig(config: any, ext: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic validation rules
    if (ext === '.json' && config.name === 'package.json') {
      // Package.json specific validation
      if (!config.name) errors.push('Missing required field: name');
      if (!config.version) errors.push('Missing required field: version');
    }

    // Check for common issues
    const checkForPlaceholders = (obj: any, path: string = ''): void => {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          if (value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
            errors.push(`Placeholder value found at ${currentPath}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          checkForPlaceholders(value, currentPath);
        }
      }
    };

    checkForPlaceholders(config);

    return {
      valid: errors.length === 0,
      errors
    };
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