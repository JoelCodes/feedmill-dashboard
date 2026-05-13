import { config } from 'dotenv';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit is a separate Node process — must explicitly load .env.local
// (Next.js auto-loading does NOT apply here). Mirrors playwright.config.ts:5-6.
config({ path: path.resolve(__dirname, '.env.local') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands. ' +
    'See docs/clerk-setup.md or .env.example for the expected shape.'
  );
}

export default defineConfig({
  schema: './src/db/schema/index.ts',  // D-02: barrel path for Phase 32 split
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,  // D-08: direct, NOT pooled
  },
});
