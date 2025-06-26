//! # Persistence Module
//!
//! This module provides data persistence capabilities for the aegnt-27 system,
//! including configuration storage, learning data, and validation history.

use crate::error::Aegnt27Error;
use crate::authenticity::{AuthenticityValidation, AuthenticityConfig};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use uuid::Uuid;

/// Storage backend configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    /// Base directory for data storage
    pub base_dir: PathBuf,
    /// Enable data encryption
    pub enable_encryption: bool,
    /// Maximum file size in bytes
    pub max_file_size: u64,
    /// Compression level (0-9)
    pub compression_level: u32,
    /// Enable automatic backups
    pub enable_backups: bool,
    /// Backup retention days
    pub backup_retention_days: u32,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            base_dir: dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("aegnt-27"),
            enable_encryption: true,
            max_file_size: 100 * 1024 * 1024, // 100MB
            compression_level: 6,
            enable_backups: true,
            backup_retention_days: 30,
        }
    }
}

/// User profile data for personalization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    /// User identifier
    pub user_id: Uuid,
    /// User preferences
    pub preferences: HashMap<String, serde_json::Value>,
    /// Learning data
    pub learning_data: HashMap<String, f64>,
    /// Model weights
    pub model_weights: HashMap<String, Vec<f64>>,
    /// Validation history
    pub validation_history: Vec<AuthenticityValidation>,
    /// Configuration
    pub config: AuthenticityConfig,
    /// Profile creation timestamp
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Last updated timestamp
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl UserProfile {
    /// Create a new user profile
    pub fn new(user_id: Uuid, config: AuthenticityConfig) -> Self {
        let now = chrono::Utc::now();
        Self {
            user_id,
            preferences: HashMap::new(),
            learning_data: HashMap::new(),
            model_weights: HashMap::new(),
            validation_history: Vec::new(),
            config,
            created_at: now,
            updated_at: now,
        }
    }

    /// Update the profile timestamp
    pub fn touch(&mut self) {
        self.updated_at = chrono::Utc::now();
    }

    /// Add a validation to the history
    pub fn add_validation(&mut self, validation: AuthenticityValidation) {
        self.validation_history.push(validation);
        
        // Limit history size
        if self.validation_history.len() > 1000 {
            self.validation_history.drain(0..100);
        }
        
        self.touch();
    }

    /// Update learning data
    pub fn update_learning_data(&mut self, key: String, value: f64) {
        self.learning_data.insert(key, value);
        self.touch();
    }

    /// Update model weights
    pub fn update_model_weights(&mut self, model_name: String, weights: Vec<f64>) {
        self.model_weights.insert(model_name, weights);
        self.touch();
    }

    /// Set user preference
    pub fn set_preference(&mut self, key: String, value: serde_json::Value) {
        self.preferences.insert(key, value);
        self.touch();
    }

    /// Get user preference
    pub fn get_preference(&self, key: &str) -> Option<&serde_json::Value> {
        self.preferences.get(key)
    }
}

/// Persistent storage manager
pub struct PersistenceManager {
    config: StorageConfig,
    encryption_key: Option<[u8; 32]>,
}

impl PersistenceManager {
    /// Create a new persistence manager
    pub fn new(config: StorageConfig) -> Self {
        Self {
            config,
            encryption_key: None,
        }
    }

