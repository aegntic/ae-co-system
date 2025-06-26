/// Project-Context MCP Integration for CCTM Phase 2C.3
/// 
/// Provides intelligent integration between ProjectDetector analysis and MCP services,
/// enabling context-aware AI assistance that automatically becomes available based on
/// the current project's language, frameworks, and dependencies

pub mod orchestrator;
pub mod contextual_manager;
pub mod project_aware_registry;

use std::path::PathBuf;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use chrono::{DateTime, Utc};

// Temporarily using local definitions until project_detector is fixed
use crate::virtualization::instance::ProjectAnalysis;
use super::{McpServerInfo, McpCapability, ProjectContext, McpServiceConfig};

/// Project-MCP Integration Engine - Central coordinator for context-aware MCP services
#[derive(Debug)]
pub struct ProjectMcpIntegration {
    orchestrator: orchestrator::ProjectMcpOrchestrator,
    contextual_manager: contextual_manager::ContextualMcpManager,
    project_registry: project_aware_registry::ProjectAwareRegistry,
    config: ProjectMcpConfig,
    /// Active project contexts by terminal ID
    active_contexts: Arc<RwLock<HashMap<String, ActiveProjectContext>>>,
}

impl ProjectMcpIntegration {
    /// Create a new Project-MCP Integration engine
    pub fn new(mcp_config: McpServiceConfig) -> Result<Self> {
        let config = ProjectMcpConfig::from_mcp_config(mcp_config.clone());
        let orchestrator = orchestrator::ProjectMcpOrchestrator::new(config.clone())?;
        let contextual_manager = contextual_manager::ContextualMcpManager::new(mcp_config)?;
        let project_registry = project_aware_registry::ProjectAwareRegistry::new();
        
        log::info!("Project-MCP Integration engine initialized");
        
        Ok(ProjectMcpIntegration {
            orchestrator,
            contextual_manager,
            project_registry,
            config,
            active_contexts: Arc::new(RwLock::new(HashMap::new())),
        })
    }
    
    /// Initialize the integration engine
    pub async fn initialize(&mut self) -> Result<()> {
        log::info!("Initializing Project-MCP Integration engine...");
        
        self.orchestrator.initialize().await?;
        self.contextual_manager.initialize().await?;
        self.project_registry.initialize().await?;
        
        log::info!("Project-MCP Integration engine initialized successfully");
        Ok(())
    }
    
    /// Handle project analysis results and activate relevant MCP services
    pub async fn on_project_analyzed(&mut self, terminal_id: &str, project_path: PathBuf, analysis: ProjectAnalysis) -> Result<ProjectMcpActivation> {
        log::info!("Processing project analysis for terminal {} at {}", terminal_id, project_path.display());
        
        // Create project context from analysis
        let project_context = self.create_project_context(project_path.clone(), &analysis).await?;
        
        // Find relevant MCP servers for this project
        let relevant_servers = self.project_registry.find_servers_for_project(&project_context).await?;
        
        // Orchestrate MCP server activation
        let activation_result = self.orchestrator.activate_servers_for_project(
            terminal_id,
            &project_context,
            &relevant_servers
        ).await?;
        
        // Update active contexts
        {
            let mut active_contexts = self.active_contexts.write().await;
            active_contexts.insert(terminal_id.to_string(), ActiveProjectContext {
                project_path: project_path.clone(),
                project_context: project_context.clone(),
                analysis: analysis.clone(),
                activated_servers: activation_result.activated_servers.clone(),
                capabilities: activation_result.available_capabilities.clone(),
                activated_at: Utc::now(),
            });
        }
        
        // Manage contextual server lifecycle
        self.contextual_manager.manage_project_servers(terminal_id, &project_context, &relevant_servers).await?;
        
        log::info!("Project-MCP integration complete for terminal {}: {} servers activated", 
                  terminal_id, activation_result.activated_servers.len());
        
        Ok(ProjectMcpActivation {
            terminal_id: terminal_id.to_string(),
            project_path,
            activated_servers: activation_result.activated_servers,
            available_capabilities: activation_result.available_capabilities,
            context_score: activation_result.context_score,
            activation_time_ms: activation_result.activation_time_ms,
        })
    }
    
