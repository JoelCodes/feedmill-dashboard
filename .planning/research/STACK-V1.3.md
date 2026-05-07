# Technology Stack: Design System & Theming

**Project:** CGM Dashboard v1.3
**Researched:** 2026-05-07
**Context:** Adding design system foundation to existing Next.js 15/React 19/Tailwind CSS 4 app

## Recommended Stack Additions

### Core Theming
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next-themes | ^0.4.6 | Theme management & persistence | Industry standard for Next.js dark mode. Zero-flash theme switching, SSR-safe, localStorage persistence. Works seamlessly with Next.js 15 App Router. 2,900+ GitHub stars, actively maintained (March 2025). |
| tw-animate-css | ^1.4.0 | Animations for Tailwind CSS 4 | Modern replacement for tailwindcss-animate designed for Tailwind v4's CSS-first architecture. Pure CSS solution without JavaScript plugins. Provides animate-in/out utilities and presets like accordion-down. |

### Component Variant Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| class-variance-authority | ^0.7.1 | Type-safe component variants | TypeScript-first utility for creating variant-based components. Framework-agnostic, works with any CSS (not Tailwind-specific). Simpler than tailwind-variants for basic variant needs. Battle-tested pattern used by shadcn/ui. |
| tailwind-merge | ^3.5.0 | Tailwind class conflict resolution | Intelligently merges Tailwind classes, handling conflicts automatically. Essential for components accepting className props. Latest version (May 2026) optimized for performance with internal caching. |
| clsx | ^2.1.1 | Conditional class names | Lightweight utility (228 bytes) for conditional className logic. Perfect companion to tailwind-merge for the cn() utility pattern. Handles objects, arrays, falsy values cleanly. |

### Component Primitives (Optional/As-Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.15 | Accessible modal dialogs | If you need modals/dialogs (e.g., settings, confirmations). Unstyled, WAI-ARIA compliant. |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Accessible dropdown menus | If you need complex dropdown menus beyond basic selects. |
| @radix-ui/react-select | ^2.2.6 | Accessible custom selects | If native selects don't meet UX requirements. |
| @radix-ui/react-tooltip | ^1.2.8 | Accessible tooltips | For contextual help and icon labels. |

**Note:** Install Radix primitives only when needed. Start without them and add specific primitives for specific use cases. Each primitive is ~10-20KB, so selective installation keeps bundle size down.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Theme Management | next-themes | better-themes | next-themes is more battle-tested (2,900+ stars vs 30+) and has better Next.js integration patterns. |
| Component Variants | CVA | tailwind-variants ^3.2.2 | tailwind-variants adds responsive variants and slots, but adds complexity (10KB vs 2KB). CVA is sufficient for this project's needs and framework-agnostic. |
| Animations | tw-animate-css | tailwindcss-animate | tailwindcss-animate uses legacy JavaScript plugin system incompatible with Tailwind v4. tw-animate-css is pure CSS. |
| Component Library | Custom + Radix | shadcn/ui | shadcn/ui is excellent but overkill for this stage. Requires additional setup (components.json, CLI workflow, lucide-react icons). Better to build custom components using primitives only when needed. |
| Component Library | Custom + Radix | DaisyUI | DaisyUI provides pre-styled components with themes, but conflicts with custom design tokens approach. Ships semantic classes that add abstraction layer. Better for rapid prototyping than custom design systems. |

## Integration with Existing Setup

### Tailwind CSS 4 Integration

Your existing `globals.css` already follows Tailwind v4 patterns:
- ✓ CSS variables in `:root` (not `@layer base`)
- ✓ `@theme inline` directive for Tailwind utilities
- ✓ Design tokens for colors, typography, spacing
- ✓ Status-specific tokens with opacity variants

**Required changes:**
1. **Add dark mode variables** — Define `:root[data-theme="dark"]` selector with alternate color values
2. **Update @theme inline** — Ensure theme colors include `hsl()` or `oklch()` wrappers for proper color manipulation
3. **Add animation imports** — `@import "tw-animate-css"` after `@import "tailwindcss"`

### next-themes Setup

```tsx
// src/app/layout.tsx (already exists, modify)
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Why `data-theme` attribute:**
- Plays nicely with CSS selector `:root[data-theme="dark"]`
- Avoids confusion with Tailwind's `dark:` variant (which can use class or media query)
- Clear separation: `data-theme` for theme switching, `dark:` variant for Tailwind utilities

### Component Variant Pattern (CVA + tailwind-merge)

Create utility function at `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Example component with variants:

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-dark",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        outline: "border border-divider bg-transparent hover:bg-gray-50",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

## Installation Commands

```bash
# Core theming and variant management
npm install next-themes class-variance-authority tailwind-merge clsx tw-animate-css

# Radix primitives (install as needed, not all at once)
npm install @radix-ui/react-dialog      # for modals
npm install @radix-ui/react-dropdown-menu  # for dropdowns
npm install @radix-ui/react-select      # for custom selects
npm install @radix-ui/react-tooltip     # for tooltips
```

