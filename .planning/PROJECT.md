# CGM Dashboard

## What This Is

A feed mill operations dashboard that displays and manages feed orders in real-time. Built with Next.js, React, and Tailwind CSS following a Design → Infrastructure → Build pattern. The v1.0 MVP provides interactive order management including filtering, search, selection, order details with timeline visualization, and functional navigation.

## Core Value

Operations staff can see and manage feed orders in real-time, from pending through delivery.

## Current State

**Shipped:** v1.0 MVP (2026-04-29)
**Codebase:** 2,699 LOC TypeScript across 121 files
**Tech stack:** Next.js 15, React 19, Tailwind CSS 4

**What's working:**
- Orders table with multi-status filtering, search, keyboard navigation
- Order details panel with timeline and change history
- Functional sidebar navigation with auto-detecting active state
- Header with global search and notification system
- Settings page with theme/density preferences

**Known gaps (deferred to v1.1):**
- Phase 3 (KPI Cards) not implemented — KPI cards show static values, not computed from order data
- KPI click-to-filter not functional

## Requirements

### Validated

<!-- Shipped and confirmed working -->

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

### Active

<!-- Next milestone scope -->

- [ ] KPI cards display computed values from order data (deferred from v1.0)
- [ ] Click KPI card to filter table to relevant orders (deferred from v1.0)

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

---
*Last updated: 2026-04-29 after v1.0 milestone*
