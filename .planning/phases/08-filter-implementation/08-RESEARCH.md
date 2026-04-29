# Phase 08: Filter Implementation - Research

**Researched:** 2026-04-29
**Domain:** React client-side state management with multi-select filter UI patterns
**Confidence:** HIGH

## Summary

Phase 08 implements interactive status filter pills for the mill production dashboard, enabling users to toggle between Completed, Mixing, Blocked, and Pending states. This phase extracts the existing FilterPill component from OrdersTable.tsx into a shared component and integrates it into the mill-production page with ProductionState-specific configuration.

The implementation leverages established patterns from the orders page (Set-based state management, multi-select toggle logic, and empty-state-shows-all filtering) and applies them to the mill production context. The core technical challenge is managing filter state at the page level while distributing filtered orders across three MillColumn components without prop drilling or performance regressions.

**Primary recommendation:** Use React useState with Set for multi-select state management (existing pattern in OrdersTable.tsx), extract FilterPill to shared component accepting generic color props, and apply filters at page level before distributing orders to MillColumn components.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Filter pill rendering | Browser / Client | — | Interactive UI requiring useState, event handlers, DOM manipulation |
| Filter state management | Browser / Client | — | Client-only state (Set<ProductionState>) with toggle logic |
| Filtering logic | Browser / Client | — | Pure data transformation (filter array based on Set membership) |
| Status count computation | Browser / Client | — | Derived from full orders array via useMemo |
| Data distribution to columns | Browser / Client | — | Filter orders then split by millLine property |

**No backend involvement:** All filtering occurs client-side on data already loaded from getProductionOrders service. No API changes required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Extract shared FilterPill to `src/components/FilterPill.tsx` — both orders page and mill production use the same component with different color configs
- **D-02:** FilterPill accepts a generic color prop, decoupling it from any specific status type
- **D-03:** Non-matching cards hidden completely when filters active (not dimmed) — matches orders page pattern
- **D-04:** No filters selected by default (show all cards) — FILTR-05 requirement
- **D-05:** Multi-select toggle: clicking a pill toggles that status on/off, multiple pills can be active simultaneously — FILTR-03 requirement
- **D-06:** Count badges show total orders per status, not filtered count — per D-04 from Phase 6 and FILTR-04 requirement
- **D-07:** Counts remain static regardless of which other filters are active

### Claude's Discretion
- FilterPill props interface design (label, count, color, isActive, onClick)
- State management approach (useState with Set, matching orders page pattern)
- Filter strip positioning/spacing within the layout

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FILTR-01 | User can see status filter pills (Completed, Mixing, Blocked, Pending) above columns | FilterPill component extraction + horizontal strip layout pattern |
| FILTR-02 | User can click a filter pill to show only cards with that status | Set-based toggle state + filter logic (activeStates.has(order.state)) |
| FILTR-03 | User can click multiple pills to show combined statuses | Set.add/delete pattern supports multi-select inherently |
| FILTR-04 | User can see count badges showing orders per status | useMemo to compute counts from full orders array (not filtered subset) |
| FILTR-05 | User sees all cards when no filters selected (default state) | Initialize activeStates as empty Set; filter only when size > 0 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 [VERIFIED: npm registry 2026-04-29] | Component state management | Project dependency; useState hook for filter state |
| Next.js | 16.1.6 [VERIFIED: package.json] | App Router client components | Project framework; requires "use client" directive for interactivity |
| TypeScript | 5.x [VERIFIED: package.json] | Type safety for props interfaces | Project standard; FilterPillProps interface design |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x [VERIFIED: package.json] | Styling filter pills | All styling; design tokens from globals.css for colors |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState with Set | useState with Array | Array requires filter+push for toggle; Set has O(1) has/add/delete vs O(n) |
| Client-side filtering | URL query params | Query params add complexity for temporary UI state; overkill for non-persistent filters |
| Shared FilterPill | Duplicate components | Code duplication vs abstraction; shared component wins per D-01 |

**Installation:**
No new dependencies required — all libraries already in package.json.

