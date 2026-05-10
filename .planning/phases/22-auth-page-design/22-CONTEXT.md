# Phase 22: Auth Page Design - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Design the header user area component in Pencil.dev. This phase creates the visual design specification for the user display that Phase 23 will implement — avatar, name, and sign-out dropdown menu.

**Scope:** Header user area design only. Sign-in page is already implemented and does not need design documentation.

</domain>

<decisions>
## Implementation Decisions

### Header User Area
- **D-01:** Position user area at far right of header, after notifications. Standard dashboard pattern.
- **D-02:** Display avatar (32px) + name side by side. Full identification at a glance.
- **D-03:** Sign-out via dropdown menu — click user area to reveal menu with Sign Out option.
- **D-04:** Dropdown contents: name/email + Sign Out only. Minimal, no "Manage Account" link.

### Design File Strategy
- **D-05:** Add designs to existing `page-layout.pen` file. Extends existing page layouts.
- **D-06:** Include header user area component only. Skip sign-in page documentation since it's already working.
- **D-07:** Design three states: default, hover, dropdown open.
- **D-08:** Include both light and dark theme variants in design.

### Sign-in Page
- **D-09:** Skip documentation — sign-in page is already implemented and code is source of truth.

### Claude's Discretion
None — all areas received explicit user decisions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Decisions
- `.planning/phases/20-clerk-foundation-setup/20-CONTEXT.md` — D-08/D-09/D-10/D-11 for Clerk appearance config pattern and CSS variable approach

### Design System
- `designs/page-layout.pen` — Target file for user area design
- `designs/component-library.pen` — Reference for existing component patterns and tokens
- `src/app/globals.css` — Semantic tokens that design must reference
- `src/lib/clerk-theme.ts` — Clerk appearance config showing token usage

### Implementation Reference
- `src/components/Header.tsx` — Where UserButton will integrate (Phase 23)
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Existing sign-in implementation for reference

### Requirements
- `.planning/REQUIREMENTS.md` — UX-01 (display user name/email), UX-02 (sign-out action), UX-03 (theme support)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `designs/page-layout.pen`: Existing page layout designs — target file for user area design
- `designs/component-library.pen`: Design system components for reference (Button, Card, etc.)
- `src/lib/clerk-theme.ts`: Clerk appearance config showing full token mapping — same tokens apply to design
- `src/components/Header.tsx`: Current header with search, notifications, settings — user area goes far right

### Established Patterns
- Semantic tokens: Two-tier naming (primitives → semantic) via CSS variables
- Icon sizing: 24px for header icons (bell, settings), 32px for avatar follows this scale
- Spacing: `--space-2` (8px) gap between header elements
- Colors: `--bg-card`, `--text-primary`, `--divider` for surfaces and borders

### Integration Points
- Header right section: Currently [search | notifications | settings]. User area inserts after settings.
- Clerk UserButton: Can be customized via appearance prop using same tokens as SignIn

</code_context>

<specifics>
## Specific Ideas

- Avatar matches 32px sizing — same scale as existing header icons but slightly larger for prominence
- Dropdown menu: simple list with name/email at top, Sign Out below. No complex menu structure.
- Hover state: subtle background highlight on user area
- Both light and dark variants designed to ensure theme consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-Auth Page Design*
*Context gathered: 2026-05-10*
