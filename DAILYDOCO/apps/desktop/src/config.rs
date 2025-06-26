//! Configuration management for DailyDoco Pro Desktop

use aegnt_27::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyDocoConfig {
    // pub aegnt: AegntConfig,
    pub capture: CaptureConfig,
    pub export: ExportConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    pub quality: VideoQuality,
    pub fps: u32,
    pub audio_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoQuality {
    HD720,
    HD1080,
    UHD4K,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportConfig {
    pub format: VideoFormat,
    pub compression: CompressionLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoFormat {
    MP4,
    WEBM,
    MOV,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompressionLevel {
    Low,
    Medium,
    High,
}

impl Default for DailyDocoConfig {
    fn default() -> Self {
        Self {
            // aegnt: AegntConfig::default(),
            capture: CaptureConfig {
                quality: VideoQuality::HD1080,
                fps: 30,
                audio_enabled: true,
            },
            export: ExportConfig {
                format: VideoFormat::MP4,
                compression: CompressionLevel::Medium,
            },
        }
    }
}