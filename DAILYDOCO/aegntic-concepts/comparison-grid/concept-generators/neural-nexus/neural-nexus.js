/**
 * Neural Nexus - Revolutionary 3D Brain Network Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

// Performance monitoring
const performance_metrics = {
    start_time: performance.now(),
    frame_count: 0,
    fps: 0,
    neural_computations: 0
};

// Neural Network Core
class NeuralNexus {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.neurons = [];
        this.connections = [];
        this.isActive = false;
        this.learningRate = 0.01;
        this.networkDepth = 5;
        this.activationFunction = 'relu';
        
        this.init();
        this.setupEventListeners();
        this.startPreloader();
    }

    init() {
        this.setupMainCanvas();
        this.setupInteractiveCanvas();
        this.setupPreloaderCanvas();
        this.createNeuralNetwork();
        this.animate();
    }

    setupMainCanvas() {
        const canvas = document.getElementById('mainNeuralCanvas');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        
        renderer.setSize(canvas.width, canvas.height);
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Enhanced lighting for neural visualization
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        pointLight.castShadow = true;
        scene.add(pointLight);
        
        const rimLight = new THREE.DirectionalLight(0xff0080, 0.5);
        rimLight.position.set(-10, 5, -10);
        scene.add(rimLight);
        
        camera.position.z = 30;
        
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
    }

    setupInteractiveCanvas() {
        const canvas = document.getElementById('interactiveCanvas');
        this.interactiveCtx = canvas.getContext('2d');
        this.setupInteractiveNetwork();
    }

    setupPreloaderCanvas() {
        const canvas = document.getElementById('preloaderCanvas');
        this.preloaderCtx = canvas.getContext('2d');
        this.preloaderProgress = 0;
    }

    createNeuralNetwork() {
        // Clear existing network
        this.clearNetwork();
        
        // Create layered neural network
        const layers = [8, 12, 16, 12, 8]; // Network architecture
        const layerSpacing = 8;
        const neuronSpacing = 3;
        
        // Create neurons for each layer
        layers.forEach((neuronCount, layerIndex) => {
            const layer = [];
            const startY = -(neuronCount - 1) * neuronSpacing / 2;
            
            for (let i = 0; i < neuronCount; i++) {
                const neuron = this.createNeuron(
                    layerIndex * layerSpacing - 16,
                    startY + i * neuronSpacing,
                    Math.random() * 4 - 2,
                    layerIndex,
                    i
                );
                layer.push(neuron);
                this.neurons.push(neuron);
                this.scene.add(neuron.mesh);
            }
            
            // Create connections to next layer
            if (layerIndex < layers.length - 1) {
                const nextLayerNeuronCount = layers[layerIndex + 1];
                layer.forEach(neuron => {
                    for (let nextNeuronIndex = 0; nextNeuronIndex < nextLayerNeuronCount; nextNeuronIndex++) {
                        const connection = this.createConnection(neuron, layerIndex + 1, nextNeuronIndex);
                        this.connections.push(connection);
                        this.scene.add(connection.line);
                    }
                });
            }
        });
    }

    createNeuron(x, y, z, layerIndex, neuronIndex) {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x002244,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        return {
            mesh: mesh,
            glow: glow,
            activation: 0,
            layerIndex: layerIndex,
            neuronIndex: neuronIndex,
            position: { x, y, z },
            lastActivation: 0,
            connections: []
        };
    }

    createConnection(fromNeuron, toLayerIndex, toNeuronIndex) {
        const points = [
            new THREE.Vector3(fromNeuron.position.x, fromNeuron.position.y, fromNeuron.position.z),
            new THREE.Vector3(0, 0, 0) // Will be updated when target neuron is created
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x004444,
            transparent: true,
            opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, material);
        
        return {
            line: line,
            fromNeuron: fromNeuron,
            toLayerIndex: toLayerIndex,
            toNeuronIndex: toNeuronIndex,
            weight: Math.random() * 2 - 1,
            strength: 0
        };
    }

    clearNetwork() {
        this.neurons.forEach(neuron => {
            if (neuron.mesh) {
                this.scene.remove(neuron.mesh);
            }
        });
        
        this.connections.forEach(connection => {
            if (connection.line) {
                this.scene.remove(connection.line);
            }
        });
        
        this.neurons = [];
        this.connections = [];
    }

    activateNeuralNetwork() {
        this.isActive = true;
        this.startNeuralActivity();
        
        // Update UI
        document.getElementById('activateNeuralNetwork').textContent = 'Neural Network Active';
        document.getElementById('activateNeuralNetwork').style.background = 'linear-gradient(135deg, #00ff00 0%, #008800 100%)';
    }

    startNeuralActivity() {
        if (!this.isActive) return;
        
        // Simulate neural activity waves
        const time = Date.now() * 0.001;
        
        this.neurons.forEach((neuron, index) => {
            // Create wave-like activation patterns
            const wave = Math.sin(time + index * 0.1) * 0.5 + 0.5;
            const activation = wave * Math.random();
            
            neuron.activation = activation;
            neuron.lastActivation = activation;
            
            // Update neuron appearance
            const intensity = activation;
            neuron.mesh.material.color.setRGB(
                intensity,
                intensity * 0.5,
                1
            );
            neuron.mesh.material.emissive.setRGB(
                0,
                intensity * 0.3,
                intensity * 0.6
            );
            neuron.glow.material.opacity = intensity * 0.3;
            
            // Animate neuron scale
            const scale = 1 + intensity * 0.5;
            neuron.mesh.scale.setScalar(scale);
        });
        
        // Update connections based on neuron activations
        this.connections.forEach(connection => {
            const fromActivation = connection.fromNeuron.activation;
            const strength = fromActivation * Math.abs(connection.weight);
            connection.strength = strength;
            
            // Update connection appearance
            connection.line.material.opacity = 0.1 + strength * 0.7;
            connection.line.material.color.setRGB(
                strength,
                strength * 0.5,
                1
            );
        });
        
        // Update statistics
        this.updateStatistics();
        
        performance_metrics.neural_computations++;
        
        // Continue activity
        setTimeout(() => this.startNeuralActivity(), 50);
    }

    updateStatistics() {
        const activeSynapses = this.neurons.filter(n => n.activation > 0.1).length;
        const networkLoad = (activeSynapses / this.neurons.length * 100).toFixed(1);
        const processedData = (performance_metrics.neural_computations * 0.1).toFixed(1);
        
        document.getElementById('synapseCount').textContent = activeSynapses;
        document.getElementById('networkLoad').textContent = networkLoad + '%';
        document.getElementById('processedData').textContent = processedData + ' MB';
    }

    setupInteractiveNetwork() {
        const canvas = document.getElementById('interactiveCanvas');
        const ctx = this.interactiveCtx;
        
        // Simple 2D neural network visualization
        this.interactiveNodes = [];
        this.interactiveConnections = [];
        
        // Create a simple network layout
        const layers = [4, 6, 4, 2];
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        layers.forEach((nodeCount, layerIndex) => {
            const layer = [];
            const x = (layerIndex / (layers.length - 1)) * (canvasWidth - 100) + 50;
            
            for (let i = 0; i < nodeCount; i++) {
                const y = (i / (nodeCount - 1)) * (canvasHeight - 100) + 50;
                const node = {
                    x: x,
                    y: y,
                    activation: 0,
                    layerIndex: layerIndex,
                    nodeIndex: i
                };
                layer.push(node);
                this.interactiveNodes.push(node);
            }
        });
        
        this.drawInteractiveNetwork();
    }

    drawInteractiveNetwork() {
        const ctx = this.interactiveCtx;
        const canvas = document.getElementById('interactiveCanvas');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections
        this.interactiveNodes.forEach(node => {
            if (node.layerIndex < 3) { // Not the last layer
                const nextLayerNodes = this.interactiveNodes.filter(n => n.layerIndex === node.layerIndex + 1);
                nextLayerNodes.forEach(nextNode => {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + node.activation * 0.5})`;
                    ctx.lineWidth = 1 + node.activation * 3;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(nextNode.x, nextNode.y);
                    ctx.stroke();
                });
            }
        });
        
        // Draw nodes
        this.interactiveNodes.forEach(node => {
            const radius = 8 + node.activation * 10;
            const alpha = 0.3 + node.activation * 0.7;
            
            // Outer glow
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = node.activation * 20;
            
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    startPreloader() {
        const preloaderInterval = setInterval(() => {
            this.preloaderProgress += 0.02;
            this.drawPreloader();
            
            if (this.preloaderProgress >= 1) {
                clearInterval(preloaderInterval);
                this.hidePreloader();
            }
        }, 50);
    }

    drawPreloader() {
        const canvas = document.getElementById('preloaderCanvas');
        const ctx = this.preloaderCtx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw forming brain network
        const nodeCount = Math.floor(this.preloaderProgress * 50);
        const nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            const angle = (i / nodeCount) * Math.PI * 2;
            const radius = 80 + Math.sin(i * 0.5 + Date.now() * 0.003) * 20;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            nodes.push({ x, y });
            
            // Draw node
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw connections
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(nodes[i].x - nodes[j].x, 2) + 
                    Math.pow(nodes[i].y - nodes[j].y, 2)
                );
                
                if (distance < 80) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Draw "aegntic.ai" text in the center
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('aegntic.ai', centerX, centerY);
        
        // Add subtitle
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText('Neural Networks Redefined', centerX, centerY + 40);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Update progress bar
        document.querySelector('.progress-fill').style.width = (this.preloaderProgress * 100) + '%';
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        preloader.classList.add('hidden');
        
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1000);
    }

    setupEventListeners() {
        // Neural network activation
        document.getElementById('activateNeuralNetwork').addEventListener('click', () => {
            this.activateNeuralNetwork();
        });
        
        // View insights
        document.getElementById('viewInsights').addEventListener('click', () => {
            document.getElementById('insights').scrollIntoView({ behavior: 'smooth' });
        });
        
        // Control inputs
        document.getElementById('learningRate').addEventListener('input', (e) => {
            this.learningRate = parseFloat(e.target.value);
            document.getElementById('learningRateValue').textContent = this.learningRate;
        });
        
        document.getElementById('networkDepth').addEventListener('input', (e) => {
            this.networkDepth = parseInt(e.target.value);
            document.getElementById('networkDepthValue').textContent = this.networkDepth;
            this.createNeuralNetwork();
        });
        
        document.getElementById('activationFunction').addEventListener('change', (e) => {
            this.activationFunction = e.target.value;
        });
        
        // Interactive canvas events
        const interactiveCanvas = document.getElementById('interactiveCanvas');
        interactiveCanvas.addEventListener('mousemove', (e) => {
            this.handleInteractiveMouseMove(e);
        });
        
        interactiveCanvas.addEventListener('click', (e) => {
            this.handleInteractiveClick(e);
        });
        
        // Training controls
        document.getElementById('trainNetwork').addEventListener('click', () => {
            this.trainNetwork();
        });
        
        document.getElementById('resetNetwork').addEventListener('click', () => {
            this.resetNetwork();
        });
        
        document.getElementById('saveState').addEventListener('click', () => {
            this.saveNetworkState();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleInteractiveMouseMove(e) {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Activate nodes near mouse
        this.interactiveNodes.forEach(node => {
            const distance = Math.sqrt(
                Math.pow(mouseX - node.x, 2) + 
                Math.pow(mouseY - node.y, 2)
            );
            
            if (distance < 50) {
                node.activation = Math.max(0, 1 - distance / 50);
            } else {
                node.activation *= 0.95; // Fade out
            }
        });
        
        this.drawInteractiveNetwork();
    }

    handleInteractiveClick(e) {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Find closest node and activate it strongly
        let closestNode = null;
        let closestDistance = Infinity;
        
        this.interactiveNodes.forEach(node => {
            const distance = Math.sqrt(
                Math.pow(mouseX - node.x, 2) + 
                Math.pow(mouseY - node.y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestNode = node;
            }
        });
        
        if (closestNode && closestDistance < 30) {
            closestNode.activation = 1;
            this.propagateActivation(closestNode);
        }
    }

    propagateActivation(sourceNode) {
        // Simple forward propagation simulation
        setTimeout(() => {
            const nextLayerNodes = this.interactiveNodes.filter(
                n => n.layerIndex === sourceNode.layerIndex + 1
            );
            
            nextLayerNodes.forEach(node => {
                node.activation = Math.max(node.activation, sourceNode.activation * 0.7 * Math.random());
            });
            
            this.drawInteractiveNetwork();
            
            // Continue propagation if there are more layers
            if (nextLayerNodes.length > 0 && sourceNode.layerIndex < 2) {
                nextLayerNodes.forEach(node => {
                    if (node.activation > 0.1) {
                        this.propagateActivation(node);
                    }
                });
            }
        }, 200);
    }

    trainNetwork() {
        // Simulate training process
        const button = document.getElementById('trainNetwork');
        button.textContent = 'Training...';
        button.disabled = true;
        
        let epoch = 0;
        const maxEpochs = 100;
        
        const trainingInterval = setInterval(() => {
            epoch++;
            
            // Simulate training metrics
            const accuracy = Math.min(95, 20 + (epoch / maxEpochs) * 75 + Math.random() * 5);
            const loss = Math.max(0.001, 1 - (epoch / maxEpochs) * 0.999);
            
            // Update metrics display
            document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
            document.getElementById('loss').textContent = loss.toFixed(3);
            document.getElementById('epochs').textContent = epoch;
            
            // Update learning chart (simplified)
            this.updateLearningChart(epoch, accuracy, loss);
            
            if (epoch >= maxEpochs) {
                clearInterval(trainingInterval);
                button.textContent = 'Train Network';
                button.disabled = false;
            }
        }, 100);
    }

    updateLearningChart(epoch, accuracy, loss) {
        // Simple canvas-based chart update
        const canvas = document.getElementById('learningChart');
        const ctx = canvas.getContext('2d');
        
        if (epoch === 1) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            
            // Draw axes
            ctx.beginPath();
            ctx.moveTo(30, 10);
            ctx.lineTo(30, 190);
            ctx.lineTo(290, 190);
            ctx.stroke();
        }
        
        // Plot accuracy point
        const x = 30 + (epoch / 100) * 260;
        const y = 190 - (accuracy / 100) * 180;
        
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    resetNetwork() {
        this.createNeuralNetwork();
        this.interactiveNodes.forEach(node => {
            node.activation = 0;
        });
        this.drawInteractiveNetwork();
        
        // Reset metrics
        document.getElementById('accuracy').textContent = '0%';
        document.getElementById('loss').textContent = '0.000';
        document.getElementById('epochs').textContent = '0';
        
        // Clear learning chart
        const canvas = document.getElementById('learningChart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    saveNetworkState() {
        const state = {
            neurons: this.neurons.map(n => ({
                position: n.position,
                activation: n.activation,
                layerIndex: n.layerIndex,
                neuronIndex: n.neuronIndex
            })),
            connections: this.connections.map(c => ({
                weight: c.weight,
                strength: c.strength
            })),
            learningRate: this.learningRate,
            networkDepth: this.networkDepth,
            activationFunction: this.activationFunction
        };
        
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'neural-nexus-state.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    handleResize() {
        // Update canvas sizes and camera aspect ratio
        const mainCanvas = document.getElementById('mainNeuralCanvas');
        this.camera.aspect = mainCanvas.width / mainCanvas.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(mainCanvas.width, mainCanvas.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update performance metrics
        performance_metrics.frame_count++;
        const now = performance.now();
        const delta = now - performance_metrics.start_time;
        
        if (delta >= 1000) {
            performance_metrics.fps = Math.round((performance_metrics.frame_count * 1000) / delta);
            performance_metrics.frame_count = 0;
            performance_metrics.start_time = now;
        }
        
        // Rotate camera around the network
        if (this.isActive) {
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.sin(time) * 35;
            this.camera.position.z = Math.cos(time) * 35;
            this.camera.lookAt(0, 0, 0);
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Update performance indicator
        this.updatePerformanceIndicator();
    }

    updatePerformanceIndicator() {
        let indicator = document.querySelector('.performance-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'performance-indicator';
            document.body.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            FPS: ${performance_metrics.fps}<br>
            Neural Ops: ${performance_metrics.neural_computations}<br>
            Neurons: ${this.neurons.length}<br>
            Connections: ${this.connections.length}
        `;
    }
}

// Performance API integration
if ('performance' in window && 'measure' in window.performance) {
    performance.mark('neural-nexus-start');
}

// Initialize Neural Nexus when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.neuralNexus = new NeuralNexus();
    
    if ('performance' in window && 'measure' in window.performance) {
        performance.mark('neural-nexus-ready');
        performance.measure('neural-nexus-load-time', 'neural-nexus-start', 'neural-nexus-ready');
    }
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export metrics endpoint for core services
window.getMetrics = () => {
    return {
        fps: performance_metrics.fps,
        neural_computations: performance_metrics.neural_computations,
        neurons: window.neuralNexus ? window.neuralNexus.neurons.length : 0,
        connections: window.neuralNexus ? window.neuralNexus.connections.length : 0,
        is_active: window.neuralNexus ? window.neuralNexus.isActive : false,
        performance_score: Math.min(100, performance_metrics.fps * 1.67) // Target 60fps = 100 score
    };
};