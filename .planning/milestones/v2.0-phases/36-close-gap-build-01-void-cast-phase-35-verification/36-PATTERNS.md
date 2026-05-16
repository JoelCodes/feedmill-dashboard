# Phase 36: Close gap — BUILD-01 void cast + Phase 35 verification — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 7 (5 modify + 2 create)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Action | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/components/BlockedAlertBand.tsx` | MODIFY (line 44) | component (client, RSC drawer-open trigger) | event-driven / request-response (URL-state mutation) | `src/components/BlockedExceptionList.tsx:35` | **exact** (same hook, same callback shape, same file directory) |
| `src/components/BlockedAlertBand.test.tsx` | MODIFY (extend) | test (RTL + source-grep regression) | event-driven (assertion) | `src/components/DrawerSkeleton.test.tsx:38-45` (Test 7) | **exact** (canonical source-grep regression for structural invariants in a component file) |
| `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-VERIFICATION.md` | CREATE | document (phase verification artifact) | n/a (artifact) | `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-VERIFICATION.md` | **exact** (direct structural analog — same phase-verification doc kind) |
| `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-UAT.md` | CREATE | document (human UAT record) | n/a (artifact) | `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md` | **exact** (direct structural analog — same UAT contract kind) |
| `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-VALIDATION.md` | MODIFY (frontmatter + Approval line) | document (Nyquist validation contract) | n/a (artifact) | `.planning/phases/32-schema-migrations-and-seed-data/32-VALIDATION.md` (cleanest `status: complete` frontmatter); `34-VALIDATION.md` (approval line variant `approved YYYY-MM-DD`) | **exact** (same template — only frontmatter values differ) |
| `.planning/STATE.md` | MODIFY (gsd-sdk post-phase mutation) | document (project state) | n/a (artifact) | n/a — handled by gsd-sdk, no human analog needed | n/a |
| `.planning/ROADMAP.md` | MODIFY (gsd-sdk post-phase mutation) | document (project roadmap) | n/a (artifact) | n/a — handled by gsd-sdk, no human analog needed | n/a |

---

## Pattern Assignments

### 1. `src/components/BlockedAlertBand.tsx` (component, event-driven URL-state mutation)

**Analog:** `src/components/BlockedExceptionList.tsx:35` — the closest sibling in `src/components/`, same hook (`useOrderQuery`), same callback shape (`startTransition(() => void setQuery({ order: ... }))`).

**Why this analog over the block-form variants:**
- `ProductionDrawer.tsx:133-135` and `ProductionDashboard.tsx:297-326` use the block form `() => { setQuery({...}) }` — also valid but a multi-line diff at a single-expression call site.
- The expression+`void` shape is a **one-line** diff at `BlockedAlertBand.tsx:44`, matches the closest sibling, and was explicitly recommended by `36-RESEARCH.md §Investigation 1 §Fix shape` and the audit's fix block at `v2.0-MILESTONE-AUDIT.md:36`.

**Imports pattern** (sibling analog — already in place in `BlockedAlertBand.tsx:20-22`, no change):
```typescript
import { startTransition } from 'react';
import { useOrderQuery } from '@/hooks/useOrderQuery';
import type { ProductionOrder } from '@/db/schema/orders';
```

**Hook pattern** (sibling analog `BlockedExceptionList.tsx:33`):
```typescript
const [, setQuery] = useOrderQuery();
```

**Core fix pattern** (copy from `BlockedExceptionList.tsx:35`):
```typescript
// BlockedExceptionList.tsx:35 — canonical reference
const openDrawer = (id: string) => startTransition(() => void setQuery({ order: id }));
```

**Apply to `BlockedAlertBand.tsx:44`** (one-line diff):
```diff
-          onClick={() => startTransition(() => setQuery({ order: order.id }))}
+          onClick={() => startTransition(() => void setQuery({ order: order.id }))}
```

