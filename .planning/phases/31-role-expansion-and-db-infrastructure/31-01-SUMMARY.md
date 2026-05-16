---
phase: 31
plan: 01
subsystem: auth
tags: [auth, role, clerk, types, test-fixtures, tdd, planning-doc]
dependency_graph:
  requires: []
  provides:
    - "Role union now includes 'mill_operator' (compile-time)"
    - "checkRole(role: Role) => Promise<boolean> exported from src/lib/auth.ts (server-only)"
    - "mockMillOperatorSession + mockDualRoleSession factories in src/test/fixtures/clerkAuth.ts"
    - "REQUIREMENTS.md AUTH-02 + AUTH-03 aligned with D-04 + D-05 (locked text)"
    - "ROADMAP.md Phase 31 SC#2 + SC#4 aligned with D-15 + D-16 (locked text)"
  affects:
    - "Plan 31-04 src/app/page.tsx — can now import { checkRole } from '@/lib/auth'"
    - "Plan 31-04 src/app/page.test.tsx — can now seed mockMillOperatorSession / mockDualRoleSession"
    - "Plan 31-05 Clerk Dashboard runbook — multi-role demo user is the canonical D-13 path"
tech_stack:
  added: []
  patterns:
    - "TDD RED→GREEN→REFACTOR with jest mockAuth sentinel-throw redirect pattern"
    - "Role union as additive single-token extension (TS literal type)"
    - "Server-only role-predicate as boolean prop computed in RSC"
    - "Multi-role membership via Array.prototype.includes (no flag fields)"
key_files:
  created: []
  modified:
    - src/types/clerk.d.ts
    - src/lib/auth.ts
    - src/lib/auth.test.ts
    - src/test/fixtures/clerkAuth.ts
    - src/test/fixtures/clerkAuth.test.ts
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
decisions:
  - "Honored D-01..D-05: mill_operator is an edit role (not page gate); page-level guard via auth() + redirect('/sign-in') only; checkRole computes canEdit prop; mutating server actions own enforcement (Phase 33); no middleware coarse-gate."
  - "Honored D-12..D-14: fixture factories shipped for both single-role (mill_operator only) and multi-role (demo + mill_operator) sessions to unblock Plan 31-04 page tests."
  - "Honored D-15..D-17: REQUIREMENTS.md AUTH-02/AUTH-03 + ROADMAP.md SC#2/SC#4 rewritten verbatim from CONTEXT.md decision text."
  - "checkRole branch logic matches requireRole's claim-read path exactly (sessionClaims?.metadata?.roles?.includes(role) ?? false) so the two helpers stay in sync as the JWT claim shape evolves."
metrics:
  duration: "~10 minutes wall clock"
  completed: 2026-05-12
requirements-completed: [AUTH-01, AUTH-02, AUTH-03]
---

# Phase 31 Plan 01: Role Expansion and DB Infrastructure — Wave 1A (auth foundation) Summary

**One-liner:** Added `'mill_operator'` to the `Role` union, shipped the server-only boolean predicate `checkRole(role)` from `src/lib/auth.ts`, extended Clerk auth test fixtures with `mockMillOperatorSession` / `mockDualRoleSession`, and rewrote REQUIREMENTS.md AUTH-02/AUTH-03 + ROADMAP.md Phase 31 SC#2/SC#4 per CONTEXT.md D-04/D-05/D-15/D-16/D-17.

## Tasks Completed

| # | Task | Type | Commits |
|---|------|------|---------|
| 1 | Extend Role union to include `'mill_operator'` + new requireRole TDD cases | TDD (RED→GREEN) | fc45865, 285d9ef |
| 2 | Add `checkRole` boolean predicate to `src/lib/auth.ts` | TDD (RED→GREEN→REFACTOR) | eade8d7, 5966f89, 9330b2e |
| 3 | Extend Clerk auth test fixtures: `mockMillOperatorSession` + `mockDualRoleSession` | TDD (RED→GREEN→REFACTOR) | 49e6b6e, 0cf4423, e7b0ca9 |
| 4 | Rewrite REQUIREMENTS.md AUTH-02/AUTH-03 + ROADMAP.md SC#2/SC#4 per D-15/D-16/D-17 | docs | 16b9785 |