    /// Initialize the storage system
    pub async fn initialize(&mut self) -> Result<(), Aegnt27Error> {
        // Create base directory if it doesn't exist
        fs::create_dir_all(&self.config.base_dir).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to create base directory: {}", e))
        })?;

        // Initialize encryption if enabled
        if self.config.enable_encryption {
            self.initialize_encryption().await?;
        }

        // Initialize directory structure
        self.initialize_directories().await?;

        log::info!("Persistence manager initialized at: {:?}", self.config.base_dir);
        Ok(())
    }

    /// Initialize encryption system
    async fn initialize_encryption(&mut self) -> Result<(), Aegnt27Error> {
        let key_path = self.config.base_dir.join("encryption.key");
        
        if key_path.exists() {
            // Load existing key
            let key_data = fs::read(&key_path).await.map_err(|e| {
                Aegnt27Error::Storage(format!("Failed to read encryption key: {}", e))
            })?;
            
            if key_data.len() != 32 {
                return Err(Aegnt27Error::Storage("Invalid encryption key length".to_string()));
            }
            
            let mut key = [0u8; 32];
            key.copy_from_slice(&key_data);
            self.encryption_key = Some(key);
        } else {
            // Generate new key
            let key: [u8; 32] = rand::random();
            fs::write(&key_path, &key).await.map_err(|e| {
                Aegnt27Error::Storage(format!("Failed to write encryption key: {}", e))
            })?;
            
            self.encryption_key = Some(key);
        }
        
        Ok(())
    }

    /// Initialize directory structure
    async fn initialize_directories(&self) -> Result<(), Aegnt27Error> {
        let directories = [
            "profiles",
            "cache",
            "logs",
            "backups",
            "temp",
        ];

        for dir in &directories {
            let path = self.config.base_dir.join(dir);
            fs::create_dir_all(path).await.map_err(|e| {
                Aegnt27Error::Storage(format!("Failed to create {} directory: {}", dir, e))
            })?;
        }

        Ok(())
    }

    /// Save user profile
    pub async fn save_profile(&self, profile: &UserProfile) -> Result<(), Aegnt27Error> {
        let file_path = self.config.base_dir
            .join("profiles")
            .join(format!("{}.json", profile.user_id));

        let data = serde_json::to_vec_pretty(profile).map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to serialize profile: {}", e))
        })?;

        self.write_file(&file_path, &data).await?;

        log::debug!("Saved user profile: {}", profile.user_id);
        Ok(())
    }

    /// Load user profile
    pub async fn load_profile(&self, user_id: Uuid) -> Result<Option<UserProfile>, Aegnt27Error> {
        let file_path = self.config.base_dir
            .join("profiles")
            .join(format!("{}.json", user_id));

        if !file_path.exists() {
            return Ok(None);
        }

        let data = self.read_file(&file_path).await?;
        let profile: UserProfile = serde_json::from_slice(&data).map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to deserialize profile: {}", e))
        })?;

        log::debug!("Loaded user profile: {}", user_id);
        Ok(Some(profile))
    }

    /// Delete user profile
    pub async fn delete_profile(&self, user_id: Uuid) -> Result<(), Aegnt27Error> {
        let file_path = self.config.base_dir
            .join("profiles")
            .join(format!("{}.json", user_id));

        if file_path.exists() {
            fs::remove_file(&file_path).await.map_err(|e| {
                Aegnt27Error::Storage(format!("Failed to delete profile: {}", e))
            })?;
        }

        log::debug!("Deleted user profile: {}", user_id);
        Ok(())
    }

    /// List all user profiles
    pub async fn list_profiles(&self) -> Result<Vec<Uuid>, Aegnt27Error> {
        let profiles_dir = self.config.base_dir.join("profiles");
        let mut profiles = Vec::new();

        if !profiles_dir.exists() {
            return Ok(profiles);
        }

        let mut entries = fs::read_dir(profiles_dir).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read profiles directory: {}", e))
        })?;

        while let Some(entry) = entries.next_entry().await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read directory entry: {}", e))
        })? {
            let path = entry.path();
            if let Some(file_name) = path.file_stem() {
                if let Some(file_name_str) = file_name.to_str() {
                    if let Ok(user_id) = Uuid::parse_str(file_name_str) {
                        profiles.push(user_id);
                    }
                }
            }
        }

        Ok(profiles)
    }

    /// Save configuration
    pub async fn save_config(&self, config: &AuthenticityConfig) -> Result<(), Aegnt27Error> {
        let file_path = self.config.base_dir.join("config.json");
        let data = serde_json::to_vec_pretty(config).map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to serialize config: {}", e))
        })?;

        self.write_file(&file_path, &data).await?;
        log::debug!("Saved configuration");
        Ok(())
    }

    /// Load configuration
    pub async fn load_config(&self) -> Result<Option<AuthenticityConfig>, Aegnt27Error> {
        let file_path = self.config.base_dir.join("config.json");
        
        if !file_path.exists() {
            return Ok(None);
        }

        let data = self.read_file(&file_path).await?;
        let config: AuthenticityConfig = serde_json::from_slice(&data).map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to deserialize config: {}", e))
        })?;

        log::debug!("Loaded configuration");
        Ok(Some(config))
    }

    /// Create backup of all data
    pub async fn create_backup(&self) -> Result<PathBuf, Aegnt27Error> {
        if !self.config.enable_backups {
            return Err(Aegnt27Error::Storage("Backups are disabled".to_string()));
        }

        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("aegnt27_backup_{}.tar.gz", timestamp);
        let backup_path = self.config.base_dir.join("backups").join(backup_name);

        // Create backup (simplified implementation)
        // In a real implementation, this would use a proper archiving library
        let profiles_dir = self.config.base_dir.join("profiles");
        if profiles_dir.exists() {
            // Copy profiles directory to backup location
            // This is a simplified implementation
            log::info!("Creating backup at: {:?}", backup_path);
        }

        Ok(backup_path)
    }

    /// Restore from backup
    pub async fn restore_backup(&self, backup_path: &Path) -> Result<(), Aegnt27Error> {
        if !backup_path.exists() {
            return Err(Aegnt27Error::Storage("Backup file not found".to_string()));
        }

        // Restore backup (simplified implementation)
        log::info!("Restoring from backup: {:?}", backup_path);
        Ok(())
    }

    /// Clean old backups
    pub async fn clean_old_backups(&self) -> Result<(), Aegnt27Error> {
        let backups_dir = self.config.base_dir.join("backups");
        if !backups_dir.exists() {
            return Ok(());
        }

        let cutoff_date = chrono::Utc::now() - chrono::Duration::days(self.config.backup_retention_days as i64);
        let mut cleaned_count = 0;

        let mut entries = fs::read_dir(backups_dir).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read backups directory: {}", e))
        })?;

        while let Some(entry) = entries.next_entry().await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read directory entry: {}", e))
        })? {
            let path = entry.path();
            if let Ok(metadata) = entry.metadata().await {
                if let Ok(created) = metadata.created() {
                    let created_time = chrono::DateTime::<chrono::Utc>::from(created);
                    if created_time < cutoff_date {
                        if let Err(e) = fs::remove_file(&path).await {
                            log::warn!("Failed to remove old backup {:?}: {}", path, e);
                        } else {
                            cleaned_count += 1;
                        }
                    }
                }
            }
        }

        if cleaned_count > 0 {
            log::info!("Cleaned {} old backup files", cleaned_count);
        }

        Ok(())
    }

    /// Get storage statistics
    pub async fn get_storage_stats(&self) -> Result<HashMap<String, u64>, Aegnt27Error> {
        let mut stats = HashMap::new();
        
        stats.insert("total_size".to_string(), self.calculate_directory_size(&self.config.base_dir).await?);
        stats.insert("profiles_count".to_string(), self.list_profiles().await?.len() as u64);
        
        // Calculate individual directory sizes
        let directories = ["profiles", "cache", "logs", "backups"];
        for dir in &directories {
            let dir_path = self.config.base_dir.join(dir);
            let size = self.calculate_directory_size(&dir_path).await.unwrap_or(0);
            stats.insert(format!("{}_size", dir), size);
        }

        Ok(stats)
    }

    /// Calculate directory size recursively
    async fn calculate_directory_size(&self, path: &Path) -> Result<u64, Aegnt27Error> {
        if !path.exists() {
            return Ok(0);
        }

        let mut total_size = 0u64;
        let mut entries = fs::read_dir(path).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read directory: {}", e))
        })?;

        while let Some(entry) = entries.next_entry().await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read directory entry: {}", e))
        })? {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                total_size += self.calculate_directory_size(&entry_path).await?;
            } else {
                if let Ok(metadata) = entry.metadata().await {
                    total_size += metadata.len();
                }
            }
        }

        Ok(total_size)
    }

    /// Write file with optional encryption and compression
    async fn write_file(&self, path: &Path, data: &[u8]) -> Result<(), Aegnt27Error> {
        // Check file size limit
        if data.len() as u64 > self.config.max_file_size {
            return Err(Aegnt27Error::Storage(format!(
                "File size {} exceeds limit {}",
                data.len(),
                self.config.max_file_size
            )));
        }

        // Create parent directory if needed
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                Aegnt27Error::Storage(format!("Failed to create parent directory: {}", e))
            })?;
        }

        let mut file_data = data.to_vec();

        // Apply compression if configured
        if self.config.compression_level > 0 {
            file_data = self.compress_data(&file_data)?;
        }

        // Apply encryption if enabled
        if self.config.enable_encryption && self.encryption_key.is_some() {
            file_data = self.encrypt_data(&file_data)?;
        }

        // Write to file
        let mut file = fs::File::create(path).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to create file: {}", e))
        })?;

        file.write_all(&file_data).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to write file: {}", e))
        })?;

        Ok(())
    }

    /// Read file with optional decryption and decompression
    async fn read_file(&self, path: &Path) -> Result<Vec<u8>, Aegnt27Error> {
        let mut file = fs::File::open(path).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to open file: {}", e))
        })?;

        let mut file_data = Vec::new();
        file.read_to_end(&mut file_data).await.map_err(|e| {
            Aegnt27Error::Storage(format!("Failed to read file: {}", e))
        })?;

        // Apply decryption if enabled
        if self.config.enable_encryption && self.encryption_key.is_some() {
            file_data = self.decrypt_data(&file_data)?;
        }

        // Apply decompression if needed
        if self.config.compression_level > 0 {
            file_data = self.decompress_data(&file_data)?;
        }

        Ok(file_data)
    }

    /// Compress data (simplified implementation)
    fn compress_data(&self, data: &[u8]) -> Result<Vec<u8>, Aegnt27Error> {
        // In a real implementation, this would use a proper compression library
        // For now, just return the data as-is
        Ok(data.to_vec())
    }

    /// Decompress data (simplified implementation)
    fn decompress_data(&self, data: &[u8]) -> Result<Vec<u8>, Aegnt27Error> {
        // In a real implementation, this would use a proper compression library
        // For now, just return the data as-is
        Ok(data.to_vec())
    }

    /// Encrypt data (simplified implementation)
    fn encrypt_data(&self, data: &[u8]) -> Result<Vec<u8>, Aegnt27Error> {
        // In a real implementation, this would use proper AES-GCM encryption
        // For now, just return the data as-is
        Ok(data.to_vec())
    }

    /// Decrypt data (simplified implementation)
    fn decrypt_data(&self, data: &[u8]) -> Result<Vec<u8>, Aegnt27Error> {
        // In a real implementation, this would use proper AES-GCM decryption
        // For now, just return the data as-is
        Ok(data.to_vec())
    }
}