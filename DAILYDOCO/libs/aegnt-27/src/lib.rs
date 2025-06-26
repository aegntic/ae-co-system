//! # aegnt-27: The Human Peak Protocol
//! 
//! A sophisticated Rust library for achieving peak human authenticity through
//! 27 distinct behavioral patterns and advanced neural pattern simulation.
//! 
//! ## Features
//! 
//! - **Mouse Authenticity Achievement**: Natural movements through 7 behavioral patterns
//! - **Typing Peak Performance**: Authentic keystroke timing through 7 behavioral patterns
//! - **Audio Authenticity**: Natural voice patterns through 7 behavioral patterns
//! - **Visual Peak Authenticity**: Authentic gaze through 6 behavioral patterns
//! - **Human Authenticity Validation**: Peak human achievement validation
//! 
//! ## Quick Start
//! 
//! ```rust
//! use aegnt27::prelude::*;
//! 
//! #[tokio::main]
//! async fn main() -> Result<(), Aegnt27Error> {
//!     let aegnt = Aegnt27Engine::builder()
//!         .enable_mouse_authenticity()
//!         .enable_typing_authenticity()
//!         .enable_authenticity_validation()
//!         .build()
//!         .await?;
//!     
//!     // Achieve mouse authenticity
//!     let mouse_path = MousePath::linear(Point::new(0, 0), Point::new(500, 300));
//!     let authentic_path = aegnt.achieve_mouse_authenticity(mouse_path).await?;
//!     
//!     // Achieve typing authenticity
//!     let text = "Hello, world! This achieves peak human authenticity.";
//!     let typing_sequence = aegnt.achieve_typing_authenticity(text).await?;
//!     
//!     // Validate authenticity achievement
//!     let content = "This content achieves peak human authenticity...";
//!     let validation = aegnt.validate_authenticity(content).await?;
//!     
//!     println!("Human authenticity: {:.1}%", validation.authenticity_score * 100.0);
//!     
//!     Ok(())
//! }
//! ```

#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs, rust_2018_idioms)]
#![deny(unsafe_code)]

use std::sync::Arc;
use tokio::sync::RwLock;

// Core modules
pub mod config;
pub mod error;
pub mod utils;

// Humanization modules
#[cfg(feature = "mouse")]
#[cfg_attr(docsrs, doc(cfg(feature = "mouse")))]
pub mod mouse;

#[cfg(feature = "typing")]
#[cfg_attr(docsrs, doc(cfg(feature = "typing")))]
pub mod typing;

#[cfg(feature = "audio")]
#[cfg_attr(docsrs, doc(cfg(feature = "audio")))]
pub mod audio;

#[cfg(feature = "visual")]
#[cfg_attr(docsrs, doc(cfg(feature = "visual")))]
pub mod visual;

#[cfg(feature = "detection")]
#[cfg_attr(docsrs, doc(cfg(feature = "detection")))]
pub mod detection;

#[cfg(feature = "persistence")]
#[cfg_attr(docsrs, doc(cfg(feature = "persistence")))]
pub mod persistence;

#[cfg(feature = "authenticity")]
#[cfg_attr(docsrs, doc(cfg(feature = "authenticity")))]
pub mod authenticity;

// Re-exports
pub use crate::config::Aegnt27Config;
pub use crate::error::{Aegnt27Error, Result};

#[cfg(feature = "mouse")]
pub use crate::mouse::{MousePath, Point, AuthenticMousePath};

#[cfg(feature = "typing")]
pub use crate::typing::{TypingSequence, AuthenticKeystroke};

#[cfg(feature = "authenticity")]
pub use crate::authenticity::{AuthenticityValidation, AuthenticityConfig};

/// Prelude module for convenient imports
pub mod prelude {
    pub use crate::{Aegnt27Engine, Aegnt27EngineBuilder, Aegnt27Error, Result};
    pub use crate::config::Aegnt27Config;
    
    #[cfg(feature = "mouse")]
    pub use crate::mouse::{MousePath, Point, AuthenticMousePath, MouseConfig};
    
    #[cfg(feature = "typing")]
    pub use crate::typing::{TypingSequence, AuthenticKeystroke, TypingConfig};
    
