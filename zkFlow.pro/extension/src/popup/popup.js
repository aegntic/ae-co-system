// State management
let isRecording = false;
let recordedActions = [];
let flows = [];

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const recordButton = document.getElementById('record-button');
const recordStatus = document.getElementById('record-status');
const recordingInfo = document.getElementById('recording-info');
const actionCount = document.getElementById('action-count');
const flowNameSection = document.getElementById('flow-name-section');
const flowNameInput = document.getElementById('flow-name');
const saveFlowButton = document.getElementById('save-flow');
const cancelSaveButton = document.getElementById('cancel-save');
const flowsList = document.getElementById('flows-list');
const searchFlows = document.getElementById('search-flows');
const optionsButton = document.getElementById('options-button');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadFlows();
  renderFlows();
  
  // Check if currently recording
  const recording = await chrome.runtime.sendMessage({ action: 'getRecordingStatus' });
  if (recording) {
    isRecording = true;
    recordedActions = recording.actions || [];
    updateRecordingUI();
  }
});

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(`${targetTab}-tab`).classList.add('active');
  });
});

// Recording functionality
recordButton.addEventListener('click', async () => {
  if (!isRecording) {
    // Start recording
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.runtime.sendMessage({
      action: 'startRecording',
      tabId: tab.id,
      url: tab.url
    });
    
    isRecording = true;
    recordedActions = [];
    updateRecordingUI();
  } else {
    // Stop recording
    const result = await chrome.runtime.sendMessage({ action: 'stopRecording' });
    
    isRecording = false;
    recordedActions = result.actions || [];
    
    if (recordedActions.length > 0) {
      showSaveFlowUI();
    } else {
      updateRecordingUI();
    }
  }
});

// Save flow
saveFlowButton.addEventListener('click', async () => {
  const flowName = flowNameInput.value.trim();
  
  if (!flowName) {
    flowNameInput.focus();
    return;
  }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const flow = {
    id: Date.now().toString(),
    name: flowName,
    url: tab.url,
    domain: new URL(tab.url).hostname,
    actions: recordedActions,
    createdAt: new Date().toISOString(),
    playCount: 0
  };
  
  flows.unshift(flow);
  await saveFlows();
  
  // Reset UI
  flowNameInput.value = '';
  flowNameSection.classList.add('hidden');
  recordingInfo.classList.add('hidden');
  updateRecordingUI();
  
  // Switch to flows tab
  document.querySelector('[data-tab="flows"]').click();
  renderFlows();
});

// Cancel save
cancelSaveButton.addEventListener('click', () => {
  flowNameInput.value = '';
  flowNameSection.classList.add('hidden');
  recordingInfo.classList.add('hidden');
  recordedActions = [];
  updateRecordingUI();
});

// Search flows
searchFlows.addEventListener('input', () => {
  renderFlows(searchFlows.value.toLowerCase());
});

// Options button
optionsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Helper functions
function updateRecordingUI() {
  const statusIcon = recordStatus.querySelector('.status-icon');
  const statusText = recordStatus.querySelector('.status-text');
  const recordIcon = recordButton.querySelector('.record-icon');
  const recordText = recordButton.querySelector('span');
  
  if (isRecording) {
    statusIcon.classList.add('recording');
    statusText.textContent = 'Recording...';
    recordButton.classList.add('recording');
    recordIcon.innerHTML = '<rect x="8" y="8" width="8" height="8"></rect>';
    recordText.textContent = 'Stop Recording';
    recordingInfo.classList.remove('hidden');
    actionCount.textContent = recordedActions.length;
  } else {
    statusIcon.classList.remove('recording');
    statusText.textContent = 'Ready to record';
    recordButton.classList.remove('recording');
    recordIcon.innerHTML = '<circle cx="12" cy="12" r="8"></circle>';
    recordText.textContent = 'Start Recording';
    recordingInfo.classList.add('hidden');
  }
}

function showSaveFlowUI() {
  recordingInfo.classList.remove('hidden');
  flowNameSection.classList.remove('hidden');
  flowNameInput.focus();
}

async function loadFlows() {
  const result = await chrome.storage.local.get('flows');
  flows = result.flows || [];
}

async function saveFlows() {
  await chrome.storage.local.set({ flows });
}

function renderFlows(searchTerm = '') {
  flowsList.innerHTML = '';
  
  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchTerm) ||
    flow.domain.toLowerCase().includes(searchTerm)
  );
  
  if (filteredFlows.length === 0) {
    flowsList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p>${searchTerm ? 'No flows found' : 'No flows saved yet'}</p>
        <p class="hint">${searchTerm ? 'Try a different search' : 'Click "Record" to create your first flow'}</p>
      </div>
    `;
    return;
  }
  
  filteredFlows.forEach((flow, index) => {
    const flowItem = createFlowItem(flow, index);
    flowsList.appendChild(flowItem);
  });
}

function createFlowItem(flow, index) {
  const div = document.createElement('div');
  div.className = 'flow-item';
  
  const shortcutKey = index < 3 ? `⌘⇧${index + 1}` : '';
  
  div.innerHTML = `
    <div class="flow-header">
      <h3 class="flow-name">${flow.name}</h3>
      ${shortcutKey ? `<span class="flow-shortcut">${shortcutKey}</span>` : ''}
    </div>
    <div class="flow-info">
      <span class="flow-url">${flow.domain}</span>
      <span>${flow.actions.length} actions</span>
    </div>
    <div class="flow-actions">
      <button class="flow-button primary" data-action="play" data-id="${flow.id}">
        Play Flow
      </button>
      <button class="flow-button" data-action="edit" data-id="${flow.id}">
        Edit
      </button>
      <button class="flow-button" data-action="delete" data-id="${flow.id}">
        Delete
      </button>
    </div>
  `;
  
  // Add event listeners
  div.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = button.getAttribute('data-action');
      const flowId = button.getAttribute('data-id');
      
      switch (action) {
        case 'play':
          await playFlow(flowId);
          break;
        case 'edit':
          // TODO: Implement edit functionality
          break;
        case 'delete':
          await deleteFlow(flowId);
          break;
      }
    });
  });
  
  return div;
}

async function playFlow(flowId) {
  const flow = flows.find(f => f.id === flowId);
  if (!flow) return;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Navigate to the flow's URL if not already there
  if (!tab.url.includes(flow.domain)) {
    await chrome.tabs.update(tab.id, { url: flow.url });
    
    // Wait for page to load
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }
  
  // Send flow to content script
  await chrome.tabs.sendMessage(tab.id, {
    action: 'playFlow',
    flow: flow
  });
  
  // Update play count
  flow.playCount++;
  await saveFlows();
  
  // Close popup
  window.close();
}

async function deleteFlow(flowId) {
  if (confirm('Are you sure you want to delete this flow?')) {
    flows = flows.filter(f => f.id !== flowId);
    await saveFlows();
    renderFlows();
  }
}

// Listen for recording updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'recordingUpdate') {
    recordedActions = request.actions;
    actionCount.textContent = recordedActions.length;
  }
});