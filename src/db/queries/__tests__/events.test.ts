/**
 * Query contract tests for src/db/queries/events.ts
 *
 * TDD RED phase: Tests are written before the implementation.
 * These tests will FAIL with module-not-found until Task 2 creates events.ts.
 *
 * Covers:
 * - getOrderEvents: resolves to an array for a given orderId
 * - getOrderEvents: source-assert — desc(orderEvents.changedAt) present (timeline ordering)
 * - getOrderEvents: source-assert — tags: ['production-orders'] present
 * - getOrderEvents: source-assert — does NOT contain requireRole (AUTH-03)
 */

// Stub next/cache so unstable_cache is the identity function.
jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: jest.fn(),
}));

// Chainable thenable mock for @/db:
// select → from → where → orderBy → resolved value
const mockOrderBy = jest.fn().mockResolvedValue([
  {
    id: 'event-1',
    orderId: 'order-1',
    fromState: 'Pending',
    toState: 'Mixing',
    changedBy: 'user-1',
    changedAt: new Date(),
    note: null,
  },
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
import { getOrderEvents } from '../events';

describe('getOrderEvents', () => {
  it('Test 1: resolves to an array for a given orderId', async () => {
    const result = await getOrderEvents('order-1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('Test 2 (source-assert): events.ts contains desc(orderEvents.changedAt)', async () => {
    const filePath = path.resolve(__dirname, '..', 'events.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('desc(orderEvents.changedAt)');
  });

  it("Test 3 (source-assert): events.ts contains tags: ['production-orders']", async () => {
    const filePath = path.resolve(__dirname, '..', 'events.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain("tags: ['production-orders']");
  });

  it('Test 4 (source-assert): events.ts does NOT contain requireRole (AUTH-03)', async () => {
    const filePath = path.resolve(__dirname, '..', 'events.ts');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).not.toContain('requireRole');
  });
});
