---
phase: 28-client-component-security-audit
reviewed: 2026-05-11T00:00:00Z
depth: deep
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
  critical: 2
  warning: 6
  info: 6
  total: 14
status: issues_found
---

# Phase 28: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** deep (cross-file analysis: import graph + call chains + trust-boundary trace + fixture/consumer drift)
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Deep-depth re-review of Phase 28. The previous standard-depth review (10 issues, 1 critical) is overwritten here.

**Trust-boundary verdict — sound.** The core security claim of Phase 28 holds: `await requireRole('demo')` is the FIRST awaited statement of the function body in all four refactored pages (`orders/page.tsx:8`, `customers/page.tsx:13`, `customers/[id]/page.tsx:16`, `mill-production/page.tsx:7`), running before any `await getX(...)`. No reviewed client component (`CustomersList`, `MillProductionUI`, `OrdersTableContent`, `OrdersTable`) imports any `@/services/*` module — verified by `grep -rn "from '@/services" src/components/{CustomersList,MillProductionUI,OrdersTableContent,OrdersTable}.tsx` returning empty (matches found are JSDoc/comment strings only). The Phase 28 trust boundary is the prop edge from RSC parent to client child, and no service module crosses it. `<Protect>` has no live usage, in line with D-10.

**Authorization-test coverage gap (CR-02 below).** No page test asserts that the data-fetch service is NOT invoked when `requireRole` redirects. The current redirect-branch tests only check `.rejects.toMatchObject({ url: '/sign-in' })` — they do not call `expect(getOrders).not.toHaveBeenCalled()` (likewise for the other three services). A regression that reorders `await getOrders()` before `await requireRole('demo')` would pass every existing test. This is a Critical-tier defense-in-depth gap given the audit's own thesis (D-04: "every page must guard before fetch").

**Inherited blockers.** CR-01 (duplicate customer-list test files) and WR-04 (self-acknowledged broken FALLBACK_STATS test) carry over from the prior standard-depth review. Both were touched by Phase 28 commits but not fixed; both remain shippable hazards.

**Deep-depth additions (beyond the standard review):**
- CR-02 — Authorization test gap: no test proves fetch-after-guard ordering.
- WR-05 — Fixture's `useSearchParams` returns a fresh object on every call, causing the `OrdersTableContent` effect to re-run every render in tests. Benign today (the inner `get` returns null), but armed: any future test that sets `get` to return a truthy value will hit an infinite `setState` loop.
- WR-06 — `customer.stats` access without null-guard on `customers/[id]/page.tsx:35` violates the cross-file contract with `CustomerDetailHeader`, whose prop type is the non-optional `CustomerStats`. The service is typed `Promise<CustomerWithStats | null>` so today this is enforced at the type level; but the page test's "partial failure" scenario explicitly contemplates a customer without stats — and the type system does not.
- IN-06 — The published `docs/security-patterns.md` §3 documents `<Show when=...>` as a Clerk control component. The Clerk Next.js public API does not export a `<Show>` component (only `<Protect>` and `<SignedIn>/<SignedOut>`); the source citation (`clerk-docs/reference/components/control/show.mdx`) is to a Clerk *docs* page, not a Clerk *library export*. Either rephrase or drop.

The full inventory of findings is below — 2 Critical, 6 Warning, 6 Info.

## Critical Issues

### CR-01: Duplicate test files for `/demo/customers/page.tsx` both run under Jest

**File:** `src/app/demo/customers/page.test.tsx` AND `src/app/demo/customers/__tests__/page.test.tsx`
**Issue:** Two distinct test files target the same Server Component. Both target `page.tsx` (one via `./page`, the other via `../page`), both mock the same modules, and both run under Jest's default `testMatch` (verified via `jest.config.ts` — no `testPathIgnorePatterns` excludes either path; only `next/jest` defaults apply).

Cross-file drift today:

