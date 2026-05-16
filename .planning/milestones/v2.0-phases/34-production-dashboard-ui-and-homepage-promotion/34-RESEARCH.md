# Phase 34: Production Dashboard UI and Homepage Promotion - Research

**Researched:** 2026-05-14
**Domain:** Next.js 16 App Router + React 19 RSC, nuqs URL state, Radix Dialog, polling, Drizzle-backed dashboards
**Confidence:** HIGH (most decisions already locked in 34-CONTEXT.md + 34-UI-SPEC.md; this RESEARCH adds concrete library hooks, file paths, integration points, and risks)

---

## Summary

Phase 34 replaces the Phase 31 `MillReadOnlyStub` at `/` with a full DB-backed dashboard, adds a new `/import` route, and rewires `Sidebar` + `Header` for the production context. Almost every locked decision (D-01 through D-26 in 34-CONTEXT.md) has a concrete implementation pattern already present in the codebase — the dashboard composes existing primitives (`FilterPill`, `Card`, `Button`, `Textarea`, `DashboardLayout`, `StatusBadge`) and consumes the Phase 33 query/action layer (`getProductionOrders`, `getOrderById`, `getOrderEvents`, four transition actions, two import actions) without modifying their signatures. Three pieces are genuinely new: (a) the `nuqs` adapter wiring at `src/app/layout.tsx`, (b) the `@radix-ui/react-dialog` integration for the block-reason modal stacked on top of a slide-over drawer, and (c) the cross-phase patch to `src/actions/import.ts` adding `revalidateTag('import-batches')`.

**Primary recommendation:** Plan around five waves: Wave 0 = dependencies + adapter setup + `MillReadOnlyStub` retirement; Wave 1 = URL-state-aware client wrapper, polling hook, header strip with last-updated chip; Wave 2 = `ProductionCard` + `MillColumn` + `BlockedAlertBand` + per-column Suspense; Wave 3 = `ProductionDrawer` + `BlockReasonModal` + transition wiring; Wave 4 = `/import` route with drop zone + preview + commit + import-batches history. Plus a separate cross-phase patch task for the `revalidateTag('import-batches')` addition to `src/actions/import.ts`.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Build a new `ProductionDashboard` for `/`; leave `/demo/mill-production` and `MillProductionUI.tsx` untouched. No code sharing — visual contract only via UI-SPEC.md.

**D-02:** Phase 34 studies `MillProductionUI.tsx` as visual prior art only. Code intentionally diverged.

**D-03:** `FilterPill` and `StatusBadge` are reused as-is from `src/components/ui/`. `ProductionCard` is rebuilt for the DB shape.

**D-04:** `?status=Pending,Mixing` — comma-separated array literal via `nuqs` `parseAsArrayOf(parseAsStringLiteral(STATE_ORDER))`. Empty / missing = show all four. Unknown values dropped silently.

**D-05:** `?q=acme` — plain string. Empty / missing = no search. UI trims + lowercases the value before applying; URL preserves casing.

**D-06:** `?order=<id>` — single string. Presence opens drawer. Stale IDs render "Order not found" inside drawer; do NOT throw.

**D-07:** Search is client-side substring matching on customer name + product, applied after the status filter. No server-side `ILIKE`.

**D-08:** Right-side slide-over drawer. Width: 480px (locked in UI-SPEC.md). Outside-click / ESC / drawer-X all close + clear `?order=`. Board does NOT shrink — drawer overlays.

**D-09:** Drawer data fetched in the page RSC when `?order=` is present — `getOrderById(id)` + `getOrderEvents(id)` in parallel with orders list. Deep-link `/?order=ord_123` works on first paint.

**D-10:** All four transition action buttons live inside the drawer ONLY. Cards are click-targets only (open drawer); no inline transition controls on cards.

**D-11:** Complete is single-click, no confirm modal. Mistakes are recoverable via Block + Resume.

**D-12:** Resume is a split button: primary = Resume to Mixing; secondary = Resume to Pending. `resumeFromBlocked(orderId, version, toState)` already takes `toState`.

**D-13:** Block reason captured via modal dialog with required textarea. Click Block in drawer → modal opens stacked over drawer + backdrop. Confirm calls `blockOrder(orderId, version, reason)`. Empty textarea disables Confirm client-side; server still rejects empty.

**D-14:** Conflict UX: inline red banner inside drawer with locked message `"Order was modified by another user. Please refresh."` + auto-call `router.refresh()`.

**D-15:** Bulk import lives at dedicated `/import` route (full-page, not modal). Linked from header button + sidebar.

**D-16:** Import history table at bottom of `/import` page. Limit ~10 most recent. `revalidateTag('import-batches')` must be added to `commitImportAction` (D-21).

**D-17:** Client-side file-size guard (≤ 2MB, using `MAX_IMPORT_BYTES` from `src/lib/import-constants.ts`).

**D-18:** Per-row Skip/Overwrite radios default to Skip (carried from Phase 33 D-12). No batch "set all" toggle.

**D-19:** 30-second polling: `setInterval(() => router.refresh(), 30_000)` in client component. Named constant `REFRESH_INTERVAL_MS = 30_000`. Cleanup on unmount.

**D-20:** Last-updated chip + manual refresh in top-right of board header strip. Relative time, updates every 5s. Click refresh → `router.refresh()` + spinner overlay.

**D-21:** Phase-33 → Phase-34 contract gap: Phase 34 plan MUST add `revalidateTag('import-batches')` to `commitImportAction` in `src/actions/import.ts`. Recommended: patch `src/actions/import.ts` directly.

**D-22:** Sticky top-of-board blocked alert band. Hidden when zero blocked. Click entry → opens drawer for that order.

**D-23:** `<Suspense>` boundaries per `MillColumn`, not whole-page. Drawer also has its own `<Suspense>` boundary.

**D-24:** Production sidebar lists `Dashboard` (`/`) + `Import` (`/import`) only. "Coming Soon" item deleted. Demo branch unchanged.

**D-25:** `/` is auth-only. Any signed-in user views read-only; only `mill_operator` writes. Recommendation: drawer hides transition buttons when `canEdit === false`.

**D-26:** Phase 34's HUMAN-UAT.md MUST add a dedicated test entry titled `Inherited: GAP-02 revalidateTag end-to-end (from Phase 33)` per `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md`.

### Claude's Discretion

- Drawer width and visual placement of transition buttons → locked in UI-SPEC.md (480px).
- Exact location of the "Import Orders" header button → UI-SPEC.md (top-right of board header strip, beside refresh chip).
- Number of import-history rows shown on `/import` → 10 most recent (locked in UI-SPEC.md).
- Whether import drop zone supports drag-drop in addition to file picker → both (locked in UI-SPEC.md).
- Visual treatment for next-up indicator and in-progress badge → locked in UI-SPEC.md (teal "Next Up" pill, 8px pulse dot).
- Search debounce window → 150ms (locked in UI-SPEC.md).
- Whether to bundle the cross-action `revalidateTag('import-batches')` patch into `src/actions/import.ts` → recommended yes (D-21 option (a)).
- Whether `MillReadOnlyStub.tsx` is deleted now or only the import removed → recommend full delete after grep verification.
- `users` table lazy-sync (DATA-05) → recommend rendering Clerk user ID directly for v2.0.

### Deferred Ideas (OUT OF SCOPE)

