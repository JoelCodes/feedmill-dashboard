# Roadmap: CGM Dashboard

## Milestones

- ✅ **v1.0 MVP** - Phases 0-5 (shipped 2026-04-29)
- ✅ **v1.1 Mill Production Dashboard** - Phases 6-9 (shipped 2026-04-29)
- ✅ **v1.2 Customers Page** - Phases 10-15 (shipped 2026-05-06)
- ✅ **v1.3 Design Hardening** - Phases 16-19 (shipped 2026-05-09)
- 🚧 **v1.4 Auth with Clerk** - Phases 20-24 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0-5) - SHIPPED 2026-04-29</summary>

### Phase 0: Infrastructure
**Goal**: Foundation for orders table with type-safe data
**Plans**: 2 plans

Plans:
- [x] 00-01: Define TypeScript types and create mock orders service
- [x] 00-02: Create StatusBadge component and loading skeletons

### Phase 1: Orders Table
**Goal**: Interactive table with filtering and search
**Plans**: 3 plans

Plans:
- [x] 01-01: Display order lines with all required columns
- [x] 01-02: Implement status filtering with clickable pills
- [x] 01-03: Add search functionality and row selection

### Phase 2: Order Details
**Goal**: Complete order details panel with timeline
**Plans**: 2 plans

Plans:
- [x] 02-01: Implement order details panel with dynamic data
- [x] 02-02: Add timeline visualization and change history

### Phase 3: KPI Cards (DEFERRED)
**Goal**: Dashboard KPIs with click-to-filter
**Status**: Deferred to v1.2+

### Phase 4: Navigation
**Goal**: Functional navigation with auto-detecting active state
**Plans**: 1 plan

Plans:
- [x] 04-01: Implement sidebar with auto-detecting active state

### Phase 5: Header & Settings
**Goal**: Complete header system with notifications and settings
**Plans**: 4 plans

Plans:
- [x] 05-01: Implement notification system with localStorage state
- [x] 05-02: Wire header search to OrdersTable
- [x] 05-03: Create settings page with preferences
- [x] 05-04: Integrate header search with table filtering

</details>

<details>
<summary>✅ v1.1 Mill Production Dashboard (Phases 6-9) - SHIPPED 2026-04-29</summary>

### Phase 6: Design
**Goal**: Status filter pills designed and approved in mill-production.pen
**Plans**: 1 plan

Plans:
- [x] 06-01: Design filter pills with interaction states in mill-production.pen

### Phase 7: Data Infrastructure
**Goal**: Production orders mock service derived from Book1.xlsx example data
**Plans**: 1 plan

Plans:
- [x] 07-01: Expand mock service to 33 orders with textureType and lineCode fields

### Phase 8: Filter Implementation
**Goal**: Interactive status filter pills with toggle behavior
**Plans**: 2 plans

Plans:
- [x] 08-01: Extract shared FilterPill component with TDD
- [x] 08-02: Integrate filter pills into mill-production page

### Phase 9: Polish
**Goal**: Mill production view matches .pen design pixel-perfect
**Plans**: 1 plan

Plans:
- [x] 09-01: Add design tokens and replace hardcoded values with token-based styling

</details>

<details>
<summary>✅ v1.2 Customers Page (Phases 10-15) - SHIPPED 2026-05-06</summary>

- [x] **Phase 10: Design** - Create Pencil.dev design files for customers page components (COMPLETED 2026-05-02)
- [x] **Phase 11: Foundation (Data Layer)** - Type definitions and mock services for customers and bins (COMPLETED 2026-05-05)
- [x] **Phase 12: Customer List Page** - Searchable customer table with status indicators (COMPLETED 2026-05-05)
- [x] **Phase 13: Customer Detail Infrastructure** - Customer detail page with header and summary stats (COMPLETED 2026-05-05)
- [x] **Phase 14: Activity Timeline** - Unified chronological timeline across orders, deliveries, and bin alerts (COMPLETED 2026-05-05)
- [x] **Phase 15: Bin Visualization** - Bin fill level bars with threshold-based color coding (COMPLETED 2026-05-05)

</details>

<details>
<summary>✅ v1.3 Design Hardening (Phases 16-19) - SHIPPED 2026-05-09</summary>

- [x] **Phase 16: Foundation & Design System Setup** - Establish token system, theming infrastructure, and design file organization (5 plans)
- [x] **Phase 17: Component Library** - Build reusable primitives: Button, Input, Card, Badge, Theme Toggle (5 plans)
- [x] **Phase 18: Page Migration** - Migrate all pages to design system and eliminate hardcoded values (7 plans)
- [x] **Phase 19: Documentation & Accessibility** - Document usage patterns and verify WCAG compliance (10 plans)

