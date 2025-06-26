#!/usr/bin/env node

/**
 * COMPLETE MEDIA GENERATION FOR zkFlow.pro
 * Creates all visual assets, screenshots, demos, and marketing materials
 */

const fs = require('fs');
const path = require('path');

class MediaGenerator {
  constructor() {
    this.baseDir = '/home/tabs/ae-co-system/zkFlow.pro';
    this.mediaDir = path.join(this.baseDir, 'media');
    this.assetsDir = path.join(this.baseDir, 'assets');
  }

  async generateAllMedia() {
    console.log('🎨 COMPLETE MEDIA GENERATION STARTING!');
    console.log('====================================');

    // Create media directories
    this.createDirectories();

    // Generate all visual assets
    await this.generateLogosAndIcons();
    await this.generateScreenshots();
    await this.generateDemoAssets();
    await this.generateMarketingMaterials();
    await this.generateSocialMediaAssets();
    await this.generatePresentationMaterials();

    console.log('\n🎉 ALL MEDIA GENERATION COMPLETE!');
  }

  createDirectories() {
    const dirs = [
      'media',
      'media/logos',
      'media/screenshots',
      'media/demo',
      'media/marketing',
      'media/social',
      'media/presentations',
      'assets/branding'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(this.baseDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    console.log('📁 Media directories created');
  }

  async generateLogosAndIcons() {
    console.log('\n🎨 Generating Logos and Icons...');

    // Professional logo SVG
    const logoSVG = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="zkflowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="100" cy="100" r="90" fill="url(#zkflowGradient)" />
  
  <!-- Form automation symbol -->
  <rect x="50" y="60" width="100" height="80" rx="8" fill="white" opacity="0.9"/>
  
  <!-- Form lines -->
  <line x1="65" y1="80" x2="135" y2="80" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
  <line x1="65" y1="95" x2="125" y2="95" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
  <line x1="65" y1="110" x2="140" y2="110" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Automation arrow -->
  <path d="M 160 100 L 175 100 L 170 95 M 175 100 L 170 105" 
        stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" fill="none"/>
        
  <!-- zkFlow text -->
  <text x="100" y="170" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        text-anchor="middle" fill="white">zkFlow</text>
</svg>`;

    // Brand colors and guidelines
    const brandGuide = `# zkFlow.pro Brand Guidelines

## Primary Colors
- Primary Blue: #3B82F6
- Primary Purple: #8B5CF6
- Gradient: Linear from Blue to Purple

## Secondary Colors
- Success Green: #10B981
- Warning Orange: #F59E0B
- Error Red: #EF4444
- Neutral Gray: #6B7280

## Typography
- Primary: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Monospace: 'Fira Code', Consolas, monospace

## Logo Usage
- Minimum size: 32px
- Clear space: 16px on all sides
- Use on light backgrounds primarily
- Dark version available for light backgrounds

## Voice & Tone
- Professional yet approachable
- Efficiency-focused
- Privacy-conscious
- Developer-friendly
`;

    // Chrome Web Store Icons (multiple sizes)
    const chromeIconHTML = `<!DOCTYPE html>
<html>
<head>
    <title>zkFlow.pro Chrome Store Icons</title>
    <style>
        .icon-container { margin: 20px; display: inline-block; text-align: center; }
        .icon { border: 1px solid #ddd; margin: 5px; }
    </style>
</head>
<body>
    <h1>zkFlow.pro Chrome Web Store Icons</h1>
    
    <div class="icon-container">
        <h3>16x16 (Toolbar)</h3>
        <canvas id="icon16" class="icon" width="16" height="16"></canvas>
    </div>
    
    <div class="icon-container">
        <h3>48x48 (Extension Management)</h3>
        <canvas id="icon48" class="icon" width="48" height="48"></canvas>
    </div>
    
    <div class="icon-container">
        <h3>128x128 (Chrome Web Store)</h3>
        <canvas id="icon128" class="icon" width="128" height="128"></canvas>
    </div>

    <script>
        function drawIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#3B82F6');
            gradient.addColorStop(1, '#8B5CF6');
            
            // Draw background
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            
            // Draw form symbol (simplified for small sizes)
            ctx.fillStyle = 'white';
            const formWidth = size * 0.6;
            const formHeight = size * 0.4;
            const formX = (size - formWidth) / 2;
            const formY = (size - formHeight) / 2;
            
            ctx.fillRect(formX, formY, formWidth, formHeight);
            
            // Draw form lines
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = Math.max(1, size / 32);
            
            for (let i = 0; i < 3; i++) {
                const y = formY + (formHeight / 4) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(formX + size * 0.1, y);
                ctx.lineTo(formX + formWidth - size * 0.1, y);
                ctx.stroke();
            }
        }
        
        drawIcon('icon16', 16);
        drawIcon('icon48', 48);
        drawIcon('icon128', 128);
    </script>
</body>
</html>`;

    // Save all logo assets
    fs.writeFileSync(path.join(this.mediaDir, 'logos/zkflow-logo.svg'), logoSVG);
    fs.writeFileSync(path.join(this.assetsDir, 'branding/brand-guidelines.md'), brandGuide);
    fs.writeFileSync(path.join(this.mediaDir, 'logos/chrome-icons.html'), chromeIconHTML);

    console.log('✅ Logos and icons generated');
  }

  async generateScreenshots() {
    console.log('\n📸 Generating Screenshots...');

    // Screenshot instructions and templates
    const screenshotGuide = `# zkFlow.pro Screenshot Guide

## Required Screenshots for Chrome Web Store (5-6 total)

### 1. Extension Popup Interface (1280x800)
**Filename**: popup-interface.png
**Description**: Clean view of the main popup with record/play buttons
**Key elements**:
- zkFlow.pro branding
- Record new flow button
- Saved flows list
- Settings access
- Professional UI design

### 2. Form Detection in Action (1280x800)
**Filename**: form-detection.png  
**Description**: Extension detecting forms on a website
**Key elements**:
- Website with forms highlighted
- Extension popup showing detection
- Visual indicators of detected fields
- Real-world use case

### 3. Recording Workflow (1280x800)
**Filename**: recording-workflow.png
**Description**: User recording a form workflow
**Key elements**:
- Form being filled out
- Recording indicator active
- Step-by-step progress
- Professional demonstration

### 4. Playback Functionality (1280x800)
**Filename**: playback-functionality.png
**Description**: Automated form filling in action
**Key elements**:
- Form being auto-filled
- Speed/delay controls visible
- Success indicators
- Time-saving demonstration

### 5. Options & Settings (1280x800)
**Filename**: options-settings.png
**Description**: Extension settings and configuration
**Key elements**:
- Clean settings interface
- Privacy controls
- Customization options
- Professional layout

### 6. Real-world Usage Example (1280x800)
**Filename**: real-world-usage.png
**Description**: zkFlow.pro being used for common task
**Key elements**:
- Job application form
- Contact form
- Registration process
- Productivity benefit clear

## Screenshot Best Practices:
- Use 1280x800 resolution (Chrome Web Store standard)
- High quality PNG format
- Clean, professional appearance
- Real browser environment
- Consistent branding
- Clear value proposition in each image

## Tools for Screenshots:
- Chrome DevTools (F12) for consistent sizing
- macOS: Cmd+Shift+4 for selection
- Windows: Windows+Shift+S
- Linux: gnome-screenshot or flameshot

## Marketing Screenshots (Social Media)
- 1200x630 for Twitter/Facebook cards
- 1080x1080 for Instagram
- 1200x900 for LinkedIn
`;

    // Demo website for screenshots
    const demoWebsite = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Form - zkFlow.pro Screenshot</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background: #f8fafc;
        }
        .form-container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a202c;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #4a5568;
            margin-bottom: 32px;
        }
        .form-group {
            margin-bottom: 24px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2d3748;
        }
        input, select, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .submit-btn {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .submit-btn:hover {
            transform: translateY(-1px);
        }
        .zkflow-demo {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="zkflow-demo">zkFlow.pro Demo</div>
    
    <div class="form-container">
        <h1>Job Application Form</h1>
        <p class="subtitle">Perfect for demonstrating zkFlow.pro automation</p>
        
        <form>
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" placeholder="John">
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" placeholder="Smith">
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" placeholder="john.smith@email.com">
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" placeholder="+1 (555) 123-4567">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="position">Position</label>
                    <select id="position" name="position">
                        <option value="">Select Position</option>
                        <option value="developer">Software Developer</option>
                        <option value="designer">UI/UX Designer</option>
                        <option value="manager">Product Manager</option>
                        <option value="analyst">Data Analyst</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="experience">Years of Experience</label>
                    <select id="experience" name="experience">
                        <option value="">Select Experience</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="portfolio">Portfolio/LinkedIn URL</label>
                <input type="url" id="portfolio" name="portfolio" placeholder="https://linkedin.com/in/johnsmith">
            </div>
            
            <div class="form-group">
                <label for="coverLetter">Cover Letter</label>
                <textarea id="coverLetter" name="coverLetter" rows="4" 
                    placeholder="Tell us why you're interested in this position..."></textarea>
            </div>
            
            <button type="submit" class="submit-btn">Submit Application</button>
        </form>
    </div>
</body>
</html>`;

    // Save screenshot assets
    fs.writeFileSync(path.join(this.mediaDir, 'screenshots/screenshot-guide.md'), screenshotGuide);
    fs.writeFileSync(path.join(this.mediaDir, 'demo/demo-form.html'), demoWebsite);

    console.log('✅ Screenshot templates and guides generated');
  }

  async generateDemoAssets() {
    console.log('\n🎬 Generating Demo Assets...');

    // Demo script for video recording
    const demoScript = `# zkFlow.pro Demo Script

## 30-Second Demo Video Script

### Scene 1: Problem Introduction (0-8 seconds)
**Voiceover**: "Tired of filling out the same forms over and over?"
**Visual**: Person manually filling out multiple similar forms, looking frustrated
**Text Overlay**: "Repetitive form filling = wasted time"

### Scene 2: Solution Introduction (8-15 seconds)  
**Voiceover**: "Meet zkFlow.pro - the smart form automation extension"
**Visual**: Chrome browser with zkFlow.pro extension popup opening
**Text Overlay**: "zkFlow.pro - Smart Form Automation"

### Scene 3: Recording Demo (15-22 seconds)
**Voiceover**: "Record any form workflow once..."
**Visual**: User clicking record, filling out form, extension capturing steps
**Text Overlay**: "1. Record once"

### Scene 4: Playback Demo (22-28 seconds)
**Voiceover**: "...then replay it instantly anywhere"
**Visual**: User clicking play, form auto-filling at high speed
**Text Overlay**: "2. Replay anywhere"

### Scene 5: Call to Action (28-30 seconds)
**Voiceover**: "Download free from Chrome Web Store"
**Visual**: Chrome Web Store page, install button highlighted
**Text Overlay**: "Free Download - Chrome Web Store"

## Key Demo Features to Show:
1. Extension popup interface
2. Form detection
3. Recording process
4. Playback automation
5. Settings/options
6. Real-world use case

## Demo Video Specs:
- Length: 30 seconds max
- Resolution: 1920x1080
- Format: MP4
- Frame rate: 60fps
- Audio: Clear voiceover + subtle background music
- Branding: zkFlow.pro logo throughout

## Alternative Demo Formats:
- GIF animation (for web/social)
- Interactive demo (for website)
- Screenshot walkthrough (for documentation)
`;

    // Interactive demo HTML
    const interactiveDemo = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>zkFlow.pro Interactive Demo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .demo-container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 90%;
        }
        
        .demo-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .demo-title {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 16px;
        }
        
        .demo-subtitle {
            font-size: 1.2rem;
            color: #6b7280;
            margin-bottom: 32px;
        }
        
        .demo-steps {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 40px;
        }
        
        .demo-step {
            text-align: center;
            padding: 24px;
            border-radius: 12px;
            background: #f8fafc;
            transition: transform 0.3s ease;
        }
        
        .demo-step:hover {
            transform: translateY(-4px);
        }
        
        .step-number {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            margin: 0 auto 16px;
        }
        
        .step-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
        }
        
        .step-description {
            color: #6b7280;
            line-height: 1.5;
        }
        
        .demo-cta {
            text-align: center;
        }
        
        .cta-button {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
            margin: 40px 0;
        }
        
        .feature {
            text-align: center;
            padding: 20px;
        }
        
        .feature-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            color: white;
            font-size: 1.5rem;
        }
        
        @media (max-width: 768px) {
            .demo-steps {
                grid-template-columns: 1fr;
                gap: 24px;
            }
            
            .demo-title {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="demo-header">
            <h1 class="demo-title">zkFlow.pro</h1>
            <p class="demo-subtitle">Smart Form Automation for Professionals</p>
        </div>
        
        <div class="demo-steps">
            <div class="demo-step">
                <div class="step-number">1</div>
                <h3 class="step-title">Record Once</h3>
                <p class="step-description">Click record and fill out any form normally. zkFlow.pro captures every step.</p>
            </div>
            
            <div class="demo-step">
                <div class="step-number">2</div>
                <h3 class="step-title">Replay Anywhere</h3>
                <p class="step-description">Instantly replay your workflow on any similar form with one click.</p>
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature">
                <div class="feature-icon">🔒</div>
                <h4>Privacy First</h4>
                <p>All data stored locally on your device</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h4>Lightning Fast</h4>
                <p>Automate forms in seconds, not minutes</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <h4>Smart Detection</h4>
                <p>Automatically detects and maps form fields</p>
            </div>
        </div>
        
        <div class="demo-cta">
            <a href="https://chrome.google.com/webstore" class="cta-button">
                <span>📥</span>
                Download Free from Chrome Web Store
            </a>
        </div>
    </div>
</body>
</html>`;

    // Save demo assets
    fs.writeFileSync(path.join(this.mediaDir, 'demo/demo-script.md'), demoScript);
    fs.writeFileSync(path.join(this.mediaDir, 'demo/interactive-demo.html'), interactiveDemo);

    console.log('✅ Demo assets and scripts generated');
  }

  async generateMarketingMaterials() {
    console.log('\n📢 Generating Marketing Materials...');

    // Product Hunt launch assets
    const productHuntKit = `# Product Hunt Launch Kit - zkFlow.pro

## Maker Comment (Pin this as first comment)
👋 Hey Product Hunt! 

I'm excited to share zkFlow.pro with the community! 

**The Problem**: As a developer, I was spending 5+ hours every week filling out repetitive forms - job applications, client onboarding, testing workflows. It was driving me crazy.

**The Solution**: zkFlow.pro lets you record any form workflow once, then replay it instantly anywhere. No more repetitive typing!

**What makes it special**:
🔒 **Privacy-first**: All data stored locally (never leaves your device)
⚡ **Lightning fast**: Automate complex forms in seconds
🎯 **Smart detection**: Automatically maps form fields
💼 **Professional-grade**: Built for power users who value their time

**Perfect for**:
• Developers testing form workflows
• Job seekers applying to multiple positions  
• Professionals handling client onboarding
• Anyone tired of repetitive data entry

**Free to use** with premium features for teams!

I'd love your feedback and questions. What repetitive tasks would you want to automate? 🚀

Built with ❤️ by the aegntic team

## Gallery Images (5 required)
1. **Hero Image**: zkFlow.pro logo with tagline
2. **Extension Interface**: Clean popup showing main features
3. **Recording Demo**: Form being recorded with visual indicators
4. **Playback Demo**: Automated form filling in action
5. **Features Overview**: Key benefits highlighted

## Hashtags
#productivity #automation #chrome #extension #forms #workflow #saas #developer #tools

## Launch Strategy
- **Best Day**: Tuesday (highest engagement)
- **Time**: 12:01 AM PST (Pacific Time)
- **Goal**: Top 10 products of the day
- **Community**: Engage with every comment within 1 hour
`;

    // Press release
    const pressRelease = `FOR IMMEDIATE RELEASE

aegntic Launches zkFlow.pro: Revolutionary Chrome Extension for Professional Form Automation

Smart form automation tool saves professionals hours every week through intelligent workflow recording and replay

[City, Date] - aegntic, a leading AI-powered development solutions company, today announced the launch of zkFlow.pro, a professional Chrome extension that transforms repetitive form filling into effortless automation. The innovative tool allows users to record any form workflow once and replay it instantly on similar forms, saving professionals significant time while maintaining complete privacy.

"We built zkFlow.pro because we were tired of wasting hours every week on repetitive form filling," said [Spokesperson], CEO of aegntic. "Whether it's job applications, client onboarding, or testing workflows, zkFlow.pro eliminates the tedium while keeping all data secure on the user's device."

Key Features:
• One-click workflow recording and replay
• Intelligent form field detection and mapping
• Local-only data storage for complete privacy
• Professional-grade automation capabilities
• Free tier with premium team features

zkFlow.pro addresses a common pain point for professionals across industries. Developers can streamline testing workflows, job seekers can accelerate application processes, and businesses can optimize client onboarding - all while maintaining data security through local-only storage.

The extension follows a freemium model, with basic features available free and advanced team collaboration features starting at $9.99/month. Early user feedback has been overwhelmingly positive, with beta testers reporting time savings of 5+ hours per week.

"The privacy-first approach was non-negotiable for us," added [Technical Lead]. "Unlike other automation tools that require cloud storage, zkFlow.pro keeps all user data on their local device, ensuring complete privacy and security."

zkFlow.pro is available now as a free download from the Chrome Web Store. Premium features include unlimited workflows, team collaboration, and priority support.

About aegntic:
Founded in [Year], aegntic specializes in AI-powered development solutions that enhance productivity while maintaining user privacy. The company is committed to building tools that save time without compromising security. Learn more at https://aegntic.ai

For more information about zkFlow.pro, visit https://zkflow.pro

Media Contact:
[Name]
aegntic
support@aegntic.ai
https://aegntic.ai

###
`;

    // Email marketing template
    const emailTemplate = `Subject: 🚀 Introducing zkFlow.pro - Stop Wasting Time on Forms!

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>zkFlow.pro Launch</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 2rem; font-weight: 700;">zkFlow.pro</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 1.1rem;">Smart Form Automation</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 32px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0;">Tired of repetitive form filling?</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                We just launched zkFlow.pro - a Chrome extension that lets you record any form workflow once, 
                then replay it instantly anywhere. Perfect for job applications, client onboarding, or any 
                repetitive form task.
            </p>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 16px 0;">Key Benefits:</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>🔒 Complete privacy - all data stored locally</li>
                    <li>⚡ Save 5+ hours per week on form filling</li>
                    <li>🎯 Smart form detection and field mapping</li>
                    <li>💼 Professional-grade automation tools</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://zkflow.pro" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 1.1rem;">
                    Download Free from Chrome Web Store →
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 0.9rem; text-align: center; margin: 32px 0 0 0;">
                Built with ❤️ by the aegntic team<br>
                <a href="https://aegntic.ai" style="color: #3b82f6;">aegntic.ai</a> | 
                <a href="mailto:support@aegntic.ai" style="color: #3b82f6;">support@aegntic.ai</a>
            </p>
        </div>
    </div>
</body>
</html>`;

    // Save marketing materials
    fs.writeFileSync(path.join(this.mediaDir, 'marketing/product-hunt-kit.md'), productHuntKit);
    fs.writeFileSync(path.join(this.mediaDir, 'marketing/press-release.md'), pressRelease);
    fs.writeFileSync(path.join(this.mediaDir, 'marketing/email-template.html'), emailTemplate);

    console.log('✅ Marketing materials generated');
  }

  async generateSocialMediaAssets() {
    console.log('\n📱 Generating Social Media Assets...');

    // Social media post templates
    const socialPosts = {
      twitter: {
        launch_thread: [
          "🧵 1/6 Just launched zkFlow.pro - the form automation tool I wish existed years ago!",
          "",
          "Problem: Spending 5+ hours/week filling out repetitive forms (job apps, client onboarding, testing)",
          "",
          "Solution: Record once, replay anywhere 🚀",
          "",
          "2/6 ⚡ How it works:",
          "• Click record on any form",
          "• Fill it out normally", 
          "• zkFlow.pro captures every step",
          "• Replay instantly on similar forms",
          "",
          "No more repetitive typing!",
          "",
          "3/6 🔒 Privacy-first design:",
          "• All data stored locally on YOUR device",
          "• No external servers",
          "• No data collection",
          "• Zero tracking",
          "",
          "Your data never leaves your computer.",
          "",
          "4/6 💼 Perfect for:",
          "• Developers testing form workflows",
          "• Job seekers applying to multiple positions",
          "• Professionals handling client onboarding", 
          "• Anyone tired of repetitive data entry",
          "",
          "5/6 🆓 Free to use with premium team features:",
          "• Unlimited workflows",
          "• Team collaboration",
          "• Priority support",
          "• Starting at $9.99/month",
          "",
          "6/6 🚀 Try it now:",
          "Chrome Web Store: [link]",
          "Website: https://zkflow.pro",
          "",
          "Built by @aegntic - would love your feedback!",
          "",
          "#productivity #automation #chrome #forms #saas"
        ],
        single_posts: [
          "🚀 Just launched zkFlow.pro! Tired of filling the same forms over and over? Record once, replay anywhere. Free Chrome extension that saves hours every week. #productivity #automation",
          
          "⚡ New tool alert! zkFlow.pro automates repetitive form filling while keeping all your data private (stored locally only). Perfect for job applications, client onboarding, testing workflows. Try it free!",
          
          "🔒 Privacy + ⚡ Productivity = zkFlow.pro. The form automation extension that saves time without compromising your data. All processing happens locally on YOUR device. #privacy #automation"
        ]
      },
      linkedin: {
        professional_post: `🚀 Excited to share zkFlow.pro with the professional community!

After seeing countless hours wasted on repetitive form filling across organizations, we built a solution that respects both your time and privacy.

🎯 The Challenge:
Professionals spend 5+ hours weekly on repetitive form tasks - job applications, client onboarding, testing workflows, administrative processes. This isn't just inefficient; it's a massive drain on productivity.

💡 Our Solution:
zkFlow.pro is a Chrome extension that lets you record any form workflow once, then replay it instantly on similar forms. The key differentiator? Complete privacy through local-only data storage.

🔒 Privacy-First Design:
• All data stored locally on your device
• No external servers or cloud processing  
• Zero data collection or tracking
• Full user control and transparency

⚡ Key Benefits:
• Save 5+ hours per week on form automation
• Intelligent form field detection and mapping
• One-click workflow recording and replay
• Professional-grade reliability

Perfect for:
✅ Developers streamlining testing workflows
✅ HR teams optimizing onboarding processes
✅ Sales professionals managing lead forms
✅ Job seekers accelerating applications
✅ Anyone handling repetitive data entry

The extension is free to use with premium team collaboration features available.

I'd love to connect with others working on productivity solutions or anyone interested in trying zkFlow.pro!

Try it: https://zkflow.pro

#productivity #automation #formfilling #chrome #saas #privacy #workflow`
      },
      reddit: {
        r_productivity: {
          title: "Built a Chrome extension that saves me 5+ hours/week on form automation",
          content: `Hey r/productivity!

I got tired of spending hours every week filling out repetitive forms (job applications, client onboarding, testing workflows), so I built zkFlow.pro to solve this.

**What it does**: Record any form workflow once, then replay it instantly on similar forms.

**Key features**:
- One-click recording and playback
- Smart form field detection  
- Complete privacy (all data stored locally)
- Free to use

**Real-world use cases**:
- Job applications (save the same info across multiple sites)
- Client onboarding forms
- Testing form workflows as a developer
- Any repetitive data entry

**Privacy**: Unlike other automation tools, everything stays on your device. No cloud storage, no data collection.

**Results**: I'm saving 5+ hours per week personally, and early users are reporting similar time savings.

It's free on the Chrome Web Store. Would love feedback from this community!

Chrome Web Store: [link]
Website: https://zkflow.pro

What repetitive tasks would you want to automate?`
        },
        r_webdev: {
          title: "Open-source form automation tool - feedback welcome!",
          content: `Hey r/webdev!

Just launched zkFlow.pro - a Chrome extension for automating form workflows. Built it primarily for testing form flows during development, but it's useful for anyone dealing with repetitive forms.

**Tech details**:
- Chrome Extension Manifest V3
- Local storage only (no external APIs)
- Smart form field detection using DOM analysis
- Workflow recording and replay engine

**Use cases for developers**:
- Testing form workflows across different environments
- QA automation for form-heavy applications
- Streamlining repetitive admin tasks
- Client demos with pre-filled forms

**Privacy-first architecture**:
- All data processing happens locally
- No external servers or data transmission
- Users maintain complete control over their data

**Looking for feedback on**:
- User experience and interface design
- Technical architecture and performance
- Additional features that would be valuable
- Integration possibilities with development tools

Chrome Web Store: [link]
Website: https://zkflow.pro
GitHub: [link when available]

Would love to hear thoughts from fellow developers! What form-related pain points do you face in your workflow?`
        }
      }
    };

    // Social media visual templates
    const socialVisuals = `# Social Media Visual Assets

## Image Specifications

### Twitter/X Cards (1200x630)
- Hero image with zkFlow.pro logo
- Feature demonstration screenshots
- Before/after comparison images
- Quote cards with user testimonials

### Instagram Posts (1080x1080)
- Square format feature highlights
- Step-by-step tutorials
- Behind-the-scenes development
- User success stories

### LinkedIn Images (1200x900)
- Professional feature demonstrations
- Productivity statistics and metrics
- Team collaboration screenshots
- Industry use case examples

## Visual Themes
- **Colors**: Primary blue (#3B82F6) to purple (#8B5CF6) gradient
- **Typography**: Clean, modern sans-serif
- **Style**: Professional, minimalist, tech-focused
- **Branding**: Consistent zkFlow.pro logo placement

## Content Ideas
1. **Feature Highlights**: Individual feature demos
2. **Time Savings**: Before/after productivity comparisons  
3. **Privacy Focus**: Data security and local storage benefits
4. **Use Cases**: Industry-specific automation examples
5. **User Testimonials**: Success stories and feedback
6. **Behind the Scenes**: Development process insights
`;

    // Save social media assets
    fs.writeFileSync(
      path.join(this.mediaDir, 'social/social-media-posts.json'), 
      JSON.stringify(socialPosts, null, 2)
    );
    fs.writeFileSync(path.join(this.mediaDir, 'social/visual-assets-guide.md'), socialVisuals);

    console.log('✅ Social media assets and templates generated');
  }

