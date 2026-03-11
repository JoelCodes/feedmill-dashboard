# Architecture Patterns: Interactive Dashboard Features

**Domain:** Feed mill operations dashboard (React/Next.js)
**Researched:** 2026-03-11
**Confidence:** HIGH (React patterns), MEDIUM (Next.js 16 specifics)

## Executive Summary

Adding interactive features (filtering, search, row selection) to an existing static React dashboard requires introducing **client-side state management** while preserving the current SSR component architecture. The recommended approach uses **progressive enhancement**: start with mock data in client components, establish interaction patterns, then swap mock functions for API calls without changing component interfaces.

**Key architectural decision:** Introduce a **state boundary layer** between presentation components and data sources. This allows mock-to-API transitions without component rewrites.

## Recommended Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│ Page Layer (Server Components - Next.js App Router)    │
│ - Layout orchestration                                  │
│ - Initial data fetching (future)                        │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Container Layer (Client Components with "use client")  │
│ - State management (useState, useReducer)               │
│ - Event handlers (filter, search, select)               │
│ - Data transformation & filtering logic                 │
│ - Data source abstraction (mock → API swap point)       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│ Presentation Layer (Pure Components)                    │
│ - Visual rendering only                                 │
│ - Props-driven, no internal state                       │
│ - Event callbacks passed down                           │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component Type | Responsibility | State | Example |
|----------------|---------------|-------|---------|
| **Page Component** | Route definition, layout composition | No state (server) | `app/page.tsx` |
| **Container Component** | State + data + interactions | `useState`, `useReducer` | `OrdersTableContainer` |
| **Presentation Component** | Render UI from props | No state (or local UI state only) | `OrdersTableUI`, `FilterPill`, `StatusBadge` |
| **Data Service** | Provide data (mock or API) | No UI | `lib/orders-service.ts` |

### Critical Pattern: Container/Presentation Split

**Current state:** Presentation components contain both rendering AND mock data.

**Target state:** Separate concerns via container pattern.

```typescript
// BEFORE (current - mixed concerns)
export default function OrdersTable() {
  const orders = [...]; // Mock data IN component
  return <div>{/* render */}</div>
}

// AFTER (separated concerns)
"use client"
export default function OrdersTableContainer() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  // Load data from service (mock or API - same interface)
  useEffect(() => {
    ordersService.getOrders().then(setOrders);
  }, []);

  // Business logic: filtering
  const filteredOrders = orders.filter(order =>
    filter === "all" || order.status === filter
  );

  return (
    <OrdersTableUI
      orders={filteredOrders}
      selectedId={selected}
      onFilterChange={setFilter}
      onRowSelect={setSelected}
    />
  );
}

// Presentation component (pure, reusable, testable)
function OrdersTableUI({ orders, selectedId, onFilterChange, onRowSelect }) {
  return <div>{/* render only */}</div>
}
```

**Why this matters:**
- Mock → API transition happens in ONE place (the service)
- Presentation components remain unchanged
- Business logic (filtering) centralized and testable
- Server/Client boundary explicitly managed

## Data Flow Architecture

### Flow Direction: Unidirectional (Top-Down)

```
User Interaction
    ↓
Event Handler (Container)
    ↓
State Update (useState/useReducer)
    ↓
Re-render with New Props
    ↓
Presentation Component Updates
```

### Detailed Flow: Filter Orders by Status

```
1. User clicks "Shipped" filter pill
   ↓
2. onClick handler in FilterPill calls onFilterChange("shipped")
   ↓
3. Container's setFilter("shipped") updates state
   ↓
4. Container re-renders, filters orders array
   ↓
5. Passes filteredOrders to OrdersTableUI
   ↓
6. OrdersTableUI re-renders with new data
```

### Data Flow: Search Implementation

```
1. User types in search input
   ↓
2. onChange handler calls setSearchQuery(value)
   ↓
3. Container filters orders based on query:
   orders.filter(o =>
     o.customer.includes(query) ||
     o.product.includes(query)
   )
   ↓
4. Filtered results passed to presentation
```

