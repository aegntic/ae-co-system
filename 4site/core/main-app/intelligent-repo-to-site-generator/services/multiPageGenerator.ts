import { RepositoryStructure } from './repositoryAnalyzer';
import { AIAnalysisResult } from './aiOrchestrator';
import { SiteData, GeneratedVisuals } from '../types';

export interface MultiPageSiteData extends SiteData {
  pages: SitePage[];
  navigation: NavigationStructure;
  globalStyles: GlobalStyles;
  interactiveElements: InteractiveElement[];
  seoData: SEOData;
  analytics: AnalyticsConfig;
  deploymentPackage: DeploymentPackage;
}

export interface SitePage {
  id: string;
  title: string;
  slug: string;
  template: PageTemplate;
  sections: PageSection[];
  metadata: PageMetadata;
  interactiveFeatures: InteractiveFeature[];
  customizations: PageCustomizations;
}

export interface PageSection {
  id: string;
  type: SectionType;
  title: string;
  content: SectionContent;
  layout: SectionLayout;
  styling: SectionStyling;
  order: number;
}

export interface NavigationStructure {
  primary: NavItem[];
  secondary: NavItem[];
  footer: NavItem[];
  breadcrumb: boolean;
  searchEnabled: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  external?: boolean;
}

export interface InteractiveElement {
  id: string;
  type: 'demo' | 'diagram' | 'video' | 'slideshow' | 'interactive-code' | 'api-explorer';
  title: string;
  description: string;
  content: any;
  placement: ElementPlacement[];
}

export interface ElementPlacement {
  pageId: string;
  sectionId: string;
  position: 'before' | 'after' | 'inline' | 'overlay';
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  openGraph: OpenGraphData;
  schema: SchemaData;
  canonicalUrl?: string;
}

export interface DeploymentPackage {
  staticFiles: StaticFile[];
  buildScript: string;
  dependencies: PackageDependency[];
  environmentVariables: EnvironmentVariable[];
  deploymentConfigs: DeploymentConfig[];
}

export enum PageTemplate {
  OVERVIEW = 'overview',
  TECHNICAL_DOCS = 'technical_docs',
  API_REFERENCE = 'api_reference',
  GETTING_STARTED = 'getting_started',
  ARCHITECTURE = 'architecture',
  EXAMPLES = 'examples',
  CONTRIBUTING = 'contributing',
  CHANGELOG = 'changelog',
  CUSTOM = 'custom'
}

export enum SectionType {
  HERO = 'hero',
  OVERVIEW = 'overview',
  FEATURES = 'features',
  INSTALLATION = 'installation',
  QUICK_START = 'quick_start',
  API_DOCS = 'api_docs',
  EXAMPLES = 'examples',
  ARCHITECTURE_DIAGRAM = 'architecture_diagram',
  DEPENDENCIES = 'dependencies',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  DEPLOYMENT = 'deployment',
  TESTIMONIALS = 'testimonials',
  COMMUNITY = 'community',
  SUPPORT = 'support',
  CTA = 'cta'
}

interface SectionContent {
  text?: string;
  code?: CodeBlock[];
  images?: ImageAsset[];
  links?: LinkItem[];
  data?: any;
}

interface CodeBlock {
  language: string;
  code: string;
  title?: string;
  filename?: string;
  highlightLines?: number[];
  executable?: boolean;
}

