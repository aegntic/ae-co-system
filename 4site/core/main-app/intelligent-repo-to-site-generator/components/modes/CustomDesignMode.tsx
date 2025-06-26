import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { LoadingIndicator } from '../generator/LoadingIndicator';
import { SiteData } from '../../types';

interface CustomDesignModeProps {
  onSiteGenerated: (siteData: SiteData) => void;
  onBack: () => void;
}

interface Designer {
  id: string;
  name: string;
  role: string;
  specialty: string;
  avatar: string;
  rating: number;
}

const designers: Designer[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Sr. Product Designer',
    specialty: 'Enterprise UX',
    avatar: '👩‍🎨',
    rating: 5
  },
  {
    id: '2',
    name: 'Mike Rodriguez',
    role: 'Creative Director',
    specialty: 'Brand Identity',
    avatar: '👨‍💼',
    rating: 5
  },
  {
    id: '3',
    name: 'Jessica Kim',
    role: 'UI/UX Specialist',
    specialty: 'Design Systems',
    avatar: '👩‍💻',
    rating: 5
  }
];

export const CustomDesignMode: React.FC<CustomDesignModeProps> = ({ onSiteGenerated, onBack }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [state, setState] = useState<'input' | 'processing' | 'design-session'>('input');
  const [error, setError] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setState('processing');
    setError(null);

    // Simulate processing
    setTimeout(() => {
      setState('design-session');
    }, 3000);
  }, [repoUrl]);

  const handleDesignerSelect = (designer: Designer) => {
    setSelectedDesigner(designer);
  };

  const handleStartSession = () => {
    // Generate site data with custom design tier
    const siteData: SiteData = {
      id: Date.now().toString(),
      title: 'Enterprise Custom Design',
      repoUrl,
      generatedMarkdown: '# Custom Enterprise Site\n\nDesigned in collaboration with our expert team.',
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          content: '<h2>Custom Enterprise Solution</h2><p>Tailored specifically for your brand.</p>',
          order: 1
        }
      ],
      template: 'CustomTemplate',
      tier: 'custom',
      customizations: {
        colorScheme: {
          primary: '#1a1a1a',
          secondary: '#0066cc',
          accent: '#00a86b',
          background: '#ffffff',
          text: '#333333'
        },
        typography: {
          fontFamily: 'Inter',
          headingFont: 'Playfair Display',
          fontSize: 'lg'
        },
        layout: {
          style: 'modern',
          navigation: 'sticky',
          footer: 'detailed'
        },
        features: {
          analytics: true,
          customDomain: true,
          seo: true,
          performance: true,
          accessibility: true,
          animations: true
        }
      },
      partnerToolRecommendations: [
        {
          name: 'Vercel Enterprise',
          description: 'Premium hosting with dedicated support',
          ctaUrl: 'https://vercel.com/enterprise'
        }
      ]
    };

    onSiteGenerated(siteData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-100">
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
          
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="Crown" size={32} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Custom Design Mode
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Enterprise-grade customization with dedicated designer collaboration
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
              <Card className="p-8 bg-slate-800/50 backdrop-blur-lg border-purple-500/20">
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
                        placeholder="aegntic/4site-pro"
                        className="w-full pl-[145px]"
                        required
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Enter your repository to begin the custom design process
                    </p>
                  </div>

                  {error && <Alert type="error" message={error} />}

                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-300 mb-4 flex items-center gap-2">
                      <Icon name="Sparkles" size={20} className="text-purple-400" />
                      What's included in Custom Design?
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-200">Dedicated Designer</div>
                          <div className="text-slate-400">Work 1-on-1 with our expert design team</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-200">Custom Branding</div>
                          <div className="text-slate-400">Tailored to your exact brand guidelines</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-200">White-Label Solution</div>
                          <div className="text-slate-400">No project4site branding anywhere</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-slate-200">Priority Support</div>
                          <div className="text-slate-400">24/7 dedicated support channel</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    <Icon name="Crown" size={20} className="mr-2" />
                    Start Custom Design Process
                  </Button>

                  <p className="text-center text-sm text-slate-400">
                    $299/month • Cancel anytime • 100% satisfaction guarantee
                  </p>
                </form>
              </Card>
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
              <LoadingIndicator message="Analyzing your repository for custom design..." />
            </motion.div>
          )}

          {state === 'design-session' && (
            <motion.div
              key="design-session"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Choose Your Designer</h2>
                <p className="text-slate-300">Select a designer who matches your vision</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {designers.map((designer) => (
                  <Card
                    key={designer.id}
                    className={`p-6 cursor-pointer transition-all duration-300 ${
                      selectedDesigner?.id === designer.id
                        ? 'ring-2 ring-purple-500 bg-purple-900/20'
                        : 'hover:ring-1 hover:ring-purple-500/50'
                    }`}
                    onClick={() => handleDesignerSelect(designer)}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">{designer.avatar}</div>
                      <h3 className="font-semibold text-lg mb-1">{designer.name}</h3>
                      <p className="text-sm text-purple-400 mb-2">{designer.role}</p>
                      <p className="text-xs text-slate-400 mb-3">{designer.specialty}</p>
                      <div className="flex justify-center gap-1">
                        {[...Array(designer.rating)].map((_, i) => (
                          <Icon key={i} name="Star" size={14} className="text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {selectedDesigner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Card className="max-w-2xl mx-auto p-8 bg-purple-900/20 border-purple-500/30">
                    <h3 className="text-2xl font-bold mb-4">Ready to Create Something Amazing?</h3>
                    <p className="text-slate-300 mb-6">
                      {selectedDesigner.name} is ready to work with you on your custom design.
                      You'll have access to live collaboration, unlimited revisions, and a dedicated Slack channel.
                    </p>
                    <Button
                      onClick={handleStartSession}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg"
                    >
                      <Icon name="Video" size={20} className="mr-2" />
                      Start Design Session
                    </Button>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};