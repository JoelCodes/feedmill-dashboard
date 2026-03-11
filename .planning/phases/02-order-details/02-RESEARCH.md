# Phase 2: Order Details - Research

**Researched:** 2026-03-11
**Domain:** React state management, panel-table coordination, timeline visualization
**Confidence:** HIGH

## Summary

Phase 2 implements order details panel functionality with timeline visualization and change history. The core technical challenge is coordinating state between OrdersTable and OrderDetails components in a Next.js 16 App Router environment using React 19.

The project already has a complete OrderDetails prototype with timeline, StatCard, and TimelineItem components. The main implementation work involves lifting selection state to the parent (page.tsx), wiring panel updates on row click, implementing auto-selection behavior, and adding localStorage persistence for timeline sort preference.

**Primary recommendation:** Use React's "lifting state up" pattern to manage selectedOrderId in page.tsx, pass it to both OrdersTable and OrderDetails as props. Keep both components as client components marked with 'use client'. Use a custom useLocalStorage hook for timeline sort persistence.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Panel Behavior:**
- Panel is always visible on the right side (current prototype layout)
- Clicking a row updates panel content — no open/close mechanics needed
- Auto-select first row on page load — panel always has content
- When filters change and selected order is filtered out, auto-select first visible order
- Clicking the selected row does NOT deselect (always have a selection)

**Timeline Content:**
- Events to show: Status changes, Order placed, Mill/logistics changes
- Detail level: Brief — title + timestamp + one-line description
- Color coding by event type: Normal events = primary blue, changes/alerts = red, completion = green
- Sort order: Newest first by default
- Toggle to switch sort direction (small icon/button near "Timeline" header)
- Sort preference persisted in local storage

**Change History:**
- Changes appear inline in timeline (not separate section)
- Change types to track: Mill assignment, Delivery date, Quantity, Product changes
- Show before/after values: "Mill: ABC Mill → McGruff Mill" diff format
- Visual distinction: Red icon + red connector (error color) for change events

**Panel Header:**
- Title: Document # + Customer name ("ORD-2847 — Greenfield Farms")
- Status badge: Show current order status
- Subtitle: Product summary (quantity + texture + formula)
- Include: Delivery location

**Stat Cards:**
- Display: Quantity ordered, Delivery date, Texture type (with formula subtext)
- Behavior: Static display only (not interactive)

### Claude's Discretion

- Exact stat card layout and sizing
- Timeline toggle icon design
- Loading/transition states when switching orders
- Empty timeline handling (if no events yet)

### Deferred Ideas (OUT OF SCOPE)

- QC milestones (moisture/protein readings, batch numbers) — could be added later if needed
- Expandable timeline events for rich detail — keep simple for v1
- Clickable stat cards for drill-down — not needed for this phase

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DETAIL-01 | Click row to open order details panel | React lifting state pattern - selectedOrderId managed in page.tsx, onClick handler updates state |
| DETAIL-02 | Order details panel shows full order information | Order type already has all fields (customer, textureType, formulaType, quantity, location, deliveryDate, status), pass orderId to OrderDetails |
| DETAIL-03 | Timeline visualization of order lifecycle events | Prototype TimelineItem and TimelineConnector components exist, need to generate timeline data from Order properties |
| DETAIL-04 | Order change history display | hasChanges property exists on Order type, implement inline change events in timeline with red styling |
| DETAIL-05 | Panel closes via back button or close control | CONTEXT.md clarifies panel is always visible, just updates content - no close mechanics needed |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI framework | React 19 is current stable with Actions, useTransition, useOptimistic for modern state handling |
| Next.js | 16.1.6 | React framework | Next.js 16.1.6 (Feb 2026) is current stable, App Router is standard architecture |
| TypeScript | ^5 | Type safety | Provides full type safety for state management and props |
| Tailwind CSS | ^4 | Styling | v4 is current, already used in project for all component styling |
| lucide-react | ^0.577.0 | Icons | Already installed, provides timeline event icons (ShoppingCart, Truck, Factory, etc) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage API | Browser native | State persistence | For timeline sort preference - browser native, no library needed |
| React hooks | React 19 built-in | State management | useState for component state, useEffect for localStorage sync, useMemo for derived state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lifting state | React Context API | Context adds complexity for simple parent-child state, lifting state is cleaner for this scope |
| localStorage | sessionStorage | sessionStorage clears on tab close - localStorage persists across sessions (better UX) |
| Custom hook | Inline localStorage logic | Custom useLocalStorage hook provides reusability and cleaner code |

