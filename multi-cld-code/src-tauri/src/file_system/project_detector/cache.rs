/// Project Analysis Cache System for CCTM Phase 2B.2
/// 
/// Provides LRU caching of project analysis results to minimize repeated computation
/// and stay within the 15MB memory allocation for project intelligence

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

use super::ProjectAnalysis;

/// LRU Cache entry with metadata
#[derive(Debug, Clone)]
struct CacheEntry {
    analysis: ProjectAnalysis,
    access_count: u64,
    last_accessed: DateTime<Utc>,
    memory_size_bytes: usize,
}

/// Intelligent project analysis cache with LRU eviction
#[derive(Debug)]
pub struct ProjectCache {
    /// Cached project analyses
    entries: HashMap<PathBuf, CacheEntry>,
    
    /// Access order for LRU eviction (most recent first)
    access_order: Vec<PathBuf>,
    
    /// Maximum memory usage in bytes
    max_memory_bytes: usize,
    
    /// Current memory usage in bytes
    current_memory_bytes: usize,
    
    /// Cache statistics
    stats: CacheStats,
}

/// Cache performance statistics
#[derive(Debug, Default)]
struct CacheStats {
    total_requests: u64,
    cache_hits: u64,
    cache_misses: u64,
    evictions: u64,
    total_analyses_cached: u64,
}

impl ProjectCache {
    /// Create a new project cache with specified memory limit
    pub fn new(max_memory_mb: usize) -> Self {
        let max_memory_bytes = max_memory_mb * 1024 * 1024; // Convert MB to bytes
        
        log::info!("ProjectCache initialized with {}MB memory limit", max_memory_mb);
        
        ProjectCache {
            entries: HashMap::new(),
            access_order: Vec::new(),
            max_memory_bytes,
            current_memory_bytes: 0,
            stats: CacheStats::default(),
        }
    }
    
    /// Get a cached project analysis if available
    pub fn get(&mut self, path: &Path) -> Option<ProjectAnalysis> {
        self.stats.total_requests += 1;
        
        let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
        
        if let Some(entry) = self.entries.get_mut(&canonical_path) {
            // Update access information
            entry.access_count += 1;
            entry.last_accessed = Utc::now();
            
            // Move to front of access order (most recently used)
            self.move_to_front(&canonical_path);
            
            self.stats.cache_hits += 1;
            log::debug!("Cache hit for project: {}", canonical_path.display());
            
            Some(entry.analysis.clone())
        } else {
            self.stats.cache_misses += 1;
            log::debug!("Cache miss for project: {}", canonical_path.display());
            
            None
        }
    }
    
    /// Insert a project analysis into the cache
    pub fn insert(&mut self, path: PathBuf, analysis: ProjectAnalysis) {
        let canonical_path = path.canonicalize().unwrap_or(path);
        
        // Calculate memory size of the analysis (approximation)
        let memory_size = self.estimate_memory_size(&analysis);
        
        // Check if we need to evict entries to make room
        self.ensure_memory_capacity(memory_size);
        
        // Create cache entry
        let entry = CacheEntry {
            analysis,
            access_count: 1,
            last_accessed: Utc::now(),
            memory_size_bytes: memory_size,
        };
        
        // Remove existing entry if present
        if let Some(old_entry) = self.entries.remove(&canonical_path) {
            self.current_memory_bytes -= old_entry.memory_size_bytes;
            self.remove_from_access_order(&canonical_path);
        }
        
        // Insert new entry
        self.entries.insert(canonical_path.clone(), entry);
        self.access_order.insert(0, canonical_path.clone()); // Most recent first
        self.current_memory_bytes += memory_size;
        self.stats.total_analyses_cached += 1;
        
        log::debug!(
            "Cached project analysis for {} ({} bytes, total cache: {:.2}MB)",
            canonical_path.display(),
            memory_size,
            self.current_memory_bytes as f64 / (1024.0 * 1024.0)
        );
    }
    
