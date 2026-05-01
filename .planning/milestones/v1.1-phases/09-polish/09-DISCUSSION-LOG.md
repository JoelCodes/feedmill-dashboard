# Phase 9: Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 09-polish
**Areas discussed:** Hardcoded colors, Spacing verification, Typography, Card shadow/border

---

## Areas Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded colors | STATE_COLORS and countBg use hex values. Replace with design tokens? | ✓ |
| Spacing verification | How should we verify spacing matches .pen design? | ✓ |
| Typography | Font sizes (11px, 15px) are inline. Should these become design tokens? | ✓ |
| Card shadow/border | ProductionCard uses inline boxShadow style. Replace with token? | ✓ |

**User's choice:** All four areas
**Notes:** User wanted to discuss all implementation details before planning

---

## Hardcoded Colors

| Option | Description | Selected |
|--------|-------------|----------|
| Extend design tokens (Recommended) | Add missing tokens to globals.css and update @theme. Most maintainable. | ✓ |
| Map to closest existing | Use existing tokens where close enough. Faster but less precise. | |
| Mix approach | Use tokens for common colors, allow inline hex for status-specific variants. | |

**User's choice:** Extend design tokens (Recommended)
**Notes:** None

---

## Color Token Naming

| Option | Description | Selected |
|--------|-------------|----------|
| Status-role pattern (Recommended) | --status-completed-border, --status-mixing-header. Clear hierarchy. | ✓ |
| Flat pattern | --completed-border, --mixing-header. Shorter but less organized. | |
| You decide | Claude picks a naming pattern that fits existing globals.css style. | |

**User's choice:** Status-role pattern (Recommended)
**Notes:** None

---

## Spacing Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Visual comparison | Compare running app to .pen file and call out specific fixes. | |
| Provide measurements | Provide specific pixel measurements from the design. | |
| Trust current implementation | Current spacing looks close enough — focus elsewhere. | ✓ |

**User's choice:** Trust current implementation
**Notes:** Spacing not a concern for this phase

---

## Typography

| Option | Description | Selected |
|--------|-------------|----------|
| Add custom sizes to theme | Extend @theme with --text-11 and --text-15. Consistent naming. | ✓ |
| Keep arbitrary values | Continue using text-[11px] and text-[15px]. Already working. | |
| Map to closest standard | 11px → text-xs (12px), 15px → text-sm (14px). Small visual shift. | |

**User's choice:** Add custom sizes to theme
**Notes:** None

---

## Card Shadow

| Option | Description | Selected |
|--------|-------------|----------|
| Add production-card token (Recommended) | Add --shadow-production-card matching current visual. | |
| Use existing --shadow-card | Switch to --shadow-card. Subtle difference, consistent with app. | ✓ |
| You decide | Claude picks based on visual quality. | |

**User's choice:** Use existing --shadow-card
**Notes:** Prefer consistency over exact match

---

## Claude's Discretion

- Exact naming for typography tokens (text-card-label vs text-11)
- How to structure @theme extensions for new tokens
- Whether to add missing text color tokens or map to closest existing

## Deferred Ideas

None — discussion stayed within phase scope
