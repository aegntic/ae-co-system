/**
 * Sub-Agent Delegation System - Main Export File
 * Complete parallel execution and task coordination system for 4site.pro
 */

// Core Components
export { default as SubAgentOrchestrator } from './SubAgentOrchestrator';
export { default as TaskManager } from './TaskManager';
export { default as ConflictResolver } from './ConflictResolver';
export { default as ProgressMonitor } from './ProgressMonitor';
export { default as QualityAssurance } from './QualityAssurance';
export { default as DelegationSystemController } from './DelegationSystemController';

// Types and Interfaces
export * from './SubAgentOrchestrator';
export * from './TaskManager';
export * from './ConflictResolver';
export * from './ProgressMonitor';
export * from './QualityAssurance';
export * from './DelegationSystemController';

// System Factory
export class DelegationSystemFactory {
  /**
   * Create a complete delegation system with default configuration
   */
  public static createSystem(config?: Partial<import('./DelegationSystemController').DelegationConfig>): import('./DelegationSystemController').default {
    const defaultConfig: import('./DelegationSystemController').DelegationConfig = {
      maxParallelTasks: 10,
      autoResolveConflicts: true,
      qualityGatesEnabled: true,
      realTimeMonitoring: true,
      advancedAnalytics: true,
      alertThresholds: {
        highConflictCount: 10,
        lowVelocity: 0.5,
        highBlockedTasks: 5,
        lowQualityScore: 70,
        overloadedAgents: 2
      },
      performanceTargets: {
        taskCompletionVelocity: 2.0, // tasks per hour
        qualityGatePassRate: 85, // percentage
        conflictResolutionTime: 30, // minutes
        systemUptime: 99.5, // percentage
        resourceUtilization: 80 // percentage
      },
      integrations: {
        githubWebhooks: false,
        slackNotifications: false,
        jiraTickets: false,
        datadogMetrics: false,
        prometheusExport: true
      }
    };

    const finalConfig = { ...defaultConfig, ...config };
    return new (require('./DelegationSystemController').default)(finalConfig);
  }

  /**
   * Create a system optimized for development environments
   */
  public static createDevelopmentSystem(): import('./DelegationSystemController').default {
    return this.createSystem({
      maxParallelTasks: 5,
      autoResolveConflicts: true,
      qualityGatesEnabled: false, // Disabled for faster development
      realTimeMonitoring: true,
      advancedAnalytics: false,
      alertThresholds: {
        highConflictCount: 5,
        lowVelocity: 0.2,
        highBlockedTasks: 3,
        lowQualityScore: 60,
        overloadedAgents: 1
      }
    });
  }

  /**
   * Create a system optimized for production environments
   */
  public static createProductionSystem(): import('./DelegationSystemController').default {
    return this.createSystem({
      maxParallelTasks: 20,
      autoResolveConflicts: false, // Manual review in production
      qualityGatesEnabled: true,
      realTimeMonitoring: true,
      advancedAnalytics: true,
      alertThresholds: {
        highConflictCount: 15,
        lowVelocity: 1.0,
        highBlockedTasks: 8,
        lowQualityScore: 85,
        overloadedAgents: 3
      },
      integrations: {
        githubWebhooks: true,
        slackNotifications: true,
        jiraTickets: true,
        datadogMetrics: true,
        prometheusExport: true
      }
    });
  }

  /**
   * Create a system optimized for enterprise environments
   */
  public static createEnterpriseSystem(): import('./DelegationSystemController').default {
    return this.createSystem({
      maxParallelTasks: 50,
      autoResolveConflicts: false,
      qualityGatesEnabled: true,
      realTimeMonitoring: true,
      advancedAnalytics: true,
      alertThresholds: {
        highConflictCount: 25,
        lowVelocity: 2.0,
        highBlockedTasks: 15,
        lowQualityScore: 90,
        overloadedAgents: 5
      },
      performanceTargets: {
        taskCompletionVelocity: 5.0,
        qualityGatePassRate: 95,
        conflictResolutionTime: 15,
        systemUptime: 99.9,
        resourceUtilization: 85
      },
      integrations: {
        githubWebhooks: true,
        slackNotifications: true,
        jiraTickets: true,
        datadogMetrics: true,
        prometheusExport: true
      }
    });
  }
}

