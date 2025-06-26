/// Background Analysis Engine for CCTM Phase 2B.2
/// 
/// Handles deep project analysis, dependency scanning, and structure mapping
/// with performance optimization and resource management

use std::path::{Path, PathBuf};
use std::collections::HashMap;
use tokio::fs;
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use super::{
    ProjectDetectorConfig, ProjectStructure, DependencyGraph, DependencyInfo,
    GitRepository, BuildSystem, FrameworkInfo, Command, Capability
};

/// Background analysis engine for deep project intelligence
#[derive(Debug)]
pub struct AnalysisEngine {
    config: ProjectDetectorConfig,
}

impl AnalysisEngine {
    /// Create a new analysis engine with configuration
    pub fn new(config: ProjectDetectorConfig) -> Self {
        AnalysisEngine { config }
    }
    
    /// Analyze project structure and generate comprehensive mapping
    pub async fn analyze_project_structure(&self, root_path: &Path) -> Result<ProjectStructure> {
        log::debug!("Analyzing project structure for: {}", root_path.display());
        
        let mut source_directories = Vec::new();
        let mut test_directories = Vec::new();
        let mut config_files = Vec::new();
        let mut documentation_files = Vec::new();
        let mut file_types = HashMap::new();
        let mut total_files = 0;
        let mut total_lines = 0;
        
        // Walk the directory tree
        let mut entries = fs::read_dir(root_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            let file_name = entry.file_name();
            
            if path.is_dir() {
                // Classify directories
                if let Some(name) = file_name.to_str() {
                    match name {
                        "src" | "lib" | "app" | "source" | "components" => {
                            source_directories.push(path.clone());
                        }
                        "test" | "tests" | "__tests__" | "spec" | "specs" => {
                            test_directories.push(path.clone());
                        }
                        "node_modules" | "target" | ".git" | "dist" | "build" => {
                            // Skip these directories
                            continue;
                        }
                        _ => {
                            // Recursively analyze subdirectories (with depth limit)
                            if self.should_analyze_directory(&path) {
                                let sub_structure = Box::pin(self.analyze_project_structure(&path)).await?;
                                source_directories.extend(sub_structure.source_directories);
                                test_directories.extend(sub_structure.test_directories);
                                config_files.extend(sub_structure.config_files);
                                documentation_files.extend(sub_structure.documentation_files);
                                total_files += sub_structure.total_files;
                                total_lines += sub_structure.total_lines;
                                
                                // Merge file type counts
                                for (ext, count) in sub_structure.file_types {
                                    *file_types.entry(ext).or_insert(0) += count;
                                }
                            }
                        }
                    }
                }
            } else if path.is_file() {
                total_files += 1;
                
                // Classify files
                if let Some(name) = file_name.to_str() {
                    // Check for configuration files
                    if self.is_config_file(name) {
                        config_files.push(path.clone());
                    }
                    
                    // Check for documentation files
                    if self.is_documentation_file(name) {
                        documentation_files.push(path.clone());
                    }
                    
                    // Count file types by extension
                    if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
                        *file_types.entry(extension.to_lowercase()).or_insert(0) += 1;
                        
                        // Count lines for source files
                        if self.is_source_file_extension(extension) {
                            if let Ok(line_count) = self.count_lines(&path).await {
                                total_lines += line_count;
                            }
                        }
                    }
                }
            }
            
            // Prevent analysis from taking too long
            if total_files > self.config.max_project_files {
                log::warn!("Project analysis stopped at {} files (limit reached)", total_files);
                break;
            }
        }
        
