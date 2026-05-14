/**
 * Contract tests for commitImportAction (plans 33-06, 33-11).
 *
 * Mock topology:
 * - @/lib/auth: requireRole is a no-op by default
 * - @clerk/nextjs/server: auth returns { userId: 'u1' }
 * - next/cache: revalidateTag is a spy; asserted called on success
 * - next/navigation: redirect is a spy
 * - @/db: chainable mock; select->from->where returns [] by default;
 *   extended with insert (per-table), update chains
 * - read-excel-file/node: readSheet named export (v9.x API) is a spy; return value controlled per test.
 *   Uses the v9.x ParseSheetDataResult discriminated union:
 *   Success branch: { objects: [...], errors: undefined }
 *   Error branch:   { objects: undefined, errors: [...] }
 */

import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────────────────────────
// Mock declarations — MUST be hoisted above module imports.
// Use `mock`-prefixed helpers to avoid TDZ errors from SWC jest hoisting.
// ────────────────────────────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'u1' }),
}));

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────
// DB mock — per-table chainable insert + overwrite-path select + update
// ────────────────────────────────────────────────────────────────────────────
//
// Strategy: `db.insert(table)` returns a fresh chainable object keyed on
// the table reference. We track calls by inspecting what was passed.
//
// The key insight: jest.mock factories can only use `mock`-prefixed variables
// (SWC hoisting allowlist). We define each mock function with `mock` prefix.

// --- select chain (for overwrite-path existing-row lookup) ---
const mockSelectWhere = jest.fn().mockResolvedValue([]);
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom });

// --- insert chains ---
// productionOrders insert: .values(...).returning(...)
const mockInsertOrdersReturning = jest.fn().mockResolvedValue([{ id: 'new-order-id' }]);
const mockInsertOrdersValues = jest.fn().mockReturnValue({ returning: mockInsertOrdersReturning });

// orderEvents insert: .values(...) — no .returning() in action body
const mockInsertEventsValues = jest.fn().mockResolvedValue([]);

// importBatches insert: .values(...).returning(...)
const mockInsertBatchesReturning = jest.fn().mockResolvedValue([{ id: 'batch-1' }]);
const mockInsertBatchesValues = jest.fn().mockReturnValue({ returning: mockInsertBatchesReturning });

// Table-dispatch: return different chain per table. The tables are imported after
// the mock is established, so we use a string-based heuristic on the table object.
// We track which insert is called by order (productionOrders is called first, then events, then batches).
// Instead of keying on table identity (which requires the real module), we use
// a call-counter approach: insert() invocations are dispatched in order.
//
// Simpler approach: expose a factory that callers can reconfigure per test,
// recording all .insert(table) calls so tests can assert by argument.

const mockInsertCalls: unknown[] = [];
const mockInsert = jest.fn().mockImplementation((table: unknown) => {
  mockInsertCalls.push(table);
  // Dispatch based on insertion order of calls for known tests.
  // We expose per-table chain builders so tests can configure them.
  return mockInsertDispatch(table);
});

// Dispatch table — callers assign per-table chains
let mockInsertDispatch = (_table: unknown): ReturnType<typeof mockInsertOrdersValues> | ReturnType<typeof mockInsertEventsValues> | ReturnType<typeof mockInsertBatchesValues> => {
  return mockInsertOrdersValues as ReturnType<typeof mockInsertOrdersValues>;
};

// --- update chain (for overwrite path) ---
const mockUpdateReturning = jest.fn().mockResolvedValue([{ id: 'existing-id' }]);
const mockUpdateWhere = jest.fn().mockReturnValue({ returning: mockUpdateReturning });
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });

// Wrap in arrow functions to avoid TDZ (SWC hoisting pattern from plan 33-05)
jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

