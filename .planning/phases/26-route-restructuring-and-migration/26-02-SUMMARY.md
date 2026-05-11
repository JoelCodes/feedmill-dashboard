---
phase: 26-route-restructuring-and-migration
plan: 02
subsystem: ui
tags: [next.js, react, routing, layout]

# Dependency graph
requires:
  - phase: 26-01
    provides: Context-aware sidebar navigation with demo/production split
provides:
  - Coming Soon homepage at root path (/) using DashboardLayout
  - Header getPageTitle function updated for /demo/* route recognition
  - Root path returns "Coming Soon" title instead of "Dashboard"
affects: [26-03, UAT, production-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Coming Soon placeholder pattern for production routes
    - Demo route prefix detection in Header component

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/components/Header.tsx
    - src/components/Sidebar.tsx (26-01 GREEN phase completion)

key-decisions:
  - "Used DashboardLayout wrapper for Coming Soon page (maintains consistent layout)"
  - "Server component for homepage (no client-side state needed)"
  - "Demo route detection in Header checks /demo/* prefix before legacy routes"

patterns-established:
  - "Pattern 1: Demo routes checked first in getPageTitle (most specific path matching)"
  - "Pattern 2: Coming Soon pages use flex-1 + items-center + justify-center for centering"

requirements-completed: [ROUTE-02]

# Metrics
duration: 3.3min
completed: 2026-05-11
---

# Phase 26 Plan 02: Coming Soon Homepage and Route-Aware Header

**Minimal Coming Soon homepage with DashboardLayout wrapper and Header updated for demo route title detection**

## Performance

- **Duration:** 3.3 min
- **Started:** 2026-05-11T21:37:28Z
- **Completed:** 2026-05-11T21:40:48Z
- **Tasks:** 3 completed
- **Files modified:** 3

## Accomplishments
- Root homepage (/) displays "Coming Soon" message with full dashboard layout
- Header displays correct page titles for /demo/* routes (Orders, Customers, Mill Production)
- Header displays "Coming Soon" title on root path
- Sidebar navigation from 26-01 fully integrated and working

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Header getPageTitle for demo routes** - `0aad408` (feat)
2. **Task 2: Replace homepage with Coming Soon page** - `b3d83bd` (feat)
3. **Task 3: Verify homepage rendering and layout** - (verification only, no commit)

**Deviation fix:** `8536d2b` (feat: 26-01 GREEN phase completion)

## Files Created/Modified
- `src/components/Header.tsx` - Added demo route detection with /demo/* path checks, changed root title to "Coming Soon"
- `src/app/page.tsx` - Replaced Dashboard component with minimal Coming Soon page using DashboardLayout
- `src/components/Sidebar.tsx` - Completed 26-01 GREEN phase (context-aware navigation implementation)

## Decisions Made
- Demo routes checked before legacy routes in Header getPageTitle (most specific path matching)
- Coming Soon page is server component (no "use client" needed for static content)
- Used semantic tokens for text styling (text-[var(--text-primary)], text-text-secondary)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Completed 26-01 GREEN phase implementation**
- **Found during:** Task 2 (Replace homepage with Coming Soon page)
- **Issue:** Plan 26-01 left Sidebar.tsx implementation uncommitted (RED phase commit only). Build initially failed due to cache, then succeeded after clearing .next cache. Sidebar.tsx had uncommitted changes implementing context-aware navigation.
- **Fix:** Committed Sidebar.tsx changes as 26-01 GREEN phase completion. All 7 Sidebar tests pass.
- **Files modified:** src/components/Sidebar.tsx
- **Verification:** npm test -- src/components/Sidebar.test.tsx passes (7/7 tests), npm run build succeeds
- **Committed in:** 8536d2b (separate commit for 26-01 GREEN phase)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking issue)
**Impact on plan:** Fix was necessary to complete 26-01 and unblock 26-02. No scope creep - just completing prior plan's TDD cycle.

## Issues Encountered
- Next.js build cache issue: First build after page.tsx changes failed with "Cannot find name 'navItems'" error in Sidebar.tsx. Clearing .next cache resolved the issue. This was a stale cache problem, not a code issue.

## User Setup Required

None - no external service configuration required.

## Verification Results

- ✅ npm run build succeeds (no TypeScript errors)
- ✅ 28 test suites pass (including Sidebar tests)
- ✅ Header.tsx contains /demo/orders, /demo/customers, /demo/mill-production route checks
- ✅ Header.tsx returns "Coming Soon" for path === '/'
- ✅ page.tsx contains DashboardLayout import
- ✅ page.tsx contains "Coming Soon" and "Production features launching soon."
- ✅ page.tsx does NOT contain "use client" directive
- ✅ page.tsx does NOT contain KPICards or OrdersTable imports

Note: 9 test suites fail due to pre-existing Clerk provider issues in test setup (out of scope for this plan).

## Next Phase Readiness
- Homepage displays Coming Soon placeholder per ROUTE-02 requirement
- Header correctly shows titles for demo routes
- Ready for Phase 26-03: Create demo routes (/demo/orders, /demo/customers, /demo/mill-production)
- No blockers identified

## Self-Check: PASSED

All SUMMARY claims verified:
- ✓ All files exist (page.tsx, Header.tsx, Sidebar.tsx)
- ✓ All commits exist (0aad408, b3d83bd, 8536d2b)
- ✓ File content verified (Coming Soon, DashboardLayout, /demo/orders, isDemoContext)

---
*Phase: 26-route-restructuring-and-migration*
*Completed: 2026-05-11*