interface ImageAsset {
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface LinkItem {
  text: string;
  url: string;
  external: boolean;
  icon?: string;
}

interface SectionLayout {
  columns: number;
  alignment: 'left' | 'center' | 'right';
  spacing: 'tight' | 'normal' | 'loose';
  background?: string;
}

interface SectionStyling {
  theme: 'light' | 'dark' | 'brand';
  customCSS?: string;
  animations?: AnimationConfig[];
}

interface AnimationConfig {
  type: 'fadeIn' | 'slideUp' | 'parallax' | 'typewriter';
  duration: number;
  delay?: number;
  trigger: 'scroll' | 'load' | 'hover';
}

interface PageMetadata {
  description: string;
  keywords: string[];
  lastModified: string;
  author?: string;
  estimatedReadTime: number;
}

interface InteractiveFeature {
  type: 'live-demo' | 'code-editor' | 'api-playground' | 'search' | 'filter';
  config: any;
}

interface PageCustomizations {
  colorOverrides?: Record<string, string>;
  fontOverrides?: Record<string, string>;
  componentOverrides?: Record<string, any>;
}

interface GlobalStyles {
  colorScheme: ColorScheme;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  breakpoints: BreakpointConfig;
  animations: GlobalAnimationConfig;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface TypographyConfig {
  fontFamily: string;
  headingFont?: string;
  codeFont: string;
  baseFontSize: string;
  lineHeight: string;
  fontWeights: Record<string, number>;
}

interface SpacingConfig {
  baseUnit: string;
  scale: number[];
}

interface BreakpointConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

interface GlobalAnimationConfig {
  duration: string;
  easing: string;
  reducedMotion: boolean;
}

interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

interface SchemaData {
  type: string;
  data: any;
}

interface StaticFile {
  path: string;
  content: string | Buffer;
  mimeType: string;
}

interface PackageDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

interface EnvironmentVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

interface DeploymentConfig {
  platform: string;
  config: any;
}

export class MultiPageGenerator {
  constructor(
    private repositoryStructure: RepositoryStructure,
    private aiAnalysis: AIAnalysisResult,
    private visuals: GeneratedVisuals
  ) {}

