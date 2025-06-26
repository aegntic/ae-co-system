/**
 * DailyDoco Pro - Content Script
 * Intelligent activity detection and in-page UI integration
 */

class DailyDocoContentScript {
  constructor() {
    this.isActive = false;
    this.activityDetector = null;
    this.overlayManager = null;
    this.projectAnalyzer = null;
    this.isRecording = false;
    
    this.init();
  }

  async init() {
    // Only initialize on development-related pages
    if (!this.isDevelopmentPage()) {
      return;
    }

    console.log('🔍 DailyDoco Pro content script initializing...');

    try {
      // Initialize components
      this.activityDetector = new ActivityDetector();
      this.overlayManager = new OverlayManager();
      this.projectAnalyzer = new ProjectAnalyzer();

      // Set up event listeners
      this.setupEventListeners();
      
      // Start activity detection
      this.startActivityDetection();
      
      // Analyze page for project info
      await this.analyzeCurrentPage();
      
      this.isActive = true;
      console.log('✅ DailyDoco Pro content script ready');

    } catch (error) {
      console.error('❌ Content script initialization failed:', error);
    }
  }

  isDevelopmentPage() {
    const url = window.location.href;
    const devPatterns = [
      /github\.com/,
      /gitlab\.com/,
      /localhost/,
      /127\.0\.0\.1/,
      /\.local/,
      /vscode\.dev/,
      /codepen\.io/,
      /codesandbox\.io/,
      /stackblitz\.com/,
      /repl\.it/,
      /jsfiddle\.net/
    ];

    return devPatterns.some(pattern => pattern.test(url)) ||
           document.body.innerHTML.includes('code') ||
           document.querySelector('pre, code, .hljs, .code') !== null;
  }

  setupEventListeners() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Listen for keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Listen for page changes
    const observer = new MutationObserver(() => {
      this.handlePageChange();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  startActivityDetection() {
    this.activityDetector.start();
    
    // Listen for detected activities
    this.activityDetector.on('activity', (activity) => {
      this.handleDetectedActivity(activity);
    });
  }

  async analyzeCurrentPage() {
    const analysis = await this.projectAnalyzer.analyzePage();
    
    // Send analysis to background script
    chrome.runtime.sendMessage({
      action: 'pageAnalysis',
      data: analysis
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'startRecording':
        this.startRecording();
        sendResponse({ success: true });
        break;

      case 'stopRecording':
        this.stopRecording();
        sendResponse({ success: true });
        break;

      case 'highlightElement':
        this.highlightElement(message.selector);
        sendResponse({ success: true });
        break;

      case 'getPageInfo':
        const pageInfo = this.getPageInfo();
        sendResponse({ success: true, data: pageInfo });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Shift + R - Toggle recording
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      this.toggleRecording();
    }

    // Ctrl/Cmd + Shift + H - Highlight current element
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
      event.preventDefault();
      this.highlightCurrentElement();
    }
  }

  handlePageChange() {
    // Re-analyze page when content changes significantly
    clearTimeout(this.pageChangeTimer);
    this.pageChangeTimer = setTimeout(() => {
      this.analyzeCurrentPage();
    }, 1000);
  }

  handleDetectedActivity(activity) {
    console.log('📊 Activity detected:', activity);

    // Send activity to background script
    chrome.runtime.sendMessage({
      action: 'activityDetected',
      data: {
        type: activity.type,
        timestamp: activity.timestamp,
        element: activity.element,
        importance: activity.importance,
        url: window.location.href
      }
    });

    // Show visual feedback if recording
    if (this.isRecording && activity.importance > 0.7) {
      this.overlayManager.showActivityIndicator(activity);
    }
  }

  startRecording() {
    this.isRecording = true;
    this.overlayManager.showRecordingIndicator();
    console.log('🎬 Recording started in content script');
  }

  stopRecording() {
    this.isRecording = false;
    this.overlayManager.hideRecordingIndicator();
    console.log('⏹️ Recording stopped in content script');
  }

  toggleRecording() {
    // Send toggle request to background script
    chrome.runtime.sendMessage({
      action: 'toggleRecording'
    });
  }

  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      this.overlayManager.highlightElement(element);
    }
  }

