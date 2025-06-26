// Health Check Service for 4site.pro
export class HealthCheck {
    constructor() {
        this.checks = new Map();
        this.lastResults = new Map();
    }

    // Register a health check
    register(name, checkFunction) {
        this.checks.set(name, checkFunction);
    }

    // Run all health checks
    async runAll() {
        const results = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                total: this.checks.size,
                healthy: 0,
                unhealthy: 0
            }
        };

        for (const [name, checkFn] of this.checks) {
            try {
                const start = Date.now();
                const result = await checkFn();
                const duration = Date.now() - start;
                
                results.checks[name] = {
                    status: 'healthy',
                    duration,
                    details: result,
                    timestamp: new Date().toISOString()
                };
                results.summary.healthy++;
            } catch (error) {
                results.checks[name] = {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                results.summary.unhealthy++;
                results.status = 'unhealthy';
            }
        }

        this.lastResults.set('health', results);
        return results;
    }

    // Get last health check results
    getLastResults() {
        return this.lastResults.get('health') || null;
    }
}

// Default health checks for 4site.pro
export const defaultHealthChecks = {
    // Check if API is responsive
    apiHealth: async () => {
        const start = Date.now();
        // Simulate API health check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return {
            responseTime: Date.now() - start,
            status: 'operational'
        };
    },

    // Check Gemini AI service
    aiService: async () => {
        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('placeholder')) {
            throw new Error('Gemini API key not configured');
        }
        return {
            status: 'configured',
            keyLength: apiKey.length
        };
    },

    // Check system resources
    systemResources: async () => {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        return {
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            uptime: Math.round(uptime),
            nodeVersion: process.version
        };
    },

    // Check application build
    buildStatus: async () => {
        const distPath = path.join(process.cwd(), 'dist');
        const distExists = fs.existsSync(distPath);
        
        if (!distExists) {
            throw new Error('Production build not found');
        }
        
        const stats = fs.statSync(distPath);
        return {
            buildExists: true,
            buildTime: stats.mtime.toISOString()
        };
    }
};