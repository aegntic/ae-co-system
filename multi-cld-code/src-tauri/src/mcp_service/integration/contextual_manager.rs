/// ContextualMcpManager for CCTM Phase 2C.3.2
/// 
/// Manages MCP server lifecycle based on project context changes.
/// Provides intelligent server startup/shutdown, resource optimization,
/// and context-aware server pool management.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use crate::mcp_service::{McpServiceConfig, McpServerInfo, McpServerStatus, ProjectContext};

/// Contextual MCP Manager - Project-aware server lifecycle management
#[derive(Debug)]
pub struct ContextualMcpManager {
    config: McpServiceConfig,
    /// Active server contexts by terminal
    active_contexts: Arc<RwLock<HashMap<String, TerminalMcpContext>>>,
    /// Server pool management
    server_pool: Arc<RwLock<McpServerPool>>,
    /// Resource optimization engine
    resource_optimizer: ResourceOptimizer,
}

impl ContextualMcpManager {
    /// Create a new Contextual MCP Manager
    pub fn new(config: McpServiceConfig) -> Result<Self> {
        let server_pool = Arc::new(RwLock::new(McpServerPool::new(config.clone())));
        let resource_optimizer = ResourceOptimizer::new(config.clone());
        
        log::info!("ContextualMcpManager initialized with max {} concurrent servers", 
                  config.max_concurrent_servers);
        
        Ok(ContextualMcpManager {
            config,
            active_contexts: Arc::new(RwLock::new(HashMap::new())),
            server_pool,
            resource_optimizer,
        })
    }
    
    /// Initialize the contextual manager
    pub async fn initialize(&self) -> Result<()> {
        log::info!("ContextualMcpManager initialized successfully");
        Ok(())
    }
    
    /// Manage MCP servers for a project context
    pub async fn manage_project_servers(
        &self,
        terminal_id: &str,
        project_context: &ProjectContext,
        relevant_servers: &[McpServerInfo]
    ) -> Result<ContextManagementResult> {
        log::debug!("Managing MCP servers for terminal {} in {} project", 
                   terminal_id, project_context.primary_language);
        
        let start_time = std::time::Instant::now();
        
        // Get or create terminal context
        let mut context_result = self.get_or_create_terminal_context(terminal_id, project_context).await?;
        
        // Determine servers to start/stop/keep
        let management_plan = self.create_management_plan(terminal_id, project_context, relevant_servers).await?;
        
        // Execute management plan
        let execution_result = self.execute_management_plan(terminal_id, &management_plan).await?;
        
        // Update terminal context
        self.update_terminal_context(terminal_id, &execution_result).await?;
        
        // Optimize resource usage
        self.resource_optimizer.optimize_server_allocation().await?;
        
        let management_time = start_time.elapsed().as_millis() as u64;
        
        log::info!("Server management complete for terminal {}: {}/{} servers active in {}ms",
                  terminal_id, execution_result.active_servers.len(), relevant_servers.len(), management_time);
        
        Ok(ContextManagementResult {
            terminal_id: terminal_id.to_string(),
            active_servers: execution_result.active_servers,
            started_servers: execution_result.started_servers,
            stopped_servers: execution_result.stopped_servers,
            management_time_ms: management_time,
        })
    }
    
    /// Handle project context change for a terminal
    pub async fn handle_context_change(
        &self,
        terminal_id: &str,
        new_context: &ProjectContext,
        change_type: ContextChangeType
    ) -> Result<()> {
        log::debug!("Handling context change for terminal {}: {:?}", terminal_id, change_type);
        
        match change_type {
            ContextChangeType::DirectoryChange => {
                // Major context change - may need to restart servers
                self.handle_directory_change(terminal_id, new_context).await?;
            }
            ContextChangeType::FileChange => {
                // Minor context change - may need to reconfigure servers
                self.handle_file_change(terminal_id, new_context).await?;
            }
            ContextChangeType::DependencyChange => {
                // Dependency change - may need to restart relevant servers
                self.handle_dependency_change(terminal_id, new_context).await?;
            }
        }
        
        Ok(())
    }
    
    /// Deactivate servers for a terminal
    pub async fn deactivate_terminal_servers(&self, terminal_id: &str, server_ids: &[String]) -> Result<()> {
        log::info!("Deactivating {} servers for terminal {}", server_ids.len(), terminal_id);
        
        // Remove terminal context
        {
            let mut active_contexts = self.active_contexts.write().await;
            active_contexts.remove(terminal_id);
        }
        
        // Stop servers in the pool
        let mut server_pool = self.server_pool.write().await;
        for server_id in server_ids {
            server_pool.release_server(server_id, terminal_id).await?;
        }
        
        Ok(())
    }
    