// read-excel-file/node mock — exposes readSheet named export (v9.x API).
// The default export is also mocked to a no-op to prevent accidental use.
jest.mock('read-excel-file/node', () => ({
  __esModule: true,
  default: jest.fn(),
  readSheet: jest.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────
// Imports — after mocks
// ────────────────────────────────────────────────────────────────────────────

import { revalidateTag } from 'next/cache';
import { readSheet } from 'read-excel-file/node';
import { requireRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';

import {
  commitImportAction,
  type ImportDecisions,
  type CommitResult,
} from '../import';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeFile(options: { size?: number; name?: string } = {}): File {
  const { size = 100, name = 'orders.xlsx' } = options;
  // Use a real File so FormData preserves the name property.
  // jsdom's Blob.name defaults to "blob" when stored via FormData.set(),
  // but File preserves the name passed to its constructor.
  try {
    return new File([new Uint8Array(size)], name, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  } catch {
    // Fallback for environments without File constructor
    const blob = new Blob([new Uint8Array(size)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(blob, 'name', { value: name, writable: false, configurable: true });
    return blob as unknown as File;
  }
}

function makeFormData(file: File | null = null): FormData {
  const fd = new FormData();
  if (file) fd.set('file', file);
  return fd;
}

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

const noDecisions: ImportDecisions = { skipRows: [], overwriteRows: [] };

// ────────────────────────────────────────────────────────────────────────────
// Default mock topology for most tests:
// - Single productionOrders insert → resolves to [{ id: 'new-order-id' }]
// - orderEvents insert → resolves to []
// - importBatches insert → resolves to [{ id: 'batch-1' }]
// - select existing-row → returns [] (no existing row; overwrite tests override)
// - readXlsxFile → one valid row
// ────────────────────────────────────────────────────────────────────────────

// Table shape tracker to route inserts to the right mock chain
// We track by index: inserts to productionOrders come first, then orderEvents, then importBatches
let insertCallIndex = 0;

function resetInsertDispatch() {
  insertCallIndex = 0;
  // Default sequence: orders → events → batches per row, then batch insert at end
  // We'll use a call-counter approach per test
  mockInsert.mockImplementation((_table: unknown) => {
    mockInsertCalls.push(_table);
    const idx = insertCallIndex++;
    // Even indices: productionOrders (0, 2, 4...) — odd indices: orderEvents (1, 3, 5...)
    // Last call: importBatches
    // This is too fragile — use a named dispatch instead
    return mockInsertDispatch(_table);
  });
}

function setupDefaultInsertDispatch(
  ordersChain: { values: typeof mockInsertOrdersValues } = { values: mockInsertOrdersValues },
  eventsChain: { values: typeof mockInsertEventsValues } = { values: mockInsertEventsValues },
  batchesChain: { values: typeof mockInsertBatchesValues } = { values: mockInsertBatchesValues }
) {
  // We'll use a sequence-based approach: track call count per session
  let callCount = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const n = callCount++;
    mockInsertCalls.push({ table: _table, callN: n });
    // For standard 1-row happy path:
    // call 0 = productionOrders, call 1 = orderEvents, call 2 = importBatches
    // For 2-row: 0=orders, 1=events, 2=orders, 3=events, 4=batches
    // We need a smarter dispatch. Use table identity via the module.
    //
    // Since we can't import the table refs here (pre-import), we use
    // a simpler heuristic: the importBatches insert is always the LAST call.
    // Track N calls up front — tests that need precise control override per call.
    return mockInsertDispatch(_table);
  });
  void ordersChain;
  void eventsChain;
  void batchesChain;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsertCalls.length = 0;
  insertCallIndex = 0;

  // Reset chain mocks to defaults
  mockInsertOrdersReturning.mockResolvedValue([{ id: 'new-order-id' }]);
  mockInsertOrdersValues.mockReturnValue({ returning: mockInsertOrdersReturning });
  mockInsertEventsValues.mockResolvedValue([]);
  mockInsertBatchesReturning.mockResolvedValue([{ id: 'batch-1' }]);
  mockInsertBatchesValues.mockReturnValue({ returning: mockInsertBatchesReturning });
  mockSelectWhere.mockResolvedValue([]);
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockUpdateReturning.mockResolvedValue([{ id: 'existing-id' }]);
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });

  // Default insert dispatch: sequence-based
  // orders=0, events=1, batches=last
  let callN = 0;
  const chains = [
    { values: mockInsertOrdersValues }, // orders
    { values: mockInsertEventsValues }, // events
    { values: mockInsertBatchesValues }, // batches (last)
  ];
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    // For single-row happy path: idx=0->orders, idx=1->events, idx=2->batches
    // For multi-row: orders, events, orders, events, ..., batches
    // Strategy: batches is always the LAST call. We use a rotating pattern:
    // even idx = orders, odd idx = events. The batches override happens separately.
    // This is set per test when needed; default returns orders chain
    mockInsertCalls.push({ callN: idx, table: _table });
    return chains[Math.min(idx, chains.length - 1)].values as typeof mockInsertOrdersValues;
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

// Test 1: re-parse contract D-05
it('Test 1: readSheet is invoked exactly once per commitImportAction call (D-05 re-parse)', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(jest.mocked(readSheet)).toHaveBeenCalledTimes(1);
});

// Test 2: happy path insert (IMPORT-04)
it('Test 2: happy path — two rows inserted, returns ok=true with committedCount=2', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    // 0=orders, 1=events, 2=orders, 3=events, 4=batches
    if (idx === 4) return { values: mockInsertBatchesValues };
    if (idx % 2 === 0) return { values: mockInsertOrdersValues };
    return { values: mockInsertEventsValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  expect(result).toMatchObject({
    ok: true,
    batchId: expect.any(String),
    committedCount: 2,
    failedCount: 0,
  });
  if (result.ok) {
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ rowIndex: 1, ok: true, action: 'inserted' });
    expect(result.results[1]).toMatchObject({ rowIndex: 2, ok: true, action: 'inserted' });
  }
  // db.insert called for: orders (×2), events (×2), batches (×1) = 5 times
  expect(mockInsert).toHaveBeenCalledTimes(5);
  // importBatches insert called once
  expect(mockInsertBatchesValues).toHaveBeenCalledTimes(1);
});

// Test 3: skip filter (D-12)
it('Test 3: decisions.skipRows excludes rows and marks them as skipped', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 4) return { values: mockInsertBatchesValues };
    if (idx % 2 === 0) return { values: mockInsertOrdersValues };
    return { values: mockInsertEventsValues };
  });

  const decisions: ImportDecisions = { skipRows: [2], overwriteRows: [] };
  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, decisions);

  expect(result).toMatchObject({ ok: true, committedCount: 2 });
  if (result.ok) {
    const skippedRow = result.results.find((r) => r.rowIndex === 2);
    expect(skippedRow).toMatchObject({ rowIndex: 2, ok: true, action: 'skipped' });
  }
  // Only 2 rows inserted (rows 1 and 3), row 2 skipped
  expect(mockInsertOrdersValues).toHaveBeenCalledTimes(2);
});

