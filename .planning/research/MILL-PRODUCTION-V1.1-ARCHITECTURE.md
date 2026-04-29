# Architecture: Mill Production Dashboard v1.1 (Filter Pills + Data-Driven Service)

**Milestone:** v1.1 Mill Production Dashboard
**Context:** Adding status filter pills, design polish, and data-driven mock service to existing mill production view
**Date:** 2026-04-28
**Confidence:** HIGH (pattern from proven OrdersTable implementation)

## Summary

Status filter pills integrate into the mill production page by **adapting the proven OrdersTable filter pattern** to production state data. Integration requires three client-side changes: (1) add FilterPill component instances for ProductionState, (2) add state management for active filters, (3) apply filtering logic before grouping orders by mill line. The existing mock service requires **no structural changes** — filter on client, not service. This is a COPY → ADAPT pattern rather than new architecture.

## Current Architecture (Baseline)

### Data Flow
```
Service: getProductionOrders() → ProductionOrder[]
    ↓
Page state: orders
    ↓
Page logic: Group by millLine (Premix, Excel, CGM)
    ↓
Render: 3 MillColumn components
    ↓
Per column: Filter orders by line, group by state (Completed/Mixing/Blocked/Pending)
    ↓
Render: ProductionCard for each order
```

### Component Hierarchy
```
MillProductionPage (page.tsx)
  ├─ useState: orders, loading
  ├─ useEffect: getProductionOrders()
  ├─ Header
  ├─ LoadingSkeleton (conditional)
  └─ 3x MillColumn (conditional)
      ├─ Filter orders for this line
      ├─ MillColumn header (weight progress)
      └─ 4x StateSection (one per state)
          ├─ Filter orders for this state
          ├─ StateSection header
          └─ N x ProductionCard
```

### Current State Management
```typescript
const [orders, setOrders] = useState<ProductionOrder[]>([]);
const [loading, setLoading] = useState(true);

// No filtering state — all orders displayed for all mills
```

## New Architecture (v1.1 Filter Pills)

### Updated Data Flow
```
Service: getProductionOrders() → ProductionOrder[] (unchanged)
    ↓
Page state: orders, activeStates: Set<ProductionState>
    ↓
Page logic: FILTER by activeStates (if set is not empty, all states shown if empty)
    ↓
Page logic: Group filtered orders by millLine
    ↓
Render: 3 MillColumn components with filtered data
    ↓
Per column: Same as before (filter by line, group by state)
    ↓
Render: ProductionCard for each order
```

### Updated Component Hierarchy
```
MillProductionPage (page.tsx)
  ├─ useState: orders, loading, activeStates
  ├─ useEffect: getProductionOrders()
  ├─ useMemo: stateCounts (count by state from orders)
  ├─ useMemo: filteredOrders (filter orders by activeStates)
  ├─ Header
  ├─ FilterPillGroup (NEW)
  │   ├─ FilterPill × 4 (Completed, Mixing, Blocked, Pending)
  │   └─ Each pill: onClick → toggleState
  ├─ LoadingSkeleton (conditional)
  └─ 3x MillColumn (conditional, receives filteredOrders)
      ├─ Filter orders for this line (from filteredOrders)
      ├─ MillColumn header
      └─ 4x StateSection
          ├─ Filter orders for this state (from filteredOrders)
          ├─ StateSection header
          └─ N x ProductionCard
```

### Updated State Management
```typescript
// Existing
const [orders, setOrders] = useState<ProductionOrder[]>([]);
const [loading, setLoading] = useState(true);

// NEW: Filter state
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

// NEW: Toggle handler
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

// NEW: Computed filtered list
const filteredOrders = useMemo(() => {
  // If no filters active, show all orders
  if (activeStates.size === 0) return orders;

  // Otherwise, filter to only selected states
  return orders.filter(o => activeStates.has(o.state));
}, [orders, activeStates]);

// NEW: Count by state (from unfiltered orders)
const stateCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    Completed: 0,
    Mixing: 0,
    Blocked: 0,
    Pending: 0,
  };
  orders.forEach(o => counts[o.state]++);
  return counts;
}, [orders]);
```

## Integration Points

### 1. Service Layer (millProduction.ts)

**Change required:** NONE

**Rationale:**
- Mock data is small (12 orders fits in memory)
- Filtering on client is simpler than server parameters
- Matches OrdersTable pattern (filters in component, not service)
- Service remains simple and clean for future database integration