**Version verification:**
```bash
npm view react version        # 19.2.5 (latest); using 19.2.3 (compatible)
npm view next version          # 16.2.4 (latest); using 16.1.6 (compatible)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ mill-production/page.tsx (Client Component)                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Initial Load                                                  │   │
│  │   useEffect → getProductionOrders() → setOrders(data)        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Filter State Management                                       │   │
│  │   const [activeStates, setActiveStates] =                    │   │
│  │     useState<Set<ProductionState>>(new Set())                │   │
│  │                                                               │   │
│  │   toggleState(state) → Set.has ? delete : add → re-render    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Filtering Logic (useMemo)                                     │   │
│  │   filteredOrders = activeStates.size === 0                   │   │
│  │     ? orders                                                  │   │
│  │     : orders.filter(o => activeStates.has(o.state))          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Status Counts (useMemo)                                       │   │
│  │   stateCounts = STATE_ORDER.reduce((acc, state) =>           │   │
│  │     { acc[state] = orders.filter(o => o.state === state).    │   │
│  │       length; return acc; }, {})                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Render Pipeline                                               │   │
│  │                                                               │   │
│  │   <Header />                                                  │   │
│  │                                                               │   │
│  │   <div className="filter-strip">                             │   │
│  │     {STATE_ORDER.map(state => (                              │   │
│  │       <FilterPill                                            │   │
│  │         label={state}                                        │   │
│  │         count={stateCounts[state]}                           │   │
│  │         color={STATE_COLORS[state]}                          │   │
│  │         isActive={activeStates.has(state)}                   │   │
│  │         onClick={() => toggleState(state)}                   │   │
│  │       />                                                      │   │
│  │     ))}                                                       │   │
│  │   </div>                                                      │   │
│  │                                                               │   │
│  │   <div className="mill-columns">                             │   │
│  │     <MillColumn millLine="Premix"                            │   │
│  │       orders={filteredOrders.filter(                         │   │
│  │         o => o.millLine === "Premix")} />                    │   │
│  │     <MillColumn millLine="Excel" ... />                      │   │
│  │     <MillColumn millLine="CGM" ... />                        │   │
│  │   </div>                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ FilterPill.tsx (Shared Component)                                   │
│                                                                       │
│  Props: { label, count, color, isActive, onClick }                  │
│                                                                       │
│  Render:                                                             │
│    <button onClick={onClick}                                         │
│      className={isActive ? activeStyles : inactiveStyles}>          │
│      <span>{label}</span>                                            │
│      <div className="count-badge">{count}</div>                      │
│    </button>                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User clicks FilterPill → onClick fires
2. toggleState updates activeStates Set → triggers re-render
3. useMemo recalculates filteredOrders based on new activeStates
4. filteredOrders passed to MillColumn components
5. MillColumn re-renders with filtered subset

**Key decision:** Filter at page level, not inside MillColumn. This keeps filtering logic centralized and avoids duplicating filter state across three columns.

### Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| FilterPill | src/components/FilterPill.tsx | Generic pill UI with label, count badge, active/inactive styling |
| mill-production/page.tsx | src/app/mill-production/page.tsx | Filter state management, filtering logic, status counts, layout orchestration |
| MillColumn | src/app/mill-production/page.tsx | Render orders for single mill line (existing component, no changes) |

### Recommended Project Structure
```
src/
├── components/
│   ├── FilterPill.tsx       # NEW: Extracted shared component
│   └── ui/
│       └── StatusBadge.tsx  # Existing status indicator (different from FilterPill)
├── app/
│   ├── mill-production/
│   │   └── page.tsx         # MODIFIED: Add filter state + FilterPill rendering
│   └── page.tsx             # Orders page (will refactor to use shared FilterPill)
└── types/
    └── millProduction.ts    # ProductionState type already defined
```

### Pattern 1: Set-Based Multi-Select Toggle
**What:** Use JavaScript Set for managing active filter selections with add/delete toggle logic
**When to use:** Multi-select filters where users can activate multiple options simultaneously
**Example:**
```typescript
// Source: src/components/OrdersTable.tsx (lines 19, 40-50) [VERIFIED: codebase]
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

