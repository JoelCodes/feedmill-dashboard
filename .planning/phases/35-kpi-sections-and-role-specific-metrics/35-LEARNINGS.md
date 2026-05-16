---
phase: 35
phase_name: "kpi-sections-and-role-specific-metrics"
project: "CGM Dashboard"
generated: "2026-05-15"
counts:
  decisions: 13
  lessons: 9
  patterns: 11
  surprises: 9
missing_artifacts: []
---

# Phase 35 Learnings: KPI Sections and Role-Specific Metrics

## Decisions

### Option B for seed backfill: runtime computation in seed.ts, not static JSON
The `earlyDeliveryDate` for all 33 seed rows is computed at seed-runtime via `today + ((i % 11) - 5)` days, with `seed-data.json` left untouched.

**Rationale:** Keeps the seed JSON immutable so future schema additions can be backfilled the same way without diff-noise on the source data file. Also lets dev environments always see "today ±5 days" without re-editing JSON.
**Source:** 35-01-PLAN.md, 35-01-SUMMARY.md

---

### PgDateString mode (no `{ mode: 'date' }`) for Drizzle date columns
`date('early_delivery_date')` uses Drizzle's default PgDateString mode, producing `string | null` on the inferred TypeScript type rather than `Date | null`.

**Rationale:** Aligns with `dateToIsoString()`'s existing `string` output and avoids Date↔string conversions in import/insert paths. The string form is also what Postgres returns natively.
**Source:** 35-01-PLAN.md, 35-RESEARCH.md Pattern 6

---

### KPI-03 (per-column counts) computed client-side from unfiltered orders, not a 4th DB query
KPI-03 was deliberately excluded from `kpis.ts` query layer. Column summaries derive in `ProductionDashboard` via `useMemo([orders])` over the already-fetched `orders` prop.

**Rationale:** Avoids a redundant DB query for data already in memory. Aligns with the existing `computeColumnWeights` helper. Per RESEARCH Open Question #2.
**Source:** 35-07-PLAN.md, 35-RESEARCH.md Open Question #2

---

### No new cache tag for Phase 35 — KPIs piggyback on `production-orders` (D-14)
All three KPI queries (`getKpiStrip`, `getSevenDayTrend`, `getBlockedWithDwell`) use `tags: ['production-orders']` — the same tag Phase 33's mutating actions already invalidate.

**Rationale:** Zero action-side wiring required; KPIs invalidate alongside order queries on every mutation. Avoids cross-tag coordination bugs.
**Source:** 35-04-PLAN.md, 35-CONTEXT.md D-14

---

### `Intl.supportedValuesOf('timeZone')` is the IANA allowlist (no regex pre-filter)
`sanitizeIanaTimezone` validates the raw cookie value against the Intl-provided allowlist; anything not in the set falls back to `DEFAULT_TIMEZONE = 'America/Chicago'`.

**Rationale:** The Intl allowlist IS the validation surface. A regex would be redundant at best, wrong at worst (IANA names contain `/`, `_`, digits). Per Pitfall 2 mitigation.
**Source:** 35-04-PLAN.md, 35-RESEARCH.md Pitfall 2

---

### Overdue badge is an inline span, NOT a StatusBadge extension
The KPI-08 "Overdue" badge in BlockedExceptionList renders as a bare `<span role="status">` with `var(--warning)` classes — it does not import StatusBadge.

**Rationale:** Preserves StatusBadge's tight typing to `ProductionState | OrderStatus`. The overdue state is orthogonal to those unions and should not pollute them.
**Source:** 35-06-PLAN.md, 35-UI-SPEC.md

---

### Hand-rolled inline SVG for 7-day trend chart — no chart library (D-13)
`SevenDayTrendChart` is pure React-rendered SVG with deterministic geometry. Zero new dependencies (no recharts/visx/@nivo/d3/chart.js).

**Rationale:** D-13 locked in CONTEXT.md. Acceptance grep on `package.json` confirms zero new chart deps. Visual quality is adequate for 7-bar use case.
**Source:** 35-06-PLAN.md, 35-CONTEXT.md D-13

---

### Two-tier defense for tz cookie: page.tsx fallback + kpis.ts allowlist
`src/app/page.tsx` falls back to `DEFAULT_TIMEZONE` when cookie missing or empty. Every KPI query then re-sanitizes via `sanitizeIanaTimezone()` against the Intl allowlist before SQL composition.

