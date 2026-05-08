# Phase 19: Documentation & Accessibility - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase documents the design system and verifies WCAG 2.1 AA accessibility compliance. Deliverables: Single README.md in src/components/ui/ covering token usage guidelines and all 10 components with usage examples, do/don't patterns, and accessibility notes. Accessibility verification includes automated testing (eslint-plugin-jsx-a11y + axe-core) and manual VoiceOver screen reader audit.

</domain>

<decisions>
## Implementation Decisions

### Documentation Format
- **D-01:** Single README.md file in src/components/ui/ — all documentation in one place.
- **D-02:** All 10 components documented in the same file with ## sections per component.
- **D-03:** Code-only documentation — no screenshots or images. Code snippets stay in sync automatically.

### Token Guidelines
- **D-04:** Quick reference table format — token name → purpose → example. One row per token.
- **D-05:** Tokens section included in the same README as components. Tokens section comes first, then component sections.

### Accessibility Testing
- **D-06:** Combined approach — automated (eslint-plugin-jsx-a11y + axe-core in tests) plus manual screen reader verification.
- **D-07:** VoiceOver (macOS) for manual screen reader testing — built into OS, no extra setup.
- **D-08:** Accessibility notes documented inline per component in README, not a separate report.

### Component Usage Examples
- **D-09:** Code snippets embedded in README per component — matches code-only documentation choice.
- **D-10:** Include brief do/don't patterns (1-2 anti-patterns per component) to prevent common mistakes.

### Claude's Discretion
- None — user provided explicit choices for all areas.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundation (Phase 16-18 outputs)
- `.planning/phases/16-foundation-design-system-setup/16-CONTEXT.md` — Token architecture decisions, two-tier naming
- `.planning/phases/17-component-library/17-CONTEXT.md` — Component decisions: Button variants, Card compound pattern
- `.planning/phases/18-page-migration/18-CONTEXT.md` — Migration patterns, token mapping conventions

### Design System
- `src/app/globals.css` — Complete token definitions (~40 tokens: colors, typography, spacing, shadows)
- `src/components/ui/` — All 10 components to document: Button, Card, Input, Select, Textarea, StatusBadge, FilterPill, Gauge, Timeline, ThemeToggle
- `src/lib/utils.ts` — cn() utility for className composition

### Requirements
- `.planning/REQUIREMENTS.md` — Documentation requirements DOC-01, DOC-02, DOC-03

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, styling conventions
- `.planning/codebase/STRUCTURE.md` — File organization for new docs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 10 design system components in `src/components/ui/` — each needs documentation
- 192 existing tests — test patterns can inform accessibility testing approach
- Existing test files (*.test.tsx) — can add axe-core accessibility checks

### Established Patterns
- Two-tier token naming: primitives in :root, semantic aliases in @theme inline
- CVA variants for component styling (Button, StatusBadge)
- Compound pattern for Card (Card.Header, Card.Content, Card.Footer)
- TDD with adjacent test files

### Integration Points
- `src/components/ui/README.md` — new file to create
- `package.json` — may need eslint-plugin-jsx-a11y, @axe-core/react dependencies
- `eslint.config.mjs` — add jsx-a11y plugin rules

</code_context>

<specifics>
## Specific Ideas

- Token table should cover all ~40 tokens from globals.css with clear purpose and example
- Do/don't patterns should address real anti-patterns: nesting Cards, using wrong Button variant for actions, hardcoded colors instead of tokens
- axe-core can be added to existing test suite — wrap renders in axe() checks
- VoiceOver testing should focus on interactive components: Button, Input, Select, ThemeToggle

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-Documentation & Accessibility*
*Context gathered: 2026-05-08*
