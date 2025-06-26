use std::collections::{HashMap, VecDeque};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use super::instance::{VirtualTerminalInstance, TerminalInstance};
use super::resource_monitor::{ResourceMonitor, ResourceThresholds};
use super::load_balancer::{LoadBalancer, LoadBalancingStrategy};

/// Configuration for the virtual terminal pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolConfig {
    /// Maximum number of concurrent virtual terminals
    pub max_terminals: usize,
    
    /// Maximum memory usage in MB for the entire pool
    pub max_memory_mb: usize,
    
    /// How long idle terminals stay in pool before cleanup (seconds)
    pub idle_timeout_secs: u64,
    
    /// Number of terminals to pre-allocate in idle pool
    pub prealloc_pool_size: usize,
    
    /// Resource monitoring thresholds
    pub resource_thresholds: ResourceThresholds,
    
    /// Load balancing strategy
    pub load_balancing: LoadBalancingStrategy,
}

impl Default for PoolConfig {
    fn default() -> Self {
        PoolConfig {
            max_terminals: 50,
            max_memory_mb: 200,
            idle_timeout_secs: 300, // 5 minutes
            prealloc_pool_size: 5,
            resource_thresholds: ResourceThresholds::default(),
            load_balancing: LoadBalancingStrategy::ResourceBased,
        }
    }
}

/// Current status of the virtual terminal pool
#[derive(Debug, Clone, Serialize)]
pub struct PoolStatus {
    pub active_terminals: usize,
    pub idle_terminals: usize,
    pub total_memory_mb: f64,
    pub cpu_usage_percent: f64,
    pub pool_efficiency: f64, // 0.0 to 1.0
    pub last_updated: DateTime<Utc>,
}

/// Virtual Terminal Pool - Core virtualization engine
#[derive(Debug)]
pub struct VirtualTerminalPool {
    /// Configuration
    config: PoolConfig,
    
    /// Active terminals mapped by session_id
    active_terminals: Arc<RwLock<HashMap<String, VirtualTerminalInstance>>>,
    
    /// Pool of idle terminals ready for immediate reuse
    idle_pool: Arc<Mutex<VecDeque<TerminalInstance>>>,
    
    /// Resource monitor for tracking usage and enforcing limits
    resource_monitor: Arc<ResourceMonitor>,
    
    /// Load balancer for optimal terminal assignment
    load_balancer: LoadBalancer,
    
    /// Pool statistics and metrics
    stats: Arc<RwLock<PoolStats>>,
}

#[derive(Debug, Default)]
struct PoolStats {
    terminals_created: u64,
    terminals_reused: u64,
    terminals_destroyed: u64,
    peak_memory_mb: f64,
    peak_active_count: usize,
    avg_creation_time_ms: f64,
    avg_reuse_time_ms: f64,
}

impl VirtualTerminalPool {
    pub fn new(
        config: PoolConfig,
        resource_monitor: Arc<ResourceMonitor>,
        load_balancer: LoadBalancer,
    ) -> Result<Self> {
        let pool = VirtualTerminalPool {
            config,
            active_terminals: Arc::new(RwLock::new(HashMap::new())),
            idle_pool: Arc::new(Mutex::new(VecDeque::new())),
            resource_monitor,
            load_balancer,
            stats: Arc::new(RwLock::new(PoolStats::default())),
        };

        // Start background tasks for pool management
        pool.start_background_tasks()?;

        Ok(pool)
    }

