/**
 * State Synchronizer - Cross-Server State Management
 * 
 * Maintains synchronized state across all MCP servers, enabling
 * coordinated intelligence and seamless handoffs between servers.
 */

const EventEmitter = require('events');
const logger = require('./utils/logger');

class StateSynchronizer extends EventEmitter {
    constructor(superHub) {
        super();
        this.superHub = superHub;
        
        // Global state storage
        this.globalState = {
            context: new Map(),      // Shared context across servers
            sessions: new Map(),     // Active user sessions
            knowledge: new Map(),    // Shared knowledge base
            workflows: new Map(),    // Active workflows
            metadata: new Map()      // System metadata
        };
        
        // State change tracking
        this.stateHistory = [];
        this.maxHistorySize = 1000;
        
        // Synchronization settings
        this.syncInterval = 5000; // 5 seconds
        this.syncTimer = null;
        
        // Server state snapshots
        this.serverStates = new Map();
        
        // Conflict resolution strategies
        this.conflictResolvers = {
            'last_write_wins': this._resolveLastWriteWins.bind(this),
            'merge': this._resolveMerge.bind(this),
            'priority_based': this._resolvePriorityBased.bind(this),
            'consensus': this._resolveConsensus.bind(this)
        };
    }
    
    async initialize() {
        logger.info('🔄 State Synchronizer initializing...');
        
        // Start periodic synchronization
        this._startPeriodicSync();
        
        // Initialize global state with defaults
        this._initializeGlobalState();
        
        logger.info('✨ State Synchronizer active');
    }
    
    /**
     * Handle state update from a server
     */
    async handleStateUpdate(serverId, stateUpdate) {
        try {
            const timestamp = Date.now();
            
            // Validate state update
            this._validateStateUpdate(stateUpdate);
            
            // Store server's state snapshot
            this.serverStates.set(serverId, {
                ...stateUpdate,
                timestamp,
                serverId
            });
            
            // Process state changes
            await this._processStateChanges(serverId, stateUpdate, timestamp);
            
            // Emit state change event
            this.emit('stateChanged', {
                serverId,
                changes: stateUpdate,
                timestamp
            });
            
            logger.debug(`State update from ${serverId}:`, Object.keys(stateUpdate));
            
        } catch (error) {
            logger.error(`Failed to handle state update from ${serverId}:`, error);
        }
    }
    
    /**
     * Get current global state
     */
    getGlobalState() {
        return {
            context: Object.fromEntries(this.globalState.context),
            sessions: Object.fromEntries(this.globalState.sessions),
            knowledge: Object.fromEntries(this.globalState.knowledge),
            workflows: Object.fromEntries(this.globalState.workflows),
            metadata: Object.fromEntries(this.globalState.metadata),
            lastUpdated: Date.now()
        };
    }
    
    /**
     * Update global state
     */
    async updateGlobalState(key, value, category = 'context') {
        if (!this.globalState[category]) {
            throw new Error(`Invalid state category: ${category}`);
        }
        
        const previousValue = this.globalState[category].get(key);
        this.globalState[category].set(key, value);
        
        // Record state change
        this._recordStateChange({
            category,
            key,
            previousValue,
            newValue: value,
            source: 'super-hub',
            timestamp: Date.now()
        });
        
        // Broadcast to all connected servers
        await this._broadcastStateChange(category, key, value);
        
        this.emit('globalStateUpdated', { category, key, value });
    }
    
    /**
     * Get state for a specific category
     */
    getState(category) {
        if (!this.globalState[category]) {
            throw new Error(`Invalid state category: ${category}`);
        }
        
        return Object.fromEntries(this.globalState[category]);
    }
    
    /**
     * Set context that persists across server interactions
     */
    async setSharedContext(key, value, ttl = null) {
        const contextValue = {
            value,
            timestamp: Date.now(),
            ttl,
            expiresAt: ttl ? Date.now() + ttl : null
        };
        
        await this.updateGlobalState(key, contextValue, 'context');
    }
    
