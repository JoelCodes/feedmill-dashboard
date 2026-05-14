---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 06
subsystem: production-dashboard
tags: [drawer, transitions, modal, radix-dialog, useActionState, tdd, canEdit, nuqs]
dependency_graph:
  requires:
    - src/actions/transitions.ts (TransitionResult, transitionToMixing, completeOrder, blockOrder, resumeFromBlocked — Phase 33)
    - src/components/ProductionDashboard.tsx (drawerOrder/drawerEvents props + order URL state — 34-05)
    - src/components/DrawerSkeleton.tsx (Suspense fallback for drawer — 34-03)
    - src/components/ui/Button.tsx (variant, loading, disabled props)
    - src/components/ui/Textarea.tsx (label, required, error, aria-invalid)
    - src/components/ui/StatusBadge.tsx (extended with ProductionState — 34-01)
    - src/lib/search-params.ts (STATE_ORDER, searchParamsCache — 34-01)
    - @radix-ui/react-dialog (Dialog.Root, Portal, Overlay, Content, Title)
    - nuqs (useQueryStates, parseAsString)
  provides:
    - src/components/TransitionButtons.tsx (four useActionState-bound transition buttons + conflict banner)
    - src/components/BlockReasonModal.tsx (Radix Dialog modal with required textarea)
    - src/components/DrawerCloseHandlers.tsx (ESC + backdrop close, gated by modalOpen)
    - src/components/ProductionDrawer.tsx (order details + timeline + conditional transition buttons)
  affects:
    - src/components/ProductionDashboard.tsx (drawer TODO replaced with real render)
    - Plan 34-07: page RSC passes drawerOrder/drawerEvents; ProductionDashboard passes to drawer
tech_stack:
  added:
    - "@radix-ui/react-dialog (first Radix component in codebase)"
    - "React.useActionState (first useActionState usage in codebase)"
  patterns:
    - "useActionState closure wrapper (Pitfall 10) — async (_prev) => serverAction(orderId, version)"
    - "Conflict banner: state?.ok === false && state.code === 'conflict' → inline red banner + router.refresh()"
    - "Radix Dialog.Root onOpenChange routes ESC + backdrop click → onClose callback"
    - "DrawerCloseHandlers gating: if (modalOpen) return early from keydown listener (Pitfall 4)"
    - "Nuqs setQuery({ order: '' }) as the single close mechanism for all drawer close paths"
    - "canEdit conditional render: {canEdit && order.state !== 'Completed' && <TransitionButtons />} (D-25)"
key_files:
  created:
    - src/components/TransitionButtons.tsx
    - src/components/TransitionButtons.test.tsx
    - src/components/BlockReasonModal.tsx
    - src/components/BlockReasonModal.test.tsx
    - src/components/DrawerCloseHandlers.tsx
    - src/components/DrawerCloseHandlers.test.tsx
    - src/components/ProductionDrawer.tsx
    - src/components/ProductionDrawer.test.tsx
  modified:
    - src/components/ProductionDashboard.tsx (drawer TODO removed; Suspense+ProductionDrawer added)
    - src/components/ProductionDashboard.test.tsx (mocks added for drawer + transitions)
key_decisions:
  - "ProductionDrawer is a 'use client' component — required to own modalOpen state for BlockReasonModal. Server-side data is still fetched by the page RSC (D-09 preserved). This matches the context_amendment in the plan."
  - "BlockOrderTrigger is NOT bound to useActionState — it is a plain callback trigger (onBlockClick). The BlockReasonModal owns the blockOrder server action invocation."
  - "TransitionButtons does NOT check canEdit — the parent ProductionDrawer gates rendering. This keeps the component single-responsibility and satisfies Test 8 + the acceptance criteria grep."
  - "Backdrop click uses an onClick div (not document-level listener) to avoid triggering from inside the BlockReasonModal portal (Pitfall 4 mitigation)."
  - "ProductionDrawer.test.tsx mocks TransitionButtons, BlockReasonModal, and DrawerCloseHandlers to avoid pulling in server-action dependencies in unit tests."
  - "ProductionDashboard.test.tsx mocks ProductionDrawer and DrawerSkeleton to prevent DB connection attempts from transitions.ts being pulled in."
  - "Fixed React.JSX.Element namespace (was bare JSX.Element) in all new plan-06 files to match codebase convention."