const toggleState = (state: ProductionState) => {
  setActiveStates(prev => {
    const next = new Set(prev);  // Always create new Set (immutability)
    if (next.has(state)) {
      next.delete(state);
    } else {
      next.add(state);
    }
    return next;
  });
};
```

**Why this pattern:**
- O(1) has/add/delete operations vs O(n) for array includes/filter/push [CITED: https://medium.com/@rakibshakib/efficiently-managing-selection-states-in-react-a-comprehensive-guide-8ed00f173adb]
- Immutability: new Set(prev) prevents mutating state [CITED: https://react.dev/learn/updating-objects-in-state]
- React recognizes new Set as state change and triggers re-render

### Pattern 2: Empty State = Show All
**What:** Treat empty Set as "no filters applied" rather than "filter to nothing"
**When to use:** Default behavior should show all items, not zero items
**Example:**
```typescript
// Source: src/components/OrdersTable.tsx (lines 68-79) [VERIFIED: codebase]
const filteredOrders = useMemo(() => {
  let result = orders;

  // Apply status filter (empty set = show all)
  if (activeStates.size > 0) {
    result = result.filter(order => activeStates.has(order.state));
  }

  return result;
}, [orders, activeStates]);
```

**Why this pattern:**
- Matches user expectation: landing on page shows all data (FILTR-05 requirement)
- Prevents confusing empty state where nothing renders on initial load
- Standard UX pattern for filters [CITED: https://www.fullstack.com/labs/resources/blog/building-a-responsive-filter-component-on-react]

### Pattern 3: Static Count Badges
**What:** Count badges reflect total orders per status, unaffected by active filters
**When to use:** Users need context about full dataset, not just visible subset
**Example:**
```typescript
// Compute counts from full orders array, not filtered subset
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce((acc, state) => {
    acc[state] = orders.filter(o => o.state === state).length;
    return acc;
  }, {} as Record<ProductionState, number>);
}, [orders]);  // Depends on orders, NOT activeStates

// Pass unaffected count to FilterPill
<FilterPill
  label={state}
  count={stateCounts[state]}  // Always shows total, not filtered count
  isActive={activeStates.has(state)}
  onClick={() => toggleState(state)}
/>
```

**Why this pattern:**
- User decision D-06/D-07: counts provide dataset context regardless of filter state
- Helps users understand data distribution before filtering
- Matches Phase 6 design specification [VERIFIED: .planning/phases/06-design/06-CONTEXT.md D-04]

### Pattern 4: Shared Component with Generic Props
**What:** Extract FilterPill with generic color/styling props instead of status-specific logic
**When to use:** Component used across multiple contexts with different status types
**Example:**
```typescript
// Source: Refactored from OrdersTable.tsx FilterPill (lines 396-432)
interface FilterPillProps {
  label: string;
  count: number;
  color?: string;          // Generic color, not tied to OrderStatus or ProductionState
  isActive: boolean;
  onClick: () => void;
}

