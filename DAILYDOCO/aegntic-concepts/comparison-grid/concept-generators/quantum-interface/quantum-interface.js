/**
 * Quantum Interface - Particle Physics Inspired Morphing UI
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

// Quantum State Management
class QuantumInterface {
    constructor() {
        this.quantumStates = new Map();
        this.entangledPairs = [];
        this.particles = [];
        this.waveFunctions = [];
        this.coherenceTime = Infinity;
        this.superpositionLevel = 50;
        this.entanglementStrength = 30;
        this.decoherenceRate = 20;
        
        this.performance = {
            startTime: performance.now(),
            frameCount: 0,
            fps: 0,
            quantumOperations: 0
        };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupParticleField();
        this.setupEntanglementCanvas();
        this.setupQuantumElements();
        this.setupEventListeners();
        this.startPreloader();
        this.animate();
    }

    setupCanvas() {
        this.canvas = document.getElementById('quantumCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupQuantumField();
    }

    setupQuantumField() {
        // Initialize quantum particles with wave-particle duality
        this.quantumParticles = [];
        
        for (let i = 0; i < 50; i++) {
            const particle = this.createQuantumParticle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            );
            this.quantumParticles.push(particle);
        }
    }

    createQuantumParticle(x, y) {
        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            phase: Math.random() * Math.PI * 2,
            amplitude: Math.random() * 0.5 + 0.5,
            frequency: Math.random() * 0.1 + 0.05,
            superposition: true,
            entangled: null,
            waveFunction: this.generateWaveFunction(),
            probability: Math.random(),
            spin: Math.random() > 0.5 ? 0.5 : -0.5,
            color: this.getQuantumColor(),
            size: Math.random() * 3 + 2
        };
    }

    generateWaveFunction() {
        // Simplified wave function representation
        return {
            real: Math.random() * 2 - 1,
            imaginary: Math.random() * 2 - 1,
            probability: function() {
                return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
            }
        };
    }

    getQuantumColor() {
        const colors = [
            '#ff6b6b', // Superposition red
            '#4ecdc4', // Entanglement teal  
            '#45b7d1', // Collapse blue
            '#96ceb4', // Uncertainty green
            '#feca57'  // Measurement yellow
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupParticleField() {
        const particleField = document.getElementById('particleField');
        
        // Create background quantum particles
        for (let i = 0; i < 100; i++) {
            const particle = document.createElement('div');
            particle.className = 'quantum-particle';
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particleField.appendChild(particle);
        }
    }

    setupEntanglementCanvas() {
        this.entanglementCanvas = document.getElementById('entanglementCanvas');
        this.entanglementCtx = this.entanglementCanvas.getContext('2d');
        this.entanglementCanvas.width = window.innerWidth;
        this.entanglementCanvas.height = window.innerHeight;
        
        this.createEntangledPairs();
    }

    createEntangledPairs() {
        // Create quantum entanglement between random elements
        const quantumElements = document.querySelectorAll('.quantum-element');
        const elementsArray = Array.from(quantumElements);
        
        for (let i = 0; i < Math.min(5, Math.floor(elementsArray.length / 2)); i++) {
            const element1 = elementsArray[Math.floor(Math.random() * elementsArray.length)];
            const element2 = elementsArray[Math.floor(Math.random() * elementsArray.length)];
            
            if (element1 !== element2) {
                this.entangledPairs.push({
                    element1: element1,
                    element2: element2,
                    correlation: Math.random(),
                    strength: 0.3 + Math.random() * 0.7
                });
            }
        }
    }

    setupQuantumElements() {
        const quantumElements = document.querySelectorAll('.quantum-element');
        
        quantumElements.forEach((element, index) => {
            // Initialize quantum state
            this.quantumStates.set(element, {
                superposition: true,
                collapsed: false,
                phase: Math.random() * Math.PI * 2,
                amplitude: 0.5 + Math.random() * 0.5,
                observationCount: 0,
                lastObservation: 0
            });
            
            // Add interaction observers
            this.addQuantumObserver(element);
        });
    }

    addQuantumObserver(element) {
        const state = this.quantumStates.get(element);
        
        // Mouse enter - partial observation
        element.addEventListener('mouseenter', () => {
            this.partialObservation(element);
        });
        
        // Mouse leave - return to superposition
        element.addEventListener('mouseleave', () => {
            this.returnToSuperposition(element);
        });
        
        // Click - full observation (wave function collapse)
        element.addEventListener('click', () => {
            this.collapseWaveFunction(element);
        });
        
        // Intersection observer for viewport observations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.weakObservation(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(element);
    }

    partialObservation(element) {
        const state = this.quantumStates.get(element);
        state.amplitude *= 0.8;
        state.observationCount++;
        state.lastObservation = performance.now();
        
        // Visual feedback
        element.style.filter = 'blur(0.2px) brightness(1.2)';
        element.style.transform = 'scale(1.02) translateZ(5px)';
        
        this.performance.quantumOperations++;
    }

    returnToSuperposition(element) {
        const state = this.quantumStates.get(element);
        
        // Only return if not recently collapsed
        if (performance.now() - state.lastObservation > 2000) {
            state.superposition = true;
            state.collapsed = false;
            state.amplitude = 0.5 + Math.random() * 0.5;
            
            element.setAttribute('data-state', 'superposition');
            element.style.filter = '';
            element.style.transform = '';
        }
    }

    collapseWaveFunction(element) {
        const state = this.quantumStates.get(element);
        state.superposition = false;
        state.collapsed = true;
        state.amplitude = 1;
        state.phase = 0;
        state.lastObservation = performance.now();
        
        // Visual collapse effect
        element.setAttribute('data-state', 'collapsed');
        element.style.filter = 'blur(0px) brightness(1.5)';
        element.style.transform = 'scale(1) translateZ(0px)';
        
        // Affect entangled pairs
        this.affectEntangledPairs(element);
        
        // Trigger collapse animation
        this.triggerCollapseAnimation(element);
        
        this.performance.quantumOperations++;
    }

    weakObservation(element) {
        const state = this.quantumStates.get(element);
        if (state.superposition) {
            state.amplitude *= 0.95;
            state.phase += 0.1;
        }
    }

    affectEntangledPairs(element) {
        this.entangledPairs.forEach(pair => {
            if (pair.element1 === element || pair.element2 === element) {
                const otherElement = pair.element1 === element ? pair.element2 : pair.element1;
                const otherState = this.quantumStates.get(otherElement);
                
                // Instantaneous correlation (spooky action at a distance)
                if (otherState.superposition) {
                    otherState.phase = Math.PI - this.quantumStates.get(element).phase;
                    otherState.amplitude *= pair.correlation;
                    
                    // Visual entanglement effect
                    otherElement.setAttribute('data-state', 'entangled');
                    setTimeout(() => {
                        if (otherState.superposition) {
                            otherElement.setAttribute('data-state', 'superposition');
                        }
                    }, 1000);
                }
            }
        });
    }

    triggerCollapseAnimation(element) {
        // Create collapse ripple effect
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = rect.left + rect.width / 2 + 'px';
        ripple.style.top = rect.top + rect.height / 2 + 'px';
        ripple.style.width = '4px';
        ripple.style.height = '4px';
        ripple.style.background = 'radial-gradient(circle, #ff6b6b, transparent)';
        ripple.style.borderRadius = '50%';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '10000';
        ripple.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(ripple);
        
        // Animate ripple
        const animation = ripple.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(20)', opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        });
        
        animation.onfinish = () => {
            document.body.removeChild(ripple);
        };
    }

    startPreloader() {
        this.preloaderCanvas = document.getElementById('preloaderCanvas');
        this.preloaderCtx = this.preloaderCanvas.getContext('2d');
        this.preloaderProgress = 0;
        
        const preloaderInterval = setInterval(() => {
            this.preloaderProgress += 0.015;
            this.drawPreloader();
            
            if (this.preloaderProgress >= 1) {
                clearInterval(preloaderInterval);
                this.hidePreloader();
            }
        }, 50);
    }

    drawPreloader() {
        const canvas = this.preloaderCanvas;
        const ctx = this.preloaderCtx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw materializing particles
        const particleCount = Math.floor(this.preloaderProgress * 200);
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 4;
            const radius = 30 + Math.sin(i * 0.1 + Date.now() * 0.005) * 100;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            particles.push({ x, y, size: 1 + Math.random() * 2 });
            
            // Draw particle with quantum uncertainty
            const uncertainty = Math.sin(Date.now() * 0.01 + i) * 0.5 + 0.5;
            ctx.globalAlpha = uncertainty;
            ctx.shadowColor = '#ff6b6b';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(x, y, particles[i].size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw quantum field lines
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < particles.length - 1; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 80) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        preloader.classList.add('hidden');
        
        setTimeout(() => {
            preloader.style.display = 'none';
            this.startQuantumOperations();
        }, 1000);
    }

    startQuantumOperations() {
        // Begin quantum field simulations
        this.quantumFieldActive = true;
        
        // Start decoherence timer
        this.startDecoherence();
        
        // Initialize quantum controls
        this.setupQuantumControls();
    }

    startDecoherence() {
        setInterval(() => {
            this.quantumStates.forEach((state, element) => {
                if (state.superposition && performance.now() - state.lastObservation > 5000) {
                    // Natural decoherence
                    state.amplitude *= (1 - this.decoherenceRate / 1000);
                    if (state.amplitude < 0.1) {
                        this.returnToSuperposition(element);
                    }
                }
            });
        }, 100);
    }

    setupQuantumControls() {
        // Superposition control
        document.getElementById('superpositionLevel').addEventListener('input', (e) => {
            this.superpositionLevel = parseInt(e.target.value);
            this.updateQuantumField();
        });
        
        // Entanglement control
        document.getElementById('entanglementStrength').addEventListener('input', (e) => {
            this.entanglementStrength = parseInt(e.target.value);
            this.updateEntanglement();
        });
        
        // Decoherence control
        document.getElementById('decoherenceRate').addEventListener('input', (e) => {
            this.decoherenceRate = parseInt(e.target.value);
        });
    }

    updateQuantumField() {
        this.quantumParticles.forEach(particle => {
            particle.amplitude = (this.superpositionLevel / 100) * (0.5 + Math.random() * 0.5);
            particle.superposition = this.superpositionLevel > 10;
        });
    }

    updateEntanglement() {
        this.entangledPairs.forEach(pair => {
            pair.strength = this.entanglementStrength / 100;
            pair.correlation = pair.strength * (0.5 + Math.random() * 0.5);
        });
    }

    drawQuantumField() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw quantum particles
        this.quantumParticles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        
        // Draw quantum field interactions
        this.drawQuantumInteractions();
        
        // Update statistics
        this.updateQuantumStats();
    }

    updateParticle(particle) {
        if (particle.superposition) {
            // Quantum uncertainty in position
            particle.x += particle.vx + (Math.random() - 0.5) * 0.5;
            particle.y += particle.vy + (Math.random() - 0.5) * 0.5;
            
            // Wave function evolution
            particle.phase += particle.frequency;
            particle.waveFunction.real = Math.cos(particle.phase) * particle.amplitude;
            particle.waveFunction.imaginary = Math.sin(particle.phase) * particle.amplitude;
            
            // Boundary conditions with quantum tunneling
            if (particle.x < 0 || particle.x > this.canvas.width) {
                if (Math.random() < 0.1) {
                    // Quantum tunneling
                    particle.x = particle.x < 0 ? this.canvas.width : 0;
                } else {
                    particle.vx *= -1;
                }
            }
            
            if (particle.y < 0 || particle.y > this.canvas.height) {
                if (Math.random() < 0.1) {
                    // Quantum tunneling
                    particle.y = particle.y < 0 ? this.canvas.height : 0;
                } else {
                    particle.vy *= -1;
                }
            }
        }
        
        this.performance.quantumOperations++;
    }

    drawParticle(particle) {
        const ctx = this.ctx;
        const probability = particle.waveFunction.probability();
        
        if (particle.superposition) {
            // Draw probability cloud
            const cloudSize = particle.size * (1 + probability * 2);
            const alpha = probability * particle.amplitude;
            
            ctx.globalAlpha = alpha;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = cloudSize * 2;
            
            // Multiple position states (superposition visualization)
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * cloudSize;
                const offsetY = (Math.random() - 0.5) * cloudSize;
                
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(
                    particle.x + offsetX, 
                    particle.y + offsetY, 
                    particle.size * (0.5 + probability * 0.5), 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            // Collapsed state - single definite position
            ctx.globalAlpha = 1;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size * 3;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawQuantumInteractions() {
        const ctx = this.ctx;
        
        // Draw entanglement connections
        for (let i = 0; i < this.quantumParticles.length - 1; i++) {
            for (let j = i + 1; j < this.quantumParticles.length; j++) {
                const p1 = this.quantumParticles[i];
                const p2 = this.quantumParticles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100 && p1.superposition && p2.superposition) {
                    // Entanglement visualization
                    const entanglementStrength = (100 - distance) / 100;
                    
                    ctx.globalAlpha = entanglementStrength * 0.3;
                    ctx.strokeStyle = '#4ecdc4';
                    ctx.lineWidth = entanglementStrength * 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    
                    // Quantum field distortion
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const distortion = Math.sin(Date.now() * 0.01) * 20;
                    
                    ctx.quadraticCurveTo(
                        midX + distortion, 
                        midY + distortion, 
                        p2.x, 
                        p2.y
                    );
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
    }

    drawEntanglementConnections() {
        const ctx = this.entanglementCtx;
        ctx.clearRect(0, 0, this.entanglementCanvas.width, this.entanglementCanvas.height);
        
        this.entangledPairs.forEach(pair => {
            const rect1 = pair.element1.getBoundingClientRect();
            const rect2 = pair.element2.getBoundingClientRect();
            
            const x1 = rect1.left + rect1.width / 2;
            const y1 = rect1.top + rect1.height / 2;
            const x2 = rect2.left + rect2.width / 2;
            const y2 = rect2.top + rect2.height / 2;
            
            // Draw entanglement line with quantum fluctuations
            ctx.globalAlpha = pair.strength * 0.3;
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            
            // Add quantum fluctuations
            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t;
                
                const fluctuation = Math.sin(Date.now() * 0.005 + t * Math.PI * 2) * 5;
                ctx.lineTo(x + fluctuation, y + fluctuation);
            }
            
            ctx.stroke();
        });
        
        ctx.globalAlpha = 1;
    }

    updateQuantumStats() {
        const superposedParticles = this.quantumParticles.filter(p => p.superposition).length;
        const entangledPairsCount = this.entangledPairs.length;
        const coherenceTime = this.calculateCoherenceTime();
        
        document.getElementById('particleCount').textContent = superposedParticles;
        document.getElementById('entangledPairs').textContent = entangledPairsCount;
        document.getElementById('coherenceTime').textContent = coherenceTime > 1000 ? '∞' : coherenceTime + 'ms';
    }

    calculateCoherenceTime() {
        const avgAmplitude = this.quantumParticles.reduce((sum, p) => sum + p.amplitude, 0) / this.quantumParticles.length;
        return Math.round(avgAmplitude * 1000 / (this.decoherenceRate / 100 + 0.01));
    }

    setupEventListeners() {
        // Wave function collapse button
        document.getElementById('collapseWaveFunction').addEventListener('click', () => {
            this.globalWaveFunctionCollapse();
        });
        
        // Quantum lab button
        document.getElementById('enterQuantumLab').addEventListener('click', () => {
            document.getElementById('quantum-lab').scrollIntoView({ behavior: 'smooth' });
        });
        
        // Experiment buttons
        document.querySelectorAll('.experiment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.experiment-card');
                const experiment = card.dataset.experiment;
                this.runQuantumExperiment(experiment, card);
            });
        });
        
        // Quantum circuit controls
        document.getElementById('runCircuit').addEventListener('click', () => {
            this.runQuantumCircuit();
        });
        
        document.getElementById('resetCircuit').addEventListener('click', () => {
            this.resetQuantumCircuit();
        });
        
        document.getElementById('measureQubits').addEventListener('click', () => {
            this.measureQuantumState();
        });
        
        // Algorithm selector
        document.getElementById('runAlgorithm').addEventListener('click', () => {
            const algorithm = document.getElementById('algorithmSelect').value;
            this.runQuantumAlgorithm(algorithm);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    globalWaveFunctionCollapse() {
        // Collapse all quantum elements simultaneously
        const quantumElements = document.querySelectorAll('.quantum-element');
        
        quantumElements.forEach((element, index) => {
            setTimeout(() => {
                this.collapseWaveFunction(element);
            }, index * 100);
        });
        
        // Collapse quantum particles
        this.quantumParticles.forEach(particle => {
            particle.superposition = false;
            particle.amplitude = 1;
            particle.phase = 0;
        });
        
        // Update button state
        const button = document.getElementById('collapseWaveFunction');
        button.textContent = 'Wave Function Collapsed';
        button.style.background = 'linear-gradient(135deg, #45b7d1 0%, #2c5f7a 100%)';
        
        setTimeout(() => {
            button.textContent = 'Collapse Wave Function';
            button.style.background = '';
            this.returnAllToSuperposition();
        }, 5000);
    }

    returnAllToSuperposition() {
        const quantumElements = document.querySelectorAll('.quantum-element');
        
        quantumElements.forEach(element => {
            this.returnToSuperposition(element);
        });
        
        this.quantumParticles.forEach(particle => {
            particle.superposition = true;
            particle.amplitude = 0.5 + Math.random() * 0.5;
            particle.phase = Math.random() * Math.PI * 2;
        });
    }

    runQuantumExperiment(experiment, card) {
        const canvas = card.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Disable button during experiment
        const btn = card.querySelector('.experiment-btn');
        btn.disabled = true;
        btn.textContent = 'Running...';
        
        switch (experiment) {
            case 'double-slit':
                this.doubleSlitExperiment(ctx, canvas);
                break;
            case 'bell-test':
                this.bellTheoremTest(ctx, canvas);
                break;
            case 'schrodinger':
                this.schrodingersCat(ctx, canvas);
                break;
            case 'tunneling':
                this.quantumTunneling(ctx, canvas);
                break;
        }
        
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Run Experiment';
        }, 3000);
    }

    doubleSlitExperiment(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw double slits
        ctx.fillStyle = '#333';
        ctx.fillRect(150, 0, 20, 80);
        ctx.fillRect(150, 120, 20, 200);
        
        // Animate photons and interference pattern
        let frame = 0;
        const animate = () => {
            if (frame < 60) {
                // Draw photon
                const y = 50 + Math.sin(frame * 0.2) * 30;
                ctx.fillStyle = '#feca57';
                ctx.beginPath();
                ctx.arc(frame * 2.5, y, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw interference pattern
                if (frame > 30) {
                    const x = 250;
                    for (let i = 0; i < canvas.height; i += 5) {
                        const intensity = Math.abs(Math.sin(i * 0.1 + frame * 0.1));
                        ctx.globalAlpha = intensity;
                        ctx.fillStyle = '#ff6b6b';
                        ctx.fillRect(x, i, 3, 5);
                    }
                }
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    bellTheoremTest(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw entangled particle pair
        let frame = 0;
        const animate = () => {
            if (frame < 60) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Entangled particles
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                const particle1X = centerX - frame * 2;
                const particle2X = centerX + frame * 2;
                
                // Draw connection
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(particle1X, centerY);
                ctx.lineTo(particle2X, centerY);
                ctx.stroke();
                
                // Draw particles with correlated spins
                const spin1 = Math.sin(frame * 0.2);
                const spin2 = -spin1; // Anti-correlated
                
                ctx.fillStyle = spin1 > 0 ? '#ff6b6b' : '#4ecdc4';
                ctx.beginPath();
                ctx.arc(particle1X, centerY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = spin2 > 0 ? '#ff6b6b' : '#4ecdc4';
                ctx.beginPath();
                ctx.arc(particle2X, centerY, 5, 0, Math.PI * 2);
                ctx.fill();
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    schrodingersCat(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw superposition box
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, 200, 100);
        
        let frame = 0;
        const animate = () => {
            if (frame < 90) {
                ctx.clearRect(51, 51, 198, 98);
                
                // Superposition state - cat is both alive and dead
                const alpha = Math.abs(Math.sin(frame * 0.2));
                
                // Alive cat
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#96ceb4';
                ctx.fillText('😸 Alive', 100, 100);
                
                // Dead cat
                ctx.globalAlpha = 1 - alpha;
                ctx.fillStyle = '#ff6b6b';
                ctx.fillText('💀 Dead', 150, 100);
                
                ctx.globalAlpha = 1;
                
                // Observation at frame 60
                if (frame === 60) {
                    const outcome = Math.random() > 0.5;
                    ctx.clearRect(51, 51, 198, 98);
                    ctx.fillStyle = outcome ? '#96ceb4' : '#ff6b6b';
                    ctx.fillText(outcome ? '😸 Alive!' : '💀 Dead!', 120, 100);
                }
                
                frame++;
                if (frame < 60) {
                    requestAnimationFrame(animate);
                }
            }
        };
        animate();
    }

    quantumTunneling(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw energy barrier
        ctx.fillStyle = '#666';
        ctx.fillRect(120, 50, 60, 100);
        
        let frame = 0;
        const animate = () => {
            if (frame < 80) {
                // Clear particle area
                ctx.clearRect(0, 90, canvas.width, 20);
                
                // Draw particle
                const x = frame * 3;
                
                if (x > 120 && x < 180) {
                    // Inside barrier - probability visualization
                    const tunnelProb = Math.exp(-(x - 120) / 20);
                    ctx.globalAlpha = tunnelProb;
                }
                
                ctx.fillStyle = '#feca57';
                ctx.beginPath();
                ctx.arc(x, 100, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.globalAlpha = 1;
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    runQuantumCircuit() {
        // Simulate quantum circuit execution
        const qubits = document.querySelectorAll('.qubit');
        
        qubits.forEach((qubit, index) => {
            setTimeout(() => {
                // Apply quantum gates
                const currentState = qubit.textContent;
                const newState = this.applyQuantumGate(currentState, 'H'); // Hadamard gate
                qubit.textContent = newState;
                
                // Visual feedback
                qubit.style.background = 'linear-gradient(135deg, #feca57 0%, #ff6b6b 100%)';
                setTimeout(() => {
                    qubit.style.background = '';
                }, 500);
            }, index * 200);
        });
    }

    applyQuantumGate(state, gate) {
        // Simplified quantum gate operations
        switch (gate) {
            case 'H': // Hadamard - creates superposition
                return state === '|0⟩' ? '|+⟩' : '|-⟩';
            case 'X': // Pauli-X - bit flip
                return state === '|0⟩' ? '|1⟩' : '|0⟩';
            case 'Y': // Pauli-Y
                return state === '|0⟩' ? 'i|1⟩' : '-i|0⟩';
            case 'Z': // Pauli-Z - phase flip
                return state === '|1⟩' ? '-|1⟩' : state;
            default:
                return state;
        }
    }

    resetQuantumCircuit() {
        const qubits = document.querySelectorAll('.qubit');
        qubits.forEach(qubit => {
            qubit.textContent = '|0⟩';
            qubit.setAttribute('data-state', '|0⟩');
        });
    }

    measureQuantumState() {
        const qubits = document.querySelectorAll('.qubit');
        
        qubits.forEach((qubit, index) => {
            setTimeout(() => {
                // Quantum measurement collapses superposition
                const currentState = qubit.textContent;
                if (currentState.includes('+') || currentState.includes('-')) {
                    const collapsed = Math.random() > 0.5 ? '|0⟩' : '|1⟩';
                    qubit.textContent = collapsed;
                    
                    // Measurement effect
                    qubit.style.boxShadow = '0 0 20px #45b7d1';
                    setTimeout(() => {
                        qubit.style.boxShadow = '';
                    }, 1000);
                }
            }, index * 150);
        });
    }

    runQuantumAlgorithm(algorithm) {
        const canvas = document.getElementById('algorithmViz').querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        switch (algorithm) {
            case 'grover':
                this.groversSearch(ctx, canvas);
                break;
            case 'shor':
                this.shorFactoring(ctx, canvas);
                break;
            case 'deutsch':
                this.deutschJozsa(ctx, canvas);
                break;
            case 'teleportation':
                this.quantumTeleportation(ctx, canvas);
                break;
        }
    }

    groversSearch(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Visualize Grover's amplitude amplification
        let iteration = 0;
        const target = 3; // Target item
        const n = 4; // Database size
        
        const animate = () => {
            if (iteration < 10) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw database items with amplitudes
                for (let i = 0; i < n; i++) {
                    const x = 50 + i * 80;
                    const amplitude = i === target ? 
                        Math.sin((iteration + 1) * Math.PI / 4) : 
                        Math.cos((iteration + 1) * Math.PI / (4 * Math.sqrt(n)));
                    
                    const height = Math.abs(amplitude) * 100;
                    const color = i === target ? '#ff6b6b' : '#4ecdc4';
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x, 150 - height, 50, height);
                    
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`${i}`, x + 20, 170);
                }
                
                iteration++;
                setTimeout(() => requestAnimationFrame(animate), 500);
            }
        };
        animate();
    }

    shorFactoring(ctx, canvas) {
        // Simplified Shor's algorithm visualization
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '16px JetBrains Mono';
        ctx.fillText('Factoring N = 15', 150, 50);
        
        // Show quantum period finding
        let step = 0;
        const animate = () => {
            if (step < 8) {
                const x = 50 + step * 40;
                const period = Math.sin(step * Math.PI / 4);
                
                ctx.fillStyle = '#feca57';
                ctx.fillRect(x, 100, 30, Math.abs(period) * 50);
                
                step++;
                setTimeout(() => requestAnimationFrame(animate), 300);
            } else {
                ctx.fillStyle = '#96ceb4';
                ctx.fillText('Factors: 3 × 5 = 15', 120, 200);
            }
        };
        animate();
    }

    deutschJozsa(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Single query determines if function is constant or balanced
        ctx.fillStyle = '#fff';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText('Deutsch-Jozsa Algorithm', 100, 30);
        
        // Quantum superposition
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(50, 60, 300, 20);
        
        setTimeout(() => {
            const result = Math.random() > 0.5 ? 'Constant' : 'Balanced';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`Function is: ${result}`, 120, 150);
        }, 1000);
    }

    quantumTeleportation(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Show quantum state teleportation
        let frame = 0;
        const animate = () => {
            if (frame < 60) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Alice's qubit
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(50, 100, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Entangled pair
                const progress = frame / 60;
                const entX = 50 + progress * 200;
                
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(50, 100);
                ctx.lineTo(entX, 100);
                ctx.lineTo(350, 100);
                ctx.stroke();
                
                // Bob's qubit (receives state)
                if (frame > 40) {
                    ctx.fillStyle = '#ff6b6b';
                    ctx.beginPath();
                    ctx.arc(350, 100, 10, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#fff';
                    ctx.fillText('State Teleported!', 250, 150);
                }
                
                frame++;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    handleResize() {
        this.entanglementCanvas.width = window.innerWidth;
        this.entanglementCanvas.height = window.innerHeight;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update performance metrics
        this.performance.frameCount++;
        const now = performance.now();
        const delta = now - this.performance.startTime;
        
        if (delta >= 1000) {
            this.performance.fps = Math.round((this.performance.frameCount * 1000) / delta);
            this.performance.frameCount = 0;
            this.performance.startTime = now;
        }
        
        if (this.quantumFieldActive) {
            this.drawQuantumField();
            this.drawEntanglementConnections();
            this.updateQuantumMetrics();
        }
    }

    updateQuantumMetrics() {
        // Update quantum performance metrics
        const coherence = this.calculateQuantumCoherence();
        const fidelity = this.calculateQuantumFidelity();
        const gateErrors = this.calculateGateErrors();
        
        document.getElementById('coherenceMetric').textContent = coherence.toFixed(1) + '%';
        document.getElementById('fidelityMetric').textContent = fidelity.toFixed(1) + '%';
        document.getElementById('gateErrorMetric').textContent = gateErrors.toFixed(1) + '%';
    }

    calculateQuantumCoherence() {
        const avgAmplitude = this.quantumParticles.reduce((sum, p) => sum + p.amplitude, 0) / this.quantumParticles.length;
        return Math.min(100, avgAmplitude * 150);
    }

    calculateQuantumFidelity() {
        const superposedCount = this.quantumParticles.filter(p => p.superposition).length;
        return (superposedCount / this.quantumParticles.length) * 100;
    }

    calculateGateErrors() {
        return Math.max(0.1, (this.decoherenceRate / 100) * 2);
    }
}

// Initialize Quantum Interface
document.addEventListener('DOMContentLoaded', () => {
    window.quantumInterface = new QuantumInterface();
    
    // Performance measurement
    if ('performance' in window && 'measure' in window.performance) {
        performance.mark('quantum-interface-ready');
        performance.measure('quantum-interface-load-time', 'navigationStart', 'quantum-interface-ready');
    }
});

// Export metrics for core services
window.getMetrics = () => {
    const qi = window.quantumInterface;
    if (!qi) return {};
    
    return {
        fps: qi.performance.fps,
        quantum_operations: qi.performance.quantumOperations,
        superposed_particles: qi.quantumParticles ? qi.quantumParticles.filter(p => p.superposition).length : 0,
        entangled_pairs: qi.entangledPairs.length,
        coherence_time: qi.coherenceTime,
        performance_score: Math.min(100, qi.performance.fps * 1.67)
    };
};