    /// Handle project context changes (file changes, directory changes)
    pub async fn on_project_context_changed(&mut self, terminal_id: &str, change_type: ProjectContextChange) -> Result<()> {
        log::debug!("Project context changed for terminal {}: {:?}", terminal_id, change_type);
        
        // Get current active context
        let current_context = {
            let active_contexts = self.active_contexts.read().await;
            active_contexts.get(terminal_id).cloned()
        };
        
        if let Some(context) = current_context {
            match change_type {
                ProjectContextChange::DirectoryChange { new_path } => {
                    // Re-analyze project at new path
                    // This would typically trigger a new project analysis cycle
                    log::info!("Directory changed for terminal {}: {}", terminal_id, new_path.display());
                }
                ProjectContextChange::FileChange { file_path, change_type } => {
                    // Handle specific file changes that might affect project context
                    if self.is_context_affecting_file(&file_path) {
                        log::info!("Context-affecting file changed: {}", file_path.display());
                        // Could trigger partial re-analysis or server reconfiguration
                    }
                }
                ProjectContextChange::DependencyChange => {
                    // Handle dependency file changes (package.json, Cargo.toml, etc.)
                    log::info!("Dependencies changed for terminal {}", terminal_id);
                    // Could trigger server reconfiguration with new dependency context
                }
            }
        }
        
        Ok(())
    }
    
    /// Get available MCP capabilities for a terminal
    pub async fn get_available_capabilities(&self, terminal_id: &str) -> Vec<McpCapability> {
        let active_contexts = self.active_contexts.read().await;
        if let Some(context) = active_contexts.get(terminal_id) {
            context.capabilities.clone()
        } else {
            vec![]
        }
    }
    
    /// Get project context for a terminal
    pub async fn get_project_context(&self, terminal_id: &str) -> Option<ProjectContext> {
        let active_contexts = self.active_contexts.read().await;
        active_contexts.get(terminal_id).map(|ctx| ctx.project_context.clone())
    }
    
    /// Deactivate MCP services for a terminal (when terminal closes)
    pub async fn deactivate_terminal(&mut self, terminal_id: &str) -> Result<()> {
        log::info!("Deactivating MCP services for terminal {}", terminal_id);
        
        // Remove from active contexts
        let removed_context = {
            let mut active_contexts = self.active_contexts.write().await;
            active_contexts.remove(terminal_id)
        };
        
        if let Some(context) = removed_context {
            // Deactivate servers managed by this terminal
            self.contextual_manager.deactivate_terminal_servers(terminal_id, &context.activated_servers).await?;
            
            log::info!("Deactivated {} MCP servers for terminal {}", 
                      context.activated_servers.len(), terminal_id);
        }
        
        Ok(())
    }
    
    /// Get integration statistics
    pub async fn get_integration_statistics(&self) -> ProjectMcpIntegrationStats {
        let active_contexts = self.active_contexts.read().await;
        
        let active_terminals = active_contexts.len();
        let total_activated_servers = active_contexts.values()
            .map(|ctx| ctx.activated_servers.len())
            .sum();
        let total_capabilities = active_contexts.values()
            .map(|ctx| ctx.capabilities.len())
            .sum();
        
        ProjectMcpIntegrationStats {
            active_terminals,
            total_activated_servers,
            total_capabilities,
            context_hits: 0, // TODO: Implement usage tracking
            last_updated: Utc::now(),
        }
    }
    
    // Private helper methods
    
    /// Create project context from project analysis
    async fn create_project_context(&self, project_path: PathBuf, analysis: &ProjectAnalysis) -> Result<ProjectContext> {
        let primary_language = analysis.language.clone();
        let frameworks = analysis.frameworks.clone();
        let project_type = self.determine_project_type(&primary_language, &frameworks);
        
        Ok(ProjectContext {
            project_path,
            primary_language,
            frameworks,
            project_type,
            dependencies: vec![], // TODO: Extract from analysis
        })
    }
    
