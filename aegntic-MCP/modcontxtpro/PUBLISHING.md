# Publishing Guide

## npm Publication

### Prerequisites
1. npm account with access to @aegntic scope
2. npm authentication configured locally

### Publishing Steps

#### 1. Authenticate with npm
```bash
npm login
# Or for scoped packages:
npm login --scope=@aegntic --registry=https://registry.npmjs.org/
```

#### 2. Build and Test
```bash
# From the root directory
npm install
npm run build
npm test
```

#### 3. Publish Main Package
```bash
# From aegntic-mcp-standard root
npm publish
```

#### 4. Publish CLI Package
```bash
# From packages/create-mcp
cd packages/create-mcp
npm install
npm run build
npm publish
```

### Version Management
```bash
# Bump version (choose patch, minor, or major)
npm version patch -m "Release %s - <description>"
npm version minor -m "Release %s - <description>"
npm version major -m "Release %s - <description>"

# This will:
# 1. Update package.json version
# 2. Create a git tag
# 3. Run format script
# 4. Push to git with tags
```

## GitHub Repository Setup

### 1. Create Repository
```bash
# If you have GitHub CLI
gh repo create aegntic/aegntic-MCP --public --description "The definitive framework for building production-ready MCP servers"

# Or manually create at https://github.com/new
# Repository name: aegntic-MCP
# Owner: aegntic organization
```

### 2. Initial Push
```bash
# From aegntic-mcp-standard directory
git init
git add .
git commit -m "Initial commit: aegntic-mcp-standard framework"
git branch -M main
git remote add origin https://github.com/aegntic/aegntic-MCP.git
git push -u origin main
```

### 3. Repository Structure
The repository should contain:
```
aegntic-MCP/
├── aegntic-mcp-standard/      # Main framework
│   ├── src/                   # Source code
│   ├── examples/              # Example implementations
│   ├── docs/                  # Documentation
│   ├── packages/              # Sub-packages
│   │   └── create-mcp/        # CLI tool
│   ├── package.json
│   └── README.md
├── consolidated-mcp-servers/   # Existing servers
├── remote-mcp-server-with-auth/ # Reference implementation
└── README.md                  # Repository overview
```

### 4. GitHub Actions Setup
Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: |
        cd aegntic-mcp-standard
        npm ci
        cd packages/create-mcp
        npm ci
    
    - name: Build
      run: |
        cd aegntic-mcp-standard
        npm run build
        cd packages/create-mcp
        npm run build
    
    - name: Test
      run: |
        cd aegntic-mcp-standard
        npm test
```

### 5. Release Workflow
Create `.github/workflows/release.yml`:
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
        registry-url: https://registry.npmjs.org/
    
    - name: Install and Build
      run: |
        cd aegntic-mcp-standard
        npm ci
        npm run build
        cd packages/create-mcp
        npm ci
        npm run build
    
    - name: Publish to npm
      run: |
        cd aegntic-mcp-standard
        npm publish
        cd packages/create-mcp
        npm publish
      env:
        NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Post-Publication Checklist

- [ ] Verify packages on npm:
  - https://www.npmjs.com/package/@aegntic/mcp-standard
  - https://www.npmjs.com/package/@aegntic/create-mcp
- [ ] Update GitHub repository README with badges
- [ ] Create GitHub release with changelog
- [ ] Announce on relevant channels
- [ ] Update documentation site (if applicable)

## Troubleshooting

### npm Publication Issues
- **E403**: Check npm authentication and scope permissions
- **E409**: Version already exists, bump version number
- **ENEEDAUTH**: Run `npm login` again

### GitHub Issues
- **Permission denied**: Check repository access rights
- **Branch protection**: Ensure main branch allows initial push