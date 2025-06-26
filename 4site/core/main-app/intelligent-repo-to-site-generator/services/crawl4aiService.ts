import { RepositoryAnalysis } from '../types';

interface Crawl4aiConfig {
  apiKey?: string;
  baseUrl: string;
}

interface CrawlResult {
  content: string;
  metadata: {
    title: string;
    description: string;
    images: string[];
    links: string[];
  };
  structure: {
    headings: Array<{ level: number; text: string }>;
    codeBlocks: Array<{ language: string; content: string }>;
    sections: Array<{ title: string; content: string }>;
  };
}

class Crawl4aiService {
  private config: Crawl4aiConfig;

  constructor(config: Crawl4aiConfig) {
    this.config = config;
  }

  async analyzeRepository(repoUrl: string): Promise<RepositoryAnalysis> {
    try {
      // Extract repo info from URL
      const { owner, repo } = this.parseGitHubUrl(repoUrl);
      
      // Crawl the repository pages
      const readmeResult = await this.crawlPage(`${repoUrl}/blob/main/README.md`);
      const repoPageResult = await this.crawlPage(repoUrl);
      
      // Analyze the repository structure
      const languages = await this.analyzeLanguages(owner, repo);
      const frameworks = this.detectFrameworks(readmeResult);
      const features = this.extractFeatures(readmeResult);
      
      // Analyze README quality
      const readmeQuality = this.assessReadmeQuality(readmeResult);
      
      // Get repository activity data
      const activity = await this.getRepositoryActivity(owner, repo);
      
      return {
        languages,
        frameworks,
        features,
        complexity: this.determineComplexity(languages, frameworks, features),
        category: this.categorizeProject(languages, frameworks, readmeResult),
        readme: {
          quality: readmeQuality.score,
          sections: readmeQuality.sections,
          hasImages: readmeQuality.hasImages,
          hasDemo: readmeQuality.hasDemo
        },
        activity
      };
    } catch (error) {
      console.error('Crawl4ai analysis failed:', error);
      throw new Error('Failed to analyze repository with crawl4ai');
    }
  }

