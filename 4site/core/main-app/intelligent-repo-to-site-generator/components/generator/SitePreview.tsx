
import React, { useState, useEffect } from 'react';
import { SiteData } from '../../types';
import { TechProjectTemplate } from '../templates/TechProjectTemplate';
// import { CreativeProjectTemplate } from '../templates/CreativeProjectTemplate'; // Placeholder for future
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Icon } from '../ui/Icon';
import { motion } from 'framer-motion';
import { SOCIAL_SHARE_PLATFORMS, MADE_WITH_PROJECT4SITE_TEXT, PROJECT4SITE_URL } from '../../constants';

interface SitePreviewProps {
  siteData: SiteData;
  onReset: () => void;
  error?: string | null;
}

export const SitePreview: React.FC<SitePreviewProps> = ({ siteData, onReset, error }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
  const siteUrl = window.location.href; // For sharing current page (conceptual in MVP)
  
  // Preload hero image
  useEffect(() => {
    if (siteData.heroImage) {
      const img = new Image();
      img.onload = () => setHeroImageLoaded(true);
      img.onerror = () => {
        setHeroImageError(true);
        setHeroImageLoaded(true); // Still show content even if image fails
      };
      img.src = siteData.heroImage;
    } else {
      setHeroImageLoaded(true);
    }
  }, [siteData.heroImage]);

  const handleShare = (platformUrlPrefix: string) => {
    if (!platformUrlPrefix) { // Copy link case
      navigator.clipboard.writeText(siteUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy link: ', err));
      return;
    }
    const url = `${platformUrlPrefix}${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(`Check out this project site for ${siteData.title}!`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const renderTemplate = () => {
    switch (siteData.template) {
      case 'TechProjectTemplate':
        return <TechProjectTemplate siteData={siteData} />;
      // case 'CreativeProjectTemplate':
      //   return <CreativeProjectTemplate siteData={siteData} />; // Placeholder
      default:
        return <TechProjectTemplate siteData={siteData} />; // Fallback
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-16 px-4 md:px-8 bg-slate-900">
      <div className="container mx-auto max-w-5xl">
        <motion.div 
          className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-800 rounded-lg shadow-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sky-300">{siteData.title}</h1>
            <a href={siteData.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-sky-400 transition-colors flex items-center">
              <Icon name="Github" size={16} className="mr-1.5"/> View on GitHub
            </a>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
             <Button 
                onClick={() => setShowShareOptions(!showShareOptions)} 
                variant="secondary" 
                className="!bg-teal-500/80 hover:!bg-teal-600 !text-white"
                icon={<Icon name="Share2" size={18} className="mr-2"/>}
              >
                Share
            </Button>
            <Button 
                onClick={onReset} 
                variant="outline" 
                className="!border-sky-500 !text-sky-300 hover:!bg-sky-500/20"
                icon={<Icon name="ArrowLeft" size={18} className="mr-2"/>}
            >
                Generate Another
            </Button>
          </div>
        </motion.div>

        {showShareOptions && (
          <motion.div 
            className="mb-6 p-4 bg-slate-700 rounded-lg shadow"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Share this site:</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_SHARE_PLATFORMS.map(platform => (
                <Button 
                  key={platform.name}
                  onClick={() => handleShare(platform.urlPrefix)}
                  variant="outline"
                  className="!text-slate-300 !border-slate-500 hover:!bg-slate-600"
                  icon={<Icon name={platform.icon} size={16} className="mr-2"/>}
                >
                  {platform.name}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {error && <Alert type="error" message={`There was an issue displaying the site: ${error}`} className="mb-6" />}
        
        <motion.div
          key={siteData.id} // Re-trigger animation if siteData changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderTemplate()}
        </motion.div>
        
        <div className="mt-12 text-center">
            <a href={PROJECT4SITE_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-sky-400 transition-colors inline-flex items-center">
               <Icon name="ExternalLink" size={14} className="mr-1.5" /> {MADE_WITH_PROJECT4SITE_TEXT}
            </a>
        </div>
      </div>
    </div>
  );
};
