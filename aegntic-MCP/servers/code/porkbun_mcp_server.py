#!/usr/bin/env python3
"""
Porkbun MCP Server
A comprehensive and secure MCP server for Porkbun API integration.

Author: MiniMax Agent
License: MIT
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import hashlib
import hmac
import re
from urllib.parse import urlparse

import aiohttp
import cryptography.fernet
from mcp.server import Server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel,
    Prompt,
    PromptMessage,
    PromptArgument,
)
import mcp.server.stdio
import mcp.types as types

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/workspace/logs/porkbun_mcp.log', mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Security configuration
ENCRYPTION_KEY = os.environ.get('PORKBUN_MCP_ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = cryptography.fernet.Fernet.generate_key()
    logger.warning("No encryption key found. Generated new key. Set PORKBUN_MCP_ENCRYPTION_KEY environment variable.")

cipher = cryptography.fernet.Fernet(ENCRYPTION_KEY)

# API Configuration
PORKBUN_API_BASE = "https://api.porkbun.com/api/json/v3"
PORKBUN_API_IPV4 = "https://api-ipv4.porkbun.com/api/json/v3"
RATE_LIMIT_WINDOW = 10  # seconds
RATE_LIMIT_REQUESTS = 10  # requests per window

@dataclass
class RateLimitInfo:
    """Rate limiting information for API endpoints"""
    requests: int = 0
    window_start: float = 0
    
@dataclass
class ApiCredentials:
    """Secure API credentials storage"""
    api_key: str
    secret_api_key: str
    
    def to_encrypted_dict(self) -> Dict[str, bytes]:
        """Convert credentials to encrypted format"""
        return {
            'api_key': cipher.encrypt(self.api_key.encode()),
            'secret_api_key': cipher.encrypt(self.secret_api_key.encode())
        }
    
    @classmethod
    def from_encrypted_dict(cls, data: Dict[str, bytes]) -> 'ApiCredentials':
        """Create credentials from encrypted format"""
        return cls(
            api_key=cipher.decrypt(data['api_key']).decode(),
            secret_api_key=cipher.decrypt(data['secret_api_key']).decode()
        )

class SecurityValidator:
    """Input validation and sanitization"""
    
    @staticmethod
    def validate_domain(domain: str) -> bool:
        """Validate domain name format"""
        if not domain or len(domain) > 253:
            return False
        
        # Basic domain regex
        domain_pattern = re.compile(
            r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$'
        )
        return bool(domain_pattern.match(domain))
    
    @staticmethod
    def validate_ip(ip: str) -> bool:
        """Validate IP address format (IPv4 or IPv6)"""
        import ipaddress
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_dns_record_type(record_type: str) -> bool:
        """Validate DNS record type"""
        valid_types = {'A', 'MX', 'CNAME', 'ALIAS', 'TXT', 'NS', 'AAAA', 'SRV', 'TLSA', 'CAA', 'HTTPS', 'SVCB'}
        return record_type.upper() in valid_types
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            return ""
        
        # Remove null bytes and control characters
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
        
        # Trim to max length
        return sanitized[:max_length].strip()

class CacheManager:
    """Simple in-memory cache with TTL"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired"""
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry['expires']:
                return entry['value']
            else:
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set cached value with TTL in seconds"""
        self._cache[key] = {
            'value': value,
            'expires': time.time() + ttl
        }
    
    def clear(self) -> None:
        """Clear all cached entries"""
        self._cache.clear()

class PorkbunMCPServer:
    """Main MCP server class for Porkbun API"""
    
    def __init__(self):
        self.server = Server("porkbun-mcp")
        self.credentials: Optional[ApiCredentials] = None
        self.rate_limits: Dict[str, RateLimitInfo] = {}
        self.cache = CacheManager()
        self.session: Optional[aiohttp.ClientSession] = None
        self.validator = SecurityValidator()
        
        # Setup logging directory
        os.makedirs('/workspace/logs', exist_ok=True)
        
        # Register handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register all MCP handlers"""
        
        @self.server.list_resources()
        async def list_resources() -> List[Resource]:
            """List all available resources"""
            return [
                # API Documentation Resources
                Resource(
                    uri="porkbun://docs/api-overview",
                    name="Porkbun API Overview",
                    description="Complete overview of Porkbun API capabilities and authentication",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri="porkbun://docs/domain-management",
                    name="Domain Management Guide",
                    description="Best practices for domain management including nameservers, glue records, and URL forwarding",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri="porkbun://docs/dns-records",
                    name="DNS Records Reference",
                    description="Complete reference for DNS record types, validation rules, and best practices",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri="porkbun://docs/security-practices",
                    name="Security Best Practices",
                    description="Security guidelines for API usage, credential management, and safe domain operations",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri="porkbun://docs/troubleshooting",
                    name="Troubleshooting Guide",
                    description="Common issues, error codes, and solutions for Porkbun API operations",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri="porkbun://examples/dns-configurations",
                    name="DNS Configuration Examples",
                    description="Real-world examples of common DNS configurations and setups",
                    mimeType="application/json"
                ),
                Resource(
                    uri="porkbun://schemas/validation-rules",
                    name="Input Validation Rules",
                    description="Complete validation rules for domains, IPs, DNS records, and other inputs",
                    mimeType="application/json"
                )
            ]
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            """Read resource content by URI"""
            try:
                if uri == "porkbun://docs/api-overview":
                    return self._get_api_overview_resource()
                elif uri == "porkbun://docs/domain-management":
                    return self._get_domain_management_resource()
                elif uri == "porkbun://docs/dns-records":
                    return self._get_dns_records_resource()
                elif uri == "porkbun://docs/security-practices":
                    return self._get_security_practices_resource()
                elif uri == "porkbun://docs/troubleshooting":
                    return self._get_troubleshooting_resource()
                elif uri == "porkbun://examples/dns-configurations":
                    return self._get_dns_examples_resource()
                elif uri == "porkbun://schemas/validation-rules":
                    return self._get_validation_rules_resource()
                else:
                    raise ValueError(f"Unknown resource URI: {uri}")
            except Exception as e:
                logger.error(f"Error reading resource {uri}: {e}")
                raise
        
        @self.server.list_prompts()
        async def list_prompts() -> List[Prompt]:
            """List all available prompt templates"""
            return [
                # Domain Management Prompts
                Prompt(
                    name="setup-new-domain",
                    description="Complete setup guide for a new domain including DNS configuration",
                    arguments=[
                        PromptArgument(name="domain", description="Domain name to set up", required=True),
                        PromptArgument(name="website_ip", description="IP address for website (A record)", required=False),
                        PromptArgument(name="mail_server", description="Mail server hostname for MX record", required=False),
                        PromptArgument(name="include_www", description="Include www subdomain", required=False)
                    ]
                ),
                Prompt(
                    name="migrate-domain",
                    description="Step-by-step domain migration from another registrar",
                    arguments=[
                        PromptArgument(name="domain", description="Domain to migrate", required=True),
                        PromptArgument(name="current_registrar", description="Current registrar name", required=False),
                        PromptArgument(name="has_email", description="Domain has email services", required=False)
                    ]
                ),
                Prompt(
                    name="configure-dns-records",
                    description="Configure DNS records for common services",
                    arguments=[
                        PromptArgument(name="domain", description="Domain name", required=True),
                        PromptArgument(name="service_type", description="Type of service (website, email, cdn, etc.)", required=True),
                        PromptArgument(name="target", description="Target IP or hostname", required=True)
                    ]
                ),
                Prompt(
                    name="troubleshoot-dns",
                    description="Troubleshoot DNS issues and propagation problems",
                    arguments=[
                        PromptArgument(name="domain", description="Domain with issues", required=True),
                        PromptArgument(name="issue_description", description="Description of the problem", required=True),
                        PromptArgument(name="record_type", description="DNS record type having issues", required=False)
                    ]
                ),
                Prompt(
                    name="security-audit",
                    description="Perform security audit of domain configuration",
                    arguments=[
                        PromptArgument(name="domain", description="Domain to audit", required=True),
                        PromptArgument(name="check_dnssec", description="Include DNSSEC check", required=False),
                        PromptArgument(name="check_ssl", description="Include SSL certificate check", required=False)
                    ]
                ),
                Prompt(
                    name="bulk-domain-operation",
                    description="Perform operations on multiple domains efficiently",
                    arguments=[
                        PromptArgument(name="domains", description="Comma-separated list of domains", required=True),
                        PromptArgument(name="operation", description="Operation to perform (check, update_ns, etc.)", required=True),
                        PromptArgument(name="parameters", description="Additional parameters as JSON", required=False)
                    ]
                ),
                Prompt(
                    name="domain-portfolio-analysis",
                    description="Analyze domain portfolio for optimization opportunities",
                    arguments=[
                        PromptArgument(name="include_pricing", description="Include pricing analysis", required=False),
                        PromptArgument(name="include_expiry", description="Include expiry date analysis", required=False),
                        PromptArgument(name="include_dns", description="Include DNS configuration analysis", required=False)
                    ]
                )
            ]
        
        @self.server.get_prompt()
        async def get_prompt(name: str, arguments: Dict[str, str]) -> types.GetPromptResult:
            """Get prompt content by name with arguments"""
            try:
                if name == "setup-new-domain":
                    return self._get_setup_domain_prompt(arguments)
                elif name == "migrate-domain":
                    return self._get_migrate_domain_prompt(arguments)
                elif name == "configure-dns-records":
                    return self._get_configure_dns_prompt(arguments)
                elif name == "troubleshoot-dns":
                    return self._get_troubleshoot_dns_prompt(arguments)
                elif name == "security-audit":
                    return self._get_security_audit_prompt(arguments)
                elif name == "bulk-domain-operation":
                    return self._get_bulk_operation_prompt(arguments)
                elif name == "domain-portfolio-analysis":
                    return self._get_portfolio_analysis_prompt(arguments)
                else:
                    raise ValueError(f"Unknown prompt: {name}")
            except Exception as e:
                logger.error(f"Error getting prompt {name}: {e}")
                raise

        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            """List all available tools"""
            return [
                # General API tools
                Tool(
                    name="porkbun_ping",
                    description="Test connection to Porkbun API and get your IP address",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                Tool(
                    name="porkbun_get_pricing",
                    description="Get domain pricing information for all supported TLDs",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                
                # Domain management tools
                Tool(
                    name="porkbun_list_domains",
                    description="List all domains in account with optional pagination and labels",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "start": {"type": "integer", "description": "Starting index for pagination", "default": 0},
                            "include_labels": {"type": "boolean", "description": "Include label information", "default": False}
                        },
                        "required": []
                    }
                ),
                Tool(
                    name="porkbun_check_domain",
                    description="Check domain availability and pricing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name to check"}
                        },
                        "required": ["domain"]
                    }
                ),
                Tool(
                    name="porkbun_update_nameservers",
                    description="Update nameservers for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "nameservers": {"type": "array", "items": {"type": "string"}, "description": "List of nameserver hostnames"}
                        },
                        "required": ["domain", "nameservers"]
                    }
                ),
                Tool(
                    name="porkbun_get_nameservers",
                    description="Get current nameservers for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"}
                        },
                        "required": ["domain"]
                    }
                ),
                
                # URL forwarding tools
                Tool(
                    name="porkbun_add_url_forward",
                    description="Add URL forwarding for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "subdomain": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""},
                            "location": {"type": "string", "description": "Target URL for forwarding"},
                            "type": {"type": "string", "enum": ["temporary", "permanent"], "description": "Forward type"},
                            "include_path": {"type": "boolean", "description": "Include URI path in redirection"},
                            "wildcard": {"type": "boolean", "description": "Forward all subdomains"}
                        },
                        "required": ["domain", "location", "type", "include_path", "wildcard"]
                    }
                ),
                Tool(
                    name="porkbun_get_url_forwards",
                    description="Get URL forwarding records for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"}
                        },
                        "required": ["domain"]
                    }
                ),
                Tool(
                    name="porkbun_delete_url_forward",
                    description="Delete a URL forward record",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "record_id": {"type": "string", "description": "URL forward record ID"}
                        },
                        "required": ["domain", "record_id"]
                    }
                ),
                
                # Glue record tools
                Tool(
                    name="porkbun_create_glue_record",
                    description="Create glue record for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "subdomain": {"type": "string", "description": "Glue host subdomain"},
                            "ips": {"type": "array", "items": {"type": "string"}, "description": "List of IP addresses"}
                        },
                        "required": ["domain", "subdomain", "ips"]
                    }
                ),
                Tool(
                    name="porkbun_update_glue_record",
                    description="Update glue record for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "subdomain": {"type": "string", "description": "Glue host subdomain"},
                            "ips": {"type": "array", "items": {"type": "string"}, "description": "List of IP addresses"}
                        },
                        "required": ["domain", "subdomain", "ips"]
                    }
                ),
                Tool(
                    name="porkbun_delete_glue_record",
                    description="Delete glue record for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "subdomain": {"type": "string", "description": "Glue host subdomain"}
                        },
                        "required": ["domain", "subdomain"]
                    }
                ),
                Tool(
                    name="porkbun_get_glue_records",
                    description="Get glue records for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"}
                        },
                        "required": ["domain"]
                    }
                ),
                
                # DNS management tools
                Tool(
                    name="porkbun_create_dns_record",
                    description="Create a new DNS record",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "name": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""},
                            "type": {"type": "string", "enum": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"], "description": "DNS record type"},
                            "content": {"type": "string", "description": "Record content/value"},
                            "ttl": {"type": "integer", "description": "Time to live in seconds (minimum 600)", "default": 600},
                            "prio": {"type": "integer", "description": "Priority for records that support it", "default": 0},
                            "notes": {"type": "string", "description": "Optional notes", "default": ""}
                        },
                        "required": ["domain", "type", "content"]
                    }
                ),
                Tool(
                    name="porkbun_edit_dns_record",
                    description="Edit a DNS record by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "record_id": {"type": "string", "description": "DNS record ID"},
                            "name": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""},
                            "type": {"type": "string", "enum": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"], "description": "DNS record type"},
                            "content": {"type": "string", "description": "Record content/value"},
                            "ttl": {"type": "integer", "description": "Time to live in seconds (minimum 600)", "default": 600},
                            "prio": {"type": "integer", "description": "Priority for records that support it", "default": 0},
                            "notes": {"type": "string", "description": "Optional notes", "default": ""}
                        },
                        "required": ["domain", "record_id", "type", "content"]
                    }
                ),
                Tool(
                    name="porkbun_edit_dns_records_by_type",
                    description="Edit all DNS records matching subdomain and type",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "type": {"type": "string", "enum": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"], "description": "DNS record type"},
                            "subdomain": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""},
                            "content": {"type": "string", "description": "Record content/value"},
                            "ttl": {"type": "integer", "description": "Time to live in seconds (minimum 600)", "default": 600},
                            "prio": {"type": "integer", "description": "Priority for records that support it", "default": 0},
                            "notes": {"type": "string", "description": "Optional notes", "default": ""}
                        },
                        "required": ["domain", "type", "content"]
                    }
                ),
                Tool(
                    name="porkbun_delete_dns_record",
                    description="Delete a specific DNS record by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "record_id": {"type": "string", "description": "DNS record ID"}
                        },
                        "required": ["domain", "record_id"]
                    }
                ),
                Tool(
                    name="porkbun_delete_dns_records_by_type",
                    description="Delete all DNS records matching subdomain and type",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "type": {"type": "string", "enum": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"], "description": "DNS record type"},
                            "subdomain": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""}
                        },
                        "required": ["domain", "type"]
                    }
                ),
                Tool(
                    name="porkbun_get_dns_records",
                    description="Get DNS records for a domain or specific record by ID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "record_id": {"type": "string", "description": "Optional: specific record ID", "default": ""}
                        },
                        "required": ["domain"]
                    }
                ),
                Tool(
                    name="porkbun_get_dns_records_by_type",
                    description="Get DNS records by domain, type, and subdomain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "type": {"type": "string", "enum": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"], "description": "DNS record type"},
                            "subdomain": {"type": "string", "description": "Subdomain (leave empty for root)", "default": ""}
                        },
                        "required": ["domain", "type"]
                    }
                ),
                
                # DNSSEC tools
                Tool(
                    name="porkbun_create_dnssec_record",
                    description="Create a DNSSEC record at the registry",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "key_tag": {"type": "string", "description": "Key Tag"},
                            "algorithm": {"type": "string", "description": "DS Data Algorithm"},
                            "digest_type": {"type": "string", "description": "Digest Type"},
                            "digest": {"type": "string", "description": "Digest"},
                            "max_sig_life": {"type": "string", "description": "Max Sig Life", "default": ""},
                            "key_data_flags": {"type": "string", "description": "Key Data Flags", "default": ""},
                            "key_data_protocol": {"type": "string", "description": "Key Data Protocol", "default": ""},
                            "key_data_algo": {"type": "string", "description": "Key Data Algorithm", "default": ""},
                            "key_data_pub_key": {"type": "string", "description": "Key Data Public Key", "default": ""}
                        },
                        "required": ["domain", "key_tag", "algorithm", "digest_type", "digest"]
                    }
                ),
                Tool(
                    name="porkbun_get_dnssec_records",
                    description="Get DNSSEC records for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"}
                        },
                        "required": ["domain"]
                    }
                ),
                Tool(
                    name="porkbun_delete_dnssec_record",
                    description="Delete a DNSSEC record by key tag",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"},
                            "key_tag": {"type": "string", "description": "Key Tag to delete"}
                        },
                        "required": ["domain", "key_tag"]
                    }
                ),
                
                # SSL tools
                Tool(
                    name="porkbun_get_ssl_bundle",
                    description="Retrieve SSL certificate bundle for a domain",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain": {"type": "string", "description": "Domain name"}
                        },
                        "required": ["domain"]
                    }
                ),
                
                # Configuration tools
                Tool(
                    name="porkbun_set_credentials",
                    description="Set API credentials for Porkbun (encrypted storage)",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "api_key": {"type": "string", "description": "Porkbun API key"},
                            "secret_api_key": {"type": "string", "description": "Porkbun secret API key"}
                        },
                        "required": ["api_key", "secret_api_key"]
                    }
                ),
                Tool(
                    name="porkbun_clear_cache",
                    description="Clear all cached API responses",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            """Handle tool calls"""
            try:
                if name == "porkbun_set_credentials":
                    return await self._set_credentials(arguments)
                elif name == "porkbun_clear_cache":
                    return await self._clear_cache()
                elif name == "porkbun_get_pricing":
                    return await self._get_pricing()
                else:
                    # All other tools require credentials
                    if not self.credentials:
                        return [types.TextContent(
                            type="text",
                            text="❌ Error: No API credentials set. Use porkbun_set_credentials first."
                        )]
                    
                    # Route to appropriate handler
                    if name == "porkbun_ping":
                        return await self._ping()
                    elif name == "porkbun_list_domains":
                        return await self._list_domains(arguments)
                    elif name == "porkbun_check_domain":
                        return await self._check_domain(arguments)
                    elif name == "porkbun_update_nameservers":
                        return await self._update_nameservers(arguments)
                    elif name == "porkbun_get_nameservers":
                        return await self._get_nameservers(arguments)
                    elif name == "porkbun_add_url_forward":
                        return await self._add_url_forward(arguments)
                    elif name == "porkbun_get_url_forwards":
                        return await self._get_url_forwards(arguments)
                    elif name == "porkbun_delete_url_forward":
                        return await self._delete_url_forward(arguments)
                    elif name == "porkbun_create_glue_record":
                        return await self._create_glue_record(arguments)
                    elif name == "porkbun_update_glue_record":
                        return await self._update_glue_record(arguments)
                    elif name == "porkbun_delete_glue_record":
                        return await self._delete_glue_record(arguments)
                    elif name == "porkbun_get_glue_records":
                        return await self._get_glue_records(arguments)
                    elif name == "porkbun_create_dns_record":
                        return await self._create_dns_record(arguments)
                    elif name == "porkbun_edit_dns_record":
                        return await self._edit_dns_record(arguments)
                    elif name == "porkbun_edit_dns_records_by_type":
                        return await self._edit_dns_records_by_type(arguments)
                    elif name == "porkbun_delete_dns_record":
                        return await self._delete_dns_record(arguments)
                    elif name == "porkbun_delete_dns_records_by_type":
                        return await self._delete_dns_records_by_type(arguments)
                    elif name == "porkbun_get_dns_records":
                        return await self._get_dns_records(arguments)
                    elif name == "porkbun_get_dns_records_by_type":
                        return await self._get_dns_records_by_type(arguments)
                    elif name == "porkbun_create_dnssec_record":
                        return await self._create_dnssec_record(arguments)
                    elif name == "porkbun_get_dnssec_records":
                        return await self._get_dnssec_records(arguments)
                    elif name == "porkbun_delete_dnssec_record":
                        return await self._delete_dnssec_record(arguments)
                    elif name == "porkbun_get_ssl_bundle":
                        return await self._get_ssl_bundle(arguments)
                    else:
                        return [types.TextContent(
                            type="text", 
                            text=f"❌ Error: Unknown tool '{name}'"
                        )]
                        
            except Exception as e:
                logger.error(f"Error calling tool {name}: {str(e)}")
                return [types.TextContent(
                    type="text",
                    text=f"❌ Error: {str(e)}"
                )]
    
    async def _ensure_session(self):
        """Ensure HTTP session is available"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
    
    async def _check_rate_limit(self, endpoint: str) -> bool:
        """Check if rate limit allows request"""
        current_time = time.time()
        
        if endpoint not in self.rate_limits:
            self.rate_limits[endpoint] = RateLimitInfo()
        
        rate_info = self.rate_limits[endpoint]
        
        # Reset window if expired
        if current_time - rate_info.window_start >= RATE_LIMIT_WINDOW:
            rate_info.requests = 0
            rate_info.window_start = current_time
        
        # Check if limit exceeded
        if rate_info.requests >= RATE_LIMIT_REQUESTS:
            return False
        
        rate_info.requests += 1
        return True
    
    async def _make_api_request(self, endpoint: str, data: Dict[str, Any] = None, use_ipv4: bool = False) -> Dict[str, Any]:
        """Make authenticated API request to Porkbun"""
        await self._ensure_session()
        
        # Check rate limiting
        if not await self._check_rate_limit(endpoint):
            raise Exception("Rate limit exceeded. Please wait before making more requests.")
        
        # Prepare request
        base_url = PORKBUN_API_IPV4 if use_ipv4 else PORKBUN_API_BASE
        url = f"{base_url}/{endpoint}"
        
        # Add credentials to request data
        request_data = data or {}
        if self.credentials:
            request_data.update({
                "apikey": self.credentials.api_key,
                "secretapikey": self.credentials.secret_api_key
            })
        
        logger.info(f"Making API request to: {endpoint}")
        
        async with self.session.post(url, json=request_data) as response:
            if response.status != 200:
                raise Exception(f"HTTP {response.status}: {await response.text()}")
            
            result = await response.json()
            
            # Check API status
            if result.get('status') != 'SUCCESS':
                raise Exception(f"API Error: {result.get('status', 'Unknown error')}")
            
            return result
    
    # Tool implementation methods
    
    async def _set_credentials(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Set API credentials"""
        try:
            api_key = self.validator.sanitize_string(arguments.get('api_key', ''))
            secret_api_key = self.validator.sanitize_string(arguments.get('secret_api_key', ''))
            
            if not api_key or not secret_api_key:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Both api_key and secret_api_key are required"
                )]
            
            self.credentials = ApiCredentials(api_key, secret_api_key)
            
            # Test credentials with ping
            try:
                await self._make_api_request("ping")
                
                # Save encrypted credentials to file
                creds_file = Path('/workspace/data/porkbun_credentials.json')
                creds_file.parent.mkdir(exist_ok=True)
                
                with open(creds_file, 'wb') as f:
                    encrypted_data = self.credentials.to_encrypted_dict()
                    f.write(json.dumps({
                        'api_key': encrypted_data['api_key'].hex(),
                        'secret_api_key': encrypted_data['secret_api_key'].hex()
                    }).encode())
                
                return [types.TextContent(
                    type="text",
                    text="✅ Credentials set and verified successfully. Encrypted credentials saved."
                )]
                
            except Exception as e:
                self.credentials = None
                return [types.TextContent(
                    type="text",
                    text=f"❌ Error: Credentials verification failed: {str(e)}"
                )]
                
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error setting credentials: {str(e)}"
            )]
    
    async def _clear_cache(self) -> List[types.TextContent]:
        """Clear API response cache"""
        self.cache.clear()
        return [types.TextContent(
            type="text",
            text="✅ Cache cleared successfully"
        )]
    
    async def _ping(self) -> List[types.TextContent]:
        """Test API connection"""
        try:
            result = await self._make_api_request("ping")
            return [types.TextContent(
                type="text",
                text=f"✅ Ping successful! Your IP address: {result.get('yourIp', 'Unknown')}"
            )]
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Ping failed: {str(e)}"
            )]
    
    async def _get_pricing(self) -> List[types.TextContent]:
        """Get domain pricing (no auth required)"""
        try:
            await self._ensure_session()
            url = f"{PORKBUN_API_BASE}/pricing/get"
            
            async with self.session.post(url) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                
                result = await response.json()
                if result.get('status') != 'SUCCESS':
                    raise Exception(f"API Error: {result.get('status')}")
                
                pricing_data = result.get('pricing', {})
                
                # Format pricing information
                output = ["📊 **Domain Pricing Information**\n"]
                
                for tld, prices in sorted(pricing_data.items()):
                    reg_price = prices.get('registration', 'N/A')
                    renewal_price = prices.get('renewal', 'N/A') 
                    transfer_price = prices.get('transfer', 'N/A')
                    
                    output.append(f"**{tld}**")
                    output.append(f"  - Registration: ${reg_price}")
                    output.append(f"  - Renewal: ${renewal_price}")
                    output.append(f"  - Transfer: ${transfer_price}")
                    output.append("")
                
                return [types.TextContent(
                    type="text",
                    text="\n".join(output)
                )]
                
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting pricing: {str(e)}"
            )]
    
    async def _list_domains(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """List all domains in account"""
        try:
            start = arguments.get('start', 0)
            include_labels = arguments.get('include_labels', False)
            
            data = {
                'start': str(start),
                'includeLabels': 'yes' if include_labels else 'no'
            }
            
            result = await self._make_api_request("domain/listAll", data)
            domains = result.get('domains', [])
            
            if not domains:
                return [types.TextContent(
                    type="text",
                    text="📋 No domains found in account"
                )]
            
            output = [f"📋 **Domains (starting from {start})**\n"]
            
            for domain in domains:
                domain_name = domain.get('domain', 'Unknown')
                status = domain.get('status', 'Unknown')
                expire_date = domain.get('expireDate', 'Unknown')
                auto_renew = domain.get('autoRenew', 0)
                security_lock = domain.get('securityLock', 0)
                whois_privacy = domain.get('whoisPrivacy', 0)
                
                output.append(f"**{domain_name}**")
                output.append(f"  - Status: {status}")
                output.append(f"  - Expires: {expire_date}")
                output.append(f"  - Auto-renew: {'Yes' if auto_renew else 'No'}")
                output.append(f"  - Security lock: {'Yes' if security_lock else 'No'}")
                output.append(f"  - WHOIS privacy: {'Yes' if whois_privacy else 'No'}")
                
                if include_labels and 'labels' in domain:
                    labels = domain['labels']
                    if labels:
                        label_list = [f"{label['title']} ({label['color']})" for label in labels]
                        output.append(f"  - Labels: {', '.join(label_list)}")
                
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error listing domains: {str(e)}"
            )]
    
    async def _check_domain(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Check domain availability"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"domain/checkDomain/{domain}")
            response = result.get('response', {})
            limits = result.get('limits', {})
            
            avail = response.get('avail', 'unknown')
            price = response.get('price', 'N/A')
            regular_price = response.get('regularPrice', 'N/A')
            premium = response.get('premium', 'no')
            first_year_promo = response.get('firstYearPromo', 'no')
            
            status_icon = "✅" if avail == "yes" else "❌"
            availability = "Available" if avail == "yes" else "Not Available"
            
            output = [f"{status_icon} **Domain Check: {domain}**\n"]
            output.append(f"**Status:** {availability}")
            
            if avail == "yes":
                output.append(f"**Registration Price:** ${price}")
                if regular_price != price:
                    output.append(f"**Regular Price:** ${regular_price}")
                if first_year_promo == "yes":
                    output.append("**First Year Promotion:** Yes")
                if premium == "yes":
                    output.append("**Premium Domain:** Yes")
                
                # Additional pricing info
                additional = response.get('additional', {})
                if 'renewal' in additional:
                    renewal_price = additional['renewal'].get('price', 'N/A')
                    output.append(f"**Renewal Price:** ${renewal_price}")
                if 'transfer' in additional:
                    transfer_price = additional['transfer'].get('price', 'N/A')
                    output.append(f"**Transfer Price:** ${transfer_price}")
            
            # Rate limit info
            if limits:
                rate_info = limits.get('naturalLanguage', '')
                if rate_info:
                    output.append(f"\n**Rate Limit:** {rate_info}")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error checking domain: {str(e)}"
            )]
    
    async def _update_nameservers(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Update nameservers for domain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            nameservers = arguments.get('nameservers', [])
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not nameservers or not isinstance(nameservers, list):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Nameservers must be a non-empty list"
                )]
            
            # Validate nameservers
            for ns in nameservers:
                if not self.validator.validate_domain(ns):
                    return [types.TextContent(
                        type="text",
                        text=f"❌ Error: Invalid nameserver format: {ns}"
                    )]
            
            data = {'ns': nameservers}
            await self._make_api_request(f"domain/updateNs/{domain}", data)
            
            return [types.TextContent(
                type="text",
                text=f"✅ Nameservers updated successfully for {domain}\nNew nameservers: {', '.join(nameservers)}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error updating nameservers: {str(e)}"
            )]
    
    async def _get_nameservers(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get current nameservers for domain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"domain/getNs/{domain}")
            nameservers = result.get('ns', [])
            
            if not nameservers:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No nameservers found for {domain}"
                )]
            
            ns_list = "\n".join([f"  - {ns}" for ns in nameservers])
            
            return [types.TextContent(
                type="text",
                text=f"📋 **Nameservers for {domain}:**\n{ns_list}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting nameservers: {str(e)}"
            )]
    
    async def _add_url_forward(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Add URL forwarding"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            location = self.validator.sanitize_string(arguments.get('location', ''))
            forward_type = arguments.get('type', '')
            include_path = arguments.get('include_path', False)
            wildcard = arguments.get('wildcard', False)
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not location:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Location URL is required"
                )]
            
            if forward_type not in ['temporary', 'permanent']:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Type must be 'temporary' or 'permanent'"
                )]
            
            data = {
                'subdomain': subdomain,
                'location': location,
                'type': forward_type,
                'includePath': 'yes' if include_path else 'no',
                'wildcard': 'yes' if wildcard else 'no'
            }
            
            await self._make_api_request(f"domain/addUrlForward/{domain}", data)
            
            target = f"{subdomain}.{domain}" if subdomain else domain
            
            return [types.TextContent(
                type="text",
                text=f"✅ URL forward added successfully\n"
                      f"**From:** {target}\n"
                      f"**To:** {location}\n"
                      f"**Type:** {forward_type}\n"
                      f"**Include Path:** {'Yes' if include_path else 'No'}\n"
                      f"**Wildcard:** {'Yes' if wildcard else 'No'}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error adding URL forward: {str(e)}"
            )]
    
    async def _get_url_forwards(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get URL forwards for domain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"domain/getUrlForwarding/{domain}")
            forwards = result.get('forwards', [])
            
            if not forwards:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No URL forwards found for {domain}"
                )]
            
            output = [f"📋 **URL Forwards for {domain}:**\n"]
            
            for forward in forwards:
                record_id = forward.get('id', 'Unknown')
                subdomain = forward.get('subdomain', '')
                location = forward.get('location', '')
                forward_type = forward.get('type', '')
                include_path = forward.get('includePath', 'no')
                wildcard = forward.get('wildcard', 'no')
                
                source = f"{subdomain}.{domain}" if subdomain else domain
                
                output.append(f"**ID:** {record_id}")
                output.append(f"  - From: {source}")
                output.append(f"  - To: {location}")
                output.append(f"  - Type: {forward_type}")
                output.append(f"  - Include Path: {include_path}")
                output.append(f"  - Wildcard: {wildcard}")
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting URL forwards: {str(e)}"
            )]
    
    async def _delete_url_forward(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Delete URL forward"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_id = self.validator.sanitize_string(arguments.get('record_id', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not record_id:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record ID is required"
                )]
            
            await self._make_api_request(f"domain/deleteUrlForward/{domain}/{record_id}")
            
            return [types.TextContent(
                type="text",
                text=f"✅ URL forward {record_id} deleted successfully for {domain}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error deleting URL forward: {str(e)}"
            )]
    
    # Continue with glue record methods...
    async def _create_glue_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Create glue record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            ips = arguments.get('ips', [])
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not subdomain:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Subdomain is required for glue records"
                )]
            
            if not ips or not isinstance(ips, list):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: IP addresses list is required"
                )]
            
            # Validate IP addresses
            for ip in ips:
                if not self.validator.validate_ip(ip):
                    return [types.TextContent(
                        type="text",
                        text=f"❌ Error: Invalid IP address: {ip}"
                    )]
            
            data = {'ips': ips}
            await self._make_api_request(f"domain/createGlue/{domain}/{subdomain}", data)
            
            return [types.TextContent(
                type="text",
                text=f"✅ Glue record created successfully\n"
                      f"**Host:** {subdomain}.{domain}\n"
                      f"**IPs:** {', '.join(ips)}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error creating glue record: {str(e)}"
            )]
    
    async def _update_glue_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Update glue record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            ips = arguments.get('ips', [])
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not subdomain:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Subdomain is required for glue records"
                )]
            
            if not ips or not isinstance(ips, list):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: IP addresses list is required"
                )]
            
            # Validate IP addresses
            for ip in ips:
                if not self.validator.validate_ip(ip):
                    return [types.TextContent(
                        type="text",
                        text=f"❌ Error: Invalid IP address: {ip}"
                    )]
            
            data = {'ips': ips}
            await self._make_api_request(f"domain/updateGlue/{domain}/{subdomain}", data)
            
            return [types.TextContent(
                type="text",
                text=f"✅ Glue record updated successfully\n"
                      f"**Host:** {subdomain}.{domain}\n"
                      f"**New IPs:** {', '.join(ips)}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error updating glue record: {str(e)}"
            )]
    
    async def _delete_glue_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Delete glue record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not subdomain:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Subdomain is required"
                )]
            
            await self._make_api_request(f"domain/deleteGlue/{domain}/{subdomain}")
            
            return [types.TextContent(
                type="text",
                text=f"✅ Glue record deleted successfully for {subdomain}.{domain}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error deleting glue record: {str(e)}"
            )]
    
    async def _get_glue_records(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get glue records for domain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"domain/getGlue/{domain}")
            hosts = result.get('hosts', [])
            
            if not hosts:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No glue records found for {domain}"
                )]
            
            output = [f"📋 **Glue Records for {domain}:**\n"]
            
            for host_info in hosts:
                hostname = host_info[0]
                ips = host_info[1]
                
                output.append(f"**{hostname}**")
                
                if 'v4' in ips:
                    ipv4_list = ', '.join(ips['v4'])
                    output.append(f"  - IPv4: {ipv4_list}")
                
                if 'v6' in ips:
                    ipv6_list = ', '.join(ips['v6'])
                    output.append(f"  - IPv6: {ipv6_list}")
                
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting glue records: {str(e)}"
            )]
    
    # Continue with DNS management methods...
    async def _create_dns_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Create DNS record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            name = self.validator.sanitize_string(arguments.get('name', ''))
            record_type = arguments.get('type', '').upper()
            content = self.validator.sanitize_string(arguments.get('content', ''))
            ttl = arguments.get('ttl', 600)
            prio = arguments.get('prio', 0)
            notes = self.validator.sanitize_string(arguments.get('notes', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not self.validator.validate_dns_record_type(record_type):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid DNS record type"
                )]
            
            if not content:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record content is required"
                )]
            
            if ttl < 600:
                ttl = 600
            
            data = {
                'name': name,
                'type': record_type,
                'content': content,
                'ttl': str(ttl),
                'prio': str(prio),
                'notes': notes
            }
            
            result = await self._make_api_request(f"dns/create/{domain}", data)
            record_id = result.get('id', 'Unknown')
            
            record_name = f"{name}.{domain}" if name else domain
            
            return [types.TextContent(
                type="text",
                text=f"✅ DNS record created successfully\n"
                      f"**ID:** {record_id}\n"
                      f"**Name:** {record_name}\n"
                      f"**Type:** {record_type}\n"
                      f"**Content:** {content}\n"
                      f"**TTL:** {ttl}\n"
                      f"**Priority:** {prio}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error creating DNS record: {str(e)}"
            )]
    
    async def _edit_dns_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Edit DNS record by ID"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_id = self.validator.sanitize_string(arguments.get('record_id', ''))
            name = self.validator.sanitize_string(arguments.get('name', ''))
            record_type = arguments.get('type', '').upper()
            content = self.validator.sanitize_string(arguments.get('content', ''))
            ttl = arguments.get('ttl', 600)
            prio = arguments.get('prio', 0)
            notes = self.validator.sanitize_string(arguments.get('notes', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not record_id:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record ID is required"
                )]
            
            if not self.validator.validate_dns_record_type(record_type):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid DNS record type"
                )]
            
            if not content:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record content is required"
                )]
            
            if ttl < 600:
                ttl = 600
            
            data = {
                'name': name,
                'type': record_type,
                'content': content,
                'ttl': str(ttl),
                'prio': str(prio),
                'notes': notes
            }
            
            await self._make_api_request(f"dns/edit/{domain}/{record_id}", data)
            
            record_name = f"{name}.{domain}" if name else domain
            
            return [types.TextContent(
                type="text",
                text=f"✅ DNS record {record_id} updated successfully\n"
                      f"**Name:** {record_name}\n"
                      f"**Type:** {record_type}\n"
                      f"**Content:** {content}\n"
                      f"**TTL:** {ttl}\n"
                      f"**Priority:** {prio}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error editing DNS record: {str(e)}"
            )]
    
    async def _edit_dns_records_by_type(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Edit DNS records by type and subdomain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_type = arguments.get('type', '').upper()
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            content = self.validator.sanitize_string(arguments.get('content', ''))
            ttl = arguments.get('ttl', 600)
            prio = arguments.get('prio', 0)
            notes = self.validator.sanitize_string(arguments.get('notes', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not self.validator.validate_dns_record_type(record_type):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid DNS record type"
                )]
            
            if not content:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record content is required"
                )]
            
            if ttl < 600:
                ttl = 600
            
            data = {
                'content': content,
                'ttl': str(ttl),
                'prio': str(prio),
                'notes': notes
            }
            
            # Build endpoint with optional subdomain
            endpoint = f"dns/editByNameType/{domain}/{record_type}"
            if subdomain:
                endpoint += f"/{subdomain}"
            
            await self._make_api_request(endpoint, data)
            
            target_name = f"{subdomain}.{domain}" if subdomain else domain
            
            return [types.TextContent(
                type="text",
                text=f"✅ All {record_type} records updated successfully for {target_name}\n"
                      f"**Content:** {content}\n"
                      f"**TTL:** {ttl}\n"
                      f"**Priority:** {prio}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error editing DNS records: {str(e)}"
            )]
    
    async def _delete_dns_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Delete DNS record by ID"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_id = self.validator.sanitize_string(arguments.get('record_id', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not record_id:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Record ID is required"
                )]
            
            await self._make_api_request(f"dns/delete/{domain}/{record_id}")
            
            return [types.TextContent(
                type="text",
                text=f"✅ DNS record {record_id} deleted successfully from {domain}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error deleting DNS record: {str(e)}"
            )]
    
    async def _delete_dns_records_by_type(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Delete DNS records by type and subdomain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_type = arguments.get('type', '').upper()
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not self.validator.validate_dns_record_type(record_type):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid DNS record type"
                )]
            
            # Build endpoint with optional subdomain
            endpoint = f"dns/deleteByNameType/{domain}/{record_type}"
            if subdomain:
                endpoint += f"/{subdomain}"
            
            await self._make_api_request(endpoint)
            
            target_name = f"{subdomain}.{domain}" if subdomain else domain
            
            return [types.TextContent(
                type="text",
                text=f"✅ All {record_type} records deleted successfully for {target_name}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error deleting DNS records: {str(e)}"
            )]
    
    async def _get_dns_records(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get DNS records for domain or specific record by ID"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_id = self.validator.sanitize_string(arguments.get('record_id', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            # Build endpoint
            endpoint = f"dns/retrieve/{domain}"
            if record_id:
                endpoint += f"/{record_id}"
            
            result = await self._make_api_request(endpoint)
            records = result.get('records', [])
            
            if not records:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No DNS records found for {domain}"
                )]
            
            output = [f"📋 **DNS Records for {domain}:**\n"]
            
            for record in records:
                record_id = record.get('id', 'Unknown')
                name = record.get('name', '')
                record_type = record.get('type', '')
                content = record.get('content', '')
                ttl = record.get('ttl', '')
                prio = record.get('prio', '0')
                notes = record.get('notes', '')
                
                output.append(f"**ID:** {record_id}")
                output.append(f"  - Name: {name}")
                output.append(f"  - Type: {record_type}")
                output.append(f"  - Content: {content}")
                output.append(f"  - TTL: {ttl}")
                if prio != '0':
                    output.append(f"  - Priority: {prio}")
                if notes:
                    output.append(f"  - Notes: {notes}")
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting DNS records: {str(e)}"
            )]
    
    async def _get_dns_records_by_type(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get DNS records by type and subdomain"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            record_type = arguments.get('type', '').upper()
            subdomain = self.validator.sanitize_string(arguments.get('subdomain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not self.validator.validate_dns_record_type(record_type):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid DNS record type"
                )]
            
            # Build endpoint with optional subdomain
            endpoint = f"dns/retrieveByNameType/{domain}/{record_type}"
            if subdomain:
                endpoint += f"/{subdomain}"
            
            result = await self._make_api_request(endpoint)
            records = result.get('records', [])
            
            target_name = f"{subdomain}.{domain}" if subdomain else domain
            
            if not records:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No {record_type} records found for {target_name}"
                )]
            
            output = [f"📋 **{record_type} Records for {target_name}:**\n"]
            
            for record in records:
                record_id = record.get('id', 'Unknown')
                name = record.get('name', '')
                content = record.get('content', '')
                ttl = record.get('ttl', '')
                prio = record.get('prio', '0')
                notes = record.get('notes', '')
                
                output.append(f"**ID:** {record_id}")
                output.append(f"  - Name: {name}")
                output.append(f"  - Content: {content}")
                output.append(f"  - TTL: {ttl}")
                if prio != '0':
                    output.append(f"  - Priority: {prio}")
                if notes:
                    output.append(f"  - Notes: {notes}")
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting DNS records: {str(e)}"
            )]
    
    # DNSSEC methods
    async def _create_dnssec_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Create DNSSEC record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            key_tag = self.validator.sanitize_string(arguments.get('key_tag', ''))
            algorithm = self.validator.sanitize_string(arguments.get('algorithm', ''))
            digest_type = self.validator.sanitize_string(arguments.get('digest_type', ''))
            digest = self.validator.sanitize_string(arguments.get('digest', ''))
            max_sig_life = self.validator.sanitize_string(arguments.get('max_sig_life', ''))
            key_data_flags = self.validator.sanitize_string(arguments.get('key_data_flags', ''))
            key_data_protocol = self.validator.sanitize_string(arguments.get('key_data_protocol', ''))
            key_data_algo = self.validator.sanitize_string(arguments.get('key_data_algo', ''))
            key_data_pub_key = self.validator.sanitize_string(arguments.get('key_data_pub_key', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not all([key_tag, algorithm, digest_type, digest]):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: key_tag, algorithm, digest_type, and digest are required"
                )]
            
            data = {
                'keyTag': key_tag,
                'alg': algorithm,
                'digestType': digest_type,
                'digest': digest,
                'maxSigLife': max_sig_life,
                'keyDataFlags': key_data_flags,
                'keyDataProtocol': key_data_protocol,
                'keyDataAlgo': key_data_algo,
                'keyDataPubKey': key_data_pub_key
            }
            
            await self._make_api_request(f"dns/createDnssecRecord/{domain}", data)
            
            return [types.TextContent(
                type="text",
                text=f"✅ DNSSEC record created successfully for {domain}\n"
                      f"**Key Tag:** {key_tag}\n"
                      f"**Algorithm:** {algorithm}\n"
                      f"**Digest Type:** {digest_type}\n"
                      f"**Digest:** {digest}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error creating DNSSEC record: {str(e)}"
            )]
    
    async def _get_dnssec_records(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get DNSSEC records"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"dns/getDnssecRecords/{domain}")
            records = result.get('records', {})
            
            if not records:
                return [types.TextContent(
                    type="text",
                    text=f"📋 No DNSSEC records found for {domain}"
                )]
            
            output = [f"📋 **DNSSEC Records for {domain}:**\n"]
            
            for key_tag, record_data in records.items():
                output.append(f"**Key Tag:** {key_tag}")
                output.append(f"  - Algorithm: {record_data.get('alg', 'Unknown')}")
                output.append(f"  - Digest Type: {record_data.get('digestType', 'Unknown')}")
                output.append(f"  - Digest: {record_data.get('digest', 'Unknown')}")
                output.append("")
            
            return [types.TextContent(
                type="text",
                text="\n".join(output)
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting DNSSEC records: {str(e)}"
            )]
    
    async def _delete_dnssec_record(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Delete DNSSEC record"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            key_tag = self.validator.sanitize_string(arguments.get('key_tag', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            if not key_tag:
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Key tag is required"
                )]
            
            await self._make_api_request(f"dns/deleteDnssecRecord/{domain}/{key_tag}")
            
            return [types.TextContent(
                type="text",
                text=f"✅ DNSSEC record with key tag {key_tag} deleted successfully from {domain}"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error deleting DNSSEC record: {str(e)}"
            )]
    
    # SSL method
    async def _get_ssl_bundle(self, arguments: Dict[str, Any]) -> List[types.TextContent]:
        """Get SSL certificate bundle"""
        try:
            domain = self.validator.sanitize_string(arguments.get('domain', ''))
            
            if not self.validator.validate_domain(domain):
                return [types.TextContent(
                    type="text",
                    text="❌ Error: Invalid domain name format"
                )]
            
            result = await self._make_api_request(f"ssl/retrieve/{domain}")
            
            certificate_chain = result.get('certificatechain', '')
            private_key = result.get('privatekey', '')
            public_key = result.get('publickey', '')
            
            if not certificate_chain:
                return [types.TextContent(
                    type="text",
                    text=f"❌ No SSL certificate found for {domain}"
                )]
            
            # Save certificates to files
            ssl_dir = Path(f'/workspace/ssl_certificates/{domain}')
            ssl_dir.mkdir(parents=True, exist_ok=True)
            
            # Save certificate chain
            with open(ssl_dir / 'certificate_chain.pem', 'w') as f:
                f.write(certificate_chain)
            
            # Save private key
            with open(ssl_dir / 'private_key.pem', 'w') as f:
                f.write(private_key)
            
            # Save public key
            with open(ssl_dir / 'public_key.pem', 'w') as f:
                f.write(public_key)
            
            return [types.TextContent(
                type="text",
                text=f"✅ SSL certificate bundle retrieved successfully for {domain}\n\n"
                      f"**Files saved to:** /workspace/ssl_certificates/{domain}/\n"
                      f"  - certificate_chain.pem\n"
                      f"  - private_key.pem\n"
                      f"  - public_key.pem\n\n"
                      f"**Certificate Chain (first 200 chars):**\n"
                      f"```\n{certificate_chain[:200]}...\n```"
            )]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"❌ Error getting SSL bundle: {str(e)}"
            )]
    
    # Resource content methods
    def _get_api_overview_resource(self) -> str:
        """Get API overview resource content"""
        return """# Porkbun API Overview

## Authentication
All API endpoints require authentication using:
- `apikey`: Your Porkbun API key
- `secretapikey`: Your Porkbun secret API key

## Base URLs
- **Primary**: https://api.porkbun.com/api/json/v3
- **IPv4 Only**: https://api-ipv4.porkbun.com/api/json/v3

## Rate Limits
- **Default**: 10 requests per 10-second window
- **Domain Check**: 1 request per 10-second window

## Response Format
All responses return JSON with:
- `status`: "SUCCESS" or error message
- Additional data fields depending on endpoint

## Error Handling
- HTTP 200: Check `status` field for success/error
- Non-200: HTTP error occurred
- HTTP 403: Additional authentication required (2FA)

## Supported Operations
1. **General**: Ping, pricing information
2. **Domains**: List, check availability, nameservers
3. **URL Forwarding**: Create, read, delete forwards
4. **Glue Records**: Full CRUD operations
5. **DNS**: Complete DNS record management
6. **DNSSEC**: Registry-level DNSSEC management
7. **SSL**: Certificate bundle retrieval

## Best Practices
- Always validate input parameters
- Implement proper error handling
- Use caching for frequently accessed data
- Monitor rate limits
- Secure credential storage
"""

    def _get_domain_management_resource(self) -> str:
        """Get domain management resource content"""
        return """# Domain Management Best Practices

## Domain Lifecycle
1. **Registration**: Check availability, register domain
2. **Configuration**: Set nameservers, configure DNS
3. **Maintenance**: Monitor expiry, renew domains
4. **Migration**: Transfer between registrars safely

## Nameserver Management
### When to Update Nameservers
- Switching DNS providers
- Moving to CDN services
- Setting up custom DNS

### Best Practices
- Always have at least 2 nameservers
- Use geographically distributed nameservers
- Test DNS resolution before switching
- Keep TTL low during transitions (300s)

## URL Forwarding
### Types
- **Temporary (302)**: For testing or temporary redirects
- **Permanent (301)**: For SEO-friendly permanent moves

### Configuration Options
- **Include Path**: Forward full URL path
- **Wildcard**: Forward all subdomains

## Glue Records
### When Needed
- Using domain's own subdomains as nameservers
- Example: ns1.example.com, ns2.example.com

### Requirements
- Must be subdomains of the domain
- Require both IPv4 and optionally IPv6 addresses
- Essential for DNS delegation

## Security Considerations
- Enable domain lock when not making changes
- Use WHOIS privacy protection
- Monitor for unauthorized changes
- Implement DNSSEC for critical domains
- Regular security audits

## Monitoring
- Track expiry dates
- Monitor DNS propagation
- Check SSL certificate validity
- Verify nameserver responses
"""

    def _get_dns_records_resource(self) -> str:
        """Get DNS records resource content"""
        return """# DNS Records Reference

## Common Record Types

### A Record
- **Purpose**: Maps domain to IPv4 address
- **Format**: domain.com → 192.168.1.1
- **TTL**: 300-3600 seconds (5 minutes to 1 hour)
- **Use Cases**: Website hosting, services

### AAAA Record
- **Purpose**: Maps domain to IPv6 address
- **Format**: domain.com → 2001:db8::1
- **TTL**: 300-3600 seconds
- **Use Cases**: IPv6 services

### CNAME Record
- **Purpose**: Aliases one domain to another
- **Format**: www.domain.com → domain.com
- **Restrictions**: Cannot coexist with other records on same name
- **Use Cases**: www redirects, service aliases

### MX Record
- **Purpose**: Mail server routing
- **Format**: domain.com → mail.domain.com (priority 10)
- **Priority**: Lower numbers = higher priority
- **Use Cases**: Email delivery

### TXT Record
- **Purpose**: Text information, verification
- **Format**: Arbitrary text strings
- **Use Cases**: SPF, DKIM, domain verification
- **Examples**:
  - SPF: "v=spf1 include:_spf.google.com ~all"
  - DKIM: "v=DKIM1; k=rsa; p=..."

### NS Record
- **Purpose**: Delegates subdomain to nameservers
- **Format**: subdomain.domain.com → ns1.provider.com
- **Use Cases**: Subdomain delegation

### SRV Record
- **Purpose**: Service location
- **Format**: _service._protocol.domain.com
- **Fields**: Priority, weight, port, target
- **Use Cases**: SIP, XMPP, other services

### CAA Record
- **Purpose**: Certificate Authority Authorization
- **Format**: domain.com CAA 0 issue "letsencrypt.org"
- **Use Cases**: SSL certificate security

## Validation Rules
- **Domain Names**: RFC 1035 compliant
- **TTL**: Minimum 600 seconds (10 minutes)
- **IPv4**: Valid IP address format
- **IPv6**: Valid IPv6 address format
- **Priority**: 0-65535 for MX/SRV records

## Best Practices
- Use appropriate TTL values
- Test changes in staging first
- Monitor DNS propagation
- Keep records organized and documented
- Use descriptive notes for complex setups
"""

    def _get_security_practices_resource(self) -> str:
        """Get security practices resource content"""
        return """# Security Best Practices

## API Credential Security
### Storage
- **Never** hardcode credentials in source code
- Use environment variables or secure vaults
- Encrypt credentials at rest using Fernet or similar
- Rotate credentials regularly

### Access Control
- Limit API key permissions when possible
- Use separate keys for different environments
- Monitor API usage and access logs
- Implement IP restrictions if available

## Input Validation
### Domain Names
- Validate against RFC standards
- Check for malicious patterns
- Limit length (253 characters max)
- Sanitize special characters

### IP Addresses
- Validate IPv4/IPv6 format
- Check for private/reserved ranges when appropriate
- Prevent injection attacks

### DNS Records
- Validate record type against allowed list
- Check content format for each record type
- Limit record content length
- Sanitize user input

## Rate Limiting
### Implementation
- Track requests per time window
- Use sliding window algorithm
- Implement exponential backoff
- Return meaningful error messages

### Monitoring
- Log rate limit violations
- Alert on suspicious patterns
- Track usage trends

## Error Handling
### Security Considerations
- Don't expose internal system details
- Use generic error messages for security failures
- Log detailed errors internally only
- Implement proper exception handling

## Network Security
### HTTPS/TLS
- Always use HTTPS for API calls
- Validate SSL certificates
- Use modern TLS versions (1.2+)
- Implement certificate pinning if possible

### DNS Security
- Implement DNSSEC where supported
- Monitor for DNS hijacking
- Use secure DNS resolvers
- Validate DNS responses

## Operational Security
### Monitoring
- Log all API operations
- Monitor for unusual patterns
- Set up alerting for critical operations
- Regular security audits

### Backup and Recovery
- Regular data backups
- Test recovery procedures
- Document incident response
- Maintain offline backups

## Compliance
- Follow data protection regulations
- Implement audit trails
- Document security procedures
- Regular compliance reviews
"""

    def _get_troubleshooting_resource(self) -> str:
        """Get troubleshooting resource content"""
        return """# Troubleshooting Guide

## Common API Errors

### Authentication Errors
- **Error**: "Invalid API key"
- **Cause**: Incorrect or expired API credentials
- **Solution**: Verify credentials, regenerate if needed

- **Error**: HTTP 403 with additional auth required
- **Cause**: Two-factor authentication needed
- **Solution**: Complete 2FA challenge, retry request

### Rate Limiting
- **Error**: "Rate limit exceeded"
- **Cause**: Too many requests in time window
- **Solution**: Implement backoff, reduce request frequency

### Domain Validation
- **Error**: "Invalid domain format"
- **Cause**: Malformed domain name
- **Solution**: Validate domain against RFC standards

## DNS Issues

### Propagation Problems
- **Symptoms**: DNS changes not visible globally
- **Causes**: High TTL values, caching
- **Solutions**:
  - Wait for TTL expiry
  - Check with multiple DNS servers
  - Use DNS propagation checkers

### Record Conflicts
- **Error**: "Record already exists"
- **Cause**: Duplicate records or CNAME conflicts
- **Solution**: Remove conflicting records first

### DNSSEC Issues
- **Symptoms**: Domain not resolving with DNSSEC enabled
- **Causes**: Invalid signatures, missing DS records
- **Solutions**:
  - Validate DNSSEC chain
  - Check DS records at parent
  - Use DNSSEC validators

## SSL Certificate Issues

### Certificate Not Found
- **Error**: "No SSL certificate found"
- **Cause**: Certificate not provisioned or expired
- **Solution**: Request new certificate, check provisioning status

### Invalid Certificate Chain
- **Symptoms**: Browser warnings, validation errors
- **Cause**: Incomplete certificate chain
- **Solution**: Include full certificate chain

## Performance Issues

### Slow API Responses
- **Causes**: High load, network issues
- **Solutions**:
  - Implement request caching
  - Use appropriate timeouts
  - Retry with exponential backoff

### DNS Resolution Delays
- **Causes**: High TTL, distant nameservers
- **Solutions**:
  - Optimize TTL values
  - Use geographically closer nameservers
  - Implement local DNS caching

## Debugging Tools

### API Testing
- Use curl or Postman for direct API testing
- Check response headers and status codes
- Validate JSON response format

### DNS Tools
- `dig` for DNS queries
- `nslookup` for basic lookups
- Online DNS propagation checkers
- DNSSEC validators

### Network Tools
- `ping` for connectivity
- `traceroute` for path analysis
- `netstat` for connection status

## Logging and Monitoring
- Enable detailed logging
- Monitor error rates and patterns
- Set up alerting for critical failures
- Use structured logging formats
"""

    def _get_dns_examples_resource(self) -> str:
        """Get DNS configuration examples"""
        return json.dumps({
            "basic_website": {
                "description": "Basic website setup with www redirect",
                "records": [
                    {"name": "", "type": "A", "content": "192.168.1.1", "ttl": 3600},
                    {"name": "www", "type": "CNAME", "content": "example.com", "ttl": 3600}
                ]
            },
            "email_service": {
                "description": "Email service with multiple MX records",
                "records": [
                    {"name": "", "type": "MX", "content": "mail1.example.com", "ttl": 3600, "priority": 10},
                    {"name": "", "type": "MX", "content": "mail2.example.com", "ttl": 3600, "priority": 20},
                    {"name": "mail1", "type": "A", "content": "192.168.1.10", "ttl": 3600},
                    {"name": "mail2", "type": "A", "content": "192.168.1.11", "ttl": 3600}
                ]
            },
            "cdn_setup": {
                "description": "CDN setup with CNAME to CDN provider",
                "records": [
                    {"name": "", "type": "A", "content": "192.168.1.1", "ttl": 3600},
                    {"name": "cdn", "type": "CNAME", "content": "example.cloudfront.net", "ttl": 3600},
                    {"name": "static", "type": "CNAME", "content": "cdn.example.com", "ttl": 3600}
                ]
            },
            "subdomain_delegation": {
                "description": "Delegate subdomain to different nameservers",
                "records": [
                    {"name": "api", "type": "NS", "content": "ns1.api-provider.com", "ttl": 3600},
                    {"name": "api", "type": "NS", "content": "ns2.api-provider.com", "ttl": 3600}
                ]
            },
            "txt_records": {
                "description": "Common TXT record configurations",
                "records": [
                    {"name": "", "type": "TXT", "content": "v=spf1 include:_spf.google.com ~all", "ttl": 3600},
                    {"name": "_dmarc", "type": "TXT", "content": "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com", "ttl": 3600},
                    {"name": "google-site-verification", "type": "TXT", "content": "verification-string-here", "ttl": 3600}
                ]
            },
            "srv_records": {
                "description": "SRV records for services",
                "records": [
                    {"name": "_sip._tcp", "type": "SRV", "content": "10 5 5060 sip.example.com", "ttl": 3600},
                    {"name": "_xmpp-server._tcp", "type": "SRV", "content": "10 5 5269 xmpp.example.com", "ttl": 3600}
                ]
            }
        }, indent=2)

    def _get_validation_rules_resource(self) -> str:
        """Get validation rules resource"""
        return json.dumps({
            "domain_validation": {
                "max_length": 253,
                "pattern": "^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$",
                "description": "RFC 1035 compliant domain names"
            },
            "ipv4_validation": {
                "pattern": "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$",
                "description": "Valid IPv4 address format"
            },
            "ipv6_validation": {
                "pattern": "^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
                "description": "Valid IPv6 address format (simplified)"
            },
            "dns_record_types": {
                "supported": ["A", "MX", "CNAME", "ALIAS", "TXT", "NS", "AAAA", "SRV", "TLSA", "CAA", "HTTPS", "SVCB"],
                "description": "Supported DNS record types"
            },
            "ttl_validation": {
                "minimum": 600,
                "maximum": 86400,
                "default": 3600,
                "description": "TTL in seconds (10 minutes to 24 hours)"
            },
            "priority_validation": {
                "minimum": 0,
                "maximum": 65535,
                "description": "Priority for MX and SRV records"
            },
            "string_limits": {
                "domain_label": 63,
                "txt_record": 255,
                "general_string": 255,
                "description": "Maximum string lengths for various fields"
            }
        }, indent=2)

    # Prompt template methods
    def _get_setup_domain_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get setup domain prompt"""
        domain = args.get("domain", "example.com")
        website_ip = args.get("website_ip", "")
        mail_server = args.get("mail_server", "")
        include_www = args.get("include_www", "true").lower() == "true"

        content = f"""# Domain Setup Guide for {domain}

