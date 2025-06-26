import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplace.service';
import { authService } from '../../services/auth.service';
import { UltraPlan } from '../../../shared/types';
import { 
  FaPlus, 
  FaTrash,
  FaInfoCircle,
  FaDollarSign,
  FaTags,
  FaList
} from 'react-icons/fa';

export const TemplateSubmission: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    projectTypes: [] as string[],
    tags: [] as string[],
    features: [] as string[],
    requirements: [] as string[],
    objectives: [] as string[],
    phases: 1,
    estimatedDuration: '',
    frameworks: [] as string[]
  });

  const categories = [
    'Startup Launch',
    'Product Development',
    'Marketing Campaign',
    'Business Transformation',
    'Team Scaling',
    'Revenue Growth',
    'Digital Transformation',
    'Crisis Management'
  ];

  const projectTypeOptions = [
    'SaaS',
    'E-commerce',
    'Mobile App',
    'Web Platform',
    'Marketplace',
    'B2B',
    'B2C',
    'Enterprise'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate Pro subscription
    if (!authService.hasProAccess()) {
      setError('Template submission requires a Pro subscription');
      return;
    }

    // Validate form
    if (templateData.objectives.length === 0) {
      setError('Please add at least one objective');
      return;
    }

    if (templateData.features.length === 0) {
      setError('Please add at least one feature');
      return;
    }

    setLoading(true);

    try {
      // Create mock plan data (in real app, this would come from an actual plan)
      const planData: UltraPlan = {
        id: `plan_${Date.now()}`,
        projectId: 'template',
        name: templateData.name,
        description: templateData.description,
        objectives: templateData.objectives,
        phases: Array.from({ length: templateData.phases }, (_, i) => ({
          id: `phase_${i}`,
          name: `Phase ${i + 1}`,
          description: '',
          startDate: new Date(),
          endDate: new Date(),
          status: 'pending',
          steps: [],
          dependencies: []
        })),
        milestones: [],
        risks: [],
        resources: [],
        metrics: { kpis: [], targets: {}, tracking: 'weekly' },
        timeline: {
          start: new Date(),
          end: new Date()
        },
        budget: { total: 0, breakdown: {} },
        status: 'draft',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: authService.getCurrentUser()?.id || '',
        version: 1,
        tags: templateData.tags,
        priority: 'medium'
      };

      const template = {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        tags: templateData.tags,
        projectTypes: templateData.projectTypes,
        price: templateData.price,
        preview: {
          objectives: templateData.objectives,
          phases: templateData.phases,
          estimatedDuration: templateData.estimatedDuration,
          frameworks: templateData.frameworks
        },
        features: templateData.features,
        requirements: templateData.requirements
      };

      const result = await marketplaceService.submitTemplate(
        template,
        planData,
        authService.getCurrentUser()?.id || ''
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/marketplace');
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit template');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }

    setLoading(false);
  };

  const addItem = (field: 'features' | 'requirements' | 'objectives' | 'frameworks' | 'tags') => {
    const newItem = prompt(`Add ${field.slice(0, -1)}:`);
    if (newItem) {
      setTemplateData({
        ...templateData,
        [field]: [...templateData[field], newItem]
      });
    }
  };

  const removeItem = (field: 'features' | 'requirements' | 'objectives' | 'frameworks' | 'tags', index: number) => {
    setTemplateData({
      ...templateData,
      [field]: templateData[field].filter((_, i) => i !== index)
    });
  };

  const toggleProjectType = (type: string) => {
    setTemplateData({
      ...templateData,
      projectTypes: templateData.projectTypes.includes(type)
        ? templateData.projectTypes.filter(t => t !== type)
        : [...templateData.projectTypes, type]
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaInfoCircle className="text-green-600 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Submitted!</h2>
          <p className="text-gray-600">Your template is under review. We'll notify you once it's approved.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit a Plan Template</h1>
          
          {!authService.hasProAccess() && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800">
                Template submission is available for Pro subscribers only.{' '}
                <button
                  onClick={() => navigate('/pricing')}
                  className="text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Upgrade to Pro
                </button>
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., SaaS Launch Strategy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={templateData.description}
                    onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe what this template helps achieve..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={templateData.category}
                      onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <div className="relative">
                      <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="999"
                        required
                        value={templateData.price}
                        onChange={(e) => setTemplateData({ ...templateData, price: Number(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0 for free"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Types */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Best For (Project Types)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {projectTypeOptions.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={templateData.projectTypes.includes(type)}
                      onChange={() => toggleProjectType(type)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Plan Preview */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Preview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Phases
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={templateData.phases}
                    onChange={(e) => setTemplateData({ ...templateData, phases: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={templateData.estimatedDuration}
                    onChange={(e) => setTemplateData({ ...templateData, estimatedDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 3-6 months"
                  />
                </div>
              </div>

              {/* Objectives */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategic Objectives
                </label>
                <div className="space-y-2">
                  {templateData.objectives.map((obj, index) => (
                    <div key={index} className="flex items-center">
                      <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                        {obj}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem('objectives', index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem('objectives')}
                    className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    <FaPlus className="mr-1" />
                    Add Objective
                  </button>
                </div>
              </div>

              {/* Frameworks */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frameworks & Methodologies
                </label>
                <div className="space-y-2">
                  {templateData.frameworks.map((fw, index) => (
                    <div key={index} className="flex items-center">
                      <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                        {fw}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem('frameworks', index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem('frameworks')}
                    className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    <FaPlus className="mr-1" />
                    Add Framework
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
              <div className="space-y-2">
                {templateData.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                      {feature}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem('features', index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem('features')}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  <FaPlus className="mr-1" />
                  Add Feature
                </button>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-2">
                {templateData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center">
                    <span className="flex-1 px-3 py-2 bg-gray-50 rounded-md text-sm">
                      {req}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem('requirements', index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem('requirements')}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  <FaPlus className="mr-1" />
                  Add Requirement
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2 mb-2">
                {templateData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeItem('tags', index)}
                      className="ml-2 text-indigo-600 hover:text-indigo-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addItem('tags')}
                className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm"
              >
                <FaTags className="mr-1" />
                Add Tag
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading || !authService.hasProAccess()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Template for Review'}
              </button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Templates are reviewed within 24-48 hours. You'll receive an email once approved.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};