/// JavaScript Language Analyzer for CCTM Phase 2B.2
/// 
/// Provides analysis of JavaScript projects including package.json parsing,
/// framework detection (React, Vue, Node.js), and build system identification

use std::path::Path;
use tokio::fs;
use anyhow::{Result, Error};
use async_trait::async_trait;

use super::{LanguageAnalyzer, LanguageAnalysisResult};
use crate::file_system::project_detector::{
    Language, ModuleType, FrameworkInfo, Command, Capability
};

/// JavaScript project analyzer
#[derive(Debug)]
pub struct JavaScriptAnalyzer {}

impl JavaScriptAnalyzer {
    pub fn new() -> Self {
        JavaScriptAnalyzer {}
    }
    
    /// Analyze package.json for JavaScript-related information
    async fn analyze_package_json(&self, package_path: &Path) -> Result<Option<PackageAnalysis>> {
        if !package_path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(package_path).await?;
        let package_json: serde_json::Value = serde_json::from_str(&content)?;
        
        let name = package_json.get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        
        let version = package_json.get("version")
            .and_then(|v| v.as_str())
            .unwrap_or("0.0.0")
            .to_string();
        
        let module_type = package_json.get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("commonjs")
            .to_string();
        
        let main_file = package_json.get("main")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // Extract dependencies
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        
        if let Some(deps) = package_json.get("dependencies").and_then(|d| d.as_object()) {
            for (name, _) in deps {
                dependencies.push(name.clone());
            }
        }
        
        if let Some(dev_deps) = package_json.get("devDependencies").and_then(|d| d.as_object()) {
            for (name, _) in dev_deps {
                dev_dependencies.push(name.clone());
            }
        }
        
        // Extract npm scripts
        let mut scripts = Vec::new();
        if let Some(script_obj) = package_json.get("scripts").and_then(|s| s.as_object()) {
            for (name, _) in script_obj {
                scripts.push(name.clone());
            }
        }
        
        Ok(Some(PackageAnalysis {
            name,
            version,
            module_type,
            main_file,
            dependencies,
            dev_dependencies,
            scripts,
        }))
    }
    
