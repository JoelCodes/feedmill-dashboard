# Phase 23: User Experience Integration - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Clerk's UserButton component into the header to display the authenticated user and provide sign-out functionality. This phase implements the header user area designed in Phase 22 with proper loading states and hydration handling.

**Scope:** Header user display and sign-out action only. Authentication flow (sign-in page, route protection) already complete in Phases 20-21.

</domain>

<decisions>
## Implementation Decisions

### UserButton Integration
- **D-01:** Use Clerk's prebuilt UserButton component with appearance customization. Consistent with SignIn approach from Phase 20, reuses existing clerk-theme.ts config.
- **D-02:** Position UserButton after notifications. Header order: search | settings | bell | USER. Standard dashboard pattern matching Phase 22 design.
- **D-03:** Minimal dropdown contents — name/email display + Sign Out only. Hide Clerk's default "Manage Account" and other menu items via appearance config.

### Loading State
- **D-04:** Show 32px circular skeleton placeholder while auth state loads. Matches existing loading patterns (OrdersTable skeletons) and prevents layout shift.

### Hydration Handling
- **D-05:** Use Clerk's `<ClerkLoaded>` wrapper with skeleton fallback. Reliable server/client hydration match, shows skeleton while Clerk initializes, then real UserButton.

### Sign-out Behavior
- **D-06:** Redirect to `/sign-in` after sign-out. Clean flow, no extra redirects via middleware.
- **D-07:** No confirmation dialog for sign-out. Click Sign Out, immediately sign out. Simple and fast.

### Claude's Discretion
None — all areas received explicit user decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/20-clerk-foundation-setup/20-CONTEXT.md` — D-08/D-09/D-10/D-11 for Clerk appearance config pattern and CSS variable approach
- `.planning/phases/22-auth-page-design/22-CONTEXT.md` — D-01 through D-08 for header user area design decisions

### Clerk Integration
- `.planning/research/SUMMARY.md` — Clerk integration research with UserButton customization patterns
- `src/lib/clerk-theme.ts` — Existing Clerk appearance config to extend for UserButton

### Design System
- `designs/page-layout.pen` — Header user area design (Phase 22 output)
- `src/app/globals.css` — Semantic tokens that UserButton appearance must reference
- `src/components/Header.tsx` — Integration target file

### Requirements
- `.planning/REQUIREMENTS.md` — UX-01 (display user name/email), UX-02 (sign-out action), UX-03 (theme support), AUTH-02 (sign out from any page)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/clerk-theme.ts`: Clerk appearance config with full token mapping — extend for UserButton
- `src/components/Header.tsx`: Current header with search, notifications, settings — UserButton goes after bell
- `src/components/ui/`: Existing skeleton patterns can inform loading state

### Established Patterns
- Clerk appearance: CSS variable references (`var(--color-primary)`) for automatic theme sync
- Header layout: Flex with `gap-4` between action items
- Icon sizing: 16px (h-4 w-4) for header icons, 32px avatar slightly larger for prominence
- Loading: Skeleton components with rounded-full for circular elements

### Integration Points
- `src/components/Header.tsx`: Add UserButton after notification bell button
- `src/lib/clerk-theme.ts`: Add userButtonMenuItems customization to hide "Manage Account"
- Clerk's `afterSignOutUrl` prop: Set to `/sign-in` for redirect behavior

</code_context>

<specifics>
## Specific Ideas

- UserButton appearance should match existing SignIn styling — same semantic tokens
- 32px avatar aligns with Phase 22 design, fits header visual hierarchy
- Skeleton should be rounded-full to match avatar shape
- `<ClerkLoaded>` wrapper prevents SSR/client hydration mismatch

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-User Experience Integration*
*Context gathered: 2026-05-10*
