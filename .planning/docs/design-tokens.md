# Design Tokens Documentation

**Created:** 2026-05-07
**Last Updated:** 2026-05-07
**Source of Truth:** designs/component-library.pen
**Implementation:** src/app/globals.css

## Overview

This document describes the design token system for the CGM Dashboard. Tokens follow a two-tier naming pattern:

1. **Primitives** (in `:root`) - Raw values like `--primary: #4fd1c5`
2. **Semantic aliases** (in `@theme inline`) - Contextual names like `--color-primary: var(--primary)`

## Token Categories

### Colors

Use semantic color tokens for all color values:

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `--color-primary` | Primary actions, links | `bg-[var(--color-primary)]` |
| `--color-primary-hover` | Primary hover state | `hover:bg-[var(--color-primary-hover)]` |
| `--color-primary-active` | Primary active/pressed state | `active:bg-[var(--color-primary-active)]` |
| `--color-primary-disabled` | Primary disabled state | Conditionally applied |
| `--color-success` | Success states, confirmations | Status badges |
| `--color-warning` | Warning states, cautions | Alert messages |
| `--color-error` | Error states, destructive | Form validation |
| `--color-info` | Informational states | Tooltips |

### Backgrounds

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `--color-bg-page` | Page background | Applied to body |
| `--color-bg-card` | Card/panel backgrounds | Card components |

### Text

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `--color-text-primary` | Primary text | Headings, body |
| `--color-text-secondary` | Secondary text | Descriptions |
| `--color-text-muted` | Muted/subtle text | Timestamps, hints |

### Spacing

Use spacing tokens for all padding, margin, gap values:

| Token | Value | Tailwind Usage |
|-------|-------|----------------|
| `--space-1` | 0.25rem (4px) | `p-[var(--space-1)]` |
| `--space-2` | 0.5rem (8px) | `gap-[var(--space-2)]` |
| `--space-3` | 0.75rem (12px) | `m-[var(--space-3)]` |
| `--space-4` | 1rem (16px) | `p-[var(--space-4)]` |
| `--space-5` | 1.5rem (24px) | `py-[var(--space-5)]` |
| `--space-6` | 2rem (32px) | `px-[var(--space-6)]` |
| `--space-8` | 3rem (48px) | `gap-[var(--space-8)]` |
| `--space-10` | 4rem (64px) | `mt-[var(--space-10)]` |
| `--space-12` | 6rem (96px) | `mb-[var(--space-12)]` |

**Semantic spacing aliases:**

| Alias | Maps To | When to Use |
|-------|---------|-------------|
| `--spacing-xs` | space-1 | Tight spacing (icons, badges) |
| `--spacing-sm` | space-2 | Small gaps (inline elements) |
| `--spacing-md` | space-4 | Standard spacing (cards, sections) |
| `--spacing-lg` | space-6 | Large spacing (page sections) |
| `--spacing-xl` | space-8 | Extra large (hero sections) |

### Border Radius

| Token | Value | When to Use |
|-------|-------|-------------|
| `--radius-sm` | 6px | Small elements (badges, pills) |
| `--radius-md` | 8px | Standard elements (buttons, inputs) |
| `--radius-lg` | 12px | Large elements (cards, modals) |
| `--radius-xl` | 15px | Extra large (hero cards) |

### Shadows

| Token | When to Use |
|-------|-------------|
| `--shadow-sm` | Subtle elevation (buttons) |
| `--shadow-card` | Card elevation |

## Dark Mode

Dark mode is handled automatically via CSS variable overrides in the `.dark` class. Components using semantic tokens automatically adapt:

```css
/* In globals.css */
:root {
  --primary: #4fd1c5;  /* Light mode value */
}

.dark {
  --primary: #63b3ed;  /* Dark mode value */
}

/* Semantic alias references primitive */
@theme inline {
  --color-primary: var(--primary);  /* Auto-swaps based on .dark */
}
```

**Important:** Override primitives in `.dark`, not semantic aliases.

## Usage Patterns

### DO

```tsx
// Use semantic color tokens
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">

// Use spacing tokens
<div className="p-[var(--space-4)] gap-[var(--space-2)]">

// Use radius tokens
<div className="rounded-[var(--radius-md)]">
```

### DON'T

```tsx
// Hardcoded hex colors (ESLint error)
<button className="bg-[#4fd1c5]">

// Hardcoded px values (ESLint error)
<div className="p-[16px]">

// Raw color names instead of tokens
<div className="bg-teal-400">  // Use --color-primary instead
```

## Token Sync Process (DES-03)

When updating design tokens:

1. **Start in Pencil.dev:** Update `designs/component-library.pen`
2. **Update CSS:** Mirror changes in `src/app/globals.css`
   - Add primitive to `:root`
   - Add dark mode override to `.dark`
   - Add semantic alias to `@theme inline`
3. **Update docs:** Add to this file if new category
4. **Verify:** Run `npm run lint` to check for violations
5. **Test:** Run `npm test` to ensure no regressions

### Adding a New Color

1. In component-library.pen, add to Color Palette section
2. In globals.css :root, add primitive: `--newcolor: #value;`
3. In globals.css .dark, add override: `--newcolor: #darkvalue;`
4. In globals.css @theme inline, add alias: `--color-newcolor: var(--newcolor);`
5. Add interactive states if needed: `--newcolor-hover`, etc.

### Adding New Spacing

1. In component-library.pen, add to Spacing Scale
2. In globals.css :root, add: `--space-N: Xrem;`
3. Optionally add semantic alias in @theme inline

## ESLint Enforcement

The `custom/no-hardcoded-values` rule prevents:

- Hex colors: `#fff`, `#abc123`, `bg-[#4fd1c5]`
- Pixel values: `w-[24px]`, `p-[16px]`

Allowed patterns:

- Token references: `bg-[var(--color-primary)]`
- Standard Tailwind: `p-4`, `text-red-500`

## File References

| File | Purpose |
|------|---------|
| `designs/component-library.pen` | Design source of truth |
| `src/app/globals.css` | CSS implementation |
| `eslint-rules/no-hardcoded-values.js` | Enforcement rule |
| `.planning/docs/design-tokens.md` | This documentation |

---

*Documentation created: 2026-05-07 for Phase 16*
