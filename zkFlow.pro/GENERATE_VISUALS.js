#!/usr/bin/env node

/**
 * VISUAL ASSETS GENERATOR FOR zkFlow.pro
 * Creates professional logos, icons, and marketing visuals using HTML/CSS/SVG
 */

const fs = require('fs');
const path = require('path');

class VisualGenerator {
  constructor() {
    this.baseDir = '/home/tabs/ae-co-system/zkFlow.pro';
    this.mediaDir = path.join(this.baseDir, 'media');
  }

  async generateAllVisuals() {
    console.log('🎨 GENERATING ALL VISUAL ASSETS!');
    console.log('===============================');

    await this.generateLogos();
    await this.generateIcons();
    await this.generateMarketingBanners();
    await this.generateSocialMediaGraphics();
    await this.generatePresentationSlides();

    console.log('\n🎉 ALL VISUAL ASSETS GENERATED!');
  }

  async generateLogos() {
    console.log('\n🏢 Generating Professional Logos...');

    // Main logo SVG
    const mainLogo = `<svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="zkflowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.1)"/>
    </filter>
  </defs>
  
  <!-- Logo Icon -->
  <g transform="translate(20,20)">
    <!-- Background circle -->
    <circle cx="40" cy="40" r="35" fill="url(#zkflowGradient)" filter="url(#shadow)"/>
    
    <!-- Form symbol -->
    <rect x="25" y="25" width="30" height="20" rx="3" fill="white" opacity="0.9"/>
    <line x1="28" y1="30" x2="40" y2="30" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="28" y1="34" x2="42" y2="34" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="28" y1="38" x2="38" y2="38" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
    
    <!-- Automation arrow -->
    <path d="M 50 35 L 60 35 L 57 32 M 60 35 L 57 38" 
          stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" fill="none"/>
  </g>
  
  <!-- Text -->
  <text x="110" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="url(#zkflowGradient)">zkFlow</text>
  <text x="110" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#6B7280">.pro</text>
  <text x="110" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="400" fill="#9CA3AF">Smart Form Automation</text>
</svg>`;

    // Chrome Web Store promotional image
    const chromeStoreBanner = `<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F8FAFC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E2E8F0;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="zkflowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bgGradient)"/>
  
  <!-- Main content area -->
  <rect x="100" y="100" width="1080" height="600" rx="24" fill="white" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Header -->
  <text x="640" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" text-anchor="middle" fill="url(#zkflowGradient)">zkFlow.pro</text>
  <text x="640" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" text-anchor="middle" fill="#6B7280">Smart Form Automation for Professionals</text>
  
  <!-- Features grid -->
  <g transform="translate(200,300)">
    <!-- Feature 1 -->
    <circle cx="80" cy="60" r="40" fill="url(#zkflowGradient)" opacity="0.1"/>
    <text x="80" y="40" font-size="24" text-anchor="middle">🔒</text>
    <text x="80" y="75" font-family="system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="#1F2937">Privacy First</text>
    <text x="80" y="95" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Local storage only</text>
    
    <!-- Feature 2 -->
    <circle cx="320" cy="60" r="40" fill="url(#zkflowGradient)" opacity="0.1"/>
    <text x="320" y="40" font-size="24" text-anchor="middle">⚡</text>
    <text x="320" y="75" font-family="system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="#1F2937">Lightning Fast</text>
    <text x="320" y="95" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Save 5+ hours/week</text>
    
    <!-- Feature 3 -->
    <circle cx="560" cy="60" r="40" fill="url(#zkflowGradient)" opacity="0.1"/>
    <text x="560" y="40" font-size="24" text-anchor="middle">🎯</text>
    <text x="560" y="75" font-family="system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="#1F2937">Smart Detection</text>
    <text x="560" y="95" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Auto field mapping</text>
    
    <!-- Feature 4 -->
    <circle cx="800" cy="60" r="40" fill="url(#zkflowGradient)" opacity="0.1"/>
    <text x="800" y="40" font-size="24" text-anchor="middle">🆓</text>
    <text x="800" y="75" font-family="system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="#1F2937">Free to Use</text>
    <text x="800" y="95" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Premium features</text>
  </g>
  
  <!-- CTA -->
  <rect x="490" y="550" width="300" height="60" rx="30" fill="url(#zkflowGradient)"/>
  <text x="640" y="590" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="white">Download Free</text>
  
  <!-- Footer -->
  <text x="640" y="680" font-family="system-ui" font-size="14" text-anchor="middle" fill="#9CA3AF">Built by aegntic - AI-Powered Development Solutions</text>
</svg>`;

    // Product Hunt banner
    const productHuntBanner = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="phGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#phGradient)"/>
  
  <!-- Content -->
  <text x="600" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="700" text-anchor="middle" fill="white">zkFlow.pro</text>
  <text x="600" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" text-anchor="middle" fill="rgba(255,255,255,0.9)">Transform repetitive form filling into effortless automation</text>
  
  <!-- Features -->
  <text x="600" y="320" font-family="system-ui" font-size="20" text-anchor="middle" fill="white">🔒 Privacy First • ⚡ Lightning Fast • 🎯 Smart Detection • 🆓 Free to Use</text>
  
  <!-- Product Hunt badge -->
  <rect x="450" y="400" width="300" height="80" rx="40" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <text x="600" y="435" font-family="system-ui" font-size="16" font-weight="600" text-anchor="middle" fill="white">🚀 Now on Product Hunt</text>
  <text x="600" y="460" font-family="system-ui" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.8)">Help us reach #1 Product of the Day!</text>
  