  async generateCompleteSite(
    repoUrl: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<MultiPageSiteData> {
    onProgress?.('planning', 10);
    
    // 1. Plan site structure
    const siteStructure = await this.planSiteStructure();
    
    onProgress?.('pages', 30);
    
    // 2. Generate individual pages
    const pages = await this.generatePages(siteStructure);
    
    onProgress?.('interactive', 50);
    
    // 3. Create interactive elements
    const interactiveElements = await this.generateInteractiveElements();
    
    onProgress?.('styling', 70);
    
    // 4. Generate global styles and navigation
    const globalStyles = this.generateGlobalStyles();
    const navigation = this.generateNavigation(pages);
    
    onProgress?.('seo', 85);
    
    // 5. Generate SEO and metadata
    const seoData = this.generateSEOData();
    
    onProgress?.('deployment', 95);
    
    // 6. Create deployment package
    const deploymentPackage = await this.createDeploymentPackage(pages, globalStyles);
    
    onProgress?.('complete', 100);

    const projectName = this.extractProjectName(repoUrl);
    
    return {
      id: Date.now().toString(),
      title: this.aiAnalysis.overview.title,
      repoUrl,
      generatedMarkdown: this.generateMarkdownSummary(),
      sections: this.convertToLegacySections(pages),
      template: this.determineTemplate(),
      tier: 'enhanced',
      visuals: this.visuals,
      pages,
      navigation,
      globalStyles,
      interactiveElements,
      seoData,
      analytics: this.generateAnalyticsConfig(),
      deploymentPackage,
    };
  }

  private async planSiteStructure(): Promise<SiteStructurePlan> {
    const plan: SiteStructurePlan = {
      pageTypes: [],
      contentStrategy: 'comprehensive',
      interactiveLevel: 'high',
      targetAudience: this.aiAnalysis.overview.targetAudience,
    };

    // Determine which pages to include based on project analysis
    plan.pageTypes.push(PageTemplate.OVERVIEW); // Always include overview

    if (this.repositoryStructure.documentation.readme || 
        this.aiAnalysis.overview.description.length > 200) {
      plan.pageTypes.push(PageTemplate.GETTING_STARTED);
    }

    if (this.repositoryStructure.files.some(f => f.exports.length > 0) ||
        this.aiAnalysis.architecture.components.length > 3) {
      plan.pageTypes.push(PageTemplate.API_REFERENCE);
    }

    if (this.aiAnalysis.architecture.pattern !== 'simple') {
      plan.pageTypes.push(PageTemplate.ARCHITECTURE);
    }

    if (this.repositoryStructure.files.some(f => 
      f.path.includes('example') || f.path.includes('demo'))) {
      plan.pageTypes.push(PageTemplate.EXAMPLES);
    }

    if (this.repositoryStructure.documentation.contributing) {
      plan.pageTypes.push(PageTemplate.CONTRIBUTING);
    }

    return plan;
  }

  private async generatePages(plan: SiteStructurePlan): Promise<SitePage[]> {
    const pages: SitePage[] = [];

    for (const pageType of plan.pageTypes) {
      const page = await this.generatePage(pageType);
      pages.push(page);
    }

    return pages;
  }

  private async generatePage(pageType: PageTemplate): Promise<SitePage> {
    const pageId = pageType.toString();
    const slug = pageType.replace('_', '-');

    const page: SitePage = {
      id: pageId,
      title: this.getPageTitle(pageType),
      slug,
      template: pageType,
      sections: await this.generatePageSections(pageType),
      metadata: this.generatePageMetadata(pageType),
      interactiveFeatures: this.generatePageInteractiveFeatures(pageType),
      customizations: {},
    };

    return page;
  }

  private async generatePageSections(pageType: PageTemplate): Promise<PageSection[]> {
    const sections: PageSection[] = [];

    switch (pageType) {
      case PageTemplate.OVERVIEW:
        sections.push(
          this.createHeroSection(),
          this.createOverviewSection(),
          this.createFeaturesSection(),
          this.createQuickStartSection(),
          this.createCTASection()
        );
        break;

      case PageTemplate.GETTING_STARTED:
        sections.push(
          this.createInstallationSection(),
          this.createQuickStartSection(),
          this.createExamplesSection(),
          this.createTroubleshootingSection()
        );
        break;

      case PageTemplate.API_REFERENCE:
        sections.push(
          this.createAPIOverviewSection(),
          ...this.createAPIEndpointSections(),
          this.createSDKSection()
        );
        break;

      case PageTemplate.ARCHITECTURE:
        sections.push(
          this.createArchitectureOverviewSection(),
          this.createComponentsSection(),
          this.createDataFlowSection(),
          this.createScalabilitySection()
        );
        break;

      case PageTemplate.EXAMPLES:
        sections.push(
          this.createExamplesOverviewSection(),
          ...this.createExampleSections(),
          this.createLiveDemoSection()
        );
        break;

      default:
        sections.push(this.createGenericSection(pageType));
    }

    return sections.map((section, index) => ({
      ...section,
      order: index,
    }));
  }

  // Section Creation Methods
  private createHeroSection(): PageSection {
    return {
      id: 'hero',
      type: SectionType.HERO,
      title: this.aiAnalysis.overview.title,
      content: {
        text: `${this.aiAnalysis.overview.tagline}\n\n${this.aiAnalysis.overview.description}`,
        images: [{
          url: this.visuals.heroImage,
          alt: `${this.aiAnalysis.overview.title} hero image`,
          width: 1200,
          height: 600,
        }],
        links: [{
          text: 'Get Started',
          url: '/getting-started',
          external: false,
          icon: 'ArrowRight',
        }, {
          text: 'View on GitHub',
          url: this.repositoryStructure.files[0]?.path || '#',
          external: true,
          icon: 'Github',
        }],
      },
      layout: {
        columns: 2,
        alignment: 'center',
        spacing: 'loose',
        background: 'gradient',
      },
      styling: {
        theme: 'dark',
        animations: [{
          type: 'fadeIn',
          duration: 1000,
          trigger: 'load',
        }],
      },
      order: 0,
    };
  }

  private createFeaturesSection(): PageSection {
    return {
      id: 'features',
      type: SectionType.FEATURES,
      title: 'Key Features',
      content: {
        text: this.aiAnalysis.overview.keyFeatures.map(feature => 
          `• ${feature}`
        ).join('\n'),
      },
      layout: {
        columns: 3,
        alignment: 'center',
        spacing: 'normal',
      },
      styling: {
        theme: 'light',
        animations: [{
          type: 'slideUp',
          duration: 800,
          trigger: 'scroll',
        }],
      },
      order: 1,
    };
  }

  private createArchitectureOverviewSection(): PageSection {
    return {
      id: 'architecture-overview',
      type: SectionType.ARCHITECTURE_DIAGRAM,
      title: 'System Architecture',
      content: {
        text: `Architecture Pattern: ${this.aiAnalysis.architecture.pattern}\n\n${this.aiAnalysis.architecture.scalabilityAssessment}`,
        data: {
          components: this.aiAnalysis.architecture.components,
          dataFlow: this.aiAnalysis.architecture.dataFlow,
          integrations: this.aiAnalysis.architecture.integrations,
        },
      },
      layout: {
        columns: 1,
        alignment: 'center',
        spacing: 'loose',
      },
      styling: {
        theme: 'light',
        animations: [{
          type: 'fadeIn',
          duration: 1200,
          trigger: 'scroll',
        }],
      },
      order: 0,
    };
  }

  private createAPIEndpointSections(): PageSection[] {
    // Generate API documentation sections based on exports analysis
    const apiSections: PageSection[] = [];
    
    this.repositoryStructure.files.forEach((file, index) => {
      if (file.exports.length > 0) {
        apiSections.push({
          id: `api-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`,
          type: SectionType.API_DOCS,
          title: `${file.path} API`,
          content: {
            text: file.documentation || `API documentation for ${file.path}`,
            code: [{
              language: file.language.toLowerCase(),
              code: `// Exports from ${file.path}\n${file.exports.join('\n')}`,
              title: 'Available Exports',
              filename: file.path,
            }],
          },
          layout: {
            columns: 1,
            alignment: 'left',
            spacing: 'normal',
          },
          styling: {
            theme: 'light',
          },
          order: index,
        });
      }
    });

    return apiSections;
  }

  private async generateInteractiveElements(): Promise<InteractiveElement[]> {
    const elements: InteractiveElement[] = [];

    // Architecture diagram
    if (this.aiAnalysis.architecture.components.length > 0) {
      elements.push({
        id: 'architecture-diagram',
        type: 'diagram',
        title: 'Interactive Architecture Diagram',
        description: 'Explore the system components and their relationships',
        content: {
          nodes: this.aiAnalysis.architecture.components.map(comp => ({
            id: comp.name,
            label: comp.name,
            description: comp.purpose,
            dependencies: comp.dependencies,
          })),
          edges: this.aiAnalysis.architecture.dataFlow.map(flow => ({
            from: flow.from,
            to: flow.to,
            label: flow.data,
          })),
        },
        placement: [{
          pageId: 'architecture',
          sectionId: 'architecture-overview',
          position: 'after',
        }],
      });
    }

    // Live demo if applicable
    if (this.repositoryStructure.frameworks.some(f => 
      ['React', 'Vue.js', 'Angular'].includes(f))) {
      elements.push({
        id: 'live-demo',
        type: 'demo',
        title: 'Live Demo',
        description: 'Interactive demonstration of key features',
        content: {
          demoUrl: this.generateDemoUrl(),
          features: this.aiAnalysis.overview.keyFeatures.slice(0, 3),
        },
        placement: [{
          pageId: 'overview',
          sectionId: 'hero',
          position: 'after',
        }],
      });
    }

    // Code playground for libraries
    if (this.aiAnalysis.overview.projectType === 'library') {
      elements.push({
        id: 'code-playground',
        type: 'interactive-code',
        title: 'Code Playground',
        description: 'Try the library directly in your browser',
        content: {
          defaultCode: this.generateDefaultCode(),
          language: this.getPrimaryLanguage(),
          packages: this.getPackageDependencies(),
        },
        placement: [{
          pageId: 'getting-started',
          sectionId: 'quick-start',
          position: 'after',
        }],
      });
    }

    return elements;
  }

  private generateNavigation(pages: SitePage[]): NavigationStructure {
    return {
      primary: pages.map(page => ({
        label: page.title,
        href: `/${page.slug}`,
        icon: this.getPageIcon(page.template),
      })),
      secondary: [
        { label: 'GitHub', href: this.repositoryStructure.files[0]?.path || '#', external: true, icon: 'Github' },
        { label: 'Documentation', href: '/api-reference', icon: 'Book' },
        { label: 'Examples', href: '/examples', icon: 'Code' },
      ],
      footer: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Contact', href: '/contact' },
      ],
      breadcrumb: true,
      searchEnabled: pages.length > 3,
    };
  }

