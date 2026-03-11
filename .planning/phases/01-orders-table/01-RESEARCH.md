# Phase 1: Orders Table - Research

**Researched:** 2026-03-11
**Domain:** React table filtering, search, selection, keyboard navigation
**Confidence:** HIGH

## Summary

Phase 1 transforms the existing static OrdersTable into a fully interactive component with filtering, search, and row selection. The existing codebase already has strong foundations: the `Order` type, mock orders service with async interface, `StatusBadge` with `STATUS_CONFIG`, and `FilterPill` component. The primary work involves wiring up React state management for filters, implementing debounced search, adding row selection with visual feedback, and basic keyboard navigation.

The implementation should use standard React patterns (`useState`, `useEffect`, `useMemo`) without external state management libraries. Debouncing should be implemented with a custom `useDebounce` hook. Text highlighting for search matches can use a simple utility function rather than a library. All patterns are well-established and do not require experimental features.

**Primary recommendation:** Implement filtering and selection with local React state. Use `useMemo` for filtered/searched results. Create a custom `useDebounce` hook for search. Keep keyboard navigation simple (arrow keys + Enter).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Delivery date format: Absolute full ("March 15, 2026")
- Quantity display: Number only (e.g., "24.5"), no unit in cell
- Column header: "QTY (TONS)" to clarify unit
- Long text handling: Wrap to multiple lines (no truncation)
- Product column: Texture Type + Formula Type combined (prior decision)
- Status pills: Multi-select (toggle multiple statuses on/off)
- No "All" pill — when nothing selected, show all orders automatically
- "Has changes" filter: Displayed as a pill alongside status pills (with red dot indicator)
- Filter counts: Update dynamically to reflect current filter context
- Search timing: Debounced (~300ms after user stops typing)
- Search scope: Customer name + Product (texture + formula)
- Highlight matches: Yes, bold or background color on matched text
- Search position: Above filters, at top of table card
- Selection mode: Single row only (click to select)
- Highlight style: Subtle background tint (light primary color)
- Deselection: Clicking selected row does NOT deselect (must click different row)
- Keyboard navigation: Basic support (arrow keys to move, Enter to confirm)

### Claude's Discretion
- Exact debounce timing (around 300ms)
- Specific background color for selected row
- Empty state design and messaging
- Loading state during filter/search changes

### Deferred Ideas (OUT OF SCOPE)
- Keyboard navigation was originally in v2 requirements (ADV-03) but user wants basic support in v1

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TABLE-01 | Display order lines with: Document #, Customer, Product, Quantity, Location, Delivery Date, Status | Use `Order` type fields; format deliveryDate with `Intl.DateTimeFormat`; combine textureType + formulaType for Product |
| TABLE-02 | Product column combines Texture Type + Formula Type | Simple string concatenation: `${order.textureType} ${order.formulaType}` |
| TABLE-03 | Status badges: Pending, Producing, Ready, In Transit, Complete | `StatusBadge` component already exists with all 5 statuses configured |
| TABLE-04 | Red dot indicator for orders with changes flag | Use `order.hasChanges` field; existing dot pattern in OrdersTable |
| TABLE-05 | Filter by status (clickable pills) | Multi-select state with `Set<OrderStatus>`; filter with `.filter()` |
| TABLE-06 | Filter by "has changes" | Boolean state toggle; additional filter predicate |
| TABLE-07 | Search bar filters by customer name and product | Debounced search with custom hook; case-insensitive matching |
| TABLE-08 | Row selection with visual highlight | Single selectedId state; click handler; conditional background class |
| TABLE-09 | Empty state when no results match filters | Conditional render when filteredOrders.length === 0 |

</phase_requirements>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | UI framework | Project standard |
| Next.js | 16.1.6 | App framework | Project standard |
| TypeScript | ^5 | Type safety | Project standard |
| Tailwind CSS | ^4 | Styling | Project standard |

