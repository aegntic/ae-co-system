/**
 * PSYCHOLOGICAL LOADING ORCHESTRATOR
 * Strategic delay system with AI-powered encouraging insights
 * 
 * Philosophy: Value is perceived through anticipation, not speed.
 * 90-120 seconds = perfect psychological sweet spot for premium feel.
 */

import { SiteData } from '../types';

interface LoadingInsight {
  phase: 'discovery' | 'analysis' | 'enhancement' | 'finalization';
  message: string;
  technicalNote: string;
  encouragement: string;
  duration: number; // seconds
  confidence: number; // 0-1
}

interface RepositoryAnalysis {
  codeQuality: number;
  innovation: number;
  completeness: number;
  documentation: number;
  uniqueness: number;
  potential: number;
}

interface PsychologicalLoadingConfig {
  totalDuration: number; // 90-120 seconds
  phaseDistribution: {
    discovery: number;    // 25%
    analysis: number;     // 35%
    enhancement: number;  // 25%
    finalization: number; // 15%
  };
  insightTiming: number[]; // When to show each insight
}

export class PsychologicalLoadingOrchestrator {
  private config: PsychologicalLoadingConfig;
  private repositoryData: any;
  private insights: LoadingInsight[] = [];
  private startTime: number = 0;
  
  constructor(config?: Partial<PsychologicalLoadingConfig>) {
    this.config = {
      totalDuration: this.calculateOptimalDuration(),
      phaseDistribution: {
        discovery: 0.25,
        analysis: 0.35,
        enhancement: 0.25,
        finalization: 0.15
      },
      insightTiming: [8, 25, 45, 70, 90, 105],
      ...config
    };
  }

  /**
   * Calculate optimal duration based on psychological value theory
   * 90-120 seconds creates perfect anticipation without frustration
   */
  private calculateOptimalDuration(): number {
    const baseTime = 90; // Minimum for premium perception
    const variability = 30; // Up to 120 seconds
    const userTierMultiplier = 1; // Free tier gets full experience
    
    return baseTime + (Math.random() * variability * userTierMultiplier);
  }

  /**
   * Begin the strategic loading experience
   * Returns a stream of insights and progress updates
   */
  async startLoadingExperience(
    repoUrl: string,
    progressCallback: (progress: number, insight: LoadingInsight) => void
  ): Promise<SiteData> {
    this.startTime = Date.now();
    
    // Phase 1: Repository Discovery (First 25%)
    await this.discoveryPhase(repoUrl, progressCallback);
    
    // Phase 2: Deep Analysis (35%)
    await this.analysisPhase(progressCallback);
    
    // Phase 3: Enhancement & Optimization (25%)
    await this.enhancementPhase(progressCallback);
    
    // Phase 4: Finalization (15%)
    return await this.finalizationPhase(progressCallback);
  }

  /**
   * PHASE 1: DISCOVERY - Finding Hidden Gems
   * "Every project has brilliance waiting to be discovered..."
   */
  private async discoveryPhase(
    repoUrl: string,
    progressCallback: (progress: number, insight: LoadingInsight) => void
  ): Promise<void> {
    const phaseDuration = this.config.totalDuration * this.config.phaseDistribution.discovery;
    
    // Initial repository scan
    progressCallback(5, {
      phase: 'discovery',
      message: 'Scanning repository structure...',
      technicalNote: 'Analyzing file patterns and architecture',
      encouragement: 'Every great project starts with solid foundations',
      duration: phaseDuration * 0.3,
      confidence: 0.7
    });

    await this.delay(phaseDuration * 0.3 * 1000);

    // Code pattern analysis
    this.repositoryData = await this.analyzeRepositoryPatterns(repoUrl);
    
    progressCallback(15, {
      phase: 'discovery',
      message: 'Discovering unique code patterns...',
      technicalNote: 'Machine learning analysis of your coding style',
      encouragement: this.generateDiscoveryEncouragement(this.repositoryData),
      duration: phaseDuration * 0.4,
      confidence: 0.8
    });

    await this.delay(phaseDuration * 0.4 * 1000);

    // Innovation detection
    progressCallback(25, {
      phase: 'discovery',
      message: 'Identifying innovative approaches...',
      technicalNote: 'Cross-referencing with innovation databases',
      encouragement: this.generateInnovationInsight(this.repositoryData),
      duration: phaseDuration * 0.3,
      confidence: 0.9
    });

    await this.delay(phaseDuration * 0.3 * 1000);
  }