  private generateGlobalStyles(): GlobalStyles {
    return {
      colorScheme: {
        primary: this.visuals.colorPalette[0] || '#007bff',
        secondary: this.visuals.colorPalette[1] || '#6c757d',
        accent: this.visuals.colorPalette[2] || '#28a745',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        textSecondary: '#6c757d',
        border: '#dee2e6',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
      },
      typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        headingFont: '"Inter", sans-serif',
        codeFont: '"Fira Code", "Monaco", monospace',
        baseFontSize: '16px',
        lineHeight: '1.6',
        fontWeights: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      },
      spacing: {
        baseUnit: '8px',
        scale: [0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24],
      },
      breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px',
      },
      animations: {
        duration: '0.3s',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reducedMotion: false,
      },
    };
  }

  private generateSEOData(): SEOData {
    return {
      title: `${this.aiAnalysis.overview.title} - ${this.aiAnalysis.overview.tagline}`,
      description: this.aiAnalysis.overview.description,
      keywords: [
        ...this.repositoryStructure.frameworks,
        ...this.repositoryStructure.languages,
        this.aiAnalysis.overview.projectType,
        'open source',
        'developer tools',
      ].map(k => k.toLowerCase()),
      openGraph: {
        title: this.aiAnalysis.overview.title,
        description: this.aiAnalysis.overview.description,
        image: this.visuals.heroImage,
        url: '', // Will be set during deployment
        type: 'website',
      },
      schema: {
        type: 'SoftwareApplication',
        data: {
          name: this.aiAnalysis.overview.title,
          description: this.aiAnalysis.overview.description,
          applicationCategory: this.aiAnalysis.overview.projectType,
          operatingSystem: 'Cross-platform',
          programmingLanguage: Object.keys(this.repositoryStructure.languages),
        },
      },
    };
  }

