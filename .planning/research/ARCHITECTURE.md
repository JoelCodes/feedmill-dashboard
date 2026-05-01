# Architecture Research: Customers Page Integration

**Domain:** Feed mill operations dashboard — Customer management with activity timeline and bin monitoring
**Researched:** 2026-05-01
**Confidence:** HIGH

## Existing Architecture Analysis

### Current System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Sidebar  │  │  Header  │  │  Orders  │  │   Mill   │    │
│  │          │  │  Search  │  │  Table   │  │Production│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │              │          │
├───────┴─────────────┴──────────────┴──────────────┴──────────┤
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ orders.ts       │  │ notifications.ts│  │ millProd.ts │ │
│  │ (mock async)    │  │ (mock async)    │  │ (mock async)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                         Types Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ order.ts │  │settings  │  │millProd  │  │notifs.ts │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Existing Component Responsibilities

| Component | Responsibility | Implementation Pattern |
|-----------|----------------|------------------------|
| Page Components | Route definition, layout composition, data fetching orchestration | Server/Client components with async data loading |
| Table Components | Data display, filtering, search, row selection | Client components with useState, useEffect, useMemo |
| Detail Components | Order/entity details, timeline visualization | Client components with derived timeline from status |
| Service Layer | Mock data with async interface (200-300ms delay) | Async functions returning typed data |
| Shared UI | StatusBadge, FilterPill, Skeletons | Reusable components with design token integration |

## New Architecture for v1.2 Customers

### Extended System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  EXISTING              │              NEW (v1.2)             │
│  ┌──────────┐          │  ┌──────────┐  ┌──────────┐       │
│  │  Orders  │          │  │Customers │  │Customer  │       │
│  │  Table   │          │  │  List    │  │  Detail  │       │
│  └──────────┘          │  └────┬─────┘  └────┬─────┘       │
│                        │       │              │             │
│                        │       │    ┌─────────┴─────────┐   │
│                        │       │    │ UnifiedTimeline   │   │
│                        │       │    │ BinVisualization  │   │
│                        │       │    └───────────────────┘   │
├────────────────────────┴─────────────────────────────────────┤
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  EXISTING              │              NEW (v1.2)             │
│  ┌─────────────────┐   │  ┌──────────────┐  ┌────────────┐ │
│  │ orders.ts       │   │  │ customers.ts │  │  bins.ts   │ │
│  │ millProduction  │   │  │ (mock async) │  │ (mock)     │ │
│  └─────────────────┘   │  └──────────────┘  └────────────┘ │
├────────────────────────┴─────────────────────────────────────┤
│                         Types Layer                          │
│  EXISTING              │              NEW (v1.2)             │
│  ┌──────────┐          │  ┌──────────┐  ┌──────────┐       │
│  │ order.ts │          │  │customer  │  │  bin.ts  │       │
│  └──────────┘          │  │  .ts     │  │          │       │
│                        │  └──────────┘  └──────────┘       │
└────────────────────────┴─────────────────────────────────────┘
```

### New Component Responsibilities

| Component | Responsibility | Implementation Pattern |
|-----------|----------------|------------------------|
| CustomersTable | List customers, search by name, show order status indicators | Reuse OrdersTable pattern with customer-specific columns |
| CustomerDetail | Display customer header, unified activity timeline, bins | Layout component orchestrating UnifiedTimeline + BinVisualization |
| UnifiedTimeline | Merge orders, deliveries, bin alerts into single chronological view | Extend OrderDetails timeline pattern with multi-source events |
| BinVisualization | Show bins with fill level bars, low/critical thresholds | New component with bar chart visualization |
| CustomersService | Fetch customer list, customer details, customer-specific orders | Mock async service following orders.ts pattern |
| BinsService | Fetch bin data for customer, calculate fill levels, alert status | Mock async service with BinSentry-style data structure |

## Recommended Project Structure

```
src/
├── app/
│   ├── customers/              # NEW: Customer routes
│   │   ├── page.tsx            # Customer list page
│   │   └── [id]/               # Dynamic customer detail route
│   │       └── page.tsx        # Customer detail page
├── components/
│   ├── CustomersTable.tsx      # NEW: Customer list with search
│   ├── CustomerDetail.tsx      # NEW: Customer detail layout
│   ├── UnifiedTimeline.tsx     # NEW: Multi-source timeline
│   ├── BinVisualization.tsx    # NEW: Bin fill level bars
│   ├── OrdersTable.tsx         # EXISTING: Keep for /orders route
│   └── OrderDetails.tsx        # EXISTING: Keep for order-specific details
├── services/
│   ├── customers.ts            # NEW: Customer data service
│   ├── bins.ts                 # NEW: Bin data service
│   ├── orders.ts               # EXISTING: Reference for customer orders
│   └── millProduction.ts       # EXISTING: No changes
├── types/
│   ├── customer.ts             # NEW: Customer, Activity types
│   ├── bin.ts                  # NEW: Bin, BinAlert types
│   ├── order.ts                # EXISTING: May add customerId reference
│   └── millProduction.ts       # EXISTING: No changes
├── hooks/                      # EXISTING: Reuse across new components
│   ├── useDebounce.ts          # For customer search
│   └── useLocalStorage.ts      # For timeline sort preference
└── utils/
    └── formatDate.ts           # EXISTING: Reuse for timeline dates
