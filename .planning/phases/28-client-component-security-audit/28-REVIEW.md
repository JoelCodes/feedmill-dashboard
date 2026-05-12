---
phase: 28-client-component-security-audit
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - docs/security-patterns.md
  - src/app/demo/customers/[id]/page.test.tsx
  - src/app/demo/customers/[id]/page.tsx
  - src/app/demo/customers/__tests__/page.test.tsx
  - src/app/demo/customers/page.test.tsx
  - src/app/demo/customers/page.tsx
  - src/app/demo/mill-production/__tests__/page.test.tsx
  - src/app/demo/mill-production/page.tsx
  - src/app/demo/orders/__tests__/page.test.tsx
  - src/app/demo/orders/page.tsx
  - src/components/CustomersList.tsx
  - src/components/MillProductionUI.tsx
  - src/components/OrdersTable.tsx
  - src/components/OrdersTableContent.tsx
  - src/components/__tests__/CustomersList.test.tsx
  - src/components/__tests__/MillProductionUI.test.tsx
  - src/test/fixtures/clerkAuth.test.ts
  - src/test/fixtures/clerkAuth.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 28 successfully refactored `/demo/orders`, `/demo/customers`, `/demo/customers/[id]`, and `/demo/mill-production` from client-fetch shape into async Server Components. The core security boundary is sound:

- `await requireRole('demo')` is the FIRST statement of every refactored page body and runs before any `await getX()` call. Verified for all four pages.
- No client component (`CustomersList`, `MillProductionUI`, `OrdersTableContent`, `OrdersTable`) imports any `@/services/*` module — confirmed via `grep -rn "from '@/services" src/components/CustomersList.tsx src/components/MillProductionUI.tsx src/components/OrdersTableContent.tsx src/components/OrdersTable.tsx` returning empty.
- Data crosses the server→client trust boundary only via component props, matching the documented pattern in `docs/security-patterns.md` §2.
- `OrdersTableContent` correctly preserves the `<Suspense>` boundary required by Next 16 for `useSearchParams`.

However, the review surfaced one CRITICAL defect: **two test files exist for the customer-list page**, both registered with Jest. Beyond that, several quality issues exist in the test fixture (mismatch with real Next.js sentinel behavior, missing `jsdom` shim coordination) and one inherited-bug acknowledgement that lives in a test comment rather than a tracked TODO.

## Critical Issues

### CR-01: Duplicate test files for `/demo/customers/page.tsx` will both run under Jest

**File:** `src/app/demo/customers/page.test.tsx` and `src/app/demo/customers/__tests__/page.test.tsx`
**Issue:** Two distinct test files target the same Server Component:
- `src/app/demo/customers/page.test.tsx` (183 lines) — imports `CustomersPage from './page'` and mocks `@/utils/customerSort` as a pass-through.
- `src/app/demo/customers/__tests__/page.test.tsx` (282 lines) — imports `CustomersPage from '../page'` and does NOT mock `@/utils/customerSort` (it lets the real sort run).

Both files were touched in commit `28a0805 test(28-04): migrate customer page tests to async RSC harness`. Jest's default `testMatch` discovers both, so:

1. Both suites run on every `npm test` invocation, doubling CI time for this page.
2. They drift independently — the mocked-sort version asserts `sortCustomersByRecentActivity` is called once, while the unmocked version's `mockCustomers` array is pre-sorted by id, so it tolerates the real sort run without failing today. A future change to the fixture or the sort algorithm will fail in one file and pass in the other, masking the regression.
3. The fixture data shapes differ (`page.test.tsx` has `contactName/contactPhone/contactEmail/deliveryPreferences`; `__tests__/page.test.tsx` omits them), so the two suites cover different `CustomerWithStats` shapes for what is supposed to be the same contract.
4. Both files mock the same global module paths (`@clerk/nextjs/server`, `next/navigation`, `@/services/customers`, `@/services/notifications`, `@clerk/nextjs`). Jest scopes mocks per-test-file so they don't collide at runtime, but maintainers will inevitably update one and forget the other.

This is a maintenance hazard masquerading as test coverage. Pick one canonical location and delete the other.

**Fix:** Delete the older / less-comprehensive file. The `__tests__/` co-located convention is used by `mill-production/__tests__/page.test.tsx` and `orders/__tests__/page.test.tsx`, so for consistency, keep `src/app/demo/customers/__tests__/page.test.tsx` and remove `src/app/demo/customers/page.test.tsx`. If the design-system token assertions in the older file are not duplicated in the newer one, migrate them first, then delete:

```bash
# Verify token-class coverage parity, then:
git rm src/app/demo/customers/page.test.tsx
```

If the intent was that ONE file targets the RSC contract (sort mocked) and the OTHER targets the rendered DOM (sort real), split the responsibilities clearly: rename one to `page.contract.test.tsx` or move DOM-token assertions into `src/components/__tests__/CustomersList.test.tsx` where they belong.

## Warnings

### WR-01: `nextNavigationMockFactory.notFound()` sentinel disagrees with real Next.js

**File:** `src/test/fixtures/clerkAuth.ts:81-83`
**Issue:** The fixture's `notFound()` throws `Object.assign(new Error('NEXT_NOT_FOUND'), {})`. The JSDoc at line 69-70 claims this mirrors "real Next.js runtime so callers do not continue past the redirect call."

Real Next.js `notFound()` (verified at `node_modules/next/dist/client/components/not-found.js:25-34`) throws an error whose **message is `NEXT_HTTP_ERROR_FALLBACK;404`** (the `DIGEST` constant) and which has a `digest` property set to the same string, plus a non-enumerable `__NEXT_ERROR_CODE = 'E394'`. There is NO Next.js code path that throws an error with message `'NEXT_NOT_FOUND'`.

Today this still works because production code (`requireRole`, `CustomerDetailPage`) treats the thrown error abstractly — nobody inspects the error message or digest. But:

1. The JSDoc lies: a future contributor reading the docstring will believe the fixture is wire-compatible with Next.js.
2. The companion fixture test `src/test/fixtures/clerkAuth.test.ts:71-91` and the consumer test `src/app/demo/customers/[id]/page.test.tsx:115` BOTH assert the made-up sentinel name, so the fixture and tests are mutually self-consistent and free to drift further from Next.

If any future code path (e.g., a custom error boundary that distinguishes a 404 throw from a generic throw via `error.digest?.startsWith(HTTP_ERROR_FALLBACK_ERROR_CODE)`) is added to production, the unit tests will silently mock the wrong shape.

**Fix:** Update the fixture to use Next.js's real digest constant, and update the JSDoc to match:

```typescript
// src/test/fixtures/clerkAuth.ts
const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

notFound: () => {
  const err = Object.assign(new Error(NOT_FOUND_DIGEST), {
    digest: NOT_FOUND_DIGEST,
  });
  throw err;
},
```

Then update the consumer test at `src/app/demo/customers/[id]/page.test.tsx:115` from `.rejects.toThrow('NEXT_NOT_FOUND')` to `.rejects.toMatchObject({ digest: expect.stringMatching(/;404$/) })` (or whatever shape matches real Next).

If you prefer to keep the made-up sentinel for simplicity, then at minimum update the JSDoc to drop the "mirroring real Next.js runtime" claim — say plainly "synthetic sentinel for unit-test convenience; production code never inspects the error."

### WR-02: `OrdersTableContent` URL→state sync is one-way; clearing `?selected=` does not clear the selection

**File:** `src/components/OrdersTableContent.tsx:29-35`
**Issue:** The effect:

```typescript
useEffect(() => {
  const urlSelected = searchParams.get("selected");
  if (urlSelected) {
    setSelectedOrderId(urlSelected);
  }
}, [searchParams]);
```

Only writes to state when the URL parameter is truthy. If a user starts with `?selected=ORD-001` and then the URL changes to `/demo/orders` (no query), `selectedOrderId` retains `'ORD-001'`. This is a latent inconsistency: the URL claims "no selection," but the table still highlights a row.

The fall-through "url is not in the filtered list → derive null from `validSelectedId`" logic in `OrdersTable.tsx:179` only fires if the order was filtered out. When the user explicitly clears the query param, `selectedOrderId` is non-null and `visibleIds.includes(selectedOrderId)` is still true, so the row stays highlighted.

This was an existing bug (not introduced by Phase 28), but the refactor moved the code without addressing it. Either accept it explicitly (with a comment explaining why one-way sync is intentional — e.g., "Timeline deep-links select a row; the user clearing the param via browser back button SHOULD retain selection") or fix it.

**Fix:** Make the sync two-way:

```typescript
useEffect(() => {
  const urlSelected = searchParams.get("selected");
  setSelectedOrderId(urlSelected); // null when param absent
}, [searchParams]);
```

