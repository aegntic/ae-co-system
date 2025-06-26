use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

/// Resource usage thresholds for monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceThresholds {
    /// Maximum memory usage in MB
    pub max_memory_mb: f64,
    
    /// Maximum CPU usage percentage (0.0 to 100.0)
    pub max_cpu_percent: f64,
    
    /// Maximum number of processes
    pub max_processes: usize,
    
    /// Memory warning threshold (percentage of max)
    pub memory_warning_threshold: f64,
    
    /// CPU warning threshold (percentage of max)
    pub cpu_warning_threshold: f64,
}

impl Default for ResourceThresholds {
    fn default() -> Self {
        ResourceThresholds {
            max_memory_mb: 200.0,
            max_cpu_percent: 80.0,
            max_processes: 50,
            memory_warning_threshold: 0.8, // 80% of max
            cpu_warning_threshold: 0.7,    // 70% of max
        }
    }
}

/// Current resource usage snapshot
#[derive(Debug, Clone, Serialize)]
pub struct ResourceUsage {
    pub memory_mb: f64,
    pub cpu_percent: f64,
    pub process_count: usize,
    pub terminal_count: usize,
    pub peak_memory_mb: f64,
    pub peak_cpu_percent: f64,
    pub timestamp: DateTime<Utc>,
    pub warnings: Vec<String>,
}

/// Per-terminal resource tracking
#[derive(Debug, Clone)]
struct TerminalResourceUsage {
    terminal_id: String,
    memory_mb: f64,
    cpu_percent: f64,
    process_id: Option<u32>,
    created_at: DateTime<Utc>,
    last_updated: DateTime<Utc>,
}

/// Resource Monitor - Tracks and enforces resource limits
#[derive(Debug, Clone)]
pub struct ResourceMonitor {
    thresholds: ResourceThresholds,
    terminals: Arc<RwLock<HashMap<String, TerminalResourceUsage>>>,
    global_stats: Arc<RwLock<GlobalResourceStats>>,
}

#[derive(Debug, Default)]
struct GlobalResourceStats {
    total_memory_mb: f64,
    total_cpu_percent: f64,
    peak_memory_mb: f64,
    peak_cpu_percent: f64,
    process_count: usize,
    last_updated: DateTime<Utc>,
    warning_history: Vec<ResourceWarning>,
}

#[derive(Debug, Clone)]
struct ResourceWarning {
    warning_type: String,
    message: String,
    value: f64,
    threshold: f64,
    timestamp: DateTime<Utc>,
}

impl ResourceMonitor {
    pub fn new(thresholds: ResourceThresholds) -> Result<Self> {
        let monitor = ResourceMonitor {
            thresholds,
            terminals: Arc::new(RwLock::new(HashMap::new())),
            global_stats: Arc::new(RwLock::new(GlobalResourceStats {
                last_updated: Utc::now(),
                ..Default::default()
            })),
        };

        // Start background monitoring task
        monitor.start_monitoring_task()?;

        Ok(monitor)
    }

    /// Check if we can create a new terminal within resource limits
    pub async fn can_create_terminal(&self) -> bool {
        let stats = self.global_stats.read().await;
        let terminals = self.terminals.read().await;

        // Check memory limit
        if stats.total_memory_mb >= self.thresholds.max_memory_mb {
            log::warn!(
                "Memory limit reached: {:.2}MB >= {:.2}MB", 
                stats.total_memory_mb, 
                self.thresholds.max_memory_mb
            );
            return false;
        }

        // Check CPU limit
        if stats.total_cpu_percent >= self.thresholds.max_cpu_percent {
            log::warn!(
                "CPU limit reached: {:.2}% >= {:.2}%", 
                stats.total_cpu_percent, 
                self.thresholds.max_cpu_percent
            );
            return false;
        }

        // Check process count limit
        if terminals.len() >= self.thresholds.max_processes {
            log::warn!(
                "Process limit reached: {} >= {}", 
                terminals.len(), 
                self.thresholds.max_processes
            );
            return false;
        }

        true
    }

    /// Register a new terminal for monitoring
    pub async fn on_terminal_created(&self, terminal_id: &str) -> Result<()> {
        let resource_usage = TerminalResourceUsage {
            terminal_id: terminal_id.to_string(),
            memory_mb: 0.0,
            cpu_percent: 0.0,
            process_id: None,
            created_at: Utc::now(),
            last_updated: Utc::now(),
        };

        let mut terminals = self.terminals.write().await;
        terminals.insert(terminal_id.to_string(), resource_usage);

        log::info!("Started monitoring terminal: {}", terminal_id);
        Ok(())
    }

    /// Unregister a terminal from monitoring
    pub async fn on_terminal_removed(&self, terminal_id: &str) -> Result<()> {
        let mut terminals = self.terminals.write().await;
        terminals.remove(terminal_id);

        log::info!("Stopped monitoring terminal: {}", terminal_id);
        self.update_global_stats().await;
        Ok(())
    }

