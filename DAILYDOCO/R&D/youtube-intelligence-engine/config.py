"""Configuration management for YouTube Intelligence Engine."""

import os
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()


class Config:
    """Centralized configuration management."""
    
    def __init__(self):
        self._config = self._load_config()
        logger.info("Configuration loaded", config_keys=list(self._config.keys()))
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables and defaults."""
        
        return {
            # OpenRouter AI Configuration
            "openrouter": {
                "api_key": os.getenv("OPENROUTER_API_KEY", "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"),
                "base_url": "https://openrouter.ai/api/v1",
                "models": {
                    "reasoning": "deepseek/deepseek-r1-distill-llama-70b",
                    "general": "meta-llama/llama-3.1-8b-instruct:free", 
                    "creative": "mistralai/mistral-7b-instruct:free",
                    "fallback": "qwen/qwen-2-7b-instruct:free"
                }
            },
            
            # Database Configuration
            "database": {
                "postgres_url": os.getenv("POSTGRES_URL", "postgresql://intelligence_user:intelligence_pass@localhost:5432/youtube_intelligence"),
                "neo4j_url": os.getenv("NEO4J_URL", "bolt://localhost:7687"),
                "neo4j_user": os.getenv("NEO4J_USER", "neo4j"),
                "neo4j_password": os.getenv("NEO4J_PASSWORD", "intelligence_neo4j"),
                "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379/0")
            },
            
            # Server Configuration  
            "server": {
                "host": os.getenv("HOST", "0.0.0.0"),
                "port": int(os.getenv("PORT", "8000")),
                "debug": os.getenv("DEBUG", "false").lower() == "true",
                "log_level": os.getenv("LOG_LEVEL", "info")
            },
            
            # YouTube Processing Configuration
            "youtube": {
                "max_video_duration": int(os.getenv("MAX_VIDEO_DURATION", "7200")),  # 2 hours
                "download_audio": os.getenv("DOWNLOAD_AUDIO", "true").lower() == "true",
                "extract_thumbnails": os.getenv("EXTRACT_THUMBNAILS", "true").lower() == "true",
                "max_transcript_length": int(os.getenv("MAX_TRANSCRIPT_LENGTH", "50000"))
            },
            
            # Graphitti Configuration
            "graphitti": {
                "auto_snapshots": os.getenv("AUTO_SNAPSHOTS", "true").lower() == "true",
                "snapshot_retention_days": int(os.getenv("SNAPSHOT_RETENTION_DAYS", "30")),
                "max_snapshots": int(os.getenv("MAX_SNAPSHOTS", "100")),
                "enable_scheduler": os.getenv("ENABLE_SCHEDULER", "true").lower() == "true"
            },
            
            # Security Configuration
            "security": {
                "cors_origins": os.getenv("CORS_ORIGINS", "*").split(","),
                "api_key_header": os.getenv("API_KEY_HEADER", "X-API-Key"),
                "rate_limit_per_minute": int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
            },
            
            # Feature Flags
            "features": {
                "enable_ai_analysis": os.getenv("ENABLE_AI_ANALYSIS", "true").lower() == "true",
                "enable_graphitti": os.getenv("ENABLE_GRAPHITTI", "true").lower() == "true",
                "enable_caching": os.getenv("ENABLE_CACHING", "true").lower() == "true",
                "enable_metrics": os.getenv("ENABLE_METRICS", "true").lower() == "true"
            }
        }
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation (e.g., 'openrouter.api_key')."""
        
        keys = key_path.split(".")
        value = self._config
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key_path: str, value: Any) -> None:
        """Set configuration value using dot notation."""
        
        keys = key_path.split(".")
        config = self._config
        
        # Navigate to the parent dictionary
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        # Set the final value
        config[keys[-1]] = value
        logger.info(f"Configuration updated: {key_path} = {value}")
    
    def update_openrouter_key(self, new_api_key: str) -> None:
        """Update OpenRouter API key."""
        
        self.set("openrouter.api_key", new_api_key)
        
        # Optionally persist to environment or config file
        # For now, just update in memory
        logger.info("OpenRouter API key updated")
    
    def get_openrouter_config(self) -> Dict[str, Any]:
        """Get complete OpenRouter configuration."""
        return self.get("openrouter", {})
    
    def get_database_config(self) -> Dict[str, Any]:
        """Get complete database configuration."""
        return self.get("database", {})
    
    def get_server_config(self) -> Dict[str, Any]:
        """Get complete server configuration."""
        return self.get("server", {})
    
    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled."""
        return self.get(f"features.{feature_name}", False)
    
    def to_dict(self) -> Dict[str, Any]:
        """Get all configuration as dictionary."""
        # Return a copy to prevent external modification
        return dict(self._config)
    
    def reload(self) -> None:
        """Reload configuration from environment."""
        self._config = self._load_config()
        logger.info("Configuration reloaded")


# Global configuration instance
config = Config()


def get_config() -> Config:
    """Get the global configuration instance."""
    return config


def update_openrouter_key(new_api_key: str) -> None:
    """Update OpenRouter API key globally."""
    config.update_openrouter_key(new_api_key)


def get_openrouter_models() -> Dict[str, str]:
    """Get available OpenRouter models with descriptions."""
    models = config.get("openrouter.models", {})
    return {
        model_type: f"{model_id} - {_get_model_description(model_type)}"
        for model_type, model_id in models.items()
    }


def _get_model_description(model_type: str) -> str:
    """Get description for model type."""
    descriptions = {
        "reasoning": "Best for complex analysis and reasoning tasks",
        "general": "Fast general purpose analysis and content understanding",
        "creative": "Good for creative insights and innovative approaches",
        "fallback": "Reliable fallback option with good performance"
    }
    return descriptions.get(model_type, "General purpose model")


# Environment variable helpers
def set_openrouter_key_env(api_key: str) -> None:
    """Set OpenRouter API key as environment variable."""
    os.environ["OPENROUTER_API_KEY"] = api_key
    config.reload()  # Reload to pick up the new environment variable


def get_env_template() -> str:
    """Get environment variable template for easy configuration."""
    
    template = """
# YouTube Intelligence Engine Configuration
# Copy these to your .env file and update as needed

# OpenRouter AI Configuration
OPENROUTER_API_KEY=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

# Database Configuration
POSTGRES_URL=postgresql://intelligence_user:intelligence_pass@localhost:5432/youtube_intelligence
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=intelligence_neo4j
REDIS_URL=redis://localhost:6379/0

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=info

# YouTube Processing
MAX_VIDEO_DURATION=7200
DOWNLOAD_AUDIO=true
EXTRACT_THUMBNAILS=true
MAX_TRANSCRIPT_LENGTH=50000

# Graphitti Configuration
AUTO_SNAPSHOTS=true
SNAPSHOT_RETENTION_DAYS=30
MAX_SNAPSHOTS=100
ENABLE_SCHEDULER=true

# Security
CORS_ORIGINS=*
RATE_LIMIT_PER_MINUTE=60

# Feature Flags
ENABLE_AI_ANALYSIS=true
ENABLE_GRAPHITTI=true
ENABLE_CACHING=true
ENABLE_METRICS=true
"""
    
    return template.strip()