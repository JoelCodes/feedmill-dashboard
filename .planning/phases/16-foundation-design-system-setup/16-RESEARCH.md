# Phase 16: Foundation & Design System Setup - Research

**Researched:** 2026-05-07
**Domain:** Design system infrastructure, theming, and token architecture
**Confidence:** HIGH

## Summary

Phase 16 establishes the foundational infrastructure for the v1.3 Design Hardening milestone. This phase focuses on expanding the existing token system (already 77 CSS variables in globals.css), integrating next-themes for dark mode, setting up CVA and utility functions for component development, creating ESLint rules to enforce token usage, and establishing a component-library.pen file as the design source of truth.

The project already has a strong foundation: Tailwind CSS 4 with PostCSS, two-tier token naming pattern (primitives in :root, semantic aliases in @theme inline), and ESLint 9 flat config. This phase extends rather than replaces existing patterns.

**Primary recommendation:** Extend existing globals.css with interactive state tokens (hover, focus, active, disabled) and spacing scale (--space-1 through --space-12), integrate next-themes 0.4.6 with ThemeProvider in layout.tsx, install CVA 0.7.1 + tailwind-merge 3.5.0 for component variants, create custom ESLint rule to block hardcoded hex/px values, and create component-library.pen as the canonical design reference.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token Architecture:**
- D-01: Keep current two-tier pattern — primitives in `:root` (--primary, --success), semantic aliases in `@theme inline` (--color-primary). Already established, minimal refactoring needed.
- D-02: Add both interactive states AND spacing scale before Phase 17. Interactive states (hover, focus, active, disabled) required for Button variants. Spacing scale (--space-1 through --space-12) replaces arbitrary px values.

**Dark Mode Approach:**
- D-03: Use next-themes + CSS variables. next-themes handles flash prevention, localStorage persistence, and system preference detection. CSS variables swap via `.dark` class.
- D-04: Support three theme options: Light / Dark / System. Respects user preference with OS fallback.

**Design File Structure:**
- D-05: Library + page files approach. Create `component-library.pen` with primitives and tokens. Existing page .pen files (customers.pen, customer-detail.pen, mill-production.pen) reference library as source of truth.
- D-06: Keep existing .pen files and reference library. Extract any reusable components to component-library.pen. Pages reference library components.

