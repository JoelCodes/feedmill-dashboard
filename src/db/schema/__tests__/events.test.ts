import { getTableConfig } from 'drizzle-orm/pg-core';
import { orderEvents } from '../events';
import type { OrderEvent, NewOrderEvent } from '../events';

describe('orderEvents table contract', () => {
  const cfg = getTableConfig(orderEvents);
  const cols = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));

  it('has the 7 required columns', () => {
    expect(Object.keys(cols).sort()).toEqual(
      ['id', 'order_id', 'from_state', 'to_state', 'changed_by', 'changed_at', 'note'].sort()
    );
  });

  it('NOT NULL columns enforced (id, order_id, to_state, changed_by, changed_at)', () => {
    for (const name of ['id', 'order_id', 'to_state', 'changed_by', 'changed_at']) {
      expect(cols[name].notNull).toBe(true);
    }
  });

  it('from_state and note are nullable (initial-event support + free-text blocker reason)', () => {
    expect(cols.from_state.notNull).toBe(false);
    expect(cols.note.notNull).toBe(false);
  });

  it('id is uuid primary key', () => {
    expect(cols.id.primary).toBe(true);
    expect(cols.id.columnType).toBe('PgUUID');
  });

  it('order_id is uuid (foreign key target column type)', () => {
    expect(cols.order_id.columnType).toBe('PgUUID');
  });

  it('to_state and from_state use production_state pgEnum (D-07)', () => {
    expect(cols.to_state.columnType).toBe('PgEnumColumn');
    expect(cols.from_state.columnType).toBe('PgEnumColumn');
  });

  it('foreign key on order_id references production_orders.id ON DELETE cascade (D-10)', () => {
    expect(cfg.foreignKeys).toHaveLength(1);
    const fk = cfg.foreignKeys[0];
    const ref = fk.reference();
    expect(ref.columns.map((c: { name?: string }) => c.name)).toEqual(['order_id']);
    expect(ref.foreignColumns.map((c: { name?: string }) => c.name)).toEqual(['id']);
    expect(fk.onDelete).toBe('cascade');
  });

  it('composite idx_events_order_id_changed_at_desc index exists (D-20 / PROD-05)', () => {
    const ix = cfg.indexes.find(
      (i) => i.config.name === 'idx_events_order_id_changed_at_desc'
    );
    expect(ix).toBeDefined();
    expect((ix!.config as { unique?: boolean }).unique).toBe(false);
    expect(ix!.config.columns?.map((c: { name?: string }) => c.name)).toEqual([
      'order_id',
      'changed_at',
    ]);
  });

  it('OrderEvent and NewOrderEvent are exported (type-level check)', () => {
    const _selectCheck: OrderEvent | undefined = undefined;
    const _insertCheck: NewOrderEvent | undefined = undefined;
    expect(_selectCheck).toBeUndefined();
    expect(_insertCheck).toBeUndefined();
  });
});
