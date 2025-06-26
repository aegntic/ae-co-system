import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useProgressiveDisclosure } from '../hooks/useProgressiveDisclosure';
import { useUserJourney } from '../hooks/useUserJourney';
import { useABTesting, ABTestMetrics, ABTestResults } from '../components/conversion/ABTestingFramework';
import { 
  PSYCHOLOGICAL_TIMING, 
  AB_TEST_VARIANTS, 
  SOCIAL_PROOF_DATA,
  SUCCESS_TRIGGERS,
  VALUE_PROPOSITIONS
} from '../constants';

// Core types for psychological foundation
export interface PersonalityProfile {
  type: 'analytical' | 'creative' | 'pragmatic' | 'social';
  confidence: number;
  traits: {
    riskTolerance: number;      // 0-100
    socialInfluence: number;    // 0-100
    detailOrientation: number;  // 0-100
    speedPreference: number;    // 0-100
    visualEngagement: number;   // 0-100
  };
  predictedConversionTriggers: string[];
  optimalTimingStrategy: string;
}

export interface PsychologicalState {
  // User profiling
  personalityProfile: PersonalityProfile | null;
  isProfileComplete: boolean;
  
  // Progressive disclosure
  disclosureState: string;
  conversionReadiness: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'peak';
  optimalMoment: boolean;
  
  // A/B testing
  currentTestVariants: Record<string, string>;
  testMetrics: Record<string, ABTestMetrics>;
  
  // Psychological triggers
  activeTriggers: string[];
  triggerHistory: Array<{
    trigger: string;
    timestamp: number;
    effectiveness: number;
    context: any;
  }>;
  
  // Real-time adaptation
  adaptationScore: number;
  recommendedActions: string[];
  nextOptimalTrigger: string | null;
  
  // Performance insights
  sessionInsights: {
    totalEngagementTime: number;
    triggerEffectiveness: Record<string, number>;
    conversionProbability: number;
    personalityConfidence: number;
    recommendedExperience: 'accelerated' | 'standard' | 'detailed' | 'social';
  };
}

export interface PsychologicalFoundationContextType {
  // Core state
  state: PsychologicalState;
  
  // Personality profiling
  updatePersonalityTrait: (trait: keyof PersonalityProfile['traits'], value: number) => void;
  completePersonalityAssessment: (answers: Record<string, any>) => void;
  
  // Trigger management
  activateTrigger: (trigger: string, context?: any) => void;
  evaluateTriggerEffectiveness: (trigger: string, userResponse: 'positive' | 'negative' | 'neutral') => void;
  getOptimalNextTrigger: () => string | null;
  
  // A/B testing integration
  assignToTest: (testName: string, variants: string[]) => string;
  trackTestEvent: (testName: string, eventType: string, data?: any) => void;
  
  // Adaptive recommendations
  getPersonalizedContent: (contentType: string) => any;
  getOptimalTiming: (action: string) => number;
  shouldShowAdvancedFeatures: () => boolean;
  
  // Analytics and insights
  getSessionInsights: () => PsychologicalState['sessionInsights'];
  exportAnalytics: () => any;
  
  // Progressive disclosure integration
  progressiveDisclosure: ReturnType<typeof useProgressiveDisclosure>;
  userJourney: ReturnType<typeof useUserJourney>;
}

const PsychologicalFoundationContext = createContext<PsychologicalFoundationContextType | null>(null);