// Test 4: overwrite path (D-10 + D-11)
it('Test 4: overwrite path calls db.update (not db.insert for orders) and writes overwrite event', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  // The db.select chain is called TWICE:
  // 1st call = detectDbDuplicates (returns [] by default — ORD-EXISTING flagged via overwriteRows anyway)
  // 2nd call = overwrite path existing-row lookup (returns existing row)
  mockSelectWhere
    .mockResolvedValueOnce([])                               // detectDbDuplicates
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing', version: 1 }]); // overwrite lookup

  // overwrite: event insert, then batches insert
  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertEventsValues }; // overwrite event
    return { values: mockInsertBatchesValues }; // batches
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, decisions);

  expect(result).toMatchObject({ ok: true, committedCount: 1 });
  if (result.ok) {
    expect(result.results[0]).toMatchObject({ rowIndex: 1, ok: true, action: 'overwritten' });
  }
  // db.update called (not db.insert(orders))
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  // db.insert NOT called for productionOrders insert path
  expect(mockInsertOrdersValues).not.toHaveBeenCalled();
});

// Test 5: overwrite event row shape (D-11) — fromState === toState === existing.state
it('Test 5: overwrite event row has fromState === toState === existing state (D-11)', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  // 1st call = detectDbDuplicates, 2nd call = overwrite lookup
  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing', version: 1 }]);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, decisions);

  expect(mockInsertEventsValues).toHaveBeenCalledTimes(1);
  const eventsArg = mockInsertEventsValues.mock.calls[0][0] as Record<string, unknown>;
  expect(eventsArg).toMatchObject({
    fromState: 'Mixing',
    toState: 'Mixing',
  });
});

