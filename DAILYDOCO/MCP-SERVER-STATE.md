# MCP Server Configuration State

## 🎯 CRITICAL RULE: MCP Server Management Protocol

**MANDATORY PROCESS:** Every time a new MCP server is added or an existing one is modified, Claude Code must:

1. **Update ALL configuration files** in this exact order:
   - `/home/tabs/.config/Claude/claude_desktop_config.json` (Claude Desktop)
   - `/home/tabs/.claude/global-mcp-config.json` (Claude Code Global)
   - `/home/tabs/DAILYDOCO/.mcp.json` (Project-specific)
   - Run `claude mcp add` commands for Claude Code

2. **Update ALL automation scripts**:
   - `/home/tabs/.local/bin/mcp-setup-claude-code-complete`
   - `/home/tabs/.local/bin/mcp-init`
   - `/home/tabs/.local/bin/mcp-test-all`
   - `/home/tabs/.local/bin/mcp-status`

3. **Update this state file** with the new server details

4. **Test the configuration** with `mcp-test-all`

## 📊 Current MCP Server State (24 Servers)

### ✅ Core Servers (9 servers)
- **git**: `uvx mcp-server-git` 
- **memory**: `/usr/local/bin/mcp-server-memory`
- **sequentialthinking**: `/usr/local/bin/mcp-server-sequential-thinking`
- **puppeteer**: `/usr/local/bin/mcp-server-puppeteer`
- **fetch**: `/usr/local/bin/mcp-fetch`
- **time**: `uvx mcp-server-time`
- **docker**: `uvx mcp-server-docker`
- **crawl4ai**: `uvx crawl4ai-mcp-server`
- **sandbox**: `uvx mcp-server-shell @ git+https://github.com/emsi/mcp-server-shell`

### ✅ NPM-Based Servers (9 servers)
- **filesystem**: `npx @modelcontextprotocol/server-filesystem /home/tabs`
- **context7**: `npx @upstash/context7-mcp@latest`
- **brave-search**: `npx @modelcontextprotocol/server-brave-search`
- **github**: `npx @modelcontextprotocol/server-github`
- **notion**: `npx @notionhq/notion-mcp-server`
- **n8n**: `npx @nazcamedia/n8n-mcp-server`
- **youtube**: `npx youtube-data-mcp-server`
- **postgresql**: `npx @modelcontextprotocol/server-postgres`
- **web-search**: `npx @modelcontextprotocol/server-tavily`

### ✅ Enhanced Servers (6 servers)
- **mcp-framework**: `npx mcp-framework`
- **postman**: `uvx postman-mcp-server`
- **prompts**: `uvx mcp-server-prompts`
- **taskmaster**: `uvx mcp-server-taskmaster`
- **desktop-commander**: `npx @smithery/cli run @wonderwhy-er/desktop-commander`
- **smithery**: `npx @smithery/cli run @smithery/toolbox`

## 🔧 Configuration File Locations

### Claude Desktop Configuration
```
/home/tabs/.config/Claude/claude_desktop_config.json
```

### Claude Code Global Configuration  
```
/home/tabs/.claude/global-mcp-config.json
```

### Project-Specific Configuration
```
/home/tabs/DAILYDOCO/.mcp.json
```

## 🛠️ Management Scripts

### Setup Scripts
- `mcp-init` - Initialize all MCP servers (run after `/init`)
- `mcp-setup-claude-code-complete` - Configure all 23 servers for Claude Code
- `mcp-autofix` - Auto-repair common configuration issues

### Monitoring Scripts
- `mcp-status` - Comprehensive status check
- `mcp-test-all` - Test all servers comprehensively
- `mcp-servers` - Show management commands

## 📋 Adding New MCP Servers Protocol

When adding a new MCP server, Claude Code MUST follow this checklist:

### 1. Research Phase
- [ ] Verify the correct package name exists
- [ ] Test the server manually with `npx`, `uvx`, or direct execution
- [ ] Determine correct command format and arguments
- [ ] Check for any required environment variables

### 2. Configuration Phase
- [ ] Add to `/home/tabs/.config/Claude/claude_desktop_config.json`
- [ ] Add to `/home/tabs/.claude/global-mcp-config.json`  
- [ ] Add to `/home/tabs/DAILYDOCO/.mcp.json`
- [ ] Run `claude mcp add <name> <command> <args>`
- [ ] Update this state file with new server entry

### 3. Integration Phase
- [ ] Update `mcp-setup-claude-code-complete` script
- [ ] Update `mcp-init` script 
- [ ] Update `mcp-test-all` script
- [ ] Update `mcp-status` script if needed

### 4. Testing Phase
- [ ] Run `mcp-test-all` to verify all servers still work
- [ ] Run `claude mcp list` to verify server count increased
- [ ] Test the new server specifically
- [ ] Update total server count in documentation

### 5. Documentation Phase
- [ ] Update this MCP-SERVER-STATE.md file
- [ ] Update CLAUDE.md with any new capabilities
- [ ] Update server count in all relevant scripts
- [ ] Commit changes to git

## 🚨 Critical Warnings

1. **NEVER** remove this file or the automation scripts
2. **ALWAYS** test after making changes
3. **MAINTAIN** the exact 24-server configuration state
4. **BACKUP** configurations before major changes
5. **VERIFY** all scripts work after updates

## 📈 Version History

- **v1.0** (2025-06-01): Initial 23-server configuration established  
- **v1.1** (2025-06-01): Added smithery toolbox server (24 servers total)
- **Last Updated**: 2025-06-01 09:15:00 UTC
- **Status**: PRODUCTION READY - All 24 servers working
- **Next Server ID**: 25

## 🔄 Auto-Update Commands

For quick re-application of this configuration:
```bash
mcp-init                           # Full initialization
mcp-setup-claude-code-complete    # Claude Code setup only  
mcp-status                         # Verify current state
```