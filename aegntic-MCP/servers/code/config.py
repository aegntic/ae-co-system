#!/usr/bin/env python3
"""
Configuration management for Porkbun MCP Server
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)

@dataclass
class ServerConfig:
    """Server configuration settings"""
    
    # API Configuration
    porkbun_api_base: str = "https://api.porkbun.com/api/json/v3"
    porkbun_api_ipv4: str = "https://api-ipv4.porkbun.com/api/json/v3"
    
    # Security Settings
    encryption_key: Optional[str] = field(default_factory=lambda: os.environ.get('PORKBUN_MCP_ENCRYPTION_KEY'))
    credentials_file: str = "/workspace/data/porkbun_credentials.json"
    
    # Rate Limiting
    rate_limit_window: int = 10  # seconds
    rate_limit_requests: int = 10  # requests per window
    
    # Cache Settings
    cache_ttl_default: int = 300  # 5 minutes
    cache_ttl_pricing: int = 3600  # 1 hour (pricing changes less frequently)
    cache_ttl_dns: int = 600  # 10 minutes
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: str = "/workspace/logs/porkbun_mcp.log"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Request Timeouts
    request_timeout: int = 30  # seconds
    connection_timeout: int = 10  # seconds
    
    # File Storage
    ssl_cert_dir: str = "/workspace/ssl_certificates"
    temp_dir: str = "/workspace/temp"
    
    # Development/Production Settings
    environment: str = field(default_factory=lambda: os.environ.get('ENVIRONMENT', 'development'))
    debug: bool = field(default_factory=lambda: os.environ.get('DEBUG', '').lower() == 'true')
    
    # Server Settings
    host: str = field(default_factory=lambda: os.environ.get('HOST', '0.0.0.0'))
    port: int = field(default_factory=lambda: int(os.environ.get('PORT', '8080')))
    
    # Health Check Settings
    health_check_enabled: bool = True
    health_check_interval: int = 60  # seconds
    
    @classmethod
    def from_file(cls, config_file: str) -> 'ServerConfig':
        """Load configuration from file"""
        try:
            with open(config_file, 'r') as f:
                data = json.load(f)
            
            config = cls()
            for key, value in data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
                else:
                    logger.warning(f"Unknown configuration key: {key}")
            
            return config
            
        except FileNotFoundError:
            logger.info(f"Configuration file {config_file} not found, using defaults")
            return cls()
        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            return cls()
    
    def to_file(self, config_file: str) -> None:
        """Save configuration to file"""
        try:
            Path(config_file).parent.mkdir(parents=True, exist_ok=True)
            
            config_dict = {
                key: value for key, value in self.__dict__.items()
                if not key.startswith('_') and value is not None
            }
            
            with open(config_file, 'w') as f:
                json.dump(config_dict, f, indent=2)
                
            logger.info(f"Configuration saved to {config_file}")
            
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def setup_directories(self) -> None:
        """Create necessary directories"""
        directories = [
            Path(self.log_file).parent,
            Path(self.credentials_file).parent,
            self.ssl_cert_dir,
            self.temp_dir
        ]
        
        for directory in directories:
            try:
                Path(directory).mkdir(parents=True, exist_ok=True)
                logger.debug(f"Created directory: {directory}")
            except Exception as e:
                logger.error(f"Error creating directory {directory}: {e}")
    
    def setup_logging(self) -> None:
        """Configure logging based on settings"""
        self.setup_directories()
        
        # Convert log level string to logging constant
        level = getattr(logging, self.log_level.upper(), logging.INFO)
        
        # Configure root logger
        logging.basicConfig(
            level=level,
            format=self.log_format,
            handlers=[
                logging.FileHandler(self.log_file, mode='a'),
                logging.StreamHandler()
            ]
        )
        
        logger.info(f"Logging configured - Level: {self.log_level}, File: {self.log_file}")
    
    def validate(self) -> None:
        """Validate configuration settings"""
        errors = []
        
        # Validate rate limiting
        if self.rate_limit_window <= 0:
            errors.append("rate_limit_window must be positive")
        
        if self.rate_limit_requests <= 0:
            errors.append("rate_limit_requests must be positive")
        
        # Validate timeouts
        if self.request_timeout <= 0:
            errors.append("request_timeout must be positive")
        
        if self.connection_timeout <= 0:
            errors.append("connection_timeout must be positive")
        
        # Validate cache TTL
        if self.cache_ttl_default <= 0:
            errors.append("cache_ttl_default must be positive")
        
        # Validate port
        if not (1 <= self.port <= 65535):
            errors.append("port must be between 1 and 65535")
        
        if errors:
            raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
        
        logger.info("Configuration validation passed")
    
    def get_cache_ttl(self, cache_type: str) -> int:
        """Get cache TTL for specific cache type"""
        cache_ttls = {
            'pricing': self.cache_ttl_pricing,
            'dns': self.cache_ttl_dns,
            'default': self.cache_ttl_default
        }
        
        return cache_ttls.get(cache_type, self.cache_ttl_default)

class ConfigManager:
    """Configuration manager singleton"""
    
    _instance: Optional['ConfigManager'] = None
    _config: Optional[ServerConfig] = None
    
    def __new__(cls) -> 'ConfigManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def load_config(self, config_file: Optional[str] = None) -> ServerConfig:
        """Load configuration from file or environment"""
        if self._config is None:
            if config_file and Path(config_file).exists():
                self._config = ServerConfig.from_file(config_file)
            else:
                self._config = ServerConfig()
            
            self._config.validate()
            self._config.setup_logging()
            self._config.setup_directories()
        
        return self._config
    
    @property
    def config(self) -> ServerConfig:
        """Get current configuration"""
        if self._config is None:
            return self.load_config()
        return self._config
    
    def reload_config(self, config_file: Optional[str] = None) -> ServerConfig:
        """Reload configuration"""
        self._config = None
        return self.load_config(config_file)

# Global configuration instance
config_manager = ConfigManager()

def get_config() -> ServerConfig:
    """Get current configuration"""
    return config_manager.config

def load_config(config_file: Optional[str] = None) -> ServerConfig:
    """Load configuration from file"""
    return config_manager.load_config(config_file)
