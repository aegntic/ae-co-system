/// MCP Process Manager for CCTM Phase 2C.2
/// 
/// Manages lifecycle of MCP server processes with resource monitoring,
/// automatic restart, and integration with VirtualTerminalPool patterns

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::process::{Child, Command};
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};

use super::{McpServiceConfig, McpServerInfo, McpServerStatus, McpResourceUsage};

/// MCP Process Manager - Handles MCP server process lifecycle
#[derive(Debug)]
pub struct McpProcessManager {
    config: McpServiceConfig,
    /// Running MCP server processes
    processes: Arc<RwLock<HashMap<String, McpProcess>>>,
    /// Process statistics
    stats: Arc<RwLock<McpProcessStats>>,
}

impl McpProcessManager {
    /// Create a new MCP Process Manager
    pub fn new(config: McpServiceConfig) -> Result<Self> {
        log::info!("Initializing MCP Process Manager with max {} concurrent servers", config.max_concurrent_servers);
        
        Ok(McpProcessManager {
            config,
            processes: Arc::new(RwLock::new(HashMap::new())),
            stats: Arc::new(RwLock::new(McpProcessStats::default())),
        })
    }
    
    /// Initialize the process manager
    pub async fn initialize(&self) -> Result<()> {
        log::info!("MCP Process Manager initialized successfully");
        Ok(())
    }
    
    /// Start an MCP server process
    pub async fn start_server(&self, server_id: &str, project_path: &Path) -> Result<String> {
        log::info!("Starting MCP server: {} for project: {}", server_id, project_path.display());
        
        // Check if server is already running
        {
            let processes = self.processes.read().await;
            if processes.contains_key(server_id) {
                log::warn!("MCP server {} is already running", server_id);
                return Ok(server_id.to_string());
            }
        }
        
        // Check concurrent server limit
        {
            let processes = self.processes.read().await;
            if processes.len() >= self.config.max_concurrent_servers {
                return Err(Error::msg(format!(
                    "Maximum concurrent MCP servers ({}) reached",
                    self.config.max_concurrent_servers
                )));
            }
        }
        
        // TODO: Implement actual process spawning
        // For now, create a placeholder process
        let mcp_process = McpProcess {
            server_id: server_id.to_string(),
            process: None, // Placeholder - would contain actual Child process
            project_path: project_path.to_path_buf(),
            started_at: Utc::now(),
            status: McpServerStatus::Starting,
            resource_usage: McpProcessResourceUsage::default(),
        };
        
        // Register the process
        {
            let mut processes = self.processes.write().await;
            processes.insert(server_id.to_string(), mcp_process);
        }
        
        // Update statistics
        {
            let mut stats = self.stats.write().await;
            stats.total_started += 1;
            stats.currently_running += 1;
        }
        
        log::info!("MCP server {} started successfully", server_id);
        Ok(server_id.to_string())
    }
    
    /// Stop an MCP server process
    pub async fn stop_server(&self, server_id: &str) -> Result<()> {
        log::info!("Stopping MCP server: {}", server_id);
        
        let mut removed_process = None;
        {
            let mut processes = self.processes.write().await;
            removed_process = processes.remove(server_id);
        }
        
        if let Some(mut mcp_process) = removed_process {
            // TODO: Implement actual process termination
            if let Some(mut child) = mcp_process.process {
                if let Err(e) = child.kill().await {
                    log::warn!("Failed to kill MCP server process {}: {}", server_id, e);
                }
            }
            
            // Update statistics
            {
                let mut stats = self.stats.write().await;
                stats.currently_running = stats.currently_running.saturating_sub(1);
                stats.total_stopped += 1;
            }
            
            log::info!("MCP server {} stopped successfully", server_id);
        } else {
            log::warn!("Attempted to stop unknown MCP server: {}", server_id);
        }
        
        Ok(())
    }
    
    /// Restart an MCP server process
    pub async fn restart_server(&self, server_id: &str) -> Result<()> {
        log::info!("Restarting MCP server: {}", server_id);
        
        // Get project path before stopping
        let project_path = {
            let processes = self.processes.read().await;
            processes.get(server_id)
                .map(|p| p.project_path.clone())
                .ok_or_else(|| Error::msg(format!("Unknown MCP server: {}", server_id)))?
        };
        
        // Stop and start
        self.stop_server(server_id).await?;
        self.start_server(server_id, &project_path).await?;
        
        log::info!("MCP server {} restarted successfully", server_id);
        Ok(())
    }
    
    /// Get the status of a specific MCP server
    pub async fn get_server_status(&self, server_id: &str) -> Option<McpServerStatus> {
        let processes = self.processes.read().await;
        processes.get(server_id).map(|p| p.status.clone())
    }
    
    /// Get the number of currently active servers
    pub async fn active_server_count(&self) -> usize {
        let processes = self.processes.read().await;
        processes.len()
    }
    
