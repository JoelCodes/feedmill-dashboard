# CGM Dashboard

## What This Is

A feed mill operations dashboard that displays and manages feed orders in real-time. Built with Next.js, React, and Tailwind CSS following a Design → Infrastructure → Build pattern. The v1.0 MVP provides interactive order management including filtering, search, selection, order details with timeline visualization, and functional navigation. The v1.1 update adds a polished mill production dashboard with multi-select status filtering and design token system. The v1.2 release adds a customer management system with customer list, detail pages, unified activity timeline, and bin visualization with fill level indicators. The v1.3 release establishes a unified design system with 200+ semantic tokens, a CVA-based component library, and WCAG 2.1 AA accessibility compliance.

## Core Value

Operations staff can see and manage feed orders in real-time, from pending through delivery.

## Current State

**Shipped:** v1.3 Design Hardening (2026-05-09)
**Codebase:** ~7,000 LOC TypeScript
**Tech stack:** Next.js 15, React 19, Tailwind CSS 4
**Tests:** 304 passing | **ESLint:** 0 errors

**What's working:**
- Orders table with multi-status filtering, search, keyboard navigation
- Order details panel with timeline and change history
- Functional sidebar navigation with auto-detecting active state
- Header with global search and notification system
- Settings page with theme toggle (light/dark/system) and density preferences
- Mill production view with 3 columns, state cards, and multi-select filter pills
- Customer list page with search, sort by recent activity, status indicators
- Customer detail page with header, contact info, summary stats
- Activity timeline merging orders, deliveries, bin alerts with expand/collapse
- Bin visualization with vertical tank gauges and threshold coloring (green/yellow/red)
- 18 mock customers with stats aggregation, 38 mock bins with fill percentages
- **Design system with 200+ semantic tokens** (colors, spacing, typography, shadows)
- **CVA-based component library** (Button, Card, Input, Select, Textarea, StatusBadge, FilterPill, Gauge, Timeline, ThemeToggle)
- **Light/dark theme support** via next-themes with flash prevention
- **WCAG 2.1 AA accessibility compliance** with jest-axe testing and VoiceOver verification
- **Comprehensive documentation** (148 token definitions, 10 component API guides)

**Known gaps (deferred):**
- Phase 3 (KPI Cards) not implemented — KPI cards show static values, not computed from order data
- KPI click-to-filter not functional

## Next Milestone Goals

Awaiting user input for v1.4 scope. Potential directions:
- Real data integration (API/database)
- KPI cards with computed values
- Mobile responsiveness
- User authentication

## Requirements

### Validated

<!-- Shipped and confirmed working -->

**v1.0:**
- ✓ TypeScript types defined for Order data structure — v1.0
- ✓ Mock orders service with async interface — v1.0
- ✓ StatusBadge component extracted with shared constants — v1.0
- ✓ Loading skeleton components for table and details — v1.0
- ✓ Display order lines with all required columns — v1.0
- ✓ Product column combines Texture Type + Formula Type — v1.0
- ✓ Status badges: Pending, Producing, Ready, In Transit, Complete — v1.0
- ✓ Red dot indicator for orders with changes flag — v1.0
- ✓ Filter by status (clickable pills) — v1.0
- ✓ Filter by "has changes" — v1.0
- ✓ Search bar filters by customer name and product — v1.0
- ✓ Row selection with visual highlight — v1.0
- ✓ Empty state when no results match filters — v1.0
- ✓ Click row to open order details panel — v1.0
- ✓ Order details panel shows full order information — v1.0
- ✓ Timeline visualization of order lifecycle events — v1.0
- ✓ Order change history display — v1.0
- ✓ Panel always visible (design decision) — v1.0
- ✓ Sidebar links route to different views — v1.0
- ✓ Current view indicated in sidebar — v1.0
- ✓ Search box searches across all orders — v1.0
- ✓ Notifications area with indicator — v1.0
- ✓ Settings link to settings page — v1.0

**v1.1:**
- ✓ Filter pills UI designed in mill-production.pen with 4 interaction states — v1.1
- ✓ Mill production view polished to match .pen design exactly — v1.1
- ✓ Mock service expanded to 33 orders from Book1.xlsx example data — v1.1
- ✓ Status filter pills with multi-select toggle behavior — v1.1
- ✓ Design tokens for status colors, typography, and shadows — v1.1
- ✓ Reusable FilterPill component with TDD (11 tests) — v1.1

**v1.2:**
- ✓ Customer list page with search and sort by recent activity — v1.2
- ✓ Customer row shows order count, change flag, and bin alert indicator — v1.2
- ✓ Customer detail page with header (contact info, summary stats) — v1.2
- ✓ Unified activity timeline (orders, deliveries, bin alerts) with expand/collapse — v1.2
- ✓ Order timeline events link to orders page with that order selected — v1.2
- ✓ Bin visualization with vertical tank gauges and fill percentage — v1.2
- ✓ Threshold-based coloring (green >25%, yellow 10-25%, red <10%) — v1.2
- ✓ Mock customer service with stats aggregation (18 customers) — v1.2
- ✓ Mock bin service with fill percentages and alert levels (38 bins) — v1.2

