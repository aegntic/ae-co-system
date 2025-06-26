// Deep Repository Analysis Service
// Analyzes repository structure, code, and metadata for comprehensive understanding

export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  language?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  description?: string;
}

export interface RepositoryStructure {
  totalFiles: number;
  totalSize: number;
  mainLanguage: string;
  languages: Record<string, number>; // language -> file count
  hasTests: boolean;
  hasDocs: boolean;
  hasExamples: boolean;
  entryPoints: string[];
  configFiles: string[];
  dependencies: DependencyInfo[];
}

export interface CodeInsights {
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  apis: string[];
  patterns: string[]; // MVC, microservices, etc.
}

export interface RepositoryMetadata {
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  lastCommit: Date;
  createdAt: Date;
  license: string;
  topics: string[];
  totalCommits?: number;
  openIssues?: number;
  description: string;
}

export interface DeepAnalysisResult {
  repoUrl: string;
  structure: RepositoryStructure;
  insights: CodeInsights;
  metadata: RepositoryMetadata;
  purpose: string;
  targetAudience: string;
  keyFeatures: string[];
  setupSteps: string[];
  architectureType: string;
  qualityScore: number;
  recommendations: string[];
  stats?: {
    totalCommits: number;
    contributors: number;
    stars: number;
    lastCommit: string;
    openIssues: number;
  };
}

export class RepositoryAnalyzer {
  private githubToken?: string;
  private fileCache: Map<string, string> = new Map();
  
  constructor(githubToken?: string) {
    this.githubToken = githubToken || import.meta.env.VITE_GITHUB_TOKEN;
  }

  async analyzeRepository(repoUrl: string, onProgress?: (progress: number, message: string) => void): Promise<DeepAnalysisResult> {
    const [owner, repo] = this.parseGitHubUrl(repoUrl);
    
    onProgress?.(5, 'Fetching repository metadata...');
    const metadata = await this.fetchRepositoryMetadata(owner, repo);
    
    onProgress?.(15, 'Analyzing repository structure...');
    const structure = await this.analyzeStructure(owner, repo);
    
    onProgress?.(30, 'Scanning critical files...');
    const criticalFiles = await this.scanCriticalFiles(owner, repo, structure);
    
    onProgress?.(45, 'Analyzing code patterns...');
    const insights = await this.analyzeCode(criticalFiles);
    
    onProgress?.(60, 'Detecting project purpose...');
    const purpose = await this.detectPurpose(structure, insights, metadata);
    
    onProgress?.(70, 'Identifying key features...');
    const keyFeatures = await this.extractKeyFeatures(criticalFiles, insights);
    
    onProgress?.(80, 'Generating setup instructions...');
    const setupSteps = await this.generateSetupSteps(structure, criticalFiles);
    
    onProgress?.(90, 'Calculating quality metrics...');
    const qualityScore = this.calculateQualityScore(structure, insights, metadata);
    
    onProgress?.(95, 'Generating recommendations...');
    const recommendations = this.generateRecommendations(structure, insights, qualityScore);
    
    return {
      repoUrl,
      structure,
      insights,
      metadata,
      purpose,
      targetAudience: this.detectTargetAudience(purpose, structure),
      keyFeatures,
      setupSteps,
      architectureType: this.detectArchitecture(insights, structure),
      qualityScore,
      recommendations,
      stats: {
        totalCommits: metadata.totalCommits || 1000,
        contributors: metadata.contributors,
        stars: metadata.stars,
        lastCommit: metadata.lastCommit.toISOString(),
        openIssues: metadata.openIssues || metadata.issues
      }
    };
  }

  private parseGitHubUrl(url: string): [string, string] {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return [match[1], match[2].replace('.git', '')];
  }

