//! Configuration system for aegnt-27
//! 
//! This module provides comprehensive configuration management for all aegnt-27 modules,
//! supporting runtime configuration, file-based configuration, and environment variable overrides.

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::Duration;

use crate::error::{Aegnt27Error, Result};

#[cfg(feature = "mouse")]
use crate::mouse::MouseConfig;

#[cfg(feature = "typing")]
use crate::typing::TypingConfig;

#[cfg(feature = "audio")]
use crate::audio::AudioConfig;

#[cfg(feature = "visual")]
use crate::visual::VisualConfig;

#[cfg(feature = "detection")]
use crate::detection::DetectionConfig;

/// Main configuration structure for the aegnt-27 engine
/// 
/// This configuration supports all humanization modules and provides
/// both programmatic and file-based configuration options.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Aegnt27Config {
    /// Global performance settings
    pub performance: PerformanceConfig,
    
    /// Privacy and security settings
    pub privacy: PrivacyConfig,
    
    /// Logging configuration
    pub logging: LoggingConfig,
    
    /// Mouse humanization configuration
    #[cfg(feature = "mouse")]
    #[serde(default)]
    pub mouse: MouseConfig,
    
    /// Typing humanization configuration
    #[cfg(feature = "typing")]
    #[serde(default)]
    pub typing: TypingConfig,
    
    /// Audio processing configuration
    #[cfg(feature = "audio")]
    #[serde(default)]
    pub audio: AudioConfig,
    
    /// Visual enhancement configuration
    #[cfg(feature = "visual")]
    #[serde(default)]
    pub visual: VisualConfig,
    
    /// AI detection resistance configuration
    #[cfg(feature = "detection")]
    #[serde(default)]
    pub detection: DetectionConfig,
}

/// Performance-related configuration settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    /// Maximum number of concurrent operations
    pub max_concurrent_operations: usize,
    
    /// Memory limit for caching in MB
    pub memory_limit_mb: usize,
    
    /// Enable GPU acceleration when available
    pub enable_gpu_acceleration: bool,
    
    /// Thread pool size for CPU-intensive operations
    pub thread_pool_size: Option<usize>,
    
    /// Cache size for pre-computed patterns
    pub cache_size: usize,
    
    /// Timeout for individual operations
    pub operation_timeout: Duration,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            max_concurrent_operations: num_cpus::get(),
            memory_limit_mb: 256,
            enable_gpu_acceleration: true,
            thread_pool_size: None, // Auto-detect
            cache_size: 1000,
            operation_timeout: Duration::from_secs(30),
        }
    }
}

/// Privacy and security configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyConfig {
    /// Enable telemetry collection (anonymized)
    pub enable_telemetry: bool,
    
    /// Enable crash reporting
    pub enable_crash_reporting: bool,
    
    /// Local-only processing (no cloud APIs)
    pub local_only: bool,
    
    /// Data retention period in days
    pub data_retention_days: u32,
    
    /// Enable data encryption at rest
    pub enable_encryption: bool,
    
    /// Encryption key derivation rounds
    pub encryption_rounds: u32,
}

impl Default for PrivacyConfig {
    fn default() -> Self {
        Self {
            enable_telemetry: false,
            enable_crash_reporting: false,
            local_only: true,
            data_retention_days: 30,
            enable_encryption: true,
            encryption_rounds: 100_000,
        }
    }
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log level (trace, debug, info, warn, error)
    pub level: String,
    
    /// Enable file logging
    pub enable_file_logging: bool,
    
    /// Log file path (if file logging enabled)
    pub log_file_path: Option<String>,
    
    /// Maximum log file size in MB
    pub max_file_size_mb: usize,
    
    /// Number of log files to retain
    pub max_files: usize,
    
    /// Enable structured JSON logging
    pub json_format: bool,
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            enable_file_logging: false,
            log_file_path: None,
            max_file_size_mb: 10,
            max_files: 5,
            json_format: false,
        }
    }
}

impl Default for Aegnt27Config {
    fn default() -> Self {
        Self {
            performance: PerformanceConfig::default(),
            privacy: PrivacyConfig::default(),
            logging: LoggingConfig::default(),
            
            #[cfg(feature = "mouse")]
            mouse: MouseConfig::default(),
            
            #[cfg(feature = "typing")]
            typing: TypingConfig::default(),
            
            #[cfg(feature = "audio")]
            audio: AudioConfig::default(),
            
            #[cfg(feature = "visual")]
            visual: VisualConfig::default(),
            
            #[cfg(feature = "detection")]
            detection: DetectionConfig::default(),
        }
    }
}

