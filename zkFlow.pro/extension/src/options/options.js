// Options page functionality
let flows = [];
let sortBy = 'recent';

// DOM elements
const navTabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.section');
const flowsList = document.getElementById('flows-list');
const searchInput = document.getElementById('search-flows');
const sortButton = document.getElementById('sort-flows');
const sortLabel = document.getElementById('sort-label');
const exportButton = document.getElementById('export-flows');
const importButton = document.getElementById('import-flows');
const importFile = document.getElementById('import-file');
const autoBackupCheckbox = document.getElementById('auto-backup');

// Statistics elements
const totalFlowsEl = document.getElementById('total-flows');
const totalActionsEl = document.getElementById('total-actions');
const timeSavedEl = document.getElementById('time-saved');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadFlows();
  renderFlows();
  updateStatistics();
  loadSettings();
});

// Navigation
navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetSection = tab.getAttribute('data-section');
    
    navTabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(`${targetSection}-section`).classList.add('active');
  });
});

// Load flows
async function loadFlows() {
  const result = await chrome.storage.local.get('flows');
  flows = result.flows || [];
}

// Save flows
async function saveFlows() {
  await chrome.storage.local.set({ flows });
}

// Render flows
function renderFlows(searchTerm = '') {
  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort flows
  filteredFlows.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'usage':
        return b.playCount - a.playCount;
      default:
        return 0;
    }
  });
  
  flowsList.innerHTML = '';
  
  if (filteredFlows.length === 0) {
    flowsList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p>${searchTerm ? 'No flows found matching your search' : 'No flows saved yet'}</p>
      </div>
    `;
    return;
  }
  
  filteredFlows.forEach(flow => {
    const flowItem = createFlowItem(flow);
    flowsList.appendChild(flowItem);
  });
}

// Create flow item
function createFlowItem(flow) {
  const div = document.createElement('div');
  div.className = 'flow-item';
  
  const createdDate = new Date(flow.createdAt).toLocaleDateString();
  const timeSaved = Math.round(flow.actions.length * 2 / 60); // Estimate 2 seconds per action
  
  div.innerHTML = `
    <div class="flow-info">
      <h3 class="flow-name">${flow.name}</h3>
      <div class="flow-meta">
        <span>${flow.domain}</span>
        <span>${flow.actions.length} actions</span>
        <span>Used ${flow.playCount} times</span>
        <span>Created ${createdDate}</span>
      </div>
    </div>
    <div class="flow-actions">
      <button class="icon-button" title="Edit" data-action="edit" data-id="${flow.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
      <button class="icon-button" title="Duplicate" data-action="duplicate" data-id="${flow.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <button class="icon-button" title="Delete" data-action="delete" data-id="${flow.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add event listeners
  div.querySelectorAll('.icon-button').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      const flowId = button.getAttribute('data-id');
      handleFlowAction(action, flowId);
    });
  });
  
  return div;
}

// Handle flow actions
async function handleFlowAction(action, flowId) {
  const flow = flows.find(f => f.id === flowId);
  if (!flow) return;
  
  switch (action) {
    case 'edit':
      editFlow(flow);
      break;
      
    case 'duplicate':
      duplicateFlow(flow);
      break;
      
    case 'delete':
      if (confirm(`Are you sure you want to delete "${flow.name}"?`)) {
        flows = flows.filter(f => f.id !== flowId);
        await saveFlows();
        renderFlows();
        updateStatistics();
      }
      break;
  }
}

// Edit flow
function editFlow(flow) {
  const newName = prompt('Enter new name for the flow:', flow.name);
  if (newName && newName !== flow.name) {
    flow.name = newName;
    saveFlows();
    renderFlows();
  }
}

// Duplicate flow
async function duplicateFlow(flow) {
  const newFlow = {
    ...flow,
    id: Date.now().toString(),
    name: `${flow.name} (Copy)`,
    createdAt: new Date().toISOString(),
    playCount: 0
  };
  
  flows.unshift(newFlow);
  await saveFlows();
  renderFlows();
  updateStatistics();
}

// Search functionality
searchInput.addEventListener('input', () => {
  renderFlows(searchInput.value);
});

// Sort functionality
sortButton.addEventListener('click', () => {
  const options = ['recent', 'name', 'usage'];
  const currentIndex = options.indexOf(sortBy);
  sortBy = options[(currentIndex + 1) % options.length];
  
  const labels = {
    recent: 'Recent',
    name: 'Name',
    usage: 'Most Used'
  };
  
  sortLabel.textContent = labels[sortBy];
  renderFlows(searchInput.value);
});

// Export flows
exportButton.addEventListener('click', () => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    flows: flows
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `zkflow-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
});

// Import flows
importButton.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.flows || !Array.isArray(data.flows)) {
      throw new Error('Invalid file format');
    }
    
    // Add imported flows (avoid duplicates)
    const existingIds = new Set(flows.map(f => f.id));
    const newFlows = data.flows.filter(f => !existingIds.has(f.id));
    
    flows.push(...newFlows);
    await saveFlows();
    renderFlows();
    updateStatistics();
    
    alert(`Successfully imported ${newFlows.length} flows`);
    
  } catch (error) {
    alert('Error importing flows: ' + error.message);
  }
  
  // Reset file input
  importFile.value = '';
});

// Update statistics
function updateStatistics() {
  totalFlowsEl.textContent = flows.length;
  
  const totalActions = flows.reduce((sum, flow) => sum + flow.actions.length, 0);
  totalActionsEl.textContent = totalActions;
  
  // Estimate time saved (2 seconds per action, times number of plays)
  const totalPlays = flows.reduce((sum, flow) => sum + flow.playCount, 0);
  const secondsSaved = totalActions * 2 * totalPlays;
  const minutesSaved = Math.round(secondsSaved / 60);
  timeSavedEl.textContent = minutesSaved;
}

// Settings
async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = result.settings || { autoBackup: true };
  
  autoBackupCheckbox.checked = settings.autoBackup;
}

autoBackupCheckbox.addEventListener('change', async () => {
  await chrome.storage.local.set({
    settings: { autoBackup: autoBackupCheckbox.checked }
  });
});