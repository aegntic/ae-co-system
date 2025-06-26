# Claude Code Restart Command

## Purpose
Restart Claude Code while preserving current context window and conversation state.

## Usage
```bash
/restart
```

## What it does
1. **Context Preservation**: Captures current conversation context
2. **State Saving**: Saves current working directory, open files, and session data
3. **Clean Restart**: Terminates and restarts Claude Code process
4. **Context Restoration**: Reloads preserved context in new session
5. **MCP Reconnection**: Re-establishes all MCP server connections

## Implementation
This command is implemented as a custom Claude action that:

- Saves conversation history to `.claude/context/restart-context.json`
- Captures current working state (pwd, git status, open files)
- Creates restart marker with timestamp
- Executes restart sequence
- Auto-restores context on new session start

## Context Elements Preserved
- **Conversation History**: Last 50 messages
- **Working Directory**: Current pwd and git status  
- **Todo List**: Current tasks and progress
- **File States**: Recently edited/viewed files
- **MCP Configuration**: Server states and connections
- **Session Variables**: Environment and workflow state

## Files Created
- `.claude/context/restart-context.json` - Conversation state
- `.claude/context/session-state.json` - Working environment
- `.claude/context/restart-marker.txt` - Restart timestamp

## Auto-Restoration
On Claude Code restart, if restart markers are found:
1. Detect restart scenario
2. Load preserved context
3. Restore working directory
4. Reconnect MCP servers
5. Resume conversation seamlessly

## Security
- Context files are local-only
- No sensitive data (API keys, passwords) preserved
- Files auto-expire after 24 hours
- Can be manually cleared with `/clear-context`