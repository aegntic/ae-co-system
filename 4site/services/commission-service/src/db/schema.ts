/**
 * Database schema for commission service
 * Comprehensive partner tracking and commission calculation
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  jsonb, 
  boolean,
  integer,
  decimal,
  pgEnum
} from 'drizzle-orm/pg-core';

// Enums
export const eventTypeEnum = pgEnum('event_type', [
  'click',
  'signup', 
  'purchase',
  'subscription',
  'trial_start',
  'trial_conversion',
  'renewal'
]);

export const commissionStatusEnum = pgEnum('commission_status', [
  'pending',
  'confirmed',
  'paid',
  'disputed',
  'cancelled'
]);

// Users table (reference)
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

// Generated sites table (reference)
export const generatedSites = pgTable('generated_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  deployedUrl: text('deployed_url'),
  themeConfig: jsonb('theme_config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Partners table
export const partners = pgTable('partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url').notNull(),
  
  // Referral configuration
  referralBaseUrl: text('referral_base_url').notNull(),
  referralParameter: varchar('referral_parameter', { length: 100 }).notNull(),
  referralCode: varchar('referral_code', { length: 100 }).notNull(),
  
  // Commission settings
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('10.00'),
  commissionType: varchar('commission_type', { length: 50 }).default('percentage'), // percentage, fixed
  fixedCommissionAmount: integer('fixed_commission_amount'), // in cents
  
  // Attribution settings
  attributionWindow: integer('attribution_window').default(30), // days
  cookieLifetime: integer('cookie_lifetime').default(30), // days
  
  // Webhook configuration
  webhookUrl: text('webhook_url'),
  webhookSecret: varchar('webhook_secret', { length: 255 }),
  webhookEvents: jsonb('webhook_events').default([]),
  
  // Partner configuration
  ctaText: varchar('cta_text', { length: 255 }).default('Get Started'),
  categories: jsonb('categories').default([]),
  targetAudience: jsonb('target_audience').default([]),
  
  // Status and metadata
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Attribution tracking - clicks and visits
export const attributions = pgTable('attributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Reference data
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  siteId: uuid('site_id').references(() => generatedSites.id),
  
  // Attribution data
  clickId: varchar('click_id', { length: 255 }).unique(),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Tracking information
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  landingPage: text('landing_page'),
  
  // Attribution window
  attributionStartsAt: timestamp('attribution_starts_at').defaultNow().notNull(),
  attributionExpiresAt: timestamp('attribution_expires_at').notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  utmParams: jsonb('utm_params').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Partner events - conversions, signups, purchases
export const partnerEvents = pgTable('partner_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Reference data
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  attributionId: uuid('attribution_id').references(() => attributions.id),
  userId: uuid('user_id').references(() => users.id),
  siteId: uuid('site_id').references(() => generatedSites.id),
  
  // Event information
  eventType: eventTypeEnum('event_type').notNull(),
  eventData: jsonb('event_data').default({}),
  
  // External reference
  externalId: varchar('external_id', { length: 255 }), // Partner's internal ID
  externalUserId: varchar('external_user_id', { length: 255 }),
  
  // Financial data
  amount: integer('amount'), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Commission calculation
  commissionAmount: integer('commission_amount'), // in cents
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  commissionStatus: commissionStatusEnum('commission_status').default('pending'),
  
  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationData: jsonb('verification_data').default({}),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Commission payouts
export const commissionPayouts = pgTable('commission_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Partner reference
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  
  // Payout period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Payout details
  totalEvents: integer('total_events').notNull(),
  totalAmount: integer('total_amount').notNull(), // in cents
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Status
  status: varchar('status', { length: 50 }).default('pending'),
  paidAt: timestamp('paid_at'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  
  // Event references
  eventIds: jsonb('event_ids').default([]),
  
  // Metadata
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook logs for debugging
export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  
  // Request data
  method: varchar('method', { length: 10 }).notNull(),
  url: text('url').notNull(),
  headers: jsonb('headers').default({}),
  payload: jsonb('payload').default({}),
  
  // Response data
  statusCode: integer('status_code'),
  responseBody: jsonb('response_body').default({}),
  
  // Processing
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Analytics aggregations for performance
export const analyticsDaily = pgTable('analytics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  partnerId: uuid('partner_id').references(() => partners.id).notNull(),
  date: timestamp('date').notNull(),
  
  // Metrics
  clicks: integer('clicks').default(0),
  signups: integer('signups').default(0),
  purchases: integer('purchases').default(0),
  revenue: integer('revenue').default(0), // in cents
  commissions: integer('commissions').default(0), // in cents
  
  // Rates
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 4 }).default('0.0000'),
  avgOrderValue: integer('avg_order_value').default(0), // in cents
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GeneratedSite = typeof generatedSites.$inferSelect;
export type NewGeneratedSite = typeof generatedSites.$inferInsert;

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

export type Attribution = typeof attributions.$inferSelect;
export type NewAttribution = typeof attributions.$inferInsert;

export type PartnerEvent = typeof partnerEvents.$inferSelect;
export type NewPartnerEvent = typeof partnerEvents.$inferInsert;

export type CommissionPayout = typeof commissionPayouts.$inferSelect;
export type NewCommissionPayout = typeof commissionPayouts.$inferInsert;

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;

export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDaily = typeof analyticsDaily.$inferInsert;