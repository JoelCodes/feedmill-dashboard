---
phase: 34-production-dashboard-ui-and-homepage-promotion
plan: "02"
subsystem: hooks
tags: [polling, hooks, tdd, react, next-navigation, fake-timers]

# Dependency graph
requires: []
provides:
  - "useProductionPolling hook — 30s setInterval + cleanup via useEffect"
  - "REFRESH_INTERVAL_MS = 30_000 exported constant (single source of truth for Phase 35)"
affects:
  - "34-03 and later plans importing useProductionPolling from @/hooks/useProductionPolling"
  - "Phase 35 KPI surfaces importing REFRESH_INTERVAL_MS"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "setInterval + clearInterval cleanup idiom in useEffect (extends useDebounce setTimeout pattern)"
    - "jest.useFakeTimers + renderHook + jest.advanceTimersByTime for timer-driven hook tests"
    - "jest.mock('next/navigation') with jest.fn() for router.refresh spy"

key-files:
  created:
    - src/hooks/useProductionPolling.ts
    - src/hooks/__tests__/useProductionPolling.test.ts
  modified: []

key-decisions:
  - "REFRESH_INTERVAL_MS = 30_000 exported (not inlined) so Phase 35 KPI components share exact same cadence — prevents drift (D-19)"
  - "Hook returns void and has no params — simplest possible contract, pure side-effect"
  - "useEffect deps array includes [router] to match React linter expectations; router identity is stable per Next.js docs"

patterns-established:
  - "Pattern: timer hook — useEffect(() => { const id = setInterval(fn, MS); return () => clearInterval(id); }, [dep])"
  - "Pattern: fake-timer test — useFakeTimers in beforeEach, useRealTimers in afterEach, mockClear in beforeEach"

requirements-completed: [PROD-09]

# Metrics
duration: 2min
completed: 2026-05-14
---

# Phase 34 Plan 02: useProductionPolling Hook Summary

**30-second setInterval polling hook with `REFRESH_INTERVAL_MS = 30_000` exported constant — TDD RED/GREEN, 4/4 tests passing**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-14T19:14:07Z
- **Completed:** 2026-05-14T19:15:43Z
- **Tasks:** 2 (RED + GREEN)
- **Files created:** 2

## Accomplishments

- Wrote four failing tests (RED) covering 30s interval tick, 60s double-tick, cleanup on unmount, and named constant value
- Implemented minimal `useProductionPolling` hook (4 lines of logic) with `'use client'` directive
- All 4 tests turned GREEN with the implementation; no REFACTOR needed
- `REFRESH_INTERVAL_MS = 30_000` exported as canonical single source of truth for Phase 35 KPI consumers

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED  | `59951d8` — `test(34-02): RED useProductionPolling cadence + cleanup` | PASSED (module-not-found compile error = RED signal) |
| GREEN | `9f57689` — `feat(34-02): GREEN useProductionPolling — 30s router.refresh polling hook` | PASSED (4/4 tests pass) |
| REFACTOR | N/A | Hook body is 4 lines; no cleanup warranted |

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Write failing tests** — `59951d8` (test)
2. **Task 2 (GREEN): Implement hook** — `9f57689` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/hooks/useProductionPolling.ts` — `'use client'` hook; exports `REFRESH_INTERVAL_MS = 30_000` and `useProductionPolling(): void`
- `src/hooks/__tests__/useProductionPolling.test.ts` — 4 fake-timer tests covering cadence, double-tick, cleanup, and constant value

## Phase 35 Consumer Note

Phase 35 KPI surfaces wanting the same polling cadence should:

```typescript
import { REFRESH_INTERVAL_MS } from '@/hooks/useProductionPolling';
// or simply call the hook:
import { useProductionPolling } from '@/hooks/useProductionPolling';
```

`REFRESH_INTERVAL_MS` is the canonical value. Do NOT re-derive `30_000` inline in Phase 35 components — import it here to prevent drift (D-19).

## Decisions Made

- Exported `REFRESH_INTERVAL_MS` rather than inlining the literal — single source of truth for D-19
- Hook returns `void` with no parameters — minimal contract, matches plan spec
- `useEffect` deps include `[router]` — satisfies React exhaustive-deps; `useRouter()` returns a stable reference in Next.js, so this doesn't cause extra re-runs
- No REFACTOR commit — hook body is intentionally minimal (one `setInterval` + one `clearInterval`)

## Deviations from Plan

None — plan executed exactly as written. RED/GREEN sequence followed per TDD spec.

## Issues Encountered

- `npm test -- --testPathPattern=...` flag was replaced by `--testPathPatterns` in the installed Jest version; used the correct flag. Not a code issue.
- Pre-existing `tsc --noEmit` errors in unrelated schema test files (`src/db/schema/__tests__/events.test.ts`, `src/db/schema/__tests__/orders.test.ts`) — out of scope; the new hook files are type-clean.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. The hook is a pure client-side timer — same trust boundary as the initial page render (T-34-02-01 through T-34-02-04 documented in plan threat model, all accepted).

## Self-Check

- `src/hooks/useProductionPolling.ts` exists: FOUND
- `src/hooks/__tests__/useProductionPolling.test.ts` exists: FOUND
- RED commit `59951d8` exists: FOUND
- GREEN commit `9f57689` exists: FOUND
- 4/4 tests pass (verified via `npm test`)

## Self-Check: PASSED

## Next Phase Readiness

- `useProductionPolling` is ready for import by `ProductionDashboard.tsx` (plan 34-03 or later)
- `REFRESH_INTERVAL_MS` is ready for Phase 35 KPI surfaces
- No blockers

---
*Phase: 34-production-dashboard-ui-and-homepage-promotion*
*Completed: 2026-05-14*
