// Metrics Collection for 4site.pro
export class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
    }

    // Record a metric
    record(name, value, tags = {}) {
        const timestamp = Date.now();
        const metric = {
            name,
            value,
            tags,
            timestamp
        };

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        this.metrics.get(name).push(metric);
        
        // Keep only last 1000 entries per metric
        const entries = this.metrics.get(name);
        if (entries.length > 1000) {
            entries.splice(0, entries.length - 1000);
        }
    }

    // Get metrics summary
    getSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            metrics: {}
        };

        for (const [name, entries] of this.metrics) {
            const recent = entries.slice(-10);
            const values = recent.map(e => e.value);
            
            summary.metrics[name] = {
                count: entries.length,
                latest: values[values.length - 1] || 0,
                average: values.reduce((a, b) => a + b, 0) / values.length || 0,
                min: Math.min(...values) || 0,
                max: Math.max(...values) || 0
            };
        }

        return summary;
    }

    // Export metrics in Prometheus format
    exportPrometheus() {
        let output = '';
        
        for (const [name, entries] of this.metrics) {
            const latest = entries[entries.length - 1];
            if (latest) {
                const tags = Object.entries(latest.tags)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(',');
                
                output += `${name}${tags ? `{${tags}}` : ''} ${latest.value}\n`;
            }
        }
        
        return output;
    }
}

// Business metrics for 4site.pro
export const businessMetrics = {
    siteGenerations: 0,
    userInteractions: 0,
    apiCalls: 0,
    errors: 0,
    responseTime: []
};