**Key deliverables:**
- 200+ semantic design tokens (colors, spacing, typography, shadows)
- CVA-based component library (10 components)
- Light/dark theme support with next-themes
- WCAG 2.1 AA accessibility compliance
- 304 passing tests

</details>

### 🚧 v1.4 Auth with Clerk (In Progress)

**Milestone Goal:** Add user authentication so only logged-in users can access the dashboard.

- [x] **Phase 20: Clerk Foundation Setup** - Install SDK, configure middleware, create sign-in page (completed 2026-05-10)
- [ ] **Phase 21: Route Protection** - Protect dashboard routes with middleware-based auth
- [ ] **Phase 22: Auth Page Design** - Design sign-in page and header user area in Pencil.dev
- [ ] **Phase 23: User Experience Integration** - Add user display to header with sign-out action
- [ ] **Phase 24: Production Deployment Validation** - Verify production keys, domain configuration, live deployment

## Phase Details

### Phase 20: Clerk Foundation Setup
**Goal**: Clerk SDK installed and configured with functional sign-in flow
**Depends on**: Nothing (first phase of v1.4)
**Requirements**: AUTH-01, AUTH-03, PROT-03
**Success Criteria** (what must be TRUE):
  1. User can log in with email and password through sign-in page
  2. User session persists across browser refresh (stays logged in)
  3. Sign-in page is accessible without authentication
  4. No middleware detection errors in console during auth operations
**Plans**: 2 plans

Plans:
- [x] 20-01-PLAN.md — Install Clerk SDK, configure env vars, add ClerkProvider, create middleware
- [x] 20-02-PLAN.md — Create Clerk theme config and sign-in page with branding

### Phase 21: Route Protection
**Goal**: All dashboard pages require authentication, unauthenticated users redirected to sign-in
**Depends on**: Phase 20
**Requirements**: PROT-01, PROT-02
**Success Criteria** (what must be TRUE):
  1. Unauthenticated user accessing /orders is redirected to sign-in page
  2. Unauthenticated user accessing /customers is redirected to sign-in page
  3. Unauthenticated user accessing /mill-production is redirected to sign-in page
  4. Unauthenticated user accessing /settings is redirected to sign-in page
  5. After sign-in, user is redirected back to originally requested page
**Plans**: TBD

### Phase 22: Auth Page Design
**Goal**: Sign-in page and header user area designed in Pencil.dev files
**Depends on**: Phase 21
**Requirements**: None (design phase)
**Success Criteria** (what must be TRUE):
  1. Sign-in page layout designed showing email/password form
  2. Header user area designed showing avatar, name, and sign-out button
  3. Light and dark theme variants designed for auth components
  4. Design follows existing component library patterns and tokens
  5. Design file committed and ready for implementation reference
**Plans**: TBD
**UI hint**: yes

### Phase 23: User Experience Integration
**Goal**: Header displays authenticated user info with sign-out action and theme support
**Depends on**: Phase 22
**Requirements**: UX-01, UX-02, UX-03, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Header displays signed-in user's name or email in all authenticated pages
  2. Header includes accessible sign-out button that logs user out
  3. Sign-out redirects user to sign-in page
  4. Auth UI components (sign-in, sign-up, user button) respect current theme (light/dark)
  5. No hydration errors or flash of unauthenticated content on page load
**Plans**: TBD
**UI hint**: yes

### Phase 24: Production Deployment Validation
**Goal**: Authentication works in production with live Clerk keys and domain verification
**Depends on**: Phase 23
**Requirements**: None (validation phase)
**Success Criteria** (what must be TRUE):
  1. Production deployment uses live Clerk keys (pk_live_, sk_live_)
  2. Production domain is associated with Clerk production instance
  3. Test user can successfully sign in on production URL
  4. Clerk dashboard shows authentication events from production domain
  5. No "Invalid publishable key" errors in production logs
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 20 → 21 → 22 → 23 → 24

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 20. Clerk Foundation Setup | 2/2 | Complete    | 2026-05-10 |
| 21. Route Protection | 0/TBD | Not started | - |
| 22. Auth Page Design | 0/TBD | Not started | - |
| 23. User Experience Integration | 0/TBD | Not started | - |
| 24. Production Deployment Validation | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-11*
*v1.0 shipped: 2026-04-29*
*v1.1 shipped: 2026-04-29*
*v1.2 shipped: 2026-05-06*
*v1.3 shipped: 2026-05-09*
*v1.4 roadmap created: 2026-05-09*