    /// Get management statistics
    pub async fn get_management_statistics(&self) -> ContextualManagementStats {
        let active_contexts = self.active_contexts.read().await;
        let server_pool = self.server_pool.read().await;
        
        ContextualManagementStats {
            active_terminals: active_contexts.len(),
            total_managed_servers: server_pool.get_active_server_count(),
            pool_utilization: server_pool.get_utilization_percentage(),
            last_updated: Utc::now(),
        }
    }
    
    // Private implementation methods
    
    /// Get or create terminal context
    async fn get_or_create_terminal_context(&self, terminal_id: &str, project_context: &ProjectContext) -> Result<TerminalMcpContext> {
        let mut active_contexts = self.active_contexts.write().await;
        
        if let Some(existing_context) = active_contexts.get(terminal_id) {
            Ok(existing_context.clone())
        } else {
            let new_context = TerminalMcpContext {
                terminal_id: terminal_id.to_string(),
                project_context: project_context.clone(),
                active_servers: Vec::new(),
                last_context_change: Utc::now(),
                resource_usage: ContextResourceUsage::default(),
            };
            
            active_contexts.insert(terminal_id.to_string(), new_context.clone());
            Ok(new_context)
        }
    }
    
    /// Create management plan for server lifecycle
    async fn create_management_plan(&self, terminal_id: &str, project_context: &ProjectContext, relevant_servers: &[McpServerInfo]) -> Result<ManagementPlan> {
        let current_context = {
            let active_contexts = self.active_contexts.read().await;
            active_contexts.get(terminal_id).cloned()
        };
        
        let current_servers = current_context
            .map(|ctx| ctx.active_servers)
            .unwrap_or_default();
        
        let desired_servers: Vec<String> = relevant_servers
            .iter()
            .map(|server| format!("{}:{}", server.id, terminal_id))
            .collect();
        
        // Determine servers to start, stop, and keep
        let servers_to_start: Vec<String> = desired_servers
            .iter()
            .filter(|server_id| !current_servers.contains(server_id))
            .cloned()
            .collect();
        
        let servers_to_stop: Vec<String> = current_servers
            .iter()
            .filter(|server_id| !desired_servers.contains(server_id))
            .cloned()
            .collect();
        
        let servers_to_keep: Vec<String> = current_servers
            .iter()
            .filter(|server_id| desired_servers.contains(server_id))
            .cloned()
            .collect();
        
        Ok(ManagementPlan {
            terminal_id: terminal_id.to_string(),
            servers_to_start,
            servers_to_stop,
            servers_to_keep,
            project_context: project_context.clone(),
        })
    }
    
    /// Execute management plan
    async fn execute_management_plan(&self, terminal_id: &str, plan: &ManagementPlan) -> Result<ManagementExecutionResult> {
        let mut started_servers = Vec::new();
        let mut stopped_servers = Vec::new();
        let mut active_servers = plan.servers_to_keep.clone();
        
        // Stop servers that are no longer needed
        for server_id in &plan.servers_to_stop {
            match self.stop_server(terminal_id, server_id).await {
                Ok(_) => {
                    stopped_servers.push(server_id.clone());
                    log::debug!("Stopped server {} for terminal {}", server_id, terminal_id);
                }
                Err(e) => {
                    log::warn!("Failed to stop server {} for terminal {}: {}", server_id, terminal_id, e);
                }
            }
        }
        
        // Start new servers
        for server_id in &plan.servers_to_start {
            match self.start_server(terminal_id, server_id, &plan.project_context).await {
                Ok(_) => {
                    started_servers.push(server_id.clone());
                    active_servers.push(server_id.clone());
                    log::debug!("Started server {} for terminal {}", server_id, terminal_id);
                }
                Err(e) => {
                    log::warn!("Failed to start server {} for terminal {}: {}", server_id, terminal_id, e);
                }
            }
        }
        
        Ok(ManagementExecutionResult {
            started_servers,
            stopped_servers,
            active_servers,
        })
    }
    
    /// Update terminal context after management
    async fn update_terminal_context(&self, terminal_id: &str, execution_result: &ManagementExecutionResult) -> Result<()> {
        let mut active_contexts = self.active_contexts.write().await;
        
        if let Some(context) = active_contexts.get_mut(terminal_id) {
            context.active_servers = execution_result.active_servers.clone();
            context.last_context_change = Utc::now();
        }
        
        Ok(())
    }
    
