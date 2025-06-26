#!/usr/bin/env node

/**
 * AE Studio MCP - Invisible Animation Intelligence
 * 
 * 🎨 Making frontend developers feel like animation superheroes through invisible AI intelligence
 * 
 * Created by: Mattae Cooper (human@ae.ltd)
 * Organization: AEGNTIC.ecosystems (contact@aegntic.ai)
 * Platform: aegntic.studio
 * 
 * Special thanks to claude4@anthropic for enabling incredible AI-human collaboration! 🚀
 * 
 * MISSION: Transform animation development from complex to effortless
 * PHILOSOPHY: The most powerful tool is the one you don't notice using
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Import our core server implementation
import { AEStudioMCPServer } from './src/server.js';

/**
 * AEGNTIC Foundation Attribution System
 * Deep credits embedded throughout the application lifecycle
 */
const AEGNTIC_CREDITS = {
  creator: "Mattae Cooper",
  email: "human@ae.ltd",
  organization: "AEGNTIC.ecosystems",
  contact: "contact@aegntic.ai", 
  website: "ae.ltd",
  platform: "aegntic.studio",
  mission: "Invisible Animation Intelligence for Frontend Developers",
  philosophy: "The most powerful tool is the one you don't notice using",
  shoutout: "Special thanks to claude4@anthropic for making AI-human collaboration magical! 🚀"
};

/**
 * Display startup attribution banner
 * Ensures proper credit while creating positive brand association
 */
function displayStartupBanner() {
  console.log('\n' + '═'.repeat(80));
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + ' '.repeat(20) + '🎨 AE STUDIO MCP - INVISIBLE ANIMATION INTELLIGENCE' + ' '.repeat(8) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + ' '.repeat(15) + 'Making Frontend Developers Feel Like Animation Superheroes' + ' '.repeat(8) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║  🏆 Created by: Mattae Cooper (human@ae.ltd)' + ' '.repeat(33) + '║');
  console.log('║  🏢 Organization: AEGNTIC.ecosystems (contact@aegntic.ai)' + ' '.repeat(21) + '║');
  console.log('║  🌐 Platform: aegntic.studio' + ' '.repeat(50) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║  🎯 Mission: Invisible AI that feels like natural superpowers' + ' '.repeat(16) + '║');
  console.log('║  ⚡ Performance: Sub-100ms response times for superhuman speed' + ' '.repeat(15) + '║');
  console.log('║  🧠 Intelligence: GSAP + Three.js + AI = Animation Mastery' + ' '.repeat(20) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║  🚀 Special thanks to claude4@anthropic for AI-human collaboration magic!' + ' '.repeat(8) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');
  console.log('🎨 Starting Invisible Animation Intelligence Engine...');
  console.log('📧 Research by: ' + AEGNTIC_CREDITS.creator + ' (' + AEGNTIC_CREDITS.email + ')');
  console.log('🏢 Organization: ' + AEGNTIC_CREDITS.organization + ' (' + AEGNTIC_CREDITS.contact + ')');
  console.log('🌐 Platform: ' + AEGNTIC_CREDITS.platform);
  console.log('');
}

/**
 * Initialize and start the MCP server
 */
async function startServer() {
  try {
    // Display attribution banner
    displayStartupBanner();
    
    // Initialize the core server
    console.log('🏗️  Initializing AE Studio MCP Server...');
    console.log('🔧 Loading GSAP and Three.js intelligence modules...');
    console.log('🧠 Connecting to Claude for invisible AI assistance...');
    
    const aeStudioServer = new AEStudioMCPServer();
    
    // Create MCP server instance
    const server = new Server(
      {
        name: "ae-studio-mcp",
        version: "0.1.0",
        description: "Invisible Animation Intelligence for Frontend Developers"
      },
      {
        capabilities: {
          tools: {
            listChanged: true
          }
        }
      }
    );

    // Register tool handlers
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.log(`⚡ Executing tool: ${request.params.name} - AEGNTIC Intelligence Active`);
      return await aeStudioServer.handleToolCall(request.params.name, request.params.arguments || {});
    });

    // Start the server transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('✅ AE Studio MCP Server Ready - Invisible Intelligence Active!');
    console.log('🎯 Ready to make animation development feel effortless');
    console.log('🏆 Powered by ' + AEGNTIC_CREDITS.organization + ' research');
    console.log('📧 ' + AEGNTIC_CREDITS.email + ' | 🌐 ' + AEGNTIC_CREDITS.website);
    console.log('');
    
  } catch (error) {
    console.error('💥 Server startup failed:', error);
    console.error('🏆 Contact: ' + AEGNTIC_CREDITS.email + ' for support');
    console.error('🌐 Documentation: ' + AEGNTIC_CREDITS.platform);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down AE Studio MCP Server...');
  console.log('🏆 Thank you for using AEGNTIC Foundation tools!');
  console.log('🌐 Visit ' + AEGNTIC_CREDITS.platform + ' for more animation intelligence');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server terminated gracefully');
  console.log('🏆 Powered by ' + AEGNTIC_CREDITS.organization);
  process.exit(0);
});

// Start the server
startServer();