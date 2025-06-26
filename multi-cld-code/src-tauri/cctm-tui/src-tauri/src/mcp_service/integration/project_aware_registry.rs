/// ProjectAwareRegistry for CCTM Phase 2C.3.3
/// 
/// Enhances MCP Registry with project-specific intelligence and context-aware
/// server selection algorithms. Provides sophisticated matching between project
/// requirements and available MCP server capabilities.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use crate::mcp_service::{McpServerInfo, McpCapability, ProjectContext, McpToolType, registry::McpRegistry};

/// Project-Aware Registry - Intelligent MCP server selection for project contexts
#[derive(Debug)]
pub struct ProjectAwareRegistry {
    /// Base MCP registry
    base_registry: McpRegistry,
    /// Project-specific server recommendations
    project_recommendations: Arc<RwLock<HashMap<String, ProjectRecommendations>>>,
    /// Usage analytics for optimization
    usage_analytics: Arc<RwLock<UsageAnalytics>>,
    /// Selection algorithms
    selection_engine: ProjectSelectionEngine,
}

impl ProjectAwareRegistry {
    /// Create a new Project-Aware Registry
    pub fn new() -> Self {
        let base_registry = McpRegistry::new();
        let selection_engine = ProjectSelectionEngine::new();
        
        log::info!("ProjectAwareRegistry initialized with intelligent server selection");
        
        ProjectAwareRegistry {
            base_registry,
            project_recommendations: Arc::new(RwLock::new(HashMap::new())),
            usage_analytics: Arc::new(RwLock::new(UsageAnalytics::default())),
            selection_engine,
        }
    }
    
    /// Initialize the project-aware registry
    pub async fn initialize(&self) -> Result<()> {
        log::info!("ProjectAwareRegistry initialized successfully");
        Ok(())
    }
    
    /// Register an MCP server with project awareness
    pub async fn register_server(&self, server_info: McpServerInfo) -> Result<()> {
        // Register with base registry
        self.base_registry.register_server(server_info.clone()).await?;
        
        // Analyze server for project recommendations
        self.analyze_server_for_projects(&server_info).await?;
        
        log::debug!("Registered server {} with project awareness", server_info.name);
        Ok(())
    }
    
    /// Find best MCP servers for a project context
    pub async fn find_servers_for_project(&self, project_context: &ProjectContext) -> Result<Vec<McpServerInfo>> {
        log::debug!("Finding servers for {} project at {}", 
                   project_context.primary_language, project_context.project_path.display());
        
        // Get servers from base registry
        let all_servers = self.base_registry.list_servers().await;
        
        // Apply project-aware selection
        let selected_servers = self.selection_engine.select_best_servers(project_context, &all_servers).await?;
        
        // Update usage analytics
        self.record_server_selection(project_context, &selected_servers).await?;
        
        log::info!("Selected {} servers for {} project", selected_servers.len(), project_context.primary_language);
        Ok(selected_servers)
    }
    
    /// Get server recommendations for a project type
    pub async fn get_project_recommendations(&self, project_signature: &str) -> Option<ProjectRecommendations> {
        let recommendations = self.project_recommendations.read().await;
        recommendations.get(project_signature).cloned()
    }
    
    /// Record server usage feedback for machine learning
    pub async fn record_server_feedback(&self, project_context: &ProjectContext, server_id: &str, feedback: ServerUsageFeedback) -> Result<()> {
        log::debug!("Recording feedback for server {} in {} project: {:?}", 
                   server_id, project_context.primary_language, feedback);
        
        // Update usage analytics
        {
            let mut analytics = self.usage_analytics.write().await;
            analytics.record_feedback(project_context, server_id, feedback.clone());
        }
        
        // Update selection engine with feedback
        self.selection_engine.update_with_feedback(project_context, server_id, feedback).await?;
        
        Ok(())
    }
    
