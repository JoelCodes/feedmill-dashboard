---
phase: 34-production-dashboard-ui-and-homepage-promotion
reviewed: 2026-05-14T00:00:00Z
depth: deep
files_reviewed: 50
files_reviewed_list:
  - src/actions/__tests__/import-commit.test.ts
  - src/actions/import.ts
  - src/app/import/__tests__/page.test.tsx
  - src/app/import/page.tsx
  - src/app/layout.tsx
  - src/app/page.test.tsx
  - src/app/page.tsx
  - src/components/BlockReasonModal.test.tsx
  - src/components/BlockReasonModal.tsx
  - src/components/BlockedAlertBand.test.tsx
  - src/components/BlockedAlertBand.tsx
  - src/components/ColumnSkeleton.test.tsx
  - src/components/ColumnSkeleton.tsx
  - src/components/DashboardLayout.test.tsx
  - src/components/DrawerCloseHandlers.test.tsx
  - src/components/DrawerCloseHandlers.tsx
  - src/components/DrawerSkeleton.test.tsx
  - src/components/DrawerSkeleton.tsx
  - src/components/Header.test.tsx
  - src/components/Header.tsx
  - src/components/ImportFlow.test.tsx
  - src/components/ImportFlow.tsx
  - src/components/ImportHistoryTable.test.tsx
  - src/components/ImportHistoryTable.tsx
  - src/components/LastUpdatedChip.test.tsx
  - src/components/LastUpdatedChip.tsx
  - src/components/MillColumn.test.tsx
  - src/components/MillColumn.tsx
  - src/components/ProductionCard.test.tsx
  - src/components/ProductionCard.tsx
  - src/components/ProductionDashboard.test.tsx
  - src/components/ProductionDashboard.tsx
  - src/components/ProductionDrawer.test.tsx
  - src/components/ProductionDrawer.tsx
  - src/components/Sidebar.test.tsx
  - src/components/Sidebar.tsx
  - src/components/TransitionButtons.test.tsx
  - src/components/TransitionButtons.tsx
  - src/components/ui/StatusBadge.test.tsx
  - src/components/ui/StatusBadge.tsx
  - src/db/queries/__tests__/imports.test.ts
  - src/db/queries/imports.ts
  - src/hooks/__tests__/useProductionPolling.test.ts
  - src/hooks/useProductionPolling.ts
  - src/lib/__tests__/production-derivations.test.ts
  - src/lib/__tests__/search-params.test.ts
  - src/lib/auth.ts
  - src/lib/production-derivations.ts
  - src/lib/search-params.ts
findings:
  critical: 3
  warning: 7
  info: 4
  total: 14
status: issues_found
---

# Phase 34: Code Review Report (Deep Re-Review)

**Reviewed:** 2026-05-14
**Depth:** deep
**Files Reviewed:** 50
**Status:** issues_found

## Summary

This is a **deep** re-review of phase 34 covering 50 source files (implementation + tests + RSC pages + hooks + libs). It re-validates findings from the prior standard-depth review (2026-05-14, status `issues_found`, 2 critical / 4 warning / 3 info) against current file state and adds cross-file/contract-boundary findings unique to deep depth.

Verification of prior findings against current source:

