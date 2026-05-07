# Project Research Summary

**Project:** CGM Dashboard v1.3 - Design System & Theming
**Domain:** React/Tailwind Design System for Enterprise Dashboard
**Researched:** 2026-05-07
**Confidence:** HIGH

## Executive Summary

This research covers adding a design system foundation to an existing Next.js 15/React 19/Tailwind CSS 4 dashboard application (6,426 LOC) that already has partial design tokens and UI components. The goal is to establish systematic theming (light/dark mode), unify component patterns, and create a maintainable foundation for future development.

The recommended approach is incremental migration using the Strangler Fig pattern: establish a CSS-first token system with Tailwind v4's `@theme` directive, implement type-safe component variants using Class Variance Authority (CVA), and add theme switching via `next-themes`. The key insight from research is that design systems fail most often during the "last 20%" of migration when enforcement weakens—success requires strict ESLint rules, page-level migration tracking, and ruthless deprecation of old patterns.

The primary risks are token naming inconsistency (preventing dark mode), premature component abstraction (creating inflexible APIs), and incomplete migration (maintaining two parallel systems indefinitely). Mitigation strategies include: establishing semantic token naming from day one, building only essential components (Button, Input, Card, Badge) in v1.3, and enforcing migration page-by-page with ESLint rules that block hardcoded values.

## Key Findings

### Recommended Stack

The research identified a minimal but complete stack for design system foundation. Current project already has Tailwind CSS 4, which provides CSS-first design tokens via the `@theme` directive—no additional build tools needed. The key additions are focused on theming infrastructure and type-safe variant management.

**Core technologies:**
- **next-themes (^0.4.6)**: Theme management and persistence — Industry standard for Next.js dark mode with zero-flash SSR-safe switching, 2,900+ GitHub stars, actively maintained
- **class-variance-authority (^0.7.1)**: Type-safe component variants — TypeScript-first utility for variant-based components, framework-agnostic, battle-tested pattern used by shadcn/ui
- **tailwind-merge (^3.5.0)**: Class conflict resolution — Intelligently merges Tailwind classes with automatic conflict handling, essential for components accepting className props
- **clsx (^2.1.1)**: Conditional class names — Lightweight (228 bytes) utility for conditional className logic, perfect companion to tailwind-merge
- **tw-animate-css (^1.4.0)**: Tailwind v4 animations — Modern replacement for tailwindcss-animate, pure CSS solution compatible with Tailwind v4's architecture

**Radix UI primitives (as-needed only):**
- Install selectively when building specific components (Dialog, DropdownMenu, Select, Tooltip)
- Each primitive is 10-20KB, so selective installation keeps bundle size down
- Current recommendation: Start without any Radix primitives, add for specific use cases as they arise

**Notable alternatives rejected:**
- shadcn/ui: Excellent but overkill for this stage, requires CLI workflow and components.json config
- tailwind-variants: Adds 10KB for responsive variants/slots that aren't needed (CVA at 2KB is sufficient)
- Style Dictionary: Adds build complexity; existing CSS variables already serve as design tokens
- CSS-in-JS libraries: Conflicts with Tailwind's utility-first approach

### Expected Features

Research identified three tiers of features for a modern React/Tailwind design system. The CGM Dashboard already has partial implementations (globals.css with design tokens, StatusBadge component, card patterns) that need systematization rather than full rewrites.

**Must have (table stakes):**
- Design Tokens (Colors/Typography/Spacing/Shadows) — Single source of truth eliminates hardcoded values, enables theming
- Light/Dark Theme — User expectation for dashboard apps; CSS variables + data-theme attribute pattern
- Button Component — Fundamental interactive element with variants (primary/secondary/ghost/destructive) and states
- Input Components — Text, number, select, textarea with validation states meeting WCAG 2.1 AA
- Status Badge — Already exists, needs variant system integration
- Card/Panel Components — Already have card patterns, need unification
- Table Component — OrdersTable exists, extract reusable primitives
- Accessible Focus Management — WCAG 2.1 AA requirement, keyboard navigation, visible focus indicators
- Semantic Color System — Colors named by function (bg-surface, text-primary) not appearance (bg-white)