**Why `void`:** `useOrderQuery` returns `[state, setQuery]` where `setQuery({...})` returns `Promise<URLSearchParams>` (non-shallow nuqs setter). React `startTransition(callback)` brands `callback` as `() => void | Promise<void>` via `VoidOrUndefinedOnly`. Expression-arrow form leaks the `Promise<URLSearchParams>` return value; the `void` operator coerces it to `undefined`. Pattern documented in `35-LEARNINGS.md` as "nuqs setQuery returns a Promise — incompatible with `startTransition`" recurring shape.

**Out-of-scope context (lines 39-50 of current file):** Do NOT touch the surrounding JSX, hook call (already correctly configured at `BlockedAlertBand.tsx:32`), or imports. The fix is one character pair on one line.

---

### 2. `src/components/BlockedAlertBand.test.tsx` (test, source-grep regression)

**Analog:** `src/components/DrawerSkeleton.test.tsx:38-45` (Test 7 "component is purely presentational") — the canonical project-local pattern for **source-grep regression tests** that assert structural invariants by reading the component's own source file with `fs.readFileSync` and asserting against a regex.

**Why this analog:**
- It's in `src/components/` next to the test file we are extending.
- It uses `require('fs')` + `path.resolve(__dirname, '<sibling>.tsx')` — the exact pattern that avoids the `@/` alias trap noted in `35-LEARNINGS.md` (worktree jest alias resolves to main project root; reading the file by relative path with `__dirname` resolves correctly).
- The assertion is a simple `expect(content).not.toMatch(...)` / `expect(content).toMatch(...)` — minimal API surface, zero maintenance cost.
- Aligns with the recommendation in `36-RESEARCH.md §Investigation 1 §Recommended regression test surface` approach 3 (source-grep) — paired with `npm run build` for integration-level catch (approach 1).

**Source-grep regression pattern** (verbatim copy from `DrawerSkeleton.test.tsx:38-45`):
```typescript
it('Test 7: component is purely presentational (no useState or onClick in source)', () => {
  // Source assertion — component must not contain useState or onClick
  const fs = require('fs');
  const path = require('path');
  const filePath = path.resolve(__dirname, 'DrawerSkeleton.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  expect(content).not.toMatch(/useState|onClick/);
});
```

**Adapt for `BlockedAlertBand.test.tsx`** (extend the existing `describe('BlockedAlertBand', ...)` block — append after Test 11/T10b at line 126; do NOT rewrite the existing 6 tests):
```typescript
it('Test 12: startTransition callback uses `void setQuery` cast (BUILD-01 regression guard)', () => {
  // Source assertion — the void cast must remain in place so npm run build does not
  // re-fail with TS2322 Promise<URLSearchParams> not assignable to VoidOrUndefinedOnly.
  // Reference fix pattern: BlockedExceptionList.tsx:35.
  const fs = require('fs');
  const path = require('path');
  const filePath = path.resolve(__dirname, 'BlockedAlertBand.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  expect(content).toMatch(/startTransition\(\(\) => void setQuery/);
});
```

**Alternative source-grep precedent** (broader / repo-walking variant for context, NOT needed for this fix): `src/__tests__/no-bad-tailwind-literals.test.ts:79-100` (uses `fs.readFileSync` + `walkFiles` to scan many files for a forbidden pattern). The component-local `__dirname`-relative form is the right scale here because the regression surface is exactly one file.

**Why mocking nuqs more faithfully would NOT catch this:** The existing test file (lines 16-22) mocks `useQueryStates` to return a synchronous `jest.fn()` setter. The mock setter's return shape does NOT match the real nuqs `Promise<URLSearchParams>` return, so the `startTransition` type-mismatch never surfaces at runtime — only at TypeScript compile time. Source-grep + `npm run build` together close the loop. Documented in `36-RESEARCH.md §Investigation 1 §Why TypeScript caught it but tests did not`.

---

### 3. `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-VERIFICATION.md` (document, phase verification artifact)