**Installation:**
No new packages required - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── page.tsx                    # Lift selectedOrderId state here
├── components/
│   ├── OrdersTable.tsx             # Expose selectedId/onSelectId props
│   ├── OrderDetails.tsx            # Accept orderId prop, fetch order data
│   └── ui/
│       └── StatusBadge.tsx         # Reuse in panel header
├── hooks/
│   ├── useDebounce.ts              # Already exists
│   └── useLocalStorage.ts          # Create for timeline sort persistence
├── services/
│   └── orders.ts                   # getOrderById already exists
└── types/
    └── order.ts                    # Order type complete
```

### Pattern 1: Lifting State Up (React Official Pattern)

**What:** Move selectedOrderId state from child (OrdersTable) to parent (page.tsx), pass down as props

**When to use:** When two sibling components need to share and synchronize state (OrdersTable selects, OrderDetails displays)

**Example:**
```typescript
// Source: https://react.dev/learn/sharing-state-between-components
// page.tsx
'use client';

import { useState } from 'react';
import OrdersTable from '@/components/OrdersTable';
import OrderDetails from '@/components/OrderDetails';

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <div className="flex gap-6">
      <OrdersTable
        selectedOrderId={selectedOrderId}
        onSelectOrder={setSelectedOrderId}
      />
      <OrderDetails orderId={selectedOrderId} />
    </div>
  );
}
```

### Pattern 2: Auto-Selection on Filter Change

**What:** Derive valid selection from filtered results, auto-select first if current selection is filtered out

**When to use:** When filters can remove the currently selected item from view

**Example:**
```typescript
// In OrdersTable.tsx
const filteredOrders = useMemo(() => {
  // ... apply filters
}, [orders, activeStatuses, hasChangesFilter, debouncedSearch]);

// Derive valid selection - already implemented in Phase 1
const validSelectedId = selectedOrderId &&
  filteredOrders.some(o => o.id === selectedOrderId)
    ? selectedOrderId
    : null;

// Auto-select first if nothing valid
useEffect(() => {
  if (!validSelectedId && filteredOrders.length > 0) {
    onSelectOrder(filteredOrders[0].id);
  }
}, [validSelectedId, filteredOrders, onSelectOrder]);
```

### Pattern 3: localStorage Persistence with Custom Hook

**What:** Custom hook that syncs state with localStorage, providing type-safe persistence

**When to use:** For user preferences that should persist across sessions (timeline sort order)

**Example:**
```typescript
// Source: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Initialize state from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Usage in OrderDetails.tsx
const [sortOrder, setSortOrder] = useLocalStorage<'asc' | 'desc'>(
  'orderTimelineSortOrder',
  'desc'
);
```

### Pattern 4: Timeline Event Generation

**What:** Generate timeline events from Order data and change history

**When to use:** Converting structured order data into visual timeline representation

**Example:**
```typescript
// In OrderDetails.tsx
interface TimelineEvent {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  date: Date;
  color: 'primary' | 'success' | 'error';
  isChange?: boolean;
}