**Total: 9 commits across 4 tasks (1 RED + 1 GREEN; 1 RED + 1 GREEN + 1 REFACTOR; 1 RED + 1 GREEN + 1 REFACTOR; 1 docs).**

## What Was Built

### `src/types/clerk.d.ts` — `Role` union widened
Single-token additive change: union now `'demo' | 'admin' | 'user' | 'mill_operator'`. JSDoc updated with the v2.0 edit-role bullet documenting the read-only-vs-edit split (D-01).

The `declare global { interface CustomJwtSessionClaims { metadata: { roles?: Role[]; }; } }` block is unchanged — `Role[]` automatically picks up the new literal.

### `src/lib/auth.ts` — `checkRole(role: Role): Promise<boolean>` exported
Read-only counterpart to `requireRole`. Same JWT-claim read path (`sessionClaims?.metadata?.roles?.includes(role)`), no `redirect` side-effect. Two lines of body, fully covered by 5 TDD cases:
- returns `true` when role present (single-role session)
- returns `false` when role absent
- returns `false` when `metadata` missing
- returns `true` for each of two roles in a dual-role session (multi-role membership)
- returns `false` when `userId` is `null` (unauthenticated)

JSDoc cross-references `requireRole`, declares the helper server-only, and ships the canonical Phase 31 `@example` snippet matching the planned `src/app/page.tsx` shape (D-03).

### `src/lib/auth.test.ts` — 8 cases (was 5)
Added 3 new `requireRole('mill_operator')` cases (single-role pass, missing-role redirect, dual-role pass) and 5 new `checkRole` cases in a new `describe('checkRole', ...)` block. Existing 5 `requireRole` cases unchanged; no regression. The mock setup (sentinel-throw redirect via `Object.assign(new Error('NEXT_REDIRECT'), { url })`) is unchanged — the canonical Phase 27 pattern is preserved.

### `src/test/fixtures/clerkAuth.ts` — 2 new exported factories
- `mockMillOperatorSession()` — seeds `mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { roles: ['mill_operator'] } } })`. Mirrors `mockDemoSession` shape.
- `mockDualRoleSession()` — seeds `roles: ['demo', 'mill_operator']`. This is the canonical D-13 multi-role coverage path: it verifies `Array.prototype.includes` semantics for users with more than one role and matches the runtime shape the demo user will take after the Plan 31-05 operator action.

`mockNonDemoSession(role: Exclude<Role, 'demo'> = 'user')` signature unchanged — the `Exclude<Role, 'demo'>` constraint auto-widened to include `'mill_operator'` once the union grew. No call-site changes required.

### `src/test/fixtures/clerkAuth.test.ts` — 10 cases (was 8)
Added 2 contract tests asserting the new factories resolve `mockAuth()` with the correct `userId` and `roles` array shape, including dual-role `.toContain('demo')` AND `.toContain('mill_operator')` assertions.

### `.planning/REQUIREMENTS.md` — AUTH-02 and AUTH-03 rewritten
Verbatim from D-04 and D-05:
- **AUTH-02**: "Mutating server actions (Phase 33: transitions, bulk import) enforce `await requireRole('mill_operator')` as the canonical server-side guard for v2.0 write operations. `/` page-level enforcement is NOT used — any authenticated user may view `/` in read-only mode."
- **AUTH-03**: "Middleware adds `/` to the `auth.protect()` flow only (already covered by the existing `!isPublicRoute(request)` branch). NO `mill_operator` coarse-gate matcher mirroring `/demo/*`."

AUTH-01 and AUTH-04 unchanged. DATA-* bullets unchanged.

### `.planning/ROADMAP.md` — Phase 31 SC#2 and SC#4 rewritten
Verbatim from D-15 and D-16:
- **SC#2**: "An authenticated user without `mill_operator` sees `/` in read-only mode (edit affordances hidden); mutating server actions (Phase 33) reject without `mill_operator`."
- **SC#4**: "`DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) set in `.env.local`; `drizzle.config.ts` references `DATABASE_URL_UNPOOLED` for migrations. Vercel env-var provisioning deferred to Phase 34 first deploy."

SC#1, SC#3, SC#5 unchanged. Other phases (32-35) untouched.

## Verification

**Per-task automated `<verify>` commands all pass:**