  private async createDeploymentPackage(
    pages: SitePage[],
    styles: GlobalStyles
  ): Promise<DeploymentPackage> {
    const staticFiles: StaticFile[] = [];
    
    // Generate HTML files for each page
    pages.forEach(page => {
      const html = this.generatePageHTML(page, styles);
      staticFiles.push({
        path: `${page.slug}.html`,
        content: html,
        mimeType: 'text/html',
      });
    });

    // Generate CSS file
    const css = this.generateGlobalCSS(styles);
    staticFiles.push({
      path: 'styles/global.css',
      content: css,
      mimeType: 'text/css',
    });

    // Generate JavaScript for interactivity
    const js = this.generateInteractiveJS();
    staticFiles.push({
      path: 'scripts/main.js',
      content: js,
      mimeType: 'application/javascript',
    });

    return {
      staticFiles,
      buildScript: this.generateBuildScript(),
      dependencies: this.generatePackageDependencies(),
      environmentVariables: [],
      deploymentConfigs: this.generateDeploymentConfigs(),
    };
  }

  // Helper methods for content generation
  private getPageTitle(pageType: PageTemplate): string {
    const titles = {
      [PageTemplate.OVERVIEW]: this.aiAnalysis.overview.title,
      [PageTemplate.GETTING_STARTED]: 'Getting Started',
      [PageTemplate.API_REFERENCE]: 'API Reference',
      [PageTemplate.ARCHITECTURE]: 'Architecture',
      [PageTemplate.EXAMPLES]: 'Examples',
      [PageTemplate.CONTRIBUTING]: 'Contributing',
      [PageTemplate.TECHNICAL_DOCS]: 'Documentation',
      [PageTemplate.CHANGELOG]: 'Changelog',
      [PageTemplate.CUSTOM]: 'Custom Page',
    };
    return titles[pageType] || 'Page';
  }

  private getPageIcon(pageType: PageTemplate): string {
    const icons = {
      [PageTemplate.OVERVIEW]: 'Home',
      [PageTemplate.GETTING_STARTED]: 'Play',
      [PageTemplate.API_REFERENCE]: 'Book',
      [PageTemplate.ARCHITECTURE]: 'Network',
      [PageTemplate.EXAMPLES]: 'Code',
      [PageTemplate.CONTRIBUTING]: 'Users',
      [PageTemplate.TECHNICAL_DOCS]: 'FileText',
      [PageTemplate.CHANGELOG]: 'GitCommit',
      [PageTemplate.CUSTOM]: 'File',
    };
    return icons[pageType] || 'File';
  }

