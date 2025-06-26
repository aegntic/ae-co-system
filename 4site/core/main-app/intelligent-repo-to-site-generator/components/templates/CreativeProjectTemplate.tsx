
import React from 'react';
import { SiteData } from '../../types';
import { Card } from '../ui/Card';
import { PoweredByFooter } from '../viral/PoweredByFooter';
import { ProShowcaseGrid } from '../viral/ProShowcaseGrid';
import ShareTracker from '../viral/ShareTracker';
import { LeadCaptureWidget } from '../universal/LeadCaptureWidget';
import { useAuth, usePermissions } from '../../contexts/AuthContext';

interface CreativeProjectTemplateProps {
  siteData: SiteData;
}

export const CreativeProjectTemplate: React.FC<CreativeProjectTemplateProps> = ({ siteData }) => {
  const { userProfile } = useAuth();
  const permissions = usePermissions();

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 bg-slate-800 border-slate-700">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-4">(Creative Template) {siteData.title}</h1>
        <p className="text-center text-slate-300 mb-6">This is a placeholder for a more visually distinct "Creative" template.</p>
        
        {siteData.sections.map((section, index) => (
          (section.id !== 'title' && section.title.toLowerCase() !== siteData.title.toLowerCase()) && section.content.trim() !== '' ? (
            <div key={section.id || `section-${index}`} className="mb-6 p-4 bg-slate-700/50 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-300 mb-2" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
              <div 
                className="prose prose-sm prose-invert max-w-none text-slate-300 prose-headings:text-purple-200 prose-strong:text-slate-100 prose-a:text-pink-400 hover:prose-a:text-pink-300"
                dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1[^>]*>.*?<\/h1>/i, '') }}
              />
            </div>
          ) : null
        ))}
         <p className="text-center text-xs text-slate-500 mt-8">Creative Template - More unique styling to come!</p>
      </Card>

      {/* Share Tracker - allows external sharing and viral boost */}
      <ShareTracker
        websiteId={siteData.id || 'unknown'}
        websiteUrl={siteData.repoUrl || window.location.href}
        websiteTitle={siteData.title}
        websiteDescription={siteData.description}
        showShareCount={true}
        compact={false}
      />
      
      {/* Pro Showcase Grid - shows for all tiers except Enterprise opt-out */}
      <ProShowcaseGrid 
        currentSiteId={siteData.id}
        userTier={userProfile?.subscription_tier || 'free'}
        optOut={false}
      />
      
      {/* Universal Lead Capture Widget - CRITICAL: Cannot be disabled, on every site */}
      <LeadCaptureWidget
        siteId={siteData.id || 'unknown'}
        projectType="creative"
        template="CreativeProjectTemplate"
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
