
import React from 'react';
import { SiteData } from '../../types'; // Adjusted
import { Card } from '../ui/Card';     // Adjusted

interface CreativeProjectTemplateProps {
  siteData: SiteData;
}

export const CreativeProjectTemplate: React.FC<CreativeProjectTemplateProps> = ({ siteData }) => {
  return (
    // Example: Creative template with a slightly different card style
    <Card className="p-6 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-4">(Creative Template) {siteData.title}</h1>
      <p className="text-center opacity-90 mb-6">This is a placeholder for a more visually distinct "Creative" template.</p>
      
      {siteData.sections.map((section, index) => (
        (section.id !== 'title_section' && section.title.toLowerCase() !== siteData.title.toLowerCase()) && section.content && section.content.trim() !== '' ? (
          <div key={section.id || `section-${index}`} className="mb-6 p-4 bg-black/20 rounded-lg backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-2" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
            <div 
              className="prose prose-sm prose-invert max-w-none opacity-90 prose-headings:text-white prose-strong:text-white prose-a:text-yellow-300 hover:prose-a:text-yellow-200"
              dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1[^>]*>.*?<\/h1>/i, '') }}
            />
          </div>
        ) : null
      ))}
       <p className="text-center text-xs opacity-70 mt-8">Creative Template - More unique styling to come!</p>
    </Card>
  );
};
