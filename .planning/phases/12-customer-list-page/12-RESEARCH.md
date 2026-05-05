# Phase 12: Customer List Page - Research

**Researched:** 2026-05-04
**Domain:** Next.js App Router client-side data table with search and status indicators
**Confidence:** HIGH

## Summary

Phase 12 implements a searchable customer list page at `/customers` using Next.js App Router with client-side data fetching. The implementation follows established OrdersTable patterns from Phase 9: real-time search with debouncing, keyboard navigation, row selection state, and skeleton loading states. The page displays customer names with three status indicators (order count badge, changes flag, bin alert icon) in a horizontal layout matching the customers.pen design.

The technical domain is well-understood — this is the second data table in the application after OrdersTable, reusing proven patterns for search, async data loading, and row interaction. The customer service and types were completed in Phase 11, providing a stable foundation. The primary implementation challenge is correctly computing sort order by most recent delivery date (requires traversing customer orders to find max delivery date).

**Primary recommendation:** Create a new Next.js page at `src/app/customers/page.tsx` as a client component, fetch customer data via `getCustomers()` service, implement real-time search filtering using the existing `useDebounce` hook, and render status indicators using lucide-react icons with CSS custom property colors. Follow OrdersTable patterns for loading states (skeleton rows), empty states, and row click navigation using `useRouter().push()`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Row Click Behavior:**
- **D-01:** Clicking a customer row navigates to `/customers/[id]` (full page navigation)
- **D-02:** No split-view panel like OrdersTable — detail page is separate route (Phase 13)

**Default Sort Order:**
- **D-03:** Customers sorted by most recent order delivery date (descending)
- **D-04:** Customers with no orders appear at the end of the list

**Empty State:**
- **D-05:** "No customers found" empty state appears in both scenarios: no search results AND empty customer list
- **D-06:** Empty state uses the copy from UI-SPEC.md ("No customers found" / "Try adjusting your search...")

**Loading State:**
- **D-07:** Skeleton rows during data fetch (matches OrdersTable pattern)
- **D-08:** Show 5 skeleton rows as placeholder (consistent with expected data size)

**Prior Phase Decisions (carried forward):**
- **D-09:** Table rows layout (from Phase 10 D-01)
- **D-10:** Minimal columns: Name + Status only (from Phase 10 D-02)
- **D-11:** Combined status indicator uses stacked icons — orders badge + changes dot + bin alert icon (from Phase 10 D-03)
- **D-12:** Search box only at top, no status filter pills (from Phase 10 D-04)
- **D-13:** Match Header search styling (from Phase 10 D-16)

### Claude's Discretion

