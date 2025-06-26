import { generateEnhancedSiteContent, enhanceContentWithVisuals } from './enhancedGeminiService';
import { generateProjectVisuals, analyzeVisualStyle } from './falService';
import { parseMarkdownToSections } from './markdownParser';
import { SiteData, GenerationMetrics } from '../types';

export interface GenerationProgress {
  stage: 'content' | 'visuals' | 'finalizing';
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export const generateMultiModalSite = async (
  repoUrl: string,
  onProgress?: ProgressCallback
): Promise<SiteData> => {
  const startTime = Date.now();
  let contentGenerationTime = 0;
  let imageGenerationTime = 0;

  try {
    // Stage 1: Content Generation
    onProgress?.({
      stage: 'content',
      progress: 10,
      message: 'Analyzing repository and generating content...'
    });

    const contentStartTime = Date.now();
    const { markdown, metadata } = await generateEnhancedSiteContent(repoUrl);
    contentGenerationTime = Date.now() - contentStartTime;

    onProgress?.({
      stage: 'content',
      progress: 40,
      message: 'Content generated successfully!'
    });

    // Stage 2: Visual Generation (in parallel)
    onProgress?.({
      stage: 'visuals',
      progress: 50,
      message: 'Creating AI-powered visuals...'
    });

    const imageStartTime = Date.now();
    const visualStyleDesc = analyzeVisualStyle(
      metadata.name,
      metadata.description,
      metadata.techStack
    );

    const visuals = await generateProjectVisuals(
      metadata.name,
      metadata.description,
      metadata.techStack
    );
    imageGenerationTime = Date.now() - imageStartTime;

    onProgress?.({
      stage: 'visuals',
      progress: 80,
      message: 'Visuals created successfully!'
    });

    // Stage 3: Finalize and enhance
    onProgress?.({
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing your incredible site...'
    });

    // Enhance markdown with visual elements
    const enhancedMarkdown = enhanceContentWithVisuals(markdown, {
      heroImage: visuals.heroImage,
      projectIcon: visuals.projectIcon,
      colorPalette: visuals.colorPalette
    });

    // Parse sections
    const sections = parseMarkdownToSections(enhancedMarkdown);

    // Determine template based on category
    const template = metadata.category === 'creative' || metadata.category === 'design'
      ? 'CreativeProjectTemplate'
      : 'TechProjectTemplate';

    // Generate partner recommendations based on tech stack
    const partnerRecommendations = generatePartnerRecommendations(metadata.techStack);

    const totalTime = Date.now() - startTime;

    const siteData: SiteData = {
      id: Date.now().toString(),
      title: metadata.name,
      repoUrl,
      generatedMarkdown: enhancedMarkdown,
      sections,
      template,
      partnerToolRecommendations: partnerRecommendations,
      tier: 'enhanced',
      visuals: {
        ...visuals,
        visualStyle: visualStyleDesc
      },
      generationMetrics: {
        contentGenerationTime,
        imageGenerationTime,
        totalTime,
        visualsGenerated: true,
        techStackIdentified: metadata.techStack
      }
    };

    onProgress?.({
      stage: 'finalizing',
      progress: 100,
      message: 'Your stunning site is ready!'
    });

    return siteData;
  } catch (error) {
    console.error('Error in multi-modal generation:', error);
    
    // Fallback to content-only generation
    onProgress?.({
      stage: 'content',
      progress: 50,
      message: 'Visual generation failed, continuing with content only...'
    });

    const fallbackContent = await generateEnhancedSiteContent(repoUrl);
    const sections = parseMarkdownToSections(fallbackContent.markdown);

    return {
      id: Date.now().toString(),
      title: fallbackContent.metadata.name,
      repoUrl,
      generatedMarkdown: fallbackContent.markdown,
      sections,
      template: 'TechProjectTemplate',
      partnerToolRecommendations: generatePartnerRecommendations(fallbackContent.metadata.techStack),
      tier: 'free',
      generationMetrics: {
        contentGenerationTime: Date.now() - startTime,
        imageGenerationTime: 0,
        totalTime: Date.now() - startTime,
        visualsGenerated: false,
        techStackIdentified: fallbackContent.metadata.techStack
      }
    };
  }
};

const generatePartnerRecommendations = (techStack: string[]) => {
  const recommendations = [];
  const techStackLower = techStack.map(t => t.toLowerCase());

  // Hosting recommendations
  if (techStackLower.some(t => ['react', 'vue', 'angular', 'next', 'nuxt'].includes(t))) {
    recommendations.push({
      name: 'Vercel',
      description: 'Deploy your frontend with zero configuration',
      ctaUrl: 'https://vercel.com',
      iconUrl: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico'
    });
  }

  if (techStackLower.some(t => ['node', 'python', 'ruby', 'go'].includes(t))) {
    recommendations.push({
      name: 'Railway',
      description: 'Deploy backend services in seconds',
      ctaUrl: 'https://railway.app',
      iconUrl: 'https://railway.app/favicon.ico'
    });
  }

  // Database recommendations
  if (techStackLower.some(t => ['database', 'postgres', 'mysql', 'mongodb'].includes(t))) {
    recommendations.push({
      name: 'Supabase',
      description: 'Open source Firebase alternative with Postgres',
      ctaUrl: 'https://supabase.com',
      iconUrl: 'https://supabase.com/favicon/favicon-32x32.png'
    });
  }

  // Monitoring recommendations
  recommendations.push({
    name: 'Sentry',
    description: 'Application monitoring and error tracking',
    ctaUrl: 'https://sentry.io',
    iconUrl: 'https://sentry.io/favicon.ico'
  });

  return recommendations.slice(0, 4); // Limit to 4 recommendations
};

export const generateSiteWithRetry = async (
  repoUrl: string,
  onProgress?: ProgressCallback,
  maxRetries: number = 2
): Promise<SiteData> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        onProgress?.({
          stage: 'content',
          progress: 0,
          message: `Retrying (attempt ${attempt + 1} of ${maxRetries + 1})...`
        });
      }

      return await generateMultiModalSite(repoUrl, onProgress);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw lastError || new Error('Generation failed after all retries');
};