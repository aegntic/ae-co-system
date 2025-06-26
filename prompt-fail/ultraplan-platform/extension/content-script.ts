// UltraPlan Content Script - Analyzes repositories on GitHub/GitLab/Bitbucket
import { ProjectAnalysis, Problem, ProblemType, TechStack, ProjectStructure } from '../shared/types';

class RepositoryAnalyzer {
  private platform: 'github' | 'gitlab' | 'bitbucket';
  private repoUrl: string;
  private repoName: string;
  private owner: string;

  constructor() {
    this.detectPlatform();
    this.injectAnalyzerButton();
  }

  private detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('github.com')) {
      this.platform = 'github';
    } else if (hostname.includes('gitlab.com')) {
      this.platform = 'gitlab';
    } else if (hostname.includes('bitbucket.org')) {
      this.platform = 'bitbucket';
    }
    
    this.parseRepoInfo();
  }

  private parseRepoInfo() {
    const pathParts = window.location.pathname.split('/').filter(p => p);
    if (pathParts.length >= 2) {
      this.owner = pathParts[0];
      this.repoName = pathParts[1];
      this.repoUrl = `https://${window.location.hostname}/${this.owner}/${this.repoName}`;
    }
  }

  private injectAnalyzerButton() {
    const button = this.createAnalyzerButton();
    const targetElement = this.findButtonLocation();
    
    if (targetElement && !document.querySelector('#ultraplan-analyzer-btn')) {
      targetElement.appendChild(button);
    }
  }

  private createAnalyzerButton(): HTMLElement {
    const button = document.createElement('button');
    button.id = 'ultraplan-analyzer-btn';
    button.className = 'ultraplan-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 11H3m6 0V5m0 6l-6-6m15 6h6m-6 0v6m0-6l6-6m-6 15v-6m0 6l-6-6m-6 6l6-6"/>
      </svg>
      <span>Analyze with UltraPlan</span>
    `;
    
    button.addEventListener('click', () => this.startAnalysis());
    return button;
  }

  private findButtonLocation(): Element | null {
    // Platform-specific button placement
    switch (this.platform) {
      case 'github':
        return document.querySelector('.pagehead-actions') || 
               document.querySelector('.file-navigation');
      case 'gitlab':
        return document.querySelector('.project-buttons') || 
               document.querySelector('.tree-controls');
      case 'bitbucket':
        return document.querySelector('.repo-actions') || 
               document.querySelector('.aui-buttons');
      default:
        return null;
    }
  }

  private async startAnalysis() {
    this.showLoadingState();
    
    try {
      const projectData = await this.gatherProjectData();
      const analysis = this.analyzeProject(projectData);
      
      // Send to extension background script
      chrome.runtime.sendMessage({
        type: 'ANALYSIS_COMPLETE',
        payload: analysis
      });
      
      this.showSuccessState();
    } catch (error) {
      this.showErrorState(error.message);
    }
  }

  private async gatherProjectData() {
    const data = {
      files: await this.getFileStructure(),
      dependencies: await this.getDependencies(),
      config: await this.getConfigFiles(),
      stats: await this.getRepoStats()
    };
    
    return data;
  }

  private async getFileStructure() {
    // Use platform API to get file tree
    const apiUrl = this.getApiUrl('tree');
    const response = await fetch(apiUrl);
    return response.json();
  }

  private async getDependencies() {
    const depFiles = ['package.json', 'requirements.txt', 'Gemfile', 'go.mod', 'Cargo.toml'];
    const dependencies = {};
    
    for (const file of depFiles) {
      try {
        const content = await this.getFileContent(file);
        if (content) {
          dependencies[file] = this.parseDependencyFile(file, content);
        }
      } catch (e) {
        // File doesn't exist, continue
      }
    }
    
    return dependencies;
  }

  private async getConfigFiles() {
    const configFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'bitbucket-pipelines.yml',
      'Dockerfile',
      'docker-compose.yml',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.js'
    ];
    
    const configs = [];
    for (const file of configFiles) {
      const exists = await this.fileExists(file);
      if (exists) {
        configs.push({
          path: file,
          type: this.getConfigType(file),
          valid: true
        });
      }
    }
    
    return configs;
  }

  private analyzeProject(projectData: any): ProjectAnalysis {
    const problems = this.identifyProblems(projectData);
    const techStack = this.detectTechStack(projectData);
    const structure = this.analyzeStructure(projectData);
    
    return {
      id: this.generateId(),
      url: this.repoUrl,
      platform: this.platform,
      name: this.repoName,
      description: this.getRepoDescription(),
      techStack,
      problems,
      dependencies: this.analyzeDependencies(projectData),
      structure,
      metrics: this.calculateMetrics(projectData),
      timestamp: new Date()
    };
  }

  private identifyProblems(data: any): Problem[] {
    const problems: Problem[] = [];
    
    // Check for missing tests
    if (!this.hasTests(data)) {
      problems.push({
        id: this.generateId(),
        type: ProblemType.MISSING_TESTS,
        severity: 'high',
        title: 'No test suite detected',
        description: 'Project lacks automated tests, increasing risk of regressions',
        suggestedFix: 'Add test framework and write unit tests for critical functions',
        estimatedEffort: 16
      });
    }
    
    // Check for CI/CD
    if (!this.hasCICD(data)) {
      problems.push({
        id: this.generateId(),
        type: ProblemType.NO_CI_CD,
        severity: 'medium',
        title: 'No CI/CD pipeline configured',
        description: 'Automated build and deployment pipeline is missing',
        suggestedFix: 'Set up GitHub Actions, GitLab CI, or similar',
        estimatedEffort: 4
      });
    }
    
    // Check dependencies
    const outdated = this.findOutdatedDependencies(data);
    if (outdated.length > 0) {
      problems.push({
        id: this.generateId(),
        type: ProblemType.OUTDATED_DEPENDENCIES,
        severity: 'medium',
        title: `${outdated.length} outdated dependencies`,
        description: 'Dependencies need updating for security and performance',
        suggestedFix: 'Update dependencies using appropriate package manager',
        estimatedEffort: 2
      });
    }
    
    return problems;
  }

  private showLoadingState() {
    const btn = document.querySelector('#ultraplan-analyzer-btn');
    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Analyzing...';
      btn.setAttribute('disabled', 'true');
    }
  }

  private showSuccessState() {
    const btn = document.querySelector('#ultraplan-analyzer-btn');
    if (btn) {
      btn.innerHTML = '✓ Analysis Complete';
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 11H3m6 0V5m0 6l-6-6m15 6h6m-6 0v6m0-6l6-6m-6 15v-6m0 6l-6-6m-6 6l6-6"/>
          </svg>
          <span>View Plan</span>
        `;
        btn.removeAttribute('disabled');
      }, 2000);
    }
  }

  private showErrorState(error: string) {
    const btn = document.querySelector('#ultraplan-analyzer-btn');
    if (btn) {
      btn.innerHTML = '✗ Analysis Failed';
      btn.removeAttribute('disabled');
    }
  }

  // Helper methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getApiUrl(endpoint: string): string {
    switch (this.platform) {
      case 'github':
        return `https://api.github.com/repos/${this.owner}/${this.repoName}/${endpoint}`;
      case 'gitlab':
        return `https://gitlab.com/api/v4/projects/${encodeURIComponent(`${this.owner}/${this.repoName}`)}/${endpoint}`;
      case 'bitbucket':
        return `https://api.bitbucket.org/2.0/repositories/${this.owner}/${this.repoName}/${endpoint}`;
      default:
        return '';
    }
  }

  private async getFileContent(path: string): Promise<string | null> {
    try {
      const apiUrl = this.getApiUrl(`contents/${path}`);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.content) {
        return atob(data.content);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      const content = await this.getFileContent(path);
      return content !== null;
    } catch (e) {
      return false;
    }
  }

  private hasTests(data: any): boolean {
    const testIndicators = ['test', 'spec', '__tests__', 'tests'];
    return data.files.some((file: any) => 
      testIndicators.some(indicator => file.path.includes(indicator))
    );
  }

  private hasCICD(data: any): boolean {
    const ciFiles = ['.github/workflows', '.gitlab-ci.yml', 'bitbucket-pipelines.yml'];
    return data.config.some((config: any) => 
      ciFiles.some(ci => config.path.includes(ci))
    );
  }

  private detectTechStack(data: any): TechStack {
    // Simplified tech stack detection
    return {
      languages: this.detectLanguages(data),
      frameworks: this.detectFrameworks(data),
      databases: this.detectDatabases(data),
      tools: this.detectTools(data),
      packageManagers: this.detectPackageManagers(data)
    };
  }

  private detectLanguages(data: any): any[] {
    // Implement language detection based on file extensions
    const languages = [];
    const extensions = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.cs': 'C#'
    };
    
    // Count files by extension
    const counts = {};
    data.files.forEach((file: any) => {
      const ext = file.path.substring(file.path.lastIndexOf('.'));
      if (extensions[ext]) {
        counts[extensions[ext]] = (counts[extensions[ext]] || 0) + 1;
      }
    });
    
    return Object.entries(counts).map(([name, files]) => ({
      name,
      files,
      percentage: (files as number / data.files.length) * 100
    }));
  }

  private detectFrameworks(data: any): any[] {
    const frameworks = [];
    
    // Check dependencies for frameworks
    if (data.dependencies['package.json']) {
      const deps = data.dependencies['package.json'];
      if (deps.react) frameworks.push({ name: 'React', category: 'frontend' });
      if (deps.vue) frameworks.push({ name: 'Vue', category: 'frontend' });
      if (deps.angular) frameworks.push({ name: 'Angular', category: 'frontend' });
      if (deps.express) frameworks.push({ name: 'Express', category: 'backend' });
      if (deps.next) frameworks.push({ name: 'Next.js', category: 'fullstack' });
    }
    
    return frameworks;
  }

  private parseDependencyFile(filename: string, content: string): any {
    try {
      if (filename === 'package.json') {
        const pkg = JSON.parse(content);
        return { ...pkg.dependencies, ...pkg.devDependencies };
      }
      // Add parsers for other dependency files
      return {};
    } catch (e) {
      return {};
    }
  }

  private findOutdatedDependencies(data: any): string[] {
    // Simplified - in production would check against npm registry
    return [];
  }

  private getRepoDescription(): string {
    // Get from page meta or API
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc?.getAttribute('content') || '';
  }

  private analyzeStructure(data: any): ProjectStructure {
    return {
      rootPath: '/',
      directories: this.identifyDirectories(data),
      entryPoints: this.findEntryPoints(data),
      configFiles: data.config
    };
  }

  private identifyDirectories(data: any): any[] {
    // Group files by directory
    const dirs = {};
    data.files.forEach((file: any) => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      if (dir) {
        dirs[dir] = (dirs[dir] || 0) + 1;
      }
    });
    
    return Object.entries(dirs).map(([path, fileCount]) => ({
      path,
      fileCount,
      purpose: this.inferDirectoryPurpose(path),
      subdirectories: []
    }));
  }

  private inferDirectoryPurpose(path: string): string {
    const purposes = {
      'src': 'Source code',
      'test': 'Test files',
      'docs': 'Documentation',
      'public': 'Public assets',
      'config': 'Configuration',
      'scripts': 'Build/utility scripts',
      'components': 'UI components',
      'pages': 'Page components',
      'api': 'API routes',
      'lib': 'Library code',
      'utils': 'Utility functions'
    };
    
    for (const [key, purpose] of Object.entries(purposes)) {
      if (path.includes(key)) return purpose;
    }
    return 'General';
  }

  private findEntryPoints(data: any): string[] {
    const entryPoints = [];
    const commonEntries = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'];
    
    data.files.forEach((file: any) => {
      if (commonEntries.some(entry => file.path.endsWith(entry))) {
        entryPoints.push(file.path);
      }
    });
    
    return entryPoints;
  }

  private analyzeDependencies(data: any): any[] {
    // Simplified dependency graph
    return [];
  }

  private calculateMetrics(data: any): any {
    return {
      totalFiles: data.files.length,
      totalLines: 0, // Would need to fetch file contents
      lastCommit: new Date(),
      contributors: 1
    };
  }

  private detectDatabases(data: any): string[] {
    const databases = [];
    const dbIndicators = {
      'postgres': ['pg', 'postgresql'],
      'mysql': ['mysql2', 'mysql'],
      'mongodb': ['mongoose', 'mongodb'],
      'redis': ['redis', 'ioredis'],
      'sqlite': ['sqlite3', 'better-sqlite3']
    };
    
    if (data.dependencies['package.json']) {
      const deps = Object.keys(data.dependencies['package.json']);
      for (const [db, indicators] of Object.entries(dbIndicators)) {
        if (indicators.some(ind => deps.some(dep => dep.includes(ind)))) {
          databases.push(db);
        }
      }
    }
    
    return databases;
  }

  private detectTools(data: any): any[] {
    const tools = [];
    
    // Check for CI/CD
    if (data.config.some((c: any) => c.path.includes('.github/workflows'))) {
      tools.push({ name: 'GitHub Actions', category: 'ci/cd', configured: true });
    }
    
    // Check for testing
    if (data.dependencies['package.json']?.jest) {
      tools.push({ name: 'Jest', category: 'testing', configured: true });
    }
    
    // Check for linting
    if (data.config.some((c: any) => c.path.includes('eslint'))) {
      tools.push({ name: 'ESLint', category: 'linting', configured: true });
    }
    
    return tools;
  }

  private detectPackageManagers(data: any): string[] {
    const managers = [];
    
    if (data.files.some((f: any) => f.path === 'package.json')) managers.push('npm');
    if (data.files.some((f: any) => f.path === 'yarn.lock')) managers.push('yarn');
    if (data.files.some((f: any) => f.path === 'pnpm-lock.yaml')) managers.push('pnpm');
    if (data.files.some((f: any) => f.path === 'bun.lockb')) managers.push('bun');
    if (data.files.some((f: any) => f.path === 'requirements.txt')) managers.push('pip');
    if (data.files.some((f: any) => f.path === 'Gemfile')) managers.push('bundler');
    
    return managers;
  }

  private getConfigType(path: string): string {
    const types = {
      'workflows': 'ci/cd',
      'gitlab-ci': 'ci/cd',
      'bitbucket-pipelines': 'ci/cd',
      'Dockerfile': 'container',
      'docker-compose': 'container',
      'tsconfig': 'typescript',
      'webpack': 'bundler',
      'vite': 'bundler'
    };
    
    for (const [key, type] of Object.entries(types)) {
      if (path.includes(key)) return type;
    }
    return 'config';
  }

  private async getRepoStats() {
    // Get repository statistics from API
    try {
      const apiUrl = this.getApiUrl('');
      const response = await fetch(apiUrl);
      return response.json();
    } catch (e) {
      return {};
    }
  }
}

// Initialize analyzer when on a repository page
if (window.location.pathname.split('/').filter(p => p).length >= 2) {
  new RepositoryAnalyzer();
}