  highlightCurrentElement() {
    const element = document.activeElement || document.elementFromPoint(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
    
    if (element) {
      this.overlayManager.highlightElement(element);
    }
  }

  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      technologies: this.projectAnalyzer.detectTechnologies(),
      codeElements: this.projectAnalyzer.findCodeElements(),
      timestamp: Date.now()
    };
  }
}

// Activity Detector Class
class ActivityDetector {
  constructor() {
    this.listeners = new Map();
    this.lastActivity = Date.now();
    this.activityBuffer = [];
  }

  start() {
    this.setupDetectors();
    console.log('🔍 Activity detection started');
  }

  setupDetectors() {
    // Mouse click detection
    document.addEventListener('click', (e) => {
      this.recordActivity({
        type: 'click',
        element: this.getElementInfo(e.target),
        importance: this.calculateClickImportance(e.target),
        timestamp: Date.now()
      });
    });

    // Keyboard input detection
    document.addEventListener('keydown', (e) => {
      this.recordActivity({
        type: 'keydown',
        key: e.key,
        element: this.getElementInfo(e.target),
        importance: this.calculateKeyImportance(e),
        timestamp: Date.now()
      });
    });

    // Form submission detection
    document.addEventListener('submit', (e) => {
      this.recordActivity({
        type: 'form_submit',
        element: this.getElementInfo(e.target),
        importance: 0.9,
        timestamp: Date.now()
      });
    });

    // Code editor detection
    this.detectCodeEditorActivity();

    // GitHub-specific detection
    if (window.location.hostname === 'github.com') {
      this.setupGitHubDetection();
    }

    // VS Code Web detection
    if (window.location.hostname === 'vscode.dev') {
      this.setupVSCodeDetection();
    }
  }

  detectCodeEditorActivity() {
    // Detect common code editors
    const editorSelectors = [
      '.monaco-editor', // Monaco (VS Code)
      '.CodeMirror', // CodeMirror
      '.ace_editor', // Ace Editor
      'textarea[class*="code"]',
      'div[class*="editor"]'
    ];

    editorSelectors.forEach(selector => {
      const editors = document.querySelectorAll(selector);
      editors.forEach(editor => {
        this.setupEditorListeners(editor);
      });
    });
  }

  setupEditorListeners(editor) {
    let lastValue = '';
    
    const checkForChanges = () => {
      const currentValue = this.getEditorValue(editor);
      if (currentValue !== lastValue) {
        this.recordActivity({
          type: 'code_edit',
          element: this.getElementInfo(editor),
          importance: 0.8,
          timestamp: Date.now(),
          changes: {
            added: currentValue.length - lastValue.length,
            content: currentValue.slice(-50) // Last 50 characters
          }
        });
        lastValue = currentValue;
      }
    };

    // Check for changes every 2 seconds
    setInterval(checkForChanges, 2000);
  }

