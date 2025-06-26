#!/usr/bin/env python3
"""
Comprehensive test suite for Porkbun MCP Server
Tests all API endpoints and functionality
"""

import asyncio
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import unittest
from unittest.mock import Mock, patch, AsyncMock

# Add the code directory to path
sys.path.insert(0, str(Path(__file__).parent))

from porkbun_mcp_server import (
    PorkbunMCPServer, 
    ApiCredentials, 
    SecurityValidator, 
    CacheManager,
    PORKBUN_API_BASE
)
from config import ServerConfig, get_config

# Configure test logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class TestSecurityValidator(unittest.TestCase):
    """Test security validation functions"""
    
    def setUp(self):
        self.validator = SecurityValidator()
    
    def test_validate_domain(self):
        """Test domain validation"""
        # Valid domains
        self.assertTrue(self.validator.validate_domain("example.com"))
        self.assertTrue(self.validator.validate_domain("sub.example.com"))
        self.assertTrue(self.validator.validate_domain("test-domain.co.uk"))
        self.assertTrue(self.validator.validate_domain("123.com"))
        
        # Invalid domains
        self.assertFalse(self.validator.validate_domain(""))
        self.assertFalse(self.validator.validate_domain("invalid..com"))
        self.assertFalse(self.validator.validate_domain("-.com"))
        self.assertFalse(self.validator.validate_domain("com."))
        self.assertFalse(self.validator.validate_domain("a" * 254))  # Too long
    
    def test_validate_ip(self):
        """Test IP address validation"""
        # Valid IPv4
        self.assertTrue(self.validator.validate_ip("192.168.1.1"))
        self.assertTrue(self.validator.validate_ip("8.8.8.8"))
        self.assertTrue(self.validator.validate_ip("127.0.0.1"))
        
        # Valid IPv6
        self.assertTrue(self.validator.validate_ip("2001:db8::1"))
        self.assertTrue(self.validator.validate_ip("::1"))
        self.assertTrue(self.validator.validate_ip("fe80::1%eth0"))
        
        # Invalid IPs
        self.assertFalse(self.validator.validate_ip("256.256.256.256"))
        self.assertFalse(self.validator.validate_ip("192.168.1"))
        self.assertFalse(self.validator.validate_ip("invalid"))
        self.assertFalse(self.validator.validate_ip(""))
    
    def test_validate_dns_record_type(self):
        """Test DNS record type validation"""
        # Valid types
        valid_types = ['A', 'MX', 'CNAME', 'ALIAS', 'TXT', 'NS', 'AAAA', 'SRV', 'TLSA', 'CAA', 'HTTPS', 'SVCB']
        for record_type in valid_types:
            self.assertTrue(self.validator.validate_dns_record_type(record_type))
            self.assertTrue(self.validator.validate_dns_record_type(record_type.lower()))
        
        # Invalid types
        self.assertFalse(self.validator.validate_dns_record_type("INVALID"))
        self.assertFalse(self.validator.validate_dns_record_type(""))
        self.assertFalse(self.validator.validate_dns_record_type("PTR"))  # Not in supported list
    
    def test_sanitize_string(self):
        """Test string sanitization"""
        # Normal strings
        self.assertEqual(self.validator.sanitize_string("hello world"), "hello world")
        self.assertEqual(self.validator.sanitize_string("  spaces  "), "spaces")
        
        # String with control characters
        self.assertEqual(self.validator.sanitize_string("hello\x00world\x1f"), "helloworld")
        
        # Length limiting
        long_string = "a" * 300
        result = self.validator.sanitize_string(long_string, 255)
        self.assertEqual(len(result), 255)
        
        # Non-string input
        self.assertEqual(self.validator.sanitize_string(123), "")
        self.assertEqual(self.validator.sanitize_string(None), "")

class TestCacheManager(unittest.TestCase):
    """Test cache functionality"""
    
    def setUp(self):
        self.cache = CacheManager()
        self.cache.clear()
    
    def test_cache_operations(self):
        """Test basic cache operations"""
        # Test set and get
        self.cache.set("test_key", "test_value", 1)
        self.assertEqual(self.cache.get("test_key"), "test_value")
        
        # Test expiration
        time.sleep(1.1)
        self.assertIsNone(self.cache.get("test_key"))
        
        # Test non-existent key
        self.assertIsNone(self.cache.get("nonexistent"))
    
    def test_cache_clear(self):
        """Test cache clearing"""
        self.cache.set("key1", "value1")
        self.cache.set("key2", "value2")
        
        self.assertEqual(self.cache.get("key1"), "value1")
        self.assertEqual(self.cache.get("key2"), "value2")
        
        self.cache.clear()
        
        self.assertIsNone(self.cache.get("key1"))
        self.assertIsNone(self.cache.get("key2"))