```

### Structure Rationale

- **app/customers/:** Follows Next.js App Router conventions with dynamic [id] route for customer details
- **components/:** Keeps flat structure matching existing pattern (no nested /customers folder to avoid over-organization)
- **services/:** Separate service per domain entity (customers, bins) with mock async pattern
- **types/:** One type file per domain entity for clear boundaries

## Architectural Patterns

### Pattern 1: Unified Activity Timeline

**What:** Merge events from multiple sources (orders, deliveries, bin alerts) into single chronological timeline

**When to use:** Customer detail page needs to show all activity across different systems

**Trade-offs:**
- **Pro:** Single view reduces cognitive load, easier to spot patterns
- **Pro:** Extends existing OrderDetails timeline pattern (familiar code structure)
- **Con:** More complex data fetching (need to query multiple services)
- **Con:** Timeline events need common interface despite different source data

**Example:**
```typescript
// types/customer.ts
export type ActivityEventType = "order" | "delivery" | "bin_alert" | "order_change";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: Date;
  title: string;
  description: string;
  icon: React.ComponentType;
  color: "primary" | "success" | "error" | "warning";
  metadata?: Record<string, unknown>; // Type-specific data
}

// components/UnifiedTimeline.tsx
function UnifiedTimeline({ customerId }: { customerId: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    // Fetch from multiple sources
    Promise.all([
      getCustomerOrders(customerId),
      getCustomerBinAlerts(customerId),
      // ... other sources
    ]).then(([orders, binAlerts]) => {
      // Transform to common ActivityEvent interface
      const orderEvents = orders.map(transformOrderToEvent);
      const alertEvents = binAlerts.map(transformAlertToEvent);

      // Merge and sort by timestamp
      const merged = [...orderEvents, ...alertEvents].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      setEvents(merged);
    });
  }, [customerId]);

  // Render using existing TimelineItem pattern from OrderDetails
}
```

### Pattern 2: Bin Data Service with Calculated Metrics

**What:** Service layer calculates fill percentages, days until empty, alert thresholds from raw sensor data

**When to use:** Bin monitoring requires derived metrics beyond raw sensor readings

**Trade-offs:**
- **Pro:** Single source of truth for calculation logic
- **Pro:** Components receive ready-to-display data (no calculation in render)
- **Con:** Mock service needs realistic calculations to validate UI

**Example:**
```typescript
// services/bins.ts
export interface BinData {
  id: string;
  binNumber: string;
  location: string;
  capacity: number; // in tons
  currentLevel: number; // in tons
  fillPercentage: number; // calculated: (currentLevel / capacity) * 100
  daysUntilEmpty: number | null; // calculated from consumption rate
  alertStatus: "normal" | "low" | "critical";
  lastUpdated: Date;
}

