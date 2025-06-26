/// Project Detection and Analysis Engine for CCTM Phase 2B.2
/// 
/// Provides intelligent project analysis, language detection, and framework identification
/// to enable context-aware AI assistance and project intelligence

pub mod languages;
pub mod cache;
pub mod analysis;

use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use anyhow::Result;

use self::cache::ProjectCache;
use self::analysis::AnalysisEngine;
use self::languages::LanguageDetector;

/// Supported programming languages with version information
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Language {
    Rust {
        version: Option<String>,
        edition: String,
    },
    TypeScript {
        version: Option<String>,
        strict: bool,
        node_version: Option<String>,
    },
    JavaScript {
        node_version: Option<String>,
        module_type: ModuleType,
    },
    Python {
        version: Option<String>,
        virtual_env: Option<PathBuf>,
    },
    Go {
        version: Option<String>,
        module_path: Option<String>,
    },
    Other {
        name: String,
        detected_by: String,
    },
}

/// JavaScript/TypeScript module types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModuleType {
    CommonJS,
    ESModule,
    Mixed,
    Unknown,
}

/// Framework information with capabilities and suggestions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameworkInfo {
    pub name: String,
    pub version: Option<String>,
    pub config_path: PathBuf,
    pub capabilities: Vec<Capability>,
    pub suggested_commands: Vec<Command>,
    pub confidence: f64,
}

/// Framework capabilities and features
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Capability {
    WebDevelopment,
    DesktopApp,
    MobileApp,
    APIServer,
    Database,
    Testing,
    Building,
    Deployment,
    StateManagement,
    Routing,
    Styling,
    Authentication,
}

/// Suggested commands for the project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub name: String,
    pub description: String,
    pub command: String,
    pub when_to_use: String,
}

/// Build system information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BuildSystem {
    Cargo { target: Option<String> },
    NPM { scripts: Vec<String> },
    Yarn { scripts: Vec<String> },
    Bun { scripts: Vec<String> },
    Vite { config: Option<PathBuf> },
    Webpack { config: Option<PathBuf> },
    Make { targets: Vec<String> },
    Docker { compose: bool },
    Unknown,
}

/// Dependency information with version constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInfo {
    pub name: String,
    pub version: String,
    pub dev_dependency: bool,
    pub optional: bool,
    pub description: Option<String>,
}

/// Complete dependency graph analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyGraph {
    pub dependencies: Vec<DependencyInfo>,
    pub dev_dependencies: Vec<DependencyInfo>,
    pub total_count: usize,
    pub outdated_count: usize,
    pub security_issues: Vec<String>,
    pub last_updated: DateTime<Utc>,
}

/// Git repository information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepository {
    pub current_branch: String,
    pub remote_url: Option<String>,
    pub commits_ahead: usize,
    pub commits_behind: usize,
    pub has_uncommitted_changes: bool,
    pub last_commit: Option<DateTime<Utc>>,
    pub contributors: Vec<String>,
}

/// Project structure analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStructure {
    pub source_directories: Vec<PathBuf>,
    pub test_directories: Vec<PathBuf>,
    pub config_files: Vec<PathBuf>,
    pub documentation_files: Vec<PathBuf>,
    pub total_files: usize,
    pub total_lines: usize,
    pub file_types: std::collections::HashMap<String, usize>,
}

/// Complete project analysis result
#[derive(Debug, Clone, Serialize)]
pub struct ProjectAnalysis {
    /// Root directory of the project
    pub root_path: PathBuf,
    
    /// Primary language detected
    pub language: Language,
    
    /// Detected frameworks and libraries
    pub frameworks: Vec<FrameworkInfo>,
    
    /// Dependency analysis
    pub dependencies: DependencyGraph,
    
    /// Project structure mapping
    pub structure: ProjectStructure,
    
    /// Git repository information if available
    pub git_info: Option<GitRepository>,
    
    /// Build system information
    pub build_system: BuildSystem,
    
