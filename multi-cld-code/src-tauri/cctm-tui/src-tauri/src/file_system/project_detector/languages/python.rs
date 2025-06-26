/// Python Language Analyzer for CCTM Phase 2B.2
/// 
/// Provides comprehensive analysis of Python projects including pyproject.toml/requirements.txt parsing,
/// framework detection (Django, Flask, FastAPI), and virtual environment identification

use std::path::Path;
use tokio::fs;
use anyhow::{Result, Error};
use async_trait::async_trait;

use super::{LanguageAnalyzer, LanguageAnalysisResult};
use crate::file_system::project_detector::{
    Language, FrameworkInfo, Command, Capability
};

/// Python project analyzer
#[derive(Debug)]
pub struct PythonAnalyzer {}

impl PythonAnalyzer {
    pub fn new() -> Self {
        PythonAnalyzer {}
    }
    
    /// Analyze pyproject.toml for modern Python project configuration
    async fn analyze_pyproject_toml(&self, pyproject_path: &Path) -> Result<Option<PyProjectAnalysis>> {
        if !pyproject_path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(pyproject_path).await?;
        let pyproject: toml::Value = toml::from_str(&content)?;
        
        let mut name = "unknown".to_string();
        let mut version = "0.0.0".to_string();
        let mut description = None;
        let mut dependencies = Vec::new();
        let mut dev_dependencies = Vec::new();
        
        // Parse [project] section (PEP 621)
        if let Some(project) = pyproject.get("project") {
            if let Some(proj_name) = project.get("name").and_then(|v| v.as_str()) {
                name = proj_name.to_string();
            }
            
            if let Some(proj_version) = project.get("version").and_then(|v| v.as_str()) {
                version = proj_version.to_string();
            }
            
            if let Some(proj_desc) = project.get("description").and_then(|v| v.as_str()) {
                description = Some(proj_desc.to_string());
            }
            
            // Parse dependencies
            if let Some(deps) = project.get("dependencies").and_then(|d| d.as_array()) {
                for dep in deps {
                    if let Some(dep_str) = dep.as_str() {
                        let (dep_name, _) = self.parse_python_dependency(dep_str);
                        dependencies.push(dep_name);
                    }
                }
            }
            
            // Parse optional dependencies (dev, test, etc.)
            if let Some(optional_deps) = project.get("optional-dependencies").and_then(|d| d.as_table()) {
                for (group, deps) in optional_deps {
                    if let Some(deps_array) = deps.as_array() {
                        for dep in deps_array {
                            if let Some(dep_str) = dep.as_str() {
                                let (dep_name, _) = self.parse_python_dependency(dep_str);
                                dev_dependencies.push(format!("{}:{}", group, dep_name));
                            }
                        }
                    }
                }
            }
        }
        
        // Parse [tool.poetry] section if using Poetry
        if let Some(tool) = pyproject.get("tool") {
            if let Some(poetry) = tool.get("poetry") {
                if let Some(poetry_name) = poetry.get("name").and_then(|v| v.as_str()) {
                    name = poetry_name.to_string();
                }
                
                if let Some(poetry_version) = poetry.get("version").and_then(|v| v.as_str()) {
                    version = poetry_version.to_string();
                }
                
                // Poetry dependencies
                if let Some(deps) = poetry.get("dependencies").and_then(|d| d.as_table()) {
                    for (dep_name, _) in deps {
                        if dep_name != "python" {
                            dependencies.push(dep_name.clone());
                        }
                    }
                }
                
                if let Some(dev_deps) = poetry.get("group").and_then(|g| g.as_table()) {
                    for (group_name, group_data) in dev_deps {
                        if let Some(group_deps) = group_data.get("dependencies").and_then(|d| d.as_table()) {
                            for (dep_name, _) in group_deps {
                                dev_dependencies.push(format!("{}:{}", group_name, dep_name));
                            }
                        }
                    }
                }
            }
        }
        
        Ok(Some(PyProjectAnalysis {
            name,
            version,
            description,
            dependencies,
            dev_dependencies,
            has_poetry: pyproject.get("tool").and_then(|t| t.get("poetry")).is_some(),
        }))
    }
    
    /// Analyze requirements.txt for traditional Python dependency management
    async fn analyze_requirements_txt(&self, requirements_path: &Path) -> Result<Option<RequirementsAnalysis>> {
        if !requirements_path.exists() {
            return Ok(None);
        }
        
        let content = fs::read_to_string(requirements_path).await?;
        let mut dependencies = Vec::new();
        
        for line in content.lines() {
            let line = line.trim();
            if !line.is_empty() && !line.starts_with('#') && !line.starts_with('-') {
                let (dep_name, version) = self.parse_python_dependency(line);
                dependencies.push(PythonDependency {
                    name: dep_name,
                    version,
                });
            }
        }
        
        Ok(Some(RequirementsAnalysis {
            dependencies,
        }))
    }
    
