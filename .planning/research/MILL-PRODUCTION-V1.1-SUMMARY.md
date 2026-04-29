# Research Summary: Mill Production Dashboard v1.1

**Project:** CGM Dashboard - Mill Production Dashboard with Status Filters
**Milestone:** v1.1 (Status filter pills, data-driven service, design polish)
**Researched:** 2026-04-28
**Overall confidence:** HIGH
**Status:** Ready for implementation

## Executive Summary

Mill production v1.1 adds status filter pills to the existing 3-column production view. Integration is straightforward: adapt the proven OrdersTable filtering pattern to production state data. Changes are additive and low-risk. Service layer unchanged. New component: FilterPill (extracted from OrdersTable). Timeline: 3-4 hours implementation + design approval.

**Key insight:** This is not new architecture. It's applying an existing, proven pattern (OrdersTable filters) to a new domain (mill production states). High confidence due to direct code precedent.

## Architecture Summary

### What's New
1. **FilterPill component** (extract from OrdersTable.tsx)
   - File: `/src/components/ui/FilterPill.tsx`
   - Renders interactive filter buttons with counts
   - Same styling logic as OrdersTable (active=blue, inactive=gray)

2. **Filter state on MillProduction page**
   - `activeStates: Set<ProductionState>`
   - `toggleState(state)` handler
   - Multi-select filter (can select multiple states)

