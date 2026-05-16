---
phase: 33-server-actions-queries-and-bulk-import
plan: "04"
subsystem: server-actions
tags:
  - actions
  - server-actions
  - state-machine
  - optimistic-concurrency
  - tdd
dependency_graph:
  requires:
    - 33-02  # read-layer queries (getProductionOrders, getOrderById) + production-orders cache tag
  provides:
    - transitionToMixing (TRANS-01)
    - completeOrder (TRANS-02)
    - blockOrder (TRANS-03)
    - resumeFromBlocked (TRANS-04)
    - TransitionResult type (D-01, D-02)
  affects:
    - 33-05  # import actions may reuse TransitionResult pattern
    - 34     # Phase 34 UI components import these actions via useActionState
tech_stack:
  added: []
  patterns:
    - server-action discriminated union (TransitionResult)
    - optimistic-concurrency via .returning() (not .rowsAffected)
    - requireRole inner-guard AUTH-02 pattern
    - revalidateTag('production-orders', 'max') cache invalidation
    - non-transactional UPDATE+INSERT with server error fallback
key_files:
  created:
    - src/actions/transitions.ts
  modified:
    - src/actions/__tests__/transitions.test.ts
    - docs/security-patterns.md
decisions:
  - "revalidateTag called with ('production-orders', 'max') per Next.js 16 required two-arg signature"
  - "Test mock refactored to lazy-wrapper pattern (arrow functions in factory) to fix babel-jest TDZ with const mock* declarations"
  - "REFACTOR skips helper extraction; JSDoc blocks already in GREEN implementation suffice for self-documentation"
metrics:
  duration: ~40 min
  completed: "2026-05-13"
  completed_tasks: 3
  files: 3
requirements-completed:
  - TRANS-01
  - TRANS-02
  - TRANS-03
  - TRANS-04
  - TRANS-05
  - TRANS-06
  - TRANS-07
---

# Phase 33 Plan 04: Transition Server Actions Summary

**One-liner:** Four optimistic-concurrency server actions (`transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`) with discriminated-union `TransitionResult`, locked conflict message, and mandatory `revalidateTag('production-orders', 'max')` closing ROADMAP SC#1–SC#4.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — Write contract tests | c33687f (prior agent on main) | src/actions/__tests__/transitions.test.ts |
| 2 | GREEN — Implement transitions.ts | 2efa1df | src/actions/transitions.ts, src/actions/__tests__/transitions.test.ts |
| 3 | REFACTOR — Security patterns doc | 117e3e8 | docs/security-patterns.md |

## Exported Contract

```typescript
// src/actions/transitions.ts

'use server';

export type TransitionResult =
  | { ok: true }
  | { ok: false; code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server'; message: string };

export async function transitionToMixing(orderId: string, version: number): Promise<TransitionResult>;
export async function completeOrder(orderId: string, version: number): Promise<TransitionResult>;
export async function blockOrder(orderId: string, version: number, reason: string): Promise<TransitionResult>;
export async function resumeFromBlocked(orderId: string, version: number, toState: 'Mixing' | 'Pending'): Promise<TransitionResult>;
```

