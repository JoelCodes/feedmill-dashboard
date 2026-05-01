# CGM Dashboard

## What This Is

A feed mill operations dashboard that displays and manages feed orders in real-time. Built with Next.js, React, and Tailwind CSS following a Design → Infrastructure → Build pattern. The v1.0 MVP provides interactive order management including filtering, search, selection, order details with timeline visualization, and functional navigation. The v1.1 update adds a polished mill production dashboard with multi-select status filtering and design token system.

## Core Value

Operations staff can see and manage feed orders in real-time, from pending through delivery.

## Current State

**Shipped:** v1.1 Mill Production Dashboard (2026-04-29)
**Codebase:** 3,191 LOC TypeScript
**Tech stack:** Next.js 15, React 19, Tailwind CSS 4

**What's working:**
- Orders table with multi-status filtering, search, keyboard navigation
- Order details panel with timeline and change history
- Functional sidebar navigation with auto-detecting active state
- Header with global search and notification system
- Settings page with theme/density preferences
- Mill production view with 3 columns, state cards, and multi-select filter pills
- Design token system for status colors, typography, and spacing
- 33 mock production orders with realistic Book1.xlsx data

**Known gaps (deferred):**
- Phase 3 (KPI Cards) not implemented — KPI cards show static values, not computed from order data
- KPI click-to-filter not functional

## Current Milestone: v1.2 Customers Page

**Goal:** Sales/delivery team can look up customers, see their order history and bin status, and track activity across orders and deliveries.

**Target features:**
- Customers list page with search and order/change status indicators
- Customer detail page with unified activity timeline
- Bin visualization with fill level bars and alert thresholds
- Mock bin data following Bin Sentry patterns

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

### Active

<!-- Current scope for v1.2 Customers Page -->

- [ ] Customers list page with search functionality
- [ ] Customer row shows order status and change flags
- [ ] Customer detail page with header info
- [ ] Unified activity timeline (orders, deliveries, bin alerts)
- [ ] Order history with inline summary and link to full details
- [ ] Bin visualization with fill level bars
- [ ] Low/critical alert thresholds on bins
- [ ] Mock bin data service (Bin Sentry-style)

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
*Last updated: 2026-05-01 after v1.2 milestone started*
