# Security Patterns — Client/Server Boundary for Role-Gated Pages

This doc is the canonical client-vs-server security reference for the codebase. It pairs with `docs/clerk-setup.md` (which configures the JWT template and test users) and codifies the patterns established in Phase 28: every `/demo/*` page is an async Server Component that calls `await requireRole('demo')` before any data fetch, then hands data to client children via props. The audit findings table at §1 is the point-in-time inventory of every page's before/after status at the close of Phase 28; the five sections that follow are the forward-looking rules that future role-gated work should inherit without renegotiation. The `<Protect>` component is **never** a security boundary — see §4.

## 1. Audit findings

Findings as of phase 28 completion (2026-05-11).

| Path | Component type before | Component type after | Data fetch site before | Data fetch site after | Role guard | Notes |
|------|----------------------|----------------------|------------------------|-----------------------|------------|-------|
| `/demo/orders` | Client (`'use client'`) | RSC (async) | `OrdersTable` `useEffect` → `getOrders()` | `page.tsx` `await getOrders()` | `await requireRole('demo')` added | New `OrdersTableContent.tsx` client wrapper owns `?selected=` URL-param state; `<Suspense>` preserved for the `useSearchParams` boundary (Next 16 requirement). `OrdersTable.tsx` no longer imports `@/services/orders`. |
| `/demo/customers` | Client (`'use client'`) | RSC (async) | `page.tsx` `useEffect` → `getCustomers()` | `page.tsx` `await getCustomers()` (sorted server-side via `sortCustomersByRecentActivity`) | `await requireRole('demo')` added | New `CustomersList.tsx` client wrapper holds search/debounce + click-to-route; `CustomerTableSkeleton` and error-state JSX dropped — both unreachable once data is pre-resolved server-side. |
| `/demo/customers/[id]` | RSC (async) | RSC (async) | `page.tsx` `Promise.all([getCustomerById, getActivityEvents, getBinsByCustomerId, getOrdersByCustomerId])` | `page.tsx` `Promise.all([...])` (unchanged) | `await requireRole('demo')` added | Only the role guard is new; the parallel-fetch shape is the canonical multi-source RSC pattern (see §2). `notFound()` branch unchanged. |
| `/demo/mill-production` | Client (`'use client'`) | RSC (async) | `page.tsx` `useEffect` → `getProductionOrders()` | `page.tsx` `await getProductionOrders()` | `await requireRole('demo')` added | New `MillProductionUI.tsx` client wrapper owns filter-pill state + per-mill columns; `STATE_ORDER`/`STATE_COLORS`/`PRODUCTION_STATE_PILL_CONFIG`/`ProductionCard`/`StateSection`/`MillColumn` lifted verbatim into the wrapper; `LoadingSkeleton` dropped. |
| `/settings` | Client (`'use client'`) — **unchanged** | Client (`'use client'`) — **unchanged** | `useLocalStorage('user-preferences', defaultPreferences)` (browser-state) | `useLocalStorage(...)` (unchanged) | **None** by design (D-06) | Browser-local preferences only; not data fetching (D-08). See §5 for the rule and the worked example. |
| `/sign-in/*` | Client (Clerk-hosted) | Client (Clerk-hosted) — **unchanged** | n/a | n/a | n/a (public route) | No change. Clerk owns the auth UI; nothing to refactor. |
| Header notifications (footnote) | Client | Client — **unchanged** | `useEffect` → `getNotifications()` (in `src/components/Header.tsx`) | `useEffect` → `getNotifications()` (unchanged) | n/a | **Out-of-scope** for Phase 28 (intentionally out of scope under D-07). `Header` is global UI (renders on every page including non-`/demo/*` routes); D-07's "all `/demo/*` app data is server-fetched" rule scopes to data fetched from `/demo/*` URLs, not "all data rendered on `/demo/*` pages." Notifications are non-`/demo/*` UI metadata, not sensitive demo data. Re-evaluate in a future phase if notifications acquire role-sensitive content. |
| `src/actions/transitions.ts` | n/a (new file) | Server action module (`'use server'`) | n/a | n/a — write-only mutation | `await requireRole('mill_operator')` — inner-guard (§2, AUTH-02) — first line of every action body | Four exports: `transitionToMixing`, `completeOrder`, `blockOrder`, `resumeFromBlocked`. Each enforces `mill_operator` before any DB I/O (T-33-AuthZ). Optimistic concurrency via `.returning()` (not `.rowsAffected`). `TransitionResult` discriminated union consumed by Phase 34 UI. Added: Phase 33 plan 33-04. |

**Note:** This table is a point-in-time snapshot. If a future refactor changes the after-state of any row, update this section in the same commit — readers of `docs/security-patterns.md` must be able to trust that the audit reflects the current code.

**Post-refactor (260512-kfy):** The singular `role` field on `CustomJwtSessionClaims.metadata` was renamed to `roles: Role[]` (an array). All `requireRole` and middleware checks use `metadata.roles.includes(...)`. The audit rows above still describe the correct guard pattern; only the underlying claim shape changed.

