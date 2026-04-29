# Research: Mill Production Dashboard v1.1 Filter Architecture

**Milestone:** v1.1 Mill Production Dashboard (Status Filters + Data-Driven Service)
**Research date:** 2026-04-28
**Overall confidence:** HIGH
**Research mode:** Architecture + Integration Points

## Executive Summary

The mill production dashboard v1.1 feature set (status filter pills + data-driven mock service) integrates cleanly into the existing architecture by **reusing the proven OrdersTable filtering pattern**. Integration is additive, not disruptive: add state for filter toggles, compute filtered dataset, apply before mill-line grouping. The service layer requires no changes. New components needed: (1) FilterPill extracted from OrdersTable, (2) optional FilterPillGroup wrapper. This is a straightforward ADAPT-AND-EXTEND pattern with high confidence due to existing proven implementation.

## Key Findings

### 1. Architecture Integration: Copy Pattern, Adapt Domain

**Finding:** The OrdersTable.tsx implements a complete filter pattern that maps directly to MillProduction needs.

**Evidence:**
- OrdersTable uses `activeStatuses: Set<OrderStatus>` for multi-select filtering
- MillProduction will use `activeStates: Set<ProductionState>` (exact same pattern)
- OrdersTable filters before rendering table rows
- MillProduction filters before grouping by mill line
- Both use `useMemo` to compute filtered dataset
- Both calculate counts from unfiltered data (counts don't change when filtering)

**Confidence:** HIGH. This is proven, working code adapted to similar domain.

**Implication:** The implementation is not experimental. It's a direct port of working code.

### 2. Service Layer: No Changes Required

**Finding:** The current `millProduction.ts` service is perfectly adequate for v1.1.

**Evidence:**
- Returns flat array: `ProductionOrder[]`
- Each order has `state: ProductionState`
- Mock data is small (12 orders total)
- Filtering on client is faster than adding server parameters
- OrdersTable pattern filters on client, not service

**Rationale for no service changes:**
- Data is small enough to fit in memory and filter client-side
- Service remains simple and testable
- When/if database integration happens, same service interface works (no component changes needed)
- Matches existing codebase pattern (orders.ts also returns full array, OrdersTable filters)

**Confidence:** HIGH. Pattern is established in codebase.

**Implication:** Development can proceed immediately. No infrastructure decisions blocking UI implementation.

### 3. Component Extraction: FilterPill Must Be Extracted

**Finding:** OrdersTable has FilterPill logic inline. MillProduction needs the same component.

**Evidence:**
- OrdersTable has FilterPillProps interface and FilterPill implementation (lines 396-432)
- MillProduction will render similar pills for ProductionState
- Same styling pattern: active = primary blue + white text, inactive = gray + gray text
- Same count badge behavior

**Why extract:**
- Needed in two places (OrdersTable + MillProduction)
- Extract once, import twice (DRY principle)
- Future design changes (color, spacing) update in one place
- Makes both components simpler and more readable

**Confidence:** HIGH. Extraction is straightforward, low risk.

**Implication:** Build Phase 1 must be FilterPill extraction before updating MillProduction page.

### 4. State Management: useState Is Sufficient

**Finding:** The v1.1 scope requires no advanced state management.

**Evidence:**
- Filter state is local to MillProduction page: `activeStates: Set<ProductionState>`
- No cross-component communication needed (unlike OrdersTable ↔ OrderDetails)
- Single source of truth: the Set
- No context needed

**Pattern from OrdersTable:**
```typescript
const [activeStatuses, setActiveStatuses] = useState<Set<OrderStatus>>(new Set());
```

**Applied to MillProduction:**
```typescript
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
```

**Confidence:** HIGH. Exact same pattern, proven in code.

**Implication:** No need for Context, Zustand, Redux, or other state libraries. Simple useState works.

### 5. Data Flow: Filter → Group → Render

**Finding:** The filtering must happen before mill-line grouping to ensure correct column totals.

**Evidence from current code:**
- Current: `orders` → group by millLine → display
- Current mill grouping (lines 182-186):
  ```typescript
  const ordersByMill: Record<MillLine, ProductionOrder[]> = {
    Premix: orders.filter((o) => o.millLine === "Premix"),
    Excel: orders.filter((o) => o.millLine === "Excel"),
    CGM: orders.filter((o) => o.millLine === "CGM"),
  };
  ```

**New: Filtering first:**
```typescript
// NEW: Filter first
const filteredOrders = useMemo(() => {
  if (activeStates.size === 0) return orders;
  return orders.filter(o => activeStates.has(o.state));
}, [orders, activeStates]);

// THEN: Group from filtered data
const ordersByMill: Record<MillLine, ProductionOrder[]> = {
  Premix: filteredOrders.filter((o) => o.millLine === "Premix"),
  Excel: filteredOrders.filter((o) => o.millLine === "Excel"),
  CGM: filteredOrders.filter((o) => o.millLine === "CGM"),
};
```

**Why order matters:**
- Filtering first ensures column totals reflect current filter
- If a Mixing order is filtered out, it won't contribute to Premix column weight
- Count badges show true count of available orders per state
- Matches user expectation: "if I select Mixing, I see only Mixing orders"

**Confidence:** HIGH. Same pattern as OrdersTable (filters before rendering).

**Implication:** Implementation order is critical. Phase 2 must integrate filtering at correct point in logic chain.

### 6. Count Calculation: From Unfiltered Data

**Finding:** State counts (pills) should show totals from all data, not filtered subset.

**Evidence from OrdersTable (lines 93-123):**
```typescript
const statusCounts = useMemo(() => {
  const counts: Record<OrderStatus, number> = { /* init */ };

  // Count from ORIGINAL orders, not filtered
  let ordersToCount = orders;
  if (hasChangesFilter) {
    ordersToCount = ordersToCount.filter(o => o.hasChanges);
  }

  ordersToCount.forEach(order => {
    counts[order.status]++;
  });

  return counts;
}, [orders, hasChangesFilter]);
```

**Applied to MillProduction (simpler - no secondary filter):**
```typescript
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

**Why counts don't filter themselves:**
- Helps user: "if I click Mixing, I'll see this many orders"
- Prevents cognitive dissonance: counts changing as you filter
- Matches UI convention: counts are "available" not "currently shown"

**Confidence:** HIGH. Established pattern.

**Implication:** Count calculation is simple for MillProduction (no secondary filters like "has changes").

### 7. Build Order: Clear Dependency Chain

**Finding:** Three distinct phases with clear dependencies.

**Phase 1: FilterPill Extraction (0 dependencies)**
- Extract FilterPill from OrdersTable inline code to `/src/components/ui/FilterPill.tsx`
- Import in OrdersTable (visual regression test)
- Duration: 30 minutes
- Risk: Low (component already exists, just moving it)

**Phase 2: MillProduction Page Updates (depends on Phase 1)**
- Add FilterPill import
- Add state: `activeStates`, `toggleState`, `stateCounts`, `filteredOrders`
- Render FilterPillGroup
- Update mill grouping to use `filteredOrders`
- Duration: 1-2 hours
- Risk: Low (exact pattern from OrdersTable)

**Phase 3: Design Polish (depends on Phase 2)**
- Verify colors match .pen design
- Adjust spacing
- Test responsive behavior
- Duration: 1 hour
- Risk: Low (functional code is done, just tweaking)

**Confidence:** HIGH. Clear dependency chain, no circular refs.

**Implication:** Can parallelize: Multiple developers can work on Phase 2 variations while Phase 1 is being done (though Phase 1 is quick).

### 8. Types: No Changes Needed

**Finding:** Existing types are sufficient for v1.1.

**Evidence:**
- `ProductionOrder` has all needed fields
- `ProductionState` covers all filter states (Completed, Mixing, Blocked, Pending)
- `MillLine` covers all columns (Premix, Excel, CGM)
- No new fields required

**Confidence:** HIGH. Types are already in place.

**Implication:** No type system work. Implementation can start immediately.

### 9. Risk Assessment: Low Risk, High Confidence

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| FilterPill extraction breaks OrdersTable | Medium (code moving always has risk) | HIGH (critical path) | 1) Dedicated PR, 2) test OrdersTable thoroughly, 3) visual regression test |
| State management is wrong | Low (exact copy from OrdersTable) | MEDIUM | Use useMemo correctly, test filter behavior |
| Empty columns cause visual issues | Very low (MillColumn already handles empty) | Low | Verify existing empty handling works |
| Performance degrades | Very low (12 items, filtering is O(n)) | Low | Monitor, but unlikely to be issue |
| Design doesn't match .pen file | Medium (depends on design decisions) | Medium | Get .pen approval before Phase 3 polish |

**Overall risk: LOW.** Pattern is proven, extraction is straightforward, dependencies are clear.

**Confidence: HIGH.** This is not experimental code. It's adapting proven patterns to a new domain.

### 10. No New Dependencies

**Finding:** v1.1 requires no new npm packages.

**Evidence:**
- FilterPill uses only: React (already in project), Tailwind CSS (already in project)
- useMemo, useState, useEffect: all standard React hooks
- No external filter libraries needed
- No state management libraries needed

**Confidence:** HIGH.

**Implication:** No npm audit, no compatibility checks, no new maintenance burden.

## Integration Points Summary

| Component | Change | Reason | Effort |
|-----------|--------|--------|--------|
| Service (millProduction.ts) | NONE | Data is small, client-side filtering is fine | 0 hours |
| Page (mill-production/page.tsx) | ADD state + logic | Filter support | 1-2 hours |
| FilterPill | EXTRACT | Used in two places | 0.5 hours |
| ProductionCard | NONE | Receives same data structure | 0 hours |
| StateSection | NONE | Receives filtered subset | 0 hours |
| MillColumn | NONE | Input data is pre-filtered | 0 hours |
| Types | NONE | Sufficient as-is | 0 hours |
| Sidebar | NONE | Navigation unchanged | 0 hours |
| Header | NONE | UI unchanged | 0 hours |

**Total effort:** 2-2.5 hours
**Total risk:** Low
**Critical path:** FilterPill extraction → MillProduction updates

## Architectural Decisions Validated

| Decision | Validation | Confidence |
|----------|-----------|-----------|
| Filter on client, not service | Matches OrdersTable pattern, data is small | HIGH |
| Use Set<ProductionState> for multi-select | Proven in OrdersTable with Set<OrderStatus> | HIGH |
| Apply filtering before mill grouping | Ensures correct totals, matches table filter timing | HIGH |
| Count from unfiltered data | Matches OrdersTable, helps UX | HIGH |
| Extract FilterPill component | Used in two places, DRY principle | HIGH |
| No Context needed | State is page-local, no cross-component share | HIGH |
| No new npm packages | React built-ins sufficient | HIGH |

**All architectural decisions validated against existing codebase patterns.** Zero novel architecture.

## What This Means for Roadmap

1. **v1.1 is low-risk:** Pattern is proven in v1.0 (OrdersTable filters)
2. **Implementation is straightforward:** Three clear phases with no blockers
3. **No infrastructure decisions pending:** Service works as-is
4. **Design is the only blocker:** Need .pen approval before Phase 3 polish
5. **Future maintenance is simple:** Code is idiomatic React, no exotic patterns
6. **Path to v1.2 is clear:** Same filtering pattern can extend to KPI cards (deferred)

## Recommended Sequence

1. **Immediately:** Get .pen file approval for filter pill design
2. **Phase 1:** Extract FilterPill (1-day task)
3. **Phase 2:** Implement MillProduction filtering (1-day task)
4. **Phase 3:** Polish to match design (2-4 hour task)
5. **Testing:** UAT on all three mills, verify filter behavior
6. **Deploy:** Merge to main

**Total time estimate:** 2-3 days including design approval and testing.

---

## Detailed Architecture Research

See `MILL-PRODUCTION-V1.1-ARCHITECTURE.md` for:
- Complete data flow diagrams
- Component hierarchy
- State management code examples
- Integration point details
- Risk mitigations
- Build order & dependencies

---

**Research complete. Architecture approved for implementation.**