class TestApiCredentials(unittest.TestCase):
    """Test API credentials handling"""
    
    def test_credentials_encryption(self):
        """Test credential encryption and decryption"""
        original_creds = ApiCredentials("test_api_key", "test_secret_key")
        
        # Test encryption
        encrypted_dict = original_creds.to_encrypted_dict()
        self.assertIn('api_key', encrypted_dict)
        self.assertIn('secret_api_key', encrypted_dict)
        self.assertIsInstance(encrypted_dict['api_key'], bytes)
        self.assertIsInstance(encrypted_dict['secret_api_key'], bytes)
        
        # Test decryption
        decrypted_creds = ApiCredentials.from_encrypted_dict(encrypted_dict)
        self.assertEqual(decrypted_creds.api_key, original_creds.api_key)
        self.assertEqual(decrypted_creds.secret_api_key, original_creds.secret_api_key)

class TestPorkbunMCPServer(unittest.IsolatedAsyncioTestCase):
    """Test the main MCP server functionality"""
    
    async def asyncSetUp(self):
        """Set up test server"""
        self.server = PorkbunMCPServer()
        self.server.credentials = ApiCredentials("test_api_key", "test_secret_key")
    
    async def asyncTearDown(self):
        """Clean up after tests"""
        if self.server.session:
            await self.server.session.close()
    
    async def test_rate_limiting(self):
        """Test rate limiting functionality"""
        endpoint = "test_endpoint"
        
        # Should allow initial requests
        for i in range(10):
            result = await self.server._check_rate_limit(endpoint)
            self.assertTrue(result, f"Request {i+1} should be allowed")
        
        # Should block after limit
        result = await self.server._check_rate_limit(endpoint)
        self.assertFalse(result, "Request should be blocked after rate limit")
    
    @patch('aiohttp.ClientSession.post')
    async def test_api_request_success(self, mock_post):
        """Test successful API request"""
        # Mock successful response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={'status': 'SUCCESS', 'data': 'test'})
        mock_post.return_value.__aenter__.return_value = mock_response
        
        result = await self.server._make_api_request("ping")
        
        self.assertEqual(result['status'], 'SUCCESS')
        self.assertEqual(result['data'], 'test')
    
    @patch('aiohttp.ClientSession.post')
    async def test_api_request_http_error(self, mock_post):
        """Test API request with HTTP error"""
        # Mock HTTP error response
        mock_response = AsyncMock()
        mock_response.status = 500
        mock_response.text = AsyncMock(return_value="Internal Server Error")
        mock_post.return_value.__aenter__.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            await self.server._make_api_request("ping")
        
        self.assertIn("HTTP 500", str(context.exception))
    
    @patch('aiohttp.ClientSession.post')
    async def test_api_request_api_error(self, mock_post):
        """Test API request with API error"""
        # Mock API error response
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={'status': 'ERROR', 'message': 'Invalid API key'})
        mock_post.return_value.__aenter__.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            await self.server._make_api_request("ping")
        
        self.assertIn("API Error", str(context.exception))
    
    async def test_tool_calls_without_credentials(self):
        """Test tool calls that require credentials but none are set"""
        server_no_creds = PorkbunMCPServer()
        
        result = await server_no_creds._ping()
        self.assertEqual(len(result), 1)
        self.assertIn("No API credentials", result[0].text)
    
    async def test_set_credentials_validation(self):
        """Test credential setting with validation"""
        # Test with empty credentials
        result = await self.server._set_credentials({})
        self.assertEqual(len(result), 1)
        self.assertIn("required", result[0].text)
        
        # Test with incomplete credentials
        result = await self.server._set_credentials({'api_key': 'test'})
        self.assertEqual(len(result), 1)
        self.assertIn("required", result[0].text)
    
    async def test_clear_cache(self):
        """Test cache clearing"""
        # Add something to cache
        self.server.cache.set("test", "value")
        self.assertEqual(self.server.cache.get("test"), "value")
        
        # Clear cache
        result = await self.server._clear_cache()
        self.assertEqual(len(result), 1)
        self.assertIn("cleared", result[0].text)
        
        # Verify cache is empty
        self.assertIsNone(self.server.cache.get("test"))

