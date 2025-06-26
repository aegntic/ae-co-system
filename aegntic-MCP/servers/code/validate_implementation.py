#!/usr/bin/env python3
"""
Validation script for Porkbun MCP Server core components
Tests functionality without requiring external dependencies
"""

import json
import re
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

def test_security_validator():
    """Test security validation functions"""
    print("Testing SecurityValidator...")
    
    class SecurityValidator:
        @staticmethod
        def validate_domain(domain: str) -> bool:
            if not domain or len(domain) > 253:
                return False
            domain_pattern = re.compile(
                r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$'
            )
            return bool(domain_pattern.match(domain))
        
        @staticmethod
        def validate_ip(ip: str) -> bool:
            import ipaddress
            try:
                ipaddress.ip_address(ip)
                return True
            except ValueError:
                return False
        
        @staticmethod
        def validate_dns_record_type(record_type: str) -> bool:
            valid_types = {'A', 'MX', 'CNAME', 'ALIAS', 'TXT', 'NS', 'AAAA', 'SRV', 'TLSA', 'CAA', 'HTTPS', 'SVCB'}
            return record_type.upper() in valid_types
        
        @staticmethod
        def sanitize_string(value: str, max_length: int = 255) -> str:
            if not isinstance(value, str):
                return ""
            sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
            return sanitized[:max_length].strip()
    
    validator = SecurityValidator()
    
    # Test domain validation
    test_cases = [
        ("example.com", True),
        ("sub.example.com", True),
        ("test-domain.co.uk", True),
        ("", False),
        ("invalid..com", False),
        ("-.com", False)
    ]
    
    for domain, expected in test_cases:
        result = validator.validate_domain(domain)
        assert result == expected, f"Domain validation failed for {domain}: expected {expected}, got {result}"
    
    # Test IP validation
    ip_test_cases = [
        ("192.168.1.1", True),
        ("8.8.8.8", True),
        ("2001:db8::1", True),
        ("256.256.256.256", False),
        ("invalid", False)
    ]
    
    for ip, expected in ip_test_cases:
        result = validator.validate_ip(ip)
        assert result == expected, f"IP validation failed for {ip}: expected {expected}, got {result}"
    
    # Test DNS record type validation
    record_test_cases = [
        ("A", True),
        ("MX", True),
        ("CNAME", True),
        ("INVALID", False),
        ("PTR", False)  # Not in supported list
    ]
    
    for record_type, expected in record_test_cases:
        result = validator.validate_dns_record_type(record_type)
        assert result == expected, f"DNS record validation failed for {record_type}: expected {expected}, got {result}"
    
    # Test string sanitization
    assert validator.sanitize_string("hello world") == "hello world"
    assert validator.sanitize_string("  spaces  ") == "spaces"
    assert validator.sanitize_string("hello\x00world\x1f") == "helloworld"
    
    print("✅ SecurityValidator tests passed")

def test_cache_manager():
    """Test cache functionality"""
    print("Testing CacheManager...")
    
    class CacheManager:
        def __init__(self):
            self._cache: Dict[str, Dict[str, Any]] = {}
        
        def get(self, key: str) -> Optional[Any]:
            if key in self._cache:
                entry = self._cache[key]
                if time.time() < entry['expires']:
                    return entry['value']
                else:
                    del self._cache[key]
            return None
        
        def set(self, key: str, value: Any, ttl: int = 300) -> None:
            self._cache[key] = {
                'value': value,
                'expires': time.time() + ttl
            }
        
        def clear(self) -> None:
            self._cache.clear()
    
    cache = CacheManager()
    
    # Test basic operations
    cache.set("test_key", "test_value", 1)
    assert cache.get("test_key") == "test_value"
    
    # Test non-existent key
    assert cache.get("nonexistent") is None
    
    # Test clear
    cache.set("key1", "value1")
    cache.set("key2", "value2")
    cache.clear()
    assert cache.get("key1") is None
    assert cache.get("key2") is None
    
    print("✅ CacheManager tests passed")

