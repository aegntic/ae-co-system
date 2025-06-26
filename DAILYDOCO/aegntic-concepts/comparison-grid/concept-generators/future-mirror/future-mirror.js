/**
 * Future Mirror - Predictive Reality Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class FutureMirror {
    constructor() {
        this.canvas = document.getElementById('mirrorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.reflections = [];
        this.temporalField = [];
        this.predictionParticles = [];
        this.reflectionSnapshots = [];
        this.isScanning = false;
        this.animationFrame = null;
        
        this.parameters = {
            scanDepth: 6,
            probThreshold: 70,
            clarity: 8,
            variance: 4
        };
        
        this.metrics = {
            scansCompleted: 0,
            accuracyScore: 94.2,
            temporalDepth: '1.2y',
            predictionConfidence: 78
        };
        
        this.activeFilters = new Set(['technology']);
        this.selectedTimeHorizon = '1y';
        this.time = 0;
        this.temporalCenter = { x: 0, y: 0 };
        this.scanningProgress = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvas();
        this.initializeReflections();
        this.render();
    }
    
    setupEventListeners() {
        // Temporal scanning controls
        document.getElementById('temporalScan').addEventListener('click', () => this.performTemporalScan());
        document.getElementById('timeHorizon').addEventListener('change', (e) => {
            this.selectedTimeHorizon = e.target.value;
            this.updateTemporalVisualization();
        });
        
        // Mirror actions
        document.getElementById('startPrediction').addEventListener('click', () => this.startPrediction());
        document.getElementById('pauseScanning').addEventListener('click', () => this.pauseScanning());
        document.getElementById('captureReflection').addEventListener('click', () => this.captureReflection());
        document.getElementById('resetMirror').addEventListener('click', () => this.resetMirror());
        
        // Parameter controls
        document.getElementById('scanDepth').addEventListener('input', (e) => {
            this.parameters.scanDepth = parseInt(e.target.value);
            document.getElementById('depthValue').textContent = e.target.value;
            this.adjustScanDepth();
        });
        
        document.getElementById('probThreshold').addEventListener('input', (e) => {
            this.parameters.probThreshold = parseInt(e.target.value);
            document.getElementById('thresholdValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('clarity').addEventListener('input', (e) => {
            this.parameters.clarity = parseInt(e.target.value);
            document.getElementById('clarityValue').textContent = e.target.value;
            this.adjustClarity();
        });
        
        document.getElementById('variance').addEventListener('input', (e) => {
            this.parameters.variance = parseInt(e.target.value);
            document.getElementById('varianceValue').textContent = e.target.value;
        });
        
        // Reality filters
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                if (e.target.classList.contains('active')) {
                    e.target.classList.remove('active');
                    this.activeFilters.delete(filter);
                } else {
                    e.target.classList.add('active');
                    this.activeFilters.add(filter);
                }
                this.updateRealityFilters();
            });
        });
        
        // Archive actions
        document.getElementById('exportReflections').addEventListener('click', () => this.exportReflections());
        document.getElementById('shareReflection').addEventListener('click', () => this.shareReflection());
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    initializePreloader() {
        // Animate probability level
        let probability = 0;
        const updateProbability = () => {
            probability += Math.random() * 5;
            if (probability > 100) probability = 100;
            
            const probabilityElement = document.getElementById('probabilityLevel');
            if (probabilityElement) {
                probabilityElement.textContent = `Probability: ${Math.floor(probability)}%`;
            }
            
            if (probability < 100) {
                setTimeout(updateProbability, 120);
            } else {
                setTimeout(() => this.hidePreloader(), 1000);
            }
        };
        
        updateProbability();
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
        this.temporalCenter = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
    }
    
    initializeReflections() {
        // Create initial temporal reflections
        for (let i = 0; i < 10; i++) {
            this.reflections.push({
                id: i,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                timeOffset: Math.random() * 100 - 50, // Past/future offset
                probability: Math.random() * 0.6 + 0.3,
                clarity: Math.random() * 0.8 + 0.2,
                filter: Array.from(this.activeFilters)[Math.floor(Math.random() * this.activeFilters.size)],
                size: Math.random() * 20 + 10,
                phase: Math.random() * Math.PI * 2,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                }
            });
        }
        
        this.initializeSnapshot();
    }
    
    initializeSnapshot() {
        // Create initial reflection snapshot
        const snapshot = {
            id: 1,
            timeHorizon: this.selectedTimeHorizon,
            confidence: this.metrics.predictionConfidence,
            timestamp: Date.now(),
            data: this.captureCurrentState()
        };
        
        this.reflectionSnapshots.push(snapshot);
        this.updateArchiveDisplay();
    }
    
    adjustScanDepth() {
        // Add more reflections based on scan depth
        const targetCount = this.parameters.scanDepth * 2;
        while (this.reflections.length < targetCount) {
            this.reflections.push({
                id: this.reflections.length,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                timeOffset: Math.random() * 100 - 50,
                probability: Math.random() * 0.6 + 0.3,
                clarity: Math.random() * 0.8 + 0.2,
                filter: Array.from(this.activeFilters)[Math.floor(Math.random() * this.activeFilters.size)],
                size: Math.random() * 20 + 10,
                phase: Math.random() * Math.PI * 2,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                }
            });
        }
        
        // Remove excess reflections
        if (this.reflections.length > targetCount) {
            this.reflections = this.reflections.slice(0, targetCount);
        }
    }
    
    adjustClarity() {
        // Adjust clarity of existing reflections
        this.reflections.forEach(reflection => {
            reflection.clarity = (this.parameters.clarity / 10) * (Math.random() * 0.4 + 0.6);
        });
    }
    
    updateRealityFilters() {
        // Filter reflections based on active filters
        this.reflections.forEach(reflection => {
            const activeFiltersArray = Array.from(this.activeFilters);
            if (activeFiltersArray.length > 0) {
                reflection.filter = activeFiltersArray[Math.floor(Math.random() * activeFiltersArray.length)];
                reflection.probability = this.activeFilters.has(reflection.filter) ? 
                    Math.min(1, reflection.probability + 0.2) : 
                    Math.max(0.1, reflection.probability - 0.2);
            }
        });
    }
    
    updateTemporalVisualization() {
        // Update visualization based on selected time horizon
        const timeMultiplier = this.getTimeMultiplier(this.selectedTimeHorizon);
        
        this.reflections.forEach(reflection => {
            reflection.timeOffset *= timeMultiplier;
            reflection.size = Math.abs(reflection.timeOffset) / 10 + 5;
        });
        
        this.updateMetrics();
    }
    
    getTimeMultiplier(horizon) {
        const multipliers = {
            '1h': 0.1,
            '1d': 0.3,
            '1w': 0.6,
            '1m': 1,
            '1y': 2,
            '10y': 5
        };
        return multipliers[horizon] || 1;
    }
    
    performTemporalScan() {
        this.scanningProgress = 0;
        const scanInterval = setInterval(() => {
            this.scanningProgress += 10;
            
            // Create scanning particles
            this.createScanParticles();
            
            if (this.scanningProgress >= 100) {
                clearInterval(scanInterval);
                this.completeTemporalScan();
            }
        }, 200);
    }
    
    createScanParticles() {
        for (let i = 0; i < 5; i++) {
            this.predictionParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                targetX: this.temporalCenter.x,
                targetY: this.temporalCenter.y,
                speed: Math.random() * 3 + 2,
                size: Math.random() * 4 + 2,
                alpha: 1,
                life: 60
            });
        }
    }
    
    completeTemporalScan() {
        // Generate new reflections based on scan
        this.metrics.scansCompleted++;
        this.metrics.accuracyScore = (Math.random() * 10 + 90).toFixed(1);
        this.metrics.predictionConfidence = Math.floor(Math.random() * 30 + 70);
        
        // Create new reflection based on scan results
        this.generatePredictiveReflection();
        this.updateMetricsDisplay();
    }
    
    generatePredictiveReflection() {
        const timeHorizons = ['1h', '1d', '1w', '1m', '1y', '10y'];
        const currentIndex = timeHorizons.indexOf(this.selectedTimeHorizon);
        
        const reflection = {
            id: this.reflections.length,
            x: this.temporalCenter.x + (Math.random() - 0.5) * 200,
            y: this.temporalCenter.y + (Math.random() - 0.5) * 200,
            timeOffset: (currentIndex + 1) * 20,
            probability: Math.random() * 0.4 + 0.6,
            clarity: this.parameters.clarity / 10,
            filter: Array.from(this.activeFilters)[0] || 'technology',
            size: 25,
            phase: 0,
            velocity: { x: 0, y: 0 },
            isPrediction: true,
            confidence: this.metrics.predictionConfidence
        };
        
        this.reflections.push(reflection);
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Create temporal ripple at click location
        this.createTemporalRipple(x, y);
        
        // Check if clicking on a reflection
        this.reflections.forEach(reflection => {
            const distance = Math.sqrt(
                Math.pow(reflection.x - x, 2) + 
                Math.pow(reflection.y - y, 2)
            );
            
            if (distance < reflection.size) {
                this.activateReflection(reflection);
            }
        });
    }
    
    createTemporalRipple(x, y) {
        for (let i = 0; i < 10; i++) {
            this.temporalField.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 80 + Math.random() * 40,
                alpha: 1,
                speed: Math.random() * 2 + 1,
                life: 40,
                timeOffset: Math.random() * 50 - 25
            });
        }
    }
    
    activateReflection(reflection) {
        // Enhance reflection on activation
        reflection.size *= 1.5;
        reflection.clarity = Math.min(1, reflection.clarity + 0.3);
        reflection.probability = Math.min(1, reflection.probability + 0.2);
        
        // Create activation particles
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            this.predictionParticles.push({
                x: reflection.x,
                y: reflection.y,
                targetX: reflection.x + Math.cos(angle) * 60,
                targetY: reflection.y + Math.sin(angle) * 60,
                speed: 3,
                size: Math.random() * 3 + 1,
                alpha: 1,
                life: 30,
                color: this.getFilterColor(reflection.filter)
            });
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Influence nearby reflections with mouse proximity
        this.reflections.forEach(reflection => {
            const distance = Math.sqrt(
                Math.pow(reflection.x - mouseX, 2) + 
                Math.pow(reflection.y - mouseY, 2)
            );
            
            if (distance < 100) {
                const influence = (100 - distance) / 100;
                reflection.clarity = Math.min(1, reflection.clarity + influence * 0.01);
                
                // Slight attraction to mouse
                const dx = mouseX - reflection.x;
                const dy = mouseY - reflection.y;
                reflection.velocity.x += dx * influence * 0.001;
                reflection.velocity.y += dy * influence * 0.001;
            }
        });
    }
    
    updateReflections() {
        this.reflections.forEach((reflection, index) => {
            // Update position
            reflection.x += reflection.velocity.x;
            reflection.y += reflection.velocity.y;
            
            // Apply damping
            reflection.velocity.x *= 0.99;
            reflection.velocity.y *= 0.99;
            
            // Temporal oscillation
            reflection.phase += 0.02;
            const temporalShift = Math.sin(reflection.phase + reflection.timeOffset * 0.1) * 2;
            reflection.x += temporalShift;
            
            // Boundary constraints
            if (reflection.x < 0 || reflection.x > this.canvas.width) {
                reflection.velocity.x *= -0.8;
                reflection.x = Math.max(0, Math.min(this.canvas.width, reflection.x));
            }
            if (reflection.y < 0 || reflection.y > this.canvas.height) {
                reflection.velocity.y *= -0.8;
                reflection.y = Math.max(0, Math.min(this.canvas.height, reflection.y));
            }
            
            // Probability decay for non-prediction reflections
            if (!reflection.isPrediction) {
                reflection.probability *= 0.9999;
                if (reflection.probability < 0.1) {
                    this.reflections.splice(index, 1);
                }
            }
        });
    }
    
    updatePredictionParticles() {
        this.predictionParticles = this.predictionParticles.filter(particle => {
            // Move towards target
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            
            particle.x += dx * 0.1;
            particle.y += dy * 0.1;
            
            particle.life--;
            particle.alpha = particle.life / 60;
            
            return particle.life > 0;
        });
    }
    
    updateTemporalField() {
        this.temporalField = this.temporalField.filter(field => {
            field.radius += field.speed;
            field.alpha -= 0.025;
            field.life--;
            
            return field.life > 0 && field.alpha > 0;
        });
    }
    
    updateMetrics() {
        // Calculate temporal depth based on time horizon
        const depthMapping = {
            '1h': '0.1d',
            '1d': '1.0d',
            '1w': '7.0d',
            '1m': '1.0m',
            '1y': '1.0y',
            '10y': '10.0y'
        };
        
        this.metrics.temporalDepth = depthMapping[this.selectedTimeHorizon] || '1.0y';
        
        // Update prediction confidence based on clarity and active filters
        const avgClarity = this.reflections.reduce((sum, ref) => sum + ref.clarity, 0) / this.reflections.length;
        const filterBonus = this.activeFilters.size * 5;
        this.metrics.predictionConfidence = Math.min(95, Math.floor(avgClarity * 50 + filterBonus + 40));
        
        this.updateMetricsDisplay();
    }
    
    updateMetricsDisplay() {
        document.getElementById('scansCompleted').textContent = this.metrics.scansCompleted;
        document.getElementById('accuracyScore').textContent = this.metrics.accuracyScore + '%';
        document.getElementById('temporalDepth').textContent = this.metrics.temporalDepth;
        document.getElementById('predictionConfidence').textContent = this.metrics.predictionConfidence + '%';
        
        // Update probability indicators
        const indicators = document.querySelectorAll('.prob-value');
        if (indicators.length >= 3) {
            indicators[0].textContent = Math.floor(this.metrics.predictionConfidence * 0.9) + '%';
            indicators[1].textContent = Math.floor(this.metrics.predictionConfidence * 0.6) + '%';
            indicators[2].textContent = Math.floor(this.metrics.predictionConfidence * 0.3) + '%';
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw temporal background
        this.drawTemporalBackground();
        
        // Draw temporal field
        this.drawTemporalField();
        
        // Draw reflections
        this.drawReflections();
        
        // Draw prediction particles
        this.drawPredictionParticles();
        
        // Draw temporal center
        this.drawTemporalCenter();
        
        if (this.isScanning) {
            this.time++;
            this.updateReflections();
            this.updatePredictionParticles();
            this.updateTemporalField();
            this.updateMetrics();
            
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawTemporalBackground() {
        // Gradient representing temporal field
        const gradient = this.ctx.createRadialGradient(
            this.temporalCenter.x, this.temporalCenter.y, 0,
            this.temporalCenter.x, this.temporalCenter.y, 400
        );
        
        gradient.addColorStop(0, 'rgba(108, 92, 231, 0.1)');
        gradient.addColorStop(0.5, 'rgba(108, 92, 231, 0.05)');
        gradient.addColorStop(1, 'rgba(45, 27, 105, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Time flow lines
        this.ctx.strokeStyle = 'rgba(162, 155, 254, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.temporalCenter.x, this.temporalCenter.y);
            this.ctx.lineTo(
                this.temporalCenter.x + Math.cos(angle) * 300,
                this.temporalCenter.y + Math.sin(angle) * 300
            );
            this.ctx.stroke();
        }
    }
    
    drawTemporalField() {
        this.temporalField.forEach(field => {
            this.ctx.globalAlpha = field.alpha;
            
            // Color based on time offset
            const hue = field.timeOffset > 0 ? 280 : 240; // Future vs past
            this.ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawReflections() {
        this.reflections.forEach(reflection => {
            this.ctx.globalAlpha = reflection.clarity * reflection.probability;
            
            // Reflection appearance based on filter and time offset
            const color = this.getFilterColor(reflection.filter);
            const timeIntensity = Math.abs(reflection.timeOffset) / 50;
            
            // Main reflection circle
            this.ctx.fillStyle = color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
            
            this.ctx.beginPath();
            this.ctx.arc(reflection.x, reflection.y, reflection.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            // Prediction confidence ring for prediction reflections
            if (reflection.isPrediction) {
                this.ctx.globalAlpha = 0.5;
                this.ctx.strokeStyle = '#fd79a8';
                this.ctx.lineWidth = 3;
                
                this.ctx.beginPath();
                this.ctx.arc(reflection.x, reflection.y, reflection.size + 8, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Time offset indicator
            if (Math.abs(reflection.timeOffset) > 10) {
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillStyle = reflection.timeOffset > 0 ? '#a29bfe' : '#74b9ff';
                this.ctx.font = '10px JetBrains Mono';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    reflection.timeOffset > 0 ? '+' : '-',
                    reflection.x,
                    reflection.y - reflection.size - 10
                );
            }
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left';
    }
    
    drawPredictionParticles() {
        this.predictionParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color || '#a29bfe';
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawTemporalCenter() {
        // Pulsating temporal core
        const pulseSize = 15 + Math.sin(this.time * 0.1) * 5;
        
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#6c5ce7';
        
        this.ctx.beginPath();
        this.ctx.arc(this.temporalCenter.x, this.temporalCenter.y, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Temporal rings
        for (let i = 1; i <= 2; i++) {
            this.ctx.globalAlpha = 0.3 / i;
            this.ctx.strokeStyle = '#a29bfe';
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.temporalCenter.x, 
                this.temporalCenter.y, 
                pulseSize + (i * 15), 
                0, Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    getFilterColor(filter) {
        const colors = {
            technology: '#6c5ce7',
            society: '#00cec9',
            environment: '#00b894',
            economy: '#fdcb6e',
            science: '#74b9ff',
            personal: '#fd79a8'
        };
        
        return colors[filter] || '#a29bfe';
    }
    
    startPrediction() {
        this.isScanning = true;
        document.getElementById('startPrediction').textContent = 'Predicting...';
        this.render();
    }
    
    pauseScanning() {
        this.isScanning = false;
        document.getElementById('startPrediction').textContent = 'Start Prediction';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    resetMirror() {
        this.pauseScanning();
        this.reflections = [];
        this.temporalField = [];
        this.predictionParticles = [];
        this.metrics = {
            scansCompleted: 0,
            accuracyScore: 94.2,
            temporalDepth: '1.2y',
            predictionConfidence: 78
        };
        this.initializeReflections();
        this.updateMetricsDisplay();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    captureReflection() {
        const snapshot = {
            id: this.reflectionSnapshots.length + 1,
            timeHorizon: this.selectedTimeHorizon,
            confidence: this.metrics.predictionConfidence,
            timestamp: Date.now(),
            data: this.captureCurrentState()
        };
        
        this.reflectionSnapshots.push(snapshot);
        this.updateArchiveDisplay();
        
        // Visual feedback
        this.createTemporalRipple(this.temporalCenter.x, this.temporalCenter.y);
        alert('Reflection captured to archive!');
    }
    
    captureCurrentState() {
        // Capture current canvas state
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return {
            reflections: this.reflections.length,
            activeFilters: Array.from(this.activeFilters),
            parameters: {...this.parameters},
            imageData: imageData
        };
    }
    
    updateArchiveDisplay() {
        const archiveGrid = document.querySelector('.archive-grid');
        archiveGrid.innerHTML = '';
        
        this.reflectionSnapshots.forEach((snapshot, index) => {
            const isActive = index === this.reflectionSnapshots.length - 1;
            const item = document.createElement('div');
            item.className = `reflection-snapshot ${isActive ? 'active' : ''}`;
            item.dataset.id = snapshot.id;
            
            item.innerHTML = `
                <div class="snapshot-preview">
                    <canvas class="mini-canvas" width="120" height="80"></canvas>
                </div>
                <div class="snapshot-info">
                    <h4>${snapshot.timeHorizon} Future Scan</h4>
                    <span>${snapshot.confidence}% Confidence</span>
                    <span>${new Date(snapshot.timestamp).toLocaleTimeString()}</span>
                </div>
            `;
            
            // Draw mini preview
            const miniCanvas = item.querySelector('.mini-canvas');
            const miniCtx = miniCanvas.getContext('2d');
            if (snapshot.data.imageData) {
                const scaledImageData = this.scaleImageData(snapshot.data.imageData, 120, 80);
                miniCtx.putImageData(scaledImageData, 0, 0);
            }
            
            item.addEventListener('click', () => {
                this.loadSnapshot(snapshot.id);
            });
            
            archiveGrid.appendChild(item);
        });
    }
    
    scaleImageData(imageData, newWidth, newHeight) {
        // Simple scaling for preview (in production, use better scaling algorithm)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        const scaledCanvas = document.createElement('canvas');
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCanvas.width = newWidth;
        scaledCanvas.height = newHeight;
        scaledCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        
        return scaledCtx.getImageData(0, 0, newWidth, newHeight);
    }
    
    loadSnapshot(id) {
        const snapshot = this.reflectionSnapshots.find(s => s.id === id);
        if (snapshot) {
            // Restore state from snapshot
            this.parameters = {...snapshot.data.parameters};
            this.selectedTimeHorizon = snapshot.timeHorizon;
            
            // Update UI
            document.getElementById('timeHorizon').value = snapshot.timeHorizon;
            document.getElementById('scanDepth').value = this.parameters.scanDepth;
            document.getElementById('depthValue').textContent = this.parameters.scanDepth;
            
            // Update active state
            document.querySelectorAll('.reflection-snapshot').forEach(item => {
                item.classList.toggle('active', item.dataset.id === id.toString());
            });
        }
    }
    
    exportReflections() {
        const data = JSON.stringify(this.reflectionSnapshots, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `future-reflections-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    shareReflection() {
        if (this.reflectionSnapshots.length > 0) {
            const latestSnapshot = this.reflectionSnapshots[this.reflectionSnapshots.length - 1];
            const shareText = `Future Mirror Reflection: ${latestSnapshot.timeHorizon} prediction with ${latestSnapshot.confidence}% confidence - Created with Future Mirror by aegntic.ai`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Future Mirror Reflection',
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Reflection details copied to clipboard!');
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.futureMirror = new FutureMirror();
});