**Should have (differentiators):**
- Tailwind v4 @theme Integration — CSS-first tokens become utilities automatically, no tailwind.config.js
- CVA (Class Variance Authority) — Type-safe variant management with compound variants
- Component Composition (Compound Pattern) — Flexible primitives (Table.Header, Table.Row) vs monolithic props
- Timeline Component Library — Already have ActivityTimeline; extract as reusable primitive
- Bin Gauge Visualization — Domain-specific primitive already tested; useful for inventory displays
- Incremental Migration Strategy — Strangler Fig pattern avoids big-bang rewrite
- Design Token Documentation — Token usage examples prevent misuse

**Defer (v2+):**
- Storybook Integration — High value but not blocking; add in future milestone
- Advanced Timeline Primitives — ActivityTimeline works; generalize when second use case emerges
- Visual Regression Testing — Important for scale but overkill for v1.3

**Explicitly don't build (anti-features):**
- Over-abstracted Components — God components with 50+ props create maintenance nightmares
- @apply Directive Overuse — Defeats utility-first purpose, creates CSS bloat
- Big-Bang Design System Rewrite — High risk of collapse; use incremental migration instead
- Framework-Specific Tokens — CSS-first tokens are portable across tools
- Variants for Every Edge Case — 100+ variants create unmanageable complexity; use composition

### Architecture Approach

The recommended architecture uses three layers: Design System Foundation (tokens, theme, utilities), Component Library (primitives, composites, patterns), and Application Pages. The design system foundation centralizes all design concerns (tokens, theme config, variant utilities) in a dedicated folder structure, making it easy to extract into a separate package later if needed.

**Major components:**
1. **Design System Layer** — CSS tokens (@theme), theme management (ThemeProvider), variant utilities (CVA/cn) — Foundation that all components consume
2. **Primitives Layer** — Atomic components (Button, Input, Badge, Typography) with CVA variants — Pure presentation, no business logic, folder-per-component structure
3. **Composites Layer** — Molecules combining primitives (Card, Panel, FilterPill, FormField, Table) — More complex but still generic, compound component pattern for flexibility
4. **Patterns Layer** — Page-level components (KPICard, OrdersTable, CustomerDetailHeader, ActivityTimeline, Sidebar) — Domain-specific with business logic, consume primitives/composites
5. **Theme Infrastructure** — Light/dark modes via CSS variable overrides on [data-theme] attribute — Uses next-themes for SSR-safe switching, semantic tokens enable theming without code changes

**Key architectural patterns:**
- **Tailwind v4 @theme with CSS Variables**: Define tokens as CSS custom properties that auto-generate utilities AND expose runtime variables
- **Semantic Theming**: Two-tier system (primitives → semantic tokens), theme variants override semantic tokens only
- **CVA for Component Variants**: Type-safe variant composition with defaults and compound variants
- **Strangler Fig Migration**: Build new primitives alongside old code, migrate page-by-page, maintain adapter pattern during transition
- **Compound Components**: Export subcomponents for flexibility (Card.Header, Card.Content, Card.Footer)
- **Server/Client Split**: Keep primitives as client components but allow server-rendered children via React.ReactNode

**File structure recommendation:**
```
src/
├── design-system/          # NEW: Foundation
│   ├── tokens/            # Design token CSS files
│   ├── theme/             # ThemeProvider, themes.css
│   └── utils/             # cn(), variant helpers
├── components/
│   ├── primitives/        # Atomic (Button, Input, Badge)
│   ├── composites/        # Molecules (Card, FilterPill, Table)
│   └── patterns/          # Page-level (KPICard, OrdersTable)
└── app/                   # Next.js pages (unchanged)
```

### Critical Pitfalls

Research identified 10 major pitfalls, with 5 directly applicable to the CGM Dashboard migration. The most dangerous is the "Last 20% Migration Trap" where teams successfully migrate 80% but abandon the final 20%, resulting in two parallel systems requiring indefinite maintenance.

1. **Last 20% Migration Trap** — Final 20% of migration takes 80% of effort and gets abandoned. Create ESLint backstops, make migration blocking for new features, allocate 30% sprint capacity, remove deprecated components entirely once alternatives exist.

2. **Token Naming Disaster** — Poor token names (--blue-500) make dark mode impossible. Use two-tier system: primitives (--color-blue-600) → semantic (--color-primary). Component code only references semantic tokens. Theme variants override semantic tokens, never primitives.

