/**
 * CCTM MVP - Early Attention Detection Logic
 * 
 * This file contains the original attention detection concept that became
 * one of CCTM's most revolutionary features. The MVP started with simple
 * pattern matching that evolved into sophisticated AI-powered detection.
 */

class BasicAttentionDetector {
    constructor() {
        this.patterns = this.initializeBasicPatterns();
        this.detectionHistory = [];
        this.falsePositiveRate = 0;
        this.lastDetection = null;
    }

    /**
     * Initialize basic attention patterns
     * MVP version: Simple string matching, no ML
     */
    initializeBasicPatterns() {
        return [
            // Error patterns that definitely need attention
            {
                name: 'compilation_error',
                pattern: /error:|failed:|exception:/i,
                priority: 'high',
                description: 'Compilation or runtime errors detected'
            },
            
            // Test failure patterns
            {
                name: 'test_failure',
                pattern: /test.*failed|assertion.*failed|tests.*failing/i,
                priority: 'high',
                description: 'Test failures detected'
            },
            
            // Build completion patterns
            {
                name: 'build_complete',
                pattern: /build.*complete|build.*success|compilation.*success/i,
                priority: 'medium',
                description: 'Build process completed'
            },
            
            // Interactive prompts that need user input
            {
                name: 'interactive_prompt',
                pattern: /\[Y\/n\]|\[y\/N\]|continue\?|proceed\?/i,
                priority: 'high',
                description: 'Interactive prompt waiting for input'
            },
            
            // Long-running process completion
            {
                name: 'process_complete',
                pattern: /done\.|finished\.|completed\.|100%/i,
                priority: 'medium',
                description: 'Long-running process completed'
            },
            
            // Permission or access issues
            {
                name: 'permission_error',
                pattern: /permission denied|access denied|unauthorized/i,
                priority: 'high',
                description: 'Permission or access issues'
            },
            
            // Network/connection issues
            {
                name: 'network_error',
                pattern: /connection.*failed|network.*error|timeout|unreachable/i,
                priority: 'medium',
                description: 'Network connectivity issues'
            }
        ];
    }

    /**
     * Analyze terminal output for attention patterns
     * This was the MVP's core innovation: automatic attention detection
     */
    analyzeOutput(terminalId, output, timestamp = new Date()) {
        const detections = [];

        this.patterns.forEach(pattern => {
            if (pattern.pattern.test(output)) {
                const detection = {
                    terminalId,
                    timestamp,
                    pattern: pattern.name,
                    priority: pattern.priority,
                    description: pattern.description,
                    matchedText: this.extractMatch(output, pattern.pattern),
                    confidence: this.calculateConfidence(pattern, output)
                };

                detections.push(detection);
                this.recordDetection(detection);
            }
        });

        return detections;
    }

    /**
     * Extract the specific text that matched the pattern
     */
    extractMatch(output, pattern) {
        const match = output.match(pattern);
        return match ? match[0] : '';
    }

    /**
     * Calculate confidence based on context and pattern strength
     * MVP version: Simple heuristics, later became ML-powered
     */
    calculateConfidence(pattern, output) {
        let confidence = 0.7; // Base confidence

        // Increase confidence for certain contexts
        if (output.toLowerCase().includes('claude') || output.toLowerCase().includes('ai')) {
            confidence += 0.1; // Claude Code specific context
        }

        // Error patterns are usually high confidence
        if (pattern.priority === 'high') {
            confidence += 0.2;
        }

        // Reduce confidence for very short outputs (likely false positives)
        if (output.length < 20) {
            confidence -= 0.3;
        }

        return Math.min(0.95, Math.max(0.1, confidence));
    }

    /**
     * Record detection for learning and statistics
     */
    recordDetection(detection) {
        this.detectionHistory.push(detection);
        this.lastDetection = detection;

        // Keep history manageable (MVP limitation)
        if (this.detectionHistory.length > 100) {
            this.detectionHistory.shift();
        }

        console.log(`[MVP Attention] Detected: ${detection.pattern} in terminal ${detection.terminalId}`);
    }

    /**
     * Check if a terminal needs attention based on recent detections
     * This determines when to highlight terminals in the UI
     */
    needsAttention(terminalId, timeWindow = 30000) { // 30 second window
        const cutoff = new Date(Date.now() - timeWindow);
        
        const recentDetections = this.detectionHistory.filter(detection => 
            detection.terminalId === terminalId && 
            detection.timestamp > cutoff
        );

        // High priority detections always need attention
        const highPriorityDetections = recentDetections.filter(d => d.priority === 'high');
        if (highPriorityDetections.length > 0) {
            return {
                needsAttention: true,
                reason: 'high_priority_detection',
                detections: highPriorityDetections,
                urgency: 'high'
            };
        }

        // Multiple medium priority detections
        const mediumPriorityDetections = recentDetections.filter(d => d.priority === 'medium');
        if (mediumPriorityDetections.length >= 2) {
            return {
                needsAttention: true,
                reason: 'multiple_medium_detections',
                detections: mediumPriorityDetections,
                urgency: 'medium'
            };
        }

        return {
            needsAttention: false,
            reason: 'no_significant_activity',
            detections: recentDetections,
            urgency: 'none'
        };
    }

