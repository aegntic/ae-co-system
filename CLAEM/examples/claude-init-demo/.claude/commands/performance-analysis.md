# Performance Analysis Workflows for TestProject

## Project-Specific Performance Monitoring

### Real-Time Metrics Analysis
```bash
# Monitor typescript performance
uv run --directory /home/tabs/DAILYDOCO/test-claude-init-demo python -c "
# Project-specific performance validation
import psutil, time
print(f'CPU: {psutil.cpu_percent()}%')
print(f'Memory: {psutil.virtual_memory().used / 1024 / 1024:.1f}MB')
print(f'Disk I/O: {psutil.disk_io_counters().read_bytes / 1024 / 1024:.1f}MB read')
"
```

### Performance Data Analysis
Use quick-data MCP server for performance insights:

```typescript
// Load typescript performance metrics
await mcp_quick_data_load_dataset("typescript_performance.csv", "perf");

// Analyze performance correlations
await mcp_quick_data_find_correlations("perf", ["response_time", "memory_usage", "cpu_load"]);

// Detect performance outliers
await mcp_quick_data_detect_outliers("perf", ["processing_time"], "iqr");

// Generate optimization insights
await mcp_quick_data_insight_generation_workshop("perf", "typescript optimization");
```

## Cross-Platform Performance Validation
```bash
# Run performance benchmarks for typescript
if [ -f "Cargo.toml" ]; then
  cargo bench --bench performance
elif [ -f "package.json" ]; then
  bun run benchmark
elif [ -f "pyproject.toml" ]; then
  uv run pytest --benchmark-only
fi
```

## AI Model Performance Optimization

### Multi-Model Comparison for typescript
```bash
# Compare model performance for project-specific tasks
uv run --directory /home/tabs/mcp-servers/just-prompt just-prompt \
  --models "deepseek:r1.1,claude-4-sonnet,gemini-2.5-pro" \
  --prompt "Analyze typescript architecture for optimization opportunities"
```

### Cost-Performance Optimization
- Use **DeepSeek R1.1** for 80% of routine analysis (95% cost savings)
- Reserve **Claude 4 Opus** for critical architecture decisions
- Use **Gemma 3 locally** for privacy-critical operations
- **Gemini 2.5 Pro** for multimodal typescript analysis

## Performance Validation Gates
Before any release for typescript:
1. ✅ Performance benchmarks meet or exceed baseline
2. ✅ Memory usage within project-specific limits
3. ✅ Response times under acceptable thresholds  
4. ✅ Cross-platform compatibility verified
5. ✅ Resource efficiency optimized