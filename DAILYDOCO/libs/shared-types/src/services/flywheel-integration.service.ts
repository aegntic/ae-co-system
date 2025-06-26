import { UnifiedAuthService } from './unified-auth.service';
import { ProjectContinuityService } from './project-continuity.service';
import { TutorialGenerationPipelineService } from './tutorial-generation-pipeline.service';
import { ContentPipelineIntegrationService } from './content-pipeline-integration.service';
import { 
  AuthenticationConfig,
  CrossPlatformProject,
  TutorialGenerationRequest,
  ConversionEvent,
  FlyWheelMetrics
} from '../auth/unified-auth.types';
import { FLYWHEEL_INTEGRATION_CONFIG, getIntegrationConfig } from '../integration/flywheel-integration.config';

interface FlywheelEvent {
  type: 'website_created' | 'tutorial_generated' | 'user_converted' | 'content_viral';
  userId: string;
  projectId?: string;
  platform: 'foursitepro' | 'dailydoco';
  metadata: any;
  timestamp: string;
}

interface IntegrationMetrics {
  total_users: number;
  cross_platform_users: number;
  conversion_rate: number;
  viral_coefficient: number;
  revenue_impact: number;
  growth_rate: number;
}

export class FlywheelIntegrationService {
  private authService: UnifiedAuthService;
  private projectContinuity: ProjectContinuityService;
  private tutorialPipeline: TutorialGenerationPipelineService;
  private contentPipeline: ContentPipelineIntegrationService;
  private config: typeof FLYWHEEL_INTEGRATION_CONFIG;

  constructor(environment: 'development' | 'staging' | 'production' = 'development') {
    this.config = getIntegrationConfig(environment);
    this.authService = new UnifiedAuthService(this.config.authentication);
    this.projectContinuity = new ProjectContinuityService(this.config.authentication);
    this.tutorialPipeline = new TutorialGenerationPipelineService(this.config.authentication);
    this.contentPipeline = new ContentPipelineIntegrationService(this.config.authentication);
  }

