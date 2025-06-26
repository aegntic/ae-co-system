# Reusable Prompt Templates

This directory contains validated prompt templates for common development tasks, optimized for the ae-co-system's AI-enhanced development workflows.

## Purpose

The `prompts/` folder stores reusable, tested prompt templates that enable consistent and efficient AI-assisted development across sessions.

## Structure

### Core Prompt Categories

#### Development Prompts (`development/`)
- Code generation and refactoring prompts
- Architecture design and analysis prompts
- Debugging and troubleshooting prompts
- Performance optimization prompts

#### Testing Prompts (`testing/`)
- Unit test generation prompts
- Integration test planning prompts
- Test case design prompts
- Quality assurance prompts

#### Documentation Prompts (`documentation/`)
- API documentation generation prompts
- Code documentation prompts
- Technical writing assistance prompts
- README and guide creation prompts

#### Analysis Prompts (`analysis/`)
- Code review and analysis prompts
- Security assessment prompts
- Performance analysis prompts
- Architecture evaluation prompts

#### MCP Integration Prompts (`mcp/`)
- MCP server orchestration prompts
- Multi-model decision making prompts
- Data pipeline automation prompts
- Cross-service integration prompts

## Prompt Templates

### Code Generation Template
```markdown
# Code Generation: [Purpose]

## Context
Project: ae-startup
Technology Stack: [Python/TypeScript/Rust]
Framework: [Specific framework if applicable]
Requirements: [Specific requirements]

## Prompt
Generate [specific code component] that:
- Follows ae-co-system quality standards
- Implements [specific functionality]
- Includes proper error handling
- Has comprehensive type annotations
- Includes performance optimizations
- Follows security best practices

## Expected Output Format
```[language]
[Code structure expectation]
```

## Quality Criteria
- [ ] Follows project coding standards
- [ ] Includes proper documentation
- [ ] Has error handling
- [ ] Includes type annotations
- [ ] Performance optimized
- [ ] Security considerations addressed

## Usage Example
[How to use this prompt effectively]
```

### Architecture Analysis Template
```markdown
# Architecture Analysis: [Component Name]

## Context
System: ae-startup
Scale: [Expected scale]
Performance Requirements: [Specific requirements]
Security Requirements: [Specific requirements]

## Analysis Request
Analyze the proposed architecture for [component] considering:
- Scalability: Can it handle [specific scale]?
- Performance: Will it meet [specific performance requirements]?
- Security: Does it address [specific security concerns]?
- Maintainability: Is it easy to modify and extend?
- Integration: How well does it integrate with existing systems?

## Current Architecture
[Description or diagram of current architecture]

## Constraints
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

## Expected Analysis Format
### Strengths
- [Analysis of strengths]

### Weaknesses
- [Analysis of weaknesses]

### Recommendations
- [Specific recommendations]

### Alternative Approaches
- [Alternative solutions]

## Decision Criteria
[How to evaluate the recommendations]
```

### Testing Strategy Template
```markdown
# Testing Strategy: [Feature/Component]

## Context
Component: [Name]
Complexity: [High/Medium/Low]
Risk Level: [High/Medium/Low]
Dependencies: [List of dependencies]

## Testing Requirements
Generate a comprehensive testing strategy that includes:
- Unit tests for core functionality
- Integration tests for external dependencies
- Performance tests for critical paths
- Security tests for vulnerabilities
- Edge case coverage
- Error condition handling

## Test Categories
### Unit Tests
- [Specific unit test requirements]

### Integration Tests
- [Specific integration test requirements]

### Performance Tests
- [Specific performance test requirements]

### Security Tests
- [Specific security test requirements]

## Expected Deliverables
- Test plan document
- Test case specifications
- Automated test implementations
- Performance benchmarks
- Security validation procedures

## Quality Gates
- [ ] Test coverage > 90%
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Integration tests pass
- [ ] All edge cases covered
```

### MCP Orchestration Template
```markdown
# MCP Multi-Model Orchestration: [Task]

## Context
Task: [Specific task description]
Models Available: deepseek:r1.1, claude-4-sonnet, gemini-2.5-pro
CEO Model: claude-4-opus
Decision Type: [Architecture/Implementation/Analysis]

## Orchestration Strategy
Use the CEO-and-board pattern to:
- Leverage multiple model perspectives
- Ensure comprehensive analysis
- Reach consensus on complex decisions
- Validate solutions across different reasoning approaches

## MCP Commands
```bash
# Multi-model decision making
mcp_just_prompt_ceo_and_board({
  file: "[task-description].md",
  models: ["deepseek:r1.1", "claude-4-sonnet", "gemini-2.5-pro"],
  ceo_model: "claude-4-opus",
  context: "[Specific context]"
})

# Parallel analysis
const [analysis, insights, validation] = await Promise.all([
  mcp_quick_data_analyze_patterns("[data-source]"),
  mcp_sequentialthinking_analyze("[problem-statement]"),
  mcp_memory_recall_similar("[context]")
]);
```

## Expected Output
- Consensus recommendation
- Rationale from each model
- Implementation plan
- Risk assessment
- Alternative approaches

## Quality Validation
- [ ] All models contributed
- [ ] CEO model provided final decision
- [ ] Reasoning is documented
- [ ] Implementation is feasible
- [ ] Risks are identified and mitigated
```

### Performance Optimization Template
```markdown
# Performance Optimization: [Component]

## Context
Component: [Name]
Current Performance: [Baseline metrics]
Target Performance: [Target metrics]
Constraints: [Technical or business constraints]

## Optimization Request
Analyze and optimize [component] to achieve:
- Response time: < [target time]
- Memory usage: < [target memory]
- CPU utilization: < [target CPU]
- Throughput: > [target throughput]

## Analysis Areas
### Algorithmic Complexity
- [Current complexity analysis]
- [Optimization opportunities]

### Memory Management
- [Memory usage patterns]
- [Optimization strategies]

### I/O Operations
- [Database queries]
- [Network calls]
- [File operations]

### Caching Strategies
- [Current caching]
- [Proposed improvements]

## Expected Deliverables
- Performance analysis report
- Optimization implementation
- Benchmark comparisons
- Monitoring recommendations
- Rollback procedures

## Validation Criteria
- [ ] Performance targets met
- [ ] No functionality regression
- [ ] Memory usage optimized
- [ ] Scalability improved
- [ ] Monitoring in place
```

## Usage Guidelines

### Creating New Prompts
1. **Test thoroughly**: Validate prompts with real examples
2. **Be specific**: Include exact requirements and expected outputs
3. **Include context**: Provide sufficient background information
4. **Define quality criteria**: Specify what constitutes success
5. **Version control**: Track changes and improvements

### Using Existing Prompts
1. **Customize context**: Adapt the context section to your specific needs
2. **Adjust parameters**: Modify requirements and constraints as needed
3. **Validate outputs**: Ensure generated content meets quality standards
4. **Iterate**: Refine prompts based on results and feedback

### Prompt Optimization
- Analyze prompt effectiveness over time
- A/B test different prompt variations
- Collect feedback on output quality
- Update prompts based on new model capabilities
- Share successful patterns with the team

## Integration with MCP Servers

### Available MCP Integrations
- **just-prompt**: Multi-model orchestration
- **sequentialthinking**: Complex problem breakdown
- **quick-data**: Analytics and data processing
- **memory**: Persistent context management
- **aegntic-knowledge-engine**: Web research and knowledge graphs

### MCP Command Patterns
```bash
# CEO and board decision making
mcp_just_prompt_ceo_and_board()

# Sequential thinking for complex problems
mcp_sequentialthinking_analyze()

# Data analysis and insights
mcp_quick_data_analyze_distributions()

# Persistent memory management
mcp_memory_store_conversation()

# Knowledge graph queries
mcp_aegntic_knowledge_engine_query()
```

## Quality Standards

All prompts must meet ae-co-system standards:
- **Clarity**: Unambiguous instructions and expectations
- **Completeness**: All necessary context and requirements
- **Consistency**: Aligned with project coding standards
- **Measurability**: Clear success criteria and validation methods
- **Reusability**: Adaptable to similar use cases

This prompt library enables consistent, high-quality AI-assisted development while maintaining the elite-tier standards of the ae-co-system.