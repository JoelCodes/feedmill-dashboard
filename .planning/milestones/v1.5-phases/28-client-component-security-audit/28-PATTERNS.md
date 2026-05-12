# Phase 28: Client Component Security Audit - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 11 (4 page refactors, 1 component refactor, 4 test migrations, 1 new doc, 1 audit-confirm anchor)
**Analogs found:** 11 / 11 (every new/modified file has a real in-repo analog)

The canonical anchor for every server-page refactor is `src/app/demo/customers/[id]/page.tsx` (already an async RSC). The canonical anchor for every page-test migration is `src/lib/auth.test.ts` (redirect-sentinel-throw idiom) combined with `src/app/demo/customers/[id]/page.test.tsx` (async-RSC-as-function rendering).

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/app/demo/orders/page.tsx` | server-component-page | fetches-from-services → renders-client-child | `src/app/demo/customers/[id]/page.tsx` | exact (RSC + service fetch + client child) |
| `src/app/demo/customers/page.tsx` | server-component-page | fetches-from-services → renders-client-child | `src/app/demo/customers/[id]/page.tsx` | exact |
| `src/app/demo/customers/[id]/page.tsx` | server-component-page | fetches-from-services (Promise.all) → renders-client-child | (itself — minimal-delta change: gain `requireRole`) | exact (in-place addition) |
| `src/app/demo/mill-production/page.tsx` | server-component-page | fetches-from-services → renders-client-child | `src/app/demo/customers/[id]/page.tsx` | exact |
| `src/components/OrdersTable.tsx` | client-data-component | receives-as-props | (itself — signature change: drop `useEffect`+`useState<Order[]>`, add `orders: Order[]` prop) | role-match (self-modify) |
| `src/components/CustomersList.tsx` (NEW) | client-data-component | receives-as-props | `src/components/OrdersTable.tsx` (interactive list with search + memoized filter + keyboard/click row select) | role-match (new client wrapper extracted from existing inline JSX in `customers/page.tsx`) |
| `src/components/MillProductionUI.tsx` (NEW) | client-data-component | receives-as-props | `src/components/OrdersTable.tsx` (FilterPill strip + `useState<Set<>>` + memoized counts) | role-match (new client wrapper extracted from existing inline JSX in `mill-production/page.tsx`) |
| `src/app/demo/orders/__tests__/page.test.tsx` | test (RSC page) | informational | `src/app/demo/customers/[id]/page.test.tsx` (async-RSC-as-function) + `src/lib/auth.test.ts` (redirect-sentinel-throw) | exact (composite) |
| `src/app/demo/customers/page.test.tsx` | test (RSC page) | informational | same composite analog | exact |
| `src/app/demo/customers/[id]/page.test.tsx` | test (RSC page) | informational | (itself — gains `mockAuth` block + redirect case; keeps existing 5 cases) | exact (in-place addition) |
| `src/app/demo/mill-production/__tests__/page.test.tsx` | test (RSC page) | informational | same composite analog | exact |
| `src/components/__tests__/OrdersTable.test.tsx` | test (client component) | informational | (itself — drop `(getOrders as jest.Mock)` shim + `waitFor(...)`; render with `orders={mockOrders}` synchronously) | role-match (self-modify) |
| `docs/security-patterns.md` (NEW) | docs | informational | `docs/clerk-setup.md` (existing runbook in same `docs/` directory: H1 + numbered steps + tables + fenced examples) | role-match (structure & tone) |

## Pattern Assignments

### `src/app/demo/customers/[id]/page.tsx` (server-component-page, fetches-from-services Promise.all) — MINIMAL-DELTA

**Analog:** itself. Only change is **insert `await requireRole('demo')` immediately after the function-body open brace; leave everything else byte-for-byte unchanged.**

**Imports pattern — ADD ONE LINE** (insert above existing `notFound` import block, mirrors `src/lib/auth.ts` JSDoc §example):
```typescript
// src/app/demo/customers/[id]/page.tsx (lines 1-8 today)
import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import CustomerDetailHeader from '@/components/CustomerDetailHeader';
import CustomerDetailTabs from '@/components/CustomerDetailTabs';
import { getCustomerById } from '@/services/customers';
import { getActivityEvents } from '@/services/activity';
import { getBinsByCustomerId } from '@/services/bins';
import { getOrdersByCustomerId } from '@/services/orders';
// ADD:
import { requireRole } from '@/lib/auth';
```

**Guard pattern — INSERT BEFORE EXISTING PROMISE.ALL** (line 16 today is `const { id } = await params;`):
```typescript
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole('demo');                  // NEW (D-05)
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params;

  // Parallel fetch: customer, events, bins, and orders (D-07)
  const [customer, events, bins, orders] = await Promise.all([
    getCustomerById(id),
    getActivityEvents(id),
    getBinsByCustomerId(id),
    getOrdersByCustomerId(id),
  ]);

  if (!customer) {
    notFound();
  }
  // ... rest unchanged ...