3. **Inconsistent Half-Migration** — Half the codebase uses tokens, half uses hardcoded values. Dark mode works on some pages only. Migrate page-by-page (not component-by-component), add ESLint rules blocking hardcoded colors/spacing, track migration by route in dashboard.

4. **Tailwind @apply Overuse** — Using @apply recreates CSS maintenance problems Tailwind solves. Never use @apply in component code; extract React components instead. Long className strings are fine. Official Tailwind docs warn against this anti-pattern.

5. **Flash of Incorrect Theme (FOIT)** — Users see light theme flash before switching to dark on page load. Use next-themes which handles SSR correctly, store theme in cookie for SSR access, block render with script in <head> reading localStorage before hydration.

**Additional pitfalls to monitor:**
- Premature Component Abstraction — Don't create shared components until pattern appears 3+ times; duplication is cheaper than wrong abstraction
- No Deprecation Strategy — Old components accumulate (Button, ButtonV2, PrimaryButton); mark deprecated immediately with console warnings and ESLint errors
- Design-Code Drift — Figma/Pencil designs diverge from code; establish tokens as sync point, require design approval for component PRs
- Missing Component Composition — Components don't compose well; use compound component pattern (Select.Option, Card.Header)
- Overbuilding Before Validation — Building 50 components when only 10 are used; start with 5-10 most-used components, ship incrementally based on demand

## Implications for Roadmap

Based on research, the migration requires careful sequencing to establish foundation before building components, and page-level migration to ensure completion. The research strongly recommends 4 phases with strict enforcement mechanisms.

### Phase 1: Foundation & Token Audit
**Rationale:** Design tokens must exist before components can consume them. Semantic token naming must be established before any migration to prevent costly refactoring later. Research shows token naming mistakes are the hardest pitfall to recover from (HIGH cost).

**Delivers:**
- Expanded globals.css with full semantic token system (colors, typography, spacing, shadows)
- Light/dark theme CSS variables (:root and [data-theme="dark"])
- CVA setup and cn() utility function
- ThemeProvider integration in layout.tsx
- ESLint rules preventing hardcoded values
- Deprecation policy and enforcement mechanisms
- Token naming convention documentation

**Addresses (from FEATURES.md):**
- Design Tokens (Colors/Typography/Spacing/Shadows)
- Semantic Color System
- Light/Dark Theme infrastructure

**Avoids (from PITFALLS.md):**
- Token Naming Disaster (Pitfall 2) — Establish semantic naming before migration
- No Deprecation Strategy (Pitfall 9) — Define policy from day one
- Design-Code Drift (Pitfall 8) — Establish tokens as sync point

**Research flag:** Standard pattern, skip phase research. Tailwind v4 @theme and next-themes patterns are well-documented.

### Phase 2: Component Library Foundation
**Rationale:** Build only essential primitives (Button, Input, Card, Badge) to validate design system patterns before expanding. Research warns against overbuilding—start with 5-10 most-used components, ship incrementally. This phase establishes reuse patterns for Phase 3 migration.

**Delivers:**
- Button component with CVA variants (primary/secondary/ghost/destructive)
- Input components (text, number, select, textarea) with validation states
- Card/Panel component with compound pattern (Card.Header, Card.Content, Card.Footer)
- Badge component (refactor existing StatusBadge to use primitives)
- Theme toggle UI component
- Component documentation (usage guidelines, variants)

**Addresses (from FEATURES.md):**
- Button Component (table stakes)
- Input Components (table stakes)
- Card/Panel Components (table stakes)
- Status Badge (table stakes)
- CVA variant management (differentiator)
- Component Composition (differentiator)

**Uses (from STACK.md):**
- class-variance-authority for variants
- tailwind-merge and clsx for className composition
- tw-animate-css for transitions

**Avoids (from PITFALLS.md):**
- Premature Component Abstraction (Pitfall 2) — Build only 4-5 primitives, defer complex components
- Tailwind @apply Overuse (Pitfall 5) — Establish React components as reuse mechanism
- Missing Component Composition (Pitfall 6) — Design composable APIs from start
- Flash of Incorrect Theme (Pitfall 7) — Implement next-themes correctly for SSR
- Overbuilding Before Validation (Pitfall 10) — Ship 4-5 components in v1.3, expand in v1.4+ based on demand

