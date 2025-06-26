import React, { useState, useEffect } from 'react';

const { invoke } = window.electronAPI;

interface PerformanceMetric {
  current: number;
  average: number;
  min: number;
  max: number;
  count: number;
  timestamp: number;
}

interface PerformanceSummary {
  [key: string]: PerformanceMetric;
}

interface SecurityStatus {
  cspEnabled: boolean;
  contextIsolation: boolean;
  nodeIntegration: boolean;
  validationEnabled: boolean;
  securityHeaders: string[];
}

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isVisible, onClose }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceSummary>({});
  const [securityData, setSecurityData] = useState<SecurityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format milliseconds to readable format
  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get performance metrics and security status from main process
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load performance data
      const summary = await invoke('performance:getSummary');
      setPerformanceData(summary);
      
      // Load security status
      const securityStatus = await invoke('security:getStatus');
      setSecurityData(securityStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
      console.error('Error loading performance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh performance data every 5 seconds when visible
  useEffect(() => {
    if (!isVisible) return;

    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const renderMetricCard = (title: string, metric: PerformanceMetric, formatter: (value: number) => string) => (
    <div key={title} className="performance-metric-card">
      <h4>{title}</h4>
      <div className="metric-value">
        <span className="current">{formatter(metric.current)}</span>
        <span className="label">Current</span>
      </div>
      <div className="metric-stats">
        <div className="stat">
          <span className="value">{formatter(metric.average)}</span>
          <span className="label">Average</span>
        </div>
        <div className="stat">
          <span className="value">{formatter(metric.min)}</span>
          <span className="label">Min</span>
        </div>
        <div className="stat">
          <span className="value">{formatter(metric.max)}</span>
          <span className="label">Max</span>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard">
        <div className="dashboard-header">
          <h2>Performance Dashboard</h2>
          <div className="dashboard-actions">
            <button onClick={loadPerformanceData} disabled={isLoading} className="refresh-btn">
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="dashboard-content">
          {/* Memory Metrics */}
          <div className="metric-section">
            <h3>Memory Usage</h3>
            <div className="metrics-grid">
              {performanceData['memory.rss'] && renderMetricCard(
                'RSS Memory',
                performanceData['memory.rss'],
                formatBytes
              )}
              {performanceData['memory.heapUsed'] && renderMetricCard(
                'Heap Used',
                performanceData['memory.heapUsed'],
                formatBytes
              )}
              {performanceData['memory.heapTotal'] && renderMetricCard(
                'Heap Total',
                performanceData['memory.heapTotal'],
                formatBytes
              )}
              {performanceData['memory.external'] && renderMetricCard(
                'External Memory',
                performanceData['memory.external'],
                formatBytes
              )}
            </div>
          </div>

          {/* Timing Metrics */}
          <div className="metric-section">
            <h3>Performance Timing</h3>
            <div className="metrics-grid">
              {performanceData['startup.time'] && renderMetricCard(
                'Startup Time',
                performanceData['startup.time'],
                formatMs
              )}
              {Object.entries(performanceData)
                .filter(([key]) => key.startsWith('timing.'))
                .map(([key, metric]) => renderMetricCard(
                  key.replace('timing.', '').replace(/\./g, ' ').toUpperCase(),
                  metric,
                  formatMs
                ))}
            </div>
          </div>

          {/* System Metrics */}
          <div className="metric-section">
            <h3>System Resources</h3>
            <div className="metrics-grid">
              {performanceData['cpu.user'] && renderMetricCard(
                'CPU User Time',
                performanceData['cpu.user'],
                (value) => `${Math.round(value / 1000)}ms`
              )}
              {performanceData['cpu.system'] && renderMetricCard(
                'CPU System Time',
                performanceData['cpu.system'],
                (value) => `${Math.round(value / 1000)}ms`
              )}
              {performanceData['windows.created'] && renderMetricCard(
                'Windows Created',
                performanceData['windows.created'],
                (value) => value.toString()
              )}
            </div>
          </div>

          {/* Security Status */}
          {securityData && (
            <div className="metric-section">
              <h3>Security Status</h3>
              <div className="security-grid">
                <div className="security-item">
                  <span className="security-label">Content Security Policy</span>
                  <span className={`security-status ${securityData.cspEnabled ? 'enabled' : 'disabled'}`}>
                    {securityData.cspEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="security-item">
                  <span className="security-label">Context Isolation</span>
                  <span className={`security-status ${securityData.contextIsolation ? 'enabled' : 'disabled'}`}>
                    {securityData.contextIsolation ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="security-item">
                  <span className="security-label">Node Integration</span>
                  <span className={`security-status ${!securityData.nodeIntegration ? 'enabled' : 'disabled'}`}>
                    {!securityData.nodeIntegration ? '✓ Disabled' : '✗ Enabled'}
                  </span>
                </div>
                <div className="security-item">
                  <span className="security-label">Input Validation</span>
                  <span className={`security-status ${securityData.validationEnabled ? 'enabled' : 'disabled'}`}>
                    {securityData.validationEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="security-headers">
                <h4>Active Security Headers</h4>
                <div className="header-list">
                  {securityData.securityHeaders.map(header => (
                    <span key={header} className="security-header-badge">
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <p className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
          <p className="performance-note">
            Performance data is collected every 5 seconds. High memory usage may indicate memory leaks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;