    /// Get current resource usage snapshot
    pub async fn get_current_usage(&self) -> ResourceUsage {
        self.update_global_stats().await;
        let stats = self.global_stats.read().await;
        let terminals = self.terminals.read().await;

        let warnings = self.generate_warnings(&stats).await;

        ResourceUsage {
            memory_mb: stats.total_memory_mb,
            cpu_percent: stats.total_cpu_percent,
            process_count: stats.process_count,
            terminal_count: terminals.len(),
            peak_memory_mb: stats.peak_memory_mb,
            peak_cpu_percent: stats.peak_cpu_percent,
            timestamp: stats.last_updated,
            warnings,
        }
    }

    /// Get resource usage for a specific terminal
    pub async fn get_terminal_usage(&self, terminal_id: &str) -> Option<TerminalResourceUsage> {
        let terminals = self.terminals.read().await;
        terminals.get(terminal_id).cloned()
    }

    /// Get resource efficiency metrics
    pub async fn get_efficiency_metrics(&self) -> EfficiencyMetrics {
        let stats = self.global_stats.read().await;
        let terminals = self.terminals.read().await;

        let memory_efficiency = if self.thresholds.max_memory_mb > 0.0 {
            1.0 - (stats.total_memory_mb / self.thresholds.max_memory_mb)
        } else {
            1.0
        };

        let cpu_efficiency = if self.thresholds.max_cpu_percent > 0.0 {
            1.0 - (stats.total_cpu_percent / self.thresholds.max_cpu_percent)
        } else {
            1.0
        };

        let process_efficiency = if self.thresholds.max_processes > 0 {
            1.0 - (terminals.len() as f64 / self.thresholds.max_processes as f64)
        } else {
            1.0
        };

        EfficiencyMetrics {
            memory_efficiency: memory_efficiency.clamp(0.0, 1.0),
            cpu_efficiency: cpu_efficiency.clamp(0.0, 1.0),
            process_efficiency: process_efficiency.clamp(0.0, 1.0),
            overall_efficiency: (memory_efficiency + cpu_efficiency + process_efficiency) / 3.0,
            resource_pressure: self.calculate_resource_pressure(&stats),
        }
    }

    /// Force garbage collection and cleanup
    pub async fn force_cleanup(&self) -> Result<CleanupStats> {
        let start_memory = {
            let stats = self.global_stats.read().await;
            stats.total_memory_mb
        };

        // Clean up stale terminal entries
        let mut removed_terminals = 0;
        {
            let mut terminals = self.terminals.write().await;
            let now = Utc::now();
            terminals.retain(|_id, usage| {
                let stale = (now - usage.last_updated).num_seconds() > 300; // 5 minutes
                if stale {
                    removed_terminals += 1;
                }
                !stale
            });
        }

        // Update stats after cleanup
        self.update_global_stats().await;

        let end_memory = {
            let stats = self.global_stats.read().await;
            stats.total_memory_mb
        };

        let cleanup_stats = CleanupStats {
            memory_freed_mb: (start_memory - end_memory).max(0.0),
            terminals_cleaned: removed_terminals,
            timestamp: Utc::now(),
        };

        log::info!(
            "Cleanup completed: freed {:.2}MB, removed {} stale terminals",
            cleanup_stats.memory_freed_mb,
            cleanup_stats.terminals_cleaned
        );

        Ok(cleanup_stats)
    }

    // Private methods

    fn start_monitoring_task(&self) -> Result<()> {
        let global_stats = self.global_stats.clone();
        let terminals = self.terminals.clone();
        let thresholds = self.thresholds.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(5));