**Research flag:** Standard pattern, skip phase research. CVA and compound component patterns are well-established.

### Phase 3: Page-Level Migration
**Rationale:** Migrate complete pages rather than scattered components to avoid incomplete migration trap. Research shows wave-based migration (entire features/pages atomically) is critical to completion. Orders page is good starting point (has OrdersTable, StatusBadge, cards).

**Delivers:**
- Orders page migrated to design system
- Customers page migrated to design system
- Settings page migrated (likely has theme toggle)
- Table component extracted from OrdersTable
- FilterPill migrated to design system tokens
- KPICard migrated to Card primitive
- All hardcoded values eliminated from migrated pages

**Addresses (from FEATURES.md):**
- Table Component extraction (table stakes)
- Page-by-page migration (differentiator)
- FilterPill migration (existing component)

**Avoids (from PITFALLS.md):**
- Last 20% Migration Trap (Pitfall 1) — Page-level migration prevents scattered incomplete work
- Inconsistent Half-Migration (Pitfall 4) — Enforce complete migration per page via ESLint and PR checklist

**Research flag:** Standard pattern, skip phase research. Table extraction and page migration patterns are straightforward.

### Phase 4: Refinement & Documentation
**Rationale:** After core migration, address polish items and create adoption documentation. This phase ensures the design system is maintainable and usable by future developers.

**Delivers:**
- Component documentation in Storybook or similar
- Migration guide for remaining components
- Token usage guidelines
- Accessibility audit of all components
- Visual regression test setup (if budget allows)
- Remove deprecated components entirely
- Design-code parity verification

**Addresses (from FEATURES.md):**
- Component Documentation (table stakes)
- Design Token Documentation (differentiator)
- Accessible Focus Management (table stakes)

**Avoids (from PITFALLS.md):**
- Design-Code Drift (Pitfall 8) — Verify Figma/Pencil designs match code
- Last 20% Migration Trap (Pitfall 1) — Delete deprecated components to force completion

**Research flag:** Documentation patterns are standard, but accessibility audit may need specific WCAG guidance.

### Phase Ordering Rationale

- **Foundation must come first**: Design tokens are dependency for all other work. Research shows token naming mistakes are hardest to recover from (HIGH cost in PITFALLS.md recovery table).

- **Primitives before migration**: Can't migrate pages without replacement components. Building 4-5 core primitives validates design system patterns before committing to full migration.

- **Page-level not component-level migration**: Research strongly recommends wave-based migration (entire pages atomically) to avoid incomplete migration trap. Prevents the "80% done, never finishes" scenario.

- **Documentation after implementation**: Can't document patterns until they're validated with real usage. Research warns against premature documentation of unproven patterns.

**Dependency chain:**
```
Phase 1 (Tokens) → Phase 2 (Primitives) → Phase 3 (Migration) → Phase 4 (Documentation)
                                                ↓
                                        Avoids Pitfall 1 (Last 20% Trap)
                                        Avoids Pitfall 4 (Inconsistent Migration)
```

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Tailwind v4 @theme, next-themes, and CVA patterns are well-documented with official docs and Context7 verification
- **Phase 2 (Primitives)**: CVA variant patterns and compound component architecture have extensive examples in shadcn/ui and Radix UI docs
- **Phase 3 (Migration)**: Page-level migration patterns are straightforward React refactoring; table extraction is standard component decomposition

**Phases needing validation during execution:**
- **Phase 4 (Refinement)**: Accessibility audit may need WCAG 2.1 AA specific guidance for interactive components. Storybook setup has many configuration options that may need research for Next.js 15 App Router compatibility.

**No phases require deep pre-planning research** — all patterns are well-established. However, each phase should begin with quick verification that chosen libraries (next-themes, CVA) are compatible with project's Next.js 15/React 19 versions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official documentation for all recommended libraries (next-themes, CVA, tailwind-merge). Context7 verification of Tailwind v4 patterns. Package versions verified via npm registry (May 2026). |
| Features | HIGH | Multiple authoritative sources on design system components (UXPin, Carbon Design System, Nielsen Norman Group). Clear consensus on table stakes vs differentiators. |
| Architecture | HIGH | Official Next.js docs, Tailwind CSS docs, CVA docs. Atomic Design patterns widely adopted. Strangler Fig migration pattern proven in legacy modernization literature. |
| Pitfalls | HIGH | Multiple case studies of design system failures. Consistent patterns across sources. Pitfall-to-phase mapping derived from migration case studies and best practices. |

