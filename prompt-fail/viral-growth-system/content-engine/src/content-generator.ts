import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import Replicate from 'replicate';
import { ElevenLabsClient } from 'elevenlabs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

interface ContentOpportunity {
  topic: string;
  angle: string;
  targetAudience: string;
  estimatedReach: number;
  contentTypes: string[];
  keywords: string[];
}

interface GeneratedContent {
  id: string;
  opportunity: ContentOpportunity;
  formats: {
    blogPost?: BlogPost;
    twitterThread?: TwitterThread;
    tikTokScript?: TikTokScript;
    youtubeShort?: YouTubeShort;
    linkedInArticle?: LinkedInArticle;
  };
  metadata: {
    generatedAt: Date;
    aiModels: string[];
    estimatedViralScore: number;
  };
}

interface BlogPost {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  seoMeta: {
    description: string;
    keywords: string[];
  };
  images: string[];
}

interface TwitterThread {
  tweets: Array<{
    text: string;
    media?: string;
    altText?: string;
  }>;
  hashtags: string[];
  engagementHook: string;
  cta: string;
}

interface TikTokScript {
  hook: string;
  script: string;
  visualDirections: string[];
  audioUrl: string;
  effects: string[];
  hashtags: string[];
  duration: number;
}

interface YouTubeShort {
  title: string;
  description: string;
  script: string;
  thumbnails: string[];
  tags: string[];
  videoUrl?: string;
}

interface LinkedInArticle {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  professionalTone: boolean;
}

export class ContentGenerator {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private replicate: Replicate;
  private elevenLabs: ElevenLabsClient;
  private redis: Redis;
  private contentQueue: Queue;
  private worker: Worker;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    this.elevenLabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    this.contentQueue = new Queue('content-generation', {
      connection: this.redis
    });

