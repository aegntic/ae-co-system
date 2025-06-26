import { EventEmitter } from 'events';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

interface PlatformMetrics {
  platform: 'youtube' | 'linkedin' | 'internal';
  videoId: string;
  userId: string;
  uploadedAt: Date;
  metrics: {
    views: number;
    watchTime: number;
    averageViewDuration: number;
    clickThroughRate: number;
    likes: number;
    comments: number;
    shares: number;
    retention: number[];
    audienceRetention: {
      absolute: number[];
      relative: number[];
    };
    impressions?: number;
    engagementRate?: number;
  };
  lastUpdated: Date;
}

interface PredictedMetrics {
  engagement: number;
  retention: number;
  ctr: number;
  watchTime: number;
  viralPotential: number;
}

interface ModelUpdatePayload {
  userId: string;
  videoId: string;
  predicted: PredictedMetrics;
  actual: PlatformMetrics;
  accuracy: {
    engagement: number;
    retention: number;
    ctr: number;
    watchTime: number;
  };
  insights: string[];
}

export class PerformanceFeedbackLoop extends EventEmitter {
  private prisma: PrismaClient;
  private youtubeApiKey: string;
  private linkedinAccessToken: string;
  private updateInterval: NodeJS.Timer | null = null;
  private modelUpdateQueue: ModelUpdatePayload[] = [];

  constructor(
    prisma: PrismaClient,
    youtubeApiKey: string,
    linkedinAccessToken: string
  ) {
    super();
    this.prisma = prisma;
    this.youtubeApiKey = youtubeApiKey;
    this.linkedinAccessToken = linkedinAccessToken;
  }