### Supporting (No Additional Libraries Needed)
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| `useState` | Local component state | Filter state, selected row, search term |
| `useMemo` | Memoized computations | Filtered/searched order list, status counts |
| `useEffect` | Side effects | Debounce timer cleanup |
| `Intl.DateTimeFormat` | Date formatting | Delivery date display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useDebounce | lodash.debounce | Adds dependency; custom hook is ~10 lines |
| Custom highlight | react-highlight-words | Adds dependency; simple `.split()` approach works |
| useReducer | useState | Overkill for independent state pieces |

**Installation:**
```bash
# No new packages needed - use existing stack
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   └── OrdersTable.tsx         # Main component (modify existing)
├── hooks/
│   └── useDebounce.ts          # Custom debounce hook (create)
├── utils/
│   └── formatDate.ts           # Date formatting utility (create)
├── services/
│   └── orders.ts               # Existing mock service
└── types/
    └── order.ts                # Existing Order type
```

### Pattern 1: Multi-Select Filter State
**What:** Use `Set<OrderStatus>` for tracking multiple active status filters
**When to use:** When users can toggle multiple options independently
**Example:**
```typescript
// Source: React state management patterns
const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());

const toggleStatus = (status: OrderStatus) => {
  setActiveStatuses(prev => {
    const next = new Set(prev);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    return next;
  });
};

// When Set is empty, show all orders
const statusFilteredOrders = activeStatuses.size === 0
  ? orders
  : orders.filter(order => activeStatuses.has(order.status));
```

### Pattern 2: Custom useDebounce Hook
**What:** Delays value updates until user stops typing
**When to use:** Search inputs, any rapid-fire user input
**Example:**
```typescript
// Source: https://dev.to/kkr0423/reactjs-hook-pattern-debounce-345j
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Pattern 3: Filtered + Searched Results with useMemo
**What:** Compute filtered results only when dependencies change
**When to use:** Any derived data from state
**Example:**
```typescript
// Source: React docs - Managing State
const filteredOrders = useMemo(() => {
  let result = orders;

  // Apply status filter
  if (activeStatuses.size > 0) {
    result = result.filter(order => activeStatuses.has(order.status));
  }

  // Apply has changes filter
  if (hasChangesFilter) {
    result = result.filter(order => order.hasChanges);
  }

  // Apply search filter
  if (debouncedSearch) {
    const searchLower = debouncedSearch.toLowerCase();
    result = result.filter(order =>
      order.customer.toLowerCase().includes(searchLower) ||
      `${order.textureType} ${order.formulaType}`.toLowerCase().includes(searchLower)
    );
  }

  return result;
}, [orders, activeStatuses, hasChangesFilter, debouncedSearch]);
```

### Pattern 4: Date Formatting
**What:** Use native Intl API for locale-aware date formatting
**When to use:** Any date display
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
const formatDeliveryDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Output: "March 15, 2026"
```

### Pattern 5: Text Match Highlighting
**What:** Wrap matching text portions with styled spans
**When to use:** Search results display
**Example:**
```typescript
// Source: Custom implementation pattern
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-primary/20 rounded px-0.5">{part}</mark>
      : part
  );
};
```

### Pattern 6: Row Selection with Keyboard Navigation
**What:** Track selected row, handle click and keyboard events
**When to use:** Interactive table rows
**Example:**
```typescript
// Source: https://oneuptime.com/blog/post/2026-01-15-keyboard-navigable-components-react/view
const [selectedId, setSelectedId] = useState<string | null>(null);

// Get array of visible order IDs for keyboard navigation
const visibleIds = filteredOrders.map(o => o.id);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!selectedId) return;

  const currentIndex = visibleIds.indexOf(selectedId);

  if (e.key === 'ArrowDown' && currentIndex < visibleIds.length - 1) {
    e.preventDefault();
    setSelectedId(visibleIds[currentIndex + 1]);
  } else if (e.key === 'ArrowUp' && currentIndex > 0) {
    e.preventDefault();
    setSelectedId(visibleIds[currentIndex - 1]);
  }
};
```

### Anti-Patterns to Avoid
- **Filtering in render:** Always use `useMemo` for filtering operations on arrays
- **Inline debounce creation:** Creates new debounce function each render; use hook instead
- **External state for local data:** Don't reach for Redux/Zustand for simple filter state
- **Derived state in useState:** Don't store filtered results in state; compute with useMemo

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom format strings | `Intl.DateTimeFormat` | Built-in, locale-aware, handles edge cases |
| Complex table state | Custom state machine | Multiple `useState` + `useMemo` | React's built-in tools handle this scale |

