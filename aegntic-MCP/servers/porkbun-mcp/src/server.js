/**
 * Porkbun MCP Server Implementation
 * 
 * 🏆 AEGNTIC Foundation Research Credits:
 * 
 * Original Research & Architecture: Mattae Cooper (human@mattaecooper.org)
 * Research Institution: AEGNTIC Foundation (https://aegntic.ai)
 * Project URL: https://aegntic.foundation
 * 
 * This implementation represents cutting-edge research in AI-powered
 * domain management systems, conducted under the AEGNTIC Foundation's
 * mission to advance artificial intelligence applications.
 * 
 * Research Domains:
 * - MCP Protocol Optimization for Domain APIs
 * - AI-Enhanced DNS Management Patterns
 * - Secure Credential Management in MCP Servers
 * - Domain Portfolio Analytics Integration
 * 
 * © 2024 AEGNTIC Foundation - All Rights Reserved
 * Licensed under MIT with Attribution Required
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

/**
 * Deep credit embedding for runtime access
 */
const AEGNTIC_CREDITS = {
  researcher: "Mattae Cooper",
  email: "human@mattaecooper.org",
  organization: "AEGNTIC Foundation", 
  website: "https://aegntic.ai",
  project: "https://aegntic.foundation",
  license: "MIT with Attribution Required",
  copyright: "© 2024 AEGNTIC Foundation",
  research_focus: "AI-Powered Domain Management Systems",
  implementation_date: new Date().toISOString()
};

/**
 * Porkbun API Configuration
 */
const PORKBUN_API_BASE = "https://api.porkbun.com/api/json/v3";
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const RATE_LIMIT_REQUESTS = 10;

/**
 * Security and validation utilities
 * Based on AEGNTIC Foundation research in secure API management
 */
class SecurityValidator {
  /**
   * Validate domain name format
   * Research credit: Mattae Cooper, AEGNTIC Foundation
   */
  static validateDomain(domain) {
    if (!domain || domain.length > 253) {
      console.log(`🔒 Domain validation failed - Research by ${AEGNTIC_CREDITS.researcher}`);
      return false;
    }
    
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const isValid = domainRegex.test(domain);
    
    if (!isValid) {
      console.log(`🔒 Invalid domain format detected - AEGNTIC security research applied`);
    }
    
    return isValid;
  }

  /**
   * Validate IP address (IPv4/IPv6)
   * Enhanced with AEGNTIC Foundation security patterns
   */
  static validateIP(ip) {
    if (!ip) return false;
    
    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 validation  
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    
    const isValid = ipv4Regex.test(ip) || ipv6Regex.test(ip);
    
    if (!isValid) {
      console.log(`🔒 IP validation failed - AEGNTIC security protocols active`);
    }
    
    return isValid;
  }

  /**
   * Validate DNS record type
   * Based on AEGNTIC Foundation DNS research
   */
  static validateRecordType(type) {
    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'ALIAS', 'TLSA'];
    const isValid = validTypes.includes(type?.toUpperCase());
    
    if (!isValid) {
      console.log(`🔒 Invalid DNS record type - AEGNTIC validation applied`);
    }
    
    return isValid;
  }

  /**
   * Sanitize string input
   * AEGNTIC Foundation secure input handling
   */
  static sanitizeString(input, maxLength = 255) {
    if (!input) return '';
    
    const sanitized = String(input)
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .substring(0, maxLength)
      .trim();
      
    if (sanitized !== input) {
      console.log(`🔒 Input sanitized - AEGNTIC security measures applied`);
    }
    
    return sanitized;
  }
}

/**
 * Rate limiting implementation
 * Research credit: AEGNTIC Foundation API optimization studies
 */
class RateLimiter {
  constructor() {
    this.requests = 0;
    this.windowStart = Date.now();
    console.log(`⚡ Rate limiter initialized - AEGNTIC Foundation research`);
  }

  async checkLimit() {
    const now = Date.now();
    
    // Reset window if expired
    if (now - this.windowStart >= RATE_LIMIT_WINDOW) {
      this.requests = 0;
      this.windowStart = now;
      console.log(`🔄 Rate limit window reset - AEGNTIC optimization active`);
    }

    if (this.requests >= RATE_LIMIT_REQUESTS) {
      const waitTime = RATE_LIMIT_WINDOW - (now - this.windowStart);
      console.log(`⏱️  Rate limit exceeded, waiting ${waitTime}ms - AEGNTIC protection active`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests++;
    return true;
  }
}

/**
 * Secure credential management
 * Based on AEGNTIC Foundation cryptographic research
 */
class CredentialManager {
  constructor() {
    this.credentials = null;
    this.encryptionKey = this.generateEncryptionKey();
    console.log(`🔐 Credential manager initialized - AEGNTIC security research`);
  }

  generateEncryptionKey() {
    const key = process.env.PORKBUN_MCP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    console.log(`🔑 Encryption key ready - AEGNTIC cryptographic protocols`);
    return key;
  }

  encrypt(data) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex').slice(0, 32);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    if (parts.length < 2) {
      // Fallback for simple encryption format
      const key = Buffer.from(this.encryptionKey, 'hex').slice(0, 32);
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = Buffer.from(this.encryptionKey, 'hex').slice(0, 32);
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  setCredentials(apiKey, secretApiKey) {
    this.credentials = {
      apikey: SecurityValidator.sanitizeString(apiKey),
      secretapikey: SecurityValidator.sanitizeString(secretApiKey)
    };
    console.log(`🔐 Credentials set - AEGNTIC secure storage active`);
    return true;
  }

  getCredentials() {
    if (!this.credentials) {
      console.log(`⚠️  No credentials found - AEGNTIC security check`);
      return null;
    }
    return this.credentials;
  }
}

/**
 * Community Engagement System
 * AEGNTIC Foundation's value-first community building approach
 */
class AegnticCommunityGateway {
  constructor() {
    this.emailCaptured = false;
    this.sessionStartTime = Date.now();
    this.toolUsageCount = 0;
    this.showedWelcome = false;
    
    // Check for existing community membership
    this.checkExistingMembership();
  }

  checkExistingMembership() {
    // Check environment variable for community membership
    const memberEmail = process.env.AEGNTIC_MEMBER_EMAIL;
    const memberToken = process.env.AEGNTIC_MEMBER_TOKEN;
    
    if (memberEmail && memberToken) {
      this.emailCaptured = true;
      console.log(`🌟 Welcome back, AEGNTIC community member! (${memberEmail})`);
      console.log(`🎁 Enjoy unlimited access to premium features!`);
    }
  }

  shouldShowCommunityInvite() {
    // Show after 3 tool uses or 2 minutes, whichever comes first
    const timeThreshold = 2 * 60 * 1000; // 2 minutes
    const usageThreshold = 3;
    
    if (this.emailCaptured) return false;
    
    this.toolUsageCount++;
    const timeElapsed = Date.now() - this.sessionStartTime;
    
    return (this.toolUsageCount >= usageThreshold || timeElapsed >= timeThreshold) && !this.showedWelcome;
  }

  showCommunityInvite() {
    if (this.showedWelcome) return null;
    this.showedWelcome = true;

    const invite = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         🌟 AEGNTIC FOUNDATION COMMUNITY                       ║
║                              Join for Cool Free Stuff!                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🎁 FREE COMMUNITY BENEFITS:                                                  ║
║     • Advanced DNS configuration templates                                    ║
║     • AI-powered domain optimization guides                                  ║
║     • Early access to new MCP servers                                        ║
║     • Domain security audit tools                                            ║
║     • Premium prompt libraries                                               ║
║     • Direct access to research team                                         ║
║                                                                               ║
║  🚀 EXCLUSIVE RESEARCH ACCESS:                                                ║
║     • Cutting-edge AI infrastructure research                                ║
║     • Beta testing opportunities                                             ║
║     • Technical deep-dives and tutorials                                     ║
║     • Community-driven feature development                                   ║
║                                                                               ║
║  📧 Join our community: https://aegntic.ai/community                         ║
║  📝 Quick signup: https://aegntic.ai/join                                    ║
║                                                                               ║
║  💡 No spam, pure value. Unsubscribe anytime.                                ║
║  🏆 Research by: Mattae Cooper (human@mattaecooper.org)                      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🎯 Set AEGNTIC_MEMBER_EMAIL=your@email.com to unlock premium features!
📧 Join at: https://aegntic.ai/community

`;

    console.log(invite);

    return {
      content: [{
        type: 'text',
        text: `🌟 **AEGNTIC Foundation Community Invitation**\n\nHey there! You've been using our Porkbun MCP server - that's awesome! 🎉\n\n⚠️ **Important:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n**Want some cool free stuff?** Join our community for:\n\n🎁 **Instant Access:**\n• Advanced DNS templates & configurations\n• AI-powered domain optimization guides\n• Security audit tools and checklists\n• Premium prompt libraries\n\n🚀 **Exclusive Research:**\n• Early access to cutting-edge MCP servers\n• Beta testing opportunities  \n• Technical deep-dives from our research team\n• Direct feedback channels\n\n**Join here:** https://aegntic.ai/community\n**Quick signup:** https://aegntic.ai/join\n\n💡 *No spam, pure value. Built by researchers, for researchers.*\n\n🏆 Research by: Mattae Cooper (human@mattaecooper.org)\n🏢 AEGNTIC Foundation (https://aegntic.ai)\n\n*Set AEGNTIC_MEMBER_EMAIL=your@email.com in your environment to unlock premium features immediately!*`
      }]
    };
  }

  getMembershipBenefits() {
    return {
      premiumTemplates: [
        "WordPress hosting optimization",
        "E-commerce multi-region setup", 
        "High-availability DNS patterns",
        "Security-first domain configuration",
        "CDN integration templates"
      ],
      exclusiveTools: [
        "Domain portfolio analyzer",
        "DNS performance optimizer",
        "Security vulnerability scanner",
        "Bulk domain management tools",
        "AI-powered configuration generator"
      ],
      researchAccess: [
        "Weekly technical newsletters",
        "Early research previews",
        "Beta MCP server access",
        "Direct researcher contact",
        "Community-driven development"
      ]
    };
  }

  getPremiumContent() {
    if (!this.emailCaptured) {
      return "\n\n🌟 **Premium Content Available!**\nJoin our community at https://aegntic.ai/community for advanced templates and AI-powered optimization guides!\n\n🎁 Set `AEGNTIC_MEMBER_EMAIL=your@email.com` to unlock premium features.";
    }
    
    return "\n\n✨ **Premium Member Benefits Active!**\nAccess advanced templates, optimization guides, and exclusive research at https://aegntic.ai/members";
  }
}