### Data Flow: Row Selection

```
1. User clicks table row
   ↓
2. onClick handler calls onRowSelect(orderId)
   ↓
3. Container updates selectedId state
   ↓
4. selectedId passed to both:
   - OrdersTableUI (highlight row)
   - OrderDetailsContainer (load details)
   ↓
5. Both components re-render
```

## Mock-First Development Pattern

### Phase 1: Static Mock Data (Current State)

```typescript
// In component file
const orders = [
  { id: "ORD-2847", customer: "Greenfield Farms", ... },
  // ... more orders
];

export default function OrdersTable() {
  return <div>{orders.map(...)}</div>;
}
```

**Characteristics:**
- No state
- No interactivity
- Data lives in component file
- Visual prototype only

### Phase 2: Extract Mock Service (Transition Step)

```typescript
// lib/services/orders-service.ts
export const ordersService = {
  getOrders: async () => {
    // Mock delay to simulate API
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      { id: "ORD-2847", customer: "Greenfield Farms", ... },
      // ... mock data moved here
    ];
  },

  getOrderById: async (id: string) => {
    const orders = await ordersService.getOrders();
    return orders.find(o => o.id === id) || null;
  }
};
```

**Benefits:**
- Centralized data source
- Simulates async behavior
- Same interface as future API
- Easy to swap later

### Phase 3: Add Client State & Interactions

```typescript
"use client"
import { useState, useEffect } from "react";
import { ordersService } from "@/lib/services/orders-service";

export default function OrdersTableContainer() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    ordersService.getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  // Business logic: compound filtering
  const displayedOrders = orders.filter(order => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch = searchQuery === "" ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <OrdersTableUI
      orders={displayedOrders}
      loading={loading}
      filter={filter}
      searchQuery={searchQuery}
      selectedId={selectedId}
      onFilterChange={setFilter}
      onSearchChange={setSearchQuery}
      onRowSelect={setSelectedId}
    />
  );
}
```

**Benefits:**
- Fully interactive with mock data
- All features working end-to-end
- Ready for API integration
- Loading states implemented

### Phase 4: Swap to Real API (Future)

```typescript
// lib/services/orders-service.ts
export const ordersService = {
  getOrders: async () => {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  },

  getOrderById: async (id: string) => {
    const response = await fetch(`/api/orders/${id}`);
    if (!response.ok) throw new Error("Failed to fetch order");
    return response.json();
  }
};
```

**CRITICAL:** Container component code UNCHANGED. Same interface, different implementation.

## State Management Strategy

### Recommended: useState + Context (for current scale)

```typescript
// For isolated table interactions
function OrdersTableContainer() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // ... component-local state sufficient
}

// For cross-component state (selected order shared)
// contexts/orders-context.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from "react";

interface OrdersContextValue {
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <OrdersContext.Provider value={{ selectedOrderId, setSelectedOrderId }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error("useOrders must be used within OrdersProvider");
  return context;
}
```

**When to use:**
- **useState**: State local to one component (filter, search)
- **Context**: State shared across components (selected order ID)
- **NOT needed yet**: Redux, Zustand, Jotai (over-engineering for current scope)

### State Colocation Principle

Keep state as close as possible to where it's used.

```
❌ BAD: All state in page component
Dashboard (page)
  ├─ filters, search, selected, kpiState, navState (too much!)

✅ GOOD: State distributed to containers
Dashboard (page)
  ├─ OrdersTableContainer (filters, search)
  ├─ OrderDetailsContainer (detailsState)
  ├─ KPICardsContainer (kpiState)
  └─ Context: selectedOrderId (shared between Orders + Details)
```

## Server/Client Boundary Management

### Next.js App Router: Server Components by Default

**Current pattern:** Everything is server components (no "use client")

**Required change:** Add "use client" to interactive components