    /// Get the number of failed servers
    pub async fn failed_server_count(&self) -> usize {
        let processes = self.processes.read().await;
        processes.values()
            .filter(|p| p.status == McpServerStatus::Failed)
            .count()
    }
    
    /// Get resource usage for all MCP servers
    pub async fn get_resource_usage(&self) -> McpResourceUsage {
        let processes = self.processes.read().await;
        
        let mut total_memory_mb = 0.0;
        let mut total_cpu_percent = 0.0;
        let active_processes = processes.len();
        
        for process in processes.values() {
            total_memory_mb += process.resource_usage.memory_mb;
            total_cpu_percent += process.resource_usage.cpu_percent;
        }
        
        McpResourceUsage {
            total_memory_mb,
            total_cpu_percent,
            active_processes,
        }
    }
    
    /// Get detailed process statistics
    pub async fn get_process_statistics(&self) -> McpProcessStats {
        let stats = self.stats.read().await;
        stats.clone()
    }
    
    /// Check health of all running processes
    pub async fn health_check(&self) -> Result<HashMap<String, bool>> {
        let processes = self.processes.read().await;
        let mut health_status = HashMap::new();
        
        for (server_id, process) in processes.iter() {
            // TODO: Implement actual health check
            // For now, assume all processes are healthy
            let is_healthy = process.status == McpServerStatus::Running;
            health_status.insert(server_id.clone(), is_healthy);
        }
        
        Ok(health_status)
    }
    
    /// Stop all running MCP servers
    pub async fn stop_all_servers(&self) -> Result<()> {
        log::info!("Stopping all MCP servers...");
        
        let server_ids: Vec<String> = {
            let processes = self.processes.read().await;
            processes.keys().cloned().collect()
        };
        
        for server_id in server_ids {
            if let Err(e) = self.stop_server(&server_id).await {
                log::error!("Failed to stop MCP server {}: {}", server_id, e);
            }
        }
        
        log::info!("All MCP servers stopped");
        Ok(())
    }
    
    /// Update resource usage for a specific server (called by monitoring)
    pub async fn update_resource_usage(&self, server_id: &str, usage: McpProcessResourceUsage) -> Result<()> {
        let mut processes = self.processes.write().await;
        
        if let Some(process) = processes.get_mut(server_id) {
            process.resource_usage = usage;
        }
        
        Ok(())
    }
}

/// Individual MCP server process information
#[derive(Debug)]
struct McpProcess {
    server_id: String,
    process: Option<Child>,
    project_path: PathBuf,
    started_at: DateTime<Utc>,
    status: McpServerStatus,
    resource_usage: McpProcessResourceUsage,
}

/// Resource usage for a single MCP process
#[derive(Debug, Clone, Default)]
pub struct McpProcessResourceUsage {
    pub memory_mb: f64,
    pub cpu_percent: f64,
    pub open_files: usize,
}

/// Process manager statistics
#[derive(Debug, Clone, Default)]
pub struct McpProcessStats {
    pub total_started: usize,
    pub total_stopped: usize,
    pub total_failed: usize,
    pub currently_running: usize,
    pub average_startup_time_ms: f64,
    pub last_updated: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp_service::McpServiceConfig;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_process_manager_creation() {
        let config = McpServiceConfig::default();
        let manager = McpProcessManager::new(config).unwrap();
        
        assert_eq!(manager.active_server_count().await, 0);
    }
    
    #[tokio::test]
    async fn test_process_manager_initialization() {
        let config = McpServiceConfig::default();
        let manager = McpProcessManager::new(config).unwrap();
        
        manager.initialize().await.unwrap();
        assert_eq!(manager.active_server_count().await, 0);
    }
    
    #[tokio::test]
    async fn test_start_stop_server() {
        let config = McpServiceConfig::default();
        let manager = McpProcessManager::new(config).unwrap();
        let temp_dir = TempDir::new().unwrap();
        
        // Start a server
        let result = manager.start_server("test-server", temp_dir.path()).await;
        assert!(result.is_ok());
        assert_eq!(manager.active_server_count().await, 1);
        
        // Stop the server
        manager.stop_server("test-server").await.unwrap();
        assert_eq!(manager.active_server_count().await, 0);
    }
    
    #[tokio::test]
    async fn test_concurrent_server_limit() {
        let mut config = McpServiceConfig::default();
        config.max_concurrent_servers = 1;
        
        let manager = McpProcessManager::new(config).unwrap();
        let temp_dir = TempDir::new().unwrap();
        
        // Start first server (should succeed)
        manager.start_server("server1", temp_dir.path()).await.unwrap();
        assert_eq!(manager.active_server_count().await, 1);
        
        // Start second server (should fail due to limit)
        let result = manager.start_server("server2", temp_dir.path()).await;
        assert!(result.is_err());
        assert_eq!(manager.active_server_count().await, 1);
    }
}