import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassHeroSection } from '../landing/GlassHeroSection';
import { GlassFeaturesSection } from '../landing/GlassFeaturesSection';
import { TierPricingSection } from '../pricing/TierPricingSection';
import { PolarIntegrationSection } from '../integration/PolarIntegrationSection';
import { GlassFooter } from '../landing/GlassFooter';
import { useProgressiveDisclosure } from '../../hooks/useProgressiveDisclosure';
import { DISCLOSURE_STATES, SUCCESS_TRIGGERS, VALUE_PROPOSITIONS, PSYCHOLOGICAL_TIMING } from '../../constants';

interface UpdatedMainSectionProps {
  onGenerateSite: (url: string) => void;
  onSelectTier?: (tier: string) => void;
  onUpgrade?: (tier: string) => void;
  // PHASE 1: Enhanced psychological props
  showProgressiveFeatures?: boolean;
  generationSuccess?: boolean;
  deploymentSuccess?: boolean;
  enablePsychologicalFlow?: boolean;
  personalityType?: 'analytical' | 'creative' | 'pragmatic' | 'social';
  abTestVariant?: string;
}

export const UpdatedMainSection: React.FC<UpdatedMainSectionProps> = ({ 
  onGenerateSite, 
  onSelectTier, 
  onUpgrade,
  showProgressiveFeatures = false,
  generationSuccess = false,
  deploymentSuccess = false,
  enablePsychologicalFlow = true,
  personalityType = 'pragmatic',
  abTestVariant = 'living_websites'
}) => {
  // PHASE 1: Enhanced progressive disclosure with psychological insights
  const progressiveDisclosure = useProgressiveDisclosure({
    enableAbTesting: true,
    enableTracking: true,
    enablePsychologicalScoring: enablePsychologicalFlow,
    personalityType,
    targetConversionScore: 75,
    trackingCallback: (milestone) => {
      console.log('[UpdatedMainSection] Milestone tracked:', milestone);
      // Here you could send to analytics service
    }
  });
  
  const {
    disclosureState,
    showPricingTiers,
    userJourneyStep,
    psychologicalScore,
    engagementLevel,
    conversionReadiness,
    handleGenerationSuccess,
    handleDeploymentSuccess,
    trackPsychologicalTrigger,
    getPersonalizedUpsellTiming,
    isPremiumReady,
    isConversionReady,
    optimalMoment
  } = progressiveDisclosure;
  
  // Legacy state for backward compatibility
  const [showPricingTiersLegacy, setShowPricingTiersLegacy] = useState(false);
  const [userJourneyStepLegacy, setUserJourneyStepLegacy] = useState(0);

  // PHASE 1: Enhanced success milestone tracking with psychological timing
  useEffect(() => {
    if (generationSuccess) {
      handleGenerationSuccess({ timestamp: Date.now() });
      trackPsychologicalTrigger('generation_success');
    }
  }, [generationSuccess, handleGenerationSuccess, trackPsychologicalTrigger]);
  
  useEffect(() => {
    if (deploymentSuccess) {
      handleDeploymentSuccess({ timestamp: Date.now() });
      trackPsychologicalTrigger('deployment_success');
      
      // Apple-esque timing based on psychological readiness
      const optimalDelay = getPersonalizedUpsellTiming() === 'immediate' 
        ? PSYCHOLOGICAL_TIMING.WOW_MOMENT_ABSORPTION
        : PSYCHOLOGICAL_TIMING.PRICING_OPTIMAL_MOMENT;
      
      setTimeout(() => {
        setShowPricingTiersLegacy(true);
        setUserJourneyStepLegacy(1);
        trackPsychologicalTrigger('pricing_reveal', { 
          timing: optimalDelay, 
          conversionReadiness,
          engagementLevel 
        });
      }, optimalDelay);
    }
  }, [deploymentSuccess, handleDeploymentSuccess, trackPsychologicalTrigger, getPersonalizedUpsellTiming, conversionReadiness, engagementLevel]);

  const handleShowAdvancedFeatures = () => {
    trackPsychologicalTrigger('advanced_features_request', {
      psychologicalScore,
      engagementLevel,
      conversionReadiness
    });
    
    setShowPricingTiersLegacy(true);
    setUserJourneyStepLegacy(2);
  };
  
  // Enhanced tier selection with psychological insights
  const handleTierSelection = (tier: string) => {
    trackPsychologicalTrigger('tier_selection', {
      tier,
      psychologicalScore,
      conversionReadiness,
      optimalMoment
    });
    
    if (onSelectTier) {
      onSelectTier(tier);
    }
  };
  
  // Enhanced upgrade handling
  const handleUpgrade = (tier: string) => {
    trackPsychologicalTrigger('upgrade_conversion', {
      tier,
      finalScore: psychologicalScore,
      conversionPath: getPersonalizedUpsellTiming()
    });
    
    if (onUpgrade) {
      onUpgrade(tier);
    }
  };

  return (
    <div className="relative">
      {/* PHASE 1: Enhanced hero with psychological triggers */}
      <GlassHeroSection 
        onGenerateSite={onGenerateSite} 
        onShowModeSelection={showPricingTiers || showPricingTiersLegacy ? handleShowAdvancedFeatures : undefined}
        abTestVariant={abTestVariant}
        enablePsychologicalTriggers={enablePsychologicalFlow}
      />

      {/* Always show features - builds anticipation */}
      <GlassFeaturesSection />

      {/* ALWAYS SHOW: Core Value Proposition - Builds Anticipation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card"
          >
            <div className="glass-card-content p-8 text-center">
              <motion.h2 
                className="text-3xl font-light text-white mb-6"
                animate={optimalMoment ? {
                  textShadow: [
                    '0 0 0 rgba(255, 215, 0, 0)',
                    '0 0 20px rgba(255, 215, 0, 0.3)',
                    '0 0 0 rgba(255, 215, 0, 0)'
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                The Real Magic: <span className="font-medium bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Living Websites That Update Themselves</span>
              </motion.h2>
              
              {/* Psychological score indicator (dev mode) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-white/50 mb-4 font-mono">
                  Score: {psychologicalScore} | Engagement: {engagementLevel} | Readiness: {conversionReadiness}%
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-4xl mb-3">⚡</div>
                  <h3 className="text-lg font-semibold text-white mb-2">30 Second Transform</h3>
                  <p className="text-sm text-white/70">Watch your GitHub repository become a stunning professional website in under 30 seconds. Pure magic.</p>
                </div>
                <div>
                  <div className="text-4xl mb-3">🔄</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Living Websites</h3>
                  <p className="text-sm text-white/70">Your website updates itself and creates professional blog posts at development milestones automatically.</p>
                </div>
                <div>
                  <div className="text-4xl mb-3">🏗️</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Focus on Building</h3>
                  <p className="text-sm text-white/70">Concentrate on what you do best - developing great software. We handle everything else automatically.</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6">
                <h4 className="text-xl font-semibold text-white mb-4">"✨ Instant Magic, Zero Complexity ✨"</h4>
                <p className="text-white/80 leading-relaxed">
                  {VALUE_PROPOSITIONS.PHILOSOPHY} Every feature enhances your existing development workflow 
                  without adding any learning curve. We integrate seamlessly with GitHub and amplify what you're already building.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROGRESSIVE DISCLOSURE: Only show after success moments */}
      <AnimatePresence>
        {showPricingTiers && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* PHASE 1: Enhanced success-triggered upgrade with psychological timing */}
            {(disclosureState === DISCLOSURE_STATES.POST_DEPLOYMENT || deploymentSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 px-4 sm:px-6 lg:px-8 text-center"
              >
                <div className="max-w-4xl mx-auto">
                  <motion.div 
                    className="glass-card mb-12"
                    animate={{ 
                      boxShadow: [
                        '0 0 0 rgba(255, 215, 0, 0)',
                        '0 0 30px rgba(255, 215, 0, 0.3)',
                        '0 0 0 rgba(255, 215, 0, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="glass-card-content p-8">
                      <motion.h2 
                        className="text-3xl md:text-4xl font-light text-white mb-4"
                        animate={optimalMoment ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🎉 {SUCCESS_TRIGGERS.deployment_success}
                      </motion.h2>
                      <p className="text-lg text-white/80 mb-6">
                        {SUCCESS_TRIGGERS.automation_hook}
                      </p>
                      
                      {/* Psychological readiness indicator */}
                      {isConversionReady && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-4"
                        >
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-green-300">
                              Perfect timing detected
                            </span>
                          </span>
                        </motion.div>
                      )}
                      <motion.button
                        onClick={handleShowAdvancedFeatures}
                        className="glass-button-primary px-8 py-4 text-lg font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {SUCCESS_TRIGGERS.upgrade_moment}
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* PHASE 1: Psychologically-timed pricing section */}
            <TierPricingSection onSelectTier={handleTierSelection} />

            {/* PHASE 1: Enhanced integration for premium users */}
            <PolarIntegrationSection onUpgrade={handleUpgrade} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 1: Enhanced network effects with psychological triggers */}
      <AnimatePresence>
        {(showPricingTiers || showPricingTiersLegacy) && (userJourneyStep >= 1 || userJourneyStepLegacy >= 1) && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/10 to-purple-900/10"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl font-light text-white mb-4">
                  Network <span className="font-medium bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Visibility</span> Benefits
                </h2>
                <p className="text-xl text-white/70 max-w-3xl mx-auto">
                  {SUCCESS_TRIGGERS.network_tease}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="glass-card"
                >
                  <div className="glass-card-content p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">✨ You Just Experienced FREE</h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li>• 5 auto-updating websites</li>
                      <li>• Professional templates you just saw</li>
                      <li>• 30-second generation magic</li>
                      <li>• Automated content at dev checkpoints</li>
                      <li>• Zero learning curve or complexity</li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="glass-card ring-2 ring-yellow-400/50"
                >
                  <div className="glass-card-content p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">🚀 Unlock PRO Power</h3>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li>• 111 websites + 11 gift websites</li>
                      <li>• Network visibility among industry leaders</li>
                      <li>• Featured in professional galleries</li>
                      <li>• Sub 10-second generation (premium AI)</li>
                      <li>• Remove all attribution completely</li>
                    </ul>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="mt-12 text-center"
              >
                <div className="glass-card max-w-2xl mx-auto">
                  <div className="glass-card-content p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">💡 Experience-First Philosophy</h4>
                    <p className="text-sm text-white/80 italic">
                      You just experienced the magic. Now imagine this level of automation and professional 
                      presentation for all your projects, with network visibility among industry leaders.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <GlassFooter />
    </div>
  );
};