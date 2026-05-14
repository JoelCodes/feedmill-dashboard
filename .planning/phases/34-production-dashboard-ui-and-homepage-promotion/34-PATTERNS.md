# Phase 34: Production Dashboard UI and Homepage Promotion - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 21 new/modified files
**Analogs found:** 19 / 21

This map assigns each new or modified file in Phase 34 to its closest existing analog in the codebase, with concrete excerpts to copy. The planner consumes this map and pastes the excerpts directly into per-plan action sections.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/layout.tsx` (MODIFY) | layout (RSC) | request-response | self (current) | exact (extend) |
| `src/app/page.tsx` (REWRITE) | page (async RSC) | request-response | `src/app/demo/mill-production/page.tsx` | exact |
| `src/app/page.test.tsx` (REWRITE) | test (RSC) | request-response | `src/app/page.test.tsx` (current) | exact |
| `src/app/import/page.tsx` (NEW) | page (async RSC) | request-response + file-I/O | `src/app/demo/mill-production/page.tsx` + `src/app/page.tsx` | exact |
| `src/app/import/__tests__/page.test.tsx` (NEW) | test (RSC) | request-response | `src/app/page.test.tsx` | role-match |
| `src/components/ProductionDashboard.tsx` (NEW) | component (client wrapper) | request-response + event-driven (polling) | `src/components/MillProductionUI.tsx` | exact |
| `src/components/MillColumn.tsx` (NEW) | component (RSC/client) | transform (filter/group) | `MillColumn` block in `MillProductionUI.tsx` lines 132-179 | exact |
| `src/components/ColumnSkeleton.tsx` (NEW) | component (skeleton) | static | `src/components/ui/skeletons/DetailsSkeleton.tsx` | role-match |
| `src/components/ProductionCard.tsx` (NEW) | component (interactive card) | event-driven (click) | `ProductionCard` block in `MillProductionUI.tsx` lines 74-99 | exact (different type) |
| `src/components/ProductionDrawer.tsx` (NEW) | component (server) | request-response | `src/components/OrderDetails.tsx` | role-match |
| `src/components/DrawerSkeleton.tsx` (NEW) | component (skeleton) | static | `src/components/ui/skeletons/DetailsSkeleton.tsx` | exact |
| `src/components/TransitionButtons.tsx` (NEW) | component (client) | request-response (server action) | (none — new pattern: useActionState on transition actions) | no analog |
| `src/components/BlockReasonModal.tsx` (NEW) | component (client modal) | event-driven + request-response | `src/components/NotificationDropdown.tsx` (overlay/portal pattern) | partial (no Radix yet) |
| `src/components/BlockedAlertBand.tsx` (NEW) | component (client) | transform | filter-strip section in `MillProductionUI.tsx` lines 241-253 | role-match |
| `src/components/LastUpdatedChip.tsx` (NEW) | component (client) | event-driven (timer) | `formatTimestamp` in `NotificationDropdown.tsx` lines 42-53 | partial |
| `src/components/ImportFlow.tsx` (NEW) | component (client wrapper) | file-I/O + request-response | (none — bulk-XLSX flow is new) | no analog |
| `src/components/ImportHistoryTable.tsx` (NEW) | component (client/server) | CRUD (read) | `src/components/OrdersTable.tsx` / `OrdersTableContent.tsx` | role-match |
| `src/components/Sidebar.tsx` (MODIFY) | component (client) | request-response | self (current) | exact (extend) |
| `src/components/Header.tsx` (MODIFY) | component (client) | request-response | self (current) | exact (extend, `getPageTitle`) |
| `src/components/MillReadOnlyStub.tsx` (DELETE) | — | — | — | — |
| `src/db/queries/imports.ts` (NEW) | service (DB query) | CRUD (read) | `src/db/queries/orders.ts` | exact |
| `src/actions/import.ts` (MODIFY) | service (server action) | CRUD (write) | self (current) | exact (single-line patch) |
| `src/hooks/useProductionPolling.ts` (NEW) | hook (client) | event-driven (timer) | `src/hooks/useDebounce.ts` | partial (useEffect+timer shape) |
| `src/lib/search-params.ts` (NEW) | utility (nuqs cache) | transform | (none — first nuqs file) | no analog |

---

## Pattern Assignments

### `src/app/layout.tsx` (MODIFY — wrap children in `<NuqsAdapter>`)

**Analog:** self (current).

**Current state (lines 1-25):**
```typescript
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ClerkProvider afterSignOutUrl="/sign-in">
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

**Change pattern:** Add `import { NuqsAdapter } from 'nuqs/adapters/next/app'` and wrap children inside `<ThemeProvider>` (innermost). Clerk stays outermost; ThemeProvider stays directly inside Clerk; NuqsAdapter wraps `{children}` so it covers every route but does not duplicate per route.

```typescript
import { NuqsAdapter } from 'nuqs/adapters/next/app';
// ...
<ClerkProvider afterSignOutUrl="/sign-in">
  <ThemeProvider>
    <NuqsAdapter>{children}</NuqsAdapter>
  </ThemeProvider>
</ClerkProvider>
```

---

### `src/app/page.tsx` (REWRITE — async RSC, force-dynamic)

**Analog:** `src/app/demo/mill-production/page.tsx` (async RSC pattern) + current `src/app/page.tsx` (auth + checkRole pattern).

**Imports pattern** (from current `src/app/page.tsx` lines 1-5):
```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';
```

**Auth gate + `canEdit` pattern** (current `src/app/page.tsx` lines 21-27):
```typescript
export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in'); // D-02: auth gate ONLY (no role gate)
  }

  const canEdit = await checkRole('mill_operator'); // D-03
  // ...
}
```

