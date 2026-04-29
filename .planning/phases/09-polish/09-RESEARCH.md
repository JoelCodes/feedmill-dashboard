# Phase 9: Polish - Research

**Researched:** 2026-04-29
**Domain:** CSS design tokens, Tailwind v4 theming, pixel-perfect implementation
**Confidence:** HIGH

## Summary

Phase 9 converts hardcoded hex colors, text sizes, and inline styles in the mill production view to design tokens defined in globals.css. The project uses Tailwind CSS v4.2.4 with the @theme inline directive pattern for mapping CSS custom properties to Tailwind utilities. All hardcoded values (15 color instances, 3 text sizes, 1 shadow) must be replaced with semantic design tokens using the status-role naming pattern (`--status-{status}-{role}`).

**Primary recommendation:** Extend globals.css with status-specific color tokens and custom typography tokens using @theme inline directive, then replace all hardcoded values in mill-production/page.tsx with token-based Tailwind classes.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design token definitions | Frontend Server (SSR) | — | globals.css is imported at app root, tokens available to all components during SSR and client rendering |
| Token-to-utility mapping | Frontend Server (SSR) | — | @theme inline directive processes at build time, generates utility classes |
| Visual styling application | Browser / Client | — | Tailwind utilities apply styles in browser, CSS variables resolve at runtime |
| Typography consistency | Frontend Server (SSR) | — | Custom text size tokens defined in theme, consistent across SSR and client |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLSH-01 | Mill production view matches .pen design spacing and typography | Custom text size tokens (--text-11, --text-15) enable 11px and 15px sizes not in Tailwind's default scale |
| POLSH-02 | Filter pills match .pen design colors and styling | Status-specific color tokens with 22% opacity variants for countBg enable exact color matching without hardcoded hex |
| POLSH-03 | Cards match .pen design shadow and border styling | Existing --shadow-card token replaces inline boxShadow, status border tokens replace hex colors |
</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Design Tokens — Colors
- **D-01:** Extend globals.css with new status-specific tokens — do NOT use hardcoded hex colors anywhere
- **D-02:** Use status-role naming pattern: `--status-{status}-{role}` (e.g., `--status-completed-border`, `--status-mixing-header`)
- **D-03:** Add tokens for all STATE_COLORS values currently using hex:
  - Completed: border (#38a169), header (#276749)
  - Mixing: border (#d69e2e), header (#975a16)
  - Blocked: border (#e53e3e), header (#c53030)
  - Pending: border (#a0aec0), header (#4a5568)
- **D-04:** Add 22% opacity variants for countBg: `--status-{status}-bg-22`

#### Design Tokens — Typography
- **D-05:** Add custom text size tokens to @theme for non-standard sizes:
  - `--text-11` or `text-card-label` for 11px
  - `--text-15` or `text-card-title` for 15px
- **D-06:** Use Tailwind @theme extension pattern, consistent with existing token definitions

#### Shadows
- **D-07:** Use existing `--shadow-card` token for ProductionCard instead of inline boxShadow
- **D-08:** Remove inline `style={{ boxShadow: ... }}` and replace with Tailwind class

#### Spacing
- **D-09:** Trust current spacing implementation — no changes needed to gap/padding/margin values

#### Text Colors
- **D-10:** Replace hardcoded text colors (#718096, #2d3748, #4a5568) with design tokens
- **D-11:** Map to existing or new tokens: `--text-secondary` (#718096), `--text-primary` (#2d3748)

### Claude's Discretion
- Exact naming for typography tokens (text-card-label vs text-11)
- How to structure @theme extensions for new tokens
- Whether to add missing text color tokens or map to closest existing

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.4 | CSS framework with design token support | Industry standard for utility-first CSS, v4 adds CSS-native configuration via @theme directive [VERIFIED: npm registry] |
| Next.js | 16.2.4 | React framework with SSR | Used throughout project, handles CSS import and processing [VERIFIED: package.json] |
| React | 19.2.5 | UI library | Project foundation, component-based architecture [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-plugin-tailwindcss | 4.0.0-beta.0 | Tailwind v4-compatible linting | Already configured, warns on class order and contradicting classes [VERIFIED: eslint.config.mjs] |
| Jest + Testing Library | 30.3.0 + 16.3.2 | Component testing | Test that token-based classes apply correctly [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @theme inline | JavaScript tailwind.config | v4 deprecates JS config in favor of CSS-first approach, inline is required when referencing other CSS variables [CITED: tailwindcss.com/docs/theme] |
| CSS custom properties | SCSS variables | CSS variables exist at runtime (can be changed by JS, scoped to elements), SCSS variables compile away [CITED: smashingmagazine.com/2018/05/css-custom-properties-strategy-guide/] |
| Hex with alpha (#rrggbbaa) | rgba() or oklch() | Hex-8 more concise for design tokens, rgba() more explicit, oklch() perceptually uniform but less familiar [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch] |

**Installation:**
```bash
# No new packages required — all dependencies already installed
```

**Version verification:** Verified against npm registry on 2026-04-29.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Request                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js App Router (SSR)                      │
│  - Loads src/app/globals.css (design tokens in :root)      │
│  - Processes @theme inline → generates utility classes      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            mill-production/page.tsx (Server)                │
│  - Renders component tree with token-based classes         │
│  - STATE_COLORS: Record<Status, { border: string, ... }>   │
│    now uses CSS variable strings instead of hex            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Browser Rendering                         │
│  - Resolves var(--status-completed-border) from :root      │
│  - Applies Tailwind utilities (text-card-label, shadow-md) │
│  - Renders pixel-perfect match to .pen design              │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. globals.css defines tokens as CSS custom properties in :root
2. @theme inline maps custom properties to Tailwind utility classes
3. Components use semantic Tailwind classes (text-status-completed-header) or arbitrary values (text-[var(--text-secondary)])
4. Browser resolves CSS variables at runtime, applies computed styles

### Component Responsibilities

| Component | File | Responsibilities |
|-----------|------|------------------|
| Design System | src/app/globals.css | Define all design tokens in :root, map to Tailwind via @theme inline |
| Mill Production Page | src/app/mill-production/page.tsx | Use token-based classes, no hardcoded colors/sizes/shadows |
| Production Card | ProductionCard component in page.tsx | Apply status border via CSS variable, use shadow-card class |
| State Column | StateColumn component in page.tsx | Apply status header via CSS variable |
| Filter Pills | PRODUCTION_STATE_PILL_CONFIG | Use FilterPillColorConfig with countBg token |

### Recommended Project Structure
```
src/
├── app/
│   ├── globals.css          # EXTEND: Add status/typography tokens
│   └── mill-production/
│       └── page.tsx          # REFACTOR: Replace hardcoded values
├── components/
│   └── FilterPill.tsx        # NO CHANGE: Already uses color prop
└── types/
    └── millProduction.ts     # NO CHANGE: ProductionState type unchanged
```

### Pattern 1: Design Token Definition (Tailwind v4 @theme inline)

**What:** Define CSS custom properties in :root, then map them to Tailwind utilities using @theme inline directive when they reference other variables.

**When to use:** Always for design tokens that need to be available as Tailwind utilities. Use `inline` when token value is `var(--other-token)`.

**Example:**
```css
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";

:root {
  /* Raw color values */
  --status-completed-border: #38a169;
  --status-completed-header: #276749;

  /* Opacity variant using hex alpha channel */
  --status-completed-bg-22: #2f855a38;  /* ~22% opacity */

  /* Typography */
  --text-11: 0.6875rem;  /* 11px */
  --text-15: 0.9375rem;  /* 15px */
}

@theme inline {
  /* Map to Tailwind utilities */
  --color-status-completed-border: var(--status-completed-border);
  --color-status-completed-header: var(--status-completed-header);
  --text-card-label: var(--text-11);
  --text-card-title: var(--text-15);
}
```

**Usage in components:**
```tsx
// Tailwind utility class (preferred)
<span className="text-status-completed-header">Completed</span>

// Arbitrary value with CSS variable (when utility doesn't exist)
<span className="text-[var(--status-completed-header)]">Completed</span>

// Inline style (last resort, only for dynamic values)
<div style={{ backgroundColor: 'var(--status-completed-bg-22)' }} />
```

### Pattern 2: Three-Layer Token System

**What:** Separate primitive values, semantic tokens, and component-specific tokens for maintainability.

**When to use:** Design systems that need to support theming, ensure consistency, and enable easy updates.

**Example:**
```css
:root {
  /* Layer 1: Primitives (raw values) */
  --green-600: #38a169;
  --green-700: #276749;

  /* Layer 2: Semantic (intent-based) */
  --color-success: var(--green-600);
  --color-success-dark: var(--green-700);

  /* Layer 3: Component-specific (context-based) */
  --status-completed-border: var(--color-success);
  --status-completed-header: var(--color-success-dark);
}
```

**Why:** Updates cascade correctly (changing --green-600 updates all success colors), intent is clear, theming is straightforward. [CITED: smashingmagazine.com/2018/05/css-custom-properties-strategy-guide/]

### Pattern 3: Opacity with Hex Alpha Channel

**What:** Use 8-digit hex colors for opacity variants instead of rgba() when defining design tokens.

**When to use:** Design tokens that need semi-transparent versions of base colors, especially for backgrounds.

**Example:**
```css
:root {
  --status-completed-base: #2f855a;

  /* 22% opacity = 0.22 * 255 ≈ 56 = 0x38 in hex */
  --status-completed-bg-22: #2f855a38;

  /* Alternative formats (equivalent) */
  --status-completed-bg-22-rgba: rgba(47, 133, 90, 0.22);
  --status-completed-bg-22-oklch: oklch(0.52 0.1 155 / 0.22);
}
```

**Why:** Hex-8 is more concise for tokens, browser support is universal (all modern browsers), alpha channel is the last 2 digits (00=transparent, FF=opaque). [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch]

### Pattern 4: Replacing Inline Styles with Token Classes

**What:** Convert `style={{ property: value }}` to Tailwind utility classes using design tokens.

**When to use:** Hardcoded inline styles that should use design tokens for consistency and maintainability.

**Example:**
```tsx
// BEFORE: Hardcoded inline style
<div
  className="rounded-r-xl bg-white"
  style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}
/>

// AFTER: Token-based Tailwind class
<div className="rounded-r-xl bg-white shadow-card" />

// globals.css already has:
// --shadow-card: 0 3.5px 5px rgba(0, 0, 0, 0.03);
```

**Why:** Single source of truth for shadows, updates propagate automatically, easier to maintain, better for theming.

### Anti-Patterns to Avoid

- **Hardcoded hex colors in JSX/TSX:** Use design tokens instead — updating colors requires finding all instances, easy to create inconsistencies
- **Inline styles for design system values:** Use Tailwind classes — inline styles bypass design system, harder to audit and maintain
- **Magic numbers for font sizes:** Use semantic typography tokens — 11px and 15px should be named (text-card-label, text-card-title) for clarity
- **Mixing token layers:** Don't reference primitive tokens in components — always use semantic or component-specific tokens for easier refactoring

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Custom color opacity calculations | Manual rgba conversion, opacity utilities | Hex alpha channel (#rrggbbaa) | 22% opacity as hex is ~38, consistent with existing tokens, no runtime calculation needed |
| Design token migration script | Custom find/replace regex | Manual refactoring with ESLint enforcement | This phase has 15 instances — manual is safer, ESLint prevents regression |
| Shadow value variations | Multiple custom shadow values | Existing --shadow-card token | Design already has defined shadow, current inline shadow (0 2px 8px 0.05) close to existing --shadow-card (0 3.5px 5px 0.03) |
| Custom typography scale | Arbitrary text sizes everywhere | Semantic typography tokens | text-card-label and text-card-title make intent clear, maintainable if design changes |

**Key insight:** Design token systems are about consistency and maintainability, not automation complexity. With only 15 hardcoded values in one file, manual refactoring with careful testing is more reliable than building custom codemods. Establish the token architecture correctly, then enforce it with linting.

## Common Pitfalls

### Pitfall 1: @theme inline vs @theme confusion
**What goes wrong:** Using `@theme` instead of `@theme inline` when mapping `var(--other-token)` causes CSS variable resolution failures.

**Why it happens:** The `inline` option inlines the variable's value at the definition point rather than creating a reference. Without it, the variable resolves at `:root` where the referenced variable may not exist.

**How to avoid:** Use `@theme inline` when the value is `var(--something)`. Use `@theme` for literal values.

**Warning signs:**
- Browser DevTools shows computed value as `var(--undefined)` or initial value
- Tailwind utility class exists but doesn't apply expected color
- CSS variables work in :root but not in utilities

### Pitfall 2: Hex alpha channel conversion errors
**What goes wrong:** Converting percentage opacity to hex alpha channel incorrectly (e.g., using 22 instead of 38 for 22% opacity).

**Why it happens:** Hex alpha is 0-255 scale encoded as 00-FF, not 0-100 percentage. 22% = 0.22 * 255 ≈ 56 decimal = 0x38 hex.

**How to avoid:** Use opacity percentage to hex calculator or formula: `Math.round(opacity * 255).toString(16).padStart(2, '0')`.

**Warning signs:**
- Background appears fully opaque or fully transparent
- Color intensity doesn't match design
- Opacity looks like ~8% instead of 22%

### Pitfall 3: Text color token mapping assumptions
**What goes wrong:** Assuming #718096 maps to existing --text-secondary when they're different values.

**Why it happens:** globals.css has `--text-secondary: #a0aec0` but mill-production uses `#718096` in 6 places. These are different grays.

**How to avoid:** Check existing token values before mapping. Create new token if no match exists, or verify with design if existing token should be used instead.

**Warning signs:**
- Text appears lighter/darker than before refactoring
- Multiple gray shades in same context (inconsistency)
- Designer reports color mismatch after implementation

### Pitfall 4: Shadow token mismatch
**What goes wrong:** Replacing inline shadow with --shadow-card token changes visual appearance because values differ.

**Why it happens:**
- Inline: `0 2px 8px rgba(0, 0, 0, 0.05)`
- Token: `0 3.5px 5px rgba(0, 0, 0, 0.03)`

Different blur radius (8px vs 5px) and opacity (0.05 vs 0.03).

**How to avoid:** Verify with design whether existing token should be used (preferred for consistency) or new token should match exact shadow.

**Warning signs:**
- Card shadows appear softer/sharper after refactoring
- Shadow spread differs from .pen design
- Visual regression in screenshot comparison

### Pitfall 5: Typography token naming confusion
**What goes wrong:** Using technical names (text-11, text-15) when semantic names (text-card-label, text-card-title) would be clearer.

**Why it happens:** Pixel values are precise but don't communicate intent. Future designers may not know what "11px" represents.

**How to avoid:** Prefer semantic names that describe usage over technical names that describe implementation. User has discretion here (D-05).

**Warning signs:**
- Code reviewer asks "what is text-11 for?"
- Similar font sizes with different semantic meanings
- Refactoring requires searching all text-11 usages to understand context

## Code Examples

Verified patterns from official sources and existing codebase:

### Extending globals.css with Status Tokens

```css
/* Source: Existing globals.css + Tailwind v4 docs */
@import "tailwindcss";

:root {
  /* Existing tokens... */

  /* NEW: Status color tokens (D-01, D-02, D-03) */
  --status-completed-border: #38a169;
  --status-completed-header: #276749;
  --status-completed-bg-22: #2f855a38;  /* 22% opacity */

  --status-mixing-border: #d69e2e;
  --status-mixing-header: #975a16;
  --status-mixing-bg-22: #975a1638;

  --status-blocked-border: #e53e3e;
  --status-blocked-header: #c53030;
  --status-blocked-bg-22: #c5303038;

  --status-pending-border: #a0aec0;
  --status-pending-header: #4a5568;
  --status-pending-bg-22: #71809638;

  /* NEW: Typography tokens (D-05, D-06) */
  --text-11: 0.6875rem;  /* 11px */
  --text-15: 0.9375rem;  /* 15px */

  /* NEW: Text color token (D-10, D-11) */
  --text-muted: #718096;  /* Currently hardcoded in 6 places */
  --text-medium: #4a5568; /* Currently hardcoded in 1 place */
}

@theme inline {
  /* Map status colors to Tailwind utilities */
  --color-status-completed-border: var(--status-completed-border);
  --color-status-completed-header: var(--status-completed-header);
  --color-status-mixing-border: var(--status-mixing-border);
  --color-status-mixing-header: var(--status-mixing-header);
  --color-status-blocked-border: var(--status-blocked-border);
  --color-status-blocked-header: var(--status-blocked-header);
  --color-status-pending-border: var(--status-pending-border);
  --color-status-pending-header: var(--status-pending-header);

  /* Map typography tokens */
  --text-card-label: var(--text-11);
  --text-card-title: var(--text-15);

  /* Map text color tokens */
  --color-text-muted: var(--text-muted);
  --color-text-medium: var(--text-medium);
}
```

### Refactoring STATE_COLORS to Use Tokens

```tsx
// Source: Current mill-production/page.tsx (BEFORE)
const STATE_COLORS: Record<
  ProductionState,
  { border: string; header: string }
> = {
  Completed: { border: "#38a169", header: "#276749" },
  Mixing: { border: "#d69e2e", header: "#975a16" },
  Blocked: { border: "#e53e3e", header: "#c53030" },
  Pending: { border: "#a0aec0", header: "#4a5568" },
};

// AFTER: Using CSS variables
const STATE_COLORS: Record<
  ProductionState,
  { border: string; header: string }
> = {
  Completed: {
    border: "var(--status-completed-border)",
    header: "var(--status-completed-header)",
  },
  Mixing: {
    border: "var(--status-mixing-border)",
    header: "var(--status-mixing-header)",
  },
  Blocked: {
    border: "var(--status-blocked-border)",
    header: "var(--status-blocked-header)",
  },
  Pending: {
    border: "var(--status-pending-border)",
    header: "var(--status-pending-header)",
  },
};
```

### Refactoring PRODUCTION_STATE_PILL_CONFIG countBg

```tsx
// Source: Current mill-production/page.tsx (BEFORE)
const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
    dot: "bg-success",
    countBg: "bg-[#2f855a22]",  // HARDCODED
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    countBg: "bg-[#975a1622]",  // HARDCODED
  },
  // ... etc
};

// AFTER: Using CSS variable arbitrary values
const PRODUCTION_STATE_PILL_CONFIG: Record<ProductionState, FilterPillColorConfig> = {
  Completed: {
    bg: "bg-success-light",
    text: "text-success-dark",
    dot: "bg-success",
    countBg: "bg-[var(--status-completed-bg-22)]",
  },
  Mixing: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    countBg: "bg-[var(--status-mixing-bg-22)]",
  },
  // ... etc
};
```

### Refactoring ProductionCard Shadow and Typography

```tsx
// Source: Current ProductionCard component (BEFORE)
function ProductionCard({ order }: { order: ProductionOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div
      className="relative overflow-hidden rounded-r-xl bg-white"
      style={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",  // HARDCODED
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pl-5 pr-4">
        <p className="text-[11px] font-semibold text-[#718096]">
          {order.customerName}
        </p>
        <p className="mt-1 text-[15px] font-bold text-[#2d3748]">
          {order.feedType}
        </p>
        <p className="mt-2 text-sm font-medium text-[#4a5568]">
          {formatWeight(order.weightLbs)}
        </p>
        <p className="mt-1.5 text-xs font-medium text-[#718096]">
          Order #{order.orderNumber}
        </p>
      </div>
    </div>
  );
}

// AFTER: Using design tokens
function ProductionCard({ order }: { order: ProductionOrder }) {
  const borderColor = STATE_COLORS[order.state].border;

  return (
    <div
      className="relative overflow-hidden rounded-r-xl bg-white shadow-card"
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: borderColor }}
      />
      <div className="py-2.5 pl-5 pr-4">
        <p className="text-card-label font-semibold text-muted">
          {order.customerName}
        </p>
        <p className="mt-1 text-card-title font-bold text-primary">
          {order.feedType}
        </p>
        <p className="mt-2 text-sm font-medium text-medium">
          {formatWeight(order.weightLbs)}
        </p>
        <p className="mt-1.5 text-xs font-medium text-muted">
          Order #{order.orderNumber}
        </p>
      </div>
    </div>
  );
}
```

### Test Pattern for Token Application

```tsx
// Source: Existing FilterPill.test.tsx pattern
import { render, screen } from '@testing-library/react';

describe('ProductionCard token application', () => {
  it('applies shadow-card class instead of inline style', () => {
    const mockOrder = {
      id: '1',
      state: 'Completed' as ProductionState,
      customerName: 'Test',
      feedType: 'Grower',
      weightLbs: 1000,
      orderNumber: 'ORD-001',
      millLine: 'Premix',
    };

    const { container } = render(<ProductionCard order={mockOrder} />);
    const card = container.querySelector('.shadow-card');
    expect(card).toBeInTheDocument();
  });

  it('uses CSS variable for border color', () => {
    const mockOrder = {
      id: '1',
      state: 'Completed' as ProductionState,
      // ... other fields
    };

    const { container } = render(<ProductionCard order={mockOrder} />);
    const border = container.querySelector('.absolute.left-0');
    expect(border).toHaveStyle({
      backgroundColor: 'var(--status-completed-border)',
    });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind config.js | @theme directive in CSS | Tailwind v4.0 (2024) | Configuration now co-located with styles, CSS-native approach |
| Hardcoded hex colors | Design token system with CSS variables | Ongoing migration | Easier theming, consistent colors, single source of truth |
| RGBA for opacity | Hex-8 alpha channel | CSS Color Module Level 4 | More concise, equivalent browser support |
| Fixed pixel sizes | Semantic typography tokens | Design system maturity | Intent-driven sizing, easier to maintain |

**Deprecated/outdated:**
- **tailwind.config.js theme extension:** Tailwind v4 deprecates JS config in favor of @theme directive [CITED: tailwindcss.com/blog/tailwindcss-v4]
- **Inline styles for design system values:** Modern approach uses utility classes with design tokens for consistency

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing --shadow-card token (0 3.5px 5px rgba(0,0,0,0.03)) is close enough to inline shadow (0 2px 8px rgba(0,0,0,0.05)) for replacement | Don't Hand-Roll | Visual mismatch if designer expects exact inline shadow — requires new token or adjustment |
| A2 | Text color #718096 should get new token --text-muted instead of mapping to existing --text-secondary (#a0aec0) | Common Pitfalls | Creates unnecessary token if existing --text-secondary is correct per design system |
| A3 | Semantic typography token names (text-card-label, text-card-title) preferred over technical names (text-11, text-15) | Architecture Patterns | User has discretion (D-05), either approach valid — semantic names assumed better for maintainability |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

Note: A1-A3 are low-risk assumptions within Claude's discretion per CONTEXT.md. Planner should verify shadow appearance and text color mapping during implementation.

## Open Questions

1. **Shadow token exact match**
   - What we know: Inline shadow is `0 2px 8px rgba(0, 0, 0, 0.05)`, existing token is `0 3.5px 5px rgba(0, 0, 0, 0.03)`
   - What's unclear: Whether design requires exact inline shadow or existing token is acceptable
   - Recommendation: Use existing --shadow-card for consistency, flag visual difference for designer review in verification

2. **Text color token creation**
   - What we know: #718096 appears 6 times, #4a5568 appears 1 time, existing --text-secondary is #a0aec0 (different)
   - What's unclear: Whether to create new tokens or use existing --text-secondary
   - Recommendation: Create --text-muted (#718096) and --text-medium (#4a5568) for accuracy, map in @theme inline

3. **Typography token naming preference**
   - What we know: User decision D-05 lists both options (--text-11 or text-card-label)
   - What's unclear: Which naming convention user prefers
   - Recommendation: Use semantic names (text-card-label, text-card-title) for clarity, can rename if user requests

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + Testing Library 16.3.2 |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern=FilterPill` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POLSH-01 | Typography tokens apply correct 11px and 15px sizes | unit | `npm test -- --testPathPattern=mill-production` | ❌ Wave 0 |
| POLSH-02 | Filter pills use status-specific countBg tokens with 22% opacity | unit | `npm test -- --testPathPattern=FilterPill` | ✅ FilterPill.test.tsx |
| POLSH-03 | Cards use shadow-card token and status border tokens | unit | `npm test -- --testPathPattern=mill-production` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=mill-production` (once Wave 0 complete)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + visual regression check against .pen design

### Wave 0 Gaps
- [ ] `src/app/mill-production/page.test.tsx` — covers POLSH-01, POLSH-03
  - Test: ProductionCard applies shadow-card class (not inline style)
  - Test: ProductionCard text uses text-card-label and text-card-title classes
  - Test: StateColumn header uses CSS variable for color
  - Test: Border color resolves to correct CSS variable per state

*(FilterPill.test.tsx already exists and covers POLSH-02 color prop behavior)*

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4.0 Theme Variables](https://tailwindcss.com/docs/theme) - @theme inline directive, theme extension patterns, typography/spacing tokens
- [Tailwind CSS v4.0 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first configuration approach, deprecation of JS config
- npm registry - Verified versions for tailwindcss@4.2.4, next@16.2.4, react@19.2.5 (2026-04-29)
- Project codebase - globals.css existing token pattern, eslint.config.mjs, jest.config.ts, FilterPill.test.tsx

### Secondary (MEDIUM confidence)
- [A Strategy Guide To CSS Custom Properties — Smashing Magazine](https://www.smashingmagazine.com/2018/05/css-custom-properties-strategy-guide/) - Three-layer token system, scoping strategy, runtime advantages
- [Designing Beautiful Shadows in CSS • Josh W. Comeau](https://www.joshwcomeau.com/css/designing-shadows/) - Shadow design tokens, CSS custom properties for shadows
- [Chasing the Pixel-Perfect Dream • Josh W. Comeau](https://www.joshwcomeau.com/css/pixel-perfection/) - Modern perspective on pixel perfection, focus on consistency over exactness
- [Tailwind CSS v4 Design Tokens Migration Guide](https://www.oneminutebranding.com/blog/tailwind-v4-design-tokens) - Migration from hardcoded values to design tokens
- [How I Add Opacity to Colors in CSS • TheLinuxCode](https://thelinuxcode.com/how-i-add-opacity-to-colors-in-css-modern-patterns-for-2026/) - Modern CSS opacity patterns, hex-8 alpha channel, rgba vs oklch
- [oklch() CSS function - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch) - OKLCH color space, perceptually uniform colors

### Tertiary (LOW confidence)
- None — all claims verified against official docs or project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Versions verified against npm registry, existing project dependencies
- Architecture: HIGH - Tailwind v4 docs provide authoritative @theme inline patterns, project already uses this approach
- Pitfalls: MEDIUM-HIGH - Hex alpha conversion and CSS variable resolution are well-documented, shadow/color token mapping based on code analysis

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days - Tailwind v4 stable, design token patterns mature)
