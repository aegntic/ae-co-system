/// MCP Service Integration for CCTM Phase 2C
/// 
/// Provides comprehensive MCP server discovery, management, and integration
/// with CCTM's terminal virtualization and project intelligence systems

pub mod discovery;
pub mod manager;
pub mod legacy_bridge;
pub mod bridge;
pub mod registry;
pub mod integration;

// Re-export commonly used types
pub use self::manager::McpProcessManager as McpManager;
pub type McpServer = McpServerInfo;  // Type alias for compatibility

use std::path::PathBuf;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use anyhow::Result;

/// MCP Service Manager - Central coordinator for all MCP server operations
#[derive(Debug)]
pub struct McpServiceManager {
    discovery_engine: discovery::McpDiscoveryEngine,
    service_manager: manager::McpProcessManager,
    registry: registry::McpRegistry,
    bridge: legacy_bridge::McpBridge,
    config: McpServiceConfig,
}

impl McpServiceManager {
    /// Create a new MCP Service Manager with default configuration
    pub fn new() -> Result<Self> {
        let config = McpServiceConfig::default();
        let discovery_engine = discovery::McpDiscoveryEngine::new(config.clone())?;
        let service_manager = manager::McpProcessManager::new(config.clone())?;
        let registry = registry::McpRegistry::new();
        let bridge = legacy_bridge::McpBridge::new(config.clone())?;
        
        Ok(McpServiceManager {
            discovery_engine,
            service_manager,
            registry,
            bridge,
            config,
        })
    }
    
    /// Initialize MCP service integration system
    pub async fn initialize(&mut self) -> Result<()> {
        log::info!("Initializing MCP Service Manager...");
        
        // Phase 1: Discover available MCP servers
        let discovered_servers = self.discovery_engine.discover_all_servers().await?;
        log::info!("Discovered {} MCP servers", discovered_servers.len());
        
        // Phase 2: Register discovered servers
        for server in discovered_servers {
            self.registry.register_server(server).await?;
        }
        
        // Phase 3: Initialize service manager
        self.service_manager.initialize().await?;
        
        // Phase 4: Initialize bridge
        self.bridge.initialize().await?;
        
        log::info!("MCP Service Manager initialized successfully");
        Ok(())
    }
    
    /// Get all available MCP servers with their capabilities
    pub async fn get_available_servers(&self) -> Vec<McpServerInfo> {
        self.registry.list_servers().await
    }
    
    /// Start MCP servers relevant to a specific project
    pub async fn activate_project_servers(&mut self, project_path: &PathBuf, project_context: ProjectContext) -> Result<Vec<String>> {
        let relevant_servers = self.registry.find_relevant_servers(&project_context).await;
        let mut activated_servers = Vec::new();
        
        for server_info in relevant_servers {
            match self.service_manager.start_server(&server_info.id, project_path).await {
                Ok(server_id) => {
                    activated_servers.push(server_id);
                    log::info!("Activated MCP server: {} for project", server_info.name);
                }
                Err(e) => {
                    log::warn!("Failed to activate MCP server {}: {}", server_info.name, e);
                }
            }
        }
        
        Ok(activated_servers)
    }
    
    /// Get MCP capabilities for a specific terminal instance
    pub async fn get_terminal_capabilities(&self, terminal_id: &str) -> Vec<McpCapability> {
        self.bridge.get_capabilities_for_terminal(terminal_id).await
    }
    
    /// Execute MCP tool with project context
    pub async fn execute_mcp_tool(&self, tool_name: &str, args: serde_json::Value, context: TerminalContext) -> Result<serde_json::Value> {
        self.bridge.execute_tool(tool_name, args, context).await
    }
    
    /// Get health status of all MCP services
    pub async fn get_health_status(&self) -> McpHealthStatus {
        McpHealthStatus {
            total_servers: self.registry.server_count().await,
            active_servers: self.service_manager.active_server_count().await,
            failed_servers: self.service_manager.failed_server_count().await,
            last_check: Utc::now(),
            resource_usage: self.service_manager.get_resource_usage().await,
        }
    }
}

