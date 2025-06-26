// Flow playback functionality
const FlowPlayer = {
  isPlaying: false,
  currentFlow: null,
  actionIndex: 0,
  
  // Play a recorded flow
  async play(flow) {
    if (this.isPlaying) {
      console.warn('zkFlow: Already playing a flow');
      return;
    }
    
    this.isPlaying = true;
    this.currentFlow = flow;
    this.actionIndex = 0;
    
    console.log('zkFlow: Playing flow', flow.name);
    
    try {
      // Show playback indicator
      this.showPlaybackIndicator();
      
      // Execute each action
      for (let i = 0; i < flow.actions.length; i++) {
        this.actionIndex = i;
        const action = flow.actions[i];
        
        await this.executeAction(action);
        
        // Add delay between actions for realism
        if (i < flow.actions.length - 1) {
          await this.delay(this.getActionDelay(action, flow.actions[i + 1]));
        }
      }
      
      console.log('zkFlow: Flow completed successfully');
      this.showCompletionMessage('Flow completed successfully!');
      
    } catch (error) {
      console.error('zkFlow: Error playing flow', error);
      this.showErrorMessage(`Error: ${error.message}`);
      
    } finally {
      this.isPlaying = false;
      this.hidePlaybackIndicator();
    }
  },
  
  // Execute a single action
  async executeAction(action) {
    console.log('zkFlow: Executing action', action);
    
    switch (action.type) {
      case 'navigation':
        await this.executeNavigation(action);
        break;
        
      case 'focus':
        await this.executeFocus(action);
        break;
        
      case 'input':
        await this.executeInput(action);
        break;
        
      case 'change':
        await this.executeChange(action);
        break;
        
      case 'click':
        await this.executeClick(action);
        break;
        
      case 'keypress':
        await this.executeKeypress(action);
        break;
        
      case 'dom-change':
        await this.waitForDOMChange(action);
        break;
        
      default:
        console.warn('zkFlow: Unknown action type', action.type);
    }
  },
  
  // Execute navigation
  async executeNavigation(action) {
    if (window.location.href !== action.url) {
      window.location.href = action.url;
      // Flow will continue after page reload
    }
  },
  
  // Execute focus
  async executeFocus(action) {
    const element = await this.waitForElement(action.selector);
    element.focus();
    
    // Trigger focus event
    element.dispatchEvent(new Event('focus', { bubbles: true }));
  },
  
  // Execute input
  async executeInput(action) {
    const element = await this.waitForElement(action.selector);
    
    // Clear existing value
    element.value = '';
    
    // Type the value character by character for realism
    for (let i = 0; i < action.value.length; i++) {
      element.value = action.value.substring(0, i + 1);
      
      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Small delay between characters
      await this.delay(30 + Math.random() * 70);
    }
    
    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
  },
  
  // Execute change
  async executeChange(action) {
    const element = await this.waitForElement(action.selector);
    
    if (element.type === 'checkbox' || element.type === 'radio') {
      if (element.checked !== action.checked) {
        element.click();
      }
    } else if (element.tagName === 'SELECT') {
      element.value = action.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      element.value = action.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
  
  // Execute click
  async executeClick(action) {
    const element = await this.waitForElement(action.selector);
    
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.delay(300);
    
    // Highlight the element briefly
    this.highlightElement(element);
    
    // Click the element
    element.click();
    
    // Also dispatch click event in case of custom handlers
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  },
  
  // Execute keypress
  async executeKeypress(action) {
    const element = await this.waitForElement(action.selector);
    
    const event = new KeyboardEvent('keydown', {
      key: action.key,
      code: this.getKeyCode(action.key),
      bubbles: true,
      cancelable: true
    });
    
    element.dispatchEvent(event);
  },
  
  // Wait for DOM change
  async waitForDOMChange(action) {
    if (action.change === 'element-added') {
      await this.waitForElement(action.selector, 10000);
    }
  },
  
  // Wait for element with timeout
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element && this.isElementVisible(element)) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not found: ${selector}`));
          return;
        }
        
        requestAnimationFrame(checkElement);
      };
      
      checkElement();
    });
  },
  
  // Check if element is visible
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  },
  
  // Highlight element during playback
  highlightElement(element) {
    const originalOutline = element.style.outline;
    element.style.outline = '2px solid #5b4cdb';
    
    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 500);
  },
  
  // Get delay between actions
  getActionDelay(currentAction, nextAction) {
    // Use recorded timestamps if available
    if (currentAction.timestamp && nextAction.timestamp) {
      const delay = nextAction.timestamp - currentAction.timestamp;
      // Cap delay at 3 seconds
      return Math.min(delay, 3000);
    }
    
    // Default delays based on action types
    if (currentAction.type === 'input') return 500;
    if (currentAction.type === 'click') return 1000;
    if (currentAction.type === 'navigation') return 2000;
    
    return 300;
  },
  
  // Get key code from key
  getKeyCode(key) {
    const keyCodes = {
      'Tab': 'Tab',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Space': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight'
    };
    
    return keyCodes[key] || key;
  },
  
  // Show playback indicator
  showPlaybackIndicator() {
    if (this.indicator) return;
    
    this.indicator = document.createElement('div');
    this.indicator.id = 'zkflow-playback-indicator';
    this.indicator.innerHTML = `
      <div class="zkflow-indicator-icon">▶</div>
      <span>Playing Flow</span>
      <div class="zkflow-progress">
        <div class="zkflow-progress-bar" style="width: 0%"></div>
      </div>
    `;
    
    document.body.appendChild(this.indicator);
  },
  
  // Update progress
  updateProgress() {
    if (!this.indicator || !this.currentFlow) return;
    
    const progress = (this.actionIndex / this.currentFlow.actions.length) * 100;
    const progressBar = this.indicator.querySelector('.zkflow-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  },
  
  // Hide playback indicator
  hidePlaybackIndicator() {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = null;
    }
  },
  
  // Show completion message
  showCompletionMessage(message) {
    this.showToast(message, 'success');
  },
  
  // Show error message
  showErrorMessage(message) {
    this.showToast(message, 'error');
  },
  
  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `zkflow-toast zkflow-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('zkflow-toast-show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('zkflow-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'playFlow') {
    FlowPlayer.play(request.flow);
    sendResponse({ success: true });
  }
  
  return true;
});

// Export for use in other scripts
window.FlowPlayer = FlowPlayer;