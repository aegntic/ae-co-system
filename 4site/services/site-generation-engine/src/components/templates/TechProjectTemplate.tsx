
import React from 'react';
import { SiteData, PartnerToolRecommendation, Section } from '../../types'; // Adjusted
import { Card } from '../ui/Card'; // Adjusted
import { Icon } from '../ui/Icon';   // Adjusted
import { motion } from 'framer-motion';

interface TechProjectTemplateProps {
  siteData: SiteData;
}

const SectionCard: React.FC<{ section: Section, index: number }> = ({ section, index }) => {
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
    >
      {/* Assuming a light background for the generated site by default */}
      <Card className="mb-8 bg-card text-card-foreground border-muted shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Icon name={iconName} size={24} className="text-primary mr-3" />
            <h2 className="text-2xl font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
          </div>
          <div
            className="prose prose-sm sm:prose-base max-w-none prose-invert" /* Using prose-invert for dark on light, or regular prose for light on dark if card is dark */
            dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1[^>]*>.*?<\/h1>/i, '') }} 
          />
        </div>
      </Card>
    </motion.div>
  );
};


export const TechProjectTemplate: React.FC<TechProjectTemplateProps> = ({ siteData }) => {
  const mainContentSections = siteData.sections.filter(s => s.content && s.content.trim() !== '');
  // Defaulting to a light background for the template content area
  // The SitePreview page itself has a dark background. This template is for the content within.
  return (
    <div className="max-w-4xl mx-auto bg-background p-4 sm:p-6 md:p-8 rounded-lg shadow-lg">
      {mainContentSections.map((section, index) => (
        (section.id !== 'title_section' && section.title.toLowerCase() !== siteData.title.toLowerCase()) ? (
          <SectionCard key={section.id || `section-${index}`} section={section} index={index} />
        ) : null
      ))}

      {siteData.partnerToolRecommendations && siteData.partnerToolRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: mainContentSections.length * 0.1 }}
        >
          <Card className="mb-8 bg-card text-card-foreground border-muted shadow-xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="Puzzle" size={24} className="text-primary mr-3" />
                <h2 className="text-2xl font-semibold text-foreground">Recommended Tools & Services</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {siteData.partnerToolRecommendations.map((tool, idx) => (
                  <a key={idx} href={tool.ctaUrl} target="_blank" rel="noopener noreferrer" 
                     className="block p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-center mb-2">
                      {tool.iconUrl && <img src={tool.iconUrl} alt={`${tool.name} logo`} className="w-6 h-6 mr-2 rounded-sm"/>}
                      <h3 className="text-md font-semibold text-foreground group-hover:text-primary">{tool.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