    /// Check if cache contains analysis for given path
    pub fn contains(&self, path: &Path) -> bool {
        let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
        self.entries.contains_key(&canonical_path)
    }
    
    /// Remove a specific entry from cache
    pub fn remove(&mut self, path: &Path) -> bool {
        let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
        
        if let Some(entry) = self.entries.remove(&canonical_path) {
            self.current_memory_bytes -= entry.memory_size_bytes;
            self.remove_from_access_order(&canonical_path);
            
            log::debug!("Removed cached analysis for {}", canonical_path.display());
            true
        } else {
            false
        }
    }
    
    /// Clear all cached entries
    pub fn clear(&mut self) {
        let cleared_count = self.entries.len();
        
        self.entries.clear();
        self.access_order.clear();
        self.current_memory_bytes = 0;
        
        log::info!("Cleared {} cached project analyses", cleared_count);
    }
    
    /// Get cache statistics
    pub fn len(&self) -> usize {
        self.entries.len()
    }
    
    /// Check if cache is empty
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
    
    /// Get current memory usage in MB
    pub fn memory_usage_mb(&self) -> f64 {
        self.current_memory_bytes as f64 / (1024.0 * 1024.0)
    }
    
    /// Get cache hit rate
    pub fn hit_rate(&self) -> f64 {
        if self.stats.total_requests == 0 {
            0.0
        } else {
            self.stats.cache_hits as f64 / self.stats.total_requests as f64
        }
    }
    
    /// Get total number of analyses performed
    pub fn total_analyses(&self) -> u64 {
        self.stats.total_analyses_cached
    }
    
    /// Clean up stale entries (older than specified duration)
    pub fn cleanup_stale_entries(&mut self, max_age_hours: i64) {
        let cutoff_time = Utc::now() - chrono::Duration::hours(max_age_hours);
        let mut paths_to_remove = Vec::new();
        
        for (path, entry) in &self.entries {
            if entry.last_accessed < cutoff_time {
                paths_to_remove.push(path.clone());
            }
        }
        
        for path in paths_to_remove {
            self.remove(&path);
        }
        
        log::info!("Cleaned up stale cache entries older than {} hours", max_age_hours);
    }
    
    // Private helper methods
    
    /// Ensure cache has enough memory capacity for new entry
    fn ensure_memory_capacity(&mut self, required_bytes: usize) {
        // Check if we need to evict entries
        while self.current_memory_bytes + required_bytes > self.max_memory_bytes && !self.access_order.is_empty() {
            // Remove least recently used entry (last in access_order)
            if let Some(lru_path) = self.access_order.pop() {
                if let Some(entry) = self.entries.remove(&lru_path) {
                    self.current_memory_bytes -= entry.memory_size_bytes;
                    self.stats.evictions += 1;
                    
                    log::debug!(
                        "Evicted LRU cache entry: {} ({} bytes)",
                        lru_path.display(),
                        entry.memory_size_bytes
                    );
                }
            }
        }
    }
    
    /// Move path to front of access order (most recently used)
    fn move_to_front(&mut self, path: &Path) {
        if let Some(index) = self.access_order.iter().position(|p| p == path) {
            let path = self.access_order.remove(index);
            self.access_order.insert(0, path);
        }
    }
    
    /// Remove path from access order
    fn remove_from_access_order(&mut self, path: &Path) {
        if let Some(index) = self.access_order.iter().position(|p| p == path) {
            self.access_order.remove(index);
        }
    }
    
