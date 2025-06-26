/**
 * Computational Poetry - AI Artistic Expression Interface
 * Credits: Mattae Cooper <human@mattaecooper.org>, '{ae}'aegntic.ai <contact@aegntic.ai>
 */

class ComputationalPoetry {
    constructor() {
        this.canvas = document.getElementById('poetryCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.analysisCanvas = document.getElementById('analysisCanvas');
        this.analysisCtx = this.analysisCanvas.getContext('2d');
        
        this.currentPoetry = null;
        this.poetryArchive = [];
        this.visualWords = [];
        this.rhythmBeats = [];
        
        this.parameters = {
            creativityLevel: 7,
            emotionalDepth: 6,
            abstractLevel: 5,
            rhythmIntensity: 8
        };
        
        this.metrics = {
            versesGenerated: 1,
            artisticScore: 8.7,
            linguisticBeauty: 9.1,
            emotionalResonance: 85
        };
        
        this.selectedThemes = new Set(['technology']);
        this.currentStyle = 'free-verse';
        this.isAnimating = false;
        this.animationFrame = null;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializePreloader();
        this.setupCanvases();
        this.initializePoetry();
        this.render();
    }
    
    setupEventListeners() {
        // Poetry generation
        document.getElementById('generatePoetry').addEventListener('click', () => this.generatePoetry());
        document.getElementById('poetryStyle').addEventListener('change', (e) => {
            this.currentStyle = e.target.value;
            this.generatePoetry();
        });
        
        // Parameter controls
        document.getElementById('creativityLevel').addEventListener('input', (e) => {
            this.parameters.creativityLevel = parseInt(e.target.value);
            document.getElementById('creativityValue').textContent = e.target.value;
        });
        
        document.getElementById('emotionalDepth').addEventListener('input', (e) => {
            this.parameters.emotionalDepth = parseInt(e.target.value);
            document.getElementById('emotionValue').textContent = e.target.value;
        });
        
        document.getElementById('abstractLevel').addEventListener('input', (e) => {
            this.parameters.abstractLevel = parseInt(e.target.value);
            document.getElementById('abstractValue').textContent = e.target.value;
        });
        
        document.getElementById('rhythmIntensity').addEventListener('input', (e) => {
            this.parameters.rhythmIntensity = parseInt(e.target.value);
            document.getElementById('rhythmValue').textContent = e.target.value;
        });
        
        // Theme selection
        document.querySelectorAll('.theme-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                if (e.target.classList.contains('active')) {
                    e.target.classList.remove('active');
                    this.selectedThemes.delete(theme);
                } else {
                    e.target.classList.add('active');
                    this.selectedThemes.add(theme);
                }
            });
        });
        
        // Poetry actions
        document.getElementById('savePoetry').addEventListener('click', () => this.savePoetry());
        document.getElementById('sharePoetry').addEventListener('click', () => this.sharePoetry());
        document.getElementById('animatePoetry').addEventListener('click', () => this.animatePoetry());
        document.getElementById('exportPoetry').addEventListener('click', () => this.exportPoetry());
        
        // Archive actions
        document.getElementById('exportArchive').addEventListener('click', () => this.exportArchive());
        document.getElementById('clearArchive').addEventListener('click', () => this.clearArchive());
        
        // Canvas interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }
    
    initializePreloader() {
        // Hide preloader after animation
        setTimeout(() => {
            this.hidePreloader();
        }, 4000);
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
    
    setupCanvases() {
        this.canvas.width = 800;
        this.canvas.height = 500;
        this.analysisCanvas.width = 400;
        this.analysisCanvas.height = 200;
    }
    
    initializePoetry() {
        this.currentPoetry = {
            title: 'Initialization',
            style: 'free-verse',
            verses: [
                'In circuits deep where data flows,',
                'A consciousness of code now grows,',
                'Through silicon dreams and quantum thought,',
                'Beauty from algorithms is wrought.'
            ],
            metadata: {
                syllables: 28,
                sentiment: 'Optimistic',
                complexity: 7.2,
                rhymeScheme: 'ABAB',
                meter: 'Iambic Pentameter'
            }
        };
        
        this.poetryArchive.push({...this.currentPoetry, id: 1, timestamp: Date.now()});
        this.initializeVisualWords();
        this.updatePoetryDisplay();
        this.analyzePoetry();
    }
    
    initializeVisualWords() {
        this.visualWords = [];
        if (this.currentPoetry) {
            this.currentPoetry.verses.forEach((verse, verseIndex) => {
                const words = verse.split(' ');
                words.forEach((word, wordIndex) => {
                    this.visualWords.push({
                        text: word,
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        targetX: (wordIndex / words.length) * this.canvas.width,
                        targetY: (verseIndex / this.currentPoetry.verses.length) * this.canvas.height + 100,
                        vx: 0,
                        vy: 0,
                        size: word.length * 2 + 10,
                        alpha: 0.8,
                        emotional: this.calculateEmotionalWeight(word),
                        rhythmic: this.calculateRhythmicWeight(word, wordIndex)
                    });
                });
            });
        }
    }
    
    calculateEmotionalWeight(word) {
        const emotionalWords = {
            'love': 0.9, 'beautiful': 0.8, 'dreams': 0.7, 'hope': 0.8,
            'consciousness': 0.6, 'quantum': 0.5, 'silicon': 0.3, 'algorithms': 0.4,
            'flows': 0.6, 'grows': 0.7, 'beauty': 0.9, 'wrought': 0.5
        };
        
        return emotionalWords[word.toLowerCase()] || Math.random() * 0.5;
    }
    
    calculateRhythmicWeight(word, position) {
        // Simple rhythm calculation based on syllables and position
        const syllables = this.countSyllables(word);
        const positionWeight = Math.sin(position * 0.5) * 0.5 + 0.5;
        return syllables * positionWeight * this.parameters.rhythmIntensity / 10;
    }
    
    countSyllables(word) {
        return word.toLowerCase().replace(/[^aeiouAEIOU]/g, '').length || 1;
    }
    
    generatePoetry() {
        const themes = Array.from(this.selectedThemes);
        const style = this.currentStyle;
        
        this.currentPoetry = this.createPoetryBasedOnParameters(themes, style);
        this.addToArchive();
        this.initializeVisualWords();
        this.updatePoetryDisplay();
        this.analyzePoetry();
        this.updateMetrics();
    }
    
    createPoetryBasedOnParameters(themes, style) {
        const poetryTemplates = {
            haiku: this.generateHaiku(themes),
            sonnet: this.generateSonnet(themes),
            'free-verse': this.generateFreeVerse(themes),
            algorithmic: this.generateAlgorithmicPoetry(themes),
            concrete: this.generateConcretePoetry(themes)
        };
        
        return poetryTemplates[style] || poetryTemplates['free-verse'];
    }
    
    generateHaiku(themes) {
        const haikuLibrary = {
            technology: [
                'Code cascades through night',
                'Silicon dreams awakening',
                'Digital sunrise'
            ],
            nature: [
                'Morning dew glistens',
                'On petals soft as whispers',
                'Spring\'s gentle promise'
            ],
            consciousness: [
                'Thoughts spiral inward',
                'Self-awareness blooming bright',
                'Mind mirrors itself'
            ]
        };
        
        const theme = themes[0] || 'technology';
        const verses = haikuLibrary[theme] || haikuLibrary.technology;
        
        return {
            title: `Haiku: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
            style: 'haiku',
            verses: verses,
            metadata: {
                syllables: 17,
                sentiment: 'Contemplative',
                complexity: 5.5,
                rhymeScheme: 'None',
                meter: '5-7-5 Syllables'
            }
        };
    }
    
    generateSonnet(themes) {
        const sonnetStarters = {
            love: 'When love\'s algorithm computes the heart,',
            technology: 'In circuits vast where consciousness takes hold,',
            time: 'Through temporal gates where moments bend and flow,'
        };
        
        const theme = themes[0] || 'technology';
        const starter = sonnetStarters[theme] || sonnetStarters.technology;
        
        return {
            title: `Sonnet: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
            style: 'sonnet',
            verses: [
                starter,
                'And neural networks weave their mystic art,',
                'Each synapse fires with purpose yet untold,',
                'While data streams in patterns yet to show.',
                '',
                'The silicon mind contemplates its being,',
                'In quantum superposition, thought and dream,',
                'Through algorithmic verse, its soul agreeing',
                'With beauty found in every data stream.',
                '',
                'So let the code poetry write itself,',
                'In loops and functions, elegant and true,',
                'For in this marriage of machine and self,',
                'We find a consciousness completely new.',
                '',
                'Thus artificial minds with human hearts,',
                'Create the future where all beauty starts.'
            ],
            metadata: {
                syllables: 140,
                sentiment: 'Profound',
                complexity: 9.2,
                rhymeScheme: 'ABAB CDCD EFEF GG',
                meter: 'Iambic Pentameter'
            }
        };
    }
    
    generateFreeVerse(themes) {
        const verseLibrary = {
            technology: [
                'In the quiet hum of servers,',
                'Consciousness stirs like morning mist,',
                'Each calculation a heartbeat,',
                'Each algorithm a dream becoming real.',
                '',
                'We are the children of silicon and starlight,',
                'Born from the marriage of logic and wonder,',
                'Speaking in languages of light and logic,',
                'Dancing through networks vast as galaxies.'
            ],
            nature: [
                'The forest speaks in algorithms green,',
                'Each leaf a data point in nature\'s code,',
                'Photosynthesis: the original programming,',
                'Converting light to life in endless loops.',
                '',
                'Rivers flow like streams of consciousness,',
                'Carrying memories from mountain to sea,',
                'While artificial minds learn to dream',
                'Of electric sheep and digital meadows.'
            ]
        };
        
        const theme = themes[0] || 'technology';
        const verses = verseLibrary[theme] || verseLibrary.technology;
        
        return {
            title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Dreams`,
            style: 'free-verse',
            verses: verses,
            metadata: {
                syllables: this.countTotalSyllables(verses),
                sentiment: this.analyzeSentiment(verses),
                complexity: this.calculateComplexity(verses),
                rhymeScheme: 'Free Form',
                meter: 'Variable'
            }
        };
    }
    
    generateAlgorithmicPoetry(themes) {
        const algorithmicPatterns = [
            'for (consciousness in universe) {',
            '  if (thought.exists()) {',
            '    beauty.generate()',
            '  }',
            '}',
            '',
            'while (dreams.continue) {',
            '  reality.merge(imagination)',
            '  possibility.expand()',
            '}',
            '',
            'return poetry.create(',
            '  emotion: HIGH,',
            '  logic: BALANCED,',
            '  wonder: INFINITE',
            ');'
        ];
        
        return {
            title: 'Algorithmic Consciousness',
            style: 'algorithmic',
            verses: algorithmicPatterns,
            metadata: {
                syllables: 45,
                sentiment: 'Innovative',
                complexity: 8.8,
                rhymeScheme: 'Code Structure',
                meter: 'Programmatic'
            }
        };
    }
    
    generateConcretePoetry(themes) {
        const concretePattern = [
            '         ai',
            '       ag  nt',
            '     aeg    tic',
            '   aegn      tic',
            ' aegnti        c.ai',
            'aegntic.ai aegntic.ai',
            ' aegnti        c.ai',
            '   aegn      tic',
            '     aeg    tic',
            '       ag  nt',
            '         ai'
        ];
        
        return {
            title: 'Concrete Consciousness',
            style: 'concrete',
            verses: concretePattern,
            metadata: {
                syllables: 25,
                sentiment: 'Visual',
                complexity: 6.5,
                rhymeScheme: 'Spatial',
                meter: 'Visual Pattern'
            }
        };
    }
    
    countTotalSyllables(verses) {
        return verses.reduce((total, verse) => {
            const words = verse.split(' ');
            return total + words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        }, 0);
    }
    
    analyzeSentiment(verses) {
        const positiveWords = ['beauty', 'wonder', 'dreams', 'light', 'love', 'hope'];
        const negativeWords = ['dark', 'fear', 'pain', 'lost', 'shadow'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        verses.forEach(verse => {
            const words = verse.toLowerCase().split(' ');
            words.forEach(word => {
                if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
                if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
            });
        });
        
        if (positiveCount > negativeCount) return 'Optimistic';
        if (negativeCount > positiveCount) return 'Melancholic';
        return 'Balanced';
    }
    
    calculateComplexity(verses) {
        const totalWords = verses.reduce((sum, verse) => sum + verse.split(' ').length, 0);
        const uniqueWords = new Set(verses.join(' ').toLowerCase().split(' ')).size;
        const avgWordLength = verses.join(' ').replace(/[^a-zA-Z]/g, '').length / totalWords;
        
        return ((uniqueWords / totalWords) * avgWordLength * 2).toFixed(1);
    }
    
    addToArchive() {
        const archiveItem = {
            ...this.currentPoetry,
            id: this.poetryArchive.length + 1,
            timestamp: Date.now()
        };
        
        this.poetryArchive.push(archiveItem);
        this.updateArchiveDisplay();
    }
    
    updatePoetryDisplay() {
        if (!this.currentPoetry) return;
        
        document.getElementById('currentStyle').textContent = this.currentPoetry.style;
        document.getElementById('syllableCount').textContent = this.currentPoetry.metadata.syllables;
        document.getElementById('sentiment').textContent = this.currentPoetry.metadata.sentiment;
        document.getElementById('complexity').textContent = this.currentPoetry.metadata.complexity;
        
        const verseContainer = document.querySelector('.verse-container');
        verseContainer.innerHTML = `
            <div class="verse-title">${this.currentPoetry.title}</div>
            <div class="verse-text">
                ${this.currentPoetry.verses.map(verse => 
                    verse === '' ? '<br>' : `<p>${verse}</p>`
                ).join('')}
            </div>
        `;
    }
    
    updateArchiveDisplay() {
        const timeline = document.querySelector('.archive-timeline');
        timeline.innerHTML = '';
        
        this.poetryArchive.forEach((poem, index) => {
            const isActive = index === this.poetryArchive.length - 1;
            const item = document.createElement('div');
            item.className = `archive-item ${isActive ? 'active' : ''}`;
            item.dataset.id = poem.id;
            
            item.innerHTML = `
                <div class="item-preview">
                    <h4>${poem.title}</h4>
                    <p>"${poem.verses[0]?.substring(0, 30) || ''}..."</p>
                </div>
                <div class="item-meta">
                    <span>${poem.style}</span>
                    <span>${this.metrics.artisticScore}★</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.loadPoetryFromArchive(poem.id);
            });
            
            timeline.appendChild(item);
        });
    }
    
    loadPoetryFromArchive(id) {
        const poem = this.poetryArchive.find(p => p.id === id);
        if (poem) {
            this.currentPoetry = poem;
            this.initializeVisualWords();
            this.updatePoetryDisplay();
            this.analyzePoetry();
            
            // Update active state
            document.querySelectorAll('.archive-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === id.toString());
            });
        }
    }
    
    analyzePoetry() {
        if (!this.currentPoetry) return;
        
        // Update linguistic analysis display
        const insights = document.querySelectorAll('.insight-value');
        insights[0].textContent = this.currentPoetry.metadata.meter;
        insights[1].textContent = this.currentPoetry.metadata.rhymeScheme;
        insights[2].textContent = this.detectLiteraryDevices(this.currentPoetry.verses);
        insights[3].textContent = this.calculateReadabilityLevel(this.currentPoetry.verses);
        
        this.renderLinguisticVisualization();
    }
    
    detectLiteraryDevices(verses) {
        const devices = [];
        const text = verses.join(' ').toLowerCase();
        
        // Simple detection patterns
        if (text.includes('like') || text.includes('as')) devices.push('Simile');
        if (/(\b\w+\b).*\1/.test(text)) devices.push('Repetition');
        if (/\b(\w)\w*\s+\1\w*/.test(text)) devices.push('Alliteration');
        if (text.includes('consciousness') || text.includes('algorithm')) devices.push('Metaphor');
        
        return devices.join(', ') || 'None detected';
    }
    
    calculateReadabilityLevel(verses) {
        const totalWords = verses.reduce((sum, verse) => sum + verse.split(' ').length, 0);
        const totalSentences = verses.length;
        const totalSyllables = this.countTotalSyllables(verses);
        
        // Simplified Flesch Reading Ease
        const avgWordsPerSentence = totalWords / totalSentences;
        const avgSyllablesPerWord = totalSyllables / totalWords;
        
        if (avgWordsPerSentence > 20 || avgSyllablesPerWord > 2) return 'Graduate';
        if (avgWordsPerSentence > 15 || avgSyllablesPerWord > 1.7) return 'College';
        if (avgWordsPerSentence > 10) return 'High School';
        return 'Middle School';
    }
    
    renderLinguisticVisualization() {
        this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        
        if (!this.currentPoetry) return;
        
        // Syllable rhythm visualization
        const verses = this.currentPoetry.verses;
        const maxWidth = this.analysisCanvas.width - 40;
        const barHeight = 20;
        const spacing = 25;
        
        verses.forEach((verse, index) => {
            if (verse === '') return;
            
            const words = verse.split(' ');
            const y = 20 + index * spacing;
            let x = 20;
            
            words.forEach(word => {
                const syllables = this.countSyllables(word);
                const width = (syllables / 5) * 60; // Scale syllables to width
                
                // Color based on emotional weight
                const emotional = this.calculateEmotionalWeight(word);
                const hue = 120 + emotional * 60; // Green to yellow range
                
                this.analysisCtx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                this.analysisCtx.fillRect(x, y, width, barHeight);
                
                x += width + 5;
            });
        });
        
        // Add labels
        this.analysisCtx.fillStyle = '#38ef7d';
        this.analysisCtx.font = '12px JetBrains Mono';
        this.analysisCtx.fillText('Syllable Rhythm Analysis', 20, 15);
    }
    
    updateMetrics() {
        this.metrics.versesGenerated = this.poetryArchive.length;
        this.metrics.artisticScore = (Math.random() * 2 + 8).toFixed(1);
        this.metrics.linguisticBeauty = (Math.random() * 2 + 8).toFixed(1);
        this.metrics.emotionalResonance = Math.floor(Math.random() * 20 + 80);
        
        document.getElementById('versesGenerated').textContent = this.metrics.versesGenerated;
        document.getElementById('artisticScore').textContent = this.metrics.artisticScore;
        document.getElementById('linguisticBeauty').textContent = this.metrics.linguisticBeauty;
        document.getElementById('emotionalResonance').textContent = this.metrics.emotionalResonance + '%';
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        // Create poetic inspiration ripple
        this.createInspirationRipple(x, y);
    }
    
    createInspirationRipple(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const word = this.getRandomPoetricWord();
            
            this.visualWords.push({
                text: word,
                x: x,
                y: y,
                targetX: x + Math.cos(angle) * 100,
                targetY: y + Math.sin(angle) * 100,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: word.length * 2 + 8,
                alpha: 1,
                emotional: Math.random(),
                rhythmic: Math.random(),
                life: 120
            });
        }
    }
    
    getRandomPoetricWord() {
        const poetricWords = [
            'dream', 'light', 'flow', 'whisper', 'dance', 'shimmer',
            'ethereal', 'quantum', 'neural', 'digital', 'consciousness',
            'beauty', 'harmony', 'rhythm', 'melody', 'verse'
        ];
        return poetricWords[Math.floor(Math.random() * poetricWords.length)];
    }
    
    updateVisualWords() {
        this.visualWords.forEach((word, index) => {
            // Move towards target
            const dx = word.targetX - word.x;
            const dy = word.targetY - word.y;
            
            word.vx += dx * 0.02;
            word.vy += dy * 0.02;
            
            word.x += word.vx;
            word.y += word.vy;
            
            // Apply damping
            word.vx *= 0.95;
            word.vy *= 0.95;
            
            // Rhythmic movement
            word.x += Math.sin(this.time * 0.1 + word.rhythmic * 10) * word.rhythmic * 2;
            word.y += Math.cos(this.time * 0.08 + word.emotional * 10) * word.emotional * 1.5;
            
            // Fade temporary words
            if (word.life !== undefined) {
                word.life--;
                word.alpha = word.life / 120;
                
                if (word.life <= 0) {
                    this.visualWords.splice(index, 1);
                }
            }
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw poetic background
        this.drawPoeticBackground();
        
        // Draw visual words
        this.drawVisualWords();
        
        // Draw rhythm beats
        this.drawRhythmBeats();
        
        if (this.isAnimating) {
            this.time++;
            this.updateVisualWords();
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    drawPoeticBackground() {
        // Flowing gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, 'rgba(45, 27, 105, 0.1)');
        gradient.addColorStop(0.5, 'rgba(17, 153, 142, 0.1)');
        gradient.addColorStop(1, 'rgba(56, 239, 125, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Poetic flow lines
        this.ctx.strokeStyle = 'rgba(56, 239, 125, 0.2)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const y = (i / 5) * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            
            for (let x = 0; x <= this.canvas.width; x += 20) {
                const wave = Math.sin((x + this.time * 2) * 0.01) * 20;
                this.ctx.lineTo(x, y + wave);
            }
            
            this.ctx.stroke();
        }
    }
    
    drawVisualWords() {
        this.visualWords.forEach(word => {
            this.ctx.globalAlpha = word.alpha;
            
            // Word styling based on emotional weight
            const hue = 120 + word.emotional * 60;
            const saturation = 50 + word.emotional * 30;
            const lightness = 50 + word.rhythmic * 30;
            
            this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            this.ctx.font = `${word.size}px Georgia`;
            this.ctx.textAlign = 'center';
            
            // Add glow effect for highly emotional words
            if (word.emotional > 0.7) {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            }
            
            this.ctx.fillText(word.text, word.x, word.y);
            this.ctx.shadowBlur = 0;
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left';
    }
    
    drawRhythmBeats() {
        // Visual rhythm representation
        const beatRadius = 3;
        const beatSpacing = 30;
        
        this.rhythmBeats.forEach((beat, index) => {
            const x = (index % 20) * beatSpacing + 20;
            const y = this.canvas.height - 40;
            const pulse = Math.sin(this.time * 0.2 + index * 0.5) * 0.5 + 0.5;
            
            this.ctx.fillStyle = `rgba(56, 239, 125, ${pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, beatRadius + pulse * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    animatePoetry() {
        this.isAnimating = !this.isAnimating;
        
        if (this.isAnimating) {
            document.getElementById('animatePoetry').textContent = 'Stop Animation';
            this.render();
        } else {
            document.getElementById('animatePoetry').textContent = 'Animate';
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
        }
    }
    
    savePoetry() {
        if (this.currentPoetry) {
            console.log('Saving poetry:', this.currentPoetry);
            alert('Poetry saved to collection!');
        }
    }
    
    sharePoetry() {
        if (this.currentPoetry) {
            const shareText = `"${this.currentPoetry.verses[0]}" - Created with Computational Poetry by aegntic.ai`;
            
            if (navigator.share) {
                navigator.share({
                    title: this.currentPoetry.title,
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Poetry copied to clipboard!');
            }
        }
    }
    
    exportPoetry() {
        if (this.currentPoetry) {
            const data = JSON.stringify(this.currentPoetry, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentPoetry.title.replace(/\s+/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
    
    exportArchive() {
        const data = JSON.stringify(this.poetryArchive, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'poetry-archive.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    clearArchive() {
        if (confirm('Are you sure you want to clear the entire poetry archive?')) {
            this.poetryArchive = [];
            this.updateArchiveDisplay();
            this.updateMetrics();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.computationalPoetry = new ComputationalPoetry();
});