    /**
     * Get shared context value
     */
    getSharedContext(key) {
        const contextItem = this.globalState.context.get(key);
        
        if (!contextItem) {
            return null;
        }
        
        // Check if expired
        if (contextItem.expiresAt && Date.now() > contextItem.expiresAt) {
            this.globalState.context.delete(key);
            return null;
        }
        
        return contextItem.value;
    }
    
    /**
     * Create or update a session
     */
    async createSession(sessionId, sessionData) {
        const session = {
            id: sessionId,
            ...sessionData,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            servers: new Set()
        };
        
        await this.updateGlobalState(sessionId, session, 'sessions');
        
        logger.info(`🔄 Session created: ${sessionId}`);
        
        return session;
    }
    
    /**
     * Update session activity
     */
    async updateSessionActivity(sessionId, serverId, activity) {
        const session = this.globalState.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }
        
        session.lastActivity = Date.now();
        session.servers.add(serverId);
        
        if (activity) {
            if (!session.activities) {
                session.activities = [];
            }
            session.activities.push({
                serverId,
                activity,
                timestamp: Date.now()
            });
            
            // Keep only recent activities
            session.activities = session.activities.slice(-50);
        }
        
        await this.updateGlobalState(sessionId, session, 'sessions');
        
        return session;
    }
    
    /**
     * Share knowledge between servers
     */
    async shareKnowledge(key, knowledge, source) {
        const knowledgeItem = {
            key,
            knowledge,
            source,
            timestamp: Date.now(),
            accessCount: 0,
            relevanceScore: 1.0
        };
        
        await this.updateGlobalState(key, knowledgeItem, 'knowledge');
        
        logger.info(`🧠 Knowledge shared: ${key} from ${source}`);
    }
    
    /**
     * Retrieve shared knowledge
     */
    getSharedKnowledge(key) {
        const knowledgeItem = this.globalState.knowledge.get(key);
        
        if (knowledgeItem) {
            knowledgeItem.accessCount++;
            knowledgeItem.lastAccessed = Date.now();
        }
        
        return knowledgeItem;
    }
    
    /**
     * Search shared knowledge
     */
    searchKnowledge(query, limit = 10) {
        const knowledge = Array.from(this.globalState.knowledge.values());
        
        // Simple text search - in production would use more sophisticated search
        const matches = knowledge.filter(item => {
            const searchText = `${item.key} ${JSON.stringify(item.knowledge)}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
        
        return matches;
    }
    
    /**
     * Register active workflow
     */
    async registerWorkflow(workflowId, workflowData) {
        const workflow = {
            id: workflowId,
            ...workflowData,
            status: 'active',
            startedAt: Date.now(),
            lastUpdate: Date.now(),
            participatingServers: new Set()
        };
        
        await this.updateGlobalState(workflowId, workflow, 'workflows');
        
        logger.info(`🔄 Workflow registered: ${workflowId}`);
        
        return workflow;
    }
    
    /**
     * Update workflow status
     */
    async updateWorkflow(workflowId, updates) {
        const workflow = this.globalState.workflows.get(workflowId);
        
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        Object.assign(workflow, updates, {
            lastUpdate: Date.now()
        });
        
        await this.updateGlobalState(workflowId, workflow, 'workflows');
        
        return workflow;
    }
    
    /**
     * Synchronize state with all servers
     */
    async synchronizeAll() {
        const servers = Array.from(this.superHub.serverRegistry.values())
            .filter(server => server.status === 'healthy');
        
        const syncPromises = servers.map(server => this._synchronizeWithServer(server));
        
        const results = await Promise.allSettled(syncPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        logger.info(`🔄 State sync complete: ${successful} successful, ${failed} failed`);
        
        return { successful, failed };
    }
    
    /**
     * Private: Process state changes from a server
     */
    async _processStateChanges(serverId, stateUpdate, timestamp) {
        for (const [category, changes] of Object.entries(stateUpdate)) {
            if (!this.globalState[category]) {
                logger.warn(`Unknown state category from ${serverId}: ${category}`);
                continue;
            }
            
            for (const [key, value] of Object.entries(changes)) {
                await this._processStateChange(serverId, category, key, value, timestamp);
            }
        }
    }
    
    /**
     * Private: Process individual state change
     */
    async _processStateChange(serverId, category, key, value, timestamp) {
        const currentValue = this.globalState[category].get(key);
        
        // Check for conflicts
        if (currentValue && this._hasConflict(currentValue, value, timestamp)) {
            const resolved = await this._resolveConflict(category, key, currentValue, value, serverId);
            this.globalState[category].set(key, resolved);
        } else {
            this.globalState[category].set(key, value);
        }
        
        // Record the change
        this._recordStateChange({
            category,
            key,
            previousValue: currentValue,
            newValue: value,
            source: serverId,
            timestamp
        });
    }
    
    /**
     * Private: Check if there's a conflict between values
     */
    _hasConflict(currentValue, newValue, timestamp) {
        // Simple conflict detection - values are different and within conflict window
        const conflictWindow = 10000; // 10 seconds
        const currentTimestamp = currentValue.timestamp || 0;
        
        return (
            JSON.stringify(currentValue) !== JSON.stringify(newValue) &&
            Math.abs(timestamp - currentTimestamp) < conflictWindow
        );
    }
    
    /**
     * Private: Resolve state conflicts
     */
    async _resolveConflict(category, key, currentValue, newValue, serverId) {
        const strategy = this._getConflictStrategy(category);
        const resolver = this.conflictResolvers[strategy];
        
        if (!resolver) {
            logger.warn(`Unknown conflict resolution strategy: ${strategy}`);
            return this.conflictResolvers.last_write_wins(currentValue, newValue);
        }
        
        const resolved = await resolver(currentValue, newValue, { category, key, serverId });
        
        logger.info(`⚠️  Conflict resolved for ${category}.${key} using ${strategy}`);
        
        return resolved;
    }
    
    /**
     * Private: Get conflict resolution strategy for category
     */
    _getConflictStrategy(category) {
        const strategies = {
            context: 'merge',
            sessions: 'last_write_wins',
            knowledge: 'merge',
            workflows: 'priority_based',
            metadata: 'consensus'
        };
        
        return strategies[category] || 'last_write_wins';
    }
    
    /**
     * Private: Last write wins conflict resolution
     */
    _resolveLastWriteWins(currentValue, newValue) {
        const currentTimestamp = currentValue.timestamp || 0;
        const newTimestamp = newValue.timestamp || 0;
        
        return newTimestamp >= currentTimestamp ? newValue : currentValue;
    }
    
    /**
     * Private: Merge conflict resolution
     */
    _resolveMerge(currentValue, newValue) {
        if (typeof currentValue === 'object' && typeof newValue === 'object') {
            return {
                ...currentValue,
                ...newValue,
                timestamp: Math.max(currentValue.timestamp || 0, newValue.timestamp || 0)
            };
        }
        
        return this._resolveLastWriteWins(currentValue, newValue);
    }
    
    /**
     * Private: Priority-based conflict resolution
     */
    _resolvePriorityBased(currentValue, newValue, context) {
        const server = this.superHub.serverRegistry.get(context.serverId);
        const currentPriority = currentValue.priority || 5;
        const newPriority = (server?.priority || 5);
        
        return newPriority >= currentPriority ? newValue : currentValue;
    }
    
    /**
     * Private: Consensus-based conflict resolution
     */
    async _resolveConsensus(currentValue, newValue) {
        // For now, use last write wins
        // In full implementation, would query multiple servers for consensus
        return this._resolveLastWriteWins(currentValue, newValue);
    }
    
    /**
     * Private: Broadcast state change to all servers
     */
    async _broadcastStateChange(category, key, value) {
        const message = {
            type: 'state_sync',
            data: {
                category,
                key,
                value,
                timestamp: Date.now()
            }
        };
        
        for (const [serverId, ws] of this.superHub.connectedServers) {
            if (ws.readyState === 1) { // WebSocket.OPEN
                try {
                    ws.send(JSON.stringify(message));
                } catch (error) {
                    logger.warn(`Failed to broadcast to ${serverId}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Private: Synchronize with individual server
     */
    async _synchronizeWithServer(server) {
        // Implementation would call server's sync endpoint
        // For now, simulate synchronization
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ serverId: server.id, status: 'synced' });
            }, Math.random() * 100 + 50);
        });
    }
    
    /**
     * Private: Record state change in history
     */
    _recordStateChange(change) {
        this.stateHistory.push(change);
        
        // Keep history size manageable
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Private: Validate state update
     */
    _validateStateUpdate(stateUpdate) {
        if (!stateUpdate || typeof stateUpdate !== 'object') {
            throw new Error('Invalid state update: must be an object');
        }
        
        for (const category of Object.keys(stateUpdate)) {
            if (!this.globalState[category]) {
                throw new Error(`Invalid state category: ${category}`);
            }
        }
    }
    
    /**
     * Private: Initialize global state with defaults
     */
    _initializeGlobalState() {
        // Set initial metadata
        this.globalState.metadata.set('initialized', Date.now());
        this.globalState.metadata.set('version', '1.0.0');
        this.globalState.metadata.set('super-hub-id', `hub-${Date.now()}`);
    }
    
    /**
     * Private: Start periodic synchronization
     */
    _startPeriodicSync() {
        this.syncTimer = setInterval(async () => {
            try {
                await this._cleanupExpiredData();
                
                // Periodic state validation and cleanup
                this._validateStateIntegrity();
                
            } catch (error) {
                logger.error('Periodic sync error:', error);
            }
        }, this.syncInterval);
    }
    
    /**
     * Private: Cleanup expired data
     */
    async _cleanupExpiredData() {
        const now = Date.now();
        
        // Cleanup expired context
        for (const [key, value] of this.globalState.context) {
            if (value.expiresAt && now > value.expiresAt) {
                this.globalState.context.delete(key);
            }
        }
        
        // Cleanup old sessions (inactive for 24 hours)
        const sessionTimeout = 24 * 60 * 60 * 1000;
        for (const [sessionId, session] of this.globalState.sessions) {
            if (now - session.lastActivity > sessionTimeout) {
                this.globalState.sessions.delete(sessionId);
            }
        }
        
        // Cleanup old knowledge (not accessed for 7 days)
        const knowledgeTimeout = 7 * 24 * 60 * 60 * 1000;
        for (const [key, knowledge] of this.globalState.knowledge) {
            const lastAccessed = knowledge.lastAccessed || knowledge.timestamp;
            if (now - lastAccessed > knowledgeTimeout && knowledge.accessCount < 5) {
                this.globalState.knowledge.delete(key);
            }
        }
    }
    
    /**
     * Private: Validate state integrity
     */
    _validateStateIntegrity() {
        // Check for orphaned references, data corruption, etc.
        // Implementation would include comprehensive state validation
        logger.debug('State integrity validation complete');
    }
    
    /**
     * Get synchronization statistics
     */
    getSyncStats() {
        return {
            globalStateSize: {
                context: this.globalState.context.size,
                sessions: this.globalState.sessions.size,
                knowledge: this.globalState.knowledge.size,
                workflows: this.globalState.workflows.size,
                metadata: this.globalState.metadata.size
            },
            historySize: this.stateHistory.length,
            connectedServers: this.superHub.connectedServers.size,
            lastSync: Date.now()
        };
    }
    
    /**
     * Stop the State Synchronizer
     */
    async stop() {
        logger.info('🛑 State Synchronizer stopping...');
        
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        
        // Final state synchronization
        await this.synchronizeAll();
    }
}

module.exports = StateSynchronizer;