  /**
   * Start the feedback loop to continuously monitor video performance
   */
  async startFeedbackLoop(intervalMinutes: number = 60): Promise<void> {
    console.log(`Starting performance feedback loop with ${intervalMinutes}min interval`);
    
    // Initial collection
    await this.collectAllMetrics();
    
    // Set up recurring collection
    this.updateInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        console.error('Error in feedback loop iteration:', error);
        this.emit('error', error);
      }
    }, intervalMinutes * 60 * 1000);
    
    this.emit('started', { intervalMinutes });
  }

  /**
   * Stop the feedback loop
   */
  stopFeedbackLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.emit('stopped');
    }
  }

  /**
   * Collect metrics from all platforms for all tracked videos
   */
  async collectAllMetrics(): Promise<void> {
    console.log('Collecting metrics from all platforms...');
    
    try {
      // Get all videos that need metric updates
      const videosToUpdate = await this.prisma.video.findMany({
        where: {
          publishedAt: {
            not: null,
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          },
          platformId: {
            not: null
          }
        },
        include: {
          predictions: true,
          user: {
            include: {
              brandProfile: true
            }
          }
        }
      });

      console.log(`Found ${videosToUpdate.length} videos to update`);

      // Collect metrics for each video
      const metricsPromises = videosToUpdate.map(async (video) => {
        try {
          let metrics: PlatformMetrics | null = null;

          switch (video.platform) {
            case 'youtube':
              metrics = await this.collectYouTubeMetrics(video.platformId!, video.userId);
              break;
            case 'linkedin':
              metrics = await this.collectLinkedInMetrics(video.platformId!, video.userId);
              break;
            case 'internal':
              metrics = await this.collectInternalMetrics(video.id, video.userId);
              break;
          }

          if (metrics && video.predictions) {
            await this.processMetricsUpdate(video, metrics);
          }
        } catch (error) {
          console.error(`Error collecting metrics for video ${video.id}:`, error);
          this.emit('metricError', { videoId: video.id, error });
        }
      });

      await Promise.all(metricsPromises);

      // Process model updates in batch
      if (this.modelUpdateQueue.length > 0) {
        await this.batchUpdatePersonalModels();
      }

      this.emit('metricsCollected', { 
        videosProcessed: videosToUpdate.length,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error in collectAllMetrics:', error);
      throw error;
    }
  }

  /**
   * Collect metrics from YouTube Analytics API
   */
  async collectYouTubeMetrics(videoId: string, userId: string): Promise<PlatformMetrics> {
    try {
      // YouTube Analytics API v2
      const response = await axios.get(
        `https://youtubeanalytics.googleapis.com/v2/reports`,
        {
          params: {
            ids: 'channel==MINE',
            startDate: '2020-01-01',
            endDate: new Date().toISOString().split('T')[0],
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,clickThroughRate,likes,comments,shares,audienceWatchRatio',
            dimensions: 'video',
            filters: `video==${videoId}`,
            key: this.youtubeApiKey
          },
          headers: {
            'Authorization': `Bearer ${await this.getYouTubeAccessToken(userId)}`
          }
        }
      );

      const data = response.data.rows?.[0];
      if (!data) {
        throw new Error(`No data found for YouTube video ${videoId}`);
      }

      // Get retention data
      const retentionResponse = await axios.get(
        `https://youtubeanalytics.googleapis.com/v2/reports`,
        {
          params: {
            ids: 'channel==MINE',
            startDate: '2020-01-01',
            endDate: new Date().toISOString().split('T')[0],
            metrics: 'audienceWatchRatio',
            dimensions: 'elapsedVideoTimeRatio',
            filters: `video==${videoId}`,
            key: this.youtubeApiKey
          },
          headers: {
            'Authorization': `Bearer ${await this.getYouTubeAccessToken(userId)}`
          }
        }
      );

      const retentionData = retentionResponse.data.rows || [];
      const retention = retentionData.map((row: any) => row[1]);

      return {
        platform: 'youtube',
        videoId,
        userId,
        uploadedAt: new Date(), // Would get from video details API
        metrics: {
          views: data[1],
          watchTime: data[2] * 60, // Convert minutes to seconds
          averageViewDuration: data[3],
          clickThroughRate: data[4],
          likes: data[5],
          comments: data[6],
          shares: data[7],
          retention: retention,
          audienceRetention: {
            absolute: retention,
            relative: retention.map((r: number) => r / (retention[0] || 1))
          },
          impressions: data[0], // From different API call
          engagementRate: (data[5] + data[6] + data[7]) / data[1] // Calculated
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error collecting YouTube metrics:', error);
      throw error;
    }
  }

  /**
   * Collect metrics from LinkedIn API
   */
  async collectLinkedInMetrics(videoId: string, userId: string): Promise<PlatformMetrics> {
    try {
      // LinkedIn Video Analytics API
      const response = await axios.get(
        `https://api.linkedin.com/v2/videoAnalytics`,
        {
          params: {
            q: 'video',
            video: `urn:li:video:${videoId}`,
            timeGranularity: 'TOTAL'
          },
          headers: {
            'Authorization': `Bearer ${this.linkedinAccessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const analytics = response.data.elements?.[0];
      if (!analytics) {
        throw new Error(`No data found for LinkedIn video ${videoId}`);
      }

      return {
        platform: 'linkedin',
        videoId,
        userId,
        uploadedAt: new Date(analytics.createdAt),
        metrics: {
          views: analytics.viewCount || 0,
          watchTime: analytics.totalWatchTimeInSeconds || 0,
          averageViewDuration: analytics.averageViewDurationInSeconds || 0,
          clickThroughRate: analytics.clickThroughRate || 0,
          likes: analytics.likeCount || 0,
          comments: analytics.commentCount || 0,
          shares: analytics.shareCount || 0,
          retention: [], // LinkedIn doesn't provide detailed retention
          audienceRetention: {
            absolute: [],
            relative: []
          },
          impressions: analytics.impressionCount || 0,
          engagementRate: analytics.engagementRate || 0
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error collecting LinkedIn metrics:', error);
      throw error;
    }
  }

  /**
   * Collect metrics from internal analytics system
   */
  async collectInternalMetrics(videoId: string, userId: string): Promise<PlatformMetrics> {
    try {
      // Query internal analytics database
      const analytics = await this.prisma.videoAnalytics.findFirst({
        where: { videoId },
        orderBy: { createdAt: 'desc' }
      });

      if (!analytics) {
        throw new Error(`No analytics found for internal video ${videoId}`);
      }

      return {
        platform: 'internal',
        videoId,
        userId,
        uploadedAt: analytics.createdAt,
        metrics: {
          views: analytics.views,
          watchTime: analytics.totalWatchTime,
          averageViewDuration: analytics.averageWatchTime,
          clickThroughRate: 0, // Not applicable for internal
          likes: analytics.likes || 0,
          comments: analytics.comments || 0,
          shares: analytics.shares || 0,
          retention: analytics.retentionData as number[],
          audienceRetention: {
            absolute: analytics.retentionData as number[],
            relative: (analytics.retentionData as number[]).map(r => r / (analytics.retentionData[0] || 1))
          },
          engagementRate: analytics.engagementRate || 0
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error collecting internal metrics:', error);
      throw error;
    }
  }

  /**
   * Process metrics update and compare with predictions
   */
  async processMetricsUpdate(video: any, actualMetrics: PlatformMetrics): Promise<void> {
    const predicted: PredictedMetrics = {
      engagement: video.predictions.engagement,
      retention: video.predictions.retention,
      ctr: video.predictions.ctr,
      watchTime: video.predictions.watchTime,
      viralPotential: video.predictions.viralPotential
    };

    // Calculate accuracy
    const accuracy = {
      engagement: this.calculateAccuracy(
        predicted.engagement,
        actualMetrics.metrics.engagementRate || 0
      ),
      retention: this.calculateAccuracy(
        predicted.retention,
        actualMetrics.metrics.averageViewDuration / video.duration
      ),
      ctr: this.calculateAccuracy(
        predicted.ctr,
        actualMetrics.metrics.clickThroughRate
      ),
      watchTime: this.calculateAccuracy(
        predicted.watchTime,
        actualMetrics.metrics.averageViewDuration
      )
    };

    // Generate insights
    const insights = this.generateInsights(predicted, actualMetrics, accuracy);

    // Queue model update
    this.modelUpdateQueue.push({
      userId: video.userId,
      videoId: video.id,
      predicted,
      actual: actualMetrics,
      accuracy,
      insights
    });

    // Store metrics history
    await this.prisma.metricsHistory.create({
      data: {
        videoId: video.id,
        platform: actualMetrics.platform,
        metrics: actualMetrics.metrics,
        predictedMetrics: predicted,
        accuracy,
        insights,
        collectedAt: new Date()
      }
    });

    this.emit('metricsProcessed', {
      videoId: video.id,
      accuracy,
      insights
    });
  }

  /**
   * Calculate prediction accuracy
   */
  private calculateAccuracy(predicted: number, actual: number): number {
    if (predicted === 0 && actual === 0) return 1;
    if (predicted === 0 || actual === 0) return 0;
    
    const error = Math.abs(predicted - actual) / actual;
    return Math.max(0, 1 - error);
  }

  /**
   * Generate insights from prediction vs actual comparison
   */
  private generateInsights(
    predicted: PredictedMetrics,
    actual: PlatformMetrics,
    accuracy: any
  ): string[] {
    const insights: string[] = [];

    // Engagement insights
    if (accuracy.engagement < 0.7) {
      if (predicted.engagement > actual.metrics.engagementRate!) {
        insights.push('Engagement was overestimated. Consider adjusting for content type or audience segment.');
      } else {
        insights.push('Engagement exceeded predictions! This content style resonates well.');
      }
    }

    // Retention insights
    if (accuracy.retention < 0.7) {
      if (predicted.retention > actual.metrics.averageViewDuration / actual.metrics.watchTime) {
        insights.push('Viewers dropped off earlier than expected. Review pacing and hook strength.');
      } else {
        insights.push('Excellent retention! The content structure worked well.');
      }
    }

    // CTR insights
    if (accuracy.ctr < 0.7) {
      if (predicted.ctr > actual.metrics.clickThroughRate) {
        insights.push('CTR underperformed. Consider A/B testing thumbnails and titles.');
      } else {
        insights.push('CTR exceeded expectations! The thumbnail/title combination is effective.');
      }
    }

    // Platform-specific insights
    if (actual.platform === 'youtube' && actual.metrics.retention.length > 0) {
      const avgRetention = actual.metrics.retention.reduce((a, b) => a + b, 0) / actual.metrics.retention.length;
      if (avgRetention < 0.4) {
        insights.push('YouTube retention is below 40%. Focus on the first 15 seconds.');
      }
    }

    return insights;
  }

  /**
   * Batch update personal models with accumulated feedback
   */
  async batchUpdatePersonalModels(): Promise<void> {
    console.log(`Processing ${this.modelUpdateQueue.length} model updates...`);

    // Group updates by user
    const updatesByUser = new Map<string, ModelUpdatePayload[]>();
    
    for (const update of this.modelUpdateQueue) {
      if (!updatesByUser.has(update.userId)) {
        updatesByUser.set(update.userId, []);
      }
      updatesByUser.get(update.userId)!.push(update);
    }

    // Process each user's updates
    for (const [userId, updates] of updatesByUser) {
      try {
        await this.updateUserModel(userId, updates);
      } catch (error) {
        console.error(`Error updating model for user ${userId}:`, error);
        this.emit('modelUpdateError', { userId, error });
      }
    }

    // Clear the queue
    this.modelUpdateQueue = [];
    
    this.emit('modelsUpdated', { 
      usersUpdated: updatesByUser.size,
      totalUpdates: this.modelUpdateQueue.length 
    });
  }

  /**
   * Update a specific user's personal model
   */
  private async updateUserModel(userId: string, updates: ModelUpdatePayload[]): Promise<void> {
    // Get user's brand profile
    const brandProfile = await this.prisma.userBrandProfile.findUnique({
      where: { userId }
    });

    if (!brandProfile) {
      console.warn(`No brand profile found for user ${userId}`);
      return;
    }

    // Calculate average accuracies
    const avgAccuracy = {
      engagement: updates.reduce((sum, u) => sum + u.accuracy.engagement, 0) / updates.length,
      retention: updates.reduce((sum, u) => sum + u.accuracy.retention, 0) / updates.length,
      ctr: updates.reduce((sum, u) => sum + u.accuracy.ctr, 0) / updates.length,
      watchTime: updates.reduce((sum, u) => sum + u.accuracy.watchTime, 0) / updates.length
    };

    // Extract successful patterns
    const successfulPatterns = updates
      .filter(u => u.accuracy.engagement > 0.8)
      .map(u => ({
        videoId: u.videoId,
        patterns: u.insights.filter(i => i.includes('exceeded') || i.includes('Excellent'))
      }));

    // Extract areas for improvement
    const improvementAreas = updates
      .filter(u => u.accuracy.engagement < 0.6)
      .map(u => ({
        videoId: u.videoId,
        areas: u.insights.filter(i => i.includes('underperformed') || i.includes('dropped off'))
      }));

    // Update brand profile with learned patterns
    const updatedModelData = {
      ...brandProfile.modelData,
      accuracyHistory: [
        ...(brandProfile.modelData?.accuracyHistory || []),
        { date: new Date(), accuracy: avgAccuracy }
      ],
      successfulPatterns: [
        ...(brandProfile.modelData?.successfulPatterns || []),
        ...successfulPatterns
      ],
      improvementAreas: improvementAreas,
      lastUpdated: new Date(),
      totalVideosAnalyzed: (brandProfile.modelData?.totalVideosAnalyzed || 0) + updates.length
    };

    // Update the database
    await this.prisma.userBrandProfile.update({
      where: { userId },
      data: {
        modelData: updatedModelData,
        modelAccuracy: avgAccuracy.engagement, // Overall accuracy metric
        lastModelUpdate: new Date()
      }
    });

    // Create brand learning event
    await this.prisma.brandLearningEvent.create({
      data: {
        userId,
        eventType: 'MODEL_UPDATE',
        eventData: {
          videosAnalyzed: updates.length,
          averageAccuracy: avgAccuracy,
          keyInsights: updates.flatMap(u => u.insights).slice(0, 5)
        },
        impact: avgAccuracy.engagement - (brandProfile.modelAccuracy || 0.5),
        timestamp: new Date()
      }
    });

    console.log(`Updated model for user ${userId} with ${updates.length} data points`);
  }

  /**
   * Get YouTube access token for a user (would need OAuth implementation)
   */
  private async getYouTubeAccessToken(userId: string): Promise<string> {
    // In production, this would retrieve the user's stored OAuth token
    // and refresh it if necessary
    const userAuth = await this.prisma.userAuthentication.findFirst({
      where: {
        userId,
        provider: 'youtube'
      }
    });

    if (!userAuth || !userAuth.accessToken) {
      throw new Error(`No YouTube authentication found for user ${userId}`);
    }

    // Check if token needs refresh
    if (userAuth.expiresAt && userAuth.expiresAt < new Date()) {
      // Refresh token logic would go here
      console.log('Token expired, would refresh here');
    }

    return userAuth.accessToken;
  }

  /**
   * Get current feedback loop status
   */
  getStatus(): {
    isRunning: boolean;
    queueLength: number;
    lastUpdate?: Date;
  } {
    return {
      isRunning: this.updateInterval !== null,
      queueLength: this.modelUpdateQueue.length,
      lastUpdate: new Date() // Would track actual last update time
    };
  }
}