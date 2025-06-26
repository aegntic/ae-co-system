/**
 * PSYCHOLOGICAL LOADING EXPERIENCE
 * Beautiful interface for strategic delay with encouraging AI insights
 * 
 * Creates anticipation and value perception through intelligent timing
 */

import React, { useState, useEffect, useRef } from 'react';
import { PsychologicalLoadingOrchestrator, LoadingPresets } from '../services/psychologicalLoadingOrchestrator';

interface LoadingInsight {
  phase: 'discovery' | 'analysis' | 'enhancement' | 'finalization';
  message: string;
  technicalNote: string;
  encouragement: string;
  duration: number;
  confidence: number;
}

interface PsychologicalLoadingProps {
  repoUrl: string;
  userTier: 'free' | 'pro' | 'business' | 'enterprise';
  onComplete: (siteData: any) => void;
  onError: (error: string) => void;
}

export const PsychologicalLoadingExperience: React.FC<PsychologicalLoadingProps> = ({
  repoUrl,
  userTier,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState(0);
  const [currentInsight, setCurrentInsight] = useState<LoadingInsight | null>(null);
  const [phase, setPhase] = useState<'discovery' | 'analysis' | 'enhancement' | 'finalization'>('discovery');
  const [isVisible, setIsVisible] = useState(true);
  const [showEncouragement, setShowEncouragement] = useState(false);
  
  const orchestratorRef = useRef<PsychologicalLoadingOrchestrator>();
  const progressRingRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    startLoadingExperience();
  }, [repoUrl, userTier]);

  const startLoadingExperience = async () => {
    try {
      const config = LoadingPresets[userTier] || LoadingPresets.free;
      orchestratorRef.current = new PsychologicalLoadingOrchestrator(config);
      
      const siteData = await orchestratorRef.current.startLoadingExperience(
        repoUrl,
        handleProgressUpdate
      );
      
      onComplete(siteData);
    } catch (error) {
      onError(error.message);
    }
  };

  const handleProgressUpdate = (newProgress: number, insight: LoadingInsight) => {
    setProgress(newProgress);
    setCurrentInsight(insight);
    setPhase(insight.phase);
    
    // Animate the encouragement text appearance
    setShowEncouragement(false);
    setTimeout(() => setShowEncouragement(true), 300);
    
    // Update progress ring
    if (progressRingRef.current) {
      const circumference = 2 * Math.PI * 120; // radius = 120
      const strokeDasharray = circumference;
      const strokeDashoffset = circumference - (newProgress / 100) * circumference;
      
      progressRingRef.current.style.strokeDasharray = `${strokeDasharray}`;
      progressRingRef.current.style.strokeDashoffset = `${strokeDashoffset}`;
    }
  };

  const getPhaseColor = (currentPhase: string): string => {
    switch (currentPhase) {
      case 'discovery': return '#3b82f6'; // Blue
      case 'analysis': return '#10b981';  // Green
      case 'enhancement': return '#f59e0b'; // Orange
      case 'finalization': return '#8b5cf6'; // Purple
      default: return '#6b7280';
    }
  };

  const getPhaseIcon = (currentPhase: string): string => {
    switch (currentPhase) {
      case 'discovery': return '🔍';
      case 'analysis': return '🧠';
      case 'enhancement': return '✨';
      case 'finalization': return '🚀';
      default: return '⚡';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 backdrop-blur-lg">
      <div className="apple-glass max-w-2xl w-full mx-4 p-8 text-center">
        
        {/* Progress Ring */}
        <div className="relative mx-auto mb-8" style={{ width: '280px', height: '280px' }}>
          <svg 
            className="transform -rotate-90 w-full h-full"
            viewBox="0 0 280 280"
          >
            {/* Background ring */}
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            
            {/* Progress ring */}
            <circle
              ref={progressRingRef}
              cx="140"
              cy="140"
              r="120"
              stroke={getPhaseColor(phase)}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${getPhaseColor(phase)}40)`,
                transition: 'stroke-dashoffset 0.6s cubic-bezier(0.25, 1, 0.5, 1), stroke 0.3s ease'
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div 
              className="text-6xl mb-2 transition-all duration-300"
              style={{ filter: `drop-shadow(0 0 12px ${getPhaseColor(phase)}60)` }}
            >
              {getPhaseIcon(phase)}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round(progress)}%
            </div>
            <div className="text-sm text-gray-400 capitalize">
              {phase}
            </div>
          </div>
        </div>

        {/* Phase Progress Dots */}
        <div className="flex justify-center space-x-4 mb-8">
          {['discovery', 'analysis', 'enhancement', 'finalization'].map((p, index) => (
            <div
              key={p}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                p === phase 
                  ? 'scale-125' 
                  : progress > (index + 1) * 25 
                    ? 'opacity-60' 
                    : 'opacity-20'
              }`}
              style={{
                backgroundColor: p === phase ? getPhaseColor(p) : '#6b7280',
                boxShadow: p === phase ? `0 0 12px ${getPhaseColor(p)}60` : 'none'
              }}
            />
          ))}
        </div>

        {/* Current Insight */}
        {currentInsight && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Technical Message */}
            <div className="text-xl text-white font-medium">
              {currentInsight.message}
            </div>
            
            {/* Technical Note */}
            <div className="text-sm text-gray-400">
              {currentInsight.technicalNote}
            </div>
            
            {/* Encouragement - The Psychology Magic */}
            <div 
              className={`text-lg transition-all duration-500 transform ${
                showEncouragement 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ color: getPhaseColor(phase) }}
            >
              <div className="inline-flex items-center space-x-2">
                <span className="text-yellow-400">💡</span>
                <span className="font-medium italic">
                  "{currentInsight.encouragement}"
                </span>
              </div>
            </div>

            {/* Confidence Indicator */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>AI Confidence:</span>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.floor(currentInsight.confidence * 5)
                        ? 'bg-green-400'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span>{Math.round(currentInsight.confidence * 100)}%</span>
            </div>
          </div>
        )}

        {/* 4site.foresight Branding */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">
            Powered by 4site.foresight
          </div>
          <div className="text-xs text-gray-500">
            AI that sees potential before others do
          </div>
        </div>

        {/* Subtle Animation Background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${getPhaseColor(phase)}40 0%, transparent 70%)`,
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>
    </div>
  );
};

/**
 * USAGE EXAMPLE:
 * 
 * <PsychologicalLoadingExperience
 *   repoUrl="https://github.com/user/repo"
 *   userTier="free"
 *   onComplete={(siteData) => {
 *     // Site generation complete!
 *     setSiteData(siteData);
 *   }}
 *   onError={(error) => {
 *     // Handle errors gracefully
 *     showErrorMessage(error);
 *   }}
 * />
 */

export default PsychologicalLoadingExperience;