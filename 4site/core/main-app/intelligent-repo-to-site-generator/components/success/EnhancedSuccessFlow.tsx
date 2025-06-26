import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '../../hooks/useGSAP';
import { useMicroInteractions } from '../../hooks/useMicroInteractions';
import { useMobileInteractions } from '../../hooks/useMobileInteractions';
import { 
  CheckCircle, 
  Sparkles, 
  Share2, 
  Download, 
  Edit3, 
  Rocket,
  Trophy,
  Star,
  Copy,
  ExternalLink,
  Heart,
  Zap,
  Crown,
  Gem
} from 'lucide-react';

interface SuccessMetrics {
  generationTime: number;
  qualityScore: number;
  featuresDetected: number;
  optimizationLevel: number;
}

interface SocialProof {
  totalGenerations: number;
  recentGenerations: number;
  satisfactionRate: number;
  topFeatures: string[];
}

interface SuccessAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  primary?: boolean;
  premium?: boolean;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface ConversionTrigger {
  type: 'upgrade' | 'share' | 'save' | 'deploy';
  urgency: 'low' | 'medium' | 'high';
  personalityMatch: 'pragmatic' | 'creative' | 'social' | 'achiever';
  triggerText: string;
  benefitHighlight: string;
}

interface EnhancedSuccessFlowProps {
  isVisible: boolean;
  metrics: SuccessMetrics;
  socialProof?: SocialProof;
  actions: SuccessAction[];
  conversionTriggers: ConversionTrigger[];
  onDismiss?: () => void;
  userPersonality?: 'pragmatic' | 'creative' | 'social' | 'achiever';
  abTestVariant?: 'celebration' | 'professional' | 'premium' | 'minimal';
  enableConfetti?: boolean;
  enableHaptics?: boolean;
  showProgressiveUpgrade?: boolean;
}

