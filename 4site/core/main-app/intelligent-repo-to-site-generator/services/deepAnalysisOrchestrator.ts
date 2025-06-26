// Deep Analysis Orchestrator
// Coordinates repository analysis, AI insights, diagram generation, and multi-page site creation

import { RepositoryAnalyzer, DeepAnalysisResult } from './repositoryAnalyzer';
import { generateSiteContentFromUrl } from './geminiService';
import { generateProjectVisuals } from './falService';
import { SiteData, Section } from '../types';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface DeepAnalysisProgress {
  stage: 'repository' | 'insights' | 'diagrams' | 'content' | 'pages' | 'optimization';
  progress: number;
  message: string;
  substeps?: string[];
  eta?: number; // seconds remaining
}

export interface ProjectDiagram {
  type: 'architecture' | 'dataflow' | 'dependency' | 'component';
  title: string;
  mermaidCode: string;
  description: string;
}

export interface PageContent {
  slug: string;
  title: string;
  description: string;
  content: string;
  sections: Section[];
  metadata: {
    priority: number;
    category: string;
    keywords: string[];
  };
}

export interface DeepSiteData extends SiteData {
  deepAnalysis: DeepAnalysisResult;
  diagrams: ProjectDiagram[];
  pages: PageContent[];
  heroContent: {
    mainObjective: string;
    valueProposition: string;
    primaryCTA: string;
    secondaryCTA: string;
    keyMetrics: { label: string; value: string }[];
  };
  navigationStructure: {
    label: string;
    href: string;
    children?: { label: string; href: string }[];
  }[];
  techStack?: string[];
  analysis: {
    commits: number;
    contributors: number;
    stars: number;
    lastCommit: string;
    primaryLanguage: string;
    languages: { name: string; percentage: number }[];
    codeQuality: { score: number; issues: number };
  };
  repoData: {
    owner: string;
    name: string;
    description: string;
  };
}

export class DeepAnalysisOrchestrator {
  private repoAnalyzer: RepositoryAnalyzer;
  private startTime: number = 0;
  private estimatedDuration: number = 120000; // 2 minutes default
  private genAI: GoogleGenerativeAI;
  