    /// Detect JavaScript frameworks based on dependencies and file structure
    fn detect_frameworks(&self, package_analysis: &PackageAnalysis, root_path: &Path) -> Vec<FrameworkInfo> {
        let mut frameworks = Vec::new();
        let deps = &package_analysis.dependencies;
        let dev_deps = &package_analysis.dev_dependencies;
        let all_deps: Vec<String> = deps.iter().chain(dev_deps.iter()).cloned().collect();
        
        // React detection (without TypeScript)
        if all_deps.contains(&"react".to_string()) && !self.has_typescript_config(root_path) {
            frameworks.push(FrameworkInfo {
                name: "React".to_string(),
                version: Some("18+".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "start".to_string(),
                        description: "Start React development server".to_string(),
                        command: "npm start".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "build".to_string(),
                        description: "Build for production".to_string(),
                        command: "npm run build".to_string(),
                        when_to_use: "For production deployment".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Vue.js detection
        if all_deps.contains(&"vue".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Vue.js".to_string(),
                version: Some("3+".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "dev".to_string(),
                        description: "Start Vue development server".to_string(),
                        command: "npm run dev".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "build".to_string(),
                        description: "Build for production".to_string(),
                        command: "npm run build".to_string(),
                        when_to_use: "For production deployment".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Express.js detection (Node.js backend)
        if all_deps.contains(&"express".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Express.js".to_string(),
                version: Some("4+".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::APIServer,
                    Capability::WebDevelopment,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "start".to_string(),
                        description: "Start Express server".to_string(),
                        command: "npm start".to_string(),
                        when_to_use: "To run the server".to_string(),
                    },
                    Command {
                        name: "dev".to_string(),
                        description: "Start with nodemon for development".to_string(),
                        command: "npm run dev".to_string(),
                        when_to_use: "During development for auto-restart".to_string(),
                    },
                ],
                confidence: 0.85,
            });
        }
        
        // Next.js detection
        if all_deps.contains(&"next".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Next.js".to_string(),
                version: Some("13+".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Routing,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "dev".to_string(),
                        description: "Start Next.js development server".to_string(),
                        command: "npm run dev".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "build".to_string(),
                        description: "Build for production".to_string(),
                        command: "npm run build".to_string(),
                        when_to_use: "For production deployment".to_string(),
                    },
                    Command {
                        name: "start".to_string(),
                        description: "Start production server".to_string(),
                        command: "npm start".to_string(),
                        when_to_use: "To serve production build".to_string(),
                    },
                ],
                confidence: 0.95,
            });
        }
        
        // Svelte detection
        if all_deps.contains(&"svelte".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Svelte".to_string(),
                version: Some("4+".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "dev".to_string(),
                        description: "Start Svelte development server".to_string(),
                        command: "npm run dev".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Electron detection
        if all_deps.contains(&"electron".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Electron".to_string(),
                version: Some("latest".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::DesktopApp,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "electron".to_string(),
                        description: "Start Electron application".to_string(),
                        command: "npm run electron".to_string(),
                        when_to_use: "To run the desktop app".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Generic Node.js project (if no other framework detected)
        if frameworks.is_empty() && self.is_node_project(&package_analysis) {
            frameworks.push(FrameworkInfo {
                name: "Node.js".to_string(),
                version: None,
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::Building,
                    Capability::Testing,
                ],
                suggested_commands: vec![
                    Command {
                        name: "start".to_string(),
                        description: "Start the application".to_string(),
                        command: "npm start".to_string(),
                        when_to_use: "To run the application".to_string(),
                    },
                    Command {
                        name: "test".to_string(),
                        description: "Run tests".to_string(),
                        command: "npm test".to_string(),
                        when_to_use: "To run test suite".to_string(),
                    },
                ],
                confidence: 0.7,
            });
        }
        
        frameworks
    }
    
    /// Check if this is a Node.js project
    fn is_node_project(&self, package_analysis: &PackageAnalysis) -> bool {
        // Check for Node.js indicators
        package_analysis.scripts.contains(&"start".to_string()) ||
        package_analysis.main_file.is_some() ||
        package_analysis.dependencies.iter().any(|dep| {
            matches!(dep.as_str(), "express" | "koa" | "fastify" | "hapi")
        })
    }
    
    /// Check if TypeScript is configured (to avoid duplicate detection)
    fn has_typescript_config(&self, root_path: &Path) -> bool {
        root_path.join("tsconfig.json").exists()
    }
    
    /// Determine module type from package.json and file structure
    fn determine_module_type(&self, package_analysis: &PackageAnalysis) -> ModuleType {
        match package_analysis.module_type.as_str() {
            "module" => ModuleType::ESModule,
            "commonjs" => ModuleType::CommonJS,
            _ => {
                // Try to infer from file extensions or dependencies
                if package_analysis.dependencies.iter()
                    .any(|dep| matches!(dep.as_str(), "esm" | "@babel/preset-env")) {
                    ModuleType::ESModule
                } else {
                    ModuleType::CommonJS
                }
            }
        }
    }
}

#[async_trait]
impl LanguageAnalyzer for JavaScriptAnalyzer {
    async fn can_analyze(&self, root_path: &Path) -> bool {
        // Check for JavaScript indicators
        let has_package_json = root_path.join("package.json").exists();
        let has_js_files = self.has_javascript_files(root_path).await;
        
        // Must have either package.json OR JavaScript files
        // But prefer not to analyze if TypeScript is the primary language
        has_package_json || (has_js_files && !self.has_typescript_config(root_path))
    }
    
    async fn analyze(&self, root_path: &Path) -> Result<LanguageAnalysisResult> {
        let package_path = root_path.join("package.json");
        
        // Analyze package.json if present
        let package_analysis = self.analyze_package_json(&package_path).await?;
        
        // Determine module type
        let module_type = if let Some(pkg) = &package_analysis {
            self.determine_module_type(pkg)
        } else {
            ModuleType::Unknown
        };
        
        // Create language information
        let language = Language::JavaScript {
            node_version: None, // Could detect from .nvmrc or package.json engines
            module_type,
        };
        
        // Detect frameworks
        let frameworks = if let Some(pkg) = &package_analysis {
            self.detect_frameworks(pkg, root_path)
        } else {
            vec![]
        };
        
        // Calculate confidence
        let confidence = if package_analysis.is_some() {
            0.85
        } else if self.has_javascript_files(root_path).await {
            0.6
        } else {
            0.3
        };
        
        // Generate analysis notes
        let mut analysis_notes = Vec::new();
        if let Some(pkg) = &package_analysis {
            analysis_notes.push(format!("JavaScript project: {}", pkg.name));
            analysis_notes.push(format!("Module type: {}", pkg.module_type));
            analysis_notes.push(format!("Dependencies: {}", pkg.dependencies.len()));
            analysis_notes.push(format!("Scripts: {}", pkg.scripts.len()));
        } else {
            analysis_notes.push("JavaScript files detected without package.json".to_string());
        }
        
        Ok(LanguageAnalysisResult {
            language,
            frameworks,
            confidence,
            analysis_notes,
        })
    }
    
    fn confidence_score(&self, root_path: &Path) -> f64 {
        let has_package_json = root_path.join("package.json").exists();
        let has_js_files = tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(self.has_javascript_files(root_path))
        });
        let has_typescript = self.has_typescript_config(root_path);
        
        if has_package_json && has_js_files && !has_typescript {
            0.9
        } else if has_package_json && !has_typescript {
            0.8
        } else if has_js_files && !has_typescript {
            0.6
        } else if has_package_json {
            0.4 // Lower confidence if TypeScript is present
        } else {
            0.0
        }
    }
    
    fn language_name(&self) -> &'static str {
        "JavaScript"
    }
}

