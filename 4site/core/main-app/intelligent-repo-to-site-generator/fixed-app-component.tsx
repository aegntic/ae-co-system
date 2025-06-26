import React, { useState, useEffect } from 'react';
import { URLInputForm } from './components/generator/URLInputForm';
import { LoadingIndicator } from './components/generator/LoadingIndicator';
import { SimplePreviewTemplate } from './fixed-preview-template';
import { generateSiteContentFromUrl } from './fixed-gemini-service';
import { deployToGitHubPages } from './github-pages-service';
import { SiteData } from './updated-sitedata-types';
import { AlertCircle, Github, Edit3, RefreshCw, CheckCircle } from 'lucide-react';

type Step = 'input' | 'generating' | 'success' | 'error';

interface User {
  id: string;
  githubToken?: string;
  username?: string;
}

interface AppProps {
  user?: User;
}

export const App: React.FC<AppProps> = ({ user }) => {
  const [step, setStep] = useState<Step>('input');
  const [repoUrl, setRepoUrl] = useState('');
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);

  // Analytics tracking function
  const trackActivity = async (event: string, data: Record<string, any>) => {
    try {
      // Implementation would send to analytics service
      console.log('Analytics:', event, data);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Toast notification system
  const toast = {
    success: (message: string) => {
      console.log('Success:', message);
      // Implementation would show toast notification
    },
    error: (message: string) => {
      console.error('Error:', message);
      // Implementation would show toast notification
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setStep('generating');
      
      if (!repoUrl) {
        throw new Error('Please enter a repository URL');
      }

      // Generate site data with proper type
      const data = await generateSiteContentFromUrl(repoUrl);
      
      if (!data || typeof data === 'string') {
        throw new Error('Invalid response from content generator');
      }
      
      setSiteData(data);
      setStep('success');
      
      // Track successful generation
      if (user) {
        await trackActivity('site_generated', {
          repoUrl,
          userId: user.id,
          template: data.template
        });
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate site');
      setStep('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGitHubPagesDeployment = async () => {
    if (!siteData) return;
    
    setIsDeploying(true);
    try {
      if (!user?.githubToken || !siteData.repo || !siteData.owner) {
        throw new Error('Missing GitHub authentication or repository information');
      }

      const deployUrl = await deployToGitHubPages({
        token: user.githubToken,
        owner: siteData.owner,
        repo: siteData.repo,
        siteData: siteData
      });

      setDeploymentUrl(deployUrl);
      toast.success(`Site deployed! Visit: ${deployUrl}`);
      window.open(deployUrl, '_blank');
      
      // Track successful deployment
      await trackActivity('site_deployed', {
        repoUrl: siteData.repoUrl,
        deploymentUrl: deployUrl,
        userId: user.id
      });
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast.error('Failed to deploy to GitHub Pages');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleEdit = () => {
    // Implementation would open edit mode
    toast.success('Edit mode coming soon!');
  };

  const handleRetry = () => {
    setSiteData(null);
    setError(null);
    setDeploymentUrl(null);
    setStep('input');
    setRepoUrl('');
  };

  const handleUrlSubmit = (url: string) => {
    setRepoUrl(url);
    handleGenerate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Input Step */}
      {step === 'input' && (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                project4site
              </h1>
              <p className="text-xl text-gray-600">
                Transform GitHub Repos into Professional Sites in 30 Seconds
              </p>
            </div>
            
            <URLInputForm 
              onSubmit={handleUrlSubmit}
              disabled={isGenerating}
            />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-red-600 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generating Step */}
      {step === 'generating' && (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingIndicator 
            message="Analyzing your repository and generating your professional site..."
          />
        </div>
      )}

      {/* Success Step - Full Preview with Floating Actions */}
      {step === 'success' && siteData && (
        <>
          {/* Full Screen Preview */}
          <div className="fixed inset-0 bg-white z-40">
            <SimplePreviewTemplate siteData={siteData} />
          </div>

          {/* Floating Action Panel */}
          <div className="fixed bottom-8 right-8 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your site is ready!
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Deploy to GitHub Pages or edit the content
              </p>
              
              {deploymentUrl && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Successfully deployed!
                  </p>
                  <a 
                    href={deploymentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:text-green-900 underline"
                  >
                    {deploymentUrl}
                  </a>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={handleGitHubPagesDeployment}
                  disabled={isDeploying || !user?.githubToken}
                  className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Github className="w-5 h-5" />
                      Deploy to GitHub Pages
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Content
                </button>
                
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New Site
                </button>
              </div>
              
              {!user?.githubToken && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    Connect your GitHub account to enable deployment
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Generation Failed
              </h2>
              <p className="text-gray-600">
                {error || 'Something went wrong while generating your site.'}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => setStep('input')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Input
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};