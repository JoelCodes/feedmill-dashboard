# Research Summary: Mill Production Dashboard v1.1
**Status Filter Pills, Design Polish & Data-Driven Service**

**Project:** CGM Dashboard v1.1
**Researched:** 2026-04-28
**Overall Confidence:** HIGH
**Status:** Ready for implementation

---

## Executive Summary

v1.1 adds status-based filter pills to the existing 3-column mill production view. This is **not new architecture**—it's applying an existing, proven pattern (OrdersTable filtering) to a new domain (mill production states).

The feature set includes:
1. **Status Filter Pills** — Interactive toggle buttons for Completed/Mixing/Blocked/Pending states with count badges
2. **Design Polish** — Pixel-perfect matching to .pen design using established design tokens
3. **Data-Driven Mock Service** — Expanded JSON data with realistic production orders

**Primary Risk:** Complexity compounding across three layers (filter logic, design tokens, data validation). Each layer has failure modes that interact. Prevention: Test each phase thoroughly before moving forward.

**Key Advantage:** FilterPill component already exists in OrdersTable.tsx (proven pattern). Implementation is direct code reuse, not invention.

**Timeline:** 3-4 hours implementation + design approval. Total: 1.5-2 weeks with review cycles.

---

## Key Findings

### Stack: Zero New Dependencies

✓ **Fully implementable with existing stack:**
- Next.js 15.1.6
- React 19.2.3
- Tailwind CSS 4.0
- TypeScript 5
- lucide-react 0.577.0

**No new npm packages required.** Optional: xlsx dev dependency only if automating mock data transformation.

**Why:** FilterPill component already exists. Design polish uses Tailwind utilities already in config. Mock data expansion uses current async pattern.

### Architecture: Proven Pattern from OrdersTable

**Filter State Management:**
```typescript
// Component-local useState (sufficient, no Context needed)
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
const [orders, setOrders] = useState<ProductionOrder[]>([]);

// Derived state via useMemo (NOT useEffect—prevents infinite loops)
const filteredOrders = useMemo(() => {
  if (activeStates.size === 0) return orders;
  return orders.filter(o => activeStates.has(o.state));
}, [orders, activeStates]);

// Count calculation (excludes self-referential filter)
const stateCounts = useMemo(() => {
  const counts: Record<ProductionState, number> = {
    Completed: 0, Mixing: 0, Blocked: 0, Pending: 0
  };
  // Count from ALL orders, not filtered (badge shows total per state)
  orders.forEach(o => counts[o.state]++);
  return counts;
}, [orders]);
```

**Why this pattern (from OrdersTable):**
- useMemo prevents infinite loops and unnecessary recalculations
- Count calculation doesn't self-reference (keeps badge counts honest)
- Page-local state sufficient (no cross-component sharing)
- Filtering happens at page level, before mill-line grouping

**Data Flow (Updated):**
```
Service: getProductionOrders()
    ↓
orders: ProductionOrder[]
    ↓
Filter: activeStates.size > 0 ? orders.filter(...) : orders
    ↓
filteredOrders: ProductionOrder[]
    ↓
Group: filteredOrders by millLine
    ↓
Render: 3 MillColumn components (unchanged logic)
```

### Features: Table Stakes & Differentiators

**v1.1 Must-Have (Table Stakes):**
- [ ] Status filter pills (4 states: Completed, Mixing, Blocked, Pending)
- [ ] Count badges per state (shows total, not filtered count)
- [ ] Click to toggle state on/off
- [ ] Multiple simultaneous filters supported
- [ ] "Clear filters" button resets all selections
- [ ] Columns update when filtering (hidden cards for non-matching states)

**v1.1 Nice-to-Have (Design Polish):**
- [ ] Colors match .pen design exactly
- [ ] Spacing/padding align with design system
- [ ] Active state styling (blue highlight, gray inactive)
- [ ] Responsive behavior validated