**Async RSC + service-call pattern** (`src/app/demo/mill-production/page.tsx` lines 6-15):
```typescript
export default async function MillProductionPage() {
  await requireRole('demo');
  const orders = await getProductionOrders();

  return (
    <DashboardLayout>
      <MillProductionUI orders={orders} />
    </DashboardLayout>
  );
}
```

**Full rewrite shape** (combining both analogs + RESEARCH.md §pattern 1 lines 334-377):
```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { checkRole } from '@/lib/auth';
import { searchParamsCache } from '@/lib/search-params';
import { getProductionOrders, getOrderById } from '@/db/queries/orders';
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
  const { order } = await searchParamsCache.parse(searchParams);

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
      />
    </DashboardLayout>
  );
}
```

---

### `src/app/import/page.tsx` (NEW — async RSC for `/import`)

**Analog:** `src/app/demo/mill-production/page.tsx` (RSC + service call) + new `src/app/page.tsx` (auth gate).

**Pattern shape:**
```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';
import { getImportBatches } from '@/db/queries/imports';
import DashboardLayout from '@/components/DashboardLayout';
import ImportFlow from '@/components/ImportFlow';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const canEdit = await checkRole('mill_operator');
  const batches = await getImportBatches({ limit: 10 }); // D-16

  return (
    <DashboardLayout>
      <ImportFlow batches={batches} canEdit={canEdit} />
    </DashboardLayout>
  );
}
```

**Note on `canEdit`:** Mirrors Phase 31 D-03 — server-computed boolean prop. `/import` should still render in read-only mode for non-operators (no drop zone, just the history table), or redirect — planner decides per D-25 recommendation pattern.

---

### `src/components/ProductionDashboard.tsx` (NEW — client wrapper)

**Analog:** `src/components/MillProductionUI.tsx` (column composition + filter strip + `useMemo`-based grouping).

**Imports pattern** (`MillProductionUI.tsx` lines 1-9):
```typescript
"use client";

import { useMemo, useState } from "react";
import { DemoOrder, ProductionState, MillLine } from "@/types/millProduction";
import FilterPill, { FilterPillColorConfig } from "@/components/ui/FilterPill";
```

**Change for Phase 34:**
- Swap `DemoOrder` → `ProductionOrder` from `@/db/schema/orders` (D-03 type-source change)
- Swap `useState<Set<ProductionState>>` → `useQueryStates` from `nuqs` (D-04)
- Add `useQueryState` for `q` (search) and `order` (drawer ID) (D-05, D-06)

**State filter + grouping pattern** (`MillProductionUI.tsx` lines 194-237):
```typescript
// Demo uses: const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
// Phase 34 replaces with:
const [{ status, q, order }, setQuery] = useQueryStates({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q: parseAsString.withDefault(''),
  order: parseAsString.withDefault(''),
});

// State counts — keep MillProductionUI's defensive reduce pattern (lines 211-223) verbatim:
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce(
    (acc, state) => {
      acc[state] = orders.filter((o) => o.state === state).length;
      return acc;
    },
    { Completed: 0, Mixing: 0, Blocked: 0, Pending: 0 } as Record<ProductionState, number>
  );
}, [orders]);

// Empty-set-means-show-all semantic (lines 225-228) — PRESERVE EXACTLY (Pitfall 11):
const filteredByStatus = useMemo(() => {
  if (status.length === 0) return orders;
  return orders.filter((o) => status.includes(o.state));
}, [orders, status]);

// NEW: client-side search (D-07) — substring on customer + product, case-insensitive
const filteredOrders = useMemo(() => {
  const needle = q.trim().toLowerCase();
  if (!needle) return filteredByStatus;
  return filteredByStatus.filter(
    (o) => o.customer.toLowerCase().includes(needle) || o.product.toLowerCase().includes(needle)
  );
}, [filteredByStatus, q]);

// Grouping by mill line (lines 230-237) — IDENTICAL shape:
const ordersByMill = useMemo<Record<MillLine, ProductionOrder[]>>(
  () => ({
    Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
    Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
    CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
  }),
  [filteredOrders],
);
```

**Filter strip render pattern** (`MillProductionUI.tsx` lines 241-253) — REUSE VERBATIM, swapping `toggleState` for the nuqs setter:
```typescript
<div className="flex gap-2.5">
  {STATE_ORDER.map((state) => (
    <FilterPill
      key={state}
      label={state}
      count={stateCounts[state]}
      color={PRODUCTION_STATE_PILL_CONFIG[state]}
      isActive={status.includes(state)}
      onClick={() => setQuery({ status: toggle(status, state) })}
    />
  ))}
</div>
```

**Polling effect** (RESEARCH.md §pattern 2 lines 405-422):
```typescript
useEffect(() => {
  const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
  return () => clearInterval(id);
}, [router]);
```

**Imports for STATE_COLORS / PRODUCTION_STATE_PILL_CONFIG:** copy the literal blocks from `MillProductionUI.tsx` lines 11-65 verbatim (UI-SPEC source-map line: "FilterPill color configs | `src/components/MillProductionUI.tsx` PRODUCTION_STATE_PILL_CONFIG"). Keep them as local consts in `ProductionDashboard.tsx` — do NOT import from `MillProductionUI.tsx` (D-01 says no code sharing).

---

### `src/components/MillColumn.tsx` (NEW)

**Analog:** `MillColumn` block in `MillProductionUI.tsx` lines 132-179.

