import { orderEvents } from '../events';
import type { OrderEvent, NewOrderEvent } from '../events';

describe('src/db/schema/events.ts exports', () => {
  it('exports orderEvents pgTable', () => {
    expect(orderEvents).toBeDefined();
  });

  it('orderEvents has orderId column', () => {
    expect(orderEvents.orderId).toBeDefined();
  });

  it('orderEvents has toState column', () => {
    expect(orderEvents.toState).toBeDefined();
  });

  it('OrderEvent and NewOrderEvent are exported (type-level check)', () => {
    // Compile-time only — if this file compiles, the types are exported.
    const _selectCheck: OrderEvent | undefined = undefined;
    const _insertCheck: NewOrderEvent | undefined = undefined;
    expect(true).toBe(true);
  });
});
