// CCTM Phase 2: Terminal Virtualization Engine
// Enables 50+ concurrent Claude Code instances with intelligent resource management

pub mod pool;
pub mod instance;
pub mod resource_monitor;
pub mod load_balancer;

pub use pool::{VirtualTerminalPool, PoolConfig, PoolStatus};
pub use instance::{VirtualTerminal, VirtualTerminalInstance, TerminalInstance};
pub use resource_monitor::{ResourceMonitor, ResourceUsage, ResourceThresholds};
pub use load_balancer::{LoadBalancer, LoadBalancingStrategy};

use crate::file_system::{FileSystemEngine, FileWatcherConfig};
use std::sync::Arc;

// Re-export commonly used types
pub use pool::VirtualTerminalPool as Pool;
pub use instance::VirtualTerminalInstance as VTerminal;

/// High-level virtualization manager that integrates all components
/// Phase 2B: Now includes intelligent file system monitoring
#[derive(Debug)]
pub struct VirtualizationEngine {
    pub pool: VirtualTerminalPool,
    pub monitor: Arc<ResourceMonitor>,
    pub balancer: LoadBalancer,
    pub file_system: FileSystemEngine,
}

impl VirtualizationEngine {
    pub async fn new(config: PoolConfig) -> anyhow::Result<Self> {
        let monitor = Arc::new(ResourceMonitor::new(config.resource_thresholds.clone())?);
        let balancer = LoadBalancer::new(LoadBalancingStrategy::ResourceBased)?;
        let pool = VirtualTerminalPool::new(config, monitor.clone(), balancer.clone())?;
        
        // Initialize file system monitoring
        let fs_config = FileWatcherConfig::default();
        let file_system = FileSystemEngine::new(fs_config, monitor.clone()).await?;

        Ok(VirtualizationEngine {
            pool,
            monitor,
            balancer,
            file_system,
        })
    }

    pub async fn create_terminal(&self, working_dir: std::path::PathBuf, title: Option<String>) -> anyhow::Result<String> {
        // Create the virtual terminal
        let session_id = self.pool.create_or_attach_terminal(working_dir.clone(), title).await?;
        
        // Start watching the working directory for file changes
        if let Err(e) = self.file_system.watch_directory(working_dir.clone()).await {
            log::warn!("Failed to start file watching for {}: {}", working_dir.display(), e);
            // Don't fail terminal creation if file watching fails
        } else {
            log::info!("Started file watching for terminal {} in {}", session_id, working_dir.display());
        }
        
        Ok(session_id)
    }

    pub async fn get_pool_status(&self) -> PoolStatus {
        self.pool.get_status().await
    }

    pub async fn get_resource_usage(&self) -> ResourceUsage {
        self.monitor.get_current_usage().await
    }
    
    /// Get file system monitoring statistics
    pub async fn get_file_system_stats(&self) -> crate::file_system::FileSystemStats {
        self.file_system.get_stats().await
    }
    
    /// Subscribe to file change events
    pub fn subscribe_to_file_events(&self) -> tokio::sync::broadcast::Receiver<crate::file_system::FileEvent> {
        self.file_system.subscribe_to_events()
    }
    
    /// Manually watch a directory (for advanced use cases)
    pub async fn watch_directory(&self, path: std::path::PathBuf) -> anyhow::Result<()> {
        self.file_system.watch_directory(path).await
    }
    
    /// Stop watching a directory
    pub async fn unwatch_directory(&self, path: &std::path::Path) -> anyhow::Result<()> {
        self.file_system.unwatch_directory(path).await
    }
}