// Personality assessment logic
const assessPersonalityFromBehavior = (
  interactions: Array<{type: string, timestamp: number, duration?: number}>,
  preferences: Record<string, any>
): PersonalityProfile => {
  let analytical = 0, creative = 0, pragmatic = 0, social = 0;
  let totalWeight = 0;

  // Analyze interaction patterns
  interactions.forEach((interaction, index) => {
    const weight = Math.exp(-index * 0.1); // Recent interactions weighted more
    totalWeight += weight;

    switch (interaction.type) {
      case 'feature_detail_view':
      case 'documentation_read':
      case 'tech_specs_expanded':
        analytical += weight * 25;
        break;
      
      case 'visual_gallery_view':
      case 'demo_interaction':
      case 'color_customization':
        creative += weight * 25;
        break;
      
      case 'quick_start_click':
      case 'skip_tutorial':
      case 'fast_generation':
        pragmatic += weight * 25;
        break;
      
      case 'testimonial_read':
      case 'social_share':
      case 'community_link_click':
        social += weight * 25;
        break;
    }
    
    // Duration-based scoring
    if (interaction.duration) {
      if (interaction.duration > 30000) analytical += weight * 10; // Long engagement = analytical
      if (interaction.duration < 5000) pragmatic += weight * 10;   // Quick actions = pragmatic
    }
  });

  // Normalize scores
  if (totalWeight > 0) {
    analytical /= totalWeight;
    creative /= totalWeight;
    pragmatic /= totalWeight;
    social /= totalWeight;
  }

  // Determine primary type
  const scores = { analytical, creative, pragmatic, social };
  const primaryType = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0] as PersonalityProfile['type'];
  const confidence = Math.max(...Object.values(scores));

  // Calculate traits based on behavior
  const traits = {
    riskTolerance: Math.min(100, (pragmatic + creative) * 1.2),
    socialInfluence: Math.min(100, social * 2),
    detailOrientation: Math.min(100, analytical * 1.5),
    speedPreference: Math.min(100, pragmatic * 1.8),
    visualEngagement: Math.min(100, creative * 1.5)
  };

  // Predict optimal conversion triggers
  const predictedConversionTriggers = [];
  if (analytical > 15) predictedConversionTriggers.push('feature_comparison', 'technical_proof');
  if (creative > 15) predictedConversionTriggers.push('visual_showcase', 'design_customization');
  if (pragmatic > 15) predictedConversionTriggers.push('quick_results', 'time_savings');
  if (social > 15) predictedConversionTriggers.push('social_proof', 'community_benefits');

  // Determine optimal timing strategy
  let optimalTimingStrategy = 'standard';
  if (pragmatic > 20) optimalTimingStrategy = 'immediate';
  else if (analytical > 20) optimalTimingStrategy = 'delayed_detailed';
  else if (social > 20) optimalTimingStrategy = 'social_momentum';
  else if (creative > 20) optimalTimingStrategy = 'visual_buildup';

  return {
    type: primaryType,
    confidence,
    traits,
    predictedConversionTriggers,
    optimalTimingStrategy
  };
};

