/**
 * MCP Server - Main entry point
 * 
 * This file serves as the entry point for the MCP server,
 * initializing the Express application and setting up routes.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('./utils/logger');
const config = require('./config');
const apiRoutes = require('../api/routes');
const SuperHub = require('./super-hub');

// Initialize Express app
const app = express();

// Initialize Super-Hub Neural Network
const superHub = new SuperHub({
    port: config.superHub?.port || 9101,
    healthCheckInterval: config.superHub?.healthCheckInterval || 30000
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// API routes (inject superHub for advanced endpoints)
app.use('/api', apiRoutes(superHub));

// Super-Hub Neural Network endpoints
app.get('/api/neural/status', (req, res) => {
    try {
        const status = superHub.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        logger.error('Neural status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/neural/route', async (req, res) => {
    try {
        const request = req.body;
        const routing = await superHub.routeRequest(request);
        res.json({ success: true, data: routing });
    } catch (error) {
        logger.error('Neural routing error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/neural/patterns', (req, res) => {
    try {
        const patterns = superHub.patternEngine.getSystemPatterns();
        res.json({ success: true, data: patterns });
    } catch (error) {
        logger.error('Pattern retrieval error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/neural/predict', async (req, res) => {
    try {
        const { sessionId, userId, context } = req.body;
        const prediction = await superHub.patternEngine.predictNextRequest(sessionId, userId, context);
        res.json({ success: true, data: prediction });
    } catch (error) {
        logger.error('Prediction error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/neural/state', (req, res) => {
    try {
        const state = superHub.stateSynchronizer.getGlobalState();
        res.json({ success: true, data: state });
    } catch (error) {
        logger.error('State retrieval error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/neural/servers/register', async (req, res) => {
    try {
        const serverInfo = req.body;
        const server = await superHub.registerServer(serverInfo);
        res.json({ success: true, data: server });
    } catch (error) {
        logger.error('Server registration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', version: config.version });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 9100;

// Start the Neural Network Super-Hub first
superHub.start().then(() => {
    // Then start the main Express server
    app.listen(PORT, () => {
        logger.info(`🎆 aegntic-MCP Neural Network System Online`);
        logger.info(`🌎 Main Server: http://localhost:${PORT}`);
        logger.info(`🧠 Super-Hub: ws://localhost:${superHub.config.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        
        // Log available neural capabilities
        const status = superHub.getStatus();
        logger.info(`✨ Neural Capabilities Active:`);
        logger.info(`   - Intelligent Request Routing`);
        logger.info(`   - Cross-Server State Synchronization`);
        logger.info(`   - Predictive Pattern Recognition`);
        logger.info(`   - Multi-Model Consensus Engine`);
        logger.info(`   - Self-Optimizing Performance`);
        logger.info(`💻 Registered Servers: ${status.servers.total}`);
        logger.info(`🟢 Healthy Servers: ${status.servers.healthy}`);
    });
}).catch(error => {
    logger.error('🛑 Failed to start Neural Network:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('🛑 Shutting down Neural Network System...');
    
    try {
        await superHub.stop();
        logger.info('✅ Neural Network shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Received SIGTERM, shutting down...');
    
    try {
        await superHub.stop();
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during SIGTERM shutdown:', error);
        process.exit(1);
    }
});
