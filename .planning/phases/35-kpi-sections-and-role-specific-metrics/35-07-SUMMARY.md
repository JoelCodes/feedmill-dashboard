---
phase: 35
plan: "07"
subsystem: integration
tags: [tdd, integration, rsc, layout, dashboard, mill-column, kpi-03, tz-cookie, manual-uat, wave-4]
dependency_graph:
  requires:
    - "Plan 35-04: getKpiStrip, getSevenDayTrend, getBlockedWithDwell, KpiStripData, TrendDay, BlockedOrderWithDwell types"
    - "Plan 35-04: DEFAULT_TIMEZONE, sanitizeIanaTimezone from src/lib/timezone.ts"
    - "Plan 35-05: KpiStrip, KpiStripSkeleton, TzBootstrap components"
    - "Plan 35-06: KpiSection, KpiSectionSkeleton components"
    - "Phase 34: ProductionDashboard, MillColumn, useProductionPolling, page.tsx RSC pattern"
  provides:
    - "ColumnSummary interface exported from MillColumn.tsx"
    - "MillColumn.tsx KPI-03 header strip: {N} orders — {completedLbs} / {totalLbs} lbs"
    - "ProductionDashboard.tsx: three-zone layout with KpiStrip + KpiSection + columnSummaries"
    - "src/app/page.tsx: tz cookie read + 6-query parallel fan-out + KPI props to ProductionDashboard"
    - "src/app/layout.tsx: TzBootstrap mounted inside NuqsAdapter adjacent to {children}"
  affects:
    - "All authenticated users on / route: KPI-01..KPI-08 now visible"
    - "v2.0 milestone: all 38 requirements satisfied (pending operator UAT sign-off)"
tech_stack:
  added: []
  patterns:
    - "Cookie read via cookies() from next/headers + DEFAULT_TIMEZONE fallback (D-02)"
    - "6-query parallel Promise.all fan-out in RSC page"
    - "useMemo with [orders] dependency for unfiltered columnSummaries (Pitfall 6)"
    - "Suspense fallbacks per zone: KpiStripSkeleton (zone 1) + KpiSectionSkeleton (zone 3)"
    - "TzBootstrap mounted at layout level (runs once per browser session)"
key_files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/page.test.tsx
    - src/components/MillColumn.tsx
    - src/components/MillColumn.test.tsx
    - src/components/ProductionDashboard.tsx
    - src/components/ProductionDashboard.test.tsx
    - src/components/DashboardLayout.test.tsx
decisions:
  - "ColumnSummary defined in MillColumn.tsx (not ProductionDashboard.tsx) — imported by ProductionDashboard to pass back as props"
  - "computeColumnWeights removed from MillColumn.tsx header (no longer internal) — moved to ProductionDashboard.tsx useMemo derivation per Pitfall 6"
  - "DashboardLayout.test.tsx updated to add KPI mocks + props (Rule 1 auto-fix caused by ProductionDashboard Props extension)"
  - "settings/__tests__/page.test.tsx pre-existing failures (14 tests) are out of scope — unrelated ClerkProvider mock issue from prior wave"
  - "BlockedAlertBand.tsx build error is pre-existing (startTransition void type mismatch) — not introduced by Plan 35-07"
metrics:
  duration: "~45 minutes"
  completed: "2026-05-14"
  tasks_completed: 3
  tasks_total: 4
  files_modified: 8
---

# Phase 35 Plan 07: Final Integration Summary

**One-liner:** Full KPI dashboard integration wiring TzBootstrap, tz cookie read, 6-query RSC fan-out, three-zone layout (KpiStrip / MillColumn KPI-03 headers / KpiSection), and Pitfall 6 unfiltered column summaries.

## What Was Built

### Task 1: MillColumn KPI-03 Summary Prop (TDD)

