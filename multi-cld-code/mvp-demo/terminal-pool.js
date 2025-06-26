/**
 * CCTM MVP - Basic Terminal Pool Concept
 * 
 * This file shows the original terminal pooling concept that laid the foundation
 * for CCTM's revolutionary architecture. The MVP started with this simple idea:
 * "What if we could pool terminal instances instead of creating new ones?"
 */

class BasicTerminalPool {
    constructor(maxSize = 5) {
        this.maxSize = maxSize;
        this.availableTerminals = [];
        this.activeTerminals = new Map();
        this.totalCreated = 0;
        
        // Pre-warm the pool with a few terminals
        this.preWarmPool();
    }

    /**
     * Pre-warm the pool with idle terminals ready for use
     * This was the original insight that led to CCTM's efficiency
     */
    preWarmPool() {
        for (let i = 0; i < 2; i++) {
            this.createIdleTerminal();
        }
    }

    /**
     * Create a new idle terminal ready for assignment
     * MVP version - just basic objects, not real terminals
     */
    createIdleTerminal() {
        const terminal = {
            id: `mvp_terminal_${++this.totalCreated}`,
            status: 'idle',
            created: new Date(),
            lastUsed: null,
            workingDir: '/home/user',
            resourceUsage: {
                memory: Math.random() * 10 + 5, // 5-15MB
                cpu: 0
            }
        };

        this.availableTerminals.push(terminal);
        console.log(`[MVP Pool] Created idle terminal: ${terminal.id}`);
        return terminal;
    }

    /**
     * Get a terminal from the pool for use
     * This was the core MVP innovation - instant terminal availability
     */
    requestTerminal(projectName = 'Unnamed Project') {
        let terminal;

        // Try to get from available pool first
        if (this.availableTerminals.length > 0) {
            terminal = this.availableTerminals.pop();
            console.log(`[MVP Pool] Reusing terminal from pool: ${terminal.id}`);
        } else {
            // Create new if pool is empty
            terminal = this.createIdleTerminal();
            this.availableTerminals.pop(); // Remove from available
            console.log(`[MVP Pool] Created new terminal (pool empty): ${terminal.id}`);
        }

        // Configure for the project
        terminal.status = 'active';
        terminal.lastUsed = new Date();
        terminal.assignedProject = projectName;
        terminal.workingDir = `/projects/${projectName.toLowerCase().replace(/\s+/g, '-')}`;

        // Add to active terminals
        this.activeTerminals.set(terminal.id, terminal);

        // Backfill the pool if needed
        this.maintainPool();

        return terminal;
    }

    /**
     * Return a terminal to the pool when done
     * MVP insight: Don't destroy, reuse!
     */
    releaseTerminal(terminalId) {
        const terminal = this.activeTerminals.get(terminalId);
        if (!terminal) {
            console.warn(`[MVP Pool] Terminal not found: ${terminalId}`);
            return;
        }

        // Clean up the terminal for reuse
        terminal.status = 'idle';
        terminal.assignedProject = null;
        terminal.lastUsed = new Date();
        terminal.workingDir = '/home/user';

        // Move back to available pool
        this.activeTerminals.delete(terminalId);
        this.availableTerminals.push(terminal);

        console.log(`[MVP Pool] Released terminal back to pool: ${terminalId}`);
    }

    /**
     * Maintain the pool size - keep some terminals ready
     * This prevents the "startup delay" that frustrated developers
     */
    maintainPool() {
        const shortage = Math.max(0, 2 - this.availableTerminals.length);
        for (let i = 0; i < shortage && this.getTotalSize() < this.maxSize; i++) {
            this.createIdleTerminal();
        }
    }

    /**
     * Get pool statistics
     * This became the foundation for CCTM's resource monitoring
     */
    getStats() {
        const totalMemory = [...this.availableTerminals, ...this.activeTerminals.values()]
            .reduce((sum, t) => sum + t.resourceUsage.memory, 0);

        return {
            available: this.availableTerminals.length,
            active: this.activeTerminals.size,
            total: this.getTotalSize(),
            maxSize: this.maxSize,
            memoryUsage: Math.round(totalMemory),
            utilization: Math.round((this.activeTerminals.size / this.maxSize) * 100)
        };
    }

    getTotalSize() {
        return this.availableTerminals.length + this.activeTerminals.size;
    }

    /**
     * List all terminals with their status
     * This became the inspiration for CCTM's multi-instance view
     */
    listTerminals() {
        const terminals = [];

        // Add active terminals
        this.activeTerminals.forEach(terminal => {
            terminals.push({
                ...terminal,
                poolStatus: 'active'
            });
        });

        // Add available terminals
        this.availableTerminals.forEach(terminal => {
            terminals.push({
                ...terminal,
                poolStatus: 'available'
            });
        });

        return terminals.sort((a, b) => new Date(b.created) - new Date(a.created));
    }
}

/**
 * Demo function to show the MVP pool in action
 * This demonstrates the core insight that led to CCTM
 */
function demoBasicPool() {
    console.log('=== CCTM MVP - Basic Terminal Pool Demo ===\n');
    
    const pool = new BasicTerminalPool(5);
    
    console.log('1. Initial pool state:');
    console.log(pool.getStats());
    
    console.log('\n2. Requesting terminals for different projects:');
    const term1 = pool.requestTerminal('Frontend Dashboard');
    const term2 = pool.requestTerminal('Backend API');
    const term3 = pool.requestTerminal('Database Setup');
    
    console.log('Pool after requests:');
    console.log(pool.getStats());
    
    console.log('\n3. Simulating work completion:');
    setTimeout(() => {
        pool.releaseTerminal(term1.id);
        console.log('Released Frontend Dashboard terminal');
        console.log(pool.getStats());
    }, 2000);
    
    setTimeout(() => {
        pool.releaseTerminal(term2.id);
        console.log('Released Backend API terminal');
        console.log(pool.getStats());
    }, 4000);
    
    console.log('\n4. Current terminals:');
    pool.listTerminals().forEach(terminal => {
        console.log(`${terminal.id}: ${terminal.poolStatus} - ${terminal.assignedProject || 'No project'}`);
    });
}

// Export for use in other parts of the MVP demo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BasicTerminalPool, demoBasicPool };
}

/**
 * MVP to Full CCTM Evolution:
 * 
 * This basic pool concept evolved into:
 * 
 * Phase 2A (Terminal Virtualization):
 * - Real terminal process management
 * - 50+ concurrent instances instead of 5
 * - Advanced resource monitoring
 * - Load balancing algorithms
 * 
 * Phase 2B (Intelligence Layer):
 * - Project-aware terminal assignment
 * - File system monitoring integration
 * - Context-based terminal selection
 * 
 * Phase 2C (AI Integration):
 * - MCP server coordination through terminals
 * - Natural language command routing
 * - Multi-instance Claude Code workflows
 * 
 * The MVP Insight That Changed Everything:
 * "Instead of creating terminals when needed, keep them ready and assign them smartly"
 * 
 * This simple concept became the foundation for CCTM's revolutionary architecture:
 * Multiple Claude Code instances running simultaneously without overhead.
 */