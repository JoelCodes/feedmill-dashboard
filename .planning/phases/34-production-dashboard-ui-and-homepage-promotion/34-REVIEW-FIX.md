---
phase: 34-production-dashboard-ui-and-homepage-promotion
fixed_at: 2026-05-14T00:00:00Z
review_path: .planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 34: Code Review Fix Report

**Fixed at:** 2026-05-14
**Source review:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01 through WR-04; IN-01..IN-05 excluded per scope)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: ProductionDrawer "Formula Type" field renders `textureType`

**Files modified:** `src/components/ProductionDrawer.tsx`
**Commit:** `1172c8a`
**Applied fix:** Changed `label="Formula Type"` to `label="Texture Type"` at line 216. The field renders `order.textureType` and there is no `formula_type` column in the schema; the label was simply wrong.

### WR-02: `userId!` non-null assertions on audit-trail inserts can crash commit

**Files modified:** `src/actions/import.ts`
**Commit:** `a3021b6`
**Applied fix:** Moved the `const { userId } = await auth()` call outside the per-row try block (right after the decisions schema validation), added a null-guard `if (!userId) return { ok: false, code: 'unauthorized', message: 'Not signed in.' }`, and removed all four `userId!` non-null assertions at the original lines 706, 734, 745, and 786. TypeScript now narrows `userId` to `string` after the guard, so the assertions are unnecessary.

### WR-03: `Sidebar.isActive` over-matches paths starting with `/import`

**Files modified:** `src/components/Sidebar.tsx`
**Commit:** `25514f1`
**Applied fix:** Replaced `return pathname.startsWith(href)` with `return pathname === href || pathname.startsWith(href + '/')` in the `isActive` function. This correctly highlights the nav item for exact matches and true child routes (e.g. `/import/123`) without activating for paths like `/imports` or `/import-foo`.

### WR-04: `BlockReasonModal` resets `reason` AFTER calling `onClose()`

**Files modified:** `src/components/BlockReasonModal.tsx`
**Commit:** `8c43595`
**Applied fix:** Swapped the order inside the `useActionState` callback so `setReason('')` is called before `onClose()`. This ensures local state is cleared before the parent unmounts the component, preventing stale text from appearing on the next modal open.

## Skipped Issues

None — all 4 in-scope findings were fixed successfully.

---

## Post-fix Test Run

Full suite (`npx jest --testPathIgnorePatterns="/node_modules/" ...`) after fast-forwarding `main`:

- **71 / 72 test suites passed**
- **715 / 729 tests passed**
- **1 failing suite:** `src/app/settings/__tests__/page.test.tsx` — 14 failures, all due to `ClerkProvider` not being present in test setup. These failures are pre-existing and unrelated to phase 34 changes.

No regressions introduced by the four fixes.

---

_Fixed: 2026-05-14_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
