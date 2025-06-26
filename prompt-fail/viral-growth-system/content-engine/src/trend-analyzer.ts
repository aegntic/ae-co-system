import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

interface TrendSource {
  name: string;
  url: string;
  selector: string;
  parseMethod: (html: string) => TrendItem[];
}

interface TrendItem {
  title: string;
  url: string;
  score: number;
  comments?: number;
  timestamp: Date;
  source: string;
  tags: string[];
}

interface TrendReport {
  hotTopics: TrendItem[];
  contentGaps: ContentOpportunity[];
  urgencyScore: number;
  viralPotential: number;
  timestamp: Date;
}

interface ContentOpportunity {
  topic: string;
  angle: string;
  targetAudience: string;
  estimatedReach: number;
  contentTypes: string[];
  keywords: string[];
}

export class TrendAnalyzer {
  private redis: Redis;
  private contentQueue: Queue;
  private openai: OpenAI;
  private anthropic: Anthropic;
  
  private sources: TrendSource[] = [
    {
      name: 'hackernews',
      url: 'https://news.ycombinator.com/best',
      selector: '.athing',
      parseMethod: this.parseHackerNews.bind(this)
    },
    {
      name: 'reddit-programming',
      url: 'https://www.reddit.com/r/programming/top/?t=day',
      selector: '[data-testid="post-container"]',
      parseMethod: this.parseReddit.bind(this)
    },
    {
      name: 'reddit-startups',
      url: 'https://www.reddit.com/r/startups/top/?t=day',
      selector: '[data-testid="post-container"]',
      parseMethod: this.parseReddit.bind(this)
    },
    {
      name: 'producthunt',
      url: 'https://www.producthunt.com/topics/productivity',
      selector: '[data-test="post-item"]',
      parseMethod: this.parseProductHunt.bind(this)
    },
    {
      name: 'dev.to',
      url: 'https://dev.to/top/week',
      selector: '.crayons-story',
      parseMethod: this.parseDevTo.bind(this)
    }
  ];

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
    