  constructor(githubToken?: string) {
    this.repoAnalyzer = new RepositoryAnalyzer(githubToken);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  private async generateContent(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }

  async generateDeepSite(
    repoUrl: string, 
    onProgress?: (progress: DeepAnalysisProgress) => void
  ): Promise<DeepSiteData> {
    this.startTime = Date.now();
    
    try {
      // Step 1: Deep Repository Analysis (30% of total time)
      onProgress?.({
        stage: 'repository',
        progress: 5,
        message: 'Starting deep repository analysis...',
        substeps: ['Fetching metadata', 'Analyzing structure', 'Scanning files'],
        eta: this.calculateETA(5)
      });

      const deepAnalysis = await this.repoAnalyzer.analyzeRepository(
        repoUrl,
        (progress, message) => {
          onProgress?.({
            stage: 'repository',
            progress: Math.floor(progress * 0.3),
            message,
            eta: this.calculateETA(progress * 0.3)
          });
        }
      );

      // Update estimated duration based on repository size
      this.updateEstimatedDuration(deepAnalysis);

      // Step 2: Generate AI Insights (20% of total time)
      onProgress?.({
        stage: 'insights',
        progress: 30,
        message: 'Generating AI-powered insights...',
        substeps: ['Understanding purpose', 'Analyzing architecture', 'Detecting patterns'],
        eta: this.calculateETA(30)
      });

      const aiInsights = await this.generateAIInsights(deepAnalysis, (progress) => {
        onProgress?.({
          stage: 'insights',
          progress: 30 + Math.floor(progress * 0.2),
          message: `AI analysis ${progress}% complete...`,
          eta: this.calculateETA(30 + progress * 0.2)
        });
      });

      // Step 3: Create Diagrams (15% of total time)
      onProgress?.({
        stage: 'diagrams',
        progress: 50,
        message: 'Creating architectural diagrams...',
        substeps: ['Architecture diagram', 'Data flow', 'Component relationships'],
        eta: this.calculateETA(50)
      });

      const diagrams = await this.generateDiagrams(deepAnalysis, aiInsights, (progress) => {
        onProgress?.({
          stage: 'diagrams',
          progress: 50 + Math.floor(progress * 0.15),
          message: `Generating diagrams ${progress}% complete...`,
          eta: this.calculateETA(50 + progress * 0.15)
        });
      });

      // Step 4: Generate Content (20% of total time)
      onProgress?.({
        stage: 'content',
        progress: 65,
        message: 'Creating content for all pages...',
        substeps: ['Hero content', 'Documentation pages', 'API references'],
        eta: this.calculateETA(65)
      });

      const heroContent = await this.generateHeroContent(deepAnalysis, aiInsights);
      const pages = await this.generatePages(deepAnalysis, aiInsights, diagrams, (progress) => {
        onProgress?.({
          stage: 'content',
          progress: 65 + Math.floor(progress * 0.2),
          message: `Generating page content ${progress}% complete...`,
          eta: this.calculateETA(65 + progress * 0.2)
        });
      });

      // Step 5: Generate Multi-Page Site (10% of total time)
      onProgress?.({
        stage: 'pages',
        progress: 85,
        message: 'Assembling multi-page website...',
        substeps: ['Creating navigation', 'Linking pages', 'Generating assets'],
        eta: this.calculateETA(85)
      });

      const navigationStructure = this.createNavigationStructure(pages, deepAnalysis);
      const visuals = await this.generateSiteVisuals(deepAnalysis, aiInsights);

      // Step 6: Final Optimization (5% of total time)
      onProgress?.({
        stage: 'optimization',
        progress: 95,
        message: 'Optimizing for performance and SEO...',
        eta: this.calculateETA(95)
      });

      // Extract repository metadata
      const [owner, repoName] = repoUrl.replace('https://github.com/', '').split('/');
      
      // Compile comprehensive analysis data
      const analysisData = {
        commits: deepAnalysis.stats?.totalCommits || 1000,
        contributors: deepAnalysis.stats?.contributors || 10,
        stars: deepAnalysis.stats?.stars || 1500,
        lastCommit: deepAnalysis.stats?.lastCommit || new Date().toISOString(),
        primaryLanguage: deepAnalysis.structure.mainLanguage || 'TypeScript',
        languages: Object.entries(deepAnalysis.structure.languages || {}).map(([name, percentage]) => ({
          name,
          percentage: percentage as number
        })),
        codeQuality: {
          score: deepAnalysis.qualityScore || 0.95,
          issues: deepAnalysis.stats?.openIssues || 5
        }
      };

      // Generate a compelling title
      const projectTitle = this.generateCompellingTitle(deepAnalysis, repoName);

      // Compile everything into DeepSiteData
      const deepSiteData: DeepSiteData = {
        id: Date.now().toString(),
        title: projectTitle,
        repoUrl,
        generatedMarkdown: this.compileMarkdown(deepAnalysis, pages),
        sections: this.compileSections(pages),
        template: 'ProfessionalDarkTemplate', // Use our new stunning template
        tier: 'premium',
        deepAnalysis,
        diagrams,
        pages,
        heroContent,
        navigationStructure,
        visuals,
        techStack: this.extractTechStack(deepAnalysis),
        projectType: deepAnalysis.architectureType,
        analysis: analysisData,
        repoData: {
          owner,
          name: repoName,
          description: deepAnalysis.purpose || aiInsights.valueProposition || 'A powerful open-source project'
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisDepth: 'comprehensive',
          qualityScore: deepAnalysis.qualityScore,
          totalPages: pages.length
        }
      };

      onProgress?.({
        stage: 'optimization',
        progress: 100,
        message: 'Deep analysis complete! Your comprehensive site is ready.',
        eta: 0
      });

      return deepSiteData;

    } catch (error) {
      console.error('Deep analysis failed:', error);
      throw new Error(`Deep analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateETA(currentProgress: number): number {
    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = elapsed / (currentProgress / 100);
    const remaining = estimatedTotal - elapsed;
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  }

  private updateEstimatedDuration(analysis: DeepAnalysisResult): void {
    // Adjust estimated duration based on repository complexity
    const baseTime = 120000; // 2 minutes base
    const fileFactor = Math.min(analysis.structure.totalFiles / 100, 3); // Up to 3x for large repos
    const complexityFactor = analysis.structure.languages ? Object.keys(analysis.structure.languages).length * 0.2 : 1;
    
    this.estimatedDuration = baseTime * (1 + fileFactor + complexityFactor);
  }

  private async generateAIInsights(
    analysis: DeepAnalysisResult,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    onProgress?.(10);
    
    // Create a comprehensive prompt for AI analysis
    const prompt = `
      Analyze this repository deeply and provide insights:
      
      Repository: ${analysis.repoUrl}
      Purpose: ${analysis.purpose}
      Main Language: ${analysis.structure.mainLanguage}
      Architecture: ${analysis.architectureType}
      Quality Score: ${analysis.qualityScore}
      
      Key Features:
      ${analysis.keyFeatures.map(f => `- ${f}`).join('\n')}
      
      Tech Stack:
      ${analysis.structure.dependencies.slice(0, 10).map(d => `- ${d.name}`).join('\n')}
      
      Provide:
      1. A compelling one-line value proposition
      2. The main problem this project solves
      3. Who would benefit most from this project
      4. What makes this project unique
      5. Potential use cases
      6. Integration possibilities
      7. Performance characteristics
      8. Security considerations
      9. Scalability aspects
      10. Future potential
      
      Format as JSON with these exact keys.
    `;

    onProgress?.(50);
    
    try {
      const insights = await this.generateContent(prompt);
      onProgress?.(90);
      return JSON.parse(insights);
    } catch (error) {
      console.error('AI insights generation failed:', error);
      // Return fallback insights
      return {
        valueProposition: analysis.purpose,
        mainProblem: 'Solving complex development challenges',
        targetUsers: analysis.targetAudience,
        uniqueFeatures: analysis.keyFeatures.slice(0, 3),
        useCases: ['Development', 'Production', 'Testing'],
        integrations: ['API', 'CLI', 'Library'],
        performance: 'Optimized for efficiency',
        security: 'Best practices implemented',
        scalability: 'Designed to scale',
        futurePotential: 'Actively maintained and growing'
      };
    }
  }

  private async generateDiagrams(
    analysis: DeepAnalysisResult,
    aiInsights: any,
    onProgress?: (progress: number) => void
  ): Promise<ProjectDiagram[]> {
    const diagrams: ProjectDiagram[] = [];
    
    onProgress?.(20);
    
    // Architecture Diagram
    diagrams.push({
      type: 'architecture',
      title: 'System Architecture',
      description: 'High-level overview of the system components and their relationships',
      mermaidCode: this.generateArchitectureDiagram(analysis)
    });
    
    onProgress?.(40);
    
    // Data Flow Diagram
    if (analysis.insights.apis.length > 0 || analysis.insights.functions.length > 5) {
      diagrams.push({
        type: 'dataflow',
        title: 'Data Flow',
        description: 'How data moves through the system',
        mermaidCode: this.generateDataFlowDiagram(analysis)
      });
    }
    
    onProgress?.(60);
    
    // Dependency Graph
    if (analysis.structure.dependencies.length > 5) {
      diagrams.push({
        type: 'dependency',
        title: 'Dependency Graph',
        description: 'Project dependencies and their relationships',
        mermaidCode: this.generateDependencyDiagram(analysis)
      });
    }
    
    onProgress?.(80);
    
    // Component Diagram
    if (analysis.insights.classes.length > 3 || analysis.insights.exports.length > 5) {
      diagrams.push({
        type: 'component',
        title: 'Component Structure',
        description: 'Main components and their interactions',
        mermaidCode: this.generateComponentDiagram(analysis)
      });
    }
    
    onProgress?.(100);
    
    return diagrams;
  }

  private generateArchitectureDiagram(analysis: DeepAnalysisResult): string {
    const { architectureType, insights, structure } = analysis;
    
    let diagram = 'graph TB\n';
    
    if (architectureType.includes('Microservices')) {
      diagram += '    subgraph "Microservices Architecture"\n';
      diagram += '        API[API Gateway]\n';
      diagram += '        S1[Service 1]\n';
      diagram += '        S2[Service 2]\n';
      diagram += '        S3[Service 3]\n';
      diagram += '        DB[(Database)]\n';
      diagram += '        API --> S1\n';
      diagram += '        API --> S2\n';
      diagram += '        API --> S3\n';
      diagram += '        S1 --> DB\n';
      diagram += '        S2 --> DB\n';
      diagram += '        S3 --> DB\n';
      diagram += '    end\n';
    } else if (architectureType.includes('Full-Stack')) {
      diagram += '    subgraph "Full-Stack Architecture"\n';
      diagram += '        FE[Frontend]\n';
      diagram += '        BE[Backend API]\n';
      diagram += '        DB[(Database)]\n';
      diagram += '        Cache[(Cache)]\n';
      diagram += '        FE -->|HTTP/REST| BE\n';
      diagram += '        BE --> DB\n';
      diagram += '        BE --> Cache\n';
      diagram += '    end\n';
    } else {
      // Generic architecture
      diagram += '    Entry[Entry Point]\n';
      diagram += '    Core[Core Logic]\n';
      diagram += '    Data[Data Layer]\n';
      diagram += '    Entry --> Core\n';
      diagram += '    Core --> Data\n';
    }
    
    return diagram;
  }

  private generateDataFlowDiagram(analysis: DeepAnalysisResult): string {
    const { insights } = analysis;
    
    let diagram = 'graph LR\n';
    diagram += '    Input[User Input]\n';
    
    if (insights.apis.length > 0) {
      diagram += '    API[API Layer]\n';
      diagram += '    Input --> API\n';
      insights.apis.slice(0, 3).forEach((api, i) => {
        const endpoint = api.split(' ')[1];
        diagram += `    API --> E${i}["${endpoint}"]\n`;
      });
    }
    
    if (insights.functions.length > 0) {
      diagram += '    Process[Processing]\n';
      diagram += '    API --> Process\n';
      diagram += '    Process --> Output[Response]\n';
    }
    
    return diagram;
  }

  private generateDependencyDiagram(analysis: DeepAnalysisResult): string {
    const { dependencies } = analysis.structure;
    
    let diagram = 'graph TD\n';
    diagram += '    Project[Project]\n';
    
    // Group dependencies by type
    const prodDeps = dependencies.filter(d => d.type === 'production').slice(0, 5);
    const devDeps = dependencies.filter(d => d.type === 'development').slice(0, 3);
    
    if (prodDeps.length > 0) {
      diagram += '    subgraph "Production Dependencies"\n';
      prodDeps.forEach((dep, i) => {
        diagram += `        P${i}[${dep.name}]\n`;
        diagram += `        Project --> P${i}\n`;
      });
      diagram += '    end\n';
    }
    
    if (devDeps.length > 0) {
      diagram += '    subgraph "Development Dependencies"\n';
      devDeps.forEach((dep, i) => {
        diagram += `        D${i}[${dep.name}]\n`;
        diagram += `        Project -.-> D${i}\n`;
      });
      diagram += '    end\n';
    }
    
    return diagram;
  }

  private generateComponentDiagram(analysis: DeepAnalysisResult): string {
    const { classes, exports } = analysis.insights;
    
    let diagram = 'graph TB\n';
    
    if (classes.length > 0) {
      diagram += '    subgraph "Classes"\n';
      classes.slice(0, 5).forEach((cls, i) => {
        diagram += `        C${i}[${cls}]\n`;
      });
      diagram += '    end\n';
    }
    
    if (exports.length > 0) {
      diagram += '    subgraph "Exports"\n';
      exports.slice(0, 5).forEach((exp, i) => {
        diagram += `        E${i}[${exp}]\n`;
      });
      diagram += '    end\n';
    }
    
    // Add some relationships
    if (classes.length > 0 && exports.length > 0) {
      diagram += '    C0 --> E0\n';
    }
    
    return diagram;
  }

  private async generateHeroContent(
    analysis: DeepAnalysisResult,
    aiInsights: any
  ): Promise<DeepSiteData['heroContent']> {
    const { purpose, keyFeatures, qualityScore } = analysis;
    
    return {
      mainObjective: aiInsights.valueProposition || purpose,
      valueProposition: aiInsights.mainProblem || `Solving ${analysis.structure.mainLanguage} development challenges`,
      primaryCTA: this.determinePrimaryCTA(analysis),
      secondaryCTA: 'View Documentation',
      keyMetrics: [
        {
          label: 'Stars',
          value: analysis.metadata.stars.toLocaleString()
        },
        {
          label: 'Quality Score',
          value: `${qualityScore}/100`
        },
        {
          label: 'Contributors',
          value: analysis.metadata.contributors.toString()
        },
        {
          label: 'Last Updated',
          value: this.formatDate(analysis.metadata.lastCommit)
        }
      ]
    };
  }

  private determinePrimaryCTA(analysis: DeepAnalysisResult): string {
    if (analysis.insights.patterns.includes('CLI')) {
      return 'Install Now';
    }
    if (analysis.insights.apis.length > 0) {
      return 'View API Docs';
    }
    if (analysis.purpose.includes('library')) {
      return 'Get Started';
    }
    return 'Try Demo';
  }

  private async generatePages(
    analysis: DeepAnalysisResult,
    aiInsights: any,
    diagrams: ProjectDiagram[],
    onProgress?: (progress: number) => void
  ): Promise<PageContent[]> {
    const pages: PageContent[] = [];
    
    // Overview Page (always included)
    pages.push(await this.generateOverviewPage(analysis, aiInsights));
    onProgress?.(20);
    
    // Getting Started Page
    pages.push(await this.generateGettingStartedPage(analysis));
    onProgress?.(40);
    
    // Architecture Page (if diagrams exist)
    if (diagrams.length > 0) {
      pages.push(await this.generateArchitecturePage(analysis, diagrams));
    }
    onProgress?.(60);
    
    // API Reference (if APIs exist)
    if (analysis.insights.apis.length > 0) {
      pages.push(await this.generateAPIPage(analysis));
    }
    onProgress?.(80);
    
    // Examples Page (if examples exist)
    if (analysis.structure.hasExamples) {
      pages.push(await this.generateExamplesPage(analysis));
    }
    
    // Contributing Page
    pages.push(await this.generateContributingPage(analysis));
    onProgress?.(100);
    
    return pages;
  }

  private async generateOverviewPage(
    analysis: DeepAnalysisResult,
    aiInsights: any
  ): Promise<PageContent> {
    const content = `
# ${this.extractProjectName(analysis.repoUrl)}

${analysis.purpose}

## Why ${this.extractProjectName(analysis.repoUrl)}?

${aiInsights.valueProposition || analysis.purpose}

### Key Features

${analysis.keyFeatures.map(f => `- **${f}**`).join('\n')}

### Who is this for?

${analysis.targetAudience}

### Technology Stack

- **Language**: ${analysis.structure.mainLanguage}
- **Architecture**: ${analysis.architectureType}
- **Dependencies**: ${analysis.structure.dependencies.length} packages

### Quality Metrics

- **Quality Score**: ${analysis.qualityScore}/100
- **Test Coverage**: ${analysis.structure.hasTests ? 'Yes' : 'No'}
- **Documentation**: ${analysis.structure.hasDocs ? 'Comprehensive' : 'Basic'}
- **Last Updated**: ${this.formatDate(analysis.metadata.lastCommit)}
    `;
    
    return {
      slug: 'overview',
      title: 'Overview',
      description: analysis.purpose,
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 1,
        category: 'general',
        keywords: ['overview', 'introduction', analysis.structure.mainLanguage.toLowerCase()]
      }
    };
  }

  private async generateGettingStartedPage(analysis: DeepAnalysisResult): Promise<PageContent> {
    const content = `
# Getting Started

Get up and running with ${this.extractProjectName(analysis.repoUrl)} in minutes.

## Prerequisites

${this.generatePrerequisites(analysis)}

## Installation

\`\`\`bash
${analysis.setupSteps.map(step => `# ${step}`).join('\n')}
\`\`\`

## Quick Start

${this.generateQuickStart(analysis)}

## Configuration

${this.generateConfiguration(analysis)}

## Next Steps

- Read the [Architecture Guide](/architecture)
- Explore [API Documentation](/api)
- Check out [Examples](/examples)
    `;
    
    return {
      slug: 'getting-started',
      title: 'Getting Started',
      description: 'Quick start guide and installation instructions',
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 2,
        category: 'documentation',
        keywords: ['installation', 'setup', 'quickstart', 'guide']
      }
    };
  }

  private async generateArchitecturePage(
    analysis: DeepAnalysisResult,
    diagrams: ProjectDiagram[]
  ): Promise<PageContent> {
    const content = `
# Architecture

## System Overview

This project follows a **${analysis.architectureType}** pattern.

${diagrams.map(d => `
## ${d.title}

${d.description}

\`\`\`mermaid
${d.mermaidCode}
\`\`\`
`).join('\n')}

## Design Principles

${this.generateDesignPrinciples(analysis)}

## Code Organization

${this.generateCodeOrganization(analysis)}
    `;
    
    return {
      slug: 'architecture',
      title: 'Architecture',
      description: 'System architecture and design decisions',
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 3,
        category: 'technical',
        keywords: ['architecture', 'design', 'structure', 'patterns']
      }
    };
  }

  private async generateAPIPage(analysis: DeepAnalysisResult): Promise<PageContent> {
    const content = `
# API Reference

## Available Endpoints

${analysis.insights.apis.map(api => {
  const [method, path] = api.split(' ');
  return `
### ${method} ${path}

\`\`\`http
${method} ${path}
Content-Type: application/json
\`\`\`
`;
}).join('\n')}

## Authentication

${this.generateAuthSection(analysis)}

## Error Handling

${this.generateErrorHandling(analysis)}

## Rate Limiting

Standard rate limiting applies. See documentation for details.
    `;
    
    return {
      slug: 'api',
      title: 'API Reference',
      description: 'Complete API documentation and examples',
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 4,
        category: 'reference',
        keywords: ['api', 'endpoints', 'rest', 'documentation']
      }
    };
  }

  private async generateExamplesPage(analysis: DeepAnalysisResult): Promise<PageContent> {
    const content = `
# Examples

Learn by example with these practical use cases.

## Basic Usage

${this.generateBasicExample(analysis)}

## Advanced Usage

${this.generateAdvancedExample(analysis)}

## Integration Examples

${this.generateIntegrationExamples(analysis)}

## Best Practices

${analysis.recommendations.map(r => `- ${r}`).join('\n')}
    `;
    
    return {
      slug: 'examples',
      title: 'Examples',
      description: 'Code examples and use cases',
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 5,
        category: 'tutorial',
        keywords: ['examples', 'tutorial', 'code', 'usage']
      }
    };
  }

  private async generateContributingPage(analysis: DeepAnalysisResult): Promise<PageContent> {
    const content = `
# Contributing

We welcome contributions to ${this.extractProjectName(analysis.repoUrl)}!

## How to Contribute

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## Development Setup

${analysis.setupSteps.map(step => `- ${step}`).join('\n')}

## Code Style

This project uses ${analysis.structure.mainLanguage} best practices.

## Testing

${analysis.structure.hasTests ? 'Run tests before submitting PRs.' : 'Consider adding tests for new features.'}

## Community

- **Issues**: ${analysis.metadata.issues} open issues
- **Contributors**: ${analysis.metadata.contributors} contributors
- **License**: ${analysis.metadata.license}
    `;
    
    return {
      slug: 'contributing',
      title: 'Contributing',
      description: 'Guidelines for contributing to the project',
      content,
      sections: this.parseContentToSections(content),
      metadata: {
        priority: 6,
        category: 'community',
        keywords: ['contributing', 'development', 'community', 'opensource']
      }
    };
  }

  private generatePrerequisites(analysis: DeepAnalysisResult): string {
    const prereqs: string[] = [];
    
    if (analysis.structure.mainLanguage === 'JavaScript' || analysis.structure.mainLanguage === 'TypeScript') {
      prereqs.push('- Node.js 14.0 or higher');
      prereqs.push('- npm or yarn');
    } else if (analysis.structure.mainLanguage === 'Python') {
      prereqs.push('- Python 3.7 or higher');
      prereqs.push('- pip');
    } else if (analysis.structure.mainLanguage === 'Rust') {
      prereqs.push('- Rust 1.50 or higher');
      prereqs.push('- Cargo');
    } else if (analysis.structure.mainLanguage === 'Go') {
      prereqs.push('- Go 1.16 or higher');
    }
    
    return prereqs.join('\n') || '- No specific prerequisites';
  }

  private generateQuickStart(analysis: DeepAnalysisResult): string {
    if (analysis.insights.patterns.includes('CLI')) {
      return `
\`\`\`bash
# Run the CLI
./cli --help
\`\`\`
`;
    }
    
