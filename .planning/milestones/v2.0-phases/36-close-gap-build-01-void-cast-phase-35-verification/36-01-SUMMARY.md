---
phase: 36-close-gap-build-01-void-cast-phase-35-verification
plan: 01
subsystem: components
tags:
  - nuqs
  - startTransition
  - typescript
  - regression-test
  - build-fix
requirements:
  - PROD-06
provides:
  - "BUILD-01 closed: BlockedAlertBand.tsx:44 startTransition callback no longer leaks Promise<URLSearchParams> into VoidOrUndefinedOnly brand"
  - "src/components/BlockedAlertBand.test.tsx Test 12 source-grep regression guard against future removal of the void cast"
requires:
  - "src/components/BlockedExceptionList.tsx:35 (canonical void-cast reference pattern)"
  - "src/components/DrawerSkeleton.test.tsx:38-45 (canonical fs.readFileSync source-grep test pattern)"
affects:
  - "ROADMAP Phase 36 SC#1 (npm run build exits 0) — satisfied"
  - "ROADMAP Phase 36 SC#2 (regression test covers void-cast path) — satisfied"
tech-stack-added: []
tech-stack-patterns:
  - "void operator coercion of Promise<URLSearchParams> → undefined inside React startTransition callback"
  - "Source-grep regression test using fs.readFileSync + path.resolve(__dirname, ...) (worktree-safe; @/ jest alias would resolve to main project root per 35-LEARNINGS.md)"
key-files-created: []
key-files-modified:
  - "src/components/BlockedAlertBand.tsx (line 44: inserted `void ` operator)"
  - "src/components/BlockedAlertBand.test.tsx (appended Test 12 BUILD-01 regression guard)"
decisions:
  - "Used expression+void form (`() => void setQuery(...)`) over block-form (`() => { void setQuery(...); }`) to byte-match the canonical reference at BlockedExceptionList.tsx:35 (per 36-RESEARCH.md Risk R7)"
  - "Source-grep regression test uses fs.readFileSync + path.resolve(__dirname, 'BlockedAlertBand.tsx') rather than the `@/` jest alias because in worktree mode the alias resolves to the main project root, defeating per-worktree source-content assertions (per 35-LEARNINGS.md)"
metrics:
  duration_seconds: "n/a (sub-minute one-line fix wave; build re-runs dominate)"
  tasks_completed: 2
  files_changed: 2
  commits: 2
  tests_added: 1
  tests_passing: 7
completed: 2026-05-15
---

# Phase 36 Plan 01: Close BUILD-01 — void-cast at BlockedAlertBand.tsx:44 Summary

One-line `void` operator inserted at `src/components/BlockedAlertBand.tsx:44` to coerce the nuqs `setQuery` `Promise<URLSearchParams>` return into the `undefined` brand expected by React's `startTransition` callback contract; belt-and-suspended by a new source-grep regression test (Test 12) modeled on the `DrawerSkeleton.test.tsx:38-45` pattern. `npm run build` now exits 0 and 7/7 `BlockedAlertBand.test.tsx` tests pass.

## What Was Built

### Task 1 (TDD RED) — Regression test for void cast

- Appended **Test 12** to `src/components/BlockedAlertBand.test.tsx` inside the existing `describe('BlockedAlertBand', ...)` block, immediately after the T10b option-assertion test.
- Test mechanics: `fs.readFileSync` + `path.resolve(__dirname, 'BlockedAlertBand.tsx')` → `expect(content).toMatch(/startTransition\(\(\) => void setQuery/)`.
- Pattern source: `src/components/DrawerSkeleton.test.tsx:38-45` Test 7 (CommonJS `require('fs')` / `require('path')`, `path.resolve(__dirname, ...)`).
- Worktree-safe path resolution: per `35-LEARNINGS.md`, the `@/` jest alias resolves to the main project root in worktree mode, breaking per-worktree source-content assertions; `__dirname` resolution avoids that hazard.
- Leading comment block cites `BlockedExceptionList.tsx:35` as the canonical reference fix pattern and explains the BUILD-01 rationale (`Promise<URLSearchParams>` leaks into `VoidOrUndefinedOnly` `() => void | Promise<void>` brand).
- **RED gate confirmed**: `npm test -- --testPathPatterns='BlockedAlertBand'` reported `Tests: 1 failed, 6 passed, 7 total` — Test 12 failed with a "received content did not match regex" error; the other 6 tests (Tests 7-11 + T10b) passed.
- Commit `3bf91a4`: `test(36-01): add source-grep regression for BlockedAlertBand void-cast (BUILD-01 RED)`.

### Task 2 (TDD GREEN) — One-character void cast at BlockedAlertBand.tsx:44

- Diff is exactly one whitespace-bounded insertion of the four-character `void ` token (lowercase + single space) between the inner arrow `=>` and `setQuery`.
- Before: `onClick={() => startTransition(() => setQuery({ order: order.id }))}`
- After:  `onClick={() => startTransition(() => void setQuery({ order: order.id }))}`
- No other file content changed: imports (line 20), the `useOrderQuery` hook call (line 32), the JSX scaffolding, and the docblock all remain byte-identical.
- Pattern alignment: the corrected line shape byte-matches `src/components/BlockedExceptionList.tsx:35` (`startTransition(() => void setQuery({ order: id }))`).
- **GREEN gate confirmed**:
  - `npm test -- --testPathPatterns='BlockedAlertBand'` → `Tests: 7 passed, 7 total` (Tests 7-11, T10b, Test 12).
  - `npm run build` → exit 0; "Compiled successfully in 2.0s", "Running TypeScript ..." (no TS2322), 10/10 static pages generated, route table emitted.