function FilterPill({ label, count, color, isActive, onClick }: FilterPillProps) {
  const bgClass = isActive ? 'bg-primary' : (color || 'bg-gray-100');
  const textClass = isActive ? 'text-white' : 'text-gray-600';
  const countBgClass = isActive ? 'bg-white/20' : 'bg-gray-200';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
    >
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
```

**Why this pattern:**
- Decouples component from specific domain (OrderStatus vs ProductionState) per D-02
- Orders page and mill production page can share same component with different configs
- Follows React component reusability principles [CITED: https://react.wiki/components/reusable-components/]

### Anti-Patterns to Avoid
- **Mutating Set directly:** `activeStates.add(state)` without creating new Set breaks React's change detection [CITED: https://react.dev/learn/updating-objects-in-state]
- **Filtering inside MillColumn:** Creates three separate filter implementations; centralize at page level
- **Using status-specific logic in FilterPill:** Hardcoding OrderStatus or ProductionState types prevents reuse
- **Depending on filtered data for counts:** Defeats purpose of showing total dataset distribution

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select state management | Custom array mutation logic | Set with add/delete | O(1) operations, built-in uniqueness guarantee, no index tracking |
| Filter UI component library | Install headless-ui or radix-ui | Extract from existing OrdersTable | Already have working pattern; external library adds bundle size |
| URL query param sync | Custom query string parser | (Deferred to FILTR-08) | Not required for v1.1; adds routing complexity |
| Memoization library | Install reselect or useMemoize | React's useMemo | Built-in, sufficient for this use case |

**Key insight:** JavaScript Set is purpose-built for membership testing and uniqueness enforcement. Attempting to replicate this with arrays (checking includes, filtering, ensuring no duplicates) introduces bugs and performance issues. [CITED: https://medium.com/@rakibshakib/efficiently-managing-selection-states-in-react-a-comprehensive-guide-8ed00f173adb]

## Common Pitfalls

### Pitfall 1: Directly Mutating Set State
**What goes wrong:** `activeStates.add(state)` mutates the Set in place without creating a new reference, preventing React from detecting the state change and triggering a re-render.
**Why it happens:** Sets are mutable objects in JavaScript; developers familiar with array push often apply same pattern to Sets
**How to avoid:** Always create `new Set(prev)` before modifying:
```typescript
setActiveStates(prev => {
  const next = new Set(prev);  // Create new Set
  next.add(state);             // Safe to mutate the new copy
  return next;
});
```
**Warning signs:** Filter pills highlight on click but cards don't update; React DevTools shows state unchanged
[CITED: https://react.dev/learn/updating-objects-in-state]

### Pitfall 2: Forgetting "use client" Directive
**What goes wrong:** Next.js App Router defaults to Server Components; missing `"use client"` directive causes "useState can only be used in Client Components" error
**Why it happens:** Developers add interactivity to existing Server Component without marking client boundary
**How to avoid:** Add `"use client"` as first line (before imports) when using useState, useEffect, or event handlers
```typescript
"use client";  // Must be first line

import { useState } from "react";
```
**Warning signs:** Build error mentioning hooks/event handlers only work in Client Components
[VERIFIED: Next.js 16 official docs https://nextjs.org/docs/app/guides/testing/vitest]

### Pitfall 3: Filtering Twice (Page + MillColumn)
**What goes wrong:** Applying filters at page level then filtering again inside MillColumn causes cards to disappear unexpectedly or requires passing filter state as props through multiple layers
**Why it happens:** Unclear separation of concerns between page orchestration and column rendering
**How to avoid:** Filter once at page level, pass filtered subset to MillColumn:
```typescript
// CORRECT: Filter at page level
const filteredOrders = useMemo(() => {
  let result = orders;
  if (activeStates.size > 0) {
    result = result.filter(order => activeStates.has(order.state));
  }
  return result;
}, [orders, activeStates]);

// MillColumn receives pre-filtered data
<MillColumn millLine="Premix" orders={filteredOrders.filter(o => o.millLine === "Premix")} />

// INCORRECT: Passing filter state to MillColumn
<MillColumn millLine="Premix" orders={orders} activeStates={activeStates} />  // Prop drilling
```
**Warning signs:** MillColumn needs activeStates prop; filter logic duplicated in three places

### Pitfall 4: Count Badges Changing with Filters
**What goes wrong:** Computing counts from filtered subset makes badges update when filters toggle, contradicting D-06/D-07 requirement for static counts
**Why it happens:** Developer naturally computes counts from same array used for rendering (filteredOrders instead of orders)
**How to avoid:** Compute counts from full orders array, independent of activeStates:
```typescript
// CORRECT: Depends only on orders
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce((acc, state) => {
    acc[state] = orders.filter(o => o.state === state).length;
    return acc;
  }, {} as Record<ProductionState, number>);
}, [orders]);  // NOT [filteredOrders]

// INCORRECT: Changes with filters
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce((acc, state) => {
    acc[state] = filteredOrders.filter(o => o.state === state).length;
    return acc;
  }, {} as Record<ProductionState, number>);
}, [filteredOrders]);  // Wrong dependency
```
**Warning signs:** Badge shows "Completed (3)" then drops to "Completed (0)" when deselecting Completed filter

### Pitfall 5: Accessibility - Missing Button Semantics
**What goes wrong:** Using div or span with onClick instead of button element breaks keyboard navigation (Space/Enter keys don't activate) and screen reader semantics
**Why it happens:** Developers style custom elements without considering accessibility requirements
**How to avoid:** Use semantic button element with proper hover/focus states:
```typescript
// CORRECT
<button
  onClick={onClick}
  className="..."
  aria-pressed={isActive}  // Indicates toggle state to screen readers
>
  {label}
</button>

// INCORRECT
<div onClick={onClick} className="...">  // Not keyboard accessible
  {label}
</div>
```
**Warning signs:** Tab key doesn't focus pills; Space/Enter don't activate; screen readers don't announce as buttons
[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/button/]

## Code Examples

Verified patterns from official sources and existing codebase:

### Multi-Select Toggle with Set State
```typescript
// Source: src/components/OrdersTable.tsx [VERIFIED: codebase]
import { useState } from "react";
import { ProductionState } from "@/types/millProduction";

const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

const toggleState = (state: ProductionState) => {
  setActiveStates(prev => {
    const next = new Set(prev);
    if (next.has(state)) {
      next.delete(state);
    } else {
      next.add(state);
    }
    return next;
  });
};
```

### Filtering Logic with Empty State Check
```typescript
// Source: src/components/OrdersTable.tsx adapted for ProductionState [VERIFIED: codebase]
import { useMemo } from "react";