**Rationale:** Defense-in-depth. The page-level fallback catches absent cookies; the query-level allowlist catches tampered/injected values. Either gate alone would be insufficient.
**Source:** 35-07-PLAN.md, 35-04-PLAN.md

---

### Server-side dwell formatting; client renders verbatim
`formatDwell()` (Plan 35-03) is invoked inside `getBlockedWithDwell` server-side; `BlockedExceptionList` receives `dwellFormatted` strings and renders them as-is without importing the helper.

**Rationale:** Eliminates drift between server and client formatters. Single source of formatting truth. Drift guard test in 35-04 enforces server-side output matches the JS helper for 5 representative values.
**Source:** 35-06-PLAN.md, 35-04-PLAN.md

---

### KpiCard is RSC-friendly; KpiStrip is `'use client'`
`KpiCard.tsx` has no directive (no hooks, no events — pure RSC-safe). `KpiStrip.tsx` declares `'use client'` to import lucide-react icons cleanly.

**Rationale:** Pushes the client boundary as far down the tree as possible. KpiCard remains composable in any server tree; the strip-level client boundary contains icon imports without rippling.
**Source:** 35-05-PLAN.md, 35-05-SUMMARY.md

---

### KPI-05 null-state percentages render as em dash "—"
When `pelletPct/mashPct/crumblePct` are all null (D-12 NULLIF case — zero categorized completions today), the Formula Mix card displays `"—"` with no subValue and no footnote.

**Rationale:** UI-SPEC didn't specify this state. Em dash is the standard "no data" treatment elsewhere in the dashboard. Documented as a UI-SPEC clarification, not a deviation.
**Source:** 35-05-SUMMARY.md

---

### Noon-UTC anchor for date-string-only weekday derivation
`weekdayShort(isoDate)` uses `new Date(isoDate + 'T12:00:00Z')` and formats with `timeZone: 'UTC'` to derive the 3-letter weekday.

**Rationale:** Anchoring at noon UTC avoids local-tz off-by-one drift when only a `YYYY-MM-DD` date string is available. Eliminates a class of hydration mismatch between server and client renders.
**Source:** 35-06-PLAN.md, 35-06-SUMMARY.md

---

### Case-sensitive bucketTexture (no `.toUpperCase`/`.trim`)
`bucketTexture()` matches only the exact uppercase canonical DB form. Lowercase/title-case/padded inputs return null.

**Rationale:** D-11 explicitly locks case-sensitive comparison. Pre-processing would silently absorb data-quality issues that should surface as null and feed the "N uncategorized" footnote.
**Source:** 35-03-PLAN.md, 35-CONTEXT.md D-11

---

## Lessons

### Node 24's `Intl.supportedValuesOf('timeZone')` does NOT include `'UTC'`
The plan asserted `sanitizeIanaTimezone('UTC')` would return `'UTC'`. Reality: Node 24's allowlist excludes the literal `'UTC'` string, so the function correctly falls back to `'America/Chicago'`.

**Context:** Discovered during Plan 35-04 Task 1 GREEN. The test had to be inverted to assert fallback behavior. Confirms that the allowlist IS the validation surface — no assumptions about which timezone names are "obviously valid."
**Source:** 35-04-SUMMARY.md

---

### Jest's `@/` path alias resolves to main repo root, not the worktree
When running in a git-worktree-based execution, `jest.config.ts`'s `@/*` → `<rootDir>/src/$1` mapping points at the MAIN project's `src/`, not the worktree's. Worktree-local schema changes are invisible to tests that import schemas via `@/`.

**Context:** Caused Plan 35-02 import-commit tests to fail mysteriously — Zod was silently stripping the new `earlyDeliveryDate` field because the test runtime loaded the older schema. Fix: defensive fallback pattern in `result.push`: `data?.earlyDeliveryDate ?? earlyDeliveryDateIso`.
**Source:** 35-02-SUMMARY.md (Deviation 2)

---

### `tsc --noEmit` passes even when the DB column doesn't actually exist
TypeScript types come from the schema FILE, not the live database. Schema-only changes can falsely green-light verification while the migration is unapplied and runtime SQL fails.

**Context:** Phase 35 Plan 01 introduced a BLOCKING checkpoint specifically to apply the migration to the live Neon DB after the schema change. TypeScript-only verification was explicitly insufficient.
**Source:** 35-01-PLAN.md (BLOCKING migrate gate)

---

### jest.mock factories hoist before variable declarations
Pattern `const capturedCacheArgs = []; jest.mock('next/cache', () => ({ ... capturedCacheArgs.push(...) ...}))` fails because the mock factory runs before the `const` is initialized.