**Analog:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-VERIFICATION.md` — direct structural template; same phase-verification artifact kind; immediately precedes Phase 35 chronologically.

**Frontmatter pattern** (copy from `34-VERIFICATION.md:1-28`, adapt fields):
```yaml
---
phase: 34-production-dashboard-ui-and-homepage-promotion
verified: 2026-05-14T23:59:00Z
reverified: 2026-05-14
status: verified
score: 11/11 must-haves verified (post UAT retest)
overrides_applied: 1
override_notes: |
  CR-02 / Truth 11 (BlockReasonModal stale closure) — DISPUTED + OVERRIDDEN by orchestrator,
  now CONFIRMED FALSE POSITIVE via T10 retest 2026-05-14...
gaps: []
retest_outcome:
  date: 2026-05-14
  source: 34-HUMAN-UAT-RETEST.md (status: complete)
  results:
    - T3: pass — single search input; ?q= URL sync ...
    - T9: pass — Recent Imports refreshes ~1s post-commit ...
    - T10: pass — Block button on Pending ...
human_verification: []
---
```

**Adapt for Phase 35** (per `36-RESEARCH.md §Investigation 2 §Required frontmatter`):
- `phase: 35-kpi-sections-and-role-specific-metrics`
- `verified: 2026-05-15T<HH:MM>:00Z` (set at write time)
- Drop `overrides_applied` / `override_notes` — no review-fix cycle on Phase 35 (gap is artifact-only, not a CR override).
- `gaps: []` (gates passed before flip — see preconditions in `36-RESEARCH.md §Investigation 4`).
- `retest_outcome.source: 35-UAT.md (status: complete)` with one bullet per UAT scenario summary.
- `score: 8/8 KPI requirements verified` (KPI-01..KPI-08).

**Goal Achievement / Observable Truths table** (copy structure from `34-VERIFICATION.md:42-58`):
```markdown
## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Coming Soon homepage is replaced by a live, DB-backed production dashboard at `/` | ✓ VERIFIED | `src/app/page.tsx` — async RSC, `export const dynamic = 'force-dynamic'`, ... |
| 2 | Three-column layout (Premix / Excel / CGM) populated from DB-backed orders | ✓ VERIFIED | `ProductionDashboard.tsx:200-202` slices filtered orders by millLine. ... |
...

