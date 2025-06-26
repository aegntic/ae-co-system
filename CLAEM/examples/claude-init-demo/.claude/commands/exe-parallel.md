# Parallel Execution Patterns

## Multi-Agent Workflow Orchestration

### CEO-and-Board Decision Making
Use multiple AI models to analyze complex decisions:

```bash
# Example: Architecture decision analysis
uv run --directory /home/tabs/mcp-servers/just-prompt just-prompt ceo-and-board \
  --prompt "architecture-decision-typescript.txt" \
  --board-models "deepseek:r1.1,claude-4-sonnet,gemini-2.5-pro" \
  --ceo-model "claude-4-opus"
```

### Trinity Architecture Workflows
1. **uv Management**: Lightning-fast Python environment orchestration
2. **MCP Orchestration**: Universal protocol-based tool composition  
3. **Parallel Development**: Multiple approaches tested simultaneously

### Concurrent Tool Execution
Always use multiple tool calls in single messages when operations are independent:

```typescript
// Example: Parallel MCP operations for typescript
await Promise.all([
  mcp_quick_data_load_dataset("project_metrics.csv", "metrics"),
  mcp_git_status("/home/tabs/DAILYDOCO/test-claude-init-demo"),
  mcp_memory_read_graph(),
  mcp_ppick_pocket_find("typescript optimization")
]);
```

### Multi-Model Analysis Patterns
1. **Code Review**: Multiple models analyze from different perspectives
2. **Architecture Decisions**: Board of experts evaluates technical choices
3. **Performance Analysis**: Parallel optimization from specialized models
4. **Quality Assurance**: Multi-perspective validation workflows

## Implementation Guidelines
- Always prefer parallel execution over sequential when possible
- Use git worktrees for experimental development
- Leverage multi-model consensus for complex decisions
- Maintain separate contexts for different approaches
- Synthesize results for optimal outcomes