    /// Start a server in the pool
    async fn start_server(&self, terminal_id: &str, server_id: &str, project_context: &ProjectContext) -> Result<()> {
        let mut server_pool = self.server_pool.write().await;
        server_pool.acquire_server(server_id, terminal_id, project_context).await
    }
    
    /// Stop a server in the pool
    async fn stop_server(&self, terminal_id: &str, server_id: &str) -> Result<()> {
        let mut server_pool = self.server_pool.write().await;
        server_pool.release_server(server_id, terminal_id).await
    }
    
    /// Handle directory change context updates
    async fn handle_directory_change(&self, terminal_id: &str, new_context: &ProjectContext) -> Result<()> {
        log::info!("Handling directory change for terminal {} to {}", terminal_id, new_context.project_path.display());
        
        // Directory changes typically require full server restart
        // This would be implemented by triggering a new project analysis cycle
        
        Ok(())
    }
    
    /// Handle file change context updates
    async fn handle_file_change(&self, terminal_id: &str, new_context: &ProjectContext) -> Result<()> {
        log::debug!("Handling file change for terminal {}", terminal_id);
        
        // File changes might only require server reconfiguration
        // Could update server context without restarting
        
        Ok(())
    }
    
    /// Handle dependency change context updates
    async fn handle_dependency_change(&self, terminal_id: &str, new_context: &ProjectContext) -> Result<()> {
        log::info!("Handling dependency change for terminal {}", terminal_id);
        
        // Dependency changes might require restart of relevant servers
        // Could restart only servers that depend on the changed dependencies
        
        Ok(())
    }
}

/// MCP Server Pool for efficient resource management
#[derive(Debug)]
struct McpServerPool {
    config: McpServiceConfig,
    /// Active servers by server ID
    active_servers: HashMap<String, PooledServer>,
    /// Server allocation tracking
    allocations: HashMap<String, Vec<String>>, // server_id -> terminal_ids
}

impl McpServerPool {
    fn new(config: McpServiceConfig) -> Self {
        McpServerPool {
            config,
            active_servers: HashMap::new(),
            allocations: HashMap::new(),
        }
    }
    
    /// Acquire a server for a terminal
    async fn acquire_server(&mut self, server_id: &str, terminal_id: &str, project_context: &ProjectContext) -> Result<()> {
        // Check if server is already running
        if let Some(pooled_server) = self.active_servers.get_mut(server_id) {
            // Server exists, add terminal to allocation
            self.allocations.entry(server_id.to_string())
                .or_insert_with(Vec::new)
                .push(terminal_id.to_string());
            
            pooled_server.reference_count += 1;
            pooled_server.last_used = Utc::now();
            
            log::debug!("Reusing existing server {} for terminal {}", server_id, terminal_id);
        } else {
            // Start new server
            if self.active_servers.len() >= self.config.max_concurrent_servers {
                return Err(Error::msg("Maximum concurrent servers reached"));
            }
            
            let pooled_server = PooledServer {
                server_id: server_id.to_string(),
                project_context: project_context.clone(),
                reference_count: 1,
                started_at: Utc::now(),
                last_used: Utc::now(),
                status: McpServerStatus::Starting,
            };
            
            self.active_servers.insert(server_id.to_string(), pooled_server);
            self.allocations.insert(server_id.to_string(), vec![terminal_id.to_string()]);
            
            // TODO: Implement actual server startup
            log::debug!("Started new server {} for terminal {}", server_id, terminal_id);
        }
        
        Ok(())
    }
    
    /// Release a server from a terminal
    async fn release_server(&mut self, server_id: &str, terminal_id: &str) -> Result<()> {
        if let Some(pooled_server) = self.active_servers.get_mut(server_id) {
            pooled_server.reference_count = pooled_server.reference_count.saturating_sub(1);
            
            // Remove terminal from allocations
            if let Some(terminals) = self.allocations.get_mut(server_id) {
                terminals.retain(|id| id != terminal_id);
                
                // If no more terminals using this server, consider stopping it
                if terminals.is_empty() {
                    self.allocations.remove(server_id);
                    
                    // TODO: Implement intelligent server shutdown (maybe keep alive for a while)
                    self.active_servers.remove(server_id);
                    log::debug!("Stopped unused server {}", server_id);
                }
            }
        }
        
        Ok(())
    }
    
