import 'server-only';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

/**
 * Drizzle/Neon HTTP client singleton for the CGM Dashboard.
 *
 * SERVER-ONLY: `import 'server-only';` is placed at line 1 (D-10) so any
 * transitive import from a client component or Edge-runtime bundle fails
 * at build time with a clear Next.js diagnostic. The directive is a
 * runtime-enforced version of the JSDoc disclaimer used in
 * `src/lib/auth.ts`.
 *
 * Reads `DATABASE_URL` (POOLED endpoint — `-pooler.neon.tech`).
 * drizzle.config.ts at the repo root reads `DATABASE_URL_UNPOOLED` (the
 * DIRECT endpoint) for migrations — PgBouncer transaction mode breaks
 * migration SET commands, so the two URLs must never be swapped.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Use the Neon POOLED endpoint (-pooler.neon.tech) ' +
    'for application queries. drizzle.config.ts uses DATABASE_URL_UNPOOLED for migrations.'
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