const filteredOrders = useMemo(() => {
  let result = orders;

  // Empty set = show all (FILTR-05)
  if (activeStates.size > 0) {
    result = result.filter(order => activeStates.has(order.state));
  }

  return result;
}, [orders, activeStates]);
```

### Static Count Computation
```typescript
// Compute counts from full dataset, unaffected by filters
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce((acc, state) => {
    acc[state] = orders.filter(o => o.state === state).length;
    return acc;
  }, {} as Record<ProductionState, number>);
}, [orders]);  // Only depends on orders, NOT activeStates
```

### Shared FilterPill Component
```typescript
// Source: Extracted from OrdersTable.tsx FilterPill component (lines 396-432)
// File: src/components/FilterPill.tsx [NEW]
interface FilterPillProps {
  label: string;
  count: number;
  color?: string;
  isActive: boolean;
  onClick: () => void;
}

export default function FilterPill({
  label,
  count,
  color,
  isActive,
  onClick
}: FilterPillProps) {
  const bgClass = isActive ? 'bg-primary' : (color || 'bg-gray-100');
  const textClass = isActive ? 'text-white' : 'text-gray-600';
  const countBgClass = isActive ? 'bg-white/20' : 'bg-gray-200';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
      aria-pressed={isActive}
      aria-label={`Filter by ${label}, ${count} orders`}
    >
      <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
      <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
        <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
      </div>
    </button>
  );
}
```

### Filter Strip Integration
```typescript
// Source: mill-production/page.tsx [MODIFIED]
"use client";

import { useState, useEffect, useMemo } from "react";
import FilterPill from "@/components/FilterPill";
import { ProductionState } from "@/types/millProduction";

const STATE_ORDER: ProductionState[] = ["Completed", "Mixing", "Blocked", "Pending"];

export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

  const toggleState = (state: ProductionState) => {
    setActiveStates(prev => {
      const next = new Set(prev);
      next.has(state) ? next.delete(state) : next.add(state);
      return next;
    });
  };

  const stateCounts = useMemo(() => {
    return STATE_ORDER.reduce((acc, state) => {
      acc[state] = orders.filter(o => o.state === state).length;
      return acc;
    }, {} as Record<ProductionState, number>);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStates.size === 0) return orders;
    return orders.filter(order => activeStates.has(order.state));
  }, [orders, activeStates]);

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />

        {/* Filter strip */}
        <div className="flex gap-2">
          {STATE_ORDER.map(state => (
            <FilterPill
              key={state}
              label={state}
              count={stateCounts[state]}
              color={STATE_COLORS[state].header}
              isActive={activeStates.has(state)}
              onClick={() => toggleState(state)}
            />
          ))}
        </div>

        {/* Mill columns receive filtered data */}
        <div className="flex gap-6">
          <MillColumn millLine="Premix" orders={filteredOrders.filter(o => o.millLine === "Premix")} />
          <MillColumn millLine="Excel" orders={filteredOrders.filter(o => o.millLine === "Excel")} />
          <MillColumn millLine="CGM" orders={filteredOrders.filter(o => o.millLine === "CGM")} />
        </div>
      </main>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Array-based multi-select | Set-based multi-select | React 16.8+ (Hooks era) | O(1) membership testing vs O(n); cleaner toggle logic |
| Inline filter components | Extracted shared components | React composition patterns | Reusability across pages, smaller bundle size |
| Class components + this.setState | Functional components + useState | React 16.8 (Feb 2019) | Simpler syntax, better composition, hooks ecosystem |
| Manual immutability | Immer or spread operators | Modern React best practices | Fewer bugs from accidental mutations |

