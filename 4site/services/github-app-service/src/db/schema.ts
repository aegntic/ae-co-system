import { pgTable, uuid, varchar, text, integer, timestamp, boolean, jsonb, decimal, date, inet, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'enterprise']);
export const siteStatusEnum = pgEnum('site_status', ['generating', 'completed', 'failed', 'deployed']);
export const partnerStatusEnum = pgEnum('partner_status', ['active', 'inactive', 'suspended']);
export const successTypeEnum = pgEnum('success_type', ['signup', 'purchase', 'referral', 'milestone']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubUsername: varchar('github_username', { length: 255 }).notNull().unique(),
  githubId: integer('github_id').notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  githubAccessToken: text('github_access_token'),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  privacyPolicyAcceptedAt: timestamp('privacy_policy_accepted_at'),
});

// Repositories table
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  githubRepoUrl: varchar('github_repo_url', { length: 500 }).notNull(),
  githubRepoId: integer('github_repo_id'),
  repositoryName: varchar('repository_name', { length: 255 }).notNull(),
  repositoryDescription: text('repository_description'),
  branchName: varchar('branch_name', { length: 100 }).default('main'),
  isPrivate: boolean('is_private').default(false),
  repositoryTopics: text('repository_topics').array().default(sql`ARRAY[]::text[]`),
  primaryLanguage: varchar('primary_language', { length: 50 }),
  languages: jsonb('languages').default({}),
  
  // Analysis metadata
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  analysisVersion: varchar('analysis_version', { length: 20 }),
  analysisScore: decimal('analysis_score', { precision: 3, scale: 2 }),
  analysisData: jsonb('analysis_data').default({}),
  
  // Repository statistics
  starsCount: integer('stars_count').default(0),
  forksCount: integer('forks_count').default(0),
  watchersCount: integer('watchers_count').default(0),
  sizeKb: integer('size_kb').default(0),
  
  // Automation settings
  autoSyncEnabled: boolean('auto_sync_enabled').default(true),
  webhookEnabled: boolean('webhook_enabled').default(false),
  lastSyncAt: timestamp('last_sync_at'),
  syncErrorCount: integer('sync_error_count').default(0),
  lastSyncError: text('last_sync_error'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Repository files table
export const repositoryFiles = pgTable('repository_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 50 }), // 'readme', 'planning', 'tasks', 'config', 'other'
  contentHash: varchar('content_hash', { length: 64 }), // SHA-256 hash
  content: text('content'),
  contentSize: integer('content_size'),
  lastModifiedAt: timestamp('last_modified_at'),
  analyzedAt: timestamp('analyzed_at'),
  analysisData: jsonb('analysis_data').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Generated sites table
export const generatedSites = pgTable('generated_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Site configuration
  siteName: varchar('site_name', { length: 255 }).notNull(),
  siteDescription: text('site_description'),
  siteUrl: varchar('site_url', { length: 500 }).unique(),
  customDomain: varchar('custom_domain', { length: 255 }),
  templateUsed: varchar('template_used', { length: 100 }).notNull(),
  templateVersion: varchar('template_version', { length: 20 }),
  themeConfig: jsonb('theme_config').default({}),
  
  // Generation metadata
  generationStartedAt: timestamp('generation_started_at').defaultNow(),
  generationCompletedAt: timestamp('generation_completed_at'),
  generationTimeMs: integer('generation_time_ms'),
  generationVersion: varchar('generation_version', { length: 20 }),
  aiModelsUsed: text('ai_models_used').array().default(sql`ARRAY[]::text[]`),
  
  // Performance metrics
  performanceScore: decimal('performance_score', { precision: 3, scale: 2 }),
  lighthouseScores: jsonb('lighthouse_scores').default({}),
  bundleSizeKb: integer('bundle_size_kb'),
  loadTimeMs: integer('load_time_ms'),
  
  // Features & content
  featuresEnabled: text('features_enabled').array().default(sql`ARRAY[]::text[]`),
  viralCtaEnabled: boolean('viral_cta_enabled').default(true),
  seoOptimized: boolean('seo_optimized').default(true),
  mobileOptimized: boolean('mobile_optimized').default(true),
  
  // Status & deployment
  status: siteStatusEnum('status').default('generating'),
  deploymentUrl: text('deployment_url'),
  deploymentStatus: varchar('deployment_status', { length: 50 }),
  deploymentLogs: text('deployment_logs'),
  lastDeployedAt: timestamp('last_deployed_at'),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  conversionCount: integer('conversion_count').default(0),
  shareCount: integer('share_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Partners table
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: varchar('website_url', { length: 500 }),
  
  // API integration
  apiEndpoint: varchar('api_endpoint', { length: 500 }),
  apiVersion: varchar('api_version', { length: 20 }),
  authMethod: varchar('auth_method', { length: 50 }), // 'oauth2', 'api_key', 'bearer_token'
  
  // Commission structure
  commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }).notNull().default('0.1000'), // 10% default
  successBonusRate: decimal('success_bonus_rate', { precision: 5, scale: 4 }).default('0.0500'), // 5% success bonus
  minimumPayout: decimal('minimum_payout', { precision: 10, scale: 2 }).default('10.00'),
  payoutFrequency: varchar('payout_frequency', { length: 20 }).default('monthly'), // 'weekly', 'monthly', 'quarterly'
  
  // Integration configuration
  integrationMethods: jsonb('integration_methods').default(sql`'[]'`),
  supportedFeatures: text('supported_features').array().default(sql`ARRAY[]::text[]`),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  
  // Status & metrics
  status: partnerStatusEnum('status').default('active'),
  totalReferrals: integer('total_referrals').default(0),
  totalConversions: integer('total_conversions').default(0),
  totalCommissionPaid: decimal('total_commission_paid', { precision: 12, scale: 2 }).default('0.00'),
  averageConversionRate: decimal('average_conversion_rate', { precision: 5, scale: 4 }).default('0.0000'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Partner referrals table
export const partnerReferrals = pgTable('partner_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  partnerId: uuid('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
  siteId: uuid('site_id').notNull().references(() => generatedSites.id, { onDelete: 'cascade' }),
  
  // Referral tracking
  referralCode: varchar('referral_code', { length: 50 }).notNull().unique(),
  clickId: varchar('click_id', { length: 100 }),
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  utmContent: varchar('utm_content', { length: 100 }),
  
  // User journey
  clickedAt: timestamp('clicked_at').defaultNow(),
  convertedAt: timestamp('converted_at'),
  conversionType: varchar('conversion_type', { length: 100 }),
  conversionValue: decimal('conversion_value', { precision: 10, scale: 2 }),
  
  // Commission calculation
  baseCommission: decimal('base_commission', { precision: 10, scale: 2 }),
  successMultiplier: decimal('success_multiplier', { precision: 3, scale: 2 }).default('1.0'),
  finalCommission: decimal('final_commission', { precision: 10, scale: 2 }),
  commissionStatus: varchar('commission_status', { length: 20 }).default('pending'), // 'pending', 'approved', 'paid', 'disputed'
  commissionPaidAt: timestamp('commission_paid_at'),
  
  // Metadata
  sourceUrl: text('source_url'),
  referrerUrl: text('referrer_url'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Job queue table
export const jobQueue = pgTable('job_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  jobData: jsonb('job_data').notNull().default({}),
  priority: integer('priority').default(0), // Higher number = higher priority
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'processing', 'completed', 'failed', 'retry'
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  
  // Timing
  scheduledAt: timestamp('scheduled_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  processingTimeMs: integer('processing_time_ms'),
  
  // Error handling
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  
  // Worker identification
  workerId: varchar('worker_id', { length: 100 }),
  workerHost: varchar('worker_host', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});