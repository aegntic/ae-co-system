/// File System Watcher Implementation for CCTM Phase 2B
/// 
/// Provides cross-platform file watching with resource management and intelligent filtering

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{broadcast, RwLock, Mutex};
use notify::{Watcher, RecommendedWatcher, RecursiveMode, Event, EventKind};
use ignore::gitignore::{Gitignore, GitignoreBuilder};
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use super::events::{FileEvent, ChangeType, WatchedPath, ProjectContext, ProjectType};
use crate::virtualization::resource_monitor::ResourceMonitor;

/// Configuration for file system watching
#[derive(Debug, Clone)]
pub struct FileWatcherConfig {
    /// Maximum number of paths to watch simultaneously
    pub max_watched_paths: usize,
    
    /// Debounce duration for rapid file changes (milliseconds)
    pub debounce_ms: u64,
    
    /// Maximum events per second before throttling
    pub max_events_per_second: f64,
    
    /// Maximum memory usage for file watching (MB)
    pub max_memory_mb: f64,
    
    /// Whether to automatically detect and use .gitignore files
    pub respect_gitignore: bool,
    
    /// File extensions to always include (even if ignored)
    pub always_include_extensions: Vec<String>,
    
    /// File extensions to always exclude
    pub always_exclude_extensions: Vec<String>,
    
    /// Maximum depth for recursive watching
    pub max_watch_depth: usize,
}

impl Default for FileWatcherConfig {
    fn default() -> Self {
        FileWatcherConfig {
            max_watched_paths: 10,
            debounce_ms: 500,
            max_events_per_second: 50.0,
            max_memory_mb: 20.0, // 20MB limit for file watching
            respect_gitignore: true,
            always_include_extensions: vec![
                "rs".to_string(), "toml".to_string(), "md".to_string(),
                "ts".to_string(), "js".to_string(), "json".to_string(),
                "py".to_string(), "go".to_string(), "c".to_string(),
                "cpp".to_string(), "h".to_string(), "hpp".to_string(),
            ],
            always_exclude_extensions: vec![
                "log".to_string(), "tmp".to_string(), "cache".to_string(),
                "lock".to_string(), "swp".to_string(), "bak".to_string(),
            ],
            max_watch_depth: 5,
        }
    }
}

/// Statistics for file watching performance
#[derive(Debug, Clone, serde::Serialize)]
pub struct WatcherStats {
    pub active_watchers: usize,
    pub total_events_processed: u64,
    pub events_per_second: f64,
    pub memory_usage_mb: f64,
    pub cpu_overhead_percent: f64,
    pub last_updated: DateTime<Utc>,
    pub throttling_active: bool,
}

/// Main file system watcher with resource management
#[derive(Debug)]
pub struct FileSystemWatcher {
    /// Configuration
    config: FileWatcherConfig,
    
    /// Active file watchers by path
    watchers: Arc<RwLock<HashMap<PathBuf, RecommendedWatcher>>>,
    
    /// Watched paths with metadata
    watched_paths: Arc<RwLock<HashMap<PathBuf, WatchedPath>>>,
    
    /// Gitignore patterns by directory
    gitignore_cache: Arc<RwLock<HashMap<PathBuf, Gitignore>>>,
    
    /// Event broadcaster
    event_sender: broadcast::Sender<FileEvent>,
    
    /// Resource monitor for overhead tracking
    resource_monitor: Arc<ResourceMonitor>,
    
    /// Statistics
    stats: Arc<RwLock<WatcherStats>>,
    
    /// Event processing task handle
    _processing_handle: tokio::task::JoinHandle<()>,
}

impl FileSystemWatcher {
    /// Create a new FileSystemWatcher
    pub async fn new(
        config: FileWatcherConfig,
        resource_monitor: Arc<ResourceMonitor>,
    ) -> Result<Self> {
        let (event_sender, _) = broadcast::channel(1000);
        let watchers = Arc::new(RwLock::new(HashMap::new()));
        let watched_paths = Arc::new(RwLock::new(HashMap::new()));
        let gitignore_cache = Arc::new(RwLock::new(HashMap::new()));
        
        let stats = Arc::new(RwLock::new(WatcherStats {
            active_watchers: 0,
            total_events_processed: 0,
            events_per_second: 0.0,
            memory_usage_mb: 0.0,
            cpu_overhead_percent: 0.0,
            last_updated: Utc::now(),
            throttling_active: false,
        }));
        
        // Start background processing task
        let processing_handle = Self::start_processing_task(
            event_sender.clone(),
            stats.clone(),
            config.clone(),
        );
        
        let watcher = FileSystemWatcher {
            config,
            watchers,
            watched_paths,
            gitignore_cache,
            event_sender,
            resource_monitor,
            stats,
            _processing_handle: processing_handle,
        };
        
        log::info!("FileSystemWatcher initialized with config: {:?}", watcher.config);
        
        Ok(watcher)
    }
    
