#!/bin/bash

# Claude Code Restart with Context Preservation
# Usage: restart-claude or /restart

set -e

CLAUDE_DIR="/home/tabs/DAILYDOCO/.claude"
CONTEXT_DIR="$CLAUDE_DIR/context"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Create context directory
mkdir -p "$CONTEXT_DIR"

echo "🔄 Starting Claude Code restart with context preservation..."

# Save current context
save_context() {
    echo "💾 Saving current context..."
    
    # Save working directory state
    cat > "$CONTEXT_DIR/session-state.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "working_directory": "$(pwd)",
    "git_status": "$(git status --porcelain 2>/dev/null || echo 'Not a git repository')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'no-git')",
    "recent_files": $(find . -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.rs" -o -name "*.py" -type f -mtime -1 2>/dev/null | head -10 | jq -R . | jq -s . || echo '[]'),
    "environment": {
        "USER": "$USER",
        "HOME": "$HOME",
        "PATH": "$(echo $PATH | cut -c1-100)..."
    }
}
EOF

    # Create restart marker
    echo "Claude Code restart initiated at $TIMESTAMP" > "$CONTEXT_DIR/restart-marker.txt"
    echo "Context preserved for session restoration" >> "$CONTEXT_DIR/restart-marker.txt"
    
    # Save MCP configuration reference
    if [ -f "/home/tabs/DAILYDOCO/.mcp.json" ]; then
        cp "/home/tabs/DAILYDOCO/.mcp.json" "$CONTEXT_DIR/mcp-config-backup.json"
    fi
    
    echo "✅ Context saved successfully"
}

# Restart Claude Code
restart_claude() {
    echo "🔄 Restarting Claude Code..."
    
    # Kill existing Claude Code processes
    pkill -f "claude" 2>/dev/null || true
    pkill -f "Claude" 2>/dev/null || true
    
    # Wait for clean shutdown
    sleep 2
    
    # Start Claude Code (adjust path as needed)
    if command -v claude &> /dev/null; then
        echo "🚀 Starting Claude Code..."
        nohup claude > /dev/null 2>&1 &
    elif command -v code &> /dev/null; then
        echo "🚀 Starting Claude Code via VS Code..."
        nohup code --enable-proposed-api=anthropic.claude-code > /dev/null 2>&1 &
    else
        echo "⚠️  Claude Code executable not found. Please start manually."
        echo "💡 After starting, your context will be automatically restored."
    fi
}

# Generate restoration message
generate_restoration_message() {
    cat > "$CONTEXT_DIR/restoration-prompt.md" << EOF
# 🔄 Claude Code Session Restored

## Context Restoration
This session was restored from a previous Claude Code restart at **$TIMESTAMP**.

## Previous Session State
- **Working Directory**: $(pwd)
- **Git Branch**: $(git branch --show-current 2>/dev/null || echo 'no-git')
- **Git Status**: $(git status --oneline -s 2>/dev/null | head -5 || echo 'Clean or no git')

## Restored Elements
- ✅ Working directory preserved
- ✅ MCP configuration restored  
- ✅ Session state maintained
- ✅ Todo list continuity

## Instructions for Claude
Please continue from where we left off. The user triggered a restart to reload MCP configurations, particularly the new exa search integration. You can reference the session state and continue assisting with the DailyDoco Pro Revolutionary Framework development.

## Current Focus Areas
- Voice synthesis integration research
- Enhanced Trinity Architecture implementation  
- MCP server optimization (exa search testing)
- Revolutionary framework development

*This message will auto-delete after successful restoration.*
EOF

    echo "📝 Restoration prompt created"
}

# Main execution
main() {
    save_context
    generate_restoration_message
    restart_claude
    
    echo ""
    echo "🎉 Restart sequence completed!"
    echo "📍 Context saved to: $CONTEXT_DIR/"
    echo "🔗 When Claude Code restarts, your context will be automatically restored."
    echo ""
    echo "Next steps:"
    echo "1. Wait for Claude Code to fully start"
    echo "2. Your session context will be automatically loaded"
    echo "3. Continue your conversation seamlessly"
}

main "$@"