**Deprecated/outdated:**
- Using findIndex + splice for toggle logic: Replaced by Set add/delete
- Passing status-specific config into shared component: Replaced by generic props pattern (D-02)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test infrastructure detected |
| Config file | None — see Wave 0 gaps below |
| Quick run command | N/A — framework not installed |
| Full suite command | N/A — framework not installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILTR-01 | Filter pills render above columns with correct labels | unit | `npm test -- FilterPill.test.tsx` | ❌ Wave 0 |
| FILTR-02 | Clicking pill toggles its active state | unit | `npm test -- mill-production.test.tsx -t "toggles filter"` | ❌ Wave 0 |
| FILTR-03 | Multiple pills can be active simultaneously | unit | `npm test -- mill-production.test.tsx -t "multi-select"` | ❌ Wave 0 |
| FILTR-04 | Count badges display total orders per status | unit | `npm test -- mill-production.test.tsx -t "count badges"` | ❌ Wave 0 |
| FILTR-05 | No filters selected shows all cards | unit | `npm test -- mill-production.test.tsx -t "default state"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** N/A — no test infrastructure
- **Per wave merge:** N/A — no test infrastructure
- **Phase gate:** Manual verification via browser testing until Wave 0 test infrastructure complete

### Wave 0 Gaps
- [ ] Install Vitest + React Testing Library: `npm install -D vitest@^4.1.5 @vitejs/plugin-react@^5.1.3 @testing-library/react@^16.3.2 @testing-library/jest-dom@^6.9.1 happy-dom@^15.7.4 vite-tsconfig-paths@^5.2.0` [VERIFIED: versions from npm registry 2026-04-29]
- [ ] Create `vitest.config.mts` with React plugin, happy-dom environment, and tsconfig-paths for @ imports
- [ ] Create `vitest.setup.ts` with @testing-library/jest-dom import and afterEach cleanup
- [ ] Add `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`
- [ ] `src/components/FilterPill.test.tsx` — tests for FilterPill component (renders label/count, applies active styling, calls onClick)
- [ ] `src/app/mill-production/page.test.tsx` — tests for filter integration (toggle logic, filtering behavior, count computation)

**Recommended:** Wave 0 should set up Vitest infrastructure before implementing filter logic. This enables TDD workflow for remaining tasks.

**Why Vitest over Jest:** Next.js 16 + App Router works best with Vitest due to native ESM support and 10-20x faster startup vs Jest. [CITED: https://www.shsxnk.com/blog/vitest-nextjs-testing-infrastructure, https://nextjs.org/docs/app/guides/testing/vitest]

## Security Domain

**Not applicable:** Phase 08 implements client-side UI state management with no server interaction, authentication, input validation, or data persistence. No ASVS categories apply.

Filter state exists only in browser memory (useState) and resets on page reload. All data comes from pre-loaded getProductionOrders() service (Phase 07) which uses mock data. No user input accepted; no XSS, injection, or authorization risks.

## Sources

### Primary (HIGH confidence)
- React official docs (/reactjs/react.dev) — useState hook patterns [VERIFIED: Context7 2026-04-29]
- Next.js official docs (/vercel/next.js v16.1.6) — "use client" directive [VERIFIED: Context7 2026-04-29]
- Next.js official docs (https://nextjs.org/docs/app/guides/testing/vitest) — Vitest setup for Next.js App Router [VERIFIED: WebFetch 2026-04-29]
- Existing codebase (src/components/OrdersTable.tsx) — FilterPill implementation, Set-based toggle pattern [VERIFIED: Read tool 2026-04-29]
- Existing codebase (src/app/mill-production/page.tsx) — STATE_ORDER, STATE_COLORS, MillColumn integration points [VERIFIED: Read tool 2026-04-29]
- npm registry — Package versions for React (19.2.5), Next.js (16.2.4), Vitest (4.1.5), @testing-library/react (16.3.2) [VERIFIED: npm view 2026-04-29]

### Secondary (MEDIUM confidence)
- [Efficiently Managing Selection States in React](https://medium.com/@rakibshakib/efficiently-managing-selection-states-in-react-a-comprehensive-guide-8ed00f173adb) — Set vs Array performance for multi-select
- [React Patterns: Reusable Components](https://react.wiki/components/reusable-components/) — Component extraction best practices
- [Vitest + Next.js 16 Testing Setup](https://www.shsxnk.com/blog/vitest-nextjs-testing-infrastructure) — Complete testing infrastructure guide
- [Making Search & Filters Accessible](https://theadminbar.com/accessibility-weekly/accessible-search-and-filter/) — WCAG compliance for filter components
- [ARIA: button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role) — Accessibility requirements for interactive buttons
- [Button Pattern | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — Keyboard interaction requirements

### Tertiary (LOW confidence)
- [Avoiding Common useState() Mistakes in React](https://dev.to/harsh8088/avoiding-common-usestate-mistakes-in-react-3aao) — Common pitfalls (WebSearch only, not verified with official docs)
- [React Component Design Patterns](https://dev.to/fpaghar/react-component-design-patterns-part-1-5f0g) — Props interface patterns (community blog, not official)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All packages verified in package.json and npm registry; useState/Set pattern verified in existing codebase
- Architecture: HIGH — FilterPill component exists in OrdersTable.tsx; integration points identified in mill-production/page.tsx
- Pitfalls: MEDIUM-HIGH — Set mutation and "use client" pitfalls verified from official React/Next.js docs; filtering logic pitfalls derived from codebase analysis

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days — stable React/Next.js patterns, unlikely to change)