impl Aegnt27Config {
    /// Creates a new configuration builder
    pub fn builder() -> Aegnt27ConfigBuilder {
        Aegnt27ConfigBuilder::new()
    }
    
    /// Loads configuration from a TOML file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to read config file: {}", e)))?;
        
        toml::from_str(&content)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to parse config: {}", e)))
    }
    
    /// Loads configuration from a JSON file
    pub fn from_json_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to read config file: {}", e)))?;
        
        serde_json::from_str(&content)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to parse JSON config: {}", e)))
    }
    
    /// Saves configuration to a TOML file
    pub fn save_to_file<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let content = toml::to_string_pretty(self)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to serialize config: {}", e)))?;
        
        std::fs::write(path, content)
            .map_err(|e| Aegnt27Error::Config(format!("Failed to write config file: {}", e)))
    }
    
    /// Validates the configuration
    pub fn validate(&self) -> Result<()> {
        if self.performance.max_concurrent_operations == 0 {
            return Err(Aegnt27Error::Config(
                "max_concurrent_operations must be greater than 0".to_string()
            ));
        }
        
        if self.performance.memory_limit_mb == 0 {
            return Err(Aegnt27Error::Config(
                "memory_limit_mb must be greater than 0".to_string()
            ));
        }
        
        if self.privacy.data_retention_days == 0 {
            return Err(Aegnt27Error::Config(
                "data_retention_days must be greater than 0".to_string()
            ));
        }
        
        if !["trace", "debug", "info", "warn", "error"].contains(&self.logging.level.as_str()) {
            return Err(Aegnt27Error::Config(
                "Invalid log level. Must be one of: trace, debug, info, warn, error".to_string()
            ));
        }
        
        Ok(())
    }
    
    /// Merges configuration with environment variables
    /// 
    /// Environment variables follow the pattern: HUMAIN_<SECTION>_<KEY>
    /// Example: HUMAIN_PERFORMANCE_MAX_CONCURRENT_OPERATIONS=8
    pub fn merge_with_env(&mut self) -> Result<()> {
        use std::env;
        
        // Performance settings
        if let Ok(val) = env::var("HUMAIN_PERFORMANCE_MAX_CONCURRENT_OPERATIONS") {
            self.performance.max_concurrent_operations = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid max_concurrent_operations: {}", e)))?;
        }
        
        if let Ok(val) = env::var("HUMAIN_PERFORMANCE_MEMORY_LIMIT_MB") {
            self.performance.memory_limit_mb = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid memory_limit_mb: {}", e)))?;
        }
        
        if let Ok(val) = env::var("HUMAIN_PERFORMANCE_ENABLE_GPU_ACCELERATION") {
            self.performance.enable_gpu_acceleration = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid enable_gpu_acceleration: {}", e)))?;
        }
        
        // Privacy settings
        if let Ok(val) = env::var("HUMAIN_PRIVACY_LOCAL_ONLY") {
            self.privacy.local_only = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid local_only: {}", e)))?;
        }
        
        if let Ok(val) = env::var("HUMAIN_PRIVACY_ENABLE_TELEMETRY") {
            self.privacy.enable_telemetry = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid enable_telemetry: {}", e)))?;
        }
        
        // Logging settings
        if let Ok(val) = env::var("HUMAIN_LOGGING_LEVEL") {
            self.logging.level = val;
        }
        
        if let Ok(val) = env::var("HUMAIN_LOGGING_ENABLE_FILE_LOGGING") {
            self.logging.enable_file_logging = val.parse()
                .map_err(|e| Aegnt27Error::Config(format!("Invalid enable_file_logging: {}", e)))?;
        }
        
        Ok(())
    }
}

/// Builder for creating Aegnt27 configurations
#[derive(Debug, Default)]
pub struct Aegnt27ConfigBuilder {
    performance: Option<PerformanceConfig>,
    privacy: Option<PrivacyConfig>,
    logging: Option<LoggingConfig>,
    
    #[cfg(feature = "mouse")]
    mouse: Option<MouseConfig>,
    
    #[cfg(feature = "typing")]
    typing: Option<TypingConfig>,
    
    #[cfg(feature = "audio")]
    audio: Option<AudioConfig>,
    
