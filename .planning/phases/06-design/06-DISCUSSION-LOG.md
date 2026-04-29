# Phase 6: Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 06-design
**Areas discussed:** Pill Placement, Pill Styling, Color System, Design Deliverable

---

## Pill Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Above all columns | Horizontal strip spanning the page width, above Premix/Excel/CGM columns | ✓ |
| Per-column headers | Each column gets its own filter pills (filter affects only that column) | |
| Floating top-right | Compact filter group in the header area, near search or page title | |

**User's choice:** Above all columns
**Notes:** None

### Alignment Follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Full width | Filter pills span entire content area as a unified row | |
| Left-aligned compact | Pills grouped on the left with space on the right | ✓ |
| Centered | Pills centered above the three columns | |

**User's choice:** Left-aligned compact
**Notes:** None

---

## Pill Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Match orders page | Rounded pills with background color, same as existing status filters | ✓ |
| Outlined with badges | Outlined pills with count badges showing total orders per status | |
| Chips with checkmarks | Modern chip-style with checkmark icon when selected | |

**User's choice:** Match orders page
**Notes:** None

### Count Badges Follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, always show | Each pill shows count badge (e.g., 'Completed (12)') | ✓ |
| Show on hover | Count appears on hover/focus, keeps pills compact normally | |
| No counts | Pills show status name only, like the orders page | |

**User's choice:** Yes, always show
**Notes:** Extends orders page pattern by adding count visibility

---

## Color System

| Option | Description | Selected |
|--------|-------------|----------|
| Use design tokens | Reference globals.css tokens (--success, --error, --warning, etc.) | ✓ |
| Keep existing colors | Keep current hardcoded STATE_COLORS from mill-production page | |
| New status palette | Define new colors in .pen file for approval, then add to tokens | |

**User's choice:** Use design tokens
**Notes:** None

### Token Mapping Follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Map to existing | Completed=success, Blocked=error, Mixing=warning, Pending=neutral | ✓ |
| Propose new tokens | Add status-specific tokens (--status-completed, --status-blocked, etc.) | |
| You decide | Use best judgment based on design token conventions | |

**User's choice:** Map to existing
**Notes:** Reuses existing token system, no new tokens needed

---

## Design Deliverable

| Option | Description | Selected |
|--------|-------------|----------|
| Static layout only | Show filter strip placement and pill styling, no interaction states | |
| Include interaction states | Show default, hover, active/selected states for pills | |
| Full interaction flow | Multiple frames showing filter flow (none selected → some selected → filtered result) | ✓ |

**User's choice:** Full interaction flow
**Notes:** Design file will include multiple frames showing the complete interaction journey

---

## Claude's Discretion

- Specific pill dimensions (padding, border-radius) based on orders page patterns
- Exact spacing between pills and below filter strip
- Count badge positioning (inline vs. superscript)

## Deferred Ideas

None — discussion stayed within phase scope
