#!/usr/bin/env python3
"""
MCP Porkbun DNS Automation Script
Uses the Porkbun MCP server to set up email forwarding DNS records
"""
import json

def create_mcp_automation_commands():
    """Create MCP commands for email forwarding setup"""
    
    domains = [
        {"domain": "prompt.fail", "email": "claube@prompt.fail"},
        {"domain": "4site.pro", "email": "projects@4site.pro"},
        {"domain": "aegntic.ai", "email": "human@aegntic.ai"},
        {"domain": "ae.ltd", "email": "human@ae.ltd"},
        {"domain": "ultraplan.pro", "email": "vibe@ultraplan.pro"},
        {"domain": "aegnt27.xyz", "email": "auth@aegnt27.xyz"},
        {"domain": "dailydoco.com", "email": "docs@dailydoco.com"},
        {"domain": "credability.pro", "email": "verify@credability.pro"},
        {"domain": "mattaecooper.org", "email": "human@mattaecooper.org"},
        {"domain": "skool.food", "email": "chef@skool.food"},
        {"domain": "1minskool.com", "email": "learn@1minskool.com"}
    ]
    
    target_email = "aegntic@gmail.com"
    
    print("🚀 MCP PORKBUN EMAIL FORWARDING AUTOMATION")
    print("=" * 60)
    print(f"📧 Target Email: {target_email}")
    print(f"🌐 Domains to Configure: {len(domains)}")
    print("=" * 60)
    
    # Generate commands for Claude to execute
    commands = []
    
    for domain_config in domains:
        domain = domain_config["domain"]
        email = domain_config["email"]
        username = email.split('@')[0]
        
        print(f"\n🔧 Commands for {domain}:")
        
        # MX Records
        mx1_cmd = f'mcp__porkbun__porkbun_create_dns_record(domain="{domain}", type="MX", name="", content="mx1.forwardemail.net", prio="10")'
        mx2_cmd = f'mcp__porkbun__porkbun_create_dns_record(domain="{domain}", type="MX", name="", content="mx2.forwardemail.net", prio="20")'
        
        # TXT Record for forwarding
        txt_cmd = f'mcp__porkbun__porkbun_create_dns_record(domain="{domain}", type="TXT", name="", content="forward-email={username}:{target_email}")'
        
        commands.extend([mx1_cmd, mx2_cmd, txt_cmd])
        
        print(f"   1. {mx1_cmd}")
        print(f"   2. {mx2_cmd}")
        print(f"   3. {txt_cmd}")
    
    print(f"\n📋 Total Commands to Execute: {len(commands)}")
    print("=" * 60)
    
    # Save commands to file for reference
    with open("mcp_commands.json", "w") as f:
        json.dump({
            "target_email": target_email,
            "domains": domains,
            "commands": commands
        }, f, indent=2)
    
    print("✅ Commands saved to mcp_commands.json")
    
    return commands

if __name__ == "__main__":
    create_mcp_automation_commands()