## 2. The server-fetch pattern

Every role-gated page follows the same shape: guard, then server-side fetch, then render a client child with data as a prop. The role check runs before any sensitive value is in scope; the client bundle never imports the service module; the prop boundary is the only path the data crosses into the browser.

The canonical reference implementation is `src/app/demo/customers/[id]/page.tsx`. Its full source post-Phase 28:

```typescript
import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import CustomerDetailTabs from '@/components/CustomerDetailTabs';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';
import { requireRole } from '@/lib/auth';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole('demo');
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params;

  // Parallel fetch: customer, events, bins, and orders (D-07)
  const [customer, events, bins, orders] = await Promise.all([
    getCustomerById(id),
    getActivityEvents(id),
    getBinsByCustomerId(id),
    getOrdersByCustomerId(id),
  ]);

  // 404 handling
  if (!customer) {
    notFound();
  }

  return (
    <DashboardLayout>
      <CustomerDetailHeader customer={customer} stats={customer.stats} bins={bins} />
      <CustomerDetailTabs events={events} orders={orders} />
    </DashboardLayout>
  );
}
```

**Note:** When the page needs multiple independent data sources, use `Promise.all` for parallel fetch — `src/app/demo/customers/[id]/page.tsx` is the canonical multi-source example (four `getX(id)` calls in parallel). For a single data source, a plain `await getX()` is sufficient — `src/app/demo/orders/page.tsx` and `src/app/demo/mill-production/page.tsx` use this shape. Either way, the role guard is the FIRST statement of the function body; nothing reads or fetches before it.

**Note:** `DashboardLayout` and `Header` are themselves `'use client';` files. That is fine — a Server Component is allowed to render client components as children. The boundary is the prop edge. Never add `requireRole` to `DashboardLayout` or any client component — server-only imports in a `'use client'` file break the build (see Pitfall 1 below).

## 3. requireRole vs checkRole vs middleware

Defense-in-depth lives across three tiers. Each helper does one thing well; using them together gives layered safety without redundant noise.

| Helper | Tier | Behavior on failure | When to use |
|--------|------|--------------------|-------------|
| `clerkMiddleware` route matcher (`isDemoRoute` in `src/middleware.ts`) | Edge (middleware.ts) | `NextResponse.redirect('/')` | Route-level coarse gate. Runs first, before any rendering. Already in place — do not modify (Phase 25 ACCESS-01 / Phase 28 D-04). |
| `await requireRole('demo')` | Server Component (page entry) | `redirect('/sign-in')` for missing session, `redirect('/')` for wrong role | Page-level inner guard before data fetch. Defense-in-depth: if the middleware matcher ever drifts, the page still refuses to render the wrong audience. **The Phase 28 pattern.** Cite: JSDoc on `src/lib/auth.ts` `requireRole`. |
| `await checkRole('demo')` | Server Component | Returns `boolean` — no redirect | Conditional render inside a Server Component (e.g., "show admin-only section only if `await checkRole('admin')`"). Not used in the Phase 28 codebase but documented as the third member of the family. Cite: JSDoc on `src/lib/auth.ts` `checkRole`. |
| `<Protect role="...">` (from `@clerk/nextjs`) | Client | Hides DOM only | **UX only**, never as a data-access boundary. No live usage in the codebase (Phase 28 D-10). See §4. |

Middleware is the outer gate; `requireRole` is the inner gate at the page entry; `checkRole` is for in-page boolean branches; `<Protect>` is for UX cues, not security. Both `requireRole` and `checkRole` read role state from `sessionClaims.metadata.roles` (a `Role[]` array) via `auth()` from `@clerk/nextjs/server`, using `Array.prototype.includes` for membership checks — the JSDoc blocks on `src/lib/auth.ts` are the authoritative API reference and intentionally state "SERVER-ONLY: never import this module into a client component."

## 4. `<Protect>` is UX, not security

`<Protect>` is a Clerk control component that **visually hides** its children when the user fails a role or permission check. It does not gate data fetching, it does not strip data from the client bundle, and it does not prevent any value held by the parent from appearing in the browser's source view. Treat it as a presentational helper only.

```typescript
// docs example — DO NOT add to code this phase (D-10)

// DON'T: wrap data-bearing UI with <Protect>
<Protect role="demo">
  <OrdersTable orders={orders} />   {/* orders are already in the bundle — exposure */}
</Protect>

// DO: gate the data fetch in the page (server-side)
// src/app/demo/orders/page.tsx
await requireRole('demo');
const orders = await getOrders();
return <OrdersTable orders={orders} />;

// DO: use <Protect> for purely-presentational role cues
<Protect role="admin">
  <Badge>Admin</Badge>            {/* no sensitive payload */}
</Protect>
```