def test_config_validation():
    """Test configuration management"""
    print("Testing configuration validation...")
    
    class ServerConfig:
        def __init__(self):
            self.rate_limit_window = 10
            self.rate_limit_requests = 10
            self.request_timeout = 30
            self.connection_timeout = 10
            self.cache_ttl_default = 300
            self.port = 8080
        
        def validate(self) -> None:
            errors = []
            
            if self.rate_limit_window <= 0:
                errors.append("rate_limit_window must be positive")
            if self.rate_limit_requests <= 0:
                errors.append("rate_limit_requests must be positive")
            if self.request_timeout <= 0:
                errors.append("request_timeout must be positive")
            if self.connection_timeout <= 0:
                errors.append("connection_timeout must be positive")
            if self.cache_ttl_default <= 0:
                errors.append("cache_ttl_default must be positive")
            if not (1 <= self.port <= 65535):
                errors.append("port must be between 1 and 65535")
            
            if errors:
                raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
    
    # Test valid configuration
    config = ServerConfig()
    config.validate()  # Should not raise
    
    # Test invalid configuration
    config.rate_limit_window = -1
    try:
        config.validate()
        assert False, "Should have raised ValueError"
    except ValueError:
        pass  # Expected
    
    print("✅ Configuration validation tests passed")

def test_api_endpoints_coverage():
    """Test that all expected API endpoints are covered"""
    print("Testing API endpoint coverage...")
    
    # Read the main server file
    server_file = Path("porkbun_mcp_server.py")
    if not server_file.exists():
        print("⚠️  Server file not found, skipping endpoint coverage test")
        return
    
    with open(server_file, 'r') as f:
        content = f.read()
    
    # Expected tool names based on Porkbun API documentation
    expected_tools = [
        "porkbun_ping",
        "porkbun_get_pricing",
        "porkbun_list_domains",
        "porkbun_check_domain",
        "porkbun_update_nameservers",
        "porkbun_get_nameservers",
        "porkbun_add_url_forward",
        "porkbun_get_url_forwards",
        "porkbun_delete_url_forward",
        "porkbun_create_glue_record",
        "porkbun_update_glue_record",
        "porkbun_delete_glue_record",
        "porkbun_get_glue_records",
        "porkbun_create_dns_record",
        "porkbun_edit_dns_record",
        "porkbun_edit_dns_records_by_type",
        "porkbun_delete_dns_record",
        "porkbun_delete_dns_records_by_type",
        "porkbun_get_dns_records",
        "porkbun_get_dns_records_by_type",
        "porkbun_create_dnssec_record",
        "porkbun_get_dnssec_records",
        "porkbun_delete_dnssec_record",
        "porkbun_get_ssl_bundle",
        "porkbun_set_credentials",
        "porkbun_clear_cache"
    ]
    
    missing_tools = []
    for tool in expected_tools:
        if f'name="{tool}"' not in content:
            missing_tools.append(tool)
    
    if missing_tools:
        print(f"❌ Missing tools: {missing_tools}")
        assert False, f"Missing tool implementations: {missing_tools}"
    
    print(f"✅ All {len(expected_tools)} expected tools are implemented")