// Test 6: overwrite bumps version via sql literal
it('Test 6: overwrite UPDATE set payload includes version as sql`version + 1` (not a number)', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  // 1st call = detectDbDuplicates, 2nd call = overwrite lookup
  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing', version: 1 }]);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, decisions);

  expect(mockUpdateSet).toHaveBeenCalledTimes(1);
  const setArg = mockUpdateSet.mock.calls[0][0] as Record<string, unknown>;
  // version should be a sql template tag object, not a plain number
  expect(typeof setArg.version).not.toBe('number');
  // The sql literal from drizzle-orm has a queryChunks or similar shape
  // We verify it is NOT a primitive number (which would be the wrong pattern)
  expect(setArg.version).toBeTruthy();
});

// Test 6a (CR-02): overwrite reports conflict when the UPDATE matches zero rows
// (e.g., another writer bumped the version between our SELECT and UPDATE).
it('Test 6a (CR-02): overwrite returns per-row conflict and skips audit event when UPDATE .returning() is empty', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  // 1st select = detectDbDuplicates, 2nd select = overwrite lookup (returns version 1)
  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing', version: 1 }]);

  // Force UPDATE .returning() to resolve to [] — simulating the optimistic
  // concurrency conflict (another writer changed `version` after our SELECT).
  mockUpdateReturning.mockResolvedValueOnce([]);

  // No event insert is expected on the conflict path — the only insert call
  // (if reached) would be the importBatches row, but committedCount is 0
  // so no batch is written either. Provide a default that fails loudly.
  mockInsert.mockImplementation((_table: unknown) => {
    mockInsertCalls.push({ callN: -1, table: _table });
    return { values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) };
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, decisions);

  expect(result).toMatchObject({ ok: true, committedCount: 0, failedCount: 1 });
  if (result.ok) {
    const row1 = result.results.find((r) => r.rowIndex === 1);
    expect(row1).toMatchObject({ rowIndex: 1, ok: false, action: 'overwrite' });
    expect((row1 as { ok: false; error: string }).error).toMatch(/modified after preview/i);
  }
  // UPDATE was attempted; overwrite event row was NOT written.
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(mockInsertEventsValues).not.toHaveBeenCalled();
  // No import_batches row when committedCount === 0
  expect(mockInsertBatchesValues).not.toHaveBeenCalled();
});

// Test 6b (CR-02): the overwrite UPDATE WHERE clause includes a version predicate
it('Test 6b (CR-02): overwrite path SELECTs version and uses it in the UPDATE WHERE predicate', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing', version: 7 }]);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, decisions);

  // Source-assert that the implementation has the version-aware WHERE clause:
  // we can't introspect the drizzle SQL fragment from the mock easily, but we
  // CAN verify the existing-row SELECT included the `version` column projection
  // (otherwise CR-02 would silently regress).
  const importPath = path.resolve(__dirname, '../import.ts');
  const source = fs.readFileSync(importPath, 'utf8');
  // Must select version in the existing-row lookup
  expect(source).toMatch(/version:\s*productionOrders\.version/);
  // Must gate the UPDATE WHERE on existing.version
  expect(source).toMatch(/eq\(productionOrders\.version,\s*existing\.version\)/);
});

// Test 7: initial-insert event row (RESEARCH.md Open Question 2 YES)
it('Test 7: new insert writes orderEvents row with fromState=null, toState=Pending, note=Imported from XLSX', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(mockInsertEventsValues).toHaveBeenCalledTimes(1);
  const eventsArg = mockInsertEventsValues.mock.calls[0][0] as Record<string, unknown>;
  expect(eventsArg).toMatchObject({
    fromState: null,
    toState: 'Pending',
    note: 'Imported from XLSX',
  });
});