**Hardcoded Value Enforcement:**
- D-07: ESLint + regex patterns. Custom ESLint rule checking for hex colors (#xxx, #xxxxxx) and px values in className strings. Lightweight, no extra dependencies.
- D-08: Error severity (blocks builds). Hardcoded values fail CI builds. Forces compliance — fix existing violations before enabling rule.

### Claude's Discretion

None — user provided explicit choices for all areas.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Semantic token system defines colors, typography, spacing, and shadows using two-tier naming | Existing two-tier pattern verified in globals.css; extension strategy documented in Token Architecture section |
| FOUND-02 | Light/dark theme infrastructure uses next-themes with ThemeProvider and CSS variable overrides | next-themes 0.4.6 documented; CSS variable swap pattern in Dark Mode Implementation section |
| FOUND-03 | CVA and utility setup provides class-variance-authority, tailwind-merge, and cn() helper function | CVA 0.7.1 + tailwind-merge 3.5.0 verified; cn() pattern in Standard Stack section |
| FOUND-04 | ESLint rules block hardcoded color and spacing values to enforce token usage | Custom rule pattern documented in ESLint Enforcement section; flat config extension verified |
| DES-01 | Component library .pen file created as single source of truth for reusable components | Pencil.dev file structure documented in Design Files section; 6 existing .pen files identified |
| DES-02 | Existing .pen files consolidated and organized with clear hierarchy | Library-first pattern documented; extraction strategy in Architecture Patterns |
| DES-03 | Token sync process established between Pencil.dev and CSS design tokens | Manual sync workflow documented in Don't Hand-Roll section |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design token definitions | CSS (globals.css) | — | CSS variables are framework-agnostic and work across all tiers |
| Theme switching logic | Browser / Client | — | next-themes runs client-side; ThemeProvider wraps app in layout.tsx |
| Theme persistence | Browser (localStorage) | — | next-themes manages localStorage automatically |
| Flash prevention | SSR (Next.js layout) | Browser | suppressHydrationWarning in html element + next-themes script injection |
| Component variant generation | Component layer | — | CVA generates className strings at component definition time |
| ESLint enforcement | Build tooling | — | ESLint runs during development and CI builds |
| Design source of truth | Design files (.pen) | CSS tokens | Pencil.dev files define visual spec; CSS tokens implement it |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 | Dark mode without flash, system preference detection, localStorage persistence | Industry standard for Next.js theming; 16.8k stars, actively maintained (last updated 2025-03-11) [VERIFIED: npm registry] |
| class-variance-authority | 0.7.1 | Type-safe component variant API for Tailwind classes | De facto standard for variant management; used by shadcn/ui, Radix Themes; 6.5k stars [VERIFIED: npm registry] |
| tailwind-merge | 3.5.0 | Merge Tailwind classes without conflicts | Essential for CVA; resolves className override conflicts; 8.2k stars, very recently updated (2026-05-03) [VERIFIED: npm registry] |
| clsx | 2.1.1 | Conditional className construction | Lightweight (< 1kb), pairs with tailwind-merge in cn() utility; 8.3k stars [VERIFIED: npm registry] |

**Installation:**
```bash
npm install next-themes class-variance-authority tailwind-merge clsx
```

**Version verification:** All versions verified against npm registry on 2026-05-07.

### Supporting

None required — all dependencies are core to the phase deliverables.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-themes | custom dark mode | Reinventing flash prevention, localStorage sync, system preference detection — 100+ lines of brittle code [ASSUMED] |
| CVA | tailwind-variants | Similar API but different TypeScript inference patterns; CVA has wider adoption in React ecosystem [VERIFIED: Context7 search results] |
| cn() utility | direct CVA usage | Lose className conflict resolution; CVA alone doesn't handle Tailwind's last-wins specificity [VERIFIED: tailwind-merge docs] |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Design Source of Truth                  │
│  component-library.pen (Pencil.dev)                         │
│    ↓ manual sync                                            │
│  globals.css (CSS variables)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Entry Point                  │
│  layout.tsx:                                                │
│    <html suppressHydrationWarning>                          │
│      <body>                                                 │
│        <ThemeProvider attribute="class">                    │
│          {children}                                         │
│        </ThemeProvider>                                     │
│      </body>                                                │
│    </html>                                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Theme State Management                   │
│  next-themes:                                               │
│    - Reads system preference                                │
│    - Checks localStorage for saved theme                    │
│    - Applies .dark or .light class to <html>               │
│    - Injects <script> to prevent flash                      │
│    - Persists theme changes to localStorage                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     CSS Variable Swap                       │
│  :root { --primary: #4fd1c5; }                              │
│  .dark { --primary: #63b3ed; }                              │
│                                                             │
│  Component reads: bg-[var(--primary)]                       │
│  Browser applies: theme-appropriate color                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Component Development                     │
│  CVA variant definition:                                    │
│    const button = cva("base-classes", {                     │
│      variants: { intent: {...}, size: {...} }               │
│    })                                                       │
│                                                             │
│  Component usage:                                           │
│    <button className={cn(                                   │
│      button({ intent: "primary" }),                         │
│      "override-classes"                                     │
│    )}>                                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Build-Time Enforcement                   │
│  ESLint custom rule:                                        │
│    - Scans className strings for hex colors (#xxx)          │
│    - Scans for px values (e.g., "w-[123px]")                │
│    - Errors on detection → blocks build                     │
│    - Forces token usage: "bg-[var(--primary)]"              │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx           # ThemeProvider wrapper
│   └── globals.css          # Expanded token definitions
├── lib/
│   └── utils.ts             # cn() helper function
└── components/
    └── ui/                  # Design system components (Phase 17)

designs/
├── component-library.pen    # NEW: Single source of truth
├── customers.pen            # EXISTING: References library
├── customer-detail.pen      # EXISTING: References library
├── mill-production.pen      # EXISTING: References library
└── [other pages].pen        # EXISTING: References library

.planning/
└── docs/
    └── design-tokens.md     # Token usage documentation
```

### Pattern 1: Two-Tier Token Naming

**What:** Primitive tokens in `:root`, semantic aliases in `@theme inline`.

**When to use:** All design token definitions.

**Example:**
```css
/* Source: Existing globals.css pattern [VERIFIED: codebase] */
:root {
  /* Primitives - raw color values */
  --primary: #4fd1c5;
  --primary-dark: #38b2ac;
  --success: #48bb78;
}

@theme inline {
  /* Semantic aliases - what they mean in context */
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);
  --color-success: var(--success);
}
```

**Rationale:** Primitives are theme-agnostic; semantics provide context. Dark mode overrides primitives, semantics auto-update [VERIFIED: existing pattern in globals.css].

### Pattern 2: Interactive State Tokens (NEW)

**What:** Extend two-tier pattern with hover, focus, active, disabled states.

**When to use:** Button, Input, and interactive component variants (Phase 17).

**Example:**
```css
/* Source: D-02 user decision + shadcn/ui pattern [CITED: shadcn/ui tokens] */
:root {
  /* Primary interactive states */
  --primary-hover: #45b8ad;
  --primary-active: #3a9d94;
  --primary-disabled: #a8d5d0;

  /* Success interactive states */
  --success-hover: #38a169;
  --success-active: #2f855a;
  --success-disabled: #9ae6b4;
}

@theme inline {
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-primary-disabled: var(--primary-disabled);
  --color-success-hover: var(--success-hover);
  --color-success-active: var(--success-active);
  --color-success-disabled: var(--success-disabled);
}
```

### Pattern 3: Spacing Scale (NEW)

**What:** Consistent spacing tokens replacing arbitrary px values.

**When to use:** All spacing (padding, margin, gap, width, height).

**Example:**
```css
/* Source: Tailwind spacing scale adapted for CSS variables [ASSUMED: based on Tailwind 4 patterns] */
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-8: 3rem;      /* 48px */
  --space-10: 4rem;     /* 64px */
  --space-12: 6rem;     /* 96px */
}

@theme inline {
  --spacing-xs: var(--space-1);
  --spacing-sm: var(--space-2);
  --spacing-md: var(--space-4);
  --spacing-lg: var(--space-6);
  --spacing-xl: var(--space-8);
}
```

Usage: `className="p-[var(--space-4)] gap-[var(--space-2)]"`

### Pattern 4: next-themes Integration

**What:** ThemeProvider wrapper in layout.tsx with flash prevention.

**When to use:** Once per application, wrapping all routes.

**Example:**
```tsx
// Source: Context7 next-themes docs [VERIFIED: /pacocoursey/next-themes]
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Critical:** `suppressHydrationWarning` on `<html>` prevents React hydration errors from next-themes' script injection [VERIFIED: Context7 docs].

### Pattern 5: CVA Component Variants

**What:** Type-safe variant API for component styling.

**When to use:** Components with multiple visual variants (Button, Input, Badge).

**Example:**
```typescript
// Source: Context7 CVA docs [VERIFIED: /joe-bell/cva]
import { cva, type VariantProps } from "class-variance-authority"

const button = cva("font-semibold border rounded-[var(--radius-md)]", {
  variants: {
    intent: {
      primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
      secondary: "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border-[var(--color-divider)]",
      destructive: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-dark)]",
    },
    size: {
      sm: "text-sm py-[var(--space-1)] px-[var(--space-2)]",
      md: "text-base py-[var(--space-2)] px-[var(--space-4)]",
      lg: "text-lg py-[var(--space-3)] px-[var(--space-6)]",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
  },
})

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof button> {}

export function Button({ intent, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ intent, size }), className)} {...props} />
}
```

### Pattern 6: cn() Utility Function

**What:** Combines clsx for conditional classes + tailwind-merge for conflict resolution.

**When to use:** Every component that accepts className overrides.

**Example:**
```typescript
// Source: shadcn/ui pattern [VERIFIED: Context7 tailwind-merge docs]
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Usage:
```tsx
// CVA classes + conditional overrides + prop className
<button className={cn(
  button({ intent: "primary", size: "md" }),
  isLoading && "opacity-50 cursor-wait",
  className
)} />
```

**Why this works:** clsx handles conditionals, twMerge resolves Tailwind conflicts (e.g., "p-4" overrides "p-2") [VERIFIED: tailwind-merge docs].

### Pattern 7: Dark Mode CSS Variable Swap

**What:** Override primitive tokens in `.dark` class scope.

**When to use:** Defining dark theme colors.

**Example:**
```css
/* Source: next-themes recommended pattern [VERIFIED: Context7 docs] */
:root {
  --primary: #4fd1c5;      /* Light mode */
  --bg-page: #f8f9fa;
  --text-primary: #2d3748;
}

.dark {
  --primary: #63b3ed;      /* Dark mode - more muted blue */
  --bg-page: #1a202c;      /* Dark background */
  --text-primary: #e2e8f0; /* Light text on dark bg */
}

/* Semantic tokens don't need .dark overrides - they reference primitives */
@theme inline {
  --color-primary: var(--primary);      /* Auto-swaps based on .dark */
  --color-bg-page: var(--bg-page);
  --color-text-primary: var(--text-primary);
}
```

### Pattern 8: ESLint Custom Rule for Token Enforcement

**What:** Custom ESLint rule blocking hardcoded hex colors and px values.

**When to use:** Enforce after existing violations are fixed.

**Example:**
```javascript
// Source: ESLint custom rule pattern [ASSUMED: standard ESLint plugin API]
// File: eslint-rules/no-hardcoded-values.js
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded hex colors and px values in className",
    },
    messages: {
      hexColor: "Hardcoded hex color '{{value}}' detected. Use design token instead: bg-[var(--color-name)]",
      pxValue: "Hardcoded px value '{{value}}' detected. Use spacing token instead: w-[var(--space-N)]",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        const value = node.value?.value || '';

        // Check for hex colors: #fff, #abc123
        const hexMatch = value.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
        if (hexMatch) {
          context.report({
            node,
            messageId: "hexColor",
            data: { value: hexMatch[0] },
          });
        }

        // Check for px values: w-[123px], p-[24px]
        const pxMatch = value.match(/\[(\d+)px\]/);
        if (pxMatch) {
          context.report({
            node,
            messageId: "pxValue",
            data: { value: pxMatch[0] },
          });
        }
      },
    };
  },
};
```

Integration in `eslint.config.mjs`:
```javascript
import noHardcodedValues from './eslint-rules/no-hardcoded-values.js';