## What NOT to Add (Over-Engineering)

### ❌ Full shadcn/ui Installation
**Why avoid:** Adds CLI workflow, components.json config, lucide-react dependency (140+ icons), and opinionated file structure. You already have basic components working. Build custom components as needed using raw Radix primitives.

**When to reconsider:** If you find yourself needing 5+ Radix-based components with consistent styling patterns.

### ❌ Style Dictionary or Design Token Tools
**Why avoid:** Adds build step complexity and JSON token files. Your CSS variables in `globals.css` already serve as design tokens and are directly consumable by Tailwind v4's `@theme` directive.

**When to reconsider:** If syncing tokens with Figma or generating tokens for multiple platforms (iOS, Android).

### ❌ Tailwind Plugins (tailwindcss-radix, tailwindcss-animate, etc.)
**Why avoid:** Tailwind v4 deprecates JavaScript-based plugins in favor of CSS-first architecture. Modern solutions (tw-animate-css) use pure CSS `@import` statements.

**When to reconsider:** Never for Tailwind v4. If you need Radix state styling, use data attribute selectors directly: `data-[state=open]:bg-gray-100`.

### ❌ CSS-in-JS Libraries (styled-components, Emotion)
**Why avoid:** Conflicts with Tailwind's utility-first approach. Adds runtime overhead and hydration complexity. Tailwind v4 + CVA + CSS variables already provide complete styling solution.

**When to reconsider:** Never for this project.

### ❌ tailwind-variants
**Why avoid:** Adds 10KB for responsive variants and component slots that you don't need. CVA (2KB) handles your current use cases (status badges, filter pills, buttons). Responsive variants can be achieved with Tailwind's responsive prefixes (`md:`, `lg:`).

**When to reconsider:** If you need split components with multiple styled slots (e.g., a card with separately styleable header, body, footer sections).

### ❌ Pre-styled Component Libraries (DaisyUI, Preline UI, Material UI)
**Why avoid:** You've already established custom design tokens and visual style. Pre-styled libraries impose their design language and add abstraction layers. Your FilterPill component proves you can build exactly what you need.

**When to reconsider:** Never for this project. These are better for rapid prototyping without custom design.

### ❌ Icon Libraries (lucide-react, react-icons, heroicons)
**Why avoid:** You only have minimal icon needs currently (notification bell, search icon, etc.). Can use inline SVGs or Tailwind's built-in content utilities for simple shapes.

**When to reconsider:** If you need 10+ icons, then lucide-react (tree-shakeable, modern) is the best choice.

## Design Token Management Approach

### Current State (Keep This)
Your `globals.css` already implements the right pattern for Tailwind v4:

```css
:root {
  /* Design tokens as CSS variables */
  --primary: #4fd1c5;
  --bg-card: #ffffff;
  /* ... */
}

@theme inline {
  /* Expose to Tailwind utilities */
  --color-primary: var(--primary);
  --color-bg-card: var(--bg-card);
  /* ... */
}
```

### Add for Theming
Create separate token sets per theme:

```css
/* Light theme (default) */
:root {
  --bg-page: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #2d3748;
  /* ... */
}

/* Dark theme */
:root[data-theme="dark"] {
  --bg-page: #1a202c;
  --bg-card: #2d3748;
  --text-primary: #f7fafc;
  /* ... */
}

/* @theme inline stays the same - references tokens */
@theme inline {
  --color-bg-page: var(--bg-page);
  --color-bg-card: var(--bg-card);
  --color-text-primary: var(--text-primary);
}
```

### Three-Layer Token Architecture (OPTIONAL for Future)
Only implement if token complexity grows beyond current scope:

1. **Base tokens** (primitives) — `--gray-50`, `--gray-100`, `--blue-500`
2. **Semantic tokens** (purpose) — `--color-primary`, `--color-background`
3. **Component tokens** (specific) — `--button-primary-bg`, `--card-shadow`

**Current recommendation:** Stick with semantic tokens only (your current approach). Base tokens add unnecessary indirection for a 6,426 LOC codebase.

## Integration Checklist

- [ ] Install core dependencies (next-themes, CVA, tailwind-merge, clsx, tw-animate-css)
- [ ] Create `src/lib/utils.ts` with `cn()` utility function
- [ ] Wrap app in `<ThemeProvider>` in `layout.tsx`
- [ ] Add `suppressHydrationWarning` to `<html>` tag
- [ ] Define dark theme CSS variables in `globals.css`
- [ ] Add `@import "tw-animate-css"` to `globals.css`
- [ ] Update existing components to use CVA for variants (FilterPill, StatusBadge)
- [ ] Add theme toggle component using `useTheme()` hook from next-themes
- [ ] Test theme switching with localStorage persistence
- [ ] Install Radix primitives only as needed for specific components

