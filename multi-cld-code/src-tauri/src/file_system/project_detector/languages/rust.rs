/// Rust Language Analyzer for CCTM Phase 2B.2
/// 
/// Provides comprehensive analysis of Rust projects including Cargo.toml parsing,
/// framework detection (Tauri, web frameworks), and project structure analysis

use std::path::Path;
use tokio::fs;
use anyhow::{Result, Error};
use async_trait::async_trait;

use super::{LanguageAnalyzer, LanguageAnalysisResult};
use crate::file_system::project_detector::{
    Language, FrameworkInfo, Command, Capability
};

/// Rust project analyzer with Cargo.toml intelligence
#[derive(Debug)]
pub struct RustAnalyzer {
    // Future: Add caching or configuration if needed
}

impl RustAnalyzer {
    /// Create a new Rust analyzer
    pub fn new() -> Self {
        RustAnalyzer {}
    }
    
    /// Analyze Cargo.toml for project information
    async fn analyze_cargo_toml(&self, cargo_path: &Path) -> Result<CargoAnalysis> {
        let content = fs::read_to_string(cargo_path).await?;
        let cargo_toml: toml::Value = toml::from_str(&content)?;
        
        // Extract package information
        let package = cargo_toml.get("package")
            .ok_or_else(|| Error::msg("No [package] section in Cargo.toml"))?;
        
        let name = package.get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        
        let version = package.get("version")
            .and_then(|v| v.as_str())
            .unwrap_or("0.0.0")
            .to_string();
        
        let edition = package.get("edition")
            .and_then(|v| v.as_str())
            .unwrap_or("2021")
            .to_string();
        
        let description = package.get("description")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // Analyze dependencies
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        
        if let Some(deps) = cargo_toml.get("dependencies").and_then(|d| d.as_table()) {
            for (name, _value) in deps {
                dependencies.push(name.clone());
            }
        }
        
        if let Some(dev_deps) = cargo_toml.get("dev-dependencies").and_then(|d| d.as_table()) {
            for (name, _value) in dev_deps {
                dev_dependencies.push(name.clone());
            }
        }
        
        // Detect project type
        let project_type = self.detect_rust_project_type(&cargo_toml, &dependencies);
        
        Ok(CargoAnalysis {
            name,
            version,
            edition,
            description,
            dependencies,
            dev_dependencies,
            project_type,
        })
    }
    
    /// Detect the type of Rust project based on dependencies and configuration
    fn detect_rust_project_type(&self, cargo_toml: &toml::Value, dependencies: &[String]) -> RustProjectType {
        // Check for Tauri (desktop application)
        if dependencies.iter().any(|dep| dep.starts_with("tauri")) {
            return RustProjectType::TauriApp;
        }
        
        // Check for web frameworks
        if dependencies.iter().any(|dep| matches!(dep.as_str(), "actix-web" | "warp" | "axum" | "rocket")) {
            return RustProjectType::WebServer;
        }
        
        // Check for async runtime (usually indicates server/service)
        if dependencies.iter().any(|dep| matches!(dep.as_str(), "tokio" | "async-std")) {
            return RustProjectType::AsyncService;
        }
        
        // Check for CLI frameworks
        if dependencies.iter().any(|dep| matches!(dep.as_str(), "clap" | "structopt" | "argh")) {
            return RustProjectType::CliTool;
        }
        
        // Check for WASM
        if dependencies.iter().any(|dep| matches!(dep.as_str(), "wasm-bindgen" | "web-sys" | "js-sys")) {
            return RustProjectType::WasmLib;
        }
        
        // Check if it's a library vs binary
        if cargo_toml.get("lib").is_some() {
            RustProjectType::Library
        } else if cargo_toml.get("bin").is_some() || cargo_toml.get("package").and_then(|p| p.get("name")).is_some() {
            RustProjectType::Binary
        } else {
            RustProjectType::Library // Default assumption
        }
    }
    
