---
phase: 34-production-dashboard-ui-and-homepage-promotion
reviewed: 2026-05-14T00:00:00Z
depth: quick
files_reviewed: 25
files_reviewed_list:
  - src/actions/import.ts
  - src/app/import/page.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/BlockReasonModal.tsx
  - src/components/BlockedAlertBand.tsx
  - src/components/ColumnSkeleton.tsx
  - src/components/DrawerCloseHandlers.tsx
  - src/components/DrawerSkeleton.tsx
  - src/components/Header.tsx
  - src/components/ImportFlow.tsx
  - src/components/ImportHistoryTable.tsx
  - src/components/LastUpdatedChip.tsx
  - src/components/MillColumn.tsx
  - src/components/ProductionCard.tsx
  - src/components/ProductionDashboard.tsx
  - src/components/ProductionDrawer.tsx
  - src/components/Sidebar.tsx
  - src/components/TransitionButtons.tsx
  - src/components/ui/StatusBadge.tsx
  - src/db/queries/imports.ts
  - src/hooks/useProductionPolling.ts
  - src/lib/auth.ts
  - src/lib/production-derivations.ts
  - src/lib/search-params.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** quick
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Pattern-matched scan of 25 production source files in Phase 34 (production dashboard
UI + homepage promotion). No Critical issues found: server actions correctly
front-load `requireRole('mill_operator')` (AUTH-02), DB queries use parameterised
Drizzle (no SQLi surface), no hardcoded secrets, no `eval`/`innerHTML`/
`dangerouslySetInnerHTML`, server-only modules properly fenced with `'server-only'`,
and `revalidateTag('import-batches', …)` correctly pairs commit producer with
`getImportBatches` consumer (D-21).

Four Warning-class defects: (1) a mislabelled drawer field that shows the wrong
data to operators; (2) non-null assertions on `userId` inside server-action DB
inserts that will crash with a generic 'server' error if Clerk's session shape
ever drifts; (3) `Sidebar.isActive` prefix-matches `/import` against paths like
`/imports` or `/import-foo`; (4) `BlockReasonModal` clears `reason` state AFTER
`onClose()` which causes a stale-text flash on re-open. Info items are cosmetic
or minor.

## Warnings

### WR-01: ProductionDrawer "Formula Type" field renders `textureType`

**File:** `src/components/ProductionDrawer.tsx:216`
**Issue:** The FieldRow labelled `Formula Type` is wired to `order.textureType`,
not to a formula-type field. UI-SPEC §4 mill operators rely on these labels to
make commit decisions; showing texture data under "Formula Type" is a
display-correctness defect (wrong information delivered to operator). The
production_orders schema has no formula_type column (confirmed by the comments
in `commitImportAction` at lines 663-670 and 718-720), so the label should be
either removed or changed to "Texture Type".
**Fix:**
```tsx
<FieldRow label="Texture Type" value={order.textureType ?? '—'} />
```
Or, if the design genuinely intended Formula Type, the schema needs a new column
plus its preview/commit/UI plumbing — out of scope for a label tweak.

### WR-02: `userId!` non-null assertions on audit-trail inserts can crash commit

