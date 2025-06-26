import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AB_TEST_VARIANTS, 
  PSYCHOLOGICAL_TIMING, 
  SOCIAL_PROOF_DATA,
  VALUE_PROPOSITIONS,
  SUCCESS_TRIGGERS
} from '../../constants';

export interface ABTestMetrics {
  variant: string;
  impressions: number;
  engagements: number;
  conversions: number;
  conversionRate: number;
  engagementRate: number;
  psychologicalScore: number;
  averageTimeToConversion: number;
  personalityTypePerformance: Record<string, number>;
}

export interface ABTestOptions {
  testName: string;
  variants: string[];
  trafficSplit?: number; // 0-1, percentage for B variant
  enablePsychologicalScoring?: boolean;
  enablePersonalityTracking?: boolean;
  minSampleSize?: number;
  maxTestDuration?: number; // in milliseconds
  onVariantAssigned?: (variant: string, userId: string) => void;
  onConversion?: (variant: string, metrics: Partial<ABTestMetrics>) => void;
  onTestComplete?: (results: ABTestResults) => void;
}

export interface ABTestResults {
  testName: string;
  duration: number;
  totalSampleSize: number;
  variantMetrics: Record<string, ABTestMetrics>;
  winner?: string;
  confidence: number;
  recommendedAction: string;
  psychologicalInsights: {
    bestPerformingTriggers: string[];
    personalityTypeInsights: Record<string, string>;
    optimalTimingStrategy: string;
  };
}

export interface UseABTestingOptions extends ABTestOptions {
  userId?: string;
  personalityType?: 'analytical' | 'creative' | 'pragmatic' | 'social';
}