**Imports + component shape** (lines 132-179) — REUSE VERBATIM, swap `DemoOrder` for `ProductionOrder`, swap `weightLbs: number` arithmetic for `parseFloat(weightLbs as string)` (Pitfall 6):

```typescript
// MillProductionUI.tsx lines 132-179 — copy this shape:
function MillColumn({
  millLine,
  orders,
}: {
  millLine: MillLine;
  orders: ProductionOrder[];  // ← DemoOrder → ProductionOrder
}) {
  const completedWeight = orders
    .filter((o) => o.state === "Completed")
    .reduce((sum, o) => sum + parseFloat(o.weightLbs), 0);  // ← parseFloat for string column
  const totalWeight = orders.reduce((sum, o) => sum + parseFloat(o.weightLbs), 0);

  const ordersByState = STATE_ORDER.reduce(
    (acc, state) => {
      acc[state] = orders.filter((o) => o.state === state);
      return acc;
    },
    { Completed: [], Mixing: [], Blocked: [], Pending: [] } as Record<ProductionState, ProductionOrder[]>
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <h2 className="text-primary text-2xl font-bold">{millLine}</h2>
        <p className="text-muted mt-1 text-base font-semibold">
          {formatWeight(completedWeight)} / {formatWeight(totalWeight)} lbs
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {STATE_ORDER.map((state) => (
          <StateSection key={state} state={state} orders={ordersByState[state]} />
        ))}
      </div>
    </div>
  );
}
```

**Empty state addition** (UI-SPEC.md surface 3 copywriting + line 307): when `orders.length === 0` for the entire column or all filtered sections, render an empty message — "No orders" or "No [Status] orders".

**`StateSection` block** (lines 101-130) — copy verbatim. The `if (orders.length === 0) return null;` guard at line 111 is intentional and preserved.

---

### `src/components/ColumnSkeleton.tsx` (NEW)

**Analog:** `src/components/ui/skeletons/DetailsSkeleton.tsx`.

**Skeleton pattern** (DetailsSkeleton.tsx lines 1-50) — use the same `animate-pulse bg-[var(--divider)]` idiom + `[...Array(N)].map` for repeated rows:

```typescript
// Copy this pattern shape from DetailsSkeleton.tsx lines 5-9:
<div className="flex flex-col gap-2">
  <div className="h-6 w-24 animate-pulse rounded bg-[var(--divider)]" />
  <div className="h-4 w-16 animate-pulse rounded bg-[var(--divider)]" />
</div>
```

**UI-SPEC contract:** 3 skeleton cards, `h-20 w-full animate-pulse rounded-r-xl bg-[var(--divider)]` per card, `gap-3` between cards, column header skeleton (`h-6 w-24` + `h-4 w-16`).

---

### `src/components/ProductionCard.tsx` (NEW)

**Analog:** `ProductionCard` block in `MillProductionUI.tsx` lines 74-99.

**Card structure** (lines 74-99) — REUSE the visual shape verbatim, swap `DemoOrder` → `ProductionOrder`, add `onClick` to set `?order=`:

```typescript
function ProductionCard({
  order,
  isNextUp,
  isInProgress,
  onClick,
}: {
  order: ProductionOrder;
  isNextUp?: boolean;
  isInProgress?: boolean;
  onClick: () => void;
}) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="shadow-card relative overflow-hidden rounded-r-xl bg-[var(--bg-card)] cursor-pointer transition-opacity hover:opacity-95 active:scale-[0.98]"
    >
      <div
        className="absolute top-0 left-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pr-4 pl-5">
        {isNextUp && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[var(--primary)] mb-1">Next Up</span>
        )}
        <div className="flex items-center gap-1.5">
          <p className="text-card-label text-muted font-semibold">{order.orderNumber}</p>
          {isInProgress && (
            <span className="h-2 w-2 rounded-full bg-[var(--status-mixing-header)] animate-pulse" aria-label="In progress" />
          )}
        </div>
        <p className="text-card-title text-text-primary mt-0.5 font-bold">{order.customer}</p>
        <p className="text-medium mt-1 text-sm font-medium">
          {formatWeight(parseFloat(order.weightLbs))} lbs &bull; {order.product}
        </p>
        <p className="text-muted mt-1.5 text-xs font-medium">Delivery: {order.deliveryTime}</p>
      </div>
    </div>
  );
}
```

**Critical conversions:**
- `order.weightLbs.toLocaleString()` (demo line 91) is WRONG for `ProductionOrder` because `weightLbs` is `string` (Pitfall 6 + schema CR-01 contract). Use `formatWeight(parseFloat(order.weightLbs))` or `Number(order.weightLbs).toLocaleString()`.
- `formatWeight` helper (lines 67-72): copy verbatim — it already takes a `number`.

**Keyboard/click pattern source:** `src/components/ui/Card.tsx` lines 38-58 (`role="button"`, `tabIndex={0}`, `onKeyDown` with Enter/Space).

---

### `src/components/ProductionDrawer.tsx` (NEW — server component, slide-over)

**Analog:** `src/components/OrderDetails.tsx` (header + StatusBadge + timeline-with-dots).

**Server-component shape:** Unlike `OrderDetails.tsx` (which is client and fetches via `useEffect`), this is a server component that receives `{ order, events, canEdit }` as props from the page RSC (D-09).

**Header pattern** (`OrderDetails.tsx` lines 262-272 — translate to Phase 34 fields):
```typescript
<div className="flex flex-col gap-1">
  <div className="flex items-center gap-2">
    <h2 className="text-lg font-bold text-[var(--text-primary)]">
      {order.orderNumber} - {order.customer}
    </h2>
    {/* Use a Phase 34-specific badge for ProductionState — NOT the OrderStatus StatusBadge */}
  </div>
  <p className="text-sm text-[var(--text-secondary)]">
    {order.product} · {order.textureType ?? '—'} · {order.millLine}
  </p>
</div>
```

