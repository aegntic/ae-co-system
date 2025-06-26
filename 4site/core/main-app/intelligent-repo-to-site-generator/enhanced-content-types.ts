export interface ProjectMetadata {
  title: string;
  description: string;
  projectType: 'library' | 'application' | 'tool' | 'framework' | 'other';
  primaryLanguage: string;
  features: string[];
  techStack: string[];
  targetAudience: string[];
  useCases: string[];
  primaryColor?: string;
  secondaryColor?: string;
}

export interface EnhancedSiteContent {
  markdown: string;
  metadata: ProjectMetadata;
  generatedAt: Date;
  aiModel: string;
  confidence: number;
}

export interface ConversionOptions {
  preserveMarkdown?: boolean;
  generateId?: boolean;
  defaultTemplate?: string;
}