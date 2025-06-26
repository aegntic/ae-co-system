import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modern3DIcon } from '../ui/Modern3DIcon';
import { GlassURLInputForm } from '../generator/GlassURLInputForm';
import { 
  HERO_MESSAGING, 
  SITE_PRO_BRANDING, 
  VALUE_PROPOSITIONS, 
  SOCIAL_PROOF_DATA,
  PSYCHOLOGICAL_TIMING,
  TYPOGRAPHY_HIERARCHY
} from '../../constants';

interface GlassHeroSectionProps {
  onGenerateSite: (url: string) => void;
  onShowModeSelection?: () => void;
  abTestVariant?: string;
  enablePsychologicalTriggers?: boolean;
}

export const GlassHeroSection: React.FC<GlassHeroSectionProps> = ({ 
  onGenerateSite, 
  onShowModeSelection,
  abTestVariant = 'living_websites',
  enablePsychologicalTriggers = true
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showUrgency, setShowUrgency] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);

    // PHASE 1: Psychological trigger timing
    if (enablePsychologicalTriggers) {
      const socialProofTimer = setTimeout(() => {
        setShowSocialProof(true);
      }, PSYCHOLOGICAL_TIMING.SOCIAL_PROOF_REVEAL);

      const urgencyTimer = setTimeout(() => {
        setShowUrgency(true);
      }, PSYCHOLOGICAL_TIMING.URGENCY_INTRODUCTION);

      // Testimonial rotation
      const testimonialInterval = setInterval(() => {
        setCurrentTestimonial(prev => (prev + 1) % SOCIAL_PROOF_DATA.testimonials.length);
      }, 4000);

      return () => {
        clearTimeout(socialProofTimer);
        clearTimeout(urgencyTimer);
        clearInterval(testimonialInterval);
        window.removeEventListener('resize', updateScreenSize);
      };
    }

    return () => window.removeEventListener('resize', updateScreenSize);
  }, [enablePsychologicalTriggers]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      
      {/* Main glass container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-container w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl"
      >
        <div className="relative">
          {/* Glass layers */}
          <div className="absolute z-0 inset-0 backdrop-blur-md glass-filter overflow-hidden isolate rounded-3xl" />
          <div className="z-10 absolute inset-0 bg-white bg-opacity-15 rounded-3xl" />
          <div className="glass-inner-shadow rounded-3xl" />
          
          {/* Top Section - Logo & Welcome */}
          <div className="z-30 relative text-center bg-black/10 pt-6 sm:pt-8 lg:pt-12 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            {/* Progress Steps */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8"
            >
              <div className="flex items-center gap-2">
                <div className="glass-step active">
                  <div className="glass-step-content">1</div>
                </div>
                <span className="text-xs font-medium text-white/90 hidden md:block">Repository</span>
              </div>
              <div className="w-4 sm:w-6 h-px bg-white/30" />
              <div className="flex items-center gap-2">
                <div className="glass-step">
                  <div className="glass-step-content">2</div>
                </div>
                <span className="text-xs font-medium text-white/60 hidden md:block">Generation</span>
              </div>
              <div className="w-4 sm:w-6 h-px bg-white/30" />
              <div className="flex items-center gap-2">
                <div className="glass-step">
                  <div className="glass-step-content">3</div>
                </div>
                <span className="text-xs font-medium text-white/60 hidden md:block">Deployment</span>
              </div>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              className="mb-4 sm:mb-6"
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden">
                <div className="absolute z-0 inset-0 backdrop-blur-sm glass-filter" />
                <div className="z-10 absolute inset-0 bg-gradient-to-br from-white/30 to-white/10" />
                <div className="glass-inner-shadow rounded-2xl" />
                <div className="z-30 relative flex items-center justify-center">
                  <img 
                    src="/4sitepro-logo.png" 
                    alt="4site.pro" 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-lg"
                    onError={(e) => {
                      // Fallback to Modern3DIcon if logo fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling!.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}}>
                    <Modern3DIcon size={screenSize.width < 640 ? 48 : 60} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PHASE 1 TRANSFORMATION: FREE-FOCUSED HERO MESSAGING */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight mb-4 sm:mb-6">
                {SITE_PRO_BRANDING.hero_tagline}
              </h1>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal text-white/90 mb-3 sm:mb-4">
                <span className="font-medium bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  {SITE_PRO_BRANDING.instant_promise}
                </span>
              </p>
              <p className="text-sm sm:text-base font-light text-white/80 max-w-2xl lg:max-w-3xl mx-auto px-2 mb-4">
                {VALUE_PROPOSITIONS.FOCUS_TRIGGER}
              </p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="text-xs sm:text-sm font-medium text-yellow-300/90 max-w-xl mx-auto"
              >
                {HERO_MESSAGING.instant_gratification} • 30 seconds to instant website magic
              </motion.p>
            </motion.div>
          </div>

          {/* Bottom Section - Form */}
          <div className="z-30 relative p-4 sm:p-6 lg:p-8">
            {/* GLASS CTA SECTION - PURE FREE FOCUS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-4 sm:mb-6"
            >
              <h2 className="text-xl sm:text-2xl font-medium text-white mb-1 sm:mb-2">
                {HERO_MESSAGING.cta}
              </h2>
              <p className="text-xs sm:text-sm font-normal text-white/70">
                Step 1 of 3 • Paste your GitHub repository URL below • 
                <span className="text-yellow-300 font-medium">Completely FREE</span>
              </p>
            </motion.div>

            {/* URL Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <GlassURLInputForm onSubmit={onGenerateSite} />
            </motion.div>

            {/* FREE TIER INSTANT MAGIC FEATURES */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {[
                { icon: '⚡', label: '30 Second Magic', color: 'text-yellow-300' },
                { icon: '🔄', label: 'Living Websites', color: 'text-blue-300' },
                { icon: '🎯', label: 'Zero Setup', color: 'text-green-300' },
                { icon: '✨', label: 'Instant WOW', color: 'text-purple-300' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                  className="glass-card hover:scale-105 transition-transform duration-200"
                >
                  <div className="glass-card-content text-center py-2 sm:py-3">
                    <div className={`text-xl sm:text-2xl mb-1 ${feature.color}`}>{feature.icon}</div>
                    <div className="text-xs font-medium text-white/80">{feature.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* REMOVED: No pricing complexity in initial experience */}
            {/* Progressive disclosure happens post-deployment success */}

            {/* MINIMALIST FOOTER - NO DISTRACTIONS */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="mt-12 text-center"
            >
              <motion.p 
                className="text-sm font-normal text-white/60 mb-6"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✨ {VALUE_PROPOSITIONS.WOW_MOMENT} ✨
              </motion.p>
              <div className="flex gap-4 text-xs font-normal text-white/40 items-center justify-center">
                <a href="https://aegntic.ai" className="hover:text-white/60 transition-colors">aegntic.ai</a>
                <span>•</span>
                <a href="https://aegntic.foundation" className="hover:text-white/60 transition-colors">foundation</a>
                <span>•</span>
                <a href="mailto:project@4site.pro" className="hover:text-white/60 transition-colors">contact</a>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Subtle floating glass elements for hero section */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-24 rounded-full opacity-30"
            style={{
              left: `${25 + i * 25}%`,
              top: `${20 + (i % 2) * 40}%`,
              background: `radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)`,
              backdropFilter: 'blur(15px)',
              transform: `translate(${mousePosition.x * (5 + i * 2)}px, ${mousePosition.y * (3 + i)}px)`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 8, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 1,
            }}
          />
        ))}
      </div>
    </section>
  );
};