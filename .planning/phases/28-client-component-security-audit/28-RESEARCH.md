# Phase 28: Client Component Security Audit - Research

**Researched:** 2026-05-11
**Domain:** Next.js 16 / React 19 Server-Component data-loading boundary; Clerk role-guard placement; client/server security audit
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Audit Depth and Refactor Scope**
- **D-01:** Full refactor to server-fetch pattern for every `/demo/*` page. Each page becomes an async Server Component that: (a) calls `await requireRole('demo')`, (b) `await`s the mock-service fetch (`getOrders`, `getCustomers`, `getProductionOrders`), (c) renders a client child component with the data passed as props.
- **D-02:** Existing client components (`OrdersTable`, the customer-list UI, the mill-production UI) keep their interactivity (filters, search, selection, URL params) — they just receive data via props instead of fetching internally. New thin client wrappers are introduced only if the existing component cannot be cleanly adapted to accept-as-props.
- **D-03:** Audit findings are captured as a point-in-time inventory table at the top of `docs/security-patterns.md` (component → fetch site → status before/after). No separate `28-AUDIT.md` artifact.

**Guard Layering (Defense-in-Depth)**
- **D-04:** Keep middleware demo-role enforcement (Phase 25 ACCESS-01) AS-IS — do not re-open that decision. Middleware redirects at the edge; the page-level `requireRole` is a redundant inner check.
- **D-05:** `requireRole('demo')` is added to every `/demo/*` page entry point (`/demo/orders/page.tsx`, `/demo/customers/page.tsx`, `/demo/customers/[id]/page.tsx`, `/demo/mill-production/page.tsx`). The `[id]` server component already exists — it gains `requireRole` but keeps its current `Promise.all` fetch shape.
- **D-06:** `/settings/page.tsx` is NOT given a `requireRole` guard. Settings is intentionally accessible to all authenticated users (NAV-02 / Phase 25 D-07); only Clerk `auth.protect()` from middleware applies. This is an explicit non-gap, documented in the guidelines doc.

**Sensitivity Classification (Forward-Looking Pattern)**
- **D-07:** Mock data is treated as canonical "sensitive" for refactor purposes. The audit commits the codebase to "all `/demo/*` app data is server-fetched after a server-side role check, mock or real." Future phases that add real data follow this same shape — no exit ramp for client-side data fetching on `/demo/*`.
- **D-08:** `localStorage`-backed preferences in `/settings` are an **explicit exception** — they are browser-state, not data-loading, and remain client-side. The exception is documented in `docs/security-patterns.md` with the rule: "browser-local state (theme, density, UI preferences) is not 'data fetching' and may live in client components."

**Guidelines Deliverable**
- **D-09:** Create `docs/security-patterns.md` as the single forward-looking reference. Required sections: (1) Audit findings table, (2) The server-fetch pattern with code example mirroring `/demo/customers/[id]/page.tsx`, (3) When to use `requireRole` vs `checkRole` vs middleware decision table, (4) `<Protect>` is UX-not-security with do/don't snippets and link to PITFALLS.md Pitfall 6, (5) localStorage / browser-state exception (settings page example), (6) onboarding checklist for new role-gated pages.
- **D-10:** No new `<Protect>` usage is added to the codebase. The guidelines doc shows the pattern with snippets only.

### Claude's Discretion

- The split between "modify existing client component to accept data prop" vs "introduce thin client wrapper" — heuristic: if the existing component's only entanglement with the fetch is a single `useEffect` + `useState` pair, lift those out and accept data as a prop; if the component is deeply tied to its own loading/error states, introduce a wrapper.
- Loading-state handling during the server-fetch transition (`loading.tsx` vs `<Suspense>`) — planning-level concern. The current orders page already uses `<Suspense>` for the `useSearchParams` boundary; that pattern can stay.

### Deferred Ideas (OUT OF SCOPE)

- **Live `<Protect>` usage in the UI** — documented as a pattern only; first real adoption deferred to a future phase with a real role-conditional UI need.
- **Removing middleware role check** (single-source-of-truth simplification) — user chose defense-in-depth.
- **Granular sensitivity tiers** (public summary stats vs sensitive detail) — current mock data is uniformly treated as sensitive.
- **Programmatic audit (lint rule / CI check) that flags `'use client'` files importing data services** — tooling phase, not a security phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 28 has **no direct REQUIREMENTS.md IDs**. It is a security verification / hardening phase. The success criteria from ROADMAP.md drive scope:

| Success Criterion (from ROADMAP) | Research Support |
|---|---|
| SC-1: No sensitive data fetched in client components before server-side role verification | D-01/D-02 server-fetch refactor of all `/demo/*` pages; audit finds 3 client pages + 2 client child components that fetch via `useEffect`. Refactor lifts data fetch above the server/client boundary. |
| SC-2: `<Protect>` component usage documented with clear guidelines on client vs server checks | D-09/D-10 `docs/security-patterns.md` with `<Protect>` UX-not-security section, do/don't snippets, link to PITFALLS.md §Pitfall 6. |
| SC-3: All role-dependent data loading happens in Server Components with proper guards | D-05 adds `await requireRole('demo')` to every `/demo/*` page entry point. Defense-in-depth with middleware ACCESS-01 retained. |

**Indirect ACCESS-02 reinforcement:** Phase 27 delivered `requireRole`/`checkRole` (already JSDoc-documented). Phase 28 is the first real consumer at the page level. No requirement-traceability change; this is verification scope.
</phase_requirements>

## Summary

Phase 28 turns the role-utility infrastructure delivered in Phases 25-27 into a working security boundary by refactoring every `/demo/*` page from a client-component-with-`useEffect`-fetch into an async Server Component that (a) calls `await requireRole('demo')` and (b) fetches mock data on the server before passing it as props to the existing interactive client UI. The phase is **half refactor, half documentation**: the refactor establishes the canonical pattern so future real-data work follows the same shape; the doc (`docs/security-patterns.md`) captures the rules of the road, including the deliberately non-obvious "localStorage is browser-state, not data-fetching" exception that exempts `/settings`.