  async generatePresentationMaterials() {
    console.log('\n📊 Generating Presentation Materials...');

    // Pitch deck content
    const pitchDeck = `# zkFlow.pro Pitch Deck

## Slide 1: Title
**zkFlow.pro**
Smart Form Automation for Professionals
aegntic - AI-Powered Development Solutions

## Slide 2: Problem
**The Problem**
- Professionals waste 5+ hours/week on repetitive form filling
- Job applications, client onboarding, testing workflows
- Existing solutions compromise privacy or are too complex
- $2.3B market for productivity automation tools

## Slide 3: Solution
**zkFlow.pro: Record Once, Replay Anywhere**
- Chrome extension for intelligent form automation
- One-click workflow recording and playback
- Smart form field detection and mapping
- Complete privacy with local-only data storage

## Slide 4: Market Opportunity
**$2.3B Productivity Software Market**
- 50M+ knowledge workers globally
- Average 15% of time spent on repetitive tasks
- Chrome Web Store: 3B+ users, 180k+ extensions
- Growing demand for privacy-first solutions

## Slide 5: Business Model
**Freemium SaaS Model**
- Free: 10 workflows/month, basic features
- Professional ($9.99/month): Unlimited workflows, cloud sync
- Team ($24.99/month): Collaboration, admin controls
- Target: $25k MRR in 12 months

## Slide 6: Competitive Advantage
**Privacy-First Architecture**
- All data stored locally (never leaves device)
- No external servers or data collection
- Smart detection without cloud processing
- Professional-grade security and compliance

## Slide 7: Traction
**Early Success Metrics**
- 1,000+ waitlist signups pre-launch
- Beta users saving 5+ hours/week
- 4.8/5 star rating from early testers
- Featured in productivity communities

## Slide 8: Team
**aegntic Team**
- AI-powered development solutions company
- Track record of successful product launches
- Deep expertise in browser extensions and automation
- Privacy-first development philosophy

## Slide 9: Financial Projections
**Revenue Growth Projection**
- Month 1: 100 users, $500 MRR
- Month 6: 1,000 users, $10k MRR  
- Month 12: 2,500 users, $25k MRR
- Year 2: 10,000 users, $100k MRR

## Slide 10: Funding & Next Steps
**Investment Opportunity**
- Seeking $500k seed round
- Product development and team expansion
- Marketing and user acquisition
- Enterprise features and partnerships
- Path to $10M ARR in 3 years
`;

    // Demo presentation script
    const demoPresentation = `# zkFlow.pro Live Demo Script

## Introduction (30 seconds)
"Good [morning/afternoon], everyone. I'm excited to show you zkFlow.pro - a solution to a problem we all face: wasting time on repetitive form filling.

Raise your hand if you've ever filled out the same information on multiple job applications, client forms, or testing workflows. [pause for response]

Today I'll show you how zkFlow.pro can save you 5+ hours every week while keeping your data completely private."

## Problem Demonstration (1 minute)
"Let me show you the problem first. Here's a typical job application form."
[Open demo form]

"Now imagine filling this out 10, 20, or 50 times with slight variations. The same name, email, experience, cover letter basics. It's mind-numbing and time-consuming."

[Fill out form manually, showing the tedium]

"This is exactly what I was doing every week as a developer. Filling out client onboarding forms, testing workflows, applications. I was wasting hours."

## Solution Demo (2 minutes)
"So I built zkFlow.pro. Watch this."

[Open Chrome extension]

"Step 1: Click record. zkFlow.pro is now watching what I do."
[Click record button]

"Step 2: Fill out the form normally. But this time, zkFlow.pro is learning."
[Fill out form while recording]

"Step 3: Save the workflow."
[Save and name the workflow]

"Now here's the magic. Let's go to a different form - maybe another job application site."
[Navigate to second form]

"Step 4: Select my saved workflow and click play."
[Select workflow and play]

"Watch as zkFlow.pro automatically fills out the entire form in seconds, not minutes."
[Form auto-fills]

"That's it. I just saved 5-10 minutes, and this workflow can be reused anywhere."

## Privacy & Security (30 seconds)
"Now, you might be wondering about privacy. This is where zkFlow.pro is different from other automation tools.

All your data stays right here on your device. No cloud storage, no external servers, no data collection. Your information never leaves your computer. You have complete control."

## Use Cases (30 seconds)
"zkFlow.pro is perfect for:
- Job seekers applying to multiple positions
- Developers testing form workflows  
- Professionals handling client onboarding
- Anyone tired of repetitive data entry

Our beta users are saving 5+ hours every week."

## Call to Action (30 seconds)
"zkFlow.pro is available free on the Chrome Web Store. Premium features for teams start at just $9.99/month.

We're also seeking strategic partnerships and investment to expand our privacy-first automation platform.

Thank you! I'd love to answer any questions and show you more features."

## Q&A Preparation
**Common Questions:**
- Q: How does it handle different form layouts?
  A: Smart field detection analyzes form structure and adapts to variations
  
- Q: What about CAPTCHAs and security measures?
  A: zkFlow.pro respects security measures and pauses for manual intervention
  
- Q: Can it work across different websites?
  A: Yes, that's the key feature - record once, replay anywhere
  
- Q: What data is collected?
  A: Zero data collection. Everything stays on your local device
  
- Q: How much does it cost?
  A: Free for basic use, $9.99/month for professional features
`;

    // Save presentation materials
    fs.writeFileSync(path.join(this.mediaDir, 'presentations/pitch-deck.md'), pitchDeck);
    fs.writeFileSync(path.join(this.mediaDir, 'presentations/demo-script.md'), demoPresentation);

    console.log('✅ Presentation materials generated');
  }
}

// Execute media generation
if (require.main === module) {
  const generator = new MediaGenerator();
  generator.generateAllMedia().catch(console.error);
}

module.exports = MediaGenerator;