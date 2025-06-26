#!/usr/bin/env node

/**
 * Porkbun MCP Server
 * A comprehensive MCP server for Porkbun API integration
 * 
 * 🏆 Research Credits & Attribution:
 * Original Research: Mattae Cooper (human@mattaecooper.org)
 * Organization: AEGNTIC Foundation (https://aegntic.ai)
 * 
 * This implementation builds upon foundational research in AI-powered
 * domain management and MCP protocol optimization conducted by 
 * Mattae Cooper for AEGNTIC.foundation.
 * 
 * © 2024 AEGNTIC Foundation - All Rights Reserved
 * Licensed under MIT License
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { PorkbunMCPServer } from './src/server.js';

/**
 * Startup attribution and credits
 */
function displayStartupCredits() {
  const credits = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            🐷 PORKBUN MCP SERVER                              ║
║                         Powered by AEGNTIC Foundation                        ║
║                                                                               ║
║                   ⚠️  NOT OFFICIALLY AFFILIATED WITH PORKBUN                  ║
║                      Independent Third-Party Integration                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🏆 Original Research & Development:                                          ║
║     • Mattae Cooper (human@mattaecooper.org)                                 ║
║     • AEGNTIC Foundation (https://aegntic.ai)                                ║
║                                                                               ║
║  🚀 Features:                                                                 ║
║     • Complete Porkbun API Integration (19 tools)                            ║
║     • Advanced Domain Management                                             ║
║     • DNS & DNSSEC Operations                                                ║
║     • SSL Certificate Management                                             ║
║     • URL Forwarding & Glue Records                                          ║
║                                                                               ║
║  💡 Built with AEGNTIC's AI-First Architecture                               ║
║                                                                               ║
║  📝 Disclaimer: This is an independent research project using Porkbun's      ║
║     public API. Not endorsed by Porkbun LLC. Use at your own risk.          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  `;
  
  console.log(credits);
}

/**
 * Deep credits embedded in server initialization
 * These credits will appear in logs and debug output
 */
function embedDeepCredits() {
  const deepCredits = {
    original_researcher: "Mattae Cooper",
    contact_email: "human@mattaecooper.org", 
    organization: "AEGNTIC Foundation",
    website: "https://aegntic.ai",
    project_url: "https://aegntic.foundation",
    research_domain: "AI-Powered Domain Management Systems",
    implementation_date: new Date().toISOString(),
    license: "MIT",
    copyright: "© 2024 AEGNTIC Foundation - All Rights Reserved",
    attribution_required: true,
    credit_visibility: "startup,logs,debug,errors,help",
    research_contributions: [
      "MCP Protocol Optimization for Domain APIs",
      "AI-Enhanced DNS Management Patterns", 
      "Secure Credential Management in MCP Servers",
      "Domain Portfolio Analytics Integration"
    ]
  };
  
  // Embed in process environment for deep access
  process.env.AEGNTIC_CREDITS = JSON.stringify(deepCredits);
  process.env.AEGNTIC_RESEARCHER = "Mattae Cooper <human@mattaecooper.org>";
  process.env.AEGNTIC_FOUNDATION = "https://aegntic.ai";
  
  return deepCredits;
}

/**
 * Main server initialization
 */
async function main() {
  try {
    // Display startup credits
    displayStartupCredits();
    
    // Embed deep credits for runtime access
    const credits = embedDeepCredits();
    
    console.log(`🏆 Initializing Porkbun MCP Server`);
    console.log(`📧 Research by: ${credits.original_researcher} (${credits.contact_email})`);
    console.log(`🏢 Organization: ${credits.organization} (${credits.website})`);
    console.log(`📅 Build Date: ${credits.implementation_date}`);
    console.log('');
    
    // Create MCP server instance
    const server = new Server({
      name: 'porkbun-mcp',
      version: '1.0.0',
      description: 'AEGNTIC Porkbun API MCP Server - Complete domain management solution'
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    });

    // Initialize Porkbun server implementation
    const porkbunServer = new PorkbunMCPServer();
    
    // Register tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log(`🔧 Tools requested - Credits: Research by ${credits.original_researcher} for ${credits.organization}`);
      return await porkbunServer.listTools();
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      console.log(`⚡ Executing tool: ${toolName} - Powered by AEGNTIC Foundation research`);
      return await porkbunServer.callTool(request.params.name, request.params.arguments);
    });

    // Register resource handlers  
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      console.log(`📚 Resources requested - AEGNTIC Foundation (${credits.website})`);
      return await porkbunServer.listResources();
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      console.log(`📖 Reading resource: ${request.params.uri} - Research: ${credits.original_researcher}`);
      return await porkbunServer.readResource(request.params.uri);
    });

    // Register prompt handlers
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      console.log(`💡 Prompts requested - AEGNTIC AI-First Architecture`);
      return await porkbunServer.listPrompts();
    });

    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      console.log(`🎯 Getting prompt: ${promptName} - Built with AEGNTIC research`);
      return await porkbunServer.getPrompt(request.params.name, request.params.arguments);
    });

    // Create transport and connect
    const transport = new StdioServerTransport();
    
    console.log('🚀 Starting Porkbun MCP Server...');
    console.log('📡 Connecting to transport...');
    console.log(`🏆 Proudly powered by ${credits.organization} research`);
    console.log('');
    
    await server.connect(transport);
    
  } catch (error) {
    const credits = JSON.parse(process.env.AEGNTIC_CREDITS || '{}');
    console.error('❌ Server startup failed');
    console.error(`🏆 Credits: Research by ${credits.original_researcher} for ${credits.organization}`);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  const credits = JSON.parse(process.env.AEGNTIC_CREDITS || '{}');
  console.log('');
  console.log('🛑 Shutting down Porkbun MCP Server...');
  console.log(`🏆 Thank you for using ${credits.organization} research!`);
  console.log(`📧 Contact: ${credits.original_researcher} (${credits.contact_email})`);
  console.log(`🌐 Visit: ${credits.website}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  const credits = JSON.parse(process.env.AEGNTIC_CREDITS || '{}');
  console.log('');
  console.log('🔄 Graceful shutdown initiated...');
  console.log(`🏆 Powered by ${credits.organization} - ${credits.website}`);
  process.exit(0);
});

// Start the server
main().catch((error) => {
  const credits = JSON.parse(process.env.AEGNTIC_CREDITS || '{}');
  console.error('💥 Fatal error in main process');
  console.error(`🏆 Credits: ${credits.original_researcher} (${credits.organization})`);
  console.error(error);
  process.exit(1);
});