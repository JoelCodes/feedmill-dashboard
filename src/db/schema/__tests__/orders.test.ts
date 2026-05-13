import { productionOrders, productionStateEnum, millLineEnum } from '../orders';
import type { ProductionOrder, NewProductionOrder } from '../orders';

describe('src/db/schema/orders.ts exports', () => {
  it('exports productionOrders pgTable', () => {
    expect(productionOrders).toBeDefined();
  });

  it('productionStateEnum has correct values', () => {
    expect(productionStateEnum.enumValues).toEqual([
      'Pending',
      'Mixing',
      'Completed',
      'Blocked',
    ]);
  });

  it('millLineEnum has correct values', () => {
    expect(millLineEnum.enumValues).toEqual(['Premix', 'Excel', 'CGM']);
  });

  it('ProductionOrder and NewProductionOrder are exported (type-level check)', () => {
    // Compile-time only — if this file compiles, the types are exported.
    // Runtime assertion: productionOrders table infers select and insert shapes.
    const _selectCheck: ProductionOrder | undefined = undefined;
    const _insertCheck: NewProductionOrder | undefined = undefined;
    expect(true).toBe(true);
  });
});
