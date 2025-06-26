// UltraPlan Popup Script
import { ExtensionMessageType, ProjectAnalysis } from '../shared/types';

class PopupController {
  private analyzeBtn: HTMLButtonElement;
  private dashboardBtn: HTMLButtonElement;
  private statusEl: HTMLElement;
  private statusTextEl: HTMLElement;
  private recentListEl: HTMLElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadRecentAnalyses();
    this.checkCurrentTab();
  }

  private initializeElements() {
    this.analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
    this.dashboardBtn = document.getElementById('dashboard-btn') as HTMLButtonElement;
    this.statusEl = document.getElementById('status') as HTMLElement;
    this.statusTextEl = document.getElementById('status-text') as HTMLElement;
    this.recentListEl = document.getElementById('recent-list') as HTMLElement;
  }

  private setupEventListeners() {
    this.analyzeBtn.addEventListener('click', () => this.handleAnalyze());
    this.dashboardBtn.addEventListener('click', () => this.openDashboard());
  }

  private async checkCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (this.isRepositoryPage(tab.url)) {
      this.updateStatus('ready', 'Ready to analyze');
      this.analyzeBtn.disabled = false;
    } else {
      this.updateStatus('error', 'Not on a repository page');
      this.analyzeBtn.disabled = true;
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

  private async handleAnalyze() {
    this.updateStatus('analyzing', 'Analyzing repository...');
    this.analyzeBtn.disabled = true;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id!, {
        type: ExtensionMessageType.ANALYZE_PROJECT
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded, inject it
          chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            files: ['content-script.js']
          }).then(() => {
            // Retry after injection
            chrome.tabs.sendMessage(tab.id!, {
              type: ExtensionMessageType.ANALYZE_PROJECT
            });
          });
        }
      });
      
      // Close popup - analysis will continue in background
      window.close();
    } catch (error) {
      this.updateStatus('error', 'Analysis failed');
      this.analyzeBtn.disabled = false;
    }
  }

  private openDashboard() {
    chrome.runtime.sendMessage({
      type: ExtensionMessageType.OPEN_WEBAPP,
      payload: { url: 'https://app.ultraplan.ai/dashboard' }
    });
    window.close();
  }

  private updateStatus(type: 'ready' | 'analyzing' | 'error', text: string) {
    const statusIcon = this.statusEl.querySelector('.status-icon')!;
    statusIcon.className = `status-icon ${type}`;
    this.statusTextEl.textContent = text;
  }

  private async loadRecentAnalyses() {
    const { analyses = [] } = await chrome.storage.local.get('analyses');
    
    if (analyses.length === 0) {
      this.recentListEl.innerHTML = '<div style="color: #999; font-size: 13px;">No recent analyses</div>';
      return;
    }
    
    // Show last 3 analyses
    const recent = analyses.slice(-3).reverse();
    
    this.recentListEl.innerHTML = recent.map((analysis: ProjectAnalysis) => `
      <div class="recent-item" data-id="${analysis.id}">
        <div class="name">${analysis.name}</div>
        <div class="time">${this.formatTime(analysis.timestamp)}</div>
      </div>
    `).join('');
    
    // Add click handlers
    this.recentListEl.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        this.openAnalysis(id!);
      });
    });
  }

  private formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }

  private openAnalysis(id: string) {
    chrome.runtime.sendMessage({
      type: ExtensionMessageType.OPEN_WEBAPP,
      payload: { url: `https://app.ultraplan.ai/analysis/${id}` }
    });
    window.close();
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});