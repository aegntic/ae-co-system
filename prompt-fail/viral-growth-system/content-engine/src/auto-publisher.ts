import { Twitter } from 'twitter-api-v2';
import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import cron from 'node-cron';
import { GeneratedContent } from './content-generator';

interface Platform {
  name: string;
  api: any;
  postContent: (content: any, api: any) => Promise<string>;
  getOptimalTime: (platform: string) => Date;
  adaptContent: (content: GeneratedContent, platform: string) => Promise<any>;
}

interface PostSchedule {
  platform: string;
  content: any;
  scheduledTime: Date;
  targeting?: any;
  budget?: number;
  status: 'pending' | 'published' | 'failed';
}

interface OptimalTimes {
  [platform: string]: {
    weekday: number[];
    weekend: number[];
    timezone: string;
  };
}

export class AutoPublisher {
  private redis: Redis;
  private publishQueue: Queue;
  private platforms: Map<string, Platform>;
  private optimalTimes: OptimalTimes;
  private analyticsData: Map<string, any>;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    this.publishQueue = new Queue('content-publishing', {
      connection: this.redis
    });

    this.platforms = new Map();
    this.initializePlatforms();
    this.initializeOptimalTimes();
    this.analyticsData = new Map();

    // Start workers
    this.startPublishingWorkers();
    
