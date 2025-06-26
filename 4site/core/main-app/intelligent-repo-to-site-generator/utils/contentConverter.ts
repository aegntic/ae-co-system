import { SiteData } from '../types';
import { EnhancedSiteContent, ProjectMetadata } from '../enhanced-content-types';

export function generateId(): string {
  return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function determineTemplate(projectType: string): string {
  const templateMap: Record<string, string> = {
    'library': 'documentation',
    'application': 'application',
    'tool': 'tool',
    'framework': 'documentation',
    'other': 'simple'
  };
  return templateMap[projectType] || 'simple';
}

export function generateColorFromTitle(title: string): string {
  const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899'];
  const hash = title.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

export function extractRepoInfo(repoUrl: string): { owner: string; repo: string } {
  try {
    const url = new URL(repoUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    return {
      owner: pathParts[0] || 'unknown',
      repo: pathParts[1] || 'unknown'
    };
  } catch {
    return { owner: 'unknown', repo: 'unknown' };
  }
}

export function mapProjectType(aiProjectType: string): 'tech' | 'creative' | 'business' | 'library' | 'tool' | 'other' {
  const typeMap: Record<string, 'tech' | 'creative' | 'business' | 'library' | 'tool' | 'other'> = {
    'library': 'library',
    'application': 'tech',
    'tool': 'tool',
    'framework': 'library',
    'other': 'other'
  };
  return typeMap[aiProjectType] || 'other';
}

export function convertToSiteData(enhanced: EnhancedSiteContent, repoUrl: string): SiteData {
  const { markdown, metadata } = enhanced;
  const id = generateId();
  const template = determineTemplate(metadata.projectType);
  const primaryColor = metadata.primaryColor || generateColorFromTitle(metadata.title);
  const { owner, repo } = extractRepoInfo(repoUrl);
  const projectType = mapProjectType(metadata.projectType);
  
  return {
    id,
    title: metadata.title,
    description: metadata.description,
    content: metadata.description, // Use description as content for compatibility
    template,
    createdAt: new Date(),
    repoUrl,
    githubUrl: repoUrl,
    generatedMarkdown: markdown,
    sections: [], // Will be populated by section parser if needed
    features: metadata.features,
    techStack: metadata.techStack,
    projectType,
    primaryColor,
    owner,
    repo,
    tier: 'premium'
  };
}