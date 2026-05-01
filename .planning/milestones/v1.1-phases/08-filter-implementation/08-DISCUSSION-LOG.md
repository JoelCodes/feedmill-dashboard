# Phase 8: Filter Implementation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 08-Filter Implementation
**Areas discussed:** Component extraction, Filter visibility feedback, Count badge source, State initialization

---

## Component Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract shared FilterPill (Recommended) | Create src/components/FilterPill.tsx with a generic color prop. Both pages use same component with different color configs. | ✓ |
| Duplicate in mill-production | Keep FilterPill inline in mill-production/page.tsx. Simpler but means two filter pill implementations to maintain. | |
| Let Claude decide | Claude picks the approach based on codebase patterns and maintainability. | |

**User's choice:** Extract shared FilterPill (Recommended)
**Notes:** None

---

## Filter Visibility Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Hide completely (Recommended) | Non-matching cards disappear entirely. Matches orders page behavior and D-07 design direction. | ✓ |
| Dim with opacity | Non-matching cards stay visible but dimmed (opacity 0.3-0.5). Preserves context of full production queue. | |
| Let Claude decide | Claude picks based on design consistency and UX best practices. | |

**User's choice:** Hide completely (Recommended)
**Notes:** None

---

## Count Badge Source

| Option | Description | Selected |
|--------|-------------|----------|
| Total count always (Recommended) | Completed (15) always shows 15 total Completed orders, regardless of other active filters. Matches D-04 and orders page. | ✓ |
| Filtered count | Completed (15) changes to (0) when another status is selected exclusively. Shows 'how many would show if I clicked this'. | |
| Let Claude decide | Claude picks based on requirement FILTR-04 wording. | |

**User's choice:** Total count always (Recommended)
**Notes:** None

---

## State Initialization

| Option | Description | Selected |
|--------|-------------|----------|
| No filters (show all) (Recommended) | Empty selection = all cards visible. User opts-in to filtering. Matches FILTR-05 requirement. | ✓ |
| Pre-select active work | Start with Mixing + Pending selected to focus on in-progress orders. Operations staff likely care most about active work. | |
| Let Claude decide | Claude picks based on FILTR-05 and operational workflow. | |

**User's choice:** No filters (show all) (Recommended)
**Notes:** None

---

## Claude's Discretion

- FilterPill props interface design (label, count, color, isActive, onClick)
- State management approach (useState with Set, matching orders page pattern)
- Filter strip positioning/spacing within the layout

## Deferred Ideas

None — discussion stayed within phase scope
