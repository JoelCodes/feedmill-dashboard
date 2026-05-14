/**
 * Query contract tests for src/db/queries/imports.ts
 *
 * TDD RED phase: Tests are written before the implementation.
 * These tests will FAIL with module-not-found until the implementation creates imports.ts.
 *
 * Covers:
 * - getImportBatches: calls db.select().from(importBatches).orderBy(desc(importedAt)).limit(N)
 * - getImportBatches: limit is parameterised (not hardcoded)
 * - getImportBatches: wrapped in unstable_cache with key ['import-batches'] and tag 'import-batches'
 * - getImportBatches: first line of file is `import 'server-only';`
 */

// Stub next/cache so unstable_cache is the identity function (passthrough).
// Test 3 verifies the cache contract via source-code assertion (fs.readFile) to avoid
// jest.mock hoisting issues that prevent capturing the factory call args.
jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: jest.fn(),
}));

// Chainable mock for @/db: select → from → orderBy → limit → resolved value
const mockLimit = jest.fn().mockResolvedValue([
  {
    id: 'batch-1',
    fileName: 'test.xlsx',
    rowCount: 100,
    importedBy: 'user-1',
    importedAt: new Date('2026-01-01T00:00:00Z'),
  },
]);
const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

import { promises as fs } from 'fs';
import path from 'path';
import { getImportBatches } from '../imports';

describe('getImportBatches', () => {
  beforeEach(() => {
    mockLimit.mockResolvedValue([
      {
        id: 'batch-1',
        fileName: 'test.xlsx',
        rowCount: 100,
        importedBy: 'user-1',
        importedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ orderBy: mockOrderBy });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it('Test 1: calls db.select().from(importBatches).orderBy(desc(importedAt)).limit(10) and returns ImportBatch[]', async () => {
    const result = await getImportBatches({ limit: 10 });
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockOrderBy).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(Array.isArray(result)).toBe(true);
  });

  it('Test 2: with { limit: 5 }, the chain receives .limit(5) — limit is parameterised', async () => {
    await getImportBatches({ limit: 5 });
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it("Test 3 (source-assert): imports.ts is wrapped in unstable_cache with key ['import-batches'] and tag { tags: ['import-batches'] }", async () => {
    const filePath = path.resolve(__dirname, '..', 'imports.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    // Verify the cache key string
    expect(content).toContain("['import-batches']");
    // Verify the tag string (appears twice — once for key, once for tag)
    const matches = (content.match(/'import-batches'/g) ?? []).length;
    expect(matches).toBeGreaterThanOrEqual(2);
    // Verify the tag options object pattern
    expect(content).toContain("tags: ['import-batches']");
  });

  it("Test 4: first line of imports.ts is `import 'server-only';`", async () => {
    const filePath = path.resolve(__dirname, '..', 'imports.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    // Find the first non-empty line
    const firstNonBlank = lines.find((line) => line.trim().length > 0);
    expect(firstNonBlank).toBe("import 'server-only';");
  });
});