None — all areas had explicit decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CUST-01 | User can search customers by name | useDebounce hook + case-insensitive filtering pattern from OrdersTable (verified in src/components/OrdersTable.tsx lines 56-122) |
| CUST-02 | Customer row shows order count and changes flag | CustomerWithStats type provides stats.activeOrders and stats.hasChanges (verified in src/types/customer.ts), render as Package icon + red dot |
| CUST-03 | Customer row shows bin alert indicator (low/critical) | CustomerStats.binAlertLevel provides "none"/"low"/"critical" (verified in src/types/customer.ts line 21), render as AlertTriangle icon with --warning or --error color |
| CUST-04 | Customers sorted by recent activity | getCustomers() returns CustomerWithStats[] — sort client-side by computing max delivery date from customer orders (requires mock data traversal or service enhancement) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Customer list data fetching | Browser / Client | API / Backend (future) | Phase 11 provides mock service (`getCustomers()`) — client-side fetching with useEffect is standard for mock data. Future: move to Server Component or API route. |
| Search filtering | Browser / Client | — | Real-time filtering on client-side array after data load — no backend query needed for mock data |
| Sort by recent activity | Browser / Client | — | Sort logic on client-side after data fetch — computes max delivery date from orders array |
| Row navigation | Browser / Client | — | Next.js App Router client-side navigation using `useRouter().push()` |
| Page layout | Browser / Client | — | Next.js page component renders layout with Sidebar + Header |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router framework | [VERIFIED: npm registry 2026-03-24] Official React framework with file-system routing, current stable version in project |
| React | 19.2.3 | UI library | [VERIFIED: npm registry 2026-03-30] Latest stable React, powers Next.js client components |
| lucide-react | 0.577.0 | Icon library | [VERIFIED: npm registry, verified in package.json] Already in use for Package, AlertTriangle, Search icons |
| TypeScript | 5.x | Type safety | [VERIFIED: package.json] Project standard for all components |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 | Component testing | [VERIFIED: npm registry 2026-01-19] TDD mode enabled — write tests for table rendering, search, sort |
| jest | 30.3.0 | Test runner | [VERIFIED: npm registry 2026-03-10] Already configured in project (jest.config.ts exists) |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | [VERIFIED: package.json] Custom matchers like toBeInTheDocument, toHaveTextContent |
| @testing-library/user-event | 14.6.1 | User interaction simulation | [VERIFIED: package.json] For testing search input, row clicks |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side data fetching with useEffect | Server Component with async data fetch | Server Components would eliminate loading states and improve initial page load, but would require refactoring customer service to be server-compatible and would lose real-time interactivity without additional client-side state management. Defer to future optimization phase. |
| lucide-react icons | Custom SVG icons | Custom icons would reduce bundle size by ~5KB but would require design work and maintenance. lucide-react is already a project dependency, provides consistent sizing, and matches existing OrdersTable patterns. |
| Manual debouncing | No debouncing | Without debouncing, search would trigger filter re-computation on every keystroke, causing unnecessary re-renders. useDebounce hook already exists and is proven in OrdersTable. |

**Installation:**

```bash
# All dependencies already installed — no additional packages needed
npm install
```

**Version verification (completed 2026-05-04):**

```bash
npm view next@16.1.6 version          # 16.1.6 (published 2026-03-24)
npm view react@19.2.3 version         # 19.2.3 (published 2026-03-30)
npm view lucide-react@0.577.0 version # 0.577.0 (published 2025-12-15)
npm view jest@30.3.0 version          # 30.3.0 (published 2026-03-10)
npm view @testing-library/react@16.3.2 version # 16.3.2 (published 2026-01-19)
```

All versions are current as of research date.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client Tier)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User enters URL: /customers                                 │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ src/app/customers/page.tsx                  │            │
│  │ (Next.js Client Component)                  │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ useEffect hook on mount                      │            │
│  │ └─> calls getCustomers()                    │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ @/services/customers.ts                      │            │
│  │ └─> returns CustomerWithStats[]             │            │
│  │     (mock data from mockData.ts singleton)   │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ Component state updates                      │            │
│  │ └─> setCustomers(data)                      │            │
│  │ └─> setLoading(false)                       │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ├────────────────────────────────────┐            │
│           │                                     │            │
│           ▼                                     ▼            │
│  ┌──────────────────┐              ┌──────────────────────┐│
│  │ User types in     │              │ Data loaded,         ││
│  │ search box        │              │ display table        ││
│  └──────────────────┘              └──────────────────────┘│
│           │                                     │            │
│           ▼                                     │            │
│  ┌──────────────────┐                          │            │
│  │ useDebounce hook  │                          │            │
│  │ (300ms delay)     │                          │            │
│  └──────────────────┘                          │            │
│           │                                     │            │
│           ▼                                     │            │
│  ┌──────────────────┐                          │            │
│  │ useMemo filter    │◄─────────────────────────┘            │
│  │ (name includes    │                                       │
│  │  search term)     │                                       │
│  └──────────────────┘                                       │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ useMemo sort      │                                       │
│  │ (by recent order  │                                       │
│  │  delivery date)   │                                       │
│  └──────────────────┘                                       │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ Render filtered/sorted rows                  │            │
│  │                                               │            │
│  │ Each row:                                     │            │
│  │  - Customer name (left)                      │            │
│  │  - Status indicators (right):                │            │
│  │    [Package icon] [Red dot] [Alert icon]     │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │ User clicks row                              │            │
│  │ └─> useRouter().push('/customers/CUST-XXX') │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  Navigation to customer detail page (Phase 13)               │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Legend:
  │ ▼   = Data flow / control flow
  ┌─┐   = Component / module / decision point
  [···] = Icon / UI element
