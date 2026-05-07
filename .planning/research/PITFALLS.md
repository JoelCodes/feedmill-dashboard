# Pitfalls Research: Design System Migration

**Domain:** Design system and theming for existing React/Tailwind application
**Researched:** 2026-05-07
**Confidence:** HIGH

**Context:** This research focuses on common mistakes when ADDING a design system to an existing React/Tailwind codebase (6,426 LOC) that already has some design tokens, UI components, and multiple .pen design files.

---

## Critical Pitfalls

### Pitfall 1: The Last 20% Migration Trap

**What goes wrong:**
The final 20% of design system migration takes 80% of the effort and frequently gets abandoned. Teams successfully migrate high-visibility pages but leave niche areas (settings, admin panels, error states) using old patterns indefinitely. This creates two parallel systems that both require maintenance.

**Why it happens:**
Product engineering teams prioritize new features over "cleanup" work. Removing old components feels less important than shipping new functionality to stakeholders. Design system engineers lack familiarity with niche product areas and can't migrate them without product engineering support.

**How to avoid:**
- Create "backstops" to prevent continued use of deprecated components (ESLint rules, PropTypes warnings, console errors)
- Track migration progress with automated tooling (grep for old class patterns, run codemods)
- Make migration blocking: new features cannot merge until their page is migrated
- Allocate 30% of sprint capacity to migration work, not "when we have time"
- Remove deprecated components from the codebase entirely once alternatives exist, even if some references break

**Warning signs:**
- Migration dashboard shows >80% complete for 3+ sprints without progress
- New PRs introduce usage of deprecated components
- Team says "we'll finish migration after [next feature]" repeatedly
- Old and new button styles both exist in production

**Phase to address:**
Phase 1 (Foundation & Token Audit) — Establish deprecation policy and enforcement mechanisms from the start. Don't wait until Phase 4 to decide how to enforce migration.

---

### Pitfall 2: Premature Component Abstraction

**What goes wrong:**
Creating shared components too early prevents real-world use cases from informing the API design. Over-abstracted components become rigid with dozens of props to handle every edge case, making them harder to use than writing custom code. Teams route around the design system instead of using it.

**Why it happens:**
Well-intentioned desire to avoid duplication leads to extracting patterns after 1-2 instances instead of waiting for 3+ examples. Fear of "technical debt" pushes premature abstraction. The official React guidance warns: "duplication is far cheaper than the wrong abstraction."

**How to avoid:**
- **Rule of Three**: Don't create shared components until pattern appears 3+ times in different contexts
- Start with larger, page-specific components; extract smaller shared pieces only when truly reused
- Prefer composition over configuration — export sub-components that can be assembled flexibly
- Allow "escape hatches" with className props for one-off adjustments
- Copy-paste for first 2 instances, abstract on the third

**Warning signs:**
- Button component has >10 props (variant, size, color, loading, disabled, icon, iconPosition, fullWidth, ...)
- Developers create one-off components instead of using the design system version
- Component has conditional rendering for 4+ different "modes"
- PRs add new props to existing components more often than using them

**Phase to address:**
Phase 2 (Component Library Foundation) — Resist abstracting every component. Focus on truly reusable patterns (Button, Input) and defer domain-specific abstractions (OrderCard, CustomerRow) until v1.4+.

---

### Pitfall 3: Token Naming Disaster

**What goes wrong:**
Poor token naming schemes make dark mode impossible and create maintenance hell. `--blue-500` is not semantic — what happens when the brand color changes to purple? Mixing primitive tokens (`--spacing-4`) with semantic tokens (`--button-padding`) without clear hierarchy creates confusion about which to use when.

**Why it happens:**
Teams start with color values from designs without considering theming. Developers create tokens ad-hoc as needed without a naming convention. No distinction between "what it is" (primitive) vs "where it's used" (semantic).

**How to avoid:**
- **Two-tier system**: Primitives (`--color-blue-600`, `--space-4`) → Semantic (`--color-primary`, `--button-padding`)
- Semantic tokens ONLY in component code; primitives referenced only by semantic tokens
- Use role-based names: `--color-text-primary`, `--color-surface-raised`, `--color-border-subtle`
- Theme variants override semantic tokens, never primitives
- Document every token with usage guidelines in Storybook