**Context:** Plan 35-04 had to replace runtime mock capture with source-file grep assertions for cache key/tag invariants. Structural invariants (read from source) are equally reliable when the contract is "shape of the call site" rather than "runtime call history."
**Source:** 35-04-SUMMARY.md (Deviation 2)

---

### macOS case-insensitive filesystem treats `KPICard.tsx` and `KpiCard.tsx` as the same file
When the new `KpiCard.tsx` was created before `KPICard.tsx` was deleted, the filesystem collapsed them and tests resolved the wrong module — 6 of 7 KpiCard tests failed mysteriously.

**Context:** Plan 35-05 Task 1 had to delete `KPICard.tsx` between RED and GREEN, not after. Sequencing the delete before the new file's creation/test is the correct order on macOS.
**Source:** 35-05-SUMMARY.md (TDD Gate table)

---

### `JSX.Element` namespace is not globally available with our jsx transform
Explicit return types like `function X(): JSX.Element { ... }` fail with `TS2503: Cannot find namespace 'JSX'` under the project's `isolatedModules` + jsx transform setup unless React is explicitly imported.

**Context:** Plans 35-06 and 35-07 had to remove explicit return type annotations. TypeScript infers the JSX return type correctly without them — the annotation is purely decorative.
**Source:** 35-06-SUMMARY.md (Deviation 1)

---

### `startTransition` requires `void` cast for nuqs setQuery's Promise return
`setQuery({ order: id })` returns `Promise<URLSearchParams>` but `startTransition` accepts only `() => void`. Direct usage fails with `TS2322: Type 'Promise<URLSearchParams>' is not assignable to type 'VoidOrUndefinedOnly'`.

**Context:** Fixed via `startTransition(() => void setQuery({ order: id }))`. Same issue exists in `BlockedAlertBand.tsx` (pre-existing from Phase 34) but was scoped out of Plan 35-06.
**Source:** 35-06-SUMMARY.md (Deviation 2)

---

### Plan-specified grep counts can be misleading when defensive code is required
Plan 35-02 specified `grep -c "earlyDeliveryDate" src/actions/import.ts` → 3, but actual was 7 because the worktree/jest `@/` alias issue required defensive fallback patterns and a `PreviewRow` type extension.

**Context:** When acceptance grep counts diverge from plan, surface as a deviation with breakdown of each occurrence's justification. Don't suppress occurrences to hit the literal count.
**Source:** 35-02-SUMMARY.md (Grep Count Variance section)

---

### Drizzle index config type inference breaks on `Partial<SQL>` iterators
`db/schema/__tests__/events.test.ts(55)` and `orders.test.ts(87,94,99)` have pre-existing TypeScript errors around `IndexedColumn` type compatibility — these surfaced as noise during Phase 35 but were carried forward as out-of-scope.

**Context:** Phase 35 explicitly scoped out these errors. Future Drizzle upgrades may resolve or worsen them; document as accepted noise rather than partial fix.
**Source:** 35-01-SUMMARY.md, 35-07-SUMMARY.md (Pre-existing Issues)

---

## Patterns

### `unstable_cache` with shared tag for cross-query invalidation
Every Phase 35 KPI query uses `unstable_cache(fn, ['unique-key'], { tags: ['production-orders'] })`. The cache KEY is unique per query; the cache TAG matches `getProductionOrders` so mutating actions invalidate the entire cluster atomically.

**When to use:** Any read-heavy derived query that should refresh whenever its underlying table mutates. Pair with `revalidateTag` calls in mutating server actions.
**Source:** 35-04-PLAN.md, 35-RESEARCH.md Pattern 5

---

### SQL/JS dual-implementation agreement test
KPI-05's texture bucketing exists in TWO places: a SQL `CASE` in `kpis.ts` AND a JS helper `bucketTexture()` in `formula-mix.ts`. A unit test enumerates all known + unknown inputs and asserts both produce identical bucket assignments.

**When to use:** Anywhere SQL and JS implement the same logic. Especially when one cannot delegate to the other (server-only-imports rule prevents kpis.ts from calling bucketTexture during the query).
**Source:** 35-04-PLAN.md (Test 13)

---

### Server-pre-formatted strings + dumb client components
Server queries return both raw values AND pre-formatted display strings (e.g., `dwellSeconds: 8040, dwellFormatted: "2h 14m"`). Client components render `dwellFormatted` verbatim without importing the formatter.

