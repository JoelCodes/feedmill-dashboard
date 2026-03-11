# Technology Stack: Dashboard Interactivity

**Project:** CGM Feed Mill Dashboard
**Research Date:** 2026-03-11
**Research Scope:** Interactive data tables, state management, mock data patterns
**Overall Confidence:** MEDIUM (based on training data from Jan 2025, unable to verify current versions)

## Executive Summary

For adding interactivity to an existing Next.js 16 + React 19 + Tailwind CSS 4 dashboard, the recommended stack prioritizes:

1. **TanStack Table v8** - Headless table library for filtering/sorting/searching
2. **Zustand** - Lightweight state management for UI interactions
3. **Mock Service Worker (MSW) v2** - API mocking for mock-first development
4. **React Hook Form + Zod** - Form handling and validation (when needed)

This stack maintains the existing framework choices while adding minimal dependencies focused on specific capabilities.

---

## Recommended Stack

### Data Table Layer

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| @tanstack/react-table | ^8.20.0+ | Headless table with filtering, sorting, searching, row selection | MEDIUM |
| @tanstack/match-sorter-utils | ^8.20.0+ | Fuzzy search utilities for TanStack Table | MEDIUM |

**Why TanStack Table:**
- **Headless architecture** - You control the UI (Tailwind), it handles state/logic
- **Full feature set** - Built-in filtering, sorting, searching, column visibility, row selection
- **TypeScript-first** - Excellent type inference with your order data structure
- **React 19 compatible** - Uses modern React patterns (no class components, hooks-based)
- **Minimal bundle size** - ~14kb minified + gzipped for core table
- **Maintained** - Active development, part of TanStack ecosystem

**Why NOT alternatives:**
- **AG Grid / react-data-grid** - Too heavy, bring their own UI (conflicts with Tailwind design system)
- **Material Table / MUI DataGrid** - Requires Material UI, design system mismatch
- **react-table v7** - Deprecated, replaced by TanStack Table v8
- **Building from scratch** - Sorting/filtering state is complex, TanStack solves this

### State Management

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| zustand | ^5.0.0+ | Lightweight global state for UI interactions (filters, selected rows, panel visibility) | MEDIUM |

**Why Zustand:**
- **Minimal API** - Create stores with simple functions, no providers/wrappers needed
- **TypeScript-native** - Full type safety without extra configuration
- **React 19 compatible** - Uses hooks, no React internals dependencies
- **Tiny bundle** - ~1kb minified + gzipped
- **DevTools integration** - Redux DevTools support for debugging
- **Co-location friendly** - Can create stores per feature, not one global store
- **Server Component safe** - Works with Next.js App Router (client components only)

**Use cases for your dashboard:**
```typescript
// UI state that crosses component boundaries
- Current filter selections (status pills, "has changes" toggle)
- Search query value
- Selected order row(s)
- Order details panel open/closed state
- Active sidebar navigation item
```

**Why NOT alternatives:**
- **Redux Toolkit** - Overkill for dashboard UI state, more boilerplate
- **Jotai** - Atom-based model adds complexity for simple cases
- **Recoil** - Still experimental, Facebook/Meta deprecated it
- **Context API only** - Re-renders entire context consumers, performance issues at scale
- **URL state (searchParams)** - Good for filters that should be shareable, but not for transient UI state like "panel open"

**Recommendation:** Use **both** URL state (via Next.js `useSearchParams`) for shareable filters + Zustand for transient UI state.

### Mock Data Layer

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| msw | ^2.0.0+ | Mock API responses for development | MEDIUM |
| @faker-js/faker | ^9.0.0+ | Generate realistic mock data | MEDIUM |

**Why Mock Service Worker (MSW):**
- **Browser + Node** - Works in development (browser) and tests (Node)
- **Service Worker based** - Intercepts network requests, app code unchanged
- **Seamless transition** - When real API ready, disable MSW, no code changes needed
- **TypeScript-first** - Type-safe request/response handlers
- **Development workflow** - Test different states (loading, errors, edge cases) easily

**Mock pattern for feed mill dashboard:**
```typescript
// src/mocks/handlers.ts
export const handlers = [
  http.get('/api/orders', ({ request }) => {
    // Extract filters from URL params
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const hasChanges = url.searchParams.get('hasChanges')
    const search = url.searchParams.get('search')

    // Filter mock data
    let orders = mockOrders
    if (status) orders = orders.filter(o => o.status === status)
    if (hasChanges) orders = orders.filter(o => o.hasChanges)
    if (search) orders = orders.filter(o =>
      o.customerName.toLowerCase().includes(search.toLowerCase())
    )

    return HttpResponse.json({ orders })
  })
]
```

**Why @faker-js/faker:**
- **Realistic data** - Names, dates, numbers that look real
- **Repeatable** - Seed-based generation for consistent test data
- **TypeScript support** - Full type definitions
- **Active maintenance** - Community fork after faker.js drama

**Why NOT alternatives:**
- **JSON files** - Static, can't test filtering/pagination logic
- **Hard-coded arrays** - Same problem, no dynamic behavior
- **Mirage.js** - More complex API, less active maintenance
- **json-server** - Requires separate process, extra dependency

### Form Handling (Future Milestone)

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| react-hook-form | ^7.53.0+ | Form state and validation | MEDIUM |
| zod | ^3.23.0+ | Schema validation | MEDIUM |
| @hookform/resolvers | ^3.9.0+ | Zod integration for react-hook-form | MEDIUM |

**Note:** Not needed for Milestone 1 (tables are read-only), but listed for future milestones (order editing, filters, settings).

**Why React Hook Form:**
- **Uncontrolled components** - Minimal re-renders, better performance
- **Built-in validation** - Supports schema libraries like Zod
- **TypeScript-first** - Type inference from Zod schemas
- **Small bundle** - ~9kb minified + gzipped
- **React 19 compatible** - No legacy patterns

**Why Zod:**
- **TypeScript-native** - Schema is the source of truth for types
- **Runtime validation** - Catches bad data at runtime
- **Error messages** - Customizable, user-friendly errors
- **Composable** - Build complex schemas from simple ones

### Utility Libraries

| Technology | Version | Purpose | Confidence |
|------------|---------|---------|------------|
| clsx | ^2.1.0+ | Conditional className logic | HIGH |
| tailwind-merge | ^2.5.0+ | Merge Tailwind classes without conflicts | HIGH |
| date-fns | ^4.1.0+ | Date formatting and manipulation | MEDIUM |

**Why clsx:**
- **Tiny** - 228 bytes
- **Simple API** - `clsx('base', { 'active': isActive })`
- **TypeScript support** - Full type definitions

**Why tailwind-merge:**
- **Prevents conflicts** - `twMerge('p-4', 'p-2')` → `'p-2'` (last wins)
- **Essential for component libraries** - When components accept `className` prop
- **Small** - ~10kb minified

**Why date-fns:**
- **Tree-shakeable** - Import only what you need
- **Immutable** - No mutation of date objects
- **TypeScript support** - Full type definitions
- **No locale bundling** - Import locales separately

**Why NOT alternatives:**
- **Moment.js** - Deprecated, large bundle, mutable API
- **Day.js** - Smaller but less features, API compatibility issues
- **Luxon** - Larger bundle, OOP API (less tree-shakeable)

---

## Complete Installation

### Core Interactivity (Milestone 1: Orders Table)

```bash
# Data table
npm install @tanstack/react-table @tanstack/match-sorter-utils

# State management
npm install zustand

# Mock data layer
npm install -D msw @faker-js/faker

# Utilities
npm install clsx tailwind-merge date-fns
```

### Form Handling (Future Milestones)

```bash
npm install react-hook-form zod @hookform/resolvers
```

### TypeScript Types

```bash
npm install -D @types/node
# (already installed, just confirming)
```

---

## Architecture Patterns

### File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Existing
│   └── page.tsx                 # Existing
├── components/
│   ├── ui/                      # Existing (KPICard, OrdersTable, etc.)
│   ├── tables/                  # NEW: Table feature components
│   │   ├── OrdersTable.tsx      # TanStack Table implementation
│   │   ├── columns.tsx          # Column definitions
│   │   └── filters.tsx          # Filter UI components
│   └── orders/                  # NEW: Order-specific components
│       ├── OrderRow.tsx
│       ├── StatusBadge.tsx
│       └── ChangesIndicator.tsx
├── lib/
│   ├── utils.ts                 # clsx + twMerge helper (cn function)
│   └── date.ts                  # date-fns wrappers
├── stores/                       # NEW: Zustand stores
│   ├── useOrdersStore.ts        # Orders table state (filters, selection)
│   └── useUIStore.ts            # Global UI state (panel, sidebar)
├── mocks/                        # NEW: MSW setup
│   ├── browser.ts               # Browser MSW worker
│   ├── handlers.ts              # API handlers
│   └── data/                    # Mock data generators
│       ├── orders.ts
│       └── generators.ts
└── types/
    └── order.ts                  # TypeScript types for order data
```

### Pattern: Headless Table + Tailwind UI

TanStack Table is headless - you control all markup and styling.

```typescript
// components/tables/OrdersTable.tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { columns } from './columns'

export function OrdersTable({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-4 py-3 text-left">
                  {/* Your Tailwind-styled header */}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* Your Tailwind-styled rows */}
        </tbody>
      </table>
    </div>
  )
}
```

### Pattern: Zustand Store

```typescript
// stores/useOrdersStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface OrdersState {
  // State
  selectedOrderId: string | null
  statusFilter: string[]
  showChangesOnly: boolean
  searchQuery: string

  // Actions
  setSelectedOrderId: (id: string | null) => void
  toggleStatusFilter: (status: string) => void
  setShowChangesOnly: (show: boolean) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
}

export const useOrdersStore = create<OrdersState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedOrderId: null,
      statusFilter: [],
      showChangesOnly: false,
      searchQuery: '',

      // Actions
      setSelectedOrderId: (id) => set({ selectedOrderId: id }),
      toggleStatusFilter: (status) =>
        set((state) => ({
          statusFilter: state.statusFilter.includes(status)
            ? state.statusFilter.filter(s => s !== status)
            : [...state.statusFilter, status]
        })),
      setShowChangesOnly: (show) => set({ showChangesOnly: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      clearFilters: () =>
        set({ statusFilter: [], showChangesOnly: false, searchQuery: '' }),
    }),
    { name: 'orders-store' }
  )
)

// Usage in components
function FilterBar() {
  const { statusFilter, toggleStatusFilter } = useOrdersStore()
  // Component re-renders only when statusFilter changes
}
```

### Pattern: Mock Service Worker Setup

```typescript
// mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// app/layout.tsx or app/providers.tsx
'use client'

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    import('@/mocks/browser').then(({ worker }) => {
      worker.start()
    })
  }
}, [])
```

### Pattern: Utility Function (cn)

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  className // Allow prop override
)} />
```

---

## Data Layer Patterns

### Mock-First Development Workflow

1. **Define TypeScript types first** (from Excel data structure)
2. **Create mock data generators** (using Faker.js)
3. **Set up MSW handlers** (simulate API endpoints)
4. **Build UI with mock data** (TanStack Table + Zustand)
5. **Swap to real API** (disable MSW, update fetch calls)

### Transition Strategy: Mock → Real API

**Phase 1: Mock (Current)**
```typescript
// Component fetches from /api/orders
// MSW intercepts and returns mock data
const response = await fetch('/api/orders?status=Pending')
```

**Phase 2: Real API (Future)**
```typescript
// Same component code, no changes
// MSW disabled, Next.js API Route handles request
const response = await fetch('/api/orders?status=Pending')
```

**No code changes needed in components** - API contract stays the same.

### Recommended API Contract

```typescript
// GET /api/orders?status=Pending&hasChanges=true&search=farm
interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  pageSize: number
}

// GET /api/orders/:id
interface OrderResponse {
  order: Order
  timeline: TimelineEvent[]
  changes: OrderChange[]
}
```

---

## Alternatives Considered

### Data Tables

| Library | Recommended | Alternative | Why Not |
|---------|-------------|-------------|---------|
| Data Tables | **TanStack Table v8** | AG Grid | Too heavy (500kb+), brings own UI, commercial license for advanced features |
| Data Tables | **TanStack Table v8** | react-data-grid | Less flexible, brings own styling (conflicts with Tailwind) |
| Data Tables | **TanStack Table v8** | MUI DataGrid | Requires Material UI dependency, design system mismatch |
| Data Tables | **TanStack Table v8** | react-table v7 | Deprecated, replaced by TanStack Table v8 |
| Data Tables | **TanStack Table v8** | Custom from scratch | Reinventing complex state management (sorting, filtering, selection) |

### State Management

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI State | **Zustand** | Redux Toolkit | Too much boilerplate for simple UI state |
| UI State | **Zustand** | Jotai | Atom-based model adds complexity for straightforward state |
| UI State | **Zustand** | Recoil | Experimental status, Meta deprecated it |
| UI State | **Zustand** | Context API only | Re-render performance issues, no DevTools |
| UI State | **Zustand** | Valtio | Proxy-based reactivity can be confusing, less ecosystem support |

### Mock Data

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| API Mocking | **MSW v2** | JSON files | Static data, can't test filtering/pagination |
| API Mocking | **MSW v2** | Mirage.js | Less active maintenance, more complex API |
| API Mocking | **MSW v2** | json-server | Separate process, extra dependency |
| API Mocking | **MSW v2** | Next.js API Routes with hardcoded data | Mixes mock logic with real API code, harder to remove |
| Data Generation | **@faker-js/faker** | chance.js | Less active, smaller API surface |
| Data Generation | **@faker-js/faker** | casual | Abandoned, no TypeScript support |

### Date Handling

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Date Utils | **date-fns** | Moment.js | Deprecated, large bundle (67kb), mutable API |
| Date Utils | **date-fns** | Day.js | Less features, API compatibility edge cases |
| Date Utils | **date-fns** | Luxon | Larger bundle, OOP API less tree-shakeable |
| Date Utils | **date-fns** | Native Intl | Good for formatting, lacks manipulation utilities |

---

## Version Verification Status

**Confidence Level Legend:**
- **HIGH** = Verified with official docs or Context7
- **MEDIUM** = Based on training data (Jan 2025), likely current but unverified
- **LOW** = Uncertain, needs verification

| Library | Specified Version | Confidence | Notes |
|---------|------------------|------------|-------|
| @tanstack/react-table | ^8.20.0+ | MEDIUM | v8.x stable as of Jan 2025, React 19 compatibility likely |
| zustand | ^5.0.0+ | MEDIUM | v5.x released 2024, React 19 compatible |
| msw | ^2.0.0+ | MEDIUM | v2.x stable as of Jan 2025, major rewrite from v1 |
| @faker-js/faker | ^9.0.0+ | MEDIUM | Active fork, v9.x as of Jan 2025 |
| react-hook-form | ^7.53.0+ | MEDIUM | v7.x stable, React 19 compatible |
| zod | ^3.23.0+ | MEDIUM | v3.x stable, widely used |
| clsx | ^2.1.0+ | HIGH | Tiny utility, stable API |
| tailwind-merge | ^2.5.0+ | MEDIUM | v2.x stable |
| date-fns | ^4.1.0+ | MEDIUM | v4.x released 2024 |

**Research Limitation:** Web search and documentation fetch tools were unavailable during this research session. Recommendations are based on training data current through January 2025. Versions should be verified against official documentation before installation.

**Recommended verification steps:**
1. Check npm for latest versions: `npm view <package> version`
2. Verify React 19 compatibility in each library's changelog
3. Review TanStack Table migration guide if coming from react-table v7

---

## Dependencies Summary

### Production Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.20.0",
    "@tanstack/match-sorter-utils": "^8.20.0",
    "zustand": "^5.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "date-fns": "^4.1.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "msw": "^2.0.0",
    "@faker-js/faker": "^9.0.0"
  }
}
```

### Optional (Future Milestones)

```json
{
  "dependencies": {
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0"
  }
}
```

**Total bundle size impact (estimated):**
- TanStack Table: ~14kb
- Zustand: ~1kb
- clsx: <1kb
- tailwind-merge: ~10kb
- date-fns: ~10kb (tree-shakeable, varies by usage)
- **Total: ~36kb minified + gzipped**

MSW and Faker.js are dev dependencies, not included in production bundle.

---

## Integration Checklist

Before implementing Milestone 1, verify:

- [ ] All package versions compatible with React 19.2.3
- [ ] TanStack Table supports TypeScript 5.x (already in project)
- [ ] Zustand works with Next.js 16 App Router (client components)
- [ ] MSW v2 setup works in Next.js development mode
- [ ] date-fns locale loading strategy (if internationalization needed)

---

## Sources

**Note:** This research was conducted using training data current through January 2025. Web search and documentation fetch tools were unavailable during this research session.

**Primary Sources (training data):**
- TanStack Table official documentation (tanstack.com/table)
- Zustand GitHub repository (github.com/pmndrs/zustand)
- MSW official documentation (mswjs.io)
- React 19 release notes and documentation
- Next.js 16 documentation

**Confidence Assessment:**
- Stack recommendations: **MEDIUM** - Based on stable patterns and library ecosystems as of Jan 2025
- Version numbers: **MEDIUM** - Versions current as of Jan 2025, may have newer releases
- React 19 compatibility: **MEDIUM** - Libraries listed were React 19 compatible or planning compatibility as of Jan 2025

**Recommended verification:**
- Check npm registry for latest versions
- Review each library's changelog for React 19 compatibility confirmation
- Test installation in your Next.js 16 + React 19 environment

---

*Research completed: 2026-03-11*
*Research confidence: MEDIUM (training data based, verification recommended)*
*Downstream: Feeds into roadmap creation for Milestone 1 (Orders Table) and beyond*