    /// Get intelligent capability recommendations for a project
    pub async fn get_recommended_capabilities(&self, project_context: &ProjectContext) -> Vec<McpCapability> {
        let servers = match self.find_servers_for_project(project_context).await {
            Ok(servers) => servers,
            Err(_) => return vec![],
        };
        
        // Extract and rank capabilities
        let mut all_capabilities = Vec::new();
        for server in servers {
            all_capabilities.extend(server.capabilities);
        }
        
        // Remove duplicates and rank by relevance
        self.selection_engine.rank_capabilities_for_project(project_context, &all_capabilities).await
    }
    
    /// Get server selection statistics
    pub async fn get_selection_statistics(&self) -> ProjectSelectionStats {
        let analytics = self.usage_analytics.read().await;
        
        ProjectSelectionStats {
            total_selections: analytics.total_selections,
            unique_projects: analytics.project_patterns.len(),
            avg_servers_per_project: analytics.calculate_avg_servers_per_project(),
            success_rate: analytics.calculate_success_rate(),
            last_updated: Utc::now(),
        }
    }
    
    /// Update recommendations based on usage patterns
    pub async fn optimize_recommendations(&self) -> Result<()> {
        log::info!("Optimizing server recommendations based on usage patterns");
        
        let analytics = self.usage_analytics.read().await;
        let mut recommendations = self.project_recommendations.write().await;
        
        // Analyze usage patterns to create better recommendations
        for (project_pattern, pattern_analytics) in &analytics.project_patterns {
            let optimized_recommendations = self.create_optimized_recommendations(pattern_analytics);
            recommendations.insert(project_pattern.clone(), optimized_recommendations);
        }
        
        log::info!("Optimized recommendations for {} project patterns", recommendations.len());
        Ok(())
    }
    
    // Private implementation methods
    
    /// Analyze server capabilities for project recommendations
    async fn analyze_server_for_projects(&self, server_info: &McpServerInfo) -> Result<()> {
        let mut recommendations = self.project_recommendations.write().await;
        
        // Create project signatures that this server would be good for
        let project_signatures = self.generate_project_signatures(server_info);
        
        for signature in project_signatures {
            let recommendation = recommendations.entry(signature.clone()).or_insert_with(|| ProjectRecommendations {
                project_signature: signature.clone(),
                recommended_servers: Vec::new(),
                capability_priorities: HashMap::new(),
                confidence_score: 0.0,
                last_updated: Utc::now(),
            });
            
            // Add server to recommendations if not already present
            if !recommendation.recommended_servers.iter().any(|r| r.server_id == server_info.id) {
                recommendation.recommended_servers.push(ServerRecommendation {
                    server_id: server_info.id.clone(),
                    server_name: server_info.name.clone(),
                    relevance_score: self.calculate_server_relevance(&signature, server_info),
                    recommended_capabilities: server_info.capabilities.iter()
                        .map(|cap| cap.name.clone())
                        .collect(),
                });
            }
        }
        
        Ok(())
    }
    
    /// Generate project signatures that a server would be suitable for
    fn generate_project_signatures(&self, server_info: &McpServerInfo) -> Vec<String> {
        let mut signatures = Vec::new();
        
        // Create signatures based on language + framework combinations
        for language in &server_info.languages {
            for framework in &server_info.frameworks {
                signatures.push(format!("{}:{}", language, framework));
            }
            
            // Also create language-only signatures
            if server_info.frameworks.is_empty() {
                signatures.push(language.clone());
            }
        }
        
        // Create signatures based on project types
        for project_type in &server_info.project_types {
            signatures.push(format!("type:{}", project_type));
        }
        
        // Create capability-based signatures
        let capability_types: std::collections::HashSet<_> = server_info.capabilities
            .iter()
            .map(|cap| format!("cap:{:?}", cap.tool_type))
            .collect();
        signatures.extend(capability_types);
        
        signatures
    }
    