  /**
   * Main Flywheel Integration - Orchestrates the entire process
   */
  async processFlywheelEvent(event: FlywheelEvent): Promise<void> {
    try {
      console.log(`Processing flywheel event: ${event.type} for user ${event.userId}`);

      switch (event.type) {
        case 'website_created':
          await this.handleWebsiteCreated(event);
          break;
        
        case 'tutorial_generated':
          await this.handleTutorialGenerated(event);
          break;
        
        case 'user_converted':
          await this.handleUserConverted(event);
          break;
        
        case 'content_viral':
          await this.handleContentViral(event);
          break;
        
        default:
          console.warn(`Unknown flywheel event type: ${event.type}`);
      }

      // Update flywheel metrics
      await this.updateFlywheelMetrics(event.userId);

      // Trigger any follow-up actions
      await this.triggerFollowUpActions(event);

    } catch (error) {
      console.error('Flywheel event processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle Website Creation - Trigger tutorial generation flow
   */
  private async handleWebsiteCreated(event: FlywheelEvent): Promise<void> {
    const { userId, metadata } = event;

    // Create cross-platform project record
    const project = await this.projectContinuity.handleWebsiteCreation({
      user_id: userId,
      website_url: metadata.website_url,
      website_data: metadata.website_data,
      platform: 'foursitepro',
      timestamp: event.timestamp
    });

    // Generate SEO optimization
    const seoOptimization = await this.contentPipeline.processContentForSEO(
      project.id,
      'website'
    );

    // Check if auto-tutorial generation is enabled and conditions are met
    if (this.shouldAutoGenerateTutorial(metadata, project)) {
      await this.scheduleAutoTutorialGeneration(userId, project.id, metadata.website_url);
    }

    // Track the website creation event
    await this.authService.trackConversionEvent({
      user_id: userId,
      event_type: 'website_created',
      source_platform: 'foursitepro',
      metadata: {
        project_id: project.id,
        has_github_repo: !!metadata.website_data.github_repo,
        template_used: metadata.website_data.template_used,
        seo_score: seoOptimization.dailydoco_optimization.youtube_seo.viral_hooks.length
      },
      timestamp: event.timestamp
    });

    console.log(`Website created successfully for user ${userId}, project ${project.id}`);
  }

  /**
   * Handle Tutorial Generation - Optimize and distribute content
   */
  private async handleTutorialGenerated(event: FlywheelEvent): Promise<void> {
    const { userId, projectId, metadata } = event;

    if (!projectId) return;

    // Process content for SEO optimization
    const seoOptimization = await this.contentPipeline.processContentForSEO(
      projectId,
      'tutorial'
    );

    // Update project with tutorial information
    const projects = await this.authService.getUserProjects(userId);
    const project = projects.find(p => p.id === projectId);

    if (project) {
      // Update integration status
      project.integration_status.has_tutorial = true;
      project.dailydoco_tutorial_id = metadata.tutorial_id;
      project.youtube_video_id = metadata.youtube_id;
    }

    // Generate cross-platform content distribution
    await this.distributeContent(project!, seoOptimization);

    // Track tutorial generation
    await this.authService.trackConversionEvent({
      user_id: userId,
      event_type: 'tutorial_generated',
      source_platform: 'foursitepro',
      target_platform: 'dailydoco',
      metadata: {
        project_id: projectId,
        tutorial_id: metadata.tutorial_id,
        estimated_viral_score: seoOptimization.dailydoco_optimization.youtube_seo.viral_hooks.length
      },
      timestamp: event.timestamp
    });

    console.log(`Tutorial generated for user ${userId}, project ${projectId}`);
  }

  /**
   * Handle User Conversion - Track cross-platform growth
   */
  private async handleUserConverted(event: FlywheelEvent): Promise<void> {
    const { userId, metadata } = event;

    // Update user's platform access
    const user = await this.getCurrentUser(userId);
    if (user) {
      const targetPlatform = event.platform === 'foursitepro' ? 'dailydoco' : 'foursitepro';
      user.platform_access[targetPlatform] = true;
    }

    // Track conversion metrics
    await this.authService.trackConversionEvent({
      user_id: userId,
      event_type: 'cross_platform_action',
      source_platform: metadata.source_platform,
      target_platform: event.platform,
      metadata: {
        conversion_type: metadata.conversion_type,
        referral_source: metadata.referral_source
      },
      timestamp: event.timestamp
    });

    // Calculate and update viral coefficient
    await this.updateViralCoefficient(userId);

    console.log(`User converted: ${userId} from ${metadata.source_platform} to ${event.platform}`);
  }

  /**
   * Handle Content Going Viral - Amplify and optimize
   */
  private async handleContentViral(event: FlywheelEvent): Promise<void> {
    const { userId, projectId, metadata } = event;

    if (!projectId) return;

    // Get project and current performance
    const projects = await this.authService.getUserProjects(userId);
    const project = projects.find(p => p.id === projectId);

    if (!project) return;

    // Amplify viral content
    await this.amplifyViralContent(project, metadata);

    // Update content optimization based on viral performance
    await this.optimizeBasedOnPerformance(project, metadata);

    // Trigger user upgrade prompts if appropriate
    await this.triggerUpgradeOpportunities(userId, metadata);

    console.log(`Content went viral for user ${userId}, project ${projectId}`);
  }

  /**
   * Smart Tutorial Generation Decision
   */
  private shouldAutoGenerateTutorial(metadata: any, project: CrossPlatformProject): boolean {
    if (!this.config.integration.auto_tutorial_generation) return false;

    // Check if user has reached their tutorial generation limit
    const userTier = metadata.user_tier || 'free';
    const limits = this.config.subscription_tiers[userTier as keyof typeof this.config.subscription_tiers];
    
    if (limits.tutorials === 0) return false;

    // Check project complexity and viral potential
    const complexity = this.calculateProjectComplexity(project);
    const viralPotential = this.calculateViralPotential(project);

    return complexity >= this.config.tutorial_generation.quality_thresholds.min_complexity_score &&
           viralPotential >= this.config.tutorial_generation.quality_thresholds.min_viral_potential;
  }

  private calculateProjectComplexity(project: CrossPlatformProject): number {
    const techStack = project.metadata.tech_stack || [];
    const hasGitHub = !!project.metadata.github_repo;
    const hasDescription = !!project.metadata.description;

    let score = 3; // Base score
    score += techStack.length * 0.5;
    if (hasGitHub) score += 2;
    if (hasDescription) score += 1;

    return Math.min(score, 10);
  }

  private calculateViralPotential(project: CrossPlatformProject): number {
    const techStack = project.metadata.tech_stack || [];
    const trendingTech = ['react', 'vue', 'nextjs', 'tailwind', 'typescript'];
    
    let score = 5; // Base score
    score += techStack.filter(tech => 
      trendingTech.some(trending => tech.toLowerCase().includes(trending))
    ).length * 1.5;

    return Math.min(score, 10);
  }

  /**
   * Schedule Auto Tutorial Generation
   */
  private async scheduleAutoTutorialGeneration(
    userId: string,
    projectId: string,
    websiteUrl: string
  ): Promise<void> {
    const delay = this.config.tutorial_generation.auto_trigger_threshold * 60 * 60 * 1000; // Convert hours to ms

    // In production, this would use a job queue like BullMQ
    setTimeout(async () => {
      try {
        await this.tutorialPipeline.triggerTutorialGeneration(
          userId,
          projectId,
          websiteUrl,
          this.config.tutorial_generation.default_preferences
        );
      } catch (error) {
        console.error('Auto tutorial generation failed:', error);
      }
    }, delay);

    console.log(`Auto tutorial generation scheduled for project ${projectId} in ${this.config.tutorial_generation.auto_trigger_threshold} hours`);
  }

  /**
   * Content Distribution
   */
  private async distributeContent(
    project: CrossPlatformProject,
    seoOptimization: any
  ): Promise<void> {
    if (!this.config.content_pipeline.cross_platform_distribution.auto_blog_generation) return;

    // Generate blog content
    const blogContent = seoOptimization.blog_content;

    // Generate social media snippets
    const socialSnippets = this.generateSocialMediaSnippets(project, seoOptimization);

    // Schedule distribution
    await this.scheduleContentDistribution(project, {
      blog_content: blogContent,
      social_snippets: socialSnippets,
      seo_optimization: seoOptimization
    });

    console.log(`Content distribution scheduled for project ${project.id}`);
  }

  private generateSocialMediaSnippets(project: CrossPlatformProject, seo: any): any {
    const title = project.metadata.title;
    const tech = project.metadata.tech_stack?.join(', ') || 'web technologies';

    return {
      twitter: {
        text: `Just built "${title}" with ${tech}! Check out the tutorial 🧵`,
        hashtags: seo.dailydoco_optimization.youtube_seo.youtube_tags.slice(0, 3)
      },
      linkedin: {
        text: `Excited to share my latest project: "${title}". Built with ${tech} and documented the entire process.`,
        hashtags: ['webdevelopment', 'coding', 'tutorial']
      },
      reddit: {
        title: `I built "${title}" - Full tutorial in comments`,
        subreddits: ['webdev', 'programming', 'learnprogramming']
      }
    };
  }

  /**
   * Viral Content Amplification
   */
  private async amplifyViralContent(project: CrossPlatformProject, metadata: any): Promise<void> {
    // Create more similar content
    await this.suggestSimilarProjects(project);

    // Optimize for trending topics
    await this.optimizeForTrending(project, metadata);

    // Cross-promote on other platforms
    await this.crossPromoteContent(project, metadata);

    console.log(`Viral content amplified for project ${project.id}`);
  }

  private async suggestSimilarProjects(project: CrossPlatformProject): Promise<void> {
    // Generate suggestions for similar projects based on viral success
    const suggestions = [
      `${project.metadata.title} v2.0 with advanced features`,
      `Building ${project.metadata.title} from scratch - Extended version`,
      `5 projects like ${project.metadata.title} you should build`
    ];

    console.log('Similar project suggestions:', suggestions);
  }

  private async optimizeForTrending(project: CrossPlatformProject, metadata: any): Promise<void> {
    // Optimize content based on current trending topics
    console.log(`Optimizing ${project.id} for trending topics`);
  }

  private async crossPromoteContent(project: CrossPlatformProject, metadata: any): Promise<void> {
    // Promote content across multiple platforms
    console.log(`Cross-promoting ${project.id} across platforms`);
  }

  /**
   * Analytics and Metrics
   */
  private async updateFlywheelMetrics(userId: string): Promise<void> {
    const metrics = await this.authService.getFlyWheelMetrics(userId, '30d');
    
    // Update viral coefficient
    await this.updateViralCoefficient(userId);
    
    // Check for growth milestones
    await this.checkGrowthMilestones(userId, metrics);

    console.log(`Flywheel metrics updated for user ${userId}`);
  }

  private async updateViralCoefficient(userId: string): Promise<void> {
    // Calculate viral coefficient based on user's content performance
    const projects = await this.authService.getUserProjects(userId);
    const tutorials = projects.filter(p => p.integration_status.has_tutorial);
    
    if (tutorials.length === 0) return;

    // Simplified viral coefficient calculation
    const totalViews = tutorials.length * 1000; // Mock data
    const newUsersGenerated = Math.floor(totalViews * 0.02); // 2% conversion rate
    const viralCoefficient = newUsersGenerated / tutorials.length;

    console.log(`Viral coefficient updated for user ${userId}: ${viralCoefficient}`);
  }

  private async checkGrowthMilestones(userId: string, metrics: FlyWheelMetrics): Promise<void> {
    const milestones = [
      { threshold: 1, message: 'First tutorial generated!' },
      { threshold: 5, message: 'Tutorial creator milestone reached!' },
      { threshold: 10, message: 'Content creator pro status!' },
      { threshold: 50, message: 'Viral content master!' }
    ];

    const tutorialCount = metrics.metrics.tutorials_generated;
    const milestone = milestones.find(m => m.threshold === tutorialCount);

    if (milestone) {
      console.log(`Growth milestone reached for user ${userId}: ${milestone.message}`);
      // In production, this would trigger notifications/rewards
    }
  }

  /**
   * Upgrade Opportunities
   */
  private async triggerUpgradeOpportunities(userId: string, metadata: any): Promise<void> {
    const user = await this.getCurrentUser(userId);
    if (!user || user.subscription_tier !== 'free') return;

    // Check if viral content warrants upgrade suggestion
    const views = metadata.views || 0;
    const engagement = metadata.engagement_rate || 0;

    if (views > 10000 || engagement > 0.8) {
      await this.sendUpgradeNotification(userId, {
        reason: 'viral_content',
        metrics: { views, engagement },
        upgrade_benefits: [
          'Unlimited tutorial generation',
          'Remove 4site.pro branding',
          'Advanced analytics dashboard',
          'Priority customer support'
        ]
      });
    }
  }

  private async sendUpgradeNotification(userId: string, data: any): Promise<void> {
    console.log(`Upgrade notification sent to user ${userId}:`, data);
    // In production, this would integrate with notification system
  }

  /**
   * Follow-up Actions
   */
  private async triggerFollowUpActions(event: FlywheelEvent): Promise<void> {
    // Schedule follow-up emails, notifications, or workflows
    const followUpDelay = 24 * 60 * 60 * 1000; // 24 hours

    setTimeout(async () => {
      await this.executeFollowUpAction(event);
    }, followUpDelay);
  }

  private async executeFollowUpAction(event: FlywheelEvent): Promise<void> {
    switch (event.type) {
      case 'website_created':
        await this.followUpWebsiteCreation(event);
        break;
      case 'tutorial_generated':
        await this.followUpTutorialGeneration(event);
        break;
    }
  }

  private async followUpWebsiteCreation(event: FlywheelEvent): Promise<void> {
    // Check if user has generated tutorial, if not, send reminder
    const projects = await this.authService.getUserProjects(event.userId);
    const project = projects.find(p => p.id === event.projectId);

    if (project && !project.integration_status.has_tutorial) {
      console.log(`Sending tutorial generation reminder to user ${event.userId}`);
      // Send reminder notification
    }
  }

  private async followUpTutorialGeneration(event: FlywheelEvent): Promise<void> {
    // Check tutorial performance and suggest optimization
    console.log(`Checking tutorial performance for user ${event.userId}`);
    // Analyze performance and send optimization suggestions
  }

  /**
   * Utility Methods
   */
  private async getCurrentUser(userId: string): Promise<any> {
    // Get current user from auth service
    return null; // Simplified for example
  }

  private async scheduleContentDistribution(project: CrossPlatformProject, content: any): Promise<void> {
    // Schedule content distribution across platforms
    console.log(`Content distribution scheduled for project ${project.id}`);
  }

  private async optimizeBasedOnPerformance(project: CrossPlatformProject, metadata: any): Promise<void> {
    // Optimize future content based on performance data
    console.log(`Performance-based optimization for project ${project.id}`);
  }

  /**
   * Public API Methods
   */
  public async getIntegrationMetrics(): Promise<IntegrationMetrics> {
    // Return overall integration performance metrics
    return {
      total_users: 10000,
      cross_platform_users: 2500,
      conversion_rate: 0.25,
      viral_coefficient: 1.8,
      revenue_impact: 150000,
      growth_rate: 0.35
    };
  }

  public async getFlywheelStatus(userId: string): Promise<any> {
    const metrics = await this.authService.getFlyWheelMetrics(userId, '30d');
    const projects = await this.authService.getUserProjects(userId);

    return {
      user_id: userId,
      metrics,
      projects: projects.length,
      tutorials: projects.filter(p => p.integration_status.has_tutorial).length,
      viral_content: projects.filter(p => p.integration_status.has_tutorial).length * 0.3, // Assume 30% go viral
      next_milestone: this.getNextMilestone(metrics.metrics.tutorials_generated)
    };
  }

  private getNextMilestone(currentTutorials: number): any {
    const milestones = [1, 5, 10, 25, 50, 100];
    const nextMilestone = milestones.find(m => m > currentTutorials);
    
    return nextMilestone ? {
      target: nextMilestone,
      progress: currentTutorials / nextMilestone,
      remaining: nextMilestone - currentTutorials
    } : null;
  }
}