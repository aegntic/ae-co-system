import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, 
  Linkedin, 
  Twitter, 
  MessageCircle, 
  Send, 
  Check, 
  X, 
  Shield, 
  ExternalLink,
  AlertCircle,
  Zap
} from 'lucide-react';

interface SocialVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: (verifiedPlatforms: string[]) => void;
  userEmail: string;
  existingConnections?: string[];
}

interface PlatformConnection {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'not_connected' | 'pending' | 'verified' | 'failed';
  verificationUrl?: string;
  benefits: string[];
}

export const SocialVerificationModal: React.FC<SocialVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerificationComplete,
  userEmail,
  existingConnections = []
}) => {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'from-gray-600 to-gray-800',
      status: 'not_connected',
      benefits: ['Repository integration', 'Code showcases', 'Developer credibility']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-800',
      status: 'not_connected',
      benefits: ['Professional network', 'Business connections', 'Career opportunities']
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: Twitter,
      color: 'from-sky-500 to-blue-600',
      status: 'not_connected',
      benefits: ['Tech community', 'Real-time updates', 'Thought leadership']
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: MessageCircle,
      color: 'from-indigo-500 to-purple-600',
      status: 'not_connected',
      benefits: ['Developer communities', 'Real-time chat', 'Project collaboration']
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      color: 'from-blue-400 to-blue-600',
      status: 'not_connected',
      benefits: ['Secure messaging', 'Channel notifications', 'Bot integrations']
    }
  ]);

  const [currentStep, setCurrentStep] = useState<'intro' | 'platforms' | 'verification' | 'complete'>('intro');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});

  // Initialize existing connections
  useEffect(() => {
    if (existingConnections.length > 0) {
      setPlatforms(prev => prev.map(platform => ({
        ...platform,
        status: existingConnections.includes(platform.id) ? 'verified' : 'not_connected'
      })));
      setSelectedPlatforms(existingConnections);
    }
  }, [existingConnections]);

  // Generate aegntic verification URL for each platform
  const generateVerificationUrl = (platformId: string) => {
    const baseUrl = import.meta.env.DEV 
      ? 'http://localhost:3000' 
      : 'https://aegntic.com';
    
    const params = new URLSearchParams({
      platform: platformId,
      email: userEmail,
      return_to: window.location.href,
      source: '4site_pro',
      timestamp: Date.now().toString()
    });

    return `${baseUrl}/verify/${platformId}?${params.toString()}`;
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const startVerification = async () => {
    setCurrentStep('verification');
    setIsProcessing(true);

    // Update selected platforms with verification URLs
    setPlatforms(prev => prev.map(platform => {
      if (selectedPlatforms.includes(platform.id)) {
        return {
          ...platform,
          status: 'pending',
          verificationUrl: generateVerificationUrl(platform.id)
        };
      }
      return platform;
    }));

    // Simulate verification process (in real implementation, this would poll aegntic API)
    for (const platformId of selectedPlatforms) {
      // Open verification window for each platform
      const platform = platforms.find(p => p.id === platformId);
      if (platform) {
        const verificationUrl = generateVerificationUrl(platformId);
        window.open(verificationUrl, `verify_${platformId}`, 'width=600,height=700');
      }
    }

    setIsProcessing(false);
  };

  const checkVerificationStatus = async () => {
    // Poll aegntic API to check verification status
    try {
      const response = await fetch('/api/social/verification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userEmail, 
          platforms: selectedPlatforms 
        })
      });

      if (response.ok) {
        const results = await response.json();
        setVerificationResults(results.verifications);
        
        // Update platform statuses
        setPlatforms(prev => prev.map(platform => ({
          ...platform,
          status: results.verifications[platform.id] ? 'verified' : 
                 selectedPlatforms.includes(platform.id) ? 'pending' : 'not_connected'
        })));

        // Check if all selected platforms are verified
        const allVerified = selectedPlatforms.every(id => results.verifications[id]);
        if (allVerified) {
          setCurrentStep('complete');
          onVerificationComplete(selectedPlatforms);
        }
      }
    } catch (error) {
      console.error('Verification status check failed:', error);
    }
  };

  const handleSkip = () => {
    onVerificationComplete([]);
    onClose();
  };

  const handleComplete = () => {
    const verifiedPlatforms = Object.entries(verificationResults)
      .filter(([_, verified]) => verified)
      .map(([platform, _]) => platform);
    
    onVerificationComplete(verifiedPlatforms);
    onClose();
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h3>
        <p className="text-gray-300">
          Connect your social platforms through aegntic for enhanced features and credibility
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-1">Why verify with aegntic?</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Enhanced profile credibility and trust score</li>
              <li>• Access to exclusive community features</li>
              <li>• Priority showcase placement in Pro grid</li>
              <li>• Cross-platform project synchronization</li>
              <li>• Advanced analytics and insights</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('platforms')}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all"
        >
          Start Verification
        </button>
        <button
          onClick={handleSkip}
          className="px-6 py-3 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );

  const renderPlatformsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Select Platforms to Verify</h3>
        <p className="text-gray-400">Choose which social platforms you'd like to connect</p>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);
          const isVerified = platform.status === 'verified';
          
          return (
            <motion.button
              key={platform.id}
              onClick={() => !isVerified && handlePlatformSelect(platform.id)}
              disabled={isVerified}
              className={`w-full p-4 rounded-lg border transition-all ${
                isVerified 
                  ? 'bg-green-500/20 border-green-400/40 cursor-default'
                  : isSelected
                    ? `bg-gradient-to-r ${platform.color}/20 border-white/40`
                    : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
              }`}
              whileHover={!isVerified ? { scale: 1.02 } : {}}
              whileTap={!isVerified ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-white">{platform.name}</h4>
                    {isVerified && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-sm text-gray-400">
                    {platform.benefits.slice(0, 2).join(' • ')}
                  </p>
                </div>
                
                <div className={`w-5 h-5 rounded border-2 transition-all ${
                  isVerified
                    ? 'bg-green-400 border-green-400'
                    : isSelected
                      ? 'bg-white border-white'
                      : 'border-gray-400'
                }`}>
                  {(isSelected || isVerified) && (
                    <Check className="w-3 h-3 text-black m-0.5" />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('intro')}
          className="px-6 py-3 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
        >
          Back
        </button>
        <button
          onClick={startVerification}
          disabled={selectedPlatforms.length === 0}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
        >
          Verify Selected ({selectedPlatforms.length})
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Verification in Progress</h3>
        <p className="text-gray-400">Complete verification in the opened windows</p>
      </div>

      <div className="space-y-3">
        {platforms
          .filter(p => selectedPlatforms.includes(p.id))
          .map((platform) => {
            const Icon = platform.icon;
            const isVerified = verificationResults[platform.id];
            const isPending = platform.status === 'pending' && !isVerified;
            
            return (
              <div
                key={platform.id}
                className={`p-4 rounded-lg border ${
                  isVerified
                    ? 'bg-green-500/20 border-green-400/40'
                    : 'bg-gray-800/50 border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{platform.name}</h4>
                    <p className="text-sm text-gray-400">
                      {isVerified ? 'Verified successfully' : 'Waiting for verification...'}
                    </p>
                  </div>
                  
                  {isVerified ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                  
                  {platform.verificationUrl && (
                    <button
                      onClick={() => window.open(platform.verificationUrl, `verify_${platform.id}`, 'width=600,height=700')}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Reopen verification window"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-1">Verification Instructions</h4>
            <p className="text-sm text-gray-300">
              1. Complete the verification process in each opened window<br />
              2. Return to this page after verification<br />
              3. Click "Check Status" to verify completion
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={checkVerificationStatus}
          className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
        >
          Check Status
        </button>
        <button
          onClick={handleSkip}
          className="px-6 py-3 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
        >
          Skip
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => {
    const verifiedCount = Object.values(verificationResults).filter(Boolean).length;
    
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Verification Complete!</h3>
          <p className="text-gray-300">
            Successfully verified {verifiedCount} platform{verifiedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">You now have access to:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Enhanced profile credibility score</li>
            <li>• Priority placement in Pro showcase</li>
            <li>• Cross-platform project sync</li>
            <li>• Advanced analytics dashboard</li>
            <li>• Exclusive community features</li>
          </ul>
        </div>

        <button
          onClick={handleComplete}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all"
        >
          Continue to Site
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">Social Verification</span>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentStep === 'intro' && renderIntroStep()}
            {currentStep === 'platforms' && renderPlatformsStep()}
            {currentStep === 'verification' && renderVerificationStep()}
            {currentStep === 'complete' && renderCompleteStep()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialVerificationModal;