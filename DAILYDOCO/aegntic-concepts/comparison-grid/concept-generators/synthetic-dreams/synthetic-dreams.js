/**
 * Synthetic Dreams - Surreal AI Dream Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class SyntheticDreams {
    constructor() {
        this.canvas = document.getElementById('dreamCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.dreamEntities = [];
        this.dreamParticles = [];
        this.morphingShapes = [];
        this.isDreaming = false;
        this.animationFrame = null;
        
        this.parameters = {
            imagination: 7,
            morphSpeed: 5,
            surrealness: 8,
            saturation: 75
        };
        
        this.metrics = {
            dreamDepth: 0,
            coherence: 0,
            creativity: 0,
            emotion: 0
        };
        
        this.dreamSequence = [];
        this.currentPreset = null;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvas();
        this.createInitialDream();
        this.render();
    }
    
    setupEventListeners() {
        // Dream controls
        document.getElementById('generateDream').addEventListener('click', () => this.generateDream());
        document.getElementById('startDreaming').addEventListener('click', () => this.startDreaming());
        document.getElementById('pauseDream').addEventListener('click', () => this.pauseDream());
        document.getElementById('recordDream').addEventListener('click', () => this.recordDream());
        document.getElementById('shareDream').addEventListener('click', () => this.shareDream());
        
        // Dream prompt
        document.getElementById('dreamPrompt').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateDream();
        });
        
        // Parameter controls
        document.getElementById('imagination').addEventListener('input', (e) => {
            this.parameters.imagination = parseInt(e.target.value);
            document.getElementById('imaginationValue').textContent = e.target.value;
        });
        
        document.getElementById('morphSpeed').addEventListener('input', (e) => {
            this.parameters.morphSpeed = parseInt(e.target.value);
            document.getElementById('morphValue').textContent = e.target.value;
        });
        
        document.getElementById('surrealness').addEventListener('input', (e) => {
            this.parameters.surrealness = parseInt(e.target.value);
            document.getElementById('surrealValue').textContent = e.target.value;
        });
        
        document.getElementById('saturation').addEventListener('input', (e) => {
            this.parameters.saturation = parseInt(e.target.value);
            document.getElementById('saturationValue').textContent = e.target.value + '%';
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.target.dataset.preset);
            });
        });
        
        // Dream style selector
        document.getElementById('dreamStyle').addEventListener('change', (e) => {
            this.changeDreamStyle(e.target.value);
        });
        
        // Gallery controls
        document.getElementById('saveDreamSequence').addEventListener('click', () => this.saveDreamSequence());
        document.getElementById('exportDream').addEventListener('click', () => this.exportDream());
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    initializePreloader() {
        this.createDreamParticles();
        
        // Hide preloader after animation
        setTimeout(() => {
            this.hidePreloader();
        }, 4000);
    }
    
    createDreamParticles() {
        const container = document.getElementById('dreamParticles');
        if (!container) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'dream-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            container.appendChild(particle);
        }
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
    
    createInitialDream() {
        // Create some initial dream entities
        for (let i = 0; i < 5; i++) {
            this.createDreamEntity({
                type: 'abstract',
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                intensity: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    createDreamEntity(config = {}) {
        const entity = {
            id: Date.now() + Math.random(),
            type: config.type || 'abstract',
            x: config.x || Math.random() * this.canvas.width,
            y: config.y || Math.random() * this.canvas.height,
            size: config.size || Math.random() * 50 + 20,
            color: config.color || this.generateDreamColor(),
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            morphState: 0,
            intensity: config.intensity || Math.random(),
            age: 0,
            maxAge: config.maxAge || 500 + Math.random() * 300,
            properties: this.generateEntityProperties(config.type)
        };
        
        this.dreamEntities.push(entity);
        return entity;
    }
    
    generateDreamColor() {
        const hues = [300, 320, 280, 340, 260]; // Purple-pink range
        const hue = hues[Math.floor(Math.random() * hues.length)];
        const saturation = this.parameters.saturation + Math.random() * 20 - 10;
        const lightness = 40 + Math.random() * 40;
        
        return {
            h: hue,
            s: saturation,
            l: lightness,
            a: 0.6 + Math.random() * 0.4
        };
    }
    
    generateEntityProperties(type) {
        const baseProps = {
            fluidity: Math.random(),
            coherence: Math.random(),
            surreal: Math.random() * this.parameters.surrealness / 10,
            complexity: Math.random() * this.parameters.imagination / 10
        };
        
        switch (type) {
            case 'surreal':
                return { ...baseProps, distortion: Math.random(), impossibility: 0.8 };
            case 'abstract':
                return { ...baseProps, abstraction: 0.9, form: Math.random() };
            case 'cyberpunk':
                return { ...baseProps, digital: 0.9, neon: 0.8 };
            case 'organic':
                return { ...baseProps, natural: 0.9, growth: Math.random() };
            case 'geometric':
                return { ...baseProps, precision: 0.9, symmetry: 0.8 };
            default:
                return baseProps;
        }
    }
    
    generateDream() {
        const prompt = document.getElementById('dreamPrompt').value.trim();
        const style = document.getElementById('dreamStyle').value;
        
        if (prompt) {
            this.interpretDreamPrompt(prompt, style);
        } else {
            this.generateRandomDream(style);
        }
        
        this.addTimelineMarker(`Dream: ${prompt || 'Random'}`);
        this.updateMetrics();
    }
    
    interpretDreamPrompt(prompt, style) {
        // Simple prompt interpretation
        const words = prompt.toLowerCase().split(' ');
        
        words.forEach((word, index) => {
            const entity = this.createDreamEntity({
                type: style,
                x: (index / words.length) * this.canvas.width,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 200,
                intensity: 0.7 + Math.random() * 0.3
            });
            
            // Add word-specific properties
            if (['fire', 'flame', 'burn'].includes(word)) {
                entity.color.h = 15; // Orange-red
                entity.properties.heat = 1;
            }
            if (['water', 'ocean', 'sea', 'wave'].includes(word)) {
                entity.color.h = 200; // Blue
                entity.properties.fluidity = 1;
            }
            if (['sky', 'cloud', 'air'].includes(word)) {
                entity.color.l = 80;
                entity.properties.lightness = 1;
            }
        });
    }
    
    generateRandomDream(style) {
        const numEntities = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < numEntities; i++) {
            this.createDreamEntity({
                type: style,
                intensity: Math.random() * this.parameters.imagination / 10
            });
        }
    }
    
    applyPreset(presetName) {
        this.currentPreset = presetName;
        
        const presets = {
            lucid: {
                imagination: 9,
                morphSpeed: 3,
                surrealness: 6,
                saturation: 85
            },
            nightmare: {
                imagination: 10,
                morphSpeed: 8,
                surrealness: 10,
                saturation: 30
            },
            euphoric: {
                imagination: 8,
                morphSpeed: 6,
                surrealness: 7,
                saturation: 95
            },
            memory: {
                imagination: 5,
                morphSpeed: 2,
                surrealness: 4,
                saturation: 60
            },
            future: {
                imagination: 9,
                morphSpeed: 7,
                surrealness: 9,
                saturation: 70
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            Object.assign(this.parameters, preset);
            this.updateParameterUI();
            this.applyPresetEffects(presetName);
        }
    }
    
    updateParameterUI() {
        document.getElementById('imagination').value = this.parameters.imagination;
        document.getElementById('imaginationValue').textContent = this.parameters.imagination;
        document.getElementById('morphSpeed').value = this.parameters.morphSpeed;
        document.getElementById('morphValue').textContent = this.parameters.morphSpeed;
        document.getElementById('surrealness').value = this.parameters.surrealness;
        document.getElementById('surrealValue').textContent = this.parameters.surrealness;
        document.getElementById('saturation').value = this.parameters.saturation;
        document.getElementById('saturationValue').textContent = this.parameters.saturation + '%';
    }
    
    applyPresetEffects(presetName) {
        // Clear existing entities
        this.dreamEntities = [];
        
        // Create preset-specific dream environment
        switch (presetName) {
            case 'nightmare':
                this.createNightmarescape();
                break;
            case 'euphoric':
                this.createEuphoria();
                break;
            case 'lucid':
                this.createLucidDream();
                break;
            case 'memory':
                this.createMemoryPalace();
                break;
            case 'future':
                this.createFutureVision();
                break;
        }
    }
    
    createNightmarescape() {
        for (let i = 0; i < 8; i++) {
            const entity = this.createDreamEntity({
                type: 'surreal',
                intensity: 0.9,
                size: Math.random() * 80 + 40
            });
            entity.color.h = 0; // Red
            entity.color.l = 20; // Dark
            entity.properties.distortion = 1;
            entity.properties.chaos = 1;
        }
    }
    
    createEuphoria() {
        for (let i = 0; i < 12; i++) {
            const entity = this.createDreamEntity({
                type: 'abstract',
                intensity: 0.8,
                size: Math.random() * 60 + 30
            });
            entity.color.s = 100; // Full saturation
            entity.color.l = 70; // Bright
            entity.properties.joy = 1;
            entity.properties.expansion = 1;
        }
    }
    
    createLucidDream() {
        for (let i = 0; i < 6; i++) {
            const entity = this.createDreamEntity({
                type: 'geometric',
                intensity: 0.7,
                size: Math.random() * 70 + 35
            });
            entity.properties.control = 1;
            entity.properties.clarity = 1;
        }
    }
    
    createMemoryPalace() {
        for (let i = 0; i < 10; i++) {
            const entity = this.createDreamEntity({
                type: 'organic',
                intensity: 0.6,
                size: Math.random() * 50 + 25
            });
            entity.color.s = 50; // Muted
            entity.properties.nostalgia = 1;
            entity.properties.depth = 1;
        }
    }
    
    createFutureVision() {
        for (let i = 0; i < 7; i++) {
            const entity = this.createDreamEntity({
                type: 'cyberpunk',
                intensity: 0.8,
                size: Math.random() * 90 + 45
            });
            entity.color.h = 180; // Cyan
            entity.properties.technology = 1;
            entity.properties.evolution = 1;
        }
    }
    
    changeDreamStyle(style) {
        this.dreamEntities.forEach(entity => {
            entity.type = style;
            entity.properties = { ...entity.properties, ...this.generateEntityProperties(style) };
        });
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Scale to canvas coordinates
        const canvasX = (x / rect.width) * this.canvas.width;
        const canvasY = (y / rect.height) * this.canvas.height;
        
        // Create dream entity at click location
        this.createDreamEntity({
            x: canvasX,
            y: canvasY,
            intensity: 0.8
        });
        
        this.createClickEffect(canvasX, canvasY);
    }
    
    createClickEffect(x, y) {
        // Create expanding dream ripple
        for (let i = 0; i < 10; i++) {
            this.dreamParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 8 + 2,
                color: this.generateDreamColor(),
                life: 60,
                type: 'ripple'
            });
        }
    }
    
    handleMouseMove(e) {
        // Create trailing dream particles
        if (Math.random() < 0.3) {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
            const y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
            
            this.dreamParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 1,
                color: this.generateDreamColor(),
                life: 30,
                type: 'trail'
            });
        }
    }
    
    updateEntities() {
        this.dreamEntities.forEach((entity, index) => {
            entity.age++;
            entity.morphState += this.parameters.morphSpeed * 0.01;
            
            // Lifecycle management
            if (entity.age > entity.maxAge) {
                entity.intensity -= 0.02;
                if (entity.intensity <= 0) {
                    this.dreamEntities.splice(index, 1);
                    return;
                }
            }
            
            // Movement with dream-like properties
            const dreamFlow = Math.sin(this.time * 0.01 + entity.id) * entity.properties.fluidity;
            entity.velocity.x += (Math.random() - 0.5) * 0.1 + dreamFlow * 0.1;
            entity.velocity.y += (Math.random() - 0.5) * 0.1 + Math.cos(this.time * 0.01 + entity.id) * 0.1;
            
            // Apply surreal physics
            if (entity.properties.surreal > 0.5) {
                entity.velocity.x *= -0.1; // Reverse physics occasionally
                entity.velocity.y += Math.sin(this.time * 0.02) * 0.2;
            }
            
            entity.x += entity.velocity.x;
            entity.y += entity.velocity.y;
            
            // Boundary wrapping with dream logic
            if (entity.x < -entity.size) entity.x = this.canvas.width + entity.size;
            if (entity.x > this.canvas.width + entity.size) entity.x = -entity.size;
            if (entity.y < -entity.size) entity.y = this.canvas.height + entity.size;
            if (entity.y > this.canvas.height + entity.size) entity.y = -entity.size;
            
            // Morphing
            if (entity.properties.complexity > 0.5) {
                entity.size += Math.sin(entity.morphState) * 2;
                entity.color.h += Math.cos(entity.morphState * 0.5) * 2;
            }
            
            // Damping
            entity.velocity.x *= 0.98;
            entity.velocity.y *= 0.98;
        });
    }
    
    updateParticles() {
        this.dreamParticles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.dreamParticles.splice(index, 1);
            }
        });
    }
    
    updateMetrics() {
        this.metrics.dreamDepth = (this.dreamEntities.length / 10).toFixed(1);
        this.metrics.coherence = Math.max(0, 100 - this.parameters.surrealness * 8);
        this.metrics.creativity = (this.parameters.imagination / 10).toFixed(1);
        this.metrics.emotion = Math.floor(this.dreamEntities.reduce((sum, e) => sum + e.intensity, 0) / this.dreamEntities.length * 100) || 0;
        
        document.getElementById('dreamDepth').textContent = this.metrics.dreamDepth;
        document.getElementById('coherence').textContent = this.metrics.coherence + '%';
        document.getElementById('creativity').textContent = this.metrics.creativity;
        document.getElementById('emotion').textContent = this.metrics.emotion + '%';
    }
    
    addTimelineMarker(label) {
        const timeline = document.getElementById('dreamTimeline');
        const marker = document.createElement('div');
        marker.className = 'timeline-marker';
        marker.style.left = (this.dreamSequence.length * 60) + 'px';
        
        marker.innerHTML = `
            <div class="marker-dot"></div>
            <span class="marker-label">${label}</span>
        `;
        
        timeline.appendChild(marker);
        this.dreamSequence.push({
            time: Date.now(),
            label: label,
            state: JSON.parse(JSON.stringify(this.dreamEntities))
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw dream background
        this.drawDreamBackground();
        
        // Draw dream entities
        this.drawEntities();
        
        // Draw particles
        this.drawParticles();
        
        if (this.isDreaming) {
            this.time++;
            this.updateEntities();
            this.updateParticles();
            this.updateMetrics();
            
            // Occasionally generate new dream elements
            if (Math.random() < 0.01 * this.parameters.imagination / 10) {
                this.createDreamEntity({ intensity: Math.random() * 0.5 });
            }
            
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawDreamBackground() {
        // Gradient background that shifts with dream state
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        
        const hue1 = (280 + Math.sin(this.time * 0.01) * 30) % 360;
        const hue2 = (320 + Math.cos(this.time * 0.008) * 40) % 360;
        
        gradient.addColorStop(0, `hsla(${hue1}, 60%, 15%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue2}, 40%, 8%, 0.9)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawEntities() {
        this.dreamEntities.forEach(entity => {
            this.ctx.globalAlpha = entity.intensity;
            
            const color = entity.color;
            this.ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${color.a})`;
            
            // Apply dream-specific rendering based on type
            switch (entity.type) {
                case 'surreal':
                    this.drawSurrealEntity(entity);
                    break;
                case 'abstract':
                    this.drawAbstractEntity(entity);
                    break;
                case 'cyberpunk':
                    this.drawCyberpunkEntity(entity);
                    break;
                case 'organic':
                    this.drawOrganicEntity(entity);
                    break;
                case 'geometric':
                    this.drawGeometricEntity(entity);
                    break;
                default:
                    this.drawDefaultEntity(entity);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawSurrealEntity(entity) {
        // Impossible geometry
        this.ctx.save();
        this.ctx.translate(entity.x, entity.y);
        this.ctx.rotate(entity.morphState * entity.properties.distortion);
        
        // Distorted shape
        this.ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = entity.size * (1 + Math.sin(entity.morphState + i) * entity.properties.impossibility);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * (1 + entity.properties.distortion);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawAbstractEntity(entity) {
        // Fluid, abstract shapes
        this.ctx.save();
        this.ctx.translate(entity.x, entity.y);
        
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + entity.morphState;
            const radius = entity.size * (0.8 + Math.sin(entity.morphState * 2 + i) * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawCyberpunkEntity(entity) {
        // Digital, glitchy appearance
        this.ctx.save();
        this.ctx.translate(entity.x, entity.y);
        
        // Glitch effect
        if (Math.random() < 0.1) {
            this.ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
        }
        
        this.ctx.fillRect(-entity.size/2, -entity.size/2, entity.size, entity.size);
        
        // Neon outline
        this.ctx.strokeStyle = `hsla(${entity.color.h + 60}, 100%, 80%, 0.8)`;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-entity.size/2, -entity.size/2, entity.size, entity.size);
        
        this.ctx.restore();
    }
    
    drawOrganicEntity(entity) {
        // Natural, flowing shapes
        this.ctx.save();
        this.ctx.translate(entity.x, entity.y);
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, entity.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Organic tendrils
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + entity.morphState;
            const length = entity.size * entity.properties.growth;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(
                Math.cos(angle) * length * 0.5,
                Math.sin(angle) * length * 0.5,
                Math.cos(angle) * length,
                Math.sin(angle) * length
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawGeometricEntity(entity) {
        // Precise geometric shapes
        this.ctx.save();
        this.ctx.translate(entity.x, entity.y);
        this.ctx.rotate(entity.morphState);
        
        const sides = 6;
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * entity.size;
            const y = Math.sin(angle) * entity.size;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawDefaultEntity(entity) {
        this.ctx.beginPath();
        this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawParticles() {
        this.dreamParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.life / 60;
            this.ctx.fillStyle = `hsla(${particle.color.h}, ${particle.color.s}%, ${particle.color.l}%, ${particle.color.a})`;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    startDreaming() {
        this.isDreaming = true;
        document.getElementById('startDreaming').textContent = 'Dreaming...';
        this.render();
    }
    
    pauseDream() {
        this.isDreaming = false;
        document.getElementById('startDreaming').textContent = 'Start Dreaming';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    recordDream() {
        // Record current dream state
        console.log('Recording dream state:', this.dreamEntities);
        alert('Dream state recorded!');
    }
    
    shareDream() {
        // Generate shareable dream data
        const dreamData = {
            entities: this.dreamEntities.length,
            style: document.getElementById('dreamStyle').value,
            parameters: this.parameters,
            preset: this.currentPreset
        };
        
        const shareText = `Check out my AI dream: ${dreamData.entities} entities in ${dreamData.style} style!`;
        if (navigator.share) {
            navigator.share({ title: 'Synthetic Dreams', text: shareText });
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Dream shared to clipboard!');
        }
    }
    
    saveDreamSequence() {
        const data = JSON.stringify(this.dreamSequence, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dream-sequence.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    exportDream() {
        // Export current canvas as image
        const link = document.createElement('a');
        link.download = 'synthetic-dream.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.syntheticDreams = new SyntheticDreams();
});