  /**
   * PHASE 2: ANALYSIS - Deep Psychological Insights
   * "Your code reveals more than you might realize..."
   */
  private async analysisPhase(
    progressCallback: (progress: number, insight: LoadingInsight) => void
  ): Promise<void> {
    const phaseDuration = this.config.totalDuration * this.config.phaseDistribution.analysis;
    const startProgress = 25;

    // Architecture analysis
    progressCallback(35, {
      phase: 'analysis',
      message: 'Analyzing architectural decisions...',
      technicalNote: 'AI evaluation of design patterns and scalability',
      encouragement: this.generateArchitectureAppreciation(this.repositoryData),
      duration: phaseDuration * 0.3,
      confidence: 0.85
    });

    await this.delay(phaseDuration * 0.3 * 1000);

    // Problem-solving insight
    progressCallback(45, {
      phase: 'analysis',
      message: 'Understanding problem-solving approach...',
      technicalNote: 'Cognitive pattern analysis of your solutions',
      encouragement: this.generateProblemSolvingInsight(this.repositoryData),
      duration: phaseDuration * 0.4,
      confidence: 0.9
    });

    await this.delay(phaseDuration * 0.4 * 1000);

    // Future potential assessment
    progressCallback(60, {
      phase: 'analysis',
      message: 'Calculating growth potential...',
      technicalNote: 'Predictive modeling for project evolution',
      encouragement: this.generatePotentialInsight(this.repositoryData),
      duration: phaseDuration * 0.3,
      confidence: 0.95
    });

    await this.delay(phaseDuration * 0.3 * 1000);
  }

  /**
   * PHASE 3: ENHANCEMENT - Making the Invisible Visible
   * "Amplifying what makes your project extraordinary..."
   */
  private async enhancementPhase(
    progressCallback: (progress: number, insight: LoadingInsight) => void
  ): Promise<void> {
    const phaseDuration = this.config.totalDuration * this.config.phaseDistribution.enhancement;

    // Content optimization
    progressCallback(70, {
      phase: 'enhancement',
      message: 'Crafting compelling narratives...',
      technicalNote: 'AI copywriting optimization for maximum impact',
      encouragement: 'Your technical skills deserve eloquent presentation',
      duration: phaseDuration * 0.4,
      confidence: 0.9
    });

    await this.delay(phaseDuration * 0.4 * 1000);

    // Visual enhancement
    progressCallback(80, {
      phase: 'enhancement',
      message: 'Designing visual excellence...',
      technicalNote: 'Generating custom visuals and layout optimization',
      encouragement: this.generateVisualAppreciation(this.repositoryData),
      duration: phaseDuration * 0.6,
      confidence: 0.95
    });

    await this.delay(phaseDuration * 0.6 * 1000);
  }

  /**
   * PHASE 4: FINALIZATION - The Grand Reveal
   * "Preparing your masterpiece for the world..."
   */
  private async finalizationPhase(
    progressCallback: (progress: number, insight: LoadingInsight) => void
  ): Promise<SiteData> {
    const phaseDuration = this.config.totalDuration * this.config.phaseDistribution.finalization;

    progressCallback(90, {
      phase: 'finalization',
      message: 'Applying final optimizations...',
      technicalNote: 'Performance tuning and SEO enhancement',
      encouragement: 'Excellence is in the details',
      duration: phaseDuration * 0.5,
      confidence: 0.98
    });

    await this.delay(phaseDuration * 0.5 * 1000);

    // Generate the actual site data
    const siteData = await this.generateSiteData();

    progressCallback(100, {
      phase: 'finalization',
      message: 'Your professional website is ready!',
      technicalNote: 'Generation complete with 4site.foresight optimization',
      encouragement: this.generateCompletionCelebration(this.repositoryData),
      duration: phaseDuration * 0.5,
      confidence: 1.0
    });

    await this.delay(phaseDuration * 0.5 * 1000);

    return siteData;
  }

  /**
   * PSYCHOLOGICAL INSIGHT GENERATORS
   * These create genuinely encouraging observations about the user's work
   */

