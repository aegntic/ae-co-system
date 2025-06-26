import { useState, useEffect, useCallback } from 'react';
import { DISCLOSURE_STATES, AB_TEST_VARIANTS, PSYCHOLOGICAL_TIMING } from '../constants';

export interface ProgressiveDisclosureState {
  disclosureState: string;
  showPricingTiers: boolean;
  userJourneyStep: number;
  successMilestones: SuccessMilestone[];
  abTestVariant: string;
  psychologicalScore: number;
  engagementLevel: 'low' | 'medium' | 'high' | 'peak';
  conversionReadiness: number;
  optimalMoment: boolean;
}

export interface SuccessMilestone {
  type: 'generation' | 'deployment' | 'engagement' | 'conversion' | 'psychological';
  timestamp: number;
  data?: any;
}

export interface UseProgressiveDisclosureOptions {
  enableAbTesting?: boolean;
  enableTracking?: boolean;
  enablePsychologicalScoring?: boolean;
  personalityType?: 'analytical' | 'creative' | 'pragmatic' | 'social';
  targetConversionScore?: number;
  delayBeforeReveal?: number;
  trackingCallback?: (milestone: SuccessMilestone) => void;
}

export const useProgressiveDisclosure = (options: UseProgressiveDisclosureOptions = {}) => {
  const {
    enableAbTesting = true,
    enableTracking = true,
    enablePsychologicalScoring = true,
    personalityType = 'pragmatic',
    targetConversionScore = 75,
    delayBeforeReveal = 3000,
    trackingCallback
  } = options;

  // Core state with psychological insights
  const [state, setState] = useState<ProgressiveDisclosureState>({
    disclosureState: DISCLOSURE_STATES.INITIAL,
    showPricingTiers: false,
    userJourneyStep: 0,
    successMilestones: [],
    abTestVariant: enableAbTesting 
      ? AB_TEST_VARIANTS.SUCCESS_FLOW[Math.floor(Math.random() * AB_TEST_VARIANTS.SUCCESS_FLOW.length)]
      : 'immediate_upsell',
    psychologicalScore: 0,
    engagementLevel: 'low',
    conversionReadiness: 0,
    optimalMoment: false
  });

  // PHASE 1: Advanced psychological scoring system
  const calculatePsychologicalScore = useCallback((milestones: SuccessMilestone[]) => {
    let score = 0;
    let timeWeight = 1;
    
    milestones.forEach((milestone, index) => {
      switch (milestone.type) {
        case 'generation':
          score += 30 * timeWeight; // Higher weight for quick generation
          break;
        case 'deployment':
          score += 45 * timeWeight; // Highest weight for deployment success
          break;
        case 'engagement':
          score += 15 * timeWeight; // Medium weight for engagement
          break;
        case 'psychological':
          score += 20 * timeWeight; // Custom psychological triggers
          break;
        case 'conversion':
          score += 35 * timeWeight; // High conversion intent
          break;
      }
      
      // Personality type modifiers
      if (personalityType === 'analytical' && milestone.type === 'engagement') {
        score += 10; // Analytical users value exploration
      } else if (personalityType === 'creative' && milestone.type === 'generation') {
        score += 15; // Creative users get excited by generation
      } else if (personalityType === 'pragmatic' && milestone.type === 'deployment') {
        score += 10; // Pragmatic users care about results
      } else if (personalityType === 'social' && milestone.type === 'psychological') {
        score += 12; // Social users respond to psychological cues
      }
      
      timeWeight *= 0.95; // Diminishing returns over time
    });
    
    // Time-based multiplier (faster completion = higher score)
    if (milestones.length >= 2) {
      const timeSpan = milestones[milestones.length - 1].timestamp - milestones[0].timestamp;
      const speedBonus = Math.max(0, 25 - (timeSpan / 30000)); // Bonus for < 30 seconds
      score += speedBonus;
    }
    
    return Math.min(100, Math.max(0, score));
  }, [personalityType]);

  // PHASE 1: Engagement level calculation
  const calculateEngagementLevel = useCallback((score: number, milestones: SuccessMilestone[]) => {
    if (score >= 80) return 'peak';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }, []);

  // PHASE 1: Conversion readiness percentage
  const calculateConversionReadiness = useCallback((score: number, engagementLevel: string) => {
    let readiness = score;
    
    // Engagement level modifiers
    switch (engagementLevel) {
      case 'peak':
        readiness += 15;
        break;
      case 'high':
        readiness += 10;
        break;
      case 'medium':
        readiness += 5;
        break;
      default:
        break;
    }
    
    return Math.min(100, Math.max(0, readiness));
  }, []);

  // PHASE 1: Optimal moment detection
  const detectOptimalMoment = useCallback((readiness: number, milestones: SuccessMilestone[]) => {
    if (readiness < targetConversionScore) return false;
    
    // Check if we have both generation and deployment success
    const hasGeneration = milestones.some(m => m.type === 'generation');
    const hasDeployment = milestones.some(m => m.type === 'deployment');
    
    return hasGeneration && hasDeployment && readiness >= targetConversionScore;
  }, [targetConversionScore]);

  // PHASE 1: Enhanced milestone tracking with psychological insights
  const trackMilestone = useCallback((milestone: SuccessMilestone) => {
    if (!enableTracking) return;
    
    setState(prev => {
      const newMilestones = [...prev.successMilestones, milestone];
      const newScore = enablePsychologicalScoring ? calculatePsychologicalScore(newMilestones) : prev.psychologicalScore;
      const newEngagement = calculateEngagementLevel(newScore, newMilestones);
      const newReadiness = calculateConversionReadiness(newScore, newEngagement);
      const isOptimalMoment = detectOptimalMoment(newReadiness, newMilestones);
      
      return {
        ...prev,
        successMilestones: newMilestones,
        psychologicalScore: newScore,
        engagementLevel: newEngagement,
        conversionReadiness: newReadiness,
        optimalMoment: isOptimalMoment
      };
    });

    // Optional external tracking with psychological data
    if (trackingCallback) {
      trackingCallback(milestone);
    }

    // Enhanced analytics logging
    console.log('[ProgressiveDisclosure] Milestone achieved:', {
      ...milestone,
      psychologicalContext: {
        personalityType,
        targetScore: targetConversionScore,
        enabledScoring: enablePsychologicalScoring
      }
    });
  }, [enableTracking, trackingCallback, enablePsychologicalScoring, calculatePsychologicalScore, calculateEngagementLevel, calculateConversionReadiness, detectOptimalMoment, personalityType, targetConversionScore]);

  // PHASE 1: Psychological trigger tracking
  const trackPsychologicalTrigger = useCallback((triggerType: string, data?: any) => {
    const milestone: SuccessMilestone = {
      type: 'psychological',
      timestamp: Date.now(),
      data: { triggerType, ...data }
    };
    
    trackMilestone(milestone);
  }, [trackMilestone]);

  // Handle generation success
  const handleGenerationSuccess = useCallback((data?: any) => {
    trackMilestone({
      type: 'generation',
      timestamp: Date.now(),
      data
    });

    setState(prev => ({
      ...prev,
      disclosureState: DISCLOSURE_STATES.POST_GENERATION
    }));
  }, [trackMilestone]);

  // Handle deployment success
  const handleDeploymentSuccess = useCallback((data?: any) => {
    trackMilestone({
      type: 'deployment',
      timestamp: Date.now(),
      data
    });

    setState(prev => {
      if (prev.disclosureState === DISCLOSURE_STATES.INITIAL || 
          prev.disclosureState === DISCLOSURE_STATES.POST_GENERATION) {
        
        // Apply A/B test timing
        const delay = prev.abTestVariant === 'immediate_upsell' ? 0 : delayBeforeReveal;
        
        setTimeout(() => {
          setState(current => ({
            ...current,
            disclosureState: DISCLOSURE_STATES.POST_DEPLOYMENT,
            showPricingTiers: true,
            userJourneyStep: 1
          }));
        }, delay);

        return {
          ...prev,
          disclosureState: DISCLOSURE_STATES.POST_DEPLOYMENT
        };
      }
      return prev;
    });
  }, [trackMilestone, delayBeforeReveal]);

  // Handle engagement actions
  const handleEngagement = useCallback((type: string, data?: any) => {
    trackMilestone({
      type: 'engagement',
      timestamp: Date.now(),
      data: { type, ...data }
    });
  }, [trackMilestone]);

  // Handle conversion readiness
  const handleConversionReadiness = useCallback(() => {
    setState(prev => ({
      ...prev,
      disclosureState: DISCLOSURE_STATES.CONVERSION_READY,
      showPricingTiers: true,
      userJourneyStep: 2
    }));

    trackMilestone({
      type: 'conversion',
      timestamp: Date.now(),
      data: { readiness: true }
    });
  }, [trackMilestone]);

  // Calculate conversion score based on milestones
  const getConversionScore = useCallback(() => {
    const { successMilestones } = state;
    let score = 0;

    // Base scores for milestone types
    successMilestones.forEach(milestone => {
      switch (milestone.type) {
        case 'generation':
          score += 25;
          break;
        case 'deployment':
          score += 40;
          break;
        case 'engagement':
          score += 10;
          break;
        case 'conversion':
          score += 25;
          break;
      }
    });

    // Time-based bonus (faster completion = higher score)
    if (successMilestones.length >= 2) {
      const timeSpan = successMilestones[successMilestones.length - 1].timestamp - successMilestones[0].timestamp;
      const timeBonus = Math.max(0, 20 - (timeSpan / 60000)); // Bonus decreases over time
      score += timeBonus;
    }

    return Math.min(100, score);
  }, [state]);

  // PHASE 1: Personalized upsell timing based on psychological profile
  const getPersonalizedUpsellTiming = useCallback(() => {
    const { psychologicalScore, engagementLevel, abTestVariant, conversionReadiness } = state;

    // Personality-based timing adjustments
    let timingStrategy = abTestVariant;
    
    if (personalityType === 'analytical' && conversionReadiness < 70) {
      timingStrategy = 'delayed_reveal'; // Analytical users need more info
    } else if (personalityType === 'creative' && engagementLevel === 'peak') {
      timingStrategy = 'immediate_upsell'; // Creative users act on emotion
    } else if (personalityType === 'pragmatic' && psychologicalScore > 80) {
      timingStrategy = 'milestone_based'; // Pragmatic users prefer milestone-based
    } else if (personalityType === 'social' && conversionReadiness > 60) {
      timingStrategy = 'psychological_timing'; // Social users respond to social cues
    }

    switch (timingStrategy) {
      case 'immediate_upsell':
        return 'immediate';
      case 'delayed_reveal':
        return conversionReadiness > 60 ? 'delayed_optimal' : 'delayed_extended';
      case 'milestone_based':
        return psychologicalScore > 75 ? 'milestone_high' : 'milestone_standard';
      case 'psychological_timing':
        return state.optimalMoment ? 'optimal_now' : 'wait_for_optimal';
      default:
        return 'standard';
    }
  }, [state, personalityType]);

  // Get recommended upsell timing (legacy support)
  const getUpsellTiming = useCallback(() => {
    return getPersonalizedUpsellTiming();
  }, [getPersonalizedUpsellTiming]);

  // Reset disclosure state
  const resetDisclosure = useCallback(() => {
    setState({
      disclosureState: DISCLOSURE_STATES.INITIAL,
      showPricingTiers: false,
      userJourneyStep: 0,
      successMilestones: [],
      abTestVariant: enableAbTesting 
        ? AB_TEST_VARIANTS.SUCCESS_FLOW[Math.floor(Math.random() * AB_TEST_VARIANTS.SUCCESS_FLOW.length)]
        : 'immediate_upsell'
    });
  }, [enableAbTesting]);

  return {
    // State
    ...state,
    
    // Actions
    handleGenerationSuccess,
    handleDeploymentSuccess,
    handleEngagement,
    handleConversionReadiness,
    resetDisclosure,
    trackPsychologicalTrigger,
    
    // Analytics
    getConversionScore,
    getUpsellTiming,
    getPersonalizedUpsellTiming,
    
    // PHASE 1: Enhanced computed properties with psychological insights
    isReady: state.disclosureState !== DISCLOSURE_STATES.INITIAL,
    shouldShowPricing: state.showPricingTiers,
    currentStep: state.userJourneyStep,
    milestoneCount: state.successMilestones.length,
    isPremiumReady: state.conversionReadiness > 70,
    isConversionReady: state.conversionReadiness > targetConversionScore,
    psychologicalInsights: {
      personalityType,
      score: state.psychologicalScore,
      engagement: state.engagementLevel,
      readiness: state.conversionReadiness,
      optimalMoment: state.optimalMoment,
      recommendedTiming: getPersonalizedUpsellTiming()
    }
  };
};