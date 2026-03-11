# CGM Dashboard

## What This Is

A feed mill operations dashboard that starts as a visual prototype and progressively becomes a real, interactive application — milestone by milestone. Each milestone breathes life into one part of the dashboard, following a Design → Infrastructure (or mock) → Build pattern.

## Core Value

Operations staff can see and manage feed orders in real-time, from pending through delivery.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Dashboard layout with sidebar, header, main content — existing
- ✓ KPI cards displaying production metrics — existing (static)
- ✓ Orders table showing order list — existing (static)
- ✓ Order details panel with timeline — existing (static)
- ✓ Visual design system with Tailwind CSS variables — existing

### Active

<!-- Current scope. Building toward these. -->

**Milestone 1: Orders Table**
- [ ] Display order lines with: Document #, Customer, Product, Quantity, Location, Delivery Date, Status, Changes indicator
- [ ] Product column combines Texture Type + Formula Type
- [ ] Status badges: Pending, Producing, Ready, In Transit, Complete
- [ ] Red dot indicator for orders with changes (flag in data)
- [ ] Filter by status (pills)
- [ ] Filter by "has changes"
- [ ] Search bar for customer name and product
- [ ] Row selection (visual highlight)

**Milestone 2: Order Details**
- [ ] Click row to open order details panel
- [ ] Expanded timeline with event drill-down
- [ ] Order change history

**Milestone 3: KPI Cards**
- [ ] Real/dynamic KPI numbers
- [ ] Clickable cards for drill-down

**Milestone 4: Navigation**
- [ ] Functional sidebar routing
- [ ] Multiple pages/views

**Milestone 5: Header**
- [ ] Working search
- [ ] Notifications system
- [ ] Settings page

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile app — web-first, responsive later
- Real-time push updates — polling or manual refresh sufficient for v1
- Multi-tenant / multi-mill — single mill focus initially
- User authentication — deferred until navigation milestone or later (will mock if needed earlier)
- Database integration — mock data functions until explicitly requested

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

**Existing codebase:** See `.planning/codebase/` for architecture, conventions, and concerns.

## Constraints

- **Design-first**: Each milestone starts with Pencil.dev design files before implementation
- **Ask before infrastructure**: Propose databases, auth, APIs — implement only if approved, otherwise mock
- **Preserve patterns**: Follow existing Next.js/React/Tailwind conventions from codebase map

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Outside-in development | Start with working UI, add real functionality incrementally | — Pending |
| Design → Infrastructure → Build | Ensures visual/UX consideration before coding | — Pending |
| Milestone order: Table → Details → KPIs → Nav → Header | Logical dependency chain, core functionality first | — Pending |
| Each order line = separate row | Lines are individual deliveries to specific bins | — Pending |
| Product = Texture Type + Formula Type | Simplifies display, keeps related info together | — Pending |
| Changes = flag in data | Simple implementation, can evolve to change tracking later | — Pending |

---
*Last updated: 2026-03-11 after initialization*
