---
phase: 260512-kfy
plan: 01
type: quick-task
tags:
  - auth
  - clerk
  - refactor
  - roles
subsystem: auth
key-files:
  modified:
    - src/types/clerk.d.ts
    - src/lib/auth.ts
    - src/lib/auth.test.ts
    - src/middleware.ts
    - src/middleware.test.ts
    - src/test/fixtures/clerkAuth.ts
    - src/test/fixtures/clerkAuth.test.ts
    - docs/clerk-setup.md
    - docs/security-patterns.md
decisions:
  - "Hard cutover from role: Role to roles: Role[] — no backward-compat shim, singular field fully retired"
  - "Array.prototype.includes() for membership checks — no Set (per constraint: simple, not needed at this scale)"
  - "mockNonDemoSession fixture uses roles: [role] array wrapping to match new shape"
  - "Post-refactor note in security-patterns.md §1 avoids repeating singular field name in operational context"
metrics:
  completed_date: "2026-05-12"
  tasks_completed: 2
  tasks_pending: 1
  pending_reason: "Task 3 is checkpoint:human-action (Clerk Dashboard manual cutover)"
---

# Phase 260512-kfy Plan 01: Refactor user `role` to `roles` array — Summary

**One-liner:** Hard-cutover of `CustomJwtSessionClaims.metadata` from `role: Role` (singular) to `roles: Role[]` (array), enabling multi-role assignment for v2.0 Mill Production MVP.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Flip CustomJwtSessionClaims and runtime guards from `role` to `roles` array | 4e900c4 | src/types/clerk.d.ts, src/lib/auth.ts, src/lib/auth.test.ts, src/middleware.ts, src/middleware.test.ts, src/test/fixtures/clerkAuth.ts, src/test/fixtures/clerkAuth.test.ts |
| 2 | Update Clerk + security pattern runbooks to plural roles shape | cd32cd4 | docs/clerk-setup.md, docs/security-patterns.md |

## Files Changed

### Task 1 — Source code refactor (commit 4e900c4)

**`src/types/clerk.d.ts`**
- Before: `role?: Role;` inside `CustomJwtSessionClaims.metadata`
- After: `roles?: Role[]` inside `CustomJwtSessionClaims.metadata`
- `Role` union type (`'demo' | 'admin' | 'user'`) unchanged.

**`src/lib/auth.ts`**
- Runtime guard line ~46: `sessionClaims?.metadata?.role !== role` → `!sessionClaims?.metadata?.roles?.includes(role)`
- JSDoc updated: `metadata?.role` references → `metadata?.roles`; branch description updated to `!sessionClaims.metadata.roles?.includes(role)`

**`src/lib/auth.test.ts`**
- Cases 2 and 3 updated to use `roles: ['user']` and `roles: ['demo']` arrays.
- **New case 4 (multi-role match):** `roles: ['demo', 'admin']` → `requireRole('demo')` resolves AND `requireRole('admin')` resolves. Proves multi-role contract that motivates the refactor.
- **New case 5 (missing roles field):** `sessionClaims: { metadata: {} }` → `requireRole('demo')` rejects to `/`. Covers the optional-chain branch where `roles` is undefined.

**`src/middleware.ts`**
- Demo gate line ~35: `sessionClaims?.metadata?.role !== 'demo'` → `!sessionClaims?.metadata?.roles?.includes('demo')`

**`src/middleware.test.ts`**
- In "checks role for demo routes via sessionClaims": added `expect(middlewareContent).toContain("roles")` and `expect(middlewareContent).toContain("includes('demo')")` to make new plural shape load-bearing.
- Inline comment updated: "Read role from sessionClaims.metadata.role" → "Read roles from sessionClaims.metadata.roles"

**`src/test/fixtures/clerkAuth.ts`**
- `mockDemoSession`: `metadata: { role: 'demo' }` → `metadata: { roles: ['demo'] }`
- `mockNonDemoSession`: `metadata: { role }` → `metadata: { roles: [role] }`; JSDoc updated to describe array shape.

**`src/test/fixtures/clerkAuth.test.ts`**
- Three session-shape assertions flipped from `toEqual({ metadata: { role: ... } })` to `toContain(...)` on the `roles` array, making tests robust to future role additions.

### Task 2 — Runbook updates (commit cd32cd4)