**When to use:** Whenever the formatting helper is unsafe to bundle to the client OR when drift between server and client formatters would be a bug. Server-side formatting is the single source of truth.
**Source:** 35-04-PLAN.md, 35-06-PLAN.md

---

### `useMemo([orders])` as documentation of unfiltered dependency
`columnSummaries = useMemo(() => ..., [orders])` — even though the reduce is cheap, the dependency array explicitly documents "this depends on unfiltered orders, NOT filtered." Pitfall 6 mitigation.

**When to use:** Anywhere a derivation must ignore an adjacent filtered/transformed version of the same data. The dep array serves as enforceable documentation against future regressions.
**Source:** 35-07-PLAN.md (Task 2)

---

### Per-zone Suspense boundaries with skeleton fallbacks
`<Suspense fallback={<KpiStripSkeleton />}><KpiStrip ... /></Suspense>` per major zone, with matching skeleton components sharing the live component's layout dimensions.

**When to use:** Async-data zones inside RSC pages where individual streaming is preferable to whole-page blocking. Each Suspense boundary becomes a streamable unit.
**Source:** 35-07-PLAN.md, 35-CONTEXT.md D-16

---

### Deterministic SVG geometry (no `Math.random`, single max computation)
`SevenDayTrendChart` computes `maxLbs` once outside the map. Bar heights, opacities, and labels are pure functions of input data. Render-twice equality is asserted in a unit test.

**When to use:** Any server-rendered SVG that participates in React hydration. Non-determinism breaks hydration. The render-twice test is a cheap canary.
**Source:** 35-06-PLAN.md (Test 9)

---

### Proxy-based chainable mock builder for Drizzle query tests
Instead of manually mocking `.select().from().where().groupBy()...` chains, a Proxy wraps each call and returns either another Proxy (for chaining) or a configurable promise (for terminal calls).

**When to use:** Drizzle query tests where the chain depth varies. Reduces mock setup boilerplate compared to per-test individual mock chain functions.
**Source:** 35-04-SUMMARY.md

---

### Two-tier defense for cookie-sourced values: encode at write + allowlist at read
`TzBootstrap` uses `encodeURIComponent()` on the cookie value AT WRITE; `sanitizeIanaTimezone` validates against `Intl.supportedValuesOf` AT READ. Either tier alone could be bypassed; the combination is non-trivial to defeat.

**When to use:** Any operator-controlled value that crosses into SQL composition or other interpretive contexts. Default to encode-on-write + allowlist-on-read.
**Source:** 35-05-PLAN.md, 35-04-PLAN.md

---

### `checkpoint:human-action` for migration apply + `checkpoint:human-verify` for visual UAT
Plan 35-01 used `checkpoint:human-action` because `drizzle-kit migrate` requires env vars. Plan 35-07 used `checkpoint:human-verify` because visual layout / DST / mobile viewport need human eyes.

**When to use:** human-action when the executor lacks credentials or the action mutates external state; human-verify when the deliverable's success criterion can't economically be automated.
**Source:** 35-01-PLAN.md (Task 2), 35-07-PLAN.md (Task 4)

---

### TDD RED → GREEN with module-not-found as the first RED signal
For new pure helpers, the test file imports from a not-yet-created module path. The initial `Cannot find module` error counts as RED. GREEN is achieved by creating the module + implementing.

**When to use:** New file creation TDD cycles. Avoids the "write empty stub, then write tests" anti-pattern. The missing-module error is unambiguous evidence the test ran and failed.
**Source:** 35-03-SUMMARY.md, 35-04-SUMMARY.md

---

### `import 'server-only'` on line 1 of server-only modules
`src/db/queries/kpis.ts` line 1 is `import 'server-only';`. Any accidental client-side import surfaces as a build-time error rather than a runtime leak.

**When to use:** Modules that touch the DB, secrets, or other server-exclusive resources. The directive is preferable to lint rules because it's enforced by the build, not by tooling that contributors might disable.
**Source:** 35-04-PLAN.md, 35-RESEARCH.md

---

## Surprises

### `'UTC'` is NOT in Node 24's `Intl.supportedValuesOf('timeZone')`
The plan and the human intuition both expected `'UTC'` to be a valid IANA timezone. It isn't, per the Node 24 ICU dataset.

**Impact:** Plan 35-04 Test 4 had to be inverted to assert fallback to `'America/Chicago'`. Confirms the principle that allowlist contents are not "obvious" and should not be assumed.
**Source:** 35-04-SUMMARY.md (Deviation 1)

---