**Overall confidence:** HIGH

Research is based on official documentation (Tailwind, Next.js, CVA), Context7-verified libraries, and established design system patterns from authoritative sources (Nielsen Norman Group, Carbon Design System, shadcn/ui). All recommended technologies have 2,000+ GitHub stars and active maintenance. Package versions verified current as of May 2026.

### Gaps to Address

**Token value decisions:** Research provides token structure and naming conventions, but specific token values (color hex codes, spacing scale multipliers, typography scale) must be decided based on existing globals.css and design files. Recommendation: Audit current globals.css tokens, expand to full system, validate against Pencil.dev design files.

**Radix UI primitive selection:** Research recommends installing Radix primitives selectively as needed, but doesn't specify which ones will be needed for CGM Dashboard. Recommendation: Start without any Radix primitives in Phase 2, add specific primitives (likely Dialog, Tooltip) when building features that require them.

**Migration enforcement tooling:** Research recommends ESLint rules to block hardcoded values, but specific ESLint plugin configuration needs definition. Recommendation: Phase 1 should include configuring `eslint-plugin-tailwindcss` and potentially custom rules for semantic token usage.

**Accessibility testing specifics:** Research identifies WCAG 2.1 AA as requirement but doesn't detail specific testing tools or process. Recommendation: Phase 4 should use Axe DevTools for automated testing (catches 57% of issues per research) plus manual screen reader testing with VoiceOver/NVDA.

**Design file sync process:** Research identifies design-code drift as pitfall but doesn't specify workflow for this project's Pencil.dev files. Recommendation: Establish token sync process between Pencil.dev and globals.css in Phase 1, verify parity in Phase 4.

## Sources

### Primary (HIGH confidence)
- Context7: /tailwindlabs/tailwindcss.com — Tailwind v4 @theme documentation, design token patterns
- Context7: /joe-bell/cva — Class Variance Authority API and TypeScript integration
- Context7: /vercel/next.js — Next.js App Router architecture, project structure
- Context7: /reactjs/react.dev — Component composition patterns, anti-patterns
- [next-themes README](https://github.com/pacocoursey/next-themes) — Installation and SSR setup
- [CVA Documentation](https://cva.style/docs) — Variants and TypeScript integration
- [Radix UI Primitives](https://www.radix-ui.com/primitives) — Component primitives overview
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) — Migration patterns

### Secondary (MEDIUM confidence)
- [Design Systems 101 - Nielsen Norman Group](https://www.nngroup.com/articles/design-systems-101/) — Design system best practices
- [Carbon Design System - Component Checklist](https://carbondesignsystem.com/contributing/component-checklist/) — Essential components
- [UXPin - Essential Design System Components](https://www.uxpin.com/studio/blog/design-system-components/) — Component library requirements
- [Atomic Design Methodology - Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/) — Component hierarchy patterns
- [How to Implement a Design System - Design Systems Collective](https://www.designsystemscollective.com/how-to-implement-a-design-system-reasons-approach-and-migration-path-051c41734caf) — Migration strategies
- [Why Most Design Systems Fail - Multiple Sources](https://ui-patterns.com/blog/why-most-design-systems-fail-and-how-to-cultivate-success) — Adoption pitfalls
- [Tailwind CSS Best Practices](https://dev.to/frontendtoolstech/tailwind-css-best-practices-design-system-patterns-54pi) — @apply anti-patterns, component extraction
- [Design Tokens Explained - Contentful](https://www.contentful.com/blog/design-token-system/) — Token architecture

### Tertiary (LOW confidence, needs validation)
- Various Medium articles on CVA vs tailwind-variants comparison — Feature differences need validation with actual benchmarks
- Blog posts on Tailwind v4 migration experiences — May not reflect final v4 release patterns
- Community discussions on design system versioning — Practices vary by organization

---
*Research completed: 2026-05-07*
*Ready for roadmap: yes*