- Exported `ColumnSummary` interface `{ orderCount, completedLbs, totalLbs }` from `MillColumn.tsx`
- Added required `summary: ColumnSummary` prop to `MillColumnProps`
- Replaced internal `computeColumnWeights(orders)` call with `summary` prop values in the column header
- Header now renders: `{N} orders — {completedLbs} / {totalLbs} lbs` with:
  - `{N} orders` span in `var(--text-primary)` color
  - ` — ` separator span in `var(--text-muted)` color
  - `{completedLbs} / {totalLbs} lbs` span in `var(--text-muted)` color
- 11 tests total (3 new KPI-03 tests + 8 updated regression tests)
- TypeScript error in `ProductionDashboard.tsx` (3 MillColumn callers missing `summary` prop) was the intentional Task 2 handoff signal

### Task 2: ProductionDashboard KPI Zone Wiring (TDD)

- Extended `Props` type with `kpiStrip: KpiStripData`, `kpiTrend: TrendDay[]`, `kpiBlocked: BlockedOrderWithDwell[]`
- Added `columnSummaries` derivation via `useMemo([orders])` — **UNFILTERED `orders` prop, NOT `filtered`** (Pitfall 6)
  - Formula: `orders.filter(o => o.millLine === line)` → `computeColumnWeights(lineOrders)` → `{ orderCount, completedLbs, totalLbs }`
  - All 3 MillLine values computed in a single `Object.fromEntries` call
- Slotted `<Suspense fallback={<KpiStripSkeleton />}><KpiStrip kpis={kpiStrip} /></Suspense>` ABOVE filter pills (zone 1, D-07)
- Passed `summary={columnSummaries.{line}}` to all 3 `<MillColumn>` render sites (zone 2, KPI-03)
- Slotted `<Suspense fallback={<KpiSectionSkeleton />}><KpiSection trendData={kpiTrend} exceptions={kpiBlocked} /></Suspense>` BELOW columns (zone 3, D-07)
- 20 tests total (8 new KPI tests + 12 existing regression tests)
- Critical Pitfall 6 test (Test 5): 4 Premix orders, Completed filter active, header still shows "4 orders"
- Auto-fix (Rule 1): Updated `DashboardLayout.test.tsx` to add KPI mocks + required props

### Task 3: page.tsx Cookie Read + KPI Fan-out + layout.tsx TzBootstrap (TDD)

- `layout.tsx`: Added `import TzBootstrap from '@/components/TzBootstrap'`; mounted `<TzBootstrap />` inside `<NuqsAdapter>` before `{children}`
- `page.tsx` imports: added `cookies` from `next/headers`; `getKpiStrip, getSevenDayTrend, getBlockedWithDwell` from `@/db/queries/kpis`; `DEFAULT_TIMEZONE` from `@/lib/timezone`
- `page.tsx` cookie read: `const cookieStore = await cookies(); const tz = cookieStore.get('tz')?.value || DEFAULT_TIMEZONE;`
- `page.tsx` extended `Promise.all` from 3 to 6 queries:
  - `getKpiStrip(tz)` — KPI-01/02/04/05
  - `getSevenDayTrend(tz)` — KPI-06
  - `getBlockedWithDwell()` — KPI-07/08 (no `tz` arg — dwell is wallclock-relative per D-03)
- `page.tsx` passes `kpiStrip`, `kpiTrend`, `kpiBlocked` to `<ProductionDashboard>`
- 13 tests total (5 new + 8 existing regression)
- `export const dynamic = 'force-dynamic'` unchanged; zero new `revalidateTag` calls (D-14 invariant preserved)

### Task 4: Manual UAT (Checkpoint — Awaiting Operator Sign-Off)

The automated code tasks are complete. Manual UAT instructions are in the checkpoint message below.

## Cookie Read Fallback Chain (D-02)

```
Browser TzBootstrap writes: document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=86400`
           ↓
page.tsx reads: cookieStore.get('tz')?.value || DEFAULT_TIMEZONE
           ↓
kpis.ts sanitizes: sanitizeIanaTimezone(rawTz) → validates against Intl.supportedValuesOf('timeZone')
           ↓
