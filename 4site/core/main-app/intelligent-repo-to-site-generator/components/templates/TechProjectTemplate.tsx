
import React from 'react';
import { SiteData, PartnerToolRecommendation, Section } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { motion } from 'framer-motion';
import { PoweredByFooter } from '../viral/PoweredByFooter';
import { ProShowcaseGrid } from '../viral/ProShowcaseGrid';
import ShareTracker from '../viral/ShareTracker';
import { LeadCaptureWidget } from '../universal/LeadCaptureWidget';
import { useAuth, usePermissions } from '../../contexts/AuthContext';

interface TechProjectTemplateProps {
  siteData: SiteData;
}

const SectionCard: React.FC<{ section: Section, index: number }> = ({ section, index }) => {
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
    >
      <Card className="mb-8 bg-slate-800/70 border-slate-700 shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Icon name={iconName} size={24} className="text-sky-400 mr-3" />
            <h2 className="text-2xl font-semibold text-sky-300" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
          </div>
          <div
            className="prose prose-sm sm:prose-base max-w-none text-slate-300 prose-headings:text-sky-200 prose-strong:text-slate-100 prose-a:text-teal-400 hover:prose-a:text-teal-300 prose-code:bg-slate-700 prose-code:text-sky-300 prose-pre:bg-slate-900 prose-pre:text-slate-200"
            dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1[^>]*>.*?<\/h1>/i, '') }} // Remove H1 if it was part of the section content
          />
        </div>
      </Card>
    </motion.div>
  );
};


export const TechProjectTemplate: React.FC<TechProjectTemplateProps> = ({ siteData }) => {
  const { userProfile } = useAuth();
  const permissions = usePermissions();
  const mainContentSections = siteData.sections.filter(s => s.content.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Introduction/Header part of the template could go here if needed, above sections */}
      {/* For now, relying on SitePreview's header for title and GitHub link */}
      
      {mainContentSections.map((section, index) => (
         // If the first section content is effectively the title, we might have handled it already
         // Or, the parserService should ideally not make the H1 into its own section if it's the main title
        (section.id !== 'title' && section.title.toLowerCase() !== siteData.title.toLowerCase()) ? (
          <SectionCard key={section.id || `section-${index}`} section={section} index={index} />
        ) : null
      ))}

      {siteData.partnerToolRecommendations && siteData.partnerToolRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: mainContentSections.length * 0.1 }}
        >
          <Card className="mb-8 bg-slate-800/70 border-slate-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Icon name="Puzzle" size={24} className="text-sky-400 mr-3" />
                <h2 className="text-2xl font-semibold text-sky-300">Recommended Tools & Services</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {siteData.partnerToolRecommendations.map((tool, idx) => (
                  <a key={idx} href={tool.ctaUrl} target="_blank" rel="noopener noreferrer" 
                     className="block p-4 bg-slate-700/50 rounded-lg hover:bg-slate-600/70 transition-colors group">
                    <div className="flex items-center mb-2">
                      {tool.iconUrl && <img src={tool.iconUrl} alt={`${tool.name} logo`} className="w-6 h-6 mr-2 rounded-sm"/>}
                      <h3 className="text-md font-semibold text-slate-100 group-hover:text-teal-300">{tool.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400">{tool.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Share Tracker - allows external sharing and viral boost */}
      <ShareTracker
        websiteId={siteData.id || 'unknown'}
        websiteUrl={siteData.githubUrl || window.location.href}
        websiteTitle={siteData.title}
        websiteDescription={siteData.description}
        showShareCount={true}
        compact={false}
      />
      
      {/* Pro Showcase Grid - shows for all tiers except Enterprise opt-out */}
      <ProShowcaseGrid 
        currentSiteId={siteData.id}
        userTier={userProfile?.subscription_tier || 'free'}
        optOut={false} // Could be a user setting for Enterprise
      />
      
      {/* Universal Lead Capture Widget - CRITICAL: Cannot be disabled, on every site */}
      <LeadCaptureWidget
        siteId={siteData.id || 'unknown'}
        projectType="tech"
        template="TechProjectTemplate"
        position="bottom-right"
        theme="dark"
        compact={false}
      />
      
      {/* Powered By Footer - shows for free tier users */}
      <PoweredByFooter 
        siteId={siteData.id || 'default'}
        isPro={permissions.canRemoveBranding()}
        referralCode={userProfile?.referral_code}
        style="standard"
        position="bottom-right"
      />
    </div>
  );
};