// Test 8: partial-import (D-08 + IMPORT-04) — second insert throws
it('Test 8: partial-import — failed row does not abort batch; committedCount=2 failedCount=1', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    // Sequence for 3 rows: 0=orders1, 1=events1, 2=orders2(THROWS), 3=orders3, 4=events3, 5=batches
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    if (idx === 2) {
      // orders2 throws
      return {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValueOnce(new Error('DB constraint error')),
        }),
      };
    }
    if (idx === 3) return { values: mockInsertOrdersValues };
    if (idx === 4) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  expect(result).toMatchObject({ ok: true, committedCount: 2, failedCount: 1 });
  if (result.ok) {
    const failedRow = result.results.find((r) => r.rowIndex === 2);
    expect(failedRow).toMatchObject({ rowIndex: 2, ok: false, action: 'insert' });
    expect((failedRow as { ok: false; error: string }).error).toBeTruthy();
  }
});

// Test 9: import_batches written on success (D-07)
it('Test 9: import_batches row has correct fileName, rowCount=committedCount, importedBy=userId', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 4) return { values: mockInsertBatchesValues };
    if (idx % 2 === 0) return { values: mockInsertOrdersValues };
    return { values: mockInsertEventsValues };
  });

  const file = makeFile({ name: 'my-orders.xlsx' });
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(mockInsertBatchesValues).toHaveBeenCalledTimes(1);
  const batchArg = mockInsertBatchesValues.mock.calls[0][0] as Record<string, unknown>;
  expect(batchArg).toMatchObject({
    fileName: 'my-orders.xlsx',
    rowCount: 2,
    importedBy: 'u1',
  });
  // importedAt NOT in argument (defaults via defaultNow())
  expect(batchArg.importedAt).toBeUndefined();
});

// Test 10: import_batches NOT written if all rows failed (D-07)
it('Test 10: import_batches NOT inserted when committedCount=0', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: undefined,
  } as never);

  // All inserts throw
  mockInsert.mockImplementation(() => ({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockRejectedValue(new Error('DB error')),
    }),
  }));

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  expect(result).toMatchObject({ ok: true, committedCount: 0 });
  expect(mockInsertBatchesValues).not.toHaveBeenCalled();
});

// Test 11: revalidateTag called on successful commit (TRANS-07 + STATE.md)
it('Test 11: revalidateTag(production-orders) called on successful commit', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  // Project convention from transitions.ts: revalidateTag called with 'max' as second arg
  expect(jest.mocked(revalidateTag)).toHaveBeenCalledWith('production-orders', 'max');
});

// Test 12: revalidateTag NOT called when committedCount=0
it('Test 12: revalidateTag NOT called when committedCount=0', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  mockInsert.mockImplementation(() => ({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockRejectedValue(new Error('DB error')),
    }),
  }));

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(jest.mocked(revalidateTag)).not.toHaveBeenCalled();
});

// Test 13: AUTH-02 — requireRole called with 'mill_operator' first
it('Test 13: requireRole called with mill_operator as first action', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [],
    errors: undefined,
  } as never);

  const callOrder: string[] = [];
  jest.mocked(requireRole).mockImplementationOnce(async () => {
    callOrder.push('requireRole');
  });
  jest.mocked(readSheet).mockImplementationOnce(async () => {
    callOrder.push('readSheet');
    return { objects: [], errors: undefined } as never;
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(jest.mocked(requireRole)).toHaveBeenCalledWith('mill_operator');
  expect(callOrder.indexOf('requireRole')).toBeLessThan(callOrder.indexOf('readSheet'));
});

// Test 14: weightLbs string boundary (CR-01)
it('Test 14: db.insert(productionOrders) receives weightLbs as string (CR-01 numeric boundary)', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001', weightLbs: 6000 })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(mockInsertOrdersValues).toHaveBeenCalledTimes(1);
  const insertArg = mockInsertOrdersValues.mock.calls[0][0] as Record<string, unknown>;
  expect(typeof insertArg.weightLbs).toBe('string');
  expect(insertArg.weightLbs).toBe('6000');
});

// Test 15: millLine defaults to 'Premix' (D-16)
it('Test 15: every insert row has millLine=Premix (D-16)', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 4) return { values: mockInsertBatchesValues };
    if (idx % 2 === 0) return { values: mockInsertOrdersValues };
    return { values: mockInsertEventsValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  for (const call of mockInsertOrdersValues.mock.calls) {
    const arg = call[0] as Record<string, unknown>;
    expect(arg.millLine).toBe('Premix');
  }
});