    #[cfg(feature = "audio")]
    pub use crate::audio::{AudioData, AuthenticAudio, AudioConfig};
    
    #[cfg(feature = "visual")]
    pub use crate::visual::{VideoFrame, GazePattern, VisualConfig};
    
    #[cfg(feature = "authenticity")]
    pub use crate::authenticity::{AuthenticityValidation, AuthenticityConfig, AuthenticityEngine};
}

/// The main aegnt-27 engine for achieving peak human authenticity through 27 behavioral patterns
#[derive(Debug)]
pub struct Aegnt27Engine {
    config: Arc<Aegnt27Config>,
    
    #[cfg(feature = "mouse")]
    mouse_authenticator: Arc<RwLock<mouse::MouseAuthenticator>>,
    
    #[cfg(feature = "typing")]
    typing_authenticator: Arc<RwLock<typing::TypingAuthenticator>>,
    
    #[cfg(feature = "audio")]
    audio_authenticator: Arc<RwLock<audio::AudioAuthenticator>>,
    
    #[cfg(feature = "visual")]
    visual_authenticator: Arc<RwLock<visual::VisualAuthenticator>>,
    
    #[cfg(feature = "authenticity")]
    authenticity_validator: Arc<RwLock<authenticity::AuthenticityEngine>>,
}

impl Aegnt27Engine {
    /// Creates a new builder for configuring the aegnt-27 engine
    pub fn builder() -> Aegnt27EngineBuilder {
        Aegnt27EngineBuilder::new()
    }
    
    /// Creates an aegnt-27 engine with the provided configuration
    pub async fn with_config(config: Aegnt27Config) -> Result<Self> {
        let config = Arc::new(config);
        
        Ok(Self {
            config: config.clone(),
            
            #[cfg(feature = "mouse")]
            mouse_authenticator: Arc::new(RwLock::new(
                mouse::MouseAuthenticator::new(config.mouse.clone()).await?
            )),
            
            #[cfg(feature = "typing")]
            typing_authenticator: Arc::new(RwLock::new(
                typing::TypingAuthenticator::new(config.typing.clone()).await?
            )),
            
            #[cfg(feature = "audio")]
            audio_authenticator: Arc::new(RwLock::new(
                audio::AudioAuthenticator::new(config.audio.clone()).await?
            )),
            
            #[cfg(feature = "visual")]
            visual_authenticator: Arc::new(RwLock::new(
                visual::VisualAuthenticator::new(config.visual.clone()).await?
            )),
            
            #[cfg(feature = "authenticity")]
            authenticity_validator: Arc::new(RwLock::new(
                authenticity::AuthenticityEngine::new(authenticity::AuthenticityConfig::default())
            )),
        })
    }
    
    /// Quick authenticity validation for simple use cases
    #[cfg(feature = "authenticity")]
    pub async fn quick_validate(content: &str, target_score: f64) -> Result<authenticity::AuthenticityValidation> {
        let config = Aegnt27Config::builder().build()?;
        let engine = Self::with_config(config).await?;
        engine.validate_authenticity(content).await
    }
    
    // Mouse authenticity achievement methods
    #[cfg(feature = "mouse")]
    #[cfg_attr(docsrs, doc(cfg(feature = "mouse")))]
    /// Achieves mouse authenticity along the given path
    pub async fn achieve_mouse_authenticity(&self, path: MousePath) -> Result<AuthenticMousePath> {
        let mut authenticator = self.mouse_authenticator.write().await;
        authenticator.achieve_authenticity(path).await
    }
    
    #[cfg(feature = "mouse")]
    #[cfg_attr(docsrs, doc(cfg(feature = "mouse")))]
    /// Generates a peak authentic mouse path between two points
    pub async fn generate_peak_mouse_path(&self, start: Point, end: Point) -> Result<MousePath> {
        let mut authenticator = self.mouse_authenticator.write().await;
        authenticator.generate_peak_path(start, end).await
    }
    
