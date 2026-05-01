---
phase: 07-data-infrastructure
plan: 01
subsystem: data-infrastructure
tags: [mock-data, types, mill-production]
dependency_graph:
  requires: []
  provides: [expanded-mock-orders, texture-type-field, line-code-field]
  affects: [mill-production-view, filter-implementation]
tech_stack:
  added: []
  patterns: [mock-data-service]
key_files:
  created: []
  modified:
    - src/types/millProduction.ts
    - src/services/millProduction.ts
decisions:
  - Added textureType and lineCode as optional fields for backward compatibility
  - Expanded from 12 to 33 orders with realistic data from Book1.xlsx examples
  - Maintained even distribution across mill lines (11/11/11)
  - Used production-weighted state distribution (45% Completed, 27% Pending, 18% Mixing, 9% Blocked)
metrics:
  duration: 131s
  completed_date: 2026-04-29
---

# Phase 07 Plan 01: Expand Mock Production Orders Summary

**One-liner:** Expanded mock production orders from 12 to 33 entries with realistic Book1.xlsx data, adding textureType and lineCode fields to ProductionOrder type for filter pill implementation.

## Execution Record

**Status:** ✓ Complete
**Duration:** 2m 11s
**Tasks completed:** 2/2
**Commits:** 2

## What Was Built

Extended the production order data infrastructure to support filter pill functionality by:

1. **Type Extension**: Added optional `textureType` and `lineCode` fields to `ProductionOrder` interface
2. **Data Expansion**: Grew mock dataset from 12 to 33 orders with realistic customer names, products, weights, and codes from example data
3. **Distribution Alignment**: Ensured proper distribution across mill lines and production states for realistic filter testing

The implementation maintains backward compatibility (fields are optional) while ensuring all 33 mock orders have these fields populated.

## Tasks Completed

| # | Task | Commit | Files Modified |
|---|------|--------|----------------|
| 1 | Extend ProductionOrder type with textureType and lineCode fields | ddc0f14 | src/types/millProduction.ts |
| 2 | Expand mockOrders array from 12 to 33 orders with realistic data | 60cd2a9 | src/services/millProduction.ts |

## Technical Implementation

### Type Definitions (Task 1)

Added two optional fields to `ProductionOrder` interface:
- `textureType?: string` — Feed texture (MASH, PELLET, C. CRUMBLE, SH PELLET, FINE CR)
- `lineCode?: string` — Numeric formula code (33161, 22563, 66218, etc.)

Fields are optional for backward compatibility per hybrid approach (Decision D-01).

### Mock Data Expansion (Task 2)

Replaced 12-order array with 33 orders following precise distributions:

**Mill Line Distribution:**
- Premix: 11 orders
- Excel: 11 orders
- CGM: 11 orders

**State Distribution (production-weighted per D-08):**
- Completed: 15 orders (45%)
- Pending: 9 orders (27%)
- Mixing: 6 orders (18%)
- Blocked: 3 orders (9%)

**Data Sources:**
- Customer names from Book1.xlsx (Westbridge Farm, Severinski Farm Inc, Rockwall @ Peardonville, etc.)
- Product names from example data (BROILER BRD 16% OS, SEVERINSKI DAIRY MASH, etc.)
- Texture types from source data (MASH, PELLET, SH PELLET, FINE CR, C. CRUMBLE)
- Line codes from example data (33161, 22563, 66218, 44114, etc.)
- Weight range: 3,000 - 21,000 lbs
- Delivery times: 6:00 AM - 3:00 PM spread

### Verification Results

All acceptance criteria met:
- ✓ TypeScript compilation passes (`npx tsc --noEmit`)
- ✓ Next.js build passes (`npm run build`)
- ✓ 33 total orders (grep count confirmed)
- ✓ 11 Premix, 11 Excel, 11 CGM (grep counts confirmed)
- ✓ 15 Completed, 9 Pending, 6 Mixing, 3 Blocked (grep counts confirmed)
- ✓ All 33 orders have textureType populated
- ✓ All 33 orders have lineCode populated

## Deviations from Plan

None - plan executed exactly as written.

## Dependencies

**Requires:** None (foundational data infrastructure)

**Provides:**
- Expanded mock order dataset ready for filter implementation
- Type definitions supporting textureType and lineCode filtering
- Realistic data distribution for comprehensive filter testing

**Affects:**
- Phase 08 filter pill implementation (will use these fields)
- Mill production view rendering (now has 33 orders to display)

## Known Issues

None.

## Self-Check: PASSED

**Files created/modified verification:**
- ✓ src/types/millProduction.ts exists and contains textureType, lineCode fields
- ✓ src/services/millProduction.ts exists and contains 33 orders

**Commit verification:**
- ✓ ddc0f14 exists in git log (Task 1)
- ✓ 60cd2a9 exists in git log (Task 2)

**Build verification:**
- ✓ TypeScript compilation clean
- ✓ Next.js production build successful