requirements-completed: [PROD-05]
duration: ~25 minutes
completed: "2026-05-14T20:38:00Z"
---

# Phase 34 Plan 06: Drawer, Transition Buttons, and Block Reason Modal Summary

**ProductionDrawer + TransitionButtons + BlockReasonModal + DrawerCloseHandlers delivered as 'use client' components; 42 new tests GREEN across 5 suites; dashboard TODO replaced with real Suspense-wrapped drawer render**

## Performance

- **Duration:** ~25 minutes
- **Started:** ~2026-05-14T20:14:00Z
- **Completed:** 2026-05-14T20:38:00Z
- **Tasks:** 3 (TDD RED+GREEN for each)
- **Files modified/created:** 10

## Component Tree

```
ProductionDashboard
  └── (conditional on ?order= URL param)
      Suspense fallback={<DrawerSkeleton />}
        └── ProductionDrawer (client — order, events, canEdit props)
              ├── DrawerCloseHandlers (ESC listener, gated by modalOpen)
              ├── [order fields + timeline]
              ├── (conditional on canEdit && state !== 'Completed')
              │   └── TransitionButtons
              │         ├── StartMixingButton (useActionState)
              │         ├── CompleteOrderButton (useActionState)
              │         ├── BlockOrderTrigger (callback trigger, no useActionState)
              │         └── ResumeButton (useActionState, toState='Mixing'|'Pending')
              └── BlockReasonModal (Radix Dialog, open=modalOpen)
```

## Test Counts

| Suite | Tests | TDD Phase |
|-------|-------|-----------|
| TransitionButtons.test.tsx | 8 | RED `a928271` → GREEN `1dd63e2` |
| BlockReasonModal.test.tsx | 10 | RED `ed8ae16` → GREEN `b5f8f13` |
| DrawerCloseHandlers.test.tsx | 4 | RED `5dd47a0` → GREEN `6248924` |
| ProductionDrawer.test.tsx | 8 | RED `5dd47a0` → GREEN `6248924` |
| ProductionDashboard.test.tsx | 12 | Updated (mocks added) `6248924` |
| **Total** | **42** | |

## Locked Conflict Message Confirmation

The string `'Order was modified by another user. Please refresh.'` appears verbatim in BOTH:
- `src/actions/transitions.ts` line 59 (Phase 33 source of truth)
- `src/components/TransitionButtons.tsx` line 37 (`const CONFLICT_MESSAGE = ...`)

Verified by `grep -rn "Order was modified by another user. Please refresh." src/` returning hits in both files.

## D-Requirements Wired

| D-Req | Description | Implementation |
|-------|-------------|---------------|
| D-08 | Order details panel + transition history timeline | ProductionDrawer renders fields + EventTimelineItem components |
| D-09 | Data fetched by page RSC, not drawer | Drawer receives `{ order, events }` as props; no fetch inside |
| D-10 | Transition actions only in drawer | TransitionButtons renders per order.state; no inline card controls |
| D-11 | Pending→Start Mixing (single-click); Mixing→Complete Order (single-click) | StartMixingButton, CompleteOrderButton — no confirm modal |
| D-12 | Blocked→split Resume buttons | ResumeButton(toState='Mixing') primary + ResumeButton(toState='Pending') secondary |
| D-13 | Block reason modal with required textarea | BlockReasonModal: trim guard + server validation error wiring |
| D-14 | Conflict banner + auto-refresh | useEffect on `state.code === 'conflict'` → router.refresh() |
| D-25 | canEdit gates TransitionButtons | `{canEdit && order.state !== 'Completed' && <TransitionButtons />}` |

## Pitfall Mitigations