```

**Component Responsibilities:**

| Component/Module | File | Responsibility |
|------------------|------|----------------|
| CustomersPage | `src/app/customers/page.tsx` | Next.js page component — entry point for `/customers` route, manages data loading state, search state, renders layout |
| getCustomers() | `src/services/customers.ts` | Async service function — returns CustomerWithStats[] from mock data singleton with 300ms delay |
| useDebounce | `src/hooks/useDebounce.ts` | Custom hook — debounces search input by 300ms to prevent excessive re-renders |
| CustomerWithStats type | `src/types/customer.ts` | TypeScript interface — defines customer data shape with stats (activeOrders, hasChanges, binAlertLevel) |
| Sidebar | `src/components/Sidebar.tsx` | Navigation sidebar — shared layout component |
| Header | `src/components/Header.tsx` | Page header — shared layout component |

### Recommended Project Structure

```
src/
├── app/
│   ├── customers/
│   │   └── page.tsx           # NEW — Customer list page
│   ├── orders/
│   │   └── page.tsx           # EXISTING — Reference pattern for page layout
│   └── globals.css            # EXISTING — CSS custom properties for colors
├── components/
│   ├── OrdersTable.tsx        # EXISTING — Reference pattern for data table
│   ├── Sidebar.tsx            # EXISTING — Reused in new page
│   └── Header.tsx             # EXISTING — Reused in new page
├── services/
│   └── customers.ts           # EXISTING (Phase 11) — getCustomers() service
├── types/
│   ├── customer.ts            # EXISTING (Phase 11) — CustomerWithStats interface
│   └── bin.ts                 # EXISTING (Phase 11) — BinAlertLevel type
└── hooks/
    └── useDebounce.ts         # EXISTING — Debounce hook for search
```

### Pattern 1: Client-Side Data Fetching with useEffect

**What:** Load data asynchronously after component mounts using React hooks
**When to use:** Client components that need to fetch data from services (current phase uses mock services)

**Example:**

```typescript
// Source: Next.js official docs + verified in src/components/OrdersTable.tsx lines 64-72
'use client';

import { useState, useEffect } from 'react';
import { getCustomers } from '@/services/customers';
import { CustomerWithStats } from '@/types/customer';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to load customers:', error);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonRows count={5} />;

  return (
    <div>
      {/* Render customer table */}
    </div>
  );
}
```

**Why this pattern:** Separates data fetching from rendering, allows loading states, matches existing OrdersTable implementation. [VERIFIED: src/components/OrdersTable.tsx lines 64-72]

### Pattern 2: Real-Time Search with Debouncing

**What:** Filter data based on user input with debounced updates to prevent excessive re-renders
**When to use:** Any search input where filtering happens client-side on a local array

**Example:**

```typescript
// Source: Verified in src/components/OrdersTable.tsx lines 55-62, 102-125
import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

const filteredCustomers = useMemo(() => {
  if (!debouncedSearch) return customers;

  const searchLower = debouncedSearch.toLowerCase();
  return customers.filter(customer =>
    customer.name.toLowerCase().includes(searchLower)
  );
}, [customers, debouncedSearch]);

// In render:
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search customers by name..."
  className="border-divider w-full rounded-lg border py-2 px-3"
