/**
 * Contract tests for src/actions/transitions.ts (Plan 33-04, TDD RED phase)
 *
 * Covers TRANS-01 through TRANS-07:
 *   TRANS-01 — transitionToMixing (Pending → Mixing)
 *   TRANS-02 — completeOrder (Mixing → Completed)
 *   TRANS-03 — blockOrder (Pending|Mixing → Blocked, reason REQUIRED)
 *   TRANS-04 — resumeFromBlocked (Blocked → Mixing|Pending)
 *   TRANS-05 — every transition writes one order_events row
 *   TRANS-06 — optimistic concurrency: zero rows → locked conflict message
 *   TRANS-07 — revalidateTag('production-orders') called on success
 *
 * Source-assert tests verify structural invariants that must hold in the
 * implementation (line 1 = 'use server';, requireRole x4, revalidateTag x4,
 * no rowsAffected, TransitionResult export).
 *
 * Mock topology (Pattern 3 — mock-prefixed hoisted helpers per Jest docs):
 *   Each db builder method is a separate `const mockX = jest.fn()` so that
 *   babel-jest can hoist the declaration above `jest.mock(...)`. The
 *   `const mockDb = { ... }` form with jest.fn() calls in an object literal
 *   is NOT pure and cannot be hoisted — individual declarations ARE hoisted.
 */
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — Pattern 3: individual mock-prefixed jest.fn() declarations
// These are hoisted above jest.mock() by babel-jest because each initializer
// is `jest.fn()` which babel recognises as an allowed pure expression.
// ─────────────────────────────────────────────────────────────────────────────

// Drizzle db builder chain mocks
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockUpdate = jest.fn();
const mockSet = jest.fn();
const mockReturning = jest.fn();
const mockInsert = jest.fn();
const mockValues = jest.fn();