**StatusBadge gotcha:** `src/components/ui/StatusBadge.tsx` lines 11-47 is hardcoded to `OrderStatus` (Pending / Producing / Ready / In Transit / Complete). The Phase 34 drawer needs a `ProductionState` badge (Pending / Mixing / Completed / Blocked). UI-SPEC.md surface 5 marks: "needs production state config added." Two implementation options:
- (a) Extend `STATUS_CONFIG` with the four production states (cleanest)
- (b) Render an inline state pill in the drawer using `STATE_COLORS` from `ProductionDashboard.tsx`
The planner picks. Recommend (a) — extend the existing component once, reuse throughout.

**Timeline pattern** (`OrderDetails.tsx` lines 366-414 — `TimelineItem` with dot + connector + content):

```typescript
// Translate this shape to render order_events:
function EventTimelineItem({ event, showConnector }: { event: OrderEvent; showConnector: boolean }) {
  const color = STATE_COLORS[event.toState].border;
  return (
    <div className="flex items-stretch gap-3.5">
      <div className="flex w-9 flex-col items-center">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {showConnector && <div className="w-0.5 flex-1 bg-[var(--divider)]" />}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pb-4">
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {event.fromState ? `${event.fromState} → ${event.toState}` : `Created (${event.toState})`}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(event.changedAt)).replace(',', ' ·')}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] font-mono">{event.changedBy}</span>
        {event.note && <span className="text-xs italic text-[var(--text-secondary)] mt-1">{event.note}</span>}
      </div>
    </div>
  );
}
```

**Date format source:** `src/components/ui/Timeline.tsx` lines 57-66 (`Intl.DateTimeFormat` `MMM D, YYYY h:mm a`) — verified format per UI-SPEC surface 5 + surface 8.

**Slide-over container + backdrop pattern:** This is a NEW pattern (no existing slide-over). Recommend:
- Drawer DOM node: `fixed right-0 top-0 h-full w-[480px] bg-[var(--bg-card)] shadow-xl z-40 translate-x-0` (slide-in via Tailwind transition utilities)
- Backdrop: `fixed inset-0 bg-black/30 z-30` (semi-transparent, click → close)
- Close gestures: drawer-X button + ESC key + backdrop click. Use a small client wrapper for ESC + click handlers (server component cannot bind events). Pattern: server component renders the drawer body; a client child `<DrawerCloseHandlers />` mounts ESC + backdrop click listeners and calls `router.replace` with the order param removed.
- Pitfall 4 (RESEARCH.md): DO NOT use the project's existing `useClickOutside` hook for drawer close — it document-binds and will fire from inside the BlockReasonModal portal. Bind the close handler directly to the backdrop element instead.

**Conditional `TransitionButtons`** (D-25 read-only mode): only render `<TransitionButtons />` when `canEdit === true`.

**Suspense wrapping** is done in the parent `ProductionDashboard.tsx` (or `page.tsx`), not inside the drawer itself.

---

### `src/components/DrawerSkeleton.tsx` (NEW)

**Analog:** `src/components/ui/skeletons/DetailsSkeleton.tsx` — copy the WHOLE FILE almost verbatim. The shape (header → divider → 6 field rows → divider → timeline rows) matches the drawer almost exactly. Adjust width to 480px and remove the change-history section (Phase 34 has no separate change history vs timeline).

---

### `src/components/TransitionButtons.tsx` (NEW)

**Analog:** No existing analog. This is a NEW pattern in the codebase: `useActionState` binding to discriminated-union server-action returns.

**Pattern from RESEARCH.md §pattern 3 lines 425-462 + Pitfall 10:**

```typescript
'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  transitionToMixing,
  completeOrder,
  resumeFromBlocked,
  type TransitionResult,
} from '@/actions/transitions';
import Button from '@/components/ui/Button';

export function StartMixingButton({ orderId, version }: { orderId: string; version: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
    async (_prev) => transitionToMixing(orderId, version),
    null,
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
        <p
          className="mt-2 rounded border-l-4 border-[var(--error)] bg-[var(--error-light)] p-2 text-sm text-[var(--error-dark)]"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
```

**Action result type contract** (`src/actions/transitions.ts` lines 71-77):
```typescript
export type TransitionResult =
  | { ok: true }
  | {
      ok: false;
      code: 'conflict' | 'unauthorized' | 'validation' | 'not_found' | 'server';
      message: string;
    };
```

**Conflict message (LOCKED, verbatim)** from `src/actions/transitions.ts` line 59:
```typescript
const CONFLICT_MESSAGE = 'Order was modified by another user. Please refresh.';
```

Phase 34 UI MUST display this string EXACTLY. UI-SPEC.md surface 5 + copywriting contract repeat this lock.

**Button shape and copywriting** (UI-SPEC.md copywriting + surface 5):
- Pending state: `<StartMixingButton />` — "Start Mixing", `variant="primary"`
- Mixing state: `<CompleteOrderButton />` ("Complete Order", `variant="primary"`) + `<BlockOrderTrigger />` ("Block Order", `variant="destructive"`)
- Blocked state: `<ResumeButton toState="Mixing" />` ("Resume to Mixing", primary) + `<ResumeButton toState="Pending" />` ("Resume to Pending", secondary)
- Completed: no buttons.

**Layout:** `flex gap-3`, full-width each (`w-full`).