| Pitfall | Mitigation | Verified by |
|---------|------------|-------------|
| Pitfall 4 (modal-on-drawer close) | DrawerCloseHandlers returns early when modalOpen=true | Test 3 of DrawerCloseHandlers |
| Pitfall 7 (stale ?order= URL) | ProductionDrawer null-branch renders "Order not found" | Test 5 of ProductionDrawer |
| Pitfall 10 (useActionState closure) | `async (_prev) => serverAction(orderId, version)` pattern | All useActionState hooks |

## Task Commits

| Task | Phase | Hash | Message |
|------|-------|------|---------|
| 1 | RED | `a928271` | `test(34-06): add failing TransitionButtons TDD red tests (8 cases)` |
| 1 | GREEN | `1dd63e2` | `feat(34-06): implement TransitionButtons with useActionState + conflict banner (TDD green)` |
| 2 | RED | `ed8ae16` | `test(34-06): add failing BlockReasonModal TDD red tests (10 cases)` |
| 2 | GREEN | `b5f8f13` | `feat(34-06): implement BlockReasonModal with Radix Dialog + trim guard (TDD green)` |
| 3 | RED | `5dd47a0` | `test(34-06): add failing DrawerCloseHandlers + ProductionDrawer TDD red tests (12 cases)` |
| 3 | GREEN | `6248924` | `feat(34-06): implement DrawerCloseHandlers + ProductionDrawer + dashboard integration (TDD green)` |

## Files Created

- `src/components/TransitionButtons.tsx` — Four transition sub-components + default TransitionButtons export; StartMixingButton, CompleteOrderButton, BlockOrderTrigger, ResumeButton; all bound via useActionState closure wrapper; conflict banner + router.refresh() on D-14
- `src/components/TransitionButtons.test.tsx` — 8 tests: Pending/Mixing/Blocked/Completed states, conflict UX, locked message verbatim, loading state, canEdit absent
- `src/components/BlockReasonModal.tsx` — Radix Dialog.Root/Portal/Overlay/Content/Title; useState for reason; useActionState for blockOrder; client-side trim guard; validation error inline
- `src/components/BlockReasonModal.test.tsx` — 10 tests: open/closed render, aria-required, disabled empty, enabled valid, whitespace-only disabled, blockOrder call args, success path, validation error, cancel, ESC
- `src/components/DrawerCloseHandlers.tsx` — Purely behavioral (returns null); window.addEventListener('keydown') gated on modalOpen
- `src/components/DrawerCloseHandlers.test.tsx` — 4 tests: ESC fires, non-ESC does not, modalOpen gates ESC, backdrop click fires
- `src/components/ProductionDrawer.tsx` — Client component: backdrop, null-branch ("Order not found"), header+StatusBadge, 7 field rows, timeline (EventTimelineItem), conditional TransitionButtons, BlockReasonModal mount
- `src/components/ProductionDrawer.test.tsx` — 8 tests: null order empty state, header, fields, timeline, canEdit=true shows buttons, canEdit=false hides buttons, w-[480px], bg-black/30

## Files Modified

- `src/components/ProductionDashboard.tsx` — Removed TODO + void statements; added ProductionDrawer + DrawerSkeleton imports; replaced _order unused alias with `order`; added `{order && <Suspense fallback={<DrawerSkeleton />}><ProductionDrawer /></Suspense>}` at bottom of JSX
- `src/components/ProductionDashboard.test.tsx` — Added jest.mock for ProductionDrawer, DrawerSkeleton, @/actions/transitions to prevent DB connection errors from transitional import chain

## Notes for Plan 34-07

Plan 07 (page RSC) will:
1. Parse `?order=` URL param via `searchParamsCache.parse(searchParams)` from nuqs/server
2. Conditionally call `getOrderById(order)` and `getOrderEvents(order)` when `order !== ''`
3. Pass `drawerOrder` and `drawerEvents` into `ProductionDashboard` (the prop signature is already locked from plan-05)
4. `ProductionDashboard` now conditionally renders `<ProductionDrawer>` when `order !== ''` URL state is set