export const EnhancedSuccessFlow: React.FC<EnhancedSuccessFlowProps> = ({
  isVisible,
  metrics,
  socialProof,
  actions,
  conversionTriggers,
  onDismiss,
  userPersonality = 'pragmatic',
  abTestVariant = 'celebration',
  enableConfetti = true,
  enableHaptics = true,
  showProgressiveUpgrade = true
}) => {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [pulsingAction, setPulsingAction] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const successIconRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hooks
  const { animateTo, animateFrom, createTimeline, presets } = useGSAP();
  const { executeInteraction, triggerHaptic } = useMicroInteractions();
  const { useSwipeGesture } = useMobileInteractions();

  // Swipe gestures for mobile
  const { elementRef: swipeRef } = useSwipeGesture(
    (gesture) => {
      if (gesture.direction === 'up' && showProgressiveUpgrade) {
        setShowUpgradePrompt(true);
      } else if (gesture.direction === 'down') {
        onDismiss?.();
      }
    },
    { threshold: 80, enableHaptics }
  );

  // Personality-based messaging
  const getPersonalityMessage = useCallback(() => {
    const messages = {
      pragmatic: {
        title: "Site Generated Successfully",
        subtitle: "Your professional website is ready for deployment",
        metrics: "Performance optimized • SEO friendly • Mobile responsive"
      },
      creative: {
        title: "✨ Your Vision Comes to Life!",
        subtitle: "A beautiful, unique website crafted just for you",
        metrics: "Creative design • Visual appeal • Artistic layout"
      },
      social: {
        title: "🎉 Ready to Share with the World!",
        subtitle: "Your amazing website is ready to impress everyone",
        metrics: "Social optimized • Shareable • Community ready"
      },
      achiever: {
        title: "🏆 Success Unlocked!",
        subtitle: "You've created something truly impressive",
        metrics: "High quality • Professional grade • Achievement unlocked"
      }
    };
    return messages[userPersonality];
  }, [userPersonality]);

  // Confetti animation
  const triggerConfetti = useCallback(() => {
    if (!enableConfetti || !confettiCanvasRef.current) return;

    setConfettiActive(true);
    const canvas = confettiCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      size: number;
      gravity: number;
    }> = [];

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    // Create particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 5 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        gravity: 0.1 + Math.random() * 0.1
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        // Update physics
        particle.vy += particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Remove particles that are off screen
        if (particle.y > canvas.height + 20) {
          particles.splice(index, 1);
          return;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        setConfettiActive(false);
      }
    };

    animate();

    // Cleanup after 5 seconds
    setTimeout(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        setConfettiActive(false);
      }
    }, 5000);
  }, [enableConfetti]);

  // Success entrance animation
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const timeline = createTimeline();
      const personalityMsg = getPersonalityMessage();

      // Haptic feedback
      if (enableHaptics) {
        triggerHaptic('medium');
      }

      // Success icon animation
      timeline
        .from(successIconRef.current, {
          scale: 0,
          rotation: -180,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)'
        })
        .from('.success-title', {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.3')
        .from('.success-subtitle', {
          y: 20,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.2')
        .from('.success-action', {
          y: 20,
          opacity: 0,
          duration: 0.3,
          stagger: 0.1,
          ease: 'power2.out'
        }, '-=0.2');

      // Trigger confetti for celebration variant
      if (abTestVariant === 'celebration') {
        setTimeout(triggerConfetti, 800);
      }

      // Show metrics after initial animation
      setTimeout(() => setShowMetrics(true), 1500);

      // Progressive upgrade prompt based on personality
      if (showProgressiveUpgrade) {
        const upgradeDelay = userPersonality === 'achiever' ? 3000 : 
                           userPersonality === 'social' ? 4000 : 5000;
        setTimeout(() => setShowUpgradePrompt(true), upgradeDelay);
      }
    }
  }, [isVisible, abTestVariant, enableHaptics, triggerHaptic, createTimeline, triggerConfetti, showProgressiveUpgrade, userPersonality, getPersonalityMessage]);

  // Action button animation
  const handleActionClick = useCallback((action: SuccessAction) => {
    if (action.disabled || action.comingSoon) return;

    // Visual feedback
    setPulsingAction(action.id);
    setTimeout(() => setPulsingAction(null), 600);

    // Haptic feedback
    if (enableHaptics) {
      triggerHaptic(action.primary ? 'medium' : 'light');
    }

    action.onClick();
  }, [enableHaptics, triggerHaptic]);

  // Get conversion trigger for user personality
  const getRelevantConversionTrigger = useCallback(() => {
    return conversionTriggers.find(trigger => 
      trigger.personalityMatch === userPersonality
    ) || conversionTriggers[0];
  }, [conversionTriggers, userPersonality]);

  const personalityMsg = getPersonalityMessage();
  const relevantTrigger = getRelevantConversionTrigger();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {/* Confetti Canvas */}
      {enableConfetti && (
        <canvas
          ref={confettiCanvasRef}
          className={`fixed inset-0 pointer-events-none z-50 ${confettiActive ? 'opacity-100' : 'opacity-0'}`}
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`relative max-w-2xl w-full rounded-3xl overflow-hidden ${
            abTestVariant === 'premium' 
              ? 'bg-gradient-to-br from-gray-900 to-black border border-yellow-400/30' 
              : 'glass-primary border-white/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="relative p-8 text-center">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10" />
            
            {/* Success Icon */}
            <motion.div
              ref={successIconRef}
              className="relative z-10 inline-flex items-center justify-center w-20 h-20 mb-6"
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center ${
                abTestVariant === 'premium' ? 'bg-yellow-400/20' : 'bg-green-500/20'
              }`}>
                {abTestVariant === 'premium' ? (
                  <Crown className="w-10 h-10 text-yellow-400" />
                ) : userPersonality === 'creative' ? (
                  <Sparkles className="w-10 h-10 text-purple-400" />
                ) : userPersonality === 'social' ? (
                  <Heart className="w-10 h-10 text-pink-400" />
                ) : userPersonality === 'achiever' ? (
                  <Trophy className="w-10 h-10 text-yellow-400" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-green-400" />
                )}
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="success-title text-3xl font-bold text-white mb-3">
              {personalityMsg.title}
            </h2>

            {/* Subtitle */}
            <p className="success-subtitle text-gray-300 text-lg mb-4">
              {personalityMsg.subtitle}
            </p>

            {/* Metrics Badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: showMetrics ? 1 : 0, opacity: showMetrics ? 1 : 0 }}
              className="inline-block px-4 py-2 bg-white/10 rounded-full text-sm text-gray-300"
            >
              {personalityMsg.metrics}
            </motion.div>
          </div>

          {/* Metrics Section */}
          <AnimatePresence>
            {showMetrics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-8 py-4 border-t border-white/10"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-400">
                      {(metrics.generationTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-gray-400">Generation Time</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-400">
                      {metrics.qualityScore}%
                    </div>
                    <div className="text-xs text-gray-400">Quality Score</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-400">
                      {metrics.featuresDetected}
                    </div>
                    <div className="text-xs text-gray-400">Features Found</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-yellow-400">
                      {metrics.optimizationLevel}%
                    </div>
                    <div className="text-xs text-gray-400">Optimized</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Proof */}
          {socialProof && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2 }}
              className="px-8 py-4 bg-white/5 text-center"
            >
              <p className="text-sm text-gray-400">
                🎉 Join <span className="font-semibold text-white">{socialProof.totalGenerations.toLocaleString()}</span> developers 
                who've created amazing sites with <span className="font-semibold text-green-400">{socialProof.satisfactionRate}%</span> satisfaction
              </p>
            </motion.div>
          )}

          {/* Actions Grid */}
          <div className="p-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  className={`success-action group relative flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 ${
                    action.primary
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white'
                      : action.premium
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  } ${action.disabled || action.comingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled || action.comingSoon}
                  whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: action.disabled ? 1 : 0.98 }}
                >
                  {/* Pulsing effect for active action */}
                  {pulsingAction === action.id && (
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-xl"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.1, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}

                  <div className={`flex-shrink-0 ${action.primary || action.premium ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {action.icon}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-medium">
                      {action.label}
                      {action.comingSoon && (
                        <span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded-full">
                          Soon
                        </span>
                      )}
                      {action.premium && (
                        <Gem className="inline-block w-4 h-4 ml-1" />
                      )}
                    </div>
                    <div className={`text-sm ${action.primary || action.premium ? 'text-white/80' : 'text-gray-500'}`}>
                      {action.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Progressive Upgrade Prompt */}
          <AnimatePresence>
            {showUpgradePrompt && relevantTrigger && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Zap className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {relevantTrigger.triggerText}
                    </h4>
                    <p className="text-sm text-gray-300">
                      {relevantTrigger.benefitHighlight}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                  >
                    Upgrade Now
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe Hint for Mobile */}
          <div className="md:hidden p-4 text-center">
            <p className="text-xs text-gray-500">
              Swipe up for upgrades • Swipe down to close
            </p>
          </div>

          {/* Close Button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedSuccessFlow;