/**
 * Intelligence Singularity - AI Convergence Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class IntelligenceSingularity {
    constructor() {
        this.canvas = document.getElementById('singularityCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.capabilities = [];
        this.connections = [];
        this.convergenceField = [];
        this.isConverging = false;
        this.animationFrame = null;
        
        this.parameters = {
            convergenceRate: 5,
            capabilityDensity: 50,
            emergenceThreshold: 7,
            consciousnessLevel: 85
        };
        
        this.metrics = {
            convergenceLevel: 0,
            activeCapabilities: 6,
            emergenceScore: 0,
            singularityIndex: 0
        };
        
        this.capabilityTypes = ['vision', 'language', 'reasoning', 'learning', 'creativity', 'memory'];
        this.enabledCapabilities = new Set(this.capabilityTypes);
        this.time = 0;
        this.convergenceCenter = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvas();
        this.initializeCapabilities();
        this.render();
    }
    
    setupEventListeners() {
        // Convergence controls
        document.getElementById('startConvergence').addEventListener('click', () => this.startConvergence());
        document.getElementById('pauseConvergence').addEventListener('click', () => this.pauseConvergence());
        document.getElementById('resetSingularity').addEventListener('click', () => this.resetSingularity());
        document.getElementById('emergenceMode').addEventListener('click', () => this.activateEmergenceMode());
        
        // Parameter controls
        document.getElementById('convergenceRate').addEventListener('input', (e) => {
            this.parameters.convergenceRate = parseInt(e.target.value);
            document.getElementById('rateValue').textContent = e.target.value;
        });
        
        document.getElementById('capabilityDensity').addEventListener('input', (e) => {
            this.parameters.capabilityDensity = parseInt(e.target.value);
            document.getElementById('densityValue').textContent = e.target.value;
            this.adjustCapabilityDensity();
        });
        
        document.getElementById('emergenceThreshold').addEventListener('input', (e) => {
            this.parameters.emergenceThreshold = parseInt(e.target.value);
            document.getElementById('thresholdValue').textContent = e.target.value;
        });
        
        document.getElementById('consciousnessLevel').addEventListener('input', (e) => {
            this.parameters.consciousnessLevel = parseInt(e.target.value);
            document.getElementById('consciousnessValue').textContent = e.target.value + '%';
        });
        
        // Capability toggles
        document.querySelectorAll('.capability-toggle input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const capability = e.target.dataset.capability;
                if (e.target.checked) {
                    this.enabledCapabilities.add(capability);
                } else {
                    this.enabledCapabilities.delete(capability);
                }
                this.updateCapabilityStates();
            });
        });
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    initializePreloader() {
        // Animate convergence progress
        let progress = 0;
        const updateProgress = () => {
            progress += Math.random() * 3;
            if (progress > 100) progress = 100;
            
            const progressElement = document.getElementById('convergencePercent');
            if (progressElement) {
                progressElement.textContent = Math.floor(progress) + '%';
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 150);
            } else {
                setTimeout(() => this.hidePreloader(), 800);
            }
        };
        
        updateProgress();
    }
    
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    }
    
    setupCanvas() {
        this.canvas.width = 1000;
        this.canvas.height = 700;
        this.convergenceCenter = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
    }
    
    initializeCapabilities() {
        const colors = {
            vision: '#74b9ff',
            language: '#00b894',
            reasoning: '#fdcb6e',
            learning: '#e17055',
            creativity: '#fd79a8',
            memory: '#6c5ce7'
        };
        
        this.capabilityTypes.forEach((type, index) => {
            const angle = (index / this.capabilityTypes.length) * Math.PI * 2;
            const radius = 250;
            
            const capability = {
                id: type,
                type: type,
                x: this.convergenceCenter.x + Math.cos(angle) * radius,
                y: this.convergenceCenter.y + Math.sin(angle) * radius,
                originalX: this.convergenceCenter.x + Math.cos(angle) * radius,
                originalY: this.convergenceCenter.y + Math.sin(angle) * radius,
                targetX: this.convergenceCenter.x,
                targetY: this.convergenceCenter.y,
                size: 30,
                color: colors[type],
                strength: Math.random() * 0.5 + 0.5,
                convergenceProgress: 0,
                nodes: this.generateCapabilityNodes(type),
                active: true
            };
            
            this.capabilities.push(capability);
        });
        
        this.generateInitialConnections();
    }
    
    generateCapabilityNodes(type) {
        const nodeCount = Math.floor(this.parameters.capabilityDensity / 10);
        const nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                id: `${type}_node_${i}`,
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                size: Math.random() * 5 + 2,
                activity: Math.random(),
                phase: Math.random() * Math.PI * 2
            });
        }
        
        return nodes;
    }
    
    generateInitialConnections() {
        this.capabilities.forEach((cap1, i) => {
            this.capabilities.slice(i + 1).forEach(cap2 => {
                if (this.calculateCompatibility(cap1.type, cap2.type) > 0.3) {
                    this.connections.push({
                        from: cap1,
                        to: cap2,
                        strength: Math.random() * 0.5 + 0.3,
                        active: true,
                        dataFlow: []
                    });
                }
            });
        });
    }
    
    calculateCompatibility(type1, type2) {
        const compatibilityMatrix = {
            vision: { language: 0.8, reasoning: 0.7, learning: 0.9, creativity: 0.6, memory: 0.7 },
            language: { vision: 0.8, reasoning: 0.9, learning: 0.8, creativity: 0.8, memory: 0.9 },
            reasoning: { vision: 0.7, language: 0.9, learning: 0.8, creativity: 0.6, memory: 0.8 },
            learning: { vision: 0.9, language: 0.8, reasoning: 0.8, creativity: 0.7, memory: 0.9 },
            creativity: { vision: 0.6, language: 0.8, reasoning: 0.6, learning: 0.7, memory: 0.7 },
            memory: { vision: 0.7, language: 0.9, reasoning: 0.8, learning: 0.9, creativity: 0.7 }
        };
        
        return compatibilityMatrix[type1]?.[type2] || 0.5;
    }
    
    adjustCapabilityDensity() {
        this.capabilities.forEach(capability => {
            capability.nodes = this.generateCapabilityNodes(capability.type);
        });
    }
    
    updateCapabilityStates() {
        this.capabilities.forEach(capability => {
            capability.active = this.enabledCapabilities.has(capability.type);
        });
        
        this.connections.forEach(connection => {
            connection.active = connection.from.active && connection.to.active;
        });
        
        this.metrics.activeCapabilities = this.enabledCapabilities.size;
        this.updateMetricsDisplay();
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Create convergence ripple at click location
        this.createConvergenceRipple(x, y);
        
        // Temporarily set convergence center
        this.convergenceCenter.x = x;
        this.convergenceCenter.y = y;
        
        setTimeout(() => {
            this.convergenceCenter.x = this.canvas.width / 2;
            this.convergenceCenter.y = this.canvas.height / 2;
        }, 3000);
    }
    
    createConvergenceRipple(x, y) {
        for (let i = 0; i < 15; i++) {
            this.convergenceField.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 100 + Math.random() * 100,
                alpha: 1,
                speed: Math.random() * 3 + 2,
                life: 60
            });
        }
    }
    
    handleMouseMove(e) {
        // Influence nearby capabilities with mouse proximity
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.capabilities.forEach(capability => {
            const distance = Math.sqrt(
                Math.pow(capability.x - mouseX, 2) + 
                Math.pow(capability.y - mouseY, 2)
            );
            
            if (distance < 100) {
                const influence = (100 - distance) / 100;
                capability.strength = Math.min(1, capability.strength + influence * 0.01);
            }
        });
    }
    
    updateCapabilities() {
        this.capabilities.forEach(capability => {
            if (!capability.active) return;
            
            // Convergence movement
            if (this.isConverging) {
                const dx = this.convergenceCenter.x - capability.x;
                const dy = this.convergenceCenter.y - capability.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    const convergenceForce = this.parameters.convergenceRate * 0.02;
                    capability.x += dx * convergenceForce;
                    capability.y += dy * convergenceForce;
                    capability.convergenceProgress = Math.min(1, capability.convergenceProgress + 0.01);
                }
            } else {
                // Return to original positions
                const dx = capability.originalX - capability.x;
                const dy = capability.originalY - capability.y;
                capability.x += dx * 0.02;
                capability.y += dy * 0.02;
                capability.convergenceProgress = Math.max(0, capability.convergenceProgress - 0.02);
            }
            
            // Update capability nodes
            capability.nodes.forEach(node => {
                node.activity += Math.sin(this.time * 0.1 + node.phase) * 0.01;
                node.activity = Math.max(0, Math.min(1, node.activity));
                node.phase += 0.05;
            });
            
            // Strengthen based on proximity to other capabilities
            let proximityBonus = 0;
            this.capabilities.forEach(other => {
                if (other !== capability && other.active) {
                    const distance = Math.sqrt(
                        Math.pow(capability.x - other.x, 2) + 
                        Math.pow(capability.y - other.y, 2)
                    );
                    if (distance < 150) {
                        proximityBonus += (150 - distance) / 150 * 0.01;
                    }
                }
            });
            
            capability.strength = Math.min(1, capability.strength + proximityBonus);
        });
    }
    
    updateConnections() {
        this.connections.forEach(connection => {
            if (!connection.active) return;
            
            const distance = Math.sqrt(
                Math.pow(connection.from.x - connection.to.x, 2) + 
                Math.pow(connection.from.y - connection.to.y, 2)
            );
            
            // Strengthen connections as capabilities converge
            if (distance < 200) {
                connection.strength = Math.min(1, connection.strength + 0.005);
                
                // Create data flow particles
                if (Math.random() < connection.strength * 0.1) {
                    connection.dataFlow.push({
                        progress: 0,
                        speed: 0.02 + Math.random() * 0.03,
                        size: Math.random() * 3 + 1
                    });
                }
            }
            
            // Update data flow
            connection.dataFlow = connection.dataFlow.filter(flow => {
                flow.progress += flow.speed;
                return flow.progress <= 1;
            });
        });
    }
    
    updateConvergenceField() {
        this.convergenceField = this.convergenceField.filter(field => {
            field.radius += field.speed;
            field.alpha -= 0.02;
            field.life--;
            
            return field.life > 0 && field.alpha > 0;
        });
    }
    
    updateMetrics() {
        // Calculate convergence level
        const avgDistance = this.capabilities.reduce((sum, cap) => {
            const distance = Math.sqrt(
                Math.pow(cap.x - this.convergenceCenter.x, 2) + 
                Math.pow(cap.y - this.convergenceCenter.y, 2)
            );
            return sum + distance;
        }, 0) / this.capabilities.length;
        
        this.metrics.convergenceLevel = Math.max(0, 100 - (avgDistance / 3));
        
        // Calculate emergence score
        const totalStrength = this.capabilities.reduce((sum, cap) => sum + cap.strength, 0);
        const avgConnectionStrength = this.connections.reduce((sum, conn) => sum + conn.strength, 0) / this.connections.length;
        
        this.metrics.emergenceScore = (totalStrength / this.capabilities.length + avgConnectionStrength) / 2;
        
        // Calculate singularity index
        const consciousnessFactor = this.parameters.consciousnessLevel / 100;
        this.metrics.singularityIndex = (this.metrics.convergenceLevel / 100) * this.metrics.emergenceScore * consciousnessFactor;
        
        this.updateMetricsDisplay();
    }
    
    updateMetricsDisplay() {
        document.getElementById('convergenceLevel').textContent = Math.round(this.metrics.convergenceLevel) + '%';
        document.getElementById('activeCapabilities').textContent = this.metrics.activeCapabilities;
        document.getElementById('emergenceScore').textContent = this.metrics.emergenceScore.toFixed(1);
        document.getElementById('singularityIndex').textContent = this.metrics.singularityIndex.toFixed(2);
        
        // Update prediction confidence based on metrics
        const confidence = Math.round(50 + this.metrics.singularityIndex * 25);
        document.getElementById('predictionConfidence').textContent = confidence + '%';
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw convergence field background
        this.drawConvergenceField();
        
        // Draw capability connections
        this.drawConnections();
        
        // Draw capabilities
        this.drawCapabilities();
        
        // Draw convergence center
        this.drawConvergenceCenter();
        
        if (this.isConverging) {
            this.time++;
            this.updateCapabilities();
            this.updateConnections();
            this.updateConvergenceField();
            this.updateMetrics();
            
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawConvergenceField() {
        // Background gradient representing the convergence field
        const gradient = this.ctx.createRadialGradient(
            this.convergenceCenter.x, this.convergenceCenter.y, 0,
            this.convergenceCenter.x, this.convergenceCenter.y, 400
        );
        
        gradient.addColorStop(0, 'rgba(108, 92, 231, 0.1)');
        gradient.addColorStop(0.5, 'rgba(108, 92, 231, 0.05)');
        gradient.addColorStop(1, 'rgba(108, 92, 231, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw convergence ripples
        this.convergenceField.forEach(field => {
            this.ctx.globalAlpha = field.alpha;
            this.ctx.strokeStyle = '#6c5ce7';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawConnections() {
        this.connections.forEach(connection => {
            if (!connection.active) return;
            
            this.ctx.globalAlpha = connection.strength * 0.7;
            this.ctx.strokeStyle = '#a29bfe';
            this.ctx.lineWidth = connection.strength * 3;
            
            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
            
            // Draw data flow particles
            connection.dataFlow.forEach(flow => {
                const x = connection.from.x + (connection.to.x - connection.from.x) * flow.progress;
                const y = connection.from.y + (connection.to.y - connection.from.y) * flow.progress;
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(x, y, flow.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawCapabilities() {
        this.capabilities.forEach(capability => {
            if (!capability.active) return;
            
            this.ctx.globalAlpha = capability.strength;
            
            // Main capability node
            this.ctx.fillStyle = capability.color;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = capability.color;
            
            this.ctx.beginPath();
            this.ctx.arc(capability.x, capability.y, capability.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // Capability sub-nodes
            capability.nodes.forEach(node => {
                const nodeX = capability.x + node.x * (capability.size / 30);
                const nodeY = capability.y + node.y * (capability.size / 30);
                
                this.ctx.globalAlpha = node.activity * capability.strength;
                this.ctx.fillStyle = capability.color;
                
                this.ctx.beginPath();
                this.ctx.arc(nodeX, nodeY, node.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Capability label
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px JetBrains Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                capability.type.charAt(0).toUpperCase() + capability.type.slice(1),
                capability.x,
                capability.y + capability.size + 20
            );
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left';
    }
    
    drawConvergenceCenter() {
        // Pulsating convergence core
        const pulseSize = 20 + Math.sin(this.time * 0.1) * 10;
        
        this.ctx.fillStyle = '#fd79a8';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#fd79a8';
        
        this.ctx.beginPath();
        this.ctx.arc(this.convergenceCenter.x, this.convergenceCenter.y, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Convergence rings
        for (let i = 1; i <= 3; i++) {
            this.ctx.globalAlpha = 0.3 / i;
            this.ctx.strokeStyle = '#fd79a8';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.convergenceCenter.x, 
                this.convergenceCenter.y, 
                pulseSize + (i * 20), 
                0, Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    startConvergence() {
        this.isConverging = true;
        document.getElementById('startConvergence').textContent = 'Converging...';
        this.render();
    }
    
    pauseConvergence() {
        this.isConverging = false;
        document.getElementById('startConvergence').textContent = 'Start Convergence';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    resetSingularity() {
        this.pauseConvergence();
        this.initializeCapabilities();
        this.metrics = {
            convergenceLevel: 0,
            activeCapabilities: 6,
            emergenceScore: 0,
            singularityIndex: 0
        };
        this.updateMetricsDisplay();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    activateEmergenceMode() {
        // Special emergence visualization
        this.isConverging = true;
        
        // Rapidly converge all capabilities
        this.capabilities.forEach(capability => {
            capability.convergenceProgress = 1;
            capability.strength = 1;
        });
        
        // Strengthen all connections
        this.connections.forEach(connection => {
            connection.strength = 1;
        });
        
        // Create dramatic convergence effect
        for (let i = 0; i < 50; i++) {
            this.createConvergenceRipple(
                this.convergenceCenter.x + (Math.random() - 0.5) * 100,
                this.convergenceCenter.y + (Math.random() - 0.5) * 100
            );
        }
        
        document.getElementById('emergenceMode').style.background = 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)';
        document.getElementById('emergenceMode').textContent = 'EMERGENCE ACTIVE';
        
        setTimeout(() => {
            document.getElementById('emergenceMode').style.background = '';
            document.getElementById('emergenceMode').textContent = 'Emergence Mode';
        }, 5000);
        
        this.render();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.intelligenceSingularity = new IntelligenceSingularity();
});