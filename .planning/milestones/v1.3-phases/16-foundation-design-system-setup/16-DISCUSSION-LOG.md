# Phase 16: Foundation & Design System Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 16-Foundation & Design System Setup
**Areas discussed:** Token architecture, Dark mode approach, Design file structure, Hardcoded value enforcement

---

## Token Architecture

### Question: Token naming convention

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current pattern (Recommended) | Primitives in :root (--primary, --success), semantics in @theme (--color-primary). Already established, minimal refactoring needed. | ✓ |
| Consolidate to semantics only | Replace primitive names with semantic names everywhere (--color-surface, --color-text-primary). More intentional but larger migration. | |
| You decide | Claude picks based on what works best for theming and component development | |

**User's choice:** Keep current pattern (Recommended)
**Notes:** Two-tier pattern already established in globals.css, continue with minimal disruption.

### Question: Token categories to expand

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive states (Recommended) | Add hover, focus, active, disabled variants for primary, secondary, destructive. Required for Button variants. | |
| Spacing scale | Define spacing primitives (--space-1 through --space-12) to replace arbitrary px values. Useful but can add incrementally. | |
| Both interactive + spacing | Complete token foundation before component work starts. More upfront work, cleaner component code. | ✓ |
| You decide | Claude assesses what's critical vs nice-to-have | |

**User's choice:** Both interactive + spacing
**Notes:** Complete foundation before component development starts.

---

## Dark Mode Approach

### Question: Theme switching implementation

| Option | Description | Selected |
|--------|-------------|----------|
| next-themes + CSS variables (Recommended) | next-themes handles flash prevention, localStorage persistence, and system preference detection. CSS variables swap via .dark class. Battle-tested pattern. | ✓ |
| CSS-only with prefers-color-scheme | No JS dependency, pure media query approach. Simple but no manual toggle, no persistence. | |
| Tailwind dark: class only | Manual dark: prefix classes. More verbose component code, but no runtime dependency. | |

**User's choice:** next-themes + CSS variables (Recommended)
**Notes:** Standard approach, handles flash prevention and persistence automatically.

### Question: Theme options

| Option | Description | Selected |
|--------|-------------|----------|
| Three options: Light / Dark / System (Recommended) | Respects user preference, falls back to OS setting. Standard UX pattern. next-themes supports this out of the box. | ✓ |
| Two options: Light / Dark only | Simpler UI, explicit choice. Users who want system matching can just pick their current preference. | |
| You decide | Claude picks based on UX best practices | |

**User's choice:** Three options: Light / Dark / System (Recommended)
**Notes:** Standard UX pattern, next-themes supports out of the box.

---

## Design File Structure

### Question: .pen file organization

| Option | Description | Selected |
|--------|-------------|----------|
| Library + page files (Recommended) | One component-library.pen with primitives and tokens. Separate page .pen files (orders.pen, customers.pen) reference library as source of truth. | ✓ |
| Single monolithic .pen | Everything in one file — components, pages, tokens. Simpler navigation but can get large. | |
| Per-component .pen files | button.pen, card.pen, input.pen etc. Maximum granularity but harder to see the whole system. | |
| You decide | Claude picks based on Pencil.dev best practices | |

**User's choice:** Library + page files (Recommended)
**Notes:** Clear separation between component primitives and page layouts.

### Question: Existing .pen file migration

| Option | Description | Selected |
|--------|-------------|----------|
| Keep and reference library (Recommended) | Existing .pen files stay as page layouts. Extract any reusable components to component-library.pen. Pages reference library. | ✓ |
| Archive and recreate | Move existing to .planning/archive/, recreate using library components. Clean slate but loses historical context. | |
| You decide | Claude assesses what makes sense given current file state | |

**User's choice:** Keep and reference library (Recommended)
**Notes:** Preserve existing work, extract reusables to library.

---

## Hardcoded Value Enforcement

### Question: Detection approach

| Option | Description | Selected |
|--------|-------------|----------|
| ESLint + regex patterns (Recommended) | Custom ESLint rule checking for hex colors (#xxx, #xxxxxx) and px values in className strings. Lightweight, no extra deps. | ✓ |
| stylelint for CSS + ESLint for TSX | stylelint handles globals.css, ESLint handles component className. More thorough but two tools. | |
| You decide | Claude picks the simplest effective approach | |

**User's choice:** ESLint + regex patterns (Recommended)
**Notes:** Lightweight approach, no additional dependencies.

### Question: Violation severity

| Option | Description | Selected |
|--------|-------------|----------|
| Error (blocks) | Hardcoded values fail CI builds. Forces compliance. Good for new code, but requires fixing existing violations first. | ✓ |
| Warning (advisory) | Reports issues but doesn't block. Allows incremental cleanup. Less friction during migration. | |
| Error for new, ignore existing | Use eslint-disable-next-line on existing violations. New code must comply. Gradual enforcement. | |

**User's choice:** Error (blocks)
**Notes:** Full compliance required. Fix existing violations before enabling rule.

---

## Claude's Discretion

None — user provided explicit choices for all areas.

## Deferred Ideas

None — discussion stayed within phase scope.