    /// Add a directory to watch
    pub async fn add_watch(&self, path: PathBuf) -> Result<()> {
        // Check resource limits
        if !self.can_add_watcher().await {
            return Err(Error::msg("Cannot add watcher: resource limits exceeded"));
        }
        
        log::info!("Adding file system watch for: {}", path.display());
        
        // Normalize path
        let canonical_path = path.canonicalize()
            .unwrap_or_else(|_| path.clone());
        
        // Check if already watching
        {
            let watchers = self.watchers.read().await;
            if watchers.contains_key(&canonical_path) {
                log::debug!("Path already being watched: {}", canonical_path.display());
                return Ok(());
            }
        }
        
        // Load or create gitignore for this directory
        if self.config.respect_gitignore {
            self.load_gitignore(&canonical_path).await?;
        }
        
        // Create file watcher
        let watcher = self.create_watcher_for_path(&canonical_path).await?;
        
        // Create watched path metadata
        let mut watched_path = WatchedPath::new(canonical_path.clone());
        
        // Detect project context
        if let Some(project_context) = self.detect_project_context(&canonical_path).await {
            watched_path.set_project_context(project_context);
        }
        
        // Store watcher and metadata
        {
            let mut watchers = self.watchers.write().await;
            let mut paths = self.watched_paths.write().await;
            
            watchers.insert(canonical_path.clone(), watcher);
            paths.insert(canonical_path.clone(), watched_path);
        }
        
        // Update resource tracking
        self.resource_monitor.on_terminal_created(&format!("fs_watcher_{}", canonical_path.display())).await?;
        
        // Update stats
        self.update_stats().await;
        
        log::info!("Successfully watching: {}", canonical_path.display());
        Ok(())
    }
    
    /// Remove a directory from watching
    pub async fn remove_watch(&self, path: &Path) -> Result<()> {
        let canonical_path = path.canonicalize()
            .unwrap_or_else(|_| path.to_path_buf());
        
        log::info!("Removing file system watch for: {}", canonical_path.display());
        
        // Remove watcher and metadata
        {
            let mut watchers = self.watchers.write().await;
            let mut paths = self.watched_paths.write().await;
            let mut gitignore = self.gitignore_cache.write().await;
            
            if watchers.remove(&canonical_path).is_some() {
                paths.remove(&canonical_path);
                gitignore.remove(&canonical_path);
                
                // Update resource tracking
                self.resource_monitor.on_terminal_removed(&format!("fs_watcher_{}", canonical_path.display())).await?;
                
                log::info!("Successfully removed watch for: {}", canonical_path.display());
            } else {
                log::debug!("Path was not being watched: {}", canonical_path.display());
            }
        }
        
        // Update stats
        self.update_stats().await;
        
        Ok(())
    }
    
    /// Subscribe to file change events
    pub fn subscribe(&self) -> broadcast::Receiver<FileEvent> {
        self.event_sender.subscribe()
    }
    
    /// Get current watching statistics
    pub async fn get_stats(&self) -> super::FileSystemStats {
        let stats = self.stats.read().await;
        let watchers = self.watchers.read().await;
        
        super::FileSystemStats {
            active_watchers: watchers.len(),
            total_events: stats.total_events_processed,
            events_per_second: stats.events_per_second,
            memory_usage_mb: stats.memory_usage_mb,
            cpu_usage_percent: stats.cpu_overhead_percent,
        }
    }
    
    // Private helper methods
    
    async fn can_add_watcher(&self) -> bool {
        let watchers = self.watchers.read().await;
        let stats = self.stats.read().await;
        
        // Check max watchers limit
        if watchers.len() >= self.config.max_watched_paths {
            log::warn!("Maximum watched paths limit reached: {}", self.config.max_watched_paths);
            return false;
        }
        
        // Check memory limit
        if stats.memory_usage_mb >= self.config.max_memory_mb {
            log::warn!("File watching memory limit reached: {:.2}MB", stats.memory_usage_mb);
            return false;
        }
        
        // Check resource monitor limits
        if !self.resource_monitor.can_create_terminal().await {
            log::warn!("Resource monitor limits prevent adding new watcher");
            return false;
        }
        
        true
    }
    
