# Feature Landscape: Design System & Theming

**Domain:** React/Tailwind Design System for Enterprise Dashboard
**Researched:** 2026-05-07
**Overall confidence:** HIGH

## Table Stakes

Features users expect in a modern React/Tailwind design system. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Design Tokens (Colors)** | Single source of truth for colors eliminates hardcoded hex values, enables theming | Low | Already partially implemented in globals.css; needs light/dark variants |
| **Design Tokens (Typography)** | Consistent font sizes, weights, line heights across app; type scale prevents arbitrary sizing | Low | Base size + scale multiplier pattern; ensure line-height multiples of 4px for baseline grid |
| **Design Tokens (Spacing)** | 8pt grid system is industry standard; ensures consistent margins/padding, clean visual rhythm | Low | Use multiples of 8 (8px, 16px, 24, 32); 4px sub-grid for fine adjustments |
| **Design Tokens (Borders/Shadows)** | Consistent elevation system; prevents arbitrary shadow values | Low | Already have --shadow-sm, --shadow-card; expand elevation scale (0-5) |
| **Button Component** | Most fundamental interactive element; needs variants (primary/secondary/ghost/destructive) and states (hover/active/focus/disabled/loading) | Low-Med | Define 6 states per variant; use CVA for variant management |
| **Input Components** | Text, number, select, textarea; validation states (error/success); consistent focus styles | Medium | WCAG 2.1 AA requires visible focus indicators; error state must meet 4.5:1 contrast |
| **Status Badge** | Already exists; needs variant system integration and consistent token usage | Low | Refactor existing StatusBadge to use design tokens |
| **Card/Panel Components** | Container components for content grouping; existing cards need unification | Low | Already have card patterns; standardize padding, borders, shadows |
| **Table Component** | Data display foundation; sortable headers, row states (hover/selected), loading skeleton | Medium | OrdersTable exists; extract reusable table primitives |
| **Light/Dark Theme** | User expectation for dashboard apps; CSS variables + data-theme attribute pattern | Medium | `:root` for light, `[data-theme="dark"]` for dark; semantic tokens (bg-surface vs bg-white) |
| **Accessible Focus Management** | WCAG 2.1 AA requirement; keyboard navigation, visible focus indicators, logical tab order | Medium | Test with Axe-core; automated testing catches 57% of issues; manual screen reader testing required |
| **Component Documentation** | Each component needs usage guidelines, variants, do's/don'ts, code examples | Low | Essential for team adoption; prevents misuse; documents behavior |
| **Semantic Color System** | Colors named by function (bg-surface, text-primary) not appearance (bg-white, text-gray) | Low | Critical for theming; consumers use semantic tokens, not raw values |

## Differentiators

