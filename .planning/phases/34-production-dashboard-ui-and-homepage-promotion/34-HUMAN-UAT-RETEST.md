---
phase: 34-production-dashboard-ui-and-homepage-promotion
type: human-uat-retest-plan
created: 2026-05-14
status: pending-gap-closure-completion
companion_to: 34-HUMAN-UAT.md
---

# Phase 34 Human UAT — Retest Plan (post gap closure)

This document tracks the retest steps that must be executed AFTER the gap-closure plans (34-08 through 34-12) ship. Each retest closes one or more open items in `34-HUMAN-UAT.md`. T11 is intentionally NOT a code-fix plan — it is a procedural retest using the correct fixture.

---

## Retest T3 — Search input URL sync

**Closes:** UAT.md T3 (gap: "Two search inputs on `/`; user typed in Header's dead decorative one").
**Source plan:** `34-08-PLAN.md`.
**Procedure:**
1. Sign in as `mill_operator` (`e2e-mill-operator+clerk_test@example.com` from `docs/clerk-setup.md`).
2. Navigate to `http://localhost:3000/`.
3. Confirm only ONE search input is visible on the page (the one inside the dashboard header strip, placeholder `Search orders...`). The previous decorative input in the right-side Header (placeholder `Type here...`) must be gone.
4. Type a customer name fragment into the search box.
5. Within ~150ms, observe the URL gains `?q=...`.
6. Hard-reload the page. Confirm `q=...` survives and the search input is repopulated.

**Pass criteria:** Single search input; URL `?q=` updates on typing; survives reload.

---

## Retest T9 — Bulk import end-to-end

**Closes:** UAT.md T9a + T9b.
**Source plan:** `34-09-PLAN.md`.
**Procedure:** Follow the T9 steps in `34-HUMAN-UAT.md` exactly. Additional checks:
- After clicking Commit Import, the success message `Import complete!` appears.
- Within ~1s of the success message, the `Recent Imports` table at the bottom of `/import` shows the new batch at the top WITHOUT any manual reload.
- DevTools Console shows NO `RangeError: Invalid time value` at any point during the flow (entry, preview, commit, post-commit).
- Hard-reload `/import`. The history table renders without error and shows the new batch.

**Pass criteria:** No RangeError; history refreshes within ~1s of commit; entire flow free of console errors.

---

## Retest T10 — Pending → Blocked direct transition