    this.contentQueue = new Queue('content-generation', {
      connection: this.redis
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async analyze(): Promise<TrendReport> {
    console.log('🔍 Starting trend analysis...');
    
    // Fetch trends from all sources in parallel
    const trendPromises = this.sources.map(source => this.fetchTrends(source));
    const allTrends = await Promise.all(trendPromises);
    const flatTrends = allTrends.flat();
    
    // Filter and rank trends
    const relevantTopics = await this.filterRelevant(flatTrends);
    const contentOpportunities = await this.identifyGaps(relevantTopics);
    
    const report: TrendReport = {
      hotTopics: relevantTopics.slice(0, 10),
      contentGaps: contentOpportunities,
      urgencyScore: this.calculateUrgency(relevantTopics),
      viralPotential: await this.predictVirality(relevantTopics),
      timestamp: new Date()
    };
    
    // Cache the report
    await this.redis.setex(
      'trend-report:latest',
      3600, // 1 hour TTL
      JSON.stringify(report)
    );
    
    // Queue content generation for top opportunities
    for (const opportunity of contentOpportunities.slice(0, 5)) {
      await this.contentQueue.add('generate-content', {
        opportunity,
        priority: opportunity.estimatedReach
      });
    }
    
    console.log(`✅ Trend analysis complete. Found ${contentOpportunities.length} opportunities.`);
    return report;
  }

  private async fetchTrends(source: TrendSource): Promise<TrendItem[]> {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UltraPlanBot/1.0)'
        }
      });
      
      return source.parseMethod(response.data);
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      return [];
    }
  }

  private parseHackerNews(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];
    
    $('.athing').each((i, elem) => {
      const $elem = $(elem);
      const $subtext = $elem.next();
      
      const title = $elem.find('.titleline > a').first().text();
      const url = $elem.find('.titleline > a').attr('href') || '';
      const points = parseInt($subtext.find('.score').text()) || 0;
      const comments = parseInt($subtext.find('a:contains("comment")').text()) || 0;
      
      if (title && points > 50) {
        items.push({
          title,
          url,
          score: points,
          comments,
          timestamp: new Date(),
          source: 'hackernews',
          tags: this.extractTags(title)
        });
      }
    });
    
    return items;
  }

  private parseReddit(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];
    
    $('[data-testid="post-container"]').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h3').text();
      const url = $elem.find('a[data-click-id="body"]').attr('href') || '';
      const upvotes = this.parseRedditVotes($elem.find('[data-click-id="upvote"]').next().text());
      
      if (title && upvotes > 100) {
        items.push({
          title,
          url: `https://reddit.com${url}`,
          score: upvotes,
          timestamp: new Date(),
          source: 'reddit',
          tags: this.extractTags(title)
        });
      }
    });
    
    return items;
  }

  private parseProductHunt(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];
    
    $('[data-test="post-item"]').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h3').text();
      const url = $elem.find('a').attr('href') || '';
      const votes = parseInt($elem.find('[data-test="vote-count"]').text()) || 0;
      
      if (title && votes > 50) {
        items.push({
          title,
          url: `https://producthunt.com${url}`,
          score: votes,
          timestamp: new Date(),
          source: 'producthunt',
          tags: this.extractTags(title)
        });
      }
    });
    
    return items;
  }

  private parseDevTo(html: string): TrendItem[] {
    const $ = cheerio.load(html);
    const items: TrendItem[] = [];
    
    $('.crayons-story').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2 a').text().trim();
      const url = $elem.find('h2 a').attr('href') || '';
      const reactions = parseInt($elem.find('[data-reaction-count]').attr('data-reaction-count') || '0');
      
      if (title && reactions > 50) {
        items.push({
          title,
          url: `https://dev.to${url}`,
          score: reactions,
          timestamp: new Date(),
          source: 'dev.to',
          tags: this.extractTags(title)
        });
      }
    });
    
    return items;
  }

  private parseRedditVotes(voteText: string): number {
    if (voteText.includes('k')) {
      return parseFloat(voteText) * 1000;
    }
    return parseInt(voteText) || 0;
  }

  private extractTags(title: string): string[] {
    const keywords = [
      'ai', 'automation', 'productivity', 'planning', 'startup',
      'saas', 'tool', 'app', 'software', 'development', 'growth',
      'marketing', 'strategy', 'business', 'team', 'collaboration'
    ];
    
    const titleLower = title.toLowerCase();
    return keywords.filter(keyword => titleLower.includes(keyword));
  }

  private async filterRelevant(trends: TrendItem[]): Promise<TrendItem[]> {
    // Use AI to filter trends relevant to UltraPlan
    const trendTitles = trends.map(t => t.title).join('\n');
    
    const prompt = `
    You are analyzing trending topics for UltraPlan, an AI-powered strategic planning platform.
    
    Filter the following topics for relevance to:
    - Strategic planning and goal setting
    - Productivity and project management
    - AI and automation in business
    - Startup growth and scaling
    - Team collaboration and efficiency
    
    Topics:
    ${trendTitles}
    
    Return a JSON array of relevant topic indices (0-based) and relevance scores (0-1):
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    const relevantIndices = result.relevant || [];
    
    return trends
      .filter((_, index) => relevantIndices.some((r: any) => r.index === index))
      .sort((a, b) => b.score - a.score);
  }

  private async identifyGaps(trends: TrendItem[]): Promise<ContentOpportunity[]> {
    // Use AI to identify content opportunities
    const trendSummary = trends.slice(0, 20).map(t => `- ${t.title}`).join('\n');
    
    const prompt = `
    Based on these trending topics, identify content opportunities for UltraPlan.
    
    Trending Topics:
    ${trendSummary}
    
    Create 10 specific content opportunities that:
    1. Connect trending topics to UltraPlan's features
    2. Solve real problems users are discussing
    3. Have high viral potential
    4. Can be created in multiple formats
    
    Return JSON with this structure for each opportunity:
    {
      "topic": "specific topic",
      "angle": "unique angle or perspective",
      "targetAudience": "specific audience segment",
      "estimatedReach": number (potential views),
      "contentTypes": ["blog", "video", "thread", etc],
      "keywords": ["seo", "keywords"]
    }
    `;
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const opportunities = JSON.parse(content).opportunities || [];
    
    return opportunities;
  }

  private calculateUrgency(trends: TrendItem[]): number {
    // Calculate urgency based on trend velocity and recency
    const now = new Date();
    let urgencyScore = 0;
    
    trends.slice(0, 10).forEach(trend => {
      const hoursSince = (now.getTime() - trend.timestamp.getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.max(0, 1 - (hoursSince / 24));
      const velocityFactor = Math.min(1, trend.score / 1000);
      
      urgencyScore += (recencyFactor * 0.6 + velocityFactor * 0.4);
    });
    
    return Math.min(1, urgencyScore / 10);
  }

  private async predictVirality(trends: TrendItem[]): Promise<number> {
    // Use historical data and AI to predict viral potential
    const features = trends.slice(0, 5).map(trend => ({
      score: trend.score,
      comments: trend.comments || 0,
      tags: trend.tags.length,
      titleLength: trend.title.length,
      hasNumbers: /\d/.test(trend.title),
      hasQuestion: trend.title.includes('?')
    }));
    
    // Simplified virality prediction
    let viralScore = 0;
    features.forEach(f => {
      viralScore += f.score / 1000;
      viralScore += f.comments / 500;
      viralScore += f.tags * 0.1;
      viralScore += f.hasNumbers ? 0.2 : 0;
      viralScore += f.hasQuestion ? 0.15 : 0;
    });
    
    return Math.min(1, viralScore / features.length);
  }
}

// Export for worker process
export default TrendAnalyzer;