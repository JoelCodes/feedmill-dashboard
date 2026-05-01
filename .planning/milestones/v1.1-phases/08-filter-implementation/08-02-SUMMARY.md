---
phase: 08-filter-implementation
plan: 02
subsystem: filter-pills
tags: [filter-integration, multi-select, state-management, mill-production]
dependency_graph:
  requires: [FilterPill component from 08-01, ProductionState types, millProduction service]
  provides: [Filter functionality for mill production page]
  affects: [mill-production page, future filter implementations]
tech_stack:
  added: []
  patterns: [multi-select toggle, static count badges, dynamic filtering]
key_files:
  created: []
  modified:
    - src/app/mill-production/page.tsx
decisions:
  - "Used Set<ProductionState> for activeStates to enable efficient multi-select toggle behavior"
  - "stateCounts depends only on orders (static) per D-06/D-07 requirement"
  - "filteredOrders depends on both orders and activeStates for dynamic filtering"
  - "Empty activeStates.size === 0 shows all orders (default state per FILTR-05)"
  - "PRODUCTION_STATE_PILL_CONFIG maps ProductionState to FilterPillColorConfig per UI-SPEC"
  - "Filter strip positioned between Header and mill columns with flex gap-2.5 layout"
metrics:
  duration: 94s
  tasks_completed: 2
  tests_added: 0
  commits: 2
  completed_date: 2026-04-29
---

# Phase 08 Plan 02: Mill Production Filter Pills Integration

**One-liner:** Integrated FilterPill component into mill-production page with multi-select toggle behavior and static count badges.

## Objective

Enable users to filter production cards by state (Completed, Mixing, Blocked, Pending) with multi-select toggle behavior and real-time visual feedback.

## What Was Built

### Filter State Management
- **activeStates:** `useState<Set<ProductionState>>(new Set())` for tracking selected filters
- **toggleState:** Function to add/remove states from the active set (multi-select toggle behavior)
- **stateCounts:** Memoized computation of order counts per state (static, depends only on `orders`)
- **filteredOrders:** Memoized computation of visible orders (dynamic, depends on `orders` and `activeStates`)

### Color Configuration
- **PRODUCTION_STATE_PILL_CONFIG:** Record mapping ProductionState to FilterPillColorConfig
  - Completed: success-light bg, success-dark text, success dot
  - Mixing: warning-light bg, warning text, warning dot
  - Blocked: error-light bg, error-dark text, error dot
  - Pending: pending-light bg, gray text, pending dot

### Filter Strip UI
- **Positioned:** Between Header and mill columns in main layout
- **Layout:** flex gap-2.5 container
- **Pills rendered:** STATE_ORDER.map(state => FilterPill)
- **Props wired:** label, count (from stateCounts), color config, isActive, onClick toggle

### Data Flow
- **ordersByMill:** Updated to use `filteredOrders` instead of `orders`
- **MillColumn components:** Now receive filtered data based on active states
- **Default state:** Empty activeStates shows all cards (FILTR-05)

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files | Duration |
|------|------|--------|-------|----------|
| 1 | Add filter state and color config | 424255e | src/app/mill-production/page.tsx | ~30s |
| 2 | Render filter strip and wire filtered data | 70bd92f | src/app/mill-production/page.tsx | ~30s |

### Task 1: Add Filter State and Color Config to Mill-Production Page

**Commit:** `424255e`

**Changes:**
- Added `useMemo` to react import
- Added import for `FilterPill` and `FilterPillColorConfig`
- Created `PRODUCTION_STATE_PILL_CONFIG` constant with color configs per state
- Added `activeStates` state with `Set<ProductionState>` type
- Added `toggleState` function for multi-select toggle behavior
- Added `stateCounts` memoized computation (depends only on `orders`)
- Added `filteredOrders` memoized computation (depends on `orders` and `activeStates`)

**Verification:**
- ✅ grep verified `useState<Set<ProductionState>>` present
- ✅ grep verified `PRODUCTION_STATE_PILL_CONFIG` present
- ✅ TypeScript compilation succeeds

### Task 2: Render Filter Strip and Wire Filtered Data to Columns

**Commit:** `70bd92f`

**Changes:**
- Updated `ordersByMill` to use `filteredOrders.filter` instead of `orders.filter`
- Added filter strip JSX between Header and mill columns
- Map STATE_ORDER to FilterPill components with:
  - `label={state}`
  - `count={stateCounts[state]}`
  - `color={PRODUCTION_STATE_PILL_CONFIG[state]}`
  - `isActive={activeStates.has(state)}`
  - `onClick={() => toggleState(state)}`
- Filter strip uses `className="flex gap-2.5"` layout

**Verification:**
- ✅ grep verified `FilterPill` present (3 occurrences: import + 2 in JSX)
- ✅ grep verified `filteredOrders.filter` present (3 occurrences for 3 mill lines)
- ✅ `npm run build` succeeds with no TypeScript errors

## Verification Results