    /// Overall confidence in analysis (0.0 to 1.0)
    pub confidence: f64,
    
    /// When this analysis was performed
    pub analyzed_at: DateTime<Utc>,
    
    /// Time taken for analysis in milliseconds
    pub analysis_duration_ms: u64,
}

/// Project Detector Engine - Main orchestrator for project intelligence
#[derive(Debug)]
pub struct ProjectDetector {
    /// Intelligent caching system
    cache: Arc<RwLock<ProjectCache>>,
    
    /// Background analysis engine
    analysis_engine: AnalysisEngine,
    
    /// Language detection system
    language_detector: LanguageDetector,
    
    /// Configuration
    config: ProjectDetectorConfig,
}

/// Configuration for project detection
#[derive(Debug, Clone)]
pub struct ProjectDetectorConfig {
    /// Maximum memory usage for project cache (MB)
    pub max_cache_memory_mb: usize,
    
    /// Maximum analysis time before timeout (seconds)
    pub max_analysis_time_secs: u64,
    
    /// Whether to perform deep dependency analysis
    pub enable_dependency_analysis: bool,
    
    /// Whether to analyze git repository information
    pub enable_git_analysis: bool,
    
    /// Maximum project size to analyze (number of files)
    pub max_project_files: usize,
    
    /// Confidence threshold for caching results
    pub min_confidence_for_cache: f64,
}

impl Default for ProjectDetectorConfig {
    fn default() -> Self {
        ProjectDetectorConfig {
            max_cache_memory_mb: 15, // 15MB limit as determined in analysis
            max_analysis_time_secs: 2, // 2 second timeout
            enable_dependency_analysis: true,
            enable_git_analysis: true,
            max_project_files: 5000, // Reasonable limit for deep analysis
            min_confidence_for_cache: 0.8, // Only cache high-confidence results
        }
    }
}

impl ProjectDetector {
    /// Create a new ProjectDetector with specified configuration
    pub async fn new(config: ProjectDetectorConfig) -> Result<Self> {
        let cache = Arc::new(RwLock::new(ProjectCache::new(config.max_cache_memory_mb)));
        let analysis_engine = AnalysisEngine::new(config.clone());
        let language_detector = LanguageDetector::new();
        
        log::info!("ProjectDetector initialized with config: {:?}", config);
        
        Ok(ProjectDetector {
            cache,
            analysis_engine,
            language_detector,
            config,
        })
    }
    
    /// Analyze a project directory and return comprehensive project intelligence
    pub async fn analyze_project(&self, project_path: &Path) -> Result<ProjectAnalysis> {
        let start_time = std::time::Instant::now();
        
        // Normalize path
        let canonical_path = project_path.canonicalize()
            .unwrap_or_else(|_| project_path.to_path_buf());
        
        // Check cache first
        if let Some(cached_analysis) = self.get_cached_analysis(&canonical_path).await {
            log::debug!("Using cached analysis for {}", canonical_path.display());
            return Ok(cached_analysis);
        }
        
        log::info!("Starting project analysis for: {}", canonical_path.display());
        
        // Perform comprehensive analysis
        let analysis = self.perform_analysis(&canonical_path).await?;
        
        // Cache result if confidence is high enough
        if analysis.confidence >= self.config.min_confidence_for_cache {
            self.cache_analysis(&canonical_path, &analysis).await;
        }
        
        let duration = start_time.elapsed();
        log::info!(
            "Project analysis completed for {} in {:.2}ms (confidence: {:.2})",
            canonical_path.display(),
            duration.as_millis(),
            analysis.confidence
        );
        
        Ok(analysis)
    }
    
    /// Quick project type detection without full analysis
    pub async fn detect_project_type(&self, project_path: &Path) -> Result<Language> {
        self.language_detector.detect_primary_language(project_path).await
    }
    