    if (analysis.insights.apis.length > 0) {
      return `
\`\`\`bash
# Start the server
npm start

# Make your first request
curl http://localhost:3000/api
\`\`\`
`;
    }
    
    return `
\`\`\`bash
# Run the application
npm start
\`\`\`
`;
  }

  private generateConfiguration(analysis: DeepAnalysisResult): string {
    if (analysis.structure.configFiles.some(f => f.includes('.env'))) {
      return `
Create a \`.env\` file in the root directory:

\`\`\`env
# Add your configuration here
API_KEY=your_api_key
DATABASE_URL=your_database_url
\`\`\`
`;
    }
    
    return 'See configuration files in the repository for available options.';
  }

  private generateDesignPrinciples(analysis: DeepAnalysisResult): string {
    const principles: string[] = [];
    
    if (analysis.architectureType.includes('Microservices')) {
      principles.push('- **Loose Coupling**: Services are independent and communicate via APIs');
      principles.push('- **High Cohesion**: Each service has a single, well-defined purpose');
      principles.push('- **Scalability**: Services can be scaled independently');
    } else if (analysis.architectureType.includes('MVC')) {
      principles.push('- **Separation of Concerns**: Model, View, and Controller are distinct');
      principles.push('- **DRY (Don\'t Repeat Yourself)**: Reusable components and utilities');
      principles.push('- **Convention over Configuration**: Follow established patterns');
    } else {
      principles.push('- **Modularity**: Code is organized into logical modules');
      principles.push('- **Extensibility**: Easy to add new features');
      principles.push('- **Maintainability**: Clear code structure and documentation');
    }
    
    return principles.join('\n');
  }

  private generateCodeOrganization(analysis: DeepAnalysisResult): string {
    return `
\`\`\`
${this.extractProjectName(analysis.repoUrl)}/
├── ${analysis.structure.entryPoints[0] || 'src/'}
├── ${analysis.structure.hasTests ? 'tests/' : ''}
├── ${analysis.structure.hasDocs ? 'docs/' : ''}
${analysis.structure.configFiles.slice(0, 3).map(f => `├── ${f}`).join('\n')}
└── README.md
\`\`\`

- **Entry Points**: ${analysis.structure.entryPoints.join(', ') || 'src/index'}
- **Main Language**: ${analysis.structure.mainLanguage}
- **Total Files**: ${analysis.structure.totalFiles}
`;
  }

  private generateAuthSection(analysis: DeepAnalysisResult): string {
    // Check for auth-related dependencies
    const hasAuth = analysis.structure.dependencies.some(d => 
      d.name.includes('auth') || d.name.includes('jwt') || d.name.includes('passport')
    );
    
    if (hasAuth) {
      return `
### Bearer Token Authentication

Include your API token in the Authorization header:

\`\`\`http
Authorization: Bearer YOUR_API_TOKEN
\`\`\`
`;
    }
    
    return 'This API does not require authentication for public endpoints.';
  }

  private generateErrorHandling(analysis: DeepAnalysisResult): string {
    return `
### Error Response Format

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

### Common Error Codes

- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`404\` - Not Found
- \`500\` - Internal Server Error
`;
  }

  private generateBasicExample(analysis: DeepAnalysisResult): string {
    const lang = analysis.structure.mainLanguage.toLowerCase();
    
    if (lang === 'javascript' || lang === 'typescript') {
      return `
\`\`\`javascript
const example = require('${this.extractProjectName(analysis.repoUrl)}');

// Basic usage
example.doSomething({
  option1: 'value1',
  option2: 'value2'
});
\`\`\`
`;
    } else if (lang === 'python') {
      return `
\`\`\`python
import ${this.extractProjectName(analysis.repoUrl).replace('-', '_')}

# Basic usage
result = ${this.extractProjectName(analysis.repoUrl).replace('-', '_')}.do_something(
    option1='value1',
    option2='value2'
)
\`\`\`
`;
    }
    
    return '```\n// Add your example code here\n```';
  }

  private generateAdvancedExample(analysis: DeepAnalysisResult): string {
    return `
\`\`\`${analysis.structure.mainLanguage.toLowerCase()}
// Advanced configuration and usage
// This example demonstrates more complex features
\`\`\`
`;
  }

  private generateIntegrationExamples(analysis: DeepAnalysisResult): string {
    return `
### Integration with Express.js

\`\`\`javascript
const express = require('express');
const app = express();

// Integration code here
\`\`\`

### Integration with Other Tools

See the examples directory for more integration patterns.
`;
  }

  private createNavigationStructure(
    pages: PageContent[],
    analysis: DeepAnalysisResult
  ): DeepSiteData['navigationStructure'] {
    const nav: DeepSiteData['navigationStructure'] = [
      {
        label: 'Home',
        href: '/'
      }
    ];
    
    // Group pages by category
    const categories: Record<string, PageContent[]> = {};
    pages.forEach(page => {
      const category = page.metadata.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(page);
    });
    
    // Add documentation pages
    if (categories.documentation || categories.general) {
      nav.push({
        label: 'Documentation',
        href: '/docs',
        children: [
          ...(categories.general || []).map(p => ({ label: p.title, href: `/${p.slug}` })),
          ...(categories.documentation || []).map(p => ({ label: p.title, href: `/${p.slug}` }))
        ]
      });
    }
    
    // Add technical pages
    if (categories.technical || categories.reference) {
      nav.push({
        label: 'Technical',
        href: '/technical',
        children: [
          ...(categories.technical || []).map(p => ({ label: p.title, href: `/${p.slug}` })),
          ...(categories.reference || []).map(p => ({ label: p.title, href: `/${p.slug}` }))
        ]
      });
    }
    
    // Add community pages
    if (categories.community) {
      nav.push({
        label: 'Community',
        href: '/community',
        children: categories.community.map(p => ({ label: p.title, href: `/${p.slug}` }))
      });
    }
    
    // Add GitHub link
    nav.push({
      label: 'GitHub',
      href: analysis.repoUrl
    });
    
    return nav;
  }

  private async generateSiteVisuals(
    analysis: DeepAnalysisResult,
    aiInsights: any
  ): Promise<any> {
    try {
      // Generate hero image and other visuals based on project type
      const projectType = analysis.architectureType.toLowerCase();
      const techStack = analysis.structure.mainLanguage;
      
      const visualPrompts = [
        {
          prompt: `Modern hero image for a ${techStack} ${projectType} project, abstract technology visualization, professional gradient background`,
          purpose: 'hero'
        },
        {
          prompt: `Architecture diagram visualization for ${projectType}, technical schematic style, clean and professional`,
          purpose: 'architecture'
        }
      ];
      
      // For now, use default images since generateMultipleImages is not available
      // TODO: Implement actual image generation
      
      return {
        heroImage: '/default-hero.png',
        architectureImage: '/default-architecture.png',
        colorPalette: this.generateColorPalette(analysis)
      };
    } catch (error) {
      console.error('Visual generation failed:', error);
      return {
        heroImage: '/default-hero.png',
        architectureImage: '/default-architecture.png',
        colorPalette: ['#FFD700', '#1a1a1a', '#2d2d2d', '#ffffff']
      };
    }
  }

  private generateColorPalette(analysis: DeepAnalysisResult): string[] {
    // Generate colors based on technology
    const techColors: Record<string, string[]> = {
      'JavaScript': ['#F7DF1E', '#323330', '#000000'],
      'TypeScript': ['#3178C6', '#235A97', '#ffffff'],
      'Python': ['#3776AB', '#FFD43B', '#306998'],
      'Rust': ['#CE422B', '#000000', '#ffffff'],
      'Go': ['#00ADD8', '#00A29C', '#ffffff'],
      'Java': ['#007396', '#ED8B00', '#ffffff'],
      'Ruby': ['#CC342D', '#000000', '#ffffff']
    };
    
    const baseColors = techColors[analysis.structure.mainLanguage] || ['#FFD700', '#000000', '#ffffff'];
    return [...baseColors, '#1a1a1a', '#f0f0f0'];
  }

  private extractProjectName(repoUrl: string): string {
    const parts = repoUrl.split('/');
    return parts[parts.length - 1].replace('.git', '');
  }

  private generateCompellingTitle(analysis: DeepAnalysisResult, repoName: string): string {
    // Generate a compelling 3-part title based on the project
    const projectType = analysis.architectureType || 'Modern';
    const mainFeature = analysis.keyFeatures[0] || 'Innovation';
    
    // Create variations based on project characteristics
    if (analysis.structure.mainLanguage === 'JavaScript' || analysis.structure.mainLanguage === 'TypeScript') {
      if (analysis.insights.apis.length > 0) {
        return `Building Powerful APIs That Scale`;
      }
      if (analysis.structure.hasTests) {
        return `Enterprise-Ready ${projectType} Solutions`;
      }
      return `Modern ${projectType} Development Excellence`;
    }
    
    if (analysis.structure.mainLanguage === 'Python') {
      if (analysis.insights.apis.length > 0) {
        return `Intelligent Systems Powered By AI`;
      }
      return `Data-Driven ${projectType} Innovation`;
    }
    
    // Default compelling title structure
    const titles = [
      `Crafting Digital Experiences That Matter`,
      `Building Tomorrow's ${projectType} Solutions`,
      `Engineering Excellence Through Innovation`,
      `Transforming Ideas Into Reality`,
      `Next-Generation ${projectType} Platform`
    ];
    
    // Pick based on repo name hash for consistency
    const index = repoName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % titles.length;
    return titles[index];
  }

  private compileMarkdown(analysis: DeepAnalysisResult, pages: PageContent[]): string {
    // Compile all pages into a single markdown document
    return pages.map(page => page.content).join('\n\n---\n\n');
  }

  private compileSections(pages: PageContent[]): Section[] {
    // Flatten all sections from all pages
    return pages.flatMap(page => page.sections);
  }

  private selectTemplate(analysis: DeepAnalysisResult): string {
    if (analysis.insights.patterns.includes('React') || analysis.insights.patterns.includes('Vue')) {
      return 'ModernWebAppTemplate';
    }
    if (analysis.insights.apis.length > 0) {
      return 'APIDocumentationTemplate';
    }
    if (analysis.purpose.includes('library')) {
      return 'LibraryShowcaseTemplate';
    }
    return 'TechProjectTemplate';
  }

  private extractTechStack(analysis: DeepAnalysisResult): string[] {
    const stack: string[] = [analysis.structure.mainLanguage];
    
    // Add frameworks
    analysis.insights.patterns.forEach(pattern => {
      if (['React', 'Vue', 'Angular', 'Express', 'Django', 'FastAPI'].includes(pattern)) {
        stack.push(pattern);
      }
    });
    
    // Add key dependencies
    const keyDeps = analysis.structure.dependencies
      .filter(d => d.type === 'production')
      .slice(0, 3)
      .map(d => d.name);
    
    stack.push(...keyDeps);
    
    return stack;
  }

  private parseContentToSections(content: string): Section[] {
    const sections: Section[] = [];
    const lines = content.split('\n');
    let currentSection: Section | null = null;
    
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          id: this.slugify(line.slice(2)),
          title: line.slice(2),
          content: '',
          level: 1
        };
      } else if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          id: this.slugify(line.slice(3)),
          title: line.slice(3),
          content: '',
          level: 2
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });
    
    if (currentSection) sections.push(currentSection);
    
    return sections;
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private formatDate(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }
}