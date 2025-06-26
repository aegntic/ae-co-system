import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '../../hooks/useGSAP';
import { useMicroInteractions } from '../../hooks/useMicroInteractions';
import { useMobileInteractions } from '../../hooks/useMobileInteractions';
import { useInteractionAnalytics } from '../../hooks/useInteractionAnalytics';
import { EnhancedLoadingSystem } from '../loading/EnhancedLoadingSystem';
import { EnhancedErrorSystem } from '../error/EnhancedErrorSystem';
import { EnhancedSuccessFlow } from '../success/EnhancedSuccessFlow';
import { 
  Zap, 
  Smartphone, 
  MousePointer, 
  Gamepad2, 
  Volume2, 
  Eye,
  Play,
  Square,
  RotateCcw,
  Star,
  Heart,
  Share2,
  Download,
  Settings,
  Lightbulb
} from 'lucide-react';

interface DemoSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  color: string;
}

export const InteractionShowcase: React.FC = () => {
  // State
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);
  const [showErrorDemo, setShowErrorDemo] = useState(false);
  const [showSuccessDemo, setShowSuccessDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const showcaseRef = useRef<HTMLDivElement>(null);
  const magneticRef = useRef<HTMLDivElement>(null);
  const textAnimRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { presets, magnetic, textAnimation, scrollTrigger } = useGSAP();
  const { button, form, loading, notification } = useMicroInteractions();
  const { useSwipeGesture, usePinchGesture, usePanGesture, useLongPress } = useMobileInteractions();
  const { trackInteraction, trackConversion, currentFlow, heatmapData } = useInteractionAnalytics({
    enableHeatmap: true,
    enableA11yTracking: true,
    enablePerformanceTracking: true
  });

  // Button interactions demo
  const buttonDemo = button({
    intensity: 'strong',
    enableHaptics: true,
    enableSound: true,
    pressDepth: 0.9,
    bounceBack: true,
    rippleEffect: true,
    glowIntensity: 0.4
  });

  // Form interactions demo
  const formDemo = form({
    intensity: 'medium',
    enableHaptics: true,
    validationStyle: 'border',
    showValidationIcon: true
  });

  // Mobile gesture demos
  const { elementRef: swipeRef } = useSwipeGesture(
    (gesture) => {
      trackInteraction('swipe', 'demo-swipe', 'card', { direction: gesture.direction });
      notification.showNotification(
        document.createElement('div'),
        'info'
      );
    },
    { enableHaptics: true }
  );

  const { elementRef: pinchRef } = usePinchGesture(
    (gesture) => {
      trackInteraction('pinch', 'demo-pinch', 'card', { scale: gesture.scale });
    }
  );

  const { elementRef: longPressRef } = useLongPress(
    () => {
      trackInteraction('long_press', 'demo-long-press', 'button');
      setShowSuccessDemo(true);
    },
    { enableHaptics: true, visualFeedback: true }
  );

  // Magnetic hover demo
  const { elementRef: magneticRefInternal } = magnetic(0.4);

  // Text animation demo
  const { textRef, animateText } = textAnimation('split');

  // Demo sections
  const demoSections: DemoSection[] = [
    {
      id: 'gsap-animations',
      title: 'GSAP Animations',
      description: 'Advanced animations using GSAP timeline system',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      component: (
        <div className="space-y-4">
          <motion.button
            ref={magneticRefInternal}
            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold"
            onClick={() => {
              trackInteraction('click', 'gsap-magnetic', 'button');
              presets.elasticScale(magneticRefInternal.current);
            }}
          >
            Magnetic Hover Effect
          </motion.button>
          
          <div
            ref={textRef}
            className="text-2xl font-bold text-white cursor-pointer"
            onClick={() => {
              trackInteraction('click', 'gsap-text', 'button');
              animateText();
            }}
          >
            Click to animate this text!
          </div>
        </div>
      )
    },
    {
      id: 'micro-interactions',
      title: 'Micro-Interactions',
      description: 'Subtle feedback for every user action',
      icon: <MousePointer className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-500',
      component: (
        <div className="space-y-4">
          <button
            ref={buttonDemo.elementRef}
            onMouseDown={buttonDemo.handlePress}
            onMouseUp={buttonDemo.handleRelease}
            onMouseEnter={buttonDemo.handleHover}
            onMouseLeave={buttonDemo.handleHoverEnd}
            onClick={() => trackInteraction('click', 'micro-button', 'button')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold"
          >
            Interactive Button
          </button>
          
          <div className="relative">
            <input
              ref={formDemo.elementRef}
              onFocus={formDemo.handleFocus}
              onChange={(e) => {
                const isValid = e.target.value.length > 3;
                formDemo.showValidation(isValid, isValid ? 'Valid input!' : 'Too short');
              }}
              placeholder="Type something (4+ chars for validation)"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            />
            <span className="validation-icon absolute right-3 top-2.5 text-lg" />
          </div>
        </div>
      )
    },
    {
      id: 'mobile-gestures',
      title: 'Mobile Gestures',
      description: 'Touch interactions with haptic feedback',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      component: (
        <div className="space-y-4">
          <div
            ref={swipeRef}
            className="p-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white text-center font-semibold"
          >
            Swipe me in any direction!
          </div>
          
          <div
            ref={pinchRef}
            className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white text-center font-semibold"
          >
            Pinch to zoom (mobile)
          </div>
          
          <button
            ref={longPressRef}
            className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-semibold"
          >
            Long press me!
          </button>
        </div>
      )
    },
    {
      id: 'loading-states',
      title: 'Loading States',
      description: 'Advanced loading animations with progress tracking',
      icon: <Play className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      component: (
        <div className="space-y-4">
          <button
            onClick={() => {
              trackInteraction('click', 'loading-demo', 'button');
              setShowLoadingDemo(true);
              setDemoProgress(0);
              
              const interval = setInterval(() => {
                setDemoProgress(prev => {
                  if (prev >= 100) {
                    clearInterval(interval);
                    setShowLoadingDemo(false);
                    setShowSuccessDemo(true);
                    return 100;
                  }
                  return prev + 10;
                });
              }, 500);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold"
          >
            Show Loading Demo
          </button>
          
          <button
            onClick={() => {
              trackInteraction('click', 'error-demo', 'button');
              setShowErrorDemo(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold"
          >
            Show Error Demo
          </button>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Interaction Analytics',
      description: 'Real-time user behavior tracking',
      icon: <Eye className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {currentFlow?.performance.totalInteractions || 0}
              </div>
              <div className="text-sm text-gray-300">Total Interactions</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {currentFlow?.engagementScore.toFixed(0) || 0}
              </div>
              <div className="text-sm text-gray-300">Engagement Score</div>
            </div>
          </div>
          
          <div className="p-4 bg-white/10 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Heatmap Data</h4>
            <div className="text-sm text-gray-300">
              {heatmapData.length} interaction points tracked
            </div>
          </div>
        </div>
      )
    }
  ];

  // Auto-play demo
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setActiveDemo(prev => {
          const currentIndex = demoSections.findIndex(section => section.id === prev);
          const nextIndex = (currentIndex + 1) % demoSections.length;
          return demoSections[nextIndex].id;
        });
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, demoSections]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Interaction Excellence
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Experience premium interactions powered by GSAP, micro-interactions, and analytics
          </p>
          
          {/* Control Panel */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                trackInteraction('click', 'demo-play', 'button');
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
            >
              {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'Stop' : 'Play'} Demo</span>
            </button>
            
            <button
              onClick={() => {
                setActiveDemo(null);
                setIsPlaying(false);
                trackInteraction('click', 'demo-reset', 'button');
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </div>
        </motion.div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {demoSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                activeDemo === section.id
                  ? 'border-yellow-400 bg-white/10 scale-105'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => {
                setActiveDemo(activeDemo === section.id ? null : section.id);
                trackInteraction('click', `demo-${section.id}`, 'card');
              }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-10 rounded-2xl`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color}`}>
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>
                
                <p className="text-gray-300 mb-6">{section.description}</p>
                
                {/* Demo Component */}
                <AnimatePresence>
                  {activeDemo === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {section.component}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/10"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">
            🚀 PHASE 3: Interaction Excellence Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">GSAP Integration</h3>
              <p className="text-sm text-gray-400">Advanced animations with React hooks</p>
            </div>
            
            <div className="text-center">
              <MousePointer className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Micro-Interactions</h3>
              <p className="text-sm text-gray-400">Subtle feedback for every action</p>
            </div>
            
            <div className="text-center">
              <Smartphone className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Mobile Gestures</h3>
              <p className="text-sm text-gray-400">Touch-optimized interactions</p>
            </div>
            
            <div className="text-center">
              <Eye className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-gray-400">Real-time behavior tracking</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Demos */}
      <EnhancedLoadingSystem
        isLoading={showLoadingDemo}
        stages={[
          { id: '1', name: 'Initialize', description: 'Setting up demo', estimatedDuration: 2000, icon: <Settings className="w-5 h-5" />, color: '#3B82F6' },
          { id: '2', name: 'Process', description: 'Running animations', estimatedDuration: 2000, icon: <Zap className="w-5 h-5" />, color: '#10B981' },
          { id: '3', name: 'Complete', description: 'Finishing demo', estimatedDuration: 1000, icon: <Star className="w-5 h-5" />, color: '#F59E0B' }
        ]}
        currentStage="1"
        progress={demoProgress}
        message="Demonstrating enhanced loading states with GSAP animations"
        startTime={Date.now()}
        enableParticles={true}
        showAdvancedMetrics={true}
      />

      <EnhancedErrorSystem
        error={{
          message: "This is a demo error to showcase enhanced error handling",
          type: 'network',
          retryable: true,
          suggestions: [
            "Check your internet connection",
            "Try refreshing the page",
            "Contact support if the issue persists"
          ],
          technicalDetails: "Demo error - no actual problem occurred",
          timestamp: Date.now()
        }}
        retry={{
          maxAttempts: 3,
          currentAttempt: 1,
          isRetrying: false,
          onRetry: () => setShowErrorDemo(false)
        }}
        onDismiss={() => setShowErrorDemo(false)}
        showTechnicalDetails={true}
        enableHaptics={true}
      />

      <EnhancedSuccessFlow
        isVisible={showSuccessDemo}
        metrics={{
          generationTime: 3500,
          qualityScore: 95,
          featuresDetected: 8,
          optimizationLevel: 92
        }}
        socialProof={{
          totalGenerations: 12847,
          recentGenerations: 24,
          satisfactionRate: 96,
          topFeatures: ['Responsive Design', 'SEO Optimized', 'Fast Loading']
        }}
        actions={[
          {
            id: 'deploy',
            label: 'Deploy Site',
            description: 'Launch your site to production',
            icon: <Share2 className="w-5 h-5" />,
            primary: true,
            onClick: () => {
              trackConversion('demo_deploy', 0, { source: 'demo' });
              setShowSuccessDemo(false);
            }
          },
          {
            id: 'download',
            label: 'Download Code',
            description: 'Get the source files',
            icon: <Download className="w-5 h-5" />,
            onClick: () => setShowSuccessDemo(false)
          }
        ]}
        conversionTriggers={[
          {
            type: 'upgrade',
            urgency: 'medium',
            personalityMatch: 'pragmatic',
            triggerText: '🚀 Ready to create more amazing sites?',
            benefitHighlight: 'Upgrade for unlimited generations and premium features'
          }
        ]}
        onDismiss={() => setShowSuccessDemo(false)}
        enableConfetti={true}
        enableHaptics={true}
        showProgressiveUpgrade={true}
      />
    </div>
  );
};

export default InteractionShowcase;