**Key insight:** This phase's complexity is well within React's built-in capabilities. No external libraries needed.

## Common Pitfalls

### Pitfall 1: Stale Closures in Event Handlers
**What goes wrong:** Click handlers capture old state values
**Why it happens:** Functions created during render close over state at that moment
**How to avoid:** Use functional updates: `setActiveStatuses(prev => ...)`
**Warning signs:** Toggling filters doesn't work correctly after rapid clicks

### Pitfall 2: Filtering Before Data Loads
**What goes wrong:** App crashes or shows errors when orders array is undefined
**Why it happens:** `getOrders()` is async; initial state might be empty
**How to avoid:** Initialize with empty array, handle loading state
**Warning signs:** Console errors about "cannot read property of undefined"

### Pitfall 3: Search Not Clearing Selection
**What goes wrong:** Selected row becomes invisible but stays selected
**Why it happens:** Selection state not updated when filtered results change
**How to avoid:** Clear selection when it's no longer in filtered results
**Warning signs:** Ghost selection after filtering, unexpected behavior on next click

### Pitfall 4: Keyboard Focus Loss
**What goes wrong:** Arrow key navigation stops working
**Why it happens:** Table container loses focus after clicking
**How to avoid:** Use `tabIndex={0}` on container, manage focus programmatically
**Warning signs:** Have to click table again to use arrow keys

### Pitfall 5: Re-renders on Every Keystroke
**What goes wrong:** UI becomes sluggish during typing
**Why it happens:** Search state updates trigger re-render before debounce
**How to avoid:** Debounce only the filter computation, not the input display
**Warning signs:** Input feels laggy, visible delay between keystrokes

## Code Examples

Verified patterns for this phase:

### FilterPill with Multi-Select
```typescript
// Modify existing FilterPill to support toggle behavior
interface FilterPillProps {
  label: string;
  count: number;
  status?: OrderStatus;
  isActive: boolean;
  onClick: () => void;
}

function FilterPill({ label, count, status, isActive, onClick }: FilterPillProps) {
  const config = status ? STATUS_CONFIG[status] : null;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-colors
        ${isActive
          ? 'bg-primary text-white'
          : config
            ? `${config.bg} ${config.text}`
            : 'bg-gray-100 text-gray-600'
        }`}
    >
      {/* ... pill content */}
    </button>
  );
}
```

### Search Input with Debounce
```typescript
// In OrdersTable component
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

// Input updates immediately (responsive feel)
<input
  type="text"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Search by customer or product..."
  className="w-full rounded-lg border border-divider px-3 py-2 text-sm"
/>

// Filtering uses debounced value (no lag)
const filteredOrders = useMemo(() => {
  // ... uses debouncedSearch, not searchTerm
}, [orders, debouncedSearch, /* other deps */]);
```

### Selected Row Styling
```typescript
// Per CONTEXT.md: subtle background tint with primary color
<div
  onClick={() => setSelectedId(order.id)}
  className={`flex items-center py-3 cursor-pointer transition-colors
    ${selectedId === order.id
      ? 'bg-primary/10'
      : 'hover:bg-gray-50'
    }`}
