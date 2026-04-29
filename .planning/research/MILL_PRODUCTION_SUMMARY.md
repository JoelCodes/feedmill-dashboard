# Research Summary: Mill Production Dashboard Filters & Data-Driven Views

**Project:** CGM Dashboard v1.1 Milestone
**Domain:** Feed mill production operations (real-time scheduling and status tracking)
**Researched:** 2026-04-28
**Overall Confidence:** HIGH (established patterns, proven component reuse)

---

## Executive Summary

The v1.1 milestone focuses on adding **state-based filter pills** and design polish to the existing mill production view. This research confirms that the required features are well-established patterns in manufacturing dashboards and can be implemented by adapting existing OrdersTable filtering logic.

**Key Finding:** The FilterPill component from OrdersTable.tsx is directly reusable. The filtering logic (Set-based toggles, count calculation, multi-filter coordination) transfers nearly unchanged. No architectural changes needed.

**Main complexity:** Clarifying how badge counts behave when multiple filters are active. The design should specify: when "Blocked" is selected, do other state counts show 0, or do they show how many exist in those states (to help operators switch filters)?

**Data readiness:** Current mock data (12 orders, balanced across states) is adequate for v1.1 testing. No schema changes required.

---

## Key Findings

### Stack
- **Reuse:** FilterPill component from OrdersTable.tsx (proven pattern)
- **State:** Set<ProductionState> toggle logic (same as OrdersTable)
- **Filtering:** Apply before grouping by state (simple order)
- **Counts:** useMemo on unfiltered data (OrdersTable pattern)
- **New components:** Clear filters button, filter controls wrapper (minimal)

### Architecture
- **No refactoring needed** on existing StateSection, MillColumn, or ProductionCard
- **Filter pills sit above** the 3-column layout (like OrdersTable)
- **Data flow:** FilterPill toggles → set activeStates → filter orders → pass filtered orders to MillColumn → MillColumn groups by state
- **Expandable:** Search (v1.2) and mill line filters add naturally to existing Set-based pattern

### Features
**Table stakes (v1.1):**
- State filter pills (4 states: Completed, Mixing, Blocked, Pending)
- Badge counts per state
- Clear filters button
- Toggle on/off behavior

**Differentiators (v1.2+):**
- Search integration
- Mill line filter toggle
- Dynamic count updates with combined filters

**Anti-features:**
- Drag-drop reordering (state is immutable)
- Inline card editing (use forms)
- Complex query builders (keep simple)
- Real-time push updates (polling sufficient)

### Pitfalls
**Critical pitfall (prevent):**
- Counting only filtered data for badges → hides other state counts
  - *Prevention:* Count from all data, apply filter separately

**Design decision needed:**
- Badge count visibility when filters active
  - *Option A:* Show counts for all states (helps operators switch)
  - *Option B:* Show counts only for non-selected states (cleaner visual)
  - *Recommendation:* Option A (more useful for navigation)

---

## Implications for Roadmap

Based on this research, the suggested phase structure for v1.1:

### Phase 1: Design & Mock Data (Week 1)
- Design filter pills in .pen (Pencil.dev)
  - Visual: 4 pill buttons, count badges, active state styling
  - Behavior: Click to toggle, multiple selections allowed
  - Placement: Above the 3-column mill layout