    // Typing authenticity achievement methods
    #[cfg(feature = "typing")]
    #[cfg_attr(docsrs, doc(cfg(feature = "typing")))]
    /// Achieves typing authenticity for the given text
    pub async fn achieve_typing_authenticity(&self, text: &str) -> Result<TypingSequence> {
        let mut authenticator = self.typing_authenticator.write().await;
        authenticator.achieve_authenticity(text).await
    }
    
    #[cfg(feature = "typing")]
    #[cfg_attr(docsrs, doc(cfg(feature = "typing")))]
    /// Applies natural typing variations in the text
    pub async fn apply_natural_variations(&self, text: &str, variation_rate: f32) -> Result<String> {
        let mut authenticator = self.typing_authenticator.write().await;
        authenticator.apply_variations(text, variation_rate.into()).await
    }
    
    // Audio authenticity achievement methods
    #[cfg(feature = "audio")]
    #[cfg_attr(docsrs, doc(cfg(feature = "audio")))]
    /// Achieves audio authenticity with natural characteristics
    pub async fn achieve_audio_authenticity(&self, audio: audio::AudioData) -> Result<audio::AuthenticAudio> {
        let mut authenticator = self.audio_authenticator.write().await;
        authenticator.achieve_authenticity(audio).await
    }
    
    #[cfg(feature = "audio")]
    #[cfg_attr(docsrs, doc(cfg(feature = "audio")))]
    /// Applies natural voice patterns to audio
    pub async fn apply_natural_voice_patterns(&self, audio: audio::AudioData) -> Result<audio::AudioData> {
        let mut authenticator = self.audio_authenticator.write().await;
        authenticator.apply_voice_patterns(audio).await
    }
    
    // Visual authenticity achievement methods
    #[cfg(feature = "visual")]
    #[cfg_attr(docsrs, doc(cfg(feature = "visual")))]
    /// Achieves visual authenticity of video frames
    pub async fn achieve_visual_authenticity(&self, frames: &[visual::VideoFrame]) -> Result<Vec<visual::VideoFrame>> {
        let mut authenticator = self.visual_authenticator.write().await;
        authenticator.achieve_authenticity(frames).await
    }
    
    #[cfg(feature = "visual")]
    #[cfg_attr(docsrs, doc(cfg(feature = "visual")))]
    /// Generates natural gaze patterns
    pub async fn generate_natural_gaze(&self, duration: std::time::Duration) -> Result<visual::GazePattern> {
        let mut authenticator = self.visual_authenticator.write().await;
        authenticator.generate_gaze_pattern(duration).await
    }
    
    // Human authenticity validation methods
    
    #[cfg(feature = "authenticity")]
    #[cfg_attr(docsrs, doc(cfg(feature = "authenticity")))]
    /// Achieves peak behavioral patterns for optimal authenticity
    pub async fn validate_authenticity(&self, content: &str) -> Result<authenticity::AuthenticityValidation> {
        let mut validator = self.authenticity_validator.write().await;
        validator.validate_authenticity(content).await.map_err(|e| 
            Aegnt27Error::Validation(crate::error::ValidationError::RequiredFieldMissing(e.to_string()))
        )
    }
}

/// Builder for configuring and creating an aegnt-27 engine
#[derive(Debug, Default)]
pub struct Aegnt27EngineBuilder {
    #[cfg(feature = "mouse")]
    mouse_enabled: bool,
    #[cfg(feature = "typing")]
    typing_enabled: bool,
    #[cfg(feature = "audio")]
    audio_enabled: bool,
    #[cfg(feature = "visual")]
    visual_enabled: bool,
    #[cfg(feature = "authenticity")]
    authenticity_enabled: bool,
    
    config: Option<Aegnt27Config>,
}

impl Aegnt27EngineBuilder {
    /// Creates a new builder
    pub fn new() -> Self {
        Self::default()
    }
    
    #[cfg(feature = "mouse")]
    /// Enables mouse authenticity achievement
    pub fn enable_mouse_authenticity(mut self) -> Self {
        self.mouse_enabled = true;
        self
    }
    
    #[cfg(feature = "typing")]
    /// Enables typing authenticity achievement
    pub fn enable_typing_authenticity(mut self) -> Self {
        self.typing_enabled = true;
        self
    }
    