**File:** `src/actions/import.ts:706, 734, 745, 786`
**Issue:** `commitImportAction` calls `const { userId } = await auth()` without
verifying `userId !== null`, then injects it into INSERTs via `userId!`
(`changedBy: userId!`, `createdBy: userId!`, `importedBy: userId!`). The
`requireRole('mill_operator')` call above does redirect on `!userId`, so the
happy path is fine — but the redirect is `next/navigation` throwing
`NEXT_REDIRECT`, which is caught here only if the framework intercepts it. If
session-claim shape ever drifts (Clerk returning `userId: null` for a session
the framework didn't redirect), the `userId!` non-null assertion crashes inside
the per-row try/catch, surfacing as `error: String(err)` per row — burying a
real auth bug as a "row insert failed" string with no logged stack.
**Fix:** Validate `userId` once after `requireRole` and return a clean validation
error if it's somehow null:
```ts
const { userId } = await auth();
if (!userId) return { ok: false, code: 'unauthorized', message: 'Not signed in.' };
```
Then drop the `!` assertions below — TS narrows the local correctly.

### WR-03: `Sidebar.isActive` over-matches paths starting with `/import`

**File:** `src/components/Sidebar.tsx:34`
**Issue:** `pathname.startsWith(href)` for `href='/import'` highlights the
Import nav item for any path beginning with the literal `/import` — including
hypothetical `/imports`, `/import-history`, `/importable`, etc. Currently
harmless because no such routes exist, but a future route like `/import/123`
correctly stays active (good), while `/imports` would also activate it (bad).
Same risk for `/settings` vs. `/settings-old`. This is a latent navigation bug
that will mislead users the moment such a path is added.
**Fix:**
```ts
function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
```

### WR-04: `BlockReasonModal` resets `reason` AFTER calling `onClose()`

**File:** `src/components/BlockReasonModal.tsx:54-57`
**Issue:** Inside the `useActionState` callback, on success the modal calls
`onClose()` (sets parent `modalOpen=false`) BEFORE `setReason('')`. Order is
React-batched in v18+, but the parent's state change can cause the modal to
unmount before the setReason fires on a stale instance — depending on React's
auto-batching boundary you can see the previous reason on the NEXT modal open.
Also: if the parent unmounts the component, `setReason` may fire on an unmounted
component and log a warning. Reverse the order to be safe.
**Fix:**
```ts
async () => {
  const result = await blockOrder(orderId, version, reason);
  if (result.ok) {
    setReason('');   // clear local state first
    onClose();       // then notify parent
  }
  return result;
},
```

## Info

### IN-01: `void tick;` unused-suppression workaround in LastUpdatedChip

**File:** `src/components/LastUpdatedChip.tsx:56`
**Issue:** `void tick;` is used to silence the `no-unused-vars` lint after the
5s interval re-render trick. The intent is fine but the pattern is opaque to
readers — comment is helpful but the technique is fragile.
**Fix:** Either rename `tick`/`_tick` (the underscore convention is enabled in
most ESLint configs) or move the formatRelative call into a useState with a
useEffect cadence so the dependency is explicit.

### IN-02: Redundant `[...events].sort(...)` in ProductionDrawer

**File:** `src/components/ProductionDrawer.tsx:164-167`
**Issue:** `events` are documented (line 170) as already arriving in DESC order
from `getOrderEvents`. The blockerNote derivation does `[...events].sort(...)`
to DESC again before `.find(toState === 'Blocked')`. Redundant work — a simple
`events.find(e => e.toState === 'Blocked')` over the already-DESC array
returns the same result. Not a correctness bug, just dead work.
**Fix:** `const blockerNote = order.state === 'Blocked'
  ? events.find(e => e.toState === 'Blocked')?.note
  : undefined;`

### IN-03: `clipboard-style` `formatWeight` in ProductionCard has dead branch

**File:** `src/components/ProductionCard.tsx:36-41`
**Issue:** `formatWeight` does `if (lbs >= 1000) return lbs.toLocaleString();
return lbs.toLocaleString();` — both branches identical. Either drop the
conditional or pick one formatter for `< 1000`. Dead code carried over from
prior-art (per "Copied from MillProductionUI.tsx" comment).
**Fix:** `function formatWeight(lbs: number): string { return lbs.toLocaleString(); }`

### IN-04: `void STATE_COLORS;` retained for "plan 06 reference" in ProductionDashboard

**File:** `src/components/ProductionDashboard.tsx:73`
**Issue:** Dead local const (`STATE_COLORS` defined lines 53-70 then immediately
`void`-suppressed at line 73). If Wave-1 reference is no longer needed, drop the
declaration entirely. If still needed for downstream phases, move to a fixtures
file. As-is it ships 18 lines of unused style data into the client bundle.
**Fix:** Delete lines 49-73 if Phase 34 doesn't consume them; or keep only the
import-side reference for the next phase.

### IN-05: `DrawerSkeleton` width hard-coded to `w-[480px]` but parent renders inside flex container

**File:** `src/components/DrawerSkeleton.tsx:19`
**Issue:** Skeleton fixed at `w-[480px]` is correct vs. the populated drawer's
`w-[480px]` (ProductionDrawer:178), so layout shift is avoided — BUT the
populated drawer is `fixed right-0 top-0` while the Suspense fallback is
rendered inline by ProductionDashboard:275 (no `fixed` positioning). The
skeleton therefore appears in the document flow until the order resolves,
then jumps to a `fixed` slide-over — visible layout shift the skeleton was
intended to prevent.
**Fix:** Wrap the skeleton in the same `fixed right-0 top-0 z-40 h-full
bg-[var(--bg-card)] shadow-xl` container so it occupies the drawer slot rather
than the inline parent.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_