  <!-- Footer -->
  <text x="600" y="550" font-family="system-ui" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.7)">Chrome Web Store • Free Download • Built by aegntic</text>
</svg>`;

    // Save logos
    fs.writeFileSync(path.join(this.mediaDir, 'logos/zkflow-main-logo.svg'), mainLogo);
    fs.writeFileSync(path.join(this.mediaDir, 'marketing/chrome-store-banner.svg'), chromeStoreBanner);
    fs.writeFileSync(path.join(this.mediaDir, 'marketing/product-hunt-banner.svg'), productHuntBanner);

    console.log('✅ Professional logos generated');
  }

  async generateIcons() {
    console.log('\n🎯 Generating Extension Icons...');

    // Chrome extension icon generator HTML
    const iconGenerator = `<!DOCTYPE html>
<html>
<head>
    <title>zkFlow.pro Icon Generator</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .icon-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        canvas { border: 1px solid #ddd; border-radius: 8px; }
        .download-btn { margin-top: 10px; padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>zkFlow.pro Chrome Extension Icons</h1>
    <p>Click download buttons to save each icon size for the Chrome Web Store submission.</p>
    
    <div class="icon-grid">
        <div class="icon-card">
            <h3>16x16 (Toolbar)</h3>
            <canvas id="icon16" width="16" height="16"></canvas>
            <br><button class="download-btn" onclick="downloadIcon('icon16', '16')">Download PNG</button>
        </div>
        
        <div class="icon-card">
            <h3>48x48 (Extension Management)</h3>
            <canvas id="icon48" width="48" height="48"></canvas>
            <br><button class="download-btn" onclick="downloadIcon('icon48', '48')">Download PNG</button>
        </div>
        
        <div class="icon-card">
            <h3>128x128 (Chrome Web Store)</h3>
            <canvas id="icon128" width="128" height="128"></canvas>
            <br><button class="download-btn" onclick="downloadIcon('icon128', '128')">Download PNG</button>
        </div>
        
        <div class="icon-card">
            <h3>512x512 (Store Listing)</h3>
            <canvas id="icon512" width="512" height="512"></canvas>
            <br><button class="download-btn" onclick="downloadIcon('icon512', '512')">Download PNG</button>
        </div>
    </div>

    <script>
        function drawIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            // High DPI scaling
            const dpr = window.devicePixelRatio || 1;
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
            ctx.scale(dpr, dpr);
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#3B82F6');
            gradient.addColorStop(1, '#8B5CF6');
            
            // Draw background with rounded corners
            const radius = size * 0.15;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(0, 0, size, size, radius);
            ctx.fill();
            
            // Draw form symbol
            ctx.fillStyle = 'white';
            const formWidth = size * 0.5;
            const formHeight = size * 0.35;
            const formX = (size - formWidth) / 2;
            const formY = (size - formHeight) / 2;
            
            ctx.fillRect(formX, formY, formWidth, formHeight);
            
            // Draw form lines
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = Math.max(1, size / 32);
            ctx.lineCap = 'round';
            
            const lineSpacing = formHeight / 4;
            for (let i = 0; i < 3; i++) {
                const y = formY + lineSpacing * (i + 0.7);
                ctx.beginPath();
                ctx.moveTo(formX + size * 0.08, y);
                ctx.lineTo(formX + formWidth - size * 0.08, y);
                ctx.stroke();
            }
            
            // Draw automation arrow (for larger sizes)
            if (size >= 48) {
                ctx.strokeStyle = '#8B5CF6';
                ctx.lineWidth = Math.max(2, size / 24);
                const arrowY = formY + formHeight / 2;
                const arrowStartX = formX + formWidth + size * 0.1;
                const arrowEndX = arrowStartX + size * 0.15;
                
                // Arrow line
                ctx.beginPath();
                ctx.moveTo(arrowStartX, arrowY);
                ctx.lineTo(arrowEndX, arrowY);
                ctx.stroke();
                
                // Arrow head
                const headSize = size * 0.04;
                ctx.beginPath();
                ctx.moveTo(arrowEndX, arrowY);
                ctx.lineTo(arrowEndX - headSize, arrowY - headSize);
                ctx.moveTo(arrowEndX, arrowY);
                ctx.lineTo(arrowEndX - headSize, arrowY + headSize);
                ctx.stroke();
            }
        }
        
        function downloadIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const link = document.createElement('a');
            link.download = \`zkflow-icon-\${size}.png\`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        // Generate all icons
        drawIcon('icon16', 16);
        drawIcon('icon48', 48);
        drawIcon('icon128', 128);
        drawIcon('icon512', 512);
        
        // Add polyfill for roundRect
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.beginPath();
                this.moveTo(x+r, y);
                this.arcTo(x+w, y, x+w, y+h, r);
                this.arcTo(x+w, y+h, x, y+h, r);
                this.arcTo(x, y+h, x, y, r);
                this.arcTo(x, y, x+w, y, r);
                this.closePath();
                return this;
            }
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(this.mediaDir, 'logos/icon-generator.html'), iconGenerator);
    console.log('✅ Extension icon generator created');
  }

  async generateMarketingBanners() {
    console.log('\n📢 Generating Marketing Banners...');

    // Social media banner templates
    const twitterCard = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="twitterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1DA1F2;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
    </linearGradient>
    <linearGradient id="zkflowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="white"/>
  <rect width="1200" height="630" fill="url(#twitterGradient)"/>
  
  <!-- Main content -->
  <text x="600" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" text-anchor="middle" fill="url(#zkflowGradient)">zkFlow.pro</text>
  <text x="600" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" text-anchor="middle" fill="#1F2937">Smart Form Automation</text>
  
  <!-- Key benefit -->
  <rect x="300" y="300" width="600" height="100" rx="20" fill="white" stroke="#E5E7EB" stroke-width="2"/>
  <text x="600" y="335" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="#3B82F6">Save 5+ Hours Every Week</text>
  <text x="600" y="365" font-family="system-ui" font-size="16" text-anchor="middle" fill="#6B7280">Record once, replay anywhere</text>
  <text x="600" y="385" font-family="system-ui" font-size="16" text-anchor="middle" fill="#6B7280">🔒 Privacy-first • ⚡ Lightning-fast • 🆓 Free</text>
  
  <!-- CTA -->
  <text x="600" y="480" font-family="system-ui" font-size="18" font-weight="500" text-anchor="middle" fill="#3B82F6">Chrome Web Store → zkflow.pro</text>
  
  <!-- Branding -->
  <text x="600" y="580" font-family="system-ui" font-size="14" text-anchor="middle" fill="#9CA3AF">Built by aegntic - AI-Powered Development Solutions</text>
</svg>`;

    // LinkedIn banner
    const linkedinBanner = `<svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="linkedinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0077B5;stop-opacity:0.05" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.05" />
    </linearGradient>
    <linearGradient id="zkflowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="900" fill="white"/>
  <rect width="1200" height="900" fill="url(#linkedinGradient)"/>
  
  <!-- Header -->
  <text x="600" y="150" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" text-anchor="middle" fill="url(#zkflowGradient)">zkFlow.pro</text>
  <text x="600" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="400" text-anchor="middle" fill="#1F2937">Professional Form Automation Suite</text>
  
  <!-- Problem/Solution -->
  <rect x="100" y="250" width="1000" height="120" rx="16" fill="white" stroke="#E5E7EB" stroke-width="2"/>
  <text x="600" y="285" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="#DC2626">Problem: Professionals waste 5+ hours/week on repetitive forms</text>
  <text x="600" y="320" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="#059669">Solution: Record once, replay anywhere with complete privacy</text>
  
  <!-- Features grid -->
  <g transform="translate(200,420)">
    <rect x="0" y="0" width="180" height="120" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
    <text x="90" y="30" font-size="32" text-anchor="middle">🔒</text>
    <text x="90" y="55" font-family="system-ui" font-size="14" font-weight="600" text-anchor="middle" fill="#1F2937">Privacy First</text>
    <text x="90" y="75" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Local storage only</text>
    
    <rect x="200" y="0" width="180" height="120" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
    <text x="290" y="30" font-size="32" text-anchor="middle">⚡</text>
    <text x="290" y="55" font-family="system-ui" font-size="14" font-weight="600" text-anchor="middle" fill="#1F2937">Time Saving</text>
    <text x="290" y="75" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">5+ hours/week</text>
    
    <rect x="400" y="0" width="180" height="120" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
    <text x="490" y="30" font-size="32" text-anchor="middle">🎯</text>
    <text x="490" y="55" font-family="system-ui" font-size="14" font-weight="600" text-anchor="middle" fill="#1F2937">Smart Detection</text>
    <text x="490" y="75" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Auto field mapping</text>
    
    <rect x="600" y="0" width="180" height="120" rx="12" fill="white" stroke="#E5E7EB" stroke-width="1"/>
    <text x="690" y="30" font-size="32" text-anchor="middle">💼</text>
    <text x="690" y="55" font-family="system-ui" font-size="14" font-weight="600" text-anchor="middle" fill="#1F2937">Professional</text>
    <text x="690" y="75" font-family="system-ui" font-size="12" text-anchor="middle" fill="#6B7280">Enterprise ready</text>
  </g>
  
  <!-- CTA -->
  <rect x="400" y="650" width="400" height="80" rx="40" fill="url(#zkflowGradient)"/>
  <text x="600" y="705" font-family="system-ui" font-size="24" font-weight="600" text-anchor="middle" fill="white">Try zkFlow.pro Free</text>
  
  <!-- Footer -->
  <text x="600" y="800" font-family="system-ui" font-size="16" text-anchor="middle" fill="#6B7280">Chrome Web Store • https://zkflow.pro</text>
  <text x="600" y="830" font-family="system-ui" font-size="14" text-anchor="middle" fill="#9CA3AF">Built by aegntic - AI-Powered Development Solutions</text>
</svg>`;

    // Save marketing banners
    fs.writeFileSync(path.join(this.mediaDir, 'social/twitter-card.svg'), twitterCard);
    fs.writeFileSync(path.join(this.mediaDir, 'social/linkedin-banner.svg'), linkedinBanner);

    console.log('✅ Marketing banners generated');
  }

  async generateSocialMediaGraphics() {
    console.log('\n📱 Generating Social Media Graphics...');

    // Instagram post template
    const instagramPost = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#igGradient)"/>
  
  <!-- Content area -->
  <rect x="80" y="80" width="920" height="920" rx="40" fill="white" opacity="0.95"/>
  
  <!-- Header -->
  <text x="540" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700" text-anchor="middle" fill="#1F2937">zkFlow.pro</text>
  <text x="540" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" text-anchor="middle" fill="#6B7280">Smart Form Automation</text>
  
  <!-- Main message -->
  <text x="540" y="350" font-family="system-ui" font-size="36" font-weight="600" text-anchor="middle" fill="#3B82F6">Save 5+ Hours</text>
  <text x="540" y="390" font-family="system-ui" font-size="36" font-weight="600" text-anchor="middle" fill="#3B82F6">Every Week</text>
  
  <!-- Feature highlights -->
  <text x="540" y="500" font-family="system-ui" font-size="24" font-weight="500" text-anchor="middle" fill="#1F2937">🔒 Privacy First</text>
  <text x="540" y="540" font-family="system-ui" font-size="24" font-weight="500" text-anchor="middle" fill="#1F2937">⚡ Lightning Fast</text>
  <text x="540" y="580" font-family="system-ui" font-size="24" font-weight="500" text-anchor="middle" fill="#1F2937">🎯 Smart Detection</text>
  <text x="540" y="620" font-family="system-ui" font-size="24" font-weight="500" text-anchor="middle" fill="#1F2937">🆓 Free to Use</text>
  
  <!-- How it works -->
  <text x="540" y="720" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="#8B5CF6">How it works:</text>
  <text x="540" y="760" font-family="system-ui" font-size="18" text-anchor="middle" fill="#6B7280">1. Record form workflow once</text>
  <text x="540" y="790" font-family="system-ui" font-size="18" text-anchor="middle" fill="#6B7280">2. Replay anywhere instantly</text>
  <text x="540" y="820" font-family="system-ui" font-size="18" text-anchor="middle" fill="#6B7280">3. Save hours every week</text>
  
  <!-- CTA -->
  <text x="540" y="900" font-family="system-ui" font-size="20" font-weight="600" text-anchor="middle" fill="#EC4899">Download from Chrome Web Store</text>
  <text x="540" y="930" font-family="system-ui" font-size="16" text-anchor="middle" fill="#6B7280">zkflow.pro</text>
</svg>`;

    // Feature highlight graphics
    const featureCards = `<!DOCTYPE html>
<html>
<head>
    <title>zkFlow.pro Feature Cards</title>
    <style>
        body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
        .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 800px; }
        .feature-card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            width: 300px;
            height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .feature-icon { font-size: 48px; margin-bottom: 20px; }
        .feature-title { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #1F2937; }
        .feature-description { font-size: 16px; color: #6B7280; line-height: 1.5; }
    </style>
</head>
<body>
    <h1>zkFlow.pro Feature Cards</h1>
    <div class="cards-grid">
        <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <div class="feature-title">Privacy First</div>
            <div class="feature-description">All your data stays on your device. No cloud storage, no tracking, complete control.</div>
        </div>
        
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <div class="feature-title">Lightning Fast</div>
            <div class="feature-description">Automate complex forms in seconds. Save 5+ hours every week on repetitive tasks.</div>
        </div>
        
        <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <div class="feature-title">Smart Detection</div>
            <div class="feature-description">Automatically detects and maps form fields across different websites.</div>
        </div>
        
        <div class="feature-card">
            <div class="feature-icon">🆓</div>
            <div class="feature-title">Free to Use</div>
            <div class="feature-description">Core features are completely free. Premium team features start at $9.99/month.</div>
        </div>
    </div>
</body>
</html>`;

    // Save social media graphics
    fs.writeFileSync(path.join(this.mediaDir, 'social/instagram-post.svg'), instagramPost);
    fs.writeFileSync(path.join(this.mediaDir, 'social/feature-cards.html'), featureCards);

    console.log('✅ Social media graphics generated');
  }

  async generatePresentationSlides() {
    console.log('\n📊 Generating Presentation Slides...');

    // Pitch deck slide template
    const pitchSlide = `<!DOCTYPE html>
<html>
<head>
    <title>zkFlow.pro Pitch Deck</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #3B82F6, #8B5CF6);
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        .slide {
            max-width: 800px;
            padding: 40px;
        }
        h1 {
            font-size: 4rem;
            font-weight: 700;
            margin-bottom: 20px;
            background: rgba(255,255,255,0.1);
            padding: 20px 40px;
            border-radius: 20px;
        }
        .subtitle {
            font-size: 1.5rem;
            font-weight: 400;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            margin: 40px 0;
        }
        .stat {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
        }
        .stat-number {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .stat-label {
            font-size: 1rem;
            opacity: 0.8;
        }
        .cta {
            font-size: 1.2rem;
            margin-top: 40px;
            padding: 20px 40px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="slide">
        <h1>zkFlow.pro</h1>
        <div class="subtitle">Smart Form Automation for Professionals</div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">5+</div>
                <div class="stat-label">Hours Saved Weekly</div>
            </div>
            <div class="stat">
                <div class="stat-number">$25k</div>
                <div class="stat-label">Target MRR Year 1</div>
            </div>
            <div class="stat">
                <div class="stat-number">100%</div>
                <div class="stat-label">Privacy Protected</div>
            </div>
        </div>
        
        <div class="cta">
            Record Once • Replay Anywhere • Save Time
        </div>
        
        <div style="margin-top: 40px; font-size: 0.9rem; opacity: 0.7;">
            Built by aegntic - AI-Powered Development Solutions
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(this.mediaDir, 'presentations/pitch-slide.html'), pitchSlide);
    console.log('✅ Presentation slides generated');
  }
}

// Execute visual generation
if (require.main === module) {
  const generator = new VisualGenerator();
  generator.generateAllVisuals().catch(console.error);
}

module.exports = VisualGenerator;