export const useABTesting = (options: UseABTestingOptions) => {
  const {
    testName,
    variants,
    trafficSplit = 0.5,
    enablePsychologicalScoring = true,
    enablePersonalityTracking = true,
    minSampleSize = 100,
    maxTestDuration = 7 * 24 * 60 * 60 * 1000, // 7 days
    userId = 'anonymous',
    personalityType = 'pragmatic',
    onVariantAssigned,
    onConversion,
    onTestComplete
  } = options;

  // State management
  const [testData, setTestData] = useState<Record<string, ABTestMetrics>>({});
  const [currentVariant, setCurrentVariant] = useState<string>('');
  const [testStartTime] = useState(Date.now());
  const [userStartTime] = useState(Date.now());
  const [engagementEvents, setEngagementEvents] = useState<Array<{type: string, timestamp: number}>>([]);

  // Variant assignment logic with consistent hashing
  const assignVariant = useCallback(() => {
    // Create deterministic variant assignment based on userId and testName
    const hash = btoa(userId + testName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const normalizedHash = (hash % 100) / 100;
    
    if (variants.length === 2) {
      return normalizedHash < trafficSplit ? variants[1] : variants[0];
    } else {
      // For multiple variants, distribute evenly
      const variantIndex = Math.floor(normalizedHash * variants.length);
      return variants[variantIndex];
    }
  }, [userId, testName, variants, trafficSplit]);

  // Initialize variant assignment
  useEffect(() => {
    const variant = assignVariant();
    setCurrentVariant(variant);
    
    // Initialize metrics for this variant if not exists
    setTestData(prev => ({
      ...prev,
      [variant]: prev[variant] || {
        variant,
        impressions: 0,
        engagements: 0,
        conversions: 0,
        conversionRate: 0,
        engagementRate: 0,
        psychologicalScore: 0,
        averageTimeToConversion: 0,
        personalityTypePerformance: {}
      }
    }));

    onVariantAssigned?.(variant, userId);
  }, [assignVariant, userId, onVariantAssigned]);

  // Track impression
  useEffect(() => {
    if (currentVariant) {
      trackImpression();
    }
  }, [currentVariant]);

  // Psychological scoring calculation
  const calculatePsychologicalScore = useCallback((variant: string, events: Array<{type: string, timestamp: number}>) => {
    if (!enablePsychologicalScoring) return 0;
    
    let score = 0;
    let timeWeight = 1;
    
    events.forEach((event, index) => {
      switch (event.type) {
        case 'hero_view':
          score += 10 * timeWeight;
          break;
        case 'cta_hover':
          score += 15 * timeWeight;
          break;
        case 'form_focus':
          score += 25 * timeWeight;
          break;
        case 'feature_interaction':
          score += 20 * timeWeight;
          break;
        case 'social_proof_view':
          score += 12 * timeWeight;
          break;
        case 'urgency_trigger_view':
          score += 18 * timeWeight;
          break;
        case 'pricing_view':
          score += 30 * timeWeight;
          break;
        default:
          score += 5 * timeWeight;
      }
      
      // Personality type modifiers
      if (enablePersonalityTracking) {
        switch (personalityType) {
          case 'analytical':
            if (event.type === 'feature_interaction' || event.type === 'pricing_view') score += 5;
            break;
          case 'creative':
            if (event.type === 'hero_view' || event.type === 'social_proof_view') score += 5;
            break;
          case 'pragmatic':
            if (event.type === 'cta_hover' || event.type === 'form_focus') score += 5;
            break;
          case 'social':
            if (event.type === 'social_proof_view' || event.type === 'urgency_trigger_view') score += 5;
            break;
        }
      }
      
      timeWeight *= 0.95; // Diminishing returns
    });
    
    // Time-based bonus (faster engagement = higher score)
    if (events.length >= 2) {
      const timeSpan = events[events.length - 1].timestamp - events[0].timestamp;
      const speedBonus = Math.max(0, 20 - (timeSpan / 10000)); // Bonus for quick engagement
      score += speedBonus;
    }
    
    return Math.min(100, Math.max(0, score));
  }, [enablePsychologicalScoring, enablePersonalityTracking, personalityType]);

  // Update metrics helper
  const updateMetrics = useCallback((variant: string, updates: Partial<ABTestMetrics>) => {
    setTestData(prev => {
      const current = prev[variant] || {
        variant,
        impressions: 0,
        engagements: 0,
        conversions: 0,
        conversionRate: 0,
        engagementRate: 0,
        psychologicalScore: 0,
        averageTimeToConversion: 0,
        personalityTypePerformance: {}
      };

      const updated = { ...current, ...updates };
      
      // Recalculate derived metrics
      updated.conversionRate = updated.impressions > 0 ? (updated.conversions / updated.impressions) * 100 : 0;
      updated.engagementRate = updated.impressions > 0 ? (updated.engagements / updated.impressions) * 100 : 0;
      
      // Update personality type performance
      if (enablePersonalityTracking && personalityType) {
        updated.personalityTypePerformance = {
          ...updated.personalityTypePerformance,
          [personalityType]: updated.conversionRate
        };
      }

      return { ...prev, [variant]: updated };
    });
  }, [enablePersonalityTracking, personalityType]);

  // Tracking functions
  const trackImpression = useCallback(() => {
    if (!currentVariant) return;
    
    updateMetrics(currentVariant, {
      impressions: (testData[currentVariant]?.impressions || 0) + 1
    });
  }, [currentVariant, testData, updateMetrics]);

  const trackEngagement = useCallback((eventType: string = 'generic') => {
    if (!currentVariant) return;
    
    const newEvent = { type: eventType, timestamp: Date.now() };
    const updatedEvents = [...engagementEvents, newEvent];
    setEngagementEvents(updatedEvents);
    
    updateMetrics(currentVariant, {
      engagements: (testData[currentVariant]?.engagements || 0) + 1,
      psychologicalScore: calculatePsychologicalScore(currentVariant, updatedEvents)
    });
  }, [currentVariant, engagementEvents, testData, updateMetrics, calculatePsychologicalScore]);

  const trackConversion = useCallback((conversionData?: any) => {
    if (!currentVariant) return;
    
    const timeToConversion = Date.now() - userStartTime;
    const currentMetrics = testData[currentVariant];
    const newConversions = (currentMetrics?.conversions || 0) + 1;
    const newAverageTime = currentMetrics?.averageTimeToConversion 
      ? (currentMetrics.averageTimeToConversion + timeToConversion) / 2
      : timeToConversion;

    updateMetrics(currentVariant, {
      conversions: newConversions,
      averageTimeToConversion: newAverageTime
    });

    onConversion?.(currentVariant, {
      conversions: newConversions,
      averageTimeToConversion: newAverageTime,
      personalityTypePerformance: {
        [personalityType]: (newConversions / (currentMetrics?.impressions || 1)) * 100
      },
      ...conversionData
    });
  }, [currentVariant, userStartTime, testData, updateMetrics, onConversion, personalityType]);

  // Statistical significance calculation
  const calculateSignificance = useCallback(() => {
    const variantKeys = Object.keys(testData);
    if (variantKeys.length < 2) return { confidence: 0, winner: null };

    // Simple chi-square test for two variants
    const [variantA, variantB] = variantKeys;
    const a = testData[variantA];
    const b = testData[variantB];

    if (!a || !b || a.impressions < minSampleSize || b.impressions < minSampleSize) {
      return { confidence: 0, winner: null };
    }

    // Calculate z-score for conversion rate difference
    const p1 = a.conversions / a.impressions;
    const p2 = b.conversions / b.impressions;
    const pPool = (a.conversions + b.conversions) / (a.impressions + b.impressions);
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/a.impressions + 1/b.impressions));
    const zScore = Math.abs(p1 - p2) / se;
    
    // Convert z-score to confidence percentage (simplified)
    const confidence = Math.min(99.9, Math.max(0, (1 - 2 * (1 - (0.5 + 0.5 * Math.erf(zScore / Math.sqrt(2))))) * 100));
    
    const winner = a.conversionRate > b.conversionRate ? variantA : variantB;
    
    return { confidence, winner };
  }, [testData, minSampleSize]);

  // Test completion check
  useEffect(() => {
    const testDuration = Date.now() - testStartTime;
    const totalSampleSize = Object.values(testData).reduce((sum, metrics) => sum + metrics.impressions, 0);
    const { confidence, winner } = calculateSignificance();

    if (
      (confidence > 95 && totalSampleSize > minSampleSize) ||
      testDuration > maxTestDuration ||
      totalSampleSize > minSampleSize * 10
    ) {
      // Test is complete, generate results
      const results: ABTestResults = {
        testName,
        duration: testDuration,
        totalSampleSize,
        variantMetrics: testData,
        winner: winner || undefined,
        confidence,
        recommendedAction: confidence > 95 
          ? `Implement ${winner} variant (${confidence.toFixed(1)}% confidence)`
          : `Continue testing - need ${Math.max(0, minSampleSize - totalSampleSize)} more samples`,
        psychologicalInsights: {
          bestPerformingTriggers: ['social_proof', 'urgency', 'scarcity'], // TODO: Calculate from data
          personalityTypeInsights: {
            analytical: 'Responds best to detailed feature explanations',
            creative: 'Engages strongly with visual elements and social proof',
            pragmatic: 'Converts fastest with clear CTAs and urgency',
            social: 'Influenced heavily by testimonials and community signals'
          },
          optimalTimingStrategy: 'psychological_timing' // TODO: Calculate from data
        }
      };

      onTestComplete?.(results);
    }
  }, [testData, testStartTime, minSampleSize, maxTestDuration, calculateSignificance, testName, onTestComplete]);

  // Get variant-specific content
  const getVariantContent = useCallback((contentType: 'hero' | 'cta' | 'social_proof' | 'urgency') => {
    switch (currentVariant) {
      case 'living_websites':
        return {
          hero: VALUE_PROPOSITIONS.LIVING_WEBSITES,
          cta: 'Create My Living Website',
          social_proof: SOCIAL_PROOF_DATA.testimonials[0].text,
          urgency: SUCCESS_TRIGGERS.network_tease
        }[contentType];
      
      case 'instant_magic':
        return {
          hero: VALUE_PROPOSITIONS.INSTANT_MAGIC,
          cta: 'Experience the Magic',
          social_proof: '"Absolute game changer for my portfolio"',
          urgency: 'Limited time: Free instant magic'
        }[contentType];
      
      case 'developer_focused':
        return {
          hero: 'Elite Developer Portfolio Platform',
          cta: 'Join Elite Community',
          social_proof: SOCIAL_PROOF_DATA.testimonials[1].text,
          urgency: 'Exclusive: Professional developer community'
        }[contentType];
      
      case 'portfolio_builder':
        return {
          hero: VALUE_PROPOSITIONS.WOW_MOMENT,
          cta: 'Build My Portfolio',
          social_proof: 'Perfect for showcasing technical expertise',
          urgency: 'Stand out in the professional network'
        }[contentType];
      
      default:
        return {
          hero: VALUE_PROPOSITIONS.LIVING_WEBSITES,
          cta: 'Get Started',
          social_proof: SOCIAL_PROOF_DATA.testimonials[0].text,
          urgency: SUCCESS_TRIGGERS.network_tease
        }[contentType];
    }
  }, [currentVariant]);

  return {
    // Current test state
    currentVariant,
    testData,
    
    // Tracking functions
    trackImpression,
    trackEngagement,
    trackConversion,
    
    // Metrics
    metrics: testData[currentVariant],
    significanceTest: calculateSignificance(),
    
    // Content helpers
    getVariantContent,
    
    // Test configuration
    testName,
    variants,
    isTestActive: Object.values(testData).reduce((sum, m) => sum + m.impressions, 0) < minSampleSize * 10,
    
    // Psychological insights
    psychologicalScore: testData[currentVariant]?.psychologicalScore || 0,
    personalityType,
    engagementEvents
  };
};

