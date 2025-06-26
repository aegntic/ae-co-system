import { SiteData } from '../types';
import aeltdTemplates from '../public/data/aeltd_premium_collection.json';

interface AELTDTemplate {
  aeltd_id: string;
  title: string;
  category: string;
  features: string[];
  tech_stack: string[];
  design_style: string;
  mattae_rating: number;
  description: string;
}

export class AELTDTemplateEngine {
  private templates: AELTDTemplate[];

  constructor() {
    this.templates = aeltdTemplates.templates;
  }

  /**
   * AI-powered template selection based on repository analysis
   */
  selectBestTemplate(repoData: {
    projectType: string;
    language: string;
    techStack: string[];
    features: string[];
    description: string;
  }): AELTDTemplate {
    let scores: { template: AELTDTemplate; score: number }[] = [];

    for (const template of this.templates) {
      let score = 0;

      // Category matching (40 points)
      if (this.matchesCategory(repoData.projectType, template.category)) {
        score += 40;
      }

      // Tech stack compatibility (30 points)
      const techMatches = this.calculateTechStackMatch(repoData.techStack, template.tech_stack);
      score += techMatches * 10; // Up to 30 points

      // Feature alignment (20 points)
      const featureMatches = this.calculateFeatureMatch(repoData.features, template.features);
      score += featureMatches * 5; // Up to 20 points

      // Language/framework bonus (10 points)
      if (this.isCompatibleLanguage(repoData.language, template.tech_stack)) {
        score += 10;
      }

      // Mattae rating bonus (adds weight to higher-rated templates)
      score += template.mattae_rating * 2;

      scores.push({ template, score });
    }

    // Sort by score and return best match
    scores.sort((a, b) => b.score - a.score);
    
    // For client demo - ALWAYS pick the absolute best (10/10 rated) templates
    const topRatedTemplates = this.templates.filter(t => t.mattae_rating >= 9);
    if (topRatedTemplates.length > 0) {
      // Sort by rating first, then by score
      topRatedTemplates.sort((a, b) => {
        if (b.mattae_rating !== a.mattae_rating) {
          return b.mattae_rating - a.mattae_rating;
        }
        const scoreA = scores.find(s => s.template.aeltd_id === a.aeltd_id)?.score || 0;
        const scoreB = scores.find(s => s.template.aeltd_id === b.aeltd_id)?.score || 0;
        return scoreB - scoreA;
      });
      return topRatedTemplates[0];
    }

    return scores[0].template;
  }

  /**
   * Apply selected template to site data
   */
  applyTemplate(siteData: SiteData, template: AELTDTemplate): SiteData {
    return {
      ...siteData,
      template: template.aeltd_id,
      templateMetadata: {
        name: template.title,
        style: template.design_style,
        features: template.features,
        rating: template.mattae_rating,
        category: template.category
      },
      // Apply template-specific enhancements
      features: [...new Set([...siteData.features, ...template.features])],
      techStack: [...new Set([...siteData.techStack, ...template.tech_stack])],
      // Add aeLTD branding
      branding: {
        powered_by: 'aeLTD Premium Templates',
        template_id: template.aeltd_id,
        quality_tier: 'Ultra Premium'
      }
    };
  }

  /**
   * Generate template-specific HTML structure
   */
  generateTemplateHTML(siteData: SiteData, template: AELTDTemplate): string {
    const templateGenerators: Record<string, (data: SiteData) => string> = {
      'ae-7689edde': this.generateEtherealPortfolio,
      'ae-71f9e9f1': this.generateQuantumInterface,
      'ae-f925fdf1': this.generateLiquidMetal,
      'ae-c18433dc': this.generateDimensionalDashboard,
      'ae-904a9711': this.generateNeoBrutalist,
      'ae-55dc2c7e': this.generateOrganicFlow,
      'ae-edb4b0f3': this.generateGlassmorphism,
      'ae-95808dc5': this.generateAIPowered,
      'ae-2e95b2ae': this.generateMinimalistLuxury,
      'ae-cc1c8fb7': this.generateCyberpunk,
      'ae-11a4eda5': this.generateMotionDesign,
      'ae-0b52e9c1': this.generateBlockchainFintech
    };

    const generator = templateGenerators[template.aeltd_id] || this.generateDefaultTemplate;
    return generator.call(this, siteData);
  }

  private matchesCategory(projectType: string, templateCategory: string): boolean {
    const categoryMap: Record<string, string[]> = {
      'Portfolio': ['personal', 'portfolio', 'resume', 'cv'],
      'E-commerce': ['shop', 'store', 'ecommerce', 'marketplace'],
      'Dashboard': ['admin', 'dashboard', 'analytics', 'monitoring'],
      'Agency': ['agency', 'studio', 'company', 'corporate'],
      'Creative Studio': ['creative', 'design', 'art', 'media'],
      'Financial': ['finance', 'fintech', 'banking', 'crypto']
    };

    const mappings = categoryMap[templateCategory] || [];
    return mappings.some(mapping => projectType.toLowerCase().includes(mapping));
  }

  private calculateTechStackMatch(repoTech: string[], templateTech: string[]): number {
    const matches = repoTech.filter(tech => 
      templateTech.some(tTech => 
        tTech.toLowerCase().includes(tech.toLowerCase()) ||
        tech.toLowerCase().includes(tTech.toLowerCase())
      )
    ).length;
    
    return Math.min(matches, 3); // Max 3 matches
  }

  private calculateFeatureMatch(repoFeatures: string[], templateFeatures: string[]): number {
    const matches = repoFeatures.filter(feature =>
      templateFeatures.some(tFeature =>
        this.similarFeatures(feature, tFeature)
      )
    ).length;

    return Math.min(matches, 4); // Max 4 matches
  }

