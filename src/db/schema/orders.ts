// Source: Drizzle docs https://orm.drizzle.team/docs/column-types/pg
// + CONTEXT.md D-06 through D-14
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

// D-07: Postgres native enum types — created before the table in SQL output
export const productionStateEnum = pgEnum('production_state', [
  'Pending',
  'Mixing',
  'Completed',
  'Blocked',
]);

export const millLineEnum = pgEnum('mill_line', ['Premix', 'Excel', 'CGM']);

// Derive TS union types from the enum — replaces hand-written MillLine / ProductionState in src/types/millProduction.ts (D-04)
export type ProductionState = (typeof productionStateEnum.enumValues)[number];
export type MillLine = (typeof millLineEnum.enumValues)[number];

export const productionOrders = pgTable(
  'production_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(), // D-06: gen_random_uuid() on Neon (no pgcrypto ext needed)
    orderNumber: text('order_number').notNull(),  // D-20: UNIQUE index added in second arg
    customer: text('customer').notNull(),
    product: text('product').notNull(),
    weightLbs: numeric('weight_lbs', { precision: 10, scale: 2 }).notNull(), // D-12: numeric — TS infers as string
    deliveryTime: text('delivery_time').notNull(),  // D-13: display string, not a time type
    state: productionStateEnum('state').notNull(),  // D-07
    millLine: millLineEnum('mill_line').notNull(),  // D-07
    textureType: text('texture_type'),              // D-12: nullable
    lineCode: text('line_code'),                    // D-12: nullable
    version: integer('version').notNull().default(1), // D-11: optimistic concurrency
    createdBy: text('created_by').notNull(),         // D-09: Clerk user ID as text, no FK
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // D-14
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()), // D-08: Drizzle JS-level — fires on db.update() calls only
  },
  (table) => [
    index('idx_orders_state').on(table.state),           // D-20
    index('idx_orders_mill_line').on(table.millLine),    // D-20
    uniqueIndex('idx_orders_order_number').on(table.orderNumber), // D-20: duplicate detection for IMPORT-05
  ]
);

// D-03: co-located inferred types — canonical project-wide ProductionOrder (D-04)
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type NewProductionOrder = typeof productionOrders.$inferInsert;
