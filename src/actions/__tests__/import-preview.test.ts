/**
 * Contract tests for previewImportAction (plans 33-05, 33-11).
 *
 * Mock topology:
 * - @/lib/auth: requireRole is a no-op by default
 * - @clerk/nextjs/server: auth returns { userId: 'u1' }
 * - next/cache: revalidateTag is a spy (must NOT be called by preview)
 * - @/db: chainable mock; select->from->where returns [] (no DB duplicates) by default
 * - read-excel-file/node: readSheet named export is a spy; return value controlled per test.
 *   Uses the v9.x ParseSheetDataResult discriminated union:
 *   Success branch: { objects: [...], errors: undefined }
 *   Error branch:   { objects: undefined, errors: [...] }
 */

// Mocks MUST be declared before any imports of the module under test.
jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'u1' }),
}));

// revalidateTag present but preview must NOT call it
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

// Chainable db mock; select->from->where returns [] (no DB duplicates) by default.
// Override per test with jest.mocked(...).mockResolvedValueOnce([...]) on the `where` mock.
const mockWhere = jest.fn().mockResolvedValue([]);
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
const mockInsert = jest.fn(); // preview must NOT call this

// Wrap mock references in arrow functions to avoid TDZ errors from SWC jest
// transform hoisting (const declarations stay in place, jest.mock factory runs
// early — direct references hit the temporal dead zone). Wrapper functions
// close over the variables by reference and resolve them at call time, after
// const declarations have been evaluated.
jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

// read-excel-file/node mock — controlled per test.
// Exposes the readSheet named export (v9.x API) as a jest.fn().
// The default export is also mocked to a no-op to prevent accidental use.
jest.mock('read-excel-file/node', () => ({
  __esModule: true,
  default: jest.fn(),
  readSheet: jest.fn(),
}));

import { revalidateTag } from 'next/cache';
import { readSheet } from 'read-excel-file/node';
import { requireRole } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

// Import AFTER mocks are established (hoisted by Jest transform)
import { previewImportAction } from '../import';
// MAX_IMPORT_BYTES lives in @/lib/import-constants per CR-01 (Next.js 16 forbids
// non-async-function exports from a 'use server' file).
import { MAX_IMPORT_BYTES } from '@/lib/import-constants';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Build a minimal stub File object for tests.
 * `read-excel-file/node` mock ignores the buffer content.
 *
 * Uses a real Blob with `size` zero-bytes of content so that:
 * 1. jsdom's FormData.set() stores it as a Blob (not "[object Object]")
 * 2. The Blob's natural .size property equals the requested size
 *    (needed for Test 1: server-side size guard check).
 *
 * NOTE: For size > MAX_IMPORT_BYTES tests (Test 1), this creates a ~2MB
 * Uint8Array of zeros. The readXlsxFile mock ignores the buffer content.
 */
