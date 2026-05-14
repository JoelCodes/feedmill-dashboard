/**
 * Query contract tests for src/db/queries/orders.ts
 *
 * TDD RED phase: Tests are written before the implementation.
 * These tests will FAIL with module-not-found until Task 2 creates orders.ts.
 *
 * Covers:
 * - getProductionOrders: filter shapes (no filters, millLine, states, both)
 * - getProductionOrders: source-assert — tags: ['production-orders'] present in source
 * - getOrderById: returns order row when found
 * - getOrderById: returns null (not undefined) when not found
 * - getOrderById: source-assert — plain async function, NOT wrapped in unstable_cache
 */

// Stub next/cache so unstable_cache is the identity function.
// This lets us invoke the wrapped functions directly without Next.js caching internals.
jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: jest.fn(),
}));

// Chainable thenable mock for @/db:
// select → from → where → orderBy → resolved value
// For getOrderById: select → from → where → resolved value (returns array)
const mockOrderBy = jest.fn().mockResolvedValue([
  { id: 'order-1', orderNumber: 'ORD-001', state: 'Pending', millLine: 'Premix' },
]);
const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

import { promises as fs } from 'fs';
import path from 'path';
import { getProductionOrders, getOrderById } from '../orders';

describe('getProductionOrders', () => {
  beforeEach(() => {
    mockOrderBy.mockResolvedValue([
      { id: 'order-1', orderNumber: 'ORD-001', state: 'Pending', millLine: 'Premix' },
    ]);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  });

  it('Test 1: resolves to an array when called with no arguments', async () => {
    const result = await getProductionOrders();
    expect(Array.isArray(result)).toBe(true);
  });

  it('Test 2: accepts { millLine: Premix } filter without throwing', async () => {
    await expect(getProductionOrders({ millLine: 'Premix' })).resolves.toBeDefined();
  });

  it('Test 3: accepts { states: [Pending, Mixing] } filter without throwing', async () => {
    await expect(getProductionOrders({ states: ['Pending', 'Mixing'] })).resolves.toBeDefined();
  });

  it('Test 4: accepts both millLine and states filters without throwing', async () => {
    await expect(
      getProductionOrders({ millLine: 'Excel', states: ['Pending', 'Blocked'] })
    ).resolves.toBeDefined();
  });

  it("Test 5 (source-assert): orders.ts contains tags: ['production-orders']", async () => {
    const filePath = path.resolve(__dirname, '..', 'orders.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain("tags: ['production-orders']");
  });
});

describe('getOrderById', () => {
  beforeEach(() => {
    // Reset mock to default (returns one row = order found)
    mockWhere.mockResolvedValue([
      { id: 'order-1', orderNumber: 'ORD-001', state: 'Pending', millLine: 'Premix' },
    ]);
  });

  it('Test 6: returns the order object when row is found', async () => {
    const order = { id: 'order-1', orderNumber: 'ORD-001', state: 'Pending', millLine: 'Premix' };
    mockWhere.mockResolvedValueOnce([order]);
    const result = await getOrderById('order-1');
    expect(result).toEqual(order);
  });

  it('Test 7: returns null (not undefined) when no row found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const result = await getOrderById('nonexistent-id');
    expect(result).toStrictEqual(null);
  });

  it('Test 8 (source-assert): getOrderById is a plain async function NOT wrapped in unstable_cache', async () => {
    const filePath = path.resolve(__dirname, '..', 'orders.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    // Must export as plain async function — no unstable_cache wrapping
    expect(content).toMatch(/export async function getOrderById/);
    // Must NOT be assigned to unstable_cache call
    // (i.e., there should not be "unstable_cache" appearing near "getOrderById")
    const lines = content.split('\n');
    const getOrderByIdLines = lines.filter(l => l.includes('getOrderById'));
    const cachedGetOrderById = getOrderByIdLines.some(l => l.includes('unstable_cache'));
    expect(cachedGetOrderById).toBe(false);
  });
});
