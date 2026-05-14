---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 12
subsystem: transition-buttons
tags: [gap-closure, t12, router-refresh, tdd, cross-tab-latency]
dependency_graph:
  requires:
    - src/components/TransitionButtons.tsx (post-34-10, with BlockOrderTrigger in Pending case)
    - src/components/BlockReasonModal.tsx
    - src/actions/transitions.ts (revalidateTag already fires server-side)
  provides:
    - "T12 gap closed: router.refresh() on all transition success paths"
    - "Cross-tab latency reduced from ~15s polling to ~1s"
  affects:
    - src/components/TransitionButtons.tsx
    - src/components/BlockReasonModal.tsx
tech_stack:
  added: []
  patterns:
    - "Dual-arm useEffect: ok===true calls router.refresh(); conflict arm preserved (D-14)"
    - "BlockReasonModal: router.refresh() before setReason+onClose in success branch"
    - "TDD RED/GREEN cycle per task"
key_files:
  created: []
  modified:
    - src/components/TransitionButtons.tsx
    - src/components/TransitionButtons.test.tsx
    - src/components/BlockReasonModal.tsx
    - src/components/BlockReasonModal.test.tsx
decisions:
  - "Dual-arm useEffect replaces single conflict-only arm — one effect per dep array (no duplication)"
  - "router.refresh() fires before onClose() in BlockReasonModal so drawer next paint is fresh"
  - "BlockOrderTrigger left unchanged — it only opens the modal, action lives in BlockReasonModal"
  - "Pre-existing TS errors in src/db/schema/__tests__/orders.test.ts are out-of-scope (not introduced by this plan)"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_modified: 4
---

# Phase 34 Plan 12: T12 Gap Closure — router.refresh() on Transition Success Paths

**One-liner:** Added router.refresh() to all mutation success paths in TransitionButtons and BlockReasonModal, dropping cross-tab state-update latency from ~15s polling to ~1s.

## What Was Done

### Background

T12 ("Cross-tab state updates land near-instantly") already **passed** UAT because `revalidateTag('production-orders', 'max')` fires server-side on every transition action (verified in Phase 33 unit tests). However, the client only picks up the invalidated cache via the 30s polling cycle, giving a worst-case latency of ~30s (observed ~15s average).

This plan adds `router.refresh()` in the **success arm** of each transition handler so the client-side RSC re-fetch triggers immediately after a successful action — bringing the latency to ~1s.

### Task 1: TransitionButtons dual-arm useEffect

Three `useActionState`-bound sub-components each had a single-arm `useEffect` checking only the conflict case (D-14). Each was replaced with a dual-arm effect:

```typescript
useEffect(() => {
  if (state?.ok === true) {
    // T12 fix (2026-05-14): cross-tab latency 15s polling → ~1s router.refresh.
    // Server already calls revalidateTag('production-orders', 'max'); this is
    // the client-side counterpart that picks up the invalidated cache.
    router.refresh();
  } else if (state?.ok === false && state.code === 'conflict') {
    router.refresh(); // D-14: auto-refresh on conflict
  }
}, [state, router]);
```

Components updated:
- `StartMixingButton` (Pending → Mixing)
- `CompleteOrderButton` (Mixing → Completed)
- `ResumeButton` (Blocked → Mixing, and Blocked → Pending)

`BlockOrderTrigger` was left **unchanged** — it is not bound to `useActionState`; it is only a trigger that opens the modal. The actual `blockOrder` server action call lives in `BlockReasonModal`.

### Task 2: BlockReasonModal success-path router.refresh()

`BlockReasonModal` did not previously import `useRouter`. This plan:

1. Added `import { useRouter } from 'next/navigation'`
2. Added `const router = useRouter()` after `const [reason, setReason] = useState('')`
3. Inserted `router.refresh()` BEFORE `setReason('')` and `onClose()` in the `if (result.ok)` branch

Call ordering inside success branch: **refresh → clear local state → notify parent**. This ensures the drawer's next paint already has the freshly-fetched Blocked state, preventing the brief flash where the drawer shows stale Pending/Mixing state between modal close and the next polling tick.

### Test Coverage

**Task 1 — 7 new tests in TransitionButtons.test.tsx (T12 gap closure describe block):**

1. StartMixingButton calls router.refresh on success
2. CompleteOrderButton calls router.refresh on success
3. ResumeButton (toState=Mixing) calls router.refresh on success
4. ResumeButton (toState=Pending) calls router.refresh on success
5. Conflict path still calls router.refresh (D-14 regression)
6. Validation failure does NOT call router.refresh (regression)
7. BlockOrderTrigger on Pending (post-34-10) does NOT call router.refresh directly

**Task 2 — 2 new tests in BlockReasonModal.test.tsx (T12 gap closure describe block):**

1. Calls router.refresh and onClose on successful blockOrder
2. Does NOT call router.refresh on validation failure

**Total new tests:** 9 (7 + 2)
**Previously passing tests preserved:** 23 (13 TransitionButtons + 10 BlockReasonModal)
**Total after plan:** 32 tests across both files, all green.

### Latency Delta

| Before | After |
|--------|-------|
| ~15s average (30s polling cycle) | ~1s (router.refresh() on action success) |

The server-side contract (`revalidateTag('production-orders', 'max')`) was already correct. This plan adds only the client-side counterpart.

### Wave 2 Sequencing Note

This plan ran in wave 2, after 34-10 (`TransitionButtons.tsx` co-modification). The 34-10 plan added `BlockOrderTrigger` to the Pending case. The dual-arm useEffect additions in this plan apply cleanly on top of 34-10's changes because `BlockOrderTrigger` is not bound to `useActionState` and has no conflict-check useEffect to modify.

## Commits

| Task | Phase | Commit | Description |
|------|-------|--------|-------------|
| Task 1 | RED | 28af4de | test(34-12): add failing T12 tests for router.refresh on success paths (TransitionButtons) |
| Task 1 | GREEN | e743ef6 | feat(34-12): add router.refresh() to success paths in TransitionButtons (T12 gap closure) |
| Task 2 | RED | d72015a | test(34-12): add failing T12 tests for router.refresh on success path (BlockReasonModal) |
| Task 2 | GREEN | fda5c3a | feat(34-12): add router.refresh() to BlockReasonModal success path (T12 gap closure) |

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

- RED gate: test commits 28af4de (Task 1) and d72015a (Task 2) exist before their GREEN counterparts.
- GREEN gate: feat commits e743ef6 (Task 1) and fda5c3a (Task 2) follow their RED commits.
- REFACTOR gate: no refactor pass needed — code was clean after GREEN.

## Known Stubs

None — all success paths are fully wired.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. `router.refresh()` is a pure client-side RSC refetch trigger. No new trust boundary surface.

## Self-Check: PASSED

- [x] TransitionButtons.tsx: StartMixingButton, CompleteOrderButton, ResumeButton each have dual-arm useEffect with ok===true arm
- [x] BlockReasonModal.tsx imports useRouter and calls router.refresh() before setReason+onClose
- [x] `grep -c "router\.refresh" src/components/TransitionButtons.tsx` = 10 (includes comment references + 6 call sites)
- [x] `grep -c "router\.refresh" src/components/BlockReasonModal.tsx` = 2 (1 comment + 1 call site)
- [x] All 32 tests pass across TransitionButtons.test.tsx and BlockReasonModal.test.tsx
- [x] Commit 28af4de exists (RED Task 1)
- [x] Commit e743ef6 exists (GREEN Task 1)
- [x] Commit d72015a exists (RED Task 2)
- [x] Commit fda5c3a exists (GREEN Task 2)
