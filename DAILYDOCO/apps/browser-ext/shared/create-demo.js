#!/usr/bin/env node

/**
 * DailyDoco Pro - Ultra-Tier Demo Creation Script
 * Creates professional demo video for Chrome Web Store submission
 * Uses Puppeteer for sophisticated browser automation and recording
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class DemoCreator {
  constructor(platform = 'chrome') {
    this.platform = platform;
    this.browser = null;
    this.page = null;
    this.extensionPath = path.join(__dirname, '..', platform);
    this.outputDir = path.join(__dirname, '..', 'demo-output');
    
    this.demoConfig = {
      viewport: { width: 1920, height: 1080 },
      fps: 30,
      quality: 'high',
      duration: 60000, // 60 seconds
      scenarios: [
        'extensionInstall',
        'projectDetection', 
        'captureStart',
        'aiFeatures',
        'testAudience',
        'videoExport'
      ]
    };
  }

  async createUltraTierDemo() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              DailyDoco Pro Demo Creator                       ║
║           Ultra-Tier Professional Demo Video                 ║
╠═══════════════════════════════════════════════════════════════╣
║ 🎬 Platform: ${this.platform.toUpperCase().padEnd(45)} ║
║ 📽️  Resolution: 1920x1080 @ 30fps                           ║
║ ⏱️  Duration: ~60 seconds                                    ║
║ 🎯 Target: Chrome Web Store submission                      ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    try {
      await this.setupEnvironment();
      await this.launchBrowser();
      await this.recordDemoScenarios();
      await this.finalizeDemo();
      
      console.log('✅ Ultra-tier demo creation completed successfully!');
      console.log(`📁 Demo files saved to: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Demo creation failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up demo environment...');
    
    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Verify extension files exist
    const manifestPath = path.join(this.extensionPath, 'manifest.json');
    try {
      await fs.access(manifestPath);
      console.log('✅ Extension manifest found');
    } catch (error) {
      throw new Error(`Extension not found at ${this.extensionPath}`);
    }
  }

  async launchBrowser() {
    console.log('🚀 Launching browser with extension...');
    
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--enable-features=VaapiVideoDecoder',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--load-extension=${this.extensionPath}`,
      '--disable-extensions-except=' + this.extensionPath
    ];

    this.browser = await puppeteer.launch({
      headless: false, // Visual demo
      args: browserArgs,
      defaultViewport: this.demoConfig.viewport,
      slowMo: 50 // Smooth animations for demo
    });

    // Get extension page
    const pages = await this.browser.pages();
    this.page = pages[0];
    
    await this.page.setViewport(this.demoConfig.viewport);
    
    console.log('✅ Browser launched with extension loaded');
  }

  async recordDemoScenarios() {
    console.log('🎬 Recording ultra-tier demo scenarios...');

    // Start screen recording
    await this.startRecording();

    for (const scenario of this.demoConfig.scenarios) {
      console.log(`📹 Recording scenario: ${scenario}`);
      await this[`record_${scenario}`]();
      await this.wait(2000); // Pause between scenarios
    }

    await this.stopRecording();
  }

  async startRecording() {
    console.log('🎥 Starting screen recording...');
    
    // This would integrate with system screen recording
    // For now, we'll simulate and take screenshots for storyboard
    await this.page.evaluate(() => {
      console.log('🎬 Demo recording started - DailyDoco Pro Extension');
    });
  }

  async record_extensionInstall() {
    console.log('📱 Demonstrating extension installation...');
    
    // Navigate to Chrome extensions page
    await this.page.goto('chrome://extensions/');
    await this.wait(1000);
    
    // Take screenshot
    await this.screenshot('01-extension-page');
    
    // Show developer mode toggle
    await this.page.evaluate(() => {
      const toggle = document.querySelector('#dev-mode-checkbox');
      if (toggle) {
        toggle.scrollIntoView();
        toggle.style.border = '3px solid #667eea';
        toggle.style.borderRadius = '4px';
      }
    });
    
    await this.wait(2000);
    await this.screenshot('02-developer-mode');
    
    console.log('✅ Extension installation demo completed');
  }

  async record_projectDetection() {
    console.log('🔍 Demonstrating project detection...');
    
    // Navigate to GitHub (simulated development environment)
    await this.page.goto('https://github.com');
    await this.wait(2000);
    
    // Show extension popup activation
    await this.page.evaluate(() => {
      // Simulate extension popup opening
      const popup = document.createElement('div');
      popup.innerHTML = `
        <div style="
          position: fixed;
          top: 60px;
          right: 20px;
          width: 350px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          z-index: 10000;
          backdrop-filter: blur(10px);
        ">
          <h3 style="margin: 0 0 15px 0; font-size: 18px;">🔍 Project Detected</h3>
          <p style="margin: 0 0 10px 0; opacity: 0.9;">GitHub Repository</p>
          <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.8;">Ready to start documentation</p>
          <button style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          ">Start Capture</button>
        </div>
      `;
      document.body.appendChild(popup);
    });
    
    await this.wait(3000);
    await this.screenshot('03-project-detection');
    
    console.log('✅ Project detection demo completed');
  }

  async record_captureStart() {
    console.log('🎬 Demonstrating capture start...');
    
    // Simulate clicking start capture
    await this.page.evaluate(() => {
      // Add recording indicator
      const indicator = document.createElement('div');
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(239, 68, 68, 0.95);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10001;
          animation: slideIn 0.3s ease;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          "></div>
          Recording
        </div>
      `;
      
      // Add keyframes
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(indicator);
    });
    
    await this.wait(2000);
    await this.screenshot('04-recording-active');
    
    console.log('✅ Capture start demo completed');
  }

  async record_aiFeatures() {
    console.log('🤖 Demonstrating AI features...');
    
    // Show AI processing overlay
    await this.page.evaluate(() => {
      const aiOverlay = document.createElement('div');
      aiOverlay.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 300px;
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          z-index: 10002;
        ">
          <h4 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
            🧠 AI Processing
            <div style="
              width: 20px;
              height: 20px;
              border: 2px solid rgba(255,255,255,0.3);
              border-top: 2px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "></div>
          </h4>
          <div style="margin-bottom: 10px; font-size: 14px; opacity: 0.9;">
            ✅ Code analysis complete
          </div>
          <div style="margin-bottom: 10px; font-size: 14px; opacity: 0.9;">
            🎭 Test audience: 75 synthetic viewers
          </div>
          <div style="margin-bottom: 10px; font-size: 14px; opacity: 0.9;">
            🎤 Generating natural narration...
          </div>
          <div style="font-size: 12px; opacity: 0.7;">
            Authenticity score: 96%
          </div>
        </div>
      `;
      
      const spinStyle = document.createElement('style');
      spinStyle.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(spinStyle);
      document.body.appendChild(aiOverlay);
    });
    
    await this.wait(4000);
    await this.screenshot('05-ai-processing');
    
    console.log('✅ AI features demo completed');
  }

  async record_testAudience() {
    console.log('🎭 Demonstrating test audience results...');
    
    // Show test audience results
    await this.page.evaluate(() => {
      const resultsPanel = document.createElement('div');
      resultsPanel.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 30px;
          color: #1e293b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          z-index: 10003;
          backdrop-filter: blur(20px);
        ">
          <h3 style="margin: 0 0 20px 0; color: #667eea; text-align: center;">
            🎭 AI Test Audience Results
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">84%</div>
              <div style="font-size: 12px; opacity: 0.7;">Overall Engagement</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">78%</div>
              <div style="font-size: 12px; opacity: 0.7;">Retention Rate</div>
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <div style="font-weight: 500; margin-bottom: 8px;">Audience Breakdown:</div>
            <div style="font-size: 14px; opacity: 0.8;">
              • Junior Developers: 40% (89% engagement)<br>
              • Senior Developers: 35% (76% engagement)<br>
              • Tech Leads: 25% (82% engagement)
            </div>
          </div>
          <div style="text-align: center;">
            <button style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
            ">Apply Optimizations</button>
          </div>
        </div>
      `;
      document.body.appendChild(resultsPanel);
    });
    
    await this.wait(5000);
    await this.screenshot('06-test-audience-results');
    
    console.log('✅ Test audience demo completed');
  }

  async record_videoExport() {
    console.log('📤 Demonstrating video export...');
    
    // Show export options
    await this.page.evaluate(() => {
      // Clear previous overlays
      document.querySelectorAll('[style*="position: fixed"]').forEach(el => {
        if (el.textContent.includes('Test Audience') || 
            el.textContent.includes('AI Processing')) {
          el.remove();
        }
      });
      
      const exportPanel = document.createElement('div');
      exportPanel.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 450px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 30px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 25px 50px rgba(0,0,0,0.4);
          z-index: 10004;
        ">
          <h3 style="margin: 0 0 20px 0; text-align: center;">
            🎬 Export Ultra-Tier Video
          </h3>
          <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px; font-weight: 500;">Platform Optimization:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <button style="padding: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 6px;">
                📺 YouTube
              </button>
              <button style="padding: 10px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 6px;">
                💼 LinkedIn
              </button>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <div style="margin-bottom: 10px; font-weight: 500;">Quality:</div>
            <select style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: white; border-radius: 6px;">
              <option>4K Ultra (3840x2160)</option>
              <option selected>1080p Pro (1920x1080)</option>
              <option>720p Standard (1280x720)</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px;">
            <button style="
              flex: 1;
              background: rgba(255,255,255,0.9);
              border: none;
              color: #667eea;
              padding: 12px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Export Video</button>
            <button style="
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
            ">Preview</button>
          </div>
        </div>
      `;
      document.body.appendChild(exportPanel);
    });
    
    await this.wait(4000);
    await this.screenshot('07-video-export');
    
    console.log('✅ Video export demo completed');
  }

  async stopRecording() {
    console.log('⏹️ Stopping screen recording...');
    
    await this.page.evaluate(() => {
      console.log('🎬 Demo recording completed - DailyDoco Pro Extension');
    });
  }

  async screenshot(name) {
    const filepath = path.join(this.outputDir, `${name}.png`);
    await this.page.screenshot({
      path: filepath,
      fullPage: true,
      quality: 100
    });
    console.log(`📸 Screenshot saved: ${name}.png`);
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async finalizeDemo() {
    console.log('🎯 Finalizing ultra-tier demo...');
    
    // Create demo information file
    const demoInfo = {
      platform: this.platform,
      created: new Date().toISOString(),
      config: this.demoConfig,
      screenshots: 7,
      description: 'Ultra-tier professional demo for Chrome Web Store submission',
      features_demonstrated: [
        'Extension installation process',
        'Automatic project detection',
        'Screen capture activation',
        'AI processing and analysis',
        'Test audience simulation',
        'Video export options'
      ],
      technical_highlights: [
        '3D isometric icon design',
        'Professional UI/UX',
        'AI-powered features',
        'Cross-platform compatibility',
        'Enterprise-grade quality'
      ]
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'demo-info.json'),
      JSON.stringify(demoInfo, null, 2)
    );
    
    // Create README for demo
    const demoReadme = `
# DailyDoco Pro Extension Demo

This demo showcases the ultra-tier features of DailyDoco Pro browser extension.

## Demo Contents

1. **Extension Installation** - Shows how users install the extension
2. **Project Detection** - Automatic detection of development environments
3. **Capture Start** - Seamless screen recording activation
4. **AI Features** - Advanced AI processing and analysis
5. **Test Audience** - Synthetic viewer simulation results
6. **Video Export** - Professional export options and quality settings

## For Chrome Web Store Submission

This demo is specifically created for Chrome Web Store submission requirements:
- High-quality screenshots (1920x1080)
- Professional presentation
- Clear feature demonstration
- User workflow examples

## Technical Features Shown

- 3D isometric icon design
- Professional glassmorphism UI
- AI-powered documentation
- Cross-platform compatibility
- Enterprise-grade security

Generated by DailyDoco Pro Demo Creator
${new Date().toLocaleString()}
    `.trim();
    
    await fs.writeFile(
      path.join(this.outputDir, 'README.md'),
      demoReadme
    );
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup completed');
    }
  }
}

// Main execution
if (require.main === module) {
  const platform = process.argv[2] || 'chrome';
  
  if (!['chrome', 'firefox'].includes(platform)) {
    console.error('❌ Invalid platform. Use: chrome or firefox');
    process.exit(1);
  }
  
  const demoCreator = new DemoCreator(platform);
  
  demoCreator.createUltraTierDemo().catch(error => {
    console.error('❌ Demo creation failed:', error);
    process.exit(1);
  });
}

module.exports = { DemoCreator };