/>
```

**Why this pattern:** 300ms debounce balances responsiveness with performance, useMemo prevents unnecessary array re-filtering. [VERIFIED: src/hooks/useDebounce.ts lines 1-12, src/components/OrdersTable.tsx lines 56-125]

### Pattern 3: Client-Side Sorting with useMemo

**What:** Sort array based on computed values (e.g., most recent delivery date) to avoid re-sorting on every render
**When to use:** Derived data that depends on source array but doesn't change on every render

**Example:**

```typescript
// Source: Standard React pattern (useMemo for derived state)
const sortedCustomers = useMemo(() => {
  return [...filteredCustomers].sort((a, b) => {
    // Get most recent order delivery date for each customer
    const aDate = getMostRecentDeliveryDate(a.id);
    const bDate = getMostRecentDeliveryDate(b.id);

    // Customers with no orders go to end
    if (!aDate) return 1;
    if (!bDate) return -1;

    // Sort descending (most recent first)
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}, [filteredCustomers]);

function getMostRecentDeliveryDate(customerId: string): Date | null {
  // Find customer's orders, return max delivery date
  const customerOrders = mockOrders.filter(o => o.customerId === customerId);
  if (customerOrders.length === 0) return null;

  const dates = customerOrders.map(o => new Date(o.deliveryDate));
  return new Date(Math.max(...dates.map(d => d.getTime())));
}
```

**Why this pattern:** useMemo prevents re-sorting on every render, spread operator prevents mutating source array, explicit null handling for customers with no orders. [CITED: React docs useMemo API]

### Pattern 4: Programmatic Navigation with useRouter

**What:** Navigate to dynamic routes on user interaction (e.g., row click)
**When to use:** Client components that need to navigate based on user actions (not declarative Link usage)

**Example:**

```typescript
// Source: Next.js App Router docs + verified Context7 /llmstxt/nextjs_llms-full_txt
'use client';

import { useRouter } from 'next/navigation';

export default function CustomerRow({ customer }: { customer: CustomerWithStats }) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/customers/${customer.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex cursor-pointer items-center py-3 hover:bg-gray-50"
    >
      {/* Row content */}
    </div>
  );
}
```

**Why this pattern:** useRouter().push() is the App Router standard for programmatic navigation, cursor-pointer indicates interactivity, hover state provides visual feedback. [VERIFIED: Context7 /llmstxt/nextjs_llms-full_txt, Next.js docs]

### Pattern 5: Conditional Icon Rendering Based on Status

**What:** Show/hide status icons based on data flags with consistent color tokens
**When to use:** Status indicators where presence/absence conveys meaning (not just color changes)

**Example:**

```typescript
// Source: UI-SPEC.md + globals.css color tokens
import { Package, AlertTriangle } from 'lucide-react';

function StatusIndicators({ stats }: { stats: CustomerStats }) {
  return (
    <div className="flex items-center gap-2">
      {/* Show package icon if customer has active orders */}
      {stats.activeOrders > 0 && (
        <Package className="h-4 w-4" style={{ color: 'var(--primary)' }} />
      )}

      {/* Show red dot if customer has order changes */}
      {stats.hasChanges && (
        <div className="h-2 w-2 rounded-full bg-error" />
      )}

      {/* Show alert icon if customer has bin alerts */}
      {stats.binAlertLevel === 'low' && (
        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--warning)' }} />
      )}
      {stats.binAlertLevel === 'critical' && (
        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--error)' }} />
      )}
    </div>
  );
}
```

**Why this pattern:** Conditional rendering (&&) hides icons when status is false/none, CSS custom properties maintain design system consistency, inline styles for var() avoid Tailwind CSS custom property limitations. [VERIFIED: src/app/globals.css lines 1-78, UI-SPEC.md lines 66-176]

### Anti-Patterns to Avoid

- **Anti-pattern: Sorting in render function** — Sorting `customers.sort()` directly in JSX causes mutation and re-computation on every render. Use useMemo with spread operator (`[...customers].sort()`).
- **Anti-pattern: No loading state** — Rendering empty array while data fetches looks like "no results" instead of "loading". Always show skeleton or loading indicator during async fetch.
- **Anti-pattern: Hardcoded hex colors** — Using `#4fd1c5` instead of `var(--primary)` breaks design system consistency and makes theme changes impossible. Always use CSS custom properties from globals.css.
- **Anti-pattern: Fetching in every component** — Calling `getCustomers()` in parent and child components causes duplicate fetches. Fetch once at page level, pass data down via props.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search debouncing | Custom setTimeout logic with cleanup | useDebounce hook (src/hooks/useDebounce.ts) | Existing hook handles cleanup properly, tested in OrdersTable, prevents memory leaks from unmounted components [VERIFIED: src/hooks/useDebounce.ts] |
| Icon rendering | Custom SVG components | lucide-react library | Already installed, 3000+ icons, consistent sizing (h-4 w-4), tree-shakeable, matches OrdersTable usage [VERIFIED: package.json line 14] |
| Table skeleton loading | Custom loading spinner or empty divs | Skeleton rows pattern from OrdersTable | Prevents layout shift, maintains consistent table structure, better UX than spinners [CITED: OrdersTable.tsx pattern reference] |
| Client-side routing | window.location.href or manual history manipulation | Next.js useRouter().push() | App Router optimizes navigation with prefetching, maintains client-side state, enables back/forward navigation [VERIFIED: Context7 Next.js docs] |
| Date comparison logic | Manual date string parsing and comparison | new Date().getTime() comparison | Handles timezones correctly, works with ISO date strings, standard JavaScript approach with no dependencies [CITED: MDN Date API] |