| Prior ID | Status | Current location |
| --- | --- | --- |
| CR-01 (ImportFlow unhandled rejection — stuck spinner) | **STILL APPLIES** | `src/components/ImportFlow.tsx:71-105, 129-164` — no try/catch around `await previewImportAction` or `await commitImportAction`. Promoted to **CR-01** below. |
| CR-02 (BlockReasonModal stale `reason` closure) | **PARTIALLY APPLIES — DOWNGRADED** | `src/components/BlockReasonModal.tsx:53-66` — useActionState callback still closes over `reason`/`onClose`; tests pass via jsdom synchronous re-render coincidence. Documented under **WR-04** (production runtime risk under React concurrent scheduler). |
| WR-01 (suppressed exhaustive-deps in ProductionDashboard debounce) | STILL APPLIES | `src/components/ProductionDashboard.tsx:165-168` — bare `// eslint-disable-next-line` with no justification comment. **WR-01** below. |
| WR-02 (Header `toggleDropdown` missing useCallback + non-functional setter) | STILL APPLIES | `src/components/Header.tsx:72-74` — unchanged. **WR-02** below. |
| WR-03 (ImportHistoryTable references `React.JSX.Element` without import) | STILL APPLIES + WIDENED | `src/components/ImportHistoryTable.tsx:11,36`, `src/app/page.tsx:27`, `src/app/import/page.tsx:23` — all three references rely on `react-jsx`'s ambient namespace augmentation. **WR-03** below (widened to all 3 files). |
| WR-04 (BlockReasonModal `router.refresh` ordering) | **PARTIALLY ADDRESSED** | Fixer reordered `setReason('') → onClose()` but `router.refresh()` STILL runs before `onClose()` (`BlockReasonModal.tsx:60-62`). The original ordering concern is unresolved; folded into **WR-04**. |
| IN-01 (`STATE_COLORS` dead code in ProductionDashboard) | STILL APPLIES | `src/components/ProductionDashboard.tsx:53-73` — unchanged, still suppressed via `void STATE_COLORS`. **IN-01** below. |
| IN-02 (`"2 MB"` hardcoded in ImportFlow strings) | STILL APPLIES | `src/components/ImportFlow.tsx:77,209` — unchanged. **IN-02** below. |
| IN-03 (Header.test.tsx duplicate cases for `/import` + `/demo/orders`) | STILL APPLIES | `src/components/Header.test.tsx:62-88` — both tests still present. **IN-03** below. |

The deep pass adds five new findings unique to cross-file analysis:

- **CR-02 (NEW)** — `TransitionButtons` sub-buttons close over `version` from props at first render; the `useActionState` action does NOT receive new `version` after `router.refresh()`, so the next click sends the stale version and triggers a spurious conflict.
- **CR-03 (NEW)** — `ImportHistoryTable` hard-pins a "string `importedAt` MUST throw RangeError" contract via test, but `src/app/import/page.tsx:28` returns `getImportBatches()` results directly to its consumer (no defensive hydration). A future caller that bypasses `ImportFlow` will crash; the test pinned the bug instead of the contract.
- **WR-05 (NEW)** — `ProductionDashboard` and `ProductionDrawer` and `BlockedAlertBand` each independently call `useQueryStates({ order }, { shallow: false, history: 'push' })` — three parallel hooks, three duplicated option literals. If one drifts, the URL contract breaks asymmetrically.
- **WR-06 (NEW)** — `STATE_ORDER` is duplicated in three files (`search-params.ts`, `production-derivations.ts`, `MillColumn.tsx COLUMN_STATE_ORDER`) with conflicting orderings and conflicting "do not import from MillProductionUI" rules. No single source of truth.
- **WR-07 (NEW)** — `dateToIsoString` in `import.ts:113` slices `toISOString().split('T')[0]` to derive the date — this is **timezone-dependent**: a Date created from `'2025-08-15'` in UTC reads as `2025-08-14` in `America/Los_Angeles`. Production server vs operator's local clock divergence will silently mis-date imported orders.
- **IN-04 (NEW)** — `BlockedAlertBand` chips lack `aria-label`/`title` on the underlying `<button>` — operators relying on screen-readers hear only the inner text "BLOCKED: ORD-001 (Premix)" with no actionable verb.

---

## Critical Issues

### CR-01: `ImportFlow` — unhandled rejection in `previewImportAction` / `commitImportAction` leaves UI in stuck spinner

**File:** `src/components/ImportFlow.tsx:71-105, 129-164`

