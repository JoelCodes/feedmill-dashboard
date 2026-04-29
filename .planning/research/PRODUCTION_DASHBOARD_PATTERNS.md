# Production Dashboard Filter & State Patterns

**Domain:** Feed mill production operations
**Focus:** Expected behavior patterns and common pitfalls
**Researched:** 2026-04-28

---

## Expected Behavior Patterns

### 1. Filter Pills — Toggle Behavior

**What users expect:**
- Click a pill → filter activates (visual change)
- Click again → filter deactivates
- Multiple pills can be active at once
- Counts update to show available items
- All items visible by default

**Visual feedback needed:**
- Active pill: Primary color background, white text, white badge (clear it's selected)
- Inactive pill: Gray background, gray text, gray badge
- Transition: No animation needed for v1.1 (simple color swap)
- Count always visible (not hidden in inactive state)

**Current state in OrdersTable:**
```typescript
const toggleStatus = (status: OrderStatus) => {
  setActiveStatuses(prev => {
    const next = new Set(prev);
    if (next.has(status)) {
      next.delete(status);  // Toggle off
    } else {
      next.add(status);     // Toggle on
    }
    return next;
  });
};
```

✓ This pattern works. Will reuse for state filters.

---

### 2. Badge Counts — Logic

**What users expect:**
- Count shows how many orders exist in that state
- Count updates when other filters change
- Count is always current (not stale)

**Edge case — the decision point:**

When user selects "Blocked" filter (hiding all non-Blocked orders):
- **Option A:** Show counts for all states (including non-visible ones)
  - "Completed: 3, Mixing: 2, Blocked: 2 (active), Pending: 5"
  - Helps operator see if they should switch filters
  - Visual complexity: more numbers visible
  - Example: Asana board filters

- **Option B:** Show counts only for non-selected states
  - "Completed: 3, Mixing: 2, Pending: 5" (Blocked not shown, or shown as active count only)
  - Cleaner visual, less noise
  - Example: Some tag filters in Gmail-style interfaces

**Recommendation:** Go with **Option A** for mill production dashboard because:
1. Operators need to know other states exist (workflow visibility)
2. Quick switching between filters is valuable (count helps decision)
3. Manufacturing is about seeing bottlenecks (might need to shift focus to Blocked if count high)

**Implementation:**
```typescript
const stateCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    'Completed': 0,
    'Mixing': 0,
    'Blocked': 0,
    'Pending': 0,
  };

  // Count from ALL orders, not filtered orders
  orders.forEach(order => {
    counts[order.state]++;
  });

  return counts;
}, [orders]); // Only depends on original data, not filters
```

**Why this matters:**
- Counts calculated from unfiltered data
- Filtering happens separately in render logic
- Badges always show accurate "opportunity counts"

---

### 3. Filter Application Order

**What users expect:**
- Filters work in any combination
- No weird side effects
- Intuitive results

**Filter order (for coordinated filtering, when search added):**

```
1. Apply state filter (Set<ProductionState>)
   ↓
2. (Future: Apply mill line filter)
   ↓
3. (Future: Apply search filter)
   ↓
Result: Cards displayed
```

**Why this order:**
- State is most important (primary organization)
- Mill is secondary narrowing (which line to focus on)
- Search is tertiary refinement (specific customer/product)

**Current filter in v1.1:**
- Only state filtering (step 1)
- No cross-coupling with other filters yet

---

### 4. Empty States — When Do They Occur?

**Scenario 1: No orders in selected state**
- User filters to "Blocked"
- No orders are currently blocked
- Result: "Blocked" section renders, but with 0 cards
- Current implementation: StateSection returns null (section doesn't render)
- OK? Yes, clean (doesn't show empty section)

**Scenario 2: All orders filtered out (combined filters)**
- User selects "Excel" mill AND "Blocked" state (when search added)
- No orders match both criteria
- Result: No cards anywhere
- What to show? Message: "No orders match your filters" with "Clear all" button
- Where? Center of main area (replace 3-column layout)

**Scenario 3: No filters, but no data**
- API failed or no orders at all
- Result: LoadingSkeleton during load, error message on failure
- Current implementation: Catch block logs error

**Scenario 4: Search yields no results (v1.2)**
- User types "customer xyz" in search
- No orders for that customer
- State counts: might all be 0
- What to show? "No orders match 'customer xyz'" + "Clear search" button

---

### 5. Clear Filters / Reset Behavior

**What users expect:**
- One click to return to "see all"
- Button disabled or hidden if no filters active
- No confirmation dialog (quick action)

**Implementation:**
```typescript
<button
  onClick={() => setActiveStates(new Set())}
  disabled={activeStates.size === 0}
  aria-label="Clear all filters"
>
  Clear Filters
</button>
```

**Placement:** Next to filter pills, or on the right side of the filter group

**Alternative:** No explicit button, just click active pill to deselect it
- Works, but user needs to click all active pills (multiple clicks)
- Explicit button is better UX

---

### 6. State Machine — What's Actually Happening

**The state transitions in mill production:**

```
Order created
  ↓
Pending (waiting to mix)
  ↓
Mixing (in production)  ← Blocked can happen here if ingredient missing
  ↓
  ├→ Blocked (ingredient issue, inspection failure)
  │  ↓
  │  Mixing (resume after fix)
  │  ↓
  └→ Completed (done, ready for delivery)
```

**Key insight:** An order can move between states, but the card should jump to the right section when it does.

**For filtering:**
- Blocked is a temporary state (should resolve quickly)
- Operators check "Blocked" to find issues
- Clearing "Blocked" filter shows everything (including recently completed orders)

**Filter behavior reflects this:**
- Toggling "Blocked" on/off doesn't change the orders (they exist)
- It only changes which cards are visible
- Counts show true state counts (not cached)

---

## Common Pitfalls & How to Avoid Them

### Pitfall 1: Count Calculus — Counting the Wrong Data

**What goes wrong:**
```typescript
// ❌ WRONG: Count from filtered orders
const blockedCount = filteredOrders.filter(o => o.state === 'Blocked').length;
```

If user filters to "Completed", the `blockedCount` becomes 0 (because there are no Blocked orders in filtered data). User thinks there are no Blocked orders overall.

**Why it happens:**
- Easier to write (fewer lines)
- Seems logical (filter, then count)

**Consequences:**
- User can't see if they should switch filters
- Hides bottlenecks
- Operator misses blocked orders

**Prevention:**
```typescript
// ✓ CORRECT: Count from unfiltered data
const stateCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    'Completed': 0,
    'Mixing': 0,
    'Blocked': 0,
    'Pending': 0,
  };
  orders.forEach(order => counts[order.state]++);
  return counts;
}, [orders]);

// Use counts directly, independent of activeStates filter
```

**Verification:**
- Test: Filter to "Completed", verify badge counts for other states are non-zero
- Test: If 2 Blocked orders exist, badge should show "Blocked: 2" even when filtered to "Completed"

---

### Pitfall 2: Stale State — Filter Not Clearing

**What goes wrong:**
- User selects "Blocked" filter
- Machine resolves issue, order moves to "Completed"
- Mock service returns updated data
- **But cards don't update** — stale orders still show in "Blocked" section

**Why it happens:**
- Mock service returns same data (static array not updated)
- Component doesn't re-fetch on filter change
- Cache not invalidated

**Consequences:**
- Operator sees ghost orders
- Confusion ("I fixed this 5 minutes ago, why is it still blocked?")

**Prevention:**
- Mock service should be "stateful" (not just static array)
- Or: Real fetch on filter change (but OrdersTable doesn't do this)
- Or: Periodic refresh (polling)

**For v1.1:**
- Current mock data is static OK (acceptable for MVP)
- For v1.2+: Enhance mock service to be stateful
- Add: "Last updated" timestamp in UI
- Add: Manual refresh button

**Verification:**
- Test: Change filter, data should re-fetch (check Network tab)
- Test: Filter change doesn't cause stale cache (not hitting old data)

---

### Pitfall 3: Filter Logic Order — Applying Filters Wrong

**What goes wrong:**
```typescript
// ❌ WRONG: Filter after grouping
const ordersByState = groups;
const filtered = Object.fromEntries(
  Object.entries(ordersByState)
    .map(([state, orders]) => [state, orders.filter(...)])
);
```

Or worse: Filter inside the StateSection component (causes re-render issues).

**Why it happens:**
- Seems intuitive (group, then filter)
- Easier to think about locally (one component filters its own data)

**Consequences:**
- Performance issues (filtering per-component)
- React key warnings
- Counts misaligned with displayed data

**Prevention:**
```typescript
// ✓ CORRECT: Filter first, then group/render
const filteredOrders = activeStates.size === 0
  ? orders
  : orders.filter(o => activeStates.has(o.state));

// Then group and render
const ordersByState = STATE_ORDER.reduce((acc, state) => {
  acc[state] = filteredOrders.filter(o => o.state === state);
  return acc;
}, {});
```

**Pattern used in OrdersTable:**
```typescript
const filteredOrders = useMemo(() => {
  let result = orders;
  if (activeStatuses.size > 0) {
    result = result.filter(order => activeStatuses.has(order.status));
  }
  // ... other filters
  return result;
}, [orders, activeStatuses, ...]);
```

**Verification:**
- Test: Verify filtering happens in page component (not child components)
- Test: No key warnings in console
- Test: Filter change causes re-render (not per-component re-filter)

---

### Pitfall 4: Miscounting with Multiple Filters

**What goes wrong:**
When search is added (v1.2), counts become complex:

```typescript
// ❌ WRONG: Counting only from state-filtered data
const blockedCount = activeStates.has('Blocked')
  ? filteredOrders.filter(o => o.state === 'Blocked').length
  : 0; // Show 0 if Blocked not selected? Wrong!
```

**Why it happens:**
- Trying to "help" by not showing irrelevant counts
- Actually hiding useful information

**Consequences:**
- User can't navigate filters intuitively
- Counts become non-intuitive

**Prevention:**
```typescript
// ✓ CORRECT: Counts respect non-state filters (search, etc.)
// but NOT the state filter itself
const stateCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    'Completed': 0,
    'Mixing': 0,
    'Blocked': 0,
    'Pending': 0,
  };

  // Count from orders, respecting search but NOT state filter
  let ordersToCount = orders;

  // Apply search filter (if exists)
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    ordersToCount = ordersToCount.filter(o =>
      o.customer.toLowerCase().includes(searchLower) ||
      o.product.toLowerCase().includes(searchLower)
    );
  }

  // Count by state (DON'T filter by state here)
  ordersToCount.forEach(order => {
    counts[order.state]++;
  });

  return counts;
}, [orders, searchTerm]); // NO activeStates dependency
```

This is exactly what OrdersTable does (see lines 93-123). Study that pattern.

**Verification:**
- Test: Select "Blocked" filter, counts for other states should NOT change
- Test: Type in search, all counts should update (respecting search, not state filter)

---

### Pitfall 5: Visual Feedback — User Doesn't Know Filters Are Active

**What goes wrong:**
- User clicks "Blocked" but doesn't see visual change
- User doesn't realize filters are active
- User thinks dashboard is broken ("No orders?")

**Why it happens:**
- Active state styling not distinct enough
- No indicator showing filters are active
- Count badge not prominent

**Consequences:**
- User confusion
- User doesn't understand filtering is happening
- Support burden (confused operators)

**Prevention:**
1. **Active pill styling is distinct** (primary color, white text)
2. **Show active filter count** in badge (not hidden or 0)
3. **"Clear filters" button visible** when 1+ filters active
4. **Optional: Filter summary** ("Showing Blocked orders (2)")

**Verification:**
- Test: Toggle filter on, verify color changes to primary
- Test: Verify count badge is visible and accurate
- Test: Verify "Clear filters" button appears
- Test: Accessibility — button has aria-pressed="true" when active

---

### Pitfall 6: UX Regression — FilterPill Component Doesn't Work for Different States

**What goes wrong:**
- Copy FilterPill from OrdersTable without understanding its structure
- OrdersTable FilterPill expects `status: OrderStatus` and STATUS_CONFIG colors
- Mill Production FilterPill needs different data structure
- Component breaks or renders wrong colors

**Why it happens:**
- Assumption: "It's just a component, copy and it works"
- Missing understanding of prop shape

**Consequences:**
- Filters render but colors are wrong
- Badge counts don't work
- Component doesn't toggle correctly

**Prevention:**
1. **Understand FilterPill prop shape:**
   ```typescript
   interface FilterPillProps {
     label: string;           // "Completed", "Blocked", etc.
     count: number;           // Number of orders
     status?: OrderStatus;    // Optional, used to look up STATUS_CONFIG
     isActive: boolean;       // Is this filter selected?
     onClick: () => void;     // Toggle handler
     showDot?: boolean;       // Special indicator (HasChanges)
     dotColor?: string;       // Custom dot color
   }
   ```

2. **For mill production:**
   - Use `label` for state name ✓
   - Use `count` from stateCounts[state] ✓
   - Don't pass `status` (mill production uses state, not status)
   - Use `isActive={activeStates.has(state)}` ✓
   - Don't use `showDot` or `dotColor` (not needed for states)

3. **Handle color fallback:**
   ```typescript
   // OrdersTable: uses STATUS_CONFIG[status].bg
   // Mill Production: use inline colors for state
   <FilterPill
     label={state}
     count={stateCounts[state]}
     isActive={activeStates.has(state)}
     onClick={() => toggleState(state)}
     // No status prop, so component uses default colors
   />
   ```

4. **Or: Extract FilterPill into shared component**
   - Remove OrderStatus dependency
   - Pass colors as props
   - Reusable for both tables and production

**Verification:**
- Test: All 4 state pills render correct colors (inactive and active)
- Test: Count badges are visible and correct
- Test: Toggling changes color and aria-pressed
- Test: Works on all 3 mill columns

---

### Pitfall 7: Card Movement — Orders Jump Between Sections

**What goes wrong:**
- Order is in "Mixing" section
- Backend updates order state to "Completed"
- Card disappears from "Mixing", appears in "Completed"
- User is confused ("Where did my order go?")

**Why it happens:**
- State-based grouping is correct, but user experience is jarring
- No animation or indication

**Consequences:**
- User searches for lost order
- Operator anxiety ("Did it break?")

**Prevention:**
1. **In v1.1:** Live with the jump (mock data is static anyway)
2. **In v1.2+:** When polling is added, show "Order moved" toast notification
3. **UX improvement (future):** Smooth transition animation (CSS fade-out, re-appear in new section)

**For v1.1:**
- This is not a blocker (mock data doesn't change)
- Document as known limitation

---

## Testing Strategy

### Unit Tests (Component Level)

```typescript
// FilterPill toggle test
test('FilterPill toggles on/off', () => {
  const onClick = jest.fn();
  const { getByRole } = render(
    <FilterPill
      label="Blocked"
      count={2}
      isActive={false}
      onClick={onClick}
    />
  );

  const button = getByRole('button');
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

// Count calculation test
test('stateCounts reflects all states', () => {
  const orders = [
    { state: 'Completed', ... },
    { state: 'Blocked', ... },
  ];

  const counts = calculateStateCounts(orders);
  expect(counts.Completed).toBe(1);
  expect(counts.Blocked).toBe(1);
});
```

### Integration Tests (Page Level)

```typescript
// Filter application test
test('Selecting Blocked filter hides other states', () => {
  render(<MillProductionPage />);

  // Initial: all states visible
  expect(screen.getByText('Completed')).toBeInTheDocument();
  expect(screen.getByText('Blocked')).toBeInTheDocument();

  // Click Blocked filter
  fireEvent.click(screen.getByRole('button', { name: 'Blocked' }));

  // Only Blocked cards visible
  expect(screen.queryByText(/Completed.*card/i)).not.toBeInTheDocument();
});

// Count update test
test('Badge counts update when filter changes', () => {
  render(<MillProductionPage />);

  expect(screen.getByText('Blocked (2)')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Blocked' }));
  // Counts should still show all states' counts
  expect(screen.getByText('Completed (3)')).toBeInTheDocument();
});

// Clear filters test
test('Clear button resets filters', () => {
  render(<MillProductionPage />);

  fireEvent.click(screen.getByRole('button', { name: 'Blocked' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

  // All orders visible again
  expect(screen.getByText('Completed')).toBeInTheDocument();
  expect(screen.getByText('Blocked')).toBeInTheDocument();
});
```

---

## Accessibility Requirements

### Keyboard Navigation
- [ ] All buttons focusable (Tab key)
- [ ] Focus visible (outline)
- [ ] Enter/Space activates button

### ARIA Labels
- [ ] `aria-pressed="true|false"` on filter pills
- [ ] `aria-label` on buttons (what does button do?)
- [ ] `aria-live` region for count changes (if dynamic)

### Color Contrast
- [ ] Inactive pill text on background: 4.5:1 (normal) or 3:1 (large)
- [ ] Active pill text on background: 4.5:1
- [ ] Count badge: sufficient contrast

### Screen Reader
- [ ] Button role clear: "Blocked filter, 2 orders, not pressed"
- [ ] Clear button label: "Clear all filters"
- [ ] No duplicate labels

---

## Performance Considerations

### No Performance Issues Expected

**Why:**
- Dataset: 12 mock orders (tiny)
- Filtering: O(n) simple filter operation
- Grouping: O(n) simple group-by
- Re-rendering: Only MillProductionPage and children (not whole app)

### If Dataset Grows (v1.2+)

- **500+ orders:** Consider virtual scrolling (windowing)
- **10K+ orders:** Consider pagination or backend search
- **Real-time updates:** Consider debouncing or web workers

For v1.1: No optimization needed.

---

## Summary

**Key patterns to implement:**
1. ✓ Set-based toggle logic (copy from OrdersTable)
2. ✓ Badge counts from unfiltered data
3. ✓ Filter before grouping
4. ✓ Clear button (explicit reset)
5. ✓ Visual feedback (distinct active state)

**Key pitfalls to avoid:**
1. ✗ Counting filtered data (wrong counts)
2. ✗ Applying filters in wrong order
3. ✗ Stale data (cache invalidation)
4. ✗ Silent filter (no visual feedback)
5. ✗ Component misunderstanding (copy without understanding)

**Testing checklist:**
- [ ] Each filter toggles on/off
- [ ] Counts are always accurate
- [ ] Clear button works
- [ ] Multiple filters work together
- [ ] No console errors
- [ ] Accessibility: buttons, labels, focus
- [ ] Performance: no lag with 12+ orders

---

*Patterns documented: 2026-04-28*
*For implementation reference during Phase 2 build*
