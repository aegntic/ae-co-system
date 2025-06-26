/**
 * Neural Router - Intelligent Request Distribution
 * 
 * Uses AI-driven routing algorithms to direct requests to optimal servers
 * based on capabilities, performance, and learned patterns.
 */

const logger = require('./utils/logger');

class NeuralRouter {
    constructor(superHub) {
        this.superHub = superHub;
        this.routingHistory = [];
        this.serverCapabilityMap = new Map();
        this.performanceWeights = new Map();
        this.routingAccuracy = 0.95; // Start with optimistic accuracy
        
        // Routing algorithms
        this.algorithms = {
            capability: this._routeByCapability.bind(this),
            performance: this._routeByPerformance.bind(this),
            loadBalance: this._routeByLoadBalance.bind(this),
            intelligent: this._routeIntelligent.bind(this)
        };
    }
    
    async initialize() {
        logger.info('🧠 Neural Router initializing...');
        
        // Initialize capability mapping
        this._buildCapabilityMap();
        
        // Initialize performance weights
        this._initializePerformanceWeights();
        
        logger.info('✨ Neural Router intelligence activated');
    }
    
    /**
     * Route a request to the optimal server(s)
     */
    async route(request) {
        const routingStart = Date.now();
        
        try {
            // Analyze request to determine routing strategy
            const strategy = this._analyzeRequestStrategy(request);
            
            // Apply routing algorithm
            const routing = await this.algorithms[strategy](request);
            
            // Validate routing decision
            if (!routing.primary) {
                throw new Error('No suitable server found');
            }
            
            // Record routing decision
            this._recordRouting(request, routing, strategy, Date.now() - routingStart);
            
            return routing;
            
        } catch (error) {
            logger.error('Neural routing failed:', error);
            throw error;
        }
    }
    
    /**
     * Handle server registration
     */
    onServerRegistered(server) {
        this._updateCapabilityMap(server);
        this._initializeServerPerformance(server);
        logger.info(`🔗 Neural Router learned new server: ${server.name}`);
    }
    
    /**
     * Handle server updates
     */
    onServerUpdated(server) {
        this._updateCapabilityMap(server);
        logger.info(`🔄 Neural Router updated mappings for: ${server.name}`);
    }
    
    /**
     * Get current routing accuracy
     */
    getAccuracy() {
        return this.routingAccuracy;
    }
    
    /**
     * Private: Analyze request to determine optimal routing strategy
     */
    _analyzeRequestStrategy(request) {
        const { type, urgency, complexity, capabilities } = request;
        
        // High urgency requests use performance-based routing
        if (urgency === 'high') {
            return 'performance';
        }
        
        // Complex requests use intelligent routing
        if (complexity === 'high' || (capabilities && capabilities.length > 1)) {
            return 'intelligent';
        }
        
        // Simple requests use capability-based routing
        return 'capability';
    }
    
