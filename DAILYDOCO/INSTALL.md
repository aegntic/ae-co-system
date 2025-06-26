# 🚀 DailyDoco Pro - Installation Guide

> **Elite-tier automated documentation platform with AI test audience validation and 95%+ authenticity scores**

## 📋 Table of Contents

- [System Requirements](#-system-requirements)
- [Quick Start (5 Minutes)](#-quick-start-5-minutes)
- [Desktop Application](#-desktop-application)
- [Browser Extensions](#-browser-extensions)
- [MCP Server (Claude Integration)](#-mcp-server-claude-integration)
- [Development Setup](#-development-setup)
- [Troubleshooting](#-troubleshooting)

---

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 2GB free space
- **CPU**: Intel i5 or AMD Ryzen 5 equivalent
- **GPU**: DirectX 11 compatible (for hardware acceleration)

### Recommended for Elite Performance
- **RAM**: 32GB for AI model caching
- **CPU**: Intel i7-12700K+ or AMD Ryzen 7 5800X+
- **GPU**: NVIDIA RTX 4060+ or AMD RX 6600+ for AI acceleration
- **Storage**: NVMe SSD for optimal processing speed

---

## ⚡ Quick Start (5 Minutes)

### 1. Install Desktop App (Primary Component)

#### Windows
```powershell
# Download installer
curl -L -o DailyDocoPro.exe "https://github.com/dailydoco/releases/latest/DailyDocoPro-windows.exe"

# Run installer with admin privileges
.\DailyDocoPro.exe
```

#### macOS
```bash
# Download and install
curl -L -o DailyDocoPro.dmg "https://github.com/dailydoco/releases/latest/DailyDocoPro-macos.dmg"
open DailyDocoPro.dmg
```

#### Linux (Ubuntu/Debian)
```bash
# Download AppImage
curl -L -o DailyDocoPro.AppImage "https://github.com/dailydoco/releases/latest/DailyDocoPro-linux.AppImage"

# Make executable and run
chmod +x DailyDocoPro.AppImage
./DailyDocoPro.AppImage
```

### 2. Install Browser Extension (Optional but Recommended)

#### Chrome
1. Visit [Chrome Web Store - DailyDoco Pro](https://chrome.google.com/webstore/detail/dailydoco-pro)
2. Click **"Add to Chrome"**
3. Confirm permissions
4. Look for the 📹 icon in your toolbar

#### Firefox
1. Visit [Firefox Add-ons - DailyDoco Pro](https://addons.mozilla.org/firefox/addon/dailydoco-pro)
2. Click **"Add to Firefox"**
3. Confirm permissions
4. Pin extension to toolbar for easy access

### 3. Quick Test
1. Open DailyDoco Pro desktop app
2. Create new project: `File → New Project`
3. Start capture: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
4. Code for 30 seconds
5. Stop capture and watch AI compilation!

---

## 🖥️ Desktop Application

### Installation Methods

#### Method 1: Installer (Recommended)
Download platform-specific installer from [releases page](https://github.com/dailydoco/releases/latest).

#### Method 2: Package Managers

**Windows (Chocolatey):**
```powershell
choco install dailydoco-pro
```

**macOS (Homebrew):**
```bash
brew install --cask dailydoco-pro
```

**Linux (Snap):**
```bash
sudo snap install dailydoco-pro
```

### First Run Setup

1. **Launch Application**
   ```bash
   # Windows: Start Menu → DailyDoco Pro
   # macOS: Applications → DailyDoco Pro
   # Linux: Applications Menu → DailyDoco Pro
   ```

2. **Initial Configuration**
   - Choose AI models (DeepSeek R1 + Gemma 3 recommended)
   - Set capture quality (1080p for balance, 4K for premium)
   - Configure privacy filters
   - Set default project directory

3. **Hardware Acceleration Setup**
   ```
   Settings → Performance → Enable GPU Acceleration
   - NVIDIA: CUDA acceleration (recommended)
   - AMD: OpenCL acceleration
   - Intel: Intel Media SDK
   ```

4. **Verify Installation**
   ```
   Help → System Check → Run Diagnostics
   ✅ All systems should show green
   ⚡ Target: <2x realtime processing
   💾 Target: <200MB memory baseline
   ```

---

## 🌐 Browser Extensions

### Chrome Extension

#### Installation from Web Store
1. **Direct Install**: [Add DailyDoco Pro to Chrome](https://chrome.google.com/webstore/detail/dailydoco-pro)
2. **Enable Developer Features**: `chrome://extensions/` → Enable "Developer mode"
3. **Grant Permissions**:
   - Screen capture and recording
   - Active tab access
   - Storage for project data
   - Communication with desktop app

#### Manual Installation (Development)
```bash
# Clone repository
git clone https://github.com/dailydoco/dailydoco-pro.git
cd dailydoco-pro

# Build extension
npm install
npm run build:chrome-extension

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select: dist/chrome-extension/
```

### Firefox Extension

#### Installation from Add-ons Store
1. **Direct Install**: [Add DailyDoco Pro to Firefox](https://addons.mozilla.org/firefox/addon/dailydoco-pro)
2. **Pin to Toolbar**: Right-click extension → "Pin to Toolbar"

#### Manual Installation (Development)
```bash
# Build Firefox extension
npm run build:firefox-extension

# Temporary installation
# 1. Open about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select: dist/firefox-extension/manifest.json
```

### Extension Features

#### 📹 Intelligent Capture
- **Auto-detect coding activity**: File saves, git commits, test runs
- **Smart frame selection**: AI-powered moment detection
- **Privacy-first filtering**: Automatic sensitive content blurring

#### 🎯 One-Click Documentation
- **Instant project analysis**: Technology stack detection (99%+ accuracy)
- **AI narration generation**: Natural voice with personal branding
- **Test audience simulation**: 50-100 synthetic viewers with feedback

#### ⚡ Seamless Integration
- **Desktop app communication**: Real-time synchronization
- **Claude MCP integration**: Enhanced documentation workflows
- **Multi-platform export**: YouTube, LinkedIn, Twitter optimization

---

## 🤖 MCP Server (Claude Integration)

### Prerequisites
- **Node.js**: 18.0.0+ (LTS recommended)
- **Claude Desktop**: Latest version
- **DailyDoco Pro**: Desktop app installed

### Installation

#### Method 1: NPM Package (Recommended)
```bash
# Install globally
npm install -g @dailydoco/mcp-server

# Verify installation
dailydoco-mcp --version
```

#### Method 2: From Source
```bash
# Clone and build
git clone https://github.com/dailydoco/dailydoco-pro.git
cd dailydoco-pro/apps/mcp-server

# Install dependencies
npm install

# Build server
npm run build

# Link globally
npm link
```

### Claude Desktop Configuration

1. **Locate Claude Config File**:
   ```bash
   # Windows
   %APPDATA%\Claude\claude_desktop_config.json
   
   # macOS
   ~/Library/Application Support/Claude/claude_desktop_config.json
   
   # Linux
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add DailyDoco MCP Server**:
   ```json
   {
     "mcpServers": {
       "dailydoco-pro": {
         "command": "node",
         "args": ["/path/to/dailydoco-pro/apps/mcp-server/dist/index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Verify MCP Integration

1. **Open Claude Desktop**
2. **Start New Conversation**
3. **Test Command**:
   ```
   Can you analyze my project structure and suggest documentation opportunities?
   ```
4. **Expected Response**: Claude should detect available DailyDoco tools and offer to analyze your project

### Available MCP Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `analyze_project` | 99%+ accurate technology detection | Project fingerprinting |
| `run_test_audience` | AI audience simulation (50-100 viewers) | Content optimization |
| `start_capture` | Intelligent video capture | Real-time documentation |
| `compile_video` | AI-powered video compilation | Professional output |
| `validate_authenticity` | 95%+ human authenticity scoring | Quality assurance |

---

## 👨‍💻 Development Setup

### Prerequisites
```bash
# Required tools
node --version    # 18.0.0+
npm --version     # 8.0.0+
cargo --version   # 1.70.0+
```

### Repository Setup
```bash
# Clone repository
git clone https://github.com/dailydoco/dailydoco-pro.git
cd dailydoco-pro

# Install dependencies (all workspaces)
npm install

# Build shared libraries
npm run build:libs

# Start development servers
npm run dev
```

### Development Workflow
```bash
# Desktop app development
npm run dev:desktop        # Tauri dev server

# Browser extension development  
npm run dev:chrome         # Chrome extension with hot reload
npm run dev:firefox        # Firefox extension with hot reload

# MCP server development
npm run dev:mcp            # MCP server with auto-restart

# All components simultaneously
npm run dev:all            # Parallel development
```

### Testing
```bash
# Run all tests
npm test

# Component-specific tests
npm run test:desktop       # Rust + TypeScript tests
npm run test:extensions    # Browser extension tests
npm run test:mcp          # MCP server tests

# Performance benchmarks
npm run benchmark         # Elite performance validation
```

### Building for Production
```bash
# Build all components
npm run build

# Build specific components
npm run build:desktop     # Tauri app bundle
npm run build:chrome      # Chrome extension package
npm run build:firefox     # Firefox extension package
npm run build:mcp        # MCP server distribution

# Create distribution packages
npm run package          # All platform packages
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Desktop App Won't Start
```bash
# Check system requirements
dailydoco-pro --system-check

# Reset configuration
rm -rf ~/.config/DailyDoco  # Linux
rm -rf ~/Library/Preferences/DailyDoco  # macOS
del %APPDATA%\DailyDoco  # Windows

# Reinstall with clean state
```

#### 2. Browser Extension Not Working
```javascript
// Check permissions in DevTools console
chrome.permissions.getAll((permissions) => {
    console.log('Extension permissions:', permissions);
});

// Common fixes:
// 1. Reload extension: chrome://extensions/ → Reload
// 2. Check desktop app connection
// 3. Verify screen capture permissions
```

#### 3. MCP Server Connection Issues
```bash
# Test MCP server directly
node apps/mcp-server/dist/index.js

# Check Claude configuration
cat ~/.config/Claude/claude_desktop_config.json

# Restart Claude Desktop after config changes
```

#### 4. Performance Issues
```bash
# Check system resources
dailydoco-pro --performance-monitor

# Common optimizations:
# 1. Enable GPU acceleration
# 2. Reduce capture quality temporarily
# 3. Close unnecessary applications
# 4. Check available RAM (16GB+ recommended)
```

#### 5. AI Models Not Loading
```bash
# Check model cache
ls ~/.cache/DailyDoco/models/

# Re-download models
dailydoco-pro --reset-models

# Verify internet connection for initial download
```

### Performance Targets

| Metric | Target | Troubleshooting |
|--------|--------|-----------------|
| Processing Speed | <2x realtime | Enable GPU acceleration |
| Memory Usage | <200MB baseline | Close background apps |
| CPU Usage (idle) | <5% | Check for background processes |
| Startup Time | <3 seconds | Clear model cache if >10s |
| Authenticity Score | 95%+ | Update to latest models |

### Getting Help

#### 🔧 Self-Service
- **Documentation**: [docs.dailydoco.pro](https://docs.dailydoco.pro)
- **Performance Monitor**: Built into desktop app
- **System Diagnostics**: `Help → Run Diagnostics`

#### 💬 Community Support
- **Discord**: [discord.gg/dailydoco](https://discord.gg/dailydoco)
- **GitHub Issues**: [github.com/dailydoco/issues](https://github.com/dailydoco/dailydoco-pro/issues)
- **Reddit**: [r/DailyDoco](https://reddit.com/r/dailydoco)

#### 🎯 Premium Support
- **Priority Support**: Available with Pro subscription
- **1-on-1 Setup**: Available for Enterprise customers
- **Custom Integration**: Available for large teams

---

## 🎉 What's Next?

### Immediate Next Steps
1. **Create Your First Project**: `File → New Project`
2. **Record a Quick Demo**: Test the capture system
3. **Run AI Test Audience**: Get feedback on your content
4. **Integrate with Claude**: Set up MCP for enhanced workflows

### Advanced Features to Explore
- **Personal Brand Learning**: Adapts to your unique style
- **Multi-platform Optimization**: YouTube, LinkedIn, Twitter
- **Team Collaboration**: Share projects and insights
- **API Integration**: Connect with your existing tools

### Stay Updated
- **Newsletter**: [dailydoco.pro/newsletter](https://dailydoco.pro/newsletter)
- **Release Notes**: Automatic notifications in app
- **Feature Requests**: Vote on roadmap items

---

<div align="center">

**🚀 Ready to transform your development workflow?**

[Get Started Now](https://dailydoco.pro) | [Join Community](https://discord.gg/dailydoco) | [Enterprise Sales](mailto:enterprise@dailydoco.pro)

*DailyDoco Pro - Where AI meets elite documentation*

</div>