// Quick Start Functions
export const quickStart = {
  /**
   * Initialize and start a delegation system with minimal configuration
   */
  async start(environment: 'development' | 'production' | 'enterprise' = 'development'): Promise<import('./DelegationSystemController').default> {
    console.log(`🚀 Starting Sub-Agent Delegation System in ${environment} mode...`);

    let system: import('./DelegationSystemController').default;

    switch (environment) {
      case 'production':
        system = DelegationSystemFactory.createProductionSystem();
        break;
      case 'enterprise':
        system = DelegationSystemFactory.createEnterpriseSystem();
        break;
      default:
        system = DelegationSystemFactory.createDevelopmentSystem();
    }

    await system.initialize();
    
    console.log('✅ Sub-Agent Delegation System ready!');
    console.log('📊 Access dashboard data with: system.getDashboardData()');
    console.log('📋 Delegate tasks with: system.delegateTask(taskDefinition)');
    console.log('🔄 Execute parallel batches with: system.executeParallelBatch(taskIds)');
    console.log('📈 Generate reports with: system.generateDelegationReport()');

    return system;
  },

  /**
   * Create a demo system with sample tasks for testing
   */
  async demo(): Promise<import('./DelegationSystemController').default> {
    console.log('🎬 Starting Sub-Agent Delegation System DEMO...');

    const system = DelegationSystemFactory.createDevelopmentSystem();
    await system.initialize();

    // Add sample tasks for demonstration
    const sampleTasks = [
      {
        name: 'Database Schema Setup',
        description: 'Deploy enhanced viral mechanics database schema',
        phase: require('./SubAgentOrchestrator').DevelopmentPhase.PRODUCTION_DEPLOYMENT,
        priority: require('./SubAgentOrchestrator').TaskPriority.CRITICAL,
        complexity: require('./SubAgentOrchestrator').TaskComplexity.COMPLEX,
        estimatedHours: 6,
        dependencies: [],
        requiredSkills: [
          require('./SubAgentOrchestrator').Skill.POSTGRESQL,
          require('./SubAgentOrchestrator').Skill.SUPABASE
        ],
        parallelizable: false,
        criticalPath: true,
        metadata: { category: 'infrastructure' }
      },
      {
        name: 'Frontend Component Integration',
        description: 'Integrate viral mechanics React components',
        phase: require('./SubAgentOrchestrator').DevelopmentPhase.PRODUCTION_DEPLOYMENT,
        priority: require('./SubAgentOrchestrator').TaskPriority.HIGH,
        complexity: require('./SubAgentOrchestrator').TaskComplexity.MODERATE,
        estimatedHours: 4,
        dependencies: [],
        requiredSkills: [
          require('./SubAgentOrchestrator').Skill.REACT,
          require('./SubAgentOrchestrator').Skill.TYPESCRIPT
        ],
        parallelizable: true,
        criticalPath: false,
        metadata: { category: 'frontend' }
      },
      {
        name: 'Quality Assurance Testing',
        description: 'Execute comprehensive QA testing suite',
        phase: require('./SubAgentOrchestrator').DevelopmentPhase.USER_EXPERIENCE_VALIDATION,
        priority: require('./SubAgentOrchestrator').TaskPriority.HIGH,
        complexity: require('./SubAgentOrchestrator').TaskComplexity.MODERATE,
        estimatedHours: 8,
        dependencies: [],
        requiredSkills: [
          require('./SubAgentOrchestrator').Skill.TESTING,
          require('./SubAgentOrchestrator').Skill.PERFORMANCE
        ],
        parallelizable: true,
        criticalPath: true,
        metadata: { category: 'testing' }
      }
    ];

    // Delegate sample tasks
    const taskIds: string[] = [];
    for (const task of sampleTasks) {
      const taskId = await system.delegateTask(task);
      taskIds.push(taskId);
      console.log(`📋 Delegated demo task: ${task.name} [${taskId}]`);
    }

    // Execute parallel batch of the parallelizable tasks
    const parallelizableTasks = taskIds.slice(1); // Skip the first non-parallelizable task
    if (parallelizableTasks.length > 0) {
      await system.executeParallelBatch(parallelizableTasks);
      console.log(`🔄 Started parallel execution of ${parallelizableTasks.length} tasks`);
    }

    console.log('✅ Demo system ready with sample tasks!');
    console.log('📊 View dashboard: system.getDashboardData()');
    console.log('📈 Generate report: system.generateDelegationReport()');

    return system;
  }
};

