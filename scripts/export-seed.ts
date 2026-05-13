/**
 * scripts/export-seed.ts
 *
 * One-shot, re-runnable exporter. Reads the 33-order mock array from
 * src/services/millProduction.ts, transforms camelCase fields to snake_case
 * DB column names, and writes src/db/seed-data.json.
 *
 * No DB connection — pure data transformation. No dotenv required.
 * Re-runnable: deterministic output (same input → same output).
 *
 * Usage:
 *   npx --yes tsx@4.21.0 scripts/export-seed.ts
 *
 * CONTEXT.md decision references:
 *   - D-15: Seed source is a static JSON snapshot at src/db/seed-data.json
 *   - D-19: All seeded orders use created_by = 'system-seed'
 *   - D-11: version = 1 (default for all seed rows)
 *   - D-06: id is DROPPED — DB generates UUID via defaultRandom()
 *   - D-12: weight_lbs cast to string — Drizzle numeric inserts expect string
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { mockOrders } from '../src/services/millProduction';

const seedRows = mockOrders.map((o) => ({
  order_number: o.orderNumber,
  customer: o.customer,
  product: o.product,
  weight_lbs: String(o.weightLbs),     // D-12: numeric column expects string in Drizzle insert
  delivery_time: o.deliveryTime,
  state: o.state,
  mill_line: o.millLine,
  texture_type: o.textureType ?? null,  // nullable; undefined → JSON null
  line_code: o.lineCode ?? null,        // nullable; undefined → JSON null
  created_by: 'system-seed',            // D-19: sentinel for fixture rows
  version: 1,                           // D-11: optimistic concurrency seed value
}));

// __dirname resolves correctly in CJS mode (package.json has no "type": "module")
const outputPath = path.resolve(__dirname, '../src/db/seed-data.json');
writeFileSync(outputPath, JSON.stringify(seedRows, null, 2) + '\n');

console.log(`Wrote ${seedRows.length} rows to ${outputPath}`);