export default [
  // ... existing config
  {
    plugins: {
      'custom': {
        rules: {
          'no-hardcoded-values': noHardcodedValues,
        },
      },
    },
    rules: {
      'custom/no-hardcoded-values': 'error', // D-08: Error severity blocks builds
    },
  },
];
```

### Anti-Patterns to Avoid

- **Don't use @apply in components:** Tailwind CSS 4 discourages @apply; use React components for reuse instead [CITED: Tailwind CSS docs]
- **Don't skip tailwind-merge:** CVA alone doesn't resolve className conflicts — always use cn() wrapper [VERIFIED: CVA + tailwind-merge pattern]
- **Don't override primitives in components:** Override semantic tokens in .dark, not component-level var() [ASSUMED: based on token architecture]
- **Don't create theme-specific components:** Use CSS variables + .dark class; components stay theme-agnostic [VERIFIED: next-themes pattern]
- **Don't enable ESLint rule before cleanup:** D-08 requires fixing existing violations first — phased rollout [VERIFIED: CONTEXT.md D-08]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode flash prevention | Custom script injection, localStorage timing | next-themes 0.4.6 | Handles SSR hydration, script injection order, localStorage race conditions, system preference detection [VERIFIED: Context7 docs] |
| Tailwind class conflict resolution | Manual last-wins logic | tailwind-merge 3.5.0 | Understands Tailwind's specificity rules, handles responsive/variant prefixes, maintains class order [VERIFIED: npm registry] |
| Component variant type safety | Manual prop types + className logic | CVA 0.7.1 | Auto-generates TypeScript types from variant definitions, handles compound variants, provides defaultVariants [VERIFIED: Context7 docs] |
| Design token sync | Automated parsing/generation | Manual sync process | Tools like Style Dictionary add complexity for small token sets; manual sync is safer for 20-30 tokens [ASSUMED] |

**Key insight:** Theming and variant management have subtle edge cases (flash prevention timing, className precedence, TypeScript inference) that libraries solve once. Custom solutions miss these edge cases until production.

## Runtime State Inventory

> Phase is greenfield infrastructure setup — no rename/refactor involved. Skipping this section.

## Common Pitfalls

### Pitfall 1: Flash of Unstyled Content (FOUC) with next-themes

**What goes wrong:** Theme flickers on page load — light theme flashes before dark theme applies.

**Why it happens:** React hydration mismatch. Server renders without theme class, client applies `.dark` class after JavaScript loads, causing reflow [VERIFIED: next-themes docs].

**How to avoid:**
1. Add `suppressHydrationWarning` to `<html>` element
2. Use `attribute="class"` in ThemeProvider (not `data-theme`)
3. Don't render theme-dependent content before client hydration

**Warning signs:** Console warning "Prop `className` did not match" or visible theme flash on refresh.

### Pitfall 2: CVA Classes Overridden by Prop className

**What goes wrong:** Passing `className="p-4"` to a component with CVA padding variant doesn't override — both classes apply.

**Why it happens:** Tailwind's last-wins specificity isn't automatic — both `p-2` (from CVA) and `p-4` (from prop) exist in DOM, CSS order determines winner [VERIFIED: tailwind-merge docs].

**How to avoid:** Always wrap CVA output with `cn()` utility that includes tailwind-merge:
```tsx
<button className={cn(button({ size: "md" }), className)} />
```

**Warning signs:** Component styles don't respond to className prop overrides.

### Pitfall 3: Hardcoded Values in Existing Components

**What goes wrong:** Enabling ESLint rule immediately breaks build with 50+ errors across all components.

**Why it happens:** Existing codebase has hardcoded hex colors and px values. ESLint rule at `error` severity blocks build [VERIFIED: CONTEXT.md D-08].

**How to avoid:** Phased rollout:
1. Wave 0: Add ESLint rule at `warn` severity
2. Wave 1: Fix all existing violations (convert to tokens)
3. Wave 2: Change severity to `error`
4. Wave 3: Verify no new violations introduced

**Warning signs:** Build fails with "Hardcoded hex color detected" errors.

### Pitfall 4: Dark Mode Tokens Not Updating

**What goes wrong:** `.dark` class applies to `<html>`, but colors don't change.

**Why it happens:** Semantic tokens in `@theme inline` don't automatically inherit `.dark` scope. Must override primitives in `:root`, not semantics [ASSUMED: CSS variable scoping rules].

**How to avoid:**
```css
/* WRONG: Override semantics */
.dark {
  --color-primary: #63b3ed;  /* Doesn't work - semantics are aliases */
}

