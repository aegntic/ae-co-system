// UltraPlan Background Service Worker
import { ExtensionMessage, ExtensionMessageType, ProjectAnalysis } from '../shared/types';

class BackgroundService {
  private apiBaseUrl = 'https://api.ultraplan.ai';
  private webappUrl = 'https://app.ultraplan.ai';
  private currentAnalysis: ProjectAnalysis | null = null;

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Listen for extension icon clicks
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.checkForRepository(tab);
      }
    });
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    switch (message.type) {
      case ExtensionMessageType.ANALYSIS_COMPLETE:
        await this.handleAnalysisComplete(message.payload, sendResponse);
        break;

      case ExtensionMessageType.GENERATE_PLAN:
        await this.handleGeneratePlan(message.payload, sendResponse);
        break;

      case ExtensionMessageType.AUTH_REQUEST:
        await this.handleAuthRequest(sendResponse);
        break;

      case ExtensionMessageType.OPEN_WEBAPP:
        await this.openWebapp(message.payload);
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private async handleAnalysisComplete(
    analysis: ProjectAnalysis,
    sendResponse: (response: any) => void
  ) {
    try {
      // Store analysis
      this.currentAnalysis = analysis;
      await this.saveAnalysis(analysis);

      // Send to webapp API
      const response = await this.sendAnalysisToAPI(analysis);

      // Update extension badge
      this.updateBadge('✓', '#4CAF50');

      // Open webapp with analysis
      const webappUrl = `${this.webappUrl}/analysis/${response.analysisId}`;
      chrome.tabs.create({ url: webappUrl });

      sendResponse({ success: true, analysisId: response.analysisId });
    } catch (error) {
      console.error('Failed to handle analysis:', error);
      sendResponse({ error: error.message });
    }
  }

  private async handleGeneratePlan(
    preferences: any,
    sendResponse: (response: any) => void
  ) {
    try {
      if (!this.currentAnalysis) {
        throw new Error('No analysis available');
      }

      const response = await fetch(`${this.apiBaseUrl}/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await this.getAuthToken()
        },
        body: JSON.stringify({
          analysis: this.currentAnalysis,
          preferences
        })
      });

      const plan = await response.json();
      sendResponse({ success: true, plan });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  private async handleAuthRequest(sendResponse: (response: any) => void) {
    try {
      const token = await this.authenticateUser();
      sendResponse({ success: true, token });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  private async authenticateUser(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  private async getAuthToken(): Promise<string> {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      return await this.authenticateUser();
    }
    return authToken;
  }

  private async saveAnalysis(analysis: ProjectAnalysis) {
    const { analyses = [] } = await chrome.storage.local.get('analyses');
    analyses.push(analysis);
    
    // Keep only last 10 analyses
    if (analyses.length > 10) {
      analyses.shift();
    }
    
    await chrome.storage.local.set({ analyses });
  }

  private async sendAnalysisToAPI(analysis: ProjectAnalysis): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await this.getAuthToken()
      },
      body: JSON.stringify(analysis)
    });

    if (!response.ok) {
      throw new Error('Failed to send analysis to API');
    }

    return response.json();
  }

  private async openWebapp(payload: any) {
    const url = payload.url || this.webappUrl;
    chrome.tabs.create({ url });
  }

  private handleActionClick(tab: chrome.tabs.Tab) {
    if (this.isRepositoryPage(tab.url)) {
      // Inject content script if not already injected
      chrome.tabs.sendMessage(tab.id!, {
        type: ExtensionMessageType.ANALYZE_PROJECT
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not injected, inject it
          this.injectContentScript(tab.id!);
        }
      });
    } else {
      // Open webapp dashboard
      chrome.tabs.create({ url: this.webappUrl });
    }
  }

  private checkForRepository(tab: chrome.tabs.Tab) {
    if (this.isRepositoryPage(tab.url)) {
      this.updateBadge('', '#667eea');
    } else {
      this.updateBadge('', '');
    }
  }

  private isRepositoryPage(url?: string): boolean {
    if (!url) return false;
    
    const repoPatterns = [
      /github\.com\/[\w-]+\/[\w-]+/,
      /gitlab\.com\/[\w-]+\/[\w-]+/,
      /bitbucket\.org\/[\w-]+\/[\w-]+/
    ];
    
    return repoPatterns.some(pattern => pattern.test(url));
  }

  private updateBadge(text: string, color: string) {
    chrome.action.setBadgeText({ text });
    if (color) {
      chrome.action.setBadgeBackgroundColor({ color });
    }
  }

  private async injectContentScript(tabId: number) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js']
      });
      
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['styles.css']
      });
    } catch (error) {
      console.error('Failed to inject content script:', error);
    }
  }
}

// Initialize background service
new BackgroundService();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding page
    chrome.tabs.create({
      url: 'https://app.ultraplan.ai/welcome'
    });
  }
});

// Handle extension uninstall
chrome.runtime.setUninstallURL('https://app.ultraplan.ai/feedback');