    /// Generate framework information based on detected project type
    fn generate_framework_info(&self, analysis: &CargoAnalysis, root_path: &Path) -> Vec<FrameworkInfo> {
        let mut frameworks = Vec::new();
        
        match analysis.project_type {
            RustProjectType::TauriApp => {
                frameworks.push(FrameworkInfo {
                    name: "Tauri".to_string(),
                    version: self.extract_dependency_version(&analysis.dependencies, "tauri"),
                    config_path: root_path.join("Cargo.toml"),
                    capabilities: vec![
                        Capability::DesktopApp,
                        Capability::Building,
                        Capability::WebDevelopment,
                    ],
                    suggested_commands: vec![
                        Command {
                            name: "dev".to_string(),
                            description: "Start Tauri development server".to_string(),
                            command: "cargo tauri dev".to_string(),
                            when_to_use: "During development to see live changes".to_string(),
                        },
                        Command {
                            name: "build".to_string(),
                            description: "Build Tauri application for production".to_string(),
                            command: "cargo tauri build".to_string(),
                            when_to_use: "To create distributable application".to_string(),
                        },
                        Command {
                            name: "test".to_string(),
                            description: "Run Rust tests".to_string(),
                            command: "cargo test".to_string(),
                            when_to_use: "To run unit and integration tests".to_string(),
                        },
                    ],
                    confidence: 0.95,
                });
            }
            
            RustProjectType::WebServer => {
                let framework_name = if analysis.dependencies.contains(&"actix-web".to_string()) {
                    "Actix Web"
                } else if analysis.dependencies.contains(&"warp".to_string()) {
                    "Warp"
                } else if analysis.dependencies.contains(&"axum".to_string()) {
                    "Axum"
                } else if analysis.dependencies.contains(&"rocket".to_string()) {
                    "Rocket"
                } else {
                    "Web Framework"
                };
                
                frameworks.push(FrameworkInfo {
                    name: framework_name.to_string(),
                    version: None,
                    config_path: root_path.join("Cargo.toml"),
                    capabilities: vec![
                        Capability::APIServer,
                        Capability::WebDevelopment,
                        Capability::Building,
                    ],
                    suggested_commands: vec![
                        Command {
                            name: "run".to_string(),
                            description: "Start the web server".to_string(),
                            command: "cargo run".to_string(),
                            when_to_use: "To start the development server".to_string(),
                        },
                        Command {
                            name: "test".to_string(),
                            description: "Run all tests".to_string(),
                            command: "cargo test".to_string(),
                            when_to_use: "To run unit and integration tests".to_string(),
                        },
                        Command {
                            name: "release".to_string(),
                            description: "Build optimized release version".to_string(),
                            command: "cargo build --release".to_string(),
                            when_to_use: "For production deployment".to_string(),
                        },
                    ],
                    confidence: 0.9,
                });
            }
            
            RustProjectType::CliTool => {
                frameworks.push(FrameworkInfo {
                    name: "CLI Application".to_string(),
                    version: None,
                    config_path: root_path.join("Cargo.toml"),
                    capabilities: vec![
                        Capability::Building,
                        Capability::Testing,
                    ],
                    suggested_commands: vec![
                        Command {
                            name: "run".to_string(),
                            description: "Run the CLI application".to_string(),
                            command: "cargo run".to_string(),
                            when_to_use: "To test the CLI during development".to_string(),
                        },
                        Command {
                            name: "install".to_string(),
                            description: "Install the CLI tool locally".to_string(),
                            command: "cargo install --path .".to_string(),
                            when_to_use: "To install the tool for regular use".to_string(),
                        },
                    ],
                    confidence: 0.85,
                });
            }
            
            _ => {
                // Generic Rust project
                frameworks.push(FrameworkInfo {
                    name: "Rust".to_string(),
                    version: None,
                    config_path: root_path.join("Cargo.toml"),
                    capabilities: vec![
                        Capability::Building,
                        Capability::Testing,
                    ],
                    suggested_commands: vec![
                        Command {
                            name: "build".to_string(),
                            description: "Compile the project".to_string(),
                            command: "cargo build".to_string(),
                            when_to_use: "To compile and check for errors".to_string(),
                        },
                        Command {
                            name: "test".to_string(),
                            description: "Run tests".to_string(),
                            command: "cargo test".to_string(),
                            when_to_use: "To run unit and integration tests".to_string(),
                        },
                        Command {
                            name: "check".to_string(),
                            description: "Check code without building".to_string(),
                            command: "cargo check".to_string(),
                            when_to_use: "Quick syntax and type checking".to_string(),
                        },
                    ],
                    confidence: 0.8,
                });
            }
        }
        
        frameworks
    }
    
    /// Extract version information for a specific dependency
    fn extract_dependency_version(&self, dependencies: &[String], dep_name: &str) -> Option<String> {
        // This is simplified - in a full implementation, we'd parse the actual version
        if dependencies.iter().any(|dep| dep == dep_name) {
            Some("latest".to_string())
        } else {
            None
        }
    }
    
    /// Calculate confidence score based on analysis completeness
    fn calculate_confidence(&self, analysis: &CargoAnalysis, has_src_dir: bool) -> f64 {
        let mut confidence = 0.5; // Base confidence for detecting Cargo.toml
        
        if !analysis.name.is_empty() && analysis.name != "unknown" {
            confidence += 0.2;
        }
        
        if analysis.edition == "2021" || analysis.edition == "2018" {
            confidence += 0.1;
        }
        
        if !analysis.dependencies.is_empty() {
            confidence += 0.1;
        }
        
        if has_src_dir {
            confidence += 0.1;
        }
        
        confidence.min(1.0)
    }
}

#[async_trait]
impl LanguageAnalyzer for RustAnalyzer {
    async fn can_analyze(&self, root_path: &Path) -> bool {
        root_path.join("Cargo.toml").exists()
    }
    