**Button base component:** `src/components/ui/Button.tsx` lines 40-62 (`loading` prop shows `Loader2 animate-spin` automatically).

---

### `src/components/BlockReasonModal.tsx` (NEW — Radix Dialog)

**Analog:** No direct analog. The codebase has zero Radix/Dialog primitives today. Reference pattern is `src/components/NotificationDropdown.tsx` (overlay + ESC + onClose pattern), but Radix Dialog supersedes it for a11y.

**Pattern from RESEARCH.md §pattern 4 lines 466-521** — REUSE VERBATIM, with these explicit reuses:

**Textarea (REUSE AS-IS)** from `src/components/ui/Textarea.tsx` lines 12-74:
- Has built-in `label`, `required`, `error` props with `AlertCircle` icon
- `aria-required={props.required}` + `aria-invalid={!!error}` already wired
- `min-h-[100px]` default — UI-SPEC says `minRows=3` which is equivalent

**Button (REUSE AS-IS)** from `src/components/ui/Button.tsx`:
- `variant="destructive"` for Confirm (UI-SPEC says destructive — it IS the destructive transition)
- `variant="secondary"` for Cancel
- `loading={isPending}` shows spinner automatically

**Empty-textarea disabled client-side** (D-13):
```typescript
disabled={reason.trim().length === 0}
```

**Confirm calls `blockOrder(orderId, version, reason)`** — server action signature from `src/actions/transitions.ts` lines 215-219:
```typescript
export async function blockOrder(
  orderId: string,
  version: number,
  reason: string
): Promise<TransitionResult>
```

**Stacking on drawer:** Radix `Dialog.Portal` renders to `document.body` so z-index conflicts are avoided. Pitfall 4 (RESEARCH.md): the drawer's outside-click handler must be backdrop-bound (not document-bound) so clicks inside the modal portal don't propagate to drawer close.

**No `useClickOutside` import in this file** — Radix Dialog handles ESC + click-outside natively via `Dialog.Root onOpenChange`.

---

### `src/components/BlockedAlertBand.tsx` (NEW)

**Analog:** Filter strip pattern in `MillProductionUI.tsx` lines 241-253 (flex wrap of items derived from data).

**Pattern shape:**
```typescript
'use client';
import { useQueryStates, parseAsString } from 'nuqs';
import type { ProductionOrder } from '@/db/schema/orders';

export default function BlockedAlertBand({ orders }: { orders: ProductionOrder[] }) {
  const [, setQuery] = useQueryStates({ order: parseAsString.withDefault('') });
  const blocked = orders.filter((o) => o.state === 'Blocked');

  if (blocked.length === 0) return null;  // D-22: hidden when zero

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-l-4 border-[var(--status-blocked-border)] bg-error-light px-4 py-3">
      {blocked.map((order) => (
        <button
          key={order.id}
          onClick={() => setQuery({ order: order.id })}
          className="rounded px-2 py-1 text-xs text-[var(--error-dark)] hover:underline"
        >
          BLOCKED: {order.orderNumber} ({order.millLine})
          {/* reason excerpt comes from the most recent Blocked event note — see UI-SPEC surface 2 */}
        </button>
      ))}
    </div>
  );
}
```

**Reason excerpt source:** UI-SPEC surface 2 specifies `— [reason excerpt, max 40 chars]`. Without per-order events on the dashboard list, the band can show order number + mill line only, or the page can pass a derived `blockedReasonByOrderId: Record<string, string>` map computed RSC-side from a separate query. Planner decides — recommend showing only `BLOCKED: ORD-123 (Premix)` at v2.0 and adding the reason excerpt in a follow-up.

---

### `src/components/LastUpdatedChip.tsx` (NEW)

**Analog:** `NotificationDropdown.tsx` `formatTimestamp` helper (lines 42-53) — relative-time idiom.

**Relative-time pattern (lines 42-53):**
```typescript
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};
```

**Phase 34 extension** (UI-SPEC copywriting "Updated [X]s ago" → needs seconds resolution):
```typescript
const formatRelative = (timestamp: Date): string => {
  const diff = Date.now() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
};
```

**5-second tick:** mount `setInterval(() => setTick(t => t + 1), 5_000)` in `useEffect`; clean up on unmount. Anchor reset on `router.refresh()` completion (capture `Date.now()` after the refresh resolves, store in state).

**Refresh button:** use `Button` with `variant="ghost"`, `size="sm"`, icon `RotateCcw` from `lucide-react`. `loading={isRefreshing}` shows `Loader2 animate-spin` automatically (Button component lines 57-58).

---

### `src/components/ImportFlow.tsx` (NEW — drop zone + preview + commit)

**Analog:** None. Bulk-XLSX upload is the first of its kind in this codebase.

**State-machine shape (recommended):** local `useState` with three phases — `'entry' | 'preview' | 'committed'`.

**File-size guard pattern** (D-17, RESEARCH.md Pitfall 8) using `MAX_IMPORT_BYTES` from `src/lib/import-constants.ts`:
```typescript
import { MAX_IMPORT_BYTES } from '@/lib/import-constants';

function onFileSelect(file: File) {
  if (file.size > MAX_IMPORT_BYTES) {
    setError('File exceeds 2 MB limit. Please upload a smaller file.');  // UI-SPEC copywriting
    return;
  }
  // proceed to preview
}
```

**Server action invocation pattern** — the existing `previewImportAction` / `commitImportAction` (`src/actions/import.ts` lines 374-451 + 524-820) take `FormData`:
```typescript
const formData = new FormData();
formData.append('file', file);
const result = await previewImportAction(formData);
if (result.ok) {
  setRows(result.rows);
  setSummary(result.summary);
  setPhase('preview');
} else {
  setError(result.message);
}
```

