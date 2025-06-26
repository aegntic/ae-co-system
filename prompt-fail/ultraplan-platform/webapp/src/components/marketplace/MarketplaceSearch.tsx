import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceService, PlanTemplate } from '../../services/marketplace.service';
import { FaSearch, FaFilter, FaStar, FaDownload, FaTags } from 'react-icons/fa';

export const MarketplaceSearch: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PlanTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    projectType: '',
    priceRange: { min: 0, max: 1000 },
    rating: 0,
    sortBy: 'popular' as any
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery || Object.values(filters).some(v => v)) {
      performSearch();
    } else {
      loadFeaturedTemplates();
    }
  }, [searchQuery, filters]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cats, searches, featured] = await Promise.all([
        marketplaceService.getCategories(),
        marketplaceService.getPopularSearches(),
        marketplaceService.getFeaturedTemplates()
      ]);
      
      setCategories(cats);
      setPopularSearches(searches);
      setTemplates(featured);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    }
    setLoading(false);
  };

  const loadFeaturedTemplates = async () => {
    const featured = marketplaceService.getFeaturedTemplates();
    setTemplates(featured);
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await marketplaceService.searchTemplates(searchQuery, filters);
      setTemplates(results);
    } catch (error) {
      console.error('Error searching templates:', error);
    }
    setLoading(false);
  };

  const handleTemplateClick = (templateId: string) => {
    navigate(`/marketplace/template/${templateId}`);
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      projectType: '',
      priceRange: { min: 0, max: 1000 },
      rating: 0,
      sortBy: 'popular'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">Plan Template Marketplace</h1>
          <p className="text-xl opacity-90">
            Discover proven strategic plans from successful projects
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-3xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for templates... (e.g., 'SaaS launch', 'growth strategy')"
                className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <FaSearch className="absolute left-4 top-4 text-gray-400" />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-4 top-3 px-4 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <FaFilter className="mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-sm opacity-75 mb-2">Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, min: Number(e.target.value) }
                    })}
                    placeholder="Min"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: Number(e.target.value) }
                    })}
                    placeholder="Max"
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFilters({ ...filters, rating: star })}
                      className={`text-2xl ${
                        star <= filters.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price">Lowest Price</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No templates found matching your criteria.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Clear filters and try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Found {templates.length} templates
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleTemplateClick(template.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: PlanTemplate;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600">{template.category}</p>
          </div>
          <div className="text-right">
            {template.price === 0 ? (
              <span className="text-green-600 font-semibold">FREE</span>
            ) : (
              <span className="text-gray-900 font-semibold">${template.price}</span>
            )}
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="text-sm text-gray-600">
                {template.rating.toFixed(1)} ({template.testimonials.length})
              </span>
            </div>
            <div className="flex items-center">
              <FaDownload className="text-gray-400 mr-1" />
              <span className="text-sm text-gray-600">{template.downloads}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {template.author.avatar && (
                <img
                  src={template.author.avatar}
                  alt={template.author.name}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {template.author.name}
                  {template.author.verified && (
                    <span className="ml-1 text-indigo-600">✓</span>
                  )}
                </p>
              </div>
            </div>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};