  private generatePageHTML(page: SitePage, styles: GlobalStyles): string {
    // Generate complete HTML page with React-like component structure
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <meta name="description" content="${page.metadata.description}">
  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <div id="app">
    <header class="site-header">
      <!-- Navigation will be inserted here -->
    </header>
    <main class="page-content">
      ${this.generatePageSectionsHTML(page.sections)}
    </main>
    <footer class="site-footer">
      <!-- Footer content -->
    </footer>
  </div>
  <script src="/scripts/main.js"></script>
</body>
</html>`;
  }

  private generatePageSectionsHTML(sections: PageSection[]): string {
    return sections.map(section => `
      <section id="${section.id}" class="section section-${section.type}">
        <div class="container">
          <h2>${section.title}</h2>
          <div class="section-content">
            ${this.generateSectionContentHTML(section.content)}
          </div>
        </div>
      </section>
    `).join('\n');
  }

  private generateSectionContentHTML(content: SectionContent): string {
    let html = '';
    
    if (content.text) {
      html += `<div class="text-content">${this.markdownToHTML(content.text)}</div>`;
    }
    
    if (content.code) {
      html += content.code.map(block => `
        <div class="code-block">
          <div class="code-header">
            <span class="language">${block.language}</span>
            ${block.filename ? `<span class="filename">${block.filename}</span>` : ''}
          </div>
          <pre><code class="language-${block.language}">${this.escapeHTML(block.code)}</code></pre>
        </div>
      `).join('');
    }
    
    if (content.images) {
      html += content.images.map(img => `
        <figure class="image-figure">
          <img src="${img.url}" alt="${img.alt}" ${img.width ? `width="${img.width}"` : ''} ${img.height ? `height="${img.height}"` : ''}>
          ${img.caption ? `<figcaption>${img.caption}</figcaption>` : ''}
        </figure>
      `).join('');
    }
    
    return html;
  }

  private generateGlobalCSS(styles: GlobalStyles): string {
    return `
:root {
  --color-primary: ${styles.colorScheme.primary};
  --color-secondary: ${styles.colorScheme.secondary};
  --color-accent: ${styles.colorScheme.accent};
  --color-background: ${styles.colorScheme.background};
  --color-surface: ${styles.colorScheme.surface};
  --color-text: ${styles.colorScheme.text};
  --color-text-secondary: ${styles.colorScheme.textSecondary};
  --color-border: ${styles.colorScheme.border};
  
  --font-family: ${styles.typography.fontFamily};
  --font-family-heading: ${styles.typography.headingFont || styles.typography.fontFamily};
  --font-family-code: ${styles.typography.codeFont};
  --font-size-base: ${styles.typography.baseFontSize};
  --line-height: ${styles.typography.lineHeight};
  
  --spacing-unit: ${styles.spacing.baseUnit};
  --animation-duration: ${styles.animations.duration};
  --animation-easing: ${styles.animations.easing};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 calc(var(--spacing-unit) * 2);
}

.section {
  padding: calc(var(--spacing-unit) * 6) 0;
}

.section-hero {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  text-align: center;
}

.section-features {
  background-color: var(--color-surface);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading);
  line-height: 1.2;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

h1 { font-size: 3rem; font-weight: 700; }
h2 { font-size: 2.5rem; font-weight: 600; }
h3 { font-size: 2rem; font-weight: 600; }

.code-block {
  margin: calc(var(--spacing-unit) * 2) 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #fff;
}

.code-header {
  background-color: #2d2d2d;
  padding: calc(var(--spacing-unit)) calc(var(--spacing-unit) * 2);
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
}

pre {
  padding: calc(var(--spacing-unit) * 2);
  overflow-x: auto;
  font-family: var(--font-family-code);
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (max-width: ${styles.breakpoints.tablet}) {
  .container {
    padding: 0 var(--spacing-unit);
  }
  
  h1 { font-size: 2.5rem; }
  h2 { font-size: 2rem; }
  h3 { font-size: 1.75rem; }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn var(--animation-duration) var(--animation-easing);
}

.animate-slide-up {
  animation: slideUp var(--animation-duration) var(--animation-easing);
}
    `.trim();
  }

  private generateInteractiveJS(): string {
    return `
// Progressive enhancement for interactive elements
document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Intersection Observer for animations
  const animatedElements = document.querySelectorAll('[class*="animate-"]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-visible');
      }
    });
  });

  animatedElements.forEach(el => observer.observe(el));

  // Code syntax highlighting (placeholder)
  document.querySelectorAll('pre code').forEach(block => {
    // Add syntax highlighting here
    block.classList.add('syntax-highlighted');
  });

  // Copy code functionality
  document.querySelectorAll('.code-block').forEach(block => {
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.className = 'copy-button';
    copyBtn.addEventListener('click', () => {
      const code = block.querySelector('code').textContent;
      navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    });
    block.querySelector('.code-header').appendChild(copyBtn);
  });
});
    `.trim();
  }

  // Utility methods
  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private extractProjectName(repoUrl: string): string {
    return repoUrl.split('/').pop()?.replace('.git', '') || 'Project';
  }

  private determineTemplate(): 'TechProjectTemplate' | 'CreativeProjectTemplate' {
    return this.aiAnalysis.overview.projectType === 'library' || 
           this.repositoryStructure.frameworks.length > 0 
           ? 'TechProjectTemplate' 
           : 'CreativeProjectTemplate';
  }

  private convertToLegacySections(pages: SitePage[]): any[] {
    // Convert new page structure to legacy format for compatibility
    return pages[0]?.sections.map(section => ({
      id: section.id,
      title: section.title,
      content: section.content.text || '',
      order: section.order,
    })) || [];
  }

  private generateMarkdownSummary(): string {
    return `# ${this.aiAnalysis.overview.title}