### Automated Tests
- ✅ TypeScript compilation succeeds (`npm run build`)
- ✅ No eslint errors
- ✅ All imports verified present
- ✅ All expected patterns verified present

### Manual Verification (checkpoint reached)
Awaiting human verification of:
- Filter pills visible above mill columns
- Count badges show correct totals per state
- Clicking pills toggles active state (blue background)
- Multi-select behavior works (multiple pills can be active)
- Cards filter correctly (non-matching cards hidden)
- Default state (no pills selected) shows all cards
- Count badges remain static during filtering

## Known Stubs

None - this plan integrates existing FilterPill component with existing mock data service.

## Technical Notes

### State Management Pattern

**Multi-select with Set:**
```typescript
const [activeStates, setActiveStates] = useState<Set<ProductionState>>(new Set());
```
Using Set instead of array provides:
- O(1) has() lookups for `isActive={activeStates.has(state)}`
- Built-in add/delete methods for toggle behavior
- No duplicate concerns

**Toggle function:**
```typescript
const toggleState = (state: ProductionState) => {
  setActiveStates(prev => {
    const next = new Set(prev);
    if (next.has(state)) {
      next.delete(state);
    } else {
      next.add(state);
    }
    return next;
  });
};
```
Creates new Set for React state immutability.

### Memoization Strategy

**Static counts (D-06/D-07):**
```typescript
const stateCounts = useMemo(() => {
  return STATE_ORDER.reduce((acc, state) => {
    acc[state] = orders.filter(o => o.state === state).length;
    return acc;
  }, {} as Record<ProductionState, number>);
}, [orders]);
```
Depends only on `orders`, NOT on `activeStates`. Counts remain constant regardless of filter state.

**Dynamic filtering:**
```typescript
const filteredOrders = useMemo(() => {
  if (activeStates.size === 0) return orders;
  return orders.filter(order => activeStates.has(order.state));
}, [orders, activeStates]);
```
Depends on both `orders` and `activeStates`. Empty set returns all orders (default state).

### Color Configuration

**PRODUCTION_STATE_PILL_CONFIG structure:**
- Maps ProductionState enum to FilterPillColorConfig interface
- Uses Tailwind color classes from design system
- Includes semi-transparent countBg values (e.g., `bg-[#2f855a22]`)
- Provides dot colors for inactive state visual variety

### Data Flow

**Before filtering:**
```typescript
ordersByMill = {
  Premix: orders.filter(...),
  Excel: orders.filter(...),
  CGM: orders.filter(...)
}
```

**After filtering:**
```typescript
ordersByMill = {
  Premix: filteredOrders.filter(...),
  Excel: filteredOrders.filter(...),
  CGM: filteredOrders.filter(...)
}
```

Single change point ensures all mill columns respect filter state.

## Requirements Coverage

### Fully Implemented
- ✅ FILTR-01: Filter pills visible above mill columns with Completed, Mixing, Blocked, Pending labels
- ✅ FILTR-02: Clicking a pill shows only cards matching that status
- ✅ FILTR-03: Multiple pills can be active for combined filtering
- ✅ FILTR-04: Count badges show total orders per status (static)
- ✅ FILTR-05: Default state (no pills selected) shows all cards
- ✅ D-03: Non-matching cards hidden (not dimmed) - filteredOrders removes them from data flow
- ✅ D-06/D-07: Counts remain static regardless of filter state

## Self-Check: PASSED

**Modified files exist:**
```bash
✅ FOUND: src/app/mill-production/page.tsx
```

**Expected patterns present:**
```bash
✅ FOUND: import FilterPill
✅ FOUND: import { useMemo }
✅ FOUND: PRODUCTION_STATE_PILL_CONFIG
✅ FOUND: useState<Set<ProductionState>>
✅ FOUND: const toggleState
✅ FOUND: const stateCounts = useMemo
✅ FOUND: const filteredOrders = useMemo
✅ FOUND: filteredOrders.filter (3x for 3 mill lines)
✅ FOUND: FilterPill component usage in JSX
✅ FOUND: STATE_ORDER.map
```

**Commits exist:**
```bash
✅ FOUND: 424255e (Task 1 - add filter state and color config)
✅ FOUND: 70bd92f (Task 2 - render filter strip and wire filtered data)
```

**Build succeeds:**
```bash
✅ npm run build completes successfully
✅ No TypeScript errors
✅ No compilation warnings
```

## Next Steps

**Checkpoint reached:** Task 3 (checkpoint:human-verify) requires visual/functional verification.

**To verify:**
1. Run `npm run dev` and navigate to http://localhost:3000/mill-production
2. Verify filter pills visible above mill columns
3. Verify count badges show correct totals
4. Click pills to verify toggle behavior (blue background when active)
5. Test multi-select (click multiple pills)
6. Verify cards filter correctly (non-matching cards hidden)
7. Deselect all pills to verify default state (all cards visible)
8. Verify count badges remain static during all filter changes

**After approval:** Plan 08-02 complete. All filter requirements (FILTR-01 through FILTR-05) implemented.