    /// Estimate memory size of a project analysis (approximation)
    fn estimate_memory_size(&self, analysis: &ProjectAnalysis) -> usize {
        // Base size for struct
        let mut size = 1024; // 1KB base
        
        // Path size
        size += analysis.root_path.as_os_str().len();
        
        // Framework info
        size += analysis.frameworks.len() * 512; // 512 bytes per framework
        
        // Dependencies
        size += analysis.dependencies.dependencies.len() * 256; // 256 bytes per dependency
        size += analysis.dependencies.dev_dependencies.len() * 256;
        
        // Project structure
        size += analysis.structure.source_directories.len() * 128;
        size += analysis.structure.test_directories.len() * 128;
        size += analysis.structure.config_files.len() * 128;
        size += analysis.structure.documentation_files.len() * 128;
        size += analysis.structure.file_types.len() * 64;
        
        // Git info
        if let Some(git_info) = &analysis.git_info {
            size += git_info.current_branch.len();
            size += git_info.remote_url.as_ref().map(|s| s.len()).unwrap_or(0);
            size += git_info.contributors.iter().map(|s| s.len()).sum::<usize>();
        }
        
        size
    }
}

/// Background cache maintenance task
impl ProjectCache {
    /// Start a background task for cache maintenance
    pub fn start_maintenance_task(&self) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(300)); // 5 minutes
            
            loop {
                interval.tick().await;
                
                // In a real implementation, we would have a shared cache reference
                // For now, this is a placeholder for the maintenance pattern
                log::debug!("Cache maintenance task running");
                
                // TODO: Implement cache maintenance operations:
                // - Cleanup stale entries (>1 hour old)
                // - Memory pressure relief
                // - Statistics reporting
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    fn create_test_analysis(path: PathBuf) -> ProjectAnalysis {
        use super::super::{Language, DependencyGraph, ProjectStructure, BuildSystem};
        
        ProjectAnalysis {
            root_path: path,
            language: Language::Rust {
                version: Some("1.70.0".to_string()),
                edition: "2021".to_string(),
            },
            frameworks: vec![],
            dependencies: DependencyGraph {
                dependencies: vec![],
                dev_dependencies: vec![],
                total_count: 0,
                outdated_count: 0,
                security_issues: vec![],
                last_updated: Utc::now(),
            },
            structure: ProjectStructure {
                source_directories: vec![],
                test_directories: vec![],
                config_files: vec![],
                documentation_files: vec![],
                total_files: 0,
                total_lines: 0,
                file_types: std::collections::HashMap::new(),
            },
            git_info: None,
            build_system: BuildSystem::Unknown,
            confidence: 0.9,
            analyzed_at: Utc::now(),
            analysis_duration_ms: 100,
        }
    }
    
    #[test]
    fn test_cache_creation() {
        let cache = ProjectCache::new(10); // 10MB limit
        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
        assert_eq!(cache.memory_usage_mb(), 0.0);
    }
    
    #[test]
    fn test_cache_insert_and_get() {
        let mut cache = ProjectCache::new(10);
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();
        
        let analysis = create_test_analysis(path.clone());
        cache.insert(path.clone(), analysis.clone());
        
        assert_eq!(cache.len(), 1);
        assert!(!cache.is_empty());
        
        let retrieved = cache.get(&path);
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().confidence, 0.9);
    }
    
    #[test]
    fn test_cache_lru_eviction() {
        let mut cache = ProjectCache::new(1); // Very small 1MB limit to force eviction
        
        // Add multiple entries to trigger eviction
        for i in 0..5 {
            let temp_dir = TempDir::new().unwrap();
            let path = temp_dir.path().join(format!("project_{}", i));
            let analysis = create_test_analysis(path.clone());
            cache.insert(path, analysis);
        }
        
        // Cache should have evicted some entries
        assert!(cache.len() < 5);
        assert!(cache.memory_usage_mb() <= 1.0);
    }
    
    #[test]
    fn test_cache_hit_rate() {
        let mut cache = ProjectCache::new(10);
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();
        
        // Initially no requests
        assert_eq!(cache.hit_rate(), 0.0);
        
        // Miss
        let result = cache.get(&path);
        assert!(result.is_none());
        assert!(cache.hit_rate() < 1.0);
        
        // Insert and hit
        let analysis = create_test_analysis(path.clone());
        cache.insert(path.clone(), analysis);
        
        let result = cache.get(&path);
        assert!(result.is_some());
        assert!(cache.hit_rate() > 0.0);
    }
}