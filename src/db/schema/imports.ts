// Source: CONTEXT.md D-06, D-09, D-14
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  rowCount: integer('row_count').notNull(),
  importedBy: text('imported_by').notNull(), // D-09: Clerk user ID, no FK
  importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(), // D-14
});

// D-03: co-located inferred types
export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;