    // Schedule periodic analytics updates
    this.scheduleAnalyticsUpdates();
  }

  private initializePlatforms() {
    // Twitter/X
    this.platforms.set('twitter', {
      name: 'twitter',
      api: new Twitter({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessSecret: process.env.TWITTER_ACCESS_SECRET!,
      }),
      postContent: this.postToTwitter.bind(this),
      getOptimalTime: this.getOptimalTime.bind(this),
      adaptContent: this.adaptForTwitter.bind(this)
    });

    // TikTok
    this.platforms.set('tiktok', {
      name: 'tiktok',
      api: {
        accessToken: process.env.TIKTOK_ACCESS_TOKEN,
        clientKey: process.env.TIKTOK_CLIENT_KEY
      },
      postContent: this.postToTikTok.bind(this),
      getOptimalTime: this.getOptimalTime.bind(this),
      adaptContent: this.adaptForTikTok.bind(this)
    });

    // YouTube
    this.platforms.set('youtube', {
      name: 'youtube',
      api: {
        apiKey: process.env.YOUTUBE_API_KEY,
        clientId: process.env.YOUTUBE_CLIENT_ID,
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
        refreshToken: process.env.YOUTUBE_REFRESH_TOKEN
      },
      postContent: this.postToYouTube.bind(this),
      getOptimalTime: this.getOptimalTime.bind(this),
      adaptContent: this.adaptForYouTube.bind(this)
    });

    // LinkedIn
    this.platforms.set('linkedin', {
      name: 'linkedin',
      api: {
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
        organizationId: process.env.LINKEDIN_ORG_ID
      },
      postContent: this.postToLinkedIn.bind(this),
      getOptimalTime: this.getOptimalTime.bind(this),
      adaptContent: this.adaptForLinkedIn.bind(this)
    });

    // Reddit
    this.platforms.set('reddit', {
      name: 'reddit',
      api: {
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN
      },
      postContent: this.postToReddit.bind(this),
      getOptimalTime: this.getOptimalTime.bind(this),
      adaptContent: this.adaptForReddit.bind(this)
    });
  }

  private initializeOptimalTimes() {
    // Based on platform-specific research and analytics
    this.optimalTimes = {
      twitter: {
        weekday: [9, 12, 15, 17, 20], // 9 AM, 12 PM, 3 PM, 5 PM, 8 PM
        weekend: [10, 13, 16, 19],
        timezone: 'America/New_York'
      },
      tiktok: {
        weekday: [6, 10, 19, 22], // Early morning and evening
        weekend: [8, 11, 15, 20],
        timezone: 'America/Los_Angeles'
      },
      youtube: {
        weekday: [14, 15, 16], // 2-4 PM
        weekend: [12, 13, 14],
        timezone: 'America/Chicago'
      },
      linkedin: {
        weekday: [7, 10, 12, 17], // Business hours
        weekend: [], // Skip weekends for LinkedIn
        timezone: 'America/New_York'
      },
      reddit: {
        weekday: [8, 12, 17, 21],
        weekend: [10, 14, 18, 22],
        timezone: 'UTC'
      }
    };
  }

  async publishContent(content: GeneratedContent): Promise<Map<string, string>> {
    console.log(`📤 Publishing content ${content.id} across platforms...`);
    
    const publishedUrls = new Map<string, string>();
    const optimalTimes = await this.getOptimalPostingTimes();

    // Schedule posts for each platform
    for (const [platformName, platform] of this.platforms) {
      try {
        const adaptedContent = await platform.adaptContent(content, platformName);
        
        if (!adaptedContent) {
          console.log(`⏭️  Skipping ${platformName} - no suitable content format`);
          continue;
        }

        const postTime = optimalTimes.get(platformName) || new Date();
        const targeting = await this.getAudienceTargeting(platformName, content);
        const budget = this.getAllocatedBudget(platformName, content);

        // Schedule the post
        await this.schedulePost({
          platform: platformName,
          content: adaptedContent,
          scheduledTime: postTime,
          targeting,
          budget,
          status: 'pending'
        });

        console.log(`✅ Scheduled for ${platformName} at ${postTime.toISOString()}`);
      } catch (error) {
        console.error(`❌ Error scheduling for ${platformName}:`, error);
      }
    }

    return publishedUrls;
  }

  private async schedulePost(schedule: PostSchedule): Promise<void> {
    const delay = schedule.scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Post immediately
      await this.publishQueue.add('publish-now', schedule, {
        priority: 1
      });
    } else {
      // Schedule for later
      await this.publishQueue.add('publish-scheduled', schedule, {
        delay,
        priority: 2
      });
    }

    // Store schedule in Redis
    await this.redis.zadd(
      'scheduled-posts',
      schedule.scheduledTime.getTime(),
      JSON.stringify(schedule)
    );
  }

  private startPublishingWorkers() {
    // Worker for immediate publishing
    new Worker('content-publishing', async (job) => {
      const schedule = job.data as PostSchedule;
      const platform = this.platforms.get(schedule.platform);
      
      if (platform) {
        try {
          const postUrl = await platform.postContent(schedule.content, platform.api);
          
          // Update status
          schedule.status = 'published';
          await this.redis.hset(
            `post:${job.id}`,
            'status', 'published',
            'url', postUrl,
            'publishedAt', new Date().toISOString()
          );

          // Track analytics
          await this.trackPublishingAnalytics(schedule.platform, 'success');
          
          console.log(`✅ Published to ${schedule.platform}: ${postUrl}`);
          return postUrl;
        } catch (error) {
          schedule.status = 'failed';
          await this.trackPublishingAnalytics(schedule.platform, 'failure');
          throw error;
        }
      }
    }, {
      connection: this.redis,
      concurrency: 5
    });
  }

  private async getOptimalPostingTimes(): Promise<Map<string, Date>> {
    const times = new Map<string, Date>();
    const now = new Date();

    for (const [platform, config] of Object.entries(this.optimalTimes)) {
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const hours = isWeekend ? config.weekend : config.weekday;
      
      if (hours.length === 0) continue;

      // Find next optimal hour
      const currentHour = now.getHours();
      let nextHour = hours.find(h => h > currentHour);
      
      if (!nextHour) {
        // Schedule for tomorrow
        nextHour = hours[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(nextHour, 0, 0, 0);
        times.set(platform, tomorrow);
      } else {
        const today = new Date(now);
        today.setHours(nextHour, 0, 0, 0);
        times.set(platform, today);
      }
    }

    // Adjust based on real-time analytics
    await this.adjustTimesBasedOnAnalytics(times);

    return times;
  }

  private async adjustTimesBasedOnAnalytics(times: Map<string, Date>): Promise<void> {
    // Get recent performance data
    const analytics = await this.getRecentAnalytics();
    
    for (const [platform, scheduledTime] of times) {
      const platformAnalytics = analytics[platform];
      if (platformAnalytics && platformAnalytics.bestHour) {
        // Adjust to best performing hour if significantly better
        if (platformAnalytics.bestHourPerformance > platformAnalytics.averagePerformance * 1.5) {
          scheduledTime.setHours(platformAnalytics.bestHour);
          times.set(platform, scheduledTime);
        }
      }
    }
  }

  private async getAudienceTargeting(platform: string, content: GeneratedContent): Promise<any> {
    const baseTargeting = {
      interests: content.opportunity.keywords,
      demographics: this.getTargetDemographics(content.opportunity.targetAudience),
      behaviors: ['early_adopters', 'business_decision_makers', 'startup_founders']
    };

    // Platform-specific targeting
    switch (platform) {
      case 'twitter':
        return {
          ...baseTargeting,
          follower_lookalikes: ['@ycombinator', '@ProductHunt', '@TechCrunch'],
          keywords: content.opportunity.keywords
        };
      
      case 'linkedin':
        return {
          ...baseTargeting,
          job_titles: ['CEO', 'Founder', 'Product Manager', 'CTO'],
          company_size: ['1-50', '51-200'],
          industries: ['Technology', 'Software', 'Consulting']
        };
      
      case 'tiktok':
        return {
          ...baseTargeting,
          age_range: [25, 45],
          interests: ['business', 'productivity', 'entrepreneurship']
        };
      
      default:
        return baseTargeting;
    }
  }

  private getTargetDemographics(audience: string): any {
    const demographics: any = {
      age_range: [25, 55],
      gender: 'all',
      education: 'college+',
      income: 'above_average'
    };

    // Adjust based on audience
    if (audience.toLowerCase().includes('startup')) {
      demographics.age_range = [25, 45];
      demographics.interests = ['startups', 'entrepreneurship'];
    } else if (audience.toLowerCase().includes('enterprise')) {
      demographics.age_range = [35, 55];
      demographics.job_level = 'senior';
    }

    return demographics;
  }

  private getAllocatedBudget(platform: string, content: GeneratedContent): number {
    const baseBudget = 50; // $50 base budget per post
    const viralScore = content.metadata.estimatedViralScore;
    
    // Adjust budget based on viral potential
    let multiplier = 1;
    if (viralScore > 0.8) multiplier = 3;
    else if (viralScore > 0.6) multiplier = 2;
    else if (viralScore > 0.4) multiplier = 1.5;

    // Platform-specific adjustments
    const platformMultipliers: { [key: string]: number } = {
      twitter: 1.2,
      linkedin: 1.5,
      tiktok: 0.8,
      youtube: 2.0,
      reddit: 0.5
    };

    const platformMultiplier = platformMultipliers[platform] || 1;
    
    return Math.round(baseBudget * multiplier * platformMultiplier);
  }

  // Platform-specific posting methods
  private async postToTwitter(content: any, api: any): Promise<string> {
    const client = api as Twitter;
    
    if (content.thread) {
      // Post thread
      let previousTweetId: string | undefined;
      const tweetIds: string[] = [];

      for (const tweet of content.thread) {
        const tweetData: any = {
          text: tweet.text
        };

        if (previousTweetId) {
          tweetData.reply = { in_reply_to_tweet_id: previousTweetId };
        }

        if (tweet.media) {
          // Upload media first
          const mediaId = await this.uploadTwitterMedia(tweet.media, client);
          tweetData.media = { media_ids: [mediaId] };
        }

        const response = await client.v2.tweet(tweetData);
        previousTweetId = response.data.id;
        tweetIds.push(previousTweetId);
      }

      return `https://twitter.com/ultraplan/status/${tweetIds[0]}`;
    } else {
      // Single tweet
      const response = await client.v2.tweet(content);
      return `https://twitter.com/ultraplan/status/${response.data.id}`;
    }
  }

  private async uploadTwitterMedia(mediaUrl: string, client: Twitter): Promise<string> {
    // Download media
    const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Upload to Twitter
    const mediaUpload = await client.v1.uploadMedia(buffer, {
      mimeType: 'image/png'
    });
    
    return mediaUpload;
  }

  private async postToTikTok(content: any, api: any): Promise<string> {
    // TikTok API implementation
    const response = await axios.post('https://open-api.tiktok.com/share/video/upload/', {
      access_token: api.accessToken,
      video_url: content.videoUrl,
      title: content.caption,
      privacy_level: 'PUBLIC_TO_EVERYONE'
    });

    return response.data.share_url;
  }

  private async postToYouTube(content: any, api: any): Promise<string> {
    // YouTube API implementation
    const oauth2Client = await this.getYouTubeAuth(api);
    
    const response = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos',
      content.videoBuffer,
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.access_token}`,
          'Content-Type': 'video/mp4'
        },
        params: {
          part: 'snippet,status',
          requestBody: {
            snippet: {
              title: content.title,
              description: content.description,
              tags: content.tags,
              categoryId: '28' // Science & Technology
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false
            }
          }
        }
      }
    );

    return `https://youtube.com/watch?v=${response.data.id}`;
  }

  private async postToLinkedIn(content: any, api: any): Promise<string> {
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: `urn:li:organization:${api.organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: content.media ? 'IMAGE' : 'NONE',
            media: content.media ? [{
              status: 'READY',
              description: { text: content.mediaDescription },
              media: content.mediaUrl
            }] : []
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${api.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    return response.data.id;
  }

  private async postToReddit(content: any, api: any): Promise<string> {
    // Reddit API implementation
    const accessToken = await this.getRedditAccessToken(api);
    
    const response = await axios.post(
      `https://oauth.reddit.com/api/submit`,
      new URLSearchParams({
        api_type: 'json',
        kind: content.kind || 'self',
        sr: content.subreddit,
        title: content.title,
        text: content.text,
        url: content.url || ''
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'UltraPlanBot/1.0'
        }
      }
    );

    return `https://reddit.com${response.data.json.data.permalink}`;
  }

  // Content adaptation methods
  private async adaptForTwitter(content: GeneratedContent, platform: string): Promise<any> {
    if (content.formats.twitterThread) {
      return {
        thread: content.formats.twitterThread.tweets,
        hashtags: content.formats.twitterThread.hashtags
      };
    }
    return null;
  }

  private async adaptForTikTok(content: GeneratedContent, platform: string): Promise<any> {
    if (content.formats.tikTokScript) {
      // Generate video from script
      const videoUrl = await this.generateTikTokVideo(content.formats.tikTokScript);
      
      return {
        videoUrl,
        caption: content.formats.tikTokScript.hook,
        hashtags: content.formats.tikTokScript.hashtags
      };
    }
    return null;
  }

  private async adaptForYouTube(content: GeneratedContent, platform: string): Promise<any> {
    if (content.formats.youtubeShort) {
      // Generate video from script
      const videoBuffer = await this.generateYouTubeVideo(content.formats.youtubeShort);
      
      return {
        videoBuffer,
        title: content.formats.youtubeShort.title,
        description: content.formats.youtubeShort.description,
        tags: content.formats.youtubeShort.tags,
        thumbnail: content.formats.youtubeShort.thumbnails[0]
      };
    }
    return null;
  }

  private async adaptForLinkedIn(content: GeneratedContent, platform: string): Promise<any> {
    if (content.formats.linkedInArticle) {
      return {
        text: content.formats.linkedInArticle.content,
        title: content.formats.linkedInArticle.title,
        media: content.formats.blogPost?.images[0],
        mediaDescription: content.formats.linkedInArticle.summary
      };
    }
    return null;
  }

  private async adaptForReddit(content: GeneratedContent, platform: string): Promise<any> {
    if (content.formats.blogPost) {
      // Determine best subreddit
      const subreddit = await this.selectBestSubreddit(content.opportunity.keywords);
      
      return {
        subreddit,
        title: content.formats.blogPost.title,
        text: this.formatForReddit(content.formats.blogPost.content),
        kind: 'self'
      };
    }
    return null;
  }

  // Helper methods
  private async generateTikTokVideo(script: any): Promise<string> {
    // Use Runway ML or similar to generate video
    // This is a placeholder - implement actual video generation
    return 'https://cdn.ultraplan.pro/videos/generated_tiktok.mp4';
  }

  private async generateYouTubeVideo(script: any): Promise<Buffer> {
    // Generate video using AI tools
    // This is a placeholder - implement actual video generation
    return Buffer.from('video content');
  }

  private formatForReddit(content: string): string {
    // Format content for Reddit markdown
    return content
      .replace(/#{1,6}\s/g, '**') // Convert headers to bold
      .replace(/\*\*/g, '') // Remove existing bold
      .replace(/\n{3,}/g, '\n\n'); // Normalize line breaks
  }

  private async selectBestSubreddit(keywords: string[]): Promise<string> {
    const subredditMap: { [key: string]: string[] } = {
      'Entrepreneur': ['entrepreneur', 'startup', 'business'],
      'productivity': ['productivity', 'planning', 'efficiency'],
      'getmotivated': ['goals', 'success', 'motivation'],
      'smallbusiness': ['small', 'business', 'growth'],
      'startups': ['startup', 'founder', 'scaling']
    };

    for (const [subreddit, subKeywords] of Object.entries(subredditMap)) {
      if (keywords.some(k => subKeywords.includes(k.toLowerCase()))) {
        return subreddit;
      }
    }

    return 'Entrepreneur'; // Default
  }

  private async getYouTubeAuth(api: any): Promise<any> {
    // Implement OAuth2 token refresh
    return { access_token: 'refreshed_token' };
  }

  private async getRedditAccessToken(api: any): Promise<string> {
    // Implement Reddit OAuth2
    return 'reddit_access_token';
  }

  private async trackPublishingAnalytics(platform: string, status: 'success' | 'failure'): Promise<void> {
    const key = `analytics:${platform}:${new Date().toISOString().split('T')[0]}`;
    await this.redis.hincrby(key, status, 1);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
  }

  private async getRecentAnalytics(): Promise<any> {
    // Aggregate recent performance data
    const analytics: any = {};
    
    for (const platform of this.platforms.keys()) {
      const data = await this.redis.hgetall(`analytics:${platform}:performance`);
      analytics[platform] = {
        bestHour: parseInt(data.bestHour || '12'),
        bestHourPerformance: parseFloat(data.bestHourPerformance || '1'),
        averagePerformance: parseFloat(data.averagePerformance || '1')
      };
    }
    
    return analytics;
  }

  private scheduleAnalyticsUpdates() {
    // Update analytics every hour
    cron.schedule('0 * * * *', async () => {
      await this.updatePerformanceAnalytics();
    });
  }

  private async updatePerformanceAnalytics(): Promise<void> {
    // Fetch recent post performance from each platform
    // Update optimal posting times based on engagement data
    console.log('📊 Updating performance analytics...');
    
    // Implementation would fetch actual metrics from each platform's analytics API
    // and update the optimal posting times accordingly
  }

  private getOptimalTime(platform: string): Date {
    const config = this.optimalTimes[platform];
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hours = isWeekend ? config.weekend : config.weekday;
    
    if (hours.length === 0) {
      return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    }
    
    const currentHour = now.getHours();
    const nextHour = hours.find(h => h > currentHour) || hours[0];
    
    const nextTime = new Date(now);
    if (nextHour <= currentHour) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    nextTime.setHours(nextHour, 0, 0, 0);
    
    return nextTime;
  }
}

export default AutoPublisher;