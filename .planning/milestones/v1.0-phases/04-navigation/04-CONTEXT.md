# Phase 4: Navigation - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can navigate between different views using the sidebar. Clicking sidebar links routes to different pages, and the current view is visually indicated with active state styling. This phase makes the existing sidebar fully functional.

</domain>

<decisions>
## Implementation Decisions

### Active State Detection
- **D-01:** Auto-detect active item from current URL pathname using Next.js `usePathname()` hook
- **D-02:** Use prefix matching for nested routes — `/orders/123` highlights the Orders nav item
- **D-03:** Remove hardcoded `activeItem` prop from Sidebar usage; component derives state internally

### Sidebar Item Scope
- **D-04:** Wire up Production section only (Dashboard, Production, Orders, Inventory, Shipments)
- **D-05:** Keep Settings section (Formulas) as `#` placeholder for now — out of scope
- **D-06:** Create stub pages for items without content (Orders, Inventory, Shipments)

### Stub Page Content
- **D-07:** Stub pages show empty page with title only — minimal implementation to keep routing functional
- **D-08:** Use shared layout pattern with Sidebar for consistent structure

### Claude's Discretion
- Route path naming conventions (kebab-case, singular vs plural)
- Exact stub page layout structure
- Whether to extract a shared layout component or use Next.js route groups

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `.planning/codebase/ARCHITECTURE.md` — Page-based routing via Next.js App Router, component composition patterns

### Requirements
- `.planning/REQUIREMENTS.md` §Navigation — NAV-01 (sidebar routing), NAV-02 (active state indication)

### Existing Implementation
- `src/components/Sidebar.tsx` — Current sidebar with NavItem component, nav items array, activeItem prop pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sidebar.tsx`: Already has NavItem component with active styling, uses Next.js Link
- `navItems` array: Has all nav items defined with icon, label, id, href properties
- `activeItem` prop: Current mechanism for active state (to be replaced with auto-detection)

### Established Patterns
- Next.js Link component for client-side navigation
- Sidebar wraps page content in flex layout
- NavItem renders with icon background color change for active state

### Integration Points
- Root layout (`src/app/layout.tsx`): Children rendered without Sidebar currently
- Each page handles its own layout with Sidebar
- Mill Production page (`src/app/mill-production/page.tsx`) shows existing page pattern

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Settings section navigation (Formulas page) — Phase 5 or later
- Page-specific content beyond stub title — each feature gets its own phase
- Breadcrumb navigation — not requested

</deferred>

---

*Phase: 04-navigation*
*Context gathered: 2026-04-27*
