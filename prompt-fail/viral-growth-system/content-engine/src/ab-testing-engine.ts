import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as stats from 'simple-statistics';
import { GeneratedContent } from './content-generator';

interface Variant {
  id: string;
  type: 'headline' | 'thumbnail' | 'hook' | 'cta';
  content: string;
  metadata?: any;
}

interface Experiment {
  id: string;
  contentId: string;
  platform: string;
  variants: Variant[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'stopped';
  config: ExperimentConfig;
  results?: ExperimentResults;
}

interface ExperimentConfig {
  duration: string;
  minSampleSize: number;
  confidenceLevel: number;
  trafficAllocation: { [variantId: string]: number };
  successMetrics: string[];
}

interface ExperimentResults {
  winner: Variant;
  winnerMetrics: VariantMetrics;
  allResults: Map<string, VariantMetrics>;
  statisticalSignificance: number;
  improvementPercentage: number;
}

interface VariantMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  engagement: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  avgEngagementTime: number;
}

export class ABTestingEngine {
  private redis: Redis;
  private experiments: Map<string, Experiment>;
  private mlModelCache: Map<string, any>;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    this.experiments = new Map();
    this.mlModelCache = new Map();
    
    // Load active experiments
    this.loadActiveExperiments();
    
    // Start monitoring loop
    this.startMonitoring();
  }

  async runExperiment(content: GeneratedContent, platform: string): Promise<Experiment> {
    console.log(`🧪 Starting A/B test for content ${content.id} on ${platform}`);

    // Generate variants based on content type
    const variants = await this.generateVariants(content, {
      headlines: 10,
      thumbnails: 5,
      hooks: 8,
      ctas: 6
    });

    // Create experiment
    const experiment: Experiment = {
      id: uuidv4(),
      contentId: content.id,
      platform,
      variants: this.selectBestVariants(variants),
      startTime: new Date(),
      status: 'running',
      config: {
        duration: '4 hours',
        minSampleSize: 1000,
        confidenceLevel: 0.95,
        trafficAllocation: this.calculateTrafficAllocation(variants),
        successMetrics: ['ctr', 'conversionRate', 'engagement']
      }
    };

    // Deploy variants
    await this.deployVariants(experiment);

    // Store experiment
    this.experiments.set(experiment.id, experiment);
    await this.redis.setex(
      `experiment:${experiment.id}`,
      24 * 60 * 60, // 24 hour TTL
      JSON.stringify(experiment)
    );

    // Monitor results
    this.monitorExperiment(experiment);

    return experiment;
  }

  private async generateVariants(content: GeneratedContent, counts: any): Promise<Variant[]> {
    const variants: Variant[] = [];

    // Generate headline variants
    if (content.formats.blogPost) {
      const headlines = await this.generateHeadlineVariants(
        content.formats.blogPost.title,
        content.opportunity,
        counts.headlines
      );
      variants.push(...headlines);
    }

    // Generate thumbnail variants
    if (content.formats.youtubeShort) {
      const thumbnails = await this.generateThumbnailVariants(
        content.formats.youtubeShort.thumbnails,
        content.opportunity.topic,
        counts.thumbnails
      );
      variants.push(...thumbnails);
    }

    // Generate hook variants
    if (content.formats.twitterThread) {
      const hooks = await this.generateHookVariants(
        content.formats.twitterThread.engagementHook,
        content.opportunity,
        counts.hooks
      );
      variants.push(...hooks);
    }

    // Generate CTA variants
    const ctas = await this.generateCTAVariants(
      content.opportunity,
      counts.ctas
    );
    variants.push(...ctas);

    return variants;
  }

  private async generateHeadlineVariants(
    original: string,
    opportunity: any,
    count: number
  ): Promise<Variant[]> {
    const variants: Variant[] = [];
    
    // Different headline formulas
    const formulas = [
      { type: 'question', template: 'How to {action} in {timeframe}?' },
      { type: 'number', template: '{number} Ways to {action} with {tool}' },
      { type: 'challenge', template: 'The {adjective} Challenge: {outcome}' },
      { type: 'comparison', template: '{option1} vs {option2}: Which is Better?' },
      { type: 'secret', template: 'The Secret to {outcome} That {audience} Won\'t Tell You' },
      { type: 'mistake', template: '{number} {audience} Mistakes That Cost {consequence}' },
      { type: 'ultimate', template: 'The Ultimate Guide to {topic} for {audience}' },
      { type: 'shocking', template: 'Why {commonBelief} is Dead Wrong' },
      { type: 'case_study', template: 'How {company} {achieved} with {method}' },
      { type: 'contrarian', template: 'Stop {commonAction}. Do This Instead.' }
    ];

    // Generate variations using AI
    for (let i = 0; i < count; i++) {
      const formula = formulas[i % formulas.length];
      const variant = await this.generateHeadlineWithFormula(
        opportunity,
        formula,
        original
      );

      variants.push({
        id: uuidv4(),
        type: 'headline',
        content: variant,
        metadata: { formula: formula.type }
      });
    }

    return variants;
  }

  private async generateHeadlineWithFormula(
    opportunity: any,
    formula: any,
    original: string
  ): Promise<string> {
    // Use AI to generate headline based on formula
    // This is a simplified version - real implementation would use GPT-4
    const replacements: any = {
      action: opportunity.angle,
      timeframe: '90 seconds',
      number: Math.floor(Math.random() * 7) + 3,
      tool: 'UltraPlan',
      adjective: ['Ultimate', 'Hidden', 'Proven', 'Simple'][Math.floor(Math.random() * 4)],
      outcome: opportunity.topic,
      audience: opportunity.targetAudience,
      commonBelief: 'planning takes hours',
      company: 'Startup X',
      achieved: 'increased productivity 10x',
      method: 'AI planning',
      commonAction: 'wasting time on spreadsheets',
      consequence: 'thousands in lost productivity'
    };

    let headline = formula.template;
    Object.keys(replacements).forEach(key => {
      headline = headline.replace(`{${key}}`, replacements[key]);
    });

    return headline;
  }

  private async generateThumbnailVariants(
    originals: string[],
    topic: string,
    count: number
  ): Promise<Variant[]> {
    const variants: Variant[] = [];
    
    // Different thumbnail styles
    const styles = [
      { type: 'shocked_face', overlay: 'SHOCKING RESULTS!' },
      { type: 'before_after', overlay: 'TRANSFORM IN SECONDS' },
      { type: 'arrow_pointing', overlay: 'THIS CHANGES EVERYTHING' },
      { type: 'big_numbers', overlay: '10X GROWTH' },
      { type: 'question_mark', overlay: 'IS THIS POSSIBLE?' }
    ];

    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      const baseImage = originals[i % originals.length];
      
      // Generate thumbnail variant with overlay
      const variantUrl = await this.createThumbnailVariant(
        baseImage,
        style,
        topic
      );

      variants.push({
        id: uuidv4(),
        type: 'thumbnail',
        content: variantUrl,
        metadata: { style: style.type }
      });
    }

    return variants;
  }

  private async generateHookVariants(
    original: string,
    opportunity: any,
    count: number
  ): Promise<Variant[]> {
    const variants: Variant[] = [];
    
    // Different hook patterns
    const patterns = [
      { type: 'story', start: 'Last week, I discovered something that...' },
      { type: 'statistic', start: '87% of founders don\'t know this...' },
      { type: 'question', start: 'What if I told you...' },
      { type: 'controversy', start: 'Everyone is wrong about...' },
      { type: 'revelation', start: 'I just realized why...' },
      { type: 'challenge', start: 'I bet you can\'t...' },
      { type: 'confession', start: 'I\'ve been lying to myself about...' },
      { type: 'prediction', start: 'In 2025, this will be obsolete...' }
    ];

    for (let i = 0; i < count; i++) {
      const pattern = patterns[i % patterns.length];
      const hook = await this.generateHookWithPattern(
        opportunity,
        pattern,
        original
      );

      variants.push({
        id: uuidv4(),
        type: 'hook',
        content: hook,
        metadata: { pattern: pattern.type }
      });
    }

    return variants;
  }

  private async generateHookWithPattern(
    opportunity: any,
    pattern: any,
    original: string
  ): Promise<string> {
    // Generate hook based on pattern
    return `${pattern.start} ${opportunity.angle}`;
  }

  private async generateCTAVariants(
    opportunity: any,
    count: number
  ): Promise<Variant[]> {
    const variants: Variant[] = [];
    
    // Different CTA styles
    const styles = [
      { type: 'urgency', template: 'Start now - {benefit} in {time}' },
      { type: 'social_proof', template: 'Join {number}+ {audience} already {action}' },
      { type: 'question', template: 'Ready to {outcome}? Start free →' },
      { type: 'benefit', template: 'Get {benefit} without {pain}' },
      { type: 'challenge', template: 'See if you can {achievement} →' },
      { type: 'exclusive', template: 'Get early access to {feature}' }
    ];

    for (let i = 0; i < count; i++) {
      const style = styles[i % styles.length];
      const cta = this.generateCTAWithStyle(opportunity, style);

      variants.push({
        id: uuidv4(),
        type: 'cta',
        content: cta,
        metadata: { style: style.type }
      });
    }

    return variants;
  }

  private generateCTAWithStyle(opportunity: any, style: any): string {
    const replacements: any = {
      benefit: 'perfect plans',
      time: '90 seconds',
      number: '10,000',
      audience: opportunity.targetAudience,
      action: 'transforming their planning',
      outcome: opportunity.angle,
      pain: 'the complexity',
      achievement: 'plan your entire quarter',
      feature: 'AI Planning Assistant'
    };

    let cta = style.template;
    Object.keys(replacements).forEach(key => {
      cta = cta.replace(`{${key}}`, replacements[key]);
    });

    return cta;
  }

  private selectBestVariants(variants: Variant[]): Variant[] {
    // Use historical data to select most promising variants
    const selected: Variant[] = [];
    const byType = this.groupVariantsByType(variants);

    for (const [type, typeVariants] of byType) {
      // Score each variant based on historical performance
      const scored = typeVariants.map(v => ({
        variant: v,
        score: this.scoreVariant(v)
      }));

      // Sort by score and take top performers
      scored.sort((a, b) => b.score - a.score);
      selected.push(...scored.slice(0, 3).map(s => s.variant));
    }

    return selected;
  }

  private groupVariantsByType(variants: Variant[]): Map<string, Variant[]> {
    const grouped = new Map<string, Variant[]>();
    
    variants.forEach(v => {
      if (!grouped.has(v.type)) {
        grouped.set(v.type, []);
      }
      grouped.get(v.type)!.push(v);
    });

    return grouped;
  }

  private scoreVariant(variant: Variant): number {
    // Score based on historical performance of similar variants
    let score = Math.random(); // Base random score
    
    // Boost score based on metadata patterns that historically perform well
    if (variant.metadata) {
      if (variant.metadata.formula === 'number') score += 0.2;
      if (variant.metadata.style === 'before_after') score += 0.15;
      if (variant.metadata.pattern === 'statistic') score += 0.1;
    }

    return score;
  }

  private calculateTrafficAllocation(variants: Variant[]): { [id: string]: number } {
    const allocation: { [id: string]: number } = {};
    
    // Multi-armed bandit approach - give more traffic to promising variants
    const scores = variants.map(v => this.scoreVariant(v));
    const totalScore = scores.reduce((a, b) => a + b, 0);
    
    variants.forEach((v, i) => {
      // Minimum 10% traffic to each variant for statistical significance
      const baseAllocation = 0.1;
      const performanceAllocation = (scores[i] / totalScore) * 0.6;
      allocation[v.id] = baseAllocation + performanceAllocation;
    });

    return allocation;
  }

  private async deployVariants(experiment: Experiment): Promise<void> {
    // Deploy variants to the platform
    console.log(`🚀 Deploying ${experiment.variants.length} variants for experiment ${experiment.id}`);

    // Store variant mappings
    for (const variant of experiment.variants) {
      await this.redis.setex(
        `variant:${variant.id}`,
        24 * 60 * 60,
        JSON.stringify({
          experimentId: experiment.id,
          variant,
          metrics: this.initializeMetrics()
        })
      );
    }

    // Set up traffic routing
    await this.setupTrafficRouting(experiment);
  }

  private initializeMetrics(): VariantMetrics {
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      engagement: 0,
      revenue: 0,
      ctr: 0,
      conversionRate: 0,
      avgEngagementTime: 0
    };
  }

  private async setupTrafficRouting(experiment: Experiment): Promise<void> {
    // Configure CDN/load balancer for traffic splitting
    const routingConfig = {
      experimentId: experiment.id,
      rules: experiment.variants.map(v => ({
        variantId: v.id,
        weight: experiment.config.trafficAllocation[v.id],
        content: v.content
      }))
    };

    await this.redis.setex(
      `routing:${experiment.id}`,
      24 * 60 * 60,
      JSON.stringify(routingConfig)
    );
  }

  private async monitorExperiment(experiment: Experiment): Promise<void> {
    const checkInterval = 5 * 60 * 1000; // Check every 5 minutes

    const monitor = setInterval(async () => {
      const metrics = await this.collectMetrics(experiment);
      const analysis = this.analyzeResults(metrics);

      // Check if we have enough data
      if (this.hasStatisticalSignificance(analysis)) {
        await this.concludeExperiment(experiment, analysis);
        clearInterval(monitor);
      }

      // Check if experiment duration has ended
      const duration = new Date().getTime() - experiment.startTime.getTime();
      const maxDuration = this.parseDuration(experiment.config.duration);
      
      if (duration >= maxDuration) {
        await this.concludeExperiment(experiment, analysis);
        clearInterval(monitor);
      }
    }, checkInterval);
  }

  private async collectMetrics(experiment: Experiment): Promise<Map<string, VariantMetrics>> {
    const metrics = new Map<string, VariantMetrics>();

    for (const variant of experiment.variants) {
      const data = await this.redis.get(`variant:${variant.id}:metrics`);
      if (data) {
        metrics.set(variant.id, JSON.parse(data));
      }
    }

    return metrics;
  }

  private analyzeResults(metrics: Map<string, VariantMetrics>): ExperimentResults {
    // Calculate statistical significance
    const variantData = Array.from(metrics.entries()).map(([id, m]) => ({
      id,
      successRate: m.conversionRate,
      sampleSize: m.impressions
    }));

    // Find the best performing variant
    const sorted = variantData.sort((a, b) => b.successRate - a.successRate);
    const winner = sorted[0];
    const control = sorted[sorted.length - 1];

    // Calculate improvement
    const improvement = ((winner.successRate - control.successRate) / control.successRate) * 100;

    // Statistical significance test (simplified)
    const significance = this.calculateSignificance(winner, control);

    return {
      winner: this.experiments.get(variantData[0].id)!.variants.find(v => v.id === winner.id)!,
      winnerMetrics: metrics.get(winner.id)!,
      allResults: metrics,
      statisticalSignificance: significance,
      improvementPercentage: improvement
    };
  }

  private hasStatisticalSignificance(analysis: ExperimentResults): boolean {
    // Check if we have enough samples and significance
    const minSamples = 1000;
    const minSignificance = 0.95;

    const totalSamples = Array.from(analysis.allResults.values())
      .reduce((sum, m) => sum + m.impressions, 0);

    return totalSamples >= minSamples && 
           analysis.statisticalSignificance >= minSignificance;
  }

  private calculateSignificance(winner: any, control: any): number {
    // Simplified z-test for proportions
    const p1 = winner.successRate;
    const p2 = control.successRate;
    const n1 = winner.sampleSize;
    const n2 = control.sampleSize;

    const pooledProp = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledProp * (1 - pooledProp) * (1/n1 + 1/n2));
    const z = (p1 - p2) / se;

    // Convert z-score to confidence level
    return this.zToConfidence(Math.abs(z));
  }

  private zToConfidence(z: number): number {
    // Simplified conversion
    if (z >= 2.58) return 0.99;
    if (z >= 1.96) return 0.95;
    if (z >= 1.64) return 0.90;
    return z / 3; // Rough approximation for lower values
  }

  private async concludeExperiment(
    experiment: Experiment,
    analysis: ExperimentResults
  ): Promise<void> {
    console.log(`🏁 Concluding experiment ${experiment.id}`);
    console.log(`🏆 Winner: ${analysis.winner.content}`);
    console.log(`📈 Improvement: ${analysis.improvementPercentage.toFixed(2)}%`);

    // Update experiment status
    experiment.endTime = new Date();
    experiment.status = 'completed';
    experiment.results = analysis;

    // Store results
    await this.redis.setex(
      `experiment:${experiment.id}:results`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(analysis)
    );

    // Scale winning variant
    await this.scaleWinningVariant(analysis.winner, experiment);

    // Update ML model
    await this.updateMLModel(experiment, analysis);
  }

  private async scaleWinningVariant(winner: Variant, experiment: Experiment): Promise<void> {
    // Route 100% traffic to winner
    await this.redis.setex(
      `routing:${experiment.id}:winner`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({
        variantId: winner.id,
        content: winner.content,
        metadata: winner.metadata
      })
    );

    console.log(`✅ Scaled winner to 100% traffic`);
  }

  private async updateMLModel(experiment: Experiment, results: ExperimentResults): Promise<void> {
    // Update ML model with experiment results
    const trainingData = {
      experiment: {
        platform: experiment.platform,
        contentType: experiment.variants[0].type,
        duration: experiment.endTime!.getTime() - experiment.startTime.getTime()
      },
      variants: experiment.variants.map(v => ({
        ...v,
        metrics: results.allResults.get(v.id)
      })),
      winner: results.winner,
      improvement: results.improvementPercentage
    };

    // Store training data
    await this.redis.lpush(
      'ml:training:experiments',
      JSON.stringify(trainingData)
    );

    // Trigger model retraining (async)
    await this.redis.publish('ml:retrain', 'experiments');
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*(hours?|minutes?|days?)/);
    if (!match) return 4 * 60 * 60 * 1000; // Default 4 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'minute':
      case 'minutes':
        return value * 60 * 1000;
      case 'hour':
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'day':
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 4 * 60 * 60 * 1000;
    }
  }

  private async loadActiveExperiments(): Promise<void> {
    // Load any active experiments from Redis
    const keys = await this.redis.keys('experiment:*');
    
    for (const key of keys) {
      if (!key.includes(':results')) {
        const data = await this.redis.get(key);
        if (data) {
          const experiment = JSON.parse(data);
          if (experiment.status === 'running') {
            this.experiments.set(experiment.id, experiment);
            this.monitorExperiment(experiment);
          }
        }
      }
    }
  }

  private startMonitoring(): void {
    // Monitor all active experiments
    setInterval(() => {
      console.log(`📊 Monitoring ${this.experiments.size} active experiments`);
    }, 60 * 1000); // Log every minute
  }

  private async createThumbnailVariant(
    baseImage: string,
    style: any,
    topic: string
  ): Promise<string> {
    // This would use a real image manipulation service
    // For now, return a placeholder
    return `https://cdn.ultraplan.pro/thumbnails/${style.type}_${Date.now()}.png`;
  }

  // Public methods for tracking metrics
  async trackImpression(variantId: string): Promise<void> {
    await this.redis.hincrby(`variant:${variantId}:metrics`, 'impressions', 1);
  }

  async trackClick(variantId: string): Promise<void> {
    await this.redis.hincrby(`variant:${variantId}:metrics`, 'clicks', 1);
    
    // Update CTR
    const metrics = await this.redis.hgetall(`variant:${variantId}:metrics`);
    const ctr = parseInt(metrics.clicks) / parseInt(metrics.impressions);
    await this.redis.hset(`variant:${variantId}:metrics`, 'ctr', ctr.toString());
  }

  async trackConversion(variantId: string, revenue?: number): Promise<void> {
    await this.redis.hincrby(`variant:${variantId}:metrics`, 'conversions', 1);
    
    if (revenue) {
      await this.redis.hincrbyfloat(`variant:${variantId}:metrics`, 'revenue', revenue);
    }

    // Update conversion rate
    const metrics = await this.redis.hgetall(`variant:${variantId}:metrics`);
    const conversionRate = parseInt(metrics.conversions) / parseInt(metrics.impressions);
    await this.redis.hset(`variant:${variantId}:metrics`, 'conversionRate', conversionRate.toString());
  }

  async trackEngagement(variantId: string, duration: number): Promise<void> {
    await this.redis.hincrby(`variant:${variantId}:metrics`, 'engagement', 1);
    await this.redis.hincrbyfloat(`variant:${variantId}:metrics`, 'totalEngagementTime', duration);
    
    // Update average engagement time
    const metrics = await this.redis.hgetall(`variant:${variantId}:metrics`);
    const avgTime = parseFloat(metrics.totalEngagementTime) / parseInt(metrics.engagement);
    await this.redis.hset(`variant:${variantId}:metrics`, 'avgEngagementTime', avgTime.toString());
  }
}

export default ABTestingEngine;