```

**Why this matters:** This file is the canonical RSC shape that the three other page refactors mirror. Touching anything else here drifts the canon.

---

### `src/app/demo/orders/page.tsx` (server-component-page, fetches-from-services → renders-client-child)

**Analog:** `src/app/demo/customers/[id]/page.tsx` (canonical RSC shape) + retain the **existing** `<Suspense>` boundary already present in `src/app/demo/orders/page.tsx` lines 30-37 (the client child still calls `useSearchParams()` for the `?selected=` deep link).

**Imports pattern** (mirrors `[id]/page.tsx` lines 1-8; note `Suspense` carries over from current orders page line 3):
```typescript
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { getOrders } from '@/services/orders';
import DashboardLayout from '@/components/DashboardLayout';
import OrdersTable from '@/components/OrdersTable';
```

**Core RSC pattern** (compose `[id]/page.tsx` lines 10-37 + existing orders-page `<Suspense>` from lines 33-35):
```typescript
export default async function OrdersPage() {
  await requireRole('demo');         // mirrors [id]/page.tsx (after add)
  const orders = await getOrders();  // single-source fetch — no Promise.all needed

  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex-1 animate-pulse rounded-[var(--radius-xl)] bg-[var(--divider)]" />}>
        <OrdersTableContent orders={orders} />
      </Suspense>
    </DashboardLayout>
  );
}
```

**`useSearchParams` boundary handling** — preserve the `OrdersContent` sub-component from existing `src/app/demo/orders/page.tsx` lines 8-28 verbatim **except** rename it `OrdersTableContent` and accept `orders` as a prop to forward to `<OrdersTable>`. This client sub-component continues to own the `?selected=` deep-link sync and stays inside the `<Suspense>` boundary (Next 16 requires `useSearchParams` inside Suspense). Anchor: existing lines 8-28 of orders/page.tsx.

**Error handling pattern:** None at the page layer — `requireRole` throws `NEXT_REDIRECT` on guard failure (handled by Next); `getOrders()` is mock data and cannot throw. Mirrors `[id]/page.tsx` exactly (no try/catch).

---

### `src/app/demo/customers/page.tsx` (server-component-page, fetches-from-services → renders-client-child)

**Analog:** `src/app/demo/customers/[id]/page.tsx` (RSC shape) for the page shell. **Client wrapper extraction is required** because the current `customers/page.tsx` is `'use client'` with `useRouter` + `useState` + `useDebounce` + `useMemo` (lines 1-12, 44-74) — all of which must move into a new client component because a Server Component cannot call those hooks.

**Imports pattern** (RSC, mirrors `[id]/page.tsx`):
```typescript
import { requireRole } from '@/lib/auth';
import { getCustomers } from '@/services/customers';
import { sortCustomersByRecentActivity } from '@/utils/customerSort';
import DashboardLayout from '@/components/DashboardLayout';
import CustomersList from '@/components/CustomersList'; // NEW client wrapper
```

**Core RSC pattern** (single-source fetch; sort still server-side):
```typescript
export default async function CustomersPage() {
  await requireRole('demo');
  const customers = sortCustomersByRecentActivity(await getCustomers());

  return (
    <DashboardLayout>
      <CustomersList customers={customers} />
    </DashboardLayout>
  );
}
```

**Why sort server-side:** `sortCustomersByRecentActivity` is a pure function (no React state); moving it before the prop boundary keeps the client child stateless w.r.t. initial ordering and matches `[id]/page.tsx`'s philosophy that the server delivers final-shaped data.

---

### `src/app/demo/mill-production/page.tsx` (server-component-page, fetches-from-services → renders-client-child)

**Analog:** `src/app/demo/customers/[id]/page.tsx` (RSC shape). Same wrapper-extraction need as `customers/page.tsx` — current file is `'use client'` with `useState<ProductionOrder[]>`, `useState<Set<ProductionState>>`, `useMemo` (lines 1, 199-225).

**Imports pattern:**
```typescript
import { requireRole } from '@/lib/auth';
import { getProductionOrders } from '@/services/millProduction';
import DashboardLayout from '@/components/DashboardLayout';
import MillProductionUI from '@/components/MillProductionUI'; // NEW client wrapper
```

**Core RSC pattern:**
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

---

### `src/components/OrdersTable.tsx` (client-data-component, receives-as-props) — SIGNATURE CHANGE

**Analog:** itself. The change is **remove the in-component fetch + initial-load state; add `orders: Order[]` to props.**

**Existing signature** (lines 45-51):
```typescript
interface OrdersTableProps {
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  externalSearchTerm?: string;
}
export default function OrdersTable({ selectedOrderId, onSelectOrder, externalSearchTerm }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);    // REMOVE
```

**Existing fetch block to delete** (lines 64-72):
```typescript
useEffect(() => {
  getOrders()
    .then(setOrders)
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load orders:', error);
      }
    });
}, []);
```

**Required after refactor** (insert `orders` as first prop; remove both blocks above):
```typescript
interface OrdersTableProps {
  orders: Order[];                                     // NEW prop
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  externalSearchTerm?: string;
}
export default function OrdersTable({
  orders,                                              // NEW prop
  selectedOrderId,
  onSelectOrder,
  externalSearchTerm,
}: OrdersTableProps) {
  // (removed `const [orders, setOrders] = useState<Order[]>([]);`)
  // (removed `useEffect(() => { getOrders().then(setOrders)...`)
  const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());
  // ... everything else unchanged: filter pills, search, keyboard nav, scrollIntoView, etc.