export async function getCustomerBins(customerId: string): Promise<BinData[]> {
  await delay(200);

  // Mock data with realistic calculations
  const rawBins = mockBinSensorData.filter(b => b.customerId === customerId);

  return rawBins.map(bin => {
    const fillPercentage = (bin.currentLevel / bin.capacity) * 100;
    const dailyConsumption = bin.avgDailyConsumption || 0;
    const daysUntilEmpty = dailyConsumption > 0
      ? Math.round(bin.currentLevel / dailyConsumption)
      : null;

    let alertStatus: "normal" | "low" | "critical" = "normal";
    if (fillPercentage <= 10) alertStatus = "critical";
    else if (fillPercentage <= 25) alertStatus = "low";

    return {
      ...bin,
      fillPercentage,
      daysUntilEmpty,
      alertStatus,
    };
  });
}
```

### Pattern 3: Customer-Order Relationship via Service Aggregation

**What:** Customer service aggregates data from orders service to show customer-level stats

**When to use:** Need to display customer metadata derived from multiple orders

**Trade-offs:**
- **Pro:** Keeps services decoupled (orders service doesn't know about customers service)
- **Pro:** Reuses existing orders service without modification
- **Con:** More service calls (customer service → orders service → data)

**Example:**
```typescript
// services/customers.ts
import { getOrders } from "./orders";

export interface Customer {
  id: string;
  name: string;
  activeOrdersCount: number;
  hasChanges: boolean; // true if any order has changes
  lastOrderDate: Date | null;
}

export async function getCustomers(): Promise<Customer[]> {
  const orders = await getOrders();

  // Group by customer
  const customerMap = new Map<string, Order[]>();
  orders.forEach(order => {
    const existing = customerMap.get(order.customer) || [];
    customerMap.set(order.customer, [...existing, order]);
  });

  // Transform to Customer objects
  return Array.from(customerMap.entries()).map(([name, orders]) => {
    const activeOrders = orders.filter(o =>
      !["Complete"].includes(o.status)
    );
    const hasChanges = orders.some(o => o.hasChanges);
    const lastOrder = orders.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    )[0];

    return {
      id: nameToId(name), // Generate stable ID from name
      name,
      activeOrdersCount: activeOrders.length,
      hasChanges,
      lastOrderDate: lastOrder?.createdAt || null,
    };
  });
}
```

## Data Flow

### Customer List Page Flow

```
User navigates to /customers
    ↓
CustomersPage (page.tsx)
    ↓
CustomersTable → getCustomers() → orders.ts (aggregation)
    ↓                    ↓
Render list      Compute stats per customer
    ↓
User searches → useDebounce → filter in-memory
    ↓
Click customer → navigate to /customers/[id]
```

### Customer Detail Page Flow

```
User navigates to /customers/[id]
    ↓
CustomerDetailPage (page.tsx) → parallel data fetching:
    ├─→ getCustomerById(id) → customer metadata
    ├─→ getCustomerOrders(id) → order history
    └─→ getCustomerBins(id) → bin data with calculations
    ↓
CustomerDetail component receives all data
    ↓
    ├─→ UnifiedTimeline (merge orders + bins into ActivityEvent[])
    └─→ BinVisualization (render fill level bars with thresholds)
```

### Bin Alert Timeline Integration Flow

```
getCustomerBins(customerId)
    ↓
Calculate alertStatus per bin
    ↓
Filter bins with alertStatus !== "normal"
    ↓
Transform to ActivityEvent[]
    ↓
Merge with order events
    ↓
Sort by timestamp (desc)
    ↓