    /// Create a new virtual terminal or attach to existing one
    pub async fn create_or_attach_terminal(
        &self,
        working_dir: PathBuf,
        title: Option<String>,
    ) -> Result<String> {
        let start_time = std::time::Instant::now();
        
        // Check resource limits before creating
        if !self.resource_monitor.can_create_terminal().await {
            return Err(Error::msg("Resource limits reached - cannot create new terminal"));
        }

        // Check if we're at max terminals
        let active_count = {
            let active = self.active_terminals.read().await;
            active.len()
        };

        if active_count >= self.config.max_terminals {
            return Err(Error::msg(format!(
                "Maximum terminals reached ({}/{})", 
                active_count, 
                self.config.max_terminals
            )));
        }

        // Try to reuse an idle terminal first
        let terminal_instance = if let Some(idle_terminal) = self.pop_idle_terminal().await {
            log::info!("Reusing idle terminal for {}", working_dir.display());
            
            // Update stats
            {
                let mut stats = self.stats.write().await;
                stats.terminals_reused += 1;
                stats.avg_reuse_time_ms = 
                    (stats.avg_reuse_time_ms + start_time.elapsed().as_millis() as f64) / 2.0;
            }

            idle_terminal
        } else {
            log::info!("Creating new terminal for {}", working_dir.display());
            
            // Create new terminal instance
            let terminal_instance = TerminalInstance::new(working_dir.clone(), title.clone()).await?;
            
            // Update stats
            {
                let mut stats = self.stats.write().await;
                stats.terminals_created += 1;
                stats.avg_creation_time_ms = 
                    (stats.avg_creation_time_ms + start_time.elapsed().as_millis() as f64) / 2.0;
            }

            terminal_instance
        };

        // Create virtual terminal wrapper
        let session_id = Uuid::new_v4().to_string();
        let virtual_terminal = VirtualTerminalInstance::new(
            session_id.clone(),
            working_dir,
            title,
            terminal_instance,
        ).await?;

        // Add to active terminals
        {
            let mut active = self.active_terminals.write().await;
            active.insert(session_id.clone(), virtual_terminal);
            
            // Update peak count stat
            let mut stats = self.stats.write().await;
            stats.peak_active_count = stats.peak_active_count.max(active.len());
        }

        // Update resource tracking
        self.resource_monitor.on_terminal_created(&session_id).await?;

        log::info!(
            "Virtual terminal created: {} ({:.2}ms)", 
            session_id, 
            start_time.elapsed().as_millis()
        );

        Ok(session_id)
    }

    /// Detach a session and return terminal to idle pool
    pub async fn detach_session(&self, session_id: &str) -> Result<()> {
        let virtual_terminal = {
            let mut active = self.active_terminals.write().await;
            active.remove(session_id)
        };

        if let Some(mut vt) = virtual_terminal {
            // Detach the terminal instance
            let terminal_instance = vt.detach().await?;
            
            // Return to idle pool if it's still healthy
            if terminal_instance.is_healthy().await {
                self.push_idle_terminal(terminal_instance).await;
                log::info!("Terminal {} returned to idle pool", session_id);
            } else {
                log::info!("Terminal {} destroyed (unhealthy)", session_id);
                let mut stats = self.stats.write().await;
                stats.terminals_destroyed += 1;
            }

            // Update resource tracking
            self.resource_monitor.on_terminal_removed(session_id).await?;
        }

        Ok(())
    }

    /// Get current pool status
    pub async fn get_status(&self) -> PoolStatus {
        let active_count = {
            let active = self.active_terminals.read().await;
            active.len()
        };

        let idle_count = {
            let idle = self.idle_pool.lock().await;
            idle.len()
        };

        let resource_usage = self.resource_monitor.get_current_usage().await;
        let stats = self.stats.read().await;

        PoolStatus {
            active_terminals: active_count,
            idle_terminals: idle_count,
            total_memory_mb: resource_usage.memory_mb,
            cpu_usage_percent: resource_usage.cpu_percent,
            pool_efficiency: self.calculate_efficiency(&stats, active_count, idle_count),
            last_updated: Utc::now(),
        }
    }

    /// Get a virtual terminal by session ID
    pub async fn get_terminal(&self, session_id: &str) -> Option<VirtualTerminalInstance> {
        let active = self.active_terminals.read().await;
        active.get(session_id).cloned()
    }

    /// Get all active virtual terminals
    pub async fn get_all_terminals(&self) -> Vec<VirtualTerminalInstance> {
        let active = self.active_terminals.read().await;
        active.values().cloned().collect()
    }

