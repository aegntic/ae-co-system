// CCTM Phase 2: TerminalManagerV2 - Bridge between legacy and virtualization systems
// Provides backward compatibility while enabling new virtualization features

use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use anyhow::{Result, Error};
use serde::{Deserialize, Serialize};

use crate::terminal_manager::{TerminalManager, Terminal, TerminalPosition};
use crate::virtualization::{
    VirtualizationEngine, 
    PoolConfig, 
    PoolStatus, 
    ResourceUsage
};

/// Configuration for TerminalManagerV2
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalManagerV2Config {
    /// Whether to use virtualization (false = legacy mode)
    pub enable_virtualization: bool,
    
    /// Virtualization pool configuration
    pub pool_config: PoolConfig,
    
    /// Migration settings
    pub migration_mode: MigrationMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MigrationMode {
    /// Use legacy system only
    Legacy,
    /// Use virtualization for new terminals, legacy for existing
    Hybrid,
    /// Use virtualization only
    Full,
}

impl Default for TerminalManagerV2Config {
    fn default() -> Self {
        TerminalManagerV2Config {
            enable_virtualization: true,
            pool_config: PoolConfig::default(),
            migration_mode: MigrationMode::Hybrid,
        }
    }
}

/// Enhanced terminal manager with virtualization capabilities
#[derive(Debug)]
pub struct TerminalManagerV2 {
    config: TerminalManagerV2Config,
    legacy_manager: Option<TerminalManager>,
    virtualization_engine: Option<VirtualizationEngine>,
    stats: Arc<Mutex<ManagerStats>>,
}

#[derive(Debug, Default)]
struct ManagerStats {
    legacy_terminals_created: u64,
    virtual_terminals_created: u64,
    migration_events: u64,
    last_updated: chrono::DateTime<chrono::Utc>,
}

impl TerminalManagerV2 {
    pub async fn new() -> Result<Self> {
        Self::with_config(TerminalManagerV2Config::default()).await
    }

    pub async fn with_config(config: TerminalManagerV2Config) -> Result<Self> {
        let legacy_manager = if matches!(config.migration_mode, MigrationMode::Legacy | MigrationMode::Hybrid) {
            Some(TerminalManager::new()?)
        } else {
            None
        };

        let virtualization_engine = if config.enable_virtualization {
            Some(VirtualizationEngine::new(config.pool_config.clone()).await?)
        } else {
            None
        };

        Ok(TerminalManagerV2 {
            config,
            legacy_manager,
            virtualization_engine,
            stats: Arc::new(Mutex::new(ManagerStats {
                last_updated: chrono::Utc::now(),
                ..Default::default()
            })),
        })
    }

    /// Spawn a new Claude Code terminal (auto-routes to best implementation)
    pub async fn spawn_claude_code(&self, working_dir: PathBuf, title: Option<String>) -> Result<String> {
        match self.should_use_virtualization(&working_dir).await {
            true => {
                if let Some(engine) = &self.virtualization_engine {
                    let terminal_id = engine.create_terminal(working_dir, title).await?;
                    
                    // Update stats
                    {
                        let mut stats = self.stats.lock().await;
                        stats.virtual_terminals_created += 1;
                        stats.last_updated = chrono::Utc::now();
                    }

                    log::info!("Created virtual terminal: {}", terminal_id);
                    Ok(terminal_id)
                } else {
                    Err(Error::msg("Virtualization engine not available"))
                }
            }
            false => {
                if let Some(manager) = &self.legacy_manager {
                    let terminal_id = manager.spawn_claude_code(working_dir, title).await?;
                    
                    // Update stats
                    {
                        let mut stats = self.stats.lock().await;
                        stats.legacy_terminals_created += 1;
                        stats.last_updated = chrono::Utc::now();
                    }

                    log::info!("Created legacy terminal: {}", terminal_id);
                    Ok(terminal_id)
                } else {
                    Err(Error::msg("Legacy manager not available"))
                }
            }
        }
    }

    /// Get terminal information (checks both systems)
    pub async fn get_terminal(&self, terminal_id: &str) -> Option<Terminal> {
        // Try virtualization first
        if let Some(engine) = &self.virtualization_engine {
            if let Some(vt) = engine.pool.get_terminal(terminal_id).await {
                if let Some(terminal) = vt.get_terminal().await {
                    return Some(terminal);
                }
            }
        }

        // Fall back to legacy
        if let Some(manager) = &self.legacy_manager {
            return manager.get_terminal(terminal_id).await;
        }

        None
    }

    /// Get all terminals from both systems
    pub async fn get_all_terminals(&self) -> Vec<Terminal> {
        let mut terminals = Vec::new();

        // Get virtual terminals
        if let Some(engine) = &self.virtualization_engine {
            let virtual_terminals = engine.pool.get_all_terminals().await;
            for vt in virtual_terminals {
                if let Some(terminal) = vt.get_terminal().await {
                    terminals.push(terminal);
                }
            }
        }

        // Get legacy terminals
        if let Some(manager) = &self.legacy_manager {
            terminals.extend(manager.get_all_terminals().await);
        }

        terminals
    }

    /// Send input to terminal (routes to appropriate system)
    pub async fn send_input(&self, terminal_id: &str, input: &str) -> Result<()> {
        // Try virtualization first
        if let Some(engine) = &self.virtualization_engine {
            if let Some(vt) = engine.pool.get_terminal(terminal_id).await {
                return vt.send_input(input).await;
            }
        }

        // Fall back to legacy
        if let Some(manager) = &self.legacy_manager {
            return manager.send_input(terminal_id, input).await;
        }

        Err(Error::msg("Terminal not found in any system"))
    }

    /// Terminate terminal (routes to appropriate system)
    pub async fn terminate_terminal(&self, terminal_id: &str) -> Result<()> {
        // Try virtualization first
        if let Some(engine) = &self.virtualization_engine {
            let result = engine.pool.detach_session(terminal_id).await;
            if result.is_ok() {
                return result;
            }
        }

        // Fall back to legacy
        if let Some(manager) = &self.legacy_manager {
            return manager.terminate_terminal(terminal_id).await;
        }

        Err(Error::msg("Terminal not found in any system"))
    }

    /// Update terminal position (routes to appropriate system)
    pub async fn update_terminal_position(&self, terminal_id: &str, position: TerminalPosition) -> Result<()> {
        // Try legacy first (virtualization doesn't currently support position updates)
        if let Some(manager) = &self.legacy_manager {
            let result = manager.update_terminal_position(terminal_id, position).await;
            if result.is_ok() {
                return result;
            }
        }

        // Virtual terminals don't support position updates yet
        Err(Error::msg("Position updates not supported for virtual terminals"))
    }

    /// Set terminal opacity (routes to appropriate system)
    pub async fn set_terminal_opacity(&self, terminal_id: &str, opacity: f32) -> Result<()> {
        // Try legacy first (virtualization doesn't currently support opacity)
        if let Some(manager) = &self.legacy_manager {
            let result = manager.set_terminal_opacity(terminal_id, opacity).await;
            if result.is_ok() {
                return result;
            }
        }

        // Virtual terminals don't support opacity updates yet
        Err(Error::msg("Opacity updates not supported for virtual terminals"))
    }

    /// Get total terminal count from both systems
    pub async fn get_terminal_count(&self) -> usize {
        let mut count = 0;

        if let Some(engine) = &self.virtualization_engine {
            let status = engine.get_pool_status().await;
            count += status.active_terminals;
        }

        if let Some(manager) = &self.legacy_manager {
            count += manager.get_terminal_count().await;
        }

        count
    }

    /// Get active terminals from both systems
    pub async fn get_active_terminals(&self) -> Vec<Terminal> {
        let mut terminals = Vec::new();

        // Get virtual terminals (all are considered active)
        if let Some(engine) = &self.virtualization_engine {
            let virtual_terminals = engine.pool.get_all_terminals().await;
            for vt in virtual_terminals {
                if let Some(terminal) = vt.get_terminal().await {
                    terminals.push(terminal);
                }
            }
        }

        // Get legacy active terminals
        if let Some(manager) = &self.legacy_manager {
            terminals.extend(manager.get_active_terminals().await);
        }

        terminals
    }

    /// Get comprehensive system status
    pub async fn get_system_status(&self) -> SystemStatus {
        let mut status = SystemStatus {
            virtualization_enabled: self.config.enable_virtualization,
            migration_mode: self.config.migration_mode.clone(),
            total_terminals: 0,
            virtual_terminals: 0,
            legacy_terminals: 0,
            pool_status: None,
            resource_usage: None,
            stats: None,
            last_updated: chrono::Utc::now(),
        };

        // Get virtualization status
        if let Some(engine) = &self.virtualization_engine {
            let pool_status = engine.get_pool_status().await;
            let resource_usage = engine.get_resource_usage().await;
            
            status.virtual_terminals = pool_status.active_terminals;
            status.pool_status = Some(pool_status);
            status.resource_usage = Some(resource_usage);
        }

        // Get legacy status
        if let Some(manager) = &self.legacy_manager {
            status.legacy_terminals = manager.get_terminal_count().await;
        }

        status.total_terminals = status.virtual_terminals + status.legacy_terminals;

        // Get internal stats
        {
            let stats = self.stats.lock().await;
            status.stats = Some(ManagerV2Stats {
                legacy_terminals_created: stats.legacy_terminals_created,
                virtual_terminals_created: stats.virtual_terminals_created,
                migration_events: stats.migration_events,
                last_updated: stats.last_updated,
            });
        }

        status
    }

    /// Migrate existing terminals to virtualization (if possible)
    pub async fn migrate_to_virtualization(&self) -> Result<MigrationResult> {
        if !self.config.enable_virtualization {
            return Err(Error::msg("Virtualization not enabled"));
        }

        // This is a complex operation that would involve:
        // 1. Identifying legacy terminals that can be migrated
        // 2. Creating virtual equivalents
        // 3. Transferring state
        // 4. Gradually phasing out legacy terminals

        // For now, return a placeholder result
        Ok(MigrationResult {
            migrated_count: 0,
            failed_count: 0,
            total_attempted: 0,
            migration_time_ms: 0,
            timestamp: chrono::Utc::now(),
        })
    }

    // Private helper methods

    async fn should_use_virtualization(&self, _working_dir: &PathBuf) -> bool {
        match self.config.migration_mode {
            MigrationMode::Legacy => false,
            MigrationMode::Hybrid => {
                // Use virtualization for new terminals if available and within limits
                if let Some(engine) = &self.virtualization_engine {
                    let resource_usage = engine.get_resource_usage().await;
                    // Use virtualization if we're not near resource limits
                    resource_usage.memory_mb < 150.0 && resource_usage.cpu_percent < 60.0
                } else {
                    false
                }
            }
            MigrationMode::Full => self.virtualization_engine.is_some(),
        }
    }
}

/// Comprehensive system status
#[derive(Debug, Serialize)]
pub struct SystemStatus {
    pub virtualization_enabled: bool,
    pub migration_mode: MigrationMode,
    pub total_terminals: usize,
    pub virtual_terminals: usize,
    pub legacy_terminals: usize,
    pub pool_status: Option<PoolStatus>,
    pub resource_usage: Option<ResourceUsage>,
    pub stats: Option<ManagerV2Stats>,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct ManagerV2Stats {
    pub legacy_terminals_created: u64,
    pub virtual_terminals_created: u64,
    pub migration_events: u64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct MigrationResult {
    pub migrated_count: usize,
    pub failed_count: usize,
    pub total_attempted: usize,
    pub migration_time_ms: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

// Manual Send and Sync implementation (needed for Tauri state management)
unsafe impl Send for TerminalManagerV2 {}
unsafe impl Sync for TerminalManagerV2 {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_terminal_manager_v2_creation() {
        let manager = TerminalManagerV2::new().unwrap();
        let status = manager.get_system_status().await;
        assert_eq!(status.total_terminals, 0);
    }

    #[tokio::test]
    async fn test_legacy_mode() {
        let config = TerminalManagerV2Config {
            enable_virtualization: false,
            migration_mode: MigrationMode::Legacy,
            ..Default::default()
        };

        let manager = TerminalManagerV2::with_config(config).unwrap();
        let status = manager.get_system_status().await;
        assert!(!status.virtualization_enabled);
    }

    #[tokio::test]
    async fn test_virtualization_mode() {
        let config = TerminalManagerV2Config {
            enable_virtualization: true,
            migration_mode: MigrationMode::Full,
            ..Default::default()
        };

        let manager = TerminalManagerV2::with_config(config).unwrap();
        let status = manager.get_system_status().await;
        assert!(status.virtualization_enabled);
        assert!(status.pool_status.is_some());
    }
}