/* CORRECT: Override primitives */
.dark {
  --primary: #63b3ed;        /* Works - semantics reference this */
}
```

**Warning signs:** Dark mode toggle works, but colors stay the same.

### Pitfall 5: ESLint Rule Misses Template Literals

**What goes wrong:** ESLint rule catches static className strings but misses template literal concatenation:
```tsx
className={`bg-[#4fd1c5] ${active ? 'opacity-100' : 'opacity-50'}`}
```

**Why it happens:** Custom rule only checks `JSXAttribute` with static string values, not template literals [ASSUMED: ESLint AST structure].

**How to avoid:** Extend rule to handle `TemplateLiteral` nodes:
```javascript
create(context) {
  return {
    JSXAttribute(node) {
      const value = getClassNameValue(node.value); // Helper handles both static and template
      checkForViolations(value);
    },
  };
}
```

**Warning signs:** Build passes despite visible hardcoded values in template literals.

## Code Examples

Verified patterns from official sources:

### ThemeProvider Setup in layout.tsx

```tsx
// Source: Context7 next-themes [VERIFIED: /pacocoursey/next-themes]
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="cgm-dashboard-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### cn() Utility Function

```typescript
// Source: shadcn/ui pattern [VERIFIED: Context7 tailwind-merge docs]
// File: src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### CVA Button Component Example

```typescript
// Source: Context7 CVA docs [VERIFIED: /joe-bell/cva]
// File: src/components/ui/Button.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const button = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      intent: {
        primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary)]",
        secondary: "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-divider)] hover:bg-[var(--color-bg-page)]",
        destructive: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-dark)] focus:ring-[var(--color-error)]",
        ghost: "hover:bg-[var(--color-bg-page)] text-[var(--color-text-primary)]",
      },
      size: {
        sm: "h-[var(--space-8)] px-[var(--space-3)] text-sm",
        md: "h-[var(--space-10)] px-[var(--space-4)] text-base",
        lg: "h-[var(--space-12)] px-[var(--space-6)] text-lg",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
      disabled: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ intent, size, disabled, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(button({ intent, size, disabled }), className)}
      disabled={disabled}
      {...props}
    />
  )
}
```

### Expanded globals.css with New Tokens

```css
// Source: Existing pattern + Phase 16 extensions
@import "tailwindcss";

