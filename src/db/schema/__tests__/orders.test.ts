import { getTableConfig } from 'drizzle-orm/pg-core';
import { productionOrders, productionStateEnum, millLineEnum } from '../orders';
import type { ProductionOrder, NewProductionOrder } from '../orders';

describe('productionOrders table contract', () => {
  const cfg = getTableConfig(productionOrders);
  const cols = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));

  it('has the 14 required columns (D-06 through D-14)', () => {
    expect(Object.keys(cols).sort()).toEqual(
      [
        'id',
        'order_number',
        'customer',
        'product',
        'weight_lbs',
        'delivery_time',
        'state',
        'mill_line',
        'texture_type',
        'line_code',
        'version',
        'created_by',
        'created_at',
        'updated_at',
      ].sort()
    );
  });

  it('NOT NULL columns are enforced (D-12)', () => {
    for (const name of [
      'id',
      'order_number',
      'customer',
      'product',
      'weight_lbs',
      'delivery_time',
      'state',
      'mill_line',
      'version',
      'created_by',
      'created_at',
      'updated_at',
    ]) {
      expect(cols[name].notNull).toBe(true);
    }
  });

  it('texture_type and line_code are nullable (D-12)', () => {
    expect(cols.texture_type.notNull).toBe(false);
    expect(cols.line_code.notNull).toBe(false);
  });

  it('id is uuid primary key with defaultRandom (D-06)', () => {
    expect(cols.id.primary).toBe(true);
    expect(cols.id.columnType).toBe('PgUUID');
    expect(cols.id.hasDefault).toBe(true);
  });

  it('weight_lbs is numeric (D-12) — Drizzle infers as string', () => {
    expect(cols.weight_lbs.columnType).toBe('PgNumeric');
  });

  it('version is integer with default 1 (D-11 optimistic concurrency)', () => {
    expect(cols.version.columnType).toBe('PgInteger');
    expect(cols.version.hasDefault).toBe(true);
    expect(cols.version.default).toBe(1);
  });

  it('created_at and updated_at are timestamps with default (D-14)', () => {
    expect(cols.created_at.columnType).toBe('PgTimestamp');
    expect(cols.created_at.hasDefault).toBe(true);
    expect(cols.updated_at.columnType).toBe('PgTimestamp');
    expect(cols.updated_at.hasDefault).toBe(true);
  });

  it('state and mill_line use pgEnum (D-07)', () => {
    expect(cols.state.columnType).toBe('PgEnumColumn');
    expect(cols.mill_line.columnType).toBe('PgEnumColumn');
  });

  it('order_number index is UNIQUE on order_number column (D-20 / IMPORT-05)', () => {
    const ix = cfg.indexes.find((i) => i.config.name === 'idx_orders_order_number');
    expect(ix).toBeDefined();
    expect((ix!.config as { unique?: boolean }).unique).toBe(true);
    expect(ix!.config.columns?.map((c: { name?: string }) => c.name)).toEqual(['order_number']);
  });

  it('state and mill_line have non-unique btree indexes (D-20)', () => {
    const stateIx = cfg.indexes.find((i) => i.config.name === 'idx_orders_state');
    expect(stateIx).toBeDefined();
    expect((stateIx!.config as { unique?: boolean }).unique).toBe(false);
    expect(stateIx!.config.columns?.map((c: { name?: string }) => c.name)).toEqual(['state']);

    const millIx = cfg.indexes.find((i) => i.config.name === 'idx_orders_mill_line');
    expect(millIx).toBeDefined();
    expect((millIx!.config as { unique?: boolean }).unique).toBe(false);
    expect(millIx!.config.columns?.map((c: { name?: string }) => c.name)).toEqual(['mill_line']);
  });

  it('productionStateEnum values are [Pending, Mixing, Completed, Blocked] in lifecycle order', () => {
    expect(productionStateEnum.enumValues).toEqual([
      'Pending',
      'Mixing',
      'Completed',
      'Blocked',
    ]);
  });

  it('millLineEnum values are [Premix, Excel, CGM]', () => {
    expect(millLineEnum.enumValues).toEqual(['Premix', 'Excel', 'CGM']);
  });

  it('ProductionOrder and NewProductionOrder are exported (type-level check)', () => {
    // Compile-time only — if this file compiles, the types are exported.
    const _selectCheck: ProductionOrder | undefined = undefined;
    const _insertCheck: NewProductionOrder | undefined = undefined;
    expect(_selectCheck).toBeUndefined();
    expect(_insertCheck).toBeUndefined();
  });
});