    // Initialize worker
    this.worker = new Worker('content-generation', 
      async (job) => await this.processContentJob(job),
      { connection: this.redis }
    );
  }

  async generateContent(opportunity: ContentOpportunity): Promise<GeneratedContent> {
    console.log(`🎨 Generating content for: ${opportunity.topic}`);

    const content: GeneratedContent = {
      id: this.generateContentId(),
      opportunity,
      formats: {},
      metadata: {
        generatedAt: new Date(),
        aiModels: [],
        estimatedViralScore: 0
      }
    };

    // Generate content for each requested type
    const generators = {
      blog: () => this.generateBlogPost(opportunity),
      twitter: () => this.generateTwitterThread(opportunity),
      tiktok: () => this.generateTikTokScript(opportunity),
      youtube: () => this.generateYouTubeShort(opportunity),
      linkedin: () => this.generateLinkedInArticle(opportunity)
    };

    // Process in parallel
    const promises = opportunity.contentTypes.map(async (type) => {
      const generator = generators[type as keyof typeof generators];
      if (generator) {
        const result = await generator();
        switch (type) {
          case 'blog':
            content.formats.blogPost = result as BlogPost;
            break;
          case 'twitter':
            content.formats.twitterThread = result as TwitterThread;
            break;
          case 'tiktok':
            content.formats.tikTokScript = result as TikTokScript;
            break;
          case 'youtube':
            content.formats.youtubeShort = result as YouTubeShort;
            break;
          case 'linkedin':
            content.formats.linkedInArticle = result as LinkedInArticle;
            break;
        }
      }
    });

    await Promise.all(promises);

    // Calculate viral score
    content.metadata.estimatedViralScore = await this.calculateViralScore(content);

    // Store in Redis
    await this.redis.setex(
      `content:${content.id}`,
      86400, // 24 hour TTL
      JSON.stringify(content)
    );

    console.log(`✅ Content generated with ID: ${content.id}`);
    return content;
  }

  private async generateBlogPost(opportunity: ContentOpportunity): Promise<BlogPost> {
    const prompt = `
    Create a comprehensive blog post about "${opportunity.topic}" for UltraPlan.
    
    Angle: ${opportunity.angle}
    Target Audience: ${opportunity.targetAudience}
    Keywords to include: ${opportunity.keywords.join(', ')}
    
    The blog post should:
    1. Start with a compelling hook
    2. Include real-world examples and case studies
    3. Demonstrate how UltraPlan solves this problem
    4. Include actionable steps
    5. End with a strong CTA
    
    Format:
    - Title (SEO-optimized, 60 chars max)
    - Content (2000-3000 words, markdown format)
    - Excerpt (150 chars)
    - SEO meta description (155 chars)
    - 5-7 relevant tags
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response and structure it
    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s*/, '');
    const bodyStart = lines.findIndex(line => line.startsWith('## '));
    const body = lines.slice(bodyStart).join('\n');
    
    // Generate images for the blog post
    const images = await this.generateBlogImages(opportunity.topic, 3);

    return {
      title,
      content: body,
      excerpt: this.generateExcerpt(body, 150),
      tags: opportunity.keywords.slice(0, 7),
      seoMeta: {
        description: this.generateMetaDescription(body, 155),
        keywords: opportunity.keywords
      },
      images
    };
  }

  private async generateTwitterThread(opportunity: ContentOpportunity): Promise<TwitterThread> {
    const prompt = `
    Create a viral Twitter thread about "${opportunity.topic}" for UltraPlan.
    
    Angle: ${opportunity.angle}
    Target: ${opportunity.targetAudience}
    
    Requirements:
    1. Hook tweet that stops scrolling
    2. 7-12 tweets total
    3. Each tweet max 280 chars
    4. Include statistics and social proof
    5. Visual breaks with emojis
    6. Strong CTA in final tweet
    7. 3-5 relevant hashtags
    
    Format each tweet on a new line, numbered.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const tweets = content.split('\n')
      .filter(line => /^\d+\./.test(line))
      .map(line => ({
        text: line.replace(/^\d+\.\s*/, '').trim(),
        media: undefined // Will be added later
      }));

    // Generate media for key tweets
    const mediaPromises = [0, Math.floor(tweets.length / 2), tweets.length - 1].map(
      index => this.generateTwitterImage(opportunity.topic, index)
    );
    const media = await Promise.all(mediaPromises);
    
    tweets[0].media = media[0];
    tweets[Math.floor(tweets.length / 2)].media = media[1];
    tweets[tweets.length - 1].media = media[2];

    return {
      tweets,
      hashtags: this.extractHashtags(content),
      engagementHook: tweets[0].text,
      cta: tweets[tweets.length - 1].text
    };
  }

  private async generateTikTokScript(opportunity: ContentOpportunity): Promise<TikTokScript> {
    const prompt = `
    Create a viral TikTok script about "${opportunity.topic}" for UltraPlan.
    
    Target: ${opportunity.targetAudience}
    Duration: 15-30 seconds
    
    Include:
    1. Hook (first 3 seconds)
    2. Problem/pain point
    3. UltraPlan as solution
    4. Quick demo/visual
    5. Call to action
    
    Also provide:
    - Visual directions for each scene
    - Suggested effects/transitions
    - Trending audio suggestions
    - Relevant hashtags
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8
    });

    const content = response.choices[0].message.content || '';
    
    // Parse script sections
    const sections = this.parseScriptSections(content);
    
    // Generate voiceover
    const audioUrl = await this.generateVoiceover(sections.script);

    return {
      hook: sections.hook,
      script: sections.script,
      visualDirections: sections.visuals,
      audioUrl,
      effects: sections.effects,
      hashtags: sections.hashtags,
      duration: this.calculateDuration(sections.script)
    };
  }

  private async generateYouTubeShort(opportunity: ContentOpportunity): Promise<YouTubeShort> {
    const prompt = `
    Create a YouTube Shorts script about "${opportunity.topic}" for UltraPlan.
    
    Target: ${opportunity.targetAudience}
    Duration: 45-60 seconds
    
    Structure:
    1. Hook (0-5 seconds)
    2. Problem explanation (5-20 seconds)
    3. UltraPlan demo (20-45 seconds)
    4. Results/benefits (45-55 seconds)
    5. CTA (55-60 seconds)
    
    Include:
    - Catchy title (max 100 chars)
    - Description with timestamps
    - Tags for YouTube algorithm
    - Visual script
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = this.parseYouTubeScript(content);
    
    // Generate thumbnails
    const thumbnails = await this.generateYouTubeThumbnails(opportunity.topic, 5);

    return {
      title: parsed.title,
      description: parsed.description,
      script: parsed.script,
      thumbnails,
      tags: parsed.tags,
      videoUrl: undefined // Will be set after video generation
    };
  }

  private async generateLinkedInArticle(opportunity: ContentOpportunity): Promise<LinkedInArticle> {
    const prompt = `
    Create a professional LinkedIn article about "${opportunity.topic}" for UltraPlan.
    
    Target: ${opportunity.targetAudience}
    Tone: Professional, thought leadership
    
    Structure:
    1. Compelling headline
    2. Executive summary (3-4 sentences)
    3. Current state/problem (with statistics)
    4. Solution framework
    5. Case study/example
    6. Implementation steps
    7. Call to action
    
    Length: 1500 words
    Include industry insights and data.
    `;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content || '';
    const lines = content.split('\n');
    
    return {
      title: lines[0].replace(/^#\s*/, ''),
      content: lines.slice(1).join('\n'),
      summary: this.generateExcerpt(content, 300),
      tags: opportunity.keywords.filter(k => this.isProfessionalKeyword(k)),
      professionalTone: true
    };
  }

  // Helper methods
  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateBlogImages(topic: string, count: number): Promise<string[]> {
    const prompts = [
      `Professional header image for blog post about ${topic}, modern, clean, UltraPlan brand colors`,
      `Infographic showing ${topic} process, minimalist design, data visualization`,
      `Hero image representing ${topic} success, aspirational, business context`
    ];

    const imagePromises = prompts.slice(0, count).map(async (prompt) => {
      const output = await this.replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        { input: { prompt, negative_prompt: "low quality, blurry, distorted" } }
      );
      return output as string;
    });

    return Promise.all(imagePromises);
  }

  private async generateTwitterImage(topic: string, index: number): Promise<string> {
    const styles = ['infographic', 'quote card', 'statistics visualization'];
    const prompt = `${styles[index % styles.length]} about ${topic}, Twitter-optimized, UltraPlan branding`;
    
    const output = await this.replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      { input: { prompt, aspect_ratio: "1:1" } }
    );
    
    return output as string;
  }

  private async generateVoiceover(script: string): Promise<string> {
    const audio = await this.elevenLabs.generate({
      voice: "Rachel", // Or your preferred voice
      text: script,
      model_id: "eleven_monolingual_v1"
    });

    // Save audio and return URL
    const audioUrl = await this.saveAudio(audio);
    return audioUrl;
  }

  private async generateYouTubeThumbnails(topic: string, count: number): Promise<string[]> {
    const thumbnailPrompts = Array(count).fill(0).map((_, i) => 
      `YouTube thumbnail for "${topic}", eye-catching, high contrast, text overlay, variation ${i + 1}`
    );

    const thumbnailPromises = thumbnailPrompts.map(async (prompt) => {
      const output = await this.replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        { input: { prompt, aspect_ratio: "16:9" } }
      );
      return output as string;
    });

    return Promise.all(thumbnailPromises);
  }

  private async calculateViralScore(content: GeneratedContent): Promise<number> {
    let score = 0;
    
    // Factor in opportunity reach
    score += Math.min(content.opportunity.estimatedReach / 100000, 0.3);
    
    // Factor in content completeness
    const formatCount = Object.keys(content.formats).length;
    score += formatCount * 0.1;
    
    // Factor in keyword optimization
    const keywordDensity = this.calculateKeywordDensity(content);
    score += Math.min(keywordDensity * 0.2, 0.2);
    
    // Factor in emotional triggers
    const emotionalScore = await this.analyzeEmotionalTriggers(content);
    score += emotionalScore * 0.3;
    
    return Math.min(score, 1);
  }

  private generateExcerpt(content: string, maxLength: number): string {
    const cleaned = content.replace(/[#*\n]/g, ' ').trim();
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength - 3) + '...'
      : cleaned;
  }

  private generateMetaDescription(content: string, maxLength: number): string {
    const firstParagraph = content.split('\n\n')[0];
    return this.generateExcerpt(firstParagraph, maxLength);
  }

  private extractHashtags(content: string): string[] {
    const hashtags = content.match(/#\w+/g) || [];
    return [...new Set(hashtags)].slice(0, 5);
  }

  private parseScriptSections(content: string): any {
    // Implementation for parsing TikTok script sections
    const sections = {
      hook: '',
      script: '',
      visuals: [] as string[],
      effects: [] as string[],
      hashtags: [] as string[]
    };
    
    // Parse content into sections
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('hook:')) {
        currentSection = 'hook';
      } else if (line.toLowerCase().includes('script:')) {
        currentSection = 'script';
      } else if (line.toLowerCase().includes('visual')) {
        currentSection = 'visuals';
      } else if (line.toLowerCase().includes('effect')) {
        currentSection = 'effects';
      } else if (line.toLowerCase().includes('hashtag')) {
        currentSection = 'hashtags';
      } else if (currentSection && line.trim()) {
        switch (currentSection) {
          case 'hook':
            sections.hook += line + ' ';
            break;
          case 'script':
            sections.script += line + ' ';
            break;
          case 'visuals':
            sections.visuals.push(line.trim());
            break;
          case 'effects':
            sections.effects.push(line.trim());
            break;
          case 'hashtags':
            sections.hashtags.push(...this.extractHashtags(line));
            break;
        }
      }
    });
    
    return sections;
  }

  private calculateDuration(script: string): number {
    // Estimate duration based on word count (150 words per minute average)
    const wordCount = script.split(' ').length;
    const minutes = wordCount / 150;
    return Math.min(Math.max(minutes * 60, 15), 30); // Clamp between 15-30 seconds
  }

  private parseYouTubeScript(content: string): any {
    const lines = content.split('\n');
    const result = {
      title: '',
      description: '',
      script: '',
      tags: [] as string[]
    };
    
    let currentSection = '';
    lines.forEach(line => {
      if (line.toLowerCase().includes('title:')) {
        result.title = line.replace(/title:/i, '').trim();
      } else if (line.toLowerCase().includes('description:')) {
        currentSection = 'description';
      } else if (line.toLowerCase().includes('script:')) {
        currentSection = 'script';
      } else if (line.toLowerCase().includes('tags:')) {
        currentSection = 'tags';
      } else if (currentSection && line.trim()) {
        switch (currentSection) {
          case 'description':
            result.description += line + '\n';
            break;
          case 'script':
            result.script += line + '\n';
            break;
          case 'tags':
            result.tags.push(...line.split(',').map(t => t.trim()));
            break;
        }
      }
    });
    
    return result;
  }

  private isProfessionalKeyword(keyword: string): boolean {
    const professionalTerms = [
      'strategy', 'business', 'enterprise', 'leadership', 'innovation',
      'growth', 'efficiency', 'roi', 'analytics', 'transformation'
    ];
    return professionalTerms.some(term => keyword.toLowerCase().includes(term));
  }

  private calculateKeywordDensity(content: GeneratedContent): number {
    const allText = JSON.stringify(content.formats).toLowerCase();
    const keywords = content.opportunity.keywords;
    
    let density = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = allText.match(regex) || [];
      density += matches.length / allText.length;
    });
    
    return density;
  }

  private async analyzeEmotionalTriggers(content: GeneratedContent): Promise<number> {
    const triggers = [
      'save time', 'increase revenue', 'reduce stress', 'achieve goals',
      'breakthrough', 'transform', 'revolutionary', 'game-changing',
      'exclusive', 'limited time', 'proven results', 'success story'
    ];
    
    const allText = JSON.stringify(content.formats).toLowerCase();
    let score = 0;
    
    triggers.forEach(trigger => {
      if (allText.includes(trigger)) {
        score += 0.1;
      }
    });
    
    return Math.min(score, 1);
  }

  private async saveAudio(audio: Buffer): Promise<string> {
    // Implementation to save audio to S3 or CDN
    const filename = `audio_${Date.now()}.mp3`;
    // await s3.upload(audio, filename);
    return `https://cdn.ultraplan.pro/audio/${filename}`;
  }

  private async processContentJob(job: any): Promise<void> {
    const { opportunity } = job.data;
    await this.generateContent(opportunity);
  }
}

export default ContentGenerator;