/// ProjectMcpOrchestrator for CCTM Phase 2C.3.1
/// 
/// Core bridge between ProjectDetector analysis and MCP service activation.
/// Provides intelligent server selection, context scoring, and activation orchestration
/// to make AI assistance automatically relevant to the current project context.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, Error};
use chrono::Utc;

use super::{ProjectMcpConfig, ProjectContextChange};
use crate::mcp_service::{McpServerInfo, McpCapability, ProjectContext, McpToolType};

/// Project-MCP Orchestrator - Intelligent bridge between project analysis and MCP services
#[derive(Debug)]
pub struct ProjectMcpOrchestrator {
    config: ProjectMcpConfig,
    /// Server selection algorithms and context scoring
    selection_engine: ServerSelectionEngine,
    /// Activation tracking and optimization
    activation_tracker: ActivationTracker,
}

impl ProjectMcpOrchestrator {
    /// Create a new Project-MCP Orchestrator
    pub fn new(config: ProjectMcpConfig) -> Result<Self> {
        let selection_engine = ServerSelectionEngine::new();
        let activation_tracker = ActivationTracker::new();
        
        log::info!("ProjectMcpOrchestrator initialized with config: max_servers={}, activation_timeout={}ms", 
                  config.max_servers_per_project, config.max_activation_time_ms);
        
        Ok(ProjectMcpOrchestrator {
            config,
            selection_engine,
            activation_tracker,
        })
    }
    
    /// Initialize the orchestrator
    pub async fn initialize(&self) -> Result<()> {
        log::info!("ProjectMcpOrchestrator initialized successfully");
        Ok(())
    }
    
    /// Activate MCP servers for a project context
    pub async fn activate_servers_for_project(
        &self,
        terminal_id: &str,
        project_context: &ProjectContext,
        available_servers: &[McpServerInfo]
    ) -> Result<ServerActivationResult> {
        let start_time = std::time::Instant::now();
        
        log::info!("Activating MCP servers for terminal {} in {} project", 
                  terminal_id, project_context.primary_language);
        
        // Score and rank servers for this project context
        let ranked_servers = self.selection_engine.rank_servers_for_project(project_context, available_servers).await?;
        
        // Select top servers within limits
        let selected_servers = self.select_optimal_servers(&ranked_servers).await?;
        
        // Activate selected servers
        let mut activated_servers = Vec::new();
        let mut available_capabilities = Vec::new();
        let mut total_context_score = 0.0;
        
        for (server_info, context_score) in selected_servers {
            match self.activate_server(terminal_id, &server_info, project_context).await {
                Ok(server_id) => {
                    activated_servers.push(server_id);
                    available_capabilities.extend(server_info.capabilities.clone());
                    total_context_score += context_score;
                    
                    log::debug!("Activated MCP server: {} (score: {:.2})", server_info.name, context_score);
                }
                Err(e) => {
                    log::warn!("Failed to activate MCP server {}: {}", server_info.name, e);
                }
            }
        }
        
        let activation_time = start_time.elapsed().as_millis() as u64;
        let average_context_score = if !activated_servers.is_empty() {
            total_context_score / activated_servers.len() as f64
        } else {
            0.0
        };
        
        // Track activation for optimization
        self.activation_tracker.record_activation(
            terminal_id,
            project_context,
            &activated_servers,
            average_context_score,
            activation_time
        ).await;
        
        log::info!("MCP activation complete for terminal {}: {}/{} servers activated in {}ms", 
                  terminal_id, activated_servers.len(), available_servers.len(), activation_time);
        
        Ok(ServerActivationResult {
            activated_servers,
            available_capabilities,
            context_score: average_context_score,
            activation_time_ms: activation_time,
        })
    }
    
    /// Deactivate servers for a terminal
    pub async fn deactivate_servers_for_terminal(&self, terminal_id: &str, server_ids: &[String]) -> Result<()> {
        log::info!("Deactivating {} MCP servers for terminal {}", server_ids.len(), terminal_id);
        
        for server_id in server_ids {
            if let Err(e) = self.deactivate_server(terminal_id, server_id).await {
                log::warn!("Failed to deactivate MCP server {}: {}", server_id, e);
            }
        }
        
        Ok(())
    }
    
    /// Get orchestration statistics
    pub async fn get_orchestration_stats(&self) -> OrchestrationStats {
        self.activation_tracker.get_statistics().await
    }
    
