import { UnifiedAuthService } from './unified-auth.service';
import { 
  CrossPlatformProject, 
  UnifiedUser,
  AuthenticationConfig 
} from '../auth/unified-auth.types';

interface ProjectMetadataExtractor {
  extractFromGitHub(repoUrl: string): Promise<ProjectMetadata>;
  extractFromPackageJson(packageJson: any): Promise<ProjectMetadata>;
  extractFromWebsite(websiteUrl: string): Promise<ProjectMetadata>;
  extractFromCode(codeContent: string, filename: string): Promise<ProjectMetadata>;
}

interface ProjectMetadata {
  title: string;
  description: string;
  tags: string[];
  tech_stack: string[];
  github_repo?: string;
  domain?: string;
  deployment_url?: string;
  features: string[];
  complexity_score: number;
  estimated_tutorial_length: 'short' | 'medium' | 'long';
}

interface WebsiteCreationEvent {
  user_id: string;
  website_url: string;
  website_data: {
    title: string;
    description: string;
    template_used: string;
    customizations: any;
    github_repo?: string;
  };
  platform: 'foursitepro';
  timestamp: string;
}

interface DailyDocoSession {
  user_id: string;
  session_type: 'coding' | 'deployment' | 'testing' | 'documentation';
  project_detected: boolean;
  project_metadata?: ProjectMetadata;
  potential_tutorial_moments: TutorialMoment[];
  session_duration: number;
  platform: 'dailydoco';
  timestamp: string;
}

interface TutorialMoment {
  timestamp: number;
  moment_type: 'bug_fix' | 'feature_implementation' | 'deployment' | 'explanation';
  confidence_score: number;
  description: string;
  code_context?: string;
}

export class ProjectContinuityService {
  private authService: UnifiedAuthService;
  private metadataExtractor: ProjectMetadataExtractor;

  constructor(config: AuthenticationConfig) {
    this.authService = new UnifiedAuthService(config);
    this.metadataExtractor = new ProjectMetadataExtractorImpl();
  }

