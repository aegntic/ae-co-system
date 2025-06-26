import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Configure connection for production and development
const connectionConfig = {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Disable prepared statements for better compatibility
};

const queryClient = postgres(DATABASE_URL, connectionConfig);
export const db = drizzle(queryClient, { schema });

// Export schema for use in other files
export * from './schema';

// Type exports
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Repository = typeof schema.repositories.$inferSelect;
export type NewRepository = typeof schema.repositories.$inferInsert;
export type RepositoryFile = typeof schema.repositoryFiles.$inferSelect;
export type NewRepositoryFile = typeof schema.repositoryFiles.$inferInsert;
export type GeneratedSite = typeof schema.generatedSites.$inferSelect;
export type NewGeneratedSite = typeof schema.generatedSites.$inferInsert;
export type Partner = typeof schema.partners.$inferSelect;
export type NewPartner = typeof schema.partners.$inferInsert;
export type PartnerReferral = typeof schema.partnerReferrals.$inferSelect;
export type NewPartnerReferral = typeof schema.partnerReferrals.$inferInsert;
export type JobQueue = typeof schema.jobQueue.$inferSelect;
export type NewJobQueue = typeof schema.jobQueue.$inferInsert;