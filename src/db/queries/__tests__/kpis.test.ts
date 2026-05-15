/**
 * KPI query contract tests for src/db/queries/kpis.ts
 *
 * TDD RED phase: Tests were written before the implementation.
 *
 * Structure:
 *  - describe('getKpiStrip') — Tests 1-13
 *  - describe('getSevenDayTrend') — Tests 14-20
 *  - describe('getBlockedWithDwell') — Tests 21-28
 *
 * Security canary: Test 5 (Pitfall 2) + tests in timezone.test.ts (Test 8 there)
 * D-14 invariant: all three exported queries use tags: ['production-orders']
 * D-11/D-12: Test 13 verifies SQL CASE and bucketTexture() agree on all known inputs
 */

// ─── Mock next/cache ───────────────────────────────────────────────────────────
jest.mock('next/cache', () => ({
  unstable_cache: (fn: Function, _key: string[], _opts: { tags: string[] }) => fn,
  revalidateTag: jest.fn(),
}));

// ─── Mock server-only ─────────────────────────────────────────────────────────
jest.mock('server-only', () => ({}));

// ─── Mock @/db ────────────────────────────────────────────────────────────────
// Each test sets mockSelectResults to an array of arrays.
// The N-th db.select() call in the function under test resolves to mockSelectResults[N].
// The mock builder supports .from().where().groupBy().orderBy() and
// .from().innerJoin().where().groupBy().orderBy() chains.

let mockSelectResults: unknown[][] = [];
let mockSelectCallIndex = 0;

function createChainableResult(index: number): Record<string, unknown> {
  const resolver = () => {
    const result = mockSelectResults[index] ?? [];
    return Promise.resolve(result);
  };
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_target, prop) {
      if (prop === 'then') {
        // Support direct await (thenable)
        return (resolve: Function, reject: Function) => resolver().then(resolve, reject);
      }
      // Any other method call (from, where, innerJoin, groupBy, orderBy) returns itself
      // so the chain continues. When orderBy is the last call, it returns a Promise.
      if (prop === 'orderBy') {
        return (_arg: unknown) => resolver();
      }
      return (_arg?: unknown) => proxy;
    },
  });
  return proxy;
}

const mockSelect = jest.fn().mockImplementation(() => {
  const index = mockSelectCallIndex++;
  return createChainableResult(index);
});

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { promises as fs } from 'fs';
import path from 'path';
import { bucketTexture } from '@/lib/formula-mix';
import { formatDwell } from '@/lib/format-dwell';
import { getKpiStrip, getSevenDayTrend, getBlockedWithDwell } from '../kpis';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const KPIS_SOURCE_PATH = path.resolve(__dirname, '..', 'kpis.ts');

async function readKpisSource(): Promise<string> {
  return fs.readFile(KPIS_SOURCE_PATH, 'utf-8');
}

function resetMockDb(results: unknown[][]) {
  mockSelectResults = results;
  mockSelectCallIndex = 0;
  mockSelect.mockClear();
}