  private async fetchRepositoryMetadata(owner: string, repo: string): Promise<RepositoryMetadata> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
    });
    
    if (!response.ok) throw new Error('Failed to fetch repository metadata');
    const data = await response.json();
    
    // Fetch commit count
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
    });
    const linkHeader = commitsResponse.headers.get('Link');
    const totalCommits = linkHeader ? this.extractLastPageNumber(linkHeader) : 100;

    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
      contributors: await this.fetchContributorCount(owner, repo),
      lastCommit: new Date(data.pushed_at),
      totalCommits,
      openIssues: data.open_issues_count,
      createdAt: new Date(data.created_at),
      license: data.license?.spdx_id || 'None',
      topics: data.topics || [],
      description: data.description || ''
    };
  }

  private async fetchContributorCount(owner: string, repo: string): Promise<number> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1`, {
        headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
      });
      const linkHeader = response.headers.get('Link');
      if (!linkHeader) return 1;
      
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      return match ? parseInt(match[1]) : 1;
    } catch {
      return 1;
    }
  }

  private async analyzeStructure(owner: string, repo: string): Promise<RepositoryStructure> {
    const tree = await this.fetchRepositoryTree(owner, repo);
    const files = this.flattenTree(tree);
    
    const languages = this.detectLanguages(files);
    const dependencies = await this.extractDependencies(owner, repo, files);
    
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
      mainLanguage: this.getMainLanguage(languages),
      languages,
      hasTests: files.some(f => f.path.includes('test') || f.path.includes('spec')),
      hasDocs: files.some(f => f.path.toLowerCase().includes('docs') || f.path.endsWith('.md')),
      hasExamples: files.some(f => f.path.toLowerCase().includes('example')),
      entryPoints: this.findEntryPoints(files),
      configFiles: files.filter(f => this.isConfigFile(f.path)).map(f => f.path),
      dependencies
    };
  }

  private async fetchRepositoryTree(owner: string, repo: string): Promise<any> {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
      {
        headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
      }
    );
    
    if (!response.ok) {
      // Try 'master' branch as fallback
      const masterResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
        {
          headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
        }
      );
      if (!masterResponse.ok) throw new Error('Failed to fetch repository tree');
      return (await masterResponse.json()).tree;
    }
    
    return (await response.json()).tree;
  }

  private flattenTree(tree: any[]): FileInfo[] {
    return tree
      .filter(item => item.type === 'blob')
      .map(item => ({
        path: item.path,
        name: item.path.split('/').pop() || '',
        type: 'file' as const,
        size: item.size || 0,
        language: this.detectFileLanguage(item.path),
        importance: this.calculateFileImportance(item.path)
      }));
  }

  private detectFileLanguage(path: string): string | undefined {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'scala': 'Scala',
      'r': 'R',
      'dart': 'Dart',
      'lua': 'Lua',
      'pl': 'Perl',
      'sh': 'Shell',
      'sql': 'SQL',
      'md': 'Markdown',
      'json': 'JSON',
      'yaml': 'YAML',
      'yml': 'YAML',
      'xml': 'XML',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less'
    };
    
    return ext ? languageMap[ext] : undefined;
  }

  private calculateFileImportance(path: string): 'critical' | 'high' | 'medium' | 'low' {
    const name = path.split('/').pop()?.toLowerCase() || '';
    
    // Critical files
    if (name === 'readme.md' || name === 'package.json' || name === 'requirements.txt' ||
        name === 'cargo.toml' || name === 'go.mod' || name === 'pom.xml' ||
        name === 'index.js' || name === 'index.ts' || name === 'main.py' ||
        name === 'main.go' || name === 'main.rs' || name === 'app.js' || name === 'app.py') {
      return 'critical';
    }
    
    // High importance
    if (path.includes('src/') && (name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.py')) ||
        name === 'setup.py' || name === 'tsconfig.json' || name === 'webpack.config.js' ||
        path.endsWith('.md') || path.includes('docs/')) {
      return 'high';
    }
    
    // Medium importance
    if (path.includes('test') || path.includes('example') || name.endsWith('.yml') || name.endsWith('.yaml')) {
      return 'medium';
    }
    
    return 'low';
  }

  private detectLanguages(files: FileInfo[]): Record<string, number> {
    const languages: Record<string, number> = {};
    
    files.forEach(file => {
      if (file.language) {
        languages[file.language] = (languages[file.language] || 0) + 1;
      }
    });
    
    return languages;
  }

  private getMainLanguage(languages: Record<string, number>): string {
    const entries = Object.entries(languages);
    if (entries.length === 0) return 'Unknown';
    
    // Filter out non-programming languages for main language detection
    const programmingLanguages = entries.filter(([lang]) => 
      !['Markdown', 'JSON', 'YAML', 'XML', 'HTML', 'CSS'].includes(lang)
    );
    
    if (programmingLanguages.length === 0) return entries[0][0];
    
    return programmingLanguages.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  private async extractDependencies(owner: string, repo: string, files: FileInfo[]): Promise<DependencyInfo[]> {
    const dependencies: DependencyInfo[] = [];
    
    // Check for package.json
    if (files.some(f => f.name === 'package.json')) {
      const packageJson = await this.fetchFileContent(owner, repo, 'package.json');
      try {
        const pkg = JSON.parse(packageJson);
        
        // Production dependencies
        Object.entries(pkg.dependencies || {}).forEach(([name, version]) => {
          dependencies.push({ name, version: version as string, type: 'production' });
        });
        
        // Dev dependencies
        Object.entries(pkg.devDependencies || {}).forEach(([name, version]) => {
          dependencies.push({ name, version: version as string, type: 'development' });
        });
      } catch (e) {
        console.error('Failed to parse package.json:', e);
      }
    }
    
    // Check for requirements.txt (Python)
    if (files.some(f => f.name === 'requirements.txt')) {
      const requirements = await this.fetchFileContent(owner, repo, 'requirements.txt');
      requirements.split('\n').forEach(line => {
        const match = line.match(/^([a-zA-Z0-9-_]+)(.*)/);
        if (match) {
          dependencies.push({ 
            name: match[1], 
            version: match[2] || 'latest', 
            type: 'production' 
          });
        }
      });
    }
    
    // Add more dependency file parsers as needed (Cargo.toml, go.mod, etc.)
    
    return dependencies;
  }

  private async fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
    const cacheKey = `${owner}/${repo}/${path}`;
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey)!;
    }
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: this.githubToken ? { Authorization: `token ${this.githubToken}` } : {}
      }
    );
    
    if (!response.ok) throw new Error(`Failed to fetch file: ${path}`);
    
    const data = await response.json();
    const content = atob(data.content);
    
    this.fileCache.set(cacheKey, content);
    return content;
  }

  private findEntryPoints(files: FileInfo[]): string[] {
    const entryPoints: string[] = [];
    const commonEntryPoints = [
      'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
      'server.js', 'server.ts', 'index.py', 'main.py', 'app.py',
      'main.go', 'main.rs', 'Main.java', 'Program.cs'
    ];
    
    files.forEach(file => {
      if (commonEntryPoints.includes(file.name)) {
        entryPoints.push(file.path);
      }
      // Check for executable scripts
      if (file.path.startsWith('bin/') || file.path.startsWith('scripts/')) {
        entryPoints.push(file.path);
      }
    });
    
    return entryPoints;
  }

  private isConfigFile(path: string): boolean {
    const configPatterns = [
      'config', '.json', '.yml', '.yaml', '.toml', '.ini', '.env',
      'rc.js', 'rc.json', '.config.js', '.config.json'
    ];
    
    return configPatterns.some(pattern => path.toLowerCase().includes(pattern));
  }

  private async scanCriticalFiles(owner: string, repo: string, structure: RepositoryStructure): Promise<Map<string, string>> {
    const criticalFiles = new Map<string, string>();
    
    // Always fetch README
    try {
      const readme = await this.fetchFileContent(owner, repo, 'README.md');
      criticalFiles.set('README.md', readme);
    } catch (e) {
      // Try lowercase
      try {
        const readme = await this.fetchFileContent(owner, repo, 'readme.md');
        criticalFiles.set('readme.md', readme);
      } catch (e2) {
        console.log('No README found');
      }
    }
    
    // Fetch package.json if it exists
    if (structure.configFiles.includes('package.json')) {
      try {
        const pkg = await this.fetchFileContent(owner, repo, 'package.json');
        criticalFiles.set('package.json', pkg);
      } catch (e) {
        console.error('Failed to fetch package.json');
      }
    }
    
    // Fetch main entry points
    for (const entryPoint of structure.entryPoints.slice(0, 3)) { // Limit to 3 entry points
      try {
        const content = await this.fetchFileContent(owner, repo, entryPoint);
        criticalFiles.set(entryPoint, content);
      } catch (e) {
        console.error(`Failed to fetch ${entryPoint}`);
      }
    }
    
    return criticalFiles;
  }

  private async analyzeCode(files: Map<string, string>): Promise<CodeInsights> {
    const insights: CodeInsights = {
      exports: [],
      imports: [],
      functions: [],
      classes: [],
      apis: [],
      patterns: []
    };
    
    files.forEach((content, path) => {
      if (path.endsWith('.ts') || path.endsWith('.js') || path.endsWith('.tsx') || path.endsWith('.jsx')) {
        // Extract exports
        const exportMatches = content.matchAll(/export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g);
        for (const match of exportMatches) {
          insights.exports.push(match[1]);
        }
        
        // Extract imports
        const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
        for (const match of importMatches) {
          insights.imports.push(match[1]);
        }
        
        // Extract functions
        const functionMatches = content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
        for (const match of functionMatches) {
          insights.functions.push(match[1]);
        }
        
        // Extract classes
        const classMatches = content.matchAll(/(?:export\s+)?class\s+(\w+)/g);
        for (const match of classMatches) {
          insights.classes.push(match[1]);
        }
        
        // Extract API routes (Express pattern)
        const apiMatches = content.matchAll(/app\.(get|post|put|delete|patch)\s*\(\s*['"](.+?)['"]/g);
        for (const match of apiMatches) {
          insights.apis.push(`${match[1].toUpperCase()} ${match[2]}`);
        }
      }
      
      // Python analysis
      if (path.endsWith('.py')) {
        // Extract functions
        const pyFunctionMatches = content.matchAll(/def\s+(\w+)\s*\(/g);
        for (const match of pyFunctionMatches) {
          insights.functions.push(match[1]);
        }
        
        // Extract classes
        const pyClassMatches = content.matchAll(/class\s+(\w+)/g);
        for (const match of pyClassMatches) {
          insights.classes.push(match[1]);
        }
      }
    });
    
    // Detect architectural patterns
    insights.patterns = this.detectPatterns(insights, files);
    
    return insights;
  }

  private detectPatterns(insights: CodeInsights, files: Map<string, string>): string[] {
    const patterns: string[] = [];
    
    // Check for MVC pattern
    const hasControllers = Array.from(files.keys()).some(path => path.includes('controller'));
    const hasModels = Array.from(files.keys()).some(path => path.includes('model'));
    const hasViews = Array.from(files.keys()).some(path => path.includes('view'));
    
    if (hasControllers && hasModels) {
      patterns.push('MVC');
    }
    
    // Check for microservices
    const hasMultipleServices = Array.from(files.keys()).filter(path => path.includes('service')).length > 3;
    if (hasMultipleServices) {
      patterns.push('Microservices');
    }
    
    // Check for REST API
    if (insights.apis.length > 0) {
      patterns.push('REST API');
    }
    
    // Check for React/Vue/Angular
    if (insights.imports.some(imp => imp.includes('react'))) {
      patterns.push('React');
    }
    if (insights.imports.some(imp => imp.includes('vue'))) {
      patterns.push('Vue');
    }
    if (insights.imports.some(imp => imp.includes('@angular'))) {
      patterns.push('Angular');
    }
    
    return patterns;
  }

  private async detectPurpose(structure: RepositoryStructure, insights: CodeInsights, metadata: RepositoryMetadata): Promise<string> {
    // Use a combination of factors to determine purpose
    const hints: string[] = [];
    
    // From metadata
    if (metadata.description) {
      hints.push(metadata.description);
    }
    
    // From structure
    if (insights.apis.length > 0) {
      hints.push('API service');
    }
    if (structure.hasTests) {
      hints.push('with comprehensive testing');
    }
    if (insights.patterns.includes('React') || insights.patterns.includes('Vue') || insights.patterns.includes('Angular')) {
      hints.push('Frontend application');
    }
    if (structure.dependencies.some(d => d.name.includes('express') || d.name.includes('fastapi') || d.name.includes('django'))) {
      hints.push('Backend service');
    }
    
    // From topics
    if (metadata.topics.length > 0) {
      hints.push(...metadata.topics);
    }
    
    // Combine hints into a coherent purpose
    return this.synthesizePurpose(hints, structure.mainLanguage);
  }

  private synthesizePurpose(hints: string[], mainLanguage: string): string {
    const hintString = hints.join(' ');
    
    // Common project types
    if (hintString.includes('API') || hintString.includes('backend')) {
      return `A ${mainLanguage} backend service that provides RESTful APIs`;
    }
    if (hintString.includes('frontend') || hintString.includes('React') || hintString.includes('Vue')) {
      return `A modern web application built with ${mainLanguage}`;
    }
    if (hintString.includes('CLI') || hintString.includes('command')) {
      return `A command-line tool written in ${mainLanguage}`;
    }
    if (hintString.includes('library') || hintString.includes('package')) {
      return `A ${mainLanguage} library for developers`;
    }
    if (hintString.includes('game')) {
      return `A game developed in ${mainLanguage}`;
    }
    if (hintString.includes('machine learning') || hintString.includes('ML') || hintString.includes('AI')) {
      return `A machine learning project using ${mainLanguage}`;
    }
    
    // Default
    return hints[0] || `A ${mainLanguage} project`;
  }

  private detectTargetAudience(purpose: string, structure: RepositoryStructure): string {
    if (purpose.includes('library') || purpose.includes('package') || purpose.includes('framework')) {
      return 'Developers building ' + structure.mainLanguage + ' applications';
    }
    if (purpose.includes('API') || purpose.includes('backend')) {
      return 'Frontend developers and API consumers';
    }
    if (purpose.includes('CLI') || purpose.includes('command')) {
      return 'DevOps engineers and system administrators';
    }
    if (purpose.includes('web application')) {
      return 'End users and web developers';
    }
    if (purpose.includes('machine learning')) {
      return 'Data scientists and ML engineers';
    }
    
    return 'Developers and technical users';
  }

  private async extractKeyFeatures(files: Map<string, string>, insights: CodeInsights): Promise<string[]> {
    const features: string[] = [];
    
    // Extract from README
    const readme = files.get('README.md') || files.get('readme.md') || '';
    if (readme) {
      // Look for Features section
      const featuresMatch = readme.match(/##?\s*Features([\s\S]*?)(?=##|$)/i);
      if (featuresMatch) {
        const featureLines = featuresMatch[1].match(/[-*]\s+(.+)/g);
        if (featureLines) {
          features.push(...featureLines.map(line => line.replace(/[-*]\s+/, '').trim()));
        }
      }
    }
    
    // Infer from code insights
    if (insights.apis.length > 0) {
      features.push(`${insights.apis.length} REST API endpoints`);
    }
    if (insights.patterns.includes('React')) {
      features.push('Modern React UI with hooks');
    }
    if (insights.patterns.includes('TypeScript')) {
      features.push('Type-safe development with TypeScript');
    }
    
    return features.slice(0, 6); // Limit to 6 features
  }

  private async generateSetupSteps(structure: RepositoryStructure, files: Map<string, string>): Promise<string[]> {
    const steps: string[] = [];
    
    // Clone repository
    steps.push('Clone the repository');
    
    // Language-specific setup
    if (structure.configFiles.includes('package.json')) {
      steps.push('Install dependencies with `npm install` or `yarn`');
      
      // Check for scripts in package.json
      const packageJson = files.get('package.json');
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson);
          if (pkg.scripts?.dev) {
            steps.push('Run development server with `npm run dev`');
          } else if (pkg.scripts?.start) {
            steps.push('Start the application with `npm start`');
          }
        } catch (e) {
          console.error('Failed to parse package.json for scripts');
        }
      }
    }
    
    if (structure.configFiles.includes('requirements.txt')) {
      steps.push('Create virtual environment with `python -m venv venv`');
      steps.push('Activate virtual environment');
      steps.push('Install dependencies with `pip install -r requirements.txt`');
    }
    
    if (structure.configFiles.includes('Cargo.toml')) {
      steps.push('Build the project with `cargo build`');
      steps.push('Run the project with `cargo run`');
    }
    
    if (structure.configFiles.includes('go.mod')) {
      steps.push('Install dependencies with `go mod download`');
      steps.push('Run the project with `go run .`');
    }
    
    // Environment setup
    if (structure.configFiles.some(f => f.includes('.env'))) {
      steps.push('Copy `.env.example` to `.env` and configure environment variables');
    }
    
    return steps;
  }

  private detectArchitecture(insights: CodeInsights, structure: RepositoryStructure): string {
    if (insights.patterns.includes('Microservices')) {
      return 'Microservices Architecture';
    }
    if (insights.patterns.includes('MVC')) {
      return 'Model-View-Controller (MVC)';
    }
    if (structure.entryPoints.length > 3 && structure.totalFiles > 50) {
      return 'Modular Architecture';
    }
    if (insights.apis.length > 0 && insights.patterns.some(p => ['React', 'Vue', 'Angular'].includes(p))) {
      return 'Full-Stack Application';
    }
    if (insights.apis.length > 0) {
      return 'RESTful API Service';
    }
    if (insights.patterns.some(p => ['React', 'Vue', 'Angular'].includes(p))) {
      return 'Single Page Application (SPA)';
    }
    
    return 'Monolithic Architecture';
  }

  private calculateQualityScore(structure: RepositoryStructure, insights: CodeInsights, metadata: RepositoryMetadata): number {
    let score = 50; // Base score
    
    // Documentation
    if (structure.hasDocs) score += 10;
    if (metadata.description) score += 5;
    
    // Testing
    if (structure.hasTests) score += 15;
    
    // Examples
    if (structure.hasExamples) score += 5;
    
    // Activity
    const daysSinceLastCommit = (Date.now() - metadata.lastCommit.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastCommit < 30) score += 10;
    else if (daysSinceLastCommit < 90) score += 5;
    
    // Community
    if (metadata.stars > 100) score += 5;
    if (metadata.contributors > 5) score += 5;
    
    // License
    if (metadata.license !== 'None') score += 5;
    
    return Math.min(100, score);
  }

  private generateRecommendations(structure: RepositoryStructure, insights: CodeInsights, qualityScore: number): string[] {
    const recommendations: string[] = [];
    
    if (!structure.hasTests) {
      recommendations.push('Add unit tests to improve code reliability');
    }
    
    if (!structure.hasDocs) {
      recommendations.push('Create documentation for better developer onboarding');
    }
    
    if (!structure.hasExamples) {
      recommendations.push('Add example usage to help new users get started');
    }
    
    if (qualityScore < 70) {
      recommendations.push('Consider adding CI/CD pipelines for automated testing');
    }
    
    if (structure.dependencies.filter(d => d.type === 'production').length > 50) {
      recommendations.push('Review dependencies to reduce bundle size');
    }
    
    if (!insights.patterns.includes('TypeScript') && structure.mainLanguage === 'JavaScript') {
      recommendations.push('Consider migrating to TypeScript for better type safety');
    }
    
    return recommendations;
  }

  private extractLastPageNumber(linkHeader: string): number {
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1]) : 100;
  }
}