${this.aiAnalysis.overview.description}

## Key Features
${this.aiAnalysis.overview.keyFeatures.map(f => `- ${f}`).join('\n')}

## Architecture
${this.aiAnalysis.architecture.pattern}

## Getting Started
[See full documentation](./getting-started.html)
    `;
  }

  // Placeholder methods for additional functionality
  private generatePageMetadata(pageType: PageTemplate): PageMetadata {
    return {
      description: `${pageType} page for ${this.aiAnalysis.overview.title}`,
      keywords: [pageType, this.aiAnalysis.overview.projectType],
      lastModified: new Date().toISOString(),
      estimatedReadTime: 5,
    };
  }

  private generatePageInteractiveFeatures(pageType: PageTemplate): InteractiveFeature[] {
    return [];
  }

  private createInstallationSection(): PageSection { return this.createGenericSection(SectionType.INSTALLATION); }
  private createQuickStartSection(): PageSection { return this.createGenericSection(SectionType.QUICK_START); }
  private createExamplesSection(): PageSection { return this.createGenericSection(SectionType.EXAMPLES); }
  private createTroubleshootingSection(): PageSection { return this.createGenericSection(SectionType.OVERVIEW); }
  private createAPIOverviewSection(): PageSection { return this.createGenericSection(SectionType.API_DOCS); }
  private createSDKSection(): PageSection { return this.createGenericSection(SectionType.API_DOCS); }
  private createComponentsSection(): PageSection { return this.createGenericSection(SectionType.ARCHITECTURE_DIAGRAM); }
  private createDataFlowSection(): PageSection { return this.createGenericSection(SectionType.ARCHITECTURE_DIAGRAM); }
  private createScalabilitySection(): PageSection { return this.createGenericSection(SectionType.PERFORMANCE); }
  private createExamplesOverviewSection(): PageSection { return this.createGenericSection(SectionType.EXAMPLES); }
  private createExampleSections(): PageSection[] { return []; }
  private createLiveDemoSection(): PageSection { return this.createGenericSection(SectionType.EXAMPLES); }
  private createCTASection(): PageSection { return this.createGenericSection(SectionType.CTA); }
  private createOverviewSection(): PageSection { return this.createGenericSection(SectionType.OVERVIEW); }

  private createGenericSection(type: SectionType): PageSection {
    return {
      id: type,
      type,
      title: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: { text: `Content for ${type} section` },
      layout: { columns: 1, alignment: 'left', spacing: 'normal' },
      styling: { theme: 'light' },
      order: 0,
    };
  }

  private generateAnalyticsConfig(): AnalyticsConfig { return { enabled: false }; }
  private generateDemoUrl(): string { return '#demo'; }
  private generateDefaultCode(): string { return '// Example code'; }
  private getPrimaryLanguage(): string { return Object.keys(this.repositoryStructure.languages)[0] || 'javascript'; }
  private getPackageDependencies(): string[] { return []; }
  private generateBuildScript(): string { return 'npm run build'; }
  private generatePackageDependencies(): PackageDependency[] { return []; }
  private generateDeploymentConfigs(): DeploymentConfig[] { return []; }
}

interface SiteStructurePlan {
  pageTypes: PageTemplate[];
  contentStrategy: 'minimal' | 'standard' | 'comprehensive';
  interactiveLevel: 'low' | 'medium' | 'high';
  targetAudience: string[];
}

interface AnalyticsConfig {
  enabled: boolean;
}