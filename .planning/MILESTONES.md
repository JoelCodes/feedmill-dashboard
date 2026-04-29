# Milestones

## v1.0 MVP (Shipped: 2026-04-29)

**Phases completed:** 5 phases (0-5, excluding Phase 3), 12 plans, ~24 tasks
**Files modified:** 121 | **Lines of code:** 2,699 TypeScript
**Timeline:** 49 days (2026-03-10 → 2026-04-28)

**Key accomplishments:**

- Infrastructure layer established: TypeScript types, mock orders service, StatusBadge component, loading skeletons
- Interactive orders table: Multi-status filtering, debounced search with text highlighting, keyboard navigation, row selection
- Order details panel: Dynamic data display, timeline visualization with status events, inline change history, sort persistence
- Functional navigation: Auto-detecting active state sidebar using usePathname() with prefix matching for nested routes
- Complete header system: Global search wiring to table, notification dropdown with localStorage-backed read state, settings page

**Known gaps (deferred to v1.1):**

- KPI-01: KPI cards display computed values from order data (Phase 3 not started)
- KPI-02: Click KPI card to filter table to relevant orders (Phase 3 not started)

**Deferred items at close:** 10 items (see STATE.md Deferred Items)

**Archive:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md), [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)

---
