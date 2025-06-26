#!/usr/bin/env node

/**
 * 4site.pro Real-time Monitoring Dashboard Server
 * Enterprise-grade monitoring dashboard with business intelligence
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Monitoring services
const MetricsCollector = require('./services/MetricsCollector');
const AlertManager = require('./services/AlertManager');
const BusinessIntelligence = require('./services/BusinessIntelligence');
const PerformanceMonitor = require('./services/PerformanceMonitor');
const SecurityMonitor = require('./services/SecurityMonitor');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.DASHBOARD_ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.DASHBOARD_PORT || 3333;

// Initialize monitoring services
const metricsCollector = new MetricsCollector();
const alertManager = new AlertManager();
const businessIntelligence = new BusinessIntelligence();
const performanceMonitor = new PerformanceMonitor();
const securityMonitor = new SecurityMonitor();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token (implement your JWT verification)
  const validToken = process.env.DASHBOARD_ACCESS_TOKEN || 'dashboard-token-2024';
  if (token !== validToken) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// System metrics endpoint
app.get('/api/metrics/system', authenticateToken, async (req, res) => {
  try {
    const metrics = await metricsCollector.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// Business metrics endpoint
app.get('/api/metrics/business', authenticateToken, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const metrics = await businessIntelligence.getBusinessMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting business metrics:', error);
    res.status(500).json({ error: 'Failed to get business metrics' });
  }
});

// Viral metrics endpoint
app.get('/api/metrics/viral', authenticateToken, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const metrics = await businessIntelligence.getViralMetrics(timeRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting viral metrics:', error);
    res.status(500).json({ error: 'Failed to get viral metrics' });
  }
});

// Performance metrics endpoint
app.get('/api/metrics/performance', authenticateToken, async (req, res) => {
  try {
    const metrics = await performanceMonitor.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Security metrics endpoint
app.get('/api/metrics/security', authenticateToken, async (req, res) => {
  try {
    const metrics = await securityMonitor.getSecurityMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting security metrics:', error);
    res.status(500).json({ error: 'Failed to get security metrics' });
  }
});

// Alerts endpoint
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const alerts = await alertManager.getAlerts(status);
    res.json(alerts);
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Real-time data endpoints
app.get('/api/realtime/dashboard', authenticateToken, async (req, res) => {
  try {
    const dashboard = await getDashboardData();
    res.json(dashboard);
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Historical data endpoint
app.get('/api/historical/:metric', authenticateToken, async (req, res) => {
  try {
    const { metric } = req.params;
    const { startTime, endTime, granularity } = req.query;
    
    const data = await metricsCollector.getHistoricalData(
      metric,
      startTime,
      endTime,
      granularity
    );
    
    res.json(data);
  } catch (error) {
    console.error('Error getting historical data:', error);
    res.status(500).json({ error: 'Failed to get historical data' });
  }
});

// WebSocket connections for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to dashboard:', socket.id);
  
  // Send initial dashboard data
  getDashboardData().then(data => {
    socket.emit('dashboard-data', data);
  });
  
  // Subscribe to real-time updates
  socket.on('subscribe', (channels) => {
    console.log('Client subscribed to channels:', channels);
    socket.join(channels);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Real-time data collection and broadcasting
const broadcastRealtimeData = async () => {
  try {
    const dashboardData = await getDashboardData();
    io.emit('dashboard-update', dashboardData);
    
    // Broadcast specific metric updates
    const systemMetrics = await metricsCollector.getSystemMetrics();
    io.to('system').emit('system-metrics', systemMetrics);
    
    const businessMetrics = await businessIntelligence.getBusinessMetrics('1h');
    io.to('business').emit('business-metrics', businessMetrics);
    
    const alerts = await alertManager.getActiveAlerts();
    if (alerts.length > 0) {
      io.emit('alerts-update', alerts);
    }
    
  } catch (error) {
    console.error('Error broadcasting real-time data:', error);
  }
};

// Alert broadcasting
const broadcastAlert = (alert) => {
  io.emit('new-alert', alert);
  console.log('Alert broadcasted:', alert.title);
};

// Dashboard data aggregation
const getDashboardData = async () => {
  try {
    const [
      systemMetrics,
      businessMetrics,
      viralMetrics,
      performanceMetrics,
      securityMetrics,
      activeAlerts
    ] = await Promise.all([
      metricsCollector.getSystemMetrics(),
      businessIntelligence.getBusinessMetrics('24h'),
      businessIntelligence.getViralMetrics('24h'),
      performanceMonitor.getPerformanceMetrics(),
      securityMonitor.getSecurityMetrics(),
      alertManager.getActiveAlerts()
    ]);
    
    return {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      business: businessMetrics,
      viral: viralMetrics,
      performance: performanceMetrics,
      security: securityMetrics,
      alerts: activeAlerts,
      health: {
        overall: calculateOverallHealth(systemMetrics, businessMetrics, performanceMetrics),
        components: {
          database: systemMetrics.database?.status || 'unknown',
          redis: systemMetrics.redis?.status || 'unknown',
          external_apis: systemMetrics.externalApis?.status || 'unknown',
          viral_engine: viralMetrics.status || 'unknown'
        }
      }
    };
  } catch (error) {
    console.error('Error aggregating dashboard data:', error);
    throw error;
  }
};

// Health calculation
const calculateOverallHealth = (system, business, performance) => {
  const scores = [];
  
  // System health (40% weight)
  if (system.database?.status === 'healthy') scores.push(100);
  else if (system.database?.status === 'warning') scores.push(70);
  else scores.push(0);
  
  // Business health (30% weight)
  if (business.viral?.coefficient > 0.8) scores.push(100);
  else if (business.viral?.coefficient > 0.5) scores.push(70);
  else scores.push(30);
  
  // Performance health (30% weight)
  if (performance.responseTime?.p95 < 2000) scores.push(100);
  else if (performance.responseTime?.p95 < 5000) scores.push(70);
  else scores.push(30);
  
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (averageScore >= 90) return 'excellent';
  if (averageScore >= 70) return 'good';
  if (averageScore >= 50) return 'warning';
  return 'critical';
};

// Initialize monitoring services
const initializeServices = async () => {
  try {
    await metricsCollector.initialize();
    await alertManager.initialize();
    await businessIntelligence.initialize();
    await performanceMonitor.initialize();
    await securityMonitor.initialize();
    
    console.log('✅ All monitoring services initialized');
    
    // Set up alert callback
    alertManager.onAlert(broadcastAlert);
    
    // Start real-time data broadcasting
    setInterval(broadcastRealtimeData, 30000); // Every 30 seconds
    
  } catch (error) {
    console.error('❌ Error initializing monitoring services:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down monitoring dashboard...');
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
server.listen(PORT, async () => {
  console.log(\`🚀 4site.pro Monitoring Dashboard running on port \${PORT}\`);
  console.log(\`📊 Dashboard URL: http://localhost:\${PORT}\`);
  console.log(\`🔗 API URL: http://localhost:\${PORT}/api\`);
  
  await initializeServices();
  
  console.log('🎯 Real-time monitoring active');
});

module.exports = { app, server, io };