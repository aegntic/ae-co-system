import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectAnalysis, UltraPlan } from '../../shared/types';
import { aiPlanGenerator } from '../services/ai-plan-generator';
import { authService } from '../services/auth.service';
import { 
  FaRocket, 
  FaClock, 
  FaChartLine, 
  FaShieldAlt,
  FaDollarSign,
  FaCheckCircle,
  FaBrain,
  FaMagic
} from 'react-icons/fa';

interface PlanGeneratorProps {
  analysis: ProjectAnalysis;
  onPlanGenerated: (plan: UltraPlan) => void;
}

export const PlanGenerator: React.FC<PlanGeneratorProps> = ({ analysis, onPlanGenerated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [options, setOptions] = useState({
    depth: 'standard' as 'quick' | 'standard' | 'comprehensive',
    timeframe: '90days' as '30days' | '90days' | '6months' | '1year',
    focusAreas: [] as string[],
    includeFinancials: true,
    includeRisks: true,
    includeMetrics: true
  });
  const [error, setError] = useState('');

  const focusAreaOptions = [
    { id: 'growth', label: 'Growth & Scaling', icon: FaChartLine },
    { id: 'efficiency', label: 'Efficiency & Automation', icon: FaRocket },
    { id: 'quality', label: 'Quality & Reliability', icon: FaShieldAlt },
    { id: 'revenue', label: 'Revenue & Monetization', icon: FaDollarSign },
    { id: 'team', label: 'Team & Culture', icon: FaBrain },
    { id: 'innovation', label: 'Innovation & R&D', icon: FaMagic }
  ];

  const depthOptions = [
    { 
      value: 'quick', 
      label: 'Quick Plan', 
      description: 'Essential steps only (5-10 min)',
      time: '5-10 min'
    },
    { 
      value: 'standard', 
      label: 'Standard Plan', 
      description: 'Comprehensive roadmap (recommended)',
      time: '15-20 min',
      recommended: true
    },
    { 
      value: 'comprehensive', 
      label: 'Deep Dive', 
      description: 'Detailed analysis with all options',
      time: '30-45 min',
      pro: true
    }
  ];

  const timeframeOptions = [
    { value: '30days', label: '30 Days', description: 'Sprint planning' },
    { value: '90days', label: '90 Days', description: 'Quarterly goals' },
    { value: '6months', label: '6 Months', description: 'Strategic roadmap' },
    { value: '1year', label: '1 Year', description: 'Long-term vision', pro: true }
  ];

  useEffect(() => {
    // Pre-select focus areas based on analysis
    const defaultFocusAreas = [];
    if (analysis.problems.some(p => p.type === 'performance')) {
      defaultFocusAreas.push('efficiency');
    }
    if (analysis.problems.some(p => p.type === 'scalability')) {
      defaultFocusAreas.push('growth');
    }
    if (analysis.goals.some(g => g.toLowerCase().includes('revenue'))) {
      defaultFocusAreas.push('revenue');
    }
    setOptions(prev => ({ ...prev, focusAreas: defaultFocusAreas }));
  }, [analysis]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      // Update steps
      const steps = [
        'Analyzing project requirements...',
        'Identifying optimal strategies...',
        'Generating actionable roadmap...',
        'Adding industry best practices...',
        'Calculating timelines and resources...',
        'Finalizing your strategic plan...'
      ];

      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          stepIndex++;
        }
      }, 2000);

      // Generate the plan
      const plan = await aiPlanGenerator.generatePlan(analysis, options);
      
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setProgress(100);
      setCurrentStep('Plan generated successfully!');

      // Wait a moment to show completion
      setTimeout(() => {
        onPlanGenerated(plan);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to generate plan. Please try again.');
      setLoading(false);
    }
  };

  const toggleFocusArea = (areaId: string) => {
    setOptions(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter(a => a !== areaId)
        : [...prev.focusAreas, areaId]
    }));
  };

  const canUseProFeatures = authService.hasProAccess();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Your Strategic Plan
        </h2>
        <p className="text-gray-600 mb-8">
          Customize your AI-generated plan based on your specific needs and goals.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading ? (
          <div className="space-y-8">
            {/* Plan Depth */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Plan Depth
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {depthOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (!option.pro || canUseProFeatures) {
                        setOptions(prev => ({ ...prev, depth: option.value as any }));
                      }
                    }}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${options.depth === option.value 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${option.pro && !canUseProFeatures ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    {option.recommended && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                    {option.pro && !canUseProFeatures && (
                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Pro
                      </span>
                    )}
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      <FaClock className="inline mr-1" />
                      {option.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Planning Timeframe
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {timeframeOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (!option.pro || canUseProFeatures) {
                        setOptions(prev => ({ ...prev, timeframe: option.value as any }));
                      }
                    }}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all text-center
                      ${options.timeframe === option.value 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${option.pro && !canUseProFeatures ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    {option.pro && !canUseProFeatures && (
                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Pro
                      </span>
                    )}
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Focus Areas (Select all that apply)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {focusAreaOptions.map(area => (
                  <div
                    key={area.id}
                    onClick={() => toggleFocusArea(area.id)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${options.focusAreas.includes(area.id)
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <area.icon className="mr-3 text-indigo-600" />
                      <span className="font-medium text-gray-900">{area.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Include in Plan
              </h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeFinancials}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeFinancials: e.target.checked 
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700">
                    Financial projections and budget estimates
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeRisks}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeRisks: e.target.checked 
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700">
                    Risk assessment and mitigation strategies
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeMetrics}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      includeMetrics: e.target.checked 
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700">
                    Success metrics and KPIs
                  </span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleGenerate}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
              >
                <FaMagic className="mr-2" />
                Generate Strategic Plan
              </button>
            </div>

            {/* Upgrade Prompt */}
            {!canUseProFeatures && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <p className="text-purple-800 mb-2">
                  🚀 Unlock comprehensive plans and 1-year timeframes with Pro
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Loading State */
          <div className="py-12">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md mb-8">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {progress}% Complete
                </p>
              </div>

              <div className="flex items-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mr-4" />
                <p className="text-lg text-gray-700">{currentStep}</p>
              </div>

              <div className="text-center mt-8 space-y-2">
                <p className="text-gray-600">
                  AI is analyzing {analysis.problems.length} problems and {analysis.goals.length} goals
                </p>
                <p className="text-sm text-gray-500">
                  Creating your personalized {options.timeframe} strategic plan...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};