/// MCP Service configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServiceConfig {
    /// Maximum number of concurrent MCP servers
    pub max_concurrent_servers: usize,
    /// MCP server discovery paths
    pub discovery_paths: Vec<PathBuf>,
    /// Enable network discovery for remote MCP servers
    pub enable_network_discovery: bool,
    /// MCP server startup timeout in seconds
    pub startup_timeout_seconds: u64,
    /// Resource limits for MCP servers
    pub resource_limits: McpResourceLimits,
    /// Enable automatic restart on failure
    pub auto_restart: bool,
}

impl Default for McpServiceConfig {
    fn default() -> Self {
        McpServiceConfig {
            max_concurrent_servers: 10,
            discovery_paths: vec![
                PathBuf::from("node_modules"),
                PathBuf::from("."),
                PathBuf::from("/usr/local/lib/mcp-servers"),
            ],
            enable_network_discovery: false,
            startup_timeout_seconds: 30,
            resource_limits: McpResourceLimits::default(),
            auto_restart: true,
        }
    }
}

/// Resource limits for MCP servers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpResourceLimits {
    /// Maximum memory per MCP server in MB
    pub max_memory_mb: usize,
    /// Maximum CPU percentage per MCP server
    pub max_cpu_percent: f64,
    /// Maximum file descriptors per MCP server
    pub max_file_descriptors: usize,
}

impl Default for McpResourceLimits {
    fn default() -> Self {
        McpResourceLimits {
            max_memory_mb: 100,
            max_cpu_percent: 10.0,
            max_file_descriptors: 100,
        }
    }
}

/// Information about a discovered MCP server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub path: PathBuf,
    pub executable: String,
    pub capabilities: Vec<McpCapability>,
    pub project_types: Vec<String>,
    pub languages: Vec<String>,
    pub frameworks: Vec<String>,
    pub status: McpServerStatus,
    pub last_seen: DateTime<Utc>,
}

/// MCP server capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpCapability {
    pub name: String,
    pub description: String,
    pub tool_type: McpToolType,
    pub input_schema: Option<serde_json::Value>,
    pub output_schema: Option<serde_json::Value>,
}

/// Types of MCP tools
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum McpToolType {
    CodeAnalysis,
    Documentation,
    Testing,
    Deployment,
    DatabaseQuery,
    FileOperation,
    WebRequest,
    GitOperation,
    ProjectScaffolding,
    Other(String),
}

/// MCP server status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum McpServerStatus {
    Discovered,
    Starting,
    Running,
    Stopping,
    Stopped,
    Failed,
    Unknown,
}

/// Project context for MCP server selection
#[derive(Debug, Clone)]
pub struct ProjectContext {
    pub project_path: PathBuf,
    pub primary_language: String,
    pub frameworks: Vec<String>,
    pub project_type: String,
    pub dependencies: Vec<String>,
}

/// Terminal context for MCP tool execution
#[derive(Debug, Clone)]
pub struct TerminalContext {
    pub terminal_id: String,
    pub current_directory: PathBuf,
    pub project_context: Option<ProjectContext>,
    pub recent_commands: Vec<String>,
    pub environment_variables: HashMap<String, String>,
}

/// MCP service health status
#[derive(Debug, Clone, Serialize)]
pub struct McpHealthStatus {
    pub total_servers: usize,
    pub active_servers: usize,
    pub failed_servers: usize,
    pub last_check: DateTime<Utc>,
    pub resource_usage: McpResourceUsage,
}

/// Resource usage for MCP services
#[derive(Debug, Clone, Serialize)]
pub struct McpResourceUsage {
    pub total_memory_mb: f64,
    pub total_cpu_percent: f64,
    pub active_processes: usize,
}

/// Default implementation for easy instantiation
impl Default for McpServiceManager {
    fn default() -> Self {
        Self::new().expect("Failed to create MCP Service Manager")
    }
}