        Ok(ProjectStructure {
            source_directories,
            test_directories,
            config_files,
            documentation_files,
            total_files,
            total_lines,
            file_types,
        })
    }
    
    /// Analyze project dependencies from various configuration files
    pub async fn analyze_dependencies(&self, root_path: &Path) -> Result<DependencyGraph> {
        log::debug!("Analyzing dependencies for: {}", root_path.display());
        
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        let mut security_issues = Vec::new();
        
        // Check for different package manager files
        
        // Rust: Cargo.toml
        if let Ok(cargo_deps) = self.analyze_cargo_dependencies(root_path).await {
            dependencies.extend(cargo_deps.0);
            dev_dependencies.extend(cargo_deps.1);
        }
        
        // Node.js: package.json
        if let Ok(npm_deps) = self.analyze_npm_dependencies(root_path).await {
            dependencies.extend(npm_deps.0);
            dev_dependencies.extend(npm_deps.1);
        }
        
        // Python: pyproject.toml, requirements.txt
        if let Ok(python_deps) = self.analyze_python_dependencies(root_path).await {
            dependencies.extend(python_deps.0);
            dev_dependencies.extend(python_deps.1);
        }
        
        let total_count = dependencies.len() + dev_dependencies.len();
        let outdated_count = 0; // TODO: Implement version checking
        
        Ok(DependencyGraph {
            dependencies,
            dev_dependencies,
            total_count,
            outdated_count,
            security_issues,
            last_updated: Utc::now(),
        })
    }
    
    /// Analyze Git repository information
    pub async fn analyze_git_repository(&self, root_path: &Path) -> Result<Option<GitRepository>> {
        if !self.config.enable_git_analysis {
            return Ok(None);
        }
        
        log::debug!("Analyzing Git repository for: {}", root_path.display());
        
        // Check if this is a Git repository
        let git_dir = root_path.join(".git");
        if !git_dir.exists() {
            return Ok(None);
        }
        
        // Use git2 crate for repository analysis
        match git2::Repository::open(root_path) {
            Ok(repo) => {
                let current_branch = self.get_current_branch(&repo)?;
                let remote_url = self.get_remote_url(&repo);
                let (commits_ahead, commits_behind) = self.get_branch_status(&repo)?;
                let has_uncommitted_changes = self.has_uncommitted_changes(&repo)?;
                let last_commit = self.get_last_commit_time(&repo)?;
                let contributors = self.get_contributors(&repo)?;
                
                Ok(Some(GitRepository {
                    current_branch,
                    remote_url,
                    commits_ahead,
                    commits_behind,
                    has_uncommitted_changes,
                    last_commit,
                    contributors,
                }))
            }
            Err(e) => {
                log::warn!("Failed to analyze Git repository: {}", e);
                Ok(None)
            }
        }
    }
    
    /// Detect build system from project files
    pub async fn detect_build_system(&self, root_path: &Path) -> Result<BuildSystem> {
        log::debug!("Detecting build system for: {}", root_path.display());
        
        // Check for Cargo.toml (Rust)
        if root_path.join("Cargo.toml").exists() {
            let target = self.get_cargo_target(root_path).await.ok();
            return Ok(BuildSystem::Cargo { target });
        }
        
        // Check for package.json (Node.js)
        if root_path.join("package.json").exists() {
            let scripts = self.get_npm_scripts(root_path).await.unwrap_or_default();
            
            // Determine package manager
            if root_path.join("bun.lockb").exists() {
                return Ok(BuildSystem::Bun { scripts });
            } else if root_path.join("yarn.lock").exists() {
                return Ok(BuildSystem::Yarn { scripts });
            } else {
                return Ok(BuildSystem::NPM { scripts });
            }
        }
        
        // Check for Vite
        if root_path.join("vite.config.js").exists() || root_path.join("vite.config.ts").exists() {
            let config_path = if root_path.join("vite.config.ts").exists() {
                Some(root_path.join("vite.config.ts"))
            } else {
                Some(root_path.join("vite.config.js"))
            };
            return Ok(BuildSystem::Vite { config: config_path });
        }
        
        // Check for Webpack
        if root_path.join("webpack.config.js").exists() {
            return Ok(BuildSystem::Webpack {
                config: Some(root_path.join("webpack.config.js"))
            });
        }
        
        // Check for Makefile
        if root_path.join("Makefile").exists() {
            let targets = self.get_make_targets(root_path).await.unwrap_or_default();
            return Ok(BuildSystem::Make { targets });
        }
        
        // Check for Docker
        let has_dockerfile = root_path.join("Dockerfile").exists();
        let has_compose = root_path.join("docker-compose.yml").exists() 
            || root_path.join("docker-compose.yaml").exists();
        
        if has_dockerfile || has_compose {
            return Ok(BuildSystem::Docker { compose: has_compose });
        }
        
        Ok(BuildSystem::Unknown)
    }
    
    // Private helper methods
    
    fn should_analyze_directory(&self, path: &Path) -> bool {
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            // Skip common directories that don't need analysis
            !matches!(name,
                "node_modules" | "target" | ".git" | "dist" | "build" | 
                ".next" | ".nuxt" | "coverage" | ".nyc_output" | "__pycache__" |
                ".pytest_cache" | ".venv" | "venv" | "env"
            )
        } else {
            false
        }
    }
    
    fn is_config_file(&self, filename: &str) -> bool {
        matches!(filename,
            "package.json" | "Cargo.toml" | "pyproject.toml" | "requirements.txt" |
            "tsconfig.json" | "webpack.config.js" | "vite.config.js" | "vite.config.ts" |
            ".eslintrc" | ".eslintrc.json" | ".prettierrc" | "babel.config.js" |
            "jest.config.js" | "vitest.config.ts" | ".gitignore" | "Dockerfile" |
            "docker-compose.yml" | "docker-compose.yaml" | "Makefile" | ".env"
        )
    }
    
    fn is_documentation_file(&self, filename: &str) -> bool {
        let lower = filename.to_lowercase();
        lower.starts_with("readme") || 
        lower.ends_with(".md") || 
        lower.ends_with(".rst") ||
        lower.ends_with(".txt") && (lower.contains("doc") || lower.contains("readme"))
    }
    
    fn is_source_file_extension(&self, extension: &str) -> bool {
        matches!(extension.to_lowercase().as_str(),
            "rs" | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "java" | "kt" |
            "swift" | "c" | "cpp" | "cc" | "cxx" | "h" | "hpp" | "cs" | "php" |
            "rb" | "scala" | "clj" | "hs" | "ml" | "elm" | "dart" | "vue" | "svelte"
        )
    }
    
    async fn count_lines(&self, file_path: &Path) -> Result<usize> {
        let content = fs::read_to_string(file_path).await?;
        Ok(content.lines().count())
    }
    
    // Dependency analysis methods
    
    async fn analyze_cargo_dependencies(&self, root_path: &Path) -> Result<(Vec<DependencyInfo>, Vec<DependencyInfo>)> {
        let cargo_path = root_path.join("Cargo.toml");
        if !cargo_path.exists() {
            return Ok((vec![], vec![]));
        }
        
        let content = fs::read_to_string(&cargo_path).await?;
        let cargo_toml: toml::Value = toml::from_str(&content)?;
        
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        
        // Parse dependencies
        if let Some(deps) = cargo_toml.get("dependencies").and_then(|d| d.as_table()) {
            for (name, value) in deps {
                let version = self.extract_version_from_toml_value(value);
                dependencies.push(DependencyInfo {
                    name: name.clone(),
                    version,
                    dev_dependency: false,
                    optional: false,
                    description: None,
                });
            }
        }
        
        // Parse dev-dependencies
        if let Some(dev_deps) = cargo_toml.get("dev-dependencies").and_then(|d| d.as_table()) {
            for (name, value) in dev_deps {
                let version = self.extract_version_from_toml_value(value);
                dev_dependencies.push(DependencyInfo {
                    name: name.clone(),
                    version,
                    dev_dependency: true,
                    optional: false,
                    description: None,
                });
            }
        }
        
        Ok((dependencies, dev_dependencies))
    }
    
    async fn analyze_npm_dependencies(&self, root_path: &Path) -> Result<(Vec<DependencyInfo>, Vec<DependencyInfo>)> {
        let package_path = root_path.join("package.json");
        if !package_path.exists() {
            return Ok((vec![], vec![]));
        }
        
        let content = fs::read_to_string(&package_path).await?;
        let package_json: serde_json::Value = serde_json::from_str(&content)?;
        
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        
        // Parse dependencies
        if let Some(deps) = package_json.get("dependencies").and_then(|d| d.as_object()) {
            for (name, value) in deps {
                if let Some(version) = value.as_str() {
                    dependencies.push(DependencyInfo {
                        name: name.clone(),
                        version: version.to_string(),
                        dev_dependency: false,
                        optional: false,
                        description: None,
                    });
                }
            }
        }
        
        // Parse devDependencies
        if let Some(dev_deps) = package_json.get("devDependencies").and_then(|d| d.as_object()) {
            for (name, value) in dev_deps {
                if let Some(version) = value.as_str() {
                    dev_dependencies.push(DependencyInfo {
                        name: name.clone(),
                        version: version.to_string(),
                        dev_dependency: true,
                        optional: false,
                        description: None,
                    });
                }
            }
        }
        
        Ok((dependencies, dev_dependencies))
    }
    
    async fn analyze_python_dependencies(&self, root_path: &Path) -> Result<(Vec<DependencyInfo>, Vec<DependencyInfo>)> {
        let mut dependencies = Vec::new();
        let dev_dependencies = Vec::new(); // Python doesn't typically separate dev deps in requirements.txt
        
        // Check pyproject.toml first
        let pyproject_path = root_path.join("pyproject.toml");
        if pyproject_path.exists() {
            let content = fs::read_to_string(&pyproject_path).await?;
            if let Ok(pyproject: toml::Value) = toml::from_str(&content) {
                if let Some(project) = pyproject.get("project") {
                    if let Some(deps) = project.get("dependencies").and_then(|d| d.as_array()) {
                        for dep in deps {
                            if let Some(dep_str) = dep.as_str() {
                                let (name, version) = self.parse_python_dependency(dep_str);
                                dependencies.push(DependencyInfo {
                                    name,
                                    version,
                                    dev_dependency: false,
                                    optional: false,
                                    description: None,
                                });
                            }
                        }
                    }
                }
            }
        } else {
            // Fall back to requirements.txt
            let requirements_path = root_path.join("requirements.txt");
            if requirements_path.exists() {
                let content = fs::read_to_string(&requirements_path).await?;
                for line in content.lines() {
                    let line = line.trim();
                    if !line.is_empty() && !line.starts_with('#') {
                        let (name, version) = self.parse_python_dependency(line);
                        dependencies.push(DependencyInfo {
                            name,
                            version,
                            dev_dependency: false,
                            optional: false,
                            description: None,
                        });
                    }
                }
            }
        }
        
        Ok((dependencies, dev_dependencies))
    }
    
    // Git analysis helper methods
    
    fn get_current_branch(&self, repo: &git2::Repository) -> Result<String> {
        let head = repo.head()?;
        if let Some(name) = head.shorthand() {
            Ok(name.to_string())
        } else {
            Ok("HEAD".to_string())
        }
    }
    
    fn get_remote_url(&self, repo: &git2::Repository) -> Option<String> {
        if let Ok(remotes) = repo.remotes() {
            if let Some(remote_name) = remotes.get(0) {
                if let Ok(remote) = repo.find_remote(remote_name) {
                    return remote.url().map(|s| s.to_string());
                }
            }
        }
        None
    }
    
    fn get_branch_status(&self, _repo: &git2::Repository) -> Result<(usize, usize)> {
        // Simplified implementation - would need more complex logic for real branch comparison
        Ok((0, 0))
    }
    
    fn has_uncommitted_changes(&self, repo: &git2::Repository) -> Result<bool> {
        let statuses = repo.statuses(None)?;
        Ok(!statuses.is_empty())
    }
    
    fn get_last_commit_time(&self, repo: &git2::Repository) -> Result<Option<DateTime<Utc>>> {
        if let Ok(head) = repo.head() {
            if let Ok(commit) = head.peel_to_commit() {
                let time = commit.time();
                let timestamp = time.seconds();
                if let Some(datetime) = DateTime::from_timestamp(timestamp, 0) {
                    return Ok(Some(datetime));
                }
            }
        }
        Ok(None)
    }
    
    fn get_contributors(&self, _repo: &git2::Repository) -> Result<Vec<String>> {
        // Simplified implementation - would need to walk commit history
        Ok(vec![])
    }
    
    // Build system helper methods
    
    async fn get_cargo_target(&self, root_path: &Path) -> Result<String> {
        let cargo_path = root_path.join("Cargo.toml");
        let content = fs::read_to_string(&cargo_path).await?;
        let cargo_toml: toml::Value = toml::from_str(&content)?;
        
        // Check if this is a binary or library
        if cargo_toml.get("bin").is_some() {
            Ok("binary".to_string())
        } else if cargo_toml.get("lib").is_some() {
            Ok("library".to_string())
        } else {
            Ok("unknown".to_string())
        }
    }
    
    async fn get_npm_scripts(&self, root_path: &Path) -> Result<Vec<String>> {
        let package_path = root_path.join("package.json");
        let content = fs::read_to_string(&package_path).await?;
        let package_json: serde_json::Value = serde_json::from_str(&content)?;
        
        let mut scripts = Vec::new();
        if let Some(script_obj) = package_json.get("scripts").and_then(|s| s.as_object()) {
            for (name, _) in script_obj {
                scripts.push(name.clone());
            }
        }
        
        Ok(scripts)
    }
    
    async fn get_make_targets(&self, root_path: &Path) -> Result<Vec<String>> {
        let makefile_path = root_path.join("Makefile");
        let content = fs::read_to_string(&makefile_path).await?;
        
        let mut targets = Vec::new();
        for line in content.lines() {
            if line.contains(':') && !line.starts_with('\t') && !line.starts_with(' ') {
                if let Some(target) = line.split(':').next() {
                    targets.push(target.trim().to_string());
                }
            }
        }
        
        Ok(targets)
    }
    
    // Utility methods
    
    fn extract_version_from_toml_value(&self, value: &toml::Value) -> String {
        match value {
            toml::Value::String(s) => s.clone(),
            toml::Value::Table(table) => {
                table.get("version")
                    .and_then(|v| v.as_str())
                    .unwrap_or("*")
                    .to_string()
            }
            _ => "*".to_string(),
        }
    }
    
    fn parse_python_dependency(&self, dep_str: &str) -> (String, String) {
        // Parse dependency strings like "requests>=2.28.0" or "django==4.0.0"
        let operators = [">=", "<=", "==", "!=", ">", "<", "~="];
        
        for op in &operators {
            if let Some(pos) = dep_str.find(op) {
                let name = dep_str[..pos].trim().to_string();
                let version = dep_str[pos + op.len()..].trim().to_string();
                return (name, version);
            }
        }
        
        // No version specified
        (dep_str.trim().to_string(), "*".to_string())
    }
}