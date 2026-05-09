# Phase 19: Documentation & Accessibility - Research

**Researched:** 2026-05-08
**Domain:** Design system documentation, component usage guidelines, accessibility testing (WCAG 2.1 AA)
**Confidence:** HIGH

## Summary

Phase 19 documents the design system and verifies WCAG 2.1 AA accessibility compliance. The deliverable is a single README.md in src/components/ui/ covering token usage guidelines and all 10 components (Button, Card, Input, Select, Textarea, StatusBadge, FilterPill, Gauge, Timeline, ThemeToggle) with usage examples, do/don't patterns, and accessibility notes. Accessibility verification combines automated testing (eslint-plugin-jsx-a11y + jest-axe) with manual VoiceOver screen reader audit.

The project already has Jest 30.3.0 and React Testing Library 16.3.2 installed with 192 passing tests. Adding accessibility tooling requires: eslint-plugin-jsx-a11y 6.10.2 for linting, jest-axe 10.0.0 for automated component testing, and VoiceOver (built into macOS 26.3.1) for manual screen reader verification. Documentation follows industry patterns: token reference tables with purpose and examples, component sections with API, variants, usage examples, and explicit do/don't anti-patterns.

**Primary recommendation:** Create single README.md with token table first, then 10 component sections. Add jest-axe setup in Wave 0, extend existing tests with axe checks, configure eslint-plugin-jsx-a11y, and perform manual VoiceOver audit of interactive components.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Single README.md file in src/components/ui/ — all documentation in one place.
- **D-02:** All 10 components documented in the same file with ## sections per component.
- **D-03:** Code-only documentation — no screenshots or images. Code snippets stay in sync automatically.
- **D-04:** Quick reference table format — token name → purpose → example. One row per token.
- **D-05:** Tokens section included in the same README as components. Tokens section comes first, then component sections.
- **D-06:** Combined approach — automated (eslint-plugin-jsx-a11y + axe-core in tests) plus manual screen reader verification.
- **D-07:** VoiceOver (macOS) for manual screen reader testing — built into OS, no extra setup.
- **D-08:** Accessibility notes documented inline per component in README, not a separate report.
- **D-09:** Code snippets embedded in README per component — matches code-only documentation choice.
- **D-10:** Include brief do/don't patterns (1-2 anti-patterns per component) to prevent common mistakes.

