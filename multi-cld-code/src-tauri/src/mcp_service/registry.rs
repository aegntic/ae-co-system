/// MCP Registry for CCTM Phase 2C.1
/// 
/// Central catalog of discovered MCP servers with capabilities, status tracking,
/// and intelligent server selection based on project context

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use anyhow::Result;

use super::{McpServerInfo, McpServerStatus, ProjectContext};

/// Central registry for MCP servers
#[derive(Debug)]
pub struct McpRegistry {
    /// Map of server ID to server information
    servers: Arc<RwLock<HashMap<String, McpServerInfo>>>,
    /// Index for fast capability-based lookups
    capability_index: Arc<RwLock<HashMap<String, Vec<String>>>>,
    /// Index for fast language-based lookups
    language_index: Arc<RwLock<HashMap<String, Vec<String>>>>,
    /// Index for fast framework-based lookups
    framework_index: Arc<RwLock<HashMap<String, Vec<String>>>>,
}

impl McpRegistry {
    /// Create a new MCP registry
    pub fn new() -> Self {
        McpRegistry {
            servers: Arc::new(RwLock::new(HashMap::new())),
            capability_index: Arc::new(RwLock::new(HashMap::new())),
            language_index: Arc::new(RwLock::new(HashMap::new())),
            framework_index: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Register a new MCP server in the registry
    pub async fn register_server(&self, server_info: McpServerInfo) -> Result<()> {
        let server_id = server_info.id.clone();
        
        log::info!("Registering MCP server: {} ({})", server_info.name, server_id);
        
        // Update capability index
        {
            let mut capability_index = self.capability_index.write().await;
            for capability in &server_info.capabilities {
                capability_index
                    .entry(capability.name.clone())
                    .or_insert_with(Vec::new)
                    .push(server_id.clone());
            }
        }
        
        // Update language index
        {
            let mut language_index = self.language_index.write().await;
            for language in &server_info.languages {
                language_index
                    .entry(language.clone())
                    .or_insert_with(Vec::new)
                    .push(server_id.clone());
            }
        }
        
        // Update framework index
        {
            let mut framework_index = self.framework_index.write().await;
            for framework in &server_info.frameworks {
                framework_index
                    .entry(framework.clone())
                    .or_insert_with(Vec::new)
                    .push(server_id.clone());
            }
        }
        
        // Register the server
        {
            let mut servers = self.servers.write().await;
            servers.insert(server_id.clone(), server_info);
        }
        
        log::debug!("Successfully registered MCP server: {}", server_id);
        Ok(())
    }
    
    /// Unregister an MCP server from the registry
    pub async fn unregister_server(&self, server_id: &str) -> Result<()> {
        log::info!("Unregistering MCP server: {}", server_id);
        
        // Remove from main registry and get server info for cleanup
        let server_info = {
            let mut servers = self.servers.write().await;
            servers.remove(server_id)
        };
        
        if let Some(server_info) = server_info {
            // Clean up capability index
            {
                let mut capability_index = self.capability_index.write().await;
                for capability in &server_info.capabilities {
                    if let Some(server_list) = capability_index.get_mut(&capability.name) {
                        server_list.retain(|id| id != server_id);
                        if server_list.is_empty() {
                            capability_index.remove(&capability.name);
                        }
                    }
                }
            }
            
            // Clean up language index
            {
                let mut language_index = self.language_index.write().await;
                for language in &server_info.languages {
                    if let Some(server_list) = language_index.get_mut(language) {
                        server_list.retain(|id| id != server_id);
                        if server_list.is_empty() {
                            language_index.remove(language);
                        }
                    }
                }
            }
            
            // Clean up framework index
            {
                let mut framework_index = self.framework_index.write().await;
                for framework in &server_info.frameworks {
                    if let Some(server_list) = framework_index.get_mut(framework) {
                        server_list.retain(|id| id != server_id);
                        if server_list.is_empty() {
                            framework_index.remove(framework);
                        }
                    }
                }
            }
            
            log::debug!("Successfully unregistered MCP server: {}", server_id);
        } else {
            log::warn!("Attempted to unregister unknown MCP server: {}", server_id);
        }
        
        Ok(())
    }
    
    /// Update the status of an MCP server
    pub async fn update_server_status(&self, server_id: &str, status: McpServerStatus) -> Result<()> {
        let mut servers = self.servers.write().await;
        
        if let Some(server_info) = servers.get_mut(server_id) {
            server_info.status = status;
            server_info.last_seen = Utc::now();
            log::debug!("Updated status for MCP server {}: {:?}", server_id, server_info.status);
        } else {
            log::warn!("Attempted to update status for unknown MCP server: {}", server_id);
        }
        
        Ok(())
    }
    
    /// Get information about a specific MCP server
    pub async fn get_server(&self, server_id: &str) -> Option<McpServerInfo> {
        let servers = self.servers.read().await;
        servers.get(server_id).cloned()
    }
    
    /// List all registered MCP servers
    pub async fn list_servers(&self) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        servers.values().cloned().collect()
    }
    
    /// List servers with a specific status
    pub async fn list_servers_by_status(&self, status: McpServerStatus) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        servers
            .values()
            .filter(|server| server.status == status)
            .cloned()
            .collect()
    }
    
