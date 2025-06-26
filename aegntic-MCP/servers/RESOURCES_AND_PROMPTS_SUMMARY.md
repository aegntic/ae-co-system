# Porkbun MCP Server - Resources and Prompts Enhancement

## Overview
The Porkbun MCP Server has been enhanced with comprehensive **Resources** and **Prompts** functionality, providing users with contextual documentation, examples, and guided workflows for domain management tasks.

## 📚 Resources (7 Total)

Resources provide contextual information and documentation accessible via URI patterns:

### 1. API Overview (`porkbun://docs/api-overview`)
- Complete Porkbun API overview
- Authentication requirements and best practices
- Rate limiting information
- Error handling guidelines
- Response formats and status codes

### 2. Domain Management (`porkbun://docs/domain-management`)
- Domain lifecycle management
- Nameserver configuration best practices
- URL forwarding strategies
- Glue records explained
- Security considerations for domains

### 3. DNS Records Reference (`porkbun://docs/dns-records`)
- Complete DNS record types reference
- Validation rules for each record type
- TTL recommendations
- Best practices for DNS configuration
- Real-world usage examples

### 4. Security Practices (`porkbun://docs/security-practices`)
- API credential security guidelines
- Input validation requirements
- Rate limiting implementation
- DNSSEC recommendations
- Network security best practices

### 5. Troubleshooting Guide (`porkbun://docs/troubleshooting`)
- Common API errors and solutions
- DNS propagation issues
- SSL certificate problems
- Performance optimization tips
- Debugging tools and techniques

### 6. DNS Configuration Examples (`porkbun://examples/dns-configurations`)
- JSON format configuration examples
- Basic website setup
- Email service configuration
- CDN integration
- Subdomain delegation
- TXT record configurations (SPF, DMARC, etc.)

### 7. Validation Rules (`porkbun://schemas/validation-rules`)
- Complete input validation schemas
- Domain name validation patterns
- IP address validation rules
- DNS record type constraints
- String length limitations

## 🎯 Prompts (7 Total)

Pre-built prompt templates for guided domain management workflows:

### 1. Setup New Domain (`setup-new-domain`)
**Purpose**: Complete guide for setting up a new domain
**Arguments**:
- `domain` (required): Domain name to set up
- `website_ip` (optional): IP address for website A record
- `mail_server` (optional): Mail server hostname for MX record
- `include_www` (optional): Include www subdomain setup

**Output**: Step-by-step setup guide with tool commands

### 2. Migrate Domain (`migrate-domain`)
**Purpose**: Domain migration from another registrar to Porkbun
**Arguments**:
- `domain` (required): Domain to migrate
- `current_registrar` (optional): Current registrar name
- `has_email` (optional): Whether domain has email services

**Output**: Comprehensive migration checklist and timeline

### 3. Configure DNS Records (`configure-dns-records`)
**Purpose**: DNS configuration for common services
**Arguments**:
- `domain` (required): Domain name
- `service_type` (required): Type of service (website, email, cdn, api)
- `target` (required): Target IP or hostname

**Output**: Service-specific DNS configuration guide

### 4. Troubleshoot DNS (`troubleshoot-dns`)
**Purpose**: DNS troubleshooting and diagnostics
**Arguments**:
- `domain` (required): Domain with issues
- `issue_description` (required): Description of the problem
- `record_type` (optional): DNS record type having issues

**Output**: Diagnostic steps and resolution strategies

### 5. Security Audit (`security-audit`)
**Purpose**: Domain security audit and recommendations
**Arguments**:
- `domain` (required): Domain to audit
- `check_dnssec` (optional): Include DNSSEC verification
- `check_ssl` (optional): Include SSL certificate check

**Output**: Security assessment and improvement recommendations

### 6. Bulk Domain Operation (`bulk-domain-operation`)
**Purpose**: Efficient bulk operations on multiple domains
**Arguments**:
- `domains` (required): Comma-separated list of domains
- `operation` (required): Operation to perform
- `parameters` (optional): Additional parameters as JSON

**Output**: Batch processing strategy with error handling

### 7. Domain Portfolio Analysis (`domain-portfolio-analysis`)
**Purpose**: Comprehensive portfolio analysis and optimization
**Arguments**:
- `include_pricing` (optional): Include cost analysis
- `include_expiry` (optional): Include expiry date analysis
- `include_dns` (optional): Include DNS configuration analysis

**Output**: Portfolio health score and optimization recommendations

## 🔧 Implementation Details

### Resource Handler Architecture
```python
@self.server.list_resources()
async def list_resources() -> List[Resource]:
    # Returns list of available resources with URIs and descriptions

@self.server.read_resource()
async def read_resource(uri: str) -> str:
    # Returns resource content based on URI
```

### Prompt Handler Architecture
```python
@self.server.list_prompts()
async def list_prompts() -> List[Prompt]:
    # Returns list of available prompts with arguments

@self.server.get_prompt()
async def get_prompt(name: str, arguments: Dict[str, str]) -> types.GetPromptResult:
    # Returns prompt content with user arguments
```

### Content Generation
Each resource and prompt has dedicated content generation methods:
- Resources: `_get_*_resource()` methods return formatted documentation
- Prompts: `_get_*_prompt()` methods return contextualized workflow guides

## 🎉 Benefits

### For Users
1. **Guided Workflows**: Step-by-step instructions for complex tasks
2. **Contextual Help**: Immediate access to relevant documentation
3. **Best Practices**: Built-in security and configuration recommendations
4. **Error Prevention**: Validation rules and troubleshooting guides
5. **Efficiency**: Pre-built templates for common operations

### For Developers
1. **Comprehensive Documentation**: All API details in accessible format
2. **Examples Repository**: Real-world configuration examples
3. **Validation Schemas**: Clear input requirements and constraints
4. **Troubleshooting Guide**: Quick resolution of common issues
5. **Security Guidelines**: Best practices for safe implementation

## 📊 Validation Results

All resources and prompts have been validated:
- ✅ 7 resource URIs implemented with content methods
- ✅ 7 prompt templates with argument validation
- ✅ Complete documentation coverage
- ✅ Real-world examples and use cases
- ✅ Error handling and edge cases covered

## 🚀 Usage Examples

### Accessing Resources
```python
# List all available resources
resources = await server.list_resources()

# Read specific resource
content = await server.read_resource("porkbun://docs/api-overview")
```

### Using Prompts
```python
# List all available prompts
prompts = await server.list_prompts()

# Get prompt with arguments
result = await server.get_prompt("setup-new-domain", {
    "domain": "example.com",
    "website_ip": "192.168.1.1",
    "include_www": "true"
})
```

This enhancement transforms the Porkbun MCP Server from a simple API wrapper into a comprehensive domain management assistant with guided workflows and extensive documentation support.