- Task 1: `npx tsc --noEmit && npm test -- --testPathPatterns='auth\.test' --watchAll=false` — exits 0; 8/8 src/lib/auth.test.ts cases pass at the GREEN gate.
- Task 2: `npm test -- --testPathPatterns='src/lib/auth\.test' --watchAll=false` — exits 0; 13/13 src/lib/auth.test.ts cases (5 requireRole + 3 new mill_operator + 5 new checkRole) pass at REFACTOR gate.
- Task 3: `npm test -- --testPathPatterns='clerkAuth\.test' --watchAll=false` — exits 0; 10/10 fixture tests pass at REFACTOR gate.
- Task 4: All four grep assertions in the `<verify>` block return non-zero matches.

**Plan-level `<verification>` block (all confirmed):**

- `npx tsc --noEmit` exits 0.
- `npm test -- --testPathPatterns='auth|clerkAuth' --watchAll=false` exits 0 with 23 tests passing (13 auth + 10 clerkAuth).
- `grep -l 'mill_operator' src/types/clerk.d.ts src/lib/auth.ts src/lib/auth.test.ts src/test/fixtures/clerkAuth.ts src/test/fixtures/clerkAuth.test.ts` returns all 5 files.
- `grep -c 'mill_operator' .planning/REQUIREMENTS.md` returns 5 (≥ 4 required).
- `grep -c 'read-only mode' .planning/ROADMAP.md` returns 1 (≥ 1 required).

**Plan `<success_criteria>` — all satisfied:**

- [x] `'mill_operator'` is a member of the `Role` union; `tsc --noEmit` clean
- [x] `checkRole(role: Role): Promise<boolean>` exported from `src/lib/auth.ts` and tested with 5 cases including multi-role and unauthenticated branches
- [x] `mockMillOperatorSession()` and `mockDualRoleSession()` exist; their contract tests pass
- [x] REQUIREMENTS.md AUTH-02 + AUTH-03 rewritten per D-04 + D-05
- [x] ROADMAP.md Phase 31 SC#2 + SC#4 rewritten per D-15 + D-16
- [x] No regression — all 13 pre-existing tests still pass

## TDD Gate Compliance

This plan is `type: tdd`. All three behavior-adding tasks (Tasks 1, 2, 3) followed RED → GREEN [→ REFACTOR]:

- Task 1: `test(31-01): add failing requireRole('mill_operator') test cases` (fc45865) → `feat(31-01): add 'mill_operator' to Role union` (285d9ef). RED gate observed via `TS2345: Argument of type '"mill_operator"' is not assignable to parameter of type 'Role'`.
- Task 2: `test(31-01): add failing checkRole test cases` (eade8d7) → `feat(31-01): add checkRole boolean predicate` (5966f89) → `refactor(31-01): add JSDoc to checkRole` (9330b2e). RED gate observed via `TypeError: (0 , _auth.checkRole) is not a function` — 5/5 new cases failed; existing 8 still passed.
- Task 3: `test(31-01): add failing mockMillOperatorSession + mockDualRoleSession fixture tests` (49e6b6e) → `feat(31-01): add mill_operator + dual-role session fixtures` (0cf4423) → `refactor(31-01): document new session fixtures` (e7b0ca9). RED gate observed via `TypeError: (0 , _clerkAuth.mockMillOperatorSession/mockDualRoleSession) is not a function` — 2/2 new cases failed; existing 8 still passed.

Gate sequence in `git log --oneline` shows `test(...)` immediately preceding `feat(...)` for every behavior-adding pair. Task 4 is `type: tdd="false"` (doc-only) and is exempt from the RED gate.

## Deviations from Plan

**None — plan executed exactly as written.**

Every step from the `<action>` blocks of all four tasks executed without modification:
- The exact RED→GREEN sequence specified by `<behavior>` was followed.
- The string literals required by `<acceptance_criteria>` (e.g., `roles: ['mill_operator']`, `roles: ['demo', 'mill_operator']`, `'mill_operator'` as union member) match the implementation byte-for-byte.
- The decision-text replacements for Task 4 are verbatim from CONTEXT.md D-04, D-05, D-15, D-16.
- No surprise pre-existing failures were uncovered (baseline `auth.test|clerkAuth.test` run was 13/13 green).
- No auto-fixes triggered (no Rule 1/2/3 deviations).

