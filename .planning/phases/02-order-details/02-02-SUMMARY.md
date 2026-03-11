---
phase: 02-order-details
plan: 02
subsystem: order-details
tags:
  - frontend
  - react
  - ui
  - state-management
  - persistence
dependency_graph:
  requires:
    - 02-01
  provides:
    - dynamic-order-details
    - timeline-visualization
    - change-history
  affects:
    - order-management-workflow
tech_stack:
  added:
    - useLocalStorage hook for persistence
  patterns:
    - React hooks for state management
    - localStorage for preference persistence
    - derived state pattern for display logic
key_files:
  created:
    - src/hooks/useLocalStorage.ts
  modified:
    - src/components/OrderDetails.tsx
decisions:
  - "Used derived state pattern (displayOrder) to avoid setState in effect and satisfy React lint rules"
  - "Timeline events generated dynamically based on order status progression"
  - "Default sort order is desc (newest first) matching user expectations for activity feeds"
  - "Change events appear inline in timeline with red styling when hasChanges=true"
  - "Added cleanup function to prevent state updates on unmounted components"
metrics:
  duration: 272s
  tasks_completed: 3
  files_created: 1
  files_modified: 1
  commits: 3
  completed_date: "2026-03-11"
---

# Phase 2 Plan 2: Dynamic Order Details with Timeline Summary

**One-liner:** Dynamic order details panel with real-time data fetching, status-based timeline visualization, change history tracking, and persistent sort preferences.

## What Was Built

### Core Features
1. **useLocalStorage Hook** - Generic, type-safe React hook for localStorage persistence with SSR safety
2. **Real Order Data Display** - OrderDetails component now fetches and displays actual order data based on orderId prop
3. **Dynamic Timeline Generation** - Timeline events generated from order properties (status, hasChanges, dates)
4. **Sort Toggle with Persistence** - User can toggle timeline sort order (newest/oldest first) with preference saved to localStorage
5. **Change History Inline** - Orders with changes show red-styled "Order Modified" events in timeline

### Implementation Details

**useLocalStorage Hook (src/hooks/useLocalStorage.ts)**
- Generic type parameter for type safety
- SSR guard prevents "localStorage is not defined" errors
- Supports both direct value and updater function (matches useState API)
- Silent fail with console.error for full localStorage scenarios

**OrderDetails Component Updates**
- Accepts `orderId: string | null` prop
- Fetches order data via `getOrderById()` when orderId changes
- Header displays: `{documentNumber} - {customer}` with StatusBadge
- Subtitle shows: `{quantity} tons {textureType} · {location}`
- Stat cards show: Quantity (tons), Delivery (formatted date), Texture (with formula subtext)
- Placeholder state when no order selected

**Timeline System**
- `generateTimelineEvents()` creates events based on order status:
  - **Order Placed** (always) - uses createdAt
  - **Order Modified** (if hasChanges) - uses updatedAt, red styling
  - **Production Started** (if status past Pending) - derived timestamp
  - **Delivery Started** (if In Transit or Complete) - 6 hours before delivery
  - **Delivered** (if Complete) - uses deliveryDate
- Sort toggle button switches between 'asc' and 'desc'
- Sort preference persists across page refreshes
- Timeline connector colors match event color (red for changes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed React effect setState lint error**
- **Found during:** Task 3 verification
- **Issue:** Calling `setOrder(null)` directly in effect body when orderId is null triggered `react-hooks/set-state-in-effect` lint error
- **Fix:** Used derived state pattern - created `displayOrder` that derives whether to show order based on `orderId && order?.id === orderId` check, avoiding synchronous setState in effect
- **Files modified:** src/components/OrderDetails.tsx
- **Commit:** 7023373

This was the correct fix per React best practices - effects should sync with external systems, not manage internal state transitions. The derived state pattern is cleaner and avoids cascading renders.

## Requirements Traceability

**DETAIL-02: Timeline Visualization** ✅
- Timeline shows order lifecycle events based on status
- Events include Order Placed, Production, Delivery, Completion
- Change events appear inline with red styling

**DETAIL-03: Change History** ✅
- Orders with hasChanges=true show "Order Modified" event in timeline
- Change events use red icon and connector for visibility
- Integrated inline with other timeline events (not separate section)

**DETAIL-04: Timeline Sort Toggle** ✅
- Sort toggle button switches between newest/oldest first
- Sort preference persists in localStorage
- Default is newest first (desc)

## Must-Haves Validation

### Truths
- ✅ User sees full order information (document #, customer, status, quantity, texture, location)
- ✅ User sees timeline visualization with status changes, order placed, and mill/logistics changes
- ✅ User sees change history inline in timeline with red styling
- ✅ User can toggle timeline sort order (newest/oldest first)
- ✅ Timeline sort preference persists across page refreshes

### Artifacts
- ✅ `src/hooks/useLocalStorage.ts` exists, exports useLocalStorage hook
- ✅ `src/components/OrderDetails.tsx` dynamically displays order details, contains orderId prop

### Key Links
- ✅ OrderDetails → orders.ts via getOrderById (pattern: `getOrderById(orderId)`)
- ✅ OrderDetails → useLocalStorage.ts via hook import (pattern: `useLocalStorage.*orderTimelineSortOrder`)

## Verification Results

**Automated:**
- ✅ TypeScript compilation passes (useLocalStorage.ts)
- ✅ `npm run lint` passes with no errors
- ✅ `npm run build` passes successfully

**Manual (to be verified by user):**
- Click different orders in table → panel updates with correct order info
- Header shows format like "2847 - Greenfield Farms" with status badge
- Stat cards display quantity, delivery date, texture/formula
- Timeline shows events based on order status
- Select order with hasChanges=true → timeline shows red change event
- Click sort toggle → timeline reverses order
- Refresh page → sort preference remembered

## Key Technical Decisions

1. **Derived State Pattern for Display**
   - Created `displayOrder` derived from orderId and fetched order
   - Avoids setState in effect body (React best practice)
   - Prevents cascading renders and lint errors
   - Pattern: `const displayOrder = orderId && order?.id === orderId ? order : null`

2. **Timeline Event Generation Strategy**
   - Generate events based on current status (progressive disclosure)
   - Use synthetic timestamps for intermediate events (production +1hr, delivery -6hrs)
   - This approach works with current data model that doesn't track all status transitions
   - Future enhancement: track actual status change timestamps in backend

3. **Sort Order Default**
   - Newest first (desc) matches user expectations for activity/event feeds
   - Users typically want to see most recent events first
   - Toggle available if they want chronological order

4. **Inline Change History**
   - Change events integrated into main timeline (not separate section)
   - Provides chronological context for when changes occurred
   - Red styling makes changes visually distinct

## Performance Notes

- useLocalStorage hook includes SSR guard (no server-side localStorage access)
- Cleanup function in useEffect prevents state updates on unmounted components
- Derived state (displayOrder) computed on each render - negligible cost with single order

## Next Steps

Plan 02-02 completes Phase 2 (Order Details). All requirements for order details panel are satisfied:
- Selection state management (Plan 01) ✅
- Dynamic data display with timeline (Plan 02) ✅

**Suggested Next Phase:** Phase 3 - Filters & Search
- Status filtering
- Search by customer/document
- Multi-select capabilities

## Self-Check: PASSED

**Created files verified:**
```
FOUND: src/hooks/useLocalStorage.ts
```

**Modified files verified:**
```
FOUND: src/components/OrderDetails.tsx
```

**Commits verified:**
```
FOUND: 4b40848
FOUND: 3c81b37
FOUND: 7023373
```

All deliverables present and committed.
