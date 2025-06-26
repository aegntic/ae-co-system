#!/usr/bin/env node

/**
 * AEGNTIC Foundation Community Demo
 * Shows the community engagement system in action
 */

import { PorkbunMCPServer } from './src/server.js';

console.log('🎬 AEGNTIC Foundation Community System Demo');
console.log('══════════════════════════════════════════════');
console.log('');

// Create server instance
const server = new PorkbunMCPServer();

console.log('');
console.log('🎯 Simulating First-Time User Experience...');
console.log('');

// Simulate user making tool calls
async function simulateUserExperience() {
  
  console.log('👤 User Call #1: porkbun_community_benefits');
  console.log('───────────────────────────────────────────');
  
  try {
    const result1 = await server.callTool('aegntic_community_benefits', {});
    console.log('📤 Response Preview:');
    console.log(result1.content[0].text.substring(0, 200) + '...');
    console.log('');
    
    console.log('👤 User Call #2: aegntic_get_premium_templates (non-member)');
    console.log('─────────────────────────────────────────────────────────');
    
    const result2 = await server.callTool('aegntic_get_premium_templates', { template_type: 'wordpress' });
    console.log('📤 Response Preview:');
    console.log(result2.content[0].text.substring(0, 300) + '...');
    console.log('');
    
    console.log('👤 User Call #3: aegntic_join_community');
    console.log('─────────────────────────────────────────');
    
    const result3 = await server.callTool('aegntic_join_community', { 
      email: 'demo@example.com',
      interests: 'DNS optimization, AI research' 
    });
    console.log('📤 Response Preview:');
    console.log(result3.content[0].text.substring(0, 400) + '...');
    console.log('');
    
    console.log('🌟 Simulating Member Experience...');
    console.log('');
    
    // Simulate member environment
    process.env.AEGNTIC_MEMBER_EMAIL = 'demo@example.com';
    process.env.AEGNTIC_MEMBER_TOKEN = 'premium-access';
    
    // Create new server instance as member
    const memberServer = new PorkbunMCPServer();
    console.log('');
    
    console.log('👤 Member Call: aegntic_get_premium_templates (member access)');
    console.log('──────────────────────────────────────────────────────────');
    
    const result4 = await memberServer.callTool('aegntic_get_premium_templates', { template_type: 'security' });
    console.log('📤 Member Response Preview:');
    console.log(result4.content[0].text.substring(0, 500) + '...');
    
  } catch (error) {
    console.log('⚠️  Demo Error (expected for API calls):', error.message);
  }
  
  console.log('');
  console.log('🎉 Demo Complete!');
  console.log('══════════════════════════════════════════════');
  console.log('🏆 AEGNTIC Foundation Community System');
  console.log('📧 Research by: Mattae Cooper (human@mattaecooper.org)');
  console.log('🌐 https://aegntic.ai');
}

simulateUserExperience();