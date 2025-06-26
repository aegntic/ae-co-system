import React, { useState } from 'react';
import { SiteData, PartnerToolRecommendation, Section } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { motion } from 'framer-motion';

interface EnhancedTechProjectTemplateProps {
  siteData: SiteData;
}

// Image component with fallback support
const HeroImage: React.FC<{ 
  src?: string; 
  alt: string; 
  title: string;
}> = ({ src, alt, title }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fallback SVG with title
  const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0d1117;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#161b22;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFC107;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#bgGrad)"/>
      <rect x="50" y="250" width="1100" height="100" fill="none" stroke="url(#textGrad)" stroke-width="2" rx="50"/>
      <text x="600" y="320" text-anchor="middle" fill="url(#textGrad)" font-family="monospace" font-size="48" font-weight="bold">${title}</text>
      <text x="600" y="380" text-anchor="middle" fill="#8b949e" font-family="monospace" font-size="16">Powered by aegntic.ai</text>
    </svg>
  `)}`;

  const imageSrc = imageError || !src ? fallbackSvg : src;

  return (
    <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-gh-bg-secondary">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Icon name="Loader" size={60} className="text-wu-gold animate-spin mx-auto mb-4" />
            <p className="text-gh-text-secondary">Loading hero visual...</p>
          </div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80" />
    </div>
  );
};

const SectionCard: React.FC<{ section: Section, index: number, isLast?: boolean }> = ({ section, index, isLast = false }) => {
  // Try to infer an icon based on section title
  let iconName = "FileText"; // default
  if (section.title.toLowerCase().includes("feature")) iconName = "ListChecks";
  if (section.title.toLowerCase().includes("overview")) iconName = "Eye";
  if (section.title.toLowerCase().includes("tech") || section.title.toLowerCase().includes("stack")) iconName = "Cpu";
  if (section.title.toLowerCase().includes("start") || section.title.toLowerCase().includes("usage") || section.title.toLowerCase().includes("demo")) iconName = "TerminalSquare";
  if (section.title.toLowerCase().includes("install")) iconName = "Download";
  if (section.title.toLowerCase().includes("contribut")) iconName = "GitFork";
  if (section.title.toLowerCase().includes("license")) iconName = "ScrollText";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
    >
      {/* Smooth gradient transition between sections */}
      {index > 0 && (
        <div className="absolute -top-20 left-0 right-0 h-40 pointer-events-none">
          <div className="h-full bg-gradient-to-b from-transparent via-gh-bg-primary/20 to-transparent" />
        </div>
      )}
      
      <Card className="relative mb-8 bg-gradient-to-br from-gh-bg-secondary/60 to-gh-bg-secondary/40 backdrop-blur-sm border-gh-border-default/50 shadow-xl overflow-hidden hover:border-wu-gold/30 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-wu-gold/10 rounded-lg mr-3">
              <Icon name={iconName} size={24} className="text-wu-gold" />
            </div>
            <h2 className="text-2xl font-semibold text-wu-gold" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
          </div>
          <div
            className="prose prose-invert prose-sm sm:prose-base max-w-none 
              prose-headings:text-wu-gold 
              prose-strong:text-white 
              prose-a:text-wu-gold hover:prose-a:text-wu-gold-muted 
              prose-code:bg-gh-bg-tertiary prose-code:text-wu-gold prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-gh-bg-tertiary prose-pre:text-gh-text-primary prose-pre:border prose-pre:border-gh-border-default
              prose-blockquote:border-wu-gold prose-blockquote:bg-wu-gold/5
              prose-ul:marker:text-wu-gold prose-ol:marker:text-wu-gold"
            dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1[^>]*>.*?<\/h1>/i, '') }}
          />
        </div>
      </Card>
      
      {/* Soft gradient fade after each section */}
      {!isLast && (
        <div className="relative h-24 -mb-12 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gh-bg-primary/10 to-transparent" />
        </div>
      )}
    </motion.div>
  );
};

