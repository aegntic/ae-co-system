/// File System Event Types and Processing for CCTM
/// 
/// Defines the event structures and types used for file system monitoring

use std::path::PathBuf;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Types of file system changes we monitor
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChangeType {
    /// File or directory was created
    Created,
    /// File or directory was modified  
    Modified,
    /// File or directory was deleted
    Deleted,
    /// File or directory was renamed
    Renamed { from: PathBuf, to: PathBuf },
    /// File permissions changed
    Chmod,
    /// File was moved
    Moved { from: PathBuf, to: PathBuf },
}

/// File system event with metadata
#[derive(Debug, Clone, Serialize)]
pub struct FileEvent {
    /// Path that changed
    pub path: PathBuf,
    
    /// Type of change
    pub change_type: ChangeType,
    
    /// When the event occurred
    pub timestamp: DateTime<Utc>,
    
    /// File size if available
    pub file_size: Option<u64>,
    
    /// File extension for quick filtering
    pub extension: Option<String>,
    
    /// Whether this is a directory
    pub is_directory: bool,
    
    /// Project context if available
    pub project_context: Option<ProjectContext>,
}

/// Project context associated with a file change
#[derive(Debug, Clone, Serialize)]
pub struct ProjectContext {
    /// Project root directory
    pub root_path: PathBuf,
    
    /// Detected project type
    pub project_type: Option<ProjectType>,
    
    /// Git branch if in a git repository
    pub git_branch: Option<String>,
    
    /// Relative path within project
    pub relative_path: PathBuf,
}

/// Types of projects we can detect
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProjectType {
    Rust,
    TypeScript,
    JavaScript,
    Python,
    Go,
    C,
    Cpp,
    Java,
    React,
    Vue,
    Angular,
    Tauri,
    Unknown,
}

/// Path being watched with metadata
#[derive(Debug, Clone)]
pub struct WatchedPath {
    /// The path being watched
    pub path: PathBuf,
    
    /// When watching started
    pub started_at: DateTime<Utc>,
    
    /// Number of events received
    pub event_count: u64,
    
    /// Last event timestamp
    pub last_event: Option<DateTime<Utc>>,
    
    /// Whether this path is actively being watched
    pub is_active: bool,
    
    /// Project context if detected
    pub project_context: Option<ProjectContext>,
}

impl FileEvent {
    /// Create a new file event
    pub fn new(path: PathBuf, change_type: ChangeType) -> Self {
        let extension = path.extension().and_then(|ext| ext.to_str()).map(String::from);
        let is_directory = path.is_dir();
        
        FileEvent {
            path,
            change_type,
            timestamp: Utc::now(),
            file_size: None,
            extension,
            is_directory,
            project_context: None,
        }
    }
    
    /// Add project context to the event
    pub fn with_project_context(mut self, context: ProjectContext) -> Self {
        self.project_context = Some(context);
        self
    }
    
    /// Add file size information
    pub fn with_file_size(mut self, size: u64) -> Self {
        self.file_size = Some(size);
        self
    }
    
    /// Check if this event is for a source code file
    pub fn is_source_file(&self) -> bool {
        if let Some(ext) = &self.extension {
            matches!(ext.as_str(), 
                "rs" | "ts" | "js" | "tsx" | "jsx" | "py" | "go" | 
                "c" | "cpp" | "h" | "hpp" | "java" | "kt" | "swift" |
                "vue" | "svelte" | "html" | "css" | "scss" | "sass"
            )
        } else {
            false
        }
    }
    
    /// Check if this event is for a configuration file
    pub fn is_config_file(&self) -> bool {
        if let Some(name) = self.path.file_name().and_then(|n| n.to_str()) {
            matches!(name,
                "Cargo.toml" | "package.json" | "tsconfig.json" | "pyproject.toml" |
                "go.mod" | "pom.xml" | "build.gradle" | ".gitignore" | "README.md" |
                "Dockerfile" | "docker-compose.yml" | ".env" | "config.toml"
            )
        } else {
            false
        }
    }
    
    /// Check if this event should trigger attention
    pub fn should_trigger_attention(&self) -> bool {
        match &self.change_type {
            ChangeType::Created | ChangeType::Modified => {
                self.is_source_file() || self.is_config_file()
            }
            ChangeType::Deleted => self.is_config_file(),
            ChangeType::Renamed { .. } | ChangeType::Moved { .. } => {
                self.is_source_file()
            }
            ChangeType::Chmod => false,
        }
    }
}