**Warning signs:**
- Component code references `--blue-600` directly instead of `--color-primary`
- 20+ color tokens but no clear pattern to names
- Team asks "which token should I use for this?" frequently
- Dark mode implemented by duplicating every token with `-dark` suffix

**Phase to address:**
Phase 1 (Foundation & Token Audit) — Establish naming convention BEFORE migrating existing hardcoded values. Refactoring names later breaks everything.

---

### Pitfall 4: Inconsistent Half-Migration State

**What goes wrong:**
Half the codebase uses design tokens, half uses hardcoded values. New components mix both approaches. The complexity of maintaining two systems exceeds the benefit of either system alone. Dark mode only works on some pages.

**Why it happens:**
Incremental migration without enforcement. No tooling prevents hardcoded values. Developers unfamiliar with the design system copy-paste old code. No "definition of done" for migration.

**How to avoid:**
- **Wave-based migration**: Migrate entire features/pages atomically, not individual components scattered across the app
- Add ESLint rules to block hardcoded colors/spacing (use `@stylistic/no-hardcoded-colors` equivalent)
- Use Tailwind's `theme()` function exclusively; delete `extend` config for migrated values
- PR checklist: "Does this page use design tokens exclusively?"
- Track migration by route in a dashboard (e.g., `/orders` = 100% migrated, `/settings` = 40%)

**Warning signs:**
- `git grep "bg-\[#" src/` returns results
- Component uses `className="px-4"` in some places, `className="px-[--spacing-4]"` in others
- Theme toggle switches some UI elements but not others
- Developers ask "should I use tokens or just ship this quickly?"

**Phase to address:**
Phase 3 (Migration) — Migrate page-by-page, not component-by-component. Orders page → Customers page → Settings page. Mark pages as "complete" only when fully migrated.

---

### Pitfall 5: Tailwind @apply Overuse

**What goes wrong:**
Using `@apply` for everything recreates CSS maintenance problems Tailwind was meant to solve. Team spends time inventing class names (`.btn-primary`, `.card-elevated`) and jumping between files to make changes. CSS bundle grows because @apply duplicates utility classes instead of reusing them. The official Tailwind docs warn: "you are basically just writing CSS again and throwing away all of the workflow and maintainability advantages Tailwind gives you."