  private async crawlPage(url: string): Promise<CrawlResult> {
    // In a real implementation, this would make an API call to crawl4ai
    // For now, we'll simulate the response
    
    const mockResult: CrawlResult = {
      content: `# Project Title\n\nThis is a mock crawl result for ${url}`,
      metadata: {
        title: 'Project Repository',
        description: 'A sample project repository',
        images: ['https://example.com/image.png'],
        links: ['https://example.com/demo']
      },
      structure: {
        headings: [
          { level: 1, text: 'Project Title' },
          { level: 2, text: 'Installation' },
          { level: 2, text: 'Usage' }
        ],
        codeBlocks: [
          { language: 'bash', content: 'npm install' },
          { language: 'javascript', content: 'import { Component } from "react"' }
        ],
        sections: [
          { title: 'Overview', content: 'Project overview content' },
          { title: 'Features', content: 'List of features' }
        ]
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return mockResult;
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  private async analyzeLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    // Mock language analysis
    const mockLanguages = {
      'TypeScript': 45,
      'JavaScript': 30,
      'CSS': 15,
      'HTML': 10
    };
    
    return mockLanguages;
  }

  private detectFrameworks(crawlResult: CrawlResult): string[] {
    const frameworks: string[] = [];
    const content = crawlResult.content.toLowerCase();
    
    // Framework detection patterns
    const frameworkPatterns = {
      'React': /react|jsx/,
      'Vue': /vue\.js|vue/,
      'Angular': /angular|@angular/,
      'Next.js': /next\.js|nextjs/,
      'Nuxt': /nuxt/,
      'Svelte': /svelte/,
      'Express': /express/,
      'FastAPI': /fastapi/,
      'Django': /django/,
      'Flask': /flask/,
      'Laravel': /laravel/,
      'Spring': /spring/,
      'TailwindCSS': /tailwind/,
      'Bootstrap': /bootstrap/,
      'Material-UI': /material-ui|mui/,
      'Chakra UI': /chakra/
    };

    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
      if (pattern.test(content)) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  private extractFeatures(crawlResult: CrawlResult): string[] {
    const features: string[] = [];
    const content = crawlResult.content.toLowerCase();
    
    // Feature detection patterns
    const featurePatterns = {
      'Authentication': /auth|login|signup|jwt/,
      'Database': /database|db|sql|mongodb|postgres/,
      'API': /api|rest|graphql/,
      'Testing': /test|jest|cypress|playwright/,
      'CI/CD': /ci\/cd|github actions|travis|jenkins/,
      'Docker': /docker|containeriz/,
      'TypeScript': /typescript|types/,
      'PWA': /progressive web app|pwa|service worker/,
      'Mobile': /mobile|ios|android|react native/,
      'Real-time': /websocket|real-time|socket\.io/,
      'Analytics': /analytics|tracking|metrics/,
      'Monitoring': /monitoring|logging|sentry/
    };

    for (const [feature, pattern] of Object.entries(featurePatterns)) {
      if (pattern.test(content)) {
        features.push(feature);
      }
    }

    return features;
  }

  private assessReadmeQuality(crawlResult: CrawlResult): {
    score: number;
    sections: string[];
    hasImages: boolean;
    hasDemo: boolean;
  } {
    let score = 0;
    const sections: string[] = [];
    
    // Check for essential sections
    const requiredSections = ['installation', 'usage', 'features', 'contributing'];
    const content = crawlResult.content.toLowerCase();
    
    for (const section of requiredSections) {
      if (content.includes(section)) {
        score += 20;
        sections.push(section);
      }
    }

    // Check for images
    const hasImages = crawlResult.metadata.images.length > 0 || /!\[.*\]\(.*\)/.test(crawlResult.content);
    if (hasImages) score += 10;

    // Check for demo/examples
    const hasDemo = /demo|example|live|preview/.test(content);
    if (hasDemo) score += 10;

    // Check for badges
    if (/!\[.*\]\(https:\/\/img\.shields\.io/.test(crawlResult.content)) {
      score += 5;
    }

    // Check for proper formatting
    if (crawlResult.structure.headings.length > 2) {
      score += 5;
    }

    return {
      score: Math.min(score, 100),
      sections,
      hasImages,
      hasDemo
    };
  }

  private determineComplexity(
    languages: Record<string, number>,
    frameworks: string[],
    features: string[]
  ): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0;
    
    // Language diversity
    complexityScore += Object.keys(languages).length * 5;
    
    // Framework count
    complexityScore += frameworks.length * 10;
    
    // Feature count
    complexityScore += features.length * 8;
    
    // TypeScript usage (indicates more complex project)
    if (languages.TypeScript > 30) {
      complexityScore += 15;
    }
    
    if (complexityScore < 30) return 'simple';
    if (complexityScore < 70) return 'moderate';
    return 'complex';
  }

  private categorizeProject(
    languages: Record<string, number>,
    frameworks: string[],
    crawlResult: CrawlResult
  ): 'web' | 'mobile' | 'desktop' | 'library' | 'tool' | 'other' {
    const content = crawlResult.content.toLowerCase();
    
    // Mobile indicators
    if (frameworks.some(f => f.includes('React Native')) || 
        content.includes('mobile') || 
        content.includes('ios') || 
        content.includes('android')) {
      return 'mobile';
    }
    
    // Desktop indicators
    if (content.includes('desktop') || 
        content.includes('electron') || 
        frameworks.some(f => f.includes('Tauri'))) {
      return 'desktop';
    }
    
    // Web indicators
    if (frameworks.some(f => ['React', 'Vue', 'Angular', 'Next.js'].includes(f)) ||
        languages.CSS > 0 || 
        languages.HTML > 0) {
      return 'web';
    }
    
    // Library indicators
    if (content.includes('library') || 
        content.includes('package') || 
        content.includes('npm install')) {
      return 'library';
    }
    
    // Tool indicators
    if (content.includes('cli') || 
        content.includes('tool') || 
        content.includes('utility')) {
      return 'tool';
    }
    
    return 'other';
  }

  private async getRepositoryActivity(owner: string, repo: string): Promise<{
    stars: number;
    forks: number;
    lastCommit: string;
    contributors: number;
  }> {
    // Mock activity data - in real implementation, use GitHub API
    return {
      stars: Math.floor(Math.random() * 10000),
      forks: Math.floor(Math.random() * 1000),
      lastCommit: '2 days ago',
      contributors: Math.floor(Math.random() * 50) + 1
    };
  }
}

// Singleton instance
const crawl4aiService = new Crawl4aiService({
  baseUrl: process.env.CRAWL4AI_URL || 'https://api.crawl4ai.com'
});

export { crawl4aiService };
export type { RepositoryAnalysis };