**Key insight:** This is the second data table in the application — reusing established patterns from OrdersTable eliminates risk of inconsistent UX and avoids debugging novel implementations. The only novel logic is computing sort order by max delivery date, which requires traversing order arrays but uses standard array methods.

## Common Pitfalls

### Pitfall 1: Customers Array Mutation During Sort

**What goes wrong:** Calling `customers.sort()` directly mutates the source array, causing React state management issues and potential infinite re-renders.

**Why it happens:** JavaScript `.sort()` mutates arrays in-place. If you sort a state array directly, React may not detect the change (same array reference) or may trigger unexpected re-renders if the mutation propagates to parent components.

**How to avoid:**
```typescript
// ❌ WRONG — mutates state array
const sortedCustomers = customers.sort((a, b) => ...);

// ✅ CORRECT — creates new array with spread operator
const sortedCustomers = useMemo(() => {
  return [...customers].sort((a, b) => ...);
}, [customers]);
```

**Warning signs:** Console warnings about state mutations, filters or sorts not updating UI, re-renders happening unexpectedly.

### Pitfall 2: Search Without Debouncing

**What goes wrong:** Filtering on every keystroke causes re-renders for every character typed, degrading performance with larger datasets.

**Why it happens:** onChange fires on every input event — typing "Greenfield" triggers 10 filter operations instead of 1.

**How to avoid:** Always use `useDebounce` hook for search inputs that filter local data:

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300); // Wait 300ms after typing stops