**v1.3:**
- ✓ Semantic token system with two-tier naming (primitives → semantic) — v1.3
- ✓ Light/dark theme infrastructure with next-themes and CSS variable overrides — v1.3
- ✓ CVA and utility setup (class-variance-authority, tailwind-merge, cn() helper) — v1.3
- ✓ ESLint rules blocking hardcoded color and spacing values — v1.3
- ✓ Button component with CVA variants and sizes — v1.3
- ✓ Input components (text, number, select, textarea) with validation states — v1.3
- ✓ Card/Panel compound component (Header, Content, Footer) — v1.3
- ✓ Theme toggle allowing light/dark/system switching — v1.3
- ✓ StatusBadge refactored to use design tokens — v1.3
- ✓ All pages migrated to design system tokens — v1.3
- ✓ Token usage documentation and component guidelines — v1.3
- ✓ WCAG 2.1 AA accessibility compliance verified — v1.3
- ✓ Component library .pen file as single source of truth — v1.3

### Active

<!-- Awaiting v1.4 requirements definition -->

(Run `/gsd-new-milestone` to define v1.4 requirements)

### Deferred

<!-- Acknowledged but not in current scope -->

- KPI cards display computed values from order data (deferred from v1.0)
- Click KPI card to filter table to relevant orders (deferred from v1.0)

### Out of Scope

<!-- Explicit boundaries with reasoning -->

- Mobile app — web-first, responsive later
- Real-time push updates — polling or manual refresh sufficient for v1
- Multi-tenant / multi-mill — single mill focus initially
- User authentication — deferred until needed
- Database integration — mock data until explicitly requested
- Inline editing of orders — dedicated forms provide better UX
- Advanced query builder — simple filters cover 90% of use cases

## Context

**Domain:** Feed mill operations (poultry/livestock feed production and delivery)

**Data structure** (from example-data/Book1.xlsx):
- Document Number — order identifier
- Line Code — formula code
- Texture Type — PELLET, MASH, SH PELLET, FINE CR, C. CRUMBLE
- Customer Name — farm/business name
- Ordered Quantity — amount in pounds
- Farm Location Code — delivery bin (BIN 5, BIN 4A, etc.)
- Early Delivery Date — target delivery date
- Formula Type — NON MEDICATED, MED ALBAC Z, MED ALBAC A, etc.

**Development approach:** Outside-in. Visual prototype exists. Each milestone:
1. **Design** — Pencil.dev files for components and use cases
2. **Infrastructure** — Real service OR mock data/functions (ask first)
3. **Build** — Implement interactivity

**Architecture:** See `.planning/codebase/` for architecture, conventions, and concerns.

## Constraints

- **Design-first**: Each milestone starts with Pencil.dev design files before implementation
- **Ask before infrastructure**: Propose databases, auth, APIs — implement only if approved, otherwise mock
- **Preserve patterns**: Follow existing Next.js/React/Tailwind conventions from codebase map

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Outside-in development | Start with working UI, add real functionality incrementally | ✓ Good |
| Design → Infrastructure → Build | Ensures visual/UX consideration before coding | ✓ Good |
| Milestone order: Table → Details → KPIs → Nav → Header | Logical dependency chain, core functionality first | ✓ Good |
| Each order line = separate row | Lines are individual deliveries to specific bins | ✓ Good |
| Product = Texture Type + Formula Type | Simplifies display, keeps related info together | ✓ Good |
| Changes = flag in data | Simple implementation, can evolve to change tracking later | ✓ Good |
| Derived state pattern for selection | Avoids setState in useEffect, React best practice | ✓ Good |
| Auto-detecting active nav state | usePathname() with prefix matching for nested routes | ✓ Good |
| localStorage for read notification state | Single source of truth for badge and indicators | ✓ Good |
| Phase 3 deferred | KPI functionality can ship in v1.1 without blocking core features | — Pending |
| Generic FilterPill with color props | Enables reuse across orders and mill-production with different status types | ✓ Good |
| Design tokens in globals.css | Centralized styling, eliminates hardcoded hex values, enables theme consistency | ✓ Good |
| TDD for FilterPill component | 11 tests ensure correctness, documents behavior for future maintainers | ✓ Good |
| Vertical tank gauge for bin visualization | More literal representation of fill levels, matches customer-detail.pen design | ✓ Good |
| Stacked status indicators on customer row | Shows all customer states at once - orders + changes + alerts | ✓ Good |
| Bins inside CustomerDetailHeader | Per design: bins below contact/stats in header card, not separate section | ✓ Good |
| Shared mockData.ts singleton | Prevents stale data inconsistency across pages (orders, customers, bins) | ✓ Good |
| TDD for services and components | 104 tests total ensure correctness and document behavior | ✓ Good |
| Multiple timeline events can expand | No accordion behavior - users often compare multiple events | ✓ Good |
| Promise.all for parallel data fetching | Customer detail fetches customer, events, bins concurrently | ✓ Good |
| CVA for type-safe component variants | Class-variance-authority enables exhaustive variant typing with IntelliSense | ✓ Good |
| Two-tier token naming (primitive → semantic) | Primitives in :root, semantics reference via var(), enables theme swapping | ✓ Good |
| next-themes for dark mode | Handles SSR flash prevention, system preference sync, localStorage persistence | ✓ Good |
| jsx-a11y rules approach over plugin | Avoids conflict with eslint-config-next, enables granular rule control | ✓ Good |
| jest-axe for automated a11y testing | Catches WCAG violations during development, enforces compliance | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-09 after v1.3 milestone shipped*