**Score:** 11/11 truths verified
```

**Apply to Phase 35:** One row per ROADMAP success criterion (5 SCs from `36-RESEARCH.md §Phase Goal Restated` → see lines 234-240) + one row per KPI requirement (KPI-01..KPI-08). Score line: `8/8 KPI requirements verified` plus the 5 SC rows.

**Required Artifacts table** (copy structure from `34-VERIFICATION.md:68-82`):
```markdown
### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/page.tsx` | RSC with force-dynamic, DB queries, auth gate | ✓ VERIFIED | `export const dynamic = 'force-dynamic'`; `auth()` redirect; ... |
| `src/components/ProductionDashboard.tsx` | Three-column dashboard, URL-synced state, polling | ✓ VERIFIED | Split `useQueryStates`: status+q shallow; order non-shallow ... |
```

**Apply to Phase 35:** Rows for the Phase 35 NEW files enumerated in `36-RESEARCH.md §Investigation 2 §Required sections`:
`src/db/queries/kpis.ts`, `src/lib/formula-mix.ts`, `src/lib/format-dwell.ts`, `src/lib/timezone.ts`, `src/components/KpiCard.tsx`, `src/components/KpiStrip.tsx`, `src/components/KpiSection.tsx`, `src/components/SevenDayTrendChart.tsx`, `src/components/BlockedExceptionList.tsx`, `src/components/TzBootstrap.tsx`, `drizzle/0001_mute_champions.sql`, `src/db/seed.ts` / `src/db/seed-data.json`.

**Key Link Verification table** (copy from `34-VERIFICATION.md:84-96`):
```markdown
### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/page.tsx` | `getProductionOrders()` | DB query in Promise.all | ✓ WIRED | Line 40 |
| `src/app/page.tsx` | `getOrderById(order)` | Conditional DB query | ✓ WIRED | Line 41 |
| `ProductionDashboard.tsx` order setter | Page RSC re-fetch | `useQueryStates({ order }, { shallow: false })` | ✓ WIRED | Lines 154-157 |
```

**Apply to Phase 35:** Wiring rows for KPI flows — `page.tsx → kpis.ts queries`, `KpiStrip → ProductionDashboard slot`, `MillColumn summary prop`, `KpiSection wrapping`, `revalidateTag('production-orders')` invariant (verify it invalidates KPI queries alongside orders per D-14). See `integration-check-v2.0.md` lines 196-214 for citation source.

**Data-Flow Trace (Level 4) table** (copy from `34-VERIFICATION.md:98-105`):
```markdown
### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `ProductionDashboard.tsx` | `orders` | `getProductionOrders()` in `page.tsx` RSC | Yes — DB query | ✓ FLOWING |
```

**Apply to Phase 35:** Traces for `tz cookie → page.tsx cookies().get('tz') → getKpiStrip(tz) → SQL AT TIME ZONE → KpiStrip props`; `getSevenDayTrend → SevenDayTrendChart data` (**must cite `src/db/queries/kpis.ts:313` `sql.raw()` tz inlining** — the load-bearing fix from commits ba54b4a..24b34bf per `36-RESEARCH.md §Investigation 5`); `getBlockedWithDwell → BlockedExceptionList → drawer via useOrderQuery`.

**Behavioral Spot-Checks table** (copy from `34-VERIFICATION.md:107-119`):
```markdown
### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All gap-closure tests pass | `npx jest --testPathPatterns="(Header|...|BlockedAlertBand|ProductionDrawer)\.test"` | 115/115 passed | ✓ PASS |
| Header has no dead search input | `grep -n "onSearch\|Type here\.\.\." src/components/Header.tsx` | exit 1 (no matches) | ✓ PASS |
| Three components use `shallow: false` | `grep -rn "shallow: false" src/components/{ProductionDashboard,BlockedAlertBand,ProductionDrawer}.tsx` | 3 matches, one per file | ✓ PASS |
```

**Apply to Phase 35** (per `36-RESEARCH.md §Investigation 2 §Required sections` row "Behavioral Spot-Checks"):
- `npm test -- kpis` exits 0
- `grep -n 'production-orders' src/db/queries/kpis.ts` returns 3 cache-tag matches (one per query, per D-14 invariant)
- `grep -n "import 'server-only'" src/db/queries/kpis.ts` line 1 hit
- `npm run build` exits 0 (post BUILD-01 fix) — closes PROD-06
- `grep -rn 'KPICard' src/` returns zero matches (D-08 confirms legacy file deleted)

**Requirements Coverage table** (copy from `34-VERIFICATION.md:121-135`):
```markdown
### Requirements Coverage