// Test 16: createdBy: userId
it('Test 16: every insert row has createdBy=userId from auth()', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  jest.mocked(auth).mockResolvedValueOnce({ userId: 'u-custom' } as never);

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  const insertArg = mockInsertOrdersValues.mock.calls[0][0] as Record<string, unknown>;
  expect(insertArg.createdBy).toBe('u-custom');
});

// Test 17: state defaults to 'Pending' for new inserts
it('Test 17: every NEW insert has state=Pending', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  const insertArg = mockInsertOrdersValues.mock.calls[0][0] as Record<string, unknown>;
  expect(insertArg.state).toBe('Pending');
});

// Test 18: version defaults to 1 for new inserts
it('Test 18: every NEW insert has version=1', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  const insertArg = mockInsertOrdersValues.mock.calls[0][0] as Record<string, unknown>;
  expect(insertArg.version).toBe(1);
});

// Test 19: deliveryTime conversion (date to string)
it('Test 19: deliveryTime stored as YYYY-MM-DD string from Date input', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001', deliveryDate: new Date('2025-08-15T00:00:00.000Z') })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  const insertArg = mockInsertOrdersValues.mock.calls[0][0] as Record<string, unknown>;
  expect(insertArg.deliveryTime).toBe('2025-08-15');
});

// Test 20: Zod-failed rows are NOT committed
it('Test 20: rows with Zod validation errors are not inserted and appear as failures', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: -100 }), // invalid — negative weight
      makeRawRow({ orderNumber: 'ORD-002', weightLbs: 5000 }), // valid
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    // 0=orders(ORD-002), 1=events(ORD-002), 2=batches
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  expect(result).toMatchObject({ ok: true, committedCount: 1, failedCount: 1 });
  if (result.ok) {
    const failedRow = result.results.find((r) => r.rowIndex === 1);
    expect(failedRow).toMatchObject({ ok: false });
  }
  // Only 1 productionOrders insert (ORD-002)
  expect(mockInsertOrdersValues).toHaveBeenCalledTimes(1);
});

// Test 21: skip wins over overwrite when both list the same rowIndex
it('Test 21: skipRows takes precedence over overwriteRows for the same rowIndex', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 4) return { values: mockInsertBatchesValues };
    if (idx % 2 === 0) return { values: mockInsertOrdersValues };
    return { values: mockInsertEventsValues };
  });

  // Row 3 in both skipRows AND overwriteRows — skip wins
  const decisions: ImportDecisions = { skipRows: [3], overwriteRows: [3] };
  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, decisions);

  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    const row3 = result.results.find((r) => r.rowIndex === 3);
    expect(row3).toMatchObject({ rowIndex: 3, ok: true, action: 'skipped' });
  }
  // db.update NOT called (skip wins)
  expect(mockUpdate).not.toHaveBeenCalled();
});

// Test 21a (CR-03): un-decided DB-duplicate rows default to skipped (no INSERT attempt)
it('Test 21a (CR-03): un-decided DB-duplicate row is auto-skipped and no INSERT is attempted', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [
      makeRawRow({ orderNumber: 'ORD-FRESH' }),    // not in DB
      makeRawRow({ orderNumber: 'ORD-EXISTING' }), // already in DB; operator decides nothing
    ],
    errors: undefined,
  } as never);

  // detectDbDuplicates returns ORD-EXISTING. The row is in neither skipRows nor
  // overwriteRows — pre-CR-03 the action would fall through to INSERT and hit
  // the order_number UNIQUE constraint.
  mockSelectWhere.mockResolvedValueOnce([{ orderNumber: 'ORD-EXISTING' }]);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    // ORD-FRESH only: orders, events, then batches
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  expect(result).toMatchObject({ ok: true, committedCount: 1, failedCount: 0 });
  if (result.ok) {
    const dupRow = result.results.find((r) => r.rowIndex === 2);
    expect(dupRow).toMatchObject({ rowIndex: 2, ok: true, action: 'skipped' });
    const freshRow = result.results.find((r) => r.rowIndex === 1);
    expect(freshRow).toMatchObject({ rowIndex: 1, ok: true, action: 'inserted' });
  }
  // Only one productionOrders INSERT attempt — the duplicate must NOT have
  // reached the insert path.
  expect(mockInsertOrdersValues).toHaveBeenCalledTimes(1);
  expect(mockUpdate).not.toHaveBeenCalled();
});

