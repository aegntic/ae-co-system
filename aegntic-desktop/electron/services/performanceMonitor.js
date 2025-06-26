const { app, ipcMain } = require('electron');

/**
 * Performance monitoring service for tracking app performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.startTime = Date.now();
    
    // Performance thresholds
    this.thresholds = {
      memory: {
        rss: 500 * 1024 * 1024, // 500MB RSS memory limit
        heapUsed: 300 * 1024 * 1024, // 300MB heap limit
      },
      response: {
        maxLatency: 500, // 500ms max response time
      },
      startup: {
        maxTime: 3000, // 3 seconds max startup time
      }
    };

    this.setupIpcHandlers();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('[PerformanceMonitor] Starting performance monitoring...');
    
    // Record app startup time
    this.recordMetric('startup.time', Date.now() - this.startTime);
    
    // Monitor memory usage every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
    
    // Monitor app events
    this.setupEventMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('[PerformanceMonitor] Stopping performance monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Collect system-level metrics
   */
  collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.recordMetric('memory.rss', memUsage.rss);
      this.recordMetric('memory.heapUsed', memUsage.heapUsed);
      this.recordMetric('memory.heapTotal', memUsage.heapTotal);
      this.recordMetric('memory.external', memUsage.external);

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      this.recordMetric('cpu.user', cpuUsage.user);
      this.recordMetric('cpu.system', cpuUsage.system);

      // Check thresholds and alert if exceeded
      this.checkThresholds(memUsage);
      
    } catch (error) {
      console.error('[PerformanceMonitor] Error collecting metrics:', error);
    }
  }

  /**
   * Setup monitoring for app events
   */
  setupEventMonitoring() {
    // Monitor window events
    app.on('browser-window-created', () => {
      this.recordMetric('windows.created', 1);
    });

    app.on('browser-window-closed', () => {
      this.recordMetric('windows.closed', 1);
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const timestamp = Date.now();
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricData = {
      value,
      timestamp,
      ...metadata
    };
    
    // Keep only last 100 entries per metric to prevent memory bloat
    const entries = this.metrics.get(name);
    entries.push(metricData);
    
    if (entries.length > 100) {
      entries.shift();
    }
    
    // Log significant metrics
    if (name.includes('startup') || name.includes('response')) {
      console.log(`[PerformanceMonitor] ${name}: ${value}ms`);
    }
  }

  /**
   * Record timing for operations
   */
  startTiming(operationName) {
    const startTime = Date.now();
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.recordMetric(`timing.${operationName}`, duration);
        return duration;
      }
    };
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  checkThresholds(memUsage) {
    if (memUsage.rss > this.thresholds.memory.rss) {
      console.warn(`[PerformanceMonitor] Memory RSS threshold exceeded: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    }
    
    if (memUsage.heapUsed > this.thresholds.memory.heapUsed) {
      console.warn(`[PerformanceMonitor] Heap usage threshold exceeded: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {};
    
    for (const [metricName, entries] of this.metrics.entries()) {
      if (entries.length === 0) continue;
      
      const values = entries.map(entry => entry.value);
      const latest = entries[entries.length - 1];
      
      summary[metricName] = {
        current: latest.value,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: entries.length,
        timestamp: latest.timestamp
      };
    }
    
    return summary;
  }

  /**
   * Setup IPC handlers for renderer process communication
   */
  setupIpcHandlers() {
    ipcMain.handle('performance:getSummary', () => {
      return this.getPerformanceSummary();
    });

    ipcMain.handle('performance:recordMetric', (event, name, value, metadata) => {
      this.recordMetric(name, value, metadata);
    });

    ipcMain.handle('performance:startTiming', (event, operationName) => {
      // Return a timing ID that can be used to end timing
      const timingId = `${operationName}_${Date.now()}_${Math.random()}`;
      const startTime = Date.now();
      
      // Store timing start
      this.recordMetric(`timing.${operationName}.start`, startTime, { timingId });
      
      return timingId;
    });

    ipcMain.handle('performance:endTiming', (event, timingId, operationName) => {
      const endTime = Date.now();
      const entries = this.metrics.get(`timing.${operationName}.start`) || [];
      const startEntry = entries.find(entry => entry.timingId === timingId);
      
      if (startEntry) {
        const duration = endTime - startEntry.value;
        this.recordMetric(`timing.${operationName}`, duration);
        return duration;
      }
      
      return null;
    });
  }

  /**
   * Export metrics to file for analysis
   */
  async exportMetrics(filePath) {
    try {
      const fs = require('fs').promises;
      const summary = this.getPerformanceSummary();
      const exportData = {
        timestamp: new Date().toISOString(),
        summary,
        rawMetrics: Object.fromEntries(this.metrics)
      };
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
      console.log(`[PerformanceMonitor] Metrics exported to ${filePath}`);
    } catch (error) {
      console.error('[PerformanceMonitor] Error exporting metrics:', error);
    }
  }
}

module.exports = PerformanceMonitor;