    #[cfg(feature = "visual")]
    visual: Option<VisualConfig>,
    
    #[cfg(feature = "detection")]
    detection: Option<DetectionConfig>,
}

impl Aegnt27ConfigBuilder {
    /// Creates a new configuration builder
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Sets performance configuration
    pub fn performance(mut self, config: PerformanceConfig) -> Self {
        self.performance = Some(config);
        self
    }
    
    /// Sets privacy configuration
    pub fn privacy(mut self, config: PrivacyConfig) -> Self {
        self.privacy = Some(config);
        self
    }
    
    /// Sets logging configuration
    pub fn logging(mut self, config: LoggingConfig) -> Self {
        self.logging = Some(config);
        self
    }
    
    #[cfg(feature = "mouse")]
    /// Sets mouse humanization configuration
    pub fn mouse(mut self, config: MouseConfig) -> Self {
        self.mouse = Some(config);
        self
    }
    
    #[cfg(feature = "typing")]
    /// Sets typing humanization configuration
    pub fn typing(mut self, config: TypingConfig) -> Self {
        self.typing = Some(config);
        self
    }
    
    #[cfg(feature = "audio")]
    /// Sets audio processing configuration
    pub fn audio(mut self, config: AudioConfig) -> Self {
        self.audio = Some(config);
        self
    }
    
    #[cfg(feature = "visual")]
    /// Sets visual enhancement configuration
    pub fn visual(mut self, config: VisualConfig) -> Self {
        self.visual = Some(config);
        self
    }
    
    #[cfg(feature = "detection")]
    /// Sets AI detection resistance configuration
    pub fn detection(mut self, config: DetectionConfig) -> Self {
        self.detection = Some(config);
        self
    }
    
    /// Builds the configuration
    pub fn build(self) -> Result<Aegnt27Config> {
        let mut config = Aegnt27Config {
            performance: self.performance.unwrap_or_default(),
            privacy: self.privacy.unwrap_or_default(),
            logging: self.logging.unwrap_or_default(),
            
            #[cfg(feature = "mouse")]
            mouse: self.mouse.unwrap_or_default(),
            
            #[cfg(feature = "typing")]
            typing: self.typing.unwrap_or_default(),
            
            #[cfg(feature = "audio")]
            audio: self.audio.unwrap_or_default(),
            
            #[cfg(feature = "visual")]
            visual: self.visual.unwrap_or_default(),
            
            #[cfg(feature = "detection")]
            detection: self.detection.unwrap_or_default(),
        };
        
        config.merge_with_env()?;
        config.validate()?;
        
        Ok(config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    
    #[test]
    fn test_default_config() {
        let config = Aegnt27Config::default();
        assert!(config.validate().is_ok());
        assert!(config.performance.max_concurrent_operations > 0);
        assert!(!config.privacy.enable_telemetry);
        assert!(config.privacy.local_only);
    }
    
    #[test]
    fn test_config_builder() {
        let config = Aegnt27Config::builder()
            .performance(PerformanceConfig {
                max_concurrent_operations: 4,
                ..Default::default()
            })
            .privacy(PrivacyConfig {
                local_only: false,
                ..Default::default()
            })
            .build()
            .expect("Failed to build config");
        
        assert_eq!(config.performance.max_concurrent_operations, 4);
        assert!(!config.privacy.local_only);
    }
    
    #[test]
    fn test_env_override() {
        env::set_var("HUMAIN_PERFORMANCE_MAX_CONCURRENT_OPERATIONS", "8");
        env::set_var("HUMAIN_PRIVACY_LOCAL_ONLY", "false");
        
        let mut config = Aegnt27Config::default();
        config.merge_with_env().expect("Failed to merge env vars");
        
        assert_eq!(config.performance.max_concurrent_operations, 8);
        assert!(!config.privacy.local_only);
        
        // Clean up
        env::remove_var("HUMAIN_PERFORMANCE_MAX_CONCURRENT_OPERATIONS");
        env::remove_var("HUMAIN_PRIVACY_LOCAL_ONLY");
    }
    
    #[test]
    fn test_validation() {
        let mut config = Aegnt27Config::default();
        config.performance.max_concurrent_operations = 0;
        
        assert!(config.validate().is_err());
    }
    
    #[test]
    fn test_invalid_log_level() {
        let mut config = Aegnt27Config::default();
        config.logging.level = "invalid".to_string();
        
        assert!(config.validate().is_err());
    }
}