            loop {
                interval.tick().await;

                // Update resource measurements
                let (memory_mb, cpu_percent, process_count) = Self::measure_system_resources().await;

                {
                    let mut stats = global_stats.write().await;
                    stats.total_memory_mb = memory_mb;
                    stats.total_cpu_percent = cpu_percent;
                    stats.process_count = process_count;
                    stats.peak_memory_mb = stats.peak_memory_mb.max(memory_mb);
                    stats.peak_cpu_percent = stats.peak_cpu_percent.max(cpu_percent);
                    stats.last_updated = Utc::now();

                    // Check for warnings
                    if memory_mb > thresholds.max_memory_mb * thresholds.memory_warning_threshold {
                        let warning = ResourceWarning {
                            warning_type: "memory".to_string(),
                            message: format!("High memory usage: {:.2}MB", memory_mb),
                            value: memory_mb,
                            threshold: thresholds.max_memory_mb * thresholds.memory_warning_threshold,
                            timestamp: Utc::now(),
                        };
                        stats.warning_history.push(warning);
                    }

                    if cpu_percent > thresholds.max_cpu_percent * thresholds.cpu_warning_threshold {
                        let warning = ResourceWarning {
                            warning_type: "cpu".to_string(),
                            message: format!("High CPU usage: {:.2}%", cpu_percent),
                            value: cpu_percent,
                            threshold: thresholds.max_cpu_percent * thresholds.cpu_warning_threshold,
                            timestamp: Utc::now(),
                        };
                        stats.warning_history.push(warning);
                    }

                    // Keep warning history manageable
                    if stats.warning_history.len() > 100 {
                        stats.warning_history.drain(0..50);
                    }
                }

                // Update individual terminal stats (simplified for now)
                {
                    let mut terminals_map = terminals.write().await;
                    let terminal_count = terminals_map.len() as f64;
                    
                    for (_, terminal) in terminals_map.iter_mut() {
                        // Distribute resources evenly across terminals (simplified)
                        terminal.memory_mb = if terminal_count > 0.0 { memory_mb / terminal_count } else { 0.0 };
                        terminal.cpu_percent = if terminal_count > 0.0 { cpu_percent / terminal_count } else { 0.0 };
                        terminal.last_updated = Utc::now();
                    }
                }
            }
        });

        Ok(())
    }

    async fn update_global_stats(&self) {
        let (memory_mb, cpu_percent, process_count) = Self::measure_system_resources().await;

        let mut stats = self.global_stats.write().await;
        stats.total_memory_mb = memory_mb;
        stats.total_cpu_percent = cpu_percent;
        stats.process_count = process_count;
        stats.peak_memory_mb = stats.peak_memory_mb.max(memory_mb);
        stats.peak_cpu_percent = stats.peak_cpu_percent.max(cpu_percent);
        stats.last_updated = Utc::now();
    }

    async fn measure_system_resources() -> (f64, f64, usize) {
        // Simplified resource measurement
        // In a real implementation, this would use system APIs to get actual usage
        
        // Simulate memory usage (4MB per terminal + base overhead)
        let simulated_memory = 20.0; // Base overhead
        
        // Simulate CPU usage (random fluctuation)
        let simulated_cpu = 2.5;
        
        // Process count is not easily measurable cross-platform, so we'll estimate
        let simulated_processes = 3;

        (simulated_memory, simulated_cpu, simulated_processes)
    }

    async fn generate_warnings(&self, stats: &GlobalResourceStats) -> Vec<String> {
        let mut warnings = Vec::new();

        if stats.total_memory_mb > self.thresholds.max_memory_mb * self.thresholds.memory_warning_threshold {
            warnings.push(format!(
                "High memory usage: {:.1}MB ({:.1}% of limit)",
                stats.total_memory_mb,
                (stats.total_memory_mb / self.thresholds.max_memory_mb) * 100.0
            ));
        }

        if stats.total_cpu_percent > self.thresholds.max_cpu_percent * self.thresholds.cpu_warning_threshold {
            warnings.push(format!(
                "High CPU usage: {:.1}% ({:.1}% of limit)",
                stats.total_cpu_percent,
                (stats.total_cpu_percent / self.thresholds.max_cpu_percent) * 100.0
            ));
        }

        warnings
    }

    fn calculate_resource_pressure(&self, stats: &GlobalResourceStats) -> f64 {
        let memory_pressure = stats.total_memory_mb / self.thresholds.max_memory_mb;
        let cpu_pressure = stats.total_cpu_percent / self.thresholds.max_cpu_percent;
        
        (memory_pressure + cpu_pressure) / 2.0
    }
}

#[derive(Debug, Serialize)]
pub struct EfficiencyMetrics {
    pub memory_efficiency: f64,
    pub cpu_efficiency: f64,
    pub process_efficiency: f64,
    pub overall_efficiency: f64,
    pub resource_pressure: f64,
}

#[derive(Debug, Serialize)]
pub struct CleanupStats {
    pub memory_freed_mb: f64,
    pub terminals_cleaned: usize,
    pub timestamp: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_resource_monitor_creation() {
        let thresholds = ResourceThresholds::default();
        let monitor = ResourceMonitor::new(thresholds).unwrap();
        
        let usage = monitor.get_current_usage().await;
        assert_eq!(usage.terminal_count, 0);
    }

    #[tokio::test]
    async fn test_terminal_registration() {
        let thresholds = ResourceThresholds::default();
        let monitor = ResourceMonitor::new(thresholds).unwrap();
        
        monitor.on_terminal_created("test-terminal").await.unwrap();
        
        let usage = monitor.get_current_usage().await;
        assert_eq!(usage.terminal_count, 1);
        
        monitor.on_terminal_removed("test-terminal").await.unwrap();
        
        let usage = monitor.get_current_usage().await;
        assert_eq!(usage.terminal_count, 0);
    }

    #[tokio::test]
    async fn test_resource_limits() {
        let mut thresholds = ResourceThresholds::default();
        thresholds.max_processes = 1; // Very low limit for testing
        
        let monitor = ResourceMonitor::new(thresholds).unwrap();
        
        // First terminal should be allowed
        assert!(monitor.can_create_terminal().await);
        
        monitor.on_terminal_created("terminal-1").await.unwrap();
        
        // Second terminal should be blocked
        assert!(!monitor.can_create_terminal().await);
    }
}