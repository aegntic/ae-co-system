/**
 * Database schema definitions for deployment service
 * Using Drizzle ORM with PostgreSQL
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  jsonb, 
  boolean,
  integer 
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  githubId: varchar('github_id', { length: 100 }).unique(),
  githubUsername: varchar('github_username', { length: 100 }),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Repositories table
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  githubId: varchar('github_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  description: text('description'),
  url: text('url').notNull(),
  defaultBranch: varchar('default_branch', { length: 100 }).default('main'),
  isPrivate: boolean('is_private').default(false),
  language: varchar('language', { length: 100 }),
  topics: jsonb('topics').default([]),
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Generated sites table
export const generatedSites = pgTable('generated_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  
  // Site configuration
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  template: varchar('template', { length: 100 }).notNull(),
  themeConfig: jsonb('theme_config').default({}),
  
  // Content and analysis
  contentAnalysis: jsonb('content_analysis').default({}),
  partnersRecommended: jsonb('partners_recommended').default([]),
  
  // Deployment info
  status: varchar('status', { length: 50 }).default('pending'), // pending, analyzing, generating, building, live, failed
  deployedUrl: text('deployed_url'),
  deploymentId: varchar('deployment_id', { length: 255 }),
  deploymentProvider: varchar('deployment_provider', { length: 50 }),
  customDomain: varchar('custom_domain', { length: 255 }),
  
  // Timestamps
  lastDeployedAt: timestamp('last_deployed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Content versions table for tracking changes
export const contentVersions = pgTable('content_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').references(() => generatedSites.id).notNull(),
  
  // Content data
  readmeContent: text('readme_content'),
  additionalFiles: jsonb('additional_files').default({}),
  analysisResults: jsonb('analysis_results').default({}),
  
  // Version tracking
  version: integer('version').notNull().default(1),
  commitSha: varchar('commit_sha', { length: 40 }),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Partners table
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  
  // Commission settings
  commissionRate: integer('commission_rate').default(10), // Percentage
  trackingCode: varchar('tracking_code', { length: 255 }),
  
  // Partner configuration
  ctaText: varchar('cta_text', { length: 255 }),
  categories: jsonb('categories').default([]),
  targetAudience: jsonb('target_audience').default([]),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Partner clicks and conversions tracking
export const partnerEvents = pgTable('partner_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').references(() => generatedSites.id).notNull(),
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  
  eventType: varchar('event_type', { length: 50 }).notNull(), // click, conversion, signup
  eventData: jsonb('event_data').default({}),
  
  // User tracking (anonymous)
  sessionId: varchar('session_id', { length: 255 }),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  referrer: text('referrer'),
  
  // Commission tracking
  commissionAmount: integer('commission_amount'), // In cents
  conversionValue: integer('conversion_value'), // In cents
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deployment logs for debugging
export const deploymentLogs = pgTable('deployment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').references(() => generatedSites.id).notNull(),
  
  deploymentId: varchar('deployment_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  
  logs: text('logs'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default({}),
  
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;

export type GeneratedSite = typeof generatedSites.$inferSelect;
export type NewGeneratedSite = typeof generatedSites.$inferInsert;

export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

export type PartnerEvent = typeof partnerEvents.$inferSelect;
export type NewPartnerEvent = typeof partnerEvents.$inferInsert;

export type DeploymentLog = typeof deploymentLogs.$inferSelect;
export type NewDeploymentLog = typeof deploymentLogs.$inferInsert;