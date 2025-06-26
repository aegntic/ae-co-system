import { GoogleGenerativeAI } from "@google/generative-ai";
import { Anthropic } from '@anthropic-ai/sdk';
import { RepositoryStructure, FileAnalysis } from './repositoryAnalyzer';

export interface AIAnalysisResult {
  overview: ProjectOverview;
  architecture: ArchitectureAnalysis;
  codeQuality: CodeQualityAssessment;
  recommendations: Recommendation[];
  visualConcepts: VisualConcept[];
  deploymentGuide: DeploymentGuide;
}

export interface ProjectOverview {
  title: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  targetAudience: string[];
  uniqueValueProposition: string;
  projectType: 'library' | 'application' | 'framework' | 'tool' | 'service';
  maturityLevel: 'experimental' | 'beta' | 'stable' | 'mature';
}

export interface ArchitectureAnalysis {
  pattern: string;
  components: ComponentDescription[];
  dataFlow: DataFlowDescription[];
  integrations: Integration[];
  scalabilityAssessment: string;
  securityConsiderations: string[];
}

export interface CodeQualityAssessment {
  overallScore: number;
  maintainabilityScore: number;
  testCoverage: number;
  documentation: number;
  codeComplexity: 'low' | 'medium' | 'high';
  technicalDebt: string[];
  bestPractices: string[];
  improvementSuggestions: string[];
}

export interface Recommendation {
  category: 'performance' | 'security' | 'maintainability' | 'features' | 'deployment';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  implementation: string;
}

export interface VisualConcept {
  type: 'hero' | 'diagram' | 'icon' | 'illustration';
  description: string;
  style: string;
  colorScheme: string[];
  elements: string[];
}

export interface DeploymentGuide {
  platforms: DeploymentPlatform[];
  requirements: string[];
  steps: DeploymentStep[];
  environmentVariables: EnvironmentVariable[];
  monitoring: MonitoringSetup[];
}

export interface DeploymentPlatform {
  name: string;
  suitability: number;
  pros: string[];
  cons: string[];
  estimatedCost: string;
}

export interface DeploymentStep {
  order: number;
  title: string;
  description: string;
  commands: string[];
  notes: string[];
}

export interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export interface MonitoringSetup {
  tool: string;
  purpose: string;
  configuration: string;
}

interface ComponentDescription {
  name: string;
  purpose: string;
  dependencies: string[];
  interfaces: string[];
}

interface DataFlowDescription {
  from: string;
  to: string;
  data: string;
  method: string;
}

interface Integration {
  name: string;
  type: 'database' | 'api' | 'service' | 'library';
  purpose: string;
}

export class AIOrchestrator {
  private geminiClient: GoogleGenerativeAI;
  private anthropicClient: Anthropic;
  private deepSeekEndpoint: string; // For cost-optimized processing