Features that set design system apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Tailwind v4 @theme Integration** | CSS-first design tokens; no tailwind.config.js; tokens become utilities automatically | Low | Current globals.css already uses @theme inline; expand for full token system |
| **CVA (Class Variance Authority)** | Type-safe variant management; compound variants; cleaner than conditional className strings | Low-Med | Enables consistent variants across all components; shadcn/ui pattern |
| **Component Composition (Compound Pattern)** | Flexible primitives (e.g., Table, Table.Header, Table.Row) instead of monolithic props | Medium | Radix UI pattern; better DX for complex components |
| **Timeline Component Library** | Already have ActivityTimeline; extract as reusable primitive for other use cases | Low | Existing implementation tested (10+ tests); document as reusable pattern |
| **Bin Gauge Visualization** | Domain-specific data visualization primitive; reusable for other vertical tank displays | Low | Existing BinGauge tested (6 tests); useful for inventory/level indicators |
| **Storybook Integration** | Interactive component documentation; visual regression testing; isolated development | High | Not required for v1.3 but high value; automated a11y testing via Storybook addon |
| **Design File Parity** | Pencil.dev designs match code implementation exactly; single source of truth | Medium | Already established pattern; maintain in design hardening milestone |
| **Incremental Migration Strategy** | Strangler Fig pattern: new features use system, migrate legacy on touch | Low | Avoids big-bang rewrite; operational continuity; reduces risk |
| **TypeScript Variant Types** | Auto-generated TypeScript types for all component variants from CVA definitions | Low | Improves DX; catches variant errors at compile time |
| **Design Token Documentation** | Token usage examples; when to use each semantic token; migration guide from hardcoded values | Low | Reduces adoption friction; prevents incorrect token usage |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Over-abstracted Components** | God components with 50+ props become maintenance nightmares; violates single responsibility | Use composition patterns; multiple small components over one giant component |
| **@apply Directive Overuse** | Defeats utility-first purpose; creates CSS bloat; loses Tailwind benefits | Use CVA or component abstractions; @apply only for truly reusable patterns |
| **Non-semantic Token Names** | --color-blue-500 breaks when theme changes; tightly couples design to implementation | Use --color-primary, --bg-surface, --text-muted; function over appearance |
| **Big-Bang Design System Rewrite** | Risks collapse; introduces bugs; disrupts operations; often fails | Incremental migration: new features use system, refactor legacy on touch |
| **Pixel-Perfect Spacing** | Arbitrary values (13px, 27px) break visual rhythm; hard to maintain | Stick to 8pt grid system (8, 16, 24, 32); 4px for fine adjustments only |
| **Copy-Paste Component Library** | Duplicated code across components; no single source of truth; inconsistent updates | Centralized component library; import from shared location |
| **Magic Pushbutton UI** | Business logic in interface code; no abstraction; hard to test | Separate concerns; components consume services/hooks, don't contain business logic |
| **Framework-Specific Design Tokens** | Tokens defined in JS (tailwind.config.js) lock you into build tools | CSS-first tokens (@theme in Tailwind v4); portable across tools |
| **Theme-Unaware Hardcoded Values** | Hardcoded colors break dark mode; forces manual updates everywhere | Use CSS variables that change with theme; semantic token system |
| **Variants for Every Edge Case** | 100+ variants create unmanageable complexity; decision paralysis | Core variants only (3-5 per component); use composition for edge cases |
| **Undocumented Component Behavior** | Teams misuse components; creates support burden; inconsistent implementation | Documentation is table stakes; do's/don'ts prevent common mistakes |

## Feature Dependencies

```
Design Tokens → All Components (tokens must exist first)
Semantic Color System → Light/Dark Theme (semantic names enable theme switching)
Button Variants (CVA) → Other Component Variants (establishes pattern)
Accessible Focus → All Interactive Components (foundation for keyboard nav)
Card Component → Table, Timeline, Forms (container primitive)
Component Documentation → Team Adoption (can't adopt what you don't understand)

Light/Dark Theme requires:
  ├─ Semantic Color System (bg-surface not bg-white)
  ├─ CSS Variables in :root and [data-theme="dark"]
  └─ Token migration (eliminate hardcoded hex values)

Component Library requires:
  ├─ Design Tokens (foundation)
  ├─ CVA Setup (variant management)
  └─ TypeScript Types (DX)
```

## MVP Recommendation

**Phase 1: Foundation (Must Have First)**
1. **Design Token System** — Audit globals.css, expand tokens, add semantic naming
2. **Light/Dark Theme Infrastructure** — :root + [data-theme="dark"], semantic color system
3. **CVA Setup** — Install class-variance-authority, establish variant pattern
4. **Button Component** — First component with full variant system (reference implementation)

**Phase 2: Core Components (High Usage)**
5. **Input Components** — Form inputs with validation states, accessibility
6. **Card/Panel Unification** — Standardize existing card patterns
7. **Status Badge Refactor** — Migrate to design tokens
8. **Table Component** — Extract reusable primitives from OrdersTable