- Optimistic UI on transitions (PROD-FUT-01) — v2.1+.
- "New orders available" banner triggered by polling diff (PROD-FUT-02) — v2.1+.
- Server-side search via DB `ILIKE`.
- Batch "set all duplicates to X" toggle in import preview.
- `users` table lazy-sync (DATA-05).
- Mill line reassignment UI.
- Drill-down into a batch's row-level outcomes from import history.
- i18n / translation of locked strings.
- KPI cards and metrics (KPI-01..KPI-08) — Phase 35.
- Drawer keyboard shortcuts (arrow keys); ESC is locked in D-08.
- Undo last transition (TRANS-FUT-01) — v2.1+.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | `/` route replaces Coming Soon with the production mill dashboard; async RSC with `export const dynamic = 'force-dynamic'` | Section 1 (`src/app/page.tsx` rewrite); Section 2 (RSC + force-dynamic pattern); Section 4 risks |
| PROD-02 | Three-column layout (Premix / Excel / CGM) from DB-backed orders, matching `mill-production.pen` | Section 2 (MillColumn pattern from MillProductionUI.tsx visual prior art); UI-SPEC.md surface 3 |
| PROD-03 | Status filter pills with multi-select; URL-synced via `nuqs` | Section 3 (nuqs `parseAsArrayOf(parseAsStringLiteral)` pattern); Section 1 (nuqs install) |
| PROD-04 | Search across customer name and product; URL-synced via `nuqs` | Section 3 (nuqs `parseAsString` with debounce); D-07 client-side filter |
| PROD-05 | Order details panel opens on row click; shows all fields + transition history from `order_events`; blocker note | Section 2 (`ProductionDrawer` shape); `src/db/queries/events.ts` already returns events DESC |
| PROD-06 | Blocked alert band aggregates all currently-blocked orders | Section 2 (`BlockedAlertBand` component); UI-SPEC surface 2 |
| PROD-07 | "Next-up" indicator highlights topmost Pending order in each column | Section 2 (`ProductionCard` `isNextUp` prop, derived from sorted position in column); UI-SPEC surface 4 |
| PROD-08 | In-progress badge appears on every Mixing order | Section 2 (`ProductionCard` `isInProgress` prop); UI-SPEC surface 4 (8px pulse dot) |
| PROD-09 | Polling at 30s via `setInterval(() => router.refresh(), 30_000)`; named constant | Section 3 (polling hook `useProductionPolling`); D-19 |
| PROD-10 | Loading skeleton and empty-state UI per status column | Section 2 (`ColumnSkeleton` per-column Suspense); D-23 |
| PROD-11 | Last-updated timestamp + manual refresh in header strip | Section 2 (`LastUpdatedChip` component); D-20; Section 3 (relative-time tick) |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth gate on `/` | Frontend Server (RSC) | API/Server actions | `auth()` in `src/app/page.tsx` redirects to `/sign-in`; mutating actions enforce `requireRole('mill_operator')` |
| Order list fetch | Frontend Server (RSC) | Database | `getProductionOrders()` is `unstable_cache`-wrapped; called from async RSC, never from browser |
| Drawer detail fetch | Frontend Server (RSC) | Database | `getOrderById(id)` + `getOrderEvents(id)` in parallel inside page RSC when `?order=` is present (D-09) |
| URL state (filter/search/order) | Browser/Client | Frontend Server (RSC for read) | `nuqs` `useQueryState` writes the URL from client; page RSC reads via `createSearchParamsCache.parse(searchParams)` |
| Client-side filter/search | Browser/Client | — | DB returns full list (≤ ~33 rows + low import volume); filter + substring match runs in client component (D-07) |
| Status transitions | API/Server actions | Database | Phase 33 server actions own DB writes + audit + cache invalidation |
| Block reason input | Browser/Client | API (`blockOrder`) | Required textarea modal collects free-text; server action validates non-empty |
| Polling refresh | Browser/Client | Frontend Server (RSC re-render) | `setInterval` calls `router.refresh()` → RSC re-runs → new data streams via Suspense |
| File upload + preview | Browser/Client | API (`previewImportAction`) | Drop zone collects file in browser; server action parses + validates |
| Import commit | API (`commitImportAction`) | Database | Per-row inserts/updates + `import_batches` audit + `revalidateTag('production-orders')` + `revalidateTag('import-batches')` (new) |
| Import history list | Frontend Server (RSC) | Database | New `getImportBatches({ limit })` query, `unstable_cache`-wrapped with tag `'import-batches'` |
| Sidebar context | Browser/Client | — | `usePathname()` already drives nav; just edit `productionNavItems` array |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `nuqs` | 2.8.9 | Type-safe URL state (`?status`, `?q`, `?order`) | Locked in 34-CONTEXT.md D-04..D-06; v2 supports Next.js 16 async `searchParams` via `createSearchParamsCache`. Verified latest version on npm 2.8.9 [VERIFIED: `npm view nuqs version`] |
| `@radix-ui/react-dialog` | 1.1.15 | Block-reason modal stacked over drawer | UI-SPEC locks Radix; verified latest 1.1.15 [VERIFIED: `npm view @radix-ui/react-dialog version`]. Already-recommended primitive in canonical_refs |
| `read-excel-file` | 9.0.9 | XLSX parsing (server-side) | Already installed; consumed by existing `previewImportAction` / `commitImportAction` |
| `zod` | 4.3.6 | Validation (textarea reason, file size) | Already installed; consumed inside transition + import actions |
| `lucide-react` | 0.577.0 | Icons (Upload, RotateCcw, LayoutDashboard, X, AlertCircle, Search, Loader2, etc.) | Already installed; consistent across project |

### Supporting (already installed — no install task needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@clerk/nextjs` | ^7.3.3 | `auth()` + `<UserButton>` | Already wired; page guard uses `auth()` to detect unauth session |
| `next` | 16.1.6 | `useRouter().refresh()`, `unstable_cache`, `revalidateTag('tag', 'max')`, `<Suspense>` | Already wired |
| `react` | 19.2.3 | `useActionState`, `useState`, `useEffect`, `useTransition` | Already wired |
| `drizzle-orm` | 0.45.2 | Query `import_batches` for history table | Already wired |
| `class-variance-authority` | ^0.7.1 | `cva` for button/card variants | Already wired (`Button`, `Card`) |
| `tailwind-merge` | ^3.5.0 | `cn()` utility | Already used in `src/lib/utils.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `nuqs` | Hand-rolled `useSearchParams` + `useRouter().replace(...)` | nuqs is locked by v2.0 STACK.md and CONTEXT.md D-04. Hand-rolled would re-implement parseAsArrayOf + parseAsStringLiteral safely — pure waste. |
| Radix Dialog | Headless UI `Dialog` | UI-SPEC.md locks Radix; Headless UI not installed. No reason to introduce a second a11y primitive library when Radix covers it. |
| `setInterval` polling | SSE / WebSocket / SWR `refetchInterval` | Locked in REQUIREMENTS.md "Out of Scope" + D-19. 30s setInterval matches mill operation cadence (cycles run minutes). |
| Drizzle relational query (`db.query.*`) | Plain `db.select()` joins | Phase 33 chose plain `db.select()` (PATTERNS.md D-86 carryover). Phase 34 follows the same — no `relations()` declarations needed. |

**Installation (Wave 0 task):**
```bash
npm install nuqs@2.8.9 @radix-ui/react-dialog@1.1.15
```

**Version verification:**
- `nuqs` 2.8.9 — verified via `npm view nuqs version` [VERIFIED: npm registry, queried 2026-05-14]
- `@radix-ui/react-dialog` 1.1.15 — verified via `npm view @radix-ui/react-dialog version` [VERIFIED: npm registry, queried 2026-05-14]

---

## Architecture Patterns

### System Architecture Diagram

```
                            ┌──────────────────────────┐
                            │ Browser (mill_operator)  │
                            └───────────┬──────────────┘
                                        │ HTTP GET /
                                        ▼
                    ┌──────────────────────────────────────┐
                    │ src/middleware.ts                    │
                    │ (auth.protect() for non-public)      │
                    └───────────┬──────────────────────────┘
                                │ session OK
                                ▼
              ┌─────────────────────────────────────────────────┐
              │ src/app/page.tsx  (async RSC, force-dynamic)    │
              │                                                 │
              │ 1. await auth()       ─► no userId → /sign-in   │
              │ 2. canEdit = await checkRole('mill_operator')   │
              │ 3. searchParamsCache.parse(searchParams)        │
              │    → status[], q, order                         │
              │ 4. Promise.all([                                │
              │      getProductionOrders(),    ── unstable_cache│
              │      order ? getOrderById(id) : null,           │
              │      order ? getOrderEvents(id) : null,         │
              │    ])                                           │
              │ 5. <DashboardLayout>                            │
              │      <ProductionDashboard                       │
              │        orders={orders}                          │
              │        canEdit={canEdit}                        │
              │        drawerOrder={order ?? null}              │
              │        drawerEvents={events ?? []}              │
              │      />                                         │
              │    </DashboardLayout>                           │
              └────────────────┬────────────────────────────────┘
                               │
                               ▼
        ┌─────────────────────────────────────────────────────┐
        │ ProductionDashboard.tsx  ('use client')             │
        │                                                     │
        │ ┌─ Header strip ─────────────────────────────────┐ │
        │ │ FilterPills (nuqs useQueryState 'status')      │ │
        │ │ Search (nuqs useQueryState 'q' + 150ms debounce)│ │
        │ │ ImportOrdersButton → router.push('/import')    │ │
        │ │ LastUpdatedChip + Refresh                       │ │
        │ └────────────────────────────────────────────────┘ │
        │                                                     │
        │ ┌─ BlockedAlertBand (sticky) ────────────────────┐ │
        │ │ Lists every Blocked order; click → set ?order= │ │
        │ └────────────────────────────────────────────────┘ │
        │                                                     │
        │ ┌─ Three columns (Suspense per column) ──────────┐ │
        │ │  MillColumn(Premix)  MillColumn(Excel)  ...    │ │
        │ │  ▶ Filter rows by status + search clientside    │ │
        │ │  ▶ Render ProductionCard with isNextUp / mixing │ │
        │ │  ▶ Click card → setOrder(id)                   │ │
        │ └────────────────────────────────────────────────┘ │
        │                                                     │
        │ ┌─ ProductionDrawer (rendered when ?order=) ─────┐ │
        │ │ Server-rendered fields + timeline + buttons    │ │
        │ │ TransitionButtons (client) inside              │ │
        │ │ BlockReasonModal (Radix Dialog) stacked above  │ │
        │ └────────────────────────────────────────────────┘ │
        │                                                     │
        │ useEffect: setInterval(router.refresh, 30_000)     │
        └─────────────────────────────────────────────────────┘
                               │
                  click button │ form action
                               ▼
        ┌─────────────────────────────────────────────────────┐
        │ Server actions  src/actions/transitions.ts +        │
        │                 src/actions/import.ts               │
        │                                                     │
        │ 1. await requireRole('mill_operator')               │
        │ 2. state-guard SELECT                                │
        │ 3. optimistic-concurrency UPDATE (returning)        │
        │ 4. INSERT order_events row                          │
        │ 5. revalidateTag('production-orders', 'max')        │
        │    (commitImportAction: also 'import-batches'  ← NEW)│
        │ 6. return { ok: true } | { ok: false, code, msg }   │
        └─────────────────────────────────────────────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │ Neon Postgres           │
                  │ (production_orders,     │
                  │  order_events,          │
                  │  import_batches)        │
                  └─────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # MODIFY: wrap children in <NuqsAdapter>
│   ├── page.tsx                    # REWRITE: async RSC with searchParams parsing
│   ├── page.test.tsx               # REWRITE: test the new RSC behavior
│   └── import/
│       ├── page.tsx                # NEW: async RSC for /import
│       └── __tests__/page.test.tsx # NEW: page tests
├── components/
│   ├── ProductionDashboard.tsx     # NEW: client wrapper (header, columns, drawer host)
│   ├── ProductionCard.tsx          # NEW: DB-typed card with click → ?order=
│   ├── MillColumn.tsx              # NEW: per-line column + Suspense
│   ├── ColumnSkeleton.tsx          # NEW: per-column loading skeleton
│   ├── ProductionDrawer.tsx        # NEW: server component, slide-over drawer
│   ├── DrawerSkeleton.tsx          # NEW: drawer loading skeleton
│   ├── TransitionButtons.tsx       # NEW: client child of drawer, owns action calls
│   ├── BlockReasonModal.tsx        # NEW: client modal (Radix Dialog)
│   ├── BlockedAlertBand.tsx        # NEW: sticky band above columns
│   ├── LastUpdatedChip.tsx         # NEW: relative-time + refresh
│   ├── ImportFlow.tsx              # NEW: drop zone + preview + commit
│   ├── ImportHistoryTable.tsx      # NEW: 10 most recent batches
│   ├── Sidebar.tsx                 # MODIFY: replace 'Coming Soon' with Dashboard + Import
│   ├── Header.tsx                  # MODIFY: add page titles for '/' and '/import'
│   └── MillReadOnlyStub.tsx        # DELETE (after grep verifies no other imports)
├── db/
│   └── queries/
│       └── imports.ts              # NEW: getImportBatches({ limit }), tag 'import-batches'
├── actions/
│   └── import.ts                   # MODIFY: add revalidateTag('import-batches') (D-21)
├── hooks/
│   └── useProductionPolling.ts     # NEW: setInterval(router.refresh, 30_000) hook
└── lib/
    └── search-params.ts            # NEW: createSearchParamsCache with status/q/order parsers
```

### Pattern 1: `nuqs` Server-Side Parse in RSC + Client-Side Hooks

**What:** Define a `createSearchParamsCache` once (in `src/lib/search-params.ts`); the page RSC awaits `searchParams` and calls `cache.parse(searchParams)`; client components use `useQueryState` / `useQueryStates` with the same parsers so URL ↔ state stays type-safe.

**When to use:** Every URL-synced piece of state (PROD-03 status, PROD-04 search, drawer `?order=`).

**Example:**
```typescript
// src/lib/search-params.ts
// Source: https://nuqs.dev/docs/server-side
import { createSearchParamsCache, parseAsArrayOf, parseAsStringLiteral, parseAsString } from 'nuqs/server';
import type { ProductionState } from '@/db/schema/orders';

export const STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const satisfies readonly ProductionState[];

export const searchParamsCache = createSearchParamsCache({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q:      parseAsString.withDefault(''),
  order:  parseAsString.withDefault(''),
});
```

```typescript
// src/app/page.tsx (rewritten)
// Source: https://nuqs.dev/docs/server-side, RESEARCH.md §6 (v2.0 STACK.md)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import { searchParamsCache } from '@/lib/search-params';
import { getProductionOrders } from '@/db/queries/orders';
import { getOrderById } from '@/db/queries/orders';
import { getOrderEvents } from '@/db/queries/events';
import DashboardLayout from '@/components/DashboardLayout';
import ProductionDashboard from '@/components/ProductionDashboard';
import type { SearchParams } from 'nuqs/server';

export const dynamic = 'force-dynamic'; // PROD-01

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const canEdit = await checkRole('mill_operator');
  const { status, q, order } = await searchParamsCache.parse(searchParams);

  const [orders, drawerOrder, drawerEvents] = await Promise.all([
    getProductionOrders(),
    order ? getOrderById(order) : Promise.resolve(null),
    order ? getOrderEvents(order) : Promise.resolve([]),
  ]);

  return (
    <DashboardLayout>
      <ProductionDashboard
        orders={orders}
        canEdit={canEdit}
        drawerOrder={drawerOrder}
        drawerEvents={drawerEvents}
        // status + q are NOT passed — client reads them via useQueryStates
      />
    </DashboardLayout>
  );
}
```

```typescript
// src/components/ProductionDashboard.tsx (client wrapper, abbreviated)
'use client';
import { useQueryStates, parseAsArrayOf, parseAsStringLiteral, parseAsString } from 'nuqs';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { STATE_ORDER } from '@/lib/search-params';

export const REFRESH_INTERVAL_MS = 30_000; // PROD-09, D-19

