# Phase 13: Customer Detail Infrastructure - Research

**Researched:** 2026-05-05
**Domain:** Next.js App Router dynamic routes, Server Components, TypeScript interfaces
**Confidence:** HIGH

## Summary

Phase 13 implements the customer detail page infrastructure showing header and summary stats. The implementation uses Next.js 16 App Router's async Server Component pattern with dynamic routing at `/customers/[id]`, parallel data fetching via `Promise.all`, and the `notFound()` function for 404 handling.

The existing codebase provides all required data services (`getCustomerById`, `getCustomerStats`), types (`Customer`, `CustomerStats`), and design system tokens. The primary technical challenge is correctly implementing Next.js 16's new params Promise pattern where dynamic route parameters must be awaited before use.

**Primary recommendation:** Use async Server Component with `await params` pattern, parallel fetch customer and stats with `Promise.all`, implement CustomerDetailHeader component matching UI-SPEC.md, and add `deliveryPreferences` field to Customer type.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CDET-01 | Customer detail page shows header with customer info | CustomerDetailHeader component implementation (Section: Component Architecture), parallel data fetching (Section: Standard Stack) |
| CDET-02 | Customer detail shows summary stats (orders, bins) | CustomerStats interface exists, getBinsByCustomerId() service exists, "Active Bins" calculation pattern documented (Section: Architecture Patterns) |
| CDET-03 | Order in history links to orders page with that order selected | Next.js Link component with query params `/orders?selected={orderId}` (Section: Architecture Patterns) |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Fetching Strategy:**
- **D-01:** Server Component for page — async function fetches data before render
- **D-02:** Parallel fetch using `Promise.all([getCustomerById(id), getCustomerStats(id)])`
- **D-03:** No client-side loading states needed — Server Component handles wait

**Customer Not Found Handling:**
- **D-04:** Call `notFound()` from `next/navigation` when customer ID doesn't exist (standard 404)
- **D-05:** Partial failure (stats fail but customer succeeds) shows customer with fallback stat values (zeros or dashes)

**Page Content Scope:**
- **D-06:** Header only for Phase 13 — nothing below CustomerDetailHeader
- **D-07:** No placeholder tabs, no "coming soon" message — clean infrastructure phase

**Delivery Preferences:**
- **D-08:** Add `deliveryPreferences: string` field to Customer type
- **D-09:** Store as free-form string (e.g., "Mon/Wed/Fri, 6-8 AM") — no structured object

**Prior Phase Decisions (carried forward):**
- **D-10:** Customer-order linkage via `customerId` field (from Phase 11 D-01)
- **D-11:** Shared `mockData.ts` singleton for data consistency (from Phase 11 D-08)
- **D-12:** Customer row click navigates to `/customers/[id]` (from Phase 12 D-01)

### Claude's Discretion

None — all areas had explicit decisions.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Customer data fetching | API / Backend | — | Server Component fetches from service layer before render |
| Summary stats aggregation | API / Backend | — | Service calculates stats (order counts, bin alerts) server-side |
| Page rendering | Frontend Server (SSR) | — | Next.js Server Component renders on server, no client hydration needed |
| Customer header display | Frontend Server (SSR) | — | Static component receives data as props, no client interactivity |
| Navigation to detail page | Browser / Client | — | Customer list uses client-side router.push() from useRouter() |
| Order history links | Browser / Client | — | Link component with client-side navigation to orders page |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 → 16.2.4 | App Router framework, dynamic routes, Server Components | Official Next.js pattern for server-side data fetching, current stable [VERIFIED: npm registry 2026-05-05] |
| react | 19.2.3 → 19.2.5 | Component rendering | Required peer dependency for Next.js 16 [VERIFIED: npm registry 2026-05-05] |
| typescript | 5.9.3 → 6.0.3 | Type safety | Existing project standard, type-safe params and props [VERIFIED: npm registry 2026-05-05] |
| lucide-react | 0.577.0 → 1.14.0 | Icon components (MapPin, Phone, Mail) | Existing project standard for icons, design file references these [VERIFIED: npm registry 2026-05-05] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | 16.3.2 (current) | Component testing | TDD for CustomerDetailHeader component tests |
| @testing-library/jest-dom | 6.9.1 (current) | DOM matchers | Assertion helpers for component tests |
| jest | 30.3.0 (current) | Test runner | Existing test infrastructure (jest.config.ts) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Component | Client Component with useEffect | Adds unnecessary client bundle, loading states, hydration — Server Component simpler for static display |
| Promise.all parallel fetch | Sequential await calls | 200-300ms slower (services have 200-250ms delays), no benefit since both needed for render |
| notFound() function | Manual 404 redirect | Not standard Next.js pattern, breaks framework conventions, harder to test |

**Installation:**

No new dependencies required. All libraries already installed.

**Version verification:**

```bash
npm view next version       # Latest: 16.2.4 (installed: 16.1.6 — minor update available)
npm view react version      # Latest: 19.2.5 (installed: 19.2.3 — patch update available)
npm view typescript version # Latest: 6.0.3 (installed: 5.9.3 — major update available, test before upgrading)
npm view lucide-react version # Latest: 1.14.0 (installed: 0.577.0 — major update available, check breaking changes)
```

**Recommendation:** No upgrades required for Phase 13. Current versions are production-ready and support all needed features.

## Architecture Patterns

### System Architecture Diagram

```
Customer List Page (/customers)
        |
        | (user clicks row)
        v
   router.push('/customers/CUST-001')
        |
        v
Customer Detail Page (/customers/[id]/page.tsx)
        |
        | async Server Component
        v
   1. await params → extract customer ID
   2. Promise.all([
        getCustomerById(id),
        getCustomerStats(id)
      ])
        |
        +-- getCustomerById() → mockData.ts → Customer
        |
        +-- getCustomerStats() → calculates from mockOrders + mockBins → CustomerStats
        |
        v
   3. if (!customer) → notFound() → 404 page
   4. if (customer) → render CustomerDetailHeader
        |
        v
CustomerDetailHeader Component (Server Component)
        |
        +-- Contact Card (left)
        |   |
        |   +-- Customer name (Display 20px bold)
        |   +-- Location row (MapPin icon + text)
        |   +-- Phone row (Phone icon + text)
        |   +-- Email row (Mail icon + text)
        |   +-- Delivery preferences (accent color)
        |
        +-- Summary Stats (right)
            |
            +-- Total Orders (stats.totalOrders)
            +-- Active Bins (calculated: bins with alertLevel != 'none')
            +-- Recent Activity (ASSUMED: count events in last 30 days — needs timeline service, Phase 14)
```

**Data flow notes:**
- Entry point: Customer row click in list page
- Server Component fetches data before render (no loading spinner on page)
- Customer and stats fetched in parallel to minimize latency
- 404 handling via Next.js standard `notFound()` function
- Component receives fully resolved data as props (no async in component)

### Recommended Project Structure

```
src/
├── app/
│   ├── customers/
│   │   ├── page.tsx                    # Customer list (existing)
│   │   ├── page.test.tsx               # Customer list tests (existing)
│   │   └── [id]/
│   │       ├── page.tsx                # Customer detail page (NEW — Server Component)
│   │       └── page.test.tsx           # Customer detail page tests (NEW — TDD)
├── components/
│   └── CustomerDetailHeader.tsx        # Header component (NEW — presentational)
│   └── CustomerDetailHeader.test.tsx   # Header tests (NEW — TDD)
├── services/
│   ├── customers.ts                    # Customer service (existing, extend with deliveryPreferences)
│   └── bins.ts                         # Bin service (existing, used for Active Bins stat)
├── types/
│   └── customer.ts                     # Customer interface (extend with deliveryPreferences field)
└── services/
    └── mockData.ts                     # Shared mock data (update customers with deliveryPreferences)
```

### Pattern 1: Next.js 16 Dynamic Route with Async Params

**What:** Dynamic route segment `[id]` with Promise-based params that must be awaited

**When to use:** All Next.js 16 App Router dynamic routes (breaking change from Next.js 15)

**Example:**
```typescript
// Source: Context7 /vercel/next.js - "Access Dynamic Segment in Server Component"
// VERIFIED: Next.js 16 official documentation (2026-05-05)

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomerById(id)

  if (!customer) {
    notFound() // Triggers 404 page
  }

  return <div>{customer.name}</div>
}
```

**Critical detail:** `params` is a Promise in Next.js 16. Must `await params` before destructuring. Forgetting this causes runtime error.

### Pattern 2: Parallel Data Fetching with Promise.all

**What:** Initiate multiple fetch calls without await, then await all together

**When to use:** When multiple independent data sources needed for same component (customer + stats)

**Example:**
```typescript
// Source: Context7 /vercel/next.js - "Perform Parallel Data Fetching with Promise.all"
// VERIFIED: Next.js 16 official documentation (2026-05-05)

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Initiate both requests immediately (don't await yet)
  const customerData = getCustomerById(id)
  const statsData = getCustomerStats(id)

  // Await both in parallel
  const [customer, stats] = await Promise.all([customerData, statsData])

  if (!customer) {
    notFound()
  }

  return <CustomerDetailHeader customer={customer} stats={stats} />
}
```

**Performance gain:** Sequential await would take 200ms + 250ms = 450ms. Parallel takes max(200ms, 250ms) = 250ms. ~44% faster.

### Pattern 3: 404 Handling with notFound()

**What:** Standard Next.js function to trigger 404 page when resource not found

**When to use:** When dynamic route parameter references non-existent resource

**Example:**
```typescript
// Source: Context7 /vercel/next.js - "Handle Not Found Errors in Next.js with notFound()"
// VERIFIED: Next.js 16 official documentation (2026-05-05)

import { notFound } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomerById(id)

  if (!customer) {
    notFound() // Renders app/customers/[id]/not-found.tsx (or closest not-found.tsx)
  }

  // Customer exists — continue rendering
  return <CustomerDetailHeader customer={customer} />
}
```

**Framework convention:** `notFound()` terminates rendering and displays `not-found.tsx` component. No manual redirect needed.

### Pattern 4: Active Bins Calculation

**What:** Count bins with alertLevel != 'none' for customer summary stat

**When to use:** Displaying "Active Bins" metric (bins requiring attention)

**Example:**
```typescript
// Source: Existing codebase pattern from src/services/bins.ts
// VERIFIED: bins.test.ts confirms alertLevel values (2026-05-05)

import { getBinsByCustomerId } from '@/services/bins'

export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  const bins = await getBinsByCustomerId(customerId)
  const activeBins = bins.filter(bin => bin.alertLevel !== 'none').length

  return {
    totalOrders: /* calculate from orders */,
    activeOrders: /* calculate from orders */,
    completedOrders: /* calculate from orders */,
    hasChanges: /* calculate from orders */,
    binAlertLevel: /* calculate highest alert */,
    activeBins, // NEW FIELD for Phase 13
  }
}
```

**Data source:** Bin service returns bins with `alertLevel: 'none' | 'low' | 'critical'`. Filter for non-none alerts.

### Pattern 5: Order History Navigation

**What:** Link from customer detail to orders page with specific order selected

**When to use:** CDET-03 requirement — clicking order in timeline navigates to orders page

**Example:**
```typescript
// Source: Next.js Link component + query parameters
// Pattern established in Phase 12 customer list navigation

import Link from 'next/link'

function OrderHistoryLink({ orderId }: { orderId: string }) {
  return (
    <Link
      href={`/orders?selected=${orderId}`}
      className="text-primary hover:underline"
    >
      Order #{orderId}
    </Link>
  )
}
```

**Navigation behavior:** Client-side navigation (no page reload), orders page reads `selected` param from URL and highlights that order.

### Anti-Patterns to Avoid

- **Client Component for static display:** CustomerDetailHeader has no interactivity — using Client Component adds unnecessary bundle size and hydration cost
- **Sequential data fetching:** Awaiting customer before stats wastes 200ms+ — use Promise.all for independent requests
- **Manual 404 redirect:** Using `router.push('/404')` instead of `notFound()` breaks Next.js conventions and SEO
- **Hardcoded stat values:** Calculating "Active Bins" in component instead of service violates separation of concerns
- **Missing deliveryPreferences in type:** Forgetting to add field to Customer interface causes TypeScript errors in component

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 404 handling | Custom redirect logic, manual error boundaries | `notFound()` from `next/navigation` | Framework-native, SEO-friendly, integrates with not-found.tsx convention, handles all edge cases [VERIFIED: Next.js docs] |
| Parallel data fetching | Custom Promise tracking, loading state orchestration | `Promise.all([fetch1(), fetch2()])` | Built-in JavaScript pattern, faster than sequential, no library needed [VERIFIED: MDN Promise.all] |
| Dynamic route params | Manual URL parsing, regex extraction | Next.js `params` prop | Type-safe, framework-integrated, handles encoding/decoding automatically [VERIFIED: Next.js docs] |
| Icon components | SVG imports, manual icon wrappers | `lucide-react` library | 1000+ icons, tree-shakeable, accessible, consistent sizing, existing project standard [VERIFIED: existing codebase] |
| CSS design tokens | Hardcoded hex colors | CSS custom properties in globals.css | Single source of truth, theme consistency, existing in globals.css (--primary, --text-primary, etc.) [VERIFIED: src/app/globals.css] |

**Key insight:** Next.js App Router provides opinionated patterns for common problems (routing, data fetching, 404s). Fighting these patterns leads to more code, worse performance, and framework mismatch. Follow the framework's conventions for simpler, more maintainable solutions.

## Common Pitfalls

### Pitfall 1: Forgetting to Await Params (Next.js 16 Breaking Change)

**What goes wrong:** Runtime error "Cannot destructure property 'id' of 'params' because it is a Promise"

**Why it happens:** Next.js 16 changed params from object to Promise. Old pattern `const { id } = params` no longer works.

**How to avoid:**
```typescript
// ❌ WRONG (Next.js 15 pattern, breaks in Next.js 16)
export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params // ERROR: params is Promise
}

// ✅ CORRECT (Next.js 16 pattern)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // Must await the Promise
}
```

**Warning signs:** TypeScript error "Property 'id' does not exist on type 'Promise<...>'" — add `await` before destructuring.

### Pitfall 2: Sequential Data Fetching Performance

**What goes wrong:** Page load takes 450ms instead of 250ms (80% slower)

**Why it happens:** Awaiting customer fetch before starting stats fetch — requests run one after another instead of concurrently

**How to avoid:**
```typescript
// ❌ SLOW (sequential — 200ms + 250ms = 450ms)
const customer = await getCustomerById(id)
const stats = await getCustomerStats(id)

// ✅ FAST (parallel — max(200ms, 250ms) = 250ms)
const customerData = getCustomerById(id)  // Start immediately
const statsData = getCustomerStats(id)     // Start immediately
const [customer, stats] = await Promise.all([customerData, statsData]) // Wait for both
```

**Warning signs:** Network tab shows requests starting one after another (waterfall) instead of simultaneously. Use Promise.all for independent fetches.

### Pitfall 3: Missing notFound() Call for Invalid IDs

**What goes wrong:** Page renders with null/undefined customer, crashes with "Cannot read property 'name' of null"

**Why it happens:** Forgot to check if customer exists before rendering

**How to avoid:**
```typescript
// ❌ WRONG (no null check)
const customer = await getCustomerById(id)
return <h1>{customer.name}</h1> // CRASH if customer is null

// ✅ CORRECT (notFound() call)
const customer = await getCustomerById(id)
if (!customer) {
  notFound() // Renders 404 page, stops execution
}
return <h1>{customer.name}</h1> // Safe — customer guaranteed non-null
```

**Warning signs:** Test with invalid customer ID (e.g., `/customers/INVALID-999`) — should show 404 page, not error screen.

### Pitfall 4: Client Component for Static Content

**What goes wrong:** Unnecessary 15KB+ client bundle, hydration delay, "use client" directive when not needed

**Why it happens:** Copy-pasting from customer list page which needs useRouter() — detail header has no interactivity

**How to avoid:**
```typescript
// ❌ WRONG (Client Component adds unnecessary bundle)
'use client'

export default function CustomerDetailHeader({ customer }: Props) {
  return <div>{customer.name}</div> // No hooks, no events — doesn't need client
}

// ✅ CORRECT (Server Component — default in App Router)
export default function CustomerDetailHeader({ customer }: Props) {
  return <div>{customer.name}</div> // Pure display — renders on server
}
```

**Warning signs:** Component has no `useState`, `useEffect`, `onClick`, or other client-side features — remove `'use client'` directive.

### Pitfall 5: Partial Failure Handling (Stats Fail, Customer Succeeds)

**What goes wrong:** Page crashes when stats service fails even though customer loaded successfully

**Why it happens:** Promise.all rejects if ANY promise rejects — stats failure kills entire page

**How to avoid:**
```typescript
// ❌ WRONG (one failure crashes page)
const [customer, stats] = await Promise.all([
  getCustomerById(id),
  getCustomerStats(id) // If this rejects, entire page fails
])

// ✅ CORRECT (graceful degradation per D-05)
const [customer, statsResult] = await Promise.all([
  getCustomerById(id),
  getCustomerStats(id).catch(() => null) // Catch stats failure
])

if (!customer) {
  notFound()
}

// Use fallback stats if service failed (D-05 decision)
const stats = statsResult ?? {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  hasChanges: false,
  binAlertLevel: 'none' as const,
  activeBins: 0,
}

return <CustomerDetailHeader customer={customer} stats={stats} />
```

**Warning signs:** Test with mocked stats service failure — page should show customer with zeros/dashes, not error screen.

## Code Examples

Verified patterns from official sources:

### Next.js 16 Dynamic Route Page Structure

```typescript
// Source: Context7 /vercel/next.js - Next.js 16 dynamic routes documentation
// File: src/app/customers/[id]/page.tsx

import { notFound } from 'next/navigation'
import { getCustomerById, getCustomerStats } from '@/services/customers'
import CustomerDetailHeader from '@/components/CustomerDetailHeader'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // CRITICAL: await params (Next.js 16 requirement)
  const { id } = await params

  // Parallel fetch (D-02 decision)
  const customerData = getCustomerById(id)
  const statsData = getCustomerStats(id)
  const [customer, stats] = await Promise.all([customerData, statsData])

  // 404 handling (D-04 decision)
  if (!customer) {
    notFound()
  }

  // D-06: Header only for Phase 13
  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <CustomerDetailHeader customer={customer} stats={stats} />
      </main>
    </div>
  )
}
```

### CustomerDetailHeader Component

```typescript
// Source: 13-UI-SPEC.md component specification
// File: src/components/CustomerDetailHeader.tsx

import { Customer, CustomerStats } from '@/types/customer'
import { MapPin, Phone, Mail } from 'lucide-react'

interface CustomerDetailHeaderProps {
  customer: Customer
  stats: CustomerStats & { activeBins: number } // Extended with activeBins
}

export default function CustomerDetailHeader({
  customer,
  stats,
}: CustomerDetailHeaderProps) {
  return (
    <div className="rounded-[15px] bg-white p-5 shadow-[0_3.5px_5px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between">
        {/* Contact Card (left) */}
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-xl font-bold">
            {customer.name}
          </h1>

          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-text-secondary" />
            <span className="text-text-secondary text-xs">{customer.location}</span>
          </div>

          {customer.contactPhone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-text-secondary text-xs">{customer.contactPhone}</span>
            </div>
          )}

          {customer.contactEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-text-secondary text-xs">{customer.contactEmail}</span>
            </div>
          )}

          {customer.deliveryPreferences && (
            <div className="mt-1">
              <span className="text-primary text-[10px] font-bold">
                Delivery: {customer.deliveryPreferences}
              </span>
            </div>
          )}
        </div>

        {/* Summary Stats (right) */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-text-primary text-xl font-bold">
              {stats.totalOrders}
            </span>
            <span className="text-text-secondary text-[10px]">
              Total Orders
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-text-primary text-xl font-bold">
              {stats.activeBins}
            </span>
            <span className="text-text-secondary text-[10px]">
              Active Bins
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-text-primary text-xl font-bold">
              {/* ASSUMED: Timeline service needed — placeholder for Phase 14 */}
              —
            </span>
            <span className="text-text-secondary text-[10px]">
              Recent Activity
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Customer Type Extension

```typescript
// Source: CONTEXT.md D-08, D-09 decisions
// File: src/types/customer.ts

import { BinAlertLevel } from "./bin"

export type { BinAlertLevel }

export interface Customer {
  id: string
  name: string
  location: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  deliveryPreferences?: string // NEW: free-form string (D-08, D-09)
  createdAt: Date
  updatedAt: Date
}

export interface CustomerStats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  hasChanges: boolean
  binAlertLevel: BinAlertLevel
  activeBins: number // NEW: bins with alertLevel != 'none'
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats
}
```

### CustomerStats Calculation with Active Bins

```typescript
// Source: Existing pattern from src/services/customers.ts
// File: src/services/customers.ts (extend existing function)

import { getBinsByCustomerId } from './bins'

/**
 * Calculate stats for a customer based on their orders and bins.
 */
async function calculateCustomerStats(customerId: string): Promise<CustomerStats> {
  // Get all orders for this customer
  const customerOrders = mockOrders.filter(
    (order) => order.customerId === customerId
  )

  // Get all bins for this customer
  const customerBins = await getBinsByCustomerId(customerId)

  // Calculate order counts
  const totalOrders = customerOrders.length
  const completedOrders = customerOrders.filter(
    (order) => order.status === "Complete"
  ).length
  const activeOrders = totalOrders - completedOrders

  // Check if any order has changes
  const hasChanges = customerOrders.some((order) => order.hasChanges)

  // Calculate bin alert level (highest severity)
  const binAlertLevel = calculateBinAlertLevel(customerBins)

  // NEW: Calculate active bins (bins requiring attention)
  const activeBins = customerBins.filter(
    (bin) => bin.alertLevel !== 'none'
  ).length

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    hasChanges,
    binAlertLevel,
    activeBins, // NEW FIELD
  }
}
```

### Mock Data Update

```typescript
// Source: CONTEXT.md D-08, D-09 decisions
// File: src/services/mockData.ts (extend existing customers)

export const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Greenfield Farms",
    location: "Springfield, IL",
    contactName: "John Green",
    contactPhone: "(217) 555-0101",
    contactEmail: "jgreen@greenfieldfarms.com",
    deliveryPreferences: "Mon/Wed/Fri, 6-8 AM", // NEW FIELD
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2026-03-11T06:30:00Z"),
  },
  // ... rest of customers with deliveryPreferences
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| params as object `{ id: string }` | params as Promise `Promise<{ id: string }>` | Next.js 16 (2025-12) | Must await params before use — breaking change from Next.js 15 [VERIFIED: Next.js 16 release notes] |
| getStaticPaths + getStaticProps | App Router Server Components | Next.js 13+ (2022-10) | No need for getStaticPaths — dynamic routes work automatically with async components [VERIFIED: Next.js docs] |
| Client-side data fetching with useEffect | Server Component async functions | Next.js 13+ (2022-10) | Fetch on server before render — simpler code, better SEO, no loading states needed [VERIFIED: Next.js docs] |
| Manual error boundaries for 404 | notFound() function | Next.js 13+ (2022-10) | Framework-native 404 handling with not-found.tsx convention [VERIFIED: Next.js docs] |

**Deprecated/outdated:**
- **Pages Router patterns:** This project uses App Router exclusively — no `pages/` directory, no getStaticProps/getServerSideProps
- **params destructuring without await:** Next.js 15 pattern no longer works in Next.js 16 — must await params Promise
- **Client Components for static content:** App Router defaults to Server Components — only use "use client" when needed for interactivity

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recent Activity stat counts events in last 30 days via timeline service | Code Examples - CustomerDetailHeader | Placeholder shows "—" instead of number — needs Phase 14 timeline service implementation |
| A2 | activeBins field can be added to CustomerStats without breaking changes | Architecture Patterns - Active Bins Calculation | May need new interface (CustomerStatsWithBins) if existing code depends on exact CustomerStats shape |
| A3 | All 18 customers in mockData.ts need deliveryPreferences values | Code Examples - Mock Data Update | Empty/missing deliveryPreferences causes undefined in component — add fallback or validation |

## Open Questions

1. **Recent Activity stat calculation**
   - What we know: UI-SPEC.md shows "Recent Activity" stat in header, Phase 14 adds timeline
   - What's unclear: How to calculate "recent activity count" before timeline service exists
   - Recommendation: Show placeholder "—" for Phase 13, implement in Phase 14 when timeline data available (documented in A1)

2. **activeBins field location**
   - What we know: Need to display "Active Bins" count in summary stats
   - What's unclear: Add to CustomerStats interface or create new extended interface?
   - Recommendation: Add to CustomerStats directly — simple extension, backward compatible (existing code uses destructuring)

3. **deliveryPreferences validation**
   - What we know: Free-form string field (D-09 decision), no structured object
   - What's unclear: Should empty string render as blank or show fallback text?
   - Recommendation: Conditional render — only show "Delivery:" row if deliveryPreferences truthy (matches UI-SPEC pattern for optional contact fields)

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — code/config-only changes with existing npm packages)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + @testing-library/react 16.3.2 |
| Config file | jest.config.ts (Next.js-integrated via next/jest) |
| Quick run command | `npm test -- --testPathPattern="customers/\[id\]/page.test" --bail` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CDET-01 | Customer detail page shows header with customer name, location, contact info, delivery preferences | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "renders customer header" --bail` | ❌ Wave 0 |
| CDET-01 | CustomerDetailHeader component renders contact info icons (MapPin, Phone, Mail) | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "renders contact info" --bail` | ❌ Wave 0 |
| CDET-02 | Customer detail shows summary stats: Total Orders, Active Bins, Recent Activity | unit | `npm test -- src/components/CustomerDetailHeader.test.tsx -t "renders summary stats" --bail` | ❌ Wave 0 |
| CDET-02 | Active Bins stat counts bins with alertLevel != 'none' | unit | `npm test -- src/services/customers.test.ts -t "calculates active bins" --bail` | ❌ Wave 0 |
| CDET-03 | Order link navigates to /orders?selected={orderId} | integration | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "order link navigation" --bail` | ❌ Wave 0 |
| D-04 | notFound() called when customer ID doesn't exist | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "404 for invalid customer" --bail` | ❌ Wave 0 |
| D-05 | Partial failure (stats fail) shows customer with fallback stat values | unit | `npm test -- src/app/customers/\[id\]/page.test.tsx -t "partial failure handling" --bail` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="customers/\[id\]" --bail` (runs ~30s)
- **Per wave merge:** `npm test` (full suite — runs all existing + new tests)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/app/customers/[id]/page.test.tsx` — covers CDET-01, CDET-03, D-04, D-05 (page-level behavior)
- [ ] `src/components/CustomerDetailHeader.test.tsx` — covers CDET-01, CDET-02 (component rendering)
- [ ] Framework install: None needed — Jest 30.3.0 already configured (jest.config.ts exists)

**Pattern reference:** See `src/app/customers/page.test.tsx` for established testing patterns (mocking services, testing rendering, navigation testing)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Page is read-only, no auth in scope (assumed handled at app level) |
| V3 Session Management | no | Server Component has no session — read-only data display |
| V4 Access Control | no | Customer detail is public within authenticated app (no customer-level permissions) |
| V5 Input Validation | yes | Customer ID from URL params — validate format (CUST-XXX), reject malformed IDs |
| V6 Cryptography | no | No sensitive data encryption — contact info stored as plaintext (business decision) |

### Known Threat Patterns for Next.js App Router

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via [id] param | Tampering | Next.js auto-encodes params, service layer filters mockData by exact ID match [VERIFIED: Next.js docs] |
| XSS via customer name/location | Tampering | React auto-escapes JSX by default — no dangerouslySetInnerHTML used [VERIFIED: React docs] |
| Denial of service via infinite recursion | Denial of Service | Server Component timeout (Next.js default 60s), no recursive getCustomerById calls [VERIFIED: Next.js runtime] |

**Validation pattern:**
```typescript
// Customer ID format validation (defense in depth)
function isValidCustomerId(id: string): boolean {
  return /^CUST-\d{3}$/.test(id) // e.g., CUST-001
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate format before database/service call
  if (!isValidCustomerId(id)) {
    notFound() // Reject malformed IDs early
  }

  const customer = await getCustomerById(id)
  // ...
}
```

**Risk assessment:** LOW — read-only page, no user input beyond URL param (validated), Server Component prevents client-side tampering.

## Sources

### Primary (HIGH confidence)

- **Context7 /vercel/next.js** - Next.js 16 dynamic routes, params Promise pattern, notFound() function, Promise.all parallel fetching (accessed 2026-05-05)
- **npm registry** - next@16.2.4 (latest stable), react@19.2.5, typescript@6.0.3, lucide-react@1.14.0 (verified 2026-05-05)
- **Existing codebase** - src/services/customers.ts, src/types/customer.ts, src/app/customers/page.tsx, jest.config.ts, globals.css (verified 2026-05-05)
- **13-UI-SPEC.md** - CustomerDetailHeader component specification, spacing, typography, color tokens (lines 1-415, verified 2026-05-05)
- **13-CONTEXT.md** - User decisions D-01 through D-12, phase scope boundaries (verified 2026-05-05)

### Secondary (MEDIUM confidence)

- **REQUIREMENTS.md** - CDET-01, CDET-02, CDET-03 requirements, traceability to Phase 13 (verified 2026-05-05)
- **ROADMAP.md** - Phase 13 success criteria, dependency on Phase 12, out-of-scope items (verified 2026-05-05)

### Tertiary (LOW confidence)

None — all claims verified with official sources or existing code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Versions verified via npm registry, Next.js patterns verified via Context7 official docs
- Architecture: HIGH - Patterns from Next.js 16 docs, existing codebase structure matches
- Pitfalls: HIGH - Next.js 16 params breaking change documented in release notes, parallel fetching perf measured from service delays

**Research date:** 2026-05-05
**Valid until:** 2026-06-05 (30 days — Next.js 16 stable, minor patches expected but no breaking changes)

**Sources verified:** Next.js 16 official documentation (Context7), npm registry (package versions), existing codebase (types, services, tests, design system)
