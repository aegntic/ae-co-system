#!/bin/bash

# Memory-Bank Bootstrap and Integration Script
# Initializes and integrates Memory-Bank with core system components

# Set up color output for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display banner
echo -e "${BLUE}┌───────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│ Memory-Bank Integration Protocol              │${NC}"
echo -e "${BLUE}│ E2E-AUTO-MICRO-APPS Orchestration System      │${NC}"
echo -e "${BLUE}└───────────────────────────────────────────────┘${NC}"
echo

# Verify dependencies are installed
echo -e "${ORANGE}Verifying dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed${NC}"
    echo "Please install Node.js before proceeding"
    exit 1
fi

# Create configuration directories if needed
echo -e "${ORANGE}Setting up directory structure...${NC}"
mkdir -p ~/E2E-AUTO-MICRO-APPS/.memory
mkdir -p ~/E2E-AUTO-MICRO-APPS/config
mkdir -p ~/E2E-AUTO-MICRO-APPS/.cursor

# Create a minimal .env file if it doesn't exist
if [ ! -f ~/E2E-AUTO-MICRO-APPS/.env ]; then
    echo -e "${ORANGE}Creating .env configuration file...${NC}"
    cat > ~/E2E-AUTO-MICRO-APPS/.env << EOL
# Memory-Bank Configuration
MEMORY_STORAGE_DIR=./.memory
MEMORY_ENABLE_VECTOR=false
MEMORY_MAX_AGE_DAYS=30

# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-haiku-20240307

# Task-Master-AI Configuration
TASKMASTER_DEFAULT_SUBTASKS=5
TASKMASTER_DEFAULT_PRIORITY=medium
EOL
    echo -e "${GREEN}Created .env configuration template${NC}"
    echo -e "${ORANGE}Please update .env with your API keys before continuing${NC}"
fi

# Create a package.json file if it doesn't exist
if [ ! -f ~/E2E-AUTO-MICRO-APPS/package.json ]; then
    echo -e "${ORANGE}Creating package.json...${NC}"
    cat > ~/E2E-AUTO-MICRO-APPS/package.json << EOL
{
  "name": "e2e-auto-micro-apps",
  "version": "1.0.0",
  "description": "End-to-End Automated Micro-App Ideation & Bootstrapping System",
  "main": "index.js",
  "scripts": {
    "bootstrap": "node bootstrap-memory.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "task-master-ai": "^1.0.0"
  }
}
EOL
    echo -e "${GREEN}Created package.json${NC}"
fi

# Install dependencies
echo -e "${ORANGE}Installing dependencies...${NC}"
cd ~/E2E-AUTO-MICRO-APPS && npm install

# Run the bootstrap script
echo -e "${ORANGE}Executing memory integration protocol...${NC}"
node ~/E2E-AUTO-MICRO-APPS/bootstrap-memory.js

# Verify installation
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Memory-Bank integration completed successfully!${NC}"
    echo -e "${BLUE}Memory system is now integrated with:${NC}"
    echo -e "  - OpenRouter for AI model access"
    echo -e "  - Task-Master-AI for task management"
    echo -e "  - Context7 for documentation injection"
    echo -e "  - n8n for workflow automation (if enabled)"
    echo
    echo -e "${ORANGE}Next steps:${NC}"
    echo -e "1. Update API keys in .env file"
    echo -e "2. Run your first idea generation: node modules/generate_ideas.js"
    echo -e "3. List stored memories: node -e \"const MemoryBank = require('./modules/memory-bank'); const mb = new MemoryBank(); mb.list('ideas').then(console.log)\""
else
    echo -e "${RED}Memory-Bank integration encountered errors.${NC}"
    echo -e "Please check the logs above for more information."
fi