- Commit `311d546`: `fix(36-01): add void cast to BlockedAlertBand.tsx:44 startTransition callback (BUILD-01 GREEN)`.

## How It Was Built

- **TDD discipline**: RED commit lands first containing only the failing test; GREEN commit lands second containing only the production-source fix. Each commit verifies independently — `git checkout 3bf91a4 -- src/components/BlockedAlertBand.test.tsx && npm test -- --testPathPatterns='BlockedAlertBand'` would reproduce the RED failure, and `git checkout 311d546 -- .` would reproduce the GREEN pass.
- **No deviations from the plan**. The plan as written executed exactly. No deviation-rule (Rule 1/2/3/4) auto-fixes were needed; no architectural questions arose.
- **Worktree env workaround**: the `.env.local` runtime config is gitignored and was not present in the worktree initially. Initial `npm run build` reached the `Running TypeScript ...` gate cleanly (proving the TS2322 BUILD-01 root cause is fixed) but then failed at `Collecting page data` because `DATABASE_URL` was missing. Copied `.env.local` from the main project root (untracked, gitignored, not part of any commit) and re-ran `npm run build`; full build exited 0 with all 10 routes generated. This is an environment provisioning quirk of the worktree, not a deviation from the plan or a code-level finding.

## Verification Snapshot

| Gate | Command | Result |
|------|---------|--------|
| Regression test isolated | `npm test -- --testPathPatterns='BlockedAlertBand'` | 7 passed, 7 total |
| TypeScript compilation | `npm run build` (TS step) | "✓ Compiled successfully" + "Running TypeScript ..." (no TS2322) |
| Full build | `npm run build` (with `.env.local` present) | exit 0; 10/10 routes generated |
| Source shape (post-fix) | `grep -n "startTransition(() => void setQuery" src/components/BlockedAlertBand.tsx` | 1 match at line 44 |
| Source shape (pre-fix gone) | `grep -n "startTransition(() => setQuery" src/components/BlockedAlertBand.tsx` | no matches |
| Pattern alignment | byte-match against `src/components/BlockedExceptionList.tsx:35` | identical inner-arrow shape |

## Deviations from Plan

None — the plan executed exactly as written. No Rule 1 (auto-fix bug), Rule 2 (auto-add missing critical functionality), Rule 3 (auto-fix blocker), or Rule 4 (architectural question) actions were taken.

## Key Decisions Made During Execution

1. **Expression+void form preferred over block-form** (already specified in plan + RESEARCH Risk R7) — selected `() => void setQuery(...)` instead of `() => { void setQuery(...); }` to byte-match the canonical reference at `BlockedExceptionList.tsx:35` and keep the diff to one whitespace-bounded token.
2. **Source-grep test uses `__dirname` not the `@/` jest alias** (already specified in plan + interfaces) — per `35-LEARNINGS.md`, in worktree mode the `@/` alias resolves to the main project root, defeating per-worktree source-content assertions. `path.resolve(__dirname, 'BlockedAlertBand.tsx')` resolves to the worktree-local source unambiguously.

## Threat Model Posture

`<threat_model>` in the plan classifies this change as `T-36-01: (no new threat) … accept`. The `void` operator coerces a Promise return to `undefined` at runtime; no data crosses any trust boundary differently than before, no new auth/authz path is introduced, no input handling is altered. The pre-existing T-34-03-02 mitigation (`parseAsString` URL-param safety in `useOrderQuery.ts` + parameterised Drizzle in `getOrderById`) remains in force. No new threat flags emerged during execution.

## Files Created / Modified

| File | Action | Lines | Commit |
|------|--------|-------|--------|
| `src/components/BlockedAlertBand.test.tsx` | modified (appended Test 12 + comment block) | +26 / −0 | `3bf91a4` |
| `src/components/BlockedAlertBand.tsx` | modified (one-token insertion at line 44) | +1 / −1 | `311d546` |
| `.planning/phases/36-close-gap-build-01-void-cast-phase-35-verification/36-01-SUMMARY.md` | created | this file | metadata commit |

## Self-Check: PASSED

- `[ -f src/components/BlockedAlertBand.test.tsx ]` → FOUND
- `[ -f src/components/BlockedAlertBand.tsx ]` → FOUND
- `[ -f .planning/phases/36-close-gap-build-01-void-cast-phase-35-verification/36-01-SUMMARY.md ]` → FOUND (this file)
- `git log --oneline --all | grep -q '3bf91a4'` → FOUND (RED commit)
- `git log --oneline --all | grep -q '311d546'` → FOUND (GREEN commit)
- `grep -n "startTransition(() => void setQuery" src/components/BlockedAlertBand.tsx` → 1 match at line 44 (FOUND)
- `grep -n "startTransition(() => setQuery" src/components/BlockedAlertBand.tsx` → 0 matches (correctly absent)
- `npm test -- --testPathPatterns='BlockedAlertBand'` → 7/7 passing
- `npm run build` → exit 0 (with `.env.local` provisioned)

All claims in this summary are verifiable against the committed source and the two recorded commit hashes.
