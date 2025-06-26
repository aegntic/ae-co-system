#!/usr/bin/env node

/**
 * DailyDoco Pro - Chrome Store Submission Setup
 * Handles dependencies and provides both automated and manual submission paths
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ChromeStoreSetup {
  constructor() {
    this.devConsoleUrl = 'https://chrome.google.com/webstore/devconsole/5be40483-6a7d-4c82-a5f6-7db4274e96a8/phjoklpmfkappombncehbabpdbnlaicj/edit';
    this.config = {
      extension: {
        name: "DailyDoco Pro - AI Documentation Assistant",
        summary: "AI-powered documentation platform for developers",
        description: `Transform your development workflow into professional video tutorials with AI-powered automation.

🚀 KEY FEATURES:
• 🤖 AI Test Audience - 50-100 synthetic viewers validate content pre-publication
• 🎬 Intelligent Capture - Predictive moment detection with 99%+ accuracy  
• 🎨 Human Authenticity - 95%+ authenticity score, undetectable as AI-generated
• 🧠 Personal Brand Learning - Adapts to your unique style and audience
• 🔒 Privacy-First - Local processing with enterprise-grade security

🎯 PERFECT FOR:
- Developers documenting code and features automatically
- Tech leads creating engaging technical tutorials
- Content creators building personal brand with consistent content
- Teams saving hours on video editing and post-production

DailyDoco Pro uses advanced AI models (DeepSeek R1 + Gemma 3) to analyze your development workflow and generate professional documentation videos that feel authentically human.

✨ ULTRA-TIER QUALITY:
- Sub-2x realtime processing
- 3D isometric design language
- Professional glassmorphism UI
- Enterprise-grade privacy controls`,
        category: "Developer Tools",
        language: "English (United States)"
      },
      files: {
        extensionZip: path.resolve(__dirname, 'builds/dailydoco-pro-chrome-v1.0.0-2025-05-31.zip'),
        icon128: path.resolve(__dirname, 'chrome/assets/icon-128.png'),
        icon48: path.resolve(__dirname, 'chrome/assets/icon-48.png'),
        icon32: path.resolve(__dirname, 'chrome/assets/icon-32.png'),
        icon16: path.resolve(__dirname, 'chrome/assets/icon-16.png')
      },
      store: {
        website: "https://dailydoco.pro",
        support_url: "https://dailydoco.pro/support",
        privacy_policy: "https://dailydoco.pro/privacy"
      }
    };
  }

  async setupSubmission() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           DailyDoco Pro Chrome Store Submission              ║
║              Ultra-Tier Setup & Automation                   ║
╠═══════════════════════════════════════════════════════════════╣
║ 🎯 Target: Chrome Web Store Developer Console               ║
║ 📦 Package: DailyDoco Pro v1.0.0 (Ready)                   ║
║ 🚀 Options: Automated + Manual Instructions                 ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    try {
      await this.checkDependencies();
      await this.verifyFiles();
      await this.provideBothOptions();
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      await this.provideManualInstructions();
    }
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    let puppeteerAvailable = false;
    
    try {
      require('puppeteer');
      puppeteerAvailable = true;
      console.log('✅ Puppeteer available - automation possible');
    } catch (error) {
      console.log('⚠️  Puppeteer not available - will provide manual instructions');
    }
    
    return puppeteerAvailable;
  }

  async verifyFiles() {
    console.log('📋 Verifying submission files...');
    
    const filesToCheck = Object.values(this.config.files);
    
    for (const filePath of filesToCheck) {
      try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        console.log(`✅ ${path.basename(filePath)} (${this.formatFileSize(stats.size)})`);
      } catch (error) {
        console.log(`❌ Missing: ${path.basename(filePath)}`);
        throw new Error(`Required file missing: ${filePath}`);
      }
    }
    
    console.log('✅ All required files verified');
  }

  async provideBothOptions() {
    console.log(`
🎯 CHROME WEB STORE SUBMISSION OPTIONS:

═══════════════════════════════════════════════════════════════

🤖 OPTION 1: AUTOMATED SUBMISSION (If Puppeteer available)
┌───────────────────────────────────────────────────────────┐
│ Run this command to install Puppeteer and automate:      │
│                                                           │
│ npm install puppeteer                                     │
│ node run-chrome-store-automation.js                      │
│                                                           │
│ This will automatically:                                  │
│ • Navigate to your Developer Console                     │
│ • Fill all form fields                                    │
│ • Upload extension package and icons                     │
│ • Save as draft for your review                          │
└───────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

📋 OPTION 2: MANUAL SUBMISSION (Immediate)
┌───────────────────────────────────────────────────────────┐
│ Follow these steps in your browser:                       │
└───────────────────────────────────────────────────────────┘
    `);

    await this.provideManualInstructions();
  }

  async provideManualInstructions() {
    console.log(`
🌐 STEP 1: NAVIGATE TO DEVELOPER CONSOLE
   ${this.devConsoleUrl}

📦 STEP 2: UPLOAD EXTENSION PACKAGE
   File to upload: ${this.config.files.extensionZip}
   
   1. Look for "Upload new package" or "Choose file" button
   2. Select the ZIP file above
   3. Wait for upload and processing to complete

✏️  STEP 3: FILL EXTENSION DETAILS
   
   📝 Extension Name:
   ${this.config.extension.name}
   
   📝 Summary:
   ${this.config.extension.summary}
   
   📝 Detailed Description:
   ${this.config.extension.description}
   
   📂 Category: ${this.config.extension.category}
   🌐 Language: ${this.config.extension.language}

🎨 STEP 4: UPLOAD ICONS
   
   Icon files ready for upload:
   • 128x128: ${this.config.files.icon128}
   • 48x48:  ${this.config.files.icon48}
   • 32x32:  ${this.config.files.icon32}
   • 16x16:  ${this.config.files.icon16}
   
   Upload these to their respective icon slots in the form.

🏪 STEP 5: STORE LISTING DETAILS
   
   🌐 Website: ${this.config.store.website}
   🔧 Support: ${this.config.store.support_url}
   🔒 Privacy: ${this.config.store.privacy_policy}

💾 STEP 6: SAVE & REVIEW
   
   1. Click "Save Draft" to save your progress
   2. Review all information for accuracy
   3. Add screenshots if you have demo materials
   4. When ready, click "Submit for Review"

🎉 STEP 7: SUBMISSION COMPLETE
   
   Your ultra-tier DailyDoco Pro extension is now submitted!
   Chrome Web Store review typically takes 1-3 business days.

═══════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING:
   • Ensure you're logged into aegntic@gmail.com
   • Use Chrome browser for best compatibility
   • Check that all files exist at the paths shown above
   • Contact support if you encounter upload issues

📸 Screenshot all steps for your records!
    `);

    // Create a quick reference file
    await this.createQuickReference();
  }

  async createQuickReference() {
    const quickRef = `
# DailyDoco Pro Chrome Web Store Submission - Quick Reference

## Extension Details
- **Name**: ${this.config.extension.name}
- **Summary**: ${this.config.extension.summary}
- **Category**: ${this.config.extension.category}

## Files to Upload
- **Extension Package**: ${this.config.files.extensionZip}
- **Icon 128px**: ${this.config.files.icon128}
- **Icon 48px**: ${this.config.files.icon48}
- **Icon 32px**: ${this.config.files.icon32}  
- **Icon 16px**: ${this.config.files.icon16}

## Store Listing URLs
- **Website**: ${this.config.store.website}
- **Support**: ${this.config.store.support_url}
- **Privacy Policy**: ${this.config.store.privacy_policy}

## Developer Console URL
${this.devConsoleUrl}

## Automation Command (if Puppeteer installed)
\`\`\`bash
npm install puppeteer
node run-chrome-store-automation.js
\`\`\`

Generated: ${new Date().toLocaleString()}
    `.trim();

    await fs.writeFile(
      path.join(__dirname, 'CHROME-STORE-SUBMISSION-GUIDE.md'),
      quickRef
    );

    console.log(`
📄 Quick reference guide created: CHROME-STORE-SUBMISSION-GUIDE.md
    `);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Main execution
if (require.main === module) {
  const setup = new ChromeStoreSetup();
  setup.setupSubmission().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { ChromeStoreSetup };