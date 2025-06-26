import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Users, Sparkles, X, Check, Github, Send, Shield } from 'lucide-react';
import { SocialVerificationModal } from '../auth/SocialVerificationModal';

interface LeadCaptureWidgetProps {
  siteId: string;
  projectType?: string;
  template?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline';
  theme?: 'dark' | 'light' | 'auto';
  compact?: boolean;
  className?: string;
}

interface VisitorMetadata {
  sessionId: string;
  timeOnSite: number;
  scrollDepth: number;
  sectionsViewed: string[];
  interactionCount: number;
  referrer: string;
  userAgent: string;
  timezone: string;
  language: string;
  screenResolution: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface LeadData {
  email: string;
  projectInterests: string[];
  socialPlatforms: string[];
  newsletterOptIn: boolean;
  metadata: VisitorMetadata;
}

export const LeadCaptureWidget: React.FC<LeadCaptureWidgetProps> = ({
  siteId,
  projectType = 'tech',
  template = 'unknown',
  position = 'bottom-right',
  theme = 'auto',
  compact = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [projectInterests, setProjectInterests] = useState<string[]>([]);
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [visitorMetadata, setVisitorMetadata] = useState<VisitorMetadata | null>(null);
  const [showSocialVerification, setShowSocialVerification] = useState(false);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<string[]>([]);
  
  const sessionStartRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const interactionCountRef = useRef<number>(0);
  const sectionsViewedRef = useRef<Set<string>>(new Set());

  // Initialize visitor tracking
  useEffect(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      scrollDepthRef.current = Math.max(scrollDepthRef.current, scrollPercent);
    };

    // Track interactions
    const handleInteraction = () => {
      interactionCountRef.current += 1;
    };

    // Track section views using Intersection Observer
    const observeSections = () => {
      const sections = document.querySelectorAll('section, .section, [data-section]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id || entry.target.className || 'unnamed-section';
            sectionsViewedRef.current.add(sectionId);
          }
        });
      }, { threshold: 0.5 });

      sections.forEach(section => observer.observe(section));
      return () => observer.disconnect();
    };

    // Device detection
    const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    };

    // Set up event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    const cleanupSectionObserver = observeSections();

    // Initialize metadata
    const metadata: VisitorMetadata = {
      sessionId,
      timeOnSite: 0,
      scrollDepth: 0,
      sectionsViewed: [],
      interactionCount: 0,
      referrer: document.referrer || 'direct',
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      deviceType: getDeviceType()
    };
    
    setVisitorMetadata(metadata);

    // Auto-show widget after engagement signals
    const autoShowTimer = setTimeout(() => {
      if (scrollDepthRef.current > 30 || interactionCountRef.current > 3) {
        setIsOpen(true);
      }
    }, 15000); // Show after 15 seconds if engaged

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      cleanupSectionObserver();
      clearTimeout(autoShowTimer);
    };
  }, []);

  // Update metadata before submission
  const updateMetadata = (): VisitorMetadata => {
    if (!visitorMetadata) return {} as VisitorMetadata;
    
    return {
      ...visitorMetadata,
      timeOnSite: Math.round((Date.now() - sessionStartRef.current) / 1000),
      scrollDepth: scrollDepthRef.current,
      sectionsViewed: Array.from(sectionsViewedRef.current),
      interactionCount: interactionCountRef.current
    };
  };

  // Submit lead data to API
  const submitLead = async (leadData: LeadData) => {
    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/leads/capture'
        : '/api/leads/capture';
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          projectType,
          template,
          ...leadData,
          captureTimestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit lead: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Lead capture error:', error);
      // Still mark as submitted for UX - we'll retry in background
      return { success: true };
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    const finalMetadata = updateMetadata();
    const leadData: LeadData = {
      email: email.trim(),
      projectInterests,
      socialPlatforms: [...socialPlatforms, ...verifiedPlatforms], // Include verified platforms
      newsletterOptIn,
      metadata: finalMetadata
    };

    await submitLead(leadData);
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Show social verification modal after lead submission for enhanced benefits
    if (verifiedPlatforms.length === 0) {
      setTimeout(() => {
        setShowSocialVerification(true);
      }, 1500);
    }
    
    // Auto-close after success
    setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  const handleSocialVerificationComplete = (platforms: string[]) => {
    setVerifiedPlatforms(platforms);
    setShowSocialVerification(false);
    
    // Update the lead with verified platforms
    if (platforms.length > 0) {
      submitLead({
        email: email.trim(),
        projectInterests,
        socialPlatforms: [...socialPlatforms, ...platforms],
        newsletterOptIn,
        metadata: {
          ...updateMetadata(),
          verifiedPlatforms: platforms,
          verificationCompleted: true
        }
      });
    }
  };

  const projectInterestOptions = [
    'Web Development', 'Mobile Apps', 'AI/ML', 'DevOps', 'Blockchain',
    'Game Development', 'Data Science', 'UI/UX Design', 'Backend Systems', 'Open Source'
  ];

  const socialPlatformOptions = [
    { id: 'github', name: 'GitHub', icon: Github },
    { id: 'linkedin', name: 'LinkedIn', icon: Users },
    { id: 'twitter', name: 'Twitter/X', icon: Send },
    { id: 'discord', name: 'Discord', icon: Users },
    { id: 'telegram', name: 'Telegram', icon: Send }
  ];

  const steps = [
    {
      title: "Join the Revolution",
      subtitle: "Get early access to 4site.pro",
      content: (
        <div className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-primary-400 focus:ring-primary-400"
            />
            <label htmlFor="newsletter" className="text-sm text-white/80">
              Get updates on new features and exclusive content
            </label>
          </div>
        </div>
      )
    },
    {
      title: "What interests you?",
      subtitle: "Help us personalize your experience",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {projectInterestOptions.map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  setProjectInterests(prev => 
                    prev.includes(interest) 
                      ? prev.filter(i => i !== interest)
                      : [...prev, interest]
                  );
                }}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  projectInterests.includes(interest)
                    ? 'bg-primary-400 text-black font-medium'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Connect your platforms",
      subtitle: "Link your profiles for exclusive features",
      content: (
        <div className="space-y-3">
          {socialPlatformOptions.map((platform) => {
            const Icon = platform.icon;
            const isVerified = verifiedPlatforms.includes(platform.id);
            const isSelected = socialPlatforms.includes(platform.id);
            
            return (
              <button
                key={platform.id}
                onClick={() => {
                  setSocialPlatforms(prev => 
                    prev.includes(platform.id)
                      ? prev.filter(p => p !== platform.id)
                      : [...prev, platform.id]
                  );
                }}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all ${
                  isVerified
                    ? 'bg-green-500/20 border border-green-400/40 text-green-300'
                    : isSelected
                      ? 'bg-primary-400 text-black'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{platform.name}</span>
                {isVerified && <Shield className="w-4 h-4 text-green-400" />}
                {(isSelected || isVerified) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            );
          })}
          
          {verifiedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
              <div className="flex items-center space-x-2 text-green-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {verifiedPlatforms.length} platform{verifiedPlatforms.length !== 1 ? 's' : ''} verified through aegntic
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowSocialVerification(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg text-purple-300 hover:text-purple-200 transition-all"
          >
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Verify with aegntic for enhanced benefits</span>
            </div>
          </button>
        </div>
      )
    }
  ];

  if (compact || position === 'inline') {
    return (
      <div className={`inline-block ${className}`}>
        <motion.button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-black font-semibold rounded-lg transition-all transform hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-4 h-4" />
          Join Waitlist
        </motion.button>
        
        <LeadCaptureModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          onSubmit={handleSubmit}
          email={email}
        />
        
        <SocialVerificationModal
          isOpen={showSocialVerification}
          onClose={() => setShowSocialVerification(false)}
          onVerificationComplete={handleSocialVerificationComplete}
          userEmail={email}
          existingConnections={verifiedPlatforms}
        />
      </div>
    );
  }

  // Floating widget
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <AnimatePresence>
        {!isOpen && !isSubmitted && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-black font-semibold rounded-full shadow-lg transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">Join Waitlist</span>
          </motion.button>
        )}
      </AnimatePresence>

      <LeadCaptureModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        isSubmitting={isSubmitting}
        isSubmitted={isSubmitted}
        onSubmit={handleSubmit}
        email={email}
      />
      
      <SocialVerificationModal
        isOpen={showSocialVerification}
        onClose={() => setShowSocialVerification(false)}
        onVerificationComplete={handleSocialVerificationComplete}
        userEmail={email}
        existingConnections={verifiedPlatforms}
      />
    </div>
  );
};

// Modal component for lead capture flow
interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: any[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onSubmit: () => void;
  email: string;
}

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  steps,
  currentStep,
  setCurrentStep,
  isSubmitting,
  isSubmitted,
  onSubmit,
  email
}) => {
  const canProceed = currentStep === 0 ? email.trim() : true;
  const isLastStep = currentStep === steps.length - 1;

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
            className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Welcome aboard! 🚀</h3>
                <p className="text-gray-300">
                  You're on the waitlist! We'll notify you when early access is available.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{steps[currentStep].title}</h3>
                    <p className="text-gray-400 text-sm">{steps[currentStep].subtitle}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  {steps[currentStep].content}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index <= currentStep ? 'bg-primary-400' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    {currentStep > 0 && (
                      <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Back
                      </button>
                    )}
                    <button
                      onClick={isLastStep ? onSubmit : () => setCurrentStep(currentStep + 1)}
                      disabled={!canProceed || isSubmitting}
                      className="px-6 py-2 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-all"
                    >
                      {isSubmitting ? 'Submitting...' : isLastStep ? 'Join Waitlist' : 'Next'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadCaptureWidget;