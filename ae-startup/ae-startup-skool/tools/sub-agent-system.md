# Sub-Agent System Architecture

## Purpose
Dedicated task handlers to maintain focus on primary objectives while handling administrative and specialized tasks efficiently.

## Available Sub-Agents

### 1. Administrative Agent
**Responsibilities:**
- Date/time corrections and timezone management
- File organization and structure maintenance  
- Repository management (git operations)
- Environment setup tasks

**Default Tools:** Edit, Write, Bash (for git/file ops)

### 2. Screenshot & Media Agent  
**Responsibilities:**
- Capture screenshots with proper annotation
- Video recording coordination
- Media file organization
- Visual asset management

**Default Tools:** Bash (for flameshot, OBS), Write (for documentation)

### 3. API & Integration Agent
**Responsibilities:**  
- API key acquisition and management
- Rate limit monitoring and compliance
- Integration testing and validation
- Service account setup

**Default Tools:** WebFetch, Bash, Edit

### 4. Development Agent
**Responsibilities:**
- Code implementation following bun/uv standards
- Package management and dependencies
- Testing and quality assurance
- Performance optimization

**Default Tools:** Edit, MultiEdit, Write, Bash

### 5. Course Content Agent
**Responsibilities:**
- Lesson plan creation
- Skool.com content formatting
- Video script generation
- Educational material organization

**Default Tools:** Write, Edit, WebFetch (for research)

## Operating Principles

1. **Bun over npm**: All JavaScript/TypeScript operations use `bun` by default
2. **uv over pip**: All Python operations use `uv` by default  
3. **Focus preservation**: Sub-agents handle distractions to maintain primary task focus
4. **Parallel execution**: Multiple sub-agents can operate simultaneously
5. **Handoff protocol**: Clear task completion reporting before returning control

## Usage Pattern
```
Primary Task: [Main objective]
↓
Sub-Agent: [Specific sub-task]
↓  
Task Completion Report
↓
Return to Primary Task
```

---

*System initialized: 2025-06-20 00:43 AEST*