---
phase: 11-foundation-data-layer
plan: 03
subsystem: data-layer
tags: [tdd, service, bins, filtering]
dependency_graph:
  requires: [11-01]
  provides: [getBins, getBinsByCustomerId]
  affects: [customer-detail-bins-tab]
tech_stack:
  added: []
  patterns: [async-service-pattern, delay-simulation]
key_files:
  created:
    - src/services/bins.ts
    - src/services/bins.test.ts
  modified: []
decisions:
  - Alert levels pre-computed in mockData, service returns as-is
  - No refactor phase needed - implementation already minimal
metrics:
  duration: 143s
  completed: "2026-05-05T00:41:18Z"
  tasks: 2
  files: 2
  tests: 9
---

# Phase 11 Plan 03: Bins Service Summary

Bins service with fill percentage filtering and alert level validation via TDD.

## TDD Cycle

### RED: Failing Tests (commit 3b572f2)

Created `src/services/bins.test.ts` with 9 test cases covering:

**getBins() tests:**
1. Returns array with length > 0
2. Each bin has id property (string)
3. Each bin has fillPercentage property (number)
4. Each bin has alertLevel property ("none" | "low" | "critical")

**getBinsByCustomerId() tests:**
5. Returns only bins for specified customer (CUST-001)
6. Returns empty array for non-existent customer

**Alert level threshold tests:**
7. Bins with fillPercentage < 20 have alertLevel "critical"
8. Bins with fillPercentage 20-39 have alertLevel "low"
9. Bins with fillPercentage >= 40 have alertLevel "none"

Tests failed with: `Cannot find module './bins'` - correct RED state.

### GREEN: Implementation (commit a1624de)

Created `src/services/bins.ts` with:

```typescript
import { Bin } from "@/types/bin";
import { mockBins } from "./mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBins(): Promise<Bin[]> {
  await delay(300);
  return mockBins;
}

export async function getBinsByCustomerId(customerId: string): Promise<Bin[]> {
  await delay(250);
  return mockBins.filter((bin) => bin.customerId === customerId);
}
```

All 9 tests passed.

### REFACTOR: Not Needed

Implementation already follows established patterns from orders.ts:
- Clean imports from @/types and local mockData
- Consistent delay helper pattern
- Simple async functions
- No duplication or unnecessary complexity

No refactoring commit required.

## TDD Gate Compliance

- RED gate: test(11-03) commit exists (3b572f2)
- GREEN gate: feat(11-03) commit exists after RED (a1624de)
- REFACTOR gate: Skipped (not needed)

## Commits

| Phase | Hash | Message |
|-------|------|---------|
| RED | 3b572f2 | test(11-03): add failing test suite for bins service |
| GREEN | a1624de | feat(11-03): implement bins service with customer filtering |

## Verification

```
npm test -- bins.test --watchAll=false

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vitest import in test file**
- **Found during:** RED phase
- **Issue:** Test file initially imported from "vitest" but project uses Jest
- **Fix:** Removed vitest import, rely on Jest globals
- **Files modified:** src/services/bins.test.ts
- **Commit:** 3b572f2 (included in RED commit)

## Self-Check: PASSED

- [x] src/services/bins.ts exists
- [x] src/services/bins.test.ts exists
- [x] Commit 3b572f2 exists
- [x] Commit a1624de exists
- [x] All 9 tests pass
