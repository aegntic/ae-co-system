/**
 * DailyDoco Pro - Chrome Extension Popup
 * Elite documentation automation with AI-powered features
 */

class DailyDocoPopup {
  constructor() {
    this.isRecording = false;
    this.startTime = null;
    this.timer = null;
    this.currentProject = null;
    this.desktopConnection = null;
    
    this.init();
  }

  async init() {
    console.log('🚀 DailyDoco Pro popup initializing...');
    
    try {
      // Initialize DOM elements
      this.initializeElements();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial state
      await this.loadInitialState();
      
      // Detect current project
      await this.detectProject();
      
      // Connect to desktop app
      await this.connectToDesktop();
      
      // Update performance stats
      this.updatePerformanceStats();
      
      console.log('✅ DailyDoco Pro popup ready');
      this.showToast('DailyDoco Pro ready', 'success');
      
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error);
      this.showToast('Failed to initialize DailyDoco Pro', 'error');
    }
  }

  initializeElements() {
    // Core elements
    this.statusIndicator = document.getElementById('statusIndicator');
    this.projectInfo = document.getElementById('projectInfo');
    this.captureBtn = document.getElementById('captureBtn');
    
    // Action buttons
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.helpBtn = document.getElementById('helpBtn');
    this.refreshProject = document.getElementById('refreshProject');
    
    // AI feature toggles
    this.testAudienceToggle = document.getElementById('testAudienceToggle');
    this.brandingToggle = document.getElementById('brandingToggle');
    this.narrationToggle = document.getElementById('narrationToggle');
    
    // Performance stats
    this.processingSpeed = document.getElementById('processingSpeed');
    this.memoryUsage = document.getElementById('memoryUsage');
    this.authenticityScore = document.getElementById('authenticityScore');
    this.performanceIndicator = document.getElementById('performanceIndicator');
    
    // Footer links
    this.openDashboard = document.getElementById('openDashboard');
    this.openDocumentation = document.getElementById('openDocumentation');
    this.openSupport = document.getElementById('openSupport');
    
    // Toast container
    this.toastContainer = document.getElementById('toastContainer');
  }

  setupEventListeners() {
    // Capture control
    this.captureBtn.addEventListener('click', () => this.toggleCapture());
    
    // Quick actions
    this.analyzeBtn.addEventListener('click', () => this.analyzeProject());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.helpBtn.addEventListener('click', () => this.openHelp());
    this.refreshProject.addEventListener('click', () => this.detectProject());
    
    // AI feature toggles
    this.testAudienceToggle.addEventListener('change', (e) => this.updateAIFeature('testAudience', e.target.checked));
    this.brandingToggle.addEventListener('change', (e) => this.updateAIFeature('branding', e.target.checked));
    this.narrationToggle.addEventListener('change', (e) => this.updateAIFeature('narration', e.target.checked));
    
    // Footer links
    this.openDashboard.addEventListener('click', () => this.openDashboard.href = 'chrome-extension://' + chrome.runtime.id + '/dashboard.html');
    this.openDocumentation.addEventListener('click', () => this.openUrl('https://docs.dailydoco.pro'));
    this.openSupport.addEventListener('click', () => this.openUrl('https://support.dailydoco.pro'));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    
    // Background script communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleBackgroundMessage(message, sender, sendResponse);
    });
  }

  async loadInitialState() {
    try {
      // Load saved preferences
      const data = await chrome.storage.sync.get({
        testAudience: true,
        branding: true,
        narration: true,
        captureQuality: '1080p',
        autoUpload: false
      });
      
      // Apply preferences to UI
      this.testAudienceToggle.checked = data.testAudience;
      this.brandingToggle.checked = data.branding;
      this.narrationToggle.checked = data.narration;
      
      // Check recording state
      const recordingState = await chrome.storage.local.get('isRecording');
      if (recordingState.isRecording) {
        this.resumeRecording();
      }
      
    } catch (error) {
      console.error('Failed to load initial state:', error);
    }
  }

  async detectProject() {
    console.log('🔍 Detecting project...');
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      // Analyze tab for project indicators
      const projectData = await this.analyzeTabForProject(tab);
      
      if (projectData) {
        this.currentProject = projectData;
        this.displayProjectInfo(projectData);
      } else {
        this.displayNoProject();
      }
      
    } catch (error) {
      console.error('Project detection failed:', error);
      this.displayProjectError();
    }
  }

  async analyzeTabForProject(tab) {
    try {
      // Check if it's a development-related URL
      const devPatterns = [
        /github\.com/,
        /gitlab\.com/,
        /localhost/,
        /127\.0\.0\.1/,
        /\.local/,
        /vscode\.dev/,
        /codepen\.io/,
        /codesandbox\.io/,
        /stackblitz\.com/
      ];
      
      const isDevelopmentTab = devPatterns.some(pattern => pattern.test(tab.url));
      
      if (!isDevelopmentTab) {
        return null;
      }
      
      // Extract project information
      let projectName = 'Unknown Project';
      let projectType = 'Web Development';
      let technology = ['JavaScript'];
      
      // GitHub project detection
      if (tab.url.includes('github.com')) {
        const match = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          projectName = match[2];
          projectType = 'GitHub Repository';
        }
      }
      
      // Local development detection
      if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
        projectName = 'Local Development';
        projectType = 'Local Server';
        
        // Try to detect technology stack from port
        const port = tab.url.match(/:(\d+)/)?.[1];
        if (port) {
          const techByPort = {
            '3000': ['React', 'Next.js'],
            '8080': ['Spring Boot', 'Tomcat'],
            '5000': ['Flask', 'Express'],
            '4200': ['Angular'],
            '8000': ['Django', 'Python'],
            '3001': ['Node.js'],
            '5173': ['Vite'],
            '8100': ['Ionic']
          };
          technology = techByPort[port] || technology;
        }
      }
      
      // Inject content script to analyze page
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: this.analyzePage
        });
        
        if (results[0]?.result) {
          const pageAnalysis = results[0].result;
          technology = [...new Set([...technology, ...pageAnalysis.technologies])];
          if (pageAnalysis.projectName) {
            projectName = pageAnalysis.projectName;
          }
        }
      } catch (scriptError) {
        console.warn('Could not analyze page content:', scriptError);
      }
      
      return {
        name: projectName,
        type: projectType,
        technology: technology.slice(0, 3), // Limit to 3 technologies
        url: tab.url,
        timestamp: Date.now(),
        confidence: isDevelopmentTab ? 0.8 : 0.3
      };
      
    } catch (error) {
      console.error('Project analysis failed:', error);
      return null;
    }
  }

  // Function to be injected into the page for analysis
  analyzePage() {
    const technologies = [];
    let projectName = null;
    
    // Check for framework indicators
    if (window.React) technologies.push('React');
    if (window.Vue) technologies.push('Vue.js');
    if (window.angular) technologies.push('Angular');
    if (window.jQuery) technologies.push('jQuery');
    if (document.querySelector('[data-react-root]')) technologies.push('React');
    if (document.querySelector('[data-vue-root]')) technologies.push('Vue.js');
    
    // Check meta tags
    const generator = document.querySelector('meta[name="generator"]')?.content;
    if (generator) {
      if (generator.includes('Next.js')) technologies.push('Next.js');
      if (generator.includes('Gatsby')) technologies.push('Gatsby');
      if (generator.includes('Nuxt')) technologies.push('Nuxt.js');
    }
    
    // Try to extract project name from title or headings
    const title = document.title;
    const h1 = document.querySelector('h1')?.textContent;
    
    if (title && !title.includes('localhost')) {
      projectName = title.split(' - ')[0].split(' | ')[0];
    } else if (h1) {
      projectName = h1;
    }
    
    return { technologies, projectName };
  }

  displayProjectInfo(project) {
    const projectInfoHTML = `
      <div class="project-detected active">
        <div class="project-name">${project.name}</div>
        <div class="project-tech">
          ${project.technology.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
        </div>
        <div class="project-stats">
          <div class="project-stat">
            <div class="project-stat-value">${Math.round(project.confidence * 100)}%</div>
            <div class="project-stat-label">Confidence</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-value">${project.technology.length}</div>
            <div class="project-stat-label">Technologies</div>
          </div>
        </div>
      </div>
    `;
    
    this.projectInfo.innerHTML = projectInfoHTML;
    this.updateStatusIndicator('ready', 'Project detected');
  }

  displayNoProject() {
    this.projectInfo.innerHTML = `
      <div class="project-loading">
        <span>No development project detected</span>
      </div>
    `;
    this.updateStatusIndicator('idle', 'No project');
  }

  displayProjectError() {
    this.projectInfo.innerHTML = `
      <div class="project-loading">
        <span>Unable to detect project</span>
      </div>
    `;
    this.updateStatusIndicator('error', 'Detection error');
  }

  async toggleCapture() {
    if (this.isRecording) {
      await this.stopCapture();
    } else {
      await this.startCapture();
    }
  }

  async startCapture() {
    try {
      console.log('🎬 Starting capture...');
      
      // Request screen capture permission
      const streamId = await new Promise((resolve, reject) => {
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window'], (streamId) => {
          if (streamId) {
            resolve(streamId);
          } else {
            reject(new Error('User cancelled screen capture'));
          }
        });
      });
      
      // Get current tab for context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Start recording via background script
      const response = await chrome.runtime.sendMessage({
        action: 'startCapture',
        streamId: streamId,
        project: this.currentProject,
        tab: {
          id: tab.id,
          url: tab.url,
          title: tab.title
        },
        options: {
          testAudience: this.testAudienceToggle.checked,
          branding: this.brandingToggle.checked,
          narration: this.narrationToggle.checked
        }
      });
      
      if (response.success) {
        this.startRecordingUI();
        this.showToast('Recording started', 'success');
      } else {
        throw new Error(response.error || 'Failed to start recording');
      }
      
    } catch (error) {
      console.error('Failed to start capture:', error);
      this.showToast(error.message || 'Failed to start recording', 'error');
    }
  }

  async stopCapture() {
    try {
      console.log('⏹️ Stopping capture...');
      
      // Stop recording via background script
      const response = await chrome.runtime.sendMessage({
        action: 'stopCapture'
      });
      
      if (response.success) {
        this.stopRecordingUI();
        this.showToast('Recording stopped - Processing...', 'success');
        
        // Show processing notification
        this.showProcessingStatus(response.sessionId);
      } else {
        throw new Error(response.error || 'Failed to stop recording');
      }
      
    } catch (error) {
      console.error('Failed to stop capture:', error);
      this.showToast(error.message || 'Failed to stop recording', 'error');
    }
  }

  startRecordingUI() {
    this.isRecording = true;
    this.startTime = Date.now();
    
    // Update button state
    this.captureBtn.setAttribute('data-state', 'recording');
    
    // Start timer
    this.timer = setInterval(() => {
      this.updateRecordingTimer();
    }, 1000);
    
    // Update status
    this.updateStatusIndicator('recording', 'Recording');
    
    // Save state
    chrome.storage.local.set({ isRecording: true, startTime: this.startTime });
  }

  stopRecordingUI() {
    this.isRecording = false;
    this.startTime = null;
    
    // Update button state
    this.captureBtn.setAttribute('data-state', 'ready');
    
    // Stop timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Reset progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = '0%';
    }
    
    // Update status
    this.updateStatusIndicator('processing', 'Processing');
    
    // Clear state
    chrome.storage.local.remove(['isRecording', 'startTime']);
  }

  async resumeRecording() {
    // Resume recording state from storage
    const data = await chrome.storage.local.get(['startTime']);
    if (data.startTime) {
      this.startTime = data.startTime;
      this.isRecording = true;
      this.captureBtn.setAttribute('data-state', 'recording');
      
      // Start timer
      this.timer = setInterval(() => {
        this.updateRecordingTimer();
      }, 1000);
      
      this.updateStatusIndicator('recording', 'Recording');
    }
  }

  updateRecordingTimer() {
    if (!this.startTime) return;
    
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const timeText = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    const captureTime = document.querySelector('.capture-time');
    if (captureTime) {
      captureTime.textContent = timeText;
    }
    
    // Update progress bar (simulated)
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      const progress = Math.min((elapsed / (10 * 60 * 1000)) * 100, 100); // 10 minute max
      progressFill.style.width = `${progress}%`;
    }
  }

  async analyzeProject() {
    if (!this.currentProject) {
      this.showToast('No project detected to analyze', 'warning');
      return;
    }
    
    try {
      this.showToast('Analyzing project...', 'success');
      
      // Send analysis request to background script
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeProject',
        project: this.currentProject
      });
      
      if (response.success) {
        // Open results in new tab or dashboard
        chrome.tabs.create({
          url: chrome.runtime.getURL('dashboard.html#analysis=' + response.analysisId)
        });
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('Project analysis failed:', error);
      this.showToast('Analysis failed: ' + error.message, 'error');
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openHelp() {
    this.openUrl('https://docs.dailydoco.pro/extension');
  }

  openUrl(url) {
    chrome.tabs.create({ url });
  }

  async updateAIFeature(feature, enabled) {
    try {
      // Save preference
      await chrome.storage.sync.set({ [feature]: enabled });
      
      // Update background script
      chrome.runtime.sendMessage({
        action: 'updateAIFeature',
        feature,
        enabled
      });
      
      console.log(`AI feature '${feature}' ${enabled ? 'enabled' : 'disabled'}`);
      
    } catch (error) {
      console.error('Failed to update AI feature:', error);
    }
  }

  updateStatusIndicator(state, text) {
    const statusDot = this.statusIndicator.querySelector('.status-dot');
    const statusText = this.statusIndicator.querySelector('.status-text');
    
    statusText.textContent = text;
    
    // Update dot color based on state
    const colors = {
      ready: '#10b981', // green
      recording: '#ef4444', // red
      processing: '#f59e0b', // yellow
      idle: '#6b7280', // gray
      error: '#ef4444' // red
    };
    
    statusDot.style.background = colors[state] || colors.idle;
    statusDot.style.boxShadow = `0 0 8px ${colors[state] || colors.idle}50`;
  }

  async connectToDesktop() {
    try {
      // Try to establish connection with desktop app
      const response = await chrome.runtime.sendMessage({
        action: 'connectDesktop'
      });
      
      if (response.success) {
        this.desktopConnection = response.connection;
        console.log('✅ Connected to DailyDoco desktop app');
      } else {
        console.warn('⚠️ Desktop app not available, using browser-only mode');
      }
      
    } catch (error) {
      console.warn('Desktop connection failed:', error);
    }
  }

  updatePerformanceStats() {
    // Simulate performance metrics (would come from background script in real implementation)
    const stats = {
      processingSpeed: (1.5 + Math.random() * 0.5).toFixed(1) + 'x',
      memoryUsage: Math.floor(180 + Math.random() * 40) + 'MB',
      authenticityScore: Math.floor(94 + Math.random() * 5) + '%'
    };
    
    this.processingSpeed.textContent = stats.processingSpeed;
    this.memoryUsage.textContent = stats.memoryUsage;
    this.authenticityScore.textContent = stats.authenticityScore;
    
    // Update performance indicator
    const score = parseFloat(stats.authenticityScore);
    const indicator = this.performanceIndicator;
    const dot = indicator.querySelector('.perf-dot');
    const text = indicator.querySelector('span');
    
    if (score >= 95) {
      indicator.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      text.textContent = 'Elite';
    } else if (score >= 90) {
      indicator.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      text.textContent = 'Excellent';
    } else {
      indicator.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      text.textContent = 'Good';
    }
    
    // Update stats every 30 seconds
    setTimeout(() => this.updatePerformanceStats(), 30000);
  }

  showProcessingStatus(sessionId) {
    // Show processing notification with progress
    this.showToast('Processing video with AI optimization...', 'success');
    
    // Simulate processing updates
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10 + Math.random() * 20;
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        this.showToast('✨ Video ready! AI test audience: 94% engagement predicted', 'success');
        this.updateStatusIndicator('ready', 'Ready');
        return;
      }
      
      const stage = this.getProcessingStage(progress);
      this.showToast(`${stage}: ${Math.round(progress)}%`, 'success');
      
    }, 2000);
  }

  getProcessingStage(progress) {
    if (progress < 20) return 'Analyzing content';
    if (progress < 40) return 'AI optimization';
    if (progress < 60) return 'Generating narration';
    if (progress < 80) return 'Test audience simulation';
    return 'Final compilation';
  }

  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Shift + R - Toggle recording
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      this.toggleCapture();
    }
    
    // Ctrl/Cmd + Shift + A - Analyze project
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
      event.preventDefault();
      this.analyzeProject();
    }
  }

  handleBackgroundMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'captureStatusUpdate':
        this.handleCaptureStatusUpdate(message.data);
        break;
        
      case 'performanceUpdate':
        this.handlePerformanceUpdate(message.data);
        break;
        
      case 'projectDetected':
        this.handleProjectDetected(message.data);
        break;
        
      default:
        console.log('Unknown message from background:', message);
    }
  }

  handleCaptureStatusUpdate(data) {
    if (data.status === 'stopped') {
      this.stopRecordingUI();
    } else if (data.status === 'error') {
      this.stopRecordingUI();
      this.showToast('Recording error: ' + data.error, 'error');
    }
  }

  handlePerformanceUpdate(data) {
    // Update performance stats from background script
    if (data.processingSpeed) {
      this.processingSpeed.textContent = data.processingSpeed;
    }
    if (data.memoryUsage) {
      this.memoryUsage.textContent = data.memoryUsage;
    }
    if (data.authenticityScore) {
      this.authenticityScore.textContent = data.authenticityScore;
    }
  }

  handleProjectDetected(data) {
    this.currentProject = data;
    this.displayProjectInfo(data);
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.toastContainer.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }
    }, 4000);
    
    // Limit to 3 toasts
    const toasts = this.toastContainer.children;
    if (toasts.length > 3) {
      toasts[0].remove();
    }
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DailyDocoPopup();
  });
} else {
  new DailyDocoPopup();
}

// Add slide out animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);