**Current state:**
```typescript
export async function getProductionOrders(): Promise<ProductionOrder[]> {
  await delay(200 + Math.random() * 100);
  return mockOrders; // Same as before
}
```

**Why this works:**
- Page receives full dataset
- Filtering happens after data load
- Count calculation is simple (iterate orders array)
- Performance is fine (12 orders, filtering is O(n) where n=12)

### 2. Page Component (mill-production/page.tsx)

**Changes required:**
1. Add `activeStates` state
2. Add `toggleState` handler
3. Add `filteredOrders` computed value
4. Add `stateCounts` computed value
5. Render FilterPillGroup component
6. Use `filteredOrders` instead of `orders` in mill grouping

**Insertion points:**

**Before:** (current line ~165)
```typescript
export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ... });

  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: orders.filter((o) => o.millLine === "Premix"),
    Excel: orders.filter((o) => o.millLine === "Excel"),
    CGM: orders.filter((o) => o.millLine === "CGM"),
  };
```

**After:**
```typescript
export default function MillProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());

  useEffect(() => { ... });

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

  const stateCounts = useMemo(() => {
    const counts: Record<ProductionState, number> = {
      Completed: 0,
      Mixing: 0,
      Blocked: 0,
      Pending: 0,
    };
    orders.forEach(o => counts[o.state]++);
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeStates.size === 0) return orders;
    return orders.filter(o => activeStates.has(o.state));
  }, [orders, activeStates]);

  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
    Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
    CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
  };
```

**Before:** (current line ~191)
```typescript
<Header />
{loading ? (
  <LoadingSkeleton />
) : (
  <div className="flex gap-6">
    <MillColumn millLine="Premix" orders={ordersByMill.Premix} />
    <MillColumn millLine="Excel" orders={ordersByMill.Excel} />
    <MillColumn millLine="CGM" orders={ordersByMill.CGM} />
  </div>
)}
```

**After:**
```typescript
<Header />
<FilterPillGroup
  activeStates={activeStates}
  stateCounts={stateCounts}
  onToggleState={toggleState}
/>
{loading ? (
  <LoadingSkeleton />
) : (
  <div className="flex gap-6">
    <MillColumn millLine="Premix" orders={ordersByMill.Premix} />
    <MillColumn millLine="Excel" orders={ordersByMill.Excel} />
    <MillColumn millLine="CGM" orders={ordersByMill.CGM} />
  </div>
)}
```

**Imports to add:**
```typescript
import { useMemo } from "react"; // Already imported in most React apps
import FilterPillGroup from "@/components/ui/FilterPillGroup"; // NEW
```

### 3. FilterPill Component (NEW: Extract & Reuse)

**File location:** `/src/components/ui/FilterPill.tsx`

**Source:** Adapt from inline FilterPill in OrdersTable.tsx

**Why extract:**
- Used in two places (OrdersTable already has inline, MillProduction will need)
- Simplifies both pages
- Single source of truth for styling
- Easier design updates later

**Interface:**
```typescript
interface FilterPillProps {
  label: string;
  count: number;
  state?: ProductionState; // Optional: for state-specific styling
  isActive: boolean;
  onClick: () => void;
  showDot?: boolean; // Optional: defaults false for production
  dotColor?: string; // Optional: if showDot is true
}

export default function FilterPill({
  label,
  count,
  state,
  isActive,
  onClick,
  showDot = false,
  dotColor,
}: FilterPillProps) {
  // Styling logic (see below)
}
```

