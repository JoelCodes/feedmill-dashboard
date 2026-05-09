# Phase 17: Component Library - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the reusable UI component primitives using the design token system and CVA tooling established in Phase 16. Deliverables: Button (4 variants, 3 sizes), Input components (text, number, select, textarea with validation states), Card compound component (Header/Content/Footer), Theme Toggle UI, and refactored StatusBadge. All components use design tokens and support light/dark themes.

</domain>

<decisions>
## Implementation Decisions

### Component Location
- **D-01:** All design system components go in `src/components/ui/`. StatusBadge is already there — Button, Input, Card, ThemeToggle join it.

### Button Variants
- **D-02:** Primary = --primary (teal) background with white text, using --primary-hover/active/disabled states.
- **D-03:** Secondary = --bg-card background with --divider border, --text-primary text.
- **D-04:** Ghost = transparent background, --text-primary text, subtle hover state.
- **D-05:** Destructive = --error background with white text, using --error-hover/active/disabled states.

### Card Compound Pattern
- **D-06:** Use dot notation for compound pattern — `Card.Header`, `Card.Content`, `Card.Footer`. Single import, intuitive nesting. Follows shadcn/Radix conventions.

### Form Validation UI
- **D-07:** Invalid inputs show red border (--error) PLUS inline error icon (exclamation) for clear visual signal.
- **D-08:** Focus on invalid input: keep red border visible, layer focus ring on top. Error state persists until corrected.

### Claude's Discretion
- None — user provided explicit choices for all areas.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundation (Phase 16 outputs)
- `.planning/phases/16-foundation-design-system-setup/16-CONTEXT.md` — Token architecture decisions, dark mode approach
- `src/app/globals.css` — Complete token definitions including interactive states and spacing scale
- `src/lib/utils.ts` — cn() utility for className composition with CVA

### Requirements
- `.planning/REQUIREMENTS.md` — Component requirements COMP-01 through COMP-05

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Component naming, file organization, styling conventions
- `.planning/codebase/STRUCTURE.md` — Where to add new components

### Existing Reference
- `src/components/ui/StatusBadge.tsx` — Existing badge component to refactor

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cn()` utility in `src/lib/utils.ts` — ready for CVA variant composition
- Interactive state tokens (--primary-hover, --error-active, etc.) — defined in globals.css
- `ThemeProvider` component — already wraps the app, provides useTheme() hook

### Established Patterns
- Two-tier token naming: primitives in :root, semantic aliases in @theme inline
- Dark mode via .dark class with CSS variable overrides
- Components use `bg-[var(--token)]` syntax for Tailwind + CSS variables

### Integration Points
- `src/components/ui/` — home for all new primitives
- Settings page — where theme toggle will connect to existing ThemeProvider
- StatusBadge refactor must maintain existing API (OrderStatus → badge)

</code_context>

<specifics>
## Specific Ideas

- Button sizes: sm (compact padding), md (default), lg (prominent actions)
- Input error icon: use lucide-react AlertCircle or similar, positioned inside input on right
- Card should support optional onClick for clickable cards (like KPI cards)
- Consider adding loading state to Button component (spinner + disabled)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-Component Library*
*Context gathered: 2026-05-07*
