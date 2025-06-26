import React, { useEffect, useState } from 'react';
import { URLInputForm } from '../generator/URLInputForm';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Modern3DIcon } from '../ui/Modern3DIcon';
import { generateGEOContent } from '../../utils/seoHelpers';
import { LANDING_PAGE_VISUALS, generateLandingPageVisuals } from '../../services/landingPageVisuals';
import { 
  HERO_MESSAGING, 
  SITE_PRO_BRANDING, 
  VALUE_PROPOSITIONS, 
  SOCIAL_PROOF_DATA,
  PSYCHOLOGICAL_TIMING,
  TYPOGRAPHY_HIERARCHY,
  AB_TEST_VARIANTS
} from '../../constants';

interface EnhancedHeroSectionProps {
  onGenerateSite: (url: string) => void;
  onShowModeSelection?: () => void;
  abTestVariant?: string;
  enablePsychologicalTriggers?: boolean;
  personalityType?: 'analytical' | 'creative' | 'pragmatic' | 'social';
  onPsychologicalTrigger?: (trigger: string, data?: any) => void;
}

export const EnhancedHeroSection: React.FC<EnhancedHeroSectionProps> = ({ 
  onGenerateSite, 
  onShowModeSelection,
  abTestVariant = 'living_websites',
  enablePsychologicalTriggers = true,
  personalityType = 'pragmatic',
  onPsychologicalTrigger
}) => {
  const [visuals, setVisuals] = useState(LANDING_PAGE_VISUALS);
  const [visualsLoading, setVisualsLoading] = useState(true);
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [conversionReadiness, setConversionReadiness] = useState(0);
  const geoContent = generateGEOContent('hero');

  // PHASE 1: A/B Test message variants
  const getHeroMessage = () => {
    switch (abTestVariant) {
      case 'instant_magic':
        return {
          primary: HERO_MESSAGING.primary_alt,
          secondary: "Instant professional websites from your GitHub repositories",
          emphasis: "with zero complexity"
        };
      case 'developer_focused':
        return {
          primary: "Developer Portfolio Excellence",
          secondary: "Transform your GitHub into professional industry recognition",
          emphasis: "Join the elite developer community"
        };
      case 'portfolio_builder':
        return {
          primary: "Professional Portfolio Generator",
          secondary: "From GitHub to industry showcase in 30 seconds",
          emphasis: "Network visibility that matters"
        };
      default: // 'living_websites'
        return {
          primary: HERO_MESSAGING.primary,
          secondary: HERO_MESSAGING.secondary,
          emphasis: HERO_MESSAGING.secondary_emphasis
        };
    }
  };

  const heroMessage = getHeroMessage();

  useEffect(() => {
    // Try to generate unique visuals for the landing page
    generateLandingPageVisuals()
      .then(newVisuals => {
        setVisuals(newVisuals);
        setVisualsLoading(false);
      })
      .catch(() => {
        setVisualsLoading(false);
      });

    // PHASE 1: Psychological trigger timing system
    if (enablePsychologicalTriggers) {
      const socialProofTimer = setTimeout(() => {
        setShowSocialProof(true);
        onPsychologicalTrigger?.('social_proof_reveal', { timing: PSYCHOLOGICAL_TIMING.SOCIAL_PROOF_REVEAL });
      }, PSYCHOLOGICAL_TIMING.SOCIAL_PROOF_REVEAL);

      const urgencyTimer = setTimeout(() => {
        setShowUrgency(true);
        onPsychologicalTrigger?.('urgency_introduction', { timing: PSYCHOLOGICAL_TIMING.URGENCY_INTRODUCTION });
      }, PSYCHOLOGICAL_TIMING.URGENCY_INTRODUCTION);

      // Testimonial rotation for social proof
      const testimonialInterval = setInterval(() => {
        setCurrentTestimonial(prev => (prev + 1) % SOCIAL_PROOF_DATA.testimonials.length);
      }, 4000);

      // Conversion readiness progression
      const readinessInterval = setInterval(() => {
        setConversionReadiness(prev => Math.min(100, prev + 2));
      }, 500);

      return () => {
        clearTimeout(socialProofTimer);
        clearTimeout(urgencyTimer);
        clearInterval(testimonialInterval);
        clearInterval(readinessInterval);
      };
    }
  }, [enablePsychologicalTriggers, onPsychologicalTrigger]);

  return (
    <section 
      className="relative min-h-screen flex items-center overflow-hidden"
      itemScope 
      itemType="https://schema.org/WebPageElement"
    >
      {/* SEO-optimized H1 (hidden visually but present for crawlers) */}
      <h1 className="sr-only" itemProp="headline">{geoContent.mainHeading}</h1>
      
      {/* AI-Generated Hero Background */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: visualsLoading ? 0.3 : 0.7 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={visuals.heroImage}
            alt={visuals.heroImageAlt || "aegntic.ai-generated hero background for Project 4site"}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/85 to-gray-900" />
        </motion.div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-flow" />
      </div>

      {/* Floating Visual Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {visuals.colorPalette.map((color, index) => (
          <motion.div
            key={color}
            className="absolute w-64 h-64 rounded-full opacity-10"
            style={{
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              left: `${20 + index * 20}%`,
              top: `${10 + index * 15}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + index * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* 3D Modern Minimalist Project Icon */}
          <motion.div
            initial={{ scale: 0, rotateY: -180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            className="mx-auto mb-8 relative inline-block"
            style={{ perspective: '1000px' }}
          >
            <Modern3DIcon size={100} className="relative z-10" />
          </motion.div>
          
          {/* PHASE 1: Psychology-Optimized Hero Messaging */}
          <motion.div className="mb-6">
            <motion.h1
              className={TYPOGRAPHY_HIERARCHY.hero_primary + " text-white tracking-tight"}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span className={TYPOGRAPHY_HIERARCHY.hero_primary_emphasis + " animate-gradient-x"}>
                {heroMessage.primary}
              </span>
            </motion.h1>
            <motion.p
              className={TYPOGRAPHY_HIERARCHY.hero_secondary + " text-white/90 mt-4"}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              {heroMessage.secondary}
              <span className={TYPOGRAPHY_HIERARCHY.hero_secondary_emphasis + " ml-2"}>
                {heroMessage.emphasis}
              </span>
            </motion.p>
          </motion.div>

          {/* PHASE 1: Professional Focus Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className={TYPOGRAPHY_HIERARCHY.anticipation_build + " text-gray-300 max-w-3xl mx-auto mb-8"}
            itemProp="description"
          >
            {VALUE_PROPOSITIONS.ZERO_FRICTION}
          </motion.p>

          {/* PHASE 1: Social Proof Integration */}
          <AnimatePresence>
            {showSocialProof && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <motion.p
                  className={TYPOGRAPHY_HIERARCHY.social_proof + " mb-2"}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨ {SOCIAL_PROOF_DATA.user_count} developers showcase professionally
                </motion.p>
                <motion.blockquote
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={TYPOGRAPHY_HIERARCHY.micro_copy + " text-gray-400 italic"}
                >
                  "{SOCIAL_PROOF_DATA.testimonials[currentTestimonial].text}" - {SOCIAL_PROOF_DATA.testimonials[currentTestimonial].role}
                </motion.blockquote>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PHASE 1: Professional Value Props */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {[
              { text: 'Professional Recognition', color: 'border-blue-400/30 hover:border-blue-400' },
              { text: 'Network Visibility', color: 'border-green-400/30 hover:border-green-400' },
              { text: 'Zero Complexity', color: 'border-yellow-400/30 hover:border-yellow-400' },
              { text: 'Industry Standard', color: 'border-purple-400/30 hover:border-purple-400' }
            ].map((feature, index) => (
              <motion.span
                key={feature.text}
                initial={{ scale: 0, rotateY: -90 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 200 }}
                className={`px-4 py-2 bg-gray-800/80 backdrop-blur border ${feature.color} rounded-full text-sm font-medium text-gray-300 hover:text-white transition-all cursor-default hover:scale-105`}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {feature.text}
              </motion.span>
            ))}
          </motion.div>

          {/* URL Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <URLInputForm onSubmit={onGenerateSite} />
          </motion.div>

          {/* PHASE 1: Professional Advancement CTA */}
          {onShowModeSelection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="mt-8"
            >
              <motion.button
                onClick={() => {
                  onShowModeSelection();
                  onPsychologicalTrigger?.('advanced_mode_interest', { personalityType, conversionReadiness });
                }}
                className="group text-gray-400 hover:text-wu-gold font-medium transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={TYPOGRAPHY_HIERARCHY.anticipation_build}>
                  Ready for professional network visibility?
                </span>
                <Icon name="ArrowRight" size={16} className="inline ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>
            </motion.div>
          )}

          {/* PHASE 1: Urgency & Exclusivity Triggers */}
          <AnimatePresence>
            {showUrgency && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="mt-6 px-4 py-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20 rounded-xl backdrop-blur"
              >
                <motion.p
                  className={TYPOGRAPHY_HIERARCHY.urgency_text + " text-center"}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔥 {VALUE_PROPOSITIONS.SCARCITY}
                </motion.p>
                <motion.p
                  className={TYPOGRAPHY_HIERARCHY.exclusivity_badge + " text-center mt-2"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Elite Developer Community
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PHASE 1: Professional Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1, color: '#10b981' }}
            >
              <Icon name="Shield" size={20} />
              <span>Enterprise Security</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1, color: '#3b82f6' }}
            >
              <Icon name="Users" size={20} />
              <span>{SOCIAL_PROOF_DATA.user_count} Professionals</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1, color: '#f59e0b' }}
            >
              <Icon name="Star" size={20} />
              <span>Industry Recognition</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1, color: '#8b5cf6' }}
            >
              <Icon name="Zap" size={20} />
              <span>Instant Professional Grade</span>
            </motion.div>
          </motion.div>

          {/* PHASE 1: Conversion Readiness Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: conversionReadiness > 50 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 text-center"
          >
            <motion.div
              className="w-32 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${conversionReadiness}%` }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
            <motion.p
              className={TYPOGRAPHY_HIERARCHY.micro_copy + " mt-2"}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Professional readiness: {Math.round(conversionReadiness)}%
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Floating Tech Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {['React', 'Vue', 'Node', 'Python', 'Rust'].map((tech, index) => (
            <motion.div
              key={tech}
              className="absolute text-gray-600/20"
              style={{
                left: `${10 + index * 20}%`,
                top: `${20 + (index % 2) * 60}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 5 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }}
            >
              <Icon name="Code2" size={40 + index * 5} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* CSS for gradient animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes grid-flow {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-grid-flow {
          animation: grid-flow 20s linear infinite;
        }
      `}</style>
    </section>
  );
};