    /// Find MCP servers relevant to a project context
    pub async fn find_relevant_servers(&self, project_context: &ProjectContext) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        let language_index = self.language_index.read().await;
        let framework_index = self.framework_index.read().await;
        
        let mut relevant_server_ids = std::collections::HashSet::new();
        
        // Find servers that support the primary language
        if let Some(server_list) = language_index.get(&project_context.primary_language) {
            relevant_server_ids.extend(server_list.iter().cloned());
        }
        
        // Find servers that support the project frameworks
        for framework in &project_context.frameworks {
            if let Some(server_list) = framework_index.get(framework) {
                relevant_server_ids.extend(server_list.iter().cloned());
            }
        }
        
        // If no specific matches, include generic servers (those with empty language/framework lists)
        if relevant_server_ids.is_empty() {
            for (server_id, server_info) in servers.iter() {
                if server_info.languages.is_empty() && server_info.frameworks.is_empty() {
                    relevant_server_ids.insert(server_id.clone());
                }
            }
        }
        
        // Collect server information for relevant servers
        let mut relevant_servers: Vec<McpServerInfo> = relevant_server_ids
            .iter()
            .filter_map(|server_id| servers.get(server_id).cloned())
            .collect();
        
        // Sort by relevance score (more specific matches first)
        relevant_servers.sort_by(|a, b| {
            let score_a = self.calculate_relevance_score(a, project_context);
            let score_b = self.calculate_relevance_score(b, project_context);
            score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
        });
        
        log::info!(
            "Found {} relevant MCP servers for project: {} ({})",
            relevant_servers.len(),
            project_context.project_path.display(),
            project_context.primary_language
        );
        
        relevant_servers
    }
    
    /// Find servers that provide a specific capability
    pub async fn find_servers_by_capability(&self, capability_name: &str) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        let capability_index = self.capability_index.read().await;
        
        let mut matching_servers = Vec::new();
        
        if let Some(server_list) = capability_index.get(capability_name) {
            for server_id in server_list {
                if let Some(server_info) = servers.get(server_id) {
                    matching_servers.push(server_info.clone());
                }
            }
        }
        
        matching_servers
    }
    
    /// Find servers that support a specific language
    pub async fn find_servers_by_language(&self, language: &str) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        let language_index = self.language_index.read().await;
        
        let mut matching_servers = Vec::new();
        
        if let Some(server_list) = language_index.get(language) {
            for server_id in server_list {
                if let Some(server_info) = servers.get(server_id) {
                    matching_servers.push(server_info.clone());
                }
            }
        }
        
        matching_servers
    }
    
    /// Find servers that support a specific framework
    pub async fn find_servers_by_framework(&self, framework: &str) -> Vec<McpServerInfo> {
        let servers = self.servers.read().await;
        let framework_index = self.framework_index.read().await;
        
        let mut matching_servers = Vec::new();
        
        if let Some(server_list) = framework_index.get(framework) {
            for server_id in server_list {
                if let Some(server_info) = servers.get(server_id) {
                    matching_servers.push(server_info.clone());
                }
            }
        }
        
        matching_servers
    }
    
    /// Get the total number of registered servers
    pub async fn server_count(&self) -> usize {
        let servers = self.servers.read().await;
        servers.len()
    }
    
    /// Get registry statistics
    pub async fn get_statistics(&self) -> McpRegistryStatistics {
        let servers = self.servers.read().await;
        let capability_index = self.capability_index.read().await;
        let language_index = self.language_index.read().await;
        let framework_index = self.framework_index.read().await;
        
        let mut status_counts = HashMap::new();
        for server in servers.values() {
            *status_counts.entry(server.status.clone()).or_insert(0) += 1;
        }
        
        McpRegistryStatistics {
            total_servers: servers.len(),
            status_counts,
            unique_capabilities: capability_index.len(),
            unique_languages: language_index.len(),
            unique_frameworks: framework_index.len(),
            last_updated: Utc::now(),
        }
    }
    
    /// Clear all registered servers (useful for testing or reset)
    pub async fn clear(&self) -> Result<()> {
        log::warn!("Clearing MCP registry - all registered servers will be removed");
        
        {
            let mut servers = self.servers.write().await;
            servers.clear();
        }
        
        {
            let mut capability_index = self.capability_index.write().await;
            capability_index.clear();
        }
        
        {
            let mut language_index = self.language_index.write().await;
            language_index.clear();
        }
        
        {
            let mut framework_index = self.framework_index.write().await;
            framework_index.clear();
        }
        
        Ok(())
    }
    
    // Private helper methods
    
    /// Calculate relevance score for a server given project context
    fn calculate_relevance_score(&self, server: &McpServerInfo, project_context: &ProjectContext) -> f64 {
        let mut score = 0.0;
        
        // Language match scoring
        if server.languages.contains(&project_context.primary_language) {
            score += 10.0;
        }
        
        // Framework match scoring
        for framework in &project_context.frameworks {
            if server.frameworks.contains(framework) {
                score += 5.0;
            }
        }
        
        // Project type match scoring
        if server.project_types.contains(&project_context.project_type) {
            score += 3.0;
        }
        
        // Generic servers get lower scores
        if server.languages.is_empty() && server.frameworks.is_empty() && server.project_types.is_empty() {
            score += 1.0;
        }
        
        // Status bonus (prefer running servers)
        match server.status {
            McpServerStatus::Running => score += 2.0,
            McpServerStatus::Discovered => score += 1.0,
            _ => {}
        }
        
        score
    }
}