**v1.2+ Differentiators (Deferred):**
- Search input box (requires coordinated state management)
- Mill line filters (architectural decision first)
- URL persistence (useSearchParams, browser back/forward)
- Keyboard navigation (tab, enter, escape)

**Anti-Features (Explicitly Not Building):**
- Drag-drop reordering
- Inline card editing
- Complex query builders
- Real-time push updates (polling sufficient)

### Pitfalls: Critical Prevention Strategies

| Pitfall | Phase | Prevention | Cost if Missed |
|---------|-------|-----------|-----------------|
| **Filter counts wrong** (Pitfall 1) | Phase 1 | Count from ALL orders, test all combinations | Looks broken in Phase 3 |
| **Design tokens bypassed** (Pitfall 2) | Phase 3 | Use Tailwind classes only, no hardcoded hex | Every design change becomes hunt-and-replace |
| **Mock data mismatches** (Pitfall 3) | Phase 2 | Runtime validation, factory function, type checking | Integration fail when real API arrives |
| **useEffect infinite loops** (Pitfall 4) | Phase 1 | Use useMemo for derived state, enable ESLint | Browser freeze, hard to debug |
| **Empty state missing** (Pitfall 7) | Phase 1 | Design "no results" message in Figma, implement alongside filters | UX confusion when 0 results |
| **Performance not baselined** (Pitfall 8) | Phase 2 | Measure filter calculation time with current mock data | Scaling problems discovered too late |

**Hidden Complexity:** Count calculation has self-referential edge case. When "Blocked" is selected, should other state counts show totals (Option A: more useful) or zeros (Option B: cleaner)? **Must clarify with design team before Phase 1 implementation.**

### Integration Points

**FilterPill Component (Extract):**
- File: `/src/components/ui/FilterPill.tsx` (NEW)
- Source: Extract inline code from OrdersTable.tsx (lines 396-432)
- Props: `label`, `count`, `isActive`, `onClick`, `status?`, `showDot?`, `dotColor?`
- Usage: Imported by both OrdersTable (update import) and MillProduction (new)
- Risk: Low (component already exists, just moving it)

**MillProduction Page Updates:**
- File: `/src/app/mill-production/page.tsx` (MODIFY)
- Changes: Add activeStates state, toggleState handler, filter before grouping
- Risk: Low (exact pattern from OrdersTable)

**Everything Else Unchanged:**
- Service layer (millProduction.ts)
- Type definitions
- Component hierarchy (ProductionCard, StateSection, MillColumn)
- Other pages (orders, KPI, settings)

---

## Recommended Build Order

### Phase 1: Core Filter Implementation (1.5-2 hours)
**Dependency:** None. Can start immediately.

1. Create `/src/components/ui/FilterPill.tsx` (extract from OrdersTable)
2. Add `activeStates` state to MillProductionPage
3. Add `toggleState(state)` handler
4. Calculate `stateCounts` in useMemo (count from all orders)
5. Calculate `filteredOrders` in useMemo
6. Render filter pills above 3-column layout
7. Update mill grouping to use `filteredOrders`
8. Add "Clear filters" button

