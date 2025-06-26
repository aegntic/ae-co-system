//! Shared types for the DailyDoco Pro workspace

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureSession {
    pub id: Uuid,
    pub project_id: Uuid,
    pub started_at: DateTime<Utc>,
    pub duration: Option<std::time::Duration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoExport {
    pub id: Uuid,
    pub session_id: Uuid,
    pub format: ExportFormat,
    pub quality: ExportQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    MP4,
    WEBM,
    MOV,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportQuality {
    Draft,
    Standard,
    High,
    Ultra,
}