    /// Detect Python frameworks based on dependencies
    fn detect_frameworks(&self, dependencies: &[String], root_path: &Path) -> Vec<FrameworkInfo> {
        let mut frameworks = Vec::new();
        
        // Django detection
        if dependencies.iter().any(|dep| dep.contains("django") || dep.contains("Django")) {
            frameworks.push(FrameworkInfo {
                name: "Django".to_string(),
                version: Some("4+".to_string()),
                config_path: root_path.join("manage.py"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::APIServer,
                    Capability::DatabaseIntegration,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "runserver".to_string(),
                        description: "Start Django development server".to_string(),
                        command: "python manage.py runserver".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "migrate".to_string(),
                        description: "Apply database migrations".to_string(),
                        command: "python manage.py migrate".to_string(),
                        when_to_use: "After model changes".to_string(),
                    },
                    Command {
                        name: "test".to_string(),
                        description: "Run Django tests".to_string(),
                        command: "python manage.py test".to_string(),
                        when_to_use: "To run test suite".to_string(),
                    },
                ],
                confidence: 0.95,
            });
        }
        
        // Flask detection
        if dependencies.iter().any(|dep| dep.contains("flask") || dep.contains("Flask")) {
            frameworks.push(FrameworkInfo {
                name: "Flask".to_string(),
                version: Some("2+".to_string()),
                config_path: root_path.join("app.py"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::APIServer,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "run".to_string(),
                        description: "Start Flask development server".to_string(),
                        command: "flask run".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "shell".to_string(),
                        description: "Start Flask shell".to_string(),
                        command: "flask shell".to_string(),
                        when_to_use: "For interactive debugging".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // FastAPI detection
        if dependencies.iter().any(|dep| dep.contains("fastapi")) {
            frameworks.push(FrameworkInfo {
                name: "FastAPI".to_string(),
                version: Some("0.100+".to_string()),
                config_path: root_path.join("main.py"),
                capabilities: vec![
                    Capability::APIServer,
                    Capability::WebDevelopment,
                    Capability::Building,
                ],
                suggested_commands: vec![
                    Command {
                        name: "dev".to_string(),
                        description: "Start FastAPI with auto-reload".to_string(),
                        command: "uvicorn main:app --reload".to_string(),
                        when_to_use: "During development".to_string(),
                    },
                    Command {
                        name: "start".to_string(),
                        description: "Start FastAPI production server".to_string(),
                        command: "uvicorn main:app".to_string(),
                        when_to_use: "For production".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Streamlit detection
        if dependencies.iter().any(|dep| dep.contains("streamlit")) {
            frameworks.push(FrameworkInfo {
                name: "Streamlit".to_string(),
                version: Some("1+".to_string()),
                config_path: root_path.join("streamlit_app.py"),
                capabilities: vec![
                    Capability::WebDevelopment,
                    Capability::DataVisualization,
                ],
                suggested_commands: vec![
                    Command {
                        name: "run".to_string(),
                        description: "Start Streamlit app".to_string(),
                        command: "streamlit run app.py".to_string(),
                        when_to_use: "To run the web app".to_string(),
                    },
                ],
                confidence: 0.9,
            });
        }
        
        // Jupyter detection
        if dependencies.iter().any(|dep| dep.contains("jupyter") || dep.contains("ipython")) {
            frameworks.push(FrameworkInfo {
                name: "Jupyter".to_string(),
                version: None,
                config_path: root_path.to_path_buf(),
                capabilities: vec![
                    Capability::DataAnalysis,
                    Capability::DataVisualization,
                ],
                suggested_commands: vec![
                    Command {
                        name: "notebook".to_string(),
                        description: "Start Jupyter Notebook".to_string(),
                        command: "jupyter notebook".to_string(),
                        when_to_use: "For interactive data analysis".to_string(),
                    },
                    Command {
                        name: "lab".to_string(),
                        description: "Start JupyterLab".to_string(),
                        command: "jupyter lab".to_string(),
                        when_to_use: "For advanced notebook interface".to_string(),
                    },
                ],
                confidence: 0.85,
            });
        }
        
        // Pytest detection
        if dependencies.iter().any(|dep| dep.contains("pytest")) {
            frameworks.push(FrameworkInfo {
                name: "Pytest".to_string(),
                version: None,
                config_path: root_path.join("pytest.ini"),
                capabilities: vec![
                    Capability::Testing,
                ],
                suggested_commands: vec![
                    Command {
                        name: "test".to_string(),
                        description: "Run tests with pytest".to_string(),
                        command: "pytest".to_string(),
                        when_to_use: "To run test suite".to_string(),
                    },
                    Command {
                        name: "test-verbose".to_string(),
                        description: "Run tests with verbose output".to_string(),
                        command: "pytest -v".to_string(),
                        when_to_use: "For detailed test output".to_string(),
                    },
                ],
                confidence: 0.8,
            });
        }
        
        frameworks
    }
    
    /// Detect virtual environment
    async fn detect_virtual_env(&self, root_path: &Path) -> Option<String> {
        let venv_indicators = ["venv", ".venv", "env", ".env", "virtualenv"];
        
        for indicator in &venv_indicators {
            let venv_path = root_path.join(indicator);
            if venv_path.exists() && venv_path.is_dir() {
                return Some(indicator.to_string());
            }
        }
        
        // Check for conda environment
        if root_path.join("environment.yml").exists() || 
           root_path.join("conda-env.yml").exists() {
            return Some("conda".to_string());
        }
        
        // Check for pipenv
        if root_path.join("Pipfile").exists() {
            return Some("pipenv".to_string());
        }
        
        None
    }
    
    /// Parse Python dependency string (e.g., "requests>=2.28.0")
    fn parse_python_dependency(&self, dep_str: &str) -> (String, String) {
        let operators = [">=", "<=", "==", "!=", ">", "<", "~=", "^"];
        
        for op in &operators {
            if let Some(pos) = dep_str.find(op) {
                let name = dep_str[..pos].trim().to_string();
                let version = dep_str[pos + op.len()..].trim().to_string();
                return (name, version);
            }
        }
        
        // Handle extras (e.g., "requests[security]")
        if let Some(bracket_pos) = dep_str.find('[') {
            let name = dep_str[..bracket_pos].trim().to_string();
            return (name, "*".to_string());
        }
        
        // No version specified
        (dep_str.trim().to_string(), "*".to_string())
    }
    
    /// Detect Python version from various sources
    async fn detect_python_version(&self, root_path: &Path) -> Option<String> {
        // Check .python-version (pyenv)
        if let Ok(content) = fs::read_to_string(root_path.join(".python-version")).await {
            return Some(content.trim().to_string());
        }
        
        // Check runtime.txt (Heroku style)
        if let Ok(content) = fs::read_to_string(root_path.join("runtime.txt")).await {
            if let Some(version) = content.trim().strip_prefix("python-") {
                return Some(version.to_string());
            }
        }
        
        // Check pyproject.toml for python requirement
        if let Ok(content) = fs::read_to_string(root_path.join("pyproject.toml")).await {
            if let Ok(pyproject) = toml::from_str::<toml::Value>(&content) {
                if let Some(requires_python) = pyproject
                    .get("project")
                    .and_then(|p| p.get("requires-python"))
                    .and_then(|v| v.as_str()) {
                    return Some(requires_python.to_string());
                }
            }
        }
        
        None
    }
}

#[async_trait]
impl LanguageAnalyzer for PythonAnalyzer {
    async fn can_analyze(&self, root_path: &Path) -> bool {
        // Check for Python indicators
        root_path.join("pyproject.toml").exists() ||
        root_path.join("requirements.txt").exists() ||
        root_path.join("setup.py").exists() ||
        root_path.join("Pipfile").exists() ||
        self.has_python_files(root_path).await
    }
    
    async fn analyze(&self, root_path: &Path) -> Result<LanguageAnalysisResult> {
        // Analyze configuration files
        let pyproject_analysis = self.analyze_pyproject_toml(&root_path.join("pyproject.toml")).await?;
        let requirements_analysis = self.analyze_requirements_txt(&root_path.join("requirements.txt")).await?;
        
        // Collect all dependencies
        let mut all_dependencies = Vec::new();
        
        if let Some(pyproject) = &pyproject_analysis {
            all_dependencies.extend(pyproject.dependencies.clone());
        }
        
        if let Some(requirements) = &requirements_analysis {
            for dep in &requirements.dependencies {
                all_dependencies.push(dep.name.clone());
            }
        }
        
        // Detect virtual environment
        let virtual_env = self.detect_virtual_env(root_path).await;
        
        // Detect Python version
        let python_version = self.detect_python_version(root_path).await;
        
        // Create language information
        let language = Language::Python {
            version: python_version,
            virtual_env,
        };
        
        // Detect frameworks
        let frameworks = self.detect_frameworks(&all_dependencies, root_path);
        
        // Calculate confidence
        let confidence = if pyproject_analysis.is_some() {
            0.95
        } else if requirements_analysis.is_some() {
            0.85
        } else if self.has_python_files(root_path).await {
            0.7
        } else {
            0.5
        };
        
        // Generate analysis notes
        let mut analysis_notes = Vec::new();
        
        if let Some(pyproject) = &pyproject_analysis {
            analysis_notes.push(format!("Python project: {}", pyproject.name));
            analysis_notes.push(format!("Dependencies: {}", pyproject.dependencies.len()));
            if pyproject.has_poetry {
                analysis_notes.push("Uses Poetry for dependency management".to_string());
            }
        }
        
        if let Some(requirements) = &requirements_analysis {
            analysis_notes.push(format!("Requirements.txt dependencies: {}", requirements.dependencies.len()));
        }
        
        if let Some(venv) = &virtual_env {
            analysis_notes.push(format!("Virtual environment: {}", venv));
        }
        
        if frameworks.is_empty() {
            analysis_notes.push("Generic Python project".to_string());
        }
        
        Ok(LanguageAnalysisResult {
            language,
            frameworks,
            confidence,
            analysis_notes,
        })
    }
    
    fn confidence_score(&self, root_path: &Path) -> f64 {
        let has_pyproject = root_path.join("pyproject.toml").exists();
        let has_requirements = root_path.join("requirements.txt").exists();
        let has_setup_py = root_path.join("setup.py").exists();
        let has_python_files = tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(self.has_python_files(root_path))
        });
        
        if has_pyproject && has_python_files {
            0.95
        } else if has_pyproject {
            0.9
        } else if has_requirements && has_python_files {
            0.85
        } else if has_setup_py && has_python_files {
            0.8
        } else if has_python_files {
            0.7
        } else if has_requirements || has_setup_py {
            0.6
        } else {
            0.0
        }
    }
    
    fn language_name(&self) -> &'static str {
        "Python"
    }
}

impl PythonAnalyzer {
    async fn has_python_files(&self, root_path: &Path) -> bool {
        // Quick check for .py files
        if let Ok(mut entries) = fs::read_dir(root_path).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                if let Some(extension) = entry.path().extension().and_then(|e| e.to_str()) {
                    if matches!(extension, "py" | "pyw" | "pyi") {
                        return true;
                    }
                }
            }
        }
        false
    }
}

#[derive(Debug, Clone)]
struct PyProjectAnalysis {
    name: String,
    version: String,
    description: Option<String>,
    dependencies: Vec<String>,
    dev_dependencies: Vec<String>,
    has_poetry: bool,
}

#[derive(Debug, Clone)]
struct RequirementsAnalysis {
    dependencies: Vec<PythonDependency>,
}

#[derive(Debug, Clone)]
struct PythonDependency {
    name: String,
    version: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_python_analyzer_creation() {
        let analyzer = PythonAnalyzer::new();
        assert_eq!(analyzer.language_name(), "Python");
    }
    
    #[tokio::test]
    async fn test_can_analyze_with_pyproject_toml() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = PythonAnalyzer::new();
        
        // Without pyproject.toml
        assert!(!analyzer.can_analyze(temp_dir.path()).await);
        
        // With pyproject.toml
        fs::write(
            temp_dir.path().join("pyproject.toml"),
            r#"[project]
name = "test-project"
version = "0.1.0"
dependencies = ["requests", "fastapi"]
"#
        ).await.unwrap();
        
        assert!(analyzer.can_analyze(temp_dir.path()).await);
    }
    
    #[tokio::test]
    async fn test_django_project_detection() {
        let temp_dir = TempDir::new().unwrap();
        let analyzer = PythonAnalyzer::new();
        
        // Create Django requirements.txt
        fs::write(
            temp_dir.path().join("requirements.txt"),
            "Django>=4.0.0\npsycopg2-binary>=2.8.0\n"
        ).await.unwrap();
        
        // Create manage.py
        fs::write(
            temp_dir.path().join("manage.py"),
            "#!/usr/bin/env python\nimport django\n"
        ).await.unwrap();
        
        let result = analyzer.analyze(temp_dir.path()).await.unwrap();
        
        assert!(matches!(result.language, Language::Python { .. }));
        assert!(!result.frameworks.is_empty());
        assert_eq!(result.frameworks[0].name, "Django");
        assert!(result.confidence > 0.8);
    }
}