    /// Update server rankings based on usage feedback
    pub async fn record_server_feedback(&self, server_id: &str, terminal_id: &str, feedback: ServerFeedback) -> Result<()> {
        log::debug!("Recording feedback for server {} from terminal {}: {:?}", server_id, terminal_id, feedback);
        
        self.selection_engine.update_server_ranking(server_id, feedback).await?;
        
        Ok(())
    }
    
    // Private implementation methods
    
    /// Select optimal servers from ranked list
    async fn select_optimal_servers(&self, ranked_servers: &[(McpServerInfo, f64)]) -> Result<Vec<(McpServerInfo, f64)>> {
        let mut selected = Vec::new();
        let mut capability_coverage = std::collections::HashSet::new();
        
        // Select servers with highest scores and diverse capabilities
        for (server_info, score) in ranked_servers.iter().take(self.config.max_servers_per_project * 2) {
            // Check if this server adds new capabilities
            let server_capability_types: std::collections::HashSet<_> = server_info.capabilities
                .iter()
                .map(|cap| std::mem::discriminant(&cap.tool_type))
                .collect();
            
            let adds_new_capabilities = server_capability_types
                .difference(&capability_coverage)
                .next()
                .is_some();
            
            // Include if high score or adds new capabilities
            if *score > 0.7 || adds_new_capabilities || selected.len() < self.config.max_servers_per_project / 2 {
                selected.push((server_info.clone(), *score));
                capability_coverage.extend(server_capability_types);
                
                if selected.len() >= self.config.max_servers_per_project {
                    break;
                }
            }
        }
        
        log::debug!("Selected {} servers from {} candidates", selected.len(), ranked_servers.len());
        Ok(selected)
    }
    
    /// Activate a single MCP server
    async fn activate_server(&self, terminal_id: &str, server_info: &McpServerInfo, project_context: &ProjectContext) -> Result<String> {
        // TODO: Implement actual server activation via MCP service manager
        // For now, simulate activation
        
        let server_id = format!("{}:{}", server_info.id, terminal_id);
        
        log::debug!("Activating MCP server {} for terminal {} in project {}", 
                   server_info.name, terminal_id, project_context.project_path.display());
        
        // Simulate activation delay
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        Ok(server_id)
    }
    
    /// Deactivate a single MCP server
    async fn deactivate_server(&self, terminal_id: &str, server_id: &str) -> Result<()> {
        // TODO: Implement actual server deactivation
        log::debug!("Deactivating MCP server {} for terminal {}", server_id, terminal_id);
        
        Ok(())
    }
}

/// Server selection engine with intelligent ranking algorithms
#[derive(Debug)]
struct ServerSelectionEngine {
    /// Server performance history for machine learning
    performance_history: Arc<RwLock<HashMap<String, ServerPerformance>>>,
}