jest.mock('@/db', () => ({
  // Lazy wrappers: access mock* variables at call-time (after module init),
  // not at factory-run time (which is hoisted before const mock* = jest.fn()).
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    where: (...args: unknown[]) => mockWhere(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    set: (...args: unknown[]) => mockSet(...args),
    returning: (...args: unknown[]) => mockReturning(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    values: (...args: unknown[]) => mockValues(...args),
  },
}));

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
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports (after mocks)
// ─────────────────────────────────────────────────────────────────────────────
import {
  transitionToMixing,
  completeOrder,
  blockOrder,
  resumeFromBlocked,
} from '../transitions';
import { db } from '@/db';
import { requireRole } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: configure the db mock chain for a given scenario
// ─────────────────────────────────────────────────────────────────────────────
function setupDbMocks({
  orderState = 'Pending',
  orderId = 'order-1',
  version = 1,
  returningResult = [{ id: 'order-1' }] as { id: string }[],
}: {
  orderState?: string;
  orderId?: string;
  version?: number;
  returningResult?: { id: string }[];
} = {}) {
  // select chain: select().from().where() → row
  // db is the mocked object; return it from each builder so chaining works
  mockSelect.mockReturnValue(db);
  mockFrom.mockReturnValue(db);
  mockReturning.mockResolvedValue(returningResult);

  // update chain: update().set().where().returning() → result
  mockUpdate.mockReturnValue(db);
  mockSet.mockReturnValue(db);

  // where is called twice:
  //   1st call: state guard SELECT (resolves to the order row)
  //   2nd call: optimistic UPDATE where clause (returns db for .returning())
  let whereCallCount = 0;
  mockWhere.mockImplementation(() => {
    whereCallCount++;
    if (whereCallCount === 1) {
      // First where call: state guard SELECT
      return Promise.resolve([{ state: orderState, id: orderId, version }]);
    }
    // Second where call: optimistic UPDATE where clause → returns db for .returning()
    return db;
  });

  // insert chain: insert().values() → []
  mockInsert.mockReturnValue(db);
  mockValues.mockResolvedValue([]);
}

beforeEach(() => {
  jest.resetAllMocks();
  (requireRole as jest.Mock).mockResolvedValue(undefined);
  const { auth } = require('@clerk/nextjs/server');
  (auth as jest.Mock).mockResolvedValue({ userId: 'u1' });
  (revalidateTag as jest.Mock).mockReturnValue(undefined);
  // Default setup for all tests
  setupDbMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// describe('transitionToMixing') — TRANS-01
// ─────────────────────────────────────────────────────────────────────────────
describe('transitionToMixing', () => {
  it('A1 (TRANS-01 happy): returns { ok: true } when order state is Pending', async () => {
    setupDbMocks({ orderState: 'Pending' });
    const result = await transitionToMixing('order-1', 1);
    expect(result).toEqual({ ok: true });
  });

  it('A2 (TRANS-01 from-state guard): returns validation error when order state is Mixing', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    const result = await transitionToMixing('order-1', 1);
    expect(result).toMatchObject({ ok: false, code: 'validation' });
    expect((result as { message: string }).message).toContain('Cannot transition from Mixing');
  });

  it('A3 (TRANS-01 from-state guard): returns validation error when order state is Completed', async () => {
    setupDbMocks({ orderState: 'Completed' });
    const result = await transitionToMixing('order-1', 1);
    expect(result).toMatchObject({ ok: false, code: 'validation' });
  });

  it('A4 (not-found): returns not_found when no order row exists', async () => {
    mockSelect.mockReturnValue(db);
    mockFrom.mockReturnValue(db);
    mockWhere.mockResolvedValue([]);
    const result = await transitionToMixing('nonexistent', 1);
    expect(result).toMatchObject({ ok: false, code: 'not_found' });
  });

  it('A5 (TRANS-06 conflict + locked message): returns conflict with exact locked message on stale version', async () => {
    setupDbMocks({ returningResult: [] });
    const result = await transitionToMixing('order-1', 1);
    expect(result).toEqual({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });
  });

  it('A6 (TRANS-05 audit trail): calls db.insert(orderEvents) with correct fromState/toState/changedBy', async () => {
    setupDbMocks({ orderState: 'Pending', orderId: 'order-1' });
    await transitionToMixing('order-1', 1);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        fromState: 'Pending',
        toState: 'Mixing',
        changedBy: 'u1',
      })
    );
  });

  it('A7 (TRANS-07 cache invalidation): calls revalidateTag("production-orders") on success', async () => {
    setupDbMocks({ orderState: 'Pending' });
    await transitionToMixing('order-1', 1);
    expect(revalidateTag).toHaveBeenCalledWith('production-orders', 'max');
  });

  it('A8 (AUTH-02): calls requireRole("mill_operator") before any DB I/O', async () => {
    setupDbMocks({ orderState: 'Pending' });
    await transitionToMixing('order-1', 1);
    // Verify requireRole was called with 'mill_operator'
    expect(requireRole).toHaveBeenCalledWith('mill_operator');
    // Verify requireRole was invoked before db.select (call order check)
    const requireRoleCallOrder = (requireRole as jest.Mock).mock.invocationCallOrder[0];
    const dbSelectCallOrder = mockSelect.mock.invocationCallOrder[0];
    expect(requireRoleCallOrder).toBeLessThan(dbSelectCallOrder);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// describe('completeOrder') — TRANS-02
// ─────────────────────────────────────────────────────────────────────────────
describe('completeOrder', () => {
  it('B1 (TRANS-02 happy): returns { ok: true } when order state is Mixing', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    const result = await completeOrder('order-1', 1);
    expect(result).toEqual({ ok: true });
  });

  it('B2 (from-state guard): returns validation error when order state is Pending', async () => {
    setupDbMocks({ orderState: 'Pending' });
    const result = await completeOrder('order-1', 1);
    expect(result).toMatchObject({ ok: false, code: 'validation' });
  });

  it('B3 (conflict path): returns conflict with locked message on stale version', async () => {
    setupDbMocks({ orderState: 'Mixing', returningResult: [] });
    const result = await completeOrder('order-1', 1);
    expect(result).toEqual({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });
  });

  it('B4 (TRANS-05 audit trail): insert call has fromState: "Mixing", toState: "Completed"', async () => {
    setupDbMocks({ orderState: 'Mixing', orderId: 'order-1' });
    await completeOrder('order-1', 1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'Mixing',
        toState: 'Completed',
      })
    );
  });

  it('B5 (TRANS-07): calls revalidateTag("production-orders") on success', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    await completeOrder('order-1', 1);
    expect(revalidateTag).toHaveBeenCalledWith('production-orders', 'max');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// describe('blockOrder') — TRANS-03
// ─────────────────────────────────────────────────────────────────────────────
describe('blockOrder', () => {
  it('C1 (TRANS-03 happy from Pending): returns { ok: true } with reason "needs ingredient"', async () => {
    setupDbMocks({ orderState: 'Pending' });
    const result = await blockOrder('order-1', 1, 'needs ingredient');
    expect(result).toEqual({ ok: true });
  });

  it('C2 (TRANS-03 happy from Mixing): returns { ok: true } with reason "equipment failure"', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    const result = await blockOrder('order-1', 1, 'equipment failure');
    expect(result).toEqual({ ok: true });
  });

  it('C3 (from-state guard): returns validation error when order state is Completed (terminal)', async () => {
    setupDbMocks({ orderState: 'Completed' });
    const result = await blockOrder('order-1', 1, 'reason');
    expect(result).toMatchObject({ ok: false, code: 'validation' });
  });

  it('C4 (from-state guard): returns validation error when order state is Blocked (already blocked)', async () => {
    setupDbMocks({ orderState: 'Blocked' });
    const result = await blockOrder('order-1', 1, 'reason');
    expect(result).toMatchObject({ ok: false, code: 'validation' });
  });

  it('C5 (TRANS-03 reason captured as note): insert values contains note equal to reason argument', async () => {
    setupDbMocks({ orderState: 'Mixing', orderId: 'order-1' });
    await blockOrder('order-1', 1, 'equipment failure');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        note: 'equipment failure',
      })
    );
  });

  it('C6 (TRANS-03 reason required at TS level): signature has reason: string (no ? optional marker)', () => {
    // Source-assert: read the actual implementation file and verify the signature
    const transitionsPath = path.join(__dirname, '..', 'transitions.ts');
    // This test will fail until the implementation file exists (RED)
    expect(() => fs.readFileSync(transitionsPath, 'utf-8')).not.toThrow();
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    // The blockOrder signature must have `reason: string` without a `?`
    // Matches: `reason: string` but NOT `reason?: string`
    expect(source).toMatch(/blockOrder\s*\([^)]*reason:\s*string[^?]/);
  });

  it('C7 (conflict path): returns conflict with locked message on stale version', async () => {
    setupDbMocks({ orderState: 'Pending', returningResult: [] });
    const result = await blockOrder('order-1', 1, 'some reason');
    expect(result).toEqual({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });
  });

  it('C8 (TRANS-07): calls revalidateTag("production-orders") on success', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    await blockOrder('order-1', 1, 'reason');
    expect(revalidateTag).toHaveBeenCalledWith('production-orders', 'max');
  });

  it('C9 (WR-03 empty reason): returns validation error and performs no DB writes when reason is ""', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    const result = await blockOrder('order-1', 1, '');
    expect(result).toMatchObject({ ok: false, code: 'validation' });
    expect((result as { message: string }).message).toMatch(/non-empty reason/i);
    // No DB writes: state-guard SELECT, optimistic UPDATE, and audit INSERT all skipped
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('C10 (WR-03 whitespace-only reason): returns validation error and performs no DB writes', async () => {
    setupDbMocks({ orderState: 'Mixing' });
    const result = await blockOrder('order-1', 1, '   ');
    expect(result).toMatchObject({ ok: false, code: 'validation' });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// describe('resumeFromBlocked') — TRANS-04
// ─────────────────────────────────────────────────────────────────────────────
describe('resumeFromBlocked', () => {
  it('D1 (TRANS-04 happy Blocked → Mixing): returns { ok: true } with toState "Mixing"', async () => {
    setupDbMocks({ orderState: 'Blocked' });
    const result = await resumeFromBlocked('order-1', 1, 'Mixing');
    expect(result).toEqual({ ok: true });
  });

  it('D2 (TRANS-04 happy Blocked → Pending): returns { ok: true } with toState "Pending"', async () => {
    setupDbMocks({ orderState: 'Blocked' });
    const result = await resumeFromBlocked('order-1', 1, 'Pending');
    expect(result).toEqual({ ok: true });
  });

  it('D3 (from-state guard): returns validation error when order state is Pending', async () => {
    setupDbMocks({ orderState: 'Pending' });
    const result = await resumeFromBlocked('order-1', 1, 'Mixing');
    expect(result).toMatchObject({ ok: false, code: 'validation' });
  });

  it('D4 (TRANS-05 audit trail Blocked → Mixing): insert has fromState: "Blocked", toState: "Mixing"', async () => {
    setupDbMocks({ orderState: 'Blocked', orderId: 'order-1' });
    await resumeFromBlocked('order-1', 1, 'Mixing');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'Blocked',
        toState: 'Mixing',
      })
    );
  });

  it('D5 (TRANS-05 audit trail Blocked → Pending): insert has fromState: "Blocked", toState: "Pending"', async () => {
    setupDbMocks({ orderState: 'Blocked', orderId: 'order-1' });
    await resumeFromBlocked('order-1', 1, 'Pending');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fromState: 'Blocked',
        toState: 'Pending',
      })
    );
  });

  it('D6 (conflict path): returns conflict with locked message on stale version', async () => {
    setupDbMocks({ orderState: 'Blocked', returningResult: [] });
    const result = await resumeFromBlocked('order-1', 1, 'Mixing');
    expect(result).toEqual({
      ok: false,
      code: 'conflict',
      message: 'Order was modified by another user. Please refresh.',
    });
  });

  it('D7 (TRANS-07): calls revalidateTag("production-orders") on success', async () => {
    setupDbMocks({ orderState: 'Blocked' });
    await resumeFromBlocked('order-1', 1, 'Mixing');
    expect(revalidateTag).toHaveBeenCalledWith('production-orders', 'max');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-assert tests (file-level structural invariants)
// ─────────────────────────────────────────────────────────────────────────────
describe('source-assert: transitions.ts structural invariants', () => {
  const transitionsPath = path.join(__dirname, '..', 'transitions.ts');

  it('S1: line 1 of transitions.ts is exactly "\'use server\';"', () => {
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    const firstLine = source.split('\n')[0];
    expect(firstLine).toBe("'use server';");
  });

  it('S2: file contains "await requireRole(\'mill_operator\')" at least 4 times', () => {
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    const matches = source.match(/await requireRole\('mill_operator'\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it('S3: file contains revalidateTag(\'production-orders\', ...) at least 4 times', () => {
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    // Match revalidateTag('production-orders' with optional second argument
    const matches = source.match(/revalidateTag\('production-orders'/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it('S4: file does NOT contain "rowsAffected" (Pitfall 1: neon-http has no rowsAffected)', () => {
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    expect(source).not.toContain('rowsAffected');
  });

  it('S5: file exports "TransitionResult" as a type', () => {
    const source = fs.readFileSync(transitionsPath, 'utf-8');
    // Matches: export type TransitionResult
    expect(source).toMatch(/export\s+type\s+TransitionResult/);
  });
});