export default function ProductionDashboard({ orders, canEdit, drawerOrder, drawerEvents }) {
  const router = useRouter();
  const [{ status, q, order }, setQuery] = useQueryStates({
    status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
    q:      parseAsString.withDefault(''),
    order:  parseAsString.withDefault(''),
  });
  // ... filter logic, polling effect, render
}
```

### Pattern 2: Polling via `setInterval` + `router.refresh()`

**What:** A `useEffect` mounts a `setInterval` that calls `router.refresh()` every 30 seconds. Cleanup clears the interval on unmount. `force-dynamic` on the page ensures `router.refresh()` re-renders the RSC against the latest DB state.

**When to use:** PROD-09 dashboard polling.

**Example:**
```typescript
// src/hooks/useProductionPolling.ts
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const REFRESH_INTERVAL_MS = 30_000; // PROD-09 D-19 — exported for Phase 35 reuse

export function useProductionPolling(): void {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);
}
```

### Pattern 3: `useActionState` Wiring for Transition Buttons

**What:** Each transition button binds via `useActionState` to a server action. The pending state shows a `Loader2` spinner; on `{ ok: false, code: 'conflict' }` the drawer shows a red inline banner + auto-calls `router.refresh()` (D-14); on `{ ok: false, code: 'unauthorized' }` the action's `requireRole` already redirects via thrown `NEXT_REDIRECT`.

**When to use:** All four transition buttons inside `ProductionDrawer` / `TransitionButtons` (D-10).

**Example:**
```typescript
// src/components/TransitionButtons.tsx (client child of ProductionDrawer)
'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { transitionToMixing, completeOrder, resumeFromBlocked, type TransitionResult } from '@/actions/transitions';
import Button from '@/components/ui/Button';

export function StartMixingButton({ orderId, version }: { orderId: string; version: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => transitionToMixing(orderId, version),
    null
  );

  useEffect(() => {
    if (state?.ok === false && state.code === 'conflict') {
      router.refresh(); // D-14
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <Button variant="primary" loading={isPending} className="w-full">Start Mixing</Button>
      {state?.ok === false && state.code === 'conflict' && (
        <p className="mt-2 rounded border-l-4 border-[var(--error)] bg-[var(--error-light)] p-2 text-sm text-[var(--error-dark)]">
          {state.message}
        </p>
      )}
    </form>
  );
}
```

### Pattern 4: Radix Dialog (Block Reason) Stacked on Top of Drawer

**What:** `@radix-ui/react-dialog` portals the modal to `document.body` automatically, so it stacks on top of the drawer without z-index fighting. The drawer must use `event.stopPropagation()` on its own backdrop click handler so clicks inside the modal's portal don't bubble through to close the drawer.

**When to use:** Block-reason capture (D-13).

**Example:**
```typescript
// src/components/BlockReasonModal.tsx
'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { useActionState, useState } from 'react';
import { blockOrder, type TransitionResult } from '@/actions/transitions';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

export function BlockReasonModal({ orderId, version, open, onClose }: {
  orderId: string; version: number; open: boolean; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async () => {
      const result = await blockOrder(orderId, version, reason);
      if (result.ok) { onClose(); setReason(''); }
      return result;
    },
    null
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] rounded-[var(--radius-lg)] bg-[var(--bg-card)] p-6 shadow-lg">
          <Dialog.Title className="text-base font-bold text-[var(--text-primary)]">Block Order</Dialog.Title>
          <form action={formAction} className="mt-4 flex flex-col gap-4">
            <Textarea
              label="Reason (required)"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              error={state?.ok === false && state.code === 'validation' ? state.message : undefined}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={reason.trim().length === 0} loading={isPending}>
                Confirm Block
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Pattern 5: `getImportBatches` Cached Query + Cross-Phase `revalidateTag` Patch

**What:** New `src/db/queries/imports.ts` mirrors the `orders.ts` / `events.ts` cached-query pattern. The patch in `src/actions/import.ts` adds `revalidateTag('import-batches', 'max')` after the existing `revalidateTag('production-orders', 'max')` so the history table refreshes when a commit lands.

**When to use:** `/import` history table (D-16, D-21).

**Example:**
```typescript
// src/db/queries/imports.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { importBatches } from '@/db/schema/imports';
import { desc } from 'drizzle-orm';
import type { ImportBatch } from '@/db/schema/imports';

export const getImportBatches = unstable_cache(
  async ({ limit }: { limit: number }): Promise<ImportBatch[]> => {
    return db.select().from(importBatches).orderBy(desc(importBatches.importedAt)).limit(limit);
  },
  ['import-batches'],
  { tags: ['import-batches'] }
);
```

```diff
// src/actions/import.ts (commitImportAction tail) — D-21 patch
  try {
    revalidateTag('production-orders', 'max');
+   revalidateTag('import-batches', 'max');   // D-21: refresh /import history after commit
  } catch (revalErr) {
    console.error('[commitImportAction] revalidateTag failed:', revalErr);
  }
```

### Anti-Patterns to Avoid

- **Calling server queries from a client component.** `getProductionOrders` / `getOrderById` / `getOrderEvents` / `getImportBatches` are `server-only`. The client wrapper receives them as props from the RSC; it never imports them directly.
- **Putting transition buttons on cards.** D-10 locks them in the drawer. Cards open the drawer; that's it.
- **Calling `revalidateTag` from a client component.** The action layer owns invalidation. Phase 34 client components never import `revalidateTag`.
- **Adding `export const runtime = 'edge'` to any new file.** v2.0 PITFALLS.md forbids it for files touching the DB or `read-excel-file`.
- **Hand-rolling search debounce or URL parsing.** `useDebounce` (already in `src/hooks/`) handles 150ms; `nuqs` handles URL parsing. Both are locked.
- **Skipping the `MillReadOnlyStub` deletion.** Without grep-verifying no other imports remain, the build fails. The cleanup is a Wave 0 chore.
- **Reading `searchParams` directly without awaiting.** In Next.js 16, `searchParams` is a `Promise<SearchParams>`. Forgetting `await` causes silent type confusion.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state with type coercion + array/literal validation | Custom `useSearchParams` + `URLSearchParams` glue | `nuqs` `useQueryState` / `useQueryStates` + `parseAsArrayOf` + `parseAsStringLiteral` | Hand-rolled silently breaks on invalid array literals (e.g., `?status=BadValue`). `parseAsStringLiteral` drops unknowns automatically (D-04). |
| Accessible modal dialog (focus trap, ESC, portal, scroll lock) | Custom modal with `useState` + manual focus management | `@radix-ui/react-dialog` | Focus trap + ESC + portal + a11y are all WAI-ARIA-correct out of the box. Hand-rolled hides keyboard-trap bugs that surface in screenreader audits. |
| Server-render `searchParams` parsing across RSC + client | Pass `searchParams` props down + re-parse in client | `nuqs` `createSearchParamsCache` shared between RSC and client | Cache uses React's `cache()` to avoid double-parse and gives type-safe access in nested server components (see UI-SPEC source map). |
| Click-outside / ESC close for drawer | New `useClickOutside` variant | Existing `src/hooks/useClickOutside.ts` + ESC key listener | `useClickOutside` already lives in the project, with stale-closure-safe pattern. Reuse, don't fork. |
| Debounced search input | Custom timer | `useDebounce` from `src/hooks/useDebounce.ts` (already used by `Header`) | Already wired throughout codebase; 150ms feels right per UI-SPEC. |
| Relative time formatting ("Updated 12s ago") | String math | `Intl.RelativeTimeFormat` (built-in) with a 5s `setInterval` | Built-in, locale-aware, no library needed. |
| Polling | `useEffect` + interval scattered across components | One `useProductionPolling` hook | Single source of truth for `REFRESH_INTERVAL_MS`; Phase 35 KPI surfaces will reuse it. |

**Key insight:** Every major UI affordance in Phase 34 has either an existing project primitive (`FilterPill`, `Card`, `Button`, `Textarea`, `Timeline`, `DashboardLayout`, `useDebounce`, `useClickOutside`) or a battle-tested library (`nuqs`, `@radix-ui/react-dialog`). Re-implementing any of them is gratuitous risk.

---

## Common Pitfalls

### Pitfall 1: nuqs `NuqsAdapter` missing from `src/app/layout.tsx`

**What goes wrong:** `useQueryState` and `useQueryStates` throw `Error: nuqs requires an adapter to work with your framework` on the first client render.

**Why it happens:** v2.0 STACK.md and CONTEXT.md both prescribe the adapter but it has not yet been installed in `src/app/layout.tsx` — Phase 31 didn't need it.

**How to avoid:** Wave 0 first task — add `import { NuqsAdapter } from 'nuqs/adapters/next/app'` to `src/app/layout.tsx` and wrap `<ThemeProvider>` (or `<ClerkProvider>`, planner's call — both work; Clerk goes outermost is the safer convention).

**Warning signs:** First nuqs-using component throws on mount; runtime error in `next dev` logs.

### Pitfall 2: `searchParams` not awaited in RSC

**What goes wrong:** TypeScript narrows `searchParams` to the Promise type, but `searchParamsCache.parse(searchParamsPromise)` works on the resolved value. Forgetting `await` produces incorrect parser output (everything default).

**Why it happens:** Next.js 16 broke the API from Next.js 15 — `searchParams` was synchronous before, now it's a `Promise<SearchParams>`.

**How to avoid:** Type the page signature explicitly: `{ searchParams: Promise<SearchParams> }` from `'nuqs/server'`. Either `await searchParams` first then call `cache.parse(...)`, OR pass the Promise directly to `cache.parse(...)` which awaits internally (verify which is correct for nuqs 2.8.9 — per webfetch, the docs call `await searchParamsCache.parse(searchParams)` which suggests it does the await internally; this is the recommended pattern).

**Warning signs:** Hard reload doesn't restore filter state; integration tests pass with empty filters even when the URL contains values.

### Pitfall 3: `force-dynamic` + Suspense interaction

**What goes wrong:** With `export const dynamic = 'force-dynamic'`, the page is fully dynamic per-request — but Suspense still works for streaming. The risk is assuming Suspense gives stale data on `router.refresh()` — it doesn't, since `force-dynamic` re-fetches every render. The actual risk is that the page never reaches Suspended state for already-loaded data, so the column skeletons only appear on hard navigation and on `router.refresh()` triggered by polling.

**Why it happens:** Misunderstanding of Next.js 16's "everything dynamic by default" change.

**How to avoid:** Per-column Suspense boundaries serve two distinct purposes: (a) initial streaming when columns vary in fetch time (currently single query so all columns hydrate together — Suspense is a no-op here), and (b) showing the skeleton during `router.refresh()` re-renders. Verify (b) actually fires by adding a dev-only `setTimeout` in `getProductionOrders` and watching the skeletons appear on poll. Document the verification in the plan.

**Warning signs:** Skeletons never appear in `next dev`; UI feels "stuck" during refresh without visual indication.

### Pitfall 4: Drawer outside-click closing on modal click

**What goes wrong:** When `BlockReasonModal` opens on top of `ProductionDrawer`, clicking inside the modal can bubble through to the drawer's `useClickOutside` listener (which is attached to `document`), closing the drawer underneath.

**Why it happens:** Radix Dialog portals to `document.body`, which is outside the drawer's `ref` subtree. The drawer's `useClickOutside` then considers any click outside the drawer (including inside the modal portal) as "outside" — fires the close handler.

**How to avoid:** Two options: (a) use Radix Dialog's `modal={true}` (default) — Radix's overlay captures all pointer events, but the drawer's `useClickOutside` still fires on `mousedown` which runs before Dialog's pointer events. Better: (b) gate the drawer's `useClickOutside` with a state flag — `if (modalOpen) return;` early-out inside the handler, OR replace `useClickOutside` with a click handler bound to the drawer's backdrop element directly (not document-level). Recommend (b) — bind the backdrop click only to the drawer's own backdrop element, not document.

**Warning signs:** Block-reason modal closes the drawer when clicked; operator loses context after Cancel.

### Pitfall 5: Sidebar prefix-match collision between `/` and `/import`

**What goes wrong:** The current `isActive('/', pathname)` correctly returns `pathname === '/'` (exact match). Adding `/import` later, the active-state on `/import` correctly highlights the Import nav item. But on `/import?...` (with query string), `pathname` is still `/import` — no problem. The actual risk: someone "fixes" the helper to also prefix-match `'/'` and breaks every other route.

**Why it happens:** Future contributor sees `pathname.startsWith(href)` for `/import` and "harmonizes" `/` to the same — and now `/` matches `/anything`.

**How to avoid:** Add a unit test in `Sidebar.test.tsx` asserting `isActive('/', '/import')` returns `false` so the regression is caught by CI. Document in the helper's JSDoc that `/` is special-cased.

**Warning signs:** Test suite has no coverage of the helper edge case; any future "cleanup" PR drops the guard.

### Pitfall 6: `weight_lbs` rendered without `parseFloat`

**What goes wrong:** `productionOrders.weight_lbs` is Drizzle `numeric(10, 2)` which infers to TypeScript `string` (CR-01 contract). Card rendering: `{order.weightLbs.toLocaleString()}` works on strings but `String.prototype.toLocaleString()` returns the locale-formatted *string itself*, not a comma-grouped number. Result: card shows "6000" instead of "6,000".

**Why it happens:** UI engineer assumes numeric column = JS number; doesn't read CR-01 JSDoc.

**How to avoid:** Adopt a helper inside the card: `formatWeight(weightLbs: string): string { return Number(weightLbs).toLocaleString(); }`. The existing `MillProductionUI.tsx` `formatWeight()` works because `DemoOrder.weightLbs` is `number`. Phase 34's `ProductionCard` operates on `ProductionOrder.weightLbs: string` and must convert.

**Warning signs:** Card weight reads literally as digits ("6000" not "6,000"). Easy to miss in PR if seed data has no values ≥ 1000.

### Pitfall 7: `?order=<stale-id>` rendering

**What goes wrong:** After a transition that hard-completes an order, or if the order is later deleted, the URL might still carry `?order=<gone-id>`. `getOrderById(id)` returns `null`. The drawer must render an empty state, NOT throw.

**Why it happens:** Default branch assumes order is always present; new contributor writes `<DrawerContent order={drawerOrder!} />` and a non-null assertion bites at runtime.

**How to avoid:** Pass `drawerOrder: ProductionOrder | null` and branch in `ProductionDrawer`. UI-SPEC.md surface 5 already documents the "Order not found" state — 14px `--text-secondary`, centered, with a Close ghost button.

**Warning signs:** Bookmarked drawer URL throws on first paint after the order is removed.

### Pitfall 8: Forgetting the `revalidateTag('import-batches')` patch

**What goes wrong:** Without D-21's patch, the import history table on `/import` does NOT refresh after a commit. Operator commits a file, sees the success state, navigates back — but the history table still shows the pre-commit state until a hard refresh.

**Why it happens:** Cross-phase contract gap (D-21). Easy to forget because Phase 33's `commitImportAction` already calls `revalidateTag('production-orders')` and "looks done."

**How to avoid:** Make D-21 its own discrete task in the plan, not folded into another. Add a unit test in `src/actions/__tests__/import.test.ts` asserting both tags are invalidated.

**Warning signs:** UAT step "import a file, observe history table updates" fails silently with no error message.

### Pitfall 9: Polling interval running in the background tab

**What goes wrong:** Browser tabs throttle `setInterval` when the tab is backgrounded. The polling interval extends to ~1 minute when the tab is hidden, then snaps back when visible. This is correct behavior but may surprise operators ("I clicked refresh and it took ages").

**Why it happens:** Browser power-saving (Chrome / Firefox throttle background timers).

**How to avoid:** Document the behavior in the plan ("polling pauses when tab is hidden — by design"). If undesired, add a `document.addEventListener('visibilitychange', ...)` listener that triggers an immediate refresh on tab focus. Optional polish; recommend deferring.

**Warning signs:** Operator reports stale data after tab-switch; not actually a bug.

### Pitfall 10: `useActionState` form action vs direct invocation

**What goes wrong:** `useActionState`'s first arg is `(prevState, formData) => Promise<ResultState>`. The transition actions take `(orderId: string, version: number)`, not `FormData`. Wrapping them naively produces a type mismatch.

**Why it happens:** `useActionState` is designed for form-bound actions; transition buttons don't carry form data, they carry pre-bound IDs.

**How to avoid:** Wrap the action in a closure: `async (_prev) => transitionToMixing(orderId, version)` — passes prevState through, takes no FormData, returns the `TransitionResult`. Or use a hidden `<input>` to thread IDs through FormData. Recommend the closure approach for clarity.

**Warning signs:** TypeScript errors on `useActionState<TransitionResult, FormData>(...)`; runtime "Cannot read property 'get' of null" when reading FormData.

### Pitfall 11: `?status=` array literal — empty string vs missing key

**What goes wrong:** `?status=` (empty value) deserializes as `[]` or `['']` depending on parser; missing `?status` key entirely deserializes via `.withDefault([])`. The empty-array case must be "show all four states," not "show no orders."

**Why it happens:** Subtle UX bug at the empty-filter edge.

**How to avoid:** In the client component, treat `status.length === 0` as "no filter (show all)." Filter: `if (status.length === 0) return order; return status.includes(order.state);`. Matches the existing `MillProductionUI.tsx` empty-set semantic ("if activeStates.size === 0 return orders").

**Warning signs:** Empty page on first load — common false-positive in QA.

---

## Code Examples

Verified patterns from official sources and existing repository code.

### Server-side searchParams parse (Next.js 16 + nuqs)
```typescript
// Source: https://nuqs.dev/docs/server-side, verified 2026-05-14
// File: src/app/page.tsx (excerpt)
import type { SearchParams } from 'nuqs/server';

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const { status, q, order } = await searchParamsCache.parse(searchParams);
  // ...
}
```

### Client-side query state (`nuqs` v2.8.9)
```typescript
// Source: https://nuqs.dev/docs/parsers/built-in, verified 2026-05-14
'use client';
import { useQueryStates, parseAsArrayOf, parseAsStringLiteral, parseAsString } from 'nuqs';

const STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const;

const [{ status, q, order }, setQuery] = useQueryStates({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q:      parseAsString.withDefault(''),
  order:  parseAsString.withDefault(''),
});

// Toggle a status pill:
const toggleStatus = (s: typeof STATE_ORDER[number]) =>
  setQuery({ status: status.includes(s) ? status.filter(x => x !== s) : [...status, s] });
```

### Radix Dialog modal (Block reason)
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog, verified 2026-05-14
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={open} onOpenChange={onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 ...">
      <Dialog.Title>Block Order</Dialog.Title>
      {/* form */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Polling hook
```typescript
// Source: REQUIREMENTS.md PROD-09 + CONTEXT.md D-19; verified pattern from React 19 docs
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const REFRESH_INTERVAL_MS = 30_000;

export function useProductionPolling(): void {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);
}
```

### Existing patterns to reuse
- `src/components/MillProductionUI.tsx` — `MillColumn`, `StateSection`, `PRODUCTION_STATE_PILL_CONFIG`, `STATE_COLORS` (visual prior art only; not imported)
- `src/components/ui/FilterPill.tsx` — multi-select pill (reused as-is)
- `src/components/ui/StatusBadge.tsx` — status pill (reused as-is)
- `src/components/ui/Button.tsx` — `variant`, `size`, `loading`, `icon` props (used for all transition buttons)
- `src/components/ui/Textarea.tsx` — has built-in `error` prop with `aria-invalid` + `AlertCircle` icon (used by `BlockReasonModal`)
- `src/components/ui/Card.tsx` — `variant="elevated"` for columns; `onClick` handler with `role="button"` + keyboard support
- `src/components/ui/skeletons/DetailsSkeleton.tsx` — template for `DrawerSkeleton`
- `src/hooks/useDebounce.ts` — used by Header search; reuse for the dashboard search input (150ms)
- `src/hooks/useClickOutside.ts` — for drawer backdrop click; note Pitfall 4
- `src/db/queries/orders.ts` — `getProductionOrders` + `getOrderById` (consumed as-is)
- `src/db/queries/events.ts` — `getOrderEvents` (consumed as-is, returns DESC by `changedAt`)
- `src/actions/transitions.ts` — four named transitions, return `TransitionResult` discriminated union (consumed as-is)
- `src/actions/import.ts` — `previewImportAction`, `commitImportAction` (consumed; commit gets D-21 patch)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as plain object | `searchParams: Promise<SearchParams>` (async) | Next.js 15 (Oct 2024), enforced in 16 | RSC pages MUST `await searchParams` or use a cache. Hand-rolled URL parsing in RSC breaks. |
| Static-by-default fetches | Dynamic-by-default | Next.js 16 (Nov 2025) | `export const dynamic = 'force-dynamic'` documents intent; behavior is the default for routes that use `cookies()`, `headers()`, or `auth()`. |
| `revalidateTag(tag)` (single-arg) | `revalidateTag(tag, 'max')` (two-arg) | Next.js 16 | Phase 33 already uses the two-arg form throughout `src/actions/`. Phase 34 follows. |
| `useState` for URL-synced filter state | `useQueryState` / `useQueryStates` via `nuqs` | Adopted in v2.0 STACK.md | Filters survive hard reload, share via URL, deep-link drawer. |
| `useFormState` / `useFormStatus` (React 18) | `useActionState` (React 19) | React 19 (Dec 2024) | `useFormState` is deprecated. Use `useActionState`. |
| Hand-rolled modal with portal + focus trap | Radix Dialog | Industry standard | Accessibility, focus management, ESC, scroll lock — all built-in. |
| `xlsx` (SheetJS) on npm | `read-excel-file` 9.0.9 | Locked in STACK.md (npm version of `xlsx` has unpatched CVE) | Phase 33 already uses `read-excel-file/node` via `readSheet` (schema-aware) — Phase 34 doesn't touch parsing. |

**Deprecated/outdated:**
- `useFormState` from `react-dom` — replaced by `useActionState` from `react`.
- `next-usequerystate` — renamed to `nuqs` (same author/package).
- Synchronous `searchParams` — incompatible with Next.js 16.
- `xlsx` (SheetJS) npm — CVE-2023-30533 unpatched; do NOT introduce.
- `MillReadOnlyStub` — Phase 31 placeholder; delete in Phase 34 (D-25 carry).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `nuqs` 2.8.9 works with Next.js 16.1.6 + React 19.2.3 without runtime warnings | Standard Stack | If incompatibility surfaces, Wave 0 must verify via a quick smoke test. STACK.md research (v2.0) and webfetch from nuqs.dev (Section 1) both report compatibility with `next@>=14.2.0` and `react@^18.3 || ^19`. [CITED: nuqs.dev/docs/installation] |
| A2 | Radix Dialog's portal-to-`document.body` prevents Z-index fighting with the drawer | Pitfall 4 | If z-index still fights (drawer renders above modal), need explicit `z-50` on modal `Overlay` + `Content` (already in example). Verify in Wave 3 hands-on testing. [CITED: radix-ui.com/primitives/docs/components/dialog] |
| A3 | `force-dynamic` allows per-column Suspense to fire during `router.refresh()` | Pitfall 3 | If Suspense never fires (Next.js de-duplicates the cached query), per-column skeletons are dead code on poll. Mitigation: skeletons still appear on hard navigation and initial deep-link. Verify in Wave 2 by adding a dev-only `await new Promise(r => setTimeout(r, 1000))` inside `getProductionOrders`. [ASSUMED] |
| A4 | `useActionState` Promise return is compatible with binding to a `<form action={formAction}>` when the action takes no FormData | Pattern 3 + Pitfall 10 | If React 19 requires FormData-shaped first-arg for form binding, the transition buttons must use a different binding style (e.g., onClick handler that calls `startTransition` + action). Workaround documented in Pitfall 10. [ASSUMED based on React 19 docs at react.dev/reference/react/useActionState] |
| A5 | Existing `useClickOutside` is the right primitive for drawer outside-click — combined with explicit ESC handler | Pattern 5 | If `useClickOutside` fires inappropriately when modal is open, use a state flag (Pitfall 4 workaround). Alternative: bind a click handler to the drawer's own backdrop div, not document. [VERIFIED: src/hooks/useClickOutside.ts] |
| A6 | Adding `NuqsAdapter` outside `ClerkProvider` (or inside — both work) does not break Clerk's session context | Pitfall 1 | If interaction surfaces, wrap nuqs adapter directly inside `<body>` and put Clerk inside it. Webfetch from nuqs docs shows the adapter wrapping `{children}` immediately. [CITED: nuqs.dev/docs/adapters] |
| A7 | `getImportBatches` cached with tag `'import-batches'` re-fetches after `revalidateTag('import-batches', 'max')` in the patched `commitImportAction` | Pattern 5 + D-21 | Standard `unstable_cache` semantic (verified by Phase 33's GAP-02 closure pattern). If broken, the history table fails to update on commit — same diagnosis path as GAP-02. [VERIFIED: Phase 33 patterns + 34-INHERITED-UAT.md] |

**If this table is empty:** Not empty — A3 and A4 are flagged as ASSUMED and need Wave 2/3 verification gates in the plan.

---

## Open Questions (RESOLVED)

1. **`useActionState` form binding vs `useTransition` direct call** — should transition buttons use `useActionState` + `<form action>` (idiomatic) or `useTransition` + onClick (more direct for non-form actions)?
   - What we know: Phase 33's `TransitionResult` returns a discriminated union; `useActionState` handles pending + result state.
   - What's unclear: Whether `useActionState` cleanly binds to a Promise-returning action that takes no FormData. UI-SPEC examples and code patterns suggest yes via the closure wrapper (Pattern 3 / Pitfall 10).
   - Recommendation: Use `useActionState` with a closure wrapper. If issues surface during Wave 3, fall back to `useTransition` + onClick + manual error state.
   - **RESOLVED:** Use `useActionState<TransitionResult | null, FormData>` with the closure-wrapping pattern (Pitfall 10). **No fallback** is planned in Phase 34. If the pattern surfaces issues during Wave 3, the regression is filed as a follow-up `GAP-` item and addressed in a gap-closure plan rather than mid-wave fallback.

2. **Polling pause on hidden tab** — should the polling hook respect `document.visibilityState === 'hidden'` and pause / resume on focus, or accept browser throttling?
   - What we know: Browsers throttle background timers; operators may see stale data on tab-switch.
   - What's unclear: Whether mill operators run the dashboard backgrounded enough to warrant the extra code.
   - Recommendation: Accept default browser behavior in v2.0. Add `visibilitychange` listener in v2.1 if operator feedback requests it.
   - **RESOLVED:** Accept default browser behavior — `setInterval` continues running when the tab is hidden (subject to browser throttling). Visibility-API gating is deferred to a future phase and recorded as a backlog item, not in Phase 34.

3. **`unstable_cache` warning in Next.js 16** — Next.js 16 stabilized many APIs; check whether `unstable_cache` is renamed or replaced.
   - What we know: Phase 33 uses `unstable_cache` extensively and `revalidateTag(tag, 'max')` (two-arg form).
   - What's unclear: Whether the API is fully stable in 16.1.6 or emits deprecation warnings.
   - Recommendation: Run `next build` after Wave 0 and search the build log for `unstable_cache` warnings. Surface in the plan; do not block Phase 34 on rename — Phase 33 already shipped against this API.
   - **RESOLVED:** Use `unstable_cache` for Phase 34 (matches Phase 33's API surface; no migration in scope). If `next build` emits the documented deprecation warning, two options apply in a follow-up phase: (a) suppress via the Next.js-documented workaround, or (b) migrate to the new `'use cache'` directive. Neither is in Phase 34 scope. The 34-07 verification step records any warnings observed in `34-07-SUMMARY.md`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js dev/build | ✓ | (per Next.js 16.1.6 requirement) | — |
| npm | Package install | ✓ | (per project lockfile) | — |
| Neon Postgres | Live DB queries | ✓ | provisioned in Phase 31 | — |
| `DATABASE_URL` (pooled) | RSC query layer | ✓ | in `.env.local` per Phase 31 | — |
| Seed data (33 rows) | UAT + visual verification | ✓ | seeded in Phase 32 | re-run `npm run db:seed` if missing |
| Clerk `mill_operator` test user | UAT for edit-mode + GAP-02 | ✓ | configured in Phase 31 | — |
| Clerk Dashboard JWT template | `roles` array in session | ✓ (per STATE.md, awaiting manual cutover confirmation) | — | manual operator step; not Phase 34's gate |
| Playwright auth-mill-operator project | E2E smoke | ✓ | exists (Phase 31 plan 31-03) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

**To install (Wave 0):**
- `nuqs@2.8.9`
- `@radix-ui/react-dialog@1.1.15`

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 (jsdom environment) + Playwright 1.59.1 |
| Config files | `jest.config.ts`, `jest.setup.ts`, `playwright.config.ts` |
| Quick run command | `npm test -- --testPathPattern=<pattern>` |
| Full suite command | `npm test` (Jest) + `npm run test:e2e` (Playwright) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROD-01 | RSC renders DB data; unauth → /sign-in | unit (Jest RSC) + Playwright auth-mill-operator | `npm test -- src/app/__tests__/page.test.tsx` + `npm run test:e2e` | ✅ existing page.test.tsx must be rewritten; Playwright project exists |
| PROD-02 | Three-column layout (Premix/Excel/CGM) | unit (RTL) | `npm test -- ProductionDashboard.test.tsx` | ❌ Wave 0 — new file |
| PROD-03 | Status filter pills URL-synced via nuqs | unit (RTL + jsdom URL assertion) | `npm test -- ProductionDashboard.test.tsx -t "status filter"` | ❌ Wave 0 |
| PROD-03 | Status filter parses comma-separated array literal | TDD-eligible unit (pure parser test) | `npm test -- search-params.test.ts` | ❌ Wave 0 — TDD red/green |
| PROD-04 | Search URL-synced (`?q=`) + client-side substring match | TDD-eligible unit (pure filter test) | `npm test -- filterOrders.test.ts` | ❌ Wave 0 — TDD red/green |
| PROD-04 | Search debounce 150ms | unit (with `jest.useFakeTimers`) | `npm test -- ProductionDashboard.test.tsx -t "search debounce"` | ❌ Wave 0 |
| PROD-05 | Drawer opens on card click; shows fields + timeline | unit (RTL) + Playwright | `npm test -- ProductionDrawer.test.tsx` | ❌ Wave 0 |
| PROD-06 | Blocked alert band renders Blocked orders; hidden when 0 | unit (RTL) | `npm test -- BlockedAlertBand.test.tsx` | ❌ Wave 0 |
| PROD-07 | Next-up indicator on topmost Pending per column | TDD-eligible unit (pure sort/group test) | `npm test -- MillColumn.test.tsx -t "next-up"` | ❌ Wave 0 — TDD red/green |
| PROD-08 | In-progress badge on every Mixing order | unit (RTL) | `npm test -- ProductionCard.test.tsx -t "in-progress"` | ❌ Wave 0 |
| PROD-09 | Polling at 30s via setInterval+router.refresh | TDD-eligible unit (fake timers) | `npm test -- useProductionPolling.test.ts` | ❌ Wave 0 — TDD red/green |
| PROD-10 | Loading skeleton per column | unit (RTL `<Suspense>` snapshot) | `npm test -- ColumnSkeleton.test.tsx` | ❌ Wave 0 |
| PROD-11 | Last-updated chip + manual refresh | unit (fake timers) | `npm test -- LastUpdatedChip.test.tsx` | ❌ Wave 0 |
| Sidebar nav | Production nav shows Dashboard + Import; hidden 'Coming Soon' | unit (RTL) | `npm test -- Sidebar.test.tsx` | ✅ exists; add cases |
| D-21 | `commitImportAction` calls revalidateTag('import-batches') | unit (jest.mock revalidateTag) | `npm test -- src/actions/__tests__/import.test.ts` | ✅ exists; add case |
| Inherited GAP-02 | revalidateTag end-to-end observation across two tabs | Playwright (manual UAT) | recorded in `34-HUMAN-UAT.md` | manual |

### TDD-eligible vs non-TDD

**TDD-eligible (red/green per task):**
- `src/lib/search-params.ts` parsers — pure functions; `parseAsArrayOf(parseAsStringLiteral)` round-trip
- `src/components/__tests__/filterOrders.test.ts` (extracted pure filter from `ProductionDashboard`) — input/output array filter
- `src/components/__tests__/MillColumn.test.tsx` — `groupByStateWithNextUp(orders)` pure derivation
- `src/hooks/useProductionPolling.test.ts` — `jest.useFakeTimers()`; assert `router.refresh` called every 30s

**NOT TDD-eligible (use UI-SPEC.md as the contract):**
- Visual rendering of `ProductionCard`, `BlockedAlertBand`, drawer animation — assert structure + ARIA, not pixels
- `<Suspense>` skeleton appearance — assert presence on initial render only
- Hover/focus/active interactions — covered by `Button` / `Card` primitive tests already

**Integration-test style (no red/green, but unit-level):**
- `src/app/__tests__/page.test.tsx` — RSC unit test with mocked queries + `searchParams` Promise
- `src/actions/__tests__/import.test.ts` D-21 case — assert both `revalidateTag` calls

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=<task-specific>`
- **Per wave merge:** `npm test` (full Jest suite)
- **Phase gate:** Full `npm test` green + Playwright `mill-operator-smoke.spec.ts` green + manual UAT entries in `34-HUMAN-UAT.md` (including Inherited GAP-02)

### Wave 0 Gaps
- [ ] `npm install nuqs@2.8.9 @radix-ui/react-dialog@1.1.15`
- [ ] `src/lib/search-params.ts` — shared `createSearchParamsCache` + `STATE_ORDER` constant
- [ ] `src/lib/search-params.test.ts` — TDD red/green for parsers
- [ ] `src/app/layout.tsx` — add `<NuqsAdapter>` wrapper
- [ ] Verify `MillReadOnlyStub` has no other imports (`grep -rn MillReadOnlyStub src/`); delete it + its test if any
- [ ] Update `src/app/page.test.tsx` mocks to include `nuqs/server` (or migrate test setup)
- [ ] Add a header-strip page-title entry: `getPageTitle('/')` → `'Dashboard'`, `getPageTitle('/import')` → `'Import'` (in `src/components/Header.tsx`)

---

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` found at the project root. Project-specific guardrails are sourced from:

- `.planning/STATE.md` — v2.0 implementation invariants (cache tag, `revalidateTag` mutation invariant, polling cadence, sidebar nav condition, `force-dynamic` scoping).
- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase components, camelCase variables), 2-space indentation, named-export-per-file, design tokens via CSS custom properties.
- `.planning/codebase/STACK.md` — Tailwind v4 + lucide-react conventions.
- `.planning/research/v2.0/PITFALLS.md` — no `export const runtime = 'edge'` for files touching the DB or `read-excel-file`.
- `docs/security-patterns.md` §2 — inner-guard pattern (server actions enforce `requireRole`; pages enforce auth via `auth()` + redirect).

**Treat these with locked-decision authority.** Research and planning recommendations do not contradict any of them.

---

## Sources

### Primary (HIGH confidence)
- `src/app/page.tsx`, `src/components/MillProductionUI.tsx`, `src/components/MillReadOnlyStub.tsx`, `src/components/Sidebar.tsx`, `src/components/DashboardLayout.tsx`, `src/components/Header.tsx`, `src/components/ui/*.tsx`, `src/hooks/*.ts` — existing repository patterns
- `src/db/queries/orders.ts`, `src/db/queries/events.ts`, `src/db/schema/orders.ts`, `src/db/schema/events.ts`, `src/db/schema/imports.ts` — Phase 32/33 contracts
- `src/actions/transitions.ts`, `src/actions/import.ts`, `src/lib/auth.ts`, `src/lib/import-constants.ts` — Phase 33 server actions
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-CONTEXT.md` — locked decisions D-01..D-26
- `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-UI-SPEC.md` — UI design contract (480px drawer, copywriting, color tokens)
- `.planning/phases/33-server-actions-queries-and-bulk-import/34-INHERITED-UAT.md` — GAP-02 inherited UAT contract
- `.planning/phases/33-server-actions-queries-and-bulk-import/33-PATTERNS.md` — `revalidateTag(tag, 'max')` two-arg form, action structure
- `.planning/research/v2.0/STACK.md` — `nuqs` 2.8.9 install + `NuqsAdapter` pattern + `createSearchParamsCache` rationale
- `.planning/STATE.md` — v2.0 implementation invariants
- `npm view nuqs version` — 2.8.9 (verified 2026-05-14)
- `npm view @radix-ui/react-dialog version` — 1.1.15 (verified 2026-05-14)

### Secondary (MEDIUM confidence)
- [nuqs.dev — Server-side parsing](https://nuqs.dev/docs/server-side) — `createSearchParamsCache.parse(searchParams)` pattern
- [nuqs.dev — Adapters](https://nuqs.dev/docs/adapters) — `NuqsAdapter` placement in root layout
- [nuqs.dev — Installation](https://nuqs.dev/docs/installation) — `next@>=14.2.0`, `react@^18.3 || ^19`
- [nuqs.dev — Built-in parsers](https://nuqs.dev/docs/parsers/built-in) — `parseAsStringLiteral` + `parseAsArrayOf` signatures
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) — Dialog + Portal + z-index notes
- [Next.js useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router) — `router.refresh()` semantic

### Tertiary (LOW confidence — flagged for validation in Wave 0/2/3)
- React 19 `useActionState` form binding with non-FormData actions — works via closure wrapper but exact binding pattern is ASSUMED A4
- `force-dynamic` + `<Suspense>` interaction on `router.refresh()` — ASSUMED A3; verify with dev-only delay in Wave 2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry; library choices locked by 34-CONTEXT.md + 34-UI-SPEC.md + v2.0 STACK.md
- Architecture: HIGH — RSC + client-wrapper pattern reused from Phase 31; Phase 33 query/action contracts unchanged
- URL state: HIGH — `nuqs` adapter + `createSearchParamsCache` documented and verified
- Drawer + Modal: MEDIUM — Radix Dialog usage straightforward; outside-click interaction with drawer flagged as Pitfall 4
- Polling: HIGH — pattern verified against React 19 useEffect cleanup
- TDD eligibility: HIGH — pure functions (parsers, filters, group-by-state) clearly demarcated
- Cross-phase D-21 patch: HIGH — pattern mirrors Phase 33's existing `revalidateTag` call

**Research date:** 2026-05-14
**Valid until:** 2026-06-13 (30 days; stack is stable, no migrations expected)