    /// Calculate server relevance score for a project signature
    fn calculate_server_relevance(&self, project_signature: &str, server_info: &McpServerInfo) -> f64 {
        let mut score = 0.0;
        
        // Parse project signature
        if let Some((lang_or_type, framework)) = project_signature.split_once(':') {
            if lang_or_type == "type" {
                // Project type match
                if server_info.project_types.contains(&framework.to_string()) {
                    score += 0.8;
                }
            } else if lang_or_type == "cap" {
                // Capability match
                let has_capability = server_info.capabilities.iter()
                    .any(|cap| format!("{:?}", cap.tool_type) == framework);
                if has_capability {
                    score += 0.6;
                }
            } else {
                // Language + framework match
                if server_info.languages.contains(&lang_or_type.to_string()) {
                    score += 0.5;
                }
                if server_info.frameworks.contains(&framework.to_string()) {
                    score += 0.3;
                }
            }
        } else {
            // Single language match
            if server_info.languages.contains(&project_signature.to_string()) {
                score += 0.4;
            }
        }
        
        // Capability diversity bonus
        score += 0.1 * (server_info.capabilities.len().min(5) as f64 / 5.0);
        
        score.min(1.0)
    }
    
    /// Record server selection for analytics
    async fn record_server_selection(&self, project_context: &ProjectContext, selected_servers: &[McpServerInfo]) -> Result<()> {
        let mut analytics = self.usage_analytics.write().await;
        
        let project_pattern = format!("{}:{}", project_context.primary_language, project_context.project_type);
        let selection_record = SelectionRecord {
            project_pattern: project_pattern.clone(),
            selected_servers: selected_servers.iter().map(|s| s.id.clone()).collect(),
            timestamp: Utc::now(),
        };
        
        analytics.record_selection(selection_record);
        
        Ok(())
    }
    
    /// Create optimized recommendations based on usage analytics
    fn create_optimized_recommendations(&self, pattern_analytics: &ProjectPatternAnalytics) -> ProjectRecommendations {
        let mut recommended_servers = Vec::new();
        
        // Rank servers by usage frequency and success rate
        for (server_id, server_analytics) in &pattern_analytics.server_usage {
            let relevance_score = (server_analytics.usage_count as f64 * 0.5) + 
                                 (server_analytics.success_rate * 0.5);
            
            recommended_servers.push(ServerRecommendation {
                server_id: server_id.clone(),
                server_name: format!("Server {}", server_id), // Would be looked up in practice
                relevance_score,
                recommended_capabilities: vec![], // Would be populated from server info
            });
        }
        
        // Sort by relevance score
        recommended_servers.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        
        ProjectRecommendations {
            project_signature: pattern_analytics.project_pattern.clone(),
            recommended_servers,
            capability_priorities: HashMap::new(),
            confidence_score: pattern_analytics.calculate_confidence(),
            last_updated: Utc::now(),
        }
    }
}

/// Project selection engine with intelligent algorithms
#[derive(Debug)]
struct ProjectSelectionEngine {
    /// Machine learning weights for server selection
    selection_weights: Arc<RwLock<SelectionWeights>>,
}

impl ProjectSelectionEngine {
    fn new() -> Self {
        ProjectSelectionEngine {
            selection_weights: Arc::new(RwLock::new(SelectionWeights::default())),
        }
    }
    
    /// Select best servers for a project context
    async fn select_best_servers(&self, project_context: &ProjectContext, available_servers: &[McpServerInfo]) -> Result<Vec<McpServerInfo>> {
        let weights = self.selection_weights.read().await;
        
        let mut scored_servers = Vec::new();
        
        for server in available_servers {
            let score = self.calculate_selection_score(project_context, server, &weights).await;
            scored_servers.push((server.clone(), score));
        }
        
        // Sort by score and take top servers
        scored_servers.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        let selected_servers = scored_servers
            .into_iter()
            .take(5) // Limit to top 5 servers
            .filter(|(_, score)| *score > 0.3) // Minimum relevance threshold
            .map(|(server, _)| server)
            .collect();
        
        Ok(selected_servers)
    }
    
