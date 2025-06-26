import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  createDeepAnalysisOrchestrator, 
  DeepAnalysisConfig, 
  DeepAnalysisResult,
  ANALYSIS_CONFIGS,
  AutomationLevel 
} from '../../services/deepAnalysisOrchestrator';
import { AnalysisStage } from '../../services/progressTracker';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Icon } from '../ui/Icon';

interface DeepAnalysisInterfaceProps {
  onAnalysisComplete: (result: DeepAnalysisResult) => void;
  onError: (error: string) => void;
}

interface AnalysisProgress {
  jobId: string;
  stage: AnalysisStage;
  progress: number;
  message: string;
  details?: {
    filesScanned?: number;
    totalFiles?: number;
    currentFile?: string;
    metrics?: {
      processingRate?: number;
      apiCallsUsed?: number;
      estimatedCost?: number;
    };
  };
}

type AnalysisMode = 'quick' | 'standard' | 'comprehensive' | 'custom';

const STAGE_DESCRIPTIONS = {
  [AnalysisStage.INITIALIZING]: 'Initializing analysis...',
  [AnalysisStage.REPOSITORY_SCAN]: 'Scanning repository structure',
  [AnalysisStage.FILE_ANALYSIS]: 'Analyzing individual files',
  [AnalysisStage.AI_PROCESSING]: 'Running aegntic.ai analysis',
  [AnalysisStage.CONTENT_GENERATION]: 'Generating content',
  [AnalysisStage.VISUAL_GENERATION]: 'Creating visuals',
  [AnalysisStage.SITE_ASSEMBLY]: 'Assembling final site',
  [AnalysisStage.OPTIMIZATION]: 'Optimizing and validating',
  [AnalysisStage.FINALIZATION]: 'Finalizing results',
  [AnalysisStage.COMPLETE]: 'Analysis complete',
  [AnalysisStage.ERROR]: 'Analysis failed',
};

const STAGE_ICONS = {
  [AnalysisStage.INITIALIZING]: 'Clock',
  [AnalysisStage.REPOSITORY_SCAN]: 'FolderOpen',
  [AnalysisStage.FILE_ANALYSIS]: 'FileText',
  [AnalysisStage.AI_PROCESSING]: 'Brain',
  [AnalysisStage.CONTENT_GENERATION]: 'Edit',
  [AnalysisStage.VISUAL_GENERATION]: 'Image',
  [AnalysisStage.SITE_ASSEMBLY]: 'Layout',
  [AnalysisStage.OPTIMIZATION]: 'Zap',
  [AnalysisStage.FINALIZATION]: 'Check',
  [AnalysisStage.COMPLETE]: 'CheckCircle',
  [AnalysisStage.ERROR]: 'AlertCircle',
};