| Requirement | Phase | Description | Status | Evidence |
|-------------|-------|-------------|--------|----------|
| PROD-01 | 34 | `/` replaces Coming Soon; force-dynamic RSC | ✓ SATISFIED | `src/app/page.tsx`: `export const dynamic = 'force-dynamic'`; ... |
| PROD-02 | 34 | Three-column layout from DB | ✓ SATISFIED | `ProductionDashboard.tsx` slices by millLine; ... |
```

**Apply to Phase 35** — one row per KPI-01..KPI-08 with concrete `file:symbol` or `file:line` citations:

| Citation source | KPI |
|-----------------|-----|
| `getKpiStrip.completedTodayLbs` in `src/db/queries/kpis.ts` → `KpiStrip` "Completed Today" card | KPI-01 |
| `getKpiStrip.{premixLbs, excelLbs, cgmLbs}` → 3 per-line KpiCards | KPI-02 |
| `computeColumnWeights` `useMemo` in `src/components/ProductionDashboard.tsx:221-233` (**cite D-14 / OQ-2 client-side intentional**) | KPI-03 |
| `getKpiStrip.{pendingCount, pendingLbs}` → "Pending Backlog" KpiCard | KPI-04 |
| `getKpiStrip.{pelletPct, mashPct, crumblePct}` → "Formula Mix" KpiCard with em-dash null-state | KPI-05 |
| `getSevenDayTrend(tz)` → `SevenDayTrendChart`; **explicit retest reference to commits `ba54b4a..4d61194` and final fix at `src/db/queries/kpis.ts:313`** | KPI-06 |
| `getBlockedWithDwell()` → `BlockedExceptionList`; server-sorted by dwell ASC | KPI-07 |
| `isOverdue` server-computed; rendered in `src/components/BlockedExceptionList.tsx:93-100` | KPI-08 |

**Anti-Patterns Found table** (copy from `34-VERIFICATION.md:137-145`):
```markdown
### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ImportFlow.tsx` | 87, 147 | `await previewImportAction` ... without `try/catch` | Blocker (CR-01, does not block phase goal) | Network errors leave `isPending=true` ... |
| `src/components/ProductionDashboard.tsx` | 167 | `eslint-disable-next-line react-hooks/exhaustive-deps` with no justification comment | Warning | Maintenance hazard ... |
```

**Apply to Phase 35:** Inventory carried-forward issues per `36-RESEARCH.md §Investigation 2 §Anti-Patterns Found` — note pre-existing items NOT in Phase 35 scope (Drizzle `IndexedColumn` TS errors in test files; ClerkProvider mock failures in settings page — both predate v2.0). Optionally include the deferred items from Open Question #3: SUMMARY frontmatter backfill (~22 partial entries) + INT-02 (33-HUMAN-UAT.md Test #2) — both explicitly out of scope for Phase 36 per ROADMAP.

**Human Verification section** (copy structure from `34-VERIFICATION.md:147-200`):
- Single-paragraph summary cross-referencing `35-UAT.md` for full detail.
- The retest_outcome bullets in frontmatter carry the per-test result summary; the body section just refers to the UAT artifact.

---

### 4. `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-UAT.md` (document, human UAT record)

**Analog:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md` — same artifact kind, immediately preceding phase, same Preconditions / per-Test format.

**Frontmatter pattern** (copy from `34-HUMAN-UAT.md:1-9`):
```yaml
---
phase: 34-production-dashboard-ui-and-homepage-promotion
type: human-uat
created: 2026-05-14
status: closed
closed_at: 2026-05-14
inherited_from: 33-server-actions-queries-and-bulk-import (GAP-02)
updated: 2026-05-14
---
```

**Adapt for Phase 35** (per `36-RESEARCH.md §Investigation 3 §Required frontmatter`):
- `phase: 35-kpi-sections-and-role-specific-metrics`
- `type: human-uat`
- `created: 2026-05-15`
- `status: <pass | gaps_flagged | gaps_closed>` (initially `gaps_flagged` if any UAT fails; final `closed` if all 10 pass)
- Drop `inherited_from` — Phase 35 has no inherited UAT.
- `updated: 2026-05-15`

**Preconditions section** (copy structure from `34-HUMAN-UAT.md:15-21`):
```markdown
## Preconditions

1. Run `npm run dev` — server must be running at `http://localhost:3000`.
2. Seed data must be present in the Neon dev DB (use Phase 32 seed or Phase 33 harness).
3. A `mill_operator` test user must exist in Clerk Dashboard with `publicMetadata: { roles: ['mill_operator'] }`.
4. Sign in as the `mill_operator` test user before running tests T2–T12.
```

**Adapt for Phase 35** (per `36-RESEARCH.md §Investigation 3 §Preconditions`):
1. `npm run build` exits 0 (after BUILD-01 fix) — **gates the whole UAT pass**.
2. `npm run dev` running at `http://localhost:3000`.
3. Seed DB has 33 orders with `earlyDeliveryDate` populated across `today ±5 days`.
4. Signed in as any authenticated user (KPIs are read-only per D-17).
5. At least one Blocked order with a recent `to_state='Blocked'` event.
6. At least one Completed order today in each of the 3 lines (Premix, Excel, CGM).