**Phase 3: Migration (Incremental)**
9. **Page-by-Page Refactor** — Orders page → Mill Production → Customers → Settings
10. **Component Documentation** — Usage guidelines, variants, examples

**Defer:**
- **Storybook Integration** — High value but not blocking; add in future milestone
- **Advanced Timeline Primitives** — ActivityTimeline works; generalize when second use case emerges
- **Visual Regression Testing** — Important for scale but overkill for v1.3

**Don't Build:**
- Custom form validation library (use existing like react-hook-form + zod)
- Animation system (Tailwind's built-in transitions sufficient)
- Icon library (use existing like heroicons or lucide-react)

## Complexity Analysis

| Feature | Time Estimate | Risk Level | Blockers |
|---------|---------------|------------|----------|
| Design Token Audit | 2-4 hours | Low | None |
| Light/Dark Theme | 4-8 hours | Medium | Requires semantic token migration |
| CVA Setup + Button | 4-6 hours | Low | None |
| Input Components | 6-10 hours | Medium | Accessibility testing required |
| Card Unification | 2-4 hours | Low | May reveal inconsistencies |
| Table Extraction | 6-8 hours | Medium | Existing OrdersTable tightly coupled |
| Page Migration | 4-6 hours/page | Medium | Must not break existing functionality |

**Total MVP Estimate:** 28-46 hours (3.5-6 days)

## Dependencies on Existing Tailwind Setup

| Dependency | Current State | Required Changes |
|------------|---------------|------------------|
| **Tailwind v4** | Installed (Next.js 15 uses v4) | Already using @theme inline; expand token definitions |
| **globals.css** | Basic tokens exist (colors, shadows, radii) | Add typography scale, spacing system, semantic tokens |
| **@theme inline** | Present but limited | Expand to full token system with proper naming |
| **CSS Variables** | Used in :root | Add [data-theme="dark"] variants |
| **Existing Components** | StatusBadge, FilterPill use tokens partially | Refactor to use semantic tokens consistently |

## Migration Strategy

**Incremental Adoption (Strangler Fig Pattern):**

1. **New Features Use System** — All new components built with design system from day one
2. **Touch Legacy = Migrate** — When editing existing component, refactor to use design tokens
3. **Page-Level Migration** — Migrate complete pages rather than scattered components
4. **Shared Components First** — Button, Input, Card have widest impact; migrate early

**Risk Mitigation:**
- Existing tests prevent regressions (104 tests currently passing)
- TDD for new components (establish tests before refactoring)
- Design file parity ensures visual consistency maintained
- Theme switcher can default to light (dark mode = progressive enhancement)

## Sources

**Design System Patterns:**
- [Managing Global Styles in React with Design Tokens](https://www.uxpin.com/studio/blog/managing-global-styles-in-react-with-design-tokens/)
- [How we Use Design Tokens in React](https://blog.bitsrc.io/how-we-use-design-tokens-in-react-5396dd897ace)
- [Implementing Your Design System in React: Best Practices and Patterns](https://www.mindfulchase.com/deep-dives/design-system-framework/implementing-your-design-system-in-react-best-practices-and-patterns.html)

**Tailwind CSS Architecture:**
- [Tailwind CSS Best Practices & Design System Patterns](https://dev.to/frontendtoolstech/tailwind-css-best-practices-design-system-patterns-54pi)
- [Scaling a design system with Tailwind CSS](https://nearform.com/digital-community/scaling-a-design-system-with-tailwind-css/)
- [Tailwind CSS Patterns That Scale: CVA, Design Tokens, Dark Mode](https://dev.to/whoffagents/tailwind-css-patterns-that-scale-cva-design-tokens-dark-mode-and-component-architecture-25d4)

**Essential Components:**
- [UI Component Library Checklist: Essential Elements](https://www.uxpin.com/studio/blog/ui-component-library-checklist-essential-elements/)
- [Component checklist – Carbon Design System](https://carbondesignsystem.com/contributing/component-checklist/)
- [10 Essential Design System Components Every Team Needs](https://www.uxpin.com/studio/blog/design-system-components/)

**Tailwind v4 Design Tokens:**
- [Tailwind CSS v4.0 - Official Documentation](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)
- [Design Tokens That Scale in 2026 (Tailwind v4 + CSS Variables)](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
- [Theme variables - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/theme)

**Component Architecture:**
- [shadcn/ui - The Foundation for your Design System](https://ui.shadcn.com/)
- [Radix UI vs. ShadCN: Key Differences Explained](https://www.swhabitation.com/blogs/what-is-the-difference-between-radix-ui-and-shadcn)
- [Class Variance Authority](https://cva.style/docs)
- [React Component Reusability: Class Variance Authority (CVA)](https://medium.com/@tushar_chavan/react-component-reusability-class-variance-authority-cva-5e7e98d61194)

**Variants & States:**
- [How to use component variants to scale your design system](https://penpot.app/blog/how-to-use-component-variants-to-scale-your-design-system/)
- [Component Variants in Design Systems: Naming, Organization, and Scale](https://www.thesigma.co/journal/component-variants-design-system)
- [Design system best practices: Components and documentation](https://www.designsystemscollective.com/design-system-best-practices-components-and-documentation-bdb020e02172)

**Theming & Dark Mode:**
- [Adding Dark Mode via CSS Variables](https://www.magicpatterns.com/blog/implementing-dark-mode)
- [Dark Mode and CSS Variables](https://betterprogramming.pub/dark-mode-and-css-variables-ed6dc250232c)
- [Dark Mode Design Systems: A Complete Guide to Patterns, Tokens, and Hierarchy](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/)
- [Dark mode - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/dark-mode)

**Typography & Spacing:**
- [Spacing, grids, and layouts](https://www.designsystems.com/space-grids-and-layouts/)
- [Design Systems Typography Guide](https://www.designsystems.com/typography-guides/)
- [Spacing best practices (8pt grid system)](https://cieden.com/book/sub-atomic/spacing/spacing-best-practices)
- [Carbon Design System - Spacing](https://carbondesignsystem.com/elements/spacing/overview/)

**Accessibility:**
- [Accessibility tests | Storybook docs](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Open Source Accessible React Component Library: A11Y Pros Design System](https://a11ypros.com/blog/a11y-design-system-open-source)
- [Checklist - The A11Y Project](https://www.a11yproject.com/checklist/)
- [Accessible UI Component Libraries Roundup](https://www.digitala11y.com/accessible-ui-component-libraries-roundup/)

**Migration Strategy:**
- [Incremental migration approaches for legacy applications](https://circleci.com/blog/incremental-migration-approaches-for-legacy-applications/)
- [How Teams Incrementally Modernize Large Frontend Codebases](https://altersquare.io/how-teams-incrementally-modernize-large-frontend-codebases/)
- [How to Implement a Design System: Reasons, Approach, and Migration Path](https://www.designsystemscollective.com/how-to-implement-a-design-system-reasons-approach-and-migration-path-051c41734caf)
- [The "Invisible Rewrite": How Leading Companies Modernize Systems Without Rebuilding Everything](https://www.appstudio.ca/blog/legacy-system-modernization-without-rebuilding/)

**Anti-Patterns:**
- [Anti-patterns You Should Avoid in Your Code](https://www.freecodecamp.org/news/antipatterns-to-avoid-in-code/)
- [10 Most Common Anti-Patterns Every Software Engineer Must Avoid](https://bariscimen.medium.com/10-most-common-anti-patterns-every-software-engineer-must-avoid-182091438c2b)
- [Anti-Patterns In Software Architecture: 5 Common Mistakes And How To Avoid Them](https://www.itar.pro/anti-patterns-in-software-architecture/)