This also lets you drop the lazy-init read at line 25 (initial state can be `null`; the effect fires on mount and seeds it). If the existing behavior IS the intent, add an inline comment naming the use case so the next reader doesn't "fix" it back into two-way sync.

### WR-03: `MillProductionUI` `ordersByMill` recomputes on every render (re-derives even when filter unchanged)

**File:** `src/components/MillProductionUI.tsx:215-219`
**Issue:** While `stateCounts` (line 200) and `filteredOrders` (line 210) are correctly wrapped in `useMemo`, the very next derivation that fans `filteredOrders` out across three mill columns is NOT memoized:

```typescript
const ordersByMill: Record<MillLine, ProductionOrder[]> = {
  Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
  Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
  CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
};
```

This runs three `.filter()` passes over the entire `filteredOrders` array on every render — including every keystroke if the filter pill state ever depends on something keystroke-bound (it currently doesn't, but the omission is a correctness-adjacent code smell: the surrounding code is consistently memoized except here). Each child `<MillColumn>` then receives a fresh array reference on every render, which defeats any future `React.memo` on that subtree.

Although marked "performance" (out-of-scope per `<review_scope>`), the bigger concern is **inconsistency**: a future maintainer copy-pasting from this file will likely follow the unmemoized example. The fix is a one-liner.

**Fix:**

```typescript
const ordersByMill = useMemo<Record<MillLine, ProductionOrder[]>>(
  () => ({
    Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
    Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
    CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
  }),
  [filteredOrders],
);
```

### WR-04: `customers/[id]/page.test.tsx` partial-failure test acknowledges an unresolved implementation bug in a comment

**File:** `src/app/demo/customers/[id]/page.test.tsx:162-203`
**Issue:** The `partial failure handling` test contains the following hand-rolled commentary:

```typescript
// IMPLEMENTATION BUG: FALLBACK_STATS is mentioned in plan but not implemented in page.tsx
// Current page.tsx does NOT define FALLBACK_STATS or handle missing stats
...
// ESCALATION NOTE: Implementation missing FALLBACK_STATS constant and graceful degradation logic
// Per plan 13-03-PLAN.md lines 123-131, page should define and use FALLBACK_STATS
// Current test manually provides fallback stats, but implementation should handle this
```

The test then works around the missing implementation by manually supplying a fallback-shaped stats object to the mock, so it passes — but it tests **the test's own workaround**, not the page's behavior. This is a false-positive test: it claims "fallback stats" coverage but exercises the no-fallback path with hand-built mock data. The escalation note has been carried across at least Phase 13 → Phase 28 without action.

In Phase 28 specifically, `src/app/demo/customers/[id]/page.tsx:29-31` has only `if (!customer) { notFound(); }` — there is no partial-stats degradation logic. A real "service returns customer without stats" scenario would crash at `customer.stats` access in `<CustomerDetailHeader>`.

**Fix:** Either (a) implement FALLBACK_STATS per plan 13-03 and rewrite the test to exercise it for real, or (b) remove the test entirely and file a tracked deferred-item with a phase tag (`.planning/phases/28-.../deferred-items.md` already exists in this phase directory). A self-acknowledged broken test is worse than no test — it inflates the green-count without proving anything:

```typescript
// Option (b): remove the test and add to deferred-items.md
// - "Implement FALLBACK_STATS for /demo/customers/[id] partial failure;
//    test exists at customers/[id]/page.test.tsx:162-203 but does not
//    exercise the production code path."
```

## Info

### IN-01: `EmptyState` is also announced by the screen-reader `aria-live` region — double announcement

**File:** `src/components/CustomersList.tsx:92-103`
**Issue:** The `aria-live` `polite` region at line 92 emits the text `'No customers found'` when the filtered list is empty, AND the visible `<EmptyState>` at line 102 renders a `<p>` whose text is also `'No customers found'`. Screen readers that read both the live region (on update) and the visible content (during page navigation) will announce the same string twice. The accompanying test at `src/components/__tests__/CustomersList.test.tsx:81` and `src/app/demo/customers/__tests__/page.test.tsx:262-263` explicitly acknowledge "Two 'No customers found' elements" / "Multiple elements" — the duplication is known but not deduplicated.

**Fix:** Either give the `aria-live` announcement a different phrasing (e.g., `'Search returned no results'`) so the screen reader hears two distinct phrases for the two distinct UI concerns, or mark the visible `<EmptyState>` `aria-hidden="true"` so only the live region is announced.

### IN-02: `OrdersTable.tsx:209` injects `validSelectedId` into a CSS selector

**File:** `src/components/OrdersTable.tsx:209`
**Issue:**

```typescript
const selectedRow = tableRef.current.querySelector(`[data-order-id="${validSelectedId}"]`);
```

`validSelectedId` is derived from `selectedOrderId` (which can originate from the `?selected=` URL parameter via `OrdersTableContent`) and is gated by `visibleIds.includes(selectedOrderId)`, so today no string with CSS-meta-characters can reach this line — `Order.id` is an internal identifier shape like `ORD-001`. But the gate is value-equality only; if `Order.id` ever widens to allow user-influenced strings (free-text customer-supplied IDs, imported IDs, etc.), an attacker could craft a `?selected="]/script>` payload that makes it past `.includes()` and into `querySelector`. The current scope makes this theoretical, not exploitable.

**Fix:** Switch to `CSS.escape()`:

```typescript
const selectedRow = tableRef.current.querySelector(
  `[data-order-id="${CSS.escape(validSelectedId)}"]`,
);
```

Two-line change; eliminates the theoretical injection and the future-proofing concern.

### IN-03: Fixture documentation claims `useSearchParams` mock returns "safe defaults," but the default is `null`

**File:** `src/test/fixtures/clerkAuth.ts:93-95`
**Issue:** `useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) }))` — the mock's `.get()` returns `null` for any key. `OrdersTableContent` calls `searchParams.get("selected")` and tolerates null, but the docstring at line 73-74 describes this as "safe defaults so consumer tests that render client children... don't trip on undefined navigation hooks." For consumers that branch on `searchParams.get(...)` being a non-null string (e.g., the URL-deep-link test scenario at `orders/__tests__/page.test.tsx`), the fixture forces them through the null branch silently, with no per-test way to override (every test gets the same null).

The fixture works for the current tests, but a "user lands on /demo/orders?selected=ORD-001" test cannot be expressed using this fixture. Document this limitation, or expose an `override` helper:

```typescript
export function mockSearchParam(key: string, value: string | null): void {
  // Push into a closed-over map that the factory's get() reads.
}
```

**Fix:** Either add such a helper and use it from `orders/__tests__/page.test.tsx` for deep-link coverage, or update the JSDoc to admit the fixture only supports the "no query params" case.

### IN-04: Comment in `OrdersTableContent.tsx:32` cites a non-existent ESLint rule

**File:** `src/components/OrdersTableContent.tsx:32`
**Issue:** `// eslint-disable-next-line react-hooks/set-state-in-effect -- ...` — `react-hooks/set-state-in-effect` is not a published rule in `eslint-plugin-react-hooks` (the published rules are `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`). Either the project ships a custom rule under that name, or the disable directive is silently a no-op.

**Fix:** Verify whether a custom rule of that name exists in this project's ESLint config (`eslint.config.*`). If not, the comment-directive is dead and should be removed (or replaced with the actual lint rule, if one was intended). If the rule exists in a private plugin, this is fine and the comment can stay.

### IN-05: `customers/page.test.tsx` (the to-be-removed duplicate) mocks `@/utils/customerSort` as identity but the `__tests__/page.test.tsx` does not

**File:** `src/app/demo/customers/page.test.tsx:42-44` vs `src/app/demo/customers/__tests__/page.test.tsx`
**Issue:** Related to CR-01: the older test file mocks `sortCustomersByRecentActivity` as an identity function and then asserts it is called exactly once (line 159-164) — i.e., it tests that the RSC INVOKES the sort, not that the sort produces a correct result. The newer `__tests__/page.test.tsx` lets the real sort run and asserts the rendered DOM contains the customer names. Neither is wrong on its own; the issue is that the two suites collectively make NO assertion about the sort RESULT (the older mocks it away, the newer happens to pass with a pre-sorted fixture). If you keep only one file (per CR-01 fix), make sure the surviving suite asserts BOTH (a) the sort is called and (b) the rendered order matches the post-sort expectation.

**Fix:** When resolving CR-01, the surviving customer-list page test should have both:

```typescript
it('calls sortCustomersByRecentActivity once', async () => { /* ... */ });
it('renders customers in post-sort order', async () => {
  // Use a fixture whose pre-sort order differs from its post-sort order,
  // then assert DOM order matches post-sort.
});
```

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