**Success Criteria:**
- [ ] Pills render with correct counts
- [ ] Click pill toggles visual state + Set updates
- [ ] Multiple pills can be active simultaneously
- [ ] Counts never change based on filters (always show totals)
- [ ] Empty state handled (columns disappear if no orders in that state)
- [ ] OrdersTable still works (didn't break import)

**Risk:** Low. Exact pattern from OrdersTable, proven code.

### Phase 2: Polish & Design Alignment (1-2 hours)
**Dependency:** Phase 1 (needs working filters first)

1. Get .pen design approval (critical path item)
2. Extract design tokens (colors, spacing, shadows, border radius)
3. Map tokens to Tailwind utilities
4. Update FilterPill className strings
5. Verify colors match (active=blue, inactive=gray, etc.)
6. Test responsive behavior

**Success Criteria:**
- [ ] Colors match .pen file pixel-for-pixel
- [ ] Spacing/padding align with design tokens
- [ ] Active/inactive states visually distinct
- [ ] No hardcoded hex colors or spacing values
- [ ] Design overlay tool confirms alignment
- [ ] Responsive on all target viewports

**Risk:** Medium. Depends on design decisions from .pen file.

### Phase 3: Testing & Empty States (1-2 hours)
**Dependency:** Phases 1-2 (needs functionality + design complete)

1. Test all filter combinations (state only, multiple states, all states, none)
2. Verify counts update correctly
3. Test empty states (no Blocked orders, all filters clear, search yields nothing)
4. Accessibility check (button focus, aria-pressed, aria-label)
5. Regression test (other pages unchanged)
6. No console errors or TypeScript warnings

**Success Criteria:**
- [ ] All feature combinations work
- [ ] No console errors anywhere
- [ ] WCAG AA accessibility standards met
- [ ] OrdersTable regression test passes
- [ ] Performance acceptable (O(n) filtering with ~20 items is fast)

**Risk:** Low. Clear test cases, established patterns.

**Total Timeline:** 3-4 hours implementation + 3-5 days design review + 2-3 hours testing = **1.5-2 weeks with review cycles**

---

## Mock Data Requirements

**Current state:** 12 orders, balanced distribution (3 per state, 4 per mill line)

**For v1.1, this is adequate.** No schema changes needed.

**ProductionOrder interface (unchanged):**
```typescript
export interface ProductionOrder {
  id: string;
  orderNumber: string;
  customer: string;
  product: string;
  weightLbs: number;
  deliveryTime: string; // Format: "HH:MM AM/PM"
  state: ProductionState; // "Completed" | "Mixing" | "Blocked" | "Pending"
  millLine: MillLine; // "Premix" | "Excel" | "CGM"
}
```

**Validation before Phase 2:**
- All mock orders have exactly these fields
- State values exactly match ProductionState union (case-sensitive)
- MillLine values exactly match MillLine union
- deliveryTime format is consistent (HH:MM AM/PM)

**Optional for future:** Expand to 50+ orders from Book1.xlsx for better testing (out of v1.1 scope).

---

## Research Flags for Phases

| Phase | Question | Impact | Mitigation |
|-------|----------|--------|-----------|
| **v1.1 Phase 1** | Count badge behavior when filters active? | MEDIUM | Clarify in design: show totals (Option A) or zeros (Option B)? |
| **v1.1 Phase 1** | Filter pill colors/spacing approved? | MEDIUM | Get .pen review before coding, confirm dark mode handling |
| **v1.1 Phase 2** | Real API contract known yet? | LOW | DTO mapper ready, but mapping untested. Plan for v1.2. |
| **v1.2 Search** | Search + state filter coordination? | MEDIUM | Requires modified stateCounts logic (include search, exclude status filters) |
| **v1.3+ URL Persistence** | Should filters stick across refresh? | MEDIUM | Deferred. Impacts architecture (useSearchParams vs local state). |
| **v1.3+ Mill Filters** | Cross-cutting filter state? | MEDIUM-HIGH | May need state management upgrade (Redux/Zustand) if 4+ filter types. |

**Standard patterns (unlikely to need additional research):**
- Filter pills component ✓ (proven in OrdersTable)
- Toggle logic ✓ (Set-based, standard React)
- Badge count calculation ✓ (useMemo pattern known)
- Design system ✓ (Tailwind + tokens established)

---

## Confidence Assessment

| Area | Level | Basis | Caveats |
|------|-------|-------|---------|
| **Stack** | HIGH | Zero new dependencies, existing patterns | No npm installs needed |
| **Filter Architecture** | HIGH | OrdersTable proven implementation | Count logic edge cases documented, preventable |
| **Design System** | HIGH | Token system established, Tailwind 4.0 ready | .pen file not yet reviewed; design approval needed |
| **Mock Data** | HIGH | TypeScript strict mode, interface defined | Real API structure unknown; DTO mapper untested |
| **React Patterns** | HIGH | useMemo, Set-based toggles, standard library | React 19.2.3 latest, no version-specific gotchas identified |
| **Implementation Timeline** | HIGH | 3-4 hours code phase documented in detail | Assumes direct reuse; design approval is critical path |
| **Testing** | MEDIUM-HIGH | Clear test cases, established patterns | Edge cases (empty state, multiple filters) need QA validation |

**Overall: HIGH.** Pattern is proven, changes are straightforward, dependencies are clear. Main risk is execution details (copy-paste errors, design token bypasses, validation skipped).

---

## Gaps to Address

**Before Phase 1 starts:**
1. [ ] Clarify count badge behavior with design team (critical decision)
2. [ ] Confirm .pen file shows all 4 states + active styling
3. [ ] Verify FilterPill extraction won't break OrdersTable
4. [ ] Enable ESLint react-hooks rules to catch dependency mistakes

**Before Phase 2 starts:**
1. [ ] Generate sample orders from Book1.xlsx (validate structure)
2. [ ] Test mock data against interface (factory function)
3. [ ] Document real API expected structure (for DTO mapper)
4. [ ] Establish performance baseline (filter calculation time)

**Before Phase 3 starts:**
1. [ ] Extract design tokens from .pen (colors, spacing, shadows)
2. [ ] Map tokens to Tailwind utilities (document for code review)
3. [ ] Design empty state messaging in Figma
4. [ ] Plan QA checklist for responsive testing

---

## Files to Create/Modify

### Create (NEW)
- `/src/components/ui/FilterPill.tsx` (extracted from OrdersTable)

### Modify (SMALL CHANGES)
- `/src/components/OrdersTable.tsx` (update import path)
- `/src/app/mill-production/page.tsx` (add state + logic + render pills)
- `src/services/millProduction.ts` (expand mock data if desired, optional)

### No Changes
- All other components, pages, services
- TypeScript types (sufficient as-is)
- Design system (no new tokens needed)
- Build configuration

---

## Sources & Verification

**From Researchers:**
1. **MILL-PRODUCTION-V1.1-SUMMARY.md** — Architecture validation, integration points
2. **V1.1-RESEARCH-SUMMARY.md** — Pitfalls analysis, critical prevention strategies, phase ordering
3. **V1.1-STACK-SUMMARY.md** — Dependency audit, component reuse confirmation
4. **MILL_PRODUCTION_SUMMARY.md** — Feature table stakes, roadmap timeline, success criteria

**Cross-referenced with:**
- Established patterns: OrdersTable.tsx (existing codebase)
- React best practices: useMemo for derived state, Set-based toggles
- Manufacturing dashboard conventions: Budibase, Frappe ERP, SAP
- Design systems: Tailwind CSS 4.0, token system in globals.css

---

## Next Steps

### Immediate (Before Phase 1 Implementation)

1. **Create filter count matrix document**
   - Which filters contribute to stateCounts?
   - Self-referential rule: counts exclude their own filter
   - Test matrix covering all combinations

2. **Get design approval on .pen file**
   - Visual specs: colors, spacing, border radius
   - Behavior: click interaction, multiple selections
   - Count badge visibility: Option A (totals) or Option B (zeros)?

3. **Validate mock data structure**
   - Generate 10 sample orders from Book1.xlsx
   - Verify all ProductionOrder fields present
   - Verify state values match union exactly
   - Write runtime validation test

4. **Enable ESLint react-hooks rules**
   - Catches dependency array mistakes
   - Prevents infinite loop class of bugs

### During Phase 1 Build

1. Extract FilterPill from OrdersTable
2. Add state management to MillProductionPage
3. Implement filter logic (useMemo patterns)
4. Test all combinations exhaustively
5. Implement empty state alongside filters

### During Phase 2 Polish

1. Get final design token values from .pen
2. Update Tailwind classNames in FilterPill
3. Verify pixel-perfect alignment
4. Test responsive behavior
5. Accessibility audit (WCAG AA)

### During Phase 3 Testing

1. QA all filter combinations
2. Test edge cases (no Blocked orders, all filtered out)
3. Regression test (OrdersTable, other pages)
4. Performance validation (filter calculation time)

---

## Success Criteria (v1.1 Complete)

v1.1 is successful when ALL of the following are true:

**Functionality:**
- [ ] All 4 state filter pills render (Completed, Mixing, Blocked, Pending)
- [ ] Click pill toggles active state (visual + Set update)
- [ ] Multiple pills can be selected simultaneously
- [ ] Badge shows count of orders in that state (total, not filtered)
- [ ] Filtered columns hide non-matching cards
- [ ] "Clear filters" button resets all selections
- [ ] No filters shows all orders (default state)

**Design:**
- [ ] Pixel-matches .pen design (colors, spacing, typography)
- [ ] Active state visually distinct (blue highlight)
- [ ] Inactive state neutral (gray)
- [ ] Responsive on all target viewports
- [ ] No hardcoded hex colors or spacing values

**Quality:**
- [ ] No console errors anywhere
- [ ] No TypeScript errors
- [ ] OrdersTable regression test passes (import works)
- [ ] Button elements have aria-pressed and aria-label
- [ ] WCAG AA accessibility standards met
- [ ] Performance acceptable (no lag with multiple filters)

---

## Comparison to v1.0

| Aspect | v1.0 | v1.1 |
|--------|------|------|
| **Scope** | Static production view (3 columns) | Add filtering + polish |
| **Architecture** | Production view, card rendering | Same + filter state |
| **Complexity** | Single data structure | Multi-filter coordination |
| **Service** | Mock data, 12 orders | Same (or expanded) |
| **Dependencies** | React, Tailwind, TypeScript | No new packages |
| **Pattern Reuse** | Established OrdersTable | Direct reuse for v1.1 |
| **Timeline** | Unknown | 1.5-2 weeks |
| **Risk** | Proven pattern | Low (reuse) |

---

## What's NOT in v1.1

These items are explicitly deferred to v1.2+:

- ❌ Search input box (requires state coordination)
- ❌ Mill line filters (architectural decision first)
- ❌ URL persistence (useSearchParams, browser back/forward)
- ❌ Keyboard navigation (tab, enter, escape)
- ❌ Bulk actions on filtered orders
- ❌ Real-time push updates (polling sufficient)
- ❌ Advanced analytics on filtered data

---

## Implications for Roadmap

**v1.1 unblocks future work:**
- Foundation is solid for v1.2 search (coordination logic ready)
- Architecture ready for v1.3 mill line filters (no refactoring needed)
- Service pattern ready for real API swap (DTO mapper pattern prepared)

**Dependencies are clear:**
- Phase 1 (Filter Logic) → no external blockers
- Phase 2 (Design Polish) → needs .pen approval (critical path)
- Phase 3 (Testing) → depends on Phases 1-2

**Quality gates:**
- Phase 1 → Must pass test matrix (all filter combinations)
- Phase 2 → Must match design pixel-for-pixel
- Phase 3 → Must pass accessibility audit (WCAG AA)

---

## Conclusion

v1.1 is a **straightforward pattern extension** of v1.0, not a technology shift or architectural pivot. The FilterPill component exists. The filtering logic exists. The design system is established.

Primary risk is **execution details**—copy-paste errors, design token bypasses, validation skipped. Prevention is straightforward: test thoroughly at each phase transition, clarify ambiguities early (count badge behavior), enable static analysis (ESLint).

**Ready to proceed with Phase 1 implementation after design approval and count matrix clarification.**

---

**Research complete:** 2026-04-28
**Synthesized by:** Claude Code
**Confidence:** HIGH
**Next consumer:** Roadmap planning & implementation kickoff
