import { config } from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import {
  productionOrders,
  productionStateEnum,
  millLineEnum,
} from './schema/index';
import type { MillLine, ProductionState } from './schema/orders';
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

/**
 * Production guard (WR-01 / partial CR-02).
 *
 * The TRUNCATE + INSERT pair below is NOT transactional over Neon's HTTP
 * driver — each call is an independent HTTP POST that auto-commits. If
 * INSERT fails after TRUNCATE has succeeded, the database is left empty
 * with no rollback path. This guard prevents the script from running
 * against any host whose URL contains `prod` (case-insensitive) or when
 * `NODE_ENV === 'production'`, both of which would risk wiping production
 * data.
 *
 * Full transactional fix (switching to `@neondatabase/serverless` Pool +
 * `db.transaction(...)`) is deferred to a follow-up phase because it
 * changes the runtime driver choice for the seed script.
 */
function assertSafeToSeed(rawUrl: string): void {
  let host: string;
  try {
    host = new URL(rawUrl).hostname;
  } catch (err) {
    throw new Error(
      `Could not parse DATABASE_URL_UNPOOLED as a URL: ${(err as Error).message}`
    );
  }

  const FORBIDDEN_HOST_PATTERNS = [/prod/i, /production/i];
  if (FORBIDDEN_HOST_PATTERNS.some((rx) => rx.test(host))) {
    throw new Error(
      `Refusing to seed against host "${host}" — hostname matches a production-like pattern. ` +
        'Point DATABASE_URL_UNPOOLED at a development or staging Neon endpoint.'
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SEED_IN_PRODUCTION !== '1'
  ) {
    throw new Error(
      'Refusing to seed when NODE_ENV=production. ' +
        'Set ALLOW_SEED_IN_PRODUCTION=1 to override (you almost certainly should not).'
    );
  }
}

async function seed() {
  assertSafeToSeed(process.env.DATABASE_URL_UNPOOLED!);

  // D-17: TRUNCATE the three transactional tables with CASCADE for idempotency.
  // NEVER include the `users` table — it would orphan real Clerk-mapped rows
  // once Phase 33 lazy-sync ships (D-17 / threat T-32-05).
  console.log('Truncating production_orders, order_events, import_batches...');
  await db.execute(
    sql`TRUNCATE production_orders, order_events, import_batches RESTART IDENTITY CASCADE`
  );

  // Bulk-insert all 33 seed rows from the static JSON snapshot (D-15).
  // The JSON uses snake_case DB column names (Plan 05 transform contract); Drizzle's
  // .values() takes the schema's camelCase TS property names. Map per row at insert time.
  //
  // WR-03 fix: state and mill_line draw from schema-derived union types so a new
  // enum value added to schema/orders.ts is automatically picked up here.
  type SnakeRow = {
    order_number: string;
    customer: string;
    product: string;
    weight_lbs: string;
    delivery_time: string;
    state: ProductionState;
    mill_line: MillLine;
    texture_type: string | null;
    line_code: string | null;
    created_by: string;
    version: number;
  };

  // WR-04 fix: runtime shape validation. The `as SnakeRow[]` cast is a
  // TypeScript-only assertion; hand-edited seed JSON could still slip past
  // typing and produce confusing "invalid input value for enum ..." errors
  // from Postgres deep inside the bulk INSERT. Validate up front instead.
  const validStates = new Set<string>(productionStateEnum.enumValues);
  const validMillLines = new Set<string>(millLineEnum.enumValues);
  for (const [i, r] of (seedData as SnakeRow[]).entries()) {
    if (!validStates.has(r.state)) {
      throw new Error(
        `Seed row ${i} (order_number=${r.order_number}): invalid state "${r.state}". ` +
          `Valid values: ${[...validStates].join(', ')}.`
      );
    }
    if (!validMillLines.has(r.mill_line)) {
      throw new Error(
        `Seed row ${i} (order_number=${r.order_number}): invalid mill_line "${r.mill_line}". ` +
          `Valid values: ${[...validMillLines].join(', ')}.`
      );
    }
  }

  // D-06: Deterministic earlyDeliveryDate spread across today ±5 days.
  // Formula: offset = (i % 11) - 5, yielding offsets -5..+5 across 33 rows.
  // Using setUTCDate to avoid local-timezone off-by-one drift (Pitfall 5).
  // seed-data.json is NOT modified (Option B: runtime computation).
  const today = new Date();
  function earlyDeliveryDateFor(i: number): string {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + (i % 11) - 5);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const rows = (seedData as SnakeRow[]).map((r, i) => ({
    orderNumber: r.order_number,
    customer: r.customer,
    product: r.product,
    weightLbs: r.weight_lbs,
    deliveryTime: r.delivery_time,
    state: r.state,
    millLine: r.mill_line,
    textureType: r.texture_type,
    lineCode: r.line_code,
    createdBy: r.created_by,
    version: r.version,
    earlyDeliveryDate: earlyDeliveryDateFor(i),
  }));
  console.log(`Inserting ${rows.length} seed rows...`);
  await db.insert(productionOrders).values(rows);

  console.log('Seed complete.');
}

// WR-02 fix: move process.exit() out of seed() so any future awaited
// cleanup (e.g. closing a Pool added by the CR-02 transactional fix) can
// run on both the success and failure paths.
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
