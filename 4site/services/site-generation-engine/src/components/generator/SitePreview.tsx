
import React, { useState } from 'react';
import { SiteData } from '../../types'; // Adjusted
import { TechProjectTemplate } from '../templates/TechProjectTemplate'; // Adjusted
// import { CreativeProjectTemplate } from '../templates/CreativeProjectTemplate'; 
import { Button } from '../ui/Button'; // Adjusted
import { Alert } from '../ui/Alert';   // Adjusted
import { Icon } from '../ui/Icon';     // Adjusted
import { motion } from 'framer-motion';
// import { SOCIAL_SHARE_PLATFORMS, MADE_WITH_PROJECT4SITE_TEXT, PROJECT4SITE_URL } from '../../constants'; // Path needs adjustment

// Placeholder constants
const SOCIAL_SHARE_PLATFORMS = [
  { name: "Twitter", icon: "Twitter", urlPrefix: "https://twitter.com/intent/tweet?url=" },
  { name: "LinkedIn", icon: "Linkedin", urlPrefix: "https://www.linkedin.com/shareArticle?mini=true&url=" },
  { name: "Facebook", icon: "Facebook", urlPrefix: "https://www.facebook.com/sharer/sharer.php?u=" },
  { name: "Copy Link", icon: "Link", urlPrefix: "" } 
];
const MADE_WITH_PROJECT4SITE_TEXT = "Made with Project4Site Platform";
const PROJECT4SITE_URL = "https://project4.site"; // Example

interface SitePreviewProps {
  siteData: SiteData;
  onReset: () => void;
  error?: string | null;
}

export const SitePreview: React.FC<SitePreviewProps> = ({ siteData, onReset, error }) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  // The actual site URL will be from siteData.deployedUrl once available
  const siteUrlToShare = siteData.deployed_url || (typeof window !== 'undefined' ? window.location.href : PROJECT4SITE_URL + "/preview/" + siteData.id);


  const handleShare = (platformUrlPrefix: string) => {
    if (!platformUrlPrefix) { // Copy link case
      navigator.clipboard.writeText(siteUrlToShare)
        .then(() => alert('Link copied to clipboard!')) // Consider a less obtrusive notification
        .catch(err => console.error('Failed to copy link: ', err));
      return;
    }
    const url = `${platformUrlPrefix}${encodeURIComponent(siteUrlToShare)}&text=${encodeURIComponent(`Check out this project site for ${siteData.title}!`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const renderTemplate = () => {
    // This logic may need to be enhanced if templates are dynamically loaded or more complex
    switch (siteData.template) {
      case 'TechProjectTemplate':
        return <TechProjectTemplate siteData={siteData} />;
      // case 'CreativeProjectTemplate':
      //   return <CreativeProjectTemplate siteData={siteData} />; 
      default:
        // Fallback or error for unknown template
        console.warn(`Unknown template: ${siteData.template}, falling back to TechProjectTemplate.`);
        return <TechProjectTemplate siteData={siteData} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-16 px-4 md:px-8 bg-slate-900"> {/* Default dark bg for preview page */}
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
          // The template itself will have its own background, so this div can be transparent
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

