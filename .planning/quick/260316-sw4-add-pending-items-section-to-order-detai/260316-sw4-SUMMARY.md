---
phase: quick
plan: 260316-sw4
subsystem: order-details-timeline
tags: [ui, timeline, pending-events, design-implementation]
dependency_graph:
  requires: [02-02]
  provides: [pending-timeline-display]
  affects: [OrderDetails]
tech_stack:
  added: []
  patterns: [conditional-rendering, derived-state]
key_files:
  created: []
  modified:
    - src/app/globals.css
    - src/components/OrderDetails.tsx
decisions:
  - "Split timeline into completed and pending sections based on isPending flag"
  - "Used deliveryDate as reference for calculating estimated pending event dates"
  - "Pending events show outlined circles (white bg + gray border) vs filled circles for completed"
  - "Added Timer icon to both EstimatedBadge and individual pending event dates"
  - "Pending event logic: events are pending if they haven't occurred based on order status"
metrics:
  duration: 134s
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_date: "2026-03-16"
---

# Quick Task 260316-sw4: Add Pending Items Section to Order Details

**One-liner:** Timeline now displays completed events (teal filled circles) and estimated pending events (gray outlined circles) separated by an ESTIMATED badge with timer icon.

## What Was Built

Added pending items section to the order details timeline, creating a clear visual distinction between completed and estimated future events. The timeline now splits into two sections:
- Completed events: teal filled circles with white icons
- ESTIMATED badge: gray badge with timer icon divider
- Pending events: white circles with gray borders, gray icons, and "Est." date prefix with timer icon

## Tasks Completed

### Task 1: Add pending color variables to globals.css
**Commit:** e48b8b9
**Files:** src/app/globals.css

Added CSS variables for pending state styling:
- `--pending: #cbd5e0` - gray color for pending borders and icons
- `--pending-light: #edf2f7` - light gray for badge background
- Added both to @theme inline block for Tailwind usage

### Task 2: Implement pending timeline section in OrderDetails
**Commit:** 1bc3b8f
**Files:** src/components/OrderDetails.tsx

Major enhancements to timeline component:
- Updated `TimelineEvent` interface: added `isPending?: boolean` and `"pending"` color type
- Added pending color mapping: `bg-white border-2 border-pending`, gray bar and text
- Refactored `generateTimelineEvents()` to mark future events as pending based on order status
  - Pending/Producing orders: future steps marked as pending
  - Ready orders: delivery and completion marked as pending
  - In Transit: only completion marked as pending
  - Complete: all events completed
- Imported `Timer` icon from lucide-react
- Created `EstimatedBadge` component with timer icon and "ESTIMATED" text on gray background
- Updated `TimelineItem` component:
  - Pending icons use gray color instead of white
  - Pending dates show Timer icon prefix
  - Circle background uses white with gray border for pending state
- Split timeline rendering: completed events → badge (if pending exist) → pending events
- Updated `TimelineConnector` to support pending color
- Enhanced `formatTimelineDate()` to add "Est." prefix for pending dates

## Implementation Details

### Pending Event Logic
Events are marked as pending based on order status:
- **Pending orders:** Production, Ready, Delivery, and Delivered all pending
- **Producing orders:** Ready, Delivery, and Delivered pending
- **Ready orders:** Delivery and Delivered pending
- **In Transit orders:** Only Delivered pending
- **Complete orders:** No pending events

### Estimated Date Calculations
- Production start: 7 days before delivery date
- Ready for pickup: 2 days before delivery date
- Delivery started: 6 hours before delivery date
- Delivered: delivery date

### Visual Design
Matches design specification:
- Completed: teal (#4fd1c5) filled circles, white icons
- Pending: gray (#cbd5e0) outlined circles, white fill, gray icons
- Badge: light gray (#edf2f7) background, timer icon, uppercase "ESTIMATED" text
- Pending dates: timer icon + "Est." prefix in gray

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- ✅ Build passes: `npm run build` completed without TypeScript errors
- ✅ Timeline splits into completed (teal filled) and pending (gray outlined) sections
- ✅ ESTIMATED badge with timer icon appears between sections when pending events exist
- ✅ Pending dates show timer icon and "Est." prefix
- ✅ All existing completed event styling preserved
- ✅ Conditional rendering: badge only shows when pending events exist

## Self-Check

Verifying created files and commits:

**Files:**
- FOUND: src/app/globals.css (modified)
- FOUND: src/components/OrderDetails.tsx (modified)

**Commits:**
- FOUND: e48b8b9 (Task 1 - pending color variables)
- FOUND: 1bc3b8f (Task 2 - pending timeline section)

## Self-Check: PASSED

All files modified and commits created as documented.