The contract is already stable: `ProductionDashboard({ orders, canEdit, drawerOrder, drawerEvents })`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ProductionDrawer test: getByText('Premix') matched multiple elements**
- **Found during:** Task 3 GREEN phase — Test 7 initial run
- **Issue:** "Premix" appeared in both the StatusBadge area in the header and in the Mill Line field row. `getByText('Premix')` threw "multiple elements found".
- **Fix:** Changed Test 7 to use `screen.getAllByText('Premix')` and assert `length >= 1` — the data IS rendered, the query was too strict.
- **Files modified:** `src/components/ProductionDrawer.test.tsx`
- **Commit:** Included in `6248924`

**2. [Rule 1 - Bug] ProductionDrawer test: getByText('ORD-001') not specific enough**
- **Found during:** Task 3 GREEN phase — Test 6 initial run
- **Issue:** `getByText(/ORD-001/)` matched both the h2 heading and the Document Number field row (both show the order number).
- **Fix:** Changed Test 6 to use `screen.getByRole('heading', { level: 2 })` and `toHaveTextContent('ORD-001')` for specificity, plus `getAllByText` for customer.
- **Files modified:** `src/components/ProductionDrawer.test.tsx`
- **Commit:** Included in `6248924`

**3. [Rule 3 - Blocking] ProductionDashboard test pulled in DB via import chain**
- **Found during:** Task 3 — ProductionDashboard.test.tsx running after ProductionDashboard.tsx imported ProductionDrawer
- **Issue:** ProductionDashboard → ProductionDrawer → TransitionButtons → @/actions/transitions → @/db/index.ts → NeonDB connection attempt. Test environment has no DB, causing "missing DATABASE_URL" error.
- **Fix:** Added `jest.mock('./ProductionDrawer')`, `jest.mock('./DrawerSkeleton')`, and `jest.mock('@/actions/transitions')` at the top of ProductionDashboard.test.tsx.
- **Files modified:** `src/components/ProductionDashboard.test.tsx`
- **Commit:** Included in `6248924`

**4. [Rule 1 - Bug] JSX.Element namespace error in all plan-06 files**
- **Found during:** Post-implementation `npx tsc --noEmit` verification
- **Issue:** Bare `JSX.Element` return type triggers `TS2503: Cannot find namespace 'JSX'` in strict mode. Existing codebase uses `React.JSX.Element`.
- **Fix:** Added `import React` to TransitionButtons, BlockReasonModal, ProductionDrawer; changed all `JSX.Element` return types to `React.JSX.Element`.
- **Files modified:** TransitionButtons.tsx, BlockReasonModal.tsx, ProductionDrawer.tsx, ProductionDashboard.tsx
- **Commit:** Included in `6248924`

---

**Total deviations:** 4 auto-fixed (Rule 1 + Rule 3)
**Impact on plan:** All auto-fixes improve test reliability and TypeScript correctness. No scope creep.

## Known Stubs

None — all plan-06 goals are fully implemented. The drawer renders order details, timeline, and transition buttons. The modal submits the block reason. The dashboard renders the drawer on ?order= URL param.

## Threat Flags

None — all new surface (TransitionButtons, BlockReasonModal, DrawerCloseHandlers, ProductionDrawer) is covered by the plan's STRIDE threat register (T-34-06-01 through T-34-06-CSRF). No unmodeled surface introduced:
- TransitionButtons → transitions server actions: Phase 33 `requireRole('mill_operator')` enforces authorization
- BlockReasonModal → blockOrder: server-side Zod validation rejects empty reason (D-13)
- Drawer note rendering: React children interpolation (no dangerouslySetInnerHTML anywhere)

## TDD Gate Compliance

All three tasks followed strict RED → GREEN sequence:

**Task 1 (TransitionButtons):**
1. RED: `a928271` — test file fails "Cannot find module './TransitionButtons'"
2. GREEN: `1dd63e2` — 8 tests pass

