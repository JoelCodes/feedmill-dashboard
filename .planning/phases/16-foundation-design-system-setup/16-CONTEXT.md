# Phase 16: Foundation & Design System Setup - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes the token infrastructure, theming system, and tooling that enables component development in Phase 17. Deliverables: expanded design tokens (interactive states + spacing scale), next-themes integration with light/dark/system options, CVA + cn() utilities, ESLint rules blocking hardcoded values, and a component-library.pen file as the design source of truth.

</domain>

<decisions>
## Implementation Decisions

### Token Architecture
- **D-01:** Keep current two-tier pattern — primitives in `:root` (--primary, --success), semantic aliases in `@theme inline` (--color-primary). Already established, minimal refactoring needed.
- **D-02:** Add both interactive states AND spacing scale before Phase 17. Interactive states (hover, focus, active, disabled) required for Button variants. Spacing scale (--space-1 through --space-12) replaces arbitrary px values.

### Dark Mode Approach
- **D-03:** Use next-themes + CSS variables. next-themes handles flash prevention, localStorage persistence, and system preference detection. CSS variables swap via `.dark` class.
- **D-04:** Support three theme options: Light / Dark / System. Respects user preference with OS fallback.

### Design File Structure
- **D-05:** Library + page files approach. Create `component-library.pen` with primitives and tokens. Existing page .pen files (customers.pen, customer-detail.pen, mill-production.pen) reference library as source of truth.
- **D-06:** Keep existing .pen files and reference library. Extract any reusable components to component-library.pen. Pages reference library components.

### Hardcoded Value Enforcement
- **D-07:** ESLint + regex patterns. Custom ESLint rule checking for hex colors (#xxx, #xxxxxx) and px values in className strings. Lightweight, no extra dependencies.
- **D-08:** Error severity (blocks builds). Hardcoded values fail CI builds. Forces compliance — fix existing violations before enabling rule.

### Claude's Discretion
- None — user provided explicit choices for all areas.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Token System
- `.planning/REQUIREMENTS.md` — Foundation requirements FOUND-01 through FOUND-04
- `src/app/globals.css` — Current token definitions to extend

### Design System Research
- `.planning/research/design-system-research.md` — CVA patterns, next-themes setup, anti-patterns to avoid

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Styling conventions and design token usage patterns
- `.planning/codebase/STACK.md` — Tailwind CSS 4, PostCSS configuration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `globals.css`: 77 CSS variables already defined — extend rather than replace
- `@theme inline` block: Tailwind 4 integration pattern already established
- `eslint.config.mjs`: ESLint 9 flat config ready for custom rules

### Established Patterns
- Two-tier token naming: primitives → semantic (keep this pattern)
- CSS custom properties via `var(--token-name)` in components
- `bg-[var(--x)]` syntax for Tailwind + CSS variables

### Integration Points
- `layout.tsx`: Where ThemeProvider wrapper will go
- Settings page: Where theme toggle UI will connect
- All components: Must convert hardcoded hex/px to tokens before ESLint rule activates

</code_context>

<specifics>
## Specific Ideas

- Interactive state tokens should follow pattern: `--color-{semantic}-hover`, `--color-{semantic}-active`, `--color-{semantic}-disabled`
- Spacing scale: `--space-1` (4px) through `--space-12` (48px), doubling intervals
- ESLint rule should have descriptive error messages pointing to correct token usage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-Foundation & Design System Setup*
*Context gathered: 2026-05-07*
