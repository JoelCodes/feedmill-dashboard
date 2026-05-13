import { config } from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { productionOrders } from './schema/index';
import seedData from './seed-data.json';

// seed.ts is at src/db/ — two directories deep from repo root.
// Must load .env.local before constructing the Neon client below.
// Mirrors drizzle.config.ts lines 1-7 (Node CLI discipline — Next.js auto-loading absent here).
config({ path: path.resolve(__dirname, '../../.env.local') });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error(
    'DATABASE_URL_UNPOOLED is not set. Use the Neon DIRECT (non-pooler) URL — ' +
    'PgBouncer transaction mode is incompatible with migration SET commands. ' +
    'See docs/clerk-setup.md or .env.example for the expected shape.'
  );
}

// Uses DATABASE_URL_UNPOOLED (direct connection) — same as drizzle.config.ts.
// NOT DATABASE_URL (pooled) — bulk inserts benefit from direct routing.
const client = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle({ client });

async function seed() {
  // D-17: TRUNCATE the three transactional tables with CASCADE for idempotency.
  // NEVER include the `users` table — it would orphan real Clerk-mapped rows
  // once Phase 33 lazy-sync ships (D-17 / threat T-32-05).
  console.log('Truncating production_orders, order_events, import_batches...');
  await db.execute(
    sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
  );

  // Bulk-insert all 33 seed rows from the static JSON snapshot (D-15).
  // The `as any` cast is acceptable: seed-data.json shape was validated in Plan 05.
  console.log(`Inserting ${(seedData as unknown[]).length} seed rows...`);
  await db.insert(productionOrders).values(seedData as any);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
