---
phase: 33-server-actions-queries-and-bulk-import
handoff_target_phase: 34-production-dashboard-ui-and-homepage-promotion
handoff_type: inherited-uat
source_gap: GAP-02
source_document: 33-VERIFICATION.md
created: 2026-05-13
status: complete
updated: 2026-05-16
closed_by: 34-HUMAN-UAT.md
---

# Phase 34 Inherited UAT — From Phase 33 GAP-02

## Source

- **Gap:** `GAP-02` in `.planning/phases/33-server-actions-queries-and-bulk-import/33-VERIFICATION.md`
- **Truth:** "revalidateTag cache invalidation observable end-to-end"
- **Why deferred (not closed in Phase 33):** `unstable_cache` invalidation is only observable to a consumer of the wrapped query. The only consumer of `getProductionOrders` and `getOrderEvents` is the Phase 34 RSC dashboard at `/`. Phase 33 has no RSC consumer; building a parallel `next dev` harness duplicates Phase 34 UAT work without adding signal.
- **What IS already verified in Phase 33** (do not re-verify):
  - Action-side: `revalidateTag('production-orders', 'max')` is called on every successful mutation. Unit tests: 33-04 Tests A7/B5/C8/D7 (transitions), 33-06 Tests 11 + 22 (commitImportAction).
  - Query-side: both `src/db/queries/orders.ts` and `src/db/queries/events.ts` wrap their query bodies in `unstable_cache(..., ['production-orders'], { tags: ['production-orders'] })`. Tag string matches the action's invocation.
  - Cross-file grep gate: `grep -rn "'production-orders'" src/actions/ src/db/queries/ | wc -l` reports ≥6 matches (4 in transitions + 1 in import + 1 each in queries/orders + queries/events).

## Inherited Test Step (MUST appear in Phase 34's UAT)

**Step name:** End-to-end revalidateTag observation (GAP-02 closure)

**Preconditions:**
- Phase 34 dashboard at `/` is implemented (PROD-01) and renders against live DB via `getProductionOrders`.
- At least one `production_orders` row exists in `state: 'Pending'` (use the seed data from Phase 32 or the harness from Phase 33 plan 33-07).
- Operator is signed in as `mill_operator`.

**Steps:**
1. Open Tab A: navigate to `/`. Note the state of one specific Pending order (record `orderNumber` and `version` for reference).
2. Open Tab B: navigate to `/` in a SECOND tab/window (same browser session, same user).
3. In Tab B: click the per-order Mixing transition button (Phase 34's UI element). Observe the optimistic UI response (the card moves to the Mixing column — or, in v2.0 without optimistic UI per PROD-FUT-01 deferral, the card updates after the action returns).
4. In Tab A: WITHOUT pressing the browser refresh button, observe the order card. Within one render cycle, the card should reflect the new state.
   - **If polling is the only refresh mechanism (v2.0 design per PROD-09):** the card updates within the 30-second polling interval (`REFRESH_INTERVAL_MS = 30_000`). Time the update.
   - **If `router.refresh()` is wired into the action button's onSuccess handler (recommended):** the card updates near-instantly (within ~1s of the action's RSC response landing).

**Pass criteria:**
- Tab A's order card reflects the new state without a manual hard refresh (no F5, no Ctrl+R, no clicking the page's manual refresh control — that control exists per PROD-11 but is not what GAP-02 tests).
- The state update lands within ≤30s (the polling interval upper bound).

**Fail criteria:**
- Tab A's card remains in the old state indefinitely (requires manual refresh) — `revalidateTag` is not firing OR the `unstable_cache` tag does not match OR the page is not re-rendering on tag invalidation.
- The state update relies on a hard refresh — same diagnosis.

**Diagnostic hints if the test fails:**
- Run `grep -rn "'production-orders'" src/` — confirm the tag string appears in BOTH the action invocations and the query `unstable_cache` wrappers. A typo in either site silently breaks invalidation (RESEARCH.md §6 + Pitfall — tag-string drift).
- Confirm `getProductionOrders` is called from the page RSC (not from a client component that bypasses the cache layer).
- Confirm `export const dynamic = 'force-dynamic'` is on the page (PROD-01) so the RSC re-renders on each request.
- Confirm `revalidateTag('production-orders', 'max')` (two-arg form for Next.js 16.1.6 — see 33-04-SUMMARY.md decision note) is called in EVERY mutating action path (success AND server-error fallback in transitions; success in commitImportAction).

## Where this folds into Phase 34's existing UAT

- **PROD-01 verification:** the dashboard renders live DB data — same test setup as this GAP-02 step.
- **PROD-09 verification:** the 30s polling refreshes data — the polling test naturally exercises GAP-02 (since each poll re-runs `getProductionOrders` which respects tag invalidation).
- **Recommended:** Phase 34's planner adds this step as an EXPLICIT line item in its `34-PLAN.md` UAT section, citing `34-INHERITED-UAT.md` and `GAP-02`. Do NOT fold it silently into PROD-01 or PROD-09 verification — explicit is better than implicit for inherited gaps.

## Closure protocol

When Phase 34's UAT runs (post-implementation):
1. Execute the steps above against the running Phase 34 dashboard.
2. Record the result in Phase 34's `34-HUMAN-UAT.md` under a dedicated test entry titled `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)`.
3. After Phase 34 ships its verification report, AMEND `33-HUMAN-UAT.md` Test #2: change `result: deferred_to_phase_34` to `result: closed_in_phase_34 (pass/fail, <date>, <Phase 34 verification commit>)`.
4. After amendment, flip `33-HUMAN-UAT.md` frontmatter `status: gaps_flagged` → `status: gaps_closed` (assuming GAP-01 and GAP-03 are also closed by then via plans 33-08 and 33-07).

## Cross-References

- Source gap: `33-VERIFICATION.md` GAP-02
- Source UAT entry: `33-HUMAN-UAT.md` Test #2 (marked `deferred_to_phase_34`)
- Action-side unit test coverage: `33-04-SUMMARY.md` Tests A7/B5/C8/D7
- Action-side unit test coverage (import): `33-06-SUMMARY.md` Tests 11 + 22
- Tag-string contract: `src/actions/transitions.ts` line 59 (CONFLICT_MESSAGE constant), tag invocations throughout `src/actions/*.ts` and `src/db/queries/*.ts`
- Phase 34 ROADMAP entry: `.planning/ROADMAP.md` Phase 34 (PROD-01..PROD-11 requirements)