**Issue:** Both `onFileSelect` (line 71) and `handleCommit` (line 129) `await` server actions without `try/catch`. If `previewImportAction` or `commitImportAction` throws — network error, server 500, Next.js serialisation failure, malformed RSC payload — the promise rejects and the synchronous `setIsPending(false)` calls at lines 88 and 148 are **never reached**. The button text remains `"Processing…"` / `"Committing…"`, the input stays `disabled={isPending}`, and the operator cannot retry without a full page refresh.

The test suite covers `{ ok: false }` (validation error) but **never covers a rejected promise** — `mockPreviewImportAction.mockResolvedValue(...)` and `mockCommitImportAction.mockResolvedValue(...)` always resolve. The throw-path has zero test coverage.

This is the same finding as CR-01 in the prior standard-depth review (2026-05-14). It was NOT addressed in `34-REVIEW-FIX.md` (the fixer scoped a different set of WR-* items from a different review iteration).

**Reproduction:** Block the network in DevTools, open `/import`, drop a valid `.xlsx`. The spinner spins forever; "Browse file" remains disabled. No console error visible to the operator.

**Fix:** Wrap each `await` in `try/catch/finally`:

```ts
// onFileSelect
async function onFileSelect(file: File) {
  setError(null);

  if (file.size > MAX_IMPORT_BYTES) {
    setError('File exceeds 2 MB limit. Please upload a smaller file.');
    return;
  }

  setCurrentFile(file);
  setIsPending(true);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const result: PreviewResult = await previewImportAction(formData);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const initialDecisions: Record<number, 'skip' | 'overwrite'> = {};
    for (const row of result.rows) {
      if (row.isDuplicate) initialDecisions[row.rowIndex] = 'skip';
    }
    setRowDecisions(initialDecisions);
    setPreview({ summary: result.summary, rows: result.rows });
    setPhase('preview');
  } catch (err) {
    console.error('[ImportFlow.onFileSelect] preview failed:', err);
    setError('Could not process file. Please try again.');
  } finally {
    setIsPending(false);
  }
}

// handleCommit — same pattern around the await
```

Add a regression test using `mockPreviewImportAction.mockRejectedValue(new Error('network'))` that asserts the button is re-enabled and an error message is visible.

---

### CR-02: `TransitionButtons` sub-buttons pin `orderId`/`version` at first render — second click after refresh sends stale version → spurious conflict

**File:** `src/components/TransitionButtons.tsx:54-88, 92-124, 140-177`

**Issue:** `StartMixingButton`, `CompleteOrderButton`, and `ResumeButton` each take `orderId` and `version` as props and pass them to `useActionState` via an inline arrow:

```tsx
const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
  async (_prev) => transitionToMixing(orderId, version),  // closes over PROPS at render time
  null
);
```

`useActionState` memoises the **first** action callback it receives — subsequent renders that receive new props (e.g. updated `version` after `router.refresh()`) do **not** rebind the closure. The pinned action keeps calling `transitionToMixing(orderId, OLD_version)`.

**Sequence that triggers the bug:**