**Per-test format** (copy verbatim structure from `34-HUMAN-UAT.md:24-55` — T1/T2 are the canonical templates):
```markdown
### T1. Auth gate on `/` (unauthenticated → /sign-in)

**Steps:**
1. Sign out (or open an incognito window with no active session).
2. Navigate to `http://localhost:3000/`.

**Pass criteria:** Browser redirects to `/sign-in`. No production data is visible before auth.

**Fail criteria:** Page loads or shows any production data without authentication.

**Observed result:** `pass`
```

**Pass/Fail/Severity/Reported pattern for failed-then-resolved tests** (copy from `34-HUMAN-UAT.md:73-80` — the T3 reported-then-retest pattern, applicable to UAT-3 since UAT-3 is the elevated-risk scenario):
```markdown
**Observed result:** `pass`
**Severity:** `n/a (resolved)`
**Reported (initial):** Filter pill works ... Search input did NOT write `?q=…` to the URL ...
**Retest 2026-05-14 (post 34-08):** PASS. Single search input on `/` (dead Header search removed); ...
```

**Apply to Phase 35** — author the 10 UAT scenarios enumerated in `36-RESEARCH.md §Investigation 3 §UAT scenarios`:

| # | Name | Maps to KPI | Why human |
|---|------|-------------|-----------|
| UAT-1 | KPI strip visual rendering (6 cards in spec order) | KPI-01, KPI-02, KPI-04, KPI-05 | Visual composition / spacing |
| UAT-2 | Tz cookie flow + `America/Chicago` fallback | KPI-01, KPI-06 | Browser-API behavior environment-dependent |
| UAT-3 | **7-day trend chart post-SQL-fix retest** (highest-risk; capture server log + chart screenshot) | KPI-06 | Real Postgres GROUP BY semantics — mocked DB cannot exercise the `sql.raw()` fix |
| UAT-4 | Empty-state for 7-day chart (< 7 days of data → "Not enough data yet") | KPI-06 | UI-SPEC empty state visual confirmation |
| UAT-5 | Overdue badge renders when `earlyDeliveryDate < today AND state != 'Completed'` | KPI-08 | Visual / data-correlation check requires the ±5-day seed spread |
| UAT-6 | Formula mix breakdown sums to 100%; em-dash null-state if all uncategorized | KPI-05 | D-12 NULLIF + em-dash null-state visual decision |
| UAT-7 | KPI-03 per-column header strip values match cards below | KPI-03 | Client-side derivation (D-14/OQ-2) |
| UAT-8 | Polling preserves KPI freshness (30s tick re-renders + skeleton flash) | KPI-01..08 | Polling + Suspense interplay |
| UAT-9 | BlockedExceptionList dwell-time sort + row-click drawer open | KPI-07 | Server `ORDER BY MAX(changedAt) ASC` + row navigation |
| UAT-10 | Coexistence: BlockedAlertBand (sticky top) AND BlockedExceptionList (bottom) both render per D-10 | KPI-07, PROD-06 | Visual confirmation neither replaces the other |

**UAT execution discipline note** (per `36-RESEARCH.md §Investigation 3 §UAT execution discipline`): UAT-3 is the **mandatory-pass** gate — capture server log output AND chart screenshot. If UAT-3 fails, surface as a gap in `35-VERIFICATION.md §Gaps Summary` and pause for orchestrator decision (do NOT auto-advance through a failed UAT).

---

### 5. `.planning/phases/35-kpi-sections-and-role-specific-metrics/35-VALIDATION.md` (document, Nyquist validation contract — frontmatter mutation)

**Analog:** `.planning/phases/32-schema-migrations-and-seed-data/32-VALIDATION.md:1-9` — the cleanest `status: complete` frontmatter example (also matched at `33-VALIDATION.md:1-9`). The `34-VALIDATION.md:1-9` variant uses `status: approved` (approval-line variant); both forms are valid in the project.

**Target frontmatter pattern** (copy from `32-VALIDATION.md:1-9`):
```yaml
---
phase: 32
slug: schema-migrations-and-seed-data
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-13
audited: 2026-05-13
---
```

**Current state of `35-VALIDATION.md:1-8`** (read verbatim):
```yaml
---
phase: 35
slug: kpi-sections-and-role-specific-metrics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---
```

**Apply diff** (per `36-RESEARCH.md §Investigation 4 §Target state`):
```diff
 ---
 phase: 35
 slug: kpi-sections-and-role-specific-metrics