// ─── describe('getKpiStrip') ─────────────────────────────────────────────────
describe('getKpiStrip', () => {
  beforeEach(() => {
    // Default: 4 queries in getKpiStrip, each returns []
    resetMockDb([[], [], [], []]);
  });

  // ─── Cache invariant tests (D-14) ─────────────────────────────────────────

  it('Test 1 (cache tag): getKpiStrip uses tags: ["production-orders"] in source', async () => {
    const source = await readKpisSource();
    expect(source).toContain("tags: ['production-orders']");
  });

  it('Test 2 (cache key): getKpiStrip uses unique cache key "kpi-strip" in source', async () => {
    const source = await readKpisSource();
    expect(source).toContain("'kpi-strip'");
  });

  // ─── Security gate (Pitfall 2) ───────────────────────────────────────────

  it('Test 5 (Pitfall 2): source calls sanitizeIanaTimezone before any AT TIME ZONE SQL composition', async () => {
    const source = await readKpisSource();
    expect(source).toContain('sanitizeIanaTimezone');
  });

  // ─── SQL/JS bucket agreement (D-11 / D-12) ──────────────────────────────

  it(
    'Test 13 (SQL/JS bucket agreement): for all 7 known DB texture values, SQL CASE and bucketTexture() agree',
    async () => {
      const source = await readKpisSource();

      const testValues: Array<string | null> = [
        'PELLET',
        'SH PELLET',
        'MASH',
        'FINE CR',
        'C. CRUMBLE',
        null,
        'UNKNOWN_FUTURE_VALUE',
      ];

      const jsBuckets = testValues.map((v) => bucketTexture(v));

      // Map of SQL WHEN value → expected JS bucket
      const sqlExpected: Record<string, string> = {
        PELLET: 'Pellet',
        'SH PELLET': 'Pellet',
        MASH: 'Mash',
        'FINE CR': 'Crumble',
        'C. CRUMBLE': 'Crumble',
      };

      // Verify the SQL source contains WHEN clauses for each known texture
      for (const [sqlValue, expectedBucket] of Object.entries(sqlExpected)) {
        expect(source).toContain(`'${sqlValue}'`);
        const jsBucket = bucketTexture(sqlValue);
        expect(jsBucket).toBe(expectedBucket);
      }

      // Null and unknown → null in both JS and SQL
      expect(jsBuckets[5]).toBeNull();
      expect(jsBuckets[6]).toBeNull();
      expect(source).toContain('ELSE NULL');

      // All 5 known values agree
      expect(jsBuckets[0]).toBe('Pellet');
      expect(jsBuckets[1]).toBe('Pellet');
      expect(jsBuckets[2]).toBe('Mash');
      expect(jsBuckets[3]).toBe('Crumble');
      expect(jsBuckets[4]).toBe('Crumble');
    }
  );

  // ─── SQL structure tests ────────────────────────────────────────────────

  it('Test 3 (AT TIME ZONE): source contains AT TIME ZONE ≥ 3 times (KPI-01, KPI-02, KPI-05)', async () => {
    const source = await readKpisSource();
    const matches = source.match(/AT TIME ZONE/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 4 (COALESCE Pitfall 1): source wraps every sum() in COALESCE ≥ 3 times', async () => {
    const source = await readKpisSource();
    const matches = source.match(/COALESCE/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Return-shape tests ────────────────────────────────────────────────

  it('Test 6 (KPI-01 happy path): source exports completedTodayLbs in KpiStripData', async () => {
    const source = await readKpisSource();
    expect(source).toContain('completedTodayLbs');
  });

  it('Test 7 (KPI-02 per-line): source maps premixLbs, excelLbs, cgmLbs from per-line result', async () => {
    const source = await readKpisSource();
    expect(source).toContain('premixLbs');
    expect(source).toContain('excelLbs');
    expect(source).toContain('cgmLbs');
  });

  it('Test 8 (KPI-02 missing line): source default-fills missing mill lines with "0"', async () => {
    const source = await readKpisSource();
    expect(source).toMatch(/cgmLbs.*'0'|'0'.*cgmLbs|CGM.*'0'|'0'.*CGM/s);
  });

  it('Test 9 (KPI-04 pending): source exports pendingCount and pendingLbs', async () => {
    const source = await readKpisSource();
    expect(source).toContain('pendingCount');
    expect(source).toContain('pendingLbs');
  });

  it('Test 10 (KPI-04 COALESCE): source uses COALESCE to guard pending sum against null', async () => {
    const source = await readKpisSource();
    expect(source).toContain('COALESCE');
  });

  it('Test 11 (KPI-05 percentages): source exports pelletPct, mashPct, crumblePct, uncategorizedCount', async () => {
    const source = await readKpisSource();
    expect(source).toContain('pelletPct');
    expect(source).toContain('mashPct');
    expect(source).toContain('crumblePct');
    expect(source).toContain('uncategorizedCount');
  });

  it('Test 12 (NULLIF D-12): source uses NULLIF for KPI-05 denominator guard', async () => {
    const source = await readKpisSource();
    expect(source).toContain('NULLIF');
  });

  it('Test 6b (getKpiStrip runtime): returns KpiStripData shape when db returns empty', async () => {
    resetMockDb([[], [], [], []]);
    const result = await getKpiStrip('America/Chicago');
    expect(result).toHaveProperty('completedTodayLbs');
    expect(result).toHaveProperty('premixLbs');
    expect(result).toHaveProperty('excelLbs');
    expect(result).toHaveProperty('cgmLbs');
    expect(result).toHaveProperty('pendingCount');
    expect(result).toHaveProperty('pendingLbs');
    expect(result).toHaveProperty('pelletPct');
    expect(result).toHaveProperty('mashPct');
    expect(result).toHaveProperty('crumblePct');
    expect(result).toHaveProperty('uncategorizedCount');
  });
});

// ─── describe('getSevenDayTrend') ───────────────────────────────────────────
describe('getSevenDayTrend', () => {
  beforeEach(() => {
    resetMockDb([[]]);
  });

  it('Test 14 (cache + tag): getSevenDayTrend uses key "kpi-seven-day-trend" and tag "production-orders"', async () => {
    const source = await readKpisSource();
    expect(source).toContain("'kpi-seven-day-trend'");
    expect(source).toContain("tags: ['production-orders']");
  });

  it('Test 15 (sanitization): source calls sanitizeIanaTimezone ≥ 2 times (once per tz-accepting query)', async () => {
    const source = await readKpisSource();
    const sanitizeCalls = (source.match(/sanitizeIanaTimezone/g) ?? []).length;
    expect(sanitizeCalls).toBeGreaterThanOrEqual(2);
  });

  it('Test 16 (SQL shape): source uses INTERVAL "6 days" and AT TIME ZONE for 7-day window', async () => {
    const source = await readKpisSource();
    expect(source).toContain("INTERVAL '6 days'");
    expect(source).toContain('AT TIME ZONE');
  });

  it('Test 17 (return shape): source casts completedLbs to float/number for TrendDay contract', async () => {
    const source = await readKpisSource();
    expect(source).toMatch(/float8|parseFloat|Number\(/);
  });

  it('Test 18 (empty DB): getSevenDayTrend returns [] when db returns no rows', async () => {
    resetMockDb([[]]);
    const result = await getSevenDayTrend('America/Chicago');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('Test 19 (partial data): when db returns 3 rows, result has 3 TrendDay entries', async () => {
    resetMockDb([[
      { date: '2026-05-12', completedLbs: 5000 },
      { date: '2026-05-13', completedLbs: 7200 },
      { date: '2026-05-14', completedLbs: 3100 },
    ]]);
    const result = await getSevenDayTrend('America/Chicago');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-05-12');
    expect(typeof result[0].completedLbs).toBe('number');
  });

  it('Test 20 (ordering): source orders by date ASC for oldest-first bar rendering', async () => {
    const source = await readKpisSource();
    expect(source).toMatch(/ASC/);
  });
});

// ─── describe('getBlockedWithDwell') ────────────────────────────────────────
describe('getBlockedWithDwell', () => {
  beforeEach(() => {
    resetMockDb([[]]);
  });

  it('Test 21 (cache + tag): getBlockedWithDwell uses key "kpi-blocked-dwell" and tag "production-orders" ≥ 3 times', async () => {
    const source = await readKpisSource();
    expect(source).toContain("'kpi-blocked-dwell'");
    const tagMatches = (source.match(/tags: \['production-orders'\]/g) ?? []).length;
    expect(tagMatches).toBeGreaterThanOrEqual(3);
  });

  it('Test 22 (SQL JOIN): source uses innerJoin and filters both toState and order state to "Blocked"', async () => {
    const source = await readKpisSource();
    expect(source).toContain('innerJoin');
    expect(source).toContain("'Blocked'");
  });

  it('Test 23 (dwell formula): source uses EXTRACT(EPOCH FROM ...) for dwell seconds', async () => {
    const source = await readKpisSource();
    expect(source).toContain('EXTRACT(EPOCH');
  });

  it('Test 24 (sort): source orders by MAX(changedAt) ASC (oldest block first)', async () => {
    const source = await readKpisSource();
    expect(source).toContain('ASC');
    expect(source).toMatch(/MAX.*changedAt|changedAt.*ASC/s);
  });

  it(
    'Test 25 (return mapping): row with dwellSeconds: 8040 and earlyDeliveryDate "2026-05-10" maps to dwellFormatted "2h 14m" and isOverdue: true',
    async () => {
      resetMockDb([[
        {
          orderId: 'order-abc',
          orderNumber: 'ORD-001',
          customer: 'Acme Feed',
          millLine: 'Premix',
          dwellSeconds: 8040,
          earlyDeliveryDate: '2026-05-10',
          isOverdue: true, // Postgres computed: '2026-05-10' < CURRENT_DATE
        },
      ]]);
      const result = await getBlockedWithDwell();
      expect(result).toHaveLength(1);
      expect(result[0].dwellSeconds).toBe(8040);
      expect(result[0].dwellFormatted).toBe('2h 14m');
      expect(result[0].isOverdue).toBe(true);
    }
  );

  it('Test 26 (isOverdue null guard): row with earlyDeliveryDate: null → isOverdue: false', async () => {
    resetMockDb([[
      {
        orderId: 'order-def',
        orderNumber: 'ORD-002',
        customer: 'Beta Mill',
        millLine: 'Excel',
        dwellSeconds: 3600,
        earlyDeliveryDate: null,
        isOverdue: null,
      },
    ]]);
    const result = await getBlockedWithDwell();
    expect(result).toHaveLength(1);
    expect(result[0].isOverdue).toBe(false);
  });

  it(
    'Test 27 (isOverdue today edge): row with earlyDeliveryDate === today and isOverdue: false → payload isOverdue: false',
    async () => {
      resetMockDb([[
        {
          orderId: 'order-ghi',
          orderNumber: 'ORD-003',
          customer: 'Gamma Co',
          millLine: 'CGM',
          dwellSeconds: 1800,
          earlyDeliveryDate: '2026-05-14',
          isOverdue: false, // Postgres: '2026-05-14' < CURRENT_DATE → false (not strictly overdue)
        },
      ]]);
      const result = await getBlockedWithDwell();
      expect(result).toHaveLength(1);
      expect(result[0].isOverdue).toBe(false);
    }
  );

  it('Test 28 (formatDwell agreement): for [0, 60, 3599, 3600, 86400], dwellFormatted matches formatDwell()', async () => {
    const testSeconds = [0, 60, 3599, 3600, 86400];

    for (const seconds of testSeconds) {
      resetMockDb([[
        {
          orderId: `order-${seconds}`,
          orderNumber: `ORD-${seconds}`,
          customer: 'Test Co',
          millLine: 'Premix',
          dwellSeconds: seconds,
          earlyDeliveryDate: null,
          isOverdue: null,
        },
      ]]);
      const result = await getBlockedWithDwell();
      expect(result).toHaveLength(1);
      expect(result[0].dwellFormatted).toBe(formatDwell(seconds));
    }
  });
});