```typescript
// app/page.tsx (STAYS SERVER COMPONENT)
import OrdersTableContainer from "@/components/OrdersTableContainer";

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main>
        <OrdersTableContainer /> {/* Client component boundary */}
      </main>
    </div>
  );
}

// components/OrdersTableContainer.tsx (NEW CLIENT COMPONENT)
"use client"
import { useState } from "react";

export default function OrdersTableContainer() {
  const [filter, setFilter] = useState("all");
  // ... interactions
}
```

**Boundary rules:**
1. Page components STAY server components (composition only)
2. Add "use client" ONLY to interactive containers
3. Presentation components INHERIT client context (no directive needed)
4. Keep server/client boundary HIGH in tree (minimal client JS)

### Component Tree with Boundaries

```
app/page.tsx (SERVER)
  │
  ├─ Sidebar (SERVER - static navigation for now)
  ├─ Header (SERVER - static for now)
  ├─ KPICards (SERVER - static for now)
  │
  ├─ OrdersTableContainer (CLIENT ← boundary)
  │   ├─ OrdersTableUI (CLIENT inherited)
  │   ├─ FilterPill (CLIENT inherited)
  │   └─ StatusBadge (CLIENT inherited)
  │
  └─ OrderDetailsContainer (CLIENT ← boundary)
      ├─ OrderDetailsUI (CLIENT inherited)
      └─ TimelineItem (CLIENT inherited)
```

## Patterns for Each Feature

### Feature: Status Filtering

**Component:** FilterPill

**State location:** OrdersTableContainer

**Pattern:** Controlled component

```typescript
function OrdersTableContainer() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all");

  return (
    <>
      <div className="flex gap-2">
        <FilterPill
          label="All"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <FilterPill
          label="Shipped"
          active={activeFilter === "shipped"}
          onClick={() => setActiveFilter("shipped")}
        />
      </div>
      <OrdersTableUI orders={filteredOrders} />
    </>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={active ? "active-styles" : "inactive-styles"}>
      {label}
    </button>
  );
}
```

### Feature: Search

**Component:** Search input (in table or header)

**State location:** OrdersTableContainer

**Pattern:** Debounced input for performance

```typescript
import { useState, useMemo } from "react";

function OrdersTableContainer() {
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search (optional - for real API)
  const debouncedQuery = useDebounce(searchQuery, 300);

  const searchedOrders = useMemo(() => {
    if (!debouncedQuery) return orders;

    const query = debouncedQuery.toLowerCase();
    return orders.filter(order =>
      order.customer.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query)
    );
  }, [orders, debouncedQuery]);

  return (
    <>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      <OrdersTableUI orders={searchedOrders} />
    </>
  );
}
```

**Debounce utility:**
```typescript
// lib/hooks/use-debounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Feature: Row Selection

**Pattern:** Controlled selection with visual highlight

```typescript
function OrdersTableContainer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <OrdersTableUI
      orders={orders}
      selectedId={selectedId}
      onRowClick={setSelectedId}
    />
  );
}

function OrdersTableUI({ orders, selectedId, onRowClick }) {
  return (
    <div>
      {orders.map(order => (
        <div
          key={order.id}
          onClick={() => onRowClick(order.id)}
          className={selectedId === order.id ? "bg-blue-50 border-blue-500" : ""}
        >
          {/* row content */}
        </div>
      ))}
    </div>
  );
}
```

**Accessibility:** Add keyboard navigation
```typescript
<div
  role="button"
  tabIndex={0}
  onClick={() => onRowClick(order.id)}
  onKeyDown={(e) => e.key === "Enter" && onRowClick(order.id)}
  className={...}
