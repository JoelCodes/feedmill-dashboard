---
phase: 27-role-assignment-and-testing
plan: 02
subsystem: clerk-middleware
tags: [clerk, middleware, rbac, session-claims, tdd, migration]
one_liner: "Migrated src/middleware.ts from per-request clerkClient.users.getUser() to local sessionClaims?.metadata?.role read; source-string test suite updated to match (D-04, D-06, D-09)."
dependency_graph:
  requires: []
  provides:
    - "Session-claim-based role enforcement in Edge middleware (closes Phase 25 SC#1: no extra network request)"
  affects:
    - "src/middleware.ts"
    - "src/middleware.test.ts"
tech_stack:
  added: []
  patterns:
    - "auth() destructure: const { userId, sessionClaims } = await auth() (RESEARCH §Pattern 2)"
    - "Default-deny role guard: sessionClaims?.metadata?.role !== 'demo' → redirect to '/' (D-01)"
key_files:
  created: []
  modified:
    - "src/middleware.ts"
    - "src/middleware.test.ts"
decisions:
  - "D-04 (locked): Middleware reads role from sessionClaims.metadata.role; clerkClient import + getUser() call removed."
  - "D-06 (locked): No fallback to clerkClient.getUser() when claim is missing. Stale-session users get the same redirect to / and remediate via sign-out/sign-in per Plan 27-03 docs."
  - "D-09 (locked, broadened scope): Source-string test renamed 'via publicMetadata' → 'via sessionClaims'; whole-file grep gates enforce zero stale toContain(\"clerkClient\")/toContain(\"publicMetadata\") positive references."
  - "Success Criterion #4 invariant pinned at unit layer: literal '/demo(.*)' assertion + negative isDemoRoute/settings regex (Phase 26 D-07 — settings remains accessible to all authenticated users)."
metrics:
  duration: "~10 min wall clock"
  completed: "2026-05-11"
  tasks_completed: 3
  files_changed: 2
  commits: 2
---

# Phase 27 Plan 02: Migrate Middleware to sessionClaims Summary

Migrated `src/middleware.ts` from a per-request `clerkClient.users.getUser()` Backend API call to a local `auth().sessionClaims?.metadata?.role` read, and updated `src/middleware.test.ts` source-string assertions to match. Closes Phase 25 SC#1 (role available in session token without additional network request).

## What Shipped

- **`src/middleware.ts`** — Dropped `clerkClient` and `Role` imports. Destructured `{ userId, sessionClaims }` from `await auth()`. Replaced the three-line `clerkClient → getUser → publicMetadata` chain with the single guard `sessionClaims?.metadata?.role !== 'demo'`. The literal `createRouteMatcher(['/demo(.*)'])` is unchanged — `isDemoRoute` does NOT include `/settings`, preserving Phase 26 D-07.
- **`src/middleware.test.ts`** — Renamed the demo-route source-string test from "via publicMetadata" → "via sessionClaims". Replaced positive `toContain` assertions for `clerkClient`/`publicMetadata` with `sessionClaims`/`metadata`. Added negative `.not.toContain("clerkClient")` / `.not.toContain("publicMetadata")` checks. Added Success Criterion #4 invariant assertions: positive `'/demo(.*)'` and negative `/isDemoRoute[\s\S]*settings/i` regex.

## Tasks Executed (TDD: RED → GREEN → regression)

| # | Task | Type | Result | Commit |
|---|------|------|--------|--------|
| 1 | Rewrite demo-route assertion for sessionClaims source (RED) | tdd | Test went red against un-migrated middleware as expected; 12 other middleware tests stayed green | `0448023` |
| 2 | Migrate src/middleware.ts to read sessionClaims (GREEN) | tdd | All 13 middleware.test.ts tests pass; tsc clean on middleware files | `dbc9ecb` |
| 3 | Full Jest regression check | auto | No regressions in Clerk-adjacent suites; pre-existing unrelated failures documented (see Deferred Issues) | (check only, no commit) |

## TDD Gate Compliance

- RED gate: `test(27-02): rewrite demo-route assertion for sessionClaims source (RED)` — `0448023`.
- GREEN gate: `refactor(27-02): migrate middleware to sessionClaims-based role read (GREEN)` — `dbc9ecb`.
- REFACTOR gate: not needed — the GREEN implementation is the final shape; the diff is a net deletion (3 insertions, 8 deletions) with no smells to address.

## Verification Evidence

