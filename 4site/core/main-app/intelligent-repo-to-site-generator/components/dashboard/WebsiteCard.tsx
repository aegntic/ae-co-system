import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { updateWebsite, deleteWebsite } from '../../lib/supabase';

interface WebsiteCardProps {
  website: {
    id: string;
    title: string;
    description?: string;
    repo_url: string;
    subdomain?: string;
    custom_domain?: string;
    status: 'active' | 'building' | 'error' | 'suspended';
    pageviews: number;
    unique_visitors: number;
    created_at: string;
    updated_at: string;
  };
  onUpdate: () => void;
}

export const WebsiteCard: React.FC<WebsiteCardProps> = ({ website, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${website.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWebsite(website.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('Failed to delete website');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = () => {
    switch (website.status) {
      case 'active':
        return 'text-green-400 bg-green-400/10';
      case 'building':
        return 'text-yellow-400 bg-yellow-400/10 animate-pulse';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      case 'suspended':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = () => {
    switch (website.status) {
      case 'active':
        return 'check-circle';
      case 'building':
        return 'loader-2';
      case 'error':
        return 'alert-circle';
      case 'suspended':
        return 'pause-circle';
      default:
        return 'circle';
    }
  };

  const websiteUrl = website.custom_domain 
    ? `https://${website.custom_domain}`
    : website.subdomain 
      ? `https://${website.subdomain}.4site.pro`
      : '#';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-6 relative group"
    >
      {/* Status Badge */}
      <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor()}`}>
        <Icon 
          name={getStatusIcon()} 
          size={12} 
          className={website.status === 'building' ? 'animate-spin' : ''} 
        />
        <span className="capitalize">{website.status}</span>
      </div>

      {/* Website Info */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white pr-20">{website.title}</h3>
        
        {website.description && (
          <p className="text-gray-400 text-sm line-clamp-2">{website.description}</p>
        )}

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Icon name="github" size={14} />
          <a 
            href={website.repo_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors truncate"
          >
            {website.repo_url.replace('https://github.com/', '')}
          </a>
        </div>

        {website.status === 'active' && (
          <div className="flex items-center space-x-2 text-sm">
            <Icon name="external-link" size={14} className="text-gray-500" />
            <a 
              href={websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors truncate"
            >
              {websiteUrl.replace('https://', '')}
            </a>
          </div>
        )}

        {/* Metrics */}
        <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Icon name="eye" size={14} />
              <span>{website.pageviews.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="users" size={14} />
              <span>{website.unique_visitors.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Icon name="more-vertical" size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-xl z-10">
                <div className="py-1">
                  <a
                    href={`/editor/${website.id}`}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Icon name="edit" size={16} />
                    <span>Edit Site</span>
                  </a>
                  
                  <a
                    href={`/analytics/${website.id}`}
                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Icon name="bar-chart-3" size={16} />
                    <span>View Analytics</span>
                  </a>
                  
                  <button
                    onClick={() => window.open(websiteUrl, '_blank')}
                    disabled={website.status !== 'active'}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="external-link" size={16} />
                    <span>Visit Site</span>
                  </button>
                  
                  <hr className="my-1 border-gray-800" />
                  
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                  >
                    <Icon name={isDeleting ? 'loader-2' : 'trash-2'} size={16} className={isDeleting ? 'animate-spin' : ''} />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Site'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};