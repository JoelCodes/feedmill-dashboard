# Milestones

## v1.1 Mill Production Dashboard (Shipped: 2026-04-29)

**Phases completed:** 4 phases (6-9), 5 plans, 10 tasks
**Timeline:** 2 days (2026-04-28 → 2026-04-29)

**Key accomplishments:**

- Status filter pill design with 4 interaction states (hover, active, multi-select, filtered)
- Expanded mock production orders from 12 to 33 with realistic Book1.xlsx data
- Extracted reusable FilterPill component with TDD (11 tests) and generic color props
- Integrated filter pills into mill-production page with multi-select toggle behavior
- Added design tokens (12 status colors, typography) and eliminated all hardcoded hex values

**Deferred items at close:** 11 items (see STATE.md Deferred Items)

**Archive:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md), [v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)

---

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