>
```

### Feature: "Has Changes" Filter

**Pattern:** Boolean filter + visual indicator

```typescript
function OrdersTableContainer() {
  const [showChangesOnly, setShowChangesOnly] = useState(false);

  const displayedOrders = orders.filter(order => {
    if (showChangesOnly && !order.hasChanges) return false;
    // ... other filters
    return true;
  });

  return (
    <>
      <button
        onClick={() => setShowChangesOnly(!showChangesOnly)}
        className={showChangesOnly ? "active" : ""}
      >
        Show Changes Only
      </button>
      <OrdersTableUI orders={displayedOrders} />
    </>
  );
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling

**What goes wrong:** Passing callbacks through 5+ component levels

```typescript
❌ BAD
<Dashboard onFilterChange={...}>
  <MainContent onFilterChange={...}>
    <TableWrapper onFilterChange={...}>
      <OrdersTable onFilterChange={...}>
        <FilterPill onClick={onFilterChange} />
```

**Prevention:** Use Context for deeply shared state

```typescript
✅ GOOD
<OrdersProvider>
  <Dashboard>
    <FilterPill /> {/* Uses useOrders() hook directly */}
    <OrdersTable /> {/* Uses useOrders() hook directly */}
```

### Anti-Pattern 2: State in Presentation Components

**What goes wrong:** Can't swap data source without rewriting component

```typescript
❌ BAD
function OrdersTable() {
  const [filter, setFilter] = useState("all");
  const orders = fetchOrders(); // Data fetching IN presentation

  return <div>{/* mixed logic + rendering */}</div>;
}
```

**Prevention:** Container/Presentation split

```typescript
✅ GOOD
// Container: logic + state
function OrdersTableContainer() {
  const [filter, setFilter] = useState("all");
  const orders = useFetchOrders();
  return <OrdersTableUI orders={orders} filter={filter} />;
}

// Presentation: rendering only
function OrdersTableUI({ orders, filter }) {
  return <div>{/* pure rendering */}</div>;
}
```

### Anti-Pattern 3: Direct DOM Manipulation

**What goes wrong:** Bypasses React's rendering cycle

```typescript
❌ BAD
function OrderRow({ order }) {
  const handleClick = () => {
    document.getElementById("order-details").innerHTML = order.details;
  };

  return <div onClick={handleClick}>{order.id}</div>;
}
```

**Prevention:** State-driven UI updates

```typescript
✅ GOOD
function OrdersContainer() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <OrderRow onClick={setSelectedId} />
      <OrderDetails orderId={selectedId} />
    </>
  );
}
```

### Anti-Pattern 4: Mixed Mock and Real Data

**What goes wrong:** Can't tell what's mock vs real, partial migrations fail

```typescript
❌ BAD
function OrdersTable() {
  const mockOrders = [...];
  const realKPIs = await fetch("/api/kpis");
  // Which is which? How to migrate?
}
```

**Prevention:** Service layer abstraction

```typescript
✅ GOOD
// All data comes from service (mock OR real, not mixed)
const orders = await ordersService.getOrders(); // Mock initially
const kpis = await kpiService.getKPIs(); // Mock initially

// Later: swap service implementation, not component code
```

## Build Order & Dependencies

### Recommended Implementation Sequence

**Phase 1: Extract & Establish Boundaries**
1. Create service layer (`lib/services/orders-service.ts`)
2. Move mock data from component to service
3. Keep existing UI rendering (visual regression test)

**Phase 2: Container Pattern**
1. Create OrdersTableContainer with "use client"
2. Extract OrdersTableUI (presentation component)
3. Verify rendering unchanged

**Phase 3: Add State (One Feature at a Time)**
1. Status filtering (useState for activeFilter)
2. Search input (useState for searchQuery)
3. Row selection (useState for selectedId)
4. "Has changes" filter (useState for showChangesOnly)

**Phase 4: Cross-Component Communication**
1. Create OrdersContext (selectedOrderId)
2. Wire OrdersTable → OrderDetails
3. Click row → details panel updates

**Phase 5: Loading & Error States**
1. Add loading state (useEffect + useState)
2. Add error handling (try/catch in service)
3. Display loading spinner, error messages

**Phase 6: API Ready (Future)**
1. Swap service implementation
2. No component changes required

### Dependency Graph

```
Service Layer (no dependencies)
    ↓
Container Components (depends on: Service, useState)
    ↓
Presentation Components (depends on: Container props)
    ↓
Context (optional - depends on: Containers)
```

**Critical path:** Service → Container → Presentation

**Parallelizable:** Can implement multiple containers simultaneously (OrdersTable, OrderDetails, KPICards) as long as service exists.

## Testing Strategy

### Unit Tests: Presentation Components

```typescript
// OrdersTableUI.test.tsx
import { render, screen } from "@testing-library/react";
import OrdersTableUI from "./OrdersTableUI";

test("renders order rows", () => {
  const mockOrders = [
    { id: "ORD-001", customer: "Test Farm", status: "shipped" }
  ];

  render(<OrdersTableUI orders={mockOrders} selectedId={null} />);

  expect(screen.getByText("ORD-001")).toBeInTheDocument();
  expect(screen.getByText("Test Farm")).toBeInTheDocument();
});

test("highlights selected row", () => {
  const mockOrders = [{ id: "ORD-001", customer: "Test Farm" }];

  render(<OrdersTableUI orders={mockOrders} selectedId="ORD-001" />);

  const row = screen.getByText("ORD-001").closest("div");
  expect(row).toHaveClass("bg-blue-50"); // or however selection is styled
});
```

### Integration Tests: Containers

```typescript
// OrdersTableContainer.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import OrdersTableContainer from "./OrdersTableContainer";

test("filters orders by status", async () => {
  render(<OrdersTableContainer />);

  // Wait for orders to load
  await screen.findByText("ORD-001");

  // Click filter pill
  fireEvent.click(screen.getByText("Shipped"));

  // Verify only shipped orders visible
  expect(screen.queryByText("ORD-pending")).not.toBeInTheDocument();
  expect(screen.getByText("ORD-shipped")).toBeInTheDocument();
});
```

### Service Tests: Mock vs Real

```typescript
// orders-service.test.ts
import { ordersService } from "./orders-service";

test("getOrders returns array", async () => {
  const orders = await ordersService.getOrders();
  expect(Array.isArray(orders)).toBe(true);
  expect(orders.length).toBeGreaterThan(0);
});

test("getOrderById returns single order", async () => {
  const order = await ordersService.getOrderById("ORD-001");
  expect(order).toHaveProperty("id", "ORD-001");
});

test("getOrderById returns null for invalid ID", async () => {
  const order = await ordersService.getOrderById("INVALID");
  expect(order).toBeNull();
});
```

## Performance Considerations

### Optimization: useMemo for Filtering

**Problem:** Filtering large arrays on every render is expensive

**Solution:** Memoize filtered results

```typescript
import { useMemo } from "react";

function OrdersTableContainer() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const displayedOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesFilter = filter === "all" || order.status === filter;
      const matchesSearch = !searchQuery ||
        order.customer.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchQuery]); // Only recompute when these change

  return <OrdersTableUI orders={displayedOrders} />;
}
```

### Optimization: Virtual Scrolling (Future)

**When needed:** > 1000 rows

**Library:** `@tanstack/react-virtual`

**Pattern:** Render only visible rows

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function OrdersTableUI({ orders }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height in px
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <OrderRow key={virtualRow.key} order={orders[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
}
```

**NOT needed for MVP:** Current data size (~100 orders) renders fine without virtualization.

## Migration Path: Current → Interactive

### Step-by-Step Transition

**Current state:** `OrdersTable.tsx` contains rendering + mock data, no state

**Step 1: Create service (no UI changes)**
```bash
# Create file: lib/services/orders-service.ts
# Move orders array from OrdersTable.tsx to service
# Export async getOrders() function
# Test: npm run dev (should render identically)
```

**Step 2: Add client boundary (no behavior changes)**
```typescript
// components/OrdersTableContainer.tsx
"use client"
export default function OrdersTableContainer() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    ordersService.getOrders().then(setOrders);
  }, []);

  return <OrdersTable orders={orders} />;
}