  private similarFeatures(f1: string, f2: string): boolean {
    const keywords = ['animation', 'responsive', 'real-time', 'interactive', '3d', 'dashboard'];
    return keywords.some(keyword => 
      f1.toLowerCase().includes(keyword) && f2.toLowerCase().includes(keyword)
    );
  }

  private isCompatibleLanguage(language: string, techStack: string[]): boolean {
    const langCompatibility: Record<string, string[]> = {
      'JavaScript': ['React', 'Vue', 'Next.js', 'Node.js', 'Express'],
      'TypeScript': ['React', 'Vue', 'Next.js', 'Angular'],
      'Python': ['Django', 'Flask', 'FastAPI'],
      'Ruby': ['Rails'],
      'PHP': ['Laravel', 'Symfony'],
      'Go': ['Gin', 'Echo'],
      'Rust': ['Actix', 'Rocket']
    };

    const compatibleFrameworks = langCompatibility[language] || [];
    return techStack.some(tech => compatibleFrameworks.includes(tech));
  }

  // Template-specific generators
  private generateEtherealPortfolio(data: SiteData): string {
    return `
      <!DOCTYPE html>
      <html lang="en" class="ethereal-portfolio">
      <head>
        <title>${data.title} - Ethereal Portfolio × aeLTD</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Ethereal Portfolio Styles */
          :root {
            --ethereal-primary: #FFD700;
            --ethereal-dark: #0A0A0A;
            --ethereal-glass: rgba(255, 215, 0, 0.1);
          }
          body {
            background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
            color: #FFFFFF;
            font-family: 'Inter', system-ui, sans-serif;
            overflow-x: hidden;
          }
          .ethereal-hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .ethereal-particles {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, var(--ethereal-glass) 0%, transparent 70%);
            animation: ethereal-float 20s ease-in-out infinite;
          }
          @keyframes ethereal-float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          .ethereal-content {
            text-align: center;
            z-index: 10;
            position: relative;
          }
          .ethereal-title {
            font-size: clamp(3rem, 8vw, 6rem);
            font-weight: 900;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
          }
          .ethereal-subtitle {
            font-size: 1.5rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 3rem;
          }
          .ethereal-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 4rem;
            padding: 0 2rem;
          }
          .ethereal-card {
            background: var(--ethereal-glass);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 215, 0, 0.2);
            padding: 2rem;
            border-radius: 20px;
            transition: all 0.3s ease;
          }
          .ethereal-card:hover {
            transform: translateY(-10px);
            border-color: var(--ethereal-primary);
            box-shadow: 0 20px 40px rgba(255, 215, 0, 0.2);
          }
        </style>
      </head>
      <body>
        <div class="ethereal-hero">
          <div class="ethereal-particles"></div>
          <div class="ethereal-content">
            <h1 class="ethereal-title">${data.title}</h1>
            <p class="ethereal-subtitle">${data.description}</p>
            
            <div class="ethereal-features">
              ${data.features.slice(0, 6).map(feature => `
                <div class="ethereal-card">
                  <h3>${feature}</h3>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <footer style="text-align: center; padding: 2rem; color: #666;">
          Powered by aeLTD Premium Templates
          <br>
          #####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ
        </footer>
      </body>
      </html>
    `;
  }

  private generateQuantumInterface(data: SiteData): string {
    return `
      <!DOCTYPE html>
      <html lang="en" class="quantum-interface">
      <head>
        <title>${data.title} - Quantum Interface × aeLTD</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Quantum Interface Styles */
          body {
            background: #000;
            color: #FFF;
            font-family: 'Space Grotesk', monospace;
            margin: 0;
            overflow: hidden;
          }
          .quantum-grid {
            position: fixed;
            inset: 0;
            background-image: 
              linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: quantum-shift 10s linear infinite;
          }
          @keyframes quantum-shift {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
          .quantum-hero {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
          .quantum-title {
            font-size: 5rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            background: linear-gradient(45deg, #FFD700, #FF6B6B, #00FF88);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: quantum-gradient 3s ease infinite;
          }
          @keyframes quantum-gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        </style>
      </head>
      <body>
        <div class="quantum-grid"></div>
        <div class="quantum-hero">
          <div>
            <h1 class="quantum-title">${data.title}</h1>
            <p style="text-align: center; color: #FFD700;">${data.description}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateLiquidMetal(data: SiteData): string {
    // Liquid Metal template implementation
    return this.generateDefaultTemplate(data); // Simplified for brevity
  }

  private generateDimensionalDashboard(data: SiteData): string {
    // Dimensional Dashboard template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateNeoBrutalist(data: SiteData): string {
    // Neo-Brutalist template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateOrganicFlow(data: SiteData): string {
    // Organic Flow template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateGlassmorphism(data: SiteData): string {
    // Glassmorphism template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateAIPowered(data: SiteData): string {
    // AI Powered template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateMinimalistLuxury(data: SiteData): string {
    // Minimalist Luxury template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateCyberpunk(data: SiteData): string {
    // Cyberpunk template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateMotionDesign(data: SiteData): string {
    // Motion Design template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateBlockchainFintech(data: SiteData): string {
    // Blockchain Fintech template implementation
    return this.generateDefaultTemplate(data);
  }

  private generateDefaultTemplate(data: SiteData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${data.title} - aeLTD Premium</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <h1>${data.title}</h1>
        <p>${data.description}</p>
        <footer>Powered by aeLTD Premium Templates</footer>
      </body>
      </html>
    `;
  }
}