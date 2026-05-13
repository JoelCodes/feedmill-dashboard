/**
 * Wave-0 structural contract test for the drizzle-kit generated migration SQL.
 *
 * Purpose: Catches missing-migration regressions. In replay scenarios (fresh
 * checkout without running `drizzle-kit generate`), the test fails RED — a
 * deliberate signal that the developer must run `npm run db:generate` first.
 *
 * After `drizzle-kit generate` is run (Task 2), all 15 assertions below pass
 * GREEN, confirming the generated SQL matches the schema files exactly.
 *
 * References:
 *   - 32-PLAN.md Task 1 <behavior> assertions 1-15
 *   - 32-RESEARCH.md §3 "Expected SQL structure" (lines 152-163)
 *   - 32-RESEARCH.md §6 SC#1/SC#2/SC#3 (lines 596-665)
 *   - 32-CONTEXT.md D-23 (no pgcrypto), D-24 (0000_ filename scheme)
 */
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

describe('drizzle migration file contract', () => {
  const drizzleDir = path.resolve(__dirname, '../../../drizzle');

  let sqlContent: string;

  beforeAll(() => {
    // Attempt to read the directory and locate the 0000_ file.
    // If the directory does not exist, subsequent tests will fail with a clear
    // message (ENOENT) pointing the developer to run `npm run db:generate`.
    const files = readdirSync(drizzleDir);
    const sqlFile = files.find((f) => f.startsWith('0000_') && f.endsWith('.sql'));
    if (!sqlFile) {
      throw new Error(
        'No 0000_*.sql file found in ./drizzle/. Run `npm run db:generate` first.'
      );
    }
    sqlContent = readFileSync(path.join(drizzleDir, sqlFile), 'utf-8');
  });

  // Assertion 1: drizzle/ directory exists (implicit — beforeAll reads it)
  it('drizzle/ directory exists after generate', () => {
    expect(() => readdirSync(drizzleDir)).not.toThrow();
  });

  // Assertion 2: at least one .sql file present
  it('contains at least one .sql migration file', () => {
    const files = readdirSync(drizzleDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThan(0);
  });

  // Assertion 3: a file starting with 0000_ exists (D-24)
  it('0000 migration file exists (D-24 sequence scheme)', () => {
    const files = readdirSync(drizzleDir);
    const has0000 = files.some((f) => f.startsWith('0000_'));
    expect(has0000).toBe(true);
  });

  // Assertion 4: CREATE TABLE "production_orders"
  it('SQL contains CREATE TABLE "production_orders"', () => {
    expect(sqlContent).toContain('CREATE TABLE "production_orders"');
  });

  // Assertion 5: CREATE TABLE "order_events"
  it('SQL contains CREATE TABLE "order_events"', () => {
    expect(sqlContent).toContain('CREATE TABLE "order_events"');
  });

  // Assertion 6: CREATE TABLE "import_batches"
  it('SQL contains CREATE TABLE "import_batches"', () => {
    expect(sqlContent).toContain('CREATE TABLE "import_batches"');
  });

  // Assertion 7: CREATE TABLE "users"
  it('SQL contains CREATE TABLE "users"', () => {
    expect(sqlContent).toContain('CREATE TABLE "users"');
  });

  // Assertion 8: production_state enum (D-07)
  it('SQL contains CREATE TYPE "public"."production_state" AS ENUM', () => {
    expect(sqlContent).toContain('CREATE TYPE "public"."production_state" AS ENUM');
  });

  // Assertion 9: mill_line enum (D-07)
  it('SQL contains CREATE TYPE "public"."mill_line" AS ENUM', () => {
    expect(sqlContent).toContain('CREATE TYPE "public"."mill_line" AS ENUM');
  });

  // Assertion 10: ON DELETE CASCADE on order_events.order_id FK (D-10)
  it('SQL contains ON DELETE CASCADE (order_events → production_orders FK)', () => {
    expect(sqlContent).toContain('ON DELETE CASCADE');
  });

  // Assertion 11: DEFAULT 1 on version column (D-11 / SC#2)
  it('SQL contains DEFAULT 1 (version column optimistic concurrency)', () => {
    expect(sqlContent).toContain('DEFAULT 1');
  });

  // Assertion 12: DEFAULT gen_random_uuid() (D-06 — Neon pgcrypto preinstalled)
  it('SQL contains DEFAULT gen_random_uuid()', () => {
    expect(sqlContent).toContain("DEFAULT gen_random_uuid()");
  });

  // Assertion 13: NO CREATE EXTENSION pgcrypto (D-23 Pitfall 6 — Neon ships it)
  it('SQL does NOT contain CREATE EXTENSION pgcrypto (Neon ships it preinstalled)', () => {
    expect(sqlContent).not.toContain('CREATE EXTENSION pgcrypto');
  });

  // Assertion 14: UNIQUE INDEX on order_number (D-20)
  it('SQL contains CREATE UNIQUE INDEX "idx_orders_order_number"', () => {
    expect(sqlContent).toContain('CREATE UNIQUE INDEX "idx_orders_order_number"');
  });

  // Assertion 15a: idx_orders_state index (D-20)
  it('SQL contains CREATE INDEX "idx_orders_state"', () => {
    expect(sqlContent).toContain('CREATE INDEX "idx_orders_state"');
  });

  // Assertion 15b: idx_orders_mill_line index (D-20)
  it('SQL contains CREATE INDEX "idx_orders_mill_line"', () => {
    expect(sqlContent).toContain('CREATE INDEX "idx_orders_mill_line"');
  });

  // Assertion 15c: composite DESC index on order_events (D-20)
  it('SQL contains CREATE INDEX "idx_events_order_id_changed_at_desc"', () => {
    expect(sqlContent).toContain('CREATE INDEX "idx_events_order_id_changed_at_desc"');
  });
});
