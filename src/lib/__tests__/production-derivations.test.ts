import {
  groupOrdersByState,
  computeColumnWeights,
  filterOrders,
  isOrderNextUp,
} from '@/lib/production-derivations';
import type { ProductionOrder } from '@/db/schema/orders';

// Minimal fixture factory — supply only the fields needed for each test group
function makeOrder(overrides: Partial<ProductionOrder> = {}): ProductionOrder {
  return {
    id: 'test-id-1',
    orderNumber: 'ORD-001',
    customer: 'Acme Feed',
    product: 'Layer Mash',
    weightLbs: '1000.00',
    deliveryTime: 'Mar 5, 2026 10am',
    state: 'Pending',
    millLine: 'Premix',
    textureType: null,
    lineCode: null,
    earlyDeliveryDate: null,
    version: 1,
    createdBy: 'user-001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// groupOrdersByState
// ─────────────────────────────────────────────────────────────────────────────

describe('groupOrdersByState', () => {
  test('Test 1 (RED): empty input returns all four state buckets as empty arrays', () => {
    const result = groupOrdersByState([]);
    expect(result).toEqual({
      Pending: [],
      Mixing: [],
      Completed: [],
      Blocked: [],
    });
    // All four keys must be present
    expect(Object.keys(result).sort()).toEqual(['Blocked', 'Completed', 'Mixing', 'Pending']);
  });

  test('Test 2 (RED): one order per state is grouped into its correct bucket', () => {
    const pending = makeOrder({ id: 'p1', state: 'Pending' });
    const mixing = makeOrder({ id: 'm1', state: 'Mixing' });
    const completed = makeOrder({ id: 'c1', state: 'Completed' });
    const blocked = makeOrder({ id: 'b1', state: 'Blocked' });

    const result = groupOrdersByState([pending, mixing, completed, blocked]);
    expect(result.Pending).toEqual([pending]);
    expect(result.Mixing).toEqual([mixing]);
    expect(result.Completed).toEqual([completed]);
    expect(result.Blocked).toEqual([blocked]);
  });

  test('Test 3 (RED): order within each bucket follows input order (stable grouping)', () => {
    const p1 = makeOrder({ id: 'p1', state: 'Pending' });
    const p2 = makeOrder({ id: 'p2', state: 'Pending' });
    const p3 = makeOrder({ id: 'p3', state: 'Pending' });

    const result = groupOrdersByState([p1, p2, p3]);
    expect(result.Pending).toEqual([p1, p2, p3]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeColumnWeights
// ─────────────────────────────────────────────────────────────────────────────

describe('computeColumnWeights', () => {
  test('Test 4 (RED): empty input returns { completed: 0, total: 0 }', () => {
    expect(computeColumnWeights([])).toEqual({ completed: 0, total: 0 });
  });

  test('Test 5 (RED): correctly parses string weight_lbs with parseFloat — no string concat', () => {
    const completedOrder = makeOrder({ id: 'c1', state: 'Completed', weightLbs: '1500.50' });
    const mixingOrder = makeOrder({ id: 'm1', state: 'Mixing', weightLbs: '2000.00' });

    const result = computeColumnWeights([completedOrder, mixingOrder]);
    // CRITICAL: must use parseFloat, not string concat
    expect(result.completed).toBeCloseTo(1500.5);
    expect(result.total).toBeCloseTo(3500.5);
  });

  test('Test 6 (RED): order with weightLbs = "0" is included (zero weight contributes 0)', () => {
    // weightLbs is notNull per schema, so we test with "0" (not null)
    const zeroWeightOrder = makeOrder({ id: 'z1', state: 'Pending', weightLbs: '0' });
    const normalOrder = makeOrder({ id: 'n1', state: 'Completed', weightLbs: '500.00' });

    const result = computeColumnWeights([zeroWeightOrder, normalOrder]);
    expect(result.total).toBeCloseTo(500);
    expect(result.completed).toBeCloseTo(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// filterOrders
// ─────────────────────────────────────────────────────────────────────────────

describe('filterOrders', () => {
  const orders = [
    makeOrder({ id: '1', state: 'Pending', customer: 'Acme Feed', product: 'Layer Mash' }),
    makeOrder({ id: '2', state: 'Mixing', customer: 'Beta Farms', product: 'Starter Crumble' }),
    makeOrder({ id: '3', state: 'Completed', customer: 'Acme Feed', product: 'Finisher Pellet' }),
    makeOrder({ id: '4', state: 'Blocked', customer: 'Gamma Ranch', product: 'Layer Mash' }),
  ];

  test('Test 7 (RED): empty status [] and empty q="" returns all orders (show all)', () => {
    const result = filterOrders(orders, [], '');
    expect(result).toHaveLength(4);
    expect(result).toEqual(orders);
  });

  test('Test 8 (RED): status=["Pending"] returns only Pending orders', () => {
    const result = filterOrders(orders, ['Pending'], '');
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe('Pending');
  });

  test('Test 9 (RED): status=["Pending","Mixing"] returns Pending + Mixing orders', () => {
    const result = filterOrders(orders, ['Pending', 'Mixing'], '');
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.state).sort()).toEqual(['Mixing', 'Pending']);
  });

  test('Test 10 (RED): q="acme" matches orders whose customer contains "acme" (case-insensitive)', () => {
    // "acme" should match "Acme Feed" (customer of id 1 and 3)
    const result = filterOrders(orders, [], 'acme');
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id).sort()).toEqual(['1', '3']);
  });

  test('Test 11 (RED): q="  ACME  " (whitespace + uppercase) matches same as "acme"', () => {
    const result = filterOrders(orders, [], '  ACME  ');
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.id).sort()).toEqual(['1', '3']);
  });

  test('Test 12 (RED): filter chain — status applied first, then q substring on survivors', () => {
    // Filter to Pending only, then search for "acme" — should return only order 1
    const result = filterOrders(orders, ['Pending'], 'acme');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isOrderNextUp
// ─────────────────────────────────────────────────────────────────────────────

describe('isOrderNextUp', () => {
  const pending1 = makeOrder({ id: 'p1', state: 'Pending' });
  const pending2 = makeOrder({ id: 'p2', state: 'Pending' });
  const mixingOrder = makeOrder({ id: 'm1', state: 'Mixing' });

  test('Test 13 (RED): first Pending order in column returns true', () => {
    expect(isOrderNextUp(pending1, [pending1, pending2])).toBe(true);
  });

  test('Test 14 (RED): non-first Pending order returns false', () => {
    expect(isOrderNextUp(pending2, [pending1, pending2])).toBe(false);
  });

  test('Test 15 (RED): order not in Pending state returns false', () => {
    // Mixing order in a Pending list — shouldn't normally happen, but must return false
    expect(isOrderNextUp(mixingOrder, [pending1, pending2])).toBe(false);
  });

  test('Test 16 (RED): empty Pending list — no order is next up, returns false', () => {
    expect(isOrderNextUp(pending1, [])).toBe(false);
  });
});
