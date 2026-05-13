/**
 * Shape contract test for src/db/seed-data.json.
 *
 * TDD RED: This file will fail until Task 2 generates seed-data.json
 * via scripts/export-seed.ts (Cannot find module '../seed-data.json').
 *
 * Assertions:
 *  1. seedData is an array
 *  2. seedData.length === 33
 *  3. Every row has the 8 NOT NULL required fields
 *  4. Every row's created_by === 'system-seed' (D-19)
 *  5. Every row's state is a valid productionStateEnum value
 *  6. Every row's mill_line is a valid millLineEnum value
 *  7. Every row's weight_lbs is a string (Drizzle numeric requirement)
 *  8. Every row's version === 1 (D-11)
 *  9. Every row's texture_type is string | null (never undefined — JSON round-trip)
 * 10. Every row's line_code is string | null (never undefined — JSON round-trip)
 */
import seedData from '../seed-data.json';

const REQUIRED_FIELDS = [
  'order_number',
  'customer',
  'product',
  'weight_lbs',
  'delivery_time',
  'state',
  'mill_line',
  'created_by',
];

const VALID_STATES = ['Pending', 'Mixing', 'Completed', 'Blocked'];
const VALID_MILL_LINES = ['Premix', 'Excel', 'CGM'];

describe('src/db/seed-data.json shape', () => {
  it('is an array', () => {
    expect(Array.isArray(seedData)).toBe(true);
  });

  it('has exactly 33 rows', () => {
    expect(seedData).toHaveLength(33);
  });

  it('every row has required NOT NULL fields', () => {
    for (const row of seedData) {
      for (const field of REQUIRED_FIELDS) {
        expect(row).toHaveProperty(field);
        expect((row as Record<string, unknown>)[field]).not.toBeNull();
        expect((row as Record<string, unknown>)[field]).not.toBeUndefined();
      }
    }
  });

  it('all created_by values are system-seed (D-19)', () => {
    for (const row of seedData) {
      expect((row as Record<string, unknown>).created_by).toBe('system-seed');
    }
  });

  it('state values are valid enum members', () => {
    for (const row of seedData) {
      expect(VALID_STATES).toContain((row as Record<string, unknown>).state);
    }
  });

  it('mill_line values are valid enum members', () => {
    for (const row of seedData) {
      expect(VALID_MILL_LINES).toContain((row as Record<string, unknown>).mill_line);
    }
  });

  it('weight_lbs is a string on every row (Drizzle numeric column requirement)', () => {
    for (const row of seedData) {
      expect(typeof (row as Record<string, unknown>).weight_lbs).toBe('string');
    }
  });

  it('version is 1 on every row (D-11)', () => {
    for (const row of seedData) {
      expect((row as Record<string, unknown>).version).toBe(1);
    }
  });

  it('texture_type is string or null on every row (never undefined — JSON round-trip)', () => {
    for (const row of seedData) {
      const val = (row as Record<string, unknown>).texture_type;
      expect(val === null || typeof val === 'string').toBe(true);
    }
  });

  it('line_code is string or null on every row (never undefined — JSON round-trip)', () => {
    for (const row of seedData) {
      const val = (row as Record<string, unknown>).line_code;
      expect(val === null || typeof val === 'string').toBe(true);
    }
  });
});
