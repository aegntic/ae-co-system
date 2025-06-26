/**
 * Consciousness Stream - Flowing AI Thought Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class ConsciousnessStream {
    constructor() {
        this.canvas = document.getElementById('consciousnessCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.thoughts = [];
        this.connections = [];
        this.particles = [];
        this.isStreaming = false;
        this.animationFrame = null;
        
        this.parameters = {
            flowVelocity: 5,
            thoughtDensity: 50,
            connectionStrength: 6
        };
        
        this.metrics = {
            activeThoughts: 0,
            coherence: 0,
            emergence: 0
        };
        
        this.time = 0;
        this.lastThoughtTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvas();
        this.generateInitialThoughts();
        this.render();
    }
    
    setupEventListeners() {
        // Stream controls
        document.getElementById('startStream').addEventListener('click', () => this.startStream());
        document.getElementById('pauseStream').addEventListener('click', () => this.pauseStream());
        document.getElementById('clearStream').addEventListener('click', () => this.clearStream());
        
        // Thought injection
        document.getElementById('injectThought').addEventListener('click', () => this.injectThought());
        document.getElementById('thoughtInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.injectThought();
        });
        
        // Parameter controls
        document.getElementById('flowVelocity').addEventListener('input', (e) => {
            this.parameters.flowVelocity = parseInt(e.target.value);
            document.getElementById('velocityValue').textContent = e.target.value;
        });
        
        document.getElementById('thoughtDensity').addEventListener('input', (e) => {
            this.parameters.thoughtDensity = parseInt(e.target.value);
            document.getElementById('densityValue').textContent = e.target.value;
        });
        
        document.getElementById('connectionStrength').addEventListener('input', (e) => {
            this.parameters.connectionStrength = parseInt(e.target.value);
            document.getElementById('strengthValue').textContent = e.target.value;
        });
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    initializePreloader() {
        // Hide preloader after animation completes
        setTimeout(() => {
            this.hidePreloader();
        }, 3000);
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
        this.canvas.height = 600;
    }
    
    generateInitialThoughts() {
        const initialThoughts = [
            'artificial intelligence',
            'neural networks',
            'consciousness',
            'emergence',
            'cognition',
            'awareness',
            'understanding',
            'perception',
            'learning',
            'adaptation'
        ];
        
        initialThoughts.forEach((text, index) => {
            setTimeout(() => {
                this.createThought(text, 
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height
                );
            }, index * 300);
        });
    }
    
    createThought(text, x, y) {
        const thought = {
            id: Date.now() + Math.random(),
            text: text,
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * this.parameters.flowVelocity * 0.5,
            vy: (Math.random() - 0.5) * this.parameters.flowVelocity * 0.5,
            size: text.length * 3 + 20,
            consciousness: Math.random(),
            coherence: Math.random() * 0.5 + 0.5,
            age: 0,
            maxAge: 300 + Math.random() * 200,
            alpha: 1,
            color: this.generateThoughtColor(text),
            frequency: Math.random() * 0.1 + 0.05,
            phase: Math.random() * Math.PI * 2
        };
        
        this.thoughts.push(thought);
        this.generateConnections(thought);
        return thought;
    }
    
    generateThoughtColor(text) {
        // Generate color based on thought content
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 60 + 120; // Green-cyan range
        const saturation = 60 + (Math.abs(hash) % 30);
        const lightness = 50 + (Math.abs(hash) % 20);
        
        return {
            h: hue,
            s: saturation,
            l: lightness
        };
    }
    
    generateConnections(newThought) {
        this.thoughts.forEach(existingThought => {
            if (existingThought.id !== newThought.id) {
                const distance = this.calculateDistance(newThought, existingThought);
                const semanticSimilarity = this.calculateSemanticSimilarity(newThought.text, existingThought.text);
                
                if (distance < 150 && semanticSimilarity > 0.3) {
                    this.connections.push({
                        id: `${newThought.id}-${existingThought.id}`,
                        thought1: newThought,
                        thought2: existingThought,
                        strength: semanticSimilarity,
                        pulsation: Math.random() * Math.PI * 2,
                        age: 0
                    });
                }
            }
        });
    }
    
    calculateDistance(thought1, thought2) {
        return Math.sqrt(Math.pow(thought1.x - thought2.x, 2) + Math.pow(thought1.y - thought2.y, 2));
    }
    
    calculateSemanticSimilarity(text1, text2) {
        // Simple semantic similarity based on shared characters and length
        const commonChars = text1.split('').filter(char => text2.includes(char)).length;
        const maxLength = Math.max(text1.length, text2.length);
        return commonChars / maxLength;
    }
    
    injectThought() {
        const input = document.getElementById('thoughtInput');
        const thoughtText = input.value.trim();
        
        if (thoughtText) {
            // Create thought at center with expansion effect
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            this.createThought(thoughtText, centerX, centerY);
            this.createExpansionEffect(centerX, centerY);
            
            input.value = '';
            this.updateMetrics();
        }
    }
    
    createExpansionEffect(x, y) {
        // Create expanding particle ring
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 3,
                alpha: 1,
                color: '#a8e6cf',
                life: 60
            });
        }
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Scale coordinates to canvas size
        const canvasX = (x / rect.width) * this.canvas.width;
        const canvasY = (y / rect.height) * this.canvas.height;
        
        // Create thought ripple at click location
        this.createThoughtRipple(canvasX, canvasY);
    }
    
    createThoughtRipple(x, y) {
        // Create expanding ripple effect
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.particles.push({
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    size: i * 5,
                    alpha: 0.5 - (i * 0.03),
                    color: '#98d8c8',
                    life: 30,
                    type: 'ripple'
                });
            }, i * 50);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const canvasX = (x / rect.width) * this.canvas.width;
        const canvasY = (y / rect.height) * this.canvas.height;
        
        // Influence nearby thoughts
        this.thoughts.forEach(thought => {
            const distance = Math.sqrt(Math.pow(thought.x - canvasX, 2) + Math.pow(thought.y - canvasY, 2));
            if (distance < 100) {
                const influence = (100 - distance) / 100;
                thought.consciousness = Math.min(1, thought.consciousness + influence * 0.01);
            }
        });
    }
    
    updateThoughts() {
        this.thoughts.forEach((thought, index) => {
            // Age and lifecycle
            thought.age++;
            if (thought.age > thought.maxAge) {
                thought.alpha -= 0.02;
                if (thought.alpha <= 0) {
                    this.thoughts.splice(index, 1);
                    this.removeConnectionsForThought(thought);
                    return;
                }
            }
            
            // Consciousness fluctuation
            thought.consciousness += Math.sin(this.time * thought.frequency + thought.phase) * 0.01;
            thought.consciousness = Math.max(0, Math.min(1, thought.consciousness));
            
            // Movement with consciousness influence
            const consciousnessInfluence = thought.consciousness * 2;
            thought.vx += (Math.random() - 0.5) * 0.1 * consciousnessInfluence;
            thought.vy += (Math.random() - 0.5) * 0.1 * consciousnessInfluence;
            
            // Apply velocity
            thought.x += thought.vx * (this.parameters.flowVelocity / 10);
            thought.y += thought.vy * (this.parameters.flowVelocity / 10);
            
            // Boundary wrapping
            if (thought.x < -thought.size) thought.x = this.canvas.width + thought.size;
            if (thought.x > this.canvas.width + thought.size) thought.x = -thought.size;
            if (thought.y < -thought.size) thought.y = this.canvas.height + thought.size;
            if (thought.y > this.canvas.height + thought.size) thought.y = -thought.size;
            
            // Damping
            thought.vx *= 0.99;
            thought.vy *= 0.99;
        });
    }
    
    updateConnections() {
        this.connections.forEach((connection, index) => {
            connection.age++;
            connection.pulsation += 0.1;
            
            // Remove connections for thoughts that no longer exist
            if (!this.thoughts.includes(connection.thought1) || !this.thoughts.includes(connection.thought2)) {
                this.connections.splice(index, 1);
                return;
            }
            
            // Update connection strength based on distance
            const distance = this.calculateDistance(connection.thought1, connection.thought2);
            if (distance > 200) {
                this.connections.splice(index, 1);
            }
        });
    }
    
    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha *= 0.98;
            
            if (particle.life <= 0 || particle.alpha <= 0.01) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    removeConnectionsForThought(thought) {
        this.connections = this.connections.filter(connection =>
            connection.thought1.id !== thought.id && connection.thought2.id !== thought.id
        );
    }
    
    generateRandomThoughts() {
        if (this.thoughts.length < this.parameters.thoughtDensity && this.time - this.lastThoughtTime > 120) {
            const thoughtWords = [
                'intelligence', 'perception', 'awareness', 'understanding', 'cognition',
                'neural', 'synaptic', 'emergent', 'adaptive', 'learning',
                'consciousness', 'sentience', 'thought', 'mind', 'brain',
                'pattern', 'recognition', 'memory', 'processing', 'analysis'
            ];
            
            const randomWord = thoughtWords[Math.floor(Math.random() * thoughtWords.length)];
            this.createThought(randomWord);
            this.lastThoughtTime = this.time;
        }
    }
    
    updateMetrics() {
        this.metrics.activeThoughts = this.thoughts.length;
        
        // Calculate coherence based on connection density
        const totalPossibleConnections = this.thoughts.length * (this.thoughts.length - 1) / 2;
        this.metrics.coherence = totalPossibleConnections > 0 ? 
            (this.connections.length / totalPossibleConnections) * 100 : 0;
        
        // Calculate emergence based on consciousness levels
        const totalConsciousness = this.thoughts.reduce((sum, thought) => sum + thought.consciousness, 0);
        this.metrics.emergence = this.thoughts.length > 0 ? 
            totalConsciousness / this.thoughts.length : 0;
        
        // Update UI
        document.getElementById('activeThoughts').textContent = this.metrics.activeThoughts;
        document.getElementById('coherence').textContent = Math.round(this.metrics.coherence) + '%';
        document.getElementById('emergence').textContent = this.metrics.emergence.toFixed(2);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background flow field
        this.drawFlowField();
        
        // Draw connections
        this.drawConnections();
        
        // Draw thoughts
        this.drawThoughts();
        
        // Draw particles
        this.drawParticles();
        
        if (this.isStreaming) {
            this.time++;
            this.updateThoughts();
            this.updateConnections();
            this.updateParticles();
            this.generateRandomThoughts();
            this.updateMetrics();
            
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawFlowField() {
        // Subtle background flow visualization
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = '#a8e6cf';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                const angle = Math.sin(x * 0.01 + this.time * 0.01) + Math.cos(y * 0.01 + this.time * 0.01);
                const length = 20;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(
                    x + Math.cos(angle) * length,
                    y + Math.sin(angle) * length
                );
                this.ctx.stroke();
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawConnections() {
        this.connections.forEach(connection => {
            const alpha = Math.sin(connection.pulsation) * 0.3 + 0.4;
            this.ctx.globalAlpha = alpha * connection.strength;
            
            const gradient = this.ctx.createLinearGradient(
                connection.thought1.x, connection.thought1.y,
                connection.thought2.x, connection.thought2.y
            );
            gradient.addColorStop(0, '#a8e6cf');
            gradient.addColorStop(1, '#98d8c8');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = connection.strength * this.parameters.connectionStrength;
            
            this.ctx.beginPath();
            this.ctx.moveTo(connection.thought1.x, connection.thought1.y);
            this.ctx.lineTo(connection.thought2.x, connection.thought2.y);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawThoughts() {
        this.thoughts.forEach(thought => {
            this.ctx.globalAlpha = thought.alpha;
            
            // Thought bubble
            const consciousnessGlow = thought.consciousness * 10;
            this.ctx.shadowBlur = consciousnessGlow;
            this.ctx.shadowColor = `hsl(${thought.color.h}, ${thought.color.s}%, ${thought.color.l}%)`;
            
            this.ctx.fillStyle = `hsla(${thought.color.h}, ${thought.color.s}%, ${thought.color.l}%, 0.8)`;
            this.ctx.beginPath();
            this.ctx.arc(thought.x, thought.y, thought.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // Thought text
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = '12px JetBrains Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(thought.text, thought.x, thought.y + 4);
            
            // Consciousness indicator
            this.ctx.fillStyle = '#a8e6cf';
            this.ctx.beginPath();
            this.ctx.arc(
                thought.x + thought.size - 5,
                thought.y - thought.size + 5,
                thought.consciousness * 8,
                0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'ripple') {
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    startStream() {
        this.isStreaming = true;
        document.getElementById('startStream').textContent = 'Streaming...';
        this.render();
    }
    
    pauseStream() {
        this.isStreaming = false;
        document.getElementById('startStream').textContent = 'Start Stream';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    clearStream() {
        this.pauseStream();
        this.thoughts = [];
        this.connections = [];
        this.particles = [];
        this.time = 0;
        this.metrics = { activeThoughts: 0, coherence: 0, emergence: 0 };
        this.updateMetrics();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.consciousnessStream = new ConsciousnessStream();
});