### `ProductionCard.test.tsx` needed `earlyDeliveryDate: null` despite not being in the plan
Plan 35-01 listed 6 `makeOrder` fixture files. TypeScript surfaced a 7th file using a direct `ProductionOrder` object literal (not a factory) — `ProductionCard.test.tsx`.

**Impact:** Added to the propagation scope under Rule 2 auto-fix. Reminder that `$inferSelect` type changes cascade beyond grepping for `makeOrder` — any object literal typed as `ProductionOrder` is also affected.
**Source:** 35-01-SUMMARY.md (Deviation 1)

---

### `PreviewRow` type extension was required in import.ts but not in the plan
Plan 35-02 specified 3 patch sites in `import.ts`. Reality required 7 occurrences: the `PreviewRow` type itself needed `earlyDeliveryDate?: string | null`, plus a fallback pattern in `result.push` due to the jest `@/` alias issue.

**Impact:** Grep count variance from 3 to 7 — surfaced as a documented deviation. Plans should account for type-flow intermediate steps (PreviewRow → INSERT/UPDATE), not just the persistence endpoints.
**Source:** 35-02-SUMMARY.md (Deviation 1)

---

### jest `@/` alias resolves to main project root, not the worktree
Tests inside a git worktree imported `@/actions/import-schema` from the MAIN project's `src/` — not the worktree's. Zod silently stripped the new field, causing tests to fail with `null` instead of the expected ISO string.

**Impact:** Required defensive coding (`data?.earlyDeliveryDate ?? earlyDeliveryDateIso`) so the value flows through regardless of which schema version the test runtime loaded. Worktree-aware test setups would prevent this class of bug.
**Source:** 35-02-SUMMARY.md (Deviation 2)

---

### macOS case-insensitive FS conflated `KPICard.tsx` and `KpiCard.tsx`
The new `KpiCard.tsx` couldn't coexist with the legacy `KPICard.tsx` on macOS — module resolution picked one based on factors that weren't reproducible across machines.

**Impact:** Required reordering the plan: DELETE legacy file BETWEEN RED and GREEN, not after. Future renames involving only case changes should anticipate this constraint on Darwin filesystems.
**Source:** 35-05-SUMMARY.md (Task 1 TDD table)

---

### `JSX.Element` namespace not exposed without explicit React import
Several new files initially used `function X(): JSX.Element { ... }` return type annotations and failed `tsc --noEmit` with `TS2503: Cannot find namespace 'JSX'`.

**Impact:** Fix was removing the annotation entirely — TypeScript infers the return type correctly. The annotation was purely decorative and added more friction than value.
**Source:** 35-06-SUMMARY.md (Deviation 1)

---

### nuqs `setQuery` returns a Promise — incompatible with `startTransition`
`setQuery({ order: id })` returns `Promise<URLSearchParams>` but React's `startTransition` accepts `() => void`. TypeScript's `VoidOrUndefinedOnly` constraint surfaces this.

**Impact:** Required `void setQuery(...)` cast inside `startTransition`. Same issue exists in pre-existing Phase 34 code (BlockedAlertBand) but was scoped out. Pattern is repeatable: any future component using nuqs + startTransition will need the same cast.
**Source:** 35-06-SUMMARY.md (Deviation 2)

---

### `getSevenDayTrend` required multiple SQL/Drizzle alignment fix commits at end of phase
After Plan 35-07 GREEN, the recent commit log shows 5 sequential fix commits on `getSevenDayTrend` GROUP BY semantics: invalid `GROUP BY 1` on pure aggregates, GROUP BY expression mismatch with SELECT cast chain, qualified column ref issues, and ultimately inlining the sanitized tz as a SQL literal.

**Impact:** Drizzle's `sql` template + GROUP BY interaction is subtler than the plan accounted for. Aggregate-only queries (no group-by columns) need special handling; tagged-template tz substitution at runtime differed from what worked with literal interpolation. Surfaced only post-integration, not in unit tests.
**Source:** Git log (commits 4d61194..ba54b4a), 35-07-SUMMARY.md

---

### `DashboardLayout.test.tsx` needed KPI mocks despite not being in plan scope
Adding `kpiStrip/kpiTrend/kpiBlocked` to `ProductionDashboard` Props broke `DashboardLayout.test.tsx` which renders ProductionDashboard at two sites without those props.

**Impact:** Auto-fix under Rule 1; the broader lesson is that "required prop additions" cascade to every test file that renders the component — not just the direct test file. Grep for component usage in tests before extending Props.
**Source:** 35-07-SUMMARY.md (Deviation 1)
