/**
 * Contract tests for commitImportAction (plan 33-06).
 *
 * TDD: RED phase — commitImportAction does not yet exist in src/actions/import.ts.
 * All tests fail at "commitImportAction is not a function" or similar.
 *
 * Mock topology:
 * - @/lib/auth: requireRole is a no-op by default
 * - @clerk/nextjs/server: auth returns { userId: 'u1' }
 * - next/cache: revalidateTag is a spy; asserted called on success
 * - next/navigation: redirect is a spy
 * - @/db: chainable mock; select->from->where returns [] by default;
 *   extended with insert (per-table), update chains
 * - read-excel-file/node: default export is a spy; return value controlled per test
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

// read-excel-file/node mock
jest.mock('read-excel-file/node', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────
// Imports — after mocks
// ────────────────────────────────────────────────────────────────────────────

import { revalidateTag } from 'next/cache';
import readXlsxFile from 'read-excel-file/node';
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
it('Test 1: readXlsxFile is invoked exactly once per commitImportAction call (D-05 re-parse)', async () => {
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
  } as never);

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(jest.mocked(readXlsxFile)).toHaveBeenCalledTimes(1);
});

// Test 2: happy path insert (IMPORT-04)
it('Test 2: happy path — two rows inserted, returns ok=true with committedCount=2', async () => {
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: [],
  } as never);

  // The db.select chain is called TWICE:
  // 1st call = detectDbDuplicates (returns [] by default — ORD-EXISTING flagged via overwriteRows anyway)
  // 2nd call = overwrite path existing-row lookup (returns existing row)
  mockSelectWhere
    .mockResolvedValueOnce([])                               // detectDbDuplicates
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing' }]); // overwrite lookup

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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: [],
  } as never);

  // 1st call = detectDbDuplicates, 2nd call = overwrite lookup
  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing' }]);

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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-EXISTING' })],
    errors: [],
  } as never);

  // 1st call = detectDbDuplicates, 2nd call = overwrite lookup
  mockSelectWhere
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ id: 'existing-id', state: 'Mixing' }]);

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

// Test 7: initial-insert event row (RESEARCH.md Open Question 2 YES)
it('Test 7: new insert writes orderEvents row with fromState=null, toState=Pending, note=Imported from XLSX', async () => {
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [],
    errors: [],
  } as never);

  const callOrder: string[] = [];
  jest.mocked(requireRole).mockImplementationOnce(async () => {
    callOrder.push('requireRole');
  });
  jest.mocked(readXlsxFile).mockImplementationOnce(async () => {
    callOrder.push('readXlsxFile');
    return { rows: [], errors: [] } as never;
  });

  const file = makeFile();
  const formData = makeFormData(file);
  await commitImportAction(formData, noDecisions);

  expect(jest.mocked(requireRole)).toHaveBeenCalledWith('mill_operator');
  expect(callOrder.indexOf('requireRole')).toBeLessThan(callOrder.indexOf('readXlsxFile'));
});

// Test 14: weightLbs string boundary (CR-01)
it('Test 14: db.insert(productionOrders) receives weightLbs as string (CR-01 numeric boundary)', async () => {
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001', weightLbs: 6000 })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001' })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [makeRawRow({ orderNumber: 'ORD-001', deliveryDate: new Date('2025-08-15T00:00:00.000Z') })],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001', weightLbs: -100 }), // invalid — negative weight
      makeRawRow({ orderNumber: 'ORD-002', weightLbs: 5000 }), // valid
    ],
    errors: [],
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
  jest.mocked(readXlsxFile).mockResolvedValue({
    rows: [
      makeRawRow({ orderNumber: 'ORD-001' }),
      makeRawRow({ orderNumber: 'ORD-002' }),
      makeRawRow({ orderNumber: 'ORD-003' }),
    ],
    errors: [],
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
