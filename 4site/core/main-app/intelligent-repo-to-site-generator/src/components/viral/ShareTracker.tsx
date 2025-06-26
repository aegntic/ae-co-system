import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Mail, 
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { showcaseHelpers } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ShareTrackerProps {
  websiteId: string;
  websiteUrl: string;
  websiteTitle: string;
  websiteDescription?: string;
  showShareCount?: boolean;
  compact?: boolean;
}

interface SharePlatform {
  name: string;
  icon: React.ElementType;
  color: string;
  getShareUrl: (url: string, title: string, description?: string) => string;
}

const ShareTracker: React.FC<ShareTrackerProps> = ({
  websiteId,
  websiteUrl,
  websiteTitle,
  websiteDescription = '',
  showShareCount = true,
  compact = false
}) => {
  const { user } = useAuth();
  const [shareCount, setShareCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  const platforms: SharePlatform[] = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'hover:bg-blue-500',
      getShareUrl: (url, title, description) => 
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title} - ${description}`)}&via=4sitepro`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:bg-blue-600',
      getShareUrl: (url, title, description) => 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'hover:bg-blue-700',
      getShareUrl: (url, title, description) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(`${title} - ${description}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'hover:bg-gray-600',
      getShareUrl: (url, title, description) => 
        `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this amazing project: ${title}\n\n${description}\n\n${url}\n\nCreated with 4site.pro`)}`
    }
  ];

  const handleShare = async (platform: SharePlatform) => {
    try {
      setSharing(platform.name);
      
      // Track the external share
      await showcaseHelpers.trackExternalShare(
        websiteId,
        platform.name.toLowerCase(),
        websiteUrl,
        user?.id
      );
      
      // Update local share count
      setShareCount(prev => prev + 1);
      
      // Open share window
      const shareUrl = platform.getShareUrl(websiteUrl, websiteTitle, websiteDescription);
      
      if (platform.name === 'Email') {
        window.location.href = shareUrl;
      } else {
        const popup = window.open(
          shareUrl,
          'share',
          'width=600,height=400,scrollbars=yes,resizable=yes'
        );
        
        // Focus the popup window
        if (popup) popup.focus();
      }
      
    } catch (error) {
      console.error('Error tracking share:', error);
      // Still allow sharing even if tracking fails
      const shareUrl = platform.getShareUrl(websiteUrl, websiteTitle, websiteDescription);
      if (platform.name === 'Email') {
        window.location.href = shareUrl;
      } else {
        window.open(shareUrl, 'share', 'width=600,height=400');
      }
    } finally {
      setSharing(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      
      // Track copy as a share
      await showcaseHelpers.trackExternalShare(
        websiteId,
        'copy_link',
        websiteUrl,
        user?.id
      );
      
      setShareCount(prev => prev + 1);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = websiteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            // Toggle expanded share menu
            const menu = document.getElementById(`share-menu-${websiteId}`);
            if (menu) {
              menu.classList.toggle('hidden');
            }
          }}
          className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
          {showShareCount && shareCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-400 text-black text-xs rounded-full font-medium">
              {shareCount}
            </span>
          )}
        </button>
        
        <div id={`share-menu-${websiteId}`} className="hidden absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-2 z-10">
          <div className="flex gap-1">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  disabled={sharing === platform.name}
                  className={`p-2 rounded transition-colors text-white/80 hover:text-white ${platform.color} ${
                    sharing === platform.name ? 'opacity-50' : ''
                  }`}
                  title={`Share on ${platform.name}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded transition-colors text-white/80 hover:text-white hover:bg-gray-600"
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-400/20 rounded-lg">
            <Share2 className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Share This Project</h3>
            <p className="text-gray-400 text-sm">
              Help others discover this amazing project
              {showShareCount && shareCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary-400/20 text-primary-400 text-xs rounded-full">
                  {shareCount} shares boost viral score
                </span>
              )}
            </p>
          </div>
        </div>
        
        {showShareCount && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{shareCount}</div>
            <div className="text-sm text-gray-400">External Shares</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <motion.button
              key={platform.name}
              onClick={() => handleShare(platform)}
              disabled={sharing === platform.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white ${platform.color} ${
                sharing === platform.name ? 'opacity-50' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{platform.name}</span>
              {sharing === platform.name && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-auto" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
        <div className="flex-1 p-2 bg-black/20 rounded text-white/60 text-sm font-mono truncate">
          {websiteUrl}
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-2 bg-primary-400 text-black font-medium rounded hover:bg-primary-500 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <ExternalLink className="w-4 h-4" />
          <span className="font-medium">Viral Boost Active</span>
        </div>
        <p className="text-sm text-gray-400">
          External shares increase your project's featuring likelihood and viral score. 
          Every 5 shares triggers automatic featuring in the Pro Showcase Grid!
        </p>
      </div>
    </div>
  );
};

export default ShareTracker;