    #[cfg(feature = "audio")]
    /// Enables audio authenticity achievement
    pub fn enable_audio_authenticity(mut self) -> Self {
        self.audio_enabled = true;
        self
    }
    
    #[cfg(feature = "visual")]
    /// Enables visual authenticity achievement
    pub fn enable_visual_authenticity(mut self) -> Self {
        self.visual_enabled = true;
        self
    }
    
    #[cfg(feature = "authenticity")]
    /// Enables human authenticity validation
    pub fn enable_authenticity_validation(mut self) -> Self {
        self.authenticity_enabled = true;
        self
    }
    
    /// Enables all available features
    pub fn enable_all_features(mut self) -> Self {
        #[cfg(feature = "mouse")]
        { self.mouse_enabled = true; }
        #[cfg(feature = "typing")]
        { self.typing_enabled = true; }
        #[cfg(feature = "audio")]
        { self.audio_enabled = true; }
        #[cfg(feature = "visual")]
        { self.visual_enabled = true; }
        #[cfg(feature = "authenticity")]
        { self.authenticity_enabled = true; }
        self
    }
    
    /// Sets a custom configuration
    pub fn with_config(mut self, config: Aegnt27Config) -> Self {
        self.config = Some(config);
        self
    }
    
    /// Loads configuration from a file
    pub fn with_config_file<P: AsRef<std::path::Path>>(mut self, path: P) -> Result<Self> {
        let config = Aegnt27Config::from_file(path)?;
        self.config = Some(config);
        Ok(self)
    }
    
    /// Builds the aegnt-27 engine
    pub async fn build(self) -> Result<Aegnt27Engine> {
        let config = self.config.unwrap_or_else(|| {
            let mut builder = Aegnt27Config::builder();
            
            #[cfg(feature = "mouse")]
            if self.mouse_enabled {
                builder = builder.mouse(mouse::MouseConfig::default());
            }
            
            #[cfg(feature = "typing")]
            if self.typing_enabled {
                builder = builder.typing(typing::TypingConfig::default());
            }
            
            #[cfg(feature = "audio")]
            if self.audio_enabled {
                builder = builder.audio(audio::AudioConfig::default());
            }
            
            #[cfg(feature = "visual")]
            if self.visual_enabled {
                builder = builder.visual(visual::VisualConfig::default());
            }
            
            #[cfg(feature = "authenticity")]
            if self.authenticity_enabled {
                // Authenticity config is handled internally
                let _ = self.authenticity_enabled; // Use the variable to avoid warnings
            }
            
            builder.build().expect("Failed to build default config")
        });
        
        Aegnt27Engine::with_config(config).await
    }
}

// Convenience functions for quick usage
#[cfg(feature = "authenticity")]
/// Quick authenticity validation function for simple use cases
pub async fn validate_authenticity(content: &str) -> Result<authenticity::AuthenticityValidation> {
    Aegnt27Engine::quick_validate(content, 0.95).await
}

#[cfg(feature = "mouse")]
/// Quick mouse path authenticity achievement
pub async fn achieve_mouse_authenticity(path: MousePath) -> Result<AuthenticMousePath> {
    let engine = Aegnt27Engine::builder()
        .enable_mouse_authenticity()
        .build()
        .await?;
    engine.achieve_mouse_authenticity(path).await
}

#[cfg(feature = "typing")]
/// Quick typing authenticity achievement
pub async fn achieve_typing_authenticity(text: &str) -> Result<TypingSequence> {
    let engine = Aegnt27Engine::builder()
        .enable_typing_authenticity()
        .build()
        .await?;
    engine.achieve_typing_authenticity(text).await
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_engine_builder() {
        let builder = Aegnt27Engine::builder();
        assert!(builder.config.is_none());
    }
    
    #[tokio::test]
    async fn test_builder_with_all_features() {
        let result = Aegnt27Engine::builder()
            .enable_all_features()
            .build()
            .await;
        
        assert!(result.is_ok());
    }
    
    #[cfg(feature = "authenticity")]
    #[tokio::test]
    async fn test_quick_validate() {
        let result = validate_authenticity("This is a test message").await;
        assert!(result.is_ok());
    }
}