```
$ grep -F "clerkClient" src/middleware.ts           # 0 matches
$ grep -F "publicMetadata" src/middleware.ts        # 0 matches
$ grep -F "import type { Role }" src/middleware.ts  # 0 matches
$ grep -F "const { userId, sessionClaims } = await auth()" src/middleware.ts  # 1 match
$ grep -F "sessionClaims?.metadata?.role !== 'demo'" src/middleware.ts         # 1 match
$ grep -F "'/demo(.*)'" src/middleware.ts            # 1 match (matcher preserved)
$ grep -E "createRouteMatcher\(\[[^]]*settings" src/middleware.ts  # 0 matches (settings NOT in matcher)
$ grep -F "auth.protect()" src/middleware.ts        # 1 match (Phase 25 protection preserved)

$ npm test -- src/middleware.test.ts
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total

$ npm test -- src/components/Sidebar.test.tsx
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total

$ npm test -- src/app/demo
Test Suites: 5 passed, 5 total
Tests:       43 passed, 43 total
```

All migration-relevant suites green. `npx tsc --noEmit` produces zero errors involving `src/middleware.ts` or `src/middleware.test.ts`.

### Whole-file grep gates (D-09 broadened scope)

```
$ grep -F 'toContain("clerkClient")' src/middleware.test.ts | grep -v 'not.toContain'
(no matches — no stale positive references remain)

$ grep -F 'toContain("publicMetadata")' src/middleware.test.ts | grep -v 'not.toContain'
(no matches)
```

The bare-substring grep returns 1 line for each because the negative `.not.toContain("clerkClient")` assertion contains the substring `toContain("clerkClient")`. The semantic gate (no stale POSITIVE references) is met — see the filtered greps above.

### Success Criterion #4 invariant (per checker warning #8)

```
$ grep -F "toContain(\"'/demo(.*)'\")" src/middleware.test.ts            # 1 match
$ grep -F 'not.toMatch' src/middleware.test.ts                            # 1 match
$ grep -F 'isDemoRoute' src/middleware.test.ts | grep -F 'settings'      # 1 match (negative regex)
```

`/settings` cannot be added to `isDemoRoute` without breaking this unit test — the invariant is now CI-enforced at the unit layer in addition to E2E.

## Deviations from Plan

None — plan executed exactly as written.

The RED step failed cleanly (the new positive `toContain("sessionClaims")` assertion threw at line 148 against the un-migrated middleware, exactly as the plan predicted). The GREEN step migrated only the three regions called out in the plan (line 1 import, line 3 import, lines 36-38 body). No auto-fixes (Rules 1-3) were triggered, and no architectural blockers (Rule 4) surfaced.

## Authentication Gates

None encountered. The migration is purely source-code and unit-test scope.

## Threat Surface

The plan's `<threat_model>` includes T-27-07 (latency DoS — mitigated by this plan since the Edge-runtime network call is removed) and T-27-21 (accidental `/settings` inclusion in demo matcher — mitigated by the unit-level negative-regex assertion). Both mitigations are now in effect.

No new security surface introduced by this plan — no new endpoints, auth paths, file access patterns, or schema changes. The change is a net reduction in attack surface (one fewer Edge-runtime network call to Clerk Backend API per protected request).

## Deferred Issues

Pre-existing unrelated test failures discovered by the full `npm test` regression run (Task 3) — logged to `.planning/phases/27-role-assignment-and-testing/deferred-items.md`:

- `src/app/settings/__tests__/page.test.tsx` — 14 failures with "ClerkLoading can only be used within the <ClerkProvider />" — a test-setup issue (missing ClerkProvider wrapper in the test renderer). **Verified pre-existing on baseline a78167a.**
- `e2e/route-protection.spec.ts`, `e2e/demo-route-protection.spec.ts`, `e2e/production-smoke.spec.ts` — Playwright `*.spec.ts` files being picked up by Jest config. **Verified pre-existing on baseline a78167a.**
- `npx tsc --noEmit` reports type errors in 8 unrelated test files (theme.test.tsx, tokens.test.ts, demo customers/orders fixtures, OrderDetails.test.tsx, OrdersTable.test.tsx, customerSort.test.ts) — all about missing fixture properties (`customerId`, `activeBins`) and ES2018 regex flag targeting. **All pre-existing on baseline a78167a; none involve `src/middleware.ts` or `src/middleware.test.ts`.**

Per SCOPE BOUNDARY: not fixed here. They predate this plan and belong to a dedicated type-fixture / test-config cleanup plan outside Phase 27.

## Self-Check: PASSED

- `src/middleware.ts` exists and contains the migration: `grep -F "sessionClaims?.metadata?.role" src/middleware.ts` matches.
- `src/middleware.test.ts` exists and contains the rewritten test: `grep -F "checks role for demo routes via sessionClaims" src/middleware.test.ts` matches.
- Commit `0448023` (RED) exists: `git log --oneline | grep -q 0448023` → found.
- Commit `dbc9ecb` (GREEN) exists: `git log --oneline | grep -q dbc9ecb` → found.
- `.planning/phases/27-role-assignment-and-testing/27-02-SUMMARY.md` will be present at commit time (this file).
