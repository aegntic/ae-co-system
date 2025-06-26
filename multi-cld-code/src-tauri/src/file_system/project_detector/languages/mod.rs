/// Language Detection System for CCTM Phase 2B.2
/// 
/// Provides intelligent detection and analysis of programming languages
/// with confidence scoring and framework identification

pub mod rust;
pub mod typescript;
pub mod javascript;
pub mod python;

use std::path::Path;
use anyhow::Result;
use async_trait::async_trait;

use super::{Language, FrameworkInfo, ProjectDetectorConfig};

/// Trait for language-specific detection and analysis
#[async_trait]
pub trait LanguageAnalyzer: Send + Sync {
    /// Detect if this analyzer can handle the given project
    async fn can_analyze(&self, root_path: &Path) -> bool;
    
    /// Perform language-specific analysis
    async fn analyze(&self, root_path: &Path) -> Result<LanguageAnalysisResult>;
    
    /// Get confidence score for detection (0.0 to 1.0)
    fn confidence_score(&self, root_path: &Path) -> f64;
    
    /// Get language name for identification
    fn language_name(&self) -> &'static str;
}

/// Result of language-specific analysis
#[derive(Debug, Clone)]
pub struct LanguageAnalysisResult {
    pub language: Language,
    pub frameworks: Vec<FrameworkInfo>,
    pub confidence: f64,
    pub analysis_notes: Vec<String>,
}

/// Main language detection coordinator
#[derive(Debug)]
pub struct LanguageDetector {
    analyzers: Vec<Box<dyn LanguageAnalyzer>>,
}

impl LanguageDetector {
    /// Create a new language detector with all available analyzers
    pub fn new() -> Self {
        let analyzers: Vec<Box<dyn LanguageAnalyzer>> = vec![
            Box::new(rust::RustAnalyzer::new()),
            Box::new(typescript::TypeScriptAnalyzer::new()),
            Box::new(javascript::JavaScriptAnalyzer::new()),
            Box::new(python::PythonAnalyzer::new()),
        ];
        
        log::info!("LanguageDetector initialized with {} analyzers", analyzers.len());
        
        LanguageDetector { analyzers }
    }
    
    /// Detect the primary language for a project
    pub async fn detect_primary_language(&self, root_path: &Path) -> Result<Language> {
        log::debug!("Detecting primary language for: {}", root_path.display());
        
        let mut candidates = Vec::new();
        
        // Test each analyzer
        for analyzer in &self.analyzers {
            if analyzer.can_analyze(root_path).await {
                let confidence = analyzer.confidence_score(root_path);
                candidates.push((analyzer.as_ref(), confidence));
                
                log::debug!(
                    "Language candidate: {} (confidence: {:.2})",
                    analyzer.language_name(),
                    confidence
                );
            }
        }
        
        // Sort by confidence and select the best match
        candidates.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        if let Some((best_analyzer, confidence)) = candidates.first() {
            if *confidence > 0.5 {
                let result = best_analyzer.analyze(root_path).await?;
                log::info!(
                    "Detected primary language: {} (confidence: {:.2})",
                    best_analyzer.language_name(),
                    confidence
                );
                return Ok(result.language);
            }
        }
        
        // Fallback to basic file extension analysis
        log::debug!("Using fallback file extension analysis");
        self.detect_by_file_extensions(root_path).await
    }
    
    /// Analyze all detectable languages in a project
    pub async fn analyze_all_languages(&self, root_path: &Path) -> Result<Vec<LanguageAnalysisResult>> {
        log::debug!("Analyzing all languages for: {}", root_path.display());
        
        let mut results = Vec::new();
        
        for analyzer in &self.analyzers {
            if analyzer.can_analyze(root_path).await {
                let confidence = analyzer.confidence_score(root_path);
                
                // Only analyze if confidence is reasonable
                if confidence > 0.3 {
                    match analyzer.analyze(root_path).await {
                        Ok(result) => {
                            log::debug!(
                                "Language analysis result: {} (confidence: {:.2})",
                                analyzer.language_name(),
                                result.confidence
                            );
                            results.push(result);
                        }
                        Err(e) => {
                            log::warn!(
                                "Failed to analyze {} for {}: {}",
                                analyzer.language_name(),
                                root_path.display(),
                                e
                            );
                        }
                    }
                }
            }
        }
        
        // Sort by confidence
        results.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        Ok(results)
    }
    
    /// Get language statistics for a project
    pub async fn get_language_statistics(&self, root_path: &Path) -> Result<LanguageStatistics> {
        let mut stats = LanguageStatistics::default();
        
        // Walk directory and analyze files
        let mut entries = tokio::fs::read_dir(root_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            
            if path.is_file() {
                if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
                    let language_type = self.classify_extension(extension);
                    
                    // Count lines if it's a source file
                    if self.is_source_extension(extension) {
                        if let Ok(content) = tokio::fs::read_to_string(&path).await {
                            let line_count = content.lines().count();
                            stats.add_file(language_type, line_count);
                        }
                    }
                }
            } else if path.is_dir() && self.should_analyze_subdirectory(&path) {
                // Recursively analyze subdirectories
                if let Ok(sub_stats) = Box::pin(self.get_language_statistics(&path)).await {
                    stats.merge(sub_stats);
                }
            }
        }
        