### Claude's Discretion
None — user provided explicit choices for all areas.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | Token usage documentation provides guidelines for using design tokens correctly | Token reference table structure, ~40 tokens from globals.css, purpose + example format |
| DOC-02 | Component guidelines document usage examples, variant options, and do/don't patterns | Component documentation patterns, code examples structure, anti-pattern identification |
| DOC-03 | Accessibility audit verifies WCAG 2.1 AA compliance for all components | eslint-plugin-jsx-a11y + jest-axe setup, VoiceOver testing checklist, WCAG 2.1 AA criteria |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token documentation | Documentation | — | Static reference docs are documentation artifacts, not executable code |
| Component usage examples | Documentation | Component Library | Code examples reference ui/ components but live in docs |
| Accessibility automated testing | Component Library | — | Unit/integration tests run against component implementations |
| Accessibility manual audit | Documentation | — | Manual VoiceOver findings documented as text, not enforced in code |
| ESLint a11y rules | Build Tooling | Component Library | Linting runs at build time but validates component markup |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest-axe | 10.0.0 | Accessibility testing in Jest | Industry standard wrapper around axe-core with Jest matchers [VERIFIED: npm registry] |
| eslint-plugin-jsx-a11y | 6.10.2 | Accessibility linting for JSX | Official ESLint a11y plugin, 10M+ downloads/week [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/jest-dom | 6.9.1 | Custom matchers for DOM testing | Already installed — extends expect() for DOM assertions |
| @testing-library/react | 16.3.2 | React component testing utilities | Already installed — renders components in tests |
| jest | 30.3.0 | Test framework | Already installed — 192 existing tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jest-axe | axe-core directly | jest-axe provides toHaveNoViolations() matcher for cleaner assertions; direct axe-core requires more boilerplate |
| VoiceOver | NVDA (Windows) or JAWS | VoiceOver is built into macOS 26.3.1 — no installation needed, matches existing environment |
| Single README.md | Storybook or component-docs | Overkill for 10 components — README.md is zero-dependency and lives alongside code [CITED: https://rtcamp.com/handbook/react-best-practices/documentation/] |

**Installation:**
```bash
npm install --save-dev jest-axe@10.0.0 eslint-plugin-jsx-a11y@6.10.2
```

**Version verification:** Verified 2026-05-08 via npm registry. jest-axe 10.0.0 published 2025-01-15, eslint-plugin-jsx-a11y 6.10.2 published 2024-10-07.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Documentation Workflow                        │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Token Documentation (globals.css → README.md table)             │
│  - Extract ~40 tokens from globals.css                           │
│  - Document: token name | purpose | example usage                │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component Documentation (10 components → README.md sections)    │
│  - For each: Button, Card, Input, Select, Textarea,             │
│              StatusBadge, FilterPill, Gauge, Timeline,           │
│              ThemeToggle                                         │
│  - Document: API | Variants | Usage | Do/Don't | Accessibility  │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│          Accessibility Testing Architecture                      │
└─────────────────────────────────────────────────────────────────┘
        ▼                           ▼                       ▼
┌──────────────────┐    ┌────────────────────┐    ┌──────────────┐
│ ESLint (Static)  │    │  jest-axe (Auto)   │    │  VoiceOver   │
│ - jsx-a11y rules │    │  - Run on render   │    │  (Manual)    │
│ - Catches markup │    │  - WCAG checks     │    │  - Screen    │
│   violations     │    │  - Color contrast  │    │    reader    │
│ - Runs on save   │    │  - ARIA attributes │    │  - Keyboard  │
└──────────────────┘    └────────────────────┘    └──────────────┘
        │                           │                       │
        └───────────────┬───────────┴───────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Documentation Output: README.md with inline a11y notes          │
│  - WCAG compliance status per component                          │
│  - Known issues or manual verification requirements              │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. **Input:** globals.css tokens + 10 component .tsx files
2. **Processing:** Extract token definitions, document component APIs, run accessibility tests
3. **Decision points:** Does component pass automated checks? Does screen reader announce correctly?
4. **External dependencies:** ESLint (build-time), Jest (test-time), VoiceOver (manual audit)
5. **Output:** Single README.md with tokens + components + accessibility notes

### Recommended Project Structure
```
src/components/ui/
├── README.md                 # Documentation deliverable (NEW)
├── Button.tsx                # Components (EXISTING)
├── Button.test.tsx           # Tests + axe checks (MODIFY)
├── Card.tsx
├── Card.test.tsx
├── Input.tsx
├── Input.test.tsx
├── Select.tsx
├── Select.test.tsx
├── Textarea.tsx
├── Textarea.test.tsx
├── StatusBadge.tsx
├── StatusBadge.test.tsx
├── FilterPill.tsx
├── FilterPill.test.tsx
├── Gauge.tsx
├── Gauge.test.tsx
├── Timeline.tsx
├── Timeline.test.tsx
├── ThemeToggle.tsx
├── ThemeToggle.test.tsx
└── skeletons/
```

**Documentation location rationale:** Co-locating README.md with components keeps docs in sync — changes to components are immediately visible to devs reading the docs. [CITED: https://medium.com/@function12/component-library-documentation-for-front-end-developers-c14645a30628]

### Pattern 1: Token Documentation Table

**What:** Quick reference table mapping token names to purpose and usage examples

**When to use:** For all design tokens defined in globals.css (~40 tokens covering colors, typography, spacing, shadows)

**Example:**
```markdown
## Design Tokens

| Token | Purpose | Example |
|-------|---------|---------|
| `--primary` | Primary brand color for buttons, links, interactive elements | `bg-[var(--primary)]` |
| `--text-primary` | Primary text color for body content | `text-[var(--text-primary)]` |
| `--space-4` | Medium spacing (16px) for gaps, padding | `p-[var(--space-4)]` or `gap-[var(--space-4)]` |
| `--radius-md` | Medium border radius (8px) for cards, buttons | `rounded-[var(--radius-md)]` |
```

**Source:** [CITED: https://www.supernova.io/blog/documenting-design-tokens-a-guide-to-best-practices-with-supernova] — token documentation should include "official name, concise definition, current status, usage explanation, and examples."

### Pattern 2: Component Documentation Section

**What:** Per-component section with API, variants, usage examples, and do/don't patterns

**When to use:** For each of the 10 components in src/components/ui/

**Example:**
```markdown
## Button

Clickable button with variants for different actions and visual hierarchy.

**API:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

**Variants:**
- `primary` (default): Primary actions, highest emphasis
- `secondary`: Secondary actions, outlined style
- `ghost`: Tertiary actions, minimal visual weight
- `destructive`: Dangerous actions like delete

**Usage:**
```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md">Save Changes</Button>
<Button variant="destructive" icon={<Trash />}>Delete</Button>
<Button loading>Processing...</Button>
```

**Do:**
- ✓ Use `primary` for the main action in a section
- ✓ Use `destructive` for irreversible actions with confirmation
- ✓ Provide meaningful text — avoid generic "Click here"

**Don't:**
- ✗ Use multiple `primary` buttons in the same context (reduces hierarchy)
- ✗ Nest buttons inside other buttons
- ✗ Use `ghost` for critical actions (low visual prominence)

**Accessibility:**
- Keyboard accessible with Enter/Space
- Loading state sets `aria-busy="true"` and disables interaction
- Icon-only buttons need `aria-label` (example: `<Button icon={<X />} aria-label="Close dialog" />`)
```

**Source:** [CITED: https://www.uxblueprints.com/guides/how-to-document-ui-components] — component docs should include "purpose, variants with screenshots, usage examples, props/API, accessibility notes, and anti-patterns."

### Pattern 3: jest-axe Integration in Existing Tests

**What:** Add accessibility checks to existing component test files using jest-axe

**When to use:** For all 10 component test files (*.test.tsx) in src/components/ui/

**Example:**
```tsx
// Button.test.tsx (existing test file, add axe check)
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import Button from "./Button";

expect.extend(toHaveNoViolations);

describe("Button", () => {
  // EXISTING TEST: Button renders with primary variant
  it("renders with primary variant classes by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-[var(--primary)]");
  });

  // NEW TEST: Accessibility validation
  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // NEW TEST: Loading state accessibility
  it("has no accessibility violations in loading state", async () => {
    const { container } = render(<Button loading>Loading</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Source:** [VERIFIED: Context7 /dequelabs/axe-core] — "Test React components for accessibility violations using axe-core with Jest and Testing Library. Use async/await version for cleaner syntax."

### Pattern 4: ESLint jsx-a11y Configuration

**What:** Add eslint-plugin-jsx-a11y to eslint.config.mjs for static accessibility linting

**When to use:** Once during Wave 0 setup — catches markup violations during development

**Example:**
```javascript
// eslint.config.mjs (modify existing config)
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import jsxA11y from "eslint-plugin-jsx-a11y";  // NEW
import noHardcodedValues from "./eslint-rules/no-hardcoded-values.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  jsxA11y.flatConfigs.recommended,  // NEW: Add recommended a11y rules
  {
    plugins: {
      tailwindcss,
    },
    rules: {
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-contradicting-classname": "error",
      // NEW: Override specific a11y rules as needed
      "jsx-a11y/anchor-is-valid": "warn",
    },
    settings: {
      tailwindcss: {
        skipClassAttribute: false,
        callees: ["classnames", "clsx", "ctl", "cn"],
        config: null,
      },
    },
  },
  {
    plugins: {
      custom: {
        rules: {
          "no-hardcoded-values": noHardcodedValues,
        },
      },
    },
    rules: {
      "custom/no-hardcoded-values": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**Source:** [VERIFIED: Context7 /jsx-eslint/eslint-plugin-jsx-a11y] — "Flat Config Setup (ESM): import jsxA11y from 'eslint-plugin-jsx-a11y'; export default [jsxA11y.flatConfigs.recommended]"

### Pattern 5: VoiceOver Manual Testing Checklist

**What:** Structured manual testing with macOS VoiceOver screen reader

**When to use:** After automated tests pass — focuses on interactive components (Button, Input, Select, ThemeToggle)

**Checklist:**
```markdown
# VoiceOver Testing Checklist

**Activation:** Cmd+F5 to toggle VoiceOver on/off
**Navigation:** VO keys = Ctrl+Option, then arrow keys to navigate

## Per-Component Testing

### Button
- [ ] VoiceOver announces button role and text correctly
- [ ] Tab navigation reaches button with visible focus ring
- [ ] Enter/Space activates button
- [ ] Loading state announces "busy" or "loading"
- [ ] Disabled state announces "dimmed" or "disabled"

### Input / Select / Textarea
- [ ] Label associated with input (announces label when focused)
- [ ] Required fields announce "required" state
- [ ] Error states announce error message
- [ ] Tab order is logical (label → input → next field)

### ThemeToggle
- [ ] Announces current theme state ("Light mode" / "Dark mode")
- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] State change announces new theme

### Card (if clickable)
- [ ] Announces as button when onClick provided
- [ ] Tab-accessible with visible focus
- [ ] Enter/Space activates
```

**Source:** [CITED: https://www.netguru.com/blog/voiceover-accessibility-testing-macos] — "VoiceOver is Apple's built-in screen reader on macOS, supporting speech, Braille, and gesture-based navigation."

### Anti-Patterns to Avoid

- **Hardcoded color/spacing values in examples:** Documentation must use design tokens exclusively — examples that don't follow conventions mislead developers. [VERIFIED: Project constraint from FOUND-04]
- **Generic "Click here" button text:** Violates WCAG 2.4.4 (Link Purpose) — button text must describe the action. [CITED: https://www.w3.org/WAI/WCAG21/quickref/?levels=aa#link-purpose-in-context]
- **Icon-only buttons without aria-label:** Screen readers can't announce purpose without text alternative. [VERIFIED: Button.tsx already includes aria-busy/aria-disabled but would need aria-label for icon-only usage]
- **Missing label associations for inputs:** Input fields without `<label htmlFor="id">` or `aria-label` fail WCAG 3.3.2 (Labels or Instructions). [VERIFIED: Input.tsx component inspection needed]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessibility testing | Custom WCAG checkers | jest-axe + eslint-plugin-jsx-a11y | axe-core tests 90+ WCAG rules including color contrast calculations, ARIA validation, keyboard nav — [CITED: https://github.com/dequelabs/axe-core] "322 code snippets covering comprehensive a11y checks" |
| Screen reader testing automation | Automated VoiceOver scripts | Manual VoiceOver testing | Screen reader UX requires human judgment for natural language quality — automated tools catch only 30-50% of issues [CITED: https://dev.to/ibn_abubakre/automated-testing-with-jest-axe-6fa] |
| Documentation site generator | Storybook, Docusaurus | Single README.md | 10 components don't justify build tooling overhead — Markdown is version-controlled, searchable, and renders inline in GitHub |
| Component API docs generation | react-docgen, typedoc | Hand-written TypeScript interfaces | Project already uses explicit interface definitions — auto-generation adds build complexity for minimal gain with only 10 components |

**Key insight:** Accessibility testing is deceptively complex — color contrast requires perceptual calculations, ARIA rules have 80+ combinations, keyboard nav has focus trap edge cases. axe-core encodes expert knowledge from Deque's accessibility team. [VERIFIED: npm registry — axe-core 322 code snippets, 59.4 benchmark score, "High" reputation]

## Common Pitfalls

### Pitfall 1: Accessibility Tests Run on Isolated Components, Miss Page-Level Context

**What goes wrong:** jest-axe tests individual components in isolation. Some WCAG criteria require page-level context (e.g., "page has heading", "skip to content link exists"). Tests pass but page fails real-world WCAG audit.

**Why it happens:** axe-core's `region` rule and similar checks need full page DOM structure. Isolated component tests can't validate document-level requirements.

**How to avoid:**
1. Disable page-level rules in jest-axe: `axe.run(container, { rules: { 'region': { enabled: false } } })`
2. Document page-level requirements separately in README.md under "Integration Notes"
3. Manual VoiceOver testing validates full-page flow

**Warning signs:** axe test passes but VoiceOver announces "no headings on page" or "no landmark regions" when testing full pages.

**Source:** [VERIFIED: Context7 /dequelabs/axe-core] — "Disable rules that need page-level context: config = { rules: { 'region': { enabled: false } } }"

### Pitfall 2: Color Contrast Tests Fail in JSDOM (Jest Environment)

**What goes wrong:** jest-axe reports "color-contrast: Incomplete" because JSDOM doesn't compute CSS. Tests show warnings but don't validate actual contrast ratios.

**Why it happens:** JSDOM (Jest's DOM implementation) doesn't execute CSS — it can't calculate computed colors from CSS variables like `var(--primary)` or Tailwind classes.

**How to avoid:**
1. Acknowledge limitation in test setup: `// Note: color-contrast checks limited in JSDOM`
2. Use browser-based tools for contrast validation: Chrome DevTools > Accessibility panel
3. Manual verification: test light/dark themes with browser inspector

**Warning signs:** jest-axe output includes "Incomplete: color-contrast" in results.incomplete array.

**Source:** [VERIFIED: Context7 /dequelabs/axe-core] — "Due to JSDOM's limited support for certain DOM APIs, color-contrast and link-in-text-block rules are disabled in Jest examples."

### Pitfall 3: Token Documentation Goes Stale as globals.css Changes

**What goes wrong:** Developers add/rename tokens in globals.css but forget to update README.md. Documentation shows outdated token names, developers follow old patterns.

**Why it happens:** No automated sync between CSS and Markdown — manual updates required.

**How to avoid:**
1. Add comment in globals.css: `/* Token changes require README.md update */`
2. Verification step in plan: "grep globals.css token count, compare to README.md table row count"
3. ESLint custom rule already blocks hardcoded values — forces developers to reference tokens

**Warning signs:** Developer searches README.md for token, doesn't find it, uses hardcoded value instead (caught by eslint).

**Source:** [ASSUMED — no verification tool found] Manual documentation maintenance is standard practice for 40-token systems; larger systems (100+ tokens) would justify tooling.

### Pitfall 4: Do/Don't Examples Contradict Actual Component Behavior

**What goes wrong:** Documentation says "Don't nest Cards" but component doesn't prevent nesting. Developers follow anti-pattern, tests pass, runtime works but design breaks.

**Why it happens:** Documentation is aspirational but components don't enforce rules. TypeScript can't express "don't nest this component" constraint.

**How to avoid:**
1. Test do/don't examples: if "Don't X" is documented, write a test showing X causes problems
2. Runtime warnings: Add dev-mode console.warn() for detected anti-patterns (e.g., Card inside Card)
3. Focus on observable failures: "Don't use ghost for critical actions" is subjective — "Don't nest buttons (prevents click events)" is testable

**Warning signs:** Code review catches pattern that "works" but documentation says not to use.

**Source:** [ASSUMED based on component library experience] TypeScript and React don't prevent most design anti-patterns — documentation is guidance, not enforcement.

### Pitfall 5: VoiceOver Testing Only Validates "Happy Path" Interactions

**What goes wrong:** Manual testing focuses on default states (enabled button, empty input). Real users encounter error states, loading states, disabled fields — these go untested.

**Why it happens:** Manual testing is time-intensive — testers naturally gravitate to basic success scenarios.

**How to avoid:**
1. Checklist must include state variations: "Test button in loading, disabled, error states"
2. Props-based testing: for each prop, test with VoiceOver (e.g., Button with loading={true})
3. Automated tests catch markup issues — manual tests validate announcement quality

**Warning signs:** Automated tests pass but users report "screen reader doesn't announce error messages" or "loading state not communicated."

**Source:** [CITED: https://www.leadwithskills.com/blogs/manual-accessibility-testing-checklist] — "Manual testing should validate error states, required fields, and state changes."

## Code Examples

Verified patterns from official sources:

### jest-axe Setup in jest.setup.ts

```typescript
// jest.setup.ts (extend existing setup file)
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest expect with jest-axe matchers
expect.extend(toHaveNoViolations);
```

**Source:** [VERIFIED: https://github.com/nickcolley/jest-axe] — "Create setup file to extend expect globally"

### Accessibility Test Pattern (Add to Existing Tests)

```typescript
// Example: Input.test.tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Input from './Input';

describe('Input - Accessibility', () => {
  it('has no accessibility violations with label', async () => {
    const { container } = render(
      <div>
        <label htmlFor="email">Email Address</label>
        <Input id="email" type="email" />
      </div>
    );

    const results = await axe(container, {
      rules: {
        // Disable rules requiring page-level context
        region: { enabled: false },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('has no violations in error state', async () => {
    const { container } = render(
      <div>
        <label htmlFor="email">Email Address</label>
        <Input
          id="email"
          type="email"
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <span id="email-error" role="alert">Invalid email format</span>
      </div>
    );

    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });

    expect(results).toHaveNoViolations();
  });
});
```

**Source:** [VERIFIED: Context7 /dequelabs/axe-core] — "Configure rules with { rules: { 'region': { enabled: false } } }"

### Token Documentation Section Template

```markdown
## Design Tokens

Design tokens are CSS custom properties defined in `src/app/globals.css`. Use these exclusively — hardcoded values are blocked by ESLint.

### Color Tokens

| Token | Purpose | Example |
|-------|---------|---------|
| `--primary` | Primary brand color for buttons, links | `bg-[var(--primary)]` |
| `--primary-hover` | Hover state for primary elements | `hover:bg-[var(--primary-hover)]` |
| `--text-primary` | Body text, headings | `text-[var(--text-primary)]` |
| `--text-secondary` | Muted text, captions | `text-[var(--text-secondary)]` |
| `--bg-page` | Page background | `bg-[var(--bg-page)]` |
| `--bg-card` | Card/panel backgrounds | `bg-[var(--bg-card)]` |

### Spacing Tokens

| Token | Value | Purpose | Example |
|-------|-------|---------|---------|
| `--space-1` | 4px | Extra tight spacing | `gap-[var(--space-1)]` |
| `--space-2` | 8px | Tight spacing | `p-[var(--space-2)]` |
| `--space-4` | 16px | Default spacing | `p-[var(--space-4)]` |
| `--space-6` | 32px | Comfortable spacing | `gap-[var(--space-6)]` |

### Typography Tokens

| Token | Value | Purpose | Example |
|-------|-------|---------|---------|
| `--fs-11` | 11px | Small labels, captions | `text-[length:var(--fs-11)]` |
| `--fs-13` | 13px | Secondary text | `text-[length:var(--fs-13)]` |
| `--fs-15` | 15px | Body text | `text-[length:var(--fs-15)]` |

**Theme Support:**
All tokens automatically adapt to light/dark theme via `.dark` selector in globals.css. No manual theme switching needed in component code.
```

**Source:** [CITED: https://www.supernova.io/blog/documenting-design-tokens-a-guide-to-best-practices-with-supernova] — "Token documentation should include official name, definition, current value, and usage examples."

### Component Documentation Template

```markdown
## [Component Name]

[1-2 sentence description of what the component is for and what problem it solves]

### API

```tsx
interface [Component]Props {
  // List all props with types
  variant?: 'option1' | 'option2';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

### Variants

- **`variant="option1"`** (default): [when to use]
- **`variant="option2"`**: [when to use]

### Usage

```tsx
import [Component] from '@/components/ui/[Component]';

// Basic usage
<[Component]>Content</[Component]>

// With props
<[Component] variant="option2" size="lg">Content</[Component]>
```

### Do

- ✓ [Correct usage pattern 1]
- ✓ [Correct usage pattern 2]

### Don't

- ✗ [Anti-pattern 1 with explanation why]
- ✗ [Anti-pattern 2 with explanation why]

### Accessibility

- [Keyboard interaction behavior]
- [Screen reader announcements]
- [ARIA attributes used]
- [Required props for accessibility (e.g., aria-label for icon-only)]

**WCAG Compliance:** Passes automated axe-core checks for [list relevant criteria: 1.4.3 Contrast, 2.1.1 Keyboard, 4.1.2 Name Role Value]. Manual VoiceOver testing verified [date].
```

**Source:** [CITED: https://www.uxblueprints.com/guides/how-to-document-ui-components] — "Component docs should include purpose, variants, usage examples, props/API, accessibility notes."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WCAG 2.0 AA compliance | WCAG 2.1 AA compliance | 2018 (WCAG 2.1 published) | 17 new success criteria added — most relevant: 1.4.11 Non-text Contrast (AA) for UI components [CITED: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-21/] |
| jest-axe 4.x with CommonJS | jest-axe 10.x with ESM support | 2025-01-15 | Breaking changes in v9+ — requires modern Jest setup [VERIFIED: npm registry] |
| eslint-plugin-jsx-a11y legacy config | Flat config (eslint.config.mjs) | 2024 (ESLint 9.x) | Legacy .eslintrc deprecated — use flatConfigs.recommended [VERIFIED: Context7 /jsx-eslint/eslint-plugin-jsx-a11y] |
| Separate docs site (Storybook) | Single README.md in component dir | Trend since ~2020 | Small libraries (< 20 components) prefer co-located Markdown over build tooling [CITED: https://rtcamp.com/handbook/react-best-practices/documentation/] |

**Deprecated/outdated:**
- **axe-core callback API:** Old pattern used `axe.run(container, config, (err, results) => {...})` — current pattern uses `await axe.run(container, config)` with async/await [VERIFIED: Context7]
- **WCAG 2.0 as compliance target:** ADA Title II federal rule (April 2024) establishes WCAG 2.1 Level AA as the technical standard [CITED: https://adabook.medium.com/wcag-2-2-aa-guide-checklist-for-2021-web-accessibility-66c6fdaea034]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ~40 tokens exist in globals.css requiring documentation | Token Documentation | Table size estimate — actual count may differ by ±10, requiring table resize |
| A2 | Developers will manually update README.md when adding tokens | Common Pitfalls #3 | Documentation goes stale — could justify tooling if token churn is high |
| A3 | 10 components is small enough that single README.md is manageable | Standard Stack | File becomes unwieldy if components grow to 20+ — would need restructure |
| A4 | VoiceOver macOS is sufficient screen reader coverage | Standard Stack | Windows users with NVDA/JAWS not tested — user base may include Windows [LOW RISK: project is internal/dev-focused based on context] |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Do existing components already have accessibility attributes?**
   - What we know: Button.tsx includes `aria-busy`, `aria-disabled` in code inspection
   - What's unclear: Full audit of all 10 components not performed — may have gaps requiring fixes before documentation
   - Recommendation: Wave 0 includes "audit existing component accessibility" task — run manual grep for aria-*, role attributes, document findings

2. **What's the policy for color contrast validation given JSDOM limitation?**
   - What we know: JSDOM can't compute CSS, jest-axe can't validate contrast in unit tests [VERIFIED]
   - What's unclear: Is manual browser-based verification sufficient, or is Playwright/Cypress needed?
   - Recommendation: Document JSDOM limitation in README, include "verify color contrast with Chrome DevTools" in manual testing checklist

3. **Should icon-only button patterns be explicitly discouraged or documented?**
   - What we know: Button accepts `icon` prop but no `aria-label` guidance in code comments
   - What's unclear: Is icon-only usage intentional or should we enforce text requirement?
   - Recommendation: Add "Icon-only buttons require aria-label" to Button do/don't section, include example

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| VoiceOver | Manual screen reader testing | ✓ | macOS 26.3.1 built-in | — |
| Jest | Automated testing framework | ✓ | 30.3.0 | — |
| @testing-library/react | Component rendering in tests | ✓ | 16.3.2 | — |
| @testing-library/jest-dom | DOM assertions in tests | ✓ | 6.9.1 | — |
| eslint-plugin-jsx-a11y | Static a11y linting | ✗ | — | None — must install |
| jest-axe | Automated a11y testing | ✗ | — | None — must install |

**Missing dependencies with no fallback:**
- eslint-plugin-jsx-a11y@6.10.2 — required for DOC-03 automated testing
- jest-axe@10.0.0 — required for DOC-03 automated testing

**Missing dependencies with fallback:**
None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="ui/"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | Token table documents all ~40 tokens from globals.css | manual | N/A — verify with grep/wc | ❌ Wave 0 |
| DOC-02 | Each component section includes API, variants, usage, do/don't | manual | N/A — verify sections present | ❌ Wave 0 |
| DOC-03 | All components pass axe-core accessibility checks | unit | `npm test -- --testPathPattern="ui/.*\\.test\\.tsx"` | ✅ (modify existing) |
| DOC-03 | ESLint jsx-a11y rules configured and passing | integration | `npm run lint` | ❌ Wave 0 |
| DOC-03 | VoiceOver manual testing completed for interactive components | manual | N/A — human verification | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="ui/"` (runs only UI component tests)
- **Per wave merge:** `npm test && npm run lint` (full suite + linting)
- **Phase gate:** Full test suite green + ESLint passing + VoiceOver checklist documented in README.md

### Wave 0 Gaps
- [ ] Install `jest-axe@10.0.0` and `eslint-plugin-jsx-a11y@6.10.2`
- [ ] Add `expect.extend(toHaveNoViolations)` to `jest.setup.ts`
- [ ] Configure `jsxA11y.flatConfigs.recommended` in `eslint.config.mjs`
- [ ] Create VoiceOver testing checklist template (referenced in Pattern 5)
- [ ] Verify existing component accessibility attributes before documentation (Open Question #1)

## Security Domain

> Skipped: Documentation phase has no security implications. No user input handling, no authentication, no data storage. ESLint rules are dev-time only.

## Sources

### Primary (HIGH confidence)
- Context7 /dequelabs/axe-core — Jest integration patterns, JSDOM limitations, config examples
- Context7 /jsx-eslint/eslint-plugin-jsx-a11y — Flat config setup, recommended rules
- npm registry — Verified versions: jest-axe@10.0.0 (2025-01-15), eslint-plugin-jsx-a11y@6.10.2 (2024-10-07)
- Project codebase — globals.css tokens, Button.tsx component structure, jest.config.ts, existing test patterns

### Secondary (MEDIUM confidence)
- [Documenting Design Tokens: A Guide to Best Practices with Supernova](https://www.supernova.io/blog/documenting-design-tokens-a-guide-to-best-practices-with-supernova) — Token documentation structure
- [How to Document UI Components: A Practical Guide | UIGuides](https://www.uxblueprints.com/guides/how-to-document-ui-components) — Component documentation best practices
- [WCAG 2.1 AA Guide for Beginners or Experts (Plain English) | Accessible.org](https://accessible.org/wcag-2-1-aa-guide-for-beginners-or-experts-plain-english/) — WCAG 2.1 AA requirements
- [How to Use VoiceOver for Accessibility Testing on macOS](https://www.netguru.com/blog/voiceover-accessibility-testing-macos) — VoiceOver testing workflow
- [jest-axe GitHub README](https://github.com/nickcolley/jest-axe) — Setup and usage patterns
- [React Best Practices: Documentation](https://rtcamp.com/handbook/react-best-practices/documentation/) — Documentation tooling tradeoffs

### Tertiary (LOW confidence)
- [W3C WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/?levels=aa) — Official spec (comprehensive but not implementation-focused)
- [Manual Accessibility Testing Checklist: Complete WCAG Guide for QA | Lead With Skills](https://www.leadwithskills.com/blogs/manual-accessibility-testing-checklist) — Manual testing scope

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm registry verified versions, Context7 docs confirm setup patterns
- Architecture: HIGH - Existing project has Jest/testing-library installed, patterns proven in 192 tests
- Pitfalls: MEDIUM - Common issues documented in axe-core examples and accessibility testing resources, some assumptions about token maintenance

**Research date:** 2026-05-08
**Valid until:** 60 days (2026-07-07) — stable domain; WCAG 2.1 unlikely to change, tooling versions confirmed current