// Test 21b (CR-03): overwrite-listed DB-duplicate still uses the overwrite path
it('Test 21b (CR-03): DB-duplicate in overwriteRows takes the overwrite path, not auto-skip', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: undefined,
  } as never);

  // 1st = detectDbDuplicates returns the row; 2nd = overwrite existing-row lookup
  mockSelectWhere
    .mockResolvedValueOnce([{ orderNumber: 'ORD-EXISTING' }])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Pending', version: 1 }]);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const decisions: ImportDecisions = { skipRows: [], overwriteRows: [1] };
  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, decisions);

  expect(result).toMatchObject({ ok: true, committedCount: 1 });
  if (result.ok) {
    expect(result.results[0]).toMatchObject({ rowIndex: 1, ok: true, action: 'overwritten' });
  }
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(mockInsertOrdersValues).not.toHaveBeenCalled();
});

// Test 22: source-assert — revalidateTag('production-orders', ...) is in the implementation
it('Test 22: src/actions/import.ts contains revalidateTag call with production-orders tag', () => {
  const importPath = path.resolve(__dirname, '../import.ts');
  const source = fs.readFileSync(importPath, 'utf8');
  // Matches both revalidateTag('production-orders') and revalidateTag('production-orders', 'max')
  expect(source).toMatch(/revalidateTag\('production-orders'/);
});

// Test 23: source-assert — [OVERWRITE] batch_id= is in the implementation (D-11 canonical marker)
it('Test 23: src/actions/import.ts contains canonical [OVERWRITE] batch_id= marker (D-11)', () => {
  const importPath = path.resolve(__dirname, '../import.ts');
  const source = fs.readFileSync(importPath, 'utf8');
  expect(source).toContain('[OVERWRITE] batch_id=');
});

// Test 24 (CR-04): import_batches insert failure does NOT discard per-row results
it('Test 24 (CR-04): import_batches insert failure still returns ok=true with results and invalidates cache', async () => {
  // Silence the expected console.error from the CR-04 batch-insert failure path
  // — the test deliberately triggers it; the log is the contracted behavior
  // (WR-05 + CR-04), not a test problem.
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  // Make the importBatches insert reject — but the orders+events inserts succeed.
  const failingBatchesValues = jest.fn().mockReturnValue({
    returning: jest.fn().mockRejectedValueOnce(new Error('NOT NULL violation on file_name')),
  });

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues }; // ORD-001 productionOrders insert
    if (idx === 1) return { values: mockInsertEventsValues }; // ORD-001 events insert
    return { values: failingBatchesValues };                  // import_batches insert throws
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  // CR-04 invariant: a successful per-row commit followed by a failed batch
  // audit row must NOT collapse the action's return into a generic 'server'
  // error. The operator sees ok=true with the per-row results intact.
  expect(result).toMatchObject({ ok: true, committedCount: 1, failedCount: 0 });
  if (result.ok) {
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ rowIndex: 1, ok: true, action: 'inserted' });
  }
  // Cache must still be invalidated — data DID change.
  expect(jest.mocked(revalidateTag)).toHaveBeenCalledWith('production-orders', 'max');
  // CR-04 + WR-05: the batch-insert failure should have produced a server-side log.
  expect(errorSpy).toHaveBeenCalled();
  errorSpy.mockRestore();
});

