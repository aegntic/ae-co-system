/**
 * Aegntic Concept Portfolio - 3x3 Comparison Grid Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class ConceptPortfolio {
    constructor() {
        this.concepts = [
            {
                id: 'neural-nexus',
                name: 'Neural Nexus',
                description: 'Interactive 3D brain network visualization',
                status: 'active',
                performance: 98.2,
                innovation: 9.8,
                url: '../concept-generators/neural-nexus/index.html'
            },
            {
                id: 'quantum-interface',
                name: 'Quantum Interface',
                description: 'Particle physics inspired morphing UI',
                status: 'active',
                performance: 96.7,
                innovation: 9.9,
                url: '../concept-generators/quantum-interface/index.html'
            },
            {
                id: 'digital-evolution',
                name: 'Digital Evolution',
                description: 'Evolutionary algorithm visualizer',
                status: 'active',
                performance: 94.1,
                innovation: 9.6,
                url: '../concept-generators/digital-evolution/index.html'
            },
            {
                id: 'consciousness-stream',
                name: 'Consciousness Stream',
                description: 'Flowing data consciousness metaphor',
                status: 'active',
                performance: 93.8,
                innovation: 9.7,
                url: '../concept-generators/consciousness-stream/index.html'
            },
            {
                id: 'matrix-architect',
                name: 'Matrix Architect',
                description: 'Code-matrix reality builder interface',
                status: 'active',
                performance: 96.4,
                innovation: 9.8,
                url: '../concept-generators/matrix-architect/index.html'
            },
            {
                id: 'synthetic-dreams',
                name: 'Synthetic Dreams',
                description: 'Surreal AI dream sequence interface',
                status: 'active',
                performance: 92.5,
                innovation: 9.9,
                url: '../concept-generators/synthetic-dreams/index.html'
            },
            {
                id: 'intelligence-singularity',
                name: 'Intelligence Singularity',
                description: 'Converging AI capabilities visualization',
                status: 'active',
                performance: 97.9,
                innovation: 10.0,
                url: '../concept-generators/intelligence-singularity/index.html'
            },
            {
                id: 'computational-poetry',
                name: 'Computational Poetry',
                description: 'AI as artistic expression platform',
                status: 'active',
                performance: 91.6,
                innovation: 9.5,
                url: '../concept-generators/computational-poetry/index.html'
            },
            {
                id: 'future-mirror',
                name: 'Future Mirror',
                description: 'Predictive reality reflection interface',
                status: 'active',
                performance: 95.7,
                innovation: 9.8,
                url: '../concept-generators/future-mirror/index.html'
            }
        ];
        
        this.annotations = new Map();
        this.currentAnnotationConcept = null;
        this.comparedConcepts = [];
        this.annotationsVisible = false;
        
        this.performance = {
            startTime: performance.now(),
            frameCount: 0,
            fps: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializePreviewCanvases();
        this.startPerformanceMonitoring();
        this.loadAnnotations();
        this.updatePortfolioStats();
    }

    setupEventListeners() {
        // Concept preview click handlers
        document.querySelectorAll('.concept-preview').forEach(preview => {
            preview.addEventListener('click', (e) => {
                const conceptCell = e.target.closest('.concept-cell');
                const conceptId = conceptCell.dataset.concept;
                this.openConceptInNewTab(conceptId);
            });
        });

        // Navigation controls
        document.getElementById('toggleAnnotations').addEventListener('click', () => {
            this.toggleAnnotations();
        });
        
        document.getElementById('compareMode').addEventListener('click', () => {
            this.enterCompareMode();
        });
        
        document.getElementById('fullscreenMode').addEventListener('click', () => {
            this.toggleFullscreenMode();
        });
        
        document.getElementById('exportReport').addEventListener('click', () => {
            this.exportReport();
        });
        
        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            if (e.key === 'a' && e.ctrlKey) {
                e.preventDefault();
                this.toggleAnnotations();
            }
            if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                this.enterCompareMode();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    initializePreviewCanvases() {
        // Initialize preview canvases for concepts that don't have full implementations
        this.initEvolutionPreview();
        this.initConsciousnessPreview();
        this.initMatrixPreview();
        this.initDreamsPreview();
        this.initSingularityPreview();
        this.initPoetryPreview();
        this.initFuturePreview();
    }

    initEvolutionPreview() {
        const canvas = document.getElementById('evolutionPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let generation = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw evolutionary organisms
            const organisms = 20;
            for (let i = 0; i < organisms; i++) {
                const fitness = Math.sin(generation * 0.1 + i * 0.5) * 0.5 + 0.5;
                const x = (i / organisms) * canvas.width;
                const y = canvas.height / 2;
                const size = 5 + fitness * 10;
                
                // Color based on fitness
                const red = Math.floor((1 - fitness) * 255);
                const green = Math.floor(fitness * 255);
                
                ctx.fillStyle = `rgb(${red}, ${green}, 100)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Mutation lines
                if (i > 0) {
                    ctx.strokeStyle = 'rgba(150, 206, 180, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x - canvas.width / organisms, y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
            
            // Generation counter
            ctx.fillStyle = '#96ceb4';
            ctx.font = '14px JetBrains Mono';
            ctx.fillText(`Generation: ${Math.floor(generation)}`, 10, 25);
            
            generation += 0.2;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    initConsciousnessPreview() {
        const canvas = document.getElementById('consciousnessPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const particles = [];
        
        // Initialize consciousness particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                consciousness: Math.random(),
                thought: Math.random() * Math.PI * 2
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach((particle, i) => {
                // Update consciousness
                particle.consciousness += (Math.random() - 0.5) * 0.1;
                particle.consciousness = Math.max(0, Math.min(1, particle.consciousness));
                
                // Thought flow
                particle.thought += 0.05;
                particle.x += particle.vx + Math.sin(particle.thought) * 0.5;
                particle.y += particle.vy + Math.cos(particle.thought) * 0.5;
                
                // Boundary wrapping
                particle.x = (particle.x + canvas.width) % canvas.width;
                particle.y = (particle.y + canvas.height) % canvas.height;
                
                // Draw consciousness particle
                const alpha = particle.consciousness;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#a8e6cf';
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2 + particle.consciousness * 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw thought connections
                particles.forEach((other, j) => {
                    if (i !== j) {
                        const dx = particle.x - other.x;
                        const dy = particle.y - other.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 80) {
                            ctx.globalAlpha = (1 - distance / 80) * 0.3;
                            ctx.strokeStyle = '#98d8c8';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(particle.x, particle.y);
                            ctx.lineTo(other.x, other.y);
                            ctx.stroke();
                        }
                    }
                });
            });
            
            ctx.globalAlpha = 1;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    initMatrixPreview() {
        const canvas = document.getElementById('matrixPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const characters = '01';
        const columns = Math.floor(canvas.width / 20);
        const drops = new Array(columns).fill(0);
        
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = '16px JetBrains Mono';
            
            drops.forEach((drop, i) => {
                const char = characters[Math.floor(Math.random() * characters.length)];
                const x = i * 20;
                const y = drop * 20;
                
                ctx.fillText(char, x, y);
                
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            });
            
            setTimeout(() => requestAnimationFrame(animate), 100);
        };
        
        animate();
    }

    initDreamsPreview() {
        const canvas = document.getElementById('dreamsPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Dream-like morphing shapes
            for (let i = 0; i < 5; i++) {
                const x = canvas.width / 2 + Math.sin(time + i) * 50;
                const y = canvas.height / 2 + Math.cos(time + i * 1.3) * 30;
                const radius = 20 + Math.sin(time * 2 + i) * 15;
                
                const hue = (time * 50 + i * 60) % 360;
                ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.6)`;
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Dream distortion
                ctx.filter = `blur(${Math.sin(time) * 2 + 2}px)`;
            }
            
            ctx.filter = 'none';
            time += 0.05;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    initSingularityPreview() {
        const canvas = document.getElementById('singularityPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const capabilities = [
            { name: 'Vision', angle: 0, distance: 80 },
            { name: 'Language', angle: Math.PI * 2 / 5, distance: 80 },
            { name: 'Reasoning', angle: Math.PI * 4 / 5, distance: 80 },
            { name: 'Creativity', angle: Math.PI * 6 / 5, distance: 80 },
            { name: 'Learning', angle: Math.PI * 8 / 5, distance: 80 }
        ];
        
        let convergence = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Draw converging capabilities
            capabilities.forEach((cap, i) => {
                const currentDistance = cap.distance * (1 - convergence * 0.8);
                const x = centerX + Math.cos(cap.angle) * currentDistance;
                const y = centerY + Math.sin(cap.angle) * currentDistance;
                
                // Capability node
                ctx.fillStyle = '#6c5ce7';
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Connection to center
                ctx.strokeStyle = `rgba(108, 92, 231, ${convergence})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(centerX, centerY);
                ctx.stroke();
                
                // Capability label
                ctx.fillStyle = '#a29bfe';
                ctx.font = '10px JetBrains Mono';
                ctx.fillText(cap.name, x - 15, y - 15);
            });
            
            // Central singularity
            const singularitySize = 5 + convergence * 15;
            ctx.fillStyle = '#fd79a8';
            ctx.beginPath();
            ctx.arc(centerX, centerY, singularitySize, 0, Math.PI * 2);
            ctx.fill();
            
            convergence = (Math.sin(Date.now() * 0.001) + 1) / 2;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    initPoetryPreview() {
        const canvas = document.getElementById('poetryPreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const words = ['beauty', 'algorithm', 'dreams', 'neural', 'poetry', 'artificial', 'soul'];
        let wordIndex = 0;
        let fadeOpacity = 1;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Poetic word generation
            const currentWord = words[Math.floor(wordIndex / 60) % words.length];
            
            ctx.globalAlpha = fadeOpacity;
            ctx.fillStyle = '#fab1a0';
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.fillText(currentWord, canvas.width / 2, canvas.height / 2);
            
            // Rhythmic animation
            const rhythm = Math.sin(wordIndex * 0.1);
            ctx.font = `${16 + rhythm * 4}px serif`;
            ctx.fillStyle = '#ff7675';
            ctx.fillText('computational', canvas.width / 2, canvas.height / 2 + 40);
            
            fadeOpacity = Math.abs(Math.sin(wordIndex * 0.05));
            wordIndex++;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    initFuturePreview() {
        const canvas = document.getElementById('futurePreview');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        let scanLine = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Future prediction grid
            ctx.strokeStyle = 'rgba(0, 184, 148, 0.3)';
            ctx.lineWidth = 1;
            
            for (let x = 0; x < canvas.width; x += 20) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            // Prediction scan line
            ctx.strokeStyle = '#00b894';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, scanLine);
            ctx.lineTo(canvas.width, scanLine);
            ctx.stroke();
            
            // Future probability clouds
            for (let i = 0; i < 5; i++) {
                const x = (i / 5) * canvas.width + 10;
                const y = scanLine + Math.sin(Date.now() * 0.001 + i) * 20;
                const probability = Math.random();
                
                ctx.globalAlpha = probability;
                ctx.fillStyle = '#81ecec';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
            scanLine = (scanLine + 2) % canvas.height;
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    toggleAnnotations() {
        this.annotationsVisible = !this.annotationsVisible;
        const button = document.getElementById('toggleAnnotations');
        
        if (this.annotationsVisible) {
            button.classList.add('active');
            button.style.background = 'var(--gradient-neural)';
            button.style.color = 'white';
            document.body.classList.add('annotations-mode');
        } else {
            button.classList.remove('active');
            button.style.background = '';
            button.style.color = '';
            document.body.classList.remove('annotations-mode');
            
            // Close all annotation panels
            document.querySelectorAll('.concept-cell').forEach(cell => {
                cell.classList.remove('annotations-open');
            });
        }
    }

    enterCompareMode() {
        if (this.comparedConcepts.length < 2) {
            alert('Please select at least 2 concepts to compare by clicking the compare button on concept cards.');
            return;
        }
        
        this.showComparisonModal();
    }

    showComparisonModal() {
        const modal = document.getElementById('comparisonModal');
        const interface = document.getElementById('comparisonInterface');
        
        // Generate comparison interface
        interface.innerHTML = this.generateComparisonInterface();
        
        modal.classList.add('active');
    }

    generateComparisonInterface() {
        if (this.comparedConcepts.length < 2) return '';
        
        const concept1 = this.concepts.find(c => c.id === this.comparedConcepts[0]);
        const concept2 = this.concepts.find(c => c.id === this.comparedConcepts[1]);
        
        return `
            <div class="comparison-panel">
                <div class="comparison-header">
                    <h4>${concept1.name}</h4>
                </div>
                <div class="comparison-content">
                    ${concept1.url ? 
                        `<iframe src="${concept1.url}" class="comparison-frame"></iframe>` :
                        `<div class="comparison-placeholder">
                            <h3>${concept1.name}</h3>
                            <p>${concept1.description}</p>
                            <div class="comparison-metrics">
                                <div>Performance: ${concept1.performance}/100</div>
                                <div>Innovation: ${concept1.innovation}/10</div>
                            </div>
                        </div>`
                    }
                </div>
            </div>
            <div class="comparison-panel">
                <div class="comparison-header">
                    <h4>${concept2.name}</h4>
                </div>
                <div class="comparison-content">
                    ${concept2.url ? 
                        `<iframe src="${concept2.url}" class="comparison-frame"></iframe>` :
                        `<div class="comparison-placeholder">
                            <h3>${concept2.name}</h3>
                            <p>${concept2.description}</p>
                            <div class="comparison-metrics">
                                <div>Performance: ${concept2.performance}/100</div>
                                <div>Innovation: ${concept2.innovation}/10</div>
                            </div>
                        </div>`
                    }
                </div>
            </div>
        `;
    }

    toggleFullscreenMode() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    exportReport() {
        const report = this.generateReport();
        this.downloadReport(report);
    }

    generateReport() {
        const avgPerformance = this.concepts.reduce((sum, c) => sum + c.performance, 0) / this.concepts.length;
        const avgInnovation = this.concepts.reduce((sum, c) => sum + c.innovation, 0) / this.concepts.length;
        const totalAnnotations = Array.from(this.annotations.values()).reduce((sum, arr) => sum + arr.length, 0);
        
        const report = {
            title: 'Aegntic Concept Portfolio Analysis Report',
            generated: new Date().toISOString(),
            summary: {
                totalConcepts: this.concepts.length,
                averagePerformance: avgPerformance.toFixed(1),
                averageInnovation: avgInnovation.toFixed(1),
                totalAnnotations: totalAnnotations
            },
            concepts: this.concepts.map(concept => ({
                ...concept,
                annotations: this.annotations.get(concept.id) || []
            })),
            credits: {
                creator: 'Mattae Cooper <human@mattaecooper.org>',
                powered_by: "'{ae}'aegntic.ai <contact@aegntic.ai>"
            }
        };
        
        return report;
    }

    downloadReport(report) {
        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `aegntic-concept-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    startPerformanceMonitoring() {
        const updatePerformance = () => {
            this.performance.frameCount++;
            const now = performance.now();
            const delta = now - this.performance.startTime;
            
            if (delta >= 1000) {
                this.performance.fps = Math.round((this.performance.frameCount * 1000) / delta);
                this.performance.frameCount = 0;
                this.performance.startTime = now;
                
                this.updatePerformanceIndicator();
            }
            
            requestAnimationFrame(updatePerformance);
        };
        
        updatePerformance();
    }

    updatePerformanceIndicator() {
        let indicator = document.querySelector('.performance-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'performance-indicator';
            document.body.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            FPS: ${this.performance.fps}<br>
            Concepts: ${this.concepts.length}<br>
            Annotations: ${Array.from(this.annotations.values()).reduce((sum, arr) => sum + arr.length, 0)}
        `;
    }

    loadAnnotations() {
        // Load annotations from localStorage
        const stored = localStorage.getItem('aegntic-concept-annotations');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.annotations = new Map(data);
            } catch (e) {
                console.warn('Failed to load annotations:', e);
            }
        }
    }

    saveAnnotations() {
        // Save annotations to localStorage
        const data = Array.from(this.annotations.entries());
        localStorage.setItem('aegntic-concept-annotations', JSON.stringify(data));
    }

    openConceptInNewTab(conceptId) {
        const concept = this.concepts.find(c => c.id === conceptId);
        if (concept && concept.url) {
            window.open(concept.url, '_blank');
        } else {
            // For concepts without full implementations, open the preview
            window.open(`concept-generators/${conceptId}/index.html`, '_blank');
        }
    }

    updatePortfolioStats() {
        const avgPerformance = this.concepts.reduce((sum, c) => sum + c.performance, 0) / this.concepts.length;
        const avgInnovation = this.concepts.reduce((sum, c) => sum + c.innovation, 0) / this.concepts.length;
        const totalAnnotations = Array.from(this.annotations.values()).reduce((sum, arr) => sum + arr.length, 0);
        
        document.getElementById('totalConcepts').textContent = this.concepts.length;
        document.getElementById('avgPerformance').textContent = avgPerformance.toFixed(1);
        document.getElementById('totalAnnotations').textContent = totalAnnotations;
        document.getElementById('innovationScore').textContent = avgInnovation.toFixed(1);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    handleResize() {
        // Handle responsive layout changes
        const grid = document.getElementById('conceptGrid');
        const width = window.innerWidth;
        
        if (width <= 768) {
            grid.style.gridTemplateColumns = '1fr';
        } else if (width <= 1024) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }
}

// Global functions for HTML onclick handlers
window.openFullscreen = (conceptId) => {
    const concept = portfolio.concepts.find(c => c.id === conceptId);
    if (!concept || !concept.url) {
        alert('This concept is not yet available for fullscreen viewing.');
        return;
    }
    
    const modal = document.getElementById('fullscreenModal');
    const frame = document.getElementById('fullscreenFrame');
    const title = document.getElementById('fullscreenTitle');
    
    title.textContent = concept.name;
    frame.src = concept.url;
    modal.classList.add('active');
};

window.addAnnotation = (conceptId) => {
    portfolio.currentAnnotationConcept = conceptId;
    const modal = document.getElementById('annotationModal');
    modal.classList.add('active');
    
    // Clear form
    document.getElementById('annotationType').value = 'positive';
    document.getElementById('annotationText').value = '';
};

window.compareConcept = (conceptId) => {
    if (!portfolio.comparedConcepts.includes(conceptId)) {
        portfolio.comparedConcepts.push(conceptId);
        
        // Visual feedback
        const cell = document.querySelector(`[data-concept="${conceptId}"]`);
        cell.style.borderColor = '#f59e0b';
        cell.style.borderWidth = '2px';
        
        if (portfolio.comparedConcepts.length > 2) {
            // Remove oldest comparison
            const removed = portfolio.comparedConcepts.shift();
            const removedCell = document.querySelector(`[data-concept="${removed}"]`);
            removedCell.style.borderColor = '';
            removedCell.style.borderWidth = '';
        }
    }
};

window.saveAnnotation = () => {
    const conceptId = portfolio.currentAnnotationConcept;
    const type = document.getElementById('annotationType').value;
    const text = document.getElementById('annotationText').value.trim();
    
    if (!text) {
        alert('Please enter annotation text.');
        return;
    }
    
    const annotation = {
        id: Date.now().toString(),
        type: type,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    if (!portfolio.annotations.has(conceptId)) {
        portfolio.annotations.set(conceptId, []);
    }
    
    portfolio.annotations.get(conceptId).push(annotation);
    portfolio.saveAnnotations();
    portfolio.updatePortfolioStats();
    
    // Update annotations panel
    portfolio.updateAnnotationsPanel(conceptId);
    
    portfolio.closeAllModals();
};

window.closeAnnotationModal = () => {
    document.getElementById('annotationModal').classList.remove('active');
};

window.closeComparisonModal = () => {
    document.getElementById('comparisonModal').classList.remove('active');
};

window.closeFullscreenModal = () => {
    document.getElementById('fullscreenModal').classList.remove('active');
    document.getElementById('fullscreenFrame').src = '';
};

// Initialize portfolio
let portfolio;

document.addEventListener('DOMContentLoaded', () => {
    portfolio = new ConceptPortfolio();
    
    // Performance measurement
    if ('performance' in window && 'measure' in window.performance) {
        performance.mark('portfolio-ready');
        performance.measure('portfolio-load-time', 'navigationStart', 'portfolio-ready');
    }
});

// Export metrics for core services
window.getMetrics = () => {
    if (!portfolio) return {};
    
    return {
        fps: portfolio.performance.fps,
        concepts_loaded: portfolio.concepts.length,
        active_concepts: portfolio.concepts.filter(c => c.status === 'active').length,
        total_annotations: Array.from(portfolio.annotations.values()).reduce((sum, arr) => sum + arr.length, 0),
        average_performance: (portfolio.concepts.reduce((sum, c) => sum + c.performance, 0) / portfolio.concepts.length).toFixed(1),
        average_innovation: (portfolio.concepts.reduce((sum, c) => sum + c.innovation, 0) / portfolio.concepts.length).toFixed(1),
        performance_score: Math.min(100, portfolio.performance.fps * 1.67)
    };
};