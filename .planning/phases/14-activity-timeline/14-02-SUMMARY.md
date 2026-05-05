---
phase: 14
plan: 02
subsystem: customer-detail
tags: [tdd, component, ui, timeline, expand-collapse]
dependency_graph:
  requires:
    - 14-01 (ActivityEvent type)
  provides:
    - ActivityTimeline component with expand/collapse behavior
  affects:
    - Customer detail page (integration point)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN/REFACTOR cycle
    - Internal component extraction (TimelineItem)
    - Set-based expand state management
    - Event type color mapping
    - Keyboard accessibility (Enter/Space)
key_files:
  created:
    - src/components/ActivityTimeline.tsx
    - src/components/ActivityTimeline.test.tsx
  modified: []
decisions:
  - "Multiple events can be expanded simultaneously (no accordion behavior per D-05)"
  - "Bin events are clickable but show no expanded detail (no orderId)"
  - "Extracted TimelineItem as internal component for cleaner code structure"
  - "Used Set<string> for expandedIds state to enable efficient lookups"
metrics:
  duration: 206s
  tasks_completed: 1
  files_created: 2
  files_modified: 0
  commits: 3
  test_coverage: 8 tests
  completed_at: "2026-05-05T22:28:53Z"
---

# Phase 14 Plan 02: ActivityTimeline Component Summary

**One-liner:** Timeline component with expand/collapse behavior, order detail display, and icon-based event visualization following TDD approach

## Objective

Create ActivityTimeline component with expand/collapse behavior per UI-SPEC design contract. Component receives events prop, displays timeline items with icon dots and connector lines, and allows clicking rows to expand/collapse order details.

## Implementation

### TDD Cycle

**RED Phase (commit 2c1dbb2):**
- Created ActivityTimeline.test.tsx with 8 failing test cases
- Empty state rendering
- Timeline items rendering
- Click to expand behavior
- Click to collapse behavior
- Multiple rows expanded simultaneously
- Expanded order content structure (Quantity, Product, Status)
- View Order Details link with correct href
- Bin events without expanded detail

**GREEN Phase (commit a77d709):**
- Implemented ActivityTimeline component to pass all tests
- Timeline items with 28px icon dots and 2px connector lines
- Event type color mapping (primary, success, warning, error)
- Icon mapping (FileText, Factory, Truck, CheckCircle, AlertTriangle)
- Date formatting per UI-SPEC (formatTimelineDate)
- Expand/collapse state using Set<string>
- Expanded detail box for order events only (requires orderId)
- Keyboard navigation (Enter/Space toggles expand)
- Accessibility attributes (role=button, aria-expanded, aria-label)
- Empty state: "No recent activity" message

**REFACTOR Phase (commit 9eebe17):**
- Extracted TimelineItem as internal component
- Improved separation of concerns
- Cleaner props interface for timeline item behavior
- All tests still pass (no behavior changes)

### Component Structure

**ActivityTimeline (container):**
- Manages expandedIds state (Set<string>)
- Handles empty state rendering
- Maps events to TimelineItem components

**TimelineItem (internal):**
- Renders icon dot with connector line
- Displays title, description, date
- Handles click/keyboard toggle
- Shows expanded detail box for order events

### Visual Design (per UI-SPEC)

**Card styling:**
- Background: white
- Border radius: 15px
- Shadow: 0 3.5px 5px rgba(0,0,0,0.05)
- Padding: [20px, 24px]

**Timeline item layout:**
- Left column: 36px width (28px dot + spacing)
- Icon: 14px × 14px white on colored dot
- Connector: 2px width, colored line between items
- Gap between columns: 14px
- Content gap (title/desc/date): 4px

**Typography:**
- Title: 13px bold #2d3748
- Description: 11px normal #a0aec0
- Date: 10px bold colored (event type color)
- Detail text: 11px normal #2d3748
- Link: 10px normal #4fd1c5 underline

**Event colors:**
- Order events: #4fd1c5 (primary)
- Delivery completed: #48bb78 (success)
- Bin alert low: #f59e0b (warning)
- Bin alert critical: #e53e3e (error)

**Expanded detail box:**
- Background: #f8f9fa
- Border radius: 8px
- Padding: 12px
- Gap: 4px
- Shows: Quantity, Product, Status, View Order Details link
- Link href: /orders?selected={orderId}

### Interaction Behavior

**Per UI-SPEC decisions:**
- D-04: Entire row is click target (button wraps content)
- D-05: Multiple events can be expanded simultaneously (no accordion)
- D-06: Expanded order shows Quantity, Product, Status, View link
- Bin events are clickable but show no expanded detail (no orderId field)

### Accessibility

- Row: role="button", aria-expanded, tabIndex={0}
- Click target: entire row (44px+ height from content)
- Keyboard: Enter/Space toggles expand
- Focus indicator: primary color ring (focus:ring-2 focus:ring-primary)

## Deviations from Plan

None - plan executed exactly as written. All 8 test cases passed in GREEN phase, refactor phase extracted TimelineItem component as suggested in plan.

## Known Stubs

None. Component is fully functional with proper event display, expand/collapse behavior, and order detail links.

## Threat Flags

None. All security concerns addressed in plan's threat model:
- Link href uses orderId from trusted ActivityEvent prop (no user input)
- Navigation is internal only (/orders?selected=)

## Testing

**Test coverage: 8 test cases**
1. Empty state rendering
2. Timeline items rendering
3. Click to expand
4. Click to collapse
5. Multiple rows expanded
6. Expanded order content
7. View Order Details link href
8. Bin events without expanded detail

**All tests passing:** ✓

## Files Created

| File | Lines | Exports | Purpose |
|------|-------|---------|---------|
| src/components/ActivityTimeline.tsx | 173 | ActivityTimeline | Timeline component with expand/collapse |
| src/components/ActivityTimeline.test.tsx | 243 | - | TDD test suite (8 tests) |

## Self-Check: PASSED

**Created files exist:**
✓ src/components/ActivityTimeline.tsx
✓ src/components/ActivityTimeline.test.tsx

**Commits exist:**
✓ 2c1dbb2 (RED phase)
✓ a77d709 (GREEN phase)
✓ 9eebe17 (REFACTOR phase)

**Component exports:**
✓ export function ActivityTimeline

**Tests passing:**
✓ 8/8 tests passed

**Must-have truths verified:**
✓ User can click any timeline row to expand it
✓ User can click expanded row to collapse it
✓ Multiple rows can be expanded simultaneously
✓ Expanded order events show Quantity, Product, Status, View link
✓ View Order Details link navigates to /orders?selected={orderId}

**Key links verified:**
✓ import { ActivityEvent, ActivityEventType } from '@/types/activity'
✓ Link href="/orders?selected={orderId}"

All success criteria met. Component ready for integration into customer detail page (Phase 14 Plan 03).
