import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Code, Zap, Sparkles } from 'lucide-react';

interface AIGenerationLoaderProps {
  isLoading: boolean;
  stage?: 'analyzing' | 'generating' | 'finalizing' | 'retrying';
  progress?: number;
  message?: string;
  substeps?: string[];
  estimatedTime?: number;
  startTime?: number;
}

export const AIGenerationLoader: React.FC<AIGenerationLoaderProps> = ({
  isLoading,
  stage = 'analyzing',
  progress = 0,
  message = 'Analyzing repository...',
  substeps = [],
  estimatedTime = 30000,
  startTime
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  useEffect(() => {
    if (!isLoading || substeps.length === 0) return;

    const stepDuration = estimatedTime / substeps.length;
    const interval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, substeps.length - 1));
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isLoading, substeps.length, estimatedTime]);

  const getStageIcon = () => {
    switch (stage) {
      case 'analyzing': return <Terminal className="w-8 h-8" />;
      case 'generating': return <Code className="w-8 h-8" />;
      case 'finalizing': return <Sparkles className="w-8 h-8" />;
      case 'retrying': return <Zap className="w-8 h-8" />;
      default: return <Terminal className="w-8 h-8" />;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'analyzing': return 'var(--vs-code-blue)';
      case 'generating': return 'var(--terminal-green)';
      case 'finalizing': return 'var(--premium-purple)';
      case 'retrying': return 'var(--terminal-yellow)';
      default: return 'var(--vs-code-blue)';
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${seconds}s`;
  };

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="bg-glass rounded-2xl p-8 max-w-md w-full mx-4 border border-[var(--border-primary)]">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
            style={{ color: getStageColor() }}
          >
            {getStageIcon()}
          </motion.div>
          
          <h2 className="text-xl font-semibold font-mono text-[var(--text-primary)] mb-2">
            AI Site Generation
          </h2>
          
          <p className="text-[var(--text-secondary)] text-sm">
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="w-full bg-[var(--surface-primary)] rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getStageColor() }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Substeps */}
        {substeps.length > 0 && (
          <div className="mb-6">
            <div className="space-y-2">
              {substeps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`flex items-center space-x-3 text-sm ${
                    index <= currentStep 
                      ? 'text-[var(--text-primary)]' 
                      : 'text-[var(--text-muted)]'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    index < currentStep 
                      ? 'bg-[var(--terminal-green)]' 
                      : index === currentStep
                      ? 'bg-[var(--vs-code-blue)] animate-pulse'
                      : 'bg-[var(--text-muted)]'
                  }`} />
                  <span className="font-mono">{step}</span>
                  {index < currentStep && (
                    <span className="text-[var(--terminal-green)] text-xs">✓</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Time Display */}
        {startTime && (
          <div className="text-center">
            <div className="text-xs text-[var(--text-secondary)] mb-1">
              Elapsed Time
            </div>
            <div className="font-mono text-sm text-[var(--text-primary)]">
              {formatTime(elapsedTime)}
              {estimatedTime > 0 && (
                <span className="text-[var(--text-muted)]">
                  {' '}/ {formatTime(estimatedTime)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="flex justify-center mt-6">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStageColor() }}
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
      </div>
    </div>
  );
};

export default AIGenerationLoader;