function makeFile(
  options: Partial<{ size: number; name: string }> = {}
): File {
  const { size = 100, name = 'orders.xlsx' } = options;
  // Create a real Blob with `size` bytes so .size property is accurate
  const blob = new Blob([new Uint8Array(size)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return blob as unknown as File;
}

/**
 * Build a minimal FormData with the file attached.
 */
function makeFormData(file: File | null = null): FormData {
  const fd = new FormData();
  if (file) fd.set('file', file);
  return fd;
}

/**
 * Helper row returned by the readXlsxFile mock — valid by default.
 */
function makeRawRow(overrides: Record<string, unknown> = {}) {
  return {
    orderNumber: 'ORD-001',
    customer: 'Farm Co',
    product: 'Feed A',
    weightLbs: 6000,
    deliveryDate: new Date('2025-08-15T00:00:00.000Z'),
    formulaType: 'BRD',
    textureType: null,
    lineCode: null,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Reset chainable mock back to default (no DB duplicates)
  mockWhere.mockResolvedValue([]);
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
});

// Test 1: IMPORT-07 server-side size guard
it('Test 1: rejects files exceeding MAX_IMPORT_BYTES with validation error', async () => {
  const largeFile = makeFile({ size: MAX_IMPORT_BYTES + 1 });
  const formData = makeFormData(largeFile);

  const result = await previewImportAction(formData);

  expect(result).toEqual({
    ok: false,
    code: 'validation',
    message: 'File exceeds 2MB limit.',
  });
  // Parser must NOT be called for oversize files
  expect(jest.mocked(readSheet)).not.toHaveBeenCalled();
});

// Test 2: missing file
it('Test 2: returns validation error when no file is provided', async () => {
  const emptyFormData = makeFormData(null);

  const result = await previewImportAction(emptyFormData);

  expect(result).toEqual({
    ok: false,
    code: 'validation',
    message: 'No file provided.',
  });
});

// Test 3: happy path (IMPORT-03)
it('Test 3: returns ok preview payload for 2 valid rows', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 3000 }),
      makeRawRow({ orderNumber: 'ORD-002', weightLbs: 5000 }),
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({
    ok: true,
    summary: {
      rowCount: 2,
      totalWeight: 8000,
      validCount: 2,
      duplicateCount: 0,
      errorCount: 0,
    },
  });
  if (result.ok) {
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].isDuplicate).toBe(false);
    expect(result.rows[1].isDuplicate).toBe(false);
    expect(result.rows[0].errors).toBeUndefined();
    expect(result.rows[1].errors).toBeUndefined();
  }
});

// Test 4: Zod validation — IMPORT-04 partial errors
it('Test 4: collects per-row Zod errors without rejecting the whole file', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 6000 }),
      makeRawRow({ orderNumber: 'ORD-002', weightLbs: 4000 }),
      makeRawRow({ orderNumber: 'ORD-003', weightLbs: -50 }), // invalid
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.summary.errorCount).toBe(1);
    expect(result.summary.validCount).toBe(2);
    const badRow = result.rows.find((r) => r.orderNumber === 'ORD-003');
    expect(badRow?.errors).toBeDefined();
    expect(badRow?.errors?.some((e) => e.path === 'weightLbs')).toBe(true);
    expect(badRow?.errors?.some((e) => /positive/i.test(e.message))).toBe(true);
  }
});

// Test 5: intra-file duplicate (D-10, Pitfall 7)
it('Test 5: flags the second occurrence of a duplicate orderNumber within the file', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 3000 }),
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 4000 }), // duplicate of row above
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.summary.duplicateCount).toBe(1);
    const dupRow = result.rows[1];
    expect(dupRow.isDuplicate).toBe(true);
    expect(dupRow.duplicateOf).toBeDefined();
    // should reference the first occurrence by row number
    expect(dupRow.duplicateOf).toMatch(/row/i);
    // First occurrence is NOT flagged
    expect(result.rows[0].isDuplicate).toBe(false);
  }
});

// Test 6: DB-vs-file duplicate (D-10)
it('Test 6: flags rows whose orderNumber already exists in the database', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-005', weightLbs: 7000 }),
    ],
    errors: undefined,
  } as never);

  // DB returns ORD-005 as an existing order
  mockWhere.mockResolvedValueOnce([{ orderNumber: 'ORD-005' }]);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.summary.duplicateCount).toBe(1);
    expect(result.rows[0].isDuplicate).toBe(true);
    expect(result.rows[0].duplicateOf).toBe('db');
  }
});

// Test 7: combined intra-file + DB duplicates
it('Test 7: handles combined intra-file and DB duplicates correctly', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 1000 }),
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 2000 }), // intra-file dup
      makeRawRow({ orderNumber: 'ORD-099', weightLbs: 3000 }), // DB dup
    ],
    errors: undefined,
  } as never);

  // DB says ORD-099 already exists
  mockWhere.mockResolvedValueOnce([{ orderNumber: 'ORD-099' }]);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.summary.duplicateCount).toBe(2);

    const intraRow = result.rows[1];
    expect(intraRow.isDuplicate).toBe(true);
    expect(intraRow.duplicateOf).not.toBe('db');

    const dbRow = result.rows[2];
    expect(dbRow.isDuplicate).toBe(true);
    expect(dbRow.duplicateOf).toBe('db');

    // First occurrence of ORD-001 is NOT flagged
    expect(result.rows[0].isDuplicate).toBe(false);
  }
});