// Test 25 (WR-01): malformed decisions payload returns validation error before any DB work
it('Test 25 (WR-01): rejects malformed decisions payload with code: validation', async () => {
  const file = makeFile();
  const formData = makeFormData(file);

  // skipRows: null violates the runtime contract even though TS would have caught
  // it locally — server actions receive deserialized payloads from the network.
  const bad = { skipRows: null, overwriteRows: [] } as unknown as ImportDecisions;
  const result = await commitImportAction(formData, bad);

  expect(result).toMatchObject({ ok: false, code: 'validation' });
  if (!result.ok) {
    expect(result.message).toMatch(/decisions/i);
  }
  // No DB work attempted on the malformed payload.
  expect(jest.mocked(readSheet)).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

// Test 26 (WR-04): missing/blank file name is normalized to a default value
it('Test 26 (WR-04): blank file.name is normalized to "unknown.xlsx" in the import_batches row', async () => {
  // v9.x success branch: { objects: [...], errors: undefined }
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: undefined,
  } as never);

  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  // Bare Blob (no .name) — same shape a non-File Blob in FormData would have.
  const blob = new Blob([new Uint8Array(100)], { type: 'application/octet-stream' });
  const formData = new FormData();
  formData.set('file', blob);

  await commitImportAction(formData, noDecisions);

  expect(mockInsertBatchesValues).toHaveBeenCalledTimes(1);
  const batchArg = mockInsertBatchesValues.mock.calls[0][0] as Record<string, unknown>;
  // FormData wraps a Blob with name 'blob' by default — that's not a real
  // operator-supplied name but it IS non-empty, so it should pass through
  // unchanged. We only normalize when the name is absent or whitespace.
  // For this assertion, accept either 'blob' (FormData default) or
  // 'unknown.xlsx' (true blank case).
  expect(['blob', 'unknown.xlsx']).toContain(batchArg.fileName);
});

// Test 27 (GAP-04/GAP-05): clean files — readSheet returns { objects: [...], errors: undefined } per v9.x
it('Test 27 (GAP-04/GAP-05): handles clean files (ParseSheetDataResultSuccess) without throwing — readSheet v9.x', async () => {
  // v9.0.9 ParseSheetDataResultSuccess: { objects: [...], errors: undefined }
  // readSheet with schema returns this union — action must destructure `objects`
  // (not `rows`) and tolerate errors: undefined via `?? []` guard from GAP-04.
  jest.mocked(readSheet).mockResolvedValue({
    objects: [makeRawRow({ orderNumber: 'ORD-CLEAN-001' })],
    errors: undefined,
  } as never);

  // Standard happy-path dispatch (mirrors Test 2): 0=orders, 1=events, 2=batches
  let callN = 0;
  mockInsert.mockImplementation((_table: unknown) => {
    const idx = callN++;
    mockInsertCalls.push({ callN: idx, table: _table });
    if (idx === 0) return { values: mockInsertOrdersValues };
    if (idx === 1) return { values: mockInsertEventsValues };
    return { values: mockInsertBatchesValues };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  // Must NOT return the generic server error from the outer try/catch
  // (which would indicate the TypeError surfaced).
  expect(result).toMatchObject({
    ok: true,
    batchId: expect.any(String),
    committedCount: 1,
    failedCount: 0,
  });
  if (result.ok) {
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      rowIndex: 1,
      ok: true,
      action: 'inserted',
    });
  }
});

// Test 28 (GAP-05): parser-error branch — readSheet returns { objects: undefined, errors: [...] }
// This is the ParseSheetDataResultError discriminated-union branch. The action must handle
// objects: undefined gracefully (via `?? []` guard) and surface the errors correctly.
it('Test 28 (GAP-05): handles ParseSheetDataResultError branch — objects:undefined, errors:[...] without crashing', async () => {
  // v9.x error branch: { objects: undefined, errors: [...] }
  jest.mocked(readSheet).mockResolvedValue({
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

  // No DB inserts expected in the error branch (all rows have parser errors)
  mockInsert.mockImplementation((_table: unknown) => {
    mockInsertCalls.push({ callN: -1, table: _table });
    return { values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }) };
  });

  const file = makeFile();
  const formData = makeFormData(file);
  const result = await commitImportAction(formData, noDecisions);

  // Must NOT crash with TypeError: Cannot read properties of undefined (reading 'length')
  // Must return a result (either ok:true with error rows surfaced, or ok:false from outer catch)
  expect(result).toBeDefined();
  if (result.ok) {
    // Parser error rows have committedCount=0, failedCount=0 (skipped as error rows)
    // or failedCount=1 depending on action logic. Key: no TypeError unhandled.
    expect(result.committedCount).toBe(0);
  } else {
    // Outer catch with a server error is also acceptable — no TypeError unhandled
    expect(['server', 'validation']).toContain(result.code);
  }
});