**Locked conflict message (D-02, ROADMAP SC#2):**
```
'Order was modified by another user. Please refresh.'
```

## TDD Gate Compliance

- RED gate: commit `c33687f` (prior agent, on main before this worktree's base)
- GREEN gate: commit `2efa1df` — all 33 contract tests pass
- REFACTOR gate: commit `117e3e8` — security-patterns audit table extended, tests remain green

## Requirements Closed

- TRANS-01: transitionToMixing (Pending → Mixing)
- TRANS-02: completeOrder (Mixing → Completed)
- TRANS-03: blockOrder (Pending|Mixing → Blocked, reason REQUIRED at TS level)
- TRANS-04: resumeFromBlocked (Blocked → Mixing|Pending)
- TRANS-05: every successful transition writes one orderEvents row
- TRANS-06: stale-version UPDATE returns zero rows → locked conflict response
- TRANS-07: revalidateTag('production-orders') called before every return

ROADMAP success criteria closed:
- SC#1: every transition writes order_events row
- SC#2: locked conflict message text + optimistic-concurrency via version column
- SC#3: blockOrder(orderId, version, reason) + resumeFromBlocked dual-target
- SC#4: revalidateTag mandatory

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test mock `const mockDb = { select: jest.fn(), ... }` causes TDZ in Jest 30**

- **Found during:** Task 2 (GREEN) — after transitions.ts was created, the test suite failed with `ReferenceError: Cannot access 'mockDb' before initialization` instead of all-green
- **Issue:** `const mockDb = { select: jest.fn(), ... }` is an object literal containing `jest.fn()` calls; Babel's `scope.isPure()` returns false for this (call expressions are not pure), so `babel-plugin-jest-hoist` does NOT hoist the declaration above the `jest.mock()` factory that references it. Once the module exists, the factory runs during hoisting and hits the TDZ.
- **Fix:** Replaced with Pattern 3 (individual `const mockSelect = jest.fn()` etc.) using lazy arrow-function wrappers in the factory (`select: (...args) => mockSelect(...args)`). This defers access to `mockSelect` until call-time, after module initialization. Test assertions that formerly used `db.insert` / `db.values` / `db.select` as jest mocks were updated to use `mockInsert` / `mockValues` / `mockSelect` directly.
- **Files modified:** `src/actions/__tests__/transitions.test.ts`
- **Commit:** 2efa1df

**2. [Rule 2 - TypeScript] `revalidateTag` requires two arguments in Next.js 16**

- **Found during:** Task 2 (GREEN) — `npx tsc --noEmit` produced `Expected 2 arguments, but got 1` for all revalidateTag calls
- **Issue:** Next.js 16.1.6 changed `revalidateTag(tag: string, profile: string | CacheLifeConfig)` to require the `profile` second argument. Single-arg form still works at runtime (emits a deprecation warning) but fails TypeScript.
- **Fix:** Added `'max'` as the second argument: `revalidateTag('production-orders', 'max')`. Updated S3 source-assert regex from `revalidateTag\('production-orders'\)` to `revalidateTag\('production-orders'` (prefix match, allows second arg). Updated behavioral assertions (A7, B5, C8, D7) to expect `('production-orders', 'max')`.
- **Files modified:** `src/actions/transitions.ts`, `src/actions/__tests__/transitions.test.ts`
- **Commit:** 2efa1df

**3. [Rule 1 - Bug] `rowsAffected` in JSDoc comment caused S4 source-assert failure**

- **Found during:** Task 2 (GREEN) — S4 asserts the file does NOT contain `rowsAffected` (Pitfall 1). The implementation's JSDoc mentioned the word to explain what NOT to use.
- **Fix:** Reworded the comment to avoid the forbidden string while preserving the meaning.
- **Files modified:** `src/actions/transitions.ts`
- **Commit:** 2efa1df

### Skipped Actions

- **Helper extraction (Task 3):** The plan offered helper extraction OR per-action JSDoc as acceptable alternatives. Helper extraction was skipped because the JSDoc blocks added in GREEN already make the file self-documenting, and extracting the helper while keeping `requireRole` in every public action (per source-assert S2 requirement) would not meaningfully reduce file length.

## Security Patterns Doc Extension

`docs/security-patterns.md` §1 audit table extended with a new row:

| Path | Guard | Notes |
|------|-------|-------|
| `src/actions/transitions.ts` | `await requireRole('mill_operator')` — inner-guard (§2, AUTH-02) | Four transition actions; each enforces mill_operator before any DB I/O (T-33-AuthZ). Optimistic concurrency via `.returning()`. Added: Phase 33 plan 33-04. |

## Known Stubs

None — all four actions perform real DB operations. No placeholder data or hardcoded empty values.

## Threat Surface Scan

No new threat surface beyond what was in the plan's `<threat_model>`:
- T-33-AuthZ: mitigated (requireRole in every action)
- T-33-Stale: mitigated (optimistic UPDATE + conflict detection)
- T-33-Audit: mitigated (INSERT with server-error fallback)
- T-33-Spoof: mitigated (Clerk JWT server-side)
- T-33-CacheTagDrift: mitigated (revalidateTag with 'max' profile, grep gate verified)

## Self-Check: PASSED

Files exist:
- [x] src/actions/transitions.ts
- [x] src/actions/__tests__/transitions.test.ts (modified)
- [x] docs/security-patterns.md (modified)

Commits exist:
- [x] 2efa1df (GREEN)
- [x] 117e3e8 (REFACTOR)

All 33 tests pass. No TypeScript errors in actions/transitions files.