## Authentication Gates

None — this plan only touches type definitions, server-only utility code, test fixtures, and planning docs. No external service calls, no `await requireRole(...)` invoked in production paths, no Clerk Dashboard or Neon provisioning. (Those operator actions are scheduled for Plan 31-05.)

## Known Stubs

None. No empty arrays, placeholder values, or unwired UI components introduced. `checkRole` is a complete, fully-tested production helper. The fixture factories are complete factories — they always resolve `mockAuth` with a valid session shape.

## Threat Surface Scan

No new threat surface beyond the four threats documented in the plan's `<threat_model>` block. All four threats are addressed:

| Threat ID | Status |
|-----------|--------|
| T-31-01-01 (Tampering — forged role string) | Accepted as documented; type union is compile-time only, runtime integrity owned by Clerk JWT signature. |
| T-31-01-02 (Info disclosure — client import of checkRole) | Mitigated: `auth()` from `@clerk/nextjs/server` throws on client; JSDoc explicitly tags helper as server-only. |
| T-31-01-03 (EoP — buggy checkRole returns true incorrectly) | Mitigated: 5 TDD cases cover all four decision branches (true, false-no-role, false-no-metadata, false-unauthenticated) plus the multi-role membership case. |
| T-31-01-04 (Repudiation — REQUIREMENTS/ROADMAP edits without rationale) | Mitigated: Task 4 commit message names the decision IDs (D-15, D-16, D-17 in header; D-04, D-05 in body) verbatim. |

## Performance / Build Impact

Zero runtime impact: no new dependencies, no new modules in any bundle, no new server-side calls. The only code path that runs in production is `checkRole`, which is shape-identical to the existing `requireRole` claim read (`sessionClaims?.metadata?.roles?.includes(role)`) and will only be exercised after Plan 31-04 wires it into `src/app/page.tsx`.

## Follow-ups for Downstream Plans

- **Plan 31-04** can now import `checkRole` (`import { checkRole } from '@/lib/auth'`) and seed its page test using `mockMillOperatorSession()`, `mockDualRoleSession()`, plus the existing `mockNonDemoSession()` / `mockUnauthenticatedSession()`. The RED gate for 31-04 Task 1 is unblocked.
- **Plan 31-05** (operator runbook) is the canonical place to update the Clerk Dashboard publicMetadata for `e2e-demo+clerk_test` to `{ roles: ['demo', 'mill_operator'] }` (D-13) — the fixture factory mirrors this shape exactly so unit tests stay in sync with the operator action.

## Self-Check: PASSED

**Files (all required artifacts present and committed):**

- src/types/clerk.d.ts — FOUND (modified, mill_operator union member committed in 285d9ef)
- src/lib/auth.ts — FOUND (modified, checkRole + JSDoc committed in 5966f89 + 9330b2e)
- src/lib/auth.test.ts — FOUND (modified, 8 new TDD cases committed in fc45865 + eade8d7)
- src/test/fixtures/clerkAuth.ts — FOUND (modified, 2 new factories + JSDoc committed in 0cf4423 + e7b0ca9)
- src/test/fixtures/clerkAuth.test.ts — FOUND (modified, 2 new contract tests committed in 49e6b6e)
- .planning/REQUIREMENTS.md — FOUND (modified, AUTH-02/AUTH-03 rewritten in 16b9785)
- .planning/ROADMAP.md — FOUND (modified, SC#2/SC#4 rewritten in 16b9785)

**Commits (all on worktree-agent-a64535417e7056ce1, verified via `git log --oneline 073f89d..HEAD`):**

- fc45865 — FOUND (Task 1 RED)
- 285d9ef — FOUND (Task 1 GREEN)
- eade8d7 — FOUND (Task 2 RED)
- 5966f89 — FOUND (Task 2 GREEN)
- 9330b2e — FOUND (Task 2 REFACTOR)
- 49e6b6e — FOUND (Task 3 RED)
- 0cf4423 — FOUND (Task 3 GREEN)
- e7b0ca9 — FOUND (Task 3 REFACTOR)
- 16b9785 — FOUND (Task 4 docs)

No missing artifacts; no failed assertions; no uncommitted changes.
