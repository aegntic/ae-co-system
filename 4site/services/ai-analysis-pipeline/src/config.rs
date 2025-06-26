use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub worker_count: usize,
    pub ai_config: AiConfig,
    pub partner_config: PartnerConfig,
    pub analysis_config: AnalysisConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AiConfig {
    pub model_path: String,
    pub tokenizer_path: String,
    pub max_tokens: usize,
    pub temperature: f32,
    pub use_local_models: bool,
    pub fallback_api_key: Option<String>,
    pub gemini_api_key: Option<String>,
    pub openai_api_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PartnerConfig {
    pub recommendations_enabled: bool,
    pub max_recommendations: usize,
    pub confidence_threshold: f32,
    pub partners_db_path: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AnalysisConfig {
    pub timeout_seconds: u64,
    pub max_file_size_mb: usize,
    pub supported_file_types: Vec<String>,
    pub analysis_depth: AnalysisDepth,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum AnalysisDepth {
    Basic,
    Full,
    Deep,
}

impl Config {
    pub fn load() -> Result<Self> {
        dotenvy::dotenv().ok();

        let config = Self {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            worker_count: env::var("WORKER_COUNT")
                .unwrap_or_else(|_| "2".to_string())
                .parse()
                .unwrap_or(2),
            ai_config: AiConfig {
                model_path: env::var("AI_MODEL_PATH")
                    .unwrap_or_else(|_| "./models/gemma-2b".to_string()),
                tokenizer_path: env::var("AI_TOKENIZER_PATH")
                    .unwrap_or_else(|_| "./models/tokenizer.json".to_string()),
                max_tokens: env::var("AI_MAX_TOKENS")
                    .unwrap_or_else(|_| "2048".to_string())
                    .parse()
                    .unwrap_or(2048),
                temperature: env::var("AI_TEMPERATURE")
                    .unwrap_or_else(|_| "0.7".to_string())
                    .parse()
                    .unwrap_or(0.7),
                use_local_models: env::var("USE_LOCAL_MODELS")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                fallback_api_key: env::var("FALLBACK_API_KEY").ok(),
                gemini_api_key: env::var("GEMINI_API_KEY").ok(),
                openai_api_key: env::var("OPENAI_API_KEY").ok(),
            },
            partner_config: PartnerConfig {
                recommendations_enabled: env::var("PARTNER_RECOMMENDATIONS_ENABLED")
                    .unwrap_or_else(|_| "true".to_string())
                    .parse()
                    .unwrap_or(true),
                max_recommendations: env::var("MAX_PARTNER_RECOMMENDATIONS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .unwrap_or(5),
                confidence_threshold: env::var("PARTNER_CONFIDENCE_THRESHOLD")
                    .unwrap_or_else(|_| "0.7".to_string())
                    .parse()
                    .unwrap_or(0.7),
                partners_db_path: env::var("PARTNERS_DB_PATH")
                    .unwrap_or_else(|_| "./data/partners.json".to_string()),
            },
            analysis_config: AnalysisConfig {
                timeout_seconds: env::var("ANALYSIS_TIMEOUT_SECONDS")
                    .unwrap_or_else(|_| "300".to_string())
                    .parse()
                    .unwrap_or(300),
                max_file_size_mb: env::var("MAX_FILE_SIZE_MB")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
                supported_file_types: vec![
                    "md".to_string(),
                    "txt".to_string(),
                    "json".to_string(),
                    "yml".to_string(),
                    "yaml".to_string(),
                    "toml".to_string(),
                ],
                analysis_depth: AnalysisDepth::Full,
            },
        };

        Ok(config)
    }
}