The canonical reference implementation for the refactor already exists in the codebase: `src/app/demo/customers/[id]/page.tsx` is an async Server Component using `Promise.all` for parallel mock-service fetch and passing data to client children — Phase 28 generalizes that pattern. The three pages that need migration (`/demo/orders`, `/demo/customers`, `/demo/mill-production`) each contain one `useEffect` + `useState` data-acquisition block; the interactivity (filters, search, URL params, selection, keyboard nav) is preserved unchanged. `OrdersTable` is the most-entangled component because it owns its own fetch inside `useEffect`; the lift requires either modifying its signature to accept `orders` as a prop or introducing a thin wrapper.

**Primary recommendation:** Mirror `src/app/demo/customers/[id]/page.tsx` exactly: top-of-file `await requireRole('demo')` → `await` (or `Promise.all` if multi-source) the service call → render the existing client child with `data` as a prop. Test churn is concentrated in three places (`OrdersTable.test.tsx`, `customers/page.test.tsx`, `mill-production/__tests__/page.test.tsx`) where existing `(getOrders as jest.Mock)` shims migrate to "render with data prop" assertions and the page tests gain a `jest.mock('@clerk/nextjs/server')` block mirroring the established `auth.test.ts` pattern.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication gate (`auth.protect()`) | Middleware (edge) | — | Already done by Phase 25; runs before any rendering. |
| Demo-role gate (route-level) | Middleware (edge) | API/Backend (RSC `requireRole`) | Middleware is outer layer (D-04); page-level `requireRole` is inner defense-in-depth (D-05). Both redirect to `/`. |
| Sensitive data fetch | API/Backend (RSC) | — | Per D-01, all `/demo/*` data fetched in Server Components only — no client-side fetch. |
| Interactivity (filter / search / selection / URL params / keyboard nav) | Browser / Client | — | Preserved unchanged in existing client components (`OrdersTable`, customer-list, mill-production UI). |
| Browser-local preferences (theme, density, notifications-read state) | Browser / Client | — | Per D-08, localStorage is browser-state, not data-loading — stays client (settings page exception). |
| Role-conditional UI rendering (future) | Server Component (`checkRole`) | Client (`<Show>` / `<Protect>` for UX only) | Doc-only in this phase (D-10); the doc shows `checkRole` as the server primitive and `<Protect>` as UX-not-security. |
| Mock-service module import safety | API/Backend (RSC) | — | `src/services/*.ts` modules return Promises and are server-callable; they were already callable from a client component via `useEffect`, so they have no `server-only` guard — moving them to RSC consumption requires no change. |

## Standard Stack

### Core

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| `next` | `16.1.6` | App Router, async Server Components, `await params` | Already installed; the `[id]/page.tsx` Server Component already uses Next 16's `await params` pattern. [VERIFIED: package.json] |
| `react` / `react-dom` | `19.2.3` | RSC + Suspense boundary semantics | Already installed; the existing orders page uses `<Suspense>` for the `useSearchParams` boundary which carries forward. [VERIFIED: package.json] |
| `@clerk/nextjs` | `^7.3.3` | `auth()`, `clerkMiddleware`, `<Protect>`, `<Show>` | Already installed; `requireRole`/`checkRole` already wrap `auth()` from `@clerk/nextjs/server`. [VERIFIED: package.json] |
| `@clerk/types` | `^4.101.23` | `CustomJwtSessionClaims` interface augmentation | Already installed; `src/types/clerk.d.ts` already uses this. [VERIFIED: package.json] |

### Supporting

| Library | Version (installed) | Purpose | When to Use |
|---------|---------------------|---------|-------------|
| `jest` / `@testing-library/react` | `^30.3.0` / `^16.3.2` | Component + page tests | Existing; the refactored page tests follow `src/lib/auth.test.ts` pattern for mocking `auth()` and `redirect()`. |
| `@playwright/test` | `^1.59.1` | E2E from Phase 27 | Existing; Phase 27 already covers role-redirect E2E; Phase 28 does not need new E2E unless the page-guard breaks redirect-to-root parity. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `await requireRole('demo')` in page (D-05) | `await auth.protect({ role: 'demo' })` from Clerk | Clerk's `auth.protect` is Clerk-native but requires Clerk's organization-role model; project uses `publicMetadata.role` (Phase 25 D-09). `requireRole` is the project's adapter — already shipped, already tested. **Stay with `requireRole`.** |
| Stream data via promise to client (`<Suspense>`-resolved Promise prop) | Pattern from Next 16 docs | Adds complexity (the client child must call `React.use(promise)`) without benefit for mock data that's effectively synchronous. **Defer to a real-data phase if streaming becomes necessary.** |
| `<Protect role="demo">` wrapping interactive UI | Clerk control component | **Documented as UX-not-security per D-10**; explicitly rejected for the data-fetch boundary per PITFALLS.md §Pitfall 6 and Clerk's own `<Show>` security note (see Code Examples). |

**Installation:** No new packages required. All capabilities exist in the current dependency tree. [VERIFIED: package.json read 2026-05-11]

## Architecture Patterns

### System Architecture Diagram

```
                       ┌───────────────────────────────────────────────────┐
                       │  Browser request: GET /demo/orders                │
                       └─────────────────────┬─────────────────────────────┘
                                             │
                            ┌────────────────▼────────────────┐
                            │ Layer 1 (edge): middleware.ts   │
                            │ - auth.protect() if non-public  │
                            │ - if /demo/* and role != demo:  │
                            │     redirect → /                │
                            │ ACCESS-01 / Phase 25 (UNCHANGED)│
                            └────────────────┬────────────────┘
                                             │ (demo role OK)
                            ┌────────────────▼────────────────┐
                            │ Layer 2 (RSC): page.tsx (NEW)   │
                            │ async function Page() {         │
                            │   await requireRole('demo');   ◄── D-05 (NEW)
                            │   const data = await getX();   ◄── D-01 (lift from client)
                            │   return <ClientUI data={data}/>│
                            │ }                               │
                            └────────────────┬────────────────┘
                                             │ data passed as serialized props
                            ┌────────────────▼────────────────┐
                            │ Layer 3 (client): existing UI   │
                            │ - filter / search / select      │
                            │ - URL param sync                │
                            │ - keyboard nav                  │
                            │ NO data fetch from services     │
                            └─────────────────────────────────┘

  EXCEPTION (D-08): /settings/page.tsx
    Layer 1 (middleware): auth.protect() ONLY (no role check)
    Layer 2: no page-level requireRole — by design (D-06)
    Layer 3: client component with localStorage browser-state (theme, density, notif-read)
             — localStorage is NOT data fetching; stays client-side.
```