    /// Rank capabilities for a project context
    async fn rank_capabilities_for_project(&self, project_context: &ProjectContext, capabilities: &[McpCapability]) -> Vec<McpCapability> {
        let weights = self.selection_weights.read().await;
        
        let mut scored_capabilities = Vec::new();
        
        for capability in capabilities {
            let score = self.calculate_capability_score(project_context, capability, &weights);
            scored_capabilities.push((capability.clone(), score));
        }
        
        // Sort by score and remove duplicates
        scored_capabilities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        let mut unique_capabilities = Vec::new();
        let mut seen_names = std::collections::HashSet::new();
        
        for (capability, _) in scored_capabilities {
            if seen_names.insert(capability.name.clone()) {
                unique_capabilities.push(capability);
            }
        }
        
        unique_capabilities
    }
    
    /// Update selection weights based on feedback
    async fn update_with_feedback(&self, project_context: &ProjectContext, server_id: &str, feedback: ServerUsageFeedback) -> Result<()> {
        let mut weights = self.selection_weights.write().await;
        
        // Update weights based on feedback (simplified machine learning)
        match feedback {
            ServerUsageFeedback::Success { usefulness_score } => {
                weights.success_weight += 0.01 * usefulness_score;
            }
            ServerUsageFeedback::Failure => {
                weights.success_weight = (weights.success_weight - 0.01).max(0.0);
            }
            ServerUsageFeedback::NotUsed => {
                weights.relevance_weight = (weights.relevance_weight - 0.005).max(0.0);
            }
        }
        
        Ok(())
    }
    
    /// Calculate selection score for a server
    async fn calculate_selection_score(&self, project_context: &ProjectContext, server: &McpServerInfo, weights: &SelectionWeights) -> f64 {
        let mut score = 0.0;
        
        // Language match
        if server.languages.contains(&project_context.primary_language) {
            score += weights.language_weight;
        }
        
        // Framework match
        let framework_matches = project_context.frameworks.iter()
            .filter(|framework| server.frameworks.contains(framework))
            .count();
        
        if framework_matches > 0 {
            score += weights.framework_weight * (framework_matches as f64 / project_context.frameworks.len().max(1) as f64);
        }
        
        // Project type match
        if server.project_types.contains(&project_context.project_type) {
            score += weights.project_type_weight;
        }
        
        // Capability relevance
        let capability_score = self.calculate_capability_relevance(project_context, &server.capabilities);
        score += weights.capability_weight * capability_score;
        
        score
    }
    
    /// Calculate capability relevance score
    fn calculate_capability_relevance(&self, project_context: &ProjectContext, capabilities: &[McpCapability]) -> f64 {
        let project_type = &project_context.project_type;
        let language = &project_context.primary_language;
        
        let mut relevance = 0.0;
        
        for capability in capabilities {
            match capability.tool_type {
                McpToolType::CodeAnalysis => {
                    relevance += 0.8; // Always useful
                }
                McpToolType::Testing => {
                    relevance += 0.6; // Generally useful
                }
                McpToolType::Documentation => {
                    relevance += 0.4; // Moderately useful
                }
                McpToolType::Deployment if project_type == "web" || project_type == "api" => {
                    relevance += 0.7; // Very useful for web/api projects
                }
                McpToolType::DatabaseQuery if project_type == "api" || project_type == "web" => {
                    relevance += 0.6; // Useful for data-driven projects
                }
                _ => {
                    relevance += 0.2; // Some baseline relevance
                }
            }
        }
        
        // Normalize by number of capabilities
        if !capabilities.is_empty() {
            relevance / capabilities.len() as f64
        } else {
            0.0
        }
    }
    
