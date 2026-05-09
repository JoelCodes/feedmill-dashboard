# Milestones

## v1.3 Design Hardening (Shipped: 2026-05-09)

**Phases completed:** 4 phases (16-19), 27 plans
**Tests:** 304 passing | **ESLint:** 0 errors
**Timeline:** 3 days (2026-05-07 → 2026-05-09)

**Key accomplishments:**

- Semantic token system with 200+ CSS variables (colors, spacing, typography, shadows) supporting light/dark themes
- CVA-based component library: Button (4 variants, 3 sizes), Card (compound pattern), Input/Select/Textarea, ThemeToggle
- All pages migrated to design tokens (Orders, Customers, Mill Production, Settings) with zero hardcoded values
- Accessibility infrastructure with jest-axe, eslint-plugin-jsx-a11y, and WCAG 2.1 AA compliance
- Comprehensive design system documentation: 148 token definitions, 10 component API guides
- VoiceOver manual verification and keyboard navigation across all interactive elements

**Deferred items at close:** 0

**Archive:** [v1.3-ROADMAP.md](./milestones/v1.3-ROADMAP.md), [v1.3-REQUIREMENTS.md](./milestones/v1.3-REQUIREMENTS.md)

---

## v1.2 Customers Page (Shipped: 2026-05-06)

**Phases completed:** 6 phases (10-15), 15 plans
**Files modified:** 128 | **Lines of code:** 6,426 TypeScript
**Timeline:** 5 days (2026-05-01 → 2026-05-05)

**Key accomplishments:**

- Customer list page with search, sort by recent activity, and status indicators (order counts, change flags, bin alerts)
- Customer detail page with header (contact info, summary stats) and navigation from list view
- Unified activity timeline merging orders, deliveries, and bin alerts with expand/collapse behavior
- Bin visualization with vertical tank gauges showing fill percentage and threshold-based coloring (green/yellow/red)
- Data layer foundation with type-safe Customer and Bin interfaces, mock services, and stats aggregation

**Deferred items at close:** 2 verification gaps (Phase 10 & 12 design sign-off - human_needed)

**Archive:** [v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md), [v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md)

---

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
