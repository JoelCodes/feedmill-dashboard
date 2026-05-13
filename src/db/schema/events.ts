// Source: Drizzle docs + CONTEXT.md D-10, D-14, D-20
import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { productionOrders, productionStateEnum } from './orders';

export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => productionOrders.id, { onDelete: 'cascade' }), // D-10
    fromState: productionStateEnum('from_state'),  // nullable — initial "created" event has no from-state
    toState: productionStateEnum('to_state').notNull(),
    changedBy: text('changed_by').notNull(),         // D-09: Clerk user ID, no FK
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(), // D-14
    note: text('note'),                              // nullable — blocker reason free-text
  },
  (table) => [
    // D-20: composite index for "transition history for one order" query (PROD-05)
    index('idx_events_order_id_changed_at_desc').on(
      table.orderId,
      table.changedAt.desc() // DESC ordering on the timestamp column
    ),
  ]
);

// D-03: co-located inferred types
export type OrderEvent = typeof orderEvents.$inferSelect;
export type NewOrderEvent = typeof orderEvents.$inferInsert;