| Aspect | `customers/page.test.tsx` (183 lines) | `customers/__tests__/page.test.tsx` (282 lines) |
|---|---|---|
| Mocks `@/utils/customerSort` | Yes — identity pass-through | No — real sort runs |
| Asserts `sortCustomersByRecentActivity` called | Yes (line 159-164) | No |
| Asserts rendered customer order | No | No (fixture is incidentally pre-sorted) |
| Fixture `CustomerWithStats` fields | id, name, location, createdAt, updatedAt, stats | id, name, location, **contactName, contactPhone, contactEmail, deliveryPreferences**, createdAt, updatedAt, stats |
| Design-token assertions | No | Yes (8 hardcoded-color forbids + 4 token-presence requires) |
| `binAlertLevel` value for Greenfield Farms | `'none'` | `'none'` |

The two suites collectively make NO assertion about the post-sort rendered order. They will drift further every time one is updated and the other is forgotten. The git history confirms both files were created by `e0d9b20` (Phase 26) and that Phase 28 touched BOTH (213 lines / 192 lines of diff respectively) without removing the duplication — meaning every Phase 28 plan that touched these files had to write the same change twice.

**Fix:** Pick one canonical location and delete the other. The `__tests__/` co-located convention is used by `mill-production/__tests__/page.test.tsx` and `orders/__tests__/page.test.tsx`, so for codebase consistency keep `src/app/demo/customers/__tests__/page.test.tsx` and remove `src/app/demo/customers/page.test.tsx`. Before deletion, migrate the two assertions that exist only in the to-be-removed file:

1. `expect(sortCustomersByRecentActivity).toHaveBeenCalledTimes(1)` and `expect(...).toHaveBeenCalledWith(mockCustomers)` (currently `page.test.tsx:159-164`) — these are valuable contract assertions and should land in the surviving file. Add the same `jest.mock('@/utils/customerSort', () => ({ sortCustomersByRecentActivity: jest.fn((c) => c) }))` setup.
2. Optionally, the "renders the visible status indicators handed off to CustomersList" data-flow assertion at `page.test.tsx:166-182` — this is a legitimate cross-component integration check.

Then:

```bash
git rm src/app/demo/customers/page.test.tsx
```

### CR-02: No authorization-test coverage proves data-fetch services are NOT called when `requireRole` redirects

**File:** `src/app/demo/orders/__tests__/page.test.tsx:99-115`, `src/app/demo/customers/__tests__/page.test.tsx:96-114`, `src/app/demo/customers/page.test.tsx:112-128`, `src/app/demo/mill-production/__tests__/page.test.tsx:80-96`, `src/app/demo/customers/[id]/page.test.tsx:138-160`
**Issue:** All five page test files include redirect-branch tests of the shape:

```typescript
it('redirects to /sign-in when unauthenticated', async () => {
  mockUnauthenticatedSession();
  await expect(OrdersPage()).rejects.toMatchObject({ url: '/sign-in' });
});
```

This proves `requireRole` throws the right sentinel — but it does NOT prove the page stopped before calling `getOrders()`. The entire raison d'être of Phase 28's D-04 ("middleware + page-level inner guard before data fetch") is that an authorization failure must prevent data acquisition. Today the production code happens to do this (because `redirect` throws and aborts the function), but the test suite does NOT lock the invariant in place. A reorder like:

```typescript
// Future regression:
export default async function OrdersPage() {
  const orders = await getOrders(); // <-- moved above the guard
  await requireRole('demo');
  // ...
}
```

would pass every existing test in this codebase, because:
- `getOrders` is mocked to return `mockOrders` synchronously, so it doesn't throw.
- `requireRole` still throws when the session is wrong, so `.rejects.toMatchObject({ url: '/sign-in' })` still matches.
- No test asserts `expect(getOrders).not.toHaveBeenCalled()` in the unauthenticated/wrong-role branches.

This is exactly the regression the audit was designed to catch. The threat model in `28-CONTEXT.md` and the §2 pattern in `docs/security-patterns.md` both name "fetch before guard" as the top defect; the test harness does not assert against it.

**Fix:** In every page test file, extend each of the three redirect-branch tests with a "service not called" assertion:

```typescript
// src/app/demo/orders/__tests__/page.test.tsx
it("redirects to /sign-in when unauthenticated", async () => {
  mockUnauthenticatedSession();

  await expect(OrdersPage()).rejects.toMatchObject({ url: "/sign-in" });
  expect(getOrders).not.toHaveBeenCalled(); // <-- add this
});

it("redirects to / when role is user (non-demo)", async () => {
  mockNonDemoSession("user");

  await expect(OrdersPage()).rejects.toMatchObject({ url: "/" });
  expect(getOrders).not.toHaveBeenCalled(); // <-- add this
});

it("redirects to / when role is admin (any non-demo role)", async () => {
  mockNonDemoSession("admin");

  await expect(OrdersPage()).rejects.toMatchObject({ url: "/" });
  expect(getOrders).not.toHaveBeenCalled(); // <-- add this
});
```

For `customers/[id]/page.test.tsx`, the equivalent set is `getCustomerById`, `getActivityEvents`, `getBinsByCustomerId`, `getOrdersByCustomerId` — assert all four are `not.toHaveBeenCalled()` in each of the redirect tests. The `Promise.all([...])` shape means a regression that moves the fetches above the guard would invoke all four; the assertion catches every reorder.

Without this, the D-04 invariant is asserted by JSDoc only, not by the test suite.

## Warnings

### WR-01: `nextNavigationMockFactory.notFound()` uses a fabricated sentinel that does not match real Next.js

**File:** `src/test/fixtures/clerkAuth.ts:81-83`, with consumer drift at `src/app/demo/customers/[id]/page.test.tsx:115`
**Issue:** The fixture's `notFound()` throws `Object.assign(new Error('NEXT_NOT_FOUND'), {})`. The fixture's JSDoc at line 69-70 claims this "mirrors real Next.js runtime so callers do not continue past the redirect call."

Real Next.js `notFound()` throws an error whose **message is the digest `'NEXT_HTTP_ERROR_FALLBACK;404'`** with a `digest` property of the same value (verifiable in `node_modules/next/dist/client/components/not-found.js` for the installed Next 16). There is no public Next.js code path that throws an error with message `'NEXT_NOT_FOUND'`. The string `'NEXT_NOT_FOUND'` was invented by this fixture.

The companion fixture test `src/test/fixtures/clerkAuth.test.ts` does NOT test the `notFound` mock at all (it tests `redirect` at lines 71-91 but skips `notFound`), so the fixture and the one consumer (`customers/[id]/page.test.tsx:115`) are mutually self-consistent and free to drift further from Next. The CONSUMER assertion `await expect(...).rejects.toThrow('NEXT_NOT_FOUND')` is what locks the wrong shape in place.

The risk is contained today because production code (`requireRole`, `CustomerDetailPage`) treats the thrown error abstractly — nobody inspects the message or digest. But the JSDoc's "mirroring real Next.js" claim is false, and a future error-boundary that distinguishes 404 throws via `error.digest?.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')` would be tested against the wrong shape.

**Fix:** Update the fixture to match Next.js's real digest, and add a contract test:

```typescript
// src/test/fixtures/clerkAuth.ts
const NOT_FOUND_DIGEST = 'NEXT_HTTP_ERROR_FALLBACK;404';