impl ServerSelectionEngine {
    fn new() -> Self {
        ServerSelectionEngine {
            performance_history: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Rank servers by relevance to project context
    async fn rank_servers_for_project(&self, project_context: &ProjectContext, servers: &[McpServerInfo]) -> Result<Vec<(McpServerInfo, f64)>> {
        let mut ranked_servers = Vec::new();
        
        for server in servers {
            let context_score = self.calculate_context_score(project_context, server).await;
            let performance_score = self.get_performance_score(&server.id).await;
            let combined_score = (context_score * 0.7) + (performance_score * 0.3);
            
            ranked_servers.push((server.clone(), combined_score));
        }
        
        // Sort by combined score (highest first)
        ranked_servers.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        log::debug!("Ranked {} servers for {} project", ranked_servers.len(), project_context.primary_language);
        
        Ok(ranked_servers)
    }
    
    /// Calculate context relevance score for a server
    async fn calculate_context_score(&self, project_context: &ProjectContext, server: &McpServerInfo) -> f64 {
        let mut score = 0.0;
        
        // Language match scoring (highest weight)
        if server.languages.contains(&project_context.primary_language) {
            score += 0.4;
        } else if server.languages.is_empty() {
            score += 0.1; // Generic servers get some credit
        }
        
        // Framework match scoring
        let framework_matches = project_context.frameworks.iter()
            .filter(|framework| server.frameworks.contains(framework))
            .count();
        
        if framework_matches > 0 {
            score += 0.3 * (framework_matches as f64 / project_context.frameworks.len().max(1) as f64);
        }
        
        // Project type match scoring
        if server.project_types.contains(&project_context.project_type) {
            score += 0.2;
        }
        
        // Capability diversity bonus
        let unique_capability_types: std::collections::HashSet<_> = server.capabilities
            .iter()
            .map(|cap| std::mem::discriminant(&cap.tool_type))
            .collect();
        
        score += 0.1 * (unique_capability_types.len().min(5) as f64 / 5.0);
        
        score.min(1.0)
    }
    
    /// Get historical performance score for a server
    async fn get_performance_score(&self, server_id: &str) -> f64 {
        let performance_history = self.performance_history.read().await;
        
        if let Some(perf) = performance_history.get(server_id) {
            // Calculate score based on success rate, response time, and user satisfaction
            let success_score = perf.success_rate;
            let speed_score = (1000.0 - perf.avg_response_time_ms.min(1000.0)) / 1000.0;
            let satisfaction_score = perf.user_satisfaction;
            
            (success_score * 0.4) + (speed_score * 0.3) + (satisfaction_score * 0.3)
        } else {
            0.5 // Neutral score for unknown servers
        }
    }
    
    /// Update server ranking based on feedback
    async fn update_server_ranking(&self, server_id: &str, feedback: ServerFeedback) -> Result<()> {
        let mut performance_history = self.performance_history.write().await;
        
        let performance = performance_history.entry(server_id.to_string()).or_insert(ServerPerformance::default());
        
        performance.total_activations += 1;
        
        match feedback {
            ServerFeedback::Success { response_time_ms } => {
                performance.successful_activations += 1;
                performance.total_response_time_ms += response_time_ms;
                performance.success_rate = performance.successful_activations as f64 / performance.total_activations as f64;
                performance.avg_response_time_ms = performance.total_response_time_ms as f64 / performance.successful_activations as f64;
            }
            ServerFeedback::Failure => {
                // Success rate will decrease automatically
                performance.success_rate = performance.successful_activations as f64 / performance.total_activations as f64;
            }
            ServerFeedback::UserRating { rating } => {
                performance.user_ratings.push(rating);
                performance.user_satisfaction = performance.user_ratings.iter().sum::<f64>() / performance.user_ratings.len() as f64;
            }
        }
        
        Ok(())
    }
}

/// Activation tracking for optimization and analytics
#[derive(Debug)]
struct ActivationTracker {
    activation_history: Arc<RwLock<Vec<ActivationRecord>>>,
}

impl ActivationTracker {
    fn new() -> Self {
        ActivationTracker {
            activation_history: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    /// Record an activation for tracking and optimization
    async fn record_activation(
        &self,
        terminal_id: &str,
        project_context: &ProjectContext,
        activated_servers: &[String],
        context_score: f64,
        activation_time_ms: u64
    ) {
        let record = ActivationRecord {
            terminal_id: terminal_id.to_string(),
            project_type: project_context.project_type.clone(),
            primary_language: project_context.primary_language.clone(),
            activated_servers: activated_servers.to_vec(),
            context_score,
            activation_time_ms,
            timestamp: Utc::now(),
        };
        
        let mut history = self.activation_history.write().await;
        history.push(record);
        
        // Limit history size to prevent memory growth
        if history.len() > 1000 {
            history.drain(0..100);
        }
    }
    
    /// Get activation statistics
    async fn get_statistics(&self) -> OrchestrationStats {
        let history = self.activation_history.read().await;
        
        if history.is_empty() {
            return OrchestrationStats::default();
        }
        
        let total_activations = history.len();
        let avg_activation_time = history.iter().map(|r| r.activation_time_ms).sum::<u64>() as f64 / total_activations as f64;
        let avg_context_score = history.iter().map(|r| r.context_score).sum::<f64>() / total_activations as f64;
        let avg_servers_per_activation = history.iter().map(|r| r.activated_servers.len()).sum::<usize>() as f64 / total_activations as f64;
        
        OrchestrationStats {
            total_activations,
            avg_activation_time_ms: avg_activation_time,
            avg_context_score,
            avg_servers_per_activation,
            last_updated: Utc::now(),
        }
    }
}

/// Server activation result
#[derive(Debug, Clone)]
pub struct ServerActivationResult {
    pub activated_servers: Vec<String>,
    pub available_capabilities: Vec<McpCapability>,
    pub context_score: f64,
    pub activation_time_ms: u64,
}

/// Server performance tracking
#[derive(Debug, Clone)]
struct ServerPerformance {
    total_activations: usize,
    successful_activations: usize,
    success_rate: f64,
    total_response_time_ms: u64,
    avg_response_time_ms: f64,
    user_ratings: Vec<f64>,
    user_satisfaction: f64,
}

impl Default for ServerPerformance {
    fn default() -> Self {
        ServerPerformance {
            total_activations: 0,
            successful_activations: 0,
            success_rate: 1.0,
            total_response_time_ms: 0,
            avg_response_time_ms: 0.0,
            user_ratings: Vec::new(),
            user_satisfaction: 0.5,
        }
    }
}

/// Server feedback for performance tracking
#[derive(Debug, Clone)]
pub enum ServerFeedback {
    Success { response_time_ms: u64 },
    Failure,
    UserRating { rating: f64 }, // 0.0 to 1.0
}

/// Activation record for analytics
#[derive(Debug, Clone)]
struct ActivationRecord {
    terminal_id: String,
    project_type: String,
    primary_language: String,
    activated_servers: Vec<String>,
    context_score: f64,
    activation_time_ms: u64,
    timestamp: chrono::DateTime<chrono::Utc>,
}

/// Orchestration statistics
#[derive(Debug, Clone, Default)]
pub struct OrchestrationStats {
    pub total_activations: usize,
    pub avg_activation_time_ms: f64,
    pub avg_context_score: f64,
    pub avg_servers_per_activation: f64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp_service::{McpCapability, McpToolType, McpServerStatus};
    use std::path::PathBuf;
    
    fn create_test_server(id: &str, name: &str, languages: Vec<String>, frameworks: Vec<String>) -> McpServerInfo {
        McpServerInfo {
            id: id.to_string(),
            name: name.to_string(),
            version: "1.0.0".to_string(),
            description: Some("Test server".to_string()),
            path: PathBuf::from("/test"),
            executable: "test".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "test_capability".to_string(),
                    description: "Test capability".to_string(),
                    tool_type: McpToolType::CodeAnalysis,
                    input_schema: None,
                    output_schema: None,
                }
            ],
            project_types: vec!["web".to_string()],
            languages,
            frameworks,
            status: McpServerStatus::Discovered,
            last_seen: chrono::Utc::now(),
        }
    }
    
    fn create_test_project_context() -> ProjectContext {
        ProjectContext {
            project_path: PathBuf::from("/test/rust-project"),
            primary_language: "Rust".to_string(),
            frameworks: vec!["Tauri".to_string()],
            project_type: "desktop".to_string(),
            dependencies: vec![],
        }
    }
    
    #[tokio::test]
    async fn test_orchestrator_creation() {
        let config = ProjectMcpConfig::default();
        let orchestrator = ProjectMcpOrchestrator::new(config).unwrap();
        
        let stats = orchestrator.get_orchestration_stats().await;
        assert_eq!(stats.total_activations, 0);
    }
    
    #[tokio::test]
    async fn test_server_context_scoring() {
        let config = ProjectMcpConfig::default();
        let orchestrator = ProjectMcpOrchestrator::new(config).unwrap();
        let project_context = create_test_project_context();
        
        // Create servers with different relevance levels
        let rust_server = create_test_server("rust1", "Rust Server", vec!["Rust".to_string()], vec!["Tauri".to_string()]);
        let js_server = create_test_server("js1", "JS Server", vec!["JavaScript".to_string()], vec![]);
        let generic_server = create_test_server("generic1", "Generic Server", vec![], vec![]);
        
        let servers = vec![rust_server, js_server, generic_server];
        
        let ranked = orchestrator.selection_engine.rank_servers_for_project(&project_context, &servers).await.unwrap();
        
        // Rust server should rank highest due to language and framework match
        assert_eq!(ranked[0].0.name, "Rust Server");
        assert!(ranked[0].1 > ranked[1].1); // Higher score than others
    }
    
    #[tokio::test]
    async fn test_server_activation() {
        let config = ProjectMcpConfig::default();
        let orchestrator = ProjectMcpOrchestrator::new(config).unwrap();
        let project_context = create_test_project_context();
        
        let servers = vec![
            create_test_server("rust1", "Rust Server", vec!["Rust".to_string()], vec!["Tauri".to_string()])
        ];
        
        let result = orchestrator.activate_servers_for_project("terminal1", &project_context, &servers).await.unwrap();
        
        assert_eq!(result.activated_servers.len(), 1);
        assert!(!result.available_capabilities.is_empty());
        assert!(result.context_score > 0.0);
    }
}