# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-29
**Phases:** 5 (of 6) | **Plans:** 12 | **Timeline:** 49 days

### What Was Built
- Infrastructure layer with TypeScript types, mock services, StatusBadge component, loading skeletons
- Interactive orders table with multi-status filtering, debounced search, text highlighting, keyboard navigation
- Order details panel with dynamic data display, timeline visualization, change history
- Functional navigation with auto-detecting active state using usePathname() and prefix matching
- Complete header system with global search wiring, notification dropdown, settings page

### What Worked
- **Design → Infrastructure → Build pattern:** Ensured consistent UX before implementation
- **Derived state pattern:** Avoided setState in useEffect across multiple components
- **Outside-in development:** Starting from visual prototype made incremental progress visible
- **Single source of truth patterns:** localStorage-backed read state, STATUS_CONFIG for styling
- **Quick tasks for small fixes:** Timeline connector lines, pending items section handled efficiently

### What Was Inefficient
- **Phase 3 not started:** KPI Cards were deprioritized but remain in v1.0 scope — should have been explicitly deferred earlier
- **ROADMAP.md tracking:** Phase 2 marked incomplete in ROADMAP despite being executed — tracking state drift
- **Quick task cleanup:** 9 quick task directories accumulated without proper status tracking

### Patterns Established
- `usePathname()` with prefix matching for auto-detecting active navigation
- Derived state for selection validation: `validSelectedId = selectedId && visibleIds.includes(selectedId)`
- localStorage-backed state with SSR guard pattern (useLocalStorage hook)
- externalSearchTerm || debouncedSearch priority pattern for multi-source search

### Key Lessons
1. **Defer explicitly, not implicitly:** Phase 3 should have been marked "deferred to v1.1" in ROADMAP.md before starting Phase 4
2. **Clean up quick tasks:** Quick task directories should be archived or deleted at milestone close
3. **Verification human_needed items:** Phase 4 verification gaps should be resolved or acknowledged before milestone close
4. **ROADMAP.md must be updated after execution:** Stale checkboxes (Phase 2 showing unchecked) cause audit confusion

### Cost Observations
- Model mix: Primarily Sonnet for execution, Opus for planning
- Plans executed efficiently: Average ~2-3 minutes per plan
- Total execution time: ~13 minutes for 12 plans

---

## Milestone: v1.1 — Mill Production Dashboard

**Shipped:** 2026-04-29
**Phases:** 4 | **Plans:** 5 | **Timeline:** 2 days

### What Was Built
- Status filter pills design with 4 interaction states (hover, active, multi-select, filtered)
- Expanded mock production orders from 12 to 33 with realistic Book1.xlsx data
- Reusable FilterPill component with generic color props and 11 unit tests
- Multi-select filter toggle behavior for mill production page
- Design token system eliminating all hardcoded hex colors and inline styles

### What Worked
- **TDD for FilterPill:** 11 tests established clear contract before extraction
- **Generic color props:** Made component reusable across orders and mill-production contexts
- **Design tokens in globals.css:** Centralized styling enables future theme support
- **Set<ProductionState> for multi-select:** O(1) has() lookups, clean toggle logic
- **Memoization strategy:** stateCounts (static) vs filteredOrders (dynamic) correctly separated

### What Was Inefficient
- **Quick task cleanup still pending:** 10 quick task directories carry over from v1.0
- **One-liner extraction from SUMMARY.md:** SDK didn't extract properly, required manual fix
- **Verification gap in Phase 06:** human_needed status carried forward without resolution

### Patterns Established
- Design token naming: semantic (text-card-label) over technical (text-11)
- Hex alpha format (#rrggbb38) for opacity variants in CSS variables
- FilterPillColorConfig interface for reusable pill styling
- STATE_ORDER constant for consistent status rendering order

### Key Lessons
1. **TDD pays off for shared components:** FilterPill extraction was clean because tests documented behavior
2. **Static vs dynamic memoization:** Always separate counts (static) from filtered results (dynamic) in filter UIs
3. **Design tokens should happen earlier:** Would have been cleaner to establish tokens before Phase 8 implementation
4. **Quick task hygiene needed:** v1.0 backlog carried into v1.1 — need explicit cleanup phase

### Cost Observations
- Phases completed in 2 days (fast turnaround)
- All 5 plans executed under 10 minutes total
- Jest infrastructure added (one-time cost, now available for future tests)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 12 | Established Design → Infra → Build pattern |
| v1.1 | 4 | 5 | Added TDD, design tokens, shared component extraction |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | useDebounce, useLocalStorage hooks |
| v1.1 | 11 | FilterPill 100% | FilterPill component, Jest infrastructure |

### Top Lessons (Verified Across Milestones)

1. Derived state pattern avoids React lint violations and cascading renders
2. Outside-in development with visual prototype makes progress visible
3. Single source of truth for state (STATUS_CONFIG, localStorage-backed) prevents drift
4. TDD for shared components ensures clean extraction and documents behavior
5. Design tokens should be established early — retrofitting is more work
