/**
 * MCP Server Configuration
 * 
 * Centralized configuration for the MCP server.
 */

module.exports = {
    // Server configuration
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    
    // API configuration
    api: {
        prefix: '/api',
        version: 'v1',
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        }
    },
    
    // Database configuration (for future use)
    database: {
        type: 'sqlite', // Using SQLite for simplicity
        path: process.env.DB_PATH || './data/mcp.db'
    },
    
    // n8n configuration
    n8n: {
        url: process.env.N8N_URL || 'http://localhost:5678',
        apiKey: process.env.N8N_API_KEY || '',
        user: process.env.N8N_USER || 'admin',
        password: process.env.N8N_PASSWORD || 'password'
    },
    
    // Sesame CSM configuration
    sesame: {
        modelPath: process.env.SESAME_MODEL_PATH || '/opt/csm/models/csm-tiny',
        audioOutputDir: process.env.AUDIO_OUTPUT_DIR || './media/generated/audio',
        defaultVoice: process.env.DEFAULT_VOICE || 'default',
        sampleRate: parseInt(process.env.SAMPLE_RATE || '22050', 10)
    },
    
    // FFmpeg configuration
    ffmpeg: {
        useGPU: process.env.USE_GPU === 'true' || false,
        gpuDevice: process.env.GPU_DEVICE || '0'
    },
    
    // AI agent configuration
    agents: {
        monitoringInterval: parseInt(process.env.AGENT_MONITOR_INTERVAL || '60000', 10), // 1 minute
        optimizationInterval: parseInt(process.env.AGENT_OPTIMIZE_INTERVAL || '3600000', 10) // 1 hour
    }
};