    /// Calculate capability score for ranking
    fn calculate_capability_score(&self, project_context: &ProjectContext, capability: &McpCapability, weights: &SelectionWeights) -> f64 {
        let base_score = match capability.tool_type {
            McpToolType::CodeAnalysis => 0.9,
            McpToolType::Testing => 0.8,
            McpToolType::Documentation => 0.6,
            McpToolType::Deployment => 0.7,
            McpToolType::DatabaseQuery => 0.5,
            _ => 0.3,
        };
        
        // Adjust based on project context
        let context_multiplier = match (&capability.tool_type, project_context.project_type.as_str()) {
            (McpToolType::Deployment, "web") => 1.5,
            (McpToolType::DatabaseQuery, "api") => 1.4,
            (McpToolType::Testing, _) => 1.2,
            _ => 1.0,
        };
        
        base_score * context_multiplier * weights.capability_weight
    }
}

/// Project recommendations for specific project patterns
#[derive(Debug, Clone)]
pub struct ProjectRecommendations {
    pub project_signature: String,
    pub recommended_servers: Vec<ServerRecommendation>,
    pub capability_priorities: HashMap<String, f64>,
    pub confidence_score: f64,
    pub last_updated: DateTime<Utc>,
}

/// Server recommendation with relevance scoring
#[derive(Debug, Clone)]
pub struct ServerRecommendation {
    pub server_id: String,
    pub server_name: String,
    pub relevance_score: f64,
    pub recommended_capabilities: Vec<String>,
}

/// Server usage feedback for machine learning
#[derive(Debug, Clone)]
pub enum ServerUsageFeedback {
    Success { usefulness_score: f64 },
    Failure,
    NotUsed,
}

/// Usage analytics for optimization
#[derive(Debug, Default)]
struct UsageAnalytics {
    total_selections: usize,
    project_patterns: HashMap<String, ProjectPatternAnalytics>,
}

impl UsageAnalytics {
    fn record_selection(&mut self, record: SelectionRecord) {
        self.total_selections += 1;
        
        let pattern_analytics = self.project_patterns
            .entry(record.project_pattern.clone())
            .or_insert_with(|| ProjectPatternAnalytics {
                project_pattern: record.project_pattern.clone(),
                selection_count: 0,
                server_usage: HashMap::new(),
            });
        
        pattern_analytics.selection_count += 1;
        
        for server_id in record.selected_servers {
            let server_analytics = pattern_analytics.server_usage
                .entry(server_id)
                .or_insert_with(ServerAnalytics::default);
            
            server_analytics.usage_count += 1;
        }
    }
    
    fn record_feedback(&mut self, project_context: &ProjectContext, server_id: &str, feedback: ServerUsageFeedback) {
        let project_pattern = format!("{}:{}", project_context.primary_language, project_context.project_type);
        
        if let Some(pattern_analytics) = self.project_patterns.get_mut(&project_pattern) {
            if let Some(server_analytics) = pattern_analytics.server_usage.get_mut(server_id) {
                server_analytics.feedback_count += 1;
                
                match feedback {
                    ServerUsageFeedback::Success { .. } => {
                        server_analytics.success_count += 1;
                    }
                    _ => {}
                }
                
                server_analytics.success_rate = server_analytics.success_count as f64 / server_analytics.feedback_count as f64;
            }
        }
    }
    
    fn calculate_avg_servers_per_project(&self) -> f64 {
        if self.project_patterns.is_empty() {
            0.0
        } else {
            let total_servers: usize = self.project_patterns.values()
                .map(|p| p.server_usage.len())
                .sum();
            total_servers as f64 / self.project_patterns.len() as f64
        }
    }
    
    fn calculate_success_rate(&self) -> f64 {
        let mut total_feedback = 0;
        let mut total_success = 0;
        
        for pattern in self.project_patterns.values() {
            for server in pattern.server_usage.values() {
                total_feedback += server.feedback_count;
                total_success += server.success_count;
            }
        }
        
        if total_feedback == 0 {
            0.0
        } else {
            total_success as f64 / total_feedback as f64
        }
    }
}

/// Analytics for a specific project pattern
#[derive(Debug)]
struct ProjectPatternAnalytics {
    project_pattern: String,
    selection_count: usize,
    server_usage: HashMap<String, ServerAnalytics>,
}