export const EnhancedTechProjectTemplate: React.FC<EnhancedTechProjectTemplateProps> = ({ siteData }) => {
  const mainContentSections = siteData.sections.filter(s => s.content.trim() !== '');

  return (
    <div className="min-h-screen bg-gh-bg-primary relative overflow-hidden">
      {/* Soft gradient background for smooth transitions */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gh-bg-primary via-gh-bg-primary/95 to-gh-bg-primary" />
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255, 215, 0, 0.02) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 193, 7, 0.02) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, transparent 0%, rgba(13, 17, 23, 0.4) 100%)
          `
        }} />
      </div>
      {/* Hero Section with guaranteed image loading */}
      <section className="relative z-10">
        <HeroImage 
          src={siteData.heroImage} 
          alt={`${siteData.title} hero image`}
          title={siteData.title}
        />
        
        {/* Hero content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center px-4 max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
              {siteData.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              {siteData.description}
            </p>
            
            {/* Tech stack badges */}
            {siteData.techStack && siteData.techStack.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {siteData.techStack.map((tech, idx) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="px-4 py-2 bg-black/60 backdrop-blur-sm border border-wu-gold/50 rounded-full text-sm font-medium text-wu-gold"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main content with gradient separator */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {/* Smooth transition from hero to content */}
        <div className="absolute -top-32 left-0 right-0 h-64 pointer-events-none">
          <div className="h-full bg-gradient-to-b from-black/60 via-gh-bg-primary/80 to-transparent" />
        </div>
        {mainContentSections.map((section, index) => {
          const isValidSection = section.id !== 'title' && section.title.toLowerCase() !== siteData.title.toLowerCase();
          const isLast = index === mainContentSections.filter(s => s.id !== 'title' && s.title.toLowerCase() !== siteData.title.toLowerCase()).length - 1;
          return isValidSection ? (
            <SectionCard 
              key={section.id || `section-${index}`} 
              section={section} 
              index={index}
              isLast={isLast}
            />
          ) : null;
        })}

        {/* Partner recommendations */}
        {siteData.partnerToolRecommendations && siteData.partnerToolRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: mainContentSections.length * 0.1 }}
          >
            <Card className="mb-8 bg-gh-bg-secondary/70 border-gh-border-default shadow-xl">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-wu-gold/10 rounded-lg mr-3">
                    <Icon name="Puzzle" size={24} className="text-wu-gold" />
                  </div>
                  <h2 className="text-2xl font-semibold text-wu-gold">Recommended Tools & Services</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {siteData.partnerToolRecommendations.map((tool, idx) => (
                    <a 
                      key={idx} 
                      href={tool.ctaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block p-4 bg-gh-bg-tertiary rounded-lg hover:bg-gh-bg-overlay hover:border-wu-gold/50 border border-transparent transition-all duration-300 group"
                    >
                      <div className="flex items-center mb-2">
                        {tool.iconUrl && (
                          <img 
                            src={tool.iconUrl} 
                            alt={`${tool.name} logo`} 
                            className="w-6 h-6 mr-2 rounded-sm"
                            onError={(e) => {
                              // Hide broken images
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <h3 className="font-medium text-white group-hover:text-wu-gold transition-colors">
                          {tool.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gh-text-secondary mb-2">
                        {tool.description}
                      </p>
                      <span className="text-sm text-wu-gold group-hover:text-wu-gold-muted transition-colors">
                        {tool.ctaText} →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Additional images gallery */}
        {siteData.additionalImages && siteData.additionalImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: (mainContentSections.length + 1) * 0.1 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-semibold text-wu-gold mb-8 text-center">
              Project Visuals
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {siteData.additionalImages.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`${siteData.title} visual ${index + 1}`}
                    className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border border-gh-border-default group-hover:border-wu-gold/50"
                    onError={(e) => {
                      // Replace with placeholder on error
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
                          <rect fill="#161b22" width="400" height="300"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#8b949e" font-family="monospace">Image ${index + 1}</text>
                        </svg>
                      `)}`;
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};