- Verify mock data distribution (it's already good)
- Get design approval before coding

**Avoids:** Discovering design issues mid-implementation

### Phase 2: Core Filter Implementation (Week 1-2)
- Copy FilterPill component from OrdersTable
- Add activeStates state to MillProductionPage
- Add toggleState(state) handler
- Calculate stateCounts in useMemo
- Filter orders before passing to MillColumn
- Add "Clear filters" button
- **Estimated:** 2-3 hours

**Why this order:**
- Reuses proven component (low risk)
- Filtering logic is straightforward
- No database or service changes needed
- Clear success criteria (each filter works, counts update)

### Phase 3: Polish & Testing (Week 2)
- Match .pen design pixel-for-pixel
- Test all filter combinations
- Test empty states (no orders in state, all filters clear)
- Accessibility check (button focus, ARIA labels)
- Performance (no lag with multiple filters)

**Why separated:**
- Design and function are distinct phases
- Avoids scope creep in building phase

### Phase 4: Search Integration (v1.2, future)
- Add search input box
- useDebounce(300ms)
- Coordinate search + state filters
- Update badge counts for combined filters

**Why deferred:**
- Not in v1.1 scope
- Can ship without it
- Builds on v1.1 foundation

### Phase 5: Mill Line Filters & URL Persistence (v1.3+, future)
- Add MillLine toggle (Premix, Excel, CGM)
- URL-based filter persistence (useSearchParams)
- Keyboard navigation for cards

**Why deferred:**
- High complexity (architecture decisions)
- Needs design phase first
- Can validate user needs with v1.1 release

---

## Phase Ordering Rationale

**v1.1 dependency flow:**
```
Design (week 1)
  ↓
Mock data OK? (verify, no changes)
  ↓
Core filtering (week 1-2)
  ↓
Polish to design (week 2)
  ↓
Ship v1.1
```

**Why this order:**
1. **Design first** prevents mid-implementation pivots (common pitfall in filter UI)
2. **Reuse FilterPill** minimizes code (2-3 hours vs building from scratch)
3. **Polish last** allows iteration without breaking core functionality
4. **Search deferred** because it requires coordinated state (more complex than state filters alone)

---

## Research Flags for Phases

| Phase | Flag | Severity | Mitigation |
|-------|------|----------|------------|
| **v1.1 Design** | "How do counts behave with active filters?" | MEDIUM | Clarify in design: all counts visible, or hide non-selected? |
| **v1.1 Build** | "FilterPill component needs adapt" | LOW | Copy from OrdersTable, change labels/colors. 30 mins. |
| **v1.1 Test** | "Empty state edge cases" | LOW | Test: no Blocked orders, no filters, all filtered out. Design specifies messaging. |
| **v1.2 Search** | "Search + state filter coordination" | MEDIUM | Will need useMemo with [orders, activeStates, searchTerm]. OrdersTable done this. |
| **v1.3+ Mill filters** | "Cross-cutting filter state" | MEDIUM-HIGH | May need to refactor page component state if 3+ filter types. Plan Redux/Zustand if grows. |
| **v1.3+ URL persistence** | "Browser back/forward behavior" | MEDIUM | Clarify product decision: should back button restore filters? |

**Standard patterns (unlikely to need research):**
- Filter pills component ✓ (established)
- Toggle logic ✓ (proven in OrdersTable)
- Badge count calculation ✓ (useMemo pattern known)
- Empty states ✓ (design specified in FEATURES.md)

---

## Confidence Assessment

| Area | Level | Source | Notes |
|------|-------|--------|-------|
| **Stack (component reuse)** | HIGH | OrdersTable.tsx exists and works | FilterPill is proven. No new libraries needed. |
| **Features (table stakes)** | HIGH | Manufacturing dashboard patterns (SAP, Odoo, Asana) | Kanban-style filtering is 10+ year convention. |
| **Architecture (data flow)** | HIGH | React best practices + existing pattern | No state lifting, no complex derivations. |
| **Pitfalls (common mistakes)** | MEDIUM-HIGH | WebSearch + React patterns | Badge count logic has edge cases (mitigation provided). |
| **Mock data (adequacy)** | MEDIUM-HIGH | Current distribution checked | 12 orders across 4 states is sufficient for v1.1. Could enhance for edge cases but not required. |
| **Complexity (timeline estimate)** | HIGH | FilterPill copy + logic + tests = 2-3 hours | Reuse = speed. Low risk estimate. |
| **Design (visual specs)** | MEDIUM | Not yet designed | .pen file approval needed. No blocker. |

---

## Gaps to Address

These areas need phase-specific research later:

1. **Design decision on count visibility** (v1.1 phase 1)
   - How do badge counts behave when filters active?
   - Get design team to specify this before coding

2. **Empty state messaging** (v1.1 phase 3)
   - What message when all orders filtered out?
   - Who defines this (product, design, engineering)?

3. **Search implementation details** (v1.2, future)
   - Should search be in filter pills section, or separate input above?
   - Debounce time (300ms from OrdersTable, or different)?
   - Search fields (customer name + product, or more)?

4. **Mill line filter scope** (v1.3+, future)
   - Should this show/hide columns, or just filter cards?
   - Can operator select multiple mill lines, or one at a time?

5. **URL persistence strategy** (v1.3+, future)
   - Should browser back/forward restore filters?
   - Should copied URL preserve filters?
   - Library: built-in useSearchParams or TanStack Router?

These are **not blockers** for v1.1. They emerge naturally as phases progress.

---

## Key Recommendations

### For Phase 1 (Design)
1. **Do clarify** badge count behavior with design team (critical for implementation)
2. **Do verify** .pen file shows all 4 states + active state styling
3. **Do check** count badge placement and sizing
4. **Don't:**  Over-design. This is not building a new component; adapting FilterPill.

### For Phase 2 (Build)
1. **Do copy** FilterPill from OrdersTable as starting point
2. **Do test** each filter toggles correctly (simple test matrix)
3. **Do verify** counts update when filters change
4. **Don't:** Add search yet. Keep scope to state filters only.
5. **Don't:** Refactor existing StateSection or MillColumn. Filter before passing data.

### For Phase 3 (Polish)
1. **Do use** design system colors and spacing from .pen
2. **Do test** empty states (no orders, all filters clear, search yields nothing)
3. **Do check** accessibility (button focus, ARIA labels)
4. **Don't:** Add "nice-to-haves" (keyboard nav, animation). Defer to v1.3.

### For Future Phases
1. **v1.2:** Build search as separate feature (plan coordinated state management)
2. **v1.3:** Design mill line filters in separate .pen file (architectural decision first)
3. **v1.4+:** Consider state management upgrade (Redux/Zustand) if 4+ filter types

---

## Success Criteria (v1.1 Complete)

The v1.1 milestone is successful when:

- [ ] Design approved in .pen (visual specs clear)
- [ ] All 4 state filter pills render (Completed, Mixing, Blocked, Pending)
- [ ] Click pill toggles active state (visual change, Set update)
- [ ] Badge shows count of orders in that state
- [ ] Selecting filters hides non-matching cards from all 3 mill columns
- [ ] Counts update when filters change
- [ ] "Clear filters" button resets all selections
- [ ] No filters selected shows all orders (default state)
- [ ] Pixel-matches .pen design (colors, spacing, typography)
- [ ] Works on Premix, Excel, and CGM columns equally
- [ ] No console errors
- [ ] Button elements have aria-pressed and aria-label
- [ ] No accessibility violations (WCAG AA)
- [ ] FilterPill component clean and reusable for v1.2 search integration

---

## Comparison to OrdersTable Pattern

Why we're confident in this approach:

| Aspect | OrdersTable | Mill Production |
|--------|-------------|-----------------|
| **Filter pattern** | Set<OrderStatus> toggles | Set<ProductionState> toggles (same) |
| **Badge counts** | statusCounts useMemo | Will use stateCounts useMemo (same pattern) |
| **Data flow** | Filter → render table | Filter → group by state → render columns (similar) |
| **Component reuse** | FilterPill proven | FilterPill + toggle logic = direct copy |
| **Accessibility** | aria-pressed, aria-label | Same approach (no new issues) |
| **Testing** | Toggle on/off, verify counts | Same test matrix |
| **Time to implement** | Unknown (already done) | 2-3 hours (copy + adapt) |

**Bottom line:** This is not a new feature pattern. It's applying a proven pattern to a different data structure. Low risk.

---

## Estimated Timeline

| Phase | Duration | Effort | Blocker? |
|-------|----------|--------|----------|
| **Design (.pen)** | 3-5 days | Medium | YES (blocks build) |
| **Code (filtering)** | 2-3 hours | Low | NO (once design approved) |
| **Polish (design match)** | 2-3 hours | Low | NO |
| **Test & fixes** | 2-3 hours | Low | NO |
| **TOTAL v1.1** | 1.5-2 weeks | ~8 hours code | Design approval critical |

**Note:** Design approval is the critical path. Once .pen is approved, code phase is fast (reuse = speed).

---

## Sources & Verification

All findings cross-referenced with:

**Established patterns (HIGH confidence):**
- Manufacturing dashboard conventions: [Budibase](https://budibase.com/blog/tutorials/manufacturing-dashboard/), [Frappe ERP](https://docs.frappe.io/erpnext/user/manual/en/manufacturing-dashboard)
- Kanban filtering: [BusinessMap](https://businessmap.io/blog/kanban-board-filter), [TeamHood](https://teamhood.com/kanban/kanban-inventory/)
- Filter UX patterns: [Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering), [Smashing Magazine](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)

**React patterns (HIGH confidence):**
- Component reuse: OrdersTable.tsx analysis (existing codebase)
- State management: useMemo + Set-based toggles (React best practices)
- Mock services: [Cory House mock-data-pattern](https://github.com/coryhouse/mock-data-pattern)

**Empty states & UX (HIGH confidence):**
- [Pencil & Paper](https://www.pencilandpaper.io/articles/empty-states), [Shopify Polaris](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)

---

## Next Steps

1. **Share this research with design team** — MILL_PRODUCTION_FEATURES.md has detailed feature specs
2. **Design filter pills in .pen** — Use FEATURES.md as reference for visual specs
3. **Get design approval** — Critical path item
4. **Begin Phase 2 build** — Use FilterPill from OrdersTable as template
5. **Plan v1.2 search** — Queue for next iteration (not blocking v1.1)

---

*Research completed: 2026-04-28*
*Researched by: Claude Code (Phase 6 Research)*
*Downstream consumer: Roadmap planning & v1.1 implementation*
*Confidence level: HIGH — established patterns with proven component reuse*