    async fn create_watcher_for_path(&self, path: &PathBuf) -> Result<RecommendedWatcher> {
        let event_sender = self.event_sender.clone();
        let gitignore_cache = self.gitignore_cache.clone();
        let watched_paths = self.watched_paths.clone();
        let config = self.config.clone();
        let path_for_closure = path.clone();
        
        let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            let event_sender = event_sender.clone();
            let gitignore_cache = gitignore_cache.clone();
            let watched_paths = watched_paths.clone();
            let config = config.clone();
            let root_path = path_for_closure.clone();
            
            tokio::spawn(async move {
                match res {
                    Ok(event) => {
                        if let Err(e) = Self::process_notify_event(
                            event,
                            &event_sender,
                            &gitignore_cache,
                            &watched_paths,
                            &config,
                            &root_path,
                        ).await {
                            log::error!("Error processing file event: {}", e);
                        }
                    }
                    Err(e) => log::error!("File watcher error: {}", e),
                }
            });
        })?;
        
        // Start watching the path
        watcher.watch(path, RecursiveMode::Recursive)?;
        
        Ok(watcher)
    }
    
    async fn process_notify_event(
        event: Event,
        event_sender: &broadcast::Sender<FileEvent>,
        gitignore_cache: &Arc<RwLock<HashMap<PathBuf, Gitignore>>>,
        watched_paths: &Arc<RwLock<HashMap<PathBuf, WatchedPath>>>,
        config: &FileWatcherConfig,
        root_path: &PathBuf,
    ) -> Result<()> {
        for path in event.paths {
            // Check if path should be ignored
            if Self::should_ignore_path(&path, gitignore_cache, config).await {
                continue;
            }
            
            // Convert notify event to our FileEvent
            let change_type = Self::convert_event_kind(event.kind);
            let mut file_event = FileEvent::new(path.clone(), change_type);
            
            // Add file size if available
            if let Ok(metadata) = tokio::fs::metadata(&path).await {
                file_event = file_event.with_file_size(metadata.len());
            }
            
            // Add project context if available
            if let Some(project_context) = Self::get_project_context_for_path(&path, root_path).await {
                file_event = file_event.with_project_context(project_context);
            }
            
            // Update watched path statistics
            {
                let mut paths = watched_paths.write().await;
                if let Some(watched) = paths.get_mut(root_path) {
                    watched.record_event();
                }
            }
            
            // Send event
            if let Err(e) = event_sender.send(file_event) {
                log::debug!("No receivers for file event: {}", e);
            }
        }
        
        Ok(())
    }
    
    async fn should_ignore_path(
        path: &Path,
        gitignore_cache: &Arc<RwLock<HashMap<PathBuf, Gitignore>>>,
        config: &FileWatcherConfig,
    ) -> bool {
        // Always exclude certain extensions
        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if config.always_exclude_extensions.contains(&ext.to_string()) {
                return true;
            }
            
            // Always include certain extensions (override gitignore)
            if config.always_include_extensions.contains(&ext.to_string()) {
                return false;
            }
        }
        
        // Check gitignore if enabled
        if config.respect_gitignore {
            let gitignore = gitignore_cache.read().await;
            for (root, ignore) in gitignore.iter() {
                if path.starts_with(root) {
                    if let Some(relative) = path.strip_prefix(root).ok() {
                        let match_result = ignore.matched(relative, path.is_dir());
                        if match_result.is_ignore() {
                            return true;
                        }
                    }
                }
            }
        }
        
        false
    }
    
    fn convert_event_kind(kind: EventKind) -> ChangeType {
        match kind {
            EventKind::Create(_) => ChangeType::Created,
            EventKind::Modify(_) => ChangeType::Modified,
            EventKind::Remove(_) => ChangeType::Deleted,
            _ => ChangeType::Modified, // Default fallback
        }
    }
    
    async fn get_project_context_for_path(
        path: &Path,
        root_path: &Path,
    ) -> Option<ProjectContext> {
        // Find relative path
        let relative_path = path.strip_prefix(root_path).ok()?.to_path_buf();
        
        // Detect project type (simplified for now)
        let project_type = ProjectType::detect_from_file(path)
            .or_else(|| {
                // Try to detect from parent directories
                let mut current = path.parent()?;
                while current != root_path && current.parent().is_some() {
                    if let Some(pt) = ProjectType::detect_from_file(current) {
                        return Some(pt);
                    }
                    current = current.parent()?;
                }
                None
            });
        
        // TODO: Detect git branch (would require git2 integration)
        let git_branch = None;
        
        Some(ProjectContext {
            root_path: root_path.to_path_buf(),
            project_type,
            git_branch,
            relative_path,
        })
    }
    
    async fn load_gitignore(&self, path: &PathBuf) -> Result<()> {
        let gitignore_path = path.join(".gitignore");
        
        if gitignore_path.exists() {
            let mut builder = GitignoreBuilder::new(path);
            builder.add(&gitignore_path);
            
            if let Ok(gitignore) = builder.build() {
                let mut cache = self.gitignore_cache.write().await;
                cache.insert(path.clone(), gitignore);
                log::debug!("Loaded .gitignore for: {}", path.display());
            }
        }
        
        Ok(())
    }
    
    async fn detect_project_context(&self, path: &PathBuf) -> Option<ProjectContext> {
        // Look for project indicators
        let project_type = if path.join("Cargo.toml").exists() {
            Some(ProjectType::Rust)
        } else if path.join("package.json").exists() {
            if path.join("src-tauri").exists() {
                Some(ProjectType::Tauri)
            } else {
                Some(ProjectType::JavaScript)
            }
        } else if path.join("tsconfig.json").exists() {
            Some(ProjectType::TypeScript)
        } else if path.join("pyproject.toml").exists() || path.join("requirements.txt").exists() {
            Some(ProjectType::Python)
        } else if path.join("go.mod").exists() {
            Some(ProjectType::Go)
        } else {
            None
        };
        
        // TODO: Add git branch detection with git2
        let git_branch = None;
        
        Some(ProjectContext {
            root_path: path.clone(),
            project_type,
            git_branch,
            relative_path: PathBuf::from("."),
        })
    }
    
    async fn update_stats(&self) {
        let mut stats = self.stats.write().await;
        let watchers = self.watchers.read().await;
        
        stats.active_watchers = watchers.len();
        stats.last_updated = Utc::now();
        
        // TODO: Add actual memory and CPU measurements
        stats.memory_usage_mb = watchers.len() as f64 * 2.0; // Estimate 2MB per watcher
        stats.cpu_overhead_percent = watchers.len() as f64 * 0.5; // Estimate 0.5% CPU per watcher
    }
    
    fn start_processing_task(
        event_sender: broadcast::Sender<FileEvent>,
        stats: Arc<RwLock<WatcherStats>>,
        config: FileWatcherConfig,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(1));
            let mut event_count = 0u64;
            let mut last_reset = std::time::Instant::now();
            
            loop {
                interval.tick().await;
                
                // Calculate events per second
                let elapsed = last_reset.elapsed().as_secs_f64();
                if elapsed >= 1.0 {
                    let eps = event_count as f64 / elapsed;
                    
                    // Update stats
                    {
                        let mut stats = stats.write().await;
                        stats.events_per_second = eps;
                        stats.total_events_processed += event_count;
                        stats.throttling_active = eps > config.max_events_per_second;
                    }
                    
                    // Reset counters
                    event_count = 0;
                    last_reset = std::time::Instant::now();
                    
                    // Log throttling if active
                    if eps > config.max_events_per_second {
                        log::warn!("File system events throttling active: {:.1} eps", eps);
                    }
                }
                
                // Count events in receiver queue (simplified)
                event_count += event_sender.receiver_count() as u64;
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::virtualization::resource_monitor::{ResourceMonitor, ResourceThresholds};
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_file_system_watcher_creation() {
        let monitor = ResourceMonitor::new(ResourceThresholds::default()).unwrap();
        let config = FileWatcherConfig::default();
        
        let watcher = FileSystemWatcher::new(config, Arc::new(monitor)).await;
        assert!(watcher.is_ok());
    }
    
    #[tokio::test]
    async fn test_add_and_remove_watch() {
        let monitor = ResourceMonitor::new(ResourceThresholds::default()).unwrap();
        let config = FileWatcherConfig::default();
        let watcher = FileSystemWatcher::new(config, Arc::new(monitor)).await.unwrap();
        
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();
        
        // Add watch
        assert!(watcher.add_watch(path.clone()).await.is_ok());
        
        // Check stats
        let stats = watcher.get_stats().await;
        assert_eq!(stats.active_watchers, 1);
        
        // Remove watch
        assert!(watcher.remove_watch(&path).await.is_ok());
        
        // Check stats again
        let stats = watcher.get_stats().await;
        assert_eq!(stats.active_watchers, 0);
    }
}