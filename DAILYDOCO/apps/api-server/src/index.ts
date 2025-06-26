import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'dailydoco-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// System metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    capture: {
      isActive: Math.random() > 0.5,
      fps: Math.floor(Math.random() * 30) + 30,
      resolution: '1920x1080',
      cpuUsage: Math.floor(Math.random() * 5) + 2,
      memoryUsage: Math.floor(Math.random() * 50) + 150
    },
    processing: {
      queueLength: Math.floor(Math.random() * 3),
      currentJob: Math.random() > 0.7 ? 'Processing aegnt-27 demo' : null,
      completedToday: Math.floor(Math.random() * 10) + 5,
      averageProcessingTime: Math.floor(Math.random() * 30) + 45
    },
    ai: {
      modelsLoaded: ['DeepSeek R1', 'Gemma 3', 'aegnt-27'],
      availableCapacity: Math.floor(Math.random() * 30) + 70,
      currentTasks: Math.floor(Math.random() * 3)
    },
    system: {
      diskSpace: Math.floor(Math.random() * 20) + 60,
      temperature: Math.floor(Math.random() * 10) + 45,
      networkStatus: 'online',
      batteryLevel: Math.floor(Math.random() * 30) + 70
    }
  });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected to status stream');
  
  // Send metrics every 2 seconds
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        type: 'metrics',
        data: {
          capture: {
            isActive: Math.random() > 0.5,
            fps: Math.floor(Math.random() * 30) + 30,
            resolution: '1920x1080',
            cpuUsage: Math.floor(Math.random() * 5) + 2,
            memoryUsage: Math.floor(Math.random() * 50) + 150
          },
          processing: {
            queueLength: Math.floor(Math.random() * 3),
            currentJob: Math.random() > 0.7 ? 'Processing aegnt-27 demo' : null,
            completedToday: Math.floor(Math.random() * 10) + 5,
            averageProcessingTime: Math.floor(Math.random() * 30) + 45
          },
          ai: {
            modelsLoaded: ['DeepSeek R1', 'Gemma 3', 'aegnt-27'],
            availableCapacity: Math.floor(Math.random() * 30) + 70,
            currentTasks: Math.floor(Math.random() * 3)
          },
          system: {
            diskSpace: Math.floor(Math.random() * 20) + 60,
            temperature: Math.floor(Math.random() * 10) + 45,
            networkStatus: 'online',
            batteryLevel: Math.floor(Math.random() * 30) + 70
          }
        }
      }));
    }
  }, 2000);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// Export jobs endpoint
app.get('/api/exports', (req, res) => {
  res.json({
    jobs: [
      {
        id: '1',
        name: 'React Tutorial - Components',
        platform: 'youtube',
        format: 'mp4',
        status: 'completed',
        progress: 100,
        outputSize: 245,
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3300000).toISOString()
      },
      {
        id: '2',
        name: 'API Integration Demo',
        platform: 'internal',
        format: 'webm',
        status: 'processing',
        progress: Math.floor(Math.random() * 40) + 30,
        outputSize: 0,
        startTime: new Date(Date.now() - 900000).toISOString()
      }
    ]
  });
});

// Start export job
app.post('/api/exports', (req, res) => {
  const { platform, format, settings } = req.body;
  const newJob = {
    id: Date.now().toString(),
    name: `Export for ${platform}`,
    platform,
    format,
    status: 'processing',
    progress: 0,
    outputSize: 0,
    startTime: new Date().toISOString()
  };
  
  res.json({ success: true, job: newJob });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 DailyDoco Pro API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket status stream available`);
  console.log(`📦 Export jobs: http://localhost:${PORT}/api/exports`);
});
