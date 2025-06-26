import { generateEnhancedSiteContent } from './enhancedGeminiService';
import { convertToSiteData } from '../content-converter-utils';
import { SiteData } from '../types';

export const generateSiteContentFromUrl = async (repoUrl: string): Promise<SiteData> => {
  try {
    // Parse repository information
    const urlParts = repoUrl.replace(/^https?:\/\//, '').split('/');
    const owner = urlParts[1];
    const repo = urlParts[2];
    
    // Generate enhanced content with structured metadata
    console.log(`Generating enhanced content for ${owner}/${repo}...`);
    const enhancedContent = await generateEnhancedSiteContent(repoUrl);
    
    // Convert to SiteData format expected by UI
    const siteData = convertToSiteData(enhancedContent, repoUrl);
    
    // Add repository-specific metadata
    siteData.owner = owner;
    siteData.repo = repo;
    siteData.repoUrl = repoUrl;
    
    console.log(`Successfully generated site data for ${repo}`);
    return siteData;
  } catch (error) {
    console.error('Error generating site content:', error);
    throw new Error(`Failed to generate content for ${repoUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Keep the original function for backward compatibility
export const generateRawSiteContent = async (repoUrl: string): Promise<string> => {
  const siteData = await generateSiteContentFromUrl(repoUrl);
  return siteData.content;
};