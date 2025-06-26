
import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Adjust path if .env is elsewhere relative to root for all services

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle_migrations', // Output directory for migrations
  dialect: 'postgresql', // Specify the dialect
  dbCredentials: {
    url: databaseUrl,
  },
  // Optionally, specify a table prefix if you use one
  // tablesFilter: ["project4site_*"], 
  verbose: true,
  strict: true,
} satisfies Config;
    