Clerk's own documentation for its control components states the same rule: visually-hidden children remain accessible via the browser's source code even if the user fails authentication or authorization checks. For truly sensitive data that should be completely inaccessible to unauthorized users, perform authorization checks on the server before sending data to the client.

**Note:** `<Protect>` has no live usage in `src/` at the close of Phase 28 (D-10). The first real adoption is deferred to a future phase that has a genuine role-conditional UI need (e.g., an admin-only badge or a demo-mode banner with role-specific copy). When that phase lands, the snippets above are the reference shape — gate the data fetch server-side, then use `<Protect>` only for the cosmetic role-cued slot.

See also `.planning/research/PITFALLS.md` §Pitfall 6 for the project-internal canonical statement of this rule (it pre-dates Phase 28 and is the authoritative cross-reference if this section ever drifts).

## 5. localStorage / browser-state exception

Not every piece of state crosses a trust boundary. Theme, density, locally-cached UI preferences, and similar values are **browser-state, not data-fetching** — they originate in the browser, live in the browser, and never need a role check because the user is the only consumer.

The worked example is `src/app/settings/page.tsx`:

```typescript
// src/app/settings/page.tsx (lines 16-22, abbreviated)
export default function SettingsPage() {
  const { theme } = useTheme();
  const [savedPreferences, setSavedPreferences] = useLocalStorage<UserPreferences>(
    "user-preferences",
    defaultPreferences
  );
  // ...
}
```

The rule: **browser-local state (theme, density, UI preferences) is not data fetching and may live in client components.** The `/demo/*` rule from §2 applies to remote data acquisition only — `useLocalStorage` reads and writes the browser's own `localStorage` API, never the server.

This makes `/settings/page.tsx` an explicit, intentional non-gap in the audit:

- It remains a `'use client'` component (D-08).
- It is NOT given a `requireRole` guard (D-06). Settings is accessible to all authenticated users — only Clerk `auth.protect()` from middleware applies, with no role check on top. This is a deliberate carve-out, not an oversight.
- It is listed in the §1 audit table with role guard "**None** by design" so future readers do not file it as a missing guard.

**Note:** As soon as the same data needs to be authoritative on the server (e.g., saving preferences to a backend so they sync across devices), the read flips to server-fetched RSC and follows §2 — `await auth.protect()` (or `await requireRole(...)` if role-gated) at the top of an async page, then `await getUserPreferences(userId)`, then prop-handoff to a client child. The current `useLocalStorage` shape is correct for browser-only state and incorrect for any state that needs to be authoritative on the server.

## 6. Onboarding checklist for new role-gated pages

When adding a new role-gated page, work through this checklist:

1. Place the page at `src/app/demo/<feature>/page.tsx` (or another role-gated namespace). Co-locate `__tests__/page.test.tsx` next to it.
2. Make the default export an `async function`. Do NOT add `'use client'` to the page file — a `'use client'` directive applies to the entire file and would forbid the `await requireRole(...)` call.
3. As the FIRST statement in the function body, write `await requireRole('demo')` (or the appropriate role). The `await` is mandatory: `requireRole` returns `Promise<void>`, so a missing `await` lets the function continue past the redirect — TypeScript will not flag the bug. Cite: `.planning/phases/28-client-component-security-audit/28-RESEARCH.md` Pitfall 4.
4. Fetch all sensitive data after the guard, using `await getX()` for a single source or `await Promise.all([...])` for multiple. Never `import` a service module (`@/services/*`) from a `'use client'` file — `auth()` from `@clerk/nextjs/server` is server-only, and the audit's bundle-size guarantee depends on service modules never reaching the client (RESEARCH §Pitfall 1).
5. Render the data by passing it as a prop to a client child component. The client child handles interactivity (filter, search, URL params, keyboard nav, click-to-route). The client child must NOT import the service module — `grep -rn "from '@/services/X'" src/components/` should return only the server-side caller, never a client wrapper.
6. Add a page test under `__tests__/page.test.tsx` using the `src/test/fixtures/clerkAuth.ts` fixture. Wire `jest.mock('@clerk/nextjs/server', () => clerkAuthMockFactory())` and `jest.mock('next/navigation', () => nextNavigationMockFactory())` at the top of the file. Cover three branches: unauthenticated session → `.rejects.toMatchObject({ url: '/sign-in' })`; non-demo role → `.rejects.toMatchObject({ url: '/' })`; demo session → `const element = await Page(); render(element);` and assert the rendered content.
7. If the client child uses `useSearchParams`, wrap it in `<Suspense fallback={...}>` inside the RSC return — Next 16 requires `useSearchParams` to live inside a Suspense boundary. `src/app/demo/orders/page.tsx` is the reference example.
8. Update `docs/security-patterns.md` §1 (audit findings table) with a new row for the page in the same commit. The audit table is the durable record of which routes are guarded — if it drifts from reality, the doc lies to future readers.

---

*Created: 2026-05-11 (phase 28)*