1. Operator opens drawer for order at version `1`. `StartMixingButton` mounts with `version=1`.
2. Operator clicks "Start Mixing" → server returns `{ ok: true }` → `useEffect` (lines 67-76) calls `router.refresh()` → parent RSC re-renders → drawer re-renders → button re-renders with `version=2` (new prop).
3. Operator clicks "Start Mixing" a second time (e.g., they wanted to start a sibling order but the same drawer is still mounted because nuqs hasn't unmounted it yet).
4. The pinned action callback fires `transitionToMixing(orderId, 1)` — **stale version**.
5. Server returns `{ ok: false, code: 'conflict', message: 'Order was modified by another user. Please refresh.' }` → conflict banner appears spuriously.

The conflict UI at lines 83-85 / 119-121 / 172-174 then **also** triggers `router.refresh()` via the same `useEffect`, masking the bug as a "transient cross-tab conflict" — but it is entirely self-induced.

The same fix is already required for `BlockReasonModal` (closes over `version` and `reason`) — see WR-04. Both should use the `FormData` argument that `useActionState` actually provides to the action (or at minimum read state via a `useRef` updated in a `useEffect` per render).

**Why standard-depth missed this:** this only surfaces with cross-render prop tracing. The unit tests render once with a fixed `order` prop, never simulate prop change after refresh.

**Fix (per sub-button):**

Pass `orderId`/`version` through `FormData` (canonical `useActionState` pattern), or use a `useRef` to access fresh prop values inside the action:

```tsx
export function StartMixingButton({ orderId, version }: { orderId: string; version: number }) {
  const router = useRouter();
  const propsRef = useRef({ orderId, version });
  useEffect(() => { propsRef.current = { orderId, version }; }, [orderId, version]);

  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => {
      const { orderId: id, version: v } = propsRef.current; // always fresh
      return transitionToMixing(id, v);
    },
    null
  );
  // ... rest unchanged
}
```

Add a regression test that re-renders the button with `version=2` after a successful `version=1` action and asserts the next click sends `version=2`.

---

### CR-03: `ImportHistoryTable` test pins broken behavior as contract — string `importedAt` crashes the page if any caller bypasses `ImportFlow`

**Files:** `src/components/ImportHistoryTable.tsx:74`, `src/components/ImportHistoryTable.test.tsx:116-137`, `src/components/ImportFlow.tsx:61-67`, `src/app/import/page.tsx:28-32`

**Issue:** `ImportHistoryTable` calls `formatBatchDate(batch.importedAt)` at line 74. `formatBatchDate` (line 19) calls `Intl.DateTimeFormat(...).format(d)` where `d: Date` — passing a string crashes with `RangeError: Invalid time value`.

Today's only caller, `ImportFlow`, hydrates strings → Dates inside a `useMemo` (lines 61-67). But:

1. The page RSC `ImportPage` (`src/app/import/page.tsx:28`) returns `await getImportBatches({ limit: 10 })` straight to `<ImportFlow batches={batches} ... />`. The hydration burden is on the client component, not the server boundary where the type-loss actually happens. Any future caller that renders `ImportHistoryTable` directly (e.g. an admin page, an embedded dashboard widget, a Storybook story, an SSR'd email) skips the `useMemo` shim and crashes.

2. The test at lines 116-137 explicitly **enshrines** the crash:
   ```ts
   expect(() => render(<ImportHistoryTable batches={badBatches} />)).toThrow(RangeError);
   ```
   This pins the type lie as a contract instead of fixing it. A reviewer running `npm test` will see green and assume the date handling is correct — but green here means "we still crash on bad input."

3. The fundamental fix is to push hydration to the data-access boundary (the query) or to make `formatBatchDate` accept `Date | string` and normalize internally — either approach removes the trap entirely. The current architecture leaves a 1-call-site-deep cliff that any future contributor will fall off.

**Fix:** Make `formatBatchDate` accept `Date | string`:

```ts
function formatBatchDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return ''; // defensive
  return new Intl.DateTimeFormat('en-US', { /* ... */ }).format(date);
}
```

Remove the `useMemo` hydration in `ImportFlow.tsx:61-67` (no longer needed). Replace the test at `ImportHistoryTable.test.tsx:116-137` with one that asserts strings render correctly:

```ts
it('renders correctly when importedAt is an ISO string (matches RSC serialization)', () => {
  const stringBatches = [{ id: 'b1', fileName: 'Book1.xlsx', rowCount: 33, importedBy: 'u', importedAt: '2026-05-14T19:00:00.000Z' }] as unknown as ImportBatch[];
  expect(() => render(<ImportHistoryTable batches={stringBatches} />)).not.toThrow();
  expect(screen.getByText('Book1.xlsx')).toBeInTheDocument();
});
```

---

## Warnings

### WR-01: `ProductionDashboard` — suppressed `react-hooks/exhaustive-deps` hides missing `setQuery` dependency

**File:** `src/components/ProductionDashboard.tsx:165-168`

**Issue:** Same finding as prior WR-01. The debounce effect:

```ts
useEffect(() => {
  setQuery({ q: debouncedSearch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearch]);
```

`setQuery` from nuqs is stable, so omitting it is safe in practice — but the bare suppression with no justification is a maintenance hazard. Future edits to this effect will inherit the suppression and any actual missing dep will be silently swallowed.

**Fix:** Replace the bare disable with an explicit one:

```ts
useEffect(() => {
  setQuery({ q: debouncedSearch });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setQuery is stable per nuqs contract; omitting prevents redundant URL writes.
}, [debouncedSearch]);
```

---

### WR-02: `Header.tsx` — `toggleDropdown` missing `useCallback` and uses non-functional setter

**File:** `src/components/Header.tsx:72-74`

**Issue:** Same finding as prior WR-02. `handleMarkAsRead` and `handleClearAll` are wrapped in `useCallback`; `toggleDropdown` is not, and reads `isDropdownOpen` directly:

```ts
const toggleDropdown = () => {
  setIsDropdownOpen(!isDropdownOpen);
};
```

Two issues:
1. New function reference every render — passes a new `onClick` prop to the `<button>`, breaking shallow-equality memoization in any wrapping memoized parent.
2. Reads `isDropdownOpen` from closure — under batched renders the value can be stale, toggling to the wrong state.

**Fix:**

```ts
const toggleDropdown = useCallback(() => {
  setIsDropdownOpen((prev) => !prev);
}, []);
```

---

### WR-03: `React.JSX.Element` referenced without `import React` in 3 source files

**Files:**
- `src/components/ImportHistoryTable.tsx:36`
- `src/app/page.tsx:27`
- `src/app/import/page.tsx:23`

**Issue:** All three files annotate their function return type as `React.JSX.Element` (or `Promise<React.JSX.Element>`) but **none of them imports React**. With `tsconfig.json` `"jsx": "react-jsx"`, JSX transpiles without a React import, but explicitly referencing the `React` namespace in a type position relies on TypeScript's ambient global augmentation from the `react-jsx` mode. This compiles today, but:

- It is inconsistent with `ImportFlow.tsx`, `ProductionDashboard.tsx`, `BlockReasonModal.tsx`, `MillColumn.tsx`, `ProductionDrawer.tsx` — all of which DO import React explicitly when they reference `React.JSX.Element`.
- The pattern is fragile: `@types/react` ships the global augmentation behind a conditional that future React/Next versions may revisit.
- The fix is trivial.

**Fix (per file):** Either add `import React from 'react';` or change the return type to `JSX.Element` (without the `React.` prefix — it works under the same global augmentation):

```ts
// src/app/page.tsx:27 + src/app/import/page.tsx:23
}: { searchParams: Promise<SearchParams> }): Promise<JSX.Element> {

// src/components/ImportHistoryTable.tsx:36
export default function ImportHistoryTable({ batches }: Props): JSX.Element {
```

---

### WR-04: `BlockReasonModal` action callback closes over `reason`, `version`, `onClose`, and `orderId` — same root cause as CR-02

**File:** `src/components/BlockReasonModal.tsx:53-67`

**Issue:** Same memoisation pitfall as CR-02 (TransitionButtons), surfaced separately because the prior review (2026-05-14) marked this as CR-02 / disputed and the fixer addressed a side-effect of it (the `router.refresh()` ordering) without fixing the closure itself.

```ts
const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
  async () => {
    const result = await blockOrder(orderId, version, reason);  // pinned at first render
    if (result.ok) {
      router.refresh();
      setReason('');
      onClose();   // also pinned — parent's onClose ref captured at first render
    }
    return result;
  },
  null
);
```

The `BlockReasonModal.test.tsx` Test 6 passes today because jsdom's `userEvent.type` causes synchronous re-renders before the form submission. Under React's concurrent scheduler in production this contract is not guaranteed. If the parent `<ProductionDrawer>` re-renders and passes a new `onClose` reference (which it does on every render — `onClose={() => setModalOpen(false)}` is a new arrow each time), `BlockReasonModal`'s pinned action keeps calling the OLD `onClose`. The same is true for `version` — after `router.refresh()` bumps it, the next click submits with stale version and the server returns conflict.

The `router.refresh() → setReason('') → onClose()` ordering at lines 60-62 also kicks an async RSC fetch before the modal unmounts. The fixer reordered `setReason → onClose` per the Review-Fix report but `router.refresh()` was NOT moved. The race window is narrow (modal unmount fires before the refresh's RSC payload arrives) but the order should still be `setReason() → onClose() → router.refresh()` to avoid scheduling state updates on a soon-to-unmount component.

**Fix:**

```tsx
const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
  async (_prev, formData) => {
    const currentReason = formData.get('reason') as string;
    const result = await blockOrder(orderId, version, currentReason);
    if (result.ok) {
      setReason('');
      onClose();
      router.refresh();  // schedule RSC fetch AFTER unmount handoff
    }
    return result;
  },
  null
);

// In the form add a hidden field:
<input type="hidden" name="reason" value={reason} />
```

For `orderId`/`version`/`onClose`, mirror the `useRef` pattern recommended in CR-02.

---

### WR-05: Three parallel `useQueryStates({ order })` hooks each duplicate the `{ shallow: false, history: 'push' }` options — drift risk

**Files:**
- `src/components/ProductionDashboard.tsx:154-157`
- `src/components/ProductionDrawer.tsx:128-131`
- `src/components/BlockedAlertBand.tsx:31-34`

**Issue:** All three components call `useQueryStates({ order: parseAsString.withDefault('') }, { shallow: false, history: 'push' })`. Each owns an independent copy of the parser config and the option literals. nuqs reconciles them at runtime (they all bind to the same `?order=` URL key), but:

1. If a future plan changes the option (e.g. `history: 'replace'` for in-place replacement), the developer must edit **three** files. Forgetting one creates inconsistent behavior — clicking a blocked-band chip pushes to history but clicking a column card does not.

2. The `parseAsString.withDefault('')` parser is also duplicated. Same drift risk.

3. The acceptance tests for T10b (`BlockedAlertBand.test.tsx:108-125`, `ProductionDrawer.test.tsx:222-238`, `ProductionDashboard.test.tsx:399-441`) ALSO duplicate the assertion — three places where the same option object is verified.

This is a textbook case for a shared hook.

**Fix:** Extract to `src/hooks/useOrderQuery.ts`:

```ts
'use client';
import { useQueryStates, parseAsString } from 'nuqs';

const ORDER_PARSERS = { order: parseAsString.withDefault('') } as const;
const ORDER_OPTIONS = { shallow: false as const, history: 'push' as const };

export function useOrderQuery() {
  return useQueryStates(ORDER_PARSERS, ORDER_OPTIONS);
}
```

Then each consumer becomes a one-liner:

```ts
const [{ order }, setOrderQuery] = useOrderQuery();
```

The three T10b acceptance tests collapse to one test of `useOrderQuery`.

---

### WR-06: `STATE_ORDER` constant is duplicated across 3 files with conflicting orderings — risk of UI/filter divergence

**Files:**
- `src/lib/search-params.ts:36` — `STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked']` (parser/filter order)
- `src/lib/production-derivations.ts:22` — local `STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked']` (grouping order)
- `src/components/MillColumn.tsx:16` — `COLUMN_STATE_ORDER = ['Completed', 'Mixing', 'Blocked', 'Pending']` (visual column order)

**Issue:** Three separate constants encode "the order of production states" with two distinct meanings:

- **Parsing/filter order** (search-params, derivations) — used by `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))` to validate URL values, and by `groupOrdersByState` to seed the empty-bucket reducer.
- **Visual column order** (MillColumn) — Completed → Mixing → Blocked → Pending — used to render the state sections inside each mill column.

The justification comment in `production-derivations.ts:14-21` says it's "intentionally duplicated so this pure module stays free of `'server-only'` imports." This is correct — `search-params.ts` imports from `nuqs/server`. But the duplication means:

1. If the canonical state set ever changes (e.g. a new `'Cancelled'` state is added), the developer must edit all three files. Today's `ProductionState` schema type catches the type error at compile time, but the **order** of literals in a `as const` tuple is significant and TypeScript will not warn if one file is edited without the others.

2. `production-derivations.ts:22` declares `STATE_ORDER` but only uses it in `groupOrdersByState` (line 37). The same module also defines `filterOrders` and `isOrderNextUp` which do NOT use the constant — so its "purpose" inside this file is entirely the seed of the reducer. Could be inlined.

**Fix:** Move the canonical literal tuple to a non-`server-only` module (or re-export from `search-params.ts` via a separate non-server file). Have all three files import from one source:

```ts
// src/lib/state-order.ts (new — pure, no server-only)
import type { ProductionState } from '@/db/schema/orders';
export const STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const satisfies readonly ProductionState[];
export const COLUMN_STATE_ORDER = ['Completed', 'Mixing', 'Blocked', 'Pending'] as const satisfies readonly ProductionState[];
```

Update `search-params.ts`, `production-derivations.ts`, `MillColumn.tsx` to import from `@/lib/state-order`.

---

### WR-07: `dateToIsoString` in `import.ts` is timezone-dependent — silent off-by-one-day for non-UTC server clocks

**File:** `src/actions/import.ts:113-118`

**Issue:**

```ts
function dateToIsoString(d: unknown): string {
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}
```

`Date.toISOString()` always returns UTC. If the source XLSX stores `'2025-08-15'` (which `read-excel-file` interprets as `2025-08-15T00:00:00.000` in **local server time**), then on a server in `America/Los_Angeles` (UTC-7) the resulting Date is `2025-08-15T00:00:00-07:00` = `2025-08-15T07:00:00Z` — same date in UTC. But on a server in `Asia/Tokyo` (UTC+9) the same XLSX value becomes `2025-08-15T00:00:00+09:00` = `2025-08-14T15:00:00Z` — **different date** when sliced.

The Vercel/Neon production environment runs in UTC (low risk), but local-dev environments and CI runners do not. This means imports that pass in local dev silently change date on production deploy, or vice versa. The error is invisible — the row commits successfully with a one-day-off `delivery_time`.

**Fix:** Use UTC-safe components:

```ts
function dateToIsoString(d: unknown): string {
  if (d instanceof Date && !isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}
```

Or, better, document the contract that `read-excel-file` returns dates with the UTC interpretation already applied (verified per its v9.x docs) and add a regression test that pins behavior in `TZ=Asia/Tokyo`:

```ts
it('dateToIsoString returns UTC date regardless of process.env.TZ', () => {
  const originalTZ = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Tokyo';
    const d = new Date('2025-08-15T00:00:00Z');
    expect(dateToIsoString(d)).toBe('2025-08-15');
  } finally {
    process.env.TZ = originalTZ;
  }
});
```

---

## Info

### IN-01: `ProductionDashboard` — `STATE_COLORS` is dead code kept via `void` suppressor

**File:** `src/components/ProductionDashboard.tsx:53-73`

**Issue:** Same finding as prior IN-01. `STATE_COLORS` (10-line record) is declared and immediately voided with `void STATE_COLORS`. The justifying comment "kept for plan 06 reference (D-01)" is from the WIP cycle; plan 06 has shipped. The constant is duplicated in `MillColumn.tsx:27-32` and `ProductionCard.tsx:10-27` (both with their own slightly different shape — only `header` field, vs full `border`+`header`). Three places where the same color contract lives.

**Fix:** Remove `STATE_COLORS` and `void STATE_COLORS`. If the color contract truly needs a single source (it should), extract to `src/lib/state-colors.ts` and import from `MillColumn.tsx` and `ProductionCard.tsx` — but that is out of scope for this finding; minimum fix is to delete the dead block.

---

### IN-02: `ImportFlow` — hardcoded `"2 MB"` strings diverge from `MAX_IMPORT_BYTES` constant

**File:** `src/components/ImportFlow.tsx:77, 209`

**Issue:** Same finding as prior IN-02.

- Line 77: `setError('File exceeds 2 MB limit. Please upload a smaller file.');`
- Line 209: `or click to browse — .xlsx only, max 2 MB`

`MAX_IMPORT_BYTES = 2 * 1024 * 1024` is imported (line 29) but only used for the boolean check. If the constant ever changes (e.g. doubled for a Pro plan), the strings diverge silently.

The server-side error in `import.ts:393, 565` says `'File exceeds 2MB limit.'` (no space before MB) while the client says `'File exceeds 2 MB limit. Please upload a smaller file.'` (with space, with sentence). Three rendered variants of the same constraint.

**Fix:** Derive the display value from the constant:

```ts
const MAX_IMPORT_MB = MAX_IMPORT_BYTES / (1024 * 1024);

setError(`File exceeds ${MAX_IMPORT_MB} MB limit. Please upload a smaller file.`);
// JSX: `or click to browse — .xlsx only, max ${MAX_IMPORT_MB} MB`
```

---

### IN-03: `Header.test.tsx` — Tests at lines 72-79 and 82-88 duplicate existing `it.each` coverage

**File:** `src/components/Header.test.tsx:62-88`

**Issue:** Same finding as prior IN-03.

- Test at line 63 ("Test 9: shows 'Import' title for '/import'") and the test at line 72 ("Test 10: shows 'Import' title for '/import' even with query in actual URL") are identical assertions because the `mockUsePathname.mockReturnValue("/import")` body is the same — the comment about "even with query" is meaningless because `usePathname` strips query strings before the test sees the value.
- Test at line 82 ("Test 11: '/demo/orders' → 'Orders'") is already covered by row `["/demo/orders", "Orders"]` in the `it.each` cases at line 32.

Pure maintenance cost.

**Fix:** Remove Tests 10 and 11. Add a one-line comment to Test 9 noting that `usePathname` strips query strings.

---

### IN-04: `BlockedAlertBand` chip buttons lack `aria-label`/`title` — screen-reader users miss action verb

**File:** `src/components/BlockedAlertBand.tsx:43-51`

**Issue:** Each chip is rendered as:

```tsx
<button
  key={order.id}
  onClick={() => startTransition(() => setQuery({ order: order.id }))}
  className="rounded px-2 py-1 text-xs text-[var(--error-dark)] hover:underline"
>
  BLOCKED: {order.orderNumber} ({order.millLine})
</button>
```

Screen readers announce the inner text "BLOCKED: ORD-001 (Premix), button" — operators with vision impairments hear no actionable verb (e.g. "Open order details for ORD-001"). The `BlockedAlertBand` is a critical-path UI for blocked orders; accessibility here matters.

**Fix:**

```tsx
<button
  key={order.id}
  type="button"
  onClick={() => startTransition(() => setQuery({ order: order.id }))}
  aria-label={`View blocked order ${order.orderNumber} on ${order.millLine}`}
  className="rounded px-2 py-1 text-xs text-[var(--error-dark)] hover:underline"
>
  BLOCKED: {order.orderNumber} ({order.millLine})
</button>
```

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