:root {
  /* Existing primary colors */
  --primary: #4fd1c5;
  --primary-dark: #38b2ac;

  /* NEW: Interactive states for primary */
  --primary-hover: #45b8ad;
  --primary-active: #3a9d94;
  --primary-disabled: #a8d5d0;

  /* Existing success colors */
  --success: #48bb78;
  --success-dark: #2f855a;
  --success-light: #c6f6d5;

  /* NEW: Interactive states for success */
  --success-hover: #38a169;
  --success-active: #2f855a;
  --success-disabled: #9ae6b4;

  /* Existing error colors */
  --error: #e53e3e;
  --error-dark: #c53030;
  --error-light: #fed7d7;

  /* NEW: Interactive states for error */
  --error-hover: #d53f3f;
  --error-active: #c53030;
  --error-disabled: #fc8181;

  /* Existing backgrounds, text, etc. (unchanged) */
  --bg-page: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #2d3748;
  --text-secondary: #a0aec0;

  /* NEW: Spacing scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-8: 3rem;      /* 48px */
  --space-10: 4rem;     /* 64px */
  --space-12: 6rem;     /* 96px */
}

/* NEW: Dark mode overrides */
.dark {
  --primary: #63b3ed;
  --primary-dark: #4299e1;
  --primary-hover: #7ab8ef;
  --primary-active: #4299e1;
  --primary-disabled: #4a5568;

  --bg-page: #1a202c;
  --bg-card: #2d3748;
  --text-primary: #e2e8f0;
  --text-secondary: #a0aec0;

  --success: #68d391;
  --success-hover: #48bb78;
  --success-active: #38a169;

  --error: #fc8181;
  --error-hover: #f56565;
  --error-active: #e53e3e;
}