SQL: ... AT TIME ZONE $sanitizedTz
```

First render (before TzBootstrap runs): `tz = 'America/Chicago'`  
After first poll tick (<=30s): `tz = operator's actual IANA timezone`

## Pitfall 6 Mitigation

`columnSummaries` is derived from the **unfiltered** `orders` prop:

```typescript
const columnSummaries = useMemo<Record<MillLine, ColumnSummary>>(
  () => {
    const lines: MillLine[] = ['Premix', 'Excel', 'CGM'];
    return Object.fromEntries(
      lines.map((line) => {
        const lineOrders = orders.filter((o) => o.millLine === line); // UNFILTERED
        const { completed, total } = computeColumnWeights(lineOrders);
        return [line, { orderCount: lineOrders.length, completedLbs: completed, totalLbs: total }];
      })
    ) as Record<MillLine, ColumnSummary>;
  },
  [orders] // depends on `orders`, NOT `filtered`
);
```

The column **body** uses `ordersByMill[line]` (filtered) — operators see filtered cards.
The column **header** uses `columnSummaries[line]` (unfiltered) — totals stay constant.

## New Test Count (Plan 35-07)

| File | New Tests | Total Tests |
|------|-----------|-------------|
| MillColumn.test.tsx | 3 (KPI-03 format, zero-orders, text-style classes) | 11 |
| ProductionDashboard.test.tsx | 8 (zone order, Pitfall 6, weight derivation, props pass-through) | 20 |
| page.test.tsx | 5 (cookie read, absent/empty fallback, fan-out, props) | 13 |
| DashboardLayout.test.tsx | 0 new (updated to compile) | 6 |
| **Total** | **16 new tests** | **50 tests in modified files** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DashboardLayout.test.tsx missing KPI mocks and props**
- **Found during:** Task 2 GREEN implementation
- **Issue:** ProductionDashboard.tsx Props now requires kpiStrip, kpiTrend, kpiBlocked; DashboardLayout.test.tsx renders ProductionDashboard without these props causing TypeScript compile errors
- **Fix:** Added KpiStrip + KpiSection mocks to DashboardLayout.test.tsx; added kpiStripFixture, trendFixture, exceptionsFixture; passed all three props to the two ProductionDashboard render sites
- **Files modified:** src/components/DashboardLayout.test.tsx
- **Commit:** 4870acc

### Pre-existing Issues (Out of Scope)

**1. BlockedAlertBand.tsx build failure** — `startTransition` return type mismatch (pre-existing from Wave 3). `npm run build` fails on this file. This is documented in the Wave 3 summary (35-06-SUMMARY.md). Out of scope for Plan 35-07.

**2. settings/__tests__/page.test.tsx — 14 failing tests** — ClerkProvider mock issue unrelated to Phase 35. Pre-existing since before c2a15ed base commit.

**3. db/schema/__tests__ TypeScript errors** — `IndexedColumn` type compatibility with `Partial<SQL>` iterator — pre-existing from Drizzle upgrade. Out of scope.

## Known Stubs

None — all KPI data flows from real DB queries through RSC to ProductionDashboard. No hardcoded values.

## Threat Flags

No new security surface introduced beyond what is in the plan's threat model. The `tz` cookie:
- Is sanitized server-side via `sanitizeIanaTimezone()` in every KPI query (Pitfall 2 defense-in-depth)
- Falls back to `DEFAULT_TIMEZONE` when absent or invalid (D-02)
- Contains only non-sensitive IANA timezone data (T-35-07-08: accepted per plan)

## Self-Check

The following automated checks were run before committing:

- `npm test` — 879 passing, 14 pre-existing failing (settings page)
- `npx tsc --noEmit` — 0 errors in Phase 35 files; pre-existing errors in db/schema/__tests__ and BlockedAlertBand.tsx only
- Source assertions for all acceptance criteria in Tasks 1, 2, and 3 — all passed
