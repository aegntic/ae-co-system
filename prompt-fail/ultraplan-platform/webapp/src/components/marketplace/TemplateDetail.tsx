import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceService, PlanTemplate } from '../../services/marketplace.service';
import { authService } from '../../services/auth.service';
import { 
  FaStar, 
  FaDownload, 
  FaCheckCircle, 
  FaClock,
  FaUsers,
  FaRocket,
  FaShieldAlt,
  FaChartLine
} from 'react-icons/fa';

export const TemplateDetail: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<PlanTemplate | null>(null);
  const [similarTemplates, setSimilarTemplates] = useState<PlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'details'>('overview');

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const [templateData, similar] = await Promise.all([
        marketplaceService.getTemplate(templateId!),
        marketplaceService.getSimilarTemplates(templateId!)
      ]);
      
      if (templateData) {
        setTemplate(templateData);
        setSimilarTemplates(similar);
      } else {
        navigate('/marketplace');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      navigate('/marketplace');
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/signin', { state: { from: `/marketplace/template/${templateId}` } });
      return;
    }

    setPurchasing(true);
    const userId = authService.getCurrentUser()?.id;
    
    if (userId && template) {
      const result = await marketplaceService.purchaseTemplate(template.id, userId);
      
      if (result.success && result.plan) {
        navigate(`/plan/${result.plan.id}`);
      } else {
        alert(result.error || 'Purchase failed. Please try again.');
      }
    }
    setPurchasing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm mr-3">
                  {template.category}
                </span>
                {template.author.verified && (
                  <span className="flex items-center text-sm">
                    <FaShieldAlt className="mr-1" />
                    Verified Author
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{template.name}</h1>
              <p className="text-xl opacity-90 mb-6">{template.description}</p>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < Math.floor(template.rating) ? 'text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{template.rating.toFixed(1)}</span>
                  <span className="ml-2 opacity-75">({template.testimonials.length} reviews)</span>
                </div>
                <div className="flex items-center">
                  <FaDownload className="mr-2" />
                  <span>{template.downloads} downloads</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white text-gray-900 rounded-lg p-6 ml-8 min-w-[300px]">
              <div className="text-center mb-6">
                {template.price === 0 ? (
                  <div>
                    <p className="text-3xl font-bold text-green-600">FREE</p>
                    <p className="text-sm text-gray-600 mt-1">Limited time offer</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold">${template.price}</p>
                    <p className="text-sm text-gray-600 mt-1">One-time purchase</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Processing...' : template.price === 0 ? 'Get Template' : 'Purchase Template'}
              </button>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Instant access to full plan
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Customizable to your needs
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  Free updates included
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['overview', 'reviews', 'details'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Preview */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">What's Included</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start">
                      <FaRocket className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Strategic Objectives</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {template.preview.objectives.map((obj, i) => (
                            <li key={i}>• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaClock className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Timeline</h3>
                        <p className="text-sm text-gray-600">
                          {template.preview.phases} phases over {template.preview.estimatedDuration}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaChartLine className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Frameworks Used</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {template.preview.frameworks.map((fw, i) => (
                            <li key={i}>• {fw}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaUsers className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">Best For</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {template.projectTypes.map((type, i) => (
                            <li key={i}>• {type}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Key Features</h2>
                  <div className="space-y-3">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {template.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-600 mr-2">•</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {template.testimonials.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500">No reviews yet. Be the first to review this template!</p>
                  </div>
                ) : (
                  template.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          {testimonial.user.avatar && (
                            <img
                              src={testimonial.user.avatar}
                              alt={testimonial.user.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <p className="font-semibold">{testimonial.user.name}</p>
                            {testimonial.user.company && (
                              <p className="text-sm text-gray-600">{testimonial.user.company}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`text-sm ${
                                  i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(testimonial.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{testimonial.comment}</p>
                      {testimonial.results && (
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Results:</strong> {testimonial.results}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Template Details</h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-gray-700">Category</dt>
                    <dd className="mt-1 text-gray-600">{template.category}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-700">Project Types</dt>
                    <dd className="mt-1 text-gray-600">{template.projectTypes.join(', ')}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-700">Tags</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-700">Last Updated</dt>
                    <dd className="mt-1 text-gray-600">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-700">Created</dt>
                    <dd className="mt-1 text-gray-600">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">About the Author</h3>
              <div className="flex items-center mb-4">
                {template.author.avatar && (
                  <img
                    src={template.author.avatar}
                    alt={template.author.name}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="font-semibold">
                    {template.author.name}
                    {template.author.verified && (
                      <span className="ml-1 text-indigo-600">✓</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Strategic Planning Expert</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/marketplace/author/${template.author.id}`)}
                className="w-full py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Templates
              </button>
            </div>

            {/* Similar Templates */}
            {similarTemplates.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold mb-4">Similar Templates</h3>
                <div className="space-y-4">
                  {similarTemplates.map((similar) => (
                    <div
                      key={similar.id}
                      onClick={() => navigate(`/marketplace/template/${similar.id}`)}
                      className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      <p className="font-medium text-gray-900">{similar.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaStar className="text-yellow-400 mr-1" />
                          <span>{similar.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {similar.price === 0 ? 'FREE' : `$${similar.price}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};