**Closes:** UAT.md T10a (D-11 amendment).
**Source plan:** `34-10-PLAN.md`.
**Procedure:**
1. Open the drawer for any Pending order on `/`.
2. Confirm the drawer shows BOTH "Start Mixing" (primary) AND "Block Order" (destructive) buttons in the action area.
3. Click "Block Order". The `BlockReasonModal` opens.
4. Type a reason (e.g., "Customer cancellation, no production needed").
5. Click "Confirm Block".
6. Modal closes; the order moves to the Blocked column in the column view (or the drawer's status badge updates if still open).
7. Reopen the drawer for that order; confirm the timeline shows a `Pending → Blocked` event with the typed reason as the note.

**Pass criteria:** Block button visible on Pending; modal opens; transition succeeds; audit-trail event captures the Pending → Blocked direction.

---

## Retest T10b — Drawer load latency

**Closes:** UAT.md T10b.
**Source plan:** `34-11-PLAN.md`.
**Procedure:**
1. Open DevTools Network tab + Performance tab (optional).
2. On `/` with a populated board, click an order card.
3. Observe the `DrawerSkeleton` (pulsing placeholder) appears within ~100ms.
4. Observe the populated drawer (real order details + timeline) appears within ~1s.
5. Click a filter pill (e.g., "Pending") — confirm NO skeleton flash; filtering is instant.
6. Type in the search box — confirm NO skeleton flash; filtering is instant.
7. Click the blocked-alert chip (if a Blocked order exists) — same ~1s behavior.
8. Press browser back button — drawer closes via history navigation (deep-link parity confirmation for `history: 'push'`).

**Pass criteria:** Card click → populated drawer in ~1s (not 0–30s); pill/search interactions remain instant; back button toggles drawer.

---

## Retest T11 — Read-only mode RBAC (CORRECTED FIXTURE)

**Closes:** UAT.md T11 (needs_retest).
**No code change.** This is a procedural retest using the correct fixture.

**Background:** The original T11 was run with `e2e-demo+clerk_test@example.com`, which is provisioned with `publicMetadata.roles: ['demo', 'mill_operator']` per Phase 31 D-13 (`docs/clerk-setup.md:37,54-58`). That user IS a mill_operator; the transition buttons rendered legitimately. The retest uses the genuine no-role fixture.

**Preconditions:**
1. Gap-closure plan `34-09-PLAN.md` (T9b RangeError fix) has shipped — without that, the previous `/import` crash recurs and masks the RBAC verification.
2. `e2e-norole+clerk_test@example.com` exists in Clerk Dashboard with NO `publicMetadata.roles` field (or with an explicitly empty `roles` field if D-15 from quick task 260512-kfy was applied — verify via `docs/clerk-setup.md:38,72`).

**Procedure (T11a — no-role fixture):**
1. Sign out. Sign in as `e2e-norole+clerk_test@example.com`.
2. Navigate to `/`.
3. Page must render (no redirect — D-02 says auth gate ONLY; no role gate at the route level).
4. Click any order card. Drawer opens.
5. Confirm the drawer shows the order body (header, fields, timeline) but NO transition action buttons in the action area.
6. Navigate to `/import`. Confirm:
   - The drop zone is NOT visible.
   - The notice `Read-only mode — sign in as mill_operator to import` is visible.
   - The `Recent Imports` table at the bottom IS visible (read-only history is part of D-25).

**Pass criteria for T11a:** No transition buttons in drawer; `/import` shows read-only notice; history table still visible.

**Procedure (T11b — dual-role fixture, positive coverage of Phase 31 D-13):**
1. Sign out. Sign in as `e2e-demo+clerk_test@example.com`.
2. Navigate to `/`. Click any Pending order card.
3. Confirm the drawer DOES show "Start Mixing" + "Block Order" (post D-11 amendment from plan 34-10).
4. Navigate to `/import`. Confirm the drop zone IS visible (this user has `mill_operator` in their roles array).

**Pass criteria for T11b:** Buttons visible; drop zone visible — proves the dual-role fixture works as designed.

---

## Retest T12 — Cross-tab latency

**Closes:** UAT.md T12 (minor enhancement).
**Source plan:** `34-12-PLAN.md`.
**Procedure:**
1. Open Tab A: `http://localhost:3000/`. Note an order's state.
2. Open Tab B: same URL, same browser session.
3. In Tab B: click any transition button on a Pending or Mixing order.
4. Within ~1s of the Tab B action resolving, Tab A's order card moves to the new column. Time the update with a stopwatch or `console.time`.
5. Repeat for Block Order (via modal): in Tab B, open a Mixing order's drawer, click Block, type a reason, confirm. Tab A reflects Blocked state within ~1s.

**Pass criteria:** Cross-tab update latency ≤ ~1s (was ~15s before T12 fix). The 30s polling tick is now the fallback, not the primary mechanism.

---

## Order of execution

Retest in this order to avoid mask-by-blocker scenarios:
1. T3 (search input) — independent.
2. T9 (bulk import) — must precede T11 because T9b's RangeError previously masked T11's `/import` verification.
3. T10 (Pending → Blocked) — independent.
4. T10b (drawer latency) — independent.
5. T11 (read-only mode) — runs after T9 so `/import` is reachable for the no-role check.
6. T12 (cross-tab latency) — independent.

---

## Closure protocol

After each retest:
1. Update `34-HUMAN-UAT.md` for the corresponding test: change `Observed result:` from `issue` / `needs_retest` / `diagnosed` to `pass` (or capture the new failure if any).
2. Flip `34-HUMAN-UAT.md` frontmatter `status: diagnosed` → `status: closed` once ALL tests are `pass`.
3. Mark this retest plan complete by adding a frontmatter line: `status: complete`, `closed_at: YYYY-MM-DD`.

---

## Cross-references

- Companion: `34-HUMAN-UAT.md` (original UAT diagnoses + routing decisions)
- Gap-closure plans: `34-08-PLAN.md` (T3), `34-09-PLAN.md` (T9a+T9b), `34-10-PLAN.md` (T10a), `34-11-PLAN.md` (T10b), `34-12-PLAN.md` (T12)
- Inherited UAT (Phase 33 GAP-02): `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md` (T12-adjacent; already `pass` in 34-HUMAN-UAT.md)
- Fixture reference: `docs/clerk-setup.md` (e2e-mill-operator, e2e-demo dual-role, e2e-norole)
