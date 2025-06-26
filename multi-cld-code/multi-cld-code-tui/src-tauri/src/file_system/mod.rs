/// File System Monitoring Module for CCTM Phase 2B
/// 
/// Provides intelligent file system monitoring and project detection capabilities
/// Integrates with the VirtualTerminalPool to provide context-aware terminals

pub mod watcher;
pub mod events;
// Temporarily disabled due to compilation issues
// pub mod project_detector;

// Re-export main interfaces
pub use watcher::{FileSystemWatcher, FileWatcherConfig};
pub use events::{FileEvent, ChangeType, WatchedPath};

use crate::virtualization::resource_monitor::ResourceMonitor;
use std::sync::Arc;
use anyhow::Result;

/// File System Engine - Coordinates file watching and project intelligence
#[derive(Debug)]
pub struct FileSystemEngine {
    /// Core file watching infrastructure
    watcher: FileSystemWatcher,
    
    /// Resource monitoring for overhead tracking
    resource_monitor: Arc<ResourceMonitor>,
}

impl FileSystemEngine {
    /// Create a new FileSystemEngine with specified configuration
    pub async fn new(
        config: FileWatcherConfig,
        resource_monitor: Arc<ResourceMonitor>,
    ) -> Result<Self> {
        let watcher = FileSystemWatcher::new(config, resource_monitor.clone()).await?;
        
        Ok(FileSystemEngine {
            watcher,
            resource_monitor,
        })
    }
    
    /// Start watching a directory for file changes
    pub async fn watch_directory(&self, path: std::path::PathBuf) -> Result<()> {
        self.watcher.add_watch(path).await
    }
    
    /// Stop watching a directory
    pub async fn unwatch_directory(&self, path: &std::path::Path) -> Result<()> {
        self.watcher.remove_watch(path).await
    }
    
    /// Get current file watching statistics
    pub async fn get_stats(&self) -> FileSystemStats {
        self.watcher.get_stats().await
    }
    
    /// Subscribe to file change events
    pub fn subscribe_to_events(&self) -> tokio::sync::broadcast::Receiver<FileEvent> {
        self.watcher.subscribe()
    }
}

/// Statistics for file system monitoring
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileSystemStats {
    pub active_watchers: usize,
    pub total_events: u64,
    pub events_per_second: f64,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::virtualization::resource_monitor::{ResourceMonitor, ResourceThresholds};
    
    #[tokio::test]
    async fn test_file_system_engine_creation() {
        let monitor = ResourceMonitor::new(ResourceThresholds::default()).unwrap();
        let config = FileWatcherConfig::default();
        
        let engine = FileSystemEngine::new(config, Arc::new(monitor)).await;
        assert!(engine.is_ok());
    }
}