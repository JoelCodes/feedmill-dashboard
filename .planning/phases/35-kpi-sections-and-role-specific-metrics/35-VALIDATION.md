---
phase: 35
slug: kpi-sections-and-role-specific-metrics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: 35-RESEARCH.md § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + `@testing-library/react` 16 |
| **Config file** | `jest.config.ts` (root) |
| **Quick run command** | `npm test -- --testPathPattern='kpis\|formula-mix\|format-dwell'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds quick, ~60 seconds full |

---

## Sampling Rate

- **After every task commit:** Run quick command (`npm test -- --testPathPattern='kpis|formula-mix|format-dwell'`)
- **After every plan wave:** Run full suite (`npm test`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds (quick) / 60 seconds (full)

---

## Per-Task Verification Map

> Populated by the planner during PLAN.md generation. Each row binds a task → requirement → automated command.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 35-XX-XX | TBD | TBD | KPI-XX | TBD | TBD | unit/RTL/schema | TBD | ❌ W0 / ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/db/queries/__tests__/kpis.test.ts` — KPI-01, KPI-02, KPI-04, KPI-05, KPI-06, KPI-07 query contracts
- [ ] `src/lib/__tests__/formula-mix.test.ts` — `bucketTexture()` all known textures + unknown + NULL
- [ ] `src/lib/__tests__/format-dwell.test.ts` — `formatDwell()` edge cases (<1h, 1–24h, 24h+)
- [ ] `src/components/SevenDayTrendChart.test.tsx` — empty state + 7-bar render
- [ ] `src/components/BlockedExceptionList.test.tsx` — empty state, row sort, overdue badge
- [ ] Extend `src/db/schema/__tests__/orders.test.ts` — assert `earlyDeliveryDate` nullable date column exists
- [ ] Extend `src/components/MillColumn.test.tsx` — `summary` prop + header strip "{N} orders — {completed} / {total} lbs"

---

## TDD Candidates (apply `type: tdd` in PLAN.md)

| Target | Why TDD-eligible |
|--------|-----------------|
| `src/lib/formula-mix.ts` — `bucketTexture()` | Pure function, finite inputs, 3 bucket outputs — RED→GREEN→REFACTOR ideal |
| `src/lib/format-dwell.ts` — `formatDwell()` | Pure function, 3 format cases, defined I/O |
| `src/db/queries/kpis.ts` — all KPI queries | Server-only aggregations with defined I/O; mock `db` object per `orders.test.ts` pattern |
| `src/db/schema/orders.ts` — `earlyDeliveryDate` | Schema assertion test (column type + nullability) |

**Not TDD (use `type: execute`):**
- `KpiCard.tsx` / `KpiStrip.tsx` — presentational / layout — RTL smoke tests only
- `SevenDayTrendChart.tsx` — empty-state + bar-count assertions; SVG geometry verified visually
- `TzBootstrap.tsx` — cookie-write side effect; low-value to unit-test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| KPI cards visually render in correct order/layout per UI-SPEC | KPI-01..KPI-07 | Visual composition / spacing — not behavioral | Load `/` as foreman, screenshot, compare to 35-UI-SPEC.md mockup |
| Browser timezone cookie writes and resolves correctly across DST boundaries | KPI-01, KPI-06 | Browser tz APIs vary; DST behavior environment-dependent | Open DevTools, set `Intl.DateTimeFormat().resolvedOptions().timeZone`, verify `tz` cookie value, reload, confirm "today" KPI uses local midnight |
| Book1.xlsx upload preserves `early_delivery_date` end-to-end | KPI-08 | Requires real Excel file; date-cell parsing depends on workbook format | Run import flow with `example-data/Book1.xlsx`, query DB to verify `early_delivery_date` populated on rows that had the column |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in automated commands
- [ ] Feedback latency < 15s (quick) / 60s (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
