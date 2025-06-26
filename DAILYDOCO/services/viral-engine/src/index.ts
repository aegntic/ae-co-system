/**
 * DailyDoco Pro Viral Engine Service
 * Handles multi-level commission calculations, viral mechanics, and network growth
 * Built for $100 BILLION scale with 10M+ concurrent users
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import pino from 'pino';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { StatsD } from 'node-statsd';
import * as Sentry from '@sentry/node';

// Initialize monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-elasticsearch',
    options: {
      node: process.env.ELASTICSEARCH_URL,
      index: 'viral-engine-logs',
    },
  },
});

const metrics = new StatsD({
  host: process.env.STATSD_HOST || 'localhost',
  port: 8125,
  prefix: 'viral_engine.',
});

// =====================================================
// CONFIGURATION
// =====================================================

interface CommissionRate {
  level: number;
  rate: number;
  cap?: number;
  conditions?: {
    minNetworkSize?: number;
    minMonthlyRevenue?: number;
    requiresKYC?: boolean;
    requiresActiveSubscription?: boolean;
  };
}

const COMMISSION_STRUCTURE: Record<string, CommissionRate[]> = {
  free: [
    { level: 1, rate: 0.10, cap: 100 },
    { level: 2, rate: 0.05, cap: 50 },
    { level: 3, rate: 0.02, cap: 20 },
  ],
  hobby: [
    { level: 1, rate: 0.15 },
    { level: 2, rate: 0.08 },
    { level: 3, rate: 0.04 },
    { level: 4, rate: 0.02 },
  ],
  creator: [
    { level: 1, rate: 0.20 },
    { level: 2, rate: 0.10 },
    { level: 3, rate: 0.05 },
    { level: 4, rate: 0.03 },
    { level: 5, rate: 0.02 },
  ],
  studio: [
    { level: 1, rate: 0.25 },
    { level: 2, rate: 0.12 },
    { level: 3, rate: 0.06 },
    { level: 4, rate: 0.04 },
    { level: 5, rate: 0.03 },
    { level: 6, rate: 0.02 },
  ],
  enterprise: [
    { level: 1, rate: 0.30, conditions: { requiresKYC: true } },
    { level: 2, rate: 0.15, conditions: { requiresKYC: true } },
    { level: 3, rate: 0.08 },
    { level: 4, rate: 0.05 },
    { level: 5, rate: 0.04 },
    { level: 6, rate: 0.03 },
    { level: 7, rate: 0.02 },
  ],
};

// =====================================================
// DATABASE & CACHE CONNECTIONS
// =====================================================

class DatabasePool {
  private pools: Map<number, Pool> = new Map();
  private readonly SHARD_COUNT = 1000;

  constructor(private config: any) {
    this.initializePools();
  }

  private initializePools() {
    // Create connection pools for each shard
    for (let i = 0; i < Math.min(10, this.SHARD_COUNT); i++) {
      this.pools.set(i, new Pool({
        ...this.config,
        max: 100,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }));
    }
  }

  getPoolForUser(userId: string): Pool {
    const shardId = this.getShardId(userId);
    // Map to available pools (we don't create 1000 pools, just rotate)
    const poolId = shardId % this.pools.size;
    return this.pools.get(poolId)!;
  }

  private getShardId(userId: string): number {
    // Simple hash function for sharding
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % this.SHARD_COUNT;
  }
}

const db = new DatabasePool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Redis cluster for caching
const redis = new Redis.Cluster([
  { host: process.env.REDIS_HOST_1, port: 6379 },
  { host: process.env.REDIS_HOST_2, port: 6379 },
  { host: process.env.REDIS_HOST_3, port: 6379 },
], {
  enableOfflineQueue: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
});

// Kafka for event streaming
const kafka = new Kafka({
  clientId: 'viral-engine',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-512',
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
});

const producer: Producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  compression: 2, // snappy
});

// =====================================================
// COMMISSION CALCULATION ENGINE
// =====================================================

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  currency: string;
  metadata?: Record<string, any>;
}

interface Commission {
  transactionId: string;
  beneficiaryId: string;
  sourceUserId: string;
  level: number;
  amount: number;
  rate: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  conditions: Record<string, any>;
}

export class CommissionEngine {
  private readonly MAX_DEPTH = 7;
  private readonly CACHE_TTL = 3600; // 1 hour

  async calculateCommissions(transaction: Transaction): Promise<Commission[]> {
    const startTime = Date.now();
    const commissions: Commission[] = [];

    try {
      // Get user's referral chain from cache or database
      const referralChain = await this.getReferralChain(transaction.userId);
      
      // Get user's subscription tier
      const userTier = await this.getUserTier(transaction.userId);
      const commissionRates = COMMISSION_STRUCTURE[userTier] || COMMISSION_STRUCTURE.free;

      // Calculate commissions for each level
      for (let i = 0; i < referralChain.length && i < this.MAX_DEPTH; i++) {
        const referrer = referralChain[i];
        const level = i + 1;
        const rateConfig = commissionRates.find(r => r.level === level);

        if (!rateConfig) continue;

        // Check conditions
        if (!(await this.checkCommissionConditions(referrer.id, rateConfig.conditions))) {
          logger.info({ 
            referrerId: referrer.id, 
            level, 
            reason: 'conditions_not_met' 
          }, 'Skipping commission due to unmet conditions');
          continue;
        }

        // Calculate commission amount
        let commissionAmount = transaction.amount * rateConfig.rate;
        
        // Apply cap if exists
        if (rateConfig.cap && commissionAmount > rateConfig.cap) {
          commissionAmount = rateConfig.cap;
        }

        // Check for duplicate prevention
        const isDuplicate = await this.isDuplicateCommission(
          transaction.id, 
          referrer.id, 
          level
        );

        if (!isDuplicate) {
          commissions.push({
            transactionId: transaction.id,
            beneficiaryId: referrer.id,
            sourceUserId: transaction.userId,
            level,
            amount: commissionAmount,
            rate: rateConfig.rate,
            status: 'pending',
            conditions: rateConfig.conditions || {},
          });
        }
      }

      // Batch insert commissions
      if (commissions.length > 0) {
        await this.saveCommissions(commissions);
        
        // Emit events for real-time processing
        await this.emitCommissionEvents(commissions);
        
        // Update viral metrics
        await this.updateViralMetrics(transaction.userId, commissions);
      }

      // Track metrics
      metrics.histogram('commission.calculation.duration', Date.now() - startTime);
      metrics.increment('commission.calculation.count');
      metrics.gauge('commission.calculation.depth', commissions.length);

      return commissions;

    } catch (error) {
      logger.error({ error, transaction }, 'Failed to calculate commissions');
      metrics.increment('commission.calculation.error');
      throw error;
    }
  }

  private async getReferralChain(userId: string): Promise<Array<{id: string, tier: string}>> {
    const cacheKey = `referral_chain:${userId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      metrics.increment('cache.hit.referral_chain');
      return JSON.parse(cached);
    }

    metrics.increment('cache.miss.referral_chain');

    // Query database with recursive CTE
    const pool = db.getPoolForUser(userId);
    const query = `
      WITH RECURSIVE referral_chain AS (
        -- Base case: get immediate referrer
        SELECT 
          u.referred_by as user_id,
          u.subscription_tier,
          1 as level
        FROM users_data u
        WHERE u.id = $1 AND u.referred_by IS NOT NULL
        
        UNION ALL
        
        -- Recursive case: get referrer's referrer
        SELECT 
          u.referred_by,
          u.subscription_tier,
          rc.level + 1
        FROM referral_chain rc
        JOIN users_data u ON u.id = rc.user_id
        WHERE u.referred_by IS NOT NULL AND rc.level < $2
      )
      SELECT 
        user_id as id,
        subscription_tier as tier
      FROM referral_chain
      ORDER BY level ASC;
    `;

    const result = await pool.query(query, [userId, this.MAX_DEPTH]);
    const chain = result.rows;

    // Cache the result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(chain));

    return chain;
  }

  private async getUserTier(userId: string): Promise<string> {
    const cacheKey = `user_tier:${userId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const pool = db.getPoolForUser(userId);
    const result = await pool.query(
      'SELECT subscription_tier FROM users_data WHERE id = $1',
      [userId]
    );

    const tier = result.rows[0]?.subscription_tier || 'free';
    await redis.setex(cacheKey, this.CACHE_TTL, tier);

    return tier;
  }

  private async checkCommissionConditions(
    userId: string, 
    conditions?: Record<string, any>
  ): Promise<boolean> {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    const pool = db.getPoolForUser(userId);
    
    // Build dynamic query based on conditions
    const checks: string[] = [];
    const params: any[] = [userId];

    if (conditions.requiresKYC) {
      checks.push(`kyc_status = 'verified'`);
    }

    if (conditions.requiresActiveSubscription) {
      checks.push(`subscription_status = 'active'`);
    }

    if (conditions.minNetworkSize) {
      checks.push(`
        (SELECT total_descendants FROM viral_networks WHERE user_id = $1) >= $${params.length + 1}
      `);
      params.push(conditions.minNetworkSize);
    }

    if (conditions.minMonthlyRevenue) {
      checks.push(`monthly_revenue >= $${params.length + 1}`);
      params.push(conditions.minMonthlyRevenue);
    }

    if (checks.length === 0) return true;

    const query = `
      SELECT EXISTS (
        SELECT 1 FROM users_data u
        WHERE u.id = $1 AND ${checks.join(' AND ')}
      ) as meets_conditions
    `;

    const result = await pool.query(query, params);
    return result.rows[0]?.meets_conditions || false;
  }

  private async isDuplicateCommission(
    transactionId: string,
    beneficiaryId: string,
    level: number
  ): Promise<boolean> {
    const pool = db.getPoolForUser(beneficiaryId);
    
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM commission_ledger
        WHERE transaction_id = $1 
        AND beneficiary_id = $2 
        AND level = $3
      ) as exists
    `, [transactionId, beneficiaryId, level]);

    return result.rows[0]?.exists || false;
  }

  private async saveCommissions(commissions: Commission[]): Promise<void> {
    if (commissions.length === 0) return;

    // Group by beneficiary shard for efficient batch inserts
    const commissionsByPool = new Map<Pool, Commission[]>();
    
    for (const commission of commissions) {
      const pool = db.getPoolForUser(commission.beneficiaryId);
      if (!commissionsByPool.has(pool)) {
        commissionsByPool.set(pool, []);
      }
      commissionsByPool.get(pool)!.push(commission);
    }

    // Parallel batch inserts
    const insertPromises = Array.from(commissionsByPool.entries()).map(
      async ([pool, poolCommissions]) => {
        const values = poolCommissions.map((c, idx) => {
          const offset = idx * 9;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
        }).join(', ');

        const params = poolCommissions.flatMap(c => [
          c.transactionId,
          c.beneficiaryId,
          c.sourceUserId,
          c.level,
          c.amount,
          c.amount, // base_amount
          c.rate,
          c.amount, // commission_amount
          c.status
        ]);

        const query = `
          INSERT INTO commission_ledger (
            transaction_id, beneficiary_id, source_user_id, level,
            base_amount, commission_amount, commission_rate, commission_amount, status
          ) VALUES ${values}
          ON CONFLICT (transaction_id, beneficiary_id, level) DO NOTHING
        `;

        await pool.query(query, params);
      }
    );

    await Promise.all(insertPromises);
  }

  private async emitCommissionEvents(commissions: Commission[]): Promise<void> {
    const events = commissions.map(commission => ({
      key: commission.beneficiaryId,
      value: JSON.stringify({
        type: 'commission_earned',
        timestamp: new Date().toISOString(),
        data: commission,
      }),
      headers: {
        'event-type': 'commission',
        'source': 'viral-engine',
      },
    }));

    await producer.sendBatch({
      topic: 'commission-events',
      messages: events,
    });
  }

  private async updateViralMetrics(userId: string, commissions: Commission[]): Promise<void> {
    try {
      // Update source user's viral contribution
      const pool = db.getPoolForUser(userId);
      await pool.query(`
        UPDATE users_data 
        SET 
          network_value = network_value + $1,
          viral_score = LEAST(viral_score + ($1 * 0.001), 10)
        WHERE id = $2
      `, [
        commissions.reduce((sum, c) => sum + c.amount, 0),
        userId
      ]);

      // Update each beneficiary's metrics
      for (const commission of commissions) {
        const beneficiaryPool = db.getPoolForUser(commission.beneficiaryId);
        await beneficiaryPool.query(`
          UPDATE viral_networks
          SET 
            total_commissions_earned = total_commissions_earned + $1,
            monthly_commissions_earned = monthly_commissions_earned + $1,
            total_revenue_generated = total_revenue_generated + $2
          WHERE user_id = $3
        `, [commission.amount, commission.amount / commission.rate, commission.beneficiaryId]);
      }

      // Invalidate caches
      const cacheKeys = [
        `user_metrics:${userId}`,
        ...commissions.map(c => `user_metrics:${c.beneficiaryId}`)
      ];
      await redis.del(...cacheKeys);

    } catch (error) {
      logger.error({ error, userId }, 'Failed to update viral metrics');
      // Don't throw - metrics update is not critical
    }
  }
}

// =====================================================
// VIRAL OPTIMIZATION ENGINE
// =====================================================

interface ViralStrategy {
  userId: string;
  recommendations: {
    incentive: {
      type: string;
      value: number;
      duration?: number;
    };
    messaging: {
      channel: string;
      template: string;
      personalization: Record<string, any>;
    }[];
    timing: {
      optimal_send_time: Date;
      frequency: string;
    };
  };
  predictedOutcome: {
    viralCoefficient: number;
    expectedReferrals: number;
    confidenceInterval: [number, number];
  };
}

export class ViralOptimizationEngine {
  async optimizeUserStrategy(userId: string): Promise<ViralStrategy> {
    const metrics = await this.getUserViralMetrics(userId);
    const networkAnalysis = await this.analyzeNetwork(userId);
    const behaviorProfile = await this.getUserBehaviorProfile(userId);

    // ML model would go here - for now, rule-based optimization
    const strategy = this.calculateOptimalStrategy(metrics, networkAnalysis, behaviorProfile);

    // A/B test assignment
    await this.assignToViralTest(userId, strategy);

    return strategy;
  }

  private async getUserViralMetrics(userId: string): Promise<any> {
    const pool = db.getPoolForUser(userId);
    
    const query = `
      SELECT 
        u.viral_score,
        u.total_referrals,
        u.active_referrals,
        vn.viral_coefficient,
        vn.total_descendants,
        vn.network_depth,
        vn.total_revenue_generated,
        COUNT(DISTINCT cl.id) as commissions_earned,
        SUM(cl.commission_amount) as total_commission_value
      FROM users_data u
      LEFT JOIN viral_networks vn ON vn.user_id = u.id
      LEFT JOIN commission_ledger cl ON cl.beneficiary_id = u.id AND cl.status = 'paid'
      WHERE u.id = $1
      GROUP BY u.id, u.viral_score, u.total_referrals, u.active_referrals,
               vn.viral_coefficient, vn.total_descendants, vn.network_depth, 
               vn.total_revenue_generated
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  }

  private async analyzeNetwork(userId: string): Promise<any> {
    const pool = db.getPoolForUser(userId);
    
    // Get network growth over time
    const growthQuery = `
      WITH monthly_growth AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_referrals,
          SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative
        FROM referral_edges
        WHERE referrer_id = $1
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT 
        month,
        new_referrals,
        cumulative,
        CASE 
          WHEN LAG(new_referrals) OVER (ORDER BY month) > 0 
          THEN (new_referrals::float / LAG(new_referrals) OVER (ORDER BY month)) - 1
          ELSE 0
        END as growth_rate
      FROM monthly_growth
      ORDER BY month DESC
      LIMIT 12
    `;

    const growthResult = await pool.query(growthQuery, [userId]);

    // Get network quality metrics
    const qualityQuery = `
      SELECT 
        AVG(relationship_strength) as avg_strength,
        AVG(activity_correlation) as avg_correlation,
        SUM(revenue_contribution) as total_revenue,
        COUNT(CASE WHEN last_activity_at > NOW() - INTERVAL '30 days' THEN 1 END)::float / 
          NULLIF(COUNT(*), 0) as active_rate
      FROM referral_edges
      WHERE referrer_id = $1
    `;

    const qualityResult = await pool.query(qualityQuery, [userId]);

    return {
      growth: growthResult.rows,
      quality: qualityResult.rows[0],
    };
  }

  private async getUserBehaviorProfile(userId: string): Promise<any> {
    // This would integrate with analytics events
    // For now, return mock profile
    return {
      engagementLevel: 'high',
      preferredChannels: ['email', 'in-app'],
      bestEngagementTime: '18:00-20:00',
      contentPreferences: ['tutorials', 'case-studies'],
      socialPlatforms: ['twitter', 'linkedin'],
    };
  }

  private calculateOptimalStrategy(
    metrics: any,
    network: any,
    behavior: any
  ): ViralStrategy {
    // Determine incentive based on current performance
    let incentive;
    if (metrics.viral_coefficient < 0.5) {
      incentive = { type: 'bonus_commission', value: 5, duration: 30 };
    } else if (metrics.viral_coefficient < 1.0) {
      incentive = { type: 'tier_upgrade', value: 1, duration: 7 };
    } else {
      incentive = { type: 'exclusive_feature', value: 0 };
    }

    // Calculate predicted outcome
    const baseCoefficient = metrics.viral_coefficient || 0.1;
    const incentiveBoost = incentive.type === 'bonus_commission' ? 0.3 : 0.1;
    const predictedCoefficient = Math.min(baseCoefficient + incentiveBoost, 2.0);

    return {
      userId,
      recommendations: {
        incentive,
        messaging: [
          {
            channel: behavior.preferredChannels[0],
            template: 'referral_incentive_announcement',
            personalization: {
              name: metrics.name,
              current_earnings: metrics.total_commission_value,
              potential_earnings: metrics.total_commission_value * 1.5,
            },
          },
        ],
        timing: {
          optimal_send_time: new Date(), // Would calculate based on behavior
          frequency: 'weekly',
        },
      },
      predictedOutcome: {
        viralCoefficient: predictedCoefficient,
        expectedReferrals: Math.floor(predictedCoefficient * 10),
        confidenceInterval: [
          predictedCoefficient * 0.8,
          predictedCoefficient * 1.2,
        ],
      },
    };
  }

  private async assignToViralTest(userId: string, strategy: ViralStrategy): Promise<void> {
    // A/B test assignment logic
    const testName = 'viral_incentive_q4_2024';
    const variant = Math.random() < 0.5 ? 'control' : 'treatment';

    await redis.setex(
      `ab_test:${testName}:${userId}`,
      86400 * 30, // 30 days
      JSON.stringify({ variant, strategy })
    );
  }
}

// =====================================================
// GAMIFICATION ENGINE
// =====================================================

interface Achievement {
  id: string;
  userId: string;
  achievementCode: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rewards?: {
    type: string;
    value: any;
  }[];
}

export class GamificationEngine {
  private readonly ACHIEVEMENT_CHECKS = {
    first_referral: async (userId: string) => {
      const pool = db.getPoolForUser(userId);
      const result = await pool.query(
        'SELECT total_referrals FROM users_data WHERE id = $1',
        [userId]
      );
      return { progress: Math.min(result.rows[0]?.total_referrals || 0, 1) * 100 };
    },
    
    viral_spreader: async (userId: string) => {
      const pool = db.getPoolForUser(userId);
      const result = await pool.query(`
        SELECT COUNT(*) as recent_referrals
        FROM referral_edges
        WHERE referrer_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      `, [userId]);
      const count = result.rows[0]?.recent_referrals || 0;
      return { progress: Math.min(count / 50, 1) * 100 };
    },
    
    network_builder: async (userId: string) => {
      const pool = db.getPoolForUser(userId);
      const result = await pool.query(
        'SELECT total_descendants, network_depth FROM viral_networks WHERE user_id = $1',
        [userId]
      );
      const descendants = result.rows[0]?.total_descendants || 0;
      const depth = result.rows[0]?.network_depth || 0;
      return { 
        progress: Math.min(descendants / 1000, 1) * 50 + Math.min(depth / 5, 1) * 50 
      };
    },
  };

  async checkAchievements(userId: string, trigger: string): Promise<Achievement[]> {
    const updates: Achievement[] = [];

    try {
      // Get user's current achievements
      const pool = db.getPoolForUser(userId);
      const currentAchievements = await pool.query(`
        SELECT 
          ua.*,
          ad.code,
          ad.criteria,
          ad.reward_type,
          ad.reward_value
        FROM user_achievements ua
        JOIN achievement_definitions ad ON ad.id = ua.achievement_id
        WHERE ua.user_id = $1 AND ua.unlocked = false
      `, [userId]);

      // Check each achievement
      for (const achievement of currentAchievements.rows) {
        const checker = this.ACHIEVEMENT_CHECKS[achievement.code];
        if (!checker) continue;

        const { progress } = await checker(userId);
        
        if (progress > achievement.progress) {
          // Update progress
          await pool.query(`
            UPDATE user_achievements
            SET 
              progress = $1,
              unlocked = $2,
              unlocked_at = $3,
              updated_at = NOW()
            WHERE id = $4
          `, [
            progress,
            progress >= 100,
            progress >= 100 ? new Date() : null,
            achievement.id
          ]);

          updates.push({
            id: achievement.id,
            userId,
            achievementCode: achievement.code,
            progress,
            unlocked: progress >= 100,
            unlockedAt: progress >= 100 ? new Date() : undefined,
            rewards: progress >= 100 ? [{
              type: achievement.reward_type,
              value: achievement.reward_value,
            }] : undefined,
          });

          // Grant rewards if unlocked
          if (progress >= 100) {
            await this.grantRewards(userId, achievement);
            await this.createViralMoment(userId, achievement);
          }
        }
      }

      // Update user XP and level
      if (updates.some(u => u.unlocked)) {
        await this.updateUserLevel(userId);
      }

      return updates;

    } catch (error) {
      logger.error({ error, userId, trigger }, 'Failed to check achievements');
      throw error;
    }
  }

  private async grantRewards(userId: string, achievement: any): Promise<void> {
    const rewardHandlers = {
      credits: async (value: number) => {
        // Add credits to user account
        const pool = db.getPoolForUser(userId);
        await pool.query(
          'UPDATE users_data SET account_credits = account_credits + $1 WHERE id = $2',
          [value, userId]
        );
      },
      
      commission_boost: async (value: number) => {
        // Apply temporary commission boost
        await redis.setex(
          `commission_boost:${userId}`,
          86400 * 30, // 30 days
          value.toString()
        );
      },
      
      tier_upgrade: async (value: number) => {
        // Temporary tier upgrade
        const pool = db.getPoolForUser(userId);
        await pool.query(`
          INSERT INTO tier_upgrades (user_id, duration_days, expires_at)
          VALUES ($1, $2, NOW() + INTERVAL '1 day' * $2)
        `, [userId, value]);
      },
    };

    const handler = rewardHandlers[achievement.reward_type];
    if (handler) {
      await handler(achievement.reward_value);
    }
  }

  private async createViralMoment(userId: string, achievement: any): Promise<void> {
    // Create shareable content
    const shareableContent = {
      type: 'achievement_unlocked',
      userId,
      achievementCode: achievement.code,
      title: `I just unlocked "${achievement.name}" on DailyDoco Pro! 🎉`,
      description: achievement.description,
      shareUrl: `https://dailydoco.pro/achievements/${achievement.code}?ref=${userId}`,
      imageUrl: `https://dailydoco.pro/api/achievements/${achievement.code}/badge.png`,
    };

    // Emit event for social sharing
    await producer.send({
      topic: 'viral-moments',
      messages: [{
        key: userId,
        value: JSON.stringify(shareableContent),
      }],
    });

    // Track in analytics
    await this.trackAchievementShare(userId, achievement.code);
  }

  private async updateUserLevel(userId: string): Promise<void> {
    const pool = db.getPoolForUser(userId);
    
    // Calculate total XP from achievements
    const result = await pool.query(`
      SELECT 
        SUM(ad.points) as total_xp
      FROM user_achievements ua
      JOIN achievement_definitions ad ON ad.id = ua.achievement_id
      WHERE ua.user_id = $1 AND ua.unlocked = true
    `, [userId]);

    const totalXP = result.rows[0]?.total_xp || 0;
    
    // Calculate level (exponential curve)
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

    // Update user
    await pool.query(`
      UPDATE users_data
      SET 
        experience_points = $1,
        level = $2
      WHERE id = $3
    `, [totalXP, level, userId]);

    // Check for level-up rewards
    await this.checkLevelRewards(userId, level);
  }

  private async checkLevelRewards(userId: string, newLevel: number): Promise<void> {
    // Level milestone rewards
    const milestoneRewards = {
      5: { type: 'feature_unlock', value: 'advanced_analytics' },
      10: { type: 'commission_boost', value: 2 },
      25: { type: 'tier_upgrade', value: 30 },
      50: { type: 'exclusive_badge', value: 'gold_creator' },
      100: { type: 'lifetime_perks', value: 'vip_status' },
    };

    if (milestoneRewards[newLevel]) {
      // Grant milestone reward
      logger.info({ userId, level: newLevel }, 'User reached milestone level');
      // Implementation would follow similar pattern to achievement rewards
    }
  }

  private async trackAchievementShare(userId: string, achievementCode: string): Promise<void> {
    // Track sharing analytics
    await producer.send({
      topic: 'analytics-events',
      messages: [{
        key: userId,
        value: JSON.stringify({
          event_type: 'achievement_shared',
          user_id: userId,
          properties: {
            achievement_code: achievementCode,
            platform: 'internal',
          },
          timestamp: new Date().toISOString(),
        }),
      }],
    });
  }
}

// =====================================================
// API ENDPOINTS
// =====================================================

export async function routes(app: FastifyInstance, options: FastifyPluginOptions) {
  const commissionEngine = new CommissionEngine();
  const viralEngine = new ViralOptimizationEngine();
  const gamificationEngine = new GamificationEngine();

  // Health check
  app.get('/health', async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    return health;
  });

  // Calculate commissions for a transaction
  app.post<{
    Body: Transaction
  }>('/commissions/calculate', {
    schema: {
      body: {
        type: 'object',
        required: ['id', 'userId', 'amount', 'type', 'currency'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          amount: { type: 'number' },
          type: { type: 'string' },
          currency: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request, reply) => {
    const transaction = request.body;
    
    try {
      const commissions = await commissionEngine.calculateCommissions(transaction);
      
      // Check achievements triggered by this transaction
      await gamificationEngine.checkAchievements(transaction.userId, 'transaction');
      
      return {
        success: true,
        transaction_id: transaction.id,
        commissions_calculated: commissions.length,
        total_commission_amount: commissions.reduce((sum, c) => sum + c.amount, 0),
        commissions,
      };
    } catch (error) {
      logger.error({ error, transaction }, 'Failed to calculate commissions');
      reply.code(500);
      return { success: false, error: 'Failed to calculate commissions' };
    }
  });

  // Get viral optimization strategy for a user
  app.get<{
    Params: { userId: string }
  }>('/viral/optimize/:userId', async (request, reply) => {
    const { userId } = request.params;
    
    try {
      const strategy = await viralEngine.optimizeUserStrategy(userId);
      return { success: true, strategy };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to optimize viral strategy');
      reply.code(500);
      return { success: false, error: 'Failed to optimize strategy' };
    }
  });

  // Get user's viral network stats
  app.get<{
    Params: { userId: string }
  }>('/network/:userId', async (request, reply) => {
    const { userId } = request.params;
    
    try {
      const pool = db.getPoolForUser(userId);
      const stats = await pool.query(`
        SELECT 
          vn.*,
          u.viral_score,
          u.total_referrals,
          u.active_referrals,
          COUNT(DISTINCT cl.id) as total_commissions,
          SUM(cl.commission_amount) as total_earnings
        FROM viral_networks vn
        JOIN users_data u ON u.id = vn.user_id
        LEFT JOIN commission_ledger cl ON cl.beneficiary_id = vn.user_id
        WHERE vn.user_id = $1
        GROUP BY vn.id, vn.user_id, vn.network_depth, vn.total_descendants,
                 vn.active_descendants, vn.total_revenue_generated,
                 vn.total_commissions_earned, vn.viral_coefficient,
                 u.viral_score, u.total_referrals, u.active_referrals
      `, [userId]);

      return {
        success: true,
        network: stats.rows[0] || {
          user_id: userId,
          network_depth: 0,
          total_descendants: 0,
          viral_coefficient: 0,
        },
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get network stats');
      reply.code(500);
      return { success: false, error: 'Failed to get network stats' };
    }
  });

  // Get user's achievements
  app.get<{
    Params: { userId: string }
  }>('/achievements/:userId', async (request, reply) => {
    const { userId } = request.params;
    
    try {
      const pool = db.getPoolForUser(userId);
      const achievements = await pool.query(`
        SELECT 
          ua.*,
          ad.code,
          ad.name,
          ad.description,
          ad.category,
          ad.points,
          ad.rarity,
          ad.icon_url
        FROM user_achievements ua
        JOIN achievement_definitions ad ON ad.id = ua.achievement_id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked DESC, ua.progress DESC
      `, [userId]);

      return {
        success: true,
        achievements: achievements.rows,
        summary: {
          total: achievements.rows.length,
          unlocked: achievements.rows.filter(a => a.unlocked).length,
          points: achievements.rows
            .filter(a => a.unlocked)
            .reduce((sum, a) => sum + a.points, 0),
        },
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get achievements');
      reply.code(500);
      return { success: false, error: 'Failed to get achievements' };
    }
  });

  // Leaderboard endpoint
  app.get<{
    Querystring: {
      type: string;
      period: string;
      limit?: number;
    }
  }>('/leaderboard', {
    schema: {
      querystring: {
        type: 'object',
        required: ['type', 'period'],
        properties: {
          type: { enum: ['referrals', 'revenue', 'commissions', 'viral_score'] },
          period: { enum: ['daily', 'weekly', 'monthly', 'all-time'] },
          limit: { type: 'number', default: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const { type, period, limit = 100 } = request.query;
    
    try {
      // Get leaderboard from cache first
      const cacheKey = `leaderboard:${type}:${period}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return { success: true, leaderboard: JSON.parse(cached) };
      }

      // Query based on type
      let query: string;
      switch (type) {
        case 'referrals':
          query = `
            SELECT 
              u.id,
              u.username,
              u.avatar_url,
              COUNT(DISTINCT re.referred_id) as score
            FROM users_data u
            LEFT JOIN referral_edges re ON re.referrer_id = u.id
            ${period !== 'all-time' ? `AND re.created_at > NOW() - INTERVAL '1 ${period}'` : ''}
            GROUP BY u.id, u.username, u.avatar_url
            ORDER BY score DESC
            LIMIT $1
          `;
          break;
          
        case 'revenue':
          query = `
            SELECT 
              u.id,
              u.username,
              u.avatar_url,
              COALESCE(vn.total_revenue_generated, 0) as score
            FROM users_data u
            LEFT JOIN viral_networks vn ON vn.user_id = u.id
            ORDER BY score DESC
            LIMIT $1
          `;
          break;
          
        case 'commissions':
          query = `
            SELECT 
              u.id,
              u.username,
              u.avatar_url,
              COALESCE(SUM(cl.commission_amount), 0) as score
            FROM users_data u
            LEFT JOIN commission_ledger cl ON cl.beneficiary_id = u.id
            ${period !== 'all-time' ? `AND cl.created_at > NOW() - INTERVAL '1 ${period}'` : ''}
            WHERE cl.status = 'paid'
            GROUP BY u.id, u.username, u.avatar_url
            ORDER BY score DESC
            LIMIT $1
          `;
          break;
          
        case 'viral_score':
          query = `
            SELECT 
              id,
              username,
              avatar_url,
              viral_score as score
            FROM users_data
            WHERE viral_score > 0
            ORDER BY viral_score DESC
            LIMIT $1
          `;
          break;
          
        default:
          throw new Error('Invalid leaderboard type');
      }

      // Execute query across all shards and merge results
      // For simplicity, using a single pool here - in production, 
      // this would query all shards and merge
      const result = await db.getPoolForUser('00000000-0000-0000-0000-000000000000')
        .query(query, [limit]);

      const leaderboard = result.rows.map((row, index) => ({
        rank: index + 1,
        ...row,
        score: parseFloat(row.score),
      }));

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(leaderboard));

      return { success: true, leaderboard };
      
    } catch (error) {
      logger.error({ error, type, period }, 'Failed to get leaderboard');
      reply.code(500);
      return { success: false, error: 'Failed to get leaderboard' };
    }
  });
}

// =====================================================
// SERVER INITIALIZATION
// =====================================================

async function start() {
  try {
    // Connect to Kafka
    await producer.connect();
    logger.info('Connected to Kafka');

    // Initialize Fastify
    const app = require('fastify')({
      logger,
      trustProxy: true,
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'request_id',
    });

    // Register plugins
    await app.register(require('@fastify/helmet'));
    await app.register(require('@fastify/cors'), {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });
    await app.register(require('@fastify/rate-limit'), {
      max: 1000,
      timeWindow: '1 minute',
    });

    // Register routes
    await app.register(routes, { prefix: '/api/v1' });

    // Start server
    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });

    logger.info(`Viral Engine Service running on port ${port}`);

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      await app.close();
      await producer.disconnect();
      await redis.quit();
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error({ error }, 'Failed to start service');
    process.exit(1);
  }
}

// Start the service
start();