```

**Also delete:** the `import { getOrders } from "@/services/orders";` line (line 8). After refactor, OrdersTable.tsx has no service imports — the audit's bundle-size verification step (RESEARCH.md Runtime State Inventory) keys off this.

---

### `src/components/CustomersList.tsx` (NEW client-data-component, receives-as-props)

**Analog:** Two-part composite:
1. **Inline JSX and behavior** comes from existing `src/app/demo/customers/page.tsx` lines 44-187 (the entire current client-component body — `useRouter`, `useDebounce`, `searchTerm` state, `EmptyState`, `CustomerTableSkeleton`, the row map).
2. **Prop-receiving client shape** mirrors `OrdersTable.tsx`'s post-refactor signature (above): top-of-file `'use client';`, props interface that accepts `customers: CustomerWithStats[]`, no service import, `useState`/`useMemo`/`useRouter` retained for interactivity.

**Required prop shape:**
```typescript
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, Search, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerWithStats } from '@/types/customer';

interface CustomersListProps {
  customers: CustomerWithStats[];   // pre-sorted by page.tsx
}

export default function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  // ... lift everything from customers/page.tsx lines 49-74 EXCEPT the useEffect+useState<customers> pair
  // The page now passes pre-sorted customers; this component owns search + click-to-route only
}
```

**What to NOT lift into the wrapper:** `useState<customers>([])` (line 46), `useState<loading>(true)` (line 47), `useState<error>(null)` (line 48), `useEffect` (lines 53-63), `sortCustomersByRecentActivity` call (line 56 — moved to page.tsx). The skeleton/loading branch can be dropped entirely because data arrives via prop already-resolved; the error branch becomes dead code (mock service can't fail). Match `OrdersTable.tsx`'s philosophy: client component renders synchronously from props.

**Note on `CustomerTableSkeleton` (page.tsx lines 13-30):** drop it. With server-side fetch, the data is resolved before render. If a loading state is desired during navigation, use a `loading.tsx` file at `src/app/demo/customers/loading.tsx` (Next 16 convention) — but per CONTEXT.md "Claude's Discretion" + RESEARCH.md Pitfall 5, the recommendation is **no loading state** for mock data.

---

### `src/components/MillProductionUI.tsx` (NEW client-data-component, receives-as-props)

**Analog:** Same two-part composite as `CustomersList.tsx`:
1. **Inline JSX and behavior** comes from `src/app/demo/mill-production/page.tsx` lines 198-273 (everything inside the current `MillProductionPage` function, plus the `ProductionCard` / `StateSection` / `MillColumn` helpers at lines 76-173 — those can stay inline in this file or be re-exported; they're already client-pure).
2. **Prop-receiving client shape** mirrors `OrdersTable.tsx`'s signature.

**Required prop shape:**
```typescript
'use client';

