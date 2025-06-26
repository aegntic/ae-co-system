/**
 * 4site.pro Monitoring Dashboard Client
 * Real-time dashboard with WebSocket updates
 */

class MonitoringDashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.currentSection = 'overview';
        this.lastUpdate = null;
        
        this.init();
    }
    
    async init() {
        try {
            await this.initializeSocket();
            this.setupNavigation();
            this.setupEventListeners();
            await this.loadInitialData();
            
            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }
    
    async initializeSocket() {
        return new Promise((resolve, reject) => {
            this.socket = io({
                transports: ['websocket', 'polling']
            });
            
            this.socket.on('connect', () => {
                console.log('🔗 Connected to monitoring server');
                resolve();
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
                reject(error);
            });
            
            this.socket.on('disconnect', () => {
                console.log('🔌 Disconnected from monitoring server');
                this.updateConnectionStatus(false);
            });
            
            // Real-time data updates
            this.socket.on('dashboard-update', (data) => {
                this.handleDashboardUpdate(data);
            });
            
            this.socket.on('new-alert', (alert) => {
                this.handleNewAlert(alert);
            });
            
            this.socket.on('system-metrics', (metrics) => {
                this.handleSystemMetrics(metrics);
            });
            
            this.socket.on('business-metrics', (metrics) => {
                this.handleBusinessMetrics(metrics);
            });
        });
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });
    }
    
    setupEventListeners() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.refreshCurrentSection();
        }, 30000);
        
        // Handle visibility change (pause updates when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.socket?.disconnect();
            } else {
                this.socket?.connect();
            }
        });
    }
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Subscribe to real-time updates
            this.socket.emit('subscribe', ['system', 'business', 'alerts']);
            
            // Load initial dashboard data
            const response = await fetch('/api/realtime/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.handleDashboardUpdate(data);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
        }
    }
    
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Update page title
        const titles = {
            overview: 'System Overview',
            business: 'Business Metrics',
            viral: 'Viral Analytics',
            performance: 'Performance Monitoring',
            security: 'Security Dashboard',
            alerts: 'Alert Management',
            logs: 'System Logs'
        };
        
        document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }
    
    async loadSectionData(section) {
        try {
            switch (section) {
                case 'overview':
                    // Overview data is loaded by default
                    break;
                    
                case 'business':
                    await this.loadBusinessMetrics();
                    break;
                    
                case 'viral':
                    await this.loadViralMetrics();
                    break;
                    
                case 'performance':
                    await this.loadPerformanceMetrics();
                    break;
                    
                case 'security':
                    await this.loadSecurityMetrics();
                    break;
                    
                case 'alerts':
                    await this.loadAlerts();
                    break;
                    
                case 'logs':
                    await this.loadLogs();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${section} data:`, error);
            this.showSectionError(section, `Failed to load ${section} data`);
        }
    }
    
    handleDashboardUpdate(data) {
        try {
            console.log('📊 Dashboard update received:', data);
            
            this.lastUpdate = new Date();
            this.updateLastUpdatedTime();
            
            // Update overview metrics
            this.updateOverviewMetrics(data);
            
            // Update system status
            this.updateSystemStatus(data.health);
            
            // Update charts if visible
            if (this.currentSection === 'overview') {
                this.updateCharts(data);
            }
            
        } catch (error) {
            console.error('Error handling dashboard update:', error);
        }
    }
    
    updateOverviewMetrics(data) {
        // Sites generated
        if (data.business?.overview?.sites_generated !== undefined) {
            document.getElementById('sites-generated').textContent = 
                this.formatNumber(data.business.overview.sites_generated);
        }
        
        // Active users
        if (data.business?.users?.active_users_24h !== undefined) {
            document.getElementById('active-users').textContent = 
                this.formatNumber(data.business.users.active_users_24h);
        }
        
        // Viral coefficient
        if (data.viral?.coefficient?.value !== undefined) {
            const element = document.getElementById('viral-coefficient');
            element.textContent = data.viral.coefficient.value.toFixed(2);
            
            // Update color based on value
            element.className = 'card-value';
            if (data.viral.coefficient.value >= 1.0) {
                element.classList.add('text-success');
            } else if (data.viral.coefficient.value >= 0.5) {
                element.classList.add('text-warning');
            } else {
                element.classList.add('text-danger');
            }
        }
        
        // Revenue
        if (data.business?.revenue?.total_revenue !== undefined) {
            document.getElementById('total-revenue').textContent = 
                this.formatCurrency(data.business.revenue.total_revenue);
        }
    }
    
    updateSystemStatus(health) {
        const statusElement = document.getElementById('system-status');
        const statusMap = {
            excellent: { class: 'status-healthy', icon: 'fa-check-circle', text: 'Excellent' },
            good: { class: 'status-healthy', icon: 'fa-check-circle', text: 'Good' },
            warning: { class: 'status-warning', icon: 'fa-exclamation-triangle', text: 'Warning' },
            critical: { class: 'status-critical', icon: 'fa-times-circle', text: 'Critical' }
        };
        
        const status = statusMap[health?.overall] || statusMap.warning;
        
        statusElement.className = `status-indicator ${status.class}`;
        statusElement.innerHTML = `
            <i class="fas ${status.icon}"></i>
            <span>${status.text}</span>
        `;
    }
    
    updateCharts(data) {
        // Update generation trends chart
        if (this.charts.generationChart) {
            // This would typically update with real historical data
            // For now, simulate data points
            this.updateGenerationChart(data);
        } else {
            this.createGenerationChart();
        }
        
        // Update health status display
        this.updateHealthDisplay(data.health);
    }
    
    createGenerationChart() {
        const ctx = document.getElementById('generation-chart');
        if (!ctx) return;
        
        // Clear loading state
        ctx.innerHTML = '<canvas></canvas>';
        const canvas = ctx.querySelector('canvas');
        
        this.charts.generationChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.getLast24Hours(),
                datasets: [{
                    label: 'Sites Generated',
                    data: this.generateMockData(24),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    }
                }
            }
        });
    }
    
    updateHealthDisplay(health) {
        const healthContainer = document.getElementById('health-status');
        if (!healthContainer) return;
        
        const components = health?.components || {};
        
        healthContainer.innerHTML = `
            <div class="space-y-3">
                ${Object.entries(components).map(([component, status]) => `
                    <div class="flex items-center justify-between">
                        <span class="capitalize">${component.replace('_', ' ')}</span>
                        <div class="status-indicator ${this.getStatusClass(status)}">
                            <i class="fas fa-circle"></i>
                            <span>${status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    handleNewAlert(alert) {
        console.log('🚨 New alert received:', alert);
        
        // Show browser notification if permitted
        this.showBrowserNotification(alert);
        
        // Update alerts section if visible
        if (this.currentSection === 'alerts') {
            this.prependAlert(alert);
        }
        
        // Update alert count in navigation
        this.updateAlertCount();
    }
    
    async loadAlerts() {
        try {
            const response = await fetch('/api/alerts?status=active', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const alerts = await response.json();
            this.displayAlerts(alerts);
            
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.showSectionError('alerts', 'Failed to load alerts');
        }
    }
    
    displayAlerts(alerts) {
        const alertsList = document.getElementById('alerts-list');
        if (!alertsList) return;
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center text-muted py-8">
                    <i class="fas fa-check-circle text-success" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No active alerts. System is running smoothly!</p>
                </div>
            `;
            return;
        }
        
        alertsList.innerHTML = alerts.map(alert => this.renderAlert(alert)).join('');
    }
    
    renderAlert(alert) {
        const timeAgo = this.getTimeAgo(new Date(alert.created_at));
        const severityClass = `alert-${alert.severity}`;
        const iconMap = {
            critical: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        return `
            <div class="alert-item ${severityClass}">
                <div class="alert-icon">
                    <i class="fas ${iconMap[alert.severity] || 'fa-bell'}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-description">${alert.description}</div>
                    <div class="alert-time">${timeAgo}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm" onclick="dashboard.acknowledgeAlert(${alert.id})">
                        Acknowledge
                    </button>
                </div>
            </div>
        `;
    }
    
    async acknowledgeAlert(alertId) {
        try {
            const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acknowledgedBy: 'dashboard-user'
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            // Reload alerts
            await this.loadAlerts();
            
        } catch (error) {
            console.error('Error acknowledging alert:', error);
            alert('Failed to acknowledge alert');
        }
    }
    
    // Utility methods
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }
    
    getLast24Hours() {
        const hours = [];
        for (let i = 23; i >= 0; i--) {
            const date = new Date();
            date.setHours(date.getHours() - i);
            hours.push(date.getHours().toString().padStart(2, '0') + ':00');
        }
        return hours;
    }
    
    generateMockData(points) {
        return Array.from({ length: points }, () => Math.floor(Math.random() * 100) + 20);
    }
    
    getStatusClass(status) {
        const classMap = {
            healthy: 'status-healthy',
            warning: 'status-warning',
            critical: 'status-critical',
            unknown: 'status-warning'
        };
        return classMap[status] || 'status-warning';
    }
    
    getAuthToken() {
        // In production, this should be properly managed
        return localStorage.getItem('dashboard-token') || 'dashboard-token-2024';
    }
    
    updateLastUpdatedTime() {
        if (this.lastUpdate) {
            document.getElementById('last-updated').textContent = 
                `Last updated: ${this.lastUpdate.toLocaleTimeString()}`;
        }
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('system-status');
        if (!connected) {
            statusElement.className = 'status-indicator status-warning';
            statusElement.innerHTML = `
                <i class="fas fa-wifi"></i>
                <span>Reconnecting...</span>
            `;
        }
    }
    
    showLoading(show) {
        // Implementation for global loading state
    }
    
    showError(message) {
        console.error('Dashboard error:', message);
        // Could implement toast notifications here
    }
    
    showSectionError(section, message) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.innerHTML = `
                <div class="card">
                    <div class="text-center text-danger py-8">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>${message}</p>
                        <button class="btn" onclick="dashboard.loadSectionData('${section}')">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    showBrowserNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`4site.pro Alert: ${alert.severity.toUpperCase()}`, {
                body: alert.title,
                icon: '/favicon.ico',
                tag: `alert-${alert.id}`
            });
        }
    }
    
    updateAlertCount() {
        // Update navigation badge if needed
    }
    
    refreshCurrentSection() {
        this.loadSectionData(this.currentSection);
    }
    
    // Placeholder methods for other sections
    async loadBusinessMetrics() {
        // Implementation for business metrics
    }
    
    async loadViralMetrics() {
        // Implementation for viral metrics
    }
    
    async loadPerformanceMetrics() {
        // Implementation for performance metrics
    }
    
    async loadSecurityMetrics() {
        // Implementation for security metrics
    }
    
    async loadLogs() {
        // Implementation for logs
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MonitoringDashboard();
    
    // Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringDashboard;
}