>
```

### Empty State
```typescript
{filteredOrders.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Package className="h-12 w-12 text-gray-300 mb-4" />
    <p className="text-text-secondary text-sm">
      No orders match your current filters
    </p>
    <button
      onClick={clearAllFilters}
      className="mt-2 text-primary text-sm hover:underline"
    >
      Clear filters
    </button>
  </div>
)}
```

### Dynamic Status Counts
```typescript
// Counts should reflect current filter context
const statusCounts = useMemo(() => {
  const counts: Record<OrderStatus, number> = {
    'Pending': 0,
    'Producing': 0,
    'Ready': 0,
    'In Transit': 0,
    'Complete': 0,
  };

  // Count from filtered orders (respecting search and hasChanges filter)
  let ordersToCount = orders;

  if (hasChangesFilter) {
    ordersToCount = ordersToCount.filter(o => o.hasChanges);
  }

  if (debouncedSearch) {
    const searchLower = debouncedSearch.toLowerCase();
    ordersToCount = ordersToCount.filter(o =>
      o.customer.toLowerCase().includes(searchLower) ||
      `${o.textureType} ${o.formulaType}`.toLowerCase().includes(searchLower)
    );
  }

  ordersToCount.forEach(order => {
    counts[order.status]++;
  });

  return counts;
}, [orders, hasChangesFilter, debouncedSearch]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External debounce libs | Custom useDebounce hook | 2023+ | Fewer dependencies, same behavior |
| Manual memoization everywhere | Let React Compiler handle it | React 19 (optional) | Less boilerplate (when compiler enabled) |
| date-fns/moment for formatting | Intl.DateTimeFormat | Browsers 2020+ | No dependency needed |

**Deprecated/outdated:**
- Class components with lifecycle methods: Function components with hooks are standard
- External state management for local UI state: useState/useMemo handle this scale

## Open Questions

1. **Loading State During Filter Changes**
   - What we know: User wants loading state during filter/search changes
   - What's unclear: Whether to show skeleton or spinner
   - Recommendation: Use subtle inline loading indicator (not full skeleton) since filtering is instant with mock data; skeleton only for initial load

2. **Keyboard Navigation Scope**
   - What we know: Basic support requested (arrow keys, Enter)
   - What's unclear: Should Enter open details panel? (Phase 2 scope)
   - Recommendation: Enter confirms selection (visual highlight); opening panel deferred to Phase 2

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | none — see Wave 0 |
| Quick run command | `npm run lint` |
| Full suite command | `npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TABLE-01 | Display order columns | manual-only | Visual inspection | N/A |
| TABLE-02 | Product combines texture + formula | manual-only | Visual inspection | N/A |
| TABLE-03 | Status badges display correctly | manual-only | Visual inspection | N/A |
| TABLE-04 | Red dot for hasChanges | manual-only | Visual inspection | N/A |
| TABLE-05 | Status filter toggles work | manual-only | Interactive test | N/A |
| TABLE-06 | Has changes filter works | manual-only | Interactive test | N/A |
| TABLE-07 | Search filters correctly | manual-only | Interactive test | N/A |
| TABLE-08 | Row selection highlights | manual-only | Interactive test | N/A |
| TABLE-09 | Empty state displays | manual-only | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `npm run lint && npm run build`
- **Per wave merge:** `npm run build` (full build verification)
- **Phase gate:** Build succeeds, manual testing of all requirements

### Wave 0 Gaps
- [ ] No test framework installed — recommend Vitest for unit tests if needed later
- [ ] No E2E framework — recommend Playwright if automated UI testing needed
- [ ] Current validation relies on TypeScript compilation + ESLint + manual testing

*(Note: For this UI-focused phase, manual testing is appropriate. Test infrastructure can be added in a future phase if automated testing is prioritized.)*

## Sources

### Primary (HIGH confidence)
- [React docs - Managing State](https://react.dev/learn/managing-state) - useState, useMemo patterns
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - Date formatting API

### Secondary (MEDIUM confidence)
- [React Hooks Guide 2026](https://dev.to/a1guy/the-definitive-react-19-usecallback-guide-patterns-pitfalls-and-performance-wins-ce4) - useCallback best practices
- [Debouncing in React](https://dev.to/kkr0423/reactjs-hook-pattern-debounce-345j) - Custom useDebounce hook pattern
- [React Table Keyboard Navigation](https://oneuptime.com/blog/post/2026-01-15-keyboard-navigable-components-react/view) - Keyboard accessibility patterns
- [React Table Row Selection](https://www.robinwieruch.de/react-table-select/) - Selection state management

### Tertiary (LOW confidence)
- [react-highlight-words](https://www.npmjs.com/package/react-highlight-words) - Alternative for text highlighting (not recommended for this project)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies only
- Architecture: HIGH - Standard React patterns, well-documented
- Pitfalls: MEDIUM - Based on common issues, project-specific edge cases may emerge

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (patterns are stable, no fast-moving dependencies)