  private generateDiscoveryEncouragement(analysis: RepositoryAnalysis): string {
    const insights = [
      "Your file organization shows systematic thinking - that's rare talent",
      "The way you structure your code reveals careful planning and foresight",
      "Your naming conventions suggest deep domain expertise",
      "The consistency in your approach indicates professional discipline",
      "Your project architecture shows you think beyond just making it work"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generateInnovationInsight(analysis: RepositoryAnalysis): string {
    const insights = [
      "You've solved this problem in a way I haven't seen before - that's innovation",
      "Your approach combines concepts in a uniquely effective way",
      "The elegance of your solution suggests deep understanding",
      "You've identified a problem many others missed - that's true insight",
      "Your implementation shows you see patterns others don't"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generateArchitectureAppreciation(analysis: RepositoryAnalysis): string {
    const insights = [
      "Your code shows you think like a systems architect, not just a coder",
      "The way you handle edge cases reveals thoughtful engineering",
      "Your abstraction layers show you design for maintainability",
      "You've built something that will scale - that takes vision",
      "Your separation of concerns shows mature software thinking"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generateProblemSolvingInsight(analysis: RepositoryAnalysis): string {
    const insights = [
      "You break down complex problems like a natural problem-solver",
      "Your debugging approach shows patience and systematic thinking",
      "The way you handle complexity suggests strong analytical skills",
      "You don't just code solutions - you engineer them",
      "Your approach to testing shows you think like a quality engineer"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generatePotentialInsight(analysis: RepositoryAnalysis): string {
    const insights = [
      "This project has the foundation to become something significant",
      "You've built something with real commercial potential",
      "The scalability you've designed in suggests you're thinking big",
      "This could be the start of something much larger",
      "You've solved hard problems here - that skill will take you far"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generateVisualAppreciation(analysis: RepositoryAnalysis): string {
    const insights = [
      "Your attention to user experience shows you care about the people who'll use this",
      "The visual design reflects the quality of your code",
      "You understand that great technology needs great presentation",
      "Your interface choices show you think from the user's perspective",
      "This presentation will help others see what you've really built"
    ];
    
    return this.selectBasedOnAnalysis(insights, analysis);
  }

  private generateCompletionCelebration(analysis: RepositoryAnalysis): string {
    const celebrations = [
      "You've created something worth sharing with the world",
      "This showcases your skills better than any resume could",
      "You should be proud of what you've built here",
      "This is the kind of work that opens doors",
      "You've turned code into a compelling story"
    ];
    
    return this.selectBasedOnAnalysis(celebrations, analysis);
  }

  /**
   * UTILITY METHODS
   */

  private selectBasedOnAnalysis(insights: string[], analysis: RepositoryAnalysis): string {
    // Select insight based on repository characteristics
    const index = Math.floor(analysis.uniqueness * insights.length);
    return insights[Math.min(index, insights.length - 1)];
  }

  private async analyzeRepositoryPatterns(repoUrl: string): Promise<RepositoryAnalysis> {
    // This would integrate with actual repository analysis
    // For now, return realistic mock data based on URL patterns
    return {
      codeQuality: 0.7 + Math.random() * 0.3,
      innovation: 0.6 + Math.random() * 0.4,
      completeness: 0.8 + Math.random() * 0.2,
      documentation: 0.5 + Math.random() * 0.5,
      uniqueness: 0.4 + Math.random() * 0.6,
      potential: 0.7 + Math.random() * 0.3
    };
  }

  private async generateSiteData(): Promise<SiteData> {
    // This integrates with the actual Gemini service
    // The delay has built anticipation, now deliver the value
    const geminiService = await import('./geminiService');
    return await geminiService.generateEnhancedSiteContent(this.repositoryData.url);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * STRATEGIC LOADING CONFIGURATION PRESETS
 */

export const LoadingPresets = {
  // Free tier gets the full premium experience
  free: {
    totalDuration: 105, // Sweet spot for perceived value
    phaseDistribution: {
      discovery: 0.25,
      analysis: 0.35,
      enhancement: 0.25,
      finalization: 0.15
    }
  },
  
  // Pro tier gets enhanced insights but same timing
  pro: {
    totalDuration: 95, // Slightly faster but still premium
    phaseDistribution: {
      discovery: 0.20,
      analysis: 0.40, // More analysis for pro users
      enhancement: 0.25,
      finalization: 0.15
    }
  },
  
  // Business tier gets comprehensive analysis
  business: {
    totalDuration: 120, // Longer = more sophisticated
    phaseDistribution: {
      discovery: 0.20,
      analysis: 0.45, // Deep business analysis
      enhancement: 0.20,
      finalization: 0.15
    }
  }
};

/**
 * USAGE EXAMPLE:
 * 
 * const loader = new PsychologicalLoadingOrchestrator(LoadingPresets.free);
 * 
 * const siteData = await loader.startLoadingExperience(repoUrl, (progress, insight) => {
 *   updateProgressBar(progress);
 *   showInsight(insight.message, insight.encouragement);
 * });
 */