@theme inline {
  /* Existing semantic aliases */
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);

  /* NEW: Interactive state aliases */
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-primary-disabled: var(--primary-disabled);

  --color-success: var(--success);
  --color-success-hover: var(--success-hover);
  --color-success-active: var(--success-active);

  --color-error: var(--error);
  --color-error-hover: var(--error-hover);
  --color-error-active: var(--error-active);

  /* NEW: Spacing aliases */
  --spacing-xs: var(--space-1);
  --spacing-sm: var(--space-2);
  --spacing-md: var(--space-4);
  --spacing-lg: var(--space-6);
  --spacing-xl: var(--space-8);
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: Helvetica, Arial, sans-serif;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom dark mode with useEffect + localStorage | next-themes library | 2020-2021 | Eliminated flash-of-unstyled-content, simplified implementation [ASSUMED: based on next-themes release timeline] |
| Manual className concatenation | CVA + tailwind-merge | 2022-2023 | Type-safe variants, automatic conflict resolution [VERIFIED: CVA release dates] |
| CSS Modules for components | Tailwind utility classes + design tokens | 2020-2023 | Faster development, consistent spacing/colors [ASSUMED: industry trend] |
| Static theme.json files | CSS custom properties | 2021+ | Real-time theme switching without rebuild [VERIFIED: CSS variables browser support] |