**Commit invocation** — `commitImportAction(formData, decisions)` returns `CommitResult`:
```typescript
const decisions: ImportDecisions = {
  skipRows: rows.filter(r => userChoice[r.rowIndex] === 'skip').map(r => r.rowIndex),
  overwriteRows: rows.filter(r => userChoice[r.rowIndex] === 'overwrite').map(r => r.rowIndex),
};
const result = await commitImportAction(formData, decisions);
```

**Per-row Skip/Overwrite radio default** (D-18, Phase 33 D-12): `'skip'` is the default for every duplicate row. Use `useState<Record<number, 'skip' | 'overwrite'>>` keyed on `rowIndex`.

**Drag-drop pattern:** Plain `<input type="file" accept=".xlsx" />` + drag handlers on a wrapper `<div>`:
```typescript
<div
  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
  onDragLeave={() => setDragOver(false)}
  onDrop={(e) => { e.preventDefault(); setDragOver(false); onFileSelect(e.dataTransfer.files[0]); }}
  className={dragOver ? 'border-2 border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]' : 'border border-dashed border-[var(--divider)]'}
>
  <input type="file" accept=".xlsx" onChange={(e) => onFileSelect(e.target.files![0])} />
</div>
```

**No-analog rationale:** the only file-upload pattern in the codebase is the server action itself; no existing client-side upload form exists.

---

### `src/components/ImportHistoryTable.tsx` (NEW)

**Analog:** `src/components/OrdersTable.tsx` / `OrdersTableContent.tsx` (existing tabular display pattern).

**Date format source:** `src/components/ui/Timeline.tsx` lines 57-66 — `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })` returns "May 14, 2026, 2:34 PM"-style output, matching UI-SPEC.md surface 8.

**Empty state:** "No imports yet" (UI-SPEC copywriting).

**Row count:** 10 (D-16 + UI-SPEC source map).

**Type source:** `ImportBatch` from `src/db/schema/imports.ts` line 13:
```typescript
export type ImportBatch = typeof importBatches.$inferSelect;
// { id, fileName, rowCount, importedBy, importedAt }
```

**Caching contract:** Component is purely presentational; the cached query lives in `src/db/queries/imports.ts` (see below). The component receives `batches: ImportBatch[]` as props.

---

### `src/components/Sidebar.tsx` (MODIFY)

**Analog:** self (current — `src/components/Sidebar.tsx` lines 1-137).

**Single change: lines 19-21** — replace the `productionNavItems` array:
```typescript
// Before:
const productionNavItems = [
  { icon: LayoutDashboard, label: "Coming Soon", id: "coming-soon", href: "/" },
];

// After (D-24, UI-SPEC sidebar update contract):
import { LayoutDashboard, Upload, /* ... */ } from "lucide-react";
const productionNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: Upload,          label: "Import",    id: "import",    href: "/import" },
];
```

**`isActive` helper (lines 27-32) — DO NOT MODIFY.** Pitfall 5 (RESEARCH.md): the special-case `if (href === "/") return pathname === "/"` MUST be preserved. Add a Sidebar.test.tsx case asserting `isActive('/', '/import') === false`.

---

### `src/components/Header.tsx` (MODIFY)

**Analog:** self (current — `src/components/Header.tsx` lines 23-34, `getPageTitle`).

**Single change: lines 23-34** — update `getPageTitle` for the new production routes:
```typescript
const getPageTitle = (path: string): string => {
  // Demo routes (check first - more specific)
  if (path.startsWith('/demo/orders')) return 'Orders';
  if (path.startsWith('/demo/customers')) return 'Customers';
  if (path.startsWith('/demo/mill-production')) return 'Mill Production';

  // Production routes (UI-SPEC sidebar update contract)
  if (path === '/') return 'Dashboard';                  // ← was 'Coming Soon'
  if (path.startsWith('/import')) return 'Import';       // ← NEW
  if (path.startsWith('/settings')) return 'Settings';

  return 'Dashboard';
};
```

---

### `src/db/queries/imports.ts` (NEW)

**Analog:** `src/db/queries/orders.ts` (canonical cached-query pattern).

**Imports + structure** (`orders.ts` lines 1-7):
```typescript
import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { importBatches, type ImportBatch } from '@/db/schema/imports';
import { desc } from 'drizzle-orm';
```

**Cached query pattern** (`orders.ts` lines 32-49) — COPY VERBATIM, adapted for `importBatches`:
```typescript
/**
 * Fetch the N most recent import batches.
 *
 * CACHE CONTRACT:
 * This function is wrapped in `unstable_cache` with tag `'import-batches'`.
 * The tag MUST match the `revalidateTag('import-batches')` call added in
 * `src/actions/import.ts` `commitImportAction` (D-21 Phase-33 → Phase-34 contract).
 */
export const getImportBatches = unstable_cache(
  async ({ limit }: { limit: number }): Promise<ImportBatch[]> => {
    return db
      .select()
      .from(importBatches)
      .orderBy(desc(importBatches.importedAt))
      .limit(limit);
  },
  ['import-batches'],
  { tags: ['import-batches'] }
);
```

**Cache-key vs cache-tag distinction:** `['import-batches']` (1st arg) is the cache KEY; `{ tags: ['import-batches'] }` (3rd arg) is the invalidation TAG. Following the `orders.ts` convention they share the same string; this is intentional.

---

### `src/actions/import.ts` (MODIFY — single-line patch, D-21)

**Analog:** self (current — `src/actions/import.ts` lines 793, 808).