**Styling logic:**
```typescript
// Active state: primary blue + white text
const bgClass = isActive ? 'bg-primary' : 'bg-gray-100';
const textClass = isActive ? 'text-white' : 'text-gray-600';
const countBgClass = isActive ? 'bg-white/20' : 'bg-gray-200';

return (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 ${bgClass} rounded-xl px-2.5 py-2 transition-colors hover:opacity-90`}
  >
    {showDot && isActive && (
      <div className={`h-2 w-2 rounded-full ${dotColor || 'bg-white'}`} />
    )}
    <span className={`text-[11px] font-bold ${textClass}`}>{label}</span>
    <div className={`${countBgClass} flex items-center rounded-lg px-1.5`}>
      <span className={`text-[10px] font-bold ${textClass}`}>{count}</span>
    </div>
  </button>
);
```

**Key differences from OrdersTable:**
- No dot indicator for production states (no "has changes" equivalent)
- Optional `state` prop (used for future styling, not required for MVP)
- Always show count (like OrdersTable)
- Inactive: gray-100 bg, gray-600 text (same as OrdersTable)
- Active: primary bg, white text (same as OrdersTable)

### 4. FilterPillGroup Component (NEW: Wrapper)

**File location:** `/src/components/ui/FilterPillGroup.tsx` OR inline in page

**Decision:** Inline is simpler for v1.1. If reused later, extract to component.

**Inline implementation** (insert after `<Header />` in mill-production/page.tsx):
```typescript
<div className="flex gap-2.5">
  {(['Completed', 'Mixing', 'Blocked', 'Pending'] as const).map((state) => (
    <FilterPill
      key={state}
      label={state}
      count={stateCounts[state]}
      isActive={activeStates.has(state)}
      onClick={() => toggleState(state)}
    />
  ))}
</div>
```

**Future component version** (if extracted):
```typescript
interface FilterPillGroupProps {
  activeStates: Set<ProductionState>;
  stateCounts: Record<ProductionState, number>;
  onToggleState: (state: ProductionState) => void;
}

export default function FilterPillGroup({
  activeStates,
  stateCounts,
  onToggleState,
}: FilterPillGroupProps) {
  return (
    <div className="flex gap-2.5">
      {(['Completed', 'Mixing', 'Blocked', 'Pending'] as const).map((state) => (
        <FilterPill
          key={state}
          label={state}
          count={stateCounts[state]}
          isActive={activeStates.has(state)}
          onClick={() => onToggleState(state)}
        />
      ))}
    </div>
  );
}
```

## What Does NOT Change

### Types
- `ProductionOrder` — unchanged
- `ProductionState` — unchanged
- `MillLine` — unchanged

### Service
- `getProductionOrders()` signature unchanged
- `getOrdersByMillLine()` still available (though not used in MVP)
- Mock data unchanged

### Components (no changes, just different input data)
- `ProductionCard` — unchanged (same prop interface)
- `StateSection` — unchanged (receives filtered subset, logic same)
- `MillColumn` — unchanged (same logic, input data filtered)
- `Sidebar` — unchanged
- `Header` — unchanged

### Layout
- 3-column structure unchanged
- FilterPillGroup positioning: between Header and columns
- Spacing/sizing: determined by design (.pen file approval)

## Filter Behavior

### Toggle Logic
```
User clicks "Mixing" pill:
  1. activeStates is empty Set {}
  2. toggleState("Mixing") called
  3. setActiveStates adds "Mixing" → {"Mixing"}
  4. filteredOrders re-computed → only Mixing orders
  5. Component re-renders → pill highlights, columns update

User clicks "Mixing" again:
  1. activeStates is {"Mixing"}
  2. toggleState("Mixing") called
  3. setActiveStates removes "Mixing" → {}
  4. filteredOrders re-computed → all orders
  5. Component re-renders → pill unhighlights, columns show all

User clicks "Completed" while "Mixing" active:
  1. activeStates is {"Mixing"}
  2. toggleState("Completed") called
  3. setActiveStates adds "Completed" → {"Mixing", "Completed"}
  4. filteredOrders re-computed → Mixing + Completed orders
  5. Component re-renders → both pills highlight, columns show both