    /// Determine project type from language and frameworks
    fn determine_project_type(&self, language: &str, frameworks: &[String]) -> String {
        // Check frameworks first for more specific type
        for framework in frameworks {
            match framework.as_str() {
                "Tauri" => return "desktop".to_string(),
                "React" | "Vue" | "Angular" => return "web".to_string(),
                "Django" | "Flask" | "FastAPI" => return "api".to_string(),
                "Express" => return "api".to_string(),
                _ => {}
            }
        }
        
        // Fall back to language-based detection
        match language {
            "Rust" => "system".to_string(),
            "TypeScript" | "JavaScript" => "web".to_string(),
            "Python" => "script".to_string(),
            "Go" => "service".to_string(),
            _ => "other".to_string(),
        }
    }
    
    /// Check if a file change affects project context
    fn is_context_affecting_file(&self, file_path: &PathBuf) -> bool {
        if let Some(file_name) = file_path.file_name().and_then(|n| n.to_str()) {
            matches!(file_name,
                "package.json" | "Cargo.toml" | "pyproject.toml" | "requirements.txt" |
                "tsconfig.json" | "go.mod" | ".env" | "Dockerfile"
            )
        } else {
            false
        }
    }
}

/// Configuration for Project-MCP integration
#[derive(Debug, Clone)]
pub struct ProjectMcpConfig {
    /// Maximum time to spend on server activation (milliseconds)
    pub max_activation_time_ms: u64,
    /// Enable automatic server deactivation when not in use
    pub auto_deactivation: bool,
    /// Context change debounce time (milliseconds)
    pub context_change_debounce_ms: u64,
    /// Maximum concurrent servers per project
    pub max_servers_per_project: usize,
}

impl ProjectMcpConfig {
    pub fn from_mcp_config(mcp_config: McpServiceConfig) -> Self {
        ProjectMcpConfig {
            max_activation_time_ms: 5000,
            auto_deactivation: true,
            context_change_debounce_ms: 1000,
            max_servers_per_project: mcp_config.max_concurrent_servers / 2,
        }
    }
}

impl Default for ProjectMcpConfig {
    fn default() -> Self {
        ProjectMcpConfig {
            max_activation_time_ms: 5000,
            auto_deactivation: true,
            context_change_debounce_ms: 1000,
            max_servers_per_project: 5,
        }
    }
}

/// Active project context for a terminal
#[derive(Debug, Clone)]
pub struct ActiveProjectContext {
    pub project_path: PathBuf,
    pub project_context: ProjectContext,
    pub analysis: ProjectAnalysis,
    pub activated_servers: Vec<String>,
    pub capabilities: Vec<McpCapability>,
    pub activated_at: DateTime<Utc>,
}

/// Result of project MCP activation
#[derive(Debug, Clone)]
pub struct ProjectMcpActivation {
    pub terminal_id: String,
    pub project_path: PathBuf,
    pub activated_servers: Vec<String>,
    pub available_capabilities: Vec<McpCapability>,
    pub context_score: f64,
    pub activation_time_ms: u64,
}

/// Types of project context changes
#[derive(Debug, Clone)]
pub enum ProjectContextChange {
    DirectoryChange { new_path: PathBuf },
    FileChange { file_path: PathBuf, change_type: String },
    DependencyChange,
}

/// Integration statistics
#[derive(Debug, Clone)]
pub struct ProjectMcpIntegrationStats {
    pub active_terminals: usize,
    pub total_activated_servers: usize,
    pub total_capabilities: usize,
    pub context_hits: usize,
    pub last_updated: DateTime<Utc>,
}

/// Default implementation for easy instantiation
impl Default for ProjectMcpIntegration {
    fn default() -> Self {
        Self::new(McpServiceConfig::default()).expect("Failed to create ProjectMcpIntegration")
    }
}