### Recommended Project Structure (post-refactor)

```
src/
├── app/
│   ├── demo/
│   │   ├── orders/
│   │   │   ├── page.tsx               # async RSC: requireRole + getOrders → <OrdersTable orders=...>
│   │   │   └── __tests__/page.test.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx               # async RSC: requireRole + getCustomers → <CustomersList customers=...>
│   │   │   ├── [id]/page.tsx          # already RSC; ADD `await requireRole('demo')` at top
│   │   │   └── __tests__/page.test.tsx
│   │   └── mill-production/
│   │       ├── page.tsx               # async RSC: requireRole + getProductionOrders → <MillProductionUI orders=...>
│   │       └── __tests__/page.test.tsx
│   └── settings/page.tsx              # UNCHANGED — explicit exception (D-06, D-08)
├── components/
│   ├── OrdersTable.tsx                # client; accepts orders: Order[] prop (NEW SIGNATURE)
│   ├── (new) CustomersList.tsx        # client wrapper, OR adapt existing inline JSX
│   └── (new) MillProductionUI.tsx     # client wrapper, OR adapt existing inline JSX
├── lib/auth.ts                         # UNCHANGED (already done in Phase 27)
└── middleware.ts                       # UNCHANGED (D-04)
docs/
└── security-patterns.md               # NEW — sole doc artifact
```

### Pattern 1: Server-fetch + client-render (canonical, mirrors existing `[id]/page.tsx`)

**What:** Async Server Component does role check + data fetch; passes data as serialized props to a client child that owns interactivity.

**When to use:** Every page under `/demo/*` (and any future role-gated route).

**Example:**
```typescript
// src/app/demo/orders/page.tsx — AFTER refactor
// Source: shape verified against /vercel/next.js Context7 docs
//   "Server Component fetching and passing data to Client Component"
//   AND src/app/demo/customers/[id]/page.tsx (existing canonical example)
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import DashboardLayout from '@/components/DashboardLayout';
import OrdersTableClient from '@/components/OrdersTableClient'; // or modified OrdersTable

export default async function OrdersPage() {
  await requireRole('demo');         // redirects to / if not demo (D-05)
  const orders = await getOrders();  // server-side fetch (D-01)

  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersTableClient orders={orders} />
      </Suspense>
    </DashboardLayout>
  );
}
```

The `<Suspense>` wrapper is preserved because the **client** child still uses `useSearchParams()` for URL-param-driven selection (Next 16 requires `useSearchParams` to be inside a Suspense boundary).

### Pattern 2: `[id]/page.tsx` parallel-fetch (already in repo)

**What:** When a page needs multiple independent data sources, fetch them in parallel.

**When to use:** Existing customer-detail page; future pages needing multiple service calls.

**Example:**
```typescript
// src/app/demo/customers/[id]/page.tsx — AFTER (only addition is requireRole)
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';

export default async function CustomerDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole('demo');                  // NEW (D-05)
  const { id } = await params;                // EXISTING

  const [customer, events, bins, orders] = await Promise.all([
    getCustomerById(id),
    getActivityEvents(id),
    getBinsByCustomerId(id),
    getOrdersByCustomerId(id),
  ]);

  if (!customer) notFound();

  return (
    <DashboardLayout>
      <CustomerDetailHeader customer={customer} stats={customer.stats} bins={bins} />
      <CustomerDetailTabs events={events} orders={orders} />
    </DashboardLayout>
  );
}
```

### Pattern 3: Test harness for refactored pages (verified against existing patterns)

**What:** Mock `@clerk/nextjs/server` to return a session with `metadata.role === 'demo'`; mock `next/navigation.redirect` with a sentinel-throw so tests catch redirect-on-failure cases; mock the mock-service module to return fixture data.

**When to use:** Every refactored page's test.

**Example:**
```typescript
// src/app/demo/orders/__tests__/page.test.tsx (after refactor)
// Source: mirrors src/lib/auth.test.ts (Pattern C: jest.mock placement)
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }); },
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/demo/orders'),
}));
jest.mock('@/services/orders', () => ({ getOrders: jest.fn() }));

import { render, screen } from '@testing-library/react';
import OrdersPage from '../page';
import { getOrders } from '@/services/orders';

describe('OrdersPage (RSC)', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'demo' } } });
    (getOrders as jest.Mock).mockResolvedValue([/* fixtures */]);
  });

  it('redirects when role is not demo', async () => {
    mockAuth.mockResolvedValue({ userId: 'u1', sessionClaims: { metadata: { role: 'user' } } });
    await expect(OrdersPage()).rejects.toMatchObject({ url: '/' });
  });

  it('renders OrdersTable with fetched orders when role is demo', async () => {
    const element = await OrdersPage();
    render(element);
    // assertions against the rendered client child
  });
});
```

Note: testing an async RSC by calling it as a function and rendering the returned JSX is the standard React 19 / Next 16 unit-test approach — verified in the existing `src/lib/auth.test.ts` pattern (the redirect-sentinel-throw idiom is already in use).

### Anti-Patterns to Avoid