impl JavaScriptAnalyzer {
    async fn has_javascript_files(&self, root_path: &Path) -> bool {
        // Quick check for .js, .jsx, .mjs, .cjs files
        if let Ok(mut entries) = fs::read_dir(root_path).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                if let Some(extension) = entry.path().extension().and_then(|e| e.to_str()) {
                    if matches!(extension, "js" | "jsx" | "mjs" | "cjs") {
                        return true;
                    }
                }
            }
        }
        false
    }
}

#[derive(Debug, Clone)]
struct PackageAnalysis {
    name: String,
    version: String,
    module_type: String,
    main_file: Option<String>,
    dependencies: Vec<String>,
    dev_dependencies: Vec<String>,
    scripts: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_javascript_analyzer_creation() {
        let analyzer = JavaScriptAnalyzer::new();
        assert_eq!(analyzer.language_name(), "JavaScript");
    }
    
    #[tokio::test]
    async fn test_can_analyze_with_package_json() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = JavaScriptAnalyzer::new();
        
        // Without package.json
        assert!(!analyzer.can_analyze(temp_dir.path()).await);
        
        // With package.json
        fs::write(
            temp_dir.path().join("package.json"),
            r#"{
  "name": "test-project",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}"#
        ).await.unwrap();
        
        assert!(analyzer.can_analyze(temp_dir.path()).await);
    }
    
    #[tokio::test]
    async fn test_can_analyze_with_js_files() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = JavaScriptAnalyzer::new();
        
        // Create JavaScript file
        fs::write(
            temp_dir.path().join("app.js"),
            "console.log('Hello, world!');"
        ).await.unwrap();
        
        assert!(analyzer.can_analyze(temp_dir.path()).await);
    }
    
    #[tokio::test]
    async fn test_react_project_detection() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = JavaScriptAnalyzer::new();
        
        // Create React package.json
        fs::write(
            temp_dir.path().join("package.json"),
            r#"{
  "name": "react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}"#
        ).await.unwrap();
        
        let result = analyzer.analyze(temp_dir.path()).await.unwrap();
        
        assert!(matches!(result.language, Language::JavaScript { .. }));
        assert!(!result.frameworks.is_empty());
        assert_eq!(result.frameworks[0].name, "React");
        assert!(result.confidence > 0.8);
    }
}