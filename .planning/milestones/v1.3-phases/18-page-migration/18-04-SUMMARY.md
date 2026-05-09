---
phase: 18-page-migration
plan: 04
subsystem: design-system
tags: [components, tokens, gauge, timeline, migration]
dependency_graph:
  requires:
    - 16-02 (CSS variables)
    - 17-02 (Card component)
  provides:
    - src/components/ui/Gauge.tsx
    - src/components/ui/Timeline.tsx
  affects:
    - BinGauge consumers (backwards compatible)
    - ActivityTimeline consumers (backwards compatible)
tech_stack:
  added: []
  patterns:
    - Generic component APIs with backwards-compatible aliases
    - Token-based styling for colors
    - Card component composition
key_files:
  created:
    - src/components/ui/Gauge.tsx
    - src/components/ui/Gauge.test.tsx
    - src/components/ui/Timeline.tsx
    - src/components/ui/Timeline.test.tsx
  modified: []
decisions:
  - D-08: Extract BinGauge and ActivityTimeline to ui/ as generic components
metrics:
  duration: ~8 minutes
  completed: 2026-05-07
---

# Phase 18 Plan 04: Extract Gauge and Timeline to ui/ Summary

Generic Gauge and Timeline components in ui/ with token-based color styling and backwards-compatible exports.

## Completed Tasks

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Extract BinGauge to ui/ as Gauge | 8cc8da4 | Generic API (label/sublabel), token colors |
| 2 | Gauge token verification tests | 03c929f | 14 tests including token verification |
| 3 | Extract ActivityTimeline to ui/ as Timeline | db97a95 | Card wrapper, token colors/radius |
| 4 | Timeline token verification tests | d1ff7b3 | 16 tests including token verification |

## Token Replacements

### Gauge Component
| Hardcoded | Token |
|-----------|-------|
| `text-[#2d3748]` | `text-[var(--text-primary)]` |
| `text-[#a0aec0]` | `text-[var(--text-secondary)]` |
| `border-[#e2e8f0]` | `border-[var(--divider)]` |

### Timeline Component
| Hardcoded | Token |
|-----------|-------|
| `bg-success` | `bg-[var(--success)]` |
| `bg-warning` | `bg-[var(--warning)]` |
| `bg-error` | `bg-[var(--error)]` |
| `bg-primary` | `bg-[var(--primary)]` |
| `text-success` | `text-[var(--success)]` |
| `text-warning` | `text-[var(--warning)]` |
| `text-error` | `text-[var(--error)]` |
| `text-primary` | `text-[var(--primary)]` |
| `text-text-primary` | `text-[var(--text-primary)]` |
| `text-text-secondary` | `text-[var(--text-secondary)]` |
| `bg-[#f8f9fa]` | `bg-[var(--bg-page)]` |
| `rounded-[8px]` | `rounded-[var(--radius-md)]` |
| `rounded-[15px]` + `shadow-[...]` | Card component (provides via tokens) |
| `focus:ring-primary` | `focus:ring-[var(--primary)]` |

## API Changes

### Gauge (formerly BinGauge)
| Old Prop | New Prop | Notes |
|----------|----------|-------|
| `locationCode` | `label` | Generic naming |
| `feedType` | `sublabel` | Now optional |

Both `Gauge` and `BinGauge` are exported for backwards compatibility.

### Timeline (formerly ActivityTimeline)
No API changes - same `events: ActivityEvent[]` prop.

Both `Timeline` and `ActivityTimeline` are exported for backwards compatibility.

## Verification Results

- **Files created:** All 4 files exist
- **Tests:** 30 tests passing (14 Gauge + 16 Timeline)
- **Hex colors:** 0 hardcoded hex colors in new components
- **Backwards compatibility:** Both BinGauge and ActivityTimeline exports available

## Deviations from Plan

None - plan executed exactly as written.

## Notes

The lint check shows warnings for hardcoded px values (dimensions, font sizes). These are pre-existing values from the original UI-SPEC-compliant components and were not in scope for this plan, which focused on color token migration. The original BinGauge.tsx had 3 hardcoded hex color errors that are now resolved; the new Gauge.tsx has 0 hex color errors.

## Self-Check: PASSED

- [x] src/components/ui/Gauge.tsx exists
- [x] src/components/ui/Gauge.test.tsx exists
- [x] src/components/ui/Timeline.tsx exists
- [x] src/components/ui/Timeline.test.tsx exists
- [x] Commit 8cc8da4 exists
- [x] Commit 03c929f exists
- [x] Commit db97a95 exists
- [x] Commit d1ff7b3 exists