impl ProjectPatternAnalytics {
    fn calculate_confidence(&self) -> f64 {
        // Confidence based on number of selections and success rates
        let selection_confidence = (self.selection_count as f64 / 10.0).min(1.0);
        let success_confidence = if self.server_usage.is_empty() {
            0.0
        } else {
            let avg_success_rate = self.server_usage.values()
                .map(|s| s.success_rate)
                .sum::<f64>() / self.server_usage.len() as f64;
            avg_success_rate
        };
        
        (selection_confidence * 0.4) + (success_confidence * 0.6)
    }
}

/// Analytics for a specific server
#[derive(Debug, Default)]
struct ServerAnalytics {
    usage_count: usize,
    feedback_count: usize,
    success_count: usize,
    success_rate: f64,
}

/// Selection record for analytics
#[derive(Debug)]
struct SelectionRecord {
    project_pattern: String,
    selected_servers: Vec<String>,
    timestamp: DateTime<Utc>,
}

/// Machine learning weights for server selection
#[derive(Debug)]
struct SelectionWeights {
    language_weight: f64,
    framework_weight: f64,
    project_type_weight: f64,
    capability_weight: f64,
    success_weight: f64,
    relevance_weight: f64,
}

impl Default for SelectionWeights {
    fn default() -> Self {
        SelectionWeights {
            language_weight: 0.4,
            framework_weight: 0.3,
            project_type_weight: 0.2,
            capability_weight: 0.25,
            success_weight: 0.8,
            relevance_weight: 0.7,
        }
    }
}

/// Project selection statistics
#[derive(Debug, Clone)]
pub struct ProjectSelectionStats {
    pub total_selections: usize,
    pub unique_projects: usize,
    pub avg_servers_per_project: f64,
    pub success_rate: f64,
    pub last_updated: DateTime<Utc>,
}

/// Default implementation for easy instantiation
impl Default for ProjectAwareRegistry {
    fn default() -> Self {
        Self::new()
    }
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
    async fn test_project_aware_registry_creation() {
        let registry = ProjectAwareRegistry::new();
        let stats = registry.get_selection_statistics().await;
        assert_eq!(stats.total_selections, 0);
    }
    
    #[tokio::test]
    async fn test_server_registration() {
        let registry = ProjectAwareRegistry::new();
        let server = create_test_server("test1", "Test Server", vec!["Rust".to_string()], vec!["Tauri".to_string()]);
        
        registry.register_server(server).await.unwrap();
        
        // Should now have recommendations for Rust:Tauri projects
        let recommendations = registry.get_project_recommendations("Rust:Tauri").await;
        assert!(recommendations.is_some());
    }
    
    #[tokio::test]
    async fn test_project_server_selection() {
        let registry = ProjectAwareRegistry::new();
        let project_context = create_test_project_context();
        
        // Register relevant and irrelevant servers
        let rust_server = create_test_server("rust1", "Rust Server", vec!["Rust".to_string()], vec!["Tauri".to_string()]);
        let js_server = create_test_server("js1", "JS Server", vec!["JavaScript".to_string()], vec!["React".to_string()]);
        
        registry.register_server(rust_server).await.unwrap();
        registry.register_server(js_server).await.unwrap();
        
        let selected_servers = registry.find_servers_for_project(&project_context).await.unwrap();
        
        // Should prefer Rust server for Rust project
        assert!(!selected_servers.is_empty());
        assert_eq!(selected_servers[0].name, "Rust Server");
    }
    
    #[tokio::test]
    async fn test_capability_recommendations() {
        let registry = ProjectAwareRegistry::new();
        let project_context = create_test_project_context();
        
        let server = create_test_server("test1", "Test Server", vec!["Rust".to_string()], vec![]);
        registry.register_server(server).await.unwrap();
        
        let capabilities = registry.get_recommended_capabilities(&project_context).await;
        assert!(!capabilities.is_empty());
    }
}