import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Star, Eye, Sparkles } from 'lucide-react';
import { showcaseHelpers } from '../../lib/supabase';
import type { ShowcaseSiteWithWebsite } from '../../types/database';

interface ProShowcaseGridProps {
  currentSiteId?: string;
  userTier?: 'free' | 'pro' | 'business' | 'enterprise';
  optOut?: boolean; // Only for Enterprise users
}

export const ProShowcaseGrid: React.FC<ProShowcaseGridProps> = ({ 
  currentSiteId, 
  userTier = 'free',
  optOut = false
}) => {
  const [showcaseSites, setShowcaseSites] = useState<ShowcaseSiteWithWebsite[]>([]);
  const [loading, setLoading] = useState(true);

  // Only Enterprise users can opt out
  if (userTier === 'enterprise' && optOut) return null;

  useEffect(() => {
    loadShowcaseSites();
  }, []);

  const loadShowcaseSites = async () => {
    try {
      // Get top 9 Pro user sites
      const sites = await showcaseHelpers.getProShowcaseSites(9, currentSiteId);
      setShowcaseSites(sites);
    } catch (error) {
      console.error('Failed to load showcase sites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-t from-black via-gray-900 to-gray-800 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showcaseSites.length === 0) return null;

  return (
    <section className="bg-gradient-to-t from-black via-gray-900 to-gray-800 py-16 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-200">Featured Pro Projects</span>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-3">
            Discover Amazing Sites Built by Pro Users
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {userTier === 'free' ? (
              <>
                These premium projects showcase what's possible with 4site.pro. 
                <span className="text-primary-400 font-medium"> Upgrade to Pro</span> to get your site featured here automatically.
              </>
            ) : (
              <>
                These premium projects showcase the best of our Pro community.
                {userTier === 'pro' && <span className="text-green-400 font-medium"> Your site is automatically featured here!</span>}
              </>
            )}
          </p>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {showcaseSites.slice(0, 9).map((site, index) => (
            <ProShowcaseCard key={site.id} site={site} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          {userTier === 'free' ? (
            <>
              <a
                href="https://4site.pro/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-black font-semibold rounded-lg transition-all transform hover:scale-105"
              >
                <Star className="w-5 h-5" />
                Join Pro & Get Featured Instantly
              </a>
              <p className="text-sm text-gray-500 mt-3">
                Pro users get automatic featuring • No application needed • Instant visibility
              </p>
            </>
          ) : (
            <>
              <a
                href="https://4site.pro/showcase"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
              >
                <ExternalLink className="w-5 h-5" />
                Explore Full Showcase Gallery
              </a>
              <p className="text-sm text-gray-500 mt-3">
                {userTier === 'pro' ? (
                  "Your sites are automatically featured • Share to get more exposure"
                ) : userTier === 'business' ? (
                  "Business tier includes priority featuring • White-label available"
                ) : (
                  "Enterprise tier • Contact us for custom featuring options"
                )}
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// Individual showcase card
const ProShowcaseCard: React.FC<{ 
  site: ShowcaseSiteWithWebsite; 
  index: number;
}> = ({ site, index }) => {
  const website = site.website;
  if (!website) return null;

  return (
    <motion.a
      href={website.deployment_url || website.custom_domain || '#'}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-gray-900/50 rounded-xl overflow-hidden border border-white/10 hover:border-primary-400/50 transition-all"
    >
      {/* Thumbnail/Preview */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
        {/* Placeholder gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 via-purple-400/10 to-pink-400/10" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
              {website.title}
            </h3>
            <p className="text-gray-300 text-sm line-clamp-2">
              {website.description || `Built with ${website.template || '4site.pro'}`}
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {website.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {site.likes || 0}
            </span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <ExternalLink className="w-5 h-5" />
            <span className="font-medium">Visit Site</span>
          </div>
        </div>

        {/* Pro badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded text-xs font-bold text-black">
          PRO
        </div>
      </div>

      {/* Creator info */}
      <div className="p-3 bg-gray-900/80 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {website.user_profile?.avatar_url ? (
              <img 
                src={website.user_profile.avatar_url} 
                alt={website.user_profile.username || 'Creator'}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
            )}
            <span className="text-sm text-gray-300">
              {website.user_profile?.username || 'Pro Creator'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {site.category}
          </span>
        </div>
      </div>
    </motion.a>
  );
};

// Inline HTML version for embedding in generated sites
export const getProShowcaseGridHTML = () => {
  return `
    <section style="background: linear-gradient(to top, #000000, #111827, #1f2937); padding: 4rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="max-width: 72rem; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(251, 146, 60, 0.2)); border-radius: 9999px; margin-bottom: 1rem;">
            <span style="color: #fbbf24; font-size: 0.875rem; font-weight: 500;">✨ Featured Pro Projects</span>
          </div>
          
          <h2 style="font-size: 1.875rem; font-weight: bold; color: white; margin-bottom: 0.75rem;">
            Discover Amazing Sites Built by Pro Users
          </h2>
          <p style="color: #9ca3af; max-width: 42rem; margin: 0 auto;">
            These premium projects showcase what's possible with 4site.pro. 
            <span style="color: #22d3ee; font-weight: 500;">Upgrade to Pro</span> to get your site featured here automatically.
          </p>
        </div>

        <!-- Loading state (will be replaced by JS) -->
        <div id="pro-showcase-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
          ${[...Array(9)].map(() => `
            <div style="aspect-ratio: 16/9; background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; animation: pulse 2s infinite;"></div>
          `).join('')}
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="https://4site.pro/pricing" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(to right, #22d3ee, #0ea5e9); color: black; font-weight: 600; border-radius: 0.5rem; text-decoration: none; transition: transform 0.2s;">
            ⭐ Join Pro & Get Featured Instantly
          </a>
          <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.75rem;">
            Pro users get automatic featuring • No application needed • Instant visibility
          </p>
        </div>
      </div>
      
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
      
      <script>
        // Load showcase sites dynamically
        (async function() {
          try {
            const response = await fetch('https://4site.pro/api/showcase/pro-sites?limit=9');
            const sites = await response.json();
            
            const grid = document.getElementById('pro-showcase-grid');
            grid.innerHTML = sites.map((site, index) => \`
              <a href="\${site.website.deployment_url}" target="_blank" rel="noopener noreferrer" 
                 style="display: block; background: rgba(17, 24, 39, 0.5); border-radius: 0.75rem; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); text-decoration: none; transition: all 0.3s;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='rgba(34, 211, 238, 0.5)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'">
                <div style="aspect-ratio: 16/9; background: linear-gradient(to bottom right, #1f2937, #111827); position: relative; overflow: hidden;">
                  <div style="position: absolute; inset: 0; background: linear-gradient(to bottom right, rgba(34, 211, 238, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1));"></div>
                  <div style="position: absolute; inset: 0; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                      <h3 style="color: white; font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        \${site.website.title}
                      </h3>
                      <p style="color: #d1d5db; font-size: 0.875rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        \${site.website.description || 'Built with 4site.pro'}
                      </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: #9ca3af;">
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        👁 \${site.website.views || 0}
                      </span>
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        ⭐ \${site.likes || 0}
                      </span>
                    </div>
                  </div>
                  <div style="position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.5rem; background: linear-gradient(to right, #fbbf24, #fb923c); border-radius: 0.25rem; font-size: 0.75rem; font-weight: bold; color: black;">
                    PRO
                  </div>
                </div>
                <div style="padding: 0.75rem; background: rgba(17, 24, 39, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="width: 1.5rem; height: 1.5rem; border-radius: 50%; background: linear-gradient(to bottom right, #22d3ee, #0ea5e9);"></div>
                      <span style="font-size: 0.875rem; color: #d1d5db;">
                        \${site.website.user_profile?.username || 'Pro Creator'}
                      </span>
                    </div>
                    <span style="font-size: 0.75rem; color: #6b7280;">
                      \${site.category}
                    </span>
                  </div>
                </div>
              </a>
            \`).join('');
          } catch (error) {
            console.error('Failed to load showcase sites:', error);
          }
        })();
      </script>
    </section>
  `;
};