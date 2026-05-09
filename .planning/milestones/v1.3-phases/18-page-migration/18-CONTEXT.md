# Phase 18: Page Migration - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase migrates all existing pages to the design system established in Phases 16-17. Deliverables: Orders page, Customers page, Mill Production page, and Settings page all using design system tokens and components exclusively. Additionally, FilterPill, BinGauge, and ActivityTimeline are extracted to `ui/` as design system primitives. Zero hardcoded color or spacing values remain after migration.

</domain>

<decisions>
## Implementation Decisions

### Migration Order
- **D-01:** Start with Settings page (simplest) to validate the migration pattern works before tackling complex pages.
- **D-02:** Migration sequence after Settings: Mill Production → Orders → Customers. Increasing complexity — Mill Production validates patterns, Orders is the main feature, Customers benefits from all learnings.

### Hardcoded Value Handling
- **D-03:** Use ESLint errors to find hardcoded values. Run ESLint on each file — it already blocks hardcoded hex/#xxx and px values, showing exact locations to fix.
- **D-04:** Create a direct mapping table upfront (first plan) documenting hardcoded value → token mappings: #2A9D90 → --primary, #10B981 → --success, 16px → --space-4, etc. Subsequent plans reference this table.

### Component Consolidation
- **D-05:** Move FilterPill to `src/components/ui/` as official design system component. Update imports in Orders and Mill Production pages.
- **D-06:** Header and Sidebar stay in `components/`, upgraded in place to use tokens and design system Button/Input where applicable. They're app-specific layout components, not primitives.
- **D-07:** Refactor KPICard to use Card compound component: `<Card onClick=...><Card.Content>icon + stats</Card.Content></Card>`. Consistent with design system.
- **D-08:** Extract BinGauge to `ui/` as generic Gauge component, extract ActivityTimeline to `ui/` as generic Timeline component. Both have reuse potential beyond customer pages.

### Testing Approach
- **D-09:** Run existing test suite after migrating each component. Catches regressions immediately, fast feedback from ~104 tests.
- **D-10:** Add token usage tests (like StatusBadge.test.tsx pattern) for migrated components. Ensures tokens are actually used, not just renamed.

### Claude's Discretion
- None — user provided explicit choices for all areas.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundation (Phase 16-17 outputs)
- `.planning/phases/16-foundation-design-system-setup/16-CONTEXT.md` — Token architecture decisions, dark mode approach
- `.planning/phases/17-component-library/17-CONTEXT.md` — Component decisions: Button variants, Card compound pattern, form validation UI
- `src/app/globals.css` — Complete token definitions including interactive states and spacing scale

### Design System Components
- `src/components/ui/Button.tsx` — CVA variants (primary/secondary/ghost/destructive), sizes (sm/md/lg)
- `src/components/ui/Card.tsx` — Compound pattern: Card.Header, Card.Content, Card.Footer
- `src/components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx` — Form inputs with validation states
- `src/components/ui/StatusBadge.tsx` — Refactored badge using design tokens (reference for token usage pattern)
- `src/lib/utils.ts` — cn() utility for className composition with CVA

### Requirements
- `.planning/REQUIREMENTS.md` — Migration requirements MIG-01 through MIG-05

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Component naming, file organization, styling conventions
- `.planning/codebase/STRUCTURE.md` — Where to add new components

### Pages to Migrate
- `src/app/settings/page.tsx` — Settings page (simplest, first)
- `src/app/mill-production/page.tsx` — Mill Production page (medium)
- `src/app/orders/page.tsx` + `src/components/OrdersTable.tsx` + `src/components/OrderDetails.tsx` — Orders (complex)
- `src/app/customers/page.tsx` + customer components — Customers (final)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` directory with 8 design system components (Button, Card, Input, Select, Textarea, ThemeToggle, StatusBadge, skeletons)
- `cn()` utility in `src/lib/utils.ts` — ready for CVA variant composition
- Interactive state tokens (--primary-hover, --error-active, etc.) — defined in globals.css
- `ThemeProvider` component — already wraps the app, provides useTheme() hook

### Established Patterns
- Two-tier token naming: primitives in :root, semantic aliases in @theme inline
- Dark mode via .dark class with CSS variable overrides
- Components use `bg-[var(--token)]` syntax for Tailwind + CSS variables
- TDD pattern with .test.tsx files adjacent to components

### Integration Points
- `src/components/ui/` — home for FilterPill, Gauge, Timeline extractions
- Settings page — already has ThemeProvider, just needs design system components
- All pages — need hardcoded hex/px values replaced with tokens

</code_context>

<specifics>
## Specific Ideas

- StatusBadge.test.tsx pattern: tests should verify token CSS variables are used (e.g., `expect(container.style).toContain('--')`)
- Mapping table should cover all existing hex colors (#2A9D90, #10B981, #EF4444, etc.) and common spacing (16px, 24px, 32px, etc.)
- Gauge component should be generic enough for other metrics (not just bin fill levels)
- Timeline component should support different event types via render prop or slot pattern

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-Page Migration*
*Context gathered: 2026-05-07*
