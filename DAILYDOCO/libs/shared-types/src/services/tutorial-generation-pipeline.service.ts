import { UnifiedAuthService } from './unified-auth.service';
import { ProjectContinuityService } from './project-continuity.service';
import { 
  TutorialGenerationRequest,
  CrossPlatformProject,
  AuthenticationConfig,
  ConversionEvent 
} from '../auth/unified-auth.types';

interface TutorialTemplate {
  id: string;
  name: string;
  description: string;
  target_audience: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // minutes
  sections: TutorialSection[];
  required_tech_stack: string[];
  complexity_score_range: [number, number];
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  section_type: 'intro' | 'setup' | 'coding' | 'deployment' | 'testing' | 'conclusion';
  capture_requirements: {
    screen_recording: boolean;
    voice_narration: boolean;
    code_highlighting: boolean;
    terminal_capture: boolean;
  };
  ai_narration_prompts: string[];
}

interface TutorialGenerationJob {
  id: string;
  user_id: string;
  project_id: string;
  request: TutorialGenerationRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    current_section: number;
    total_sections: number;
    percentage: number;
    current_task: string;
  };
  template_used: string;
  processing_metadata: {
    started_at: string;
    estimated_completion: string;
    processing_node: string;
    capture_session_id?: string;
  };
  output: {
    video_url?: string;
    youtube_id?: string;
    tutorial_metadata: any;
    generated_assets: string[];
  };
  created_at: string;
  updated_at: string;
}

interface TutorialPrompt {
  website_url: string;
  project_metadata: any;
  user_preferences: any;
  viral_hooks: string[];
  seo_keywords: string[];
  conversion_ctas: string[];
}

export class TutorialGenerationPipelineService {
  private authService: UnifiedAuthService;
  private projectContinuity: ProjectContinuityService;
  private tutorialTemplates: Map<string, TutorialTemplate>;

  constructor(config: AuthenticationConfig) {
    this.authService = new UnifiedAuthService(config);
    this.projectContinuity = new ProjectContinuityService(config);
    this.tutorialTemplates = new Map();
    this.initializeTutorialTemplates();
  }