3. **Filtering logic**
   - Applied before mill-line grouping
   - Ensures column totals reflect filtered view
   - Counts calculated from unfiltered data (counts don't change when filtering)

### What's Unchanged
- Service layer (`millProduction.ts`)
- Type definitions
- Component hierarchy (ProductionCard, StateSection, MillColumn)
- Other pages (orders, KPI, settings)

## Key Findings

| Finding | Evidence | Confidence | Implication |
|---------|----------|-----------|-------------|
| Pattern is proven | OrdersTable implements exact same pattern with `activeStatuses: Set<OrderStatus>` | HIGH | Low implementation risk, can copy proven code |
| No service changes needed | Data is small (12 orders), filtering on client is faster than service params | HIGH | Can proceed immediately, no infrastructure decisions |
| Must extract FilterPill | Used in two places (OrdersTable + MillProduction) | HIGH | Phase 1: Extract once, import twice |
| useState is sufficient | Filter state is page-local, no cross-component sharing | HIGH | No Context, Zustand, or Redux needed |
| Filter before grouping | Ensures correct totals when filtering | HIGH | Integration point: filter → group by mill line → render |
| No new dependencies | Only React built-ins needed | HIGH | No npm packages, no security/maintenance burden |

## Integration Points

```
Service (UNCHANGED)
  ↓
Page component (ADD STATE + LOGIC)
  ├─ activeStates: Set<ProductionState>
  ├─ toggleState(state) handler
  ├─ stateCounts (computed)
  ├─ filteredOrders (computed)
  └─ Filter before mill-line grouping
  ↓
FilterPill component (NEW: extract)
  ├─ Imported from new file
  ├─ Used in OrdersTable (updated import)
  └─ Used in MillProduction (new)
  ↓
Columns receive filtered data (UNCHANGED LOGIC)
```

**Nothing cascades.** Changes are isolated to page component and component extraction.

## Recommended Build Order

### Phase 1: FilterPill Extraction (30 min)
1. Create `/src/components/ui/FilterPill.tsx`
2. Move FilterPill from OrdersTable inline code
3. Update OrdersTable to import FilterPill
4. Test: OrdersTable still works

**Dependency:** None. Can start immediately.
**Risk:** Low. Component already exists, just moving it.

### Phase 2: MillProduction Updates (1.5-2 hours)
1. Add `activeStates` state
2. Add `toggleState` handler
3. Add `stateCounts` useMemo
4. Add `filteredOrders` useMemo
5. Render filter pills
6. Update mill grouping to use `filteredOrders`
7. Test: All features work

**Dependency:** Phase 1 (needs FilterPill component)
**Risk:** Low. Exact pattern from OrdersTable.

### Phase 3: Design Polish (1-2 hours)
1. Verify colors match .pen design
2. Adjust spacing
3. Test responsive behavior
4. Accessibility check

**Dependency:** Phase 2 (needs working filters first)
**Risk:** Medium. Depends on design decisions from .pen file.

**Total timeline:** 3-4 hours implementation + design approval

## New Components

### FilterPill.tsx (EXTRACTED)

```typescript
// File: /src/components/ui/FilterPill.tsx
// Source: Inline code from OrdersTable.tsx (lines 396-432)
// Interface: FilterPillProps
// Props: label, count, status?, isActive, onClick, showDot?, dotColor?
// Usage: FilterPill component for both OrdersTable and MillProduction
```

**Why extract:**
- Reuse in two places
- Single source of truth for styling
- Simpler code in both pages
- Easier design updates

**No filtering wrapper needed for MVP:**
- Filter pills can be rendered as array in mill-production/page.tsx
- Extract to FilterPillGroup component in v1.2 if desired

## Data Flow (Updated)

```
Service: getProductionOrders()
    ↓
orders: ProductionOrder[]
    ↓
Filter: orders.filter(o => activeStates.has(o.state))
    ↓
filteredOrders: ProductionOrder[]
    ↓
Group: filteredOrders by millLine
    ↓
ordersByMill: Record<MillLine, ProductionOrder[]>
    ↓
Render: 3 MillColumn components
    ↓
Each column: Group by state (Completed/Mixing/Blocked/Pending)
    ↓
Render: ProductionCard for each order
```

**Key flow point:** Filtering happens at page level, before mill-line grouping.

## State Management

### Component-Local useState
```typescript
const [orders, setOrders] = useState<ProductionOrder[]>([]);
const [loading, setLoading] = useState(true);
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
```

**Why not Context:**
- State is page-local only
- No cross-component sharing needed
- No deeply nested components
- useState + useMemo sufficient

### Computed Values (useMemo)
```typescript
const stateCounts = useMemo(() => { /* count by state */ }, [orders]);
const filteredOrders = useMemo(() => { /* filter by activeStates */ }, [orders, activeStates]);
```

**Why useMemo:**
- Prevents unnecessary recalculations
- stateCounts should not recalc on filter changes
- filteredOrders should only recalc when orders or activeStates change

## Validation & Testing

### Functionality Tests
- [ ] Pills render with correct counts
- [ ] Click pill → highlights + columns update
- [ ] Click again → unhighlight + show all
- [ ] Multiple pills active → shows multiple states
- [ ] Counts never change (always show totals)
- [ ] Empty states handled (Blocked column disappears if no Blocked orders)

### Regression Tests
- [ ] OrdersTable still works (filtering works, counts right)
- [ ] Other pages unchanged (orders, KPI, settings)
- [ ] No console errors anywhere
- [ ] No TypeScript errors

### Design Tests
- [ ] Colors match .pen file
- [ ] Spacing matches design
- [ ] Responsive behavior correct
- [ ] Accessibility standards met

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| FilterPill extraction breaks OrdersTable | Medium | HIGH | Extract in dedicated PR, test thoroughly |
| Filter state management is wrong | Low | MEDIUM | Exact pattern from OrdersTable, use test cases |
| Columns show empty rows | Very low | Low | MillColumn already handles empty lists |
| Performance issues | Very low | Low | Data is small (12 items), filtering is O(n) |
| Design doesn't match .pen | Medium | Medium | Get .pen approval before Phase 3 |

**Overall risk: LOW.** Pattern is proven, changes are straightforward, dependencies are clear.

## Implications for Roadmap

### v1.1 (Current)
- ✅ Status filter pills implemented
- ✅ Data-driven mock service (unchanged from v1.0)
- ✅ Design polish (colors, spacing match .pen)
- Timeline: 3-4 hours + design review

### v1.2+ (Future)
- KPI cards integrated with mill filters (deferred)
- URL-based filter state (nice-to-have)
- "Clear filters" button (if requested)
- Bulk actions on filtered orders (future feature)

**v1.1 doesn't block future work.** Foundation is solid for extensions.

## No Surprises

✅ **Service layer:** No changes needed
✅ **Type system:** Sufficient as-is
✅ **Component hierarchy:** No restructuring
✅ **Dependencies:** No new npm packages
✅ **Architecture:** Proven pattern (OrdersTable)
✅ **Timeline:** Realistic and achievable
✅ **Risk:** Low and manageable

## Files to Create/Modify

### Create (NEW)
- `/src/components/ui/FilterPill.tsx`

### Modify (SMALL CHANGES)
- `/src/components/OrdersTable.tsx` (import FilterPill instead of inline)
- `/src/app/mill-production/page.tsx` (add state + logic + render pills)

### Unchanged
- Service, types, other components, other pages

## Detailed Resources

For implementation details, see:

1. **MILL-PRODUCTION-V1.1-ARCHITECTURE.md**
   - Complete architecture diagrams
   - Data flow details
   - Component structure
   - Integration point details
   - Risk mitigations

2. **MILL-PRODUCTION-V1.1-INTEGRATION-GUIDE.md**
   - Step-by-step implementation instructions
   - Exact code snippets
   - File locations
   - Testing checklist
   - Troubleshooting guide

3. **MILL-PRODUCTION-V1.1-RESEARCH.md**
   - Full research analysis
   - Evidence for each finding
   - Validation of architectural decisions

## Quick Start for Implementation

1. **Phase 1:** Follow "Step 1.1 - 1.4" in Integration Guide (extract FilterPill)
2. **Phase 2:** Follow "Step 2.1 - 2.8" in Integration Guide (update MillProduction)
3. **Phase 3:** Follow "Step 3.1 - 3.5" in Integration Guide (design polish)
4. **Testing:** Use code review checklist in Integration Guide

**Estimated time:** 3-4 hours total

## Confidence Summary

| Area | Confidence | Reason |
|------|-----------|--------|
| Architecture | HIGH | Exact pattern from OrdersTable |
| Implementation | HIGH | Clear steps, no ambiguity |
| Service readiness | HIGH | No changes needed |
| Types | HIGH | Sufficient as-is |
| Testing | HIGH | Clear test cases |
| Timeline | HIGH | Realistic estimate with buffer |
| Risk | HIGH | Low risk identified, mitigations clear |

**Overall: HIGH confidence. Ready to proceed with implementation.**

---

## Next Steps

1. **Get .pen approval** for filter pill design (spacing, colors, styling)
2. **Start Phase 1:** Extract FilterPill component
3. **Continue Phase 2:** Update MillProduction page
4. **Execute Phase 3:** Design polish
5. **UAT:** Test with actual production data flow

---

**Research complete. Approved for implementation.**

For questions or clarifications, see the detailed research documents:
- MILL-PRODUCTION-V1.1-ARCHITECTURE.md
- MILL-PRODUCTION-V1.1-INTEGRATION-GUIDE.md
- MILL-PRODUCTION-V1.1-RESEARCH.md