    /// Optimize pool by cleaning up idle terminals and rebalancing
    pub async fn optimize_pool(&self) -> Result<()> {
        log::info!("Optimizing virtual terminal pool");

        // Clean up idle terminals that have exceeded timeout
        let timeout_duration = std::time::Duration::from_secs(self.config.idle_timeout_secs);
        let mut idle_pool = self.idle_pool.lock().await;
        
        let mut removed_count = 0;
        idle_pool.retain(|terminal| {
            let keep = terminal.idle_time() < timeout_duration;
            if !keep {
                removed_count += 1;
            }
            keep
        });

        if removed_count > 0 {
            log::info!("Cleaned up {} idle terminals", removed_count);
            let mut stats = self.stats.write().await;
            stats.terminals_destroyed += removed_count as u64;
        }

        // Ensure we have minimum idle terminals for responsiveness
        let current_idle = idle_pool.len();
        if current_idle < self.config.prealloc_pool_size {
            let needed = self.config.prealloc_pool_size - current_idle;
            log::info!("Pre-allocating {} idle terminals", needed);
            
            drop(idle_pool); // Release lock before creating terminals
            
            for _ in 0..needed {
                if let Ok(terminal) = TerminalInstance::new_idle().await {
                    self.push_idle_terminal(terminal).await;
                }
            }
        }

        Ok(())
    }

    // Private helper methods

    async fn pop_idle_terminal(&self) -> Option<TerminalInstance> {
        let mut idle_pool = self.idle_pool.lock().await;
        idle_pool.pop_front()
    }

    async fn push_idle_terminal(&self, terminal: TerminalInstance) {
        let mut idle_pool = self.idle_pool.lock().await;
        idle_pool.push_back(terminal);
    }

    fn calculate_efficiency(&self, stats: &PoolStats, active: usize, idle: usize) -> f64 {
        if stats.terminals_created == 0 {
            return 1.0;
        }

        let reuse_ratio = stats.terminals_reused as f64 / stats.terminals_created as f64;
        let utilization = active as f64 / (active + idle) as f64;
        
        // Efficiency is combination of reuse ratio and utilization
        (reuse_ratio * 0.7 + utilization * 0.3).clamp(0.0, 1.0)
    }

    fn start_background_tasks(&self) -> Result<()> {
        // Start pool optimization task
        let pool_weak = Arc::downgrade(&Arc::new(self.clone()));
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                if let Some(pool) = pool_weak.upgrade() {
                    if let Err(e) = pool.optimize_pool().await {
                        log::error!("Pool optimization failed: {}", e);
                    }
                } else {
                    // Pool has been dropped, exit task
                    break;
                }
            }
        });

        Ok(())
    }
}

// Clone implementation for Arc usage
impl Clone for VirtualTerminalPool {
    fn clone(&self) -> Self {
        VirtualTerminalPool {
            config: self.config.clone(),
            active_terminals: self.active_terminals.clone(),
            idle_pool: self.idle_pool.clone(),
            resource_monitor: self.resource_monitor.clone(),
            load_balancer: self.load_balancer.clone(),
            stats: self.stats.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::virtualization::resource_monitor::ResourceMonitor;
    use crate::virtualization::load_balancer::LoadBalancer;

    #[tokio::test]
    async fn test_pool_creation() {
        let config = PoolConfig::default();
        let monitor = ResourceMonitor::new(config.resource_thresholds.clone()).unwrap();
        let balancer = LoadBalancer::new(LoadBalancingStrategy::ResourceBased).unwrap();
        
        let pool = VirtualTerminalPool::new(config, monitor, balancer).unwrap();
        let status = pool.get_status().await;
        
        assert_eq!(status.active_terminals, 0);
        assert_eq!(status.idle_terminals, 0);
    }

    #[tokio::test]
    async fn test_terminal_creation_and_cleanup() {
        let config = PoolConfig::default();
        let monitor = ResourceMonitor::new(config.resource_thresholds.clone()).unwrap();
        let balancer = LoadBalancer::new(LoadBalancingStrategy::ResourceBased).unwrap();
        
        let pool = VirtualTerminalPool::new(config, monitor, balancer).unwrap();
        
        // Create a terminal
        let session_id = pool.create_or_attach_terminal(
            PathBuf::from("/tmp"), 
            Some("Test Terminal".to_string())
        ).await.unwrap();
        
        let status = pool.get_status().await;
        assert_eq!(status.active_terminals, 1);
        
        // Detach the terminal
        pool.detach_session(&session_id).await.unwrap();
        
        let status = pool.get_status().await;
        assert_eq!(status.active_terminals, 0);
        // Should have 1 idle terminal now
        assert_eq!(status.idle_terminals, 1);
    }
}