/// Registry statistics for monitoring
#[derive(Debug, Clone)]
pub struct McpRegistryStatistics {
    pub total_servers: usize,
    pub status_counts: HashMap<McpServerStatus, usize>,
    pub unique_capabilities: usize,
    pub unique_languages: usize,
    pub unique_frameworks: usize,
    pub last_updated: DateTime<Utc>,
}

/// Default implementation for easy instantiation
impl Default for McpRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp_service::{McpCapability, McpToolType};
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
                    tool_type: McpToolType::Other("test".to_string()),
                    input_schema: None,
                    output_schema: None,
                }
            ],
            project_types: vec![],
            languages,
            frameworks,
            status: McpServerStatus::Discovered,
            last_seen: Utc::now(),
        }
    }
    
    #[tokio::test]
    async fn test_registry_creation() {
        let registry = McpRegistry::new();
        assert_eq!(registry.server_count().await, 0);
    }
    
    #[tokio::test]
    async fn test_server_registration() {
        let registry = McpRegistry::new();
        let server = create_test_server("test1", "Test Server", vec!["Rust".to_string()], vec![]);
        
        registry.register_server(server).await.unwrap();
        assert_eq!(registry.server_count().await, 1);
        
        let servers = registry.list_servers().await;
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "Test Server");
    }
    
    #[tokio::test]
    async fn test_server_unregistration() {
        let registry = McpRegistry::new();
        let server = create_test_server("test1", "Test Server", vec!["Rust".to_string()], vec![]);
        
        registry.register_server(server).await.unwrap();
        assert_eq!(registry.server_count().await, 1);
        
        registry.unregister_server("test1").await.unwrap();
        assert_eq!(registry.server_count().await, 0);
    }
    
    #[tokio::test]
    async fn test_find_servers_by_language() {
        let registry = McpRegistry::new();
        
        let rust_server = create_test_server("rust1", "Rust Server", vec!["Rust".to_string()], vec![]);
        let js_server = create_test_server("js1", "JS Server", vec!["JavaScript".to_string()], vec![]);
        
        registry.register_server(rust_server).await.unwrap();
        registry.register_server(js_server).await.unwrap();
        
        let rust_servers = registry.find_servers_by_language("Rust").await;
        assert_eq!(rust_servers.len(), 1);
        assert_eq!(rust_servers[0].name, "Rust Server");
        
        let js_servers = registry.find_servers_by_language("JavaScript").await;
        assert_eq!(js_servers.len(), 1);
        assert_eq!(js_servers[0].name, "JS Server");
    }
    
    #[tokio::test]
    async fn test_relevant_servers_for_project() {
        let registry = McpRegistry::new();
        
        let rust_server = create_test_server("rust1", "Rust Server", vec!["Rust".to_string()], vec!["Tauri".to_string()]);
        let js_server = create_test_server("js1", "JS Server", vec!["JavaScript".to_string()], vec!["React".to_string()]);
        let generic_server = create_test_server("generic1", "Generic Server", vec![], vec![]);
        
        registry.register_server(rust_server).await.unwrap();
        registry.register_server(js_server).await.unwrap();
        registry.register_server(generic_server).await.unwrap();
        
        let project_context = ProjectContext {
            project_path: PathBuf::from("/test/rust-project"),
            primary_language: "Rust".to_string(),
            frameworks: vec!["Tauri".to_string()],
            project_type: "desktop".to_string(),
            dependencies: vec![],
        };
        
        let relevant_servers = registry.find_relevant_servers(&project_context).await;
        assert!(!relevant_servers.is_empty());
        assert_eq!(relevant_servers[0].name, "Rust Server"); // Should be first due to higher relevance
    }
}