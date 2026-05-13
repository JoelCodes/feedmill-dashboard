/**
 * Wave-0 structural contract test for the drizzle-kit generated migration SQL.
 *
 * Purpose: Catches missing-migration regressions and column/table/index drift.
 * In replay scenarios (fresh checkout without running `drizzle-kit generate`),
 * the test fails RED — a deliberate signal that the developer must run
 * `npm run db:generate` first.
 *
 * After `drizzle-kit generate` is run (Task 2), all assertions below pass
 * GREEN, confirming the generated SQL matches the schema files exactly.
 *
 * Assertions use anchored regexes (column- or constraint-scoped) rather than
 * substring-anywhere matches, so they can detect drift in default values,
 * FK cascade behavior, and index column targets — not just whether the
 * substring appears somewhere in the file.
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
    // If the directory does not exist, surface a clear actionable message
    // pointing the developer to run `npm run db:generate`.
    let files: string[];
    try {
      files = readdirSync(drizzleDir);
    } catch {
      throw new Error(
        `drizzle/ directory not found at ${drizzleDir}. ` +
          'Run `npm run db:generate` first.'
      );
    }
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
    expect(sqlContent).toMatch(/CREATE TABLE "production_orders"\s*\(/);
  });

  // Assertion 5: CREATE TABLE "order_events"
  it('SQL contains CREATE TABLE "order_events"', () => {
    expect(sqlContent).toMatch(/CREATE TABLE "order_events"\s*\(/);
  });

  // Assertion 6: CREATE TABLE "import_batches"
  it('SQL contains CREATE TABLE "import_batches"', () => {
    expect(sqlContent).toMatch(/CREATE TABLE "import_batches"\s*\(/);
  });

  // Assertion 7: CREATE TABLE "users"
  it('SQL contains CREATE TABLE "users"', () => {
    expect(sqlContent).toMatch(/CREATE TABLE "users"\s*\(/);
  });

  // Assertion 8: production_state enum (D-07) — values in lifecycle order
  it('production_state enum is defined with [Pending, Mixing, Completed, Blocked]', () => {
    expect(sqlContent).toMatch(
      /CREATE TYPE "public"\."production_state" AS ENUM\s*\(\s*'Pending'\s*,\s*'Mixing'\s*,\s*'Completed'\s*,\s*'Blocked'\s*\)/
    );
  });

  // Assertion 9: mill_line enum (D-07)
  it('mill_line enum is defined with [Premix, Excel, CGM]', () => {
    expect(sqlContent).toMatch(
      /CREATE TYPE "public"\."mill_line" AS ENUM\s*\(\s*'Premix'\s*,\s*'Excel'\s*,\s*'CGM'\s*\)/
    );
  });

  // Assertion 10: ON DELETE cascade anchored on the specific order_events FK (D-10)
  // Anchored to the constraint name so an unrelated table gaining cascade
  // delete does not satisfy this assertion.
  it('order_events.order_id FK references production_orders.id ON DELETE cascade (D-10)', () => {
    expect(sqlContent).toMatch(
      /ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_production_orders_id_fk"[\s\S]+?FOREIGN KEY \("order_id"\) REFERENCES "public"\."production_orders"\("id"\)[\s\S]+?ON DELETE cascade/
    );
  });

  // Assertion 11: DEFAULT 1 anchored on the version column (D-11 / SC#2)
  it('version column has DEFAULT 1 (optimistic concurrency)', () => {
    expect(sqlContent).toMatch(/"version"\s+integer\s+DEFAULT\s+1\s+NOT NULL/);
  });

  // Assertion 12: DEFAULT gen_random_uuid() anchored on uuid PK columns (D-06 — Neon pgcrypto preinstalled)
  it('uuid primary key columns use DEFAULT gen_random_uuid()', () => {
    expect(sqlContent).toMatch(
      /"id" uuid PRIMARY KEY DEFAULT gen_random_uuid\(\) NOT NULL/
    );
  });

  // Assertion 13: NO CREATE EXTENSION pgcrypto (D-23 Pitfall 6 — Neon ships it)
  it('SQL does NOT contain CREATE EXTENSION pgcrypto (Neon ships it preinstalled)', () => {
    expect(sqlContent).not.toContain('CREATE EXTENSION pgcrypto');
  });

  // Assertion 14: UNIQUE INDEX on order_number — anchored to table + column (D-20)
  it('idx_orders_order_number is UNIQUE on production_orders(order_number)', () => {
    expect(sqlContent).toMatch(
      /CREATE UNIQUE INDEX "idx_orders_order_number" ON "production_orders" USING btree \("order_number"\)/
    );
  });

  // Assertion 15a: idx_orders_state — anchored to table + column (D-20)
  it('idx_orders_state is on production_orders(state)', () => {
    expect(sqlContent).toMatch(
      /CREATE INDEX "idx_orders_state" ON "production_orders" USING btree \("state"\)/
    );
  });

  // Assertion 15b: idx_orders_mill_line — anchored to table + column (D-20)
  it('idx_orders_mill_line is on production_orders(mill_line)', () => {
    expect(sqlContent).toMatch(
      /CREATE INDEX "idx_orders_mill_line" ON "production_orders" USING btree \("mill_line"\)/
    );
  });

  // Assertion 15c: composite DESC index on order_events (D-20)
  it('idx_events_order_id_changed_at_desc is composite (order_id, changed_at DESC)', () => {
    expect(sqlContent).toMatch(
      /CREATE INDEX "idx_events_order_id_changed_at_desc" ON "order_events" USING btree \("order_id"\s*,\s*"changed_at"\s+DESC[^)]*\)/
    );
  });

  // Assertion 16: weight_lbs is numeric(10, 2) — anchored to column + type (CR-03 partial)
  it('weight_lbs column is numeric(10, 2) NOT NULL', () => {
    expect(sqlContent).toMatch(/"weight_lbs"\s+numeric\(10,\s*2\)\s+NOT NULL/);
  });
});
