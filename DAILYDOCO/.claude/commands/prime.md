# Claude Context Priming Commands

## Auto-Restoration Detection
When Claude Code starts, check for restart markers and auto-restore context.

## Session Continuity Instructions
```
IF restart-marker.txt EXISTS:
  1. Load session-state.json for working directory context
  2. Display restoration summary
  3. Resume previous conversation flow
  4. Maintain todo list continuity
  5. Re-establish MCP connections
  6. Clean up restoration files after 5 minutes
```

## Context Preservation Protocol
- Always maintain conversation thread continuity
- Preserve user's working context and mental model
- Resume tasks in progress without repetition
- Acknowledge restoration happened but focus forward

## Revolutionary Framework Context
This project focuses on:
- DailyDoco Pro development
- Enhanced Trinity Architecture (uv + Bun + MCP + 2025 models)  
- Voice synthesis integration research
- Privacy-first AI development patterns
- Ultrathink parallel processing methodology