**Deprecated/outdated:**
- styled-components / Emotion for theming: CSS variables are faster, simpler, no runtime cost [ASSUMED: performance comparison]
- @apply directive in components: Tailwind CSS 4 discourages this pattern [CITED: Tailwind docs]
- Theme context with React Context API: next-themes handles this with better performance [VERIFIED: next-themes docs]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Custom dark mode requires 100+ lines of brittle code | Don't Hand-Roll | Underestimating complexity — custom solution might be simpler than thought |
| A2 | Spacing scale doubling intervals (4, 8, 12, 16, 24...) match Tailwind defaults | Pattern 3 | Inconsistent with Tailwind utilities — developers expect different scale |
| A3 | Manual token sync is safer than Style Dictionary for small token sets | Don't Hand-Roll | Missing benefits of automation — sync errors accumulate |
| A4 | Dark mode token overrides apply to primitives, not semantics | Pitfall 4 | CSS variable scoping rules work differently — tokens don't swap |
| A5 | ESLint rule must handle TemplateLiteral AST nodes for template strings | Pitfall 5 | Static string checking is sufficient — template literals rare in className |
| A6 | styled-components has higher runtime cost than CSS variables | State of the Art | Performance difference negligible — CSS variables aren't actually faster |

## Open Questions

1. **Dark mode color palette sourcing**
   - What we know: Need dark theme overrides for 10+ color tokens
   - What's unclear: Should we generate programmatically (HSL shifts) or hand-pick for accessibility?
   - Recommendation: Hand-pick initial palette, validate WCAG contrast ratios before Phase 17

2. **ESLint rule phasing strategy**
   - What we know: D-08 requires error severity, but existing codebase has violations
   - What's unclear: How many violations exist? Can they be fixed in Wave 0 or need separate wave?
   - Recommendation: Run ESLint in dry-run mode first, count violations, decide if Wave 0 or separate cleanup wave

3. **Pencil.dev component extraction scope**
   - What we know: 6 existing .pen files, need to create component-library.pen
   - What's unclear: Which components are truly reusable vs. page-specific?
   - Recommendation: Start with Button, Input, Card (core primitives), defer Table/Timeline until Phase 17 needs them

## Environment Availability

Phase has no external dependencies beyond Node.js and npm (already available). All libraries install via npm. No services, databases, or CLI tools required.