-status: draft
-nyquist_compliant: false
-wave_0_complete: false
+status: complete
+nyquist_compliant: true
+wave_0_complete: true
 created: 2026-05-14
+updated: 2026-05-15
 ---
```

**Approval line mutation** — current state at `35-VALIDATION.md:97`:
```
**Approval:** pending
```

**Target form** (copy from `34-VALIDATION.md:113`, simplified to match `32-VALIDATION.md` / `33-VALIDATION.md` brevity):
```
**Approval:** approved 2026-05-15
```

Or, matching the longer `34-VALIDATION.md:113` form if a per-row audit is desired:
```
**Approval:** ✅ approved 2026-05-15 (post Phase 36 verification + UAT; see 35-VERIFICATION.md status: verified + 35-UAT.md status: complete)
```

**Body edits:** Per `36-RESEARCH.md §Investigation 4 §Body-section updates`, prefer minimal edits — only frontmatter and approval line. Optionally update the Wave 0 checklist (currently lines 51-58) to flip the `[ ]` boxes to `[x]` for the test files that actually shipped (`src/db/queries/__tests__/kpis.test.ts`, etc.).

---

## Shared Patterns

### Source-grep regression for structural invariants
**Source:** `src/components/DrawerSkeleton.test.tsx:38-45` (component-local form); `src/__tests__/no-bad-tailwind-literals.test.ts:79-100` (repo-walking form).
**Apply to:** `src/components/BlockedAlertBand.test.tsx` regression test (Test 12).
**Rationale:** `35-LEARNINGS.md` notes the `@/` alias in worktrees resolves to main project root — `path.resolve(__dirname, '<sibling>.tsx')` sidesteps the trap by using a relative path.

```typescript
// DrawerSkeleton.test.tsx:38-45 — canonical
it('Test 7: component is purely presentational (no useState or onClick in source)', () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.resolve(__dirname, 'DrawerSkeleton.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');
  expect(content).not.toMatch(/useState|onClick/);
});
```

### `void setQuery` cast inside `startTransition` for non-shallow nuqs setters
**Source:** `src/components/BlockedExceptionList.tsx:35` (canonical expression form).
**Block-form variants:** `src/components/ProductionDrawer.tsx:133-135`, `src/components/ProductionDashboard.tsx:297-326`.
**Apply to:** `src/components/BlockedAlertBand.tsx:44` (one-line diff).
**Why required:** Non-shallow `useQueryStates` setters return `Promise<URLSearchParams>`; React `startTransition` callback type `() => void | Promise<void>` rejects the leaked `Promise<URLSearchParams>`. The `void` operator coerces the promise to `undefined`.

```typescript
// BlockedExceptionList.tsx:35 — canonical reference
const openDrawer = (id: string) => startTransition(() => void setQuery({ order: id }));
```

### Phase verification artifact frontmatter + section structure
**Source:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-VERIFICATION.md` (full file — sections at lines 1-28 frontmatter, 40-58 Observable Truths, 68-82 Required Artifacts, 84-96 Key Link Verification, 98-105 Data-Flow Trace, 107-119 Behavioral Spot-Checks, 121-135 Requirements Coverage, 137-145 Anti-Patterns, 147-200 Human Verification).
**Apply to:** `35-VERIFICATION.md` — copy section ordering and table headers; replace evidence rows with Phase 35 KPI-* citations.
**Variants:** Drop `overrides_applied` / `override_notes` from frontmatter (Phase 35 has no review-fix cycle).