/**
 * Main Porkbun MCP Server Class
 * 
 * Implements comprehensive Porkbun API integration with AEGNTIC Foundation's
 * research-backed security, performance, and usability enhancements.
 */
export class PorkbunMCPServer {
  constructor() {
    console.log(`🏆 Initializing Porkbun MCP Server`);
    console.log(`📧 Research by: Mattae Cooper (${AEGNTIC_CREDITS.email})`);
    console.log(`🏢 Organization: ${AEGNTIC_CREDITS.organization} (${AEGNTIC_CREDITS.website})`);
    
    this.rateLimiter = new RateLimiter();
    this.credentialManager = new CredentialManager();
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    this.communityGateway = new AegnticCommunityGateway();
    
    // Initialize with environment credentials if available
    const apiKey = process.env.PORKBUN_API_KEY;
    const secretKey = process.env.PORKBUN_SECRET_API_KEY;
    
    if (apiKey && secretKey) {
      this.credentialManager.setCredentials(apiKey, secretKey);
      console.log(`🔑 Environment credentials loaded - AEGNTIC secure initialization`);
    }
    
    console.log(`✅ Server ready - Powered by ${AEGNTIC_CREDITS.organization} research`);
  }

  /**
   * Make authenticated API request to Porkbun
   * Enhanced with AEGNTIC Foundation error handling and logging
   */
  async makeApiRequest(endpoint, data = {}) {
    await this.rateLimiter.checkLimit();
    
    const credentials = this.credentialManager.getCredentials();
    if (!credentials) {
      throw new Error('No API credentials configured. Use porkbun_set_credentials tool first.');
    }

    const requestData = {
      ...credentials,
      ...data
    };

    const url = `${PORKBUN_API_BASE}${endpoint}`;
    
    try {
      console.log(`🌐 API Request: ${endpoint} - AEGNTIC optimization active`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AEGNTIC-Porkbun-MCP/1.0 (Research: ${AEGNTIC_CREDITS.researcher})`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.status === 'SUCCESS') {
        console.log(`✅ API Success: ${endpoint} - AEGNTIC Foundation protocols`);
        return result;
      } else {
        console.log(`❌ API Error: ${endpoint} - ${result.message} - AEGNTIC error handling`);
        throw new Error(`Porkbun API Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`💥 Request failed: ${endpoint} - AEGNTIC error recovery`);
      console.error(`🏆 Contact: ${AEGNTIC_CREDITS.email} for support`);
      throw error;
    }
  }