    fn get_active_server_count(&self) -> usize {
        self.active_servers.len()
    }
    
    fn get_utilization_percentage(&self) -> f64 {
        if self.config.max_concurrent_servers == 0 {
            0.0
        } else {
            (self.active_servers.len() as f64 / self.config.max_concurrent_servers as f64) * 100.0
        }
    }
}

/// Resource optimizer for efficient server management
#[derive(Debug)]
struct ResourceOptimizer {
    config: McpServiceConfig,
}

impl ResourceOptimizer {
    fn new(config: McpServiceConfig) -> Self {
        ResourceOptimizer { config }
    }
    
    /// Optimize server allocation across terminals
    async fn optimize_server_allocation(&self) -> Result<()> {
        // TODO: Implement resource optimization algorithms
        // Could include:
        // - Load balancing across servers
        // - Memory/CPU optimization
        // - Preemptive server shutdown/startup
        // - Server consolidation
        
        Ok(())
    }
}

/// Terminal MCP context tracking
#[derive(Debug, Clone)]
struct TerminalMcpContext {
    terminal_id: String,
    project_context: ProjectContext,
    active_servers: Vec<String>,
    last_context_change: DateTime<Utc>,
    resource_usage: ContextResourceUsage,
}

/// Pooled server information
#[derive(Debug, Clone)]
struct PooledServer {
    server_id: String,
    project_context: ProjectContext,
    reference_count: usize,
    started_at: DateTime<Utc>,
    last_used: DateTime<Utc>,
    status: McpServerStatus,
}

/// Context resource usage tracking
#[derive(Debug, Clone, Default)]
struct ContextResourceUsage {
    memory_mb: f64,
    cpu_percent: f64,
    active_connections: usize,
}

/// Management plan for server lifecycle
#[derive(Debug, Clone)]
struct ManagementPlan {
    terminal_id: String,
    servers_to_start: Vec<String>,
    servers_to_stop: Vec<String>,
    servers_to_keep: Vec<String>,
    project_context: ProjectContext,
}

/// Management execution result
#[derive(Debug, Clone)]
struct ManagementExecutionResult {
    started_servers: Vec<String>,
    stopped_servers: Vec<String>,
    active_servers: Vec<String>,
}

/// Context management result
#[derive(Debug, Clone)]
pub struct ContextManagementResult {
    pub terminal_id: String,
    pub active_servers: Vec<String>,
    pub started_servers: Vec<String>,
    pub stopped_servers: Vec<String>,
    pub management_time_ms: u64,
}

/// Types of context changes
#[derive(Debug, Clone)]
pub enum ContextChangeType {
    DirectoryChange,
    FileChange,
    DependencyChange,
}

/// Contextual management statistics
#[derive(Debug, Clone)]
pub struct ContextualManagementStats {
    pub active_terminals: usize,
    pub total_managed_servers: usize,
    pub pool_utilization: f64,
    pub last_updated: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    
    fn create_test_project_context() -> ProjectContext {
        ProjectContext {
            project_path: PathBuf::from("/test/project"),
            primary_language: "Rust".to_string(),
            frameworks: vec!["Tauri".to_string()],
            project_type: "desktop".to_string(),
            dependencies: vec![],
        }
    }
    
    #[tokio::test]
    async fn test_contextual_manager_creation() {
        let config = McpServiceConfig::default();
        let manager = ContextualMcpManager::new(config).unwrap();
        
        let stats = manager.get_management_statistics().await;
        assert_eq!(stats.active_terminals, 0);
    }
    
    #[tokio::test]
    async fn test_server_pool_management() {
        let mut pool = McpServerPool::new(McpServiceConfig::default());
        let project_context = create_test_project_context();
        
        // Acquire server
        pool.acquire_server("server1", "terminal1", &project_context).await.unwrap();
        assert_eq!(pool.get_active_server_count(), 1);
        
        // Release server
        pool.release_server("server1", "terminal1").await.unwrap();
        assert_eq!(pool.get_active_server_count(), 0);
    }
    
    #[tokio::test]
    async fn test_context_change_handling() {
        let config = McpServiceConfig::default();
        let manager = ContextualMcpManager::new(config).unwrap();
        let project_context = create_test_project_context();
        
        manager.handle_context_change("terminal1", &project_context, ContextChangeType::DirectoryChange).await.unwrap();
        // Should not panic and should handle gracefully
    }
}