  setupGitHubDetection() {
    // Detect GitHub-specific actions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for file navigation
          const fileLinks = document.querySelectorAll('a[href*="/blob/"]');
          fileLinks.forEach(link => {
            if (!link.dataset.dailydocoTracked) {
              link.dataset.dailydocoTracked = 'true';
              link.addEventListener('click', () => {
                this.recordActivity({
                  type: 'github_file_view',
                  element: { href: link.href, text: link.textContent },
                  importance: 0.7,
                  timestamp: Date.now()
                });
              });
            }
          });

          // Check for commit actions
          const commitButtons = document.querySelectorAll('button[type="submit"][form*="commit"]');
          commitButtons.forEach(button => {
            if (!button.dataset.dailydocoTracked) {
              button.dataset.dailydocoTracked = 'true';
              button.addEventListener('click', () => {
                this.recordActivity({
                  type: 'github_commit',
                  element: this.getElementInfo(button),
                  importance: 0.95,
                  timestamp: Date.now()
                });
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupVSCodeDetection() {
    // Detect VS Code Web specific activities
    const observer = new MutationObserver(() => {
      // File explorer clicks
      const fileItems = document.querySelectorAll('.monaco-list-row[data-id*="file:"]');
      fileItems.forEach(item => {
        if (!item.dataset.dailydocoTracked) {
          item.dataset.dailydocoTracked = 'true';
          item.addEventListener('click', () => {
            this.recordActivity({
              type: 'vscode_file_open',
              element: this.getElementInfo(item),
              importance: 0.75,
              timestamp: Date.now()
            });
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  recordActivity(activity) {
    this.activityBuffer.push(activity);
    
    // Keep buffer size manageable
    if (this.activityBuffer.length > 100) {
      this.activityBuffer.shift();
    }

    // Emit activity event
    this.emit('activity', activity);
  }

  calculateClickImportance(element) {
    let importance = 0.3; // Base importance

    // Higher importance for interactive elements
    if (element.tagName === 'BUTTON') importance += 0.3;
    if (element.tagName === 'A') importance += 0.2;
    if (element.type === 'submit') importance += 0.4;

    // Higher importance for code-related elements
    if (element.closest('pre, code, .hljs')) importance += 0.3;
    if (element.closest('.monaco-editor, .CodeMirror')) importance += 0.4;

    // GitHub-specific importance
    if (window.location.hostname === 'github.com') {
      if (element.closest('.file-navigation')) importance += 0.3;
      if (element.textContent.includes('commit')) importance += 0.5;
    }

    return Math.min(importance, 1.0);
  }

  calculateKeyImportance(event) {
    let importance = 0.2; // Base importance

    // Higher importance for special keys
    if (event.ctrlKey || event.metaKey) importance += 0.3;
    if (event.key === 'Enter') importance += 0.2;
    if (event.key === 'Tab') importance += 0.1;

    // Higher importance in code editors
    if (event.target.closest('.monaco-editor, .CodeMirror, pre, code')) {
      importance += 0.4;
    }

    return Math.min(importance, 1.0);
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      textContent: element.textContent?.slice(0, 100),
      href: element.href,
      type: element.type
    };
  }

  getEditorValue(editor) {
    // Try different methods to get editor value
    if (editor.value !== undefined) return editor.value;
    if (editor.textContent !== undefined) return editor.textContent;
    if (window.monaco && editor.classList.contains('monaco-editor')) {
      // Monaco editor
      const model = window.monaco.editor.getModels()[0];
      return model ? model.getValue() : '';
    }
    return '';
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Overlay Manager Class
class OverlayManager {
  constructor() {
    this.recordingIndicator = null;
    this.highlightElements = [];
  }

  showRecordingIndicator() {
    if (this.recordingIndicator) return;

    this.recordingIndicator = document.createElement('div');
    this.recordingIndicator.id = 'dailydoco-recording-indicator';
    this.recordingIndicator.innerHTML = `
      <div class="recording-dot"></div>
      <span>Recording</span>
    `;

    // Apply styles
    this.recordingIndicator.style.cssText = `
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
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease;
    `;

    // Add pulsing dot
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      #dailydoco-recording-indicator .recording-dot {
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.recordingIndicator);
  }

  hideRecordingIndicator() {
    if (this.recordingIndicator) {
      this.recordingIndicator.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        if (this.recordingIndicator && this.recordingIndicator.parentNode) {
          this.recordingIndicator.remove();
        }
        this.recordingIndicator = null;
      }, 300);
    }
  }

  showActivityIndicator(activity) {
    const indicator = document.createElement('div');
    indicator.className = 'dailydoco-activity-indicator';
    indicator.textContent = activity.type.replace('_', ' ');

    indicator.style.cssText = `
      position: absolute;
      background: rgba(79, 143, 255, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 9999;
      pointer-events: none;
      animation: fadeInOut 2s ease;
    `;

    // Position near mouse cursor
    const mouseX = activity.element?.clientX || window.innerWidth / 2;
    const mouseY = activity.element?.clientY || window.innerHeight / 2;
    
    indicator.style.left = mouseX + 'px';
    indicator.style.top = (mouseY - 30) + 'px';

    document.body.appendChild(indicator);

    // Remove after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 2000);
  }

  highlightElement(element) {
    // Remove existing highlights
    this.clearHighlights();

    // Create highlight overlay
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'dailydoco-highlight';

    highlight.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 2px solid #4f8fff;
      border-radius: 4px;
      background: rgba(79, 143, 255, 0.1);
      z-index: 9998;
      pointer-events: none;
      animation: highlightPulse 2s ease;
    `;

    document.body.appendChild(highlight);
    this.highlightElements.push(highlight);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      this.clearHighlights();
    }, 3000);
  }

  clearHighlights() {
    this.highlightElements.forEach(element => {
      if (element.parentNode) {
        element.remove();
      }
    });
    this.highlightElements = [];
  }
}

// Project Analyzer Class
class ProjectAnalyzer {
  constructor() {
    this.cache = new Map();
  }

  async analyzePage() {
    const cacheKey = window.location.href;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const analysis = {
      url: window.location.href,
      title: document.title,
      technologies: this.detectTechnologies(),
      projectType: this.detectProjectType(),
      codeElements: this.findCodeElements(),
      confidence: 0.5,
      timestamp: Date.now()
    };

    // Calculate confidence based on detected elements
    analysis.confidence = this.calculateConfidence(analysis);

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  detectTechnologies() {
    const technologies = [];

    // Check global objects
    if (window.React) technologies.push('React');
    if (window.Vue) technologies.push('Vue.js');
    if (window.angular) technologies.push('Angular');
    if (window.jQuery) technologies.push('jQuery');

    // Check meta tags
    const generator = document.querySelector('meta[name="generator"]')?.content;
    if (generator) {
      if (generator.includes('Next.js')) technologies.push('Next.js');
      if (generator.includes('Gatsby')) technologies.push('Gatsby');
      if (generator.includes('Nuxt')) technologies.push('Nuxt.js');
    }

    // Check for framework-specific elements
    if (document.querySelector('[data-react-root], [data-reactroot]')) {
      technologies.push('React');
    }
    if (document.querySelector('[data-vue-root]')) {
      technologies.push('Vue.js');
    }

    // Check script tags
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach(script => {
      const src = script.src;
      if (src.includes('react')) technologies.push('React');
      if (src.includes('vue')) technologies.push('Vue.js');
      if (src.includes('angular')) technologies.push('Angular');
      if (src.includes('bootstrap')) technologies.push('Bootstrap');
    });

    return [...new Set(technologies)];
  }

  detectProjectType() {
    const url = window.location.href;
    
    if (url.includes('github.com')) return 'GitHub Repository';
    if (url.includes('gitlab.com')) return 'GitLab Repository';
    if (url.includes('vscode.dev')) return 'VS Code Web';
    if (url.includes('codepen.io')) return 'CodePen Project';
    if (url.includes('codesandbox.io')) return 'CodeSandbox Project';
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local Development';
    
    return 'Web Development';
  }

  findCodeElements() {
    const codeElements = [];

    // Find code blocks
    const codeBlocks = document.querySelectorAll('pre, code, .hljs, .monaco-editor, .CodeMirror');
    codeBlocks.forEach((element, index) => {
      codeElements.push({
        type: 'code_block',
        index,
        tagName: element.tagName,
        className: element.className,
        textLength: element.textContent?.length || 0,
        visible: this.isElementVisible(element)
      });
    });

    // Find file elements (GitHub specific)
    if (window.location.hostname === 'github.com') {
      const fileElements = document.querySelectorAll('.file-navigation a, .js-navigation-open');
      fileElements.forEach((element, index) => {
        codeElements.push({
          type: 'file_link',
          index,
          href: element.href,
          filename: element.textContent?.trim(),
          visible: this.isElementVisible(element)
        });
      });
    }

    return codeElements;
  }

  calculateConfidence(analysis) {
    let confidence = 0.3; // Base confidence

    // Higher confidence for known development sites
    const devSites = ['github.com', 'gitlab.com', 'vscode.dev', 'codepen.io'];
    if (devSites.some(site => analysis.url.includes(site))) {
      confidence += 0.4;
    }

    // Higher confidence for detected technologies
    confidence += Math.min(analysis.technologies.length * 0.1, 0.3);

    // Higher confidence for code elements
    confidence += Math.min(analysis.codeElements.length * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.bottom <= window.innerHeight;
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DailyDocoContentScript();
  });
} else {
  new DailyDocoContentScript();
}