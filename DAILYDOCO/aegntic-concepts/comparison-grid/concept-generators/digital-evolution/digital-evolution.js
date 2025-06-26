/**
 * Digital Evolution - Evolutionary Algorithm Visualizer
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class DigitalEvolution {
    constructor() {
        this.canvas = document.getElementById('evolutionCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.landscapeCanvas = document.getElementById('landscapeCanvas');
        this.landscapeCtx = this.landscapeCanvas.getContext('2d');
        
        this.population = [];
        this.generation = 0;
        this.isRunning = false;
        this.animationFrame = null;
        
        this.parameters = {
            populationSize: 50,
            mutationRate: 0.05,
            selectionPressure: 3
        };
        
        this.fitnessHistory = [];
        this.diversityHistory = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.initializePopulation();
        this.render();
    }
    
    setupEventListeners() {
        // Evolution controls
        document.getElementById('startEvolution').addEventListener('click', () => this.startEvolution());
        document.getElementById('pauseEvolution').addEventListener('click', () => this.pauseEvolution());
        document.getElementById('resetEvolution').addEventListener('click', () => this.resetEvolution());
        
        // Parameter controls
        document.getElementById('populationSize').addEventListener('input', (e) => {
            this.parameters.populationSize = parseInt(e.target.value);
            document.getElementById('popValue').textContent = e.target.value;
        });
        
        document.getElementById('mutationRate').addEventListener('input', (e) => {
            this.parameters.mutationRate = parseInt(e.target.value) / 100;
            document.getElementById('mutValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('selectionPressure').addEventListener('input', (e) => {
            this.parameters.selectionPressure = parseInt(e.target.value);
            document.getElementById('selValue').textContent = e.target.value;
        });
    }
    
    initializePreloader() {
        let generation = 0;
        let fitnessLevel = 0;
        
        const updatePreloader = () => {
            const genCounter = document.getElementById('genCounter');
            const fitnessLevelEl = document.getElementById('fitnessLevel');
            
            if (genCounter && fitnessLevelEl) {
                genCounter.textContent = generation;
                fitnessLevelEl.textContent = fitnessLevel + '%';
                
                // Show evolution stages
                const stages = document.querySelectorAll('.evolving-text > div');
                const currentStage = Math.floor(generation / 25);
                
                stages.forEach((stage, index) => {
                    stage.classList.toggle('active', index === currentStage);
                });
                
                generation++;
                fitnessLevel = Math.min(100, fitnessLevel + Math.random() * 5);
                
                if (generation < 100) {
                    setTimeout(updatePreloader, 100);
                } else {
                    this.hidePreloader();
                }
            }
        };
        
        updatePreloader();
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
    
    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.parameters.populationSize; i++) {
            this.population.push(this.createOrganism());
        }
        this.generation = 0;
        this.fitnessHistory = [];
        this.diversityHistory = [];
    }
    
    createOrganism() {
        return {
            genes: Array.from({length: 10}, () => Math.random()),
            fitness: 0,
            age: 0,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 8 + Math.random() * 12,
            color: {
                r: Math.floor(Math.random() * 255),
                g: Math.floor(Math.random() * 255),
                b: Math.floor(Math.random() * 255)
            }
        };
    }
    
    calculateFitness(organism) {
        // Complex fitness function based on multiple criteria
        let fitness = 0;
        
        // Gene diversity bonus
        const geneVariance = this.calculateVariance(organism.genes);
        fitness += geneVariance * 50;
        
        // Age bonus (survival)
        fitness += organism.age * 0.1;
        
        // Color harmony (aesthetic fitness)
        const colorHarmony = this.calculateColorHarmony(organism.color);
        fitness += colorHarmony * 20;
        
        // Position optimization (spatial fitness)
        const spatialFitness = this.calculateSpatialFitness(organism.x, organism.y);
        fitness += spatialFitness * 30;
        
        return Math.max(0, fitness);
    }
    
    calculateVariance(array) {
        const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
        const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
        return variance;
    }
    
    calculateColorHarmony(color) {
        // Simple color harmony based on RGB balance
        const total = color.r + color.g + color.b;
        const balance = 1 - Math.abs(0.33 - (color.r / total)) - Math.abs(0.33 - (color.g / total)) - Math.abs(0.33 - (color.b / total));
        return Math.max(0, balance);
    }
    
    calculateSpatialFitness(x, y) {
        // Fitness based on position - center area has higher fitness
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
        return 1 - (distance / maxDistance);
    }
    
    evolveGeneration() {
        // Calculate fitness for all organisms
        this.population.forEach(organism => {
            organism.fitness = this.calculateFitness(organism);
            organism.age++;
        });
        
        // Sort by fitness
        this.population.sort((a, b) => b.fitness - a.fitness);
        
        // Selection and reproduction
        const newPopulation = [];
        const eliteSize = Math.floor(this.parameters.populationSize * 0.1);
        
        // Keep elite organisms
        for (let i = 0; i < eliteSize; i++) {
            newPopulation.push({...this.population[i]});
        }
        
        // Create offspring through crossover and mutation
        while (newPopulation.length < this.parameters.populationSize) {
            const parent1 = this.selectParent();
            const parent2 = this.selectParent();
            const offspring = this.crossover(parent1, parent2);
            this.mutate(offspring);
            newPopulation.push(offspring);
        }
        
        this.population = newPopulation;
        this.generation++;
        
        // Update statistics
        this.updateStatistics();
        this.updateFitnessLandscape();
    }
    
    selectParent() {
        // Tournament selection
        const tournamentSize = this.parameters.selectionPressure;
        let best = this.population[Math.floor(Math.random() * this.population.length)];
        
        for (let i = 1; i < tournamentSize; i++) {
            const candidate = this.population[Math.floor(Math.random() * this.population.length)];
            if (candidate.fitness > best.fitness) {
                best = candidate;
            }
        }
        
        return best;
    }
    
    crossover(parent1, parent2) {
        const offspring = this.createOrganism();
        
        // Gene crossover
        for (let i = 0; i < offspring.genes.length; i++) {
            offspring.genes[i] = Math.random() < 0.5 ? parent1.genes[i] : parent2.genes[i];
        }
        
        // Color blending
        offspring.color = {
            r: Math.floor((parent1.color.r + parent2.color.r) / 2),
            g: Math.floor((parent1.color.g + parent2.color.g) / 2),
            b: Math.floor((parent1.color.b + parent2.color.b) / 2)
        };
        
        // Position inheritance with variation
        offspring.x = (parent1.x + parent2.x) / 2 + (Math.random() - 0.5) * 50;
        offspring.y = (parent1.y + parent2.y) / 2 + (Math.random() - 0.5) * 50;
        
        // Keep within bounds
        offspring.x = Math.max(0, Math.min(this.canvas.width, offspring.x));
        offspring.y = Math.max(0, Math.min(this.canvas.height, offspring.y));
        
        return offspring;
    }
    
    mutate(organism) {
        // Gene mutation
        for (let i = 0; i < organism.genes.length; i++) {
            if (Math.random() < this.parameters.mutationRate) {
                organism.genes[i] += (Math.random() - 0.5) * 0.2;
                organism.genes[i] = Math.max(0, Math.min(1, organism.genes[i]));
            }
        }
        
        // Color mutation
        if (Math.random() < this.parameters.mutationRate) {
            organism.color.r = Math.max(0, Math.min(255, organism.color.r + (Math.random() - 0.5) * 40));
            organism.color.g = Math.max(0, Math.min(255, organism.color.g + (Math.random() - 0.5) * 40));
            organism.color.b = Math.max(0, Math.min(255, organism.color.b + (Math.random() - 0.5) * 40));
        }
        
        // Position mutation
        if (Math.random() < this.parameters.mutationRate) {
            organism.x += (Math.random() - 0.5) * 30;
            organism.y += (Math.random() - 0.5) * 30;
            organism.x = Math.max(0, Math.min(this.canvas.width, organism.x));
            organism.y = Math.max(0, Math.min(this.canvas.height, organism.y));
        }
    }
    
    updateStatistics() {
        const fitnesses = this.population.map(org => org.fitness);
        const bestFitness = Math.max(...fitnesses);
        const avgFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
        const diversity = this.calculateDiversity();
        
        // Update UI
        document.getElementById('currentGeneration').textContent = this.generation;
        document.getElementById('bestFitness').textContent = bestFitness.toFixed(1);
        document.getElementById('avgFitness').textContent = avgFitness.toFixed(1);
        document.getElementById('diversity').textContent = diversity.toFixed(2);
        
        // Store history for graphing
        this.fitnessHistory.push({generation: this.generation, best: bestFitness, avg: avgFitness});
        this.diversityHistory.push(diversity);
        
        // Keep only last 50 generations
        if (this.fitnessHistory.length > 50) {
            this.fitnessHistory.shift();
            this.diversityHistory.shift();
        }
    }
    
    calculateDiversity() {
        if (this.population.length < 2) return 0;
        
        let totalDistance = 0;
        let comparisons = 0;
        
        for (let i = 0; i < this.population.length; i++) {
            for (let j = i + 1; j < this.population.length; j++) {
                const distance = this.calculateGeneticDistance(this.population[i], this.population[j]);
                totalDistance += distance;
                comparisons++;
            }
        }
        
        return comparisons > 0 ? totalDistance / comparisons : 0;
    }
    
    calculateGeneticDistance(org1, org2) {
        let distance = 0;
        for (let i = 0; i < org1.genes.length; i++) {
            distance += Math.abs(org1.genes[i] - org2.genes[i]);
        }
        return distance / org1.genes.length;
    }
    
    updateFitnessLandscape() {
        if (!this.landscapeCtx) return;
        
        const width = this.landscapeCanvas.width;
        const height = this.landscapeCanvas.height;
        
        this.landscapeCtx.clearRect(0, 0, width, height);
        
        // Draw fitness history graph
        if (this.fitnessHistory.length > 1) {
            const maxFitness = Math.max(...this.fitnessHistory.map(h => h.best));
            const minFitness = Math.min(...this.fitnessHistory.map(h => h.avg));
            const range = maxFitness - minFitness || 1;
            
            // Best fitness line
            this.landscapeCtx.strokeStyle = '#96ceb4';
            this.landscapeCtx.lineWidth = 2;
            this.landscapeCtx.beginPath();
            
            this.fitnessHistory.forEach((point, index) => {
                const x = (index / (this.fitnessHistory.length - 1)) * width;
                const y = height - ((point.best - minFitness) / range) * height;
                
                if (index === 0) {
                    this.landscapeCtx.moveTo(x, y);
                } else {
                    this.landscapeCtx.lineTo(x, y);
                }
            });
            
            this.landscapeCtx.stroke();
            
            // Average fitness line
            this.landscapeCtx.strokeStyle = '#22c55e';
            this.landscapeCtx.lineWidth = 1;
            this.landscapeCtx.beginPath();
            
            this.fitnessHistory.forEach((point, index) => {
                const x = (index / (this.fitnessHistory.length - 1)) * width;
                const y = height - ((point.avg - minFitness) / range) * height;
                
                if (index === 0) {
                    this.landscapeCtx.moveTo(x, y);
                } else {
                    this.landscapeCtx.lineTo(x, y);
                }
            });
            
            this.landscapeCtx.stroke();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw organisms
        this.population.forEach((organism, index) => {
            this.drawOrganism(organism, index);
        });
        
        // Draw connections between similar organisms
        this.drawConnections();
        
        if (this.isRunning) {
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(150, 206, 180, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawOrganism(organism, index) {
        const fitnessNormalized = Math.min(1, organism.fitness / 100);
        
        // Organism body
        this.ctx.fillStyle = `rgba(${organism.color.r}, ${organism.color.g}, ${organism.color.b}, ${0.7 + fitnessNormalized * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(organism.x, organism.y, organism.size * (0.5 + fitnessNormalized * 0.5), 0, Math.PI * 2);
        this.ctx.fill();
        
        // Fitness glow
        if (fitnessNormalized > 0.7) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#96ceb4';
            this.ctx.fillStyle = 'rgba(150, 206, 180, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(organism.x, organism.y, organism.size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Gene visualization
        this.drawGenes(organism);
        
        // Fitness indicator
        this.ctx.fillStyle = '#96ceb4';
        this.ctx.font = '10px JetBrains Mono';
        this.ctx.fillText(organism.fitness.toFixed(1), organism.x - 15, organism.y + organism.size + 15);
    }
    
    drawGenes(organism) {
        const radius = organism.size + 5;
        const angleStep = (Math.PI * 2) / organism.genes.length;
        
        organism.genes.forEach((gene, index) => {
            const angle = index * angleStep;
            const geneX = organism.x + Math.cos(angle) * radius;
            const geneY = organism.y + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = `rgba(150, 206, 180, ${gene})`;
            this.ctx.beginPath();
            this.ctx.arc(geneX, geneY, 2 + gene * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawConnections() {
        this.population.forEach((org1, i) => {
            this.population.slice(i + 1).forEach(org2 => {
                const distance = Math.sqrt(Math.pow(org1.x - org2.x, 2) + Math.pow(org1.y - org2.y, 2));
                const geneticSimilarity = 1 - this.calculateGeneticDistance(org1, org2);
                
                if (distance < 80 && geneticSimilarity > 0.7) {
                    this.ctx.strokeStyle = `rgba(150, 206, 180, ${(geneticSimilarity - 0.7) * 3 * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(org1.x, org1.y);
                    this.ctx.lineTo(org2.x, org2.y);
                    this.ctx.stroke();
                }
            });
        });
    }
    
    startEvolution() {
        this.isRunning = true;
        document.getElementById('startEvolution').textContent = 'Running...';
        this.evolutionLoop();
        this.render();
    }
    
    pauseEvolution() {
        this.isRunning = false;
        document.getElementById('startEvolution').textContent = 'Start Evolution';
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    resetEvolution() {
        this.pauseEvolution();
        this.initializePopulation();
        this.render();
        this.updateStatistics();
        this.updateFitnessLandscape();
    }
    
    evolutionLoop() {
        if (this.isRunning) {
            this.evolveGeneration();
            setTimeout(() => this.evolutionLoop(), 500); // Evolve every 500ms
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.digitalEvolution = new DigitalEvolution();
});