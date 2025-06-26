// AegntiX Advanced Logging System
// Structured logging with performance metrics and error tracking

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  duration?: number;
  requestId?: string;
  userId?: string;
  scenarioId?: string;
  agentId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    const context = entry.scenarioId ? ` [scenario:${entry.scenarioId.slice(0, 8)}]` : '';
    const agent = entry.agentId ? ` [agent:${entry.agentId}]` : '';
    
    return `${timestamp} [${levelName}] ${entry.component}${context}${agent}: ${entry.message}${duration}`;
  }

  private log(level: LogLevel, component: string, message: string, data?: any, context?: {
    duration?: number;
    requestId?: string;
    userId?: string;
    scenarioId?: string;
    agentId?: string;
  }): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
      ...context
    };

    this.logs.push(entry);
    
    // Trim logs if exceeding max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with appropriate styling
    const formattedMessage = this.formatMessage(entry);
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`🔍 ${formattedMessage}`, data || '');
        break;
      case LogLevel.INFO:
        console.info(`ℹ️ ${formattedMessage}`, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`⚠️ ${formattedMessage}`, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`❌ ${formattedMessage}`, data || '');
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 ${formattedMessage}`, data || '');
        break;
    }
  }

  debug(component: string, message: string, data?: any, context?: any): void {
    this.log(LogLevel.DEBUG, component, message, data, context);
  }

  info(component: string, message: string, data?: any, context?: any): void {
    this.log(LogLevel.INFO, component, message, data, context);
  }

  warn(component: string, message: string, data?: any, context?: any): void {
    this.log(LogLevel.WARN, component, message, data, context);
  }

  error(component: string, message: string, error?: Error | any, context?: any): void {
    const data = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    this.log(LogLevel.ERROR, component, message, data, context);
  }

  critical(component: string, message: string, error?: Error | any, context?: any): void {
    const data = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    this.log(LogLevel.CRITICAL, component, message, data, context);
  }

  // Performance timing helpers
  startTimer(component: string, operation: string, context?: any): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(component, `${operation} completed`, undefined, { ...context, duration });
    };
  }

  // Retrieve logs for debugging
  getLogs(filter?: {
    level?: LogLevel;
    component?: string;
    scenarioId?: string;
    agentId?: string;
    since?: number;
  }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filter) {
      if (filter.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level >= filter.level!);
      }
      if (filter.component) {
        filteredLogs = filteredLogs.filter(log => log.component === filter.component);
      }
      if (filter.scenarioId) {
        filteredLogs = filteredLogs.filter(log => log.scenarioId === filter.scenarioId);
      }
      if (filter.agentId) {
        filteredLogs = filteredLogs.filter(log => log.agentId === filter.agentId);
      }
      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
      }
    }

    return filteredLogs;
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }
}

// Global logger instance
export const logger = Logger.getInstance();

// Performance monitoring decorator
export function monitored(component: string, operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const opName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const endTimer = logger.startTimer(component, opName);
      try {
        const result = await method.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        logger.error(component, `${opName} failed`, error);
        throw error;
      }
    };
  };
}

// Error boundary for async operations
export async function withErrorHandling<T>(
  component: string,
  operation: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T | null> {
  try {
    const endTimer = logger.startTimer(component, operation, context);
    const result = await fn();
    endTimer();
    return result;
  } catch (error) {
    logger.error(component, `${operation} failed`, error, context);
    return null;
  }
}

// Synchronous version for sync operations
export function withErrorHandlingSync<T>(
  component: string,
  operation: string,
  fn: () => T,
  context?: any
): T | null {
  try {
    const endTimer = logger.startTimer(component, operation, context);
    const result = fn();
    endTimer();
    return result;
  } catch (error) {
    logger.error(component, `${operation} failed`, error, context);
    return null;
  }
}