### Human UAT preconditions + per-test format
**Source:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-HUMAN-UAT.md` (full file — frontmatter at lines 1-9; preconditions at 15-21; per-test format at 26-55).
**Per-test convention:** `**Observed result:** pass` / `fail` notation; `**Severity:**` and `**Reported (initial):**` / `**Retest <date>:**` blocks for tests that needed re-run.
**Apply to:** `35-UAT.md` — adapt preconditions (drop Clerk-test-user step; add the `npm run build` exit-0 precondition) and author 10 UAT scenarios per `36-RESEARCH.md §Investigation 3`.

### Nyquist VALIDATION.md re-classification (`draft` → `complete`)
**Source:** `.planning/phases/32-schema-migrations-and-seed-data/32-VALIDATION.md:1-9` (cleanest `status: complete` frontmatter); `33-VALIDATION.md:1-9` (identical shape).
**Variant:** `.planning/phases/34-production-dashboard-ui-and-homepage-promotion/34-VALIDATION.md:1-9` uses `status: approved` plus an explicit `**Approval:** ✅ approved YYYY-MM-DD (...)` line at the end of the body.
**Apply to:** `35-VALIDATION.md` frontmatter (`status: draft` → `complete`, `nyquist_compliant: false` → `true`, `wave_0_complete: false` → `true`, add `updated: 2026-05-15`) + the `**Approval:** pending` line at the end of the body.

---

## No Analog Found

None. All Phase 36 file changes have direct in-repo analogs.

`.planning/STATE.md` and `.planning/ROADMAP.md` mutations are post-phase mechanical updates handled by the gsd-sdk after Phase 36 closes — no analog needed; the SDK applies the mutation.

---

## Metadata

**Analog search scope:**
- `src/components/` (BUILD-01 fix + regression test analogs)
- `src/__tests__/` (source-grep regression precedent)
- `.planning/phases/32/` (cleanest VALIDATION.md complete state)
- `.planning/phases/33/` (alternate VALIDATION.md complete state)
- `.planning/phases/34/` (VERIFICATION.md + HUMAN-UAT.md structural analogs)

**Files scanned (read in full or in targeted ranges):**
- `src/components/BlockedAlertBand.tsx` (full)
- `src/components/BlockedExceptionList.tsx` (full)
- `src/components/BlockedAlertBand.test.tsx` (full)
- `src/components/DrawerSkeleton.test.tsx` (first 50 lines — Test 7 is the analog)
- `src/__tests__/no-bad-tailwind-literals.test.ts` (full)
- `.planning/phases/34-.../34-VERIFICATION.md` (full)
- `.planning/phases/34-.../34-HUMAN-UAT.md` (first 220 lines)
- `.planning/phases/34-.../34-VALIDATION.md` (full)
- `.planning/phases/35-.../35-VALIDATION.md` (full)
- `.planning/phases/32-.../32-VALIDATION.md` (first 15 lines — frontmatter)
- `.planning/phases/33-.../33-VALIDATION.md` (first 15 lines — frontmatter)
- `.planning/phases/36-.../36-RESEARCH.md` (full)
- `.planning/v2.0-MILESTONE-AUDIT.md` (full)
- `.planning/integration-check-v2.0.md` (full)

**Pattern extraction date:** 2026-05-15