    /**
     * Get attention summary for all terminals
     * This powers the MVP's dashboard view
     */
    getAttentionSummary() {
        const terminalIds = [...new Set(this.detectionHistory.map(d => d.terminalId))];
        const summary = {};

        terminalIds.forEach(terminalId => {
            summary[terminalId] = this.needsAttention(terminalId);
        });

        return {
            terminals: summary,
            totalDetections: this.detectionHistory.length,
            recentDetections: this.detectionHistory.filter(d => 
                new Date() - d.timestamp < 300000 // 5 minutes
            ).length,
            falsePositiveRate: this.falsePositiveRate
        };
    }

    /**
     * Demo function showing the attention detector in action
     */
    static demo() {
        console.log('=== CCTM MVP - Basic Attention Detection Demo ===\n');
        
        const detector = new BasicAttentionDetector();
        
        // Simulate various terminal outputs
        const testOutputs = [
            { terminal: 'term1', output: 'Building project... done.' },
            { terminal: 'term2', output: 'Error: Could not find module "missing-package"' },
            { terminal: 'term3', output: 'Test suite completed successfully' },
            { terminal: 'term2', output: 'Do you want to continue? [Y/n]' },
            { terminal: 'term1', output: 'Warning: deprecated function used' },
            { terminal: 'term3', output: 'Fatal: permission denied for database connection' }
        ];

        console.log('Analyzing terminal outputs:');
        testOutputs.forEach((test, index) => {
            setTimeout(() => {
                console.log(`\n${index + 1}. Terminal ${test.terminal}: "${test.output}"`);
                const detections = detector.analyzeOutput(test.terminal, test.output);
                
                if (detections.length > 0) {
                    detections.forEach(detection => {
                        console.log(`   🚨 ATTENTION: ${detection.description} (${detection.priority} priority)`);
                        console.log(`      Confidence: ${Math.round(detection.confidence * 100)}%`);
                    });
                } else {
                    console.log(`   ✓ No attention needed`);
                }
            }, index * 1000);
        });

        // Show summary after all outputs
        setTimeout(() => {
            console.log('\n=== Attention Summary ===');
            const summary = detector.getAttentionSummary();
            
            Object.entries(summary.terminals).forEach(([terminalId, status]) => {
                console.log(`${terminalId}: ${status.needsAttention ? '🚨 NEEDS ATTENTION' : '✓ OK'} (${status.urgency})`);
                if (status.needsAttention) {
                    console.log(`  Reason: ${status.reason}`);
                    console.log(`  Detections: ${status.detections.length}`);
                }
            });
            
            console.log(`\nTotal detections: ${summary.totalDetections}`);
            console.log(`Recent activity: ${summary.recentDetections} detections in last 5 minutes`);
        }, testOutputs.length * 1000 + 1000);
    }
}

// Export for use in other parts of the MVP demo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BasicAttentionDetector };
}

/**
 * Evolution from MVP to Full CCTM:
 * 
 * This basic attention detector evolved into:
 * 
 * Advanced Pattern Recognition:
 * - ML-powered pattern learning instead of static regex
 * - Context-aware detection based on project type
 * - Claude Code specific output pattern recognition
 * - Adaptive learning from user feedback
 * 
 * Multi-Instance Awareness:
 * - Cross-terminal pattern correlation
 * - Project-specific attention thresholds
 * - Intelligent priority weighting
 * - Multi-model AI analysis integration
 * 
 * Real-time Integration:
 * - Live terminal output stream processing
 * - MCP server event correlation
 * - Visual attention indicators in UI
 * - Smart notification management
 * 
 * The MVP Insight That Became Revolutionary:
 * "Developers shouldn't have to constantly check terminal outputs manually"
 * 
 * This evolved into:
 * "Multiple Claude Code instances should intelligently signal when they need attention"
 * 
 * The basic regex patterns became sophisticated AI that understands:
 * - When Claude Code has finished processing
 * - When human intervention is needed
 * - When errors require immediate attention
 * - When background processes complete successfully
 * 
 * This simple MVP concept became the foundation for CCTM's ability to manage
 * multiple concurrent Claude Code workflows without constant manual monitoring.
 */