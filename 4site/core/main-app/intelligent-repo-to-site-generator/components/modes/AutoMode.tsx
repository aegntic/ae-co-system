import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { LoadingIndicator } from '../generator/LoadingIndicator';
import { SiteData, AppState } from '../../types';

interface AutoModeProps {
  onSiteGenerated: (siteData: SiteData) => void;
  onBack: () => void;
}

interface AutoModeStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: number;
}

const autoModeSteps: AutoModeStep[] = [
  {
    id: 'analyze',
    title: 'Analyzing Repository',
    description: 'Reading your README and understanding your project structure',
    icon: 'Search',
    duration: 3000
  },
  {
    id: 'select',
    title: 'Selecting Template',
    description: 'Choosing the perfect template based on your project type',
    icon: 'Layout',
    duration: 2000
  },
  {
    id: 'generate',
    title: 'Generating Content',
    description: 'Creating optimized content and selecting partner tools',
    icon: 'Sparkles',
    duration: 4000
  },
  {
    id: 'deploy',
    title: 'Preparing Deployment',
    description: 'Setting up your site for instant deployment',
    icon: 'Rocket',
    duration: 2000
  }
];

export const AutoMode: React.FC<AutoModeProps> = ({ onSiteGenerated, onBack }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [state, setState] = useState<'input' | 'processing' | 'complete'>('input');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setState('processing');
    setError(null);
    setCurrentStep(0);

    try {
      // Simulate step-by-step processing
      for (let i = 0; i < autoModeSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, autoModeSteps[i].duration));
      }

      // Generate mock site data
      const mockSiteData: SiteData = {
        id: Date.now().toString(),
        title: 'Auto-Generated Project Site',
        repoUrl,
        generatedMarkdown: '# Auto-Generated Site\n\nThis is your automatically generated project site.',
        sections: [
          {
            id: 'overview',
            title: 'Overview',
            content: '<h2>Project Overview</h2><p>Your project has been automatically analyzed and presented.</p>',
            order: 1
          }
        ],
        template: 'TechProjectTemplate',
        tier: 'free',
        partnerToolRecommendations: [
          {
            name: 'Vercel',
            description: 'Deploy your project instantly',
            ctaUrl: 'https://vercel.com',
            iconUrl: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico'
          }
        ]
      };

      setState('complete');
      onSiteGenerated(mockSiteData);
    } catch (error) {
      setError('Failed to generate site. Please try again.');
      setState('input');
    }
  }, [repoUrl, onSiteGenerated]);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Button
            onClick={onBack}
            variant="ghost"
            className="absolute top-8 left-8 text-slate-400 hover:text-slate-200"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Back
          </Button>
          
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="Zap" size={32} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-400">
            Auto Mode
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            One-click magic! Just provide your GitHub repository URL and we'll handle the rest.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="repo-url" className="block text-sm font-medium text-slate-300 mb-2">
                    GitHub Repository URL
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
                      https://github.com/
                    </span>
                    <Input
                      id="repo-url"
                      type="text"
                      value={repoUrl.replace('https://github.com/', '')}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const fullUrl = newValue.startsWith('https://github.com/') 
                          ? newValue 
                          : `https://github.com/${newValue}`;
                        setRepoUrl(fullUrl);
                      }}
                      placeholder="aegntic/project4site"
                      className="w-full pl-[145px]"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Enter any public GitHub repository URL to get started
                  </p>
                </div>

                {error && <Alert type="error" message={error} />}

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Icon name="Info" size={20} className="text-blue-400" />
                    What happens next?
                  </h3>
                  <div className="space-y-3">
                    {autoModeSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{step.title}</div>
                          <div className="text-slate-400">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!repoUrl || !validateUrl(repoUrl)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  <Icon name="Zap" size={20} className="mr-2" />
                  Generate Site Automatically
                </Button>
              </form>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Icon name={autoModeSteps[currentStep]?.icon || 'Zap'} size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {autoModeSteps[currentStep]?.title || 'Processing...'}
                </h2>
                <p className="text-slate-300">
                  {autoModeSteps[currentStep]?.description || 'Working on your site...'}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                {autoModeSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : index < currentStep
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-slate-800/50 border border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === currentStep
                          ? 'bg-yellow-500 text-white animate-pulse'
                          : index < currentStep
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {index < currentStep ? (
                        <Icon name="Check" size={20} />
                      ) : (
                        <Icon name={step.icon} size={20} />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-200">{step.title}</div>
                      <div className="text-sm text-slate-400">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / autoModeSteps.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Step {currentStep + 1} of {autoModeSteps.length}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};