class TestEndpointValidation(unittest.IsolatedAsyncioTestCase):
    """Test endpoint-specific validation and formatting"""
    
    async def asyncSetUp(self):
        self.server = PorkbunMCPServer()
        self.server.credentials = ApiCredentials("test_api_key", "test_secret_key")
    
    async def asyncTearDown(self):
        if self.server.session:
            await self.server.session.close()
    
    async def test_domain_validation_in_tools(self):
        """Test domain validation in various tools"""
        invalid_domain_args = {'domain': 'invalid..domain'}
        
        # Test various domain-based tools
        domain_tools = [
            '_check_domain',
            '_update_nameservers', 
            '_get_nameservers',
            '_add_url_forward',
            '_get_url_forwards',
            '_create_dns_record',
            '_get_dns_records'
        ]
        
        for tool_name in domain_tools:
            tool_method = getattr(self.server, tool_name)
            result = await tool_method(invalid_domain_args)
            self.assertEqual(len(result), 1)
            self.assertIn("Invalid domain", result[0].text)
    
    async def test_dns_record_type_validation(self):
        """Test DNS record type validation"""
        invalid_type_args = {
            'domain': 'example.com',
            'type': 'INVALID_TYPE',
            'content': 'test'
        }
        
        result = await self.server._create_dns_record(invalid_type_args)
        self.assertEqual(len(result), 1)
        self.assertIn("Invalid DNS record type", result[0].text)
    
    async def test_ip_validation_in_glue_records(self):
        """Test IP validation in glue record creation"""
        invalid_ip_args = {
            'domain': 'example.com',
            'subdomain': 'ns1',
            'ips': ['invalid_ip', '192.168.1.1']
        }
        
        result = await self.server._create_glue_record(invalid_ip_args)
        self.assertEqual(len(result), 1)
        self.assertIn("Invalid IP address", result[0].text)

class TestConfigurationManagement(unittest.TestCase):
    """Test configuration management"""
    
    def test_server_config_defaults(self):
        """Test default configuration values"""
        config = ServerConfig()
        
        self.assertEqual(config.porkbun_api_base, "https://api.porkbun.com/api/json/v3")
        self.assertEqual(config.rate_limit_window, 10)
        self.assertEqual(config.rate_limit_requests, 10)
        self.assertEqual(config.log_level, "INFO")
        self.assertEqual(config.environment, "development")
    
    def test_config_validation(self):
        """Test configuration validation"""
        config = ServerConfig()
        
        # Valid configuration should pass
        config.validate()
        
        # Invalid configuration should fail
        config.rate_limit_window = -1
        with self.assertRaises(ValueError):
            config.validate()
    
    def test_config_file_operations(self):
        """Test configuration file save/load"""
        config = ServerConfig()
        config.rate_limit_requests = 15  # Change from default
        
        test_config_file = "/tmp/test_porkbun_config.json"
        
        # Save configuration
        config.to_file(test_config_file)
        self.assertTrue(Path(test_config_file).exists())
        
        # Load configuration
        loaded_config = ServerConfig.from_file(test_config_file)
        self.assertEqual(loaded_config.rate_limit_requests, 15)
        
        # Clean up
        if Path(test_config_file).exists():
            Path(test_config_file).unlink()

class IntegrationTest(unittest.IsolatedAsyncioTestCase):
    """Integration tests requiring real API credentials"""
    
    async def asyncSetUp(self):
        """Set up integration test"""
        self.server = PorkbunMCPServer()
        
        # Check if real credentials are available
        api_key = os.environ.get('PORKBUN_API_KEY')
        secret_key = os.environ.get('PORKBUN_SECRET_API_KEY')
        
        if api_key and secret_key:
            self.server.credentials = ApiCredentials(api_key, secret_key)
            self.has_credentials = True
        else:
            self.has_credentials = False
            logger.warning("No real API credentials found. Skipping integration tests.")
    
    async def asyncTearDown(self):
        if self.server.session:
            await self.server.session.close()
    
    @unittest.skipUnless(os.environ.get('PORKBUN_API_KEY'), "Real API credentials required")
    async def test_real_api_ping(self):
        """Test ping with real API"""
        if not self.has_credentials:
            self.skipTest("No real API credentials")
        
        result = await self.server._ping()
        self.assertEqual(len(result), 1)
        self.assertIn("Ping successful", result[0].text)
    
    @unittest.skipUnless(os.environ.get('PORKBUN_API_KEY'), "Real API credentials required")
    async def test_real_api_pricing(self):
        """Test pricing endpoint"""
        if not self.has_credentials:
            self.skipTest("No real API credentials")
        
        result = await self.server._get_pricing()
        self.assertEqual(len(result), 1)
        self.assertIn("Domain Pricing", result[0].text)

def run_tests():
    """Run all tests"""
    # Create test directory structure
    Path("/workspace/logs").mkdir(exist_ok=True)
    Path("/workspace/data").mkdir(exist_ok=True)
    
    # Run unit tests
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestSecurityValidator,
        TestCacheManager, 
        TestApiCredentials,
        TestPorkbunMCPServer,
        TestEndpointValidation,
        TestConfigurationManagement,
        IntegrationTest
    ]
    
    for test_class in test_classes:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