- **`<Protect role="demo">` wrapping data-bearing UI** — only visually hides; data still loads (PITFALLS.md §Pitfall 6; verified in Clerk docs `<Show>` security note: *"The `<Show />` component only visually hides its children; the contents remain accessible via the browser's source code even if the user fails authentication or authorization checks."* — same caveat applies to `<Protect>`). [CITED: clerk-docs/reference/components/control/show.mdx]
- **`useEffect(() => getX().then(setX), [])` for sensitive data** — runs in the browser AFTER the client bundle ships; any data the service returns is in flight before any role check runs. Refactor (D-01) eliminates every instance under `/demo/*`.
- **Calling `requireRole` from a layout** — layouts re-run on every navigation but the existing `DashboardLayout` is a client component and cannot call server-only `auth()`. Per D-05, the guard belongs on the **page** (entry point), not the layout. Adding a server layout to host the guard would force Sidebar/Header re-evaluation patterns that conflict with the current `usePathname`-driven sidebar logic.
- **Adding `requireRole` to `/settings/page.tsx`** — explicitly rejected (D-06). Settings is universal; only middleware `auth.protect()` applies.
- **Treating localStorage usage as "data fetching"** — D-08 carves it out explicitly so the doc's "all `/demo/*` data is server-fetched" rule cannot be misread as "no client component may use localStorage."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-side role check + redirect | Custom `getServerSession + if-role-redirect` per page | `await requireRole('demo')` from `@/lib/auth` | Already shipped, JSDoc'd, tested in Phase 27. |
| Server-side role check returning boolean (no redirect) | Inline `auth()` calls + claim destructuring | `await checkRole('demo')` from `@/lib/auth` | Same source-of-truth as `requireRole`; conditional render in RSC without redirect. |
| Edge-level demo gate | New middleware logic | Existing `src/middleware.ts` ACCESS-01 (D-04 — do not touch) | Phase 25 already verified; Phase 28 explicitly excludes middleware changes. |
| Client-side role guard for security | `if (user?.role !== 'demo') return null` in a `'use client'` file | Server-side `requireRole` at the page boundary | PITFALLS.md §Pitfall 6 — security theater, data already in bundle. |
| Loading-state on server fetch | Manual `useState(true)` + `useEffect` | Either `<Suspense fallback=...>` (already in use) or a `loading.tsx` Next.js convention | Next 16 / React 19 native; consistent with existing orders-page pattern. |

**Key insight:** Phase 28 is a **deletion phase** for client-side data fetching of sensitive data — every `useEffect(() => getX().then(setX))` block under `/demo/*` is removed, not replaced with a fancier client-side fetch.

## Runtime State Inventory

> Phase 28 is a refactor + audit phase. The "rename" reasoning template applies because data-acquisition is being relocated from one tier to another.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 28 changes no databases, no Clerk metadata, no session shape. Roles are read-only from `sessionClaims.metadata.role` (already populated since Phase 25/27). | None. |
| Live service config | Clerk Dashboard JWT template (already configured Phase 27 D-04 to include `metadata`) — still required for `requireRole` to read the role claim. **No new Clerk Dashboard work.** | None — Phase 27 finalized. |
| OS-registered state | None — no scheduled jobs, no daemons, no OS-registered components in this Next.js app. | None. |
| Secrets / env vars | `.env.local` Clerk publishable + secret keys (already configured Phase 25/27). No new env vars introduced. | None. |
| Build artifacts | Next.js `.next/` cache. After the client→server page refactor, dev/test runs will recompile the affected pages — no manual cache invalidation needed beyond a normal `next dev` cycle. | Normal: `rm -rf .next` before first verification run if odd HMR behavior appears. |

**The canonical question:** *After every file is updated, what runtime systems still have the old shape cached?*
**Answer:** None. The Clerk JWT carries `metadata.role` regardless of which tier reads it; the mock-service modules return the same Promise shape regardless of where called from; existing tests are file-scoped and re-run from scratch each invocation. The only "runtime state" worth flagging is the **client bundle**: post-refactor, the orders/customers/mill-production page bundles **should** no longer contain `getOrders`/`getCustomers`/`getProductionOrders` as direct imports (verification step: `next build` and inspect `.next/static/chunks/app/demo/*` for absence of service-module names).

## Common Pitfalls

### Pitfall 1: Server-only utility imported into a client component

**What goes wrong:** Adding `import { requireRole } from '@/lib/auth'` to a `'use client'` file. `auth()` from `@clerk/nextjs/server` throws at runtime; in some Next.js setups the build itself fails with a server-only-package import error.

**Why it happens:** Mid-refactor mistake — moving the role check "down" into a child component for convenience.

**How to avoid:** `requireRole` is **only** called from the page's top-level async function (the RSC). The JSDoc on `src/lib/auth.ts` already says "SERVER-ONLY: never import this module into a client component." Verification: grep for `from '@/lib/auth'` in any file with `'use client'` — should return zero matches.

**Warning signs:** Build error mentioning `@clerk/nextjs/server`; runtime error "auth() can only be called from the server"; `next dev` succeeds but `next build` fails.

### Pitfall 2: Async page returns props that fail React serialization

**What goes wrong:** Page passes `Date` objects or other non-plain values to a client child. Next.js silently serializes via `JSON.stringify`-equivalent, so `Date` becomes a string, dates that the client child expects to call `.toISOString()` on become broken at runtime.

**Why it happens:** The mock services return objects with `createdAt: Date` / `deliveryDate: Date` / `updatedAt: Date` (verified in `src/types/order.ts`, `src/types/customer.ts`). RSC→client prop boundary uses Flight serialization, which **does** preserve Date (per Next 16/React 19 docs) — but only if the prop chain is fully RSC→client and no intermediate JSON round-trip happens.

**How to avoid:** Treat the prop boundary as serialization-aware: keep `Date` objects in the prop, do NOT manually `JSON.parse(JSON.stringify(orders))` anywhere. The existing `[id]/page.tsx` passes `events`, `bins`, `orders` (each containing `Date` fields) to client children and the customer-detail page works — so Flight handles `Date` correctly here. [CONFIRMED: existing code path works in production.]

**Warning signs:** `TypeError: x.toISOString is not a function` in a client child after refactor; date-formatting tests pass in isolation but fail when invoked from the page test.