import { useState, useMemo } from 'react';
import {
  ProductionOrder,
  ProductionState,
  MillLine,
} from '@/types/millProduction';
import FilterPill, { FilterPillColorConfig } from '@/components/ui/FilterPill';

// STATE_ORDER, STATE_COLORS, PRODUCTION_STATE_PILL_CONFIG, formatWeight, ProductionCard, StateSection, MillColumn:
// lift verbatim from mill-production/page.tsx lines 13-173.

interface MillProductionUIProps {
  orders: ProductionOrder[];
}

export default function MillProductionUI({ orders }: MillProductionUIProps) {
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
  // ... lift toggleState (lines 203-213), stateCounts useMemo (lines 215-220),
  // filteredOrders useMemo (lines 222-225), ordersByMill (lines 241-245), return JSX (lines 247-272)
  // EXCEPT: drop the useState<orders>([]) at line 199, useState<loading>(true) at line 200,
  //   useEffect at lines 227-239, and the LoadingSkeleton branch at line 262.
}
```

**What to NOT lift:** `LoadingSkeleton` (lines 175-196) — drop, same reasoning as `CustomerTableSkeleton`.

---

### Page Tests (4 files): `*/page.test.tsx`

**Composite analog:** `src/lib/auth.test.ts` lines 1-16 (jest.mock placement + redirect-sentinel-throw) **+** `src/app/demo/customers/[id]/page.test.tsx` lines 85-95 (`await Page()` → `render(Page)` for async RSC).

**Mock block pattern** (place at top of every refactored page test, BEFORE imports of the page module — verified against `src/lib/auth.test.ts` Pattern C placement):
```typescript
// SOURCE: src/lib/auth.test.ts lines 6-16 — exact reuse, no modification
const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
  // Keep next/navigation client hooks if any child component (Header, DashboardLayout) uses them:
  usePathname: jest.fn(() => '/demo/orders'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
  notFound: jest.fn(),  // only for customers/[id]/page.test.tsx
}));
```

**Per-test session shape** (mirrors `auth.test.ts` lines 26-30 / 68-79):
```typescript
beforeEach(() => {
  mockAuth.mockReset();
  // Default: pass-through demo session for the green-path render tests.
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { role: 'demo' } },
  });
  (getOrders as jest.Mock).mockResolvedValue(mockOrders);
});
```

**New required test cases per page** (mirrors `auth.test.ts` lines 67-89 `requireRole` cases):
```typescript
it('redirects to /sign-in when userId is missing', async () => {
  mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
  await expect(OrdersPage()).rejects.toMatchObject({ url: '/sign-in' });
});

