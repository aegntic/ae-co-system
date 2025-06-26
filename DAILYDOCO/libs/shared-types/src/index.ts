// Core Types for DailyDoco Pro
export * from './core/project.types';
export * from './core/capture.types';
export * from './core/video.types';
export * from './core/ai.types';
export * from './core/user.types';
export * from './core/performance.types';

// Feature-specific Types
export * from './features/test-audience.types';
export * from './features/personal-brand.types';
export * from './features/human-fingerprint.types';
export * from './features/modular-ai.types';

// Platform Types
export * from './platforms/desktop.types';
export * from './platforms/browser.types';
export * from './platforms/mcp.types';

// Configuration Types
export * from './config/settings.types';
export * from './config/privacy.types';
export * from './config/performance.types';

// 4site.pro ↔ DailyDoco Pro Integration - Exponential Growth Flywheel
// Cross-Platform Integration System

// Core Integration Types
export * from './auth/unified-auth.types';

// Authentication & User Management
export { UnifiedAuthService } from './services/unified-auth.service';
export { useUnifiedAuth, UnifiedAuthProvider, withUnifiedAuth, useCrossPlatformNavigation } from './hooks/useUnifiedAuth';

// Project Continuity & Metadata
export { ProjectContinuityService } from './services/project-continuity.service';

// Tutorial Generation Pipeline
export { TutorialGenerationPipelineService } from './services/tutorial-generation-pipeline.service';

// Content Pipeline & SEO
export { ContentPipelineIntegrationService } from './services/content-pipeline-integration.service';

// Main Integration Orchestrator
export { FlywheelIntegrationService } from './services/flywheel-integration.service';

// UI Components
export { CrossPlatformCTA, SmartCTAController, useConversionTracking, useCTAOptimization } from './components/CrossPlatformCTAs';
export { FlywheelAnalyticsDashboard } from './components/FlywheelAnalyticsDashboard';

// Configuration
export { 
  FLYWHEEL_INTEGRATION_CONFIG, 
  getIntegrationConfig, 
  getAuthConfig, 
  getIntegrationSettings,
  getPlatformLimits,
  getRateLimit,
  validateConfiguration
} from './integration/flywheel-integration.config';

// Core exports for easy import
export const IntegrationCore = {
  UnifiedAuthService,
  ProjectContinuityService,
  TutorialGenerationPipelineService,
  ContentPipelineIntegrationService,
  FlywheelIntegrationService
};

export const IntegrationHooks = {
  useUnifiedAuth,
  useCrossPlatformNavigation,
  useConversionTracking,
  useCTAOptimization
};

export const IntegrationComponents = {
  UnifiedAuthProvider,
  CrossPlatformCTA,
  SmartCTAController,
  FlywheelAnalyticsDashboard,
  withUnifiedAuth
};

export const IntegrationConfig = {
  FLYWHEEL_INTEGRATION_CONFIG,
  getIntegrationConfig,
  getAuthConfig,
  getIntegrationSettings,
  getPlatformLimits,
  getRateLimit,
  validateConfiguration
};

// Utility Types for Easy Integration
export interface FlyWheelSetupConfig {
  environment: 'development' | 'staging' | 'production';
  platform: 'foursitepro' | 'dailydoco';
  features?: {
    autoTutorialGeneration?: boolean;
    crossPlatformSSO?: boolean;
    analyticsTracking?: boolean;
    viralOptimization?: boolean;
  };
}

// Quick Setup Function
export const setupFlywheelIntegration = (config: FlyWheelSetupConfig) => {
  // Validate configuration
  validateConfiguration();
  
  // Get environment-specific config
  const integrationConfig = getIntegrationConfig(config.environment);
  
  // Initialize services
  const flywheel = new FlywheelIntegrationService(config.environment);
  
  return {
    flywheel,
    config: integrationConfig,
    platform: config.platform
  };
};

// Version and metadata
export const INTEGRATION_VERSION = '1.0.0';
export const SUPPORTED_PLATFORMS = ['foursitepro', 'dailydoco'] as const;
export const INTEGRATION_FEATURES = [
  'unified-sso',
  'project-continuity',
  'auto-tutorial-generation',
  'cross-platform-ctas',
  'flywheel-analytics',
  'content-seo-optimization',
  'viral-growth-tracking'
] as const;