## Step 1: Verify Domain Availability
Use `porkbun_check_domain` to verify the domain is available or already owned.

## Step 2: Configure Basic DNS Records"""

        if website_ip:
            content += f"""

### Website Records
- A record: {domain} → {website_ip}"""
            if include_www:
                content += f"""
- CNAME record: www.{domain} → {domain}"""

        if mail_server:
            content += f"""

### Email Records
- MX record: {domain} → {mail_server} (priority 10)"""

        content += f"""

## Step 3: Additional Recommended Records
- TXT record for SPF: "v=spf1 include:_spf.google.com ~all"
- CAA record for SSL security: "0 issue letsencrypt.org"

## Step 4: Verification
1. Use `porkbun_get_dns_records` to verify configuration
2. Test DNS propagation
3. Verify website and email functionality

## Tools to Use:
1. `porkbun_create_dns_record` - Create each DNS record
2. `porkbun_get_dns_records` - Verify configuration
3. `porkbun_update_nameservers` - If using custom nameservers
"""

        return types.GetPromptResult(
            description=f"Complete domain setup guide for {domain}",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_migrate_domain_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get migrate domain prompt"""
        domain = args.get("domain", "example.com")
        current_registrar = args.get("current_registrar", "unknown registrar")
        has_email = args.get("has_email", "false").lower() == "true"

        content = f"""# Domain Migration Guide for {domain}

## Pre-Migration Checklist
1. **Backup Current Configuration**
   - Export DNS records from {current_registrar}
   - Document current nameservers
   - Note any special configurations

2. **Verify Prerequisites**
   - Domain is unlocked at current registrar
   - Have authorization code (EPP code)
   - Ensure domain is not within 60 days of registration

## Migration Steps

### Step 1: Prepare Porkbun Account
- Ensure Porkbun account is ready
- Add domain to cart but don't complete transfer yet

### Step 2: Recreate DNS Configuration
Use these tools to recreate your DNS setup:
- `porkbun_create_dns_record` for each DNS record
- `porkbun_get_dns_records` to verify configuration

### Step 3: Lower TTL Values
- Set TTL to 300 seconds (5 minutes) for faster propagation
- Wait for old TTL to expire before proceeding

### Step 4: Initiate Transfer
- Complete domain transfer at Porkbun
- Approve transfer at current registrar if required

### Step 5: Post-Transfer Verification
- Verify DNS records are active
- Test website functionality"""

        if has_email:
            content += """
- **CRITICAL**: Test email functionality immediately
- Verify MX records are working
- Check SPF/DKIM/DMARC records"""

        content += f"""

## Timeline Expectations
- Transfer completion: 5-7 days
- DNS propagation: 24-48 hours
- Full functionality: 48-72 hours

## Tools to Use:
1. `porkbun_list_domains` - Monitor transfer status
2. `porkbun_create_dns_record` - Recreate DNS records
3. `porkbun_get_dns_records` - Verify configuration
4. `porkbun_update_nameservers` - Update nameservers if needed

## Rollback Plan
If issues occur:
1. Ensure old DNS records are still available
2. Point domain back to old nameservers temporarily
3. Investigate and fix issues before retrying
"""

        return types.GetPromptResult(
            description=f"Domain migration guide from {current_registrar} to Porkbun",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_configure_dns_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get configure DNS prompt"""
        domain = args.get("domain", "example.com")
        service_type = args.get("service_type", "website")
        target = args.get("target", "192.168.1.1")

        configurations = {
            "website": {
                "records": [
                    {"type": "A", "name": "", "content": target},
                    {"type": "CNAME", "name": "www", "content": domain}
                ],
                "description": "Basic website hosting"
            },
            "email": {
                "records": [
                    {"type": "MX", "name": "", "content": target, "priority": 10},
                    {"type": "TXT", "name": "", "content": "v=spf1 mx ~all"}
                ],
                "description": "Email service configuration"
            },
            "cdn": {
                "records": [
                    {"type": "CNAME", "name": "cdn", "content": target},
                    {"type": "CNAME", "name": "static", "content": f"cdn.{domain}"}
                ],
                "description": "CDN service configuration"
            },
            "api": {
                "records": [
                    {"type": "A", "name": "api", "content": target},
                    {"type": "CNAME", "name": "api-staging", "content": f"api.{domain}"}
                ],
                "description": "API service configuration"
            }
        }

        config = configurations.get(service_type, configurations["website"])
        
        content = f"""# DNS Configuration for {service_type.title()} Service

## Domain: {domain}
## Service: {config['description']}
## Target: {target}

## Required DNS Records:"""

        for i, record in enumerate(config['records'], 1):
            record_name = record['name'] if record['name'] else '@'
            priority_str = f" (priority {record['priority']})" if 'priority' in record else ""
            content += f"""

### Record {i}: {record['type']} Record
- **Name**: {record_name}
- **Type**: {record['type']}
- **Content**: {record['content']}{priority_str}
- **TTL**: 3600 (1 hour)

**Command**: `porkbun_create_dns_record`
```json
{{
  "domain": "{domain}",
  "name": "{record['name']}",
  "type": "{record['type']}",
  "content": "{record['content']}",
  "ttl": 3600{f', "prio": {record["priority"]}' if 'priority' in record else ''}
}}
```"""

        content += f"""

## Verification Steps
1. Create each DNS record using the commands above
2. Verify records with: `porkbun_get_dns_records`
3. Test DNS propagation (may take up to 48 hours)
4. Verify service functionality

## Additional Considerations
- Consider adding CAA records for SSL security
- Add monitoring for DNS record changes
- Document configuration for future reference

## Troubleshooting
If records don't propagate:
1. Check TTL values (lower for faster propagation)
2. Verify record format and content
3. Use DNS lookup tools to test
4. Wait for full propagation period
"""

        return types.GetPromptResult(
            description=f"DNS configuration for {service_type} service on {domain}",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_troubleshoot_dns_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get troubleshoot DNS prompt"""
        domain = args.get("domain", "example.com")
        issue = args.get("issue_description", "DNS not resolving")
        record_type = args.get("record_type", "")

        content = f"""# DNS Troubleshooting for {domain}

## Issue Description
{issue}

## Diagnostic Steps

### Step 1: Verify Current Configuration
```bash
# Check current DNS records
porkbun_get_dns_records(domain="{domain}")
```"""

        if record_type:
            content += f"""

### Step 2: Check Specific Record Type
```bash
# Check {record_type} records specifically
porkbun_get_dns_records_by_type(domain="{domain}", type="{record_type}")
```"""

        content += f"""

### Step 3: External DNS Verification
Use external tools to verify DNS propagation:
- `dig {domain}` (command line)
- `nslookup {domain}` (command line)
- Online DNS checkers (whatsmydns.net, dnschecker.org)

### Step 4: Check Nameservers
```bash
# Verify nameserver configuration
porkbun_get_nameservers(domain="{domain}")
```

### Step 5: Common Issue Checks

#### Issue: Records Not Propagating
**Possible Causes:**
- High TTL values causing caching
- Recent changes still propagating
- Nameserver configuration issues

**Solutions:**
1. Wait for TTL expiry (check original TTL)
2. Test with different DNS servers
3. Verify nameserver delegation

#### Issue: Wrong Record Values
**Possible Causes:**
- Typos in record content
- Incorrect record type
- Conflicting records

**Solutions:**
1. Delete and recreate problematic records
2. Check for conflicting CNAME records
3. Verify record format

#### Issue: Intermittent Resolution
**Possible Causes:**
- Multiple records with different values
- DNS server caching issues
- Load balancing configuration

**Solutions:**
1. Standardize all record values
2. Check for duplicate records
3. Use consistent TTL values

### Step 6: Testing Commands
```bash
# Test from different locations
dig @8.8.8.8 {domain}
dig @1.1.1.1 {domain}
dig @208.67.222.222 {domain}

# Check propagation status
dig +trace {domain}
```

### Step 7: Fix Implementation
Based on findings, use appropriate tools:
- `porkbun_edit_dns_record` - Fix incorrect records
- `porkbun_delete_dns_record` - Remove problematic records
- `porkbun_create_dns_record` - Add missing records

## Prevention
- Document all DNS changes
- Test changes in staging first
- Monitor DNS health regularly
- Use appropriate TTL values (300-3600 seconds)
"""

        return types.GetPromptResult(
            description=f"DNS troubleshooting guide for {domain}",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_security_audit_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get security audit prompt"""
        domain = args.get("domain", "example.com")
        check_dnssec = args.get("check_dnssec", "true").lower() == "true"
        check_ssl = args.get("check_ssl", "true").lower() == "true"

        content = f"""# Security Audit for {domain}

## Domain Security Assessment

### Step 1: Basic Domain Configuration
```bash
# Check domain status and settings
porkbun_list_domains(include_labels=true)
```

**Verify:**
- Domain lock status (should be enabled when not making changes)
- WHOIS privacy protection (recommended for personal domains)
- Auto-renewal status (recommended)

### Step 2: DNS Security Analysis
```bash
# Get all DNS records
porkbun_get_dns_records(domain="{domain}")
```

**Check for:**
- Unnecessary or suspicious records
- Public IP exposure in internal services
- Missing security records (SPF, DMARC, CAA)
- Overly permissive configurations"""

        if check_dnssec:
            content += f"""

### Step 3: DNSSEC Configuration
```bash
# Check DNSSEC records
porkbun_get_dnssec_records(domain="{domain}")
```

**DNSSEC Benefits:**
- Prevents DNS spoofing attacks
- Ensures DNS response authenticity
- Required for high-security environments

**Implementation:**
- If not configured, consider enabling DNSSEC
- Verify DS records are published at parent zone
- Test DNSSEC validation"""

        if check_ssl:
            content += f"""

### Step 4: SSL Certificate Analysis
```bash
# Retrieve SSL certificate information
porkbun_get_ssl_bundle(domain="{domain}")
```

**Check:**
- Certificate validity period
- Certificate chain completeness
- Subject Alternative Names (SANs)
- Certificate transparency logging"""

        content += f"""

### Step 5: Security Record Recommendations

#### SPF Record (Email Security)
Prevents email spoofing:
```bash
porkbun_create_dns_record(
    domain="{domain}",
    type="TXT",
    content="v=spf1 include:_spf.google.com ~all"
)
```

#### DMARC Record (Email Policy)
Defines email authentication policy:
```bash
porkbun_create_dns_record(
    domain="{domain}",
    name="_dmarc",
    type="TXT",
    content="v=DMARC1; p=quarantine; rua=mailto:dmarc@{domain}"
)
```

#### CAA Record (Certificate Security)
Controls SSL certificate issuance:
```bash
porkbun_create_dns_record(
    domain="{domain}",
    type="CAA",
    content="0 issue letsencrypt.org"
)
```

### Step 6: Security Monitoring Setup

#### Regular Checks
- Monitor DNS changes
- Track certificate expiry
- Review access logs
- Audit nameserver responses

#### Alerting
- Set up monitoring for DNS changes
- Certificate expiry notifications
- Unusual traffic patterns
- Failed authentication attempts

### Step 7: Security Recommendations

#### High Priority
1. Enable domain lock when not making changes
2. Use strong, unique passwords for registrar account
3. Enable two-factor authentication
4. Implement DNSSEC if handling sensitive data

#### Medium Priority
1. Add SPF/DMARC records for email security
2. Implement CAA records for SSL control
3. Regular security audits (quarterly)
4. Monitor DNS for unauthorized changes

#### Best Practices
1. Document all DNS configurations
2. Use principle of least privilege
3. Regular credential rotation
4. Backup critical configurations

## Security Score
Based on audit findings, rate domain security:
- ✅ All security measures implemented
- ⚠️ Some measures missing but low risk
- ❌ Critical security issues found

## Next Steps
1. Address any critical findings immediately
2. Implement recommended security measures
3. Set up ongoing monitoring
4. Schedule regular security reviews
"""

        return types.GetPromptResult(
            description=f"Comprehensive security audit for {domain}",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_bulk_operation_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get bulk operation prompt"""
        domains = args.get("domains", "example1.com,example2.com,example3.com")
        operation = args.get("operation", "check")
        parameters = args.get("parameters", "{}")

        domain_list = [d.strip() for d in domains.split(",")]
        
        content = f"""# Bulk Domain Operation: {operation.title()}

## Target Domains ({len(domain_list)} domains)
{chr(10).join([f"- {domain}" for domain in domain_list])}

## Operation: {operation}
## Parameters: {parameters}

## Execution Plan

### Safety Measures
1. **Test on single domain first**
2. **Backup current configurations**
3. **Monitor for errors during execution**
4. **Have rollback plan ready**

### Batch Processing Strategy"""

        if operation == "check":
            content += f"""

#### Domain Availability Check
```python
# Check availability for all domains
for domain in {domain_list}:
    result = porkbun_check_domain(domain=domain)
    print(f"{{domain}}: {{result.status}}")
```

**Expected Output:**
- Available domains for registration
- Pricing information for each TLD
- Rate limit considerations"""

        elif operation == "update_ns":
            content += f"""

#### Nameserver Update
```python
# Update nameservers for all domains
nameservers = {parameters if parameters != '{}' else '["ns1.example.com", "ns2.example.com"]'}

for domain in {domain_list}:
    try:
        result = porkbun_update_nameservers(
            domain=domain,
            nameservers=nameservers
        )
        print(f"{{domain}}: SUCCESS")
    except Exception as e:
        print(f"{{domain}}: ERROR - {{e}}")
```

**Considerations:**
- Ensure nameservers are valid and responsive
- Changes may take 24-48 hours to propagate
- Test with one domain first"""

        elif operation == "dns_audit":
            content += f"""

#### DNS Configuration Audit
```python
# Audit DNS configuration for all domains
for domain in {domain_list}:
    try:
        records = porkbun_get_dns_records(domain=domain)
        
        # Analyze records
        record_types = {{}}
        for record in records:
            record_type = record.get('type')
            record_types[record_type] = record_types.get(record_type, 0) + 1
        
        print(f"{{domain}}: {{record_types}}")
        
        # Check for security records
        has_spf = any('v=spf1' in r.get('content', '') for r in records if r.get('type') == 'TXT')
        has_caa = any(r.get('type') == 'CAA' for r in records)
        
        security_score = []
        if has_spf: security_score.append("SPF")
        if has_caa: security_score.append("CAA")
        
        print(f"{{domain}} security: {{security_score or 'None'}}")
        
    except Exception as e:
        print(f"{{domain}}: ERROR - {{e}}")
```"""

        else:
            content += f"""

#### Custom Operation: {operation}
```python
# Custom bulk operation
for domain in {domain_list}:
    try:
        # Implement your custom operation here
        # Use parameters: {parameters}
        
        result = perform_operation(domain, {parameters})
        print(f"{{domain}}: SUCCESS")
        
    except Exception as e:
        print(f"{{domain}}: ERROR - {{e}}")
```"""

        content += f"""

### Error Handling Strategy
1. **Continue on errors** (don't stop entire batch)
2. **Log all errors** for later investigation
3. **Retry failed operations** after fixing issues
4. **Report summary** at completion

### Rate Limiting Considerations
- Porkbun API: 10 requests per 10 seconds
- Domain check: 1 request per 10 seconds
- Add delays between operations if needed

### Monitoring and Logging
```python
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

success_count = 0
error_count = 0
errors = []

for i, domain in enumerate({domain_list}):
    try:
        # Perform operation
        logger.info(f"Processing domain {{i+1}}/{{len({domain_list})}}: {{domain}}")
        
        # Add rate limiting delay
        if i > 0:
            time.sleep(1)  # 1 second between requests
        
        # Your operation here
        result = perform_operation(domain)
        success_count += 1
        logger.info(f"{{domain}}: SUCCESS")
        
    except Exception as e:
        error_count += 1
        errors.append({{"domain": domain, "error": str(e)}})
        logger.error(f"{{domain}}: ERROR - {{e}}")

# Summary report
print(f"\\nBatch Operation Complete:")
print(f"Successful: {{success_count}}")
print(f"Errors: {{error_count}}")

if errors:
    print(f"\\nFailed domains:")
    for error in errors:
        print(f"- {{error['domain']}}: {{error['error']}}")
```

### Post-Operation Verification
1. **Verify changes** on sample domains
2. **Check DNS propagation** where applicable
3. **Monitor for issues** in following days
4. **Document results** for future reference

## Tools Used
{chr(10).join([f"- porkbun_{operation}" if operation in ['check', 'update_ns'] else f"- porkbun_get_dns_records", "- porkbun_list_domains"])}

## Timeline
- Preparation: 30 minutes
- Execution: {len(domain_list)} * 2 minutes (with rate limiting)
- Verification: 1 hour
- Total: ~{1 + (len(domain_list) * 2 // 60)} hours
"""

        return types.GetPromptResult(
            description=f"Bulk {operation} operation for {len(domain_list)} domains",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    def _get_portfolio_analysis_prompt(self, args: Dict[str, str]) -> types.GetPromptResult:
        """Get portfolio analysis prompt"""
        include_pricing = args.get("include_pricing", "true").lower() == "true"
        include_expiry = args.get("include_expiry", "true").lower() == "true"
        include_dns = args.get("include_dns", "true").lower() == "true"

        content = f"""# Domain Portfolio Analysis

## Overview
Comprehensive analysis of your domain portfolio to identify optimization opportunities, security issues, and cost savings.

## Data Collection

### Step 1: Get Domain Inventory
```bash
# Get all domains with labels
porkbun_list_domains(include_labels=true)
```

**Collect:**
- Total domain count
- Domain status (active, expired, suspended)
- Registration and expiry dates
- Auto-renewal settings
- Security settings (lock, privacy)"""

        if include_pricing:
            content += f"""

### Step 2: Pricing Analysis
```bash
# Get current pricing information
porkbun_get_pricing()
```

**Analysis Points:**
- Current renewal costs per domain
- Total annual portfolio cost
- Price variations by TLD
- Potential savings opportunities
- Budget planning for renewals"""

        if include_expiry:
            content += f"""

### Step 3: Expiry Date Analysis
**Categorize domains by expiry:**
- Expiring within 30 days (URGENT)
- Expiring within 90 days (Plan renewal)
- Expiring within 1 year (Monitor)
- Long-term domains (>1 year)

**Risk Assessment:**
- Domains without auto-renewal
- Critical business domains
- Backup domain strategies"""

        if include_dns:
            content += f"""

### Step 4: DNS Configuration Analysis
```bash
# Analyze DNS setup for each domain
for each domain:
    porkbun_get_dns_records(domain=domain)
```

**Check for:**
- Domains with no DNS records (parked)
- Inconsistent configurations
- Missing security records
- Unused or redundant records"""

        content += f"""

## Analysis Categories

### Domain Utilization
1. **Active Websites** - Domains with A/CNAME records
2. **Email Only** - Domains with only MX records
3. **Redirects** - Domains with URL forwarding
4. **Parked** - Domains with minimal/no configuration
5. **Development** - Staging/test environments

### Security Posture
1. **DNSSEC Enabled** - Domains with DNSSEC
2. **Email Security** - SPF/DMARC configured
3. **SSL Security** - CAA records present
4. **Domain Lock** - Security lock enabled

### Cost Optimization
1. **Renewal Costs** - Annual cost breakdown
2. **Unused Domains** - Candidates for non-renewal
3. **TLD Optimization** - Consider cheaper alternatives
4. **Bulk Discounts** - Volume pricing opportunities

## Portfolio Health Score

### Scoring Criteria (1-10 scale)
- **Security**: DNSSEC, locks, privacy protection
- **Configuration**: Proper DNS setup, documentation
- **Cost Efficiency**: Renewal planning, unused domains
- **Risk Management**: Backup strategies, monitoring

### Sample Analysis Report
```
Domain Portfolio Summary
========================
Total Domains: 25
Active Websites: 15 (60%)
Email Only: 3 (12%)
Parked: 7 (28%)

Security Score: 7/10
- DNSSEC Enabled: 8 domains (32%)
- Domain Lock: 20 domains (80%)
- Email Security: 12 domains (48%)

Cost Analysis:
- Annual Renewal Cost: $847
- Potential Savings: $156 (18%)
- Unused Domains: 7

Risk Assessment:
- Expiring in 30 days: 2 domains
- No auto-renewal: 5 domains
- Critical without backup: 3 domains
```

## Optimization Recommendations

### High Priority
1. **Enable auto-renewal** for critical domains
2. **Implement DNSSEC** for business domains
3. **Add email security records** (SPF/DMARC)
4. **Review expiring domains** and renew/drop as needed

### Medium Priority
1. **Consolidate unused domains**
2. **Standardize DNS configurations**
3. **Implement monitoring** for critical domains
4. **Document domain purposes**

### Cost Savings
1. **Drop unused parked domains**
2. **Consider TLD alternatives** for development
3. **Implement bulk renewal** for discounts
4. **Review hosting consolidation** opportunities

## Implementation Plan

### Phase 1: Risk Mitigation (Week 1)
- Enable auto-renewal for critical domains
- Renew domains expiring soon
- Enable domain locks

### Phase 2: Security Enhancement (Week 2-3)
- Implement DNSSEC where needed
- Add email security records
- Configure CAA records

### Phase 3: Optimization (Week 4)
- Drop unused domains
- Consolidate similar services
- Update documentation

## Monitoring Setup
1. **Expiry alerts** (90, 30, 7 days)
2. **DNS change monitoring**
3. **Security status checks**
4. **Cost tracking** and budgeting

## Tools for Analysis
- `porkbun_list_domains` - Domain inventory
- `porkbun_get_dns_records` - Configuration analysis
- `porkbun_get_pricing` - Cost analysis
- `porkbun_check_domain` - Availability verification

## Expected Outcomes
- Reduced portfolio risks
- Lower annual costs (10-20% typical)
- Improved security posture
- Better organization and documentation
- Proactive renewal management

## Timeline
- Analysis phase: 2-3 days
- Implementation: 2-4 weeks
- Ongoing monitoring: Monthly reviews
"""

        return types.GetPromptResult(
            description="Complete domain portfolio analysis and optimization guide",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(type="text", text=content)
                )
            ]
        )

    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

def load_saved_credentials() -> Optional[ApiCredentials]:
    """Load encrypted credentials from file"""
    try:
        creds_file = Path('/workspace/data/porkbun_credentials.json')
        if creds_file.exists():
            with open(creds_file, 'rb') as f:
                data = json.loads(f.read().decode())
                
                encrypted_data = {
                    'api_key': bytes.fromhex(data['api_key']),
                    'secret_api_key': bytes.fromhex(data['secret_api_key'])
                }
                
                return ApiCredentials.from_encrypted_dict(encrypted_data)
    except Exception as e:
        logger.error(f"Error loading saved credentials: {e}")
    
    return None

async def main():
    """Main server entry point"""
    logger.info("Starting Porkbun MCP Server...")
    
    async with PorkbunMCPServer() as server:
        # Try to load saved credentials
        saved_creds = load_saved_credentials()
        if saved_creds:
            server.credentials = saved_creds
            logger.info("Loaded saved credentials")
        
        # Start the server
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await server.server.run(
                read_stream,
                write_stream,
                server.server.create_initialization_options()
            )

if __name__ == "__main__":
    asyncio.run(main())