notFound: () => {
  throw Object.assign(new Error(NOT_FOUND_DIGEST), {
    digest: NOT_FOUND_DIGEST,
  });
},
```

Update the consumer:

```typescript
// src/app/demo/customers/[id]/page.test.tsx:113-115
await expect(
  CustomerDetailPage({ params: Promise.resolve({ id: 'INVALID-999' }) }),
).rejects.toMatchObject({ digest: expect.stringContaining(';404') });
```

Add to the fixture contract test:

```typescript
// src/test/fixtures/clerkAuth.test.ts
it('notFound mock throws an error whose digest matches real Next.js (;404 suffix)', () => {
  let caught: unknown;
  try { notFound(); } catch (err) { caught = err; }
  expect(caught).toMatchObject({ digest: expect.stringContaining(';404') });
});
```

If keeping the fabricated sentinel is preferred for simplicity, then minimum fix is to delete the "mirroring real Next.js" claim from the fixture's JSDoc and substitute "synthetic sentinel for unit-test convenience; production code never inspects the error" — at least the lie stops.

### WR-02: `OrdersTableContent` URL→state sync is one-way; clearing `?selected=` does not clear the selection

**File:** `src/components/OrdersTableContent.tsx:29-35`
**Issue:** The effect only writes to state when the URL parameter is truthy:

```typescript
useEffect(() => {
  const urlSelected = searchParams.get("selected");
  if (urlSelected) {
    setSelectedOrderId(urlSelected);
  }
}, [searchParams]);
```

If a user starts at `/demo/orders?selected=ORD-001` and then the URL changes to `/demo/orders` (no query), `selectedOrderId` retains `'ORD-001'`. The URL claims "no selection," but `OrdersTable.tsx:179`'s `validSelectedId` check (which only invalidates when the order is filtered OUT) keeps the row highlighted.

This was a latent inconsistency before Phase 28; the refactor moved the code without addressing it. The cross-file note: `OrdersTable.tsx:209` then uses `validSelectedId` to drive a `scrollIntoView`, so the page also scrolls a stale row into view on URL clear.

**Fix:** Make the sync two-way:

```typescript
useEffect(() => {
  const urlSelected = searchParams.get("selected");
  setSelectedOrderId(urlSelected); // null when param absent
}, [searchParams]);
```

This also lets you simplify line 25-26 to a plain `useState<string | null>(null)` — the effect fires on mount and seeds it. If the existing behavior IS the intent (e.g., "browser-back keeps the user's last visited row"), add an inline comment naming the use case so the next reader doesn't "fix" it back into two-way sync.

### WR-03: `MillProductionUI`'s `ordersByMill` is the only derivation in the file that escapes `useMemo`

**File:** `src/components/MillProductionUI.tsx:215-219`
**Issue:** `stateCounts` (line 200) and `filteredOrders` (line 210) are correctly wrapped in `useMemo`, but the very next derivation that fans `filteredOrders` out across three mill columns is NOT memoized:

```typescript
const ordersByMill: Record<MillLine, ProductionOrder[]> = {
  Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
  Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
  CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
};
```

Beyond the perf concern (out of v1 scope), this is a correctness-adjacent inconsistency: each `<MillColumn>` child receives a fresh array reference on every render, defeating any future `React.memo`. The bigger risk is the precedent — a future maintainer reading the file will likely copy the unmemoized example. The fix is a one-liner that aligns the file with its own surrounding style:

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

### WR-04: `customers/[id]/page.test.tsx` "partial failure handling" test acknowledges an unfixed implementation bug in inline comments

**File:** `src/app/demo/customers/[id]/page.test.tsx:162-203`
**Issue:** The test contains:

```typescript
// IMPLEMENTATION BUG: FALLBACK_STATS is mentioned in plan but not implemented in page.tsx
// Current page.tsx does NOT define FALLBACK_STATS or handle missing stats
// ...
// ESCALATION NOTE: Implementation missing FALLBACK_STATS constant and graceful degradation logic
// Per plan 13-03-PLAN.md lines 123-131, page should define and use FALLBACK_STATS
// Current test manually provides fallback stats, but implementation should handle this
```

The test works around the missing implementation by manually supplying a fallback-shaped stats object to the mock (line 178-181), so it passes — but it tests **the test's own workaround**, not the page's behavior. A real "service returns customer without stats" scenario would crash at `customer.stats` access in `<CustomerDetailHeader>` (verified: `customers/[id]/page.tsx:35` reads `customer.stats` with no null-guard, and `CustomerDetailHeader.tsx:8` types `stats` as the non-optional `CustomerStats`).

The escalation note has now been carried Phase 13 → Phase 28 without action.

**Fix:** Either:

(a) Implement FALLBACK_STATS per plan 13-03 and rewrite the test to exercise it for real:

```typescript
// customers/[id]/page.tsx
const FALLBACK_STATS: CustomerStats = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  hasChanges: false,
  binAlertLevel: 'none',
  activeBins: 0,
};
// ...
<CustomerDetailHeader customer={customer} stats={customer.stats ?? FALLBACK_STATS} bins={bins} />
```

(b) Remove the test and file a tracked entry in `.planning/phases/28-client-component-security-audit/deferred-items.md`:

```markdown
## 3. FALLBACK_STATS deferred from Phase 13

- **Discovered:** carried via comments in `customers/[id]/page.test.tsx:162-203`.
- **Status:** test asserts a workaround, not the production code path. Either
  implement FALLBACK_STATS per plan 13-03 or accept that the type system
  (`CustomerWithStats.stats` is non-optional) is the only guard.