// Utility Functions
export const utils = {
  /**
   * Generate task definition from project planning documents
   */
  generateTasksFromPlanning(planningDocument: string): Partial<import('./SubAgentOrchestrator').TaskDefinition>[] {
    // Parse planning document and extract tasks
    // This would integrate with the existing TASKS.md and PLANNING.md files
    const tasks: Partial<import('./SubAgentOrchestrator').TaskDefinition>[] = [];

    // Example parsing logic (would be more sophisticated in practice)
    const taskMatches = planningDocument.match(/- \[ \] (.+)/g);
    if (taskMatches) {
      taskMatches.forEach((match, index) => {
        const taskName = match.replace('- [ ] ', '').trim();
        tasks.push({
          name: taskName,
          description: `Auto-generated task: ${taskName}`,
          phase: require('./SubAgentOrchestrator').DevelopmentPhase.PRODUCTION_DEPLOYMENT,
          priority: require('./SubAgentOrchestrator').TaskPriority.MEDIUM,
          complexity: require('./SubAgentOrchestrator').TaskComplexity.MODERATE,
          estimatedHours: 4,
          dependencies: [],
          requiredSkills: [require('./SubAgentOrchestrator').Skill.TYPESCRIPT],
          parallelizable: true,
          criticalPath: false,
          metadata: { sourceDocument: 'planning', autoGenerated: true }
        });
      });
    }

    return tasks;
  },

  /**
   * Export system metrics in various formats
   */
  exportMetrics(system: import('./DelegationSystemController').default, format: 'json' | 'csv' | 'prometheus' = 'json'): string {
    const metrics = system.exportMetrics();
    
    switch (format) {
      case 'csv':
        return this.convertToCSV(metrics);
      case 'prometheus':
        return system.exportMetrics('prometheus');
      default:
        return JSON.stringify(metrics, null, 2);
    }
  },

  /**
   * Generate dashboard URL for external monitoring tools
   */
  generateDashboardURL(system: import('./DelegationSystemController').default, tool: 'grafana' | 'datadog' | 'custom'): string {
    const baseMetrics = system.exportMetrics();
    
    switch (tool) {
      case 'grafana':
        return `http://grafana.local/dashboard/delegation-system?from=${Date.now() - 3600000}&to=${Date.now()}`;
      case 'datadog':
        return `https://app.datadoghq.com/dashboard/delegation-system`;
      default:
        return `/dashboard?metrics=${encodeURIComponent(JSON.stringify(baseMetrics))}`;
    }
  },

  /**
   * Validate system health and readiness
   */
  validateSystemHealth(system: import('./DelegationSystemController').default): { healthy: boolean; issues: string[] } {
    const status = system.getSystemStatus();
    const issues: string[] = [];

    if (status.status !== require('./DelegationSystemController').SystemState.RUNNING) {
      issues.push(`System not in running state: ${status.status}`);
    }

    if (status.performance.efficiency < 70) {
      issues.push(`Low system efficiency: ${status.performance.efficiency}%`);
    }

    const criticalAlerts = status.alerts.filter(alert => 
      alert.severity === require('./DelegationSystemController').AlertSeverity.CRITICAL
    );
    if (criticalAlerts.length > 0) {
      issues.push(`${criticalAlerts.length} critical alerts active`);
    }

    const errorComponents = status.activeComponents.filter(component =>
      component.status === require('./DelegationSystemController').ComponentState.ERROR
    );
    if (errorComponents.length > 0) {
      issues.push(`${errorComponents.length} components in error state`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  },

  // Private helper methods
  convertToCSV(data: any): string {
    const flatten = (obj: any, prefix = ''): any => {
      let flattened: any = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flatten(obj[key], `${prefix}${key}.`));
        } else {
          flattened[`${prefix}${key}`] = obj[key];
        }
      }
      return flattened;
    };

    const flatData = flatten(data);
    const headers = Object.keys(flatData);
    const values = Object.values(flatData);

    return [headers.join(','), values.join(',')].join('\n');
  }
};

// Default export
export default {
  DelegationSystemFactory,
  quickStart,
  utils
};

