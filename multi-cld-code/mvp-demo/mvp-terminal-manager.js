/**
 * CCTM MVP - Basic Terminal Manager
 * 
 * This is the original concept that started it all - a simple terminal manager
 * that eliminates tab switching and provides basic multi-terminal coordination.
 * 
 * Key Insights from this MVP:
 * 1. Developers hate switching between terminal tabs
 * 2. Status tracking is crucial for workflow efficiency
 * 3. Visual indicators for attention-needed are game-changing
 * 4. Resource monitoring helps prevent system overload
 * 5. Simple UI can manage complex backend coordination
 */

class MVPTerminalManager {
    constructor() {
        this.terminals = new Map();
        this.activeTerminal = null;
        this.terminalCounter = 0;
        this.init();
    }

    init() {
        this.updateStats();
        this.startStatusUpdater();
        
        // Create initial demo terminals
        setTimeout(() => {
            this.createTerminal("Project A");
            this.createTerminal("Project B"); 
            this.simulateTerminalActivity();
        }, 1000);
    }

    createTerminal(name = null) {
        this.terminalCounter++;
        const terminalId = `term_${this.terminalCounter}`;
        const terminalName = name || `Terminal ${this.terminalCounter}`;
        
        const terminal = {
            id: terminalId,
            name: terminalName,
            status: 'idle',
            lastActivity: new Date(),
            output: [],
            workingDir: `/projects/${terminalName.toLowerCase().replace(' ', '-')}`,
            needsAttention: false,
            created: new Date()
        };

        this.terminals.set(terminalId, terminal);
        this.renderTerminalList();
        this.updateStats();

        // Auto-select first terminal
        if (this.terminals.size === 1) {
            this.selectTerminal(terminalId);
        }

        // Log terminal creation
        this.addOutput(terminalId, 'system', `Terminal "${terminalName}" created`);
        this.addOutput(terminalId, 'prompt', `${terminalName.toLowerCase()}$ `);

        return terminalId;
    }

    selectTerminal(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) return;

        this.activeTerminal = terminalId;
        
        // Clear attention if this terminal needed it
        if (terminal.needsAttention) {
            terminal.needsAttention = false;
        }