- **Why deferred:** out-of-scope for Phase 28 (audit-only).
```

A self-acknowledged broken test is worse than no test — it inflates the green-count without proving anything.

### WR-05: Fixture's `useSearchParams` returns a fresh object on every call, defeating the `OrdersTableContent` effect's reference-equality dep check

**File:** `src/test/fixtures/clerkAuth.ts:93-95`, consumer at `src/components/OrdersTableContent.tsx:29-35`
**Issue:** The fixture defines:

```typescript
useSearchParams: jest.fn(() => ({
  get: jest.fn(() => null),
})),
```

Because `jest.fn(() => ({ ... }))` returns a NEW object on every invocation, calling `useSearchParams()` from the component yields a fresh `{ get: ... }` reference each render. The component's effect at `OrdersTableContent.tsx:35` depends on `[searchParams]` — so the effect re-runs every render.

Today this is benign: the inner `get` returns `null`, the `if (urlSelected)` guard skips `setSelectedOrderId`, no state change, no re-render loop. But it is armed:

1. Any test that wants to exercise the deep-link path (e.g., "user lands on `/demo/orders?selected=ORD-001`") will have to override `get` to return a truthy string. The moment that happens, the effect runs every render → `setSelectedOrderId(urlSelected)` → re-render → new `searchParams` reference → effect re-runs forever. React's bailout (same value to `useState`'s setter) saves the test from infinite recursion, but only after the first cycle — and the dependency is fragile.
2. The fixture's `useRouter` has the same shape (`jest.fn(() => ({ push: jest.fn(), ... }))`), with the same pitfall for any consumer that adds `router` to a `useEffect` dep array.

The deeper issue: a Next.js navigation hook in real runtime returns a STABLE reference per navigation, not per render. The fixture mis-models this.

**Fix:** Memoize the returned objects at factory-construction time so each call to `useSearchParams()` returns the SAME reference until something explicit changes it:

```typescript
export function nextNavigationMockFactory() {
  const searchParamsObj = {
    get: jest.fn(() => null),
  };
  const routerObj = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };
  return {
    redirect: (url: string) => {
      throw Object.assign(new Error('NEXT_REDIRECT'), { url });
    },
    notFound: () => {
      throw Object.assign(new Error('NEXT_NOT_FOUND'), {});
    },
    usePathname: jest.fn(() => '/'),
    useRouter: jest.fn(() => routerObj),
    useSearchParams: jest.fn(() => searchParamsObj),
  };
}
```

This also lets a test override behavior in a stable way: `searchParamsObj.get.mockReturnValueOnce('ORD-001')` would work, whereas today the `get` is recreated every render and any per-call override is lost.

### WR-06: `customers/[id]/page.tsx` reads `customer.stats` without confirming the `Promise.all`-resolved customer has stats

**File:** `src/app/demo/customers/[id]/page.tsx:35`
**Issue:** Line 35:

```typescript
<CustomerDetailHeader customer={customer} stats={customer.stats} bins={bins} />
```

The cross-file contract:

- `getCustomerById(id): Promise<CustomerWithStats | null>` (verified at `src/types/customer.ts:26-28`)
- `CustomerDetailHeader.tsx:6-10` requires `stats: CustomerStats` (non-optional)

So at the type level the access is safe — `CustomerWithStats.stats` is non-optional, and after the `if (!customer) { notFound(); }` guard at line 29-31, `customer` is non-null `CustomerWithStats`. But:

1. `WR-04` exists precisely because the test file contemplates a "customer returned but stats missing" scenario — meaning the team has explicitly imagined a runtime where `customer.stats` could be `undefined`. The type system would NOT catch this if `getCustomerById` ever started returning a partial customer.
2. The data flow is: mock service → server resolves → `customer` typed `CustomerWithStats` → prop hand-off → client child reads `customer.stats`. If the service contract drifts (e.g., a future API where stats is fetched separately and may fail), nothing in this page validates the shape before crossing the prop boundary.

Defensive degradation is what `WR-04`'s referenced FALLBACK_STATS pattern is for; the alternative is to refuse to ship the page (treat missing stats like missing customer):

**Fix (recommended, no plan-13 dependency):**

```typescript
if (!customer || !customer.stats) {
  notFound();
}
```

This narrows `customer.stats` to non-undefined for the prop pass. If the team prefers graceful degradation per plan 13-03, implement FALLBACK_STATS per WR-04 option (a). Either way, do not rely on the type system alone to enforce the contract.

## Info

### IN-01: `EmptyState` is also announced by the screen-reader `aria-live` region — double announcement

**File:** `src/components/CustomersList.tsx:92-103`
**Issue:** The `aria-live="polite"` region at line 92 emits the text `'No customers found'` when the filtered list is empty, AND the visible `<EmptyState>` at line 102 renders a `<p>` whose text is also `'No customers found'`. Screen readers that read both the live region (on update) and the visible content (during page navigation) will announce the same string twice. The accompanying test at `src/components/__tests__/CustomersList.test.tsx:81` and `src/app/demo/customers/__tests__/page.test.tsx:262-263` explicitly acknowledge "Two 'No customers found' elements" — the duplication is known.

**Fix:** Either:

(a) Give the `aria-live` announcement a different phrasing so SR users hear two distinct phrases for the two distinct UI concerns:

```typescript
<div aria-live="polite" className="sr-only">
  {filteredCustomers.length === 0
    ? 'Search returned no results'  // distinct from "No customers found"
    : `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''} found`}