        Ok(stats)
    }
    
    // Private helper methods
    
    async fn detect_by_file_extensions(&self, root_path: &Path) -> Result<Language> {
        let stats = self.get_language_statistics(root_path).await?;
        
        // Determine primary language by line count
        if let Some((lang_type, _)) = stats.get_primary_language() {
            match lang_type {
                LanguageType::Rust => Ok(Language::Rust {
                    version: None,
                    edition: "2021".to_string(),
                }),
                LanguageType::TypeScript => Ok(Language::TypeScript {
                    version: None,
                    strict: false,
                    node_version: None,
                }),
                LanguageType::JavaScript => Ok(Language::JavaScript {
                    node_version: None,
                    module_type: super::ModuleType::Unknown,
                }),
                LanguageType::Python => Ok(Language::Python {
                    version: None,
                    virtual_env: None,
                }),
                LanguageType::Go => Ok(Language::Go {
                    version: None,
                    module_path: None,
                }),
                LanguageType::Other(name) => Ok(Language::Other {
                    name,
                    detected_by: "file_extensions".to_string(),
                }),
            }
        } else {
            Ok(Language::Other {
                name: "unknown".to_string(),
                detected_by: "file_extensions".to_string(),
            })
        }
    }
    
    fn classify_extension(&self, extension: &str) -> LanguageType {
        match extension.to_lowercase().as_str() {
            "rs" => LanguageType::Rust,
            "ts" | "tsx" => LanguageType::TypeScript,
            "js" | "jsx" | "mjs" | "cjs" => LanguageType::JavaScript,
            "py" | "pyw" | "pyi" => LanguageType::Python,
            "go" => LanguageType::Go,
            "java" => LanguageType::Other("Java".to_string()),
            "kt" | "kts" => LanguageType::Other("Kotlin".to_string()),
            "swift" => LanguageType::Other("Swift".to_string()),
            "c" => LanguageType::Other("C".to_string()),
            "cpp" | "cc" | "cxx" => LanguageType::Other("C++".to_string()),
            "cs" => LanguageType::Other("C#".to_string()),
            "php" => LanguageType::Other("PHP".to_string()),
            "rb" => LanguageType::Other("Ruby".to_string()),
            _ => LanguageType::Other(format!("Unknown ({})", extension)),
        }
    }
    
    fn is_source_extension(&self, extension: &str) -> bool {
        matches!(extension.to_lowercase().as_str(),
            "rs" | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "java" | "kt" |
            "swift" | "c" | "cpp" | "cc" | "cxx" | "cs" | "php" | "rb" |
            "scala" | "clj" | "hs" | "ml" | "elm" | "dart" | "vue" | "svelte"
        )
    }
    
    fn should_analyze_subdirectory(&self, path: &Path) -> bool {
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            !matches!(name,
                "node_modules" | "target" | ".git" | "dist" | "build" |
                ".next" | ".nuxt" | "coverage" | "__pycache__" | ".pytest_cache" |
                ".venv" | "venv" | "env"
            )
        } else {
            false
        }
    }
}

/// Language type classification
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum LanguageType {
    Rust,
    TypeScript,
    JavaScript,
    Python,
    Go,
    Other(String),
}

/// Language statistics for a project
#[derive(Debug, Default)]
pub struct LanguageStatistics {
    file_counts: std::collections::HashMap<LanguageType, usize>,
    line_counts: std::collections::HashMap<LanguageType, usize>,
}

impl LanguageStatistics {
    fn add_file(&mut self, lang_type: LanguageType, lines: usize) {
        *self.file_counts.entry(lang_type.clone()).or_insert(0) += 1;
        *self.line_counts.entry(lang_type).or_insert(0) += lines;
    }
    
    fn merge(&mut self, other: LanguageStatistics) {
        for (lang_type, count) in other.file_counts {
            *self.file_counts.entry(lang_type).or_insert(0) += count;
        }
        
        for (lang_type, count) in other.line_counts {
            *self.line_counts.entry(lang_type).or_insert(0) += count;
        }
    }
    
    fn get_primary_language(&self) -> Option<(LanguageType, usize)> {
        self.line_counts
            .iter()
            .max_by_key(|(_, &lines)| lines)
            .map(|(lang_type, &lines)| (lang_type.clone(), lines))
    }
    
    pub fn total_files(&self) -> usize {
        self.file_counts.values().sum()
    }
    
    pub fn total_lines(&self) -> usize {
        self.line_counts.values().sum()
    }
}

// Default implementation for easy instantiation
impl Default for LanguageDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_language_detector_creation() {
        let detector = LanguageDetector::new();
        assert!(!detector.analyzers.is_empty());
    }
    
    #[tokio::test]
    async fn test_extension_classification() {
        let detector = LanguageDetector::new();
        
        assert_eq!(detector.classify_extension("rs"), LanguageType::Rust);
        assert_eq!(detector.classify_extension("ts"), LanguageType::TypeScript);
        assert_eq!(detector.classify_extension("js"), LanguageType::JavaScript);
        assert_eq!(detector.classify_extension("py"), LanguageType::Python);
    }
    
    #[tokio::test]
    async fn test_language_statistics() {
        let temp_dir = TempDir::new().unwrap();
        
        // Create test files
        tokio::fs::write(
            temp_dir.path().join("main.rs"),
            "fn main() {\n    println!(\"Hello, world!\");\n}"
        ).await.unwrap();
        
        tokio::fs::write(
            temp_dir.path().join("utils.js"),
            "function hello() {\n    console.log('Hello');\n}"
        ).await.unwrap();
        
        let detector = LanguageDetector::new();
        let stats = detector.get_language_statistics(temp_dir.path()).await.unwrap();
        
        assert!(stats.total_files() > 0);
        assert!(stats.total_lines() > 0);
    }
}