### Pitfall 3: Test-suite churn from `(getOrders as jest.Mock)` shims

**What goes wrong:** Existing tests (`OrdersTable.test.tsx`, `customers/page.test.tsx`, `mill-production/__tests__/page.test.tsx`) mock the service module and rely on the component calling `getOrders()` internally. After refactor, the component receives data via props — the `jest.mock('@/services/orders')` shims become dead code and assertions that wait for `getOrders` to resolve will hang.

**Why it happens:** Refactor changes the component's contract (function-of-state → function-of-props) without test churn being treated as a first-class deliverable.

**How to avoid:** For each affected test file:
1. Move `getOrders` mock to the page test (where the RSC calls it).
2. In the component test, replace `(getOrders as jest.Mock).mockResolvedValue(mockOrders)` + `await waitFor(...)` with `render(<OrdersTable orders={mockOrders} ... />)` and synchronous assertions.
3. The `next/navigation` mocks (`useSearchParams`, `useRouter`) stay because they're consumed by the client child.

**Warning signs:** Test timeouts; assertions for rendered rows fire before `setState`-via-`useEffect` would have run; `jest.mock` blocks no longer match what the component imports.

### Pitfall 4: Forgetting `await requireRole` (missing `await`)

**What goes wrong:** `requireRole('demo')` returns a Promise. Without `await`, the function continues executing immediately, the data fetch fires before the role check completes, and `redirect()` (which throws `NEXT_REDIRECT` internally) does not interrupt the data flow.

**Why it happens:** The function signature returns `Promise<void>` so TypeScript does not flag a missing `await` as obviously as a missing return value would.

**How to avoid:** Lint convention — `await` on every line that calls `requireRole`. The JSDoc already shows `await requireRole(...)` and notes "Callers do NOT need to `return` after `await requireRole(...)`." Verification step in plan: grep `requireRole(` matches must all be preceded by `await ` (or `return await`).

**Warning signs:** Data leak — non-demo user briefly receives data before the redirect kicks in; integration test shows page rendering for an unauthorized session before the redirect.

### Pitfall 5: Loading skeleton wrapped in the wrong boundary

**What goes wrong:** Existing `<Suspense fallback=...>` in orders page wraps `OrdersContent` which exists because of `useSearchParams`. After refactor, the data fetch happens in the parent RSC (above `<Suspense>`); the `<Suspense>` boundary still covers `useSearchParams` but **not** the data fetch. The fallback skeleton no longer shows during slow mock-service responses.

**Why it happens:** Misreading what `<Suspense>` is covering — in the existing client page it covered "client hydration + searchParams + data fetch"; in the refactored RSC it can only cover "client hydration + searchParams" because the data is already resolved by the time the boundary renders.

