/**
 * Matrix Architect - Code Reality Builder Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class MatrixArchitect {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.nodes = [];
        this.connections = [];
        this.draggedNode = null;
        this.selectedNode = null;
        this.isConnecting = false;
        this.connectionStart = null;
        
        this.parameters = {
            matrixDensity: 20,
            flowSpeed: 5,
            realityLayers: 3
        };
        
        this.metrics = {
            nodeCount: 0,
            connectionCount: 0,
            stability: 100,
            compileStatus: 'Ready'
        };
        
        this.matrixRain = [];
        this.animationFrame = null;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvas();
        this.initializeMatrixRain();
        this.render();
    }
    
    setupEventListeners() {
        // Matrix controls
        document.getElementById('compileMatrix').addEventListener('click', () => this.compileMatrix());
        document.getElementById('runMatrix').addEventListener('click', () => this.runMatrix());
        document.getElementById('debugMatrix').addEventListener('click', () => this.debugMatrix());
        document.getElementById('resetMatrix').addEventListener('click', () => this.resetMatrix());
        
        // Parameter controls
        document.getElementById('matrixDensity').addEventListener('input', (e) => {
            this.parameters.matrixDensity = parseInt(e.target.value);
            document.getElementById('densityValue').textContent = e.target.value;
            this.updateMatrixRain();
        });
        
        document.getElementById('flowSpeed').addEventListener('input', (e) => {
            this.parameters.flowSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = e.target.value;
        });
        
        document.getElementById('realityLayers').addEventListener('input', (e) => {
            this.parameters.realityLayers = parseInt(e.target.value);
            document.getElementById('layersValue').textContent = e.target.value;
        });
        
        // Code output actions
        document.getElementById('copyCode').addEventListener('click', () => this.copyCode());
        document.getElementById('downloadCode').addEventListener('click', () => this.downloadCode());
        
        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Drag and drop from palette
        this.setupDragAndDrop();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    initializePreloader() {
        this.createCodeRain();
        
        // Progress bar animation
        const progressBar = document.getElementById('matrixProgress');
        let progress = 0;
        
        const updateProgress = () => {
            progress += Math.random() * 5;
            if (progress > 100) progress = 100;
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 100);
            } else {
                setTimeout(() => this.hidePreloader(), 500);
            }
        };
        
        updateProgress();
    }
    
    createCodeRain() {
        const container = document.getElementById('codeRain');
        if (!container) return;
        
        const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const columns = 30;
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'rain-column';
            column.style.left = (i / columns) * 100 + '%';
            column.style.animationDuration = (Math.random() * 3 + 2) + 's';
            column.style.animationDelay = Math.random() * 2 + 's';
            
            let text = '';
            for (let j = 0; j < 20; j++) {
                text += characters[Math.floor(Math.random() * characters.length)] + '\n';
            }
            column.textContent = text;
            
            container.appendChild(column);
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
        this.canvas.width = 1200;
        this.canvas.height = 700;
    }
    
    initializeMatrixRain() {
        for (let i = 0; i < this.parameters.matrixDensity; i++) {
            this.matrixRain.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: Math.random() * 3 + 1,
                char: this.getRandomMatrixChar(),
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    getRandomMatrixChar() {
        const chars = '01アイウエオカキクケコabcdefghijklmnopqrstuvwxyz{}[]()<>=+-*/&|^%$#@!';
        return chars[Math.floor(Math.random() * chars.length)];
    }
    
    updateMatrixRain() {
        // Adjust matrix rain density
        const targetDensity = this.parameters.matrixDensity;
        
        if (this.matrixRain.length < targetDensity) {
            for (let i = this.matrixRain.length; i < targetDensity; i++) {
                this.matrixRain.push({
                    x: Math.random() * this.canvas.width,
                    y: -50,
                    speed: Math.random() * 3 + 1,
                    char: this.getRandomMatrixChar(),
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        } else {
            this.matrixRain.splice(targetDensity);
        }
    }
    
    setupDragAndDrop() {
        const codeBlocks = document.querySelectorAll('.code-block');
        
        codeBlocks.forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', block.dataset.type);
            });
        });
        
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const blockType = e.dataTransfer.getData('text/plain');
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.createNode(blockType, x, y);
        });
    }
    
    createNode(type, x, y) {
        const node = {
            id: Date.now() + Math.random(),
            type: type,
            x: x,
            y: y,
            width: 120,
            height: 60,
            code: this.generateNodeCode(type),
            connections: [],
            selected: false,
            layer: 0
        };
        
        this.nodes.push(node);
        this.updateMetrics();
        this.generateCode();
    }
    
    generateNodeCode(type) {
        const codeTemplates = {
            variable: 'let variable = value;',
            function: 'function name() {\n  // code\n}',
            condition: 'if (condition) {\n  // true\n}',
            loop: 'for (let i = 0; i < n; i++) {\n  // iterate\n}',
            object: 'const obj = {\n  key: value\n};',
            array: 'const arr = [1, 2, 3];'
        };
        
        return codeTemplates[type] || '// code block';
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = this.getNodeAt(x, y);
        
        if (clickedNode) {
            if (e.shiftKey) {
                // Start connection mode
                this.startConnection(clickedNode);
            } else {
                // Start dragging
                this.draggedNode = clickedNode;
                this.selectNode(clickedNode);
            }
        } else {
            this.selectNode(null);
        }
    }
    
    handleMouseMove(e) {
        if (this.draggedNode) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.draggedNode.x = x - this.draggedNode.width / 2;
            this.draggedNode.y = y - this.draggedNode.height / 2;
        }
    }
    
    handleMouseUp(e) {
        if (this.isConnecting) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const targetNode = this.getNodeAt(x, y);
            if (targetNode && targetNode !== this.connectionStart) {
                this.createConnection(this.connectionStart, targetNode);
            }
            
            this.isConnecting = false;
            this.connectionStart = null;
        }
        
        this.draggedNode = null;
    }
    
    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = this.getNodeAt(x, y);
        if (clickedNode) {
            this.editNode(clickedNode);
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedNode) {
            this.deleteNode(this.selectedNode);
        }
        if (e.key === 'Escape') {
            this.selectNode(null);
            this.isConnecting = false;
            this.connectionStart = null;
        }
    }
    
    getNodeAt(x, y) {
        return this.nodes.find(node => 
            x >= node.x && x <= node.x + node.width &&
            y >= node.y && y <= node.y + node.height
        );
    }
    
    selectNode(node) {
        this.nodes.forEach(n => n.selected = false);
        if (node) {
            node.selected = true;
        }
        this.selectedNode = node;
    }
    
    startConnection(node) {
        this.isConnecting = true;
        this.connectionStart = node;
    }
    
    createConnection(node1, node2) {
        const connection = {
            id: `${node1.id}-${node2.id}`,
            from: node1,
            to: node2,
            type: 'flow'
        };
        
        this.connections.push(connection);
        node1.connections.push(node2.id);
        this.updateMetrics();
        this.generateCode();
    }
    
    deleteNode(node) {
        // Remove connections
        this.connections = this.connections.filter(conn => 
            conn.from.id !== node.id && conn.to.id !== node.id
        );
        
        // Remove node
        this.nodes = this.nodes.filter(n => n.id !== node.id);
        
        this.selectedNode = null;
        this.updateMetrics();
        this.generateCode();
    }
    
    editNode(node) {
        const newCode = prompt('Edit node code:', node.code);
        if (newCode !== null) {
            node.code = newCode;
            this.generateCode();
        }
    }
    
    updateMetrics() {
        this.metrics.nodeCount = this.nodes.length;
        this.metrics.connectionCount = this.connections.length;
        this.metrics.stability = Math.max(0, 100 - (this.nodes.length * 2));
        
        document.getElementById('nodeCount').textContent = this.metrics.nodeCount;
        document.getElementById('connectionCount').textContent = this.metrics.connectionCount;
        document.getElementById('stability').textContent = this.metrics.stability + '%';
        document.getElementById('compileStatus').textContent = this.metrics.compileStatus;
    }
    
    generateCode() {
        let code = '// Generated Matrix Reality Code\n\n';
        
        // Sort nodes by layer and connections
        const sortedNodes = this.topologicalSort();
        
        sortedNodes.forEach((node, index) => {
            code += `// Node ${index + 1}: ${node.type}\n`;
            code += node.code + '\n\n';
        });
        
        code += '// Matrix compilation complete\n';
        code += `// Total nodes: ${this.nodes.length}\n`;
        code += `// Total connections: ${this.connections.length}\n`;
        
        document.getElementById('codeOutput').innerHTML = `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    }
    
    topologicalSort() {
        // Simple topological sort for node execution order
        const visited = new Set();
        const result = [];
        
        const visit = (node) => {
            if (visited.has(node.id)) return;
            visited.add(node.id);
            
            // Visit dependencies first
            this.connections.forEach(conn => {
                if (conn.to.id === node.id) {
                    visit(conn.from);
                }
            });
            
            result.push(node);
        };
        
        this.nodes.forEach(node => visit(node));
        return result;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw matrix rain background
        this.drawMatrixRain();
        
        // Draw grid
        this.drawGrid();
        
        // Draw connections
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        // Draw connection preview
        if (this.isConnecting && this.connectionStart) {
            this.drawConnectionPreview();
        }
        
        this.time++;
        this.animationFrame = requestAnimationFrame(() => this.render());
    }
    
    drawMatrixRain() {
        this.ctx.font = '14px JetBrains Mono';
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        
        this.matrixRain.forEach(drop => {
            this.ctx.globalAlpha = drop.opacity;
            this.ctx.fillText(drop.char, drop.x, drop.y);
            
            drop.y += drop.speed * this.parameters.flowSpeed;
            
            if (drop.y > this.canvas.height) {
                drop.y = -20;
                drop.char = this.getRandomMatrixChar();
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 30;
        
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
    
    drawConnections() {
        this.connections.forEach(connection => {
            const from = connection.from;
            const to = connection.to;
            
            const startX = from.x + from.width / 2;
            const startY = from.y + from.height / 2;
            const endX = to.x + to.width / 2;
            const endY = to.y + to.height / 2;
            
            // Draw connection line
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ff00';
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Draw arrow
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowLength = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle - Math.PI / 6),
                endY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowLength * Math.cos(angle + Math.PI / 6),
                endY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawNodes() {
        this.nodes.forEach(node => {
            // Node background
            this.ctx.fillStyle = node.selected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 255, 0, 0.2)';
            this.ctx.strokeStyle = node.selected ? '#ffffff' : '#00ff00';
            this.ctx.lineWidth = 2;
            
            if (node.selected) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ffffff';
            } else {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#00ff00';
            }
            
            this.ctx.fillRect(node.x, node.y, node.width, node.height);
            this.ctx.strokeRect(node.x, node.y, node.width, node.height);
            
            this.ctx.shadowBlur = 0;
            
            // Node type icon
            const icons = {
                variable: '$',
                function: 'ƒ',
                condition: '?',
                loop: '∞',
                object: '{}',
                array: '[]'
            };
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '20px JetBrains Mono';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                icons[node.type] || '•',
                node.x + node.width / 2,
                node.y + 25
            );
            
            // Node label
            this.ctx.font = '12px JetBrains Mono';
            this.ctx.fillText(
                node.type.charAt(0).toUpperCase() + node.type.slice(1),
                node.x + node.width / 2,
                node.y + 45
            );
        });
        
        this.ctx.textAlign = 'left';
    }
    
    drawConnectionPreview() {
        // Draw line from connection start to mouse position
        const startX = this.connectionStart.x + this.connectionStart.width / 2;
        const startY = this.connectionStart.y + this.connectionStart.height / 2;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(this.mouseX || startX, this.mouseY || startY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    compileMatrix() {
        this.metrics.compileStatus = 'Compiling...';
        this.updateMetrics();
        
        setTimeout(() => {
            const success = this.nodes.length > 0;
            this.metrics.compileStatus = success ? 'Compiled' : 'Error';
            this.updateMetrics();
            
            if (success) {
                this.generateCode();
            }
        }, 1000);
    }
    
    runMatrix() {
        if (this.metrics.compileStatus === 'Compiled') {
            this.metrics.compileStatus = 'Running...';
            this.updateMetrics();
            
            setTimeout(() => {
                this.metrics.compileStatus = 'Complete';
                this.updateMetrics();
            }, 2000);
        }
    }
    
    debugMatrix() {
        console.log('Matrix Debug Info:', {
            nodes: this.nodes,
            connections: this.connections,
            metrics: this.metrics
        });
    }
    
    resetMatrix() {
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.metrics.compileStatus = 'Ready';
        this.updateMetrics();
        this.generateCode();
    }
    
    copyCode() {
        const codeElement = document.querySelector('#codeOutput code');
        if (codeElement) {
            navigator.clipboard.writeText(codeElement.textContent);
            alert('Code copied to clipboard!');
        }
    }
    
    downloadCode() {
        const codeElement = document.querySelector('#codeOutput code');
        if (codeElement) {
            const blob = new Blob([codeElement.textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'matrix-reality.js';
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.matrixArchitect = new MatrixArchitect();
});