    /**
     * Private: Route based on capability matching
     */
    async _routeByCapability(request) {
        const requiredCapabilities = request.capabilities || [request.type];
        const servers = Array.from(this.superHub.serverRegistry.values())
            .filter(server => server.status === 'healthy');
        
        // Score servers based on capability match
        const scored = servers.map(server => {
            const matchedCapabilities = server.capabilities.filter(cap => 
                requiredCapabilities.some(req => 
                    cap.includes(req) || req.includes(cap)
                )
            );
            
            const score = matchedCapabilities.length / requiredCapabilities.length;
            return { server, score, matchedCapabilities };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
        
        if (scored.length === 0) {
            throw new Error(`No servers found with capabilities: ${requiredCapabilities.join(', ')}`);
        }
        
        return {
            primary: scored[0].server,
            fallbacks: scored.slice(1, 3).map(item => item.server),
            strategy: 'capability',
            confidence: scored[0].score,
            reasoning: `Best capability match: ${scored[0].matchedCapabilities.join(', ')}`
        };
    }
    
    /**
     * Private: Route based on performance metrics
     */
    async _routeByPerformance(request) {
        const servers = Array.from(this.superHub.serverRegistry.values())
            .filter(server => server.status === 'healthy');
        
        if (servers.length === 0) {
            throw new Error('No healthy servers available');
        }
        
        // Score servers based on performance
        const scored = servers.map(server => {
            const responseTime = server.responseTime || 1000;
            const errorRate = server.errorCount / Math.max(server.requestCount, 1);
            const weight = this.performanceWeights.get(server.id) || 1;
            
            // Lower is better for response time and error rate
            const score = weight / (responseTime * (1 + errorRate));
            
            return { server, score, responseTime, errorRate };
        })
        .sort((a, b) => b.score - a.score);
        
        return {
            primary: scored[0].server,
            fallbacks: scored.slice(1, 3).map(item => item.server),
            strategy: 'performance',
            confidence: 0.9,
            reasoning: `Best performance: ${scored[0].responseTime}ms, ${(scored[0].errorRate * 100).toFixed(1)}% error rate`
        };
    }
    
    /**
     * Private: Route based on load balancing
     */
    async _routeByLoadBalance(request) {
        const servers = Array.from(this.superHub.serverRegistry.values())
            .filter(server => server.status === 'healthy');
        
        if (servers.length === 0) {
            throw new Error('No healthy servers available');
        }
        
        // Use round-robin or least-connections approach
        const leastBusy = servers.reduce((min, server) => {
            const load = server.requestCount || 0;
            return (load < (min.requestCount || 0)) ? server : min;
        });
        
        return {
            primary: leastBusy,
            fallbacks: servers.filter(s => s.id !== leastBusy.id).slice(0, 2),
            strategy: 'loadBalance',
            confidence: 0.8,
            reasoning: `Load balanced: ${leastBusy.requestCount || 0} active requests`
        };
    }
    
    /**
     * Private: Intelligent routing combining multiple factors
     */
    async _routeIntelligent(request) {
        const servers = Array.from(this.superHub.serverRegistry.values())
            .filter(server => server.status === 'healthy');
        
        if (servers.length === 0) {
            throw new Error('No healthy servers available');
        }
        
        const requiredCapabilities = request.capabilities || [request.type];
        
        // Multi-factor scoring
        const scored = servers.map(server => {
            // Capability score (0-1)
            const matchedCapabilities = server.capabilities.filter(cap => 
                requiredCapabilities.some(req => 
                    cap.includes(req) || req.includes(cap)
                )
            );
            const capabilityScore = matchedCapabilities.length / requiredCapabilities.length;
            
            // Performance score (0-1, inverted from response time)
            const responseTime = server.responseTime || 1000;
            const performanceScore = Math.max(0, 1 - (responseTime / 2000));
            
            // Load score (0-1, inverted from request count)
            const loadScore = Math.max(0, 1 - ((server.requestCount || 0) / 100));
            
            // Priority score (0-1, normalized from server priority)
            const priorityScore = (server.priority || 5) / 10;
            
            // Historical success score
            const weight = this.performanceWeights.get(server.id) || 1;
            const successScore = Math.min(1, weight);
            
            // Weighted combination
            const totalScore = (
                capabilityScore * 0.4 +
                performanceScore * 0.2 +
                loadScore * 0.15 +
                priorityScore * 0.15 +
                successScore * 0.1
            );
            
            return {
                server,
                score: totalScore,
                breakdown: {
                    capability: capabilityScore,
                    performance: performanceScore,
                    load: loadScore,
                    priority: priorityScore,
                    success: successScore
                }
            };
        })
        .filter(item => item.breakdown.capability > 0) // Must have some capability match
        .sort((a, b) => b.score - a.score);
        
        if (scored.length === 0) {
            // Fallback to any healthy server
            return this._routeByPerformance(request);
        }
        
        const best = scored[0];
        
        return {
            primary: best.server,
            fallbacks: scored.slice(1, 3).map(item => item.server),
            strategy: 'intelligent',
            confidence: best.score,
            reasoning: `Intelligent routing: ${(best.score * 100).toFixed(1)}% match`,
            breakdown: best.breakdown
        };
    }
    
    /**
     * Private: Build capability mapping from registered servers
     */
    _buildCapabilityMap() {
        this.serverCapabilityMap.clear();
        
        for (const server of this.superHub.serverRegistry.values()) {
            this._updateCapabilityMap(server);
        }
    }
    
    /**
     * Private: Update capability mapping for a server
     */
    _updateCapabilityMap(server) {
        for (const capability of server.capabilities) {
            if (!this.serverCapabilityMap.has(capability)) {
                this.serverCapabilityMap.set(capability, []);
            }
            
            const servers = this.serverCapabilityMap.get(capability);
            if (!servers.find(s => s.id === server.id)) {
                servers.push(server);
            }
        }
    }
    
    /**
     * Private: Initialize performance weights
     */
    _initializePerformanceWeights() {
        for (const server of this.superHub.serverRegistry.values()) {
            this._initializeServerPerformance(server);
        }
    }
    
    /**
     * Private: Initialize performance tracking for a server
     */
    _initializeServerPerformance(server) {
        if (!this.performanceWeights.has(server.id)) {
            // Start with neutral weight, will be adjusted based on performance
            this.performanceWeights.set(server.id, 1.0);
        }
    }
    
    /**
     * Private: Record routing decision for learning
     */
    _recordRouting(request, routing, strategy, routingTime) {
        const record = {
            timestamp: new Date(),
            request: {
                type: request.type,
                capabilities: request.capabilities,
                urgency: request.urgency,
                complexity: request.complexity
            },
            routing: {
                primary: routing.primary.id,
                fallbacks: routing.fallbacks?.map(s => s.id) || [],
                strategy,
                confidence: routing.confidence
            },
            routingTime,
            success: null // Will be updated when request completes
        };
        
        this.routingHistory.push(record);
        
        // Keep only recent history (last 1000 records)
        if (this.routingHistory.length > 1000) {
            this.routingHistory = this.routingHistory.slice(-1000);
        }
    }
    
    /**
     * Update routing success/failure for learning
     */
    updateRoutingOutcome(routing, success, responseTime) {
        // Find the corresponding routing record
        const record = this.routingHistory
            .reverse()
            .find(r => r.routing.primary === routing.primary.id && r.success === null);
        
        if (record) {
            record.success = success;
            record.responseTime = responseTime;
            
            // Update performance weights based on outcome
            this._updatePerformanceWeight(routing.primary.id, success, responseTime);
            
            // Update routing accuracy
            this._updateRoutingAccuracy();
        }
    }
    
    /**
     * Private: Update performance weight for a server
     */
    _updatePerformanceWeight(serverId, success, responseTime) {
        const currentWeight = this.performanceWeights.get(serverId) || 1.0;
        
        let adjustment = 0;
        if (success) {
            // Increase weight for successful responses
            adjustment = 0.1;
            if (responseTime < 500) adjustment = 0.2; // Extra boost for fast responses
        } else {
            // Decrease weight for failures
            adjustment = -0.2;
        }
        
        const newWeight = Math.max(0.1, Math.min(2.0, currentWeight + adjustment));
        this.performanceWeights.set(serverId, newWeight);
    }
    
    /**
     * Private: Update overall routing accuracy based on recent history
     */
    _updateRoutingAccuracy() {
        const recentRecords = this.routingHistory
            .filter(r => r.success !== null)
            .slice(-100); // Last 100 completed routings
        
        if (recentRecords.length > 0) {
            const successCount = recentRecords.filter(r => r.success).length;
            this.routingAccuracy = successCount / recentRecords.length;
        }
    }
    
    /**
     * Get routing statistics
     */
    getRoutingStats() {
        const totalRoutings = this.routingHistory.length;
        const completedRoutings = this.routingHistory.filter(r => r.success !== null);
        const successfulRoutings = completedRoutings.filter(r => r.success);
        
        const avgRoutingTime = this.routingHistory.length > 0 ?
            this.routingHistory.reduce((sum, r) => sum + r.routingTime, 0) / this.routingHistory.length :
            0;
        
        const avgResponseTime = completedRoutings.length > 0 ?
            completedRoutings.reduce((sum, r) => sum + (r.responseTime || 0), 0) / completedRoutings.length :
            0;
        
        return {
            totalRoutings,
            successRate: completedRoutings.length > 0 ? successfulRoutings.length / completedRoutings.length : 0,
            avgRoutingTime,
            avgResponseTime,
            accuracy: this.routingAccuracy
        };
    }
    
    /**
     * Stop the Neural Router
     */
    async stop() {
        logger.info('🛑 Neural Router stopping...');
        // Cleanup if needed
    }
}

module.exports = NeuralRouter;