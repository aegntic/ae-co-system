// Alert System for 4site.pro
export class AlertManager {
    constructor() {
        this.rules = new Map();
        this.alerts = [];
    }

    // Add alert rule
    addRule(name, condition, severity = 'warning') {
        this.rules.set(name, {
            name,
            condition,
            severity,
            lastTriggered: null
        });
    }

    // Check all rules against current metrics
    checkRules(metrics, healthData) {
        const newAlerts = [];

        for (const [name, rule] of this.rules) {
            try {
                const triggered = rule.condition(metrics, healthData);
                
                if (triggered) {
                    const alert = {
                        rule: name,
                        severity: rule.severity,
                        message: triggered.message || `Alert: ${name}`,
                        timestamp: new Date().toISOString(),
                        data: triggered.data || {}
                    };
                    
                    newAlerts.push(alert);
                    this.alerts.push(alert);
                    
                    // Keep only last 100 alerts
                    if (this.alerts.length > 100) {
                        this.alerts.splice(0, this.alerts.length - 100);
                    }
                }
            } catch (error) {
                console.error(`Error checking rule ${name}:`, error);
            }
        }

        return newAlerts;
    }

    // Get recent alerts
    getRecentAlerts(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
    }
}

// Default alert rules for 4site.pro
export const defaultAlertRules = {
    highErrorRate: {
        condition: (metrics, health) => {
            const errorMetric = metrics.metrics?.errors;
            if (errorMetric && errorMetric.latest > 5) {
                return {
                    message: `High error rate detected: ${errorMetric.latest} errors`,
                    data: { errorCount: errorMetric.latest }
                };
            }
            return false;
        },
        severity: 'critical'
    },

    unhealthyService: {
        condition: (metrics, health) => {
            if (health && health.status === 'unhealthy') {
                return {
                    message: `Service health check failed: ${health.summary.unhealthy} checks failed`,
                    data: { unhealthyChecks: health.summary.unhealthy }
                };
            }
            return false;
        },
        severity: 'critical'
    },

    slowResponseTime: {
        condition: (metrics, health) => {
            const responseMetric = metrics.metrics?.responseTime;
            if (responseMetric && responseMetric.average > 3000) {
                return {
                    message: `Slow response time: ${responseMetric.average}ms average`,
                    data: { avgResponseTime: responseMetric.average }
                };
            }
            return false;
        },
        severity: 'warning'
    }
};