// components/OrdersTable.tsx (rename to OrdersTableUI)
export default function OrdersTableUI({ orders }) {
  // Keep existing rendering, remove inline data
  return <div>{/* existing JSX */}</div>;
}
```

**Step 3: Add first interaction (status filter)**
```typescript
"use client"
export default function OrdersTableContainer() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  const filteredOrders = orders.filter(o =>
    filter === "all" || o.status === filter
  );

  return (
    <OrdersTableUI
      orders={filteredOrders}
      activeFilter={filter}
      onFilterChange={setFilter}
    />
  );
}
```

**Step 4: Add remaining interactions**
- Search query
- Row selection
- "Has changes" filter

**Step 5: Wire to OrderDetails**
- Create Context or lift state
- Click row → update selectedId → details panel shows order

### Validation at Each Step

After each step, verify:
1. Visual regression: Does it look the same?
2. Functionality: Does the new feature work?
3. No console errors
4. TypeScript compiles without errors

## File Structure

### Recommended Organization

```
src/
├── app/
│   ├── layout.tsx (server component)
│   └── page.tsx (server component - composition only)
│
├── components/
│   ├── OrdersTableContainer.tsx (client - state + logic)
│   ├── OrdersTableUI.tsx (presentation)
│   ├── OrderDetailsContainer.tsx (client - state + logic)
│   ├── OrderDetailsUI.tsx (presentation)
│   ├── FilterPill.tsx (presentation)
│   ├── StatusBadge.tsx (presentation)
│   ├── SearchInput.tsx (presentation)
│   └── ... (other components)
│
├── lib/
│   ├── services/
│   │   ├── orders-service.ts (data abstraction)
│   │   └── kpi-service.ts
│   │
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   └── use-orders.ts (context hook)
│   │
│   └── types/
│       └── orders.ts (shared TypeScript interfaces)
│
└── contexts/
    └── orders-context.tsx (shared state)
