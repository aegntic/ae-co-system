/**
 * Super-Hub Neural Network Controller
 * 
 * The central intelligence orchestrating all MCP servers as a unified brain.
 * Implements advanced AI collaboration patterns and emergent intelligence.
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const logger = require('./utils/logger');
const NeuralRouter = require('./neural-router');
const StateSynchronizer = require('./state-synchronizer');
const PatternEngine = require('./pattern-engine');

class SuperHub extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9101,
            healthCheckInterval: config.healthCheckInterval || 30000,
            maxRetries: config.maxRetries || 3,
            ...config
        };
        
        // Core components
        this.serverRegistry = new Map();
        this.neuralRouter = new NeuralRouter(this);
        this.stateSynchronizer = new StateSynchronizer(this);
        this.patternEngine = new PatternEngine(this);
        
        // WebSocket server for inter-server communication
        this.wsServer = null;
        this.connectedServers = new Map();
        
        // Performance metrics
        this.metrics = {
            requestsRouted: 0,
            averageResponseTime: 0,
            successRate: 0,
            predictedRequests: 0
        };
        
        this.isStarted = false;
    }
    
    /**
     * Initialize and start the Super-Hub
     */
    async start() {
        if (this.isStarted) {
            logger.warn('Super-Hub already started');
            return;
        }
        
        try {
            // Start WebSocket server for inter-server communication
            await this._startWebSocketServer();
            
            // Initialize core components
            await this.neuralRouter.initialize();
            await this.stateSynchronizer.initialize();
            await this.patternEngine.initialize();
            
            // Start health monitoring
            this._startHealthMonitoring();
            
            // Discover and register existing MCP servers
            await this._discoverServers();
            
            this.isStarted = true;
            
            logger.info('🧠 Super-Hub Neural Network Online');
            logger.info(`👁️  Neural routing intelligence active`);
            logger.info(`🔗 Inter-server communication established`);
            
            this.emit('started');
            
        } catch (error) {
            logger.error('Failed to start Super-Hub:', error);
            throw error;
        }
    }
    
    /**
     * Register a new MCP server with the Super-Hub
     */
    async registerServer(serverInfo) {
        const {
            id,
            name,
            type,
            url,
            capabilities,
            priority = 5
        } = serverInfo;
        
        const server = {
            id,
            name,
            type,
            url,
            capabilities: Array.isArray(capabilities) ? capabilities : [],
            priority,
            status: 'unknown',
            lastHealthCheck: null,
            responseTime: null,
            errorCount: 0,
            requestCount: 0,
            registeredAt: new Date(),
            metadata: {}
        };
        
        this.serverRegistry.set(id, server);
        
        // Immediate health check
        await this._checkServerHealth(server);
        
        // Notify neural router of new server
        this.neuralRouter.onServerRegistered(server);
        
        logger.info(`🔌 Registered server: ${name} (${type}) with ${capabilities.length} capabilities`);
        
        this.emit('serverRegistered', server);
        
        return server;
    }
    
    /**
     * Route a request to the optimal server(s) using neural intelligence
     */
    async routeRequest(request) {
        const startTime = Date.now();
        this.metrics.requestsRouted++;
        
        try {
            // Use neural router to find optimal server(s)
            const routing = await this.neuralRouter.route(request);
            
            if (!routing.primary) {
                throw new Error('No suitable server found for request');
            }
            
            // Execute request with fallback strategy
            const result = await this._executeWithFallback(routing, request);
            
            // Update performance metrics
            const responseTime = Date.now() - startTime;
            this._updateMetrics(responseTime, true);
            
            // Learn from successful routing
            this.patternEngine.recordSuccess(request, routing, result, responseTime);
            
            return result;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this._updateMetrics(responseTime, false);
            
            // Learn from failures
            this.patternEngine.recordFailure(request, error, responseTime);
            
            logger.error('Request routing failed:', error);
            throw error;
        }
    }
    
    /**
     * Get comprehensive system status
     */
    getStatus() {
        const servers = Array.from(this.serverRegistry.values());
        const healthyServers = servers.filter(s => s.status === 'healthy').length;
        
        return {
            status: this.isStarted ? 'running' : 'stopped',
            servers: {
                total: servers.length,
                healthy: healthyServers,
                unhealthy: servers.length - healthyServers
            },
            metrics: {
                ...this.metrics,
                uptime: this.isStarted ? Date.now() - this._startTime : 0
            },
            intelligence: {
                routingAccuracy: this.neuralRouter.getAccuracy(),
                patternsLearned: this.patternEngine.getPatternCount(),
                predictiveSuccess: this.patternEngine.getPredictionAccuracy()
            }
        };
    }
    
    /**
     * Private: Start WebSocket server for inter-server communication
     */
    async _startWebSocketServer() {
        return new Promise((resolve, reject) => {
            this.wsServer = new WebSocket.Server({ port: this.config.port });
            
            this.wsServer.on('connection', (ws, req) => {
                const serverId = req.headers['x-server-id'];
                if (serverId) {
                    this.connectedServers.set(serverId, ws);
                    logger.info(`🔗 Server ${serverId} connected to Super-Hub`);
                    
                    ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data);
                            this._handleServerMessage(serverId, message);
                        } catch (error) {
                            logger.error('Invalid message from server:', error);
                        }
                    });
                    
                    ws.on('close', () => {
                        this.connectedServers.delete(serverId);
                        logger.info(`❌ Server ${serverId} disconnected from Super-Hub`);
                    });
                }
            });
            
            this.wsServer.on('listening', () => {
                logger.info(`🌐 Super-Hub WebSocket server listening on port ${this.config.port}`);
                resolve();
            });
            
            this.wsServer.on('error', reject);
        });
    }
    
    /**
     * Private: Discover existing MCP servers
     */
    async _discoverServers() {
        // Register known servers from configuration
        const knownServers = [
            {
                id: 'aegntic-knowledge-engine',
                name: 'Aegntic Knowledge Engine',
                type: 'python',
                url: 'http://localhost:8052',
                capabilities: ['web_crawling', 'rag', 'knowledge_graph', 'task_management', 'sequential_thinking'],
                priority: 10
            },
            {
                id: 'n8n-mcp',
                name: 'n8n Workflow Automation',
                type: 'nodejs',
                url: 'http://localhost:3000',
                capabilities: ['workflow_automation', 'task_execution', 'file_operations', 'credential_management'],
                priority: 9
            },
            {
                id: 'docker-mcp',
                name: 'Docker Container Management',
                type: 'nodejs', 
                url: 'http://localhost:3001',
                capabilities: ['container_management', 'image_operations', 'docker_compose'],
                priority: 7
            },
            {
                id: 'firebase-studio-mcp',
                name: 'Firebase Studio',
                type: 'nodejs',
                url: 'http://localhost:3002', 
                capabilities: ['firebase_operations', 'cloud_storage', 'database_management'],
                priority: 6
            }
        ];
        
        for (const serverInfo of knownServers) {
            try {
                await this.registerServer(serverInfo);
            } catch (error) {
                logger.warn(`Failed to register server ${serverInfo.name}:`, error.message);
            }
        }
    }
    
    /**
     * Private: Start health monitoring for all servers
     */
    _startHealthMonitoring() {
        setInterval(async () => {
            const servers = Array.from(this.serverRegistry.values());
            const healthChecks = servers.map(server => this._checkServerHealth(server));
            await Promise.allSettled(healthChecks);
        }, this.config.healthCheckInterval);
    }
    
    /**
     * Private: Check health of a specific server
     */
    async _checkServerHealth(server) {
        const startTime = Date.now();
        
        try {
            // Implementation would depend on server type
            // For now, we'll simulate health checks
            const response = await this._pingServer(server.url);
            
            server.status = 'healthy';
            server.responseTime = Date.now() - startTime;
            server.lastHealthCheck = new Date();
            server.errorCount = Math.max(0, server.errorCount - 1); // Recover from errors
            
        } catch (error) {
            server.status = 'unhealthy';
            server.errorCount++;
            server.lastHealthCheck = new Date();
            
            if (server.errorCount >= this.config.maxRetries) {
                server.status = 'failed';
                logger.error(`Server ${server.name} marked as failed after ${server.errorCount} errors`);
            }
        }
    }
    
    /**
     * Private: Simple server ping
     */
    async _pingServer(url) {
        // Simplified ping - in real implementation would use proper health check endpoints
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random success/failure for testing
                Math.random() > 0.1 ? resolve() : reject(new Error('Ping failed'));
            }, Math.random() * 100 + 50);
        });
    }
    
    /**
     * Private: Execute request with fallback strategy
     */
    async _executeWithFallback(routing, request) {
        let lastError;
        
        // Try primary server
        try {
            return await this._executeOnServer(routing.primary, request);
        } catch (error) {
            lastError = error;
            logger.warn(`Primary server failed, trying fallbacks:`, error.message);
        }
        
        // Try fallback servers
        for (const fallback of routing.fallbacks || []) {
            try {
                return await this._executeOnServer(fallback, request);
            } catch (error) {
                lastError = error;
                logger.warn(`Fallback server ${fallback.id} failed:`, error.message);
            }
        }
        
        throw lastError || new Error('All servers failed');
    }
    
    /**
     * Private: Execute request on specific server
     */
    async _executeOnServer(server, request) {
        // Implementation would call the actual server
        // For now, simulate execution
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                server.requestCount++;
                Math.random() > 0.05 ? 
                    resolve({ server: server.id, result: 'success', request }) :
                    reject(new Error('Server execution failed'));
            }, Math.random() * 200 + 50);
        });
    }
    
    /**
     * Private: Handle messages from connected servers
     */
    _handleServerMessage(serverId, message) {
        switch (message.type) {
            case 'state_update':
                this.stateSynchronizer.handleStateUpdate(serverId, message.data);
                break;
            case 'capability_update':
                this._updateServerCapabilities(serverId, message.data);
                break;
            case 'request_coordination':
                this._handleCoordinationRequest(serverId, message.data);
                break;
            default:
                logger.warn(`Unknown message type from ${serverId}:`, message.type);
        }
    }
    
    /**
     * Private: Update server capabilities
     */
    _updateServerCapabilities(serverId, capabilities) {
        const server = this.serverRegistry.get(serverId);
        if (server) {
            server.capabilities = capabilities;
            this.neuralRouter.onServerUpdated(server);
            logger.info(`Updated capabilities for ${server.name}`);
        }
    }
    
    /**
     * Private: Handle coordination requests between servers
     */
    async _handleCoordinationRequest(serverId, request) {
        // Forward coordination requests to other relevant servers
        const relevantServers = this._findRelevantServers(request);
        
        for (const server of relevantServers) {
            if (server.id !== serverId) {
                const ws = this.connectedServers.get(server.id);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'coordination_request',
                        from: serverId,
                        data: request
                    }));
                }
            }
        }
    }
    
    /**
     * Private: Find servers relevant to a coordination request
     */
    _findRelevantServers(request) {
        // Implementation would analyze request and find relevant servers
        return Array.from(this.serverRegistry.values())
            .filter(server => server.status === 'healthy');
    }
    
    /**
     * Private: Update performance metrics
     */
    _updateMetrics(responseTime, success) {
        // Update average response time (rolling average)
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
        
        // Update success rate
        this.metrics.successRate = 
            (this.metrics.successRate * 0.9) + (success ? 10 : 0);
    }
    
    /**
     * Stop the Super-Hub
     */
    async stop() {
        if (!this.isStarted) return;
        
        logger.info('🛑 Stopping Super-Hub Neural Network...');
        
        // Close WebSocket connections
        for (const ws of this.connectedServers.values()) {
            ws.close();
        }
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Stop components
        await this.patternEngine.stop();
        await this.stateSynchronizer.stop();
        await this.neuralRouter.stop();
        
        this.isStarted = false;
        this.emit('stopped');
        
        logger.info('🔌 Super-Hub Neural Network Offline');
    }
}

module.exports = SuperHub;