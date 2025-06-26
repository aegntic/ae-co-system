
import React from 'react';

// Ensure Section is JSON serializable for DB storage
export interface Section {
  id: string; 
  title: string; 
  content: string; // HTML content, or structured Markdown
  order: number; 
}

// Ensure PartnerToolRecommendation is JSON serializable
export interface PartnerToolRecommendation {
  name: string;
  description: string;
  ctaUrl: string;
  iconUrl?: string;
}

export interface SiteData {
  id: string; 
  title: string;
  repoUrl: string;
  generatedMarkdown: string; 
  sections: Section[]; 
  template: 'TechProjectTemplate' | 'CreativeProjectTemplate'; 
  partnerToolRecommendations?: PartnerToolRecommendation[] | null; // Nullable from DB
  deployed_url?: string | null; // Nullable from DB
  
  // Optional fields that might come from the API/DB for context
  status?: string; 
  errorMessage?: string | null;
}

export enum AppState {
  Idle,
  Loading,
  Success, 
  Error,
}

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string; 
  size?: number;
  color?: string;
}
    