**How to avoid:** Decide explicitly between (a) showing **no** loading state for the data fetch (it's mock data, returns near-instantly), (b) adding a `loading.tsx` next to `page.tsx` for the full-page loading state, or (c) using the streaming pattern (`const ordersPromise = getOrders(); return <Suspense><Client promise={ordersPromise} /></Suspense>`) — for mock data, **option (a)** is correct.

**Warning signs:** UX regression report: "page shows blank for a beat before rendering" — this is the RSC waiting on the synchronous mock fetch and is expected; document in the security-patterns doc so future readers don't try to "fix" it.

### Pitfall 6: `<Protect>` data exposure (carried from PITFALLS.md §Pitfall 6)

**What goes wrong:** Developer adds `<Protect role="demo"><SensitiveData /></Protect>` thinking it provides security. The data still loads — `<Protect>` only hides DOM nodes, not data fetched by their parent.

**Why it happens:** Misreading the component name; "Protect" sounds like a security boundary.

**How to avoid:** Per D-10, **no new `<Protect>` usage in code this phase**. The doc (`docs/security-patterns.md` §4) calls this out explicitly, with the verbatim Clerk caveat (cited above) and the existing PITFALLS.md link. **First live use is deferred to a phase that has a genuine role-conditional UI need.**

**Warning signs:** Code review reveals `<Protect>` near `<OrdersTable />` or `<CustomerDetailHeader />`; security audit finds component tree contains data the user "shouldn't" be able to see.

## Code Examples

### Example A: Refactored `/demo/orders/page.tsx` (full)

```typescript
// Source: pattern from /vercel/next.js "Server Component fetching and passing data to Client Component"
//   + src/app/demo/customers/[id]/page.tsx canonical shape
//   + src/lib/auth.ts JSDoc usage
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import DashboardLayout from '@/components/DashboardLayout';
import OrdersTableClient from '@/components/OrdersTableClient';
// ^ OR keep OrdersTable.tsx name and change its signature to accept `orders` prop

export default async function OrdersPage() {
  await requireRole('demo');
  const orders = await getOrders();

  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersTableClient orders={orders} />
      </Suspense>
    </DashboardLayout>
  );
}
```

### Example B: `OrdersTable` signature change (modify-in-place option)

The existing component owns `useEffect` + `useState<Order[]>([])`. After refactor:

```typescript
// src/components/OrdersTable.tsx (excerpt — modified)
interface OrdersTableProps {
  orders: Order[];                                  // NEW
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  externalSearchTerm?: string;
}

export default function OrdersTable({
  orders,                                           // NEW prop
  selectedOrderId,
  onSelectOrder,
  externalSearchTerm,
}: OrdersTableProps) {
  // REMOVED:
  //   const [orders, setOrders] = useState<Order[]>([]);
  //   useEffect(() => { getOrders().then(setOrders).catch(...); }, []);
  //
  // EVERYTHING ELSE: unchanged — filter pills, search, keyboard nav, etc.
```

The wrapper-vs-modify decision (Claude's Discretion in CONTEXT.md): `OrdersTable`'s `useEffect`/`useState` for the orders array is a single self-contained block — **modify in place** is the lower-friction path. The customer-list inline JSX in `customers/page.tsx` is also a single fetch site embedded directly in the page — extract into `CustomersList.tsx` client component **because the page itself becomes a server component and can't keep the inline `useState`/`useRouter`/`useDebounce` block**. Mill-production similarly needs extraction.

### Example C: `<Protect>` doc snippet (UX-not-security)

```typescript
// docs/security-patterns.md §4 snippet — DO NOT add to code this phase
// DO NOT: use <Protect> to hide sensitive data
<Protect role="demo">
  <OrdersTable orders={orders} />   {/* orders are already in the bundle — exposure */}
</Protect>

// DO: gate the data fetch in the page (server-side)
// app/demo/orders/page.tsx
await requireRole('demo');
const orders = await getOrders();
return <OrdersTable orders={orders} />;

// DO: use <Protect> for purely-presentational role cues
<Protect role="admin">
  <Badge>Admin</Badge>            {/* no sensitive payload */}
</Protect>
```

**Verbatim Clerk caveat to embed in doc:** *"The `<Show />` component only visually hides its children; the contents remain accessible via the browser's source code even if the user fails authentication or authorization checks. For truly sensitive data that should be completely inaccessible to unauthorized users, perform authorization checks on the server before sending data to the client."* — same applies to `<Protect>`. [CITED: clerk-docs/reference/components/control/show.mdx]

### Example D: Decision table for `docs/security-patterns.md` §3

| Helper | Tier | Behavior on failure | When to use |
|--------|------|--------------------|--------------|
| `clerkMiddleware` route matcher (`isDemoRoute`) | Edge (middleware.ts) | `NextResponse.redirect('/')` | Route-level coarse gate. Runs first. Already in place — do not modify (D-04). |
| `await requireRole('demo')` | Server Component (page entry) | `redirect('/')` for wrong role, `redirect('/sign-in')` for missing session | Page-level inner guard before data fetch. Defense-in-depth. **The Phase 28 pattern.** |
| `await checkRole('demo')` | Server Component | Returns `boolean` — no redirect | Conditional render inside a server component (e.g., "show admin section iff admin"). Not used in Phase 28 codebase but documented as the third member of the family. |
| `<Protect role="...">` / `<Show when=...>` | Client | Hides DOM only | **UX only**, never as a data-access boundary. No live use this phase (D-10). |

### Example E: Audit findings table format (for top of `docs/security-patterns.md`)

| Path | Component type before | Component type after | Data fetch site before | Data fetch site after | Role guard | Notes |
|------|----------------------|----------------------|------------------------|-----------------------|------------|-------|
| `/demo/orders` | Client (`'use client'`) | RSC (async) | `OrdersTable` `useEffect`→`getOrders()` | `page.tsx` `await getOrders()` | `await requireRole('demo')` added | `<Suspense>` preserved for `useSearchParams` boundary |
| `/demo/customers` | Client (`'use client'`) | RSC (async) | `page.tsx` `useEffect`→`getCustomers()` | `page.tsx` `await getCustomers()` | `await requireRole('demo')` added | New `CustomersList.tsx` client child extracted |
| `/demo/customers/[id]` | RSC (async) | RSC (async) | `page.tsx` `Promise.all([...])` | `page.tsx` `Promise.all([...])` (unchanged) | `await requireRole('demo')` added | Only the role guard is new; fetch shape unchanged |
| `/demo/mill-production` | Client (`'use client'`) | RSC (async) | `page.tsx` `useEffect`→`getProductionOrders()` | `page.tsx` `await getProductionOrders()` | `await requireRole('demo')` added | New `MillProductionUI.tsx` client child extracted (filter pills + state cols stay client) |
| `/settings` | Client (`'use client'`) | Client (`'use client'`) — **unchanged** | localStorage via `useLocalStorage` | localStorage via `useLocalStorage` (unchanged) | **NONE** (D-06 explicit non-gap) | Browser-state exception (D-08) |
| `/sign-in/...` | Client | Client | n/a (Clerk-hosted UI inputs) | n/a | n/a (public route) | No change. |
| Header (notifications dropdown) | Client | Client | `useEffect`→`getNotifications()` | (unchanged — out of scope per ROADMAP scope; notifications is non-sensitive UI metadata, not `/demo/*` data) | n/a | **Document as out-of-scope under D-07's "uniformly sensitive" rule. Notifications are unauth-agnostic UI hints; not sensitive demo data.** |

> The Header notifications row is a judgment call — flag it for the planner. Strict reading of D-07 ("all `/demo/*` app data is server-fetched") would exempt notifications because Header is global (not `/demo/*`-scoped). Recommend documenting as "non-`/demo/*` UI metadata, intentionally out of scope" rather than expanding the refactor scope.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getServerSideProps` + `redirect` config | RSC `await auth()` + `redirect()` from `next/navigation` | Next 13 → 14 (App Router GA) | Already adopted in `[id]/page.tsx` and `src/lib/auth.ts`. |
| Client `useEffect` fetch with server-checked API route | RSC direct service-module call, props to client child | Next 13.4+ (RSC stable) | The Phase 28 refactor is the move-of-record. |
| `<Protect>` as a role gate | `<Protect>` for UX only; server-side `auth.protect()` for security | Clarified in Clerk v6+ docs; explicit in v7 `<Show>` security note | Phase 28 documents this rule rather than relying on tribal knowledge. |
| `auth().has({ role: 'demo' })` (organization roles model) | `sessionClaims.metadata.role === 'demo'` (publicMetadata model) | Phase 25/27 project decision | `requireRole`/`checkRole` adapter already wraps this — Phase 28 just **uses** them. |

**Deprecated/outdated:**
- `clerkAuth()` direct call as a security primitive in a `'use client'` component — was never security; now widely documented as UX-only. The doc captures this rule.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Flight serialization preserves `Date` objects across the RSC→client prop boundary in Next 16 + React 19 | Pitfall 2 | If broken, post-refactor date-formatting fails in `OrdersTable` and customer-detail. **Mitigation:** the existing `[id]/page.tsx` already passes `Date`-bearing objects to `CustomerDetailTabs`/`CustomerDetailHeader` and works in production — empirically verified, but documented as an assumption because no explicit Next 16 changelog entry was cited. [VERIFIED indirectly: existing code path] |
| A2 | Calling an async RSC like `await OrdersPage()` in a Jest test and rendering the returned JSX is the canonical unit-test approach for this codebase | Pattern 3 / Code Examples | If incorrect, page tests need to use a different harness (e.g., a real Next-test integration like `@playwright/test`). **Mitigation:** Phase 27 E2E covers the redirect-on-wrong-role path; if RSC unit-testing proves unstable, fall back to E2E coverage for the page-level guard. [ASSUMED — no existing repo example of an async RSC unit test] |
| A3 | Header notifications `useEffect`→`getNotifications()` is out of scope for the Phase 28 refactor (non-`/demo/*` UI metadata) | Audit findings table footnote | If user reading D-07 strictly disagrees, scope expands by ~1 task: extract notifications into a server-side fetch in a layout or stay in Header with documented justification. **Flag during planning** so the planner can ask explicitly. [ASSUMED based on D-07's "`/demo/*` app data" phrasing] |
| A4 | The mill-production filter strip (`<FilterPill>` with `activeStates` Set) and orders status filters can be cleanly extracted into a client child accepting `orders` as a prop, without changes to FilterPill itself | Code Examples §B / "Don't Hand-Roll" | If the existing component's state shape (e.g., `Set<ProductionState>` initialization timing) interferes with hydration, the refactor needs a thin wrapper. **Mitigation:** D-02's heuristic explicitly allows the wrapper approach. [VERIFIED via reading existing component shape — single `useState` init, no SSR-only state] |
| A5 | `next build` will produce a smaller client bundle for `/demo/orders` after the refactor (services no longer pulled into the page chunk) | Runtime State Inventory verification | If bundle size doesn't drop, it indicates the service module is still being transitively imported by a client component. **Mitigation:** explicit verification step in the plan. [ASSUMED based on standard Next.js code-splitting; no measurement done yet] |

## Open Questions

1. **Should the audit findings table list the Header notifications fetch as in-scope or out-of-scope?**
   - What we know: D-07 says "all `/demo/*` app data is server-fetched"; Header is not under `/demo/*` but renders on `/demo/*` pages.
   - What's unclear: whether the user reads D-07 as "all data rendered on `/demo/*` pages" or "all data fetched from `/demo/*` URLs."
   - Recommendation: planner asks once during plan-check; default position is **out of scope** with a one-line audit-table note.

2. **Loading-state strategy during server-fetch transition: `<Suspense>` vs `loading.tsx` vs none?**
   - What we know: orders page already has `<Suspense>` for the `useSearchParams` boundary; mock services return effectively-synchronously; CONTEXT.md leaves this to planning.
   - What's unclear: whether the user wants a visible loading state for the data fetch itself or considers the existing `<Suspense>` (which now only covers client hydration) sufficient.
   - Recommendation: keep the existing `<Suspense>` boundary (it still does its `useSearchParams` job); do not add a separate `loading.tsx` for the data fetch — document the decision in `docs/security-patterns.md` §2.

3. **Should `OrdersTable` be renamed (e.g., `OrdersTableClient`) when its signature changes from fetcher to prop-receiver?**
   - What we know: D-02 says existing client components keep interactivity; doesn't mandate renames.
   - What's unclear: code-review preference on whether changing a component's contract warrants a rename for grep-ability.
   - Recommendation: planner picks; lean toward **in-place modification with no rename** since `OrdersTable` is referenced in 3+ files and a rename multiplies the diff.

## Environment Availability

Phase 28 has no external dependencies beyond what's already installed. No CLI tools, no databases, no new runtimes. Skip detailed audit.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | (project uses Next 16 which requires Node 20+) | — |
| `next` | Page refactor | ✓ | 16.1.6 | — |
| `react` | RSC semantics | ✓ | 19.2.3 | — |
| `@clerk/nextjs` | `requireRole` import path (`auth()`) | ✓ | 7.3.3 | — |
| `jest` + `@testing-library/react` | Test migration | ✓ | 30.3.0 / 16.3.2 | — |

**No missing dependencies. No fallbacks needed.**

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + `@testing-library/react` 16.3.2 + `next/jest` |
| Config file | `jest.config.ts` (uses `nextJest` from `next/jest.js`) |
| Quick run command | `npm test -- src/app/demo/orders` (or path-scoped) |
| Full suite command | `npm test` |
| E2E framework | Playwright 1.59.1 (Phase 27 fixtures already exist; no new E2E required for Phase 28) |

### Phase Requirements → Test Map

Phase 28 has success criteria, not REQ-IDs. Mapping success criteria to tests:

| Success Criterion | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SC-1 (no client-side fetch of sensitive data) | `/demo/orders` page renders rows when role=demo, redirects to `/` when role≠demo | unit (RSC) | `npm test -- src/app/demo/orders/__tests__/page.test.tsx` | UPDATE (exists, signature changes) |
| SC-1 | `/demo/customers` page renders list when role=demo, redirects when role≠demo | unit (RSC) | `npm test -- src/app/demo/customers/page.test.tsx` | UPDATE |
| SC-1 | `/demo/customers/[id]` page redirects when role≠demo (only change vs existing test) | unit (RSC) | `npm test -- src/app/demo/customers/__tests__` | UPDATE — add redirect test to existing file or add new file |
| SC-1 | `/demo/mill-production` page renders cols when role=demo, redirects when role≠demo | unit (RSC) | `npm test -- src/app/demo/mill-production/__tests__/page.test.tsx` | UPDATE |
| SC-1 | `OrdersTable` renders orders from prop (no `getOrders` call) | unit (component) | `npm test -- src/components/__tests__/OrdersTable.test.tsx` | UPDATE — migrate mock-shim assertions |
| SC-1 | New client wrappers `CustomersList`/`MillProductionUI` render data from prop | unit | `npm test -- src/components/__tests__/` | NEW — Wave 0 task if wrappers introduced |
| SC-2 | `docs/security-patterns.md` exists with required §1-§6 | doc-presence (manual or grep-based) | `test -f docs/security-patterns.md && grep -c "^## " docs/security-patterns.md` | NEW |
| SC-3 | Verified by SC-1 tests + Phase 27 E2E coverage (already passes) | covered above | — | — |

### Sampling Rate

- **Per task commit:** `npm test -- <path-scoped>` for files touched
- **Per wave merge:** `npm test` (full unit suite)
- **Phase gate:** Full `npm test` green; Phase 27 E2E suite still passes (`npm run test:e2e`)

### Wave 0 Gaps

- [ ] Page-test harness mocks for `@clerk/nextjs/server` `auth()` — pattern exists in `src/lib/auth.test.ts`; reuse boilerplate per-test-file
- [ ] Test fixture for "non-demo session" (`sessionClaims.metadata.role === 'user'`) — short inline mock; no new fixture file
- [ ] Migration of `(getOrders as jest.Mock).mockResolvedValue(...)` shims in `OrdersTable.test.tsx` and the three page tests — non-trivial; flagged in code_context above
- [ ] If new client wrappers (`CustomersList`, `MillProductionUI`) are introduced, add `__tests__/` files for each

*(No framework install needed; all infrastructure exists.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (indirectly) | Clerk `clerkMiddleware` + `auth.protect()` — already in `src/middleware.ts`. Phase 28 does not modify. |
| V3 Session Management | Yes (indirectly) | Clerk session tokens + custom JWT template (Phase 27 D-04). Phase 28 reads `sessionClaims.metadata.role` — does not write or invalidate sessions. |
| V4 Access Control | **Primary focus** | Defense-in-depth: middleware ACCESS-01 (route-level) + `requireRole` (page-level, NEW in Phase 28). Both layers redirect to `/` for non-demo. |
| V5 Input Validation | No | No user input is parsed in this phase. Mock service inputs are constant; no query strings or form bodies are accepted server-side. |
| V6 Cryptography | No | No new crypto. Clerk handles JWT verification. |
| V7 Error Handling and Logging | Yes (negative) | D-02 from Phase 25: **no logging** of failed role checks (intentional — no audit trail this milestone). Phase 28 inherits this. |
| V8 Data Protection | Yes (primary) | The whole point of the phase. Sensitive (mock-as-canonical) data is fetched on the server before any role check could fail; client bundle no longer contains the service module imports for `/demo/*` data. |
| V13 API and Web Service | N/A | No new API routes in this phase. |

### Known Threat Patterns for Next.js + Clerk + RSC

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Sensitive data shipped in client bundle | Information disclosure | Server-side fetch in RSC; pass only via props after role check (the Phase 28 pattern). |
| Client-side role check bypass (user edits state in DevTools) | Elevation of privilege | Authoritative role check on the server (`requireRole` in RSC). Client checks only for UX hints (`<Protect>` doc-only this phase). |
| Forged session token / role claim | Spoofing | Clerk's JWT verification (handled in `clerkMiddleware` and `auth()`). Code only reads claims from `auth()`, never from request headers or cookies directly. |
| Race between client-side fetch and middleware redirect | Information disclosure | Eliminated by D-01 — there is no client-side fetch of `/demo/*` data after refactor. |
| Page-level guard skipped in dev / accidentally removed | Elevation of privilege | Defense-in-depth: middleware (D-04) still catches the route at the edge. The page guard is the inner layer. |

## Sources

### Primary (HIGH confidence)
- **Context7** `/vercel/next.js`: "Server Component fetching and passing data to Client Component" + "Stream data from Server to Client Component" (Next 16 App Router patterns)
- **Context7** `/clerk/clerk-docs`: "Use auth.protect() for server-side protection", "Conditional rendering with the Show component", "Authorization > Best Practices", and the verbatim **"Security Considerations"** caveat on `<Show />` (same caveat applies to `<Protect>`)
- `.planning/research/PITFALLS.md` §Pitfall 6 — `<Protect>` exposes data; canonical project reference. Phase 28 doc links to and summarizes this.
- `.planning/research/SUMMARY.md` §Critical Pitfalls #6 — pattern summary corroborating PITFALLS.md.
- `src/lib/auth.ts` (in-repo, JSDoc'd) — `requireRole`/`checkRole` reference behavior.
- `src/middleware.ts` (in-repo) — ACCESS-01 enforcement; do-not-touch baseline.
- `src/app/demo/customers/[id]/page.tsx` (in-repo) — canonical async RSC + parallel fetch pattern.
- `src/lib/auth.test.ts` (in-repo) — canonical test harness for redirect-sentinel-throw idiom.
- `package.json` — verified Next 16.1.6 / React 19.2.3 / Clerk @clerk/nextjs ^7.3.3.

### Secondary (MEDIUM confidence)
- ROADMAP.md §Phase 28 — success criteria source.
- CONTEXT.md D-01..D-10 — locked decisions driving scope.
- `src/app/demo/customers/page.test.tsx`, `src/app/demo/orders/__tests__/page.test.tsx` (in-repo) — current test shapes to be migrated.

### Tertiary (LOW confidence — flagged as assumed)
- Assumption A1 (Flight Date serialization) — verified empirically via existing `[id]/page.tsx` working in production, not via explicit Next 16 changelog citation.
- Assumption A2 (async-RSC-as-function unit testing) — no precedent in this repo; mitigation: fall back to E2E if unit harness proves flaky.

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — all versions verified from `package.json`; no new packages.
- **Architecture:** HIGH — canonical pattern already exists in `[id]/page.tsx`; Phase 28 generalizes it.
- **Pitfalls:** HIGH — Pitfalls 1-6 each have a verified anchor (PITFALLS.md, JSDoc, Clerk caveat).
- **Test migration scope:** MEDIUM — known to be non-trivial; flagged for planning.

**Research date:** 2026-05-11
**Valid until:** 2026-06-11 (30 days; stable stack, no fast-moving dependencies)
