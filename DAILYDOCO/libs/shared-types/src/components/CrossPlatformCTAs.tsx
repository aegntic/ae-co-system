import React, { useState, useEffect } from 'react';
import { useUnifiedAuth, useCrossPlatformNavigation } from '../hooks/useUnifiedAuth';
import { CrossPlatformProject } from '../auth/unified-auth.types';

interface CrossPlatformCTAProps {
  variant: 'website-to-tutorial' | 'tutorial-to-website' | 'upgrade-prompt' | 'cross-sell';
  project?: CrossPlatformProject;
  customData?: any;
  onConversion?: (event: string) => void;
}

export const CrossPlatformCTA: React.FC<CrossPlatformCTAProps> = ({
  variant,
  project,
  customData,
  onConversion
}) => {
  const { user, generateTutorial, getFlyWheelMetrics } = useUnifiedAuth();
  const { navigateToPlatform, canAccessPlatform } = useCrossPlatformNavigation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadUserMetrics();
    }
  }, [user]);

  const loadUserMetrics = async () => {
    try {
      const userMetrics = await getFlyWheelMetrics('30d');
      setMetrics(userMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleGenerateTutorial = async () => {
    if (!user || !project) return;

    setIsGenerating(true);
    try {
      const tutorialId = await generateTutorial({
        user_id: user.id,
        project_id: project.id,
        website_url: project.metadata.deployment_url || '',
        project_metadata: {
          title: project.metadata.title || 'Untitled Project',
          description: project.metadata.description || '',
          tech_stack: project.metadata.tech_stack || [],
          features: [],
          github_repo: project.metadata.github_repo
        },
        tutorial_preferences: {
          length: 'medium',
          complexity: 'intermediate',
          include_code_walkthrough: true,
          include_deployment: true,
          narration_style: 'educational'
        }
      });

      onConversion?.('tutorial_generated');
      
      // Navigate to DailyDoco to track progress
      await navigateToPlatform('dailydoco', `/tutorial/${tutorialId}`);
    } catch (error) {
      console.error('Failed to generate tutorial:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateWebsite = async () => {
    onConversion?.('website_creation_initiated');
    await navigateToPlatform('foursitepro', '/generate');
  };

  const handleUpgrade = async () => {
    onConversion?.('upgrade_initiated');
    await navigateToPlatform('foursitepro', '/pricing');
  };

  // Website to Tutorial CTA (appears on 4site.pro after website creation)
  if (variant === 'website-to-tutorial') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 p-1">
        <div className="bg-black rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Website Created Successfully!</span>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                Turn Your Website Into a Viral Tutorial
              </h3>
              
              <p className="text-gray-300 mb-4">
                Transform your {project?.metadata.title} into an engaging video tutorial. 
                Generate passive income while helping other developers learn.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerateTutorial}
                  disabled={isGenerating}
                  className="relative px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      🎬 Generate Tutorial
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => onConversion?.('tutorial_dismissed')}
                  className="px-6 py-3 border border-gray-600 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            
            <div className="hidden md:block ml-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">$500+</div>
                <div className="text-sm text-gray-400">Avg. monthly revenue</div>
                <div className="text-sm text-gray-400">from tutorials</div>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Recent success:</span>
                <span className="text-green-400">"React Portfolio" → 50K views</span>
                <span className="text-green-400">"Vue Dashboard" → 25K views</span>
              </div>
              <span className="text-amber-400">⚡ 95% of tutorials go viral</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tutorial to Website CTA (appears in DailyDoco videos)
  if (variant === 'tutorial-to-website') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
        <div className="bg-black rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">
                Build Your Own in 60 Seconds
              </h3>
              
              <p className="text-gray-300 mb-4">
                Create a similar project with our AI-powered website generator. 
                No coding required - just describe what you want!
              </p>

              <button
                onClick={handleCreateWebsite}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-700 transition-all"
              >
                🚀 Create Website Now
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            
            <div className="hidden md:flex flex-col items-center ml-6 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm text-gray-400">60 second</div>
              <div className="text-sm text-gray-400">generation</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upgrade Prompt (appears when user hits limits)
  if (variant === 'upgrade-prompt') {
    const isFreeTier = user?.subscription_tier === 'free';
    const websitesCreated = metrics?.metrics.websites_created || 0;
    const tutorialsGenerated = metrics?.metrics.tutorials_generated || 0;

    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 via-red-600 to-pink-600 p-1">
        <div className="bg-black rounded-lg p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">
              🔥 Your Content is Going Viral!
            </h3>
            
            <p className="text-gray-300 mb-2">
              You've created {websitesCreated} websites and {tutorialsGenerated} tutorials
            </p>
            
            <p className="text-lg text-amber-400 font-semibold mb-6">
              Unlock unlimited creation and earn 10x more!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">Unlimited</div>
                <div className="text-gray-400">Websites & Tutorials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">Remove</div>
                <div className="text-gray-400">4site.pro Branding</div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-105"
            >
              Upgrade to Pro - $29/month
            </button>
            
            <p className="text-xs text-gray-500 mt-3">
              🚀 Most users 5x their revenue within 30 days
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Cross-sell between platforms
  if (variant === 'cross-sell') {
    const hasWebsites = metrics?.metrics.websites_created > 0;
    const hasTutorials = metrics?.metrics.tutorials_generated > 0;

    return (
      <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          🎯 Maximize Your Creator Potential
        </h3>

        <div className="space-y-4">
          {!hasWebsites && (
            <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div>
                <div className="font-medium text-white">Create Professional Websites</div>
                <div className="text-sm text-gray-400">Generate websites in 60 seconds with AI</div>
              </div>
              <button
                onClick={handleCreateWebsite}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try 4site.pro
              </button>
            </div>
          )}

          {!hasTutorials && (
            <div className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
              <div>
                <div className="font-medium text-white">Automate Documentation</div>
                <div className="text-sm text-gray-400">Turn coding sessions into viral tutorials</div>
              </div>
              <button
                onClick={() => navigateToPlatform('dailydoco', '/')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try DailyDoco
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// Smart CTA Controller - determines which CTA to show when
export const SmartCTAController: React.FC<{
  currentPlatform: 'foursitepro' | 'dailydoco';
  currentPage: string;
  userActivity: any;
}> = ({ currentPlatform, currentPage, userActivity }) => {
  const { user } = useUnifiedAuth();
  const [activeCTA, setActiveCTA] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Determine which CTA to show based on context
    const ctaLogic = {
      // 4site.pro CTAs
      'foursitepro': {
        '/success': 'website-to-tutorial', // After website creation
        '/dashboard': 'cross-sell',
        '/pricing': null
      },
      // DailyDoco CTAs  
      'dailydoco': {
        '/': 'tutorial-to-website',
        '/dashboard': 'cross-sell',
        '/upgrade': null
      }
    };

    const suggestedCTA = ctaLogic[currentPlatform]?.[currentPage];
    
    // Check if user has hit limits
    if (user.subscription_tier === 'free' && shouldShowUpgradePrompt(userActivity)) {
      setActiveCTA('upgrade-prompt');
    } else if (suggestedCTA) {
      setActiveCTA(suggestedCTA);
    }
  }, [currentPlatform, currentPage, userActivity, user]);

  const shouldShowUpgradePrompt = (activity: any): boolean => {
    // Show upgrade prompt when user hits free tier limits
    const freeWebsiteLimit = 3;
    const freeTutorialLimit = 1;
    
    return activity.websites_created >= freeWebsiteLimit || 
           activity.tutorials_generated >= freeTutorialLimit;
  };

  const handleCTAConversion = (event: string) => {
    // Track conversion events for analytics
    console.log('CTA Conversion:', {
      platform: currentPlatform,
      page: currentPage,
      event,
      user_id: user?.id
    });
  };

  if (!activeCTA) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm z-50 animate-slide-in-bottom">
      <CrossPlatformCTA
        variant={activeCTA as any}
        onConversion={handleCTAConversion}
      />
    </div>
  );
};

// Conversion Analytics Hook
export const useConversionTracking = () => {
  const { user, authService } = useUnifiedAuth();

  const trackConversion = async (
    eventType: string,
    sourcePlatform: 'foursitepro' | 'dailydoco',
    targetPlatform?: 'foursitepro' | 'dailydoco',
    metadata?: any
  ) => {
    if (!user) return;

    try {
      await authService.trackConversionEvent({
        user_id: user.id,
        event_type: eventType as any,
        source_platform: sourcePlatform,
        target_platform: targetPlatform,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };

  return { trackConversion };
};

// A/B Testing Hook for CTAs
export const useCTAOptimization = () => {
  const [variant, setVariant] = useState<string>('control');

  useEffect(() => {
    // Simple A/B testing logic
    const variants = ['control', 'variant_a', 'variant_b'];
    const selectedVariant = variants[Math.floor(Math.random() * variants.length)];
    setVariant(selectedVariant);
  }, []);

  const getCTAConfig = (baseConfig: any) => {
    const variants = {
      control: baseConfig,
      variant_a: {
        ...baseConfig,
        buttonText: baseConfig.buttonText?.replace('Generate', 'Create'),
        colorScheme: 'green'
      },
      variant_b: {
        ...baseConfig,
        buttonText: baseConfig.buttonText?.replace('Tutorial', 'Video Guide'),
        colorScheme: 'purple'
      }
    };

    return variants[variant as keyof typeof variants] || baseConfig;
  };

  return { variant, getCTAConfig };
};