**Patch shape** (RESEARCH.md §pattern 5 lines 548-556):
```typescript
// Around line 808 (the existing revalidateTag call):
try {
  revalidateTag('production-orders', 'max');
  revalidateTag('import-batches', 'max');   // ← NEW (D-21)
} catch (revalErr) {
  console.error('[commitImportAction] revalidateTag failed:', revalErr);
}
```

**Also at line 793** (the degraded-success path inside the batch-insert catch block):
```typescript
try {
  revalidateTag('production-orders', 'max');
  revalidateTag('import-batches', 'max');   // ← NEW (D-21)
} catch (revalErr) {
  console.error('[commitImportAction] revalidateTag failed after batch-insert failure:', revalErr);
}
```

**Existing pattern proves:** the `revalidateTag('production-orders', 'max')` shape is the canonical form used throughout Phase 33 actions; the `'max'` second arg is the convention.

**Test contract** (RESEARCH.md Pitfall 8): a unit test in `src/actions/__tests__/import.test.ts` must assert BOTH tags are invalidated. Pattern: spy on `revalidateTag` and assert it was called twice (or with both tags).

---

### `src/hooks/useProductionPolling.ts` (NEW)

**Analog:** `src/hooks/useDebounce.ts` (existing `useEffect` + timer + cleanup shape).

**Imports pattern** (`useDebounce.ts` lines 1):
```typescript
import { useState, useEffect } from 'react';
```

**Timer + cleanup pattern** (`useDebounce.ts` lines 6-9):
```typescript
useEffect(() => {
  const timer = setTimeout(() => setDebouncedValue(value), delay);
  return () => clearTimeout(timer);
}, [value, delay]);
```

**Phase 34 hook shape (RESEARCH.md §pattern 2 lines 405-422):**
```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const REFRESH_INTERVAL_MS = 30_000; // PROD-09 D-19 — named constant for Phase 35 reuse

export function useProductionPolling(): void {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);
}
```

**Difference from `useDebounce`:** `setInterval` instead of `setTimeout`, `clearInterval` instead of `clearTimeout`. Otherwise identical idiom.

---

### `src/lib/search-params.ts` (NEW)

**Analog:** None — first nuqs file in the codebase.

**Pattern from RESEARCH.md §pattern 1 lines 319-332 (verbatim recommended source):**
```typescript
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsStringLiteral,
  parseAsString,
} from 'nuqs/server';
import type { ProductionState } from '@/db/schema/orders';

/**
 * Canonical ordering of production states for filter pills + grouping.
 *
 * Source of truth: matches `STATE_ORDER` in `MillProductionUI.tsx` lines 11-16
 * (Phase 28 visual prior art). Phase 34 reuses the same ordering to keep the
 * filter strip visually consistent with the demo.
 */
export const STATE_ORDER = ['Pending', 'Mixing', 'Completed', 'Blocked'] as const satisfies readonly ProductionState[];

/**
 * Shared parser cache for `/?status=&q=&order=`.
 *
 * Consumed by:
 *   - `src/app/page.tsx` (RSC) — `searchParamsCache.parse(searchParams)`
 *   - `src/components/ProductionDashboard.tsx` (client) — same parsers via `useQueryStates`
 *
 * D-04: status is comma-separated array of valid literals; unknown values dropped silently.
 * D-05: q is plain string, default empty.
 * D-06: order is single string (order id), default empty; presence opens drawer.
 */
export const searchParamsCache = createSearchParamsCache({
  status: parseAsArrayOf(parseAsStringLiteral(STATE_ORDER)).withDefault([]),
  q:      parseAsString.withDefault(''),
  order:  parseAsString.withDefault(''),
});
```

**Critical:** the literal `STATE_ORDER` must match `MillProductionUI.tsx` ordering exactly (Pending, Mixing, Completed, Blocked) — D-04 documents the four valid literals; the demo orders them differently for visual layout (Completed, Mixing, Blocked, Pending). Resolve in plan: use the visual ordering for FILTER PILL DISPLAY (matches demo), keep the canonical literal order for PARSING (any permutation parses fine since `parseAsArrayOf` is set-semantics).

---

### `src/components/MillReadOnlyStub.tsx` (DELETE)

**Verification:** `grep -rn MillReadOnlyStub src/` shows only three files reference it (verified):
1. `src/app/page.tsx:5` and `:31` — rewritten in Phase 34
2. `src/app/page.test.tsx:8` — JSDoc comment; rewritten in Phase 34
3. `src/lib/auth.ts:80` — JSDoc example only (line 80); update to reference `ProductionDashboard` or remove the example

No runtime imports outside `page.tsx` block deletion. Safe to delete after rewriting `page.tsx`.

---

## Shared Patterns

### Authentication (page-level)