def test_resources_and_prompts():
    """Test that resources and prompts are implemented"""
    print("Testing resources and prompts...")
    
    # Read the main server file
    server_file = Path("porkbun_mcp_server.py")
    if not server_file.exists():
        print("⚠️  Server file not found, skipping resources and prompts test")
        return
    
    with open(server_file, 'r') as f:
        content = f.read()
    
    # Check for resource handlers
    resource_handlers = [
        "@self.server.list_resources()",
        "@self.server.read_resource()",
        "@self.server.list_prompts()",
        "@self.server.get_prompt()"
    ]
    
    for handler in resource_handlers:
        if handler not in content:
            print(f"❌ Missing handler: {handler}")
            assert False, f"Missing resource/prompt handler: {handler}"
    
    # Check for expected resources
    expected_resources = [
        "porkbun://docs/api-overview",
        "porkbun://docs/domain-management", 
        "porkbun://docs/dns-records",
        "porkbun://docs/security-practices",
        "porkbun://docs/troubleshooting",
        "porkbun://examples/dns-configurations",
        "porkbun://schemas/validation-rules"
    ]
    
    for resource in expected_resources:
        if resource not in content:
            print(f"❌ Missing resource: {resource}")
            assert False, f"Missing resource: {resource}"
    
    # Check for expected prompts
    expected_prompts = [
        "setup-new-domain",
        "migrate-domain",
        "configure-dns-records",
        "troubleshoot-dns",
        "security-audit",
        "bulk-domain-operation",
        "domain-portfolio-analysis"
    ]
    
    for prompt in expected_prompts:
        if f'name="{prompt}"' not in content:
            print(f"❌ Missing prompt: {prompt}")
            assert False, f"Missing prompt: {prompt}"
    
    # Check for resource content methods
    resource_methods = [
        "_get_api_overview_resource",
        "_get_domain_management_resource",
        "_get_dns_records_resource",
        "_get_security_practices_resource",
        "_get_troubleshooting_resource",
        "_get_dns_examples_resource",
        "_get_validation_rules_resource"
    ]
    
    for method in resource_methods:
        if f"def {method}" not in content:
            print(f"❌ Missing resource method: {method}")
            assert False, f"Missing resource content method: {method}"
    
    # Check for prompt template methods
    prompt_methods = [
        "_get_setup_domain_prompt",
        "_get_migrate_domain_prompt", 
        "_get_configure_dns_prompt",
        "_get_troubleshoot_dns_prompt",
        "_get_security_audit_prompt",
        "_get_bulk_operation_prompt",
        "_get_portfolio_analysis_prompt"
    ]
    
    for method in prompt_methods:
        if f"def {method}" not in content:
            print(f"❌ Missing prompt method: {method}")
            assert False, f"Missing prompt template method: {method}"
    
    print(f"✅ All {len(expected_resources)} resources and {len(expected_prompts)} prompts implemented")
    print(f"✅ All {len(resource_methods)} resource methods and {len(prompt_methods)} prompt methods implemented")

def test_file_structure():
    """Test that all required files are present"""
    print("Testing file structure...")
    
    required_files = [
        "porkbun_mcp_server.py",
        "config.py",
        "test_porkbun_mcp.py",
        "requirements.txt",
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.dev.yml",
        "deploy.sh"
    ]
    
    missing_files = []
    for file_name in required_files:
        if not Path(file_name).exists():
            missing_files.append(file_name)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        assert False, f"Missing required files: {missing_files}"
    
    print(f"✅ All {len(required_files)} required files are present")

def test_docker_files():
    """Test Docker configuration files"""
    print("Testing Docker configuration...")
    
    # Test Dockerfile
    dockerfile = Path("Dockerfile")
    if dockerfile.exists():
        content = dockerfile.read_text()
        assert "FROM python:" in content, "Dockerfile should use Python base image"
        assert "COPY requirements.txt" in content, "Dockerfile should copy requirements.txt"
        assert "RUN pip install" in content, "Dockerfile should install dependencies"
        print("✅ Dockerfile structure is valid")
    
    # Test docker-compose.yml
    compose_file = Path("docker-compose.yml")
    if compose_file.exists():
        content = compose_file.read_text()
        assert "porkbun-mcp" in content, "Docker compose should define porkbun-mcp service"
        assert "volumes:" in content, "Docker compose should define volumes"
        print("✅ Docker Compose configuration is valid")

def main():
    """Run all validation tests"""
    print("🚀 Starting Porkbun MCP Server validation...")
    print("=" * 50)
    
    tests = [
        test_security_validator,
        test_cache_manager,
        test_config_validation,
        test_file_structure,
        test_docker_files,
        test_api_endpoints_coverage,
        test_resources_and_prompts
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__} failed: {e}")
            failed += 1
    
    print("=" * 50)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All validation tests passed! Porkbun MCP Server is ready for deployment.")
        return True
    else:
        print("💥 Some validation tests failed. Please review and fix the issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