Render in UnifiedTimeline
```

## Integration Points

### New Routes in Sidebar Navigation

**Modification:** `src/components/Sidebar.tsx`

Add Customers to PRODUCTION section:

```typescript
import { Users } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard", href: "/" },
  { icon: Factory, label: "Production", id: "production", href: "/mill-production" },
  { icon: ClipboardList, label: "Orders", id: "orders", href: "/orders" },
  { icon: Users, label: "Customers", id: "customers", href: "/customers" }, // NEW
  { icon: Package, label: "Inventory", id: "inventory", href: "/inventory" },
  { icon: Truck, label: "Shipments", id: "shipments", href: "/shipments" },
];
```

### Existing Component Reuse

| Existing Component | How to Reuse in v1.2 |
|--------------------|----------------------|
| StatusBadge | Reuse for order status in customer detail order history |
| FilterPill | Reuse for bin alert status filters if needed |
| TimelineItem (from OrderDetails) | Extract to shared component, reuse in UnifiedTimeline |
| TableSkeleton | Reuse for CustomersTable loading state |
| DetailsSkeleton | Reuse for CustomerDetail loading state |
| useDebounce | Reuse for customer search filtering |
| useLocalStorage | Reuse for timeline sort order preference |
| formatDate | Reuse for timeline event dates |

### New Type Definitions

**File:** `src/types/customer.ts`

```typescript
export interface Customer {
  id: string;
  name: string;
  activeOrdersCount: number;
  hasChanges: boolean;
  lastOrderDate: Date | null;
}

export type ActivityEventType = "order" | "delivery" | "bin_alert" | "order_change";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: Date;
  title: string;
  description: string;
  color: "primary" | "success" | "error" | "warning";
  isPending?: boolean;
  metadata?: Record<string, unknown>;
}
```

**File:** `src/types/bin.ts`

```typescript
export type BinAlertStatus = "normal" | "low" | "critical";

export interface Bin {
  id: string;
  customerId: string;
  binNumber: string;
  location: string; // "BIN 1A", "BIN 2B", etc.
  capacity: number; // tons
  currentLevel: number; // tons
  fillPercentage: number; // 0-100
  daysUntilEmpty: number | null;
  alertStatus: BinAlertStatus;
  lastUpdated: Date;
  avgDailyConsumption?: number; // tons per day
}

export interface BinAlert {
  id: string;
  binId: string;
  timestamp: Date;
  alertType: "low" | "critical" | "empty";
  message: string;
}
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| MVP (v1.2) | Mock services with in-memory aggregation (current approach) — sufficient for demo |
| 10-100 customers | Keep mock services, optimize aggregation with Map/Set for O(n) instead of nested loops |
| 100-1000 customers | Add backend API, database with indexed customer-order relationships, paginate customer list |
| Real-time bins | Replace mock bin service with actual BinSentry API integration, WebSocket for live updates |

### Scaling Priorities

1. **First bottleneck:** Customer list aggregation from orders (O(n²) in current pattern)
   - **Fix:** Use Map to group orders by customer in single pass O(n)
   - **When:** When customer count > 50 or orders > 500

2. **Second bottleneck:** Timeline event merging (fetching from multiple sources sequentially)
   - **Fix:** Use Promise.all for parallel fetching, pre-compute timeline on backend
   - **When:** Timeline has > 100 events or > 3 event sources

## Anti-Patterns

### Anti-Pattern 1: Fetching Orders Multiple Times

**What people do:** Fetch all orders in customer list, then fetch again for customer detail, then again for timeline

**Why it's wrong:**
- Wastes network bandwidth
- Causes loading spinners when data already exists
- Orders can go stale between fetches

**Do this instead:**
- Fetch orders once in customer list, pass to detail via state/context if navigating directly
- OR implement client-side cache (React Query pattern for future)
- OR accept that detail page re-fetches (acceptable for MVP with 300ms mock delay)

### Anti-Pattern 2: Calculating Fill Percentage in Component Render

**What people do:**
```typescript
// BAD: In BinVisualization component
const fillPercentage = (bin.currentLevel / bin.capacity) * 100;
```

**Why it's wrong:**
- Calculation runs on every render (performance hit)
- Business logic leaks into presentation layer
- Can't unit test calculation separately

**Do this instead:**
```typescript
// GOOD: In bins.ts service
export async function getCustomerBins(customerId: string): Promise<BinData[]> {
  const rawBins = await fetchRawBins(customerId);
  return rawBins.map(bin => ({
    ...bin,
    fillPercentage: (bin.currentLevel / bin.capacity) * 100, // Calculate once
  }));
}
```

### Anti-Pattern 3: Hardcoding Bin Alert Thresholds in Components

**What people do:**
```typescript
// BAD: Thresholds in component
const isLow = bin.fillPercentage <= 25;
const isCritical = bin.fillPercentage <= 10;
```