it('redirects to / when role is not demo', async () => {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { role: 'user' } },
  });
  await expect(OrdersPage()).rejects.toMatchObject({ url: '/' });
});
```

**Async-RSC render pattern** (mirrors `customers/[id]/page.test.tsx` lines 85-95):
```typescript
it('renders orders when session is demo', async () => {
  const element = await OrdersPage();          // call RSC like a function
  render(element);                              // pass returned JSX to RTL
  expect(screen.getByText(/Outgoing Orders/i)).toBeInTheDocument();
});
```

**Existing mocks to KEEP** in each page test (from current files — already correct):
- `jest.mock('@clerk/nextjs', () => ({ ClerkLoaded, ClerkLoading, UserButton }))` — for Header child (verified in `orders/__tests__/page.test.tsx` lines 16-24 etc.)
- `jest.mock('@/services/notifications', ...)` — for Header notifications fetch (Header stays client; see RESEARCH.md A3)
- The service mock (`getOrders` / `getCustomers` / `getProductionOrders`) — keep the `jest.mock(...)` but move from "stub the call the component makes" to "stub the call the RSC makes."

---

### `src/app/demo/customers/[id]/page.test.tsx` (in-place addition only)

**Analog:** itself. Add the mockAuth block at the top (lines 1-16 inserted) and add two redirect cases to the existing `describe` block. The 5 existing cases (lines 78-253) all continue to work because they pass the green-path session in `beforeEach`.

**Insert at top** (above line 1 `import { render, screen }`):
```typescript
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }));
```

**Update** the existing `jest.mock('next/navigation', ...)` block (currently lines 5-11) to also export `redirect`:
```typescript
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),                                             // existing
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });      // NEW
  },
  usePathname: jest.fn(() => '/demo/customers/CUST-001'),          // existing
  useRouter: jest.fn(() => ({ push: jest.fn() })),                 // existing
}));
```

**Add to** the existing `beforeEach` (line 79):
```typescript
mockAuth.mockResolvedValue({
  userId: 'u1',
  sessionClaims: { metadata: { role: 'demo' } },
});
```

**Add two new redirect test cases** to the existing `describe('CustomerDetailPage', ...)` (after line 95, before the `partial failure handling` nested describe at line 128):
```typescript
it('redirects to /sign-in when userId is missing', async () => {
  mockAuth.mockResolvedValue({ userId: null, sessionClaims: null });
  await expect(
    CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) })
  ).rejects.toMatchObject({ url: '/sign-in' });
});

