import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '../../hooks/useGSAP';
import { useMicroInteractions } from '../../hooks/useMicroInteractions';
import { Terminal, Code, Zap, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface LoadingStage {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  icon: React.ReactNode;
  color: string;
  criticalPath?: boolean;
}

interface EnhancedLoadingProps {
  isLoading: boolean;
  stages: LoadingStage[];
  currentStage?: string;
  progress?: number;
  message?: string;
  estimatedTime?: number;
  startTime?: number;
  onCancel?: () => void;
  showAdvancedMetrics?: boolean;
  enableParticles?: boolean;
  theme?: 'dark' | 'glass' | 'premium';
}

interface ProgressMetrics {
  elapsedTime: number;
  remainingTime: number;
  completionRate: number;
  efficiency: number;
  currentThroughput: number;
}

export const EnhancedLoadingSystem: React.FC<EnhancedLoadingProps> = ({
  isLoading,
  stages,
  currentStage,
  progress = 0,
  message,
  estimatedTime = 30000,
  startTime,
  onCancel,
  showAdvancedMetrics = false,
  enableParticles = true,
  theme = 'glass'
}) => {
  // State management
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<ProgressMetrics>({
    elapsedTime: 0,
    remainingTime: estimatedTime,
    completionRate: 0,
    efficiency: 1,
    currentThroughput: 0
  });

  // Refs and hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { animateTo, createTimeline, presets } = useGSAP();
  const { executeInteraction, triggerHaptic } = useMicroInteractions();

  // Find current stage index
  useEffect(() => {
    if (currentStage) {
      const index = stages.findIndex(stage => stage.id === currentStage);
      if (index !== -1 && index !== currentStageIndex) {
        setCurrentStageIndex(index);
        setCompletedStages(prev => {
          const newSet = new Set(prev);
          stages.slice(0, index).forEach(stage => newSet.add(stage.id));
          return newSet;
        });
      }
    }
  }, [currentStage, stages, currentStageIndex]);

  // Metrics calculation
  useEffect(() => {
    if (!isLoading || !startTime) return;

    metricsIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const completionRate = progress / 100;
      const efficiency = completionRate > 0 ? elapsed / (estimatedTime * completionRate) : 1;
      const remaining = efficiency > 0 ? (estimatedTime - elapsed) / efficiency : estimatedTime - elapsed;
      const throughput = completionRate / (elapsed / 1000); // progress per second

      setMetrics({
        elapsedTime: elapsed,
        remainingTime: Math.max(0, remaining),
        completionRate,
        efficiency: Math.min(2, efficiency), // Cap efficiency for display
        currentThroughput: throughput
      });
    }, 500);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [isLoading, startTime, progress, estimatedTime]);

  // Particle system animation
  const initParticleSystem = useCallback(() => {
    if (!enableParticles || !particleCanvasRef.current) return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    // Create particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width / 2,
        y: Math.random() * canvas.height / 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: `rgba(255, 215, 0, ${Math.random() * 0.3 + 0.1})`
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width / 2) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height / 2) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connections
        particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(255, 215, 0, ${(80 - distance) / 800})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      if (isLoading) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [enableParticles, isLoading]);

  // Initialize particles when loading starts
  useEffect(() => {
    if (isLoading) {
      setTimeout(initParticleSystem, 100);
    }
  }, [isLoading, initParticleSystem]);

  // Stage transition animation
  const animateStageTransition = useCallback((newStageIndex: number) => {
    if (!containerRef.current) return;

    // Haptic feedback for stage completion
    triggerHaptic('light');

    // Animate stage indicators
    const stageElements = containerRef.current.querySelectorAll('.stage-indicator');
    const currentElement = stageElements[newStageIndex];

    if (currentElement) {
      executeInteraction(currentElement as HTMLElement, {
        type: 'success',
        intensity: 'medium',
        enableHaptics: false
      });
    }

    // Animate progress bar
    if (progressBarRef.current) {
      animateTo(progressBarRef.current, {
        scaleX: progress / 100,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [animateTo, executeInteraction, triggerHaptic, progress]);

  // Watch for stage changes
  useEffect(() => {
    if (currentStageIndex >= 0) {
      animateStageTransition(currentStageIndex);
    }
  }, [currentStageIndex, animateStageTransition]);

  // Format time utility
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${seconds}s`;
  };

  // Get theme classes
  const getThemeClasses = () => {
    const themes = {
      dark: 'bg-gray-900 border-gray-700',
      glass: 'glass-primary border-white/10',
      premium: 'bg-gradient-to-br from-gray-900 to-black border-yellow-400/30'
    };
    return themes[theme];
  };

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      >
        <motion.div
          ref={containerRef}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className={`relative max-w-2xl w-full rounded-2xl border ${getThemeClasses()} p-8 overflow-hidden`}
        >
          {/* Particle Canvas */}
          {enableParticles && (
            <canvas
              ref={particleCanvasRef}
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{ width: '100%', height: '100%' }}
            />
          )}

          {/* Header */}
          <div className="relative z-10 text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              {stages[currentStageIndex]?.icon || <Terminal className="w-8 h-8 text-yellow-400" />}
            </motion.div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">
              {stages[currentStageIndex]?.name || 'Processing'}
            </h2>
            
            <p className="text-gray-300 text-sm">
              {message || stages[currentStageIndex]?.description || 'Please wait while we process your request...'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative z-10 mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            <div className="relative w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-full" />
              
              {/* Progress fill */}
              <motion.div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </motion.div>
              
              {/* Progress indicator */}
              <motion.div
                className="absolute top-1/2 h-4 w-4 bg-white rounded-full border-2 border-yellow-400 transform -translate-y-1/2"
                initial={{ left: '-8px' }}
                animate={{ left: `calc(${progress}% - 8px)` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="relative z-10 mb-8">
            <div className="flex justify-between items-center space-x-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={`stage-indicator flex-1 text-center transition-all duration-300 ${
                    index <= currentStageIndex ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                      completedStages.has(stage.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : index === currentStageIndex
                        ? 'border-yellow-400 text-yellow-400 animate-pulse'
                        : 'border-gray-600 text-gray-600'
                    }`}
                  >
                    {completedStages.has(stage.id) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{stage.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Metrics */}
          {showAdvancedMetrics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center"
            >
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Elapsed</div>
                <div className="text-sm font-mono text-white">
                  {formatTime(metrics.elapsedTime)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Remaining</div>
                <div className="text-sm font-mono text-white">
                  {formatTime(metrics.remainingTime)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                <div className={`text-sm font-mono ${
                  metrics.efficiency < 1 ? 'text-green-400' : 
                  metrics.efficiency > 1.5 ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {(metrics.efficiency * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Rate</div>
                <div className="text-sm font-mono text-white">
                  {(metrics.currentThroughput * 100).toFixed(1)}/s
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="relative z-10 flex justify-center space-x-4">
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Cancel</span>
              </motion.button>
            )}
          </div>

          {/* Loading Animation Dots */}
          <div className="relative z-10 flex justify-center mt-6">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-yellow-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedLoadingSystem;