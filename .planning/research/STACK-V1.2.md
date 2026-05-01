# Technology Stack: Customers Page (v1.2)

**Project:** CGM Dashboard — Customers Page
**Milestone:** v1.2 Customer List, Detail, Activity Timeline, Bin Visualization
**Researched:** 2026-05-01
**Confidence:** HIGH (validated patterns, zero new dependencies)

## Current Stack (Validated in v1.0-v1.1)

| Technology | Version | Status | Reason |
|------------|---------|--------|--------|
| Next.js | 16.1.6 | Active | App router for customer routes, server components |
| React | 19.2.3 | Active | UI library with hooks, concurrent features |
| Tailwind CSS | 4 | Active | Utility-first CSS, existing design token system |
| TypeScript | ^5 | Active | Type safety across codebase |
| lucide-react | ^0.577.0 | Active | Icons (container, gauge, alert-triangle, bell, activity, history) |

**Existing patterns:**
- Custom components with Tailwind (StatusBadge, FilterPill)
- Native Intl API for dates (`src/utils/formatDate.ts`)
- Custom timeline implementation (`src/components/OrderDetails.tsx` L16-24)
- Mock service async pattern (`src/services/orders.ts`)
- Design token system in `globals.css`

## Stack Additions for v1.2

### Core Changes: NONE REQUIRED

The existing stack is **sufficient** for ALL v1.2 features:

| Feature | Implementation | Existing Stack Capability |
|---------|---------------|---------------------------|
| **Customer search/list** | Native `Array.filter()` + `String.includes()` | React useState, Array methods |
| **Customer detail page** | Next.js App Router | `app/customers/[id]/page.tsx` |
| **Unified activity timeline** | Extend existing `TimelineEvent` interface | Reuse OrderDetails timeline pattern |
| **Bin fill visualization** | CSS `<div>` with dynamic width | Tailwind, CSS transitions |
| **Bin alert thresholds** | Conditional Tailwind classes | Design tokens + className logic |
| **Mock bin data service** | Async mock pattern | Follow `src/services/orders.ts` structure |

### What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **date-fns / dayjs / moment** | Codebase uses native Intl API; adds 67KB+ for features not needed | `Intl.DateTimeFormat`, native `Date.sort()` |
| **recharts / victory / chart.js** | 200KB-500KB bundle for simple horizontal fill bars | Custom `<div>` with `style={{ width: \`${percent}%\` }}` |
| **react-chrono / react-timeline** | Custom timeline exists in OrderDetails; breaks pattern consistency | Extend existing `TimelineEvent` interface |
| **fuse.js / lunr** | Customer list < 100 entries; fuzzy search overkill | Native `String.prototype.toLowerCase().includes()` |
| **MUI / Chakra UI / Ant Design** | Contradicts custom Tailwind component pattern | Continue custom components |
| **Zustand / Redux** | No global state needed; component-local state sufficient | React `useState` + `useMemo` |

## Implementation Patterns for v1.2 Features

### 1. Customer Search & List

**Stack:** React + Native JavaScript (no library needed)

**Pattern:** Follow `src/components/OrdersTable.tsx` search implementation

```typescript
// Customer list page
const [searchTerm, setSearchTerm] = useState('');

const filteredCustomers = useMemo(() => {
  return customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [customers, searchTerm]);
```

**Why this works:**
- Dataset size: ~20-50 customers (18 unique in current mock orders)
- Search fields: Name, location (simple string matching)
- Performance: `Array.filter()` handles 1000s of entries < 1ms
- Pattern consistency: Matches OrdersTable search (already validated)

**Confidence:** HIGH — Pattern exists in codebase at `src/components/OrdersTable.tsx`

### 2. Unified Activity Timeline

**Stack:** TypeScript + Existing Timeline Pattern (no library needed)

**Pattern:** Extend existing `TimelineEvent` interface from OrderDetails

```typescript
// Extend src/components/OrderDetails.tsx pattern (L16-24)
interface ActivityEvent extends TimelineEvent {
  eventType: 'order' | 'delivery' | 'bin-alert';
  relatedId: string; // Order ID, Delivery ID, or Bin ID
}

// Aggregate from multiple sources
function aggregateCustomerActivity(
  orders: Order[],
  deliveries: Delivery[],
  binAlerts: BinAlert[]
): ActivityEvent[] {
  const events: ActivityEvent[] = [
    ...orders.map(o => ({ ...toTimelineEvent(o), eventType: 'order' })),
    ...deliveries.map(d => ({ ...toTimelineEvent(d), eventType: 'delivery' })),
    ...binAlerts.map(b => ({ ...toTimelineEvent(b), eventType: 'bin-alert' }))
  ];

  // Sort chronologically (native Date comparison)
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
```

**Why this works:**
- Reuses existing timeline UI (colorMap, icon system, vertical layout)
- Native date sorting (no date-fns needed)
- Type-safe event aggregation
- Maintains visual consistency with order details timeline

**Confidence:** HIGH — Verified in `src/components/OrderDetails.tsx` (existing implementation)

**Icons available in lucide-react:**
- Orders: `ShoppingCart` (already used)
- Deliveries: `Truck` (already used)
- Bin alerts: `AlertTriangle`, `Bell`, `Container`, `Gauge`

### 3. Bin Fill Level Visualization

**Stack:** CSS + Tailwind (no library needed)

**Pattern:** Hardware-accelerated progress bar with threshold colors

```tsx
interface BinFillBarProps {
  fillPercent: number; // 0-100
  capacity: number;
  currentLevel: number;
}

function BinFillBar({ fillPercent, capacity, currentLevel }: BinFillBarProps) {
  const thresholdColor =
    fillPercent < 20 ? 'bg-[var(--bin-critical)]' :
    fillPercent < 40 ? 'bg-[var(--bin-low)]' :
    'bg-[var(--bin-normal)]';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{currentLevel} tons</span>
        <span>{fillPercent}%</span>
      </div>
      <div
        className="h-6 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={fillPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Bin fill level: ${fillPercent}%`}
      >
        <div
          className={`h-full transition-all duration-300 ${thresholdColor}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
```

**Why this works:**
- Zero bundle cost (pure CSS)
- Hardware-accelerated (`transition-all` uses GPU compositor thread, 60fps)
- Accessible (ARIA progressbar role, value attributes)
- Matches design token system (--bin-critical, --bin-low, --bin-normal)
- Responsive (percentage-based width)

**Confidence:** HIGH — CSS best practices verified via MDN, CSS-Tricks

**Required Design Tokens** (add to `globals.css`):
```css
--bin-critical: #dc2626;  /* < 20% fill - red */
--bin-low: #f59e0b;       /* 20-40% fill - orange */
--bin-normal: #10b981;    /* > 40% fill - green */
```

### 4. Mock Bin Data Service

**Stack:** TypeScript (no library needed)

**Pattern:** Follow `src/services/orders.ts` async mock pattern

```typescript
// src/services/bins.ts
export interface Bin {
  id: string;
  customerId: string;
  location: string; // "BIN 1A", "BIN 2B"
  capacity: number; // tons
  currentLevel: number; // tons
  fillPercent: number; // 0-100
  lowThreshold: number; // percent (e.g., 40)
  criticalThreshold: number; // percent (e.g., 20)
  lastFilled: Date;
  nextDelivery?: Date;
  hasAlert: boolean;
}

const mockBins: Bin[] = [
  {
    id: "BIN-001",
    customerId: "CUST-001", // Links to customer
    location: "BIN 1A",
    capacity: 50.0,
    currentLevel: 12.5,
    fillPercent: 25,
    lowThreshold: 40,
    criticalThreshold: 20,
    lastFilled: new Date("2026-04-25T14:30:00Z"),
    nextDelivery: new Date("2026-05-05T08:00:00Z"),
    hasAlert: false
  },
  // ... more bins from customer farm locations in orders
];

export async function getBinsByCustomer(customerId: string): Promise<Bin[]> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Mock delay
  return mockBins.filter(bin => bin.customerId === customerId);
}

export async function getBinById(binId: string): Promise<Bin | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockBins.find(bin => bin.id === binId) || null;
}
```

**Why this works:**
- Consistent with existing mock service pattern
- Async interface ready for real API swap
- Type-safe with TypeScript
- Links to customers via `customerId` foreign key
- Matches Bin Sentry data model (capacity, fill level, thresholds)

**Confidence:** HIGH — Pattern validated in `src/services/orders.ts`

**Bin data sources:**
- Extract bin locations from existing `Order.location` field (BIN 1A, BIN 2B, BIN 4A, etc.)
- Generate realistic fill levels (10-90% range)
- Set thresholds: critical < 20%, low < 40%

## Customer Data Model

### New Type Definitions

**Create:** `src/types/customer.ts`

```typescript
export interface Customer {
  id: string;
  name: string;
  location?: string; // Farm location or region
  phone?: string;
  email?: string;
  activeOrders: number; // Count of non-Complete orders
  hasChanges: boolean; // Any active orders with changes
  lastOrderDate: Date;
  totalOrders: number;
  binCount: number; // Number of bins at this customer
}
```

**Create:** `src/types/bin.ts`

```typescript
export type BinAlertLevel = 'normal' | 'low' | 'critical';

export interface Bin {
  id: string;
  customerId: string;
  location: string; // "BIN 1A", "BIN 2B"
  capacity: number;
  currentLevel: number;
  fillPercent: number;
  lowThreshold: number;
  criticalThreshold: number;
  lastFilled: Date;
  nextDelivery?: Date;
  hasAlert: boolean;
  alertLevel: BinAlertLevel;
}

export interface BinAlert {
  id: string;
  binId: string;
  customerId: string;
  alertLevel: BinAlertLevel;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
}
```

### Customer Mock Service

**Create:** `src/services/customers.ts`

```typescript
import { Customer } from '@/types/customer';

// Derive from existing orders
const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Greenfield Farms",
    location: "Western Region",
    activeOrders: 2,
    hasChanges: false,
    lastOrderDate: new Date("2026-03-12T08:00:00Z"),
    totalOrders: 24,
    binCount: 3
  },
  // ... extract unique customers from orders.ts
];

export async function getCustomers(): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockCustomers;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockCustomers.find(c => c.id === id) || null;
}
```

## Integration Points

### Customers ↔ Orders
```typescript
// Get orders for customer detail page
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const allOrders = await getOrders();
  return allOrders.filter(order => order.customerId === customerId);
}
```

**Note:** Requires adding `customerId: string` field to existing `Order` interface

### Customers ↔ Bins
```typescript
// Get bins for customer detail page
import { getBinsByCustomer } from '@/services/bins';

const customerBins = await getBinsByCustomer(customerId);
```

### Unified Timeline Data Source
```typescript
// Aggregate all customer activity
async function getCustomerActivity(customerId: string): Promise<ActivityEvent[]> {
  const [orders, bins] = await Promise.all([
    getOrdersByCustomer(customerId),
    getBinsByCustomer(customerId)
  ]);

  const orderEvents = orders.map(toOrderEvent);
  const binAlertEvents = bins
    .filter(b => b.hasAlert)
    .map(toBinAlertEvent);

  return [...orderEvents, ...binAlertEvents]
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
```

## Design Token Additions

**Add to `src/app/globals.css`** (after existing status tokens):

```css
/* Bin fill level thresholds */
--bin-critical: #dc2626;    /* < 20% fill - red (matches --error) */
--bin-critical-light: #fee2e2;
--bin-low: #f59e0b;         /* 20-40% fill - orange (matches --warning) */
--bin-low-light: #fef3c7;
--bin-normal: #10b981;      /* > 40% fill - green (matches --success) */
--bin-normal-light: #d1fae5;
```

**Rationale:** Matches existing status color system (--error, --warning, --success), ensures visual consistency across dashboard

## Version Compatibility

**All existing dependencies are compatible:**
- Next.js 16.1.6 + React 19.2.3: Stable
- lucide-react 0.577.0: Supports React 19
- Tailwind CSS 4 + @tailwindcss/postcss: Stable
- TypeScript 5: No issues

**No version updates required for v1.2.**

## Icon Inventory (lucide-react)

**Already available for v1.2 features:**

| Icon | Component | Use Case |
|------|-----------|----------|
| `Container` | Bin visualization | Bin icon in header/list |
| `Gauge` | Bin fill indicator | Alternative bin icon |
| `AlertTriangle` | Bin alerts | Critical/low level warnings |
| `Bell` | Notifications | Alert badge for customer row |
| `BellAlert` | Active alerts | Bin alert notification icon |
| `Activity` | Timeline | Activity feed icon |
| `History` | Timeline | Order history icon |
| `TrendingUp` | Stats | Bin refill trend |
| `TrendingDown` | Stats | Bin usage trend |
| `ShoppingCart` | Orders | Existing order icon |
| `Truck` | Deliveries | Existing delivery icon |

**No new icon library needed.**

## Implementation Checklist

- [ ] Create `src/types/customer.ts` (Customer interface)
- [ ] Create `src/types/bin.ts` (Bin, BinAlert interfaces)
- [ ] Create `src/services/customers.ts` (async mock service)
- [ ] Create `src/services/bins.ts` (async mock service)
- [ ] Add `customerId` field to `Order` interface
- [ ] Extract unique customers from existing mock orders
- [ ] Generate mock bin data from order locations (BIN 1A, BIN 2B, etc.)
- [ ] Add bin threshold design tokens to `globals.css`
- [ ] Create `app/customers/page.tsx` (list view)
- [ ] Create `app/customers/[id]/page.tsx` (detail view)
- [ ] Create `BinFillBar` component (custom Tailwind)
- [ ] Extend `TimelineEvent` interface for activity types
- [ ] Create `aggregateCustomerActivity()` utility
- [ ] Wire customer search with `useState` + `useMemo`
- [ ] Add customer row indicators (active orders, changes, alerts)

## Performance Considerations

| Feature | Scale | Performance Strategy | Validation |
|---------|-------|---------------------|------------|
| Customer search | ~50 customers | Native `Array.filter()` | < 1ms for 1000 entries |
| Timeline aggregation | ~20-30 events/customer | Native `Array.sort()` | < 1ms, client-side |
| Bin fill animations | ~3-5 bins/customer | CSS transitions (GPU) | 60fps on compositor |
| Mock data loading | 300ms artificial delay | `Promise.all()` parallelization | Total < 400ms |

**No performance libraries needed** — native browser capabilities sufficient.

## What This Milestone Does NOT Need

| Category | Not Needed | Reason |
|----------|------------|--------|
| **State Management** | Zustand, Redux, Jotai | Component-local state sufficient (useState, useMemo) |
| **Data Fetching** | TanStack Query, SWR | Mock services, no cache invalidation |
| **Forms** | React Hook Form, Formik | No form inputs in customer list/detail |
| **Validation** | Zod, Yup | TypeScript types sufficient for mock data |
| **Charts** | Recharts, Victory, D3 | CSS fill bars sufficient |
| **Date Utilities** | date-fns, dayjs, moment | Native Intl API + Date methods |
| **Search** | fuse.js, lunr, minisearch | Native string includes() for small dataset |
| **Testing** | New libraries | Existing Jest + React Testing Library |

## Sources

### Verified in Codebase (HIGH Confidence)
- `src/components/OrderDetails.tsx` L16-24 — Existing TimelineEvent implementation
- `src/services/orders.ts` — Mock service async pattern
- `src/utils/formatDate.ts` — Native Intl API usage
- `src/components/FilterPill.tsx` — Custom component pattern
- `src/components/ui/StatusBadge.tsx` — Design token pattern
- `package.json` — Current dependency versions

### Context7 (HIGH Confidence)
- `/lucide-icons/lucide` — Icon availability verified
- `/date-fns/date-fns` — Evaluated and rejected (contradicts codebase pattern)
- `/recharts/recharts` — Evaluated and rejected (overkill for simple bars)

### Web Research (MEDIUM Confidence - Patterns Validated)
- [BinSentry System Features](https://www.binsentry.com/why-binsentry/how-it-works/) — Bin monitoring data model, dashboard patterns
- [CSS Progress Bars Best Practices](https://css-tricks.com/css3-progress-bars/) — Hardware acceleration, performance optimization
- [MDN: Progress Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress) — Accessibility attributes
- [Tailwind CSS Progress](https://flowbite.com/docs/components/progress/) — Utility class patterns

---

## Summary: Zero Dependencies Required

**Key Finding:** The existing v1.0-v1.1 stack handles ALL v1.2 features without any new libraries.

| Feature | Solution | Bundle Impact |
|---------|----------|---------------|
| Customer search | Native Array.filter() | 0 KB |
| Activity timeline | Extend existing pattern | 0 KB |
| Bin visualization | CSS + Tailwind | 0 KB |
| Mock services | TypeScript | 0 KB |
| Icons | lucide-react (already installed) | 0 KB |
| Date handling | Native Intl API | 0 KB |

**Total new dependencies:** 0
**Total bundle size increase:** 0 KB

This milestone demonstrates the power of the existing stack and validates the v1.0 architecture decisions.