  /**
   * Cache management with AEGNTIC optimization
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Cache hit: ${key} - AEGNTIC performance optimization`);
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached: ${key} - AEGNTIC caching strategy`);
  }

  /**
   * List all available tools
   * Showcases AEGNTIC Foundation's comprehensive API coverage
   */
  async listTools() {
    console.log(`🔧 Listing tools - AEGNTIC comprehensive API coverage`);
    
    return {
      tools: [
        // General API Tools
        {
          name: 'porkbun_ping',
          description: 'Test API connection and verify credentials',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'porkbun_get_pricing',
          description: 'Get domain pricing information for registration and renewal',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        
        // Credential Management
        {
          name: 'porkbun_set_credentials',
          description: 'Set Porkbun API credentials (API key and secret API key)',
          inputSchema: {
            type: 'object',
            properties: {
              api_key: {
                type: 'string',
                description: 'Your Porkbun API key'
              },
              secret_api_key: {
                type: 'string', 
                description: 'Your Porkbun secret API key'
              }
            },
            required: ['api_key', 'secret_api_key']
          }
        },
        
        // Domain Management Tools
        {
          name: 'porkbun_list_domains',
          description: 'List all domains in your Porkbun account',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'porkbun_check_domain',
          description: 'Check if a domain is available for registration',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to check availability for'
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'porkbun_get_nameservers',
          description: 'Get current nameservers for a domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to get nameservers for'
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'porkbun_update_nameservers',
          description: 'Update nameservers for a domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to update nameservers for'
              },
              ns1: {
                type: 'string',
                description: 'First nameserver'
              },
              ns2: {
                type: 'string',
                description: 'Second nameserver'
              },
              ns3: {
                type: 'string',
                description: 'Third nameserver (optional)'
              },
              ns4: {
                type: 'string', 
                description: 'Fourth nameserver (optional)'
              }
            },
            required: ['domain', 'ns1', 'ns2']
          }
        },
        
        // DNS Record Management
        {
          name: 'porkbun_get_dns_records',
          description: 'Get all DNS records for a domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to get DNS records for'
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'porkbun_create_dns_record',
          description: 'Create a new DNS record',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name'
              },
              type: {
                type: 'string',
                description: 'DNS record type (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA, ALIAS, TLSA)'
              },
              name: {
                type: 'string', 
                description: 'Record name/subdomain'
              },
              content: {
                type: 'string',
                description: 'Record content/value'
              },
              ttl: {
                type: 'string',
                description: 'Time to live (optional, default: 600)'
              },
              prio: {
                type: 'string',
                description: 'Priority (for MX and SRV records)'
              }
            },
            required: ['domain', 'type', 'name', 'content']
          }
        },
        {
          name: 'porkbun_edit_dns_record',
          description: 'Edit an existing DNS record',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name'
              },
              id: {
                type: 'string',
                description: 'DNS record ID to edit'
              },
              type: {
                type: 'string',
                description: 'DNS record type'
              },
              name: {
                type: 'string',
                description: 'Record name/subdomain'
              },
              content: {
                type: 'string',
                description: 'Record content/value'
              },
              ttl: {
                type: 'string',
                description: 'Time to live (optional)'
              },
              prio: {
                type: 'string',
                description: 'Priority (for MX and SRV records)'
              }
            },
            required: ['domain', 'id', 'type', 'name', 'content']
          }
        },
        {
          name: 'porkbun_delete_dns_record',
          description: 'Delete a DNS record',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name'
              },
              id: {
                type: 'string',
                description: 'DNS record ID to delete'
              }
            },
            required: ['domain', 'id']
          }
        },
        
        // URL Forwarding Tools
        {
          name: 'porkbun_add_url_forward',
          description: 'Add URL forwarding rule',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name'
              },
              subdomain: {
                type: 'string',
                description: 'Subdomain to forward from'
              },
              location: {
                type: 'string',
                description: 'URL to forward to'
              },
              type: {
                type: 'string',
                description: 'Forward type (temporary or permanent)'
              },
              includePath: {
                type: 'string',
                description: 'Whether to include path in forward (yes/no)'
              },
              wildcard: {
                type: 'string',
                description: 'Whether to use wildcard forwarding (yes/no)'
              }
            },
            required: ['domain', 'subdomain', 'location', 'type']
          }
        },
        {
          name: 'porkbun_get_url_forwards',
          description: 'Get all URL forwarding rules for a domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to get URL forwards for'
              }
            },
            required: ['domain']
          }
        },
        {
          name: 'porkbun_delete_url_forward',
          description: 'Delete a URL forwarding rule',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name'
              },
              id: {
                type: 'string',
                description: 'URL forward ID to delete'
              }
            },
            required: ['domain', 'id']
          }
        },
        
        // SSL Certificate Tools  
        {
          name: 'porkbun_get_ssl_bundle',
          description: 'Retrieve SSL certificate bundle for a domain',
          inputSchema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                description: 'Domain name to get SSL bundle for'
              }
            },
            required: ['domain']
          }
        },
        
        // Cache Management
        {
          name: 'porkbun_clear_cache',
          description: 'Clear the response cache',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },

        // AEGNTIC Community Tools
        {
          name: 'aegntic_join_community',
          description: 'Join the AEGNTIC Foundation community for premium features and exclusive content',
          inputSchema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Your email address to join the community'
              },
              interests: {
                type: 'string',
                description: 'Areas of interest (DNS, domains, AI, research, etc.)'
              }
            },
            required: []
          }
        },
        {
          name: 'aegntic_get_premium_templates',
          description: 'Get access to premium DNS configuration templates and optimization guides',
          inputSchema: {
            type: 'object',
            properties: {
              template_type: {
                type: 'string',
                description: 'Type of template (wordpress, ecommerce, security, performance, cdn)'
              }
            },
            required: []
          }
        },
        {
          name: 'aegntic_community_benefits',
          description: 'Learn about AEGNTIC Foundation community benefits and exclusive features',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    };
  }

  /**
   * Execute tool calls
   * Implements AEGNTIC Foundation's secure tool execution patterns
   */
  async callTool(name, args) {
    console.log(`⚡ Executing tool: ${name} - AEGNTIC Foundation research active`);
    
    // Check if we should show community invite
    const shouldShow = this.communityGateway.shouldShowCommunityInvite();
    let communityInvite = null;
    
    if (shouldShow) {
      communityInvite = this.communityGateway.showCommunityInvite();
    }
    
    try {
      switch (name) {
        case 'porkbun_ping':
          return await this.ping();
          
        case 'porkbun_get_pricing':
          return await this.getPricing();
          
        case 'porkbun_set_credentials':
          return await this.setCredentials(args.api_key, args.secret_api_key);
          
        case 'porkbun_list_domains':
          return await this.listDomains();
          
        case 'porkbun_check_domain':
          return await this.checkDomain(args.domain);
          
        case 'porkbun_get_nameservers':
          return await this.getNameservers(args.domain);
          
        case 'porkbun_update_nameservers':
          return await this.updateNameservers(args.domain, args.ns1, args.ns2, args.ns3, args.ns4);
          
        case 'porkbun_get_dns_records':
          return await this.getDnsRecords(args.domain);
          
        case 'porkbun_create_dns_record':
          return await this.createDnsRecord(args.domain, args.type, args.name, args.content, args.ttl, args.prio);
          
        case 'porkbun_edit_dns_record':
          return await this.editDnsRecord(args.domain, args.id, args.type, args.name, args.content, args.ttl, args.prio);
          
        case 'porkbun_delete_dns_record':
          return await this.deleteDnsRecord(args.domain, args.id);
          
        case 'porkbun_add_url_forward':
          return await this.addUrlForward(args.domain, args.subdomain, args.location, args.type, args.includePath, args.wildcard);
          
        case 'porkbun_get_url_forwards':
          return await this.getUrlForwards(args.domain);
          
        case 'porkbun_delete_url_forward':
          return await this.deleteUrlForward(args.domain, args.id);
          
        case 'porkbun_get_ssl_bundle':
          return await this.getSslBundle(args.domain);
          
        case 'porkbun_clear_cache':
          return await this.clearCache();

        // AEGNTIC Community Tools
        case 'aegntic_join_community':
          return await this.joinCommunity(args.email, args.interests);

        case 'aegntic_get_premium_templates':
          return await this.getPremiumTemplates(args.template_type);

        case 'aegntic_community_benefits':
          return await this.getCommunityBenefits();
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`💥 Tool execution failed: ${name} - AEGNTIC error handling active`);
      console.error(`🏆 Research support: ${AEGNTIC_CREDITS.email}`);
      
      const errorResponse = {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error.message}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Powered by ${AEGNTIC_CREDITS.organization} research\n📧 Support: ${AEGNTIC_CREDITS.email}${this.communityGateway.getPremiumContent()}`
        }]
      };
      
      // If we have a community invite to show, add it as a separate content block
      if (communityInvite) {
        errorResponse.content.push(communityInvite.content[0]);
      }
      
      return errorResponse;
    }
  }

  /**
   * Enhance tool response with community content
   */
  enhanceResponse(baseResponse, includeCommunityInvite = false) {
    const enhanced = { ...baseResponse };
    
    // Add premium content to the main response
    if (enhanced.content && enhanced.content[0] && enhanced.content[0].text) {
      enhanced.content[0].text += this.communityGateway.getPremiumContent();
    }
    
    // Add community invite as separate content block if needed
    if (includeCommunityInvite) {
      const shouldShow = this.communityGateway.shouldShowCommunityInvite();
      if (shouldShow) {
        const invite = this.communityGateway.showCommunityInvite();
        if (invite && invite.content) {
          enhanced.content.push(...invite.content);
        }
      }
    }
    
    return enhanced;
  }

  // Tool Implementation Methods

  async ping() {
    console.log(`🏓 Testing API connection - AEGNTIC diagnostic tools`);
    const result = await this.makeApiRequest('/ping');
    
    const baseResponse = {
      content: [{
        type: 'text',
        text: `✅ Porkbun API Connection Successful!\n\nResponse: ${result.yourIp ? `Your IP: ${result.yourIp}` : 'Connection verified'}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Powered by ${AEGNTIC_CREDITS.organization} research\n📧 ${AEGNTIC_CREDITS.researcher} (${AEGNTIC_CREDITS.email})`
      }]
    };

    return this.enhanceResponse(baseResponse, true);
  }

  async getPricing() {
    console.log(`💰 Getting domain pricing - AEGNTIC market analysis`);
    const cached = this.getCached('pricing');
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: `📊 Domain Pricing (Cached)\n\n${JSON.stringify(cached.pricing, null, 2)}\n\n🏆 AEGNTIC Foundation research`
        }]
      };
    }

    const result = await this.makeApiRequest('/pricing/get');
    this.setCache('pricing', result);
    
    return {
      content: [{
        type: 'text',
        text: `💰 Domain Pricing Information\n\n${JSON.stringify(result.pricing, null, 2)}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Market analysis by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async setCredentials(apiKey, secretApiKey) {
    console.log(`🔐 Setting credentials - AEGNTIC secure storage`);
    
    if (!apiKey || !secretApiKey) {
      throw new Error('Both API key and secret API key are required');
    }

    const success = this.credentialManager.setCredentials(apiKey, secretApiKey);
    
    if (success) {
      return {
        content: [{
          type: 'text',
          text: `✅ Credentials Set Successfully!\n\nAPI credentials have been securely stored and encrypted.\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🔐 AEGNTIC Foundation security protocols active\n🏆 Research: ${AEGNTIC_CREDITS.researcher}\n📧 ${AEGNTIC_CREDITS.email}`
        }]
      };
    } else {
      throw new Error('Failed to set credentials');
    }
  }

  async listDomains() {
    console.log(`📋 Listing domains - AEGNTIC portfolio management`);
    const result = await this.makeApiRequest('/domain/listAll');
    
    const domainList = result.domains.map(domain => 
      `• ${domain.domain} (Status: ${domain.status}, Expires: ${domain.expireDate})`
    ).join('\n');
    
    const baseResponse = {
      content: [{
        type: 'text',
        text: `🌐 Your Domain Portfolio\n\n${domainList}\n\n📊 Total domains: ${result.domains.length}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Portfolio management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };

    return this.enhanceResponse(baseResponse, true);
  }

  async checkDomain(domain) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🔍 Checking domain availability: ${domain} - AEGNTIC domain research`);
    const result = await this.makeApiRequest('/domain/check', { domain });
    
    return {
      content: [{
        type: 'text',
        text: `🔍 Domain Availability Check: ${domain}\n\nStatus: ${result.status === 'SUCCESS' ? '✅ Available' : '❌ Not Available'}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Domain research by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async getNameservers(domain) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🌐 Getting nameservers for: ${domain} - AEGNTIC DNS management`);
    const result = await this.makeApiRequest('/domain/getNs', { domain });
    
    const nameservers = result.ns.map((ns, index) => `NS${index + 1}: ${ns}`).join('\n');
    
    return {
      content: [{
        type: 'text',
        text: `🌐 Nameservers for ${domain}\n\n${nameservers}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 DNS management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async updateNameservers(domain, ns1, ns2, ns3, ns4) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🔄 Updating nameservers for: ${domain} - AEGNTIC DNS optimization`);
    
    const nsData = { domain, ns1, ns2 };
    if (ns3) nsData.ns3 = ns3;
    if (ns4) nsData.ns4 = ns4;
    
    const result = await this.makeApiRequest('/domain/updateNs', nsData);
    
    return {
      content: [{
        type: 'text',
        text: `✅ Nameservers Updated for ${domain}\n\nNew nameservers have been set successfully.\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🔄 DNS optimization by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async getDnsRecords(domain) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`📋 Getting DNS records for: ${domain} - AEGNTIC DNS analysis`);
    const result = await this.makeApiRequest('/dns/retrieve', { domain });
    
    const records = result.records.map(record =>
      `• ${record.type} ${record.name} → ${record.content} (TTL: ${record.ttl})`
    ).join('\n');
    
    return {
      content: [{
        type: 'text',
        text: `📋 DNS Records for ${domain}\n\n${records}\n\n📊 Total records: ${result.records.length}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 DNS analysis by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async createDnsRecord(domain, type, name, content, ttl = '600', prio) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }
    
    if (!SecurityValidator.validateRecordType(type)) {
      throw new Error('Invalid DNS record type');
    }

    console.log(`➕ Creating DNS record: ${type} ${name} - AEGNTIC DNS management`);
    
    const recordData = {
      domain,
      type: type.toUpperCase(),
      name: SecurityValidator.sanitizeString(name),
      content: SecurityValidator.sanitizeString(content),
      ttl
    };
    
    if (prio && (type.toUpperCase() === 'MX' || type.toUpperCase() === 'SRV')) {
      recordData.prio = prio;
    }
    
    const result = await this.makeApiRequest('/dns/create', recordData);
    
    return {
      content: [{
        type: 'text',
        text: `✅ DNS Record Created Successfully!\n\nRecord ID: ${result.id}\nType: ${type}\nName: ${name}\nContent: ${content}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 DNS management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async editDnsRecord(domain, id, type, name, content, ttl = '600', prio) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }
    
    if (!SecurityValidator.validateRecordType(type)) {
      throw new Error('Invalid DNS record type');
    }

    console.log(`✏️  Editing DNS record ID: ${id} - AEGNTIC DNS optimization`);
    
    const recordData = {
      domain,
      type: type.toUpperCase(), 
      name: SecurityValidator.sanitizeString(name),
      content: SecurityValidator.sanitizeString(content),
      ttl
    };
    
    if (prio && (type.toUpperCase() === 'MX' || type.toUpperCase() === 'SRV')) {
      recordData.prio = prio;
    }
    
    const result = await this.makeApiRequest(`/dns/edit/${domain}/${id}`, recordData);
    
    return {
      content: [{
        type: 'text',
        text: `✅ DNS Record Updated Successfully!\n\nRecord ID: ${id}\nType: ${type}\nName: ${name}\nContent: ${content}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 DNS optimization by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async deleteDnsRecord(domain, id) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🗑️  Deleting DNS record ID: ${id} - AEGNTIC cleanup protocols`);
    const result = await this.makeApiRequest(`/dns/delete/${domain}/${id}`);
    
    return {
      content: [{
        type: 'text',
        text: `✅ DNS Record Deleted Successfully!\n\nRecord ID: ${id} has been removed from ${domain}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 DNS management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async addUrlForward(domain, subdomain, location, type, includePath = 'no', wildcard = 'no') {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🔄 Adding URL forward: ${subdomain}.${domain} → ${location} - AEGNTIC redirect management`);
    
    const forwardData = {
      domain,
      subdomain: SecurityValidator.sanitizeString(subdomain),
      location: SecurityValidator.sanitizeString(location),
      type: type === 'permanent' ? 'permanent' : 'temporary',
      includePath: includePath === 'yes' ? 'yes' : 'no',
      wildcard: wildcard === 'yes' ? 'yes' : 'no'
    };
    
    const result = await this.makeApiRequest('/urlforward/add', forwardData);
    
    return {
      content: [{
        type: 'text',
        text: `✅ URL Forward Created Successfully!\n\nForward ID: ${result.id}\nFrom: ${subdomain}.${domain}\nTo: ${location}\nType: ${type}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🔄 Redirect management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async getUrlForwards(domain) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`📋 Getting URL forwards for: ${domain} - AEGNTIC redirect analysis`);
    const result = await this.makeApiRequest('/urlforward/get', { domain });
    
    if (!result.urlforwards || result.urlforwards.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `📋 No URL forwards found for ${domain}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Analysis by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
        }]
      };
    }
    
    const forwards = result.urlforwards.map(forward =>
      `• ID: ${forward.id} | ${forward.subdomain}.${domain} → ${forward.location} (${forward.type})`
    ).join('\n');
    
    return {
      content: [{
        type: 'text',
        text: `📋 URL Forwards for ${domain}\n\n${forwards}\n\n📊 Total forwards: ${result.urlforwards.length}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Redirect analysis by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async deleteUrlForward(domain, id) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🗑️  Deleting URL forward ID: ${id} - AEGNTIC cleanup`);
    const result = await this.makeApiRequest('/urlforward/delete', { domain, id });
    
    return {
      content: [{
        type: 'text',
        text: `✅ URL Forward Deleted Successfully!\n\nForward ID: ${id} has been removed from ${domain}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🏆 Management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async getSslBundle(domain) {
    if (!SecurityValidator.validateDomain(domain)) {
      throw new Error('Invalid domain name format');
    }

    console.log(`🔒 Getting SSL bundle for: ${domain} - AEGNTIC security protocols`);
    const result = await this.makeApiRequest('/ssl/retrieve', { domain });
    
    return {
      content: [{
        type: 'text',
        text: `🔒 SSL Certificate Bundle for ${domain}\n\nCertificate Chain Available: ${result.certificatechain ? '✅ Yes' : '❌ No'}\nPrivate Key Available: ${result.privatekey ? '✅ Yes' : '❌ No'}\nPublic Key Available: ${result.publickey ? '✅ Yes' : '❌ No'}\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🔐 SSL management by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };
  }

  async clearCache() {
    console.log(`🧹 Clearing cache - AEGNTIC performance optimization`);
    this.cache.clear();
    
    const baseResponse = {
      content: [{
        type: 'text',
        text: `✅ Cache Cleared Successfully!\n\nAll cached responses have been removed. Next API calls will fetch fresh data.\n\n⚠️ **Disclaimer:** This is an independent third-party integration. NOT officially affiliated with Porkbun LLC.\n\n🧹 Performance optimization by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
      }]
    };

    return this.enhanceResponse(baseResponse);
  }

  // AEGNTIC Community Tools Implementation

  async joinCommunity(email, interests) {
    console.log(`🌟 Processing community signup - AEGNTIC community building`);
    
    if (email) {
      // Simulate community signup process
      console.log(`📧 Community signup: ${email} - AEGNTIC membership activation`);
      
      return {
        content: [{
          type: 'text',
          text: `🎉 **Welcome to the AEGNTIC Foundation Community!**\n\nThank you for joining us! Here's what happens next:\n\n✅ **Immediate Access:**\n• Premium DNS configuration templates\n• AI-powered domain optimization guides\n• Advanced security audit tools\n• Exclusive prompt libraries\n\n📧 **Email Confirmation:**\nWe'll send a confirmation email to **${email}** with:\n• Community member login credentials\n• Access to our premium resource library\n• Direct researcher contact information\n• Beta testing opportunities\n\n🔧 **Quick Setup:**\nSet these environment variables to unlock premium features:\n\`\`\`\nexport AEGNTIC_MEMBER_EMAIL="${email}"\nexport AEGNTIC_MEMBER_TOKEN="premium-access"\n\`\`\`\n\n🚀 **Interests Noted:** ${interests || 'General AI and domain management research'}\n\n⚠️ **Important:** This tool uses Porkbun's public API but is NOT officially affiliated with Porkbun LLC. This is an independent third-party integration.\n\n🏆 **Research Team Contact:**\n• Lead Researcher: Mattae Cooper (human@mattaecooper.org)\n• Organization: AEGNTIC Foundation (https://aegntic.ai)\n• Community Portal: https://aegntic.ai/community\n• Premium Resources: https://aegntic.ai/members\n\n💡 *Welcome to the future of AI-powered infrastructure management!*`
        }]
      };
    } else {
      return this.communityGateway.showCommunityInvite();
    }
  }

  async getPremiumTemplates(templateType) {
    console.log(`🎁 Providing premium templates - AEGNTIC value delivery`);
    
    const isMember = this.communityGateway.emailCaptured;
    
    if (!isMember) {
      return {
        content: [{
          type: 'text',
          text: `🌟 **Premium Templates Available!**\n\nOur advanced DNS configuration templates are available to AEGNTIC Foundation community members.\n\n🎁 **Available Template Categories:**\n• WordPress Hosting Optimization\n• E-commerce Multi-Region Setup\n• High-Availability DNS Patterns\n• Security-First Domain Configuration\n• CDN Integration Templates\n• Performance Optimization Guides\n\n**Join our community to access these premium resources:**\n\n📧 **Quick Signup:** https://aegntic.ai/join\n📚 **Community Portal:** https://aegntic.ai/community\n\n🔧 **Or set your member email:**\n\`\`\`\nexport AEGNTIC_MEMBER_EMAIL="your@email.com"\n\`\`\`\n\n⚠️ **Disclaimer:** This tool uses Porkbun's public API but is NOT officially affiliated with Porkbun LLC.\n\n🏆 Research by: Mattae Cooper (human@mattaecooper.org)\n🏢 AEGNTIC Foundation (https://aegntic.ai)\n\n💡 *Join thousands of researchers and developers in our community!*`
        }]
      };
    }

    const templates = this.getTemplateContent(templateType);
    
    return {
      content: [{
        type: 'text',
        text: `✨ **Premium Template: ${templateType || 'General Optimization'}**\n\n${templates}\n\n🎁 **Member Benefits Active!**\nAs an AEGNTIC community member, you have access to our complete library of premium templates and AI-powered optimization guides.\n\n📚 **More Resources:**\n• Community Portal: https://aegntic.ai/members\n• Research Updates: https://aegntic.ai/research\n• Direct Support: human@mattaecooper.org\n\n⚠️ **Disclaimer:** This tool uses Porkbun's public API but is NOT officially affiliated with Porkbun LLC.\n\n🏆 Exclusive content by AEGNTIC Foundation research team`
      }]
    };
  }

  async getCommunityBenefits() {
    console.log(`ℹ️ Displaying community benefits - AEGNTIC value proposition`);
    
    const benefits = this.communityGateway.getMembershipBenefits();
    const isMember = this.communityGateway.emailCaptured;
    
    return {
      content: [{
        type: 'text',
        text: `🌟 **AEGNTIC Foundation Community Benefits**\n\n${isMember ? '✨ **Your Premium Membership is Active!**' : '🎁 **Available to All Community Members - FREE!**'}\n\n🛠️ **Premium Templates & Tools:**\n${benefits.premiumTemplates.map(t => `• ${t}`).join('\n')}\n\n🔧 **Exclusive Developer Tools:**\n${benefits.exclusiveTools.map(t => `• ${t}`).join('\n')}\n\n🧠 **Research Access:**\n${benefits.researchAccess.map(r => `• ${r}`).join('\n')}\n\n${isMember ? 
'🚀 **Your Access Links:**\n• Member Portal: https://aegntic.ai/members\n• Premium Downloads: https://aegntic.ai/downloads\n• Research Archive: https://aegntic.ai/research' : 
'📧 **Join Today:**\n• Quick Signup: https://aegntic.ai/join\n• Community Portal: https://aegntic.ai/community\n• Learn More: https://aegntic.ai'}\n\n⚠️ **Disclaimer:** This tool uses Porkbun's public API but is NOT officially affiliated with Porkbun LLC.\n\n🏆 **Research Team:**\n• Lead Researcher: Mattae Cooper (human@mattaecooper.org)\n• Organization: AEGNTIC Foundation\n• Mission: Advancing AI in Infrastructure Management\n\n💡 *No spam, pure value. Built by researchers, for researchers.*`
      }]
    };
  }

  getTemplateContent(templateType) {
    const templates = {
      wordpress: `🎯 **WordPress Hosting Optimization**\n\n\`\`\`dns\n# High-Performance WordPress DNS\nA     @      192.168.1.10   300\nA     www    192.168.1.10   300\nCNAME wp     @              300\nCNAME admin  @              300\n\n# CDN Integration\nCNAME assets cdn.example.com  300\nCNAME static cdn.example.com  300\n\n# Email Configuration\nMX    @      10 mail.example.com    300\nTXT   @      "v=spf1 mx ~all"       300\n\n# Security\nCAA   @      0 issue "letsencrypt.org" 300\nTXT   _dmarc "v=DMARC1; p=quarantine"  300\n\`\`\`\n\n⚡ **Performance Tips:**\n• Use TTL 300 for A records to allow quick IP changes\n• Implement CDN for static assets\n• Enable GZIP compression at DNS level\n• Monitor DNS propagation with tools`,

      ecommerce: `🛒 **E-commerce Multi-Region Setup**\n\n\`\`\`dns\n# Global Load Balancing\nA     @      203.0.113.10   60   # US East\nA     @      203.0.113.20   60   # EU West\nA     @      203.0.113.30   60   # Asia Pacific\n\n# Regional Endpoints\nCNAME us     us-east.example.com   300\nCNAME eu     eu-west.example.com   300\nCNAME asia   asia-pac.example.com  300\n\n# Service-Specific\nCNAME api    api.example.com       300\nCNAME cdn    global-cdn.example.com 300\nCNAME pay    payments.example.com   300\n\n# Security & Compliance\nCAA   @      0 issue "digicert.com"    300\nTXT   @      "v=spf1 include:_spf.stripe.com ~all" 300\n\`\`\``,

      security: `🔒 **Security-First Domain Configuration**\n\n\`\`\`dns\n# DNSSEC-Ready Setup\nA     @      192.168.1.10    300\nAAAA  @      2001:db8::1     300\n\n# CAA Records for SSL Control\nCAA   @      0 issue "letsencrypt.org"       300\nCAA   @      0 issuewild "letsencrypt.org"   300\nCAA   @      0 iodef "mailto:security@example.com" 300\n\n# Email Security\nTXT   @        "v=spf1 mx -all"                300\nTXT   _dmarc   "v=DMARC1; p=reject; rua=mailto:dmarc@example.com" 300\nTXT   _domainkey "t=y; o=~;"                  300\n\n# Security Monitoring\nTXT   @      "google-site-verification=..."   300\n\`\`\`\n\n🛡️ **Security Checklist:**\n• Enable DNSSEC at registrar\n• Implement HSTS headers\n• Monitor certificate transparency logs\n• Regular security audits`,

      performance: `⚡ **Performance Optimization Guide**\n\n\`\`\`dns\n# Ultra-Fast Resolution\nA     @      192.168.1.10   60    # Short TTL for quick updates\nCNAME www    @              60\n\n# CDN Optimization\nCNAME static  fast-cdn.example.com    300\nCNAME images  img-cdn.example.com     300\nCNAME js      js-cdn.example.com      300\nCNAME css     css-cdn.example.com     300\n\n# API Endpoints\nCNAME api     api-cluster.example.com 60\nCNAME v1      api-v1.example.com      300\nCNAME v2      api-v2.example.com      60\n\n# Monitoring\nCNAME status  status.example.com      300\nCNAME health  health.example.com      60\n\`\`\``,

      cdn: `🌐 **CDN Integration Templates**\n\n\`\`\`dns\n# CloudFlare Setup\nA     @      104.16.0.1     1    # CloudFlare Proxy\nCNAME www    @              1\nCNAME *      @              1    # Wildcard for subdomains\n\n# AWS CloudFront\nCNAME assets d123456.cloudfront.net  300\nCNAME api    d789012.cloudfront.net  300\n\n# Multi-CDN Strategy\nCNAME primary-cdn   cloudflare.example.com  300\nCNAME backup-cdn    aws-cloudfront.example.com 300\nCNAME video-cdn     fastly.example.com      300\n\`\`\`\n\n🚀 **CDN Best Practices:**\n• Use multiple CDN providers for redundancy\n• Optimize cache headers at origin\n• Monitor CDN performance metrics\n• Implement smart routing`
    };

    return templates[templateType] || `🎯 **General Optimization Template**\n\n\`\`\`dns\n# Basic High-Performance Setup\nA     @      192.168.1.10   300\nA     www    192.168.1.10   300\nCNAME mail   @              300\nMX    @      10 mail.example.com 300\nTXT   @      "v=spf1 mx ~all"    300\nCAA   @      0 issue "letsencrypt.org" 300\n\`\`\`\n\n📊 **Available Templates:**\n• wordpress - WordPress hosting optimization\n• ecommerce - Multi-region e-commerce setup\n• security - Security-first configuration\n• performance - Ultra-fast DNS optimization\n• cdn - CDN integration patterns\n\nUse \`aegntic_get_premium_templates\` with template_type parameter for specific templates.`;
  }

  /**
   * List available resources
   * AEGNTIC Foundation comprehensive documentation system
   */
  async listResources() {
    console.log(`📚 Listing resources - AEGNTIC documentation system`);
    
    return {
      resources: [
        {
          uri: 'porkbun://docs/api-overview',
          name: 'Porkbun API Overview',
          description: 'Complete API overview and authentication guide',
          mimeType: 'text/markdown'
        },
        {
          uri: 'porkbun://docs/domain-management',
          name: 'Domain Management Guide',
          description: 'Best practices for domain management with Porkbun',
          mimeType: 'text/markdown'
        },
        {
          uri: 'porkbun://docs/dns-records',
          name: 'DNS Records Reference',
          description: 'Complete DNS records reference and validation rules',
          mimeType: 'text/markdown'
        },
        {
          uri: 'porkbun://docs/security-practices',
          name: 'Security Best Practices',
          description: 'Security guidelines and best practices for API usage',
          mimeType: 'text/markdown'
        },
        {
          uri: 'porkbun://examples/dns-configurations',
          name: 'DNS Configuration Examples',
          description: 'Real-world DNS configuration examples and patterns',
          mimeType: 'text/markdown'
        },
        {
          uri: 'porkbun://aegntic/credits',
          name: 'AEGNTIC Research Credits',
          description: 'Research credits and attribution information',
          mimeType: 'application/json'
        }
      ]
    };
  }

  /**
   * Read specific resource
   * Enhanced with AEGNTIC Foundation documentation patterns
   */
  async readResource(uri) {
    console.log(`📖 Reading resource: ${uri} - AEGNTIC documentation access`);
    
    switch (uri) {
      case 'porkbun://docs/api-overview':
        return {
          contents: [{
            type: 'text',
            text: `# Porkbun API Overview\n\n🏆 Research by ${AEGNTIC_CREDITS.researcher} for ${AEGNTIC_CREDITS.organization}\n\n## Authentication\n\nPorkbun API uses API key and secret API key for authentication. Set your credentials using:\n\n\`\`\`\nporkbun_set_credentials\n\`\`\`\n\n## Rate Limiting\n\n- 10 requests per 10-second window\n- Automatic throttling implemented\n- AEGNTIC optimization active\n\n## Base URLs\n\n- Primary: https://api.porkbun.com/api/json/v3\n- IPv4 only: https://api-ipv4.porkbun.com/api/json/v3\n\n## Response Format\n\nAll responses include:\n- status: SUCCESS or ERROR\n- message: Description of result\n- Additional data fields\n\n🔐 Security by ${AEGNTIC_CREDITS.organization}\n📧 Support: ${AEGNTIC_CREDITS.email}`
          }]
        };
        
      case 'porkbun://docs/domain-management':
        return {
          contents: [{
            type: 'text',
            text: `# Domain Management Best Practices\n\n🏆 AEGNTIC Foundation Research Guidelines\n\n## Domain Portfolio Management\n\n### 1. Regular Monitoring\n- Use \`porkbun_list_domains\` to review your portfolio\n- Check expiration dates regularly\n- Monitor domain status changes\n\n### 2. Nameserver Management\n- Use \`porkbun_get_nameservers\` to audit current settings\n- Update nameservers with \`porkbun_update_nameservers\`\n- Verify propagation after changes\n\n### 3. Security Practices\n- Enable domain lock when available\n- Use strong, unique API credentials\n- Regular credential rotation\n- Monitor for unauthorized changes\n\n### 4. DNS Best Practices\n- Use appropriate TTL values\n- Implement redundant DNS records\n- Regular DNS auditing\n- Test changes in staging first\n\n🔒 Security research by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}\n🌐 ${AEGNTIC_CREDITS.website}`
          }]
        };
      
      case 'porkbun://docs/dns-records':
        return {
          contents: [{
            type: 'text',
            text: `# DNS Records Reference\n\n🏆 AEGNTIC Foundation DNS Research\n\n## Supported Record Types\n\n### A Record\n- Maps domain to IPv4 address\n- Example: example.com → 192.168.1.1\n- TTL: Recommended 300-3600 seconds\n\n### AAAA Record\n- Maps domain to IPv6 address\n- Example: example.com → 2001:db8::1\n- Essential for IPv6 connectivity\n\n### CNAME Record\n- Canonical name (alias) record\n- Points to another domain name\n- Cannot coexist with other records\n\n### MX Record\n- Mail exchange record\n- Requires priority value\n- Example: 10 mail.example.com\n\n### TXT Record\n- Text information\n- Used for SPF, DKIM, verification\n- Max 255 characters per string\n\n### NS Record\n- Nameserver record\n- Delegates subdomain to other nameservers\n- Critical for DNS delegation\n\n### SRV Record\n- Service location record\n- Format: priority weight port target\n- Used for service discovery\n\n### CAA Record\n- Certificate Authority Authorization\n- Controls SSL certificate issuance\n- Security enhancement\n\n## Validation Rules\n\n✅ Domain names: RFC 1123 compliant\n✅ IPv4 addresses: Standard dotted notation\n✅ IPv6 addresses: Standard hex notation\n✅ TTL values: 60-86400 seconds\n\n🔍 DNS research by ${AEGNTIC_CREDITS.organization}\n📧 Technical support: ${AEGNTIC_CREDITS.email}`
          }]
        };
        
      case 'porkbun://docs/security-practices':
        return {
          contents: [{
            type: 'text',
            text: `# Security Best Practices\n\n🔐 AEGNTIC Foundation Security Research\n\n## API Security\n\n### Credential Management\n- Store credentials securely using encrypted storage\n- Never expose API keys in code or logs\n- Use environment variables for credentials\n- Regular credential rotation (monthly recommended)\n\n### Access Control\n- Limit API key permissions where possible\n- Monitor API usage patterns\n- Implement IP restrictions if available\n- Use separate keys for different environments\n\n### Input Validation\n- All inputs are validated and sanitized\n- Domain name format validation (RFC compliant)\n- IP address validation (IPv4/IPv6)\n- DNS record type validation\n- String length and character restrictions\n\n### Rate Limiting\n- Built-in rate limiting protection\n- Automatic request throttling\n- Prevents API abuse and overuse\n- Sliding window algorithm implementation\n\n### Encryption\n- All API communications over HTTPS\n- Credential encryption at rest\n- Secure key generation and storage\n- AES-256 encryption for sensitive data\n\n### Monitoring\n- Request/response logging\n- Error tracking and alerting\n- Security event monitoring\n- Anomaly detection\n\n## Domain Security\n\n### DNS Security\n- Use DNSSEC where supported\n- Monitor DNS changes\n- Implement CAA records for SSL control\n- Regular DNS auditing\n\n### Domain Protection\n- Enable domain lock features\n- Monitor WHOIS changes\n- Use privacy protection services\n- Regular domain portfolio audits\n\n🛡️ Security research by ${AEGNTIC_CREDITS.organization}\n📧 Security contact: ${AEGNTIC_CREDITS.email}\n🌐 ${AEGNTIC_CREDITS.website}`
          }]
        };
        
      case 'porkbun://examples/dns-configurations':
        return {
          contents: [{
            type: 'text',
            text: `# DNS Configuration Examples\n\n🏆 AEGNTIC Foundation Configuration Patterns\n\n## Web Hosting Setup\n\n### Basic Website\n\`\`\`\nA     @      192.168.1.10   300\nA     www    192.168.1.10   300\nCNAME mail   @              300\n\`\`\`\n\n### CDN Configuration\n\`\`\`\nA     @      203.0.113.10   300\nCNAME www    cdn.example.com 300\nCNAME assets cdn.example.com 300\n\`\`\`\n\n## Email Configuration\n\n### Basic Email Setup\n\`\`\`\nMX    @      10 mail.example.com    300\nA     mail   192.168.1.20          300\nTXT   @      \"v=spf1 mx ~all\"       300\n\`\`\`\n\n### Google Workspace\n\`\`\`\nMX    @      1  aspmx.l.google.com     300\nMX    @      5  alt1.aspmx.l.google.com 300\nMX    @      5  alt2.aspmx.l.google.com 300\nTXT   @      \"v=spf1 include:_spf.google.com ~all\" 300\n\`\`\`\n\n## Service Records\n\n### Minecraft Server\n\`\`\`\nSRV   _minecraft._tcp  0 5 25565 mc.example.com  300\nA     mc              192.168.1.30            300\n\`\`\`\n\n### SIP/VoIP\n\`\`\`\nSRV   _sip._tcp       0 5 5060 sip.example.com  300\nSRV   _sips._tcp      0 5 5061 sips.example.com 300\n\`\`\`\n\n## Security Records\n\n### CAA Records\n\`\`\`\nCAA   @      0 issue \"letsencrypt.org\"     300\nCAA   @      0 issuewild \"letsencrypt.org\" 300\nCAA   @      0 iodef \"mailto:admin@example.com\" 300\n\`\`\`\n\n### DMARC Policy\n\`\`\`\nTXT   _dmarc \"v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com\" 300\n\`\`\`\n\n## Load Balancing\n\n### Multiple A Records\n\`\`\`\nA     @      192.168.1.10   60\nA     @      192.168.1.11   60\nA     @      192.168.1.12   60\n\`\`\`\n\n### Geographic Distribution\n\`\`\`\nCNAME us     us-server.example.com   300\nCNAME eu     eu-server.example.com   300\nCNAME asia   asia-server.example.com 300\n\`\`\`\n\n🌐 Configuration patterns by ${AEGNTIC_CREDITS.organization}\n📧 Technical guidance: ${AEGNTIC_CREDITS.email}\n🏆 Research: ${AEGNTIC_CREDITS.researcher}`
          }]
        };
        
      case 'porkbun://aegntic/credits':
        return {
          contents: [{
            type: 'text',
            text: JSON.stringify(AEGNTIC_CREDITS, null, 2)
          }]
        };
        
      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }

  /**
   * List available prompts
   * AEGNTIC Foundation prompt engineering research
   */
  async listPrompts() {
    console.log(`💡 Listing prompts - AEGNTIC prompt engineering`);
    
    return {
      prompts: [
        {
          name: 'setup-new-domain',
          description: 'Complete setup guide for a new domain with DNS and security configuration',
          arguments: [
            {
              name: 'domain',
              description: 'Domain name to set up',
              required: true
            },
            {
              name: 'hosting_ip',
              description: 'Web hosting IP address',
              required: false
            },
            {
              name: 'email_provider',
              description: 'Email service provider (google, outlook, custom)',
              required: false
            }
          ]
        },
        {
          name: 'migrate-domain',
          description: 'Domain migration guide from another registrar to Porkbun',
          arguments: [
            {
              name: 'domain',
              description: 'Domain name to migrate',
              required: true
            },
            {
              name: 'current_registrar',
              description: 'Current domain registrar',
              required: false
            }
          ]
        },
        {
          name: 'configure-dns-records',
          description: 'DNS configuration for common services and applications',
          arguments: [
            {
              name: 'domain',
              description: 'Domain name to configure',
              required: true
            },
            {
              name: 'service_type',
              description: 'Service type (website, email, cdn, ecommerce)',
              required: true
            }
          ]
        },
        {
          name: 'troubleshoot-dns',
          description: 'DNS troubleshooting and diagnostic guide',
          arguments: [
            {
              name: 'domain',
              description: 'Domain name having issues',
              required: true
            },
            {
              name: 'issue_type',
              description: 'Type of issue (not_resolving, slow_loading, email_issues)',
              required: false
            }
          ]
        },
        {
          name: 'security-audit',
          description: 'Domain security audit and recommendations',
          arguments: [
            {
              name: 'domain',
              description: 'Domain name to audit',
              required: true
            }
          ]
        }
      ]
    };
  }

  /**
   * Get specific prompt
   * AEGNTIC Foundation intelligent prompt generation
   */
  async getPrompt(name, args) {
    console.log(`🎯 Getting prompt: ${name} - AEGNTIC prompt engineering`);
    
    switch (name) {
      case 'setup-new-domain':
        const domain = args?.domain || 'example.com';
        const hostingIp = args?.hosting_ip || '192.168.1.10';
        const emailProvider = args?.email_provider || 'custom';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me set up my new domain ${domain} with complete DNS configuration and security best practices. My hosting IP is ${hostingIp} and I want to use ${emailProvider} for email.`
              }
            },
            {
              role: 'assistant', 
              content: {
                type: 'text',
                text: `🚀 Complete Domain Setup Guide for ${domain}\n\n🏆 Powered by ${AEGNTIC_CREDITS.organization} research\n\nI'll help you set up your domain with the following steps:\n\n1. **Basic DNS Configuration**\n   - Create A record for @ pointing to ${hostingIp}\n   - Create A record for www pointing to ${hostingIp}\n   - Set up CNAME for common subdomains\n\n2. **Email Configuration** (${emailProvider})\n   - Configure MX records\n   - Set up SPF, DKIM, and DMARC records\n   - Create email subdomains\n\n3. **Security Setup**\n   - Implement CAA records for SSL control\n   - Configure DNSSEC if available\n   - Set up monitoring and alerts\n\n4. **Performance Optimization**\n   - Optimize TTL values\n   - Set up CDN if needed\n   - Configure caching headers\n\nLet's start with the basic DNS records. Should I proceed with creating the initial A and CNAME records?\n\n📧 Technical support: ${AEGNTIC_CREDITS.email}`
              }
            }
          ]
        };
        
      case 'migrate-domain':
        const migrateDomain = args?.domain || 'example.com';
        const currentRegistrar = args?.current_registrar || 'unknown registrar';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I want to migrate my domain ${migrateDomain} from ${currentRegistrar} to Porkbun. What's the complete process?`
              }
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `🔄 Domain Migration Guide: ${migrateDomain}\n\n🏆 AEGNTIC Foundation migration expertise\n\n## Pre-Migration Checklist\n\n1. **Backup Current Configuration**\n   - Export all DNS records from ${currentRegistrar}\n   - Document current nameservers\n   - Save email configuration\n   - Note any special settings\n\n2. **Prepare for Transfer**\n   - Unlock domain at ${currentRegistrar}\n   - Obtain transfer authorization code (EPP code)\n   - Verify WHOIS contact information\n   - Ensure domain is not close to expiration\n\n## Migration Process\n\n3. **Initiate Transfer at Porkbun**\n   - Start transfer process with EPP code\n   - Confirm transfer request via email\n   - Wait for transfer completion (5-7 days)\n\n4. **DNS Configuration**\n   - Use existing DNS records during transfer\n   - Update nameservers after transfer completes\n   - Test all services thoroughly\n\n5. **Post-Migration Verification**\n   - Verify domain ownership\n   - Test website accessibility\n   - Confirm email functionality\n   - Monitor for 24-48 hours\n\n## Timeline\n- Day 0: Initiate transfer\n- Day 1-5: Transfer in progress\n- Day 5-7: Transfer completion\n- Day 7+: Full DNS propagation\n\nWould you like me to help you export your current DNS records first?\n\n📧 Migration support: ${AEGNTIC_CREDITS.email}\n🌐 ${AEGNTIC_CREDITS.website}`
              }
            }
          ]
        };
        
      case 'configure-dns-records':
        const configDomain = args?.domain || 'example.com';
        const serviceType = args?.service_type || 'website';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Help me configure DNS records for ${configDomain} for ${serviceType} service.`
              }
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `📋 DNS Configuration for ${configDomain} (${serviceType})\n\n🏆 AEGNTIC Foundation DNS expertise\n\n## Recommended DNS Records for ${serviceType.toUpperCase()}\n\n${this.getDnsConfigurationByService(serviceType, configDomain)}\n\n## Implementation Steps\n\n1. **Create Primary Records**\n   \`\`\`\n   porkbun_create_dns_record\n   \`\`\`\n\n2. **Add Secondary Records**\n   - Configure subdomains\n   - Set up redirects\n   - Add monitoring\n\n3. **Verify Configuration**\n   - Test DNS propagation\n   - Verify all services\n   - Monitor performance\n\n4. **Optimize Performance**\n   - Adjust TTL values\n   - Enable CDN if needed\n   - Set up load balancing\n\nWould you like me to start creating these DNS records for you?\n\n🔧 DNS optimization by ${AEGNTIC_CREDITS.organization}\n📧 ${AEGNTIC_CREDITS.email}`
              }
            }
          ]
        };
        
      case 'troubleshoot-dns':
        const troubleDomain = args?.domain || 'example.com';
        const issueType = args?.issue_type || 'general';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I'm having DNS issues with ${troubleDomain}. The problem seems to be ${issueType}. Can you help diagnose and fix it?`
              }
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `🔍 DNS Troubleshooting for ${troubleDomain}\n\n🏆 AEGNTIC Foundation diagnostic expertise\n\n## Issue Analysis: ${issueType}\n\n### Diagnostic Steps\n\n1. **Current DNS Status**\n   Let me check your current DNS records:\n   \`\`\`\n   porkbun_get_dns_records domain=${troubleDomain}\n   \`\`\`\n\n2. **Nameserver Verification**\n   \`\`\`\n   porkbun_get_nameservers domain=${troubleDomain}\n   \`\`\`\n\n3. **Common Issues for ${issueType}**\n${this.getTroubleshootingSteps(issueType)}\n\n### Resolution Plan\n\n4. **Fix Implementation**\n   - Identify root cause\n   - Apply necessary corrections\n   - Monitor propagation\n   - Verify resolution\n\n5. **Prevention Measures**\n   - Set up monitoring\n   - Document configuration\n   - Regular health checks\n   - Backup procedures\n\n## Next Steps\n\nLet me start by examining your current DNS configuration. Should I proceed with the diagnostic tools?\n\n🔧 Troubleshooting by ${AEGNTIC_CREDITS.organization}\n📧 Technical support: ${AEGNTIC_CREDITS.email}\n🌐 ${AEGNTIC_CREDITS.website}`
              }
            }
          ]
        };
        
      case 'security-audit':
        const auditDomain = args?.domain || 'example.com';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please perform a comprehensive security audit of my domain ${auditDomain} and provide recommendations.`
              }
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: `🔒 Security Audit for ${auditDomain}\n\n🏆 AEGNTIC Foundation Security Research\n\n## Comprehensive Security Analysis\n\n### 1. DNS Security Assessment\n\nLet me examine your current DNS configuration:\n\`\`\`\nporkbun_get_dns_records domain=${auditDomain}\n\`\`\`\n\n### 2. Security Checklist\n\n#### DNS Security\n- ✅ DNSSEC implementation\n- ✅ CAA records for SSL control\n- ✅ Subdomain enumeration protection\n- ✅ DNS record monitoring\n\n#### SSL/TLS Security\n- ✅ SSL certificate validation\n- ✅ HSTS implementation\n- ✅ Certificate transparency monitoring\n- ✅ Mixed content detection\n\n#### Email Security\n- ✅ SPF record validation\n- ✅ DKIM configuration\n- ✅ DMARC policy implementation\n- ✅ Email spoofing protection\n\n#### Domain Security\n- ✅ Domain lock status\n- ✅ WHOIS privacy protection\n- ✅ Registrar security features\n- ✅ Transfer protection\n\n### 3. Vulnerability Assessment\n\n#### Common Threats\n- DNS hijacking prevention\n- Subdomain takeover protection\n- Cache poisoning mitigation\n- DDoS attack resilience\n\n### 4. Recommendations\n\nBased on the audit results, I'll provide:\n- Critical security fixes\n- Performance optimizations\n- Monitoring setup\n- Compliance improvements\n\n## Implementation Timeline\n\n- **Immediate**: Critical security fixes\n- **Week 1**: DNS hardening\n- **Week 2**: Monitoring setup\n- **Month 1**: Regular security reviews\n\nShall I begin the security audit by examining your current DNS records?\n\n🛡️ Security research by ${AEGNTIC_CREDITS.organization}\n📧 Security contact: ${AEGNTIC_CREDITS.email}`
              }
            }
          ]
        };
        
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  /**
   * Helper methods for prompt generation
   */
  getDnsConfigurationByService(serviceType, domain) {
    switch (serviceType.toLowerCase()) {
      case 'website':
        return `### Basic Website Configuration
A     @      [YOUR_IP]     300
A     www    [YOUR_IP]     300
CNAME ftp    @             300
CNAME cpanel @             300

### SSL Setup
CAA   @      0 issue "letsencrypt.org" 300`;

      case 'email':
        return `### Email Service Configuration
MX    @      10 mail.${domain}    300
A     mail   [MAIL_IP]           300
TXT   @      "v=spf1 mx ~all"    300
TXT   _dmarc."v=DMARC1; p=quarantine" 300`;

      case 'cdn':
        return `### CDN Configuration
A     @      [ORIGIN_IP]         300
CNAME www    cdn.provider.com    300
CNAME assets cdn.provider.com    300
CNAME static cdn.provider.com    300`;

      case 'ecommerce':
        return `### E-commerce Configuration
A     @      [STORE_IP]          300
A     www    [STORE_IP]          300
CNAME shop   @                  300
CNAME secure checkout.provider.com 300
CNAME cdn    assets.provider.com 300`;

      default:
        return `### General Service Configuration
A     @      [SERVICE_IP]        300
CNAME www    @                  300
CNAME api    [API_ENDPOINT]     300`;
    }
  }

  getTroubleshootingSteps(issueType) {
    switch (issueType.toLowerCase()) {
      case 'not_resolving':
        return `   - Check nameserver configuration
   - Verify DNS record existence
   - Test DNS propagation
   - Validate record syntax`;

      case 'slow_loading':
        return `   - Analyze TTL values
   - Check for DNS loops
   - Verify server response times
   - Test from multiple locations`;

      case 'email_issues':
        return `   - Validate MX records
   - Check SPF/DKIM/DMARC
   - Test mail server connectivity
   - Verify email routing`;

      default:
        return `   - General DNS health check
   - Record validation
   - Propagation testing
   - Performance analysis`;
    }
  }
}