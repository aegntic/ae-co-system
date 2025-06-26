import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Card } from '../ui/Card';
import { SiteData, RepositoryAnalysis, AurachatMapping, MCPServerConfig } from '../../types';

interface SelectStyleModeProps {
  onSiteGenerated: (siteData: SiteData) => void;
  onBack: () => void;
}

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  data?: any;
}

export const SelectStyleMode: React.FC<SelectStyleModeProps> = ({ onSiteGenerated, onBack }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [state, setState] = useState<'input' | 'analysis' | 'subscription' | 'generation'>('input');
  const [error, setError] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    {
      id: 'crawl4ai',
      title: 'Deep Repository Crawl',
      description: 'Using crawl4ai to analyze repository structure and content',
      icon: 'Search',
      status: 'pending'
    },
    {
      id: 'aurachat',
      title: 'Enhanced Mapping',
      description: 'aurachat.io integration for intelligent project mapping',
      icon: 'Brain',
      status: 'pending'
    },
    {
      id: 'mcp',
      title: 'MCP Server Generation',
      description: 'Creating custom MCP server with tools and resources',
      icon: 'Server',
      status: 'pending'
    },
    {
      id: 'template',
      title: 'Template Selection',
      description: 'Choosing optimal template based on analysis',
      icon: 'Layout',
      status: 'pending'
    }
  ]);

  const [repoAnalysis, setRepoAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [aurachatMapping, setAurachatMapping] = useState<AurachatMapping | null>(null);
  const [mcpConfig, setMcpConfig] = useState<MCPServerConfig | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setState('analysis');
    setError(null);

    try {
      // Step 1: crawl4ai analysis
      await updateStepStatus('crawl4ai', 'processing');
      const crawlData = await simulateCrawl4aiAnalysis(repoUrl);
      setRepoAnalysis(crawlData);
      await updateStepStatus('crawl4ai', 'complete', crawlData);

      // Step 2: aurachat.io mapping
      await updateStepStatus('aurachat', 'processing');
      const aurachatData = await simulateAurachatMapping(crawlData);
      setAurachatMapping(aurachatData);
      await updateStepStatus('aurachat', 'complete', aurachatData);

      // Step 3: MCP Server generation
      await updateStepStatus('mcp', 'processing');
      const mcpData = await generateMCPServer(crawlData, aurachatData);
      setMcpConfig(mcpData);
      await updateStepStatus('mcp', 'complete', mcpData);

      // Step 4: Template selection
      await updateStepStatus('template', 'processing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await updateStepStatus('template', 'complete');

      setState('subscription');
    } catch (error) {
      setError('Analysis failed. Please try again.');
      setState('input');
    }
  }, [repoUrl]);

  const updateStepStatus = async (stepId: string, status: AnalysisStep['status'], data?: any) => {
    setAnalysisSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, data } : step
    ));
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  };

  const simulateCrawl4aiAnalysis = async (url: string): Promise<RepositoryAnalysis> => {
    // Simulate crawl4ai analysis
    return {
      languages: { TypeScript: 45, JavaScript: 30, CSS: 15, HTML: 10 },
      frameworks: ['React', 'Vite', 'TailwindCSS'],
      features: ['Component Library', 'Build System', 'Type Safety'],
      complexity: 'moderate',
      category: 'web',
      readme: {
        quality: 85,
        sections: ['Installation', 'Usage', 'API', 'Contributing'],
        hasImages: true,
        hasDemo: true
      },
      activity: {
        stars: 1250,
        forks: 234,
        lastCommit: '2 days ago',
        contributors: 12
      }
    };
  };

  const simulateAurachatMapping = async (analysis: RepositoryAnalysis): Promise<AurachatMapping> => {
    // Simulate aurachat.io mapping
    return {
      projectStructure: {
        architecture: 'Single Page Application',
        components: [
          {
            name: 'UI Components',
            type: 'Frontend',
            description: 'Reusable React components',
            connections: ['Services', 'Types']
          },
          {
            name: 'Services',
            type: 'Business Logic',
            description: 'API integration and data processing',
            connections: ['UI Components']
          }
        ],
        dependencies: [
          {
            name: 'React',
            version: '19.1.0',
            purpose: 'UI Framework',
            importance: 'critical'
          },
          {
            name: 'Vite',
            version: '6.2.0',
            purpose: 'Build Tool',
            importance: 'important'
          }
        ]
      },
      recommendations: [
        {
          type: 'design',
          title: 'Modern Component Architecture',
          description: 'Implement a clean component hierarchy with proper separation of concerns',
          impact: 'high',
          effort: 'medium'
        },
        {
          type: 'technical',
          title: 'Performance Optimization',
          description: 'Add code splitting and lazy loading for better performance',
          impact: 'medium',
          effort: 'low'
        }
      ],
      optimizations: [
        {
          category: 'Performance',
          suggestion: 'Implement virtual scrolling for large lists',
          benefit: 'Improved scroll performance with large datasets',
          implementation: 'Use react-window or react-virtualized'
        }
      ]
    };
  };

  const generateMCPServer = async (analysis: RepositoryAnalysis, mapping: AurachatMapping): Promise<MCPServerConfig> => {
    // Simulate MCP server generation
    return {
      name: `${analysis.category}-project-mcp`,
      tools: [
        {
          name: 'analyze_component',
          description: 'Analyze React component structure and dependencies',
          parameters: {
            component_path: { type: 'string', description: 'Path to component file' }
          }
        },
        {
          name: 'generate_tests',
          description: 'Generate unit tests for components',
          parameters: {
            component_name: { type: 'string', description: 'Component to test' }
          }
        }
      ],
      resources: [
        {
          uri: 'file://components/',
          name: 'Component Files',
          description: 'Access to all React components',
          mimeType: 'text/typescript'
        },
        {
          uri: 'file://docs/',
          name: 'Documentation',
          description: 'Project documentation and guides'
        }
      ],
      prompts: [
        {
          name: 'component_review',
          description: 'Review component for best practices',
          template: 'Review this React component for best practices: {{component_code}}',
          arguments: { component_code: { description: 'Component source code' } }
        },
        {
          name: 'performance_audit',
          description: 'Audit component for performance issues',
          template: 'Analyze this component for performance issues: {{component_code}}'
        }
      ],
      generated: true
    };
  };

  const handleSubscribe = () => {
    // Simulate subscription and continue to generation
    setState('generation');
    
    // Generate final site data
    const siteData: SiteData = {
      id: Date.now().toString(),
      title: repoAnalysis?.category === 'web' ? 'Modern Web Project' : 'Advanced Project Site',
      repoUrl,
      generatedMarkdown: '# Enhanced Project Site\n\nGenerated with deep analysis and custom MCP server.',
      sections: [
        {
          id: 'overview',
          title: 'Project Overview',
          content: '<h2>Enhanced Overview</h2><p>Deep analysis reveals this is a sophisticated project.</p>',
          order: 1
        },
        {
          id: 'architecture',
          title: 'Architecture',
          content: `<h2>Architecture Analysis</h2><p>${aurachatMapping?.projectStructure.architecture}</p>`,
          order: 2
        }
      ],
      template: 'TechProjectTemplate',
      tier: 'select',
      mcpServerConfig: mcpConfig,
      partnerToolRecommendations: [
        {
          name: 'Vercel Pro',
          description: 'Enterprise deployment with analytics',
          ctaUrl: 'https://vercel.com/pro'
        },
        {
          name: 'Sentry Performance',
          description: 'Advanced monitoring and performance tracking',
          ctaUrl: 'https://sentry.io'
        }
      ]
    };

    setTimeout(() => onSiteGenerated(siteData), 2000);
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
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name="Sparkles" size={32} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Select Style Mode
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Deep intelligence with crawl4ai and aurachat.io integration
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
                </div>

                {error && <Alert type="error" message={error} />}

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <Icon name="Search" size={24} className="text-blue-400 mb-2" />
                    <h3 className="font-semibold mb-2">crawl4ai Analysis</h3>
                    <p className="text-sm text-slate-400">Deep repository structure analysis</p>
                  </Card>
                  <Card className="p-4">
                    <Icon name="Brain" size={24} className="text-purple-400 mb-2" />
                    <h3 className="font-semibold mb-2">aurachat.io Mapping</h3>
                    <p className="text-sm text-slate-400">Enhanced project intelligence</p>
                  </Card>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Start Deep Analysis
                </Button>
              </form>
            </motion.div>
          )}

          {state === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Deep Analysis in Progress</h2>
                <p className="text-slate-300">Watch as we analyze your repository with advanced AI tools</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {analysisSteps.map((step) => (
                  <Card key={step.id} className={`p-6 transition-all duration-300 ${
                    step.status === 'processing' ? 'border-blue-500 bg-blue-500/10' :
                    step.status === 'complete' ? 'border-green-500 bg-green-500/10' :
                    'border-slate-700'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        step.status === 'complete' ? 'bg-green-500' :
                        'bg-slate-700'
                      }`}>
                        {step.status === 'complete' ? (
                          <Icon name="Check" size={24} className="text-white" />
                        ) : (
                          <Icon name={step.icon} size={24} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-slate-400">{step.description}</p>
                      </div>
                    </div>

                    {step.status === 'complete' && step.data && (
                      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                        <div className="text-sm space-y-2">
                          {step.id === 'crawl4ai' && (
                            <>
                              <div>Languages: {Object.keys(step.data.languages).join(', ')}</div>
                              <div>Complexity: {step.data.complexity}</div>
                              <div>Category: {step.data.category}</div>
                            </>
                          )}
                          {step.id === 'aurachat' && (
                            <>
                              <div>Architecture: {step.data.projectStructure.architecture}</div>
                              <div>Components: {step.data.projectStructure.components.length}</div>
                            </>
                          )}
                          {step.id === 'mcp' && (
                            <>
                              <div>Tools: {step.data.tools.length}</div>
                              <div>Resources: {step.data.resources.length}</div>
                              <div>Prompts: {step.data.prompts.length}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {state === 'subscription' && (
            <motion.div
              key="subscription"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8">
                <Icon name="Crown" size={48} className="text-white mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Analysis Complete!</h2>
                <p className="text-blue-100">Ready to generate your enhanced site with custom MCP server</p>
              </div>

              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Results:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Repository Type:</strong><br />
                    {repoAnalysis?.category || 'Web Application'}
                  </div>
                  <div>
                    <strong>Complexity:</strong><br />
                    {repoAnalysis?.complexity || 'Moderate'}
                  </div>
                  <div>
                    <strong>MCP Tools:</strong><br />
                    {mcpConfig?.tools.length || 0} custom tools
                  </div>
                  <div>
                    <strong>Recommendations:</strong><br />
                    {aurachatMapping?.recommendations.length || 0} insights
                  </div>
                </div>
              </Card>

              <Alert
                type="info"
                message="To publish your enhanced site and remove ads, a subscription is required. You can preview the building process for free."
              />

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => setState('generation')}
                  variant="outline"
                  className="flex-1"
                >
                  Preview Building Process (Free)
                </Button>
                <Button
                  onClick={handleSubscribe}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  Subscribe & Publish ($29/mo)
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'generation' && (
            <motion.div
              key="generation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Icon name="Sparkles" size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Generating Enhanced Site</h2>
              <p className="text-slate-300 mb-8">
                Creating your site with deep analysis insights and custom MCP server
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse w-3/4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};