        this.renderTerminalList();
        this.renderTerminalDisplay();
        this.updateStats();
    }

    addOutput(terminalId, type, content) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) return;

        terminal.output.push({
            type: type, // 'system', 'prompt', 'command', 'output', 'error'
            content: content,
            timestamp: new Date()
        });

        terminal.lastActivity = new Date();

        // If this isn't the active terminal, mark it for attention
        if (terminalId !== this.activeTerminal && type !== 'prompt' && type !== 'system') {
            terminal.needsAttention = true;
        }

        if (terminalId === this.activeTerminal) {
            this.renderTerminalDisplay();
        }

        this.renderTerminalList();
        this.updateStats();
    }

    simulateTerminalActivity() {
        // Simulate different types of terminal activity
        const activities = [
            { terminal: 1, delay: 2000, actions: [
                { type: 'command', content: 'npm run build' },
                { type: 'output', content: 'Building project...' },
                { type: 'output', content: '✓ Build completed successfully' }
            ]},
            { terminal: 2, delay: 4000, actions: [
                { type: 'command', content: 'git status' },
                { type: 'output', content: 'On branch main\nnothing to commit, working tree clean' }
            ]},
            { terminal: 1, delay: 6000, actions: [
                { type: 'command', content: 'npm test' },
                { type: 'output', content: 'Running test suite...' },
                { type: 'error', content: 'Test failed: Expected true but got false' }
            ]}
        ];

        activities.forEach(activity => {
            setTimeout(() => {
                const terminalId = Array.from(this.terminals.keys())[activity.terminal - 1];
                if (terminalId) {
                    activity.actions.forEach((action, index) => {
                        setTimeout(() => {
                            this.addOutput(terminalId, action.type, action.content);
                            if (index === activity.actions.length - 1) {
                                this.addOutput(terminalId, 'prompt', this.getPrompt(terminalId));
                            }
                        }, index * 500);
                    });
                }
            }, activity.delay);
        });
    }

    getPrompt(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) return '$ ';
        return `${terminal.name.toLowerCase()}$ `;
    }

    renderTerminalList() {
        const terminalList = document.getElementById('terminalList');
        if (!terminalList) return;

        terminalList.innerHTML = '';

        this.terminals.forEach((terminal, terminalId) => {
            const li = document.createElement('li');
            li.className = 'terminal-item';
            
            if (terminalId === this.activeTerminal) {
                li.classList.add('active');
            }
            
            if (terminal.needsAttention) {
                li.classList.add('attention');
            }

            li.innerHTML = `
                <div class="terminal-name">${terminal.name}</div>
                <div class="terminal-status">
                    Status: ${terminal.status} | 
                    Dir: ${terminal.workingDir} |
                    Activity: ${this.getTimeAgo(terminal.lastActivity)}
                </div>
            `;

            li.onclick = () => this.selectTerminal(terminalId);
            terminalList.appendChild(li);
        });
    }

    renderTerminalDisplay() {
        const display = document.getElementById('terminalDisplay');
        if (!display || !this.activeTerminal) return;

        const terminal = this.terminals.get(this.activeTerminal);
        if (!terminal) return;

        let output = '';
        terminal.output.forEach(entry => {
            const className = entry.type;
            const timestamp = entry.timestamp.toLocaleTimeString();
            
            switch (entry.type) {
                case 'system':
                    output += `<span class="output">[${timestamp}] ${entry.content}</span>\n`;
                    break;
                case 'prompt':
                    output += `<span class="prompt">${entry.content}</span>`;
                    break;
                case 'command':
                    output += `<span class="command">${entry.content}</span>\n`;
                    break;
                case 'output':
                    output += `<span class="output">${entry.content}</span>\n`;
                    break;
                case 'error':
                    output += `<span class="error">${entry.content}</span>\n`;
                    break;
            }
        });

        output += '<span class="cursor">█</span>';
        
        display.innerHTML = `<div class="terminal-output">${output}</div>`;
        display.scrollTop = display.scrollHeight;
    }

    updateStats() {
        const activeCount = Array.from(this.terminals.values()).filter(t => t.status === 'running').length;
        const idleCount = Array.from(this.terminals.values()).filter(t => t.status === 'idle').length;
        const attentionCount = Array.from(this.terminals.values()).filter(t => t.needsAttention).length;

        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('idleCount').textContent = idleCount;
        document.getElementById('attentionCount').textContent = attentionCount;
        document.getElementById('status').textContent = 
            `Active Terminals: ${this.terminals.size} | Memory: ${45 + this.terminals.size * 5}MB`;
    }

    startStatusUpdater() {
        setInterval(() => {
            // Simulate random status changes
            this.terminals.forEach((terminal, terminalId) => {
                if (Math.random() < 0.1) { // 10% chance per update
                    terminal.status = terminal.status === 'idle' ? 'running' : 'idle';
                }
            });
            
            this.updateStats();
            this.renderTerminalList();
        }, 3000);
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }
}

// Global functions for the UI
function createTerminal() {
    const projectNames = ['Frontend', 'Backend', 'Database', 'Tests', 'Docs', 'Scripts'];
    const randomName = projectNames[Math.floor(Math.random() * projectNames.length)];
    window.terminalManager.createTerminal(randomName);
}

function simulateActivity() {
    window.terminalManager.simulateTerminalActivity();
}

// Initialize the MVP when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.terminalManager = new MVPTerminalManager();
});

/**
 * MVP Insights & Evolution Path:
 * 
 * What worked in this MVP:
 * 1. ✅ Single interface for multiple terminals
 * 2. ✅ Visual status indicators  
 * 3. ✅ Attention detection concept
 * 4. ✅ Basic resource tracking
 * 5. ✅ Elimination of tab switching
 * 
 * What needed evolution:
 * 1. 🔄 Scale to 50+ terminals (became Phase 2A)
 * 2. 🔄 Real terminal integration (became virtualization layer)
 * 3. 🔄 Project context awareness (became Phase 2B)
 * 4. 🔄 AI assistance integration (became Phase 2C)
 * 5. 🔄 Advanced attention detection (became ML-powered)
 * 
 * The Revolutionary Leap:
 * MVP → Claude Code Integration → Multi-Instance Workflow Manager
 * 
 * This simple demo shows how the core insight of "no more tab switching"
 * evolved into "multiple Claude Code instances without overhead" - 
 * the same problem, solved at the next level of sophistication.
 */