  constructor(config: {
    geminiApiKey: string;
    anthropicApiKey?: string;
    deepSeekApiKey?: string;
  }) {
    this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    
    if (config.anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: config.anthropicApiKey,
      });
    }

    this.deepSeekEndpoint = 'https://api.deepseek.com/v1'; // Placeholder
  }

  async generateComprehensiveAnalysis(
    repositoryStructure: RepositoryStructure,
    repoUrl: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<AIAnalysisResult> {
    try {
      // Stage 1: Project Overview (Gemini - balanced)
      onProgress?.('overview', 10);
      const overview = await this.generateProjectOverview(repositoryStructure, repoUrl);

      // Stage 2: Architecture Analysis (Claude - technical depth) 
      onProgress?.('architecture', 25);
      const architecture = await this.analyzeArchitecture(repositoryStructure);

      // Stage 3: Code Quality Assessment (DeepSeek - cost-effective)
      onProgress?.('quality', 40);
      const codeQuality = await this.assessCodeQuality(repositoryStructure);

      // Stage 4: Recommendations (Multi-model synthesis)
      onProgress?.('recommendations', 60);
      const recommendations = await this.generateRecommendations(
        overview, 
        architecture, 
        codeQuality,
        repositoryStructure
      );

      // Stage 5: Visual Concepts (Gemini - creative)
      onProgress?.('visuals', 75);
      const visualConcepts = await this.generateVisualConcepts(overview, architecture);

      // Stage 6: Deployment Guide (Claude - technical accuracy)
      onProgress?.('deployment', 90);
      const deploymentGuide = await this.generateDeploymentGuide(repositoryStructure, architecture);

      onProgress?.('complete', 100);

      return {
        overview,
        architecture,
        codeQuality,
        recommendations,
        visualConcepts,
        deploymentGuide,
      };

    } catch (error) {
      console.error('AI orchestration failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateProjectOverview(
    structure: RepositoryStructure,
    repoUrl: string
  ): Promise<ProjectOverview> {
    const prompt = `
Analyze this repository structure and generate a comprehensive project overview:

Repository: ${repoUrl}
Languages: ${Object.keys(structure.languages).join(', ')}
Frameworks: ${structure.frameworks.join(', ')}
File Count: ${structure.files.length}
Documentation: ${JSON.stringify(structure.documentation)}

Key Files Analysis:
${structure.files.slice(0, 10).map(file => 
  `- ${file.path} (${file.language}, ${file.dependencies.length} deps)`
).join('\n')}

Generate a project overview with:
1. A compelling project title (if not obvious from repo name)
2. A catchy tagline (max 10 words)
3. Clear description (2-3 sentences)
4. 5-7 key features
5. Target audience segments
6. Unique value proposition
7. Project type classification
8. Maturity level assessment

Format as JSON with the specified structure. Be specific and engaging.
    `;

    const response = await this.queryGemini(prompt);
    return this.parseJsonResponse(response, 'project overview');
  }

  private async analyzeArchitecture(structure: RepositoryStructure): Promise<ArchitectureAnalysis> {
    if (!this.anthropicClient) {
      // Fallback to Gemini if Claude not available
      return this.analyzeArchitectureWithGemini(structure);
    }

    const prompt = `
You are a senior software architect. Analyze this repository structure and provide a detailed architecture analysis:

Languages: ${Object.keys(structure.languages).join(', ')}
Frameworks: ${structure.frameworks.join(', ')}
Build Tools: ${structure.buildTools.join(', ')}

File Structure:
${structure.files.slice(0, 20).map(file => 
  `${file.path} - ${file.language} - Dependencies: ${file.dependencies.slice(0, 5).join(', ')}`
).join('\n')}

Provide:
1. Architecture pattern identification (MVC, microservices, monolith, etc.)
2. Component breakdown with purposes and dependencies
3. Data flow analysis
4. External integrations
5. Scalability assessment
6. Security considerations

Return as JSON matching the ArchitectureAnalysis interface.
    `;

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return this.parseJsonResponse(content.text, 'architecture analysis');
    }
    
    throw new Error('Failed to get valid architecture analysis');
  }

  private async assessCodeQuality(structure: RepositoryStructure): Promise<CodeQualityAssessment> {
    // Use cost-effective model for bulk analysis
    const prompt = `
Assess code quality for this repository:

Metrics:
- Total files: ${structure.files.length}
- Languages: ${Object.keys(structure.languages).join(', ')}
- Average complexity: ${structure.metrics.complexity}
- Has tests: ${structure.testingFrameworks.length > 0}
- Documentation: ${JSON.stringify(structure.documentation)}

File Analysis Sample:
${structure.files.slice(0, 15).map(file => 
  `${file.path}: Complexity ${file.complexity}, Docs: ${file.documentation.length > 0 ? 'Yes' : 'No'}`
).join('\n')}

Provide scores (0-10) and assessments for:
1. Overall code quality score
2. Maintainability score  
3. Estimated test coverage
4. Documentation quality
5. Code complexity level
6. Technical debt identification
7. Best practices adherence
8. Improvement suggestions

Return as JSON matching CodeQualityAssessment interface.
    `;

    // Use DeepSeek for cost-effective analysis
    const response = await this.queryDeepSeek(prompt);
    return this.parseJsonResponse(response, 'code quality assessment');
  }

  private async generateRecommendations(
    overview: ProjectOverview,
    architecture: ArchitectureAnalysis,
    codeQuality: CodeQualityAssessment,
    structure: RepositoryStructure
  ): Promise<Recommendation[]> {
    const prompt = `
Based on this project analysis, generate specific recommendations:

Project: ${overview.title} (${overview.projectType}, ${overview.maturityLevel})
Architecture: ${architecture.pattern}
Code Quality: ${codeQuality.overallScore}/10
Tech Stack: ${structure.frameworks.join(', ')}

Quality Issues:
- Technical Debt: ${codeQuality.technicalDebt.join(', ')}
- Complexity: ${codeQuality.codeComplexity}
- Test Coverage: ${codeQuality.testCoverage}%

Generate 8-12 prioritized recommendations covering:
1. Performance optimizations
2. Security improvements  
3. Maintainability enhancements
4. Feature additions
5. Deployment optimizations

Each recommendation needs category, title, description, priority, effort, impact, and implementation approach.

Return as JSON array matching Recommendation interface.
    `;

    const response = await this.queryGemini(prompt);
    return this.parseJsonResponse(response, 'recommendations');
  }

  private async generateVisualConcepts(
    overview: ProjectOverview,
    architecture: ArchitectureAnalysis
  ): Promise<VisualConcept[]> {
    const prompt = `
Create visual concepts for this project:

Project: ${overview.title}
Type: ${overview.projectType}
Description: ${overview.description}
Architecture: ${architecture.pattern}

Generate 4-6 visual concepts:
1. Hero image concept (main visual for landing page)
2. Architecture diagram style
3. Project icon/logo concept
4. Additional illustrations as appropriate

For each concept, specify:
- Visual type
- Detailed description
- Art style (modern, minimal, technical, etc.)
- Color scheme suggestions
- Key visual elements

Return as JSON array matching VisualConcept interface.
    `;

    const response = await this.queryGemini(prompt);
    return this.parseJsonResponse(response, 'visual concepts');
  }

  private async generateDeploymentGuide(
    structure: RepositoryStructure,
    architecture: ArchitectureAnalysis
  ): Promise<DeploymentGuide> {
    if (!this.anthropicClient) {
      return this.generateDeploymentGuideWithGemini(structure, architecture);
    }

    const prompt = `
Create a comprehensive deployment guide:

Tech Stack: ${structure.frameworks.join(', ')}
Build Tools: ${structure.buildTools.join(', ')}
Architecture: ${architecture.pattern}

Generate:
1. Suitable deployment platforms with pros/cons and costs
2. System requirements
3. Step-by-step deployment instructions
4. Required environment variables
5. Monitoring setup recommendations

Consider the project's scale, complexity, and tech stack for platform recommendations.

Return as JSON matching DeploymentGuide interface.
    `;

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return this.parseJsonResponse(content.text, 'deployment guide');
    }
    
    throw new Error('Failed to generate deployment guide');
  }

  // AI Client Methods
  private async queryGemini(prompt: string): Promise<string> {
    const model = this.geminiClient.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    
    return text;
  }

  private async queryDeepSeek(prompt: string): Promise<string> {
    // Implement DeepSeek API call for cost-effective processing
    // This is a placeholder - implement actual DeepSeek integration
    console.log('DeepSeek query (placeholder):', prompt.slice(0, 100));
    
    // Fallback to Gemini for now
    return this.queryGemini(prompt);
  }

  // Fallback methods when Claude is not available
  private async analyzeArchitectureWithGemini(structure: RepositoryStructure): Promise<ArchitectureAnalysis> {
    const prompt = `
Analyze the architecture of this repository:

[Same prompt as Claude version but optimized for Gemini]

Languages: ${Object.keys(structure.languages).join(', ')}
Frameworks: ${structure.frameworks.join(', ')}

Return detailed architecture analysis as JSON.
    `;

    const response = await this.queryGemini(prompt);
    return this.parseJsonResponse(response, 'architecture analysis');
  }

  private async generateDeploymentGuideWithGemini(
    structure: RepositoryStructure,
    architecture: ArchitectureAnalysis
  ): Promise<DeploymentGuide> {
    const prompt = `
Generate deployment guide for:

Tech Stack: ${structure.frameworks.join(', ')}
Architecture: ${architecture.pattern}

Include platforms, requirements, steps, environment variables, and monitoring.
Return as JSON matching DeploymentGuide interface.
    `;

    const response = await this.queryGemini(prompt);
    return this.parseJsonResponse(response, 'deployment guide');
  }

  private parseJsonResponse(response: string, context: string): any {
    try {
      // Extract JSON from response (may contain other text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No JSON found in ${context} response`);
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error(`Failed to parse ${context} JSON:`, error);
      console.error('Response:', response.slice(0, 500));
      throw new Error(`Invalid JSON response for ${context}`);
    }
  }
}

// Enhanced progress tracking
export interface DetailedProgress {
  stage: string;
  substage?: string;
  progress: number;
  message: string;
  eta?: number;
  filesProcessed?: number;
  totalFiles?: number;
}

export type DetailedProgressCallback = (progress: DetailedProgress) => void;