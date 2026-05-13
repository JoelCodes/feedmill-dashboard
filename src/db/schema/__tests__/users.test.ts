import { getTableConfig } from 'drizzle-orm/pg-core';
import { users } from '../users';
import type { User, NewUser } from '../users';

describe('users table contract', () => {
  const cfg = getTableConfig(users);
  const cols = Object.fromEntries(cfg.columns.map((c) => [c.name, c]));

  it('has the 5 required columns (D-09, D-14)', () => {
    expect(Object.keys(cols).sort()).toEqual(
      ['id', 'display_name', 'email', 'last_seen_at', 'created_at'].sort()
    );
  });

  it('id is a text primary key (Clerk user_xxx string, no surrogate UUID — D-09)', () => {
    expect(cols.id.primary).toBe(true);
    expect(cols.id.notNull).toBe(true);
    expect(cols.id.columnType).toBe('PgText');
    expect(cols.id.hasDefault).toBe(false);
  });

  it('display_name and email are nullable text', () => {
    expect(cols.display_name.notNull).toBe(false);
    expect(cols.display_name.columnType).toBe('PgText');
    expect(cols.email.notNull).toBe(false);
    expect(cols.email.columnType).toBe('PgText');
  });

  it('last_seen_at is nullable timestamp with default', () => {
    expect(cols.last_seen_at.columnType).toBe('PgTimestamp');
    expect(cols.last_seen_at.notNull).toBe(false);
    expect(cols.last_seen_at.hasDefault).toBe(true);
  });

  it('created_at is NOT NULL timestamp with default (D-14)', () => {
    expect(cols.created_at.columnType).toBe('PgTimestamp');
    expect(cols.created_at.notNull).toBe(true);
    expect(cols.created_at.hasDefault).toBe(true);
  });

  it('User and NewUser are exported (type-level check)', () => {
    const _selectCheck: User | undefined = undefined;
    const _insertCheck: NewUser | undefined = undefined;
    expect(_selectCheck).toBeUndefined();
    expect(_insertCheck).toBeUndefined();
  });
});