export const DeepAnalysisInterface: React.FC<DeepAnalysisInterfaceProps> = ({
  onAnalysisComplete,
  onError,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>('standard');
  const [customConfig, setCustomConfig] = useState<Partial<DeepAnalysisConfig>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DeepAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCompletion, setEstimatedCompletion] = useState<number | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);

  // Calculate ETA
  const getETA = useCallback(() => {
    if (!estimatedCompletion) return null;
    const remaining = Math.max(0, estimatedCompletion - Date.now());
    return Math.ceil(remaining / 1000);
  }, [estimatedCompletion]);

  const startAnalysis = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(null);
    setAnalysisResult(null);

    try {
      // Get base configuration
      let config: DeepAnalysisConfig;
      switch (selectedMode) {
        case 'quick':
          config = { ...ANALYSIS_CONFIGS.QUICK };
          break;
        case 'comprehensive':
          config = { ...ANALYSIS_CONFIGS.COMPREHENSIVE };
          break;
        case 'custom':
          config = { ...ANALYSIS_CONFIGS.STANDARD, ...customConfig };
          break;
        default:
          config = { ...ANALYSIS_CONFIGS.STANDARD };
      }

      // Add required API keys (these would normally come from environment)
      config.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      config.anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      config.githubToken = import.meta.env.VITE_GITHUB_TOKEN;

      if (!config.geminiApiKey) {
        throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your environment.');
      }

      // Create orchestrator and start analysis
      const orchestrator = createDeepAnalysisOrchestrator(config);
      const { jobId, estimatedCompletion: eta } = await orchestrator.analyzeRepository(repoUrl, customConfig);
      
      setEstimatedCompletion(eta);

      // Set up WebSocket connection for real-time progress
      const ws = new WebSocket('ws://localhost:8080');
      setWebSocket(ws);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', jobId }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'progress' && message.data) {
            setProgress(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Progress updates may be delayed.');
      };

      // Poll for completion
      const checkCompletion = async () => {
        try {
          const result = await orchestrator.getAnalysisResult(jobId);
          if (result) {
            setAnalysisResult(result);
            setIsAnalyzing(false);
            onAnalysisComplete(result);
            ws.close();
          } else {
            // Continue polling
            setTimeout(checkCompletion, 2000);
          }
        } catch (error) {
          console.error('Failed to check analysis completion:', error);
          setError('Failed to retrieve analysis results');
          setIsAnalyzing(false);
        }
      };

      // Start polling after a delay
      setTimeout(checkCompletion, 5000);

    } catch (error) {
      console.error('Failed to start analysis:', error);
      setError(error instanceof Error ? error.message : 'Failed to start analysis');
      setIsAnalyzing(false);
    }
  };

  const cancelAnalysis = () => {
    if (websocket) {
      websocket.close();
    }
    setIsAnalyzing(false);
    setProgress(null);
    setError('Analysis cancelled by user');
  };

  const renderModeSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        {
          mode: 'quick' as AnalysisMode,
          title: 'Quick Analysis',
          description: 'Fast analysis with basic insights',
          duration: '1-2 minutes',
          features: ['Repository structure', 'Basic aegntic.ai insights', 'Simple site generation'],
          price: 'Free',
        },
        {
          mode: 'standard' as AnalysisMode,
          title: 'Standard Analysis',
          description: 'Comprehensive analysis with visuals',
          duration: '3-5 minutes',
          features: ['Deep code analysis', 'aegntic.ai-powered visuals', 'Multi-page site', 'Interactive elements'],
          price: '$0.10',
          popular: true,
        },
        {
          mode: 'comprehensive' as AnalysisMode,
          title: 'Enterprise Analysis',
          description: 'Complete analysis with all features',
          duration: '5-10 minutes',
          features: ['Private repositories', 'Advanced aegntic.ai models', 'Custom diagrams', 'Deployment automation'],
          price: '$0.25',
        },
      ].map(({ mode, title, description, duration, features, price, popular }) => (
        <Card
          key={mode}
          className={`cursor-pointer transition-all duration-200 ${
            selectedMode === mode
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
          } ${popular ? 'relative' : ''}`}
          onClick={() => setSelectedMode(mode)}
        >
          {popular && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Popular
              </span>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{title}</h3>
              <span className="text-sm font-medium text-primary">{price}</span>
            </div>
            <p className="text-sm text-text-secondary mb-2">{description}</p>
            <p className="text-xs text-text-secondary mb-4">⏱️ {duration}</p>
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Icon name="Check" size={14} className="text-success mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderProgressDisplay = () => {
    if (!progress) return null;

    const eta = getETA();
    const progressPercentage = Math.min(100, Math.max(0, progress.progress));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Icon 
              name={STAGE_ICONS[progress.stage]} 
              size={24} 
              className={`mr-3 ${progress.stage === AnalysisStage.ERROR ? 'text-error' : 'text-primary'}`}
            />
            <div>
              <h3 className="font-semibold text-lg">
                {STAGE_DESCRIPTIONS[progress.stage]}
              </h3>
              <p className="text-sm text-text-secondary">{progress.message}</p>
            </div>
          </div>
          {eta && (
            <div className="text-right">
              <p className="text-sm text-text-secondary">ETA</p>
              <p className="font-semibold">{eta}s</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <motion.div
            className="bg-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Progress Details */}
        {progress.details && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {progress.details.filesScanned !== undefined && (
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {progress.details.filesScanned}
                </p>
                <p className="text-sm text-text-secondary">Files Analyzed</p>
              </div>
            )}
            {progress.details.metrics?.processingRate && (
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {progress.details.metrics.processingRate.toFixed(1)}
                </p>
                <p className="text-sm text-text-secondary">Files/sec</p>
              </div>
            )}
            {progress.details.metrics?.estimatedCost && (
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ${progress.details.metrics.estimatedCost.toFixed(3)}
                </p>
                <p className="text-sm text-text-secondary">Estimated Cost</p>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={cancelAnalysis}
            className="text-error border-error hover:bg-error hover:text-white"
          >
            <Icon name="X" size={16} className="mr-2" />
            Cancel Analysis
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderCustomConfig = () => {
    if (selectedMode !== 'custom') return null;

    return (
      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-lg mb-4">Custom Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Analysis Depth</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={customConfig.analysisDepth || 'medium'}
              onChange={(e) => setCustomConfig(prev => ({ 
                ...prev, 
                analysisDepth: e.target.value as 'shallow' | 'medium' | 'deep' 
              }))}
            >
              <option value="shallow">Shallow (Fast)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="deep">Deep (Comprehensive)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Files</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={customConfig.maxFiles || 100}
              onChange={(e) => setCustomConfig(prev => ({ 
                ...prev, 
                maxFiles: parseInt(e.target.value) 
              }))}
              min="10"
              max="500"
            />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customConfig.generateVisuals !== false}
                  onChange={(e) => setCustomConfig(prev => ({ 
                    ...prev, 
                    generateVisuals: e.target.checked 
                  }))}
                  className="mr-2"
                />
                Generate Visuals
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customConfig.multiPageOutput !== false}
                  onChange={(e) => setCustomConfig(prev => ({ 
                    ...prev, 
                    multiPageOutput: e.target.checked 
                  }))}
                  className="mr-2"
                />
                Multi-page Output
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customConfig.includePrivate === true}
                  onChange={(e) => setCustomConfig(prev => ({ 
                    ...prev, 
                    includePrivate: e.target.checked 
                  }))}
                  className="mr-2"
                />
                Include Private Files
              </label>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderResultSummary = () => {
    if (!analysisResult) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6 mb-6"
      >
        <div className="flex items-center mb-4">
          <Icon name="CheckCircle" size={24} className="text-success mr-3" />
          <h3 className="font-semibold text-lg">Analysis Complete!</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {analysisResult.qualityScore.overall}
            </p>
            <p className="text-sm text-text-secondary">Quality Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {analysisResult.repositoryStructure.files.length}
            </p>
            <p className="text-sm text-text-secondary">Files Analyzed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {analysisResult.siteData.pages.length}
            </p>
            <p className="text-sm text-text-secondary">Pages Generated</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">
              {Math.round(analysisResult.generationMetrics.totalTime / 1000)}s
            </p>
            <p className="text-sm text-text-secondary">Total Time</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Project Overview</h4>
            <p className="text-text-secondary">{analysisResult.aiAnalysis.overview.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Key Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(analysisResult.repositoryStructure.languages).map(lang => (
                <span key={lang} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Top Recommendations</h4>
            <ul className="space-y-2">
              {analysisResult.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <Icon 
                    name={rec.priority === 'critical' ? 'AlertTriangle' : 'Lightbulb'} 
                    size={16} 
                    className={`mr-2 mt-0.5 ${
                      rec.priority === 'critical' ? 'text-error' : 'text-primary'
                    }`}
                  />
                  <div>
                    <p className="font-medium">{rec.title}</p>
                    <p className="text-sm text-text-secondary">{rec.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Deep Repository Analysis</h1>
        <p className="text-lg text-text-secondary">
          Comprehensive analysis of your GitHub repository powered by aegntic.ai
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} className="mb-6" />
      )}

      {!isAnalyzing && !analysisResult && (
        <>
          {/* Repository URL Input */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Repository URL</h2>
            <div className="flex gap-4">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button
                onClick={startAnalysis}
                disabled={!repoUrl.trim()}
                className="px-8"
              >
                <Icon name="Play" size={16} className="mr-2" />
                Start Analysis
              </Button>
            </div>
          </Card>

          {/* Analysis Mode Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Mode</h2>
            {renderModeSelector()}
          </div>

          {/* Custom Configuration */}
          {renderCustomConfig()}
        </>
      )}

      {/* Progress Display */}
      <AnimatePresence>
        {isAnalyzing && renderProgressDisplay()}
      </AnimatePresence>

      {/* Results Summary */}
      <AnimatePresence>
        {analysisResult && renderResultSummary()}
      </AnimatePresence>
    </div>
  );
};