it('redirects to / when role is not demo', async () => {
  mockAuth.mockResolvedValue({
    userId: 'u1',
    sessionClaims: { metadata: { role: 'user' } },
  });
  await expect(
    CustomerDetailPage({ params: Promise.resolve({ id: 'CUST-001' }) })
  ).rejects.toMatchObject({ url: '/' });
});
```

---

### `src/components/__tests__/OrdersTable.test.tsx` (drop service-mock shim, render with prop)

**Analog:** itself. Existing file uses `(getOrders as jest.Mock).mockResolvedValue(mockOrders)` + `waitFor(...)` (lines 61, 72-74, etc.). The whole `jest.mock('@/services/orders', ...)` block + every `waitFor` for rendered rows becomes unnecessary — render synchronously from the `orders` prop.

**Before** (existing lines 4-10, 61-72):
```typescript
jest.mock("@/services/orders", () => ({
  getOrders: jest.fn(),
}));
import { getOrders } from "@/services/orders";
// ...
beforeEach(() => {
  jest.clearAllMocks();
  (getOrders as jest.Mock).mockResolvedValue(mockOrders);
});
// later, every test:
render(<OrdersTable selectedOrderId={null} onSelectOrder={jest.fn()} />);
await waitFor(() => { expect(screen.getByText("Producing")).toBeInTheDocument(); });
```

**After:**
```typescript
// REMOVE the jest.mock('@/services/orders', ...) block entirely (lines 4-10).
// REMOVE the import { getOrders } line.
// SIMPLIFY beforeEach:
beforeEach(() => { jest.clearAllMocks(); });
// EVERY render() gains the new prop:
render(<OrdersTable orders={mockOrders} selectedOrderId={null} onSelectOrder={jest.fn()} />);
// DROP every `await waitFor(...)` wrapper — rendering is now synchronous.
expect(screen.getByText("Producing")).toBeInTheDocument();
```

**Token-class assertions** (lines 64-303): preserve verbatim. They key off CSS class names, not data-fetch timing.

---

### `docs/security-patterns.md` (NEW)

**Analog:** `docs/clerk-setup.md` (existing, 5.6KB, the only file in `/docs/`). Use its structural conventions:
- H1 title + one-paragraph intro
- Numbered H2 sections in declared order
- Tables for matrix/decision content (e.g., clerk-setup.md Step 2's user table)
- Fenced code blocks for examples
- Verbatim quotes for citations (mirrors clerk-setup.md's inline JSON template)

**Required sections** (CONTEXT.md D-09, in order):
1. **Audit findings table** — copy the 7-row table verbatim from RESEARCH.md §"Code Examples" Example E (Path / Component type before / Component type after / Data fetch site before / Data fetch site after / Role guard / Notes).
2. **The server-fetch pattern** — embed a code excerpt mirroring `src/app/demo/customers/[id]/page.tsx` lines 1-37 (the canonical RSC shape) **with** `await requireRole('demo')` line inserted at the top of the function body.
3. **Decision table: middleware vs `requireRole` vs `checkRole` vs `<Protect>`** — verbatim from RESEARCH.md Example D (4 rows, exact columns: Helper / Tier / Behavior on failure / When to use).
4. **`<Protect>` is UX, not security** — embed Example C from RESEARCH.md (do/don't snippets). Include verbatim Clerk caveat: *"The `<Show />` component only visually hides its children; the contents remain accessible via the browser's source code even if the user fails authentication or authorization checks."* Link to `.planning/research/PITFALLS.md` §Pitfall 6 (line 179 anchor).
5. **localStorage / browser-state exception** — use `src/app/settings/page.tsx` as the worked example (cite its `useLocalStorage("user-preferences", defaultPreferences)` call at line 18-21 as "browser-state, not data-loading").
6. **Onboarding checklist** for new role-gated pages (a numbered list; each item is one obligation: place `await requireRole(...)` at top of async page; never import `@/lib/auth` from a `'use client'` file; pass data via props to client children; add page-test mock block from `src/lib/auth.test.ts`).

**Style conventions to inherit from clerk-setup.md:**
- Sentence-case headings (`## Step 1: Configure the JWT Template` not Title Case).
- Inline references use backticks for file paths and identifiers (`src/lib/auth.ts`, `requireRole`).
- Notes use the convention `**Note:** ...` rather than callout blocks.

## Shared Patterns

### Pattern S1: Server-side guard placement (every RSC page)
**Source:** `src/lib/auth.ts` lines 67-75 (`requireRole` implementation) + lines 58-65 (JSDoc usage example).
**Apply to:** All four `src/app/demo/**/page.tsx` files (orders, customers, customers/[id], mill-production).
```typescript
// EXACTLY this line, EXACTLY at the top of the async function body, BEFORE any data fetch:
await requireRole('demo');
```
**Critical:** the `await` keyword is non-optional. RESEARCH.md Pitfall 4 spells out the data-leak risk if `await` is missing — TypeScript will not flag it because `requireRole` returns `Promise<void>`.

### Pattern S2: Server-fetch → client-child prop boundary
**Source:** `src/app/demo/customers/[id]/page.tsx` lines 19-35.
**Apply to:** All four `src/app/demo/**/page.tsx` files.
```typescript
// Step 1: await the service call(s) — single or Promise.all.
const data = await getX();                    // single source
// const [a, b, c] = await Promise.all([...]); // multi-source
// Step 2: pass via props to the existing or new client child.
return (
  <DashboardLayout>
    <ClientChild dataX={data} />
  </DashboardLayout>
);
```
**Note:** `DashboardLayout` and `Header` are themselves `'use client';` (confirmed: `src/components/DashboardLayout.tsx` line 1, `src/components/Header.tsx` line 1). This is fine — a Server Component is allowed to render client components as children; the boundary is the prop edge. **Do NOT** add `requireRole` to `DashboardLayout` (Pitfall 1 — server-only import in a client file).

