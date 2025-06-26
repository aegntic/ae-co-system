/**
 * aegnt-admin: Administrative Task Sub-Agent
 * Handles routine maintenance tasks to keep the main development focused
 */

import { DateCorrector } from './tasks/date-corrector';
import { FileOrganizer } from './tasks/file-organizer';
import { JournalManager } from './tasks/journal-manager';
import { ConfigUpdater } from './tasks/config-updater';
import { FileScanner } from './utils/file-scanner';
import { Logger } from '../../shared/logger';

export interface AdminAgentConfig {
  autoBackup?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  workingDirectory?: string;
}

export class AdminAgent {
  private dateCorrector: DateCorrector;
  private fileOrganizer: FileOrganizer;
  private journalManager: JournalManager;
  private configUpdater: ConfigUpdater;
  private logger: Logger;
  private config: AdminAgentConfig;

  constructor(config: AdminAgentConfig = {}) {
    this.config = {
      autoBackup: true,
      logLevel: 'info',
      workingDirectory: process.cwd(),
      ...config
    };

    this.logger = new Logger('aegnt-admin', this.config.logLevel);
    this.dateCorrector = new DateCorrector(this.logger, this.config);
    this.fileOrganizer = new FileOrganizer(this.logger, this.config);
    this.journalManager = new JournalManager(this.logger, this.config);
    this.configUpdater = new ConfigUpdater(this.logger, this.config);
  }

  /**
   * Correct dates in files within a directory
   */
  async correctDates(options: {
    directory: string;
    targetDate: string;
    patterns?: string[];
    dryRun?: boolean;
  }) {
    this.logger.info(`Starting date correction in ${options.directory}`);
    return await this.dateCorrector.correct(options);
  }

  /**
   * Organize files according to rules
   */
  async organizeFiles(options: {
    sourceDir: string;
    targetDir?: string;
    rules?: 'default' | 'by-type' | 'by-date' | 'custom';
    customRules?: any;
  }) {
    this.logger.info(`Starting file organization in ${options.sourceDir}`);
    return await this.fileOrganizer.organize(options);
  }

  /**
   * Update journal entries
   */
  async updateJournal(options: {
    action: 'create' | 'append' | 'update' | 'index';
    entryId?: string;
    content?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.info(`Updating journal: ${options.action}`);
    return await this.journalManager.update(options);
  }

  /**
   * Update configuration files
   */
  async updateConfig(options: {
    filePath: string;
    updates: Record<string, any>;
    merge?: boolean;
    validate?: boolean;
  }) {
    this.logger.info(`Updating configuration: ${options.filePath}`);
    return await this.configUpdater.update(options);
  }

  /**
   * Run a batch of administrative tasks
   */
  async runBatch(tasks: Array<{
    type: 'date' | 'organize' | 'journal' | 'config';
    options: any;
  }>) {
    const results = [];
    
    for (const task of tasks) {
      try {
        let result;
        switch (task.type) {
          case 'date':
            result = await this.correctDates(task.options);
            break;
          case 'organize':
            result = await this.organizeFiles(task.options);
            break;
          case 'journal':
            result = await this.updateJournal(task.options);
            break;
          case 'config':
            result = await this.updateConfig(task.options);
            break;
          default:
            throw new Error(`Unknown task type: ${task.type}`);
        }
        results.push({ task, result, status: 'success' });
      } catch (error) {
        this.logger.error(`Task failed: ${task.type}`, error);
        results.push({ task, error, status: 'failed' });
      }
    }
    
    return results;
  }

  /**
   * Scan for administrative tasks that need attention
   */
  async scanForTasks(directory: string = this.config.workingDirectory!) {
    const scanner = new FileScanner(this.logger);
    const issues = await scanner.findIssues(directory);
    
    return {
      dateIssues: issues.filter(i => i.type === 'date'),
      organizationIssues: issues.filter(i => i.type === 'organization'),
      configIssues: issues.filter(i => i.type === 'config'),
      total: issues.length
    };
  }
}