**Why it happens:**
Developers accustomed to traditional CSS/BEM feel uncomfortable with long className strings. Misunderstanding that React components (not @apply) are the reuse mechanism in modern frameworks. Premature optimization — assuming long classNames hurt performance (they don't).

**How to avoid:**
- **Never use @apply** unless you're NOT using a framework like React
- Extract React components instead: `<Button variant="primary">` not `.btn-primary`
- Long className strings are fine in single-use components
- For truly global styles (typography resets, base form styles), use @layer base, not @apply
- Tailwind's JIT mode handles duplicate utilities efficiently

**Warning signs:**
- Multiple files with `.card { @apply bg-white rounded-lg ... }`
- Developers create new CSS files instead of extending components
- Same pattern extracted into @apply class AND React component
- Team debates "what should we name this class?" regularly

**Phase to address:**
Phase 2 (Component Library Foundation) — Establish React components as the primary reuse mechanism. Explicitly document "@apply is NOT recommended" in contribution guidelines.

---

### Pitfall 6: Missing Component Composition

**What goes wrong:**
Components don't compose well, forcing developers to duplicate code or create variant explosion. `<Select>` component doesn't expose its subcomponents (`<Option>`, `<OptGroup>`), preventing custom layouts. Complex components become inflexible monoliths instead of composable building blocks.

**Why it happens:**
Attempting to provide "simple" API by hiding implementation details. Not considering advanced use cases until after component is shipped. Fear that exposing internals creates maintenance burden.

**How to avoid:**
- **Compound components pattern**: Export subcomponents as properties (`Select.Option`, `Select.Group`)
- Provide both simple (`<Select options={[...]} />`) and composable (`<Select><Select.Option>...`) APIs
- Use `children` prop for maximum flexibility
- Allow `className` pass-through for escape hatches
- Reference Radix UI's composition patterns as gold standard

**Warning signs:**
- Component PRs add new props to handle edge cases instead of improving composition
- Developers build custom versions instead of using design system component
- Component has `renderHeader`, `renderFooter`, `renderAction` render prop variants
- Team requests `disabled` variants for subcomponents that aren't exported

**Phase to address:**
Phase 2 (Component Library Foundation) — Design composable APIs from the start. Harder to refactor later without breaking changes.

---

### Pitfall 7: Flash of Incorrect Theme (FOIT)

**What goes wrong:**
Dark mode enabled users see light theme flash for 200-500ms on page load before theme switches to dark. This happens on every navigation in Next.js. Creates poor UX and makes the app feel janky.

**Why it happens:**
Theme state stored in `useState` initializes with default value (light). `useEffect` runs AFTER first render, reads `localStorage`, then updates state. React hydration mismatch between SSR and client causes flash.

**How to avoid:**
- Use `next-themes` library which handles SSR correctly
- Block render with script tag in `<head>` that reads `localStorage` before hydration
- Store theme in cookie for SSR access (not just localStorage)
- Use CSS variables that can be set synchronously before React mounts
- Test dark mode with cache disabled and in incognito mode

**Warning signs:**
- Users report "flicker" on page load
- Theme toggle works but reverts on refresh
- DevTools show `data-theme="light"` briefly then switches to `dark`
- Theme CSS exists but isn't applied on first paint

**Phase to address:**
Phase 2 (Component Library Foundation) — Implement theming infrastructure correctly from the start. Fixing FOIT after launch requires refactoring all theme consumers.

---

### Pitfall 8: Design-Code Drift

**What goes wrong:**
Figma/Pencil designs diverge from implemented components. Designers iterate in Figma but changes don't propagate to code. Engineers build components that don't match designs. Neither is source of truth. Both teams frustrated.

**Why it happens:**
No single source of truth. Designs updated without engineering notification. Code changes made "temporarily" without updating designs. No process for syncing changes bidirectionally.

**How to avoid:**
- Design files AND Storybook both maintained as documentation
- PR reviews require design approval for component changes
- Version components in Figma with changelog matching code versions
- Use tokens in Figma that map 1:1 to CSS variables
- Weekly design-engineering sync to review divergence
- Automated visual regression tests catch unintended changes

**Warning signs:**
- Designers share mockups that use components that don't match production
- Engineers say "the design is wrong" or designers say "the code is wrong"
- Button component in Figma has 6 variants, production has 4
- Token values in Figma don't match globals.css

**Phase to address:**
Phase 1 (Foundation & Token Audit) — Establish tokens as sync point. Phase 4 (Documentation) — Treat Storybook as contract between design and engineering.

---

### Pitfall 9: No Deprecation Strategy

**What goes wrong:**
Old components never get removed. Codebase accumulates `Button`, `ButtonV2`, `PrimaryButton`, `DesignSystemButton`. No one knows which to use. Maintenance burden doubles as bugs must be fixed in multiple places.

**Why it happens:**
Fear of breaking changes. No process for communicating deprecations. Removing code feels risky. "If it's not broken, don't touch it" mentality prevents cleanup.

**How to avoid:**
- Mark deprecated components with console warnings immediately: `console.warn("Button is deprecated, use DesignSystemButton")`
- Add ESLint rule to error on deprecated imports
- Set sunset date: "Will be removed in v2.0 (3 months)"
- Provide automated codemod for migration
- Remove deprecated code on schedule even if usage remains (forces migration)
- Document migration path in JSDoc and Storybook

**Warning signs:**
- Multiple button components in codebase
- Component has "Legacy" or "Old" in filename
- PR reviews ask "which component should I use?"
- Grep shows deprecated component used in 50+ files but "no one has time" to migrate

**Phase to address:**
Phase 1 (Foundation & Token Audit) — Define deprecation policy. Phase 3 (Migration) — Execute it ruthlessly.

---

### Pitfall 10: Overbuilding Before Validation

**What goes wrong:**
Design system team builds 50 components based on assumptions, then discovers 40 are unused or don't fit real product needs. Wasted effort. Components lack features teams actually need because they weren't informed by real usage.

**Why it happens:**
Treating design system as a project ("ship 50 components") instead of a product (solve real user problems). Building in isolation without involving product teams. Desire to "cover everything" before launch.

**How to avoid:**
- Start with 5-10 most-used components (Button, Input, Select, Card, Modal)
- Ship incrementally — 5 components in v1.0, add 5 more in v1.1 based on demand
- Require product team requests before building new components
- Track component usage with telemetry
- Delete unused components after 2 releases

**Warning signs:**
- Design system has 50 components but product uses 10
- Components built "because other design systems have them"
- No usage data or download statistics
- Features added based on "best practices" not product needs

**Phase to address:**
Phase 2 (Component Library Foundation) — Build only Button, Input, Card, Badge for v1.3. Defer complex components (DataTable, DatePicker) to later milestones.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode color values "just this once" | Ship feature 10min faster | Breaks dark mode, compounds inconsistency, cannot theme | Never — always use tokens |
| Skip ESLint rules during migration | Avoid noisy PR diffs | No enforcement = migration never completes | Never — enable from day 1 |
| Use inline styles for "edge cases" | Bypass component limitations | Cannot theme, breaks SSR, bypasses design system | Never — extend component API instead |
| Copy-paste component instead of fixing API | Unblock feature quickly | Duplicate maintenance, divergent behavior | Only once — fix API on second duplication |
| @apply instead of React component | Feels like "real CSS" | CSS bundle bloat, naming churn, maintenance hell | Never in React projects |
| Store theme in useState only | Simple implementation | Flash of wrong theme on load | Never — use SSR-compatible solution |
| Skip Storybook docs for "simple" components | Ship faster | Teams don't know component exists or how to use it | Never — docs are deliverable, not nice-to-have |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| CSS variables overuse (1000+ tokens) | Slow style recalculation on theme change | Limit to 50-100 semantic tokens; use static values where theming unnecessary | >500 tokens, 0.5s+ paint time |
| Global CSS bundle (all components) | 500KB+ CSS file on every page | Use CSS modules or Tailwind JIT to eliminate unused styles | >50 components |
| Inline SVG icons in every component | Slow initial render, memory overhead | Icon component with sprite sheet or SVG imports | >100 icon usages |
| React Context for every token | Deep re-render trees on theme change | CSS variables (not Context) for theme values | >20 components consuming context |
| Visual regression tests for all states | 30min+ CI runs, massive storage costs | Test high-value components only; use snapshot tests for simple components | >500 screenshots |

---

## Integration Gotchas

Common mistakes when connecting design system to existing patterns.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tailwind v4 migration | Running codemod and assuming it's done; tool only handles 90% | Manually verify @theme output, remove duplicate CSS variables, test all components |
| Next.js SSR | Using useEffect for theme detection causes flash | Use `next-themes` or cookie-based SSR approach |
| TypeScript | Exporting components without proper type definitions | Generate .d.ts files, use ComponentProps utility type |
| Existing components | Trying to migrate all at once | Migrate page-by-page; colocate old and new until migration complete |
| Status badges | Hardcoding colors per status type | Use semantic tokens (`--color-status-pending`) that map to theme |
| Form validation | Inline error styling diverges from design system | Extract FormField wrapper with consistent error states |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Inconsistent motion | Jarring experience as some elements animate, others don't | Define motion tokens (duration, easing) and apply consistently |
| Missing focus states | Keyboard navigation broken or invisible | Audit all interactive components for visible focus indicators |
| Insufficient color contrast | Accessibility violations (WCAG AA failure) | Test all color combinations with contrast checker; aim for WCAG AAA |
| Theme toggle without transition | Abrupt flash when switching light/dark | Add CSS transition: `* { transition: background 150ms, color 150ms }` on theme change |
| Overriding component styles | User customizations break on design system updates | Provide stable CSS classes with lower specificity; avoid !important |
| Missing loading states | Buttons feel unresponsive on click | All async actions show loading state (spinner, disabled) |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Tokens:** Token values exist but no documentation on when to use each — verify usage guidelines in Storybook
- [ ] **Components:** Component works in isolation but breaks in real product context — verify integration in 2+ pages
- [ ] **Dark mode:** Theme toggle exists but some components still hardcode colors — verify every component uses tokens exclusively
- [ ] **Accessibility:** Component looks good but missing ARIA attributes or keyboard navigation — verify with screen reader and keyboard-only testing
- [ ] **Responsive:** Component designed for desktop but breaks on mobile — verify all breakpoints with real devices
- [ ] **Edge cases:** Component works with "happy path" data but breaks with empty state, long text, or unusual data — verify with realistic test data
- [ ] **Type safety:** Component accepts any props but TypeScript types are incomplete — verify intellisense shows all valid props
- [ ] **Documentation:** Component exists but no Storybook story or usage examples — verify docs exist for every exported component
- [ ] **Testing:** Component renders but no tests for interactions or edge cases — verify unit tests cover prop variations and user interactions
- [ ] **Migration:** New component exists but old component still in use — verify deprecated component has removal plan

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Token naming disaster | HIGH | 1. Create naming convention doc; 2. Create migration script with token map; 3. Run codemod across codebase; 4. Delete old tokens to prevent usage |
| Premature abstraction | MEDIUM | 1. Fork component for specific use case; 2. Mark original as deprecated; 3. Inline into consuming components; 4. Extract again when 3rd real pattern emerges |
| Design-code drift | MEDIUM | 1. Audit all components with side-by-side comparison; 2. Create sync issues in backlog; 3. Agree on single source of truth; 4. Establish review process |
| Last 20% migration trap | HIGH | 1. Enforce with ESLint errors (not warnings); 2. Add telemetry to track old component usage; 3. Delete deprecated components (forces migration); 4. Allocate dedicated sprint |
| @apply overuse | MEDIUM | 1. Create equivalent React component for each @apply class; 2. Add ESLint rule against @apply; 3. Run codemod to replace; 4. Delete @apply classes |
| No deprecation strategy | LOW | 1. Mark all old components deprecated today; 2. Set 30-day sunset; 3. Create migration guide; 4. Run codemods; 5. Delete on schedule |
| FOIT | MEDIUM | 1. Install `next-themes`; 2. Move theme detection to SSR; 3. Add blocking script in `<head>`; 4. Test in incognito |
| Overbuilt library | LOW | 1. Delete unused components after audit; 2. Simplify overcomplex APIs; 3. Focus on top 10 used components; 4. Require usage metrics before building new |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Token naming disaster | Phase 1: Foundation & Token Audit | Run grep for hardcoded values = 0 results; all tokens follow naming convention |
| Inconsistent half-migration | Phase 3: Migration | All routes marked "complete" in dashboard; ESLint passes with no hardcoded value violations |
| Premature abstraction | Phase 2: Component Library | Only Button, Input, Select, Card, Badge built — no domain-specific components yet |
| @apply overuse | Phase 2: Component Library | Grep for `@apply` in component code = 0 results (only in base layer) |
| FOIT | Phase 2: Component Library | Test theme toggle in incognito mode — no flash visible |
| Design-code drift | Phase 1 & 4 | Token values match between Figma and globals.css; Storybook stories match designs |
| No deprecation strategy | Phase 1: Foundation & Token Audit | Deprecation policy documented; console warnings added to old components |
| Missing composition | Phase 2: Component Library | Complex components export subcomponents; `className` pass-through enabled |
| Overbuilding | Phase 2: Component Library | v1.3 ships with ≤8 components; additional components deferred to v1.4+ based on demand |
| Last 20% trap | Phase 3: Migration | Migration plan includes enforcement mechanism; progress tracked weekly; 100% completion = old code deleted |

---

## Sources

### Design System Migration
- [How to Implement a Design System: Reasons, Approach, and Migration Path](https://www.designsystemscollective.com/how-to-implement-a-design-system-reasons-approach-and-migration-path-051c41734caf)
- [Tips and tricks for Design System migrations](https://medium.com/@nonisnilukshi/tips-and-tricks-for-design-system-migrations-5beafb8e58c5)
- [Lessons from migrating a web application to a design system](https://dev.to/victorandcode/lessons-from-migrating-a-web-application-to-a-design-system-2701)
- [Pro Tips for Design System Migration in Large Projects](https://medium.com/@houhoucoop/pro-tips-for-ui-library-migration-in-large-projects-d54f0fbcd083)
- [Migrations are the hardest part of design systems work](https://maecapozzi.com/newsletter/75)

### Design System Adoption Failures
- [Why most Design Systems fail – and how to cultivate success](https://ui-patterns.com/blog/why-most-design-systems-fail-and-how-to-cultivate-success)
- [Increasing Design System Adoption: Part 1](https://figr.design/blog/why-design-systems-fail-to-get-adopted)
- [Why Design Systems Fail - Knapsack](https://www.knapsack.cloud/blog/why-design-systems-fail)
- [Why Most Design Systems Fail](https://medium.com/@codefarmer/why-most-design-systems-fail-03cf8c93a2d6)
- [Design System Adoption Pitfalls](https://www.netguru.com/blog/design-system-adoption-pitfalls)

### React & Component Design
- [Solving Common Design System Implementation Challenges](https://www.uxpin.com/studio/blog/solving-common-design-system-implementation-challenges/)
- [How to avoid premature abstractions in React](https://www.falldowngoboone.com/blog/how-to-avoid-premature-abstractions-in-react/)
- [Don't overabstract your components](https://kirjai.com/component-abstraction/)
- [React Anti-Patterns](https://tylerwray.me/blog/react-anti-patterns/)
- [6 Common React Anti-Patterns That Are Hurting Your Code Quality](https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933)

### Tailwind CSS Best Practices
- [Tailwind CSS - Reusing Styles (Official)](https://tailwindcss.com/docs/reusing-styles) — Context7 /tailwindlabs/tailwindcss.com
- [Tailwind v4 Design Tokens Migration Guide](https://www.oneminutebranding.com/blog/tailwind-v4-design-tokens)
- [How to Build a Design Token System for Tailwind](https://hexshift.medium.com/how-to-build-a-design-token-system-for-tailwind-that-scales-forever-84c4c0873e6d)
- [I was using Tailwind wrong, so you don't have to](https://dev.to/aloisseckar/i-was-using-tailwind-wrong-so-you-dont-have-to-4h7j)

### Design Tokens
- [Linting Your Design Tokens, what and why](https://www.alwaystwisted.com/articles/linting-your-design-tokens)
- [Design Tokens Explained: Design Meets Code](https://www.oneminutebranding.com/blog/design-tokens-explained)

### Theming & Dark Mode
- [Implementing Dark Mode In React Apps Using styled-components](https://www.smashingmagazine.com/2020/04/dark-mode-react-apps-styled-components/)
- [Implement Dark Mode in Vue/React Component Library](https://medium.com/@magenta2127/implement-dark-mode-in-vue-react-component-library-9fb3f12b4206)
- [Easy Dark Mode (and Multiple Color Themes!) in React](https://css-tricks.com/easy-dark-mode-and-multiple-color-themes-in-react/)

### Documentation & Testing
- [Common Design System Documentation Mistakes](https://www.uxpin.com/studio/blog/common-design-system-documentation-mistakes/)
- [The UI Visual Regression Testing Best Practices Playbook](https://medium.com/@ss-tech/the-ui-visual-regression-testing-best-practices-playbook-dc27db61ebe0)
- [Keeping a React Design System consistent: using visual regression testing](https://techblog.commercetools.com/keeping-a-react-design-system-consistent-f055160d5166)
- [Flaky Visual Regression Tests, and what to do about them](https://www.shakacode.com/blog/flaky-visual-regression-tests-and-what-to-do-about-them/)

### Versioning
- [Design System Version Control: Managing Axiom](https://www.designsystemscollective.com/version-control-for-design-systems-how-we-manage-axiom-3aade0f5c11c)
- [How to Version Design Systems: 8 Real-World Examples](https://www.supernova.io/blog/8-examples-of-versioning-in-leading-design-systems)
- [Component Versioning vs. Design System Versioning](https://www.uxpin.com/studio/blog/component-versioning-vs-design-system-versioning/)
- [Versioning Design Systems](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d)

### Official Documentation
- React.dev - Component composition patterns and anti-patterns (Context7 /reactjs/react.dev)
- Tailwind CSS - Extracting components and reusing styles (Context7 /tailwindlabs/tailwindcss.com)

---

*Pitfalls research for: CGM Dashboard v1.3 Design Hardening*
*Researched: 2026-05-07*