</div>
```

(b) Mark the visible `<EmptyState>` as `aria-hidden="true"`:

```typescript
<div aria-hidden="true">
  <EmptyState />
</div>
```

### IN-02: `OrdersTable.tsx:209` injects `validSelectedId` into a CSS selector without `CSS.escape`

**File:** `src/components/OrdersTable.tsx:209`
**Issue:**

```typescript
const selectedRow = tableRef.current.querySelector(`[data-order-id="${validSelectedId}"]`);
```

`validSelectedId` is derived from `selectedOrderId` (which originates from the `?selected=` URL parameter via `OrdersTableContent.tsx:25` and `:33`) and is gated by `visibleIds.includes(selectedOrderId)`. Today, `Order.id` is an internal shape like `ORD-001`, so no string with CSS-meta-characters can reach this line — the gate's value-equality compare lets only well-formed IDs through. But the gate is value-equality only; if `Order.id` ever widens to allow user-influenced strings (free-text customer-supplied IDs, imported IDs), an attacker could craft a `?selected="]/...payload` that survives `.includes()` and lands in `querySelector`. The current scope makes this theoretical, not exploitable.

**Fix:** Two-line change that eliminates the theoretical injection and future-proofs the call site:

```typescript
const selectedRow = tableRef.current.querySelector(
  `[data-order-id="${CSS.escape(validSelectedId)}"]`,
);
```

### IN-03: Fixture's `useSearchParams` mock has no per-test override mechanism (documents "safe defaults" but the default is hard-coded to null)

**File:** `src/test/fixtures/clerkAuth.ts:93-95`, JSDoc at lines 71-74
**Issue:** `useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) }))` returns `null` for every key. The JSDoc claims this gives "safe defaults so consumer tests that render client children… don't trip on undefined navigation hooks." That goal is met for the no-query case, but it's a unidirectional fixture: no consumer can express "user lands on `/demo/orders?selected=ORD-001`" using this fixture, because every render of the consumer will see `get('selected') === null`.

This is the same root cause as `WR-05` but framed as documentation/API surface rather than reference-instability.

**Fix:** Combine with WR-05's fix (hoist the `searchParamsObj` outside the factory closure) AND expose a typed helper:

```typescript
// in clerkAuth.ts, after nextNavigationMockFactory
const _mockSearchParamsState = new Map<string, string | null>();

export function setMockSearchParam(key: string, value: string | null): void {
  _mockSearchParamsState.set(key, value);
}

export function resetMockSearchParams(): void {
  _mockSearchParamsState.clear();
}

// inside the factory, replace useSearchParams:
useSearchParams: jest.fn(() => ({
  get: (key: string) => _mockSearchParamsState.get(key) ?? null,
})),
```

Then `customers/[id]/page.test.tsx` can do `setMockSearchParam('selected', 'ORD-001')` to exercise the deep-link path. The current fixture has no equivalent.