  /**
   * Main Tutorial Generation Pipeline
   */
  async triggerTutorialGeneration(
    userId: string,
    projectId: string,
    websiteUrl: string,
    preferences?: Partial<TutorialGenerationRequest['tutorial_preferences']>
  ): Promise<string> {
    try {
      // Get project metadata
      const projects = await this.authService.getUserProjects(userId);
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }

      // Generate comprehensive tutorial request
      const tutorialRequest = await this.buildTutorialRequest(
        userId,
        project,
        websiteUrl,
        preferences
      );

      // Select optimal tutorial template
      const template = this.selectTutorialTemplate(project, tutorialRequest);

      // Create tutorial generation job
      const job = await this.createTutorialJob(tutorialRequest, template);

      // Enqueue for processing
      await this.enqueueTutorialGeneration(job);

      // Send user notification
      await this.notifyUserTutorialStarted(userId, job);

      // Track conversion event
      await this.authService.trackConversionEvent({
        user_id: userId,
        event_type: 'tutorial_generated',
        source_platform: 'foursitepro',
        target_platform: 'dailydoco',
        metadata: {
          project_id: projectId,
          template_used: template.id,
          estimated_duration: template.estimated_duration
        },
        timestamp: new Date().toISOString()
      });

      return job.id;
    } catch (error) {
      console.error('Tutorial generation failed:', error);
      throw error;
    }
  }

  /**
   * Smart Tutorial Prompt Generation
   */
  async generateTutorialPrompt(
    project: CrossPlatformProject,
    websiteUrl: string,
    userPreferences: any
  ): Promise<TutorialPrompt> {
    // Analyze website for tutorial content
    const websiteAnalysis = await this.analyzeWebsiteForTutorial(websiteUrl);
    
    // Generate viral hooks based on project type
    const viralHooks = this.generateViralHooks(project, websiteAnalysis);
    
    // SEO keyword optimization
    const seoKeywords = this.generateSEOKeywords(project, websiteAnalysis);
    
    // Conversion CTAs for cross-platform growth
    const conversionCtas = this.generateConversionCTAs(project);

    return {
      website_url: websiteUrl,
      project_metadata: project.metadata,
      user_preferences: userPreferences,
      viral_hooks: viralHooks,
      seo_keywords: seoKeywords,
      conversion_ctas: conversionCtas
    };
  }

  /**
   * Automated Video Processing
   */
  async processTutorialVideo(jobId: string): Promise<void> {
    const job = await this.getTutorialJob(jobId);
    if (!job) throw new Error('Job not found');

    try {
      await this.updateJobStatus(jobId, 'processing');

      // Phase 1: Capture Setup
      await this.setupCaptureEnvironment(job);

      // Phase 2: Automated Recording
      await this.recordTutorialSections(job);

      // Phase 3: AI Enhancement
      await this.enhanceWithAI(job);

      // Phase 4: Post-processing
      await this.postProcessVideo(job);

      // Phase 5: Upload & Distribution
      await this.uploadAndDistribute(job);

      await this.updateJobStatus(jobId, 'completed');
      await this.notifyUserTutorialCompleted(job.user_id, job);

    } catch (error) {
      console.error('Video processing failed:', error);
      await this.updateJobStatus(jobId, 'failed');
      throw error;
    }
  }

  /**
   * One-Click Tutorial Generation from 4site.pro
   */
  async generateFromWebsiteCreation(
    userId: string,
    websiteData: {
      url: string;
      title: string;
      description: string;
      template_used: string;
      github_repo?: string;
    }
  ): Promise<{ projectId: string; tutorialJobId: string }> {
    // Create cross-platform project automatically
    const project = await this.authService.shareProjectCrossPlatform(userId, {
      platform_origin: 'foursitepro',
      project_type: 'website',
      metadata: {
        title: websiteData.title,
        description: websiteData.description,
        tags: ['website', 'tutorial', websiteData.template_used],
        tech_stack: ['html', 'css', 'javascript'],
        deployment_url: websiteData.url,
        github_repo: websiteData.github_repo
      },
      integration_status: {
        has_tutorial: false,
        has_documentation: false,
        cross_platform_shared: true
      }
    });

    // Auto-generate tutorial with smart defaults
    const tutorialJobId = await this.triggerTutorialGeneration(
      userId,
      project.id,
      websiteData.url,
      {
        length: 'medium',
        complexity: 'beginner',
        include_code_walkthrough: !!websiteData.github_repo,
        include_deployment: true,
        narration_style: 'educational'
      }
    );

    return {
      projectId: project.id,
      tutorialJobId
    };
  }

  /**
   * Tutorial Template Management
   */
  private initializeTutorialTemplates(): void {
    // React Website Tutorial Template
    this.tutorialTemplates.set('react-website', {
      id: 'react-website',
      name: 'React Website Tutorial',
      description: 'Complete React website development walkthrough',
      target_audience: 'intermediate',
      estimated_duration: 25,
      required_tech_stack: ['react', 'javascript'],
      complexity_score_range: [4, 8],
      sections: [
        {
          id: 'intro',
          title: 'Project Introduction',
          description: 'Overview of what we\'ll build',
          estimated_duration: 3,
          section_type: 'intro',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: false,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Introduce the project and its goals',
            'Explain the tech stack we\'ll use',
            'Show the final result preview'
          ]
        },
        {
          id: 'setup',
          title: 'Development Setup',
          description: 'Setting up the development environment',
          estimated_duration: 5,
          section_type: 'setup',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: false,
            terminal_capture: true
          },
          ai_narration_prompts: [
            'Explain the setup process step by step',
            'Show terminal commands and their purpose',
            'Verify the setup is working correctly'
          ]
        },
        {
          id: 'coding',
          title: 'Building the Application',
          description: 'Main development process',
          estimated_duration: 15,
          section_type: 'coding',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: true,
            terminal_capture: true
          },
          ai_narration_prompts: [
            'Explain the code structure and organization',
            'Walk through key components and features',
            'Demonstrate best practices and patterns'
          ]
        },
        {
          id: 'deployment',
          title: 'Deployment Process',
          description: 'Deploying the application live',
          estimated_duration: 7,
          section_type: 'deployment',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: false,
            terminal_capture: true
          },
          ai_narration_prompts: [
            'Show the deployment process step by step',
            'Explain hosting options and configurations',
            'Verify the live deployment works correctly'
          ]
        }
      ]
    });

    // Add more templates...
    this.addStaticWebsiteTemplate();
    this.addFullStackTemplate();
    this.addMobileAppTemplate();
  }

  private addStaticWebsiteTemplate(): void {
    this.tutorialTemplates.set('static-website', {
      id: 'static-website',
      name: 'Static Website Tutorial',
      description: 'HTML/CSS/JS website development',
      target_audience: 'beginner',
      estimated_duration: 15,
      required_tech_stack: ['html', 'css', 'javascript'],
      complexity_score_range: [1, 4],
      sections: [
        {
          id: 'intro',
          title: 'Website Overview',
          description: 'What we\'ll build together',
          estimated_duration: 2,
          section_type: 'intro',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: false,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Welcome viewers and introduce the project',
            'Show the final website we\'ll create',
            'Explain what viewers will learn'
          ]
        },
        {
          id: 'html-structure',
          title: 'HTML Structure',
          description: 'Building the foundation',
          estimated_duration: 5,
          section_type: 'coding',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: true,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Explain HTML structure and semantic elements',
            'Build the page layout step by step',
            'Show best practices for HTML organization'
          ]
        },
        {
          id: 'styling',
          title: 'CSS Styling',
          description: 'Making it look professional',
          estimated_duration: 6,
          section_type: 'coding',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: true,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Add CSS styles for layout and design',
            'Explain responsive design principles',
            'Show modern CSS techniques'
          ]
        },
        {
          id: 'interactivity',
          title: 'Adding JavaScript',
          description: 'Interactive features',
          estimated_duration: 4,
          section_type: 'coding',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: true,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Add interactive elements with JavaScript',
            'Explain event handling and DOM manipulation',
            'Test the interactive features'
          ]
        }
      ]
    });
  }

  private addFullStackTemplate(): void {
    this.tutorialTemplates.set('fullstack-app', {
      id: 'fullstack-app',
      name: 'Full-Stack Application',
      description: 'Complete frontend and backend development',
      target_audience: 'advanced',
      estimated_duration: 45,
      required_tech_stack: ['node', 'express', 'database'],
      complexity_score_range: [7, 10],
      sections: [
        // More comprehensive sections for full-stack apps
        {
          id: 'architecture',
          title: 'System Architecture',
          description: 'Planning the full-stack application',
          estimated_duration: 5,
          section_type: 'intro',
          capture_requirements: {
            screen_recording: true,
            voice_narration: true,
            code_highlighting: false,
            terminal_capture: false
          },
          ai_narration_prompts: [
            'Explain the overall system architecture',
            'Show the database design and API structure',
            'Discuss technology choices and trade-offs'
          ]
        }
        // Additional sections would be added here...
      ]
    });
  }

  private addMobileAppTemplate(): void {
    this.tutorialTemplates.set('mobile-app', {
      id: 'mobile-app',
      name: 'Mobile App Development',
      description: 'React Native or Flutter app tutorial',
      target_audience: 'intermediate',
      estimated_duration: 35,
      required_tech_stack: ['react-native', 'flutter', 'mobile'],
      complexity_score_range: [5, 9],
      sections: [
        // Mobile-specific tutorial sections
      ]
    });
  }

  /**
   * Helper Methods
   */
  private async buildTutorialRequest(
    userId: string,
    project: CrossPlatformProject,
    websiteUrl: string,
    preferences?: Partial<TutorialGenerationRequest['tutorial_preferences']>
  ): Promise<TutorialGenerationRequest> {
    const defaultPreferences = {
      length: 'medium' as const,
      complexity: 'intermediate' as const,
      include_code_walkthrough: true,
      include_deployment: true,
      narration_style: 'technical' as const
    };

    return {
      user_id: userId,
      project_id: project.id,
      website_url: websiteUrl,
      project_metadata: {
        title: project.metadata.title || 'Untitled Project',
        description: project.metadata.description || '',
        tech_stack: project.metadata.tech_stack || [],
        features: [], // Would be extracted from project analysis
        github_repo: project.metadata.github_repo
      },
      tutorial_preferences: {
        ...defaultPreferences,
        ...preferences
      }
    };
  }

  private selectTutorialTemplate(
    project: CrossPlatformProject,
    request: TutorialGenerationRequest
  ): TutorialTemplate {
    const techStack = project.metadata.tech_stack || [];
    
    // React-based projects
    if (techStack.includes('react')) {
      return this.tutorialTemplates.get('react-website')!;
    }
    
    // Full-stack projects
    if (techStack.includes('node') || techStack.includes('express')) {
      return this.tutorialTemplates.get('fullstack-app')!;
    }
    
    // Mobile projects
    if (techStack.includes('react-native') || techStack.includes('flutter')) {
      return this.tutorialTemplates.get('mobile-app')!;
    }
    
    // Default to static website template
    return this.tutorialTemplates.get('static-website')!;
  }

  private async createTutorialJob(
    request: TutorialGenerationRequest,
    template: TutorialTemplate
  ): Promise<TutorialGenerationJob> {
    const job: TutorialGenerationJob = {
      id: this.generateJobId(),
      user_id: request.user_id,
      project_id: request.project_id,
      request,
      status: 'queued',
      progress: {
        current_section: 0,
        total_sections: template.sections.length,
        percentage: 0,
        current_task: 'Initializing tutorial generation'
      },
      template_used: template.id,
      processing_metadata: {
        started_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + template.estimated_duration * 60 * 1000).toISOString(),
        processing_node: 'auto-assigned'
      },
      output: {
        tutorial_metadata: {},
        generated_assets: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store job in database (would use Supabase or Redis)
    console.log('Tutorial job created:', job.id);
    
    return job;
  }

  private async analyzeWebsiteForTutorial(websiteUrl: string): Promise<any> {
    // Analyze website structure, complexity, features for tutorial content
    return {
      has_forms: false,
      has_animations: false,
      has_api_integration: false,
      responsive_design: true,
      complexity_score: 5,
      estimated_tutorial_length: 20
    };
  }

  private generateViralHooks(project: CrossPlatformProject, analysis: any): string[] {
    const hooks = [
      `Build ${project.metadata.title} in under 30 minutes!`,
      `This ${project.metadata.tech_stack?.join('/')} project will blow your mind`,
      `From zero to deployed: Complete ${project.metadata.title} tutorial`
    ];

    return hooks;
  }

  private generateSEOKeywords(project: CrossPlatformProject, analysis: any): string[] {
    const keywords = [
      ...project.metadata.tech_stack || [],
      'tutorial',
      'web development',
      'coding',
      project.metadata.title?.split(' ') || []
    ].flat();

    return [...new Set(keywords)];
  }

  private generateConversionCTAs(project: CrossPlatformProject): string[] {
    return [
      'Create your own website with 4site.pro',
      'Want to build something similar? Start with 4site.pro',
      'Generate your website in 60 seconds',
      'Document your projects with DailyDoco Pro'
    ];
  }

  private generateJobId(): string {
    return 'tut_' + Math.random().toString(36).substring(2, 15);
  }

  private async getTutorialJob(jobId: string): Promise<TutorialGenerationJob | null> {
    // Retrieve from database
    return null;
  }

  private async updateJobStatus(jobId: string, status: TutorialGenerationJob['status']): Promise<void> {
    console.log(`Job ${jobId} status updated to: ${status}`);
  }

  private async enqueueTutorialGeneration(job: TutorialGenerationJob): Promise<void> {
    // Add to processing queue (Redis/BullMQ)
    console.log('Tutorial generation enqueued:', job.id);
  }

  private async notifyUserTutorialStarted(userId: string, job: TutorialGenerationJob): Promise<void> {
    // Send notification to user
    console.log(`Tutorial generation started for user ${userId}: ${job.id}`);
  }

  private async notifyUserTutorialCompleted(userId: string, job: TutorialGenerationJob): Promise<void> {
    // Send completion notification with links
    console.log(`Tutorial completed for user ${userId}: ${job.output.video_url}`);
  }

  // Video processing methods (simplified)
  private async setupCaptureEnvironment(job: TutorialGenerationJob): Promise<void> {
    console.log('Setting up capture environment for:', job.id);
  }

  private async recordTutorialSections(job: TutorialGenerationJob): Promise<void> {
    console.log('Recording tutorial sections for:', job.id);
  }

  private async enhanceWithAI(job: TutorialGenerationJob): Promise<void> {
    console.log('AI enhancement for:', job.id);
  }

  private async postProcessVideo(job: TutorialGenerationJob): Promise<void> {
    console.log('Post-processing video for:', job.id);
  }

  private async uploadAndDistribute(job: TutorialGenerationJob): Promise<void> {
    console.log('Uploading and distributing:', job.id);
  }
}