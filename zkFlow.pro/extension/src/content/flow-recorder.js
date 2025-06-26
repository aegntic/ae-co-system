// Flow recording functionality
const FlowRecorder = {
  isRecording: false,
  recordedActions: [],
  observers: [],
  
  // Start recording
  start() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recordedActions = [];
    
    // Add event listeners
    this.attachListeners();
    
    // Show recording indicator
    this.showRecordingIndicator();
    
    console.log('zkFlow: Recording started');
  },
  
  // Stop recording
  stop() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    // Remove event listeners
    this.detachListeners();
    
    // Hide recording indicator
    this.hideRecordingIndicator();
    
    console.log('zkFlow: Recording stopped', this.recordedActions);
    
    return this.recordedActions;
  },
  
  // Attach event listeners
  attachListeners() {
    // Input events
    this.handleInput = this.recordInput.bind(this);
    this.handleChange = this.recordChange.bind(this);
    this.handleClick = this.recordClick.bind(this);
    this.handleFocus = this.recordFocus.bind(this);
    this.handleKeydown = this.recordKeydown.bind(this);
    
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('keydown', this.handleKeydown, true);
    
    // Observe DOM changes
    this.domObserver = new MutationObserver((mutations) => {
      this.handleDOMChanges(mutations);
    });
    
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'disabled', 'hidden']
    });
  },
  
  // Detach event listeners
  detachListeners() {
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('keydown', this.handleKeydown, true);
    
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
  },
  
  // Record input event
  recordInput(event) {
    const target = event.target;
    
    if (!this.isFormElement(target)) return;
    
    // Debounce input events
    clearTimeout(this.inputTimeout);
    this.inputTimeout = setTimeout(() => {
      this.addAction({
        type: 'input',
        selector: FormDetector.getSelector(target),
        value: target.value,
        fieldType: FormDetector.detectFieldType(target),
        timestamp: Date.now()
      });
    }, 500);
  },
  
  // Record change event
  recordChange(event) {
    const target = event.target;
    
    if (!this.isFormElement(target)) return;
    
    const action = {
      type: 'change',
      selector: FormDetector.getSelector(target),
      timestamp: Date.now()
    };
    
    if (target.type === 'checkbox' || target.type === 'radio') {
      action.checked = target.checked;
      action.value = target.value;
    } else if (target.tagName === 'SELECT') {
      action.value = target.value;
      action.selectedText = target.options[target.selectedIndex]?.text;
    } else {
      action.value = target.value;
    }
    
    this.addAction(action);
  },
  
  // Record click event
  recordClick(event) {
    const target = event.target;
    
    // Check if it's a submit button or link
    if (FormDetector.isSubmitButton(target) || target.tagName === 'A') {
      this.addAction({
        type: 'click',
        selector: FormDetector.getSelector(target),
        text: target.textContent?.trim() || target.value,
        href: target.href,
        timestamp: Date.now()
      });
      
      // Record navigation if it's a link
      if (target.tagName === 'A' && target.href) {
        this.addAction({
          type: 'navigation',
          url: target.href,
          timestamp: Date.now() + 100
        });
      }
    }
  },
  
  // Record focus event
  recordFocus(event) {
    const target = event.target;
    
    if (!this.isFormElement(target)) return;
    
    this.addAction({
      type: 'focus',
      selector: FormDetector.getSelector(target),
      timestamp: Date.now()
    });
  },
  
  // Record keydown event
  recordKeydown(event) {
    // Record special keys like Tab, Enter
    if (event.key === 'Tab' || event.key === 'Enter') {
      const target = event.target;
      
      if (this.isFormElement(target) || FormDetector.isSubmitButton(target)) {
        this.addAction({
          type: 'keypress',
          key: event.key,
          selector: FormDetector.getSelector(target),
          timestamp: Date.now()
        });
      }
    }
  },
  
  // Handle DOM changes
  handleDOMChanges(mutations) {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Check for new forms or fields
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('form, dialog, [role="dialog"]')) {
              this.addAction({
                type: 'dom-change',
                change: 'element-added',
                selector: FormDetector.getSelector(node),
                timestamp: Date.now()
              });
            }
          }
        });
      }
    });
  },
  
  // Add action to recorded list
  addAction(action) {
    // Avoid duplicate actions
    const lastAction = this.recordedActions[this.recordedActions.length - 1];
    
    if (lastAction && 
        lastAction.type === action.type && 
        lastAction.selector === action.selector &&
        action.timestamp - lastAction.timestamp < 100) {
      // Update the last action instead
      Object.assign(lastAction, action);
      return;
    }
    
    this.recordedActions.push(action);
    
    // Send to background script
    chrome.runtime.sendMessage({
      action: 'recordAction',
      actionData: action
    });
  },
  
  // Check if element is a form element
  isFormElement(element) {
    return element.matches('input, select, textarea');
  },
  
  // Show recording indicator
  showRecordingIndicator() {
    if (this.indicator) return;
    
    this.indicator = document.createElement('div');
    this.indicator.id = 'zkflow-recording-indicator';
    this.indicator.innerHTML = `
      <div class="zkflow-indicator-dot"></div>
      <span>Recording</span>
    `;
    
    document.body.appendChild(this.indicator);
  },
  
  // Hide recording indicator
  hideRecordingIndicator() {
    if (this.indicator) {
      this.indicator.remove();
      this.indicator = null;
    }
  },
  
  // Wait for element to appear
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found`));
      }, timeout);
    });
  }
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      FlowRecorder.start();
      sendResponse({ success: true });
      break;
      
    case 'stopRecording':
      const actions = FlowRecorder.stop();
      sendResponse({ success: true, actions });
      break;
      
    case 'getRecordingStatus':
      sendResponse({ isRecording: FlowRecorder.isRecording });
      break;
  }
  
  return true;
});

// Export for use in other scripts
window.FlowRecorder = FlowRecorder;