### IN-04: Comment in `OrdersTableContent.tsx:32` cites an ESLint rule that does not appear to exist in published `eslint-plugin-react-hooks`

**File:** `src/components/OrdersTableContent.tsx:32`
**Issue:** `// eslint-disable-next-line react-hooks/set-state-in-effect -- ...` — `react-hooks/set-state-in-effect` is not a rule published by `eslint-plugin-react-hooks` (the published rules at the time of writing are `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`). Either the project ships a custom rule under that name (none was found via `grep -rn "set-state-in-effect" eslint.config*`), or the disable directive is a silent no-op.

**Fix:** Verify whether a custom rule of that name exists in the project's ESLint config. If not, the directive is dead and should be removed (or replaced with the actual intended rule). If the rule exists in a private plugin, this is fine — but document it inline so future reviewers don't repeat the investigation:

```typescript
// eslint-disable-next-line react-hooks/set-state-in-effect -- rule lives in eslint-plugin-cgm-internal; Syncing URL param to state on navigation
```

### IN-05: `customers/page.test.tsx` (the to-be-removed duplicate) mocks `@/utils/customerSort` as identity but the surviving file does not

**File:** `src/app/demo/customers/page.test.tsx:42-44` vs `src/app/demo/customers/__tests__/page.test.tsx`
**Issue:** Related to CR-01 — the older test file mocks `sortCustomersByRecentActivity` as an identity function and then asserts the sort was called (line 159-164). The newer `__tests__/page.test.tsx` lets the real sort run and asserts the rendered DOM contains customer names. Neither file asserts the rendered ORDER. The two suites collectively make NO assertion about the sort RESULT — the older mocks it away, the newer happens to pass with a pre-sorted fixture.

**Fix:** When resolving CR-01, the surviving file should have both:

```typescript
it('calls sortCustomersByRecentActivity once with the fetched customers', async () => {
  await CustomersPage();
  expect(sortCustomersByRecentActivity).toHaveBeenCalledTimes(1);
  expect(sortCustomersByRecentActivity).toHaveBeenCalledWith(mockCustomers);
});

it('renders customers in post-sort order', async () => {
  // Use a fixture whose pre-sort order DIFFERS from its post-sort order
  // (e.g., reverse-chronological by updatedAt), then assert DOM order.
  const element = await CustomersPage();
  render(element);
  const rows = screen.getAllByRole('button');
  expect(rows.map(r => r.textContent)).toEqual([
    'Most Recent Co', 'Middle Co', 'Oldest Co',
  ]);
});
```

### IN-06: `docs/security-patterns.md` §4 references a `<Show when=...>` Clerk component that is not a published Clerk Next.js library export

**File:** `docs/security-patterns.md:82, 88, 112-114`
**Issue:** §3's helper table at line 82 lists `<Protect role="...">` / `<Show when=...>` as the client-tier helpers. §4 then quotes from `clerk-docs/reference/components/control/show.mdx` describing the same component. The Clerk Next.js public API (`@clerk/nextjs`) does not export a `<Show>` component — the available control components are `<Protect>`, `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, etc. The source citation is to a Clerk *documentation* repository file, not to a Clerk *library* file.

Today this is purely documentation drift (Phase 28 D-10 says `<Protect>` has no live usage, and the same is true a fortiori for `<Show>`). But the doc claims §3 is the "authoritative API reference" for client-side gating, and a future contributor reading it will look for an import that does not exist.

**Fix:** Either:

(a) Drop the `<Show>` references entirely — they confuse the rule and add nothing. The §4 caveat already covers `<Protect>`, which is the only relevant client helper.

(b) If the Clerk Next.js SDK has added a `<Show>` since the audit, add the import path inline:

```markdown
| `<Protect role="...">` / `<Show when=...>` (from `@clerk/nextjs`) | Client | Hides DOM only | UX only…
```

…and verify `import { Show } from '@clerk/nextjs'` actually resolves before merging.

(c) If the rule is forward-looking ("when Clerk ships <Show>, treat it like <Protect>"), mark it explicitly as such:

```markdown
| `<Protect role="...">` (and forward-compat: `<Show when=...>` when Clerk ships it) | …
```

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
