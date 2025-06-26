import { EnhancedSiteContent, ProjectMetadata } from './enhanced-content-types';
import { SiteData } from './types';

export function convertToSiteData(
  enhanced: EnhancedSiteContent, 
  repoUrl: string
): SiteData {
  const { markdown, metadata } = enhanced;
  
  // Generate a unique ID for the site
  const id = generateId();
  
  // Determine template based on project type
  const template = determineTemplate(metadata.projectType);
  
  // Extract primary color or use default
  const primaryColor = metadata.primaryColor || generateColorFromTitle(metadata.title);
  
  // Parse repository info
  const { owner, repo } = extractRepoInfo(repoUrl);
  
  // Convert project type to match SiteData expectations
  const projectType = mapProjectType(metadata.projectType);
  
  return {
    id,
    title: metadata.title,
    description: metadata.description,
    content: markdown,
    template,
    createdAt: new Date(),
    repoUrl,
    githubUrl: repoUrl, // Alias for compatibility
    generatedMarkdown: markdown,
    sections: [], // Will be populated by markdown parser
    features: metadata.features,
    techStack: metadata.techStack,
    projectType,
    primaryColor,
    owner,
    repo,
    tier: 'premium'
  };
}

function generateId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function determineTemplate(projectType: string): string {
  const templateMap: Record<string, string> = {
    'library': 'TechProjectTemplate',
    'application': 'TechProjectTemplate',
    'tool': 'TechProjectTemplate',
    'framework': 'TechProjectTemplate',
    'other': 'CreativeProjectTemplate'
  };
  
  return templateMap[projectType] || 'TechProjectTemplate';
}

function mapProjectType(enhancedType: string): 'tech' | 'creative' | 'business' | 'library' | 'tool' | 'other' {
  const typeMap: Record<string, 'tech' | 'creative' | 'business' | 'library' | 'tool' | 'other'> = {
    'library': 'library',
    'application': 'tech',
    'tool': 'tool',
    'framework': 'library',
    'other': 'other'
  };
  
  return typeMap[enhancedType] || 'other';
}

function generateColorFromTitle(title: string): string {
  // Generate a consistent color based on title
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EF4444', // red
    '#6366F1', // indigo
  ];
  
  const hash = title.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

export function extractRepoInfo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}