    async fn analyze(&self, root_path: &Path) -> Result<LanguageAnalysisResult> {
        let cargo_path = root_path.join("Cargo.toml");
        
        if !cargo_path.exists() {
            return Err(Error::msg("No Cargo.toml found"));
        }
        
        // Analyze Cargo.toml
        let cargo_analysis = self.analyze_cargo_toml(&cargo_path).await?;
        
        // Check for src directory
        let has_src_dir = root_path.join("src").exists();
        
        // Generate language information
        let language = Language::Rust {
            version: None, // TODO: Could detect rustc version if needed
            edition: cargo_analysis.edition.clone(),
        };
        
        // Generate framework information
        let frameworks = self.generate_framework_info(&cargo_analysis, root_path);
        
        // Calculate confidence
        let confidence = self.calculate_confidence(&cargo_analysis, has_src_dir);
        
        // Generate analysis notes
        let mut analysis_notes = Vec::new();
        analysis_notes.push(format!("Detected Rust project: {}", cargo_analysis.name));
        analysis_notes.push(format!("Edition: {}", cargo_analysis.edition));
        analysis_notes.push(format!("Dependencies: {}", cargo_analysis.dependencies.len()));
        analysis_notes.push(format!("Project type: {:?}", cargo_analysis.project_type));
        
        if let Some(description) = &cargo_analysis.description {
            analysis_notes.push(format!("Description: {}", description));
        }
        
        Ok(LanguageAnalysisResult {
            language,
            frameworks,
            confidence,
            analysis_notes,
        })
    }
    
    fn confidence_score(&self, root_path: &Path) -> f64 {
        let cargo_path = root_path.join("Cargo.toml");
        let src_path = root_path.join("src");
        
        if cargo_path.exists() {
            if src_path.exists() && src_path.is_dir() {
                0.95 // Very high confidence - has both Cargo.toml and src/
            } else {
                0.8 // High confidence - has Cargo.toml
            }
        } else {
            0.0 // No confidence without Cargo.toml
        }
    }
    
    fn language_name(&self) -> &'static str {
        "Rust"
    }
}

/// Cargo.toml analysis result
#[derive(Debug, Clone)]
struct CargoAnalysis {
    name: String,
    version: String,
    edition: String,
    description: Option<String>,
    dependencies: Vec<String>,
    dev_dependencies: Vec<String>,
    project_type: RustProjectType,
}

/// Types of Rust projects we can detect
#[derive(Debug, Clone, PartialEq)]
enum RustProjectType {
    /// Tauri desktop application
    TauriApp,
    /// Web server (Actix, Warp, Axum, Rocket)
    WebServer,
    /// Async service or daemon
    AsyncService,
    /// Command-line tool
    CliTool,
    /// WebAssembly library
    WasmLib,
    /// Standard library crate
    Library,
    /// Binary application
    Binary,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_rust_analyzer_creation() {
        let analyzer = RustAnalyzer::new();
        assert_eq!(analyzer.language_name(), "Rust");
    }
    
    #[tokio::test]
    async fn test_can_analyze_with_cargo_toml() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = RustAnalyzer::new();
        
        // Without Cargo.toml
        assert!(!analyzer.can_analyze(temp_dir.path()).await);
        
        // With Cargo.toml
        fs::write(
            temp_dir.path().join("Cargo.toml"),
            r#"[package]
name = "test-project"
version = "0.1.0"
edition = "2021"
"#
        ).await.unwrap();
        
        assert!(analyzer.can_analyze(temp_dir.path()).await);
    }
    
    #[tokio::test]
    async fn test_confidence_scoring() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = RustAnalyzer::new();
        
        // No files
        assert_eq!(analyzer.confidence_score(temp_dir.path()), 0.0);
        
        // With Cargo.toml
        fs::write(
            temp_dir.path().join("Cargo.toml"),
            "[package]\nname = \"test\"\nversion = \"0.1.0\"\n"
        ).await.unwrap();
        
        assert_eq!(analyzer.confidence_score(temp_dir.path()), 0.8);
        
        // With Cargo.toml and src/
        fs::create_dir(temp_dir.path().join("src")).await.unwrap();
        assert_eq!(analyzer.confidence_score(temp_dir.path()), 0.95);
    }
    
    #[tokio::test]
    async fn test_tauri_project_detection() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = RustAnalyzer::new();
        
        // Create Tauri Cargo.toml
        fs::write(
            temp_dir.path().join("Cargo.toml"),
            r#"[package]
name = "tauri-app"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = "2.0"
"#
        ).await.unwrap();
        
        let result = analyzer.analyze(temp_dir.path()).await.unwrap();
        
        assert!(matches!(result.language, Language::Rust { .. }));
        assert!(!result.frameworks.is_empty());
        assert_eq!(result.frameworks[0].name, "Tauri");
        assert!(result.confidence > 0.8);
    }
}