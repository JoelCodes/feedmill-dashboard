---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: 8
subsystem: header-search-gap-closure
tags: [gap-closure, tdd, search, header, regression-test]
dependency_graph:
  requires: []
  provides: [T3-gap-closed, single-searchbox-on-root, layout-regression-test]
  affects: [src/components/Header.tsx, src/components/Header.test.tsx, src/components/DashboardLayout.test.tsx]
tech_stack:
  added: []
  patterns: [TDD-RED-GREEN, layout-level-integration-test, NuqsTestingAdapter]
key_files:
  modified:
    - src/components/Header.tsx
    - src/components/Header.test.tsx
    - src/components/DashboardLayout.test.tsx
decisions:
  - "Remove Header search input rather than wire it to URL state (routing decision: Header is shared across /demo, /settings, /import — URL state belongs in page-specific component)"
  - "Integration test renders full /  route shell (DashboardLayout+ProductionDashboard) to catch layout-level duplicate-input bugs invisible to standalone tests"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements-completed:
  - PROD-03
  - PROD-04
---

# Phase 34 Plan 8: Remove Dead Header Search Input (T3 Gap Closure) Summary

**One-liner:** Removed dead decorative Header search input and wired a layout-level regression test so the single URL-syncing ProductionDashboard search is the only searchbox on the `/` route.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove dead search input from Header + update Header.test.tsx | 34feba3 | Header.tsx, Header.test.tsx |
| 2 | Add full-route DashboardLayout + ProductionDashboard regression test | 8ecd0a6 | DashboardLayout.test.tsx |

## Files Modified

### src/components/Header.tsx

**Lines removed:**
- `interface HeaderProps { onSearch?: (query: string) => void; }` (prop typedef — 3 lines)
- `import { Search, Bell, Settings } from "lucide-react"` → changed to `import { Bell, Settings } from "lucide-react"` (Search removed)
- `import { useDebounce } from '@/hooks/useDebounce'` (import removed — no longer used)
- `export default function Header({ onSearch }: HeaderProps)` → `export default function Header()` (signature cleaned)
- `const [searchTerm, setSearchTerm] = useState('');` (state removed)
- `const debouncedSearchTerm = useDebounce(searchTerm, 300);` (derivation removed)
- `useEffect(() => { if (onSearch) { onSearch(debouncedSearchTerm); } }, [debouncedSearchTerm, onSearch]);` (effect removed — 5 lines)
- The decorative search `<div>` block (10 lines): `<div className="flex items-center gap-2 rounded-lg bg-[var(--bg-card)]..."><Search .../><input type="text" placeholder="Type here..." .../></div>`

**Preserved:** `useState` (still needed for `isDropdownOpen`), Bell icon, Settings button, notifications wiring, ClerkLoaded/ClerkLoading UserButton, getPageTitle logic.

### src/components/Header.test.tsx

**New tests added** (2 tests in new `describe("Header search removal (T3 gap closure)")`):
- `does not render a searchbox role (T3 gap closure)` — asserts `queryByRole('searchbox')` returns null
- `does not render the legacy 'Type here...' placeholder (T3 gap closure)` — asserts `queryByPlaceholderText('Type here...')` returns null

All 11 existing title-regression tests remain green.

### src/components/DashboardLayout.test.tsx

**New describe block added:** `DashboardLayout + ProductionDashboard integration (T3 gap closure)`

**New tests (2):**
1. `renders exactly one searchbox on the '/\' route` — renders full layout shell + ProductionDashboard, asserts `getAllByRole('searchbox')` has length 1 with placeholder `'Search orders...'`
2. `the surviving searchbox writes ?q to the URL via nuqs` — uses `jest.useFakeTimers()` + `jest.advanceTimersByTime(200)` to flush the 150ms debounce, asserts the nuqs `onUrlUpdate` callback receives `q=acme`

**Mocks added** to support integration render without DB/server-action dependencies:
- `@/hooks/useProductionPolling` — prevents 30s polling interval from running
- `./ProductionDrawer` — prevents DB connection via transitions.ts
- `./DrawerSkeleton` — lightweight passthrough
- `@/actions/transitions` — prevents server action imports
- `next/link` — jsdom-compatible passthrough

All 4 existing DashboardLayout tests preserved and green.

## Regression Class Closed

**Standalone-component test blindspot:** Prior to this plan, Header.test.tsx and ProductionDashboard.test.tsx each rendered their component in isolation. A duplicate-input bug (two search fields on the same route) is invisible when each component is tested alone. The new integration test in DashboardLayout.test.tsx renders the full shell and catches exactly this class of bug.

## T3 UAT Gap Status

UAT gap T3: "Search input writes `?q=…` to URL when typing."

Root cause: Two search inputs rendered on `/`. User typed in Header's dead `type="text"` input (placeholder "Type here...") that was never wired to URL state. The URL never updated.

Fix: Dead input removed from Header. The surviving `type="search"` input in ProductionDashboard (placeholder "Search orders...") is URL-synced via nuqs with 150ms debounce. T3 is now closable on re-test.

## Test Results

```
Test Suites: 5 passed, 5 total
Tests:       48 passed, 48 total
```

- Header.test.tsx: 30 tests (28 pre-existing + 2 new gap-closure tests)
- DashboardLayout.test.tsx: 6 tests (4 pre-existing + 2 new integration tests)
- ProductionDashboard.test.tsx: 12 tests (unchanged)
- Additional Header-related suites: pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stubs introduced by this plan.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- [x] `src/components/Header.tsx` modified — dead search input removed
- [x] `src/components/Header.test.tsx` modified — 2 new T3 tests added
- [x] `src/components/DashboardLayout.test.tsx` modified — integration regression block added
- [x] Commit 34feba3 exists (Task 1)
- [x] Commit 8ecd0a6 exists (Task 2)
- [x] `grep -n "onSearch|Type here\.\.\." src/components/Header.tsx` returns no matches
- [x] All 48 tests pass across Header, ProductionDashboard, DashboardLayout suites