impl WatchedPath {
    /// Create a new watched path
    pub fn new(path: PathBuf) -> Self {
        WatchedPath {
            path,
            started_at: Utc::now(),
            event_count: 0,
            last_event: None,
            is_active: true,
            project_context: None,
        }
    }
    
    /// Record an event for this path
    pub fn record_event(&mut self) {
        self.event_count += 1;
        self.last_event = Some(Utc::now());
    }
    
    /// Set project context
    pub fn set_project_context(&mut self, context: ProjectContext) {
        self.project_context = Some(context);
    }
    
    /// Get events per minute rate
    pub fn events_per_minute(&self) -> f64 {
        let duration = Utc::now() - self.started_at;
        let minutes = duration.num_seconds() as f64 / 60.0;
        if minutes > 0.0 {
            self.event_count as f64 / minutes
        } else {
            0.0
        }
    }
}

impl ProjectType {
    /// Detect project type from file path
    pub fn detect_from_file(path: &std::path::Path) -> Option<ProjectType> {
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            match name {
                "Cargo.toml" => Some(ProjectType::Rust),
                "package.json" => {
                    // Could be TypeScript, JavaScript, React, etc.
                    // Would need to read file content for more specific detection
                    Some(ProjectType::JavaScript)
                }
                "tsconfig.json" => Some(ProjectType::TypeScript),
                "pyproject.toml" | "requirements.txt" | "setup.py" => Some(ProjectType::Python),
                "go.mod" => Some(ProjectType::Go),
                "pom.xml" => Some(ProjectType::Java),
                "src-tauri" if path.is_dir() => Some(ProjectType::Tauri),
                _ => None,
            }
        } else {
            None
        }
    }
    
    /// Get file extensions associated with this project type
    pub fn typical_extensions(&self) -> &[&str] {
        match self {
            ProjectType::Rust => &["rs", "toml"],
            ProjectType::TypeScript => &["ts", "tsx", "json"],
            ProjectType::JavaScript => &["js", "jsx", "json"],
            ProjectType::Python => &["py", "pyi", "toml", "txt"],
            ProjectType::Go => &["go", "mod", "sum"],
            ProjectType::C => &["c", "h"],
            ProjectType::Cpp => &["cpp", "cxx", "cc", "hpp", "hxx"],
            ProjectType::Java => &["java", "xml", "gradle"],
            ProjectType::React => &["jsx", "tsx", "js", "ts", "json"],
            ProjectType::Vue => &["vue", "js", "ts", "json"],
            ProjectType::Angular => &["ts", "html", "css", "scss", "json"],
            ProjectType::Tauri => &["rs", "toml", "js", "ts", "html", "css"],
            ProjectType::Unknown => &[],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_file_event_creation() {
        let path = PathBuf::from("src/main.rs");
        let event = FileEvent::new(path.clone(), ChangeType::Modified);
        
        assert_eq!(event.path, path);
        assert_eq!(event.change_type, ChangeType::Modified);
        assert_eq!(event.extension, Some("rs".to_string()));
        assert!(event.is_source_file());
    }
    
    #[test]
    fn test_project_type_detection() {
        assert_eq!(
            ProjectType::detect_from_file(&PathBuf::from("Cargo.toml")),
            Some(ProjectType::Rust)
        );
        assert_eq!(
            ProjectType::detect_from_file(&PathBuf::from("package.json")),
            Some(ProjectType::JavaScript)
        );
    }
    
    #[test]
    fn test_attention_triggers() {
        let rust_event = FileEvent::new(
            PathBuf::from("src/main.rs"), 
            ChangeType::Modified
        );
        assert!(rust_event.should_trigger_attention());
        
        let config_event = FileEvent::new(
            PathBuf::from("Cargo.toml"), 
            ChangeType::Modified
        );
        assert!(config_event.should_trigger_attention());
        
        let chmod_event = FileEvent::new(
            PathBuf::from("src/main.rs"), 
            ChangeType::Chmod
        );
        assert!(!chmod_event.should_trigger_attention());
    }
}