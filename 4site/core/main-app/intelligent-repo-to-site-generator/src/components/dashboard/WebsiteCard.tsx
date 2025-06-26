import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Eye, Edit, Trash2, Globe, MoreVertical } from 'lucide-react';
import type { Website } from '../../types/database';

interface WebsiteCardProps {
  website: Website;
  onDelete: () => void;
  onEdit?: () => void;
  showPoweredBy: boolean;
}

export const WebsiteCard: React.FC<WebsiteCardProps> = ({ 
  website, 
  onDelete, 
  onEdit,
  showPoweredBy 
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-400 bg-green-400/20';
      case 'draft':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'archived':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const siteUrl = website.custom_domain || 
    (website.subdomain ? `https://${website.subdomain}.4site.pro` : null) ||
    website.deployment_url;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary-400/50 transition-all"
    >
      {/* Preview Image */}
      <div className="aspect-video bg-gradient-to-br from-primary-400/20 to-primary-600/20 relative group">
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="w-12 h-12 text-white/20" />
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="View Site"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Edit Site"
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            title="Delete Site"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(website.status)}`}>
            {website.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-white mb-2 truncate">
          {website.title}
        </h3>
        
        {website.description && (
          <p className="text-sm text-white/60 mb-3 line-clamp-2">
            {website.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-white/40 mb-3">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{website.views || 0} views</span>
          </div>
          <div>
            Created {formatDate(website.created_at)}
          </div>
        </div>

        {/* URL */}
        {siteUrl && (
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <Globe className="w-4 h-4 text-white/40 flex-shrink-0" />
            <a 
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 truncate"
            >
              {siteUrl.replace('https://', '')}
            </a>
          </div>
        )}

        {/* Powered By Notice */}
        {showPoweredBy && website.show_powered_by && (
          <div className="mt-3 text-xs text-white/40 text-center">
            Includes "Powered by 4site.pro" footer
          </div>
        )}
      </div>
    </motion.div>
  );
};