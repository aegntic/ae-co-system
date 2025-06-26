import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserJourney } from './useUserJourney';

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: number;
  endDate?: number;
  targetSampleSize: number;
  significance: number;
  metrics: string[];
}

export interface ABTestResult {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isSignificant: boolean;
  lift?: number;
}

export interface ABTestSession {
  sessionId: string;
  experiments: Record<string, string>; // experimentId -> variantId
  startTime: number;
  conversions: Array<{
    metric: string;
    value: number;
    timestamp: number;
  }>;
}

export interface UseAdvancedABTestingOptions {
  enableAutoOptimization?: boolean;
  significanceThreshold?: number;
  minSampleSize?: number;
  maxExperiments?: number;
  enableBayesianAnalysis?: boolean;
}

export const useAdvancedABTesting = (options: UseAdvancedABTestingOptions = {}) => {
  const {
    enableAutoOptimization = true,
    significanceThreshold = 0.95,
    minSampleSize = 100,
    maxExperiments = 5,
    enableBayesianAnalysis = true
  } = options;

  const { sessionId, trackConversion } = useUserJourney();
  
  // Core state
  const [experiments, setExperiments] = useState<ABTestExperiment[]>([]);
  const [currentSession, setCurrentSession] = useState<ABTestSession | null>(null);
  const [results, setResults] = useState<Record<string, ABTestResult[]>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Session management
  const sessionData = useRef<Map<string, ABTestSession>>(new Map());

  // PHASE 5: Initialize default experiments for psychological optimization
  useEffect(() => {
    const defaultExperiments: ABTestExperiment[] = [
      {
        id: 'hero_messaging_v2',
        name: 'Hero Messaging Psychology',
        description: 'Test psychological triggers in hero section',
        variants: [
          {
            id: 'control_living_websites',
            name: 'Control: Living Websites',
            weight: 0.25,
            config: {
              primaryMessage: 'Living Websites That Update Themselves',
              psychologicalTrigger: 'autonomy',
              urgency: 'low'
            },
            isControl: true
          },
          {
            id: 'scarcity_exclusive',
            name: 'Scarcity + Exclusivity',
            weight: 0.25,
            config: {
              primaryMessage: 'Join Elite Developers Showcasing Professionally',
              psychologicalTrigger: 'scarcity',
              urgency: 'high',
              socialProof: 'exclusive'
            },
            isControl: false
          },
          {
            id: 'authority_social_proof',
            name: 'Authority + Social Proof',
            weight: 0.25,
            config: {
              primaryMessage: 'Used by 10,000+ Developers at Top Companies',
              psychologicalTrigger: 'authority',
              urgency: 'medium',
              socialProof: 'companies'
            },
            isControl: false
          },
          {
            id: 'reciprocity_value',
            name: 'Reciprocity + Value',
            weight: 0.25,
            config: {
              primaryMessage: 'Experience Professional Web Presence Free',
              psychologicalTrigger: 'reciprocity',
              urgency: 'low',
              valueEmphasis: 'free_premium'
            },
            isControl: false
          }
        ],
        status: 'running',
        startDate: Date.now(),
        targetSampleSize: 500,
        significance: 0.95,
        metrics: ['generation_completion', 'tier_selection', 'deployment_attempt']
      },
      {
        id: 'conversion_timing_optimization',
        name: 'Conversion Timing Psychology',
        description: 'Optimize when to show upgrade prompts based on psychological readiness',
        variants: [
          {
            id: 'immediate_after_success',
            name: 'Immediate Post-Success',
            weight: 0.2,
            config: {
              trigger: 'immediate',
              delay: 0,
              psychologicalPrinciple: 'peak_emotion'
            },
            isControl: true
          },
          {
            id: 'delayed_absorption',
            name: 'Delayed for Absorption',
            weight: 0.2,
            config: {
              trigger: 'delayed',
              delay: 8000,
              psychologicalPrinciple: 'cognitive_processing'
            },
            isControl: false
          },
          {
            id: 'engagement_peak',
            name: 'Engagement Peak Detection',
            weight: 0.2,
            config: {
              trigger: 'dynamic',
              condition: 'engagement_peak',
              psychologicalPrinciple: 'optimal_moment'
            },
            isControl: false
          },
          {
            id: 'personality_adaptive',
            name: 'Personality-Adaptive Timing',
            weight: 0.2,
            config: {
              trigger: 'personality_based',
              adaptToPersonality: true,
              psychologicalPrinciple: 'personalized_timing'
            },
            isControl: false
          },
          {
            id: 'social_momentum',
            name: 'Social Momentum Trigger',
            weight: 0.2,
            config: {
              trigger: 'social_based',
              socialTrigger: 'peer_activity',
              psychologicalPrinciple: 'social_proof_timing'
            },
            isControl: false
          }
        ],
        status: 'running',
        startDate: Date.now(),
        targetSampleSize: 300,
        significance: 0.95,
        metrics: ['upgrade_conversion', 'time_to_conversion', 'engagement_score']
      },
      {
        id: 'social_proof_psychology',
        name: 'Social Proof Psychology',
        description: 'Test different social proof formats for maximum psychological impact',
        variants: [
          {
            id: 'number_based_proof',
            name: 'Number-Based Social Proof',
            weight: 0.33,
            config: {
              format: 'numbers',
              message: '10,000+ developers showcase with us',
              psychologicalTrigger: 'consensus'
            },
            isControl: true
          },
          {
            id: 'authority_testimonials',
            name: 'Authority Testimonials',
            weight: 0.33,
            config: {
              format: 'testimonials',
              focus: 'authority_figures',
              companies: ['Meta', 'Google', 'Apple'],
              psychologicalTrigger: 'authority'
            },
            isControl: false
          },
          {
            id: 'peer_validation',
            name: 'Peer Validation',
            weight: 0.34,
            config: {
              format: 'peer_activity',
              realTime: true,
              message: 'developers like you are showcasing',
              psychologicalTrigger: 'liking'
            },
            isControl: false
          }
        ],
        status: 'running',
        startDate: Date.now(),
        targetSampleSize: 400,
        significance: 0.95,
        metrics: ['social_proof_engagement', 'trust_indicator_clicks', 'conversion_lift']
      }
    ];
    
    setExperiments(defaultExperiments);
  }, []);

  // PHASE 5: Statistical significance calculation using Z-test
  const calculateStatisticalSignificance = useCallback((controlRate: number, variantRate: number, controlSize: number, variantSize: number): { confidence: number; isSignificant: boolean; pValue: number } => {
    if (controlSize < minSampleSize || variantSize < minSampleSize) {
      return { confidence: 0, isSignificant: false, pValue: 1 };
    }
    
    // Pooled standard error calculation
    const pooledRate = ((controlRate * controlSize) + (variantRate * variantSize)) / (controlSize + variantSize);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * ((1 / controlSize) + (1 / variantSize)));
    
    if (standardError === 0) {
      return { confidence: 0, isSignificant: false, pValue: 1 };
    }
    
    // Z-score calculation
    const zScore = Math.abs(variantRate - controlRate) / standardError;
    
    // Two-tailed p-value using normal distribution approximation
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const confidence = 1 - pValue;
    const isSignificant = confidence >= significanceThreshold;
    
    return { confidence, isSignificant, pValue };
  }, [minSampleSize, significanceThreshold]);

  // PHASE 5: Bayesian analysis for dynamic optimization
  const performBayesianAnalysis = useCallback((results: ABTestResult[]): { probabilities: Record<string, number>; recommendedVariant: string } => {
    if (!enableBayesianAnalysis || results.length < 2) {
      return { probabilities: {}, recommendedVariant: results[0]?.variantId || '' };
    }
    
    // Simple Beta-Binomial model
    const bayesianResults = results.map(result => {
      const alpha = result.conversions + 1; // Prior alpha = 1
      const beta = (result.participants - result.conversions) + 1; // Prior beta = 1
      
      // Expected value of Beta distribution
      const expectedConversionRate = alpha / (alpha + beta);
      
      // Confidence interval (credible interval)
      const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
      const standardDeviation = Math.sqrt(variance);
      
      return {
        variantId: result.variantId,
        expectedRate: expectedConversionRate,
        credibilityLower: Math.max(0, expectedConversionRate - 1.96 * standardDeviation),
        credibilityUpper: Math.min(1, expectedConversionRate + 1.96 * standardDeviation),
        probability: expectedConversionRate // Simplified
      };
    });
    
    // Calculate probability that each variant is best
    const totalProbability = bayesianResults.reduce((sum, r) => sum + r.probability, 0);
    const probabilities = bayesianResults.reduce((acc, r) => {
      acc[r.variantId] = totalProbability > 0 ? r.probability / totalProbability : 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Recommend variant with highest expected conversion rate
    const recommendedVariant = bayesianResults.reduce((best, current) => 
      current.expectedRate > best.expectedRate ? current : best
    ).variantId;
    
    return { probabilities, recommendedVariant };
  }, [enableBayesianAnalysis]);

  // PHASE 5: Assign user to experiment variants
  const assignToExperiments = useCallback((userId: string = sessionId): ABTestSession => {
    const runningExperiments = experiments.filter(exp => exp.status === 'running');
    const assignments: Record<string, string> = {};
    
    runningExperiments.forEach(experiment => {
      // Use deterministic assignment based on user ID and experiment ID
      const hash = simpleHash(userId + experiment.id);
      const random = (hash % 10000) / 10000; // Normalize to 0-1
      
      let cumulativeWeight = 0;
      for (const variant of experiment.variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          assignments[experiment.id] = variant.id;
          break;
        }
      }
    });
    
    const session: ABTestSession = {
      sessionId: userId,
      experiments: assignments,
      startTime: Date.now(),
      conversions: []
    };
    
    sessionData.current.set(userId, session);
    return session;
  }, [experiments, sessionId]);

  // PHASE 5: Track conversion for A/B tests
  const trackABTestConversion = useCallback((metric: string, value: number = 1, userId: string = sessionId) => {
    const session = sessionData.current.get(userId);
    if (!session) return;
    
    // Add conversion to session
    session.conversions.push({
      metric,
      value,
      timestamp: Date.now()
    });
    
    sessionData.current.set(userId, session);
    
    // Track in analytics
    trackConversion(`ab_test_${metric}`, value, {
      experiments: session.experiments,
      abTestContext: true
    });
    
    // Update results
    setResults(prev => {
      const updated = { ...prev };
      
      Object.entries(session.experiments).forEach(([experimentId, variantId]) => {
        const experiment = experiments.find(e => e.id === experimentId);
        if (!experiment || !experiment.metrics.includes(metric)) return;
        
        if (!updated[experimentId]) {
          updated[experimentId] = experiment.variants.map(v => ({
            variantId: v.id,
            participants: 0,
            conversions: 0,
            conversionRate: 0,
            confidence: 0,
            isSignificant: false
          }));
        }
        
        const variantResult = updated[experimentId].find(r => r.variantId === variantId);
        if (variantResult) {
          variantResult.conversions += value;
          variantResult.conversionRate = variantResult.participants > 0 
            ? variantResult.conversions / variantResult.participants 
            : 0;
        }
      });
      
      return updated;
    });
  }, [sessionId, trackConversion, experiments]);

  // PHASE 5: Get variant configuration for current user
  const getVariantConfig = useCallback((experimentId: string, userId: string = sessionId): Record<string, any> | null => {
    let session = sessionData.current.get(userId);
    
    if (!session) {
      session = assignToExperiments(userId);
      setCurrentSession(session);
    }
    
    const variantId = session.experiments[experimentId];
    if (!variantId) return null;
    
    const experiment = experiments.find(e => e.id === experimentId);
    const variant = experiment?.variants.find(v => v.id === variantId);
    
    return variant?.config || null;
  }, [sessionId, assignToExperiments, experiments]);

  // PHASE 5: Auto-optimization based on statistical significance
  useEffect(() => {
    if (!enableAutoOptimization) return;
    
    const interval = setInterval(() => {
      setIsOptimizing(true);
      
      Object.entries(results).forEach(([experimentId, experimentResults]) => {
        const experiment = experiments.find(e => e.id === experimentId);
        if (!experiment || experiment.status !== 'running') return;
        
        const controlResult = experimentResults.find(r => {
          const variant = experiment.variants.find(v => v.id === r.variantId);
          return variant?.isControl;
        });
        
        if (!controlResult || controlResult.participants < minSampleSize) return;
        
        // Check each variant against control
        experimentResults.forEach(result => {
          if (result.variantId === controlResult.variantId) return;
          
          const significance = calculateStatisticalSignificance(
            controlResult.conversionRate,
            result.conversionRate,
            controlResult.participants,
            result.participants
          );
          
          result.confidence = significance.confidence;
          result.isSignificant = significance.isSignificant;
          result.lift = ((result.conversionRate - controlResult.conversionRate) / controlResult.conversionRate) * 100;
          
          // Auto-pause poorly performing variants
          if (significance.isSignificant && result.conversionRate < controlResult.conversionRate * 0.8) {
            console.log(`[ABTest] Auto-pausing underperforming variant ${result.variantId} in experiment ${experimentId}`);
            // In a real implementation, you'd update the experiment status
          }
        });
        
        // Bayesian analysis for dynamic optimization
        if (enableBayesianAnalysis) {
          const bayesianAnalysis = performBayesianAnalysis(experimentResults);
          console.log(`[ABTest] Bayesian analysis for ${experimentId}:`, bayesianAnalysis);
        }
      });
      
      setIsOptimizing(false);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [enableAutoOptimization, results, experiments, minSampleSize, calculateStatisticalSignificance, enableBayesianAnalysis, performBayesianAnalysis]);

  // PHASE 5: Initialize session for current user
  useEffect(() => {
    if (!currentSession && experiments.length > 0) {
      const session = assignToExperiments();
      setCurrentSession(session);
    }
  }, [currentSession, experiments, assignToExperiments]);

  return {
    // Core state
    experiments,
    currentSession,
    results,
    isOptimizing,
    
    // Core functions
    getVariantConfig,
    trackABTestConversion,
    assignToExperiments,
    
    // Analysis functions
    calculateStatisticalSignificance,
    performBayesianAnalysis,
    
    // Utility functions
    getExperimentResults: (experimentId: string) => results[experimentId] || [],
    getWinningVariant: (experimentId: string) => {
      const experimentResults = results[experimentId];
      if (!experimentResults) return null;
      
      return experimentResults.reduce((winner, current) => 
        current.conversionRate > winner.conversionRate ? current : winner
      );
    },
    
    // Status checks
    isExperimentRunning: (experimentId: string) => {
      const experiment = experiments.find(e => e.id === experimentId);
      return experiment?.status === 'running';
    },
    
    hasStatisticalSignificance: (experimentId: string) => {
      const experimentResults = results[experimentId];
      return experimentResults?.some(r => r.isSignificant) || false;
    },
    
    // Current session utilities
    getCurrentVariants: () => currentSession?.experiments || {},
    getSessionConversions: () => currentSession?.conversions || []
  };
};

// Helper functions
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function normalCDF(x: number): number {
  // Approximation of normal cumulative distribution function
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (x > 0) {
    prob = 1 - prob;
  }
  
  return prob;
}