**Source:** `src/app/page.tsx` lines 21-27 (current Phase 31 implementation).
**Apply to:** `src/app/page.tsx` (new), `src/app/import/page.tsx` (new).

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkRole } from '@/lib/auth';

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const canEdit = await checkRole('mill_operator');
  // ... pass canEdit down to client components
}
```

**Middleware:** `src/middleware.ts` already calls `auth.protect()` on every non-public route (lines 21-23). The in-page `auth()` redirect is a defense-in-depth check, not the primary gate.

---

### Authorization (action-level)

**Source:** `src/actions/transitions.ts` lines 89, 154, 220, 304 — every action's first line:
```typescript
await requireRole('mill_operator');
```

**Apply to:** This is already done in Phase 33 actions; Phase 34 does NOT add new server actions, only patches `commitImportAction`. The `requireRole` line in `commitImportAction` (line 529) stays as-is.

**UI-side recommendation (D-25):** Pass `canEdit` from page RSC → `ProductionDashboard` → `ProductionDrawer`. In the drawer, conditionally render `<TransitionButtons />`:
```typescript
{canEdit && <TransitionButtons order={order} />}
```

---

### Error Handling (action results in client)

**Source:** `src/actions/transitions.ts` lines 71-77 (discriminated-union type).

**Apply to:** Every client component that calls a server action (`TransitionButtons.tsx`, `BlockReasonModal.tsx`, `ImportFlow.tsx`).

**Pattern:** `useActionState<TransitionResult | null, FormData>(...)` returns `[state, formAction, isPending]`. Branch on `state?.ok` and `state?.code`:
- `code: 'conflict'` → inline red banner + `router.refresh()` (D-14)
- `code: 'unauthorized'` → action's `requireRole` already redirects via `NEXT_REDIRECT`; client doesn't handle this
- `code: 'validation'` → render `state.message` near the offending input
- `code: 'not_found'` → toast or inline message
- `code: 'server'` → generic error message

**Locked conflict text (verbatim):** `Order was modified by another user. Please refresh.` (`src/actions/transitions.ts` line 59 + ROADMAP SC#2)

---

### Validation (client-side `Textarea` empty guard)

**Source:** Per-component pattern; `src/components/ui/Textarea.tsx` lines 4-74 (built-in `required` + `error` + `aria-invalid`).

**Apply to:** `BlockReasonModal.tsx` (D-13 — required non-empty reason).

```typescript
<Textarea
  label="Reason (required)"
  required
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  placeholder="Describe the issue..."
  error={state?.ok === false && state.code === 'validation' ? state.message : undefined}
/>

<Button
  type="submit"
  variant="destructive"
  disabled={reason.trim().length === 0}  // ← client-side guard
  loading={isPending}
>
  Confirm Block
</Button>
```

**Server still validates:** `src/actions/transitions.ts` lines 229-235 — even if client somehow submits empty, server returns `{ code: 'validation' }`.

---

### Cache Invalidation Tag Contract

**Source:** STATE.md mutation invariant + `src/db/queries/orders.ts` lines 19-31 (JSDoc) + `src/actions/transitions.ts` line 24 (JSDoc).

**Apply to:** `src/db/queries/imports.ts` (NEW — tag `'import-batches'`) + `src/actions/import.ts` (PATCH — add `revalidateTag('import-batches', 'max')`).

**Invariant:** Every cached query's tag must match every mutating action's `revalidateTag` call. Phase 33 enforced this for `'production-orders'`. Phase 34 introduces `'import-batches'` and must patch the contract gap.

---

### Streaming + Skeletons (Suspense per surface)

**Source:** No existing analog (first use of per-column Suspense in this codebase).

**Apply to:** `MillColumn.tsx` (per-column boundary) and `ProductionDrawer.tsx` (per-drawer boundary). Skeleton components copy `src/components/ui/skeletons/DetailsSkeleton.tsx` patterns.

```typescript
<Suspense fallback={<ColumnSkeleton />}>
  <MillColumn millLine="Premix" orders={ordersByMill.Premix} />
</Suspense>
```

**Caveat (RESEARCH.md Pitfall 3):** With `force-dynamic` on the page, Suspense fires only on `router.refresh()`, not on every render (data is server-rendered before the page paints). The skeleton primarily shows during polling refreshes.

---

## No Analog Found

Three new files have no close pattern match in the existing codebase. The planner should use the RESEARCH.md library-canonical excerpts for these:

| File | Role | Data Flow | Reason | Use Instead |
|------|------|-----------|--------|-------------|
| `src/components/TransitionButtons.tsx` | client (action binding) | request-response | First use of `useActionState` in codebase | RESEARCH.md §pattern 3 lines 425-462 (canonical React 19 pattern) |
| `src/components/BlockReasonModal.tsx` | client modal | event-driven | First Radix Dialog in codebase | RESEARCH.md §pattern 4 lines 466-521 (canonical `@radix-ui/react-dialog` pattern) |
| `src/components/ImportFlow.tsx` | client wrapper | file-I/O | First client-side file upload form | Browser File API + `FormData` + the existing `previewImportAction` / `commitImportAction` signatures |
| `src/lib/search-params.ts` | utility | transform | First nuqs file | RESEARCH.md §pattern 1 lines 319-332 (canonical `createSearchParamsCache`) |

**Implication for planner:** For these four files, the plan should include the RESEARCH.md excerpt directly (it functions as the analog of last resort), and the executor follows it line-by-line. No external research re-derivation needed — RESEARCH.md is the source of truth.

---

## Metadata

**Analog search scope:**
- `src/app/**` (page + layout patterns)
- `src/components/**` (all UI primitives + existing dashboards)
- `src/components/ui/**` (Button, Card, FilterPill, StatusBadge, Textarea, Timeline, skeletons)
- `src/hooks/**` (useDebounce, useClickOutside, useLocalStorage)
- `src/db/queries/**` (orders.ts, events.ts)
- `src/db/schema/**` (orders.ts, events.ts, imports.ts)
- `src/actions/**` (transitions.ts, import.ts, import-schema.ts)
- `src/lib/**` (auth.ts, import-constants.ts)
- `src/middleware.ts`

**Files scanned for analogs:** 24 (full read of 18; targeted reads of 6).

**Pattern extraction date:** 2026-05-14

**Skill notes:** No project CLAUDE.md exists. No `.agents/skills/` or `.claude/skills/` directories. Patterns derived purely from existing source files.