**Task 2 (BlockReasonModal):**
1. RED: `ed8ae16` — test file fails "Cannot find module './BlockReasonModal'"
2. GREEN: `b5f8f13` — 10 tests pass

**Task 3 (DrawerCloseHandlers + ProductionDrawer + dashboard):**
1. RED: `5dd47a0` — test files fail "Cannot find module './DrawerCloseHandlers'" and "'./ProductionDrawer'"
2. GREEN: `6248924` — 12 tests pass (4 DrawerCloseHandlers + 8 ProductionDrawer); plus 12 ProductionDashboard regression tests remain green

## Self-Check: PASSED

### Created files:
- [x] src/components/TransitionButtons.tsx — FOUND
- [x] src/components/TransitionButtons.test.tsx — FOUND
- [x] src/components/BlockReasonModal.tsx — FOUND
- [x] src/components/BlockReasonModal.test.tsx — FOUND
- [x] src/components/DrawerCloseHandlers.tsx — FOUND
- [x] src/components/DrawerCloseHandlers.test.tsx — FOUND
- [x] src/components/ProductionDrawer.tsx — FOUND
- [x] src/components/ProductionDrawer.test.tsx — FOUND

### Modified files:
- [x] src/components/ProductionDashboard.tsx — TODO removed, ProductionDrawer + DrawerSkeleton integrated
- [x] src/components/ProductionDashboard.test.tsx — mocks added for new dependencies

### Key acceptance criteria verified:
- [x] useActionState count in TransitionButtons: 6 (≥3)
- [x] Conflict message verbatim: 1 (≥1)
- [x] router.refresh() in TransitionButtons: 4 (≥1)
- [x] Button labels in TransitionButtons: 10 (≥5)
- [x] canEdit in TransitionButtons: 0 (=0)
- [x] code === conflict: 7 (≥1)
- [x] action bindings: 6 (≥3)
- [x] @radix-ui/react-dialog in BlockReasonModal: 1 (≥1)
- [x] Dialog primitives: 10 (≥5)
- [x] Reason (required) in BlockReasonModal: 1 (=1)
- [x] Confirm Block in BlockReasonModal: 1 (=1)
- [x] trim guard: 1 (≥1)
- [x] blockOrder in BlockReasonModal: 3 (≥1)
- [x] onOpenChange: 2 (≥1)
- [x] Order not found in ProductionDrawer: 2 (≥1)
- [x] w-[480px]: 2 (≥1)
- [x] bg-black/30: 1 (≥1)
- [x] TransitionButtons in drawer: 1 (≥1)
- [x] BlockReasonModal in drawer: 1 (≥1)
- [x] canEdit && in drawer: 1 (≥1)
- [x] parseFloat(order.weightLbs): 1 (≥1)
- [x] Intl.DateTimeFormat: 1 (≥1)
- [x] Transition History heading: 1 (≥1)
- [x] addEventListener in DrawerCloseHandlers: 1 (≥1)
- [x] modalOpen in DrawerCloseHandlers: 6 (≥1)
- [x] ProductionDrawer in ProductionDashboard: 1 (=1)
- [x] DrawerSkeleton in ProductionDashboard: 1 (≥1)
- [x] void canEdit/drawerOrder/drawerEvents: 0 (=0)
- [x] All 42 tests GREEN

### Commits verified:
- [x] a928271 — test(34-06): add failing TransitionButtons TDD red tests
- [x] 1dd63e2 — feat(34-06): implement TransitionButtons with useActionState + conflict banner
- [x] ed8ae16 — test(34-06): add failing BlockReasonModal TDD red tests
- [x] b5f8f13 — feat(34-06): implement BlockReasonModal with Radix Dialog + trim guard
- [x] 5dd47a0 — test(34-06): add failing DrawerCloseHandlers + ProductionDrawer TDD red tests
- [x] 6248924 — feat(34-06): implement DrawerCloseHandlers + ProductionDrawer + dashboard integration
