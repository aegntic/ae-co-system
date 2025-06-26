
import { pgTable, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';
import { type Section, type PartnerToolRecommendation } from '@/types'; // Assuming types are in @/types

export const generatedSites = pgTable('generated_sites', {
  id: text('id').primaryKey(), // Corresponds to projectId
  repoUrl: text('repo_url').notNull(),
  title: text('title'),
  templateId: text('template_id'), // e.g., 'TechProjectTemplate'
  
  sections: jsonb('sections').$type<Section[]>(), // Store Section[]
  partnerToolRecommendations: jsonb('partner_tool_recommendations').$type<PartnerToolRecommendation[] | null>(),
  rawMarkdown: text('raw_markdown'),
  
  status: text('status').notNull().default('PENDING_ANALYSIS'),
  errorMessage: text('error_message'),
  
  deployedUrl: text('deployed_url'),
  lastDeployedAt: timestamp('last_deployed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// You might define other tables here if the API route needs to interact with them
// e.g., users, partners, etc. following the main schema.sql.
// For now, only generated_sites is directly needed by the site-data API route.

export type GeneratedSite = typeof generatedSites.$inferSelect;
export type NewGeneratedSite = typeof generatedSites.$inferInsert;
    