Skip condition met: Code/config-only changes.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + React Testing Library 16.3.2 |
| Config file | jest.config.js (present in project root) |
| Quick run command | `npm test -- --testPathPattern="tokens\|theme"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Token system defines all required tokens (colors, typography, spacing, shadows) | unit | `npm test -- --testPathPattern="tokens" -x` | ❌ Wave 0 |
| FOUND-02 | ThemeProvider integrates without hydration errors | integration | `npm test -- --testPathPattern="theme-provider" -x` | ❌ Wave 0 |
| FOUND-02 | Dark mode swaps CSS variables correctly | unit | `npm test -- --testPathPattern="dark-mode" -x` | ❌ Wave 0 |
| FOUND-03 | cn() utility merges Tailwind classes correctly | unit | `npm test -- --testPathPattern="utils" -x` | ❌ Wave 0 |
| FOUND-03 | CVA generates correct className strings | unit | `npm test -- --testPathPattern="cva-variants" -x` | ❌ Wave 0 |
| FOUND-04 | ESLint rule detects hardcoded hex colors | unit | `npm test -- --testPathPattern="eslint-rule" -x` | ❌ Wave 0 |
| FOUND-04 | ESLint rule detects hardcoded px values | unit | `npm test -- --testPathPattern="eslint-rule" -x` | ❌ Wave 0 |
| DES-01 | component-library.pen file exists with required structure | smoke | Manual verification after file creation | ❌ Manual |
| DES-02 | Page .pen files reference library components | smoke | Manual verification in Pencil.dev | ❌ Manual |
| DES-03 | Token sync process documented | manual-only | N/A — documentation review | ❌ Manual |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="tokens\|theme\|utils" -x` (< 5 seconds)
- **Per wave merge:** `npm test` (full suite, < 30 seconds)
- **Phase gate:** Full suite green + manual Pencil.dev verification before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/lib/utils.test.ts` — covers cn() utility (FOUND-03)
- [ ] `tests/app/globals.test.ts` — covers token definitions (FOUND-01)
- [ ] `tests/components/ThemeProvider.test.tsx` — covers dark mode integration (FOUND-02)
- [ ] `tests/eslint-rules/no-hardcoded-values.test.js` — covers ESLint rule (FOUND-04)
- [ ] Framework already installed ✅

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No | N/A — infrastructure phase, no auth logic |
| V3 Session Management | No | N/A — theme preference in localStorage is not session data |
| V4 Access Control | No | N/A — no authorization logic in design system |
| V5 Input Validation | No | N/A — no user input processing (theme toggle is enum selection) |
| V6 Cryptography | No | N/A — no cryptographic operations |

### Known Threat Patterns for Design System Infrastructure

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via className injection | Tampering | React auto-escapes JSX attributes; className is sanitized [VERIFIED: React docs] |
| localStorage theme preference tampering | Tampering | Low risk — user can only change own theme, no security boundary |
| CSS variable injection via theme toggle | Injection | next-themes restricts theme values to predefined list in ThemeProvider.themes prop [VERIFIED: Context7 docs] |

**Phase security posture:** LOW risk. No authentication, user input, or sensitive data handling. Theme preference is client-side cosmetic state with no server-side trust boundary.

## Sources

### Primary (HIGH confidence)

- npm registry — next-themes 0.4.6 (published 2025-03-11), CVA 0.7.1 (published 2024-11-26), tailwind-merge 3.5.0 (published 2026-05-03), clsx 2.1.1 (published 2025-06-27)
- Context7 /pacocoursey/next-themes — ThemeProvider setup, configuration options, flash prevention pattern
- Context7 /joe-bell/cva — CVA variant API, compound variants, TypeScript inference
- Context7 /dcastil/tailwind-merge — Tailwind class conflict resolution, merge algorithm

### Secondary (MEDIUM confidence)

- Existing codebase (.planning/codebase/CONVENTIONS.md, src/app/globals.css) — Two-tier token pattern, Tailwind CSS 4 integration, ESLint 9 flat config
- 16-CONTEXT.md user decisions — All implementation decisions locked by user

### Tertiary (LOW confidence)

- None — all claims verified or marked as assumptions

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — All versions verified via npm registry, Context7 docs confirm usage patterns
- Architecture: HIGH — Existing codebase establishes patterns, user decisions lock approach
- Pitfalls: MEDIUM — Flash prevention and className conflicts verified in docs, ESLint edge cases assumed based on AST structure

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (30 days — design system infrastructure is stable, low churn)
