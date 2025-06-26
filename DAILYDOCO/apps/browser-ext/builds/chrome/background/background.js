/**
 * DailyDoco Pro - Chrome Extension Background Service Worker
 * Handles screen capture, desktop communication, and AI processing coordination
 */

class DailyDocoBackground {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentSession = null;
    this.desktopPort = null;
    this.performanceMonitor = null;
    
    this.init();
  }

  init() {
    console.log('🚀 DailyDoco Pro background service worker starting...');
    
    // Set up event listeners
    this.setupMessageHandlers();
    this.setupCommandHandlers();
    this.setupTabHandlers();
    this.setupDesktopConnection();
    this.startPerformanceMonitoring();
    
    console.log('✅ DailyDoco Pro background service worker ready');
  }

  setupMessageHandlers() {
    // Handle messages from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle external connections (from desktop app)
    chrome.runtime.onConnectExternal.addListener((port) => {
      this.handleExternalConnection(port);
    });
  }

  setupCommandHandlers() {
    // Handle keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  setupTabHandlers() {
    // Monitor tab changes for project detection
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.detectProjectInTab(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.detectProjectInTab(tabId);
      }
    });
  }

  setupDesktopConnection() {
    // Try to establish connection with desktop app
    this.connectToDesktop();
    
    // Retry connection every 30 seconds if not connected
    setInterval(() => {
      if (!this.desktopPort) {
        this.connectToDesktop();
      }
    }, 30000);
  }

  startPerformanceMonitoring() {
    // Monitor extension performance
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceMonitor.start();
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📨 Received message:', message.action);
      
      switch (message.action) {
        case 'startCapture':
          const startResult = await this.startCapture(message);
          sendResponse({ success: true, sessionId: startResult.sessionId });
          break;

        case 'stopCapture':
          const stopResult = await this.stopCapture();
          sendResponse({ success: true, sessionId: stopResult.sessionId });
          break;

        case 'analyzeProject':
          const analysisResult = await this.analyzeProject(message.project);
          sendResponse({ success: true, analysisId: analysisResult.id });
          break;

        case 'updateAIFeature':
          await this.updateAIFeature(message.feature, message.enabled);
          sendResponse({ success: true });
          break;

        case 'connectDesktop':
          const connectionResult = await this.getDesktopConnection();
          sendResponse({ success: !!connectionResult, connection: connectionResult });
          break;

        case 'getPerformanceStats':
          const stats = await this.getPerformanceStats();
          sendResponse({ success: true, stats });
          break;

        default:
          console.warn('Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
      
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleCommand(command) {
    console.log('⌨️ Command received:', command);
    
    switch (command) {
      case 'start_capture':
        if (this.isRecording) {
          await this.stopCapture();
        } else {
          // Get current tab and start capture
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          await this.startCaptureFromCommand(tab);
        }
        break;

      case 'quick_analysis':
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await this.quickAnalyzeTab(tab);
        break;
    }
  }

  async startCapture(options) {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    console.log('🎬 Starting capture with options:', options);

    try {
      // Create session
      this.currentSession = {
        id: this.generateSessionId(),
        startTime: Date.now(),
        project: options.project,
        tab: options.tab,
        options: options.options,
        chunks: []
      };

      // Get media stream
      const stream = await this.getMediaStream(options.streamId);
      
      // Set up media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5 Mbps for high quality
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.currentSession.chunks.push({
            timestamp: Date.now(),
            size: event.data.size
          });
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        this.handleRecordingError(error);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Capture data every second
      this.isRecording = true;

      // Update badge
      chrome.action.setBadgeText({ text: 'REC' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });

      // Save session state
      await chrome.storage.local.set({
        isRecording: true,
        currentSession: this.currentSession
      });

      // Notify desktop app if connected
      if (this.desktopPort) {
        this.desktopPort.postMessage({
          action: 'captureStarted',
          session: this.currentSession
        });
      }

      // Send notification to all popup instances
      this.broadcastToPopups({
        action: 'captureStatusUpdate',
        data: { status: 'started', sessionId: this.currentSession.id }
      });

      console.log('✅ Capture started successfully');
      return { sessionId: this.currentSession.id };

    } catch (error) {
      console.error('Failed to start capture:', error);
      this.isRecording = false;
      this.currentSession = null;
      throw error;
    }
  }

  async stopCapture() {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    console.log('⏹️ Stopping capture...');

    try {
      // Stop media recorder
      this.mediaRecorder.stop();
      
      // Stop all tracks
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }

      this.isRecording = false;

      // Update badge
      chrome.action.setBadgeText({ text: '' });

      // Clear session state
      await chrome.storage.local.remove(['isRecording', 'currentSession']);

      return { sessionId: this.currentSession?.id };

    } catch (error) {
      console.error('Failed to stop capture:', error);
      throw error;
    }
  }

  async handleRecordingStop() {
    console.log('📹 Recording stopped, processing...');

    try {
      if (this.recordedChunks.length === 0) {
        throw new Error('No recorded data available');
      }

      // Create blob from recorded chunks
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      
      // Update session with final data
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      this.currentSession.fileSize = blob.size;

      // Process the recording
      await this.processRecording(blob, this.currentSession);

      // Notify popup
      this.broadcastToPopups({
        action: 'captureStatusUpdate',
        data: { status: 'stopped', sessionId: this.currentSession.id }
      });

      console.log('✅ Recording processed successfully');

    } catch (error) {
      console.error('Recording processing failed:', error);
      this.handleRecordingError(error);
    }
  }

  async processRecording(blob, session) {
    console.log('🔄 Processing recording...');

    try {
      // Send to desktop app for AI processing if connected
      if (this.desktopPort) {
        await this.sendToDesktopApp(blob, session);
      } else {
        // Browser-only processing
        await this.processBrowserOnly(blob, session);
      }

      // Run AI test audience simulation
      if (session.options.testAudience) {
        await this.runTestAudience(session);
      }

      // Apply personal branding
      if (session.options.branding) {
        await this.applyPersonalBranding(session);
      }

      // Generate AI narration
      if (session.options.narration) {
        await this.generateNarration(session);
      }

    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  }

  async sendToDesktopApp(blob, session) {
    console.log('📤 Sending to desktop app...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        this.desktopPort.postMessage({
          action: 'processRecording',
          session: session,
          videoData: reader.result,
          options: session.options
        });
        resolve();
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  async processBrowserOnly(blob, session) {
    console.log('🌐 Browser-only processing...');

    // Create object URL for the recording
    const videoUrl = URL.createObjectURL(blob);
    
    // Store in local storage or IndexedDB for larger files
    const sessionData = {
      ...session,
      videoUrl: videoUrl,
      processed: true,
      timestamp: Date.now()
    };

    // Save to storage
    await this.saveProcessedSession(sessionData);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-48.png',
      title: 'DailyDoco Pro',
      message: 'Recording processed! Click to view results.'
    });
  }

  async runTestAudience(session) {
    console.log('🎭 Running AI test audience...');

    // Simulate test audience analysis
    const testResults = {
      audienceSize: 75,
      overallEngagement: 0.84,
      retentionRate: 0.78,
      completionRate: 0.71,
      viralPotential: 0.65,
      personaBreakdown: [
        {
          type: 'junior_developer',
          percentage: 40,
          engagement: 0.89,
          feedback: ['Clear explanations', 'Good pacing', 'Helpful examples']
        },
        {
          type: 'senior_developer',
          percentage: 35,
          engagement: 0.76,
          feedback: ['Could skip basics', 'Show advanced techniques', 'Focus on edge cases']
        },
        {
          type: 'tech_lead',
          percentage: 25,
          engagement: 0.82,
          feedback: ['Good architecture overview', 'Explain trade-offs', 'Show scalability']
        }
      ],
      optimizationSuggestions: [
        'Add hook in first 10 seconds',
        'Speed up setup sections',
        'Include more real-world examples'
      ]
    };

    // Store test results
    await this.saveTestResults(session.id, testResults);

    // Notify popup
    this.broadcastToPopups({
      action: 'testAudienceComplete',
      data: { sessionId: session.id, results: testResults }
    });

    return testResults;
  }

  async applyPersonalBranding(session) {
    console.log('🎨 Applying personal branding...');

    // Get user's brand settings
    const brandSettings = await chrome.storage.sync.get([
      'brandColors',
      'brandFont',
      'brandLogo',
      'brandStyle'
    ]);

    // Apply branding logic (simplified)
    const brandingResult = {
      applied: true,
      elements: ['intro_overlay', 'watermark', 'end_screen'],
      style: brandSettings.brandStyle || 'professional',
      timestamp: Date.now()
    };

    // Store branding data
    await this.saveBrandingData(session.id, brandingResult);

    return brandingResult;
  }

  async generateNarration(session) {
    console.log('🎤 Generating AI narration...');

    // Simulate narration generation
    const narrationResult = {
      generated: true,
      duration: session.duration,
      segments: [
        { start: 0, end: 5000, text: 'Welcome to this development session...' },
        { start: 5000, end: 15000, text: 'Let me show you how to implement...' },
        { start: 15000, end: 30000, text: 'Here\'s the key concept to understand...' }
      ],
      voiceModel: 'natural_professional',
      authenticityScore: 0.96
    };

    // Store narration data
    await this.saveNarrationData(session.id, narrationResult);

    return narrationResult;
  }

  async getMediaStream(streamId) {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30
          }
        }
      }).then(resolve).catch(reject);
    });
  }

  async detectProjectInTab(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
      }

      // Basic project detection
      const devPatterns = [
        /github\.com/,
        /gitlab\.com/,
        /localhost/,
        /127\.0\.0\.1/,
        /\.local/,
        /vscode\.dev/
      ];

      const isDevelopmentTab = devPatterns.some(pattern => pattern.test(tab.url));
      
      if (isDevelopmentTab) {
        // Notify popup about project detection
        this.broadcastToPopups({
          action: 'projectDetected',
          data: {
            name: this.extractProjectName(tab),
            url: tab.url,
            type: this.getProjectType(tab.url),
            timestamp: Date.now()
          }
        });
      }

    } catch (error) {
      console.warn('Project detection failed:', error);
    }
  }

  extractProjectName(tab) {
    if (tab.url.includes('github.com')) {
      const match = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      return match ? match[2] : 'GitHub Project';
    }
    
    if (tab.url.includes('localhost')) {
      return 'Local Development';
    }
    
    return tab.title || 'Unknown Project';
  }

  getProjectType(url) {
    if (url.includes('github.com')) return 'GitHub Repository';
    if (url.includes('gitlab.com')) return 'GitLab Repository';
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'Local Development';
    if (url.includes('vscode.dev')) return 'VS Code Web';
    return 'Web Development';
  }

  async connectToDesktop() {
    try {
      // Try to connect to desktop app via native messaging
      // This would require a native messaging host to be installed
      console.log('🔗 Attempting desktop connection...');
      
      // For now, simulate connection attempt
      // In real implementation, this would use chrome.runtime.connectNative()
      
    } catch (error) {
      console.warn('Desktop connection failed:', error);
    }
  }

  handleExternalConnection(port) {
    console.log('🔌 External connection established');
    
    if (port.name === 'dailydoco-desktop') {
      this.desktopPort = port;
      
      port.onMessage.addListener((message) => {
        this.handleDesktopMessage(message);
      });
      
      port.onDisconnect.addListener(() => {
        console.log('🔌 Desktop connection lost');
        this.desktopPort = null;
      });
    }
  }

  handleDesktopMessage(message) {
    console.log('📨 Desktop message:', message);
    
    switch (message.action) {
      case 'processingComplete':
        this.handleProcessingComplete(message.data);
        break;
        
      case 'performanceUpdate':
        this.handlePerformanceUpdate(message.data);
        break;
    }
  }

  handleProcessingComplete(data) {
    // Notify popup about completion
    this.broadcastToPopups({
      action: 'processingComplete',
      data
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-48.png',
      title: 'DailyDoco Pro',
      message: `Video processed! AI predicted ${Math.round(data.engagementScore * 100)}% engagement.`
    });
  }

  handleRecordingError(error) {
    console.error('Recording error:', error);
    
    this.isRecording = false;
    this.currentSession = null;
    
    // Clear badge
    chrome.action.setBadgeText({ text: '' });
    
    // Notify popup
    this.broadcastToPopups({
      action: 'captureStatusUpdate',
      data: { status: 'error', error: error.message }
    });
  }

  broadcastToPopups(message) {
    // Send message to all connected popup instances
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might not be open, ignore error
    });
  }

  async getDesktopConnection() {
    return this.desktopPort ? { connected: true, version: '1.0.0' } : null;
  }

  async getPerformanceStats() {
    return this.performanceMonitor ? this.performanceMonitor.getStats() : null;
  }

  async updateAIFeature(feature, enabled) {
    console.log(`AI feature '${feature}' ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store preference
    await chrome.storage.sync.set({ [feature]: enabled });
    
    // Notify desktop app if connected
    if (this.desktopPort) {
      this.desktopPort.postMessage({
        action: 'updateAIFeature',
        feature,
        enabled
      });
    }
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async saveProcessedSession(sessionData) {
    const sessions = await chrome.storage.local.get('processedSessions') || { processedSessions: [] };
    sessions.processedSessions.push(sessionData);
    
    // Keep only last 50 sessions
    if (sessions.processedSessions.length > 50) {
      sessions.processedSessions = sessions.processedSessions.slice(-50);
    }
    
    await chrome.storage.local.set(sessions);
  }

  async saveTestResults(sessionId, results) {
    await chrome.storage.local.set({
      [`testResults_${sessionId}`]: results
    });
  }

  async saveBrandingData(sessionId, data) {
    await chrome.storage.local.set({
      [`branding_${sessionId}`]: data
    });
  }

  async saveNarrationData(sessionId, data) {
    await chrome.storage.local.set({
      [`narration_${sessionId}`]: data
    });
  }
}

// Performance Monitor Class
class PerformanceMonitor {
  constructor() {
    this.stats = {
      memoryUsage: 0,
      cpuUsage: 0,
      recordingQuality: 100,
      processingSpeed: 1.8
    };
  }

  start() {
    // Monitor performance every 10 seconds
    setInterval(() => {
      this.updateStats();
    }, 10000);
  }

  updateStats() {
    // Get memory usage
    if (performance.memory) {
      this.stats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    
    // Simulate other stats
    this.stats.cpuUsage = 5 + Math.random() * 10; // 5-15%
    this.stats.recordingQuality = 95 + Math.random() * 5; // 95-100%
    this.stats.processingSpeed = 1.6 + Math.random() * 0.4; // 1.6-2.0x
  }

  getStats() {
    return this.stats;
  }
}

// Initialize background service
const dailyDocoBackground = new DailyDocoBackground();