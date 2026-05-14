---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 10
subsystem: transition-buttons
tags: [gap-closure, d-11-amendment, pending-to-blocked, tdd]
dependency_graph:
  requires:
    - src/components/BlockReasonModal.tsx
    - src/actions/transitions.ts
  provides:
    - "D-11 amended: Pending state now shows Start Mixing + Block Order"
    - "TransitionButtons Pending case with BlockOrderTrigger"
  affects:
    - src/components/ProductionDrawer.tsx
tech_stack:
  added: []
  patterns:
    - "BlockOrderTrigger reused from Mixing case in Pending case"
    - "onBlockClick prop already plumbed from ProductionDrawer"
key_files:
  created: []
  modified:
    - src/components/TransitionButtons.tsx
    - src/components/TransitionButtons.test.tsx
    - .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-PATTERNS.md
    - .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-CONTEXT.md
decisions:
  - "D-11 amended 2026-05-14 (gap T10a): Pending shows both Start Mixing AND Block Order"
  - "No server-side change required — blockOrder() already accepts fromState='Pending' at transitions.ts:246"
  - "Updated Test 1 in existing describe block to reflect amended behavior"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_modified: 4
---

# Phase 34 Plan 10: TransitionButtons D-11 Amendment (Pending → Blocked) Summary

**One-liner:** Added BlockOrderTrigger to Pending case in TransitionButtons, amending D-11 to allow direct Pending → Blocked without Mixing detour.

## What Was Done

### D-11 Amendment (Task 1)

The design decision D-11 previously read: "Pending → Start Mixing (single-click, no confirm)." This required operators to first transition an order to Mixing before they could block it — even when they knew the order should never enter Mixing (e.g., missing ingredients, customer cancellation, QA hold).

**Gap T10a** (from UAT.md 2026-05-14): Operator must be able to transition a Pending order directly to Blocked.

Three load-bearing facts made this a small fix:
1. `blockOrder()` at `src/actions/transitions.ts:246` already accepts `fromState='Pending'` — no server change required.
2. `BlockReasonModal.tsx` is already reusable from any caller — no modal change required.
3. `ProductionDrawer.tsx` already mounts `<TransitionButtons />` for Pending orders — only the switch case needed updating.

### D-11 Amendment Text (Locked)

```
D-11 (amended 2026-05-14, gap T10a): Complete is single-click, no confirm modal. The Pending state shows BOTH Start Mixing AND Block Order to give the operator a direct escape hatch when an order should never enter Mixing (e.g., missing ingredients, customer cancellation, QA hold). Mistakes are recoverable via Block + Resume; the audit trail captures every transition. Original rationale (friction-free Complete) preserved.
```

### Design Doc Edits

**34-CONTEXT.md:** Replaced the D-11 bullet under `### Transition action UX` with the locked amended text above.

**34-PATTERNS.md:** Updated the button-shape contract block for the Pending state entry (lines ~565-566):
```
- Pending state (D-11 amended 2026-05-14, gap T10a):
    `<StartMixingButton />` — "Start Mixing", `variant="primary"`
    `<BlockOrderTrigger />` — "Block Order", `variant="destructive"` (opens BlockReasonModal, same wiring as the Mixing case)
```

### TransitionButtons.tsx Switch Case Change

The Pending case was updated from rendering only `<StartMixingButton />` to rendering both:

```typescript
case 'Pending':
  // D-11 amended 2026-05-14 (gap T10a): Pending now exposes both Start Mixing
  // AND Block Order. The Block path opens the same BlockReasonModal used from
  // the Mixing case. blockOrder() (src/actions/transitions.ts:215) already
  // accepts fromState='Pending' — no server change required.
  return (
    <div className="flex gap-3">
      <StartMixingButton orderId={order.id} version={order.version} />
      <BlockOrderTrigger onClick={onBlockClick} />
    </div>
  );
```

The `BlockOrderTrigger` uses the same `onBlockClick` prop already plumbed from `ProductionDrawer.tsx` via `onBlockClick={() => setModalOpen(true)}`.

### Test Updates (Task 2)

**Test 1 updated:** The existing Test 1 (Pending — D-11) previously asserted Block Order button was NOT present. Updated to reflect the D-11 amendment — now asserts BOTH Start Mixing AND Block Order are present.

**5 new tests added** in a new describe block `'TransitionButtons Pending → Blocked path (D-11 amended, gap T10a)'`:

1. `renders both Start Mixing and Block Order buttons for Pending state` — asserts both buttons visible.
2. `clicking Block Order on Pending invokes onBlockClick exactly once` — asserts callback invocation.
3. `Mixing state still shows Complete + Block (regression)` — confirms Mixing case unchanged.
4. `Completed state renders null (regression)` — confirms Completed case returns null.
5. `Blocked state shows only Resume buttons, no Block Order (regression)` — confirms Blocked case unchanged.

**Result:** 13 tests total (8 original + 1 updated + 5 new) — all pass.

### Server-Side Note

No changes to `src/actions/transitions.ts`. The `blockOrder()` function at line 246 already has:
```typescript
if (!['Pending', 'Mixing'].includes(order.state))
```
This means Pending → Blocked was already a valid server-side transition. The UI was the only gap.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 75b4134 | feat(34-10): amend D-11 — add BlockOrderTrigger to Pending case in TransitionButtons |
| Task 2 | a5451ee | test(34-10): extend TransitionButtons tests for Pending → Blocked path (D-11 amended) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing Test 1 to match amended behavior**
- **Found during:** Task 2
- **Issue:** Existing Test 1 asserted `expect(screen.queryByRole('button', { name: /block order/i })).not.toBeInTheDocument()` for Pending state. After Task 1 added BlockOrderTrigger to the Pending case, this assertion would fail.
- **Fix:** Updated Test 1 title and assertions to reflect D-11 amendment — now asserts both Start Mixing AND Block Order are present; removed the not-toBeInTheDocument check for block order.
- **Files modified:** src/components/TransitionButtons.test.tsx
- **Commit:** a5451ee

## UAT Closure

Gap **T10a** ("Operator can transition a Pending order directly to Blocked") is now closable on re-test:
1. Open a Pending order's drawer.
2. Click "Block Order".
3. The `BlockReasonModal` opens (same modal as from Mixing state).
4. Type a reason, click Confirm.
5. `blockOrder(orderId, version, reason)` is called; server accepts `fromState='Pending'`.
6. Order transitions to Blocked; drawer timeline shows "Pending → Blocked" event with the typed reason.

## Known Stubs

None — all functionality is fully wired.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- [x] TransitionButtons.tsx Pending case includes BlockOrderTrigger alongside StartMixingButton
- [x] 34-CONTEXT.md D-11 entry contains `(amended 2026-05-14, gap T10a)`
- [x] 34-PATTERNS.md button-shape contract updated for Pending state
- [x] All 13 tests in TransitionButtons.test.tsx pass
- [x] No TypeScript errors in TransitionButtons.tsx
- [x] Commit 75b4134 exists (Task 1)
- [x] Commit a5451ee exists (Task 2)
