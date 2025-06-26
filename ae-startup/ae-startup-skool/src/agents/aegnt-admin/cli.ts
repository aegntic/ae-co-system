#!/usr/bin/env node

/**
 * CLI interface for aegnt-admin
 * Quick access to administrative tasks
 */

import { AdminAgent } from './index';
import * as process from 'process';

const agent = new AdminAgent({
  logLevel: 'info',
  autoBackup: true
});

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'dates':
      // Update dates in journal
      const targetDate = args[0] || new Date().toISOString().split('T')[0];
      const results = await agent.correctDates({
        directory: './journal',
        targetDate,
        dryRun: args.includes('--dry-run')
      });
      console.log('Date correction results:', results);
      break;

    case 'organize':
      // Organize files
      const orgResults = await agent.organizeFiles({
        sourceDir: args[0] || '.',
        rules: 'by-type' as any,
        dryRun: args.includes('--dry-run')
      });
      console.log('Organization results:', orgResults);
      break;

    case 'journal':
      // Create new journal entry
      const journalResult = await agent.updateJournal({
        action: 'create',
        content: args.join(' ') || 'New journal entry',
        metadata: { 
          title: 'Daily Update',
          project: 'ae-startup-skool'
        }
      });
      console.log('Journal update:', journalResult);
      break;

    case 'scan':
      // Scan for administrative tasks
      const scanResults = await agent.scanForTasks(args[0] || '.');
      console.log('Administrative scan results:');
      console.log(`- Date issues: ${scanResults.dateIssues.length}`);
      console.log(`- Organization issues: ${scanResults.organizationIssues.length}`);
      console.log(`- Config issues: ${scanResults.configIssues.length}`);
      console.log(`Total issues found: ${scanResults.total}`);
      break;

    case 'help':
    default:
      console.log(`
aegnt-admin - Administrative Task Sub-Agent

Usage: aegnt-admin [command] [options]

Commands:
  dates [target-date]     Correct dates in journal entries
                         Options: --dry-run
  
  organize [directory]    Organize files by type
                         Options: --dry-run
  
  journal [content]       Create new journal entry
  
  scan [directory]        Scan for administrative tasks
  
  help                    Show this help message

Examples:
  aegnt-admin dates 2025-06-20
  aegnt-admin organize ./downloads --dry-run
  aegnt-admin journal "Completed admin system implementation"
  aegnt-admin scan .
`);
      break;
  }
}

main().catch(console.error);