  /**
   * Automatic Project Detection from 4site.pro
   */
  async handleWebsiteCreation(event: WebsiteCreationEvent): Promise<CrossPlatformProject> {
    try {
      // Extract comprehensive metadata from the created website
      const metadata = await this.extractWebsiteMetadata(event);
      
      // Create cross-platform project record
      const project = await this.authService.shareProjectCrossPlatform(event.user_id, {
        platform_origin: 'foursitepro',
        project_type: 'website',
        metadata: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          tech_stack: metadata.tech_stack,
          github_repo: metadata.github_repo,
          domain: metadata.domain,
          deployment_url: event.website_url
        },
        integration_status: {
          has_tutorial: false,
          has_documentation: false,
          cross_platform_shared: true
        }
      });

      // Trigger tutorial generation suggestion
      await this.suggestTutorialGeneration(project, metadata);

      // Track the creation event
      await this.authService.trackConversionEvent({
        user_id: event.user_id,
        event_type: 'website_created',
        source_platform: 'foursitepro',
        metadata: {
          project_id: project.id,
          template_used: event.website_data.template_used,
          has_github_repo: !!metadata.github_repo
        },
        timestamp: event.timestamp
      });

      return project;
    } catch (error) {
      console.error('Failed to handle website creation:', error);
      throw error;
    }
  }

  /**
   * Automatic Project Detection from DailyDoco Capture Sessions
   */
  async handleDailyDocoSession(session: DailyDocoSession): Promise<CrossPlatformProject | null> {
    if (!session.project_detected || !session.project_metadata) {
      return null;
    }

    try {
      // Check if this project already exists
      const existingProjects = await this.authService.getUserProjects(session.user_id);
      const matchingProject = this.findMatchingProject(existingProjects, session.project_metadata);

      if (matchingProject) {
        // Update existing project with new session data
        return await this.updateProjectWithSession(matchingProject, session);
      } else {
        // Create new project from DailyDoco session
        const project = await this.authService.shareProjectCrossPlatform(session.user_id, {
          platform_origin: 'dailydoco',
          project_type: 'documentation',
          metadata: {
            title: session.project_metadata.title,
            description: session.project_metadata.description,
            tags: session.project_metadata.tags,
            tech_stack: session.project_metadata.tech_stack,
            github_repo: session.project_metadata.github_repo
          },
          integration_status: {
            has_tutorial: session.potential_tutorial_moments.length > 0,
            has_documentation: true,
            cross_platform_shared: true
          }
        });

        // Suggest creating a 4site.pro website for this project
        await this.suggestWebsiteCreation(project, session.project_metadata);

        return project;
      }
    } catch (error) {
      console.error('Failed to handle DailyDoco session:', error);
      return null;
    }
  }

  /**
   * Smart Project Correlation
   */
  private findMatchingProject(projects: CrossPlatformProject[], metadata: ProjectMetadata): CrossPlatformProject | null {
    return projects.find(project => {
      // Exact title match
      if (project.metadata.title === metadata.title) return true;
      
      // GitHub repo match
      if (project.metadata.github_repo && metadata.github_repo) {
        return project.metadata.github_repo === metadata.github_repo;
      }
      
      // Tech stack similarity (>70% overlap)
      const overlap = this.calculateTechStackOverlap(
        project.metadata.tech_stack || [],
        metadata.tech_stack || []
      );
      
      return overlap > 0.7;
    }) || null;
  }

  private calculateTechStackOverlap(stack1: string[], stack2: string[]): number {
    if (stack1.length === 0 && stack2.length === 0) return 1;
    if (stack1.length === 0 || stack2.length === 0) return 0;
    
    const set1 = new Set(stack1.map(s => s.toLowerCase()));
    const set2 = new Set(stack2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Tutorial Generation Suggestions
   */
  private async suggestTutorialGeneration(project: CrossPlatformProject, metadata: ProjectMetadata): Promise<void> {
    // Only suggest if project seems suitable for tutorials
    if (metadata.complexity_score < 3 || !metadata.tech_stack.length) {
      return;
    }

    // Create suggestion notification (would integrate with notification system)
    const suggestion = {
      user_id: project.user_id,
      project_id: project.id,
      suggestion_type: 'tutorial_generation',
      title: `Create a tutorial for "${metadata.title}"`,
      description: `Your ${metadata.tech_stack.join(', ')} project would make a great tutorial! Generate an automated video walkthrough.`,
      cta_text: 'Generate Tutorial',
      cta_url: `/dailydoco/generate-tutorial/${project.id}`,
      priority: this.calculateSuggestionPriority(metadata),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Store suggestion (would use notification service)
    console.log('Tutorial suggestion created:', suggestion);
  }

  private async suggestWebsiteCreation(project: CrossPlatformProject, metadata: ProjectMetadata): Promise<void> {
    const suggestion = {
      user_id: project.user_id,
      project_id: project.id,
      suggestion_type: 'website_creation',
      title: `Create a website for "${metadata.title}"`,
      description: `Turn your ${metadata.tech_stack.join(', ')} project into a professional website with 4site.pro!`,
      cta_text: 'Create Website',
      cta_url: `/4site-pro/generate?project_id=${project.id}`,
      priority: this.calculateSuggestionPriority(metadata),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    };

    console.log('Website suggestion created:', suggestion);
  }

  private calculateSuggestionPriority(metadata: ProjectMetadata): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Tech stack popularity
    const popularTech = ['react', 'vue', 'angular', 'node', 'python', 'javascript', 'typescript'];
    score += metadata.tech_stack.filter(tech => 
      popularTech.some(popular => tech.toLowerCase().includes(popular))
    ).length;
    
    // Project complexity
    score += metadata.complexity_score;
    
    // Has GitHub repo
    if (metadata.github_repo) score += 2;
    
    // Feature count
    score += Math.min(metadata.features.length / 2, 3);
    
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  /**
   * Project Metadata Extraction
   */
  private async extractWebsiteMetadata(event: WebsiteCreationEvent): Promise<ProjectMetadata> {
    const metadata: ProjectMetadata = {
      title: event.website_data.title,
      description: event.website_data.description,
      tags: [],
      tech_stack: ['html', 'css', 'javascript'], // Default for websites
      features: [],
      complexity_score: 3, // Default medium complexity
      estimated_tutorial_length: 'medium'
    };

    // Extract from GitHub repo if available
    if (event.website_data.github_repo) {
      try {
        const githubMetadata = await this.metadataExtractor.extractFromGitHub(event.website_data.github_repo);
        metadata.tech_stack = [...new Set([...metadata.tech_stack, ...githubMetadata.tech_stack])];
        metadata.features = githubMetadata.features;
        metadata.complexity_score = githubMetadata.complexity_score;
        metadata.github_repo = event.website_data.github_repo;
      } catch (error) {
        console.warn('Failed to extract GitHub metadata:', error);
      }
    }

    // Extract from website content
    try {
      const websiteMetadata = await this.metadataExtractor.extractFromWebsite(event.website_url);
      metadata.tags = websiteMetadata.tags;
      metadata.deployment_url = event.website_url;
    } catch (error) {
      console.warn('Failed to extract website metadata:', error);
    }

    // Determine tutorial length based on complexity
    if (metadata.complexity_score <= 3) {
      metadata.estimated_tutorial_length = 'short';
    } else if (metadata.complexity_score <= 7) {
      metadata.estimated_tutorial_length = 'medium';
    } else {
      metadata.estimated_tutorial_length = 'long';
    }

    return metadata;
  }

  private async updateProjectWithSession(
    project: CrossPlatformProject, 
    session: DailyDocoSession
  ): Promise<CrossPlatformProject> {
    // Update project with new session insights
    const updatedMetadata = {
      ...project.metadata,
      // Merge tech stacks
      tech_stack: [...new Set([
        ...(project.metadata.tech_stack || []),
        ...(session.project_metadata?.tech_stack || [])
      ])],
      // Update tags
      tags: [...new Set([
        ...(project.metadata.tags || []),
        ...(session.project_metadata?.tags || [])
      ])]
    };

    const updatedIntegrationStatus = {
      ...project.integration_status,
      has_tutorial: project.integration_status.has_tutorial || session.potential_tutorial_moments.length > 0,
      has_documentation: true
    };

    // Update in database (would use Supabase update)
    console.log('Updating project with session data:', {
      project_id: project.id,
      session_type: session.session_type,
      tutorial_moments: session.potential_tutorial_moments.length
    });

    return {
      ...project,
      metadata: updatedMetadata,
      integration_status: updatedIntegrationStatus,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Real-time Project Status Sync
   */
  async syncProjectStatus(projectId: string): Promise<CrossPlatformProject> {
    // This would implement real-time sync between platforms
    // For now, just return the project with updated status
    const projects = await this.authService.getUserProjects(''); // Get all projects
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  /**
   * Bulk Project Migration
   */
  async migrateExistingProjects(userId: string): Promise<CrossPlatformProject[]> {
    // This would help users migrate existing projects to the unified system
    // Implementation would scan both platforms for existing content
    console.log('Migrating existing projects for user:', userId);
    return [];
  }
}

/**
 * Implementation of ProjectMetadataExtractor
 */
class ProjectMetadataExtractorImpl implements ProjectMetadataExtractor {
  async extractFromGitHub(repoUrl: string): Promise<ProjectMetadata> {
    // Extract repo owner and name from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    
    const [, owner, repo] = match;
    
    try {
      // Fetch repository information (would use GitHub API)
      const repoData = await this.fetchGitHubRepo(owner, repo);
      const packageJson = await this.fetchPackageJson(owner, repo);
      const readmeContent = await this.fetchReadme(owner, repo);
      
      return {
        title: repoData.name,
        description: repoData.description || '',
        tags: repoData.topics || [],
        tech_stack: this.detectTechStack(packageJson, repoData.language),
        github_repo: repoUrl,
        features: this.extractFeatures(readmeContent),
        complexity_score: this.calculateComplexity(packageJson, repoData),
        estimated_tutorial_length: 'medium' // Will be calculated based on complexity
      };
    } catch (error) {
      console.error('GitHub extraction failed:', error);
      throw error;
    }
  }

  async extractFromPackageJson(packageJson: any): Promise<ProjectMetadata> {
    return {
      title: packageJson.name || 'Unknown Project',
      description: packageJson.description || '',
      tags: packageJson.keywords || [],
      tech_stack: this.detectTechStackFromPackageJson(packageJson),
      features: [],
      complexity_score: this.calculateComplexityFromPackageJson(packageJson),
      estimated_tutorial_length: 'medium'
    };
  }

  async extractFromWebsite(websiteUrl: string): Promise<ProjectMetadata> {
    try {
      // Fetch and analyze website content
      const response = await fetch(websiteUrl);
      const html = await response.text();
      
      return {
        title: this.extractTitle(html),
        description: this.extractDescription(html),
        tags: this.extractMetaTags(html),
        tech_stack: this.detectTechStackFromHtml(html),
        deployment_url: websiteUrl,
        features: this.extractFeaturesFromHtml(html),
        complexity_score: 4, // Default for websites
        estimated_tutorial_length: 'short'
      };
    } catch (error) {
      console.error('Website extraction failed:', error);
      throw error;
    }
  }

  async extractFromCode(codeContent: string, filename: string): Promise<ProjectMetadata> {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    return {
      title: `${filename} Project`,
      description: 'Code-based project',
      tags: [],
      tech_stack: this.detectTechStackFromExtension(extension || ''),
      features: this.extractFeaturesFromCode(codeContent),
      complexity_score: this.calculateCodeComplexity(codeContent),
      estimated_tutorial_length: 'short'
    };
  }

  // Helper methods for metadata extraction
  private async fetchGitHubRepo(owner: string, repo: string): Promise<any> {
    // Mock implementation - would use actual GitHub API
    return {
      name: repo,
      description: 'A sample repository',
      topics: ['javascript', 'web'],
      language: 'JavaScript'
    };
  }

  private async fetchPackageJson(owner: string, repo: string): Promise<any> {
    // Mock implementation
    return {
      dependencies: {
        'react': '^18.0.0',
        'typescript': '^4.0.0'
      }
    };
  }

  private async fetchReadme(owner: string, repo: string): Promise<string> {
    return '# Sample README\n\nFeatures:\n- Authentication\n- Dashboard\n- API Integration';
  }

  private detectTechStack(packageJson: any, primaryLanguage: string): string[] {
    const stack = [primaryLanguage?.toLowerCase()].filter(Boolean);
    
    if (packageJson?.dependencies) {
      const deps = Object.keys(packageJson.dependencies);
      if (deps.includes('react')) stack.push('react');
      if (deps.includes('vue')) stack.push('vue');
      if (deps.includes('angular')) stack.push('angular');
      if (deps.includes('express')) stack.push('express', 'node');
      if (deps.includes('typescript')) stack.push('typescript');
    }
    
    return [...new Set(stack)];
  }

  private detectTechStackFromPackageJson(packageJson: any): string[] {
    return this.detectTechStack(packageJson, 'javascript');
  }

  private detectTechStackFromHtml(html: string): string[] {
    const stack = ['html', 'css'];
    
    if (html.includes('react')) stack.push('react');
    if (html.includes('vue')) stack.push('vue');
    if (html.includes('angular')) stack.push('angular');
    if (html.includes('bootstrap')) stack.push('bootstrap');
    if (html.includes('tailwind')) stack.push('tailwindcss');
    
    return stack;
  }

  private detectTechStackFromExtension(extension: string): string[] {
    const extensionMap: { [key: string]: string[] } = {
      'js': ['javascript'],
      'ts': ['typescript'],
      'jsx': ['react', 'javascript'],
      'tsx': ['react', 'typescript'],
      'vue': ['vue'],
      'py': ['python'],
      'rb': ['ruby'],
      'go': ['go'],
      'rs': ['rust'],
      'java': ['java'],
      'php': ['php'],
      'html': ['html'],
      'css': ['css'],
      'scss': ['sass'],
      'less': ['less']
    };
    
    return extensionMap[extension] || [];
  }

  private extractFeatures(readmeContent: string): string[] {
    const features: string[] = [];
    const lines = readmeContent.split('\n');
    
    for (const line of lines) {
      if (line.match(/^-\s+(.+)|^\*\s+(.+)|^\d+\.\s+(.+)/)) {
        const feature = line.replace(/^[-*\d.]\s*/, '').trim();
        if (feature.length > 3 && feature.length < 100) {
          features.push(feature);
        }
      }
    }
    
    return features.slice(0, 10); // Limit to 10 features
  }

  private extractFeaturesFromHtml(html: string): string[] {
    // Extract features from HTML structure
    const features: string[] = [];
    
    // Look for common feature sections
    const featureMatches = html.match(/<h[23]>[^<]*feature[^<]*<\/h[23]>/gi);
    if (featureMatches) {
      features.push(...featureMatches.map(match => 
        match.replace(/<[^>]*>/g, '').trim()
      ));
    }
    
    return features.slice(0, 5);
  }

  private extractFeaturesFromCode(codeContent: string): string[] {
    const features: string[] = [];
    
    // Look for function/class names as features
    const functionMatches = codeContent.match(/function\s+(\w+)|class\s+(\w+)|const\s+(\w+)\s*=/g);
    if (functionMatches) {
      features.push(...functionMatches.slice(0, 5).map(match => 
        match.replace(/function\s+|class\s+|const\s+|=.*/, '').trim()
      ));
    }
    
    return features;
  }

  private calculateComplexity(packageJson: any, repoData: any): number {
    let score = 3; // Base score
    
    if (packageJson?.dependencies) {
      score += Math.min(Object.keys(packageJson.dependencies).length / 5, 3);
    }
    
    if (repoData?.topics?.length > 5) score += 1;
    if (repoData?.description?.length > 100) score += 1;
    
    return Math.min(Math.max(score, 1), 10);
  }

  private calculateComplexityFromPackageJson(packageJson: any): number {
    return this.calculateComplexity(packageJson, {});
  }

  private calculateCodeComplexity(codeContent: string): number {
    let score = 1;
    
    // Count functions, classes, imports
    const functionCount = (codeContent.match(/function|class|def /g) || []).length;
    const importCount = (codeContent.match(/import|require\(/g) || []).length;
    
    score += Math.min(functionCount / 5, 3);
    score += Math.min(importCount / 10, 2);
    score += Math.min(codeContent.length / 10000, 4);
    
    return Math.min(Math.max(score, 1), 10);
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Website Project';
  }

  private extractDescription(html: string): string {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    return descMatch ? descMatch[1].trim() : '';
  }

  private extractMetaTags(html: string): string[] {
    const keywordMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    return keywordMatch ? keywordMatch[1].split(',').map(tag => tag.trim()) : [];
  }
}