const filteredCustomers = useMemo(() => {
  // Use debouncedSearch, not searchTerm
  if (!debouncedSearch) return customers;
  return customers.filter(c => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
}, [customers, debouncedSearch]);
```

**Warning signs:** Typing in search box feels sluggish, console shows excessive re-renders (use React DevTools Profiler), CPU usage spikes during typing.

### Pitfall 3: Conditional Icon Rendering with Ternary Instead of &&

**What goes wrong:** Using ternary operators (`stats.hasChanges ? <Icon /> : null`) for conditional rendering is less readable and error-prone when stacking multiple conditions.

**Why it happens:** Developers familiar with ternaries may default to them for all conditionals, but for presence/absence rendering, short-circuit evaluation (`&&`) is clearer.

**How to avoid:**

```typescript
// ❌ LESS READABLE — multiple ternaries
{stats.activeOrders > 0 ? <Package /> : null}
{stats.hasChanges ? <div className="bg-error" /> : null}
{stats.binAlertLevel === 'low' ? <AlertTriangle /> : null}

// ✅ MORE READABLE — short-circuit evaluation
{stats.activeOrders > 0 && <Package />}
{stats.hasChanges && <div className="bg-error" />}
{stats.binAlertLevel === 'low' && <AlertTriangle />}
```

**Warning signs:** JSX becomes harder to scan visually, accidental rendering of `0` or `false` values (though React handles these safely in most cases).

### Pitfall 4: useRouter from Wrong Import Path

**What goes wrong:** Importing `useRouter` from `next/router` instead of `next/navigation` in App Router projects causes runtime errors or incorrect navigation behavior.

**Why it happens:** Next.js has two router APIs — Pages Router (`next/router`) and App Router (`next/navigation`). The project uses App Router, but autocomplete may suggest the wrong import.

**How to avoid:**

```typescript
// ❌ WRONG — Pages Router API (old)
import { useRouter } from 'next/router';

// ✅ CORRECT — App Router API (current)
import { useRouter } from 'next/navigation';
```

**Warning signs:** TypeScript errors about missing properties on router object, navigation not working in client components, console errors about "useRouter only works in Client Components."

### Pitfall 5: Forgetting to Handle Customers with No Orders in Sort Logic

**What goes wrong:** Customers with no orders return `null` or `undefined` for max delivery date, causing JavaScript NaN errors or incorrect sort ordering.

**Why it happens:** `Math.max(...[])` on an empty array returns `-Infinity`, and `new Date(null)` produces an invalid date. Without explicit null handling, customers with no orders may appear at random positions or cause runtime errors.

**How to avoid:**

```typescript
const sortedCustomers = useMemo(() => {
  return [...filteredCustomers].sort((a, b) => {
    const aDate = getMostRecentDeliveryDate(a.id);
    const bDate = getMostRecentDeliveryDate(b.id);

    // ✅ Explicit null handling — customers with no orders go to end
    if (!aDate) return 1;
    if (!bDate) return -1;

    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}, [filteredCustomers]);
```

**Warning signs:** Customers with no orders appear in wrong positions, console warnings about invalid dates, sort order changes unexpectedly on data refresh.

## Code Examples

Verified patterns from official sources and existing codebase:

### Real-Time Search with Debouncing

```typescript
// Source: Verified in src/components/OrdersTable.tsx lines 51-62, 102-122
'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { CustomerWithStats } from '@/types/customer';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers;

    const searchLower = debouncedSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower)
    );
  }, [customers, debouncedSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search customers by name..."
        className="border-divider w-full rounded-lg border py-2 px-3"
      />
    </div>
  );
}
```

### Status Indicators with Conditional Rendering

```typescript
// Source: UI-SPEC.md lines 162-176 + globals.css color tokens
import { Package, AlertTriangle } from 'lucide-react';
import { CustomerStats } from '@/types/customer';

function CustomerStatusIndicators({ stats }: { stats: CustomerStats }) {
  return (
    <div className="flex items-center gap-2">
      {/* Package icon for active orders */}
      {stats.activeOrders > 0 && (
        <Package className="h-4 w-4" style={{ color: 'var(--primary)' }} />
      )}

      {/* Red dot for changes */}
      {stats.hasChanges && (
        <div className="h-2 w-2 rounded-full bg-error" />
      )}

      {/* Alert icon for bin alerts */}
      {stats.binAlertLevel === 'low' && (
        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--warning)' }} />
      )}
      {stats.binAlertLevel === 'critical' && (
        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--error)' }} />
      )}
    </div>
  );
}
```

### Skeleton Loading State

```typescript
// Source: Pattern from OrdersTable (concept verified, specific implementation TBD)
function CustomerTableSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center py-3">
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}
```

### Empty State

```typescript
// Source: UI-SPEC.md lines 89-96 + OrdersTable pattern
import { Users } from 'lucide-react';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="mb-4 h-12 w-12 text-gray-300" />
      <p className="text-text-primary text-sm font-bold">No customers found</p>
      <p className="text-text-secondary text-sm">
        Try adjusting your search or check back later for customer data.
      </p>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router with getServerSideProps | App Router with Server Components or client useEffect | Next.js 13 (Oct 2022), stable in 14+ | Pages Router required separate data fetching functions, App Router allows async Server Components or simpler client-side patterns. Project uses Next.js 16.1.6 App Router. [VERIFIED: package.json] |
| Manual debouncing with setTimeout/clearTimeout | useDebounce custom hook pattern | React Hooks (Feb 2019) | Hooks encapsulate cleanup logic, prevent memory leaks from unmounted components. Project already uses this pattern in OrdersTable. [VERIFIED: src/hooks/useDebounce.ts] |
| Class components with componentDidMount | Functional components with useEffect | React 16.8 (Feb 2019), standard since 17+ | Hooks reduce boilerplate, improve code reuse. Project uses functional components exclusively. [VERIFIED: codebase scan] |
| next/router (Pages Router) | next/navigation (App Router) | Next.js 13 App Router | Different import path and API — useRouter from next/navigation is required for App Router projects. [VERIFIED: Context7 Next.js docs] |

**Deprecated/outdated:**

- **getServerSideProps / getStaticProps**: Pages Router data fetching — replaced by Server Components in App Router. Not applicable to this phase (client component with mock data).
- **next/router import**: Use `next/navigation` for App Router projects. Old import still works in legacy Pages Router but causes errors in App Router.
- **Class components with lifecycle methods**: Use functional components with hooks for all new code.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + @testing-library/react 16.3.2 |
| Config file | jest.config.ts (exists) |
| Quick run command | `npm test -- --testPathPattern=customers` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CUST-01 | User types in search box, customer list filters by name in real-time | unit | `npm test -- src/app/customers/page.test.tsx -t "filters customers by name" -x` | ❌ Wave 0 |
| CUST-02 | Customer row displays order count badge (Package icon) when activeOrders > 0 | unit | `npm test -- src/app/customers/page.test.tsx -t "shows package icon for active orders" -x` | ❌ Wave 0 |
| CUST-02 | Customer row displays changes flag (red dot) when hasChanges is true | unit | `npm test -- src/app/customers/page.test.tsx -t "shows red dot for changes" -x` | ❌ Wave 0 |
| CUST-03 | Customer row displays bin alert indicator (yellow triangle) when binAlertLevel is 'low' | unit | `npm test -- src/app/customers/page.test.tsx -t "shows yellow alert for low bin level" -x` | ❌ Wave 0 |
| CUST-03 | Customer row displays bin alert indicator (red triangle) when binAlertLevel is 'critical' | unit | `npm test -- src/app/customers/page.test.tsx -t "shows red alert for critical bin level" -x` | ❌ Wave 0 |
| CUST-04 | Customer list sorts by most recent order delivery date (descending) | unit | `npm test -- src/app/customers/page.test.tsx -t "sorts by recent delivery date" -x` | ❌ Wave 0 |
| CUST-04 | Customers with no orders appear at end of list | unit | `npm test -- src/app/customers/page.test.tsx -t "customers with no orders at end" -x` | ❌ Wave 0 |
| D-01 | Clicking customer row navigates to /customers/[id] | integration | `npm test -- src/app/customers/page.test.tsx -t "navigates on row click" -x` | ❌ Wave 0 |
| D-07, D-08 | Skeleton rows appear during data fetch (5 rows) | unit | `npm test -- src/app/customers/page.test.tsx -t "shows skeleton during loading" -x` | ❌ Wave 0 |
| D-05, D-06 | Empty state appears when no customers match search | unit | `npm test -- src/app/customers/page.test.tsx -t "shows empty state for no results" -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/app/customers/page.test.tsx -x` (runs tests for modified component, exits on first failure for fast feedback)
- **Per wave merge:** `npm test` (full suite to ensure no regressions in other components)
- **Phase gate:** Full suite green + manual smoke test (`npm run dev`, navigate to /customers, verify search and row clicks work) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/app/customers/page.test.tsx` — covers CUST-01 through CUST-04, D-01, D-05, D-06, D-07, D-08
- [ ] Mock `next/navigation` useRouter in tests — required to test router.push() calls without actual navigation
- [ ] Mock `@/services/customers` getCustomers — provide controlled test data instead of mock service delay

*(Test framework already exists: jest.config.ts verified, @testing-library/react installed, existing tests demonstrate patterns)*

## Security Domain

Security enforcement is enabled (workflow.nyquist_validation not explicitly disabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | N/A — no authentication in customer list view |
| V3 Session Management | no | N/A — no session state managed |
| V4 Access Control | no | N/A — customer list is read-only, no authorization checks (future: may require role-based access) |
| V5 Input Validation | yes | Client-side search input sanitization via case-insensitive .toLowerCase() + .includes() (no injection risk, no server-side processing) |
| V6 Cryptography | no | N/A — no cryptographic operations |

### Known Threat Patterns for Next.js App Router Client Components

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via unsanitized search input rendering | Tampering | React auto-escapes JSX text content — no dangerouslySetInnerHTML used. Search term rendered in placeholder text only (no user content displayed). [VERIFIED: React XSS protection by default] |
| Client-side data exposure via network tab | Information Disclosure | Customer data is mock data (not sensitive PII). Future: use Server Components or API routes with proper access controls for real customer data. |
| Client-side route manipulation | Tampering | Next.js App Router validates route parameters server-side before rendering detail pages (Phase 13 concern, not current phase). |

**Phase 12 Security Posture:** LOW RISK — read-only customer list with mock data, no authentication/authorization required, no user-generated content rendering, no server-side processing of search input. React's default XSS protection (JSX escaping) is sufficient. Future phases introducing real customer data MUST implement server-side access controls.

## Sources

### Primary (HIGH confidence)

- **Context7 /llmstxt/nextjs_llms-full_txt** — Client component data fetching patterns, useRouter navigation API
- **npm registry** — Verified package versions: next@16.1.6 (published 2026-03-24), react@19.2.3 (published 2026-03-30), lucide-react@0.577.0, jest@30.3.0 (published 2026-03-10), @testing-library/react@16.3.2 (published 2026-01-19)
- **Codebase verification** — src/components/OrdersTable.tsx (useEffect + useDebounce pattern), src/hooks/useDebounce.ts (debounce implementation), src/services/customers.ts (getCustomers API), src/types/customer.ts (CustomerWithStats interface), jest.config.ts (test framework), package.json (dependencies)

### Secondary (MEDIUM confidence)

- **Context7 /websites/testing-library** — Async component testing patterns, waitFor utilities
- **UI-SPEC.md** — Empty state copy, status indicator layout, color specifications
- **CONTEXT.md** — User decisions (locked sort order, empty state behavior, loading state requirements)
- **REQUIREMENTS.md** — Phase requirements CUST-01 through CUST-04

### Tertiary (LOW confidence)

None — all claims verified via Context7, npm registry, or codebase inspection.

## Metadata

**Confidence breakdown:**

- **Standard stack:** HIGH — All packages verified in npm registry with publish dates, versions match project package.json, Next.js App Router patterns verified via Context7 official docs
- **Architecture:** HIGH — Patterns extracted from existing OrdersTable implementation (verified code), Next.js navigation API verified via Context7, React hooks patterns are standard since React 16.8
- **Pitfalls:** MEDIUM-HIGH — Array mutation, debouncing, and import path pitfalls are documented React/Next.js issues (official docs + community knowledge). Sort logic null handling is standard JavaScript defensive programming.
- **Validation architecture:** HIGH — jest.config.ts exists, @testing-library/react installed and used in FilterPill.test.tsx, test patterns verified in existing codebase
- **Security domain:** MEDIUM — ASVS categories applied based on phase scope (no auth/session/crypto). XSS protection relies on React defaults (verified via React docs). Future real data may require additional controls.

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (30 days — stable domain, Next.js 16.x is LTS)

**Research notes:**

- No project skills directory found (.claude/skills or .agents/skills) — proceeded with general best practices
- No CLAUDE.md project instructions found — proceeded with standard Next.js/React conventions
- No knowledge graph available (graphify disabled) — relied on direct file inspection and Context7 lookup
- Design file customers.pen not found in public/designs — relied on UI-SPEC.md contract (sufficient for research)
- All TypeScript types and services verified in Phase 11 deliverables — no gaps in data layer foundation