### Pattern S3: Page-test harness (mock auth + redirect-sentinel-throw)
**Source:** `src/lib/auth.test.ts` lines 1-16 (mock placement) + lines 67-89 (redirect-assert cases).
**Apply to:** All four `src/app/demo/**/page.test.tsx` files.
```typescript
// At the very top of the test file, BEFORE any import:
const mockAuth = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({ auth: () => mockAuth() }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
  // ... other next/navigation hooks needed by client children
}));
```
**Critical:** `jest.mock` calls are hoisted by Jest. Place them above all `import` statements (Pattern C). `src/lib/auth.test.ts` lines 1-18 demonstrate the exact ordering — the comment at line 1-5 of that file explains the rationale verbatim and should be cited in the page-test files.

### Pattern S4: Async RSC unit-test invocation
**Source:** `src/app/demo/customers/[id]/page.test.tsx` lines 85-95, 104-110.
**Apply to:** All four `src/app/demo/**/page.test.tsx` files.
```typescript
// Successful render: call the RSC as a function, await the returned element, then render.
const Page = await OrdersPage();
render(Page);
expect(screen.getByText(/.../i)).toBeInTheDocument();

// Redirect path: assert that calling the function rejects with NEXT_REDIRECT sentinel.
await expect(OrdersPage()).rejects.toMatchObject({ url: '/' });
```
**Note:** the `customers/[id]/page.test.tsx` test passes `params: Promise.resolve({ id: '...' })` because that page accepts params. The other three pages take no arguments — call as `OrdersPage()` with no args.

### Pattern S5: Client-component prop-only data flow
**Source:** Post-refactor `src/components/OrdersTable.tsx` signature (see Pattern Assignments above).
**Apply to:** `OrdersTable.tsx`, new `CustomersList.tsx`, new `MillProductionUI.tsx`.
- Props interface lists data array as the first field.
- No `useState<DataArray>([])` initialization.
- No `useEffect(() => getX().then(setX), [])`.
- No `import { getX } from '@/services/...'` — service imports MUST NOT appear in any client component under `/demo/*`.

### Pattern S6: Loading-state decision (no skeleton during data fetch)
**Source:** RESEARCH.md Pitfall 5 + CONTEXT.md Claude's Discretion.
**Apply to:** All four refactored pages.
- Do **not** add a `loading.tsx` next to any of the refactored pages.
- Keep the existing `<Suspense>` boundary in `src/app/demo/orders/page.tsx` (it wraps the `useSearchParams` client child, not the data fetch).
- Drop the `LoadingSkeleton` / `CustomerTableSkeleton` JSX from the refactored client wrappers — they are dead code once data arrives via prop.

## No Analog Found

None. Every new file has at least a role-match analog in the existing codebase.

## Metadata

**Analog search scope:**
- `src/app/demo/**` (all four page directories + their test directories)
- `src/components/` and `src/components/__tests__/` (OrdersTable + tests; layout components; UI primitives)
- `src/lib/auth.ts` + `src/lib/auth.test.ts` (canonical guard utility + test harness)
- `src/middleware.ts` + `src/middleware.test.ts` (ACCESS-01 baseline; do-not-touch reference)
- `src/app/settings/page.tsx` (browser-state exception worked example)
- `docs/clerk-setup.md` (sole existing doc artifact; structural reference)
- `.planning/research/PITFALLS.md` §Pitfall 6 (linked from new doc §4)

**Files scanned:** 14 source files, 9 test files, 1 doc, 1 research artifact.

**Pattern extraction date:** 2026-05-11