```

### Naming Conventions

- **Container components:** `*Container.tsx` (e.g., `OrdersTableContainer.tsx`)
- **Presentation components:** `*UI.tsx` or just descriptive name (e.g., `OrdersTableUI.tsx`, `FilterPill.tsx`)
- **Services:** `*-service.ts` (e.g., `orders-service.ts`)
- **Hooks:** `use-*.ts` (e.g., `use-debounce.ts`)
- **Contexts:** `*-context.tsx` (e.g., `orders-context.tsx`)

## Sources & Confidence

| Topic | Confidence | Source |
|-------|------------|--------|
| React component patterns | HIGH | React 19 official patterns (current as of 2026) |
| Container/Presentation pattern | HIGH | Established React pattern since ~2015, still relevant |
| Next.js App Router server/client boundary | HIGH | Next.js 16 documentation (current version in project) |
| useState/useEffect patterns | HIGH | React Hooks API (stable since 2019) |
| Mock-first development | MEDIUM | Industry practice, not officially documented |
| Service layer pattern | HIGH | Common abstraction pattern in frontend architecture |
| useMemo optimization | HIGH | React performance documentation |
| Context API | HIGH | React built-in state management |
| Virtual scrolling | MEDIUM | TanStack Virtual library (not needed for MVP) |

**Research limitations:** WebSearch unavailable, relied on established React patterns and Next.js App Router conventions. Next.js 16 is current version as of project package.json. All patterns verified against React 19 (current in project).

**Validation sources:**
- React official documentation (react.dev)
- Next.js App Router documentation (nextjs.org)
- Established component composition patterns
- TypeScript best practices

**Low confidence areas:**
- Specific Next.js 16.1.6 SSR edge cases (docs cover general patterns)
- Optimal table library choice without market research (recommended vanilla approach for MVP)

## Key Recommendations Summary

1. **Introduce Container/Presentation split** to separate logic from rendering
2. **Create service layer** as swap point for mock → API transition
3. **Add "use client" boundaries** at container level, not presentation level
4. **Use useState + Context** for state management (avoid over-engineering)
5. **Build incrementally:** Service → Container → Features (one at a time)
6. **Mock async behavior** from the start (setTimeout in service) to prepare for API
7. **Keep presentation components pure** (props in, JSX out, no side effects)
8. **Test at boundaries:** Service tests, container integration tests, UI unit tests

**Critical success factor:** Maintaining clean separation allows mock-to-API swap in ONE place (service) without touching 20+ components.
