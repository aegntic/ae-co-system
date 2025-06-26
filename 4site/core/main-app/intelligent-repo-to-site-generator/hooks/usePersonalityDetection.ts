import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserJourney } from './useUserJourney';

export interface PersonalityIndicators {
  analyticalScore: number;
  creativeScore: number;
  pragmaticScore: number;
  socialScore: number;
  confidenceLevel: number;
}

export interface BehaviorPattern {
  type: 'exploration' | 'decisiveness' | 'social_seeking' | 'information_gathering';
  intensity: number;
  timestamp: number;
  context: Record<string, any>;
}

export interface PersonalityInsights {
  dominantType: 'analytical' | 'creative' | 'pragmatic' | 'social';
  secondaryType: 'analytical' | 'creative' | 'pragmatic' | 'social';
  confidence: number;
  behaviors: BehaviorPattern[];
  recommendations: PersonalityRecommendation[];
}

export interface PersonalityRecommendation {
  type: 'messaging' | 'timing' | 'presentation' | 'social_proof';
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UsePersonalityDetectionOptions {
  enableRealTimeDetection?: boolean;
  enableBehaviorTracking?: boolean;
  confidenceThreshold?: number;
  adaptationSpeed?: 'slow' | 'medium' | 'fast';
}

export const usePersonalityDetection = (options: UsePersonalityDetectionOptions = {}) => {
  const {
    enableRealTimeDetection = true,
    enableBehaviorTracking = true,
    confidenceThreshold = 70,
    adaptationSpeed = 'medium'
  } = options;

  const { events, trackInteraction } = useUserJourney();
  
  const [indicators, setIndicators] = useState<PersonalityIndicators>({
    analyticalScore: 25,
    creativeScore: 25,
    pragmaticScore: 25,
    socialScore: 25,
    confidenceLevel: 0
  });
  
  const [behaviors, setBehaviors] = useState<BehaviorPattern[]>([]);
  const [insights, setInsights] = useState<PersonalityInsights | null>(null);
  
  // Behavior analysis weights based on adaptation speed
  const analysisWeights = useRef({
    slow: { recent: 0.3, historical: 0.7 },
    medium: { recent: 0.5, historical: 0.5 },
    fast: { recent: 0.7, historical: 0.3 }
  }[adaptationSpeed]);

  // PHASE 5: Advanced behavior pattern detection
  const detectBehaviorPattern = useCallback((event: any): BehaviorPattern | null => {
    const patterns: Record<string, BehaviorPattern> = {
      // Analytical patterns
      detailed_exploration: {
        type: 'exploration',
        intensity: event.data?.scrollDepth > 75 ? 0.8 : 0.5,
        timestamp: event.timestamp,
        context: { trigger: 'deep_scroll', depth: event.data?.scrollDepth }
      },
      
      // Creative patterns  
      visual_engagement: {
        type: 'exploration',
        intensity: event.data?.element?.includes('visual') ? 0.9 : 0.6,
        timestamp: event.timestamp,
        context: { trigger: 'visual_interaction', element: event.data?.element }
      },
      
      // Pragmatic patterns
      quick_decision: {
        type: 'decisiveness',
        intensity: event.data?.sessionDuration < 60000 ? 0.8 : 0.4,
        timestamp: event.timestamp,
        context: { trigger: 'fast_action', duration: event.data?.sessionDuration }
      },
      
      // Social patterns
      social_proof_seeking: {
        type: 'social_seeking',
        intensity: event.data?.element?.includes('testimonial') ? 0.9 : 0.7,
        timestamp: event.timestamp,
        context: { trigger: 'social_interaction', element: event.data?.element }
      }
    };

    // Pattern matching logic
    if (event.type === 'interaction') {
      if (event.data?.action === 'scroll' && event.data?.depth > 50) {
        return patterns.detailed_exploration;
      }
      if (event.data?.element?.includes('demo') || event.data?.element?.includes('preview')) {
        return patterns.visual_engagement;
      }
      if (event.data?.action === 'click' && event.data?.sessionDuration < 120000) {
        return patterns.quick_decision;
      }
      if (event.data?.element?.includes('social') || event.data?.element?.includes('proof')) {
        return patterns.social_proof_seeking;
      }
    }
    
    return null;
  }, []);

  // PHASE 5: Sophisticated personality scoring algorithm
  const calculatePersonalityScores = useCallback((patterns: BehaviorPattern[]) => {
    const weights = analysisWeights.current;
    const recentCutoff = Date.now() - (5 * 60 * 1000); // Last 5 minutes
    
    const recentPatterns = patterns.filter(p => p.timestamp > recentCutoff);
    const historicalPatterns = patterns.filter(p => p.timestamp <= recentCutoff);
    
    const scores = {
      analytical: 0,
      creative: 0,
      pragmatic: 0,
      social: 0
    };
    
    // Score recent patterns
    recentPatterns.forEach(pattern => {
      const intensity = pattern.intensity * weights.recent;
      
      switch (pattern.type) {
        case 'exploration':
          if (pattern.context.trigger === 'deep_scroll') {
            scores.analytical += intensity * 20;
          } else if (pattern.context.trigger === 'visual_interaction') {
            scores.creative += intensity * 25;
          }
          break;
        case 'decisiveness':
          scores.pragmatic += intensity * 30;
          break;
        case 'social_seeking':
          scores.social += intensity * 25;
          break;
        case 'information_gathering':
          scores.analytical += intensity * 22;
          break;
      }
    });
    
    // Score historical patterns
    historicalPatterns.forEach(pattern => {
      const intensity = pattern.intensity * weights.historical;
      
      switch (pattern.type) {
        case 'exploration':
          if (pattern.context.trigger === 'deep_scroll') {
            scores.analytical += intensity * 15;
          } else {
            scores.creative += intensity * 18;
          }
          break;
        case 'decisiveness':
          scores.pragmatic += intensity * 22;
          break;
        case 'social_seeking':
          scores.social += intensity * 20;
          break;
      }
    });
    
    // Normalize scores to 0-100 range
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const normalized = total > 0 ? {
      analyticalScore: Math.round((scores.analytical / total) * 100),
      creativeScore: Math.round((scores.creative / total) * 100),
      pragmaticScore: Math.round((scores.pragmatic / total) * 100),
      socialScore: Math.round((scores.social / total) * 100),
      confidenceLevel: Math.min(100, patterns.length * 8) // Confidence grows with data
    } : indicators;
    
    return normalized;
  }, [indicators, analysisWeights]);

  // PHASE 5: Generate personality-based recommendations
  const generateRecommendations = useCallback((personalityType: string, confidence: number): PersonalityRecommendation[] => {
    const recommendations: PersonalityRecommendation[] = [];
    
    if (confidence < confidenceThreshold) {
      recommendations.push({
        type: 'timing',
        action: 'Extend observation period',
        rationale: 'Need more data for reliable personality detection',
        priority: 'medium'
      });
    }
    
    switch (personalityType) {
      case 'analytical':
        recommendations.push(
          {
            type: 'messaging',
            action: 'Emphasize technical details and data',
            rationale: 'Analytical users prefer detailed information',
            priority: 'high'
          },
          {
            type: 'timing',
            action: 'Delay conversion prompts until engagement peak',
            rationale: 'Analytical users need time to evaluate',
            priority: 'high'
          },
          {
            type: 'social_proof',
            action: 'Show technical testimonials and metrics',
            rationale: 'Data-driven social proof resonates better',
            priority: 'medium'
          }
        );
        break;
        
      case 'creative':
        recommendations.push(
          {
            type: 'presentation',
            action: 'Highlight visual demos and examples',
            rationale: 'Creative users are visually driven',
            priority: 'high'
          },
          {
            type: 'timing',
            action: 'Use immediate emotional triggers',
            rationale: 'Creative users respond to instant inspiration',
            priority: 'high'
          },
          {
            type: 'messaging',
            action: 'Focus on creative potential and possibilities',
            rationale: 'Emphasize creative expression opportunities',
            priority: 'medium'
          }
        );
        break;
        
      case 'pragmatic':
        recommendations.push(
          {
            type: 'messaging',
            action: 'Emphasize ROI and practical benefits',
            rationale: 'Pragmatic users want clear value propositions',
            priority: 'high'
          },
          {
            type: 'timing',
            action: 'Present options immediately after success',
            rationale: 'Pragmatic users decide quickly when value is clear',
            priority: 'high'
          },
          {
            type: 'presentation',
            action: 'Show time-saving and efficiency gains',
            rationale: 'Focus on practical outcomes',
            priority: 'medium'
          }
        );
        break;
        
      case 'social':
        recommendations.push(
          {
            type: 'social_proof',
            action: 'Highlight community and peer usage',
            rationale: 'Social users are influenced by peer behavior',
            priority: 'high'
          },
          {
            type: 'messaging',
            action: 'Emphasize networking and community benefits',
            rationale: 'Social connection is a key motivator',
            priority: 'high'
          },
          {
            type: 'timing',
            action: 'Use social momentum and FOMO triggers',
            rationale: 'Social users respond to group dynamics',
            priority: 'medium'
          }
        );
        break;
    }
    
    return recommendations;
  }, [confidenceThreshold]);

  // PHASE 5: Real-time personality analysis
  useEffect(() => {
    if (!enableRealTimeDetection || !enableBehaviorTracking) return;
    
    // Analyze latest events for behavior patterns
    const latestEvents = events.slice(-5); // Analyze last 5 events
    const newPatterns: BehaviorPattern[] = [];
    
    latestEvents.forEach(event => {
      const pattern = detectBehaviorPattern(event);
      if (pattern) {
        newPatterns.push(pattern);
      }
    });
    
    if (newPatterns.length > 0) {
      setBehaviors(prev => {
        const updated = [...prev, ...newPatterns];
        // Keep only last 50 patterns for performance
        return updated.slice(-50);
      });
    }
  }, [events, enableRealTimeDetection, enableBehaviorTracking, detectBehaviorPattern]);

  // PHASE 5: Update personality indicators when behaviors change
  useEffect(() => {
    if (behaviors.length === 0) return;
    
    const newIndicators = calculatePersonalityScores(behaviors);
    setIndicators(newIndicators);
    
    // Generate insights when confidence is sufficient
    if (newIndicators.confidenceLevel >= confidenceThreshold) {
      const scores = {
        analytical: newIndicators.analyticalScore,
        creative: newIndicators.creativeScore,
        pragmatic: newIndicators.pragmaticScore,
        social: newIndicators.socialScore
      };
      
      const dominantType = Object.entries(scores).reduce((a, b) => 
        scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
      )[0] as PersonalityInsights['dominantType'];
      
      const remainingScores = { ...scores };
      delete remainingScores[dominantType];
      const secondaryType = Object.entries(remainingScores).reduce((a, b) => 
        remainingScores[a[0] as keyof typeof remainingScores] > remainingScores[b[0] as keyof typeof remainingScores] ? a : b
      )[0] as PersonalityInsights['secondaryType'];
      
      const recommendations = generateRecommendations(dominantType, newIndicators.confidenceLevel);
      
      setInsights({
        dominantType,
        secondaryType,
        confidence: newIndicators.confidenceLevel,
        behaviors: behaviors.slice(-10), // Keep recent behaviors
        recommendations
      });
    }
  }, [behaviors, calculatePersonalityScores, confidenceThreshold, generateRecommendations]);

  // PHASE 5: Track personality-specific interactions
  const trackPersonalityInteraction = useCallback((interactionType: string, data?: Record<string, any>) => {
    trackInteraction('personality_interaction', interactionType, {
      ...data,
      personalityContext: insights ? {
        dominantType: insights.dominantType,
        confidence: insights.confidence
      } : null
    });
  }, [trackInteraction, insights]);

  // PHASE 5: Get personalized content strategy
  const getPersonalizedStrategy = useCallback(() => {
    if (!insights || insights.confidence < confidenceThreshold) {
      return {
        messagingStyle: 'balanced',
        timingStrategy: 'standard',
        socialProofType: 'mixed',
        contentFocus: 'general'
      };
    }
    
    const { dominantType, secondaryType } = insights;
    
    const strategies = {
      analytical: {
        messagingStyle: 'data_driven',
        timingStrategy: 'delayed_detailed',
        socialProofType: 'metrics_based',
        contentFocus: 'technical_depth'
      },
      creative: {
        messagingStyle: 'inspirational',
        timingStrategy: 'emotional_peak',
        socialProofType: 'visual_testimonials',
        contentFocus: 'creative_potential'
      },
      pragmatic: {
        messagingStyle: 'value_focused',
        timingStrategy: 'immediate_roi',
        socialProofType: 'case_studies',
        contentFocus: 'practical_benefits'
      },
      social: {
        messagingStyle: 'community_oriented',
        timingStrategy: 'social_momentum',
        socialProofType: 'peer_validation',
        contentFocus: 'networking_benefits'
      }
    };
    
    return {
      ...strategies[dominantType],
      secondaryInfluence: strategies[secondaryType],
      confidence: insights.confidence
    };
  }, [insights, confidenceThreshold]);

  return {
    // Core state
    indicators,
    behaviors,
    insights,
    
    // Analysis functions
    trackPersonalityInteraction,
    getPersonalizedStrategy,
    
    // Computed properties
    isDetectionReliable: indicators.confidenceLevel >= confidenceThreshold,
    dominantPersonality: insights?.dominantType || 'unknown',
    personalityConfidence: insights?.confidence || 0,
    hasRecommendations: insights?.recommendations.length > 0,
    
    // Utility functions
    getTopRecommendations: () => insights?.recommendations.filter(r => r.priority === 'high') || [],
    getBehaviorSummary: () => {
      const recentBehaviors = behaviors.slice(-10);
      const types = recentBehaviors.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return types;
    }
  };
};