// Documentation and examples
export const examples = {
  /**
   * Basic usage example
   */
  basicUsage: `
    import { quickStart } from './systems/delegation';

    // Start the system
    const system = await quickStart.start('development');

    // Add a task
    const taskId = await system.delegateTask({
      name: 'Implement feature X',
      description: 'Add new functionality to the application',
      phase: DevelopmentPhase.PRODUCTION_DEPLOYMENT,
      priority: TaskPriority.HIGH,
      complexity: TaskComplexity.MODERATE,
      estimatedHours: 6,
      dependencies: [],
      requiredSkills: [Skill.REACT, Skill.TYPESCRIPT],
      parallelizable: true,
      criticalPath: false,
      metadata: { feature: 'user-authentication' }
    });

    // Monitor progress
    const dashboard = system.getDashboardData();
    console.log('Current progress:', dashboard.progress);

    // Generate report
    const report = system.generateDelegationReport();
    console.log('Executive summary:', report.executiveSummary);
  `,

  /**
   * Advanced configuration example
   */
  advancedConfiguration: `
    import { DelegationSystemFactory } from './systems/delegation';

    // Create custom system
    const system = DelegationSystemFactory.createSystem({
      maxParallelTasks: 15,
      autoResolveConflicts: false,
      qualityGatesEnabled: true,
      alertThresholds: {
        highConflictCount: 8,
        lowVelocity: 1.0,
        highBlockedTasks: 5,
        lowQualityScore: 85,
        overloadedAgents: 2
      },
      performanceTargets: {
        taskCompletionVelocity: 3.0,
        qualityGatePassRate: 90,
        conflictResolutionTime: 20,
        systemUptime: 99.8,
        resourceUtilization: 85
      }
    });

    await system.initialize();

    // Set up event listeners
    system.on('task:completed', (task) => {
      console.log(\`Task completed: \${task.name}\`);
    });

    system.on('conflict:detected', (conflict) => {
      console.log(\`Conflict detected: \${conflict.title}\`);
    });

    system.on('alert:created', (alert) => {
      console.log(\`Alert: \${alert.message}\`);
    });
  `,

  /**
   * Parallel execution example
   */
  parallelExecution: `
    import { quickStart } from './systems/delegation';

    const system = await quickStart.start('production');

    // Create multiple related tasks
    const taskIds = [];
    
    const parallelTasks = [
      { name: 'Frontend Components', skills: [Skill.REACT] },
      { name: 'API Endpoints', skills: [Skill.NODE_JS] },
      { name: 'Database Migration', skills: [Skill.POSTGRESQL] },
      { name: 'Unit Tests', skills: [Skill.TESTING] }
    ];

    for (const task of parallelTasks) {
      const taskId = await system.delegateTask({
        name: task.name,
        description: \`Implement \${task.name}\`,
        phase: DevelopmentPhase.PRODUCTION_DEPLOYMENT,
        priority: TaskPriority.HIGH,
        complexity: TaskComplexity.MODERATE,
        estimatedHours: 4,
        dependencies: [],
        requiredSkills: task.skills,
        parallelizable: true,
        criticalPath: false,
        metadata: { batch: 'feature-implementation' }
      });
      taskIds.push(taskId);
    }

    // Execute all tasks in parallel
    await system.executeParallelBatch(taskIds);

    // Monitor batch progress
    system.on('batch:completed', ({ taskIds, completedAt }) => {
      console.log(\`Batch completed: \${taskIds.length} tasks at \${completedAt}\`);
    });
  `
};

// Type definitions for external use
export type {
  TaskDefinition,
  AgentDefinition,
  DevelopmentPhase,
  TaskPriority,
  TaskComplexity,
  TaskStatus,
  Skill
} from './SubAgentOrchestrator';

export type {
  TaskExecution,
  ExecutionStrategy,
  ExecutionStatus
} from './TaskManager';

export type {
  Conflict,
  ConflictResolution,
  ConflictType,
  ConflictSeverity
} from './ConflictResolver';

export type {
  ProgressSnapshot,
  OverallProgress,
  PhaseProgress,
  AgentProgress
} from './ProgressMonitor';

export type {
  QualityGate,
  QualityAssessment,
  QualityCriteria,
  AssessmentStatus
} from './QualityAssurance';

export type {
  DelegationConfig,
  SystemStatus,
  DelegationReport,
  SystemState
} from './DelegationSystemController';