// React component for A/B test visualization (for admin/debug)
export const ABTestingDashboard: React.FC<{
  testResults: ABTestResults[];
  currentTests: ReturnType<typeof useABTesting>[];
}> = ({ testResults, currentTests }) => {
  const [selectedTest, setSelectedTest] = useState<string>('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/90 backdrop-blur-lg border border-gray-700 rounded-xl p-6 max-w-4xl mx-auto"
    >
      <h3 className="text-2xl font-bold text-white mb-6">A/B Testing Dashboard</h3>
      
      {/* Current Active Tests */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Active Tests</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTests.map((test, index) => (
            <motion.div
              key={test.testName}
              className="bg-gray-800/50 border border-gray-600 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <h5 className="font-semibold text-white">{test.testName}</h5>
              <p className="text-sm text-gray-400">Current Variant: {test.currentVariant}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Impressions:</span>
                  <span className="text-white ml-1">{test.metrics?.impressions || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Conversions:</span>
                  <span className="text-white ml-1">{test.metrics?.conversions || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">CVR:</span>
                  <span className="text-white ml-1">{(test.metrics?.conversionRate || 0).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Psych Score:</span>
                  <span className="text-white ml-1">{(test.psychologicalScore || 0).toFixed(0)}</span>
                </div>
              </div>
              
              {test.significanceTest.confidence > 0 && (
                <div className="mt-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded text-xs">
                  <p className="text-blue-300">
                    Confidence: {test.significanceTest.confidence.toFixed(1)}%
                    {test.significanceTest.winner && ` | Winner: ${test.significanceTest.winner}`}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Completed Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-300 mb-4">Completed Tests</h4>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <motion.div
                key={result.testName}
                className="bg-gray-800/30 border border-gray-600 rounded-lg p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold text-white">{result.testName}</h5>
                  <span className="text-xs text-gray-400">
                    {Math.round(result.duration / (1000 * 60 * 60))}h duration
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  {Object.entries(result.variantMetrics).map(([variant, metrics]) => (
                    <div key={variant} className="text-xs">
                      <div className="font-medium text-gray-300">{variant}</div>
                      <div className="text-gray-500">CVR: {metrics.conversionRate.toFixed(1)}%</div>
                      <div className="text-gray-500">Sample: {metrics.impressions}</div>
                    </div>
                  ))}
                </div>
                
                {result.winner && (
                  <div className="p-2 bg-green-500/20 border border-green-400/30 rounded text-xs">
                    <p className="text-green-300 font-medium">
                      🏆 Winner: {result.winner} ({result.confidence.toFixed(1)}% confidence)
                    </p>
                    <p className="text-green-200 mt-1">{result.recommendedAction}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default { useABTesting, ABTestingDashboard };