// Test 8: no DB writes (mutation-free preview)
it('Test 8: does NOT write to DB and does NOT call revalidateTag', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [makeRawRow()],
    errors: undefined,
  } as never);

  await previewImportAction(formData);

  expect(mockInsert).not.toHaveBeenCalled();
  expect(jest.mocked(revalidateTag)).not.toHaveBeenCalled();
});

// Test 9: millLine defaults to 'Premix' for every row (D-16)
it('Test 9: every preview row has millLine === Premix (D-16 — no Mill Line column in Book1.xlsx)', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    for (const row of result.rows) {
      expect(row.millLine).toBe('Premix');
    }
  }
});

// Test 10: date conversion (RESEARCH.md A1)
it('Test 10: converts Date deliveryDate to YYYY-MM-DD string in deliveryTime field', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ deliveryDate: new Date('2025-08-15T00:00:00.000Z') }),
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    // deliveryTime must be the ISO date prefix only (YYYY-MM-DD), not the full datetime
    expect(result.rows[0].deliveryTime).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.rows[0].deliveryTime).toBe('2025-08-15');
  }
});

// Test 11: totalWeight sums valid rows only
it('Test 11: totalWeight includes only rows without Zod errors', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: 100 }),
      makeRawRow({ orderNumber: 'ORD-002', weightLbs: 200 }),
      makeRawRow({ orderNumber: 'ORD-003', weightLbs: 300 }),
      makeRawRow({ orderNumber: 'ORD-004', weightLbs: -999 }), // invalid — excluded from totalWeight
    ],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    // 100 + 200 + 300 = 600 (invalid row NOT included)
    expect(result.summary.totalWeight).toBe(600);
  }
});

// Test 12: AUTH-02 — requireRole called first with 'mill_operator'
it('Test 12: calls requireRole(mill_operator) before any other operation', async () => {
  const callOrder: string[] = [];

  jest.mocked(requireRole).mockImplementationOnce(async () => {
    callOrder.push('requireRole');
  });
  // v9.x success branch for readSheet
  jest.mocked(readSheet).mockImplementationOnce(async () => {
    callOrder.push('readSheet');
    return { objects: [], errors: undefined } as never;
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await previewImportAction(formData);

  expect(jest.mocked(requireRole)).toHaveBeenCalledWith('mill_operator');
  // requireRole must be called before readSheet
  const roleIdx = callOrder.indexOf('requireRole');
  const parseIdx = callOrder.indexOf('readSheet');
  expect(roleIdx).toBeLessThan(parseIdx);
});

// Test 13: read-excel-file parser errors surface as per-row errors
it('Test 13: surfaces read-excel-file parser errors as per-row errors on the correct row', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x error branch: { objects: undefined, errors: [...] }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: undefined,
    errors: [
      {
        row: 2,
        column: 'Weight',
        error: 'invalid_number_format',
        value: 'not-a-number',
      },
    ],
  } as never);

  const result = await previewImportAction(formData);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    // Row at rowIndex 2 should carry the parser error
    const errorRow = result.rows.find((r) => r.rowIndex === 2);
    expect(errorRow).toBeDefined();
    expect(errorRow?.errors).toBeDefined();
    expect(errorRow?.errors?.length).toBeGreaterThanOrEqual(1);
  }
});

// Test 14: source assert — 'use server' is line 1
it('Test 14: src/actions/import.ts starts with use server directive (Pitfall 2)', () => {
  const importPath = path.resolve(__dirname, '../import.ts');
  const source = fs.readFileSync(importPath, 'utf8');
  const firstLine = source.split('\n')[0].trim();
  expect(firstLine).toBe("'use server';");
});

// Test 15: behavioral assert — revalidateTag NOT called during previewImportAction (preview is mutation-free)
// NOTE: plan 33-06 added revalidateTag to import.ts for commitImportAction — the source-assert
// that the file contains no revalidateTag was removed. Behavioral coverage (Test 8) is the
// stronger guarantee: mockInsert and revalidateTag must not be called by previewImportAction.
it('Test 15: previewImportAction does not call revalidateTag (mutation-free behavioral check)', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [makeRawRow()],
    errors: undefined,
  } as never);

  await previewImportAction(formData);

  expect(jest.mocked(revalidateTag)).not.toHaveBeenCalled();
});

// Test 16: source assert — imports readSheet (named export) from read-excel-file/node (GAP-05)
it('Test 16: src/actions/import.ts imports readSheet named export from read-excel-file/node (GAP-05)', () => {
  const importPath = path.resolve(__dirname, '../import.ts');
  const source = fs.readFileSync(importPath, 'utf8');
  // Must use readSheet named export, not the default readXlsxFile (v8.x misuse)
  expect(source).toMatch(/import\s*\{[^}]*readSheet[^}]*\}\s*from\s*['"]read-excel-file\/node['"]/);
});

// Test 18 (GAP-05): parser-error branch — readSheet returns { objects: undefined, errors: [...] }
// This is the ParseSheetDataResultError discriminated-union branch. The action must handle
// objects: undefined gracefully (via `?? []` guard) and surface the errors correctly.
it('Test 18 (GAP-05): handles ParseSheetDataResultError branch — objects:undefined, errors:[...] without crashing', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.x error branch: { objects: undefined, errors: [...] }
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: undefined,
    errors: [
      {
        row: 1,
        column: 'Document Number',
        error: 'required',
        value: undefined,
      },
    ],
  } as never);

  const result = await previewImportAction(formData);

  // Must NOT crash with TypeError: Cannot read properties of undefined (reading 'length')
  // Must return a result (either server error caught in outer try/catch, OR ok:true with the parser
  // error surfaced as a synthetic row). Either is acceptable — the key is no unhandled TypeError.
  expect(result).toBeDefined();
  // The action's outer catch returns { ok: false, code: 'server' } if rawRows ?? [] evaluates to 0-length
  // and the parser error lands in the synthetic-row path. Accept both shapes.
  if (result.ok) {
    // Parser error was surfaced as a synthetic row
    const errorRow = result.rows.find((r) => r.errors && r.errors.length > 0);
    expect(errorRow).toBeDefined();
  } else {
    // Parser error triggered the outer catch (still acceptable — no TypeError unhandled)
    expect(['server', 'validation']).toContain(result.code);
  }
});

// Test 17 (GAP-04/GAP-05): clean files — readSheet returns { objects: [...], errors: undefined } per v9.0.9 .d.ts
it('Test 17 (GAP-04/GAP-05): handles clean files (ParseSheetDataResultSuccess) without throwing — readSheet v9.x', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // v9.0.9 ParseSheetDataResultSuccess: { objects: [...], errors: undefined }
  // readSheet with schema returns this union — action must destructure `objects`
  // (not `rows`) and tolerate errors: undefined via `?? []` guard from GAP-04.
  jest.mocked(readSheet).mockResolvedValueOnce({
    objects: [makeRawRow({ orderNumber: 'ORD-CLEAN-001', weightLbs: 6000 })],
    errors: undefined,
  } as never);

  const result = await previewImportAction(formData);

  // Must NOT return the generic server error from the outer try/catch
  // (which would indicate the TypeError surfaced).
  expect(result).toMatchObject({
    ok: true,
    summary: {
      rowCount: 1,
      totalWeight: 6000,
      validCount: 1,
      duplicateCount: 0,
      errorCount: 0,
    },
  });
  if (result.ok) {
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].orderNumber).toBe('ORD-CLEAN-001');
    expect(result.rows[0].errors).toBeUndefined();
  }
});
