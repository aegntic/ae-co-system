import React from 'react';

export interface Section {
  id: string; // e.g., 'overview', 'features', 'tech-stack'
  title: string; // Human-readable title
  content: string; // HTML content
  order: number; // For sorting sections
}

export interface PartnerToolRecommendation {
  name: string;
  description: string;
  ctaUrl: string;
  iconUrl?: string;
}

export interface SiteData {
  id?: string;
  title: string;
  description: string;      // Brief project description for hero section
  content: string;          // Main content (compatibility field)
  template?: string;         // Template identifier (compatibility)
  createdAt?: Date | string;          // Creation timestamp (compatibility)
  repoUrl: string;          // GitHub repository URL
  githubUrl?: string;        // Alias for repoUrl for compatibility
  generatedMarkdown?: string; // The raw Markdown returned by Gemini
  generatedBy?: string;     // AI model or mode used for generation (e.g., 'demo-mode', 'gemini')
  sections?: Section[];      // Structured content sections
  features: string[];       // Array of key features for preview
  techStack: string[];      // Array of technologies used
  projectType: 'tech' | 'creative' | 'business' | 'library' | 'tool' | 'other' | 'application' | 'framework';
  primaryLanguage?: string;  // Primary programming language
  primaryColor: string;     // Main brand color derived from content
  tier?: 'free' | 'select' | 'custom' | 'enhanced' | 'premium' | 'enterprise';
  owner?: string;           // Repository owner
  repo?: string;            // Repository name
  targetAudience?: string[];  // Target audience for the project
  useCases?: string[];       // Use cases for the project
  stars?: number;           // GitHub stars count
  forks?: number;           // GitHub forks count
  language?: string;        // Primary language (compatibility)
  topics?: string[];        // GitHub topics
  homepage?: string;        // Project homepage URL
  updatedAt?: string;       // Last updated timestamp
  generatedAt?: Date;       // When this data was generated
  aiGenerated?: boolean;    // Whether content was AI generated or fallback
  partnerToolRecommendations?: PartnerToolRecommendation[];
  deploymentOptions?: DeploymentOption[];
  mcpServerConfig?: MCPServerConfig;
  customizations?: SiteCustomizations;
  visuals?: GeneratedVisuals;
  generationMetrics?: GenerationMetrics;
}

export interface GeneratedVisuals {
  heroImage: string;
  heroImageNoBackground: string;
  projectIcon: string;
  projectIconNoBackground: string;
  colorPalette: string[];
  visualStyle?: string;
}

export interface GenerationMetrics {
  contentGenerationTime: number;
  imageGenerationTime: number;
  totalTime: number;
  visualsGenerated: boolean;
  techStackIdentified: string[];
}

export enum AppState {
  Idle,
  ModeSelection,
  AutoMode,
  SelectStyle,
  CustomDesign,
  Loading,
  Success,
  Error,
}

export enum SetupMode {
  Auto = 'auto',
  SelectStyle = 'select',
  CustomDesign = 'custom'
}

export interface SetupModeOption {
  id: SetupMode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  pricing: PricingInfo;
  icon: string;
  gradient: string;
  popular?: boolean;
}

export interface PricingInfo {
  price: string;
  period?: string;
  features: string[];
  limitations?: string[];
}

export interface DeploymentOption {
  name: string;
  description: string;
  icon: string;
  free: boolean;
  url: string;
  features: string[];
}

export interface MCPServerConfig {
  name: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  generated: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  template: string;
  arguments?: Record<string, any>;
}

export interface SiteCustomizations {
  colorScheme: ColorScheme;
  typography: Typography;
  layout: LayoutConfig;
  components: ComponentConfig[];
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Typography {
  fontFamily: string;
  headingFont?: string;
  fontSize: 'sm' | 'md' | 'lg';
}

export interface LayoutConfig {
  header: 'minimal' | 'standard' | 'hero';
  navigation: 'top' | 'side' | 'none';
  footer: 'simple' | 'detailed' | 'none';
}

export interface ComponentConfig {
  type: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface RepositoryAnalysis {
  languages: Record<string, number>;
  frameworks: string[];
  features: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  category: 'web' | 'mobile' | 'desktop' | 'library' | 'tool' | 'other';
  readme: {
    quality: number;
    sections: string[];
    hasImages: boolean;
    hasDemo: boolean;
  };
  activity: {
    stars: number;
    forks: number;
    lastCommit: string;
    contributors: number;
  };
}

export interface AurachatMapping {
  projectStructure: ProjectStructure;
  recommendations: Recommendation[];
  optimizations: Optimization[];
}

export interface ProjectStructure {
  architecture: string;
  components: ComponentStructure[];
  dependencies: Dependency[];
}

export interface ComponentStructure {
  name: string;
  type: string;
  description: string;
  connections: string[];
}

export interface Dependency {
  name: string;
  version: string;
  purpose: string;
  importance: 'critical' | 'important' | 'optional';
}

export interface Recommendation {
  type: 'design' | 'technical' | 'content' | 'marketing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface Optimization {
  category: string;
  suggestion: string;
  benefit: string;
  implementation: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  limits: {
    sites: number;
    customDomains: number;
    mcpServers: number;
    storage: string;
  };
}

export interface User {
  id: string;
  email: string;
  subscription: SubscriptionTier | null;
  sites: UserSite[];
  preferences: UserPreferences;
}

export interface UserSite {
  id: string;
  title: string;
  url: string;
  repoUrl: string;
  tier: string;
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'building' | 'error';
}

export interface UserPreferences {
  defaultTier: SetupMode;
  notifications: boolean;
  analytics: boolean;
}

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string; // Icon name from lucide-react
  size?: number;
  color?: string;
}