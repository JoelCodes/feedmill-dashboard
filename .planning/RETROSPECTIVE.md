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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 12 | Established Design → Infra → Build pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | useDebounce, useLocalStorage hooks |

### Top Lessons (Verified Across Milestones)

1. Derived state pattern avoids React lint violations and cascading renders
2. Outside-in development with visual prototype makes progress visible
3. Single source of truth for state (STATUS_CONFIG, localStorage-backed) prevents drift