**`docs/clerk-setup.md`**
- Step 1 JWT template: `{"metadata": {"role": "{{user.public_metadata.role}}"}}` → `{"metadata": {"roles": "{{user.public_metadata.roles}}"}}`
- Step 1 Note: `CustomJwtSessionClaims.metadata.role` → `CustomJwtSessionClaims.metadata.roles`; "selects only the `role` value" → "selects only the `roles` array"
- Step 1: Added "Migration note (one-time)" section — instructs operator to replace any `publicMetadata.role` string with `publicMetadata.roles: [<old value>]` and update JWT template before users sign in; cross-links Task 3 checkpoint.
- Step 2 table: column `publicMetadata.role` → `publicMetadata.roles`; values `demo` → `["demo"]`, `admin` → `["admin"]`; trailing Note updated to reference `publicMetadata.roles`
- Step 3: Heading `## Step 3: Assign publicMetadata.role` → `## Step 3: Assign publicMetadata.roles`; JSON examples `{"role": "demo"}` → `{"roles": ["demo"]}`, `{"role": "admin"}` → `{"roles": ["admin"]}`; trailing Note updated (no empty array guidance preserved)
- Verification step 3: decoded-JWT expectations updated to `"metadata": {"roles": ["demo"]}` / `"metadata": {"roles": ["admin"]}`; norole expectation updated to `metadata.roles` absent
- Order of Operations Warning: "stale or missing `metadata.role` claim" → "stale or missing `metadata.roles` claim"

**`docs/security-patterns.md`**
- §3 paragraph below table: `sessionClaims.metadata.role` → `sessionClaims.metadata.roles (a Role[] array)` with `Array.prototype.includes` mention
- §1: Post-refactor paragraph appended below "point-in-time snapshot" note documenting the `role → roles` field rename (260512-kfy)

## Verification Command Output (Task 1)

```
Test Suites: 3 passed, 3 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        0.586 s
Ran all test suites matching (auth\.test|middleware\.test|clerkAuth\.test)

npx tsc --noEmit: zero errors

grep -rn "metadata\.role[^s]" src/: Zero hits
```

## Verification Command Output (Task 2)

```
CHECK 1 PASS: no singular metadata.role
CHECK 2 PASS: metadata.roles in clerk-setup.md
CHECK 3 PASS: metadata.roles in security-patterns.md
CHECK 4 PASS: "roles" in clerk-setup.md
CHECK 5 PASS: publicMetadata.roles in clerk-setup.md
```

## Manual Cutover Pending

**Task 3 has NOT been executed.** It is `type="checkpoint:human-action"` and requires manual Clerk Dashboard edits that Claude cannot perform via CLI or API.

### Resume Signal (from Task 3 `<resume-signal>`)

> Type "dashboard migrated" (and optionally paste the decoded JWT payload showing `metadata.roles: ["demo"]`), or describe the failure mode if any of steps 7–9 didn't behave as expected.

### What Must Be Done (operator)

1. Open the Clerk Dashboard for the dev instance (keys in `.env.local`).
2. `Sessions → Customize session token` → replace body with:
   ```json
   {"metadata": {"roles": "{{user.public_metadata.roles}}"}}
   ```
3. `Users` → demo user (`e2e-demo+clerk_test@example.com`) → `Metadata → Edit publicMetadata` → replace `{"role": "demo"}` with `{"roles": ["demo"]}`.
4. If admin user exists, repeat step 3: replace `{"role": "admin"}` with `{"roles": ["admin"]}`.
5. Leave norole user untouched (no `publicMetadata.roles` field at all — do NOT write empty array).
6. Sign out of active dev sessions. Sign back in as demo user.
7. Navigate to `/demo/orders` — confirm page renders (no redirect).
8. Decode `__session` cookie at `jwt.io` — confirm `"metadata": {"roles": ["demo"]}`.
9. Sign out, sign in as norole user, navigate to `/demo/orders` — confirm redirect to `/`.

Until the Dashboard cutover is complete, any signed-in session will have `sessionClaims.metadata.roles === undefined`, and `/demo/*` will redirect all users (including the demo user) to `/`.

## Drift Notes (from Plan `<output>` block)

The orchestrator's original brief had these inaccuracies relative to the actual codebase:

| Orchestrator claim | Actual (on disk) | Impact |
|--------------------|------------------|--------|
| File `src/lib/server/role.ts` | File is `src/lib/auth.ts` | Plan and executor both used the correct file; no confusion in execution. |
| `checkRole` utility exported | No `checkRole` exists — only `requireRole` | Plan explicitly instructs: do not introduce `checkRole`. Docs in §3/§6 reference it as forward-looking documentation for a future phase. Updated the field name in those prose references without adding an implementation. |
| "8-case Jest suite" | Actual count was 3 cases (before refactor), now 5 | Added 2 new cases (multi-role match, missing roles field) as specified in Task 1. No 8-case suite was present or created. |

## Known Stubs

None — all code paths are fully wired. The only pending item is the manual Clerk Dashboard cutover in Task 3.

## Self-Check

- [x] src/types/clerk.d.ts — contains `roles?: Role[]`
- [x] src/lib/auth.ts — contains `metadata?.roles`
- [x] src/middleware.ts — contains `metadata?.roles`
- [x] docs/clerk-setup.md — contains `metadata.roles` and `publicMetadata.roles`
- [x] docs/security-patterns.md — contains `metadata.roles`
- [x] commit 4e900c4 — Task 1 (7 files, 26 tests green, tsc clean)
- [x] commit cd32cd4 — Task 2 (2 doc files, all verify checks pass)

## Self-Check: PASSED