function generateTimelineEvents(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Order placed event (always present)
  events.push({
    id: 'order-placed',
    icon: ShoppingCart,
    title: 'Order Placed',
    description: `Order received from ${order.customer}`,
    date: order.createdAt,
    color: 'primary',
  });

  // Change events (if hasChanges flag is true)
  if (order.hasChanges) {
    events.push({
      id: 'change-event',
      icon: AlertTriangle,
      title: 'Order Modified',
      description: 'Mill: ABC Mill → McGruff Mill',
      date: order.updatedAt,
      color: 'error',
      isChange: true,
    });
  }

  // Status-based events (derive from current status)
  if (order.status === 'Producing' || order.status === 'Ready' ||
      order.status === 'In Transit' || order.status === 'Complete') {
    events.push({
      id: 'production',
      icon: Factory,
      title: 'Production Started',
      description: `Producing ${order.quantity} tons`,
      date: new Date(order.updatedAt.getTime() - 86400000), // 1 day before
      color: 'primary',
    });
  }

  return events;
}
```

### Anti-Patterns to Avoid

- **Prop drilling through many levels:** If state needs to pass through 3+ intermediate components, consider Context API instead
- **Setting state in render:** Never call setState during render - use useEffect for derived state syncing
- **Stale closure in useEffect:** Always include dependencies in useEffect array to avoid stale values
- **Direct localStorage access in render:** Always use useState + useEffect pattern, not direct reads in render
- **Mutating order data:** Order objects should be treated as immutable - never modify properties directly

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom localStorage wrapper with event listeners | useLocalStorage hook with useState + useEffect | localStorage has quota limits, JSON parsing edge cases, SSR considerations - tested hook handles all this |
| Date formatting | Manual string concatenation or Intl.DateTimeFormat | formatDeliveryDate utility (already exists) | Date formatting has locale/timezone complexity - project already has consistent formatter |
| Debounced input | setTimeout logic with cleanup | useDebounce hook (already exists) | Debouncing has cleanup/cancellation edge cases - project hook already handles this |
| Timeline sorting | Manual array.sort with multiple conditions | Array.sort with date comparison + reverse | Sorting by date is simple, but consider using lodash/sortBy if multiple sort criteria needed |

**Key insight:** React state management patterns (lifting state, controlled components) are well-established. Don't try to be clever with global stores or event emitters for simple parent-child coordination.

## Common Pitfalls

### Pitfall 1: useState in Server Components
**What goes wrong:** Using useState, useEffect, or event handlers in Server Components causes build errors
**Why it happens:** Next.js App Router components are Server Components by default - they run on server, can't use client hooks
**How to avoid:** Add 'use client' directive at top of any component using state, effects, or event handlers
**Warning signs:** Build error "You're importing a component that needs useState. It only works in a Client Component..."

### Pitfall 2: Stale Selection After Filter Change
**What goes wrong:** Selected order remains when it's filtered out, causing OrderDetails to show nothing or wrong order
**Why it happens:** Selection state isn't validated against filtered results
**How to avoid:** Derive validSelectedId from filteredOrders (already implemented in Phase 1), auto-select first visible order when invalid
**Warning signs:** Panel shows blank/loading when selection is filtered out

### Pitfall 3: localStorage Access During SSR
**What goes wrong:** Reading localStorage during initial render throws "localStorage is not defined" error
**Why it happens:** Next.js pre-renders on server where window/localStorage don't exist
**How to avoid:** Guard with `typeof window === 'undefined'` check, return initialValue during SSR
**Warning signs:** Server-side error mentioning window or localStorage

### Pitfall 4: Infinite useEffect Loop
**What goes wrong:** useEffect triggers on every render, causing infinite re-render loop
**Why it happens:** Setting state inside useEffect without proper dependencies or derived state checks
**How to avoid:** Use dependency array correctly, derive state in useMemo instead of useEffect when possible, check if new value differs before setState
**Warning signs:** Browser freezes, React warns "Maximum update depth exceeded"

### Pitfall 5: Not Memoizing Event Handlers
**What goes wrong:** Passing inline arrow functions as props causes child re-renders on every parent render
**Why it happens:** New function instance created each render, React sees it as prop change
**How to avoid:** Use useCallback for event handlers passed to child components, or lift handler to stable function reference
**Warning signs:** Performance issues, child components re-rendering unnecessarily

### Pitfall 6: Missing Timeline Sort Toggle Visibility
**What goes wrong:** Timeline sort toggle always visible, even when timeline is empty
**Why it happens:** Not conditionally rendering based on event count
**How to avoid:** Only show toggle when timelineEvents.length > 0
**Warning signs:** UI shows sort control with no items to sort

## Code Examples

Verified patterns from official sources and existing codebase:

### Lifting State to Parent (Next.js 16 Client Component)
```typescript
// Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import KPICards from '@/components/KPICard';
import OrdersTable from '@/components/OrdersTable';
import OrderDetails from '@/components/OrderDetails';

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />

      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        <KPICards />

        <div className="flex min-h-0 flex-1 gap-6">
          <OrdersTable
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
          />
          <OrderDetails orderId={selectedOrderId} />
        </div>
      </main>
    </div>
  );
}
```

### OrderDetails with Async Data Fetching
```typescript
// Source: Existing OrderDetails.tsx prototype + Next.js patterns
// components/OrderDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Factory, Truck, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getOrderById } from '@/services/orders';
import { Order } from '@/types/order';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface OrderDetailsProps {
  orderId: string | null;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useLocalStorage<'asc' | 'desc'>(
    'orderTimelineSortOrder',
    'desc'
  );

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    getOrderById(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!order) {
    return <div>Select an order to view details</div>;
  }

  const timelineEvents = generateTimelineEvents(order);
  const sortedEvents = sortOrder === 'desc'
    ? [...timelineEvents].reverse()
    : timelineEvents;

  return (
    <div className="flex w-120 flex-col gap-4 rounded-[15px] bg-white p-5.25">
      {/* Header with status badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-text-primary text-lg font-bold">
            {order.documentNumber} — {order.customer}
          </h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-text-secondary text-sm">
          {order.quantity} tons {order.textureType} · {order.location}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-3">
        <StatCard label="Quantity" value={order.quantity.toString()} unit="tons" />
        <StatCard
          label="Delivery"
          value={formatDeliveryDate(order.deliveryDate)}
        />
        <StatCard
          label="Texture"
          value={order.textureType}
          subtext={order.formulaType}
        />
      </div>

      {/* Timeline with sort toggle */}
      {timelineEvents.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-text-primary text-sm font-bold">Timeline</h3>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="text-primary hover:text-primary/80 text-xs"
            >
              {sortOrder === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
            </button>
          </div>

          <div className="flex flex-col">
            {sortedEvents.map((event, index) => (
              <div key={event.id}>
                <TimelineItem {...event} />
                {index < sortedEvents.length - 1 && (
                  <TimelineConnector color={event.color} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

### Auto-Selection Pattern
```typescript
// In OrdersTable.tsx
export default function OrdersTable({
  selectedOrderId,
  onSelectOrder
}: {
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);

  // ... filtering logic ...

  const filteredOrders = useMemo(() => {
    // Apply filters
    return filtered;
  }, [orders, filters]);

  // Auto-select first order on initial load
  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      onSelectOrder(filteredOrders[0].id);
    }
  }, [selectedOrderId, filteredOrders, onSelectOrder]);

  // Validate selection is in filtered results
  const validSelectedId = selectedOrderId &&
    filteredOrders.some(o => o.id === selectedOrderId)
      ? selectedOrderId
      : null;

  // Auto-select first if current selection filtered out
  useEffect(() => {
    if (!validSelectedId && filteredOrders.length > 0 && selectedOrderId) {
      onSelectOrder(filteredOrders[0].id);
    }
  }, [validSelectedId, filteredOrders, selectedOrderId, onSelectOrder]);

  return (
    // ... render with validSelectedId for highlighting ...
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for all state | Lifting state for local, Context for global | React 16.8+ (Hooks) | Simpler code, less boilerplate for component-local state |
| Class components with this.state | Functional components with useState | React 16.8+ (2019) | Cleaner syntax, better composition with hooks |
| Manual localStorage sync | useLocalStorage hook pattern | 2020+ | Eliminates SSR bugs, provides type safety with TypeScript |
| Prop drilling through many levels | React Context API | React 16.3+ (2018) | Reduces prop passing, but lifting state still preferred for 2-3 levels |
| useLayoutEffect for storage | useState initializer function | React 18+ | Avoids hydration mismatches, cleaner SSR |

**Deprecated/outdated:**
- **Class components with componentDidMount:** Use useEffect instead - simpler, better with TypeScript
- **Uncontrolled components for forms:** Use controlled components with useState - better for validation/coordination
- **Global event bus for component communication:** Use props/callbacks (lifting state) or Context - more React-idiomatic

## Open Questions

1. **Timeline Event Data Source**
   - What we know: Order type has createdAt, updatedAt, status, hasChanges
   - What's unclear: Detailed change history (what changed from → to), production/delivery event timestamps
   - Recommendation: For Phase 2, generate placeholder timeline events from Order properties. Document need for change_history table/field in future API work.

2. **Empty Timeline State**
   - What we know: New/pending orders might have minimal timeline (just "Order Placed")
   - What's unclear: Should we show empty state message or just the single event?
   - Recommendation: Show any available events (even if just one), no special empty state needed.

3. **Loading State Duration**
   - What we know: getOrderById has 200ms delay (mock service)
   - What's unclear: Real API latency, whether to show skeleton during order switching
   - Recommendation: Start without loading skeleton for fast switches (<200ms), add skeleton if user testing shows need.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected - recommend Vitest 2.x or Jest 29.x for React Testing Library |
| Config file | None - see Wave 0 |
| Quick run command | `npm test -- --run` (after setup) |
| Full suite command | `npm test` (after setup) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETAIL-01 | Click row updates panel | integration | `npm test OrdersTable.test.tsx -t "updates selection on row click"` | ❌ Wave 0 |
| DETAIL-02 | Panel shows full order info | unit | `npm test OrderDetails.test.tsx -t "renders order information"` | ❌ Wave 0 |
| DETAIL-03 | Timeline visualization | unit | `npm test OrderDetails.test.tsx -t "renders timeline events"` | ❌ Wave 0 |
| DETAIL-04 | Change history display | unit | `npm test OrderDetails.test.tsx -t "shows change events"` | ❌ Wave 0 |
| DETAIL-05 | Panel always visible | unit | `npm test OrderDetails.test.tsx -t "panel remains visible"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (fast mode, no watch)
- **Per wave merge:** `npm test -- --coverage` (full suite with coverage)
- **Phase gate:** Full suite green + manual UAT before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/components/OrdersTable.test.tsx` — covers DETAIL-01 (row click updates selection)
- [ ] `tests/components/OrderDetails.test.tsx` — covers DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
- [ ] `tests/hooks/useLocalStorage.test.tsx` — covers timeline sort persistence
- [ ] `tests/setup.ts` — React Testing Library config
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — if choosing Vitest
- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment

*(Note: Test infrastructure setup deferred based on project workflow.nyquist_validation config)*

## Sources

### Primary (HIGH confidence)
- [React Official Docs - Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) - Lifting state pattern
- [Next.js 16 Official Docs - Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Client component patterns
- Existing codebase: OrderDetails.tsx prototype, OrdersTable.tsx selection state, Order type definition

### Secondary (MEDIUM confidence)
- [Josh W. Comeau - Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - useLocalStorage pattern
- [Material Tailwind - Timeline Component](https://www.material-tailwind.com/docs/react/timeline) - Timeline design patterns
- [Flowbite React - Timeline](https://flowbite-react.com/docs/components/timeline) - Vertical timeline examples

### Tertiary (LOW confidence)
- Medium articles on React state management - general patterns, not version-specific
- WebSearch results on auto-selection patterns - no canonical library/pattern found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and verified in package.json
- Architecture: HIGH - React/Next.js official patterns, existing prototype provides validation
- Pitfalls: HIGH - Well-documented patterns with clear error messages from framework
- Timeline implementation: MEDIUM - Prototype exists but event generation logic needs to be built
- Test framework: LOW - No existing test infrastructure detected, recommendation based on ecosystem trends

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days - stable technologies)
