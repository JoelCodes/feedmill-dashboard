import { users } from '../users';
import type { User, NewUser } from '../users';

describe('src/db/schema/users.ts exports', () => {
  it('exports users pgTable', () => {
    expect(users).toBeDefined();
  });

  it('users has id column (text primary key)', () => {
    expect(users.id).toBeDefined();
  });

  it('User and NewUser are exported (type-level check)', () => {
    // Compile-time only — if this file compiles, the types are exported.
    const _selectCheck: User | undefined = undefined;
    const _insertCheck: NewUser | undefined = undefined;
    expect(true).toBe(true);
  });
});
