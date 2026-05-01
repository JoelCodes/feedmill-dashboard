# Phase 9: Polish - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the mill production view to match .pen design specifications. Replace hardcoded hex colors with design tokens, add custom typography tokens, and ensure visual consistency using the design system.

</domain>

<decisions>
## Implementation Decisions

### Design Tokens — Colors
- **D-01:** Extend globals.css with new status-specific tokens — do NOT use hardcoded hex colors anywhere
- **D-02:** Use status-role naming pattern: `--status-{status}-{role}` (e.g., `--status-completed-border`, `--status-mixing-header`)
- **D-03:** Add tokens for all STATE_COLORS values currently using hex:
  - Completed: border (#38a169), header (#276749)
  - Mixing: border (#d69e2e), header (#975a16)
  - Blocked: border (#e53e3e), header (#c53030)
  - Pending: border (#a0aec0), header (#4a5568)
- **D-04:** Add 22% opacity variants for countBg: `--status-{status}-bg-22`

### Design Tokens — Typography
- **D-05:** Add custom text size tokens to @theme for non-standard sizes:
  - `--text-11` or `text-card-label` for 11px
  - `--text-15` or `text-card-title` for 15px
- **D-06:** Use Tailwind @theme extension pattern, consistent with existing token definitions

### Shadows
- **D-07:** Use existing `--shadow-card` token for ProductionCard instead of inline boxShadow
- **D-08:** Remove inline `style={{ boxShadow: ... }}` and replace with Tailwind class

### Spacing
- **D-09:** Trust current spacing implementation — no changes needed to gap/padding/margin values

### Text Colors
- **D-10:** Replace hardcoded text colors (#718096, #2d3748, #4a5568) with design tokens
- **D-11:** Map to existing or new tokens: `--text-secondary` (#718096), `--text-primary` (#2d3748)

### Claude's Discretion
- Exact naming for typography tokens (text-card-label vs text-11)
- How to structure @theme extensions for new tokens
- Whether to add missing text color tokens or map to closest existing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `src/app/globals.css` — Current design tokens (extend this file)
- `designs/mill-production.pen` — Visual reference for target design

### Prior Context
- `.planning/phases/06-design/06-CONTEXT.md` — D-05, D-06 color mapping decisions
- `.planning/phases/08-filter-implementation/08-CONTEXT.md` — Filter pill implementation context

### Requirements
- `.planning/REQUIREMENTS.md` — POLSH-01, POLSH-02, POLSH-03 requirements

### Implementation Reference
- `src/app/mill-production/page.tsx` — Current implementation with hardcoded values to replace

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `globals.css` @theme inline block — pattern for adding new Tailwind theme tokens
- Existing status tokens (--success, --error, --warning, --pending) — base for new variants

### Established Patterns
- CSS custom properties in :root, then mapped to Tailwind via @theme inline
- Status color configs defined as Record<StatusType, ColorConfig>
- Tailwind arbitrary value syntax `text-[var(--token)]` for CSS variable usage

### Integration Points
- STATE_COLORS in mill-production/page.tsx — replace hex values with CSS variables
- PRODUCTION_STATE_PILL_CONFIG — update countBg to use new tokens
- ProductionCard component — replace inline style with shadow class

</code_context>

<specifics>
## Specific Ideas

- Pattern from Phase 6 context: Completed = green, Blocked = red, Mixing = yellow/amber, Pending = gray
- Status order matches STATE_ORDER constant: Completed, Mixing, Blocked, Pending
- Maintain exact visual appearance — just replace implementation with tokens

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 9-Polish*
*Context gathered: 2026-04-29*