## Performance Considerations

| Package | Bundle Size | Impact |
|---------|-------------|--------|
| next-themes | ~2KB | Negligible |
| CVA | ~2KB | Negligible |
| tailwind-merge | ~8KB | Small (lazy-loaded with components) |
| clsx | 228 bytes | Negligible |
| tw-animate-css | ~1KB | Negligible |
| @radix-ui/react-dialog | ~18KB | Small (lazy-load per component) |

**Total overhead:** ~13KB for core functionality, plus 10-20KB per Radix primitive as needed.

**Optimization strategy:**
- Lazy load Radix primitives with `next/dynamic` for infrequently used components
- Tree-shake CVA by importing only what's used
- tailwind-merge has internal caching that optimizes repeated calls

## Testing Strategy

### Theme Switching Tests
```typescript
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

test('renders in light mode by default', () => {
  render(
    <ThemeProvider attribute="data-theme" defaultTheme="light">
      <MyComponent />
    </ThemeProvider>
  )
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})
```

### Component Variant Tests (extend existing FilterPill pattern)
```typescript
import { cva } from 'class-variance-authority'

const buttonVariants = cva(/* ... */)

test('applies correct variant classes', () => {
  expect(buttonVariants({ variant: 'primary', size: 'md' }))
    .toContain('bg-primary')
})
```

## Migration Path

### Phase 1: Foundation (Current)
- [x] Tailwind CSS 4 with CSS variables
- [x] Design tokens in globals.css
- [x] FilterPill component with inline variants

### Phase 2: Core Theming (Next)
- [ ] Install next-themes, CVA, tailwind-merge, clsx, tw-animate-css
- [ ] Add theme toggle UI component
- [ ] Define dark mode CSS variables
- [ ] Create cn() utility function

### Phase 3: Component Standardization
- [ ] Migrate FilterPill to use CVA
- [ ] Extract Button component with variants
- [ ] Extract Card component with variants
- [ ] Document component variant patterns

### Phase 4: Advanced Components (As Needed)
- [ ] Add Radix primitives for complex interactions
- [ ] Build composite components (DropdownMenu, Dialog)
- [ ] Add animation patterns for enter/exit states

## Sources

### High Confidence (Official Docs & Context7)
- [next-themes README](https://github.com/pacocoursey/next-themes/blob/main/README.md) - Installation and App Router setup
- [CVA Documentation](https://cva.style/docs) - Variants and TypeScript integration
- [tailwind-merge Repository](https://github.com/dcastil/tailwind-merge) - Usage patterns and recipes
- [Radix UI Primitives](https://www.radix-ui.com/primitives) - Component primitives overview
- [tw-animate-css Repository](https://github.com/Wombosvideo/tw-animate-css) - Tailwind v4 animations

### Medium Confidence (Community Resources & Verified)
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - Migration patterns and dependencies
- [Tailwind v4 Theming Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/15083) - CSS variable patterns
- [CVA vs Tailwind Variants Comparison](https://dev.to/webdevlapani/cva-vs-tailwind-variants-choosing-the-right-tool-for-your-design-system-12am) - Feature differences
- [Tailwind + Radix Integration Guide](https://medium.com/@fthiagorodrigues10/level-up-your-ui-game-combining-radix-ui-primitives-with-tailwind-css-8f6d91b044eb) - Styling approaches
- [Design System Over-Engineering](https://sancho.dev/blog/tailwind-and-design-systems) - What to avoid

### Version Information
- npm registry queries (May 2026) - Current package versions
- Context7 library lookups - Library IDs and documentation references

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| Core Stack (next-themes, CVA, tailwind-merge) | HIGH | Official documentation, battle-tested patterns, verified versions, widely adopted in production |
| Tailwind v4 Integration | HIGH | Official Tailwind docs, shadcn/ui migration guide, verified CSS-first patterns |
| Radix UI Primitives | MEDIUM | Official docs clear, but recommendation to use selectively is based on bundle size considerations |
| What NOT to Add | MEDIUM | Based on community wisdom and design system best practices, but project-specific factors may vary |

## Key Recommendations Summary

1. **Start minimal:** Install only next-themes, CVA, tailwind-merge, clsx, and tw-animate-css initially
2. **Theme-first approach:** Use CSS variables with `data-theme` attribute for theme switching
3. **Radix on-demand:** Don't install full suite upfront. Add specific primitives when building features that need them
4. **Skip shadcn/ui:** Build custom components using same underlying tools without the CLI/config overhead
5. **Avoid over-engineering:** No Style Dictionary, no design token build tools, no CSS-in-JS
6. **Leverage existing patterns:** Your FilterPill component shows the right approach - extend it with CVA for type safety
7. **Test incrementally:** Add theming to existing components one at a time, validate with TDD approach you've established
