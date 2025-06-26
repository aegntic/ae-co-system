/// TypeScript Language Analyzer for CCTM Phase 2B.2
/// 
/// Provides analysis of TypeScript projects including tsconfig.json parsing,
/// framework detection (React, Vue, Angular), and build system identification

use std::path::Path;
use tokio::fs;
use anyhow::{Result, Error};
use async_trait::async_trait;

use super::{LanguageAnalyzer, LanguageAnalysisResult};
use crate::file_system::project_detector::{
    Language, ModuleType, FrameworkInfo, Command, Capability
};

/// TypeScript project analyzer
#[derive(Debug)]
pub struct TypeScriptAnalyzer {}

impl TypeScriptAnalyzer {
    pub fn new() -> Self {
        TypeScriptAnalyzer {}
    }
    
    /// Analyze package.json for TypeScript-related information
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
        
        Ok(Some(PackageAnalysis {
            name,
            version,
            dependencies,
            dev_dependencies,
        }))
    }
    
    /// Analyze tsconfig.json for TypeScript configuration
    async fn analyze_tsconfig(&self, tsconfig_path: &Path) -> Result<Option<TsConfigAnalysis>> {
        if !tsconfig_path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(tsconfig_path).await?;
        let tsconfig: serde_json::Value = serde_json::from_str(&content)?;
        
        let compiler_options = tsconfig.get("compilerOptions");
        
        let strict = compiler_options
            .and_then(|co| co.get("strict"))
            .and_then(|s| s.as_bool())
            .unwrap_or(false);
        
        let target = compiler_options
            .and_then(|co| co.get("target"))
            .and_then(|t| t.as_str())
            .unwrap_or("ES5")
            .to_string();
        
        let module = compiler_options
            .and_then(|co| co.get("module"))
            .and_then(|m| m.as_str())
            .unwrap_or("CommonJS")
            .to_string();
        
        Ok(Some(TsConfigAnalysis {
            strict,
            target,
            module,
        }))
    }
    
    /// Detect TypeScript framework based on dependencies
    fn detect_frameworks(&self, package_analysis: &PackageAnalysis) -> Vec<FrameworkInfo> {
        let mut frameworks = Vec::new();
        let deps = &package_analysis.dependencies;
        let dev_deps = &package_analysis.dev_dependencies;
        
        // React detection
        if deps.contains(&"react".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "React".to_string(),
                version: Some("18+".to_string()), // Simplified
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "start".to_string(),
                        description: "Start development server".to_string(),
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
        
        // Vue detection
        if deps.contains(&"vue".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Vue".to_string(),
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
                        description: "Start development server".to_string(),
                        command: "npm run dev".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Angular detection
        if deps.contains(&"@angular/core".to_string()) {
            frameworks.push(FrameworkInfo {
                name: "Angular".to_string(),
                version: Some("latest".to_string()),
                config_path: std::path::PathBuf::from("package.json"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::StateManagement,
                    Capability::Routing,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "serve".to_string(),
                        description: "Start development server".to_string(),
                        command: "ng serve".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "build".to_string(),
                        description: "Build for production".to_string(),
                        command: "ng build".to_string(),
                        when_to_use: "For production deployment".to_string(),
                    },
                ],
                confidence: 0.95,
            });
        }
        
        frameworks
    }
}

#[async_trait]
impl LanguageAnalyzer for TypeScriptAnalyzer {
    async fn can_analyze(&self, root_path: &Path) -> bool {
        // Check for TypeScript indicators
        root_path.join("tsconfig.json").exists() ||
        root_path.join("package.json").exists() && self.has_typescript_files(root_path).await
    }
    
    async fn analyze(&self, root_path: &Path) -> Result<LanguageAnalysisResult> {
        let tsconfig_path = root_path.join("tsconfig.json");
        let package_path = root_path.join("package.json");
        
        // Analyze configuration files
        let tsconfig_analysis = self.analyze_tsconfig(&tsconfig_path).await?;
        let package_analysis = self.analyze_package_json(&package_path).await?;
        
        // Determine module type
        let module_type = if let Some(tsconfig) = &tsconfig_analysis {
            match tsconfig.module.as_str() {
                "CommonJS" => ModuleType::CommonJS,
                "ES6" | "ES2015" | "ES2020" | "ESNext" => ModuleType::ESModule,
                _ => ModuleType::Mixed,
            }
        } else {
            ModuleType::Unknown
        };
        
        // Create language information
        let language = Language::TypeScript {
            version: None, // Could extract from package.json
            strict: tsconfig_analysis.as_ref().map(|ts| ts.strict).unwrap_or(false),
            node_version: None, // Could detect from .nvmrc or package.json engines
        };
        
        // Detect frameworks
        let frameworks = if let Some(pkg) = &package_analysis {
            self.detect_frameworks(pkg)
        } else {
            vec![]
        };
        
        // Calculate confidence
        let confidence = if tsconfig_analysis.is_some() && package_analysis.is_some() {
            0.95
        } else if tsconfig_analysis.is_some() || package_analysis.is_some() {
            0.8
        } else {
            0.6
        };
        
        // Generate analysis notes
        let mut analysis_notes = Vec::new();
        if let Some(pkg) = &package_analysis {
            analysis_notes.push(format!("TypeScript project: {}", pkg.name));
            analysis_notes.push(format!("Dependencies: {}", pkg.dependencies.len()));
        }
        if let Some(tsconfig) = &tsconfig_analysis {
            analysis_notes.push(format!("Strict mode: {}", tsconfig.strict));
            analysis_notes.push(format!("Target: {}", tsconfig.target));
        }
        
        Ok(LanguageAnalysisResult {
            language,
            frameworks,
            confidence,
            analysis_notes,
        })
    }
    
    fn confidence_score(&self, root_path: &Path) -> f64 {
        let has_tsconfig = root_path.join("tsconfig.json").exists();
        let has_package_json = root_path.join("package.json").exists();
        
        if has_tsconfig && has_package_json {
            0.95
        } else if has_tsconfig {
            0.85
        } else if has_package_json {
            0.5 // Lower confidence without tsconfig
        } else {
            0.0
        }
    }
    
    fn language_name(&self) -> &'static str {
        "TypeScript"
    }
}

impl TypeScriptAnalyzer {
    async fn has_typescript_files(&self, root_path: &Path) -> bool {
        // Quick check for .ts or .tsx files
        if let Ok(mut entries) = fs::read_dir(root_path).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                if let Some(extension) = entry.path().extension().and_then(|e| e.to_str()) {
                    if matches!(extension, "ts" | "tsx") {
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
    dependencies: Vec<String>,
    dev_dependencies: Vec<String>,
}

#[derive(Debug, Clone)]
struct TsConfigAnalysis {
    strict: bool,
    target: String,
    module: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_typescript_analyzer_creation() {
        let analyzer = TypeScriptAnalyzer::new();
        assert_eq!(analyzer.language_name(), "TypeScript");
    }
    
    #[tokio::test]
    async fn test_can_analyze_with_tsconfig() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = TypeScriptAnalyzer::new();
        
        // Without tsconfig.json
        assert!(!analyzer.can_analyze(temp_dir.path()).await);
        
        // With tsconfig.json
        fs::write(
            temp_dir.path().join("tsconfig.json"),
            r#"{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true
  }
}"#
        ).await.unwrap();
        
        assert!(analyzer.can_analyze(temp_dir.path()).await);
    }
}