// Provider component
export const PsychologicalFoundationProvider: React.FC<{
  children: ReactNode;
  enableAdvancedProfiling?: boolean;
  enableRealTimeAdaptation?: boolean;
  debugMode?: boolean;
}> = ({ 
  children, 
  enableAdvancedProfiling = true, 
  enableRealTimeAdaptation = true,
  debugMode = false 
}) => {
  // Core state
  const [state, setState] = useState<PsychologicalState>({
    personalityProfile: null,
    isProfileComplete: false,
    disclosureState: 'initial',
    conversionReadiness: 0,
    engagementLevel: 'low',
    optimalMoment: false,
    currentTestVariants: {},
    testMetrics: {},
    activeTriggers: [],
    triggerHistory: [],
    adaptationScore: 0,
    recommendedActions: [],
    nextOptimalTrigger: null,
    sessionInsights: {
      totalEngagementTime: 0,
      triggerEffectiveness: {},
      conversionProbability: 0,
      personalityConfidence: 0,
      recommendedExperience: 'standard'
    }
  });

  // Interaction tracking
  const [sessionStartTime] = useState(Date.now());
  const [interactions, setInteractions] = useState<Array<{type: string, timestamp: number, duration?: number}>>([]);

  // Hook integrations
  const progressiveDisclosure = useProgressiveDisclosure({
    enableAbTesting: true,
    enablePsychologicalScoring: true,
    personalityType: state.personalityProfile?.type || 'pragmatic',
    targetConversionScore: 75,
    trackingCallback: (milestone) => {
      if (debugMode) console.log('[PsychFoundation] Progressive disclosure milestone:', milestone);
      // Update psychological state based on milestone
      setState(prev => ({
        ...prev,
        conversionReadiness: prev.conversionReadiness + 5,
        sessionInsights: {
          ...prev.sessionInsights,
          conversionProbability: Math.min(100, prev.sessionInsights.conversionProbability + 10)
        }
      }));
    }
  });

  const userJourney = useUserJourney({
    enableTracking: true,
    trackScrollDepth: true,
    trackExitIntent: true,
    personalityType: state.personalityProfile?.type
  });

  // A/B testing setup for hero messaging
  const heroTest = useABTesting({
    testName: 'hero_messaging_v1',
    variants: AB_TEST_VARIANTS.MESSAGING,
    trafficSplit: 0.25,
    enablePsychologicalScoring: true,
    personalityType: state.personalityProfile?.type,
    onVariantAssigned: (variant, userId) => {
      setState(prev => ({
        ...prev,
        currentTestVariants: { ...prev.currentTestVariants, hero_messaging: variant }
      }));
    },
    onConversion: (variant, metrics) => {
      setState(prev => ({
        ...prev,
        testMetrics: { ...prev.testMetrics, hero_messaging: metrics as ABTestMetrics }
      }));
    }
  });

  // Real-time personality assessment
  useEffect(() => {
    if (!enableAdvancedProfiling) return;

    const assessmentTimer = setInterval(() => {
      if (interactions.length >= 3) {
        const profile = assessPersonalityFromBehavior(interactions, {});
        setState(prev => ({
          ...prev,
          personalityProfile: profile,
          isProfileComplete: profile.confidence > 60,
          sessionInsights: {
            ...prev.sessionInsights,
            personalityConfidence: profile.confidence
          }
        }));
      }
    }, 10000); // Assess every 10 seconds

    return () => clearInterval(assessmentTimer);
  }, [interactions, enableAdvancedProfiling]);

  // Real-time adaptation engine
  useEffect(() => {
    if (!enableRealTimeAdaptation || !state.personalityProfile) return;

    const adaptationTimer = setInterval(() => {
      const now = Date.now();
      const sessionDuration = now - sessionStartTime;
      
      // Calculate adaptation score
      let adaptationScore = 0;
      adaptationScore += Math.min(25, sessionDuration / 60000); // Time engagement
      adaptationScore += state.triggerHistory.length * 5; // Trigger interactions
      adaptationScore += state.personalityProfile.confidence * 0.5; // Profile confidence
      
      // Generate recommendations
      const recommendedActions = [];
      if (sessionDuration > 30000 && state.conversionReadiness < 50) {
        recommendedActions.push('show_social_proof');
      }
      if (state.personalityProfile.type === 'pragmatic' && sessionDuration > 60000) {
        recommendedActions.push('show_quick_results');
      }
      if (state.engagementLevel === 'peak' && !state.optimalMoment) {
        recommendedActions.push('optimal_conversion_moment');
      }

      setState(prev => ({
        ...prev,
        adaptationScore,
        recommendedActions,
        sessionInsights: {
          ...prev.sessionInsights,
          totalEngagementTime: sessionDuration,
          recommendedExperience: adaptationScore > 75 ? 'accelerated' : 
                                adaptationScore > 50 ? 'standard' : 
                                adaptationScore > 25 ? 'detailed' : 'social'
        }
      }));
    }, 5000); // Adapt every 5 seconds

    return () => clearInterval(adaptationTimer);
  }, [state.personalityProfile, sessionStartTime, enableRealTimeAdaptation]);

  // Context functions
  const updatePersonalityTrait = useCallback((trait: keyof PersonalityProfile['traits'], value: number) => {
    setState(prev => ({
      ...prev,
      personalityProfile: prev.personalityProfile ? {
        ...prev.personalityProfile,
        traits: { ...prev.personalityProfile.traits, [trait]: value }
      } : null
    }));
  }, []);

  const activateTrigger = useCallback((trigger: string, context?: any) => {
    const now = Date.now();
    setInteractions(prev => [...prev, { type: trigger, timestamp: now }]);
    
    setState(prev => ({
      ...prev,
      activeTriggers: [...prev.activeTriggers, trigger],
      triggerHistory: [...prev.triggerHistory, {
        trigger,
        timestamp: now,
        effectiveness: 0, // Will be updated when evaluated
        context: context || {}
      }]
    }));

    // Track in A/B tests
    heroTest.trackEngagement(trigger);
    
    if (debugMode) console.log('[PsychFoundation] Trigger activated:', trigger, context);
  }, [heroTest, debugMode]);

  const evaluateTriggerEffectiveness = useCallback((trigger: string, userResponse: 'positive' | 'negative' | 'neutral') => {
    const effectiveness = userResponse === 'positive' ? 100 : userResponse === 'neutral' ? 50 : 0;
    
    setState(prev => ({
      ...prev,
      triggerHistory: prev.triggerHistory.map(t => 
        t.trigger === trigger && t.effectiveness === 0 
          ? { ...t, effectiveness }
          : t
      ),
      sessionInsights: {
        ...prev.sessionInsights,
        triggerEffectiveness: {
          ...prev.sessionInsights.triggerEffectiveness,
          [trigger]: effectiveness
        }
      }
    }));
  }, []);

  const getOptimalNextTrigger = useCallback((): string | null => {
    if (!state.personalityProfile) return null;
    
    const { predictedConversionTriggers, type } = state.personalityProfile;
    const unusedTriggers = predictedConversionTriggers.filter(
      trigger => !state.activeTriggers.includes(trigger)
    );
    
    if (unusedTriggers.length === 0) return null;
    
    // Personality-based prioritization
    if (type === 'social' && unusedTriggers.includes('social_proof')) return 'social_proof';
    if (type === 'pragmatic' && unusedTriggers.includes('quick_results')) return 'quick_results';
    if (type === 'analytical' && unusedTriggers.includes('technical_proof')) return 'technical_proof';
    if (type === 'creative' && unusedTriggers.includes('visual_showcase')) return 'visual_showcase';
    
    return unusedTriggers[0];
  }, [state.personalityProfile, state.activeTriggers]);

  const getPersonalizedContent = useCallback((contentType: string) => {
    const variant = state.currentTestVariants.hero_messaging || 'living_websites';
    
    if (contentType === 'hero') {
      return heroTest.getVariantContent('hero');
    }
    
    if (contentType === 'cta') {
      return heroTest.getVariantContent('cta');
    }
    
    if (contentType === 'social_proof') {
      return heroTest.getVariantContent('social_proof');
    }
    
    return null;
  }, [state.currentTestVariants, heroTest]);

  const shouldShowAdvancedFeatures = useCallback(() => {
    return state.personalityProfile?.type === 'analytical' || 
           state.conversionReadiness > 75 ||
           state.sessionInsights.recommendedExperience === 'accelerated';
  }, [state.personalityProfile, state.conversionReadiness, state.sessionInsights]);

  const contextValue: PsychologicalFoundationContextType = {
    state,
    updatePersonalityTrait,
    completePersonalityAssessment: (answers) => {
      // TODO: Implement comprehensive assessment
      console.log('Personality assessment completed:', answers);
    },
    activateTrigger,
    evaluateTriggerEffectiveness,
    getOptimalNextTrigger,
    assignToTest: (testName, variants) => {
      // TODO: Implement dynamic test assignment
      return variants[0];
    },
    trackTestEvent: (testName, eventType, data) => {
      if (testName === 'hero_messaging_v1') {
        heroTest.trackEngagement(eventType);
      }
    },
    getPersonalizedContent,
    getOptimalTiming: (action) => {
      if (!state.personalityProfile) return PSYCHOLOGICAL_TIMING.WOW_MOMENT_ABSORPTION;
      
      switch (state.personalityProfile.optimalTimingStrategy) {
        case 'immediate': return 500;
        case 'delayed_detailed': return PSYCHOLOGICAL_TIMING.PRICING_OPTIMAL_MOMENT;
        case 'social_momentum': return PSYCHOLOGICAL_TIMING.SOCIAL_PROOF_REVEAL;
        case 'visual_buildup': return PSYCHOLOGICAL_TIMING.WOW_MOMENT_ABSORPTION;
        default: return PSYCHOLOGICAL_TIMING.WOW_MOMENT_ABSORPTION;
      }
    },
    shouldShowAdvancedFeatures,
    getSessionInsights: () => state.sessionInsights,
    exportAnalytics: () => ({
      session: state.sessionInsights,
      personality: state.personalityProfile,
      triggers: state.triggerHistory,
      tests: state.testMetrics,
      timestamp: Date.now()
    }),
    progressiveDisclosure,
    userJourney
  };

  return (
    <PsychologicalFoundationContext.Provider value={contextValue}>
      {children}
      {debugMode && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
          <h4 className="font-bold mb-2">🧠 Psych Debug</h4>
          <div>Type: {state.personalityProfile?.type || 'assessing...'}</div>
          <div>Readiness: {state.conversionReadiness}%</div>
          <div>Engagement: {state.engagementLevel}</div>
          <div>Variant: {state.currentTestVariants.hero_messaging || 'default'}</div>
          <div>Experience: {state.sessionInsights.recommendedExperience}</div>
        </div>
      )}
    </PsychologicalFoundationContext.Provider>
  );
};

// Hook to use the psychological foundation
export const usePsychologicalFoundation = () => {
  const context = useContext(PsychologicalFoundationContext);
  if (!context) {
    throw new Error('usePsychologicalFoundation must be used within a PsychologicalFoundationProvider');
  }
  return context;
};

export default PsychologicalFoundationProvider;