    /// Check if a project analysis needs to be refreshed
    pub async fn needs_refresh(&self, project_path: &Path) -> bool {
        let canonical_path = project_path.canonicalize()
            .unwrap_or_else(|_| project_path.to_path_buf());
            
        if let Some(analysis) = self.get_cached_analysis(&canonical_path).await {
            // Refresh if analysis is older than 1 hour or confidence is low
            let age = Utc::now() - analysis.analyzed_at;
            age.num_minutes() > 60 || analysis.confidence < 0.9
        } else {
            true // No cached analysis, needs analysis
        }
    }
    
    /// Get project analysis statistics
    pub async fn get_stats(&self) -> ProjectDetectorStats {
        let cache = self.cache.read().await;
        ProjectDetectorStats {
            cached_projects: cache.len(),
            cache_memory_usage_mb: cache.memory_usage_mb(),
            cache_hit_rate: cache.hit_rate(),
            total_analyses_performed: cache.total_analyses(),
        }
    }
    
    // Private helper methods
    
    async fn get_cached_analysis(&self, path: &Path) -> Option<ProjectAnalysis> {
        let cache = self.cache.read().await;
        cache.get(path)
    }
    
    async fn cache_analysis(&self, path: &Path, analysis: &ProjectAnalysis) {
        let mut cache = self.cache.write().await;
        cache.insert(path.to_path_buf(), analysis.clone());
    }
    
    async fn perform_analysis(&self, path: &Path) -> Result<ProjectAnalysis> {
        // This is a comprehensive analysis orchestration
        // Individual components will be implemented in subsequent steps
        
        let start_time = std::time::Instant::now();
        
        // 1. Language detection
        let language = self.language_detector.detect_primary_language(path).await?;
        
        // 2. Framework detection (to be implemented)
        let frameworks = vec![]; // Placeholder
        
        // 3. Dependency analysis (to be implemented)
        let dependencies = DependencyGraph {
            dependencies: vec![],
            dev_dependencies: vec![],
            total_count: 0,
            outdated_count: 0,
            security_issues: vec![],
            last_updated: Utc::now(),
        };
        
        // 4. Project structure analysis (to be implemented)
        let structure = ProjectStructure {
            source_directories: vec![],
            test_directories: vec![],
            config_files: vec![],
            documentation_files: vec![],
            total_files: 0,
            total_lines: 0,
            file_types: std::collections::HashMap::new(),
        };
        
        // 5. Git analysis (to be implemented)
        let git_info = None;
        
        // 6. Build system detection (to be implemented)
        let build_system = BuildSystem::Unknown;
        
        let analysis_duration = start_time.elapsed();
        
        Ok(ProjectAnalysis {
            root_path: path.to_path_buf(),
            language,
            frameworks,
            dependencies,
            structure,
            git_info,
            build_system,
            confidence: 0.8, // Will be calculated based on detection confidence
            analyzed_at: Utc::now(),
            analysis_duration_ms: analysis_duration.as_millis() as u64,
        })
    }
}

/// Statistics for project detection performance
#[derive(Debug, Serialize)]
pub struct ProjectDetectorStats {
    pub cached_projects: usize,
    pub cache_memory_usage_mb: f64,
    pub cache_hit_rate: f64,
    pub total_analyses_performed: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_project_detector_creation() {
        let config = ProjectDetectorConfig::default();
        let detector = ProjectDetector::new(config).await;
        assert!(detector.is_ok());
    }
    
    #[tokio::test]
    async fn test_project_analysis() {
        let detector = ProjectDetector::new(ProjectDetectorConfig::default()).await.unwrap();
        let temp_dir = TempDir::new().unwrap();
        
        // Create a simple Rust project structure
        std::fs::write(
            temp_dir.path().join("Cargo.toml"),
            r#"[package]
name = "test-project"
version = "0.1.0"
edition = "2021"
"#
        ).unwrap();
        
        let analysis = detector.analyze_project(temp_dir.path()).await;
        assert!(analysis.is_ok());
        
        let analysis = analysis.unwrap();
        assert!(matches!(analysis.language, Language::Rust { .. }));
        assert_eq!(analysis.root_path, temp_dir.path().canonicalize().unwrap());
    }
}