// Source: CONTEXT.md D-09, D-14
// users table is a lazy-sync Clerk display-name cache (DATA-05).
// id is the Clerk user_xxx string directly — no surrogate UUID.
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),  // D-09: Clerk's user_xxx ID as PK — makes lazy upsert trivial
  displayName: text('display_name'),
  email: text('email'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow(), // D-14
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), // D-14
});

// D-03: co-located inferred types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
