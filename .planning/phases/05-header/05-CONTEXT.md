# Phase 5: Header - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Header features (global search, notifications, settings) are functional. Users can search orders from the header, view and interact with notifications via a dropdown panel, access a settings page with user preferences, and see dynamic page titles that reflect the current route.

</domain>

<decisions>
## Implementation Decisions

### Notifications System
- **D-01:** Notifications support multiple event types — order status changes, alerts, and system messages
- **D-02:** Notifications display in a dropdown panel (click bell → shows list)
- **D-03:** Badge shows unread notification count on bell icon
- **D-04:** Use real persistence (localStorage) to track read/unread state across sessions
- **D-05:** Create a notification service (mock data source, like orders service) that can be replaced with real API later

### Settings Navigation
- **D-06:** Settings page contains user preferences, not just a stub
- **D-07:** Preferences include both notification settings (toggle notification types) and display settings (theme/dark mode, density options)
- **D-08:** Preferences persist to localStorage across sessions
- **D-09:** Settings button in header navigates to /settings route

### Header Layout
- **D-10:** Header title updates dynamically based on current route (e.g., "Orders" on /orders, "Settings" on /settings)
- **D-11:** Keep existing header design/layout — add functionality without visual redesign
- **D-12:** Add notification badge indicator to bell icon

### Claude's Discretion
- Notification dropdown positioning and styling
- Settings page layout and section organization
- Specific preference controls (toggles, selects, etc.)
- Route-to-title mapping implementation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Header — HEADER-01 (global search), HEADER-02 (notifications), HEADER-03 (settings)

### Architecture
- `.planning/codebase/ARCHITECTURE.md` — Page-based routing via Next.js App Router
- `.planning/codebase/CONVENTIONS.md` — Component patterns, Tailwind styling, localStorage usage

### Existing Implementation
- `src/components/Header.tsx` — Current header with search input, Settings button, Bell button (all non-functional)
- `src/hooks/useLocalStorage.ts` — Existing localStorage hook (created in Phase 2)

### Prior Phase Context
- `.planning/phases/04-navigation/04-CONTEXT.md` — Navigation patterns, usePathname() for route detection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Header.tsx`: Already has search input, Settings button, Bell button — wire functionality
- `useLocalStorage.ts`: Hook for localStorage persistence — use for preferences and notification state
- `usePathname()`: Next.js hook for detecting current route — use for dynamic titles

### Established Patterns
- Lucide React icons (Search, Bell, Settings already imported)
- Tailwind CSS with CSS variables for colors
- Mock service pattern from orders service

### Integration Points
- Header component used on all pages via page-level composition
- Next.js App Router for /settings route
- localStorage for preference and notification persistence

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Global search functionality (HEADER-01) — user did not select for discussion, but it's in requirements and should be implemented
- Real notification backend — mock service for now, real API integration is future work

</deferred>

---

*Phase: 05-header*
*Context gathered: 2026-04-28*
