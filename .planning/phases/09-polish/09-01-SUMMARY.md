---
phase: 09-polish
plan: 01
subsystem: mill-production
tags: [design-tokens, css-variables, polish, refactoring]

dependency_graph:
  requires:
    - 08-02: Filter pills with countBg values to tokenize
  provides:
    - Design tokens for status colors, typography, and text colors
    - Token-based styling in mill-production page
  affects:
    - All future components can use status-* tokens

tech_stack:
  added: []
  patterns:
    - CSS custom properties in :root for raw values
    - @theme inline for Tailwind utility mappings
    - Hex alpha (#rrggbb38) for 22% opacity variants
    - Semantic token naming (text-card-label vs text-11)

key_files:
  created: []
  modified:
    - src/app/globals.css
    - src/app/mill-production/page.tsx

decisions:
  - D-01 through D-11 from CONTEXT.md implemented as specified
  - Used semantic names (text-card-label, text-muted) over technical (text-11)
  - Kept dynamic inline style for headerColor (CSS variable resolved at runtime)

metrics:
  duration: 2m
  completed: 2026-04-29
  tasks: 3
  files: 2
---

# Phase 09 Plan 01: Design Tokens and Token-Based Styling Summary

Design token refactoring replacing hardcoded hex colors, text sizes, and inline styles with CSS variables defined in globals.css.

## What Was Done

### Task 1: Add design tokens to globals.css (80e8562)
Added 12 new :root tokens and 12 @theme inline mappings:

**Status tokens (4 sets x 3 = 12 tokens):**
- `--status-completed-border`, `--status-completed-header`, `--status-completed-bg-22`
- `--status-mixing-border`, `--status-mixing-header`, `--status-mixing-bg-22`
- `--status-blocked-border`, `--status-blocked-header`, `--status-blocked-bg-22`
- `--status-pending-border`, `--status-pending-header`, `--status-pending-bg-22`

**Typography tokens:**
- `--text-11: 0.6875rem` (11px)
- `--text-15: 0.9375rem` (15px)

**Text color tokens:**
- `--text-muted: #718096`
- `--text-medium: #4a5568`

**@theme inline mappings:**
- Status color utilities (`--color-status-*`)
- Typography utilities (`--text-card-label`, `--text-card-title`)
- Text color utilities (`--color-text-muted`, `--color-text-medium`)

### Task 2: Replace hardcoded values in mill-production/page.tsx (5e80ebd)
Replaced all hardcoded values with design tokens:

| Before | After |
|--------|-------|
| `border: "#38a169"` | `border: "var(--status-completed-border)"` |
| `countBg: "bg-[#2f855a22]"` | `countBg: "bg-[var(--status-completed-bg-22)]"` |
| `text: "text-[#718096]"` (Pending) | `text: "text-muted"` |
| `style={{ boxShadow: "..." }}` | `className="... shadow-card"` |
| `text-[11px]` | `text-card-label` |
| `text-[15px]` | `text-card-title` |
| `text-[#718096]` | `text-muted` |
| `text-[#2d3748]` | `text-primary` |
| `text-[#4a5568]` | `text-medium` |

### Task 3: Verify build and visual consistency
- `npm run build` succeeds
- No hardcoded hex colors in mill-production/page.tsx
- No inline boxShadow styles
- No text-[#xxx] patterns

## Verification Results

```
Hardcoded hex colors: 0 (PASS)
Inline boxShadow: 0 (PASS)
text-[#xxx] patterns: 0 (PASS)
npm run build: SUCCESS
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 80e8562 | feat | Add design tokens to globals.css |
| 5e80ebd | feat | Replace hardcoded values with design tokens |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] src/app/globals.css exists and contains `--status-completed-border`
- [x] src/app/mill-production/page.tsx exists and contains `shadow-card`
- [x] Commit 80e8562 exists in git log
- [x] Commit 5e80ebd exists in git log
