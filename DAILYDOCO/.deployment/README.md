# 🔒 Deployment Resources - Internal Use Only

**⚠️ CONFIDENTIAL**: This folder contains sensitive deployment scripts and configuration files. Do not share publicly.

## 📁 Directory Structure

### `/scripts/`
Production deployment and automation scripts:
- `deploy-aegntic-website.sh` - Complete website deployment with nginx, SSL, analytics
- `publish-mcp-server.sh` - npm package publication automation  
- `social-media-automation-setup.js` - Multi-platform content distribution
- `licensing-validation-system.rs` - Enterprise licensing with hardware fingerprinting

### `/docs/`
Strategy and planning documents:
- `youtube-channel-setup.md` - Comprehensive YouTube strategy and automation
- `SPRINT-7-COMPLETION-SUMMARY.md` - Sprint 7 achievements and metrics

### `/configs/`
Configuration templates and examples (to be added):
- Environment variable templates
- Service configuration files
- SSL certificate setup

## 🚨 Security Notice

These scripts contain:
- Production server configurations
- API integration patterns
- Deployment automation
- Business strategy information

**Access Level**: Core team only  
**Usage**: Internal deployment and operations  
**Version Control**: Private repository sections only

## ✅ Usage Guidelines

1. **Review scripts before execution**
2. **Test in staging environment first**
3. **Verify environment variables are set**
4. **Monitor deployment logs**
5. **Follow rollback procedures if needed**

## 🔧 Quick Deployment

```bash
# Make scripts executable
chmod +x .deployment/scripts/*.sh

# Deploy website (requires sudo)
sudo .deployment/scripts/deploy-aegntic-website.sh

# Publish MCP server to npm
.deployment/scripts/publish-mcp-server.sh

# Setup social media automation
node .deployment/scripts/social-media-automation-setup.js
```

---
**Last Updated**: January 6, 2025  
**Sprint**: 7 (aegnt-27 & Social Media Automation)  
**Status**: Production Ready