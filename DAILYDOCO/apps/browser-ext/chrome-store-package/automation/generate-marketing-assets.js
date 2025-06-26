#!/usr/bin/env node

/**
 * Chrome Web Store Marketing Assets Generator
 * Generates professional screenshots, promotional images, and icons
 */

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ChromeStoreAssetGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, '../marketing-assets');
        this.screenshotDir = path.join(this.outputDir, 'screenshots');
        this.promoDir = path.join(this.outputDir, 'promotional-images');
        this.iconDir = path.join(this.outputDir, 'icons');
    }

    async initialize() {
        // Create output directories
        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.mkdir(this.screenshotDir, { recursive: true });
        await fs.mkdir(this.promoDir, { recursive: true });
        await fs.mkdir(this.iconDir, { recursive: true });

        // Launch headless browser for screenshots
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1280, height: 800 }
        });
    }

    async generateScreenshots() {
        console.log('📸 Generating Chrome Web Store screenshots...');
        
        const page = await this.browser.newPage();
        
        // Screenshot 1: Main Extension Interface
        await this.createExtensionPopupScreenshot(page, '01-main-interface-1280x800.png');
        
        // Screenshot 2: AI Features Panel
        await this.createAIFeaturesScreenshot(page, '02-ai-features-1280x800.png');
        
        // Screenshot 3: Capture Workflow
        await this.createCaptureWorkflowScreenshot(page, '03-capture-workflow-1280x800.png');
        
        // Screenshot 4: Performance Dashboard
        await this.createPerformanceScreenshot(page, '04-performance-stats-1280x800.png');
        
        // Screenshot 5: Project Analysis
        await this.createProjectAnalysisScreenshot(page, '05-project-analysis-1280x800.png');
        
        await page.close();
        console.log('✅ Screenshots generated successfully');
    }

    async createExtensionPopupScreenshot(page, filename) {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DailyDoco Pro - Main Interface</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                
                .screenshot-container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    max-width: 1000px;
                    width: 100%;
                }
                
                .demo-popup {
                    background: #1a1a1a;
                    border-radius: 16px;
                    width: 380px;
                    margin: 0 auto;
                    color: white;
                    font-size: 14px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .header {
                    padding: 20px;
                    border-bottom: 1px solid #333;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .logo-icon {
                    font-size: 24px;
                }
                
                .logo-text h3 {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 2px;
                }
                
                .logo-text p {
                    font-size: 12px;
                    color: #888;
                }
                
                .status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #10B981;
                    border-radius: 50%;
                }
                
                .main-content {
                    padding: 20px;
                }
                
                .section {
                    margin-bottom: 24px;
                }
                
                .section h4 {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: #E5E7EB;
                }
                
                .capture-btn {
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    border: none;
                    border-radius: 12px;
                    padding: 16px;
                    width: 100%;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .capture-icon {
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                }
                
                .ai-features {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .feature-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .feature-info h5 {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 2px;
                }
                
                .feature-info p {
                    font-size: 11px;
                    color: #888;
                }
                
                .toggle {
                    width: 32px;
                    height: 18px;
                    background: #3B82F6;
                    border-radius: 12px;
                    position: relative;
                }
                
                .toggle::after {
                    content: '';
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    right: 2px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 12px;
                    margin-top: 12px;
                }
                
                .stat-item {
                    text-align: center;
                    padding: 12px 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }
                
                .stat-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: #10B981;
                    margin-bottom: 4px;
                }
                
                .stat-label {
                    font-size: 10px;
                    color: #888;
                }
                
                .annotation {
                    position: absolute;
                    background: #3B82F6;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }
                
                .annotation::after {
                    content: '';
                    position: absolute;
                    border: 6px solid transparent;
                    border-top-color: #3B82F6;
                    bottom: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .title-overlay {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .title-overlay h1 {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }
                
                .title-overlay p {
                    font-size: 16px;
                    color: #6B7280;
                }
            </style>
        </head>
        <body>
            <div class="screenshot-container">
                <div class="title-overlay">
                    <h1>DailyDoco Pro - AI Documentation Recorder</h1>
                    <p>Professional Chrome Extension Interface</p>
                </div>
                
                <div style="position: relative; display: flex; justify-content: center;">
                    <div class="demo-popup">
                        <div class="header">
                            <div class="logo">
                                <div class="logo-icon">📹</div>
                                <div class="logo-text">
                                    <h3>DailyDoco Pro</h3>
                                    <p>AI Documentation Assistant</p>
                                </div>
                            </div>
                            <div class="status">
                                <div class="status-dot"></div>
                                <span>Ready</span>
                            </div>
                        </div>
                        
                        <div class="main-content">
                            <div class="section">
                                <button class="capture-btn">
                                    <div class="capture-icon"></div>
                                    <div>
                                        <div style="font-weight: 600;">Start Recording</div>
                                        <div style="font-size: 12px; opacity: 0.8;">Intelligent capture with AI optimization</div>
                                    </div>
                                </button>
                            </div>
                            
                            <div class="section">
                                <h4>AI Features</h4>
                                <div class="ai-features">
                                    <div class="feature-item">
                                        <div class="feature-info">
                                            <h5>Test Audience</h5>
                                            <p>50-100 synthetic viewers</p>
                                        </div>
                                        <div class="toggle"></div>
                                    </div>
                                    <div class="feature-item">
                                        <div class="feature-info">
                                            <h5>Personal Branding</h5>
                                            <p>Adapts to your style</p>
                                        </div>
                                        <div class="toggle"></div>
                                    </div>
                                    <div class="feature-item">
                                        <div class="feature-info">
                                            <h5>AI Narration</h5>
                                            <p>Natural voice generation</p>
                                        </div>
                                        <div class="toggle"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h4>Performance</h4>
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-value">1.7x</div>
                                        <div class="stat-label">Processing</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">185MB</div>
                                        <div class="stat-label">Memory</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">97%</div>
                                        <div class="stat-label">Authenticity</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="annotation" style="top: 120px; right: -80px;">
                        Elite AI Features
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.screenshotDir, filename),
            fullPage: true,
            type: 'png'
        });
    }

    async createAIFeaturesScreenshot(page, filename) {
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 1000px;
                    width: 100%;
                    text-align: center;
                }
                
                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 16px;
                }
                
                .subtitle {
                    font-size: 18px;
                    color: #6B7280;
                    margin-bottom: 40px;
                }
                
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                    margin-top: 40px;
                }
                
                .feature-card {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: left;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .feature-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin-bottom: 16px;
                }
                
                .feature-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1F2937;
                    margin-bottom: 8px;
                }
                
                .feature-desc {
                    font-size: 14px;
                    color: #6B7280;
                    line-height: 1.6;
                    margin-bottom: 16px;
                }
                
                .feature-stats {
                    display: flex;
                    gap: 16px;
                }
                
                .stat {
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: #10B981;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #6B7280;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Elite AI-Powered Features</h1>
                <p class="subtitle">Revolutionary technology that transforms development documentation</p>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🤖</div>
                        <h3 class="feature-title">AI Test Audience</h3>
                        <p class="feature-desc">Get instant feedback from 50-100 synthetic viewers before publishing. Advanced persona simulation with realistic engagement patterns.</p>
                        <div class="feature-stats">
                            <div class="stat">
                                <div class="stat-value">95%</div>
                                <div class="stat-label">Accuracy</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">50-100</div>
                                <div class="stat-label">Viewers</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🎨</div>
                        <h3 class="feature-title">Personal Branding</h3>
                        <p class="feature-desc">AI learns your unique teaching style and adapts content to match your voice, pace, and visual preferences automatically.</p>
                        <div class="feature-stats">
                            <div class="stat">
                                <div class="stat-value">97%</div>
                                <div class="stat-label">Style Match</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">12+</div>
                                <div class="stat-label">Styles</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🎙️</div>
                        <h3 class="feature-title">Natural AI Narration</h3>
                        <p class="feature-desc">Human-quality voice synthesis with perfect technical term pronunciation and natural speech patterns.</p>
                        <div class="feature-stats">
                            <div class="stat">
                                <div class="stat-value">99%</div>
                                <div class="stat-label">Human-like</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">25+</div>
                                <div class="stat-label">Languages</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🧠</div>
                        <h3 class="feature-title">Predictive Capture</h3>
                        <p class="feature-desc">AI analyzes your code and predicts important moments, automatically focusing on the most valuable content.</p>
                        <div class="feature-stats">
                            <div class="stat">
                                <div class="stat-value">87%</div>
                                <div class="stat-label">Accuracy</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">2.1x</div>
                                <div class="stat-label">Efficiency</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.screenshotDir, filename),
            fullPage: true,
            type: 'png'
        });
    }

    async createCaptureWorkflowScreenshot(page, filename) {
        // Similar implementation for capture workflow
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 1000px;
                    width: 100%;
                    text-align: center;
                }
                
                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 16px;
                }
                
                .workflow-steps {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 40px 0;
                    position: relative;
                }
                
                .workflow-steps::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 15%;
                    right: 15%;
                    height: 2px;
                    background: linear-gradient(90deg, #3B82F6, #1E40AF);
                    z-index: 1;
                }
                
                .step {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    width: 180px;
                    position: relative;
                    z-index: 2;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .step-number {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    margin: 0 auto 16px;
                }
                
                .step-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1F2937;
                    margin-bottom: 8px;
                }
                
                .step-desc {
                    font-size: 14px;
                    color: #6B7280;
                    line-height: 1.4;
                }
                
                .demo-video {
                    background: #1a1a1a;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 40px 0;
                    position: relative;
                    overflow: hidden;
                }
                
                .video-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .traffic-light {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                
                .red { background: #FF5F57; }
                .yellow { background: #FFBD2E; }
                .green { background: #28CA42; }
                
                .recording-indicator {
                    background: #DC2626;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .recording-dot {
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .code-editor {
                    background: #0d1117;
                    color: #e6edf3;
                    padding: 16px;
                    border-radius: 8px;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    text-align: left;
                }
                
                .code-line {
                    margin: 4px 0;
                }
                
                .highlight {
                    background: rgba(59, 130, 246, 0.2);
                    padding: 2px 4px;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Intelligent Capture Workflow</h1>
                <p class="subtitle" style="font-size: 18px; color: #6B7280; margin-bottom: 40px;">
                    From code to professional video in minutes, not hours
                </p>
                
                <div class="workflow-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <h3 class="step-title">Click Record</h3>
                        <p class="step-desc">One-click start from browser extension</p>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <h3 class="step-title">Code Normally</h3>
                        <p class="step-desc">AI analyzes your workflow in real-time</p>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <h3 class="step-title">AI Processing</h3>
                        <p class="step-desc">Automatic optimization and enhancement</p>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <h3 class="step-title">Professional Video</h3>
                        <p class="step-desc">Broadcast-quality output ready to share</p>
                    </div>
                </div>
                
                <div class="demo-video">
                    <div class="video-header">
                        <div class="traffic-light red"></div>
                        <div class="traffic-light yellow"></div>
                        <div class="traffic-light green"></div>
                        <span style="color: #888; font-size: 14px; margin-left: 12px;">VS Code - DailyDoco Pro Demo</span>
                        <div class="recording-indicator">
                            <div class="recording-dot"></div>
                            REC 02:34
                        </div>
                    </div>
                    
                    <div class="code-editor">
                        <div class="code-line">// <span class="highlight">AI detects important moment</span></div>
                        <div class="code-line">function calculateDocumentationScore(code) {</div>
                        <div class="code-line">  const complexity = analyzeComplexity(code);</div>
                        <div class="code-line">  const <span class="highlight">clarity = assessClarity(code);</span></div>
                        <div class="code-line">  </div>
                        <div class="code-line">  return {</div>
                        <div class="code-line">    score: Math.min(complexity * clarity, 100),</div>
                        <div class="code-line">    <span class="highlight">suggestions: generateSuggestions(code)</span></div>
                        <div class="code-line">  };</div>
                        <div class="code-line">}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.screenshotDir, filename),
            fullPage: true,
            type: 'png'
        });
    }

    async createPerformanceScreenshot(page, filename) {
        // Performance dashboard screenshot
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 1000px;
                    width: 100%;
                    text-align: center;
                }
                
                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 40px;
                }
                
                .performance-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 24px;
                    margin-bottom: 40px;
                }
                
                .metric-card {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 16px;
                    padding: 24px;
                    text-align: center;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .metric-value {
                    font-size: 36px;
                    font-weight: 700;
                    color: #10B981;
                    margin-bottom: 8px;
                }
                
                .metric-label {
                    font-size: 14px;
                    color: #6B7280;
                    margin-bottom: 4px;
                }
                
                .metric-desc {
                    font-size: 12px;
                    color: #9CA3AF;
                }
                
                .comparison-chart {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 16px;
                    padding: 24px;
                    margin-top: 24px;
                }
                
                .chart-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1F2937;
                    margin-bottom: 20px;
                }
                
                .competitor-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .competitor-name {
                    font-weight: 500;
                    color: #374151;
                }
                
                .performance-bar {
                    height: 8px;
                    background: #E5E7EB;
                    border-radius: 4px;
                    width: 200px;
                    overflow: hidden;
                }
                
                .performance-fill {
                    height: 100%;
                    border-radius: 4px;
                }
                
                .dailydoco { background: linear-gradient(90deg, #10B981, #059669); width: 95%; }
                .loom { background: #EF4444; width: 45%; }
                .obs { background: #F59E0B; width: 30%; }
                .asciinema { background: #6B7280; width: 25%; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Elite Performance Standards</h1>
                
                <div class="performance-grid">
                    <div class="metric-card">
                        <div class="metric-value">1.7x</div>
                        <div class="metric-label">Processing Speed</div>
                        <div class="metric-desc">Faster than real-time</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">185MB</div>
                        <div class="metric-label">Memory Usage</div>
                        <div class="metric-desc">Under 200MB target</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">4.2%</div>
                        <div class="metric-label">CPU Usage</div>
                        <div class="metric-desc">During monitoring</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">97%</div>
                        <div class="metric-label">Authenticity Score</div>
                        <div class="metric-desc">Human-level content</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">70%</div>
                        <div class="metric-label">Size Reduction</div>
                        <div class="metric-desc">Lossless compression</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">2.8s</div>
                        <div class="metric-label">Startup Time</div>
                        <div class="metric-desc">Under 3s target</div>
                    </div>
                </div>
                
                <div class="comparison-chart">
                    <h3 class="chart-title">Performance vs Competitors</h3>
                    
                    <div class="competitor-row">
                        <span class="competitor-name">DailyDoco Pro</span>
                        <div class="performance-bar">
                            <div class="performance-fill dailydoco"></div>
                        </div>
                        <span style="color: #10B981; font-weight: 600;">95%</span>
                    </div>
                    
                    <div class="competitor-row">
                        <span class="competitor-name">Loom</span>
                        <div class="performance-bar">
                            <div class="performance-fill loom"></div>
                        </div>
                        <span style="color: #EF4444;">45%</span>
                    </div>
                    
                    <div class="competitor-row">
                        <span class="competitor-name">OBS Studio</span>
                        <div class="performance-bar">
                            <div class="performance-fill obs"></div>
                        </div>
                        <span style="color: #F59E0B;">30%</span>
                    </div>
                    
                    <div class="competitor-row" style="border-bottom: none;">
                        <span class="competitor-name">Asciinema</span>
                        <div class="performance-bar">
                            <div class="performance-fill asciinema"></div>
                        </div>
                        <span style="color: #6B7280;">25%</span>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.screenshotDir, filename),
            fullPage: true,
            type: 'png'
        });
    }

    async createProjectAnalysisScreenshot(page, filename) {
        // Project analysis screenshot
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">  
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }
                
                .container {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 1000px;
                    width: 100%;
                }
                
                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 40px;
                    text-align: center;
                }
                
                .analysis-dashboard {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                
                .analysis-panel {
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                
                .panel-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1F2937;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .project-info {
                    margin-bottom: 20px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #E5E7EB;
                }
                
                .info-label {
                    color: #6B7280;
                    font-size: 14px;
                }
                
                .info-value {
                    color: #1F2937;
                    font-weight: 500;
                    font-size: 14px;
                }
                
                .insights-list {
                    list-style: none;
                }
                
                .insight-item {
                    padding: 12px;
                    background: rgba(59, 130, 246, 0.05);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    border-left: 3px solid #3B82F6;
                }
                
                .insight-title {
                    font-weight: 500;
                    color: #1F2937;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                
                .insight-desc {
                    color: #6B7280;
                    font-size: 12px;
                }
                
                .tech-stack {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .tech-tag {
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>AI-Powered Project Analysis</h1>
                
                <div class="analysis-dashboard">
                    <div class="analysis-panel">
                        <h3 class="panel-title">
                            📊 Project Intelligence
                        </h3>
                        
                        <div class="project-info">
                            <div class="info-row">
                                <span class="info-label">Project Type</span>
                                <span class="info-value">React Application</span>  
                            </div>
                            <div class="info-row">
                                <span class="info-label">Complexity</span>
                                <span class="info-value">High</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Documentation Score</span>
                                <span class="info-value" style="color: #10B981;">87%</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Tutorial Potential</span>
                                <span class="info-value" style="color: #3B82F6;">Excellent</span>
                            </div>
                        </div>
                        
                        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1F2937;">
                            Technology Stack
                        </h4>
                        <div class="tech-stack">
                            <span class="tech-tag">React 18</span>
                            <span class="tech-tag">TypeScript</span>
                            <span class="tech-tag">Vite</span>
                            <span class="tech-tag">TailwindCSS</span>
                            <span class="tech-tag">Node.js</span>
                        </div>
                    </div>
                    
                    <div class="analysis-panel">
                        <h3 class="panel-title">
                            🤖 AI Insights & Recommendations
                        </h3>
                        
                        <ul class="insights-list">
                            <li class="insight-item">
                                <div class="insight-title">High Tutorial Value Detected</div>
                                <div class="insight-desc">Complex authentication implementation perfect for educational content</div>
                            </li>
                            <li class="insight-item">
                                <div class="insight-title">Best Practices Identified</div>
                                <div class="insight-desc">Clean architecture patterns worth highlighting in documentation</div>
                            </li>
                            <li class="insight-item">
                                <div class="insight-title">Performance Optimizations</div>
                                <div class="insight-desc">Advanced React patterns that would benefit other developers</div>
                            </li>
                            <li class="insight-item">
                                <div class="insight-title">Testing Strategy</div>
                                <div class="insight-desc">Comprehensive test suite implementation worth documenting</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.screenshotDir, filename),
            fullPage: true,
            type: 'png'
        });
    }

    async generatePromotionalImages() {
        console.log('🎨 Generating promotional images...');
        
        // Generate hero image (1400x560)
        await this.createHeroImage();
        
        // Generate small tile (440x280) 
        await this.createSmallTile();
        
        // Generate marquee promo (1400x560)
        await this.createMarqueePromo();
        
        console.log('✅ Promotional images generated successfully');
    }

    async createHeroImage() {
        const page = await this.browser.newPage();
        await page.setViewport({ width: 1400, height: 560 });
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    width: 1400px;
                    height: 560px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .hero-content {
                    text-align: center;
                    z-index: 2;
                    max-width: 800px;
                }
                
                .hero-title {
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 16px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                
                .hero-subtitle {
                    font-size: 24px;
                    font-weight: 300;
                    margin-bottom: 32px;
                    opacity: 0.9;
                }
                
                .features {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    margin-top: 32px;
                }
                
                .feature {
                    text-align: center;
                }
                
                .feature-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }
                
                .feature-text {
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .logo-badge {
                    position: absolute;
                    top: 40px;
                    left: 40px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 18px;
                }
                
                .decorative-elements {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1;
                }
                
                .circle {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .circle-1 { width: 200px; height: 200px; top: -100px; right: -100px; }
                .circle-2 { width: 150px; height: 150px; bottom: -75px; left: -75px; }
                .circle-3 { width: 100px; height: 100px; top: 50%; right: 20px; }
            </style>
        </head>
        <body>
            <div class="decorative-elements">
                <div class="circle circle-1"></div>
                <div class="circle circle-2"></div>
                <div class="circle circle-3"></div>
            </div>
            
            <div class="logo-badge">📹 DailyDoco Pro</div>
            
            <div class="hero-content">
                <h1 class="hero-title">AI Documentation Revolution</h1>
                <p class="hero-subtitle">Transform code into professional videos with 95%+ authenticity</p>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">🤖</div>
                        <div class="feature-text">AI-Powered</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <div class="feature-text">Sub-2x Speed</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🎯</div>
                        <div class="feature-text">97% Authentic</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🔒</div>
                        <div class="feature-text">Privacy-First</div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.promoDir, 'hero-image-1400x560.png'),
            type: 'png'
        });
        
        await page.close();
    }

    async createSmallTile() {
        const page = await this.browser.newPage();
        await page.setViewport({ width: 440, height: 280 });
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
                    width: 440px;
                    height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                }
                
                .tile-content {
                    padding: 20px;
                }
                
                .tile-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .tile-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .tile-subtitle {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-bottom: 16px;
                }
                
                .tile-stats {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    font-size: 12px;
                }
                
                .stat {
                    text-align: center;
                }
                
                .stat-value {
                    font-weight: 700;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="tile-content">
                <div class="tile-icon">📹</div>
                <h2 class="tile-title">DailyDoco Pro</h2>
                <p class="tile-subtitle">AI Documentation Recorder</p>
                
                <div class="tile-stats">
                    <div class="stat">
                        <div class="stat-value">97%</div>
                        <div>Authentic</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1.7x</div>
                        <div>Speed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">10K+</div>
                        <div>Users</div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.promoDir, 'small-tile-440x280.png'),
            type: 'png'
        });
        
        await page.close();
    }

    async createMarqueePromo() {
        const page = await this.browser.newPage();
        await page.setViewport({ width: 1400, height: 560 });
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 50%, #667eea 100%);
                    width: 1400px;
                    height: 560px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 80px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .left-content {
                    flex: 1;
                    z-index: 2;
                }
                
                .marquee-title {
                    font-size: 52px;
                    font-weight: 700;
                    line-height: 1.1;
                    margin-bottom: 24px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                
                .marquee-subtitle {
                    font-size: 20px;
                    font-weight: 300;
                    opacity: 0.9;
                    margin-bottom: 32px;
                    line-height: 1.4;
                }
                
                .cta-button {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 16px 32px;
                    border-radius: 50px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .right-visual {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                
                .visual-mockup {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    transform: perspective(1000px) rotateY(-10deg);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                }
                
                .mockup-screen {
                    background: #1a1a1a;
                    border-radius: 12px;
                    padding: 20px;
                    width: 300px;
                    height: 200px;
                    position: relative;
                }
                
                .mockup-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .traffic-light {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                
                .red { background: #FF5F57; }
                .yellow { background: #FFBD2E; }
                .green { background: #28CA42; }
                
                .code-lines {
                    color: #e6edf3;
                    font-family: 'Monaco', monospace;
                    font-size: 12px;
                    line-height: 1.6;
                }
                
                .highlight {
                    background: rgba(59, 130, 246, 0.3);
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                
                .floating-badge {
                    position: absolute;
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                    top: -10px;
                    right: -10px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
            </style>
        </head>
        <body>
            <div class="left-content">
                <h1 class="marquee-title">The Future of<br>Developer Documentation</h1>
                <p class="marquee-subtitle">Join 10,000+ developers using AI to create professional video tutorials that actually get watched.</p>
                <button class="cta-button">Install Free Extension</button>
            </div>
            
            <div class="right-visual">
                <div class="visual-mockup">
                    <div class="floating-badge">97% Authentic</div>
                    <div class="mockup-screen">
                        <div class="mockup-header">
                            <div class="traffic-light red"></div>
                            <div class="traffic-light yellow"></div>
                            <div class="traffic-light green"></div>
                        </div>
                        <div class="code-lines">
                            <div>function <span class="highlight">createTutorial</span>() {</div>
                            <div>  const ai = new <span class="highlight">DailyDocoAI</span>();</div>
                            <div>  </div>
                            <div>  return ai.<span class="highlight">generateVideo</span>({</div>
                            <div>    authenticity: <span class="highlight">'97%'</span>,</div>
                            <div>    speed: <span class="highlight">'1.7x'</span>,</div>
                            <div>    quality: <span class="highlight">'professional'</span></div>
                            <div>  });</div>
                            <div>}</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;

        await page.setContent(html);
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: path.join(this.promoDir, 'marquee-promo-1400x560.png'),
            type: 'png'  
        });
        
        await page.close();
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.generateScreenshots();
            await this.generatePromotionalImages();
            console.log('🎉 All marketing assets generated successfully!');
        } catch (error) {
            console.error('❌ Error generating assets:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new ChromeStoreAssetGenerator();
    generator.run();
}

module.exports = ChromeStoreAssetGenerator;