```

### Count Calculation
```
Counts ALWAYS come from unfiltered orders array:
  - If 3 Completed, 2 Mixing, 1 Blocked, 4 Pending in total
  - Pills always show: Completed 3, Mixing 2, Blocked 1, Pending 4
  - This matches OrdersTable pattern (counts don't change when filter changes)

Why?
  - Helps user know "if I click Completed, I'll see 3 orders"
  - Prevents confusion of counts changing as you filter
  - Simpler logic (no cascading filter calculations)
```

## Build Order (Dependency Chain)

### Phase 1: Extract FilterPill (REQUIRED FIRST)
1. Create `/src/components/ui/FilterPill.tsx`
2. Extract pill component from OrdersTable inline code
3. Import FilterPill in OrdersTable (ensure it still renders)
4. Test: OrdersTable filters still work

**Why first:** Both OrdersTable and MillProduction need it. Extract once, import twice.

**Duration:** 30 minutes

### Phase 2: Update MillProduction Page (DEPENDS ON PHASE 1)
1. Add FilterPill import
2. Add `activeStates` state
3. Add `toggleState` handler
4. Add `stateCounts` computed value
5. Add `filteredOrders` computed value
6. Render FilterPillGroup (inline or component)
7. Update ordersByMill to use `filteredOrders`
8. Test: Pills toggle, counts display, columns filter correctly

**Why after phase 1:** Needs FilterPill component to exist

**Duration:** 1-2 hours

### Phase 3: Design Polish (DEPENDS ON PHASE 2)
1. Verify colors match design (if .pen file specifies)
2. Adjust spacing between FilterPillGroup and columns
3. Test responsive layout (if mobile is scope)
4. Test empty states (what if all Mixing orders filtered out?)
5. Test dark theme (if supported)

**Why after phase 2:** Functionality must be correct before styling

**Duration:** 1 hour

## No New External Dependencies

✓ FilterPill uses only: React (useState), Tailwind CSS (already in project)
✓ No new npm packages required
✓ No changes to package.json
✓ Uses existing type: ProductionState

## Dependency Graph

```
ProductionState type (existing)
    ↓
    ├─ page.tsx (uses in state)
    └─ FilterPill component
        ↓
        └─ page.tsx (imports + renders)

OrdersTable (existing)
    ↓
    └─ FilterPill component (will import & use)

Service: getProductionOrders() (existing, unchanged)
    ↓
    └─ page.tsx (calls in useEffect)
```

**No circular dependencies.** Clean dependency tree.

## Risk & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| FilterPill extraction breaks OrdersTable | Medium | HIGH | Extract in dedicated PR, test OrdersTable thoroughly |
| Count logic is wrong | Low | Medium | Use useMemo with correct deps, test each state |
| Empty column appears (no orders in Blocked, user selects only Blocked) | Low | Low | Current MillColumn already handles empty (renders nothing if length=0) |
| Performance degrades | Very low | Low | Filtering O(n) where n=12, useMemo prevents recalc unless deps change |
| User expects "Clear filters" button | Medium | Low | Add in v1.2 if requested; MVP just uses empty Set = show all |

## Validation Checklist

Before marking v1.1 complete:

- [ ] FilterPill extracted to `/src/components/ui/FilterPill.tsx`
- [ ] OrdersTable imports FilterPill and still renders correctly
- [ ] activeStates state added without breaking initial render
- [ ] toggleState handler works (tested: click pill, state updates)
- [ ] stateCounts correct (tested: all counts match actual data)
- [ ] filteredOrders correct (tested: empty Set shows all, selected states show only those)
- [ ] Pills render above columns with correct styling
- [ ] Columns update when pill clicked
- [ ] Empty columns handled gracefully (if no orders in filtered state)
- [ ] Styling matches .pen file design (color, spacing, hover states)
- [ ] Mobile responsive (if in scope)
- [ ] No console errors in browser

## Next Steps (v1.2+)

**Out of scope for v1.1:**
- "Clear filters" button (nice-to-have, MVP doesn't need)
- URL-based filter state (advanced, deferred)
- Bulk actions on filtered orders (future feature)
- Export filtered view (future feature)
- KPI cards integrated with mill production filters (deferred to KPI phase)

These can be added in v1.2 without changing the core architecture.

## Comparison: OrdersTable Pattern (Reference)

The mill production filters follow the **exact same pattern** as OrdersTable:

| Aspect | OrdersTable | MillProduction |
|--------|-------------|----------------|
| Filter state | `activeStatuses: Set<OrderStatus>` | `activeStates: Set<ProductionState>` |
| Toggle handler | `toggleStatus(status)` | `toggleState(state)` |
| Computed filtered list | `useMemo([...filter(activeStatuses)])` | `useMemo([...filter(activeStates)])` |
| Count calculation | `statusCounts` from unfiltered | `stateCounts` from unfiltered |
| Count behavior | Constant regardless of filter | Constant regardless of filter |
| FilterPill component | Inline in component | Will extract & reuse |
| Application timing | Before table rendering | Before mill grouping |

**Confidence:** Very HIGH. This is proven, working code adapted to a similar domain.

---

**Architecture approved:** Ready for Phase 1 (FilterPill extraction) implementation.
