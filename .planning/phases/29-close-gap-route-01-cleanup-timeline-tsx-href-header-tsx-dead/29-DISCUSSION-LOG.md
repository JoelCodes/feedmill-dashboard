# Phase 29: ROUTE-01 cleanup — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 29-close-gap-route-01-cleanup-timeline-tsx-href-header-tsx-dead
**Areas discussed:** Scope, E2E specs, Header dead branches, Regression prevention, checkRole removal, Settings refactor depth, Test pipeline tech debt, Done check

---

## Scope (which audit items are in this phase)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep scope as named — only the 4 enumerated items | INT-01 (Timeline), INT-02 (settings→DashboardLayout), INT-04+05 (stale E2E specs), INT-06 (Header dead branches). Excludes INT-03 (audit marks intentional) and test-pipeline tech debt (audit marks pre-existing). | ✓ |
| Also remove unused checkRole export (INT-03) | Delete checkRole from src/lib/auth.ts and its 8 unit tests. Audit calls this 'None now (intentional API surface)' — reversing that judgment. | ✓ |
| Also fix test-pipeline tech debt | Jest e2e/ scanning, 14 settings tests, tsc fixture errors. Marked 'pre-existing on baseline' in audit. | ✓ |

**User's choice:** All three — broaden the cleanup to include INT-03 and the test-pipeline tech debt on top of the 4 enumerated audit items.
**Notes:** 14 failing /settings tests subsequently scoped OUT under "Settings refactor depth" below — they're test-rewrite work, not test-pipeline-config work.

---

## E2E specs (production-smoke + route-protection)

| Option | Description | Selected |
|--------|-------------|----------|
| Update paths to /demo/* | Keep both specs, repoint URLs from /orders → /demo/orders, etc. Preserves coverage; matches clean-break-no-redirects philosophy from Phase 26 D-01. | |
| Delete both — Phase 27 replaced coverage | route-protection.spec.ts is largely superseded; production-smoke is fragile (depends on real Clerk login). Deletes ~50 lines. | |
| Hybrid: update route-protection, delete production-smoke | route-protection still useful with /demo/* paths. production-smoke depends on real Clerk + custom domain (deferred per v1.4) — currently more friction than value. | ✓ |

**User's choice:** Hybrid.
**Notes:** Drives D-09 (delete production-smoke) and D-10 (update route-protection paths) in CONTEXT.md.

---

## Header dead branches

| Option | Description | Selected |
|--------|-------------|----------|
| Delete the 3 legacy lines outright | Lines 33-36 are unreachable (routes 404). Fall through to existing `return 'Dashboard';` default. Smallest diff, matches clean-break philosophy. | ✓ |
| Delete + add unit test asserting unknown paths return 'Dashboard' | Same deletion plus regression test against re-introduction. | |
| Replace with a single 'Page Not Found' fallback | Changes default behavior — `/sign-in` and similar currently return 'Dashboard'. | |

**User's choice:** Delete outright.
**Notes:** Becomes D-11 in CONTEXT.md. Regression-prevention slot was filled by the Timeline component test (D-06) instead.

---

## Regression prevention for INT-01

| Option | Description | Selected |
|--------|-------------|----------|
| Component test on Timeline.tsx asserting href shape | Jest test asserting the order-event Link's href matches /demo/orders?selected=*. Fast, no Playwright dependency. | ✓ |
| Add E2E test: demo user → customer detail → click order → /demo/orders | Highest fidelity, mirrors FLOW-01. Requires Playwright + demo user fixture; slower and more brittle. | |
| No new test | Rely on integration-checker audit cadence. | |

**User's choice:** Component test.
**Notes:** Becomes D-06 in CONTEXT.md. The audit caught this exact bug class via integration check; a component test makes the catch automated on every test run.

---

## checkRole removal depth (INT-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Delete export + 8 unit tests + update ACCESS-02 in REQUIREMENTS.md | Audit marks checkRole 'tested but unused.' Updating REQUIREMENTS.md keeps the audit trail honest. | ✓ |
| Delete export and tests; leave REQUIREMENTS.md alone | Faster but creates small documentation drift. | |
| Keep checkRole, mark as 'intentional API surface' in code comment | Reverses the scope decision. | |

**User's choice:** Full removal incl. REQUIREMENTS.md edit.
**Notes:** Becomes D-12 and D-13 in CONTEXT.md.

---

## /settings refactor depth (INT-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Layout swap only — wrap in DashboardLayout, leave tests alone | INT-02 only requires the layout fix. 14 failing tests are a distinct ClerkProvider-wrapper concern. | ✓ |
| Layout swap + fix the 14 failing tests in same phase | Bundled cleanup, but doubles test-rewriting effort. | |
| Layout swap + delete the failing test file | Faster if those tests are dead weight. | |

**User's choice:** Layout swap only.
**Notes:** Becomes D-07 + D-08 in CONTEXT.md. 14 failing tests recorded under Deferred Ideas.

---

## Test pipeline tech debt (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| jest.config.ts: add testPathIgnorePatterns for e2e/ | Trivial 1-line config fix. Unblocks plain `npm test`. | ✓ |
| Fix 21 tsc errors in test fixtures | Fixture drift from upstream type changes (customerId, activeBins, regex es2018 flag). | ✓ |
| Fix .env.local PLAYWRIGHT_BASE_URL leak to demo-user/norole-user projects | Playwright project-config issue. | ✓ |
| Fix Tailwind v4 @source pattern for .planning/**/*.md exclusion | Cosmetic dev-time perf fix. | ✓ |

**User's choice:** All four.
**Notes:** Becomes D-14 through D-17 in CONTEXT.md.

---

## Done check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Proceed to write CONTEXT.md. | ✓ |
| Explore more gray areas | Surface 2-3 more decisions. | |

**User's choice:** Ready.
**Notes:** No additional decisions needed; cleanup phase is well-bounded by the audit's enumerated gaps.

---

## Claude's Discretion

- **Commit granularity:** Planner/executor decides per the project's standard "atomic commits per logical concern" pattern. Expect ~7–9 commits.
- **Verification depth:** Planner decides which existing tests to re-run vs which need new ones; only mandatory new test is D-06 (Timeline href).
- **Exact line numbers/file paths for tsc fixture errors:** Planner should grep to locate; line numbers in the audit are time-of-audit (commit 5eb6b3a) and may drift.

## Deferred Ideas

- Fix the 14 pre-existing failing `/settings` page tests (needs ClerkProvider test wrapper rework) — own follow-up phase.
- Replace Header.tsx's hardcoded `getPageTitle` switch with a route metadata pattern — future quality phase.
- Re-add a `checkRole` (or similar non-redirecting role check) when a production feature actually needs one.
- Add an integration check for "all Link/href strings in src/**/*.tsx resolve to existing routes" — tooling/lint phase candidate.