**Why it's wrong:**
- Thresholds should be configurable per customer or bin type
- Duplicates logic if used in multiple places
- Can't change without code deploy

**Do this instead:**
```typescript
// GOOD: Centralize in service or constants
// types/bin.ts
export const BIN_THRESHOLDS = {
  critical: 10,
  low: 25,
} as const;

// services/bins.ts
function calculateAlertStatus(fillPercentage: number): BinAlertStatus {
  if (fillPercentage <= BIN_THRESHOLDS.critical) return "critical";
  if (fillPercentage <= BIN_THRESHOLDS.low) return "low";
  return "normal";
}
```

## Component Build Order

Based on dependency graph and validation needs:

### Phase 1: Foundation (Types + Services)
1. **types/customer.ts** — Define Customer, ActivityEvent interfaces
2. **types/bin.ts** — Define Bin, BinAlert interfaces
3. **services/customers.ts** — Mock customer data service with order aggregation
4. **services/bins.ts** — Mock bin data service with calculations

**Validation:** Service functions return correct TypeScript types, calculations are accurate

### Phase 2: Customer List
5. **app/customers/page.tsx** — Basic route with layout (reuse orders page pattern)
6. **components/CustomersTable.tsx** — List view with search (reuse OrdersTable pattern)

**Validation:** Can view customer list, search works, indicators show correctly

### Phase 3: Customer Detail Page Structure
7. **app/customers/[id]/page.tsx** — Dynamic route with data fetching
8. **components/CustomerDetail.tsx** — Layout shell (header + grid for timeline + bins)

**Validation:** Can navigate to customer detail, header shows correct data

### Phase 4: Timeline
9. **Extract TimelineItem from OrderDetails** → shared component if needed
10. **components/UnifiedTimeline.tsx** — Multi-source timeline with ActivityEvent merging

**Validation:** Timeline shows orders and bin alerts merged chronologically

### Phase 5: Bin Visualization
11. **components/BinVisualization.tsx** — Fill level bars with threshold indicators

**Validation:** Bins display with correct fill levels, colors match alert status

### Phase 6: Integration
12. **Update Sidebar.tsx** — Add Customers nav item
13. **Polish & responsive tweaks** — Ensure consistent with existing pages

**Validation:** Full navigation flow works, design tokens applied consistently

## Design Token Usage

Reuse existing tokens from `globals.css`:

**Bin alert colors:**
- `critical` → `var(--error)` background, `var(--error-dark)` border
- `low` → `var(--warning)` background, `var(--warning)` border
- `normal` → `var(--success-light)` background, `var(--success)` border

**Timeline event colors:**
- Order events → `var(--primary)`
- Deliveries → `var(--success)`
- Bin alerts → `var(--error)` (critical), `var(--warning)` (low)
- Order changes → `var(--warning)`

## Sources

**BinSentry Dashboard Patterns:**
- [BinSentry Dashboard Overview](https://knowledge.binsentry.com/what-is-the-binsentry-horizon-dashboard) — Dashboard features for bin fill level visualization
- [BinSentry Bin Page Details](https://knowledge.binsentry.com/what-is-bin-page) — Individual bin page structure with level history

**Feed Bin Monitoring Systems:**
- [BinMaster FeedView Software](https://binmaster.com/feedview) — Inventory management software showing data structure and alert patterns
- [BinMaster Agriculture Level Sensors](https://binmaster.com/agriculture) — Grain bin monitoring with height readings, thresholds, and alerts
- [BinConnect Livestock Feed Monitoring](https://www.nanolike.com/binconnect/) — Real-time monitoring showing volume tracking and alert systems

**Existing Codebase:**
- `.planning/codebase/ARCHITECTURE.md` — Current Next.js SSR architecture
- `.planning/codebase/STRUCTURE.md` — Directory layout and naming conventions
- `src/components/OrderDetails.tsx` — Timeline pattern to extend for UnifiedTimeline
- `src/services/orders.ts` — Mock service pattern to replicate for customers/bins

---
*Architecture research for: CGM Dashboard v1.2 Customers Page*
*Researched: 2026-05-01*
