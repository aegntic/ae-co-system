/**
 * API Routes Index
 * 
 * Main router that combines all API routes with Super-Hub integration.
 */

const express = require('express');
const mcpController = require('../controllers/mcp.controller');
const workflowController = require('../controllers/workflow.controller');
const voiceRoutes = require('./voice');

// Export a function that accepts superHub for dependency injection
module.exports = (superHub) => {
    const router = express.Router();
    
    // Inject superHub into controllers that need it
    const enhancedMcpController = {
        ...mcpController,
        superHub
    };
    
    const enhancedWorkflowController = {
        ...workflowController,
        superHub
    };
    
    // MCP server routes (enhanced with neural routing)
    router.get('/mcp/status', (req, res) => enhancedMcpController.getStatus(req, res));
    router.post('/mcp/create', (req, res) => enhancedMcpController.createServer(req, res));
    router.delete('/mcp/:id', (req, res) => enhancedMcpController.deleteServer(req, res));
    
    // Enhanced MCP routes with neural intelligence
    router.post('/mcp/route-intelligent', async (req, res) => {
        try {
            const request = req.body;
            
            // Add intelligent routing capabilities
            const routing = await superHub.routeRequest(request);
            
            // Execute the request using the routed server
            const result = await superHub._executeWithFallback(routing, request);
            
            res.json({ 
                success: true, 
                data: {
                    result,
                    routing: {
                        primary: routing.primary.name,
                        strategy: routing.strategy,
                        confidence: routing.confidence,
                        reasoning: routing.reasoning
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Workflow routes (enhanced with predictive capabilities)
    router.get('/workflows', (req, res) => enhancedWorkflowController.listWorkflows(req, res));
    router.get('/workflows/:id', (req, res) => enhancedWorkflowController.getWorkflow(req, res));
    router.post('/workflows', async (req, res) => {
        try {
            // Create workflow with neural network awareness
            const workflow = await enhancedWorkflowController.createWorkflow(req, res);
            
            // Register workflow with state synchronizer
            if (workflow && workflow.id) {
                await superHub.stateSynchronizer.registerWorkflow(workflow.id, {
                    name: workflow.name,
                    type: 'user_created',
                    metadata: workflow.metadata
                });
            }
            
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    router.put('/workflows/:id', (req, res) => enhancedWorkflowController.updateWorkflow(req, res));
    router.delete('/workflows/:id', (req, res) => enhancedWorkflowController.deleteWorkflow(req, res));
    
    // Enhanced workflow execution with neural optimization
    router.post('/workflows/:id/execute', async (req, res) => {
        try {
            const workflowId = req.params.id;
            const executionData = req.body;
            
            // Predict optimal execution strategy
            const predictions = await superHub.patternEngine.predictWorkflowOptimizations({
                workflowId,
                ...executionData
            });
            
            // Execute with optimizations if available
            if (predictions && predictions.length > 0) {
                executionData.optimizations = predictions;
            }
            
            // Update workflow state
            await superHub.stateSynchronizer.updateWorkflow(workflowId, {
                status: 'executing',
                lastExecution: Date.now()
            });
            
            // Execute the workflow
            const result = await enhancedWorkflowController.executeWorkflow({
                ...req,
                body: executionData
            }, res);
            
            // Update completion state
            await superHub.stateSynchronizer.updateWorkflow(workflowId, {
                status: 'completed',
                lastCompletion: Date.now()
            });
            
        } catch (error) {
            const workflowId = req.params.id;
            
            // Update error state
            await superHub.stateSynchronizer.updateWorkflow(workflowId, {
                status: 'error',
                lastError: Date.now(),
                errorMessage: error.message
            });
            
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Voice synthesis routes
    router.use('/voice', voiceRoutes);
    
    // Advanced neural network routes
    router.get('/intelligence/insights', async (req, res) => {
        try {
            const { userId, sessionId, timeRange } = req.query;
            
            const insights = {
                systemPatterns: superHub.patternEngine.getSystemPatterns(),
                userBehavior: userId ? superHub.patternEngine.getUserBehaviorInsights(userId) : null,
                routingStats: superHub.neuralRouter.getRoutingStats(),
                syncStats: superHub.stateSynchronizer.getSyncStats(),
                predictions: {
                    nextRequest: sessionId ? await superHub.patternEngine.predictNextRequest(sessionId, userId) : null
                }
            };
            
            res.json({ success: true, data: insights });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Proactive assistance endpoint
    router.post('/assistance/proactive', async (req, res) => {
        try {
            const { sessionId, userId, context } = req.body;
            
            // Get predictive suggestions
            const nextRequest = await superHub.patternEngine.predictNextRequest(sessionId, userId, context);
            
            // Get relevant knowledge
            const knowledge = context.query ? 
                superHub.stateSynchronizer.searchKnowledge(context.query, 5) : [];
            
            // Get workflow suggestions
            const workflows = superHub.stateSynchronizer.getState('workflows');
            const suggestedWorkflows = Object.values(workflows)
                .filter(w => w.status === 'active')
                .slice(0, 3);
            
            const assistance = {
                predictedNext: nextRequest,
                relevantKnowledge: knowledge,
                suggestedWorkflows,
                contextualHelp: {
                    message: nextRequest ? 
                        `I predict you might want to ${nextRequest.type} next. Would you like me to prepare that?` :
                        'I\'m ready to help with your next task.',
                    confidence: nextRequest?.confidence || 0
                }
            };
            
            res.json({ success: true, data: assistance });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Server coordination endpoint
    router.post('/coordination/sync', async (req, res) => {
        try {
            const syncResult = await superHub.stateSynchronizer.synchronizeAll();
            res.json({ success: true, data: syncResult });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    // Performance optimization endpoint
    router.get('/optimization/recommendations', async (req, res) => {
        try {
            const stats = superHub.neuralRouter.getRoutingStats();
            const patterns = superHub.patternEngine.getSystemPatterns();
            
            const recommendations = [];
            
            // Analyze performance and suggest optimizations
            if (stats.successRate < 0.9) {
                recommendations.push({
                    type: 'routing_optimization',
                    priority: 'high',
                    message: 'Routing success rate is below 90%. Consider server health checks.',
                    action: 'review_server_configuration'
                });
            }
            
            if (stats.avgResponseTime > 2000) {
                recommendations.push({
                    type: 'performance_optimization',
                    priority: 'medium',
                    message: 'Average response time is high. Consider load balancing.',
                    action: 'enable_load_balancing'
                });
            }
            
            if (patterns.totalPatterns > 1000) {
                recommendations.push({
                    type: 'pattern_optimization',
                    priority: 'low',
                    message: 'Large number of patterns detected. Consider pattern archiving.',
                    action: 'archive_old_patterns'
                });
            }
            
            res.json({ success: true, data: { recommendations, stats, patterns } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    return router;
};
