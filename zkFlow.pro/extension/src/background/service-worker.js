// Recording state
let recordingState = {
  isRecording: false,
  tabId: null,
  actions: [],
  startUrl: null
};

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      startRecording(request.tabId, request.url);
      sendResponse({ success: true });
      break;
      
    case 'stopRecording':
      const actions = stopRecording();
      sendResponse({ success: true, actions });
      break;
      
    case 'getRecordingStatus':
      sendResponse(recordingState.isRecording ? recordingState : null);
      break;
      
    case 'recordAction':
      if (recordingState.isRecording && sender.tab.id === recordingState.tabId) {
        recordAction(request.actionData);
      }
      break;
  }
  
  return true;
});

// Command handlers (keyboard shortcuts)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'start-recording') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (recordingState.isRecording) {
      stopRecording();
    } else {
      startRecording(tab.id, tab.url);
    }
  } else if (command.startsWith('play-flow-')) {
    const flowNumber = parseInt(command.split('-')[2]) - 1;
    playFlowByIndex(flowNumber);
  }
});

// Recording functions
function startRecording(tabId, url) {
  recordingState = {
    isRecording: true,
    tabId: tabId,
    actions: [],
    startUrl: url
  };
  
  // Inject content scripts if needed
  chrome.tabs.sendMessage(tabId, { action: 'startRecording' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content scripts not loaded, inject them
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [
          'src/content/form-detector.js',
          'src/content/flow-recorder.js',
          'src/content/flow-player.js'
        ]
      });
    }
  });
  
  // Update extension icon
  chrome.action.setBadgeText({ text: 'REC', tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#f44336', tabId: tabId });
}

function stopRecording() {
  const actions = recordingState.actions;
  const tabId = recordingState.tabId;
  
  // Reset state
  recordingState = {
    isRecording: false,
    tabId: null,
    actions: [],
    startUrl: null
  };
  
  // Notify content script
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'stopRecording' });
    
    // Clear badge
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
  
  return actions;
}

function recordAction(actionData) {
  recordingState.actions.push({
    ...actionData,
    timestamp: Date.now()
  });
  
  // Notify popup if open
  chrome.runtime.sendMessage({
    action: 'recordingUpdate',
    actions: recordingState.actions
  }).catch(() => {
    // Popup not open, ignore
  });
}

// Play flow by keyboard shortcut
async function playFlowByIndex(index) {
  const result = await chrome.storage.local.get('flows');
  const flows = result.flows || [];
  
  if (index < flows.length) {
    const flow = flows[index];
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Navigate if needed
    if (!tab.url.includes(flow.domain)) {
      await chrome.tabs.update(tab.id, { url: flow.url });
      
      // Wait for navigation
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        });
      });
    }
    
    // Execute flow
    chrome.tabs.sendMessage(tab.id, {
      action: 'playFlow',
      flow: flow
    });
  }
}

// Context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'zkflow-record',
    title: 'Record Form Flow',
    contexts: ['page', 'frame']
  });
  
  chrome.contextMenus.create({
    id: 'zkflow-play',
    title: 'Play Saved Flow',
    contexts: ['page', 'frame']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'zkflow-record') {
    if (recordingState.isRecording) {
      stopRecording();
    } else {
      startRecording(tab.id, tab.url);
    }
  } else if (info.menuItemId === 'zkflow-play') {
    // Open popup to select flow
    chrome.action.openPopup();
  }
});

// Handle tab navigation during recording
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (recordingState.isRecording && tabId === recordingState.tabId) {
    if (changeInfo.status === 'complete') {
      // Re-inject content scripts on navigation
      chrome.tabs.sendMessage(tabId, { action: 'startRecording' }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: [
              'src/content/form-detector.js',
              'src/content/flow-recorder.js',
              'src/content/flow-player.js'
            ]
          });
        }
      });
    }
  }
});

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (recordingState.isRecording && tabId === recordingState.tabId) {
    stopRecording();
  }
});